const fs = require('fs');
const path = require('path');

const locales = {};
const supportedLocales = ['de', 'en'];
const defaultLocale = 'de';

// Locale-Dateien laden
for (const locale of supportedLocales) {
  const filePath = path.join(__dirname, '..', 'locales', `${locale}.json`);
  if (fs.existsSync(filePath)) {
    locales[locale] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
}

function getNestedValue(obj, keyPath) {
  return keyPath.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : keyPath), obj);
}

function i18n(req, res, next) {
  // Sprache aus URL ermitteln: /de/... oder /en/...
  const pathParts = req.path.split('/').filter(Boolean);
  let locale = defaultLocale;

  if (pathParts.length > 0 && supportedLocales.includes(pathParts[0])) {
    locale = pathParts[0];
  }

  req.locale = locale;
  res.locals.locale = locale;
  res.locals.locales = supportedLocales;
  res.locals.defaultLocale = defaultLocale;

  // Übersetzungsfunktion t()
  res.locals.t = function(key) {
    const translations = locales[locale] || locales[defaultLocale] || {};
    return getNestedValue(translations, key);
  };

  // URL mit anderer Sprache generieren
  res.locals.localePath = function(targetLocale) {
    const currentPath = req.originalUrl;
    const cleanPath = currentPath.replace(/^\/(de|en)(\/|$)/, '/');
    return `/${targetLocale}${cleanPath === '/' ? '' : cleanPath}`;
  };

  next();
}

module.exports = { i18n };
