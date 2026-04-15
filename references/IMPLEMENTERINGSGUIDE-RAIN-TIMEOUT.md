# Implementeringsguide — Regn-volumen timeout tracking

Denne guide retter et problem i `audioEngine.ts` hvor `setRainVolume(0)` opretter en `setTimeout` der ikke gemmes i en variabel. Hurtige gentagne kald (f.eks. ved hurtigt lokationsskift eller mute-toggle) queuer multiple timeouts der alle forsøger at stoppe den samme regn-node.

**Løsningen:** Track timeout'en i en modul-variabel og ryd den ved nye kald.

Ingen nye dependencies. Ingen ændringer i `package.json`. Kun én fil ændres.

---

## Trin 1: Tilføj tracking-variabel

**Fil:** `src/audio/audioEngine.ts`

**Find dette (ca. linje 14-15):**

```typescript
let rainNode: AudioBufferSourceNode | null = null;
let rainGain: GainNode | null = null;
```

**Erstat med:**

```typescript
let rainNode: AudioBufferSourceNode | null = null;
let rainGain: GainNode | null = null;
let rainStopTimer: ReturnType<typeof setTimeout> | null = null;
```

---

## Trin 2: Erstat setRainVolume-funktionen

**I samme fil, find hele `setRainVolume`-funktionen (ca. linje 625-660):**

```typescript
export function setRainVolume(vol: number): void {
  const ctx = initAudio();
  if (!ctx) return;
  if (vol > 0 && !rainNode) {
    const bSize = ctx.sampleRate;
    const buf = ctx.createBuffer(1, bSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
    rainNode = ctx.createBufferSource();
    rainNode.buffer = buf;
    rainNode.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 800;
    rainGain = ctx.createGain();
    rainGain.gain.value = 0;
    rainNode.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(ctx.destination);
    rainNode.start();
  }
  if (rainGain) {
    rainGain.gain.setTargetAtTime(vol * 0.15, ctx.currentTime, 0.5);
  }
  if (vol === 0 && rainNode) {
    window.setTimeout(() => {
      if (rainGain && rainGain.gain.value < 0.001) {
        try {
          rainNode?.stop();
        } catch {
          /* ignore */
        }
        rainNode = null;
        rainGain = null;
      }
    }, 1000);
  }
}
```

**Erstat med:**

```typescript
export function setRainVolume(vol: number): void {
  const ctx = initAudio();
  if (!ctx) return;

  // Ryd evt. ventende stop-timer ved ethvert nyt kald
  if (rainStopTimer !== null) {
    clearTimeout(rainStopTimer);
    rainStopTimer = null;
  }

  if (vol > 0 && !rainNode) {
    const bSize = ctx.sampleRate;
    const buf = ctx.createBuffer(1, bSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
    rainNode = ctx.createBufferSource();
    rainNode.buffer = buf;
    rainNode.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 800;
    rainGain = ctx.createGain();
    rainGain.gain.value = 0;
    rainNode.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(ctx.destination);
    rainNode.start();
  }
  if (rainGain) {
    rainGain.gain.setTargetAtTime(vol * 0.15, ctx.currentTime, 0.5);
  }
  if (vol === 0 && rainNode) {
    rainStopTimer = window.setTimeout(() => {
      rainStopTimer = null;
      if (rainGain && rainGain.gain.value < 0.001) {
        try {
          rainNode?.stop();
        } catch {
          /* ignore */
        }
        rainNode = null;
        rainGain = null;
      }
    }, 1000);
  }
}
```

**Hvad ændrede sig:**
1. Ny modul-variabel `rainStopTimer` tracker den ventende timeout
2. Ved starten af hvert kald til `setRainVolume` ryddes evt. eksisterende timer — så kun én timeout er aktiv ad gangen
3. `window.setTimeout(...)` gemmes i `rainStopTimer` i stedet for at være fire-and-forget
4. Timer nulstilles (`rainStopTimer = null`) når den fyrer
5. Al eksisterende logik (node-oprettelse, gain-ramping, stop-betingelse) er uændret

---

## Tjekliste efter implementering

- [ ] Kør `npx tsc --noEmit` — skal give 0 fejl
- [ ] Start spillet, vent på regnvejr — regn-lyd skal fade ind normalt
- [ ] Skift lokation under regn (f.eks. pier → hytten) — regn-lyd skal fade ud uden artefakter
- [ ] Skift hurtigt frem og tilbage mellem lokationer under regn — ingen dobbelt-stop eller console-fejl
- [ ] Mute/unmute under regn — lyd stopper/starter rent
- [ ] Åbn browser console og verificer at der ikke er AudioNode-fejl under lokationsskift
