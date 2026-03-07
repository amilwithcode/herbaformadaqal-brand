-- Add multilingual content columns for all page content sections
-- Each content type gets 4 language variants: az, en, ru, tr

ALTER TABLE site_settings
  -- About page
  ADD COLUMN IF NOT EXISTS about_content_az  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS about_content_en  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS about_content_ru  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS about_content_tr  TEXT DEFAULT '',

  -- FAQ page
  ADD COLUMN IF NOT EXISTS faq_content_az    TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS faq_content_en    TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS faq_content_ru    TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS faq_content_tr    TEXT DEFAULT '',

  -- Shipping page
  ADD COLUMN IF NOT EXISTS shipping_content_az TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS shipping_content_en TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS shipping_content_ru TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS shipping_content_tr TEXT DEFAULT '',

  -- Returns page
  ADD COLUMN IF NOT EXISTS returns_content_az  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS returns_content_en  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS returns_content_ru  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS returns_content_tr  TEXT DEFAULT '',

  -- Privacy page
  ADD COLUMN IF NOT EXISTS privacy_content_az  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS privacy_content_en  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS privacy_content_ru  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS privacy_content_tr  TEXT DEFAULT '';
