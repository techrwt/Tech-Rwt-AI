/**
 * generate-index.js
 * ------------------------------------------------------------
 * TECH RWT AI — Article Index Generator
 *
 * Scans data/articles/batch-*.json, and regenerates:
 *   - data/articles-index.json   (lightweight summary, no `content`)
 *   - data/articles/manifest.json ({ totalBatches, latest })
 *
 * Run manually:   node generate-index.js
 * Run automatically via .github/workflows/update-index.yml
 * whenever a batch-*.json file is pushed.
 *
 * Pure Node.js — no npm dependencies required.
 * ------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");

const ARTICLES_DIR = path.join(__dirname, "data", "articles");
const INDEX_PATH = path.join(__dirname, "data", "articles-index.json");
const MANIFEST_PATH = path.join(ARTICLES_DIR, "manifest.json");

const REQUIRED_FIELDS = [
  "id", "title", "slug", "date", "author",
  "featured", "trending", "searchDescription", "image", "excerpt"
];

function log(msg) {
  console.log(`[generate-index] ${msg}`);
}

function getBatchFiles() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    throw new Error(`Articles directory not found: ${ARTICLES_DIR}`);
  }

  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => /^batch-(\d+)\.json$/.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.match(/^batch-(\d+)\.json$/)[1], 10);
      const numB = parseInt(b.match(/^batch-(\d+)\.json$/)[1], 10);
      return numA - numB;
    });
}

function loadBatch(filename) {
  const batchNumber = parseInt(filename.match(/^batch-(\d+)\.json$/)[1], 10);
  const fullPath = path.join(ARTICLES_DIR, filename);

  let raw;
  try {
    raw = fs.readFileSync(fullPath, "utf-8");
  } catch (err) {
    throw new Error(`Could not read ${filename}: ${err.message}`);
  }

  let articles;
  try {
    articles = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${filename}: ${err.message}`);
  }

  if (!Array.isArray(articles)) {
    throw new Error(`${filename} must contain a JSON array of articles`);
  }

  articles.forEach((article, i) => {
    REQUIRED_FIELDS.forEach((field) => {
      if (!(field in article)) {
        log(`⚠ Warning: ${filename} article #${i + 1} is missing field "${field}"`);
      }
    });
    if ("category" in article) {
      log(`⚠ Warning: ${filename} article #${i + 1} has a "category" field — this site does not use categories`);
    }
  });

  return { batchNumber, articles };
}

function buildIndexEntry(article, batchNumber) {
  const { content, ...rest } = article; // eslint-disable-line no-unused-vars
  return { ...rest, batch: batchNumber };
}

function main() {
  log("Scanning batch files...");
  const batchFiles = getBatchFiles();

  if (batchFiles.length === 0) {
    log("⚠ No batch-*.json files found. Nothing to index.");
    return;
  }

  let allIndexEntries = [];
  let latestBatch = 0;

  for (const filename of batchFiles) {
    const { batchNumber, articles } = loadBatch(filename);
    latestBatch = Math.max(latestBatch, batchNumber);

    const entries = articles.map((a) => buildIndexEntry(a, batchNumber));
    allIndexEntries = allIndexEntries.concat(entries);

    log(`  ✓ ${filename} — ${articles.length} article(s)`);
  }

  // Sort newest first
  allIndexEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Check for duplicate slugs across batches
  const seenSlugs = new Set();
  allIndexEntries.forEach((entry) => {
    if (seenSlugs.has(entry.slug)) {
      log(`⚠ Warning: duplicate slug found across batches: "${entry.slug}"`);
    }
    seenSlugs.add(entry.slug);
  });

  fs.writeFileSync(INDEX_PATH, JSON.stringify(allIndexEntries, null, 2) + "\n", "utf-8");
  log(`Wrote ${INDEX_PATH} (${allIndexEntries.length} total articles)`);

  const manifest = {
    totalBatches: batchFiles.length,
    latest: latestBatch
  };
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
  log(`Wrote ${MANIFEST_PATH} — ${JSON.stringify(manifest)}`);

  log("Done ✔");
}

main();
