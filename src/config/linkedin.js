/**
 * LinkedIn-Auto-Import
 * ====================
 * LinkedIn bietet für persönliche Profile KEINE offizielle API und keinen
 * öffentlichen RSS-Feed. Direktes Auslesen von
 * linkedin.com/in/<profil>/recent-activity/ ist technisch blockiert (Login-Wall)
 * und laut LinkedIn-Nutzungsbedingungen nicht erlaubt.
 *
 * Dieses Modul importiert LinkedIn-Beiträge deshalb über zwei erlaubte Wege:
 *
 *   1. FEED  – Ein Feed-Dienst (z. B. rss.app, Feedspot, Make/Zapier-RSS)
 *              erzeugt aus dem LinkedIn-Profil oder der Unternehmensseite einen
 *              RSS-/Atom-/JSON-Feed. Der Server pollt diesen Feed regelmäßig.
 *              -> ENV: LINKEDIN_FEED_URL
 *
 *   2. WEBHOOK – Zapier / Make / n8n / IFTTT schicken jeden neuen Beitrag per
 *              POST an /api/linkedin/webhook.
 *              -> ENV: LINKEDIN_WEBHOOK_TOKEN
 *
 * Zusätzlich: importFromUrl() holt zu einer einzelnen, von Hand eingefügten
 * Beitrags-URL die Open-Graph-Metadaten (Titel, Text, Bild), damit im Admin
 * nichts abgetippt werden muss.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./database');
const { translatePost, isEnabled: translationEnabled } = require('./translate');

const DEFAULT_AUTHOR = process.env.LINKEDIN_AUTHOR_NAME || 'Martin F. Heidecker';
const IMAGE_DIR = path.join(__dirname, '..', 'public', 'images', 'linkedin');
const USER_AGENT = 'Mozilla/5.0 (compatible; LynxLiningBot/1.0; +https://lynx-lining.com)';
const MAX_BODY_BYTES = 5 * 1024 * 1024;

// ============================================================
// SCHEMA
// ============================================================

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS linkedin_posts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      slug VARCHAR(255),
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

  await db.query(`
    CREATE TABLE IF NOT EXISTS linkedin_post_translations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      linkedin_post_id INT NOT NULL,
      locale ENUM('de', 'en') NOT NULL,
      title VARCHAR(255) NOT NULL,
      excerpt TEXT,
      content MEDIUMTEXT,
      FOREIGN KEY (linkedin_post_id) REFERENCES linkedin_posts(id) ON DELETE CASCADE,
      UNIQUE KEY uq_linkedin_locale (linkedin_post_id, locale)
    )
  `);

  // Spalten für den Auto-Import ergänzen (idempotent)
  const columns = [
    ['source_guid', "VARCHAR(255) NULL"],
    ['source', "VARCHAR(30) NOT NULL DEFAULT 'manual'"],
    ['imported_at', 'DATETIME NULL'],
    ['needs_translation', 'BOOLEAN NOT NULL DEFAULT 0']
  ];

  for (const [name, definition] of columns) {
    try {
      const [rows] = await db.query('SHOW COLUMNS FROM linkedin_posts LIKE ?', [name]);
      if (!rows.length) {
        await db.query(`ALTER TABLE linkedin_posts ADD COLUMN ${name} ${definition}`);
        console.log(`LinkedIn: Spalte ${name} ergänzt`);
      }
    } catch (err) {
      console.warn(`LinkedIn Schema (${name}):`, err.message);
    }
  }

  // UNIQUE KEY auf source_guid verhindert Doppel-Importe
  try {
    const [keys] = await db.query("SHOW INDEX FROM linkedin_posts WHERE Key_name = 'uq_source_guid'");
    if (!keys.length) {
      await db.query(`
        DELETE t1 FROM linkedin_posts t1
        INNER JOIN linkedin_posts t2
        WHERE t1.id > t2.id AND t1.source_guid IS NOT NULL AND t1.source_guid = t2.source_guid
      `);
      await db.query('ALTER TABLE linkedin_posts ADD UNIQUE KEY uq_source_guid (source_guid)');
      console.log('LinkedIn: UNIQUE KEY uq_source_guid angelegt');
    }
  } catch (err) {
    console.warn('LinkedIn Schema (uq_source_guid):', err.message);
  }

  schemaReady = true;
}

// ============================================================
// FEED-SYNC
// ============================================================

/**
 * Holt den konfigurierten Feed und importiert alle noch unbekannten Beiträge.
 * @returns {Promise<{success: boolean, imported?: number, skipped?: number, reason?: string}>}
 */
