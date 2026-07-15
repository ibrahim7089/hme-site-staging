import 'server-only'

import { unstable_cache } from 'next/cache'
import type { Branch } from './branches'
import type { Rate } from './rates'
import { branches as localBranches } from './branches'
import { CMS_TAG } from './cms-cache'
import { isCmsConfigured } from './cms-db'
import { getCmsPublishedSnapshot } from './cms-service'

export type PublishedPromotion = {
  slug: string
  title: string
  summary: string
  startDate?: string
  endDate?: string
  image?: string
  ctaLabel?: string
  ctaHref?: string
  active: boolean
}

export type PublishedArticle = {
  slug: string
  title: string
  summary: string
  body: string
  publishedDate: string
  image?: string
  imageAlt?: string
  author?: string
  category?: string
  active: boolean
}

export type PublishedNewsArticle = PublishedArticle

export type PublishedTransferRate = {
  countryCode: string
  country: string
  currency: string
  rate: string
  fee?: string
}

export type PublishedCareerJob = {
  slug: string
  title: string
  location: string
  employmentType: string
  summary: string
  description: string
  closingDate?: string
  applyEmail?: string
  applyUrl?: string
}

export type PublishedCareers = {
  heroImage?: string
  heroImageAlt?: string
  intro: string
  generalApplicationsEmail: string
  jobs: PublishedCareerJob[]
}

export type PublishedContact = {
  headline: string
  lead: string
  phone: string
  whatsappUrl: string
  email: string
  addressLine1: string
  addressLine2: string
  mapsUrl?: string
  supportHeading: string
  supportNote: string
  services: string[]
}

type CmsSnapshot = Awaited<ReturnType<typeof getCmsPublishedSnapshot>>

const getSnapshot = unstable_cache(
  async (): Promise<CmsSnapshot | null> => {
    if (!isCmsConfigured()) return null
    try {
      return await getCmsPublishedSnapshot()
    } catch (error) {
      console.error('[cms-snapshot]', error)
      return null
    }
  },
  ['hme-cms-published-snapshot-v2'],
  { revalidate: 300, tags: [CMS_TAG] },
)

function text(value: unknown, max = 500) {
  return typeof value === 'string' && value.trim() && value.length <= max
    ? value.trim()
    : null
}

function positiveRate(value: unknown) {
  const normalized = typeof value === 'number' ? String(value) : text(value, 40)
  if (!normalized || !/^\d+(\.\d{1,8})?$/.test(normalized) || Number(normalized) <= 0) return null
  return normalized
}

function optionalAmount(value: unknown) {
  if (value === '' || value === undefined || value === null) return ''
  const normalized = typeof value === 'number' ? String(value) : text(value, 40)
  if (!normalized || !/^\d+(\.\d{1,8})?$/.test(normalized)) return null
  return normalized
}

function cmsImage(value: unknown) {
  const normalized = text(value, 1000)
  if (!normalized) return undefined
  return normalized.startsWith('/images/') ||
    /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(normalized)
    ? normalized
    : undefined
}

function safeLink(value: unknown) {
  const normalized = text(value, 500)
  if (!normalized) return undefined
  return normalized.startsWith('/') || /^https:\/\//i.test(normalized) ? normalized : undefined
}

function httpsLink(value: unknown) {
  const normalized = text(value, 500)
  if (!normalized) return undefined
  return /^https:\/\//i.test(normalized) ? normalized : undefined
}

function validRates(value: unknown): Rate[] | null {
  if (!value || typeof value !== 'object') return null
  const rows = (value as { rates?: unknown }).rates
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 250) return null

  const seen = new Set<string>()
  const rates: Rate[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') return null
    const source = row as Record<string, unknown>
    const code = text(source.code, 3)
    const name = text(source.name, 80)
    const country = text(source.country, 2)
    const buy = positiveRate(source.buy)
    const sell = positiveRate(source.sell)
    if (!code || !/^[A-Z]{3}$/.test(code) || seen.has(code) || !name || !country || !/^[A-Z]{2}$/.test(country) || !buy || !sell) {
      return null
    }
    seen.add(code)
    rates.push({ code, name, country, buy, sell })
  }
  return rates
}

