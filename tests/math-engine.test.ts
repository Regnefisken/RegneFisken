import { describe, expect, it } from 'vitest';
import {
  generateEmojiDoubleProblem,
  generateEmojiFractionProblem,
  generateEmojiHalfProblem,
  generateLetRegneHistorie,
  generateMathProblem,
  generateMultiTermProblem,
} from '../src/logic/math-engine.js';

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
