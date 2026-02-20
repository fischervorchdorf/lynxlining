const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Multer für Bild-Uploads
const fs = require('fs');
const uploadDir = path.join(__dirname, '..', 'public', 'images', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.random().toString(36).substring(7) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ============================================================
// AUTH
// ============================================================

router.get('/login', (req, res) => {
  if (req.session && req.session.userId) return res.redirect('/admin');
  res.render('admin/login.njk', { title: 'Admin Login', layout: false });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (!users.length) return res.render('admin/login.njk', { title: 'Admin Login', layout: false, error: 'Ungültiger Benutzername oder Passwort' });
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.render('admin/login.njk', { title: 'Admin Login', layout: false, error: 'Ungültiger Benutzername oder Passwort' });
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    res.redirect('/admin');
  } catch (err) {
    console.error('Login-Fehler:', err);
    res.render('admin/login.njk', { title: 'Admin Login', layout: false, error: 'Ein Fehler ist aufgetreten' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ============================================================
// DASHBOARD
// ============================================================

router.get('/', requireAuth, async (req, res) => {
  try {
    const [contactCount] = await db.query('SELECT COUNT(*) as count FROM contact_submissions WHERE is_read = 0');
    const [orderCount] = await db.query('SELECT COUNT(*) as count FROM shop_orders WHERE is_read = 0');
    const [totalOrders] = await db.query('SELECT COUNT(*) as count FROM shop_orders');
    const [productCount] = await db.query('SELECT COUNT(*) as count FROM shop_products WHERE is_active = 1');
    const [recentOrders] = await db.query('SELECT order_number, customer_name, total_amount, status, created_at FROM shop_orders ORDER BY created_at DESC LIMIT 5');
    const [recentContacts] = await db.query('SELECT name, email, subject, created_at, is_read FROM contact_submissions ORDER BY created_at DESC LIMIT 5');

    res.render('admin/dashboard.njk', {
      title: 'Dashboard', adminPage: 'dashboard',
      stats: { unreadContacts: contactCount[0].count, unreadOrders: orderCount[0].count, totalOrders: totalOrders[0].count, activeProducts: productCount[0].count },
      recentOrders, recentContacts
    });
  } catch (err) {
    console.error('Dashboard-Fehler:', err);
    res.render('admin/dashboard.njk', {
      title: 'Dashboard', adminPage: 'dashboard',
      stats: { unreadContacts: 0, unreadOrders: 0, totalOrders: 0, activeProducts: 0 },
      recentOrders: [], recentContacts: []
    });
  }
});

// ============================================================
// KONTAKTANFRAGEN
// ============================================================

router.get('/kontakt', requireAuth, async (req, res) => {
  const [submissions] = await db.query('SELECT * FROM contact_submissions ORDER BY created_at DESC').catch(() => [[]]);
  res.render('admin/contacts.njk', { title: 'Kontaktanfragen', adminPage: 'contacts', submissions });
});

router.post('/kontakt/:id/read', requireAuth, async (req, res) => {
  await db.query('UPDATE contact_submissions SET is_read = 1 WHERE id = ?', [req.params.id]);
  res.redirect('/admin/kontakt');
});

// ============================================================
// BESTELLUNGEN
// ============================================================

router.get('/bestellungen', requireAuth, async (req, res) => {
  const [orders] = await db.query('SELECT * FROM shop_orders ORDER BY created_at DESC').catch(() => [[]]);
  res.render('admin/orders.njk', { title: 'Bestellungen', adminPage: 'orders', orders });
});

router.get('/bestellungen/:id', requireAuth, async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM shop_orders WHERE id = ?', [req.params.id]);
    if (!orders.length) return res.redirect('/admin/bestellungen');
    const order = orders[0];
    const [items] = await db.query('SELECT * FROM shop_order_items WHERE order_id = ?', [order.id]);
    if (!order.is_read) await db.query('UPDATE shop_orders SET is_read = 1 WHERE id = ?', [order.id]);
    res.render('admin/order-detail.njk', { title: 'Bestellung ' + order.order_number, adminPage: 'orders', order, items });
  } catch { res.redirect('/admin/bestellungen'); }
});

router.post('/bestellungen/:id/status', requireAuth, async (req, res) => {
  await db.query('UPDATE shop_orders SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
  res.redirect('/admin/bestellungen/' + req.params.id);
});

// ============================================================
// ANWENDUNGEN (Applications)
// ============================================================

router.get('/anwendungen', requireAuth, async (req, res) => {
  const [apps] = await db.query(`
    SELECT a.*, at_de.title as title_de, at_de.description as desc_de, at_en.title as title_en, at_en.description as desc_en
    FROM applications a
    LEFT JOIN application_translations at_de ON a.id = at_de.application_id AND at_de.locale = 'de'
    LEFT JOIN application_translations at_en ON a.id = at_en.application_id AND at_en.locale = 'en'
    ORDER BY a.sort_order
  `).catch(() => [[]]);
  res.render('admin/content-list.njk', {
    title: 'Anwendungen', adminPage: 'anwendungen', contentType: 'anwendungen',
    items: apps, columns: ['title_de', 'title_en']
  });
});

router.get('/anwendungen/neu', requireAuth, (req, res) => {
  res.render('admin/content-form.njk', {
    title: 'Neue Anwendung', adminPage: 'anwendungen', contentType: 'anwendungen',
    item: null, isNew: true
  });
});

router.get('/anwendungen/:id', requireAuth, async (req, res) => {
  const [apps] = await db.query('SELECT * FROM applications WHERE id = ?', [req.params.id]);
  if (!apps.length) return res.redirect('/admin/anwendungen');
  const [de] = await db.query('SELECT * FROM application_translations WHERE application_id = ? AND locale = "de"', [req.params.id]);
  const [en] = await db.query('SELECT * FROM application_translations WHERE application_id = ? AND locale = "en"', [req.params.id]);
  res.render('admin/content-form.njk', {
    title: 'Anwendung bearbeiten', adminPage: 'anwendungen', contentType: 'anwendungen',
    item: { ...apps[0], de: de[0] || {}, en: en[0] || {} }, isNew: false
  });
});

router.post('/anwendungen', requireAuth, upload.single('image'), async (req, res) => {
  const { slug, sort_order, title_de, desc_de, title_en, desc_en } = req.body;
  const imagePath = req.file ? '/images/uploads/' + req.file.filename : (req.body.existing_image || '');
  const [result] = await db.query('INSERT INTO applications (slug, image_path, sort_order) VALUES (?, ?, ?)', [slug, imagePath, sort_order || 0]);
  const id = result.insertId;
  await db.query('INSERT INTO application_translations (application_id, locale, title, description) VALUES (?, "de", ?, ?)', [id, title_de, desc_de]);
  await db.query('INSERT INTO application_translations (application_id, locale, title, description) VALUES (?, "en", ?, ?)', [id, title_en, desc_en]);
  res.redirect('/admin/anwendungen');
});

router.post('/anwendungen/:id', requireAuth, upload.single('image'), async (req, res) => {
  const { slug, sort_order, title_de, desc_de, title_en, desc_en } = req.body;
  const imagePath = req.file ? '/images/uploads/' + req.file.filename : req.body.existing_image;
  await db.query('UPDATE applications SET slug = ?, image_path = ?, sort_order = ? WHERE id = ?', [slug, imagePath, sort_order || 0, req.params.id]);
  await db.query('UPDATE application_translations SET title = ?, description = ? WHERE application_id = ? AND locale = "de"', [title_de, desc_de, req.params.id]);
  await db.query('UPDATE application_translations SET title = ?, description = ? WHERE application_id = ? AND locale = "en"', [title_en, desc_en, req.params.id]);
  res.redirect('/admin/anwendungen');
});

router.post('/anwendungen/:id/delete', requireAuth, async (req, res) => {
  await db.query('DELETE FROM application_translations WHERE application_id = ?', [req.params.id]);
  await db.query('DELETE FROM applications WHERE id = ?', [req.params.id]);
  res.redirect('/admin/anwendungen');
});

// ============================================================
// VORTEILE (Advantages)
// ============================================================

router.get('/vorteile', requireAuth, async (req, res) => {
  const [items] = await db.query(`
    SELECT a.*, at_de.title as title_de, at_de.description as desc_de, at_en.title as title_en, at_en.description as desc_en
    FROM advantages a
    LEFT JOIN advantage_translations at_de ON a.id = at_de.advantage_id AND at_de.locale = 'de'
    LEFT JOIN advantage_translations at_en ON a.id = at_en.advantage_id AND at_en.locale = 'en'
    ORDER BY a.sort_order
  `).catch(() => [[]]);
  res.render('admin/content-list.njk', {
    title: 'Vorteile', adminPage: 'vorteile', contentType: 'vorteile',
    items, columns: ['title_de', 'title_en']
  });
});

router.get('/vorteile/neu', requireAuth, (req, res) => {
  res.render('admin/advantage-form.njk', { title: 'Neuer Vorteil', adminPage: 'vorteile', item: null, isNew: true });
});

router.get('/vorteile/:id', requireAuth, async (req, res) => {
  const [items] = await db.query('SELECT * FROM advantages WHERE id = ?', [req.params.id]);
  if (!items.length) return res.redirect('/admin/vorteile');
  const [de] = await db.query('SELECT * FROM advantage_translations WHERE advantage_id = ? AND locale = "de"', [req.params.id]);
  const [en] = await db.query('SELECT * FROM advantage_translations WHERE advantage_id = ? AND locale = "en"', [req.params.id]);
  res.render('admin/advantage-form.njk', { title: 'Vorteil bearbeiten', adminPage: 'vorteile', item: { ...items[0], de: de[0] || {}, en: en[0] || {} }, isNew: false });
});

router.post('/vorteile', requireAuth, upload.single('icon'), async (req, res) => {
  const { slug, sort_order, title_de, desc_de, title_en, desc_en } = req.body;
  const iconPath = req.file ? '/images/uploads/' + req.file.filename : (req.body.existing_image || '');
  const [result] = await db.query('INSERT INTO advantages (slug, icon_path, sort_order) VALUES (?, ?, ?)', [slug, iconPath, sort_order || 0]);
  const id = result.insertId;
  await db.query('INSERT INTO advantage_translations (advantage_id, locale, title, description) VALUES (?, "de", ?, ?)', [id, title_de, desc_de]);
  await db.query('INSERT INTO advantage_translations (advantage_id, locale, title, description) VALUES (?, "en", ?, ?)', [id, title_en, desc_en]);
  res.redirect('/admin/vorteile');
});

router.post('/vorteile/:id', requireAuth, upload.single('icon'), async (req, res) => {
  const { slug, sort_order, title_de, desc_de, title_en, desc_en } = req.body;
  const iconPath = req.file ? '/images/uploads/' + req.file.filename : req.body.existing_image;
  await db.query('UPDATE advantages SET slug = ?, icon_path = ?, sort_order = ? WHERE id = ?', [slug, iconPath, sort_order || 0, req.params.id]);
  await db.query('UPDATE advantage_translations SET title = ?, description = ? WHERE advantage_id = ? AND locale = "de"', [title_de, desc_de, req.params.id]);
  await db.query('UPDATE advantage_translations SET title = ?, description = ? WHERE advantage_id = ? AND locale = "en"', [title_en, desc_en, req.params.id]);
  res.redirect('/admin/vorteile');
});

router.post('/vorteile/:id/delete', requireAuth, async (req, res) => {
  await db.query('DELETE FROM advantage_translations WHERE advantage_id = ?', [req.params.id]);
  await db.query('DELETE FROM advantages WHERE id = ?', [req.params.id]);
  res.redirect('/admin/vorteile');
});

// ============================================================
// NEWS
// ============================================================

router.get('/news', requireAuth, async (req, res) => {
  const [items] = await db.query(`
    SELECT n.*, nt.title as title_de FROM news_posts n
    LEFT JOIN news_post_translations nt ON n.id = nt.news_post_id AND nt.locale = 'de'
    ORDER BY n.published_at DESC
  `).catch(() => [[]]);
  res.render('admin/news-list.njk', { title: 'News', adminPage: 'news', items });
});

router.get('/news/neu', requireAuth, (req, res) => {
  res.render('admin/news-form.njk', { title: 'Neuer Beitrag', adminPage: 'news', item: null, isNew: true });
});

router.get('/news/:id', requireAuth, async (req, res) => {
  const [items] = await db.query('SELECT * FROM news_posts WHERE id = ?', [req.params.id]);
  if (!items.length) return res.redirect('/admin/news');
  const [de] = await db.query('SELECT * FROM news_post_translations WHERE news_post_id = ? AND locale = "de"', [req.params.id]);
  const [en] = await db.query('SELECT * FROM news_post_translations WHERE news_post_id = ? AND locale = "en"', [req.params.id]);
  res.render('admin/news-form.njk', { title: 'Beitrag bearbeiten', adminPage: 'news', item: { ...items[0], de: de[0] || {}, en: en[0] || {} }, isNew: false });
});

router.post('/news', requireAuth, upload.single('image'), async (req, res) => {
  const { title_de, excerpt_de, content_de, title_en, excerpt_en, content_en, is_active } = req.body;
  const imagePath = req.file ? '/images/uploads/' + req.file.filename : '';
  const [result] = await db.query('INSERT INTO news_posts (post_type, image_path, is_active, published_at) VALUES ("company", ?, ?, NOW())', [imagePath, is_active ? 1 : 0]);
  const id = result.insertId;
  await db.query('INSERT INTO news_post_translations (news_post_id, locale, title, excerpt, content) VALUES (?, "de", ?, ?, ?)', [id, title_de, excerpt_de, content_de]);
  await db.query('INSERT INTO news_post_translations (news_post_id, locale, title, excerpt, content) VALUES (?, "en", ?, ?, ?)', [id, title_en || title_de, excerpt_en || excerpt_de, content_en || content_de]);
  res.redirect('/admin/news');
});

router.post('/news/:id', requireAuth, upload.single('image'), async (req, res) => {
  const { title_de, excerpt_de, content_de, title_en, excerpt_en, content_en, is_active } = req.body;
  const imagePath = req.file ? '/images/uploads/' + req.file.filename : req.body.existing_image;
  await db.query('UPDATE news_posts SET image_path = ?, is_active = ? WHERE id = ?', [imagePath, is_active ? 1 : 0, req.params.id]);
  await db.query('UPDATE news_post_translations SET title = ?, excerpt = ?, content = ? WHERE news_post_id = ? AND locale = "de"', [title_de, excerpt_de, content_de, req.params.id]);
  const [enExists] = await db.query('SELECT id FROM news_post_translations WHERE news_post_id = ? AND locale = "en"', [req.params.id]);
  if (enExists.length) {
    await db.query('UPDATE news_post_translations SET title = ?, excerpt = ?, content = ? WHERE news_post_id = ? AND locale = "en"', [title_en || title_de, excerpt_en || excerpt_de, content_en || content_de, req.params.id]);
  } else {
    await db.query('INSERT INTO news_post_translations (news_post_id, locale, title, excerpt, content) VALUES (?, "en", ?, ?, ?)', [req.params.id, title_en || title_de, excerpt_en || excerpt_de, content_en || content_de]);
  }
  res.redirect('/admin/news');
});

router.post('/news/:id/delete', requireAuth, async (req, res) => {
  await db.query('DELETE FROM news_post_translations WHERE news_post_id = ?', [req.params.id]);
  await db.query('DELETE FROM news_posts WHERE id = ?', [req.params.id]);
  res.redirect('/admin/news');
});

// ============================================================
// INSTAGRAM
// ============================================================

const { syncInstagramPosts } = require('../config/instagram');

router.get('/instagram', requireAuth, async (req, res) => {
  const [posts] = await db.query('SELECT * FROM instagram_posts ORDER BY timestamp DESC').catch(() => [[]]);
  const hasToken = !!process.env.INSTAGRAM_ACCESS_TOKEN;
  res.render('admin/instagram.njk', { title: 'Instagram', adminPage: 'instagram', posts, hasToken });
});

router.post('/instagram/sync', requireAuth, async (req, res) => {
  const result = await syncInstagramPosts();
  res.redirect('/admin/instagram');
});

router.post('/instagram/:id/toggle', requireAuth, async (req, res) => {
  await db.query('UPDATE instagram_posts SET is_visible = NOT is_visible WHERE id = ?', [req.params.id]);
  res.redirect('/admin/instagram');
});

router.post('/instagram/:id/feature', requireAuth, async (req, res) => {
  await db.query('UPDATE instagram_posts SET is_featured = NOT is_featured WHERE id = ?', [req.params.id]);
  res.redirect('/admin/instagram');
});

// ============================================================
// LINKEDIN
// ============================================================

router.get('/linkedin', requireAuth, async (req, res) => {
  const [posts] = await db.query(`
    SELECT lp.*, lpt.title as title_de, lpt.excerpt as excerpt_de
    FROM linkedin_posts lp
    LEFT JOIN linkedin_post_translations lpt ON lp.id = lpt.linkedin_post_id AND lpt.locale = 'de'
    ORDER BY lp.published_at DESC
  `).catch(() => [[]]);
  res.render('admin/linkedin-list.njk', { title: 'LinkedIn', adminPage: 'linkedin', posts });
});

router.get('/linkedin/neu', requireAuth, (req, res) => {
  res.render('admin/linkedin-form.njk', { title: 'Neuer LinkedIn-Beitrag', adminPage: 'linkedin', post: null, isNew: true });
});

router.get('/linkedin/:id', requireAuth, async (req, res) => {
  try {
    const [posts] = await db.query('SELECT * FROM linkedin_posts WHERE id = ?', [req.params.id]);
    if (!posts.length) return res.redirect('/admin/linkedin');
    const [de] = await db.query('SELECT * FROM linkedin_post_translations WHERE linkedin_post_id = ? AND locale = "de"', [req.params.id]);
    const [en] = await db.query('SELECT * FROM linkedin_post_translations WHERE linkedin_post_id = ? AND locale = "en"', [req.params.id]);
    res.render('admin/linkedin-form.njk', {
      title: 'LinkedIn-Beitrag bearbeiten',
      adminPage: 'linkedin',
      post: { ...posts[0], de: de[0] || {}, en: en[0] || {} },
      isNew: false
    });
  } catch (err) {
    console.error('LinkedIn Edit Fehler:', err);
    res.redirect('/admin/linkedin');
  }
});

router.post('/linkedin', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { linkedin_url, slug, author_name, title_de, excerpt_de, content_de, title_en, excerpt_en, content_en, is_visible, sort_order } = req.body;
    const imagePath = req.file ? '/images/uploads/' + req.file.filename : '';
    const autoSlug = slug || (title_de || '').toLowerCase().replace(/[äöüß]/g, m => ({ä:'ae',ö:'oe',ü:'ue',ß:'ss'}[m]||m)).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80);

    const [result] = await db.query(
      'INSERT INTO linkedin_posts (slug, linkedin_url, image_path, author_name, published_at, is_visible, sort_order) VALUES (?, ?, ?, ?, NOW(), ?, ?)',
      [autoSlug, linkedin_url || '', imagePath, author_name || 'Martin F. Heidecker', is_visible ? 1 : 0, sort_order || 0]
    );
    const id = result.insertId;

    await db.query('INSERT INTO linkedin_post_translations (linkedin_post_id, locale, title, excerpt, content) VALUES (?, "de", ?, ?, ?)', [id, title_de, excerpt_de, content_de || null]);
    await db.query('INSERT INTO linkedin_post_translations (linkedin_post_id, locale, title, excerpt, content) VALUES (?, "en", ?, ?, ?)', [id, title_en || title_de, excerpt_en || excerpt_de, content_en || content_de || null]);

    res.redirect('/admin/linkedin');
  } catch (err) {
    console.error('LinkedIn Create Fehler:', err.message, err.stack);
    res.status(500).send('LinkedIn Create Fehler: ' + err.message);
  }
});

router.post('/linkedin/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { linkedin_url, slug, author_name, title_de, excerpt_de, content_de, title_en, excerpt_en, content_en, is_visible, sort_order } = req.body;
    const autoSlug = slug || (title_de || '').toLowerCase().replace(/[äöüß]/g, m => ({ä:'ae',ö:'oe',ü:'ue',ß:'ss'}[m]||m)).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80);

    // Bild: Neues Upload > bestehendes Bild > bisheriges in DB behalten
    if (req.file) {
      const imagePath = '/images/uploads/' + req.file.filename;
      await db.query(
        'UPDATE linkedin_posts SET slug = ?, linkedin_url = ?, image_path = ?, author_name = ?, is_visible = ?, sort_order = ? WHERE id = ?',
        [autoSlug, linkedin_url || '', imagePath, author_name || 'Martin F. Heidecker', is_visible ? 1 : 0, sort_order || 0, req.params.id]
      );
    } else if (req.body.existing_image) {
      await db.query(
        'UPDATE linkedin_posts SET slug = ?, linkedin_url = ?, image_path = ?, author_name = ?, is_visible = ?, sort_order = ? WHERE id = ?',
        [autoSlug, linkedin_url || '', req.body.existing_image, author_name || 'Martin F. Heidecker', is_visible ? 1 : 0, sort_order || 0, req.params.id]
      );
    } else {
      // Kein neues Bild, kein existing_image → image_path NICHT überschreiben
      await db.query(
        'UPDATE linkedin_posts SET slug = ?, linkedin_url = ?, author_name = ?, is_visible = ?, sort_order = ? WHERE id = ?',
        [autoSlug, linkedin_url || '', author_name || 'Martin F. Heidecker', is_visible ? 1 : 0, sort_order || 0, req.params.id]
      );
    }

    // DE-Übersetzung: INSERT falls nicht vorhanden, UPDATE falls vorhanden
    const [deExists] = await db.query('SELECT id FROM linkedin_post_translations WHERE linkedin_post_id = ? AND locale = "de"', [req.params.id]);
    if (deExists.length) {
      await db.query('UPDATE linkedin_post_translations SET title = ?, excerpt = ?, content = ? WHERE linkedin_post_id = ? AND locale = "de"', [title_de, excerpt_de, content_de || null, req.params.id]);
    } else {
      await db.query('INSERT INTO linkedin_post_translations (linkedin_post_id, locale, title, excerpt, content) VALUES (?, "de", ?, ?, ?)', [req.params.id, title_de, excerpt_de, content_de || null]);
    }

    // EN-Übersetzung: INSERT falls nicht vorhanden, UPDATE falls vorhanden
    const [enExists] = await db.query('SELECT id FROM linkedin_post_translations WHERE linkedin_post_id = ? AND locale = "en"', [req.params.id]);
    if (enExists.length) {
      await db.query('UPDATE linkedin_post_translations SET title = ?, excerpt = ?, content = ? WHERE linkedin_post_id = ? AND locale = "en"', [title_en || title_de, excerpt_en || excerpt_de, content_en || content_de || null, req.params.id]);
    } else {
      await db.query('INSERT INTO linkedin_post_translations (linkedin_post_id, locale, title, excerpt, content) VALUES (?, "en", ?, ?, ?)', [req.params.id, title_en || title_de, excerpt_en || excerpt_de, content_en || content_de || null]);
    }

    res.redirect('/admin/linkedin');
  } catch (err) {
    console.error('LinkedIn Update Fehler:', err.message, err.stack);
    res.status(500).send('LinkedIn Update Fehler: ' + err.message);
  }
});

