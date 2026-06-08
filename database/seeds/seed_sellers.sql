-- Insert fake sellers
INSERT INTO users (name, email, password_hash, role) VALUES
  ('TechVault Store', 'techvault@shopflow.com', '$2a$10$fakehashabcdefghijklmno', 'seller'),
  ('StyleHub', 'stylehub@shopflow.com', '$2a$10$fakehashabcdefghijklmno', 'seller'),
  ('BookNest', 'booknest@shopflow.com', '$2a$10$fakehashabcdefghijklmno', 'seller')
ON CONFLICT (email) DO NOTHING;

-- Assign seller_id to products
UPDATE products SET seller_id = (SELECT id FROM users WHERE email='techvault@shopflow.com') WHERE id IN (1,2,3);
UPDATE products SET seller_id = (SELECT id FROM users WHERE email='stylehub@shopflow.com') WHERE id = 4;
UPDATE products SET seller_id = (SELECT id FROM users WHERE email='booknest@shopflow.com') WHERE id = 5;

-- Insert fake buyer accounts for reviews
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Alex Johnson', 'alex@buyer.com', '$2a$10$fakehashabcdefghijklmno', 'customer'),
  ('Sarah Chen', 'sarah@buyer.com', '$2a$10$fakehashabcdefghijklmno', 'customer'),
  ('Marcus Williams', 'marcus@buyer.com', '$2a$10$fakehashabcdefghijklmno', 'customer'),
  ('Emily Davis', 'emily@buyer.com', '$2a$10$fakehashabcdefghijklmno', 'customer'),
  ('Jordan Smith', 'jordan@buyer.com', '$2a$10$fakehashabcdefghijklmno', 'customer')
ON CONFLICT (email) DO NOTHING;

-- Reviews for MacBook Pro 14" (product 1)
INSERT INTO reviews (user_id, product_id, rating, comment) VALUES
  ((SELECT id FROM users WHERE email='alex@buyer.com'), 1, 5, 'Absolutely incredible machine. Fast, silent, and the display is stunning. Worth every penny.'),
  ((SELECT id FROM users WHERE email='sarah@buyer.com'), 1, 5, 'Best laptop I have ever owned. Battery lasts all day easily.'),
  ((SELECT id FROM users WHERE email='marcus@buyer.com'), 1, 4, 'Great performance but a bit pricey. Overall very satisfied.')
ON CONFLICT (user_id, product_id) DO NOTHING;

-- Reviews for iPhone 15 Pro (product 2)
INSERT INTO reviews (user_id, product_id, rating, comment) VALUES
  ((SELECT id FROM users WHERE email='sarah@buyer.com'), 2, 5, 'Camera is unreal. The titanium build feels premium in hand.'),
  ((SELECT id FROM users WHERE email='emily@buyer.com'), 2, 5, 'Upgraded from iPhone 13 and the difference is night and day.'),
  ((SELECT id FROM users WHERE email='jordan@buyer.com'), 2, 4, 'Great phone, slightly too expensive but the quality is there.')
ON CONFLICT (user_id, product_id) DO NOTHING;

-- Reviews for Sony WH-1000XM5 (product 3)
INSERT INTO reviews (user_id, product_id, rating, comment) VALUES
  ((SELECT id FROM users WHERE email='marcus@buyer.com'), 3, 5, 'Best noise cancelling headphones on the market period.'),
  ((SELECT id FROM users WHERE email='alex@buyer.com'), 3, 4, 'Sound quality is phenomenal. Comfortable for long sessions.'),
  ((SELECT id FROM users WHERE email='jordan@buyer.com'), 3, 5, 'I use these every day for work. Total game changer.')
ON CONFLICT (user_id, product_id) DO NOTHING;

-- Reviews for Classic Chino (product 4)
INSERT INTO reviews (user_id, product_id, rating, comment) VALUES
  ((SELECT id FROM users WHERE email='emily@buyer.com'), 4, 5, 'Perfect fit and great quality fabric. Very comfortable all day.'),
  ((SELECT id FROM users WHERE email='alex@buyer.com'), 4, 4, 'Good chinos for the price. Runs slightly large so size down.')
ON CONFLICT (user_id, product_id) DO NOTHING;

-- Reviews for The Pragmatic Programmer (product 5)
INSERT INTO reviews (user_id, product_id, rating, comment) VALUES
  ((SELECT id FROM users WHERE email='jordan@buyer.com'), 5, 5, 'A must-read for every developer. Changed how I think about code.'),
  ((SELECT id FROM users WHERE email='sarah@buyer.com'), 5, 5, 'Timeless classic. I reread it every year.'),
  ((SELECT id FROM users WHERE email='marcus@buyer.com'), 5, 4, 'Dense but incredibly valuable. Take notes as you read.')
ON CONFLICT (user_id, product_id) DO NOTHING;
