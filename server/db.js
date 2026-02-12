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

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      email TEXT,
      name TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS voucher_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      claimed_at TEXT DEFAULT (datetime('now')),
      used_at TEXT,
      FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      UNIQUE(voucher_id, customer_id)
    );
  `);

  // Migrate: add new columns to vouchers (safe: ignore if already exists)
  migrate();

  console.log('Database initialized:', dbPath);
  return db;
}

/**
 * Safe migration - add columns that may not exist yet
 */
function migrate() {
  const alterations = [
    'ALTER TABLE vouchers ADD COLUMN title TEXT',
    'ALTER TABLE vouchers ADD COLUMN description TEXT',
    'ALTER TABLE vouchers ADD COLUMN background_image TEXT'
  ];

  for (const sql of alterations) {
    try { db.exec(sql); } catch (e) { /* column already exists */ }
  }
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
      INSERT INTO vouchers (code, discount_type, discount_value, expiry_date, max_uses, is_active, title, description, background_image)
      VALUES (@code, @discount_type, @discount_value, @expiry_date, @max_uses, @is_active, @title, @description, @background_image)
    `);
    const result = stmt.run({
      code: data.code.toUpperCase(),
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      expiry_date: data.expiry_date || null,
      max_uses: data.max_uses || null,
      is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
      title: data.title || null,
      description: data.description || null,
      background_image: data.background_image || null
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
    if (data.title !== undefined) { fields.push('title = @title'); params.title = data.title || null; }
    if (data.description !== undefined) { fields.push('description = @description'); params.description = data.description || null; }
    if (data.background_image !== undefined) { fields.push('background_image = @background_image'); params.background_image = data.background_image || null; }

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

// ==========================================
// CUSTOMERS
// ==========================================

const customers = {
  findOrCreate(phone, data = {}) {
    let customer = getDb().prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
    if (customer) {
      // Update optional fields if provided
      const updates = [];
      const params = { id: customer.id };
      if (data.email && !customer.email) { updates.push('email = @email'); params.email = data.email; }
      if (data.name && !customer.name) { updates.push('name = @name'); params.name = data.name; }
      if (updates.length > 0) {
        getDb().prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = @id`).run(params);
        customer = getDb().prepare('SELECT * FROM customers WHERE id = ?').get(customer.id);
      }
      return customer;
    }

    const stmt = getDb().prepare('INSERT INTO customers (phone, email, name) VALUES (@phone, @email, @name)');
    const result = stmt.run({
      phone,
      email: data.email || null,
      name: data.name || null
    });
    return getDb().prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
  },

  getByPhone(phone) {
    return getDb().prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
  }
};

// ==========================================
// VOUCHER CLAIMS
// ==========================================

const voucherClaims = {
  claim(voucherId, customerId) {
    const existing = getDb().prepare(
      'SELECT * FROM voucher_claims WHERE voucher_id = ? AND customer_id = ?'
    ).get(voucherId, customerId);
    if (existing) return existing;

    const stmt = getDb().prepare(
      'INSERT INTO voucher_claims (voucher_id, customer_id) VALUES (?, ?)'
    );
    const result = stmt.run(voucherId, customerId);

    // Increment voucher uses
    vouchers.incrementUses(voucherId);

    return getDb().prepare('SELECT * FROM voucher_claims WHERE id = ?').get(result.lastInsertRowid);
  },

  getByVoucher(voucherId) {
    return getDb().prepare(`
      SELECT vc.*, c.phone, c.email, c.name as customer_name
      FROM voucher_claims vc
      JOIN customers c ON c.id = vc.customer_id
      WHERE vc.voucher_id = ?
      ORDER BY vc.claimed_at DESC
    `).all(voucherId);
  },

  getByCustomerPhone(phone) {
    const customer = customers.getByPhone(phone);
    if (!customer) return [];
    return getDb().prepare(`
      SELECT vc.*, v.code, v.title, v.description, v.discount_type, v.discount_value,
             v.expiry_date, v.is_active, v.background_image
      FROM voucher_claims vc
      JOIN vouchers v ON v.id = vc.voucher_id
      WHERE vc.customer_id = ?
      ORDER BY vc.claimed_at DESC
    `).all(customer.id);
  },

  getClaimForCustomerVoucher(voucherId, phone) {
    const customer = customers.getByPhone(phone);
    if (!customer) return null;
    return getDb().prepare(
      'SELECT * FROM voucher_claims WHERE voucher_id = ? AND customer_id = ?'
    ).get(voucherId, customer.id);
  },

  markUsed(claimId) {
    return getDb().prepare(
      "UPDATE voucher_claims SET used_at = datetime('now') WHERE id = ? AND used_at IS NULL"
    ).run(claimId).changes > 0;
  },

  getClaimCounts(voucherId) {
    const row = getDb().prepare(`
      SELECT
        COUNT(*) as claimed,
        SUM(CASE WHEN used_at IS NOT NULL THEN 1 ELSE 0 END) as used
      FROM voucher_claims
      WHERE voucher_id = ?
    `).get(voucherId);
    return { claimed: row.claimed, used: row.used };
  }
};

module.exports = {
  init,
  getDb,
  reservations,
  vouchers,
  customers,
  voucherClaims
};
