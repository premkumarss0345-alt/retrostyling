const mysql = require('mysql2/promise');
require('dotenv').config();

async function stressTest() {
  console.log('Starting stress test on', process.env.DB_HOST);
  const connections = [];
  try {
    for (let i = 0; i < 15; i++) {
        console.log(`Connection ${i+1}...`);
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });
        connections.push(db);
        await db.query('SELECT 1');
    }
    console.log('✅ Successfully opened 15 parallel connections.');
  } catch (err) {
    console.error('❌ Failed at connection', connections.length + 1, ':', err.message);
  } finally {
    for (let db of connections) {
        await db.end();
    }
  }
}

stressTest();
