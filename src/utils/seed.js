/**
 * Seed-Script: Bestehende Inhalte der LYNX Lining Website in die Datenbank übertragen
 * Ausführen: node src/utils/seed.js
 */
require('dotenv').config();
const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Starte Seeding der Datenbank...\n');

  // ===== ADMIN USER =====
  const passwordHash = await bcrypt.hash('LynxAdmin2026!', 12);
  await db.query(`INSERT IGNORE INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    ['admin', 'info@lynx-lining.com', passwordHash, 'admin']);
  console.log('✓ Admin-User angelegt (admin / LynxAdmin2026!)');

  // ===== SETTINGS =====
  const settings = [
    ['company_name', 'LYNX Lining'],
    ['company_street', 'Schillerstraße 13'],
    ['company_zip', '4020'],
    ['company_city', 'Linz'],
    ['company_country', 'Austria'],
    ['company_email', 'info@lynx-lining.com'],
    ['company_phone', ''],
    ['company_website', 'https://lynx-lining.com'],
    ['instagram_url', 'https://www.instagram.com/lynx_lining/'],
    ['instagram_handle', '@lynx_lining']
  ];
  for (const [key, value] of settings) {
    await db.query(`INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)`, [key, value]);
  }
  console.log('✓ Firmen-Einstellungen gespeichert');

  // ===== ANWENDUNGSBEREICHE =====
  const applications = [
    { slug: 'schuettgut', img: '/images/applications/application_schuettgut.jpg', sort: 1,
      de: { title: 'Schüttgutaufbereitung', description: 'Trichterauskleidung, Übergabestellen, Förderbandabdichtung und Staubkapselung' },
      en: { title: 'Bulk Material Processing', description: 'Hopper lining, transfer points, conveyor belt sealing and dust encapsulation' }
    },
    { slug: 'bergbau', img: '/images/applications/application_bergbau.jpg', sort: 2,
      de: { title: 'Bergbau', description: 'Aufgabebunker, Förderbänder und Übergabestellen für höchste Beanspruchung bei hoch abrasiven Materialien' },
      en: { title: 'Mining', description: 'Feed bunkers, conveyor belts and transfer points for highest demands with highly abrasive materials' }
    },
    { slug: 'industrie', img: '/images/applications/application_industrie1.jpg', sort: 3,
      de: { title: 'Industrie', description: 'Verschleißschutz für Materialtransport, Schleifstaub-Absaugung und industrielle Anwendungen' },
      en: { title: 'Industry', description: 'Wear protection for material transport, grinding dust extraction and industrial applications' }
    },
    { slug: 'maschinen', img: '/images/applications/application_maschinen.jpg', sort: 4,
      de: { title: 'Maschinen- und Anlagenbau', description: 'Übergabestellen, Recyclinganlagen und individuelle Maschinenauskleidung' },
      en: { title: 'Machinery & Plant Construction', description: 'Transfer points, recycling equipment and individual machine lining' }
    },
    { slug: 'recycling', img: '/images/applications/application_recycling.jpg', sort: 5,
      de: { title: 'Recycling & Aufbereitung', description: 'Baurestmassen, Zuschlagstoffaufbereitung und Recycling-Anlagen' },
      en: { title: 'Recycling & Processing', description: 'Construction waste, aggregate processing and recycling plants' }
    },
    { slug: 'schienen', img: '/images/applications/application_schienen.jpg', sort: 6,
      de: { title: 'Schienenfahrzeuge', description: 'Speziallösungen für den Schienenverkehr und Transportfahrzeuge' },
      en: { title: 'Rail Vehicles', description: 'Special solutions for rail transport and transport vehicles' }
    }
  ];

  for (const app of applications) {
    const [result] = await db.query(`INSERT INTO applications (slug, image_path, sort_order) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE image_path = VALUES(image_path), sort_order = VALUES(sort_order)`,
      [app.slug, app.img, app.sort]);
    const appId = result.insertId || (await db.query(`SELECT id FROM applications WHERE slug = ?`, [app.slug]))[0][0].id;
    await db.query(`INSERT INTO application_translations (application_id, locale, title, description) VALUES (?, 'de', ?, ?)
      ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description)`, [appId, app.de.title, app.de.description]);
    await db.query(`INSERT INTO application_translations (application_id, locale, title, description) VALUES (?, 'en', ?, ?)
      ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description)`, [appId, app.en.title, app.en.description]);
  }
  console.log('✓ 6 Anwendungsbereiche (DE + EN)');

  // ===== VORTEILE =====
  const advantages = [
    { slug: 'verschleissfest', icon: '/images/advantages/verschleissfest.png', sort: 1,
      de: { title: 'Extrem verschleißfest', description: 'Bis zu 30x längere Lebensdauer als herkömmliche Verschleißschutzmaterialien' },
      en: { title: 'Extremely wear-resistant', description: 'Up to 30x longer service life than conventional wear protection materials' }
    },
    { slug: 'schalldaempfung', icon: '/images/advantages/schalldaempfung.png', sort: 2,
      de: { title: 'Schalldämpfend', description: 'Erhebliche Reduzierung der Lärmbelastung beim Materialtransport' },
      en: { title: 'Sound dampening', description: 'Significant reduction of noise pollution during material transport' }
    },
    { slug: 'antihaft', icon: '/images/advantages/anithaft.png', sort: 3,
      de: { title: 'Anti-Haft', description: 'Materialanbackungen werden zuverlässig verhindert – weniger Stillstand' },
      en: { title: 'Anti-adhesion', description: 'Material build-up is reliably prevented – less downtime' }
    },
    { slug: 'vibration', icon: '/images/advantages/vibrations.png', sort: 4,
      de: { title: 'Vibrationsreduktion', description: 'Spürbare Dämpfung von Vibrationen für längere Anlagenlebensdauer' },
      en: { title: 'Vibration reduction', description: 'Noticeable dampening of vibrations for longer plant service life' }
    },
    { slug: 'recyclebar', icon: '/images/advantages/recyclebar.png', sort: 5,
      de: { title: '100% recyclebar', description: 'Nachhaltiger Verschleißschutz – vollständig wiederverwertbar' },
      en: { title: '100% recyclable', description: 'Sustainable wear protection – fully recyclable' }
    },
    { slug: 'made-in-austria', icon: '/images/icons/made_in_austria.png', sort: 6,
      de: { title: 'Made in Austria', description: 'Höchste Qualität durch Produktion in Österreich' },
      en: { title: 'Made in Austria', description: 'Highest quality through production in Austria' }
    }
  ];

  for (const adv of advantages) {
    const [result] = await db.query(`INSERT INTO advantages (slug, icon_path, sort_order) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE icon_path = VALUES(icon_path), sort_order = VALUES(sort_order)`,
      [adv.slug, adv.icon, adv.sort]);
    const advId = result.insertId || (await db.query(`SELECT id FROM advantages WHERE slug = ?`, [adv.slug]))[0][0].id;
    await db.query(`INSERT INTO advantage_translations (advantage_id, locale, title, description) VALUES (?, 'de', ?, ?)
      ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description)`, [advId, adv.de.title, adv.de.description]);
    await db.query(`INSERT INTO advantage_translations (advantage_id, locale, title, description) VALUES (?, 'en', ?, ?)
      ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description)`, [advId, adv.en.title, adv.en.description]);
  }
  console.log('✓ 6 Vorteile (DE + EN)');

  // ===== PRODUKTE =====
  const products = [
    { slug: 'lynx-lining-standard', img: '/images/products/produkt.JPG', sort: 1,
      de: { title: 'LYNX Lining Standard', subtitle: 'Der Allrounder', description: 'Unser Standardprodukt für vielfältige Anwendungen im Verschleißschutz. Ideal für moderate Beanspruchung.' },
      en: { title: 'LYNX Lining Standard', subtitle: 'The all-rounder', description: 'Our standard product for versatile wear protection applications. Ideal for moderate stress.' }
    },
    { slug: 'lynx-lining-comfort', img: '/images/products/produkt.JPG', sort: 2,
      de: { title: 'LYNX Lining Comfort', subtitle: 'Maximaler Komfort', description: 'Erweiterte Schalldämpfung und Vibrationsreduktion. Perfekt für lärmempfindliche Umgebungen.' },
      en: { title: 'LYNX Lining Comfort', subtitle: 'Maximum comfort', description: 'Enhanced sound dampening and vibration reduction. Perfect for noise-sensitive environments.' }
    },
    { slug: 'lynx-lining-ultra', img: '/images/products/6675642.jpg', sort: 3,
      de: { title: 'LYNX Lining Ultra', subtitle: 'Extreme Belastung', description: 'Für extremste Beanspruchung im Bergbau und bei hoch abrasiven Materialien. Maximale Lebensdauer.' },
      en: { title: 'LYNX Lining Ultra', subtitle: 'Extreme load', description: 'For extreme demands in mining and with highly abrasive materials. Maximum service life.' }
    }
  ];

  for (const prod of products) {
    const [result] = await db.query(`INSERT INTO products (slug, image_path, sort_order) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE image_path = VALUES(image_path), sort_order = VALUES(sort_order)`,
      [prod.slug, prod.img, prod.sort]);
    const prodId = result.insertId || (await db.query(`SELECT id FROM products WHERE slug = ?`, [prod.slug]))[0][0].id;
    await db.query(`INSERT INTO product_translations (product_id, locale, title, subtitle, description) VALUES (?, 'de', ?, ?, ?)
      ON DUPLICATE KEY UPDATE title = VALUES(title), subtitle = VALUES(subtitle), description = VALUES(description)`,
      [prodId, prod.de.title, prod.de.subtitle, prod.de.description]);
    await db.query(`INSERT INTO product_translations (product_id, locale, title, subtitle, description) VALUES (?, 'en', ?, ?, ?)
      ON DUPLICATE KEY UPDATE title = VALUES(title), subtitle = VALUES(subtitle), description = VALUES(description)`,
      [prodId, prod.en.title, prod.en.subtitle, prod.en.description]);
  }
  console.log('✓ 3 Produkte (DE + EN)');

  // ===== TESTIMONIALS =====
  const testimonials = [
    { photo: '/images/testimonials/arthofer.webp', sort: 1,
      de: { name: 'Johann Arthofer', role: 'Geschäftsführer', company: 'Arthofer Bau GmbH',
        quote: 'Seit wir LYNX Lining einsetzen, haben sich unsere Standzeiten dramatisch verbessert. Die Investition hat sich innerhalb weniger Monate amortisiert.' },
      en: { name: 'Johann Arthofer', role: 'Managing Director', company: 'Arthofer Bau GmbH',
        quote: 'Since we started using LYNX Lining, our service life has improved dramatically. The investment paid for itself within a few months.' }
    },
    { photo: '/images/testimonials/Andreas-Grabner.jpg', sort: 2,
      de: { name: 'Andreas Grabner', role: 'Betriebsleiter', company: 'Grabner Recycling',
        quote: 'Die Vibrationsreduktion und Schalldämpfung durch LYNX Lining ist beeindruckend. Unsere Mitarbeiter schätzen die reduzierte Lärmbelastung.' },
      en: { name: 'Andreas Grabner', role: 'Operations Manager', company: 'Grabner Recycling',
        quote: 'The vibration reduction and sound dampening through LYNX Lining is impressive. Our employees appreciate the reduced noise levels.' }
    },
    { photo: '/images/testimonials/mandorfer.jpg', sort: 3,
      de: { name: 'Rudolf Mandorfer', role: 'Technischer Leiter', company: 'Mandorfer Bau GmbH',
        quote: 'Die Anti-Haft-Eigenschaften sind herausragend. Materialanbackungen gehören der Vergangenheit an, was unsere Effizienz enorm gesteigert hat.' },
      en: { name: 'Rudolf Mandorfer', role: 'Technical Director', company: 'Mandorfer Bau GmbH',
        quote: 'The anti-adhesion properties are outstanding. Material build-up is a thing of the past, which has enormously increased our efficiency.' }
    }
  ];

  for (const test of testimonials) {
    const [result] = await db.query(`INSERT INTO testimonials (photo_path, sort_order) VALUES (?, ?)`, [test.photo, test.sort]);
    const testId = result.insertId;
    await db.query(`INSERT INTO testimonial_translations (testimonial_id, locale, name, role, company, quote) VALUES (?, 'de', ?, ?, ?, ?)`,
      [testId, test.de.name, test.de.role, test.de.company, test.de.quote]);
    await db.query(`INSERT INTO testimonial_translations (testimonial_id, locale, name, role, company, quote) VALUES (?, 'en', ?, ?, ?, ?)`,
      [testId, test.en.name, test.en.role, test.en.company, test.en.quote]);
  }
  console.log('✓ 3 Testimonials (DE + EN)');

  // ===== STATISCHE SEITEN =====
  const legalPages = [
    { slug: 'impressum', type: 'legal',
      de: { title: 'Impressum', content: '## Impressum\n\n**LYNX Lining**\nSchillerstraße 13\n4020 Linz, Austria\n\nE-Mail: info@lynx-lining.com\n\nUnternehmensgegenstand: Verschleißschutz' },
      en: { title: 'Imprint', content: '## Imprint\n\n**LYNX Lining**\nSchillerstraße 13\n4020 Linz, Austria\n\nEmail: info@lynx-lining.com\n\nBusiness purpose: Wear protection' }
    },
    { slug: 'datenschutz', type: 'legal',
      de: { title: 'Datenschutzerklärung', content: '## Datenschutzerklärung\n\nDer Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen.\n\nVerantwortlich: LYNX Lining, Schillerstraße 13, 4020 Linz' },
      en: { title: 'Privacy Policy', content: '## Privacy Policy\n\nProtecting your personal data is particularly important to us.\n\nResponsible: LYNX Lining, Schillerstraße 13, 4020 Linz' }
    },
    { slug: 'agb', type: 'legal',
      de: { title: 'Allgemeine Geschäftsbedingungen', content: '## AGB\n\nEs gelten die allgemeinen Geschäftsbedingungen der LYNX Lining.' },
      en: { title: 'Terms & Conditions', content: '## Terms & Conditions\n\nThe general terms and conditions of LYNX Lining apply.' }
    }
  ];

  for (const pg of legalPages) {
    const [result] = await db.query(`INSERT INTO pages (slug, page_type) VALUES (?, ?)
      ON DUPLICATE KEY UPDATE page_type = VALUES(page_type)`, [pg.slug, pg.type]);
    const pgId = result.insertId || (await db.query(`SELECT id FROM pages WHERE slug = ?`, [pg.slug]))[0][0].id;
    await db.query(`INSERT INTO page_translations (page_id, locale, title, content) VALUES (?, 'de', ?, ?)
      ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content)`, [pgId, pg.de.title, pg.de.content]);
    await db.query(`INSERT INTO page_translations (page_id, locale, title, content) VALUES (?, 'en', ?, ?)
      ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content)`, [pgId, pg.en.title, pg.en.content]);
  }
  console.log('✓ 3 Rechtsseiten (DE + EN)');

  // ===== DOWNLOADS =====
  await db.query(`INSERT IGNORE INTO downloads (file_path, cover_image_path, sort_order) VALUES (?, ?, ?)`,
    ['/pdf/stein_kies_186_web_3_.pdf', '/images/products/stein_kies_cover.png', 1]);
  const [dlRows] = await db.query(`SELECT id FROM downloads LIMIT 1`);
  if (dlRows.length) {
    await db.query(`INSERT IGNORE INTO download_translations (download_id, locale, title, description) VALUES (?, 'de', ?, ?)`,
      [dlRows[0].id, 'Stein & Kies Magazin', 'LYNX Lining Artikel im Stein & Kies Magazin']);
    await db.query(`INSERT IGNORE INTO download_translations (download_id, locale, title, description) VALUES (?, 'en', ?, ?)`,
      [dlRows[0].id, 'Stein & Kies Magazine', 'LYNX Lining article in Stein & Kies Magazine']);
  }
  console.log('✓ 1 Download (PDF)');

  console.log('\n✅ Seeding abgeschlossen! Alle Daten erfolgreich eingespielt.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding-Fehler:', err);
  process.exit(1);
});
