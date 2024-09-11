import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
// import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  // site: 'http://yeapptech.github.io',
  site: "https://yeride.com",
  // output: "server",
  // adapter: node({
  //   mode: 'standalone',
  // }),
});