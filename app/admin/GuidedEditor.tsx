'use client'

import { BadgePercent, Banknote, Building2, MapPin, Plus, Trash2 } from 'lucide-react'
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
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) || 'new-promotion'
}

function SectionTitle({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <div className={styles.formIntro}><span>{icon}</span><div><h3>{title}</h3><p>{description}</p></div></div>
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
    <div className={styles.rateTableWrap}>
      <table className={styles.formTable}>
        <thead><tr><th>Currency code</th><th>Currency name</th><th>Country code</th><th>We buy</th><th>We sell</th><th><span className="sr-only">Remove</span></th></tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>
          <td><input aria-label={`Currency code row ${index + 1}`} value={text(row.code)} onChange={(event) => update(index, 'code', event.target.value.toUpperCase().slice(0, 3))} placeholder="USD" maxLength={3} disabled={disabled} /></td>
          <td><input aria-label={`Currency name row ${index + 1}`} value={text(row.name)} onChange={(event) => update(index, 'name', event.target.value)} placeholder="US Dollar" disabled={disabled} /></td>
          <td><input aria-label={`Country code row ${index + 1}`} value={text(row.country)} onChange={(event) => update(index, 'country', event.target.value.toUpperCase().slice(0, 2))} placeholder="US" maxLength={2} disabled={disabled} /></td>
          <td><input aria-label={`Buy rate row ${index + 1}`} value={text(row.buy)} onChange={(event) => update(index, 'buy', event.target.value)} placeholder="4.1000" inputMode="decimal" disabled={disabled} /></td>
          <td><input aria-label={`Sell rate row ${index + 1}`} value={text(row.sell)} onChange={(event) => update(index, 'sell', event.target.value)} placeholder="4.3000" inputMode="decimal" disabled={disabled} /></td>
          <td><button className={styles.iconDanger} type="button" title="Remove currency" onClick={() => remove(index)} disabled={disabled || rows.length === 1}><Trash2 size={17} /></button></td>
        </tr>)}</tbody>
      </table>
    </div>
    <button className={styles.addRowButton} type="button" onClick={add} disabled={disabled}><Plus size={17} /> Add another currency</button>
    <label className={styles.fullField}>Rate notice shown to customers
      <textarea value={text(root.disclaimer)} onChange={(event) => onChange({ ...root, disclaimer: event.target.value })} placeholder="Example: Rates are indicative and subject to availability." maxLength={500} disabled={disabled} />
      <small>Keep this short and clear. Maximum 500 characters.</small>
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
        <label className={styles.spanTwo}>Image URL (optional)<input value={text(row.image)} onChange={(event) => update(index, 'image', event.target.value)} placeholder="https://..." disabled={disabled} /></label>
        <label className={styles.spanTwo}>URL name <input value={text(row.slug)} onChange={(event) => update(index, 'slug', slugify(event.target.value))} placeholder="send-money-and-save" disabled={disabled} /><small>Automatically generated from the title. Lowercase letters and dashes only.</small></label>
      </div>
    </section>)}</div>
    {rows.length === 0 && <div className={styles.blankState}>No promotion added yet. You can publish an empty list to hide all promotions.</div>}
    <button className={styles.addRowButton} type="button" onClick={add} disabled={disabled}><Plus size={17} /> Add promotion</button>
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
  if (props.type === 'promotions') return <PromotionsEditor {...props} />
  return <BranchesEditor {...props} />
}

export function ContentPreview({ type, payload }: { type: CmsContentType; payload: unknown }) {
  const root = record(payload)

  if (type === 'rates') {
    const rows = Array.isArray(root.rates) ? root.rates.map(record) : []
    return <div className={styles.previewSurface}><div className={styles.previewHeader}><Banknote size={21} /><div><span>Customer preview</span><h3>Today&apos;s exchange rates</h3></div></div>
      {rows.length ? <table className={styles.previewTable}><thead><tr><th>Currency</th><th>We buy</th><th>We sell</th></tr></thead><tbody>{rows.map((row, index) => <tr key={index}><td><strong>{text(row.code) || '—'}</strong><span>{text(row.name)}</span></td><td>{text(row.buy) || '—'}</td><td>{text(row.sell) || '—'}</td></tr>)}</tbody></table> : <div className={styles.blankState}>Add a currency to see the preview.</div>}
      {text(root.disclaimer) && <p className={styles.previewNote}>{text(root.disclaimer)}</p>}
    </div>
  }

  if (type === 'promotions') {
    const rows = Array.isArray(root.promotions) ? root.promotions.map(record).filter((row) => checked(row.active)) : []
    return <div className={styles.previewSurface}><div className={styles.previewHeader}><BadgePercent size={21} /><div><span>Customer preview</span><h3>Latest promotions</h3></div></div>
      <div className={styles.promoPreviewGrid}>{rows.map((row, index) => <article key={index}><div className={styles.previewImage}>{text(row.image) ? 'Promotion image' : 'HME Promotion'}</div><small>{text(row.startDate)}{text(row.endDate) ? ` – ${text(row.endDate)}` : ''}</small><h4>{text(row.title) || 'Promotion title'}</h4><p>{text(row.summary) || 'Promotion description will appear here.'}</p>{text(row.ctaLabel) && <span className={styles.previewCta}>{text(row.ctaLabel)}</span>}</article>)}</div>
      {rows.length === 0 && <div className={styles.blankState}>No active promotion to preview.</div>}
    </div>
  }

  const rows = Array.isArray(root.branches) ? root.branches.map(record).filter((row) => checked(row.active)) : []
  return <div className={styles.previewSurface}><div className={styles.previewHeader}><MapPin size={21} /><div><span>Customer preview</span><h3>Find an HME branch</h3></div></div>
    <div className={styles.branchPreviewGrid}>{rows.map((row, index) => <article key={index}><span className={styles.previewPin}><MapPin size={18} /></span><div><small>{text(row.state)}</small><h4>{text(row.name) || 'Branch name'}</h4><p>{text(row.address) || 'Branch address will appear here.'}</p><strong>{text(row.hours)}</strong><div>{Array.isArray(row.services) && row.services.map((service, serviceIndex) => <em key={serviceIndex}>{text(service)}</em>)}</div></div></article>)}</div>
    {rows.length === 0 && <div className={styles.blankState}>Add a visible branch to see the preview.</div>}
  </div>
}
