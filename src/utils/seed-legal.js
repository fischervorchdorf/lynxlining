/**
 * Seed-Script: Vollständige DSGVO-konforme Rechtsseiten
 * Ausführen: node src/utils/seed-legal.js
 *
 * Aktualisiert: Impressum, Datenschutzerklärung, AGB
 */
require('dotenv').config();
const db = require('../config/database');

// ===== IMPRESSUM (DE) =====
const impressumDE = `
<h2>Impressum</h2>

<h3>Angaben gemäß § 5 ECG und Offenlegung gemäß § 25 MedienG</h3>

<p><strong>LYNX Lining</strong><br>
Ing. Kurt Haidecker<br>
Schillerstraße 13<br>
4020 Linz<br>
Österreich</p>

<h3>Kontakt</h3>
<p>
E-Mail: <a href="mailto:office@lynx-lining.com">office@lynx-lining.com</a><br>
Website: <a href="https://www.lynx-lining.com">www.lynx-lining.com</a>
</p>

<h3>Unternehmensgegenstand</h3>
<p>Vertrieb und Verarbeitung von Verschleißschutzfolien aus thermoplastischem Polyurethan (TPU) für den Berg-, Maschinen- und Anlagenbau.</p>

<h3>Umsatzsteuer-Identifikationsnummer</h3>
<p>UID-Nr: ATU__________ <em>(bitte ergänzen)</em></p>

<h3>Aufsichtsbehörde</h3>
<p>Bezirkshauptmannschaft Linz</p>

<h3>Haftungsausschluss</h3>

<h4>Haftung für Inhalte</h4>
<p>Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs.1 ECG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Eine Verpflichtung zur Überwachung übermittelter oder gespeicherter fremder Informationen besteht jedoch nicht.</p>

<h4>Haftung für Links</h4>
<p>Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.</p>

<h4>Urheberrecht</h4>
<p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem österreichischen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.</p>

<h3>Bildnachweis</h3>
<p>Alle Bilder und Grafiken auf dieser Website sind Eigentum von LYNX Lining bzw. wurden mit Genehmigung der jeweiligen Rechteinhaber verwendet.</p>

<h3>Hinweis zum Einsatz von Künstlicher Intelligenz</h3>
<p>Teile dieser Website (Texte, Gestaltung) wurden mit Unterstützung von KI-basierten Werkzeugen erstellt. Alle Inhalte werden von uns inhaltlich geprüft und freigegeben. Die Verantwortung für die veröffentlichten Inhalte liegt bei LYNX Lining.</p>
`;

// ===== IMPRESSUM (EN) =====
const impressumEN = `
<h2>Imprint</h2>

<h3>Information pursuant to § 5 ECG (Austrian E-Commerce Act) and Disclosure pursuant to § 25 MedienG (Austrian Media Act)</h3>

<p><strong>LYNX Lining</strong><br>
Ing. Kurt Haidecker<br>
Schillerstraße 13<br>
4020 Linz<br>
Austria</p>

<h3>Contact</h3>
<p>
Email: <a href="mailto:office@lynx-lining.com">office@lynx-lining.com</a><br>
Website: <a href="https://www.lynx-lining.com">www.lynx-lining.com</a>
</p>

<h3>Business Purpose</h3>
<p>Sales and processing of wear protection films made from thermoplastic polyurethane (TPU) for mining, machinery and plant construction.</p>

<h3>VAT Identification Number</h3>
<p>VAT ID: ATU__________ <em>(to be added)</em></p>

<h3>Supervisory Authority</h3>
<p>District Authority Linz (Bezirkshauptmannschaft Linz)</p>

<h3>Disclaimer</h3>

<h4>Liability for Content</h4>
<p>The contents of our pages have been created with the greatest care. However, we cannot guarantee the accuracy, completeness or timeliness of the content. As a service provider, we are responsible for our own content on these pages in accordance with general legislation pursuant to § 7 (1) ECG. However, there is no obligation to monitor transmitted or stored third-party information.</p>

<h4>Liability for Links</h4>
<p>Our website contains links to external third-party websites over whose content we have no influence. Therefore, we cannot accept any liability for this third-party content. The respective provider or operator of the linked pages is always responsible for the content of the linked pages.</p>

<h4>Copyright</h4>
<p>The content and works created by the site operators on these pages are subject to Austrian copyright law. Reproduction, editing, distribution and any kind of use beyond the limits of copyright law require the written consent of the respective author or creator.</p>

<h3>Image Credits</h3>
<p>All images and graphics on this website are the property of LYNX Lining or have been used with the permission of the respective rights holders.</p>

<h3>Notice on the Use of Artificial Intelligence</h3>
<p>Parts of this website (texts, design) were created with the support of AI-based tools. All content is reviewed and approved by us. LYNX Lining is responsible for all published content.</p>
`;

