# Fiskehytten — Møbelimplementering for Composer

> **Kontekst:** Rummene (stue, køkken, soveværelse) er allerede implementeret inkl. faste elementer (køkkenbord, vinduer, døre, lys). Denne guide dækker KUN de movable møbler der skal tilføjes.
>
> **Implementér ét møbel ad gangen.** Stop efter hvert møbel, lad brugeren teste, og gå videre til det næste.

---

## Designregler

### Skala-reference fra stuens eksisterende møbler

| Møbel | Ca. bredde | Ca. dybde | Ca. højde | Stil |
|-------|-----------|-----------|-----------|------|
| Bord (`table`) | ~1.2 | ~0.8 | ~0.8 (plade) | Rektangulær plade, 4 cylindriske ben |
| Stol (`chair`) | ~0.5 | ~0.5 | ~0.8 (sæde) / ~1.4 (ryglæn) | Flad sædeplade, fladt ryglæn, 4 cylindriske ben |
| Bogreol (`shelf`) | ~0.4 | ~1.0 | ~2.0 | Box-ramme, 3 hylder, farvede box-bøger |
| Pejs (`fireplace`) | ~2.0 | ~0.8 | ~1.5 | Stenbokse, animerede flammer |
| Akvarium (`aquarium`) | ~1.0 | ~0.6 | ~0.8 | Transparente glassider, vand |
| Gulvtæppe (`rug`) | ~2.5 | ~0.02 | ~3.5 | Flad plane, canvas-tekstur |

En "person" i denne verden er ca. 1.8 enheder høj. Bordplader er ca. 0.85–0.95 over gulv. Natborde ca. 0.5–0.6 høje.

### Farvepalette

| Formål | Hex | Brug |
|--------|-----|------|
| Træ (lys) | `#8B6914` | Bordplader, hylder, stolsæder |
| Træ (mørk) | `#5C4033` | Rammer, ben, skabskroppe |
| Træ (gulv-tone) | `#6B4226` | Skabslåger, kontrast-paneler |
| Træ (meget mørk) | `#3E2A1A` | Sokler, billedrammer |
| Metal (messing) | `#B8860B` | Håndtag, greb, lampe-armaturer, haner |
| Metal (stål) | `#4A4A4A` | Komfur, jern-elementer |
| Stof (cremé) | `#F5F0E6` | Puder, lagner, lampeskærme |
| Stof (bordeaux) | `#6B1C23` | Sengetæppe, soveværelse-tæppe |
| Keramik (hvid) | `#F0EDE5` | Krus, tallerkner |
| Keramik (terracotta) | `#C45A3C` | Krukker, potter |
| Pære-glød | `#FFF5D6` | Emissive på lampepærer |

### Materialer

```tsx
// Lyst træ
<meshStandardMaterial color="#8B6914" roughness={0.8} />

// Mørkt træ
<meshStandardMaterial color="#5C4033" roughness={0.85} />

// Messing
<meshStandardMaterial color="#B8860B" roughness={0.3} metalness={0.6} />

// Stof
<meshStandardMaterial color="#F5F0E6" roughness={1.0} metalness={0} />

// Stål
<meshStandardMaterial color="#4A4A4A" roughness={0.4} metalness={0.5} />
```

### userData-krav

Hvert movable møbel SKAL have dette på sin ydre `<group>`:

```tsx
<group
  ref={refCallback}
  userData={{ isMovable: true, movableType: 'kitchen_stove' }}
  position={[defaultX, defaultY, defaultZ]}
>
  {/* al geometri relativt til (0,0,0) */}
</group>
```

### Navngivning

Køkken-møbler: `kitchen_` præfiks. Soveværelse-møbler: `bedroom_` præfiks.

---

## FASE A: KØKKENMØBLER

Implementér i denne rækkefølge. Alle møbler er erhverves-gated i fremtiden — under udvikling kan de vises direkte for at teste.

---

### A1: Komfur / Ovn

