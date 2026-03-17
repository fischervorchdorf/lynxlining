/**
 * Fix: Doppelte Testimonials aus der Datenbank entfernen.
 * Behält pro Name nur den Eintrag mit der niedrigsten ID.
 * Ausführen: node src/utils/fix-duplicate-testimonials.js
 */
require('dotenv').config();
const db = require('../config/database');

async function fix() {
  console.log('Suche doppelte Testimonials...\n');

  // Alle Testimonials mit Namen anzeigen
  const [all] = await db.query(`
    SELECT t.id, tt.name, tt.company, t.sort_order
    FROM testimonials t
    JOIN testimonial_translations tt ON t.id = tt.testimonial_id AND tt.locale = 'de'
    ORDER BY tt.name, t.id
  `);

  console.log(`Gefunden: ${all.length} Testimonials in der DB:`);
  all.forEach(r => console.log(`  ID ${r.id}: ${r.name} (${r.company})`));

  if (all.length <= 3) {
    console.log('\nKeine Duplikate gefunden. Alles OK!');
    process.exit(0);
  }

  // Pro Name nur die niedrigste ID behalten
  const [keepIds] = await db.query(`
    SELECT MIN(t.id) as keep_id, tt.name
    FROM testimonials t
    JOIN testimonial_translations tt ON t.id = tt.testimonial_id AND tt.locale = 'de'
    GROUP BY tt.name
  `);

  const idsToKeep = keepIds.map(r => r.keep_id);
  console.log(`\nBehalte IDs: ${idsToKeep.join(', ')}`);

  // Duplikate löschen (CASCADE löscht auch Translations)
  const [result] = await db.query(`DELETE FROM testimonials WHERE id NOT IN (?)`, [idsToKeep]);
  console.log(`\n✅ ${result.affectedRows} Duplikate gelöscht. Verbleibend: ${idsToKeep.length} Testimonials.`);

  process.exit(0);
}

fix().catch(err => {
  console.error('Fehler:', err);
  process.exit(1);
});