// ===== DATENSCHUTZERKLÄRUNG (DE) =====
const datenschutzDE = `
<h2>Datenschutzerklärung</h2>

<p>Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Wir verarbeiten Ihre Daten daher ausschließlich auf Grundlage der gesetzlichen Bestimmungen (DSGVO, DSG, TKG 2003). In dieser Datenschutzerklärung informieren wir Sie über die wichtigsten Aspekte der Datenverarbeitung im Rahmen unserer Website.</p>

<h3>1. Verantwortlicher</h3>
<p><strong>LYNX Lining</strong><br>
Ing. Kurt Haidecker<br>
Schillerstraße 13<br>
4020 Linz, Österreich<br>
E-Mail: <a href="mailto:office@lynx-lining.com">office@lynx-lining.com</a></p>

<h3>2. Erhebung und Speicherung personenbezogener Daten</h3>

<h4>a) Beim Besuch der Website</h4>
<p>Beim Aufrufen unserer Website werden durch den Browser automatisch Informationen an den Server unserer Website gesendet. Diese Informationen werden temporär in einem sogenannten Logfile gespeichert. Folgende Informationen werden dabei ohne Ihr Zutun erfasst und bis zur automatisierten Löschung gespeichert:</p>
<ul>
  <li>IP-Adresse des anfragenden Rechners</li>
  <li>Datum und Uhrzeit des Zugriffs</li>
  <li>Name und URL der abgerufenen Datei</li>
  <li>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
  <li>Verwendeter Browser und ggf. das Betriebssystem</li>
</ul>
<p>Die genannten Daten werden zu folgenden Zwecken verarbeitet:</p>
<ul>
  <li>Gewährleistung eines reibungslosen Verbindungsaufbaus der Website</li>
  <li>Gewährleistung einer komfortablen Nutzung unserer Website</li>
  <li>Auswertung der Systemsicherheit und -stabilität</li>
</ul>
<p>Die Rechtsgrundlage für die Datenverarbeitung ist Art. 6 Abs. 1 S. 1 lit. f DSGVO. Unser berechtigtes Interesse folgt aus den oben aufgelisteten Zwecken zur Datenerhebung.</p>

<h4>b) Bei Nutzung des Kontaktformulars</h4>
<p>Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Formular inklusive der von Ihnen dort angegebenen Kontaktdaten (Name, E-Mail-Adresse, Telefonnummer, Betreff, Nachricht) zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.</p>
<p>Die Verarbeitung der in das Kontaktformular eingegebenen Daten erfolgt auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Ein Widerruf Ihrer bereits erteilten Einwilligung ist jederzeit möglich per E-Mail an office@lynx-lining.com.</p>

<h4>c) Bei Bestellungen über den Online-Shop</h4>
<p>Wenn Sie über unseren Online-Shop eine Bestellung aufgeben, erheben wir folgende personenbezogene Daten:</p>
<ul>
  <li>Firmenname</li>
  <li>Name und Vorname</li>
  <li>E-Mail-Adresse</li>
  <li>Telefonnummer</li>
  <li>Anschrift (Straße, PLZ, Ort, Land)</li>
  <li>Bestelldetails und Anmerkungen</li>
</ul>
<p>Diese Daten werden zur Abwicklung und Bearbeitung Ihrer Bestellung verwendet. Die Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</p>

<h3>3. Weitergabe von Daten</h3>
<p>Eine Übermittlung Ihrer persönlichen Daten an Dritte zu anderen als den im Folgenden aufgeführten Zwecken findet nicht statt:</p>
<ul>
  <li>Sie haben Ihre ausdrückliche Einwilligung dazu erteilt (Art. 6 Abs. 1 S. 1 lit. a DSGVO)</li>
  <li>Die Weitergabe ist zur Vertragsabwicklung erforderlich (Art. 6 Abs. 1 S. 1 lit. b DSGVO)</li>
  <li>Die Weitergabe ist zur Erfüllung einer rechtlichen Verpflichtung erforderlich (Art. 6 Abs. 1 S. 1 lit. c DSGVO)</li>
</ul>

<h3>4. Cookies</h3>
<p>Unsere Website verwendet Cookies. Dabei handelt es sich um kleine Textdateien, die Ihr Webbrowser auf Ihrem Endgerät speichert.</p>

<h4>Technisch notwendige Cookies</h4>
<p>Wir verwenden technisch notwendige Cookies für die grundlegende Funktion der Website (Session-Management, Sprachauswahl). Diese Cookies werden ohne Ihre Einwilligung gesetzt, da sie für den Betrieb der Website unerlässlich sind. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).</p>

<h4>Analyse-Cookies (optional)</h4>
<p>Falls Sie in unserem Cookie-Banner der Nutzung von Analyse-Cookies zustimmen, verwenden wir diese um zu verstehen, wie Besucher unsere Website nutzen. Die Rechtsgrundlage hierfür ist Ihre Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO. Sie können Ihre Einwilligung jederzeit widerrufen, indem Sie Ihre Cookie-Einstellungen ändern.</p>

<h3>5. Hosting</h3>
<p>Unsere Website wird bei Hetzner Online GmbH gehostet. Die Server befinden sich in Deutschland und unterliegen somit den europäischen Datenschutzgesetzen. Es findet keine Datenübertragung in Drittländer statt.</p>
<p>Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Deutschland<br>
Datenschutzerklärung: <a href="https://www.hetzner.com/de/legal/privacy-policy" target="_blank" rel="noopener">https://www.hetzner.com/de/legal/privacy-policy</a></p>

<h3>6. Keine Nutzung externer Dienste</h3>
<p>Unsere Website lädt <strong>keine externen Ressourcen</strong> von Drittanbietern (wie Google Fonts, Google Analytics, Facebook Pixel, o.ä.). Alle Schriftarten und Ressourcen werden lokal von unserem eigenen Server bereitgestellt. Es findet daher keine Datenübertragung an externe Dienste statt.</p>

<h3>7. SSL-Verschlüsselung</h3>
<p>Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte eine SSL-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von "http://" auf "https://" wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.</p>

<h3>8. Ihre Rechte</h3>
<p>Ihnen stehen grundsätzlich die Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch zu. Wenn Sie glauben, dass die Verarbeitung Ihrer Daten gegen das Datenschutzrecht verstößt oder Ihre datenschutzrechtlichen Ansprüche sonst in einer Weise verletzt worden sind, können Sie sich bei der Aufsichtsbehörde beschweren:</p>
<p><strong>Österreichische Datenschutzbehörde</strong><br>
Barichgasse 40-42<br>
1030 Wien<br>
Telefon: +43 1 52 152-0<br>
E-Mail: <a href="mailto:dsb@dsb.gv.at">dsb@dsb.gv.at</a><br>
Website: <a href="https://www.dsb.gv.at" target="_blank" rel="noopener">https://www.dsb.gv.at</a></p>

<h3>9. Datenspeicherung</h3>
<p>Personenbezogene Daten, die uns über das Kontaktformular oder Bestellformular übermittelt werden, werden nur so lange gespeichert, wie es der Zweck der Verarbeitung erfordert oder gesetzliche Aufbewahrungspflichten bestehen (z.B. steuerrechtliche Aufbewahrungspflichten von 7 Jahren).</p>

<h3>10. Änderungen dieser Datenschutzerklärung</h3>
<p>Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht. Die jeweils aktuelle Datenschutzerklärung ist auf unserer Website abrufbar.</p>

<p><em>Stand: Februar 2026</em></p>
`;

