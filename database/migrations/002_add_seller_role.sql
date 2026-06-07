-- Add seller to role enum
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('customer', 'seller', 'admin'));

-- Add seller_id to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0);

CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
