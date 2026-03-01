-- Profiles cədvəlinə avatar_url və cover_url sütunlarının əlavə edilməsi
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Şəkillər üçün storage bucket yaratmaq (əgər yoxdursa)
INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true) ON CONFLICT (id) DO NOTHING;

-- Şəkillər üçün access policy yaratmaq (istifadəçi öz şəklini yükləyə/dəyişə bilər, hamı görə bilər)
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'profiles' );

CREATE POLICY "Users can upload their own avatar."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'profiles' AND auth.uid() = owner );

CREATE POLICY "Users can update their own avatar."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'profiles' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own avatar."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'profiles' AND auth.uid() = owner );
