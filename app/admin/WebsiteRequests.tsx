/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { CheckCircle2, ChevronRight, ClipboardList, LoaderCircle, Plus, RefreshCw, TriangleAlert, UploadCloud, X } from 'lucide-react'
import styles from './admin.module.css'

type RequestStatus = 'NEW' | 'IN_PROGRESS' | 'DONE' | 'REJECTED'
type RequestPriority = 'LOW' | 'NORMAL' | 'URGENT'

type WebsiteRequest = {
  id: number
  reference: string
  title: string
  details: string
  page_area: string
  priority: RequestPriority
  status: RequestStatus
  images: string[]
  requested_by_name: string
  closed_by_name: string
  closed_at: string | null
  created_at: string
  updated_at: string
}

type RequestEvent = {
  id: number
  action: string
  actor_name: string
  from_status: string | null
  to_status: string | null
  note: string
  created_at: string
}

const statusLabels: Record<RequestStatus, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
  REJECTED: 'Rejected',
}
const priorityLabels: Record<RequestPriority, string> = { LOW: 'Low', NORMAL: 'Normal', URGENT: 'Urgent' }
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
// Matches the server: the hosting platform rejects bodies above roughly 4.5 MB.
const UPLOAD_LIMIT_BYTES = Math.floor(4.4 * 1024 * 1024)

