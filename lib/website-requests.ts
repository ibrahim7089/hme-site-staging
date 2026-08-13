import 'server-only'

import { randomUUID } from 'node:crypto'
import type { CmsUser } from './cms-auth'
import { ensureCmsSchema } from './cms-db'
// Reused rather than a new error type so cmsError() already maps these to the
// right status code instead of turning them into a generic 500.
import { CmsWorkflowError } from './cms-service'

export type RequestStatus = 'NEW' | 'IN_PROGRESS' | 'DONE' | 'REJECTED'
export type RequestPriority = 'LOW' | 'NORMAL' | 'URGENT'

export type WebsiteRequest = {
  id: number
  reference: string
  title: string
  details: string
  page_area: string
  priority: RequestPriority
  status: RequestStatus
  images: string[]
  requested_by_name: string
  closed_by_name: string
  closed_at: string | null
  created_at: string
  updated_at: string
}

export type WebsiteRequestEvent = {
  id: number
  action: string
  actor_name: string
  from_status: string | null
  to_status: string | null
  note: string
  created_at: string
}

const STATUSES: RequestStatus[] = ['NEW', 'IN_PROGRESS', 'DONE', 'REJECTED']
const PRIORITIES: RequestPriority[] = ['LOW', 'NORMAL', 'URGENT']

// Images must be ones the CMS itself stored, so a request cannot be used to
// embed a link to somewhere else in the admin panel.
const ALLOWED_IMAGE = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i

