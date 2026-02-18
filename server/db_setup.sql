CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10, 2),
  discountPrice DECIMAL(10, 2),
  image VARCHAR(500),
  onSale BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (title, category, price, discountPrice, image, onSale) VALUES 
('Essential Summer Shirt', 'CASUAL', 429.00, 390.00, 'https://images.unsplash.com/photo-1596755094514-f87034a7a241?q=80&w=1974&auto=format&fit=crop', true),
('Officer Linen Shirt', 'FORMAL', 654.00, 600.00, 'https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?q=80&w=1974&auto=format&fit=crop', true),
('Vertical Striped Shirt', 'CASUAL', 497.00, 452.00, 'https://images.unsplash.com/photo-1626497748470-3623761a3d81?q=80&w=1974&auto=format&fit=crop', true),
('Classic Earth Brown', 'CASUAL', 152.00, 140.00, 'https://images.unsplash.com/photo-1563243567-450a80dc955c?q=80&w=1964&auto=format&fit=crop', true),
('Oxford Button Down', 'FORMAL', 899.00, 750.00, 'https://images.unsplash.com/photo-1594932224010-75b4367c4c5c?q=80&w=2080&auto=format&fit=crop', false),
('Denim Utility Overshirt', 'DENIM', 1299.00, 1100.00, 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1926&auto=format&fit=crop', true);
