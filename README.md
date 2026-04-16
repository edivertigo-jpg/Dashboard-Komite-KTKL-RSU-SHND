# 📋 Dashboard Komite Tenaga Kesehatan Lain
### RSU Surya Husadha Nusa Dua — 2026

Dashboard web untuk monitoring **Tertib Administrasi Tenaga Kesehatan Lain** (STR, SIP, RKK).
Data tersimpan di **Google Sheets** dan file dokumen di **Google Drive**.

---

## ✨ Fitur

- 📊 Statistik real-time: kadaluarsa STR/SIP/RKK, data kosong, karyawan tetap
- 🔍 Filter multi-dimensi: unit, status, kondisi dokumen, tahun ED
- 🎂 Reminder ulang tahun mingguan
- 📁 Upload foto profil + dokumen STR/SIP/RKK ke Google Drive
- ⬇️ Export Excel dengan styling
- 📱 **Progressive Web App (PWA)** — bisa di-install di HP/desktop
- 🔄 Auto-refresh 5 menit (hanya saat tab aktif)
- 📡 Deteksi online/offline otomatis

---

## 🗂️ Struktur File

```
/
├── index.html        ← Aplikasi utama (single file)
├── manifest.json     ← PWA manifest
├── sw.js             ← Service Worker (cache & offline)
├── icons/            ← Icon PWA (72–512px)
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-384.png
│   └── icon-512.png
└── README.md
```

---

## 🚀 Deploy ke GitHub Pages

### 1. Buat Repository
```bash
git init
git add .
git commit -m "Initial deploy: Dashboard Nakes SHND"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO-NAME.git
git push -u origin main
```

### 2. Aktifkan GitHub Pages
- Buka **Settings** → **Pages**
- Source: `Deploy from a branch` → `main` → `/ (root)`
- Klik **Save**

Setelah beberapa menit, dashboard bisa diakses di:
```
https://USERNAME.github.io/REPO-NAME/
```

### 3. Install sebagai PWA
- **Android/Chrome**: Buka URL → ketuk menu ⋮ → *"Add to Home Screen"*
- **iOS/Safari**: Buka URL → ketuk ⎙ Share → *"Add to Home Screen"*
- **Desktop/Chrome**: Klik ikon ⊕ di address bar

---

## ⚙️ Konfigurasi

### Ubah URL Google Apps Script
Di `index.html`, baris:
```javascript
const API = 'https://script.google.com/macros/s/...../exec';
```
Ganti dengan URL deploy Apps Script Anda.

### Tambah Unit Kerja
Di `index.html`, cari `<select ... id="fUnit2">` dan `<select ... id="fUnit">`,
tambahkan `<option>` baru di keduanya.

---

## 🔧 Update Service Worker (setelah edit kode)

Setiap kali `index.html` berubah, naikkan versi cache di `sw.js`:
```javascript
const CACHE_VERSION = 'nakes-shnd-v2'; // ← naikkan angkanya
```
Ini memastikan semua pengguna mendapat versi terbaru.

---

## 🐛 Bug yang Diperbaiki

| # | Bug | Perbaikan |
|---|-----|-----------|
| 1 | Banner ulang tahun selalu tampil (double `display` style) | Hapus `display:flex` duplikat di inline style |
| 2 | Label tabel masih "Nama Dokter" / "dokter" | Diubah ke "Nama Nakes" / "nakes" |
| 3 | Modal masih menyebut "Perawat" | Diubah ke "Nakes" di semua label |
| 4 | `callAPI` tidak ada timeout/retry | Tambah timeout 20 detik + 2x retry |
| 5 | `uploadFilePost` tidak ada timeout | Tambah timeout 60 detik |
| 6 | Auto-refresh jalan saat tab tidak aktif | Gunakan `visibilitychange` API |
| 7 | Response GAS non-JSON tidak tertangkap | Tambah try/catch parse JSON |

---

## 📡 Arsitektur Backend

```
Browser (index.html)
    │
    ├── GET  ?action=list   → Google Apps Script
    ├── GET  ?action=add    → Google Apps Script → Google Sheets
    ├── GET  ?action=edit   → Google Apps Script → Google Sheets
    ├── GET  ?action=delete → Google Apps Script → Google Sheets
    └── POST (upload)       → Google Apps Script → Google Drive
                                         │
                              Google Sheets (data)
                              Google Drive (foto & dokumen)
```

---

## 📋 Kolom Spreadsheet

| Kolom | Field | Keterangan |
|-------|-------|-----------|
| A | No | Nomor urut (auto) |
| B | Nama | Nama lengkap + gelar |
| C | Unit | Unit kerja |
| D | NIP | Nomor Induk Pegawai |
| E | Tgl Lahir | Tanggal lahir |
| F | Status | Tetap / Kontrak |
| G | STR Terbit | Tanggal terbit STR |
| H | STR Akhir | Tanggal berakhir STR |
| I | STR Doc | URL dokumen STR di Drive |
| J | SIP Terbit | Tanggal terbit SIP |
| K | SIP Akhir | Tanggal berakhir SIP |
| L | SIP Doc | URL dokumen SIP di Drive |
| M | RKK Terbit | Tanggal terbit RKK |
| N | RKK Akhir | Tanggal berakhir RKK |
| O | RKK Doc | URL dokumen RKK di Drive |
| P | Ket | Keterangan |
| Q | Foto | URL foto profil di Drive |

---

## 📝 Lisensi

Internal use only — RSU Surya Husadha Nusa Dua © 2026
