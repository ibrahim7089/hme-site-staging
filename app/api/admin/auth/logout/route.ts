import { assertCmsOrigin, clearCmsSession } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    await clearCmsSession()
    return cmsJson({ ok: true }, 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
