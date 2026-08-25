/**
 * Automatische Übersetzung DE -> EN
 * =================================
 * Importierte LinkedIn-Beiträge liegen nur auf Deutsch vor. Damit die
 * englische Seite nicht deutschen Text zeigt, wird der Beitrag beim Import
 * über die Claude API übersetzt.
 *
 * Ohne ANTHROPIC_API_KEY ist die Funktion inaktiv – der Beitrag wird dann
 * mit dem deutschen Text für beide Sprachen gespeichert und im Admin als
 * "EN fehlt" markiert, sodass die Übersetzung von Hand nachgetragen werden kann.
 *
 * ENV:
 *   ANTHROPIC_API_KEY         API-Schlüssel (console.anthropic.com)
 *   LINKEDIN_AUTO_TRANSLATE   false = Übersetzung abschalten
 */

const AnthropicModule = require('@anthropic-ai/sdk');
const Anthropic = AnthropicModule.default || AnthropicModule;

const MODEL = 'claude-opus-5';

let client = null;

function isEnabled() {
  return !!process.env.ANTHROPIC_API_KEY && process.env.LINKEDIN_AUTO_TRANSLATE !== 'false';
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

module.exports = { translatePost, isEnabled, MODEL };
