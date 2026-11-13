// ============================================================================
// 5. STATE APLIKASI UTAMA
// ============================================================================
let appState = {
    assessmentMode: "ASAS", // 'ASAS' | 'ASAT' | 'ASAJ'
    filterByTargetGrades: true,
    kop: {
        pemda: "PEMERINTAH KABUPATEN NUSANTARA",
        dinas: "DINAS PENDIDIKAN DAN KEBUDAYAAN",
        uptd: "UPTD SATUAN PENDIDIKAN",
        sekolah: "SMP NEGERI 1 NUSANTARA",
        nssNpsn: "NSS : 000000000000       AKREDITASI : A       NPSN : 00000000",
        alamatDok: "Alamat : Jl. Pendidikan No. 1 Kec. Contoh Kab. Nusantara Kode Pos 00000",
        kontakDok: "Email : smpn1nusantara@contoh.sch.id  Telp. (0000) 000000",
        alamat: "Alamat : Jl. Pendidikan No. 1 Kec. Contoh Kode Pos 00000",
        kabupaten: "Kabupaten Nusantara",
        wilayah: "Kec. Contoh, Kabupaten Nusantara, Provinsi Contoh",
        motto: "Beriman • Cerdas • Terampil • Berkarakter",
        logoKiri: DEFAULT_LOGO_PEMDA,
        logoKanan: DEFAULT_LOGO_SEKOLAH
    },
    kegiatan: {
        singkatan: "ASAS",
        semester: "Ganjil",
        namaLengkap: "Asesmen Sumatif Akhir Semester (ASAS) Ganjil",
        nama: "KARTU ASESMEN SUMATIF AKHIR SEMESTER (ASAS)",
        tapelAngka: "2026/2027",
        tapel: "TAHUN PELAJARAN 2026/2027",
        tahunAnggaran: "2026",
        rentangUtama: presetRangeText(ASSESSMENT_PRESETS.ASAS.startDate, 6),
        rentangSusulan: presetRangeText(ASSESSMENT_PRESETS.ASAS.makeupStart, 6),
        tanggalMulai: ASSESSMENT_PRESETS.ASAS.startDate,
        tanggalMulaiSusulan: ASSESSMENT_PRESETS.ASAS.makeupStart,
        noSk: ASSESSMENT_PRESETS.ASAS.skNumber,
        tglSk: "6 November 2026",
        noPos: ASSESSMENT_PRESETS.ASAS.posNumber,
        moda: "Berbasis Kertas dan Pensil (KP)",
        showNisn: false
    },
    pengesahan: {
        tempat: "Nusantara",
        tanggal: "26 November 2026",
        jabatan1: "Kepala UPTD Satuan Pendidikan",
        jabatan2: "SMP Negeri 1 Nusantara",
        kepsek: "BUDI SANTOSO, S.Pd., M.Pd.",
        nip: "197501012000031001",
        metode: "upload",
        ttdImg: DEFAULT_TTD_SVG,
        capImg: DEFAULT_CAP_SVG,
        ttdScale: 100,
        capScale: 100
    },
    setting: {
        cardSize: "custom",
        paperSize: "A4",
        theme: "klasik",
        showWatermark: true,
        showFoto: true
    },
    docMode: "kartu",
    roomConfig: {
        filterRuang: "ALL",
        maxPerRoom: 20,
        seatPattern: "snake-h",
        seatCols: 4,
        doorPos: "depan-kanan",
        pengawas1: "PENGAWAS 1",
        pengawas2: "PENGAWAS 2",
        deskSize: "standar",
        baMapel: "",
        baTanggal: "",
        baWaktu: "07.30 – 09.30 WIB (Sesi I)",
        baCatatan: "Pelaksanaan asesmen berjalan dengan tertib, aman, dan lancar."
    },
    rekapConfig: {
        mapel: "Matematika",
        guru: "Hendra Gunawan, S.Pd.",
        nip: "198405172010011007",
        kktp: 75,
        kelasFilter: "ALL",
        lpjTanggal: "14 Desember 2026",
        lpjKehadiran: "98,8"
    },
    committee: JSON.parse(JSON.stringify(INITIAL_COMMITTEE)),
    correctors: JSON.parse(JSON.stringify(INITIAL_CORRECTORS)),
    handoverLjk: JSON.parse(JSON.stringify(INITIAL_HANDOVER_LJK)),
    schedule: JSON.parse(JSON.stringify(INITIAL_SCHEDULE)),
    dailyRoster: JSON.parse(JSON.stringify(INITIAL_DAILY_ROSTER)),
    makeupSchedule: JSON.parse(JSON.stringify(INITIAL_MAKEUP_SCHEDULE)),
    guruPengawas: JSON.parse(JSON.stringify(INITIAL_GURU_PENGAWAS)),
    budget: JSON.parse(JSON.stringify(INITIAL_BUDGET)),
    jumlahRuang: DEFAULT_JUMLAH_RUANG,
    pengawasPerRuang: 2,
    tugasPengawas: DEFAULT_TUGAS_PENGAWAS,
    developerPhoto: safeStorageGet('devPhoto_Pramudito') || DEFAULT_DEV_PHOTO_SVG,
    students: JSON.parse(JSON.stringify(INITIAL_STUDENTS)),
    sidebarHidden: false,
    zoom: 1.0
};

