'use client'

import { useState } from 'react'
import Image from 'next/image'
import { BadgePercent, Banknote, BookOpenText, BriefcaseBusiness, Building2, Contact, Copy, Eye, Globe2, LayoutTemplate, LoaderCircle, MapPin, Newspaper, PencilLine, Plus, SendHorizontal, Trash2, UploadCloud } from 'lucide-react'
import type { CmsContentType } from '@/lib/cms-validation'
import { heroImageSpec, homeHeroImageSpec, homeHeroSlideImageSpec, sectionImageSpec, type CmsImageSpec } from '@/lib/page-content'
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

type ItemPanelMode = 'edit' | 'preview'

function CollectionToolbar({ count, noun, plural, addLabel, disabled, onAdd, children }: {
  count: number
  noun: string
  plural?: string
  addLabel: string
  disabled: boolean
  onAdd: () => void
  children?: React.ReactNode
}) {
  return <div className={styles.collectionToolbar}>
    <div><strong>{count} {count === 1 ? noun : plural || `${noun}s`}</strong><span>Choose one item below to edit or preview it.</span></div>
    {children}
    <button type="button" className={styles.collectionAdd} onClick={onAdd} disabled={disabled}><Plus size={17} /> {addLabel}</button>
  </div>
}

function CollectionItem({ index, kind, title, meta, summary, active, activeLabel, disabled, structureLocked = false, mode, onMode, onToggle, onDuplicate, onRemove, edit, preview }: {
  index: number
  kind: string
  title: string
  meta?: string
  summary?: string
  active: boolean
  activeLabel: string
  disabled: boolean
  structureLocked?: boolean
  mode: ItemPanelMode | null
  onMode: (mode: ItemPanelMode | null) => void
  onToggle: (active: boolean) => void
  onDuplicate: () => void
  onRemove: () => void
  edit: React.ReactNode
  preview: React.ReactNode
}) {
  return <section className={`${styles.collectionItem} ${mode ? styles.collectionItemOpen : ''}`}>
    <div className={styles.collectionSummary}>
      <span className={styles.itemNumber}>{index + 1}</span>
      <div className={styles.itemIdentity}>
        <span>{kind}</span>
        <strong>{title}</strong>
        {meta && <small>{meta}</small>}
        {summary && <p>{summary}</p>}
      </div>
      <div className={styles.itemControls}>
        <label className={styles.itemVisibility}><input type="checkbox" checked={active} onChange={(event) => onToggle(event.target.checked)} disabled={disabled} /><span>{activeLabel}</span></label>
        <button type="button" className={mode === 'edit' ? styles.itemActionActive : styles.itemAction} onClick={() => onMode(mode === 'edit' ? null : 'edit')}><PencilLine size={15} /> {mode === 'edit' ? 'Close editor' : 'Edit'}</button>
        <button type="button" className={mode === 'preview' ? styles.itemActionActive : styles.itemAction} onClick={() => onMode(mode === 'preview' ? null : 'preview')}><Eye size={15} /> Preview</button>
        <button type="button" className={styles.itemIconAction} title={structureLocked ? 'Built-in sections cannot be duplicated' : `Duplicate ${kind.toLowerCase()}`} onClick={onDuplicate} disabled={disabled || structureLocked}><Copy size={15} /></button>
        <button type="button" className={styles.itemIconDanger} title={structureLocked ? 'Built-in sections cannot be deleted' : `Delete ${kind.toLowerCase()}`} onClick={onRemove} disabled={disabled || structureLocked}><Trash2 size={15} /></button>
      </div>
    </div>
    {mode === 'edit' && <div className={styles.collectionEditor}>{edit}</div>}
    {mode === 'preview' && <div className={styles.collectionPreview}>{preview}</div>}
  </section>
}

function PreviewCard({ image, imageAlt, eyebrow, title, summary, body }: { image?: string; imageAlt?: string; eyebrow?: string; title: string; summary?: string; body?: string }) {
  return <article className={styles.inlinePreviewCard}>
    {image ? <div className={styles.inlinePreviewImage}><Image src={image} alt={imageAlt || title} fill sizes="520px" /></div> : <div className={styles.inlinePreviewPlaceholder}>Website preview</div>}
    <div><small>{eyebrow}</small><h4>{title}</h4>{summary && <p>{summary}</p>}{body && <div>{body}</div>}</div>
  </article>
}

function confirmRemove(label: string) {
  return window.confirm(`Delete “${label}” from this draft? The website will only change after you publish.`)
}


