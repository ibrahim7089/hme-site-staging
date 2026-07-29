import { redirect } from 'next/navigation'
import AdminDashboard from '../AdminDashboard'
import { getCmsUser, permissionsForRole } from '@/lib/cms-auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Enquiry Settings | Website Admin' }

export default async function EnquirySettingsPage() {
  const user = await getCmsUser()
  if (!user) redirect('/admin/login')
  const permissions = permissionsForRole(user.role)
  if (!permissions.includes('settings.manage')) redirect('/admin?section=enquiries')
  return <AdminDashboard
    user={user}
    permissions={permissions}
    initialSection="enquiry-settings"
  />
}