// ============================================================================
// SIMPAN OTOMATIS (localStorage), MIGRASI DATA LAMA & UTILITAS
// ============================================================================
const STORAGE_KEY = 'asesmenSumatifTerpadu_state_v2';
const DEFAULT_STATE_SNAPSHOT = JSON.stringify(appState);
let saveTimer = null;
let storageWarned = false;

// Aman dipanggil walau pustaka ikon gagal dimuat
function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        try { window.lucide.createIcons(); } catch (err) { /* abaikan, ikon hanya hiasan */ }
    }
}

function ensureXLSX() {
    if (typeof XLSX !== 'undefined') return true;
    showToast("Pustaka Excel gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.");
    return false;
}

function padRoom(r) {
    return String(r === undefined || r === null ? '' : r).replace(/^(\d+)/, m => m.padStart(2, '0'));
}

function toTitleCase(str) {
    return String(str || '').toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
}

// Banyak pengawas tiap ruang (1 atau 2). Data tetap disimpan berpasangan [p1, p2]
// agar nama pengawas 2 tidak hilang bila pengaturan diubah bolak-balik.
function getPengawasPerRuang() {
    return appState.pengawasPerRuang === 1 ? 1 : 2;
}

// Tingkat kelas dari teks bebas: "VII", "VII A", "7", "7B", "VIII-2" -> "VII" / "VIII" / "IX"
function gradeOf(kelas) {
    const k = String(kelas || '').toUpperCase().trim();
    const m = k.match(/^(IX|VIII|VII|9|8|7)(?![0-9])/);
    if (!m) return '';
    return { '7': 'VII', '8': 'VIII', '9': 'IX' }[m[1]] || m[1];
}

