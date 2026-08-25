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

### Einzelimport im Admin (kostenlos, unter einer Minute pro Beitrag)

*Admin → LinkedIn → Bereich „Beitrag übernehmen"*. Zwei Felder:

- **Link** – aus LinkedIn über die drei Punkte am Beitrag → *Link zum Beitrag kopieren*
- **Beitragstext** – den Text des Beitrags markieren, kopieren, einfügen

**Empfohlen: beides ausfüllen.** Dann entsteht der Titel aus der ersten Zeile,
der Anriss aus dem Rest, die englische Fassung wird gleich mitübersetzt, und das
Bearbeiten-Formular öffnet sich fertig ausgefüllt zur Kontrolle. Nur das Bild
muss noch hochgeladen werden.

**Nur der Link** funktioniert auch: die Website versucht dann, Titel, Text und
Bild selbst bei LinkedIn abzurufen (Open-Graph-Daten). LinkedIn gibt diese aber
nicht zuverlässig an nicht angemeldete Besucher heraus – klappt es nicht, öffnet
sich das leere Formular mit bereits eingetragener URL.

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

Importierte Beiträge sind deutsch. Die englische Fassung entsteht beim Import
automatisch – auf einem von zwei Wegen:

| Weg | Voraussetzung | Kosten | Zuverlässigkeit |
|---|---|---|---|
| **Google Translate** | keine | kostenlos | **auf Servern oft blockiert** |
| **Claude** (empfohlen) | `ANTHROPIC_API_KEY` | wenige Cent pro Beitrag | zuverlässig, kennt die Fachbegriffe |

**Wichtig zu Google Translate:** Der genutzte Endpunkt ist nicht offiziell
dokumentiert und für Browser gedacht. Anfragen aus Rechenzentren beantwortet
Google häufig dauerhaft mit `HTTP 429` – so auch auf dem Server von
lynx-lining.com. Der Knopf *„Alles automatisch übersetzen"* im Beitragsformular
nutzt denselben Endpunkt und ist davon genauso betroffen.

Trifft die Sperre zu, meldet der Admin das im Klartext. Ein Wiederholen bringt
nichts – es handelt sich nicht um eine kurzzeitige Drosselung, sondern um eine
Sperre der Server-IP-Adresse.

### Claude einrichten (der zuverlässige Weg)

1. Auf [console.anthropic.com](https://console.anthropic.com) anmelden
   (dasselbe Konto wie für Claude Code) → *API Keys* → *Create Key*
2. Guthaben aufladen – der kleinste Betrag reicht für Jahre
3. Den Schlüssel in Coolify als `ANTHROPIC_API_KEY` eintragen, Anwendung neu starten

Claude übersetzt dann mit den Fachbegriffen des Verschleißschutzes im Auftrag
(*Auskleidung → lining*, *Schüttgut → bulk material*, *Abrieb → abrasion*,
*Gleisschotter → track ballast*). Kosten: rund 2–3 Cent pro Beitrag.

Fällt Claude einmal aus, wird auf Google zurückgefallen – dort, wo Google
erreichbar ist.

Schlagen beide fehl, steht der deutsche Text auch auf Englisch und der Beitrag
ist im Admin mit **„EN fehlt"** markiert – nachholbar per Knopfdruck
(*Englisch übersetzen*) oder von Hand im Formular.

Ganz abschalten: `LINKEDIN_AUTO_TRANSLATE=false`.

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
| `ANTHROPIC_API_KEY` | – | optional: Übersetzung über Claude statt Google Translate |
| `LINKEDIN_AUTO_TRANSLATE` | `true` | `false` = gar keine automatische Übersetzung |

## Technische Einordnung

- `src/config/linkedin-api.js` – OAuth und Community Management API
  (`/rest/organizationAcls`, `/rest/posts`, `/rest/images`)
- `src/config/linkedin.js` – Speicherung, Deduplizierung, Bild-Download,
  Feed-Parser (RSS/Atom/JSON) als Ersatzquelle
- `src/config/translate.js` – Übersetzung DE → EN (Claude, sonst Google Translate);
  liefert auch den Endpunkt `POST /admin/translate` für den Knopf im Formular
- `src/routes/admin.js` – Verbinden/Trennen, Abrufen, Einzelimport, Nachübersetzen
- `src/routes/api.js` – Webhook `POST /api/linkedin/webhook`
- `src/server.js` – regelmäßiger Abruf, bevorzugt über die offizielle API
- `migrations/004_linkedin_auto_import.sql` – Herkunftsspalten (die Anwendung
  legt sie beim Start selbst an)

Doppelte Importe verhindert ein eindeutiger Schlüssel auf `source_guid`; als
Kennung dient die LinkedIn-Beitrags-URN bzw. die Aktivitäts-ID aus der URL.
Entwürfe und nicht öffentliche Beiträge werden übersprungen.
