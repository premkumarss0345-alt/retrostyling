const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setup() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });

  try {
    console.log('📡 Connecting to database for admin setup...');
    
    // Read and execute SQL file
    const sql = fs.readFileSync(path.join(__dirname, 'admin_setup.sql'), 'utf8');
    await connection.query(sql);
    console.log('✅ Base tables created/updated.');

    // Create default admin user
    const adminEmail = 'admin@retrostylings.com';
    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [adminEmail]);

    if (existing.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin User', adminEmail, hashedPassword, 'admin']
      );
      console.log('✅ Admin user created! (Email: admin@retrostylings.com, Pass: admin123)');
    } else {
      console.log('ℹ️ Admin user already exists.');
    }

  } catch (err) {
    console.error('❌ Setup failed:', err.message);
  } finally {
    await connection.end();
    process.exit();
  }
}

setup();
