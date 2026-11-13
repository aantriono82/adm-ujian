// ============================================================================
// FOTO PESERTA (PAS FOTO 2×3 DI KARTU UJIAN)
// ----------------------------------------------------------------------------
// Foto disimpan di IndexedDB, bukan localStorage: ratusan foto tidak muat di
// kuota localStorage (±5 MB). Foto dikaitkan ke peserta lewat NISN (atau Nomor
// Ujian bila NISN kosong), sehingga tetap tersambung walau data peserta diimpor
// ulang dari Excel. Semua foto dimuat ke memori saat aplikasi dibuka.
// ============================================================================
const PHOTO_DB_NAME = 'asesmenSumatifTerpadu_photos';
const PHOTO_STORE = 'photos';
// Ukuran kotak foto di kartu (cm, pada skala kartu 1.0). Foto unggahan dipotong
// dengan rasio yang sama persis sehingga selalu mengisi penuh kotak tanpa celah.
const CARD_PHOTO_W_CM = 1.1 * 2 / 3; // ±0,73 cm
const CARD_PHOTO_H_CM = 1.1;
const PHOTO_RATIO = CARD_PHOTO_W_CM / CARD_PHOTO_H_CM; // 2:3
const PHOTO_W = 300;   // piksel hasil kompresi
const PHOTO_H = Math.round(PHOTO_W / PHOTO_RATIO);

// Placeholder bila foto belum ada: siluet orang abu-abu dengan latar terang
const PHOTO_PLACEHOLDER_SVG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 45">'
    + '<rect width="30" height="45" fill="#e2e8f0"/>'
    + '<circle cx="15" cy="17" r="6.4" fill="#94a3b8"/>'
    + '<path d="M2.5 45 C2.5 33 8.5 27 15 27 C21.5 27 27.5 33 27.5 45 Z" fill="#94a3b8"/>'
    + '<text x="15" y="6" font-family="Arial, sans-serif" font-size="3.8" font-weight="700" fill="#64748b" text-anchor="middle">FOTO 2×3</text>'
    + '</svg>'
);
const studentPhotoCache = new Map();
let photoDbPromise = null;

function openPhotoDb() {
    if (photoDbPromise) return photoDbPromise;
    photoDbPromise = new Promise((resolve, reject) => {
        if (!window.indexedDB) { reject(new Error('IndexedDB tidak tersedia')); return; }
        const req = indexedDB.open(PHOTO_DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(PHOTO_STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    }).catch(err => { photoDbPromise = null; throw err; });
    return photoDbPromise;
}

async function photoDbRun(mode, fn) {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(PHOTO_STORE, mode);
        const result = fn(tx.objectStore(PHOTO_STORE));
        tx.oncomplete = () => resolve(result && 'result' in result ? result.result : undefined);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Transaksi dibatalkan'));
    });
}

// Kunci foto: NISN bila ada, selain itu Nomor Ujian
function studentPhotoKey(st) {
    const nisn = String(st.nisn || '').trim();
    if (nisn && nisn !== '-') return 'nisn:' + nisn;
    const no = String(st.noUjian || '').trim();
    return no ? 'no:' + no : '';
}

function getStudentPhoto(st) {
    const key = studentPhotoKey(st);
    return key ? studentPhotoCache.get(key) || '' : '';
}

async function initStudentPhotos() {
    try {
        const entries = await photoDbRun('readonly', store => {
            const out = [];
            store.openCursor().onsuccess = e => {
                const cur = e.target.result;
                if (!cur) return;
                if (isSafeImageDataUrl(cur.value)) out.push([cur.key, cur.value]);
                cur.continue();
            };
            return { get result() { return out; } };
        });
        entries.forEach(([k, v]) => studentPhotoCache.set(k, v));
    } catch (err) {
        console.warn('Foto peserta tidak dapat dimuat:', err);
    }
    if (studentPhotoCache.size) {
        renderStudentTable();
        renderAll();
    }
}

async function putStudentPhotos(pairs) {
    pairs.forEach(([k, v]) => studentPhotoCache.set(k, v));
    try {
        await photoDbRun('readwrite', store => pairs.forEach(([k, v]) => store.put(v, k)));
        return true;
    } catch (err) {
        showToast('Foto tampil, tetapi gagal disimpan di browser (penyimpanan penuh/diblokir).');
        return false;
    }
}

async function removeStudentPhoto(key) {
    studentPhotoCache.delete(key);
    try { await photoDbRun('readwrite', store => store.delete(key)); } catch (err) {}
}

async function clearAllStudentPhotos() {
    studentPhotoCache.clear();
    try { await photoDbRun('readwrite', store => store.clear()); } catch (err) {}
}

