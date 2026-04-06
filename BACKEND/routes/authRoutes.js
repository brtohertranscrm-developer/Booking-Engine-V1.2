const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'brother_trans_secret_key_2026';

// ==========================================
// 1. REGISTER USER BARU (Sudah Dikembalikan ke Logika Asli)
// ==========================================
router.post('/register', async (req, res) => {
  const { name, email, phone, password, referred_by } = req.body;
  
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ success: false, error: 'Data tidak lengkap.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID(); 
    const joinDate = new Date().toISOString();
    const referralCode = `BR-${name.substring(0,3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    // Masukkan ke database (Lengkap dengan ID dan Join Date)
    db.run(`INSERT INTO users (id, name, email, phone, password, join_date, referral_code) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
      [userId, name, email, phone, hashedPassword, joinDate, referralCode], function(err) {
        if (err) {
            console.error("Register DB Error:", err.message);
            return res.status(400).json({ success: false, error: 'Email sudah terdaftar.' });
        }

        // Tambah miles jika pakai kode referral
        if (referred_by) {
          db.run(`UPDATE users SET miles = miles + 50 WHERE referral_code = ?`, [referred_by.toUpperCase()]);
        }
        
        res.json({ success: true, message: 'Registrasi berhasil. Silakan login.' });
    });
  } catch (error) { 
    console.error("Register Catch Error:", error);
    res.status(500).json({ success: false, error: 'Internal server error.' }); 
  }
});

// ==========================================
// 2. LOGIN USER / ADMIN (Logika Anti-Crash)
// ==========================================
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Validasi awal
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email dan password wajib diisi.' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    try {
      if (err) return res.status(500).json({ success: false, error: 'Kesalahan database.' });
      if (!user) return res.status(400).json({ success: false, error: 'Email tidak ditemukan.' });

      // Bandingkan password dengan try-catch
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ success: false, error: 'Password salah.' });

      // Buat token
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      delete user.password; // Keamanan: jangan kirim password ke frontend
      
      res.json({ success: true, user, token });

    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ success: false, error: 'Kesalahan internal server.' });
    }
  });
});

// ==========================================
// 3. LUPA PASSWORD (FORGOT PASSWORD)
// ==========================================
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email wajib diisi.' });
  }

  // Cek apakah email ada di database
  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) return res.status(500).json({ success: false, error: 'Kesalahan database.' });
    if (!user) return res.status(400).json({ success: false, error: 'Email tidak terdaftar.' });

    // Buat token unik (crypto sudah di-import di atas pada file Anda)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // Token kadaluarsa dalam 1 jam

    // Simpan token ke tabel users
    db.run(
      `UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?`,
      [resetToken, resetTokenExpiry, email],
      function(updateErr) {
        if (updateErr) {
          console.error("Forgot Password DB Error:", updateErr);
          return res.status(500).json({ success: false, error: 'Gagal menyimpan token reset.' });
        }

        // Karena Anda belum memasang library pengirim email (seperti Nodemailer),
        // kita log tautannya di console backend sementara agar Anda bisa men-testing alurnya.
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        console.log(`\n=== MOCK EMAIL SENT ===`);
        console.log(`Kepada : ${email}`);
        console.log(`Tautan : ${resetLink}`);
        console.log(`=======================\n`);

        // Balas ke frontend dengan format JSON agar 'await response.json()' tidak crash
        res.json({ success: true, message: 'Tautan reset sandi telah dikirim ke email.' });
      }
    );
  });
});

module.exports = router;