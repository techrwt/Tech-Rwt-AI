# TECH RWT AI

आर्टिफिशियल इंटेलिजेंस पर केंद्रित हिंदी वेबसाइट — TECH RWT Discovery का AI-फोकस्ड वर्ज़न। पूरी तरह HTML, CSS, Vanilla JavaScript और JSON से बनी है — कोई फ्रेमवर्क नहीं।

## प्रोजेक्ट स्ट्रक्चर

```
tech-rwt-ai/
├── index.html                  ← होमपेज (वेलकम स्क्रीन + आर्टिकल फ़ीड)
├── article.html                ← सिंगल आर्टिकल पेज
├── about.html                  ← हमारे बारे में पेज
├── css/
│   ├── style.css               ← मुख्य स्टाइल्स (थीम, हेडर, फुटर, कार्ड्स, आर्टिकल पेज)
│   └── welcome.css             ← वेलकम/रोबोट एनिमेशन के स्टाइल्स
├── js/
│   ├── main.js                 ← थीम टॉगल + मोबाइल मेन्यू (हर पेज पर)
│   ├── welcome.js              ← रोबोट एनिमेशन + हिंदी टाइपिंग इफ़ेक्ट
│   ├── homepage.js             ← index से आर्टिकल कार्ड्स रेंडर करना
│   └── article.js              ← slug → batch लुकअप → पूरा कंटेंट रेंडर
├── data/
│   ├── articles-index.json     ← हल्का (lightweight) सारांश — कोई `content` नहीं
│   └── articles/
│       ├── manifest.json       ← { totalBatches, latest }
│       └── batch-1.json        ← 1 सैंपल आर्टिकल (टेस्टिंग के लिए)
├── generate-index.js           ← Node स्क्रिप्ट: batch फ़ाइलें स्कैन करके index+manifest रीजनरेट करती है
├── .github/workflows/
│   └── update-index.yml        ← batch पुश होते ही ऑटोमेटिक index/manifest अपडेट
└── README.md
```

## GitHub Pages पर डिप्लॉय कैसे करें

1. GitHub पर एक नया repository बनाएं (public)
2. इस पूरे फोल्डर का कंटेंट उस repo में push करें:
   ```bash
   cd tech-rwt-ai
   git init
   git add .
   git commit -m "Initial commit — TECH RWT AI"
   git branch -M main
   git remote add origin https://github.com/<आपका-username>/<repo-name>.git
   git push -u origin main
   ```
3. Repo की **Settings → Pages** में जाएं
4. **Source** में "Deploy from a branch" चुनें → Branch: `main`, folder: `/ (root)` → Save
5. कुछ मिनट में साइट लाइव हो जाएगी: `https://<username>.github.io/<repo-name>/`

> **ज़रूरी:** GitHub Action (`update-index.yml`) को काम करने के लिए **Settings → Actions → General → Workflow permissions** में **"Read and write permissions"** चालू करना होगा — तभी वो auto-commit कर पाएगा।

## रोज़ का काम — नया आर्टिकल कैसे जोड़ें

1. `data/articles/` में नई फ़ाइल बनाएं — अगली सीरियल संख्या के साथ, जैसे `batch-2.json` (हर फ़ाइल में ज़्यादा से ज़्यादा 5 आर्टिकल)
2. `batch-1.json` जैसा ही फॉर्मेट रखें — फ़ील्ड्स: `id`, `title`, `slug`, `date`, `author`, `featured`, `trending`, `searchDescription`, `image`, `excerpt`, `content` (कोई `category` फ़ील्ड नहीं)
3. फ़ाइल को GitHub पर push/commit करें
4. GitHub Action अपने आप `generate-index.js` चलाकर `articles-index.json` और `manifest.json` अपडेट करके commit कर देगा — कुछ और करने की ज़रूरत नहीं

**लोकल टेस्ट के लिए** (push करने से पहले):
```bash
node generate-index.js
```
यह आपके सिस्टम पर index/manifest को manually रीजनरेट कर देगा ताकि push करने से पहले चेक कर सकें।

## नोट्स

- वेलकम/रोबोट एनिमेशन **सिर्फ होमपेज पर, हर विज़िट पर** चलता है — किसी storage flag का इस्तेमाल नहीं होता
- होमपेज सिर्फ `articles-index.json` से कार्ड्स बनाता है (तेज़ लोड) — कोई category filter नहीं
- आर्टिकल पेज कभी भी पूरा डेटासेट लोड नहीं करता — सिर्फ ज़रूरी `batch-N.json`
- थीम (dark/light) `localStorage` में सेव होती है
