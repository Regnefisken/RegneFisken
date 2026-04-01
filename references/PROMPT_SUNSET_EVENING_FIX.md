# Fix: Solnedgang for tidligt + kulsort aftenhimmel

## Kontekst

Der er to visuelle problemer i døgncyklussen:

1. **Orange solnedgangseffekt trigger for tidligt** — allerede midt på dagen bliver himmel, skyer, fugle og havets baggrund orange. Den lineære interpolation fra Dag→Aften starter orange-blendingen fra første sekund af segmentet.

2. **Kulsort aftenhimmel før stjerner** — i Aften→Nat-segmentet falder farverne lineært mod Nat's næsten sorte farver (`0x101840`), men stjernerne (`computeNightSkyOpacity`) dukker først op ved `lerpT>0.5`. Det skaber en "død zone" med kulsort himmel uden stjerner.

## Hvad der IKKE skal ændres

- Nat-fasens farver, intensiteter, stjerne/måne-logik
- Dag-fasens farver og intensiteter
- Nat→Morgen hold-kurven (`NAT_TO_MORGEN_HOLD_LERP`)
- `computeNightSkyOpacity` — stjernernes timing
- `DAY_NIGHT_CYCLE` fase-definitioner i `world.ts`
- `computeEnvironmentFrame` og `computeSkyFrame` (de bruger allerede `effectivePhaseLerpT`)

## Ændring

Kun **én funktion** skal ændres: `effectivePhaseLerpT` i `src/three/logic/environment.ts`.

### Nuværende kode (linje 33–39)

```typescript
export function effectivePhaseLerpT(curName: string, nxtName: string, segmentLerpT: number): number {
  if (curName === 'Nat' && nxtName === 'Morgen') {
    if (segmentLerpT <= NAT_TO_MORGEN_HOLD_LERP) return 0;
    return (segmentLerpT - NAT_TO_MORGEN_HOLD_LERP) / (1 - NAT_TO_MORGEN_HOLD_LERP);
  }
  return segmentLerpT;
}
```

### Ny kode

```typescript
export function effectivePhaseLerpT(curName: string, nxtName: string, segmentLerpT: number): number {
  if (curName === 'Nat' && nxtName === 'Morgen') {
    if (segmentLerpT <= NAT_TO_MORGEN_HOLD_LERP) return 0;
    return (segmentLerpT - NAT_TO_MORGEN_HOLD_LERP) / (1 - NAT_TO_MORGEN_HOLD_LERP);
  }
  /* Dag→Aften: t² holder himlen blå længere — orange kommer sent og hurtigt, som en rigtig solnedgang. */
  if (curName === 'Dag' && nxtName === 'Aften') {
    return segmentLerpT * segmentLerpT;
  }
  /* Aften→Nat: hold varme dusk-farver indtil stjerner dukker op (lerpT>0.5 i computeNightSkyOpacity).
     Første 45%: farver drifter kun til 15% mod Nat. Derefter accelererer smoothstep mod fuld Nat
     synkroniseret med stjernernes synlighed — ingen kulsort "dead zone" uden stjerner. */
  if (curName === 'Aften' && nxtName === 'Nat') {
    const HOLD = 0.45;
    const DRIFT = 0.15;
    if (segmentLerpT <= HOLD) return segmentLerpT * (DRIFT / HOLD);
    const t = (segmentLerpT - HOLD) / (1 - HOLD);
    return DRIFT + (1 - DRIFT) * smoothstep01(t);
  }
  return segmentLerpT;
}
```

### Verifikation

- `smoothstep01` er allerede importeret/defineret i samme fil (linje 12–14).
- Funktionen bruges af `computeSkyFrame` (til turbidity/rayleigh/solvinkel) og `computeEnvironmentFrame` (til bg/fog/lys-farver) — begge drager automatisk gavn.
- `SkyClouds.tsx` bruger også `effectivePhaseLerpT` og får automatisk korrekte sky-farver.
- `sunAnglesLerpT` falder tilbage til `effectivePhaseLerpT` for ikke-Nat→Morgen segmenter, så solens bane følger samme kurve.
- Ingen andre filer skal ændres.