router.post('/linkedin/:id/toggle', requireAuth, async (req, res) => {
  await db.query('UPDATE linkedin_posts SET is_visible = NOT is_visible WHERE id = ?', [req.params.id]);
  res.redirect('/admin/linkedin');
});

router.post('/linkedin/:id/delete', requireAuth, async (req, res) => {
  await db.query('DELETE FROM linkedin_post_translations WHERE linkedin_post_id = ?', [req.params.id]);
  await db.query('DELETE FROM linkedin_posts WHERE id = ?', [req.params.id]);
  res.redirect('/admin/linkedin');
});

// ============================================================
// ÜBERSETZUNG (Google Translate, kostenlos)
// ============================================================

router.post('/translate', requireAuth, async (req, res) => {
  const { text, from = 'de', to = 'en' } = req.body;
  if (!text || !text.trim()) return res.json({ translated: '' });

  try {
    const https = require('https');
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;

    const translated = await new Promise((resolve, reject) => {
      https.get(url, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const result = parsed[0].map(s => s[0]).join('');
            resolve(result);
          } catch (e) { reject(e); }
        });
      }).on('error', reject);
    });

    res.json({ translated });
  } catch (err) {
    console.error('Übersetzungsfehler:', err.message);
    res.status(500).json({ error: 'Übersetzung fehlgeschlagen' });
  }
});

