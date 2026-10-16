#!/usr/bin/env node
'use strict';

/*
 * TECH RWT AI – generator (सिर्फ़ Node, कोई npm पैकेज नहीं)
 * data/batches/batch-N.json  →  articles-index.json, manifest.json,
 * articles/{slug}.html, sitemap.xml, robots.txt और स्थिर पेज।
 */

const fs = require('fs');
const path = require('path');
const L = require('./layout');
const { buildStaticPages, SITEMAP_PAGES } = require('./pages');

const cfg = L.cfg;
const SITE = L.SITE;
const ROOT = path.resolve(__dirname, '..');
const BATCH_DIR = path.join(ROOT, 'data', 'batches');
const ARTICLES_DIR = path.join(ROOT, 'articles');

const STRING_FIELDS = [
  'id', 'slug', 'title', 'seoTitle', 'date', 'author',
  'searchDescription', 'image', 'imageCredit', 'excerpt', 'content',
];
const BOOL_FIELDS = ['featured', 'trending'];
// वैकल्पिक: "updated": "YYYY-MM-DD" – लेख बदलने पर डालिए (dateModified / sitemap lastmod / ताज़ा संकेत)

const errors = [];
const fail = (msg) => errors.push(msg);

function die() {
  console.error('\n✖ जनरेटर रुक गया। ये गलतियाँ ठीक करें:\n');
  errors.forEach((e) => console.error('  • ' + e));
  console.error('\n(' + errors.length + ' गलती)\n');
  process.exit(1);
}

// ---------- 1. batch फ़ाइलें पढ़ना ----------
function loadBatches() {
  if (!fs.existsSync(BATCH_DIR)) {
    fail('फ़ोल्डर नहीं मिला: data/batches/');
    return [];
  }
  const files = fs.readdirSync(BATCH_DIR).filter((f) => f.toLowerCase().endsWith('.json'));
  const parsed = [];

  for (const file of files) {
    const m = /^batch-(\d+)\.json$/.exec(file);
    if (!m) {
      fail(file + ': फ़ाइल का नाम batch-N.json जैसा होना चाहिए (जैसे batch-12.json)');
      continue;
    }
    const num = parseInt(m[1], 10);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(BATCH_DIR, file), 'utf8').replace(/^﻿/, ''));
    } catch (e) {
      fail(file + ': JSON गलत है – ' + e.message);
      continue;
    }
    if (!Array.isArray(data)) {
      fail(file + ': फ़ाइल में JSON array [ { ... } ] होना चाहिए');
      continue;
    }
    if (data.length !== 1) {
      fail(file + ': हर batch फ़ाइल में सिर्फ़ 1 लेख होना चाहिए (अभी ' + data.length + ' हैं)');
      continue;
    }
    const a = data[0];
    if (!a || typeof a !== 'object' || Array.isArray(a)) {
      fail(file + ': array के अंदर एक object { ... } होना चाहिए');
      continue;
    }
    if (validate(a, file)) {
      parsed.push({ file, num, article: Object.assign({}, a, { id: String(a.id), batch: num }) });
    }
  }
  parsed.sort((x, y) => x.num - y.num);
  return parsed;
}

function validate(a, file) {
  let ok = true;
  const bad = (msg) => { fail(file + ': ' + msg); ok = false; };

  for (const k of STRING_FIELDS) {
    const v = a[k];
    if (v === undefined || v === null || (typeof v !== 'string' && !(k === 'id' && typeof v === 'number'))) {
      bad('"' + k + '" फ़ील्ड गायब है या गलत प्रकार का है');
    } else if (String(v).trim() === '') {
      bad('"' + k + '" खाली है');
    }
  }
  for (const k of BOOL_FIELDS) {
    if (typeof a[k] !== 'boolean') bad('"' + k + '" true या false होना चाहिए');
  }
  if (!Array.isArray(a.keyPoints) || a.keyPoints.length === 0 ||
      a.keyPoints.some((p) => typeof p !== 'string' || !p.trim())) {
    bad('"keyPoints" में कम से कम एक पाठ वाला बिंदु होना चाहिए (array of strings)');
  }
  if (typeof a.slug === 'string' && a.slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug)) {
    bad('slug "' + a.slug + '" गलत है – सिर्फ़ छोटे अंग्रेज़ी अक्षर, अंक और "-" (जैसे ai-kya-hai)');
  }
  if (a.updated !== undefined && (typeof a.updated !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(a.updated) || isNaN(Date.parse(a.updated)))) {
    bad('"updated" YYYY-MM-DD रूप में होना चाहिए (या इस फ़ील्ड को हटा दें)');
  }
  if (typeof a.date === 'string' && a.date.trim()) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(a.date);
    if (!m || isNaN(Date.parse(a.date))) bad('"date" YYYY-MM-DD रूप में होना चाहिए (जैसे 2026-10-16)');
  }
  return ok;
}