> **movableType:** `kitchen_stove`
> **Default position:** `(-2.0, 0, -4.0)` — langs bagvæg, venstre for køkkenbordet
> **Default Y:** `0`
> **Reset-default:** `{ x: -2.0, z: -4.0, rot: 0 }`

Fritstående komfur med ovn-sektion og fire kogeplader.

**Geometri (alle positioner relative til gruppens 0,0,0):**

```
Ovn-krop:
  boxGeometry args=[0.75, 0.84, 0.6]
  position=[0, 0.42, 0]
  farve: #4A4A4A

Top-plade:
  boxGeometry args=[0.78, 0.04, 0.63]
  position=[0, 0.86, 0]
  farve: #3A3A3A

Kogeplade 1 (venstre bag):
  cylinderGeometry args=[0.08, 0.08, 0.015, 16]
  position=[-0.17, 0.88, -0.14]
  farve: #2A2A2A

Kogeplade 2 (højre bag):
  cylinderGeometry args=[0.08, 0.08, 0.015, 16]
  position=[0.17, 0.88, -0.14]
  farve: #2A2A2A

Kogeplade 3 (venstre front):
  cylinderGeometry args=[0.08, 0.08, 0.015, 16]
  position=[-0.17, 0.88, 0.14]
  farve: #2A2A2A

Kogeplade 4 (højre front):
  cylinderGeometry args=[0.08, 0.08, 0.015, 16]
  position=[0.17, 0.88, 0.14]
  farve: #2A2A2A

Ovndør:
  boxGeometry args=[0.55, 0.45, 0.02]
  position=[0, 0.32, 0.305]
  farve: #2A2A2A

Ovndør-vindue:
  boxGeometry args=[0.35, 0.22, 0.01]
  position=[0, 0.32, 0.315]
  meshStandardMaterial color="#1A1A1A" transparent opacity={0.7}

Ovndør-greb:
  boxGeometry args=[0.3, 0.03, 0.03]
  position=[0, 0.58, 0.32]
  farve: #B8860B (messing)

Sokkel:
  boxGeometry args=[0.75, 0.06, 0.6]
  position=[0, 0.03, 0]
  farve: #2A2A2A
```

**Test efter implementering:**
- [ ] Komfuret er synligt i køkkenet med korrekte proportioner.
- [ ] 4 kogeplader synlige fra oven.
- [ ] Ovndør med mørkt glas-vindue og messinggreb synlig fra fronten.
- [ ] Kan vælges og flyttes i furniture mode.
- [ ] Nulstil placerer det tilbage ved x=-2.0, z=-4.0.

---

### A2: Køkkenvask

> **movableType:** `kitchen_sink`
> **Default position:** `(2.0, 0, -4.0)` — langs bagvæg, højre for køkkenbordet
> **Default Y:** `0`
> **Reset-default:** `{ x: 2.0, z: -4.0, rot: 0 }`

Fritstående vask-møbel med skab, vask-fordybning og messinghane.

**Geometri:**

```
Underskab:
  boxGeometry args=[0.9, 0.78, 0.6]
  position=[0, 0.39, 0]
  farve: #5C4033

Bordplade (granit):
  boxGeometry args=[0.93, 0.04, 0.63]
  position=[0, 0.80, 0]
  farve: #6B6B6B

Vask-fordybning:
  boxGeometry args=[0.5, 0.04, 0.35]
  position=[0, 0.785, 0]
  farve: #D0D0D0
  NB: Y er 0.015 lavere end bordpladen — skaber visuelt "sænket" effekt

Hane (lodret rør):
  cylinderGeometry args=[0.02, 0.02, 0.3, 8]
  position=[0, 0.97, -0.2]
  farve: #B8860B

Hane (vandret tud):
  cylinderGeometry args=[0.015, 0.015, 0.15, 8]
  rotation=[0, 0, Math.PI / 2]
  position=[0, 1.1, -0.12]
  farve: #B8860B

Hane (tud-spids, vinklet ned):
  cylinderGeometry args=[0.015, 0.015, 0.08, 8]
  rotation=[Math.PI * 0.15, 0, 0]
  position=[0, 1.07, -0.04]
  farve: #B8860B

Skabslåge:
  boxGeometry args=[0.55, 0.5, 0.02]
  position=[0, 0.38, 0.305]
  farve: #6B4226

Lågegreb:
  boxGeometry args=[0.15, 0.03, 0.03]
  position=[0, 0.48, 0.32]
  farve: #B8860B

Sokkel:
  boxGeometry args=[0.9, 0.06, 0.5]
  position=[0, 0.03, 0]
  farve: #3E2A1A
```