// ============================================================
// SHOP-PRODUKTE (CRUD mit Staffelpreisen)
// ============================================================

router.get('/shop-produkte', requireAuth, async (req, res) => {
  const [products] = await db.query(`
    SELECT sp.*, spt.name as name_de
    FROM shop_products sp
    LEFT JOIN shop_product_translations spt ON sp.id = spt.shop_product_id AND spt.locale = 'de'
    ORDER BY sp.sort_order
  `).catch(() => [[]]);

  // Staffelpreise laden
  for (const prod of products) {
    const [tiers] = await db.query('SELECT min_quantity, price_per_unit FROM shop_price_tiers WHERE shop_product_id = ? ORDER BY min_quantity', [prod.id]);
    prod.tiers = tiers;
    prod.base_price = tiers.length ? tiers[0].price_per_unit : 0;
  }

  res.render('admin/shop-list.njk', { title: 'Shop-Produkte', adminPage: 'shop-produkte', products });
});

router.get('/shop-produkte/neu', requireAuth, (req, res) => {
  res.render('admin/shop-form.njk', { title: 'Neues Shop-Produkt', adminPage: 'shop-produkte', product: null, tiers: [], isNew: true });
});

router.get('/shop-produkte/:id', requireAuth, async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM shop_products WHERE id = ?', [req.params.id]);
    if (!products.length) return res.redirect('/admin/shop-produkte');
    const product = products[0];
    const [de] = await db.query('SELECT * FROM shop_product_translations WHERE shop_product_id = ? AND locale = "de"', [req.params.id]);
    const [en] = await db.query('SELECT * FROM shop_product_translations WHERE shop_product_id = ? AND locale = "en"', [req.params.id]);
    const [tiers] = await db.query('SELECT * FROM shop_price_tiers WHERE shop_product_id = ? ORDER BY min_quantity', [req.params.id]);
    product.de = de[0] || {};
    product.en = en[0] || {};
    res.render('admin/shop-form.njk', { title: 'Produkt bearbeiten', adminPage: 'shop-produkte', product, tiers, isNew: false });
  } catch (err) {
    console.error('Shop-Produkt-Fehler:', err);
    res.redirect('/admin/shop-produkte');
  }
});