// लेख के अंदर के लिंक: सिर्फ़ /articles/slug.html जैसे अंदरूनी लिंक, और वो slug सच में मौजूद हो
function checkLinks(items) {
  const slugs = new Set(items.map((it) => it.article.slug));
  for (const it of items) {
    const a = it.article;
    const re = /<a\b[^>]*?href\s*=\s*["']([^"']*)["']/gi;
    let m;
    let count = 0;
    while ((m = re.exec(a.content))) {
      count++;
      const h = m[1];
      const mm = /^\/articles\/([a-z0-9-]+)\.html$/.exec(h);
      if (!mm) fail(it.file + ': लिंक "' + h + '" गलत है – सिर्फ़ /articles/slug.html जैसे अंदरूनी लिंक चलेंगे');
      else if (!slugs.has(mm[1])) fail(it.file + ': लिंक "' + h + '" का लेख मौजूद नहीं है (slug "' + mm[1] + '" नहीं मिला)');
      else if (mm[1] === a.slug) fail(it.file + ': लेख खुद को ही लिंक कर रहा है');
    }
    if (count > 6) fail(it.file + ': ' + count + ' लिंक हैं, 2 से 4 काफ़ी हैं (6 से ज़्यादा spammy लगते हैं)');
  }
}

function checkDuplicates(items) {
  const ids = new Map();
  const slugs = new Map();
  for (const it of items) {
    const { id, slug } = it.article;
    if (ids.has(id)) fail('duplicate id "' + id + '": ' + ids.get(id) + ' और ' + it.file);
    else ids.set(id, it.file);
    if (slugs.has(slug)) fail('duplicate slug "' + slug + '": ' + slugs.get(slug) + ' और ' + it.file);
    else slugs.set(slug, it.file);
  }
}

// ---------- सहायक ----------
function readingTime(html) {
  const text = html.replace(/<[^>]*>/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / (cfg.WORDS_PER_MINUTE || 180)));
}

function splitH1(content) {
  let h1 = null;
  let body = content.replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i, (m, inner) => {
    h1 = inner.trim();
    return '';
  });
  // बाकी बचे h1 को h2 बना दें, ताकि पेज पर एक ही H1 रहे
  body = body.replace(/<h1\b/gi, '<h2').replace(/<\/h1>/gi, '</h2>');
  return { h1, body };
}

function tokens(s) {
  return String(s).toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u).filter((t) => t.length >= 3);
}

function related(a, all) {
  const mine = new Set(tokens(a.title + ' ' + a.excerpt + ' ' + a.keyPoints.join(' ')));
  return all
    .filter((o) => o.slug !== a.slug)
    .map((o) => {
      let score = 0;
      for (const t of new Set(tokens(o.title + ' ' + o.excerpt + ' ' + o.keyPoints.join(' ')))) {
        if (mine.has(t)) score++;
      }
      return { o, score };
    })
    .sort((x, y) => y.score - x.score || (x.o.date < y.o.date ? 1 : -1))
    .slice(0, 3)
    .map((x) => x.o);
}

