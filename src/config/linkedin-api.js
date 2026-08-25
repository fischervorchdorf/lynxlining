/**
 * LinkedIn Community Management API
 * =================================
 * Offizieller Weg, Beiträge einer LinkedIn-UNTERNEHMENSSEITE auszulesen.
 *
 * Wichtig: Für persönliche Profile gibt es diesen Weg nicht. Die dafür nötige
 * Berechtigung r_member_social vergibt LinkedIn seit Jahren nicht mehr an neue
 * Entwickler. Beiträge von Martin Heideckers Profil sind über keine offizielle
 * Schnittstelle abrufbar – auch nicht mit seinen Zugangsdaten.
 *
 * Voraussetzungen (siehe docs/linkedin-automatik.md):
 *   - LinkedIn-Unternehmensseite für LYNX Lining
 *   - LinkedIn-App, mit der Seite verknüpft und von einem Seiten-Admin bestätigt
 *   - freigeschaltetes Produkt "Community Management API" (Prüfung 1–4 Wochen)
 *   - LINKEDIN_CLIENT_ID und LINKEDIN_CLIENT_SECRET
 *
 * Die Verbindung wird einmalig im Admin über "Mit LinkedIn verbinden"
 * hergestellt. LinkedIn-Zugriffstoken laufen nach 60 Tagen ab; ohne
 * Marketing-Developer-Partnerstatus vergibt LinkedIn keine Refresh-Token,
 * die Verbindung muss dann alle 60 Tage erneuert werden. Der Admin-Bereich
 * zeigt die Restlaufzeit an.
 */

const db = require('./database');
const linkedin = require('./linkedin');

const AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const API_BASE = 'https://api.linkedin.com/rest';

// LinkedIn verlangt eine Versionsangabe im Format YYYYMM
const API_VERSION = process.env.LINKEDIN_API_VERSION || '202606';

// r_organization_social  – Beiträge der Seite lesen
// rw_organization_admin  – ermitteln, welche Seiten der Nutzer verwaltet
const SCOPES = ['r_organization_social', 'rw_organization_admin'];

const REQUEST_TIMEOUT_MS = 20000;

// ============================================================
// KONFIGURATION
// ============================================================

function isConfigured() {
  return !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
}

function redirectUri() {
  if (process.env.LINKEDIN_REDIRECT_URI) return process.env.LINKEDIN_REDIRECT_URI;
  const siteUrl = (process.env.SITE_URL || 'https://lynx-lining.com').replace(/\/$/, '');
  return `${siteUrl}/admin/linkedin/callback`;
}

// ============================================================
// SCHEMA
// ============================================================

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS linkedin_oauth (
      id INT PRIMARY KEY AUTO_INCREMENT,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at DATETIME NOT NULL,
      refresh_expires_at DATETIME,
      organization_urn VARCHAR(100),
      organization_name VARCHAR(255),
      scope VARCHAR(500),
      connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  schemaReady = true;
}

// ============================================================
// OAUTH
// ============================================================

/**
 * Adresse, auf die der Admin geschickt wird, um die Verbindung zu erlauben.
 * @param {string} state Zufallswert gegen CSRF, wird in der Session hinterlegt
 */
function getAuthUrl(state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: redirectUri(),
    state,
    scope: SCOPES.join(' ')
  });
  return `${AUTH_URL}?${params.toString()}`;
}

/**
 * Tauscht den Rückgabe-Code gegen ein Zugriffstoken und speichert es.
 */
async function exchangeCode(code) {
  await ensureSchema();

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    client_id: process.env.LINKEDIN_CLIENT_ID,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET
  });

  const res = await request(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!res.ok) {
    throw new Error(`Token-Abruf fehlgeschlagen (HTTP ${res.status}): ${describeError(res.data)}`);
  }

  const data = res.data;
  if (!data.access_token) throw new Error('LinkedIn hat kein Zugriffstoken geliefert.');

  await saveToken({
    accessToken: data.access_token,
    refreshToken: data.refresh_token || null,
    expiresIn: data.expires_in,
    refreshExpiresIn: data.refresh_token_expires_in || null,
    scope: data.scope || SCOPES.join(' ')
  });

  // Direkt die verwaltete Seite ermitteln und merken
  try {
    const orgs = await listOrganizations();
    if (orgs.length) await setOrganization(orgs[0].urn, orgs[0].name);
    return { success: true, organizations: orgs };
  } catch (err) {
    // Verbindung steht, nur die Seitenliste fehlt – im Admin nachholbar
    console.warn('LinkedIn: Seitenliste nicht abrufbar:', err.message);
    return { success: true, organizations: [] };
  }
}

