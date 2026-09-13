// Functional test: run the page's <script> in a mocked browser env,
// fire the real map "click" handler, and verify the radiometrics report
// (radioReadout) is populated with the expected values.
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const REPO = "/tmp/eas";
const html = fs.readFileSync(path.join(REPO, "ireland-geology-map.html"), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// ---- DOM mock ----
const elements = {};
function mkEl(id) {
  return {
    id,
    style: {},
    innerHTML: "",
    textContent: "",
    offsetHeight: 120,
    checked: id === "rDose", // rDose starts checked in the HTML
    disabled: false,
    _listeners: {},
    addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); },
  };
}
const document = {
  getElementById(id) { return (elements[id] = elements[id] || mkEl(id)); },
  createElement(tag) {
    if (tag === "canvas") {
      return {
        width: 0, height: 0,
        getContext() {
          return {
            createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
            putImageData() {},
          };
        },
        toDataURL() { return "data:image/png;base64,"; },
      };
    }
    return mkEl("created-" + tag);
  },
};

// ---- Leaflet mock ----
const handlers = { click: [], mousemove: [], mouseout: [] };
const layer = { addTo() { return layer; }, removeLayer() {}, on() { return layer; } };
const L = {
  map() {
    return {
      on(type, fn) { if (handlers[type]) handlers[type].push(fn); return this; },
      addTo() { return this; },
      removeLayer() {},
    };
  },
  tileLayer() { return layer; },
  geoJSON() { return layer; },
  imageOverlay() { return layer; },
};

// ---- fetch mock (serves the real repo data) ----
async function fetch(url) {
  if (url.endsWith("meta.json")) {
    return { ok: true, json: async () => JSON.parse(fs.readFileSync(path.join(REPO, "data/radiometrics/meta.json"), "utf8")) };
  }
  if (url.endsWith("values.bin")) {
    const b = fs.readFileSync(path.join(REPO, "data/radiometrics/values.bin"));
    return { ok: true, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) };
  }
  if (url.endsWith("geology-100k.geojson")) {
    return { ok: true, json: async () => ({ type: "FeatureCollection", features: [] }) };
  }
  return { ok: false, status: 404, json: async () => ({}) };
}

const sandbox = {
  document, L, fetch, console,
  setTimeout, clearTimeout, setInterval, clearInterval,
  Promise, Math, JSON, Object, Array, Float32Array, Uint8ClampedArray,
  isFinite, Number, String, Boolean, Date,
};
vm.createContext(sandbox);
vm.runInContext(script, sandbox);

function fireClick(lat, lon) {
  handlers.click.forEach((fn) => fn({ latlng: { lat, lng: lon } }));
}

(async () => {
  // let loadRadioData()/loadGeology() resolve
  await new Promise((r) => setTimeout(r, 600));

  const readout = elements["radioReadout"];
  console.log("=== Click at Midlands (53.9, -7.7) ===");
  fireClick(53.9, -7.7);
  const mid = readout.innerHTML;
  console.log(mid.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  console.log("contains 'Radiometric Report':", mid.includes("Radiometric Report"));
  console.log("contains K value '0.465':", mid.includes("0.465"));
  console.log("contains 'ppm':", mid.includes("ppm"), " 'nGy/h':", mid.includes("nGy/h"));
  console.log("contains 'Th/U ratio':", mid.includes("Th/U ratio"));

  console.log("\n=== Click offshore SW (51.5, -10.0) ===");
  fireClick(51.5, -10.0);
  const off = readout.innerHTML;
  console.log(off.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  console.log("contains 'Outside survey':", off.includes("Outside survey"));

  console.log("\n=== Click at Cork (51.9, -8.45) ===");
  fireClick(51.9, -8.45);
  const cork = readout.innerHTML;
  console.log(cork.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());

  const ok = mid.includes("Radiometric Report") && mid.includes("0.465") && mid.includes("ppm") && off.includes("Outside survey");
  console.log("\nRESULT:", ok ? "PASS ✅ — click populates the radiometrics report" : "FAIL ❌");
  process.exit(ok ? 0 : 1);
})();
