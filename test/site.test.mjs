// The site in jsdom: every page, the docs features (colors, copy, anchors, search), titles, the legal pages,
// and the generated files (404.html, sitemap, share previews).  npm install, then npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const dom = new JSDOM('<div id="app"></div>', { url: "http://localhost/" });
const w = dom.window;
const scrolledTo = [];
w.Element.prototype.scrollIntoView = function () { scrolledTo.push(this.id); };
w.scrollTo = () => {};
const copied = [];
Object.defineProperty(w.navigator, "clipboard", { value: { writeText: async (t) => { copied.push(t); } } });
Object.assign(globalThis, {
  window: w,
  document: w.document,
  Node: w.Node,
  location: w.location,
  history: w.history,
  addEventListener: (...a) => w.addEventListener(...a),
  removeEventListener: (...a) => w.removeEventListener(...a),
  CSSStyleSheet: class { replaceSync() {} },
  // the license and brand pages read files of the site: answer from the repository folder
  fetch: async (url) => {
    const file = path.join(root, String(url).replace(/^\//, ""));
    return fs.existsSync(file) ? { ok: true, text: async () => fs.readFileSync(file, "utf8") } : { ok: false };
  },
});
document.adoptedStyleSheets = [];
// Node has its own navigator, without a clipboard: the page has to see the one of the window
Object.defineProperty(globalThis, "navigator", { value: w.navigator, configurable: true });

const M = await import("../vendor/mau/index.js");
const Site = (await import("../dist/Site.js")).default;
const docs = (await import("../src/content/docs.js")).default;
const { pages, titleFor } = await import("../src/content/pages.js");
const { highlight } = await import("../src/content/highlight.js");
const { find } = await import("../src/content/search.js");
const { slugify } = await import("../src/content/text.js");

const app = document.getElementById("app");
M.mount(app, Site);
const $ = (s) => app.querySelector(s);
const $$ = (s) => [...app.querySelectorAll(s)];
const go = async (to) => { M.navigate(to); await new Promise((r) => setTimeout(r, 30)); };
const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms));
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event("input", { bubbles: true })); };

// ---- the colorer

test("highlight: every kind of token, and nothing is lost", () => {
  const kinds = (code) => Object.fromEntries(highlight(code).filter((t) => t.k).map((t) => [t.v, t.k]));
  const k = kinds('const n = 42; // hi\n<button on:click={inc}>{#if a}"x"{/if}</button>');
  assert.equal(k.const, "k");
  assert.equal(k["42"], "n");
  assert.equal(k["// hi"], "c");
  assert.equal(k["<button"], "t");
  assert.equal(k["on:click"], "a");
  assert.equal(k["{#if"], "k");
  assert.equal(k['"x"'], "s");
  assert.equal(k["</button"], "t");
});

test("highlight: the tokens of every code sample in the docs join back to the sample", () => {
  let n = 0;
  for (const page of docs) for (const b of page.blocks) {
    if (!b.code) continue;
    assert.equal(highlight(b.code).map((t) => t.v).join(""), b.code, `${page.slug} / ${b.h}`);
    n++;
  }
  assert.ok(n > 30, "samples checked: " + n);
});

test("highlight: an arrow and a comparison are not tags", () => {
  const tags = highlight("a < b; (x) => x > 1").filter((t) => t.k === "t");
  assert.equal(tags.length, 0);
});

// ---- search and slugs

test("slugify", () => {
  assert.equal(slugify("Server setup"), "server-setup");
  assert.equal(slugify("Braces, whitespace, SVG"), "braces-whitespace-svg");
  assert.equal(slugify("router(routes, options)"), "router-routes-options");
});

test("every heading on a docs page has an id of its own", () => {
  for (const page of docs) {
    const ids = page.blocks.map((b) => slugify(b.h));
    assert.equal(new Set(ids).size, ids.length, `duplicate heading id on ${page.slug}`);
  }
});

test("search: needs two letters, all words, heading hits first", () => {
  assert.deepEqual(find("a"), []);
  assert.deepEqual(find(""), []);
  const r = find("server setup");
  assert.ok(r.length && r[0].slug === "router" && r[0].id === "server-setup", JSON.stringify(r[0]));
  assert.ok(find("signal").every((e) => e.hay.includes("signal")));
  assert.deepEqual(find("qwertyuiop"), []);
});

// ---- the pages

