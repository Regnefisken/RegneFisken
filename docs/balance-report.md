# Balance-rapport

Genereret af `npm run sim` den 18.11.2026. 100 virtuelle spillere pr. elevtype,
hver med 4 t spilletid (frø 1). Tider er **spilletid**, ikke kalendertid.

Tal vises som **median (de hurtigste 10 % – de langsomste 10 %)**. "x % nåede" betyder, at resten ikke nåede
milepælen inden for spilletiden.

## Røde flag

**8 af 11 mål er ikke nået** (🟢 2 · 🔴 8 · 🟡 1). Grænserne står i
`GOAL_LIMITS` i `scripts/balance/goals.ts`.

|  | Mål | Målt | Grænse |
| --- | --- | --- | --- |
| 🔴 | 1. Usikker regner kan fiske i Skovsøen i første lektion | median 34 min, langsomste 10 % 53 min | median ≤ 30 min, langsomste 10 % ≤ 40 min |
| 🔴 | 2. Der sker noget nyt (level, køb eller område) mindst hvert 15. minut | længste pause 29 min (usikker regner, median) | længste pause ≤ 15 min for alle elevtyper |
| 🟢 | 3. Usikker regner er højst dobbelt så langsom som middel | 1,9× (2 t 18 min mod 1 t 13 min) | tid til level 10 ≤ 2× middel |
| 🔴 | 4. Usikker regner når Den Tropiske Ø inden for 4 t | 1 % nåede det | mindst 50 % af de usikre regnere |
| 🟡 | 5. Hele spillet varer 6-8 lektioner for en middel regner | ikke nået inden for 4 t | alt udstyr undtagen Sejlbåden købt efter 3 t-4 t 40 min |
| 🔴 | 6. Hvert nyt område giver mere pr. kast end det forrige | pr. kast: Ørkensøen 36,5, Dybet 28,7, Tropisk Ø 28,8, Grotten 36,8 kr (level 12, bosser uden belønning) | Dybet ≥ 1,2× Ørkensøen; Tropisk Ø og Grotten > Dybet |
| 🔴 | 7. Opsparingen til næste vare tager højst 15 minutter (middel regner) | Fisketilladelse: Dybet 25 min, Guldspand 25 min, Mahogni Stang 24 min, Pandelampe 23 min m.fl. (7 i alt) | ≤ 15 min fra forrige køb |
| 🔴 | 8. Stærk regner tjener højst tre gange så meget som usikker | 3,4× | ≤ 3,0× i første time |
| 🔴 | 9. En kiste er noget særligt | 1 pr. 5,6 fangster, 40 % af indtjeningen (middel regner) | højst 1 pr. 20 fangster og ≤ 15 % af indtjeningen |
| 🔴 | 10. Usikker regner fanger det meste af det, der bider | 64 % | mindst 75 % |
| 🟢 | 11. Skrald fylder en lille del af fangsterne | 11,6 pr. 100 kast (middel regner) | 8-14 pr. 100 kast |

### Automatiske fund

Ting, simulatoren selv har bemærket, uden at der er sat et mål for dem.

- **Dybet** bliver låst op, men næsten ingen fisker der (andel af tiden: usikre 0,0 %, middel 0,0 %, stærke 0,0 %). Andre steder giver mere.
- **Den Tropiske Ø** bliver låst op, men næsten ingen fisker der (andel af tiden: middel 0,0 %, stærke 0,0 %). Andre steder giver mere.
- **Den Forbudte Sø** bliver låst op, men næsten ingen fisker der (andel af tiden: middel 0,3 %, stærke 0,3 %). Andre steder giver mere.

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
| Level 3 | 15 min (9 min–20 min) | 7 min (5 min–11 min) | 5 min (3 min–8 min) |
| Level 5 | 42 min (31 min–53 min) | 23 min (17 min–27 min) | 16 min (13 min–19 min) |
| Level 8 | 1 t 37 min (1 t 25 min–1 t 50 min) | 52 min (46 min–59 min) | 36 min (33 min–40 min) |
| Level 10 | 2 t 18 min (2 t 3 min–2 t 37 min) | 1 t 13 min (1 t 5 min–1 t 22 min) | 51 min (47 min–55 min) |
| Level 12 | 3 t 7 min (2 t 48 min–3 t 28 min) | 1 t 40 min (1 t 29 min–1 t 51 min) | 1 t 9 min (1 t 3 min–1 t 14 min) |
| Level 15 | kun 1 % nåede det | 2 t 34 min (2 t 22 min–2 t 47 min) | 1 t 45 min (1 t 39 min–1 t 52 min) |
| Level 20 | ikke nået | ikke nået | 3 t 18 min (3 t 7 min–3 t 30 min) |

