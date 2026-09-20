// Small text markup for the docs: `code` becomes inline code, [label](address) becomes a link.
// (Plain JavaScript on purpose: a backtick inside a regular expression cannot live in a .mau script.)
export const segs = (text) =>
  text
    .split(/(`[^`]+`|\[[^\]]+\]\([^)]+\))/)
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith("`")) return { t: part.slice(1, -1), code: true };
      const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
      return m ? { t: m[1], href: m[2], external: /^https?:/.test(m[2]) } : { t: part };
    });

// "Server setup" -> "server-setup": the id of a heading, and what a link to it ends with
export const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
