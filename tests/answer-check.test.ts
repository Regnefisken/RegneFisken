import { describe, expect, it } from 'vitest';
import { numericAnswerOk } from '../src/logic/answer-check.js';

describe('numericAnswerOk', () => {
  it('godkender det rigtige tal', () => {
    expect(numericAnswerOk('7', 7)).toBe(true);
    expect(numericAnswerOk(' 7 ', 7)).toBe(true);
    expect(numericAnswerOk('120', 120)).toBe(true);
  });

  it('afviser et forkert tal', () => {
    expect(numericAnswerOk('8', 7)).toBe(false);
    expect(numericAnswerOk('-7', 7)).toBe(false);
  });

  it('godkender decimaltal med både komma og punktum', () => {
    expect(numericAnswerOk('3,5', 3.5)).toBe(true);
    expect(numericAnswerOk('3.5', 3.5)).toBe(true);
    expect(numericAnswerOk('0,25', 0.25)).toBe(true);
    expect(numericAnswerOk('3,6', 3.5)).toBe(false);
  });

  it('godkender 0 når facit er 0', () => {
    expect(numericAnswerOk('0', 0)).toBe(true);
    expect(numericAnswerOk('0,0', 0)).toBe(true);
  });

  it('et tomt svar er aldrig rigtigt — heller ikke når facit er 0', () => {
    expect(numericAnswerOk('', 0)).toBe(false);
    expect(numericAnswerOk('   ', 0)).toBe(false);
    expect(numericAnswerOk('', 5)).toBe(false);
  });

  it('afviser tekst og halve indtastninger', () => {
    expect(numericAnswerOk('abc', 0)).toBe(false);
    expect(numericAnswerOk(',', 0)).toBe(false);
    expect(numericAnswerOk('-', 0)).toBe(false);
    expect(numericAnswerOk('1,2,3', 1.2)).toBe(false);
  });
});
