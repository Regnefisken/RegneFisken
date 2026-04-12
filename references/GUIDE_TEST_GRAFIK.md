# Kort guide: Test af grafik-opdateringer

## Kør spillet

```bash
npm run dev
```

Åbn appen i browseren (typisk `http://localhost:5173`). De fleste grafik-features kræver at du er **inde i spillet** (3D-canvas aktivt), ikke kun startskærmen.

---

## Skærmindstillinger (hurtigst)

1. Åbn **Skærmindstillinger** (samme sted som før i UI).
2. **Grafik-knapper** (Lav → Ultra): skift tier og se at scenen opdateres (skygger, DPR, partikler, bloom på Ultra).
3. **FPS-linje** (`⚡ … FPS`): skal opdatere ca. hvert halve sekund når indstillingerne er åbne — god sanity-check at måleren kører.
4. **«Test grafik igen»**: rydder GPU-benchmark-cache og kører auto-detect igen — tjek toast med kvalitet og score.
5. **PMREM-slider**: træk over den *anbefalede* grænse for dit tier — gul advarsel skal vises (slideren er stadig fri).
6. **Reducer bevægelse** (hvis I har toggle): slå til og bekræft at regn/partikler/splash/skærmeffekter reduceres som forventet.

---

## Tier-for-tier (manuel smoke-test)

| Område | Lav | Ultra |
|--------|-----|--------|
| **Skygger** | Ingen shadow map | PCF + højere shadow resolution |
| **Vejr-partikler** | Færre (skjult via shader-count) | Op til fuldt antal |
| **Skyer** | Færre skyer og færre «blobs» pr. sky | Fuld kvalitet |
| **Sparkles** (XP/confetti) | Slået fra | Fuld |
| **Bloom** | Fra | Til (subtil glans) |

Skift mellem **Lav** og **Ultra** mens du står et sted med vand, vejr og lys — forskellen bør være tydelig uden at måle FPS.

---

## Simuler svag hardware (browser)

- **Chrome DevTools** → **Performance** eller **Rendering** → CPU-throttling (fx 6× slowdown) kan presse FPS ned og trigge **automatisk nedgradering** (hvis du ikke lige har valgt grafik manuelt — manuelt valg slår `autoQualityEnabled` fra).
- **Reduceret bevægelse** i OS (Windows/Chrome indstillinger) kan kombineres med app-toggle for at se `prefers-reduced-motion`.

---

## Benchmark-cache

- Cache-nøgle: `regnefisken_gpu_bench` i **localStorage**.
- «Test grafik igen» sletter den og kører benchmark på ny.
- Ved **ny app-version** (`APP_VERSION` i `src/data/version.ts`) invalideres gammel cache automatisk.

---

## Sjældne hændelser

- **WebGL context lost**: svær at fremtvinge; typisk tab-skift, driver eller termisk throttling. Ved tab vises toast og siden genindlæses efter kort delay — kun relevant hvis du debugger den konkrete flow.

---

## Build før merge

```bash
npm run build
```

Sikrer at TypeScript og bundling stadig er grøn efter ændringer.
