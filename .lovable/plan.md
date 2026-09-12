# WordPress-integratie Dienlijst

## Doel
De Dienlijst-app beschikbaar maken binnen de bestaande WordPress-website van RK Venray, zodat bezoekers niet naar een apart subdomein hoeven.

## Huidige situatie
- App is gebouwd met TanStack Start + React + Tailwind.
- Data en serverfuncties (CRUD, CSV-upload, opruimen oude diensten) draaien via Lovable Cloud (Supabase).
- Gepubliceerde app staat op `https://dienlijst.lovable.app`.
- `npm install` + `npm run build` produceren in de huidige configuratie een Cloudflare Worker-bundel, geen statische HTML die je 1-op-1 op een standaard WordPress-host kunt draaien.

## Aanbevolen aanpak: iframe-embed
De snelste en meest onderhoudsvriendelijke oplossing. De app blijft in Lovable draaien; WordPress toont hem in een responsieve iframe.

### Stappen
1. **WordPress-pagina aanmaken**
   - Maak een pagina aan met slug `/misdienaars`.
   - Gebruik een full-width template zonder zijbalk en zonder paginatitel (of verberg de titel).
2. **Iframe toevoegen**
   - Voeg een Custom HTML-block toe met een iframe.
   - Bron: `https://dienlijst.lovable.app`.
   - 100% breedte, responsieve hoogte via iframe-resizer of een vaste `min-height`.
3. **(Optioneel) Shortcode-plugin**
   - Maak een mini-plugin `rkvenray-dienlijst/rkvenray-dienlijst.php` die een shortcode `[dienlijst]` output als iframe.
   - Zo blijft de pagina in de visuele editor overzichtelijk.
4. **SEO**
   - Stel in WordPress de pagina-titel en meta-omschrijving in op "Misdienaars – RK Venray".
   - Bepaal welke URL de canonical wordt: de WordPress-pagina of de Lovable-URL.
5. **Aanpassingen doorvoeren**
   - Wijzigingen in Lovable publiceren; de iframe toont automatisch de nieuwe versie.
   - Indien gewenst kan de app-header/-footer in Lovable worden verwijderd voor een naadlozere integratie.

## Alternatief: statische build uploaden naar WordPress
Als de bestanden écht op de WordPress-server moeten staan:

1. Configureer TanStack Start zodat `npm run build` een statische client-only export genereert (`dist/client`).
2. Upload de inhoud van `dist/client` naar bijvoorbeeld `/wp-content/uploads/dienlijst/`.
3. Laad de app in WordPress via een iframe of door de gegenereerde JS/CSS in een lege pagina te enqueuen.
4. **Belangrijk:** serverfuncties (admin, CSV, opruimen) blijven dan een backend nodig hebben. Je houdt Lovable Cloud als backend, of je bouwt een eigen Node/Express-backend op een VPS. Zonder backend werkt alleen het publieke overzicht dat rechtstreeks de database benadert.

## Technische details
- `npm install`: installeert alle afhankelijkheden.
- `npm run build`: huidige setup produceert een server-bundle voor Cloudflare Workers. Voor WordPress heb je daarom ofwel een iframe, ofwel een aangepaste static-export build-configuratie nodig.
- De database en het admin-wachtwoord (`ADMIN_PASSWORD`) zijn server-secrets; die kunnen niet in een statische WordPress-embed zitten zonder backend.

## Afhankelijke keuzes
- WordPress-installatie waarin je een pagina/plugin mag bewerken.
- Akkoord met iframe, of wil je een native WordPress-pagina waarbij de HTML door WordPress wordt gegenereerd? (Laatste kost aanzienlijk meer werk en vereist een aparte backend.)
- Moet het beheer (admin) ook binnen WordPress plaatsvinden, of blijft dat via de Lovable-app?

## Oplevering
- Een stappenplan en, na goedkeuring, de benodigde code voor de iframe/shortcode en eventuele build-configuratieaanpassingen.