function ImageUploadField({
  value,
  alt,
  disabled,
  onChange,
  spec,
}: {
  value: string
  alt: string
  disabled: boolean
  onChange: (url: string) => void
  spec?: CmsImageSpec
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dimensions, setDimensions] = useState('')

  async function upload(file?: File) {
    if (!file) return
    const maximum = spec?.maxBytes || 4 * 1024 * 1024
    if (file.size > maximum) {
      setError(`Image must be smaller than ${Math.round(maximum / 1024 / 1024)} MB for this position.`)
      return
    }
    try {
      const bitmap = await createImageBitmap(file)
      const actualRatio = bitmap.width / bitmap.height
      const targetRatio = spec ? spec.width / spec.height : null
      setDimensions(`${bitmap.width} × ${bitmap.height} px`)
      if (spec && (bitmap.width < spec.width * 0.7 || bitmap.height < spec.height * 0.7)) {
        bitmap.close()
        setError(`This image is too small. Use at least ${spec.width} × ${spec.height} px for sharp results.`)
        return
      }
      if (spec && targetRatio && Math.abs(actualRatio - targetRatio) / targetRatio > 0.18) {
        bitmap.close()
        setError(`The image shape does not match ${spec.ratio}. Resize or crop it to approximately ${spec.width} × ${spec.height} px.`)
        return
      }
      bitmap.close()
    } catch {
      setError('The image dimensions could not be read. Try another JPG, PNG, WebP or AVIF file.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('image', file)
      if (spec) form.append('slot', spec.key)
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
      {spec ? <div className={styles.imageRequirements}>
        <strong>{spec.label}</strong>
        <span><b>Recommended size</b>{spec.width} × {spec.height} px</span>
        <span><b>Image ratio</b>{spec.ratio}</span>
        <span><b>File format</b>{spec.formats}</span>
        <span><b>Maximum file</b>{Math.round(spec.maxBytes / 1024 / 1024)} MB</span>
        <small>{spec.note}</small>
        {dimensions && <em>Selected image: {dimensions}</em>}
      </div> : <small>JPG, PNG, WebP or AVIF. Maximum 4 MB.</small>}
    </div>
    {error && <p className={styles.uploadError}>{error}</p>}
  </div>
}

function PagesEditor({ payload, disabled, onChange }: Omit<Props, 'type'>) {
  const root = record(payload)
  const hero = record(root.hero)
  const rows = Array.isArray(root.sections) ? root.sections.map(record) : []
  const [panel, setPanel] = useState<{ index: number; mode: ItemPanelMode } | null>(null)
  const updateHero = (key: string, value: unknown) => onChange({ ...root, hero: { ...hero, [key]: value } })
  const commitSections = (sections: Entry[]) => onChange({ ...root, sections })
  const updateSection = (index: number, key: string, value: unknown) => commitSections(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  const sectionItems = (index: number) => Array.isArray(rows[index]?.items) ? (rows[index].items as unknown[]).map(record) : []
  const commitSectionItems = (index: number, items: Entry[]) => updateSection(index, 'items', items)
  const updateSectionItem = (sectionIndex: number, itemIndex: number, key: string, value: unknown) => {
    const items = sectionItems(sectionIndex)
    commitSectionItems(sectionIndex, items.map((item, index) => index === itemIndex ? { ...item, [key]: value } : item))
  }
  const addSectionItem = (sectionIndex: number) => {
    const items = sectionItems(sectionIndex)
    commitSectionItems(sectionIndex, [...items, { id: `item-${items.length + 1}`, title: `Item ${items.length + 1}`, body: '', meta: '', active: true }])
  }
  const removeSectionItem = (sectionIndex: number, itemIndex: number) => {
    const items = sectionItems(sectionIndex)
    if (confirmRemove(text(items[itemIndex]?.title) || `Item ${itemIndex + 1}`)) {
      commitSectionItems(sectionIndex, items.filter((_, index) => index !== itemIndex))
    }
  }
  const addSection = () => {
    const index = rows.length
    commitSections([...rows, { id: `section-${index + 1}`, name: `Section ${index + 1}`, kind: 'additional', visible: true, eyebrow: '', heading: '', body: '', image: '', imageAlt: '', items: [] }])
    setPanel({ index, mode: 'edit' })
  }
  const removeSection = (index: number) => {
    if (confirmRemove(text(rows[index].name) || `Section ${index + 1}`)) {
      commitSections(rows.filter((_, rowIndex) => rowIndex !== index))
      setPanel(null)
    }
  }
  const heroSpec = text(root.path) === '/' ? homeHeroImageSpec : heroImageSpec
  const isHome = text(root.path) === '/'
  const heroSlideRows: Entry[] = Array.isArray(hero.heroSlides) ? (hero.heroSlides as unknown[]).map(record) : []
  const [slidePanel, setSlidePanel] = useState<{ index: number; mode: ItemPanelMode } | null>(null)
  const commitHeroSlides = (slides: Entry[]) => updateHero('heroSlides', slides)
  const updateHeroSlide = (index: number, key: string, value: unknown) =>
    commitHeroSlides(heroSlideRows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  const addHeroSlide = () => {
    const id = crypto.randomUUID()
    commitHeroSlides([...heroSlideRows, { id, image: '', imageAlt: '' }])
    setSlidePanel({ index: heroSlideRows.length, mode: 'edit' })
  }
  const removeHeroSlide = (index: number) => {
    if (confirmRemove(`Slide ${index + 1}`)) {
      commitHeroSlides(heroSlideRows.filter((_, rowIndex) => rowIndex !== index))
      setSlidePanel(null)
    }
  }
  const sectionsStepNumber = isHome ? 3 : 2

  return <div className={styles.guidedEditor}>
    <SectionTitle icon={<LayoutTemplate size={20} />} title={`Edit ${text(root.pageName) || 'website page'}`} description="Update the page one section at a time. Existing design, spacing and colours stay protected." />
    <section className={styles.pageEditorBlock}>
      <div className={styles.pageEditorBlockHead}><span>1</span><div><strong>Top of page (Hero)</strong><small>The first section customers see.</small></div></div>
      <div className={styles.formGrid}>
        <label>Small label<input value={text(hero.eyebrow)} onChange={(event) => updateHero('eyebrow', event.target.value)} maxLength={120} placeholder="Currency Exchange" disabled={disabled} /></label>
        <label>Page heading<input value={text(hero.title)} onChange={(event) => updateHero('title', event.target.value)} maxLength={220} required disabled={disabled} /></label>
        <label className={styles.spanTwo}>Introductory message<textarea value={text(hero.lead)} onChange={(event) => updateHero('lead', event.target.value)} maxLength={700} disabled={disabled} /></label>
        <div className={styles.spanTwo}><label>Hero image</label><ImageUploadField value={text(hero.image)} alt={text(hero.imageAlt)} disabled={disabled} spec={heroSpec} onChange={(url) => updateHero('image', url)} /></div>
        {text(hero.image) && <label className={styles.spanTwo}>Image description<input value={text(hero.imageAlt)} onChange={(event) => updateHero('imageAlt', event.target.value)} maxLength={180} placeholder="Describe the people, place or activity shown" disabled={disabled} /><small>Required for accessibility and useful for search engines.</small></label>}
        {isHome && <p className={styles.spanTwo}><small>If you add banner slides below, they replace this heading, text and photo on the homepage automatically — no need to hide anything here.</small></p>}
      </div>
    </section>
    {isHome && <section className={styles.pageEditorBlock}>
      <div className={styles.pageEditorBlockHead}><span>2</span><div><strong>Homepage banner slideshow</strong><small>Upload one or more promotional banners. When at least one is added, it automatically replaces the heading/photo above on the live homepage and rotates every few seconds. Leave empty to keep the default homepage design.</small></div></div>
      <CollectionToolbar count={heroSlideRows.length} noun="slide" addLabel="Add banner slide" disabled={disabled} onAdd={addHeroSlide} />
      <div className={styles.collectionList}>{heroSlideRows.map((row, index) => {
        const mode = slidePanel?.index === index ? slidePanel.mode : null
        return <section key={text(row.id) || `slide-${index}`} className={`${styles.collectionItem} ${mode ? styles.collectionItemOpen : ''}`}>
          <div className={styles.collectionSummary}>
            <span className={styles.itemNumber}>{index + 1}</span>
            <div className={styles.itemIdentity}>
              <span>Banner slide</span>
              <strong>{text(row.imageAlt) || `Slide ${index + 1}`}</strong>
              <small>{text(row.image) ? 'Image uploaded' : 'No image yet'}</small>
            </div>
            <div className={styles.itemControls}>
              <button type="button" className={mode === 'edit' ? styles.itemActionActive : styles.itemAction} onClick={() => setSlidePanel(mode === 'edit' ? null : { index, mode: 'edit' })}><PencilLine size={15} /> {mode === 'edit' ? 'Close editor' : 'Edit'}</button>
              <button type="button" className={mode === 'preview' ? styles.itemActionActive : styles.itemAction} onClick={() => setSlidePanel(mode === 'preview' ? null : { index, mode: 'preview' })}><Eye size={15} /> Preview</button>
              <button type="button" className={styles.itemIconDanger} title="Delete slide" onClick={() => removeHeroSlide(index)} disabled={disabled}><Trash2 size={15} /></button>
            </div>
          </div>
          {mode === 'edit' && <div className={styles.collectionEditor}><div className={styles.formGrid}>
            <div className={styles.spanTwo}><label>Banner image</label><ImageUploadField value={text(row.image)} alt={text(row.imageAlt)} disabled={disabled} spec={homeHeroSlideImageSpec} onChange={(url) => updateHeroSlide(index, 'image', url)} /></div>
            <label className={styles.spanTwo}>Image description<input value={text(row.imageAlt)} onChange={(event) => updateHeroSlide(index, 'imageAlt', event.target.value)} maxLength={180} placeholder="Describe the offer or scene shown in this banner" disabled={disabled} /><small>Required for accessibility and useful for search engines.</small></label>
          </div></div>}
          {mode === 'preview' && <div className={styles.collectionPreview}><PreviewCard image={text(row.image)} imageAlt={text(row.imageAlt)} title={text(row.imageAlt) || `Slide ${index + 1}`} /></div>}
        </section>
      })}</div>
      {heroSlideRows.length === 0 && <div className={styles.blankState}>No banner slides yet. The default homepage heading and photo stay visible.</div>}
    </section>}
    <section className={styles.pageEditorBlock}>
      <div className={styles.pageEditorBlockHead}><span>{sectionsStepNumber}</span><div><strong>Page sections and cards</strong><small>Built-in sections keep the website design protected. Edit each card as a separate item.</small></div></div>
      <CollectionToolbar count={rows.length} noun="section" addLabel="Add section" disabled={disabled} onAdd={addSection} />
      <div className={styles.collectionList}>{rows.map((row, index) => {
        const items = sectionItems(index)
        const builtIn = text(row.kind) === 'content-slot'
        return <CollectionItem key={`${text(row.id)}-${index}`} index={index} kind={builtIn ? 'Built-in website section' : 'Page section'} title={text(row.name) || `Section ${index + 1}`} meta={text(row.eyebrow)} summary={text(row.heading)} active={checked(row.visible)} activeLabel={checked(row.visible) ? 'Visible' : 'Hidden'} disabled={disabled} structureLocked={builtIn} mode={panel?.index === index ? panel.mode : null} onMode={(mode) => setPanel(mode ? { index, mode } : null)} onToggle={(visible) => updateSection(index, 'visible', visible)} onDuplicate={() => { const copy = { ...row, kind: 'additional', id: `${slugify(text(row.id) || 'section')}-copy`, name: `${text(row.name) || 'Section'} copy`, visible: false }; commitSections([...rows.slice(0, index + 1), copy, ...rows.slice(index + 1)]); setPanel({ index: index + 1, mode: 'edit' }) }} onRemove={() => removeSection(index)}
        edit={<div className={styles.formGrid}>
          <label>Section name<input value={text(row.name)} onChange={(event) => updateSection(index, 'name', event.target.value)} maxLength={120} placeholder="Why choose HME" disabled={disabled} /><small>Only staff see this organising label.</small></label>
          <label>Small label<input value={text(row.eyebrow)} onChange={(event) => updateSection(index, 'eyebrow', event.target.value)} maxLength={120} disabled={disabled} /></label>
          <label className={styles.spanTwo}>Heading<input value={text(row.heading)} onChange={(event) => updateSection(index, 'heading', event.target.value)} maxLength={220} disabled={disabled} /></label>
          <label className={styles.spanTwo}>Text<textarea className={styles.articleBody} value={text(row.body)} onChange={(event) => updateSection(index, 'body', event.target.value)} maxLength={5000} disabled={disabled} /></label>
          <div className={styles.spanTwo}><label>Section image</label><ImageUploadField value={text(row.image)} alt={text(row.imageAlt)} disabled={disabled} spec={sectionImageSpec} onChange={(url) => updateSection(index, 'image', url)} /></div>
          {text(row.image) && <label className={styles.spanTwo}>Image description<input value={text(row.imageAlt)} onChange={(event) => updateSection(index, 'imageAlt', event.target.value)} maxLength={180} disabled={disabled} /></label>}
          {!builtIn && <label className={styles.spanTwo}>Section ID<input value={text(row.id)} onChange={(event) => updateSection(index, 'id', slugify(event.target.value))} disabled={disabled} /><small>Technical identifier. Keep it short and unique on this page.</small></label>}
          <div className={`${styles.spanTwo} ${styles.sectionItemsEditor}`}>
            <div className={styles.sectionItemsHead}><div><strong>Cards or list items</strong><small>Each box below controls one item on the website.</small></div><button type="button" onClick={() => addSectionItem(index)} disabled={disabled}><Plus size={15} /> Add item</button></div>
            {items.map((item, itemIndex) => <article className={styles.sectionItemEditor} key={`${text(item.id)}-${itemIndex}`}>
              <div className={styles.sectionItemBar}><strong>Item {itemIndex + 1}</strong><label><input type="checkbox" checked={checked(item.active)} onChange={(event) => updateSectionItem(index, itemIndex, 'active', event.target.checked)} disabled={disabled} /> Show</label><button type="button" title="Delete item" onClick={() => removeSectionItem(index, itemIndex)} disabled={disabled}><Trash2 size={15} /></button></div>
              <div className={styles.formGrid}>
                <label>Title<input value={text(item.title)} onChange={(event) => updateSectionItem(index, itemIndex, 'title', event.target.value)} maxLength={180} disabled={disabled} /></label>
                <label>Number or small label<input value={text(item.meta)} onChange={(event) => updateSectionItem(index, itemIndex, 'meta', event.target.value)} maxLength={80} placeholder="Optional: 01" disabled={disabled} /></label>
                <label className={styles.spanTwo}>Description<textarea value={text(item.body)} onChange={(event) => updateSectionItem(index, itemIndex, 'body', event.target.value)} maxLength={2000} disabled={disabled} /></label>
              </div>
            </article>)}
            {items.length === 0 && <div className={styles.blankState}>No cards in this section yet. Select “Add item” to create one.</div>}
          </div>
        </div>}
        preview={<><PreviewCard image={text(row.image)} imageAlt={text(row.imageAlt)} eyebrow={text(row.eyebrow)} title={text(row.heading) || text(row.name)} body={text(row.body)} />{items.length > 0 && <div className={styles.sectionItemsPreview}>{items.filter((item) => checked(item.active)).map((item, itemIndex) => <article key={itemIndex}><small>{text(item.meta)}</small><strong>{text(item.title)}</strong><p>{text(item.body)}</p></article>)}</div>}</>}
      />})}</div>
      {rows.length === 0 && <div className={styles.blankState}>No extra managed sections yet. The existing page design remains visible.</div>}
    </section>
  </div>
}

function GlobalEditor({ payload, disabled, onChange }: Omit<Props, 'type'>) {
  const root = record(payload)
  const update = (key: string, value: string) => onChange({ ...root, [key]: value })
  return <div className={styles.guidedEditor}>
    <SectionTitle icon={<Globe2 size={20} />} title="Footer and social media" description="Change social links and the copyright line once for the whole website. Contact information has its own tab." />
    <div className={styles.formGrid}>
      <label>Facebook link<input value={text(root.facebookUrl)} onChange={(event) => update('facebookUrl', event.target.value)} disabled={disabled} /></label>
      <label>Instagram link<input value={text(root.instagramUrl)} onChange={(event) => update('instagramUrl', event.target.value)} disabled={disabled} /></label>
      <label>TikTok link<input value={text(root.tiktokUrl)} onChange={(event) => update('tiktokUrl', event.target.value)} disabled={disabled} /></label>
      <label>LinkedIn link<input value={text(root.linkedinUrl)} onChange={(event) => update('linkedinUrl', event.target.value)} disabled={disabled} /></label>
      <label className={styles.spanTwo}>Footer copyright<input value={text(root.footerCopyright)} onChange={(event) => update('footerCopyright', event.target.value)} maxLength={240} disabled={disabled} /></label>
    </div>
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
  const [panel, setPanel] = useState<{ index: number; mode: ItemPanelMode } | null>(null)
  const commit = (next: Entry[]) => onChange({ ...root, promotions: next })
  const update = (index: number, key: string, value: unknown) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  const updateTitle = (index: number, value: string) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, title: value, slug: slugify(value) } : row))
  const add = () => { commit([...rows, { slug: `new-promotion-${rows.length + 1}`, title: '', summary: '', image: '', ctaLabel: 'Learn more', ctaHref: '/contact', active: true }]); setPanel({ index: rows.length, mode: 'edit' }) }
  const duplicate = (index: number) => {
    const source = rows[index]
    const title = `${text(source.title) || 'Promotion'} copy`
    const next = [...rows.slice(0, index + 1), { ...source, title, slug: slugify(title), active: false }, ...rows.slice(index + 1)]
    commit(next); setPanel({ index: index + 1, mode: 'edit' })
  }
  const remove = (index: number) => { if (confirmRemove(text(rows[index].title) || `Promotion ${index + 1}`)) { commit(rows.filter((_, rowIndex) => rowIndex !== index)); setPanel(null) } }

  return <div className={styles.guidedEditor}>
    <SectionTitle icon={<BadgePercent size={20} />} title="Create promotions" description="Add the customer-facing title, dates and call-to-action. The URL name is created automatically." />
    <CollectionToolbar count={rows.length} noun="promotion" addLabel="New promotion" disabled={disabled} onAdd={add} />
    <div className={styles.collectionList}>{rows.map((row, index) => <CollectionItem key={`${text(row.slug)}-${index}`} index={index} kind="Promotion" title={text(row.title) || 'Untitled promotion'} meta={[text(row.startDate), text(row.endDate)].filter(Boolean).join(' to ') || 'No campaign dates'} summary={text(row.summary)} active={checked(row.active)} activeLabel={checked(row.active) ? 'Visible' : 'Hidden'} disabled={disabled} mode={panel?.index === index ? panel.mode : null} onMode={(mode) => setPanel(mode ? { index, mode } : null)} onToggle={(active) => update(index, 'active', active)} onDuplicate={() => duplicate(index)} onRemove={() => remove(index)}
      edit={<div className={styles.formGrid}>
        <label className={styles.spanTwo}>Promotion title<input value={text(row.title)} onChange={(event) => updateTitle(index, event.target.value)} placeholder="Send money and save" maxLength={140} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Short description<textarea value={text(row.summary)} onChange={(event) => update(index, 'summary', event.target.value)} placeholder="Explain the offer in one or two sentences." maxLength={500} disabled={disabled} /></label>
        <label>Start date<input type="date" value={text(row.startDate)} onChange={(event) => update(index, 'startDate', event.target.value || undefined)} disabled={disabled} /></label>
        <label>End date<input type="date" value={text(row.endDate)} onChange={(event) => update(index, 'endDate', event.target.value || undefined)} disabled={disabled} /></label>
        <label>Button text<input value={text(row.ctaLabel)} onChange={(event) => update(index, 'ctaLabel', event.target.value)} placeholder="Learn more" disabled={disabled} /></label>
        <label>Button link<input value={text(row.ctaHref)} onChange={(event) => update(index, 'ctaHref', event.target.value)} placeholder="/contact" disabled={disabled} /></label>
        <div className={styles.spanTwo}><label>Promotion image</label><ImageUploadField value={text(row.image)} alt={text(row.title)} disabled={disabled} onChange={(url) => update(index, 'image', url)} /></div>
        <label className={styles.spanTwo}>URL name <input value={text(row.slug)} onChange={(event) => update(index, 'slug', slugify(event.target.value))} placeholder="send-money-and-save" disabled={disabled} /><small>Automatically generated from the title. Lowercase letters and dashes only.</small></label>
      </div>}
      preview={<PreviewCard image={text(row.image)} imageAlt={text(row.title)} eyebrow={[text(row.startDate), text(row.endDate)].filter(Boolean).join(' – ')} title={text(row.title) || 'Promotion title'} summary={text(row.summary)} />}
    />)}</div>
    {rows.length === 0 && <div className={styles.blankState}>No promotion added yet. You can publish an empty list to hide all promotions.</div>}
  </div>
}


function NewsEditor({ payload, disabled, onChange }: Omit<Props, 'type'>) {
  const root = record(payload)
  const rows = Array.isArray(root.articles) ? root.articles.map(record) : []
  const [panel, setPanel] = useState<{ index: number; mode: ItemPanelMode } | null>(null)
  const commit = (next: Entry[]) => onChange({ ...root, articles: next })
  const update = (index: number, key: string, value: unknown) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  const updateTitle = (index: number, value: string) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, title: value, slug: slugify(value), imageAlt: text(row.imageAlt) || value } : row))
  const add = () => { commit([...rows, { slug: `new-article-${rows.length + 1}`, title: '', summary: '', body: '', publishedDate: new Date().toISOString().slice(0, 10), image: '', imageAlt: '', author: 'HME', active: true }]); setPanel({ index: rows.length, mode: 'edit' }) }
  const duplicate = (index: number) => {
    const source = rows[index]
    const title = `${text(source.title) || 'News article'} copy`
    const next = [...rows.slice(0, index + 1), { ...source, title, slug: slugify(title), active: false }, ...rows.slice(index + 1)]
    commit(next); setPanel({ index: index + 1, mode: 'edit' })
  }
  const remove = (index: number) => { if (confirmRemove(text(rows[index].title) || `News article ${index + 1}`)) { commit(rows.filter((_, rowIndex) => rowIndex !== index)); setPanel(null) } }

  return <div className={styles.guidedEditor}>
    <SectionTitle icon={<Newspaper size={20} />} title="Publish company news" description="Create announcements, branch updates and company stories with a photo." />
    <CollectionToolbar count={rows.length} noun="article" addLabel="New article" disabled={disabled} onAdd={add} />
    <div className={styles.collectionList}>{rows.map((row, index) => <CollectionItem key={`${text(row.slug)}-${index}`} index={index} kind="News article" title={text(row.title) || 'Untitled article'} meta={`${text(row.publishedDate) || 'No date'} · ${text(row.author) || 'HME'}`} summary={text(row.summary)} active={checked(row.active)} activeLabel={checked(row.active) ? 'Visible' : 'Hidden'} disabled={disabled} mode={panel?.index === index ? panel.mode : null} onMode={(mode) => setPanel(mode ? { index, mode } : null)} onToggle={(active) => update(index, 'active', active)} onDuplicate={() => duplicate(index)} onRemove={() => remove(index)}
      edit={<div className={styles.formGrid}>
        <label className={styles.spanTwo}>Headline<input value={text(row.title)} onChange={(event) => updateTitle(index, event.target.value)} placeholder="HME opens a new branch" maxLength={180} disabled={disabled} /></label>
        <label>News date<input type="date" value={text(row.publishedDate)} onChange={(event) => update(index, 'publishedDate', event.target.value)} disabled={disabled} /></label>
        <label>Author<input value={text(row.author)} onChange={(event) => update(index, 'author', event.target.value)} placeholder="HME" maxLength={100} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Short summary<textarea value={text(row.summary)} onChange={(event) => update(index, 'summary', event.target.value)} placeholder="A short introduction shown on the News card." maxLength={500} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Full article<textarea className={styles.articleBody} value={text(row.body)} onChange={(event) => update(index, 'body', event.target.value)} placeholder="Write the full announcement here. Use blank lines between paragraphs." maxLength={20000} disabled={disabled} /></label>
        <div className={styles.spanTwo}><label>Article image</label><ImageUploadField value={text(row.image)} alt={text(row.imageAlt) || text(row.title)} disabled={disabled} onChange={(url) => update(index, 'image', url)} /></div>
        {text(row.image) && <label className={styles.spanTwo}>Image description (for accessibility)<input value={text(row.imageAlt)} onChange={(event) => update(index, 'imageAlt', event.target.value)} placeholder="Describe what is shown in the image" maxLength={180} disabled={disabled} /></label>}
        <label className={styles.spanTwo}>URL name<input value={text(row.slug)} onChange={(event) => update(index, 'slug', slugify(event.target.value))} disabled={disabled} /><small>Created automatically from the headline.</small></label>
      </div>}
      preview={<PreviewCard image={text(row.image)} imageAlt={text(row.imageAlt)} eyebrow={`${text(row.publishedDate)} · ${text(row.author) || 'HME'}`} title={text(row.title) || 'News headline'} summary={text(row.summary)} body={text(row.body)} />}
    />)}</div>
    {rows.length === 0 && <div className={styles.blankState}>No news article added yet.</div>}
  </div>
}


