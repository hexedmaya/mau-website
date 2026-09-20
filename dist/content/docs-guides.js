// The longer docs pages: a tutorial, recipes, deployment, questions and answers, troubleshooting and the changelog.
// Same shape as docs.js. Backticks in a paragraph mark inline code.
import { links } from "./links.js";

export const tutorial = {
  slug: "tutorial",
  title: "Tutorial",
  intro: "Build a small task list from an empty folder. You will meet signals, forms, lists, a component and a little styling.",
  blocks: [
    {
      h: "Set up the folder",
      p: [
        "Make a folder with your page, a `src/` folder for what you write, and a copy of the `mau/` folder (see [Getting started](/start)). The page loads the compiled `dist/main.js`.",
      ],
      code: `tasks/
  index.html
  src/
    main.js
    App.mau
  mau/             the runtime and the compiler`,
    },
    {
      h: "The page",
      p: [
        "`index.html` is only a place for the app and one script. The policy in the meta tag is the strict one from the security page, and it is enough for everything in this tutorial.",
      ],
      code: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; script-src 'self'; style-src 'self'">
  <title>tasks</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/dist/main.js"></script>
</body>
</html>`,
    },
    {
      h: "The first component",
      p: [
        "A signal holds a value. Reading it in the markup, `tasks()`, makes that spot follow the signal. `{#each}` writes one row per entry.",
        "`main.js` mounts the component into the page.",
      ],
      code: `<!-- src/App.mau -->
<script>
  const tasks = signal(["read the docs", "write a component"]);
</script>

<main>
  <h1>Tasks</h1>
  <ul>
    {#each tasks() as t}
      <li>{t}</li>
    {/each}
  </ul>
</main>`,
    },
    {
      h: "Compile and open it",
      p: [
        "Compile once, or keep `--watch` running while you work. Then serve the folder with any static server and open the page.",
      ],
      code: `// src/main.js
import { mount } from "../mau/index.js";
import App from "./App.js";

mount(document.getElementById("app"), App);`,
    },
    {
      h: "Run it",
      p: ["Two terminals: the compiler in one, a server in the other."],
      code: `node mau/compiler/cli.js --watch
python -m http.server 8000`,
    },
    {
      h: "Add a form",
      p: [
        "`bind:value` keeps an input and a signal in sync. Pass the signal itself, without the brackets. A handler is a function, so the form gets `on:submit` with an arrow. To change a list, write a new array: `.set` compares the value, and the same array is not a change.",
      ],
      code: `<script>
  const tasks = signal(["read the docs"]);
  const draft = signal("");

  const add = () => {
    const text = draft().trim();
    if (!text) return;
    tasks.set([...tasks(), text]);
    draft.set("");
  };
</script>

<main>
  <h1>Tasks</h1>
  <form on:submit={(e) => { e.preventDefault(); add(); }}>
    <input bind:value={draft} placeholder="new task">
    <button>add</button>
  </form>
  <ul>
    {#each tasks() as t}<li>{t}</li>{/each}
  </ul>
</main>`,
    },
    {
      h: "Tasks with an id",
      p: [
        "A task that can be checked off and removed is an object. Give each one an id and use it as the key: `{#each tasks() as t (t.id)}`. With a key, rows are moved instead of rebuilt, so a checked box stays where it belongs.",
      ],
      code: `<script>
  const tasks = signal([
    { id: 1, text: "read the docs", done: false },
    { id: 2, text: "write a component", done: false },
  ]);
  const draft = signal("");
  let nextId = 3;

  const add = () => {
    const text = draft().trim();
    if (!text) return;
    tasks.set([...tasks(), { id: nextId++, text, done: false }]);
    draft.set("");
  };
  const toggle = (id) => tasks.set(tasks().map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id) => tasks.set(tasks().filter((t) => t.id !== id));
</script>

<ul>
  {#each tasks() as t (t.id)}
    <li>
      <input type="checkbox" checked={t.done} on:change={() => toggle(t.id)}>
      {t.text}
      <button on:click={() => remove(t.id)}>remove</button>
    </li>
  {/each}
</ul>`,
    },
    {
      h: "Derived values",
      p: [
        "`computed` makes a value out of other signals. It is read like a signal and updates when they change. `{#if}` shows something only while a condition holds.",
      ],
      code: `<script>
  const open = computed(() => tasks().filter((t) => !t.done).length);
</script>

{#if tasks().length === 0}
  <p>Nothing to do.</p>
{:else}
  <p>{open()} of {tasks().length} open</p>
{/if}`,
    },
    {
      h: "Split it into components",
      p: [
        "One row becomes its own file. Everything passed in arrives on `props`. A prop with an expression is live: `props.task.done` follows the parent, so the row updates when the task does. Functions are passed like any other prop.",
        "Import the compiled `.js` file and use it as a capitalized tag.",
      ],
      code: `<!-- src/TaskItem.mau -->
<li class={props.task.done ? "done" : ""}>
  <input type="checkbox" checked={props.task.done} on:change={props.onToggle}>
  {props.task.text}
  <button on:click={props.onRemove}>remove</button>
</li>

<!-- in App.mau -->
<script>
  import TaskItem from "./TaskItem.js";
</script>

<ul>
  {#each tasks() as t (t.id)}
    <TaskItem task={t} onToggle={() => toggle(t.id)} onRemove={() => remove(t.id)} />
  {/each}
</ul>`,
    },
    {
      h: "Style it",
      p: [
        "The style block sits next to the markup and applies to this component only. `:scope` is its root element. Put a class on what you want to style and the child components stay untouched.",
      ],
      code: `<!-- in TaskItem.mau -->
<style>
  :scope { display: flex; gap: .6rem; align-items: center; }
  :scope.done { text-decoration: line-through; opacity: .6; }
  button { margin-left: auto; }
</style>`,
    },
    {
      h: "Keep the tasks",
      p: [
        "An `effect` runs now and again when a signal it read changes, which is what you want for saving. Read from `localStorage` once when the component starts.",
      ],
      code: `<script>
  const saved = localStorage.getItem("tasks");
  const tasks = signal(saved ? JSON.parse(saved) : []);

  effect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks()));
  });
</script>`,
    },
    {
      h: "Ship it",
      p: [
        "Compile one last time and commit `dist/`. Upload `index.html`, `dist/` and the runtime to any static host. See [Deployment](/docs/deploy). For patterns beyond this list, such as loading data, a modal or shared state, see [Recipes](/docs/recipes).",
      ],
    },
  ],
};

