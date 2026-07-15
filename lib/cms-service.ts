import 'server-only'

import { createHash } from 'node:crypto'
import type { Client, Transaction } from '@libsql/client'
import { ensureCmsSchema } from './cms-db'
import type { CmsUser } from './cms-auth'
import type { CmsContentType } from './cms-validation'

type Executor = Pick<Client, 'execute'> | Pick<Transaction, 'execute'>

export class CmsWorkflowError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'CmsWorkflowError'
    this.status = status
    this.code = code
  }
}

function parseJson(value: unknown, fallback: unknown = null) {
  try {
    return JSON.parse(String(value))
  } catch {
    return fallback
  }
}

function checksum(payload: unknown) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

type CmsMappedItem = Record<string, unknown> & {
  id: number
  version: number
  created_by_user_id: number
  submitted_by_user_id: number | null
  reviewed_by_user_id: number | null
  published_by_user_id: number | null
  supersedes_item_id: number | null
  payload: unknown
}

function mapItem(row: Record<string, unknown> | undefined): CmsMappedItem | null {
  if (!row) return null
  return {
    ...row,
    id: Number(row.id),
    version: Number(row.version),
    created_by_user_id: Number(row.created_by_user_id),
    submitted_by_user_id: row.submitted_by_user_id ? Number(row.submitted_by_user_id) : null,
    reviewed_by_user_id: row.reviewed_by_user_id ? Number(row.reviewed_by_user_id) : null,
    published_by_user_id: row.published_by_user_id ? Number(row.published_by_user_id) : null,
    supersedes_item_id: row.supersedes_item_id ? Number(row.supersedes_item_id) : null,
    payload: parseJson(row.payload, {}),
  }
}

async function insertEvent(
  executor: Executor,
  input: {
    itemId: number
    action: string
    actor?: CmsUser | null
    fromStatus?: string | null
    toStatus?: string | null
    oldPayload?: unknown
    newPayload?: unknown
    note?: string
    requestId?: string
  },
) {
  await executor.execute({
    sql: `INSERT INTO cms_events (
      item_id, action, actor_user_id, actor_name, from_status, to_status,
      old_payload, new_payload, note, request_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      input.itemId,
      input.action,
      input.actor?.id || null,
      input.actor?.name || (input.actor === null ? 'Scheduled publisher' : ''),
      input.fromStatus || null,
      input.toStatus || null,
      input.oldPayload === undefined ? null : JSON.stringify(input.oldPayload),
      input.newPayload === undefined ? null : JSON.stringify(input.newPayload),
      input.note || '',
      input.requestId || '',
    ],
  })
}

async function itemWith(executor: Executor, id: number) {
  const result = await executor.execute({
    sql: 'SELECT * FROM cms_items WHERE id = ? LIMIT 1',
    args: [id],
  })
  return mapItem(result.rows[0] as unknown as Record<string, unknown> | undefined)
}

export async function listCmsItems(filters: {
  contentType?: CmsContentType | null
  status?: string | null
  limit?: number
} = {}) {
  const db = await ensureCmsSchema()
  const clauses: string[] = []
  const args: Array<string | number> = []
  if (filters.contentType) {
    clauses.push('content_type = ?')
    args.push(filters.contentType)
  }
  if (filters.status) {
    clauses.push('status = ?')
    args.push(filters.status)
  }
  const limit = Math.min(Math.max(Number(filters.limit) || 200, 1), 500)
  args.push(limit)
  const result = await db.execute({
    sql: `SELECT * FROM cms_items
      ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
      ORDER BY updated_at DESC, id DESC LIMIT ?`,
    args,
  })
  return result.rows.map((row) => mapItem(row as unknown as Record<string, unknown>))
}

export async function getCmsItem(id: number) {
  const db = await ensureCmsSchema()
  return itemWith(db, id)
}

export async function getCmsEvents(itemId: number) {
  const db = await ensureCmsSchema()
  const result = await db.execute({
    sql: 'SELECT * FROM cms_events WHERE item_id = ? ORDER BY id DESC LIMIT 500',
    args: [itemId],
  })
  return result.rows.map((row) => ({
    ...row,
    id: Number(row.id),
    item_id: Number(row.item_id),
    actor_user_id: row.actor_user_id ? Number(row.actor_user_id) : null,
    old_payload: parseJson(row.old_payload),
    new_payload: parseJson(row.new_payload),
  }))
}

export async function createCmsDraft(input: {
  contentType: CmsContentType
  contentKey: string
  payload: unknown
  changeNote?: string
  scheduledFor?: string | null
  user: CmsUser
  requestId?: string
  supersedesItemId?: number | null
}) {
  const db = await ensureCmsSchema()
  const tx = await db.transaction('write')
  try {
    const versionResult = await tx.execute({
      sql: `SELECT COALESCE(MAX(version), 0) + 1 AS version
        FROM cms_items WHERE content_type = ? AND content_key = ?`,
      args: [input.contentType, input.contentKey],
    })
    const version = Number(versionResult.rows[0]?.version || 1)
    const payloadJson = JSON.stringify(input.payload)
    const created = await tx.execute({
      sql: `INSERT INTO cms_items (
        content_type, content_key, version, status, payload, checksum,
        change_note, created_by_user_id, created_by_name, scheduled_for, supersedes_item_id
      ) VALUES (?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [
        input.contentType,
        input.contentKey,
        version,
        payloadJson,
        checksum(input.payload),
        input.changeNote || '',
        input.user.id,
        input.user.name,
        input.scheduledFor || null,
        input.supersedesItemId || null,
      ],
    })
    const id = Number(created.rows[0]?.id)
    await insertEvent(tx, {
      itemId: id,
      action: input.supersedesItemId ? 'ROLLBACK_DRAFT_CREATED' : 'DRAFT_CREATED',
      actor: input.user,
      toStatus: 'DRAFT',
      newPayload: input.payload,
      note: input.changeNote,
      requestId: input.requestId,
    })
    const item = await itemWith(tx, id)
    await tx.commit()
    return item
  } catch (error) {
    if (!tx.closed) await tx.rollback()
    throw error
  } finally {
    tx.close()
  }
}

