# Implementeringsguide — RegneFisken bugfixes (April 2026)

Denne guide beskriver 3 rettelser + 1 ny fil der skal implementeres.
Mapperne antages at være 1:1 identiske med udgangspunktet.
Ingen nye dependencies. Ingen ændringer i `package.json`.

---

## Oversigt over ændringer

| # | Hvad | Fil(er) | Type |
|---|------|---------|------|
| 1 | NumberPad: Skjul minus/decimal for 0.-6. klasse | `src/components/mobile/NumberPad.tsx` | Ændring |
| 2 | MathChallenge: Send farvand-info til NumberPad | `src/components/fishing/MathChallenge.tsx` | Ændring (1 linje) |
| 3 | Regnehistorier: Guard mod negative svar | `src/logic/math-engine.ts` | Ændring (1 linje) |
| 4 | RootErrorBoundary: Fejldetaljer bag "Vis detaljer" | `src/components/common/RootErrorBoundary.tsx` | Fuld omskrivning |

---

## Trin 1: NumberPad — betingede taster

**Fil:** `src/components/mobile/NumberPad.tsx`

**Erstat hele filens indhold med:**

```tsx
type NumberPadProps = {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  /** Vis decimal- og minus-tast? Kun relevant i Dybet (7.-9. kl.). */
  showDecimal?: boolean;
  showMinus?: boolean;
};

export function NumberPad({ onDigit, onBackspace, onSubmit, showDecimal = false, showMinus = false }: NumberPadProps) {
  const keys = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    '0',
    showDecimal ? '.' : null,
    showMinus ? '-' : null,
  ].filter((k): k is string => k !== null);

  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onDigit(k)}
          className="touch-manipulation min-h-[44px] min-w-[44px] rounded-2xl bg-slate-700 py-4 text-2xl font-black text-white transition-colors hover:bg-slate-600 active:scale-95"
        >
          {k}
        </button>
      ))}
      <button
        type="button"
        onClick={onBackspace}
        className="touch-manipulation min-h-[44px] min-w-[44px] rounded-2xl bg-slate-800 py-4 text-sm font-bold text-slate-300 hover:bg-slate-700"
      >
        ⌫
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="touch-manipulation col-span-2 min-h-[44px] rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-4 text-lg font-black text-white hover:from-emerald-600 hover:to-cyan-600"
      >
        OK
      </button>
    </div>
  );
}
```

**Hvad ændrede sig:**
- Nye valgfrie props: `showDecimal?: boolean` og `showMinus?: boolean` (begge default `false`)
- `keys`-arrayet er nu betinget: `.` og `-` erstattes med `null` og filtreres væk
- Al styling, grid-layout og knap-struktur er uændret

---

## Trin 2: MathChallenge — send farvand til NumberPad

**Fil:** `src/components/fishing/MathChallenge.tsx`

**Find dette (ca. linje 1617):**

```tsx
          <NumberPad
            onDigit={(d) => setUserAnswer((a) => `${a}${d}`)}
            onBackspace={() => setUserAnswer((a) => a.slice(0, -1))}
            onSubmit={() => checkAnswer()}
          />
```

**Erstat med:**

```tsx
          <NumberPad
            onDigit={(d) => setUserAnswer((a) => `${a}${d}`)}
            onBackspace={() => setUserAnswer((a) => a.slice(0, -1))}
            onSubmit={() => checkAnswer()}
            showDecimal={selectedFarvand === 'dybet'}
            showMinus={selectedFarvand === 'dybet'}
          />
```

**Hvad ændrede sig:**
- To nye props tilføjet: `showDecimal` og `showMinus`
- Begge er `true` kun når `selectedFarvand === 'dybet'` (7.-9. klasse)
- `selectedFarvand` er allerede tilgængelig i komponenten (linje 685: `const selectedFarvand = useMathStore((s) => s.selectedFarvand);`)
- Ingen nye imports nødvendige

---

## Trin 3: Regnehistorier — guard mod negative svar

**Fil:** `src/logic/math-engine.ts`

**Find dette i funktionen `generateRegneHistorie()` (ca. linje 637):**

```typescript
    if (tmpl.cond && !tmpl.cond(a, b)) b = Math.floor(a * 0.6);
    answer = a - b;
```

**Erstat med:**

```typescript
    if (tmpl.cond && !tmpl.cond(a, b)) b = Math.floor(a * 0.6);
    if (b > a) b = Math.floor(a * 0.6);
    answer = a - b;
```

**Hvad ændrede sig:**
- Ny linje tilføjet mellem eksisterende `cond`-check og `answer`-beregning
- Guarden `if (b > a)` fanger alle tilfælde hvor subtraktionen ville give negativt resultat
- Virker uanset om template har `cond` eller ej — generel sikkerhed
- Strategien `b = Math.floor(a * 0.6)` er den samme som den eksisterende `cond`-fallback bruger

