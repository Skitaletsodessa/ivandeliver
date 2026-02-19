// @ts-check
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: 'https://ivandeliver.email',
  
  // Режим сервера для API (Spotify)
  output: 'server',

  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    // Используем встроенный сервис Cloudflare для картинок
    imageService: 'cloudflare',
    // Отключаем поиск SESSION KV, чтобы убрать лишние ворнинги в логах
    persistedStoredValues: false 
  }),
  
  integrations: [
    react(),
    sitemap()
  ],

  build: {
    // Решает проблему "Render blocking requests": инлайнит CSS прямо в HTML, 
    // так как файл стилей у тебя крошечный. Это ускорит LCP.
    inlineStylesheets: 'always'
  },
  
  env: {
    schema: {
      CLIENT_ID: envField.string({ context: "server", access: "secret" }),
      CLIENT_SECRET: envField.string({ context: "server", access: "secret" }),
      REFRESH_TOKEN: envField.string({ context: "server", access: "secret" }),
    },
  },
});