export const recipes = {
  slug: "recipes",
  title: "Recipes",
  intro: "Small answers to things you will want to build. Copy, then change.",
  blocks: [
    {
      h: "Load data",
      p: [
        "Three signals cover it: the data, an error and a flag while it loads. Turn a failed status into an error yourself, because `fetch` only rejects when the network fails.",
      ],
      code: `<script>
  const items = signal([]);
  const error = signal("");
  const loading = signal(true);

  fetch("/api/items")
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
    .then((data) => items.set(data))
    .catch((e) => error.set(e.message))
    .finally(() => loading.set(false));
</script>

<section>
  {#if loading()}
    <p>loading ...</p>
  {:else if error()}
    <p class="err">{error()}</p>
  {:else}
    <ul>{#each items() as it (it.id)}<li>{it.name}</li>{/each}</ul>
  {/if}
</section>`,
    },
    {
      h: "Poll and stay smooth",
      p: [
        "A timer starts somewhere else than a click, so wrap writes that belong together in `batch`, and stop the timer in `onDestroy`. With a key on `{#each}`, a new object for the same key updates the row in place instead of rebuilding it.",
      ],
      code: `<script>
  const list = signal([]);
  const updated = signal("");

  const load = async () => {
    const data = await (await fetch("/api/instances")).json();
    batch(() => {
      list.set(data);
      updated.set(new Date().toLocaleTimeString());
    });
  };
  load();
  const timer = setInterval(load, 5000);
  onDestroy(() => clearInterval(timer));
</script>

<section>
  <p>updated {updated()}</p>
  {#each list() as i (i.id)}
    <p>{i.name}: {i.cpu}%</p>
  {/each}
</section>`,
    },
    {
      h: "Shared state",
      p: [
        "A signal does not have to live in a component. Put it in a plain `.js` file and import it wherever you need it. Every component that reads it updates when it changes. The import path points at the runtime, the same way as in `main.js`.",
      ],
      code: `// src/lib/store.js
import { signal, computed } from "../../mau/index.js";

export const user = signal(null);
export const loggedIn = computed(() => user() !== null);

<!-- any component -->
<script>
  import { user, loggedIn } from "./lib/store.js";
</script>

<div>
  {#if loggedIn()}
    <p>hello {user().name}</p>
    <button on:click={() => user.set(null)}>log out</button>
  {/if}
</div>`,
    },
    {
      h: "A dialog",
      p: [
        "The dialog is one component that takes the signal it opens with. Children arrive as `props.children`. The effect adds a listener for Escape only while it is open, and its cleanup removes it again.",
      ],
      code: `<!-- Modal.mau -->
<script>
  const onKey = (e) => e.key === "Escape" && props.onClose();
  effect(() => {
    if (!props.open()) return;
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });
</script>

<div class="modal">
  {#if props.open()}
    <div class="backdrop" on:click={props.onClose}>
      <div class="dialog" role="dialog" aria-modal="true" on:click={(e) => e.stopPropagation()}>
        {props.children}
      </div>
    </div>
  {/if}
</div>

<!-- use -->
<button on:click={() => open.set(true)}>open</button>
<Modal open={open} onClose={() => open.set(false)}>
  <p>hello</p>
</Modal>`,
    },
    {
      h: "A form that checks itself",
      p: [
        "Derive the check from the field with `computed`. The button and the message both follow it, and nothing has to be wired by hand.",
      ],
      code: `<script>
  const email = signal("");
  const valid = computed(() => email().includes("@") && email().includes("."));
</script>

<form>
  <input type="email" bind:value={email}>
  {#if email() && !valid()}
    <p class="err">that does not look like an address</p>
  {/if}
  <button disabled={!valid()}>send</button>
</form>`,
    },
    {
      h: "Light and dark",
      p: [
        "This site keeps the mode in a signal, puts it on the root as a class, and lets the design tokens change with it. Start from the mode of the system, save the choice in `localStorage`. A class that changes on the root keeps the style class of the component.",
      ],
      code: `<script>
  const dark = matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = signal(localStorage.getItem("theme") ?? (dark ? "dark" : "light"));
  const toggle = () => {
    const next = theme() === "dark" ? "light" : "dark";
    theme.set(next);
    localStorage.setItem("theme", next);
  };
</script>

<div class={"app " + theme()}>
  <button on:click={toggle}>{theme() === "dark" ? "light" : "dark"}</button>
</div>

<style>
  :scope { --paper: #f1eee4; --ink: #141414; background: var(--paper); color: var(--ink); }
  :scope.dark { --paper: #131311; --ink: #efeadc; }
</style>`,
    },
    {
      h: "Reach an element",
      p: [
        "`ref` gives you the element once it exists, for focus, measuring or a library that needs a node.",
      ],
      code: `<input ref={(el) => el.focus()} placeholder="already focused">`,
    },
    {
      h: "Wait a moment while typing",
      p: [
        "An effect can return a cleanup function. Use it to cancel the last timer, and the work runs only once the typing stops.",
      ],
      code: `<script>
  const query = signal("");
  const results = signal([]);

  effect(() => {
    const q = query();
    const timer = setTimeout(async () => {
      results.set(q ? await (await fetch("/api/search?q=" + encodeURIComponent(q))).json() : []);
    }, 250);
    return () => clearTimeout(timer);
  });
</script>

<input bind:value={query} placeholder="search">`,
    },
  ],
};

