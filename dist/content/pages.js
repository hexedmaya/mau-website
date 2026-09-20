// Every page of the site with its title and description. The app uses the titles, and build-pages.mjs writes
// one small HTML file per page from this list, so a shared link shows the right title, text and image.
import docs from "./docs.js";

export const pages = [
  {
    path: "/",
    title: "mau · Make A UI",
    description: "A small frontend framework. You write .mau files, the compiler hands back plain JavaScript. No dependencies, works under a strict CSP.",
  },
  {
    path: "/start",
    title: "Getting started · mau",
    description: "Copy the folder, write a component, compile it, mount it. Five steps from nothing to a running page.",
  },
  {
    path: "/docs",
    title: "Docs · mau",
    description: "The mau docs: a tutorial, templates, reactivity, components, styles, router, recipes, compiler, deployment and security.",
  },
  ...docs.map((d) => ({ path: "/docs/" + d.slug, title: `${d.title} · mau docs`, description: d.intro })),
  {
    path: "/try",
    title: "Try mau",
    description: "A live counter, a task list and a polled instance list, all built with mau.",
  },
  {
    path: "/playground",
    title: "Playground · mau",
    description: "Write a .mau component and see it run. The compiler runs in your browser, nothing is sent anywhere.",
  },
  {
    path: "/about",
    title: "About · mau",
    description: "Why mau exists, what works today, what comes next, and what it is not.",
  },
  {
    path: "/brand",
    title: "Brand · mau",
    description: "The mau logo, colors and brand policy.",
  },
  {
    path: "/brand-policy",
    title: "Brand Policy · mau",
    description: "How you may use the mau name and logo.",
  },
  {
    path: "/licenses",
    title: "License · mau",
    description: "The mau License 1.0: use mau, also commercially, to build your own products. Do not sell mau itself.",
  },
  {
    path: "/licenses/website",
    title: "Website License · mau",
    description: "The license of the mau website: its code, design, text and graphics.",
  },
  {
    path: "/imprint",
    title: "Imprint · mau",
    description: "Imprint of mau.melloo.me.",
  },
  {
    path: "/privacy",
    title: "Privacy · mau",
    description: "What this website stores: server logs, no analytics, no cookies, no third-party resources.",
  },
];

export const titleFor = (path) => (pages.find((p) => p.path === path) ?? { title: "Not found · mau" }).title;
