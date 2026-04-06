const express = require('express');
const db = require('../db');
const { verifyUser } = require('../middlewares/authMiddleware');
const router = express.Router();

// Semua route di sini otomatis menggunakan verifyUser
router.use(verifyUser);

// ==========================================
// 1. GET DATA DASHBOARD USER (ME)
// ==========================================
router.get('/dashboard/me', (req, res) => {
  const query = `
    SELECT id, name, email, phone, kyc_status, kyc_code, miles, 
           profile_picture, profile_banner, referral_code, role 
    FROM users WHERE id = ?`; // Pastikan kyc_status dan kyc_code ikut terpilih

  db.get(query, [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    
    db.get(`SELECT order_id as id, item_name as item, status FROM bookings WHERE user_id = ? AND status IN ('pending', 'active') LIMIT 1`, 
    [req.user.id], (err, order) => {
      res.json({ success: true, data: { user, activeOrder: order || null } });
    });
  });
});

// ==========================================
// 2. GET TOP TRAVELLERS (YANG BIKIN ERROR 404)
// ==========================================
router.get('/dashboard/top-travellers', (req, res) => {
  // Tambahkan WHERE miles > 0 agar yang nol tidak tampil
  db.all(`SELECT name, miles FROM users WHERE miles > 0 ORDER BY miles DESC LIMIT 3`, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows || [] });
  });
});

// ==========================================
// 3. SUPPORT TICKETS
// ==========================================
router.post('/support/tickets', (req, res) => {
  const { order_id, subject, message } = req.body;
  const ticketNumber = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
  db.run(`INSERT INTO support_tickets (ticket_number, user_id, order_id, subject, message) VALUES (?, ?, ?, ?, ?)`,
    [ticketNumber, req.user.id, order_id || null, subject, message], (err) => {
        if(err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, ticket_number: ticketNumber });
  });
});

// ==========================================
// 4. BOOKINGS
// ==========================================
router.post('/bookings', (req, res) => {
  const { order_id, item_type, item_name, location, start_date, end_date, total_price } = req.body;
  db.run(`INSERT INTO bookings (order_id, user_id, item_type, item_name, location, start_date, end_date, total_price, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 'paid')`,
    [order_id, req.user.id, item_type, item_name, location, start_date, end_date, total_price], (err) => {
      if(err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true });
    });
});

router.get('/users/history', (req, res) => {
  db.all(`SELECT * FROM bookings WHERE user_id = ? ORDER BY start_date DESC`, [req.user.id], (err, rows) => {
    if(err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows || [] });
  });
});

// ==========================================
// 5. KYC (KNOW YOUR CUSTOMER)
// ==========================================
router.put('/users/kyc', (req, res) => {
  db.run(`UPDATE users SET kyc_status = ? WHERE id = ?`, [req.body.status, req.user.id], (err) => {
    if(err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

router.post('/users/kyc/verify', (req, res) => {
  const { code } = req.body;
  db.get(`SELECT kyc_code FROM users WHERE id = ?`, [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!row || !row.kyc_code) return res.status(400).json({ success: false, error: 'Admin belum membuatkan kode untuk Anda.' });

    if (row.kyc_code === code.trim().toUpperCase()) {
      db.run(`UPDATE users SET kyc_status = 'verified', kyc_code = NULL WHERE id = ?`, [req.user.id], function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: 'Akun berhasil diverifikasi.' });
      });
    } else {
      res.status(400).json({ success: false, error: 'Kode verifikasi tidak valid / salah.' });
    }
  });
});

module.exports = router;