async function syncLinkedInFeed() {
  const feedUrl = process.env.LINKEDIN_FEED_URL;
  if (!feedUrl) {
    return { success: false, reason: 'no_feed_url' };
  }

  try {
    await ensureSchema();
    const body = await fetchText(feedUrl);
    const items = parseFeed(body);

    if (!items.length) {
      console.log('LinkedIn Sync: Feed enthält keine Beiträge');
      return { success: true, imported: 0, skipped: 0 };
    }

    let imported = 0;
    let skipped = 0;

    // Älteste zuerst importieren, damit sort_order/IDs chronologisch laufen
    for (const item of items.slice().reverse()) {
      const result = await savePost(item, 'feed');
      if (result.created) imported++;
      else skipped++;
    }

    console.log(`LinkedIn Sync: ${imported} neu importiert, ${skipped} bereits vorhanden`);
    return { success: true, imported, skipped };
  } catch (err) {
    console.error('LinkedIn Sync Fehler:', err.message);
    return { success: false, reason: err.message };
  }
}

/**
 * Speichert einen normalisierten Beitrag. Bereits bekannte GUIDs werden
 * übersprungen (kein Überschreiben – manuelle Korrekturen bleiben erhalten).
 */
async function savePost(item, source) {
  await ensureSchema();

  const guid = item.guid || item.url;
  if (!guid) return { created: false, reason: 'no_guid' };

  const [existing] = await db.query(
    'SELECT id FROM linkedin_posts WHERE source_guid = ? OR (linkedin_url = ? AND linkedin_url != "") LIMIT 1',
    [guid, item.url || '']
  );
  if (existing.length) return { created: false, id: existing[0].id, reason: 'exists' };

  const title = item.title || buildTitle(item.text) || 'LinkedIn-Beitrag';
  const excerpt = item.excerpt || buildExcerpt(item.text, title);
  const publishedAt = toMysqlDate(item.publishedAt) || toMysqlDate(new Date());
  const autoPublish = process.env.LINKEDIN_AUTO_PUBLISH !== 'false';

  let imagePath = '';
  if (item.image) {
    imagePath = await downloadImage(item.image, guid);
  }

  const slug = await uniqueSlug(title, guid);

  const content = item.text || excerpt;
  const german = { title, excerpt, content };

  // Englische Fassung übersetzen lassen. Schlägt das fehl (Rate-Limit,
  // Netzwerkfehler), wird der deutsche Text gespeichert und der Beitrag als
  // übersetzungsbedürftig markiert.
  const translation = await translatePost(german);
  const english = translation.ok ? translation.translation : null;
  if (!translation.ok) console.warn('Übersetzung beim Import fehlgeschlagen:', translation.error);

  const [result] = await db.query(
    `INSERT INTO linkedin_posts
       (slug, linkedin_url, image_path, author_name, published_at, is_visible, sort_order, source_guid, source, imported_at, needs_translation)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, NOW(), ?)`,
    [
      slug,
      item.url || '',
      imagePath,
      item.author || DEFAULT_AUTHOR,
      publishedAt,
      autoPublish ? 1 : 0,
      guid,
      source,
      english ? 0 : 1
    ]
  );

  const postId = result.insertId;
  const en = english || german;

  await db.query(
    `INSERT INTO linkedin_post_translations (linkedin_post_id, locale, title, excerpt, content)
     VALUES (?, 'de', ?, ?, ?), (?, 'en', ?, ?, ?)`,
    [postId, german.title, german.excerpt, german.content, postId, en.title, en.excerpt, en.content]
  );

  return { created: true, id: postId, slug, translated: !!english };
}

// ============================================================
// EINZEL-IMPORT ÜBER BEITRAGS-URL (Open Graph)
// ============================================================

/**
 * Liest die Open-Graph-Metadaten einer LinkedIn-Beitrags-URL aus.
 * LinkedIn liefert diese nicht immer an nicht eingeloggte Clients aus –
 * schlägt das fehl, kommt ein leeres Ergebnis zurück und der Admin füllt
 * das Formular von Hand.
 */
