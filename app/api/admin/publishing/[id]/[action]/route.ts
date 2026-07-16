import { assertCmsOrigin, requireCmsPermission } from '@/lib/cms-auth'
import { invalidateCmsContent } from '@/lib/cms-cache'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import {
  createCmsRollbackDraft,
  discardCmsDraft,
  publishCmsItem,
  reviewCmsItem,
  submitCmsItem,
} from '@/lib/cms-service'
import type { CmsContentType } from '@/lib/cms-validation'

export const runtime = 'nodejs'

type Context = { params: Promise<{ id: string; action: string }> }

export async function POST(request: Request, context: Context) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    const { id: rawId, action } = await context.params
    const id = Number(rawId)

    if (action === 'submit') {
      const user = await requireCmsPermission('publishing.submit')
      return cmsJson(await submitCmsItem(id, user, requestId), 200, requestId)
    }

    if (action === 'discard') {
      const user = await requireCmsPermission('publishing.create')
      return cmsJson(await discardCmsDraft(id, user, requestId), 200, requestId)
    }

    if (action === 'approve' || action === 'reject') {
      const user = await requireCmsPermission('publishing.approve')
      const body = action === 'reject' ? await request.json().catch(() => ({})) as { reason?: string } : {}
      return cmsJson(await reviewCmsItem({
        id,
        decision: action,
        reason: body.reason,
        user,
        requestId,
      }), 200, requestId)
    }

    if (action === 'publish') {
      const user = await requireCmsPermission('publishing.publish')
      const result = await publishCmsItem(id, user, requestId)
      if (!result.scheduled && result.item) {
        invalidateCmsContent(String((result.item as unknown as Record<string, unknown>).content_type) as CmsContentType)
      }
      return cmsJson(result, result.scheduled ? 202 : 200, requestId)
    }

    if (action === 'direct-publish') {
      const user = await requireCmsPermission('publishing.publish')
      const result = await publishCmsItem(id, user, requestId, true, true)
      if (result.item) {
        invalidateCmsContent(String((result.item as unknown as Record<string, unknown>).content_type) as CmsContentType)
      }
      return cmsJson(result, 200, requestId)
    }

    if (action === 'rollback') {
      const user = await requireCmsPermission('publishing.create')
      return cmsJson(await createCmsRollbackDraft(id, user, requestId), 201, requestId)
    }

    return cmsJson({ error: 'Unknown publishing action', code: 'NOT_FOUND' }, 404, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
