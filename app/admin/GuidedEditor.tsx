'use client'

import { useState } from 'react'
import Image from 'next/image'
import { BadgePercent, Banknote, BookOpenText, BriefcaseBusiness, Building2, Contact, LoaderCircle, MapPin, Newspaper, Plus, SendHorizontal, Trash2, UploadCloud } from 'lucide-react'
import type { CmsContentType } from '@/lib/cms-validation'
import styles from './admin.module.css'

type Props = {
  type: CmsContentType
  payload: unknown
  disabled: boolean
  onChange: (payload: unknown) => void
}

type Entry = Record<string, unknown>

function record(value: unknown): Entry {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Entry : {}
}

function text(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function checked(value: unknown) {
  return value !== false
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) || 'new-item'
}

function SectionTitle({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <div className={styles.formIntro}><span>{icon}</span><div><h3>{title}</h3><p>{description}</p></div></div>
}


function ImageUploadField({
  value,
  alt,
  disabled,
  onChange,
}: {
  value: string
  alt: string
  disabled: boolean
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function upload(file?: File) {
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      setError('Image must be smaller than 4 MB.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('image', file)
      const response = await fetch('/api/admin/uploads', { method: 'POST', body: form })
      const result = await response.json().catch(() => ({}))
      if (response.status === 401) {
        window.location.assign('/admin/login')
        return
      }
      if (!response.ok) throw new Error(result.error || 'Upload failed')
      onChange(String(result.url))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return <div className={styles.imageUpload}>
    {value ? <div className={styles.uploadedPreview}>
      <Image src={value} alt={alt || 'Uploaded content image'} fill sizes="600px" className={styles.uploadedImage} />
      {!disabled && <button type="button" onClick={() => onChange('')}>Remove image</button>}
    </div> : <div className={styles.imagePlaceholder}><UploadCloud size={25} /><span>No image selected</span></div>}
    <div className={styles.uploadActions}>
      <label className={styles.uploadButton}>{uploading ? <LoaderCircle size={17} className={styles.spinner} /> : <UploadCloud size={17} />}
        {uploading ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={disabled || uploading} onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = '' }} />
      </label>
      <small>JPG, PNG, WebP or AVIF. Maximum 4 MB. Landscape images work best.</small>
    </div>
    {error && <p className={styles.uploadError}>{error}</p>}
  </div>
}

function RatesEditor({ payload, disabled, onChange }: Omit<Props, 'type'>) {
  const root = record(payload)
  const rows = Array.isArray(root.rates) ? root.rates.map(record) : []
  const commit = (next: Entry[]) => onChange({ ...root, rates: next })
  const update = (index: number, key: string, value: string) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  const remove = (index: number) => commit(rows.filter((_, rowIndex) => rowIndex !== index))
  const add = () => commit([...rows, { code: '', name: '', country: '', buy: '', sell: '' }])

  return <div className={styles.guidedEditor}>
    <SectionTitle icon={<Banknote size={20} />} title="Enter exchange rates" description="One row for each currency. No coding or brackets needed." />
    <label className={styles.visibilityControl}><input type="checkbox" checked={checked(root.visible)} onChange={(event) => onChange({ ...root, visible: event.target.checked })} disabled={disabled} /><span><strong>Show exchange rates online</strong><small>Switch this off and publish to show the &quot;Online rates are being updated&quot; notice.</small></span></label>
    <div className={styles.rateTableWrap}>
      <table className={styles.formTable}>
        <thead><tr><th>Currency code</th><th>Currency name</th><th>Country code</th><th>We buy</th><th>We sell</th><th><span className="sr-only">Remove</span></th></tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>
          <td><input aria-label={`Currency code row ${index + 1}`} value={text(row.code)} onChange={(event) => update(index, 'code', event.target.value.toUpperCase().slice(0, 3))} placeholder="USD" maxLength={3} disabled={disabled} /></td>
          <td><input aria-label={`Currency name row ${index + 1}`} value={text(row.name)} onChange={(event) => update(index, 'name', event.target.value)} placeholder="US Dollar" disabled={disabled} /></td>
          <td><input aria-label={`Country code row ${index + 1}`} value={text(row.country)} onChange={(event) => update(index, 'country', event.target.value.toUpperCase().slice(0, 2))} placeholder="US" maxLength={2} disabled={disabled} /></td>
          <td><input aria-label={`Buy rate row ${index + 1}`} value={text(row.buy)} onChange={(event) => update(index, 'buy', event.target.value)} placeholder="4.1000" inputMode="decimal" disabled={disabled} /></td>
          <td><input aria-label={`Sell rate row ${index + 1}`} value={text(row.sell)} onChange={(event) => update(index, 'sell', event.target.value)} placeholder="4.3000" inputMode="decimal" disabled={disabled} /></td>
          <td><button className={styles.iconDanger} type="button" title="Remove currency" onClick={() => remove(index)} disabled={disabled}><Trash2 size={17} /></button></td>
        </tr>)}</tbody>
      </table>
    </div>
    {rows.length === 0 && <div className={styles.blankState}>No currencies saved. Keep online rates switched off before saving.</div>}
    <button className={styles.addRowButton} type="button" onClick={add} disabled={disabled}><Plus size={17} /> Add another currency</button>
    <label className={styles.fullField}>Rate notice shown to customers
      <textarea value={text(root.disclaimer)} onChange={(event) => onChange({ ...root, disclaimer: event.target.value })} placeholder="Example: Rates are indicative and subject to availability." maxLength={500} disabled={disabled} />
      <small>Keep this short and clear. Maximum 500 characters.</small>
    </label>
  </div>
}


function TransferRatesEditor({ payload, disabled, onChange }: Omit<Props, 'type'>) {
  const root = record(payload)
  const rows = Array.isArray(root.rates) ? root.rates.map(record) : []
  const commit = (next: Entry[]) => onChange({ ...root, rates: next })
  const update = (index: number, key: string, value: unknown) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  const remove = (index: number) => commit(rows.filter((_, rowIndex) => rowIndex !== index))
  const add = () => commit([...rows, { countryCode: '', country: '', currency: '', rate: '', fee: '', active: true }])

  return <div className={styles.guidedEditor}>
    <SectionTitle icon={<SendHorizontal size={20} />} title="Enter money transfer rates" description="Use one row for each destination and payout currency. Fees can be left empty." />
    <label className={styles.visibilityControl}><input type="checkbox" checked={checked(root.visible)} onChange={(event) => onChange({ ...root, visible: event.target.checked })} disabled={disabled} /><span><strong>Show transfer rates online</strong><small>Switch this off and publish to show the &quot;Online rates are being updated&quot; notice.</small></span></label>
    <div className={styles.rateTableWrap}>
      <table className={styles.formTable}>
        <thead><tr><th>Destination</th><th>Country code</th><th>Currency</th><th>Rate / MYR</th><th>Fee (MYR)</th><th>Visible</th><th><span className="sr-only">Remove</span></th></tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>
          <td><input aria-label={'Destination row ' + (index + 1)} value={text(row.country)} onChange={(event) => update(index, 'country', event.target.value)} placeholder="Indonesia" disabled={disabled} /></td>
          <td><input aria-label={'Country code row ' + (index + 1)} value={text(row.countryCode)} onChange={(event) => update(index, 'countryCode', event.target.value.toUpperCase().slice(0, 2))} placeholder="ID" maxLength={2} disabled={disabled} /></td>
          <td><input aria-label={'Currency row ' + (index + 1)} value={text(row.currency)} onChange={(event) => update(index, 'currency', event.target.value.toUpperCase().slice(0, 3))} placeholder="IDR" maxLength={3} disabled={disabled} /></td>
          <td><input aria-label={'Transfer rate row ' + (index + 1)} value={text(row.rate)} onChange={(event) => update(index, 'rate', event.target.value)} placeholder="3500.00" inputMode="decimal" disabled={disabled} /></td>
          <td><input aria-label={'Transfer fee row ' + (index + 1)} value={text(row.fee)} onChange={(event) => update(index, 'fee', event.target.value)} placeholder="0.00" inputMode="decimal" disabled={disabled} /></td>
          <td><input aria-label={'Visible row ' + (index + 1)} type="checkbox" checked={checked(row.active)} onChange={(event) => update(index, 'active', event.target.checked)} disabled={disabled} /></td>
          <td><button className={styles.iconDanger} type="button" title="Remove destination" onClick={() => remove(index)} disabled={disabled}><Trash2 size={17} /></button></td>
        </tr>)}</tbody>
      </table>
    </div>
    {rows.length === 0 && <div className={styles.blankState}>No destinations saved. Keep online rates switched off before saving.</div>}
    <button className={styles.addRowButton} type="button" onClick={add} disabled={disabled}><Plus size={17} /> Add destination</button>
    <label className={styles.fullField}>Rate notice shown to customers
      <textarea value={text(root.disclaimer)} onChange={(event) => onChange({ ...root, disclaimer: event.target.value })} placeholder="Rates and fees are indicative. Confirm the final amount with your branch." maxLength={500} disabled={disabled} />
      <small>Maximum 500 characters.</small>
    </label>
  </div>
}

