'use strict';

const cfg = require('./config');

const SITE = String(cfg.SITE_URL).replace(/\/+$/, '');

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const MONTHS = [
  'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
];

function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  if (!m) return String(iso);
  return parseInt(m[3], 10) + ' ' + MONTHS[parseInt(m[2], 10) - 1] + ' ' + m[1];
}

/** पूरा (absolute) URL */
function abs(p) {
  if (/^https?:\/\//i.test(p)) return p;
  return SITE + '/' + String(p).replace(/^\/+/, '');
}

/** पेज के हिसाब से relative URL */
function rel(root, p) {
  if (/^https?:\/\//i.test(p)) return p;
  return root + String(p).replace(/^\/+/, '');
}

function ld(obj) {
  return '<script type="application/ld+json">' +
    JSON.stringify(obj).replace(/</g, '\\u003c') + '</script>';
}

const NAV = [
  ['index.html', 'होम'],
  ['search.html', 'खोजें'],
  ['about.html', 'हमारे बारे में'],
  ['contact.html', 'संपर्क'],
];
const FOOT = NAV.concat([
  ['privacy-policy.html', 'गोपनीयता नीति'],
  ['terms.html', 'नियम और शर्तें'],
]);

function href(root, file) {
  return file === 'index.html' ? (root || './') : root + file;
}

function orgNode() {
  return {
    '@type': 'Organization',
    '@id': SITE + '/#organization',
    name: cfg.SITE_NAME,
    url: SITE + '/',
    logo: { '@type': 'ImageObject', url: abs(cfg.LOGO) },
  };
}

function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': SITE + '/#website',
    name: cfg.SITE_NAME,
    url: SITE + '/',
    inLanguage: 'hi-IN',
    publisher: { '@id': SITE + '/#organization' },
    potentialAction: {
      '@type': 'SearchAction',
      target: SITE + '/search.html?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}

function header(root, active) {
  const links = NAV.map(([f, label]) =>
    '<a href="' + esc(href(root, f)) + '"' + (f === active ? ' aria-current="page"' : '') + '>' + label + '</a>'
  ).join('');
  return '<header class="site-header"><div class="container header-inner">' +
    '<a class="brand" href="' + esc(href(root, 'index.html')) + '" aria-label="' + esc(cfg.SITE_NAME) + ' होम">' +
    '<span class="logo-mark" aria-hidden="true">TR</span><span class="brand-name">' + esc(cfg.SITE_NAME) + '</span></a>' +
    '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="मेन्यू खोलें">' +
    '<span></span><span></span><span></span></button>' +
    '<nav id="site-nav" class="site-nav" aria-label="मुख्य मेन्यू">' + links + '</nav>' +
    '</div></header>';
}

function footer(root) {
  const links = FOOT.map(([f, label]) =>
    '<li><a href="' + esc(href(root, f)) + '">' + label + '</a></li>'
  ).join('');
  return '<footer class="site-footer"><div class="container footer-inner">' +
    '<div class="footer-brand"><a class="brand" href="' + esc(href(root, 'index.html')) + '">' +
    '<span class="logo-mark" aria-hidden="true">TR</span><span class="brand-name">' + esc(cfg.SITE_NAME) + '</span></a>' +
    '<p>' + esc(cfg.SITE_TAGLINE) + '।</p></div>' +
    '<nav class="footer-links" aria-label="फ़ुटर लिंक"><ul>' + links + '</ul></nav>' +
    '</div><div class="container footer-copy"><p>© <span data-year>' + new Date().getFullYear() +
    '</span> ' + esc(cfg.SITE_NAME) + '। सर्वाधिकार सुरक्षित।</p></div></footer>';
}

function robotSvg() {
  return '<svg class="robot-svg" viewBox="0 0 140 150" xmlns="http://www.w3.org/2000/svg" focusable="false">' +
    '<defs>' +
    '<linearGradient id="rg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8B5CF6"/><stop offset="1" stop-color="#1D6FD8"/></linearGradient>' +
    '<linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C4B5FD"/><stop offset="1" stop-color="#93C5FD"/></linearGradient>' +
    '</defs>' +
    '<line x1="70" y1="14" x2="70" y2="30" stroke="#5B21B6" stroke-width="4" stroke-linecap="round"/>' +
    '<circle class="robot-antenna" cx="70" cy="12" r="8" fill="#F2705F"/>' +
    '<rect x="22" y="30" width="96" height="78" rx="24" fill="url(#rg1)"/>' +
    '<rect x="32" y="42" width="76" height="46" rx="16" fill="#1E1B4B" opacity="0.88"/>' +
    '<g class="robot-eyes"><ellipse cx="53" cy="65" rx="9" ry="11" fill="#C4B5FD"/><ellipse cx="87" cy="65" rx="9" ry="11" fill="#C4B5FD"/></g>' +
    '<path d="M58 97 Q70 105 82 97" fill="none" stroke="#EDE9FE" stroke-width="4" stroke-linecap="round"/>' +
    '<rect x="10" y="58" width="12" height="28" rx="6" fill="#5B21B6"/>' +
    '<rect x="118" y="58" width="12" height="28" rx="6" fill="#5B21B6"/>' +
    '<rect x="42" y="114" width="56" height="28" rx="14" fill="url(#rg2)"/>' +
    '<circle cx="70" cy="128" r="5" fill="#F6B73C"/>' +
    '</svg>';
}

function welcome() {
  return '<div class="welcome" id="welcome" role="dialog" aria-modal="true" aria-label="स्वागत">' +
    '<div class="welcome-card">' +
    '<div class="robot" aria-hidden="true">' + robotSvg() + '</div>' +
    '<p class="welcome-text" id="welcome-text" data-text="नमस्ते! ' + esc(cfg.SITE_NAME) + ' में आपका स्वागत है"></p>' +
    '<p class="welcome-sub">हिंदी में AI की दुनिया, सरल भाषा में</p>' +
    '<button class="btn btn-ghost" id="welcome-skip" type="button">छोड़ें</button>' +
    '</div></div>';
}

/**
 * पूरा HTML पेज बनाता है।
 * o: { title, description, canonical, robots, ogType, image, imageAlt, jsonld, root, active, page, main, welcome, extraHead }
 */
function renderPage(o) {
  const root = o.root;
  const robots = o.robots || 'index, follow, max-image-preview:large';
  const image = abs(o.image || cfg.DEFAULT_IMAGE);
  const imageAlt = o.imageAlt || cfg.SITE_NAME;
  const noindex = /noindex/.test(robots);

  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="google" content="notranslate">',
    '<title>' + esc(o.title) + '</title>',
    '<meta name="description" content="' + esc(o.description) + '">',
    '<meta name="robots" content="' + esc(robots) + '">',
    '<meta name="theme-color" content="#F3F0FF">',
    o.canonical ? '<link rel="canonical" href="' + esc(o.canonical) + '">' : '',
    '<meta property="og:type" content="' + esc(o.ogType || 'website') + '">',
    '<meta property="og:site_name" content="' + esc(cfg.SITE_NAME) + '">',
    '<meta property="og:locale" content="hi_IN">',
    '<meta property="og:title" content="' + esc(o.title) + '">',
    '<meta property="og:description" content="' + esc(o.description) + '">',
    o.canonical ? '<meta property="og:url" content="' + esc(o.canonical) + '">' : '',
    '<meta property="og:image" content="' + esc(image) + '">',
    '<meta property="og:image:alt" content="' + esc(imageAlt) + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + esc(o.title) + '">',
    '<meta name="twitter:description" content="' + esc(o.description) + '">',
    '<meta name="twitter:image" content="' + esc(image) + '">',
    '<meta name="twitter:image:alt" content="' + esc(imageAlt) + '">',
    o.extraHead || '',
    '<link rel="icon" href="' + esc(root + cfg.LOGO) + '" type="image/svg+xml">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap">',
    '<link rel="stylesheet" href="' + esc(root + 'assets/css/style.css') + '">',
    o.jsonld || '',
    '<script>(function(){var h=document.documentElement;h.classList.add("js");' +
      (o.welcome
        ? 'try{var r=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;' +
          'if(!sessionStorage.getItem("trai-welcome")&&!r){h.classList.add("welcome-on");}}catch(e){}'
        : '') +
      '})();</script>',
  ].filter(Boolean).join('\n');

  void noindex;
  return '<!DOCTYPE html>\n<html lang="hi" translate="no">\n<head>\n' + head + '\n</head>\n' +
    '<body data-root="' + esc(root) + '" data-page="' + esc(o.page || '') + '">\n' +
    '<a class="skip" href="#main">मुख्य सामग्री पर जाएँ</a>\n' +
    (o.welcome ? welcome() + '\n' : '') +
    header(root, o.active) + '\n' +
    '<main id="main">' + o.main + '</main>\n' +
    footer(root) + '\n' +
    '<script src="' + esc(root + 'assets/js/app.js') + '" defer></script>\n' +
    '</body>\n</html>\n';
}

/** लेख-कार्ड (JS वाले कार्ड जैसा ही markup) */
function card(a, root, level) {
  const h = level || 'h3';
  return '<article class="card">' +
    '<a class="card-link" href="' + esc(root + 'articles/' + a.slug + '.html') + '">' +
    '<div class="card-media"><img src="' + esc(rel(root, a.image)) + '" alt="' + esc(a.title) +
    '" width="1200" height="630" loading="lazy" decoding="async"></div>' +
    '<div class="card-body"><p class="card-meta"><time datetime="' + esc(String(a.date).slice(0, 10)) + '">' +
    esc(formatDate(a.date)) + '</time><span class="dot" aria-hidden="true"></span><span>' + a.readingTime + ' मिनट</span></p>' +
    '<' + h + ' class="card-title">' + esc(a.title) + '</' + h + '>' +
    '<p class="card-excerpt">' + esc(a.excerpt) + '</p>' +
    '<span class="card-more">पूरा पढ़ें</span></div></a></article>';
}

module.exports = {
  cfg, SITE, esc, formatDate, abs, rel, ld, href, header, footer, renderPage,
  orgNode, websiteNode, card, NAV, FOOT,
};
