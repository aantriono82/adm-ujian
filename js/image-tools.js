// ============================================================================
// UTILITAS GAMBAR: VALIDASI, KOMPRESI & KONVERSI KE PNG
// ----------------------------------------------------------------------------
// Gambar hasil unggah disimpan sebagai data URL di localStorage (kuota ±5 MB).
// Foto dari kamera HP bisa 3–8 MB, jadi selalu diperkecil dulu sebelum disimpan.
// ============================================================================
const IMAGE_MAX_DIM = { logoKiri: 600, logoKanan: 600, ttdImg: 800, capImg: 600, devPhoto: 400 };
const IMAGE_MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

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