## Fremgang: hvornår kan man fiske i et nyt område

Tidspunktet, hvor området er låst op **og** spilleren har det, der skal til for at fiske der (fx fisketilladelse
eller stang).

|  | Usikker regner | Middel regner | Stærk regner |
| --- | --- | --- | --- |
| Skovsøen | 34 min (27 min–53 min) | 19 min (14 min–28 min) | 13 min (10 min–18 min) |
| Ørkensøen | 1 t 16 min (1 t 5 min–1 t 27 min) | 40 min (36 min–45 min) | 27 min (25 min–30 min) |
| Ishavet | 1 t 30 min (1 t 20 min–1 t 42 min) | 48 min (43 min–53 min) | 33 min (30 min–36 min) |
| Dybet | 3 t 45 min (3 t 27 min–>4 t) · 80 % nåede | 1 t 59 min (1 t 51 min–2 t 7 min) | 1 t 18 min (1 t 14 min–1 t 22 min) |
| Den Tropiske Ø | kun 1 % nåede det | 2 t 23 min (2 t 15 min–2 t 33 min) | 1 t 33 min (1 t 29 min–1 t 37 min) |
| Den Mørke Grotte | ikke nået | 2 t 45 min (2 t 37 min–2 t 55 min) | 1 t 48 min (1 t 44 min–1 t 54 min) |
| Den Forbudte Sø | ikke nået | 3 t 16 min (3 t 3 min–3 t 29 min) | 2 t 6 min (2 t 2 min–2 t 13 min) |

## Butikken: hvornår har man købt hver ting

