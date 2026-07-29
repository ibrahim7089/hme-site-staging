import { randomUUID } from 'node:crypto'
import { createEnquiry, deliverEnquiryEmails, listEnquiryCategories } from '@/lib/enquiry-service'
import { enquirySchema } from '@/lib/enquiry'
import { CmsWorkflowError } from '@/lib/cms-service'

export const runtime = 'nodejs'

const MAX_BODY_BYTES = 32_000
const RATE_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT = 5

type RateEntry = { count: number; resetAt: number }

const globalRateStore = globalThis as typeof globalThis & {
  hmeEnquiryRates?: Map<string, RateEntry>
}

const rateStore = globalRateStore.hmeEnquiryRates ?? new Map<string, RateEntry>()
globalRateStore.hmeEnquiryRates = rateStore

function json(
  message: string,
  status: number,
  requestId: string,
  extra: Record<string, unknown> = {},
) {
  return Response.json(
    { message, requestId, ...extra },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  )
}

function clientKey(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

function isRateLimited(request: Request) {
  const now = Date.now()
  const key = clientKey(request)
  const current = rateStore.get(key)
  if (!current || current.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  current.count += 1
  rateStore.set(key, current)
  return current.count > RATE_LIMIT
}

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  const originHost = new URL(origin).host
  const requestHost = request.headers.get('x-forwarded-host')
    || request.headers.get('host')
    || new URL(request.url).host
  const allowed = (process.env.ENQUIRY_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return originHost === requestHost || allowed.includes(origin)
}

export async function GET() {
  try {
    return Response.json(
      { categories: await listEnquiryCategories() },
      { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } },
    )
  } catch (error) {
    console.error('[enquiry] Categories could not be loaded', { error })
    return Response.json(
      { message: 'Enquiry types are temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}

export async function POST(request: Request) {
  const requestId = randomUUID()

  if (!isAllowedOrigin(request)) {
    return json('This enquiry could not be accepted. Please refresh the page and try again.', 403, requestId)
  }

  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAX_BODY_BYTES) {
    return json('The enquiry is too large. Please shorten your message.', 413, requestId)
  }

  if (isRateLimited(request)) {
    return json('Too many enquiries were sent from this connection. Please wait 15 minutes and try again.', 429, requestId)
  }

  let body: unknown
  try {
    const rawBody = await request.text()
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return json('The enquiry is too large. Please shorten your message.', 413, requestId)
    }
    body = JSON.parse(rawBody)
  } catch {
    return json('The enquiry form was not valid. Please refresh the page and try again.', 400, requestId)
  }

  const parsed = enquirySchema.safeParse(body)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return json(issue?.message || 'Please check the form and try again.', 400, requestId)
  }

  const payload = parsed.data
  if (payload.website) {
    return json('Thank you. Your enquiry has been received by HME.', 202, requestId)
  }
  if (Date.now() - payload.startedAt < 1_000) {
    return json('Please wait a moment, then send your enquiry again.', 400, requestId)
  }

  try {
    const enquiry = await createEnquiry(payload, requestId)
    try {
      await deliverEnquiryEmails(enquiry, requestId)
    } catch (error) {
      console.error('[enquiry] Notification processing failed', { requestId, enquiryId: enquiry.id, error })
    }
    return json(
      `Thank you. HME received your enquiry. Your reference is ${enquiry.reference}.`,
      201,
      requestId,
      { reference: enquiry.reference },
    )
  } catch (error) {
    if (error instanceof CmsWorkflowError && error.status < 500) {
      return json(error.message, error.status, requestId)
    }
    console.error('[enquiry] Submission could not be saved', { requestId, error })
    return json('We could not record your enquiry. Please try again or contact HME by phone or WhatsApp.', 500, requestId)
  }
}
