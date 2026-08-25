# LinkedIn-Beiträge automatisch auf die Homepage

## Die kurze Antwort

**Ja, es gibt eine offizielle API – aber nur für eine LinkedIn-Unternehmensseite,
nicht für Martins persönliches Profil.**

Das ist der entscheidende Unterschied zu Instagram. Bei Instagram kann man mit
den eigenen Zugangsdaten ein Token erzeugen und die eigenen Beiträge auslesen.
Bei LinkedIn geht das für persönliche Profile nicht:

- Die dafür nötige Berechtigung heißt **`r_member_social`**. LinkedIn vergibt
  sie seit Jahren nicht mehr an neue Entwickler
  ([Quelle](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api)).
- Das gilt unabhängig davon, wem das Profil gehört und wer die Zugangsdaten hat.
  Auch mit Martins Passwort gäbe es keinen erlaubten Weg – die Anmeldung eines
  Servers mit persönlichen Zugangsdaten verstößt gegen die
  LinkedIn-Nutzungsbedingungen und führt regelmäßig zur Sperre des Kontos.
  **Bitte deshalb keine LinkedIn-Zugangsdaten weitergeben.**

Für eine **Unternehmensseite** dagegen gibt es den offiziellen, kostenlosen Weg:
die **Community Management API** mit der Berechtigung `r_organization_social`.
Genau dieser Weg ist jetzt eingebaut.

---

## Was dafür gebraucht wird

Alles Folgende ist kostenlos. Der einzige Aufwand ist die Freischaltung durch
LinkedIn, die **1–4 Wochen** dauert.

### 1. Eine LinkedIn-Unternehmensseite für LYNX Lining

Falls es noch keine gibt: unter *linkedin.com/company/setup/new* in etwa
10 Minuten angelegt. Martin ist dann automatisch Super-Admin.

Falls es schon eine gibt: bitte die URL nennen, z. B.
`https://www.linkedin.com/company/lynx-lining/`.

Die Seite ist ohnehin sinnvoll – Unternehmensseiten sind für Firmenkommunikation
gedacht, ein persönliches Profil ist es nicht.

### 2. Was Martin tun muss (ca. 20 Minuten, einmalig)