**Test efter implementering:**
- [ ] Vasken har synlig fordybning i bordpladen.
- [ ] Messinghane med lodret rør + vandret tud + nedadvendt spids er synlig.
- [ ] Skabslåge med greb ses fra fronten.
- [ ] Kan vælges og flyttes i furniture mode.
- [ ] Nulstil placerer det ved x=2.0, z=-4.0.

---

### A3: Køkkenstol

> **movableType:** `kitchen_chair`
> **Default position:** `(0, 0, -1.5)` — midt i rummet, foran køkkenbordet
> **Default Y:** `0`
> **Reset-default:** `{ x: 0, z: -1.5, rot: Math.PI }`

Identisk med stuens stol. Kopiér geometrien fra stuens `chair`-kode i `FishingCabin.tsx` direkte — samme dimensioner, farver, alt. Kun `movableType` er anderledes.

**Geometri:** Se stuens stol-kode. Præcis kopi med `movableType: 'kitchen_chair'`.

**Test efter implementering:**
- [ ] Stolen ser identisk ud med stuens stol.
- [ ] Default-rotation vender den mod bagvæggen (Math.PI).
- [ ] Kan vælges og flyttes.

---

### A4: Hængehylde

> **movableType:** `kitchen_shelf`
> **Default position:** `(4.5, 2.2, -2.0)` — højre væg, oppe
> **Default Y:** `2.2`
> **Reset-default:** `{ x: 4.5, z: -2.0, rot: -Math.PI / 2 }`

Vægmonteret hylde med to niveauer og dekorative krus/krukker.

**Geometri:**

```
Bagplade:
  boxGeometry args=[1.2, 0.8, 0.04]
  position=[0, 0, 0]
  farve: #5C4033

Nederste hylde:
  boxGeometry args=[1.2, 0.03, 0.25]
  position=[0, -0.2, 0.12]
  farve: #8B6914

Øverste hylde:
  boxGeometry args=[1.2, 0.03, 0.25]
  position=[0, 0.2, 0.12]
  farve: #8B6914

Krus 1 (nederste hylde):
  cylinderGeometry args=[0.05, 0.05, 0.1, 10]
  position=[-0.35, -0.12, 0.12]
  farve: #F0EDE5

Krus 2 (nederste hylde):
  cylinderGeometry args=[0.05, 0.05, 0.1, 10]
  position=[-0.1, -0.12, 0.12]
  farve: #C45A3C

Krukke (øverste hylde):
  cylinderGeometry args=[0.08, 0.08, 0.15, 10]
  position=[0.2, 0.30, 0.12]
  farve: #C45A3C

Krukke-låg:
  cylinderGeometry args=[0.085, 0.085, 0.025, 10]
  position=[0.2, 0.39, 0.12]
  farve: #5C4033
```

**Test efter implementering:**
- [ ] Hylden hænger på højre væg (Y=2.2).
- [ ] To hylder synlige med krus og krukke.
- [ ] Kan flyttes inkl. højde-justering via HUD.
- [ ] Nulstil placerer den ved x=4.5, z=-2.0, rot=-π/2, Y=2.2.

---

### A5: Køkkentæppe