test("the navbar: docs, try, github, and the current page is marked", async () => {
  await go("/docs");
  assert.deepEqual($$(".links a").map((a) => a.textContent.trim()), ["docs", "try", "github ↗"]);
  assert.equal($(".links a[href='/docs']").getAttribute("aria-current"), "page");
  assert.equal($(".links a[href='/try']").getAttribute("aria-current"), null);
});

test("the tab title follows the page", async () => {
  for (const p of ["/", "/start", "/docs/router", "/try", "/about", "/brand", "/imprint", "/nope"]) {
    await go(p);
    assert.equal(document.title, titleFor(p), p);
  }
  assert.equal(titleFor("/docs/router"), "Router · mau docs");
});

test("footer: four links, three legal links, the credit links to the profile", async () => {
  await go("/");
  assert.deepEqual($$(".foot .nav a").map((a) => a.textContent.trim()), ["about", "brand", "VS Code", "website source ↗"]);
  assert.deepEqual($$(".foot .legal a").map((a) => a.textContent.trim()), ["license", "imprint", "privacy"]);
  assert.equal($(".foot .by").getAttribute("href"), "https://github.com/hexedmaya");
  for (const a of $$("a[target=_blank]")) assert.equal(a.getAttribute("rel"), "noopener");
});

test("home and start", async () => {
  await go("/");
  assert.equal($(".title").textContent, "mau.");
  assert.equal($$(".step").length, 3);
  await go("/start");
  assert.equal($$(".step").length, 6);
  assert.ok($$(".step pre.code").some((p) => p.textContent.includes("</script>")), "code with </script> is kept");
  assert.ok($(".step a[href='/docs/editor']"), "step 6 links to the editor page");
});

test("docs: every page renders, the sidebar marks it, prev and next", async () => {
  for (const [i, p] of docs.entries()) {
    await go("/docs/" + p.slug);
    assert.equal($(".doc h1").textContent, p.title);
    assert.equal($$(".blk").length, p.blocks.length, p.slug);
    assert.ok($(".side a.on").textContent.includes(p.title));
    assert.equal($$(".pager a").length, (i > 0) + (i < docs.length - 1));
  }
  await go("/docs/nope");
  assert.equal($(".doc h1").textContent, "404");
});

test("docs: code samples are colored, and the text is unchanged", async () => {
  await go("/docs/templates");
  const block = $(".cb");
  assert.ok(block.querySelectorAll("span[class^='t-']").length > 3);
  assert.ok(block.querySelector(".t-t"), "a tag is colored");
  assert.equal(block.querySelector("pre").textContent, docs.find((d) => d.slug === "templates").blocks[0].code);
});

