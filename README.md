# Altar Assistant

Ik heb een bestaande HTML-pagina (dienlijst van misdienaars) die ik wil laten herontwikkelen als moderne webapp.




BELANGRIJK DOEL

Deze applicatie wordt gebruikt door meerdere mensen (±10 gebruikers).

Daarom moet alle data centraal worden opgeslagen en gedeeld tussen apparaten en gebruikers.




LocalStorage alleen is NIET voldoende.




---




BELANGRIJKE RANDVOORWAARDEN




- Data moet centraal beschikbaar zijn voor alle gebruikers

- Wij willen controle houden over de data (privacy belangrijk)

- Geen afhankelijkheid van externe SaaS is gewenst (voorkeur heeft eigen oplossing)

- Het systeem moet eenvoudig te beheren zijn (geen complexe DevOps)




---




OPSLAAG (VERPLICHT)




Implementeer centrale opslag.




VOER TWEE OPTIES UIT:

- Optie A: Supabase (standaard cloud-oplossing)

- Optie B: Eigen backend (VOORKERUZE voor productie)




---




OPTIE B – VOLLEDIG UITWERKEN (ZWAARTEPUNT)




Bouw een eenvoudige eigen backend met de volgende kenmerken:




TECHNOLOGIE

- Node.js (bijv. Express)

- Opslag:

  - bij voorkeur SQLite (lichtgewicht, geen aparte server nodig)

  - alternatief: JSON-bestand als fallback




STRUCTUUR BACKEND




1. API endpoints:




GET /diensten

- retourneert alle diensten (gesorteerd op datum)




POST /diensten

- voegt nieuwe dienst toe




PUT /diensten/:id

- wijzigt bestaande dienst




DELETE /diensten/:id

- verwijdert dienst




POST /upload

- accepteert CSV bestand

- parsed bestand

- voegt nieuwe diensten toe

- voorkomt duplicaten (zelfde datum + tijd)




2. Datamodel




Tabel: diensten

- id (integer, primary key)

- datum (date)

- aanwezig_tijd (time)

- dienst_tijd (time)

- titel (string, optioneel)

- misdienaars (array of string)

- toelichting (string, optioneel)




3. Logica




- Altijd sorteren op datum

- Duplicaten voorkomen:

  - unieke combinatie: datum + dienst_tijd

- Validatie:

  - datum verplicht

  - tijden verplicht

- CSV parsing:

  - formaat: Titel;Datum;Aanwezig;Tijd;Misdienaars




4. Beveiliging




- Simpele password check voor admin acties (via API)

- Geen complexe user accounts nodig

- Basis beveiliging:

  - API key of wachtwoord in request header




---




FRONTEND




- React (of Vue)

- Tailwind CSS

- Gebruik API calls naar backend (geen localStorage als primaire opslag)




COMPONENTEN

- ServiceList

- FilterBar

- AdminPanel

- EditModal




---




FUNCTIONELE EISEN




1. Publieke pagina

- Overzicht diensten

- Filters:

  - ochtend / avond / feest

  - misdienaar

- Groepering per maand

- Toekomstige diensten inklapbaar




2. Admin gedeelte

- Inloggen

- CRUD (toevoegen / bewerken / verwijderen)

- CSV upload (met merge-logica)




---




PROBLEMEN DIE MOETEN WORDEN OPGELOST




1. iOS / mobiel

- Mobile-first ontwerp

- Geen tabel op mobiel → gebruik kaarten

- Touch-vriendelijk

- Geen horizontale scroll




2. Synchronisatie

- Alle data komt uit backend

- Alle wijzigingen direct zichtbaar voor alle gebruikers

- Geen afhankelijkheid van browser storage




---




LAYOUT / DESIGN




Sluit aan bij:

https://www.rkvenray.nl/




Kenmerken:

- rustig, kerkelijk

- roodaccent (#9b1c1c)

- serif + sans-serif

- veel witruimte




---




DEPLOYMENT (BELANGRIJK)




Voor optie B:




- Backend moet eenvoudig te hosten zijn, bijvoorbeeld:

  - VPS (bijv. TransIP)

  - Docker container (optioneel)




- Frontend:

  - static hosting (bijv. Vercel/Netlify)

  - of samen met backend server




Geef duidelijke instructies:

- hoe backend te starten

- waar database staat

- hoe data geback-upt kan worden




---




EXTRA VERBETERINGEN




- Zoekfunctie op naam

- Feedback bij opslaan (“wijziging opgeslagen”)

- Foutmeldingen bij API calls

- Export functie (JSON download als backup)




---




OUTPUT




- Volledige werkende webapp

- Backend + frontend code

- Database schema

- Installatie-instructies stap-voor-stap

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dienlijst.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/998a2d2a-8cef-47a1-91f3-1c0932328df2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
