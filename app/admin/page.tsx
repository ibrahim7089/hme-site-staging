import { redirect } from 'next/navigation'
import AdminDashboard from './AdminDashboard'
import { getCmsUser, permissionsForRole } from '@/lib/cms-auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Website Admin' }

export default async function AdminPage() {
  const user = await getCmsUser()
  if (!user) redirect('/admin/login')
  return <AdminDashboard user={user} permissions={permissionsForRole(user.role)} />
}
