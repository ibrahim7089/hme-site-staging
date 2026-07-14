import { assertCmsOrigin, requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import { parseCmsDraftRequest } from '@/lib/cms-route-validation'
import { getCmsItem, updateCmsDraft } from '@/lib/cms-service'

export const runtime = 'nodejs'

type Context = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: Context) {
  const requestId = cmsRequestId(request)
  try {
    await requireCmsPermission('publishing.view')
    const { id } = await context.params
    const item = await getCmsItem(Number(id))
    if (!item) return cmsJson({ error: 'Publishing item not found', code: 'NOT_FOUND' }, 404, requestId)
    return cmsJson(item, 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}

export async function PUT(request: Request, context: Context) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    const user = await requireCmsPermission('publishing.create')
    const { id } = await context.params
    const item = await getCmsItem(Number(id))
    if (!item) return cmsJson({ error: 'Publishing item not found', code: 'NOT_FOUND' }, 404, requestId)
    const parsed = await parseCmsDraftRequest(request, {
      contentType: String(item.content_type),
      contentKey: String(item.content_key),
    })
    if (!parsed.success) {
      return cmsJson({
        error: 'Content validation failed',
        code: 'VALIDATION_ERROR',
        errors: parsed.errors,
      }, 400, requestId)
    }
    return cmsJson(await updateCmsDraft({
      id: Number(id),
      payload: parsed.data.payload,
      changeNote: parsed.data.changeNote,
      scheduledFor: parsed.data.scheduledFor,
      user,
      requestId,
    }), 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
