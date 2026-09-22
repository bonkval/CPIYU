import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'

const faviconDataUrl = `data:image/svg+xml;base64,${readFileSync(
  new URL('./public/favicon.svg', import.meta.url),
).toString('base64')}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'inline-project-favicon',
      transformIndexHtml: (html) => html.replace('/favicon.svg', faviconDataUrl),
    },
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
