import 'server-only'

import { z } from 'zod'

const positiveRate = z.union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => /^\d+(\.\d{1,8})?$/.test(value), 'Use a positive decimal with up to 8 decimal places')
  .refine((value) => Number(value) > 0, 'Published rates must be greater than zero')

const rate = z.object({
  code: z.string().trim().regex(/^[A-Z]{3}$/),
  name: z.string().trim().min(1).max(80),
  country: z.string().trim().regex(/^[A-Z]{2}$/),
  buy: positiveRate,
  sell: positiveRate,
}).strict()

const rates = z.object({
  rates: z.array(rate).min(1).max(250),
  disclaimer: z.string().trim().max(500).optional().default(''),
  effectiveAt: z.string().datetime({ offset: true }).optional(),
}).strict().superRefine((value, ctx) => {
  const seen = new Set<string>()
  value.rates.forEach((entry, index) => {
    if (seen.has(entry.code)) {
      ctx.addIssue({
        code: 'custom',
        path: ['rates', index, 'code'],
        message: 'Currency codes must be unique',
      })
    }
    seen.add(entry.code)
  })
})


const cmsImage = z.string().trim().max(1000).refine((value) =>
  value === '' ||
  value.startsWith('/images/') ||
  /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(value),
'Use an image uploaded through the CMS')

const promotion = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  title: z.string().trim().min(1).max(140),
  summary: z.string().trim().min(1).max(500),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  image: cmsImage.optional().default(''),
  ctaLabel: z.string().trim().max(80).optional().default(''),
  ctaHref: z.string().trim().max(500).optional().default(''),
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
  whatsapp: z.string().trim().max(200).optional().default(''),
  hours: z.string().trim().min(1).max(200),
  services: z.array(z.string().trim().min(1).max(80)).max(20),
  mapsUrl: z.string().trim().max(500).optional().default(''),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  active: z.boolean().optional().default(true),
}).strict().superRefine((value, ctx) => {
  const hasLatitude = typeof value.latitude === 'number'
  const hasLongitude = typeof value.longitude === 'number'
  if (hasLatitude !== hasLongitude) {
    ctx.addIssue({
      code: 'custom',
      path: [hasLatitude ? 'longitude' : 'latitude'],
      message: 'Latitude and longitude must be supplied together',
    })
  }
})

const branches = z.object({
  branches: z.array(branch).max(500),
}).strict()


const newsArticle = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  title: z.string().trim().min(1).max(180),
  summary: z.string().trim().min(1).max(500),
  body: z.string().trim().min(1).max(20000),
  publishedDate: z.string().date(),
  image: cmsImage.optional().default(''),
  imageAlt: z.string().trim().max(180).optional().default(''),
  author: z.string().trim().max(100).optional().default('HME'),
  active: z.boolean().optional().default(true),
}).strict()

const news = z.object({
  articles: z.array(newsArticle).max(200),
}).strict()

const schemas = { rates, promotions, branches, news }
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
