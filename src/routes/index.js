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
  res.redirect(301, '/de/');
});

// Redirect /:locale (without trailing slash) to /:locale/
router.get('/:locale', validateLocale, (req, res) => {
  res.redirect(301, `/${req.params.locale}/`);
});

// ===== sitemap.xml (dynamisch) =====
router.get('/sitemap.xml', async (req, res) => {
  const siteUrl = (process.env.SITE_URL || 'https://www.lynx-lining.com').replace(/\/$/, '');
  const today = new Date().toISOString().split('T')[0];

  const staticPaths = [
    { path: '', priority: '1.0', changefreq: 'weekly' },
    { path: '/produkte', priority: '0.9', changefreq: 'monthly' },
    { path: '/vorteile', priority: '0.8', changefreq: 'monthly' },
    { path: '/anwendungen', priority: '0.9', changefreq: 'monthly' },
    { path: '/montage', priority: '0.7', changefreq: 'monthly' },
    { path: '/referenzen', priority: '0.7', changefreq: 'monthly' },
    { path: '/galerie', priority: '0.6', changefreq: 'monthly' },
    { path: '/shop', priority: '0.9', changefreq: 'weekly' },
    { path: '/news', priority: '0.8', changefreq: 'weekly' },
    { path: '/kontakt', priority: '0.7', changefreq: 'yearly' },
    { path: '/impressum', priority: '0.3', changefreq: 'yearly' },
    { path: '/datenschutz', priority: '0.3', changefreq: 'yearly' },
    { path: '/agb', priority: '0.3', changefreq: 'yearly' }
  ];

  const urls = [];

  // Statische Seiten DE/EN mit hreflang-Alternates
  for (const { path, priority, changefreq } of staticPaths) {
    for (const locale of SUPPORTED_LOCALES) {
      urls.push({
        loc: `${siteUrl}/${locale}${path || '/'}`,
        lastmod: today,
        changefreq,
        priority,
        alternates: SUPPORTED_LOCALES.map(l => ({
          hreflang: l,
          href: `${siteUrl}/${l}${path || '/'}`
        }))
      });
    }
  }

  // LinkedIn-News-Detailseiten dynamisch ergänzen
  try {
    const [liPosts] = await db.query(`
      SELECT slug, id, updated_at FROM linkedin_posts WHERE is_visible = 1
    `);
    for (const post of liPosts) {
      const slug = post.slug || post.id;
      for (const locale of SUPPORTED_LOCALES) {
        urls.push({
          loc: `${siteUrl}/${locale}/news/linkedin/${slug}`,
          lastmod: post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : today,
          changefreq: 'monthly',
          priority: '0.6',
          alternates: SUPPORTED_LOCALES.map(l => ({
            hreflang: l,
            href: `${siteUrl}/${l}/news/linkedin/${slug}`
          }))
        });
      }
    }
  } catch (e) { /* DB optional */ }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
    'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls.map(u =>
      '  <url>\n' +
      `    <loc>${u.loc}</loc>\n` +
      `    <lastmod>${u.lastmod}</lastmod>\n` +
      `    <changefreq>${u.changefreq}</changefreq>\n` +
      `    <priority>${u.priority}</priority>\n` +
      u.alternates.map(a =>
        `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>\n`
      ).join('') +
      '  </url>'
    ).join('\n') +
    '\n</urlset>\n';

  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml);
});

// Homepage
router.get('/:locale/', validateLocale, async (req, res) => {
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
      title: res.locals.t('meta.home_title'),
      metaDescription: res.locals.t('meta.home_description'),
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
      title: res.locals.t('meta.home_title'),
      metaDescription: res.locals.t('meta.home_description'),
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
    res.render('pages/products.njk', { title: res.locals.t('meta.products_title'), metaDescription: res.locals.t('meta.products_description'), products, page: 'products' });
  } catch (err) {
    res.render('pages/products.njk', { title: res.locals.t('meta.products_title'), metaDescription: res.locals.t('meta.products_description'), products: [], page: 'products' });
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
    res.render('pages/advantages.njk', { title: res.locals.t('meta.advantages_title'), metaDescription: res.locals.t('meta.advantages_description'), advantages, page: 'advantages' });
  } catch (err) {
    res.render('pages/advantages.njk', { title: res.locals.t('meta.advantages_title'), metaDescription: res.locals.t('meta.advantages_description'), advantages: [], page: 'advantages' });
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
    res.render('pages/applications.njk', { title: res.locals.t('meta.applications_title'), metaDescription: res.locals.t('meta.applications_description'), applications, page: 'applications' });
  } catch (err) {
    res.render('pages/applications.njk', { title: res.locals.t('meta.applications_title'), metaDescription: res.locals.t('meta.applications_description'), applications: [], page: 'applications' });
  }
});

