require('dotenv').config();
const express = require('express');
const nunjucks = require('nunjucks');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const { i18n } = require('./middleware/i18n');
const analyticsMiddleware = require('./middleware/analytics');
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
const SITE_URL = (process.env.SITE_URL || 'https://www.lynx-lining.com').replace(/\/$/, '');
app.use((req, res, next) => {
  res.locals.currentYear = new Date().getFullYear();
  res.locals.currentPath = req.path;
  res.locals.session = req.session || {};
  res.locals.siteUrl = SITE_URL;
  res.locals.canonicalUrl = SITE_URL + req.originalUrl.split('?')[0];
  next();
});

// Analytics Tracking (vor Routes, nach Session)
app.use(analyticsMiddleware);

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

    // Shop-Produkte: Neue Spalten für Rollendaten und Preis auf Anfrage
    const shopNewCols = [
      { name: 'price_on_request', sql: 'ADD COLUMN price_on_request BOOLEAN DEFAULT FALSE AFTER is_active' },
      { name: 'price_per_sqm', sql: 'ADD COLUMN price_per_sqm DECIMAL(10,2) DEFAULT NULL AFTER price_on_request' },
      { name: 'sqm_per_roll', sql: 'ADD COLUMN sqm_per_roll DECIMAL(10,2) DEFAULT NULL AFTER price_per_sqm' },
      { name: 'roll_length_lfm', sql: 'ADD COLUMN roll_length_lfm DECIMAL(10,2) DEFAULT NULL AFTER sqm_per_roll' },
      { name: 'roll_width_mm', sql: 'ADD COLUMN roll_width_mm INT DEFAULT NULL AFTER roll_length_lfm' },
      { name: 'roll_weight_kg', sql: 'ADD COLUMN roll_weight_kg DECIMAL(10,2) DEFAULT NULL AFTER roll_width_mm' },
      { name: 'roll_outer_diameter_mm', sql: 'ADD COLUMN roll_outer_diameter_mm INT DEFAULT NULL AFTER roll_weight_kg' },
      { name: 'roll_core_diameter_mm', sql: 'ADD COLUMN roll_core_diameter_mm INT DEFAULT NULL AFTER roll_outer_diameter_mm' },
      { name: 'roll_core_width_mm', sql: 'ADD COLUMN roll_core_width_mm INT DEFAULT NULL AFTER roll_core_diameter_mm' }
    ];
    for (const col of shopNewCols) {
      const [exists] = await db.query(`SHOW COLUMNS FROM shop_products LIKE '${col.name}'`);
      if (!exists.length) {
        await db.query(`ALTER TABLE shop_products ${col.sql}`);
      }
    }

    // Shop-Anfragen Tabelle (Preisanfragen für Comfort/Ultra)
    await db.query(`
      CREATE TABLE IF NOT EXISTS shop_inquiries (
        id INT PRIMARY KEY AUTO_INCREMENT,
        product_name VARCHAR(255) NOT NULL,
        quantity_lfm VARCHAR(100) DEFAULT NULL,
        quantity_sqm VARCHAR(100) DEFAULT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_company VARCHAR(255) DEFAULT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(100) DEFAULT NULL,
        message TEXT DEFAULT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_read (is_read),
        INDEX idx_created (created_at DESC)
      )
    `);

    // Analytics: page_views Tabelle
    await db.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        path VARCHAR(500) NOT NULL,
        method VARCHAR(10) DEFAULT 'GET',
        status_code INT,
        country VARCHAR(100),
        city VARCHAR(200),
        device_type ENUM('desktop','tablet','mobile') DEFAULT 'desktop',
        browser VARCHAR(100),
        os VARCHAR(100),
        referrer VARCHAR(1000),
        language VARCHAR(10),
        session_id VARCHAR(255),
        ip_hash VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at),
        INDEX idx_path (path(191)),
        INDEX idx_country (country)
      )
    `);

    // ===== DUPLIKAT-BEREINIGUNG & UNIQUE KEYS =====
    // Ohne UNIQUE KEY funktioniert ON DUPLICATE KEY UPDATE nicht!
    // Strategie: Alle Duplikate + verwaiste Daten löschen, dann UNIQUE KEY anlegen, dann Seed füllt alles korrekt

    const mainTables = [
      { table: 'products', transTable: 'product_translations', fkCol: 'product_id' },
      { table: 'advantages', transTable: 'advantage_translations', fkCol: 'advantage_id' },
      { table: 'applications', transTable: 'application_translations', fkCol: 'application_id' }
    ];

    for (const { table, transTable, fkCol } of mainTables) {
      // 1. UNIQUE KEY auf slug (Haupttabelle)
      try {
        const [keys] = await db.query(`SHOW INDEX FROM ${table} WHERE Key_name = 'uq_slug'`);
        if (!keys.length) {
          console.log(`Bereinige Duplikate in ${table}...`);

          // Für jeden slug: behalte die ID die Übersetzungen hat, sonst die niedrigste
          const [dupes] = await db.query(`
            SELECT slug, COUNT(*) as cnt FROM ${table} GROUP BY slug HAVING cnt > 1
          `);

          for (const dupe of dupes) {
            // Finde alle IDs für diesen slug
            const [rows] = await db.query(`SELECT id FROM ${table} WHERE slug = ? ORDER BY id`, [dupe.slug]);

            // Finde welche ID Übersetzungen hat
            const [withTrans] = await db.query(`
              SELECT DISTINCT ${fkCol} as pid FROM ${transTable}
              WHERE ${fkCol} IN (${rows.map(r => r.id).join(',')}) AND title IS NOT NULL AND title != ''
            `);

            // Behalte die ID mit Übersetzungen, oder die letzte (neueste)
            const keepId = withTrans.length > 0 ? withTrans[0].pid : rows[rows.length - 1].id;
            const deleteIds = rows.filter(r => r.id !== keepId).map(r => r.id);

            if (deleteIds.length > 0) {
              // Übersetzungen der zu löschenden IDs entfernen
              await db.query(`DELETE FROM ${transTable} WHERE ${fkCol} IN (${deleteIds.join(',')})`);
              // Duplikat-Zeilen entfernen
              await db.query(`DELETE FROM ${table} WHERE id IN (${deleteIds.join(',')})`);
              console.log(`  ${table}: slug="${dupe.slug}" - behalte ID ${keepId}, lösche IDs ${deleteIds.join(',')}`);
            }
          }

          await db.query(`ALTER TABLE ${table} ADD UNIQUE KEY uq_slug (slug)`);
          console.log(`✓ UNIQUE KEY (slug) für ${table} angelegt`);
        }
      } catch (e) {
        console.warn(`${table} UNIQUE KEY:`, e.message);
      }

      // 2. UNIQUE KEY auf (parent_id, locale) (Übersetzungstabelle)
      try {
        const keyName = `uq_${fkCol.replace('_id', '')}_locale`;
        const [keys] = await db.query(`SHOW INDEX FROM ${transTable} WHERE Key_name = '${keyName}'`);
        if (!keys.length) {
          // Duplikate entfernen - behalte die Zeile MIT Inhalt (höchste ID = neueste Seed-Daten)
          await db.query(`
            DELETE t1 FROM ${transTable} t1
            INNER JOIN ${transTable} t2
            WHERE t1.id < t2.id AND t1.${fkCol} = t2.${fkCol} AND t1.locale = t2.locale
          `);
          await db.query(`ALTER TABLE ${transTable} ADD UNIQUE KEY ${keyName} (${fkCol}, locale)`);
          console.log(`✓ UNIQUE KEY für ${transTable} angelegt`);
        }
      } catch (e) {
        console.warn(`${transTable} UNIQUE KEY:`, e.message);
      }
    }

    // 3. Verwaiste Einträge ohne Übersetzungen entfernen (werden vom Seed neu angelegt)
    for (const { table, transTable, fkCol } of mainTables) {
      try {
        const [orphans] = await db.query(`
          SELECT t.id, t.slug FROM ${table} t
          LEFT JOIN ${transTable} tt ON t.id = tt.${fkCol}
          WHERE tt.id IS NULL
        `);
        if (orphans.length > 0) {
          await db.query(`DELETE FROM ${table} WHERE id IN (${orphans.map(o => o.id).join(',')})`);
          console.log(`✓ ${orphans.length} verwaiste Einträge aus ${table} entfernt: ${orphans.map(o => o.slug).join(', ')}`);
        }
      } catch (e) {
        console.warn(`Orphan cleanup ${table}:`, e.message);
      }
    }

    console.log('✓ DB-Migrationen erfolgreich');
  } catch (err) {
    console.warn('DB-Migration Warnung:', err.message);
  }
}

runMigrations().then(async () => {
  // Seed nach Migrationen ausführen (idempotent, überschreibt keine Admin-Bilder)
  try {
    const seed = require('./utils/seed');
    await seed();
  } catch (e) {
    console.warn('Seed-Warnung:', e.message);
  }
});

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