export async function updateCmsDraft(input: {
  id: number
  payload: unknown
  changeNote?: string
  scheduledFor?: string | null
  user: CmsUser
  requestId?: string
}) {
  const db = await ensureCmsSchema()
  const tx = await db.transaction('write')
  try {
    const current = await itemWith(tx, input.id)
    if (!current) throw new CmsWorkflowError(404, 'NOT_FOUND', 'Publishing item not found')
    if (!['DRAFT', 'REJECTED'].includes(String(current.status))) {
      throw new CmsWorkflowError(409, 'INVALID_STATE', 'Only draft or rejected content can be edited')
    }
    if (Number(current.created_by_user_id) !== input.user.id) {
      throw new CmsWorkflowError(403, 'NOT_OWNER', 'Only the draft creator can edit this item')
    }

    await tx.execute({
      sql: `UPDATE cms_items SET status = 'DRAFT', payload = ?, checksum = ?, change_note = ?,
        scheduled_for = ?, rejection_reason = '', updated_at = datetime('now') WHERE id = ?`,
      args: [
        JSON.stringify(input.payload),
        checksum(input.payload),
        input.changeNote || '',
        input.scheduledFor || null,
        input.id,
      ],
    })
    await insertEvent(tx, {
      itemId: input.id,
      action: 'DRAFT_UPDATED',
      actor: input.user,
      fromStatus: String(current.status),
      toStatus: 'DRAFT',
      oldPayload: current.payload,
      newPayload: input.payload,
      note: input.changeNote,
      requestId: input.requestId,
    })
    const item = await itemWith(tx, input.id)
    await tx.commit()
    return item
  } catch (error) {
    if (!tx.closed) await tx.rollback()
    throw error
  } finally {
    tx.close()
  }
}

