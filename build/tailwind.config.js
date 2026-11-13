// Konfigurasi Tailwind untuk membangun css/tailwind.css (dipakai offline).
// Jalankan ulang `npm run build:css` setiap kali menambah kelas Tailwind baru di index.html / js/*.js.
const path = require('path');
const root = path.join(__dirname, '..');
module.exports = {
  content: [path.join(root, 'index.html'), path.join(root, 'js/**/*.js')],
  // Kelas yang dirangkai dinamis di js/ui.js (warna tombol "Rotasi Otomatis" per sesi)
  safelist: [{ pattern: /^(bg|text|border)-(blue|emerald|amber|purple)-(50|100|200|700)$/, variants: ['hover'] }],
  theme: { extend: {} },
  plugins: [],
};