function BlogEditor({ payload, disabled, onChange }: Omit<Props, 'type'>) {
  const root = record(payload)
  const rows = Array.isArray(root.posts) ? root.posts.map(record) : []
  const [panel, setPanel] = useState<{ index: number; mode: ItemPanelMode } | null>(null)
  const commit = (next: Entry[]) => onChange({ ...root, posts: next })
  const update = (index: number, key: string, value: unknown) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  const updateTitle = (index: number, value: string) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, title: value, slug: slugify(value), imageAlt: text(row.imageAlt) || value } : row))
  const add = () => { commit([...rows, { slug: `new-guide-${rows.length + 1}`, title: '', summary: '', body: '', publishedDate: new Date().toISOString().slice(0, 10), image: '', imageAlt: '', author: 'HME', category: 'Guides', active: true }]); setPanel({ index: rows.length, mode: 'edit' }) }
  const duplicate = (index: number) => {
    const source = rows[index]
    const title = `${text(source.title) || 'Blog post'} copy`
    const next = [...rows.slice(0, index + 1), { ...source, title, slug: slugify(title), active: false }, ...rows.slice(index + 1)]
    commit(next); setPanel({ index: index + 1, mode: 'edit' })
  }
  const remove = (index: number) => { if (confirmRemove(text(rows[index].title) || `Blog post ${index + 1}`)) { commit(rows.filter((_, rowIndex) => rowIndex !== index)); setPanel(null) } }

  return <div className={styles.guidedEditor}>
    <SectionTitle icon={<BookOpenText size={20} />} title="Publish helpful blog posts" description="Create guides and educational content with a cover image, author and category." />
    <CollectionToolbar count={rows.length} noun="post" addLabel="New blog post" disabled={disabled} onAdd={add} />
    <div className={styles.collectionList}>{rows.map((row, index) => <CollectionItem key={`${text(row.slug)}-${index}`} index={index} kind="Blog post" title={text(row.title) || 'Untitled post'} meta={`${text(row.category) || 'Guide'} · ${text(row.publishedDate) || 'No date'}`} summary={text(row.summary)} active={checked(row.active)} activeLabel={checked(row.active) ? 'Visible' : 'Hidden'} disabled={disabled} mode={panel?.index === index ? panel.mode : null} onMode={(mode) => setPanel(mode ? { index, mode } : null)} onToggle={(active) => update(index, 'active', active)} onDuplicate={() => duplicate(index)} onRemove={() => remove(index)}
      edit={<div className={styles.formGrid}>
        <label className={styles.spanTwo}>Post title<input value={text(row.title)} onChange={(event) => updateTitle(index, event.target.value)} placeholder="5 things to check before exchanging currency" maxLength={180} disabled={disabled} /></label>
        <label>Publish date<input type="date" value={text(row.publishedDate)} onChange={(event) => update(index, 'publishedDate', event.target.value)} disabled={disabled} /></label>
        <label>Category<input value={text(row.category)} onChange={(event) => update(index, 'category', event.target.value)} placeholder="Travel tips" maxLength={80} disabled={disabled} /></label>
        <label>Author<input value={text(row.author)} onChange={(event) => update(index, 'author', event.target.value)} placeholder="HME" maxLength={100} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Short summary<textarea value={text(row.summary)} onChange={(event) => update(index, 'summary', event.target.value)} placeholder="A short introduction shown on the Blog card." maxLength={500} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Full post<textarea className={styles.articleBody} value={text(row.body)} onChange={(event) => update(index, 'body', event.target.value)} placeholder="Write the full guide here. Use blank lines between paragraphs." maxLength={20000} disabled={disabled} /></label>
        <div className={styles.spanTwo}><label>Cover image</label><ImageUploadField value={text(row.image)} alt={text(row.imageAlt) || text(row.title)} disabled={disabled} onChange={(url) => update(index, 'image', url)} /></div>
        {text(row.image) && <label className={styles.spanTwo}>Image description<input value={text(row.imageAlt)} onChange={(event) => update(index, 'imageAlt', event.target.value)} placeholder="Describe what is shown in the image" maxLength={180} disabled={disabled} /></label>}
        <label className={styles.spanTwo}>URL name<input value={text(row.slug)} onChange={(event) => update(index, 'slug', slugify(event.target.value))} disabled={disabled} /><small>Created automatically from the post title.</small></label>
      </div>}
      preview={<PreviewCard image={text(row.image)} imageAlt={text(row.imageAlt)} eyebrow={`${text(row.category) || 'Guide'} · ${text(row.publishedDate)}`} title={text(row.title) || 'Blog title'} summary={text(row.summary)} body={text(row.body)} />}
    />)}</div>
    {rows.length === 0 && <div className={styles.blankState}>No blog post added yet.</div>}
  </div>
}

