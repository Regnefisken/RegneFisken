import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    /** Hoved-bundle kan stadig >900 kB; three-core/drei er nu adskilt (plan #9). */
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (/node_modules[/\\]three[/\\]/.test(id)) {
            return 'three-core'
          }

          if (id.includes('@react-three/fiber')) {
            return 'three-fiber'
          }

          if (id.includes('@react-three/drei') || id.includes('three-stdlib')) {
            return 'three-drei'
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
