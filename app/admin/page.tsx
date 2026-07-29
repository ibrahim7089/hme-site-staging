import { redirect } from 'next/navigation'
import AdminDashboard, { type AdminSection } from './AdminDashboard'
import { getCmsUser, permissionsForRole } from '@/lib/cms-auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Website Admin' }

type AdminPageProps = {
  searchParams: Promise<{ section?: string | string[] }>
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const user = await getCmsUser()
  if (!user) redirect('/admin/login')
  const permissions = permissionsForRole(user.role)
  const params = await searchParams
  const requested = Array.isArray(params.section) ? params.section[0] : params.section
  let initialSection: AdminSection = 'publishing'
  if (requested === 'enquiries' && permissions.includes('enquiries.view')) initialSection = 'enquiries'
  if (requested === 'users' && permissions.includes('users.manage')) initialSection = 'users'
  return <AdminDashboard user={user} permissions={permissions} initialSection={initialSection} />
}