function CareersEditor({ payload, disabled, onChange }: Omit<Props, 'type'>) {
  const root = record(payload)
  const rows = Array.isArray(root.jobs) ? root.jobs.map(record) : []
  const [panel, setPanel] = useState<{ index: number; mode: ItemPanelMode } | null>(null)
  const commitRoot = (key: string, value: unknown) => onChange({ ...root, [key]: value })
  const commit = (next: Entry[]) => onChange({ ...root, jobs: next })
  const update = (index: number, key: string, value: unknown) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  const updateTitle = (index: number, value: string) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, title: value, slug: slugify(value) } : row))
  const add = () => { commit([...rows, { slug: `new-vacancy-${rows.length + 1}`, title: '', location: '', employmentType: 'Full-time', summary: '', description: '', applyEmail: text(root.generalApplicationsEmail), applyUrl: '', active: true }]); setPanel({ index: rows.length, mode: 'edit' }) }
  const duplicate = (index: number) => {
    const source = rows[index]
    const title = `${text(source.title) || 'Vacancy'} copy`
    const next = [...rows.slice(0, index + 1), { ...source, title, slug: slugify(title), active: false }, ...rows.slice(index + 1)]
    commit(next); setPanel({ index: index + 1, mode: 'edit' })
  }
  const remove = (index: number) => { if (confirmRemove(text(rows[index].title) || `Vacancy ${index + 1}`)) { commit(rows.filter((_, rowIndex) => rowIndex !== index)); setPanel(null) } }

  return <div className={styles.guidedEditor}>
    <SectionTitle icon={<BriefcaseBusiness size={20} />} title="Manage careers and vacancies" description={`${rows.length} ${rows.length === 1 ? 'vacancy' : 'vacancies'} currently listed. Edit the roles below or add a new one.`} />
    <section className={styles.formCard}>
      <div className={styles.formCardHead}><div><span>Careers page</span><strong>Page introduction</strong></div></div>
      <div className={styles.formGrid}>
        <label className={styles.spanTwo}>Introductory message<textarea value={text(root.intro)} onChange={(event) => commitRoot('intro', event.target.value)} maxLength={500} disabled={disabled} /></label>
        <label className={styles.spanTwo}>General applications email<input type="email" value={text(root.generalApplicationsEmail)} onChange={(event) => commitRoot('generalApplicationsEmail', event.target.value)} placeholder="careers@example.com" disabled={disabled} /></label>
      </div>
    </section>
    <CollectionToolbar count={rows.length} noun="vacancy" plural="vacancies" addLabel="New vacancy" disabled={disabled} onAdd={add} />
    <div className={styles.collectionList}>{rows.map((row, index) => <CollectionItem key={`${text(row.slug)}-${index}`} index={index} kind="Vacancy" title={text(row.title) || 'Untitled role'} meta={`${text(row.location) || 'No location'} · ${text(row.employmentType) || 'Employment type not set'}`} summary={text(row.summary)} active={checked(row.active)} activeLabel={checked(row.active) ? 'Open' : 'Closed'} disabled={disabled} mode={panel?.index === index ? panel.mode : null} onMode={(mode) => setPanel(mode ? { index, mode } : null)} onToggle={(active) => update(index, 'active', active)} onDuplicate={() => duplicate(index)} onRemove={() => remove(index)}
      edit={<div className={styles.formGrid}>
        <label className={styles.spanTwo}>Job title<input value={text(row.title)} onChange={(event) => updateTitle(index, event.target.value)} placeholder="Branch Customer Service Officer" maxLength={160} disabled={disabled} /></label>
        <label>Location<input value={text(row.location)} onChange={(event) => update(index, 'location', event.target.value)} placeholder="Head Office" maxLength={120} disabled={disabled} /></label>
        <label>Employment type<input value={text(row.employmentType)} onChange={(event) => update(index, 'employmentType', event.target.value)} placeholder="Full-time" maxLength={80} disabled={disabled} /></label>
        <label>Closing date <span>(optional)</span><input type="date" value={text(row.closingDate)} onChange={(event) => update(index, 'closingDate', event.target.value || undefined)} disabled={disabled} /></label>
        <label>Application email<input type="email" value={text(row.applyEmail)} onChange={(event) => update(index, 'applyEmail', event.target.value || undefined)} placeholder="careers@example.com" disabled={disabled} /></label>
        <label className={styles.spanTwo}>Short role summary<textarea value={text(row.summary)} onChange={(event) => update(index, 'summary', event.target.value)} maxLength={500} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Responsibilities and requirements<textarea className={styles.articleBody} value={text(row.description)} onChange={(event) => update(index, 'description', event.target.value)} maxLength={20000} disabled={disabled} /></label>
        <label className={styles.spanTwo}>Application link <span>(optional)</span><input value={text(row.applyUrl)} onChange={(event) => update(index, 'applyUrl', event.target.value)} placeholder="https://... or /contact" disabled={disabled} /></label>
        <label className={styles.spanTwo}>URL name<input value={text(row.slug)} onChange={(event) => update(index, 'slug', slugify(event.target.value))} disabled={disabled} /></label>
      </div>}
      preview={<PreviewCard eyebrow={`${text(row.location)} · ${text(row.employmentType)}`} title={text(row.title) || 'Job title'} summary={text(row.summary)} body={text(row.description)} />}
    />)}</div>
    {rows.length === 0 && <div className={styles.blankState}>No active vacancy. General applications will still be shown.</div>}
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
  const [panel, setPanel] = useState<{ index: number; mode: ItemPanelMode } | null>(null)
  const [query, setQuery] = useState('')
  const commit = (next: Entry[]) => onChange({ ...root, branches: next })
  const update = (index: number, key: string, value: unknown) => commit(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  const add = () => { commit([...rows, { name: '', state: '', address: '', phone: '', whatsapp: '', hours: 'Mon–Sun', services: ['Currency Exchange', 'Money Transfer'], mapsUrl: '', latitude: null, longitude: null, active: true }]); setQuery(''); setPanel({ index: rows.length, mode: 'edit' }) }
  const duplicate = (index: number) => {
    const source = rows[index]
    const next = [...rows.slice(0, index + 1), { ...source, name: `${text(source.name) || 'Branch'} copy`, active: false }, ...rows.slice(index + 1)]
    commit(next); setQuery(''); setPanel({ index: index + 1, mode: 'edit' })
  }
  const remove = (index: number) => { if (confirmRemove(text(rows[index].name) || `Branch ${index + 1}`)) { commit(rows.filter((_, rowIndex) => rowIndex !== index)); setPanel(null) } }
  const filtered = rows.map((row, index) => ({ row, index })).filter(({ row }) => `${text(row.name)} ${text(row.state)} ${text(row.address)}`.toLowerCase().includes(query.trim().toLowerCase()))

  return <div className={styles.guidedEditor}>
    <SectionTitle icon={<Building2 size={20} />} title="Manage branch information" description="Add the address, opening hours and services customers can find at each branch." />
    <CollectionToolbar count={rows.length} noun="branch" plural="branches" addLabel="New branch" disabled={disabled} onAdd={add}>
      <label className={styles.collectionSearch}><span className="sr-only">Search branches</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search branch, state or address" /></label>
    </CollectionToolbar>
    <div className={styles.collectionList}>{filtered.map(({ row, index }) => <CollectionItem key={`${text(row.name)}-${index}`} index={index} kind="Branch" title={text(row.name) || 'Unnamed branch'} meta={text(row.state) || 'State not set'} summary={text(row.address)} active={checked(row.active)} activeLabel={checked(row.active) ? 'Visible' : 'Hidden'} disabled={disabled} mode={panel?.index === index ? panel.mode : null} onMode={(mode) => setPanel(mode ? { index, mode } : null)} onToggle={(active) => update(index, 'active', active)} onDuplicate={() => duplicate(index)} onRemove={() => remove(index)}
      edit={<div className={styles.formGrid}>
        <label>Branch name<input value={text(row.name)} onChange={(event) => update(index, 'name', event.target.value)} placeholder="Ampang" disabled={disabled} /></label>
        <label>State<input value={text(row.state)} onChange={(event) => update(index, 'state', event.target.value)} placeholder="Kuala Lumpur" disabled={disabled} /></label>
        <label className={styles.spanTwo}>Full address<textarea value={text(row.address)} onChange={(event) => update(index, 'address', event.target.value)} placeholder="Building, street, postcode and city" disabled={disabled} /></label>
        <label>Phone number<input value={text(row.phone)} onChange={(event) => update(index, 'phone', event.target.value)} placeholder="+60..." disabled={disabled} /></label>
        <label>Opening hours<input value={text(row.hours)} onChange={(event) => update(index, 'hours', event.target.value)} placeholder="Mon–Sun, 10am–8pm" disabled={disabled} /></label>
        <label className={styles.spanTwo}>Services<input value={Array.isArray(row.services) ? row.services.map(text).join(', ') : ''} onChange={(event) => update(index, 'services', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} placeholder="Currency Exchange, Money Transfer" disabled={disabled} /><small>Separate services with commas.</small></label>
        <label>WhatsApp link<input value={text(row.whatsapp)} onChange={(event) => update(index, 'whatsapp', event.target.value)} placeholder="https://wa.me/60..." disabled={disabled} /></label>
        <label>Google Maps link<input value={text(row.mapsUrl)} onChange={(event) => update(index, 'mapsUrl', event.target.value)} placeholder="https://maps.google.com/..." disabled={disabled} /></label>
      </div>}
      preview={<PreviewCard eyebrow={text(row.state)} title={text(row.name) || 'Branch name'} summary={text(row.address)} body={`${text(row.hours)}${Array.isArray(row.services) ? ` · ${row.services.map(text).join(' · ')}` : ''}`} />}
    />)}</div>
    {filtered.length === 0 && rows.length > 0 && <div className={styles.blankState}>No branch matches “{query}”. Try another search.</div>}
    {rows.length === 0 && <div className={styles.blankState}>No branches added yet.</div>}
  </div>
}

export function GuidedEditor(props: Props) {
  if (props.type === 'pages') return <PagesEditor {...props} />
  if (props.type === 'global') return <GlobalEditor {...props} />
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

  if (type === 'pages') {
    const hero = record(root.hero)
    const sections = Array.isArray(root.sections) ? root.sections.map(record).filter((section) => checked(section.visible)) : []
    return <div className={styles.previewSurface}>
      <div className={styles.pageHeroPreview}>
        {text(hero.image) && <Image src={text(hero.image)} alt={text(hero.imageAlt)} fill sizes="900px" />}
        <div><small>{text(hero.eyebrow)}</small><h3>{text(hero.title) || 'Page heading'}</h3><p>{text(hero.lead)}</p></div>
      </div>
      <div className={styles.pageSectionsPreview}>{sections.map((section, index) => <PreviewCard key={index} image={text(section.image)} imageAlt={text(section.imageAlt)} eyebrow={text(section.eyebrow)} title={text(section.heading) || text(section.name)} body={text(section.body)} />)}{sections.length === 0 && <div className={styles.blankState}>The current page sections remain unchanged.</div>}</div>
    </div>
  }

  if (type === 'global') {
    return <div className={styles.previewSurface}><div className={styles.previewHeader}><Globe2 size={21} /><div><span>Shared website details</span><h3>Footer preview</h3></div></div><div className={styles.contactPreview}><div><strong>Social media links</strong><span>{text(root.facebookUrl)}</span><span>{text(root.instagramUrl)}</span><span>{text(root.tiktokUrl)}</span><span>{text(root.linkedinUrl)}</span></div><p>{text(root.footerCopyright)}</p></div></div>
  }

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
