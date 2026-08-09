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
  reviewsSeen: number
  newReviews: number
  autoReplied: number
  suggested: number
  errors: string[]
}

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

export async function syncGoogleReviews(): Promise<SyncSummary> {
  const db = await ensureCmsSchema()
  const summary: SyncSummary = { locationsScanned: 0, reviewsSeen: 0, newReviews: 0, autoReplied: 0, suggested: 0, errors: [] }

  const accounts = await listAllAccounts()
  for (const account of accounts) {
    let locations
    try {
      locations = await listAllLocations(account.name)
    } catch (error) {
      summary.errors.push(`Locations for ${account.name}: ${error instanceof Error ? error.message : 'failed'}`)
      continue
    }

    for (const location of locations) {
      summary.locationsScanned += 1
      const v4Path = toV4LocationPath(account.name, location.name)
      let reviews
      try {
        reviews = await listAllReviews(v4Path)
      } catch (error) {
        summary.errors.push(`Reviews for ${location.title || location.name}: ${error instanceof Error ? error.message : 'failed'}`)
        continue
      }

      for (const review of reviews) {
        summary.reviewsSeen += 1
        const { id, isNew, rating, replyStatus } = await upsertReview(db, {
          review,
          accountName: account.name,
          locationName: location.name,
          branchName: location.title || location.name,
        })
        // Reviews left at NONE were stored but never drafted — the previous
        // run ran out of function time mid-way. They are no longer "new", so
        // without this they would be skipped on every future sync and stay
        // stranded with no reply forever. Picking them back up makes a sync
        // that times out resumable by simply running it again.
        if (!isNew && replyStatus !== 'NONE') continue
        if (isNew) summary.newReviews += 1

        const draft = await draftReviewReply({
          branchName: location.title || location.name,
          reviewerName: review.reviewer?.displayName || '',
          rating,
          comment: review.comment || '',
        })

        if (rating === 5) {
          try {
            await postReviewReply(v4Path, review.reviewId, draft)
            await db.execute({
              sql: `UPDATE google_reviews SET
                reply_status = 'AUTO_REPLIED', ai_draft = ?, reply_text = ?,
                reply_posted_at = datetime('now'), replied_by_name = 'AI auto-reply',
                updated_at = datetime('now')
                WHERE id = ?`,
              args: [draft, draft, id],
            })
            summary.autoReplied += 1
          } catch (error) {
            summary.errors.push(`Auto-reply failed for review ${review.reviewId}: ${error instanceof Error ? error.message : 'failed'}`)
            await db.execute({
              sql: `UPDATE google_reviews SET reply_status = 'SUGGESTED', ai_draft = ?, updated_at = datetime('now') WHERE id = ?`,
              args: [draft, id],
            })
            summary.suggested += 1
          }
        } else {
          await db.execute({
            sql: `UPDATE google_reviews SET reply_status = 'SUGGESTED', ai_draft = ?, updated_at = datetime('now') WHERE id = ?`,
            args: [draft, id],
          })
          summary.suggested += 1
        }
      }
    }
  }

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
