import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getCmsUser, permissionsForRole } from '@/lib/cms-auth'
import { buildGoogleAuthUrl, isGoogleOAuthConfigured } from '@/lib/google-business'
import { signOAuthState } from '@/lib/google-token-crypto'

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

  // Bind this admin's id into the signed state so the callback can tell who
  // started the flow — it cannot read the SameSite=Strict session cookie on
  // Google's cross-site redirect back to us.
  const state = signOAuthState(`${user.id}:${randomUUID()}`)
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
