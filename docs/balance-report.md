# Balance-rapport

Genereret af `npm run sim` den 18.11.2026. 100 virtuelle spillere pr. elevtype,
hver med 4 t spilletid (frø 1). Tider er **spilletid**, ikke kalendertid.

Tal vises som **median (de hurtigste 10 % – de langsomste 10 %)**. "x % nåede" betyder, at resten ikke nåede
milepælen inden for spilletiden.

## Røde flag

**7 af 11 mål er ikke nået** (🟢 3 · 🔴 7 · 🟡 1). Grænserne står i
`GOAL_LIMITS` i `scripts/balance/goals.ts`.

|  | Mål | Målt | Grænse |
| --- | --- | --- | --- |
| 🔴 | 1. Usikker regner kan fiske i Skovsøen i første lektion | median 38 min, langsomste 10 % 44 min | median ≤ 30 min, langsomste 10 % ≤ 40 min |
| 🔴 | 2. Der sker noget nyt (level, køb eller område) mindst hvert 15. minut | længste pause 27 min (usikker regner, median) | længste pause ≤ 15 min for alle elevtyper |
| 🟢 | 3. Usikker regner er højst dobbelt så langsom som middel | 1,9× (2 t 23 min mod 1 t 15 min) | tid til level 10 ≤ 2× middel |
| 🔴 | 4. Usikker regner når Den Tropiske Ø inden for 4 t | 0 % nåede det | mindst 50 % af de usikre regnere |
| 🟡 | 5. Hele spillet varer 6-8 lektioner for en middel regner | ikke nået inden for 4 t | alt udstyr undtagen Sejlbåden købt efter 3 t-4 t 40 min |
| 🔴 | 6. Hvert nyt område giver mere pr. kast end det forrige | pr. kast: Ørkensøen 30,7, Dybet 24,7, Tropisk Ø 25,2, Grotten 27,2 kr (level 12, bosser uden belønning) | Dybet ≥ 1,2× Ørkensøen; Tropisk Ø og Grotten > Dybet |
| 🔴 | 7. Opsparingen til næste vare tager højst 15 minutter (middel regner) | Fisketilladelse: Dybet 29 min, Pandelampe 27 min, Mahogni Stang 27 min, Halvt Skattekort (højre) 22 min m.fl. (5 i alt) | ≤ 15 min fra forrige køb |
| 🔴 | 8. Stærk regner tjener højst tre gange så meget som usikker | 3,3× | ≤ 3,0× i første time |
| 🟢 | 9. En kiste er noget særligt | 1 pr. 23,2 fangster, 14 % af indtjeningen (middel regner) | højst 1 pr. 20 fangster og ≤ 15 % af indtjeningen |
| 🔴 | 10. Usikker regner fanger det meste af det, der bider | 65 % | mindst 75 % |
| 🟢 | 11. Skrald fylder en lille del af fangsterne | 11,6 pr. 100 kast (middel regner) | 8-14 pr. 100 kast |

### Automatiske fund

Ting, simulatoren selv har bemærket, uden at der er sat et mål for dem.

- **Dybet** bliver låst op, men næsten ingen fisker der (andel af tiden: middel 0,0 %, stærke 0,0 %). Andre steder giver mere.
- **Den Tropiske Ø** bliver låst op, men næsten ingen fisker der (andel af tiden: middel 0,0 %, stærke 0,0 %). Andre steder giver mere.
- **Den Mørke Grotte** bliver låst op, men næsten ingen fisker der (andel af tiden: middel 0,1 %). Andre steder giver mere.
- **Den Forbudte Sø** bliver låst op, men næsten ingen fisker der (andel af tiden: middel 0,0 %, stærke 0,0 %). Andre steder giver mere.
- Ingen elevtype når at købe Sejlbåd inden for 4 t.

## Forudsætninger

| Elevtype | Rigtige svar | Tid pr. svar |
| --- | --- | --- |
| Usikker regner | 60 % | 14 s |
| Middel regner | 80 % | 9 s |
| Stærk regner | 95 % | 5 s |

- Fast tid pr. kast: kast 0,65 s, ventetid til bid 2,2–6,0 s
  (Turbo Hjul: 1 s kortere maks.), reaktion 1 s, fangst-panel 3 s.
  Salg 4 s, køb 6 s, rejse 8 s. Forkert svar koster 3 s.
