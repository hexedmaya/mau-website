// Search over the docs: every block (heading, text, code) of every page is one entry.
import pages from "./docs.js";
import { slugify } from "./text.js";

const index = pages.flatMap((p) =>
  p.blocks.map((b) => {
    const body = (b.p ?? []).join(" ").split("`").join("");
    return {
      title: p.title,
      slug: p.slug,
      h: b.h,
      id: slugify(b.h),
      body,
      hay: (b.h + " " + body + " " + (b.code ?? "")).toLowerCase(),
    };
  })
);

// The entries that contain every word of the query, best first: a hit in the heading counts more.
export function find(query, limit = 8) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length || words.join("").length < 2) return [];
  return index
    .filter((e) => words.every((w) => e.hay.includes(w)))
    .map((e) => ({ e, score: words.reduce((n, w) => n + (e.h.toLowerCase().includes(w) ? 2 : 0) + (e.title.toLowerCase().includes(w) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.e);
}