// ---------- 4. लेख का स्थिर पेज ----------
function renderArticle(a, all) {
  const url = SITE + '/articles/' + a.slug + '.html';
  const root = '../';
  const { h1, body } = splitH1(a.content);
  const imgAbs = L.abs(L.variants(a.image).og);
  const published = String(a.date).slice(0, 10);
  const modified = String(a.updated || a.date).slice(0, 10);
  const isOrg = /टीम|team|desk|staff/i.test(a.author);
  const wordCount = a.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;

  const enc = encodeURIComponent;
  const shares = {
    wa: 'https://wa.me/?text=' + enc(a.title + ' ' + url),
    fb: 'https://www.facebook.com/sharer/sharer.php?u=' + enc(url),
    x: 'https://x.com/intent/post?text=' + enc(a.title) + '&url=' + enc(url),
  };

  const rel3 = related(a, all);
  const relatedHtml = rel3.length
    ? '<section class="container related" aria-labelledby="related-title">' +
      '<h2 id="related-title" class="section-title">और पढ़ें</h2>' +
      '<div class="grid">' + rel3.map((o) => L.card(o, root, 'h3')).join('') + '</div></section>'
    : '';

  const main =
    '<div class="container article-container">' +
    '<article class="article-wrap">' +
    '<nav class="breadcrumb" aria-label="ब्रेडक्रंब"><a href="' + root + '">होम</a>' +
    '<span aria-hidden="true">›</span><span aria-current="page">' + L.esc(a.title) + '</span></nav>' +
    '<header class="article-head fade-in">' +
    '<h1 class="article-title">' + (h1 || L.esc(a.title)) + '</h1>' +
    '<p class="article-meta"><span>' + L.esc(a.author) + '</span><span class="dot" aria-hidden="true"></span>' +
    '<time datetime="' + L.esc(published) + '">' + L.esc(L.formatDate(a.date)) + '</time>' +
    (modified !== published ? '<span class="dot" aria-hidden="true"></span><span>अपडेट: <time datetime="' + L.esc(modified) + '">' + L.esc(L.formatDate(modified)) + '</time></span>' : '') +
    '<span class="dot" aria-hidden="true"></span><span>' + a.readingTime + ' मिनट में पढ़ें</span></p>' +
    '</header>' +
    '<figure class="article-figure fade-in"><img src="' + L.esc(L.rel(root, L.variants(a.image).full)) + '" alt="' + L.esc(a.title) +
    '" width="1200" height="630" fetchpriority="high" decoding="async">' +
    '<figcaption>चित्र: ' + L.esc(a.imageCredit) + '</figcaption></figure>' +
    '<aside class="keypoints fade-in" aria-labelledby="kp-title"><h2 id="kp-title">मुख्य बातें</h2><ul>' +
    a.keyPoints.map((p) => '<li>' + L.esc(p) + '</li>').join('') + '</ul></aside>' +
    '<div class="prose">' + body + '</div>' +
    '<section class="share" aria-labelledby="share-title"><h2 id="share-title">इस लेख को शेयर करें</h2>' +
    '<div class="share-buttons">' +
    '<a class="share-btn share-wa" href="' + L.esc(shares.wa) + '" target="_blank" rel="noopener noreferrer">WhatsApp</a>' +
    '<a class="share-btn share-fb" href="' + L.esc(shares.fb) + '" target="_blank" rel="noopener noreferrer">Facebook</a>' +
    '<a class="share-btn share-x" href="' + L.esc(shares.x) + '" target="_blank" rel="noopener noreferrer">X</a>' +
    '<button class="share-btn share-copy" type="button" data-copy="' + L.esc(url) + '">लिंक कॉपी करें</button>' +
    '</div><p class="share-status" role="status" aria-live="polite"></p></section>' +
    '</article></div>' + relatedHtml;

  const jsonld = L.ld({
    '@context': 'https://schema.org',
    '@graph': [
      L.orgNode(),
      L.websiteNode(),
      {
        '@type': 'Article',
        '@id': url + '#article',
        headline: a.title,
        description: a.searchDescription,
        image: [imgAbs],
        datePublished: a.date,
        dateModified: a.updated || a.date,
        author: { '@type': isOrg ? 'Organization' : 'Person', name: a.author },
        publisher: { '@id': SITE + '/#organization' },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        isPartOf: { '@id': SITE + '/#website' },
        inLanguage: 'hi-IN',
        wordCount,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'होम', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: a.title, item: url },
        ],
      },
    ],
  });

  return L.renderPage({
    title: a.seoTitle,
    description: a.searchDescription,
    canonical: url,
    ogType: 'article',
    image: a.image,
    imageAlt: a.title,
    root,
    page: 'article',
    main,
    jsonld,
    extraHead:
      '<meta property="article:published_time" content="' + L.esc(a.date) + '">' +
      '<meta property="article:modified_time" content="' + L.esc(a.updated || a.date) + '">' +
      '<meta property="article:author" content="' + L.esc(a.author) + '">',
  });
}

