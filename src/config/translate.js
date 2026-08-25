/**
 * Automatische Übersetzung DE -> EN
 * =================================
 * Importierte LinkedIn-Beiträge liegen nur auf Deutsch vor. Damit die
 * englische Seite nicht deutschen Text zeigt, wird der Beitrag beim Import
 * über die Claude API übersetzt.
 *
 * Zwei Wege, in dieser Reihenfolge:
 *   1. Claude API – wenn ANTHROPIC_API_KEY gesetzt ist. Kennt die Fachbegriffe
 *      des Verschleißschutzes, kostet wenige Cent pro Beitrag.
 *   2. Google Translate – kostenlos, ohne Schlüssel, dafür wörtlicher.
 *      Nutzt denselben Endpunkt wie der Knopf "Alles automatisch übersetzen"
 *      im Beitragsformular.
 *
 * Schlagen beide fehl, wird der deutsche Text gespeichert und der Beitrag im
 * Admin als "EN fehlt" markiert.
 *
 * ENV:
 *   ANTHROPIC_API_KEY         API-Schlüssel (console.anthropic.com), optional
 *   LINKEDIN_AUTO_TRANSLATE   false = Übersetzung ganz abschalten
 */

const AnthropicModule = require('@anthropic-ai/sdk');
const Anthropic = AnthropicModule.default || AnthropicModule;

const MODEL = 'claude-opus-5';

let client = null;

function isEnabled() {
  return process.env.LINKEDIN_AUTO_TRANSLATE !== 'false';
}

/** Welcher Dienst würde gerade verwendet: 'claude', 'google' oder null. */
function activeProvider() {
  if (!isEnabled()) return null;
  return process.env.ANTHROPIC_API_KEY ? 'claude' : 'google';
}

function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const SYSTEM_PROMPT = `Du übersetzt deutsche LinkedIn-Beiträge der Firma LYNX Lining ins Englische.
LYNX Lining stellt Verschleißschutzauskleidungen aus TPU für Berg-, Maschinen- und Anlagenbau her.

Regeln:
- Übersetze in natürliches, professionelles britisches Business-Englisch, keine wörtliche Übersetzung.
- Fachbegriffe korrekt: Verschleißschutz = wear protection, Auskleidung = lining, Schüttgut = bulk material,
  Trichter = hopper, Kipper = tipper, Förderband = conveyor belt, Abrieb = abrasion, Gleisschotter = track ballast.
- Produkt-, Firmen- und Personennamen bleiben unverändert (LYNX Lining, TPU, Namen von Kunden).
- Maßeinheiten und Zahlen unverändert übernehmen (800 m³/h bleibt 800 m³/h).
- Hashtags übersetzen, sofern sie beschreibend sind; Marken-Hashtags bleiben.
- Keine Inhalte hinzufügen oder weglassen, Absatzstruktur beibehalten.
- Der Titel bleibt maximal 90 Zeichen, der Anriss maximal 220 Zeichen.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    excerpt: { type: 'string' },
    content: { type: 'string' }
  },
  required: ['title', 'excerpt', 'content'],
  additionalProperties: false
};

/**
 * Übersetzt Titel, Anriss und Volltext eines Beitrags ins Englische.
 * @param {{title: string, excerpt: string, content: string}} post
 * @returns {Promise<{title: string, excerpt: string, content: string}|null>} null, wenn nicht möglich
 */
async function translatePost(post) {
  if (!isEnabled()) return null;

  const title = String(post.title || '').trim();
  const excerpt = String(post.excerpt || '').trim();
  const content = String(post.content || '').trim();
  if (!title && !excerpt && !content) return null;

  if (!process.env.ANTHROPIC_API_KEY) {
    return translateWithGoogle({ title, excerpt, content });
  }

  const claude = await translateWithClaude({ title, excerpt, content });
  if (claude) return claude;

  // Claude nicht erreichbar – lieber eine wörtliche Übersetzung als deutscher Text
  console.log('Übersetzung: weiche auf Google Translate aus');
  return translateWithGoogle({ title, excerpt, content });
}

async function translateWithClaude({ title, excerpt, content }) {
  const payload = JSON.stringify({ title, excerpt, content }, null, 2);

  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      // Kurze Übersetzung – niedriger Aufwand reicht und hält die Kosten gering
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: OUTPUT_SCHEMA }
      },
      messages: [{
        role: 'user',
        content: `Übersetze die drei Felder dieses LinkedIn-Beitrags ins Englische:\n\n${payload}`
      }]
    });

    const textBlock = response.content.find(block => block.type === 'text');
    if (!textBlock) {
      console.warn('Übersetzung: keine Textantwort erhalten');
      return null;
    }

    const parsed = JSON.parse(textBlock.text);
    const result = {
      title: String(parsed.title || '').trim(),
      excerpt: String(parsed.excerpt || '').trim(),
      content: String(parsed.content || '').trim()
    };

    // Ein leerer Titel würde die Detailseite unbrauchbar machen
    if (!result.title) return null;
    return result;
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      console.warn('Übersetzung: Rate-Limit erreicht, Beitrag bleibt vorerst deutsch');
    } else if (err instanceof Anthropic.AuthenticationError) {
      console.error('Übersetzung: ANTHROPIC_API_KEY ist ungültig');
    } else if (err instanceof Anthropic.APIError) {
      console.error(`Übersetzung: API-Fehler ${err.status}:`, err.message);
    } else {
      console.error('Übersetzung fehlgeschlagen:', err.message);
    }
    return null;
  }
}

/**
 * Kostenlose Übersetzung über Google Translate.
 * Derselbe Endpunkt, den der Knopf "Alles automatisch übersetzen" im
 * Beitragsformular nutzt. Inoffiziell und ohne Zusicherung – schlägt er fehl,
 * wird null zurückgegeben und der Beitrag bleibt deutsch.
 */
async function translateWithGoogle({ title, excerpt, content }) {
  try {
    const [t, e, c] = await Promise.all([
      googleTranslate(title),
      googleTranslate(excerpt),
      googleTranslate(content)
    ]);

    if (!t) return null;
    return { title: t, excerpt: e || '', content: c || '' };
  } catch (err) {
    console.warn('Google-Übersetzung fehlgeschlagen:', err.message);
    return null;
  }
}

/** Einzelnen Text über Google Translate übersetzen (de -> en). */
async function googleTranslate(text, from = 'de', to = 'en') {
  const input = String(text || '').trim();
  if (!input) return '';

  const url = 'https://translate.googleapis.com/translate_a/single' +
    `?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(input)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const parsed = await res.json();
    if (!Array.isArray(parsed) || !Array.isArray(parsed[0])) {
      throw new Error('unerwartete Antwort');
    }
    return parsed[0].map(segment => segment[0]).join('');
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { translatePost, googleTranslate, isEnabled, activeProvider, MODEL };
