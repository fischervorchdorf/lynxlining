-- LinkedIn-Slugs bereinigen: Ein Slug wurde mit Leerzeichen und Umlauten
-- gespeichert und erzeugte eine ungültige URL in der Sitemap.
-- Der Admin-Bereich normalisiert Slugs seither automatisch (slugify in admin.js);
-- dieses Skript korrigiert den Altbestand.
-- Erstellt: 2026-08-23

UPDATE linkedin_posts
SET slug = 'lynx-lining-tpu-verschleissschutzauskleidungen'
WHERE slug = 'LYNX Lining TPU Verschleißschutzauskleidungen';

-- Kontrolle: es dürfen keine Slugs mit Leerzeichen oder Großbuchstaben übrig sein
-- SELECT id, slug FROM linkedin_posts WHERE slug REGEXP '[^a-z0-9-]';