> **movableType:** `kitchen_rug`
> **Default position:** `(0, 0.005, 0)` — midt i rummet
> **Default Y:** `0.005`
> **Reset-default:** `{ x: 0, z: 0, rot: 0 }`

Gulvtæppe med canvas-tekstur. Anderledes mønster end stuens tæppe.

**Geometri:**

```
Tæppe:
  planeGeometry args=[2.0, 2.8]
  rotation=[-Math.PI / 2, 0, 0]
  position=[0, 0, 0]

Canvas-tekstur (opret i useMemo):
  Canvas størrelse: 200 × 280 px (matcher aspect ratio)
  1. Fyld hele canvas med #B8784E (varm gyldenbrun)
  2. Tegn kantramme (6px ind fra kanten) med #6B4226 (mørk brun), lineWidth 4
  3. Tegn indre ramme (16px ind) med #8B6914 (lys træ-tone), lineWidth 2
  
  Sæt texture.colorSpace = THREE.SRGBColorSpace
  Brug som map på meshStandardMaterial, roughness={1.0}
```

Se stuens `rug`-implementation for eksakt CanvasTexture-mønster.

**Test efter implementering:**
- [ ] Tæppet ligger fladt på gulvet, ingen z-fighting.
- [ ] Farve og mønster adskiller sig tydeligt fra stuens tæppe.
- [ ] Kan flyttes og roteres.

---

### A6: Køkkenlampe (loftslampe)

> **movableType:** `kitchen_lamp`
> **Default position:** `(0, 3.8, -1.0)` — hænger fra loftet
> **Default Y:** `3.8`
> **Reset-default:** `{ x: 0, z: -1.0, rot: 0 }`

Hængelampe fra loftet. Rent dekorativ — tilføjer IKKE et nyt pointlight.

**Geometri:**

```
Ophæng (stang):
  cylinderGeometry args=[0.012, 0.012, 1.2, 6]
  position=[0, 0.6, 0]
  farve: #4A4A4A

Lampeskærm (kegle):
  cylinderGeometry args=[0.04, 0.25, 0.2, 12]
  position=[0, 0, 0]
  farve: #B8860B (messing)

Pære (sfære):
  sphereGeometry args=[0.06, 10, 10]
  position=[0, 0.05, 0]
  meshStandardMaterial color="#FFF5D6" emissive="#FFF5D6" emissiveIntensity={0.3}
```

**Test efter implementering:**
- [ ] Lampen hænger fra loftet med stang + kegleformet skærm.
- [ ] Pæren har svag glød (emissive).
- [ ] Kan flyttes horisontalt og højde-justeres via HUD.
- [ ] Nulstil sætter Y=3.8.

---

### A7: Kikkert på stativ

> **movableType:** `kitchen_telescope`
> **Default position:** `(0, 0, -3.8)` — foran vinduet, midt i rummet
> **Default Y:** `0`
> **Reset-default:** `{ x: 0, z: -3.8, rot: 0 }`

En kikkert monteret på et træ-stativ. Placeret foran det lange vindue. Rent dekorativt for nu — interaktion tilføjes i en fremtidig opdatering. Ingen klik-handler, ingen special userData ud over standard movable-tags.

**Geometri:**

