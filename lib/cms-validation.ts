import 'server-only'

import { z } from 'zod'

const decimalText = z.union([z.string(), z.number()])
  .transform((value) => String(value).trim())

const positiveRate = decimalText
  .refine((value) => /^\d+(\.\d{1,8})?$/.test(value) && Number(value) > 0, 'Use a positive decimal greater than zero with up to 8 decimal places')

const editableDecimal = decimalText.refine((value) => value.length <= 40, 'Rate value is too long')

const optionalAmount = decimalText
  .refine((value) => value === '' || /^\d+(\.\d{1,8})?$/.test(value), 'Use a non-negative decimal with up to 8 decimal places')

const cmsImage = z.string().trim().max(1000).refine((value) =>
  value === '' ||
  value.startsWith('/images/') ||
  /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(value),
'Use an image uploaded through the CMS')

const safeLink = z.string().trim().max(500).refine((value) =>
  value === '' || value.startsWith('/') || /^https:\/\//i.test(value),
'Use an internal path or HTTPS link')

const httpsLink = z.string().trim().max(500).refine((value) =>
  value === '' || /^https:\/\//i.test(value),
'Use a secure HTTPS link')

const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100)

const rate = z.object({
  code: z.string().trim().regex(/^[A-Z]{3}$/),
  name: z.string().trim().min(1).max(80),
  country: z.string().trim().regex(/^[A-Z]{2}$/),
  buy: positiveRate,
  sell: positiveRate,
}).strict()

const editableRate = z.object({
  code: z.string().trim().max(3),
  name: z.string().trim().max(80),
  country: z.string().trim().max(2),
  buy: editableDecimal,
  sell: editableDecimal,
}).strict()

const rates = z.object({
  visible: z.boolean().optional().default(true),
  rates: z.array(editableRate).max(250),
  disclaimer: z.string().trim().max(500).optional().default(''),
  effectiveAt: z.string().datetime({ offset: true }).optional(),
}).strict().superRefine((value, ctx) => {
  if (!value.visible) return
  if (value.visible && value.rates.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['rates'], message: 'Add at least one currency or switch online rates off' })
  }
  const seen = new Set<string>()
  value.rates.forEach((entry, index) => {
    const parsed = rate.safeParse(entry)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => ctx.addIssue({
        code: 'custom',
        path: ['rates', index, ...issue.path],
        message: issue.message,
      }))
      return
    }
    if (seen.has(parsed.data.code)) {
      ctx.addIssue({ code: 'custom', path: ['rates', index, 'code'], message: 'Currency codes must be unique' })
    }
    seen.add(parsed.data.code)
  })
})

const transferRate = z.object({
  countryCode: z.string().trim().regex(/^[A-Z]{2}$/),
  country: z.string().trim().min(1).max(100),
  currency: z.string().trim().regex(/^[A-Z]{3}$/),
  rate: positiveRate,
  fee: optionalAmount.optional().default(''),
  active: z.boolean().optional().default(true),
}).strict()

const editableTransferRate = z.object({
  countryCode: z.string().trim().max(2),
  country: z.string().trim().max(100),
  currency: z.string().trim().max(3),
  rate: editableDecimal,
  fee: editableDecimal.optional().default(''),
  active: z.boolean().optional().default(true),
}).strict()

const transferRates = z.object({
  visible: z.boolean().optional().default(true),
  rates: z.array(editableTransferRate).max(250),
  disclaimer: z.string().trim().max(500).optional().default(''),
  effectiveAt: z.string().datetime({ offset: true }).optional(),
}).strict().superRefine((value, ctx) => {
  if (!value.visible) return
  if (value.visible && value.rates.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['rates'], message: 'Add at least one destination or switch online rates off' })
  }
  const seen = new Set<string>()
  value.rates.forEach((entry, index) => {
    const parsed = transferRate.safeParse(entry)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => ctx.addIssue({
        code: 'custom',
        path: ['rates', index, ...issue.path],
        message: issue.message,
      }))
      return
    }
    const key = `${parsed.data.countryCode}:${parsed.data.currency}`
    if (seen.has(key)) {
      ctx.addIssue({ code: 'custom', path: ['rates', index, 'currency'], message: 'Destination and currency combinations must be unique' })
    }
    seen.add(key)
  })
})

