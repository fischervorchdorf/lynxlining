-- LYNX Lining - Datenbankschema
-- Erstellt: 2026-02-19

CREATE DATABASE IF NOT EXISTS lynxlining
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lynxlining;

-- ===== ADMIN USERS =====
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'editor') DEFAULT 'editor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== SITE SETTINGS =====
CREATE TABLE settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ===== PRODUKTE =====
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  image_path VARCHAR(500),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE product_translations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  locale ENUM('de', 'en') NOT NULL,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500),
  description TEXT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_product_locale (product_id, locale)
);

-- ===== ANWENDUNGSBEREICHE =====
CREATE TABLE applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  image_path VARCHAR(500),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE application_translations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  application_id INT NOT NULL,
  locale ENUM('de', 'en') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  bullet_points JSON,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  UNIQUE KEY uq_application_locale (application_id, locale)
);

-- ===== VORTEILE =====
CREATE TABLE advantages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon_path VARCHAR(500),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE advantage_translations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  advantage_id INT NOT NULL,
  locale ENUM('de', 'en') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  FOREIGN KEY (advantage_id) REFERENCES advantages(id) ON DELETE CASCADE,
  UNIQUE KEY uq_advantage_locale (advantage_id, locale)
);

-- ===== KUNDENREFERENZEN =====
CREATE TABLE customer_references (
  id INT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_path VARCHAR(500),
  website_url VARCHAR(500),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE reference_translations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reference_id INT NOT NULL,
  locale ENUM('de', 'en') NOT NULL,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(255),
  description TEXT,
  FOREIGN KEY (reference_id) REFERENCES customer_references(id) ON DELETE CASCADE,
  UNIQUE KEY uq_reference_locale (reference_id, locale)
);

-- ===== TESTIMONIALS / KUNDENSTIMMEN =====
CREATE TABLE testimonials (
  id INT PRIMARY KEY AUTO_INCREMENT,
  photo_path VARCHAR(500),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE testimonial_translations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  testimonial_id INT NOT NULL,
  locale ENUM('de', 'en') NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  company VARCHAR(255),
  quote TEXT,
  FOREIGN KEY (testimonial_id) REFERENCES testimonials(id) ON DELETE CASCADE,
  UNIQUE KEY uq_testimonial_locale (testimonial_id, locale)
);

-- ===== GALERIE-BILDER =====
CREATE TABLE gallery_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  file_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500),
  category VARCHAR(100),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  width INT,
  height INT,
  file_size INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gallery_image_translations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gallery_image_id INT NOT NULL,
  locale ENUM('de', 'en') NOT NULL,
  title VARCHAR(255),
  alt_text VARCHAR(500),
  caption TEXT,
  FOREIGN KEY (gallery_image_id) REFERENCES gallery_images(id) ON DELETE CASCADE,
  UNIQUE KEY uq_gallery_locale (gallery_image_id, locale)
);

-- ===== INSTAGRAM POSTS =====
CREATE TABLE instagram_posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  instagram_id VARCHAR(100) UNIQUE NOT NULL,
  media_type ENUM('IMAGE', 'VIDEO', 'CAROUSEL_ALBUM') NOT NULL,
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  local_image_path VARCHAR(500),
  permalink VARCHAR(500),
  caption TEXT,
  timestamp DATETIME NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp DESC),
  INDEX idx_visible_featured (is_visible, is_featured)
);

-- ===== NEWS / FIRMENNEWS =====
CREATE TABLE news_posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  image_path VARCHAR(500),
  category ENUM('firmennews', 'presse', 'messe', 'projekt') DEFAULT 'firmennews',
  is_active BOOLEAN DEFAULT TRUE,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE news_post_translations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  news_post_id INT NOT NULL,
  locale ENUM('de', 'en') NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content LONGTEXT,
  FOREIGN KEY (news_post_id) REFERENCES news_posts(id) ON DELETE CASCADE,
  UNIQUE KEY uq_news_locale (news_post_id, locale)
);

-- ===== STATISCHE SEITEN (Impressum, Datenschutz, AGB) =====
CREATE TABLE pages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  page_type ENUM('legal', 'content', 'custom') DEFAULT 'content',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE page_translations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  page_id INT NOT NULL,
  locale ENUM('de', 'en') NOT NULL,
  title VARCHAR(255) NOT NULL,
  meta_description VARCHAR(500),
  content LONGTEXT,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  UNIQUE KEY uq_page_locale (page_id, locale)
);

-- ===== KONTAKTFORMULAR-EINGÄNGE =====
CREATE TABLE contact_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(500),
  message TEXT NOT NULL,
  ip_address VARCHAR(45),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== DOWNLOADS / PDFs =====
CREATE TABLE downloads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  file_path VARCHAR(500) NOT NULL,
  cover_image_path VARCHAR(500),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  download_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE download_translations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  download_id INT NOT NULL,
  locale ENUM('de', 'en') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  FOREIGN KEY (download_id) REFERENCES downloads(id) ON DELETE CASCADE,
  UNIQUE KEY uq_download_locale (download_id, locale)
);

-- ===== SHOP: PRODUKTE MIT STAFFELPREISEN =====
CREATE TABLE shop_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  sku VARCHAR(50),
  image_path VARCHAR(500),
  unit VARCHAR(20) DEFAULT 'lfm',  -- lfm = Laufmeter
  min_quantity DECIMAL(10,2) DEFAULT 1.00,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE shop_product_translations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shop_product_id INT NOT NULL,
  locale ENUM('de', 'en') NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_description VARCHAR(500),
  description TEXT,
  FOREIGN KEY (shop_product_id) REFERENCES shop_products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_shop_product_locale (shop_product_id, locale)
);

-- Staffelpreise pro Shop-Produkt
CREATE TABLE shop_price_tiers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shop_product_id INT NOT NULL,
  min_quantity DECIMAL(10,2) NOT NULL,  -- Ab dieser Menge gilt der Preis
  price_per_unit DECIMAL(10,2) NOT NULL, -- Preis pro Laufmeter/Einheit
  FOREIGN KEY (shop_product_id) REFERENCES shop_products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_product_tier (shop_product_id, min_quantity)
);

-- Bestellungen
CREATE TABLE shop_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  -- Kundendaten
  customer_name VARCHAR(255) NOT NULL,
  customer_company VARCHAR(255),
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_street VARCHAR(255),
  customer_zip VARCHAR(20),
  customer_city VARCHAR(255),
  customer_country VARCHAR(100) DEFAULT 'Österreich',
  customer_message TEXT,
  -- Bestellstatus
  status ENUM('neu', 'bestätigt', 'in_bearbeitung', 'versendet', 'abgeschlossen', 'storniert') DEFAULT 'neu',
  total_amount DECIMAL(10,2),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bestellpositionen
CREATE TABLE shop_order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  shop_product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) DEFAULT 'lfm',
  price_per_unit DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES shop_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (shop_product_id) REFERENCES shop_products(id)
);