```
Stativ — 3 ben i tripod-formation:

  Ben 1 (venstre-front):
    cylinderGeometry args=[0.025, 0.02, 1.4, 6]
    position=[-0.22, 0.7, 0.15]
    rotation=[0, 0, Math.PI * 0.05]   ← let vinklet udad
    farve: #5C4033

  Ben 2 (højre-front):
    cylinderGeometry args=[0.025, 0.02, 1.4, 6]
    position=[0.22, 0.7, 0.15]
    rotation=[0, 0, -Math.PI * 0.05]
    farve: #5C4033

  Ben 3 (bag):
    cylinderGeometry args=[0.025, 0.02, 1.4, 6]
    position=[0, 0.7, -0.2]
    rotation=[Math.PI * 0.05, 0, 0]   ← vinklet bagud
    farve: #5C4033

Stativ-nav (hvor benene mødes):
  sphereGeometry args=[0.06, 8, 8]
  position=[0, 1.2, 0]
  farve: #5C4033

Kikkert-tube (hoveddel):
  cylinderGeometry args=[0.045, 0.06, 0.7, 12]
  rotation=[Math.PI * 0.15, 0, 0]    ← vinklet let opad mod vindue
  position=[0, 1.3, -0.1]
  farve: #4A4A4A (mørkt metal)

Kikkert-objektiv (front-linse):
  cylinderGeometry args=[0.065, 0.065, 0.02, 12]
  rotation=[Math.PI * 0.15, 0, 0]    ← samme vinkel som tuben
  position=[0, 1.38, -0.42]
  farve: #2A2A2A

Objektiv-glas:
  cylinderGeometry args=[0.055, 0.055, 0.005, 12]
  rotation=[Math.PI * 0.15, 0, 0]
  position=[0, 1.385, -0.43]
  meshStandardMaterial color="#88CCEE" transparent opacity={0.4} metalness={0.3}

Kikkert-okular (bag-ende):
  cylinderGeometry args=[0.035, 0.04, 0.08, 10]
  rotation=[Math.PI * 0.15, 0, 0]
  position=[0, 1.22, 0.2]
  farve: #2A2A2A

Messing-ring (dekorativ, midt på tuben):
  cylinderGeometry args=[0.065, 0.065, 0.02, 12]
  rotation=[Math.PI * 0.15, 0, 0]
  position=[0, 1.3, -0.1]
  farve: #B8860B

Ben-gummi-fødder (3 stk, bunden af hvert ben):
  sphereGeometry args=[0.03, 6, 6]
  position: ved bunden af hvert ben (y ≈ 0.02)
    [-0.25, 0.02, 0.22]
    [0.25, 0.02, 0.22]
    [0, 0.02, -0.28]
  farve: #2A2A2A
```

**Test efter implementering:**
- [ ] Kikkerten står på et tydeligt tre-bens stativ.
- [ ] Tuben peger let opad mod vinduet.
- [ ] Messing-ring og blåligt glas i objektivet giver den karakter.
- [ ] Kan flyttes og roteres i furniture mode.
- [ ] Der er INGEN klik-interaktion ud over furniture mode.
- [ ] Nulstil placerer den foran vinduet ved x=0, z=-3.8.

---

## FASE B: SOVEVÆRELSEMØBLER

Implementér i denne rækkefølge efter at køkkenets møbler er testet.

---

### B1: Seng

> **movableType:** `bedroom_bed`
> **Default position:** `(-2.5, 0, -2.5)` — mod venstre/bagvæg
> **Default Y:** `0`
> **Reset-default:** `{ x: -2.5, z: -2.5, rot: 0 }`

Soveværelsets centrale møbel. Træramme med hovedgærde, madras, pude og bordeaux-tæppe.

**Geometri:**

```
Hovedgærde:
  boxGeometry args=[1.8, 1.1, 0.08]
  position=[0, 0.55, -0.9]
  farve: #5C4033

Fodgærde:
  boxGeometry args=[1.8, 0.5, 0.08]
  position=[0, 0.25, 0.9]
  farve: #5C4033

Sideramme venstre:
  boxGeometry args=[0.08, 0.3, 1.72]
  position=[-0.86, 0.15, 0]
  farve: #5C4033

Sideramme højre:
  boxGeometry args=[0.08, 0.3, 1.72]
  position=[0.86, 0.15, 0]
  farve: #5C4033

Ben (4 stk, cylinderGeometry args=[0.05, 0.05, 0.2, 8]):
  position=[-0.82, 0.1, -0.82]
  position=[0.82, 0.1, -0.82]
  position=[-0.82, 0.1, 0.82]
  position=[0.82, 0.1, 0.82]
  farve: #5C4033

Madras:
  boxGeometry args=[1.64, 0.2, 1.72]
  position=[0, 0.40, 0]
  farve: #F5F0E6

Pude:
  boxGeometry args=[0.65, 0.12, 0.35]
  position=[0, 0.56, -0.6]
  farve: #F5F0E6

Tæppe/dyne:
  boxGeometry args=[1.55, 0.08, 1.0]
  position=[0, 0.52, 0.2]
  farve: #6B1C23 (bordeaux)
```

