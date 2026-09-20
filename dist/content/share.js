// The playground keeps its code in the address (#code=...) so a link carries it. Plain JavaScript on purpose,
// the escaping of a regular expression is easier to read here than inside a .mau script.
export const encode = (text) => {
  let bin = "";
  for (const b of new TextEncoder().encode(text)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const decode = (token) => {
  try {
    const bin = atob(token.replace(/-/g, "+").replace(/_/g, "/"));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch (e) {
    return null;
  }
};

// "#code=..." -> the code, or null when the address carries none
export const fromHash = (hash) => {
  const m = /^#code=([A-Za-z0-9_-]+)$/.exec(hash);
  return m ? decode(m[1]) : null;
};

// the last thing typed, kept in this browser only (the same as the light/dark choice)
const KEY = "mau-playground";
export const loadDraft = () => {
  try { return localStorage.getItem(KEY); } catch (e) { return null; }
};
export const saveDraft = (text) => {
  try { localStorage.setItem(KEY, text); } catch (e) { /* private mode: nothing is kept */ }
};

// An error message with the line it points at and a mark under the column:
//   Playground.mau:3:1: expected </p>
//
//     3 | <p>hello
//       | ^
export const withContext = (message, source, line, col) => {
  const text = source.split("\n")[line - 1];
  if (text === undefined || !(col >= 1)) return message;
  const gutter = String(line);
  return message + "\n\n  " + gutter + " | " + text + "\n  " + " ".repeat(gutter.length) + " | " + " ".repeat(col - 1) + "^";
};
