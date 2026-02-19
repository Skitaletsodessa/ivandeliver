// @ts-check
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: 'https://ivandeliver.email',
  output: 'server',

  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    imageService: 'cloudflare',
    // Мы явно отключаем сессии KV, чтобы не лезла ошибка "Invalid binding SESSION"
    runtime: { mode: 'complete', type: 'pages' }
  }),
  
  integrations: [
    react(),
    sitemap()
  ],

  build: {
    inlineStylesheets: 'always'
  },
  
  env: {
    schema: {
      // Ключ для Spamhaus DQS
      SPAMHAUS_DQS_KEY: envField.string({ 
        context: "server", 
        access: "secret",
        optional: true // Делаем его опциональным, чтобы билд не падал, если переменная не подтянулась сразу
      }),
    },
  },
});