async function saveToken({ accessToken, refreshToken, expiresIn, refreshExpiresIn, scope }) {
  const expiresAt = new Date(Date.now() + (expiresIn || 5184000) * 1000);
  const refreshExpiresAt = refreshExpiresIn ? new Date(Date.now() + refreshExpiresIn * 1000) : null;

  const [rows] = await db.query('SELECT id FROM linkedin_oauth ORDER BY id LIMIT 1');

  if (rows.length) {
    await db.query(
      `UPDATE linkedin_oauth
          SET access_token = ?, refresh_token = ?, expires_at = ?, refresh_expires_at = ?, scope = ?
        WHERE id = ?`,
      [accessToken, refreshToken, toMysqlDate(expiresAt), toMysqlDate(refreshExpiresAt), scope, rows[0].id]
    );
  } else {
    await db.query(
      `INSERT INTO linkedin_oauth (access_token, refresh_token, expires_at, refresh_expires_at, scope)
       VALUES (?, ?, ?, ?, ?)`,
      [accessToken, refreshToken, toMysqlDate(expiresAt), toMysqlDate(refreshExpiresAt), scope]
    );
  }
}

async function getConnection() {
  await ensureSchema();
  const [rows] = await db.query('SELECT * FROM linkedin_oauth ORDER BY id LIMIT 1');
  return rows.length ? rows[0] : null;
}

async function setOrganization(urn, name) {
  await ensureSchema();
  await db.query(
    'UPDATE linkedin_oauth SET organization_urn = ?, organization_name = ? ORDER BY id LIMIT 1',
    [urn, name || null]
  );
}

async function disconnect() {
  await ensureSchema();
  await db.query('DELETE FROM linkedin_oauth');
}

/**
 * Gültiges Zugriffstoken holen. Ist ein Refresh-Token vorhanden (nur bei
 * Marketing-Developer-Partnern), wird kurz vor Ablauf automatisch erneuert.
 */
async function getAccessToken() {
  const conn = await getConnection();
  if (!conn) return null;

  const expiresAt = new Date(conn.expires_at).getTime();
  const daysLeft = (expiresAt - Date.now()) / 86400000;

  if (daysLeft > 1) return conn.access_token;

  if (conn.refresh_token) {
    const refreshed = await refreshAccessToken(conn.refresh_token);
    if (refreshed) return refreshed;
  }

  if (daysLeft <= 0) {
    console.warn('LinkedIn: Zugriffstoken abgelaufen – Verbindung im Admin erneuern');
    return null;
  }
  return conn.access_token;
}

async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: process.env.LINKEDIN_CLIENT_ID,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET
  });

  const res = await request(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!res.ok || !res.data.access_token) {
    console.warn('LinkedIn: Token-Erneuerung fehlgeschlagen:', describeError(res.data));
    return null;
  }

  await saveToken({
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token || refreshToken,
    expiresIn: res.data.expires_in,
    refreshExpiresIn: res.data.refresh_token_expires_in || null,
    scope: res.data.scope || SCOPES.join(' ')
  });

  console.log('LinkedIn: Zugriffstoken erneuert');
  return res.data.access_token;
}

// ============================================================
// API-ABFRAGEN
// ============================================================

/** Unternehmensseiten, die der verbundene Nutzer verwaltet. */
async function listOrganizations() {
  const token = await getAccessToken();
  if (!token) throw new Error('Keine gültige LinkedIn-Verbindung.');

  const url = `${API_BASE}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED` +
    '&projection=(elements*(organization~(id,localizedName)))';

  const res = await apiGet(url, token);
  const elements = (res.data && res.data.elements) || [];

  return elements.map((entry) => {
    const org = entry['organization~'] || {};
    const urn = entry.organization || (org.id ? `urn:li:organization:${org.id}` : '');
    return { urn, name: org.localizedName || urn };
  }).filter(o => o.urn);
}

/**
 * Beiträge der verbundenen Unternehmensseite abrufen und importieren.
 */
