import { assertCmsOrigin, requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import { sendReviewReply } from '@/lib/google-reviews-service'

export const runtime = 'nodejs'

type Context = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: Context) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    const user = await requireCmsPermission('reviews.manage')
    const { id } = await context.params
    const rowId = Number(id)
    if (!Number.isInteger(rowId) || rowId <= 0) {
      return cmsJson({ error: 'Invalid review id', code: 'INVALID_ID' }, 400, requestId)
    }

    const body = await request.json().catch(() => ({})) as { text?: string }
    const text = (body.text || '').trim()
    if (!text) return cmsJson({ error: 'Reply text is required', code: 'REPLY_TEXT_REQUIRED' }, 400, requestId)
    if (text.length > 4000) return cmsJson({ error: 'Reply is too long', code: 'REPLY_TOO_LONG' }, 400, requestId)

    await sendReviewReply(rowId, text, user)
    return cmsJson({ ok: true }, 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
