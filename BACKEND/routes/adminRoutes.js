const express = require('express');
const db = require('../db');
const { verifyAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

// Semua route di sini otomatis menggunakan verifyAdmin
router.use(verifyAdmin);

router.get('/stats', (req, res) => {
  const stats = { revenue: 0, activeMotors: 0, activeLockers: 0, pendingKyc: 0 };
  let done = 0;
  const check = () => { done++; if (done === 4) res.json({ success: true, data: stats }); };

  db.get(`SELECT SUM(total_price) as total FROM bookings WHERE status != 'cancelled'`, (err, row) => { stats.revenue = row?.total || 0; check(); });
  db.get(`SELECT COUNT(*) as count FROM bookings WHERE item_type = 'motor' AND status = 'active'`, (err, row) => { stats.activeMotors = row?.count || 0; check(); });
  db.get(`SELECT COUNT(*) as count FROM lockers WHERE status = 'occupied'`, (err, row) => { stats.activeLockers = row?.count || 0; check(); });
  db.get(`SELECT COUNT(*) as count FROM users WHERE kyc_status = 'pending'`, (err, row) => { stats.pendingKyc = row?.count || 0; check(); });
});

// ==========================================
// KYC MANAGEMENT
// ==========================================
router.get('/kyc', (req, res) => {
  db.all(`SELECT id, name, email, phone, kyc_status, kyc_code, miles FROM users ORDER BY join_date DESC`, (err, rows) => res.json({ success: true, data: rows }));
});

router.post('/kyc/:id/code', (req, res) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let newCode = 'BT-';
  for (let i = 0; i < 6; i++) newCode += chars.charAt(Math.floor(Math.random() * chars.length));
  db.run(`UPDATE users SET kyc_code = ? WHERE id = ?`, [newCode, req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, code: newCode });
  });
});

router.put('/kyc/:id', (req, res) => {
  const { status } = req.body;
  const query = status === 'rejected' ? `UPDATE users SET kyc_status = ?, kyc_code = NULL WHERE id = ?` : `UPDATE users SET kyc_status = ? WHERE id = ?`;
  db.run(query, [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: `Status KYC berhasil diubah menjadi ${status}` });
  });
});

// ==========================================
// ARMADA MOTOR & WHITELIST DYNAMIC PRICING
// ==========================================
router.get('/motors', (req, res) => { 
  const query = `
    SELECT m.*, 
           (SELECT COUNT(*) FROM motor_units mu WHERE mu.motor_id = m.id AND mu.status = 'RDY') as active_stock,
           (SELECT COUNT(*) FROM motor_units mu WHERE mu.motor_id = m.id) as total_units
    FROM motors m 
    ORDER BY m.id DESC
  `;
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    const formattedData = rows.map(r => ({ ...r, stock: r.active_stock }));
    res.json({ success: true, data: formattedData });
  });
});

router.post('/motors', (req, res) => {
  const { name, category, location, price_12h, base_price, image_url, allow_dynamic_pricing } = req.body;
  // Paksa konversi ke integer 0 atau 1
  const isDynamic = (allow_dynamic_pricing === false || allow_dynamic_pricing === 0 || allow_dynamic_pricing === '0') ? 0 : 1;
  
  const query = `INSERT INTO motors (name, category, location, price_12h, base_price, stock, image_url, allow_dynamic_pricing) VALUES (?, ?, ?, ?, ?, 0, ?, ?)`;
  db.run(query, [name, category, location, price_12h, base_price, image_url, isDynamic], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Katalog Motor ditambahkan', id: this.lastID });
  });
});

router.put('/motors/:id', (req, res) => {
  const { name, category, location, price_12h, base_price, image_url, allow_dynamic_pricing } = req.body;
  // Paksa konversi ke integer 0 atau 1
  const isDynamic = (allow_dynamic_pricing === false || allow_dynamic_pricing === 0 || allow_dynamic_pricing === '0') ? 0 : 1;

  const query = `UPDATE motors SET name=?, category=?, location=?, price_12h=?, base_price=?, image_url=?, allow_dynamic_pricing=? WHERE id=?`;
  db.run(query, [name, category, location, price_12h, base_price, image_url, isDynamic, req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Data Katalog diupdate' });
  });
});

router.delete('/motors/:id', (req, res) => {
  db.run('DELETE FROM motor_units WHERE motor_id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    db.run('DELETE FROM motors WHERE id=?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Motor beserta semua plat nomornya berhasil dihapus' });
    });
  });
});

// ==========================================
// UNIT PLAT NOMOR
// ==========================================
router.get('/motors/:id/units', (req, res) => {
  db.all('SELECT * FROM motor_units WHERE motor_id = ? ORDER BY id DESC', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows });
  });
});

router.post('/motors/:id/units', (req, res) => {
  const { plate_number, status, condition_notes } = req.body;
  const query = `INSERT INTO motor_units (motor_id, plate_number, status, condition_notes) VALUES (?, ?, ?, ?)`;
  db.run(query, [req.params.id, plate_number, status || 'RDY', condition_notes], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Unit Plat Nomor ditambahkan', id: this.lastID });
  });
});