async function fetchPostMetadata(url) {
  const html = await fetchText(url);
  const meta = (property) => {
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`, 'i')
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return decodeEntities(match[1]);
    }
    return '';
  };

  const description = meta('og:description') || meta('description');
  return {
    guid: canonicalGuid(url),
    url,
    title: meta('og:title'),
    text: description,
    image: meta('og:image'),
    author: meta('article:author') || DEFAULT_AUTHOR,
    publishedAt: meta('article:published_time') || null
  };
}

async function importFromUrl(url) {
  await ensureSchema();
  let item;
  try {
    item = await fetchPostMetadata(url);
  } catch (err) {
    console.warn('LinkedIn URL-Import: Metadaten nicht lesbar –', err.message);
    item = { guid: canonicalGuid(url), url, title: '', text: '', image: '' };
  }

  if (!item.title && !item.text) {
    return { success: false, reason: 'no_metadata', item };
  }

  const saved = await savePost(item, 'url');
  return { success: saved.created, reason: saved.reason, id: saved.id, item };
}

// ============================================================
// FEED-PARSER (RSS 2.0, Atom, JSON Feed)
// ============================================================

function parseFeed(body) {
  const trimmed = body.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return parseJsonFeed(trimmed);
  if (/<entry[\s>]/i.test(trimmed)) return parseAtom(trimmed);
  return parseRss(trimmed);
}

function parseJsonFeed(body) {
  let data;
  try {
    data = JSON.parse(body);
  } catch (err) {
    throw new Error('Feed ist kein gültiges JSON: ' + err.message);
  }

  const items = Array.isArray(data) ? data : (data.items || data.data || data.posts || []);
  return items.map((entry) => {
    const text = stripHtml(entry.content_html || entry.content_text || entry.content || entry.text || entry.summary || '');
    const url = entry.url || entry.link || entry.permalink || '';
    return {
      guid: entry.id || entry.guid || canonicalGuid(url) || hash(text),
      url,
      title: entry.title ? stripHtml(entry.title) : '',
      text,
      image: entry.image || entry.banner_image || (entry.attachments && entry.attachments[0] && entry.attachments[0].url) || '',
      author: (entry.author && (entry.author.name || entry.author)) || DEFAULT_AUTHOR,
      publishedAt: entry.date_published || entry.published || entry.pubDate || null
    };
  });
}

function parseRss(xml) {
  return matchAll(xml, /<item[\s>][\s\S]*?<\/item>/gi).map((block) => {
    const description = tag(block, 'content:encoded') || tag(block, 'description') || '';
    const url = tag(block, 'link') || attr(block, 'guid', 'isPermaLink="true"') || '';
    return {
      guid: tag(block, 'guid') || canonicalGuid(url) || hash(description),
      url,
      title: stripHtml(tag(block, 'title')),
      text: stripHtml(description),
      image: findImage(block, description),
      author: stripHtml(tag(block, 'dc:creator') || tag(block, 'author')) || DEFAULT_AUTHOR,
      publishedAt: tag(block, 'pubDate') || tag(block, 'dc:date') || null
    };
  });
}

function parseAtom(xml) {
  return matchAll(xml, /<entry[\s>][\s\S]*?<\/entry>/gi).map((block) => {
    const content = tag(block, 'content') || tag(block, 'summary') || '';
    const linkMatch = block.match(/<link[^>]+href=["']([^"']+)["']/i);
    const url = linkMatch ? decodeEntities(linkMatch[1]) : '';
    return {
      guid: tag(block, 'id') || canonicalGuid(url) || hash(content),
      url,
      title: stripHtml(tag(block, 'title')),
      text: stripHtml(content),
      image: findImage(block, content),
      author: stripHtml(tag(block, 'name')) || DEFAULT_AUTHOR,
      publishedAt: tag(block, 'published') || tag(block, 'updated') || null
    };
  });
}

function findImage(block, description) {
  const enclosure = block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i);
  if (enclosure) return decodeEntities(enclosure[1]);

  const media = block.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i);
  if (media) return decodeEntities(media[1]);

  const img = String(description).match(/<img[^>]+src=["']([^"']+)["']/i);
  if (img) return decodeEntities(img[1]);

  return '';
}

// ============================================================
// HILFSFUNKTIONEN
// ============================================================

function matchAll(str, regex) {
  return str.match(regex) || [];
}

function tag(block, name) {
  const escaped = name.replace(/:/g, '\\:');
  const match = block.match(new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)</${escaped}>`, 'i'));
  if (!match) return '';
  return unwrapCdata(match[1]).trim();
}