export async function submitCmsItem(id: number, user: CmsUser, requestId = '') {
  const db = await ensureCmsSchema()
  const tx = await db.transaction('write')
  try {
    const current = await itemWith(tx, id)
    if (!current) throw new CmsWorkflowError(404, 'NOT_FOUND', 'Publishing item not found')
    if (current.status !== 'DRAFT') throw new CmsWorkflowError(409, 'INVALID_STATE', 'Only drafts can be submitted')
    if (Number(current.created_by_user_id) !== user.id) {
      throw new CmsWorkflowError(403, 'NOT_OWNER', 'Only the draft creator can submit this item')
    }
    await tx.execute({
      sql: `UPDATE cms_items SET status = 'PENDING', submitted_by_user_id = ?,
        submitted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      args: [user.id, id],
    })
    await insertEvent(tx, {
      itemId: id,
      action: 'SUBMITTED',
      actor: user,
      fromStatus: 'DRAFT',
      toStatus: 'PENDING',
      newPayload: current.payload,
      note: String(current.change_note || ''),
      requestId,
    })
    const item = await itemWith(tx, id)
    await tx.commit()
    return item
  } catch (error) {
    if (!tx.closed) await tx.rollback()
    throw error
  } finally {
    tx.close()
  }
}

export async function reviewCmsItem(input: {
  id: number
  decision: 'approve' | 'reject'
  reason?: string
  user: CmsUser
  requestId?: string
}) {
  const db = await ensureCmsSchema()
  const tx = await db.transaction('write')
  try {
    const current = await itemWith(tx, input.id)
    if (!current) throw new CmsWorkflowError(404, 'NOT_FOUND', 'Publishing item not found')
    if (current.status !== 'PENDING') throw new CmsWorkflowError(409, 'INVALID_STATE', 'Item is not pending')
    if (Number(current.created_by_user_id) === input.user.id) {
      throw new CmsWorkflowError(409, 'MAKER_CHECKER_CONFLICT', 'The maker cannot review their own change')
    }
    if (input.decision === 'reject' && !input.reason?.trim()) {
      throw new CmsWorkflowError(400, 'REASON_REQUIRED', 'A rejection reason is required')
    }
    const status = input.decision === 'approve' ? 'APPROVED' : 'REJECTED'
    await tx.execute({
      sql: `UPDATE cms_items SET status = ?, reviewed_by_user_id = ?, reviewed_by_name = ?,
        reviewed_at = datetime('now'), rejection_reason = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [
        status,
        input.user.id,
        input.user.name,
        input.decision === 'reject' ? input.reason?.trim() || '' : '',
        input.id,
      ],
    })
    await insertEvent(tx, {
      itemId: input.id,
      action: status,
      actor: input.user,
      fromStatus: 'PENDING',
      toStatus: status,
      oldPayload: current.payload,
      newPayload: current.payload,
      note: input.reason,
      requestId: input.requestId,
    })
    const item = await itemWith(tx, input.id)
    await tx.commit()
    return item
  } catch (error) {
    if (!tx.closed) await tx.rollback()
    throw error
  } finally {
    tx.close()
  }
}