test("docs: the order of the sidebar, and every internal link in the guides goes to a page", () => {
  assert.deepEqual(docs.map((d) => d.slug).slice(0, 3), ["tutorial", "templates", "reactivity"]);
  assert.equal(docs.at(-1).slug, "changelog");
  const known = new Set(["/", "/start", "/try", "/licenses", "/brand-policy", ...docs.map((d) => "/docs/" + d.slug)]);
  for (const page of docs) for (const b of page.blocks) for (const text of b.p ?? []) {
    for (const m of text.matchAll(/\]\((\/[^)#]*)/g)) assert.ok(known.has(m[1]), page.slug + ": " + m[1]);
  }
});

test("docs: a copy button puts the sample on the clipboard", async () => {
  await go("/docs/reactivity");
  const first = docs.find((d) => d.slug === "reactivity").blocks.find((b) => b.code);
  const btn = $(".cb .copy");
  assert.equal(btn.textContent, "copy");
  btn.click();
  await wait();
  assert.equal(copied.at(-1), first.code);
  assert.equal(btn.textContent, "copied");
});

test("docs: headings are anchors", async () => {
  await go("/docs/router");
  const h = $("h2#server-setup");
  assert.ok(h, "heading has its id");
  assert.equal(h.querySelector("a.anchor").getAttribute("href"), "#server-setup");
});

test("search box: results link to the section, a click opens the page and scrolls to it", async () => {
  await go("/docs/templates");
  type($(".search input"), "server setup");
  await wait();
  const hit = $(".hits a[href='/docs/router#server-setup']");
  assert.ok(hit, "hit found: " + $$(".hits a").map((a) => a.getAttribute("href")).join(", "));
  scrolledTo.length = 0;
  hit.click();
  await wait(60);
  assert.equal(location.pathname, "/docs/router");
  assert.equal(location.hash, "#server-setup");
  assert.equal(scrolledTo.at(-1), "server-setup", "scrolled to the section");
  assert.equal($(".search input").value, "", "the box is cleared");
  type($(".search input"), "qwertyuiop");
  await wait();
  assert.ok($(".search .none"), "nothing-found message");
});

test("a page without an anchor starts at the top", async () => {
  await go("/docs/router");
  scrolledTo.length = 0;
  await go("/try");
  assert.equal(scrolledTo.length, 0);
});

test("try: live list with svg bars", async () => {
  await go("/try");
  assert.equal($$(".inst li").length, 4);
  assert.equal($(".inst .fill").namespaceURI, "http://www.w3.org/2000/svg");
});

test("license pages read the LICENSE files, with tabs", async () => {
  await go("/licenses");
  await wait(60);
  assert.deepEqual($$(".tabs a").map((a) => a.textContent), ["mau License", "Website License", "Brand Policy"]);
  assert.equal($(".sub").textContent, "mau License 1.0");
  assert.ok($$(".md h3").length > 20, "sections rendered");
  await go("/licenses/website");
  await wait(60);
  assert.equal($(".sub").textContent, "mau Website License 1.0");
});

test("brand page: four logos, nine downloads, link to the policy", async () => {
  await go("/brand");
  await wait(60);
  assert.equal($$(".tile").length, 4);
  assert.equal($$(".files li").length, 9);
  for (const a of $$(".files a")) assert.ok(fs.existsSync(path.join(root, a.getAttribute("href"))), a.getAttribute("href"));
  assert.equal($(".policy a").getAttribute("href"), "/brand-policy");
});

test("brand policy page: its own address, read from BRAND-POLICY.md", async () => {
  await go("/brand-policy");
  await wait(60);
  assert.equal($(".head").textContent, "license");
  assert.equal($(".sub").textContent, "mau Brand Policy 1.0");
  assert.ok($$(".md h3").length > 5, "policy rendered");
  assert.equal($(".tabs a.on").textContent, "Brand Policy");
});

test("imprint and privacy", async () => {
  await go("/imprint");
  assert.match($(".md").textContent, /Moers/);
  await go("/privacy");
  assert.ok($$(".md h3").length >= 5);
});

test("unknown address: the not-found page", async () => {
  await go("/nowhere/at/all");
  assert.equal($(".nf h1").textContent, "404");
});

// ---- generated files

test("every page has its own html file with title, description and preview image", () => {
  for (const p of pages) {
    const file = p.path === "/" ? "index.html" : path.join(...p.path.split("/").filter(Boolean), "index.html");
    const html = read(file);
    assert.match(html, /<script type="module" src="\/dist\/main\.js"><\/script>/, file);
    assert.ok(html.includes(`<title>${p.title.replace(/&/g, "&amp;")}</title>`), file);
    assert.match(html, /property="og:image" content="https:\/\/[^"]+\/assets\/brand\/png\/mau-social-1280x640\.png"/, file);
    assert.match(html, /name="twitter:card" content="summary_large_image"/, file);
    assert.match(html, /rel="canonical"/, file);
  }
});

test("404.html is for unknown addresses and must not be indexed", () => {
  const html = read("404.html");
  assert.match(html, /name="robots" content="noindex"/);
  assert.ok(!html.includes('rel="canonical"'));
});

test("sitemap and robots", () => {
  const sitemap = read("sitemap.xml");
  assert.equal((sitemap.match(/<loc>/g) ?? []).length, pages.length);
  assert.match(sitemap, /<loc>https:\/\/[^<]+\/docs\/router\/<\/loc>/);
  assert.match(read("robots.txt"), /Sitemap: https:\/\/[^\s]+\/sitemap\.xml/);
});

test("the files the pages link to exist", () => {
  for (const f of ["favicon.svg", "assets/favicon-32.png", "assets/apple-touch-icon.png", "assets/base.css", "dist/main.js", "vendor/mau/index.js"]) {
    assert.ok(fs.existsSync(path.join(root, f)), f);
  }
});

// ---- playground

test("playground: the editor starts with the example, the compiler runs in the page", async () => {
  await go("/playground");
  const { example } = await import("../src/content/playground.js");
  assert.equal($(".editor").value, example);
  assert.equal($(".err"), null);
  assert.deepEqual($$(".tabs button").map((b) => b.textContent), ["preview", "generated js"]);
  assert.equal($(".frame").getAttribute("src"), "/playground/frame.html");
});

test("playground: share links carry the code, also with umlauts and emoji", async () => {
  const { encode, decode, fromHash } = await import("../src/content/share.js");
  const text = "<p>Grüße 🐈 {n()}</p>\n<script>const n = signal(1);</script>";
  assert.equal(decode(encode(text)), text);
  assert.match(encode(text), /^[A-Za-z0-9_-]+$/, "safe in an address");
  assert.equal(fromHash("#code=" + encode(text)), text);
  assert.equal(fromHash("#other"), null);
  assert.equal(fromHash("#code=***"), null);
  assert.equal(decode("%%%"), null);
});

test("playground: a shared link fills the editor", async () => {
  const { encode } = await import("../src/content/share.js");
  const text = "<p>from a link</p>\n";
  await go("/"); // a new page load, as when the link is opened
  await go("/playground#code=" + encode(text));
  assert.equal($(".editor").value, text);
  await go("/");
  await go("/playground");
  const { example } = await import("../src/content/playground.js");
  assert.equal($(".editor").value, example);
});

test("playground: an error shows the line and a mark under the column", async () => {
  const { withContext } = await import("../src/content/share.js");
  assert.equal(withContext("x.mau:3:5: oops", "a\nb\nabcdefg", 3, 5), "x.mau:3:5: oops\n\n  3 | abcdefg\n    |     ^");
  assert.equal(withContext("no position", "a", undefined, undefined), "no position");
  assert.equal(withContext("past the end", "a", 9, 1), "past the end");
});

test("playground: every example compiles, the list loads one, reset goes back", async () => {
  const { examples, example } = await import("../src/content/playground.js");
  const { compile } = await import("../vendor/mau/compiler/compile.js");
  for (const x of examples) assert.doesNotThrow(() => compile(x.code, { file: "x.mau", runtime: "/vendor/mau/index.js" }), x.name);
  await go("/playground");
  const pick = $(".pick");
  assert.equal(pick.querySelectorAll("option").length, examples.length + 1);
  pick.value = "counter";
  pick.dispatchEvent(new w.Event("change", { bubbles: true }));
  assert.equal($(".editor").value, examples.find((x) => x.name === "counter").code);
  assert.equal(pick.value, "", "the list goes back to its label");
  await wait(300);
  assert.equal($(".err"), null);
  $$(".tool").find((b) => b.textContent === "reset").click();
  assert.equal($(".editor").value, example);
});

test("playground: the generated js shows in the second tab", async () => {
  await go("/playground");
  $$(".tabs button")[1].click();
  await wait();
  const code = $(".gen pre").textContent;
  assert.match(code, /export default function Playground/);
  assert.ok(code.includes(location.origin + "/vendor/mau/index.js"), "the runtime is a full address, a blob module needs that");
  assert.equal($(".frame").hasAttribute("hidden"), true);
  $$(".tabs button")[0].click();
  await wait();
  assert.equal($(".frame").hasAttribute("hidden"), false);
});

test("playground: a mistake shows the error with file:line:col, and fixing it removes it", async () => {
  await go("/playground");
  type($(".editor"), "<div>\n  <p>\n</div>");
  await wait();
  assert.match($(".err").textContent, /^Playground\.mau:3:1: expected <\/p>/);
  type($(".editor"), "<p>fine</p>");
  await wait();
  assert.equal($(".err"), null);
});

test("playground: Tab writes two spaces and stays in the box", async () => {
  await go("/playground");
  const box = $(".editor");
  type(box, "ab");
  box.setSelectionRange(1, 1);
  const ev = new w.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
  box.dispatchEvent(ev);
  assert.equal(ev.defaultPrevented, true);
  assert.equal(box.value, "a  b");
});

test("the preview frame page: its own policy allows blob:, and only this page", () => {
  const frame = read("playground/frame.html");
  assert.match(frame, /script-src 'self' blob:/);
  assert.match(frame, /name="robots" content="noindex"/);
  assert.ok(!read("index.html").includes("blob:"), "the pages of the site do not allow blob:");
  assert.match(read("playground/index.html"), /frame-src 'self'/, "the playground page may frame its own preview");
  assert.ok(fs.existsSync(path.join(root, "vendor/mau/compiler/compile.js")));
  assert.ok(fs.existsSync(path.join(root, "dist/playground-frame.js")));
});