function formatDate(value?: string | null) {
  if (!value) return '—'
  const normalised = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`
  const parsed = new Date(normalised)
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

export default function WebsiteRequests({ canManage }: { canManage: boolean }) {
  const [requests, setRequests] = useState<WebsiteRequest[]>([])
  const [selected, setSelected] = useState<WebsiteRequest | null>(null)
  const [events, setEvents] = useState<RequestEvent[]>([])
  const [filter, setFilter] = useState<'OPEN' | RequestStatus | 'ALL'>('OPEN')
  const [composing, setComposing] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  function flash(text: string) {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 4000)
  }

  const load = useCallback(async () => {
    try {
      const result = await api('/api/admin/website-requests')
      setRequests(result.requests || [])
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load requests')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!selected) { setEvents([]); return }
    void api(`/api/admin/website-requests/${selected.id}`)
      .then((result: { events: RequestEvent[] }) => setEvents(result.events || []))
      .catch(() => setEvents([]))
  }, [selected])

  async function uploadImage(file?: File) {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      const described = file.type || (file.name.includes('.') ? `.${file.name.split('.').pop()}` : 'unknown')
      setUploadError(`“${file.name}” is a ${described} file. Attach a JPG, PNG, WebP or AVIF screenshot instead — PDFs, HEIC photos and videos cannot be shown here.`)
      return
    }
    if (file.size > UPLOAD_LIMIT_BYTES) {
      setUploadError(`“${file.name}” is ${(file.size / 1024 / 1024).toFixed(1)} MB. The hosting platform refuses uploads above 4.4 MB — please resize it and try again.`)
      return
    }
    setUploading(true); setUploadError('')
    try {
      const form = new FormData()
      form.append('image', file)
      const response = await fetch('/api/admin/uploads', { method: 'POST', body: form })
      const result = await response.json().catch(() => ({}))
      if (response.status === 401) { window.location.assign('/admin/login'); return }
      if (!response.ok) throw new Error(result.error || 'Upload failed')
      setImages((current) => [...current, String(result.url)].slice(0, 8))
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : 'Upload failed')
    } finally { setUploading(false) }
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true); setError('')
    try {
      await api('/api/admin/website-requests', {
        method: 'POST',
        body: JSON.stringify({
          title: form.get('title'),
          details: form.get('details'),
          pageArea: form.get('pageArea'),
          priority: form.get('priority'),
          images,
        }),
      })
      setComposing(false); setImages([]); setUploadError('')
      flash('Change request submitted')
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not submit the request')
    } finally { setBusy(false) }
  }

  async function update(payload: { status?: RequestStatus; priority?: RequestPriority; note?: string }) {
    if (!selected) return
    setBusy(true); setError('')
    try {
      const updated = await api(`/api/admin/website-requests/${selected.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      setSelected(updated)
      setNote('')
      flash('Request updated')
      await load()
      const refreshed = await api(`/api/admin/website-requests/${selected.id}`)
      setEvents(refreshed.events || [])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update the request')
    } finally { setBusy(false) }
  }

  const open = requests.filter((entry) => entry.status === 'NEW' || entry.status === 'IN_PROGRESS')
  const visible = filter === 'OPEN' ? open : filter === 'ALL' ? requests : requests.filter((entry) => entry.status === filter)

  return <section className={styles.enquirySection}>
    <div className={styles.enquiryIntro}>
      <div>
        <p className={styles.kicker}>Change requests</p>
        <h2>Ask for a website change</h2>
        <p>Describe what you would like changed and attach a screenshot or an example. Anyone with a login can raise one; an administrator marks it done.</p>
      </div>
      <div className={styles.enquirySummary}>
        <button className={filter === 'OPEN' ? styles.summaryActive : ''} onClick={() => setFilter('OPEN')}><span><b>{open.length}</b><small>Open</small></span></button>
        <button className={filter === 'DONE' ? styles.summaryActive : ''} onClick={() => setFilter('DONE')}><span><b>{requests.filter((r) => r.status === 'DONE').length}</b><small>Done</small></span></button>
        <button className={filter === 'ALL' ? styles.summaryActive : ''} onClick={() => setFilter('ALL')}><span><b>{requests.length}</b><small>All</small></span></button>
      </div>
    </div>

    {notice && <div className={styles.success}><CheckCircle2 size={18} /> {notice}</div>}
    {error && <div className={styles.error} role="alert">{error}</div>}

    <div className={styles.requestToolbar}>
      <button className={styles.primaryButton} onClick={() => { setComposing((value) => !value); setSelected(null) }}>
        {composing ? <><X size={16} /> Cancel</> : <><Plus size={16} /> New request</>}
      </button>
      <button className={styles.itemAction} onClick={load}><RefreshCw size={15} /> Refresh</button>
    </div>

    {composing && <form className={styles.requestForm} onSubmit={submitRequest}>
      <label className={styles.spanTwo}>What would you like changed?
        <input name="title" required minLength={3} maxLength={160} placeholder="Example: Change the phone number in the footer" />
      </label>
      <label>Which page or area?
        <input name="pageArea" maxLength={160} placeholder="Example: Homepage footer" />
      </label>
      <label>Priority
        <select name="priority" defaultValue="NORMAL">
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="URGENT">Urgent</option>
        </select>
      </label>
      <label className={styles.spanTwo}>Describe it in detail
        <textarea name="details" maxLength={8000} placeholder="Explain exactly what should change, and what it should say or look like afterwards." />
      </label>

      <div className={styles.spanTwo}>
        <label>Screenshots or examples <span>(optional)</span></label>
        <div className={styles.requestImages}>
          {images.map((url) => (
            <div key={url} className={styles.requestImage}>
              <Image src={url} alt="Attached example" fill sizes="180px" />
              <button type="button" onClick={() => setImages((current) => current.filter((entry) => entry !== url))} aria-label="Remove image"><X size={13} /></button>
            </div>
          ))}
          {images.length < 8 && <label className={styles.requestUpload}>
            {uploading ? <LoaderCircle size={18} className={styles.spinner} /> : <UploadCloud size={18} />}
            <span>{uploading ? 'Uploading…' : 'Add image'}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading}
              onChange={(event) => { void uploadImage(event.target.files?.[0]); event.target.value = '' }} />
          </label>}
        </div>
        {uploadError && <p className={styles.uploadError} role="alert"><TriangleAlert size={15} /><span>{uploadError}</span></p>}
      </div>

      <div className={styles.spanTwo}>
        <button className={styles.primaryButton} disabled={busy}>Submit request</button>
      </div>
    </form>}

    <div className={styles.enquiryWorkspace}>
      <div className={styles.enquiryList}>
        {visible.length === 0 && <div className={styles.empty}>Nothing here yet.<br />Use “New request” to ask for a change.</div>}
        {visible.map((entry) => (
          <button key={entry.id} className={selected?.id === entry.id ? styles.enquiryItemActive : styles.enquiryItem}
            onClick={() => { setSelected(entry); setComposing(false) }}>
            <span className={styles.enquiryItemIcon}><ClipboardList size={16} /></span>
            <span className={styles.enquiryItemText}>
              <small>{entry.reference}{entry.page_area ? ` · ${entry.page_area}` : ''}</small>
              <strong>{entry.title}</strong>
              <span>{entry.requested_by_name || 'Unknown'} · {priorityLabels[entry.priority]} priority</span>
              <time>{formatDate(entry.created_at)}</time>
            </span>
            <em className={styles[`requestStatus${entry.status}`]}>{statusLabels[entry.status]}</em>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>

      <div className={styles.enquiryDetail}>
        {!selected ? (
          <div className={styles.enquiryBlank}><ClipboardList size={40} /><h3>Select a request</h3><p>Choose one from the list to read it in full.</p></div>
        ) : (
          <>
            <div className={styles.enquiryDetailHead}>
              <div>
                <p className={styles.kicker}>{selected.reference}</p>
                <h2>{selected.title}</h2>
                <span>{selected.requested_by_name || 'Unknown'} · {formatDate(selected.created_at)}{selected.page_area ? ` · ${selected.page_area}` : ''}</span>
              </div>
              <em className={styles[`requestStatus${selected.status}`]}>{statusLabels[selected.status]}</em>
            </div>

            {selected.details && <div className={styles.customerMessage}>
              <div><ClipboardList size={15} /> What was asked for</div>
              <p>{selected.details}</p>
            </div>}

            {selected.images.length > 0 && <div className={styles.requestImages} style={{ marginTop: 14 }}>
              {selected.images.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className={styles.requestImage}>
                  <Image src={url} alt="Attached example" fill sizes="180px" />
                </a>
              ))}
            </div>}

            {canManage ? <div className={styles.workflowCard}>
              <div><strong>Update this request</strong><small>Everyone who raised or follows it sees the change.</small></div>
              <label>Status
                <select value={selected.status} onChange={(event) => update({ status: event.target.value as RequestStatus, note })}>
                  {(Object.keys(statusLabels) as RequestStatus[]).map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}
                </select>
              </label>
              <label>Priority
                <select value={selected.priority} onChange={(event) => update({ priority: event.target.value as RequestPriority })}>
                  {(Object.keys(priorityLabels) as RequestPriority[]).map((value) => <option key={value} value={value}>{priorityLabels[value]}</option>)}
                </select>
              </label>
              <button className={styles.primaryButton} disabled={busy || !note.trim()} onClick={() => update({ note })}>Add note</button>
              <label className={styles.spanTwo}>Note <span>(optional)</span>
                <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Example: Deployed on staging, waiting for approval" />
              </label>
            </div> : <p className={styles.reportEmpty}>Only an administrator can change the status of a request.</p>}

            <div className={styles.enquiryHistory}>
              <div><h3>History</h3></div>
              {events.map((event) => (
                <div className={styles.enquiryEvent} key={event.id}>
                  <i />
                  <span>
                    <strong>{event.action.replaceAll('_', ' ').toLowerCase()}</strong>
                    <small>{event.actor_name || 'System'} · {formatDate(event.created_at)}</small>
                    {event.note && <p>{event.note}</p>}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  </section>
}
