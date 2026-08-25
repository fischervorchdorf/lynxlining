const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { sendContactNotification, sendOrderNotification, sendInquiryNotification } = require('../config/mail');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

// Kontaktformular
router.post('/contact', async (req, res) => {
  const { name, email, phone, subject, message, website } = req.body;

  // Honeypot check (Spam-Schutz)
  if (website) {
    return res.status(200).json({ success: true }); // Fake success für Bots
  }

  // Validierung
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Bitte füllen Sie alle Pflichtfelder aus.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' });
  }

  try {
    await db.query(`
      INSERT INTO contact_submissions (name, email, phone, subject, message, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, email, phone || null, subject || null, message, req.ip]);

    // E-Mail-Benachrichtigung (async, blockiert nicht die Response)
    sendContactNotification({ name, email, phone, subject, message });

    res.json({ success: true });
  } catch (err) {
    console.error('Kontaktformular Fehler:', err);
    res.status(500).json({ error: 'Beim Senden ist ein Fehler aufgetreten.' });
  }
});

// Shop-Bestellung absenden
router.post('/shop/order', async (req, res) => {
  const {
    customer_name, customer_company, customer_email, customer_phone,
    customer_street, customer_zip, customer_city, customer_country,
    customer_message, items, website
  } = req.body;

  // Honeypot
  if (website) {
    return res.status(200).json({ success: true });
  }

  // Validierung
  if (!customer_name || !customer_email || !items || !items.length) {
    return res.status(400).json({ error: 'Bitte füllen Sie alle Pflichtfelder aus und fügen Sie mindestens ein Produkt hinzu.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
    return res.status(400).json({ error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' });
  }

  try {
    // Bestellnummer generieren
    const orderNumber = 'LL-' + Date.now().toString(36).toUpperCase();

    // Bestellpositionen validieren und Preise aus DB laden
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const [products] = await db.query(`
        SELECT sp.id, sp.unit, spt.name
        FROM shop_products sp
        JOIN shop_product_translations spt ON sp.id = spt.shop_product_id AND spt.locale = 'de'
        WHERE sp.id = ? AND sp.is_active = 1
      `, [item.product_id]);

      if (!products.length) continue;

      const product = products[0];
      const qty = parseFloat(item.quantity);
      if (isNaN(qty) || qty <= 0) continue;

      // Korrekten Staffelpreis ermitteln
      const [tiers] = await db.query(`
        SELECT price_per_unit FROM shop_price_tiers
        WHERE shop_product_id = ? AND min_quantity <= ?
        ORDER BY min_quantity DESC LIMIT 1
      `, [product.id, qty]);

      // Produzentenpreis = Händlerpreis × 0.80 (20% Direktvorteil)
      const haendlerPrice = tiers.length ? parseFloat(tiers[0].price_per_unit) : 0;
      const pricePerUnit = Math.round(haendlerPrice * 0.80 * 100) / 100;
      const totalPrice = Math.round(qty * pricePerUnit * 100) / 100;
      totalAmount += totalPrice;

      validatedItems.push({
        shop_product_id: product.id,
        product_name: product.name,
        quantity: qty,
        unit: product.unit,
        price_per_unit: pricePerUnit,
        total_price: totalPrice
      });
    }

    if (!validatedItems.length) {
      return res.status(400).json({ error: 'Keine gültigen Produkte in der Bestellung.' });
    }

    // Bestellung speichern
    const [orderResult] = await db.query(`
      INSERT INTO shop_orders (order_number, customer_name, customer_company, customer_email,
        customer_phone, customer_street, customer_zip, customer_city, customer_country,
        customer_message, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [orderNumber, customer_name, customer_company || null, customer_email,
        customer_phone || null, customer_street || null, customer_zip || null,
        customer_city || null, customer_country || 'Austria', customer_message || null,
        totalAmount]);

    const orderId = orderResult.insertId;

    // Bestellpositionen speichern
    for (const item of validatedItems) {
      await db.query(`
        INSERT INTO shop_order_items (order_id, shop_product_id, product_name, quantity, unit, price_per_unit, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [orderId, item.shop_product_id, item.product_name, item.quantity, item.unit, item.price_per_unit, item.total_price]);
    }

    // E-Mail-Benachrichtigung (async, blockiert nicht die Response)
    sendOrderNotification({
      orderNumber,
      customerName: customer_name,
      customerCompany: customer_company,
      customerEmail: customer_email,
      customerPhone: customer_phone,
      items: validatedItems,
      totalAmount: totalAmount.toFixed(2)
    });

    res.json({ success: true, orderNumber });
  } catch (err) {
    console.error('Bestellfehler:', err);
    res.status(500).json({ error: 'Beim Absenden der Bestellung ist ein Fehler aufgetreten.' });
  }
});

// Shop-Preisanfrage (Comfort/Ultra)
router.post('/shop/inquiry', async (req, res) => {
  const { product_name, quantity_lfm, quantity_sqm, name, company, email, phone, message, website } = req.body;

  // Honeypot
  if (website) {
    return res.status(200).json({ success: true });
  }

  // Validierung
  if (!name || !email || !product_name) {
    return res.status(400).json({ error: 'Bitte füllen Sie alle Pflichtfelder aus.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' });
  }

  try {
    // In DB speichern
    await db.query(`
      INSERT INTO shop_inquiries (product_name, quantity_lfm, quantity_sqm, customer_name, customer_company, customer_email, customer_phone, message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [product_name, quantity_lfm || null, quantity_sqm || null, name, company || null, email, phone || null, message || null]);

    // E-Mail-Benachrichtigung
    await sendInquiryNotification({
      productName: product_name,
      quantityLfm: quantity_lfm,
      quantitySqm: quantity_sqm,
      name, company, email, phone, message
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Anfrage-Fehler:', err);
    res.status(500).json({ error: 'Beim Senden der Anfrage ist ein Fehler aufgetreten.' });
  }
});

// ============================================================
// LINKEDIN-WEBHOOK
// ============================================================
// Automatisierungsdienste (Zapier, Make, n8n, IFTTT) melden hier jeden neuen
// LinkedIn-Beitrag. Absicherung über ein gemeinsames Geheimnis in
// LINKEDIN_WEBHOOK_TOKEN – ohne gesetztes Token ist der Endpunkt deaktiviert.
//
// Beispiel:
//   POST /api/linkedin/webhook
//   Header: X-Webhook-Token: <LINKEDIN_WEBHOOK_TOKEN>
//   Body:   { "url": "https://www.linkedin.com/posts/...",
//             "text": "Beitragstext ...",
//             "image": "https://media.licdn.com/...",
//             "published_at": "2026-08-25T10:00:00Z" }

const linkedin = require('../config/linkedin');

const linkedinWebhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/linkedin/webhook', linkedinWebhookLimiter, async (req, res) => {
  const expected = process.env.LINKEDIN_WEBHOOK_TOKEN;
  if (!expected) {
    return res.status(503).json({ error: 'LinkedIn-Webhook ist nicht konfiguriert.' });
  }

  const provided = req.get('X-Webhook-Token') || req.query.token || req.body.token || '';
  if (!safeEquals(String(provided), expected)) {
    console.warn('LinkedIn-Webhook: ungültiges Token von', req.ip);
    return res.status(401).json({ error: 'Nicht autorisiert.' });
  }

  const body = req.body || {};
  const url = String(body.url || body.link || body.permalink || '').trim();
  const text = String(body.text || body.content || body.message || body.description || '').trim();

  if (!url && !text) {
    return res.status(400).json({ error: 'url oder text wird benötigt.' });
  }
  if (url && !/^https:\/\/([a-z0-9-]+\.)*linkedin\.com\//i.test(url)) {
    return res.status(400).json({ error: 'url muss eine linkedin.com-Adresse sein.' });
  }

  try {
    const result = await linkedin.savePost({
      guid: body.id || body.guid || linkedin.canonicalGuid(url),
      url,
      title: String(body.title || '').trim(),
      text,
      image: String(body.image || body.image_url || body.thumbnail || '').trim(),
      author: String(body.author || '').trim(),
      publishedAt: body.published_at || body.date || null
    }, 'webhook');

    if (!result.created) {
      return res.json({ success: true, created: false, reason: result.reason, id: result.id });
    }
    console.log('LinkedIn-Webhook: Beitrag importiert (ID ' + result.id + ')');
    res.status(201).json({ success: true, created: true, id: result.id, slug: result.slug });
  } catch (err) {
    console.error('LinkedIn-Webhook Fehler:', err.message);
    res.status(500).json({ error: 'Import fehlgeschlagen.' });
  }
});

// Token-Vergleich in konstanter Zeit (verhindert Timing-Angriffe)
function safeEquals(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = router;
