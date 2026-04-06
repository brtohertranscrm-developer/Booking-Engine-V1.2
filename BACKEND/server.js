const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./db'); // Load koneksi DB & init tabel

const app = express();
const PORT = process.env.PORT || 5001;

// ==========================================
// 1. AUTO-INIT DATABASE (Tabel & Kolom)
// ==========================================
// (Silakan biarkan bagian "db.run(CREATE TABLE...)" di sini dari file lama Anda 
//  jika Anda ingin memastikan tabel otomatis terbuat saat server berjalan).
// ...

// ==========================================
// 2. MIDDLEWARE UMUM
// ==========================================
// Konfigurasi CORS (Pastikan sudah pakai array yang kita bahas sebelumnya ya)
const allowedOrigins = [
  process.env.FRONTEND_URL, 
  'http://localhost:5173', 
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));

// Membaca JSON body
app.use(express.json({ limit: '50mb' }));
// Tambahan Baru: Membaca data form url-encoded (mencegah body undefined)
app.use(express.urlencoded({ extended: true, limit: '50mb' })); 

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

// ==========================================
// 3. IMPORT ROUTER MODUL
// ==========================================
const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ==========================================
// 4. DAFTARKAN ROUTES (API)
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);        // /api/motors, /api/lockers, dll
app.use('/api', userRoutes);          // /api/dashboard/me, /api/bookings, dll
app.use('/api/admin', adminRoutes);   // /api/admin/stats, dll

// ==========================================
// 5. START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Backend API Brother Trans Berjalan di: http://localhost:${PORT}`);
});