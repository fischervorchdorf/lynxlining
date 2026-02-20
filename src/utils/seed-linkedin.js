/**
 * LinkedIn Posts Tabelle erstellen + Beispiel-Beitrag einfügen
 * Aufruf: node src/utils/seed-linkedin.js
 */
require('dotenv').config();
const db = require('../config/database');

async function seedLinkedIn() {
  console.log('=== LinkedIn Posts Tabelle erstellen ===\n');

  // Tabelle erstellen
  await db.query(`
    CREATE TABLE IF NOT EXISTS linkedin_posts (
      id INT PRIMARY KEY AUTO_INCREMENT,
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
  console.log('✓ Tabelle linkedin_posts erstellt');

  // Übersetzungstabelle erstellen
  await db.query(`
    CREATE TABLE IF NOT EXISTS linkedin_post_translations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      linkedin_post_id INT NOT NULL,
      locale ENUM('de', 'en') NOT NULL,
      title VARCHAR(255) NOT NULL,
      excerpt TEXT,
      FOREIGN KEY (linkedin_post_id) REFERENCES linkedin_posts(id) ON DELETE CASCADE,
      UNIQUE KEY uq_linkedin_locale (linkedin_post_id, locale)
    )
  `);
  console.log('✓ Tabelle linkedin_post_translations erstellt');

  // Beispiel-Beitrag einfügen
  const [existing] = await db.query('SELECT id FROM linkedin_posts LIMIT 1');
  if (!existing.length) {
    const [result] = await db.query(`
      INSERT INTO linkedin_posts (linkedin_url, image_path, author_name, published_at, is_visible, sort_order)
      VALUES (?, ?, ?, ?, 1, 1)
    `, [
      'https://www.linkedin.com/posts/martin-f-heidecker-951103204_lynx-lining-tpu-verschlei%C3%9Fschutzauskleidungen-activity-7428911625409208320-M2iG',
      '',
      'Martin F. Heidecker',
      '2026-02-16 10:00:00'
    ]);

    const postId = result.insertId;

    await db.query(`
      INSERT INTO linkedin_post_translations (linkedin_post_id, locale, title, excerpt) VALUES
      (?, 'de', ?, ?),
      (?, 'en', ?, ?)
    `, [
      postId,
      'LYNX Lining TPU Verschleißschutzauskleidungen im Schienenverkehr',
      'Maschinen verarbeiten Gleisschotter mit 800 m³/h bei Korngrößen von 31,5–63mm. LYNX Lining erreichte in einer Masterarbeit den niedrigsten Abriebwert aller 13 getesteten Materialien.',
      postId,
      'LYNX Lining TPU Wear Protection Linings for Railway Applications',
      'Machines process ballast at 800 m³/h with grain sizes of 31.5–63mm. LYNX Lining achieved the lowest abrasion value of all 13 tested materials in a master thesis study.'
    ]);

    console.log('✓ Beispiel-LinkedIn-Beitrag eingefügt (ID:', postId, ')');
  } else {
    console.log('ℹ LinkedIn-Beiträge existieren bereits, übersprungen');
  }

  console.log('\n=== Fertig ===');
  process.exit(0);
}

seedLinkedIn().catch(err => {
  console.error('Fehler:', err);
  process.exit(1);
});
