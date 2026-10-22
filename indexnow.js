// indexnow.js (TECH RWT AI) - URLs Bing/Yandex ko IndexNow se bhejta hai.
// Tarika 1 (auto): build script ne temp folder me "indexnow-urls-ai.json" bani ho to wahi list bhejta hai.
//   node indexnow.js
// Tarika 2 (bina build script): sitemap.xml se saare URLs bhejta hai.
//   node indexnow.js --all
// Test (kuch bheje bina): DRY_RUN=1 node indexnow.js --all   (Windows CMD: set DRY_RUN=1 && node indexnow.js --all)
const fs = require("fs");
const os = require("os");
const path = require("path");

const HOST = "techrawatai.sbs";
const listFile = path.join(os.tmpdir(), "indexnow-urls-ai.json");

// IndexNow key: pehle root ki key.txt dekhta hai (andar sirf key likhi ho), nahi to <key>.txt naam wali file.
function findKey() {
  if (fs.existsSync("key.txt")) {
    const k = fs.readFileSync("key.txt", "utf8").trim();
    if (/^[a-zA-Z0-9-]{8,128}$/.test(k)) return { key: k, loc: `https://${HOST}/key.txt` };
    console.log("key.txt ke andar sirf key honi chahiye (8-128 akshar/ank, koi space ya line nahi).");
    return null;
  }
  for (const f of fs.readdirSync(".")) {
    if (!f.endsWith(".txt")) continue;
    const k = f.slice(0, -4);
    if (/^[a-zA-Z0-9-]{8,128}$/.test(k) && fs.readFileSync(f, "utf8").trim() === k) return { key: k, loc: `https://${HOST}/${f}` };
  }
  return null;
}

let payload;
if (process.argv.includes("--all")) {
  if (!fs.existsSync("sitemap.xml")) { console.log("sitemap.xml nahi mili (site ke root me chalao)."); process.exit(1); }
  const xml = fs.readFileSync("sitemap.xml", "utf8");
  const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]).filter((u) => u.includes(HOST));
  const k = findKey();
  if (!k) { console.log("Key file nahi mili: root me key.txt banao (andar sirf key)."); process.exit(1); }
  payload = { host: HOST, key: k.key, keyLocation: k.loc, urlList: urls };
} else {
  if (!fs.existsSync(listFile)) { console.log("Koi list nahi mili. Sab URLs ke liye: node indexnow.js --all"); process.exit(0); }
  payload = JSON.parse(fs.readFileSync(listFile, "utf8"));
}

if (!payload.urlList.length) { console.log("Koi URL nahi, IndexNow skip."); process.exit(0); }
console.log(`IndexNow: ${payload.urlList.length} URLs bhej raha hoon...`);
payload.urlList.forEach((u) => console.log(" -", u));
if (process.env.DRY_RUN) process.exit(0);

fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
}).then((r) => {
  console.log("IndexNow response:", r.status);
  process.exit(r.status === 200 || r.status === 202 ? 0 : 1);
}).catch((e) => { console.error(e); process.exit(1); });
