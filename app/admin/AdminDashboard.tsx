/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Check, ChevronRight, CircleHelp, Code2, Eye, FileCheck2, History, LogOut, PencilLine, Plus, RefreshCw, RotateCcw, Send, ShieldCheck, Users, X } from 'lucide-react'
import type { CmsPermission, CmsUser } from '@/lib/cms-auth'
import type { CmsContentType } from '@/lib/cms-validation'
import { ContentPreview, GuidedEditor } from './GuidedEditor'
import styles from './admin.module.css'

type CmsItem = {
  id: number
  content_type: CmsContentType
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

const labels: Record<CmsContentType, string> = {
  rates: 'Exchange rates',
  promotions: 'Promotions',
  branches: 'Branches',
  news: 'News',
}
const templates: Record<CmsContentType, unknown> = {
  rates: {
    rates: [
      { code: 'USD', name: 'US Dollar', country: 'US', buy: '4.1000', sell: '4.3000' },
      { code: 'SGD', name: 'Singapore Dollar', country: 'SG', buy: '3.1500', sell: '3.2800' },
    ],
    disclaimer: 'Rates are indicative and subject to availability at the branch.',
  },
  promotions: { promotions: [{ slug: 'sample-promotion', title: 'Promotion title', summary: 'Brief promotion description.', active: true, image: '', ctaLabel: 'Learn more', ctaHref: '/contact' }] },
  news: { articles: [{ slug: 'new-hme-update', title: 'HME company update', summary: 'A short summary of the announcement.', body: 'Write the full announcement here.', publishedDate: new Date().toISOString().slice(0, 10), image: '', imageAlt: '', author: 'HME', active: true }] },
  branches: { branches: [{ name: 'Branch name', state: 'Kedah', address: 'Full branch address', phone: '+60', whatsapp: '', hours: 'Mon–Sun', services: ['Currency Exchange', 'Money Transfer'], mapsUrl: '', latitude: null, longitude: null, active: true }] },
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

export default function AdminDashboard({ user, permissions }: { user: CmsUser; permissions: CmsPermission[] }) {
  const [section, setSection] = useState<'publishing' | 'users'>('publishing')
  const [type, setType] = useState<CmsContentType>('rates')
  const [status, setStatus] = useState('')
  const [items, setItems] = useState<CmsItem[]>([])
  const [selected, setSelected] = useState<CmsItem | null>(null)
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [editor, setEditor] = useState(JSON.stringify(templates.rates, null, 2))
  const [editorMode, setEditorMode] = useState<EditorMode>('guided')
  const [note, setNote] = useState('')
  const [schedule, setSchedule] = useState('')
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const can = useCallback((permission: CmsPermission) => permissions.includes(permission), [permissions])

  const parsedPayload = useMemo(() => {
    try { return JSON.parse(editor) as unknown }
    catch { return null }
  }, [editor])

  const load = useCallback(async () => {
    const query = new URLSearchParams({ content_type: type })
    if (status) query.set('status', status)
    try { setItems(await api(`/api/admin/publishing?${query}`)); setError('') }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load content') }
  }, [type, status])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    setSelected(null)
    setEditor(JSON.stringify(templates[type], null, 2))
    setEditorMode('guided')
  }, [type, status])
  useEffect(() => {
    if (!selected) { setEvents([]); setNote(''); setSchedule(''); return }
    setEditor(JSON.stringify(selected.payload, null, 2))
    setNote(selected.change_note || '')
    setSchedule(selected.scheduled_for ? new Date(selected.scheduled_for).toISOString().slice(0, 16) : '')
    setEditorMode('guided')
    void api(`/api/admin/publishing/${selected.id}/events`).then(setEvents).catch(() => setEvents([]))
  }, [selected])

  function flash(text: string) {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 3500)
  }
  function startNew() {
    setSelected(null)
    setEvents([])
    setNote('')
    setSchedule('')
    setEditor(JSON.stringify(templates[type], null, 2))
    setEditorMode('guided')
  }
  function updatePayload(payload: unknown) {
    setEditor(JSON.stringify(payload, null, 2))
  }
  async function save() {
    setBusy(true); setError('')
    try {
      const payload = JSON.parse(editor)
      const body = JSON.stringify({ content_type: type, content_key: 'primary', payload, change_note: note, scheduled_for: schedule ? new Date(schedule).toISOString() : null })
      const item = await api(selected ? `/api/admin/publishing/${selected.id}` : '/api/admin/publishing', { method: selected ? 'PUT' : 'POST', body })
      setSelected(item); flash(selected ? 'Your draft was updated' : 'Your draft was saved'); await load()
    } catch (caught) {
      setError(caught instanceof SyntaxError ? 'The Advanced JSON has an error. Check commas and quotation marks, or return to the Guided form.' : caught instanceof Error ? caught.message : 'Save failed')
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
    const friendlyAction = action === 'submit' ? 'Send this draft for approval' : action === 'publish' ? 'Publish this content to the website' : `${action[0].toUpperCase() + action.slice(1)} version ${selected.version}`
    if (!window.confirm(`${friendlyAction}?`)) return
    setBusy(true); setError('')
    try {
      const result = await api(`/api/admin/publishing/${selected.id}/${action}`, { method: 'POST', body })
      setSelected(result.item || result); flash(result.scheduled ? 'Publishing has been scheduled' : action === 'submit' ? 'Draft sent to a checker' : `Completed: ${action}`); await load()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Action failed') }
    finally { setBusy(false) }
  }
  async function logout() {
    await api('/api/admin/auth/logout', { method: 'POST' }).catch(() => null)
    window.location.assign('/admin/login')
  }
  async function showUsers() {
    setSection('users')
    try { setUsers(await api('/api/admin/users')); setError('') }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load users') }
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
        <button className={section === 'publishing' ? styles.navActive : ''} onClick={() => setSection('publishing')}><FileCheck2 size={19} /> Website content</button>
        {can('users.manage') && <button className={section === 'users' ? styles.navActive : ''} onClick={showUsers}><Users size={19} /> Users & roles</button>}
      </nav>
      <div className={styles.profile}><span className={styles.avatar}>{user.name[0].toUpperCase()}</span><span><strong>{user.name}</strong><small>{user.role}</small></span><button title="Sign out" onClick={logout}><LogOut size={18} /></button></div>
    </aside>

    <main className={styles.main}>
      <header className={styles.topbar}><div><p className={styles.kicker}>HME website manager</p><h1>{section === 'publishing' ? 'Update website content' : 'Users & roles'}</h1></div><div className={styles.secure}><ShieldCheck size={18} /> Approval protection is on</div></header>
      {notice && <div className={styles.success}><Check size={18} /> {notice}</div>}
      {error && <div className={styles.error} role="alert"><X size={18} /><span>{error}</span></div>}

      {section === 'users' ? <section className={styles.userGrid}>
        <div className={styles.panel}><div className={styles.panelHead}><p className={styles.kicker}>Access control</p><h2>Current users</h2></div>
          <div className={styles.userList}>{users.map((entry) => <div className={styles.userRow} key={entry.id}><span className={styles.avatar}>{entry.name[0].toUpperCase()}</span><span><strong>{entry.name}</strong><small>{entry.email}</small></span><b>{entry.role}</b><em>{entry.status}</em></div>)}</div>
        </div>
        <form className={styles.panel} onSubmit={addUser}><div className={styles.panelHead}><p className={styles.kicker}>New account</p><h2>Add user</h2></div>
          <div className={styles.stack}><label>Full name<input name="name" minLength={2} required /></label><label>Email<input name="email" type="email" required /></label><label>Temporary password<input name="password" type="password" minLength={12} required /><small>Minimum 12 characters</small></label><label>Role<select name="role"><option>Website Editor</option><option>Website Checker</option><option>Admin</option></select></label><button className={styles.primaryButton} disabled={busy}><Plus size={18} /> Create user</button></div>
        </form>
      </section> : <>
        <section className={styles.beginnerGuide}>
          <div className={styles.guideTitle}><CircleHelp size={21} /><div><strong>Updating the website is just three steps</strong><span>You never need to touch code. Advanced tools are kept in a separate tab.</span></div></div>
          <ol><li><b>1</b><span><strong>Fill in the form</strong><small>Choose rates, promotions, branches or news.</small></span></li><li><b>2</b><span><strong>Check the preview</strong><small>See how customers will read it.</small></span></li><li><b>3</b><span><strong>Save and submit</strong><small>A different checker approves it.</small></span></li></ol>
        </section>

        <div className={styles.contentTabs}>{(Object.keys(labels) as CmsContentType[]).map((entry) => <button key={entry} className={type === entry ? styles.tabActive : ''} onClick={() => setType(entry)}>{labels[entry]}</button>)}</div>
        <section className={styles.workspace}>
          <div className={styles.listPanel}>
            <div className={styles.listTitle}><strong>Saved drafts & versions</strong><small>Open an item to continue working.</small></div>
            <div className={styles.listTools}><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter saved content"><option value="">All statuses</option>{statuses.map((entry) => <option key={entry}>{entry}</option>)}</select><button title="Refresh" onClick={load}><RefreshCw size={17} /></button>{can('publishing.create') && <button className={styles.newButton} onClick={startNew}><Plus size={17} /> New draft</button>}</div>
            <div className={styles.itemList}>{items.length === 0 && <div className={styles.empty}>Nothing saved yet.<br />Use the form to create your first draft.</div>}{items.map((item) => <button key={item.id} className={selected?.id === item.id ? styles.itemActive : styles.item} onClick={() => setSelected(item)}><span><strong>Version {item.version}</strong><small>{item.created_by_name} · {date(item.updated_at)}</small></span><em className={styles[`status${item.status}`]}>{item.status}</em><ChevronRight size={17} /></button>)}</div>
          </div>

          <div className={styles.editorPanel}>
            <div className={styles.editorHead}><div><p className={styles.kicker}>{labels[type]}</p><h2>{selected ? `Version ${selected.version}` : 'Create a new draft'}</h2><p>{editable ? 'Fill in the details below, then check the Preview before saving.' : 'This version is read-only.'}</p></div>{selected && <em className={styles[`status${selected.status}`]}>{selected.status}</em>}</div>
            {selected?.rejection_reason && <div className={styles.rejection}><strong>Changes requested:</strong> {selected.rejection_reason}</div>}

            <div className={styles.modeTabs} role="tablist" aria-label="Editing view">
              <button role="tab" aria-selected={editorMode === 'guided'} className={editorMode === 'guided' ? styles.modeActive : ''} onClick={() => setEditorMode('guided')}><PencilLine size={17} /><span><strong>Easy editor</strong><small>Recommended</small></span></button>
              <button role="tab" aria-selected={editorMode === 'preview'} className={editorMode === 'preview' ? styles.modeActive : ''} onClick={() => setEditorMode('preview')}><Eye size={17} /><span><strong>Preview</strong><small>Customer view</small></span></button>
              <button role="tab" aria-selected={editorMode === 'advanced'} className={editorMode === 'advanced' ? styles.modeActive : ''} onClick={() => setEditorMode('advanced')}><Code2 size={17} /><span><strong>Advanced</strong><small>JSON code</small></span></button>
            </div>

            {editorMode === 'guided' && <GuidedEditor type={type} payload={parsedPayload} disabled={!editable} onChange={updatePayload} />}
            {editorMode === 'preview' && parsedPayload !== null && <ContentPreview type={type} payload={parsedPayload} />}
            {editorMode === 'preview' && parsedPayload === null && <div className={styles.advancedWarning}>The JSON contains an error. Return to Advanced and correct it before previewing.</div>}
            {editorMode === 'advanced' && <div className={styles.advancedPanel}><div className={styles.advancedWarning}><Code2 size={18} /><span><strong>For technical users only</strong><small>Most staff should use Easy editor. Incorrect punctuation can prevent saving.</small></span></div><label>Content JSON<textarea className={styles.codeEditor} value={editor} onChange={(event) => setEditor(event.target.value)} readOnly={!editable} spellCheck={false} /></label></div>}

            <div className={styles.publishDetails}>
              <div><h3>Before you save</h3><p>Add a short note so the checker understands what changed.</p></div>
              <div className={styles.twoColumns}><label>What did you change? <span>(optional)</span><input value={note} onChange={(event) => setNote(event.target.value)} readOnly={!editable} placeholder="Example: Updated USD and SGD rates" /></label><label>Publish later <span>(optional)</span><input type="datetime-local" value={schedule} onChange={(event) => setSchedule(event.target.value)} disabled={!editable} /><small>Leave empty to publish immediately after approval.</small></label></div>
            </div>

            <div className={styles.actions}>
              {editable && <button className={styles.primaryButton} onClick={save} disabled={busy}>{selected ? 'Save draft changes' : 'Save as draft'}</button>}
              {selected?.status === 'DRAFT' && selected.created_by_user_id === user.id && can('publishing.submit') && <button onClick={() => act('submit')} disabled={busy}><Send size={17} /> Send for approval</button>}
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
