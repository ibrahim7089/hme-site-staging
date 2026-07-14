import 'server-only'

import { normalizeContentType, validateCmsPayload, validateSchedule } from './cms-validation'

export async function parseCmsDraftRequest(request: Request, forced?: {
  contentType: string
  contentKey: string
}) {
  const body = await request.json() as Record<string, unknown>
  const contentType = normalizeContentType(forced?.contentType || body.content_type)
  const contentKey = String(forced?.contentKey || body.content_key || 'primary').trim().toLowerCase()
  const errors: Array<{ path: string; message: string }> = []

  if (!contentType) errors.push({ path: 'content_type', message: 'Use rates, promotions, or branches' })
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(contentKey) || contentKey.length > 80) {
    errors.push({ path: 'content_key', message: 'Use a lowercase URL-safe key' })
  }

  const payloadResult = contentType ? validateCmsPayload(contentType, body.payload) : null
  const scheduleResult = validateSchedule(body.scheduled_for)
  errors.push(...(payloadResult && !payloadResult.success ? payloadResult.errors : []))
  errors.push(...(!scheduleResult.success ? scheduleResult.errors : []))

  if (!contentType || !payloadResult?.success || !scheduleResult.success || errors.length) {
    return { success: false as const, errors }
  }

  return {
    success: true as const,
    data: {
      contentType,
      contentKey,
      payload: payloadResult.data,
      scheduledFor: scheduleResult.data,
      changeNote: String(body.change_note || '').trim().slice(0, 1000),
    },
  }
}
