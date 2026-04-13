# Implementeringsplan: 10 unikke junk-modeller

## Overblik

Alle 10 junk-items renderes i dag som den generiske fallback-model (brun støvle — 2 bokse). Hver item har allerede en unik `visual`-nøgle i `fish.ts`, men ingen matchende branch i rendereren. Denne plan beskriver præcis, hvordan man tilføjer 10 nye visuelle modeller i samme low-poly `flatShading`-stil som `teddy`-modellen (Våd Bamse).

### Reference: `teddy`-modellen (Våd Bamse)

Bamse-modellen er benchmark for polygon-budget og stil:

- **10 meshes** total (8 sfærer til krop + 2 øjne)
- **Geometri-segmenter**: `sphereGeometry(r, 8, 6)` for større dele, `(r, 6, 4)` for små
- **Ca. 400–500 trekanter** i alt
- **Material**: `meshStandardMaterial` med `roughness: 0.85`, `flatShading: true`
- **Skala**: `scale={0.5}` på parent-group
- **Ingen animations-logik internt** — animation håndteres af den fælles `useFrame` i `JunkCatchModel`

### Nøgleregler for alle nye modeller

1. **Max 4-10 meshes** pr. model — brug primitiver (sphere, cylinder, box, torus)
2. **Altid `flatShading`** — giver det karakteristiske low-poly look
3. **Altid `castShadow`** på synlige meshes
4. **Geometri-segmenter holdes lavt**: sfærer (6-8, 4-6), cylindre (6-8), bokse standard
5. **Brug `bodyColor` fra data** som primær farve, med hardcodede accent-farver for detaljer
6. **Ca. 400–500 trekanter** pr. model (match teddy)
7. **Skala**: Hver models parent-group skaleres til ca. 0.4–0.6 (justeres efter item-størrelse)

---

## Fil der skal ændres

**Primær fil**: `src/three/models/junkAndTreasureModels.tsx`

Alle 10 nye modeller tilføjes som `if (v === '...')` branches i den eksisterende `JunkCatchModel`-funktion, **før** fallback-returneringen (linje 245–256). Ingen andre filer skal ændres — data-laget (`fish.ts`) og routing (`HookedCatchModel.tsx`) er allerede korrekt sat op.

### Indsættelsespunkt

Tilføj alle nye branches efter den eksisterende `if (v === 'havtang')` blok (linje 241-243) og før fallback `return` (linje 245). Rækkefølgen er ligegyldig, men hold dem konsistent.

---

## Model 1: Ødelagt Undervandskamera (`undervandskamera`)

**Visual-nøgle**: `undervandskamera`
**Data-farve**: `0x222222` (næsten sort)
**Konceptet**: Et kasseformet kamerahus med cylindrisk objektiv og en lille blitz-boks ovenfor. En slap rem (tynd cylinder) hænger fra siden.

```tsx
if (v === 'undervandskamera') {
  return (
    <group ref={groupRef} scale={0.5}>
      {/* Kamerahus */}
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.45, 0.35]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.2} flatShading />
      </mesh>
      {/* Objektiv — cylinder der stikker ud mod +Z */}
      <mesh castShadow position={[0.05, -0.02, 0.25]}>
        <cylinderGeometry args={[0.14, 0.16, 0.2, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.4} flatShading />
      </mesh>
      {/* Linse-glas — let transparent forrest */}
      <mesh castShadow position={[0.05, -0.02, 0.36]}>
        <cylinderGeometry args={[0.12, 0.12, 0.03, 8]} />
        <meshStandardMaterial color="#4466aa" roughness={0.1} metalness={0.6} transparent opacity={0.5} flatShading />
      </mesh>
      {/* Blitz/flash-modul ovenover */}
      <mesh castShadow position={[0.18, 0.3, 0.0]}>
        <boxGeometry args={[0.18, 0.1, 0.12]} />
        <meshStandardMaterial color="#333333" roughness={0.6} metalness={0.3} flatShading />
      </mesh>
      {/* Rem-øje (lille ring) */}
      <mesh castShadow position={[-0.35, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.06, 0.02, 4, 6]} />
        <meshStandardMaterial color="#555555" roughness={0.8} metalness={0.3} flatShading />
      </mesh>
      {/* Hængende rem-stump */}
      <mesh castShadow position={[-0.35, -0.08, 0]} rotation={[0.3, 0, 0.1]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 4]} />
        <meshStandardMaterial color="#3a3a2a" roughness={0.9} flatShading />
      </mesh>
      {/* Revne / skade — skrå boks der bryder overfladen */}
      <mesh castShadow position={[-0.1, 0.1, 0.18]} rotation={[0, 0, 0.7]}>
        <boxGeometry args={[0.25, 0.03, 0.02]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}
```

