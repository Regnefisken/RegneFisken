# Fiskehytten — Møbeludvidelse Bølge 2

> **Formål:** Nye møbler til alle tre rum. Disse møbler følger præcis samme designregler, farvepalette, skala-reference og userData-konventioner som beskrevet i den primære møbelguide (FISKEHYTTEN_MOEBLER_IMPLEMENTERING.md). Se den fil for farvepalette, materialer og userData-krav.
>
> **Implementér ét møbel ad gangen. Test mellem hvert møbel.**

---

## Oversigt

| Rum | Nye møbler | Antal |
|-----|-----------|-------|
| Stue | Gulvur, væghylde med trofæer, gyngestol, stearinlys-holder, verdenskort | 5 |
| Køkken | Krydderihylde, frugtskål, skraldespand, køkkenø, viskestykke-holder | 5 |
| Soveværelse | Garderobeskab, spejl på stativ, bogkasse, sovepude (gulv), vækkeur | 5 |

---

## RUM: STUEN

Stuen har allerede pejs, bord, stol, bogreol, akvarium, tæppe, vase og fiskestangsholder. Disse nye møbler tilføjer karakter og fylde uden at overfylde rummet.

---

### L1: Gulvur (standerur)

> **movableType:** `living_grandfather_clock`
> **Default position:** `(-5.0, 0, -3.5)` — venstre væg, bag i rummet
> **Default Y:** `0`
> **Reset-default:** `{ x: -5.0, z: -3.5, rot: Math.PI / 6 }` ← let drejet ud fra væggen

Et klassisk standerur i mørkt træ med messingpendulskive og urskive. Højt og smalt — et prestigemøbel.

**Geometri:**

```
Sokkel (base):
  boxGeometry args=[0.45, 0.25, 0.3]
  position=[0, 0.125, 0]
  farve: #3E2A1A (meget mørkt træ)

Midtersektion (smal krop):
  boxGeometry args=[0.32, 1.2, 0.25]
  position=[0, 0.95, 0]
  farve: #5C4033

Pendul-vindue (glas i fronten af midtersektion):
  boxGeometry args=[0.2, 0.5, 0.005]
  position=[0, 0.85, 0.127]
  meshStandardMaterial color="#88CCEE" transparent opacity={0.25}

Pendulskive:
  cylinderGeometry args=[0.06, 0.06, 0.01, 12]
  rotation=[Math.PI / 2, 0, 0]
  position=[0, 0.75, 0.08]
  farve: #B8860B (messing)

Pendul-stang:
  cylinderGeometry args=[0.005, 0.005, 0.35, 4]
  position=[0, 0.95, 0.08]
  farve: #B8860B

Hoved (urskive-hus):
  boxGeometry args=[0.42, 0.55, 0.28]
  position=[0, 1.82, 0]
  farve: #3E2A1A

Urskive (cirkulær):
  cylinderGeometry args=[0.15, 0.15, 0.01, 16]
  rotation=[Math.PI / 2, 0, 0]
  position=[0, 1.85, 0.145]
  farve: #F5F0E6 (cremé)

Urskive-ramme:
  cylinderGeometry args=[0.16, 0.16, 0.015, 16]
  rotation=[Math.PI / 2, 0, 0]
  position=[0, 1.85, 0.14]
  farve: #B8860B

Urviser 1 (time):
  boxGeometry args=[0.01, 0.08, 0.005]
  position=[0, 1.89, 0.155]
  farve: #1A1A1A

Urviser 2 (minut):
  boxGeometry args=[0.008, 0.11, 0.005]
  rotation=[0, 0, Math.PI * 0.35]
  position=[0.04, 1.88, 0.155]
  farve: #1A1A1A

Top-ornament (lille trekant/spids):
  boxGeometry args=[0.3, 0.15, 0.2]
  position=[0, 2.17, 0]
  farve: #3E2A1A
  NB: Kan erstattes med en cone — coneGeometry args=[0.18, 0.15, 4]
  rotation=[0, Math.PI/4, 0] for en pyramide-top
```

**Test:**
- [ ] Uret er højt (~2.2 enheder) og smalt. Står markant i rummet.
- [ ] Urskive med cremé baggrund, messingramme og sorte visere er synlig.
- [ ] Pendul bag glas er synligt.
- [ ] Kan flyttes og roteres.

---

### L2: Væghylde med trofæer

> **movableType:** `living_trophy_shelf`
> **Default position:** `(5.4, 1.8, 0.5)` — højre væg
> **Default Y:** `1.8`
> **Reset-default:** `{ x: 5.4, z: 0.5, rot: -Math.PI / 2 }`

En enkelt lang hylde med tre små trofæ-objekter: en guldpokal, en sølvfisk, og en bronzestjerne. Dekorativt — viser spillerens "bedrifter".

**Geometri:**

