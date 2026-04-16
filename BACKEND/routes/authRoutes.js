const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// ==========================================
// HELPER: Promisify DB
// ==========================================
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) { err ? reject(err) : resolve({ lastID: this.lastID, changes: this.changes }); });
});

// ==========================================
// HELPER: Validasi email format sederhana
// ==========================================
const isValidEmail = (email) => {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ==========================================
// HELPER: Generate referral code yang lebih kuat
// ==========================================
const generateReferralCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa 0,O,1,I untuk hindari ambigu
  let code = 'BR-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ==========================================
// 1. REGISTER
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, referred_by } = req.body || {};

    // Validasi input
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, error: 'Semua field (nama, email, telepon, password) wajib diisi.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Format email tidak valid.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password minimal 6 karakter.' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Nama minimal 2 karakter.' });
    }

    // Cek email sudah terdaftar
    const existingUser = await dbGet(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email sudah terdaftar.' });
    }

    // Proses register
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const joinDate = new Date().toISOString();
    const referralCode = generateReferralCode();

    await dbRun(
      `INSERT INTO users (id, name, email, phone, password, join_date, referral_code) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name.trim(), email.toLowerCase().trim(), phone.trim(), hashedPassword, joinDate, referralCode]
    );

    // Proses referral (jika ada)
    if (referred_by && typeof referred_by === 'string' && referred_by.trim().length > 0) {
      try {
        const result = await dbRun(
          `UPDATE users SET miles = miles + 50 WHERE referral_code = ?`,
          [referred_by.trim().toUpperCase()]
        );
        if (result.changes > 0) {
          console.log(`✅ Referral miles +50 untuk kode: ${referred_by}`);
        }
      } catch (refErr) {
        // Referral gagal tidak menghalangi registrasi
        console.error('⚠️  Gagal proses referral:', refErr.message);
      }
    }

    res.status(201).json({ success: true, message: 'Registrasi berhasil. Silakan login.' });

  } catch (error) {
    console.error('POST /register error:', error.message);
    res.status(500).json({ success: false, error: 'Gagal melakukan registrasi.' });
  }
});

// ==========================================
// 2. LOGIN
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email dan password wajib diisi.' });
    }

    const user = await dbGet(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Email atau password salah.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      // Pesan sama dengan "email tidak ditemukan" untuk cegah user enumeration
      return res.status(401).json({ success: false, error: 'Email atau password salah.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, permissions: user.permissions },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Hapus field sensitif sebelum kirim ke frontend
    const { password: _, reset_token: __, reset_token_expiry: ___, ...safeUser } = user;

    res.json({ success: true, user: safeUser, token });

  } catch (error) {
    console.error('POST /login error:', error.message);
    res.status(500).json({ success: false, error: 'Gagal melakukan login.' });
  }
});

// ==========================================
// 3. FORGOT PASSWORD
// ==========================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Email yang valid wajib diisi.' });
    }

    const user = await dbGet(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase().trim()]);

    // PENTING: Selalu balas sukses meskipun email tidak ditemukan
    // Ini mencegah attacker mengetahui email mana yang terdaftar
    if (!user) {
      return res.json({ success: true, message: 'Jika email terdaftar, tautan reset akan dikirim.' });
    }

    // Generate token & simpan (hashed)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 jam

    await dbRun(
      `UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?`,
      [resetTokenHash, resetTokenExpiry, user.id]
    );

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // TODO: Ganti dengan pengiriman email sungguhan (Nodemailer)
    console.log(`\n=== RESET PASSWORD ===`);
    console.log(`Email  : ${email}`);
    console.log(`Link   : ${resetLink}`);
    console.log(`========================\n`);

    res.json({ success: true, message: 'Jika email terdaftar, tautan reset akan dikirim.' });

  } catch (error) {
    console.error('POST /forgot-password error:', error.message);
    res.status(500).json({ success: false, error: 'Gagal memproses permintaan reset password.' });
  }
});

// ==========================================
// 4. RESET PASSWORD (Endpoint baru)
// ==========================================
router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body || {};

    if (!token || !new_password) {
      return res.status(400).json({ success: false, error: 'Token dan password baru wajib diisi.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password baru minimal 6 karakter.' });
    }

    // Hash token untuk dicocokkan dengan yang di database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await dbGet(
      `SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > ?`,
      [tokenHash, Date.now()]
    );

    if (!user) {
      return res.status(400).json({ success: false, error: 'Token tidak valid atau sudah kadaluarsa.' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await dbRun(
      `UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?`,
      [hashedPassword, user.id]
    );

    res.json({ success: true, message: 'Password berhasil direset. Silakan login dengan password baru.' });

  } catch (error) {
    console.error('POST /reset-password error:', error.message);
    res.status(500).json({ success: false, error: 'Gagal mereset password.' });
  }
});

module.exports = router;
