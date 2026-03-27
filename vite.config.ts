import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    /** three + R3F er >500 kB minificeret selv alene; grænsen hæves efter opdeling i egne chunks. */
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (
            id.includes('@react-three/fiber') ||
            id.includes('@react-three/drei') ||
            /node_modules[/\\]three[/\\]/.test(id) ||
            id.includes('three-stdlib')
          ) {
            return 'three-vendor'
          }

          if (
            /node_modules[/\\]react[/\\]/.test(id) ||
            /node_modules[/\\]react-dom[/\\]/.test(id) ||
            /node_modules[/\\]zustand[/\\]/.test(id)
          ) {
            return 'react-vendor'
          }
        },
      },
    },
  },
})