- Spilleren sælger, når spanden er fuld, og fisker der, hvor en fangst i gennemsnit er mest værd.
- Indkøbsliste (spilleren sparer op til den næste ting og springer intet over):
  Jernspand → Rejsekort → Fisketilladelse: Skovsøen → Turbo Hjul → Havblå Stang → Solbriller → Vandflaske → Solhat → Solcreme → Hue → Handsker → Varmedunk → Halstørklæde → Kobberspand → Magnet → Heldigt Firkløver → Bambus Stang → Robåd → Fisketilladelse: Dybet → Mahogni Stang → Pandelampe → Sølvspand → Halvt Skattekort (højre) → Selvlysende Prop → Guldspand → Guld Krog → Sejlbåd.
- **Ikke med:** mål-belønninger, bossernes særlige belønninger, madding, vejr (altid klart), garderobe-ting fra
  kister, hytten, Jungleøen, NPC'er og minispil. Tallene for mønter er derfor et minimum.

## Fremgang: hvornår når man et level

|  | Usikker regner | Middel regner | Stærk regner |
| --- | --- | --- | --- |
| Level 3 | 13 min (8 min–17 min) | 7 min (5 min–9 min) | 5 min (4 min–6 min) |
| Level 5 | 38 min (30 min–45 min) | 20 min (18 min–24 min) | 14 min (12 min–16 min) |
| Level 8 | 1 t 35 min (1 t 23 min–1 t 49 min) | 50 min (46 min–56 min) | 35 min (32 min–38 min) |
| Level 10 | 2 t 23 min (2 t 3 min–2 t 37 min) | 1 t 15 min (1 t 9 min–1 t 22 min) | 52 min (47 min–55 min) |
| Level 12 | 3 t 18 min (3 t–3 t 34 min) | 1 t 44 min (1 t 38 min–1 t 50 min) | 1 t 10 min (1 t 5 min–1 t 14 min) |
| Level 15 | ikke nået | 2 t 39 min (2 t 31 min–2 t 49 min) | 1 t 48 min (1 t 42 min–1 t 54 min) |
| Level 17 | ikke nået | 3 t 29 min (3 t 19 min–3 t 39 min) | 2 t 22 min (2 t 15 min–2 t 29 min) |
| Level 20 | ikke nået | ikke nået | 3 t 27 min (3 t 18 min–3 t 34 min) |

## Fremgang: hvornår kan man fiske i et nyt område

Tidspunktet, hvor området er låst op **og** spilleren har det, der skal til for at fiske der (fx fisketilladelse
eller stang).

|  | Usikker regner | Middel regner | Stærk regner |
| --- | --- | --- | --- |
| Skovsøen | 38 min (31 min–44 min) | 20 min (17 min–23 min) | 13 min (12 min–15 min) |
| Ørkensøen | 1 t 25 min (1 t 15 min–1 t 34 min) | 44 min (40 min–48 min) | 30 min (27 min–32 min) |
| Ishavet | 1 t 43 min (1 t 30 min–1 t 53 min) | 53 min (48 min–57 min) | 35 min (33 min–38 min) |
| Dybet | kun 5 % nåede det | 2 t 15 min (2 t 7 min–2 t 23 min) | 1 t 29 min (1 t 24 min–1 t 34 min) |
| Den Tropiske Ø | ikke nået | 2 t 42 min (2 t 33 min–2 t 52 min) · 98 % nåede | 1 t 47 min (1 t 41 min–1 t 55 min) · 96 % nåede |
| Den Mørke Grotte | ikke nået | 3 t 10 min (3 t 1 min–3 t 26 min) · 94 % nåede | 2 t 5 min (1 t 59 min–2 t 21 min) · 94 % nåede |
| Den Forbudte Sø | ikke nået | 3 t 42 min (3 t 33 min–>4 t) · 88 % nåede | 2 t 26 min (2 t 20 min–>4 t) · 89 % nåede |

## Butikken: hvornår har man købt hver ting

