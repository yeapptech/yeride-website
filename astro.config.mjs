import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
// import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  // site: 'http://yeapptech.github.io',
  // must match CNAME — hreflang/canonical URLs in BaseLayout derive from it
  site: "https://www.yeride.com",
  // URLs the MOBILE APP promises, which this site has to answer (wayfinder
  // #44). yeride-mobile's LAUNCH_PLAN §5.4 commits to exactly two public pages
  // — `yeride.com/privacy`, linked in-app from the Profile screen and submitted
  // as the store-listing privacy URL, and `yeride.com/support`, whose absence
  // was a 2025 App Store rejection. Both 404'd until now, and yeride-mobile#123
  // blocks store submission #126 on it.
  //
  // The copy map's IA keeps /privacy-policy and /contact as the real routes, so
  // these are redirects rather than a rename: the live /privacy-policy URL is
  // already indexed, and store reviewers follow redirects. Declared here rather
  // than as files under src/pages so #41's route-parity check — which reads
  // src/pages filenames — is not asked to find an /es/ twin for an alias.
  //
  // /es/support joins them now that /es/contact exists (#39). The route-parity
  // check fails the build the moment src/pages/es/contact.astro is present
  // without it, so this pair cannot drift apart.
  redirects: {
    "/privacy": "/privacy-policy",
    "/es/privacy": "/es/privacy-policy",
    "/support": "/contact",
    "/es/support": "/es/contact",
  },
  //output: "server",
  // adapter: node({
  //   mode: 'standalone',
  // }),
});