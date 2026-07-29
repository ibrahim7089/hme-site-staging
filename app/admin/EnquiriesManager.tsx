/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Archive,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Inbox,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react'
import { enquiryTypeLabels, type EnquiryCategory, type EnquiryType } from '@/lib/enquiry'
import type { EmailDeliveryStatus, EnquiryRecord, EnquiryStatus } from '@/lib/enquiry-service'
import styles from './admin.module.css'

type EnquiryEvent = {
  id: number
  action: string
  actor_name: string
  from_status?: string | null
  to_status?: string | null
  note?: string
  created_at: string
}

type Assignee = { id: number; name: string }
type Counts = Record<EnquiryStatus, number>
type EnquiryResponse = {
  items: EnquiryRecord[]
  counts: Counts
  assignees: Assignee[]
  categories: EnquiryCategory[]
}
type NotificationSettings = {
  notificationEmail: string
  routing: Record<EnquiryType, string>
  categories: EnquiryCategory[]
  source: 'admin' | 'server-default'
  updatedByName: string
  updatedAt: string | null
  history: Array<{
    id: number
    enquiryType: EnquiryType | null
    oldValue: string
    newValue: string
    actorName: string
    createdAt: string
  }>
}

const statusLabels: Record<EnquiryStatus, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  ARCHIVED: 'Archived',
}

const statusIcons = {
  NEW: CircleDot,
  IN_PROGRESS: Clock3,
  RESOLVED: CheckCircle2,
  ARCHIVED: Archive,
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('en-MY', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed)
}

async function adminApi(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  const body = await response.json().catch(() => ({}))
  if (response.status === 401) {
    window.location.assign('/admin/login')
    throw new Error('Session expired')
  }
  if (!response.ok) throw new Error(body.error || 'Request failed')
  return body
}

function readableAction(event: EnquiryEvent) {
  if (event.action === 'STATUS_CHANGED') {
    return `Status changed to ${statusLabels[event.to_status as EnquiryStatus] || event.to_status}`
  }
  const labels: Record<string, string> = {
    CREATED: 'Enquiry received',
    ASSIGNED: 'Assigned to staff',
    UNASSIGNED: 'Assignment removed',
    INTERNAL_NOTE_ADDED: 'Internal note added',
    EMAIL_NOTIFICATION_SENT: 'Email notification delivered',
    EMAIL_NOTIFICATION_FAILED: 'Email notification failed',
    CUSTOMER_ACKNOWLEDGEMENT_SENT: 'Customer confirmation delivered',
    CUSTOMER_ACKNOWLEDGEMENT_FAILED: 'Customer confirmation failed',
  }
  return labels[event.action] || event.action.replaceAll('_', ' ').toLowerCase()
}

function EmailStatus({ status }: { status: EmailDeliveryStatus }) {
  return <span className={styles[`email${status}`]}>
    <Mail size={13} />
    {status === 'SENT' ? 'Email delivered' : status === 'FAILED' ? 'Saved; email alert failed' : 'Sending email'}
  </span>
}

