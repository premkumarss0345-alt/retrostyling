const mysql = require('mysql2/promise');
require('dotenv').config();

async function addColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('Adding firebase_uid column...');
    await connection.execute('ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(128) AFTER password');
    console.log('✅ Column added successfully!');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ Column already exists.');
    } else {
      console.error('❌ Error:', err.message);
    }
  } finally {
    await connection.end();
    process.exit();
  }
}

addColumn();
