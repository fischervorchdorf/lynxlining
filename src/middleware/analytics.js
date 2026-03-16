const crypto = require('crypto');
const db = require('../config/database');

let geoip;
try {
  geoip = require('geoip-lite');
} catch (e) {
  console.warn('geoip-lite nicht verfügbar, Länder-Erkennung deaktiviert');
}

// Pfade die NICHT getrackt werden
const IGNORE_PATTERNS = [
  /^\/admin/,
  /^\/api/,
  /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|webp)$/i,
  /^\/favicon/,
  /^\/robots\.txt/,
  /^\/sitemap/
];

function parseUserAgent(ua) {
  if (!ua) return { browser: 'Unbekannt', os: 'Unbekannt', deviceType: 'desktop' };

  // Device type
  let deviceType = 'desktop';
  if (/mobile|android.*mobile|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad|android(?!.*mobile)/i.test(ua)) {
    deviceType = 'tablet';
  }

  // Browser
  let browser = 'Andere';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/opr\/|opera/i.test(ua)) browser = 'Opera';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/msie|trident/i.test(ua)) browser = 'IE';

  // OS
  let os = 'Andere';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua) && !/android/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

  return { browser, os, deviceType };
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || '';
}

function hashIp(ip) {
  return crypto.createHash('sha256').update(ip + 'lynx-salt').digest('hex').substring(0, 32);
}

function analyticsMiddleware(req, res, next) {
  // Nur GET-Requests tracken
  if (req.method !== 'GET') return next();

  // Ignorierte Pfade überspringen
  const path = req.path;
  if (IGNORE_PATTERNS.some(p => p.test(path))) return next();

  // Tracking async im Hintergrund - Response nicht blockieren
  const ip = getClientIp(req);
  const ua = req.headers['user-agent'] || '';
  const referrer = req.headers['referer'] || req.headers['referrer'] || '';
  const lang = (req.headers['accept-language'] || '').substring(0, 10);
  const sessionId = req.session?.id || '';

  // onFinish um status_code zu erfassen
  res.on('finish', () => {
    try {
      const { browser, os, deviceType } = parseUserAgent(ua);
      const ipHash = hashIp(ip);

      let country = null;
      let city = null;
      if (geoip && ip) {
        const geo = geoip.lookup(ip);
        if (geo) {
          country = geo.country || null;
          city = geo.city || null;
        }
      }

      db.query(
        `INSERT INTO page_views (path, method, status_code, country, city, device_type, browser, os, referrer, language, session_id, ip_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [path, 'GET', res.statusCode, country, city, deviceType, browser, os, referrer.substring(0, 1000), lang, sessionId, ipHash]
      ).catch(() => {});
    } catch (e) {
      // Tracking-Fehler sollen nie die App crashen
    }
  });

  next();
}

module.exports = analyticsMiddleware;