| Vare (pris) | Usikker regner | Middel regner | Stærk regner |
| --- | --- | --- | --- |
| Jernspand (200 kr) | 30 min (21 min–39 min) | 15 min (11 min–20 min) | 11 min (9 min–14 min) |
| Rejsekort (650 kr) | 23 min (16 min–41 min) | 11 min (8 min–23 min) | 8 min (6 min–16 min) |
| Fisketilladelse: Skovsøen (300 kr) | 34 min (27 min–53 min) | 19 min (14 min–28 min) | 13 min (10 min–18 min) |
| Turbo Hjul (525 kr) | 44 min (14 min–55 min) | 23 min (8 min–28 min) | 16 min (5 min–19 min) |
| Havblå Stang (450 kr) | 59 min (52 min–1 t 9 min) | 31 min (27 min–36 min) | 22 min (19 min–24 min) |
| Solbriller (200 kr) | 1 t 4 min (55 min–1 t 14 min) | 34 min (28 min–38 min) | 23 min (19 min–26 min) |
| Vandflaske (150 kr) | 1 t 8 min (59 min–1 t 19 min) | 36 min (32 min–41 min) | 25 min (22 min–27 min) |
| Solhat (175 kr) | 1 t 12 min (1 t 5 min–1 t 24 min) | 38 min (33 min–43 min) | 26 min (24 min–28 min) |
| Solcreme (125 kr) | 1 t 16 min (1 t 5 min–1 t 27 min) | 40 min (36 min–45 min) | 27 min (25 min–30 min) |
| Hue (200 kr) | 1 t 20 min (1 t 12 min–1 t 32 min) | 43 min (38 min–47 min) | 29 min (27 min–32 min) |
| Handsker (175 kr) | 1 t 24 min (1 t 15 min–1 t 36 min) | 45 min (40 min–50 min) | 30 min (28 min–33 min) |
| Varmedunk (150 kr) | 1 t 28 min (1 t 19 min–1 t 39 min) | 46 min (42 min–51 min) | 32 min (29 min–35 min) |
| Halstørklæde (125 kr) | 1 t 30 min (1 t 20 min–1 t 42 min) | 48 min (43 min–53 min) | 33 min (30 min–36 min) |
| Kobberspand (500 kr) | 2 t 1 min (1 t 43 min–2 t 18 min) | 1 t 4 min (57 min–1 t 12 min) | 45 min (41 min–49 min) |
| Magnet (650 kr) | 1 t 46 min (1 t 36 min–1 t 58 min) | 56 min (49 min–1 t 1 min) | 38 min (35 min–41 min) |
| Heldigt Firkløver (850 kr) | 2 t 15 min (2 t–2 t 30 min) | 1 t 10 min (1 t 4 min–1 t 18 min) | 47 min (42 min–50 min) |
| Bambus Stang (1.250 kr) | 2 t 41 min (2 t 28 min–2 t 56 min) | 1 t 24 min (1 t 17 min–1 t 31 min) | 57 min (53 min–1 t) |
| Robåd (980 kr) | 3 t 1 min (2 t 46 min–3 t 15 min) | 1 t 35 min (1 t 26 min–1 t 41 min) | 1 t 3 min (59 min–1 t 6 min) |
| Fisketilladelse: Dybet (2.500 kr) | 3 t 45 min (3 t 27 min–>4 t) · 80 % nåede | 1 t 59 min (1 t 51 min–2 t 7 min) | 1 t 18 min (1 t 14 min–1 t 22 min) |
| Mahogni Stang (2.500 kr) | kun 1 % nåede det | 2 t 23 min (2 t 15 min–2 t 33 min) | 1 t 33 min (1 t 29 min–1 t 37 min) |
| Pandelampe (2.500 kr) | ikke nået | 2 t 45 min (2 t 37 min–2 t 55 min) | 1 t 48 min (1 t 44 min–1 t 54 min) |
| Sølvspand (1.100 kr) | ikke nået | 2 t 56 min (2 t 48 min–3 t 6 min) | 1 t 54 min (1 t 51 min–2 t) |
| Halvt Skattekort (højre) (2.000 kr) | ikke nået | 3 t 16 min (3 t 3 min–3 t 29 min) | 2 t 6 min (2 t 2 min–2 t 13 min) |
| Selvlysende Prop (1.350 kr) | ikke nået | 3 t 28 min (3 t 16 min–3 t 40 min) | 2 t 15 min (2 t 9 min–2 t 22 min) |
| Guldspand (2.400 kr) | ikke nået | 3 t 49 min (3 t 41 min–>4 t) · 63 % nåede | 2 t 37 min (2 t 28 min–2 t 47 min) |
| Guld Krog (3.950 kr) | ikke nået | ikke nået | 2 t 49 min (2 t 43 min–2 t 58 min) |
| Sejlbåd (12.500 kr) | ikke nået | ikke nået | 3 t 40 min (3 t 34 min–3 t 51 min) · 98 % nåede |

## Økonomi: mønter tjent i alt (salg)

| Efter | Usikker regner | Middel regner | Stærk regner |
| --- | --- | --- | --- |
| 15 min | 473 kr (337 kr–656 kr) | 953 kr (843 kr–1.192 kr) | 1.413 kr (1.196 kr–1.702 kr) |
| 30 min | 1.009 kr (840 kr–1.244 kr) | 2.022 kr (1.783 kr–2.367 kr) | 3.092 kr (2.806 kr–3.499 kr) |
| 1 t | 2.156 kr (1.806 kr–2.566 kr) | 4.477 kr (3.983 kr–5.080 kr) | 7.233 kr (6.750 kr–7.891 kr) |
| 2 t | 4.737 kr (4.229 kr–5.215 kr) | 10.262 kr (9.374 kr–11.198 kr) | 17.111 kr (16.260 kr–17.901 kr) |
| 3 t | 7.647 kr (7.011 kr–8.427 kr) | 16.576 kr (15.550 kr–17.595 kr) | 28.227 kr (26.261 kr–29.962 kr) |
| 4 t | 10.911 kr (9.922 kr–12.062 kr) | 23.143 kr (21.883 kr–24.612 kr) | 42.973 kr (40.716 kr–45.385 kr) |

### Mønter pr. time