export default function EnquiriesManager({ canManageSettings }: { canManageSettings: boolean }) {
  const [items, setItems] = useState<EnquiryRecord[]>([])
  const [selected, setSelected] = useState<EnquiryRecord | null>(null)
  const [events, setEvents] = useState<EnquiryEvent[]>([])
  const [assignees, setAssignees] = useState<Assignee[]>([])
  const [enquiryCategories, setEnquiryCategories] = useState<EnquiryCategory[]>([])
  const [counts, setCounts] = useState<Counts>({ NEW: 0, IN_PROGRESS: 0, RESOLVED: 0, ARCHIVED: 0 })
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | 'ALL'>('ALL')
  const [typeFilter, setTypeFilter] = useState<EnquiryType | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [draftStatus, setDraftStatus] = useState<EnquiryStatus>('NEW')
  const [draftAssignee, setDraftAssignee] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [settingsBusy, setSettingsBusy] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null)
  const [notificationEmail, setNotificationEmail] = useState('')
  const [notificationRouting, setNotificationRouting] = useState<Record<EnquiryType, string>>({})
  const [selectedRouteType, setSelectedRouteType] = useState('general')
  const [newCategoryLabel, setNewCategoryLabel] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    const query = new URLSearchParams()
    if (statusFilter !== 'ALL') query.set('status', statusFilter)
    if (typeFilter !== 'ALL') query.set('type', typeFilter)
    if (search.trim()) query.set('q', search.trim())
    try {
      const result = await adminApi(`/api/admin/enquiries?${query}`) as EnquiryResponse
      setItems(result.items)
      setCounts(result.counts)
      setAssignees(result.assignees)
      setEnquiryCategories(result.categories)
      setSelected((current) => {
        if (!current) return result.items[0] || null
        return result.items.find((item) => item.id === current.id) || result.items[0] || null
      })
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load enquiries')
    }
  }, [search, statusFilter, typeFilter])

  useEffect(() => {
    const timeout = window.setTimeout(() => { void load() }, 250)
    return () => window.clearTimeout(timeout)
  }, [load])

  useEffect(() => {
    if (!canManageSettings) return
    void adminApi('/api/admin/enquiries/settings')
      .then((result: NotificationSettings) => {
        setNotificationSettings(result)
        setNotificationEmail(result.notificationEmail)
        setNotificationRouting(result.routing)
        setEnquiryCategories(result.categories)
        setSelectedRouteType((current) => result.categories.some((category) => category.key === current)
          ? current
          : result.categories[0]?.key || 'general')
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load notification settings'))
  }, [canManageSettings])

  useEffect(() => {
    if (!selected) {
      setEvents([])
      return
    }
    setDraftStatus(selected.status)
    setDraftAssignee(selected.assigned_to_user_id ? String(selected.assigned_to_user_id) : '')
    setNote('')
    void adminApi(`/api/admin/enquiries/${selected.id}`)
      .then(setEvents)
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load activity'))
  }, [selected])

  const totalEnquiries = counts.NEW + counts.IN_PROGRESS + counts.RESOLVED + counts.ARCHIVED
  const hasWorkflowChanges = selected
    ? draftStatus !== selected.status || draftAssignee !== (selected.assigned_to_user_id ? String(selected.assigned_to_user_id) : '')
    : false

  const selectedIndex = useMemo(
    () => items.findIndex((item) => item.id === selected?.id),
    [items, selected],
  )
  const categories = notificationSettings?.categories || enquiryCategories
  const categoryLabels = useMemo(
    () => new Map(categories.map((category) => [category.key, category.label])),
    [categories],
  )
  const labelForType = useCallback(
    (type: string, savedLabel?: string) => savedLabel || categoryLabels.get(type) || enquiryTypeLabels[type] || type,
    [categoryLabels],
  )

  function flash(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3500)
  }

  async function updateWorkflow() {
    if (!selected || !hasWorkflowChanges) return
    setBusy(true)
    try {
      const updated = await adminApi(`/api/admin/enquiries/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: draftStatus,
          assignedToUserId: draftAssignee ? Number(draftAssignee) : null,
        }),
      }) as EnquiryRecord
      setSelected(updated)
      await load()
      flash('Enquiry updated')
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update enquiry')
    } finally {
      setBusy(false)
    }
  }

  async function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !note.trim()) return
    setBusy(true)
    try {
      await adminApi(`/api/admin/enquiries/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ note: note.trim() }),
      })
      setNote('')
      setEvents(await adminApi(`/api/admin/enquiries/${selected.id}`))
      flash('Internal note added')
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to add note')
    } finally {
      setBusy(false)
    }
  }

  async function deleteSelectedEnquiry() {
    if (!selected || !canManageSettings) return
    const confirmed = window.confirm(
      `Permanently delete ${selected.reference}?\n\nThis removes the customer details, message, notes and activity history. This action cannot be undone.`,
    )
    if (!confirmed) return
    const typedReference = window.prompt(`Type ${selected.reference} to confirm permanent deletion`)
    if (typedReference === null) return
    if (typedReference.trim() !== selected.reference) {
      setError('The reference did not match. Nothing was deleted.')
      return
    }
    setBusy(true)
    try {
      await adminApi(`/api/admin/enquiries/${selected.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ reference: typedReference.trim() }),
      })
      setSelected(null)
      setEvents([])
      await load()
      flash(`Enquiry ${typedReference.trim()} was permanently deleted`)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete enquiry')
    } finally {
      setBusy(false)
    }
  }

  async function saveNotificationEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSettingsBusy(true)
    try {
      const result = await adminApi('/api/admin/enquiries/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          notificationEmail,
          route: {
            type: selectedRouteType,
            email: notificationRouting[selectedRouteType] || '',
          },
        }),
      }) as NotificationSettings
      setNotificationSettings(result)
      setNotificationEmail(result.notificationEmail)
      setNotificationRouting(result.routing)
      setEnquiryCategories(result.categories)
      flash('Enquiry email routing updated')
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update notification email')
    } finally {
      setSettingsBusy(false)
    }
  }

  async function addEnquiryCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newCategoryLabel.trim()) return
    setSettingsBusy(true)
    try {
      const created = await adminApi('/api/admin/enquiries/categories', {
        method: 'POST',
        body: JSON.stringify({ label: newCategoryLabel.trim() }),
      }) as EnquiryCategory
      const result = await adminApi('/api/admin/enquiries/settings') as NotificationSettings
      setNotificationSettings(result)
      setNotificationRouting(result.routing)
      setEnquiryCategories(result.categories)
      setSelectedRouteType(created.key)
      setNewCategoryLabel('')
      flash(`${created.label} added to the enquiry form`)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to add enquiry type')
    } finally {
      setSettingsBusy(false)
    }
  }

  async function toggleEnquiryCategory(category: EnquiryCategory) {
    setSettingsBusy(true)
    try {
      await adminApi('/api/admin/enquiries/categories', {
        method: 'PATCH',
        body: JSON.stringify({ key: category.key, active: !category.active }),
      })
      const result = await adminApi('/api/admin/enquiries/settings') as NotificationSettings
      setNotificationSettings(result)
      setNotificationRouting(result.routing)
      setEnquiryCategories(result.categories)
      flash(`${category.label} ${category.active ? 'hidden from' : 'shown on'} the enquiry form`)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update enquiry type')
    } finally {
      setSettingsBusy(false)
    }
  }

  return <section className={styles.enquirySection}>
    <div className={styles.enquiryIntro}>
      <div><p className={styles.kicker}>Customer inbox</p><h2>Every enquiry in one place</h2><p>New submissions are saved here first. Email is used as a notification, so no enquiry is lost if delivery is delayed.</p></div>
      <div className={styles.enquirySummary}>
        <button className={statusFilter === 'ALL' ? styles.summaryActive : ''} onClick={() => setStatusFilter('ALL')}><Inbox size={19} /><span><b>{totalEnquiries}</b><small>All</small></span></button>
        <button className={statusFilter === 'NEW' ? styles.summaryActive : ''} onClick={() => setStatusFilter('NEW')}><CircleDot size={19} /><span><b>{counts.NEW}</b><small>New</small></span></button>
        <button className={statusFilter === 'IN_PROGRESS' ? styles.summaryActive : ''} onClick={() => setStatusFilter('IN_PROGRESS')}><Clock3 size={19} /><span><b>{counts.IN_PROGRESS}</b><small>In progress</small></span></button>
        <button className={statusFilter === 'RESOLVED' ? styles.summaryActive : ''} onClick={() => setStatusFilter('RESOLVED')}><CheckCircle2 size={19} /><span><b>{counts.RESOLVED}</b><small>Resolved</small></span></button>
      </div>
    </div>

    {notice && <div className={styles.success}><CheckCircle2 size={18} /> {notice}</div>}
    {error && <div className={styles.error} role="alert"><CircleDot size={18} /><span>{error}</span></div>}

    {canManageSettings && <section className={styles.notificationSettings}>
      <div className={styles.notificationSettingsIntro}>
        <span className={styles.notificationSettingsIcon}><Settings2 size={20} /></span>
        <div>
          <p className={styles.kicker}>Admin settings</p>
          <h3>Route enquiries to the right department</h3>
          <p>Set one default inbox, then add a department email for any category that needs separate handling. Every enquiry is still saved here first.</p>
        </div>
      </div>
      <form className={styles.notificationRoutingForm} onSubmit={saveNotificationEmail}>
        <label className={styles.notificationDefaultEmail}>Default enquiry inbox
          <span>
            <Mail size={16} />
            <input
              type="email"
              value={notificationEmail}
              onChange={(event) => setNotificationEmail(event.target.value)}
              maxLength={254}
              placeholder="info@hmeremit.com.my"
              required
            />
          </span>
          <small>Used whenever the selected category does not have its own department email.</small>
        </label>
        <div className={styles.notificationRoutingPicker}>
          <label>Enquiry type
            <select
              value={selectedRouteType}
              onChange={(event) => setSelectedRouteType(event.target.value)}
              disabled={!categories.length}
            >
              {categories.map((category) => <option key={category.key} value={category.key}>
                {category.label}{category.active ? '' : ' (hidden)'}
              </option>)}
            </select>
          </label>
          <label>Department inbox <small>(optional)</small>
            <span>
              <Mail size={15} />
              <input
                type="email"
                value={notificationRouting[selectedRouteType] || ''}
                onChange={(event) => setNotificationRouting((current) => ({
                  ...current,
                  [selectedRouteType]: event.target.value,
                }))}
                maxLength={254}
                placeholder={`Uses ${notificationEmail || 'default inbox'}`}
              />
            </span>
          </label>
        </div>
        <button className={styles.primaryButton} disabled={settingsBusy || !notificationEmail.trim()}>
          <Save size={16} /> {settingsBusy ? 'Saving...' : 'Save email routing'}
        </button>
      </form>
      <div className={styles.enquiryCategoryManager}>
        <div>
          <strong>Add another enquiry type</strong>
          <small>It will appear automatically in the public enquiry form.</small>
        </div>
        <form onSubmit={addEnquiryCategory}>
          <input
            value={newCategoryLabel}
            onChange={(event) => setNewCategoryLabel(event.target.value)}
            minLength={3}
            maxLength={80}
            placeholder="Example: Corporate partnership"
            required
          />
          <button className={styles.secondaryButton} disabled={settingsBusy || !newCategoryLabel.trim()}>
            <Plus size={16} /> Add enquiry type
          </button>
        </form>
        {categories.find((category) => category.key === selectedRouteType) && <div className={styles.enquiryCategoryStatus}>
          <span>
            <b>{labelForType(selectedRouteType)}</b>
            <small>{categories.find((category) => category.key === selectedRouteType)?.active
              ? 'Visible in the public enquiry form'
              : 'Hidden from the public enquiry form'}</small>
          </span>
          <button
            type="button"
            disabled={settingsBusy || selectedRouteType === 'general'}
            onClick={() => {
              const category = categories.find((item) => item.key === selectedRouteType)
              if (category) void toggleEnquiryCategory(category)
            }}
          >
            {categories.find((category) => category.key === selectedRouteType)?.active
              ? 'Hide from form'
              : 'Show on form'}
          </button>
        </div>}
      </div>
      <div className={styles.notificationSettingsNote}>
        <ShieldCheck size={17} />
        <span><strong>DNS and email security stay protected.</strong><small>Only the alert recipient changes here. Resend credentials and DNS records remain in the secure server setup.</small></span>
      </div>
      {notificationSettings?.updatedAt && <div className={styles.notificationSettingsHistory}>
        <strong>Recent changes</strong>
        {notificationSettings.history.slice(0, 3).map((entry) => <span key={entry.id}>
          <Mail size={13} />
          <b>{entry.enquiryType ? labelForType(entry.enquiryType) : 'Default inbox'}: {entry.newValue || 'Uses default inbox'}</b>
          <small>by {entry.actorName} · {formatDate(entry.createdAt)}</small>
        </span>)}
      </div>}
    </section>}

    <div className={styles.enquiryTools}>
      <label className={styles.enquirySearch}><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, reference, email or message" aria-label="Search enquiries" /></label>
      <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as EnquiryType | 'ALL')} aria-label="Filter by enquiry type">
        <option value="ALL">All enquiry types</option>
        {categories.map((category) => <option key={category.key} value={category.key}>
          {category.label}{category.active ? '' : ' (hidden)'}
        </option>)}
      </select>
      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as EnquiryStatus | 'ALL')} aria-label="Filter by status">
        <option value="ALL">All statuses</option>
        {(Object.keys(statusLabels) as EnquiryStatus[]).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
      </select>
      <button title="Refresh enquiries" onClick={() => void load()}><RefreshCw size={17} /></button>
    </div>

    <div className={styles.enquiryWorkspace}>
      <div className={styles.enquiryList}>
        {items.length === 0 && <div className={styles.empty}>No enquiries match this view.</div>}
        {items.map((item) => {
          const StatusIcon = statusIcons[item.status]
          return <button key={item.id} className={selected?.id === item.id ? styles.enquiryItemActive : styles.enquiryItem} onClick={() => setSelected(item)}>
            <span className={styles.enquiryItemIcon}><StatusIcon size={17} /></span>
            <span className={styles.enquiryItemText}>
              <small>{item.reference} · {labelForType(item.enquiry_type, item.enquiry_type_label)}</small>
              <strong>{item.customer_name}</strong>
              <span>{item.subject || item.message}</span>
              <time>{formatDate(item.created_at)}</time>
            </span>
            <em className={styles[`enquiryStatus${item.status}`]}>{statusLabels[item.status]}</em>
            <ChevronRight size={17} />
          </button>
        })}
      </div>

      <div className={styles.enquiryDetail}>
        {!selected && <div className={styles.enquiryBlank}><Inbox size={32} /><h3>Select an enquiry</h3><p>Customer details, status and activity will appear here.</p></div>}
        {selected && <>
          <div className={styles.enquiryDetailHead}>
            <div><p className={styles.kicker}>{labelForType(selected.enquiry_type, selected.enquiry_type_label)}</p><h2>{selected.subject || 'Customer enquiry'}</h2><span>{selected.reference} · received {formatDate(selected.created_at)}</span></div>
            <EmailStatus status={selected.email_delivery_status} />
          </div>

          <div className={styles.workflowCard}>
            <div><strong>Move this enquiry forward</strong><small>Assign an owner and keep the status current.</small></div>
            <label>Status<select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as EnquiryStatus)}>{(Object.keys(statusLabels) as EnquiryStatus[]).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
            <label>Assigned to<select value={draftAssignee} onChange={(event) => setDraftAssignee(event.target.value)}><option value="">Unassigned</option>{assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name}</option>)}</select></label>
            <button className={styles.primaryButton} onClick={updateWorkflow} disabled={busy || !hasWorkflowChanges}><Save size={16} /> Save</button>
          </div>

          <div className={styles.customerGrid}>
            <div><Mail size={17} /><span><small>Email</small><strong>{selected.customer_email}</strong></span></div>
            <div><Phone size={17} /><span><small>Phone</small><strong>{selected.customer_phone}</strong></span></div>
            <div><MessageSquareText size={17} /><span><small>Preferred contact</small><strong>{selected.preferred_contact}</strong></span></div>
            <div><MapPin size={17} /><span><small>City / branch</small><strong>{selected.location || 'Not provided'}</strong></span></div>
          </div>

          <div className={styles.customerMessage}><div><MessageSquareText size={17} /><strong>Customer message</strong></div><p>{selected.message}</p></div>

          <form className={styles.noteForm} onSubmit={addNote}>
            <label><UserRound size={17} /><span><strong>Add an internal note</strong><small>Only signed-in HME staff can see these notes.</small></span></label>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1200} placeholder="Example: Called customer; waiting for transaction reference." required />
            <button className={styles.primaryButton} disabled={busy || !note.trim()}>Add note</button>
          </form>

          <div className={styles.enquiryHistory}>
            <div><p className={styles.kicker}>Activity history</p><h3>What happened</h3></div>
            {events.length === 0 && <p className={styles.empty}>No activity yet.</p>}
            {events.map((entry) => <div className={styles.enquiryEvent} key={entry.id}><i /><span><strong>{readableAction(entry)}</strong><small>{entry.actor_name || 'System'} · {formatDate(entry.created_at)}</small>{entry.note && <p>{entry.note}</p>}</span></div>)}
          </div>

          <div className={styles.recordNavigation}>
            <span>{selectedIndex + 1} of {items.length}</span>
            <div><button disabled={selectedIndex <= 0} onClick={() => setSelected(items[selectedIndex - 1])}>Previous</button><button disabled={selectedIndex < 0 || selectedIndex >= items.length - 1} onClick={() => setSelected(items[selectedIndex + 1])}>Next</button></div>
          </div>
          {canManageSettings && <div className={styles.enquiryDangerZone}>
            <span><strong>Permanent deletion</strong><small>Removes customer details, message, internal notes and activity history. This cannot be undone.</small></span>
            <button type="button" onClick={deleteSelectedEnquiry} disabled={busy}><Trash2 size={16} /> Delete permanently</button>
          </div>}
        </>}
      </div>
    </div>
  </section>
}
