# Sistem Digital Penerimaan Keluhan Teknis dan Fisik Produk

> **Dokumen ini adalah sumber kebenaran (source of truth) proyek.**
> Agent AI (Gemini di Antigravity IDE) WAJIB membaca seluruh dokumen ini sebelum menulis kode apa pun, dan WAJIB mengikuti Bagian 2 (Aturan untuk Agent) dan Bagian 10 (Fase Kerja).

---

## 1. Ringkasan Proyek

### 1.1 Tujuan
Mengganti formulir keluhan konsumen berbentuk **kertas** menjadi **sistem digital** berbasis web.

Formulir fisik yang digantikan:
- Nama formulir: **Penerimaan Keluhan Teknis dan Fisik**
- Nomor dokumen: **P0-FR/QA-21059.03**
- Perusahaan: **PT. Satoria Aneka Industri (Satoria Pharma)**
- Berlaku tanggal: **26-09-25**
- File referensi: `docs/reference/form-reference.pdf` (disediakan oleh pemilik proyek; sumber asli: `Refrensi Dokumen.pdf` di root, dinyatakan sudah bersih)
- **Nomor dokumen, tanggal berlaku, dan metadata header dapat berganti-ganti** (revisi formulir). Disimpan di satu konfigurasi dan PDF selalu memakai versi terbaru.

### 1.2 Syarat Utama (Non-Negotiable)
1. Alur kerja: **Konsumen → Marketing (validasi) → QA**.
2. User **QA** dapat **mengunduh keluhan dalam bentuk PDF** yang **tata letaknya sama persis** dengan formulir referensi (header, tabel, kotak tanda tangan, footer, dan seterusnya).
3. Stack: **React.js + Tailwind CSS** (frontend), **Node.js** (backend), dideploy ke **Firebase**.

### 1.3 Peran Pengguna

| Role | Kode | Tugas |
|---|---|---|
| Konsumen | `consumer` | Membuat dan mengirim laporan keluhan, **melacak (tracking) status keluhan miliknya sendiri secara detail** (tahap, waktu, catatan revisi) |
| Marketing | `marketing` | Menerima keluhan dari konsumen, melengkapi data penerima, memvalidasi lalu meneruskan ke QA, atau mengembalikan untuk revisi |
| QA | `qa` | Menerima keluhan yang sudah tervalidasi, mengisi Nomor Keluhan secara manual saat menerima, mengunduh PDF resmi |

Hanya ada 3 role. Semua user masuk lewat **satu halaman login** (email + password) dan diarahkan ke dashboard sesuai role.

---

## 2. Aturan untuk Agent (WAJIB DIPATUHI)

1. **Kerjakan per fase.** Hanya kerjakan fase yang sedang diminta pemilik proyek. Setelah satu fase selesai, **BERHENTI** dan laporkan hasilnya. Jangan lanjut ke fase berikutnya tanpa perintah eksplisit seperti `LANJUT FASE X`.
2. **Jangan mengarang.** Jika ada hal yang tidak jelas atau tidak ada di dokumen ini, **tanyakan dulu**. Lihat Bagian 12 (Pertanyaan Terbuka) sebelum berasumsi.
3. **Jangan mengubah stack.** Tidak boleh mengganti React, Tailwind, Node.js, atau Firebase dengan teknologi lain. Menambah library kecil boleh asalkan disebutkan alasannya dan dicatat di `CHANGELOG.md`.
4. **Jangan mengubah isi dan struktur field formulir** (Bagian 4) tanpa persetujuan. Label harus sama persis dengan formulir kertas, termasuk bahasa Indonesia-nya.
5. **Jangan menjalankan perintah destruktif** (`firebase deploy`, menghapus data, `rm -rf`, mengubah Firestore production) tanpa konfirmasi eksplisit. Deploy hanya boleh ke **emulator** kecuali pemilik proyek menulis `DEPLOY PRODUCTION`.
6. **Jangan menyimpan secret** (API key service account, `.env`) ke repository. Pastikan `.gitignore` memuatnya.
7. **Setiap akhir fase**, agent wajib memberi laporan dengan format:
   - Apa yang dibuat (daftar file)
   - Cara menjalankan dan mengetes
   - Checklist Acceptance Criteria (centang yang lulus)
   - Hal yang belum selesai atau butuh keputusan
