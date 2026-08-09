/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useCallback, useEffect, useState } from 'react'
import { MessageSquareWarning, RefreshCw, Star, Store, TrendingUp } from 'lucide-react'
import styles from './admin.module.css'

type Reports = {
  totals: { reviews: number; branches: number; averageRating: number; unanswered: number; positive: number; negative: number }
  periods: Array<{ label: string; reviews: number; averageRating: number }>
  branches: Array<{ branchName: string; reviews: number; averageRating: number; positive: number; negative: number; unanswered: number }>
  themes: Array<{ theme: string; count: number }>
}

function rating(value: number) {
  return value > 0 ? value.toFixed(2) : '—'
}

export default function GoogleReviewsReports() {
  const [reports, setReports] = useState<Reports | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setBusy(true)
    try {
      const response = await fetch('/api/admin/google-reviews/reports')
      if (response.status === 401) { window.location.assign('/admin/login'); return }
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to load reports')
      setReports(body)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load reports')
    } finally { setBusy(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  if (error) return <div className={styles.error} role="alert">{error}</div>
  if (!reports) return <div className={styles.empty}>Loading reports…</div>

  const { totals } = reports
  const answered = totals.reviews - totals.unanswered
  const answeredPercent = totals.reviews ? Math.round((answered / totals.reviews) * 100) : 0
  const worstBranches = [...reports.branches].filter((b) => b.reviews >= 5).sort((a, b) => a.averageRating - b.averageRating).slice(0, 5)
  const themeMax = reports.themes[0]?.count || 1

  return <div className={styles.reportsPage}>
    <div className={styles.reportsHead}>
      <div>
        <p className={styles.kicker}>Performance</p>
        <h2>Google reviews across all branches</h2>
      </div>
      <button className={styles.itemAction} onClick={load} disabled={busy}><RefreshCw size={15} /> Refresh</button>
    </div>

    <div className={styles.reportStatGrid}>
      <div className={styles.reportStat}><span className={styles.reportStatIcon}><Star size={18} /></span>
        <div><b>{rating(totals.averageRating)}</b><small>Average rating</small></div></div>
      <div className={styles.reportStat}><span className={styles.reportStatIcon}><MessageSquareWarning size={18} /></span>
        <div><b>{totals.reviews.toLocaleString()}</b><small>Total reviews</small></div></div>
      <div className={styles.reportStat}><span className={styles.reportStatIcon}><Store size={18} /></span>
        <div><b>{totals.branches}</b><small>Branches with reviews</small></div></div>
      <div className={styles.reportStat}><span className={styles.reportStatIcon}><TrendingUp size={18} /></span>
        <div><b>{answeredPercent}%</b><small>Replied ({totals.unanswered.toLocaleString()} outstanding)</small></div></div>
    </div>

    <section className={styles.reportCard}>
      <h3>Reviews over time</h3>
      <div className={styles.reportPeriodGrid}>
        {reports.periods.map((period) => (
          <div key={period.label} className={styles.reportPeriod}>
            <small>{period.label}</small>
            <b>{period.reviews.toLocaleString()}</b>
            <span>{rating(period.averageRating)} ★ average</span>
          </div>
        ))}
      </div>
    </section>

    <section className={styles.reportCard}>
      <h3>What customers complain about</h3>
      {reports.themes.length === 0 ? (
        <p className={styles.reportEmpty}>No complaint themes yet. These are worked out automatically as reviews below 5 stars are processed.</p>
      ) : (
        <div className={styles.reportThemes}>
          {reports.themes.map((theme) => (
            <div key={theme.theme} className={styles.reportTheme}>
              <span>{theme.theme}</span>
              <div className={styles.reportBarTrack}>
                <div className={styles.reportBar} style={{ width: `${Math.max(4, (theme.count / themeMax) * 100)}%` }} />
              </div>
              <b>{theme.count}</b>
            </div>
          ))}
        </div>
      )}
    </section>

    {worstBranches.length > 0 && <section className={styles.reportCard}>
      <h3>Branches needing the most attention</h3>
      <p className={styles.reportEmpty}>Lowest average rating, among branches with at least 5 reviews.</p>
      <div className={styles.reportThemes}>
        {worstBranches.map((branch) => (
          <div key={branch.branchName} className={styles.reportTheme}>
            <span>{branch.branchName}</span>
            <div className={styles.reportBarTrack}>
              <div className={`${styles.reportBar} ${styles.reportBarWarn}`} style={{ width: `${(branch.averageRating / 5) * 100}%` }} />
            </div>
            <b>{rating(branch.averageRating)} ★</b>
          </div>
        ))}
      </div>
    </section>}

    <section className={styles.reportCard}>
      <h3>Every branch</h3>
      <div className={styles.reportTableWrap}>
        <table className={styles.reportTable}>
          <thead>
            <tr>
              <th>Branch</th><th>Reviews</th><th>Average</th>
              <th>Positive (4–5★)</th><th>Negative (1–3★)</th><th>Awaiting reply</th>
            </tr>
          </thead>
          <tbody>
            {reports.branches.map((branch) => (
              <tr key={branch.branchName}>
                <td>{branch.branchName}</td>
                <td>{branch.reviews.toLocaleString()}</td>
                <td><b>{rating(branch.averageRating)}</b></td>
                <td>{branch.positive.toLocaleString()}</td>
                <td className={branch.negative > 0 ? styles.reportNegative : undefined}>{branch.negative.toLocaleString()}</td>
                <td>{branch.unanswered.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  </div>
}