| Vare (pris) | Usikker regner | Middel regner | Stærk regner |
| --- | --- | --- | --- |
| Jernspand (200 kr) | 27 min (20 min–33 min) | 15 min (12 min–17 min) | 10 min (8 min–11 min) |
| Rejsekort (650 kr) | 22 min (17 min–30 min) | 12 min (10 min–15 min) | 8 min (7 min–11 min) |
| Fisketilladelse: Skovsøen (300 kr) | 38 min (31 min–44 min) | 20 min (17 min–23 min) | 13 min (12 min–15 min) |
| Turbo Hjul (525 kr) | 53 min (45 min–1 t 1 min) | 28 min (25 min–31 min) | 18 min (17 min–21 min) |
| Havblå Stang (450 kr) | 1 t 7 min (58 min–1 t 14 min) | 34 min (31 min–39 min) | 23 min (21 min–25 min) |
| Solbriller (200 kr) | 1 t 14 min (1 t 3 min–1 t 20 min) | 37 min (33 min–42 min) | 25 min (23 min–27 min) |
| Vandflaske (150 kr) | 1 t 17 min (1 t 7 min–1 t 25 min) | 40 min (35 min–44 min) | 26 min (24 min–28 min) |
| Solhat (175 kr) | 1 t 23 min (1 t 10 min–1 t 30 min) | 42 min (38 min–46 min) | 28 min (26 min–31 min) |
| Solcreme (125 kr) | 1 t 25 min (1 t 15 min–1 t 34 min) | 44 min (40 min–48 min) | 30 min (27 min–32 min) |
| Hue (200 kr) | 1 t 31 min (1 t 20 min–1 t 39 min) | 47 min (43 min–51 min) | 32 min (29 min–34 min) |
| Handsker (175 kr) | 1 t 35 min (1 t 23 min–1 t 46 min) | 49 min (45 min–54 min) | 33 min (30 min–36 min) |
| Varmedunk (150 kr) | 1 t 38 min (1 t 26 min–1 t 51 min) | 52 min (47 min–55 min) | 34 min (32 min–37 min) |
| Halstørklæde (125 kr) | 1 t 43 min (1 t 30 min–1 t 53 min) | 53 min (48 min–57 min) | 35 min (33 min–38 min) |
| Kobberspand (500 kr) | 2 t 4 min (1 t 49 min–2 t 21 min) | 1 t 5 min (59 min–1 t 12 min) | 45 min (41 min–48 min) |
| Magnet (650 kr) | 2 t 4 min (1 t 50 min–2 t 22 min) | 1 t 4 min (58 min–1 t 12 min) | 42 min (39 min–46 min) |
| Heldigt Firkløver (850 kr) | 2 t 36 min (2 t 21 min–2 t 50 min) | 1 t 21 min (1 t 14 min–1 t 26 min) | 53 min (50 min–56 min) |
| Bambus Stang (1.250 kr) | 3 t 3 min (2 t 49 min–3 t 20 min) | 1 t 36 min (1 t 27 min–1 t 41 min) | 1 t 3 min (59 min–1 t 7 min) |
| Robåd (980 kr) | 3 t 26 min (3 t 11 min–3 t 41 min) | 1 t 47 min (1 t 39 min–1 t 53 min) | 1 t 10 min (1 t 6 min–1 t 14 min) |
| Fisketilladelse: Dybet (2.500 kr) | kun 5 % nåede det | 2 t 15 min (2 t 7 min–2 t 23 min) | 1 t 29 min (1 t 24 min–1 t 34 min) |
| Mahogni Stang (2.500 kr) | ikke nået | 2 t 42 min (2 t 33 min–2 t 52 min) · 98 % nåede | 1 t 47 min (1 t 41 min–1 t 55 min) · 96 % nåede |
| Pandelampe (2.500 kr) | ikke nået | 3 t 10 min (3 t 1 min–3 t 26 min) · 94 % nåede | 2 t 5 min (1 t 59 min–2 t 21 min) · 94 % nåede |
| Sølvspand (1.100 kr) | ikke nået | 3 t 20 min (3 t 11 min–>4 t) · 90 % nåede | 2 t 13 min (2 t 7 min–2 t 43 min) · 91 % nåede |
| Halvt Skattekort (højre) (2.000 kr) | ikke nået | 3 t 42 min (3 t 33 min–>4 t) · 88 % nåede | 2 t 26 min (2 t 20 min–>4 t) · 89 % nåede |
| Selvlysende Prop (1.350 kr) | ikke nået | 3 t 53 min (3 t 44 min–>4 t) · 51 % nåede | 2 t 36 min (2 t 30 min–>4 t) · 89 % nåede |
| Guldspand (2.400 kr) | ikke nået | ikke nået | 2 t 52 min (2 t 46 min–>4 t) · 87 % nåede |
| Guld Krog (3.950 kr) | ikke nået | ikke nået | 3 t 19 min (3 t 12 min–>4 t) · 87 % nåede |
| Sejlbåd (12.500 kr) | ikke nået | ikke nået | kun 6 % nåede det |

## Økonomi: mønter tjent i alt (salg)