router.post('/shop-produkte', requireAuth, upload.single('image'), async (req, res) => {
  const { slug, sku, unit, sort_order, min_quantity, is_active, name_de, short_desc_de, desc_de, name_en, short_desc_en, desc_en } = req.body;
  const imagePath = req.file ? '/images/uploads/' + req.file.filename : (req.body.existing_image || '/images/products/produkt.JPG');

  const [result] = await db.query(
    'INSERT INTO shop_products (slug, sku, image_path, unit, min_quantity, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [slug, sku || '', imagePath, unit || 'lfm', min_quantity || 1, sort_order || 0, is_active ? 1 : 1]
  );
  const id = result.insertId;

  await db.query('INSERT INTO shop_product_translations (shop_product_id, locale, name, short_description, description) VALUES (?, "de", ?, ?, ?)',
    [id, name_de, short_desc_de, desc_de]);
  await db.query('INSERT INTO shop_product_translations (shop_product_id, locale, name, short_description, description) VALUES (?, "en", ?, ?, ?)',
    [id, name_en || name_de, short_desc_en || short_desc_de, desc_en || desc_de]);

  // Staffelpreise
  const tierMins = Array.isArray(req.body.tier_min) ? req.body.tier_min : (req.body.tier_min ? [req.body.tier_min] : []);
  const tierPrices = Array.isArray(req.body.tier_price) ? req.body.tier_price : (req.body.tier_price ? [req.body.tier_price] : []);
  for (let i = 0; i < tierMins.length; i++) {
    if (tierMins[i] && tierPrices[i]) {
      await db.query('INSERT INTO shop_price_tiers (shop_product_id, min_quantity, price_per_unit) VALUES (?, ?, ?)',
        [id, parseFloat(tierMins[i]), parseFloat(tierPrices[i])]);
    }
  }

  res.redirect('/admin/shop-produkte');
});