```
Hylde-plade:
  boxGeometry args=[1.4, 0.03, 0.2]
  position=[0, 0, 0]
  farve: #5C4033

Hylde-beslag venstre (lille L-form):
  boxGeometry args=[0.03, 0.15, 0.18]
  position=[-0.55, -0.08, 0]
  farve: #4A4A4A

Hylde-beslag højre:
  boxGeometry args=[0.03, 0.15, 0.18]
  position=[0.55, -0.08, 0]
  farve: #4A4A4A

Guldpokal (venstre):
  Fod: cylinderGeometry args=[0.04, 0.05, 0.02, 8]
    position=[-0.4, 0.025, 0]
    farve: #B8860B

  Stilk: cylinderGeometry args=[0.015, 0.015, 0.06, 6]
    position=[-0.4, 0.06, 0]
    farve: #B8860B

  Kop: cylinderGeometry args=[0.025, 0.045, 0.06, 8]
    position=[-0.4, 0.12, 0]
    farve: #B8860B

Sølvfisk (midten):
  Krop: sphereGeometry args=[0.04, 8, 6]
    scale=[1, 0.5, 2.0]
    position=[0, 0.04, 0]
    farve: #C0C0C0 (sølv), metalness={0.7}, roughness={0.2}

  Hale: boxGeometry args=[0.03, 0.03, 0.02]
    position=[0, 0.04, 0.06]
    farve: #C0C0C0

Bronzestjerne (højre):
  Plade (base): cylinderGeometry args=[0.035, 0.04, 0.015, 8]
    position=[0.4, 0.02, 0]
    farve: #3E2A1A

  Stjerne (approksimeret med flad box):
    boxGeometry args=[0.06, 0.06, 0.01]
    position=[0.4, 0.065, 0]
    rotation=[0, 0, Math.PI / 4]
    farve: #CD7F32 (bronze), metalness={0.5}, roughness={0.35}

  Overlejret box (danner kryds → 8-kantet stjerne):
    boxGeometry args=[0.06, 0.06, 0.01]
    position=[0.4, 0.065, 0]
    farve: #CD7F32, metalness={0.5}, roughness={0.35}
```

**Test:**
- [ ] Hylden hænger på væggen med to beslag.
- [ ] Tre trofæer er synlige: guldpokal, sølvfisk, bronzestjerne.
- [ ] Kan flyttes og højde-justeres.

---

### L3: Gyngestol

> **movableType:** `living_rocking_chair`
> **Default position:** `(-2.5, 0, 1.5)` — foran pejsen, vendt mod ilden
> **Default Y:** `0`
> **Reset-default:** `{ x: -2.5, z: 1.5, rot: Math.PI }`

En klassisk gyngestol med buede gænger. Lidt bredere og mere komfortabel end den almindelige stol.

**Geometri:**

```
Sæde:
  boxGeometry args=[0.6, 0.04, 0.5]
  position=[0, 0.5, 0]
  farve: #8B6914

Ryglæn:
  boxGeometry args=[0.56, 0.55, 0.035]
  position=[0, 0.82, -0.23]
  farve: #8B6914

Ryglæn-sprosser (3 lodrette stænger):
  Sprotte 1: boxGeometry args=[0.03, 0.45, 0.025]
    position=[-0.15, 0.82, -0.225]
    farve: #5C4033

  Sprotte 2: boxGeometry args=[0.03, 0.45, 0.025]
    position=[0, 0.82, -0.225]
    farve: #5C4033

  Sprotte 3: boxGeometry args=[0.03, 0.45, 0.025]
    position=[0.15, 0.82, -0.225]
    farve: #5C4033

Armlæn venstre:
  boxGeometry args=[0.04, 0.04, 0.4]
  position=[-0.28, 0.62, -0.02]
  farve: #5C4033

Armlæn højre:
  boxGeometry args=[0.04, 0.04, 0.4]
  position=[0.28, 0.62, -0.02]
  farve: #5C4033

Armlæn-støtte venstre (lodret):
  cylinderGeometry args=[0.02, 0.02, 0.2, 6]
  position=[-0.28, 0.52, 0.18]
  farve: #5C4033

Armlæn-støtte højre:
  cylinderGeometry args=[0.02, 0.02, 0.2, 6]
  position=[0.28, 0.52, 0.18]
  farve: #5C4033

Gænger (buede ben) — venstre:
  boxGeometry args=[0.04, 0.06, 0.75]
  position=[-0.27, 0.03, 0]
  farve: #5C4033
  NB: Buet effekt simuleres ved at tilføje to let løftede endestykker:

  Gænger-venstre-front:
    boxGeometry args=[0.04, 0.06, 0.1]
    position=[-0.27, 0.06, 0.35]
    rotation=[0.2, 0, 0]
    farve: #5C4033

  Gænger-venstre-bag:
    boxGeometry args=[0.04, 0.06, 0.1]
    position=[-0.27, 0.06, -0.35]
    rotation=[-0.2, 0, 0]
    farve: #5C4033

Gænger (højre) — spejl af venstre:
  Samme tre dele med x=0.27
```