export async function publishCmsItem(
  id: number,
  user: CmsUser | null,
  requestId = '',
  allowFuture = false,
  direct = false,
) {
  const db = await ensureCmsSchema()
  const tx = await db.transaction('write')
  try {
    const current = await itemWith(tx, id)
    if (!current) throw new CmsWorkflowError(404, 'NOT_FOUND', 'Publishing item not found')
    if (direct) {
      if (!user || user.role !== 'Admin') {
        throw new CmsWorkflowError(403, 'ADMIN_DIRECT_PUBLISH_ONLY', 'Only an administrator can publish without approval')
      }
      if (!['DRAFT', 'REJECTED'].includes(String(current.status))) {
        throw new CmsWorkflowError(409, 'INVALID_STATE', 'Only a draft or rejected item can be published directly')
      }
      if (Number(current.created_by_user_id) !== user.id) {
        throw new CmsWorkflowError(403, 'NOT_OWNER', 'Administrators can only directly publish their own draft')
      }
    } else if (current.status !== 'APPROVED' || !current.reviewed_by_user_id) {
      throw new CmsWorkflowError(409, 'INVALID_STATE', 'Item must be approved before publishing')
    }
    if (!direct && !allowFuture && current.scheduled_for && new Date(String(current.scheduled_for)).getTime() > Date.now()) {
      await tx.rollback()
      return { scheduled: true, item: current }
    }

    const previousResult = await tx.execute({
      sql: 'SELECT * FROM cms_published WHERE content_type = ? AND content_key = ? LIMIT 1',
      args: [String(current.content_type), String(current.content_key)],
    })
    const previous = previousResult.rows[0] as unknown as Record<string, unknown> | undefined
    const publishedAt = new Date().toISOString()

    if (previous?.item_id && Number(previous.item_id) !== id) {
      await tx.execute({
        sql: `UPDATE cms_items SET status = 'ARCHIVED', updated_at = datetime('now')
          WHERE id = ? AND status = 'PUBLISHED'`,
        args: [Number(previous.item_id)],
      })
    }

    await tx.execute({
      sql: `UPDATE cms_items SET status = 'PUBLISHED', published_by_user_id = ?,
        published_by_name = ?, published_at = ?, scheduled_for = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [user?.id || null, user?.name || 'Scheduled publisher', publishedAt, direct ? null : current.scheduled_for ? String(current.scheduled_for) : null, id],
    })
    await tx.execute({
      sql: `INSERT INTO cms_published
        (content_type, content_key, item_id, version, payload, checksum, published_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(content_type, content_key) DO UPDATE SET
          item_id = excluded.item_id,
          version = excluded.version,
          payload = excluded.payload,
          checksum = excluded.checksum,
          published_at = excluded.published_at`,
      args: [
        String(current.content_type),
        String(current.content_key),
        id,
        Number(current.version),
        JSON.stringify(current.payload),
        String(current.checksum),
        publishedAt,
      ],
    })
    await insertEvent(tx, {
      itemId: id,
      action: direct ? 'DIRECT_PUBLISHED' : user ? 'PUBLISHED' : 'SCHEDULED_PUBLISH',
      actor: user,
      fromStatus: String(current.status),
      toStatus: 'PUBLISHED',
      oldPayload: previous ? parseJson(previous.payload) : null,
      newPayload: current.payload,
      note: direct ? `Admin direct publish: ${String(current.change_note || '').trim() || 'No change note supplied'}` : String(current.change_note || ''),
      requestId,
    })
    const item = await itemWith(tx, id)
    await tx.commit()
    return { scheduled: false, item }
  } catch (error) {
    if (!tx.closed) await tx.rollback()
    throw error
  } finally {
    tx.close()
  }
}

export async function createCmsRollbackDraft(sourceId: number, user: CmsUser, requestId = '') {
  const source = await getCmsItem(sourceId)
  if (!source) throw new CmsWorkflowError(404, 'NOT_FOUND', 'Publishing item not found')
  if (!['PUBLISHED', 'ARCHIVED'].includes(String(source.status))) {
    throw new CmsWorkflowError(409, 'INVALID_STATE', 'Only published history can be rolled back')
  }
  return createCmsDraft({
    contentType: String(source.content_type) as CmsContentType,
    contentKey: String(source.content_key),
    payload: source.payload,
    changeNote: `Rollback to version ${source.version}`,
    user,
    requestId,
    supersedesItemId: sourceId,
  })
}

export async function publishDueCmsItems() {
  const db = await ensureCmsSchema()
  const result = await db.execute(
    `SELECT id FROM cms_items WHERE status = 'APPROVED' AND scheduled_for IS NOT NULL
      AND datetime(scheduled_for) <= datetime('now') ORDER BY scheduled_for LIMIT 50`,
  )
  for (const row of result.rows) {
    await publishCmsItem(Number(row.id), null, 'scheduled-public-read')
  }
}

export async function getCmsPublishedSnapshot() {
  await publishDueCmsItems()
  const db = await ensureCmsSchema()
  const result = await db.execute(
    `SELECT content_type, content_key, item_id, version, payload, checksum, published_at
      FROM cms_published ORDER BY content_type, content_key`,
  )
  const content: Record<CmsContentType, unknown | null> = {
    rates: null,
    'transfer-rates': null,
    promotions: null,
    branches: null,
    news: null,
    blog: null,
    careers: null,
    contact: null,
  }
  const versions: Record<string, unknown> = {}
  let publishedAt: string | null = null

  for (const row of result.rows) {
    if (String(row.content_key) !== 'primary') continue
    const type = String(row.content_type) as CmsContentType
    content[type] = parseJson(row.payload)
    versions[type] = {
      version: Number(row.version),
      checksum: String(row.checksum),
      publishedAt: String(row.published_at),
    }
    const rowDate = String(row.published_at)
    if (!publishedAt || rowDate > publishedAt) publishedAt = rowDate
  }
  return { content, meta: { publishedAt, versions } }
}