router.post('/shop-produkte/:id', requireAuth, upload.single('image'), async (req, res) => {
  const { slug, sku, unit, sort_order, min_quantity, is_active, name_de, short_desc_de, desc_de, name_en, short_desc_en, desc_en } = req.body;
  const imagePath = req.file ? '/images/uploads/' + req.file.filename : req.body.existing_image;

  await db.query('UPDATE shop_products SET slug = ?, sku = ?, image_path = ?, unit = ?, min_quantity = ?, sort_order = ?, is_active = ? WHERE id = ?',
    [slug, sku || '', imagePath, unit || 'lfm', min_quantity || 1, sort_order || 0, is_active ? 1 : 0, req.params.id]);

  // Übersetzungen updaten/einfügen
  const [deExists] = await db.query('SELECT id FROM shop_product_translations WHERE shop_product_id = ? AND locale = "de"', [req.params.id]);
  if (deExists.length) {
    await db.query('UPDATE shop_product_translations SET name = ?, short_description = ?, description = ? WHERE shop_product_id = ? AND locale = "de"',
      [name_de, short_desc_de, desc_de, req.params.id]);
  } else {
    await db.query('INSERT INTO shop_product_translations (shop_product_id, locale, name, short_description, description) VALUES (?, "de", ?, ?, ?)',
      [req.params.id, name_de, short_desc_de, desc_de]);
  }

  const [enExists] = await db.query('SELECT id FROM shop_product_translations WHERE shop_product_id = ? AND locale = "en"', [req.params.id]);
  if (enExists.length) {
    await db.query('UPDATE shop_product_translations SET name = ?, short_description = ?, description = ? WHERE shop_product_id = ? AND locale = "en"',
      [name_en || name_de, short_desc_en || short_desc_de, desc_en || desc_de, req.params.id]);
  } else {
    await db.query('INSERT INTO shop_product_translations (shop_product_id, locale, name, short_description, description) VALUES (?, "en", ?, ?, ?)',
      [req.params.id, name_en || name_de, short_desc_en || short_desc_de, desc_en || desc_de]);
  }

  // Staffelpreise: Alte löschen, neue einfügen
  await db.query('DELETE FROM shop_price_tiers WHERE shop_product_id = ?', [req.params.id]);
  const tierMins = Array.isArray(req.body.tier_min) ? req.body.tier_min : (req.body.tier_min ? [req.body.tier_min] : []);
  const tierPrices = Array.isArray(req.body.tier_price) ? req.body.tier_price : (req.body.tier_price ? [req.body.tier_price] : []);
  for (let i = 0; i < tierMins.length; i++) {
    if (tierMins[i] && tierPrices[i]) {
      await db.query('INSERT INTO shop_price_tiers (shop_product_id, min_quantity, price_per_unit) VALUES (?, ?, ?)',
        [req.params.id, parseFloat(tierMins[i]), parseFloat(tierPrices[i])]);
    }
  }

  res.redirect('/admin/shop-produkte');
});