// ---------- मुख्य ----------
function main() {
  const items = loadBatches();
  checkDuplicates(items);
  checkLinks(items);
  if (errors.length) die();

  const articles = items.map((it) => {
    const a = it.article;
    a.readingTime = readingTime(a.content);
    return a;
  });

  // तारीख के हिसाब से नया पहले
  articles.sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : y.batch - x.batch));

  // 2. articles-index.json (content के बिना)
  const index = articles.map((a) => {
    const copy = Object.assign({}, a);
    delete copy.content;
    copy.url = 'articles/' + a.slug + '.html';
    const v = L.variants(a.image); // app.js (और खोज) कार्ड में हल्की webp दिखाए
    copy.imageFull = v.full;
    copy.imageCard = v.card;
    return copy;
  });
  fs.writeFileSync(path.join(ROOT, 'data', 'articles-index.json'), JSON.stringify(index, null, 2) + '\n');

  // 3. manifest.json
  const manifest = {
    batchFiles: items.map((it) => it.file),
    totalArticles: articles.length,
    lastUpdated: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(ROOT, 'data', 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  // 4. articles/{slug}.html
  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  const keep = new Set(articles.map((a) => a.slug + '.html'));
  for (const f of fs.readdirSync(ARTICLES_DIR)) {
    if (f.endsWith('.html') && !keep.has(f)) fs.unlinkSync(path.join(ARTICLES_DIR, f)); // हटाए गए लेख का पुराना पेज
  }
  for (const a of articles) {
    fs.writeFileSync(path.join(ARTICLES_DIR, a.slug + '.html'), renderArticle(a, articles));
  }

  // स्थिर पेज (SITE_URL बदलने पर canonical भी ठीक रहें)
  buildStaticPages(articles);

  // 5. sitemap.xml + robots.txt
  const latest = articles.length ? String(articles[0].date).slice(0, 10) : new Date().toISOString().slice(0, 10);
  const xmlEsc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const urls = [];
  for (const p of SITEMAP_PAGES) {
    urls.push({
      loc: SITE + '/' + p,
      lastmod: latest,
      freq: p === '' ? 'daily' : 'yearly',
      pr: p === '' ? '1.0' : '0.3',
    });
  }
  for (const a of articles) {
    urls.push({
      loc: SITE + '/articles/' + a.slug + '.html',
      lastmod: String(a.updated || a.date).slice(0, 10),
      freq: 'monthly',
      pr: '0.8',
    });
  }
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) =>
      '  <url>\n    <loc>' + xmlEsc(u.loc) + '</loc>\n    <lastmod>' + u.lastmod + '</lastmod>\n' +
      '    <changefreq>' + u.freq + '</changefreq>\n    <priority>' + u.pr + '</priority>\n  </url>'
    ).join('\n') + '\n</urlset>\n';
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: ' + SITE + '/sitemap.xml\n');

  // 6. feed.xml (RSS) – Google/रीडर्स को नए लेख जल्दी मिलते हैं
  const rss = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n' +
    '<title>' + xmlEsc(cfg.SITE_NAME) + '</title>\n<link>' + SITE + '/</link>\n' +
    '<description>' + xmlEsc(cfg.SITE_TAGLINE) + '</description>\n<language>hi-IN</language>\n' +
    articles.slice(0, 30).map((a) =>
      '<item><title>' + xmlEsc(a.title) + '</title><link>' + SITE + '/articles/' + a.slug + '.html</link>' +
      '<guid isPermaLink="true">' + SITE + '/articles/' + a.slug + '.html</guid>' +
      '<pubDate>' + new Date(a.date).toUTCString() + '</pubDate>' +
      '<description>' + xmlEsc(a.searchDescription) + '</description></item>'
    ).join('\n') + '\n</channel></rss>\n';
  fs.writeFileSync(path.join(ROOT, 'feed.xml'), rss);

  console.log('✔ पूरा हुआ');
  console.log('  batch फ़ाइलें : ' + items.length);
  console.log('  कुल लेख      : ' + articles.length);
  console.log('  SITE_URL     : ' + SITE);
}

main();