function mapRequest(row: Record<string, unknown>): WebsiteRequest {
  let images: string[] = []
  try {
    const parsed = JSON.parse(String(row.images || '[]'))
    if (Array.isArray(parsed)) images = parsed.filter((entry) => typeof entry === 'string')
  } catch {
    images = []
  }
  return {
    id: Number(row.id),
    reference: String(row.reference),
    title: String(row.title),
    details: String(row.details || ''),
    page_area: String(row.page_area || ''),
    priority: String(row.priority) as RequestPriority,
    status: String(row.status) as RequestStatus,
    images,
    requested_by_name: String(row.requested_by_name || ''),
    closed_by_name: String(row.closed_by_name || ''),
    closed_at: row.closed_at ? String(row.closed_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

function makeReference() {
  const day = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  return `REQ-${day}-${randomUUID().slice(0, 6).toUpperCase()}`
}

export async function listWebsiteRequests(filter: { status?: string } = {}) {
  const db = await ensureCmsSchema()
  const useFilter = filter.status && STATUSES.includes(filter.status as RequestStatus)
  const result = await db.execute({
    sql: `SELECT * FROM website_requests
      ${useFilter ? 'WHERE status = ?' : ''}
      ORDER BY
        CASE status WHEN 'NEW' THEN 0 WHEN 'IN_PROGRESS' THEN 1 ELSE 2 END,
        CASE priority WHEN 'URGENT' THEN 0 WHEN 'NORMAL' THEN 1 ELSE 2 END,
        created_at DESC
      LIMIT 300`,
    args: useFilter ? [filter.status as string] : [],
  })
  return result.rows.map((row) => mapRequest(row as Record<string, unknown>))
}

export async function listWebsiteRequestEvents(requestId: number) {
  const db = await ensureCmsSchema()
  const result = await db.execute({
    sql: `SELECT id, action, actor_name, from_status, to_status, note, created_at
      FROM website_request_events WHERE request_id = ?
      ORDER BY created_at DESC, id DESC LIMIT 100`,
    args: [requestId],
  })
  return result.rows as unknown as WebsiteRequestEvent[]
}

export async function createWebsiteRequest(input: {
  title: string
  details: string
  pageArea: string
  priority: string
  images: string[]
  user: CmsUser
}) {
  const title = input.title.trim()
  if (title.length < 3) {
    throw new CmsWorkflowError(400, 'TITLE_REQUIRED', 'Give the request a short title so it can be recognised in the list')
  }
  if (title.length > 160) {
    throw new CmsWorkflowError(400, 'TITLE_TOO_LONG', 'Keep the title under 160 characters')
  }
  const details = input.details.trim()
  if (details.length > 8000) {
    throw new CmsWorkflowError(400, 'DETAILS_TOO_LONG', 'The description is too long')
  }
  const priority = PRIORITIES.includes(input.priority as RequestPriority)
    ? input.priority as RequestPriority
    : 'NORMAL'
  const images = input.images.filter((url) => ALLOWED_IMAGE.test(url)).slice(0, 8)

  const db = await ensureCmsSchema()
  const reference = makeReference()
  const result = await db.execute({
    sql: `INSERT INTO website_requests (
      reference, title, details, page_area, priority, images,
      requested_by_user_id, requested_by_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [
      reference, title, details, input.pageArea.trim().slice(0, 160),
      priority, JSON.stringify(images), input.user.id, input.user.name,
    ],
  })
  const created = mapRequest(result.rows[0] as Record<string, unknown>)
  await db.execute({
    sql: `INSERT INTO website_request_events (request_id, action, actor_user_id, actor_name, to_status, note, request_ref)
      VALUES (?, 'CREATED', ?, ?, 'NEW', ?, ?)`,
    args: [created.id, input.user.id, input.user.name, `Request raised${images.length ? ` with ${images.length} image(s)` : ''}`, reference],
  })
  return created
}

export async function updateWebsiteRequest(input: {
  id: number
  status?: string
  priority?: string
  note?: string
  user: CmsUser
}) {
  const db = await ensureCmsSchema()
  const existing = await db.execute({
    sql: 'SELECT * FROM website_requests WHERE id = ? LIMIT 1',
    args: [input.id],
  })
  const row = existing.rows[0] as Record<string, unknown> | undefined
  if (!row) throw new CmsWorkflowError(404, 'NOT_FOUND', 'That request no longer exists')
  const current = mapRequest(row)

  const nextStatus = input.status && STATUSES.includes(input.status as RequestStatus)
    ? input.status as RequestStatus
    : current.status
  const nextPriority = input.priority && PRIORITIES.includes(input.priority as RequestPriority)
    ? input.priority as RequestPriority
    : current.priority
  const note = (input.note || '').trim().slice(0, 2000)

  if (nextStatus === current.status && nextPriority === current.priority && !note) {
    throw new CmsWorkflowError(400, 'NOTHING_TO_UPDATE', 'Change the status or priority, or add a note')
  }

  const closing = nextStatus === 'DONE' || nextStatus === 'REJECTED'
  await db.execute({
    sql: `UPDATE website_requests SET
      status = ?, priority = ?, updated_at = datetime('now'),
      closed_by_user_id = ?, closed_by_name = ?, closed_at = ?
      WHERE id = ?`,
    args: [
      nextStatus, nextPriority,
      closing ? input.user.id : null,
      closing ? input.user.name : '',
      closing ? new Date().toISOString() : null,
      input.id,
    ],
  })

  if (nextStatus !== current.status) {
    await db.execute({
      sql: `INSERT INTO website_request_events (request_id, action, actor_user_id, actor_name, from_status, to_status, note, request_ref)
        VALUES (?, 'STATUS_CHANGED', ?, ?, ?, ?, ?, ?)`,
      args: [input.id, input.user.id, input.user.name, current.status, nextStatus, note, current.reference],
    })
  } else if (nextPriority !== current.priority) {
    await db.execute({
      sql: `INSERT INTO website_request_events (request_id, action, actor_user_id, actor_name, note, request_ref)
        VALUES (?, 'PRIORITY_CHANGED', ?, ?, ?, ?)`,
      args: [input.id, input.user.id, input.user.name, `Priority set to ${nextPriority.toLowerCase()}${note ? ` — ${note}` : ''}`, current.reference],
    })
  } else if (note) {
    await db.execute({
      sql: `INSERT INTO website_request_events (request_id, action, actor_user_id, actor_name, note, request_ref)
        VALUES (?, 'NOTE_ADDED', ?, ?, ?, ?)`,
      args: [input.id, input.user.id, input.user.name, note, current.reference],
    })
  }

  const updated = await db.execute({ sql: 'SELECT * FROM website_requests WHERE id = ? LIMIT 1', args: [input.id] })
  return mapRequest(updated.rows[0] as Record<string, unknown>)
}

export async function countOpenWebsiteRequests() {
  const db = await ensureCmsSchema()
  const result = await db.execute("SELECT COUNT(*) AS total FROM website_requests WHERE status IN ('NEW','IN_PROGRESS')")
  return Number((result.rows[0] as Record<string, unknown>)?.total || 0)
}
