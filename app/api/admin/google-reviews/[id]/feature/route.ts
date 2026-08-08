import { assertCmsOrigin, requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import { setReviewFeatured } from '@/lib/google-reviews-service'

export const runtime = 'nodejs'

type Context = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: Context) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    await requireCmsPermission('reviews.manage')
    const { id } = await context.params
    const rowId = Number(id)
    if (!Number.isInteger(rowId) || rowId <= 0) {
      return cmsJson({ error: 'Invalid review id', code: 'INVALID_ID' }, 400, requestId)
    }
    const body = await request.json().catch(() => ({})) as { featured?: boolean }
    await setReviewFeatured(rowId, Boolean(body.featured))
    return cmsJson({ ok: true }, 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
