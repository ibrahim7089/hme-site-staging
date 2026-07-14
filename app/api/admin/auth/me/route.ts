import { getCmsUser, permissionsForRole } from '@/lib/cms-auth'
import { cmsJson } from '@/lib/cms-http'

export const runtime = 'nodejs'

export async function GET() {
  const user = await getCmsUser()
  if (!user) return cmsJson({ error: 'Sign in required', code: 'AUTH_REQUIRED' }, 401)
  return cmsJson({ user, permissions: permissionsForRole(user.role) })
}
