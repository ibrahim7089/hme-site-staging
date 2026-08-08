import { NextResponse } from 'next/server'
import { getCmsUser, permissionsForRole } from '@/lib/cms-auth'
import { exchangeGoogleAuthCode, fetchGoogleAccountEmail, saveGoogleTokens } from '@/lib/google-business'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)

  const user = await getCmsUser()
  if (!user || !permissionsForRole(user.role).includes('reviews.manage')) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const redirectBase = new URL('/admin', request.url)
  redirectBase.searchParams.set('section', 'reviews')

  const oauthError = url.searchParams.get('error')
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieHeader = request.headers.get('cookie') || ''
  const expectedState = cookieHeader.match(/hme_google_oauth_state=([^;]+)/)?.[1]

  if (oauthError) {
    redirectBase.searchParams.set('error', oauthError)
  } else if (!code || !state || !expectedState || state !== expectedState) {
    redirectBase.searchParams.set('error', 'invalid_state')
  } else {
    try {
      const tokens = await exchangeGoogleAuthCode(code)
      if (!tokens.refresh_token) {
        redirectBase.searchParams.set('error', 'no_refresh_token')
      } else {
        const email = await fetchGoogleAccountEmail(tokens.access_token)
        await saveGoogleTokens(tokens.refresh_token, email, user)
        redirectBase.searchParams.set('connected', '1')
      }
    } catch (caught) {
      redirectBase.searchParams.set('error', caught instanceof Error ? caught.message : 'connect_failed')
    }
  }

  // Build the response only after redirectBase's final query params are set —
  // NextResponse.redirect() reads the URL immediately, so mutating it afterward
  // would not affect the Location header already written to the response.
  const response = NextResponse.redirect(redirectBase)
  response.cookies.set('hme_google_oauth_state', '', { path: '/', maxAge: 0 })
  return response
}
