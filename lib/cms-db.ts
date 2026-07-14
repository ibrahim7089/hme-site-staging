import 'server-only'

import fs from 'node:fs'
import path from 'node:path'
import { createClient, type Client } from '@libsql/client'
import { hash } from 'bcryptjs'

declare global {
  var hmeCmsClient: Client | undefined
  var hmeCmsSchemaPromise: Promise<void> | undefined
}

export class CmsNotConfiguredError extends Error {
  constructor() {
    super('CMS database is not configured')
    this.name = 'CmsNotConfiguredError'
  }
}

function databaseConfig() {
  const remoteUrl = process.env.TURSO_DATABASE_URL?.trim()
  if (remoteUrl) {
    return {
      url: remoteUrl,
      authToken: process.env.TURSO_AUTH_TOKEN?.trim(),
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    const dataDir = path.join(process.cwd(), 'data')
    fs.mkdirSync(dataDir, { recursive: true })
    return { url: `file:${path.join(dataDir, 'hme-cms.db')}` }
  }

  return null
}

export function isCmsConfigured() {
  return databaseConfig() !== null
}

export function getCmsDb() {
  const config = databaseConfig()
  if (!config) throw new CmsNotConfiguredError()
  if (!globalThis.hmeCmsClient) {
    globalThis.hmeCmsClient = createClient(config)
  }
  return globalThis.hmeCmsClient
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS cms_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Admin','Website Editor','Website Checker')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','DISABLED')),
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT DEFAULT NULL,
    last_login_at TEXT DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS cms_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL CHECK(content_type IN ('rates','promotions','branches')),
    content_key TEXT NOT NULL DEFAULT 'primary',
    version INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT'
      CHECK(status IN ('DRAFT','PENDING','APPROVED','PUBLISHED','REJECTED','ARCHIVED')),
    payload TEXT NOT NULL CHECK(json_valid(payload)),
    checksum TEXT NOT NULL,
    change_note TEXT NOT NULL DEFAULT '',
    created_by_user_id INTEGER NOT NULL,
    created_by_name TEXT NOT NULL DEFAULT '',
    submitted_by_user_id INTEGER DEFAULT NULL,
    reviewed_by_user_id INTEGER DEFAULT NULL,
    reviewed_by_name TEXT NOT NULL DEFAULT '',
    published_by_user_id INTEGER DEFAULT NULL,
    published_by_name TEXT NOT NULL DEFAULT '',
    scheduled_for TEXT DEFAULT NULL,
    rejection_reason TEXT NOT NULL DEFAULT '',
    supersedes_item_id INTEGER DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    submitted_at TEXT DEFAULT NULL,
    reviewed_at TEXT DEFAULT NULL,
    published_at TEXT DEFAULT NULL,
    UNIQUE(content_type, content_key, version),
    FOREIGN KEY(created_by_user_id) REFERENCES cms_users(id),
    FOREIGN KEY(supersedes_item_id) REFERENCES cms_items(id)
  )`,
  `CREATE TABLE IF NOT EXISTS cms_published (
    content_type TEXT NOT NULL,
    content_key TEXT NOT NULL DEFAULT 'primary',
    item_id INTEGER NOT NULL,
    version INTEGER NOT NULL,
    payload TEXT NOT NULL CHECK(json_valid(payload)),
    checksum TEXT NOT NULL,
    published_at TEXT NOT NULL,
    PRIMARY KEY(content_type, content_key),
    FOREIGN KEY(item_id) REFERENCES cms_items(id)
  )`,
  `CREATE TABLE IF NOT EXISTS cms_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    actor_user_id INTEGER DEFAULT NULL,
    actor_name TEXT NOT NULL DEFAULT '',
    from_status TEXT DEFAULT NULL,
    to_status TEXT DEFAULT NULL,
    old_payload TEXT DEFAULT NULL,
    new_payload TEXT DEFAULT NULL,
    note TEXT NOT NULL DEFAULT '',
    request_id TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(item_id) REFERENCES cms_items(id)
  )`,
  'CREATE INDEX IF NOT EXISTS idx_cms_items_queue ON cms_items(status, scheduled_for, updated_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_cms_items_content ON cms_items(content_type, content_key, version DESC)',
  'CREATE INDEX IF NOT EXISTS idx_cms_events_item ON cms_events(item_id, created_at DESC)',
  `CREATE TRIGGER IF NOT EXISTS cms_events_immutable_update
    BEFORE UPDATE ON cms_events
    BEGIN
      SELECT RAISE(ABORT, 'CMS events are immutable');
    END`,
  `CREATE TRIGGER IF NOT EXISTS cms_events_immutable_delete
    BEFORE DELETE ON cms_events
    BEGIN
      SELECT RAISE(ABORT, 'CMS events are immutable');
    END`,
]

async function seedFirstAdmin(db: Client) {
  const existing = await db.execute('SELECT COUNT(*) AS total FROM cms_users')
  const total = Number(existing.rows[0]?.total || 0)
  if (total > 0) return

  const email = process.env.CMS_ADMIN_EMAIL?.trim().toLowerCase() ||
    (process.env.NODE_ENV !== 'production' ? 'admin@hme.local' : '')
  const password = process.env.CMS_ADMIN_PASSWORD ||
    (process.env.NODE_ENV !== 'production' ? 'ChangeMe123!' : '')
  if (!email || password.length < 12) return

  const adminName = process.env.CMS_ADMIN_NAME?.trim() || 'HME CMS Administrator'
  const passwordHash = await hash(password, 12)
  await db.execute({
    sql: `INSERT OR IGNORE INTO cms_users
      (name, email, password_hash, role, status)
      VALUES (?, ?, ?, 'Admin', 'ACTIVE')`,
    args: [adminName, email, passwordHash],
  })
}

export async function ensureCmsSchema() {
  const db = getCmsDb()
  if (!globalThis.hmeCmsSchemaPromise) {
    globalThis.hmeCmsSchemaPromise = (async () => {
      for (const statement of schemaStatements) {
        await db.execute(statement)
      }
      await seedFirstAdmin(db)
    })().catch((error) => {
      globalThis.hmeCmsSchemaPromise = undefined
      throw error
    })
  }
  await globalThis.hmeCmsSchemaPromise
  return db
}
