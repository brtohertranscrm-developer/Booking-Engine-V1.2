const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ==========================================
// 1. KONEKSI DATABASE
// ==========================================
const dbPath = path.resolve(__dirname, 'brother_trans.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Gagal terhubung ke database:', err.message);
    process.exit(1);
  }
  console.log('✅ Berhasil terhubung ke database SQLite.');
});

db.run("PRAGMA foreign_keys = ON");
db.run("PRAGMA journal_mode = WAL");

// ==========================================
// 2. HELPER: Tambah kolom jika belum ada (untuk migrasi)
// ==========================================
const addColumnIfNotExists = (tableName, columnName, columnDef) => {
  db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error(`⚠️  Gagal menambah ${columnName} di ${tableName}:`, err.message);
    }
  });
};

// ==========================================
// 3. SCHEMA — Definisi Tabel
// ==========================================
db.serialize(() => {
  console.log('⏳ Memeriksa dan membuat tabel database...');

  // --- USERS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      permissions TEXT DEFAULT '[]',
      kyc_status TEXT DEFAULT 'unverified',
      kyc_code TEXT,
      miles INTEGER DEFAULT 0,
      location TEXT DEFAULT 'Lainnya',
      profile_picture TEXT,
      profile_banner TEXT,
      referral_code TEXT UNIQUE,
      reset_token TEXT,
      reset_token_expiry INTEGER,
      has_completed_tc_gamification INTEGER DEFAULT 0,
      join_date TEXT NOT NULL
    )
  `);

  // --- MOTORS (Katalog) ---
  db.run(`
    CREATE TABLE IF NOT EXISTS motors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT DEFAULT 'Lempuyangan',
      base_price INTEGER NOT NULL,
      price_12h INTEGER DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      allow_dynamic_pricing INTEGER DEFAULT 1
    )
  `);

  // --- MOTOR UNITS (Plat Nomor per Motor) ---
  db.run(`
    CREATE TABLE IF NOT EXISTS motor_units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      motor_id INTEGER NOT NULL,
      plate_number TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'RDY',
      condition_notes TEXT,
      FOREIGN KEY (motor_id) REFERENCES motors(id) ON DELETE CASCADE
    )
  `);

  // --- LOCKERS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS lockers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location TEXT NOT NULL,
      size TEXT NOT NULL,
      base_price INTEGER NOT NULL,
      stock INTEGER NOT NULL
    )
  `);

  // --- BOOKINGS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      order_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_name TEXT NOT NULL,
      location TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      total_price INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_status TEXT DEFAULT 'paid',
      unit_id INTEGER,
      plate_number TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // --- PRICE RULES (Surge & Seasonal) ---
  db.run(`
    CREATE TABLE IF NOT EXISTS price_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_type TEXT NOT NULL,
      name TEXT,
      start_date TEXT,
      end_date TEXT,
      stock_condition INTEGER,
      markup_percentage INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1
    )
  `);

  // --- SUPPORT TICKETS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      order_id TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // --- PROMOTIONS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      image TEXT NOT NULL,
      desc TEXT,
      tag TEXT,
      is_active INTEGER DEFAULT 1,
      usage_limit INTEGER DEFAULT 0,
      current_usage INTEGER DEFAULT 0,
      discount_percent INTEGER DEFAULT 0,
      max_discount INTEGER DEFAULT 0
    )
  `);

  // --- ARTICLES ---
  db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      category TEXT DEFAULT 'Berita',
      image_url TEXT,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      meta_title TEXT,
      meta_desc TEXT,
      geo_location TEXT,
      scheduled_at TEXT,
      views INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // ==========================================
  // [FINANCE] TABEL BARU — Fase 1
  // ==========================================

  // --- EXPENSES (Pencatatan Biaya Operasional) ---
  // Kategori: servis | bbm | sewa | gaji | marketing | lainnya
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      motor_unit_id INTEGER,
      amount INTEGER NOT NULL,
      description TEXT,
      receipt_url TEXT,
      expense_date TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (motor_unit_id) REFERENCES motor_units(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // --- PAYMENT RECONCILIATIONS (Cocokkan Bukti Transfer dengan Booking) ---
  // status: pending | matched | rejected
  db.run(`
    CREATE TABLE IF NOT EXISTS payment_reconciliations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      transfer_amount INTEGER NOT NULL,
      transfer_date TEXT NOT NULL,
      proof_url TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      reconciled_by TEXT,
      reconciled_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES bookings(order_id),
      FOREIGN KEY (reconciled_by) REFERENCES users(id)
    )
  `);

  // --- VENDOR PAYOUTS (Komisi Mitra / Pemilik Armada) ---
  // status: pending | approved | paid
  db.run(`
    CREATE TABLE IF NOT EXISTS vendor_payouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_user_id TEXT NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      gross_revenue INTEGER NOT NULL DEFAULT 0,
      commission_rate REAL NOT NULL DEFAULT 0,
      commission_amount INTEGER NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      transfer_proof TEXT,
      notes TEXT,
      approved_by TEXT,
      approved_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (vendor_user_id) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )
  `);

  // ==========================================
  // [LOKER V2] TABEL BARU
  // ==========================================

  // --- LOCKER ADDONS (Layanan Pickup & Drop Berbayar) ---
  db.run(`
    CREATE TABLE IF NOT EXISTS locker_addons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL DEFAULT 0,
      addon_type TEXT NOT NULL DEFAULT 'pickup',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // ==========================================
  // 4. MIGRASI — Tambah kolom baru untuk database lama
  //    (Aman dijalankan berulang kali, diabaikan jika sudah ada)
  // ==========================================

  // Migrasi lama (tetap dipertahankan)
  addColumnIfNotExists('users', 'kyc_code', 'TEXT');
  addColumnIfNotExists('users', 'permissions', "TEXT DEFAULT '[]'");
  addColumnIfNotExists('users', 'location', 'TEXT DEFAULT "Lainnya"');
  addColumnIfNotExists('users', 'has_completed_tc_gamification', 'INTEGER DEFAULT 0');

  addColumnIfNotExists('bookings', 'payment_status', 'TEXT DEFAULT "paid"');
  addColumnIfNotExists('bookings', 'unit_id', 'INTEGER');
  addColumnIfNotExists('bookings', 'plate_number', 'TEXT');
  addColumnIfNotExists('bookings', 'created_at', "TEXT");

  addColumnIfNotExists('motors', 'location', 'TEXT DEFAULT "Lempuyangan"');
  addColumnIfNotExists('motors', 'price_12h', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('motors', 'allow_dynamic_pricing', 'INTEGER DEFAULT 1');

  addColumnIfNotExists('promotions', 'usage_limit', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('promotions', 'current_usage', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('promotions', 'discount_percent', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('promotions', 'max_discount', 'INTEGER DEFAULT 0');

  addColumnIfNotExists('articles', 'slug', 'TEXT');
  addColumnIfNotExists('articles', 'meta_title', 'TEXT');
  addColumnIfNotExists('articles', 'meta_desc', 'TEXT');
  addColumnIfNotExists('articles', 'geo_location', 'TEXT');
  addColumnIfNotExists('articles', 'views', 'INTEGER DEFAULT 0');

  // [FINANCE] Migrasi tabel yang sudah ada — Fase 1
  // bookings: metode pembayaran (transfer manual / cash / qris)
  addColumnIfNotExists('bookings', 'payment_method', "TEXT DEFAULT 'transfer'");

  // motors: relasi ke vendor/mitra pemilik armada dan komisi-nya
  addColumnIfNotExists('motors', 'vendor_user_id', 'TEXT');
  addColumnIfNotExists('motors', 'vendor_rate', 'REAL DEFAULT 0');

  // users: rekening bank untuk keperluan payout vendor
  addColumnIfNotExists('users', 'bank_account', 'TEXT');
  addColumnIfNotExists('users', 'bank_name', 'TEXT');

  // [LOKER V2] Migrasi tabel lockers — tambah type, pricing tier, dimensi
  // type: terbuka | tertutup
  // Terbuka  → 1h: 5k, 12h: 35k, 24h: 50k  | dimensi: 50x100x40
  // Tertutup → 1h: 7k, 12h: 45k, 24h: 65k  | dimensi: 90x60x50
  addColumnIfNotExists('lockers', 'type', "TEXT DEFAULT 'terbuka'");
  addColumnIfNotExists('lockers', 'price_1h', 'INTEGER DEFAULT 5000');
  addColumnIfNotExists('lockers', 'price_12h', 'INTEGER DEFAULT 35000');
  addColumnIfNotExists('lockers', 'price_24h', 'INTEGER DEFAULT 50000');
  addColumnIfNotExists('lockers', 'dimensions', 'TEXT');

  // [LOKER V2] Migrasi tabel bookings — tracking durasi & addon fee loker
  addColumnIfNotExists('bookings', 'duration_hours', 'INTEGER DEFAULT 1');
  addColumnIfNotExists('bookings', 'pickup_fee', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('bookings', 'drop_fee', 'INTEGER DEFAULT 0');

  // ==========================================
  // 5. INDEXES — Percepat query yang sering dipakai
  // ==========================================

  // Index lama (tetap dipertahankan)
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status)`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date)`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_motor_units_motor_id ON motor_units(motor_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_motor_units_status ON motor_units(status)`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug)`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_price_rules_type ON price_rules(rule_type, is_active)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id)`);

  // [FINANCE] Index baru — Fase 1
  // Expenses: query filter by date range dan kategori adalah yang paling sering
  db.run(`CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by)`);

  // Rekonsiliasi: sering di-query per order_id dan status
  db.run(`CREATE INDEX IF NOT EXISTS idx_reconciliations_order_id ON payment_reconciliations(order_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_reconciliations_status ON payment_reconciliations(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_reconciliations_created_at ON payment_reconciliations(created_at)`);

  // Vendor payouts: query per vendor dan status approval
  db.run(`CREATE INDEX IF NOT EXISTS idx_payouts_vendor_id ON vendor_payouts(vendor_user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payouts_status ON vendor_payouts(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payouts_period ON vendor_payouts(period_start, period_end)`);

  // Motors: query armada per vendor
  db.run(`CREATE INDEX IF NOT EXISTS idx_motors_vendor ON motors(vendor_user_id)`);

  // [LOKER V2] Index baru
  db.run(`CREATE INDEX IF NOT EXISTS idx_lockers_type ON lockers(type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_locker_addons_type ON locker_addons(addon_type, is_active)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_duration ON bookings(duration_hours)`);

  console.log('✅ Semua tabel, migrasi & index berhasil diverifikasi!');
});

module.exports = db;
