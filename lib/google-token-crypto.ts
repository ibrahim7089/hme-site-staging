import 'server-only'

import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

// Encrypts the Google OAuth refresh token at rest in the CMS database.
// Reuses CMS_AUTH_SECRET (already required to be 32+ chars in production)
// rather than introducing a second secret to configure.
function secretMaterial() {
  const secret = process.env.CMS_AUTH_SECRET
  const material = secret && secret.length >= 32
    ? secret
    : (process.env.NODE_ENV !== 'production' ? 'hme-local-development-secret-change-before-production' : null)
  if (!material) throw new Error('CMS_AUTH_SECRET is not configured; cannot secure Google credentials')
  return material
}

function encryptionKey() {
  return scryptSync(secretMaterial(), 'hme-google-oauth-token', 32)
}

function stateKey() {
  return scryptSync(secretMaterial(), 'hme-google-oauth-state', 32)
}

export function encryptSecret(plaintext: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`
}

export function decryptSecret(payload: string) {
  const [ivPart, tagPart, dataPart] = payload.split('.')
  if (!ivPart || !tagPart || !dataPart) throw new Error('Malformed encrypted token payload')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivPart, 'base64'))
  decipher.setAuthTag(Buffer.from(tagPart, 'base64'))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataPart, 'base64')), decipher.final()])
  return decrypted.toString('utf8')
}

// The OAuth `state` value doubles as the callback's proof of identity. Google
// returns the browser to us cross-site, where the SameSite=Strict CMS session
// cookie is withheld, so the callback cannot read the signed-in user. Binding
// the initiating user id into a signed state — issued only after /connect has
// verified the session and permission — lets the callback re-establish who
// started the flow without weakening the session cookie.
export function signOAuthState(payload: string) {
  const encoded = Buffer.from(payload, 'utf8').toString('base64url')
  const mac = createHmac('sha256', stateKey()).update(encoded).digest('base64url')
  return `${encoded}.${mac}`
}

export function verifyOAuthState(token: string): string | null {
  const [encoded, mac] = token.split('.')
  if (!encoded || !mac) return null
  const expected = createHmac('sha256', stateKey()).update(encoded).digest('base64url')
  const provided = Buffer.from(mac)
  const computed = Buffer.from(expected)
  if (provided.length !== computed.length || !timingSafeEqual(provided, computed)) return null
  return Buffer.from(encoded, 'base64url').toString('utf8')
}