**Kontekst:** Problemet var at 2 af 3 subtraktions-templates i `REGNEHISTORIE_TEMPLATES` (i `src/data/math-config.ts`) manglede en `cond: (a, b) => a > b` funktion. Med denne guard er alle subtraktions-regnehistorier beskyttet mod negative svar, uanset template-konfiguration.

---

## Trin 4: RootErrorBoundary — fejldetaljer bag "Vis detaljer"

**Fil:** `src/components/common/RootErrorBoundary.tsx`

**Erstat hele filens indhold med:**

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null; errorInfo: ErrorInfo | null };

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ errorInfo: info });
    console.error(error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      const { error, errorInfo } = this.state;
      return (
        <div
          className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-slate-900 p-6 text-center text-white"
          style={{
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
            paddingTop: 'max(1.5rem, env(safe-area-inset-top, 0px))',
          }}
        >
          <p className="max-w-md text-lg font-bold text-slate-200">
            Noget gik galt under visningen af spillet.
          </p>
          <button
            type="button"
            className="touch-manipulation rounded-2xl bg-sky-600 px-8 py-3.5 text-base font-black text-white shadow-lg transition-colors hover:bg-sky-500 active:scale-[0.98]"
            onClick={() => window.location.reload()}
          >
            Genindlæs siden
          </button>
          <details className="mt-2 max-w-lg text-left text-slate-400">
            <summary className="cursor-pointer text-sm font-semibold text-slate-500 hover:text-slate-300">
              Vis detaljer
            </summary>
            <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-slate-800/60 p-4 text-xs leading-relaxed text-slate-300">
              {error.name}: {error.message}
              {error.stack && `\n\n${error.stack}`}
              {errorInfo?.componentStack && `\n\nKomponent-stak:${errorInfo.componentStack}`}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Hvad ændrede sig:**
- `State`-type udvidet: `errorInfo: ErrorInfo | null` tilføjet
- `getDerivedStateFromError` returnerer nu `Partial<State>` i stedet for `State`
- `componentDidCatch` gemmer `ErrorInfo` i state via `this.setState({ errorInfo: info })`
- Nyt `<details>`-element efter "Genindlæs"-knappen:
  - `<summary>` med teksten "Vis detaljer" — lukket som standard
  - `<pre>` med fejlnavn, besked, stack trace og komponent-stak
  - Max højde 16rem med scroll, rundet hjørner, halvgennemsigtig baggrund
- Al eksisterende styling og funktionalitet er bevaret

---

## Tjekliste efter implementering

### TypeScript-kompilering
- [ ] Kør `npx tsc --noEmit` — skal give 0 fejl

### NumberPad (Trin 1 + 2)
- [ ] Vælg farvand "Kysten" (0.-3. kl.) → start en fangst → NumberPad viser KUN 0-9, ⌫ og OK
- [ ] Vælg farvand "Det Åbne Hav" (4.-6. kl.) → start en fangst → NumberPad viser KUN 0-9, ⌫ og OK
- [ ] Vælg farvand "Dybet" (7.-9. kl.) → start en fangst → NumberPad viser 0-9, `.`, `-`, ⌫ og OK
- [ ] Test at decimal-input virker i Dybet (`.` tasten indsætter et punktum)
- [ ] Test at minus-input virker i Dybet (`-` tasten indsætter et minus)
- [ ] Verificer at grid-layout ser pænt ud i alle 3 varianter (ingen tomme huller)

### Regnehistorier (Trin 3)
- [ ] Vælg "Det Åbne Hav" + aktiver "Regnehistorier" som opgavetype
- [ ] Fisk 20-30 gange og observer subtraktions-historier — svaret skal ALTID vaere >= 0
- [ ] Ingen opgave skal vise tekst som "fanger 18 fisk og saelger 28"

### RootErrorBoundary (Trin 4)
- [ ] For at teste: Tilfoej midlertidigt `throw new Error('Test-fejl')` i en komponents render
- [ ] Fejlskaermen viser "Noget gik galt under visningen af spillet."
- [ ] "Genindlaes siden"-knappen virker
- [ ] "Vis detaljer" er lukket som standard
- [ ] Klik paa "Vis detaljer" aabner en pre-blok med fejlnavn, besked og stack trace
- [ ] Fjern test-fejlen igen efter verificering

### Generelt
- [ ] Spillet starter og korer normalt paa desktop
- [ ] Spillet starter og korer normalt paa mobil
- [ ] Lyd fungerer (ambience, effekter)
- [ ] Save/load virker (gem, luk browser, genaabn)
