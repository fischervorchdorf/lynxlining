const db = require('../config/database');

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/admin/login');
}

// Nur für Benutzer mit Rolle "admin". Die Rolle wird live aus der DB gelesen,
// damit ein Entzug der Adminrechte sofort greift (nicht erst nach neuem Login).
async function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) return res.redirect('/admin/login');
  try {
    const [rows] = await db.query('SELECT role FROM users WHERE id = ?', [req.session.userId]);
    if (!rows.length) {
      req.session.destroy(() => {});
      return res.redirect('/admin/login');
    }
    req.session.role = rows[0].role;
    if (rows[0].role === 'admin') return next();
    res.status(403).render('admin/forbidden.njk', { title: 'Kein Zugriff', adminPage: 'benutzer' });
  } catch (err) {
    console.error('Rollenprüfung fehlgeschlagen:', err);
    res.status(500).send('Fehler bei der Rechteprüfung');
  }
}

module.exports = { requireAuth, requireAdmin };