**Meshes**: 7 | **Silhuet**: Umiskendeligt kamera med linse og rem

---

## Model 2: Ødelagt Ispilk (`ispilk`)

**Visual-nøgle**: `ispilk`
**Data-farve**: `0x8B7355` (brun-beige)
**Konceptet**: En kort, knækket fiskestang specifikt til isfiskeri. Et træhåndtag, en lille snelleholder og en knækket stang med en tynd line der hænger.

```tsx
if (v === 'ispilk') {
  return (
    <group ref={groupRef} scale={0.5}>
      {/* Håndtag — kort, tykt */}
      <mesh castShadow position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.35, 6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.85} flatShading />
      </mesh>
      {/* Snelle-holder — lille cylinder på tværs */}
      <mesh castShadow position={[0.12, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 0.08, 6]} />
        <meshStandardMaterial color="#666655" roughness={0.7} metalness={0.3} flatShading />
      </mesh>
      {/* Snelle-skive */}
      <mesh castShadow position={[0.18, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 8]} />
        <meshStandardMaterial color="#888877" roughness={0.6} metalness={0.4} flatShading />
      </mesh>
      {/* Stang — nedre del, intakt */}
      <mesh castShadow position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.5, 5]} />
        <meshStandardMaterial color="#6a5a40" roughness={0.8} flatShading />
      </mesh>
      {/* Stang — øvre del, knækket vinkel */}
      <mesh castShadow position={[0.08, 0.5, 0.05]} rotation={[0.2, 0, 0.4]}>
        <cylinderGeometry args={[0.02, 0.03, 0.35, 5]} />
        <meshStandardMaterial color="#6a5a40" roughness={0.8} flatShading />
      </mesh>
      {/* Hængende line fra knækket */}
      <mesh castShadow position={[0.18, 0.35, 0.1]} rotation={[0.5, 0, 0.2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.4, 3]} />
        <meshStandardMaterial color="#cccccc" roughness={0.3} metalness={0.1} flatShading />
      </mesh>
    </group>
  );
}
```

**Meshes**: 6 | **Silhuet**: Tydelig mini-fiskestang med knæk

---

## Model 3: Solbrillestel (`solbrille`)

**Visual-nøgle**: `solbrille`
**Data-farve**: `0xC8B080` (sand/beige)
**Konceptet**: Et par solbriller uden glas — to torus-ringe (brillestellet), en bro imellem, og to stænger bagud. Ét af "glassene" mangler (kun torus-rammen), det andet har et sprukket glas.

```tsx
if (v === 'solbrille') {
  return (
    <group ref={groupRef} scale={0.55} rotation={[0.3, 0, 0]}>
      {/* Venstre glas-ramme */}
      <mesh castShadow position={[-0.2, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.03, 4, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} flatShading />
      </mesh>
      {/* Højre glas-ramme */}
      <mesh castShadow position={[0.2, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.03, 4, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} flatShading />
      </mesh>
      {/* Sprukket glas i venstre ramme */}
      <mesh castShadow position={[-0.2, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 6]} />
        <meshStandardMaterial color="#8899aa" roughness={0.1} metalness={0.3} transparent opacity={0.3} flatShading side={DoubleSide} />
      </mesh>
      {/* Bro mellem glas */}
      <mesh castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.12, 4]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} flatShading />
      </mesh>
      {/* Venstre stang */}
      <mesh castShadow position={[-0.4, 0.02, -0.25]} rotation={[Math.PI / 2.3, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.015, 0.5, 4]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} flatShading />
      </mesh>
      {/* Højre stang — knækket (kortere) */}
      <mesh castShadow position={[0.4, 0.02, -0.15]} rotation={[Math.PI / 2.5, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.015, 0.3, 4]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} flatShading />
      </mesh>
    </group>
  );
}
```