| Time | Usikker regner | Middel regner | Stærk regner |
| --- | --- | --- | --- |
| 1. time | 2.156 kr | 4.477 kr | 7.233 kr |
| 2. time | 2.585 kr | 5.804 kr | 9.753 kr |
| 3. time | 2.889 kr | 6.208 kr | 11.236 kr |
| 4. time | 3.180 kr | 6.598 kr | 14.790 kr |

## Fangster: hvad kommer op pr. 100 kast

Alle kast i simuleringen samlet pr. elevtype. "Fanget" er andelen af kast, hvor kampen blev vundet.

|  | Usikker regner | Middel regner | Stærk regner |
| --- | --- | --- | --- |
| Fisk | 69,6 | 67,4 | 66,2 |
| Lille kiste | 10,7 | 10,9 | 10,6 |
| Kiste | 3,6 | 5,1 | 6,1 |
| Stor kiste | 1,3 | 1,7 | 2,3 |
| Skrald | 11,7 | 11,6 | 11,6 |
| Flaskepost | 0,3 | 0,2 | 0,1 |
| Boss | 0,0 | 0,1 | 0,3 |
| Krystal | 0,0 | 0,1 | 0,3 |
| Samleobjekt | 2,4 | 2,4 | 2,3 |
| Brandmand | 0,5 | 0,3 | 0,3 |
| **Fanget** | 63,5 % | 93,3 % | 100,0 % |
| **Kast pr. time** | 139 | 178 | 249 |

### Kister

|  | Usikker regner | Middel regner | Stærk regner |
| --- | --- | --- | --- |
| Kister fanget pr. time | 13,7 | 29,5 | 47,0 |
| Fangster pr. kiste | 6,4 | 5,6 | 5,3 |
| Andel af indtjeningen fra kister | 36,5 % | 39,9 % | 39,2 % |
| Minutter til første kiste | 7 min (2 min–19 min) | 3 min (1 min–12 min) | 3 min (1 min–10 min) |

## Hvor bruger spillerne tiden

| Sted | Usikker regner | Middel regner | Stærk regner |
| --- | --- | --- | --- |
| Den Gamle Mole | 30,4 % | 18,6 % | 15,5 % |
| Skovsøen | 4,1 % | 3,1 % | 2,6 % |
| Ørkensøen | 42,6 % | 46,2 % | 42,9 % |
| Ishavet | 23,1 % | 25,1 % | 25,0 % |
| Den Mørke Grotte | 0,0 % | 6,9 % | 13,7 % |
| Den Forbudte Sø | 0,0 % | 0,3 % | 0,3 % |

## Fangsttabel: Level 3, intet udstyr

Pr. 100 kast (20.000 prøvekast pr. sted, uden spillere, flaskeposten allerede fundet). "Værdi" er
gennemsnitlig salgsværdi pr. kast uden streak-bonus. Steder, man ikke kan fiske på med dette udstyr, vises
alligevel som "hvis man kunne".

| Sted | Værdi | Fisk | Lille kiste | Kiste | Stor kiste | Skrald | Boss | Krystal | Samleobjekt | Brandmand |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Den Gamle Mole | 24,7 | 77,5 | 4,9 | 1,1 | 0,6 | 11,8 | 0,0 | 0,0 | 2,0 | 2,0 |
| Skovsøen | 24,5 | 63,8 | 10,5 | 0,4 | 1,3 | 10,4 | 0,0 | 0,0 | 13,5 | 0,0 |
| Dybet | 23,9 | 61,0 | 13,4 | 0,6 | 0,4 | 11,3 | 8,5 | 0,0 | 4,9 | 0,0 |
| Ørkensøen | 29,6 | 66,0 | 18,3 | 1,0 | 0,8 | 11,7 | 0,0 | 0,0 | 2,1 | 0,0 |
| Ishavet | 27,9 | 68,2 | 16,1 | 1,1 | 0,6 | 11,9 | 0,0 | 0,0 | 2,1 | 0,0 |
| Den Forbudte Sø | 26,7 | 63,0 | 16,5 | 1,1 | 0,4 | 10,7 | 0,0 | 0,0 | 6,3 | 1,9 |
| Den Tropiske Ø | 24,4 | 61,5 | 14,0 | 0,6 | 0,3 | 11,1 | 8,4 | 0,0 | 2,0 | 2,0 |
| Den Mørke Grotte | 31,0 | 59,0 | 22,4 | 1,6 | 1,5 | 11,1 | 0,0 | 2,4 | 2,0 | 0,0 |

