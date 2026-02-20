const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./database');

const INSTAGRAM_API = 'https://graph.instagram.com';

// Instagram-Posts abrufen und in DB speichern
async function syncInstagramPosts() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    console.log('Instagram: Kein Access Token konfiguriert, Sync übersprungen');
    return { success: false, reason: 'no_token' };
  }

  try {
    // Alle Posts abrufen (bis zu 100 pro Seite)
    const fields = 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp';
    const url = `${INSTAGRAM_API}/me/media?fields=${fields}&limit=100&access_token=${token}`;

    const data = await fetchJSON(url);
    if (!data || !data.data) {
      console.error('Instagram: Ungültige API-Antwort');
      return { success: false, reason: 'invalid_response' };
    }

    let imported = 0;
    let updated = 0;

    for (const post of data.data) {
      const [existing] = await db.query('SELECT id FROM instagram_posts WHERE instagram_id = ?', [post.id]);

      if (existing.length) {
        // Update bestehenden Post
        await db.query(
          'UPDATE instagram_posts SET media_url = ?, thumbnail_url = ?, caption = ?, fetched_at = NOW() WHERE instagram_id = ?',
          [post.media_url, post.thumbnail_url || null, post.caption || '', post.id]
        );
        updated++;
      } else {
        // Neuen Post einfügen
        const localPath = await downloadImage(post);
        await db.query(
          'INSERT INTO instagram_posts (instagram_id, media_type, media_url, thumbnail_url, local_image_path, permalink, caption, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [post.id, post.media_type, post.media_url, post.thumbnail_url || null, localPath, post.permalink, post.caption || '', post.timestamp]
        );
        imported++;
      }
    }

    // Pagination: weitere Seiten holen
    let nextUrl = data.paging && data.paging.next;
    while (nextUrl) {
      const nextData = await fetchJSON(nextUrl);
      if (!nextData || !nextData.data || !nextData.data.length) break;

      for (const post of nextData.data) {
        const [existing] = await db.query('SELECT id FROM instagram_posts WHERE instagram_id = ?', [post.id]);
        if (!existing.length) {
          const localPath = await downloadImage(post);
          await db.query(
            'INSERT INTO instagram_posts (instagram_id, media_type, media_url, thumbnail_url, local_image_path, permalink, caption, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [post.id, post.media_type, post.media_url, post.thumbnail_url || null, localPath, post.permalink, post.caption || '', post.timestamp]
          );
          imported++;
        }
      }
      nextUrl = nextData.paging && nextData.paging.next;
    }

    console.log(`Instagram Sync: ${imported} neu importiert, ${updated} aktualisiert`);
    return { success: true, imported, updated };
  } catch (err) {
    console.error('Instagram Sync Fehler:', err.message);
    return { success: false, reason: err.message };
  }
}

// Long-Lived Token refreshen (alle 50 Tage)
async function refreshToken() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return null;

  try {
    const url = `${INSTAGRAM_API}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`;
    const data = await fetchJSON(url);
    if (data && data.access_token) {
      console.log('Instagram Token erfolgreich refreshed, gültig für', data.expires_in, 'Sekunden');
      return data.access_token;
    }
    return null;
  } catch (err) {
    console.error('Instagram Token Refresh Fehler:', err.message);
    return null;
  }
}

// Bild lokal cachen
async function downloadImage(post) {
  const imageUrl = post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url;
  if (!imageUrl) return '';

  const dir = path.join(__dirname, '..', 'public', 'images', 'instagram');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const ext = '.jpg';
  const filename = `ig_${post.id}${ext}`;
  const filePath = path.join(dir, filename);

  try {
    await downloadFile(imageUrl, filePath);
    return '/images/instagram/' + filename;
  } catch (err) {
    console.error('Bild-Download fehlgeschlagen für', post.id, err.message);
    return '';
  }
}

// HTTPS JSON fetch
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location).then(resolve).catch(reject);
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('JSON Parse Fehler: ' + body.substring(0, 200))); }
      });
    }).on('error', reject);
  });
}

// Datei herunterladen
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

module.exports = { syncInstagramPosts, refreshToken };