// Ubah jadwal format lama (r1p1, s2r1p1, waktu1, mapel1, ...) ke format baru { sesi: [...] }
function migrateState(st) {
    if (!st || typeof st !== 'object') return st;
    if (Array.isArray(st.schedule)) {
        st.schedule = st.schedule.map(d => {
            if (Array.isArray(d.sesi)) return d;
            const s1 = [1, 2, 3].map(r => [d[`r${r}p1`] || '', d[`r${r}p2`] || '']);
            const fallback = [2, 3, 1];
            const s2 = [1, 2, 3].map((r, i) => [
                d[`s2r${r}p1`] || d[`r${fallback[i]}p1`] || '',
                d[`s2r${r}p2`] || d[`r${fallback[i]}p2`] || ''
            ]);
            return {
                hari: d.hari || '', tanggal: d.tanggal || '',
                sesi: [
                    { waktu: d.waktu1 || '', mapel: d.mapel1 || '', pengawas: s1 },
                    { waktu: d.waktu2 || '', mapel: d.mapel2 || '', pengawas: s2 }
                ]
            };
        });
    }
    if (!st.jumlahRuang) st.jumlahRuang = DEFAULT_JUMLAH_RUANG;
    if (st.kop) {
        if (st.kop.kabupaten === undefined) st.kop.kabupaten = '';
        if (st.kop.wilayah === undefined) st.kop.wilayah = '';
        if (st.kop.motto === undefined) st.kop.motto = '';
    }
    if (st.kegiatan) {
        const preset = ASSESSMENT_PRESETS[st.assessmentMode] || ASSESSMENT_PRESETS.ASAS;
        if (!st.kegiatan.tanggalMulai) st.kegiatan.tanggalMulai = preset.startDate;
        if (!st.kegiatan.tanggalMulaiSusulan) st.kegiatan.tanggalMulaiSusulan = preset.makeupStart;
    }
    return st;
}

// ----------------------------------------------------------------------------
// VALIDASI DATA DARI BACKUP (.json) / localStorage
// Berkas backup bisa berasal dari orang lain, jadi bentuk datanya diperiksa:
// kunci tak dikenal dibuang, tipe salah diganti bawaan, dan gambar wajib berupa
// data:image/... (mencegah sisipan HTML/skrip lewat atribut src).
// ----------------------------------------------------------------------------
const STATE_OBJECT_KEYS = ['kop', 'kegiatan', 'pengesahan', 'setting', 'roomConfig', 'rekapConfig'];
const STATE_ARRAY_KEYS = ['committee', 'correctors', 'handoverLjk', 'schedule', 'dailyRoster', 'makeupSchedule', 'budget', 'students', 'guruPengawas'];
const STATE_IMAGE_FIELDS = [['kop', 'logoKiri'], ['kop', 'logoKanan'], ['pengesahan', 'ttdImg'], ['pengesahan', 'capImg']];

