# mau-website

The website and docs of mau, built with mau itself. Every page is a `.mau` component. The docs text lives in `src/content/docs.js`.

```
index.html          the page, with a strict Content-Security-Policy
main.js             mounts the site
src/
  Site.mau          layout, navigation and routes
  pages/            Home, Docs, Try, About, NotFound
  components/       Hero, Features, Footer
  content/docs.js   the text of the docs pages
brand/              logo, icon and PNG variants
BRAND-POLICY.md     how the mau name and logo may be used (shown on the brand page)
vendor/mau/         a copy of the mau runtime
```

The `.js` file next to each `.mau` file is generated and committed.

## Run it

Any static server, from this folder:

```
python -m http.server 8000
```

Then open http://localhost:8000/

## Change it

After editing a `.mau` file, compile with the compiler from the mau repo:

```
node ../mau/compiler/cli.js src --runtime ./vendor/mau/index.js
```

Add `--watch` while you work.

## `vendor/mau`

A copy of the mau runtime (`index.js`, `reactive.js`, `dom.js`, `router.js`), so this repo runs on its own. To update it, copy those four files from the mau repo and compile again.

## License

mau Website License 1.0, see [LICENSE](LICENSE). It covers the website: its code, design, text and graphics.

The runtime in `vendor/mau` is a copy of mau itself and stays under the mau License 1.0, see [vendor/mau/LICENSE](vendor/mau/LICENSE).
