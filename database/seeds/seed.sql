-- ============================================================
-- ShopFlow Seed Data
-- Run after schema.sql to populate the database for development
-- ============================================================

-- Categories
INSERT INTO categories (name, slug) VALUES
  ('Electronics',   'electronics'),
  ('Clothing',      'clothing'),
  ('Books',         'books'),
  ('Home & Garden', 'home-garden'),
  ('Sports',        'sports');

INSERT INTO categories (name, slug, parent_category_id) VALUES
  ('Laptops',            'laptops',          1),
  ('Smartphones',        'smartphones',      1),
  ('Men''s Clothing',    'mens-clothing',    2),
  ('Women''s Clothing',  'womens-clothing',  2);

-- Users (passwords are bcrypt hash of "password123")
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin User',  'admin@shopflow.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'),
  ('Jane Smith',  'jane@example.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'customer'),
  ('Bob Johnson', 'bob@example.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'customer');

-- Products
INSERT INTO products (name, description, price, stock_qty, category_id, image_url) VALUES
  ('MacBook Pro 14"',          'Apple M3 chip, 16GB RAM, 512GB SSD',  1999.99, 25, 6, '/public/images/macbook.jpg'),
  ('iPhone 15 Pro',            '6.1" display, A17 Pro chip, 256GB',    999.99, 50, 7, '/public/images/iphone.jpg'),
  ('Sony WH-1000XM5',          'Industry-leading noise cancellation',  349.99, 40, 1, '/public/images/sony.jpg'),
  ('Classic Chino',            'Slim-fit chino trousers, khaki',        59.99,100, 8, '/public/images/chino.jpg'),
  ('The Pragmatic Programmer', '20th Anniversary Edition',              49.99, 75, 3, '/public/images/book.jpg');

-- Reviews
INSERT INTO reviews (user_id, product_id, rating, comment) VALUES
  (2, 1, 5, 'Incredible machine — battery life is unreal.'),
  (3, 1, 4, 'Great laptop but pricey.'),
  (2, 2, 5, 'Best iPhone I''ve ever owned.'),
  (3, 3, 5, 'Noise cancellation is on another level.');
