'use strict';

const fs = require('fs');
const path = require('path');
const L = require('./layout');

const ROOT = path.resolve(__dirname, '..');
const SITE = L.SITE;
const cfg = L.cfg;

function write(file, html) {
  fs.writeFileSync(path.join(ROOT, file), html, 'utf8');
}

function graph(nodes) {
  return L.ld({ '@context': 'https://schema.org', '@graph': nodes });
}

function simplePage(o) {
  // सामान्य (text) पेज: about, privacy, terms
  const main = '<div class="container page">' +
    '<div class="article-wrap fade-in">' +
    '<h1 class="page-title">' + o.h1 + '</h1>' +
    '<div class="prose">' + o.body + '</div>' +
    '</div></div>';
  return L.renderPage({
    title: o.title,
    description: o.description,
    canonical: SITE + '/' + o.file,
    root: '',
    active: o.active || '',
    page: o.page,
    main,
    jsonld: graph([
      L.orgNode(),
      L.websiteNode(),
      {
        '@type': o.type || 'WebPage',
        '@id': SITE + '/' + o.file + '#webpage',
        url: SITE + '/' + o.file,
        name: o.title,
        inLanguage: 'hi-IN',
        isPartOf: { '@id': SITE + '/#website' },
      },
    ]),
  });
}

const HOME_PER = 9; // होम पर पहले से HTML में छपने वाले लेख (app.js का PER भी यही)

