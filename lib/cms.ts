import 'server-only'
import type { Branch } from './branches'
import type { Rate } from './rates'
import { branches as localBranches } from './branches'

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

type CmsSnapshot = {
  content?: {
    rates?: unknown
    promotions?: unknown
    branches?: unknown
  }
  meta?: {
    publishedAt?: string | null
    versions?: Record<string, { version?: number; checksum?: string; publishedAt?: string }>
  }
}

const CMS_TAG = 'hme-published-content'
const CMS_REVALIDATE_SECONDS = 300

function endpoint() {
  const configured = process.env.HME_CMS_API_URL?.trim()
  if (!configured) return null
  if (/\/api\/public\/content\/?$/.test(configured)) return configured
  return `${configured.replace(/\/$/, '')}/api/public/content`
}

async function getSnapshot(): Promise<CmsSnapshot | null> {
  const url = endpoint()
  if (!url) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
      cache: 'force-cache',
      next: {
        revalidate: CMS_REVALIDATE_SECONDS,
        tags: [CMS_TAG],
      },
    })
    if (!response.ok) return null
    const data: unknown = await response.json()
    return data && typeof data === 'object' ? data as CmsSnapshot : null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

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

    const mapsUrl = text(source.mapsUrl, 500) ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    branches.push({
      name,
      state,
      address,
      hours,
      services,
      phone: text(source.phone, 40) || '',
      whatsapp: text(source.whatsapp, 200) || '',
      mapsUrl,
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
    const slug = text(source.slug, 100)
    const title = text(source.title, 140)
    const summary = text(source.summary, 500)
    const startDate = text(source.startDate, 10) || undefined
    const endDate = text(source.endDate, 10) || undefined
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !title || !summary) return null
    if (source.active === false || (startDate && startDate > today) || (endDate && endDate < today)) continue

    promotions.push({
      slug,
      title,
      summary,
      startDate,
      endDate,
      image: text(source.image, 500) || undefined,
      ctaLabel: text(source.ctaLabel, 80) || undefined,
      ctaHref: text(source.ctaHref, 500) || undefined,
      active: true,
    })
  }
  return promotions
}

export async function getPublishedRates() {
  const snapshot = await getSnapshot()
  const payload = snapshot?.content?.rates
  const rates = validRates(payload) || []
  const source = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
  return {
    rates,
    disclaimer: text(source.disclaimer, 500),
    effectiveAt: text(source.effectiveAt, 50) || snapshot?.meta?.versions?.rates?.publishedAt || null,
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

export { CMS_TAG }
