import 'server-only'

import { ensureCmsSchema } from './cms-db'
import type { CmsUser } from './cms-auth'
import {
  listAllAccounts,
  listAllLocations,
  listAllReviews,
  postReviewReply,
  starRatingToNumber,
  toV4LocationPath,
  type GoogleReview,
} from './google-business'
import { draftReviewReply } from './ai-reply'

export type StoredReview = {
  id: number
  google_review_id: string
  account_name: string
  location_name: string
  branch_name: string
  reviewer_name: string
  reviewer_photo_url: string
  rating: number
  comment: string
  review_created_at: string
  review_updated_at: string
  reply_status: 'NONE' | 'SUGGESTED' | 'AUTO_REPLIED' | 'SENT'
  ai_draft: string
  reply_text: string
  reply_posted_at: string | null
  replied_by_name: string
  featured_on_homepage: number
}

export type SyncSummary = {
  locationsScanned: number
  locationsTotal: number
  reviewsSeen: number
  newReviews: number
  autoReplied: number
  suggested: number
  pendingDrafts: number
  /** False when the run hit its time budget and must be called again to continue. */
  done: boolean
  errors: string[]
}

// Vercel caps this function at 60s (maxDuration). Stop well short so there is
// room to persist progress and return a response.
const SYNC_BUDGET_MS = 45_000

async function upsertReview(db: Awaited<ReturnType<typeof ensureCmsSchema>>, params: {
  review: GoogleReview
  accountName: string
  locationName: string
  branchName: string
}) {
  const { review, accountName, locationName, branchName } = params
  const rating = starRatingToNumber[review.starRating] || 0
  const existing = await db.execute({
    sql: 'SELECT id, reply_status FROM google_reviews WHERE google_review_id = ? LIMIT 1',
    args: [review.reviewId],
  })
  const existingRow = existing.rows[0] as Record<string, unknown> | undefined

  if (existingRow) {
    // Keep existing reply workflow state untouched; just refresh review content
    // in case the reviewer edited their text, and record Google's own reply
    // if one already exists there (e.g. someone replied directly in Google).
    await db.execute({
      sql: `UPDATE google_reviews SET
        reviewer_name = ?, reviewer_photo_url = ?, rating = ?, comment = ?,
        review_updated_at = ?, fetched_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?`,
      args: [
        review.reviewer?.displayName || 'A Google user',
        review.reviewer?.profilePhotoUrl || '',
        rating,
        review.comment || '',
        review.updateTime,
        Number(existingRow.id),
      ],
    })
    return {
      id: Number(existingRow.id),
      isNew: false,
      rating,
      replyStatus: String(existingRow.reply_status || 'NONE'),
    }
  }

  const result = await db.execute({
    sql: `INSERT INTO google_reviews (
      google_review_id, account_name, location_name, branch_name,
      reviewer_name, reviewer_photo_url, rating, comment,
      review_created_at, review_updated_at, reply_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NONE')`,
    args: [
      review.reviewId, accountName, locationName, branchName,
      review.reviewer?.displayName || 'A Google user',
      review.reviewer?.profilePhotoUrl || '',
      rating, review.comment || '',
      review.createTime, review.updateTime,
    ],
  })
  return { id: Number(result.lastInsertRowid), isNew: true, rating, replyStatus: 'NONE' }
}

type SyncDb = Awaited<ReturnType<typeof ensureCmsSchema>>

async function readLocationCursor(db: SyncDb) {
  const result = await db.execute('SELECT location_cursor FROM google_sync_progress WHERE id = 1 LIMIT 1')
  const row = result.rows[0] as Record<string, unknown> | undefined
  return row ? String(row.location_cursor || '') : ''
}

async function writeLocationCursor(db: SyncDb, cursor: string) {
  await db.execute({
    sql: `INSERT INTO google_sync_progress (id, location_cursor) VALUES (1, ?)
      ON CONFLICT(id) DO UPDATE SET location_cursor = excluded.location_cursor, updated_at = datetime('now')`,
    args: [cursor],
  })
}

/**
 * Pulls reviews for every location on every connected account, then drafts and
 * (for 5-star) posts replies.
 *
 * The work does not fit in one function invocation — the account has ~41
 * locations and each AI draft costs seconds — so this is split into a fast
 * scan pass and a slow drafting pass, both bounded by SYNC_BUDGET_MS and both
 * resumable. Scanning records a location cursor so the next call continues
 * from the branch after the last completed one instead of restarting at the
 * first; drafting simply picks up whatever is still NONE. Callers should keep
 * invoking until `done` is true.
 */
