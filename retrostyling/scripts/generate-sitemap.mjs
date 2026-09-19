import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.retrostylings.in';

const firebaseConfig = {
  apiKey: "AIzaSyAwTGEf-VCbekJm6nb5FSs2cXyrL0TrsZE",
  authDomain: "etro-bf494.firebaseapp.com",
  projectId: "etro-bf494",
  storageBucket: "etro-bf494.firebasestorage.app",
  messagingSenderId: "209654975466",
  appId: "1:209654975466:web:dc33eb27b7a3dbf0954093",
  measurementId: "G-58PFM4YYYG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const formatDate = (date) => {
  return (date instanceof Date ? date : new Date()).toISOString().split('T')[0];
};

const cleanSlug = (str) => {
  if (!str) return '';
  return encodeURIComponent(String(str).trim());
};

async function generateSitemap() {
  console.log('🔄 Fetching catalog from Firestore for sitemap generation...');
  const today = formatDate(new Date());

  const urls = [
    { loc: `${BASE_URL}/`, changefreq: 'daily', priority: '1.0', lastmod: today },
    { loc: `${BASE_URL}/shop`, changefreq: 'daily', priority: '0.9', lastmod: today },
    { loc: `${BASE_URL}/new-arrivals`, changefreq: 'daily', priority: '0.9', lastmod: today },
    { loc: `${BASE_URL}/sale`, changefreq: 'daily', priority: '0.9', lastmod: today },
    { loc: `${BASE_URL}/best-sellers`, changefreq: 'daily', priority: '0.9', lastmod: today },
    { loc: `${BASE_URL}/about`, changefreq: 'monthly', priority: '0.7', lastmod: today },
    { loc: `${BASE_URL}/contact`, changefreq: 'monthly', priority: '0.7', lastmod: today },
    { loc: `${BASE_URL}/return-policy`, changefreq: 'monthly', priority: '0.6', lastmod: today },
    { loc: `${BASE_URL}/shipping-info`, changefreq: 'monthly', priority: '0.6', lastmod: today },
    { loc: `${BASE_URL}/track-order`, changefreq: 'monthly', priority: '0.6', lastmod: today },
    { loc: `${BASE_URL}/rewards`, changefreq: 'weekly', priority: '0.6', lastmod: today },
    { loc: `${BASE_URL}/payment-type`, changefreq: 'monthly', priority: '0.5', lastmod: today },
    { loc: `${BASE_URL}/blog`, changefreq: 'weekly', priority: '0.6', lastmod: today },
  ];

  try {
    // 1. Fetch Categories
    const catSnap = await getDocs(collection(db, 'categories'));
    const categoriesMap = new Map();
    catSnap.forEach((doc) => {
      const data = doc.data();
      if (data.status !== 'inactive') {
        const rawSlug = data.slug || doc.id;
        const slug = cleanSlug(rawSlug);
        categoriesMap.set(doc.id, slug);
        urls.push({
          loc: `${BASE_URL}/shop/${slug}`,
          changefreq: 'weekly',
          priority: '0.85',
          lastmod: data.updatedAt?.toDate ? formatDate(data.updatedAt.toDate()) : today,
        });
      }
    });

    // 2. Fetch Subcategories
    const subSnap = await getDocs(collection(db, 'subcategories'));
    subSnap.forEach((doc) => {
      const data = doc.data();
      if (data.status !== 'inactive') {
        const catSlug = data.categorySlug ? cleanSlug(data.categorySlug) : (categoriesMap.get(data.categoryId) || 'collection');
        const subSlug = cleanSlug(data.slug || doc.id);
        urls.push({
          loc: `${BASE_URL}/shop/${catSlug}/${subSlug}`,
          changefreq: 'weekly',
          priority: '0.80',
          lastmod: data.updatedAt?.toDate ? formatDate(data.updatedAt.toDate()) : today,
        });
      }
    });

    // 3. Fetch Products
    const prodSnap = await getDocs(collection(db, 'products'));
    prodSnap.forEach((doc) => {
      const data = doc.data();
      if (data.status !== 'inactive' && data.status !== 'archived') {
        const slug = cleanSlug(data.slug || doc.id);
        urls.push({
          loc: `${BASE_URL}/product/${slug}`,
          changefreq: 'weekly',
          priority: '0.80',
          lastmod: data.updatedAt?.toDate ? formatDate(data.updatedAt.toDate()) : today,
        });
      }
    });

    console.log(`✅ Collected ${urls.length} indexable URLs for sitemap.`);

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const u of urls) {
      xml += `  <url>\n`;
      xml += `    <loc>${u.loc}</loc>\n`;
      xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
      xml += `    <priority>${u.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>\n`;

    const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    fs.writeFileSync(outputPath, xml, 'utf-8');
    console.log(`🎉 Sitemap successfully written to ${outputPath}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error generating sitemap:', err);
    process.exit(1);
  }
}

generateSitemap();
