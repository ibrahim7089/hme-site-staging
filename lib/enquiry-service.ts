import 'server-only'

import { randomUUID } from 'node:crypto'
import type { Client, Transaction } from '@libsql/client'
import type { CmsUser } from './cms-auth'
import { ensureCmsSchema } from './cms-db'
import { CmsWorkflowError } from './cms-service'
import { enquiryTypeLabels, enquiryTypes, type EnquiryPayload, type EnquiryType } from './enquiry'
import { site } from './site'

export type EnquiryStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED'
export type EmailDeliveryStatus = 'PENDING' | 'SENT' | 'FAILED'

export type EnquiryRecord = {
  id: number
  reference: string
  enquiry_type: EnquiryType
  subject: string
  customer_name: string
  customer_email: string
  customer_phone: string
  location: string
  message: string
  preferred_contact: 'email' | 'phone' | 'whatsapp'
  status: EnquiryStatus
  assigned_to_user_id: number | null
  assigned_to_name: string
  email_delivery_status: EmailDeliveryStatus
  consent_at: string
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export type EnquiryNotificationSettings = {
  notificationEmail: string
  routing: Record<EnquiryType, string>
  source: 'admin' | 'server-default'
  updatedByName: string
  updatedAt: string | null
  history: Array<{
    id: number
    enquiryType: EnquiryType | null
    oldValue: string
    newValue: string
    actorName: string
    createdAt: string
  }>
}

type Executor = Pick<Client, 'execute'> | Pick<Transaction, 'execute'>
const enquiryNotificationEmailKey = 'enquiry_notification_email'
const enquiryNotificationRoutePrefix = 'enquiry_notification_email_'

function emptyEnquiryRouting(): Record<EnquiryType, string> {
  return {
    general: '',
    rates: '',
    transfer: '',
    booking: '',
    business: '',
    agent: '',
    career: '',
    complaint: '',
    privacy: '',
  }
}

function typeFromSettingKey(settingKey: string): EnquiryType | null {
  if (!settingKey.startsWith(enquiryNotificationRoutePrefix)) return null
  const type = settingKey.slice(enquiryNotificationRoutePrefix.length)
  return type in enquiryTypeLabels ? type as EnquiryType : null
}

function mapEnquiry(row: Record<string, unknown> | undefined): EnquiryRecord | null {
  if (!row) return null
  return {
    ...row,
    id: Number(row.id),
    enquiry_type: String(row.enquiry_type) as EnquiryType,
    status: String(row.status) as EnquiryStatus,
    preferred_contact: String(row.preferred_contact) as EnquiryRecord['preferred_contact'],
    email_delivery_status: String(row.email_delivery_status) as EmailDeliveryStatus,
    assigned_to_user_id: row.assigned_to_user_id ? Number(row.assigned_to_user_id) : null,
    resolved_at: row.resolved_at ? String(row.resolved_at) : null,
  } as EnquiryRecord
}

async function insertEvent(executor: Executor, input: {
  enquiryId: number
  action: string
  actor?: CmsUser | null
  fromStatus?: string | null
  toStatus?: string | null
  note?: string
  requestId?: string
}) {
  await executor.execute({
    sql: `INSERT INTO enquiry_events (
      enquiry_id, action, actor_user_id, actor_name, from_status, to_status, note, request_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      input.enquiryId,
      input.action,
      input.actor?.id || null,
      input.actor?.name || 'Website',
      input.fromStatus || null,
      input.toStatus || null,
      input.note?.trim() || '',
      input.requestId || '',
    ],
  })
}

function makeReference() {
  const day = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  return `HME-${day}-${randomUUID().slice(0, 8).toUpperCase()}`
}

export async function createEnquiry(payload: EnquiryPayload, requestId: string) {
  const db = await ensureCmsSchema()
  const reference = makeReference()
  const consentAt = new Date().toISOString()
  const tx = await db.transaction('write')
  try {
    const result = await tx.execute({
      sql: `INSERT INTO enquiries (
        reference, enquiry_type, subject, customer_name, customer_email,
        customer_phone, location, message, preferred_contact, consent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`,
      args: [
        reference,
        payload.type,
        payload.subject,
        payload.name,
        payload.email,
        payload.phone,
        payload.location,
        payload.message,
        payload.preferredContact,
        consentAt,
      ],
    })
    const enquiry = mapEnquiry(result.rows[0] as Record<string, unknown>)
    if (!enquiry) throw new Error('Enquiry could not be created')
    await insertEvent(tx, {
      enquiryId: enquiry.id,
      action: 'CREATED',
      toStatus: 'NEW',
      note: `Online ${enquiryTypeLabels[payload.type].toLowerCase()} received`,
      requestId,
    })
    await tx.commit()
    return enquiry
  } catch (error) {
    if (!tx.closed) await tx.rollback()
    throw error
  } finally {
    tx.close()
  }
}

export async function setEmailDelivery(input: {
  enquiryId: number
  status: EmailDeliveryStatus
  requestId: string
  note?: string
}) {
  const db = await ensureCmsSchema()
  const tx = await db.transaction('write')
  try {
    await tx.execute({
      sql: `UPDATE enquiries
        SET email_delivery_status = ?, updated_at = datetime('now')
        WHERE id = ?`,
      args: [input.status, input.enquiryId],
    })
    await insertEvent(tx, {
      enquiryId: input.enquiryId,
      action: input.status === 'SENT' ? 'EMAIL_NOTIFICATION_SENT' : 'EMAIL_NOTIFICATION_FAILED',
      note: input.note || '',
      requestId: input.requestId,
    })
    await tx.commit()
  } catch (error) {
    if (!tx.closed) await tx.rollback()
    throw error
  } finally {
    tx.close()
  }
}

export async function addSystemEvent(input: {
  enquiryId: number
  action: string
  note?: string
  requestId: string
}) {
  const db = await ensureCmsSchema()
  await insertEvent(db, input)
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] || character)
}

async function sendEmail(input: {
  to: string
  replyTo?: string
  subject: string
  text: string
  html: string
  idempotencyKey: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, reason: 'Email delivery is not configured' }

  const from = process.env.ENQUIRY_FROM_EMAIL || 'HME Website <website@hmeremit.com.my>'
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': input.idempotencyKey,
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        reply_to: input.replyTo,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    })
    return response.ok
      ? { ok: true, reason: '' }
      : { ok: false, reason: `Email provider returned status ${response.status}` }
  } catch {
    return { ok: false, reason: 'Email provider could not be reached' }
  }
}

export async function getEnquiryNotificationSettings(): Promise<EnquiryNotificationSettings> {
  const db = await ensureCmsSchema()
  const [settingsResult, historyResult] = await Promise.all([
    db.execute({
      sql: `SELECT setting_key, setting_value, updated_by_name, updated_at
        FROM cms_settings
        WHERE setting_key = ? OR setting_key LIKE ?`,
      args: [enquiryNotificationEmailKey, `${enquiryNotificationRoutePrefix}%`],
    }),
    db.execute({
      sql: `SELECT id, setting_key, old_value, new_value, actor_name, created_at
        FROM cms_setting_events
        WHERE setting_key = ? OR setting_key LIKE ?
        ORDER BY created_at DESC, id DESC
        LIMIT 20`,
      args: [enquiryNotificationEmailKey, `${enquiryNotificationRoutePrefix}%`],
    }),
  ])
  const settings = new Map(settingsResult.rows.map((row) => [
    String(row.setting_key),
    row,
  ]))
  const generalSetting = settings.get(enquiryNotificationEmailKey)
  const configuredEmail = String(generalSetting?.setting_value || '').trim().toLowerCase()
  const routing = emptyEnquiryRouting()
  for (const type of enquiryTypes) {
    routing[type] = String(settings.get(`${enquiryNotificationRoutePrefix}${type}`)?.setting_value || '').trim().toLowerCase()
  }
  const latestSetting = settingsResult.rows
    .filter((row) => row.updated_at)
    .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))[0]
  return {
    notificationEmail: configuredEmail || process.env.ENQUIRY_TO_EMAIL?.trim().toLowerCase() || site.email,
    routing,
    source: configuredEmail ? 'admin' : 'server-default',
    updatedByName: String(latestSetting?.updated_by_name || ''),
    updatedAt: latestSetting?.updated_at ? String(latestSetting.updated_at) : null,
    history: historyResult.rows.map((row) => ({
      id: Number(row.id),
      enquiryType: typeFromSettingKey(String(row.setting_key || '')),
      oldValue: String(row.old_value || ''),
      newValue: String(row.new_value || ''),
      actorName: String(row.actor_name || ''),
      createdAt: String(row.created_at || ''),
    })),
  }
}

export async function updateEnquiryNotificationSettings(input: {
  notificationEmail: string
  routing: Record<EnquiryType, string>
  user: CmsUser
  requestId: string
}) {
  const db = await ensureCmsSchema()
  const notificationEmail = input.notificationEmail.trim().toLowerCase()
  const tx = await db.transaction('write')
  try {
    const updates: Array<{ settingKey: string; value: string }> = [
      { settingKey: enquiryNotificationEmailKey, value: notificationEmail },
      ...enquiryTypes.map((type) => ({
        settingKey: `${enquiryNotificationRoutePrefix}${type}`,
        value: input.routing[type].trim().toLowerCase(),
      })),
    ]
    for (const update of updates) {
      const existingResult = await tx.execute({
        sql: 'SELECT setting_value FROM cms_settings WHERE setting_key = ? LIMIT 1',
        args: [update.settingKey],
      })
      const oldValue = String(existingResult.rows[0]?.setting_value || '')
      if (oldValue === update.value) continue
      await tx.execute({
        sql: `INSERT INTO cms_settings (
          setting_key, setting_value, updated_by_user_id, updated_by_name, updated_at
        ) VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(setting_key) DO UPDATE SET
          setting_value = excluded.setting_value,
          updated_by_user_id = excluded.updated_by_user_id,
          updated_by_name = excluded.updated_by_name,
          updated_at = datetime('now')`,
        args: [update.settingKey, update.value, input.user.id, input.user.name],
      })
      await tx.execute({
        sql: `INSERT INTO cms_setting_events (
          setting_key, old_value, new_value, actor_user_id, actor_name, request_id
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          update.settingKey,
          oldValue,
          update.value,
          input.user.id,
          input.user.name,
          input.requestId,
        ],
      })
    }
    await tx.commit()
  } catch (error) {
    if (!tx.closed) await tx.rollback()
    throw error
  } finally {
    tx.close()
  }
  return getEnquiryNotificationSettings()
}

