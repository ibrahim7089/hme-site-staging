import { z } from 'zod'
import { assertCmsOrigin, requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import {
  getEnquiryNotificationSettings,
  updateEnquiryNotificationSettings,
} from '@/lib/enquiry-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const optionalEmail = z.union([
  z.literal(''),
  z.string().trim().email('Enter a valid email address').max(254),
])

const settingsSchema = z.object({
  notificationEmail: z.string().trim().email('Enter a valid email address').max(254),
  routing: z.object({
    general: optionalEmail,
    rates: optionalEmail,
    transfer: optionalEmail,
    booking: optionalEmail,
    business: optionalEmail,
    agent: optionalEmail,
    career: optionalEmail,
    complaint: optionalEmail,
    privacy: optionalEmail,
  }).strict(),
}).strict()

export async function GET(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    await requireCmsPermission('settings.manage')
    return cmsJson(await getEnquiryNotificationSettings(), 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}

export async function PATCH(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    const user = await requireCmsPermission('settings.manage')
    const parsed = settingsSchema.safeParse(await request.json())
    if (!parsed.success) {
      return cmsJson({
        error: parsed.error.issues[0]?.message || 'Notification settings are invalid',
        code: 'VALIDATION_ERROR',
      }, 400, requestId)
    }
    return cmsJson(await updateEnquiryNotificationSettings({
      notificationEmail: parsed.data.notificationEmail,
      routing: parsed.data.routing,
      user,
      requestId,
    }), 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