// ===== DATENSCHUTZERKLÄRUNG (EN) =====
const datenschutzEN = `
<h2>Privacy Policy</h2>

<p>The protection of your personal data is particularly important to us. We process your data exclusively on the basis of legal provisions (GDPR, Austrian DSG, TKG 2003). In this privacy policy, we inform you about the most important aspects of data processing on our website.</p>

<h3>1. Controller</h3>
<p><strong>LYNX Lining</strong><br>
Ing. Kurt Haidecker<br>
Schillerstraße 13<br>
4020 Linz, Austria<br>
Email: <a href="mailto:office@lynx-lining.com">office@lynx-lining.com</a></p>

<h3>2. Collection and Storage of Personal Data</h3>

<h4>a) When Visiting the Website</h4>
<p>When you access our website, your browser automatically sends information to our website server. This information is temporarily stored in a log file. The following information is collected without your intervention and stored until automatic deletion:</p>
<ul>
  <li>IP address of the requesting computer</li>
  <li>Date and time of access</li>
  <li>Name and URL of the retrieved file</li>
  <li>Website from which the access was made (referrer URL)</li>
  <li>Browser used and, if applicable, the operating system</li>
</ul>
<p>The aforementioned data is processed for the following purposes:</p>
<ul>
  <li>Ensuring a smooth connection to the website</li>
  <li>Ensuring comfortable use of our website</li>
  <li>Evaluation of system security and stability</li>
</ul>
<p>The legal basis for data processing is Art. 6 para. 1 sentence 1 lit. f GDPR. Our legitimate interest follows from the purposes listed above.</p>

<h4>b) When Using the Contact Form</h4>
<p>When you send us inquiries via the contact form, your details from the form including the contact data you provide (name, email address, phone number, subject, message) are stored for the purpose of processing the inquiry and in case of follow-up questions. We do not share this data without your consent.</p>
<p>The processing of the data entered in the contact form is based on your consent (Art. 6 para. 1 lit. a GDPR). You can revoke your consent at any time by email to office@lynx-lining.com.</p>

<h4>c) When Placing Orders via the Online Shop</h4>
<p>When you place an order through our online shop, we collect the following personal data:</p>
<ul>
  <li>Company name</li>
  <li>First and last name</li>
  <li>Email address</li>
  <li>Phone number</li>
  <li>Address (street, zip code, city, country)</li>
  <li>Order details and notes</li>
</ul>
<p>This data is used to process and handle your order. The legal basis is Art. 6 para. 1 lit. b GDPR (contract fulfillment).</p>

<h3>3. Disclosure of Data</h3>
<p>Your personal data will not be transferred to third parties for purposes other than those listed below:</p>
<ul>
  <li>You have given your express consent (Art. 6 para. 1 sentence 1 lit. a GDPR)</li>
  <li>The transfer is necessary for contract processing (Art. 6 para. 1 sentence 1 lit. b GDPR)</li>
  <li>The transfer is necessary to fulfill a legal obligation (Art. 6 para. 1 sentence 1 lit. c GDPR)</li>
</ul>

<h3>4. Cookies</h3>
<p>Our website uses cookies. These are small text files that your web browser stores on your device.</p>

<h4>Technically Necessary Cookies</h4>
<p>We use technically necessary cookies for the basic functionality of the website (session management, language selection). These cookies are set without your consent as they are essential for the operation of the website. The legal basis is Art. 6 para. 1 lit. f GDPR (legitimate interest).</p>

<h4>Analytics Cookies (optional)</h4>
<p>If you consent to the use of analytics cookies in our cookie banner, we use these to understand how visitors use our website. The legal basis for this is your consent pursuant to Art. 6 para. 1 lit. a GDPR. You can revoke your consent at any time by changing your cookie settings.</p>

<h3>5. Hosting</h3>
<p>Our website is hosted by Hetzner Online GmbH. The servers are located in Germany and are therefore subject to European data protection laws. No data is transferred to third countries.</p>
<p>Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Germany<br>
Privacy Policy: <a href="https://www.hetzner.com/legal/privacy-policy" target="_blank" rel="noopener">https://www.hetzner.com/legal/privacy-policy</a></p>

<h3>6. No Use of External Services</h3>
<p>Our website does <strong>not load any external resources</strong> from third-party providers (such as Google Fonts, Google Analytics, Facebook Pixel, etc.). All fonts and resources are served locally from our own server. Therefore, no data is transferred to external services.</p>

<h3>7. SSL Encryption</h3>
<p>For security reasons and to protect the transmission of confidential content, this site uses SSL encryption. You can recognize an encrypted connection by the address bar of your browser changing from "http://" to "https://" and the lock icon in your browser bar.</p>

<h3>8. Your Rights</h3>
<p>You generally have the rights of access, rectification, erasure, restriction, data portability and objection. If you believe that the processing of your data violates data protection law or your data protection rights have been violated in any way, you can file a complaint with the supervisory authority:</p>
<p><strong>Austrian Data Protection Authority</strong><br>
Barichgasse 40-42<br>
1030 Vienna, Austria<br>
Phone: +43 1 52 152-0<br>
Email: <a href="mailto:dsb@dsb.gv.at">dsb@dsb.gv.at</a><br>
Website: <a href="https://www.dsb.gv.at" target="_blank" rel="noopener">https://www.dsb.gv.at</a></p>

<h3>9. Data Storage</h3>
<p>Personal data transmitted to us via the contact form or order form is only stored for as long as the purpose of the processing requires or legal retention obligations exist (e.g., tax retention obligations of 7 years).</p>

<h3>10. Changes to this Privacy Policy</h3>
<p>We reserve the right to adapt this privacy policy to ensure it always complies with current legal requirements. The current privacy policy is always available on our website.</p>

<p><em>Last updated: February 2026</em></p>
`;