**Test:**
- [ ] Gyngestolen er synligt bredere/mere komfortabel end den almindelige stol.
- [ ] Buede gænger i bunden er tydelige.
- [ ] Armlæn og sprosser i ryglænet giver karakter.
- [ ] Placeret foran pejsen ved nulstil.

---

### L4: Stearinlys-holder (kandelaber)

> **movableType:** `living_candelabra`
> **Default position:** `(0.22, 1.215, -1.0)` — på bordet (samme base-position som vasen)
> **Default Y:** `1.215`
> **Reset-default:** `{ x: -0.5, z: -1.0, rot: 0 }`

En tre-armet kandelaber i messing med hvide stearinlys. Står på bordet.

**Geometri:**

```
Fod:
  cylinderGeometry args=[0.06, 0.07, 0.02, 10]
  position=[0, 0.01, 0]
  farve: #B8860B

Hovedstang:
  cylinderGeometry args=[0.015, 0.015, 0.2, 6]
  position=[0, 0.12, 0]
  farve: #B8860B

Arm venstre (vandret):
  cylinderGeometry args=[0.01, 0.01, 0.12, 6]
  rotation=[0, 0, Math.PI / 2]
  position=[-0.06, 0.2, 0]
  farve: #B8860B

Arm højre:
  cylinderGeometry args=[0.01, 0.01, 0.12, 6]
  rotation=[0, 0, Math.PI / 2]
  position=[0.06, 0.2, 0]
  farve: #B8860B

Lysholder center:
  cylinderGeometry args=[0.02, 0.02, 0.015, 8]
  position=[0, 0.225, 0]
  farve: #B8860B

Lysholder venstre:
  cylinderGeometry args=[0.02, 0.02, 0.015, 8]
  position=[-0.1, 0.205, 0]
  farve: #B8860B

Lysholder højre:
  cylinderGeometry args=[0.02, 0.02, 0.015, 8]
  position=[0.1, 0.205, 0]
  farve: #B8860B

Stearinlys center:
  cylinderGeometry args=[0.012, 0.012, 0.07, 6]
  position=[0, 0.265, 0]
  farve: #F5F0E6 (cremé)

Stearinlys venstre:
  cylinderGeometry args=[0.012, 0.012, 0.06, 6]
  position=[-0.1, 0.24, 0]
  farve: #F5F0E6

Stearinlys højre:
  cylinderGeometry args=[0.012, 0.012, 0.065, 6]
  position=[0.1, 0.245, 0]
  farve: #F5F0E6

Flammer (3 stk, lille diamant-form):
  Hver: sphereGeometry args=[0.008, 6, 6] scale=[1, 1.8, 1]
  positioner: toppen af hvert lys
    center: [0, 0.305, 0]
    venstre: [-0.1, 0.275, 0]
    højre: [0.1, 0.283, 0]
  meshStandardMaterial color="#FF8C00" emissive="#FF6600" emissiveIntensity={0.6}
```

**Test:**
- [ ] Kandelaberen har tre arme med stearinlys og små glødende flammer.
- [ ] Messing-materialet skinner let.
- [ ] Passer i størrelse til at stå på bordet (Y-default = 1.215).

---

### L5: Verdenskort (vægdekoration)

> **movableType:** `living_world_map`
> **Default position:** `(-5.4, 2.3, 1.0)` — venstre væg, over gyngestolen
> **Default Y:** `2.3`
> **Reset-default:** `{ x: -5.4, z: 1.0, rot: Math.PI / 2 }`

Et indrammet "verdenskort" på væggen. Parchment-farvet baggrund med abstrakte landformer i jordfarver. Bredere end billedrammen i soveværelset.

**Geometri:**

```
Ramme:
  boxGeometry args=[1.2, 0.75, 0.035]
  position=[0, 0, 0]
  farve: #5C4033

Kort-flade:
  boxGeometry args=[1.05, 0.6, 0.01]
  position=[0, 0, 0.02]

Canvas-tekstur (opret i useMemo):
  Canvas størrelse: 210 × 120 px

  1. Baggrund: fyld med #E8D9B0 (parchment/pergament)

  2. Hav-områder (blå vask):
     fillStyle = '#B8CDE0', globalAlpha = 0.4
     fillRect(0, 0, 210, 120)   ← let blå over det hele
     globalAlpha = 1.0

  3. Landmasser (abstrakte former med fillStyle #8B7D5C):
     — Venstre kontinent (Sydamerika-agtigt):
        beginPath, moveTo(30,45), bezierCurveTo(25,55, 35,80, 28,95)
        lineTo(40,90), bezierCurveTo(45,70, 38,50, 42,40), closePath, fill

     — Midten-top kontinent (Europa/Afrika-agtigt):
        beginPath, moveTo(90,15), bezierCurveTo(80,20, 75,40, 85,65)
        lineTo(100,75), bezierCurveTo(110,50, 108,25, 95,12), closePath, fill

     — Højre kontinent (Asien-agtigt):
        beginPath, moveTo(140,20), bezierCurveTo(130,30, 135,55, 155,60)
        lineTo(175,45), bezierCurveTo(180,30, 165,15, 150,18), closePath, fill

     — Lille ø (nederst højre):
        fillRect(160, 85, 20, 12) med afrundede hjørner (arc)

  4. Kompasrose (øverste højre hjørne):
     — Lille cirkel: arc(185, 20, 8, 0, Math.PI*2), strokeStyle='#5C4033', lineWidth=1
     — N-pil (opad): moveTo(185,12), lineTo(185,20), stroke
     — Lille "N": fillText('N', 183, 11), font='6px serif', fillStyle='#5C4033'

  5. Kanter: strokeRect(3, 3, 204, 114), strokeStyle='#5C4033', lineWidth=1.5

  texture.colorSpace = THREE.SRGBColorSpace
```

