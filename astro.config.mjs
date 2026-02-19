// @ts-check
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: 'https://ivandeliver.email',
  
  // Режим сервера для работы API-роутов и использования секретов
  output: 'server',

  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    // Используем встроенный сервис Cloudflare для оптимизации изображений
    imageService: 'cloudflare',
    // Отключаем поиск SESSION KV для чистоты логов
    persistedStoredValues: false 
  }),
  
  integrations: [
    react(),
    sitemap()
  ],

  build: {
    // Инлайним CSS для устранения Render-blocking и улучшения LCP
    inlineStylesheets: 'always'
  },
  
  env: {
    schema: {
      // Ключ для Spamhaus DQS — СТРОГО secret и только context: server
      SPAMHAUS_DQS_KEY: envField.string({ context: "server", access: "secret" }),
    },
  },
});