# LinkedIn-Beiträge automatisch auf die Homepage

## Kurzfassung

LinkedIn selbst gibt die Beiträge eines **persönlichen Profils** nicht heraus:

- Es gibt **keinen öffentlichen RSS-Feed** für `linkedin.com/in/<profil>/recent-activity/`.
- Die Seite ist hinter einer **Login-Wall**; ein Server, der sie ohne Anmeldung
  abruft, bekommt eine Weiterleitung statt der Beiträge.
- Automatisiertes Auslesen (Scraping) verstößt gegen die
  **LinkedIn-Nutzungsbedingungen** und führt regelmäßig zur Sperre des Kontos.

Die offizielle LinkedIn-API (Community Management API) liefert Beiträge nur für
**Unternehmensseiten**, und auch das erst nach einem Partner-Antrag bei LinkedIn.

Deshalb läuft die Automatik hier über einen der beiden folgenden Wege. Beide
sind erlaubt, brauchen keinen LinkedIn-Partnerstatus und laufen nach der
Einrichtung ohne weiteres Zutun.

| Weg | Aufwand | Kosten | Empfehlung |
|---|---|---|---|
| **A – Feed-Dienst** (rss.app o. ä.) | 10 Minuten | ca. 8–20 €/Monat | für den laufenden Betrieb |
| **B – Zapier/Make-Webhook** | 20 Minuten | ab 0 € (kleines Kontingent) | wenn ohnehin ein Zapier-Konto besteht |
| **C – Einzelimport im Admin** | pro Beitrag ein Klick | 0 € | ohne laufende Kosten, aber nicht automatisch |

---

## Weg A – Feed-Dienst (empfohlen)

Ein Feed-Dienst hat den LinkedIn-Zugang und stellt die Beiträge als RSS-Feed
bereit. Die Website ruft diesen Feed regelmäßig ab.

