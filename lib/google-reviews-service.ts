import 'server-only'

import { ensureCmsSchema } from './cms-db'
import {
  listAllAccounts,
  listAllLocations,
  listAllReviews,
  starRatingToNumber,
  toV4LocationPath,
  type GoogleReview,
} from './google-business'
import { sendReviewAlert, type ReviewAlertReview } from './review-alerts'
import { summariseBranchReviews } from './review-summary'

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
  backlogCutoff: string
}) {
  const { review, accountName, locationName, branchName, backlogCutoff } = params
  const rating = starRatingToNumber[review.starRating] || 0
  // Reviews predating the connection are historical. They are stored so the
  // reporting covers the full history, but they are not treated as news and
  // never trigger an alert.
  const isBacklog = Boolean(backlogCutoff && review.createTime < backlogCutoff)
  const existing = await db.execute({
    sql: 'SELECT id, reply_status FROM google_reviews WHERE google_review_id = ? LIMIT 1',
    args: [review.reviewId],
  })
  const existingRow = existing.rows[0] as Record<string, unknown> | undefined

  // Replies are written elsewhere — by staff in the Google interface, or by the
  // owner's own reply bot. This site never writes them; it mirrors whatever is
  // on Google so the dashboard can show which reviews have been answered.
  const googleReply = review.reviewReply?.comment?.trim() || ''

  if (existingRow) {
    // Always mirror what is on Google: if the reply bot rewrites a reply, or a
    // reply is added later, the dashboard should reflect the current text.
    const adoptGoogleReply = Boolean(googleReply)
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
      isBacklog,
      rating,
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
    isBacklog,
    rating,
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
 * Pulls reviews for every location on every connected account into the local
 * database. This is read-only against Google: it never writes a reply. Replies
 * are handled outside this site, and mirroring them here is only so the
 * dashboard can show which reviews have been answered.
 *
 * ~41 locations do not fit in one function invocation, so the scan is bounded
 * by SYNC_BUDGET_MS and resumable: it records a location cursor and the next
 * call continues from the branch after the last completed one. Callers should
 * keep invoking until `done` is true.
 */
export async function syncGoogleReviews(): Promise<SyncSummary> {
  const db = await ensureCmsSchema()
  const deadline = Date.now() + SYNC_BUDGET_MS
  const summary: SyncSummary = {
    locationsScanned: 0, locationsTotal: 0, reviewsSeen: 0, newReviews: 0,
    done: false, errors: [],
  }

  // Reviews older than the connection are historical: kept for reporting, but
  // not announced as new arrivals.
  const connected = await db.execute('SELECT connected_at FROM google_oauth_tokens WHERE id = 1 LIMIT 1')
  const connectedAt = String((connected.rows[0] as Record<string, unknown>)?.connected_at || '')
  const backlogCutoff = connectedAt ? `${connectedAt.replace(' ', 'T')}Z` : ''

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

  const alerts: ReviewAlertReview[] = []

  for (; index < targets.length; index++) {
    if (Date.now() > deadline) break
    const target = targets[index]
    try {
      const reviews = await listAllReviews(toV4LocationPath(target.accountName, target.locationName))
      summary.locationsScanned += 1
      for (const review of reviews) {
        summary.reviewsSeen += 1
        const { isNew, isBacklog, rating } = await upsertReview(db, { review, ...target, backlogCutoff })
        if (!isNew) continue
        summary.newReviews += 1
        // Alert on genuinely new arrivals only. The historical backlog is not
        // news, and mailing thousands of old reviews would bury what matters.
        if (!isBacklog) {
          alerts.push({
            branchName: target.branchName,
            reviewerName: review.reviewer?.displayName || 'A Google user',
            rating,
            comment: review.comment || '',
          })
        }
      }
    } catch (error) {
      summary.errors.push(`Reviews for ${target.branchName}: ${error instanceof Error ? error.message : 'failed'}`)
    }
    await writeLocationCursor(db, target.locationName)
  }

  const scanComplete = index >= targets.length
  if (scanComplete) await writeLocationCursor(db, '')

  if (alerts.length > 0) await sendReviewAlert(alerts)
  summary.done = scanComplete
  return summary
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

export type BranchStanding = {
  locationName: string
  branchName: string
  reviews: number
  averageRating: number
  stars: { 1: number; 2: number; 3: number; 4: number; 5: number }
  replied: number
  latestReviewAt: string
  summary: string
  praise: string[]
  issues: string[]
  sentiment: string
  summaryGeneratedAt: string
  /** True when reviews have arrived since the summary was written. */
  summaryStale: boolean
}

const REPLIED = "reply_status IN ('SENT','AUTO_REPLIED')"

/**
 * Every branch that has reviews, best-rated first. Ties break on review count,
 * so a 5.0 from 80 people outranks a 5.0 from two.
 */
export async function getBranchStandings(): Promise<BranchStanding[]> {
  const db = await ensureCmsSchema()
  const rows = (await db.execute(`SELECT
    r.location_name,
    MAX(r.branch_name) AS branch_name,
    COUNT(*) AS reviews,
    AVG(r.rating) AS average_rating,
    SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) AS s1,
    SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) AS s2,
    SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) AS s3,
    SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) AS s4,
    SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) AS s5,
    SUM(CASE WHEN ${REPLIED} THEN 1 ELSE 0 END) AS replied,
    MAX(r.review_created_at) AS latest_review_at,
    MAX(s.summary) AS summary,
    MAX(s.praise) AS praise,
    MAX(s.issues) AS issues,
    MAX(s.sentiment) AS sentiment,
    MAX(s.generated_at) AS generated_at,
    MAX(s.reviews_at_generation) AS reviews_at_generation
    FROM google_reviews r
    LEFT JOIN branch_review_summaries s ON s.location_name = r.location_name
    GROUP BY r.location_name
    ORDER BY average_rating DESC, reviews DESC`)).rows

  const parseList = (value: unknown) => {
    try {
      const parsed = JSON.parse(String(value || '[]'))
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch { return [] }
  }

  return rows.map((row) => {
    const reviews = Number(row.reviews || 0)
    return {
      locationName: String(row.location_name || ''),
      branchName: String(row.branch_name || 'Unknown branch'),
      reviews,
      averageRating: Number(row.average_rating || 0),
      stars: {
        1: Number(row.s1 || 0), 2: Number(row.s2 || 0), 3: Number(row.s3 || 0),
        4: Number(row.s4 || 0), 5: Number(row.s5 || 0),
      },
      replied: Number(row.replied || 0),
      latestReviewAt: String(row.latest_review_at || ''),
      summary: String(row.summary || ''),
      praise: parseList(row.praise),
      issues: parseList(row.issues),
      sentiment: String(row.sentiment || ''),
      summaryGeneratedAt: String(row.generated_at || ''),
      summaryStale: Boolean(row.generated_at) && Number(row.reviews_at_generation || 0) < reviews,
    }
  })
}

// Gemini's free tier allows 20 generate_content calls per minute and one
// summary is one call, so a run stays well under the ceiling and the rest are
// picked up next time.
const MAX_SUMMARIES_PER_RUN = 12

/**
 * Writes AI summaries for branches that have none, or whose reviews have moved
 * on since the last one. Branches whose model call fails are left with their
 * previous summary intact rather than being blanked.
 */
export async function generateBranchSummaries(options: { force?: boolean } = {}) {
  const db = await ensureCmsSchema()
  const standings = await getBranchStandings()
  const stale = standings.filter((branch) => (
    options.force || !branch.summary || branch.summaryStale
  )).slice(0, MAX_SUMMARIES_PER_RUN)

  let written = 0
  let deferred = 0
  for (const branch of stale) {
    const reviewRows = (await db.execute({
      sql: `SELECT rating, comment, review_created_at FROM google_reviews
        WHERE location_name = ? ORDER BY review_created_at DESC LIMIT 200`,
      args: [branch.locationName],
    })).rows

    const summary = await summariseBranchReviews({
      branchName: branch.branchName,
      averageRating: branch.averageRating,
      reviews: reviewRows.map((row) => ({
        rating: Number(row.rating || 0),
        comment: String(row.comment || ''),
        createdAt: String(row.review_created_at || ''),
      })),
    })
    if (!summary) { deferred += 1; continue }

    await db.execute({
      sql: `INSERT INTO branch_review_summaries
        (location_name, branch_name, summary, praise, issues, sentiment, reviews_at_generation, generated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(location_name) DO UPDATE SET
          branch_name = excluded.branch_name, summary = excluded.summary,
          praise = excluded.praise, issues = excluded.issues,
          sentiment = excluded.sentiment,
          reviews_at_generation = excluded.reviews_at_generation,
          generated_at = excluded.generated_at`,
      args: [
        branch.locationName, branch.branchName, summary.summary,
        JSON.stringify(summary.praise), JSON.stringify(summary.issues),
        summary.sentiment, branch.reviews,
      ],
    })
    written += 1
  }

  const remaining = standings.filter((branch) => !branch.summary || branch.summaryStale).length
  return { written, deferred, remaining: Math.max(0, remaining - written) }
}

export async function setReviewFeatured(reviewRowId: number, featured: boolean) {
  const db = await ensureCmsSchema()
  await db.execute({
    sql: `UPDATE google_reviews SET featured_on_homepage = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [featured ? 1 : 0, reviewRowId],
  })
}

export type HomepageReview = {
  reviewer_name: string
  reviewer_photo_url: string
  comment: string
  branch_name: string
  review_created_at: string
}

// How many of the newest 5-star reviews are eligible to appear. The section
// shows a slice of this pool and the slice moves over time, so a visitor
// coming back does not see the same quotes — but everything shown is still
// recent, rather than dredging up something from years ago.
const HOMEPAGE_POOL_SIZE = 60
// How often the selection moves on.
const ROTATION_MINUTES = 30

/**
 * The latest 5-star reviews, spread across branches and rotated over time.
 *
 * Ordering purely by recency lets whichever branch is busiest fill the whole
 * section, so each branch's reviews are ranked separately and every branch's
 * newest is taken first. The starting point then advances on a clock so the
 * quotes keep changing between visits instead of showing the same few.
 */
export async function listFiveStarReviewsForHomepage(limit = 9): Promise<HomepageReview[]> {
  try {
    const db = await ensureCmsSchema()
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
      args: [HOMEPAGE_POOL_SIZE],
    })
    const pool = result.rows as unknown as HomepageReview[]
    if (pool.length <= limit) return pool

    // Rotate through the pool a slice at a time. Stepping by `limit` means
    // consecutive rotations share no reviews at all until the pool wraps.
    const tick = Math.floor(Date.now() / (ROTATION_MINUTES * 60_000))
    const start = (tick * limit) % pool.length
    return Array.from({ length: limit }, (_, offset) => pool[(start + offset) % pool.length])
  } catch {
    // CMS not configured, or table not ready yet — homepage should degrade
    // gracefully rather than break.
    return []
  }
}