**Meshes**: 6 | **Silhuet**: Klart genkendelige solbriller set lidt fra oven. Kræver `DoubleSide` import (allerede importeret i filen) og `circleGeometry` (kræver import: `import { CircleGeometry } from 'three'` — alternativt kan den bruges som JSX `<circleGeometry>` direkte da R3F eksponerer den).

---

## Model 4: Rustent Sværd (`rustent_sværd`)

**Visual-nøgle**: `rustent_sværd`
**Data-farve**: `0x8B4513` (saddle brown / rust)
**Konceptet**: Et klart sværd med lang flad klinge, parerstang (crossguard), greb og knop. Klingen er buet/skadet for at vise rustangreb.

```tsx
if (v === 'rustent_sværd') {
  return (
    <group ref={groupRef} scale={0.45} rotation={[0, 0, 0.15]}>
      {/* Klinge — lang flad boks, let skadet */}
      <mesh castShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[0.12, 1.0, 0.04]} />
        <meshStandardMaterial color={bodyColor} roughness={0.85} metalness={0.35} flatShading />
      </mesh>
      {/* Klinge-spids — tilspidset */}
      <mesh castShadow position={[0, 1.1, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.08, 0.08, 0.035]} />
        <meshStandardMaterial color={bodyColor} roughness={0.85} metalness={0.35} flatShading />
      </mesh>
      {/* Rust-plet 1 — mørk accent på klingen */}
      <mesh castShadow position={[0.02, 0.7, 0.025]}>
        <boxGeometry args={[0.06, 0.15, 0.01]} />
        <meshStandardMaterial color="#5a2a0a" roughness={0.95} flatShading />
      </mesh>
      {/* Rust-plet 2 */}
      <mesh castShadow position={[-0.03, 0.35, 0.025]}>
        <boxGeometry args={[0.05, 0.1, 0.01]} />
        <meshStandardMaterial color="#4a1a00" roughness={0.95} flatShading />
      </mesh>
      {/* Parerstang (crossguard) */}
      <mesh castShadow position={[0, 0.0, 0]}>
        <boxGeometry args={[0.45, 0.07, 0.07]} />
        <meshStandardMaterial color="#5c4033" roughness={0.75} metalness={0.25} flatShading />
      </mesh>
      {/* Greb — cylinder */}
      <mesh castShadow position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.35, 6]} />
        <meshStandardMaterial color="#3d2817" roughness={0.9} flatShading />
      </mesh>
      {/* Knop (pommel) */}
      <mesh castShadow position={[0, -0.45, 0]}>
        <sphereGeometry args={[0.07, 6, 4]} />
        <meshStandardMaterial color="#5c4033" roughness={0.75} metalness={0.25} flatShading />
      </mesh>
    </group>
  );
}
```

**Meshes**: 7 | **Silhuet**: Markant sværd-silhuet med crossguard

---

## Model 5: Rusten Dykkermaske (`dykkermaske`)

**Visual-nøgle**: `dykkermaske`
**Data-farve**: `0x4A6A5A` (grønlig mørkegrå)
**Konceptet**: Klassisk oval dykkermaske med stort glas (halv-transparent), gummiramme og en snorkelstump der stikker op fra siden. Remstumper hænger på begge sider.