export async function deliverEnquiryEmails(enquiry: EnquiryRecord, requestId: string) {
  const notificationSettings = await getEnquiryNotificationSettings()
  const notificationEmail = notificationSettings.routing[enquiry.enquiry_type]
    || notificationSettings.notificationEmail
  const typeLabel = enquiryTypeLabels[enquiry.enquiry_type]
  const subjectDetail = enquiry.subject ? ` — ${enquiry.subject.replace(/[\r\n]+/g, ' ')}` : ''
  const submittedAt = new Intl.DateTimeFormat('en-MY', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(new Date(enquiry.created_at.endsWith('Z') ? enquiry.created_at : `${enquiry.created_at}Z`))
  const details = [
    ['Reference', enquiry.reference],
    ['Enquiry type', typeLabel],
    ['Subject', enquiry.subject || 'Not provided'],
    ['Name', enquiry.customer_name],
    ['Email', enquiry.customer_email],
    ['Phone', enquiry.customer_phone],
    ['City / branch', enquiry.location || 'Not provided'],
    ['Preferred contact', enquiry.preferred_contact],
    ['Submitted', `${submittedAt} (Malaysia time)`],
  ]
  const text = [
    'New enquiry from the HME website',
    '',
    ...details.map(([label, value]) => `${label}: ${value}`),
    '',
    'Message:',
    enquiry.message,
  ].join('\n')
  const rows = details.map(([label, value]) => `
    <tr>
      <th style="padding:8px 12px;text-align:left;vertical-align:top;color:#52627a;border-bottom:1px solid #e3e9f2">${escapeHtml(label)}</th>
      <td style="padding:8px 12px;color:#071e44;border-bottom:1px solid #e3e9f2">${escapeHtml(value)}</td>
    </tr>`).join('')
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#071e44">
      <div style="background:#071e44;color:#fff;padding:22px 24px">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#9fc4f4">HME Website</div>
        <h1 style="font-size:22px;margin:7px 0 0">New ${escapeHtml(typeLabel)}</h1>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e3e9f2">${rows}</table>
      <div style="padding:22px 24px;background:#f6f8fb">
        <h2 style="font-size:15px;margin:0 0 10px">Enquiry details</h2>
        <p style="margin:0;white-space:pre-wrap;line-height:1.6;color:#34435c">${escapeHtml(enquiry.message)}</p>
      </div>
    </div>`

  const staff = await sendEmail({
    to: notificationEmail,
    replyTo: enquiry.customer_email,
    subject: `[HME Website] ${typeLabel}${subjectDetail} · ${enquiry.reference}`,
    text,
    html,
    idempotencyKey: `${requestId}-staff`,
  })

  await setEmailDelivery({
    enquiryId: enquiry.id,
    status: staff.ok ? 'SENT' : 'FAILED',
    requestId,
    note: staff.ok ? `Routed to ${notificationEmail}` : staff.reason,
  })

  if (!staff.ok) return false

  const acknowledgement = await sendEmail({
    to: enquiry.customer_email,
    replyTo: notificationEmail,
    subject: `HME received your enquiry · ${enquiry.reference}`,
    text: `Hello ${enquiry.customer_name},\n\nThank you for contacting HME. We received your ${typeLabel.toLowerCase()} and will respond using your preferred contact method.\n\nReference: ${enquiry.reference}\n\nPlease keep this reference for follow-up. Do not reply with passwords, PINs, full card details or identity document numbers.\n\nHME`,
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#071e44"><div style="background:#071e44;color:#fff;padding:22px 24px"><strong>HME</strong></div><div style="padding:26px;border:1px solid #e3e9f2"><h1 style="font-size:22px;margin-top:0">We received your enquiry</h1><p>Hello ${escapeHtml(enquiry.customer_name)},</p><p style="line-height:1.6">Thank you for contacting HME. We received your ${escapeHtml(typeLabel.toLowerCase())} and will respond using your preferred contact method.</p><p style="padding:14px;background:#f1f6fd;border-radius:8px"><strong>Reference:</strong> ${escapeHtml(enquiry.reference)}</p><p style="font-size:12px;color:#66758f;line-height:1.6">Please keep this reference for follow-up. Do not reply with passwords, PINs, full card details or identity document numbers.</p></div></div>`,
    idempotencyKey: `${requestId}-customer`,
  })
  await addSystemEvent({
    enquiryId: enquiry.id,
    action: acknowledgement.ok ? 'CUSTOMER_ACKNOWLEDGEMENT_SENT' : 'CUSTOMER_ACKNOWLEDGEMENT_FAILED',
    note: acknowledgement.reason,
    requestId,
  })
  return true
}

