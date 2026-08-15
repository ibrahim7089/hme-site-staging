/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Sparkles, Star, ThumbsUp, TriangleAlert } from 'lucide-react'
import styles from './admin.module.css'

type Branch = {
  locationName: string
  branchName: string
  reviews: number
  averageRating: number
  stars: Record<'1' | '2' | '3' | '4' | '5', number>
  replied: number
  latestReviewAt: string
  summary: string
  praise: string[]
  issues: string[]
  sentiment: string
  summaryGeneratedAt: string
  summaryStale: boolean
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('en-MY', { dateStyle: 'medium' }).format(parsed)
}

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating)
  return <span className={styles.starRow} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, index) => (
      <Star key={index} size={12} className={index < rounded ? styles.starFilled : styles.starEmpty} />
    ))}
  </span>
}

export default function BranchReviewBoard() {
  const [branches, setBranches] = useState<Branch[] | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [sort, setSort] = useState<'rating' | 'reviews' | 'worst'>('rating')

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/google-reviews/branches')
      if (response.status === 401) { window.location.assign('/admin/login'); return }
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to load branches')
      setBranches(body.branches || [])
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load branches')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  // Summaries are generated a batch at a time to stay inside the model's
  // per-minute limit, so keep going until nothing is left needing one.
  async function writeSummaries(force = false) {
    setBusy(true); setError(''); setNotice('')
    try {
      let total = 0
      for (let pass = 0; pass < 8; pass += 1) {
        const response = await fetch('/api/admin/google-reviews/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ force: force && pass === 0 }),
        })
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Could not write summaries')
        setBranches(body.branches || [])
        total += body.written
        setNotice(`Summarising branches — ${total} done${body.remaining ? `, ${body.remaining} to go…` : ''}`)
        if (body.written === 0 || body.remaining === 0) break
      }
      setNotice(total > 0 ? `${total} branch summar${total === 1 ? 'y' : 'ies'} updated` : 'Every branch summary is already up to date')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not write summaries')
    } finally { setBusy(false) }
  }

  const sorted = useMemo(() => {
    if (!branches) return []
    const rows = [...branches]
    if (sort === 'reviews') return rows.sort((a, b) => b.reviews - a.reviews)
    if (sort === 'worst') return rows.sort((a, b) => a.averageRating - b.averageRating || b.reviews - a.reviews)
    return rows.sort((a, b) => b.averageRating - a.averageRating || b.reviews - a.reviews)
  }, [branches, sort])

  if (error && !branches) return <div className={styles.error} role="alert">{error}</div>
  if (!branches) return <div className={styles.empty}>Loading branches…</div>
  if (branches.length === 0) {
    return <div className={styles.empty}>No reviews synced yet. Use &quot;Sync now&quot; to pull them from Google.</div>
  }

  const network = branches.reduce((sum, branch) => sum + branch.averageRating * branch.reviews, 0)
    / Math.max(1, branches.reduce((sum, branch) => sum + branch.reviews, 0))
  const missingSummaries = branches.filter((branch) => !branch.summary || branch.summaryStale).length

  return <div className={styles.reportsPage}>
    <div className={styles.reportsHead}>
      <div>
        <p className={styles.kicker}>Branch standings</p>
        <h2>How every branch is rated on Google</h2>
      </div>
      <div className={styles.reviewConnectActions}>
        <button className={styles.itemAction} onClick={load} disabled={busy}><RefreshCw size={15} /> Refresh</button>
        <button className={styles.primaryButton} onClick={() => writeSummaries(false)} disabled={busy}>
          <Sparkles size={15} /> {missingSummaries > 0 ? `Summarise ${missingSummaries} branch${missingSummaries === 1 ? '' : 'es'}` : 'Summaries up to date'}
        </button>
      </div>
    </div>

    {notice && <div className={styles.success}>{notice}</div>}
    {error && <div className={styles.error} role="alert">{error}</div>}

    <div className={styles.reportStatGrid}>
      <div className={styles.reportStat}><span className={styles.reportStatIcon}><Star size={18} /></span>
        <div><b>{network.toFixed(2)}</b><small>Network average</small></div></div>
      <div className={styles.reportStat}><span className={styles.reportStatIcon}><ThumbsUp size={18} /></span>
        <div><b>{sorted[0]?.branchName.replace(/^HME[^@]*@\s*/, '') || '—'}</b><small>Best rated branch</small></div></div>
      <div className={styles.reportStat}><span className={styles.reportStatIcon}><TriangleAlert size={18} /></span>
        <div><b>{branches.filter((branch) => branch.averageRating < 4).length}</b><small>Branches below 4.0</small></div></div>
      <div className={styles.reportStat}><span className={styles.reportStatIcon}><Sparkles size={18} /></span>
        <div><b>{branches.length}</b><small>Branches with reviews</small></div></div>
    </div>

    <div className={styles.reviewViewTabs} role="tablist" aria-label="Sort branches">
      <button role="tab" aria-selected={sort === 'rating'} className={sort === 'rating' ? styles.reviewViewActive : ''} onClick={() => setSort('rating')}>Best rated</button>
      <button role="tab" aria-selected={sort === 'worst'} className={sort === 'worst' ? styles.reviewViewActive : ''} onClick={() => setSort('worst')}>Needs attention</button>
      <button role="tab" aria-selected={sort === 'reviews'} className={sort === 'reviews' ? styles.reviewViewActive : ''} onClick={() => setSort('reviews')}>Most reviewed</button>
    </div>

    <ol className={styles.branchBoard}>
      {sorted.map((branch, index) => {
        const expanded = open === branch.locationName
        const replyRate = branch.reviews ? Math.round((branch.replied / branch.reviews) * 100) : 0
        return <li key={branch.locationName} className={styles.branchRow}>
          <button
            className={styles.branchRowHead}
            aria-expanded={expanded}
            onClick={() => setOpen(expanded ? null : branch.locationName)}
          >
            <span className={styles.branchRank}>{index + 1}</span>
            <span className={styles.branchIdentity}>
              <strong>{branch.branchName.replace(/^HME[^@]*@\s*/, '')}</strong>
              <small>{branch.reviews} review{branch.reviews === 1 ? '' : 's'} · {replyRate}% replied · latest {formatDate(branch.latestReviewAt)}</small>
            </span>
            <span className={styles.branchScore}>
              <b>{branch.averageRating.toFixed(2)}</b>
              <Stars rating={branch.averageRating} />
            </span>
          </button>

          {expanded && <div className={styles.branchDetail}>
            <div className={styles.branchSpread}>
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const count = branch.stars[String(star) as '1'] || 0
                const percent = branch.reviews ? (count / branch.reviews) * 100 : 0
                return <div key={star} className={styles.branchSpreadRow}>
                  <span>{star}★</span>
                  <span className={styles.branchSpreadTrack}>
                    <span className={styles.branchSpreadFill} style={{ width: `${percent}%` }} />
                  </span>
                  <span>{count}</span>
                </div>
              })}
            </div>

            <div className={styles.branchSummary}>
              {branch.summary ? <>
                <p className={styles.branchSummaryText}>{branch.summary}</p>
                {branch.praise.length > 0 && <p className={styles.branchTagLine}>
                  <ThumbsUp size={13} />
                  {branch.praise.map((item) => <em key={item} className={styles.branchTagGood}>{item}</em>)}
                </p>}
                {branch.issues.length > 0 && <p className={styles.branchTagLine}>
                  <TriangleAlert size={13} />
                  {branch.issues.map((item) => <em key={item} className={styles.branchTagBad}>{item}</em>)}
                </p>}
                <small className={styles.branchSummaryMeta}>
                  AI summary written {formatDate(branch.summaryGeneratedAt)}
                  {branch.summaryStale && ' — new reviews have arrived since'}
                </small>
              </> : <p className={styles.branchSummaryText}>
                No AI summary yet. Use &quot;Summarise&quot; above to write one from this branch&apos;s reviews.
              </p>}
            </div>
          </div>}
        </li>
      })}
    </ol>
  </div>
}
