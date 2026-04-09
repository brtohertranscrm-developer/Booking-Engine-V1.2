const db = require('./db');
const bcrypt = require('bcrypt'); // <-- Import library bcrypt untuk enkripsi sandi

console.log('⏳ Memulai pengisian data awal (Seeding)...');

// 1. Enkripsi password secara sinkron sebelum dimasukkan ke DB
const adminPassword = bcrypt.hashSync('admin123', 10);
const userPassword = bcrypt.hashSync('user123', 10);

db.serialize(() => {
  // ==========================================
  // 1. Masukkan Data Motor
  // ==========================================
  const stmtMotor = db.prepare('INSERT INTO motors (name, category, base_price, stock, image_url) VALUES (?, ?, ?, ?, ?)');
  
  const motors = [
    ['Yamaha NMAX 155', 'Premium Matic', 100000, 5, 'https://images.unsplash.com/photo-1599819811279-d518ac6a4b16?q=80&w=600&auto=format&fit=crop'],
    ['Honda Vario 125', 'Standard Matic', 75000, 8, 'https://images.unsplash.com/photo-1625231334168-2506b98e04e9?q=80&w=600&auto=format&fit=crop'],
    ['Vespa Sprint 150', 'Lifestyle Matic', 150000, 2, 'https://images.unsplash.com/photo-1594046646545-2f5a519fc575?q=80&w=600&auto=format&fit=crop']
  ];

  motors.forEach(m => stmtMotor.run(m));
  stmtMotor.finalize();

  // ==========================================
  // 2. Masukkan Data Loker
  // ==========================================
  const stmtLocker = db.prepare('INSERT INTO lockers (location, size, base_price, stock) VALUES (?, ?, ?, ?)');
  
  const lockers = [
    ['Garasi Pusat Malioboro', 'Medium', 25000, 10],
    ['Garasi Pusat Malioboro', 'Large', 40000, 5],
    ['Garasi Stasiun Balapan', 'Medium', 25000, 8]
  ];

  lockers.forEach(l => stmtLocker.run(l));
  stmtLocker.finalize();

  // ==========================================
  // 3. Masukkan Data User & Admin
  // ==========================================
  const stmtUser = db.prepare('INSERT INTO users (id, name, email, password, phone, role, join_date, kyc_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  // Eksekusi insert dengan password yang sudah di-hash
  // ---> UBAH 'admin' MENJADI 'superadmin' DI BARIS BAWAH INI <---
  stmtUser.run(['U-001', 'Pandu Admin', 'admin@brothertrans.com', adminPassword, '08123456789', 'superadmin', new Date().toISOString(), 'approved']);
  
  stmtUser.run(['U-002', 'Pelanggan Setia', 'user@gmail.com', userPassword, '08556677889', 'user', new Date().toISOString(), 'pending']);

  stmtUser.finalize();

  console.log('✅ Data Motor, Loker, dan Pengguna berhasil ditambahkan ke Database!');
});