router.put('/units/:unitId', (req, res) => {
  const { plate_number, status, condition_notes } = req.body;
  const query = `UPDATE motor_units SET plate_number=?, status=?, condition_notes=? WHERE id=?`;
  db.run(query, [plate_number, status, condition_notes, req.params.unitId], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Status Unit berhasil diupdate' });
  });
});

router.delete('/units/:unitId', (req, res) => {
  db.run('DELETE FROM motor_units WHERE id=?', [req.params.unitId], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Unit berhasil dihapus' });
  });
});

// ==========================================
// TRANSAKSI & BOOKING MANAGEMENT
// ==========================================
router.get('/bookings', (req, res) => {
  const query = `
    SELECT b.*, u.name as user_name, u.phone as user_phone 
    FROM bookings b 
    LEFT JOIN users u ON b.user_id = u.id 
    ORDER BY b.start_date DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows || [] });
  });
});

router.put('/bookings/:orderId/status', (req, res) => {
  const { status, payment_status, unit_id, plate_number } = req.body;
  
  let query = `UPDATE bookings SET status = ?`;
  let params = [status];

  if (payment_status) { query += `, payment_status = ?`; params.push(payment_status); }
  if (unit_id) { query += `, unit_id = ?`; params.push(unit_id); }
  if (plate_number) { query += `, plate_number = ?`; params.push(plate_number); }
  
  query += ` WHERE order_id = ?`;
  params.push(req.params.orderId);

  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Status transaksi berhasil diupdate' });
  });
});

// ==========================================
// DYNAMIC PRICING MANAGEMENT
// ==========================================

// Ambil konfigurasi Surge Pricing saat ini
router.get('/pricing/surge', (req, res) => {
  db.get(`SELECT * FROM price_rules WHERE rule_type = 'surge'`, (err, row) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: row });
  });
});

// Simpan/Update konfigurasi Surge Pricing
router.put('/pricing/surge', (req, res) => {
  const { is_active, markup_percentage, stock_condition } = req.body;
  const isActiveInt = is_active ? 1 : 0;

  // Cek apakah baris pengaturan surge sudah ada di database
  db.get(`SELECT id FROM price_rules WHERE rule_type = 'surge'`, (err, row) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    if (row) {
      // Jika sudah ada, UPDATE datanya
      db.run(`UPDATE price_rules SET is_active = ?, markup_percentage = ?, stock_condition = ? WHERE rule_type = 'surge'`,
        [isActiveInt, markup_percentage, stock_condition], function(err) {
          if (err) return res.status(500).json({ success: false, error: err.message });
          res.json({ success: true, message: 'Surge pricing berhasil diupdate' });
      });
    } else {
      // Jika belum ada sama sekali, buat baru (INSERT)
      db.run(`INSERT INTO price_rules (rule_type, name, is_active, markup_percentage, stock_condition) VALUES ('surge', 'Surge Pricing', ?, ?, ?)`,
        [isActiveInt, markup_percentage, stock_condition], function(err) {
          if (err) return res.status(500).json({ success: false, error: err.message });
          res.json({ success: true, message: 'Surge pricing berhasil dibuat' });
      });
    }
  });
});

// ==========================================
// SEASONAL PRICING MANAGEMENT
// ==========================================

// Ambil data Kalender Event/Seasonal
router.get('/pricing/seasonal', (req, res) => {
  db.all(`SELECT * FROM price_rules WHERE rule_type = 'seasonal'`, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows || [] });
  });
});

// Simpan/Update Kalender Event secara massal (Bulk Replace)
router.post('/pricing/seasonal', (req, res) => {
  const { rules } = req.body;
  
  // Hapus semua data seasonal lama untuk di-replace dengan yang baru
  db.run(`DELETE FROM price_rules WHERE rule_type = 'seasonal'`, (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    
    // Jika rules kosong (admin menghapus semua event)
    if (!rules || rules.length === 0) {
      return res.json({ success: true, message: 'Semua event seasonal berhasil dikosongkan' });
    }

    // Susun data baru untuk dimasukkan ke database
    const placeholders = rules.map(() => `('seasonal', ?, ?, ?, ?)`).join(',');
    const values = [];
    rules.forEach(rule => {
      values.push(rule.name, rule.startDate, rule.endDate, rule.markup);
    });

    db.run(
      `INSERT INTO price_rules (rule_type, name, start_date, end_date, markup_percentage) VALUES ${placeholders}`, 
      values, 
      function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: 'Kalender Event berhasil disimpan permanen' });
      }
    );
  });
});

router.post('/pricing/surge', (req, res) => {
  const { is_active, markup_percentage } = req.body; // Ambil nilai dari frontend
  
  // Amankan tipe data, paksa menjadi 1 atau 0 bagaimanapun bentuk kiriman frontend
  const statusInt = (is_active === 1 || is_active === true || is_active === '1') ? 1 : 0;

  // Update ke SQLite (Sesuaikan query di bawah dengan nama tabel dan field yang Anda gunakan)
  db.run(
    `UPDATE price_rules SET is_active = ?, markup_percentage = ? WHERE rule_type = 'surge'`,
    [statusInt, markup_percentage],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, message: 'Status algoritma berhasil disimpan!', is_active: statusInt });
    }
  );
});

module.exports = router;