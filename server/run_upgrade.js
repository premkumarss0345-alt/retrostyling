const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, 'ecommerce_upgrade.sql'), 'utf8');
    console.log('🚀 Starting eCommerce Architecture Upgrade...');
    await connection.query(sql);
    console.log('✅ Database upgraded successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await connection.end();
    process.exit();
  }
}

migrate();
