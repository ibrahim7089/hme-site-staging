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
    content_type TEXT NOT NULL CHECK(content_type IN ('pages','global','rates','transfer-rates','promotions','branches','news','blog','careers','contact')),
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
  `CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference TEXT NOT NULL UNIQUE,
    enquiry_type TEXT NOT NULL
      CHECK(enquiry_type IN ('general','rates','transfer','booking','business','agent','career','complaint','privacy')),
    subject TEXT NOT NULL DEFAULT '',
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    preferred_contact TEXT NOT NULL
      CHECK(preferred_contact IN ('email','phone','whatsapp')),
    status TEXT NOT NULL DEFAULT 'NEW'
      CHECK(status IN ('NEW','IN_PROGRESS','RESOLVED','ARCHIVED')),
    assigned_to_user_id INTEGER DEFAULT NULL,
    assigned_to_name TEXT NOT NULL DEFAULT '',
    email_delivery_status TEXT NOT NULL DEFAULT 'PENDING'
      CHECK(email_delivery_status IN ('PENDING','SENT','FAILED')),
    consent_at TEXT NOT NULL,
    resolved_at TEXT DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(assigned_to_user_id) REFERENCES cms_users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS enquiry_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enquiry_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    actor_user_id INTEGER DEFAULT NULL,
    actor_name TEXT NOT NULL DEFAULT '',
    from_status TEXT DEFAULT NULL,
    to_status TEXT DEFAULT NULL,
    note TEXT NOT NULL DEFAULT '',
    request_id TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(enquiry_id) REFERENCES enquiries(id)
  )`,
  `CREATE TABLE IF NOT EXISTS enquiry_categories (
    category_key TEXT PRIMARY KEY,
    label TEXT NOT NULL COLLATE NOCASE UNIQUE,
    active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
    built_in INTEGER NOT NULL DEFAULT 0 CHECK(built_in IN (0,1)),
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_by_user_id INTEGER DEFAULT NULL,
    updated_by_name TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(updated_by_user_id) REFERENCES cms_users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS enquiry_deletion_authorizations (
    enquiry_id INTEGER PRIMARY KEY,
    request_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS enquiry_deletion_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference TEXT NOT NULL,
    enquiry_type TEXT NOT NULL,
    actor_user_id INTEGER NOT NULL,
    actor_name TEXT NOT NULL,
    request_id TEXT NOT NULL,
    deleted_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(actor_user_id) REFERENCES cms_users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS cms_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_by_user_id INTEGER DEFAULT NULL,
    updated_by_name TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(updated_by_user_id) REFERENCES cms_users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS cms_setting_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT NOT NULL,
    old_value TEXT NOT NULL DEFAULT '',
    new_value TEXT NOT NULL,
    actor_user_id INTEGER NOT NULL,
    actor_name TEXT NOT NULL,
    request_id TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(actor_user_id) REFERENCES cms_users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS google_oauth_tokens (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    connected_email TEXT NOT NULL DEFAULT '',
    encrypted_refresh_token TEXT NOT NULL,
    connected_by_user_id INTEGER DEFAULT NULL,
    connected_by_name TEXT NOT NULL DEFAULT '',
    connected_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(connected_by_user_id) REFERENCES cms_users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS google_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_review_id TEXT NOT NULL UNIQUE,
    account_name TEXT NOT NULL,
    location_name TEXT NOT NULL,
    branch_name TEXT NOT NULL DEFAULT '',
    reviewer_name TEXT NOT NULL DEFAULT 'A Google user',
    reviewer_photo_url TEXT NOT NULL DEFAULT '',
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL DEFAULT '',
    review_created_at TEXT NOT NULL,
    review_updated_at TEXT NOT NULL,
    reply_status TEXT NOT NULL DEFAULT 'NONE'
      CHECK(reply_status IN ('NONE','SUGGESTED','AUTO_REPLIED','SENT')),
    ai_draft TEXT NOT NULL DEFAULT '',
    reply_text TEXT NOT NULL DEFAULT '',
    reply_posted_at TEXT DEFAULT NULL,
    replied_by_user_id INTEGER DEFAULT NULL,
    replied_by_name TEXT NOT NULL DEFAULT '',
    featured_on_homepage INTEGER NOT NULL DEFAULT 1 CHECK(featured_on_homepage IN (0,1)),
    fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(replied_by_user_id) REFERENCES cms_users(id)
  )`,
  'CREATE INDEX IF NOT EXISTS idx_google_reviews_rating ON google_reviews(rating, reply_status, review_created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_google_reviews_status ON google_reviews(reply_status, review_created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_google_reviews_featured ON google_reviews(featured_on_homepage, rating, review_created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_cms_items_queue ON cms_items(status, scheduled_for, updated_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_cms_items_content ON cms_items(content_type, content_key, version DESC)',
  'CREATE INDEX IF NOT EXISTS idx_cms_events_item ON cms_events(item_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_enquiries_queue ON enquiries(status, updated_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_enquiries_type ON enquiries(enquiry_type, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_enquiries_assignee ON enquiries(assigned_to_user_id, status, updated_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_enquiry_events_item ON enquiry_events(enquiry_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_enquiry_deletion_events_date ON enquiry_deletion_events(deleted_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_cms_setting_events_key ON cms_setting_events(setting_key, created_at DESC)',
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
  `CREATE TRIGGER IF NOT EXISTS enquiry_events_immutable_update
    BEFORE UPDATE ON enquiry_events
    BEGIN
      SELECT RAISE(ABORT, 'Enquiry events are immutable');
    END`,
  `CREATE TRIGGER IF NOT EXISTS enquiry_events_immutable_delete
    BEFORE DELETE ON enquiry_events
    WHEN NOT EXISTS (
      SELECT 1 FROM enquiry_deletion_authorizations
      WHERE enquiry_id = OLD.enquiry_id
    )
    BEGIN
      SELECT RAISE(ABORT, 'Enquiry events are immutable');
    END`,
  `CREATE TRIGGER IF NOT EXISTS enquiry_deletion_events_immutable_update
    BEFORE UPDATE ON enquiry_deletion_events
    BEGIN
      SELECT RAISE(ABORT, 'Enquiry deletion events are immutable');
    END`,
  `CREATE TRIGGER IF NOT EXISTS enquiry_deletion_events_immutable_delete
    BEFORE DELETE ON enquiry_deletion_events
    BEGIN
      SELECT RAISE(ABORT, 'Enquiry deletion events are immutable');
    END`,
  `CREATE TRIGGER IF NOT EXISTS cms_setting_events_immutable_update
    BEFORE UPDATE ON cms_setting_events
    BEGIN
      SELECT RAISE(ABORT, 'CMS setting events are immutable');
    END`,
  `CREATE TRIGGER IF NOT EXISTS cms_setting_events_immutable_delete
    BEFORE DELETE ON cms_setting_events
    BEGIN
      SELECT RAISE(ABORT, 'CMS setting events are immutable');
    END`,
]