function attr(block, tagName, marker) {
  const match = block.match(new RegExp(`<${tagName}[^>]*${marker}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i'));
  return match ? unwrapCdata(match[1]).trim() : '';
}

function unwrapCdata(str) {
  const match = String(str).match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return match ? match[1] : String(str);
}

function stripHtml(str) {
  if (!str) return '';

  const removeTags = (input) => input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '');

  // Manche Feeds liefern HTML doppelt kodiert (&lt;p&gt;...). Nach dem ersten
  // Dekodieren stehen dann echte Tags im Text - deshalb ein zweiter Durchgang.
  let text = decodeEntities(removeTags(unwrapCdata(str)));
  if (/<[a-z][^>]*>/i.test(text)) text = decodeEntities(removeTags(text));

  return text.replace(/\n{3,}/g, '\n\n').trim();
}

const NAMED_ENTITIES = {
  lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  auml: '\u00e4', ouml: '\u00f6', uuml: '\u00fc',
  Auml: '\u00c4', Ouml: '\u00d6', Uuml: '\u00dc',
  szlig: '\u00df', euro: '\u20ac', deg: '\u00b0',
  eacute: '\u00e9', egrave: '\u00e8', agrave: '\u00e0', ccedil: '\u00e7',
  hellip: '\u2026', ndash: '\u2013', mdash: '\u2014',
  laquo: '\u00ab', raquo: '\u00bb', bdquo: '\u201e', ldquo: '\u201c', rdquo: '\u201d',
  lsquo: '\u2018', rsquo: '\u2019', sbquo: '\u201a',
  bull: '\u2022', middot: '\u00b7', copy: '\u00a9', reg: '\u00ae', trade: '\u2122',
  sup2: '\u00b2', sup3: '\u00b3', frac12: '\u00bd', times: '\u00d7'
};

function decodeEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&#(\d+);/g, (_, code) => safeCodePoint(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => safeCodePoint(parseInt(code, 16)))
    // &amp; wird bewusst uebersprungen und erst danach ersetzt, damit aus
    // "&amp;ouml;" nicht vorzeitig ein Umlaut wird.
    .replace(/&([a-z][a-z0-9]{1,10});/gi, (match, name) =>
      Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name) ? NAMED_ENTITIES[name] : match)
    .replace(/&amp;/g, '&');
}

function safeCodePoint(code) {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return '';
  try { return String.fromCodePoint(code); } catch (e) { return ''; }
}

/** Erste sinnvolle Zeile des Beitrags als Titel (max. 90 Zeichen). */
function buildTitle(text) {
  if (!text) return '';
  const firstLine = text.split('\n').map(l => l.trim()).find(l => l.length > 0) || '';
  const clean = firstLine.replace(/\s+/g, ' ');
  if (clean.length <= 90) return clean;

  const cut = clean.substring(0, 90);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.substring(0, lastSpace) : cut) + '…';
}

/** Anriss: Text ohne die Titelzeile, gekürzt auf ~220 Zeichen. */
function buildExcerpt(text, title) {
  if (!text) return '';
  const full = text.replace(/\s+/g, ' ').trim();
  let rest = full;

  // Steht die Titelzeile vollstaendig im Text, wird sie im Anriss nicht wiederholt.
  // Bei einem gekuerzten Titel (endet auf Ellipse) bliebe sonst ein Satzfragment
  // stehen - dann beginnt der Anriss bewusst wieder von vorne.
  const titleText = String(title || '').trim();
  if (titleText && !titleText.endsWith('…') && full.startsWith(titleText)) {
    const stripped = full.substring(titleText.length).trim();
    if (stripped) rest = stripped;
  }
  if (rest.length <= 220) return rest;

  const cut = rest.substring(0, 220);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 100 ? cut.substring(0, lastSpace) : cut) + '…';
}

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80)
    .replace(/-+$/g, '');
}

/** Slug aus dem Titel, bei Kollision mit Hash-Suffix aus der GUID. */
async function uniqueSlug(title, guid) {
  const base = slugify(title) || 'linkedin-beitrag';
  const [rows] = await db.query('SELECT id FROM linkedin_posts WHERE slug = ? LIMIT 1', [base]);
  if (!rows.length) return base;
  return `${base}-${hash(guid).substring(0, 6)}`;
}

function hash(str) {
  return crypto.createHash('sha1').update(String(str)).digest('hex');
}

/** LinkedIn-Beitrags-URL ohne Tracking-Parameter als stabile Kennung. */
function canonicalGuid(url) {
  if (!url) return '';
  const clean = String(url).split('?')[0].replace(/\/$/, '');
  const activity = clean.match(/activity[-:](\d+)/i);
  return activity ? `urn:li:activity:${activity[1]}` : clean;
}

function toMysqlDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function downloadImage(url, guid) {
  if (!url) return '';
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

  const filename = `li_${hash(guid).substring(0, 16)}.jpg`;
  const filePath = path.join(IMAGE_DIR, filename);

  try {
    await downloadFile(url, filePath);
    return '/images/linkedin/' + filename;
  } catch (err) {
    console.warn('LinkedIn Bild-Download fehlgeschlagen:', err.message);
    return '';
  }
}

// ============================================================
// HTTP
// ============================================================

function fetchText(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Zu viele Weiterleitungen'));

    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, { headers: { 'User-Agent': USER_AGENT, 'Accept': '*/*' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        const next = new URL(res.headers.location, url).toString();
        return fetchText(next, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode + ' für ' + url));
      }

      let body = '';
      let size = 0;
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        size += Buffer.byteLength(chunk);
        if (size > MAX_BODY_BYTES) {
          request.destroy();
          return reject(new Error('Antwort zu groß'));
        }
        body += chunk;
      });
      res.on('end', () => resolve(body));
    });

    request.on('error', reject);
    request.setTimeout(20000, () => {
      request.destroy();
      reject(new Error('Timeout beim Abruf von ' + url));
    });
  });
}

function downloadFile(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Zu viele Weiterleitungen'));

    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        const next = new URL(res.headers.location, url).toString();
        return downloadFile(next, dest, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode));
      }

      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
      file.on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    });

    request.on('error', reject);
    request.setTimeout(20000, () => {
      request.destroy();
      reject(new Error('Timeout beim Bild-Download'));
    });
  });
}

/**
 * Übersetzt einen bereits gespeicherten Beitrag nachträglich ins Englische.
 * Wird im Admin über den Button "Englisch übersetzen" ausgelöst.
 */
async function translateExistingPost(postId) {
  await ensureSchema();

  if (!translationEnabled()) return { success: false, reason: 'no_api_key' };

  const [rows] = await db.query(
    'SELECT title, excerpt, content FROM linkedin_post_translations WHERE linkedin_post_id = ? AND locale = "de"',
    [postId]
  );
  if (!rows.length) return { success: false, reason: 'not_found' };

  const result = await translatePost(rows[0]);
  if (!result.ok) return { success: false, reason: 'translation_failed', error: result.error };

  const english = result.translation;

  await db.query(
    `INSERT INTO linkedin_post_translations (linkedin_post_id, locale, title, excerpt, content)
     VALUES (?, 'en', ?, ?, ?)
     ON DUPLICATE KEY UPDATE title = VALUES(title), excerpt = VALUES(excerpt), content = VALUES(content)`,
    [postId, english.title, english.excerpt, english.content]
  );
  // Bei Teilerfolg (ein Feld blieb deutsch) bleibt die Markierung stehen
  await db.query('UPDATE linkedin_posts SET needs_translation = ? WHERE id = ?', [result.partial ? 1 : 0, postId]);

  return { success: true, provider: result.provider, partial: !!result.partial, error: result.error || null };
}

module.exports = {
  ensureSchema,
  translateExistingPost,
  syncLinkedInFeed,
  savePost,
  importFromUrl,
  fetchPostMetadata,
  // Export für Tests / Wiederverwendung
  parseFeed,
  buildTitle,
  buildExcerpt,
  slugify,
  canonicalGuid
};
