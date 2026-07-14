import { redirect } from 'next/navigation'
import { getCmsUser } from '@/lib/cms-auth'
import AdminLogin from './AdminLogin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin Sign In' }

export default async function AdminLoginPage() {
  if (await getCmsUser()) redirect('/admin')
  return <AdminLogin />
}
