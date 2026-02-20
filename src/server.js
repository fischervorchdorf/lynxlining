require('dotenv').config();
const express = require('express');
const nunjucks = require('nunjucks');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const { i18n } = require('./middleware/i18n');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (Coolify/nginx Reverse Proxy)
app.set('trust proxy', 1);

// Security & compression
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session-Konfiguration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'lynxlining-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Coolify terminiert SSL am Proxy, intern ist HTTP
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 Stunden
    sameSite: 'lax'
  }
};

app.use(session(sessionConfig));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Nunjucks Template Engine
const env = nunjucks.configure(path.join(__dirname, 'views'), {
  autoescape: true,
  express: app,
  watch: process.env.NODE_ENV !== 'production',
  noCache: process.env.NODE_ENV !== 'production'
});

// Custom Nunjucks Filters
env.addFilter('formatDate', function(dateStr, locale) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr).substring(0, 10);
  const months = locale === 'de'
    ? ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return d.getDate() + '. ' + months[d.getMonth()] + ' ' + d.getFullYear();
});

env.addFilter('nl2br', function(str) {
  if (!str) return '';
  return str.replace(/\n/g, '<br>\n');
});

// i18n middleware
app.use(i18n);

// Global template variables
app.use((req, res, next) => {
  res.locals.currentYear = new Date().getFullYear();
  res.locals.currentPath = req.path;
  res.locals.session = req.session || {};
  next();
});

// Routes
const publicRoutes = require('./routes/index');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

app.use('/', publicRoutes);
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render('pages/404.njk', {
    title: '404 - Seite nicht gefunden'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/error.njk', {
    title: 'Fehler',
    error: process.env.NODE_ENV !== 'production' ? err.message : 'Ein Fehler ist aufgetreten.'
  });
});

// Auto-Migration: fehlende Tabellen/Spalten beim Start anlegen
async function runMigrations() {
  try {
    // LinkedIn-Tabellen erstellen falls nicht vorhanden
    await db.query(`
      CREATE TABLE IF NOT EXISTS linkedin_posts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        slug VARCHAR(100),
        linkedin_url VARCHAR(500) NOT NULL,
        image_path VARCHAR(500),
        author_name VARCHAR(255) DEFAULT 'Martin F. Heidecker',
        published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_visible BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_visible (is_visible),
        INDEX idx_published (published_at DESC)
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS linkedin_post_translations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        linkedin_post_id INT NOT NULL,
        locale ENUM('de', 'en') NOT NULL,
        title VARCHAR(255) NOT NULL,
        excerpt TEXT,
        content LONGTEXT,
        FOREIGN KEY (linkedin_post_id) REFERENCES linkedin_posts(id) ON DELETE CASCADE,
        UNIQUE KEY uq_linkedin_locale (linkedin_post_id, locale)
      )
    `);

    // Slug-Spalte nachrüsten falls fehlend
    const [cols] = await db.query("SHOW COLUMNS FROM linkedin_posts LIKE 'slug'");
    if (!cols.length) {
      await db.query('ALTER TABLE linkedin_posts ADD COLUMN slug VARCHAR(100) AFTER id');
    }

    // Content-Spalte nachrüsten falls fehlend
    const [contentCols] = await db.query("SHOW COLUMNS FROM linkedin_post_translations LIKE 'content'");
    if (!contentCols.length) {
      await db.query('ALTER TABLE linkedin_post_translations ADD COLUMN content LONGTEXT AFTER excerpt');
    }

    console.log('✓ DB-Migrationen erfolgreich');
  } catch (err) {
    console.warn('DB-Migration Warnung:', err.message);
  }
}

runMigrations();

app.listen(PORT, () => {
  console.log(`LYNX Lining Server läuft auf http://localhost:${PORT}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`DB_HOST: ${process.env.DB_HOST || 'nicht gesetzt'}`);

  // Instagram Sync
  if (process.env.INSTAGRAM_ACCESS_TOKEN) {
    const { syncInstagramPosts, refreshToken } = require('./config/instagram');

    setTimeout(() => {
      syncInstagramPosts().then(r => console.log('Instagram initialer Sync:', r));
    }, 10000);

    setInterval(() => {
      syncInstagramPosts().catch(err => console.error('Instagram Sync Fehler:', err));
    }, 30 * 60 * 1000);

    setInterval(() => {
      refreshToken().catch(err => console.error('Instagram Token Refresh Fehler:', err));
    }, 24 * 60 * 60 * 1000);
  }
});