function validTransferRates(value: unknown): PublishedTransferRate[] | null {
  if (!value || typeof value !== 'object') return null
  const rows = (value as { rates?: unknown }).rates
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 250) return null

  const seen = new Set<string>()
  const rates: PublishedTransferRate[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') return null
    const source = row as Record<string, unknown>
    if (source.active === false) continue
    const countryCode = text(source.countryCode, 2)
    const country = text(source.country, 100)
    const currency = text(source.currency, 3)
    const rate = positiveRate(source.rate)
    const fee = optionalAmount(source.fee)
    const key = `${countryCode}:${currency}`
    if (!countryCode || !/^[A-Z]{2}$/.test(countryCode) || !country || !currency ||
      !/^[A-Z]{3}$/.test(currency) || !rate || fee === null || seen.has(key)) return null
    seen.add(key)
    rates.push({ countryCode, country, currency, rate, fee: fee || undefined })
  }
  return rates
}

function validBranches(value: unknown): Branch[] | null {
  if (!value || typeof value !== 'object') return null
  const rows = (value as { branches?: unknown }).branches
  if (!Array.isArray(rows) || rows.length > 500) return null

  const branches: Branch[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') return null
    const source = row as Record<string, unknown>
    if (source.active === false) continue
    const name = text(source.name, 140)
    const state = text(source.state, 80)
    const address = text(source.address, 500)
    const hours = text(source.hours, 200)
    const services = Array.isArray(source.services)
      ? source.services.map((service) => text(service, 80)).filter((service): service is string => Boolean(service))
      : null
    if (!name || !state || !address || !hours || !services) return null

    branches.push({
      name,
      state,
      address,
      hours,
      services,
      phone: text(source.phone, 40) || '',
      whatsapp: httpsLink(source.whatsapp) || '',
      mapsUrl: httpsLink(source.mapsUrl) ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
    })
  }
  return branches
}

function validPromotions(value: unknown): PublishedPromotion[] | null {
  if (!value || typeof value !== 'object') return null
  const rows = (value as { promotions?: unknown }).promotions
  if (!Array.isArray(rows) || rows.length > 100) return null

  const today = new Date().toISOString().slice(0, 10)
  const promotions: PublishedPromotion[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') return null
    const source = row as Record<string, unknown>
    const entrySlug = text(source.slug, 100)
    const title = text(source.title, 140)
    const summary = text(source.summary, 500)
    const startDate = text(source.startDate, 10) || undefined
    const endDate = text(source.endDate, 10) || undefined
    if (!entrySlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entrySlug) || !title || !summary) return null
    if (source.active === false || (startDate && startDate > today) || (endDate && endDate < today)) continue

    promotions.push({
      slug: entrySlug,
      title,
      summary,
      startDate,
      endDate,
      image: cmsImage(source.image),
      ctaLabel: text(source.ctaLabel, 80) || undefined,
      ctaHref: safeLink(source.ctaHref),
      active: true,
    })
  }
  return promotions
}

function validArticles(value: unknown, key: 'articles' | 'posts'): PublishedArticle[] | null {
  if (!value || typeof value !== 'object') return null
  const rows = (value as Record<string, unknown>)[key]
  if (!Array.isArray(rows) || rows.length > 200) return null

  const articles: PublishedArticle[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') return null
    const source = row as Record<string, unknown>
    const entrySlug = text(source.slug, 100)
    const title = text(source.title, 180)
    const summary = text(source.summary, 500)
    const body = text(source.body, 20000)
    const publishedDate = text(source.publishedDate, 10)
    if (!entrySlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entrySlug) || !title || !summary || !body ||
      !publishedDate || !/^\d{4}-\d{2}-\d{2}$/.test(publishedDate)) return null
    if (source.active === false) continue
    articles.push({
      slug: entrySlug,
      title,
      summary,
      body,
      publishedDate,
      image: cmsImage(source.image),
      imageAlt: text(source.imageAlt, 180) || undefined,
      author: text(source.author, 100) || 'HME',
      category: text(source.category, 80) || undefined,
      active: true,
    })
  }
  return articles.sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))
}

