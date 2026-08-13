/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ChevronRight, CircleHelp, Code2, Eye, FileCheck2, History, Inbox, LogOut, PencilLine, Plus, RefreshCw, RotateCcw, Send, Settings2, ClipboardList, ShieldCheck, Star, Trash2, Users, X } from 'lucide-react'
import type { CmsPermission, CmsUser } from '@/lib/cms-auth'
import type { CmsContentType } from '@/lib/cms-validation'
import { ContentPreview, GuidedEditor } from './GuidedEditor'
import EnquiriesManager from './EnquiriesManager'
import EnquirySettings from './EnquirySettings'
import GoogleReviewsPanel from './GoogleReviewsPanel'
import WebsiteRequests from './WebsiteRequests'
import styles from './admin.module.css'
import { globalContentTemplate } from '@/lib/global-content'
import { hydratePagePayload, pageTemplate, websitePages } from '@/lib/page-content'

type CmsItem = {
  id: number
  content_type: CmsContentType
  content_key: string
  version: number
  status: string
  payload: unknown
  change_note: string
  created_by_user_id: number
  created_by_name: string
  rejection_reason?: string
  scheduled_for?: string | null
  updated_at: string
}
type AuditEvent = { id: number; action: string; actor_name: string; note?: string; created_at: string }
type ManagedUser = { id: number; name: string; email: string; role: string; status: string }
type EditorMode = 'guided' | 'preview' | 'advanced'
export type AdminSection = 'publishing' | 'enquiries' | 'enquiry-settings' | 'users' | 'reviews' | 'requests'

const labels: Record<CmsContentType, string> = {
  pages: 'Website pages',
  global: 'Global content',
  rates: 'Exchange rates',
  'transfer-rates': 'Transfer rates',
  promotions: 'Promotions',
  branches: 'Branches',
  news: 'News',
  blog: 'Blog',
  careers: 'Careers',
  contact: 'Contact details',
}
const templates: Record<CmsContentType, unknown> = {
  pages: pageTemplate('home'),
  global: globalContentTemplate,
  rates: {
    visible: true,
    rates: [{ code: 'USD', name: 'US Dollar', country: 'US', buy: '', sell: '' }],
    disclaimer: 'Rates are indicative and subject to availability at the branch.',
  },
  'transfer-rates': {
    visible: true,
    rates: [{ countryCode: 'ID', country: 'Indonesia', currency: 'IDR', rate: '', fee: '', active: true }],
    disclaimer: 'Rates and fees are indicative. Confirm the final amount with your selected branch.',
  },
  promotions: { promotions: [{ slug: 'sample-promotion', title: 'Promotion title', summary: 'Brief promotion description.', active: true, image: '', ctaLabel: 'Learn more', ctaHref: '/contact' }] },
  branches: { branches: [{ name: 'Branch name', state: 'Kedah', address: 'Full branch address', phone: '+60', whatsapp: '', hours: 'Mon-Sun', services: ['Currency Exchange', 'Money Transfer'], mapsUrl: '', latitude: null, longitude: null, active: true }] },
  news: { articles: [{ slug: 'new-hme-update', title: 'HME company update', summary: 'A short summary of the announcement.', body: 'Write the full announcement here.', publishedDate: new Date().toISOString().slice(0, 10), image: '', imageAlt: '', author: 'HME', active: true }] },
  blog: { posts: [{ slug: 'new-guide', title: 'Helpful customer guide', summary: 'A short introduction to this guide.', body: 'Write the full guide here.', publishedDate: new Date().toISOString().slice(0, 10), image: '', imageAlt: '', author: 'HME', category: 'Guides', active: true }] },
  careers: {
    heroImage: '',
    heroImageAlt: '',
    intro: 'Join a team where compliance, technology and customer service come together.',
    generalApplicationsEmail: 'careers@hmeremit.com.my',
    jobs: [{ slug: 'new-vacancy', title: 'Job title', location: 'Head Office', employmentType: 'Full-time', summary: 'A short overview of the role.', description: 'Describe the responsibilities and requirements.', applyEmail: 'careers@hmeremit.com.my', applyUrl: '', active: true }],
  },
  contact: {
    headline: "We're here to help",
    lead: 'Questions about rates, a transaction, booking or partnership? Choose the channel that works best for you.',
    phone: '+604 421 3811',
    whatsappUrl: 'https://wa.me/6044213811',
    email: 'info@hmeremit.com.my',
    addressLine1: 'No. 25C, Bangunan Ban Bee, Jalan Kampung Baru',
    addressLine2: '08000 Sungai Petani, Kedah',
    mapsUrl: '',
    supportHeading: 'Talk directly to the right team',
    supportNote: 'Tell us what you need and include any relevant transaction reference. Never send passwords, PINs or full card details.',
    services: ['Latest rates and availability', 'Money transfer support', 'Currency booking', 'Business or agent inquiry'],
  },
}
const statuses = ['DRAFT', 'REJECTED', 'PENDING', 'APPROVED', 'PUBLISHED', 'ARCHIVED']

