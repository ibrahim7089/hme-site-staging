import { z } from 'zod'
import { assertCmsOrigin, authenticateCmsUser, createCmsSession, permissionsForRole } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'

export const runtime = 'nodejs'

const schema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
}).strict()

export async function POST(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return cmsJson({ error: 'Valid email and password are required', code: 'VALIDATION_ERROR' }, 400, requestId)
    }
    const user = await authenticateCmsUser(parsed.data.email, parsed.data.password)
    await createCmsSession(user)
    return cmsJson({ user, permissions: permissionsForRole(user.role) }, 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