function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isSafeImageDataUrl(v) {
    return typeof v === 'string' && /^data:image\/(png|jpe?g|gif|webp|svg\+xml)[;,]/i.test(v) && !/["<>]/.test(v);
}

// Hanya nilai primitif (teks/angka/boolean) yang diterima untuk isian bertingkat satu
function sanitizeFlatObject(obj, defaults) {
    const out = {};
    Object.keys(defaults).forEach(k => {
        const v = obj[k];
        if (v === undefined || v === null) return;
        if (['string', 'number', 'boolean'].includes(typeof v)) out[k] = v;
    });
    return out;
}

// Daftar guru pengawas: { nama, nip, jabatan, aktif }, nama unik & tidak kosong
function sanitizeGuruList(list) {
    const seen = new Set();
    return (list || []).map(g => ({
        nama: String(g.nama ?? '').replace(/\s+/g, ' ').trim().slice(0, 300),
        nip: String(g.nip ?? '').trim().slice(0, 60),
        jabatan: String(g.jabatan ?? '').trim().slice(0, 120),
        aktif: g.aktif !== false
    })).filter(g => {
        const k = g.nama.toLowerCase();
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}

// Nama unik dari kotak pengawas jadwal utama & guru piket (urutan kemunculan), NIP/jabatan dari panitia bila ada
function guruListFromSchedule(st) {
    const names = new Map();
    const add = v => {
        const nm = String(v || '').replace(/\s+/g, ' ').trim();
        if (nm && nm !== '-' && !names.has(nm.toLowerCase())) names.set(nm.toLowerCase(), nm);
    };
    const rooms = Math.max(1, parseInt(st.jumlahRuang, 10) || 1);
    (st.schedule || []).forEach(d => (d.sesi || []).forEach(ss => (ss.pengawas || []).slice(0, rooms)
        .forEach(p => (Array.isArray(p) ? p : []).forEach(add))));
    (st.dailyRoster || []).forEach(r => (r.guru || []).forEach(add));
    const committee = new Map((st.committee || []).map(c => [String(c.nama || '').trim().toLowerCase(), c]));
    return [...names.values()].map(nama => {
        const c = committee.get(nama.toLowerCase());
        return { nama, nip: c && c.nip !== '-' ? String(c.nip || '') : '', jabatan: c ? String(c.jabatanDinas || '') : 'Guru', aktif: true };
    });
}

function sanitizeLoadedState(loaded) {
    const warnings = [];
    if (!isPlainObject(loaded)) throw new Error('Isi berkas bukan data aplikasi ini.');
    const defaults = JSON.parse(DEFAULT_STATE_SNAPSHOT);
    const known = Object.keys(defaults);
    if (!known.some(k => k in loaded)) throw new Error('Berkas JSON ini bukan backup Sistem Administrasi Asesmen.');

    const clean = {};
    known.forEach(k => {
        if (!(k in loaded) || k === 'developerPhoto') return;
        const v = loaded[k];
        if (STATE_OBJECT_KEYS.includes(k)) {
            if (isPlainObject(v)) clean[k] = sanitizeFlatObject(v, defaults[k]);
            else warnings.push(`Bagian "${k}" rusak, memakai pengaturan bawaan.`);
        } else if (STATE_ARRAY_KEYS.includes(k)) {
            if (Array.isArray(v)) {
                const items = v.filter(isPlainObject);
                if (items.length !== v.length) warnings.push(`${v.length - items.length} baris tidak valid di "${k}" dilewati.`);
                clean[k] = items;
            } else {
                warnings.push(`Bagian "${k}" rusak, memakai data bawaan.`);
            }
        } else if (typeof v === typeof defaults[k] || defaults[k] === null) {
            clean[k] = v;
        } else if (typeof defaults[k] === 'number' && v !== '' && Number.isFinite(Number(v))) {
            clean[k] = Number(v);
        }
    });

    STATE_IMAGE_FIELDS.forEach(([grp, key]) => {
        if (clean[grp] && key in clean[grp] && !isSafeImageDataUrl(clean[grp][key])) {
            delete clean[grp][key];
            warnings.push(`Gambar "${key}" tidak valid, memakai gambar bawaan.`);
        }
    });

    if (clean.students) {
        clean.students = clean.students
            .filter(st => String(st.nama || '').trim() !== '')
            .map(st => ({
                noUjian: String(st.noUjian ?? ''), nama: String(st.nama ?? ''), lp: String(st.lp ?? 'L'),
                nisn: String(st.nisn ?? ''), kelas: String(st.kelas ?? ''), ruang: String(st.ruang ?? '1'),
                nilai: (st.nilai === '' || st.nilai === undefined || st.nilai === null) ? '' : (Number(st.nilai) || 0)
            }));
    }
    if (clean.assessmentMode && !ASSESSMENT_PRESETS[clean.assessmentMode]) {
        delete clean.assessmentMode;
        warnings.push('Mode asesmen tidak dikenal, memakai ASAS.');
    }
    if (clean.guruPengawas) clean.guruPengawas = sanitizeGuruList(clean.guruPengawas);
    const jr = parseInt(clean.jumlahRuang, 10);
    if ('jumlahRuang' in clean && !(jr >= 1 && jr <= 99)) delete clean.jumlahRuang;
    if ('pengawasPerRuang' in clean && ![1, 2].includes(clean.pengawasPerRuang)) delete clean.pengawasPerRuang;
    return { state: clean, warnings };
}

// Gabungkan data tersimpan ke state bawaan (objek bertingkat digabung per kunci).
// Mengembalikan daftar peringatan validasi; melempar galat bila berkas bukan data aplikasi ini.
function mergeIntoState(raw) {
    const { state: loaded, warnings } = sanitizeLoadedState(raw);
    const fresh = JSON.parse(DEFAULT_STATE_SNAPSHOT);
    const merged = Object.assign(fresh, loaded);
    STATE_OBJECT_KEYS.forEach(key => {
        merged[key] = Object.assign({}, JSON.parse(DEFAULT_STATE_SNAPSHOT)[key], loaded[key] || {});
    });
    merged.developerPhoto = appState.developerPhoto;
    merged.sidebarHidden = false;
    merged.zoom = 1.0;
    // Backup lama belum punya Daftar Guru Pengawas: bentuk dari nama yang sudah ada di jadwal & piket
    if (!Array.isArray(loaded.guruPengawas)) merged.guruPengawas = guruListFromSchedule(merged);
    appState = migrateState(merged);
    return warnings;
}

function saveStateNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    try {
        const toSave = Object.assign({}, appState);
        delete toSave.developerPhoto;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        const el = document.getElementById('autosave-status');
        if (el) {
            const t = new Date();
            (el.querySelector('.nav-label') || el).textContent = `Tersimpan ${String(t.getHours()).padStart(2, '0')}.${String(t.getMinutes()).padStart(2, '0')}`;
            el.classList.remove('autosave-err', 'autosave-flash');
            el.classList.add('autosave-ok');
            void el.offsetWidth; // mulai ulang animasi titik hijau
            el.classList.add('autosave-flash');
        }
    } catch (err) {
        const el = document.getElementById('autosave-status');
        if (el) {
            (el.querySelector('.nav-label') || el).textContent = 'Gagal simpan otomatis — gunakan Backup';
            el.classList.remove('autosave-ok', 'autosave-flash');
            el.classList.add('autosave-err');
        }
        if (!storageWarned) {
            storageWarned = true;
            showToast("Penyimpanan browser penuh (gambar terlalu besar?). Gunakan tombol Backup (.json).");
        }
    }
}

function saveStateSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveTimer = null; saveStateNow(); }, 600);
}

