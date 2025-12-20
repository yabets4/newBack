-- Add category column to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category varchar(255);

-- Optional: create an index if you'll query by category frequently
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
