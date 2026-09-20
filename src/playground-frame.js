// The page inside the playground preview. It gets compiled code from the playground page (same site only),
// loads it as a module from a blob: address and mounts the component.
import { mount } from "../vendor/mau/index.js";

const app = document.getElementById("app");
let destroy = null;

async function show(code) {
  destroy?.();
  destroy = null;
  try {
    const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
    const mod = await import(url);
    URL.revokeObjectURL(url);
    destroy = mount(app, mod.default);
  } catch (e) {
    app.textContent = "";
    const pre = document.createElement("pre");
    pre.className = "mau-error";
    pre.textContent = String(e && e.message ? e.message : e);
    app.append(pre);
  }
}

addEventListener("message", (e) => {
  if (e.origin !== location.origin || e.source !== parent) return;
  if (typeof e.data?.code === "string") show(e.data.code);
});

parent.postMessage({ ready: true }, location.origin);
