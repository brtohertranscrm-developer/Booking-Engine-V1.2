const express = require('express');
const db = require('../db');
const { verifyAdmin, requirePermission } = require('../middlewares/authMiddleware');
const router = express.Router();

// ==========================================
// HELPER: Promisify DB
// ==========================================
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows || []));
});

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) { err ? reject(err) : resolve({ lastID: this.lastID, changes: this.changes }); });
});

// ==========================================
// INISIALISASI TABEL KEUANGAN (jika belum ada)
// ==========================================
db.serialize(() => {
  // Tabel pengeluaran operasional
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount INTEGER NOT NULL,
      date TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Tabel transaksi POS (manual/tunai)
  db.run(`
    CREATE TABLE IF NOT EXISTS pos_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      item_type TEXT NOT NULL,
      item_name TEXT NOT NULL,
      duration_days INTEGER DEFAULT 1,
      price_per_day INTEGER NOT NULL,
      total_amount INTEGER NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
});

router.use(verifyAdmin);

// ==========================================
// FINANCE SUMMARY — Ringkasan Keuangan
// ==========================================
router.get('/summary', requirePermission('finance'), async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let dateFilter = '';
    if (period === 'today') {
      dateFilter = `AND date(b.created_at) = date('now')`;
    } else if (period === 'week') {
      dateFilter = `AND b.created_at >= datetime('now', '-7 days')`;
    } else if (period === 'month') {
      dateFilter = `AND b.created_at >= datetime('now', '-30 days')`;
    } else if (period === 'year') {
      dateFilter = `AND b.created_at >= datetime('now', '-365 days')`;
    }

    const [revenue, bookingCount, avgValue, expenses, posRevenue] = await Promise.all([
      dbGet(`SELECT COALESCE(SUM(total_price), 0) as total FROM bookings 
             WHERE status != 'cancelled' AND payment_status = 'paid' ${dateFilter}`),
      dbGet(`SELECT COUNT(*) as count FROM bookings 
             WHERE status != 'cancelled' ${dateFilter}`),
      dbGet(`SELECT COALESCE(AVG(total_price), 0) as avg FROM bookings 
             WHERE status != 'cancelled' AND payment_status = 'paid' ${dateFilter}`),
      dbGet(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
             WHERE created_at >= datetime('now', '-30 days')`),
      dbGet(`SELECT COALESCE(SUM(total_amount), 0) as total FROM pos_transactions 
             WHERE created_at >= datetime('now', '-30 days')`)
    ]);

    const grossRevenue = (revenue.total || 0) + (posRevenue.total || 0);
    const netRevenue = grossRevenue - (expenses.total || 0);

    res.json({
      success: true,
      data: {
        gross_revenue: grossRevenue,
        net_revenue: netRevenue,
        total_expenses: expenses.total || 0,
        booking_count: bookingCount.count || 0,
        average_order_value: Math.round(avgValue.avg || 0),
        pos_revenue: posRevenue.total || 0
      }
    });
  } catch (err) {
    console.error('GET /admin/finance/summary error:', err.message);
    res.status(500).json({ success: false, error: 'Gagal mengambil ringkasan keuangan.' });
  }
});

// ==========================================
// DAILY REVENUE CHART — Grafik Pendapatan Harian
// ==========================================
router.get('/daily-revenue', requirePermission('finance'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const limit = Math.min(parseInt(days), 90);

    const rows = await dbAll(`
      SELECT 
        date(created_at) as date,
        COALESCE(SUM(CASE WHEN status != 'cancelled' AND payment_status = 'paid' THEN total_price ELSE 0 END), 0) as revenue,
        COUNT(CASE WHEN status != 'cancelled' THEN 1 END) as bookings
      FROM bookings
      WHERE created_at >= datetime('now', '-${limit} days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `);

    const posRows = await dbAll(`
      SELECT 
        date(created_at) as date,
        COALESCE(SUM(total_amount), 0) as pos_revenue
      FROM pos_transactions
      WHERE created_at >= datetime('now', '-${limit} days')
      GROUP BY date(created_at)
    `);

    // Merge POS dan booking revenue
    const posMap = {};
    posRows.forEach(r => posMap[r.date] = r.pos_revenue);

    const merged = rows.map(r => ({
      date: r.date,
      revenue: (r.revenue || 0) + (posMap[r.date] || 0),
      bookings: r.bookings || 0
    }));

    res.json({ success: true, data: merged });
  } catch (err) {
    console.error('GET /admin/finance/daily-revenue error:', err.message);
    res.status(500).json({ success: false, error: 'Gagal mengambil data grafik.' });
  }
});

