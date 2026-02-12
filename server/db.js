/**
 * MARIFAH - SQLite Database
 * Uses better-sqlite3 for synchronous, fast database access
 */

const Database = require('better-sqlite3');
const path = require('path');
const config = require('./config');

let db = null;

/**
 * Initialize database and create tables
 */
function init() {
  const dbPath = config.DATABASE_PATH || path.join(__dirname, '..', 'data', 'marifah.db');
  db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      guests INTEGER NOT NULL,
      message TEXT,
      source TEXT NOT NULL DEFAULT 'formulaire',
      status TEXT NOT NULL DEFAULT 'pending',
      telegram_sent INTEGER DEFAULT 0,
      email_sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      expiry_date TEXT,
      max_uses INTEGER,
      current_uses INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('Database initialized:', dbPath);
  return db;
}

/**
 * Get the database instance
 */
function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call db.init() first.');
  }
  return db;
}

// ==========================================
// RESERVATIONS
// ==========================================

const reservations = {
  insert(data) {
    const stmt = getDb().prepare(`
      INSERT INTO reservations (name, email, phone, date, time, guests, message, source, telegram_sent, email_sent)
      VALUES (@name, @email, @phone, @date, @time, @guests, @message, @source, @telegram_sent, @email_sent)
    `);
    const result = stmt.run({
      name: data.name,
      email: data.email || null,
      phone: data.phone,
      date: data.date,
      time: data.time,
      guests: data.guests,
      message: data.message || null,
      source: data.source || 'formulaire',
      telegram_sent: data.telegram_sent ? 1 : 0,
      email_sent: data.email_sent ? 1 : 0
    });
    return result.lastInsertRowid;
  },

  getById(id) {
    return getDb().prepare('SELECT * FROM reservations WHERE id = ?').get(id);
  },

  list({ status, source, date, dateFrom, dateTo, page = 1, limit = 20 } = {}) {
    let where = [];
    let params = {};

    if (status) {
      where.push('status = @status');
      params.status = status;
    }
    if (source) {
      where.push('source = @source');
      params.source = source;
    }
    if (date) {
      where.push('date = @date');
      params.date = date;
    }
    if (dateFrom) {
      where.push('date >= @dateFrom');
      params.dateFrom = dateFrom;
    }
    if (dateTo) {
      where.push('date <= @dateTo');
      params.dateTo = dateTo;
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (page - 1) * limit;

    const total = getDb().prepare(`SELECT COUNT(*) as count FROM reservations ${whereClause}`).get(params).count;
    const items = getDb().prepare(`SELECT * FROM reservations ${whereClause} ORDER BY created_at DESC LIMIT @limit OFFSET @offset`).all({ ...params, limit, offset });

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  },

  updateStatus(id, status) {
    const stmt = getDb().prepare(`UPDATE reservations SET status = ?, updated_at = datetime('now') WHERE id = ?`);
    return stmt.run(status, id).changes > 0;
  }
};

// ==========================================
// VOUCHERS
// ==========================================

const vouchers = {
  insert(data) {
    const stmt = getDb().prepare(`
      INSERT INTO vouchers (code, discount_type, discount_value, expiry_date, max_uses, is_active)
      VALUES (@code, @discount_type, @discount_value, @expiry_date, @max_uses, @is_active)
    `);
    const result = stmt.run({
      code: data.code.toUpperCase(),
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      expiry_date: data.expiry_date || null,
      max_uses: data.max_uses || null,
      is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
    });
    return result.lastInsertRowid;
  },

  getById(id) {
    return getDb().prepare('SELECT * FROM vouchers WHERE id = ?').get(id);
  },

  getByCode(code) {
    return getDb().prepare('SELECT * FROM vouchers WHERE code = ?').get(code.toUpperCase());
  },

  list() {
    return getDb().prepare('SELECT * FROM vouchers ORDER BY created_at DESC').all();
  },

  update(id, data) {
    const fields = [];
    const params = { id };

    if (data.code !== undefined) { fields.push('code = @code'); params.code = data.code.toUpperCase(); }
    if (data.discount_type !== undefined) { fields.push('discount_type = @discount_type'); params.discount_type = data.discount_type; }
    if (data.discount_value !== undefined) { fields.push('discount_value = @discount_value'); params.discount_value = data.discount_value; }
    if (data.expiry_date !== undefined) { fields.push('expiry_date = @expiry_date'); params.expiry_date = data.expiry_date || null; }
    if (data.max_uses !== undefined) { fields.push('max_uses = @max_uses'); params.max_uses = data.max_uses || null; }
    if (data.is_active !== undefined) { fields.push('is_active = @is_active'); params.is_active = data.is_active ? 1 : 0; }

    if (fields.length === 0) return false;

    const stmt = getDb().prepare(`UPDATE vouchers SET ${fields.join(', ')} WHERE id = @id`);
    return stmt.run(params).changes > 0;
  },

  delete(id) {
    return getDb().prepare('DELETE FROM vouchers WHERE id = ?').run(id).changes > 0;
  },

  validate(code) {
    const voucher = this.getByCode(code);
    if (!voucher) return { valid: false, error: 'Code invalide' };
    if (!voucher.is_active) return { valid: false, error: 'Ce code n\'est plus actif' };
    if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) {
      return { valid: false, error: 'Ce code a expire' };
    }
    if (voucher.max_uses && voucher.current_uses >= voucher.max_uses) {
      return { valid: false, error: 'Ce code a atteint sa limite d\'utilisation' };
    }
    return {
      valid: true,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      code: voucher.code
    };
  },

  incrementUses(id) {
    return getDb().prepare('UPDATE vouchers SET current_uses = current_uses + 1 WHERE id = ?').run(id).changes > 0;
  }
};

module.exports = {
  init,
  getDb,
  reservations,
  vouchers
};