// ===== AGB (DE) =====
const agbDE = `
<h2>Allgemeine Geschäftsbedingungen (AGB)</h2>

<h3>1. Geltungsbereich</h3>
<p>Diese Allgemeinen Geschäftsbedingungen gelten für alle Geschäftsbeziehungen zwischen LYNX Lining (Ing. Kurt Haidecker, Schillerstraße 13, 4020 Linz, Österreich) – nachfolgend „Verkäufer" – und dem Kunden – nachfolgend „Käufer". Abweichende Geschäftsbedingungen des Käufers werden nicht anerkannt, es sei denn, der Verkäufer stimmt ihrer Geltung ausdrücklich schriftlich zu.</p>

<h3>2. Vertragsschluss</h3>
<p>Bestellungen über den Online-Shop oder per E-Mail stellen ein Angebot des Käufers zum Abschluss eines Kaufvertrages dar. Der Vertrag kommt erst durch die schriftliche Auftragsbestätigung des Verkäufers zustande. Die Darstellung der Produkte im Online-Shop stellt kein rechtlich bindendes Angebot dar.</p>

<h3>3. Preise und Zahlung</h3>
<p>Alle angegebenen Preise verstehen sich netto zzgl. der gesetzlichen Mehrwertsteuer und zzgl. Versandkosten. Staffelpreise gelten gemäß den auf der Website angegebenen Mengenstaffeln. Die Zahlung erfolgt nach Vereinbarung per Überweisung. Zahlungsziel: 14 Tage nach Rechnungsstellung, sofern nicht anders vereinbart.</p>

<h3>4. Lieferbedingungen</h3>
<p>Die Lieferung erfolgt ab Werk (EXW Linz, Incoterms 2020), sofern nicht anders vereinbart. Liefertermine sind unverbindlich, es sei denn, sie wurden ausdrücklich als verbindlich bestätigt. Der Gefahrenübergang erfolgt mit der Übergabe der Ware an den Spediteur oder Frachtführer. Teillieferungen sind zulässig.</p>

<h3>5. Eigentumsvorbehalt</h3>
<p>Die gelieferte Ware bleibt bis zur vollständigen Bezahlung aller Forderungen aus der Geschäftsbeziehung Eigentum des Verkäufers.</p>

<h3>6. Gewährleistung und Mängelhaftung</h3>
<p>Der Käufer hat die Ware unverzüglich nach Erhalt zu prüfen und etwaige Mängel innerhalb von 8 Werktagen schriftlich zu rügen. Die Gewährleistungsfrist beträgt 12 Monate ab Lieferung. Die Gewährleistung umfasst nach Wahl des Verkäufers Nachbesserung oder Ersatzlieferung. Weitergehende Ansprüche, insbesondere auf Schadensersatz, sind ausgeschlossen, soweit gesetzlich zulässig.</p>

<h3>7. Haftungsbeschränkung</h3>
<p>Die Haftung des Verkäufers beschränkt sich auf Vorsatz und grobe Fahrlässigkeit. Die Haftung für leichte Fahrlässigkeit sowie für Folgeschäden und entgangenen Gewinn ist ausgeschlossen, soweit gesetzlich zulässig. Die Haftung ist in jedem Fall auf die Höhe des Auftragswertes beschränkt.</p>

<h3>8. Widerrufsrecht</h3>
<p>Es handelt sich bei unseren Produkten um individuell gefertigte oder konfigurierte Waren (Zuschnitte, Sonderformate). Ein Widerrufsrecht nach dem Fern- und Auswärtsgeschäfte-Gesetz (FAGG) ist bei Waren, die nach Kundenspezifikation angefertigt werden, ausgeschlossen (§ 18 Abs. 1 Z 3 FAGG).</p>
<p>Bei Standardware (nicht zugeschnitten, Rollenware ab Lager) räumen wir Ihnen ein freiwilliges Rückgaberecht von 14 Tagen ab Warenerhalt ein. Die Ware muss sich in einwandfreiem, unbenutztem Zustand und in der Originalverpackung befinden. Die Rücksendekosten trägt der Käufer.</p>

<h3>9. Muster-Widerrufsformular</h3>
<p>Falls Sie den Vertrag widerrufen wollen (nur bei Standardware gemäß Punkt 8), können Sie dieses Formular verwenden:</p>
<div style="border:1px solid #ccc;padding:15px;margin:10px 0;background:#f9f9f9;">
<p><strong>An:</strong><br>
LYNX Lining<br>
Ing. Kurt Haidecker<br>
Schillerstraße 13, 4020 Linz, Österreich<br>
E-Mail: office@lynx-lining.com</p>
<p>Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*):</p>
<p>_______________________________________________</p>
<p>Bestellt am (*) / erhalten am (*):<br>_______________________________________________</p>
<p>Name des/der Verbraucher(s):<br>_______________________________________________</p>
<p>Anschrift des/der Verbraucher(s):<br>_______________________________________________</p>
<p>Datum:<br>_______________________________________________</p>
<p>Unterschrift (nur bei Mitteilung auf Papier):<br>_______________________________________________</p>
<p><em>(*) Unzutreffendes streichen.</em></p>
</div>

<h3>10. Datenschutz</h3>
<p>Die Erhebung und Verarbeitung personenbezogener Daten erfolgt gemäß unserer <a href="/de/datenschutz">Datenschutzerklärung</a>.</p>

<h3>11. Anwendbares Recht und Gerichtsstand</h3>
<p>Es gilt ausschließlich österreichisches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand für alle Streitigkeiten ist Linz, Österreich.</p>

<h3>12. Salvatorische Klausel</h3>
<p>Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, so wird die Wirksamkeit der übrigen Bestimmungen davon nicht berührt. Die unwirksame Bestimmung wird durch eine wirksame Bestimmung ersetzt, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt.</p>

<p><em>Stand: März 2026</em></p>
`;