**Test:**
- [ ] Kortet hænger på venstre væg, bredere end billedrammen i soveværelset.
- [ ] Pergament-baggrund med abstrakte landformer og en lille kompasrose.
- [ ] Rammen er mørkt træ.
- [ ] Kan flyttes og højde-justeres.

---

## RUM: KØKKENET

Køkkenet har allerede fast køkkenbord, komfur, vask, stol, hængehylde, tæppe, lampe og kikkert fra den primære guide. Disse møbler tilføjer detaljer og funktionalitet.

---

### K8: Krydderihylde

> **movableType:** `kitchen_spice_rack`
> **Default position:** `(-5.4, 1.9, -3.0)` — venstre væg, ved komfuret
> **Default Y:** `1.9`
> **Reset-default:** `{ x: -5.4, z: -3.0, rot: Math.PI / 2 }`

En lille vægmonteret hylde med tre rækker farvede krydderi-glas.

**Geometri:**

```
Bagplade:
  boxGeometry args=[0.5, 0.45, 0.03]
  position=[0, 0, 0]
  farve: #8B6914

Hylde 1 (nederst):
  boxGeometry args=[0.5, 0.02, 0.08]
  position=[0, -0.14, 0.04]
  farve: #8B6914

Hylde 2 (midt):
  boxGeometry args=[0.5, 0.02, 0.08]
  position=[0, 0.02, 0.04]
  farve: #8B6914

Hylde 3 (øverst):
  boxGeometry args=[0.5, 0.02, 0.08]
  position=[0, 0.18, 0.04]
  farve: #8B6914

Glas-rækker (3 glas per hylde, cylinderGeometry args=[0.025, 0.025, 0.09, 8]):

  Nederste hylde:
    position=[-0.14, -0.085, 0.04]  farve: #8B4513 (kanel-brun)
    position=[0, -0.085, 0.04]      farve: #C45A3C (paprika-rød)
    position=[0.14, -0.085, 0.04]   farve: #9ACD32 (basilikum-grøn)

  Midterste hylde:
    position=[-0.14, 0.075, 0.04]   farve: #DAA520 (karry-gul)
    position=[0, 0.075, 0.04]       farve: #D2691E (nelliker-brun)
    position=[0.14, 0.075, 0.04]    farve: #F5F0E6 (salt-hvid)

  Øverste hylde:
    position=[-0.14, 0.235, 0.04]   farve: #2E8B57 (oregano-grøn)
    position=[0, 0.235, 0.04]       farve: #1A1A1A (peber-sort)
    position=[0.14, 0.235, 0.04]    farve: #CD853F (ingefær-brun)

Glas-låg (9 stk, cylinder args=[0.027, 0.027, 0.01, 8]):
  Samme X/Z som glassene, Y = glas-Y + 0.05
  farve: #B8860B (messing)
```

**Test:**
- [ ] 9 farvede krydderi-glas i tre rækker med messinglåg.
- [ ] Hænger på venstre væg nær komfuret.
- [ ] Farverne giver liv og variation.

---

### K9: Frugtskål

> **movableType:** `kitchen_fruit_bowl`
> **Default position:** `(0, 0.92, -4.67)` — oven på køkkenbordet
> **Default Y:** `0.92`
> **Reset-default:** `{ x: 0, z: -4.67, rot: 0 }`

En træskål med tre stykker frugt: et rødt æble, en gul citron, og en grøn pære.

**Geometri:**

```
Skål (flad, bred cylinder med tynd kant):
  Ydre: cylinderGeometry args=[0.18, 0.2, 0.06, 12]
    position=[0, 0.03, 0]
    farve: #8B6914

  Indre hulrum (mørkere, "indsænket"):
    cylinderGeometry args=[0.15, 0.17, 0.04, 12]
    position=[0, 0.04, 0]
    farve: #6B4226

Æble:
  sphereGeometry args=[0.05, 8, 8]
  position=[-0.05, 0.1, -0.02]
  farve: #CC2222 (rød)

  Æble-stilk:
    cylinderGeometry args=[0.004, 0.004, 0.025, 4]
    position=[-0.05, 0.15, -0.02]
    farve: #5C4033

Citron:
  sphereGeometry args=[0.04, 8, 8]
  scale=[1, 0.8, 1.3]
  position=[0.06, 0.09, 0.02]
  farve: #F0D048 (gul)

Pære:
  — Krop (nedre del): sphereGeometry args=[0.045, 8, 8]
    position=[0, 0.1, 0.06]
    farve: #6B8E23 (grøn)

  — Top (smallere): sphereGeometry args=[0.03, 8, 8]
    position=[0, 0.14, 0.06]
    farve: #6B8E23

  — Stilk: cylinderGeometry args=[0.003, 0.003, 0.02, 4]
    position=[0, 0.17, 0.06]
    farve: #5C4033
```

