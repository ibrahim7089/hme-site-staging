import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getCmsUserById, permissionsForRole } from '@/lib/cms-auth'
import { exchangeGoogleAuthCode, fetchGoogleAccountEmail, saveGoogleTokens } from '@/lib/google-business'
import { verifyOAuthState } from '@/lib/google-token-crypto'

export const runtime = 'nodejs'

function sameValue(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] as string
  ))
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const redirectBase = new URL('/admin', request.url)
  redirectBase.searchParams.set('section', 'reviews')

  const oauthError = url.searchParams.get('error')
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieHeader = request.headers.get('cookie') || ''
  const cookieState = cookieHeader.match(/hme_google_oauth_state=([^;]+)/)?.[1]

  // Google returns the browser here cross-site, so the SameSite=Strict CMS
  // session cookie is not sent and the signed-in user cannot be read. The
  // SameSite=Lax state cookie is sent, and /connect only issues it after
  // verifying an authenticated admin — so matching the cookie against the
  // state Google echoed back both blocks CSRF and identifies that admin.
  if (oauthError) {
    redirectBase.searchParams.set('error', oauthError)
  } else if (!code || !state || !cookieState || !sameValue(state, decodeURIComponent(cookieState))) {
    redirectBase.searchParams.set('error', 'invalid_state')
  } else {
    const payload = verifyOAuthState(state)
    const userId = payload ? Number(payload.split(':')[0]) : NaN
    const user = payload ? await getCmsUserById(userId) : null

    if (!user || !permissionsForRole(user.role).includes('reviews.manage')) {
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
  }

  // A server redirect here would still belong to the Google-initiated
  // navigation chain, so the SameSite=Strict session cookie would be withheld
  // again and /admin would render as signed-out. Bouncing via a script-driven
  // navigation makes the next request same-site initiated, so the session is
  // sent and the admin lands back logged in.
  const target = `${redirectBase.pathname}${redirectBase.search}`
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Finishing Google connection…</title></head>
<body style="font:15px system-ui;padding:32px;color:#0f1722">
<p>Finishing Google connection…</p>
<script>window.location.replace(${JSON.stringify(target)})</script>
<noscript><a href="${escapeHtml(target)}">Continue to the admin panel</a></noscript>
</body>
</html>`

  const response = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
  response.cookies.set('hme_google_oauth_state', '', { path: '/', maxAge: 0 })
  return response
}
