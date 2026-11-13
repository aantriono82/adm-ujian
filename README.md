# Asesmen Sumatif (ASAS • ASAT • ASAJ)

Aplikasi statis — cukup buka `index.html` di Chrome/Edge/Firefox. **Tidak perlu internet**:
semua pustaka, CSS, dan font sudah ada di folder ini.

> Saat menyalin ke komputer/flashdisk lain, salin **seluruh folder** (bukan hanya `index.html`).

## Menjalankan di komputer lokal

### 1. Ambil kodenya

```bash
git clone https://github.com/aantriono82/adm-ujian.git
cd adm-ujian
```

Atau unduh ZIP dari GitHub (*Code → Download ZIP*), lalu ekstrak.

### 2. Buka aplikasi

**Cara A — buka langsung (paling mudah, tanpa instalasi apa pun)**

Klik dua kali `index.html`, atau dari terminal:

```bash
xdg-open index.html     # Linux
open index.html         # macOS
start index.html        # Windows
```

**Cara B — lewat server lokal (opsional)**

Berguna bila ingin membuka aplikasi dari HP/laptop lain di jaringan yang sama. Pilih salah satu:

```bash
python3 -m http.server 8000     # butuh Python 3
npx serve .                     # butuh Node.js
```

Lalu buka `http://localhost:8000` (atau alamat yang ditampilkan `npx serve`). Dari perangkat lain, ganti
`localhost` dengan alamat IP komputer ini, mis. `http://192.168.1.10:8000`. Hentikan server dengan `Ctrl+C`.

### 3. Pasang sebagai aplikasi (PWA, opsional)

Saat dibuka lewat server (Cara B) atau dari hosting **https**, aplikasi bisa dipasang seperti aplikasi biasa
dan tetap jalan tanpa internet:

- **Chrome/Edge (komputer & Android):** klik menu **Alat → Pasang Aplikasi**, atau ikon pasang di bilah alamat.
- **Safari (iPhone/iPad):** tombol *Bagikan* → *Tambah ke Layar Utama*.

Setelah dibuka sekali, semua berkas tersimpan di perangkat sehingga aplikasi bisa dibuka walau offline. Bila ada
versi baru, muncul pemberitahuan *Versi baru aplikasi tersedia* — klik **Muat ulang**.

> Fitur pasang/offline tidak aktif bila `index.html` dibuka langsung (Cara A); browser hanya mengizinkannya
> lewat `http://localhost` atau `https://`. Dari perangkat lain lewat alamat IP (`http://192.168…`) browser
> juga menolaknya — gunakan hosting https (mis. GitHub Pages) untuk itu.

> **Penting soal data:** isian tersimpan otomatis di penyimpanan browser, terpisah untuk setiap browser dan
> setiap cara membuka (Cara A dan Cara B tidak berbagi data). Untuk memindahkan data, gunakan
> *Data & Backup → Backup (.json)*, lalu *Data & Backup → Muat Backup* di browser/cara yang lain.

### 4. Pasang di Linux sebagai paket `.deb` (Debian/Ubuntu/Mint, opsional)

```bash
npm run build:deb                                   # hasil: dist/asesmen-sumatif_<versi>_all.deb
sudo apt install ./dist/asesmen-sumatif_*_all.deb   # pasang
sudo apt remove asesmen-sumatif                     # hapus
```

Setelah dipasang, **Asesmen Sumatif** muncul di menu aplikasi dan terbuka sebagai jendela sendiri (tanpa bilah
alamat) memakai Chrome/Chromium/Edge/Brave yang ada di komputer. Bila tidak ada, aplikasi dibuka di Firefox
atau browser bawaan. Paket tidak membawa browser, jadi ukurannya kecil (sekitar 1 MB).

- Paket siap pakai juga tersedia di halaman **Releases** GitHub. Untuk merilis versi baru: naikkan `"version"`
  di `package.json`, lalu `git tag v<versi> && git push origin v<versi>`. GitHub Actions akan menguji, membuat
  `.deb`, dan menerbitkan Release-nya. Setiap push/PR juga menghasilkan `.deb` uji di tab Actions (bagian *Artifacts*).
- Versi paket diambil dari `"version"` di `package.json`, atau bisa ditentukan sendiri: `VERSION=1.2.0 npm run build:deb`.
- Data aplikasi disimpan di profil browser tersendiri (`~/.config/asesmen-sumatif/profile`), terpisah dari
  browser sehari-hari dan dari Cara A/B. Pindahkan data lama lewat *Backup (.json)* → *Muat Backup*.
- Untuk browser versi Snap (bawaan Ubuntu), berkas aplikasi otomatis disalin ke `~/snap/<browser>/common/asesmen-sumatif/`
  karena Snap tidak bisa membaca `/usr/share`.