```tsx
if (v === 'dykkermaske') {
  return (
    <group ref={groupRef} scale={0.5}>
      {/* Maske-ramme — bred oval */}
      <mesh castShadow scale={[1.1, 0.8, 0.5]}>
        <sphereGeometry args={[0.35, 8, 6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.85} flatShading />
      </mesh>
      {/* Glas-visir — transparent, let indsat mod +Z */}
      <mesh castShadow position={[0, 0.02, 0.16]} scale={[0.85, 0.6, 0.15]}>
        <sphereGeometry args={[0.3, 8, 6]} />
        <meshStandardMaterial color="#5588aa" roughness={0.05} metalness={0.3} transparent opacity={0.35} flatShading />
      </mesh>
      {/* Næse-bule — lille bump i midten */}
      <mesh castShadow position={[0, -0.08, 0.2]}>
        <sphereGeometry args={[0.06, 6, 4]} />
        <meshStandardMaterial color={bodyColor} roughness={0.85} flatShading />
      </mesh>
      {/* Snorkel-stump — cylinder der stikker op til højre */}
      <mesh castShadow position={[0.3, 0.2, -0.05]} rotation={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.04, 0.05, 0.45, 6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.85} flatShading />
      </mesh>
      {/* Snorkel-top — knækket/åben */}
      <mesh castShadow position={[0.35, 0.45, -0.05]}>
        <cylinderGeometry args={[0.055, 0.04, 0.06, 6]} />
        <meshStandardMaterial color="#3a5a4a" roughness={0.8} flatShading />
      </mesh>
      {/* Rem-stump venstre */}
      <mesh castShadow position={[-0.38, 0.0, -0.08]} rotation={[0, 0.5, 0]}>
        <boxGeometry args={[0.15, 0.06, 0.03]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} flatShading />
      </mesh>
      {/* Rem-stump højre */}
      <mesh castShadow position={[0.2, 0.0, -0.14]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[0.12, 0.06, 0.03]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}
```

**Meshes**: 7 | **Silhuet**: Dykkermaske med snorkel — meget genkendelig

---

## Model 6: Piratflagstump (`piratflag`)

**Visual-nøgle**: `piratflag`
**Data-farve**: `0x1A1A1A` (næsten sort)
**Konceptet**: En kort træstang med en flænset flagstump. Flaget har et simpelt kranium (sfære + 2 krydsknogler) i hvidt som accent. Flaget er skævt/iturevet (asymmetrisk boks).

```tsx
if (v === 'piratflag') {
  return (
    <group ref={groupRef} scale={0.5}>
      {/* Flagstang — tynd lodret cylinder */}
      <mesh castShadow position={[-0.2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 1.2, 5]} />
        <meshStandardMaterial color="#5a4030" roughness={0.9} flatShading />
      </mesh>
      {/* Stang-spids */}
      <mesh castShadow position={[-0.2, 0.65, 0]}>
        <sphereGeometry args={[0.045, 4, 3]} />
        <meshStandardMaterial color="#5a4030" roughness={0.85} flatShading />
      </mesh>
      {/* Flag — flad, revet/skæv boks */}
      <mesh castShadow position={[0.1, 0.3, 0]} rotation={[0, 0, -0.05]}>
        <boxGeometry args={[0.55, 0.38, 0.02]} />
        <meshStandardMaterial color={bodyColor} roughness={0.95} side={DoubleSide} flatShading />
      </mesh>
      {/* Revet kant — mindre boks i vinkel for at illudere rift */}
      <mesh castShadow position={[0.42, 0.2, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.12, 0.15, 0.02]} />
        <meshStandardMaterial color={bodyColor} roughness={0.95} side={DoubleSide} flatShading />
      </mesh>
      {/* Kranium — hvid sfære */}
      <mesh castShadow position={[0.08, 0.34, 0.015]}>
        <sphereGeometry args={[0.07, 6, 4]} />
        <meshStandardMaterial color="#dddddd" roughness={0.8} flatShading />
      </mesh>
      {/* Kryds-knogle 1 */}
      <mesh castShadow position={[0.08, 0.22, 0.02]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.015, 0.015, 0.2, 4]} />
        <meshStandardMaterial color="#dddddd" roughness={0.8} flatShading />
      </mesh>
      {/* Kryds-knogle 2 */}
      <mesh castShadow position={[0.08, 0.22, 0.02]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.015, 0.015, 0.2, 4]} />
        <meshStandardMaterial color="#dddddd" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}
```

**Meshes**: 7 | **Silhuet**: Klart piratflag med dødningehoved

---

## Model 7: Falmet Søkort (`vandkort`)

**Visual-nøgle**: `vandkort`
**Data-farve**: `0xD4C4A0` (pergament-gul)
**Konceptet**: Et oprullet/delvist åbent søkort. Hovedkroppen er en flad boks (kortet), med let oprullede cylindriske ender. Et lille rødt kryds (X markerer stedet) som accent.