// ==========================================
// MONTHLY REVENUE CHART — Per Bulan 12 Bln Terakhir
// ==========================================
router.get('/monthly-revenue', requirePermission('finance'), async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COALESCE(SUM(CASE WHEN status != 'cancelled' AND payment_status = 'paid' THEN total_price ELSE 0 END), 0) as revenue,
        COUNT(CASE WHEN status != 'cancelled' THEN 1 END) as bookings
      FROM bookings
      WHERE created_at >= datetime('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengambil data bulanan.' });
  }
});

// ==========================================
// FLEET PERFORMANCE — Analitik Armada
// ==========================================
router.get('/fleet-performance', requirePermission('finance'), async (req, res) => {
  try {
    const { period = '30' } = req.query;

    const fleetStats = await dbAll(`
      SELECT 
        b.item_name,
        COUNT(*) as total_bookings,
        COALESCE(SUM(b.total_price), 0) as total_revenue,
        COALESCE(AVG(b.total_price), 0) as avg_revenue,
        COALESCE(SUM(
          CAST(
            (julianday(b.end_date) - julianday(b.start_date)) AS INTEGER
          )
        ), 0) as total_days_rented
      FROM bookings b
      WHERE b.item_type = 'motor' 
        AND b.status != 'cancelled'
        AND b.created_at >= datetime('now', '-${parseInt(period)} days')
      GROUP BY b.item_name
      ORDER BY total_bookings DESC
    `);

    // Locker performance
    const lockerStats = await dbAll(`
      SELECT 
        b.item_name,
        COUNT(*) as total_bookings,
        COALESCE(SUM(b.total_price), 0) as total_revenue
      FROM bookings b
      WHERE b.item_type = 'locker'
        AND b.status != 'cancelled'
        AND b.created_at >= datetime('now', '-${parseInt(period)} days')
      GROUP BY b.item_name
      ORDER BY total_bookings DESC
    `);

    res.json({
      success: true,
      data: {
        motors: fleetStats,
        lockers: lockerStats
      }
    });
  } catch (err) {
    console.error('GET /admin/finance/fleet-performance error:', err.message);
    res.status(500).json({ success: false, error: 'Gagal mengambil performa armada.' });
  }
});