router.post('/shop-produkte/:id/toggle', requireAuth, async (req, res) => {
  await db.query('UPDATE shop_products SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
  res.redirect('/admin/shop-produkte');
});

router.post('/shop-produkte/:id/delete', requireAuth, async (req, res) => {
  await db.query('DELETE FROM shop_price_tiers WHERE shop_product_id = ?', [req.params.id]);
  await db.query('DELETE FROM shop_product_translations WHERE shop_product_id = ?', [req.params.id]);
  await db.query('DELETE FROM shop_products WHERE id = ?', [req.params.id]);
  res.redirect('/admin/shop-produkte');
});

// ============================================================
// FOTOS WECHSELN (Image Management)
// ============================================================

// Bild-Kategorien mit Pfaden und Labels
function getImageCategories() {
  const baseDir = path.join(__dirname, '..', 'public', 'images');
  const categories = [
    { key: 'hero', label: 'Hero-Hintergrund', dir: 'hero', accept: 'image/*' },
    { key: 'logo', label: 'Logos', dir: 'logo', accept: 'image/*' },
    { key: 'applications', label: 'Anwendungen', dir: 'applications', accept: 'image/*' },
    { key: 'advantages', label: 'Vorteile (Icons)', dir: 'advantages', accept: 'image/*' },
    { key: 'products', label: 'Produkte', dir: 'products', accept: 'image/*' },
    { key: 'gallery', label: 'Galerie', dir: 'gallery', accept: 'image/*' },
    { key: 'testimonials', label: 'Kundenstimmen', dir: 'testimonials', accept: 'image/*' },
    { key: 'icons', label: 'Icons & Badges', dir: 'icons', accept: 'image/*' }
  ];

  for (const cat of categories) {
    const dirPath = path.join(baseDir, cat.dir);
    cat.images = [];
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).filter(f => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f) && f !== '.gitkeep');
      cat.images = files.map(f => ({
        filename: f,
        path: '/images/' + cat.dir + '/' + f,
        fullPath: path.join(dirPath, f)
      }));
    }
  }
  return categories;
}