**Test:**
- [ ] Skålen har synligt hulrum med frugt i.
- [ ] Tre typer frugt med tydelige farver.
- [ ] Passer på køkkenbordet (Y-default = 0.92).

---

### K10: Skraldespand

> **movableType:** `kitchen_trash_can`
> **Default position:** `(3.5, 0, -2.0)` — højre side, ved vasken
> **Default Y:** `0`
> **Reset-default:** `{ x: 3.5, z: -2.0, rot: 0 }`

En simpel rund skraldespand i metal med fodpedal.

**Geometri:**

```
Spand (cylinder, let konisk):
  cylinderGeometry args=[0.14, 0.17, 0.55, 12]
  position=[0, 0.275, 0]
  farve: #4A4A4A (stål), metalness={0.5}, roughness={0.4}

Låg:
  cylinderGeometry args=[0.175, 0.175, 0.02, 12]
  position=[0, 0.56, 0]
  farve: #4A4A4A, metalness={0.5}

Låg-knop:
  sphereGeometry args=[0.02, 6, 6]
  position=[0, 0.58, 0]
  farve: #4A4A4A

Fodpedal:
  boxGeometry args=[0.08, 0.015, 0.1]
  position=[0, 0.01, 0.18]
  farve: #3A3A3A

Fodpedal-arm:
  boxGeometry args=[0.015, 0.05, 0.015]
  position=[0, 0.035, 0.16]
  farve: #3A3A3A
```

**Test:**
- [ ] Rund metalspand med låg og fodpedal.
- [ ] Proportionerne er rimelige (ca. 0.55 høj — knæhøjde).
- [ ] Kan flyttes.

---

### K11: Køkkenø (lille rullebord)

> **movableType:** `kitchen_island`
> **Default position:** `(0, 0, -1.0)` — midt i køkkenet
> **Default Y:** `0`
> **Reset-default:** `{ x: 0, z: -1.0, rot: 0 }`

Et lille rullebord / køkkenø med hylde under og skærebræt ovenpå. Giver et centrum at arbejde ved.

**Geometri:**

```
Ben (4 stk, cylinderGeometry args=[0.03, 0.03, 0.8, 6]):
  position=[-0.4, 0.4, -0.25]
  position=[0.4, 0.4, -0.25]
  position=[-0.4, 0.4, 0.25]
  position=[0.4, 0.4, 0.25]
  farve: #5C4033

Hjul (4 stk, cylinderGeometry args=[0.035, 0.035, 0.02, 8]):
  rotation=[Math.PI / 2, 0, 0] for forhjul, [0, 0, Math.PI / 2] for sidehjul
  positioner: bunden af hvert ben, Y ≈ 0.015
    [-0.4, 0.015, -0.25]
    [0.4, 0.015, -0.25]
    [-0.4, 0.015, 0.25]
    [0.4, 0.015, 0.25]
  farve: #2A2A2A

Nederste hylde:
  boxGeometry args=[0.78, 0.03, 0.48]
  position=[0, 0.2, 0]
  farve: #8B6914

Bordplade:
  boxGeometry args=[0.9, 0.04, 0.55]
  position=[0, 0.82, 0]
  farve: #8B6914

Skærebræt (ovenpå):
  boxGeometry args=[0.4, 0.02, 0.3]
  position=[0.15, 0.85, 0]
  farve: #C4A46C (lyst birketræ)

Håndtag (højre side):
  cylinderGeometry args=[0.015, 0.015, 0.45, 6]
  position=[0.47, 0.6, 0]
  farve: #B8860B
```

**Test:**
- [ ] Lille rullebord med synlige hjul, hylde under, og skærebræt ovenpå.
- [ ] Messinghåndtag på siden.
- [ ] Passer i midten af køkkenet.

---

### K12: Viskestykke-holder

> **movableType:** `kitchen_towel_holder`
> **Default position:** `(5.4, 1.4, -3.5)` — højre væg, nær vasken
> **Default Y:** `1.4`
> **Reset-default:** `{ x: 5.4, z: -3.5, rot: -Math.PI / 2 }`

En simpel vægmonteret stang med et hængende viskestykke.

**Geometri:**