**Test efter implementering:**
- [ ] Sengen har synlig træramme med hovedgærde og fodgærde.
- [ ] Madras, pude og bordeaux-tæppe er synlige.
- [ ] Proportionerne ser rimelige ud i rummet (sengen er det største møbel).
- [ ] Kan flyttes og roteres i furniture mode.

---

### B2: Natbord

> **movableType:** `bedroom_nightstand`
> **Default position:** `(-4.2, 0, -2.5)` — ved siden af sengen
> **Default Y:** `0`
> **Reset-default:** `{ x: -4.2, z: -2.5, rot: 0 }`

Lille natbord med én skuffe.

**Geometri:**

```
Top-plade:
  boxGeometry args=[0.5, 0.03, 0.4]
  position=[0, 0.52, 0]
  farve: #8B6914

Krop:
  boxGeometry args=[0.46, 0.48, 0.36]
  position=[0, 0.26, 0]
  farve: #5C4033

Skuffe-front:
  boxGeometry args=[0.38, 0.16, 0.02]
  position=[0, 0.30, 0.185]
  farve: #6B4226

Skuffe-greb:
  boxGeometry args=[0.1, 0.025, 0.025]
  position=[0, 0.30, 0.20]
  farve: #B8860B

Ben (4 stk, cylinderGeometry args=[0.025, 0.025, 0.12, 6]):
  position=[-0.19, 0.06, -0.15]
  position=[0.19, 0.06, -0.15]
  position=[-0.19, 0.06, 0.15]
  position=[0.19, 0.06, 0.15]
  farve: #5C4033
```

**Test efter implementering:**
- [ ] Natbordet er lavt og kompakt.
- [ ] Skuffe med messinggreb synlig fra fronten.
- [ ] Passer proportionelt ved siden af sengen (natbordet er lavere end madrassen).
- [ ] Kan flyttes.

---

### B3: Natbordslampe

> **movableType:** `bedroom_lamp`
> **Default position:** `(-4.2, 0.55, -2.5)` — oven på natbordet
> **Default Y:** `0.55`
> **Reset-default:** `{ x: -4.2, z: -2.5, rot: 0 }`

Lille bordlampe. Rent dekorativ — intet ekstra pointlight.

**Geometri:**

```
Fod:
  cylinderGeometry args=[0.07, 0.07, 0.025, 10]
  position=[0, 0.012, 0]
  farve: #B8860B

Stang:
  cylinderGeometry args=[0.015, 0.015, 0.25, 6]
  position=[0, 0.15, 0]
  farve: #B8860B

Skærm (kegle):
  cylinderGeometry args=[0.04, 0.14, 0.15, 12]
  position=[0, 0.32, 0]
  meshStandardMaterial color="#F5F0E6" roughness={1.0} side={THREE.DoubleSide}

Pære:
  sphereGeometry args=[0.03, 8, 8]
  position=[0, 0.28, 0]
  meshStandardMaterial color="#FFF5D6" emissive="#FFF5D6" emissiveIntensity={0.2}
```

**Test efter implementering:**
- [ ] Lampen har messing-fod og stang med cremé lampeskærm.
- [ ] Pæren har svag glød.
- [ ] Ved default-position (Y=0.55) står den visuelt oven på natbordet.
- [ ] Kan flyttes og højde-justeres.

---

### B4: Kommode

> **movableType:** `bedroom_dresser`
> **Default position:** `(4.0, 0, -3.0)` — mod højre væg
> **Default Y:** `0`
> **Reset-default:** `{ x: 4.0, z: -3.0, rot: -Math.PI / 2 }`

