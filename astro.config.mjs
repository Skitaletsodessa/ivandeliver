import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: 'https://ivandeliver.email',
  output: 'server',

  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: 'cloudflare',
    persistedStoredValues: false 
  }),
  
  integrations: [
    react(),
    sitemap()
  ],

  build: {
    inlineStylesheets: 'always'
  }
});