| Schritt | Was | Wo |
|---|---|---|
| a | Bestätigen, dass er **Super-Admin** der Unternehmensseite ist | LinkedIn-Seite → *Verwalten* → *Administratoren* |
| b | Eine **LinkedIn-App** anlegen und dabei die Unternehmensseite auswählen | [developer.linkedin.com/apps](https://www.linkedin.com/developers/apps) |
| c | Die App **verifizieren** – LinkedIn erzeugt einen Bestätigungslink, den ein Seiten-Admin anklicken muss | in der App unter *Settings* |
| d | Unter *Products* das Produkt **„Community Management API"** anfordern | in der App unter *Products* |
| e | Das Antragsformular ausfüllen (Zweck: „Darstellung der eigenen Unternehmensbeiträge auf der Firmenwebsite lynx-lining.com") | Formular im Antrag |

Danach prüft LinkedIn den Antrag. Rückmeldung kommt per E-Mail.

### 3. Was wir von Martin brauchen

Nach der Freischaltung nur **zwei Werte** aus der App (*Auth*-Tab):

- **Client ID** – eine kurze Ziffernfolge
- **Client Secret** – eine lange Zeichenkette

Beide stehen in der App unter *Auth*. Bitte nicht per E-Mail oder Chat
schicken, sondern direkt in Coolify unter *Environment Variables* eintragen
(oder über einen Passwort-Manager übergeben).

**Nicht** benötigt: LinkedIn-Passwort, E-Mail-Zugang oder sonstige persönliche
Zugangsdaten. Das Client Secret ist ein reiner App-Schlüssel und lässt sich
jederzeit in der App zurücksetzen.

Zusätzlich muss in der App unter *Auth → Authorized redirect URLs* genau diese
Adresse eingetragen sein:

```
https://lynx-lining.com/admin/linkedin/callback
```

### 4. Was wir dann tun

1. `LINKEDIN_CLIENT_ID` und `LINKEDIN_CLIENT_SECRET` in Coolify eintragen,
   Anwendung neu starten.
2. Im Admin unter *LinkedIn* auf **„Mit LinkedIn verbinden"** klicken.
3. Martin (oder ein anderer Seiten-Admin) meldet sich einmalig bei LinkedIn an
   und bestätigt den Zugriff. Das Passwort wird dabei nur bei LinkedIn selbst
   eingegeben, nie bei uns.
4. Fertig. Ab dann werden die Beiträge der Unternehmensseite alle 30 Minuten
   abgerufen und erscheinen automatisch auf der News-Seite und der Startseite.

---

## Wichtig: alle 60 Tage neu verbinden

LinkedIn begrenzt Zugänge auf **60 Tage**. Dauerhafte Refresh-Token gibt es nur
für Marketing-Developer-Partner – ein Status, den kleine Firmen praktisch nicht
bekommen ([Quelle](https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens)).

Das ist eingeplant:

- Der Admin-Bereich zeigt an, wie lange der Zugang noch gültig ist.
- Ab 7 Tagen vor Ablauf erscheint ein deutlicher Hinweis, im Server-Log ebenso.
- Erneuern heißt: einmal *Verbindung trennen*, dann *Mit LinkedIn verbinden* –
  zwei Klicks, etwa 30 Sekunden, alle zwei Monate.

Sollte LinkedIn der Firma später doch Partnerstatus geben, erneuert sich der
Zugang automatisch; der Code erkennt ein vorhandenes Refresh-Token selbst.

---

## Wenn kein API-Zugang zustande kommt

Falls LinkedIn den Antrag ablehnt oder es bei Martins persönlichem Profil
bleiben soll, gibt es zwei kostenlose Alternativen. Beide sind bereits eingebaut.

### Einzelimport im Admin (kostenlos, ein Klick pro Beitrag)

*Admin → LinkedIn → „Einzelnen Beitrag übernehmen"* – dort den Link des Beitrags
einfügen. Titel, Text und Bild werden übernommen, soweit LinkedIn sie an nicht
angemeldete Besucher herausgibt; sonst öffnet sich das Formular mit bereits
eingetragener URL zum Ausfüllen.

Das ist der praktikabelste Weg ohne API: Martin postet ohnehin auf LinkedIn,
und ein Link-Einfügen dauert weniger als eine Minute.

### Webhook (kostenlos, wenn ohnehin ein Automatisierungsdienst da ist)

`POST https://lynx-lining.com/api/linkedin/webhook`, abgesichert über
`LINKEDIN_WEBHOOK_TOKEN` im Header `X-Webhook-Token`:

```json
{
  "url": "https://www.linkedin.com/posts/...",
  "text": "Der vollständige Beitragstext",
  "image": "https://media.licdn.com/...",
  "published_at": "2026-08-25T10:00:00Z"
}
```

Ein Beitrag wird nie doppelt angelegt: `201` = neu, `200` mit
`created: false` = war schon da.

Zusätzlich versteht der Server einen RSS-/Atom-/JSON-Feed über
`LINKEDIN_FEED_URL`, falls einmal eine kostenlose Feed-Quelle zur Verfügung steht.

---

## Englische Fassung

Importierte Beiträge sind deutsch. Ist ein `ANTHROPIC_API_KEY` gesetzt, wird
beim Import automatisch eine englische Fassung über die Claude API erzeugt
(Titel, Anriss, Volltext), mit den Fachbegriffen des Verschleißschutzes
(*Auskleidung → lining*, *Schüttgut → bulk material*, *Abrieb → abrasion*).
Kosten: wenige Cent pro Beitrag.

Ohne Schlüssel wird für Englisch der deutsche Text gespeichert und der Beitrag
im Admin mit **„EN fehlt"** markiert – die Übersetzung lässt sich dann von Hand
eintragen oder später per Knopfdruck (*Englisch übersetzen*) nachholen.

---

## Steuerung im Admin

Unter *Admin → LinkedIn* steht im Bereich **Automatischer Import**:

- ob die LinkedIn-Verbindung steht und welche Seite verbunden ist
- wie lange der Zugang noch gültig ist
- wann zuletzt importiert wurde und wie viele Beiträge noch keine englische
  Fassung haben
- **Jetzt abrufen** – holt Beiträge sofort, ohne aufs nächste Intervall zu warten

Importierte Beiträge lassen sich bearbeiten, verstecken und löschen wie manuell
angelegte. Ein bearbeiteter Beitrag wird beim nächsten Abruf **nicht
überschrieben** – Korrekturen bleiben erhalten.

Sollen Beiträge vor der Veröffentlichung gesichtet werden:

```
LINKEDIN_AUTO_PUBLISH=false
```

Dann werden sie versteckt angelegt und erscheinen erst nach Freigabe im Admin.

---

## Alle Umgebungsvariablen

| Variable | Standard | Bedeutung |
|---|---|---|
| `LINKEDIN_CLIENT_ID` | – | Client ID der LinkedIn-App |
| `LINKEDIN_CLIENT_SECRET` | – | Client Secret der LinkedIn-App |
| `LINKEDIN_REDIRECT_URI` | `<SITE_URL>/admin/linkedin/callback` | muss in der App identisch eingetragen sein |
| `LINKEDIN_API_VERSION` | `202606` | LinkedIn-API-Version (YYYYMM) |
| `LINKEDIN_SYNC_INTERVAL_MIN` | `30` | Abrufintervall in Minuten |
| `LINKEDIN_AUTO_PUBLISH` | `true` | `false` = importierte Beiträge bleiben versteckt |
| `LINKEDIN_FEED_URL` | – | Ersatzquelle: RSS-/Atom-/JSON-Feed |
| `LINKEDIN_WEBHOOK_TOKEN` | – | Geheimnis für den Webhook. Leer = Webhook aus |
| `LINKEDIN_AUTHOR_NAME` | `Martin F. Heidecker` | Autor importierter Beiträge |
| `ANTHROPIC_API_KEY` | – | Schlüssel für die automatische Übersetzung |
| `LINKEDIN_AUTO_TRANSLATE` | `true` | `false` = keine automatische Übersetzung |

## Technische Einordnung

- `src/config/linkedin-api.js` – OAuth und Community Management API
  (`/rest/organizationAcls`, `/rest/posts`, `/rest/images`)
- `src/config/linkedin.js` – Speicherung, Deduplizierung, Bild-Download,
  Feed-Parser (RSS/Atom/JSON) als Ersatzquelle
- `src/config/translate.js` – Übersetzung DE → EN über die Claude API
- `src/routes/admin.js` – Verbinden/Trennen, Abrufen, Einzelimport, Nachübersetzen
- `src/routes/api.js` – Webhook `POST /api/linkedin/webhook`
- `src/server.js` – regelmäßiger Abruf, bevorzugt über die offizielle API
- `migrations/004_linkedin_auto_import.sql` – Herkunftsspalten (die Anwendung
  legt sie beim Start selbst an)

Doppelte Importe verhindert ein eindeutiger Schlüssel auf `source_guid`; als
Kennung dient die LinkedIn-Beitrags-URN bzw. die Aktivitäts-ID aus der URL.
Entwürfe und nicht öffentliche Beiträge werden übersprungen.
