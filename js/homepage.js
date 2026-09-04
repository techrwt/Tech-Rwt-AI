/* ============================================
   TECH RWT AI — homepage.js
   Fetches data/articles-index.json (lightweight, no content)
   and renders the article feed. Full content is fetched
   only on the article page, from the relevant batch file.
   ============================================ */

(function () {
  "use strict";

  const feedEl = document.getElementById("article-feed");
  if (!feedEl) return;

  const MONTHS_HI = [
    "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
    "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
  ];

  function formatDateHi(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return `${d.getDate()} ${MONTHS_HI[d.getMonth()]} ${d.getFullYear()}`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderStatus(message) {
    feedEl.innerHTML = `<div class="feed-status">${message}</div>`;
  }

  function articleCardHtml(article) {
    const badges = [];
    if (article.featured) badges.push('<span class="badge featured">फ़ीचर्ड</span>');
    if (article.trending) badges.push('<span class="badge trending">ट्रेंडिंग</span>');

    return `
      <a class="article-card" href="article.html?slug=${encodeURIComponent(article.slug)}">
        <div class="article-card-img-wrap">
          <img src="${escapeHtml(article.image)}" alt="${escapeHtml(article.title)}" loading="lazy" />
          ${badges.length ? `<div class="card-badges">${badges.join("")}</div>` : ""}
        </div>
        <div class="article-card-body">
          <div class="card-meta">
            <span>${formatDateHi(article.date)}</span>
            <span class="dot"></span>
            <span>${escapeHtml(article.author)}</span>
          </div>
          <h2 class="article-card-title">${escapeHtml(article.title)}</h2>
          <p class="article-card-excerpt">${escapeHtml(article.excerpt)}</p>
          <span class="article-card-readmore">और पढ़ें →</span>
        </div>
      </a>
    `;
  }

  async function loadFeed() {
    renderStatus("लोड हो रहा है…");

    try {
      const res = await fetch("data/articles-index.json", { cache: "no-store" });
      if (!res.ok) throw new Error("index fetch failed: " + res.status);

      const articles = await res.json();

      if (!Array.isArray(articles) || articles.length === 0) {
        renderStatus("अभी कोई आर्टिकल उपलब्ध नहीं है। जल्द ही नया कंटेंट आएगा।");
        return;
      }

      // Latest first
      articles.sort((a, b) => new Date(b.date) - new Date(a.date));

      feedEl.innerHTML = articles.map(articleCardHtml).join("");
    } catch (err) {
      console.error("Article feed load error:", err);
      renderStatus("आर्टिकल्स लोड करने में समस्या हुई। कृपया पेज को रीफ्रेश करें।");
    }
  }

  loadFeed();
})();
