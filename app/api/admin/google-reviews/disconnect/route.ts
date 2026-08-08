import { assertCmsOrigin, requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import { disconnectGoogleAccount } from '@/lib/google-business'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    await requireCmsPermission('reviews.manage')
    await disconnectGoogleAccount()
    return cmsJson({ ok: true }, 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
