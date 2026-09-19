// A tiny static server for working on the site. Like the real host, it answers every unknown path with
// index.html, so a reload on /docs/router works. No dependencies.
//
//   node dev-server.mjs          # http://localhost:8080
//   node dev-server.mjs 3000
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] ?? 8080);

const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".md": "text/markdown; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".ico": "image/x-icon",
};

function fileFor(urlPath) {
  const p = path.normalize(path.join(root, decodeURIComponent(urlPath)));
  if (!p.startsWith(root)) return null; // never leave the folder
  if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  const index = path.join(p, "index.html");
  if (fs.existsSync(index)) return index;
  // a path with a file extension that does not exist is a real 404, everything else is a page of the app
  return path.extname(p) ? null : path.join(root, "index.html");
}

http.createServer((req, res) => {
  const file = fileFor(new URL(req.url, "http://x").pathname);
  if (!file) { res.writeHead(404, { "content-type": "text/plain" }).end("not found"); return; }
  res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream", "cache-control": "no-cache" });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`http://localhost:${port}`));
