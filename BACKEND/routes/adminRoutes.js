const express = require('express');
const db = require('../db');
const { verifyAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Konfigurasi penyimpanan file dengan Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Simpan di folder uploads
  },
  filename: function (req, file, cb) {
    // Format nama: artikel-1698765432.jpg
    cb(null, 'artikel-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

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

// 1. GET ALL BOOKINGS (Untuk tabel di Dashboard)
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

// 2. GET 1 BOOKING DETAIL (Untuk Halaman Invoice)
router.get('/bookings/:orderId', (req, res) => {
  const query = `
    SELECT b.*, u.name as user_name, u.email as user_email, u.phone as user_phone 
    FROM bookings b 
    LEFT JOIN users u ON b.user_id = u.id 
    WHERE b.order_id = ?
  `;
  
  db.get(query, [req.params.orderId], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!row) {
      // Penting: Kembalikan JSON 404 agar React tidak error
      return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
    }
    
    res.json({ success: true, data: row });
  });
});

// 3. UPDATE BOOKING STATUS
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

    // ===========================================================
    // UPDATE MILES LOGIC (Trigger jika status "completed")
    // ===========================================================
    if (status && (status.toLowerCase() === 'completed' || status.toLowerCase() === 'selesai')) {
      db.get(`SELECT user_id, total_price FROM bookings WHERE order_id = ?`, [req.params.orderId], (err, booking) => {
        if (!err && booking) {
          // Asumsi: Setiap Rp 10.000 = 1 Mile
          const earnedMiles = Math.floor(booking.total_price / 10000); 
          
          db.run(
            `UPDATE users SET miles = miles + ? WHERE id = ?`,
            [earnedMiles, booking.user_id],
            (updateErr) => {
              if (updateErr) console.error("❌ Gagal menambahkan miles:", updateErr.message);
              else console.log(`✅ Berhasil menambahkan ${earnedMiles} miles ke akun ${booking.user_id}`);
            }
          );
        }
      });
    }
    // ===========================================================

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

// ==========================================
// KODE PROMO MANAGEMENT
// ==========================================

// 1. GET ALL PROMOS
router.get('/promos', (req, res) => {
  // MENGGUNAKAN TABEL "promotions"
  db.all(`SELECT * FROM promotions ORDER BY id DESC`, [], (err, rows) => {
    if (err) {
      if (err.message.includes("no such table")) {
        return res.json({ success: true, data: [] });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, data: rows || [] });
  });
});

// 2. CREATE NEW PROMO (DENGAN LIMIT PENGGUNAAN)
router.post('/promos', (req, res) => {
  const { code, discount_percent, max_discount, usage_limit } = req.body;
  
  // Default title dan image agar tidak error NOT NULL
  db.run(
    `INSERT INTO promotions (title, code, image, discount_percent, max_discount, usage_limit, current_usage, is_active) 
     VALUES (?, ?, ?, ?, ?, ?, 0, 1)`,
    ['Promo Spesial', code, 'default-promo.jpg', discount_percent, max_discount, usage_limit || 0],
    function(err) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Promo berhasil ditambahkan', id: this.lastID });
    }
  );
});

// 3. TOGGLE PROMO STATUS
router.put('/promos/:id/toggle', (req, res) => {
  const { is_active } = req.body;
  db.run(
    `UPDATE promotions SET is_active = ? WHERE id = ?`,
    [is_active, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Status promo berhasil diupdate' });
    }
  );
});

// ==========================================
// ENDPOINT UNTUK UPDATE PROMO (EDIT)
// ==========================================
router.put('/promos/:id', (req, res) => {
  const { code, discount_percent, max_discount, usage_limit } = req.body;
  
  // Menggunakan tabel 'promotions' sesuai database Anda
  db.run(
    `UPDATE promotions SET code = ?, discount_percent = ?, max_discount = ?, usage_limit = ? WHERE id = ?`,
    [code, discount_percent, max_discount, usage_limit, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Promo berhasil diperbarui' });
    }
  );
});

// ==========================================
// ENDPOINT UNTUK HAPUS PROMO (DELETE)
// ==========================================
router.delete('/promos/:id', (req, res) => {
  // Menggunakan tabel 'promotions' sesuai database Anda
  db.run(
    `DELETE FROM promotions WHERE id = ?`, 
    [req.params.id],
    function(err) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Promo berhasil dihapus' });
    }
  );
});

// ==========================================
// ARTIKEL MANAGEMENT (SEO & GEO)
// ==========================================

// 1. GET ALL ARTICLES
router.get('/articles', (req, res) => {
  db.all(`SELECT * FROM articles ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows || [] });
  });
});

// 2. CREATE NEW ARTICLE
router.post('/articles', (req, res) => {
  const { title, slug, category, image_url, content, status, meta_title, meta_desc, geo_location, scheduled_at } = req.body;
  
  const query = `
    INSERT INTO articles 
    (title, slug, category, image_url, content, status, meta_title, meta_desc, geo_location, scheduled_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [title, slug, category, image_url, content, status, meta_title, meta_desc, geo_location, scheduled_at], function(err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ success: false, error: "Slug URL sudah digunakan, mohon gunakan slug lain." });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: 'Artikel berhasil ditambahkan', id: this.lastID });
  });
});

// 3. UPDATE ARTICLE
router.put('/articles/:id', (req, res) => {
  const { title, slug, category, image_url, content, status, meta_title, meta_desc, geo_location, scheduled_at } = req.body;
  
  const query = `
    UPDATE articles 
    SET title=?, slug=?, category=?, image_url=?, content=?, status=?, meta_title=?, meta_desc=?, geo_location=?, scheduled_at=? 
    WHERE id=?
  `;
  
  db.run(query, [title, slug, category, image_url, content, status, meta_title, meta_desc, geo_location, scheduled_at, req.params.id], function(err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ success: false, error: "Slug URL sudah digunakan, mohon gunakan slug lain." });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: 'Artikel berhasil diperbarui' });
  });
});

// 4. DELETE ARTICLE
router.delete('/articles/:id', (req, res) => {
  db.run(`DELETE FROM articles WHERE id=?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Artikel berhasil dihapus' });
  });
});

// ==========================================
// ENDPOINT UPLOAD GAMBAR
// ==========================================
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
  }
  
  // Buat URL lengkap untuk diakses frontend (contoh: http://localhost:5001/uploads/artikel-123.jpg)
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

module.exports = router;