8. **Catat keputusan teknis** penting di `docs/DECISIONS.md` dan perubahan di `CHANGELOG.md`.
9. **Validasi dua lapis.** Semua validasi input harus ada di frontend dan di backend. Backend tidak boleh percaya data dari frontend.
10. **Otorisasi harus di backend dan Firestore Rules**, bukan hanya menyembunyikan tombol di UI.
11. Kode ditulis dengan komentar singkat berbahasa Indonesia atau Inggris yang konsisten. UI seluruhnya **Bahasa Indonesia**.

---

## 3. Arsitektur dan Tech Stack

```
┌────────────────────┐     HTTPS     ┌──────────────────────────┐
│ React + Tailwind   │ ───────────▶  │ Firebase Cloud Functions │
│ (Firebase Hosting) │  /api/**      │ Node.js 20 + Express     │
└─────────┬──────────┘               └──────────┬───────────────┘
          │ Firebase Auth                       │ Admin SDK
          ▼                                     ▼
   Firebase Authentication              Firestore (data keluhan)
   (role via custom claims)             Cloud Storage (foto/lampiran
                                         + PDF hasil generate)
```

| Lapisan | Teknologi |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS, React Router, React Hook Form + Zod |
| Backend | Node.js 20, Express, di dalam Firebase Cloud Functions (2nd gen) |
| Database | Cloud Firestore |
| Auth | Firebase Authentication (email/password) + **custom claims** untuk role |
| File | Firebase Storage |
| PDF | `pdf-lib` (overlay di atas template PDF), lihat Bagian 7 |
| Hosting | Firebase Hosting dengan rewrite `/api/**` ke Cloud Function `api` |

> Catatan: Cloud Functions membutuhkan paket **Blaze (pay-as-you-go)**. Pemilik proyek harus mengaktifkannya sebelum deploy production. Selama development gunakan **Firebase Emulator Suite**.

### 3.1 Struktur Folder

```
/
├── README.md                  ← dokumen ini
├── CHANGELOG.md
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── docs/
│   ├── reference/
│   │   ├── form-reference.pdf      ← formulir asli (referensi visual)
│   │   └── form-template-blank.pdf ← template KOSONG bersih (lihat 7.2)
│   └── DECISIONS.md
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       │   ├── auth/
│       │   ├── consumer/
│       │   ├── marketing/
│       │   └── qa/
│       ├── lib/ (firebase.js, api.js, validators.js)
│       └── App.jsx
├── functions/
│   └── src/
│       ├── index.js           ← export function `api`
│       ├── routes/            ← complaints.js, users.js, pdf.js
│       ├── middleware/        ← auth.js, requireRole.js
│       ├── services/          ← complaintService.js, pdfService.js
│       ├── pdf/
│       │   └── fieldMap.js    ← koordinat tiap field di PDF
│       └── config/formMeta.js ← metadata dokumen (nomor, tanggal berlaku)
└── scripts/
    └── createUser.js          ← membuat akun marketing/QA + set role
```

---

## 4. Spesifikasi Field Formulir (HARUS SAMA DENGAN FORMULIR KERTAS)

Tanda `*` berarti **wajib diisi** (sesuai catatan di formulir: *"Wajib Diisi oleh pihak marketing"*).

### Header Dokumen (konstanta, bukan input user)
Simpan di `functions/src/config/formMeta.js`:

| Item | Nilai |
|---|---|
| Perusahaan | SATORIA PHARMA |
| Judul formulir | FORMULIR QA, "Penerimaan Keluhan Teknis dan Fisik" |
| No. Dokumen | `P0-FR/QA-21059.03` |
| Halaman | `X dari N` (dinamis; PDF multi-halaman jika produk banyak) |
| Berlaku Tgl | `26-09-25` |
| Dibuat Oleh | ERM, 27.08.25 |
| Diperiksa Oleh | N/A |
| Disetujui Oleh | (tanda tangan, 27.08.25) |

> Karena nilai ini dapat berubah saat formulir direvisi (misalnya `.03` menjadi `.04`), jangan di-hardcode di banyak tempat. Cukup satu file konfigurasi. PDF selalu memakai nilai **terbaru** dari file ini (bukan nilai saat keluhan dibuat). Karena template PDF sudah memuat nilai lama, nilai dari config ditimpa di atasnya (area teks lama ditutup, lalu nilai baru dicetak).

