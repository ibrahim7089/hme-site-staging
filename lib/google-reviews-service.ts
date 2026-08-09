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
import { classifyComplaint, draftReviewReply } from './ai-reply'
import { sendReviewAlert, type ReviewAlertReview } from './review-alerts'

export type StoredReview = {
  id: number
  backlog: number
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
// Drafts run a few at a time: enough to get through a 5k-review backlog at a
// reasonable pace, but far below Google's 300-updates-per-minute ceiling.
const DRAFT_CONCURRENCY = 4
// Star-only reviews skip the model and post almost instantly, so without a cap
// one invocation could otherwise burn through the per-minute write quota.
const MAX_POSTS_PER_RUN = 120
// Gemini's free tier allows 20 generate_content calls per minute. A run lasts
// ~45s, and a sub-5-star review costs two calls (reply + complaint theme), so
// this stays under the ceiling instead of collecting 429s. Reviews with no
// written comment never reach the model and are not counted here.
const MAX_MODEL_CALLS_PER_RUN = 14

async function upsertReview(db: Awaited<ReturnType<typeof ensureCmsSchema>>, params: {
  review: GoogleReview
  accountName: string
  locationName: string
  branchName: string
  autoReplyCutoff: string
}) {
  const { review, accountName, locationName, branchName, autoReplyCutoff } = params
  const rating = starRatingToNumber[review.starRating] || 0
  // Reviews predating the connection are historical: they are stored so the
  // reporting covers the full history, but never drafted or auto-answered.
  // Mass-replying to years of old reviews would be spam, not service.
  const isBacklog = Boolean(autoReplyCutoff && review.createTime < autoReplyCutoff)
  const existing = await db.execute({
    sql: 'SELECT id, reply_status FROM google_reviews WHERE google_review_id = ? LIMIT 1',
    args: [review.reviewId],
  })
  const existingRow = existing.rows[0] as Record<string, unknown> | undefined

  // A reply already on Google — written by staff in the Google interface, or
  // by an earlier run — is authoritative. Posting uses PUT, which replaces
  // whatever is there, so these must be recorded as already answered and left
  // alone; drafting over them would silently destroy a real person's reply.
  const googleReply = review.reviewReply?.comment?.trim() || ''

  if (existingRow) {
    const currentStatus = String(existingRow.reply_status || 'NONE')
    const adoptGoogleReply = googleReply && (currentStatus === 'NONE' || currentStatus === 'SUGGESTED')
    await db.execute({
      sql: `UPDATE google_reviews SET
        reviewer_name = ?, reviewer_photo_url = ?, rating = ?, comment = ?,
        review_updated_at = ?, fetched_at = datetime('now'), updated_at = datetime('now')
        ${adoptGoogleReply ? `, reply_status = 'SENT', reply_text = ?, reply_posted_at = ?, replied_by_name = 'Replied on Google'` : ''}
        WHERE id = ?`,
      args: [
        review.reviewer?.displayName || 'A Google user',
        review.reviewer?.profilePhotoUrl || '',
        rating,
        review.comment || '',
        review.updateTime,
        ...(adoptGoogleReply ? [googleReply, review.reviewReply?.updateTime || ''] : []),
        Number(existingRow.id),
      ],
    })
    return {
      id: Number(existingRow.id),
      isNew: false,
      rating,
      replyStatus: adoptGoogleReply ? 'SENT' : currentStatus,
    }
  }

  const result = await db.execute({
    sql: `INSERT INTO google_reviews (
      google_review_id, account_name, location_name, branch_name,
      reviewer_name, reviewer_photo_url, rating, comment,
      review_created_at, review_updated_at, reply_status,
      reply_text, reply_posted_at, replied_by_name, backlog
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      review.reviewId, accountName, locationName, branchName,
      review.reviewer?.displayName || 'A Google user',
      review.reviewer?.profilePhotoUrl || '',
      rating, review.comment || '',
      review.createTime, review.updateTime,
      googleReply ? 'SENT' : 'NONE',
      googleReply,
      googleReply ? (review.reviewReply?.updateTime || null) : null,
      googleReply ? 'Replied on Google' : '',
      isBacklog ? 1 : 0,
    ],
  })
  return {
    id: Number(result.lastInsertRowid),
    isNew: true,
    rating,
    replyStatus: googleReply ? 'SENT' : 'NONE',
  }
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

  // Only reviews left after the account was connected are answered. Everything
  // older is kept for reporting but never replied to.
  const connected = await db.execute('SELECT connected_at FROM google_oauth_tokens WHERE id = 1 LIMIT 1')
  const connectedAt = String((connected.rows[0] as Record<string, unknown>)?.connected_at || '')
  const autoReplyCutoff = connectedAt ? `${connectedAt.replace(' ', 'T')}Z` : ''

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
        const { isNew } = await upsertReview(db, { review, ...target, autoReplyCutoff })
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
  // leaves anything it cannot reach at NONE for the next invocation. Reviews
  // are taken in small parallel batches because there are thousands to work
  // through and each model call costs seconds; `backlog ASC` keeps newly
  // arrived reviews ahead of the historical ones.
  let postsThisRun = 0
  let modelCallsThisRun = 0
  let deferred = 0
  const alerts: ReviewAlertReview[] = []
  // Star-only reviews cost no model calls, so they keep flowing after the
  // model budget is spent; anything needing text is left for the next run.
  const skipIds: number[] = []
  while (Date.now() < deadline && postsThisRun < MAX_POSTS_PER_RUN) {
    const exclusion = skipIds.length ? `AND id NOT IN (${skipIds.join(',')})` : ''
    // Once the model budget is spent, only star-only reviews are eligible —
    // they are answered from the template by design and cost no model calls.
    const budgetSpent = modelCallsThisRun >= MAX_MODEL_CALLS_PER_RUN
    const textFilter = budgetSpent ? "AND trim(comment) = ''" : ''
    const batch = await db.execute({
      sql: `SELECT id, google_review_id, account_name, location_name, branch_name,
        reviewer_name, rating, comment, backlog
        FROM google_reviews WHERE reply_status = 'NONE' ${exclusion} ${textFilter}
        ORDER BY backlog ASC, review_created_at DESC LIMIT ?`,
      args: [DRAFT_CONCURRENCY],
    })
    if (batch.rows.length === 0) break

    for (const raw of batch.rows) {
      const row = raw as unknown as Record<string, unknown>
      if (String(row.comment || '').trim()) {
        // reply draft, plus a complaint classification for sub-5-star reviews
        modelCallsThisRun += Number(row.rating) < 5 ? 2 : 1
      }
    }

    const outcomes = await Promise.all(batch.rows.map(async (raw) => {
      const row = raw as unknown as Record<string, unknown>
      const rating = Number(row.rating)
      const rowId = Number(row.id)
      const forReply = {
        branchName: String(row.branch_name || ''),
        reviewerName: String(row.reviewer_name || ''),
        rating,
        comment: String(row.comment || ''),
      }
      // Only sub-5-star reviews carry a complaint worth categorising, and the
      // classification rides along with the draft so there is no separate pass.
      const [draft, theme] = await Promise.all([
        draftReviewReply(forReply),
        rating < 5 ? classifyComplaint(forReply) : Promise.resolve(''),
      ])
      // The model was unavailable (almost always the per-minute cap). Leave the
      // review untouched so a later run can write it a proper reply, rather
      // than posting a generic template to someone who wrote real feedback.
      if (draft === null) return 'deferred' as const
      if (theme) {
        await db.execute({
          sql: 'UPDATE google_reviews SET complaint_theme = ? WHERE id = ?',
          args: [theme, rowId],
        })
      }

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
          return 'auto' as const
        } catch (error) {
          summary.errors.push(`Auto-reply failed for ${row.branch_name}: ${error instanceof Error ? error.message : 'failed'}`)
        }
      }

      await db.execute({
        sql: `UPDATE google_reviews SET reply_status = 'SUGGESTED', ai_draft = ?, updated_at = datetime('now') WHERE id = ?`,
        args: [draft, rowId],
      })
      return 'suggested' as const
    }))

    for (const [position, outcome] of outcomes.entries()) {
      const row = batch.rows[position] as unknown as Record<string, unknown>
      if (outcome === 'auto') summary.autoReplied += 1
      else if (outcome === 'suggested') summary.suggested += 1
      else {
        // Left untouched for a later run — don't pick it up again this run.
        deferred += 1
        skipIds.push(Number(row.id))
        continue
      }
      if (Number(row.backlog) !== 1) {
        alerts.push({
          branchName: String(row.branch_name || ''),
          reviewerName: String(row.reviewer_name || ''),
          rating: Number(row.rating),
          comment: String(row.comment || ''),
          autoReplied: outcome === 'auto',
        })
      }
    }
    postsThisRun += outcomes.length
  }

  if (deferred > 0) {
    summary.errors.push(`${deferred} repl${deferred === 1 ? 'y' : 'ies'} deferred — the AI limit was reached. Run the sync again shortly to finish them.`)
  }

  // Alert on genuinely new arrivals only. The historical backlog is not news,
  // and mailing thousands of old reviews would bury the ones that matter.
  if (alerts.length > 0) await sendReviewAlert(alerts)

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

export type ReviewReports = {
  totals: { reviews: number; branches: number; averageRating: number; unanswered: number; positive: number; negative: number }
  periods: Array<{ label: string; reviews: number; averageRating: number }>
  branches: Array<{ branchName: string; reviews: number; averageRating: number; positive: number; negative: number; unanswered: number }>
  themes: Array<{ theme: string; count: number }>
}

const UNANSWERED = "reply_status IN ('NONE','SUGGESTED')"

// review_created_at holds an ISO-8601 timestamp, which sorts and prefixes
// correctly as text, so periods are matched on the leading date substring
// rather than SQLite's date functions (which would need the 'T'/'Z' stripped).
const PERIODS: Array<{ label: string; predicate: string }> = [
  { label: 'Last 7 days', predicate: "substr(review_created_at,1,10) >= date('now','-7 days')" },
  { label: 'This month', predicate: "substr(review_created_at,1,7) = strftime('%Y-%m','now')" },
  { label: 'Last month', predicate: "substr(review_created_at,1,7) = strftime('%Y-%m','now','-1 month')" },
  { label: 'This year', predicate: "substr(review_created_at,1,4) = strftime('%Y','now')" },
  { label: 'Last year', predicate: "substr(review_created_at,1,4) = strftime('%Y','now','-1 year')" },
]

export async function getReviewReports(): Promise<ReviewReports> {
  const db = await ensureCmsSchema()

  const totalsRow = (await db.execute(`SELECT
    COUNT(*) AS reviews,
    COUNT(DISTINCT branch_name) AS branches,
    AVG(rating) AS average_rating,
    SUM(CASE WHEN ${UNANSWERED} THEN 1 ELSE 0 END) AS unanswered,
    SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) AS positive,
    SUM(CASE WHEN rating <= 3 THEN 1 ELSE 0 END) AS negative
    FROM google_reviews`)).rows[0] as Record<string, unknown> | undefined

  const periods = []
  for (const period of PERIODS) {
    const row = (await db.execute(
      `SELECT COUNT(*) AS reviews, AVG(rating) AS average_rating FROM google_reviews WHERE ${period.predicate}`,
    )).rows[0] as Record<string, unknown> | undefined
    periods.push({
      label: period.label,
      reviews: Number(row?.reviews || 0),
      averageRating: Number(row?.average_rating || 0),
    })
  }

  const branchRows = (await db.execute(`SELECT branch_name,
    COUNT(*) AS reviews,
    AVG(rating) AS average_rating,
    SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) AS positive,
    SUM(CASE WHEN rating <= 3 THEN 1 ELSE 0 END) AS negative,
    SUM(CASE WHEN ${UNANSWERED} THEN 1 ELSE 0 END) AS unanswered
    FROM google_reviews GROUP BY branch_name ORDER BY reviews DESC`)).rows

  const themeRows = (await db.execute(`SELECT complaint_theme, COUNT(*) AS total
    FROM google_reviews WHERE complaint_theme <> ''
    GROUP BY complaint_theme ORDER BY total DESC`)).rows

  return {
    totals: {
      reviews: Number(totalsRow?.reviews || 0),
      branches: Number(totalsRow?.branches || 0),
      averageRating: Number(totalsRow?.average_rating || 0),
      unanswered: Number(totalsRow?.unanswered || 0),
      positive: Number(totalsRow?.positive || 0),
      negative: Number(totalsRow?.negative || 0),
    },
    periods,
    branches: branchRows.map((row) => ({
      branchName: String(row.branch_name || 'Unknown branch'),
      reviews: Number(row.reviews || 0),
      averageRating: Number(row.average_rating || 0),
      positive: Number(row.positive || 0),
      negative: Number(row.negative || 0),
      unanswered: Number(row.unanswered || 0),
    })),
    themes: themeRows.map((row) => ({
      theme: String(row.complaint_theme || 'Other'),
      count: Number(row.total || 0),
    })),
  }
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
    // Ordering purely by recency lets whichever branch is busiest fill the
    // whole section. Ranking each branch's reviews separately and taking every
    // branch's newest first spreads the selection across the network, then
    // backfills with each branch's next-newest only if there is space left.
    const result = await db.execute({
      sql: `SELECT reviewer_name, reviewer_photo_url, comment, branch_name, review_created_at
        FROM (
          SELECT reviewer_name, reviewer_photo_url, comment, branch_name, review_created_at,
            ROW_NUMBER() OVER (PARTITION BY branch_name ORDER BY review_created_at DESC) AS branch_rank
          FROM google_reviews
          WHERE rating = 5 AND featured_on_homepage = 1 AND trim(comment) <> ''
        )
        ORDER BY branch_rank ASC, review_created_at DESC
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
