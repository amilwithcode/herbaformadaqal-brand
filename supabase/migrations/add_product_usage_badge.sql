-- Add usage_count and badge_color columns to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS usage_count TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS badge_color VARCHAR(7) DEFAULT '#16a34a';
