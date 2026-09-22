import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), ...(process.env.SINGLE_FILE ? [viteSingleFile()] : [])],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
