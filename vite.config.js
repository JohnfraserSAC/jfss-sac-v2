import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { toUpstreamAuthTokenPath } from './src/lib/supabaseAuthProxy.js'

// School Wi-Fi blocks *.supabase.co. The Vite process runs on this laptop, so
// proxy through the public site (Vercel) instead of calling Supabase directly.
const DEV_PROXY_ORIGIN = 'https://www.johnfrasersac.com'

const supabaseProxy = {
  '/api/sf/go': {
    target: DEV_PROXY_ORIGIN,
    changeOrigin: true,
    rewrite: (path) => `/supabase${toUpstreamAuthTokenPath(path)}`,
  },
  '/supabase': {
    target: DEV_PROXY_ORIGIN,
    changeOrigin: true,
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
