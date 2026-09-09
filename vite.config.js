import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const SUPABASE_UPSTREAM = 'https://nvpxsuafdcrobnackhnd.supabase.co'

const supabaseProxy = {
  '/supabase': {
    target: SUPABASE_UPSTREAM,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/supabase/, ''),
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: supabaseProxy,
  },
  preview: {
    proxy: supabaseProxy,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
