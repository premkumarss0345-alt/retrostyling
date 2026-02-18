const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

// Database connection configuration (using Pool for better stability)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Use promise-based wrapper or just use the pool directly
const db = pool.promise();
const { authenticateToken, adminOnly } = require('./middleware/auth');
const { sendOrderEmail } = require('./utils/email');

console.log(`📡 Database pool initialized for ${process.env.DB_HOST}`);

// --- CART ROUTES ---
app.post('/api/cart', authenticateToken, async (req, res, next) => {
  const { productId, variantId, quantity } = req.body;
  const userId = req.user.id;
  try {
    const [existing] = await db.query('SELECT * FROM cart WHERE user_id = ? AND product_id = ? AND variant_id = ?', [userId, productId, variantId]);
    if (existing.length > 0) {
      await db.query('UPDATE cart SET quantity = quantity + ? WHERE id = ?', [quantity || 1, existing[0].id]);
    } else {
      await db.query('INSERT INTO cart (user_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)', [userId, productId, variantId, quantity || 1]);
    }
    res.json({ message: 'Added to cart' });
  } catch (err) {
    next(err);
  }
});

app.get('/api/cart', authenticateToken, async (req, res, next) => {
  try {
    const [items] = await db.query(`
      SELECT c.*, p.name, p.price, p.discount_price, p.image, p.on_sale, v.size, v.color 
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      LEFT JOIN product_variants v ON c.variant_id = v.id 
      WHERE c.user_id = ?`, [req.user.id]);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

app.put('/api/cart/:id', authenticateToken, async (req, res) => {
  const { quantity } = req.body;
  try {
    await db.query('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, req.params.id, req.user.id]);
    res.json({ message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cart/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Removed from cart' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- WISHLIST ROUTES ---
app.post('/api/wishlist', authenticateToken, async (req, res) => {
  const { productId } = req.body;
  try {
    await db.query('INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)', [req.user.id, productId]);
    res.json({ message: 'Added to wishlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/wishlist', authenticateToken, async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT w.id as wishlist_id, p.* 
      FROM wishlist w 
      JOIN products p ON w.product_id = p.id 
      WHERE w.user_id = ?`, [req.user.id]);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/wishlist/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM wishlist WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ORDER ROUTES ---
app.post('/api/orders/place', authenticateToken, async (req, res) => {
  const { total, shippingAddress, phone } = req.body;
  const userId = req.user.id;
  
  try {
    // 1. Get cart items
    const [cartItems] = await db.query('SELECT * FROM cart WHERE user_id = ?', [userId]);
    if (cartItems.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    // 2. Create order
    const [orderResult] = await db.query(
      'INSERT INTO orders (user_id, total, shipping_address, phone, payment_status, order_status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, total, shippingAddress, phone, 'pending', 'processing']
    );
    const orderId = orderResult.insertId;

    // 3. Insert order items & Reduce stock
    for (const item of cartItems) {
      // Get current price from products to avoid client-side manipulation
      const [product] = await db.query('SELECT price, discount_price, on_sale FROM products WHERE id = ?', [item.product_id]);
      
      if (product.length === 0) continue; // Skip if product doesn't exist anymore

      const currentPrice = product[0].on_sale ? product[0].discount_price : product[0].price;

      await db.query(
        'INSERT INTO order_items (order_id, product_id, variant_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.variant_id, item.quantity, currentPrice]
      );

      // Reduce stock
      await db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
      if (item.variant_id) {
        await db.query('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [item.quantity, item.variant_id]);
      }
    }

    // 4. Clear Cart
    await db.query('DELETE FROM cart WHERE user_id = ?', [userId]);

    // 5. Send Emails (Non-blocking)
    const [orderItems] = await db.query(`
      SELECT oi.*, p.name, v.size, v.color 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      LEFT JOIN product_variants v ON oi.variant_id = v.id
      WHERE oi.order_id = ?`, [orderId]);
    
    sendOrderEmail({ id: orderId, total, shippingAddress, phone }, orderItems, req.user.email, false);
    sendOrderEmail({ id: orderId, total, shippingAddress, phone }, orderItems, req.user.email, true);

    res.json({ message: 'Order placed successfully', orderId });
  } catch (err) {
    console.error('Order Placement Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/my-orders', authenticateToken, async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/my-orders/:id', authenticateToken, async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT oi.*, p.name, p.image, v.size, v.color 
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_variants v ON oi.variant_id = v.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.id = ? AND o.user_id = ?`, [req.params.id, req.user.id]);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- AUTH ROUTES ---

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const [user] = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (user.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(user[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Signup (Firebase version)
app.post('/api/auth/signup', async (req, res, next) => {
  const { name, email, uid } = req.body;
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      // If user exists, just update their firebase_uid
      await db.query('UPDATE users SET firebase_uid = ? WHERE email = ?', [uid, email]);
      return res.status(200).json({ message: 'User updated successfully' });
    }

    // Set a dummy password because the column is NOT NULL
    const dummyPassword = await bcrypt.hash(Math.random().toString(36), 10);
    await db.query('INSERT INTO users (name, email, password, firebase_uid) VALUES (?, ?, ?, ?)', [name, email, dummyPassword, uid]);

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    next(err);
  }
});

// Firebase Login Sync
app.post('/api/auth/firebase-login', async (req, res, next) => {
  const { email, uid } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found in local database' });
    }

    const user = users[0];
    
    // Update UID if it's missing
    if (!user.firebase_uid) {
      await db.query('UPDATE users SET firebase_uid = ? WHERE id = ?', [uid, user.id]);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ message: 'User not found' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Basic Route
app.get('/', (req, res) => {
  res.send('Retrostylings Backend API is running...');
});

app.get('/api/health', async (req, res) => {
    try {
        const [[{ pCount }]] = await db.query('SELECT COUNT(*) as pCount FROM products');
        const [[{ cCount }]] = await db.query('SELECT COUNT(*) as cCount FROM categories');
        const [[{ sCount }]] = await db.query('SELECT COUNT(*) as sCount FROM hero_slides');
        
        res.json({ 
            status: 'ok', 
            database: 'connected',
            counts: { products: pCount, categories: cCount, slides: sCount },
            env_check: {
                has_db_host: !!process.env.DB_HOST,
                has_db_user: !!process.env.DB_USER,
                has_db_name: !!process.env.DB_NAME
            }
        });
    } catch (err) {
        res.status(500).json({ 
            status: 'error', 
            message: err.message,
            code: err.code
        });
    }
});

// --- PRODUCT ROUTES ---

// Get all products with filters
app.get('/api/products', async (req, res, next) => {
  const { category, minPrice, maxPrice, search } = req.query;
  const params = [];
  let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
  
  // Public check (simplistic)
  if (!req.headers['authorization']) {
      query += ' AND p.status = "active"';
  } else if (req.query.status) {
      query += ' AND p.status = ?';
      params.push(req.query.status);
  }

  if (category) {
    query += ' AND (c.slug = ? OR c.id = ?)';
    params.push(category, category);
  }
  if (minPrice) {
    query += ' AND p.price >= ?';
    params.push(minPrice);
  }
  if (maxPrice) {
    query += ' AND p.price <= ?';
    params.push(maxPrice);
  }
  if (search) {
    query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  // New Filters
  if (req.query.is_new) {
    query += ' AND p.is_new = 1';
  }

  if (req.query.sort === 'popular') {
    // For now, just sort by stock descending as a proxy or random
    // Better: sort by ID desc (newest) or random
    query += ' ORDER BY p.stock ASC'; // Low stock = popular? Or just RAND()
  } else if (req.query.sort === 'newest') {
    query += ' ORDER BY p.created_at DESC';
  } else {
    query += ' ORDER BY p.id DESC'; // Default newest first
  }

  try {
    const [products] = await db.query(query, params);
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// Get single product by slug
app.get('/api/products/:slug', async (req, res) => {
  try {
    const [products] = await db.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ?', 
      [req.params.slug]
    );
    if (products.length === 0) return res.status(404).json({ message: 'Product not found' });
    
    // Get variants
    const [variants] = await db.query('SELECT * FROM product_variants WHERE product_id = ?', [products[0].id]);
    res.json({ ...products[0], variants });
  } catch (err) {
    next(err);
  }
});

// --- CATEGORY ROUTES ---
app.get('/api/categories', async (req, res, next) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories');
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// --- PRODUCT ROUTES (Admin) ---

// 3. CREATE PRODUCT
// 3. CREATE PRODUCT
app.post('/api/products', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { 
        name, slug, description, price, discount_price, stock, image, category_id, 
        on_sale, is_new, sku, cost_price, tax, low_stock_threshold, track_inventory, status, brand 
    } = req.body;
    
    // Default values if not provided
    const _cost_price = cost_price || 0;
    const _tax = tax || 0;
    const _low_stock_threshold = low_stock_threshold || 5;
    const _track_inventory = track_inventory !== undefined ? track_inventory : true;
    const _status = status || 'active';
    const _brand = brand || null;

    const sql = `INSERT INTO products (
        name, slug, description, price, discount_price, stock, image, category_id, 
        on_sale, is_new, sku, cost_price, tax, low_stock_threshold, track_inventory, status, brand
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const [result] = await db.query(sql, [
        name, slug, description, price, discount_price, stock, image, category_id, 
        on_sale, is_new, sku, _cost_price, _tax, _low_stock_threshold, _track_inventory, _status, _brand
    ]);
    res.status(201).json({ message: 'Product created', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'SKU or Slug already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// 4. UPDATE PRODUCT
app.put('/api/products/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { 
        name, slug, description, price, discount_price, stock, image, category_id, 
        on_sale, is_new, sku, cost_price, tax, low_stock_threshold, track_inventory, status, brand 
    } = req.body;

    const sql = `UPDATE products SET 
        name=?, slug=?, description=?, price=?, discount_price=?, stock=?, image=?, category_id=?, 
        on_sale=?, is_new=?, sku=?, cost_price=?, tax=?, low_stock_threshold=?, track_inventory=?, status=?, brand=? 
        WHERE id=?`;
    
    await db.query(sql, [
        name, slug, description, price, discount_price, stock, image, category_id, 
        on_sale, is_new, sku, cost_price, tax, low_stock_threshold, track_inventory, status, brand, 
        req.params.id
    ]);
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE PRODUCT
app.delete('/api/products/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CATEGORY ROUTES (Admin) ---

app.post('/api/admin/categories', authenticateToken, adminOnly, async (req, res) => {
  const { name, slug, image } = req.body;
  try {
    const [result] = await db.query('INSERT INTO categories (name, slug, image) VALUES (?, ?, ?)', [name, slug, image]);
    res.status(201).json({ message: 'Category created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/categories/:id', authenticateToken, adminOnly, async (req, res) => {
  const { name, slug, image } = req.body;
  try {
    await db.query('UPDATE categories SET name = ?, slug = ?, image = ? WHERE id = ?', [name, slug, image, req.params.id]);
    res.json({ message: 'Category updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- HERO SLIDES ROUTES ---
const multer = require('multer');
const path = require('path');

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Serve static files from uploads folder
app.use('/uploads', express.static('uploads'));

// Get all slides
app.get('/api/hero-slides', async (req, res, next) => {
    try {
        const [slides] = await db.query('SELECT * FROM hero_slides WHERE active = 1 ORDER BY id ASC');
        res.json(slides);
    } catch (err) {
        next(err);
    }
});

// Admin: Get all slides (including inactive)
app.get('/api/admin/hero-slides', authenticateToken, adminOnly, async (req, res) => {
    try {
        const [slides] = await db.query('SELECT * FROM hero_slides ORDER BY id ASC');
        res.json(slides);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Create new slide
app.post('/api/admin/hero-slides', authenticateToken, adminOnly, upload.single('image'), async (req, res) => {
    const { title, subtitle, description, manualImage } = req.body;
    let image = manualImage;
    if (req.file) {
        image = `/uploads/${req.file.filename}`; // Save path
    }

    try {
        await db.query('INSERT INTO hero_slides (title, subtitle, description, image) VALUES (?, ?, ?, ?)', 
            [title, subtitle, description, image]);
        res.status(201).json({ message: 'Slide created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Update slide
app.put('/api/admin/hero-slides/:id', authenticateToken, adminOnly, upload.single('image'), async (req, res) => {
    const { title, subtitle, description, manualImage, active } = req.body;
    let image = manualImage;
    
    // If a new file is uploaded, use it. Otherwise, keep existing image logic handled by client sending old URL? 
    // Actually simplicity: if file, use file path. If no file but manualImage provided, use that.
    
    // We need to construct query dynamically or fetch existing first.
    // Simpler approach:
    
    try {
        let updateQuery = 'UPDATE hero_slides SET title=?, subtitle=?, description=?, active=?';
        let params = [title, subtitle, description, active === 'true' || active === true ? 1 : 0];

        if (req.file) {
            updateQuery += ', image=?';
            params.push(`/uploads/${req.file.filename}`);
        } else if (manualImage) {
            updateQuery += ', image=?';
            params.push(manualImage);
        }

        updateQuery += ' WHERE id=?';
        params.push(req.params.id);

        await db.query(updateQuery, params);
        res.json({ message: 'Slide updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Delete slide
app.delete('/api/admin/hero-slides/:id', authenticateToken, adminOnly, async (req, res) => {
    try {
        await db.query('DELETE FROM hero_slides WHERE id = ?', [req.params.id]);
        res.json({ message: 'Slide deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/categories/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN DASHBOARD ROUTES ---

app.get('/api/admin/stats', authenticateToken, adminOnly, async (req, res) => {
  try {
    const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ totalProducts }]] = await db.query('SELECT COUNT(*) as totalProducts FROM products WHERE status="active"');
    const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) as totalOrders FROM orders');
    const [[{ totalRevenue }]] = await db.query('SELECT SUM(total) as totalRevenue FROM orders WHERE payment_status = "paid"');
    
    // Get recent orders
    const [recentOrders] = await db.query(`
      SELECT o.*, u.name as customer_name 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC LIMIT 5
    `);

    res.json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue || 0
      },
      recentOrders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Management
app.get('/api/admin/users', authenticateToken, adminOnly, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, created_at FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Order Management
app.get('/api/admin/orders', authenticateToken, adminOnly, async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT o.*, u.name as customer_name 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/orders/:id/status', authenticateToken, adminOnly, async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE orders SET order_status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ GLOBAL_ERROR:', {
    message: err.message,
    code: err.code,
    stack: err.stack,
    path: req.path
  });
  res.status(500).json({ 
    error: err.message || 'Internal Server Error',
    code: err.code || 'UNKNOWN_CODE'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`🔗 Database target: ${process.env.DB_HOST}`);
});
