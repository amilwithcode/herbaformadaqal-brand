-- Create popup_settings table
CREATE TABLE IF NOT EXISTS popup_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  full_name TEXT NOT NULL DEFAULT 'AD SOYAD',
  title TEXT NOT NULL DEFAULT 'Müstəqil Herbalife Tərəfdaşı',
  description TEXT NOT NULL DEFAULT 'İstifadəçi şirkətin rəsmi saytı deyil, müstəqil tərəfdaşın səhifəsindədir.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT popup_settings_single_row CHECK (id = 1)
);

-- Insert default row
INSERT INTO popup_settings (id, full_name, title, description)
VALUES (1, 'AD SOYAD', 'Müstəqil Herbalife Tərəfdaşı', 'İstifadəçi şirkətin rəsmi saytı deyil, müstəqil tərəfdaşın səhifəsindədir.')
ON CONFLICT (id) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_popup_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER popup_settings_updated_at
  BEFORE UPDATE ON popup_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_popup_settings_updated_at();
