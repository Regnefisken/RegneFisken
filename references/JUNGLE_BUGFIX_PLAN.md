# Jungle Island — Bugfix-plan (5 problemer, 3 trin)

> Kontekst: TRIN 1–7 fra `references/JUNGLE_IMPLEMENTATION_GUIDE.md` er implementeret.
> Filerne der er relevante:
> - `src/three/environments/JunglePlayerController.tsx` — first-person controller
> - `src/three/effects/CameraRig.tsx` — kamera for alle lokationer undtagen jungle
> - `src/three/effects/NightSky.tsx` — stjerner + måne
> - `src/components/fishing/FishingControls.tsx` — "KAST SNØREN"-knap
> - `src/App.tsx` — render-hierarki for UI-overlay

---

## TRIN 1: Bro-hitbox og overgang til ø (Problem A + B)

### Problem A — Broens hitbox er for bred
`PIER_X_EXTENT = 2.35` i `JunglePlayerController.tsx`, men de faktiske planker er kun `4.0` brede (±2.0) og sidebjælkerne sidder ved `x = ±1.45`. Man kan gå et helt skridt ud over kanten.

**Fix:** Sænk `PIER_X_EXTENT` til `1.85` (lidt inden for plankekanten).

### Problem B — Man kan ikke gå fra broen ned på øen
`isWalkable()` checker bro og ø som to separate zoner. Broen ender ved `PIER_Z_MAX ≈ 1.58` (verdens-z), men øens sandcirkel (centrum `z=14`, radius `12`) starter først ved `z ≈ 2.0`. Der er et dødt bånd på ~0.4 enheder hvor hverken bro- eller ø-checket returnerer `true`, så spilleren sidder fast.

**Fix:** Udvid `PIER_Z_MAX` med en lille buffer (`+ 0.6`) så bro-zonen overlapper med ø-cirklen. Alternativt (og bedre): tilføj en tredje walkable-zone i `isWalkable()` — en overgangsrektangel fra broens ende til øens kant, f.eks.:

```typescript
// Overgang bro → ø: tillad gang fra PIER_Z_MAX til strandkant
if (Math.abs(x) < PIER_X_EXTENT && z >= PIER_Z_MAX && z <= ISLAND_CZ - ISLAND_R + 0.5) return true;
```

**Terrænhøjde:** `getGroundWorldY()` skal også returnere en meningsfuld y i overgangszonen — brug `terrainLocalY(x,z) + ISLAND_LIFT` her (sandet).

### Sådan tester du
1. Gå langs broens kant — man kan IKKE gå ud over kanten.
2. Gå fra broen mod øen — man glider problemfrit over på sandet.
3. Man kan stadig ikke gå ud i vandet fra øens andre sider.

**STOP HER — lad mig teste.**

---

## TRIN 2: Stjerner/måne + kamera-koldbøtte ved afrejse (Problem C + D)

### Problem C — Stjerner og måne følger kameraet rundt
I `NightSky.tsx` linje 313–315:
```typescript
g.position.copy(cam.position);
g.quaternion.copy(cam.quaternion);
```
Hele NightSky-gruppen kopierer kameraets position OG rotation hvert frame. Det virker for et statisk/langsomt kamera (pier), men med first-person rotation "roterer hele himlen med".

**Fix:** På `jungle_island` skal gruppen kun følge kameraets **position** (så stjernerne forbliver i det fjerne), men IKKE rotere med:

I `NightSky.tsx` `useFrame`, efter `g.position.copy(cam.position)`:
```typescript
if (locId === 'jungle_island') {
  g.quaternion.identity();
} else {
  g.quaternion.copy(cam.quaternion);
}
```

Månen og stjernerne er placeret i kamera-lokalt rum, og det passer til det statiske CameraRig (der altid kalder `lookAt`). Men med `identity()` skal positionerne stadig fungere — stjernerne ligger ved `z: -40 til -88`, `y: 11–47`, `x: -55 til +55` i verdensrum, hvilket er bag kameraet og langt væk. Test at det ser rigtigt ud; hvis stjernerne ender forkert, kan du i stedet sætte `g.quaternion` til en fast rotation (f.eks. fra pier idle-camera) når `locId === 'jungle_island'`.

### Problem D — Kameraet "slår en koldbøtte" når man forlader jungle
Når man rejser FRA jungle til pier, har `JunglePlayerController` sat kameraets `rotation.order = 'YXZ'` og rotationen peger mod øen (yaw ≈ π). `CameraRig` bruger derimod `camera.lookAt()` som sætter `rotation.order = 'XYZ'`. Den pludselige lerp fra jungle-kameraets position/rotation til pier-idle giver et voldsomt spin.

**Fix:** I `CameraRig.tsx`, i starten af `useFrame` — lige EFTER det eksisterende `if (locationId === 'jungle_island') return;` — tilføj en one-shot reset:
- Tilføj en `useRef<boolean>` (`wasJungle`) der husker om forrige frame var jungle.
- Når `wasJungle.current === true && locationId !== 'jungle_island'`:
  - Sæt `camera.rotation.order = 'XYZ'` (CameraRig's forventning).
  - Snap kameraet direkte til pier-idle-positionen: `camera.position.copy(IDLE_PIER)` og `camera.lookAt(LOOK_PIER)`.
  - Reset `lookCurrent`, `desiredPos`, `desiredLook` refs til pier-defaults, så der ikke lerpes fra en vild position.
  - Sæt `wasJungle.current = false`.
- Opdatér `wasJungle.current = true` når `locationId === 'jungle_island'` (inde i early return).

Dette sikrer at kameraet snappes rent til pier-positionen i stedet for at lerpe fra en vild jungle-rotation.

### Sådan tester du
1. Vær på jungle_island om natten — stjerner og måne hænger fast på himlen, uanset hvor du kigger.
2. Rejs fra jungle til pier — kameraet popper direkte til pier-idle, ingen koldbøtte/spin.
3. Rejs fra pier til jungle — stadig uden koldbøtte (dette virker allerede).
4. Stjerner og måne fungerer normalt på andre lokationer.

**STOP HER — lad mig teste.**

---

## TRIN 3: "KAST SNØREN"-knap → diskret kryds (Problem E)

### Problem E — Kast-knap vises på jungle, men fiskeri er ikke aktivt
`FishingControls` renderes altid i `App.tsx` (linje 221). Den viser "KAST SNØREN" i idle state, men det er meningsløst på jungleøen. Erstat med et diskret sigtekryds (crosshair).

**Fix i `FishingControls.tsx`:**
- Øverst i komponenten: hent `currentLocation` (allerede tilgængelig).
- Tilføj tidlig return for `jungle_island`:
```tsx
if (currentLocation === 'jungle_island') {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
      <div className="relative h-5 w-5 opacity-50">
        <div className="absolute left-1/2 top-1/2 h-[2px] w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />
        <div className="absolute left-1/2 top-1/2 h-5 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />
      </div>
    </div>
  );
}
```

Alternativt kan crosshairen renderes som en **separat komponent** i `App.tsx`, kontrolleret af `currentLocation === 'jungle_island'`, og `FishingControls` returnerer bare `null` på jungle.

### Sådan tester du
1. Rejs til jungle_island — ingen "KAST SNØREN"-knap synlig.
2. Et diskret hvidt kryds (≈50% opacity) vises midt på skærmen.
3. Rejs til pier — normal kast-knap er tilbage, krydset er væk.

**STOP HER — lad mig teste.**
