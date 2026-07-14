import { requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import { getCmsEvents } from '@/lib/cms-service'

export const runtime = 'nodejs'

type Context = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: Context) {
  const requestId = cmsRequestId(request)
  try {
    await requireCmsPermission('publishing.view')
    const { id } = await context.params
    return cmsJson(await getCmsEvents(Number(id)), 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
