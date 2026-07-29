import { z } from 'zod'
import { assertCmsOrigin, requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import { deleteEnquiryPermanently, listEnquiryEvents, updateEnquiry } from '@/lib/enquiry-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED']).optional(),
  assignedToUserId: z.number().int().positive().nullable().optional(),
  note: z.string().trim().max(1200).optional(),
}).strict().refine(
  (value) => value.status !== undefined || value.assignedToUserId !== undefined || Boolean(value.note),
  { message: 'Choose a status, assignee or add a note' },
)

const deleteSchema = z.object({
  reference: z.string().trim().min(1).max(80),
}).strict()

function idFrom(params: Promise<{ id: string }>) {
  return params.then(({ id }) => Number(id))
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = cmsRequestId(request)
  try {
    await requireCmsPermission('enquiries.view')
    const id = await idFrom(context.params)
    if (!Number.isInteger(id) || id <= 0) {
      return cmsJson({ error: 'Invalid enquiry', code: 'VALIDATION_ERROR' }, 400, requestId)
    }
    return cmsJson(await listEnquiryEvents(id), 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    const user = await requireCmsPermission('enquiries.manage')
    const id = await idFrom(context.params)
    if (!Number.isInteger(id) || id <= 0) {
      return cmsJson({ error: 'Invalid enquiry', code: 'VALIDATION_ERROR' }, 400, requestId)
    }
    const parsed = updateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return cmsJson({
        error: parsed.error.issues[0]?.message || 'Enquiry update is invalid',
        code: 'VALIDATION_ERROR',
      }, 400, requestId)
    }
    return cmsJson(await updateEnquiry({
      enquiryId: id,
      status: parsed.data.status,
      assignedToUserId: parsed.data.assignedToUserId,
      note: parsed.data.note,
      user,
      requestId,
    }), 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    const user = await requireCmsPermission('settings.manage')
    const id = await idFrom(context.params)
    if (!Number.isInteger(id) || id <= 0) {
      return cmsJson({ error: 'Invalid enquiry', code: 'VALIDATION_ERROR' }, 400, requestId)
    }
    const parsed = deleteSchema.safeParse(await request.json())
    if (!parsed.success) {
      return cmsJson({
        error: parsed.error.issues[0]?.message || 'Deletion confirmation is invalid',
        code: 'VALIDATION_ERROR',
      }, 400, requestId)
    }
    return cmsJson(await deleteEnquiryPermanently({
      enquiryId: id,
      reference: parsed.data.reference,
      user,
      requestId,
    }), 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
