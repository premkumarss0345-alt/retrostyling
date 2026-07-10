const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });

  try {
    console.log('📡 Connected to database. Starting reset...');

    // 1. Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    // 2. Drop existing tables
    const tablesToDrop = [
      'cart',
      'wishlist',
      'order_items',
      'orders',
      'product_variants',
      'products',
      'categories',
      'hero_slides',
      'users'
    ];

    for (const table of tablesToDrop) {
      await connection.execute(`DROP TABLE IF EXISTS ${table}`);
      console.log(`🗑️ Dropped table: ${table}`);
    }

    // 3. Create Users Table
    await connection.execute(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        firebase_uid VARCHAR(128),
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✨ Created table: users');

    // 4. Create Categories Table
    await connection.execute(`
      CREATE TABLE categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✨ Created table: categories');

    // 5. Create Products Table with all fields from update_schema.js
    await connection.execute(`
      CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(200) UNIQUE NOT NULL,
        sku VARCHAR(100) UNIQUE,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        cost_price DECIMAL(10,2) DEFAULT 0,
        discount_price DECIMAL(10,2),
        tax DECIMAL(5,2) DEFAULT 0,
        stock INT DEFAULT 0,
        low_stock_threshold INT DEFAULT 5,
        track_inventory BOOLEAN DEFAULT TRUE,
        image VARCHAR(255),
        category_id INT,
        brand VARCHAR(100),
        on_sale BOOLEAN DEFAULT FALSE,
        is_new BOOLEAN DEFAULT FALSE,
        status ENUM('active', 'draft', 'archived') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);
    console.log('✨ Created table: products');

    // 6. Create Product Variants Table
    await connection.execute(`
      CREATE TABLE product_variants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT,
        size VARCHAR(50),
        color VARCHAR(50),
        stock INT DEFAULT 0,
        price_override DECIMAL(10,2),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('✨ Created table: product_variants');

    // 7. Create Orders Table
    await connection.execute(`
      CREATE TABLE orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        total DECIMAL(10,2) NOT NULL,
        payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
        order_status ENUM('processing','shipped','delivered','cancelled') DEFAULT 'processing',
        shipping_address TEXT,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✨ Created table: orders');

    // 8. Create Order Items Table
    await connection.execute(`
      CREATE TABLE order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        product_id INT,
        variant_id INT,
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
      )
    `);
    console.log('✨ Created table: order_items');

    // 9. Create Wishlist Table
    await connection.execute(`
      CREATE TABLE wishlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        product_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('✨ Created table: wishlist');

    // 10. Create Cart Table
    await connection.execute(`
      CREATE TABLE cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        product_id INT,
        variant_id INT,
        quantity INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
      )
    `);
    console.log('✨ Created table: cart');

    // 11. Create Hero Slides Table
    await connection.execute(`
      CREATE TABLE hero_slides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        subtitle VARCHAR(255),
        description TEXT,
        image VARCHAR(500),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✨ Created table: hero_slides');

    // 12. Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🔒 Foreign key checks re-enabled.');

    // 13. Seed default Admin User
    const adminEmail = 'admin@retrostylings.com';
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    await connection.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Admin User', adminEmail, hashedAdminPassword, 'admin']
    );
    console.log('👤 Seeded Admin User (admin@retrostylings.com / admin123)');

    // 14. Seed default Categories
    const categories = [
      ['T-Shirts', 'tshirts'],
      ['Hoodies', 'hoodies'],
      ['Accessories', 'accessories'],
      ['Footwear', 'footwear'],
      ['Winter Wear', 'winter-wear'],
      ['Sports Cap', 'sports-cap']
    ];
    for (const cat of categories) {
      await connection.execute('INSERT INTO categories (name, slug) VALUES (?, ?)', cat);
    }
    console.log('🏷️ Seeded 6 Categories');

    // Get mapping of slug to ID
    const [dbCategories] = await connection.execute('SELECT id, slug FROM categories');
    const catMap = Object.fromEntries(dbCategories.map(c => [c.slug, c.id]));

    // 15. Seed 20 Products
    const productsSeed = [
      // T-Shirts
      ['Urban Street Oversized Tee', 'urban-street-oversized-tee', 'TSHIRT-001', 'Premium heavyweight cotton with a relaxed fit.', 999.00, 400.00, 899.00, 5, 50, catMap['tshirts'], 1, 1],
      ['Minimalist Pocket Tee', 'minimalist-pocket-tee', 'TSHIRT-002', 'Clean design with a functional chest pocket.', 799.00, 300.00, null, 5, 100, catMap['tshirts'], 0, 0],
      ['Vintage Rock Graphic Tee', 'vintage-rock-graphic-tee', 'TSHIRT-003', 'Soft-wash cotton with retro aesthetic.', 899.00, 350.00, 799.00, 5, 40, catMap['tshirts'], 0, 1],
      ['Anime Shadow T-Shirt', 'anime-shadow-tshirt', 'TSHIRT-004', 'Stealthy anime print for the modern fan.', 949.00, 420.00, 849.00, 5, 60, catMap['tshirts'], 1, 0],
      
      // Hoodies
      ['Midnight Essential Hoodie', 'midnight-essential-hoodie', 'HOODIE-001', 'Ultra-soft fleece lining for maximum warmth.', 1499.00, 600.00, 1299.00, 5, 30, catMap['hoodies'], 0, 1],
      ['Arctic Tech Pull-Over', 'arctic-tech-pullover', 'HOODIE-002', 'Water-resistant fabric for outdoor adventures.', 1899.00, 800.00, 1699.00, 5, 25, catMap['hoodies'], 1, 0],
      ['Classic Grey Melange Hoodie', 'classic-grey-melange-hoodie', 'HOODIE-003', 'Timeless design that pairs with anything.', 1399.00, 550.00, null, 5, 45, catMap['hoodies'], 0, 0],
      
      // Winter Wear
      ['Sherpa Lined Denim Jacket', 'sherpa-lined-denim-jacket', 'WINTER-001', 'Classic denim exterior with cozy sherpa interior.', 2999.00, 1200.00, 2699.00, 12, 15, catMap['winter-wear'], 1, 1],
      ['Quilted Puffer Coat', 'quilted-puffer-coat', 'WINTER-002', 'Lightweight insulation for cold winter days.', 3499.00, 1500.00, 2999.00, 12, 20, catMap['winter-wear'], 0, 0],
      ['Camel Wool Blend Overcoat', 'camel-wool-blend-overcoat', 'WINTER-003', 'Formal elegance for the stylish individual.', 4999.00, 2200.00, 4499.00, 12, 10, catMap['winter-wear'], 0, 1],
      
      // Footwear
      ['Retro High-Top Sneakers', 'retro-hightop-sneakers', 'FOOT-001', '80s inspired design with modern cushioning.', 3999.00, 1800.00, 3499.00, 18, 12, catMap['footwear'], 1, 0],
      ['Suede Desert Boots', 'suede-desert-boots', 'FOOT-002', 'Handcrafted genuine suede legacy footwear.', 3299.00, 1400.00, 2999.00, 18, 18, catMap['footwear'], 0, 1],
      ['White Minimalist Trainers', 'white-minimalist-trainers', 'FOOT-003', 'Versatile white leather trainers for daily wear.', 2499.00, 1000.00, 2199.00, 18, 22, catMap['footwear'], 0, 0],
      
      // Accessories
      ['Leather Crossbody Bag', 'leather-crossbody-bag', 'ACC-001', 'Premium top-grain leather with brass hardware.', 1999.00, 900.00, 1799.00, 18, 15, catMap['accessories'], 0, 1],
      ['Aviator Sunglasses', 'aviator-sunglasses', 'ACC-002', 'Polarized lenses with classic gold frame.', 1299.00, 500.00, null, 18, 35, catMap['accessories'], 1, 0],
      ['Canvas Weekender Bag', 'canvas-weekender-bag', 'ACC-003', 'Spacious bag for short trips and gym.', 1599.00, 700.00, 1399.00, 18, 20, catMap['accessories'], 0, 0],
      
      // Sports Cap
      ['Classic Logo Baseball Cap', 'classic-logo-baseball-cap', 'CAP-001', 'Adjustable strap with embroidered logo.', 599.00, 250.00, 499.00, 5, 50, catMap['sports-cap'], 0, 1],
      ['Mesh Back Trucker Hat', 'mesh-back-trucker-hat', 'CAP-002', 'Breathable mesh for active outdoor use.', 499.00, 200.00, 399.00, 5, 40, catMap['sports-cap'], 1, 0],
      ['Beanie Skull Cap', 'beanie-skull-cap', 'CAP-003', 'Stretchable knit fabric for winter warmth.', 399.00, 150.00, null, 5, 60, catMap['sports-cap'], 0, 0],
      ['Performance Running Visor', 'performance-running-visor', 'CAP-004', 'Moisture-wicking fabric for intense training.', 449.00, 180.00, 399.00, 5, 30, catMap['sports-cap'], 0, 1]
    ];

    const images = {
      'urban-street-oversized-tee': 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1974',
      'minimalist-pocket-tee': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2080',
      'vintage-rock-graphic-tee': 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=2070',
      'anime-shadow-tshirt': 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1972',
      'midnight-essential-hoodie': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=2070',
      'arctic-tech-pullover': 'https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?q=80&w=1972',
      'classic-grey-melange-hoodie': 'https://images.unsplash.com/photo-1578681994506-b8f463af49f1?q=80&w=2000',
      'sherpa-lined-denim-jacket': 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?q=80&w=1974',
      'quilted-puffer-coat': 'https://images.unsplash.com/photo-1544923246-77307dd654ca?q=80&w=1974',
      'camel-wool-blend-overcoat': 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=1974',
      'retro-hightop-sneakers': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070',
      'suede-desert-boots': 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1964',
      'white-minimalist-trainers': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012',
      'leather-crossbody-bag': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999',
      'aviator-sunglasses': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=2080',
      'canvas-weekender-bag': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1974',
      'classic-logo-baseball-cap': 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=2070',
      'mesh-back-trucker-hat': 'https://images.unsplash.com/photo-1521369909029-2afed882baee?q=80&w=2070',
      'beanie-skull-cap': 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=1974',
      'performance-running-visor': 'https://images.unsplash.com/photo-1575428652377-a2d80e12a443?q=80&w=2070'
    };

    for (const p of productsSeed) {
      const [name, slug, sku, description, price, cost_price, discount_price, tax, stock, category_id, on_sale, is_new] = p;
      const image = images[slug];
      
      const [result] = await connection.execute(
        `INSERT INTO products (
          name, slug, sku, description, price, cost_price, discount_price, tax, stock, image, category_id, on_sale, is_new, brand, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Retrostylings', 'active')`,
        [name, slug, sku, description, price, cost_price, discount_price, tax, stock, image, category_id, on_sale, is_new]
      );
      
      const productId = result.insertId;
      
      // Seed S, M, L variants
      const variants = [
        [productId, 'S', 'Standard', Math.floor(stock / 3)],
        [productId, 'M', 'Standard', Math.floor(stock / 3)],
        [productId, 'L', 'Standard', Math.floor(stock / 3)]
      ];
      
      for (const v of variants) {
        await connection.execute('INSERT INTO product_variants (product_id, size, color, stock) VALUES (?, ?, ?, ?)', v);
      }
    }
    console.log('📦 Seeded 20 Products and size variants.');

    // 16. Seed Hero Slides
    const slides = [
      {
        title: "Youth dress \n style now",
        subtitle: "NEW ERA OF STYLE",
        description: "Explore the latest collection of premium men's fashion. \n Designed for the modern generation.",
        image: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?q=80&w=2070&auto=format&fit=crop",
        active: 1
      },
      {
        title: "Urban Street \n Culture",
        subtitle: "EXCLUSIVELY FOR YOU",
        description: "Redefining the streets with bold looks. \n Comfort mixed with unapologetic style.",
        image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=2070&auto=format&fit=crop",
        active: 1
      },
      {
        title: "Winter \n Collection",
        subtitle: "Elegance Redefined",
        description: "Discover warmth in every stitch. \n Premium wool blends for the season.",
        image: "https://images.unsplash.com/photo-1515434126000-961d90c546a1?q=80&w=2070&auto=format&fit=crop",
        active: 1
      }
    ];

    for (const slide of slides) {
      await connection.query(
        "INSERT INTO hero_slides (title, subtitle, description, image, active) VALUES (?, ?, ?, ?, ?)", 
        [slide.title, slide.subtitle, slide.description, slide.image, slide.active]
      );
    }
    console.log('🖼️ Seeded 3 Hero Slides.');

    console.log('✅ Database reset and seeding completed successfully!');
  } catch (err) {
    console.error('❌ Error during reset/seeding:', err);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

resetDatabase();
