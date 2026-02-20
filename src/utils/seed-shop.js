/**
 * Seed-Script: Shop-Produkte für den LYNX Lining Webshop
 * Ausführen: node src/utils/seed-shop.js
 */
require('dotenv').config();
const db = require('../config/database');

async function seedShop() {
  console.log('Starte Seeding der Shop-Produkte...\n');

  // ===== SHOP-PRODUKTE =====
  const products = [
    {
      slug: 'll-standard-2mm', sku: 'LL-STD-2MM', image: '/images/products/produkt.JPG', unit: 'lfm', sort: 1,
      de: { name: 'LYNX Lining Standard 2mm', short_description: 'Verschleißschutzfolie aus TPU – Der Allrounder in 2mm Stärke', description: 'Die LYNX Lining Standard 2mm Verschleißschutzfolie bietet zuverlässigen Schutz für moderate Beanspruchung. Ideal für Oberflächen mit geringem bis mittlerem Verschleiß. Einfache Montage durch selbstklebende Rückseite oder mechanische Befestigung.' },
      en: { name: 'LYNX Lining Standard 2mm', short_description: 'TPU wear protection film – The all-rounder in 2mm thickness', description: 'The LYNX Lining Standard 2mm wear protection film provides reliable protection for moderate stress. Ideal for surfaces with low to medium wear. Easy installation via self-adhesive backing or mechanical fastening.' },
      tiers: [{ min: 1, price: 18.50 }, { min: 10, price: 16.50 }, { min: 50, price: 14.90 }]
    },
    {
      slug: 'll-standard-3mm', sku: 'LL-STD-3MM', image: '/images/products/produkt.JPG', unit: 'lfm', sort: 2,
      de: { name: 'LYNX Lining Standard 3mm', short_description: 'Verschleißschutzfolie aus TPU – Der Allrounder in 3mm Stärke', description: 'Die LYNX Lining Standard 3mm Verschleißschutzfolie bietet erhöhten Schutz für vielfältige Anwendungen. Optimale Balance zwischen Flexibilität und Widerstandsfähigkeit.' },
      en: { name: 'LYNX Lining Standard 3mm', short_description: 'TPU wear protection film – The all-rounder in 3mm thickness', description: 'The LYNX Lining Standard 3mm wear protection film provides enhanced protection for versatile applications. Optimal balance between flexibility and resistance.' },
      tiers: [{ min: 1, price: 24.90 }, { min: 10, price: 22.50 }, { min: 50, price: 19.90 }]
    },
    {
      slug: 'll-standard-5mm', sku: 'LL-STD-5MM', image: '/images/products/produkt.JPG', unit: 'lfm', sort: 3,
      de: { name: 'LYNX Lining Standard 5mm', short_description: 'Verschleißschutzfolie aus TPU – Der Allrounder in 5mm Stärke', description: 'Die LYNX Lining Standard 5mm Verschleißschutzfolie bietet robusten Schutz für anspruchsvolle Einsatzgebiete. Besonders geeignet für Übergabestellen und Trichterauskleidungen.' },
      en: { name: 'LYNX Lining Standard 5mm', short_description: 'TPU wear protection film – The all-rounder in 5mm thickness', description: 'The LYNX Lining Standard 5mm wear protection film provides robust protection for demanding applications. Especially suitable for transfer points and hopper linings.' },
      tiers: [{ min: 1, price: 34.90 }, { min: 10, price: 31.50 }, { min: 50, price: 28.90 }]
    },
    {
      slug: 'll-standard-10mm', sku: 'LL-STD-10MM', image: '/images/products/produkt.JPG', unit: 'lfm', sort: 4,
      de: { name: 'LYNX Lining Standard 10mm', short_description: 'Verschleißschutzfolie aus TPU – Der Allrounder in 10mm Stärke', description: 'Die LYNX Lining Standard 10mm Verschleißschutzfolie bietet maximalen Schutz in der Standard-Linie. Für stark beanspruchte Bereiche mit hohem Materialfluss.' },
      en: { name: 'LYNX Lining Standard 10mm', short_description: 'TPU wear protection film – The all-rounder in 10mm thickness', description: 'The LYNX Lining Standard 10mm wear protection film provides maximum protection in the Standard line. For heavily stressed areas with high material flow.' },
      tiers: [{ min: 1, price: 52.90 }, { min: 10, price: 48.50 }, { min: 50, price: 44.90 }]
    },
    {
      slug: 'll-comfort-3mm', sku: 'LL-CMF-3MM', image: '/images/products/produkt.JPG', unit: 'lfm', sort: 5,
      de: { name: 'LYNX Lining Comfort 3mm', short_description: 'Verschleißschutzfolie aus TPU – Maximaler Komfort in 3mm Stärke', description: 'Die LYNX Lining Comfort 3mm vereint Verschleißschutz mit hervorragender Schalldämpfung und Vibrationsreduktion. Perfekt für lärmempfindliche Umgebungen und Arbeitsplätze.' },
      en: { name: 'LYNX Lining Comfort 3mm', short_description: 'TPU wear protection film – Maximum comfort in 3mm thickness', description: 'The LYNX Lining Comfort 3mm combines wear protection with excellent sound dampening and vibration reduction. Perfect for noise-sensitive environments and workplaces.' },
      tiers: [{ min: 1, price: 32.90 }, { min: 10, price: 29.50 }, { min: 50, price: 26.90 }]
    },
    {
      slug: 'll-comfort-5mm', sku: 'LL-CMF-5MM', image: '/images/products/produkt.JPG', unit: 'lfm', sort: 6,
      de: { name: 'LYNX Lining Comfort 5mm', short_description: 'Verschleißschutzfolie aus TPU – Maximaler Komfort in 5mm Stärke', description: 'Die LYNX Lining Comfort 5mm bietet verstärkten Verschleißschutz bei gleichzeitig optimaler Schall- und Vibrationsdämpfung. Die ideale Wahl für industrielle Anwendungen mit Lärmschutzanforderungen.' },
      en: { name: 'LYNX Lining Comfort 5mm', short_description: 'TPU wear protection film – Maximum comfort in 5mm thickness', description: 'The LYNX Lining Comfort 5mm offers enhanced wear protection with optimal sound and vibration dampening. The ideal choice for industrial applications with noise protection requirements.' },
      tiers: [{ min: 1, price: 44.90 }, { min: 10, price: 40.50 }, { min: 50, price: 36.90 }]
    },
    {
      slug: 'll-ultra-5mm', sku: 'LL-ULT-5MM', image: '/images/products/6675642.jpg', unit: 'lfm', sort: 7,
      de: { name: 'LYNX Lining Ultra 5mm', short_description: 'Verschleißschutzfolie aus TPU – Extreme Belastung in 5mm Stärke', description: 'Die LYNX Lining Ultra 5mm ist für extremste Beanspruchung konzipiert. Höchste Abriebfestigkeit für Bergbau, Schüttgutaufbereitung und hoch abrasive Materialien.' },
      en: { name: 'LYNX Lining Ultra 5mm', short_description: 'TPU wear protection film – Extreme load in 5mm thickness', description: 'The LYNX Lining Ultra 5mm is designed for the most extreme demands. Highest abrasion resistance for mining, bulk material processing and highly abrasive materials.' },
      tiers: [{ min: 1, price: 54.90 }, { min: 10, price: 49.50 }, { min: 50, price: 44.90 }]
    },
    {
      slug: 'll-ultra-10mm', sku: 'LL-ULT-10MM', image: '/images/products/6675642.jpg', unit: 'lfm', sort: 8,
      de: { name: 'LYNX Lining Ultra 10mm', short_description: 'Verschleißschutzfolie aus TPU – Extreme Belastung in 10mm Stärke', description: 'Die LYNX Lining Ultra 10mm bietet maximalen Schutz für die härtesten Einsatzbedingungen. Unsere leistungsstärkste Lösung für extremen Verschleiß im Bergbau und in der Schwerindustrie.' },
      en: { name: 'LYNX Lining Ultra 10mm', short_description: 'TPU wear protection film – Extreme load in 10mm thickness', description: 'The LYNX Lining Ultra 10mm provides maximum protection for the harshest operating conditions. Our most powerful solution for extreme wear in mining and heavy industry.' },
      tiers: [{ min: 1, price: 72.90 }, { min: 10, price: 66.50 }, { min: 50, price: 59.90 }]
    }
  ];

  for (const prod of products) {
    // Produkt einfügen oder aktualisieren
    const [result] = await db.query(
      `INSERT INTO shop_products (slug, sku, image_path, unit, min_quantity, sort_order, is_active)
       VALUES (?, ?, ?, ?, 1.00, ?, 1)
       ON DUPLICATE KEY UPDATE sku = VALUES(sku), image_path = VALUES(image_path), unit = VALUES(unit),
         min_quantity = VALUES(min_quantity), sort_order = VALUES(sort_order), is_active = VALUES(is_active)`,
      [prod.slug, prod.sku, prod.image, prod.unit, prod.sort]
    );

    // ID ermitteln (insertId bei INSERT, sonst per SELECT)
    const prodId = result.insertId || (await db.query(`SELECT id FROM shop_products WHERE slug = ?`, [prod.slug]))[0][0].id;

    // Deutsche Übersetzung
    await db.query(
      `INSERT INTO shop_product_translations (shop_product_id, locale, name, short_description, description)
       VALUES (?, 'de', ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description), description = VALUES(description)`,
      [prodId, prod.de.name, prod.de.short_description, prod.de.description]
    );

    // Englische Übersetzung
    await db.query(
      `INSERT INTO shop_product_translations (shop_product_id, locale, name, short_description, description)
       VALUES (?, 'en', ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description), description = VALUES(description)`,
      [prodId, prod.en.name, prod.en.short_description, prod.en.description]
    );

    // Staffelpreise
    for (const tier of prod.tiers) {
      await db.query(
        `INSERT INTO shop_price_tiers (shop_product_id, min_quantity, price_per_unit)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE price_per_unit = VALUES(price_per_unit)`,
        [prodId, tier.min, tier.price]
      );
    }

    console.log(`✓ ${prod.de.name} (${prod.sku}) – 2 Übersetzungen, ${prod.tiers.length} Staffelpreise`);
  }

  console.log(`\n✅ Shop-Seeding abgeschlossen! ${products.length} Produkte erfolgreich eingespielt.`);
  process.exit(0);
}

seedShop().catch(err => {
  console.error('Seeding-Fehler:', err);
  process.exit(1);
});
