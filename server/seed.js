const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('🌱 Repairing and Seeding Database with 20 Products...');

    // 1. Get Category IDs
    const [categories] = await connection.execute('SELECT id, slug FROM categories');
    const catMap = Object.fromEntries(categories.map(c => [c.slug, c.id]));

    if (categories.length === 0) {
        await connection.execute("INSERT INTO categories (name, slug) VALUES ('T-Shirts', 'tshirts'), ('Hoodies', 'hoodies'), ('Accessories', 'accessories'), ('Footwear', 'footwear'), ('Winter Wear', 'winter-wear'), ('Sports Cap', 'sports-cap')");
        const [newCats] = await connection.execute('SELECT id, slug FROM categories');
        newCats.forEach(c => catMap[c.slug] = c.id);
    }

    // 2. Clear old data for clean state
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('TRUNCATE TABLE product_variants');
    await connection.execute('TRUNCATE TABLE products');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    // 3. Define 20 Products
    const products = [
      ['Urban Street Oversized Tee', 'urban-street-oversized-tee', 'Premium heavyweight cotton with a relaxed fit.', 999.00, 50, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1974', catMap['tshirts'], 1, 1],
      ['Minimalist Pocket Tee', 'minimalist-pocket-tee', 'Clean design with a functional chest pocket.', 799.00, 100, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2080', catMap['tshirts'], 0, 0],
      ['Vintage Rock Graphic Tee', 'vintage-rock-graphic-tee', 'Soft-wash cotton with retro aesthetic.', 899.00, 40, 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=2070', catMap['tshirts'], 0, 1],
      ['Anime Shadow T-Shirt', 'anime-shadow-tshirt', 'Stealthy anime print for the modern fan.', 949.00, 60, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1972', catMap['tshirts'], 1, 0],
      ['Midnight Essential Hoodie', 'midnight-essential-hoodie', 'Ultra-soft fleece lining for maximum warmth.', 1499.00, 30, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=2070', catMap['hoodies'], 0, 1],
      ['Arctic Tech Pull-Over', 'arctic-tech-pullover', 'Water-resistant fabric for outdoor adventures.', 1899.00, 25, 'https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?q=80&w=1972', catMap['hoodies'], 1, 0],
      ['Classic Grey Melange Hoodie', 'classic-grey-melange-hoodie', 'Timeless design that pairs with anything.', 1399.00, 45, 'https://images.unsplash.com/photo-1578681994506-b8f463af49f1?q=80&w=2000', catMap['hoodies'], 0, 0],
      ['Sherpa Lined Denim Jacket', 'sherpa-lined-denim-jacket', 'Classic denim exterior with cozy sherpa interior.', 2999.00, 15, 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?q=80&w=1974', catMap['winter-wear'], 1, 1],
      ['Quilted Puffer Coat', 'quilted-puffer-coat', 'Lightweight insulation for cold winter days.', 3499.00, 20, 'https://images.unsplash.com/photo-1544923246-77307dd654ca?q=80&w=1974', catMap['winter-wear'], 0, 0],
      ['Camel Wool Blend Overcoat', 'camel-wool-blend-overcoat', 'Formal elegance for the stylish individual.', 4999.00, 10, 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=1974', catMap['winter-wear'], 0, 1],
      ['Retro High-Top Sneakers', 'retro-hightop-sneakers', '80s inspired design with modern cushioning.', 3999.00, 12, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070', catMap['footwear'], 1, 0],
      ['Suede Desert Boots', 'suede-desert-boots', 'Handcrafted genuine suede legacy footwear.', 3299.00, 18, 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1964', catMap['footwear'], 0, 1],
      ['White Minimalist Trainers', 'white-minimalist-trainers', 'Versatile white leather trainers for daily wear.', 2499.00, 22, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012', catMap['footwear'], 0, 0],
      ['Leather Crossbody Bag', 'leather-crossbody-bag', 'Premium top-grain leather with brass hardware.', 1999.00, 15, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999', catMap['accessories'], 0, 1],
      ['Aviator Sunglasses', 'aviator-sunglasses', 'Polarized lenses with classic gold frame.', 1299.00, 35, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=2080', catMap['accessories'], 1, 0],
      ['Canvas Weekender Bag', 'canvas-weekender-bag', 'Spacious bag for short trips and gym.', 1599.00, 20, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1974', catMap['accessories'], 0, 0],
      ['Classic Logo Baseball Cap', 'classic-logo-baseball-cap', 'Adjustable strap with embroidered logo.', 599.00, 50, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=2070', catMap['sports-cap'], 0, 1],
      ['Mesh Back Trucker Hat', 'mesh-back-trucker-hat', 'Breathable mesh for active outdoor use.', 499.00, 40, 'https://images.unsplash.com/photo-1521369909029-2afed882baee?q=80&w=2070', catMap['sports-cap'], 1, 0],
      ['Beanie Skull Cap', 'beanie-skull-cap', 'Stretchable knit fabric for winter warmth.', 399.00, 60, 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=1974', catMap['sports-cap'], 0, 0],
      ['Performance Running Visor', 'performance-running-visor', 'Moisture-wicking fabric for intense training.', 449.00, 30, 'https://images.unsplash.com/photo-1575428652377-a2d80e12a443?q=80&w=2070', catMap['sports-cap'], 0, 1]
    ];

    for (const p of products) {
      const [result] = await connection.execute(
        'INSERT INTO products (name, slug, description, price, stock, image, category_id, on_sale, is_new) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        p
      );
      
      const productId = result.insertId;
      const variants = [
        [productId, 'S', 'Standard', Math.floor(p[4]/3)],
        [productId, 'M', 'Standard', Math.floor(p[4]/3)],
        [productId, 'L', 'Standard', Math.floor(p[4]/3)]
      ];
      
      for (const v of variants) {
        await connection.execute('INSERT INTO product_variants (product_id, size, color, stock) VALUES (?, ?, ?, ?)', v);
      }
    }

    console.log('✅ Success! 20 products and variants added.');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await connection.end();
    process.exit();
  }
}

seed();
