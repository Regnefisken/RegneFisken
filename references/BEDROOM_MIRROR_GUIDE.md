# Soveværelse-spejl — Implementeringsguide for Composer

> **Kontekst:** Alt øvrigt møbel- og butikssystem er allerede implementeret. Denne guide dækker KUN tilføjelsen af ét nyt møbel: et gulvstående spejl til soveværelset. Guiden dækker 3D-geometri, butiks-registrering, persistence-defaults og betinget rendering.
>
> **Implementér hele spejlet som én samlet opgave.** Test derefter alle punkter.

---

## Møbelbeskrivelse

Et klassisk, fritstående gulvspejl ("chevalet-spejl") i mørkt træ med messingdetaljer. Spejlet står på to spredte ben med en tværbjælke, og selve spejlfladen er let vippet bagud. Det passer stilmæssigt til soveværelsets øvrige møbler (seng, natbord, kommode) med mørkt træ, messing-accenter og en varm, rustik tone.

Højde ca. 1.7 enheder (i øjenhøjde for en 1.8-enhed person). Bredde ca. 0.7. Dybde (fodaftryk) ca. 0.45.

---

## Geometri

> **movableType:** `bedroom_mirror`
> **Default position:** `(4.0, 0, -1.0)` — højre side af rummet, mellem kommode og sengeområde
> **Default Y:** `0`
> **Reset-default:** `{ x: 4.0, z: -1.0, rot: -Math.PI / 2 }`

Alle positioner relative til gruppens (0, 0, 0):

```
── RAMME (ydre træramme omkring spejlet) ──

Ramme:
  boxGeometry args=[0.7, 1.3, 0.05]
  position=[0, 1.05, 0]
  farve: #3E2A1A (meget mørk træ)

── SPEJLFLADE (indeni rammen) ──

Spejl-glas:
  boxGeometry args=[0.56, 1.16, 0.01]
  position=[0, 1.05, 0.025]
  meshStandardMaterial
    color="#B8C8D8"
    roughness={0.05}
    metalness={0.9}
    envMapIntensity={0.6}

  NB: Lav roughness + høj metalness giver en reflektiv/spejl-lignende effekt
  uden reel environment map. Farven er en kølig sølv-blågrå der
  visuelt ligner et spejl i den varme hytte-belysning.

── DEKORATIV MESSING-BORT (top og bund af rammen) ──

Top-ornament:
  boxGeometry args=[0.62, 0.04, 0.06]
  position=[0, 1.72, 0]
  farve: #B8860B (messing)

Bund-ornament:
  boxGeometry args=[0.62, 0.04, 0.06]
  position=[0, 0.38, 0]
  farve: #B8860B (messing)

── STATIV (to ben + tværbjælke) ──

Venstre ben:
  boxGeometry args=[0.06, 0.38, 0.4]
  position=[-0.28, 0.19, 0]
  farve: #5C4033 (mørkt træ)

Højre ben:
  boxGeometry args=[0.06, 0.38, 0.4]
  position=[0.28, 0.19, 0]
  farve: #5C4033 (mørkt træ)

Tværbjælke (forbinder de to ben):
  boxGeometry args=[0.50, 0.04, 0.04]
  position=[0, 0.12, 0]
  farve: #5C4033 (mørkt træ)

── FØDDER (messing-kapper på benenes ender, front og bag) ──

Venstre fod front:
  boxGeometry args=[0.07, 0.04, 0.06]
  position=[-0.28, 0.02, 0.17]
  farve: #B8860B (messing)

Venstre fod bag:
  boxGeometry args=[0.07, 0.04, 0.06]
  position=[-0.28, 0.02, -0.17]
  farve: #B8860B (messing)

Højre fod front:
  boxGeometry args=[0.07, 0.04, 0.06]
  position=[0.28, 0.02, 0.17]
  farve: #B8860B (messing)

Højre fod bag:
  boxGeometry args=[0.07, 0.04, 0.06]
  position=[0.28, 0.02, -0.17]
  farve: #B8860B (messing)
```

### userData-krav

