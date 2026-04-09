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
           profile_picture, profile_banner, referral_code, role, location, has_completed_tc_gamification 
    FROM users WHERE id = ?`;

  db.get(query, [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    
    db.get(`SELECT order_id as id, item_name as item, status, location, start_date as startDate, end_date as endDate, total_price FROM bookings WHERE user_id = ? AND status IN ('pending', 'active') LIMIT 1`, 
    [req.user.id], (err, order) => {
      res.json({ success: true, data: { user, activeOrder: order || null } });
    });
  });
});

// ==========================================
// 2. UPDATE PROFILE USER (NAMA, PHONE, LOKASI)
// ==========================================
router.put('/profile', (req, res) => {
  const { name, phone, location } = req.body; 
  
  db.run(
    `UPDATE users SET name = ?, phone = ?, location = ? WHERE id = ?`,
    [name, phone, location || 'Lainnya', req.user.id],
    function (err) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Profil berhasil diupdate!' });
    }
  );
});

// ==========================================
// 3. GET TOP TRAVELLERS
// ==========================================
router.get('/dashboard/top-travellers', (req, res) => {
  db.all(`SELECT name, miles FROM users WHERE miles > 0 ORDER BY miles DESC LIMIT 3`, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows || [] });
  });
});

// ==========================================
// 4. SUPPORT TICKETS
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
// 5. BOOKINGS
// ==========================================
router.post('/bookings', (req, res) => {
  const { order_id, item_type, item_name, location, start_date, end_date, total_price } = req.body;

  db.get(`SELECT kyc_status FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    
    if (!user || user.kyc_status !== 'verified') {
      return res.status(403).json({ 
        success: false, 
        error: 'Akses ditolak. Anda harus melakukan verifikasi data (KYC) terlebih dahulu sebelum membuat pesanan.' 
      });
    }

    db.run(`INSERT INTO bookings (order_id, user_id, item_type, item_name, location, start_date, end_date, total_price, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 'paid')`,
      [order_id, req.user.id, item_type, item_name, location, start_date, end_date, total_price], (err) => {
        if(err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
      });
  });
});

// ==========================================
// 6. KYC (KNOW YOUR CUSTOMER)
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

// ==========================================
// 7. EXTEND BOOKING (PERPANJANG SEWA)
// ==========================================
router.put('/bookings/:orderId/extend', (req, res) => {
  const { additional_days } = req.body;
  const orderId = req.params.orderId;

  db.get(`SELECT start_date, end_date, total_price FROM bookings WHERE order_id = ? AND user_id = ?`, [orderId, req.user.id], (err, booking) => {
    if (err || !booking) return res.status(500).json({ success: false, error: 'Pesanan tidak ditemukan' });

    const start = new Date(booking.start_date);
    const currentEnd = new Date(booking.end_date);
    const currentDays = Math.max(1, Math.ceil((currentEnd - start) / (1000 * 60 * 60 * 24)));
    const pricePerDay = Math.round(booking.total_price / currentDays);
    const extraCost = parseInt(additional_days) * pricePerDay;

    currentEnd.setDate(currentEnd.getDate() + parseInt(additional_days));
    const newEndDate = currentEnd.toISOString().split('T')[0];

    db.run(
      `UPDATE bookings SET end_date = ?, total_price = total_price + ?, payment_status = 'unpaid' WHERE order_id = ?`,
      [newEndDate, extraCost, orderId],
      function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, new_end_date: newEndDate, extra_cost: extraCost });
      }
    );
  });
});

// ==========================================
// 8. CLAIM GAMIFICATION MILES (T&C)
// ==========================================
router.post('/claim-tc-miles', (req, res) => {
  const userId = req.user.id;

  // 1. Cek User di Database
  db.get(`SELECT miles, has_completed_tc_gamification FROM users WHERE id = ?`, [userId], (err, user) => {
    if (err) {
      if (err.message.includes("no such column: has_completed_tc_gamification")) {
        return res.status(500).json({ 
          success: false, 
          message: "Database butuh update. Kolom has_completed_tc_gamification belum ada." 
        });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
    
    if (!user) return res.status(404).json({ success: false, message: "User tidak ditemukan." });

    // 2. Cegah kecurangan: Cek apakah user sudah pernah klaim
    if (user.has_completed_tc_gamification === 1 || user.has_completed_tc_gamification === 'true') {
      return res.status(400).json({ success: false, message: "Anda sudah mengklaim hadiah misi ini sebelumnya." });
    }

    // 3. Tambahkan 500 Miles dan tandai misi selesai
    db.run(
      `UPDATE users SET miles = COALESCE(miles, 0) + 500, has_completed_tc_gamification = 1 WHERE id = ?`, 
      [userId], 
      function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        
        res.status(200).json({ 
          success: true, 
          message: "500 Miles berhasil ditambahkan!",
          miles: (user.miles || 0) + 500
        });
      }
    );
  });
});

module.exports = router;