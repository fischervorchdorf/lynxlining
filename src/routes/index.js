const express = require('express');
const router = express.Router();
const db = require('../config/database');

const SUPPORTED_LOCALES = ['de', 'en'];

// Locale-Validierung Middleware für alle /:locale Routen
function validateLocale(req, res, next) {
  if (!SUPPORTED_LOCALES.includes(req.params.locale)) {
    return next('route'); // Weiter zur nächsten Route (404)
  }
  req.locale = req.params.locale;
  res.locals.locale = req.params.locale;
  next();
}

// Redirect root to default locale
router.get('/', (req, res) => {
  res.redirect(301, '/de');
});

// Homepage
router.get('/:locale', validateLocale, async (req, res) => {
  const locale = req.locale;
  try {
    const [applications] = await db.query(`
      SELECT a.*, at.title, at.description
      FROM applications a
      JOIN application_translations at ON a.id = at.application_id AND at.locale = ?
      WHERE a.is_active = 1
      ORDER BY a.sort_order
    `, [locale]);

    const [advantages] = await db.query(`
      SELECT a.*, at.title, at.description
      FROM advantages a
      JOIN advantage_translations at ON a.id = at.advantage_id AND at.locale = ?
      WHERE a.is_active = 1
      ORDER BY a.sort_order
    `, [locale]);

    const [testimonials] = await db.query(`
      SELECT t.*, tt.name, tt.role, tt.company, tt.quote
      FROM testimonials t
      JOIN testimonial_translations tt ON t.id = tt.testimonial_id AND tt.locale = ?
      WHERE t.is_active = 1
      ORDER BY t.sort_order
    `, [locale]);

    const [instagramPosts] = await db.query(`
      SELECT * FROM instagram_posts
      WHERE is_visible = 1
      ORDER BY timestamp DESC
      LIMIT 6
    `);

    const [newsPosts] = await db.query(`
      SELECT n.*, nt.title, nt.excerpt
      FROM news_posts n
      JOIN news_post_translations nt ON n.id = nt.news_post_id AND nt.locale = ?
      WHERE n.is_active = 1
      ORDER BY n.published_at DESC
      LIMIT 3
    `, [locale]);

    res.render('pages/home.njk', {
      title: res.locals.t('site.title') + ' - ' + res.locals.t('site.description'),
      applications,
      advantages,
      testimonials,
      instagramPosts,
      newsPosts,
      page: 'home'
    });
  } catch (err) {
    console.warn('DB nicht verfügbar, verwende statische Daten:', err.message);
    res.render('pages/home.njk', {
      title: res.locals.t('site.title') + ' - ' + res.locals.t('site.description'),
      applications: [],
      advantages: [],
      testimonials: [],
      instagramPosts: [],
      newsPosts: [],
      page: 'home',
      dbError: true
    });
  }
});

