const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTable() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        const [rows] = await db.query('DESCRIBE categories');
        console.log('Categories table columns:', rows.map(r => r.Field));
        const [data] = await db.query('SELECT * FROM categories');
        console.log('Categories data count:', data.length);
    } catch (err) {
        console.error('Error checking categories table:', err.message);
    } finally {
        await db.end();
    }
}

checkTable();
