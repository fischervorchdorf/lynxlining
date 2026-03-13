/**
 * Seed-Script: Shop-Produkte für den LYNX Lining Webshop
 * Mit echten Preisen basierend auf VK-Handel/m² × 1,515m Bahnbreite
 * Ausführen: node src/utils/seed-shop.js
 */
require('dotenv').config();
const db = require('../config/database');

// Hilfsfunktion: Preis pro lfm = VK-Handel/m² × 1,515m Breite
function lfmPrice(pricePerSqm) {
  return Math.round(pricePerSqm * 1.515 * 100) / 100;
}

// Hilfsfunktion: Rabattstufen berechnen
function calcTiers(pricePerSqm, rollLengthLfm) {
  const base = lfmPrice(pricePerSqm);
  return [
    { min: 1, price: base },                                          // 0% Rabatt
    { min: 5, price: Math.round(base * 0.95 * 100) / 100 },          // 5% Rabatt
    { min: 10, price: Math.round(base * 0.90 * 100) / 100 },         // 10% Rabatt
    { min: 20, price: Math.round(base * 0.85 * 100) / 100 },         // 15% Rabatt
    { min: rollLengthLfm, price: Math.round(base * 0.80 * 100) / 100 } // 20% Rabatt (ganze Rolle)
  ];
}

