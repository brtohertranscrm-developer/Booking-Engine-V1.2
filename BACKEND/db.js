const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 1. Membuat koneksi ke database
const dbPath = path.resolve(__dirname, 'brother_trans.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Gagal terhubung ke database:', err.message);
  } else {
    console.log('✅ Berhasil terhubung ke database SQLite.');
  }
});

// 2. Membangun Tabel-Tabel (Schema)
db.serialize(() => {
  console.log('⏳ Memeriksa dan membuat tabel database...');

  // ==========================================
  // TAHAP 1: DEFINISI FUNGSI HARUS DI ATAS
  // ==========================================
  const addColumnIfNotExists = (tableName, columnName, columnDef) => {
    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`, (err) => {
      // Abaikan error jika kolom sudah ada
      if (err && !err.message.includes("duplicate column name")) {
        console.error(`Peringatan: Gagal menambah ${columnName} di ${tableName}:`, err.message);
      }
    });
  };

  // ==========================================
  // TAHAP 2: PEMBUATAN TABEL UTAMA
  // ==========================================
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, 
      phone TEXT NOT NULL,
      kyc_status TEXT DEFAULT 'unverified',
      miles INTEGER DEFAULT 0,              
      role TEXT DEFAULT 'user',             
      join_date TEXT NOT NULL,
      profile_picture TEXT,
      profile_banner TEXT,
      referral_code TEXT UNIQUE,
      reset_token TEXT,
      reset_token_expiry INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS motors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      base_price INTEGER NOT NULL,
      stock INTEGER NOT NULL,
      image_url TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS lockers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location TEXT NOT NULL,
      size TEXT NOT NULL,
      base_price INTEGER NOT NULL,
      stock INTEGER NOT NULL
    )
  `);

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
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS price_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_type TEXT NOT NULL, 
      name TEXT,
      start_date TEXT,
      end_date TEXT,
      stock_condition INTEGER,
      markup_percentage INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number TEXT UNIQUE NOT NULL, 
      user_id TEXT NOT NULL,
      order_id TEXT,                      
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'open',         
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      image TEXT NOT NULL,
      desc TEXT,
      tag TEXT,
      is_active INTEGER DEFAULT 1
    )`);

  // ==========================================
  // TAHAP 3: PEMANGGILAN FUNGSI (TAMBAH KOLOM)
  // ==========================================
  
  // Update kolom untuk tabel Users
  addColumnIfNotExists('users', 'kyc_code', 'TEXT'); // <-- Penambahan kyc_code ada di sini
  addColumnIfNotExists('users', 'profile_picture', 'TEXT');
  addColumnIfNotExists('users', 'profile_banner', 'TEXT');
  addColumnIfNotExists('users', 'referral_code', 'TEXT'); 
  addColumnIfNotExists('users', 'reset_token', 'TEXT');
  addColumnIfNotExists('users', 'reset_token_expiry', 'INTEGER');
  addColumnIfNotExists('users', 'miles', 'INTEGER DEFAULT 0');

  // Update kolom untuk tabel Bookings
  addColumnIfNotExists('bookings', 'location', 'TEXT');

  // Buat Unique Index untuk Referral Code
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code)`, (err) => {
    if (err) {
        // Abaikan error jika index sudah terbentuk
        if (!err.message.includes("index idx_users_referral_code already exists")) {
            console.error("Gagal membuat Unique Index untuk referral_code:", err.message);
        }
    }
  });

  console.log('✅ Semua tabel & struktur kolom berhasil diverifikasi!');
});

// Mengaktifkan Foreign Key
db.run("PRAGMA foreign_keys = ON", (err) => {
  if (err) console.error("Gagal mengaktifkan Foreign Key PRAGMA", err.message);
});

module.exports = db;