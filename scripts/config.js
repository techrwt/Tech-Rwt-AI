'use strict';

/*
 * ===== साइट की सेटिंग (सिर्फ़ यहीं बदलें) =====
 * कस्टम डोमेन लगाने पर सिर्फ़ SITE_URL बदलें, फिर `node scripts/generate-index.js` चलाएँ
 * (या GitHub Actions में "Run workflow" दबाएँ)। बाकी सब अपने आप बदल जाएगा।
 *
 * GitHub Pages (project site):  https://USERNAME.github.io/REPO-NAME
 * GitHub Pages (user site)   :  https://USERNAME.github.io
 * कस्टम डोमेन               :  https://www.aapkadomain.com
 * अंत में "/" न लगाएँ।
 */
const SITE_URL = 'https://your-username.github.io/tech-rwt-ai';

module.exports = {
  SITE_URL,
  SITE_NAME: 'TECH RWT AI',
  SITE_TAGLINE: 'हिंदी में AI की सरल, साफ़ और भरोसेमंद जानकारी',
  CONTACT_EMAIL: 'contact@example.com',
  DEFAULT_IMAGE: 'assets/img/placeholder.png',
  LOGO: 'assets/img/logo.svg',
  WORDS_PER_MINUTE: 180,
};
