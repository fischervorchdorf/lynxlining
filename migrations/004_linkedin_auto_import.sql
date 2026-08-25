-- LinkedIn Auto-Import
-- Ergänzt die Herkunftsspalten, über die importierte von manuell gepflegten
-- Beiträgen unterschieden werden und Doppel-Importe verhindert werden.
-- Die Anwendung legt diese Spalten beim Start selbst an (src/config/linkedin.js,
-- ensureSchema); dieses Skript ist die manuelle Entsprechung dazu.
-- Erstellt: 2026-08-25

ALTER TABLE linkedin_posts ADD COLUMN source_guid VARCHAR(255) NULL;
ALTER TABLE linkedin_posts ADD COLUMN source VARCHAR(30) NOT NULL DEFAULT 'manual';
ALTER TABLE linkedin_posts ADD COLUMN imported_at DATETIME NULL;
-- 1 = englische Fassung ist nur eine Kopie des deutschen Textes
ALTER TABLE linkedin_posts ADD COLUMN needs_translation BOOLEAN NOT NULL DEFAULT 0;

-- Verhindert, dass derselbe Beitrag bei jedem Feed-Abruf erneut angelegt wird
ALTER TABLE linkedin_posts ADD UNIQUE KEY uq_source_guid (source_guid);

-- Kontrolle:
-- SELECT id, slug, source, imported_at, needs_translation FROM linkedin_posts ORDER BY published_at DESC;
