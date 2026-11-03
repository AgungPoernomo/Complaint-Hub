# Catatan Keputusan Teknis

## 2026-11-03 (Fase 0)
- **Project ID `demo-complaint-hub`**: awalan `demo-` membuat Firebase Emulator berjalan tanpa project Firebase sungguhan. Ganti di `.firebaserc` saat project production dibuat.
- **Region Cloud Functions `asia-southeast2` (Jakarta)**: sementara, harus sama di `firebase.json` (rewrite) dan `functions/src/index.js`. Dapat diubah saat konfigurasi production.
- **Firebase CLI sebagai devDependency lokal** (root `package.json`), dijalankan lewat `npm run emulators`, bukan instalasi global.
- **Node.js**: `functions/package.json` menetapkan engine Node 20 (target deploy). Mesin lokal memakai Node 24; hanya memunculkan peringatan.
- **Express menerima path dengan dan tanpa prefix `/api`**: lewat Hosting rewrite path memuat `/api`, sedangkan URL langsung fungsi tidak.
- **Firestore dan Storage rules**: tolak semua akses klien sampai Fase 6 (aturan final), sesuai prinsip penulisan lewat backend.
- **Nomor Keluhan diisi manual oleh QA** (bukan auto-increment), keputusan pemilik proyek.
- **Produk tanpa batas, PDF multi-halaman**, keputusan pemilik proyek.

