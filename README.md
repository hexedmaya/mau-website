# mau-website

The website and docs of mau, built with mau itself. Every page is a `.mau` component. The docs text lives in `src/content/docs.js`.

```
index.html          the page, with a strict Content-Security-Policy
<page>/index.html   one small file per page with its own share preview (generated)
build-pages.mjs     writes those files
dev-server.mjs      a tiny server: every page has a file, everything else is a 404
deploy/             an example nginx configuration
404.html            shown for every address that is not a page (generated)
main.js             mounts the site
src/
  Site.mau          layout, navigation and routes
  pages/            Home, Docs, Try, About, NotFound
  components/       Hero, Features, Footer
  content/docs.js   the text of the docs pages
assets/brand/       logo, icon and PNG variants
BRAND-POLICY.md     how the mau name and logo may be used (shown on the brand page)
vendor/mau/         a copy of the mau runtime
```

The `.js` file next to each `.mau` file is generated and committed.

## Run it

The site uses real paths (`/docs/router`). Every page has its own small `index.html`, so a normal static server is enough. This repo has a small one that also shows `404.html` for unknown addresses:

```
node dev-server.mjs          # http://localhost:8080
```

`python -m http.server` opens `/docs/router/` as well, but it shows its own 404 page instead of ours.

## Change it

After editing a `.mau` file, compile with the compiler from the mau repo:

```
node ../mau/compiler/cli.js src --runtime ./vendor/mau/index.js
```

Add `--watch` while you work.

## Deploy

The site is plain files: upload the whole folder, no build step. It needs a server that

- serves `<page>/index.html` for `/<page>/` and redirects `/<page>` to it,
- answers everything that is not a file with a real 404 that shows `404.html`.

`deploy/nginx.example.conf` is an example for nginx behind Cloudflare, as `mau.melloo.me` runs. It is an example and has not been run against a live server. `node dev-server.mjs` behaves the same way on your machine.

## Share previews

Chat apps like Discord do not run JavaScript. They read the HTML of the link. So every page has its own small `index.html` with a title, a description, a theme color and a preview image (Open Graph and Twitter tags). They are generated from `src/content/pages.js`:

```
node build-pages.mjs
```

The image and the page addresses in those tags need the public address of the site. It defaults to `https://mau.melloo.me`. If the site lives somewhere else:

```
SITE_URL=https://example.com node build-pages.mjs
```

It also writes `404.html`. Run it again whenever you add a page or a docs page, and commit the result.

## `vendor/mau`

A copy of the mau runtime (`index.js`, `reactive.js`, `dom.js`, `router.js`), so this repo runs on its own. To update it, copy those four files from the mau repo and compile again.

## License

mau Website License 1.0, see [LICENSE](LICENSE). It covers the website: its code, design, text and graphics.

The runtime in `vendor/mau` is a copy of mau itself and stays under the mau License 1.0, see [vendor/mau/LICENSE](vendor/mau/LICENSE).
