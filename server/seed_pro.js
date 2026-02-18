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
    console.log('🌱 Seeding Professional eCommerce Data...');

    // 1. Get Category IDs
    const [categories] = await connection.execute('SELECT id, slug FROM categories');
    const catMap = Object.fromEntries(categories.map(c => [c.slug, c.id]));

    // 2. Clear old products (optional but good for clean test)
    // await connection.execute('DELETE FROM products');

    // 3. Insert Products
    const products = [
      ['Oversized Anime T-Shirt', 'oversized-anime-tshirt', 'Premium cotton t-shirt with high-quality anime print.', 899.00, 50, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2080', catMap['tshirts'], 1, 1],
      ['Classic Black Hoodie', 'classic-black-hoodie', 'Minimalist black hoodie for everyday comfort.', 1299.00, 30, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=2070', catMap['hoodies'], 0, 1],
      ['Vintage Leather Boots', 'vintage-leather-boots', 'Durable and stylish boots for outdoor activities.', 2499.00, 15, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070', catMap['footwear'], 0, 0],
      ['Premium Denim Jacket', 'premium-denim-jacket', 'Rugged denim jacket with a modern fit.', 1899.00, 20, 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?q=80&w=1974', catMap['winter-wear'], 1, 0]
    ];

    for (const p of products) {
      await connection.execute(
        'INSERT IGNORE INTO products (name, slug, description, price, stock, image, category_id, on_sale, is_new) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        p
      );
    }

    // 4. Insert Variants
    const [dbProducts] = await connection.execute('SELECT id, name FROM products');
    for (const product of dbProducts) {
      const variants = [
        [product.id, 'S', 'Black', 10],
        [product.id, 'M', 'Black', 15],
        [product.id, 'L', 'Black', 5]
      ];
      for (const v of variants) {
        await connection.execute('INSERT IGNORE INTO product_variants (product_id, size, color, stock) VALUES (?, ?, ?, ?)', v);
      }
    }

    console.log('✅ Seeding complete!');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await connection.end();
    process.exit();
  }
}

seed();