```tsx
if (v === 'vandkort') {
  return (
    <group ref={groupRef} scale={0.55} rotation={[0.4, 0, 0.1]}>
      {/* Kort-krop — flad rektangel */}
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.5, 0.02]} />
        <meshStandardMaterial color={bodyColor} roughness={0.92} side={DoubleSide} flatShading />
      </mesh>
      {/* Oprullet top-kant */}
      <mesh castShadow position={[0, 0.26, -0.04]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 6]} />
        <meshStandardMaterial color="#c4b490" roughness={0.88} flatShading />
      </mesh>
      {/* Oprullet bund-kant */}
      <mesh castShadow position={[0, -0.26, 0.03]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.65, 6]} />
        <meshStandardMaterial color="#b4a480" roughness={0.88} flatShading />
      </mesh>
      {/* Rødt X — linje 1 */}
      <mesh castShadow position={[0.1, -0.05, 0.015]} rotation={[0, 0, 0.78]}>
        <boxGeometry args={[0.12, 0.02, 0.01]} />
        <meshStandardMaterial color="#aa2222" roughness={0.8} flatShading />
      </mesh>
      {/* Rødt X — linje 2 */}
      <mesh castShadow position={[0.1, -0.05, 0.015]} rotation={[0, 0, -0.78]}>
        <boxGeometry args={[0.12, 0.02, 0.01]} />
        <meshStandardMaterial color="#aa2222" roughness={0.8} flatShading />
      </mesh>
      {/* Tegnet kystlinje — tynd boks som streg */}
      <mesh castShadow position={[-0.12, 0.08, 0.015]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.3, 0.015, 0.008]} />
        <meshStandardMaterial color="#7a6a50" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}
```

**Meshes**: 6 | **Silhuet**: Oprullet pergament med synligt X-marks-the-spot

---

## Model 8: Flagermusknogle (`flagermus_knogle`)

**Visual-nøgle**: `flagermus_knogle`
**Data-farve**: `0xF0E8D8` (knoglehvid)
**Konceptet**: Et lille skelet-fragment af en flagermusvinge. En central "rygknogle" (cylinder) med 3-4 tynde vinge-knogler der spreder ud til den ene side, forbundet med sfærer ved leddene.

```tsx
if (v === 'flagermus_knogle') {
  return (
    <group ref={groupRef} scale={0.55}>
      {/* Central ryg-knogle */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.03, 0.5, 5]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
      </mesh>
      {/* Led-sfære top */}
      <mesh castShadow position={[0, 0.27, 0]}>
        <sphereGeometry args={[0.05, 6, 4]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
      </mesh>
      {/* Vinge-knogle 1 — lang, opad-ud */}
      <mesh castShadow position={[0.25, 0.38, 0]} rotation={[0, 0, -0.9]}>
        <cylinderGeometry args={[0.02, 0.015, 0.45, 4]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
      </mesh>
      {/* Vinge-knogle 2 — medium, udad */}
      <mesh castShadow position={[0.3, 0.2, 0]} rotation={[0, 0, -1.2]}>
        <cylinderGeometry args={[0.02, 0.012, 0.4, 4]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
      </mesh>
      {/* Vinge-knogle 3 — kort, nedad-ud */}
      <mesh castShadow position={[0.22, 0.05, 0]} rotation={[0, 0, -1.5]}>
        <cylinderGeometry args={[0.018, 0.01, 0.3, 4]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
      </mesh>
      {/* Led-sfære bund */}
      <mesh castShadow position={[0, -0.27, 0]}>
        <sphereGeometry args={[0.04, 6, 4]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
      </mesh>
      {/* Tynd membran-rest mellem knogle 1 og 2 (flad trekant-ish boks) */}
      <mesh castShadow position={[0.35, 0.3, 0]} rotation={[0, 0, -1.05]} scale={[1, 1, 0.3]}>
        <boxGeometry args={[0.2, 0.15, 0.01]} />
        <meshStandardMaterial color="#d8d0c0" roughness={0.9} transparent opacity={0.5} side={DoubleSide} flatShading />
      </mesh>
    </group>
  );
}
```

**Meshes**: 7 | **Silhuet**: Tydeligt knoglefragment med "vinger" — unik og uhyggelig

---

## Model 9: Flosset Reb (`frossent_tov`)

**Visual-nøgle**: `frossent_tov`
**Data-farve**: `0xDDDDEE` (lys grå/is-hvid)
**Konceptet**: Et oprullet, frosset tov. Bruger `TubeGeometry` med kurver (samme teknik som `havtang`) for et organisk, snoet udseende. 2-3 snoninger med is-agtig overflademateriale.

