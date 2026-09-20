// The colorer of the playground editor. It reads a whole .mau file (markup, <script>, <style>, {expressions}
// and {#blocks}) and returns tokens { k, v } that join back to the text, so nothing is lost or added.
// The kinds follow the VS Code extension of mau:
//   c comment, s string, n number, k keyword (const, true, this), kc control keyword ({#if}, if, import),
//   t tag name, tp the < > around it, cmp a component tag, a attribute, ev on: and bind:, p the braces of an
//   expression, fn a call, v a name, sel a CSS selector, prop a CSS property, val a CSS value, "" plain text.
// It is a colorer, not a parser: wrong code still gets colors, it never throws.

const CONTROL = new Set("if else for while do return import from export default await try catch finally throw switch case break continue yield".split(" "));
const KEYWORD = new Set("const let var function class extends async new this typeof instanceof in of delete void static true false null undefined super get set".split(" "));

// ---- JavaScript

const JS = /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|`(?:\\[\s\S]|[^`\\])*`?)|(\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b|\.\d+\b)|([A-Za-z_$][\w$]*)/g;

function jsTokens(code, out) {
  const push = (k, v) => { if (v) out.push({ k, v }); };
  let last = 0, m;
  JS.lastIndex = 0;
  while ((m = JS.exec(code))) {
    push("", code.slice(last, m.index));
    const v = m[0];
    let k;
    if (m[1]) k = "c";
    else if (m[2]) k = "s";
    else if (m[3]) k = "n";
    else if (CONTROL.has(v)) k = "kc";
    else if (KEYWORD.has(v)) k = "k";
    else k = /^\s*\(/.test(code.slice(m.index + v.length, m.index + v.length + 40)) ? "fn" : "v";
    push(k, v);
    last = m.index + v.length;
  }
  push("", code.slice(last));
}

// ---- CSS

function cssTokens(code, out) {
  const push = (k, v) => { if (v) out.push({ k, v }); };
  // one entry per open {: true when it holds declarations, false when it holds rules (@media ...)
  const stack = [];
  let prelude = "";
  let expectProp = false;
  const decl = () => stack.length > 0 && stack[stack.length - 1];
  const RE = /(\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(\{)|(\})|(;)|(@[\w-]+)|(#[0-9a-fA-F]{3,8}\b)|(-?(?:\d+\.?\d*|\.\d+)(?:%|[a-zA-Z]+)?)|(!important)|(--?[A-Za-z_][\w-]*|[A-Za-z_][\w-]*)|(::?[\w-]+(?:\([^)]*\))?)|(\.[\w-]+|#[\w-]+)/g;
  let last = 0, m;
  while ((m = RE.exec(code))) {
    push("", code.slice(last, m.index));
    const v = m[0];
    last = m.index + v.length;
    const inDecl = decl();
    const atRule = prelude.startsWith("@");
    if (m[1]) push("c", v);
    else if (m[2]) push("s", v);
    else if (m[3]) {
      push("", v);
      stack.push(!/^@(-webkit-)?(media|supports|container|layer|document|keyframes)/.test(prelude));
      prelude = "";
      expectProp = decl();
    } else if (m[4]) {
      push("", v);
      stack.pop();
      prelude = "";
      expectProp = decl();
    } else if (m[5]) { push("", v); expectProp = inDecl; }
    else if (m[6]) push("kc", v);
    else if (m[7] && !inDecl) push("sel", v);
    else if (m[7] || m[8]) push("n", v);
    else if (m[9]) push("kc", v);
    else if (m[10]) {
      if (inDecl) {
        // a property when it starts a declaration, else a function or a value
        if (expectProp && /^s*:/.test(code.slice(last, last + 8))) push("prop", v);
        else if (code[last] === "(") push("fn", v);
        else push(v.startsWith("--") ? "v" : "val", v);
        expectProp = false;
      } else push(atRule ? "" : "sel", v);
    } else if (m[11] || m[12]) push(inDecl ? "" : "sel", v);
    if (!inDecl && !m[1] && !m[2] && !m[3] && !m[4] && !m[5]) prelude += v;
  }
  push("", code.slice(last));
}

// ---- the file

const NAME = /[A-Za-z][\w:.-]*/y;
const ATTR = /[^\s=\/>{}"']+/y;

export function highlightMau(src) {
  const out = [];
  const n = src.length;
  const push = (k, v) => { if (v) out.push({ k, v }); };

  // index of the } that closes the { at `open`, skipping strings and nested braces. n when it never closes.
  const close = (open) => {
    let depth = 0;
    for (let p = open; p < n; p++) {
      const c = src[p];
      if (c === '"' || c === "'" || c === "`") {
        for (p++; p < n && src[p] !== c; p++) if (src[p] === "\\") p++;
      } else if (c === "{") depth++;
      else if (c === "}" && --depth === 0) return p;
    }
    return n;
  };

  // {expression}, {#if cond}, {:else}, {/if}, {@html x}: returns the index after it
  const brace = (i) => {
    const end = close(i);
    const inner = src.slice(i + 1, end);
    push("p", "{");
    const b = /^[#:\/@][a-z]+/.exec(inner);
    if (b) { push("kc", b[0]); jsTokens(inner.slice(b[0].length), out); }
    else jsTokens(inner, out);
    if (end < n) push("p", "}");
    return end < n ? end + 1 : n;
  };

  // the inside of "..." after an attribute: text and {expressions}
  const quoted = (i) => {
    const q = src[i];
    let p = i + 1, text = q;
    while (p < n && src[p] !== q) {
      if (src[p] === "\\" && p + 1 < n) { text += src[p] + src[p + 1]; p += 2; }
      else if (src[p] === "{") { push("s", text); text = ""; p = brace(p); }
      else text += src[p++];
    }
    if (p < n) text += src[p++];
    push("s", text);
    return p;
  };

  // a tag, from its < to the >. Returns { at, name, closing } with `at` the index after the tag.
  const tag = (i) => {
    let p = i + 1;
    const closing = src[p] === "/";
    if (closing) p++;
    NAME.lastIndex = p;
    const nm = NAME.exec(src);
    push("tp", closing ? "</" : "<");
    push(/^[A-Z]/.test(nm[0]) ? "cmp" : "t", nm[0]);
    p += nm[0].length;
    while (p < n) {
      const c = src[p];
      if (c === ">") { push("tp", ">"); p++; break; }
      if (c === "/" && src[p + 1] === ">") { push("tp", "/>"); p += 2; break; }
      if (/\s/.test(c)) {
        let e = p;
        while (e < n && /\s/.test(src[e])) e++;
        push("", src.slice(p, e));
        p = e;
      } else if (c === "{") p = brace(p);
      else if (c === "=") {
        push("", "=");
        p++;
        if (src[p] === '"' || src[p] === "'") p = quoted(p);
        else if (src[p] === "{") p = brace(p);
      } else {
        ATTR.lastIndex = p;
        const a = ATTR.exec(src);
        if (!a) { push("", c); p++; continue; }
        push(/^(on|bind):/.test(a[0]) ? "ev" : "a", a[0]);
        p += a[0].length;
      }
    }
    return { at: p, name: nm[0], closing };
  };

  let i = 0;
  while (i < n) {
    const c = src[i];
    if (c === "<" && src.startsWith("<!--", i)) {
      const e = src.indexOf("-->", i + 4);
      const end = e < 0 ? n : e + 3;
      push("c", src.slice(i, end));
      i = end;
    } else if (c === "<" && /[A-Za-z\/]/.test(src[i + 1] ?? "") && (src[i + 1] !== "/" || /[A-Za-z]/.test(src[i + 2] ?? ""))) {
      const t = tag(i);
      i = t.at;
      // <script> and <style> hold code of their own, up to the closing tag
      if (!t.closing && (t.name === "script" || t.name === "style")) {
        const e = src.indexOf("</" + t.name, i);
        const end = e < 0 ? n : e;
        (t.name === "script" ? jsTokens : cssTokens)(src.slice(i, end), out);
        i = end;
      }
    } else if (c === "{") i = brace(i);
    else {
      // plain text, up to the next tag or expression. \{ and \} are literal braces.
      let e = i;
      while (e < n && (e === i || (src[e] !== "<" && src[e] !== "{"))) {
        if (src[e] === "\\" && (src[e + 1] === "{" || src[e + 1] === "}")) e++;
        e++;
      }
      push("", src.slice(i, e));
      i = e;
    }
  }
  return out;
}
