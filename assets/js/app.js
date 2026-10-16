/* TECH RWT AI – app.js (vanilla JS, कोई लाइब्रेरी नहीं) */
(function () {
  'use strict';

  var d = document;
  var html = d.documentElement;
  var root = d.body.getAttribute('data-root') || '';
  var page = d.body.getAttribute('data-page') || '';
  var MONTHS = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
    return m ? parseInt(m[3], 10) + ' ' + MONTHS[parseInt(m[2], 10) - 1] + ' ' + m[1] : String(iso);
  }
  function imgSrc(p) {
    return /^https?:\/\//i.test(p) ? p : root + String(p).replace(/^\/+/, '');
  }
  function cardHtml(a, delay) {
    return '<article class="card" style="animation-delay:' + (delay || 0) + 'ms">' +
      '<a class="card-link" href="' + esc(root + 'articles/' + a.slug + '.html') + '">' +
      '<div class="card-media"><img src="' + esc(imgSrc(a.image)) + '" alt="' + esc(a.title) + '" width="1200" height="630" loading="lazy" decoding="async"></div>' +
      '<div class="card-body"><p class="card-meta"><time datetime="' + esc(String(a.date).slice(0, 10)) + '">' + esc(fmtDate(a.date)) + '</time>' +
      '<span class="dot" aria-hidden="true"></span><span>' + esc(a.readingTime) + ' मिनट</span></p>' +
      '<h2 class="card-title">' + esc(a.title) + '</h2>' +
      '<p class="card-excerpt">' + esc(a.excerpt) + '</p>' +
      '<span class="card-more">पूरा पढ़ें</span></div></a></article>';
  }

  var indexPromise = null;
  function getIndex() {
    if (!indexPromise) {
      indexPromise = fetch(root + 'data/articles-index.json', { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error('index load failed');
        return r.json();
      });
    }
    return indexPromise;
  }

  /* ---------- मेन्यू (मोबाइल) ---------- */
  (function nav() {
    var btn = d.querySelector('.nav-toggle');
    var menu = d.getElementById('site-nav');
    if (!btn || !menu) return;
    function set(open) {
      menu.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'मेन्यू बंद करें' : 'मेन्यू खोलें');
    }
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') set(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  })();

  /* ---------- साल ---------- */
  Array.prototype.forEach.call(d.querySelectorAll('[data-year]'), function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- स्वागत एनिमेशन (सिर्फ़ होम, सिर्फ़ एक बार) ---------- */
  (function welcome() {
    var w = d.getElementById('welcome');
    if (!w) return;
    if (!html.classList.contains('welcome-on')) { w.parentNode.removeChild(w); return; }
    try { sessionStorage.setItem('trai-welcome', '1'); } catch (e) { /* ignore */ }

    var t = d.getElementById('welcome-text');
    var words = (t.getAttribute('data-text') || '').split(' ');
    t.innerHTML = words.map(function (word, i) {
      return '<span style="animation-delay:' + (0.35 + i * 0.28).toFixed(2) + 's">' + esc(word) + '</span>';
    }).join(' ');

    var done = false;
    var skip = d.getElementById('welcome-skip');
    function close() {
      if (done) return;
      done = true;
      w.classList.add('welcome--out');
      setTimeout(function () {
        html.classList.remove('welcome-on');
        if (w.parentNode) w.parentNode.removeChild(w);
      }, 600);
    }
    skip.addEventListener('click', close);
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    skip.focus({ preventScroll: true });
    setTimeout(close, 4600);
  })();

  /* ---------- होम फ़ीड ---------- */
  if (page === 'home') {
    var feed = d.getElementById('feed');
    var more = d.getElementById('load-more');
    var PER = 9;
    var shown = 0;
    var all = [];

    var render = function () {
      var next = all.slice(shown, shown + PER);
      feed.insertAdjacentHTML('beforeend', next.map(function (a, i) { return cardHtml(a, i * 60); }).join(''));
      shown += next.length;
      more.hidden = shown >= all.length;
    };

    getIndex().then(function (list) {
      all = list;
      feed.innerHTML = '';
      if (!all.length) {
        feed.innerHTML = '<p class="muted">अभी कोई लेख नहीं है। जल्द ही नए लेख आएँगे।</p>';
        return;
      }
      render();
      more.addEventListener('click', render);
    }).catch(function () {
      feed.innerHTML = '<p class="muted">लेख लोड नहीं हो सके। कृपया पेज दोबारा खोलें।</p>';
    });
  }

  /* ---------- खोज ---------- */
  if (page === 'search') {
    var form = d.getElementById('search-form');
    var input = d.getElementById('q');
    var out = d.getElementById('results');
    var status = d.getElementById('search-status');
    var timer = null;

    var run = function () {
      var q = input.value.trim().toLowerCase();
      try {
        var url = new URL(window.location.href);
        if (q) url.searchParams.set('q', input.value.trim()); else url.searchParams.delete('q');
        history.replaceState(null, '', url);
      } catch (e) { /* ignore */ }

      if (!q) { out.innerHTML = ''; status.textContent = ''; return; }
      getIndex().then(function (list) {
        var terms = q.split(/\s+/).filter(Boolean);
        var hits = list.filter(function (a) {
          var hay = (a.title + ' ' + a.excerpt).toLowerCase();
          return terms.every(function (t) { return hay.indexOf(t) !== -1; });
        });
        out.innerHTML = hits.map(function (a, i) { return cardHtml(a, i * 50); }).join('');
        status.textContent = hits.length ? hits.length + ' लेख मिले' : 'कोई लेख नहीं मिला। कृपया दूसरा शब्द आज़माइए।';
      }).catch(function () {
        status.textContent = 'खोज अभी उपलब्ध नहीं है। कृपया बाद में कोशिश करें।';
      });
    };

    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 120); });
    form.addEventListener('submit', function (e) { e.preventDefault(); run(); });

    try {
      var initial = new URLSearchParams(window.location.search).get('q');
      if (initial) { input.value = initial; run(); }
    } catch (e) { /* ignore */ }
  }

  /* ---------- शेयर: लिंक कॉपी ---------- */
  Array.prototype.forEach.call(d.querySelectorAll('.share-copy'), function (btn) {
    var statusEl = btn.closest('.share').querySelector('.share-status');
    var original = btn.textContent;
    function ok() {
      btn.textContent = 'कॉपी हो गया';
      if (statusEl) statusEl.textContent = 'लिंक कॉपी हो गया।';
      setTimeout(function () { btn.textContent = original; if (statusEl) statusEl.textContent = ''; }, 2200);
    }
    function fallback(text) {
      var ta = d.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      d.body.appendChild(ta);
      ta.select();
      try { d.execCommand('copy'); ok(); } catch (e) {
        if (statusEl) statusEl.textContent = 'कॉपी नहीं हो सका। कृपया पता-बार से लिंक कॉपी करें।';
      }
      d.body.removeChild(ta);
    }
    btn.addEventListener('click', function () {
      var url = btn.getAttribute('data-copy') || window.location.href;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(ok, function () { fallback(url); });
      } else {
        fallback(url);
      }
    });
  });

  /* ---------- संपर्क फ़ॉर्म (ईमेल ऐप खोलता है) ---------- */
  var cf = d.getElementById('contact-form');
  if (cf) {
    cf.addEventListener('submit', function (e) {
      e.preventDefault();
      var to = cf.getAttribute('data-email');
      var name = cf.elements.name.value.trim();
      var subject = cf.elements.subject.value.trim();
      var msg = cf.elements.message.value.trim();
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(msg + '\n\n— ' + name);
    });
  }
})();
