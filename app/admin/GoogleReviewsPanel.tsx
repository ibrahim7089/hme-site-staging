/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, ChevronRight, Link2, RefreshCw, Send, Star, Unlink } from 'lucide-react'
import styles from './admin.module.css'

type ReplyStatus = 'NONE' | 'SUGGESTED' | 'AUTO_REPLIED' | 'SENT'
type ReviewRow = {
  id: number
  branch_name: string
  reviewer_name: string
  rating: number
  comment: string
  review_created_at: string
  reply_status: ReplyStatus
  ai_draft: string
  reply_text: string
  reply_posted_at: string | null
  replied_by_name: string
  featured_on_homepage: number
}
type SyncSummary = { newReviews: number; autoReplied: number; suggested: number; errors: string[] }

const oauthErrorMessages: Record<string, string> = {
  not_configured: "Google Business Profile isn't configured on the server yet (missing OAuth environment variables).",
  invalid_state: 'The connection attempt expired or was invalid. Please try connecting again.',
  no_refresh_token: "Google didn't return a long-lived token. Try disconnecting any prior access at myaccount.google.com/permissions and connecting again.",
  connect_failed: 'Could not complete the connection to Google. Please try again.',
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('en-MY', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed)
}

async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } })
  const body = await response.json().catch(() => ({}))
  if (response.status === 401) {
    window.location.assign('/admin/login')
    throw new Error('Session expired')
  }
  if (!response.ok) throw new Error(body.error || 'Request failed')
  return body
}

