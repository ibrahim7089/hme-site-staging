import { assertCmsOrigin, requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import { parseCmsDraftRequest } from '@/lib/cms-route-validation'
import { createCmsDraft, listCmsItems } from '@/lib/cms-service'
import { normalizeContentType } from '@/lib/cms-validation'

export const runtime = 'nodejs'

const statuses = new Set(['DRAFT', 'PENDING', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED'])

export async function GET(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    await requireCmsPermission('publishing.view')
    const url = new URL(request.url)
    const rawType = url.searchParams.get('content_type')
    const contentType = rawType ? normalizeContentType(rawType) : null
    const rawStatus = url.searchParams.get('status')?.toUpperCase() || null
    const rawContentKey = url.searchParams.get('content_key')?.trim().toLowerCase() || null
    if ((rawType && !contentType) || (rawStatus && !statuses.has(rawStatus))) {
      return cmsJson({ error: 'Invalid publishing filter', code: 'VALIDATION_ERROR' }, 400, requestId)
    }
    const items = await listCmsItems({
      contentType,
      contentKey: rawContentKey,
      status: rawStatus,
      limit: Number(url.searchParams.get('limit') || 200),
    })
    return cmsJson(items, 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}

export async function POST(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    const user = await requireCmsPermission('publishing.create')
    const parsed = await parseCmsDraftRequest(request)
    if (!parsed.success) {
      return cmsJson({
        error: 'Content validation failed',
        code: 'VALIDATION_ERROR',
        errors: parsed.errors,
      }, 400, requestId)
    }
    const item = await createCmsDraft({
      ...parsed.data,
      user,
      requestId,
    })
    return cmsJson(item, 201, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
