import { assertCmsOrigin, requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import { syncGoogleReviews } from '@/lib/google-reviews-service'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    await requireCmsPermission('reviews.manage')
    const summary = await syncGoogleReviews()
    return cmsJson(summary, 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
