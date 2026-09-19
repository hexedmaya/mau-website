// Writes one small index.html per page (index.html, docs/index.html, docs/router/index.html, ...) and 404.html.
// Chat apps and search engines do not run JavaScript. They read the HTML of the address they get, so every
// page needs its own title, description and preview image in its HTML. The app itself is the same everywhere.
//
//   node build-pages.mjs                       # uses SITE_URL or https://mau.melloo.me
//   SITE_URL=https://example.com node build-pages.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pages } from "./src/content/pages.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const SITE = (process.env.SITE_URL ?? "https://mau.melloo.me").replace(/\/+$/, "");
const IMAGE = `${SITE}/assets/brand/png/mau-social-1280x640.png`;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const html = ({ path: p, title, description, notFound }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#ff4b1f">
${notFound ? `  <meta name="robots" content="noindex">` : `  <link rel="canonical" href="${SITE}${p === "/" ? "/" : p + "/"}">`}
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="mau">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
${notFound ? "" : `  <meta property="og:url" content="${SITE}${p === "/" ? "/" : p + "/"}">\n`}
  <meta property="og:image" content="${IMAGE}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1280">
  <meta property="og:image:height" content="640">
  <meta property="og:image:alt" content="mau, Make A UI. A small frontend framework.">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${IMAGE}">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/main.js"></script>
</body>
</html>
`;

let n = 0;
for (const page of pages) {
  const dir = page.path === "/" ? root : path.join(root, ...page.path.split("/").filter(Boolean));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html(page));
  n++;
}
// 404.html: the server sends it, with the status 404, for every address that is not a page. The app shows its not-found page.
fs.writeFileSync(path.join(root, "404.html"), html({ path: "/404", title: "Not found · mau", description: "This page does not exist.", notFound: true }));

console.log(`${n} pages and 404.html written for ${SITE}`);