Bred, lav kommode med tre skuffer.

**Geometri:**

```
Krop:
  boxGeometry args=[1.2, 0.8, 0.45]
  position=[0, 0.4, 0]
  farve: #5C4033

Top-plade:
  boxGeometry args=[1.24, 0.03, 0.48]
  position=[0, 0.82, 0]
  farve: #8B6914

Skuffe 1 (øverst):
  boxGeometry args=[1.05, 0.18, 0.02]
  position=[0, 0.67, 0.225]
  farve: #6B4226

  Greb 1:
    boxGeometry args=[0.15, 0.025, 0.025]
    position=[0, 0.67, 0.24]
    farve: #B8860B

Skuffe 2 (midt):
  boxGeometry args=[1.05, 0.18, 0.02]
  position=[0, 0.44, 0.225]
  farve: #6B4226

  Greb 2:
    boxGeometry args=[0.15, 0.025, 0.025]
    position=[0, 0.44, 0.24]
    farve: #B8860B

Skuffe 3 (nederst):
  boxGeometry args=[1.05, 0.18, 0.02]
  position=[0, 0.21, 0.225]
  farve: #6B4226

  Greb 3:
    boxGeometry args=[0.15, 0.025, 0.025]
    position=[0, 0.21, 0.24]
    farve: #B8860B

Sokkel:
  boxGeometry args=[1.2, 0.06, 0.45]
  position=[0, 0.03, 0]
  farve: #3E2A1A
```

**Test efter implementering:**
- [ ] Kommoden har tre synlige skuffer med messinggreb.
- [ ] Default-rotation vender den fladt mod højre væg.
- [ ] Proportionerne er fornuftige (bredere end natbordet, lavere end bogreol).
- [ ] Kan flyttes og roteres.

---

### B5: Soveværelse-tæppe

> **movableType:** `bedroom_rug`
> **Default position:** `(-2.5, 0.005, -0.5)` — foran sengen
> **Default Y:** `0.005`
> **Reset-default:** `{ x: -2.5, z: -0.5, rot: 0 }`

Gulvtæppe i bordeaux med dobbelt-ramme-mønster.

**Geometri:**

```
Tæppe:
  planeGeometry args=[1.8, 2.4]
  rotation=[-Math.PI / 2, 0, 0]
  position=[0, 0, 0]

Canvas-tekstur (opret i useMemo):
  Canvas størrelse: 180 × 240 px
  1. Fyld hele canvas med #6B1C23 (bordeaux)
  2. Tegn ydre kantramme (5px ind) med #3E1A1A (mørk bordeaux), lineWidth 3
  3. Tegn indre ramme (14px ind) med #8B3A3A (lysere bordeaux), lineWidth 2
  4. Center forbliver #6B1C23

  Sæt texture.colorSpace = THREE.SRGBColorSpace
  roughness={1.0}
```

Se stuens `rug`-implementation for CanvasTexture-mønster.

**Test efter implementering:**
- [ ] Tæppet ligger foran sengen, ingen z-fighting med gulvet.
- [ ] Bordeaux-farve med dobbelt ramme-mønster.
- [ ] Tydelig visuel forskel fra stuens og køkkenets tæpper.
- [ ] Kan flyttes og roteres.

---

### B6: Billedramme

> **movableType:** `bedroom_frame`
> **Default position:** `(-5.4, 2.0, -2.0)` — venstre væg, over sengen
> **Default Y:** `2.0`
> **Reset-default:** `{ x: -5.4, z: -2.0, rot: Math.PI / 2 }`

Vægmonteret billedramme med simpelt landskabsmotiv.

**Geometri:**