export async function listEnquiries(filters: {
  status?: EnquiryStatus | null
  type?: EnquiryType | null
  search?: string
  limit?: number
}) {
  const db = await ensureCmsSchema()
  const conditions: string[] = []
  const args: Array<string | number> = []
  if (filters.status) {
    conditions.push('status = ?')
    args.push(filters.status)
  }
  if (filters.type) {
    conditions.push('enquiry_type = ?')
    args.push(filters.type)
  }
  if (filters.search) {
    conditions.push(`(
      reference LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?
      OR customer_phone LIKE ? OR subject LIKE ? OR message LIKE ?
    )`)
    const term = `%${filters.search.trim().slice(0, 120)}%`
    args.push(term, term, term, term, term, term)
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const requestedLimit = Number.isFinite(filters.limit) ? Math.trunc(filters.limit || 200) : 200
  const limit = Math.min(Math.max(requestedLimit, 1), 500)
  args.push(limit)

  const [itemsResult, countsResult, usersResult] = await Promise.all([
    db.execute({
      sql: `SELECT * FROM enquiries ${where}
        ORDER BY CASE status
          WHEN 'NEW' THEN 0 WHEN 'IN_PROGRESS' THEN 1
          WHEN 'RESOLVED' THEN 2 ELSE 3 END, updated_at DESC
        LIMIT ?`,
      args,
    }),
    db.execute('SELECT status, COUNT(*) AS total FROM enquiries GROUP BY status'),
    db.execute("SELECT id, name FROM cms_users WHERE status = 'ACTIVE' ORDER BY name"),
  ])

  const counts: Record<EnquiryStatus, number> = { NEW: 0, IN_PROGRESS: 0, RESOLVED: 0, ARCHIVED: 0 }
  for (const row of countsResult.rows) {
    const status = String(row.status) as EnquiryStatus
    if (status in counts) counts[status] = Number(row.total || 0)
  }
  return {
    items: itemsResult.rows.map((row) => mapEnquiry(row as Record<string, unknown>)),
    counts,
    assignees: usersResult.rows.map((row) => ({ id: Number(row.id), name: String(row.name) })),
  }
}

export async function listEnquiryEvents(enquiryId: number) {
  const db = await ensureCmsSchema()
  const result = await db.execute({
    sql: `SELECT id, action, actor_name, from_status, to_status, note, created_at
      FROM enquiry_events WHERE enquiry_id = ? ORDER BY created_at DESC, id DESC`,
    args: [enquiryId],
  })
  return result.rows.map((row) => ({ ...row, id: Number(row.id) }))
}

export async function updateEnquiry(input: {
  enquiryId: number
  status?: EnquiryStatus
  assignedToUserId?: number | null
  note?: string
  user: CmsUser
  requestId: string
}) {
  const db = await ensureCmsSchema()
  const tx = await db.transaction('write')
  try {
    const existingResult = await tx.execute({
      sql: 'SELECT * FROM enquiries WHERE id = ? LIMIT 1',
      args: [input.enquiryId],
    })
    const existing = mapEnquiry(existingResult.rows[0] as Record<string, unknown> | undefined)
    if (!existing) throw new CmsWorkflowError(404, 'ENQUIRY_NOT_FOUND', 'Enquiry not found')

    let assigneeName = existing.assigned_to_name
    if (input.assignedToUserId !== undefined) {
      if (input.assignedToUserId === null) {
        assigneeName = ''
      } else {
        const userResult = await tx.execute({
          sql: "SELECT id, name FROM cms_users WHERE id = ? AND status = 'ACTIVE' LIMIT 1",
          args: [input.assignedToUserId],
        })
        if (!userResult.rows[0]) throw new CmsWorkflowError(400, 'INVALID_ASSIGNEE', 'Selected staff member is not available')
        assigneeName = String(userResult.rows[0].name)
      }
    }

    const nextStatus = input.status || existing.status
    const nextAssignee = input.assignedToUserId === undefined
      ? existing.assigned_to_user_id
      : input.assignedToUserId
    await tx.execute({
      sql: `UPDATE enquiries SET
        status = ?,
        assigned_to_user_id = ?,
        assigned_to_name = ?,
        resolved_at = CASE WHEN ? = 'RESOLVED' THEN COALESCE(resolved_at, datetime('now')) ELSE NULL END,
        updated_at = datetime('now')
        WHERE id = ?`,
      args: [nextStatus, nextAssignee, assigneeName, nextStatus, input.enquiryId],
    })

    if (nextStatus !== existing.status) {
      await insertEvent(tx, {
        enquiryId: input.enquiryId,
        action: 'STATUS_CHANGED',
        actor: input.user,
        fromStatus: existing.status,
        toStatus: nextStatus,
        requestId: input.requestId,
      })
    }
    if (nextAssignee !== existing.assigned_to_user_id) {
      await insertEvent(tx, {
        enquiryId: input.enquiryId,
        action: nextAssignee ? 'ASSIGNED' : 'UNASSIGNED',
        actor: input.user,
        note: assigneeName,
        requestId: input.requestId,
      })
    }
    if (input.note?.trim()) {
      await insertEvent(tx, {
        enquiryId: input.enquiryId,
        action: 'INTERNAL_NOTE_ADDED',
        actor: input.user,
        note: input.note,
        requestId: input.requestId,
      })
    }

    const updatedResult = await tx.execute({
      sql: 'SELECT * FROM enquiries WHERE id = ? LIMIT 1',
      args: [input.enquiryId],
    })
    await tx.commit()
    return mapEnquiry(updatedResult.rows[0] as Record<string, unknown>)
  } catch (error) {
    if (!tx.closed) await tx.rollback()
    throw error
  } finally {
    tx.close()
  }
}
