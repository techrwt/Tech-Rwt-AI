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
const SITE_URL = 'https://techrawatai.sbs';

/*
 * सोशल प्रोफ़ाइल: यहीं जोड़ें/बदलें। यही सूची सोशल पेज और Organization schema (sameAs) में जाती है।
 */
const SOCIAL = [
  { name: 'YouTube', icon: '▶️', handle: '@techrawatai-c8y', url: 'https://youtube.com/@techrawatai-c8y' },
  { name: 'Reddit', icon: '🟠', handle: 'u/tech_rawat_ai', url: 'https://www.reddit.com/user/tech_rawat_ai/' },
  { name: 'Quora', icon: '❓', handle: 'Tech Rawat AI', url: 'https://www.quora.com/profile/Tech-Rawat-AI' },
  { name: 'Medium', icon: '✍️', handle: '@techrawatai', url: 'https://medium.com/@techrawatai' },
];

module.exports = {
  SITE_URL,
  SITE_NAME: 'TECH RWT AI',
  ALTERNATE_NAME: 'Tech Rawat AI',
  SOCIAL,
  SITE_TAGLINE: 'हिंदी में AI की सरल, साफ़ और भरोसेमंद जानकारी',
  CONTACT_EMAIL: 'manbhajan04@gmail.com',
  DEFAULT_IMAGE: 'assets/img/placeholder.png',
  LOGO: 'assets/img/logo.svg',
  WORDS_PER_MINUTE: 180,
};
