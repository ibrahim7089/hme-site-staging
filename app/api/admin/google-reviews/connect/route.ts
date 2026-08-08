import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getCmsUser, permissionsForRole } from '@/lib/cms-auth'
import { buildGoogleAuthUrl, isGoogleOAuthConfigured } from '@/lib/google-business'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const user = await getCmsUser()
  if (!user || !permissionsForRole(user.role).includes('reviews.manage')) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const redirectBase = new URL('/admin', request.url)
  redirectBase.searchParams.set('section', 'reviews')
  if (!isGoogleOAuthConfigured()) {
    redirectBase.searchParams.set('error', 'not_configured')
    return NextResponse.redirect(redirectBase)
  }

  const state = randomUUID()
  const response = NextResponse.redirect(buildGoogleAuthUrl(state))
  response.cookies.set('hme_google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return response
}