// ===== AGB (EN) =====
const agbEN = `
<h2>General Terms and Conditions</h2>

<h3>1. Scope of Application</h3>
<p>These General Terms and Conditions apply to all business relationships between LYNX Lining (Ing. Kurt Haidecker, Schillerstraße 13, 4020 Linz, Austria) – hereinafter referred to as "Seller" – and the customer – hereinafter referred to as "Buyer". Deviating terms and conditions of the Buyer are not recognized unless the Seller expressly agrees to their validity in writing.</p>

<h3>2. Conclusion of Contract</h3>
<p>Orders via the online shop or by email constitute an offer by the Buyer to conclude a purchase contract. The contract is only concluded upon written order confirmation by the Seller. The presentation of products in the online shop does not constitute a legally binding offer.</p>

<h3>3. Prices and Payment</h3>
<p>All stated prices are net prices plus applicable value added tax and shipping costs. Volume discounts apply according to the quantity tiers indicated on the website. Payment is made by bank transfer as agreed. Payment term: 14 days after invoicing, unless otherwise agreed.</p>

<h3>4. Delivery Conditions</h3>
<p>Delivery is ex works (EXW Linz, Incoterms 2020), unless otherwise agreed. Delivery dates are non-binding unless expressly confirmed as binding. The risk passes upon handover of the goods to the carrier or freight forwarder. Partial deliveries are permitted.</p>

<h3>5. Retention of Title</h3>
<p>The delivered goods remain the property of the Seller until full payment of all claims arising from the business relationship.</p>

<h3>6. Warranty and Defect Liability</h3>
<p>The Buyer must inspect the goods immediately upon receipt and report any defects in writing within 8 working days. The warranty period is 12 months from delivery. The warranty covers, at the Seller's discretion, repair or replacement delivery. Further claims, in particular for damages, are excluded to the extent permitted by law.</p>

<h3>7. Limitation of Liability</h3>
<p>The Seller's liability is limited to intent and gross negligence. Liability for slight negligence as well as for consequential damages and lost profits is excluded to the extent permitted by law. Liability is in any case limited to the order value.</p>

<h3>8. Right of Withdrawal</h3>
<p>Our products are individually manufactured or configured goods (custom cuts, special formats). The right of withdrawal under the Austrian Distance and Off-Premises Contracts Act (FAGG) is excluded for goods manufactured to customer specifications (§ 18 para. 1 no. 3 FAGG).</p>
<p>For standard goods (uncut, roll material from stock), we grant you a voluntary return right of 14 days from receipt of goods. The goods must be in perfect, unused condition and in their original packaging. Return shipping costs are borne by the Buyer.</p>

<h3>9. Model Withdrawal Form</h3>
<p>If you wish to withdraw from the contract (only for standard goods as per Section 8), you may use this form:</p>
<div style="border:1px solid #ccc;padding:15px;margin:10px 0;background:#f9f9f9;">
<p><strong>To:</strong><br>
LYNX Lining<br>
Ing. Kurt Haidecker<br>
Schillerstraße 13, 4020 Linz, Austria<br>
Email: office@lynx-lining.com</p>
<p>I/We (*) hereby withdraw from the contract concluded by me/us (*) for the purchase of the following goods (*):</p>
<p>_______________________________________________</p>
<p>Ordered on (*) / received on (*):<br>_______________________________________________</p>
<p>Name of consumer(s):<br>_______________________________________________</p>
<p>Address of consumer(s):<br>_______________________________________________</p>
<p>Date:<br>_______________________________________________</p>
<p>Signature (only for paper communication):<br>_______________________________________________</p>
<p><em>(*) Delete as appropriate.</em></p>
</div>

<h3>10. Data Protection</h3>
<p>The collection and processing of personal data is carried out in accordance with our <a href="/en/datenschutz">Privacy Policy</a>.</p>

<h3>11. Applicable Law and Jurisdiction</h3>
<p>Austrian law applies exclusively, excluding the UN Convention on Contracts for the International Sale of Goods. The place of jurisdiction for all disputes is Linz, Austria.</p>

<h3>12. Severability Clause</h3>
<p>Should individual provisions of these Terms and Conditions be or become invalid, the validity of the remaining provisions shall not be affected. The invalid provision shall be replaced by a valid provision that comes closest to the economic purpose of the invalid provision.</p>

<p><em>Last updated: March 2026</em></p>
`;