function buildStaticPages(articles) {
  articles = articles || [];
  // ---------- होम ----------
  const homeMain =
    '<section class="container hero fade-in">' +
    '<div class="hero-box">' +
    '<h1 class="hero-title">AI की हर नई बात, सीधी और सरल हिंदी में</h1>' +
    '</div>' +
    '<p class="lead">आर्टिफिशियल इंटेलिजेंस, चैटबॉट और नई तकनीक के बारे में साफ़ भाषा में लिखे गए लेख, ताकि हर पाठक आराम से समझ सके।</p>' +
    '</section>' +
    '<section class="container feed" aria-labelledby="feed-title">' +
    '<h2 id="feed-title" class="section-title">ताज़ा लेख</h2>' +
    '<div class="grid" id="feed" data-prerendered="' + Math.min(HOME_PER, articles.length) + '">' +
    (articles.length
      ? articles.slice(0, HOME_PER).map((a, i) => L.card(a, '', 'h3', { first: i === 0, static: true })).join('')
      : '<p class="muted">अभी कोई लेख नहीं है। जल्द ही नए लेख आएँगे।</p>') +
    '</div>' +
    '<div class="load-more-wrap"><button id="load-more" class="btn btn-primary" type="button"' +
    (articles.length > HOME_PER ? '' : ' hidden') + '>और दिखाओ</button></div>' +
    '</section>';

  write('index.html', L.renderPage({
    title: cfg.SITE_NAME + ' – हिंदी में AI की ताज़ा और आसान जानकारी',
    description: 'TECH RWT AI पर पढ़िए आर्टिफिशियल इंटेलिजेंस, चैटबॉट और नई तकनीक से जुड़े सरल हिंदी लेख, एक ही जगह।',
    canonical: SITE + '/',
    root: '',
    active: 'index.html',
    page: 'home',
    welcome: true,
    main: homeMain,
    jsonld: graph([L.orgNode(), L.websiteNode()]),
  }));

  // ---------- खोज ----------
  const searchMain =
    '<section class="container page-head fade-in">' +
    '<h1 class="page-title">खोजें</h1>' +
    '<p class="lead">शीर्षक या सार में शब्द लिखिए, नतीजे तुरंत दिखेंगे।</p>' +
    '<form class="search-form" id="search-form" role="search">' +
    '<label class="sr-only" for="q">लेख खोजें</label>' +
    '<input id="q" name="q" type="search" placeholder="जैसे: चैटबॉट, मशीन लर्निंग…" autocomplete="off">' +
    '<button class="btn btn-violet" type="submit">खोजें</button>' +
    '</form>' +
    '<p id="search-status" class="muted" role="status" aria-live="polite"></p>' +
    '</section>' +
    '<section class="container"><div class="grid" id="results"></div></section>';

  write('search.html', L.renderPage({
    title: 'खोजें – ' + cfg.SITE_NAME,
    description: cfg.SITE_NAME + ' के सभी हिंदी लेखों में खोजें।',
    robots: 'noindex',
    root: '',
    active: 'search.html',
    page: 'search',
    main: searchMain,
  }));

  // ---------- हमारे बारे में ----------
  write('about.html', simplePage({
    file: 'about.html',
    type: 'AboutPage',
    page: 'about',
    active: 'about.html',
    title: 'हमारे बारे में – ' + cfg.SITE_NAME,
    description: cfg.SITE_NAME + ' क्या है, हम क्या लिखते हैं और क्यों: हिंदी पाठकों के लिए AI की सरल जानकारी।',
    h1: 'हमारे बारे में',
    body:
      '<p>' + L.esc(cfg.SITE_NAME) + ' एक हिंदी वेबसाइट है, जहाँ आर्टिफिशियल इंटेलिजेंस (AI) और उससे जुड़ी नई तकनीक के बारे में सरल भाषा में लेख मिलते हैं।</p>' +
      '<h2>हमारा मकसद</h2>' +
      '<p>इंटरनेट पर AI की ज़्यादातर अच्छी जानकारी अंग्रेज़ी में है। हमारा मकसद उसे साफ़, सही और आसान हिंदी में हर पाठक तक पहुँचाना है, ताकि तकनीक की समझ किसी भाषा की मोहताज न रहे।</p>' +
      '<h2>हम क्या लिखते हैं</h2>' +
      '<ul><li>AI की बुनियादी बातें और नई खोजें</li><li>चैटबॉट और AI टूल्स का सही इस्तेमाल</li><li>तकनीक से जुड़े बदलाव और उनका असर</li></ul>' +
      '<h2>हमारा तरीका</h2>' +
      '<p>हर लेख को पढ़ने में आसान रखा जाता है: छोटे वाक्य, साफ़ उपशीर्षक और मुख्य बातों का सार। अगर किसी लेख में कोई कमी दिखे, तो हमें <a href="contact.html">संपर्क</a> पेज से बताइए।</p>',
  }));

  // ---------- संपर्क ----------
  const email = cfg.CONTACT_EMAIL;
  const contactMain =
    '<div class="container page"><div class="article-wrap fade-in">' +
    '<h1 class="page-title">संपर्क करें</h1>' +
    '<p class="lead">सुझाव, सुधार या सहयोग के लिए नीचे संदेश लिखिए। “संदेश भेजें” दबाने पर आपका ईमेल ऐप खुलेगा।</p>' +
    '<form class="contact-form" id="contact-form" data-email="' + L.esc(email) + '">' +
    '<label for="c-name">आपका नाम</label>' +
    '<input id="c-name" name="name" type="text" autocomplete="name" required>' +
    '<label for="c-subject">विषय</label>' +
    '<input id="c-subject" name="subject" type="text" required>' +
    '<label for="c-msg">आपका संदेश</label>' +
    '<textarea id="c-msg" name="message" rows="6" required></textarea>' +
    '<button class="btn btn-violet" type="submit">संदेश भेजें</button>' +
    '</form>' +
    '<p class="muted">आप सीधे ईमेल भी कर सकते हैं: <a href="mailto:' + L.esc(email) + '">' + L.esc(email) + '</a></p>' +
    '</div></div>';

  write('contact.html', L.renderPage({
    title: 'संपर्क – ' + cfg.SITE_NAME,
    description: cfg.SITE_NAME + ' से संपर्क करें: सुझाव, सुधार या सहयोग के लिए संदेश भेजें।',
    canonical: SITE + '/contact.html',
    root: '',
    active: 'contact.html',
    page: 'contact',
    main: contactMain,
    jsonld: graph([L.orgNode(), L.websiteNode(), {
      '@type': 'ContactPage',
      '@id': SITE + '/contact.html#webpage',
      url: SITE + '/contact.html',
      name: 'संपर्क – ' + cfg.SITE_NAME,
      inLanguage: 'hi-IN',
      isPartOf: { '@id': SITE + '/#website' },
    }]),
  }));

  // ---------- गोपनीयता नीति ----------
  write('privacy-policy.html', simplePage({
    file: 'privacy-policy.html',
    page: 'privacy',
    title: 'गोपनीयता नीति – ' + cfg.SITE_NAME,
    description: cfg.SITE_NAME + ' आपकी कौन-सी जानकारी इकट्ठा करता है और उसका क्या उपयोग करता है, इसकी पूरी जानकारी।',
    h1: 'गोपनीयता नीति',
    body:
      '<p>' + L.esc(cfg.SITE_NAME) + ' पर आपकी निजता हमारे लिए महत्वपूर्ण है। यह पेज बताता है कि यह वेबसाइट किस तरह की जानकारी का उपयोग करती है।</p>' +
      '<h2>हम कौन-सी जानकारी इकट्ठा करते हैं</h2>' +
      '<p>यह वेबसाइट आपसे कोई खाता, नाम या पता नहीं माँगती। संपर्क फ़ॉर्म में आप जो जानकारी लिखते हैं, वह सीधे आपके ईमेल ऐप के ज़रिए भेजी जाती है और हमारी वेबसाइट पर सहेजी नहीं जाती।</p>' +
      '<h2>ब्राउज़र स्टोरेज</h2>' +
      '<p>पहली बार आने पर दिखने वाला स्वागत एनिमेशन दोबारा न दिखे, इसके लिए आपके ब्राउज़र के सेशन स्टोरेज में एक छोटा संकेत रखा जाता है। ब्राउज़र बंद करते ही यह हट जाता है, और इसमें कोई निजी जानकारी नहीं होती।</p>' +
      '<h2>तीसरे पक्ष की सेवाएँ</h2>' +
      '<p>पाठ को सुंदर दिखाने के लिए यह वेबसाइट Google Fonts से फ़ॉन्ट लोड करती है। इसके लिए आपका ब्राउज़र Google के सर्वर से संपर्क करता है। इसकी शर्तें Google की अपनी गोपनीयता नीति के अनुसार हैं।</p>' +
      '<h2>बाहरी लिंक</h2>' +
      '<p>लेखों में दूसरी वेबसाइटों के लिंक हो सकते हैं। उन वेबसाइटों की गोपनीयता नीति पर हमारा नियंत्रण नहीं है, इसलिए वहाँ जाने से पहले उनकी नीति पढ़ लें।</p>' +
      '<h2>नीति में बदलाव</h2>' +
      '<p>ज़रूरत पड़ने पर यह नीति बदली जा सकती है। नया रूप इसी पेज पर प्रकाशित किया जाएगा।</p>' +
      '<h2>संपर्क</h2>' +
      '<p>इस नीति के बारे में कोई सवाल हो तो <a href="contact.html">संपर्क पेज</a> से हमें लिखिए।</p>',
  }));

  // ---------- नियम और शर्तें ----------
  write('terms.html', simplePage({
    file: 'terms.html',
    page: 'terms',
    title: 'नियम और शर्तें – ' + cfg.SITE_NAME,
    description: cfg.SITE_NAME + ' वेबसाइट के उपयोग के नियम और शर्तें।',
    h1: 'नियम और शर्तें',
    body:
      '<p>' + L.esc(cfg.SITE_NAME) + ' का उपयोग करके आप नीचे दिए गए नियमों से सहमत होते हैं।</p>' +
      '<h2>सामग्री का उद्देश्य</h2>' +
      '<p>इस वेबसाइट के लेख सिर्फ़ सामान्य जानकारी और शिक्षा के लिए हैं। इन्हें पेशेवर, कानूनी, वित्तीय या चिकित्सकीय सलाह न समझें।</p>' +
      '<h2>सटीकता</h2>' +
      '<p>हम सही और अद्यतन जानकारी देने की कोशिश करते हैं, लेकिन तकनीक तेज़ी से बदलती है। किसी महत्वपूर्ण निर्णय से पहले जानकारी की स्वयं जाँच कर लें।</p>' +
      '<h2>कॉपीराइट</h2>' +
      '<p>वेबसाइट की सामग्री पर ' + L.esc(cfg.SITE_NAME) + ' के अधिकार सुरक्षित हैं। बिना अनुमति पूरा लेख कहीं और प्रकाशित करना मना है। लिंक साझा करने का स्वागत है।</p>' +
      '<h2>सही उपयोग</h2>' +
      '<p>आप इस वेबसाइट का उपयोग किसी गैरकानूनी काम या वेबसाइट को नुकसान पहुँचाने के लिए नहीं करेंगे।</p>' +
      '<h2>बदलाव</h2>' +
      '<p>हम इन नियमों में कभी भी बदलाव कर सकते हैं। बदलाव के बाद वेबसाइट का उपयोग जारी रखने का मतलब है कि आप नए नियम मानते हैं।</p>' +
      '<h2>संपर्क</h2>' +
      '<p>किसी सवाल के लिए <a href="contact.html">संपर्क पेज</a> देखिए।</p>',
  }));

  // ---------- 404 ----------
  // 404 किसी भी गहराई पर खुल सकता है, इसलिए यहाँ पूरे (absolute) रास्ते चाहिए।
  const root404 = SITE + '/';
  const notFoundMain =
    '<section class="container notfound fade-in">' +
    '<p class="badge">404</p>' +
    '<h1 class="hero-title">पेज नहीं मिला</h1>' +
    '<p class="lead">आप जिस पेज को ढूँढ रहे हैं, वह हट गया है या उसका पता बदल गया है।</p>' +
    '<p class="actions"><a class="btn btn-primary" href="' + L.esc(root404) + '">होम पर जाएँ</a>' +
    '<a class="btn btn-ghost" href="' + L.esc(root404 + 'search.html') + '">लेख खोजें</a></p>' +
    '</section>';

  write('404.html', L.renderPage({
    title: 'पेज नहीं मिला – ' + cfg.SITE_NAME,
    description: 'यह पेज उपलब्ध नहीं है।',
    robots: 'noindex, follow',
    root: root404,
    page: '404',
    main: notFoundMain,
  }));
}

/** sitemap में जाने वाले ज़रूरी स्थिर पेज (search और 404 नहीं) */
const SITEMAP_PAGES = ['', 'about.html', 'contact.html', 'privacy-policy.html', 'terms.html'];

module.exports = { buildStaticPages, SITEMAP_PAGES };
