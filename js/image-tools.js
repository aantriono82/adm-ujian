// ============================================================================
// UTILITAS GAMBAR: VALIDASI, KOMPRESI & KONVERSI KE PNG
// ----------------------------------------------------------------------------
// Gambar hasil unggah disimpan sebagai data URL di localStorage (kuota ±5 MB).
// Foto dari kamera HP bisa 3–8 MB, jadi selalu diperkecil dulu sebelum disimpan.
// ============================================================================
const IMAGE_MAX_DIM = { logoKiri: 600, logoKanan: 600, ttdImg: 800, capImg: 600, devPhoto: 400 };
const IMAGE_MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

// ----------------------------------------------------------------------------
// imgUrl(): data URL besar -> blob: URL pendek (di-cache).
// Logo, TTD, cap & foto disimpan sebagai data URL (bisa ratusan KB). Bila data URL itu
// ditulis utuh ke setiap kartu, 600 kartu × 3 gambar = HTML ratusan MB dan render jadi
// lambat. Blob URL membuat browser cukup menyimpan & mendekode satu salinan per gambar.
// Data URL kecil (ikon/placeholder SVG) dibiarkan apa adanya.
// ----------------------------------------------------------------------------
const IMG_URL_MIN_LEN = 4096;
const IMG_URL_CACHE_MAX = 2000;
const imgUrlCache = new Map();

function dataUrlToBlob(dataUrl) {
    const comma = dataUrl.indexOf(',');
    const meta = dataUrl.slice(5, comma);
    const body = dataUrl.slice(comma + 1);
    const mime = meta.split(';')[0] || 'application/octet-stream';
    if (/;base64$/i.test(meta)) {
        const bin = atob(body);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new Blob([bytes], { type: mime });
    }
    return new Blob([decodeURIComponent(body)], { type: mime });
}

function imgUrl(src) {
    if (typeof src !== 'string' || src.length < IMG_URL_MIN_LEN || !src.startsWith('data:')
        || typeof URL === 'undefined' || !URL.createObjectURL) return src;
    let url = imgUrlCache.get(src);
    if (url) return url;
    try {
        url = URL.createObjectURL(dataUrlToBlob(src));
    } catch (err) {
        return src; // data URL tak terbaca: biarkan browser yang menangani
    }
    if (imgUrlCache.size >= IMG_URL_CACHE_MAX) {
        // Gambar lama yang sudah diganti menumpuk: kosongkan (render berikutnya membuat ulang)
        imgUrlCache.forEach(u => URL.revokeObjectURL(u));
        imgUrlCache.clear();
    }
    imgUrlCache.set(src, url);
    return url;
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Berkas tidak dapat dibaca.'));
        reader.readAsDataURL(file);
    });
}

function loadImageElement(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Format gambar tidak dikenali.'));
        img.src = src;
    });
}

// Periksa berkas sebelum diproses; mengembalikan pesan galat atau null bila valid
function validateImageFile(file) {
    if (!file) return 'Tidak ada berkas dipilih.';
    if (!/^image\//.test(file.type)) return 'Berkas harus berupa gambar (PNG, JPG, WebP, atau SVG).';
    if (file.size > IMAGE_MAX_UPLOAD_BYTES) return 'Ukuran gambar terlalu besar (maksimal 15 MB).';
    return null;
}

function canvasHasTransparency(ctx, w, h) {
    const data = ctx.getImageData(0, 0, w, h).data;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) return true;
    }
    return false;
}

// Gambar sebuah <img> ke canvas dengan sisi terpanjang <= maxDim
function drawToCanvas(img, maxDim) {
    const w0 = img.naturalWidth || img.width || maxDim;
    const h0 = img.naturalHeight || img.height || maxDim;
    const scale = Math.min(1, maxDim / Math.max(w0, h0));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w0 * scale));
    canvas.height = Math.max(1, Math.round(h0 * scale));
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { canvas, ctx };
}

// Perkecil gambar unggahan. Transparansi (TTD, cap, logo PNG) dipertahankan sebagai PNG;
// gambar tanpa transparansi disimpan sebagai JPEG yang jauh lebih ringan.
async function compressImageFile(file, maxDim) {
    const original = await readFileAsDataURL(file);
    // SVG kecil dibiarkan apa adanya (tetap tajam saat dicetak)
    if (file.type === 'image/svg+xml' && original.length < 200 * 1024) return original;

    const img = await loadImageElement(original);
    const { canvas, ctx } = drawToCanvas(img, maxDim);
    const out = canvasHasTransparency(ctx, canvas.width, canvas.height)
        ? canvas.toDataURL('image/png')
        : canvas.toDataURL('image/jpeg', 0.88);
    return out.length < original.length ? out : original;
}

// Ubah sumber gambar apa pun (SVG/WebP/data URL) menjadi PNG — dipakai ekspor Word,
// karena MS Word tidak dapat menampilkan SVG maupun WebP dari dokumen HTML.
// widthPx/heightPx = ukuran tampil di layar; digambar 3x lebih rapat agar tetap tajam saat dicetak.
async function rasterizeToPng(src, widthPx, heightPx) {
    const img = await loadImageElement(src);
    const w0 = img.naturalWidth || widthPx || 300;
    const h0 = img.naturalHeight || heightPx || 300;
    const w = widthPx || w0;
    const h = heightPx || Math.round(w * h0 / w0);
    const density = 3;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * density));
    canvas.height = Math.max(1, Math.round(h * density));
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
}
