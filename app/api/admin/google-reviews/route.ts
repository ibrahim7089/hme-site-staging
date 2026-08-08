import { requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import { getConnectedAccountEmail, isGoogleAccountConnected, isGoogleOAuthConfigured } from '@/lib/google-business'
import { listGoogleReviews } from '@/lib/google-reviews-service'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    await requireCmsPermission('reviews.manage')
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || undefined
    const ratingParam = url.searchParams.get('rating')

    const [reviews, connected] = await Promise.all([
      listGoogleReviews({ replyStatus: status, rating: ratingParam ? Number(ratingParam) : undefined }),
      isGoogleAccountConnected(),
    ])
    const connectedEmail = connected ? await getConnectedAccountEmail() : ''

    return cmsJson({
      reviews,
      configured: isGoogleOAuthConfigured(),
      connected,
      connectedEmail,
    }, 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