> **Note**: Denne model har brug for en separat komponent-funktion (ligesom `HavtangJunk`) fordi den bruger `useMemo` til TubeGeometry.

```tsx
// Tilføj OVER JunkCatchModel-funktionen (ved siden af HavtangJunk):

function FlossettRebJunk({ bodyColor, bucketIdle }: { bodyColor: string; bucketIdle?: boolean }) {
  const groupRef = useRef<Group>(null);
  const geos = useMemo(() => {
    const curves: [Vector3, Vector3, Vector3][] = [
      // Kurve 1: hoved-snoning
      [new Vector3(-0.3, -0.4, 0), new Vector3(0.3, 0.0, 0.2), new Vector3(-0.2, 0.5, -0.1)],
      // Kurve 2: løs ende
      [new Vector3(-0.2, 0.5, -0.1), new Vector3(0.1, 0.7, 0.15), new Vector3(0.3, 0.6, -0.2)],
    ];
    return curves.map(
      ([start, ctrl, end]) =>
        new TubeGeometry(
          new QuadraticBezierCurve3(start, ctrl, end),
          10,
          0.06,
          5,
          false,
        ),
    );
  }, []);
  const D = bucketIdle ? 0.35 : 1;
  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.rotation.y += 0.008 * D;
    g.position.y = Math.sin(t * 1.2) * 0.08 * D;
  });
  return (
    <group ref={groupRef} scale={0.55}>
      {geos.map((geo, i) => (
        <mesh key={i} geometry={geo} castShadow>
          <meshStandardMaterial
            color={bodyColor}
            roughness={0.75}
            metalness={0.05}
            flatShading
          />
        </mesh>
      ))}
      {/* Flosset ende 1 — tynde tråde */}
      <mesh castShadow position={[-0.3, -0.42, 0.02]} rotation={[0.3, 0, 0.4]}>
        <cylinderGeometry args={[0.015, 0.005, 0.2, 3]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
      </mesh>
      <mesh castShadow position={[-0.28, -0.44, -0.03]} rotation={[-0.2, 0, 0.6]}>
        <cylinderGeometry args={[0.012, 0.004, 0.15, 3]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
      </mesh>
      {/* Flosset ende 2 */}
      <mesh castShadow position={[0.32, 0.58, -0.18]} rotation={[0.4, 0, -0.3]}>
        <cylinderGeometry args={[0.015, 0.005, 0.18, 3]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
      </mesh>
      {/* Is-krystaller — tiny accents */}
      <mesh castShadow position={[0.05, 0.15, 0.08]}>
        <octahedronGeometry args={[0.04, 0]} />
        <meshStandardMaterial color="#ccddee" roughness={0.1} metalness={0.4} flatShading transparent opacity={0.7} />
      </mesh>
    </group>
  );
}
```

Og i `JunkCatchModel`:
```tsx
if (v === 'frossent_tov') {
  return <FlossettRebJunk bodyColor={bodyColor} bucketIdle={bucketIdle} />;
}
```

**Meshes**: 6 (2 tubes + 3 tråde + 1 iskrystal) | **Silhuet**: Organisk snoet reb med frysende detaljer

---

## Model 10: Gammel Fakkel (`gammel_fakkel`)

**Visual-nøgle**: `gammel_fakkel`
**Data-farve**: `0x5A4030` (mørk brun)
**Konceptet**: Et træskaft med en stofomviklet brændskål i toppen. Svag orange emissive-glød i toppen for at antyde den var engang tændt. Sod-mærker (mørke accenter).