// ==========================================
// REVENUE BREAKDOWN — Pecahan per Kategori
// ==========================================
router.get('/breakdown', requirePermission('finance'), async (req, res) => {
  try {
    const byType = await dbAll(`
      SELECT 
        item_type,
        COUNT(*) as count,
        COALESCE(SUM(total_price), 0) as revenue
      FROM bookings
      WHERE status != 'cancelled' AND payment_status = 'paid'
        AND created_at >= datetime('now', '-30 days')
      GROUP BY item_type
    `);

    const byStatus = await dbAll(`
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(total_price), 0) as value
      FROM bookings
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY status
    `);

    res.json({ success: true, data: { by_type: byType, by_status: byStatus } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengambil breakdown.' });
  }
});

// ==========================================
// EXPENSES — Pengeluaran Operasional
// ==========================================
router.get('/expenses', requirePermission('finance'), async (req, res) => {
  try {
    const rows = await dbAll(`SELECT * FROM expenses ORDER BY date DESC LIMIT 100`);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengambil data pengeluaran.' });
  }
});

router.post('/expenses', requirePermission('finance'), async (req, res) => {
  try {
    const { category, description, amount, date } = req.body || {};

    if (!category || !description || !amount || !date) {
      return res.status(400).json({ success: false, error: 'Semua field pengeluaran wajib diisi.' });
    }

    const result = await dbRun(
      `INSERT INTO expenses (category, description, amount, date, created_by) VALUES (?, ?, ?, ?, ?)`,
      [category, description.trim(), parseInt(amount), date, req.user?.id || 'admin']
    );

    res.status(201).json({ success: true, message: 'Pengeluaran berhasil dicatat.', id: result.lastID });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mencatat pengeluaran.' });
  }
});

router.delete('/expenses/:id', requirePermission('finance'), async (req, res) => {
  try {
    await dbRun(`DELETE FROM expenses WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Pengeluaran berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal menghapus pengeluaran.' });
  }
});

// ==========================================
// POS TRANSACTIONS — Transaksi Tunai/Manual
// ==========================================
router.get('/pos', requirePermission('finance'), async (req, res) => {
  try {
    const rows = await dbAll(`SELECT * FROM pos_transactions ORDER BY created_at DESC LIMIT 50`);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengambil transaksi POS.' });
  }
});

router.post('/pos', requirePermission('finance'), async (req, res) => {
  try {
    const { customer_name, customer_phone, item_type, item_name, duration_days, price_per_day, payment_method, notes } = req.body || {};

    if (!customer_name || !item_type || !item_name || !duration_days || !price_per_day) {
      return res.status(400).json({ success: false, error: 'Data transaksi tidak lengkap.' });
    }

    const orderId = `POS-${Date.now()}`;
    const totalAmount = parseInt(price_per_day) * parseInt(duration_days);

    const result = await dbRun(
      `INSERT INTO pos_transactions (order_id, customer_name, customer_phone, item_type, item_name, duration_days, price_per_day, total_amount, payment_method, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, customer_name.trim(), customer_phone || '', item_type, item_name.trim(),
       parseInt(duration_days), parseInt(price_per_day), totalAmount,
       payment_method || 'cash', notes || '', req.user?.id || 'admin']
    );

    res.status(201).json({
      success: true,
      message: 'Transaksi POS berhasil dicatat.',
      data: { id: result.lastID, order_id: orderId, total_amount: totalAmount }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mencatat transaksi POS.' });
  }
});

// ==========================================
// PROFIT & LOSS REPORT
// ==========================================
router.get('/profit-loss', requirePermission('finance'), async (req, res) => {
  try {
    const months = await dbAll(`
      SELECT 
        strftime('%Y-%m', created_at) as period,
        COALESCE(SUM(CASE WHEN status != 'cancelled' AND payment_status = 'paid' THEN total_price ELSE 0 END), 0) as income
      FROM bookings
      WHERE created_at >= datetime('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY period ASC
    `);

    const expenseMonths = await dbAll(`
      SELECT 
        strftime('%Y-%m', date) as period,
        COALESCE(SUM(amount), 0) as expenses
      FROM expenses
      WHERE date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY period ASC
    `);

    const expenseMap = {};
    expenseMonths.forEach(e => expenseMap[e.period] = e.expenses);

    const report = months.map(m => ({
      period: m.period,
      income: m.income,
      expenses: expenseMap[m.period] || 0,
      profit: m.income - (expenseMap[m.period] || 0)
    }));

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengambil laporan P&L.' });
  }
});

// ==========================================
// ACCOUNTS RECEIVABLE — Tagihan Belum Lunas
// ==========================================
router.get('/receivables', requirePermission('finance'), async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT b.*, u.name as user_name, u.phone as user_phone, u.email as user_email
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.payment_status = 'unpaid' AND b.status != 'cancelled'
      ORDER BY b.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengambil data piutang.' });
  }
});

module.exports = router;
