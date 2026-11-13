// Service worker: menyimpan seluruh berkas aplikasi agar bisa dibuka & dipasang tanpa internet.
// JANGAN edit CACHE_VERSION / PRECACHE manual — jalankan `npm run build:sw` setelah mengubah berkas apa pun.
const CACHE_VERSION = '7107cac775f5';
const PRECACHE = [
    './',
    './index.html',
    './manifest.webmanifest',
    './css/app.css',
    './css/tailwind.css',
    './img/apple-touch-icon.png',
    './img/favicon-32.png',
    './img/favicon.svg',
    './img/icon-192.png',
    './img/icon-512.png',
    './img/icon-maskable-512.png',
    './js/assets.js',
    './js/config.js',
    './js/data-io.js',
    './js/data-template.js',
    './js/export-word.js',
    './js/export.js',
    './js/guru-pengawas.js',
    './js/image-tools.js',
    './js/layout.js',
    './js/pwa.js',
    './js/render-administrasi.js',
    './js/render-main.js',
    './js/render-peserta.js',
    './js/render-sk-pos.js',
    './js/settings.js',
    './js/state.js',
    './js/student-photos.js',
    './js/ui.js',
    './js/utils.js',
    './vendor/docx/html.iife.js',
    './vendor/docx/index.iife.js',
    './vendor/docx/math.iife.js',
    './vendor/fonts/fonts.css',
    './vendor/fonts/inter-latin-400-normal.woff2',
    './vendor/fonts/inter-latin-500-normal.woff2',
    './vendor/fonts/inter-latin-600-normal.woff2',
    './vendor/fonts/inter-latin-700-normal.woff2',
    './vendor/fonts/inter-latin-800-normal.woff2',
    './vendor/fonts/tinos-latin-400-italic.woff2',
    './vendor/fonts/tinos-latin-400-normal.woff2',
    './vendor/fonts/tinos-latin-700-normal.woff2',
    './vendor/lucide.min.js',
    './vendor/xlsx.full.min.js'
];

const CACHE_NAME = 'asesmen-sumatif-' + CACHE_VERSION;

// Hosting seperti Cloudflare mengalihkan /index.html -> / (307). Respons hasil pengalihan
// (redirected = true) DITOLAK browser bila dipakai untuk membuka halaman, jadi simpan salinan bersih.
async function cleanResponse(res) {
    if (!res || !res.redirected) return res;
    return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers });
}

async function precache() {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(PRECACHE.map(async url => {
        const res = await fetch(new Request(url, { cache: 'reload' }));
        if (!res.ok) throw new Error(`Gagal menyimpan ${url} (${res.status})`);
        await cache.put(url, await cleanResponse(res));
    }));
}

self.addEventListener('install', event => {
    event.waitUntil(precache());
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys
                .filter(k => k.startsWith('asesmen-sumatif-') && k !== CACHE_NAME)
                .map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// Dikirim halaman saat pengguna menekan "Muat ulang" pada pemberitahuan versi baru.
self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

    // Halaman: selalu layani index.html dari cache (cepat & tetap jalan tanpa internet).
    if (req.mode === 'navigate') {
        event.respondWith(
            caches.match('./', { cacheName: CACHE_NAME })
                .then(res => res || caches.match('./index.html', { cacheName: CACHE_NAME }))
                .then(cleanResponse)
                .then(res => res || fetch(req))
        );
        return;
    }

    // Berkas lain: cache dulu, bila tidak ada ambil dari jaringan lalu simpan.
    event.respondWith(
        caches.match(req, { cacheName: CACHE_NAME, ignoreSearch: true }).then(cached => {
            if (cached) return cached;
            return fetch(req).then(res => {
                if (res.ok && res.type === 'basic') {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
                }
                return res;
            });
        })
    );
});