```
Vægplade:
  boxGeometry args=[0.06, 0.06, 0.03]
  position=[0, 0, 0]
  farve: #4A4A4A

Stang:
  cylinderGeometry args=[0.012, 0.012, 0.35, 6]
  rotation=[0, 0, Math.PI / 2]
  position=[0, -0.03, 0.04]
  farve: #B8860B

Viskestykke (hængende stof):
  boxGeometry args=[0.28, 0.3, 0.015]
  position=[0, -0.2, 0.04]
  farve: #F5F0E6 (cremé)

Viskestykke-stribe (dekoration):
  boxGeometry args=[0.28, 0.04, 0.016]
  position=[0, -0.25, 0.04]
  farve: #3B5998 (blå accent)
```

**Test:**
- [ ] Stang hænger på væggen med et cremé viskestykke med blå stribe.
- [ ] Simpelt og genkendeligt.

---

## RUM: SOVEVÆRELSET

Soveværelset har allerede seng, natbord, lampe, kommode, tæppe og billedramme fra den primære guide. Disse møbler tilføjer komfort og personlighed.

---

### S7: Garderobeskab

> **movableType:** `bedroom_wardrobe`
> **Default position:** `(4.5, 0, -1.0)` — højre side af rummet
> **Default Y:** `0`
> **Reset-default:** `{ x: 4.5, z: -1.0, rot: -Math.PI / 2 }`

Et stort garderobeskab i mørkt træ med to døre. Det næststørste møbel efter sengen.

**Geometri:**

```
Krop:
  boxGeometry args=[1.1, 2.0, 0.55]
  position=[0, 1.0, 0]
  farve: #5C4033

Top-gesims:
  boxGeometry args=[1.16, 0.05, 0.58]
  position=[0, 2.025, 0]
  farve: #3E2A1A

Dør venstre:
  boxGeometry args=[0.5, 1.7, 0.02]
  position=[-0.26, 0.9, 0.285]
  farve: #6B4226

Dør højre:
  boxGeometry args=[0.5, 1.7, 0.02]
  position=[0.26, 0.9, 0.285]
  farve: #6B4226

Dør-sprække (lodret linje i midten):
  boxGeometry args=[0.008, 1.7, 0.025]
  position=[0, 0.9, 0.29]
  farve: #3E2A1A

Greb venstre:
  boxGeometry args=[0.025, 0.1, 0.025]
  position=[-0.06, 1.0, 0.3]
  farve: #B8860B

Greb højre:
  boxGeometry args=[0.025, 0.1, 0.025]
  position=[0.06, 1.0, 0.3]
  farve: #B8860B

Sokkel:
  boxGeometry args=[1.1, 0.08, 0.55]
  position=[0, 0.04, 0]
  farve: #3E2A1A
```

**Test:**
- [ ] Skabet er højt (~2.0) med to døre og messinggreb.
- [ ] Dør-sprække og gesims giver det karakter.
- [ ] Kan flyttes og roteres.

---

### S8: Gulvspejl på stativ

> **movableType:** `bedroom_mirror`
> **Default position:** `(3.0, 0, 1.0)` — højre halvdel, foran i rummet
> **Default Y:** `0`
> **Reset-default:** `{ x: 3.0, z: 1.0, rot: -Math.PI / 4 }`

Et ovalt-agtigt gulvspejl på et vippbart træstativ.

**Geometri:**

```
Stativ-ben venstre:
  boxGeometry args=[0.04, 1.5, 0.5]
  position=[-0.3, 0.75, 0]
  farve: #5C4033

Stativ-ben højre:
  boxGeometry args=[0.04, 1.5, 0.5]
  position=[0.3, 0.75, 0]
  farve: #5C4033

Tværbjælke (forbinder ben):
  boxGeometry args=[0.56, 0.04, 0.04]
  position=[0, 0.4, 0]
  farve: #5C4033

Fod venstre:
  boxGeometry args=[0.04, 0.04, 0.55]
  position=[-0.3, 0.02, 0]
  farve: #5C4033

Fod højre:
  boxGeometry args=[0.04, 0.04, 0.55]
  position=[0.3, 0.02, 0]
  farve: #5C4033

Spejl-ramme:
  boxGeometry args=[0.5, 1.0, 0.04]
  position=[0, 1.05, 0]
  farve: #3E2A1A

Spejl-flade:
  boxGeometry args=[0.42, 0.88, 0.005]
  position=[0, 1.05, 0.02]
  meshStandardMaterial color="#C8D8E8" metalness={0.9} roughness={0.05}
  NB: Høj metalness + lav roughness giver en reflekterende overflade
```

**Test:**
- [ ] Spejlet har høj reflektions-effekt (metalness).
- [ ] Stativet er stabilt med to ben og tværbjælke.
- [ ] Let vinklet ved default (rot = -π/4).
- [ ] Kan flyttes og roteres.

---

### S9: Bogkasse (lille)

> **movableType:** `bedroom_book_crate`
> **Default position:** `(-4.5, 0, 0.5)` — venstre side, foran i rummet
> **Default Y:** `0`
> **Reset-default:** `{ x: -4.5, z: 0.5, rot: Math.PI / 6 }`

