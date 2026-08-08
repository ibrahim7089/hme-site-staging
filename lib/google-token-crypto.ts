import 'server-only'

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

// Encrypts the Google OAuth refresh token at rest in the CMS database.
// Reuses CMS_AUTH_SECRET (already required to be 32+ chars in production)
// rather than introducing a second secret to configure.
function encryptionKey() {
  const secret = process.env.CMS_AUTH_SECRET
  const material = secret && secret.length >= 32
    ? secret
    : (process.env.NODE_ENV !== 'production' ? 'hme-local-development-secret-change-before-production' : null)
  if (!material) throw new Error('CMS_AUTH_SECRET is not configured; cannot encrypt Google tokens')
  return scryptSync(material, 'hme-google-oauth-token', 32)
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