const defaultEnquiryCategories = [
  ['general', 'General enquiry'],
  ['rates', 'Rates and availability'],
  ['transfer', 'Money transfer'],
  ['booking', 'Currency booking'],
  ['business', 'Business services'],
  ['agent', 'Become an HME agent'],
  ['career', 'Career enquiry'],
  ['complaint', 'Feedback or complaint'],
  ['privacy', 'Privacy request'],
] as const

async function ensureEnquiryCategorySchema(db: Client) {
  const tx = await db.transaction('write')
  try {
    const columns = await tx.execute('PRAGMA table_info(enquiries)')
    const hasCategoryKey = columns.rows.some((row) => String(row.name) === 'enquiry_category_key')
    if (!hasCategoryKey) {
      await tx.execute("ALTER TABLE enquiries ADD COLUMN enquiry_category_key TEXT NOT NULL DEFAULT 'general'")
    }
    await tx.execute(`UPDATE enquiries
      SET enquiry_category_key = enquiry_type
      WHERE enquiry_category_key = 'general' AND enquiry_type <> 'general'`)
    for (const [index, category] of defaultEnquiryCategories.entries()) {
      await tx.execute({
        sql: `INSERT INTO enquiry_categories (
          category_key, label, active, built_in, sort_order
        ) VALUES (?, ?, 1, 1, ?)
        ON CONFLICT(category_key) DO NOTHING`,
        args: [category[0], category[1], (index + 1) * 10],
      })
    }
    await tx.execute(
      'CREATE INDEX IF NOT EXISTS idx_enquiries_category ON enquiries(enquiry_category_key, created_at DESC)',
    )
    await tx.execute(
      'CREATE INDEX IF NOT EXISTS idx_enquiry_categories_order ON enquiry_categories(active, sort_order, label)',
    )
    await tx.commit()
  } catch (error) {
    if (!tx.closed) await tx.rollback()
    throw error
  } finally {
    tx.close()
  }
}

async function ensureEnquiryDeletionSchema(db: Client) {
  const tx = await db.transaction('write')
  try {
    const existing = await tx.execute(
      "SELECT sql FROM sqlite_master WHERE type = 'trigger' AND name = 'enquiry_events_immutable_delete' LIMIT 1",
    )
    const triggerSql = String(existing.rows[0]?.sql || '')
    if (!triggerSql.includes('enquiry_deletion_authorizations')) {
      await tx.execute('DROP TRIGGER IF EXISTS enquiry_events_immutable_delete')
      await tx.execute(`CREATE TRIGGER enquiry_events_immutable_delete
        BEFORE DELETE ON enquiry_events
        WHEN NOT EXISTS (
          SELECT 1 FROM enquiry_deletion_authorizations
          WHERE enquiry_id = OLD.enquiry_id
        )
        BEGIN
          SELECT RAISE(ABORT, 'Enquiry events are immutable');
        END`)
    }
    await tx.commit()
  } catch (error) {
    if (!tx.closed) await tx.rollback()
    throw error
  } finally {
    tx.close()
  }
}