export const deploy = {
  slug: "deploy",
  title: "Deployment",
  intro: "What you build is static files. Any host that serves files can serve it.",
  blocks: [
    {
      h: "Build",
      p: [
        "Run the compiler once and commit `dist/`. There is no bundling step and no build on the server.",
      ],
      code: `node mau/compiler/cli.js`,
    },
    {
      h: "What goes on the server",
      p: [
        "Your `index.html`, the `dist/` folder, the runtime (the `mau/` folder, or a vendored copy with `index.js`, `reactive.js`, `dom.js` and `router.js`) and your own assets. The compiler, `src/`, tests and `node_modules` stay at home.",
      ],
    },
    {
      h: "Nginx",
      p: [
        "For an app with paths that are not known in advance, answer every unknown path with `index.html`, so a reload on `/instance/3` still works. Serve the HTML without a long cache, or a visitor keeps an old page after you deploy.",
      ],
      code: `server {
  listen 80;
  server_name example.com;
  root /var/www/app;
  index index.html;

  add_header Cache-Control "no-cache" always;
  add_header X-Content-Type-Options "nosniff" always;

  location / {
    try_files $uri $uri/ /index.html;
  }
}`,
    },
    {
      h: "Pages that are all known",
      p: [
        "When you know every path in advance, like this site does, write a small `index.html` for each one and send a real 404 for the rest. That also gives every page its own title and preview for shared links, see the router page. The configuration of this site is in the repository as `deploy/mau.melloo.me.conf`.",
      ],
      code: `error_page 404 /404.html;
absolute_redirect off;

location / {
  try_files $uri $uri/ =404;
}`,
    },
    {
      h: "Caddy",
      p: ["One line does the same as the Nginx fallback."],
      code: `example.com {
  root * /var/www/app
  try_files {path} /index.html
  file_server
}`,
    },
    {
      h: "GitHub Pages and Cloudflare Pages",
      p: [
        "Both serve static files. Cloudflare Pages answers unknown paths with `index.html` on its own when the project has no `404.html`. GitHub Pages has no fallback rule: copy `index.html` to `404.html` so a reload on a deep path still loads the app. It works, but the status of those answers is 404.",
      ],
    },
    {
      h: "The policy header",
      p: [
        "Send the policy as a header as well as in the page. Add `connect-src`, `img-src` and others when your app needs them. This one is the strictest that still lets a mau app run:",
      ],
      code: `Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'`,
    },
    {
      h: "Behind Cloudflare",
      p: [
        "After an upload, purge the cache of the changed files, or visitors see the old ones for a while. With the bot protection on, Cloudflare may add its own inline script, and your policy blocks it. A message about a blocked inline script in the console then comes from Cloudflare, not from your app.",
      ],
    },
  ],
};

