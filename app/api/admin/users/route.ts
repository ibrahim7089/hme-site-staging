import { z } from 'zod'
import {
  assertCmsOrigin,
  createCmsUser,
  listCmsUsers,
  requireCmsPermission,
} from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'

export const runtime = 'nodejs'

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(200),
  role: z.enum(['Admin', 'Website Editor', 'Website Checker']),
}).strict()

export async function GET(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    await requireCmsPermission('users.manage')
    return cmsJson(await listCmsUsers(), 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}

export async function POST(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    await requireCmsPermission('users.manage')
    const parsed = createSchema.safeParse(await request.json())
    if (!parsed.success) {
      return cmsJson({
        error: 'User details are invalid',
        code: 'VALIDATION_ERROR',
        errors: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      }, 400, requestId)
    }
    return cmsJson(await createCmsUser(parsed.data), 201, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