function PromotionsEditor({ payload, disabled, onChange }: Omit<Props, 'type'>) {
  const root = record(payload)
  const rows = Array.isArray(root.promotions) ? root.promotions.map(record) : []
  const commit = (next: Entry[]) => onChange({ ...root, promotions: next })
  const update = (index: number, key: string, value: unknown) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  const updateTitle = (index: number, value: string) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, title: value, slug: slugify(value) } : row))
  const add = () => commit([...rows, { slug: 'new-promotion', title: '', summary: '', image: '', ctaLabel: 'Learn more', ctaHref: '/contact', active: true }])
  const remove = (index: number) => commit(rows.filter((_, rowIndex) => rowIndex !== index))

  return <div className={styles.guidedEditor}>
    <SectionTitle icon={<BadgePercent size={20} />} title="Create promotions" description="Add the customer-facing title, dates and call-to-action. The URL name is created automatically." />
    <div className={styles.cardList}>{rows.map((row, index) => <section className={styles.formCard} key={index}>
      <div className={styles.formCardHead}><div><span>Promotion {index + 1}</span><strong>{text(row.title) || 'Untitled promotion'}</strong></div><label className={styles.switchLabel}><input type="checkbox" checked={checked(row.active)} onChange={(event) => update(index, 'active', event.target.checked)} disabled={disabled} /> Active</label><button className={styles.iconDanger} type="button" title="Remove promotion" onClick={() => remove(index)} disabled={disabled}><Trash2 size={17} /></button></div>
      <div className={styles.formGrid}>
        <label className={styles.spanTwo}>Promotion title<input value={text(row.title)} onChange={(event) => updateTitle(index, event.target.value)} placeholder="Send money and save" maxLength={140} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Short description<textarea value={text(row.summary)} onChange={(event) => update(index, 'summary', event.target.value)} placeholder="Explain the offer in one or two sentences." maxLength={500} disabled={disabled} /></label>
        <label>Start date<input type="date" value={text(row.startDate)} onChange={(event) => update(index, 'startDate', event.target.value || undefined)} disabled={disabled} /></label>
        <label>End date<input type="date" value={text(row.endDate)} onChange={(event) => update(index, 'endDate', event.target.value || undefined)} disabled={disabled} /></label>
        <label>Button text<input value={text(row.ctaLabel)} onChange={(event) => update(index, 'ctaLabel', event.target.value)} placeholder="Learn more" disabled={disabled} /></label>
        <label>Button link<input value={text(row.ctaHref)} onChange={(event) => update(index, 'ctaHref', event.target.value)} placeholder="/contact" disabled={disabled} /></label>
        <div className={styles.spanTwo}><label>Promotion image</label><ImageUploadField value={text(row.image)} alt={text(row.title)} disabled={disabled} onChange={(url) => update(index, 'image', url)} /></div>
        <label className={styles.spanTwo}>URL name <input value={text(row.slug)} onChange={(event) => update(index, 'slug', slugify(event.target.value))} placeholder="send-money-and-save" disabled={disabled} /><small>Automatically generated from the title. Lowercase letters and dashes only.</small></label>
      </div>
    </section>)}</div>
    {rows.length === 0 && <div className={styles.blankState}>No promotion added yet. You can publish an empty list to hide all promotions.</div>}
    <button className={styles.addRowButton} type="button" onClick={add} disabled={disabled}><Plus size={17} /> Add promotion</button>
  </div>
}


