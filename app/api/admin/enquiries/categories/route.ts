import { z } from 'zod'
import { assertCmsOrigin, requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import {
  createEnquiryCategory,
  deleteEnquiryCategory,
  updateEnquiryCategory,
} from '@/lib/enquiry-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createSchema = z.object({
  label: z.string().trim().min(3, 'Enter a clear enquiry type name').max(80),
}).strict()

const updateSchema = z.object({
  key: z.string().trim().min(2).max(48).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  active: z.boolean().optional(),
  label: z.string().trim().min(3).max(80).optional(),
}).strict().refine((value) => value.active !== undefined || value.label !== undefined, {
  message: 'Change the name or visibility first',
})

const deleteSchema = z.object({
  key: z.string().trim().min(2).max(48).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  confirmation: z.string().trim().min(3).max(80),
}).strict()

export async function POST(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    const user = await requireCmsPermission('settings.manage')
    const parsed = createSchema.safeParse(await request.json())
    if (!parsed.success) {
      return cmsJson({
        error: parsed.error.issues[0]?.message || 'Enquiry type is invalid',
        code: 'VALIDATION_ERROR',
      }, 400, requestId)
    }
    return cmsJson(await createEnquiryCategory({
      label: parsed.data.label,
      user,
      requestId,
    }), 201, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}

export async function PATCH(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    const user = await requireCmsPermission('settings.manage')
    const parsed = updateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return cmsJson({
        error: parsed.error.issues[0]?.message || 'Enquiry type update is invalid',
        code: 'VALIDATION_ERROR',
      }, 400, requestId)
    }
    return cmsJson(await updateEnquiryCategory({
      key: parsed.data.key,
      active: parsed.data.active,
      label: parsed.data.label,
      user,
      requestId,
    }), 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}

export async function DELETE(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    const user = await requireCmsPermission('settings.manage')
    const parsed = deleteSchema.safeParse(await request.json())
    if (!parsed.success) {
      return cmsJson({
        error: parsed.error.issues[0]?.message || 'Deletion confirmation is invalid',
        code: 'VALIDATION_ERROR',
      }, 400, requestId)
    }
    return cmsJson(await deleteEnquiryCategory({
      key: parsed.data.key,
      confirmation: parsed.data.confirmation,
      user,
      requestId,
    }), 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
