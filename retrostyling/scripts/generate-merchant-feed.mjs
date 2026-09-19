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

const cleanSlug = (str) => {
  if (!str) return '';
  return encodeURIComponent(String(str).trim());
};

const escapeXml = (unsafe) => {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

async function generateMerchantFeed() {
  console.log('🔄 Fetching products for Google Merchant Center feed...');

  try {
    const prodSnap = await getDocs(collection(db, 'products'));
    const items = [];

    prodSnap.forEach((doc) => {
      const p = doc.data();
      if (p.status !== 'inactive' && p.status !== 'archived') {
        const id = p.sku || `RS-${doc.id}`;
        const title = p.name || 'Retrostylings Apparel';
        const description = p.description ? p.description.replace(/<[^>]+>/g, '').trim() : `${title} by Retrostylings`;
        const slug = cleanSlug(p.slug || doc.id);
        const link = `${BASE_URL}/product/${slug}`;
        
        let img = p.image || '';
        if (img && !img.startsWith('http')) {
          img = `${BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`;
        }
        if (!img) img = `${BASE_URL}/logo.png`;

        const price = p.on_sale ? Number(p.discount_price || p.price) : Number(p.price || 0);
        const inStock = (p.stock > 0 || (p.variants || []).some(v => (v.stock || 0) > 0));
        const availability = inStock ? 'in_stock' : 'out_of_stock';
        const brand = p.brand || 'Retrostylings';
        const category = p.categoryName || p.categorySlug || 'Clothing & Accessories > Clothing';

        items.push({
          id,
          title,
          description,
          link,
          image_link: img,
          price: `${price.toFixed(2)} INR`,
          availability,
          brand,
          condition: 'new',
          product_type: category,
          google_product_category: 'Clothing & Accessories > Clothing'
        });
      }
    });

    console.log(`✅ Collected ${items.length} products for Google Merchant Center.`);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>Retrostylings Products Feed</title>\n`;
    xml += `    <link>${BASE_URL}</link>\n`;
    xml += `    <description>Product catalog feed for Google Merchant Center - Retrostylings</description>\n`;

    for (const item of items) {
      xml += `    <item>\n`;
      xml += `      <g:id>${escapeXml(item.id)}</g:id>\n`;
      xml += `      <g:title>${escapeXml(item.title)}</g:title>\n`;
      xml += `      <g:description>${escapeXml(item.description)}</g:description>\n`;
      xml += `      <g:link>${escapeXml(item.link)}</g:link>\n`;
      xml += `      <g:image_link>${escapeXml(item.image_link)}</g:image_link>\n`;
      xml += `      <g:price>${escapeXml(item.price)}</g:price>\n`;
      xml += `      <g:availability>${escapeXml(item.availability)}</g:availability>\n`;
      xml += `      <g:brand>${escapeXml(item.brand)}</g:brand>\n`;
      xml += `      <g:condition>${escapeXml(item.condition)}</g:condition>\n`;
      xml += `      <g:product_type>${escapeXml(item.product_type)}</g:product_type>\n`;
      xml += `      <g:google_product_category>${escapeXml(item.google_product_category)}</g:google_product_category>\n`;
      xml += `    </item>\n`;
    }

    xml += `  </channel>\n`;
    xml += `</rss>\n`;

    const outputPath = path.join(__dirname, '..', 'public', 'google-merchant-feed.xml');
    fs.writeFileSync(outputPath, xml, 'utf-8');
    console.log(`🎉 Google Merchant Center feed successfully written to ${outputPath}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error generating merchant feed:', err);
    process.exit(1);
  }
}

generateMerchantFeed();