### Nomor Keluhan
- Format: `QA-73/____ . _____ . ________` (tiga segmen isian)
- **Diisi MANUAL oleh Departemen QA** (bukan auto-increment) di halaman khusus QA saat menekan "Terima". Konsumen dan Marketing tidak bisa mengisinya.
- Simpan sebagai tiga field teks: `complaintNo.part1`, `part2`, `part3`. Prefix `QA-73/` tetap.

### I. DATA PELAPOR (diisi Konsumen)
| # | Label | Key | Wajib |
|---|---|---|---|
| 1 | Nama Instansi / Institusi | `reporter.institutionName` | ✅ |
| 2 | Alamat Instansi / Institusi | `reporter.institutionAddress` | ✅ |
| 3 | Nama Pelapor (cantumkan gelar jika ada) | `reporter.name` | ✅ |
| 4 | Jabatan Pelapor | `reporter.position` | ❌ |
| 5 | Nomor Telepon / Email yang bisa dihubungi | `reporter.contact` | ❌ |

### II. DATA KEJADIAN DAN PRODUK KELUHAN (diisi Konsumen)
| # | Label | Key | Wajib |
|---|---|---|---|
| 1 | Tanggal Kejadian Keluhan | `incident.date` | ✅ |
| 2 | Tempat Kejadian Keluhan | `incident.place` | ✅ |
| 3 | Detail Kronologi Kejadian (teks panjang, multi-baris) | `incident.chronology` | ✅ |
| 4 | Informasi Produk yang disampaikan (tabel, **tombol "Tambah produk", tanpa batas baris**) | `products[]` | ≥1 baris |

Kolom tabel produk (`products[]`):
| Kolom | Key | Wajib | Catatan |
|---|---|---|---|
| No. | (otomatis) | | berurutan, tanpa batas |
| Nama Produk | `name` | ✅ | |
| Nomor Batch | `batchNo` | ✅ | |
| Jumlah (botol/pcs) | `quantity` | ✅ | angka bulat > 0 |
| Sampel | `hasSample` | ✅ | pilihan `Ya` / `Tidak` (radio) |
| Keterangan / Informasi Tambahan | `notes` | ❌ | |

### III. DATA PENERIMA KELUHAN (diisi Marketing saat validasi)
| # | Label | Key | Wajib |
|---|---|---|---|
| 1 | Tanggal Terima Keluhan | `receiver.receivedDate` | ✅ |
| 2 | Nama Penerima Keluhan | `receiver.name` | ✅ |
| 3 | Area Kerja Penerima | `receiver.workArea` | ❌ |
| 4 | Tanggapan awal yang disampaikan kepada pelapor | `receiver.initialResponse` | ✅ |

### Kotak Tanda Tangan (bagian bawah formulir)
Tiga kolom, masing-masing berformat `[Nama, tanggal, tanda tangan]`:
1. **Diterima dan dilaporkan oleh** (Marketing penerima)
2. **Diketahui oleh**
3. **Diverifikasi oleh PM**

Perilaku digital: sistem mengisi **nama dan tanggal otomatis** dari akun yang melakukan validasi (tanggal selalu otomatis, termasuk `receiver.receivedDate`). Kolom "Diketahui oleh" dan "Diverifikasi oleh PM" berupa isian teks nama oleh Marketing (tidak ada role PM). Tidak ada tanda tangan digital kriptografis.

### Catatan Footer di Formulir
- `Note : Formulir diisi menggunakan tinta BIRU` → pada PDF hasil generate, **teks isian dicetak berwarna biru** agar menyerupai pengisian manual.
- Footer hak cipta: *"Dokumen ini adalah milik PT. Satoria Aneka Industri yang bersifat rahasia. Dilarang untuk menggandakan tanpa seijin PT. Satoria Aneka Industri"* dan referensi lampiran `Lampiran 1 P0-SP/QA-21073.04` **sudah ada di template** dan ikut tercetak.
- Stempel **CONTROLLED COPY tidak dicetak** di PDF.

---

## 5. Alur Kerja dan Status

