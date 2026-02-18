const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    const [cart] = await db.query('DESCRIBE cart');
    console.log('--- cart ---');
    console.table(cart);

    const [orders] = await db.query('DESCRIBE orders');
    console.log('--- orders ---');
    console.table(orders);

    const [order_items] = await db.query('DESCRIBE order_items');
    console.log('--- order_items ---');
    console.table(order_items);

    const [product_variants] = await db.query('DESCRIBE product_variants');
    console.log('--- product_variants ---');
    console.table(product_variants);

    const [products] = await db.query('DESCRIBE products');
    console.log('--- products ---');
    console.table(products);
  } catch (err) {
    console.error('Error describing tables:', err.message);
  } finally {
    await db.end();
  }
}

check();
