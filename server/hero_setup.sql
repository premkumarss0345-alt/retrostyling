CREATE TABLE IF NOT EXISTS hero_slides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  subtitle VARCHAR(255),
  description TEXT,
  image VARCHAR(500),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO hero_slides (title, subtitle, description, image) VALUES 
('Youth dress \n style now', 'NEW ERA OF STYLE', 'Explore the latest collection of premium men''s fashion. \n Designed for the modern generation.', 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?q=80&w=2070&auto=format&fit=crop'),
('Urban Street \n Culture', 'EXCLUSIVELY FOR YOU', 'Redefining the streets with bold looks. \n Comfort mixed with unapologetic style.', 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=2070&auto=format&fit=crop'),
('Sophisticated \n Elegance', 'TIMELESS CLASSICS', 'A curated selection for the gentleman in you. \n Quality that speaks for itself.', 'https://images.unsplash.com/photo-1516257984-b1b4d8c9230c?q=2070&auto=format&fit=crop');