const promotion = z.object({
  slug,
  title: z.string().trim().min(1).max(140),
  summary: z.string().trim().min(1).max(500),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  image: cmsImage.optional().default(''),
  ctaLabel: z.string().trim().max(80).optional().default(''),
  ctaHref: safeLink.optional().default(''),
  active: z.boolean().optional().default(true),
}).strict().superRefine((value, ctx) => {
  if (value.startDate && value.endDate && value.endDate < value.startDate) {
    ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'End date must not be before start date' })
  }
})

const promotions = z.object({
  promotions: z.array(promotion).max(100),
}).strict()

const branch = z.object({
  name: z.string().trim().min(1).max(140),
  state: z.string().trim().min(1).max(80),
  address: z.string().trim().min(1).max(500),
  phone: z.string().trim().max(40).optional().default(''),
  whatsapp: httpsLink.optional().default(''),
  hours: z.string().trim().min(1).max(200),
  services: z.array(z.string().trim().min(1).max(80)).max(20),
  mapsUrl: httpsLink.optional().default(''),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  active: z.boolean().optional().default(true),
}).strict().superRefine((value, ctx) => {
  const hasLatitude = typeof value.latitude === 'number'
  const hasLongitude = typeof value.longitude === 'number'
  if (hasLatitude !== hasLongitude) {
    ctx.addIssue({ code: 'custom', path: [hasLatitude ? 'longitude' : 'latitude'], message: 'Latitude and longitude must be supplied together' })
  }
})

const branches = z.object({
  branches: z.array(branch).max(500),
}).strict()

const article = z.object({
  slug,
  title: z.string().trim().min(1).max(180),
  summary: z.string().trim().min(1).max(500),
  body: z.string().trim().min(1).max(20000),
  publishedDate: z.string().date(),
  image: cmsImage.optional().default(''),
  imageAlt: z.string().trim().max(180).optional().default(''),
  author: z.string().trim().max(100).optional().default('HME'),
  category: z.string().trim().max(80).optional().default(''),
  active: z.boolean().optional().default(true),
}).strict()

const news = z.object({
  articles: z.array(article.omit({ category: true })).max(200),
}).strict()

const blog = z.object({
  posts: z.array(article).max(200),
}).strict()

const careerJob = z.object({
  slug,
  title: z.string().trim().min(1).max(160),
  location: z.string().trim().min(1).max(120),
  employmentType: z.string().trim().min(1).max(80),
  summary: z.string().trim().min(1).max(500),
  description: z.string().trim().min(1).max(20000),
  closingDate: z.string().date().optional(),
  applyEmail: z.string().trim().email().max(254).optional(),
  applyUrl: safeLink.optional().default(''),
  active: z.boolean().optional().default(true),
}).strict().superRefine((value, ctx) => {
  if (!value.applyEmail && !value.applyUrl) {
    ctx.addIssue({ code: 'custom', path: ['applyEmail'], message: 'Add an application email or application link' })
  }
})

const careers = z.object({
  heroImage: cmsImage.optional().default(''),
  heroImageAlt: z.string().trim().max(180).optional().default(''),
  intro: z.string().trim().min(1).max(500),
  generalApplicationsEmail: z.string().trim().email().max(254),
  jobs: z.array(careerJob).max(100),
}).strict()

const contact = z.object({
  headline: z.string().trim().min(1).max(120),
  lead: z.string().trim().min(1).max(500),
  phone: z.string().trim().min(3).max(40),
  whatsappUrl: httpsLink,
  email: z.string().trim().email().max(254),
  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().min(1).max(200),
  mapsUrl: httpsLink.optional().default(''),
  supportHeading: z.string().trim().min(1).max(140),
  supportNote: z.string().trim().min(1).max(700),
  services: z.array(z.string().trim().min(1).max(120)).min(1).max(12),
}).strict()

