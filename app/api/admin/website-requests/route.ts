import { assertCmsOrigin, requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import { createWebsiteRequest, listWebsiteRequests } from '@/lib/website-requests'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    await requireCmsPermission('requests.view')
    const status = new URL(request.url).searchParams.get('status') || undefined
    return cmsJson({ requests: await listWebsiteRequests({ status }) }, 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}

export async function POST(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    // Anyone who can see the log can raise a request; closing it needs an Admin.
    const user = await requireCmsPermission('requests.view')
    const body = await request.json().catch(() => ({})) as {
      title?: string
      details?: string
      pageArea?: string
      priority?: string
      images?: unknown
    }
    const created = await createWebsiteRequest({
      title: String(body.title || ''),
      details: String(body.details || ''),
      pageArea: String(body.pageArea || ''),
      priority: String(body.priority || 'NORMAL'),
      images: Array.isArray(body.images) ? body.images.filter((entry): entry is string => typeof entry === 'string') : [],
      user,
    })
    return cmsJson(created, 201, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