// Produkte
router.get('/:locale/produkte', validateLocale, async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, pt.title, pt.subtitle, pt.description
      FROM products p
      JOIN product_translations pt ON p.id = pt.product_id AND pt.locale = ?
      WHERE p.is_active = 1
      ORDER BY p.sort_order
    `, [req.locale]);
    res.render('pages/products.njk', { title: res.locals.t('nav.products'), products, page: 'products' });
  } catch (err) {
    res.render('pages/products.njk', { title: res.locals.t('nav.products'), products: [], page: 'products' });
  }
});

// Vorteile
router.get('/:locale/vorteile', validateLocale, async (req, res) => {
  try {
    const [advantages] = await db.query(`
      SELECT a.*, at.title, at.description
      FROM advantages a
      JOIN advantage_translations at ON a.id = at.advantage_id AND at.locale = ?
      WHERE a.is_active = 1
      ORDER BY a.sort_order
    `, [req.locale]);
    res.render('pages/advantages.njk', { title: res.locals.t('nav.advantages'), advantages, page: 'advantages' });
  } catch (err) {
    res.render('pages/advantages.njk', { title: res.locals.t('nav.advantages'), advantages: [], page: 'advantages' });
  }
});

// Anwendungen
router.get('/:locale/anwendungen', validateLocale, async (req, res) => {
  try {
    const [applications] = await db.query(`
      SELECT a.*, at.title, at.description, at.bullet_points
      FROM applications a
      JOIN application_translations at ON a.id = at.application_id AND at.locale = ?
      WHERE a.is_active = 1
      ORDER BY a.sort_order
    `, [req.locale]);
    res.render('pages/applications.njk', { title: res.locals.t('nav.applications'), applications, page: 'applications' });
  } catch (err) {
    res.render('pages/applications.njk', { title: res.locals.t('nav.applications'), applications: [], page: 'applications' });
  }
});

// Referenzen
router.get('/:locale/referenzen', validateLocale, async (req, res) => {
  try {
    const [references] = await db.query(`
      SELECT r.*, rt.name, rt.industry, rt.description
      FROM customer_references r
      JOIN reference_translations rt ON r.id = rt.reference_id AND rt.locale = ?
      WHERE r.is_active = 1
      ORDER BY r.sort_order
    `, [req.locale]);
    res.render('pages/references.njk', { title: res.locals.t('nav.references'), references, page: 'references' });
  } catch (err) {
    res.render('pages/references.njk', { title: res.locals.t('nav.references'), references: [], page: 'references' });
  }
});

// Galerie
router.get('/:locale/galerie', validateLocale, async (req, res) => {
  try {
    const [images] = await db.query(`
      SELECT g.*, gt.title, gt.alt_text, gt.caption
      FROM gallery_images g
      JOIN gallery_image_translations gt ON g.id = gt.gallery_image_id AND gt.locale = ?
      WHERE g.is_active = 1
      ORDER BY g.sort_order
    `, [req.locale]);
    res.render('pages/gallery.njk', { title: res.locals.t('nav.gallery'), images, page: 'gallery' });
  } catch (err) {
    res.render('pages/gallery.njk', { title: res.locals.t('nav.gallery'), images: [], page: 'gallery' });
  }
});

// News
router.get('/:locale/news', validateLocale, async (req, res) => {
  try {
    const [newsPosts] = await db.query(`
      SELECT n.*, nt.title, nt.excerpt, nt.content
      FROM news_posts n
      JOIN news_post_translations nt ON n.id = nt.news_post_id AND nt.locale = ?
      WHERE n.is_active = 1
      ORDER BY n.published_at DESC
    `, [req.locale]);
    const [instagramPosts] = await db.query(`
      SELECT * FROM instagram_posts WHERE is_visible = 1 ORDER BY timestamp DESC
    `);
    let linkedinPosts = [];
    try {
      const [liPosts] = await db.query(`
        SELECT lp.*, lpt.title, lpt.excerpt, lpt.content
        FROM linkedin_posts lp
        JOIN linkedin_post_translations lpt ON lp.id = lpt.linkedin_post_id AND lpt.locale = ?
        WHERE lp.is_visible = 1
        ORDER BY lp.published_at DESC
      `, [req.locale]);
      linkedinPosts = liPosts;
    } catch (e) { /* LinkedIn-Tabelle existiert evtl. noch nicht */ }
    res.render('pages/news.njk', { title: res.locals.t('nav.news'), newsPosts, instagramPosts, linkedinPosts, page: 'news' });
  } catch (err) {
    res.render('pages/news.njk', { title: res.locals.t('nav.news'), newsPosts: [], instagramPosts: [], linkedinPosts: [], page: 'news' });
  }
});

// LinkedIn Detail
router.get('/:locale/news/linkedin/:slug', validateLocale, async (req, res) => {
  try {
    const [posts] = await db.query(`
      SELECT lp.*, lpt.title, lpt.excerpt, lpt.content
      FROM linkedin_posts lp
      JOIN linkedin_post_translations lpt ON lp.id = lpt.linkedin_post_id AND lpt.locale = ?
      WHERE (lp.slug = ? OR lp.id = ?) AND lp.is_visible = 1
    `, [req.locale, req.params.slug, req.params.slug]);
    if (!posts.length) return res.redirect('/' + req.locale + '/news');
    res.render('pages/linkedin-detail.njk', {
      title: posts[0].title,
      post: posts[0],
      page: 'news'
    });
  } catch (err) {
    res.redirect('/' + req.locale + '/news');
  }
});

// Shop
router.get('/:locale/shop', validateLocale, async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT sp.*, spt.name, spt.short_description, spt.description
      FROM shop_products sp
      JOIN shop_product_translations spt ON sp.id = spt.shop_product_id AND spt.locale = ?
      WHERE sp.is_active = 1
      ORDER BY sp.sort_order
    `, [req.locale]);

    // Staffelpreise für alle Produkte laden
    for (const prod of products) {
      const [tiers] = await db.query(`
        SELECT min_quantity, price_per_unit
        FROM shop_price_tiers
        WHERE shop_product_id = ?
        ORDER BY min_quantity ASC
      `, [prod.id]);
      prod.price_tiers = tiers;
      prod.base_price = tiers.length ? tiers[0].price_per_unit : 0;
    }

    res.render('pages/shop.njk', { title: res.locals.t('nav.shop'), products, page: 'shop' });
  } catch (err) {
    console.error('Shop-Fehler:', err);
    res.render('pages/shop.njk', { title: res.locals.t('nav.shop'), products: [], page: 'shop' });
  }
});

// Kontakt
router.get('/:locale/kontakt', validateLocale, (req, res) => {
  res.render('pages/contact.njk', { title: res.locals.t('nav.contact'), page: 'contact' });
});

// Impressum
router.get('/:locale/impressum', validateLocale, async (req, res) => {
  try {
    const [pages] = await db.query(`
      SELECT pt.title, pt.content FROM pages p
      JOIN page_translations pt ON p.id = pt.page_id AND pt.locale = ?
      WHERE p.slug = 'impressum'
    `, [req.locale]);
    res.render('pages/legal.njk', { title: res.locals.t('footer.imprint'), pageContent: pages[0] || {} });
  } catch (err) {
    res.render('pages/legal.njk', { title: res.locals.t('footer.imprint'), pageContent: {} });
  }
});

// Datenschutz
router.get('/:locale/datenschutz', validateLocale, async (req, res) => {
  try {
    const [pages] = await db.query(`
      SELECT pt.title, pt.content FROM pages p
      JOIN page_translations pt ON p.id = pt.page_id AND pt.locale = ?
      WHERE p.slug = 'datenschutz'
    `, [req.locale]);
    res.render('pages/legal.njk', { title: res.locals.t('footer.privacy'), pageContent: pages[0] || {} });
  } catch (err) {
    res.render('pages/legal.njk', { title: res.locals.t('footer.privacy'), pageContent: {} });
  }
});

// AGB
router.get('/:locale/agb', validateLocale, async (req, res) => {
  try {
    const [pages] = await db.query(`
      SELECT pt.title, pt.content FROM pages p
      JOIN page_translations pt ON p.id = pt.page_id AND pt.locale = ?
      WHERE p.slug = 'agb'
    `, [req.locale]);
    res.render('pages/legal.njk', { title: res.locals.t('footer.terms'), pageContent: pages[0] || {} });
  } catch (err) {
    res.render('pages/legal.njk', { title: res.locals.t('footer.terms'), pageContent: {} });
  }
});

module.exports = router;