// Potong ke tengah dengan rasio kotak foto (2:3) lalu ubah ke tepat 300×450 JPEG
async function compressStudentPhoto(file) {
    const img = await loadImageElement(await readFileAsDataURL(file));
    const w0 = img.naturalWidth, h0 = img.naturalHeight;
    let sw = w0, sh = h0, sx = 0, sy = 0;
    if (w0 / h0 > PHOTO_RATIO) { sw = h0 * PHOTO_RATIO; sx = (w0 - sw) / 2; }
    else { sh = w0 / PHOTO_RATIO; sy = (h0 - sh) / 4; } // potret: sisakan lebih banyak bagian atas (kepala)
    // Kanvas selalu tepat PHOTO_W × PHOTO_H (rasio kotak foto di kartu)
    const canvas = document.createElement('canvas');
    canvas.width = PHOTO_W;
    canvas.height = PHOTO_H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
}

function normalizePhotoName(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Cocokkan nama berkas (tanpa ekstensi) dengan NISN, Nomor Ujian, atau Nama peserta
function findStudentForPhotoFile(fileName) {
    const base = normalizePhotoName(fileName.replace(/\.[^.]+$/, ''));
    if (!base) return null;
    const fields = ['nisn', 'noUjian', 'nama'];
    for (const f of fields) {
        const hit = appState.students.find(st => normalizePhotoName(st[f]) === base);
        if (hit) return hit;
    }
    return null;
}

async function handleBulkPhotoUpload(event) {
    const input = event.target;
    const files = [...(input.files || [])];
    input.value = '';
    if (!files.length) return;

    const pairs = [], unmatched = [], failed = [];
    for (const file of files) {
        const err = validateImageFile(file);
        if (err) { failed.push(file.name); continue; }
        const st = findStudentForPhotoFile(file.name);
        const key = st && studentPhotoKey(st);
        if (!key) { unmatched.push(file.name); continue; }
        try { pairs.push([key, await compressStudentPhoto(file)]); }
        catch (e) { failed.push(file.name); }
    }
    if (pairs.length) await putStudentPhotos(pairs);
    renderStudentTable();
    renderAll();

    if (!unmatched.length && !failed.length) {
        showToast(`${pairs.length} foto peserta berhasil dipasang.`);
        return;
    }
    const list = (title, arr) => arr.length
        ? `<p class="font-bold mt-3 mb-1">${title} (${arr.length}):</p><ul class="list-disc pl-5">${arr.slice(0, 50).map(n => `<li>${escapeHtml(n)}</li>`).join('')}${arr.length > 50 ? `<li>… dan ${arr.length - 50} lainnya</li>` : ''}</ul>`
        : '';
    showChoiceDialog({
        title: `${pairs.length} dari ${files.length} foto berhasil dipasang`,
        html: `<p>Nama berkas foto harus sama dengan <strong>NISN</strong>, <strong>Nomor Ujian</strong>, atau <strong>Nama</strong> peserta (mis. <code>0102030405.jpg</code>).</p>`
            + list('Tidak cocok dengan peserta mana pun', unmatched)
            + list('Bukan gambar / gagal dibaca', failed),
        buttons: [{ label: 'Tutup', value: null, primary: true }]
    });
}

// Foto per peserta dari tabel data peserta
async function pickStudentPhoto(idx) {
    const st = appState.students[idx];
    if (!st) return;
    const key = studentPhotoKey(st);
    if (!key) { showToast('Isi NISN atau Nomor Ujian peserta dulu sebelum memasang foto.'); return; }
    if (studentPhotoCache.has(key)) {
        const choice = await showChoiceDialog({
            title: `Foto ${st.nama}`,
            html: `<div class="flex justify-center"><img src="${studentPhotoCache.get(key)}" style="width: 90px; height: 120px; object-fit: cover; border: 1px solid #cbd5e1;"></div>`,
            buttons: [{ label: 'Ganti Foto', value: 'ganti', primary: true }, { label: 'Hapus Foto', value: 'hapus' }, { label: 'Batal', value: null }]
        });
        if (!choice) return;
        if (choice === 'hapus') {
            await removeStudentPhoto(key);
            renderStudentTable();
            renderAll();
            showToast('Foto peserta dihapus.');
            return;
        }
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
        const file = input.files[0];
        const err = validateImageFile(file);
        if (err) { showToast(err); return; }
        try {
            await putStudentPhotos([[key, await compressStudentPhoto(file)]]);
            renderStudentTable();
            renderAll();
            showToast('Foto peserta dipasang.');
        } catch (e) {
            showToast('Foto tidak dapat dibaca.');
        }
    };
    input.click();
}

// Foto untuk berkas backup: hanya milik peserta yang ada di data saat ini
function collectStudentPhotosForBackup() {
    const out = {};
    appState.students.forEach(st => {
        const key = studentPhotoKey(st);
        if (key && studentPhotoCache.has(key)) out[key] = studentPhotoCache.get(key);
    });
    return out;
}

async function restoreStudentPhotosFromBackup(photos) {
    if (!isPlainObject(photos)) return 0;
    const pairs = Object.entries(photos)
        .filter(([k, v]) => /^(nisn|no):.{1,80}$/.test(k) && isSafeImageDataUrl(v));
    if (pairs.length) await putStudentPhotos(pairs);
    return pairs.length;
}
