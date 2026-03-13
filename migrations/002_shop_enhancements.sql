-- Shop-Erweiterungen: Preis auf Anfrage, Rollendaten, erweiterte Produktdaten
-- Erstellt: 2026-03-13

-- Neue Spalten für shop_products
ALTER TABLE shop_products
  ADD COLUMN price_on_request BOOLEAN DEFAULT FALSE AFTER is_active,
  ADD COLUMN price_per_sqm DECIMAL(10,2) DEFAULT NULL AFTER price_on_request,
  ADD COLUMN sqm_per_roll DECIMAL(10,2) DEFAULT NULL AFTER price_per_sqm,
  ADD COLUMN roll_length_lfm DECIMAL(10,2) DEFAULT NULL AFTER sqm_per_roll,
  ADD COLUMN roll_width_mm INT DEFAULT NULL AFTER roll_length_lfm,
  ADD COLUMN roll_weight_kg DECIMAL(10,2) DEFAULT NULL AFTER roll_width_mm,
  ADD COLUMN roll_outer_diameter_mm INT DEFAULT NULL AFTER roll_weight_kg,
  ADD COLUMN roll_core_diameter_mm INT DEFAULT NULL AFTER roll_outer_diameter_mm,
  ADD COLUMN roll_core_width_mm INT DEFAULT NULL AFTER roll_core_diameter_mm;
