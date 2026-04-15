# Implementeringsguide — SkyClouds Color-allokering fix

Denne guide retter et performance-problem i `SkyClouds.tsx` hvor 3-4 nye `THREE.Color`-objekter oprettes hvert eneste frame (60 gange/sek = ~240 objekter/sek), som derefter skal garbage-collectes. På mobile enheder kan dette forårsage GC-pauser og frame drops.

**Løsningen:** Brug pre-allokerede scratch-objekter der genbruges hvert frame i stedet for at oprette nye.

Ingen nye dependencies. Ingen ændringer i `package.json`.

---

## Trin 1: Tilføj scratch-refs

**Fil:** `src/three/effects/SkyClouds.tsx`

**Find dette (ca. linje 102):**

```typescript
  const rootRef = useRef<Group>(null);
  const scratchColor = useRef(new Color());
```

**Erstat med:**

```typescript
  const rootRef = useRef<Group>(null);
  const scratchColor = useRef(new Color());
  const scratchA = useRef(new Color());
  const scratchB = useRef(new Color());
  const scratchC = useRef(new Color());
```

---

## Trin 2: Erstat Color-allokeringer i useFrame

**I samme fil, find dette inde i `useFrame()`-callback'et (ca. linje 197-200):**

```typescript
    const baseLight = scratchColor.current.lerpColors(
      new Color(cur.lightColor),
      new Color(nxt.lightColor),
      lerpT,
    );
    const cCol = baseLight.clone().lerp(new Color(0xffffff), 0.7);
```

**Erstat med:**

```typescript
    scratchA.current.set(cur.lightColor);
    scratchB.current.set(nxt.lightColor);
    const baseLight = scratchColor.current.lerpColors(scratchA.current, scratchB.current, lerpT);
    const cCol = scratchC.current.copy(baseLight).lerp(scratchC.current.set(0xffffff), 0.7);
```

**STOP — der er en subtilitet i linje 2 af erstatningen ovenfor.** `scratchC` bruges både som target for `.copy()` OG som argument til `.lerp()` i samme kæde. Det virker fordi `.copy()` returnerer `scratchC` selv, og `.lerp()` blender `scratchC` (som nu indeholder `baseLight`) med den nye værdi. Men `.set(0xffffff)` inde i `.lerp()` overskriver `scratchC` INDEN lerp'en læser den — det er forkert.

**Brug denne korrekte version i stedet:**

```typescript
    scratchA.current.set(cur.lightColor);
    scratchB.current.set(nxt.lightColor);
    const baseLight = scratchColor.current.lerpColors(scratchA.current, scratchB.current, lerpT);
    scratchC.current.copy(baseLight);
    scratchC.current.lerp(scratchA.current.set(0xffffff), 0.7);
    const cCol = scratchC.current;
```

**Forklaring af den korrekte version:**
1. `scratchA` og `scratchB` sættes til dag/nat-farver (genbruger eksisterende objekter)
2. `scratchColor` beregner lerp mellem dem (som før)
3. `scratchC` kopierer resultatet fra `baseLight`
4. `scratchC` lerp'es mod hvid — vi genbruger `scratchA` til hvid-farven (den behøves ikke længere)
5. `cCol` peger nu på `scratchC.current` — ingen `clone()`, ingen `new Color()`

**Vigtigt:** `cCol` er nu en reference til `scratchC.current`, ikke en kopi. Det er OK fordi den kun bruges til at farve skyer i den efterfølgende `for`-loop inden frame'et slutter, og `scratchC` ændres ikke igen inden da.

---

## Samlet resultat

Før rettelsen: **3-4 nye Color-objekter pr. frame** = ~240/sek = konstant GC-pres.

Efter rettelsen: **0 nye Color-objekter pr. frame** — alle 4 scratch-refs oprettes én gang ved mount og genbruges.

---

## Tjekliste efter implementering

- [ ] Kør `npx tsc --noEmit` — skal give 0 fejl
- [ ] Start spillet og observer skyerne: de skal stadig skifte farve korrekt ved dag/nat-overgang
- [ ] Observer skyerne under storm/regn: de skal stadig blive mørkere (`multiplyScalar(0.4)`)
- [ ] Skift lokation (f.eks. pier → grotte → tropisk ø) og verificer at skyer vises/skjules korrekt
- [ ] Test på mobil/tablet hvis muligt — frame rate bør være mere stabil (færre GC-pauser)
- [ ] Verificer at skyernes farve ikke "blinker" eller skifter abrupt
