import { requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import { getReviewReports } from '@/lib/google-reviews-service'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    await requireCmsPermission('reviews.manage')
    return cmsJson(await getReviewReports(), 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
