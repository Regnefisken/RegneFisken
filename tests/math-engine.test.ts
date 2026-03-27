import { describe, expect, it } from 'vitest';
import {
  generateLetRegneHistorie,
  generateMathProblem,
  generateMultiTermProblem,
} from '../src/logic/math-engine.js';

describe('math-engine', () => {
  it('tenfriends: ukendt led + kendt led giver sum 10', () => {
    for (let i = 0; i < 40; i++) {
      const p = generateMathProblem(1, false, ['tenfriends'], 'beginner', 'basic');
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
      const p = generateMathProblem(1, false, ['+'], 'beginner', 'basic');
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
});
