// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

// Demo URL on Cloudflare Pages. Change to the real domain when the client buys it.
const SITE_URL = process.env.SITE_URL ?? 'https://dosman-web.pages.dev'

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !/\/(admin|checkout|pedido|offline)/.test(page),
    }),
  ],
  vite: { plugins: [tailwindcss()] },
})
