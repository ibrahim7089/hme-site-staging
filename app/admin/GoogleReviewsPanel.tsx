/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useCallback, useEffect, useState } from 'react'
import { BarChart3, CheckCircle2, ChevronRight, Link2, RefreshCw, Star, Store, Unlink } from 'lucide-react'
import BranchReviewBoard from './BranchReviewBoard'
import GoogleReviewsReports from './GoogleReviewsReports'
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
  reply_text: string
  reply_posted_at: string | null
  replied_by_name: string
  featured_on_homepage: number
  backlog: number
}
type SyncSummary = {
  locationsScanned: number
  locationsTotal: number
  newReviews: number
  done: boolean
  errors: string[]
}

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
  const [view, setView] = useState<'branches' | 'reviews' | 'reports'>('branches')
  const [filter, setFilter] = useState<'all' | 'replied' | 'unreplied' | 'low'>('all')
  const [selected, setSelected] = useState<ReviewRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [alertEmails, setAlertEmails] = useState('')
  const [savingEmails, setSavingEmails] = useState(false)

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
    void api('/api/admin/google-reviews/alert-emails')
      .then((result: { emails: string[] }) => setAlertEmails((result.emails || []).join(', ')))
      .catch(() => setAlertEmails(''))
  }, [])

  async function saveAlertEmails() {
    setSavingEmails(true)
    try {
      const result = await api('/api/admin/google-reviews/alert-emails', {
        method: 'PUT',
        body: JSON.stringify({ emails: alertEmails }),
      }) as { emails: string[] }
      setAlertEmails(result.emails.join(', '))
      flash(result.emails.length
        ? `Alerts will go to ${result.emails.length} address${result.emails.length === 1 ? '' : 'es'}`
        : 'Review alerts are off — no valid addresses saved')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save alert addresses')
    } finally { setSavingEmails(false) }
  }

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

  // One request cannot cover every branch — the server works to a time budget
  // and reports done:false when it stopped early, so keep calling until it
  // has been all the way through the account.
  async function sync() {
    setBusy(true); setError('')
    const totals = { newReviews: 0, errors: [] as string[] }
    let done = false
    try {
      for (let pass = 0; pass < 12 && !done; pass += 1) {
        const summary = await api('/api/admin/google-reviews/sync', { method: 'POST' }) as SyncSummary
        totals.newReviews += summary.newReviews
        totals.errors.push(...summary.errors)
        done = summary.done
        if (!done) {
          setNotice(`Reading your branches — ${summary.locationsScanned} of ${summary.locationsTotal} scanned this pass…`)
        }
        await load()
      }
      flash(`${done ? 'Sync complete' : 'Sync paused'}: ${totals.newReviews} new review(s)${totals.errors.length ? ` · ${totals.errors.length} error(s)` : ''}`)
      if (totals.errors.length) setError(totals.errors.slice(0, 5).join('\n'))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sync failed')
    } finally { setBusy(false) }
  }

  async function disconnect() {
    if (!window.confirm('Disconnect this Google account? Reviews already synced stay here, but nothing new will sync until you reconnect.')) return
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

  async function toggleFeatured(review: ReviewRow, featured: boolean) {
    try {
      await api(`/api/admin/google-reviews/${review.id}/feature`, { method: 'POST', body: JSON.stringify({ featured }) })
      setReviews((rows) => rows.map((row) => row.id === review.id ? { ...row, featured_on_homepage: featured ? 1 : 0 } : row))
      setSelected((current) => current && current.id === review.id ? { ...current, featured_on_homepage: featured ? 1 : 0 } : current)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to update')
    }
  }

  const isReplied = (review: ReviewRow) => review.reply_status === 'SENT' || review.reply_status === 'AUTO_REPLIED'
  const replied = reviews.filter(isReplied)
  const unreplied = reviews.filter((review) => !isReplied(review))
  const lowRated = reviews.filter((review) => review.rating <= 3)
  const visible = filter === 'replied' ? replied
    : filter === 'unreplied' ? unreplied
      : filter === 'low' ? lowRated
        : reviews

  return <section className={styles.enquirySection}>
    <div className={styles.reviewViewTabs} role="tablist" aria-label="Google reviews view">
      <button role="tab" aria-selected={view === 'branches'} className={view === 'branches' ? styles.reviewViewActive : ''} onClick={() => setView('branches')}><Store size={16} /> Branches</button>
      <button role="tab" aria-selected={view === 'reviews'} className={view === 'reviews' ? styles.reviewViewActive : ''} onClick={() => setView('reviews')}><Star size={16} /> Reviews</button>
      <button role="tab" aria-selected={view === 'reports'} className={view === 'reports' ? styles.reviewViewActive : ''} onClick={() => setView('reports')}><BarChart3 size={16} /> Reports</button>
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

    {view === 'branches' ? <BranchReviewBoard /> : view === 'reports' ? <GoogleReviewsReports /> : <>
    <div className={styles.enquiryIntro}>
      <div>
        <p className={styles.kicker}>Google reviews</p>
        <h2>Every review across all branches</h2>
        <p>Read-only. Replies are written by your own reply bot on Google — this page mirrors them so you can see what has been answered, and never posts anything itself.</p>
      </div>
      <div className={styles.enquirySummary}>
        <button className={filter === 'all' ? styles.summaryActive : ''} onClick={() => setFilter('all')}><span><b>{reviews.length}</b><small>All reviews</small></span></button>
        <button className={filter === 'low' ? styles.summaryActive : ''} onClick={() => setFilter('low')}><span><b>{lowRated.length}</b><small>3 stars or below</small></span></button>
        <button className={filter === 'replied' ? styles.summaryActive : ''} onClick={() => setFilter('replied')}><span><b>{replied.length}</b><small>Replied on Google</small></span></button>
        <button className={filter === 'unreplied' ? styles.summaryActive : ''} onClick={() => setFilter('unreplied')}><span><b>{unreplied.length}</b><small>No reply yet</small></span></button>
      </div>
    </div>

    <div className={styles.reviewAlertBar}>
      <div>
        <strong>Email alerts</strong>
        <small>Who gets notified when new reviews arrive. Separate addresses with commas. Leave empty to turn alerts off.</small>
      </div>
      <input
        value={alertEmails}
        onChange={(event) => setAlertEmails(event.target.value)}
        placeholder="admin@hmeremit.com.my, manager@hmeremit.com.my"
        aria-label="Review alert email addresses"
      />
      <button className={styles.primaryButton} onClick={saveAlertEmails} disabled={savingEmails}>Save</button>
    </div>

    <div className={styles.enquiryWorkspace}>
      <div className={styles.enquiryList}>
        {visible.length === 0 && <div className={styles.empty}>Nothing here yet.{connected && '\nClick "Sync now" to pull the latest reviews.'}</div>}
        {visible.map((review) => (
          <button key={review.id} className={selected?.id === review.id ? styles.enquiryItemActive : styles.enquiryItem} onClick={() => setSelected(review)}>
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
          <div className={styles.enquiryBlank}><Star size={40} /><h3>Select a review</h3><p>Choose one from the list to read it in full.</p></div>
        ) : (
          <>
            <div className={styles.enquiryDetailHead}>
              <div><h2>{selected.reviewer_name}</h2><span>{selected.branch_name || 'HME'} · <Stars rating={selected.rating} /> · {formatDate(selected.review_created_at)}</span></div>
              <em className={styles.reviewStatusBadge}>{isReplied(selected) ? 'Replied' : 'No reply'}</em>
            </div>

            <p className={styles.reviewCommentText}>{selected.comment || <i>No written comment — star rating only.</i>}</p>

            {selected.rating === 5 && <label className={styles.switchLabel}>
              <input type="checkbox" checked={selected.featured_on_homepage === 1} onChange={(event) => toggleFeatured(selected, event.target.checked)} />
              Allow this review to appear on the homepage
            </label>}

            {isReplied(selected) ? (
              <div className={styles.reviewPostedReply}>
                <strong>Reply on Google</strong>
                <p>{selected.reply_text}</p>
                <small>Posted {formatDate(selected.reply_posted_at)}. To change it, edit the reply in Google Business Profile — this page only mirrors what is there.</small>
              </div>
            ) : (
              <div className={styles.reviewPostedReply}>
                <strong>No reply on Google yet</strong>
                <small>Replies are posted by your own reply bot. This site does not write them.</small>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>}
  </section>
}
