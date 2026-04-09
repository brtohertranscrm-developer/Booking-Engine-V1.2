const jwt = require('jsonwebtoken');
require('dotenv').config();

// Gunakan JWT_SECRET yang sama dengan yang ada di server/authRoutes
const JWT_SECRET = process.env.JWT_SECRET || 'brother_trans_secret_key_2026';

const verifyUser = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ success: false, error: 'Akses ditolak, token tidak ada.' });
  
  try {
    const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Token tidak valid atau kadaluarsa.' });
  }
};

const verifyAdmin = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ success: false, error: 'Akses ditolak, token tidak ada.' });
  
  try {
    const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
    // Izinkan jika role adalah admin, superadmin, atau subadmin
    if (decoded.role !== 'admin' && decoded.role !== 'superadmin' && decoded.role !== 'subadmin') {
        return res.status(401).json({ success: false, error: 'Akses ditolak. Anda bukan Admin.' });
    }
    req.user = decoded; 
    next(); 
  } catch (err) {
    res.status(401).json({ success: false, error: 'Token admin tidak valid.' });
  }
};

// MIDDLEWARE BARU: Cek Izin Spesifik untuk fitur Role-Based Access Control
const requirePermission = (menuKey) => {
  return (req, res, next) => {
    // 1. Superadmin atau Admin utama bebas akses semua fitur
    if (req.user.role === 'superadmin' || req.user.role === 'admin') {
      return next();
    }

    // 2. Jika Sub-Admin, parse array permissions dari string JSON
    let userPermissions = [];
    try {
      userPermissions = typeof req.user.permissions === 'string' 
        ? JSON.parse(req.user.permissions) 
        : (req.user.permissions || []);
    } catch (e) {
      userPermissions = [];
    }

    // 3. Cek apakah user punya checklist akses ke menu tersebut
    if (userPermissions.includes(menuKey)) {
      return next();
    }

    // 4. Jika tidak punya, tolak akses
    return res.status(403).json({ 
      success: false, 
      error: 'Forbidden: Anda tidak memiliki akses ke fitur ini.' 
    });
  };
};

// PASTIKAN requirePermission DI-EKSPORT DI SINI
module.exports = { 
  verifyUser, 
  verifyAdmin, 
  requirePermission 
};