```
DRAFT ──submit──▶ SUBMITTED ──marketing validasi──▶ VALIDATED ──otomatis──▶ SENT_TO_QA ──QA terima──▶ RECEIVED_BY_QA
                      │
                      └──marketing kembalikan──▶ NEEDS_REVISION ──konsumen perbaiki & kirim ulang──▶ SUBMITTED
```

| Status | Arti | Siapa yang bisa mengubah |
|---|---|---|
| `DRAFT` | Konsumen masih mengisi | consumer (pemilik) |
| `SUBMITTED` | Terkirim, menunggu Marketing | consumer |
| `NEEDS_REVISION` | Dikembalikan Marketing dengan alasan | marketing |
| `VALIDATED` | Marketing sudah melengkapi Bagian III dan memvalidasi | marketing |
| `SENT_TO_QA` | Masuk antrean QA (dapat langsung dipicu saat validasi) | sistem |
| `RECEIVED_BY_QA` | QA menerima dan mengisi Nomor Keluhan | qa |

Aturan:
- Perubahan status hanya lewat **endpoint backend** yang memeriksa role dan status saat ini (state machine). Transisi di luar tabel di atas harus ditolak (HTTP 409).
- Setiap perubahan status dicatat di subkoleksi `history` (siapa, kapan, dari status mana ke mana, catatan). `VALIDATED` dan `SENT_TO_QA` dicatat sebagai **dua entri terpisah**.
- **Tracking konsumen:** konsumen melihat timeline detail dari `history` untuk keluhannya sendiri (tahap saat ini, waktu tiap perubahan, catatan revisi dari Marketing). Data internal (mis. `byUid`) tidak diekspos.
- Setelah `VALIDATED`, **isi Bagian I dan II tidak boleh diedit lagi** oleh siapa pun (integritas dokumen QA).
- **Konsumen hanya melihat keluhannya sendiri.** Marketing melihat semua keluhan berstatus `SUBMITTED` ke atas (termasuk `SENT_TO_QA` dan `RECEIVED_BY_QA`). QA hanya melihat `SENT_TO_QA` ke atas.

---

## 6. Model Data Firestore

Koleksi `users/{uid}`
```json
{ "email": "", "displayName": "", "role": "consumer|marketing|qa", "createdAt": "timestamp" }
```

Koleksi `complaints/{complaintId}`
```json
{
  "status": "DRAFT",
  "createdBy": "uid",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "complaintNo": { "part1": "", "part2": "", "part3": "" },
  "reporter": { "institutionName": "", "institutionAddress": "", "name": "", "position": "", "contact": "" },
  "incident": { "date": "YYYY-MM-DD", "place": "", "chronology": "" },
  "products": [
    { "name": "", "batchNo": "", "quantity": 0, "hasSample": true, "notes": "" }
  ],
  "receiver": { "receivedDate": "YYYY-MM-DD", "name": "", "workArea": "", "initialResponse": "" },
  "signatures": {
    "receivedBy":  { "name": "", "date": "" },
    "acknowledgedBy": { "name": "", "date": "" },
    "verifiedByPM": { "name": "", "date": "" }
  },
  "attachments": [ { "path": "", "name": "", "contentType": "" } ],
  "revisionNote": ""
}
```
Subkoleksi `complaints/{id}/history/{historyId}`: `{ from, to, byUid, byRole, note, at }`

---

## 7. Fitur Download PDF (Prioritas Tertinggi)

### 7.1 Persyaratan
- Hanya user dengan role `qa` yang bisa mengunduh, dan hanya untuk keluhan berstatus `SENT_TO_QA` atau `RECEIVED_BY_QA`.
- Hasil PDF harus **identik dengan `docs/reference/form-reference.pdf`**: ukuran halaman (A4 portrait), header dengan logo Satoria Pharma, kotak nomor dokumen, tabel produk, kotak tanda tangan, footer, posisi dan garis tabel yang sama.
- **Multi-halaman:** jumlah produk tidak dibatasi. Jika baris produk melebihi ruang di halaman 1, tabel dilanjutkan di halaman tambahan dengan header yang sama dan penomoran "Halaman X dari N". Kotak tanda tangan dan footer berada di halaman terakhir (atau sesuai desain template, ditentukan di Fase 5). Bagian lain (kronologi, tanggapan awal) tetap satu halaman.
- Nomor Dokumen, Berlaku Tgl, dan metadata header memakai nilai **terbaru** dari `formMeta.js`.
- Isian dicetak berwarna **biru**, font sans-serif yang mirip aslinya (Helvetica/Arial).
- Nama file: `Keluhan_<NomorKeluhan atau ID>_<YYYYMMDD>.pdf`.

