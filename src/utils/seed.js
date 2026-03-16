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
    ['admin', 'office@lynx-lining.com', passwordHash, 'admin']);
  console.log('✓ Admin-User angelegt (admin / LynxAdmin2026!)');

  // ===== SETTINGS =====
  const settings = [
    ['company_name', 'LYNX Lining'],
    ['company_street', 'Schillerstraße 13'],
    ['company_zip', '4020'],
    ['company_city', 'Linz'],
    ['company_country', 'Austria'],
    ['company_email', 'office@lynx-lining.com'],
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
      de: { title: 'Schüttgutaufbereitung', description: 'Auskleidung von Trichtern, Verschleißschutz bei Übergabepunkten, Abdichtungen bei Förderbändern, Staubkapselung' },
      en: { title: 'Solid Bulk Material Processing', description: 'Lining of funnels, wear protection of interconnection points, seal gasket for conveyor belts, dust containment' }
    },
    { slug: 'bergbau', img: '/images/applications/application_bergbau.jpg', sort: 2,
      de: { title: 'Bergbau', description: 'Aufgabebunker, hochabrasive, feuchte und klebrige Materialien' },
      en: { title: 'Mining', description: 'Feed bunker, highly abrasive, damp and sticky materials' }
    },
    { slug: 'industrie', img: '/images/applications/application_industrie1.jpg', sort: 3,
      de: { title: 'Industrie', description: 'Verschleißauskleidung für feste, staubförmige und flüssige Materialförderung, Schleifstaubabsaugungen, Förderbänder mit Aufpanzerung, Oberflächenschutz' },
      en: { title: 'Industry', description: 'Wear protection for solid, powdered and liquid material transportation, abrasive dust suction unit, conveyor belts with armouring, surface protection' }
    },
    { slug: 'maschinen', img: '/images/applications/application_maschinen.jpg', sort: 4,
      de: { title: 'Maschinen- und Anlagenbau', description: 'Übergabepunkte und Verkleidungen in der Betonproduktion, Aufgabetrichter bei verschiedenen Recyclinganlagen' },
      en: { title: 'Mechanical & Plant Engineering', description: 'Interconnection points and wear linings in concrete production, feed hoppers for all kinds of recycling equipment' }
    },
    { slug: 'recycling', img: '/images/applications/application_recycling.jpg', sort: 5,
      de: { title: 'Recycling & Aufbereitung', description: 'Recycling und Aufbereitung von Bauschutt, Gesteinsmaterial für Kiesproduktion und andere organische Stoffe' },
      en: { title: 'Recycling & Processing', description: 'Recycling and processing of construction waste, rock material for gravel production and other organic substances' }
    },
    { slug: 'schienen', img: '/images/applications/application_schienen.jpg', sort: 6,
      de: { title: 'Schienenfahrzeuge & Transportwirtschaft', description: 'Verschleißauskleidung für Schienenbearbeitungszüge (Schotterbunker und Silos), Auskleidungen für Kippermulden und Kehrmaschinen' },
      en: { title: 'Rail Vehicles & Transport Industry', description: 'Wear-resistant liner for railway maintenance machines (gravel bunker and silos), lining for dumper and street sweepers' }
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
      de: { title: 'Verschleißfest', description: 'Unsere LYNX Lining Produkte überzeugen durch eine enorme Verschleißfestigkeit, welche die Lebensdauer und die Kosteneinsparungen jeweils positiv verstärken.' },
      en: { title: 'Wear Resistance', description: 'Our LYNX Lining products impress with enormous wear resistance, which positively enhances both service life and cost savings.' }
    },
    { slug: 'schalldaempfung', icon: '/images/advantages/schalldaempfung.png', sort: 2,
      de: { title: 'Schalldämpfung', description: 'Durch Verwendung unserer LYNX Lining Produkte können bestehende Lärmemissionen um bis zu 21 DB reduziert werden.' },
      en: { title: 'Noise Protection', description: 'By using our LYNX Lining products, existing noise emissions can be reduced by up to 21 DB.' }
    },
    { slug: 'antihaft', icon: '/images/advantages/anithaft.png', sort: 3,
      de: { title: 'Anti-Haft', description: 'Kein Verkleben mehr von Förderrinnen oder LKW-Kippern. Die Antihafteigenschaft ist auch bekannt als „Lotuseffekt".' },
      en: { title: 'Non-Stick', description: 'No more sticking of conveyor troughs or truck tippers. The non-stick property is also known as the "lotus effect".' }
    },
    { slug: 'vibration', icon: '/images/advantages/vibrations.png', sort: 4,
      de: { title: 'Vibrationsreduktion', description: 'Vibrationen werden durch die Beschichtung mit LYNX Lining Produkten deutlich vermindert. Dadurch hält Ihre Produktionsausrüstung um ein vielfaches länger.' },
      en: { title: 'Reduction of Vibrations', description: 'Vibrations are significantly reduced by coating with LYNX Lining products. This means your production equipment lasts many times longer.' }
    },
    { slug: 'recyclebar', icon: '/images/advantages/recyclebar.png', sort: 5,
      de: { title: '100% recyclebar', description: 'Unsere Produkte werden in Österreich mit höchster Qualität produziert und sind zu 100 % recyclebar, was einen enormen Vorteil für unsere Umwelt darstellt.' },
      en: { title: '100% Recyclability', description: 'Our products are manufactured in Austria with the highest quality and are 100% recyclable, which represents an enormous advantage for our environment.' }
    },
    { slug: 'made-in-austria', icon: '/images/icons/made_in_austria.png', sort: 6,
      de: { title: 'Made in Austria', description: 'Höchste Qualität durch Produktion in Österreich.' },
      en: { title: 'Made in Austria', description: 'Highest quality through production in Austria.' }
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
      de: { title: 'LYNX Lining Standard', subtitle: 'Rollenware', description: 'Unsere Standard Rollenware kann für jede beliebige Anwendung detailgerecht zugeschnitten werden. Dadurch werden Maschinen und Material vor Verschleiß geschont und Lärm und Vibrationen deutlich verringert.' },
      en: { title: 'LYNX Lining Standard', subtitle: 'In coils', description: 'Our standard material in coil can be cut tailor-made for any various applications. Thereby the wear on machine and material can be reduced as well noise pollution and vibrations, significantly.' }
    },
    { slug: 'lynx-lining-comfort', img: '/images/products/produkt.JPG', sort: 2,
      de: { title: 'LYNX Lining Comfort', subtitle: 'Vormontiert auf Blech oder Stahlplatte', description: 'Die Comfort Linie besteht aus dem Standardprodukt, welche auf eine beliebige Trägerplatte aus Blech oder Stahl in gewünschter Stärke aufgeklebt wird. Somit kann die Trägerplatte einfach überall installiert werden. Unsere Comfort-Schiene kann für jede beliebige Anwendung auf Maß bestellt werden. Dadurch werden Maschinen und Material vor Verschleiß geschont und Lärm und Vibrationen deutlich verringert.' },
      en: { title: 'LYNX Lining Comfort', subtitle: 'Pre-installed on plate or steel sheet', description: 'The Comfort line consists of the Standard product, which can be variously installed to any plate made of sheet metal or steel in any thickness. Therefore, the carrier plate can easily be mounted anywhere. Our Comfort-line can be ordered to measure all applications and is tailor-made. This protects machines and material from wear and tear, noise and vibrations are significantly reduced.' }
    },
    { slug: 'lynx-lining-ultra', img: '/images/products/6675642.jpg', sort: 3,
      de: { title: 'LYNX Lining Ultra', subtitle: 'Für spezielle Anforderungen', description: 'LYNX Lining Ultra besteht aus einer Kombination des Standardprodukts in der gewünschten Stärke und wird mit einem extrem widerstandsfähigen Spezialschaumstoff kombiniert, welcher in den Stärken 12,5 mm und 25 mm erhältlich ist. Unsere Standard Rollenware kann für jede beliebige Anwendung auf Maß detailgerecht zugeschnitten werden. Dadurch werden Maschinen und Material vor Verschleiß geschont und Lärm und Vibrationen deutlich verringert.' },
      en: { title: 'LYNX Lining Ultra', subtitle: 'For special requirements', description: 'LYNX Lining Ultra consists of a composite of Standard product in various thickness and an extreme durable expanded material, which is available in thickness 12.5 mm and 25 mm. Our LYNX Lining standard in coils can be used for any various applications and cut tailor-made. Thereby the wear on machine and material can be reduced as well noise pollution and vibrations, significantly.' }
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
      de: { title: 'Impressum', content: '## Impressum\n\n**LYNX Lining**\nSchillerstraße 13\n4020 Linz, Austria\n\nE-Mail: office@lynx-lining.com\n\nUnternehmensgegenstand: Verschleißschutz' },
      en: { title: 'Imprint', content: '## Imprint\n\n**LYNX Lining**\nSchillerstraße 13\n4020 Linz, Austria\n\nEmail: office@lynx-lining.com\n\nBusiness purpose: Wear protection' }
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
