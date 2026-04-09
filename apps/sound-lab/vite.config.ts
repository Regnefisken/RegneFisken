import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(root, '../..');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@regnefisken/audio-engine': path.join(repoRoot, 'src/audio/audioEngine.ts'),
      '@regnefisken/audio-data': path.join(repoRoot, 'src/data/audio.ts'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
});