function NewsEditor({ payload, disabled, onChange }: Omit<Props, 'type'>) {
  const root = record(payload)
  const rows = Array.isArray(root.articles) ? root.articles.map(record) : []
  const commit = (next: Entry[]) => onChange({ ...root, articles: next })
  const update = (index: number, key: string, value: unknown) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  const updateTitle = (index: number, value: string) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, title: value, slug: slugify(value), imageAlt: text(row.imageAlt) || value } : row))
  const add = () => commit([...rows, { slug: 'new-article', title: '', summary: '', body: '', publishedDate: new Date().toISOString().slice(0, 10), image: '', imageAlt: '', author: 'HME', active: true }])
  const remove = (index: number) => commit(rows.filter((_, rowIndex) => rowIndex !== index))

  return <div className={styles.guidedEditor}>
    <SectionTitle icon={<Newspaper size={20} />} title="Publish company news" description="Create announcements, branch updates and company stories with a photo." />
    <div className={styles.cardList}>{rows.map((row, index) => <section className={styles.formCard} key={index}>
      <div className={styles.formCardHead}><div><span>News article {index + 1}</span><strong>{text(row.title) || 'Untitled article'}</strong></div><label className={styles.switchLabel}><input type="checkbox" checked={checked(row.active)} onChange={(event) => update(index, 'active', event.target.checked)} disabled={disabled} /> Visible</label><button className={styles.iconDanger} type="button" title="Remove article" onClick={() => remove(index)} disabled={disabled}><Trash2 size={17} /></button></div>
      <div className={styles.formGrid}>
        <label className={styles.spanTwo}>Headline<input value={text(row.title)} onChange={(event) => updateTitle(index, event.target.value)} placeholder="HME opens a new branch" maxLength={180} disabled={disabled} /></label>
        <label>News date<input type="date" value={text(row.publishedDate)} onChange={(event) => update(index, 'publishedDate', event.target.value)} disabled={disabled} /></label>
        <label>Author<input value={text(row.author)} onChange={(event) => update(index, 'author', event.target.value)} placeholder="HME" maxLength={100} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Short summary<textarea value={text(row.summary)} onChange={(event) => update(index, 'summary', event.target.value)} placeholder="A short introduction shown on the News card." maxLength={500} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Full article<textarea className={styles.articleBody} value={text(row.body)} onChange={(event) => update(index, 'body', event.target.value)} placeholder="Write the full announcement here. Use blank lines between paragraphs." maxLength={20000} disabled={disabled} /></label>
        <div className={styles.spanTwo}><label>Article image</label><ImageUploadField value={text(row.image)} alt={text(row.imageAlt) || text(row.title)} disabled={disabled} onChange={(url) => update(index, 'image', url)} /></div>
        {text(row.image) && <label className={styles.spanTwo}>Image description (for accessibility)<input value={text(row.imageAlt)} onChange={(event) => update(index, 'imageAlt', event.target.value)} placeholder="Describe what is shown in the image" maxLength={180} disabled={disabled} /></label>}
        <label className={styles.spanTwo}>URL name<input value={text(row.slug)} onChange={(event) => update(index, 'slug', slugify(event.target.value))} disabled={disabled} /><small>Created automatically from the headline.</small></label>
      </div>
    </section>)}</div>
    {rows.length === 0 && <div className={styles.blankState}>No news article added yet.</div>}
    <button className={styles.addRowButton} type="button" onClick={add} disabled={disabled}><Plus size={17} /> Add news article</button>
  </div>
}


