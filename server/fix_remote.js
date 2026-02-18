const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fix() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });

  try {
    console.log('--- START ---');
    const [tables] = await db.query('SHOW TABLES');
    const tableList = tables.map(t => Object.values(t)[0]);
    console.log('TABLES_FOUND:', tableList.join(','));

    if (!tableList.includes('hero_slides')) {
      console.log('ACTION: Creating hero_slides');
      const heroSql = fs.readFileSync(path.join(__dirname, 'hero_setup.sql'), 'utf8');
      await db.query(heroSql);
      console.log('STATUS: hero_slides created');
    } else {
      console.log('STATUS: hero_slides exists');
    }

    const [products] = await db.query('SELECT COUNT(*) as count FROM products');
    const [activeProducts] = await db.query('SELECT COUNT(*) as count FROM products WHERE status="active"');
    const [slides] = await db.query('SELECT COUNT(*) as count FROM hero_slides');
    const [categories] = await db.query('SELECT COUNT(*) as count FROM categories');
    
    console.log('--- DATA_COUNTS ---');
    console.log('Products Total:', products[0].count);
    console.log('Products Active:', activeProducts[0].count);
    console.log('Hero Slides:', slides[0].count);
    console.log('Categories:', categories[0].count);
    console.log('--- END ---');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await db.end();
  }
}

fix();
