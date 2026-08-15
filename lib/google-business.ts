import 'server-only'

import { ensureCmsSchema } from './cms-db'
import { decryptSecret, encryptSecret } from './google-token-crypto'
import type { CmsUser } from './cms-auth'

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const ACCOUNTS_API = 'https://mybusinessaccountmanagement.googleapis.com/v1'
const BUSINESS_INFO_API = 'https://mybusinessbusinessinformation.googleapis.com/v1'
const REVIEWS_API = 'https://mybusiness.googleapis.com/v4'
const SCOPE = 'https://www.googleapis.com/auth/business.manage email'
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v2/userinfo'

export class GoogleBusinessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GoogleBusinessError'
  }
}

export function isGoogleOAuthConfigured() {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET && process.env.GOOGLE_OAUTH_REDIRECT_URI)
}

function requireOAuthEnv() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) {
    throw new GoogleBusinessError('Google OAuth is not configured (missing GOOGLE_OAUTH_CLIENT_ID/SECRET/REDIRECT_URI)')
  }
  return { clientId, clientSecret, redirectUri }
}

export function buildGoogleAuthUrl(state: string) {
  const { clientId, redirectUri } = requireOAuthEnv()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  })
  return `${AUTH_ENDPOINT}?${params.toString()}`
}

async function tokenRequest(body: Record<string, string>) {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new GoogleBusinessError(data.error_description || data.error || 'Google token request failed')
  }
  return data as { access_token: string; refresh_token?: string; expires_in: number; id_token?: string }
}

export async function exchangeGoogleAuthCode(code: string) {
  const { clientId, clientSecret, redirectUri } = requireOAuthEnv()
  return tokenRequest({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })
}

export async function fetchGoogleAccountEmail(accessToken: string) {
  try {
    const response = await fetch(USERINFO_ENDPOINT, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!response.ok) return ''
    const data = await response.json()
    return typeof data.email === 'string' ? data.email : ''
  } catch {
    return ''
  }
}

async function refreshAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = requireOAuthEnv()
  return tokenRequest({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  })
}

declare global {
  var hmeGoogleAccessTokenCache: { token: string; expiresAt: number } | undefined
}

export async function getConnectedAccountEmail() {
  const db = await ensureCmsSchema()
  const result = await db.execute('SELECT connected_email FROM google_oauth_tokens WHERE id = 1 LIMIT 1')
  const row = result.rows[0] as Record<string, unknown> | undefined
  return row ? String(row.connected_email || '') : ''
}

export async function isGoogleAccountConnected() {
  const db = await ensureCmsSchema()
  const result = await db.execute('SELECT id FROM google_oauth_tokens WHERE id = 1 LIMIT 1')
  return result.rows.length > 0
}

export async function saveGoogleTokens(refreshToken: string, connectedEmail: string, user: CmsUser) {
  const db = await ensureCmsSchema()
  const encrypted = encryptSecret(refreshToken)
  await db.execute({
    sql: `INSERT INTO google_oauth_tokens (id, connected_email, encrypted_refresh_token, connected_by_user_id, connected_by_name)
      VALUES (1, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        connected_email = excluded.connected_email,
        encrypted_refresh_token = excluded.encrypted_refresh_token,
        connected_by_user_id = excluded.connected_by_user_id,
        connected_by_name = excluded.connected_by_name,
        updated_at = datetime('now')`,
    args: [connectedEmail, encrypted, user.id, user.name],
  })
  globalThis.hmeGoogleAccessTokenCache = undefined
}

export async function disconnectGoogleAccount() {
  const db = await ensureCmsSchema()
  await db.execute('DELETE FROM google_oauth_tokens WHERE id = 1')
  globalThis.hmeGoogleAccessTokenCache = undefined
}

async function getStoredRefreshToken() {
  const db = await ensureCmsSchema()
  const result = await db.execute('SELECT encrypted_refresh_token FROM google_oauth_tokens WHERE id = 1 LIMIT 1')
  const row = result.rows[0] as Record<string, unknown> | undefined
  if (!row) return null
  return decryptSecret(String(row.encrypted_refresh_token))
}

async function getAccessToken() {
  const cached = globalThis.hmeGoogleAccessTokenCache
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token
  const refreshToken = await getStoredRefreshToken()
  if (!refreshToken) throw new GoogleBusinessError('Google Business Profile is not connected')
  const result = await refreshAccessToken(refreshToken)
  globalThis.hmeGoogleAccessTokenCache = {
    token: result.access_token,
    expiresAt: Date.now() + result.expires_in * 1000,
  }
  return result.access_token
}

async function apiGet<T>(url: string): Promise<T> {
  const token = await getAccessToken()
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new GoogleBusinessError(data?.error?.message || `Google API request failed (${response.status})`)
  }
  return data as T
}

export type GoogleAccount = { name: string; accountName?: string }
export type GoogleLocation = { name: string; title?: string }
export type GoogleReview = {
  reviewId: string
  reviewer?: { displayName?: string; profilePhotoUrl?: string }
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE'
  comment?: string
  createTime: string
  updateTime: string
  reviewReply?: { comment: string; updateTime: string }
}

const starRatingToNumber: Record<GoogleReview['starRating'], number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
}
export { starRatingToNumber }

export async function listAllAccounts() {
  const data = await apiGet<{ accounts?: GoogleAccount[] }>(`${ACCOUNTS_API}/accounts`)
  return data.accounts || []
}

export async function listAllLocations(accountName: string) {
  const locations: GoogleLocation[] = []
  let pageToken: string | undefined
  do {
    const params = new URLSearchParams({ readMask: 'name,title' })
    if (pageToken) params.set('pageToken', pageToken)
    const data = await apiGet<{ locations?: GoogleLocation[]; nextPageToken?: string }>(
      `${BUSINESS_INFO_API}/${accountName}/locations?${params.toString()}`,
    )
    locations.push(...(data.locations || []))
    pageToken = data.nextPageToken
  } while (pageToken)
  return locations
}

// The legacy v4 Reviews API addresses locations as accounts/{accountId}/locations/{locationId},
// distinct from the v1 Business Information API's bare locations/{locationId} resource name.
export function toV4LocationPath(accountName: string, locationName: string) {
  const locationId = locationName.split('/').pop()
  return `${accountName}/locations/${locationId}`
}

export async function listAllReviews(v4LocationPath: string) {
  const reviews: GoogleReview[] = []
  let pageToken: string | undefined
  do {
    const params = pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : ''
    const data = await apiGet<{ reviews?: GoogleReview[]; nextPageToken?: string }>(
      `${REVIEWS_API}/${v4LocationPath}/reviews${params}`,
    )
    reviews.push(...(data.reviews || []))
    pageToken = data.nextPageToken
  } while (pageToken)
  return reviews
}

// There is deliberately no reply-posting function here. Replies to Google
// reviews are written by the owner's own reply bot; this site is read-only
// against the review API so the two can never contradict each other.
