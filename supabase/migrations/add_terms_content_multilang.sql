-- Add multilingual terms & conditions content columns to site_settings table
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS terms_content_az TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS terms_content_en TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS terms_content_ru TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS terms_content_tr TEXT DEFAULT '';
