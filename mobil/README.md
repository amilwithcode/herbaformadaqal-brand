# Herbalife Brand – Mobil tətbiq

Bu qovluq **Herbalife brend** layihəsinin mobil tətbiqidir. **iOS** və **Android** üçün bir kod bazası ilə yazılıb və **App Store** (Apple) ilə **Play Store** (Google) üçün buraxıla bilər.

## Texnologiyalar

- **Expo** (React Native) – cross-platform mobil
- **React Navigation** – alt tablar (Ana səhifə, Məhsullar, Kateqoriyalar, Səbət, Hesab) və stack (məhsul təfərrüatı)
- **TypeScript**
- **Çoxdillilik** – AZ, EN, TR, RU (Hesab səhifəsindən dil seçimi)

## Tələblər

- Node.js 18+
- npm və ya yarn
- iOS üçün: macOS + Xcode (simulyator və ya cihaz)
- Android üçün: Android Studio (simulyator və ya cihaz)

## Quraşdırma

1. **Asılılıqları quraşdırın**
   ```bash
   cd mobil
   npm install
   ```

2. **Mühit dəyişənlərini təyin edin**
   - `mobil` qovluğunda `.env` yaradın (və ya `.env.example`-ı `.env` kopyalayıb doldurun).
   - `EXPO_PUBLIC_API_URL` – əsas saytın ünvanı (məs: `https://www.herbaformadaqal.com`). Mobil tətbiq məhsul/kateqoriya siyahıları üçün bu ünvana API sorğuları göndərir.

3. **Asset faylları (ikon və splash)**
   - `mobil/assets/` qovluğuna əlavə edin:
     - `icon.png` – 1024x1024 px (tətbiq ikonu)
     - `splash.png` – açılış ekranı şəkli
     - `adaptive-icon.png` – Android üçün 1024x1024 px
   - Bu fayllar olmadan da Expo işləyər; buraxışdan əvvəl brendə uyğun ikonları əlavə etmək tövsiyə olunur.

## İşə salma

- **Expo dev server**
  ```bash
  npm start
  ```
  Açılan menyuda **i** (iOS) və ya **a** (Android) ilə simulyatoru açın; və ya telefonunuzda **Expo Go** tətbiqi ilə QR kodunu skan edin.

- **Birbaşa Android**
  ```bash
  npm run android
  ```

- **Birbaşa iOS** (yalnız macOS)
  ```bash
  npm run ios
  ```

## App Store və Play Store üçün build

1. **EAS (Expo Application Services)**
   - [expo.dev](https://expo.dev) hesabı açın və proyekti bağlayın.
   - `app.json`-da `extra.eas.projectId`-i öz EAS layihə ID-niz ilə əvəz edin.

2. **EAS CLI quraşdırın**
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

3. **Build əmrləri**
   - Android (APK/AAB): `npm run build:android` və ya `eas build --platform android`
   - iOS: `npm run build:ios` və ya `eas build --platform ios`
   - Hər iki platform: `npm run build:all` və ya `eas build --platform all`

4. **Buraxılış**
   - **Play Store**: Android build-ini (AAB) Google Play Console-da yükləyin.
   - **App Store**: iOS build-ini Apple App Store Connect-ə (Transporter və ya EAS Submit ilə) yükləyin.

## API uyğunluğu

Mobil tətbiq aşağıdakı endpoint-ləri gözləyir (əsas saytın hostunda):

- **Məhsul siyahısı:** `GET {API_BASE_URL}/api/products?limit=20`  
  Cavab: `{ products: Array<{ id, name, slug?, price?, image_url? }> }`
- **Məhsul təfərrüatı:** `GET {API_BASE_URL}/api/products/:id`  
  Cavab: `{ product: { id, name, description?, price?, image_url? } }`
- **Kateqoriyalar:** `GET {API_BASE_URL}/api/categories`  
  Cavab: `{ categories: Array<{ id, name, slug?, image_url?, product_count? }> }`

Əgər əsas layihədə bu marşrutlar yoxdursa, Next.js `app/api/` altında uyğun route-lar əlavə etməlisiniz (məs: `api/products/route.ts`, `api/products/[id]/route.ts`, `api/categories/route.ts`).

## Qovluq quruluşu

```
mobil/
├── App.tsx                 # Giriş nöqtəsi
├── app.json                # Expo konfiqurasiyası (iOS/Android bundle id, ad, ikon)
├── package.json
├── src/
│   ├── constants/          # theme, config (API URL, locales)
│   ├── contexts/           # I18nContext (dil seçimi)
│   ├── i18n/               # messages (az, en, tr, ru)
│   ├── navigation/         # RootNavigator (tab + stack)
│   └── screens/            # Home, Products, Categories, Cart, Account, ProductDetail
├── assets/                 # icon.png, splash.png, adaptive-icon.png
└── README.md
```

## Lisenziya

Layihə ilə eyni lisenziya tətbiq olunur.
