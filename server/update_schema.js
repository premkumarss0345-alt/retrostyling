const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSchema() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('Adding missing columns to products table...');

    // SKU
    try {
        await db.query(`ALTER TABLE products ADD COLUMN sku VARCHAR(100) UNIQUE AFTER slug`);
        console.log('✅ Added sku column');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ sku column already exists');
        else console.error('❌ Error adding sku:', e.message);
    }

    // Brand
    try {
        await db.query(`ALTER TABLE products ADD COLUMN brand VARCHAR(100) AFTER category_id`);
        console.log('✅ Added brand column');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ brand column already exists');
        else console.error('❌ Error adding brand:', e.message);
    }

    // Cost Price
    try {
        await db.query(`ALTER TABLE products ADD COLUMN cost_price DECIMAL(10,2) AFTER price`);
        console.log('✅ Added cost_price column');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ cost_price column already exists');
        else console.error('❌ Error adding cost_price:', e.message);
    }

    // Tax
    try {
        await db.query(`ALTER TABLE products ADD COLUMN tax DECIMAL(5,2) DEFAULT 0 AFTER discount_price`);
        console.log('✅ Added tax column');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ tax column already exists');
        else console.error('❌ Error adding tax:', e.message);
    }

    // Low Stock Alert
    try {
        await db.query(`ALTER TABLE products ADD COLUMN low_stock_threshold INT DEFAULT 5 AFTER stock`);
        console.log('✅ Added low_stock_threshold column');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ low_stock_threshold column already exists');
        else console.error('❌ Error adding low_stock_threshold:', e.message);
    }

    // Track Inventory
    try {
        await db.query(`ALTER TABLE products ADD COLUMN track_inventory BOOLEAN DEFAULT TRUE AFTER low_stock_threshold`);
        console.log('✅ Added track_inventory column');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ track_inventory column already exists');
        else console.error('❌ Error adding track_inventory:', e.message);
    }

    // Status (enum)
    try {
        await db.query(`ALTER TABLE products ADD COLUMN status ENUM('active', 'draft', 'archived') DEFAULT 'active' AFTER is_new`);
        console.log('✅ Added status column');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ status column already exists');
        else console.error('❌ Error adding status:', e.message);
    }

    console.log('Schema update complete.');
  } catch (err) {
    console.error('Fatal error updating schema:', err.message);
  } finally {
    await db.end();
  }
}

updateSchema();