| Efter | Usikker regner | Middel regner | Stærk regner |
| --- | --- | --- | --- |
| 15 min | 437 kr (348 kr–591 kr) | 863 kr (737 kr–971 kr) | 1.311 kr (1.167 kr–1.493 kr) |
| 30 min | 910 kr (731 kr–1.122 kr) | 1.842 kr (1.564 kr–2.075 kr) | 2.860 kr (2.639 kr–3.146 kr) |
| 1 t | 1.926 kr (1.665 kr–2.194 kr) | 3.986 kr (3.620 kr–4.271 kr) | 6.424 kr (5.829 kr–6.853 kr) |
| 2 t | 4.140 kr (3.660 kr–4.574 kr) | 8.852 kr (8.229 kr–9.513 kr) | 14.449 kr (13.303 kr–15.356 kr) |
| 3 t | 6.512 kr (5.749 kr–7.188 kr) | 14.217 kr (13.376 kr–15.075 kr) | 22.949 kr (17.249 kr–24.074 kr) |
| 4 t | 9.184 kr (8.399 kr–9.929 kr) | 19.614 kr (17.133 kr–20.964 kr) | 34.568 kr (18.120 kr–37.177 kr) |

### Mønter pr. time

| Time | Usikker regner | Middel regner | Stærk regner |
| --- | --- | --- | --- |
| 1. time | 1.926 kr | 3.986 kr | 6.424 kr |
| 2. time | 2.186 kr | 4.935 kr | 8.091 kr |
| 3. time | 2.370 kr | 5.370 kr | 8.444 kr |
| 4. time | 2.650 kr | 5.423 kr | 11.596 kr |

## Fangster: hvad kommer op pr. 100 kast

Alle kast i simuleringen samlet pr. elevtype. "Fanget" er andelen af kast, hvor kampen blev vundet.

|  | Usikker regner | Middel regner | Stærk regner |
| --- | --- | --- | --- |
| Fisk | 80,6 | 79,8 | 78,4 |
| Lille kiste | 2,2 | 2,3 | 2,2 |
| Kiste | 0,8 | 1,1 | 1,2 |
| Stor kiste | 0,5 | 1,0 | 1,4 |
| Skrald | 11,7 | 11,6 | 11,3 |
| Flaskepost | 0,3 | 0,2 | 0,1 |
| Boss | 0,0 | 0,0 | 0,1 |
| Samleobjekt | 3,3 | 3,8 | 5,0 |
| Brandmand | 0,6 | 0,4 | 0,3 |
| **Fanget** | 65,5 % | 96,1 % | 100,0 % |
| **Kast pr. time** | 135 | 174 | 247 |

### Kister

|  | Usikker regner | Middel regner | Stærk regner |
| --- | --- | --- | --- |
| Kister fanget pr. time | 3,1 | 7,2 | 11,8 |
| Fangster pr. kiste | 28,3 | 23,2 | 21,0 |
| Andel af indtjeningen fra kister | 10,9 % | 14,1 % | 14,9 % |
| Minutter til første kiste | 32 min (5 min–1 t 20 min) | 15 min (4 min–44 min) | 11 min (1 min–25 min) |

## Hvor bruger spillerne tiden

| Sted | Usikker regner | Middel regner | Stærk regner |
| --- | --- | --- | --- |
| Den Gamle Mole | 34,6 % | 20,6 % | 14,9 % |
| Ørkensøen | 43,5 % | 55,0 % | 51,1 % |
| Ishavet | 11,4 % | 11,1 % | 11,5 % |
| Skovsøen | 10,6 % | 13,3 % | 20,5 % |
| Den Mørke Grotte | 0,0 % | 0,1 % | 2,0 % |
| Den Forbudte Sø | 0,0 % | 0,0 % | 0,0 % |

## Fangsttabel: Level 3, intet udstyr

Pr. 100 kast (20.000 prøvekast pr. sted, uden spillere, flaskeposten allerede fundet). "Værdi" er
gennemsnitlig salgsværdi pr. kast uden streak-bonus. Steder, man ikke kan fiske på med dette udstyr, vises
alligevel som "hvis man kunne".

| Sted | Værdi | Fisk | Lille kiste | Kiste | Stor kiste | Skrald | Boss | Krystal | Samleobjekt | Brandmand |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Den Gamle Mole | 22,9 | 82,9 | 1,0 | 0,3 | 0,3 | 11,4 | 0,0 | 0,0 | 2,1 | 2,1 |
| Skovsøen | 22,2 | 72,5 | 2,2 | 0,1 | 1,3 | 10,4 | 0,0 | 0,0 | 13,5 | 0,0 |
| Dybet | 20,8 | 72,2 | 3,0 | 0,2 | 0,1 | 11,4 | 8,3 | 0,0 | 4,8 | 0,0 |
| Ørkensøen | 25,0 | 81,3 | 4,3 | 0,2 | 0,3 | 11,8 | 0,0 | 0,0 | 2,1 | 0,0 |
| Ishavet | 23,8 | 82,0 | 3,6 | 0,3 | 0,2 | 11,9 | 0,0 | 0,0 | 2,1 | 0,0 |
| Den Forbudte Sø | 22,5 | 77,1 | 3,6 | 0,3 | 0,1 | 10,8 | 0,0 | 0,0 | 6,4 | 1,8 |
| Den Tropiske Ø | 21,1 | 72,6 | 3,2 | 0,1 | 0,1 | 11,4 | 8,7 | 0,0 | 2,0 | 1,9 |
| Den Mørke Grotte | 26,3 | 76,6 | 5,5 | 0,5 | 1,7 | 11,3 | 0,0 | 2,4 | 2,0 | 0,0 |