En lille trækasse med 4-5 skråtstillede bøger. Mere uformel end stuens bogreol — passer til soveværelsets afslappede stemning.

**Geometri:**

```
Kasse — 4 sider + bund:

  Bund:
    boxGeometry args=[0.45, 0.02, 0.3]
    position=[0, 0.01, 0]
    farve: #8B6914

  Forside:
    boxGeometry args=[0.45, 0.22, 0.02]
    position=[0, 0.12, 0.14]
    farve: #8B6914

  Bagside:
    boxGeometry args=[0.45, 0.28, 0.02]   ← lidt højere i bagenden
    position=[0, 0.15, -0.14]
    farve: #8B6914

  Venstre:
    boxGeometry args=[0.02, 0.28, 0.28]
    position=[-0.22, 0.15, 0]
    farve: #8B6914

  Højre:
    boxGeometry args=[0.02, 0.28, 0.28]
    position=[0.22, 0.15, 0]
    farve: #8B6914

Bøger (5 stk, let skråtstillede boxe, lænet mod bagvæg):

  Bog 1: boxGeometry args=[0.03, 0.2, 0.18]
    position=[-0.12, 0.13, -0.02]
    rotation=[0.1, 0, -0.05]
    farve: #8B2252 (mørkerød)

  Bog 2: boxGeometry args=[0.025, 0.22, 0.18]
    position=[-0.06, 0.14, -0.02]
    rotation=[0.08, 0, 0]
    farve: #2E5A88 (marineblå)

  Bog 3: boxGeometry args=[0.035, 0.19, 0.18]
    position=[0.01, 0.12, -0.02]
    rotation=[0.12, 0, 0.03]
    farve: #2E7D32 (skovgrøn)

  Bog 4: boxGeometry args=[0.025, 0.21, 0.18]
    position=[0.07, 0.13, -0.02]
    rotation=[0.09, 0, -0.02]
    farve: #E8A948 (gylden)

  Bog 5: boxGeometry args=[0.03, 0.18, 0.18]
    position=[0.13, 0.12, -0.02]
    rotation=[0.15, 0, 0.05]
    farve: #6B4226 (brun)
```

**Test:**
- [ ] Trækasse med 5 farvede bøger, let skråtstillede.
- [ ] Kassen er åben opadtil.
- [ ] Uformel, afslappet vibe.

---

### S10: Sovepude (gulvpude)

> **movableType:** `bedroom_floor_cushion`
> **Default position:** `(-1.0, 0, 1.5)` — midt-foran i rummet
> **Default Y:** `0.005`
> **Reset-default:** `{ x: -1.0, z: 1.5, rot: Math.PI / 8 }`

En stor, flad gulvpude. Blød og rund — giver en hyggelig, afslappet fornemmelse.

**Geometri:**

```
Pude (flad cylinder):
  cylinderGeometry args=[0.35, 0.35, 0.1, 16]
  position=[0, 0.05, 0]
  farve: #3B5998 (blå accent — matcher stuens vase-blomster)
  roughness={1.0}, metalness={0}

Pude-fold (dekorativ stribe henover):
  boxGeometry args=[0.6, 0.015, 0.04]
  position=[0, 0.1, 0]
  farve: #2A4478 (mørkere blå)

Pude-kant (tykkere kant for "puffet" effekt):
  cylinderGeometry args=[0.36, 0.36, 0.03, 16]
  position=[0, 0.02, 0]
  farve: #2A4478
```

**Test:**
- [ ] Rund, flad pude i blå farve.
- [ ] Let "puffet" kant og dekorativ fold.
- [ ] Ligger på gulvet.

---

### S11: Vækkeur

> **movableType:** `bedroom_alarm_clock`
> **Default position:** `(-4.2, 0.55, -2.2)` — oven på natbordet (offset fra lampen)
> **Default Y:** `0.55`
> **Reset-default:** `{ x: -4.2, z: -2.2, rot: 0 }`

Et lille retro-vækkeur med to klokker øverst.

**Geometri:**

```
Ur-krop (rund):
  cylinderGeometry args=[0.06, 0.06, 0.04, 12]
  rotation=[Math.PI / 2, 0, 0]
  position=[0, 0.06, 0]
  farve: #B8860B (messing)

Urskive:
  cylinderGeometry args=[0.055, 0.055, 0.005, 12]
  rotation=[Math.PI / 2, 0, 0]
  position=[0, 0.06, 0.025]
  farve: #F5F0E6

Visere:
  Time: boxGeometry args=[0.005, 0.03, 0.003]
    position=[0, 0.075, 0.028]
    farve: #1A1A1A

  Minut: boxGeometry args=[0.004, 0.04, 0.003]
    rotation=[0, 0, Math.PI * 0.7]
    position=[0.02, 0.07, 0.028]
    farve: #1A1A1A

Ben (2 stk):
  cylinderGeometry args=[0.01, 0.015, 0.03, 6]
  position=[-0.035, 0.015, 0]
  rotation=[0, 0, 0.15]
  farve: #B8860B

  cylinderGeometry args=[0.01, 0.015, 0.03, 6]
  position=[0.035, 0.015, 0]
  rotation=[0, 0, -0.15]
  farve: #B8860B

Klokker (2 halvsfærer øverst):
  sphereGeometry args=[0.025, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]
  position=[-0.03, 0.1, 0]
  farve: #B8860B

  sphereGeometry args=[0.025, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]
  position=[0.03, 0.1, 0]
  farve: #B8860B

Hammer (mellem klokker):
  cylinderGeometry args=[0.004, 0.004, 0.04, 4]
  position=[0, 0.11, 0]
  farve: #4A4A4A

  sphereGeometry args=[0.008, 6, 6]
  position=[0, 0.13, 0]
  farve: #4A4A4A
```

