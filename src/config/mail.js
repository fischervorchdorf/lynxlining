const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || ''
  }
});

async function sendContactNotification({ name, email, phone, subject, message }) {
  const mailTo = process.env.MAIL_TO || 'info@lynx-lining.com';
  const mailFrom = process.env.MAIL_FROM || 'info@lynx-lining.com';

  try {
    await transporter.sendMail({
      from: `"LYNX Lining Website" <${mailFrom}>`,
      to: mailTo,
      subject: `Neue Kontaktanfrage: ${subject || 'Kein Betreff'}`,
      html: `
        <h2>Neue Kontaktanfrage</h2>
        <table style="border-collapse:collapse;width:100%;">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Name</td><td style="padding:8px;border:1px solid #ddd;">${name}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">E-Mail</td><td style="padding:8px;border:1px solid #ddd;"><a href="mailto:${email}">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Telefon</td><td style="padding:8px;border:1px solid #ddd;">${phone}</td></tr>` : ''}
          ${subject ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Betreff</td><td style="padding:8px;border:1px solid #ddd;">${subject}</td></tr>` : ''}
        </table>
        <h3>Nachricht:</h3>
        <p style="white-space:pre-wrap;background:#f5f5f5;padding:15px;border-radius:8px;">${message}</p>
        <hr>
        <p style="color:#999;font-size:12px;">Gesendet über lynx-lining.com Kontaktformular</p>
      `
    });
    console.log('Kontakt-E-Mail gesendet an', mailTo);
  } catch (err) {
    console.warn('E-Mail konnte nicht gesendet werden:', err.message);
  }
}

async function sendOrderNotification({ orderNumber, customerName, customerCompany, customerEmail, customerPhone, items, totalAmount }) {
  const mailTo = process.env.MAIL_TO || 'info@lynx-lining.com';
  const mailFrom = process.env.MAIL_FROM || 'info@lynx-lining.com';

  const itemRows = items.map(item =>
    `<tr>
      <td style="padding:8px;border:1px solid #ddd;">${item.product_name}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.quantity} ${item.unit}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right;">€ ${item.price_per_unit}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold;">€ ${item.total_price}</td>
    </tr>`
  ).join('');

  try {
    await transporter.sendMail({
      from: `"LYNX Lining Shop" <${mailFrom}>`,
      to: mailTo,
      subject: `Neue Bestellung: ${orderNumber}`,
      html: `
        <h2>Neue Bestellung eingegangen</h2>
        <p><strong>Bestellnummer:</strong> ${orderNumber}</p>
        <h3>Kundendaten:</h3>
        <table style="border-collapse:collapse;width:100%;">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Name</td><td style="padding:8px;border:1px solid #ddd;">${customerName}</td></tr>
          ${customerCompany ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Firma</td><td style="padding:8px;border:1px solid #ddd;">${customerCompany}</td></tr>` : ''}
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">E-Mail</td><td style="padding:8px;border:1px solid #ddd;"><a href="mailto:${customerEmail}">${customerEmail}</a></td></tr>
          ${customerPhone ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Telefon</td><td style="padding:8px;border:1px solid #ddd;">${customerPhone}</td></tr>` : ''}
        </table>
        <h3>Bestellpositionen:</h3>
        <table style="border-collapse:collapse;width:100%;">
          <thead><tr style="background:#f5f5f5;">
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Produkt</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:center;">Menge</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right;">Stückpreis</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right;">Gesamt</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
          <tfoot><tr style="background:#f5f5f5;">
            <td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold;">Gesamtsumme (netto)</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold;font-size:16px;color:#D64545;">€ ${totalAmount}</td>
          </tr></tfoot>
        </table>
        <hr>
        <p style="color:#999;font-size:12px;">Bestellung über den LYNX Lining Online-Shop</p>
      `
    });
    console.log('Bestell-E-Mail gesendet an', mailTo);
  } catch (err) {
    console.warn('E-Mail konnte nicht gesendet werden:', err.message);
  }
}

module.exports = { sendContactNotification, sendOrderNotification };