export async function syncGoogleReviews(): Promise<SyncSummary> {
  const db = await ensureCmsSchema()
  const deadline = Date.now() + SYNC_BUDGET_MS
  const summary: SyncSummary = {
    locationsScanned: 0, locationsTotal: 0, reviewsSeen: 0, newReviews: 0,
    autoReplied: 0, suggested: 0, pendingDrafts: 0, done: false, errors: [],
  }

  const targets: Array<{ accountName: string; locationName: string; branchName: string }> = []
  for (const account of await listAllAccounts()) {
    try {
      for (const location of await listAllLocations(account.name)) {
        targets.push({
          accountName: account.name,
          locationName: location.name,
          branchName: location.title || location.name,
        })
      }
    } catch (error) {
      summary.errors.push(`Locations for ${account.accountName || account.name}: ${error instanceof Error ? error.message : 'failed'}`)
    }
  }
  summary.locationsTotal = targets.length

  const cursor = await readLocationCursor(db)
  const resumeAt = cursor ? targets.findIndex((target) => target.locationName === cursor) + 1 : 0
  let index = Math.max(0, resumeAt)

  for (; index < targets.length; index++) {
    if (Date.now() > deadline) break
    const target = targets[index]
    try {
      const reviews = await listAllReviews(toV4LocationPath(target.accountName, target.locationName))
      summary.locationsScanned += 1
      for (const review of reviews) {
        summary.reviewsSeen += 1
        const { isNew } = await upsertReview(db, { review, ...target })
        if (isNew) summary.newReviews += 1
      }
    } catch (error) {
      summary.errors.push(`Reviews for ${target.branchName}: ${error instanceof Error ? error.message : 'failed'}`)
    }
    await writeLocationCursor(db, target.locationName)
  }

  const scanComplete = index >= targets.length
  if (scanComplete) await writeLocationCursor(db, '')

  // Drafting is the expensive half, so it runs on whatever time is left and
  // leaves anything it cannot reach at NONE for the next invocation.
  while (Date.now() < deadline) {
    const next = await db.execute(`SELECT id, google_review_id, account_name, location_name, branch_name,
      reviewer_name, rating, comment
      FROM google_reviews WHERE reply_status = 'NONE'
      ORDER BY review_created_at DESC LIMIT 1`)
    const row = next.rows[0] as Record<string, unknown> | undefined
    if (!row) break

    const rating = Number(row.rating)
    const rowId = Number(row.id)
    const draft = await draftReviewReply({
      branchName: String(row.branch_name || ''),
      reviewerName: String(row.reviewer_name || ''),
      rating,
      comment: String(row.comment || ''),
    })

    if (rating === 5) {
      try {
        await postReviewReply(
          toV4LocationPath(String(row.account_name), String(row.location_name)),
          String(row.google_review_id),
          draft,
        )
        await db.execute({
          sql: `UPDATE google_reviews SET
            reply_status = 'AUTO_REPLIED', ai_draft = ?, reply_text = ?,
            reply_posted_at = datetime('now'), replied_by_name = 'AI auto-reply',
            updated_at = datetime('now')
            WHERE id = ?`,
          args: [draft, draft, rowId],
        })
        summary.autoReplied += 1
        continue
      } catch (error) {
        summary.errors.push(`Auto-reply failed for ${row.branch_name}: ${error instanceof Error ? error.message : 'failed'}`)
      }
    }

    await db.execute({
      sql: `UPDATE google_reviews SET reply_status = 'SUGGESTED', ai_draft = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [draft, rowId],
    })
    summary.suggested += 1
  }

  const pending = await db.execute("SELECT COUNT(*) AS total FROM google_reviews WHERE reply_status = 'NONE'")
  summary.pendingDrafts = Number((pending.rows[0] as Record<string, unknown>)?.total || 0)
  summary.done = scanComplete && summary.pendingDrafts === 0
  return summary
}

export async function sendReviewReply(reviewRowId: number, finalText: string, user: CmsUser) {
  const db = await ensureCmsSchema()
  const result = await db.execute({
    sql: 'SELECT * FROM google_reviews WHERE id = ? LIMIT 1',
    args: [reviewRowId],
  })
  const row = result.rows[0] as Record<string, unknown> | undefined
  if (!row) throw new Error('Review not found')

  const v4Path = toV4LocationPath(String(row.account_name), String(row.location_name))
  await postReviewReply(v4Path, String(row.google_review_id), finalText)

  await db.execute({
    sql: `UPDATE google_reviews SET
      reply_status = 'SENT', reply_text = ?, reply_posted_at = datetime('now'),
      replied_by_user_id = ?, replied_by_name = ?, updated_at = datetime('now')
      WHERE id = ?`,
    args: [finalText, user.id, user.name, reviewRowId],
  })
}

export async function listGoogleReviews(filter: { replyStatus?: string; rating?: number } = {}) {
  const db = await ensureCmsSchema()
  const conditions: string[] = []
  const args: Array<string | number> = []
  if (filter.replyStatus) {
    conditions.push('reply_status = ?')
    args.push(filter.replyStatus)
  }
  if (filter.rating) {
    conditions.push('rating = ?')
    args.push(filter.rating)
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await db.execute({
    sql: `SELECT * FROM google_reviews ${where} ORDER BY review_created_at DESC LIMIT 200`,
    args,
  })
  return result.rows as unknown as StoredReview[]
}

export async function setReviewFeatured(reviewRowId: number, featured: boolean) {
  const db = await ensureCmsSchema()
  await db.execute({
    sql: `UPDATE google_reviews SET featured_on_homepage = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [featured ? 1 : 0, reviewRowId],
  })
}

export async function listFiveStarReviewsForHomepage(limit = 9) {
  try {
    const db = await ensureCmsSchema()
    const result = await db.execute({
      sql: `SELECT reviewer_name, reviewer_photo_url, comment, branch_name, review_created_at
        FROM google_reviews
        WHERE rating = 5 AND featured_on_homepage = 1 AND comment <> ''
        ORDER BY review_created_at DESC
        LIMIT ?`,
      args: [limit],
    })
    return result.rows as unknown as Array<{
      reviewer_name: string
      reviewer_photo_url: string
      comment: string
      branch_name: string
      review_created_at: string
    }>
  } catch {
    // CMS not configured, or table not ready yet — homepage should degrade
    // gracefully rather than break.
    return []
  }
}
