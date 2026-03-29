import { PARROT_JOKES } from '../data/world.js';

/** Fisher–Yates; undgå at første joke er samme som sidst (som legacy `shuffleParrotJokes`). */
export function shuffleParrotJokes(lastUsedIdx: number): number[] {
  const arr = Array.from({ length: PARROT_JOKES.length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  if (arr[0] === lastUsedIdx && arr.length > 1) {
    const swapWith = 1 + Math.floor(Math.random() * (arr.length - 1));
    [arr[0], arr[swapWith]] = [arr[swapWith]!, arr[0]!];
  }
  return arr;
}
