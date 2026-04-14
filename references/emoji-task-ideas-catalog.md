# Emoji-opgavetyper — Idékatalog

> Til: Regnefisken  
> Dato: april 2026  
> Status: Idéer til vurdering (ikke implementeringsklare)  
> Forudsætninger: Bygger ovenpå den eksisterende emoji-infrastruktur (EMOJI_POOL, klik-mekanisme, answer: -1 konvention)

---

## Indholdsfortegnelse

1. [C: Sorter i rækkefølge](#c-sorter-i-rækkefølge)
2. [D: Find halvdelen](#d-find-halvdelen)
3. [E: Find det dobbelte](#e-find-det-dobbelte)
4. [F: Lige eller ulige?](#f-lige-eller-ulige)
5. [G: Fortsæt mønsteret](#g-fortsæt-mønsteret)
6. [H: Gør dem lige mange](#h-gør-dem-lige-mange)
7. [I: Brøkdele visuelt](#i-brøkdele-visuelt)
8. [J: Procentdel](#j-procentdel)
9. [Bonus: Emoji-bingo (boss-kamp)](#bonus-emoji-bingo)

---

## C: Sorter i rækkefølge

**Farvand:** 🏖️ Kysten (0.–3. klasse)  
**Sværhedsgrad:** Kun begynder  
**Input-type:** Klik (sekventiel — spilleren trykker i rækkefølge)  
**Træner:** Talforståelse, ordning, sammenligning af mængder

### Koncept

Spilleren ser **tre kasser** med forskellige antal emojis og skal trykke på dem i den rigtige rækkefølge — enten fra færrest til flest eller fra flest til færrest. Rækkefølgen veksler tilfældigt 50/50.

Det er en udvidelse af den eksisterende klik-mekanisme: i stedet for at trykke på én korrekt kasse, trykkes der tre gange i sekvens. Hvert korrekt tryk fremhæver kassen (fx grøn kant), og først når alle tre er trykket korrekt, godkendes svaret. Et forkert tryk tæller som fejl.

### Eksempler

**"Tryk i rækkefølge: færrest til flest!"**

```
┌──────────┐    ┌──────────────────┐    ┌────────────────┐
│ 🦀🦀🦀🦀🦀🦀🦀│    │ 🐟🐟               │    │ 🐙🐙🐙🐙🐙      │
└──────────┘    └──────────────────┘    └────────────────┘
   (7 stk)            (2 stk)               (5 stk)

Korrekt rækkefølge: 2 → 5 → 7  (midten → højre → venstre)
```

**"Tryk i rækkefølge: flest til færrest!"**

```
┌────────────┐    ┌──────────────┐    ┌──────────┐
│ ⛵⛵⛵       │    │ 🐢🐢🐢🐢🐢🐢🐢🐢│    │ 🌴🌴🌴🌴🌴  │
└────────────┘    └──────────────┘    └──────────┘
   (3 stk)            (8 stk)           (5 stk)

Korrekt rækkefølge: 8 → 5 → 3  (midten → højre → venstre)
```

**"Tryk i rækkefølge: færrest til flest!"**

```
┌──────────┐    ┌──────────────┐    ┌──────────────────┐
│ 🎣🎣🎣🎣   │    │ 🦭             │    │ 🐬🐬🐬🐬🐬🐬🐬🐬🐬 │
└──────────┘    └──────────────┘    └──────────────────┘
   (4 stk)          (1 stk)              (9 stk)

Korrekt rækkefølge: 1 → 4 → 9  (midten → venstre → højre)
```

### Regler

- Tre kasser med **altid forskellige antal** (fx 2, 5, 7 — aldrig to ens)
- Hver kasse har sin egen tilfældig emoji (alle tre kan være forskellige)
- 1–10 emojis per kasse
- Kassernes fysiske placering er tilfældig (den mindste er ikke altid til venstre)
- Mode veksler 50/50: "færrest → flest" eller "flest → færrest"
- Forkert tryk = fejl (streak-reset, −3 sek), men sekvensen nulstilles ikke — spilleren kan fortsætte fra det forkerte tryk

### Pædagogisk værdi

Sortering er et kernebegreb i tidlig matematik. Opgaven tvinger barnet til at tælle alle tre kasser *inden* de trykker, og derefter sammenligne og ordne. Det er sværere end blot at finde "flest" fordi barnet skal holde styr på hele rækkefølgen.

---

## D: Find halvdelen

**Farvand:** 🏖️ Kysten (0.–3. klasse)  
**Sværhedsgrad:** Kun begynder  
**Input-type:** Tal-input (standard)  
**Træner:** Halveringsbegrebet, forløber for brøker og division

### Koncept

Spilleren ser **én kasse** med et **lige antal** emojis og skal svare på "Hvor mange er halvdelen?" med et tal. Kassen har altid 2, 4, 6, 8 eller 10 emojis, og svaret er altid et helt tal.

For at gøre halveringsbegrebet visuelt kan emojien arrangeres i **to rækker** (eller med en stiplet linje der deler gruppen) som visuel støtte — barnet kan se at gruppen naturligt deler sig i to lige store dele.

### Eksempler

**"Hvor mange er halvdelen?"**

```
┌──────────────────────┐
│ 🐟🐟🐟               │
│ 🐟🐟🐟               │
│ · · · · · · · · · ·  │  ← valgfri stiplet delelinje
│                      │
└──────────────────────┘
   (6 stk i alt)

Svar: 3
```

**"Hvor mange er halvdelen?"**

```
┌──────────────────────┐
│ 🦀🦀🦀🦀🦀            │
│ 🦀🦀🦀🦀🦀            │
└──────────────────────┘
   (10 stk i alt)

Svar: 5
```

**"Hvor mange er halvdelen?"**

```
┌──────────────────────┐
│ ⛵⛵                  │
│ ⛵⛵                  │
└──────────────────────┘
   (4 stk i alt)

Svar: 2
```

**"Hvor mange er halvdelen?"**

```
┌──────────────────────┐
│ 🐙                   │
│ 🐙                   │
└──────────────────────┘
   (2 stk i alt)

Svar: 1
```

### Regler

- Altid **lige antal** emojis: 2, 4, 6, 8 eller 10
- Svaret er altid et positivt heltal: 1, 2, 3, 4 eller 5
- Samme emoji i hele kassen
- Den visuelle to-række-arrangering er et UI-valg (valgfrit) men anbefales
- Bruger standard tal-input og numpad

### Pædagogisk værdi

Halvering er det mest fundamentale brøk-begreb og forbereder barnet på division med 2, brøker (½), og symmetri. Ved at vise emojien i to rækker kobler opgaven det abstrakte begreb "halvdel" til noget visuelt konkret.

---

## E: Find det dobbelte

**Farvand:** 🏖️ Kysten (0.–3. klasse)  
**Sværhedsgrad:** Kun begynder  
**Input-type:** Tal-input (standard)  
**Træner:** Fordoblingsbegrebet, forløber for multiplikation med 2

### Koncept

Spilleren ser **én kasse** med 1–5 emojis og skal svare på "Hvor mange er det dobbelte?" med et tal. Det er den omvendte operation af halvering (opgavetype D) og træner multiplikation med 2 intuitivt.

Som feedback ved korrekt svar kan UI'et vise en animation hvor kassen "spejles" — en identisk kopi dukker op ved siden af den originale, og det samlede antal blinker kort.

### Eksempler

**"Hvor mange er det dobbelte?"**

```
┌──────────────┐
│ 🐢🐢🐢       │
└──────────────┘
   (3 stk)

Svar: 6
```

**"Hvor mange er det dobbelte?"**

```
┌──────────────┐
│ 🦈            │
└──────────────┘
   (1 stk)

Svar: 2
```

**"Hvor mange er det dobbelte?"**

```
┌──────────────┐
│ 🪙🪙🪙🪙🪙   │
└──────────────┘
   (5 stk)

Svar: 10
```

**"Hvor mange er det dobbelte?"**

```
┌──────────────┐
│ 🐬🐬          │
└──────────────┘
   (2 stk)

Svar: 4
```

### Regler

- Altid **1–5 emojis** i kassen (så svaret aldrig overstiger 10)
- Svaret er altid: 2, 4, 6, 8 eller 10
- Samme emoji i kassen
- Bruger standard tal-input og numpad

### Pædagogisk værdi

Fordobling er den intuitive indgang til multiplikation. Parret med opgavetype D (halvering) danner de to opgaver en symmetrisk forståelse: "halvdelen af 6 er 3" og "det dobbelte af 3 er 6" er to sider af samme begreb. At møde begge styrker den dybere forståelse.

---

## F: Lige eller ulige?

**Farvand:** 🏖️ Kysten (0.–3. klasse)  
**Sværhedsgrad:** Kun begynder  
**Input-type:** Klik (to knapper: "Lige" / "Ulige")  
**Træner:** Parring, lige/ulige, forløber for division og rest

### Koncept

Spilleren ser **én kasse** med 1–10 emojis og skal afgøre om antallet er lige eller ulige. Svaret gives ved at trykke på en af to store knapper: "Lige" og "Ulige".

For at gøre begrebet visuelt kan emojien arrangeres i **par-kolonner** — to og to ved siden af hinanden. Hvis antallet er ulige, står den sidste emoji alene i bunden. Barnet kan visuelt se om der er "én til overs" eller ej.

### Eksempler

**"Er det lige eller ulige?"**

```
┌──────────────┐
│ 🐠  🐠       │
│ 🐠  🐠       │
│ 🐠  🐠       │
└──────────────┘
   (6 stk)

 [ Lige ✅ ]  [ Ulige ]
```

**"Er det lige eller ulige?"**

```
┌──────────────┐
│ 🦞  🦞       │
│ 🦞  🦞       │
│ 🦞           │  ← én til overs!
└──────────────┘
   (5 stk)

 [ Lige ]  [ Ulige ✅ ]
```

**"Er det lige eller ulige?"**

```
┌──────────────┐
│ 🐳           │
└──────────────┘
   (1 stk)

 [ Lige ]  [ Ulige ✅ ]
```

**"Er det lige eller ulige?"**

```
┌──────────────┐
│ ☀️  ☀️       │
│ ☀️  ☀️       │
│ ☀️  ☀️       │
│ ☀️  ☀️       │
│ ☀️  ☀️       │
└──────────────┘
   (10 stk)

 [ Lige ✅ ]  [ Ulige ]
```

### Regler

- Altid **1–10 emojis** i kassen
- Svaret er enten "lige" eller "ulige" (klik-baseret, `answer: -1`)
- Samme emoji i hele kassen
- Parvis arrangement (to kolonner) er et anbefalet UI-valg
- 50/50 fordeling af lige vs. ulige over tid (naturligt givet 1–10)

### Pædagogisk værdi

Lige/ulige er et af de første klassifikationsbegreber børn lærer i matematik. Parringsvisualisering (to og to) gør begrebet konkret: "lige" betyder at alle har en makker, "ulige" at én er alene. Det forbereder forståelse af rest ved division.

---

## G: Fortsæt mønsteret

**Farvand:** 🏖️ Kysten (0.–3. klasse)  
**Sværhedsgrad:** Kun begynder  
**Input-type:** Klik (vælg mellem 2–3 muligheder)  
**Træner:** Mønstergenkendelse, sekvenser, forløber for algebraisk tænkning

### Koncept

Spilleren ser en **sekvens af emojis** der følger et gentagende mønster, og skal vælge hvilken emoji der kommer som den næste. Den sidste position er markeret med et spørgsmålstegn, og spilleren vælger mellem 2–3 emoji-muligheder.

Mønstrene bruger 2 eller 3 forskellige emojis fra EMOJI_POOL og gentager i cykler af 2–3. Sekvensen viser mindst 2 fulde cykler plus starten af den næste, så mønsteret er tydeligt.

### Eksempler

**"Hvad kommer nu?"** (AB-mønster)

```
🐟 🦀 🐟 🦀 🐟 🦀 🐟  ?

Muligheder:  [ 🐟 ]  [ 🦀 ✅ ]  [ 🐙 ]
```

**"Hvad kommer nu?"** (ABB-mønster)

```
⛵ 🐙 🐙 ⛵ 🐙 🐙 ⛵  ?

Muligheder:  [ ⛵ ]  [ 🐙 ✅ ]
```

**"Hvad kommer nu?"** (ABC-mønster)

```
🌴 🦭 🐬 🌴 🦭 🐬 🌴 🦭  ?

Muligheder:  [ 🌴 ]  [ 🦭 ]  [ 🐬 ✅ ]
```

**"Hvad kommer nu?"** (AAB-mønster)

```
🐢 🐢 🦈 🐢 🐢 🦈 🐢 🐢  ?

Muligheder:  [ 🐢 ]  [ 🦈 ✅ ]
```

**"Hvad kommer nu?"** (ABAC-mønster — sværere variant)

```
🐚 🦐 🐚 🪸 🐚 🦐 🐚 🪸 🐚  ?

Muligheder:  [ 🐚 ]  [ 🦐 ✅ ]  [ 🪸 ]
```

### Mønstertyper og sandsynligheder

| Mønster | Cykluslængde | Eksempel | Andel |
|---------|-------------|----------|-------|
| AB | 2 | 🐟🦀🐟🦀 | 40% |
| ABB | 3 | ⛵🐙🐙⛵🐙🐙 | 20% |
| AAB | 3 | 🐢🐢🦈🐢🐢🦈 | 20% |
| ABC | 3 | 🌴🦭🐬🌴🦭🐬 | 15% |
| ABAC | 4 | 🐚🦐🐚🪸 | 5% |

### Regler

- Sekvensen viser mindst **2 fulde gentagelser** af mønsteret + start af næste
- 2–3 svarmuligheder (altid inkl. det korrekte + distraktorer fra mønsterets emojis)
- Distraktorerne er altid emojis der *indgår i mønsteret* men er forkerte på den position — aldrig tilfældige emojis udefra
- Klik-baseret (`answer: -1`)
- Emojien i mønsteret vælges tilfældigt fra EMOJI_POOL (alle forskellige)

### Pædagogisk værdi

Mønstergenkendelse er en af de mest grundlæggende matematiske kompetencer og en forløber for algebraisk tænkning. Opgaven træner evnen til at observere gentagelser og forudsige det næste element — præcis den tænkning der senere bruges til at forstå funktioner og sekvenser.

---

## H: Gør dem lige mange

**Farvand:** 🏖️ Kysten (0.–3. klasse)  
**Sværhedsgrad:** Kun begynder  
**Input-type:** Tal-input (standard)  
**Træner:** Sammenligning, differens, tidlig subtraktionstænkning

### Koncept

Spilleren ser **to kasser** med **samme emoji** men **ulige antal** og skal svare: "Hvor mange skal der til, så de har lige mange?" Svaret er differensen mellem de to kasser.

Konceptet pakker subtraktion ind i en intuitiv ramme: barnet tænker ikke "8 minus 3", men "hvor mange mangler den lille kasse for at matche den store?" — det er det samme regnestykke, men føles anderledes og mere konkret.

### Eksempler

**"Hvor mange mangler der, så de har lige mange?"**

```
┌──────────────────┐    ┌──────────────┐
│ 🐟🐟🐟🐟🐟🐟🐟🐟 │    │ 🐟🐟🐟       │
└──────────────────┘    └──────────────┘
      (8 stk)               (3 stk)

Svar: 5
```

**"Hvor mange mangler der, så de har lige mange?"**

```
┌──────────────────┐    ┌──────────────────┐
│ 🦀🦀🦀🦀🦀🦀🦀   │    │ 🦀🦀🦀🦀🦀       │
└──────────────────┘    └──────────────────┘
      (7 stk)               (5 stk)

Svar: 2
```

**"Hvor mange mangler der, så de har lige mange?"**

```
┌──────────────────────┐    ┌──────────┐
│ 🐙🐙🐙🐙🐙🐙🐙🐙🐙🐙│    │ 🐙       │
└──────────────────────┘    └──────────┘
       (10 stk)               (1 stk)

Svar: 9
```

**"Hvor mange mangler der, så de har lige mange?"**

```
┌──────────────┐    ┌──────────────┐
│ ⛵⛵⛵⛵       │    │ ⛵⛵⛵         │
└──────────────┘    └──────────────┘
     (4 stk)            (3 stk)

Svar: 1
```

### Regler

- To kasser med **samme emoji**, **altid ulige antal**
- Begge kasser: 1–10 emojis
- Differensen er altid mindst 1 (kasserne er aldrig ens)
- Den største kasse er tilfældigt til venstre eller højre
- Svaret er differensen (altid positivt heltal)
- Bruger standard tal-input og numpad

### Pædagogisk værdi

"Gør dem lige mange" rammer det samme begreb som subtraktion, men fra et sammenlignings-perspektiv. Forskning viser at børn ofte forstår "hvor mange mangler der?" før de forstår "hvad er 8 minus 3?", fordi det førstnævnte har en konkret visuel mening. Opgaven bygger bro mellem konkret tænkning og abstrakt aritmetik.

---

## I: Brøkdele visuelt

**Farvand:** ⛵ Det Åbne Hav (4.–6. klasse)  
**Sværhedsgrad:** Kun begynder  
**Input-type:** Klik (multiple choice — vælg den korrekte brøk)  
**Træner:** Brøkforståelse, del-af-helhed, visuel brøk-aflæsning

### Koncept

Spilleren ser **10 emojis** arrangeret i en række (eller et 2×5 gitter). En del af dem er **visuelt fremhævet** (fx med en gul ring, større størrelse, eller lysere farve), og spilleren skal vælge den korrekte brøk fra 3–4 muligheder.

Ved altid at bruge 10 emojis er brøkerne nemme at udregne og relaterer naturligt til tiendedele — men svaret kan forenkles (fx 5/10 = 1/2, 2/10 = 1/5).

### Eksempler

**"Hvor stor en del er fremhævet?"**

```
 🐟  🐟  🐟  [🐟] [🐟] [🐟] [🐟]  🐟   🐟   🐟
                ↑ fremhævet ↑

4 ud af 10 er fremhævet.

Muligheder:  [ 1/5 ]  [ 2/5 ✅ ]  [ 1/2 ]  [ 3/10 ]
```

**"Hvor stor en del er fremhævet?"**

```
[🦀] [🦀] [🦀] [🦀] [🦀]  🦀   🦀   🦀   🦀   🦀

5 ud af 10 er fremhævet.

Muligheder:  [ 1/3 ]  [ 2/5 ]  [ 1/2 ✅ ]  [ 3/5 ]
```

**"Hvor stor en del er fremhævet?"**

```
[⛵]  ⛵   ⛵   ⛵   ⛵   ⛵   ⛵   ⛵   ⛵   ⛵

1 ud af 10 er fremhævet.

Muligheder:  [ 1/10 ✅ ]  [ 1/5 ]  [ 1/2 ]
```

**"Hvor stor en del er fremhævet?"**

```
[🐙] [🐙]  🐙   🐙   🐙   🐙   🐙   🐙   🐙   🐙

2 ud af 10 er fremhævet.

Muligheder:  [ 1/10 ]  [ 1/5 ✅ ]  [ 2/5 ]  [ 1/2 ]
```

**"Hvor stor en del er fremhævet?"**

```
[🌴] [🌴] [🌴] [🌴] [🌴] [🌴] [🌴] [🌴]  🌴   🌴

8 ud af 10 er fremhævet.

Muligheder:  [ 3/5 ]  [ 4/5 ✅ ]  [ 7/10 ]  [ 9/10 ]
```

### Gyldige antal fremhævede og deres brøker

| Fremhævet | Brøk (uforkort.) | Forenklet | Mulige distraktorer |
|-----------|-----------------|-----------|---------------------|
| 1 | 1/10 | 1/10 | 1/5, 1/2 |
| 2 | 2/10 | 1/5 | 1/10, 2/5, 1/2 |
| 3 | 3/10 | 3/10 | 1/5, 2/5, 1/3 |
| 4 | 4/10 | 2/5 | 1/5, 1/2, 3/10 |
| 5 | 5/10 | 1/2 | 2/5, 3/5, 1/3 |
| 6 | 6/10 | 3/5 | 1/2, 2/5, 7/10 |
| 7 | 7/10 | 7/10 | 3/5, 4/5, 1/2 |
| 8 | 8/10 | 4/5 | 3/5, 7/10, 9/10 |
| 9 | 9/10 | 9/10 | 4/5, 7/10, 1 |

### Regler

- Altid **10 emojis** i alt
- 1–9 af dem er fremhævet (aldrig 0, aldrig alle 10)
- Samme emoji for alle 10
- Svaret præsenteres som den **forenklede brøk** (2/10 → 1/5)
- 3–4 svarmuligheder, altid inkl. det korrekte svar
- Distraktorer er brøker der er "tæt på" det rigtige svar
- Klik-baseret (`answer: -1`)

### Pædagogisk værdi

Brøker er et af de sværeste begreber i mellemtrinnet. Ved at bruge 10 emojis som helhed, kan barnet *se* brøken — "2 ud af 10 er markeret, det er 1/5". Den faste base af 10 gør det intuitivt og kobler til tiendedele og procent. Multiple choice reducerer frustration og giver barnet mulighed for at eliminere og ræsonnere.

---

## J: Procentdel

**Farvand:** ⛵ Det Åbne Hav (4.–6. klasse)  
**Sværhedsgrad:** Kun begynder  
**Input-type:** Tal-input (standard — spilleren skriver et tal)  
**Træner:** Procentbegrebet, visuel til numerisk konvertering

### Koncept

Spilleren ser **10 emojis** hvor en del er fremhævet (nøjagtig som opgavetype I), men denne gang skal spilleren skrive **procenttallet** i stedet for at vælge en brøk. Med 10 emojis er svaret altid et multiplum af 10 (10%, 20%, ..., 90%).

Opgaven bygger naturligt ovenpå brøk-opgaven (I) og kobler den visuelle forståelse til procent-begrebet: "3 ud af 10 fremhævet = 30%".

### Eksempler

**"Hvor mange procent er fremhævet?"**

```
[🐟] [🐟] [🐟]  🐟   🐟   🐟   🐟   🐟   🐟   🐟

3 ud af 10 er fremhævet.

Svar: 30
```

**"Hvor mange procent er fremhævet?"**

```
[🦀] [🦀] [🦀] [🦀] [🦀] [🦀] [🦀]  🦀   🦀   🦀

7 ud af 10 er fremhævet.

Svar: 70
```

**"Hvor mange procent er fremhævet?"**

```
[⛵]  ⛵   ⛵   ⛵   ⛵   ⛵   ⛵   ⛵   ⛵   ⛵

1 ud af 10 er fremhævet.

Svar: 10
```

**"Hvor mange procent er fremhævet?"**

```
[🐙] [🐙] [🐙] [🐙] [🐙] [🐙] [🐙] [🐙] [🐙] [🐙]

10 ud af 10 er fremhævet.

Svar: 100
```

**"Hvor mange procent er fremhævet?"**

```
[🌴] [🌴] [🌴] [🌴] [🌴]  🌴   🌴   🌴   🌴   🌴

5 ud af 10 er fremhævet.

Svar: 50
```

### Regler

- Altid **10 emojis** i alt
- 1–10 af dem er fremhævet (her tillades alle 10 = 100%)
- Svaret er altid et multiplum af 10: 10, 20, 30, ..., 100
- Samme emoji for alle 10
- Bruger standard tal-input og numpad
- Spilleren skal **ikke** skrive %-tegnet, kun tallet

### Pædagogisk værdi

Procent er tæt knyttet til brøker med nævner 10 og 100. Ved at starte med 10 emojis er koblingen tydelig: hvert emoji svarer til 10%. Opgaven giver en visuel erfaring der gør procent konkret, frem for den abstrakte formel "antal / total × 100". Parret med opgavetype I skaber det en stærk kobling mellem brøker og procent.

---

## Bonus: Emoji-bingo (boss-kamp)

**Farvand:** 🏖️ Kysten / ⛵ Det Åbne Hav  
**Sværhedsgrad:** Alle niveauer  
**Input-type:** Klik (tryk på den rigtige række/kolonne)  
**Træner:** Hurtig optælling, addition, strategi under pres

### Koncept

En speciel opgavetype designet til **boss-kampe** (multi-fase). Spilleren ser et **3×3 gitter** med emojis i varierende antal per celle. Et tal vises (fx "Find rækken der giver 12!"), og spilleren skal trykke på den korrekte **række, kolonne eller diagonal** der summerer til det viste tal.

Idéen er at det fungerer som en enkelt fase i en boss-kamp — bossen kræver fx 3 korrekte "bingo-tryk" for at besejres. Hvert gitter er nyt.

### Eksempler

**"Find rækken/kolonnen der giver 9!"**

```
┌─────┬─────┬─────┐
│ 🐟×2│ 🐟×4│ 🐟×3│  → 2+4+3 = 9 ✅
├─────┼─────┼─────┤
│ 🐟×1│ 🐟×5│ 🐟×1│  → 1+5+1 = 7
├─────┼─────┼─────┤
│ 🐟×3│ 🐟×2│ 🐟×6│  → 3+2+6 = 11
└─────┴─────┴─────┘

Svar: Tryk på øverste række
```

**"Find rækken/kolonnen der giver 15!"**

```
┌─────┬─────┬─────┐
│ 🦀×3│ 🦀×2│ 🦀×4│
├─────┼─────┼─────┤
│ 🦀×7│ 🦀×5│ 🦀×3│  → 7+5+3 = 15 ✅
├─────┼─────┼─────┤
│ 🦀×1│ 🦀×6│ 🦀×2│
└─────┴─────┴─────┘

Svar: Tryk på midterste række
```

### Bemærkninger

Denne idé er mere kompleks at implementere end de øvrige og kræver et nyt UI-layout (gitter med klikbare rækker/kolonner). Den er tænkt som en "premium"-opgave til boss-kampe og kan vente til de enklere opgavetyper er på plads. Den er inkluderet her som inspiration.

---

## Oversigtsskema

| ID | Navn | Farvand | Input | Nyt UI krævet? | Kompleksitet |
|----|------|---------|-------|----------------|-------------|
| C | Sorter i rækkefølge | Kysten | Sekventielt klik (3 tryk) | Ja — sekventiel klik-logik | Medium |
| D | Find halvdelen | Kysten | Tal-input | Minimal — én kasse + to-række layout | Lav |
| E | Find det dobbelte | Kysten | Tal-input | Minimal — én kasse | Lav |
| F | Lige eller ulige? | Kysten | Klik (2 knapper) | Ja — to-knap layout | Lav |
| G | Fortsæt mønsteret | Kysten | Klik (2–3 muligheder) | Ja — sekvens-visning + multiple choice | Medium |
| H | Gør dem lige mange | Kysten | Tal-input | Nej — bruger to-kasse layout | Lav |
| I | Brøkdele visuelt | Åbent Hav | Klik (3–4 muligheder) | Ja — fremhævet emoji-række + MC | Medium |
| J | Procentdel | Åbent Hav | Tal-input | Minimal — fremhævet emoji-række | Lav |
| Bonus | Emoji-bingo | Alle | Klik (gitter) | Ja — 3×3 gitter | Høj |

### Anbefalet implementeringsrækkefølge

**Fase 1 — Lavthængende frugter (bruger eksisterende mekanismer):**
1. **D: Find halvdelen** — simpel tal-input, én kasse
2. **E: Find det dobbelte** — simpel tal-input, én kasse
3. **H: Gør dem lige mange** — tal-input, to kasser (allerede designet layout)

**Fase 2 — Nye klik-varianter:**
4. **F: Lige eller ulige?** — ny to-knap mekanisme
5. **G: Fortsæt mønsteret** — ny sekvens-visning + multiple choice

**Fase 3 — Udvidet klik:**
6. **C: Sorter i rækkefølge** — sekventiel klik-logik (mere kompleks)

**Fase 4 — Åbent Hav:**
7. **I: Brøkdele visuelt** — nyt fremhævet-emoji layout + MC
8. **J: Procentdel** — genbruger I's layout med tal-input

**Fase 5 — Boss-variant:**
9. **Bonus: Emoji-bingo** — helt nyt gitter-layout