1. Bei einem Feed-Dienst anmelden, z. B. [rss.app](https://rss.app),
   [Feedspot](https://www.feedspot.com) oder [Fetchrss](https://fetchrss.com).
2. Dort die Profil-URL eintragen:
   `https://www.linkedin.com/in/martin-f-heidecker-951103204/recent-activity/all/`
3. Der Dienst erzeugt eine Feed-Adresse, z. B. `https://rss.app/feeds/xxxxx.xml`.
4. Diese Adresse in der Umgebungskonfiguration eintragen (in Coolify unter
   *Environment Variables*):

   ```
   LINKEDIN_FEED_URL=https://rss.app/feeds/xxxxx.xml
   LINKEDIN_SYNC_INTERVAL_MIN=30
   LINKEDIN_AUTO_PUBLISH=true
   ```

5. Anwendung neu starten. Ab jetzt wird der Feed alle 30 Minuten geprüft; neue
   Beiträge landen automatisch auf der News-Seite und der Startseite.

**Hinweis:** Existiert eine LYNX-Lining-**Unternehmensseite** auf LinkedIn, ist
sie die bessere Quelle – Unternehmensseiten sind öffentlich, die Feeds laufen
stabiler und günstiger als Profil-Feeds.

---

## Weg B – Webhook (Zapier, Make, n8n)

Statt zu pollen, meldet ein Automatisierungsdienst jeden neuen Beitrag aktiv an
die Website.

1. Ein Geheimnis erzeugen und als Umgebungsvariable setzen:

   ```
   LINKEDIN_WEBHOOK_TOKEN=<langes zufälliges Passwort>
   ```

2. In Zapier/Make einen Ablauf anlegen:
   - **Auslöser:** neuer LinkedIn-Beitrag (bei Zapier offiziell nur für
     Unternehmensseiten; für Profile über den RSS-Auslöser mit einem Feed aus Weg A)
   - **Aktion:** *Webhooks → POST* an
     `https://lynx-lining.com/api/linkedin/webhook`
   - **Header:** `X-Webhook-Token: <dasselbe Geheimnis>`
   - **Body (JSON):**

     ```json
     {
       "url": "https://www.linkedin.com/posts/...",
       "text": "Der vollständige Beitragstext",
       "image": "https://media.licdn.com/...",
       "published_at": "2026-08-25T10:00:00Z"
     }
     ```

Die Antwort meldet, ob der Beitrag neu angelegt (`201`) oder bereits vorhanden
war (`200` mit `created: false`). Ein Beitrag wird nie doppelt angelegt.

---

## Weg C – Einzelimport im Admin

Ohne laufende Kosten, dafür ein Klick pro Beitrag:

*Admin → LinkedIn → Feld „Einzelnen Beitrag übernehmen"* – dort den Link des
Beitrags einfügen. Titel, Text und Bild werden übernommen, soweit LinkedIn sie
an nicht angemeldete Besucher herausgibt. Gibt LinkedIn nichts heraus, öffnet
sich das Formular mit der bereits eingetragenen URL zum Ausfüllen.

---

## Englische Fassung

Importierte Beiträge sind deutsch. Ist ein `ANTHROPIC_API_KEY` gesetzt, wird
beim Import automatisch eine englische Fassung über die Claude API erzeugt
(Titel, Anriss und Volltext) und für die englische Seite gespeichert:

```
ANTHROPIC_API_KEY=sk-ant-...
LINKEDIN_AUTO_TRANSLATE=true
```

Die Übersetzung kennt die Fachbegriffe des Verschleißschutzes
(*Auskleidung → lining*, *Schüttgut → bulk material*, *Abrieb → abrasion* …).
Kosten: wenige Cent pro Beitrag.

Ohne Schlüssel wird für Englisch der deutsche Text gespeichert und der Beitrag
im Admin mit **„EN fehlt"** markiert. Die englische Fassung lässt sich dann im
Formular von Hand eintragen – oder später per Knopfdruck
(*Englisch übersetzen*) nachträglich erzeugen, sobald ein Schlüssel hinterlegt ist.

---

## Prüfen und Steuern

Unter *Admin → LinkedIn* zeigt der Bereich **Automatischer Import** an, welcher
Weg aktiv ist, wann zuletzt importiert wurde und wie viele Beiträge noch keine
englische Fassung haben. Der Knopf **Jetzt abrufen** startet den Feed-Abruf
sofort, ohne auf das nächste Intervall zu warten.

Importierte Beiträge lassen sich wie manuell angelegte bearbeiten, verstecken
und löschen. Ein bearbeiteter Beitrag wird vom Import **nicht überschrieben** –
Korrekturen bleiben also erhalten.

Soll jeder Beitrag vor der Veröffentlichung gesichtet werden:

```
LINKEDIN_AUTO_PUBLISH=false
```

Dann werden importierte Beiträge versteckt angelegt und erscheinen erst nach
einem Klick auf *Versteckt → Sichtbar* im Admin auf der Website.

---

## Alle Umgebungsvariablen

| Variable | Standard | Bedeutung |
|---|---|---|
| `LINKEDIN_FEED_URL` | – | Feed-Adresse (RSS, Atom oder JSON Feed). Leer = Feed-Import aus |
| `LINKEDIN_SYNC_INTERVAL_MIN` | `30` | Abrufintervall in Minuten |
| `LINKEDIN_AUTO_PUBLISH` | `true` | `false` = importierte Beiträge bleiben versteckt |
| `LINKEDIN_WEBHOOK_TOKEN` | – | Geheimnis für den Webhook. Leer = Webhook aus |
| `LINKEDIN_AUTHOR_NAME` | `Martin F. Heidecker` | Autor importierter Beiträge |
| `ANTHROPIC_API_KEY` | – | Schlüssel für die automatische Übersetzung |
| `LINKEDIN_AUTO_TRANSLATE` | `true` | `false` = keine automatische Übersetzung |

## Technische Einordnung

- `src/config/linkedin.js` – Feed-Abruf, Parser (RSS/Atom/JSON), Speicherung, Bild-Download
- `src/config/translate.js` – Übersetzung DE → EN über die Claude API
- `src/routes/api.js` – Webhook-Endpunkt `POST /api/linkedin/webhook`
- `src/routes/admin.js` – Sync-Knopf, Einzelimport, Nachübersetzen
- `src/server.js` – Intervall-Abruf beim Start
- `migrations/004_linkedin_auto_import.sql` – Spalten `source_guid`, `source`,
  `imported_at`, `needs_translation` (die Anwendung legt sie beim Start selbst an)

Doppelte Importe verhindert ein eindeutiger Schlüssel auf `source_guid`; als
Kennung dient die LinkedIn-Aktivitäts-ID aus der Beitrags-URL, die unabhängig
von Tracking-Parametern gleich bleibt.