export const faq = {
  slug: "faq",
  title: "Questions",
  intro: "The things people ask first, answered straight.",
  blocks: [
    {
      h: "What is mau?",
      p: [
        "A small frontend framework. You write `.mau` files with markup, a bit of script and a style block. A compiler turns them into plain JavaScript that builds the DOM directly. There are no dependencies, and the people who use what you build install nothing.",
      ],
    },
    {
      h: "How is it different from Svelte?",
      p: [
        "The templates look alike: curly braces, `{#if}`, `{#each}`, scoped styles. The differences are on purpose. Reactivity is explicit signals (`n()` and `n.set`), so the script is plain JavaScript with no special rules. The runtime is about 3 KB gzipped, the compiler is one file and runs in a browser, and there is no bundler.",
        "Svelte does far more: transitions, server rendering, TypeScript, a large ecosystem. mau does less and stays small enough to read in an afternoon.",
      ],
    },
    {
      h: "And React or Vue?",
      p: [
        "mau has no virtual DOM and no JSX. A signal knows exactly which text or attribute reads it, and only that spot is written. Components run once, they are not called again on every change.",
      ],
    },
    {
      h: "Do I need a bundler or npm?",
      p: [
        "No. The output is ES modules, which browsers run as they are. You copy the `mau/` folder, and you need Node.js only on your own machine to run the compiler.",
      ],
    },
    {
      h: "TypeScript?",
      p: [
        "Not supported. The script in a `.mau` file is JavaScript, and `.ts` files in `src/` are copied, not compiled.",
      ],
    },
    {
      h: "Server rendering and search engines?",
      p: [
        "There is no server rendering. The page is built in the browser. Search engines that run JavaScript can read it, and a small HTML file per page gives chat apps and search results a title, a text and an image. See the router page.",
      ],
    },
    {
      h: "Is it ready to use?",
      p: [
        "It is young and the version starts with 0. It has tests, runs this website, and the API can still change. Try it on something small first.",
      ],
    },
    {
      h: "What may I do with it?",
      p: [
        "The [mau License](/licenses) lets you use mau, also commercially, to build your own software and services. You may not sell or license mau itself, or a modified version of it. The name and logo have their own rules in the [brand policy](/brand-policy).",
      ],
    },
    {
      h: "Which browsers?",
      p: [
        "Current ones. The scoped styles need `@scope`, see the styles page for the versions.",
      ],
    },
    {
      h: "Where do I report a bug?",
      p: [
        `On [GitHub](${links.mau}/issues). For a security problem, read \`SECURITY.md\` in the repository first.`,
      ],
    },
  ],
};

