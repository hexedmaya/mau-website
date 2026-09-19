// Content of the docs pages. Backticks in a paragraph mark inline code.
export default [
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
          "The value is always a string. Numbers, `select` and radio buttons are not covered yet.",
        ],
        code: `<input bind:value={name}>
<input type="checkbox" bind:checked={agreed}>`,
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
          "Duplicate keys print a warning. Plain values such as strings are rebuilt when they change.",
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
          "The style block becomes a native `@scope` rule. `:scope` is the root element of the component.",
        ],
        code: `<style>
  :scope { border: 2px solid; padding: 1rem; }
  b { color: orangered; }
</style>`,
      },
      {
        h: "Know the limit",
        p: [
          "A scope reaches all elements below the root, including those of child components. Use classes instead of bare tag names when a child could be hit by accident.",
        ],
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
          "A page receives `props.params` and `props.query`. `route()` is reactive and returns `{ path, query }`, which is handy for marking the active link.",
        ],
        code: `const { id } = props.params;         // /instance/3?tab=log
const { tab } = props.query;

<a class={route().path === "/" ? "on" : ""} href="/">home</a>`,
      },
      {
        h: "Move around",
        p: [
          "A normal link is all it takes. A click on a link to your own site becomes a navigation without a page load. Ctrl-click, `target=\"_blank\"`, downloads, other sites and `#anchors` on the same page work as usual.",
          "From code, use `navigate`. With `replace` the current history entry is swapped instead of a new one added.",
        ],
        code: `<a href="/instance/3">three</a>

navigate("/instance/3");
navigate("/login", { replace: true });`,
      },
      {
        h: "Server setup",
        p: [
          "The paths are real, so the server has to answer every unknown path with `index.html`. Otherwise a reload on `/docs/router` is a 404.",
          "Cloudflare Pages does this on its own when the project has no `404.html`. Caddy and Nginx need one line:",
        ],
        code: `# Caddy
try_files {path} /index.html

# Nginx
try_files $uri $uri/ /index.html;`,
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
    intro: "The compiler runs on your machine and writes plain JavaScript that builds the DOM directly.",
    blocks: [
      {
        h: "Command line",
        p: [
          "Pass files or folders. Each `Name.mau` becomes `Name.js` next to it. `--runtime` points at your copy of the runtime when it is not in `mau/`. Give it a file path starting with a dot and the import path is worked out for every file. Anything else is written as it is.",
        ],
        code: `node mau/compiler/cli.js src
node mau/compiler/cli.js src --watch
node mau/compiler/cli.js src --runtime ./vendor/mau/index.js
node mau/compiler/cli.js src --runtime /vendor/mau/index.js`,
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
          "Compile errors name the file, line and column of the problem in your .mau file. Runtime source maps are not done yet.",
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
        h: "Commit the output",
        p: [
          "Keep the generated `.js` files in your repository. Installers, servers and other people then need no build at all.",
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