function BlogEditor({ payload, disabled, onChange }: Omit<Props, 'type'>) {
  const root = record(payload)
  const rows = Array.isArray(root.posts) ? root.posts.map(record) : []
  const commit = (next: Entry[]) => onChange({ ...root, posts: next })
  const update = (index: number, key: string, value: unknown) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  const updateTitle = (index: number, value: string) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, title: value, slug: slugify(value), imageAlt: text(row.imageAlt) || value } : row))
  const add = () => commit([...rows, { slug: 'new-guide', title: '', summary: '', body: '', publishedDate: new Date().toISOString().slice(0, 10), image: '', imageAlt: '', author: 'HME', category: 'Guides', active: true }])
  const remove = (index: number) => commit(rows.filter((_, rowIndex) => rowIndex !== index))

  return <div className={styles.guidedEditor}>
    <SectionTitle icon={<BookOpenText size={20} />} title="Publish helpful blog posts" description="Create guides and educational content with a cover image, author and category." />
    <div className={styles.cardList}>{rows.map((row, index) => <section className={styles.formCard} key={index}>
      <div className={styles.formCardHead}><div><span>Blog post {index + 1}</span><strong>{text(row.title) || 'Untitled post'}</strong></div><label className={styles.switchLabel}><input type="checkbox" checked={checked(row.active)} onChange={(event) => update(index, 'active', event.target.checked)} disabled={disabled} /> Visible</label><button className={styles.iconDanger} type="button" title="Remove post" onClick={() => remove(index)} disabled={disabled}><Trash2 size={17} /></button></div>
      <div className={styles.formGrid}>
        <label className={styles.spanTwo}>Post title<input value={text(row.title)} onChange={(event) => updateTitle(index, event.target.value)} placeholder="5 things to check before exchanging currency" maxLength={180} disabled={disabled} /></label>
        <label>Publish date<input type="date" value={text(row.publishedDate)} onChange={(event) => update(index, 'publishedDate', event.target.value)} disabled={disabled} /></label>
        <label>Category<input value={text(row.category)} onChange={(event) => update(index, 'category', event.target.value)} placeholder="Travel tips" maxLength={80} disabled={disabled} /></label>
        <label>Author<input value={text(row.author)} onChange={(event) => update(index, 'author', event.target.value)} placeholder="HME" maxLength={100} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Short summary<textarea value={text(row.summary)} onChange={(event) => update(index, 'summary', event.target.value)} placeholder="A short introduction shown on the Blog card." maxLength={500} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Full post<textarea className={styles.articleBody} value={text(row.body)} onChange={(event) => update(index, 'body', event.target.value)} placeholder="Write the full guide here. Use blank lines between paragraphs." maxLength={20000} disabled={disabled} /></label>
        <div className={styles.spanTwo}><label>Cover image</label><ImageUploadField value={text(row.image)} alt={text(row.imageAlt) || text(row.title)} disabled={disabled} onChange={(url) => update(index, 'image', url)} /></div>
        {text(row.image) && <label className={styles.spanTwo}>Image description<input value={text(row.imageAlt)} onChange={(event) => update(index, 'imageAlt', event.target.value)} placeholder="Describe what is shown in the image" maxLength={180} disabled={disabled} /></label>}
        <label className={styles.spanTwo}>URL name<input value={text(row.slug)} onChange={(event) => update(index, 'slug', slugify(event.target.value))} disabled={disabled} /><small>Created automatically from the post title.</small></label>
      </div>
    </section>)}</div>
    {rows.length === 0 && <div className={styles.blankState}>No blog post added yet.</div>}
    <button className={styles.addRowButton} type="button" onClick={add} disabled={disabled}><Plus size={17} /> Add blog post</button>
  </div>
}