export const troubleshooting = {
  slug: "troubleshooting",
  title: "Troubleshooting",
  intro: "What you see, and what it usually is.",
  blocks: [
    {
      h: "The page is empty",
      p: [
        "Open the console. Usual causes: `dist/` was not built, the path in `<script type=\"module\">` is wrong, the element you mount into does not exist yet, or the policy blocks something. A missing file shows as a 404 in the network tab.",
      ],
    },
    {
      h: "It does not update",
      p: [
        "Read a signal by calling it: `n()`, not `n`. Reading it in the script, outside of an effect or the markup, is a one-time snapshot. Changing an array or an object in place is not a change either, so write a new one with `.set([...list, item])`.",
      ],
    },
    {
      h: "The page updates twice",
      p: [
        "Each write flushes at once. Wrap writes that belong together in `batch(() => { ... })`. Event handlers in a template are batched already, a timer, a socket or a fetch is not.",
      ],
    },
    {
      h: "effects keep triggering each other",
      p: [
        "An effect writes a signal that it also reads, so it would run forever. Read the value with `peek()` or `untracked` where you do not want to depend on it.",
      ],
      code: `effect(() => {
  const next = source();
  total.set(total.peek() + next);   // does not depend on total
});`,
    },
    {
      h: "expected </p>, unclosed {#if}",
      p: [
        "The compiler names the file, line and column. These two mean a tag or a block was opened and not closed, or closed in the wrong order. Look at the line it points to and the one above.",
      ],
      code: `src/Card.mau:3:1: expected </p>
src/Card.mau:8:3: unclosed {#if}`,
    },
    {
      h: "a component needs exactly one root element",
      p: [
        "A file has one root element. Wrap the parts in a `div`, a `section` or another element. The `<script>` and `<style>` blocks do not count.",
      ],
    },
    {
      h: "use \"quotes\" or {expression}",
      p: [
        "An attribute value is `\"text\"` or `{expression}`, nothing bare. `<input value=x>` fails, `<input value=\"x\">` and `<input value={x}>` work.",
      ],
    },
    {
      h: "bind: needs {signal}",
      p: [
        "`bind:value={name}` takes the signal itself. Not `{name()}` and not a plain variable.",
      ],
    },
    {
      h: "A click does nothing",
      p: [
        "A handler is a function. `on:click={save()}` runs `save` while the page is built. Write `on:click={save}` or `on:click={() => save(id)}`. A string throws, so inline handlers cannot be created.",
      ],
    },
    {
      h: "Styles are missing or leak",
      p: [
        "Nothing at all applies in an old browser, because `@scope` is missing. If a rule reaches a child component, use classes instead of bare tag names, because a scope covers everything below its root. Both are on the styles page.",
      ],
    },
    {
      h: "A reload gives a 404",
      p: [
        "The router uses real paths, so the server has to know them. Answer unknown paths with `index.html`, or write a file for every page. See the server setup on the router page and the deployment page.",
      ],
    },
    {
      h: "Blocked by the policy",
      p: [
        "A message about a blocked inline script or style points at code that is not yours: a browser extension, or the bot protection of a proxy such as Cloudflare. The runtime and the compiled output use no inline code. A style in an attribute string is blocked too, use a class, a custom property or a style object.",
      ],
    },
  ],
};

export const changelog = {
  slug: "changelog",
  title: "Changelog",
  intro: "What changed, newest first.",
  blocks: [
    {
      h: "After 0.1.0",
      p: [
        "A class that changes on the root element of a component no longer removes the style class of that component. Before, a reactive `class` on the root made its styles disappear until a reload.",
        "The playground keeps its code in the link, offers examples, and remembers the last draft in your browser.",
        "The website has a light and a dark mode that you can switch.",
        "Docs: a tutorial, recipes, deployment, questions and troubleshooting.",
      ],
    },
    {
      h: "0.1.0",
      p: [
        "The first version. Signals, computed values and effects with a scheduler that never shows half-changed state. The compiler with the two folders `src/` and `dist/`, `--watch` and messages with line and column.",
        "Templates with `{#if}`, keyed `{#each}`, `bind:` for values, numbers, selects, checkboxes and radio groups, `{@html}` as the one explicit escape hatch, components with live props and scoped styles through `@scope`.",
        "A history router with real paths, a small compiler that also runs in a browser, syntax highlighting for VS Code, and a strict policy that the runtime and the output work under.",
      ],
    },
  ],
};