function date(value?: string | null) {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat('en-MY', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed)
}
async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } })
  const body = await response.json().catch(() => ({}))
  if (response.status === 401) {
    window.location.assign('/admin/login')
    throw new Error('Session expired')
  }
  if (!response.ok) {
    const details = Array.isArray(body.errors) ? body.errors.map((entry: { path?: string; message?: string }) => `${entry.path || 'content'}: ${entry.message || 'Invalid'}`).join('\n') : ''
    throw new Error(details || body.error || 'Request failed')
  }
  return body
}

export default function AdminDashboard({
  user,
  permissions,
  initialSection = 'publishing',
}: {
  user: CmsUser
  permissions: CmsPermission[]
  initialSection?: AdminSection
}) {
  const section = initialSection
  const [type, setType] = useState<CmsContentType>('pages')
  const [contentKey, setContentKey] = useState('home')
  const [status, setStatus] = useState('ACTIVE')
  const [items, setItems] = useState<CmsItem[]>([])
  const [selected, setSelected] = useState<CmsItem | null>(null)
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [editor, setEditor] = useState(JSON.stringify(pageTemplate('home'), null, 2))
  const [editorMode, setEditorMode] = useState<EditorMode>('guided')
  const [note, setNote] = useState('')
  const [schedule, setSchedule] = useState('')
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const activeListRequest = useRef({ type, status, contentKey })
  const seededEditorType = useRef<CmsContentType | null>(null)
  const can = useCallback((permission: CmsPermission) => permissions.includes(permission), [permissions])
  const templateFor = useCallback((contentType: CmsContentType, key: string) => (
    contentType === 'pages' ? pageTemplate(key) : templates[contentType]
  ), [])
  const payloadFor = useCallback((contentType: CmsContentType, key: string, payload?: unknown) => (
    contentType === 'pages' ? hydratePagePayload(key, payload) : payload || templateFor(contentType, key)
  ), [templateFor])

  const parsedPayload = useMemo(() => {
    try { return JSON.parse(editor) as unknown }
    catch { return null }
  }, [editor])

  const load = useCallback(async () => {
    const query = new URLSearchParams({ content_type: type })
    query.set('content_key', contentKey)
    if (status && status !== 'ACTIVE') query.set('status', status)
    try {
      const result = await api(`/api/admin/publishing?${query}`) as CmsItem[]
      if (activeListRequest.current.type === type && activeListRequest.current.status === status && activeListRequest.current.contentKey === contentKey) {
        setItems(status === 'ACTIVE' ? result.filter((item) => item.status !== 'ARCHIVED') : result)
        if (seededEditorType.current !== type) {
          const live = result.find((item) => item.status === 'PUBLISHED')
          setEditor(JSON.stringify(payloadFor(type, contentKey, live?.payload), null, 2))
          seededEditorType.current = type
        }
        setError('')
      }
    } catch (caught) {
      if (activeListRequest.current.type === type && activeListRequest.current.status === status && activeListRequest.current.contentKey === contentKey) setError(caught instanceof Error ? caught.message : 'Unable to load content')
    }
  }, [contentKey, payloadFor, status, type])

  useEffect(() => { activeListRequest.current = { type, status, contentKey } }, [type, status, contentKey])
  useEffect(() => { void load() }, [load])
  useEffect(() => {
    seededEditorType.current = null
    setSelected(null)
    setItems([])
    const nextKey = type === 'pages' ? contentKey : 'primary'
    setEditor(JSON.stringify(payloadFor(type, nextKey), null, 2))
    setEditorMode('guided')
  }, [contentKey, payloadFor, type])
  useEffect(() => { setSelected(null); setItems([]) }, [status])
  useEffect(() => {
    if (!selected) { setEvents([]); setNote(''); setSchedule(''); return }
    setEditor(JSON.stringify(payloadFor(type, contentKey, selected.payload), null, 2))
    setNote(selected.change_note || '')
    setSchedule(selected.scheduled_for ? new Date(selected.scheduled_for).toISOString().slice(0, 16) : '')
    setEditorMode('guided')
    void api(`/api/admin/publishing/${selected.id}/events`).then(setEvents).catch(() => setEvents([]))
  }, [contentKey, payloadFor, selected, type])
  useEffect(() => {
    if (section !== 'users' || !can('users.manage')) return
    void api('/api/admin/users')
      .then((result: ManagedUser[]) => {
        setUsers(result)
        setError('')
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load users'))
  }, [can, section])

  function flash(text: string) {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 3500)
  }
  function startNew(source?: CmsItem) {
    const baseline = source || items.find((item) => item.status === 'PUBLISHED')
    setSelected(null)
    setEvents([])
    setNote('')
    setSchedule('')
    setEditor(JSON.stringify(payloadFor(type, contentKey, baseline?.payload), null, 2))
    setEditorMode('guided')
    flash(baseline ? `Editable copy of Version ${baseline.version} is ready. Your live website has not changed yet.` : 'A new draft is ready.')
  }
  function updatePayload(payload: unknown) {
    setEditor(JSON.stringify(payload, null, 2))
  }
  async function save() {
    setBusy(true); setError('')
    try {
      const payload = JSON.parse(editor)
      const body = JSON.stringify({ content_type: type, content_key: contentKey, payload, change_note: note, scheduled_for: schedule ? new Date(schedule).toISOString() : null })
      const item = await api(selected ? `/api/admin/publishing/${selected.id}` : '/api/admin/publishing', { method: selected ? 'PUT' : 'POST', body })
      setSelected(item); flash(selected ? 'Your draft was updated' : 'Your draft was saved'); await load()
    } catch (caught) {
      setError(caught instanceof SyntaxError ? 'The Advanced JSON has an error. Check commas and quotation marks, or return to the Guided form.' : caught instanceof Error ? caught.message : 'Save failed')
    } finally { setBusy(false) }
  }
  async function directPublish() {
    if (user.role !== 'Admin') return
    if (!window.confirm('Save these changes and publish them to the website now? This skips checker approval.')) return
    setBusy(true); setError('')
    try {
      const payload = JSON.parse(editor)
      const body = JSON.stringify({ content_type: type, content_key: contentKey, payload, change_note: note, scheduled_for: null })
      const item = await api(selected ? `/api/admin/publishing/${selected.id}` : '/api/admin/publishing', { method: selected ? 'PUT' : 'POST', body })
      const result = await api(`/api/admin/publishing/${item.id}/direct-publish`, { method: 'POST' })
      setSelected(result.item); setSchedule(''); flash('Saved and published to the website'); await load()
    } catch (caught) {
      setError(caught instanceof SyntaxError ? 'The Advanced JSON has an error. Correct it before publishing.' : caught instanceof Error ? caught.message : 'Direct publishing failed')
    } finally { setBusy(false) }
  }
  async function act(action: string) {
    if (!selected) return
    let body: string | undefined
    if (action === 'reject') {
      const reason = window.prompt('Tell the editor what needs to be corrected')
      if (!reason) return
      body = JSON.stringify({ reason })
    }
    const friendlyAction = action === 'submit' ? 'Send this draft for approval' : action === 'publish' ? 'Publish this content to the website' : action === 'discard' ? `Discard draft Version ${selected.version}. It will leave the active list but remain in audit history` : `${action[0].toUpperCase() + action.slice(1)} version ${selected.version}`
    if (!window.confirm(`${friendlyAction}?`)) return
    setBusy(true); setError('')
    try {
      const result = await api(`/api/admin/publishing/${selected.id}/${action}`, { method: 'POST', body })
      if (action === 'discard') {
        const live = items.find((item) => item.status === 'PUBLISHED')
        setSelected(null)
        setEditor(JSON.stringify(payloadFor(type, contentKey, live?.payload), null, 2))
        flash(`Draft Version ${selected.version} was discarded`)
        await load()
        return
      }
      setSelected(result.item || result); flash(result.scheduled ? 'Publishing has been scheduled' : action === 'submit' ? 'Draft sent to a checker' : `Completed: ${action}`); await load()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Action failed') }
    finally { setBusy(false) }
  }
  async function logout() {
    await api('/api/admin/auth/logout', { method: 'POST' }).catch(() => null)
    window.location.assign('/admin/login')
  }
  async function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setBusy(true)
    try {
      await api('/api/admin/users', { method: 'POST', body: JSON.stringify({ name: form.get('name'), email: form.get('email'), password: form.get('password'), role: form.get('role') }) })
      formElement.reset(); setUsers(await api('/api/admin/users')); flash('User created'); setError('')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to create user') }
    finally { setBusy(false) }
  }

  const editable = selected ? ['DRAFT', 'REJECTED'].includes(selected.status) && selected.created_by_user_id === user.id : can('publishing.create')

  return <div className={`admin-root ${styles.adminShell}`}>
    <aside className={styles.sidebar}>
      <div className={styles.brand}><Image src="/logo.png" alt="HME" width={82} height={49} priority /><span><strong>Website Admin</strong><small>Simple content manager</small></span></div>
      <nav>
        <Link className={section === 'publishing' ? styles.navActive : ''} href="/admin"><FileCheck2 size={19} /> Website content</Link>
        {can('enquiries.view') && <Link className={section === 'enquiries' ? styles.navActive : ''} href="/admin?section=enquiries"><Inbox size={19} /> Enquiries</Link>}
        {can('reviews.manage') && <Link className={section === 'reviews' ? styles.navActive : ''} href="/admin?section=reviews"><Star size={19} /> Google Reviews</Link>}
        {can('requests.view') && <Link className={section === 'requests' ? styles.navActive : ''} href="/admin?section=requests"><ClipboardList size={19} /> Change requests</Link>}
        {can('settings.manage') && <Link className={section === 'enquiry-settings' ? styles.navActive : ''} href="/admin/enquiry-settings"><Settings2 size={19} /> Enquiry settings</Link>}
        {can('users.manage') && <Link className={section === 'users' ? styles.navActive : ''} href="/admin?section=users"><Users size={19} /> Users & roles</Link>}
      </nav>
      <div className={styles.profile}><span className={styles.avatar}>{user.name[0].toUpperCase()}</span><span><strong>{user.name}</strong><small>{user.role}</small></span><button title="Sign out" onClick={logout}><LogOut size={18} /></button></div>
    </aside>

    <main className={styles.main}>
      <header className={styles.topbar}><div><p className={styles.kicker}>HME website manager</p><h1>{section === 'publishing' ? 'Update website content' : section === 'enquiries' ? 'Customer enquiries' : section === 'enquiry-settings' ? 'Enquiry settings' : section === 'reviews' ? 'Google reviews' : section === 'requests' ? 'Website change requests' : 'Users & roles'}</h1></div><div className={styles.secure}><ShieldCheck size={18} /> {section === 'enquiries' ? 'Customer data access is protected' : section === 'enquiry-settings' ? 'Admin access only' : section === 'reviews' ? 'Admin access only' : section === 'requests' ? 'Every signed-in user can raise a request' : 'Role-based publishing is on'}</div></header>
      {notice && <div className={styles.success}><Check size={18} /> {notice}</div>}
      {error && <div className={styles.error} role="alert"><X size={18} /><span>{error}</span></div>}

      {section === 'enquiry-settings' ? <EnquirySettings /> : section === 'reviews' ? <GoogleReviewsPanel /> : section === 'requests' ? <WebsiteRequests canManage={can('requests.manage')} /> : section === 'enquiries' ? <EnquiriesManager canManageSettings={can('settings.manage')} /> : section === 'users' ? <section className={styles.userGrid}>
        <div className={styles.panel}><div className={styles.panelHead}><p className={styles.kicker}>Access control</p><h2>Current users</h2></div>
          <div className={styles.userList}>{users.map((entry) => <div className={styles.userRow} key={entry.id}><span className={styles.avatar}>{entry.name[0].toUpperCase()}</span><span><strong>{entry.name}</strong><small>{entry.email}</small></span><b>{entry.role}</b><em>{entry.status}</em></div>)}</div>
        </div>
        <form className={styles.panel} onSubmit={addUser}><div className={styles.panelHead}><p className={styles.kicker}>New account</p><h2>Add user</h2></div>
          <div className={styles.stack}><label>Full name<input name="name" minLength={2} required /></label><label>Email<input name="email" type="email" required /></label><label>Temporary password<input name="password" type="password" minLength={12} required /><small>Minimum 12 characters</small></label><label>Role<select name="role"><option>Website Editor</option><option>Website Checker</option><option>Admin</option></select></label><button className={styles.primaryButton} disabled={busy}><Plus size={18} /> Create user</button></div>
        </form>
      </section> : <>
        <section className={styles.beginnerGuide}>
          <div className={styles.guideTitle}><CircleHelp size={21} /><div><strong>Updating the website is just three steps</strong><span>You never need to touch code. Advanced tools are kept in a separate tab.</span></div></div>
          <ol><li><b>1</b><span><strong>Choose one item</strong><small>Edit an existing card or add a new one.</small></span></li><li><b>2</b><span><strong>Preview it</strong><small>Check how customers will see the content.</small></span></li><li><b>3</b><span><strong>Publish changes</strong><small>Your live website changes only after this step.</small></span></li></ol>
        </section>

        <div className={styles.contentTabs}>{(Object.keys(labels) as CmsContentType[]).map((entry) => <button key={entry} className={type === entry ? styles.tabActive : ''} onClick={() => { setType(entry); setContentKey(entry === 'pages' ? 'home' : 'primary') }}>{labels[entry]}</button>)}</div>
        {type === 'pages' && <section className={styles.pagePicker}>
          <div><p className={styles.kicker}>Choose a page</p><h2>Edit one page at a time</h2><span>The live page will not change until you publish.</span></div>
          <label>Website page<select value={contentKey} onChange={(event) => setContentKey(event.target.value)}>{websitePages.map((page) => <option key={page.key} value={page.key}>{page.name} · {page.path}</option>)}</select></label>
          <a href={websitePages.find((page) => page.key === contentKey)?.path || '/'} target="_blank" rel="noreferrer"><Eye size={16} /> View current page</a>
        </section>}
        <section className={styles.workspace}>
          <div className={styles.listPanel}>
            <div className={styles.listTitle}><strong>Website versions</strong><small>Live content and unfinished drafts are kept here.</small></div>
            <div className={styles.listTools}><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter saved content"><option value="ACTIVE">Active versions</option><option value="">All versions</option>{statuses.map((entry) => <option key={entry} value={entry}>{entry === 'ARCHIVED' ? 'Archived history' : entry}</option>)}</select><button title="Refresh" onClick={load}><RefreshCw size={17} /></button>{status === 'ACTIVE' && can('publishing.create') && <button className={styles.newButton} onClick={() => startNew()}><PencilLine size={17} /> {items.some((item) => item.status === 'PUBLISHED') ? 'Edit live' : 'New draft'}</button>}</div>
            <div className={styles.itemList}>{items.length === 0 && <div className={styles.empty}>Nothing saved yet.<br />Use the form to create your first draft.</div>}{items.map((item) => <button key={item.id} className={selected?.id === item.id ? styles.itemActive : styles.item} onClick={() => setSelected(item)}><span><strong>Version {item.version}</strong><small>{item.created_by_name} · {date(item.updated_at)}</small></span><em className={styles[`status${item.status}`]}>{item.status}</em><ChevronRight size={17} /></button>)}</div>
          </div>

          <div className={styles.editorPanel}>
            <div className={styles.editorHead}><div><p className={styles.kicker}>{labels[type]}</p><h2>{selected?.status === 'PUBLISHED' ? `Live website · Version ${selected.version}` : selected ? `Draft · Version ${selected.version}` : 'Edit website content'}</h2><p>{editable ? 'Choose one item below. Your live website stays unchanged until you publish.' : 'This saved version is read-only. Create an editable copy to make changes.'}</p></div><div className={styles.editorHeadActions}>{selected && <em className={styles[`status${selected.status}`]}>{selected.status === 'PUBLISHED' ? 'LIVE' : selected.status}</em>}{selected && !editable && can('publishing.create') && <button type="button" onClick={() => startNew(selected)}><PencilLine size={15} /> Edit this version</button>}</div></div>
            {selected?.rejection_reason && <div className={styles.rejection}><strong>Changes requested:</strong> {selected.rejection_reason}</div>}

            <div className={styles.modeTabs} role="tablist" aria-label="Editing view">
              <button role="tab" aria-selected={editorMode === 'guided'} className={editorMode === 'guided' ? styles.modeActive : ''} onClick={() => setEditorMode('guided')}><PencilLine size={17} /><span><strong>Edit content</strong><small>Simple form</small></span></button>
              <button role="tab" aria-selected={editorMode === 'preview'} className={editorMode === 'preview' ? styles.modeActive : ''} onClick={() => setEditorMode('preview')}><Eye size={17} /><span><strong>Page preview</strong><small>All items</small></span></button>
              <button role="tab" aria-selected={editorMode === 'advanced'} className={editorMode === 'advanced' ? styles.modeActive : ''} onClick={() => setEditorMode('advanced')}><Code2 size={17} /><span><strong>Developer tools</strong><small>JSON code</small></span></button>
            </div>

            {editorMode === 'guided' && <GuidedEditor type={type} payload={parsedPayload} disabled={!editable} onChange={updatePayload} />}
            {editorMode === 'preview' && parsedPayload !== null && <ContentPreview type={type} payload={parsedPayload} />}
            {editorMode === 'preview' && parsedPayload === null && <div className={styles.advancedWarning}>The JSON contains an error. Return to Advanced and correct it before previewing.</div>}
            {editorMode === 'advanced' && <div className={styles.advancedPanel}><div className={styles.advancedWarning}><Code2 size={18} /><span><strong>For technical users only</strong><small>Most staff should use Easy editor. Incorrect punctuation can prevent saving.</small></span></div><label>Content JSON<textarea className={styles.codeEditor} value={editor} onChange={(event) => setEditor(event.target.value)} readOnly={!editable} spellCheck={false} /></label></div>}

            {editable && <div className={styles.publishDetails}>
              <div><h3>Before you save</h3><p>Add a short note so the checker understands what changed.</p></div>
              <div className={styles.twoColumns}><label>What did you change? <span>(optional)</span><input value={note} onChange={(event) => setNote(event.target.value)} readOnly={!editable} placeholder="Example: Updated USD and SGD rates" /></label><label>Publish later <span>(optional)</span><input type="datetime-local" value={schedule} onChange={(event) => setSchedule(event.target.value)} disabled={!editable} /><small>Leave empty to publish immediately after approval.</small></label></div>
            </div>}

            <div className={styles.actions}>
              {editable && <button className={styles.primaryButton} onClick={save} disabled={busy}>{selected ? 'Save draft only' : 'Save as draft only'}</button>}
              {editable && user.role === 'Admin' && <button className={styles.approveButton} onClick={directPublish} disabled={busy}><Check size={17} /> Publish changes now</button>}
              {selected?.status === 'DRAFT' && selected.created_by_user_id === user.id && can('publishing.submit') && <button onClick={() => act('submit')} disabled={busy}><Send size={17} /> Send for approval</button>}
              {selected && ['DRAFT', 'REJECTED'].includes(selected.status) && (selected.created_by_user_id === user.id || user.role === 'Admin') && <button className={styles.rejectButton} onClick={() => act('discard')} disabled={busy}><Trash2 size={17} /> Discard this draft</button>}
              {selected?.status === 'PENDING' && can('publishing.approve') && <><button className={styles.approveButton} onClick={() => act('approve')} disabled={busy}><Check size={17} /> Approve content</button><button className={styles.rejectButton} onClick={() => act('reject')} disabled={busy}><X size={17} /> Request changes</button></>}
              {selected?.status === 'APPROVED' && can('publishing.publish') && <button className={styles.approveButton} onClick={() => act('publish')} disabled={busy}><Check size={17} /> {selected.scheduled_for ? 'Confirm scheduled publishing' : 'Publish to website'}</button>}
              {selected && ['PUBLISHED', 'ARCHIVED'].includes(selected.status) && can('publishing.create') && <button onClick={() => act('rollback')} disabled={busy}><RotateCcw size={17} /> Restore this version</button>}
            </div>
          </div>

          <aside className={styles.auditPanel}><div className={styles.panelHead}><p className={styles.kicker}>Activity history</p><h2><History size={18} /> Who changed what</h2></div>{!selected && <div className={styles.empty}>Select a saved version to see its history.</div>}{events.map((event) => <div className={styles.event} key={event.id}><i /><span><strong>{event.action.replaceAll('_', ' ')}</strong><small>{event.actor_name || 'System'} · {date(event.created_at)}</small>{event.note && <p>{event.note}</p>}</span></div>)}</aside>
        </section>
      </>}
    </main>
  </div>
}
