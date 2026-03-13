const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { sendContactNotification, sendOrderNotification, sendInquiryNotification } = require('../config/mail');

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

      const pricePerUnit = tiers.length ? parseFloat(tiers[0].price_per_unit) : 0;
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
    sendInquiryNotification({
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

module.exports = router;