**Test:**
- [ ] Lille retro-vækkeur med to klokker og hammer.
- [ ] Messing-krop med cremé urskive.
- [ ] Står på natbordet (Y-default = 0.55).
- [ ] Lille og charmerende — passer til soveværelsets skala.

---

## Persistence-opsummering (Bølge 2)

### Tilføj til Y_DEFAULTS

```typescript
// Stue
living_trophy_shelf: 1.8,
living_candelabra: 1.215,
living_world_map: 2.3,

// Køkken
kitchen_spice_rack: 1.9,
kitchen_fruit_bowl: 0.92,
kitchen_towel_holder: 1.4,

// Soveværelse
bedroom_alarm_clock: 0.55,
```

Alle øvrige har Y-default `0` eller `0.005` (tæpper/pude).

### Tilføj til FURNITURE_RESET_DEFAULTS

```typescript
// Stue
living_grandfather_clock: { x: -5.0,  z: -3.5, rot: Math.PI / 6 },
living_trophy_shelf:      { x: 5.4,   z: 0.5,  rot: -Math.PI / 2 },
living_rocking_chair:     { x: -2.5,  z: 1.5,  rot: Math.PI },
living_candelabra:        { x: -0.5,  z: -1.0, rot: 0 },
living_world_map:         { x: -5.4,  z: 1.0,  rot: Math.PI / 2 },

// Køkken
kitchen_spice_rack:       { x: -5.4,  z: -3.0, rot: Math.PI / 2 },
kitchen_fruit_bowl:       { x: 0,     z: -4.67, rot: 0 },
kitchen_trash_can:        { x: 3.5,   z: -2.0, rot: 0 },
kitchen_island:           { x: 0,     z: -1.0, rot: 0 },
kitchen_towel_holder:     { x: 5.4,   z: -3.5, rot: -Math.PI / 2 },

// Soveværelse
bedroom_wardrobe:         { x: 4.5,   z: -1.0, rot: -Math.PI / 2 },
bedroom_mirror:           { x: 3.0,   z: 1.0,  rot: -Math.PI / 4 },
bedroom_book_crate:       { x: -4.5,  z: 0.5,  rot: Math.PI / 6 },
bedroom_floor_cushion:    { x: -1.0,  z: 1.5,  rot: Math.PI / 8 },
bedroom_alarm_clock:      { x: -4.2,  z: -2.2, rot: 0 },
```

---

## Komplet implementeringsrækkefølge (Bølge 2)

| # | Møbel | movableType | Rum |
|---|-------|-------------|-----|
| 1 | Gulvur | `living_grandfather_clock` | Stue |
| 2 | Trofæhylde | `living_trophy_shelf` | Stue |
| 3 | Gyngestol | `living_rocking_chair` | Stue |
| 4 | Kandelaber | `living_candelabra` | Stue |
| 5 | Verdenskort | `living_world_map` | Stue |
| 6 | Krydderihylde | `kitchen_spice_rack` | Køkken |
| 7 | Frugtskål | `kitchen_fruit_bowl` | Køkken |
| 8 | Skraldespand | `kitchen_trash_can` | Køkken |
| 9 | Køkkenø | `kitchen_island` | Køkken |
| 10 | Viskestykke-holder | `kitchen_towel_holder` | Køkken |
| 11 | Garderobeskab | `bedroom_wardrobe` | Soveværelse |
| 12 | Gulvspejl | `bedroom_mirror` | Soveværelse |
| 13 | Bogkasse | `bedroom_book_crate` | Soveværelse |
| 14 | Gulvpude | `bedroom_floor_cushion` | Soveværelse |
| 15 | Vækkeur | `bedroom_alarm_clock` | Soveværelse |

**For hvert møbel:**
1. Opret komponenten med geometri og materialer som beskrevet.
2. Tag med `userData={{ isMovable: true, movableType: '...' }}`.
3. Tilføj Y-default og reset-default til `cabinFurniturePersistence.ts`.
4. Tilføj til rummets `rebuildMovableList()`.
5. Test: synligt? flytbart? nulstil virker? save/load bevarer position?