## Struktur

```
index.html              Tata letak halaman (menu, tab, form)
manifest.webmanifest    Identitas PWA (nama, ikon, warna)
sw.js                   Service worker: simpan berkas untuk offline (dibuat ulang oleh build:sw)
css/app.css             Gaya khusus aplikasi (cetak, scrollbar)
css/tailwind.css        CSS Tailwind hasil build (jangan diedit manual)
js/                     Kode aplikasi, dimuat berurutan:
  assets.js               logo/TTD/cap contoh (SVG)
  config.js               preset ASAS/ASAT/ASAJ, data contoh, ukuran & tema
  state.js                data aplikasi, simpan otomatis, validasi backup
  image-tools.js          validasi & kompresi gambar unggahan
  ui.js                   inisialisasi, tab, editor panitia/jadwal/anggaran
  guru-pengawas.js        daftar guru pengawas & pembagian pengawas otomatis
  layout.js               kalkulasi tata letak, kop surat, tanda tangan
  render-*.js             17 dokumen output
  settings.js             handler form pengaturan & unggah gambar
  data-io.js              tabel peserta, impor Excel, backup/muat JSON
  data-template.js        template Excel lengkap (peserta, panitia, korektor, pengawas, piket, susulan)
  export.js               cetak PDF, ekspor Excel
  export-word.js          ekspor Word (.docx)
  utils.js                zoom, toast, dialog, escapeHtml
  pwa.js                  daftar service worker, tombol Pasang Aplikasi, pemberitahuan versi baru
vendor/                 SheetJS 0.20.3, Lucide, docx (Word), font Inter & Tinos
build/                  konfigurasi Tailwind, uji otomatis, pembuat paket .deb (make-deb.sh, deb/)
```

## Untuk pengembang

Butuh Node.js hanya bila mengubah kode:

```bash
npm install          # sekali saja
npm run build:css    # WAJIB setelah menambah kelas Tailwind baru di index.html / js/*.js
npm run build:sw     # WAJIB setelah mengubah/menambah berkas apa pun (memperbarui cache offline PWA)
npm run build        # keduanya sekaligus
npm test             # uji otomatis seluruh menu & fitur (Chrome headless, mode offline)
```

`npm test` gagal bila `sw.js` belum diperbarui. Ikon PWA dibuat dari `img/favicon.svg` dengan `npm run build:icons`.

`npm test` memakai Chrome di `/usr/bin/google-chrome`; ubah dengan `CHROME_PATH=/lokasi/chrome npm test`.

Warna antarmuka: pakai kelas `primary-*` (mis. `bg-primary-600`, `text-primary-700`), bukan `blue-*`.
Warna ini otomatis mengikuti mode ASAS (biru), ASAT (hijau), dan ASAJ (ungu); paletnya ada di `css/app.css`.

## Catatan fitur

- **Cetak / PDF** — hasil paling presisi untuk semua dokumen.
- **Word (.docx)** — cocok untuk dokumen teks (SK, POS, Tata Tertib, Berita Acara, Daftar Hadir, Laporan).
  Kartu, denah, dan label tetap bisa diekspor, tetapi posisinya dapat sedikit bergeser.
- **Impor Excel** — membaca .xlsx/.xls/.csv; baris judul di atas tabel dilewati otomatis, setiap baris
  divalidasi, lalu pengguna memilih *Ganti* atau *Tambahkan*.
- **Template Data Lengkap** — menu *Data & Backup → Unduh Template Lengkap* menghasilkan satu .xlsx berisi
  lembar Peserta, Panitia, Korektor, Jadwal_Pengawas, Guru_Piket, dan Susulan (terisi data saat ini). Setelah
  diisi, *Impor Template Lengkap* menampilkan ringkasan per lembar; bagian yang dicentang menggantikan data lama.
  Jumlah ruang mengikuti banyaknya kolom ruang; kolom "Ruang N - Pengawas" saja berarti 1 pengawas per ruang.
  Tab *Jadwal & Pengawas* punya tombol *Unduh Template* yang hanya berisi lembar jadwal, guru piket, dan susulan.
- **Pengawas per ruang (1 atau 2)** — diatur di tab *Jadwal & Pengawas*. Editor, template, jadwal pengawas,
  daftar hadir pengawas, berita acara, denah, POS, dan ekspor Excel mengikuti pengaturan ini. Nama pengawas 2
  tetap tersimpan saat disembunyikan.
- **Gambar** (logo, TTD, cap) otomatis diperkecil sebelum disimpan agar penyimpanan browser (±5 MB) tidak penuh.
- **Backup (.json)** divalidasi saat dimuat; data rusak/berbahaya ditolak dan data lama dipulihkan bila gagal.
