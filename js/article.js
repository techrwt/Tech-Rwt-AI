/* ============================================
   TECH RWT AI — article.js
   Flow:
   1. Read ?slug= from the URL
   2. Fetch data/articles-index.json, find the matching entry
      (lightweight — no content field) to get its `batch` number
   3. Fetch ONLY data/articles/batch-{N}.json and find the
      full article there (with content)
   ============================================ */

(function () {
  "use strict";

  const containerEl = document.getElementById("article-container");
  if (!containerEl) return;

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

  function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("slug");
  }

  function renderStatus(message) {
    containerEl.innerHTML = `
      <a href="index.html" class="back-link">← होम पर वापस जाएं</a>
      <div class="article-status">${message}</div>
    `;
  }

  function renderArticle(article) {
    // Update page <title> and meta description for SEO/sharing
    document.getElementById("page-title").textContent = `${article.title} — TECH RWT AI`;
    const descTag = document.getElementById("page-description");
    if (descTag) descTag.setAttribute("content", article.searchDescription || article.excerpt || "");

    const badges = [];
    if (article.featured) badges.push('<span class="badge featured">फ़ीचर्ड</span>');
    if (article.trending) badges.push('<span class="badge trending">ट्रेंडिंग</span>');

    containerEl.innerHTML = `
      <a href="index.html" class="back-link">← होम पर वापस जाएं</a>
      <div class="article-header">
        ${badges.length ? `<div class="card-badges-static">${badges.join("")}</div>` : ""}
        <h1 class="article-title">${escapeHtml(article.title)}</h1>
        <div class="article-meta">
          <span>${formatDateHi(article.date)}</span>
          <span class="dot"></span>
          <span>${escapeHtml(article.author)}</span>
        </div>
      </div>
      <img class="article-hero-img" src="${escapeHtml(article.image)}" alt="${escapeHtml(article.title)}" />
      <div class="article-body">${article.content}</div>
    `;
  }

  async function loadArticle() {
    const slug = getSlugFromUrl();

    if (!slug) {
      renderStatus("कोई आर्टिकल नहीं मिला — लिंक अधूरा है।");
      return;
    }

    try {
      // Step 1: fetch lightweight index to find which batch this slug is in
      const indexRes = await fetch("data/articles-index.json", { cache: "no-store" });
      if (!indexRes.ok) throw new Error("index fetch failed: " + indexRes.status);
      const index = await indexRes.json();

      const indexEntry = Array.isArray(index) ? index.find((a) => a.slug === slug) : null;

      if (!indexEntry) {
        renderStatus("यह आर्टिकल उपलब्ध नहीं है या हटा दिया गया है।");
        return;
      }

      // Step 2: fetch ONLY the relevant batch file (never the whole dataset)
      const batchRes = await fetch(`data/articles/batch-${indexEntry.batch}.json`, { cache: "no-store" });
      if (!batchRes.ok) throw new Error("batch fetch failed: " + batchRes.status);
      const batchArticles = await batchRes.json();

      const fullArticle = Array.isArray(batchArticles)
        ? batchArticles.find((a) => a.slug === slug)
        : null;

      if (!fullArticle) {
        renderStatus("आर्टिकल डेटा में कोई समस्या है। कृपया बाद में दोबारा कोशिश करें।");
        return;
      }

      renderArticle(fullArticle);
    } catch (err) {
      console.error("Article load error:", err);
      renderStatus("आर्टिकल लोड करने में समस्या हुई। कृपया पेज को रीफ्रेश करें।");
    }
  }

  loadArticle();
})();