async function migrateCmsItemsContentTypes(db: Client) {
  const existing = await db.execute(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'cms_items' LIMIT 1",
  )
  const tableSql = String(existing.rows[0]?.sql || '')
  const requiredTypes = ['pages', 'global', 'rates', 'transfer-rates', 'promotions', 'branches', 'news', 'blog', 'careers', 'contact']
  if (!tableSql || requiredTypes.every((type) => tableSql.includes(`'${type}'`))) return

  const desired = schemaStatements.find((statement) =>
    statement.startsWith('CREATE TABLE IF NOT EXISTS cms_items'),
  )
  const desiredPublished = schemaStatements.find((statement) =>
    statement.startsWith('CREATE TABLE IF NOT EXISTS cms_published'),
  )
  const desiredEvents = schemaStatements.find((statement) =>
    statement.startsWith('CREATE TABLE IF NOT EXISTS cms_events'),
  )
  if (!desired || !desiredPublished || !desiredEvents) throw new Error('CMS schema is incomplete')

  const temporaryTable = 'cms_items_content_type_migration'
  const publishedBackup = 'cms_published_content_type_migration'
  const eventsBackup = 'cms_events_content_type_migration'
  const createTemporary = desired
    .replace('CREATE TABLE IF NOT EXISTS cms_items', `CREATE TABLE ${temporaryTable}`)
    .replaceAll('REFERENCES cms_items(id)', `REFERENCES ${temporaryTable}(id)`)
  const tx = await db.transaction('write')
  try {
    await tx.execute(`DROP TABLE IF EXISTS ${temporaryTable}`)
    await tx.execute(`DROP TABLE IF EXISTS ${publishedBackup}`)
    await tx.execute(`DROP TABLE IF EXISTS ${eventsBackup}`)
    await tx.execute(createTemporary)
    await tx.execute(`INSERT INTO ${temporaryTable} SELECT * FROM cms_items`)
    await tx.execute(`CREATE TABLE ${publishedBackup} AS SELECT * FROM cms_published`)
    await tx.execute(`CREATE TABLE ${eventsBackup} AS SELECT * FROM cms_events`)
    await tx.execute('DROP TRIGGER IF EXISTS cms_events_immutable_update')
    await tx.execute('DROP TRIGGER IF EXISTS cms_events_immutable_delete')
    await tx.execute('DROP TABLE cms_events')
    await tx.execute('DROP TABLE cms_published')
    await tx.execute('DROP TABLE cms_items')
    await tx.execute(`ALTER TABLE ${temporaryTable} RENAME TO cms_items`)
    await tx.execute(desiredPublished)
    await tx.execute(desiredEvents)
    await tx.execute(`INSERT INTO cms_published SELECT * FROM ${publishedBackup}`)
    await tx.execute(`INSERT INTO cms_events SELECT * FROM ${eventsBackup}`)
    await tx.execute(`DROP TABLE ${publishedBackup}`)
    await tx.execute(`DROP TABLE ${eventsBackup}`)
    await tx.execute('CREATE INDEX IF NOT EXISTS idx_cms_items_queue ON cms_items(status, scheduled_for, updated_at DESC)')
    await tx.execute('CREATE INDEX IF NOT EXISTS idx_cms_items_content ON cms_items(content_type, content_key, version DESC)')
    await tx.execute('CREATE INDEX IF NOT EXISTS idx_cms_events_item ON cms_events(item_id, created_at DESC)')
    await tx.execute(`CREATE TRIGGER cms_events_immutable_update
      BEFORE UPDATE ON cms_events
      BEGIN
        SELECT RAISE(ABORT, 'CMS events are immutable');
      END`)
    await tx.execute(`CREATE TRIGGER cms_events_immutable_delete
      BEFORE DELETE ON cms_events
      BEGIN
        SELECT RAISE(ABORT, 'CMS events are immutable');
      END`)
    await tx.commit()
  } catch (error) {
    if (!tx.closed) await tx.rollback()
    throw error
  } finally {
    tx.close()
  }
}

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
      await migrateCmsItemsContentTypes(db)
      await ensureEnquiryCategorySchema(db)
      await ensureEnquiryDeletionSchema(db)
      await seedFirstAdmin(db)
    })().catch((error) => {
      globalThis.hmeCmsSchemaPromise = undefined
      throw error
    })
  }
  await globalThis.hmeCmsSchemaPromise
  return db
}
