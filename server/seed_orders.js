const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedOrders() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    const [users] = await connection.execute('SELECT id FROM users LIMIT 1');
    if (users.length === 0) return console.log('No users found to assign orders to.');

    const userId = users[0].id;
    const orders = [
      [userId, 1250.00, 'pending', 'paid'],
      [userId, 2400.00, 'shipped', 'paid'],
      [userId, 890.00, 'delivered', 'paid'],
      [userId, 150.00, 'cancelled', 'unpaid']
    ];

    await connection.query('INSERT INTO orders (user_id, total, status, payment_status) VALUES ?', [orders]);
    console.log('✅ Mock orders seeded!');

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
    process.exit();
  }
}

seedOrders();
