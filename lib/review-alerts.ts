import 'server-only'

import { randomUUID } from 'node:crypto'
import type { CmsUser } from './cms-auth'
import { ensureCmsSchema } from './cms-db'
import { sendEmail } from './enquiry-service'

const REVIEW_ALERT_EMAILS_KEY = 'review_alert_emails'

export type ReviewAlertReview = {
  branchName: string
  reviewerName: string
  rating: number
  comment: string
  autoReplied: boolean
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character] as string
  ))
}

export function parseAlertEmails(raw: string) {
  return Array.from(new Set(
    raw.split(/[,;\s]+/).map((entry) => entry.trim().toLowerCase()).filter((entry) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(entry)),
  ))
}

export async function getReviewAlertEmails(): Promise<string[]> {
  const db = await ensureCmsSchema()
  const result = await db.execute({
    sql: 'SELECT setting_value FROM cms_settings WHERE setting_key = ? LIMIT 1',
    args: [REVIEW_ALERT_EMAILS_KEY],
  })
  const row = result.rows[0] as Record<string, unknown> | undefined
  return row ? parseAlertEmails(String(row.setting_value || '')) : []
}

export async function setReviewAlertEmails(raw: string, user: CmsUser, requestId: string) {
  const db = await ensureCmsSchema()
  const emails = parseAlertEmails(raw)
  const value = emails.join(', ')
  const previous = (await getReviewAlertEmails()).join(', ')

  await db.execute({
    sql: `INSERT INTO cms_settings (setting_key, setting_value, updated_by_user_id, updated_by_name, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(setting_key) DO UPDATE SET
        setting_value = excluded.setting_value,
        updated_by_user_id = excluded.updated_by_user_id,
        updated_by_name = excluded.updated_by_name,
        updated_at = datetime('now')`,
    args: [REVIEW_ALERT_EMAILS_KEY, value, user.id, user.name],
  })
  await db.execute({
    sql: `INSERT INTO cms_setting_events (setting_key, old_value, new_value, actor_user_id, actor_name, request_id)
      VALUES (?, ?, ?, ?, ?, ?)`,
    args: [REVIEW_ALERT_EMAILS_KEY, previous, value, user.id, user.name, requestId],
  })
  return emails
}

/**
 * Emails a digest of newly synced reviews. Sent per address so one bad
 * recipient cannot stop the rest, and never throws — an alert failing must not
 * fail the sync that produced it.
 */
export async function sendReviewAlert(reviews: ReviewAlertReview[]) {
  if (reviews.length === 0) return
  const recipients = await getReviewAlertEmails()
  if (recipients.length === 0) return

  const needingReply = reviews.filter((review) => !review.autoReplied)
  const subject = needingReply.length > 0
    ? `${needingReply.length} Google review${needingReply.length === 1 ? '' : 's'} need${needingReply.length === 1 ? 's' : ''} your reply`
    : `${reviews.length} new Google review${reviews.length === 1 ? '' : 's'}`

  const line = (review: ReviewAlertReview) => {
    const stars = `${review.rating}/5`
    const status = review.autoReplied ? 'auto-replied' : 'awaiting your reply'
    const comment = review.comment.trim() ? review.comment.trim().slice(0, 220) : '(no written comment)'
    return { stars, status, comment, branch: review.branchName || 'HME', name: review.reviewerName || 'A Google user' }
  }

  const text = [
    subject,
    '',
    ...reviews.map((review) => {
      const parts = line(review)
      return `${parts.stars} - ${parts.branch} - ${parts.name} (${parts.status})\n${parts.comment}\n`
    }),
    'Open the admin panel to reply: https://hme-site-staging.vercel.app/admin?section=reviews',
  ].join('\n')

  const html = `<div style="font-family:system-ui,sans-serif;color:#0f1722;line-height:1.6">
<h2 style="font-size:18px;margin:0 0 14px">${escapeHtml(subject)}</h2>
${reviews.map((review) => {
  const parts = line(review)
  return `<div style="border:1px solid #e2e9f4;border-radius:10px;padding:12px 14px;margin-bottom:10px">
<div style="font-size:13px;font-weight:700">${escapeHtml(parts.branch)}</div>
<div style="font-size:12px;color:#4a5a72">${escapeHtml(parts.name)} &middot; ${escapeHtml(parts.stars)} &middot; ${escapeHtml(parts.status)}</div>
<p style="margin:8px 0 0;font-size:13px">${escapeHtml(parts.comment)}</p>
</div>`
}).join('')}
<p style="font-size:13px"><a href="https://hme-site-staging.vercel.app/admin?section=reviews">Open the admin panel to reply</a></p>
</div>`

  for (const to of recipients) {
    try {
      await sendEmail({ to, subject, text, html, idempotencyKey: randomUUID() })
    } catch {
      // Alerting is best effort; the reviews are already saved and visible.
    }
  }
}