### 7.2 Pendekatan Teknis (WAJIB diikuti)
**Gunakan template PDF kosong + overlay teks dengan `pdf-lib`.** Jangan menggambar ulang formulir dengan HTML/CSS atau library lain, karena hasilnya tidak akan sama persis.

Langkah:
1. Pemilik proyek menyediakan template kosong. File sumber saat ini: `Refrensi Dokumen.pdf` (dinyatakan **sudah bersih**: tanpa stempel *CONTROLLED COPY*, tanda tangan basah, atau tulisan tangan). Agent menyalinnya ke `docs/reference/form-template-blank.pdf` dan `form-reference.pdf`. Di awal Fase 5, agent memeriksa isinya; jika ternyata tidak bersih, berhenti dan minta file baru.
2. `pdfService.js` memuat template, lalu menulis teks di koordinat yang ditentukan di `functions/src/pdf/fieldMap.js` (satuan point, origin kiri-bawah).
3. Pengisian teks panjang (kronologi, tanggapan awal) harus **word-wrap** dan dibatasi jumlah baris sesuai area template. Jika melebihi area, kecilkan font bertahap sampai batas minimum, lalu potong dengan penanda "…" dan tampilkan peringatan di UI sebelum submit. Batas karakter ditentukan setelah template dianalisis di Fase 5.
4. Tabel produk mengalir ke halaman tambahan bila perlu (lihat 7.1). Centang `☑ Ya` / `☐ Tidak` digambar sebagai kotak kecil + tanda ✓.
5. Header (nomor dokumen, berlaku tgl, dibuat/diperiksa/disetujui) berasal dari `formMeta.js`; nilai lama di template ditimpa (ditutup lalu dicetak ulang) dengan koordinat yang jelas.

> **Agent:** jika `form-template-blank.pdf` belum ada, **berhenti dan minta file itu** kepada pemilik proyek. Jangan mencoba membuat template sendiri.

### 7.3 Verifikasi Kemiripan (Acceptance)
- Render PDF hasil generate dan PDF referensi menjadi gambar (misalnya dengan `pdftoppm`), lalu bandingkan secara visual. Tidak boleh ada elemen bergeser lebih dari ±2 mm.
- Buat skrip `scripts/generateSamplePdf.js` yang menghasilkan PDF dari data contoh untuk pengecekan cepat oleh pemilik proyek. Sertakan sampel produk >5 baris untuk menguji multi-halaman.

---

## 8. API Backend (Express di Cloud Function `api`)

Semua endpoint (kecuali health) memerlukan header `Authorization: Bearer <Firebase ID Token>`.

| Method | Path | Role | Fungsi |
|---|---|---|---|
| GET | `/api/health` | publik | cek layanan |
| GET | `/api/me` | semua | profil dan role user |
| POST | `/api/complaints` | consumer | buat draft |
| PUT | `/api/complaints/:id` | consumer (status DRAFT/NEEDS_REVISION) | ubah Bagian I dan II |
| POST | `/api/complaints/:id/submit` | consumer | DRAFT/NEEDS_REVISION → SUBMITTED |
| GET | `/api/complaints` | semua (difilter per role) | daftar keluhan + filter status |
| GET | `/api/complaints/:id` | sesuai hak akses | detail |
| POST | `/api/complaints/:id/validate` | marketing | isi Bagian III + penandatangan (tanggal otomatis), status → VALIDATED → SENT_TO_QA (dua entri history) |
| POST | `/api/complaints/:id/return` | marketing | status → NEEDS_REVISION (wajib `revisionNote`) |
| POST | `/api/complaints/:id/receive` | qa | QA mengisi Nomor Keluhan manual (3 segmen), status → RECEIVED_BY_QA |
| GET | `/api/complaints/:id/history` | sesuai hak akses | timeline status (untuk tracking konsumen; tanpa data internal) |
| GET | `/api/complaints/:id/pdf` | qa | unduh PDF (`application/pdf`) |

Format error seragam: `{ "error": { "code": "FORBIDDEN", "message": "..." } }` dengan kode HTTP yang tepat (400, 401, 403, 404, 409).