const pageSectionItem = z.object({
  id: slug,
  title: z.string().trim().min(1).max(180),
  body: z.string().trim().max(2000).optional().default(''),
  meta: z.string().trim().max(80).optional().default(''),
  active: z.boolean().optional().default(true),
}).strict()

const pageSection = z.object({
  id: slug,
  name: z.string().trim().min(1).max(120),
  kind: z.enum(['additional', 'content-slot']).optional().default('additional'),
  visible: z.boolean().optional().default(true),
  eyebrow: z.string().trim().max(120).optional().default(''),
  heading: z.string().trim().max(220).optional().default(''),
  body: z.string().trim().max(5000).optional().default(''),
  image: cmsImage.optional().default(''),
  imageAlt: z.string().trim().max(180).optional().default(''),
  items: z.array(pageSectionItem).max(30).optional().default([]),
}).strict()

const pages = z.object({
  pageName: z.string().trim().min(1).max(120),
  path: z.string().trim().startsWith('/').max(200),
  hero: z.object({
    eyebrow: z.string().trim().max(120).optional().default(''),
    title: z.string().trim().min(1).max(220),
    lead: z.string().trim().max(700).optional().default(''),
    image: cmsImage.optional().default(''),
    imageAlt: z.string().trim().max(180).optional().default(''),
  }).strict(),
  sections: z.array(pageSection).max(30),
}).strict().superRefine((value, ctx) => {
  const ids = new Set<string>()
  value.sections.forEach((section, index) => {
    if (ids.has(section.id)) {
      ctx.addIssue({ code: 'custom', path: ['sections', index, 'id'], message: 'Section names must be unique' })
    }
    ids.add(section.id)
    if (section.image && !section.imageAlt) {
      ctx.addIssue({ code: 'custom', path: ['sections', index, 'imageAlt'], message: 'Describe the section image for accessibility' })
    }
    const itemIds = new Set<string>()
    section.items.forEach((item, itemIndex) => {
      if (itemIds.has(item.id)) {
        ctx.addIssue({ code: 'custom', path: ['sections', index, 'items', itemIndex, 'id'], message: 'Item names must be unique within a section' })
      }
      itemIds.add(item.id)
    })
  })
  if (value.hero.image && !value.hero.imageAlt) {
    ctx.addIssue({ code: 'custom', path: ['hero', 'imageAlt'], message: 'Describe the hero image for accessibility' })
  }
})

const globalContent = z.object({
  facebookUrl: httpsLink.optional().default(''),
  instagramUrl: httpsLink.optional().default(''),
  tiktokUrl: httpsLink.optional().default(''),
  linkedinUrl: httpsLink.optional().default(''),
  footerCopyright: z.string().trim().min(1).max(240),
}).strict()

const schemas = {
  pages,
  global: globalContent,
  rates,
  'transfer-rates': transferRates,
  promotions,
  branches,
  news,
  blog,
  careers,
  contact,
}
export type CmsContentType = keyof typeof schemas

export function normalizeContentType(value: unknown): CmsContentType | null {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized in schemas ? normalized as CmsContentType : null
}

export function validateCmsPayload(contentType: CmsContentType, payload: unknown) {
  const serialized = JSON.stringify(payload)
  if (Buffer.byteLength(serialized || '', 'utf8') > 1024 * 1024) {
    return { success: false as const, errors: [{ path: 'payload', message: 'Payload exceeds the 1 MB limit' }] }
  }
  const result = schemas[contentType].safeParse(payload)
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    }
  }
  return { success: true as const, data: result.data }
}

export function validateSchedule(value: unknown) {
  if (value === null || value === undefined || value === '') return { success: true as const, data: null }
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    return { success: false as const, errors: [{ path: 'scheduled_for', message: 'Invalid publish date' }] }
  }
  return { success: true as const, data: date.toISOString() }
}