## Fangsttabel: Level 10, Bambus + Firkløver

Pr. 100 kast (20.000 prøvekast pr. sted, uden spillere, flaskeposten allerede fundet). "Værdi" er
gennemsnitlig salgsværdi pr. kast uden streak-bonus. Steder, man ikke kan fiske på med dette udstyr, vises
alligevel som "hvis man kunne".

| Sted | Værdi | Fisk | Lille kiste | Kiste | Stor kiste | Skrald | Boss | Krystal | Samleobjekt | Brandmand |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Den Gamle Mole | 31,3 | 73,8 | 3,9 | 5,2 | 1,4 | 11,6 | 0,0 | 0,0 | 2,1 | 2,1 |
| Skovsøen | 29,2 | 62,4 | 8,3 | 2,0 | 2,7 | 10,4 | 0,0 | 0,0 | 14,3 | 0,0 |
| Dybet | 27,7 | 61,2 | 10,5 | 2,5 | 0,7 | 11,0 | 8,3 | 0,0 | 5,8 | 0,0 |
| Ørkensøen | 34,7 | 66,6 | 14,1 | 4,1 | 1,5 | 11,7 | 0,0 | 0,0 | 2,1 | 0,0 |
| Ishavet | 33,9 | 67,0 | 12,5 | 5,2 | 1,4 | 11,9 | 0,0 | 0,0 | 2,1 | 0,0 |
| Den Forbudte Sø | 31,6 | 61,8 | 12,5 | 4,8 | 1,1 | 10,7 | 0,0 | 0,0 | 7,2 | 1,9 |
| Den Tropiske Ø | 28,1 | 62,4 | 10,6 | 2,7 | 0,6 | 11,2 | 8,5 | 0,0 | 2,0 | 2,1 |
| Den Mørke Grotte | 37,9 | 56,6 | 17,7 | 6,8 | 3,0 | 11,5 | 0,0 | 2,2 | 2,1 | 0,0 |

## Fangsttabel: Level 20, alt udstyr

Pr. 100 kast (20.000 prøvekast pr. sted, uden spillere, flaskeposten allerede fundet). "Værdi" er
gennemsnitlig salgsværdi pr. kast uden streak-bonus. Steder, man ikke kan fiske på med dette udstyr, vises
alligevel som "hvis man kunne".

| Sted | Værdi | Fisk | Lille kiste | Kiste | Stor kiste | Skrald | Boss | Krystal | Samleobjekt | Brandmand |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Den Gamle Mole | 52,6 | 70,1 | 2,9 | 8,3 | 3,0 | 11,7 | 0,0 | 0,0 | 2,0 | 2,0 |
| Skovsøen | 48,0 | 59,5 | 5,8 | 2,9 | 5,4 | 10,4 | 0,0 | 0,0 | 16,1 | 0,0 |
| Dybet | 42,9 | 60,1 | 8,0 | 3,9 | 1,4 | 11,0 | 8,0 | 0,0 | 7,7 | 0,0 |
| Ørkensøen | 56,1 | 65,9 | 10,4 | 6,7 | 3,2 | 11,6 | 0,0 | 0,0 | 2,2 | 0,0 |
| Ishavet | 55,5 | 65,3 | 9,2 | 8,4 | 3,1 | 11,9 | 0,0 | 0,0 | 2,1 | 0,0 |
| Den Forbudte Sø | 49,3 | 59,5 | 9,3 | 7,3 | 2,1 | 10,8 | 0,0 | 0,0 | 9,2 | 1,9 |
| Den Tropiske Ø | 43,7 | 63,3 | 7,8 | 4,1 | 0,9 | 11,3 | 8,5 | 0,0 | 2,0 | 2,2 |
| Den Mørke Grotte | 54,6 | 55,8 | 13,4 | 10,4 | 2,3 | 11,6 | 2,2 | 2,2 | 2,2 | 0,0 |
