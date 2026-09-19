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
    description: "The mau docs: templates, reactivity, components, styles, router, compiler and security.",
  },
  ...docs.map((d) => ({ path: "/docs/" + d.slug, title: `${d.title} · mau docs`, description: d.intro })),
  {
    path: "/try",
    title: "Try mau",
    description: "A live counter, a task list and a polled instance list, all built with mau.",
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
];

export const titleFor = (path) => (pages.find((p) => p.path === path) ?? { title: "Not found · mau" }).title;