```
Ramme:
  boxGeometry args=[0.8, 0.6, 0.04]
  position=[0, 0, 0]
  farve: #3E2A1A

Lærred:
  boxGeometry args=[0.65, 0.45, 0.01]
  position=[0, 0, 0.02]

Canvas-tekstur (opret i useMemo):
  Canvas størrelse: 130 × 90 px
  1. Øverste tredjedel (0-30px): fyld med #5B8FB9 (himmelblå)
  2. Tynd stribe (30-38px): fyld med #E8A948 (solnedgangs-orange)
  3. Nederste del (38-90px): fyld med #2C5F7C (havblå, mørkere)

  Sæt texture.colorSpace = THREE.SRGBColorSpace
```

**Test efter implementering:**
- [ ] Rammen hænger på venstre væg (Y=2.0, rot=π/2).
- [ ] Mørk træramme med farvet "landskab" indeni.
- [ ] Kan flyttes inkl. højde via HUD.
- [ ] Nulstil sætter den tilbage over sengen.

---

## Persistence-opsummering

### Tilføj til Y_DEFAULTS

```typescript
kitchen_rug: 0.005,
kitchen_shelf: 2.2,
kitchen_lamp: 3.8,
kitchen_telescope: 0,
bedroom_lamp: 0.55,
bedroom_rug: 0.005,
bedroom_frame: 2.0,
```

Alle øvrige nye møbler har Y-default `0`.

### Tilføj til FURNITURE_RESET_DEFAULTS

```typescript
// Køkken
kitchen_stove:     { x: -2.0,  z: -4.0,  rot: 0 },
kitchen_sink:      { x: 2.0,   z: -4.0,  rot: 0 },
kitchen_chair:     { x: 0,     z: -1.5,  rot: Math.PI },
kitchen_shelf:     { x: 4.5,   z: -2.0,  rot: -Math.PI / 2 },
kitchen_rug:       { x: 0,     z: 0,     rot: 0 },
kitchen_lamp:      { x: 0,     z: -1.0,  rot: 0 },
kitchen_telescope: { x: 0,     z: -3.8,  rot: 0 },

// Soveværelse
bedroom_bed:        { x: -2.5, z: -2.5, rot: 0 },
bedroom_nightstand: { x: -4.2, z: -2.5, rot: 0 },
bedroom_lamp:       { x: -4.2, z: -2.5, rot: 0 },
bedroom_dresser:    { x: 4.0,  z: -3.0, rot: -Math.PI / 2 },
bedroom_rug:        { x: -2.5, z: -0.5, rot: 0 },
bedroom_frame:      { x: -5.4, z: -2.0, rot: Math.PI / 2 },
```

---

## Komplet implementeringsrækkefølge

| Fase | # | Møbel | movableType | Rum |
|------|---|-------|-------------|-----|
| A | 1 | Komfur | `kitchen_stove` | Køkken |
| A | 2 | Vask | `kitchen_sink` | Køkken |
| A | 3 | Stol | `kitchen_chair` | Køkken |
| A | 4 | Hængehylde | `kitchen_shelf` | Køkken |
| A | 5 | Tæppe | `kitchen_rug` | Køkken |
| A | 6 | Loftslampe | `kitchen_lamp` | Køkken |
| A | 7 | Kikkert | `kitchen_telescope` | Køkken |
| B | 1 | Seng | `bedroom_bed` | Soveværelse |
| B | 2 | Natbord | `bedroom_nightstand` | Soveværelse |
| B | 3 | Natbordslampe | `bedroom_lamp` | Soveværelse |
| B | 4 | Kommode | `bedroom_dresser` | Soveværelse |
| B | 5 | Tæppe | `bedroom_rug` | Soveværelse |
| B | 6 | Billedramme | `bedroom_frame` | Soveværelse |

**For hvert møbel:**
1. Opret/tilføj komponenten med korrekt geometri og materialer.
2. Tag med `userData={{ isMovable: true, movableType: '...' }}`.
3. Tilføj Y-default og reset-default til `cabinFurniturePersistence.ts`.
4. Tilføj til rummets `rebuildMovableList()`.
5. Test: synlig? flytbar? nulstil virker? save/load bevarer position?
