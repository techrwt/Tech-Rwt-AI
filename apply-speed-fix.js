// apply-speed-fix.js  -  TECH RWT AI ki speed fix (ek baar chalao)
// Chalane ka tarika (repo ke root folder se):  node apply-speed-fix.js
// Phir apna roz wala build command chalao aur push karo.
// Ye karta hai:
//  1. Google Fonts hata deta hai (scripts/layout.js)
//  2. style.css ko HTML ke andar inline karwata hai (scripts/layout.js)
//  3. assets/css/style.css: hero ka fade-in animation band, cards se backdrop-filter blur hata
//  4. Privacy policy se "Google Fonts" wali line hata deta hai

const fs = require("fs");
const path = require("path");

const patched = [];
const skipped = [];

function edit(file, fn, label) {
  if (!fs.existsSync(file)) { skipped.push(`${label}: ${file} nahi mili`); return; }
  const before = fs.readFileSync(file, "utf8");
  const after = fn(before);
  if (after === before) { skipped.push(`${label}: kuch badla nahi (shayad pehle ho chuka)`); return; }
  fs.writeFileSync(file, after, "utf8");
  patched.push(`${label}: ${file}`);
}

// ---------- 1 + 2. layout.js ----------
const layoutFile = ["scripts/layout.js", "layout.js"].find((f) => fs.existsSync(f)) || "scripts/layout.js";
edit(layoutFile, (src) => {
  let out = src;

  // Google Fonts ki saari lines hatao
  out = out.split("\n").filter((line) =>
    !/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(line) &&
    !/फ़ॉन्ट CSS पेज को रोकती नहीं/.test(line)
  ).join("\n");

  // CSS inline
  if (!out.includes("INLINE_CSS")) {
    out = out.replace(/(const SITE = [^\n]*\n)/, (m) => m + `
// Speed: style.css ko HTML ke andar inline karte hain (render-blocking request hat jati hai)
const INLINE_CSS = (function () {
  try {
    return fs.readFileSync(path.join(__dirname, '..', 'assets', 'css', 'style.css'), 'utf8')
      .replace(/\\/\\*[\\s\\S]*?\\*\\//g, '').replace(/\\s+/g, ' ').replace(/\\s*([{};,])\\s*/g, '$1').replace(/:\\s+/g, ':').trim();
  } catch (e) { return ''; }
})();
`);
    out = out.replace(
      /(\s*)'<link rel="stylesheet" href="' \+ esc\(root \+ 'assets\/css\/style\.css'\) \+ '">',/,
      (m, sp) => `${sp}INLINE_CSS ? '<style>' + INLINE_CSS + '</style>' : '<link rel="stylesheet" href="' + esc(root + 'assets/css/style.css') + '">',`
    );
  }
  return out;
}, "layout.js");

// ---------- 3. style.css ----------
edit("assets/css/style.css", (src) => {
  let out = src;
  out = out.replace("  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);\n", "");
  if (!out.includes(".hero.fade-in")) {
    out = out.replace(/(\.fade-in \{[^}]*\}\n)/, "$1.hero.fade-in { animation: none; }\n");
  }
  return out;
}, "style.css");

// ---------- 4. privacy policy se Google Fonts line ----------
function walk(dir, acc) {
  for (const f of fs.readdirSync(dir)) {
    if (f === "node_modules" || f === ".git" || f === "articles" || f === "assets") continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, acc); else if (p.endsWith(".js")) acc.push(p);
  }
  return acc;
}
for (const f of walk(".", [])) {
  const s = fs.readFileSync(f, "utf8");
  if (!s.includes("Google Fonts")) continue;
  edit(f, (src) => src.replace(/'<h2>तीसरे पक्ष की सेवाएँ<\/h2>' \+\s*'<p>[^']*Google Fonts[^']*<\/p>' \+\s*/, ""), "privacy");
}

console.log("\nBadle gaye:");
patched.forEach((x) => console.log("  OK  " + x));
if (skipped.length) { console.log("\nSkip:"); skipped.forEach((x) => console.log("  --  " + x)); }