function Stars({ rating }: { rating: number }) {
  return <span className={styles.starRow} aria-label={`${rating} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, index) => (
      <Star key={index} size={13} className={index < rating ? styles.starFilled : styles.starEmpty} />
    ))}
  </span>
}

export default function GoogleReviewsPanel() {
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [configured, setConfigured] = useState(false)
  const [connected, setConnected] = useState(false)
  const [connectedEmail, setConnectedEmail] = useState('')
  const [filter, setFilter] = useState<'needs-reply' | 'auto-replied' | 'all'>('needs-reply')
  const [selected, setSelected] = useState<ReviewRow | null>(null)
  const [draftText, setDraftText] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  function flash(text: string) {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 4500)
  }

  const load = useCallback(async () => {
    try {
      const result = await api('/api/admin/google-reviews')
      setReviews(result.reviews || [])
      setConfigured(Boolean(result.configured))
      setConnected(Boolean(result.connected))
      setConnectedEmail(result.connectedEmail || '')
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load reviews')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const oauthError = params.get('error')
    const justConnected = params.get('connected')
    if (justConnected) { flash('Google Business Profile connected'); void load() }
    if (oauthError) setError(oauthErrorMessages[oauthError] || `Connection failed: ${oauthError}`)
    if (oauthError || justConnected) {
      params.delete('error'); params.delete('connected')
      const query = params.toString()
      window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
    }
    // Only ever needs to run once, right after the OAuth redirect lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function sync() {
    setBusy(true); setError('')
    try {
      const summary = await api('/api/admin/google-reviews/sync', { method: 'POST' }) as SyncSummary
      flash(`Synced: ${summary.newReviews} new review(s) — ${summary.autoReplied} auto-replied, ${summary.suggested} waiting for your reply${summary.errors.length ? ` (${summary.errors.length} location error(s))` : ''}`)
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sync failed')
    } finally { setBusy(false) }
  }

  async function disconnect() {
    if (!window.confirm('Disconnect this Google account? Reviews already synced stay here, but nothing new will sync or auto-reply until you reconnect.')) return
    setBusy(true); setError('')
    try {
      await api('/api/admin/google-reviews/disconnect', { method: 'POST' })
      flash('Google Business Profile disconnected')
      setSelected(null)
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to disconnect')
    } finally { setBusy(false) }
  }

  function selectReview(review: ReviewRow) {
    setSelected(review)
    setDraftText(review.reply_text || review.ai_draft || '')
  }

  async function sendReply() {
    if (!selected) return
    const text = draftText.trim()
    if (!text) return
    setBusy(true); setError('')
    try {
      await api(`/api/admin/google-reviews/${selected.id}/reply`, { method: 'POST', body: JSON.stringify({ text }) })
      flash('Reply posted to Google')
      setSelected(null)
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to send reply')
    } finally { setBusy(false) }
  }

  async function toggleFeatured(review: ReviewRow, featured: boolean) {
    try {
      await api(`/api/admin/google-reviews/${review.id}/feature`, { method: 'POST', body: JSON.stringify({ featured }) })
      setReviews((rows) => rows.map((row) => row.id === review.id ? { ...row, featured_on_homepage: featured ? 1 : 0 } : row))
      setSelected((current) => current && current.id === review.id ? { ...current, featured_on_homepage: featured ? 1 : 0 } : current)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to update')
    }
  }

  const needsReply = reviews.filter((review) => review.reply_status === 'SUGGESTED')
  const autoReplied = reviews.filter((review) => review.reply_status === 'AUTO_REPLIED')
  const visible = filter === 'needs-reply' ? needsReply : filter === 'auto-replied' ? autoReplied : reviews

  return <section className={styles.enquirySection}>
    <div className={styles.enquiryIntro}>
      <div>
        <p className={styles.kicker}>Google reviews</p>
        <h2>Reply to customer reviews across all branches</h2>
        <p>5-star reviews get an AI-drafted reply posted automatically — check &quot;Recent auto-replies&quot; to glance over them. 4 stars and below always wait for your approval before anything is posted.</p>
      </div>
      <div className={styles.enquirySummary}>
        <button className={filter === 'needs-reply' ? styles.summaryActive : ''} onClick={() => setFilter('needs-reply')}><span><b>{needsReply.length}</b><small>Needs your reply</small></span></button>
        <button className={filter === 'auto-replied' ? styles.summaryActive : ''} onClick={() => setFilter('auto-replied')}><span><b>{autoReplied.length}</b><small>Recent auto-replies</small></span></button>
        <button className={filter === 'all' ? styles.summaryActive : ''} onClick={() => setFilter('all')}><span><b>{reviews.length}</b><small>All reviews</small></span></button>
      </div>
    </div>

    {notice && <div className={styles.success}><CheckCircle2 size={18} /> {notice}</div>}
    {error && <div className={styles.error} role="alert">{error}</div>}

    <div className={styles.reviewConnectBar}>
      {!configured ? (
        <span>Google Business Profile isn&apos;t configured yet. Add <code>GOOGLE_OAUTH_CLIENT_ID</code>, <code>GOOGLE_OAUTH_CLIENT_SECRET</code> and <code>GOOGLE_OAUTH_REDIRECT_URI</code> as environment variables, then redeploy.</span>
      ) : connected ? (
        <>
          <span><CheckCircle2 size={15} /> Connected as <strong>{connectedEmail || 'a Google account'}</strong></span>
          <div className={styles.reviewConnectActions}>
            <button className={styles.primaryButton} onClick={sync} disabled={busy}><RefreshCw size={15} /> Sync now</button>
            <button className={styles.rejectButton} onClick={disconnect} disabled={busy}><Unlink size={15} /> Disconnect</button>
          </div>
        </>
      ) : (
        <>
          <span>Not connected yet — connect the Google account that manages all your branch listings.</span>
          <a className={styles.primaryButton} href="/api/admin/google-reviews/connect"><Link2 size={15} /> Connect Google Business Profile</a>
        </>
      )}
    </div>

    <div className={styles.enquiryWorkspace}>
      <div className={styles.enquiryList}>
        {visible.length === 0 && <div className={styles.empty}>Nothing here yet.{connected && '\nClick "Sync now" to pull the latest reviews.'}</div>}
        {visible.map((review) => (
          <button key={review.id} className={selected?.id === review.id ? styles.enquiryItemActive : styles.enquiryItem} onClick={() => selectReview(review)}>
            <span className={styles.enquiryItemIcon}><Star size={16} /></span>
            <span className={styles.enquiryItemText}>
              <small>{review.branch_name || 'HME'}</small>
              <strong>{review.reviewer_name}</strong>
              <span><Stars rating={review.rating} /> {review.comment ? `· ${review.comment.slice(0, 60)}${review.comment.length > 60 ? '…' : ''}` : '· No written comment'}</span>
              <time>{formatDate(review.review_created_at)}</time>
            </span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>

      <div className={styles.enquiryDetail}>
        {!selected ? (
          <div className={styles.enquiryBlank}><Star size={40} /><h3>Select a review</h3><p>Choose one from the list to read it in full and reply.</p></div>
        ) : (
          <>
            <div className={styles.enquiryDetailHead}>
              <div><h2>{selected.reviewer_name}</h2><span>{selected.branch_name || 'HME'} · <Stars rating={selected.rating} /> · {formatDate(selected.review_created_at)}</span></div>
              <em className={styles.reviewStatusBadge}>{selected.reply_status.replace('_', ' ')}</em>
            </div>

            <p className={styles.reviewCommentText}>{selected.comment || <i>No written comment — star rating only.</i>}</p>

            {selected.rating === 5 && <label className={styles.switchLabel}>
              <input type="checkbox" checked={selected.featured_on_homepage === 1} onChange={(event) => toggleFeatured(selected, event.target.checked)} />
              Show this review on the homepage
            </label>}

            {(selected.reply_status === 'SENT' || selected.reply_status === 'AUTO_REPLIED') && (
              <div className={styles.reviewPostedReply}>
                <strong>{selected.reply_status === 'AUTO_REPLIED' ? 'AI auto-reply (already posted)' : `Reply sent by ${selected.replied_by_name}`}</strong>
                <p>{selected.reply_text}</p>
                <small>Posted {formatDate(selected.reply_posted_at)} — you can edit and re-send below if needed.</small>
              </div>
            )}

            <label className={styles.fullField}>
              {selected.reply_status === 'NONE' ? 'Write a reply' : selected.reply_status === 'SUGGESTED' ? 'AI-suggested reply — edit if needed' : 'Edit reply'}
              <textarea className={styles.replyTextarea} value={draftText} onChange={(event) => setDraftText(event.target.value)} maxLength={4000} />
            </label>
            <div className={styles.actions}>
              <button className={styles.approveButton} onClick={sendReply} disabled={busy || !draftText.trim()}>
                <Send size={16} /> {selected.reply_status === 'SUGGESTED' ? 'Send this reply' : selected.reply_status === 'NONE' ? 'Post reply' : 'Update reply'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  </section>
}
