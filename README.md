# DompetIQ Personal (Expo + TypeScript)

MVP aplikasi pencatatan pengeluaran pribadi dengan fokus cepat input dan insight sederhana.

## Fitur yang sudah dibuat
- 3 tab utama: **Beranda, Riwayat, Insight**
- Quick add transaksi (nominal + kategori + catatan)
- Penyimpanan **persistent SQLite** (data tidak hilang saat app ditutup)
- Ringkasan budget bulanan + **setting budget tersimpan**
- Manajemen kategori berbasis SQLite (default + custom)
- **Budget per kategori** dengan indikator over-limit
- Riwayat transaksi + **filter pencarian** (kategori/catatan/nominal)
- Aksi transaksi dasar: **hapus** dan **edit transaksi** lewat form Beranda
- Kategori default + **kategori custom sederhana**
- **Backup & restore JSON** langsung dari aplikasi (settings + kategori + transaksi)
- Insight mingguan sederhana
- Fondasi data modular (repository, service)
- Blueprint skema SQLite (`src/data/sqlite-schema.sql`)

## Menjalankan aplikasi (development)
```bash
cd dompetiq-personal
npm install
npm start
```

Lalu pilih target:
- `a` untuk Android emulator/device
- `i` untuk iOS simulator (macOS)
- scan QR dengan **Expo Go** untuk device fisik

## Script penting
- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run typecheck`

## Catatan iOS + Android
Metadata package sudah disiapkan:
- iOS bundle identifier: `com.dompetiq.personal`
- Android package: `com.dompetiq.personal`

## Build installable
Untuk build installable iOS/Android, langkah umum menggunakan EAS Build:
```bash
npx expo install eas-cli
npx eas login
npx eas build:configure
npx eas build -p android
npx eas build -p ios
```

> Catatan: build iOS final butuh akun Apple Developer.

## Struktur penting
```text
App.tsx
src/
  models/transaction.ts
  data/repository.ts
  data/sqlite-schema.sql
  services/budgetService.ts
  services/insightService.ts
```

## Next step (disarankan)
1. Tambah opsi export/import file (bukan copy-paste JSON)
2. Tambah chart visual bulanan per kategori
3. Tambah recurring expense reminder
4. Lanjut Tahap 2: OCR, voice, auto-kategori
