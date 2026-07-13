import { createHmac, timingSafeEqual } from 'node:crypto'
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { CMS_TAG } from '@/lib/cms'

export const runtime = 'nodejs'

const MAX_CLOCK_SKEW_SECONDS = 300
const pathsByType: Record<string, string[]> = {
  rates: ['/', '/rates', '/currency-exchange', '/money-transfer-rates'],
  promotions: ['/promotions'],
  branches: ['/', '/locate-us', '/currency-exchange'],
}

function secureEqualHex(expected: string, received: string) {
  if (!/^[a-f0-9]{64}$/i.test(received)) return false
  const expectedBuffer = Buffer.from(expected, 'hex')
  const receivedBuffer = Buffer.from(received, 'hex')
  return expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
}

export async function POST(request: Request) {
  const secret = process.env.CMS_REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Revalidation is not configured' }, { status: 503 })
  }

  const timestamp = request.headers.get('x-hme-timestamp') || ''
  const signature = request.headers.get('x-hme-signature') || ''
  const seconds = Number(timestamp)
  if (!Number.isInteger(seconds) || Math.abs(Math.floor(Date.now() / 1000) - seconds) > MAX_CLOCK_SKEW_SECONDS) {
    return NextResponse.json({ error: 'Invalid or expired signature' }, { status: 401 })
  }

  const body = await request.text()
  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex')
  if (!secureEqualHex(expected, signature)) {
    return NextResponse.json({ error: 'Invalid or expired signature' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const contentTypes = payload && typeof payload === 'object' &&
    Array.isArray((payload as { contentTypes?: unknown }).contentTypes)
    ? (payload as { contentTypes: unknown[] }).contentTypes.filter(
      (value): value is string => typeof value === 'string' && value in pathsByType,
    )
    : []

  if (contentTypes.length === 0) {
    return NextResponse.json({ error: 'No supported content types' }, { status: 400 })
  }

  revalidateTag(CMS_TAG, 'max')
  const paths = new Set(contentTypes.flatMap((type) => pathsByType[type]))
  paths.forEach((path) => revalidatePath(path))

  return NextResponse.json({
    revalidated: true,
    contentTypes,
    paths: Array.from(paths),
    timestamp: new Date().toISOString(),
  })
}
