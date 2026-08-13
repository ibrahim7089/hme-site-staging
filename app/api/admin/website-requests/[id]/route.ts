import { assertCmsOrigin, requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import { listWebsiteRequestEvents, updateWebsiteRequest } from '@/lib/website-requests'

export const runtime = 'nodejs'

type Context = { params: Promise<{ id: string }> }

function parseId(raw: string) {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function GET(request: Request, context: Context) {
  const requestId = cmsRequestId(request)
  try {
    await requireCmsPermission('requests.view')
    const id = parseId((await context.params).id)
    if (!id) return cmsJson({ error: 'Invalid request id', code: 'INVALID_ID' }, 400, requestId)
    return cmsJson({ events: await listWebsiteRequestEvents(id) }, 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}

export async function PATCH(request: Request, context: Context) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    // Raising a request is open to every signed-in user, but changing its
    // status or priority is an Admin decision.
    const user = await requireCmsPermission('requests.manage')
    const id = parseId((await context.params).id)
    if (!id) return cmsJson({ error: 'Invalid request id', code: 'INVALID_ID' }, 400, requestId)

    const body = await request.json().catch(() => ({})) as { status?: string; priority?: string; note?: string }
    const updated = await updateWebsiteRequest({
      id,
      status: body.status,
      priority: body.priority,
      note: body.note,
      user,
    })
    return cmsJson(updated, 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
