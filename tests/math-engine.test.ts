import { describe, expect, it } from 'vitest';
import { FARVANDE, MATH_TYPE_DEFS } from '../src/data/math-config.js';
import {
  formatDecimal,
  generate100FriendsQuestion,
  generateAfrundingProblem,
  generateDecimalProblem,
  generateEmojiAntalProblem,
  generateEmojiCountingProblem,
  generateEmojiDoubleProblem,
  generateEmojiEqualizeProblem,
  generateEmojiEvenOddProblem,
  generateEmojiFractionProblem,
  generateEmojiHalfProblem,
  generateEmojiMostLeastProblem,
  generateEmojiPatternProblem,
  generateEmojiPercentProblem,
  generateEmojiSizeCompareProblem,
  generateEmojiSortProblem,
  generateEquationProblem,
  generateFractionDecimalProblem,
  generateLetRegneHistorie,
  generateMathProblem,
  generateMultiTermProblem,
  generateNumbersForOp,
  generatePercentDecimalProblem,
  generateRegneHistorie,
  generateSkaeve100FriendsQuestion,
  generateTaelleraekke,
} from '../src/logic/math-engine.js';
import type { FarvandId, MathDifficulty, MathProblem } from '../src/types/math.js';

describe('math-engine', () => {
  it('tenfriends: ukendt led + kendt led giver sum 10', () => {
    for (let i = 0; i < 40; i++) {
      const p = generateMathProblem(['tenfriends'], 'beginner', 'kysten', {});
      expect(p.op).toBe('tenfriends');
      expect(typeof p.answer).toBe('number');
      const m1 = p.question.match(/^\? \+ (\d+) = 10$/);
      const m2 = p.question.match(/^(\d+) \+ \? = 10$/);
      expect(m1 || m2).toBeTruthy();
      if (m1) {
        expect(p.answer + Number(m1[1])).toBe(10);
      } else if (m2) {
        expect(Number(m2[1]) + p.answer).toBe(10);
      }
    }
  });

  it('basic addition beginner: svar matcher udtryk', () => {
    for (let i = 0; i < 30; i++) {
      const p = generateMathProblem(['plus'], 'beginner', 'kysten', {});
      const m = p.question.match(/^(\d+) \+ (\d+)$/);
      expect(m).toBeTruthy();
      expect(Number(m![1]) + Number(m![2])).toBe(p.answer);
    }
  });

  it('lette-historier: addition og svar > 0', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateLetRegneHistorie('beginner');
      expect(p.category).toBe('lette-historier');
      expect(p.answer).toBeGreaterThan(0);
      expect(p.question.length).toBeGreaterThan(10);
    }
  });

  it('multi-term: tre tal og korrekt svar (ikke-negativt)', () => {
    for (let i = 0; i < 25; i++) {
      const p = generateMultiTermProblem('beginner');
      expect(p.answer).toBeGreaterThanOrEqual(0);
      const parts = p.question.split(' ');
      expect(parts.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('emoji-half: lige antal og svar = halvdelen', () => {
    for (let i = 0; i < 30; i++) {
      const p = generateEmojiHalfProblem();
      expect(p.category).toBe('emoji-half');
      expect(p.emojiHalvdelData?.mode).toBe('half');
      const c = p.emojiHalvdelData!.count;
      expect([2, 4, 6, 8, 10]).toContain(c);
      expect(p.answer).toBe(c / 2);
    }
  });

  it('emoji-double: svar er det dobbelte af vist antal', () => {
    for (let i = 0; i < 30; i++) {
      const p = generateEmojiDoubleProblem();
      expect(p.category).toBe('emoji-double');
      const n = p.emojiHalvdelData!.count;
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(5);
      expect(p.answer).toBe(n * 2);
    }
  });

  it('emoji-fraction: brøk matcher fremhævet antal', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateEmojiFractionProblem();
      expect(p.category).toBe('emoji-fraction');
      const h = p.emojiFractionData!.highlighted;
      expect(h).toBeGreaterThanOrEqual(1);
      expect(h).toBeLessThanOrEqual(9);
      expect(p.emojiFractionData!.choices).toContain(p.emojiFractionData!.correctFraction);
    }
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Udvidede tests: facit skal altid passe til det viste regnestykke.
 * Hver test genererer mange opgaver og regner selv efter ud fra opgaveteksten.
 * ──────────────────────────────────────────────────────────────────────────── */

const DIFFICULTIES: MathDifficulty[] = ['beginner', 'intermediate', 'expert'];
const FARVAND_IDS = Object.keys(FARVANDE) as FarvandId[];
const N = 300;

/** Alle heltal i en tekst, i rækkefølge. */
function ints(text: string): number[] {
  return (text.match(/\d+/g) ?? []).map(Number);
}

/** Læser et decimaltal skrevet med komma eller punktum. */
function dec(text: string): number {
  return Number(text.replace(',', '.'));
}

function fractionValue(f: string): number {
  const [n, d] = f.split('/').map(Number);
  return d === undefined ? n! : n! / d;
}

function expectWholeNonNegative(n: number, label: string): void {
  expect(Number.isInteger(n), `${label}: ${n} er ikke et helt tal`).toBe(true);
  expect(n, label).toBeGreaterThanOrEqual(0);
}

describe('formatDecimal', () => {
  it('bruger den valgte decimalseparator', () => {
    expect(formatDecimal(3.5, ',')).toBe('3,5');
    expect(formatDecimal(3.5, '.')).toBe('3.5');
    expect(formatDecimal(12, ',')).toBe('12');
    expect(formatDecimal(0.25, ',')).toBe('0,25');
  });
});

describe('de fire regnearter', () => {
  const cases: [string, FarvandId, RegExp, (a: number, b: number) => number][] = [
    ['plus', 'aabenhav', /^(\d+) \+ (\d+)$/, (a, b) => a + b],
    ['minus', 'aabenhav', /^(\d+) - (\d+)$/, (a, b) => a - b],
    ['gange', 'aabenhav', /^(\d+) × (\d+)$/, (a, b) => a * b],
    ['division', 'aabenhav', /^(\d+) : (\d+)$/, (a, b) => a / b],
  ];

  for (const [type, farvand, pattern, calc] of cases) {
    for (const d of DIFFICULTIES) {
      it(`${type} (${d}): facit passer, og er et helt tal ≥ 0`, () => {
        for (let i = 0; i < N; i++) {
          const p = generateMathProblem([type], d, farvand, {});
          const m = p.question.match(pattern);
          expect(m, p.question).toBeTruthy();
          const a = Number(m![1]);
          const b = Number(m![2]);
          expect(p.answer, p.question).toBe(calc(a, b));
          expectWholeNonNegative(p.answer, p.question);
          expect(p.category).toBe('basic');
        }
      });
    }
  }

  it('division deler aldrig med nul og går altid op', () => {
    for (const d of DIFFICULTIES) {
      for (let i = 0; i < N; i++) {
        const { a, b } = generateNumbersForOp('/', d);
        expect(b, `${a} : ${b}`).toBeGreaterThan(0);
        expect(a % b, `${a} : ${b}`).toBe(0);
      }
    }
  });

  it('minus giver aldrig et negativt resultat', () => {
    for (const d of DIFFICULTIES) {
      for (let i = 0; i < N; i++) {
        const { a, b } = generateNumbersForOp('-', d);
        expect(a - b, `${a} - ${b}`).toBeGreaterThanOrEqual(0);
        expect(b).toBeGreaterThan(0);
      }
    }
  });

  it('begynder: plus og minus holder sig til små tal', () => {
    for (let i = 0; i < N; i++) {
      const plus = generateNumbersForOp('+', 'beginner');
      expect(plus.a + plus.b).toBeLessThanOrEqual(18);
      const minus = generateNumbersForOp('-', 'beginner');
      expect(minus.a).toBeLessThanOrEqual(9);
    }
  });

  it('begynder: gange bruger kun 1-, 2-, 5- og 10-tabellen', () => {
    for (let i = 0; i < N; i++) {
      const { a, b } = generateNumbersForOp('*', 'beginner');
      expect([1, 2, 5, 10]).toContain(a);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(10);
    }
  });
});

describe('talvenner', () => {
  const forms = [
    { re: /^(\d+) \+ \? = 100$/, check: (n: number, ans: number) => n + ans === 100 },
    { re: /^\? \+ (\d+) = 100$/, check: (n: number, ans: number) => ans + n === 100 },
    { re: /^100 − \? = (\d+)$/, check: (n: number, ans: number) => 100 - ans === n },
    { re: /^100 − (\d+) = \?$/, check: (n: number, ans: number) => 100 - n === ans },
  ];

  function checkHundred(p: MathProblem): number {
    const form = forms.find((f) => f.re.test(p.question));
    expect(form, p.question).toBeDefined();
    const n = Number(p.question.match(form!.re)![1]);
    expect(form!.check(n, p.answer), `${p.question} → ${p.answer}`).toBe(true);
    return n;
  }

  it('100-venner: hele tiere, og facit passer i alle fire opstillinger', () => {
    for (let i = 0; i < N; i++) {
      const p = generate100FriendsQuestion();
      const n = checkHundred(p);
      expect(n % 10).toBe(0);
      expect(p.answer % 10).toBe(0);
      expect(p.answer).toBeGreaterThanOrEqual(10);
      expect(p.answer).toBeLessThanOrEqual(90);
    }
  });

  it('skæve 100-venner: facit passer og ligger mellem 1 og 99', () => {
    for (let i = 0; i < N; i++) {
      const p = generateSkaeve100FriendsQuestion();
      checkHundred(p);
      expect(p.answer).toBeGreaterThanOrEqual(1);
      expect(p.answer).toBeLessThanOrEqual(99);
    }
  });
});

describe('afrunding', () => {
  const unit: Record<string, number> = { tier: 10, hundrede: 100, tusinde: 1000 };

  for (const d of DIFFICULTIES) {
    it(`${d}: facit er nærmeste runde tal, og midten rundes op`, () => {
      for (let i = 0; i < N; i++) {
        const p = generateAfrundingProblem(d);
        const m = p.question.match(/^Afrund (\d+) til nærmeste (tier|hundrede|tusinde)$/);
        expect(m, p.question).toBeTruthy();
        const tal = Number(m![1]);
        const u = unit[m![2]!]!;
        expect(p.answer % u, p.question).toBe(0);
        const rest = tal % u;
        const expected = rest * 2 >= u ? tal - rest + u : tal - rest;
        expect(p.answer, p.question).toBe(expected);
      }
    });
  }
});

describe('flere led', () => {
  for (const d of DIFFICULTIES) {
    it(`${d}: facit passer regnet fra venstre, og intet mellemresultat er negativt`, () => {
      for (let i = 0; i < N; i++) {
        const p = generateMultiTermProblem(d);
        const m = p.question.match(/^(\d+) ([+−]) (\d+) ([+−]) (\d+)$/);
        expect(m, p.question).toBeTruthy();
        const [a, b, c] = [Number(m![1]), Number(m![3]), Number(m![5])];
        const mid = m![2] === '+' ? a + b : a - b;
        const end = m![4] === '+' ? mid + c : mid - c;
        expect(mid, p.question).toBeGreaterThanOrEqual(0);
        expect(p.answer, p.question).toBe(end);
        expectWholeNonNegative(p.answer, p.question);
      }
    });
  }
});

describe('ligninger', () => {
  for (const d of DIFFICULTIES) {
    it(`${d}: x = facit løser ligningen`, () => {
      for (let i = 0; i < N; i++) {
        const p = generateEquationProblem(d);
        const x = p.answer;
        expectWholeNonNegative(x, p.question);
        expect(x, p.question).toBeGreaterThan(0);
        let m: RegExpMatchArray | null;
        if ((m = p.question.match(/^(\d+) \+ x = (\d+)$/))) {
          expect(Number(m[1]) + x, p.question).toBe(Number(m[2]));
        } else if ((m = p.question.match(/^x − (\d+) = (\d+)$/))) {
          expect(x - Number(m[1]), p.question).toBe(Number(m[2]));
        } else if ((m = p.question.match(/^(\d+) × x = (\d+)$/))) {
          expect(Number(m[1]) * x, p.question).toBe(Number(m[2]));
        } else {
          expect.fail(`ukendt ligningsform: ${p.question}`);
        }
      }
    });
  }
});

describe('decimaltal', () => {
  for (const d of DIFFICULTIES) {
    for (const sep of [',', '.'] as const) {
      it(`${d} med "${sep}": facit passer og har højst én decimal`, () => {
        for (let i = 0; i < N; i++) {
          const p = generateDecimalProblem(d, sep);
          const m = p.question.match(/^(\S+) ([+−]) (\S+)$/);
          expect(m, p.question).toBeTruthy();
          const other = sep === ',' ? '.' : ',';
          expect(p.question.includes(other), p.question).toBe(false);
          const a = dec(m![1]!);
          const b = dec(m![3]!);
          const expected = m![2] === '+' ? a + b : a - b;
          expect(p.answer, p.question).toBeCloseTo(expected, 6);
          expect(p.answer, p.question).toBeGreaterThanOrEqual(0);
          expect(Math.round(p.answer * 10) / 10, p.question).toBe(p.answer);
          expect(p.isDecimal).toBe(true);
        }
      });
    }
  }
});

describe('procent og decimaltal', () => {
  for (const d of DIFFICULTIES) {
    it(`${d}: procent og decimaltal svarer til hinanden`, () => {
      for (let i = 0; i < N; i++) {
        const p = generatePercentDecimalProblem(d, ',');
        let m: RegExpMatchArray | null;
        if ((m = p.question.match(/^(\d+)% = \?$/))) {
          expect(p.answer, p.question).toBeCloseTo(Number(m[1]) / 100, 9);
          expect(p.isDecimal).toBe(true);
        } else if ((m = p.question.match(/^(\S+) = \?%$/))) {
          expect(p.answer, p.question).toBe(Math.round(dec(m[1]!) * 100));
          expect(p.isDecimal).toBe(false);
        } else {
          expect.fail(`ukendt form: ${p.question}`);
        }
        expect(p.answer).toBeGreaterThan(0);
      }
    });
  }
});

describe('brøk og decimaltal', () => {
  for (const d of DIFFICULTIES) {
    it(`${d}: brøken og decimaltallet er lige store`, () => {
      for (let i = 0; i < N; i++) {
        const p = generateFractionDecimalProblem(d, ',');
        const data = p.fractionDecimalData!;
        expect(fractionValue(data.fraction), data.fraction).toBeCloseTo(data.decimal, 9);
        if (data.direction === 'fraction-to-decimal') {
          expect(p.question).toBe(`${data.fraction} = ?`);
          expect(p.answer).toBe(data.decimal);
        } else {
          expect(dec(p.question.replace(' = ?', ''))).toBe(data.decimal);
          const choices = data.choices!;
          expect(choices.length).toBe(4);
          expect(new Set(choices).size, choices.join(' ')).toBe(4);
          const correct = choices.filter((c) => Math.abs(fractionValue(c) - data.decimal) < 1e-9);
          expect(correct, `${p.question}: ${choices.join(' ')}`).toEqual([data.fraction]);
        }
      }
    });
  }
});

describe('tællerækker', () => {
  for (const d of DIFFICULTIES) {
    it(`${d}: rækken har fast spring, og facit er næste tal`, () => {
      for (let i = 0; i < N; i++) {
        const p = generateTaelleraekke(d);
        expect(p.question.endsWith(', ?'), p.question).toBe(true);
        const seq = ints(p.question);
        expect(seq.length).toBe(d === 'beginner' ? 4 : 5);
        const step = seq[1]! - seq[0]!;
        expect(step, p.question).not.toBe(0);
        for (let k = 1; k < seq.length; k++) {
          expect(seq[k]! - seq[k - 1]!, p.question).toBe(step);
        }
        expect(p.answer, p.question).toBe(seq[seq.length - 1]! + step);
        expect(p.answer, p.question).toBeGreaterThan(0);
        for (const n of seq) expect(n, p.question).toBeGreaterThan(0);
      }
    });
  }
});

describe('regnehistorier', () => {
  const calc: Record<string, (x: number, y: number) => number> = {
    '+': (x, y) => x + y,
    '-': (x, y) => x - y,
    '*': (x, y) => x * y,
    '/': (x, y) => x / y,
  };

  for (const d of DIFFICULTIES) {
    for (const op of ['+', '-', '*', '/']) {
      it(`${d} ${op}: facit passer til tallene i historien`, () => {
        for (let i = 0; i < N; i++) {
          const p = generateRegneHistorie(d, [op])!;
          expect(p, 'opgave').not.toBeNull();
          expect(p.op).toBe(op);
          expect(p.question).not.toMatch(/[{}]/);
          const nums = ints(p.question);
          expect(nums.length, p.question).toBe(2);
          const [x, y] = nums as [number, number];
          // Skabelonerne nævner ikke altid tallene i regne-rækkefølge.
          const candidates = [calc[op]!(x, y), calc[op]!(y, x)];
          expect(candidates, `${p.question} → ${p.answer}`).toContain(p.answer);
          expectWholeNonNegative(p.answer, p.question);
          expect(p.unit && p.unit.length > 0).toBe(true);
        }
      });
    }
  }

  it('ingen tal i selve historien er 0, og facit er aldrig negativt', () => {
    for (const d of DIFFICULTIES) {
      for (let i = 0; i < N * 2; i++) {
        const p = generateRegneHistorie(d, [])!;
        for (const n of ints(p.question)) expect(n, p.question).toBeGreaterThan(0);
        // Facit 0 kan forekomme ("fanger 22 fisk og sælger 22").
        expect(p.answer, p.question).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('uden gyldige regnearter returneres ingen opgave', () => {
    expect(generateRegneHistorie('beginner', ['%'])).toBeNull();
  });

  it('skriver ental ved 1 og flertal ellers (flaske/pose/tube)', () => {
    for (let i = 0; i < N * 3; i++) {
      const q = generateLetRegneHistorie('beginner').question;
      expect(q, q).not.toMatch(/\b1 (flasker|poser|tuber|solcremer)\b/i);
      expect(q, q).not.toMatch(/\b([2-9]|[1-9]\d+) (flaske|pose|tube)\b/i);
    }
  });

  for (const d of DIFFICULTIES) {
    it(`lette historier (${d}): to tal lagt sammen giver facit`, () => {
      for (let i = 0; i < N; i++) {
        const p = generateLetRegneHistorie(d);
        expect(p.question).not.toMatch(/[{}]/);
        const nums = ints(p.question);
        expect(nums.length, p.question).toBe(2);
        expect(p.answer, p.question).toBe(nums[0]! + nums[1]!);
      }
    });
  }

  it('lette historier for begyndere holder sig inden for 10', () => {
    for (let i = 0; i < N * 3; i++) {
      const p = generateLetRegneHistorie('beginner');
      expect(p.answer, p.question).toBeLessThanOrEqual(10);
    }
  });
});

describe('emoji-opgaver', () => {
  it('tælle-regning: facit passer til antal emojier for alle regnearter', () => {
    for (const fv of ['kysten', 'aabenhav'] as const) {
      for (const d of DIFFICULTIES) {
        for (const op of ['+', '-', '*', '/']) {
          for (let i = 0; i < 100; i++) {
            const p = generateEmojiCountingProblem([op], fv, d);
            const e = p.emojiData!;
            const label = `${fv} ${d}: ${e.leftCount} ${op} ${e.rightCount}`;
            expect(e.operator).toBe(op);
            expect(e.leftCount, label).toBeGreaterThan(0);
            expect(e.rightCount, label).toBeGreaterThan(0);
            const expected =
              op === '+'
                ? e.leftCount + e.rightCount
                : op === '-'
                  ? e.leftCount - e.rightCount
                  : op === '*'
                    ? e.leftCount * e.rightCount
                    : e.leftCount / e.rightCount;
            expect(p.answer, label).toBe(expected);
            expectWholeNonNegative(p.answer, label);
            expect(p.answer, label).toBeGreaterThan(0);
            expect(p.question.split(e.emoji).length - 1, label).toBe(e.leftCount + e.rightCount);
          }
        }
      }
    }
  });

  it('tælle-regning: begyndere ved Kysten får aldrig en sum over 10', () => {
    for (let i = 0; i < N * 2; i++) {
      const p = generateEmojiCountingProblem(['+'], 'kysten', 'beginner');
      expect(p.answer).toBeLessThanOrEqual(10);
    }
  });

  it('tælle-regning: ugyldige regnearter falder tilbage til plus', () => {
    const p = generateEmojiCountingProblem(['?', 'x'], 'kysten', 'beginner');
    expect(p.emojiData!.operator).toBe('+');
  });

  it('antal: facit er antallet, 1–10 for begyndere og 11–20 ellers', () => {
    for (let i = 0; i < N; i++) {
      const b = generateEmojiAntalProblem('beginner');
      expect(b.answer).toBe(b.emojiAntalData!.count);
      expect(b.answer).toBeGreaterThanOrEqual(1);
      expect(b.answer).toBeLessThanOrEqual(10);
      expect(b.question.split(b.emojiAntalData!.emoji).length - 1).toBe(b.answer);
      const x = generateEmojiAntalProblem('expert');
      expect(x.answer).toBeGreaterThanOrEqual(11);
      expect(x.answer).toBeLessThanOrEqual(20);
    }
  });

  it('flest/færrest: de to sider er aldrig lige, og den rigtige side er markeret', () => {
    for (let i = 0; i < N; i++) {
      const c = generateEmojiMostLeastProblem().emojiChoiceData!;
      expect(c.leftCount).not.toBe(c.rightCount);
      const leftWins = c.mode === 'most' ? c.leftCount > c.rightCount : c.leftCount < c.rightCount;
      expect(c.correctSide).toBe(leftWins ? 'left' : 'right');
    }
  });

  it('størst/mindst: størrelserne er forskellige, og den rigtige side er markeret', () => {
    const rank = { small: 1, medium: 2, large: 3 };
    for (let i = 0; i < N; i++) {
      const s = generateEmojiSizeCompareProblem().emojiSizeData!;
      expect(s.leftSize).not.toBe(s.rightSize);
      const leftWins =
        s.mode === 'biggest'
          ? rank[s.leftSize] > rank[s.rightSize]
          : rank[s.leftSize] < rank[s.rightSize];
      expect(s.correctSide).toBe(leftWins ? 'left' : 'right');
      expect(s.leftCount).toBeGreaterThan(0);
      expect(s.rightCount).toBeGreaterThan(0);
    }
  });

  it('lige mange: facit er forskellen mellem de to sider', () => {
    for (let i = 0; i < N; i++) {
      const p = generateEmojiEqualizeProblem();
      const e = p.emojiEqualizeData!;
      expect(p.answer).toBe(Math.abs(e.leftCount - e.rightCount));
      expect(p.answer).toBe(e.difference);
      expect(p.answer).toBeGreaterThan(0);
    }
  });

  it('lige/ulige: markeringen passer til antallet', () => {
    for (let i = 0; i < N; i++) {
      const e = generateEmojiEvenOddProblem().emojiEvenOddData!;
      expect(e.isEven).toBe(e.count % 2 === 0);
      expect(e.count).toBeGreaterThanOrEqual(1);
    }
  });

  it('mønster: det rigtige svar fortsætter mønsteret og er blandt valgmulighederne', () => {
    const cycleLength = { AB: 2, ABB: 3, AAB: 3, ABC: 3, ABAC: 4 };
    for (let i = 0; i < N; i++) {
      const d = generateEmojiPatternProblem().emojiPatternData!;
      const len = cycleLength[d.patternType];
      const full = [...d.sequence, d.correctNext];
      expect(full.length % len, d.patternType).toBe(0);
      for (let k = len; k < full.length; k++) {
        expect(full[k], `${d.patternType}: ${full.join('')}`).toBe(full[k - len]);
      }
      expect(d.choices).toContain(d.correctNext);
      expect(new Set(d.choices).size).toBe(d.choices.length);
      expect(d.choices.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('sortering: tre forskellige antal og korrekt rækkefølge', () => {
    for (let i = 0; i < N; i++) {
      const d = generateEmojiSortProblem().emojiSortData!;
      expect(d.boxes.length).toBe(3);
      expect(new Set(d.boxes.map((b) => b.count)).size).toBe(3);
      expect(new Set(d.boxes.map((b) => b.emoji)).size).toBe(3);
      expect([...d.correctOrder].sort()).toEqual([0, 1, 2]);
      const ordered = d.correctOrder.map((idx) => d.boxes[idx]!.count);
      const sorted = [...ordered].sort((a, b) => (d.mode === 'asc' ? a - b : b - a));
      expect(ordered).toEqual(sorted);
    }
  });

  it('brøkdel: præcis én valgmulighed har den rigtige værdi', () => {
    for (let i = 0; i < N; i++) {
      const d = generateEmojiFractionProblem().emojiFractionData!;
      expect(fractionValue(d.correctFraction)).toBeCloseTo(d.highlighted / d.total, 9);
      expect(new Set(d.choices).size, d.choices.join(' ')).toBe(d.choices.length);
      expect(d.choices.length).toBeGreaterThanOrEqual(3);
      const right = d.choices.filter((c) => Math.abs(fractionValue(c) - d.highlighted / d.total) < 1e-9);
      expect(right, d.choices.join(' ')).toEqual([d.correctFraction]);
    }
  });

  it('procentdel: facit er ti gange antal fremhævede', () => {
    for (let i = 0; i < N; i++) {
      const p = generateEmojiPercentProblem();
      const d = p.emojiPercentData!;
      expect(p.answer).toBe((d.highlighted / d.total) * 100);
      expect(d.correctPercent).toBe(p.answer);
      expect(p.answer).toBeGreaterThanOrEqual(10);
      expect(p.answer).toBeLessThanOrEqual(100);
    }
  });
});

describe('generateMathProblem — valg af opgavetype', () => {
  const BASIC_OP: Record<string, string> = { plus: '+', minus: '-', gange: '*', division: '/' };

  it('alle opgavetyper i hvert farvand findes i listen over opgavetyper', () => {
    const known = new Set(MATH_TYPE_DEFS.map((t) => t.id));
    for (const id of FARVAND_IDS) {
      for (const type of FARVANDE[id].allowedMathTypes) {
        expect(known.has(type), `${id}: ${type}`).toBe(true);
      }
    }
  });

  it('alle opgavetyper kan vælges i mindst ét farvand', () => {
    const used = new Set<string>(FARVAND_IDS.flatMap((id) => [...FARVANDE[id].allowedMathTypes]));
    for (const t of MATH_TYPE_DEFS) expect(used.has(t.id), t.id).toBe(true);
  });

  it('opgavetyper har unikke id’er', () => {
    const ids = MATH_TYPE_DEFS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const farvand of FARVAND_IDS) {
    it(`${farvand}: hver tilladt type giver en opgave af netop den type`, () => {
      for (const type of FARVANDE[farvand].allowedMathTypes) {
        for (const d of DIFFICULTIES) {
          for (let i = 0; i < 40; i++) {
            const p = generateMathProblem([type], d, farvand, {});
            const label = `${farvand}/${type}/${d}`;
            if (type in BASIC_OP) {
              expect(p.category, label).toBe('basic');
              expect(p.op, label).toBe(BASIC_OP[type]);
            } else {
              expect(p.category, label).toBe(type);
            }
            expect(p.question.length, label).toBeGreaterThan(0);
            expect(Number.isFinite(p.answer), `${label}: ${p.question}`).toBe(true);
            expect(p.displayType.length, label).toBeGreaterThan(0);
          }
        }
      }
    });
  }

  it('respekterer valgte regnearter for regnehistorier', () => {
    for (let i = 0; i < N; i++) {
      const p = generateMathProblem(['regnehistorier'], 'beginner', 'aabenhav', {
        regnehistorier: ['*'],
      });
      expect(p.op).toBe('*');
    }
  });

  it('respekterer valgte regnearter for emoji-tælleregning', () => {
    for (let i = 0; i < N; i++) {
      const p = generateMathProblem(['emoji-counting'], 'beginner', 'aabenhav', {
        'emoji-counting': ['/'],
      });
      expect(p.emojiData!.operator).toBe('/');
    }
  });

  it('Kysten giver kun plus og minus i emoji-tælleregning, uanset gemte valg', () => {
    for (let i = 0; i < N; i++) {
      const p = generateMathProblem(['emoji-counting'], 'beginner', 'kysten', {
        'emoji-counting': ['*', '/'],
      });
      expect(['+', '-']).toContain(p.emojiData!.operator);
    }
  });

  it('typer der ikke hører til farvandet ignoreres', () => {
    for (let i = 0; i < N; i++) {
      const p = generateMathProblem(['plus', 'equations', 'gange'], 'beginner', 'kysten', {});
      expect(p.category).toBe('basic');
      expect(p.op).toBe('+');
    }
  });

  it('uden nogen gyldige typer gives et plusstykke', () => {
    for (const types of [[], ['findes-ikke'], ['equations']]) {
      const p = generateMathProblem(types, 'beginner', 'kysten', {});
      expect(p.category).toBe('basic');
      expect(p.op).toBe('+');
    }
  });

  it('blander mellem alle valgte typer', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      seen.add(generateMathProblem(['tenfriends', 'afrunding', 'equations'], 'beginner', 'dybet', {}).category);
    }
    // tenfriends findes ikke i Dybet.
    expect([...seen].sort()).toEqual(['afrunding', 'equations']);
  });
});