## Fangsttabel: Level 10, Bambus + Firkløver

Pr. 100 kast (20.000 prøvekast pr. sted, uden spillere, flaskeposten allerede fundet). "Værdi" er
gennemsnitlig salgsværdi pr. kast uden streak-bonus. Steder, man ikke kan fiske på med dette udstyr, vises
alligevel som "hvis man kunne".

| Sted | Værdi | Fisk | Lille kiste | Kiste | Stor kiste | Skrald | Boss | Krystal | Samleobjekt | Brandmand |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Den Gamle Mole | 27,2 | 81,6 | 0,8 | 1,4 | 0,5 | 11,5 | 0,0 | 0,0 | 2,2 | 2,1 |
| Skovsøen | 26,8 | 70,4 | 1,8 | 0,5 | 2,7 | 10,2 | 0,0 | 0,0 | 14,4 | 0,0 |
| Dybet | 23,9 | 72,0 | 2,3 | 0,6 | 0,2 | 11,0 | 8,1 | 0,0 | 5,8 | 0,0 |
| Ørkensøen | 29,3 | 81,4 | 3,3 | 1,0 | 0,5 | 11,7 | 0,0 | 0,0 | 2,1 | 0,0 |
| Ishavet | 28,1 | 81,4 | 2,8 | 1,4 | 0,4 | 11,9 | 0,0 | 0,0 | 2,1 | 0,0 |
| Den Forbudte Sø | 26,0 | 76,0 | 2,9 | 1,1 | 0,3 | 10,7 | 0,0 | 0,0 | 7,2 | 1,8 |
| Den Tropiske Ø | 24,3 | 72,9 | 2,4 | 0,6 | 0,2 | 11,2 | 8,7 | 0,0 | 2,0 | 1,9 |
| Den Mørke Grotte | 31,4 | 75,1 | 4,2 | 1,9 | 2,9 | 11,5 | 0,0 | 2,3 | 2,1 | 0,0 |

## Fangsttabel: Level 20, alt udstyr

Pr. 100 kast (20.000 prøvekast pr. sted, uden spillere, flaskeposten allerede fundet). "Værdi" er
gennemsnitlig salgsværdi pr. kast uden streak-bonus. Steder, man ikke kan fiske på med dette udstyr, vises
alligevel som "hvis man kunne".

| Sted | Værdi | Fisk | Lille kiste | Kiste | Stor kiste | Skrald | Boss | Krystal | Samleobjekt | Brandmand |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Den Gamle Mole | 47,1 | 80,4 | 0,7 | 2,1 | 1,0 | 11,7 | 0,0 | 0,0 | 2,0 | 2,1 |
| Skovsøen | 51,6 | 67,7 | 1,2 | 0,6 | 4,2 | 10,3 | 0,0 | 0,0 | 16,1 | 0,0 |
| Dybet | 38,6 | 70,5 | 1,8 | 0,8 | 0,4 | 10,7 | 8,2 | 0,0 | 7,6 | 0,0 |
| Ørkensøen | 50,3 | 81,0 | 2,6 | 1,5 | 1,0 | 11,8 | 0,0 | 0,0 | 2,2 | 0,0 |
| Ishavet | 48,4 | 80,9 | 2,2 | 2,1 | 0,9 | 11,9 | 0,0 | 0,0 | 2,1 | 0,0 |
| Den Forbudte Sø | 42,7 | 73,8 | 2,0 | 1,8 | 0,5 | 10,7 | 0,0 | 0,0 | 9,3 | 1,8 |
| Den Tropiske Ø | 39,4 | 73,1 | 1,7 | 1,0 | 0,2 | 11,3 | 8,8 | 0,0 | 2,0 | 1,9 |
| Den Mørke Grotte | 45,8 | 74,5 | 3,3 | 2,8 | 0,6 | 11,5 | 2,9 | 2,3 | 2,1 | 0,0 |
