// A tiny syntax colorer for the code samples on this site: JavaScript, HTML and .mau markup, plain commands.
// It returns tokens { k, v } (k: "" plain, c comment, s string, k keyword, n number, t tag, a attribute prefix).
// The page draws them as text nodes inside spans, so nothing is ever inserted as HTML.
const KEYWORDS = new Set(
  "const let var function return if else for while of in import from export default async await new this typeof true false null undefined class extends try catch finally throw switch case break continue".split(" ")
);

const RE = new RegExp(
  [
    "(//[^\\n]*|/\\*[\\s\\S]*?\\*/|<!--[\\s\\S]*?-->)", // 1 comment
    "(\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*'|`(?:\\\\.|[^`\\\\])*`)", // 2 string
    "(</?[A-Za-z][\\w:.-]*)", // 3 tag start
    "(\\{[#:/@][a-z]+)", // 4 mau block: {#if {:else {/each {@html
    "(\\b(?:on|bind):[\\w-]+)", // 5 on:click, bind:value
    "(\\b\\d[\\d.]*\\b)", // 6 number
    "([A-Za-z_$][\\w$]*)", // 7 word
  ].join("|"),
  "g"
);

export function highlight(code) {
  const out = [];
  const push = (k, v) => { if (v) out.push({ k, v }); };
  let last = 0, m;
  RE.lastIndex = 0;
  while ((m = RE.exec(code))) {
    push("", code.slice(last, m.index));
    const v = m[0];
    const k = m[1] ? "c" : m[2] ? "s" : m[3] ? "t" : m[4] ? "k" : m[5] ? "a" : m[6] ? "n" : KEYWORDS.has(v) ? "k" : "";
    push(k, v);
    last = m.index + v.length;
  }
  push("", code.slice(last));
  return out;
}
