// Content of the docs pages. Backticks in a paragraph mark inline code.
import { links } from "./links.js";
import { tutorial, recipes, deploy, faq, troubleshooting, changelog } from "./docs-guides.js";

const core = [
  {
    slug: "templates",
    title: "Templates",
    intro: "The markup part of a .mau file is HTML with a few additions in curly braces.",
    blocks: [
      {
        h: "Three parts, one root",
        p: [
          "A file can have a `<script>`, one root element and a `<style>`. Any of the three may be left out. There must be exactly one root element.",
        ],
        code: `<script> ... </script>

<section class="card">
  ...
</section>

<style> ... </style>`,
      },
      {
        h: "Expressions",
        p: [
          "`{expr}` puts a JavaScript expression into text or into an attribute. It re-runs when a signal it reads changes, and only that spot is updated.",
          "Attribute values can be `\"text\"`, `\"text {mixed} in\"` or a single `{expression}`.",
        ],
        code: `<p>{n()} doubled is {n() * 2}</p>
<div class="box {open() ? 'open' : ''}">
<button disabled={n() >= 3}>max</button>`,
      },
      {
        h: "Events",
        p: [
          "`on:event={handler}` takes a function. Event names are lowercased. A handler can write several signals: they run inside `batch()`, so the page updates once.",
        ],
        code: `<button on:click={inc}>+1</button>
<input on:keydown={(e) => e.key === "Enter" && add()}>`,
      },
      {
        h: "Bindings",
        p: [
          "`bind:value` and `bind:checked` keep an input and a signal in sync. The signal must be passed as it is, not called.",
          "On a number or range input (`type=number`, `type=range`) the signal gets a number, or `null` while the field is empty. On a `select` it gets the value of the chosen option.",
          "`bind:group` ties radio buttons to one signal, which holds the value of the selected one. Checkbox groups are not supported yet.",
        ],
        code: `<input bind:value={name}>
<input type="number" bind:value={count}>
<input type="checkbox" bind:checked={agreed}>

<select bind:value={size}>
  <option value="s">small</option>
  <option value="l">large</option>
</select>

<input type="radio" value="s" bind:group={size}>
<input type="radio" value="l" bind:group={size}>`,
      },
      {
        h: "Conditions",
        p: [
          "Only the condition is watched. The branch itself is built once and not rebuilt when a signal inside it changes.",
        ],
        code: `{#if n() > 2}
  <p>a lot</p>
{:else if n() > 0}
  <p>some</p>
{:else}
  <p>none</p>
{/if}`,
      },
      {
        h: "Lists",
        p: [
          "`{#each list as item (key)}` renders a row per entry. With a key, rows are moved instead of rebuilt.",
          "With a plain `item` (or `item, i`), a new object for the same key updates the row in place. That keeps polled data cheap: the DOM nodes stay, only changed values are written. A destructuring pattern like `{ a, b }` rebuilds the row instead.",
          "Duplicate keys print a warning, and the later rows are kept apart so every row can still be removed. A row that shows its index (`item, i`) is built again when the index changes, for example after a reorder. Plain values such as strings are rebuilt when they change.",
        ],
        code: `{#each instances() as i (i.id)}
  <li>{i.name} {i.cpu}%</li>
{/each}`,
      },
      {
        h: "Raw HTML",
        p: [
          "Text is always inserted as text. The only way to insert HTML is `{@html expr}`. Use it for markup you trust, never for user input.",
        ],
        code: `<p>{@html renderedMarkdown}</p>`,
      },
      {
        h: "Braces, whitespace, SVG",
        p: [
          "Write `\\{` and `\\}` for a literal brace, in text and in attribute strings.",
          "Whitespace is collapsed, except inside `<pre>` and `<textarea>`.",
          "SVG tags such as `svg`, `path` and `g` are created in the SVG namespace. Inside an `<svg>`, `a` and `title` are SVG elements too.",
        ],
        code: `<p>use \\{name\\} in your text</p>
<svg viewBox="0 0 10 10">
  <title>tooltip</title>
  <path d="M0 0L10 10" />
</svg>`,
      },
    ],
  },

  {
    slug: "reactivity",
    title: "Reactivity",
    intro: "Small signals and a small scheduler. All of these are in scope inside a script block.",
    blocks: [
      {
        h: "signal",
        p: [
          "A signal holds a value. Call it to read, use `.set` to write. `.set` also takes a function, and writing the same value does nothing. `.peek()` reads without subscribing.",
        ],
        code: `const n = signal(0);
n();                    // 0
n.set(5);
n.set((v) => v + 1);    // 6
n.peek();               // read without tracking`,
      },
      {
        h: "computed",
        p: ["A value derived from other signals. It is read like a signal."],
        code: `const double = computed(() => n() * 2);
double();`,
      },
      {
        h: "effect",
        p: [
          "Runs now and again whenever a signal it read changes. It returns a function that stops it. If the effect function returns a function, that runs before the next run and when the effect stops.",
        ],
        code: `const stop = effect(() => {
  document.title = "n = " + n();
  return () => console.log("cleanup");
});`,
      },
      {
        h: "untracked",
        p: ["Reads signals without subscribing to them."],
        code: `effect(() => {
  console.log(a(), untracked(() => b()));  // re-runs on a, not on b
});`,
      },
      {
        h: "batch",
        p: [
          "Several writes, one round of updates. Event handlers in a template are already batched. Code that starts somewhere else, such as a socket, a timer or a fetch, should wrap writes that belong together.",
          "A batch only covers code up to the first `await`.",
        ],
        code: `socket.onmessage = (e) => {
  const m = JSON.parse(e.data);
  batch(() => {
    cpu.set(m.cpu);
    ram.set(m.ram);
  });
};`,
      },
      {
        h: "No glitches",
        p: [
          "Updates never show half-changed state. Effects run oldest first, and a derived value always exists before whatever reads it. An effect that reads two computed values built from the same signal runs once, with both new, never with one old and one new.",
          "Each write flushes at once. Two separate writes are two updates, so use `batch` when they belong together.",
        ],
        code: `const n = signal(1);
const a = computed(() => n() * 2);
const b = computed(() => n() * 3);

effect(() => console.log(a(), b()));   // 2 3
n.set(2);                              // 4 6, once`,
      },
      {
        h: "Cleanup",
        p: [
          "Effects belong to the component or effect that created them and stop with it. Effects created inside an effect are stopped before it runs again. Use `onDestroy` for timers and listeners.",
        ],
        code: `const timer = setInterval(tick, 1000);
onDestroy(() => clearInterval(timer));`,
      },
      {
        h: "Endless loops",
        p: [
          "An effect that writes a signal it also reads would run forever. mau stops it with an error that says so: \"effects keep triggering each other\".",
        ],
      },
    ],
  },

  {
    slug: "components",
    title: "Components",
    intro: "A component is a .mau file. It compiles to a function that returns one DOM node.",
    blocks: [
      {
        h: "Use one",
        p: [
          "Import the compiled `.js` file and use it as a capitalized tag. Import paths are relative to the compiled file.",
        ],
        code: `<script>
  import Item from "./Item.js";
</script>

<ul>
  <Item label="one" />
  <Item label={name()} />
</ul>`,
      },
      {
        h: "Props",
        p: [
          "Inside the component everything passed in is on `props`. A prop with an expression is live: `{props.ping}` in the markup follows the parent's expression, so `<Card ping={player.ping} />` updates when the player changes.",
          "Reading a prop once in the script, for example `const { id } = props`, is a snapshot. That is fine for values that never change.",
        ],
        code: `<!-- Item.mau -->
<script>
  const { id } = props;          // snapshot of a constant
</script>

<li>{props.label}: {props.ping}</li>   <!-- live -->`,
      },
      {
        h: "Children",
        p: ["Content between the tags arrives as `props.children`. Put it where it belongs with an expression."],
        code: `<!-- Card.mau -->
<div class="card">{props.children}</div>

<!-- use -->
<Card><p>hello</p></Card>`,
      },
      {
        h: "Lifecycle",
        p: [
          "There is no separate setup call: the script block runs when the component is built. `onDestroy` runs when it is removed. `mount` returns a function that destroys everything it built.",
        ],
        code: `const destroy = mount(el, Counter);
destroy();`,
      },
      {
        h: "Reserved names",
        p: [
          "These are always in scope: `signal`, `computed`, `effect`, `untracked`, `batch`, `onDestroy`, `router`, `route`, `navigate` and `props`. Names that start with `__` belong to the compiler.",
        ],
      },
    ],
  },

  {
    slug: "styles",
    title: "Styles",
    intro: "Short CSS next to the markup, kept inside the component.",
    blocks: [
      {
        h: "Scoped by default",
        p: [
          "A rule in the style block only matches elements that this component's template creates. `:scope` is the root element of the component.",
        ],
        code: `<style>
  :scope { border: 2px solid; padding: 1rem; }
  b { color: orangered; }
</style>`,
      },
      {
        h: "Children of other components",
        p: [
          "A rule never reaches into a child component. `b { ... }` styles the `b` elements of this file, not the ones inside `<Card />`. Elements you write between the tags of a child, like the `<p>` in `<Card><p>hi</p></Card>`, are yours, so your rules apply to them.",
          "Every part of a selector gets one more attribute selector, so a rule is a little more specific than it looks. CSS nesting is not supported.",
        ],
      },
      {
        h: "Reaching outside on purpose",
        p: [
          "Wrap a selector in `:global(...)` to leave it as it is. Use it for something a child renders that you cannot change, or for a class that a parent sets.",
        ],
        code: `<style>
  /* the .md box inside a child component */
  :scope :global(.md h3) { color: orangered; }
  /* a class on an element above this component */
  :global(.dark) :scope { --ink: #efeadc; }
</style>`,
      },
      {
        h: "Design tokens",
        p: [
          "Custom properties are inherited, so a root component can define colors and spacing for everything under it. This site does exactly that.",
        ],
        code: `<style>
  :scope { --ink: #141414; --accent: #ff4b1f; }
  @media (prefers-color-scheme: dark) {
    :scope { --ink: #efeadc; }
  }
</style>`,
      },
      {
        h: "Browser support",
        p: [
          "Scoped styles use constructed stylesheets and attribute selectors, which every current browser has: Chrome and Edge 79, Firefox 101, Safari 16.4 or newer. In an older browser the styles of a component are not applied.",
        ],
      },
      {
        h: "Strict CSP",
        p: [
          "Styles are added through a constructed stylesheet, not an inline `<style>` tag, so `style-src 'self'` is enough.",
          "For dynamic values use a class, a custom property, or a style object. A style string in an attribute would be blocked by the same policy.",
        ],
      },
      {
        h: "Global CSS",
        p: ["Things like a reset go into a normal `.css` file that you link from your HTML page."],
      },
    ],
  },

  {
    slug: "router",
    title: "Router",
    intro: "A small history router with real paths like /docs/router. Plain links are enough.",
    blocks: [
      {
        h: "Define routes",
        p: [
          "`router` takes an object of patterns and components and returns a function to use in the markup. `:name` captures a segment, `*` matches anything. The first match wins, so put `*` last.",
        ],
        code: `<script>
  import Home from "./Home.js";
  import Instance from "./Instance.js";

  const view = router({
    "/": Home,
    "/instance/:id": Instance,
    "*": NotFound,
  });
</script>

<main>{view()}</main>`,
      },
      {
        h: "Read the route",
        p: [
          "A page receives `props.params` and `props.query`. `route()` is reactive and returns `{ path, query }`, which is handy for marking the active link. A query key that appears twice, like `?tag=a&tag=b`, gives an array: `{ tag: [\"a\", \"b\"] }`. A key that appears once stays a string.",
        ],
        code: `const { id } = props.params;         // /instance/3?tab=log
const { tab } = props.query;

<a class={route().path === "/" ? "on" : ""} href="/">home</a>`,
      },
      {
        h: "Move around",
        p: [
          "A normal link is all it takes. A click on a link to your own site becomes a navigation without a page load. Ctrl-click, `target=\"_blank\"`, downloads, other sites and `#anchors` on the same page work as usual. A link the server has to answer itself, like a file or an export, gets `data-native` (or `rel=\"external\"`), and the router leaves it alone. A link to another page keeps its anchor: `/docs/router#server-setup` opens the page and scrolls there.",
          "From code, use `navigate`. With `replace` the current history entry is swapped instead of a new one added.",
        ],
        code: `<a href="/instance/3">three</a>

navigate("/instance/3");
navigate("/login", { replace: true });`,
      },
      {
        h: "Server setup",
        p: [
          "The paths are real, so the server has to answer every path of your app with a page. For an app with paths it cannot know in advance, like `/instance/3`, that means answering every unknown path with `index.html`. Otherwise a reload on `/docs/router` is a 404.",
          "Cloudflare Pages does this on its own when the project has no `404.html`. Caddy and Nginx need one line:",
        ],
        code: `# Caddy
try_files {path} /index.html

# Nginx
try_files $uri $uri/ /index.html;`,
      },
      {
        h: "A file for every page",
        p: [
          "If all your paths are known, like on this site, write a small `index.html` for each of them (see below). Then no fallback is needed and unknown addresses are real 404s: point the server at a `404.html`. In Nginx that is `error_page 404 /404.html;` and `try_files $uri $uri/ =404;`, a complete example is in the repository of this site.",
        ],
      },
      {
        h: "Links people share",
        p: [
          "Chat apps and search engines do not run JavaScript. They read the HTML of the address they are given, and a single-page app has one HTML file for every path.",
          "For a title, a text and a preview image per page, write a small `index.html` for each route with its own meta tags. This site generates them from one list with `build-pages.mjs`.",
        ],
      },
      {
        h: "Below a path",
        p: [
          "If the site lives at `/app` instead of the root of a domain, pass a base. Routes stay written without it, links in your markup use the full path, and `navigate` adds it for you.",
        ],
        code: `router({ "/": Home, "/docs": Docs }, { base: "/app" });

<a href="/app/docs">docs</a>
navigate("/docs");        // goes to /app/docs`,
      },
      {
        h: "Good to know",
        p: [
          "The page is rebuilt on every route change and the old one is destroyed, so its effects and `onDestroy` callbacks are cleaned up.",
          "Scrolling to the top is not automatic. This site does it with an effect on `route()`.",
          "A trailing slash is ignored, and a broken `%` sequence in a URL does not throw, the raw text is used.",
        ],
      },
    ],
  },

  {
    slug: "compiler",
    title: "Compiler",
    intro: "The compiler runs on your machine. It turns src/ into dist/: plain JavaScript that builds the DOM directly.",
    blocks: [
      {
        h: "Two folders",
        p: [
          "`src/` is what people write: `.mau` files, plain `.js`, CSS, images. `dist/` is what the browser loads, and it is generated. Every `.mau` file becomes a `.js` file at the same place in `dist/`, every other file is copied as it is.",
          "`dist/` sits next to `src/` and has the same shape, so a relative path like `../mau/index.js` is the same in both. `src/` is never written to.",
        ],
        code: `my-app/
  index.html
  src/
    main.js
    Counter.mau
    lib/api.js
  dist/            generated
    main.js
    Counter.js
    lib/api.js
  mau/`,
      },
      {
        h: "Command line",
        p: [
          "Run it in the project folder, or pass the folder. `--watch` rebuilds on every change. `--runtime` points at your copy of the runtime when it is not in `mau/`. Give it a file path starting with a dot and the import path is worked out for every file. Anything else is written as it is.",
        ],
        code: `node mau/compiler/cli.js
node mau/compiler/cli.js my-app
node mau/compiler/cli.js --watch
node mau/compiler/cli.js --runtime ./vendor/mau/index.js`,
      },
      {
        h: "dist belongs to mau",
        p: [
          "Files that are no longer in `src/` are removed from `dist/`, and empty folders with them. So nothing else should live in `dist/`. If mau finds a `dist/` with files it did not write, it stops and leaves it alone.",
          "A `.mau` file and a `.js` file with the same name in one folder would both become `dist/Name.js`, which is an error.",
        ],
      },
      {
        h: "What comes out",
        p: [
          "One ES module per component. A button with a counter becomes a few calls, and text bindings become small functions that the runtime keeps up to date.",
        ],
        code: `__h("button",
  { "onclick": (() => n.set(n() + 1)) },
  "clicked ", () => (n()))`,
      },
      {
        h: "Errors",
        p: [
          "Compile errors name the file, line and column of the problem in your .mau file. The other files are still built, and the old output of a broken file stays until you fix it. Runtime source maps are not done yet.",
        ],
        code: `src/Card.mau:3:1: expected </p>
src/Card.mau:8:3: unclosed {#if}
src/Card.mau:1:12: a component needs exactly one root element`,
      },
      {
        h: "From code",
        p: [
          "The compiler is one file without dependencies. It also runs in a browser.",
        ],
        code: `import { compile } from "./mau/compiler/compile.js";

const { code } = compile(source, {
  file: "Card.mau",
  runtime: "./mau/index.js",
});`,
      },
      {
        h: "Commit dist",
        p: [
          "Keep `dist/` in your repository. Installers, servers and other people then need no build at all. Only whoever changes a `.mau` file needs Node.",
        ],
      },
    ],
  },

  {
    slug: "editor",
    title: "VS Code",
    intro: "Syntax highlighting for .mau files in VS Code.",
    blocks: [
      {
        h: "What you get",
        p: [
          "The markup with its tags and attributes, JavaScript in `<script>` and in every `{expression}`, CSS in `<style>`, the blocks (`{#if}`, `{#each}`, `{@html}`), `on:` and `bind:`, and components in their own color.",
          "There is no language server, no formatter and no snippets yet.",
        ],
      },
      {
        h: "Get it",
        p: [
          `The extension is not on the marketplace yet. Download the package from the [latest release](${links.vs}/releases/latest) and install it. You need the \`code\` command of VS Code.`,
          "Reload the window afterwards. If a file is not recognized, pick mau in the language mode at the bottom right.",
        ],
        code: `code --install-extension mau-0.1.1.vsix`,
      },
      {
        h: "Build it yourself",
        p: [
          `Get the source from [mau-vs on GitHub](${links.vs}), build the package and install it. You need Node.js.`,
        ],
        code: `git clone ${links.vs}.git
cd mau-vs
npx @vscode/vsce package
code --install-extension mau-0.1.1.vsix`,
      },
      {
        h: "Try it without installing",
        p: ["Open the `mau-vs` folder in VS Code and press `F5`. A test window opens with the extension active."],
      },
      {
        h: "Source",
        p: [
          `The grammar, its tests and the package files are in [mau-vs](${links.vs}). The framework itself is [mau](${links.mau}), and the source of this website is [mau-website](${links.website}).`,
        ],
      },
    ],
  },

  {
    slug: "security",
    title: "Security",
    intro: "Anything a user can type is untrusted. mau is built around that.",
    blocks: [
      {
        h: "Text stays text",
        p: [
          "Every `{expr}` is inserted as a text node. A player name like `<img src=x onerror=alert(1)>` is shown as it is and never runs.",
        ],
      },
      {
        h: "Explicit escape hatch",
        p: [
          "`{@html}` is the only way to insert markup. It is easy to search for and to review. Never pass it user input.",
        ],
      },
      {
        h: "Attributes",
        p: [
          "`on*` attributes need a function. A string throws an error, so no inline handler can be created.",
          "`javascript:` and `vbscript:` URLs are blocked in `href`, `src`, `action`, `formaction`, `poster`, `data`, `cite` and `xlink:href`. `srcdoc` is blocked. A warning is printed each time.",
          "`data:` URLs are not blocked. Validate links yourself if they come from users.",
        ],
      },
      {
        h: "Content-Security-Policy",
        p: [
          "The runtime and the compiled output use no `eval`, no `new Function`, no inline scripts and no inline styles. This policy is enough:",
        ],
        code: `<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; script-src 'self'; style-src 'self'">`,
      },
      {
        h: "Not covered",
        p: [
          "mau cannot protect the server. Escape and validate on the server side as well, and add `connect-src`, `img-src` and friends when your page needs them.",
        ],
      },
    ],
  },

  {
    slug: "api",
    title: "API reference",
    intro: "Everything `mau/index.js` exports.",
    blocks: [
      { h: "signal(value)", p: ["Creates a signal. Read with `s()`, write with `s.set(v)` or `s.set(fn)`, read untracked with `s.peek()`."] },
      { h: "computed(fn)", p: ["A read-only signal derived from other signals."] },
      { h: "effect(fn)", p: ["Runs `fn` now and when its signals change. Returns a stop function. A function returned from `fn` is the cleanup."] },
      { h: "untracked(fn)", p: ["Runs `fn` and returns its result without subscribing to the signals it reads."] },
      { h: "batch(fn)", p: ["Runs `fn`, then updates each affected effect once."] },
      { h: "onDestroy(fn)", p: ["Runs `fn` when the surrounding component or region is destroyed."] },
      { h: "mount(target, component, ...args)", p: ["Builds the component, puts it into `target` and returns a function that destroys it."] },
      { h: "component(setup, ...args)", p: ["Builds a component without mounting it. Returns `{ node, destroy }`."] },
      { h: "h(tag, props, ...children)", p: ["Creates an element. This is what the compiler emits. `props` may hold `on*` functions, `ref`, a `style` object and reactive functions."] },
      { h: "tags", p: ["A proxy for hand-written views: `tags.div({ class: \"x\" }, \"hello\")`."] },
      { h: "raw(html)", p: ["Marks a string as HTML for `h`. Same trust rules as `{@html}`."] },
      { h: "each(list, key, render, live)", p: ["The keyed list the compiler emits for `{#each}`."] },
      { h: "adoptStyle(css)", p: ["Adds a constructed stylesheet. Used for the scoped styles."] },
      { h: "router(routes, options)", p: ["Returns a function that renders the page for the current path. Option: `{ base: \"/app\" }`."] },
      { h: "route()", p: ["Reactive `{ path, query }` of the current address."] },
      { h: "navigate(path, options)", p: ["Goes to a path without a page load, for example `navigate(\"/docs\")`. Option: `{ replace: true }`."] },
    ],
  },
];

const by = (slug) => core.find((p) => p.slug === slug);

// the order of the sidebar
export default [
  tutorial,
  by("templates"),
  by("reactivity"),
  by("components"),
  by("styles"),
  by("router"),
  recipes,
  by("compiler"),
  deploy,
  by("editor"),
  by("security"),
  faq,
  troubleshooting,
  by("api"),
  changelog,
];
