# Sistem Administrasi Asesmen Sumatif Terpadu (ASAS • ASAT • ASAJ)

Aplikasi statis — cukup buka `index.html` di Chrome/Edge/Firefox. **Tidak perlu internet**:
semua pustaka, CSS, dan font sudah ada di folder ini.

> Saat menyalin ke komputer/flashdisk lain, salin **seluruh folder** (bukan hanya `index.html`).

## Struktur

```
index.html              Tata letak halaman (menu, tab, form)
css/app.css             Gaya khusus aplikasi (cetak, scrollbar)
css/tailwind.css        CSS Tailwind hasil build (jangan diedit manual)
js/                     Kode aplikasi, dimuat berurutan:
  assets.js               logo/TTD/cap contoh (SVG)
  config.js               preset ASAS/ASAT/ASAJ, data contoh, ukuran & tema
  state.js                data aplikasi, simpan otomatis, validasi backup
  image-tools.js          validasi & kompresi gambar unggahan
  ui.js                   inisialisasi, tab, editor panitia/jadwal/anggaran
  layout.js               kalkulasi tata letak, kop surat, tanda tangan
  render-*.js             17 dokumen output
  settings.js             handler form pengaturan & unggah gambar
  data-io.js              tabel peserta, impor Excel, backup/muat JSON
  export.js               cetak PDF, ekspor Excel
  export-word.js          ekspor Word (.docx)
  utils.js                zoom, toast, dialog, escapeHtml
vendor/                 SheetJS 0.20.3, Lucide, docx (Word), font Inter & Tinos
build/                  konfigurasi Tailwind & uji otomatis
```

## Untuk pengembang

Butuh Node.js hanya bila mengubah kode:

```bash
npm install          # sekali saja
npm run build:css    # WAJIB setelah menambah kelas Tailwind baru di index.html / js/*.js
npm test             # uji otomatis seluruh menu & fitur (Chrome headless, mode offline)
```

`npm test` memakai Chrome di `/usr/bin/google-chrome`; ubah dengan `CHROME_PATH=/lokasi/chrome npm test`.

## Catatan fitur

- **Cetak / PDF** — hasil paling presisi untuk semua dokumen.
- **Word (.docx)** — cocok untuk dokumen teks (SK, POS, Tata Tertib, Berita Acara, Daftar Hadir, Laporan).
  Kartu, denah, dan label tetap bisa diekspor, tetapi posisinya dapat sedikit bergeser.
- **Impor Excel** — membaca .xlsx/.xls/.csv; baris judul di atas tabel dilewati otomatis, setiap baris
  divalidasi, lalu pengguna memilih *Ganti* atau *Tambahkan*.
- **Gambar** (logo, TTD, cap) otomatis diperkecil sebelum disimpan agar penyimpanan browser (±5 MB) tidak penuh.
- **Backup (.json)** divalidasi saat dimuat; data rusak/berbahaya ditolak dan data lama dipulihkan bila gagal.
