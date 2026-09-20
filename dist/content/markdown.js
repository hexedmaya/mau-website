// A small Markdown reader for the legal texts: headings, paragraphs, bullet and numbered lists, quotes.
// Returns blocks: { t: "h1" | "h2" | "h3" | "p" | "ul" | "ol" | "quote", text | items }.
// (Plain JavaScript on purpose: regular expressions with backticks cannot live in a .mau script.)
export function parseMarkdown(md) {
  const out = [];
  let para = [], list = null, quote = null;

  const flush = () => {
    if (para.length) out.push({ t: "p", text: para.join("\n") });
    if (list) out.push({ t: list.ordered ? "ol" : "ul", items: list.items });
    if (quote) out.push({ t: "quote", text: quote.join("\n") });
    para = []; list = null; quote = null;
  };

  for (const line of md.split(/\r?\n/)) {
    const h = /^(#{1,3}) (.*)$/.exec(line);
    if (h) {
      flush();
      out.push({ t: "h" + h[1].length, text: h[2] });
    } else if (line.startsWith("* ")) {
      if (!list || list.ordered) { flush(); list = { ordered: false, items: [] }; }
      list.items.push(line.slice(2));
    } else if (/^\d+\. /.test(line)) {
      if (!list || !list.ordered) { flush(); list = { ordered: true, items: [] }; }
      list.items.push(line.replace(/^\d+\. /, ""));
    } else if (line.startsWith("> ")) {
      if (!quote) flush();
      (quote ??= []).push(line.slice(2));
    } else if (!line.trim()) {
      flush();
    } else {
      if (list || quote) flush();
      para.push(line);
    }
  }
  flush();
  return out;
}
