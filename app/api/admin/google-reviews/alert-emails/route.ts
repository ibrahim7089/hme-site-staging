import { assertCmsOrigin, requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import { getReviewAlertEmails, setReviewAlertEmails } from '@/lib/review-alerts'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    await requireCmsPermission('reviews.manage')
    return cmsJson({ emails: await getReviewAlertEmails() }, 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}

export async function PUT(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    const user = await requireCmsPermission('reviews.manage')
    const body = await request.json().catch(() => ({})) as { emails?: string }
    const raw = String(body.emails || '')
    if (raw.length > 2000) {
      return cmsJson({ error: 'That is too many addresses', code: 'TOO_LONG' }, 400, requestId)
    }
    const emails = await setReviewAlertEmails(raw, user, requestId)
    return cmsJson({ emails }, 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
