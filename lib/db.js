const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true, mode: 0o700 });
}

const DB_PATH = path.join(DB_DIR, 'assista.db');
const db = new DatabaseSync(DB_PATH);

// SQLite hardening and concurrency settings.
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA busy_timeout = 5000;');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'editor',
      mfa_secret TEXT,
      mfa_enabled INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS visitor_sessions (
      session_id TEXT PRIMARY KEY,
      first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      referrer TEXT,
      device_category TEXT DEFAULT 'desktop',
      browser TEXT DEFAULT 'Chrome',
      region TEXT DEFAULT 'Global',
      consent_status TEXT DEFAULT 'pending',
      path_history TEXT DEFAULT '[]',
      lead_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      event_data TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      business_email TEXT NOT NULL,
      company TEXT NOT NULL,
      industry TEXT NOT NULL,
      requirements TEXT DEFAULT '[]',
      team_configuration TEXT DEFAULT '{}',
      message TEXT,
      status TEXT DEFAULT 'New',
      intent_score INTEGER DEFAULT 30,
      session_id TEXT,
      notes TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cms_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT UNIQUE NOT NULL,
      title TEXT,
      subtitle TEXT,
      content_json TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      description TEXT NOT NULL,
      deliverables TEXT NOT NULL,
      team_roles TEXT NOT NULL,
      typical_sla TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS industries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      headline TEXT NOT NULL,
      subheadline TEXT NOT NULL,
      off_their_plate TEXT NOT NULL,
      case_snapshot TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      client_type TEXT NOT NULL,
      industry TEXT NOT NULL,
      challenge TEXT NOT NULL,
      solution TEXT NOT NULL,
      outcome TEXT NOT NULL,
      metrics TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS team (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      location TEXT NOT NULL,
      bio TEXT NOT NULL,
      avatar TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_title TEXT NOT NULL,
      company TEXT NOT NULL,
      industry TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      read_time TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_email TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS seo_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route TEXT UNIQUE NOT NULL,
      meta_title TEXT NOT NULL,
      meta_description TEXT NOT NULL,
      og_image TEXT,
      canonical_url TEXT,
      keywords TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_visitor_sessions_lead_id ON visitor_sessions(lead_id);
    CREATE INDEX IF NOT EXISTS idx_visitor_sessions_last_seen ON visitor_sessions(last_seen);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id_created_at ON analytics_events(session_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type_created_at ON analytics_events(event_type, created_at);
    CREATE INDEX IF NOT EXISTS idx_leads_status_created_at ON leads(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_leads_session_id ON leads(session_id);
    CREATE INDEX IF NOT EXISTS idx_leads_business_email ON leads(business_email);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created_at ON audit_logs(action, created_at);
    CREATE INDEX IF NOT EXISTS idx_insights_published_at ON insights(published_at);
    CREATE INDEX IF NOT EXISTS idx_seo_metadata_route ON seo_metadata(route);
  `);
}

initSchema();

module.exports = {
  db,
  initSchema
};