```tsx
<group
  ref={refCallback}
  userData={{ isMovable: true, movableType: 'bedroom_mirror' }}
  position={[4.0, 0, -1.0]}
  rotation={[0, -Math.PI / 2, 0]}
>
  {/* al geometri relativt til (0,0,0) */}
</group>
```

### Materiale-oversigt

| Del | Farve | Roughness | Metalness | Note |
|-----|-------|-----------|-----------|------|
| Ramme | `#3E2A1A` | 0.85 | 0 | Meget mørkt træ (som billedramme + sokler) |
| Spejl-glas | `#B8C8D8` | 0.05 | 0.9 | Kølig sølv, simulerer refleksion |
| Messing-dele | `#B8860B` | 0.3 | 0.6 | Identisk med alle andre messing-greb |
| Ben + tværbjælke | `#5C4033` | 0.85 | 0 | Mørkt træ (som sengekrop, natbordskrop) |

---

## Butiks-registrering

Tilføj til `FURNITURE_SHOP_ITEMS` i `src/data/furnitureShopItems.ts`:

```typescript
{
  id: 'bedroom_mirror',
  name: 'Gulvspejl',
  emoji: '🪞',
  description: 'Klassisk stående spejl i mørkt træ med messing',
  room: 'bedroom',
  price: 700,
},
```

Prisen (700 coins) placerer det på niveau med loftslampen og natbordslampen — et mellemklasse-møbel.

---

## Persistence-registrering

### Tilføj til `Y_DEFAULTS` i `cabinFurniturePersistence.ts`:

```typescript
bedroom_mirror: 0,
```

### Tilføj til `FURNITURE_RESET_DEFAULTS`:

```typescript
bedroom_mirror: { x: 4.0, z: -1.0, rot: -Math.PI / 2 },
```

---

## Betinget rendering i FishingCabin.tsx

Følg det eksisterende mønster for købte møbler:

```tsx
const hasMirror = unlockedFurniture.includes('bedroom_mirror')
const isMirrorVisible = hasMirror && !hiddenFurniture.includes('bedroom_mirror')

{isMirrorVisible && (
  <group
    ref={mirrorRefCallback}
    userData={{ isMovable: true, movableType: 'bedroom_mirror' }}
    position={[4.0, 0, -1.0]}
    rotation={[0, -Math.PI / 2, 0]}
  >
    {/* geometri her */}
  </group>
)}
```

Tilføj `hasMirror` (eller den relevante variabel) til `rebuildMovableList()`'s `useLayoutEffect`-afhængigheder.

---

## Placeringsrationale

Default-position `(4.0, 0, -1.0)` med rotation `-Math.PI / 2` placerer spejlet:

- Op ad **højre væg** (x=4.0, tæt på væggens x≈5.4)
- Mellem kommoden (x=4.0, z=-3.0) og det åbne rum (z=0 og frem)
- Vendt **ind mod rummet** (spejlfladen peger mod venstre/mod sengen)
- Visuelt danner det et naturligt arrangement: kommode → spejl → åbent gulv

Spilleren kan naturligvis flytte det frit i furniture mode.

---

## Test efter implementering

- [ ] Spejlet har synlig mørk træramme med sølvblå spejlflade indeni
- [ ] Spejlfladen ser reflektiv/metallisk ud (lav roughness, høj metalness)
- [ ] Messing-ornamenter synlige i top og bund af rammen
- [ ] To stativ-ben med tværbjælke og fire messing-fødder er synlige
- [ ] Proportionerne passer i rummet (spejlet er ca. i øjenhøjde, smallere end kommoden)
- [ ] Default-position er ved højre væg, vendt ind mod rummet
- [ ] Spejlet er IKKE synligt før det er købt i butikken
- [ ] Køb i butikken (🪞 Gulvspejl, 700 coins, under Soveværelse-fanen) fungerer
- [ ] Efter køb → besøg hytten → spejlet er synligt på default-position
- [ ] Kan vælges, flyttes og roteres i furniture mode
- [ ] Kan skjules via furniture mode skjul-funktion
- [ ] Nulstil placerer det ved x=4.0, z=-1.0, rot=-π/2, Y=0
- [ ] Game save/load bevarer unlock- og positions-data