---

## 9. Autentikasi dan Keamanan

- Login via Firebase Auth (email/password). Role disimpan sebagai **custom claim** (`role`) dan dicerminkan di `users/{uid}`.
- **Konsumen** dapat mendaftar sendiri (role otomatis `consumer`, ditetapkan oleh backend, **bukan dari input client**). **Verifikasi email** diaktifkan di Fase 6 (tahap akhir), tidak di tahap development awal.
- Akun **marketing** dan **qa** dibuat hanya lewat `scripts/createUser.js <email> <role>` yang dijalankan oleh pemilik proyek.
- `firestore.rules`: klien **tidak boleh menulis langsung** ke `complaints`. Semua penulisan lewat backend (Admin SDK). Klien hanya boleh membaca sesuai aturan role di Bagian 5.
- `storage.rules`: lampiran hanya bisa diunggah oleh pemilik keluhan (batas ukuran 5 MB per file, hanya `image/*` dan `application/pdf`), dibaca oleh pemilik, marketing, dan QA.
- Sanitasi semua input teks. CORS dibatasi ke domain Hosting.
- Data keluhan bersifat **rahasia perusahaan**: tidak ada log yang mencetak isi keluhan lengkap.

---

## 10. Fase Kerja (Eksekusi Bertahap)

Pemilik proyek akan memerintahkan satu fase per satu. **Agent berhenti di akhir tiap fase.**

### Fase 0: Setup Proyek
- Inisialisasi Firebase (Hosting, Functions, Firestore, Storage, Emulators), frontend Vite + React + Tailwind, struktur folder Bagian 3.1, ESLint/Prettier, `.gitignore`, `.env.example`.
- **Acceptance:** `firebase emulators:start` berjalan; frontend menampilkan halaman awal; `GET /api/health` mengembalikan `{ "ok": true }`.

### Fase 1: Auth dan Role
- Halaman login/daftar (konsumen), middleware `auth` dan `requireRole`, `scripts/createUser.js`, route guard di frontend, dashboard kosong per role.
- **Acceptance:** tiap role hanya bisa membuka halaman miliknya; mengakses endpoint role lain menghasilkan 403.

### Fase 2: Form Konsumen
- Form lengkap Bagian I dan II sesuai Bagian 4 (termasuk tabel produk dinamis tanpa batas baris, validasi wajib/angka), simpan draft, submit, daftar & detail keluhan milik sendiri, **halaman tracking status detail (timeline)**, upload lampiran foto (opsional).
- **Acceptance:** semua label identik dengan formulir kertas; field wajib divalidasi di frontend dan backend; konsumen tidak bisa melihat keluhan konsumen lain.

### Fase 3: Alur Marketing
- Antrean `SUBMITTED`, halaman detail, form Bagian III + penandatangan, tombol Validasi dan Kembalikan (dengan alasan), riwayat status.
- **Acceptance:** transisi status sesuai state machine Bagian 5; keluhan tervalidasi tidak bisa diedit; riwayat tercatat.

### Fase 4: Alur QA
- Antrean `SENT_TO_QA`, detail, halaman khusus input Nomor Keluhan (3 segmen, manual), tombol Terima.
- **Acceptance:** hanya QA yang bisa mengisi Nomor Keluhan; Marketing/Konsumen tidak bisa.

### Fase 5: Generator PDF
- Implementasi Bagian 7 lengkap, tombol "Unduh PDF" di halaman QA.
- **Acceptance:** lulus verifikasi kemiripan Bagian 7.3 untuk minimal 3 skenario: (a) data minimal, (b) 8+ produk (multi-halaman), (c) kronologi sangat panjang.

### Fase 6: Hardening dan Deploy
- Firestore/Storage rules final + tes, **aktivasi verifikasi email**, penanganan error dan loading state, responsif mobile, README cara menjalankan, deploy.
- **Deploy production hanya setelah pemilik proyek menulis `DEPLOY PRODUCTION`.**

---

## 11. Panduan UI

- Bahasa: **Indonesia** untuk semua teks.
- Tailwind CSS, desain bersih dan profesional (nuansa farmasi: dominan putih, biru/teal sebagai aksen).
- Mobile-first: konsumen kemungkinan mengisi dari ponsel.
- Setiap field wajib diberi tanda `*` merah dan pesan error jelas dalam bahasa Indonesia.
- Tampilkan badge status berwarna di setiap daftar keluhan.
- Tampilan form digital sebaiknya mengikuti urutan bagian I, II, III seperti formulir kertas.

