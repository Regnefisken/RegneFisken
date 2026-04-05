# Regnefisken — Save/Load-system og vej mod online brugerhåndtering

> Rapport · april 2026

---

## 1. Nuværende save/load-arkitektur

### 1.1 Overblik

Regnefisken er en **100 % klient-side** React/Three.js-applikation. Der er ingen backend, ingen database og ingen netværkskald. Al persistering sker i browserens `localStorage` under nøglen **`regnefisken_save`**.

```
Zustand-stores ──debounce 650 ms──▶ buildGameSave() ──JSON.stringify──▶ localStorage
                                                                         │
App-opstart ◀── applyGameSave() ◀── migrateSave() ◀── JSON.parse ◀──────┘
```

### 1.2 Centrale filer

| Fil | Ansvar |
|-----|--------|
| `src/logic/save-load.ts` | `loadGame()`, `saveGame()`, `migrateSave()`, `SAVE_KEY` |
| `src/logic/game-persistence.ts` | `buildGameSave()`, `applyGameSave()`, `bootstrapPersistence()`, auto-save subscriptions |
| `src/types/save.ts` | `SaveData`-interface (løst typet med index-signatur) |
| `src/data/version.ts` | `SAVE_FORMAT_VERSION = 14`, `APP_VERSION = '9.0'` |
| `src/store/useSaveStore.ts` | Holder `lastLoaded` og `hydrated`-flag |

### 1.3 Hvad gemmes?

| Kategori | Eksempler |
|----------|-----------|
| **Økonomi & progression** | `coins`, `inventory` (fangster), `upgrades`, `questItems`, `progression` (level/xp), `stats`, `completedGoals` |
| **Verden & bosser** | `currentLocation`, `weatherType`, boss-flags (`krakenDefeated`, `soeuhyreDefeated` osv.) |
| **Madding & timere** | `activeBait`, diverse `*Expiry`-timestamps, æg-timer-felter |
| **Møbler & hytte** | `furniturePositions`, `unlockedFurniture`, `hiddenFurniture`, `furnitureRoomAssignment` |
| **Matematik / læringsindstillinger** | `activeOps`, `mathDifficulty`, `mathCategory`, `selectedFarvand`, `zenMode`, talblok-præferencer |
| **Tilgængelighed & grafik** | `fontSize`, `uiScale`, `graphicsQuality`, farveblindhedstilstand, `reducedMotion`, `highContrast` |
| **Samling / narrativ** | Companions, collectibles (fossiler/konkylie/perler), ønsker, gylden frø, ballon-flags |
| **Metadata** | `_saveFormatVersion`, `v`, `savedAt` |

### 1.4 Versionering og migration

- Formatet versioneres med `SAVE_FORMAT_VERSION` (pt. 14).
- Ved opstart sammenlignes gemt version med aktuel. Er den **lavere**, sættes `needsReset = true` og save'et **appliceres ikke** — brugeren skal starte forfra.
- `migrateSave()` er i dag en simpel spread-funktion uden per-felt-migrering.

### 1.5 Styrker og svagheder

| ✅ Styrker | ⚠️ Svagheder |
|-----------|-------------|
| Nul serverinfrastruktur — billigt og simpelt | Data forsvinder ved browser-rydning/skift af enhed |
| Ingen persondata opbevares | Brugeren kan manipulere save i DevTools |
| Hurtig debounced auto-save | Ingen backup eller cloud-sync |
| Versioneret format med gate | Primitive migreringer — alle gamle saves kasseres |

---

## 2. Krav til online brugerhåndtering

For at understøtte brugerkonti og cloud-saves skal følgende tilføjes:

### 2.1 Autentificering (auth)

En bruger skal kunne logge ind og knyttes til et persistent id (`userId`). Mulige strategier:

| Strategi | Fordele | Ulemper |
|----------|---------|---------|
| **E-mail / kodeord** | Universelt, velforstået | Kræver bruger ≥ 13 år (GDPR), e-mail-verifikation, kodeordshåndtering |
| **OAuth (Google / Apple / Microsoft)** | Let onboarding, ingen kodeord | Afhængighed af tredjepartsforudsætninger |
| **UniLogin (STIL)** | Standard i danske skoler; ingen persondata håndteres af dig | Teknisk opsætning via STIL, begrænset til skolebrugere |
| **Anonym token (device-link)** | Ingen barrierer | Ikke rigtig "online" — mistes ved tab af enhed |
| **Hybrid** | Kombiner anonym start + valgfri konto-opgradering | Mere kompleks arkitektur |

### 2.2 Server-side persistering

`buildGameSave()`-output'et (ren JSON, ca. 5–30 KB) skal gemmes server-side:

```
Client  ──PUT /api/save──▶  Backend  ──▶  Database (save-blob per userId)
Client  ◀──GET /api/save──  Backend  ◀──  Database
```

Muligheder:

| Backend | Pris/kompleksitet | Bemærkninger |
|---------|-------------------|--------------|
| **Supabase (PostgreSQL + Auth)** | Gratis tier → lav pris | Supabase Auth har built-in OAuth, Row Level Security, real-time |
| **Firebase (Firestore + Auth)** | Gratis tier → lav pris | Google-økosystem, realtidssync, god React-support |
| **Egen Node/Express + PostgreSQL** | Fuld kontrol, mere drift | Kræver hosting (Fly.io, Railway, VPS) |
| **Cloudflare Workers + KV/D1** | Edge-baseret, hurtig | God til små payloads som game-saves |

### 2.3 Datamodel (server-side)

```
┌─────────────┐       ┌──────────────────┐
│   users      │──1:N──│   saves           │
├─────────────┤       ├──────────────────┤
│ id (UUID)    │       │ id               │
│ auth_provider│       │ user_id (FK)     │
│ external_id  │       │ save_data (JSONB)│
│ display_name │       │ format_version   │
│ school_id?   │       │ created_at       │
│ created_at   │       │ updated_at       │
└─────────────┘       └──────────────────┘
```

`save_data` er direkte output fra `buildGameSave()` — den eksisterende JSON-struktur kan bruges uændret.

---

## 3. UniLogin-integration (STIL)

### 3.1 Hvad er UniLogin?

UniLogin er den danske **nationale identitetsløsning for uddannelsessektoren**, administreret af STIL (Styrelsen for It og Læring). Alle danske elever fra 0.–10. klasse har et UniLogin, og det bruges dagligt til Aula, Google Workspace for Education, matematikportaler m.m.

### 3.2 Teknisk integration

UniLogin understøtter **OpenID Connect (OIDC)**:

1. **Registrer tjenesten hos STIL** — ansøg om at blive "tjenesteudbyder" på [stil.dk](https://stil.dk).
2. **Opsæt OIDC-flow** — STIL udleverer `client_id` og `client_secret`. Redirect-baseret login via:
   ```
   https://broker.unilogin.dk/auth/realms/broker/protocol/openid-connect/auth
     ?client_id=...
     &redirect_uri=https://regnefisken.dk/auth/callback
     &response_type=code
     &scope=openid
   ```
3. **Modtag token** — JWT indeholder bl.a. `uniid` (anonymiseret bruger-id), `institutionsnummer`, evt. klassetrin.
4. **Ingen persondata returneres som default** — UniLogin giver dig *ikke* barnets navn, CPR eller e-mail, medmindre du specifikt anmoder om udvidede claims og har lovhjemmel/samtykke.

### 3.3 Arkitekturskitse med UniLogin

```
Elev i browser
   │
   ├──klik "Log ind med UniLogin"──▶ STIL OIDC Broker
   │                                     │
   │    ◀── redirect med auth-code ──────┘
   │
   ├──POST /auth/unilogin { code }──▶ Din backend
   │                                     │
   │     Backend bytter code → access_token + id_token
   │     Udtrækker uniid + institution
   │     Opretter/finder user-row
   │     Returnerer session-JWT
   │
   ◀── { jwt, save_data } ──────────────┘
```

### 3.4 Fordele ved UniLogin for Regnefisken

- **Ingen passwords** for børn — de bruger allerede UniLogin dagligt.
- **Ingen persondata du skal opbevare** — `uniid` er pseudonymiseret.
- **Lærere kan knyttes til klasser** — muliggør fremtidigt dashboard med klasseoversigt.
- **Tillid fra skoler** — gør adoption i undervisningskontekst langt lettere.

---

## 4. Juridiske krav (GDPR, børnedata, cookies)

### 4.1 GDPR — generelt

| Krav | Konsekvens for Regnefisken |
|------|---------------------------|
| **Behandlingsgrundlag** | Hvis kun gameplay-data + pseudonymiseret `uniid` gemmes, kan **legitim interesse** (art. 6.1.f) bruges. Indsamles e-mail/navn, kræves **samtykke** |
| **Dataminimering** | Gem kun det nødvendige. `buildGameSave()` indeholder ingen persondata i dag — bevar det |
| **Ret til sletning** | Brugere skal kunne slette konto + save fra server |
| **Databehandleraftale** | Hvis du bruger Supabase/Firebase/AWS, skal der foreligge DPA med leverandøren |
| **Fortegnelse** | Du skal kunne dokumentere hvad du behandler og hvorfor |

### 4.2 Børn under 13/15 år

- **Danmark:** Samtykkealdersgrænsen for informationssamfundstjenester er **13 år** (jf. databeskyttelseslovens § 6a, der implementerer GDPR art. 8).
- Hvis dit spil **udelukkende** bruges via UniLogin i en skolekontekst, er skolen dataansvarlig og samtykke er dækket af skolens behandlingsgrundlag (uddannelsesformål).
- Tilbyder du **frivillig registrering** uden for skolen (f.eks. med e-mail), kræves **forældresamtykke** for børn under 13.

### 4.3 Anbefalet strategi

```
┌──────────────────────────────────────────────────────┐
│  Lavrisiko-vej:                                       │
│                                                       │
│  1. Brug kun UniLogin til skole-login                 │
│  2. Gem kun pseudonymiseret uniid + gameplay-JSON     │
│  3. Ingen e-mails, navne, CPR                         │
│  4. Tilbyd sletning via "Slet min konto"-knap         │
│  5. Skriv privatlivspolitik (1 side)                  │
│                                                       │
│  → Ingen forældreerklæring nødvendig                  │
│  → Ingen cookiebanner (kun nødvendige cookies)        │
│  → Minimal GDPR-byrde                                 │
└──────────────────────────────────────────────────────┘
```

### 4.4 Cookies og e-Privacy

- Hvis du bruger en **session-JWT i `httpOnly`-cookie**, er det en "strengt nødvendig" cookie og kræver **ikke** cookiesamtykke.
- Bruger du **analytics** (Google Analytics, Plausible osv.), kræver det enten samtykke eller en privacy-venlig løsning der ikke sætter cookies (Plausible, Fathom).
- `localStorage`-save'et er ikke en cookie juridisk, men det er stadig terminal-equipment-data under e-Privacy — dog falder ren gameplay-persistering under "strengt nødvendig" undtagelsen.

---

## 5. Implementeringsstrategi — faseopdelt

### Fase 1: Klargør klient-side (ingen backend endnu)

- [ ] **Stram `SaveData`-typen** — erstat `[key: string]: unknown` med eksplicitte felter, så du ved præcis hvad der serialiseres.
- [ ] **Implementér rigtig migration** — `migrateSave()` bør håndtere per-version-opgraderings-trin i stedet for at kassere gamle saves.
- [ ] **Adskil "profil-data" fra "settings"** — overvej at holde grafik/UI-indstillinger lokalt (de er device-specifikke) og kun synkronisere gameplay-progression til serveren.
- [ ] **Tilføj `userId`-felt til `SaveData`** — forbered strukturen.

### Fase 2: Backend + simpel auth

- [ ] Opsæt backend (f.eks. Supabase eller lille Express-server).
- [ ] Implementér `PUT /api/save` og `GET /api/save` endpoints.
- [ ] Tilføj simpel OAuth (Google) eller anonym tokenbaseret login.
- [ ] Klienten forsøger cloud-load ved opstart; falder tilbage til `localStorage` offline.
- [ ] Konflikthåndtering: brug `savedAt`-timestamp til "nyeste vinder" eller vis brugervalg.

### Fase 3: UniLogin-integration

- [ ] Registrer Regnefisken som tjenesteudbyder hos STIL.
- [ ] Implementér OIDC-flow mod UniLogin Broker.
- [ ] Map `uniid` til intern `userId`.
- [ ] Tilføj `school_id` / `institutionsnummer` til user-modellen.
- [ ] Skriv privatlivspolitik tilpasset skolekonteksten.

### Fase 4: Lærerdashboard (valgfrit)

- [ ] UniLogin giver adgang til lærer-roller og klassetilknytning.
- [ ] Byg dashboard: lærer kan se elevers level, fuldførte mål, matematik-indstillinger.
- [ ] Overvej statistik: hvilke regneopgaver volder problemer, tidsforbrug, streaks.

---

## 6. Sync-strategi: localStorage + cloud

Ved overgang til cloud-saves bør `localStorage` bevares som offline-cache:

```
                    ┌─────────────┐
                    │  Cloud DB    │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │ GET /save      │ PUT /save       │
          │ (opstart)      │ (debounced)     │
          ▼                │                 ▲
   ┌─────────────┐        │          ┌──────┴──────┐
   │ Merge/       │        │          │ buildGame-  │
   │ Conflict     │────────┘          │ Save()      │
   │ Resolution   │                   └─────────────┘
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ localStorage │  ← altid opdateret som fallback
   └─────────────┘
```

**Konflikthåndtering:** Når brugeren har spillet offline og der er en nyere cloud-save:
- Sammenlign `savedAt`-timestamps.
- Enkel strategi: "nyeste vinder".
- Bedre UX: vis dialog — "Du har fremskridt både lokalt og i skyen — hvilken vil du beholde?"

---

## 7. Sikkerhedsovervejelser

| Emne | Anbefaling |
|------|------------|
| **Save-manipulation** | Klienten kan altid snyde med `localStorage`. Med cloud-saves kan du validere server-side (f.eks. max coins pr. session, realistisk xp-gain). Start simpelt — fuld anti-cheat er overkill for et læringsværktøj |
| **JWT-håndtering** | Gem token i `httpOnly` secure cookie (ikke `localStorage`). Sæt kort expiry (1 time) + refresh token |
| **Rate limiting** | Beskyt save-endpoint mod spam — max 1 save/sek/bruger |
| **CORS** | Tillad kun dit eget domæne |
| **Input-validering** | Validér `save_data` server-side — den er `unknown` i dag, så implementér schema-validering (f.eks. Zod) |

---

## 8. Opsummering

| Aspekt | I dag | Fremtid |
|--------|-------|---------|
| Persistering | `localStorage` (klient) | Cloud DB + `localStorage` (offline fallback) |
| Bruger-id | Ingen | UniLogin `uniid` / OAuth-id |
| Auth | Ingen | UniLogin OIDC + evt. Google OAuth |
| Backend | Ingen | Supabase / Firebase / egen API |
| GDPR-data | Nul persondata | Pseudonymiseret `uniid` + gameplay-JSON |
| Migration | Hard reset ved ny version | Per-version-migrering |
| Læreroverblik | Ikke muligt | Dashboard via UniLogin-roller |

Den eksisterende `buildGameSave()`-arkitektur er **velegnet** til at blive sendt til en server — det er allerede en ren JSON-blob uden cirkulære referencer eller browser-afhængigheder. Den største indsats er at bygge backend + auth, ikke at omskrive klient-persistering.
