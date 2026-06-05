-- ============================================================
-- ShopFlow Database Schema
-- PostgreSQL · Full-Stack E-Commerce Platform
-- ============================================================

-- Drop tables in reverse dependency order (for clean resets)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)        NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT                NOT NULL,
  role          VARCHAR(20)         NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at    TIMESTAMP           NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES  (supports nesting via parent_category_id)
-- ============================================================
CREATE TABLE categories (
  id                 SERIAL PRIMARY KEY,
  name               VARCHAR(100) NOT NULL,
  slug               VARCHAR(100) UNIQUE NOT NULL,
  parent_category_id INT REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255)   NOT NULL,
  description TEXT,
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock_qty   INT            NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  category_id INT            REFERENCES categories(id) ON DELETE SET NULL,
  image_url   TEXT,
  created_at  TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id               SERIAL PRIMARY KEY,
  user_id          INT            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status           VARCHAR(30)    NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  total_price      NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  shipping_address TEXT           NOT NULL,
  created_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INT            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT            NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INT            NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

-- ============================================================
-- CART ITEMS
-- ============================================================
CREATE TABLE cart_items (
  id         SERIAL PRIMARY KEY,
  user_id    INT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INT       NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)  -- one row per product per user
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id         SERIAL PRIMARY KEY,
  user_id    INT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating     INT       NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)  -- one review per product per user
);

-- ============================================================
-- INDEXES  (performance on common query patterns)
-- ============================================================
CREATE INDEX idx_products_category    ON products(category_id);
CREATE INDEX idx_orders_user          ON orders(user_id);
CREATE INDEX idx_order_items_order    ON order_items(order_id);
CREATE INDEX idx_order_items_product  ON order_items(product_id);
CREATE INDEX idx_cart_user            ON cart_items(user_id);
CREATE INDEX idx_reviews_product      ON reviews(product_id);

-- ============================================================
-- VIEW: top_products  (bestsellers ranked by revenue)
-- ============================================================
CREATE OR REPLACE VIEW top_products AS
  SELECT
    p.id,
    p.name,
    p.price,
    SUM(oi.quantity)                        AS units_sold,
    SUM(oi.quantity * oi.unit_price)        AS total_revenue,
    ROUND(AVG(r.rating), 2)                 AS avg_rating,
    COUNT(DISTINCT r.id)                    AS review_count
  FROM products p
  LEFT JOIN order_items oi ON oi.product_id = p.id
  LEFT JOIN reviews      r  ON r.product_id  = p.id
  GROUP BY p.id, p.name, p.price
  ORDER BY total_revenue DESC NULLS LAST;

-- ============================================================
-- STORED PROCEDURE: place_order
-- Wraps order creation + stock decrement in one transaction
-- ============================================================
CREATE OR REPLACE FUNCTION place_order(
  p_user_id         INT,
  p_shipping_address TEXT,
  p_items           JSON   -- [{"product_id":1,"quantity":2}, ...]
)
RETURNS INT              -- returns new order id
LANGUAGE plpgsql AS $$
DECLARE
  v_order_id  INT;
  v_item      JSON;
  v_product   products%ROWTYPE;
  v_total     NUMERIC(10,2) := 0;
BEGIN
  -- 1. Validate stock for every item first
  FOR v_item IN SELECT * FROM json_array_elements(p_items)
  LOOP
    SELECT * INTO v_product
      FROM products
      WHERE id = (v_item->>'product_id')::INT;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_item->>'product_id';
    END IF;

    IF v_product.stock_qty < (v_item->>'quantity')::INT THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product.name;
    END IF;

    v_total := v_total + v_product.price * (v_item->>'quantity')::INT;
  END LOOP;

  -- 2. Create the order
  INSERT INTO orders (user_id, total_price, shipping_address)
  VALUES (p_user_id, v_total, p_shipping_address)
  RETURNING id INTO v_order_id;

  -- 3. Insert order items and decrement stock
  FOR v_item IN SELECT * FROM json_array_elements(p_items)
  LOOP
    SELECT * INTO v_product
      FROM products WHERE id = (v_item->>'product_id')::INT;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (v_order_id,
            (v_item->>'product_id')::INT,
            (v_item->>'quantity')::INT,
            v_product.price);

    UPDATE products
      SET stock_qty = stock_qty - (v_item->>'quantity')::INT
      WHERE id = (v_item->>'product_id')::INT;
  END LOOP;

  RETURN v_order_id;
END;
$$;