```tsx
if (v === 'gammel_fakkel') {
  return (
    <group ref={groupRef} scale={0.5}>
      {/* Træskaft */}
      <mesh castShadow position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.8, 6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.9} flatShading />
      </mesh>
      {/* Stof-omvikling ved toppen */}
      <mesh castShadow position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.08, 0.06, 0.15, 6]} />
        <meshStandardMaterial color="#4a3020" roughness={0.95} flatShading />
      </mesh>
      {/* Brændskål — konisk top */}
      <mesh castShadow position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.04, 0.1, 0.15, 6]} />
        <meshStandardMaterial color="#1a1008" roughness={0.95} flatShading />
      </mesh>
      {/* Sod/kul-rester i toppen */}
      <mesh castShadow position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.06, 6, 4]} />
        <meshStandardMaterial
          color="#221100"
          emissive="#ff4400"
          emissiveIntensity={0.15}
          roughness={0.95}
          flatShading
        />
      </mesh>
      {/* Sodt mærke på skaftet */}
      <mesh castShadow position={[0.04, 0.15, 0.05]}>
        <boxGeometry args={[0.04, 0.12, 0.01]} />
        <meshStandardMaterial color="#1a1008" roughness={0.95} flatShading />
      </mesh>
      {/* Træ-knast/gren-stump */}
      <mesh castShadow position={[0.07, -0.25, 0]} rotation={[0, 0, -0.7]}>
        <cylinderGeometry args={[0.02, 0.03, 0.1, 4]} />
        <meshStandardMaterial color="#4a3520" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}
```

**Meshes**: 6 | **Silhuet**: Klart genkendelig fakkel med svag orange glød

---

## Opsummering af ændringer

### Fil: `src/three/models/junkAndTreasureModels.tsx`

1. **Tilføj `FlossettRebJunk`** komponent-funktion **over** `JunkCatchModel` (ved siden af `HavtangJunk`), da den bruger `useMemo` + `TubeGeometry` til kurvede rør.

2. **Tilføj 10 nye `if`-branches** i `JunkCatchModel`, mellem `if (v === 'havtang')` (linje 241) og fallback-return (linje 245). Rækkefølge:

```
if (v === 'undervandskamera') { ... }
if (v === 'ispilk') { ... }
if (v === 'solbrille') { ... }
if (v === 'rustent_sværd') { ... }
if (v === 'dykkermaske') { ... }
if (v === 'piratflag') { ... }
if (v === 'vandkort') { ... }
if (v === 'flagermus_knogle') { ... }
if (v === 'frossent_tov') { return <FlossettRebJunk ... />; }
if (v === 'gammel_fakkel') { ... }
```

3. **Ingen import-ændringer nødvendige** — alle brugte Three.js-klasser (`DoubleSide`, `TubeGeometry`, `QuadraticBezierCurve3`, `Vector3`, `Group`, `Mesh`) er allerede importeret. `circleGeometry` bruges som JSX-tag via R3F og kræver ingen ekstra import.

4. **Ingen ændringer i andre filer** — `fish.ts` og `HookedCatchModel.tsx` er allerede korrekt opsat.

### Samlet polygon-budget

| Model | Meshes | Est. trekanter | Karakteristisk feature |
|---|---|---|---|
| Våd Bamse (reference) | 10 | ~450 | Sfærer med øjne |
| Undervandskamera | 7 | ~380 | Linse + rem |
| Ispilk | 6 | ~300 | Knækket stang + snelle |
| Solbrille | 6 | ~280 | Torus-ringe + stænger |
| Rustent Sværd | 7 | ~250 | Klinge + crossguard |
| Dykkermaske | 7 | ~400 | Visir + snorkel |
| Piratflag | 7 | ~300 | Flag + dødningehoved |
| Falmet Søkort | 6 | ~250 | Oprullet + rødt X |
| Flagermusknogle | 7 | ~280 | Vinge-knogler |
| Flosset Reb | 6 | ~350 | TubeGeometry-kurver |
| Gammel Fakkel | 6 | ~300 | Emissive glød i top |

### Test-tjekliste

- [ ] Hvert item viser sin unikke model (ikke fallback-støvle)
- [ ] Alle modeller har `flatShading` og `castShadow`
- [ ] Fælles `useFrame`-animation virker korrekt (rotation + bob)
- [ ] `FlossettRebJunk` har sin egen `useFrame` (ligesom `HavtangJunk`)
- [ ] Farver matcher `bodyColor` fra data
- [ ] Modeller er synlige og korrekt skaleret i både krog-visning og spand
- [ ] `bucketIdle`-parameteren dæmper animation korrekt
- [ ] Ingen console-fejl eller React-advarsler
- [ ] Test alle lokationer: abyss, arctic_sea, desert_lake, forbidden, cave + global pool