// Akses localStorage yang aman: sebagian browser (mode privat / cookie diblokir)
// melempar galat saat localStorage diakses, dan itu tidak boleh menghentikan aplikasi.
function safeStorageGet(key) {
    try { return window.localStorage.getItem(key); } catch (err) { return null; }
}

// Aplikasi terbuka di lebih dari satu tab/jendela: simpan otomatis tiap tab akan saling menimpa.
// Beri tahu pengguna (sekali) begitu tab lain menyimpan data.
let otherTabWarned = false;
window.addEventListener('storage', e => {
    if (e.key !== STORAGE_KEY || otherTabWarned) return;
    otherTabWarned = true;
    showToast('Aplikasi ini juga terbuka di tab/jendela lain. Gunakan satu tab saja agar data tidak saling menimpa — tutup tab lain lalu muat ulang halaman ini.', 9000);
});

function loadSavedState() {
    try {
        const raw = safeStorageGet(STORAGE_KEY);
        if (!raw) return false;
        mergeIntoState(JSON.parse(raw));
        return true;
    } catch (err) {
        return false;
    }
}

function resetAllData() {
    if (!confirm("Hapus semua data yang tersimpan di browser ini dan kembali ke data contoh?\n\nTips: simpan dulu lewat tombol Backup (.json) bila masih diperlukan.")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (err) {}
    clearAllStudentPhotos();
    const photo = appState.developerPhoto;
    appState = JSON.parse(DEFAULT_STATE_SNAPSHOT);
    appState.developerPhoto = photo;
    initApp();
    showToast("Data dikembalikan ke contoh bawaan.");
}

// Tutup / tampilkan panel pengaturan (pratinjau jadi lebih lebar).
// Di layar, panel diatur bersama menu lewat satu tombol: toggleWorkspaceCompact() (ui.js).
function toggleSidebar(force) {
    appState.sidebarHidden = typeof force === 'boolean' ? force : !appState.sidebarHidden;
    const panel = document.getElementById('left-sidebar');
    if (panel) panel.classList.toggle('panel-hidden', appState.sidebarHidden);
    if (typeof updateWorkspaceCompactButton === 'function') updateWorkspaceCompactButton();
    if (typeof refreshZoom === 'function') refreshZoom();
}