// Montage & Befestigung
router.get('/:locale/montage', validateLocale, (req, res) => {
  res.render('pages/mounting.njk', { title: res.locals.t('meta.mounting_title'), metaDescription: res.locals.t('meta.mounting_description'), page: 'mounting' });
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
    res.render('pages/references.njk', { title: res.locals.t('meta.references_title'), metaDescription: res.locals.t('meta.references_description'), references, page: 'references' });
  } catch (err) {
    res.render('pages/references.njk', { title: res.locals.t('meta.references_title'), metaDescription: res.locals.t('meta.references_description'), references: [], page: 'references' });
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
    res.render('pages/gallery.njk', { title: res.locals.t('meta.gallery_title'), metaDescription: res.locals.t('meta.gallery_description'), images, page: 'gallery' });
  } catch (err) {
    res.render('pages/gallery.njk', { title: res.locals.t('meta.gallery_title'), metaDescription: res.locals.t('meta.gallery_description'), images: [], page: 'gallery' });
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
    res.render('pages/news.njk', { title: res.locals.t('meta.news_title'), metaDescription: res.locals.t('meta.news_description'), newsPosts, instagramPosts, linkedinPosts, page: 'news' });
  } catch (err) {
    res.render('pages/news.njk', { title: res.locals.t('meta.news_title'), metaDescription: res.locals.t('meta.news_description'), newsPosts: [], instagramPosts: [], linkedinPosts: [], page: 'news' });
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
      title: posts[0].title + ' | LYNX Lining',
      metaDescription: posts[0].excerpt || res.locals.t('meta.news_description'),
      ogType: 'article',
      ogImage: posts[0].image_path || undefined,
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
      SELECT sp.*, spt.name, spt.short_description, spt.description,
        sp.price_on_request, sp.price_per_sqm, sp.sqm_per_roll,
        sp.roll_length_lfm, sp.roll_width_mm, sp.roll_weight_kg,
        sp.roll_outer_diameter_mm, sp.roll_core_diameter_mm, sp.roll_core_width_mm
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

    res.render('pages/shop.njk', { title: res.locals.t('meta.shop_title'), metaDescription: res.locals.t('meta.shop_description'), products, page: 'shop' });
  } catch (err) {
    console.error('Shop-Fehler:', err);
    res.render('pages/shop.njk', { title: res.locals.t('meta.shop_title'), metaDescription: res.locals.t('meta.shop_description'), products: [], page: 'shop' });
  }
});

// Kontakt
router.get('/:locale/kontakt', validateLocale, (req, res) => {
  res.render('pages/contact.njk', { title: res.locals.t('meta.contact_title'), metaDescription: res.locals.t('meta.contact_description'), page: 'contact' });
});

// Impressum
router.get('/:locale/impressum', validateLocale, async (req, res) => {
  try {
    const [pages] = await db.query(`
      SELECT pt.title, pt.content FROM pages p
      JOIN page_translations pt ON p.id = pt.page_id AND pt.locale = ?
      WHERE p.slug = 'impressum'
    `, [req.locale]);
    res.render('pages/legal.njk', { title: res.locals.t('meta.imprint_title'), metaDescription: res.locals.t('meta.imprint_description'), pageContent: pages[0] || {} });
  } catch (err) {
    res.render('pages/legal.njk', { title: res.locals.t('meta.imprint_title'), metaDescription: res.locals.t('meta.imprint_description'), pageContent: {} });
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
    res.render('pages/legal.njk', { title: res.locals.t('meta.privacy_title'), metaDescription: res.locals.t('meta.privacy_description'), pageContent: pages[0] || {} });
  } catch (err) {
    res.render('pages/legal.njk', { title: res.locals.t('meta.privacy_title'), metaDescription: res.locals.t('meta.privacy_description'), pageContent: {} });
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
    res.render('pages/legal.njk', { title: res.locals.t('meta.terms_title'), metaDescription: res.locals.t('meta.terms_description'), pageContent: pages[0] || {} });
  } catch (err) {
    res.render('pages/legal.njk', { title: res.locals.t('meta.terms_title'), metaDescription: res.locals.t('meta.terms_description'), pageContent: {} });
  }
});

module.exports = router;