async function syncOrganizationPosts() {
  if (!isConfigured()) return { success: false, reason: 'not_configured' };

  const conn = await getConnection();
  if (!conn) return { success: false, reason: 'not_connected' };
  if (!conn.organization_urn) return { success: false, reason: 'no_organization' };

  const token = await getAccessToken();
  if (!token) return { success: false, reason: 'token_expired' };

  try {
    const url = `${API_BASE}/posts?q=author&author=${encodeURIComponent(conn.organization_urn)}` +
      '&count=25&sortBy=CREATED';

    const res = await apiGet(url, token);
    if (!res.ok) {
      return { success: false, reason: `HTTP ${res.status}: ${describeError(res.data)}` };
    }

    const posts = (res.data && res.data.elements) || [];
    if (!posts.length) return { success: true, imported: 0, skipped: 0 };

    let imported = 0;
    let skipped = 0;

    // Älteste zuerst, damit die Reihenfolge auf der Website stimmt
    for (const post of posts.slice().reverse()) {
      const item = await mapPost(post, token, conn.organization_name);
      if (!item) { skipped++; continue; }

      const result = await linkedin.savePost(item, 'api');
      if (result.created) imported++;
      else skipped++;
    }

    console.log(`LinkedIn API Sync: ${imported} neu importiert, ${skipped} übersprungen`);
    return { success: true, imported, skipped };
  } catch (err) {
    console.error('LinkedIn API Sync Fehler:', err.message);
    return { success: false, reason: err.message };
  }
}

/** Einen API-Beitrag in die Form bringen, die savePost() erwartet. */
async function mapPost(post, token, orgName) {
  // Entwürfe und zurückgezogene Beiträge nicht übernehmen
  if (post.lifecycleState && post.lifecycleState !== 'PUBLISHED') return null;
  if (post.visibility && post.visibility !== 'PUBLIC') return null;

  const text = String(post.commentary || '').trim();
  const id = post.id || '';
  if (!text && !id) return null;

  const publishedAt = post.publishedAt || post.createdAt || post.firstPublishedAt || null;

  return {
    guid: id,
    url: id ? `https://www.linkedin.com/feed/update/${id}/` : '',
    title: '',                       // Titel wird aus der ersten Textzeile gebildet
    text,
    image: await resolveImage(post, token),
    author: orgName || undefined,
    publishedAt: publishedAt ? new Date(Number(publishedAt)) : null
  };
}

/** Bild-URN eines Beitrags in eine herunterladbare Adresse auflösen. */
async function resolveImage(post, token) {
  const content = post.content || {};
  const urn =
    (content.media && content.media.id) ||
    (content.multiImage && content.multiImage.images && content.multiImage.images[0] &&
      content.multiImage.images[0].id) ||
    (content.article && content.article.thumbnail) ||
    '';

  if (!urn || !String(urn).startsWith('urn:li:image:')) return '';

  try {
    const res = await apiGet(`${API_BASE}/images/${encodeURIComponent(urn)}`, token);
    if (res.ok && res.data && res.data.downloadUrl) return res.data.downloadUrl;
  } catch (err) {
    console.warn('LinkedIn: Bild nicht auflösbar:', err.message);
  }
  return '';
}

/** Status für die Anzeige im Admin. */
async function getStatus() {
  const status = {
    configured: isConfigured(),
    connected: false,
    organizationName: null,
    organizationUrn: null,
    expiresAt: null,
    daysLeft: null,
    hasRefreshToken: false,
    redirectUri: redirectUri()
  };

  if (!status.configured) return status;

  try {
    const conn = await getConnection();
    if (!conn) return status;

    status.connected = true;
    status.organizationName = conn.organization_name;
    status.organizationUrn = conn.organization_urn;
    status.expiresAt = conn.expires_at;
    status.hasRefreshToken = !!conn.refresh_token;
    status.daysLeft = Math.floor((new Date(conn.expires_at).getTime() - Date.now()) / 86400000);
  } catch (e) {
    // Tabelle noch nicht angelegt
  }

  return status;
}

// ============================================================
// HTTP
// ============================================================

async function apiGet(url, token) {
  return request(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'LinkedIn-Version': API_VERSION,
      'X-Restli-Protocol-Version': '2.0.0'
    }
  });
}

async function request(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const raw = await res.text();

    let data;
    try { data = raw ? JSON.parse(raw) : {}; }
    catch (e) { data = { raw: raw.substring(0, 300) }; }

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Zeitüberschreitung bei der LinkedIn-Anfrage');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function describeError(data) {
  if (!data) return 'keine Antwort';
  return data.message || data.error_description || data.error || data.raw || JSON.stringify(data).substring(0, 200);
}

function toMysqlDate(date) {
  if (!date) return null;
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = {
  isConfigured,
  ensureSchema,
  getAuthUrl,
  exchangeCode,
  getConnection,
  setOrganization,
  disconnect,
  listOrganizations,
  syncOrganizationPosts,
  getStatus,
  redirectUri,
  SCOPES
};
