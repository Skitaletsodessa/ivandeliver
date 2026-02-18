// @ts-check
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: 'https://ivandeliver.email',
  
  // 1. Указываем режим сервера, так как у тебя есть API (Spotify) и секреты
  output: 'server',

  // 2. Настраиваем адаптер
  adapter: cloudflare({
    // Включаем прокси для локальной разработки (чтобы работали env секреты)
    platformProxy: {
      enabled: true,
    },
    // Используем встроенный сервис Cloudflare для оптимизации изображений вместо Sharp
    imageService: 'cloudflare'
  }),
  
  integrations: [
    react(),
    sitemap()
  ],
  
  env: {
    schema: {
      CLIENT_ID: envField.string({ context: "server", access: "secret" }),
      CLIENT_SECRET: envField.string({ context: "server", access: "secret" }),
      REFRESH_TOKEN: envField.string({ context: "server", access: "secret" }),
    },
  },
});