import 'server-only'

import { randomUUID } from 'node:crypto'
import { compare, hash } from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ensureCmsSchema } from './cms-db'

export const CMS_SESSION_COOKIE = 'hme_cms_session'

export type CmsRole = 'Admin' | 'Website Editor' | 'Website Checker'
export type CmsPermission =
  | 'publishing.view'
  | 'publishing.create'
  | 'publishing.submit'
  | 'publishing.approve'
  | 'publishing.publish'
  | 'enquiries.view'
  | 'enquiries.manage'
  | 'settings.manage'
  | 'users.manage'
  | 'reviews.manage'

export type CmsUser = {
  id: number
  name: string
  email: string
  role: CmsRole
  status: 'ACTIVE' | 'DISABLED'
}

const rolePermissions: Record<CmsRole, CmsPermission[]> = {
  Admin: [
    'publishing.view',
    'publishing.create',
    'publishing.submit',
    'publishing.approve',
    'publishing.publish',
    'enquiries.view',
    'enquiries.manage',
    'settings.manage',
    'users.manage',
    'reviews.manage',
  ],
  'Website Editor': ['publishing.view', 'publishing.create', 'publishing.submit', 'enquiries.view', 'enquiries.manage'],
  'Website Checker': ['publishing.view', 'publishing.approve', 'publishing.publish', 'enquiries.view', 'enquiries.manage'],
}

export class CmsAuthError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'CmsAuthError'
    this.status = status
    this.code = code
  }
}

function authSecret() {
  const configured = process.env.CMS_AUTH_SECRET
  if (configured && configured.length >= 32) return new TextEncoder().encode(configured)
  if (process.env.NODE_ENV !== 'production') {
    return new TextEncoder().encode('hme-local-development-secret-change-before-production')
  }
  throw new CmsAuthError(503, 'AUTH_NOT_CONFIGURED', 'CMS authentication is not configured')
}

function rowToUser(row: Record<string, unknown>): CmsUser {
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role) as CmsRole,
    status: String(row.status) as CmsUser['status'],
  }
}

export function permissionsForRole(role: CmsRole) {
  return rolePermissions[role] || []
}

export async function authenticateCmsUser(emailInput: string, password: string) {
  const db = await ensureCmsSchema()
  const email = emailInput.trim().toLowerCase()
  const result = await db.execute({
    sql: 'SELECT * FROM cms_users WHERE email = ? LIMIT 1',
    args: [email],
  })
  const row = result.rows[0] as Record<string, unknown> | undefined
  if (!row || String(row.status) !== 'ACTIVE') {
    throw new CmsAuthError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
  }

  const lockedUntil = row.locked_until ? new Date(String(row.locked_until)) : null
  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    throw new CmsAuthError(429, 'ACCOUNT_LOCKED', 'Too many attempts. Try again later')
  }

  const matched = await compare(password, String(row.password_hash))
  if (!matched) {
    const previous = lockedUntil && lockedUntil.getTime() <= Date.now() ? 0 : Number(row.failed_attempts || 0)
    const attempts = previous + 1
    const nextLock = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null
    await db.execute({
      sql: 'UPDATE cms_users SET failed_attempts = ?, locked_until = ?, updated_at = datetime(\'now\') WHERE id = ?',
      args: [attempts, nextLock, Number(row.id)],
    })
    throw new CmsAuthError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
  }

  await db.execute({
    sql: `UPDATE cms_users
      SET failed_attempts = 0, locked_until = NULL, last_login_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?`,
    args: [Number(row.id)],
  })
  return rowToUser(row)
}

export async function createCmsSession(user: CmsUser) {
  const token = await new SignJWT({
    role: user.role,
    email: user.email,
    name: user.name,
    nonce: randomUUID(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(authSecret())

  const store = await cookies()
  store.set(CMS_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60,
  })
}

export async function clearCmsSession() {
  const store = await cookies()
  store.set(CMS_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
}

export async function getCmsUser(): Promise<CmsUser | null> {
  try {
    const store = await cookies()
    const token = store.get(CMS_SESSION_COOKIE)?.value
    if (!token) return null
    const verified = await jwtVerify(token, authSecret(), { algorithms: ['HS256'] })
    const id = Number(verified.payload.sub)
    if (!Number.isInteger(id) || id <= 0) return null

    const db = await ensureCmsSchema()
    const result = await db.execute({
      sql: 'SELECT id, name, email, role, status FROM cms_users WHERE id = ? LIMIT 1',
      args: [id],
    })
    const row = result.rows[0] as Record<string, unknown> | undefined
    if (!row || String(row.status) !== 'ACTIVE') return null
    return rowToUser(row)
  } catch {
    return null
  }
}

export async function requireCmsPermission(permission: CmsPermission) {
  const user = await getCmsUser()
  if (!user) throw new CmsAuthError(401, 'AUTH_REQUIRED', 'Sign in required')
  if (!permissionsForRole(user.role).includes(permission)) {
    throw new CmsAuthError(403, 'ACCESS_DENIED', 'Insufficient permission')
  }
  return user
}

export function assertCmsOrigin(request: Request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) return
  const origin = request.headers.get('origin')
  if (!origin) return
  const expected = new URL(request.url).origin
  if (origin !== expected) {
    throw new CmsAuthError(403, 'ORIGIN_REJECTED', 'Request origin rejected')
  }
}

export async function listCmsUsers() {
  const db = await ensureCmsSchema()
  const result = await db.execute(
    'SELECT id, name, email, role, status, last_login_at, created_at FROM cms_users ORDER BY name',
  )
  return result.rows
}

export async function createCmsUser(input: {
  name: string
  email: string
  password: string
  role: CmsRole
}) {
  const db = await ensureCmsSchema()
  const passwordHash = await hash(input.password, 12)
  const result = await db.execute({
    sql: `INSERT INTO cms_users (name, email, password_hash, role, status)
      VALUES (?, ?, ?, ?, 'ACTIVE')
      RETURNING id, name, email, role, status, created_at`,
    args: [input.name.trim(), input.email.trim().toLowerCase(), passwordHash, input.role],
  })
  return result.rows[0]
}