function validCareers(value: unknown): PublishedCareers | null {
  if (!value || typeof value !== 'object') return null
  const source = value as Record<string, unknown>
  const intro = text(source.intro, 500)
  const generalApplicationsEmail = text(source.generalApplicationsEmail, 254)
  const rows = source.jobs
  if (!intro || !generalApplicationsEmail || !/^\S+@\S+\.\S+$/.test(generalApplicationsEmail) ||
    !Array.isArray(rows) || rows.length > 100) return null

  const today = new Date().toISOString().slice(0, 10)
  const jobs: PublishedCareerJob[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') return null
    const job = row as Record<string, unknown>
    if (job.active === false) continue
    const entrySlug = text(job.slug, 100)
    const title = text(job.title, 160)
    const location = text(job.location, 120)
    const employmentType = text(job.employmentType, 80)
    const summary = text(job.summary, 500)
    const description = text(job.description, 20000)
    const closingDate = text(job.closingDate, 10) || undefined
    const applyEmail = text(job.applyEmail, 254) || undefined
    const applyUrl = safeLink(job.applyUrl)
    if (!entrySlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entrySlug) || !title || !location ||
      !employmentType || !summary || !description || (!applyEmail && !applyUrl)) return null
    if (closingDate && closingDate < today) continue
    jobs.push({ slug: entrySlug, title, location, employmentType, summary, description, closingDate, applyEmail, applyUrl })
  }

  return {
    heroImage: cmsImage(source.heroImage),
    heroImageAlt: text(source.heroImageAlt, 180) || undefined,
    intro,
    generalApplicationsEmail,
    jobs,
  }
}

function validContact(value: unknown): PublishedContact | null {
  if (!value || typeof value !== 'object') return null
  const source = value as Record<string, unknown>
  const services = Array.isArray(source.services)
    ? source.services.map((service) => text(service, 120)).filter((service): service is string => Boolean(service))
    : null
  const result = {
    headline: text(source.headline, 120),
    lead: text(source.lead, 500),
    phone: text(source.phone, 40),
    whatsappUrl: httpsLink(source.whatsappUrl),
    email: text(source.email, 254),
    addressLine1: text(source.addressLine1, 200),
    addressLine2: text(source.addressLine2, 200),
    mapsUrl: httpsLink(source.mapsUrl),
    supportHeading: text(source.supportHeading, 140),
    supportNote: text(source.supportNote, 700),
    services,
  }
  if (!result.headline || !result.lead || !result.phone || !result.whatsappUrl || !result.email ||
    !result.addressLine1 || !result.addressLine2 || !result.supportHeading || !result.supportNote ||
    !result.services?.length || !/^\S+@\S+\.\S+$/.test(result.email)) return null
  return result as PublishedContact
}

export async function getPublishedRates() {
  const snapshot = await getSnapshot()
  const payload = snapshot?.content?.rates
  const source = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
  return {
    rates: source.visible === false ? [] : validRates(payload) || [],
    disclaimer: text(source.disclaimer, 500),
    effectiveAt: text(source.effectiveAt, 50) ||
      (snapshot?.meta.versions.rates as { publishedAt?: string } | undefined)?.publishedAt ||
      null,
  }
}

export async function getPublishedTransferRates() {
  const snapshot = await getSnapshot()
  const payload = snapshot?.content?.['transfer-rates']
  const source = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
  return {
    rates: source.visible === false ? [] : validTransferRates(payload) || [],
    disclaimer: text(source.disclaimer, 500),
    effectiveAt: text(source.effectiveAt, 50) ||
      (snapshot?.meta.versions['transfer-rates'] as { publishedAt?: string } | undefined)?.publishedAt ||
      null,
  }
}

export async function getPublishedBranches() {
  const snapshot = await getSnapshot()
  return validBranches(snapshot?.content?.branches) || localBranches
}

export async function getPublishedPromotions() {
  const snapshot = await getSnapshot()
  return validPromotions(snapshot?.content?.promotions) || []
}

export async function getPublishedNews() {
  const snapshot = await getSnapshot()
  return validArticles(snapshot?.content?.news, 'articles')
}

export async function getPublishedBlog() {
  const snapshot = await getSnapshot()
  return validArticles(snapshot?.content?.blog, 'posts')
}

export async function getPublishedCareers() {
  const snapshot = await getSnapshot()
  return validCareers(snapshot?.content?.careers)
}

export async function getPublishedContact() {
  const snapshot = await getSnapshot()
  return validContact(snapshot?.content?.contact)
}

export { CMS_TAG }