async function seedShop() {
  console.log('Starte Seeding der Shop-Produkte...\n');

  // Sicherstellen, dass neue Spalten existieren (Migration)
  const newCols = ['price_on_request', 'price_per_sqm', 'sqm_per_roll', 'roll_length_lfm',
    'roll_width_mm', 'roll_weight_kg', 'roll_outer_diameter_mm', 'roll_core_diameter_mm', 'roll_core_width_mm'];
  for (const col of newCols) {
    try {
      const [exists] = await db.query(`SHOW COLUMNS FROM shop_products LIKE '${col}'`);
      if (!exists.length) {
        console.log(`Spalte ${col} fehlt - bitte zuerst den Server starten für Auto-Migration.`);
        process.exit(1);
      }
    } catch (e) {
      console.error('DB-Fehler:', e.message);
      process.exit(1);
    }
  }

  // ===== STANDARD PRODUKTE (mit Preisen) =====
  // Preisdaten: VK-Handel/m² | m²/Rolle | Rollenlänge lfm
  const standardProducts = [
    {
      slug: 'll-standard-2mm', sku: 'LL-STD-2MM', image: '/images/products/produkt.JPG', unit: 'lfm', sort: 1,
      pricePerSqm: 67.90, sqmPerRoll: 61.05, rollLength: 40.30,
      rollWidth: 1515, rollWeight: 111, rollOuterDia: 600, rollCoreDia: 450, rollCoreWidth: 1650,
      de: { name: 'LYNX Lining Standard 2mm', short_description: 'Verschleißschutzfolie aus TPU – Der Allrounder in 2mm Stärke', description: 'Die LYNX Lining Standard 2mm Verschleißschutzfolie bietet zuverlässigen Schutz für moderate Beanspruchung. Ideal für Oberflächen mit geringem bis mittlerem Verschleiß. Einfache Montage durch selbstklebende Rückseite oder mechanische Befestigung.' },
      en: { name: 'LYNX Lining Standard 2mm', short_description: 'TPU wear protection film – The all-rounder in 2mm thickness', description: 'The LYNX Lining Standard 2mm wear protection film provides reliable protection for moderate stress. Ideal for surfaces with low to medium wear. Easy installation via self-adhesive backing or mechanical fastening.' }
    },
    {
      slug: 'll-standard-3mm', sku: 'LL-STD-3MM', image: '/images/products/produkt.JPG', unit: 'lfm', sort: 2,
      pricePerSqm: 101.56, sqmPerRoll: 61.05, rollLength: 40.30,
      rollWidth: 1515, rollWeight: 139, rollOuterDia: 700, rollCoreDia: 450, rollCoreWidth: 1650,
      de: { name: 'LYNX Lining Standard 3mm', short_description: 'Verschleißschutzfolie aus TPU – Der Allrounder in 3mm Stärke', description: 'Die LYNX Lining Standard 3mm Verschleißschutzfolie bietet erhöhten Schutz für vielfältige Anwendungen. Optimale Balance zwischen Flexibilität und Widerstandsfähigkeit.' },
      en: { name: 'LYNX Lining Standard 3mm', short_description: 'TPU wear protection film – The all-rounder in 3mm thickness', description: 'The LYNX Lining Standard 3mm wear protection film provides enhanced protection for versatile applications. Optimal balance between flexibility and resistance.' }
    },
    {
      slug: 'll-standard-5mm', sku: 'LL-STD-5MM', image: '/images/products/produkt.JPG', unit: 'lfm', sort: 3,
      pricePerSqm: 169.28, sqmPerRoll: 30.53, rollLength: 20.15,
      rollWidth: 1515, rollWeight: 183.2, rollOuterDia: 800, rollCoreDia: 450, rollCoreWidth: 1650,
      de: { name: 'LYNX Lining Standard 5mm', short_description: 'Verschleißschutzfolie aus TPU – Der Allrounder in 5mm Stärke', description: 'Die LYNX Lining Standard 5mm Verschleißschutzfolie bietet robusten Schutz für anspruchsvolle Einsatzgebiete. Besonders geeignet für Übergabestellen und Trichterauskleidungen.' },
      en: { name: 'LYNX Lining Standard 5mm', short_description: 'TPU wear protection film – The all-rounder in 5mm thickness', description: 'The LYNX Lining Standard 5mm wear protection film provides robust protection for demanding applications. Especially suitable for transfer points and hopper linings.' }
    },
    {
      slug: 'll-standard-8mm', sku: 'LL-STD-8MM', image: '/images/products/produkt.JPG', unit: 'lfm', sort: 4,
      pricePerSqm: 270.80, sqmPerRoll: 18.40, rollLength: 12.15,
      rollWidth: 1515, rollWeight: 177, rollOuterDia: 750, rollCoreDia: 450, rollCoreWidth: 1650,
      de: { name: 'LYNX Lining Standard 8mm', short_description: 'Verschleißschutzfolie aus TPU – Der Allrounder in 8mm Stärke', description: 'Die LYNX Lining Standard 8mm Verschleißschutzfolie bietet verstärkten Schutz für stark beanspruchte Bereiche. Ideal für Übergabestellen mit hohem Materialfluss.' },
      en: { name: 'LYNX Lining Standard 8mm', short_description: 'TPU wear protection film – The all-rounder in 8mm thickness', description: 'The LYNX Lining Standard 8mm wear protection film provides reinforced protection for heavily stressed areas. Ideal for transfer points with high material flow.' }
    },
    {
      slug: 'll-standard-10mm', sku: 'LL-STD-10MM', image: '/images/products/produkt.JPG', unit: 'lfm', sort: 5,
      pricePerSqm: 338.55, sqmPerRoll: 18.40, rollLength: 12.15,
      rollWidth: 1515, rollWeight: 221, rollOuterDia: 800, rollCoreDia: 450, rollCoreWidth: 1650,
      de: { name: 'LYNX Lining Standard 10mm', short_description: 'Verschleißschutzfolie aus TPU – Der Allrounder in 10mm Stärke', description: 'Die LYNX Lining Standard 10mm Verschleißschutzfolie bietet maximalen Schutz in der Standard-Linie. Für stark beanspruchte Bereiche mit hohem Materialfluss.' },
      en: { name: 'LYNX Lining Standard 10mm', short_description: 'TPU wear protection film – The all-rounder in 10mm thickness', description: 'The LYNX Lining Standard 10mm wear protection film provides maximum protection in the Standard line. For heavily stressed areas with high material flow.' }
    }
  ];

  // ===== COMFORT & ULTRA PRODUKTE (Preis auf Anfrage) =====
  const inquiryProducts = [
    {
      slug: 'll-comfort-3mm', sku: 'LL-CMF-3MM', image: '/images/products/comfort.jpg', unit: 'lfm', sort: 6,
      de: { name: 'LYNX Lining Comfort 3mm', short_description: 'Verschleißschutzfolie aus TPU auf Trägerblech montiert – Maximaler Komfort in 3mm Stärke', description: 'Die LYNX Lining Comfort 3mm vereint Verschleißschutz mit hervorragender Schalldämpfung und Vibrationsreduktion. Auf Trägerblech montiert geliefert. Perfekt für lärmempfindliche Umgebungen und Arbeitsplätze.' },
      en: { name: 'LYNX Lining Comfort 3mm', short_description: 'TPU wear protection on carrier plate – Maximum comfort in 3mm thickness', description: 'The LYNX Lining Comfort 3mm combines wear protection with excellent sound dampening and vibration reduction. Delivered mounted on carrier plate. Perfect for noise-sensitive environments and workplaces.' }
    },
    {
      slug: 'll-comfort-5mm', sku: 'LL-CMF-5MM', image: '/images/products/comfort.jpg', unit: 'lfm', sort: 7,
      de: { name: 'LYNX Lining Comfort 5mm', short_description: 'Verschleißschutzfolie aus TPU auf Trägerblech montiert – Maximaler Komfort in 5mm Stärke', description: 'Die LYNX Lining Comfort 5mm bietet verstärkten Verschleißschutz bei gleichzeitig optimaler Schall- und Vibrationsdämpfung. Auf Trägerblech montiert geliefert. Die ideale Wahl für industrielle Anwendungen mit Lärmschutzanforderungen.' },
      en: { name: 'LYNX Lining Comfort 5mm', short_description: 'TPU wear protection on carrier plate – Maximum comfort in 5mm thickness', description: 'The LYNX Lining Comfort 5mm offers enhanced wear protection with optimal sound and vibration dampening. Delivered mounted on carrier plate. The ideal choice for industrial applications with noise protection requirements.' }
    },
    {
      slug: 'll-ultra-5mm', sku: 'LL-ULT-5MM', image: '/images/products/ultra.jpg', unit: 'lfm', sort: 8,
      de: { name: 'LYNX Lining Ultra 5mm', short_description: 'Verschleißschutzfolie aus TPU als Sandwichplatte – Extreme Belastung in 5mm Stärke', description: 'Die LYNX Lining Ultra 5mm ist als Sandwichplatte für extremste Beanspruchung konzipiert. Höchste Abriebfestigkeit für Bergbau, Schüttgutaufbereitung und hoch abrasive Materialien. Individuelle Anfertigung nach Kundenwunsch.' },
      en: { name: 'LYNX Lining Ultra 5mm', short_description: 'TPU wear protection as sandwich panel – Extreme load in 5mm thickness', description: 'The LYNX Lining Ultra 5mm is designed as a sandwich panel for the most extreme demands. Highest abrasion resistance for mining, bulk material processing and highly abrasive materials. Custom manufacturing to customer specifications.' }
    },
    {
      slug: 'll-ultra-10mm', sku: 'LL-ULT-10MM', image: '/images/products/ultra.jpg', unit: 'lfm', sort: 9,
      de: { name: 'LYNX Lining Ultra 10mm', short_description: 'Verschleißschutzfolie aus TPU als Sandwichplatte – Extreme Belastung in 10mm Stärke', description: 'Die LYNX Lining Ultra 10mm bietet als Sandwichplatte maximalen Schutz für die härtesten Einsatzbedingungen. Unsere leistungsstärkste Lösung für extremen Verschleiß im Bergbau und in der Schwerindustrie. Individuelle Anfertigung nach Kundenwunsch.' },
      en: { name: 'LYNX Lining Ultra 10mm', short_description: 'TPU wear protection as sandwich panel – Extreme load in 10mm thickness', description: 'The LYNX Lining Ultra 10mm as sandwich panel provides maximum protection for the harshest operating conditions. Our most powerful solution for extreme wear in mining and heavy industry. Custom manufacturing to customer specifications.' }
    }
  ];

  // ===== STANDARD PRODUKTE EINFÜGEN =====
  for (const prod of standardProducts) {
    const tiers = calcTiers(prod.pricePerSqm, prod.rollLength);

    const [result] = await db.query(
      `INSERT INTO shop_products (slug, sku, image_path, unit, min_quantity, sort_order, is_active,
        price_on_request, price_per_sqm, sqm_per_roll, roll_length_lfm, roll_width_mm, roll_weight_kg,
        roll_outer_diameter_mm, roll_core_diameter_mm, roll_core_width_mm)
       VALUES (?, ?, ?, ?, 1.00, ?, 1, 0, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE sku = VALUES(sku), image_path = VALUES(image_path), unit = VALUES(unit),
         min_quantity = VALUES(min_quantity), sort_order = VALUES(sort_order), is_active = VALUES(is_active),
         price_on_request = VALUES(price_on_request), price_per_sqm = VALUES(price_per_sqm),
         sqm_per_roll = VALUES(sqm_per_roll), roll_length_lfm = VALUES(roll_length_lfm),
         roll_width_mm = VALUES(roll_width_mm), roll_weight_kg = VALUES(roll_weight_kg),
         roll_outer_diameter_mm = VALUES(roll_outer_diameter_mm), roll_core_diameter_mm = VALUES(roll_core_diameter_mm),
         roll_core_width_mm = VALUES(roll_core_width_mm)`,
      [prod.slug, prod.sku, prod.image, prod.unit, prod.sort,
        prod.pricePerSqm, prod.sqmPerRoll, prod.rollLength, prod.rollWidth,
        prod.rollWeight, prod.rollOuterDia, prod.rollCoreDia, prod.rollCoreWidth]
    );

    const prodId = result.insertId || (await db.query('SELECT id FROM shop_products WHERE slug = ?', [prod.slug]))[0][0].id;

    // Übersetzungen
    await db.query(
      `INSERT INTO shop_product_translations (shop_product_id, locale, name, short_description, description)
       VALUES (?, 'de', ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description), description = VALUES(description)`,
      [prodId, prod.de.name, prod.de.short_description, prod.de.description]
    );
    await db.query(
      `INSERT INTO shop_product_translations (shop_product_id, locale, name, short_description, description)
       VALUES (?, 'en', ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description), description = VALUES(description)`,
      [prodId, prod.en.name, prod.en.short_description, prod.en.description]
    );

    // Alte Staffelpreise löschen, neue einfügen
    await db.query('DELETE FROM shop_price_tiers WHERE shop_product_id = ?', [prodId]);
    for (const tier of tiers) {
      await db.query(
        'INSERT INTO shop_price_tiers (shop_product_id, min_quantity, price_per_unit) VALUES (?, ?, ?)',
        [prodId, tier.min, tier.price]
      );
    }

    console.log(`✓ ${prod.de.name} (${prod.sku}) – ${lfmPrice(prod.pricePerSqm)} €/lfm, Rolle: ${prod.rollLength} lfm`);
    tiers.forEach(t => console.log(`    ab ${t.min} lfm: ${t.price} €/lfm`));
  }

  // ===== COMFORT & ULTRA PRODUKTE EINFÜGEN =====
  for (const prod of inquiryProducts) {
    const [result] = await db.query(
      `INSERT INTO shop_products (slug, sku, image_path, unit, min_quantity, sort_order, is_active, price_on_request)
       VALUES (?, ?, ?, ?, 1.00, ?, 1, 1)
       ON DUPLICATE KEY UPDATE sku = VALUES(sku), image_path = VALUES(image_path), unit = VALUES(unit),
         min_quantity = VALUES(min_quantity), sort_order = VALUES(sort_order), is_active = VALUES(is_active),
         price_on_request = VALUES(price_on_request)`,
      [prod.slug, prod.sku, prod.image, prod.unit, prod.sort]
    );

    const prodId = result.insertId || (await db.query('SELECT id FROM shop_products WHERE slug = ?', [prod.slug]))[0][0].id;

    // Alte Staffelpreise löschen (Preis auf Anfrage braucht keine)
    await db.query('DELETE FROM shop_price_tiers WHERE shop_product_id = ?', [prodId]);

    // Übersetzungen
    await db.query(
      `INSERT INTO shop_product_translations (shop_product_id, locale, name, short_description, description)
       VALUES (?, 'de', ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description), description = VALUES(description)`,
      [prodId, prod.de.name, prod.de.short_description, prod.de.description]
    );
    await db.query(
      `INSERT INTO shop_product_translations (shop_product_id, locale, name, short_description, description)
       VALUES (?, 'en', ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description), description = VALUES(description)`,
      [prodId, prod.en.name, prod.en.short_description, prod.en.description]
    );

    console.log(`✓ ${prod.de.name} (${prod.sku}) – PREIS AUF ANFRAGE`);
  }

  console.log(`\n✅ Shop-Seeding abgeschlossen! ${standardProducts.length + inquiryProducts.length} Produkte erfolgreich eingespielt.`);
  console.log('\nPreisberechnung: VK-Handel/m² × 1,515m Bahnbreite = Preis/lfm');
  console.log('Rabattstufen: 0% (1 lfm), 5% (5 lfm), 10% (10 lfm), 15% (20 lfm), 20% (ganze Rolle)');
  process.exit(0);
}

seedShop().catch(err => {
  console.error('Seeding-Fehler:', err);
  process.exit(1);
});
