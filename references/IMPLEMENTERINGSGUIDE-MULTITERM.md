# Implementeringsguide — Flerled-opgaver (multiTerm) fix

Denne guide retter to problemer i `generateMultiTermProblem()`:

1. **Negative mellemresultater:** En opgave som `5 − 7 + 2 = 0` kræver at barnet mentalt beregner `-2` som mellemtrin — forvirrende for 4.-6. klasse der ikke kender negative tal.
2. **Ubegrænset rekursion:** Hvis RNG gentagne gange genererer negative resultater, kalder funktionen sig selv uden grænse, hvilket kan give stack overflow og crashe spillet.

**Løsningen:** Check mellemresultatet efter første operator, tilføj en rekursionstæller med en sikker fallback.

Ingen nye dependencies. Ingen ændringer i `package.json`. Kun én fil ændres.

---

## Trin 1: Erstat hele funktionen

**Fil:** `src/logic/math-engine.ts`

**Find hele `generateMultiTermProblem`-funktionen (ca. linje 835-869):**

```typescript
export function generateMultiTermProblem(mathDifficulty: MathDifficulty): MathProblem {
  const ops = ['+', '-'];
  const op1 = ops[Math.floor(Math.random() * ops.length)];
  const op2 = ops[Math.floor(Math.random() * ops.length)];
  let a = 0;
  let b = 0;
  let c = 0;
  if (mathDifficulty === 'beginner') {
    a = Math.floor(Math.random() * 8) + 2;
    b = Math.floor(Math.random() * 5) + 1;
    c = Math.floor(Math.random() * 5) + 1;
  } else if (mathDifficulty === 'intermediate') {
    a = Math.floor(Math.random() * 30) + 10;
    b = Math.floor(Math.random() * 20) + 5;
    c = Math.floor(Math.random() * 15) + 1;
  } else {
    a = Math.floor(Math.random() * 200) + 50;
    b = Math.floor(Math.random() * 100) + 20;
    c = Math.floor(Math.random() * 80) + 10;
  }
  let result = a;
  result = op1 === '+' ? result + b : result - b;
  result = op2 === '+' ? result + c : result - c;
  if (result < 0) return generateMultiTermProblem(mathDifficulty);
  const sym1 = op1 === '-' ? '−' : '+';
  const sym2 = op2 === '-' ? '−' : '+';
  return {
    question: `${a} ${sym1} ${b} ${sym2} ${c}`,
    answer: result,
    difficulty: 3,
    op: '*',
    category: 'multi-term',
    displayType: 'text',
  };
}
```

**Erstat med:**

```typescript
export function generateMultiTermProblem(mathDifficulty: MathDifficulty, _retries = 0): MathProblem {
  // Sikkerhedsnet: efter 20 fejlede forsøg, returner en simpel addition
  if (_retries > 20) {
    return generateBasicFromOp('+', mathDifficulty, 3);
  }

  const ops = ['+', '-'];
  const op1 = ops[Math.floor(Math.random() * ops.length)];
  const op2 = ops[Math.floor(Math.random() * ops.length)];
  let a = 0;
  let b = 0;
  let c = 0;
  if (mathDifficulty === 'beginner') {
    a = Math.floor(Math.random() * 8) + 2;
    b = Math.floor(Math.random() * 5) + 1;
    c = Math.floor(Math.random() * 5) + 1;
  } else if (mathDifficulty === 'intermediate') {
    a = Math.floor(Math.random() * 30) + 10;
    b = Math.floor(Math.random() * 20) + 5;
    c = Math.floor(Math.random() * 15) + 1;
  } else {
    a = Math.floor(Math.random() * 200) + 50;
    b = Math.floor(Math.random() * 100) + 20;
    c = Math.floor(Math.random() * 80) + 10;
  }

  // Check mellemresultat efter første operator — undgå negative mellemtrin
  const afterOp1 = op1 === '+' ? a + b : a - b;
  if (afterOp1 < 0) return generateMultiTermProblem(mathDifficulty, _retries + 1);

  // Check slutresultat
  const result = op2 === '+' ? afterOp1 + c : afterOp1 - c;
  if (result < 0) return generateMultiTermProblem(mathDifficulty, _retries + 1);

  const sym1 = op1 === '-' ? '−' : '+';
  const sym2 = op2 === '-' ? '−' : '+';
  return {
    question: `${a} ${sym1} ${b} ${sym2} ${c}`,
    answer: result,
    difficulty: 3,
    op: '*',
    category: 'multi-term',
    displayType: 'text',
  };
}
```

**Hvad ændrede sig:**

1. **Ny parameter `_retries = 0`** — tæller rekursionsdybde. Default 0, så eksisterende kald `generateMultiTermProblem(mathDifficulty)` virker uændret uden at sende parameteren.

2. **Fallback ved 20+ retries** — returnerer en simpel addition via `generateBasicFromOp('+', mathDifficulty, 3)` i stedet for at risikere stack overflow. `generateBasicFromOp` er en eksisterende privat funktion i samme fil der altid producerer et gyldigt resultat.

3. **Mellemresultat-check** — `afterOp1` beregnes separat. Hvis `a − b` giver negativt, retries med tæller. Barnet ser aldrig et negativt mellemtrin.

4. **Slutresultat-check** — uændret logik, men bruger nu `_retries + 1` i stedet for at kalde uden tæller.

5. **Alt andet er uændret** — talintervaller, operator-valg, symboler, return-objekt.

---

## Vigtigt: Ingen andre filer skal ændres

Funktionen kaldes kun ét sted (linje ~1002 i samme fil):

```typescript
if (type === 'multi-term') return generateMultiTermProblem(mathDifficulty);
```

Det kald sender ikke `_retries`, så default-værdien 0 bruges automatisk. Ingen ændring nødvendig.

---

## Tjekliste efter implementering

- [ ] Kør `npx tsc --noEmit` — skal give 0 fejl
- [ ] Vælg "Det Åbne Hav" + aktiver "Flere led" som opgavetype
- [ ] Fisk 30+ gange og observer flerled-opgaver:
  - [ ] Ingen opgave har negativt mellemresultat (f.eks. `5 − 7 + ...` må IKKE forekomme)
  - [ ] Ingen opgave har negativt slutresultat
  - [ ] Opgaver med to subtraktioner fungerer stadig (f.eks. `15 − 3 − 2 = 10`)
  - [ ] Opgaver med blandet addition/subtraktion fungerer (f.eks. `8 + 3 − 2 = 9`)
- [ ] Test med sværhedsgrad "expert" — store tal, ingen crash
- [ ] Åbn browser console — ingen stack overflow eller rekursionsfejl
