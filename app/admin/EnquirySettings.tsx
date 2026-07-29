'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  CircleDot,
  Eye,
  EyeOff,
  History,
  Mail,
  Plus,
  Route,
  Save,
  ShieldCheck,
  Tags,
  Trash2,
} from 'lucide-react'
import type { EnquiryCategory, EnquiryType } from '@/lib/enquiry'
import styles from './admin.module.css'

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

export default function EnquirySettings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [notificationEmail, setNotificationEmail] = useState('')
  const [routing, setRouting] = useState<Record<EnquiryType, string>>({})
  const [selectedType, setSelectedType] = useState('general')
  const [newCategoryLabel, setNewCategoryLabel] = useState('')
  const [categoryLabelDrafts, setCategoryLabelDrafts] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const categories = useMemo(() => settings?.categories || [], [settings?.categories])
  const selectedCategory = categories.find((category) => category.key === selectedType)
  const categoryLabels = useMemo(
    () => new Map(categories.map((category) => [category.key, category.label])),
    [categories],
  )

  function applySettings(result: NotificationSettings) {
    setSettings(result)
    setNotificationEmail(result.notificationEmail)
    setRouting(result.routing)
    setCategoryLabelDrafts(Object.fromEntries(
      result.categories.map((category) => [category.key, category.label]),
    ))
    setSelectedType((current) => result.categories.some((category) => category.key === current)
      ? current
      : result.categories[0]?.key || 'general')
  }

  function flash(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3500)
  }

  useEffect(() => {
    void adminApi('/api/admin/enquiries/settings')
      .then((result: NotificationSettings) => {
        applySettings(result)
        setError('')
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load enquiry settings'))
  }, [])

  async function saveRouting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    try {
      const result = await adminApi('/api/admin/enquiries/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          notificationEmail,
          route: { type: selectedType, email: routing[selectedType] || '' },
        }),
      }) as NotificationSettings
      applySettings(result)
      flash('Email routing saved')
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save email routing')
    } finally {
      setBusy(false)
    }
  }

  async function addCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newCategoryLabel.trim()) return
    setBusy(true)
    try {
      const created = await adminApi('/api/admin/enquiries/categories', {
        method: 'POST',
        body: JSON.stringify({ label: newCategoryLabel.trim() }),
      }) as EnquiryCategory
      const result = await adminApi('/api/admin/enquiries/settings') as NotificationSettings
      applySettings(result)
      setSelectedType(created.key)
      setNewCategoryLabel('')
      flash(`${created.label} added to the public enquiry form`)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to add enquiry type')
    } finally {
      setBusy(false)
    }
  }

  async function toggleCategory() {
    if (!selectedCategory) return
    setBusy(true)
    try {
      await adminApi('/api/admin/enquiries/categories', {
        method: 'PATCH',
        body: JSON.stringify({ key: selectedCategory.key, active: !selectedCategory.active }),
      })
      const result = await adminApi('/api/admin/enquiries/settings') as NotificationSettings
      applySettings(result)
      flash(`${selectedCategory.label} ${selectedCategory.active ? 'hidden from' : 'shown on'} the public form`)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update enquiry type')
    } finally {
      setBusy(false)
    }
  }

  async function saveCategoryName() {
    if (!selectedCategory) return
    const nextLabel = (categoryLabelDrafts[selectedCategory.key] || '').trim()
    if (!nextLabel || nextLabel === selectedCategory.label) return
    setBusy(true)
    try {
      await adminApi('/api/admin/enquiries/categories', {
        method: 'PATCH',
        body: JSON.stringify({ key: selectedCategory.key, label: nextLabel }),
      })
      const result = await adminApi('/api/admin/enquiries/settings') as NotificationSettings
      applySettings(result)
      flash(`Enquiry type renamed to ${nextLabel}`)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to rename enquiry type')
    } finally {
      setBusy(false)
    }
  }

  async function deleteCategory() {
    if (!selectedCategory || selectedCategory.builtIn) return
    const confirmed = window.confirm(
      `Permanently delete "${selectedCategory.label}"?\n\nThis is available only when no enquiries use this type. The action cannot be undone.`,
    )
    if (!confirmed) return
    const confirmation = window.prompt(`Type ${selectedCategory.label} to confirm deletion`)
    if (confirmation === null) return
    if (confirmation.trim() !== selectedCategory.label) {
      setError('The name did not match. Nothing was deleted.')
      return
    }
    setBusy(true)
    try {
      await adminApi('/api/admin/enquiries/categories', {
        method: 'DELETE',
        body: JSON.stringify({ key: selectedCategory.key, confirmation: confirmation.trim() }),
      })
      const result = await adminApi('/api/admin/enquiries/settings') as NotificationSettings
      applySettings(result)
      flash(`${selectedCategory.label} was permanently deleted`)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete enquiry type')
    } finally {
      setBusy(false)
    }
  }

  return <section className={styles.settingsPage}>
    <div className={styles.settingsWelcome}>
      <div>
        <p className={styles.kicker}>Enquiry setup</p>
        <h2>Send every enquiry to the right team</h2>
        <p>Choose a default inbox, route special topics to a department, and control what customers see in the enquiry form.</p>
      </div>
      <span><ShieldCheck size={20} /> Admin-only settings</span>
    </div>

    <div className={styles.settingsSteps} aria-label="How enquiry routing works">
      <div><b>1</b><span><strong>Set the fallback</strong><small>All unmatched enquiries go to the default inbox.</small></span></div>
      <div><b>2</b><span><strong>Choose a topic</strong><small>Add a department address only where needed.</small></span></div>
      <div><b>3</b><span><strong>Save the route</strong><small>New enquiries follow the updated route immediately.</small></span></div>
    </div>

    {notice && <div className={styles.success}><CheckCircle2 size={18} /> {notice}</div>}
    {error && <div className={styles.error} role="alert"><CircleDot size={18} /><span>{error}</span></div>}

    <form className={styles.settingsCardGrid} onSubmit={saveRouting}>
      <article className={`${styles.settingsTaskCard} ${styles.settingsTaskBlue}`}>
        <span className={styles.settingsTaskIcon}><Mail size={21} /></span>
        <div className={styles.settingsTaskHeading}>
          <small>Step 1 · Fallback address</small>
          <h3>Default enquiry inbox</h3>
          <p>Used whenever a topic does not have its own department email.</p>
        </div>
        <label>Email address
          <input
            type="email"
            value={notificationEmail}
            onChange={(event) => setNotificationEmail(event.target.value)}
            maxLength={254}
            placeholder="info@hmeremit.com.my"
            required
          />
        </label>
        <div className={styles.settingsValueState}>
          <CheckCircle2 size={15} />
          <span><b>Current fallback</b><small>{notificationEmail || 'Not configured'}</small></span>
        </div>
      </article>

      <article className={`${styles.settingsTaskCard} ${styles.settingsTaskPurple}`}>
        <span className={styles.settingsTaskIcon}><Route size={21} /></span>
        <div className={styles.settingsTaskHeading}>
          <small>Step 2 · Department route</small>
          <h3>Route one enquiry type</h3>
          <p>Select a topic and enter its department inbox. Leave it empty to use the default.</p>
        </div>
        <label>Enquiry type
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
            disabled={!categories.length}
          >
            {categories.map((category) => <option key={category.key} value={category.key}>
              {category.label}{category.active ? '' : ' (hidden)'}
            </option>)}
          </select>
        </label>
        <label>Department inbox <span>(optional)</span>
          <input
            type="email"
            value={routing[selectedType] || ''}
            onChange={(event) => setRouting((current) => ({
              ...current,
              [selectedType]: event.target.value,
            }))}
            maxLength={254}
            placeholder={`Uses ${notificationEmail || 'default inbox'}`}
          />
        </label>
        <button className={styles.settingsSaveButton} disabled={busy || !notificationEmail.trim()}>
          <Save size={17} /> {busy ? 'Saving…' : 'Save this email route'}
        </button>
      </article>
    </form>

    <article className={`${styles.settingsTaskCard} ${styles.settingsTaskGreen}`}>
      <span className={styles.settingsTaskIcon}><Tags size={21} /></span>
      <div className={styles.settingsTaskHeading}>
        <small>Customer form</small>
        <h3>Manage enquiry types</h3>
        <p>Add a new topic or hide one from customers. Existing enquiry records remain unchanged.</p>
      </div>
      <div className={styles.settingsCategoryColumns}>
        <form onSubmit={addCategory}>
          <label>New enquiry type
            <input
              value={newCategoryLabel}
              onChange={(event) => setNewCategoryLabel(event.target.value)}
              minLength={3}
              maxLength={80}
              placeholder="Example: Corporate partnership"
              required
            />
          </label>
          <button disabled={busy || !newCategoryLabel.trim()}><Plus size={17} /> Add to form</button>
        </form>
        <div className={styles.settingsCategoryControl}>
          <label>Manage existing type
            <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
              {categories.map((category) => <option key={category.key} value={category.key}>
                {category.label}{category.active ? '' : ' (hidden)'}
              </option>)}
            </select>
          </label>
          <label>Display name
            <input
              value={selectedCategory ? categoryLabelDrafts[selectedCategory.key] || '' : ''}
              onChange={(event) => {
                if (!selectedCategory) return
                setCategoryLabelDrafts((current) => ({
                  ...current,
                  [selectedCategory.key]: event.target.value,
                }))
              }}
              minLength={3}
              maxLength={80}
              disabled={!selectedCategory}
            />
          </label>
          <div className={styles.settingsCategoryActions}>
            <span className={selectedCategory?.active ? styles.categoryVisible : styles.categoryHidden}>
              {selectedCategory?.active ? <Eye size={15} /> : <EyeOff size={15} />}
              {selectedCategory?.active ? 'Visible to customers' : 'Hidden from customers'}
            </span>
            <button
              type="button"
              onClick={() => void saveCategoryName()}
              disabled={busy || !selectedCategory
                || (categoryLabelDrafts[selectedCategory.key] || '').trim() === selectedCategory.label}
            >
              <Save size={16} /> Save name
            </button>
            <button
              type="button"
              onClick={() => void toggleCategory()}
              disabled={busy || !selectedCategory || selectedType === 'general'}
            >
              {selectedCategory?.active ? <EyeOff size={16} /> : <Eye size={16} />}
              {selectedCategory?.active ? 'Hide from form' : 'Show on form'}
            </button>
            {!selectedCategory?.builtIn && <button
              type="button"
              className={styles.settingsDeleteButton}
              onClick={() => void deleteCategory()}
              disabled={busy || !selectedCategory}
            >
              <Trash2 size={16} /> Delete type
            </button>}
          </div>
          {selectedType === 'general'
            ? <small>General enquiry always remains available as the safe fallback.</small>
            : selectedCategory?.builtIn
              ? <small>This is a built-in type. You can rename or hide it, but it cannot be permanently deleted.</small>
              : <small>Custom types can be permanently deleted only when no enquiry records use them.</small>}
        </div>
      </div>
    </article>

    <div className={styles.settingsFooterGrid}>
      <div className={styles.settingsSecurityCard}>
        <ShieldCheck size={21} />
        <span><strong>Email security remains protected</strong><small>Only the recipient changes here. DNS records and delivery credentials remain in the secure server configuration.</small></span>
      </div>
      <div className={styles.settingsHistoryCard}>
        <div><History size={18} /><strong>Recent routing changes</strong></div>
        {!settings?.history.length && <p>No routing changes yet.</p>}
        {settings?.history.slice(0, 4).map((entry) => <span key={entry.id}>
          <Mail size={14} />
          <b>{entry.enquiryType ? categoryLabels.get(entry.enquiryType) || entry.enquiryType : 'Default inbox'}</b>
          <small>{entry.newValue || 'Uses default inbox'} · {entry.actorName} · {formatDate(entry.createdAt)}</small>
        </span>)}
      </div>
    </div>
  </section>
}