router.get('/fotos', requireAuth, (req, res) => {
  const categories = getImageCategories();
  res.render('admin/fotos.njk', {
    title: 'Fotos wechseln',
    adminPage: 'fotos',
    categories
  });
});

router.post('/fotos/replace', requireAuth, upload.single('new_image'), async (req, res) => {
  const { category, old_filename } = req.body;
  if (!req.file) return res.redirect('/admin/fotos');

  const baseDir = path.join(__dirname, '..', 'public', 'images');
  const oldPath = path.join(baseDir, category, old_filename);

  // Altes Bild löschen
  if (fs.existsSync(oldPath)) {
    fs.unlinkSync(oldPath);
  }

  // Neues Bild mit gleichem Dateinamen speichern (damit Referenzen erhalten bleiben)
  const ext = path.extname(req.file.originalname);
  const oldExt = path.extname(old_filename);
  const baseName = path.basename(old_filename, oldExt);
  const newFilename = baseName + ext;
  const newPath = path.join(baseDir, category, newFilename);

  // Multer hat das File in uploads/ gespeichert, verschieben wir es
  fs.renameSync(req.file.path, newPath);

  res.redirect('/admin/fotos');
});

router.post('/fotos/upload', requireAuth, upload.single('new_image'), async (req, res) => {
  const { category } = req.body;
  if (!req.file) return res.redirect('/admin/fotos');

  const baseDir = path.join(__dirname, '..', 'public', 'images');
  const targetDir = path.join(baseDir, category);

  // Sicherstellen dass Verzeichnis existiert
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Multer hat das File in uploads/ gespeichert, verschieben wir es
  const newPath = path.join(targetDir, req.file.filename);
  fs.renameSync(req.file.path, newPath);

  res.redirect('/admin/fotos');
});

router.post('/fotos/delete', requireAuth, async (req, res) => {
  const { category, filename } = req.body;
  const baseDir = path.join(__dirname, '..', 'public', 'images');
  const filePath = path.join(baseDir, category, filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  res.redirect('/admin/fotos');
});

module.exports = router;