function CareersEditor({ payload, disabled, onChange }: Omit<Props, 'type'>) {
  const root = record(payload)
  const rows = Array.isArray(root.jobs) ? root.jobs.map(record) : []
  const commitRoot = (key: string, value: unknown) => onChange({ ...root, [key]: value })
  const commit = (next: Entry[]) => onChange({ ...root, jobs: next })
  const update = (index: number, key: string, value: unknown) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  const updateTitle = (index: number, value: string) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, title: value, slug: slugify(value) } : row))
  const add = () => commit([...rows, { slug: 'new-vacancy', title: '', location: '', employmentType: 'Full-time', summary: '', description: '', applyEmail: text(root.generalApplicationsEmail), applyUrl: '', active: true }])
  const remove = (index: number) => commit(rows.filter((_, rowIndex) => rowIndex !== index))

  return <div className={styles.guidedEditor}>
    <SectionTitle icon={<BriefcaseBusiness size={20} />} title="Manage careers and vacancies" description={`${rows.length} ${rows.length === 1 ? 'vacancy' : 'vacancies'} currently listed. Edit the roles below or add a new one.`} />
    <section className={styles.formCard}>
      <div className={styles.formCardHead}><div><span>Careers page</span><strong>Page introduction</strong></div></div>
      <div className={styles.formGrid}>
        <label className={styles.spanTwo}>Introductory message<textarea value={text(root.intro)} onChange={(event) => commitRoot('intro', event.target.value)} maxLength={500} disabled={disabled} /></label>
        <label className={styles.spanTwo}>General applications email<input type="email" value={text(root.generalApplicationsEmail)} onChange={(event) => commitRoot('generalApplicationsEmail', event.target.value)} placeholder="careers@example.com" disabled={disabled} /></label>
      </div>
    </section>
    <section className={styles.formCard}>
      <div className={styles.formCardHead}><div><span>Vacancies</span><strong>{rows.length} {rows.length === 1 ? 'role' : 'roles'} available to edit</strong></div></div>
    </section>
    <div className={styles.cardList}>{rows.map((row, index) => <section className={styles.formCard} key={index}>
      <div className={styles.formCardHead}><div><span>Vacancy {index + 1}</span><strong>{text(row.title) || 'Untitled role'}</strong></div><label className={styles.switchLabel}><input type="checkbox" checked={checked(row.active)} onChange={(event) => update(index, 'active', event.target.checked)} disabled={disabled} /> Open</label><button className={styles.iconDanger} type="button" title="Remove vacancy" onClick={() => remove(index)} disabled={disabled}><Trash2 size={17} /></button></div>
      <div className={styles.formGrid}>
        <label className={styles.spanTwo}>Job title<input value={text(row.title)} onChange={(event) => updateTitle(index, event.target.value)} placeholder="Branch Customer Service Officer" maxLength={160} disabled={disabled} /></label>
        <label>Location<input value={text(row.location)} onChange={(event) => update(index, 'location', event.target.value)} placeholder="Head Office" maxLength={120} disabled={disabled} /></label>
        <label>Employment type<input value={text(row.employmentType)} onChange={(event) => update(index, 'employmentType', event.target.value)} placeholder="Full-time" maxLength={80} disabled={disabled} /></label>
        <label>Closing date <span>(optional)</span><input type="date" value={text(row.closingDate)} onChange={(event) => update(index, 'closingDate', event.target.value || undefined)} disabled={disabled} /></label>
        <label>Application email<input type="email" value={text(row.applyEmail)} onChange={(event) => update(index, 'applyEmail', event.target.value || undefined)} placeholder="careers@example.com" disabled={disabled} /></label>
        <label className={styles.spanTwo}>Short role summary<textarea value={text(row.summary)} onChange={(event) => update(index, 'summary', event.target.value)} maxLength={500} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Responsibilities and requirements<textarea className={styles.articleBody} value={text(row.description)} onChange={(event) => update(index, 'description', event.target.value)} maxLength={20000} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Application link <span>(optional)</span><input value={text(row.applyUrl)} onChange={(event) => update(index, 'applyUrl', event.target.value)} placeholder="https://... or /contact" disabled={disabled} /></label>
        <label className={styles.spanTwo}>URL name<input value={text(row.slug)} onChange={(event) => update(index, 'slug', slugify(event.target.value))} disabled={disabled} /></label>
      </div>
    </section>)}</div>
    {rows.length === 0 && <div className={styles.blankState}>No active vacancy. General applications will still be shown.</div>}
    <button className={styles.addRowButton} type="button" onClick={add} disabled={disabled}><Plus size={17} /> Add vacancy</button>
    <section className={styles.formCard}>
      <div className={styles.formCardHead}><div><span>Page image</span><strong>Careers hero image</strong></div></div>
      <div className={styles.formGrid}>
        <div className={styles.spanTwo}><ImageUploadField value={text(root.heroImage)} alt={text(root.heroImageAlt) || 'HME careers'} disabled={disabled} onChange={(url) => commitRoot('heroImage', url)} /></div>
        {text(root.heroImage) && <label className={styles.spanTwo}>Image description<input value={text(root.heroImageAlt)} onChange={(event) => commitRoot('heroImageAlt', event.target.value)} maxLength={180} disabled={disabled} /></label>}
      </div>
    </section>
  </div>
}