async function seedLegal() {
  console.log('Aktualisiere Rechtsseiten...\n');

  const pages = [
    { slug: 'impressum', de: { title: 'Impressum', content: impressumDE }, en: { title: 'Imprint', content: impressumEN } },
    { slug: 'datenschutz', de: { title: 'Datenschutzerklärung', content: datenschutzDE }, en: { title: 'Privacy Policy', content: datenschutzEN } },
    { slug: 'agb', de: { title: 'Allgemeine Geschäftsbedingungen', content: agbDE }, en: { title: 'Terms & Conditions', content: agbEN } }
  ];

  for (const pg of pages) {
    // Ensure page exists
    await db.query(`INSERT INTO pages (slug, page_type) VALUES (?, 'legal')
      ON DUPLICATE KEY UPDATE page_type = 'legal'`, [pg.slug]);

    const [rows] = await db.query(`SELECT id FROM pages WHERE slug = ?`, [pg.slug]);
    const pgId = rows[0].id;

    // Update/Insert German translation
    await db.query(`INSERT INTO page_translations (page_id, locale, title, content) VALUES (?, 'de', ?, ?)
      ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content)`, [pgId, pg.de.title, pg.de.content]);

    // Update/Insert English translation
    await db.query(`INSERT INTO page_translations (page_id, locale, title, content) VALUES (?, 'en', ?, ?)
      ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content)`, [pgId, pg.en.title, pg.en.content]);

    console.log(`✓ ${pg.de.title} (DE + EN)`);
  }

  console.log('\n✅ Alle Rechtsseiten aktualisiert!');
  process.exit(0);
}

seedLegal().catch(err => {
  console.error('Fehler:', err);
  process.exit(1);
});
