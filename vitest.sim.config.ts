import { defineConfig } from 'vitest/config';

/** Konfiguration til balance-simulatoren (`npm run sim`). Holdes adskilt fra de almindelige tests. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/balance/**/*.sim.ts'],
    testTimeout: 30 * 60 * 1000,
  },
});