---

## 12. Keputusan Pemilik Proyek (sebelumnya Pertanyaan Terbuka)

Semua pertanyaan awal sudah dijawab. Jika muncul hal baru yang tidak ada di dokumen ini, agent tetap harus bertanya, bukan menebak.

| # | Pertanyaan | Keputusan pemilik proyek |
|---|---|---|
| 1 | Siapa yang mengisi Bagian III (Data Penerima)? | **Marketing** saat validasi |
| 2 | Apakah konsumen harus login? | **Wajib login** (email/password); satu halaman login untuk semua role |
| 3 | Siapa "PM", perlu role keempat? | **Tidak**; nama PM diisi teks oleh Marketing |
| 4 | Nomor Keluhan `QA-73/____.____.____` | **Diisi manual oleh QA** (3 segmen) di halaman khusus QA saat "Terima" (bukan auto-increment) |
| 5 | Stempel "CONTROLLED COPY" di PDF? | **Tidak dicetak** |
| 6 | Notifikasi email? | **Tidak**, ditunda ke fase lanjutan |
| 7 | Produk lebih dari 5 baris? | **Tidak dibatasi**; PDF multi-halaman |
| 8 | Foto lampiran? | **Boleh**, opsional, tidak tercetak di PDF |
| 9 | Template PDF | `Refrensi Dokumen.pdf` (root), dinyatakan bersih |
| 10 | Tanggal penerimaan/tanda tangan | **Otomatis** |
| 11 | History `VALIDATED` & `SENT_TO_QA` | Dicatat **dua entri** |
| 12 | Marketing melihat keluhan setelah `SENT_TO_QA`? | **Boleh** |
| 13 | Batas karakter teks panjang | Ditentukan dari template di Fase 5 |
| 14 | Footer/lampiran PDF | Sudah ada di template |
| 15 | PDF lebih dari 1 halaman (selain tabel produk)? | Tidak |
| 16 | Versi formulir di PDF lama | Selalu **versi terbaru** dari `formMeta.js` |
| 17 | Verifikasi email konsumen | **Ya**, diaktifkan di tahap akhir (Fase 6) |
| 18 | Jumlah/penugasan user | 3 role; semua user satu role melihat antrean yang sama |
| 19 | Firebase project | Nama proyek **Complaint Hub**; masih **lokal/emulator**, konfigurasi production menyusul |
| 20 | Lingkungan | Node.js 20 LTS, Firebase CLI, JDK 21, Git, Poppler (Fase 5); dipasang pemilik proyek |
| 21 | Repository | Baru diinisialisasi di Fase 0 |

---

## 13. Cara Mengontrol Agent (Untuk Pemilik Proyek)

Contoh perintah yang bisa Anda berikan ke agent Gemini:

- `Baca README.md lengkap, lalu rangkum pemahamanmu dan daftar pertanyaan terbuka. Jangan menulis kode.`
- `LANJUT FASE 0.` / `LANJUT FASE 1.` dan seterusnya.
- `Ulangi Fase 2, perbaiki: <catatan>.`
- `Tunjukkan rencana (plan) dulu sebelum mengubah file.`
- `DEPLOY PRODUCTION.` (satu-satunya frasa yang mengizinkan deploy ke production)

Tips: tempatkan file ini di root proyek agar otomatis terbaca oleh agent, dan salin Bagian 2 ke file aturan agent di Antigravity jika tersedia agar selalu dimuat di setiap sesi.

---

## 14. Definition of Done (Seluruh Proyek)

- [ ] Tiga role bekerja sesuai alur Bagian 5
- [ ] Semua field formulir sesuai Bagian 4
- [ ] PDF yang diunduh QA identik dengan formulir referensi (Bagian 7.3)
- [ ] Firestore/Storage rules mencegah akses lintas role
- [ ] Berjalan penuh di Firebase Emulator tanpa error
- [ ] Ter-deploy ke Firebase Hosting + Functions (setelah `DEPLOY PRODUCTION`)
- [ ] `CHANGELOG.md` dan `docs/DECISIONS.md` terisi