function ContactEditor({ payload, disabled, onChange }: Omit<Props, 'type'>) {
  const root = record(payload)
  const update = (key: string, value: unknown) => onChange({ ...root, [key]: value })

  return <div className={styles.guidedEditor}>
    <SectionTitle icon={<Contact size={20} />} title="Update contact details" description="These details appear on the public Contact page. Check phone numbers and links carefully." />
    <section className={styles.formCard}>
      <div className={styles.formGrid}>
        <label className={styles.spanTwo}>Page headline<input value={text(root.headline)} onChange={(event) => update('headline', event.target.value)} maxLength={120} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Page introduction<textarea value={text(root.lead)} onChange={(event) => update('lead', event.target.value)} maxLength={500} disabled={disabled} /></label>
        <label>Phone number<input value={text(root.phone)} onChange={(event) => update('phone', event.target.value)} placeholder="+604..." disabled={disabled} /></label>
        <label>Email address<input type="email" value={text(root.email)} onChange={(event) => update('email', event.target.value)} disabled={disabled} /></label>
        <label className={styles.spanTwo}>WhatsApp HTTPS link<input value={text(root.whatsappUrl)} onChange={(event) => update('whatsappUrl', event.target.value)} placeholder="https://wa.me/..." disabled={disabled} /></label>
        <label className={styles.spanTwo}>Address line 1<input value={text(root.addressLine1)} onChange={(event) => update('addressLine1', event.target.value)} maxLength={200} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Address line 2<input value={text(root.addressLine2)} onChange={(event) => update('addressLine2', event.target.value)} maxLength={200} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Google Maps HTTPS link <span>(optional)</span><input value={text(root.mapsUrl)} onChange={(event) => update('mapsUrl', event.target.value)} placeholder="https://maps.google.com/..." disabled={disabled} /></label>
        <label className={styles.spanTwo}>Support panel heading<input value={text(root.supportHeading)} onChange={(event) => update('supportHeading', event.target.value)} maxLength={140} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Support safety message<textarea value={text(root.supportNote)} onChange={(event) => update('supportNote', event.target.value)} maxLength={700} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Topics we can help with<input value={Array.isArray(root.services) ? root.services.map(text).join(', ') : ''} onChange={(event) => update('services', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} placeholder="Rates, Money transfer, Currency booking" disabled={disabled} /><small>Separate each topic with a comma.</small></label>
      </div>
    </section>
  </div>
}

function BranchesEditor({ payload, disabled, onChange }: Omit<Props, 'type'>) {
  const root = record(payload)

  const rows = Array.isArray(root.branches) ? root.branches.map(record) : []
  const commit = (next: Entry[]) => onChange({ ...root, branches: next })
  const update = (index: number, key: string, value: unknown) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  const add = () => commit([...rows, { name: '', state: '', address: '', phone: '', whatsapp: '', hours: 'Mon–Sun', services: ['Currency Exchange', 'Money Transfer'], mapsUrl: '', latitude: null, longitude: null, active: true }])
  const remove = (index: number) => commit(rows.filter((_, rowIndex) => rowIndex !== index))

  return <div className={styles.guidedEditor}>
    <SectionTitle icon={<Building2 size={20} />} title="Manage branch information" description="Add the address, opening hours and services customers can find at each branch." />
    <div className={styles.cardList}>{rows.map((row, index) => <section className={styles.formCard} key={index}>
      <div className={styles.formCardHead}><div><span>Branch {index + 1}</span><strong>{text(row.name) || 'Unnamed branch'}</strong></div><label className={styles.switchLabel}><input type="checkbox" checked={checked(row.active)} onChange={(event) => update(index, 'active', event.target.checked)} disabled={disabled} /> Visible</label><button className={styles.iconDanger} type="button" title="Remove branch" onClick={() => remove(index)} disabled={disabled}><Trash2 size={17} /></button></div>
      <div className={styles.formGrid}>
        <label>Branch name<input value={text(row.name)} onChange={(event) => update(index, 'name', event.target.value)} placeholder="Ampang" disabled={disabled} /></label>
        <label>State<input value={text(row.state)} onChange={(event) => update(index, 'state', event.target.value)} placeholder="Kuala Lumpur" disabled={disabled} /></label>
        <label className={styles.spanTwo}>Full address<textarea value={text(row.address)} onChange={(event) => update(index, 'address', event.target.value)} placeholder="Building, street, postcode and city" disabled={disabled} /></label>
        <label>Phone number<input value={text(row.phone)} onChange={(event) => update(index, 'phone', event.target.value)} placeholder="+60..." disabled={disabled} /></label>
        <label>Opening hours<input value={text(row.hours)} onChange={(event) => update(index, 'hours', event.target.value)} placeholder="Mon–Sun, 10am–8pm" disabled={disabled} /></label>
        <label className={styles.spanTwo}>Services<input value={Array.isArray(row.services) ? row.services.map(text).join(', ') : ''} onChange={(event) => update(index, 'services', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} placeholder="Currency Exchange, Money Transfer" disabled={disabled} /><small>Separate services with commas.</small></label>
        <label>WhatsApp link<input value={text(row.whatsapp)} onChange={(event) => update(index, 'whatsapp', event.target.value)} placeholder="https://wa.me/60..." disabled={disabled} /></label>
        <label>Google Maps link<input value={text(row.mapsUrl)} onChange={(event) => update(index, 'mapsUrl', event.target.value)} placeholder="https://maps.google.com/..." disabled={disabled} /></label>
      </div>
    </section>)}</div>
    {rows.length === 0 && <div className={styles.blankState}>No branches added yet.</div>}
    <button className={styles.addRowButton} type="button" onClick={add} disabled={disabled}><Plus size={17} /> Add branch</button>
  </div>
}

export function GuidedEditor(props: Props) {
  if (props.type === 'rates') return <RatesEditor {...props} />
  if (props.type === 'transfer-rates') return <TransferRatesEditor {...props} />
  if (props.type === 'promotions') return <PromotionsEditor {...props} />
  if (props.type === 'branches') return <BranchesEditor {...props} />
  if (props.type === 'news') return <NewsEditor {...props} />
  if (props.type === 'blog') return <BlogEditor {...props} />
  if (props.type === 'careers') return <CareersEditor {...props} />
  return <ContactEditor {...props} />
}

export function ContentPreview({ type, payload }: { type: CmsContentType; payload: unknown }) {
  const root = record(payload)

  if (type === 'rates') {
    const rows = Array.isArray(root.rates) ? root.rates.map(record) : []
    return <div className={styles.previewSurface}><div className={styles.previewHeader}><Banknote size={21} /><div><span>Customer preview</span><h3>Today&apos;s exchange rates</h3></div></div>
      {!checked(root.visible) ? <div className={styles.offlinePreview}><strong>Online rates are being updated</strong><p>For the latest available rate, contact an HME branch before you travel or send money.</p></div> : rows.length ? <table className={styles.previewTable}><thead><tr><th>Currency</th><th>We buy</th><th>We sell</th></tr></thead><tbody>{rows.map((row, index) => <tr key={index}><td><strong>{text(row.code) || '-'}</strong><span>{text(row.name)}</span></td><td>{text(row.buy) || '-'}</td><td>{text(row.sell) || '-'}</td></tr>)}</tbody></table> : <div className={styles.blankState}>Add a currency to see the preview.</div>}
      {text(root.disclaimer) && <p className={styles.previewNote}>{text(root.disclaimer)}</p>}
    </div>
  }


  if (type === 'transfer-rates') {
    const rows = Array.isArray(root.rates) ? root.rates.map(record).filter((row) => checked(row.active)) : []
    return <div className={styles.previewSurface}><div className={styles.previewHeader}><SendHorizontal size={21} /><div><span>Customer preview</span><h3>Money transfer rates</h3></div></div>
      {!checked(root.visible) ? <div className={styles.offlinePreview}><strong>Online rates are being updated</strong><p>For the latest available rate, contact an HME branch before you travel or send money.</p></div> : rows.length ? <table className={styles.previewTable}><thead><tr><th>Destination</th><th>Currency</th><th>Rate / MYR</th><th>Fee</th></tr></thead><tbody>{rows.map((row, index) => <tr key={index}><td><strong>{text(row.country) || '-'}</strong><span>{text(row.countryCode)}</span></td><td>{text(row.currency) || '-'}</td><td>{text(row.rate) || '-'}</td><td>{text(row.fee) || 'Confirm with branch'}</td></tr>)}</tbody></table> : <div className={styles.blankState}>Add a visible destination to see the preview.</div>}
      {text(root.disclaimer) && <p className={styles.previewNote}>{text(root.disclaimer)}</p>}
    </div>
  }

  if (type === 'promotions') {
    const rows = Array.isArray(root.promotions) ? root.promotions.map(record).filter((row) => checked(row.active)) : []
    return <div className={styles.previewSurface}><div className={styles.previewHeader}><BadgePercent size={21} /><div><span>Customer preview</span><h3>Latest promotions</h3></div></div>
      <div className={styles.promoPreviewGrid}>{rows.map((row, index) => <article key={index}>{text(row.image) ? <div className={styles.newsPreviewImage}><Image src={text(row.image)} alt={text(row.title)} fill sizes="400px" /></div> : <div className={styles.previewImage}>HME Promotion</div>}<small>{text(row.startDate)}{text(row.endDate) ? ` – ${text(row.endDate)}` : ''}</small><h4>{text(row.title) || 'Promotion title'}</h4><p>{text(row.summary) || 'Promotion description will appear here.'}</p>{text(row.ctaLabel) && <span className={styles.previewCta}>{text(row.ctaLabel)}</span>}</article>)}</div>
      {rows.length === 0 && <div className={styles.blankState}>No active promotion to preview.</div>}
    </div>
  }

  if (type === 'news') {
    const rows = Array.isArray(root.articles) ? root.articles.map(record).filter((row) => checked(row.active)) : []
    return <div className={styles.previewSurface}><div className={styles.previewHeader}><Newspaper size={21} /><div><span>Customer preview</span><h3>HME News</h3></div></div>
      <div className={styles.newsPreviewGrid}>{rows.map((row, index) => <article key={index}>{text(row.image) ? <div className={styles.newsPreviewImage}><Image src={text(row.image)} alt={text(row.imageAlt) || text(row.title)} fill sizes="400px" /></div> : <div className={styles.previewImage}>HME News</div>}<small>{text(row.publishedDate)} · {text(row.author) || 'HME'}</small><h4>{text(row.title) || 'News headline'}</h4><p>{text(row.summary) || 'News summary will appear here.'}</p><span className={styles.previewCta}>Read full update</span></article>)}</div>
      {rows.length === 0 && <div className={styles.blankState}>Add a visible news article to see the preview.</div>}
    </div>
  }


  if (type === 'blog') {
    const rows = Array.isArray(root.posts) ? root.posts.map(record).filter((row) => checked(row.active)) : []
    return <div className={styles.previewSurface}><div className={styles.previewHeader}><BookOpenText size={21} /><div><span>Customer preview</span><h3>HME Blog</h3></div></div>
      <div className={styles.newsPreviewGrid}>{rows.map((row, index) => <article key={index}>{text(row.image) ? <div className={styles.newsPreviewImage}><Image src={text(row.image)} alt={text(row.imageAlt) || text(row.title)} fill sizes="400px" /></div> : <div className={styles.previewImage}>HME Guide</div>}<small>{text(row.category) || 'Guide'} / {text(row.publishedDate)}</small><h4>{text(row.title) || 'Blog title'}</h4><p>{text(row.summary) || 'Blog summary will appear here.'}</p><span className={styles.previewCta}>Read guide</span></article>)}</div>
      {rows.length === 0 && <div className={styles.blankState}>Add a visible blog post to see the preview.</div>}
    </div>
  }

  if (type === 'careers') {
    const rows = Array.isArray(root.jobs) ? root.jobs.map(record).filter((row) => checked(row.active)) : []
    return <div className={styles.previewSurface}><div className={styles.previewHeader}><BriefcaseBusiness size={21} /><div><span>Customer preview</span><h3>Careers at HME</h3></div></div>
      {text(root.heroImage) && <div className={styles.careerPreviewHero}><Image src={text(root.heroImage)} alt={text(root.heroImageAlt) || 'HME careers'} fill sizes="800px" /></div>}
      <p className={styles.previewNote}>{text(root.intro)}</p>
      <div className={styles.branchPreviewGrid}>{rows.map((row, index) => <article key={index}><span className={styles.previewPin}><BriefcaseBusiness size={18} /></span><div><small>{text(row.location)} / {text(row.employmentType)}</small><h4>{text(row.title) || 'Job title'}</h4><p>{text(row.summary) || 'Role summary will appear here.'}</p><span className={styles.previewCta}>Apply now</span></div></article>)}</div>
      {rows.length === 0 && <div className={styles.blankState}>No open vacancy. General applications will be shown.</div>}
    </div>
  }

  if (type === 'contact') {
    const services = Array.isArray(root.services) ? root.services.map(text) : []
    return <div className={styles.previewSurface}><div className={styles.previewHeader}><Contact size={21} /><div><span>Customer preview</span><h3>{text(root.headline) || 'Contact HME'}</h3></div></div>
      <div className={styles.contactPreview}><p>{text(root.lead)}</p><div><strong>{text(root.phone)}</strong><span>{text(root.email)}</span><span>{text(root.addressLine1)}</span><span>{text(root.addressLine2)}</span></div><h4>{text(root.supportHeading)}</h4><p>{text(root.supportNote)}</p><div className={styles.contactPreviewTopics}>{services.map((service, index) => <em key={index}>{service}</em>)}</div></div>
    </div>
  }

  const rows = Array.isArray(root.branches) ? root.branches.map(record).filter((row) => checked(row.active)) : []
  return <div className={styles.previewSurface}><div className={styles.previewHeader}><MapPin size={21} /><div><span>Customer preview</span><h3>Find an HME branch</h3></div></div>
    <div className={styles.branchPreviewGrid}>{rows.map((row, index) => <article key={index}><span className={styles.previewPin}><MapPin size={18} /></span><div><small>{text(row.state)}</small><h4>{text(row.name) || 'Branch name'}</h4><p>{text(row.address) || 'Branch address will appear here.'}</p><strong>{text(row.hours)}</strong><div>{Array.isArray(row.services) && row.services.map((service, serviceIndex) => <em key={serviceIndex}>{text(service)}</em>)}</div></div></article>)}</div>
    {rows.length === 0 && <div className={styles.blankState}>Add a visible branch to see the preview.</div>}
  </div>
}
