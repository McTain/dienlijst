
## Doel

De bestaande `index.html` (LocalStorage-only) ombouwen tot een moderne webapp met **centrale, gedeelde opslag** zodat ±10 gebruikers/apparaten dezelfde dienlijst zien. Stijl en functionaliteit volgen de huidige pagina (rood-accent #9b1c1c, Lora + Open Sans, RK Venray-uitstraling), maar mobile-first met kaarten i.p.v. tabel.

## Architectuur

- **Frontend:** React (TanStack Start, al aanwezig) + Tailwind.
- **Backend/DB:** Lovable Cloud (Postgres + server functions). Geen externe SaaS-account nodig — je beheert het in het Cloud-tabblad. Eenvoudige export beschikbaar.
- **Auth admin:** één gedeeld wachtwoord, opgeslagen als server-side secret (`ADMIN_PASSWORD`). Admin-acties (POST/PUT/DELETE/upload) lopen via server functions die het wachtwoord checken. Geen user accounts.
- **Persoonlijke "mijn naam"-filter:** mag in `localStorage` blijven (puur UI-voorkeur, geen gedeelde data).

## Datamodel (Lovable Cloud / Postgres)

Tabel `diensten`:
- `id` uuid PK
- `datum` date (verplicht)
- `aanwezig_tijd` time (verplicht)
- `dienst_tijd` time (verplicht)
- `titel` text
- `misdienaars` text[]
- `toelichting` text
- `created_at` / `updated_at` timestamptz
- Unieke index op `(datum, dienst_tijd)` → voorkomt duplicaten bij CSV-import.

RLS:
- `SELECT` voor `anon` (publiek leesbaar — dit is een openbare dienlijst).
- `INSERT/UPDATE/DELETE` geblokkeerd voor `anon`/`authenticated`. Alleen `service_role` (server functions met wachtwoord-check) mag schrijven.

## Server functions

- `listDiensten()` — publieke read, gesorteerd op datum + tijd.
- `createDienst({ password, dienst })` — wachtwoord-check, insert.
- `updateDienst({ password, id, patch })` — wachtwoord-check, update.
- `deleteDienst({ password, id })` — wachtwoord-check, delete.
- `uploadCsv({ password, csvText })` — parse `Titel;Datum;Aanwezig;Tijd;Misdienaars`, dedupe op (datum, dienst_tijd), bulk-insert, retourneert `{ added, skipped }`.
- `exportJson({ password })` — alle diensten als JSON (backup).
- `verifyPassword({ password })` — losse check voor de inlogmodal.

Wachtwoord-vergelijking server-side via `timingSafeEqual`. Zwakke pogingen worden niet gelogd met inhoud.

## Frontend-componenten

- `Header` + `Nav` (zoals huidige pagina, rood topbar, breadcrumb).
- `Filters`: knoppen "Alle / Ochtend (<12:00) / Avond / Bijzondere diensten (titel niet leeg)" + zoekveld op naam + dropdown "mijn naam".
- `ServiceList` (mobile-first):
  - Gegroepeerd per maand (Lora-koppen).
  - **Mobiel:** kaarten (geen tabel, geen horizontale scroll), 44px+ touch-targets.
  - **Desktop:** zelfde kaarten in een 2-koloms grid (optioneel) — bewust geen tabel meer.
  - Verleden diensten zichtbaar; toekomstige diensten na de eerstvolgende inklapbaar ("Toon overige diensten").
  - Highlight als ingelogde "mijn naam" in `misdienaars` voorkomt.
- `AdminLoginModal` (wachtwoord).
- `AdminPanel`:
  - Lijst alle diensten, knoppen bewerken/verwijderen.
  - "Nieuwe dienst" knop.
  - CSV-upload met merge-feedback.
  - JSON-export-knop (backup download).
  - Uitloggen.
- `EditDienstModal`: datum, aanwezig-tijd, dienst-tijd, titel, misdienaars (comma-separated input → array), toelichting. Validatie verplicht: datum + beide tijden.
- Toasts (sonner) voor feedback: "Opgeslagen", "Verwijderd", "X toegevoegd, Y overgeslagen", API-fouten.

## Design

Trouw aan rkvenray.nl en huidige HTML:
- Kleuren: `--red #9b1c1c`, `--red-dark #7a1616`, `--red-bg #f9eded`, donker nav `#2b2b2b`, veel wit, lichte randen.
- Fonts: Lora (serif) voor koppen, Open Sans (sans) voor body.
- Strak, rustig, kerkelijk, veel witruimte. Geen animaties anders dan subtiele hover/fade.

## Migratie van bestaande data

Bij eerste run is de DB leeg. Twee opties (kies één bij implementatie):
1. Admin opent de app, logt in, en uploadt het huidige `.txt/.csv`-bestand via de upload-knop.
2. Ik seed eenmalig de huidige diensten uit de geüploade `index.html` (ingebouwde data) via een migratie-script.

Voorstel: optie 1 (geen vendor-lock op seed, jij houdt zelf controle). Als je liever vooraf-gevuld wilt, doen we optie 2.

## Wat je krijgt

- Werkende webapp in Lovable preview, direct te publiceren naar `*.lovable.app` (of eigen domein).
- Centrale Cloud-DB; alle gebruikers zien dezelfde data realtime na refresh.
- Admin-wachtwoord ingesteld via Secrets.
- Mobile-first kaarten, filters, zoek, maand-groepering, inklapbare toekomst.
- CSV-upload met dedupe, JSON-export als backup.
- Stap-voor-stap publish-instructies in de chat na build.

## Wat expliciet NIET in dit plan zit

- Geen losse Node/Express+SQLite backend (jouw keuze: alleen Lovable Cloud).
- Geen meerdere admin-accounts (jouw keuze: één gedeeld wachtwoord).
- Geen e-mail/notificaties bij wijzigingen (kan later).
- Geen drag-and-drop CSV; gewone file-input zoals nu.

## Open vraagje (kan ook tijdens build)

Wil je dat ik de bestaande diensten uit jouw `index.html` éénmalig seed in de database, of begin je liever met een lege DB en upload je zelf het CSV-bestand?
