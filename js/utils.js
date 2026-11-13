// ============================================================================
// 24. UTILITAS ZOOM, MODAL PENGEMBANG & ESCAPE HTML
// ============================================================================
function updateDeveloperPhotoUI() {
    const photoSrc = appState.developerPhoto || DEFAULT_DEV_PHOTO_SVG;
    ['nav-dev-photo', 'sidebar-dev-photo', 'modal-dev-photo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.src = photoSrc;
    });
}

function toggleDeveloperModal(show) {
    const modal = document.getElementById('developer-modal');
    if (!modal) return;
    modal.classList.toggle('hidden', !show);
    modal.classList.toggle('flex', show);
}

async function handleDevPhotoUpload(event) {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) { showToast(problem); input.value = ''; return; }
    try {
        const dataUrl = await compressImageFile(file, IMAGE_MAX_DIM.devPhoto);
        appState.developerPhoto = dataUrl;
        try { localStorage.setItem('devPhoto_Pramudito', dataUrl); } catch (err) {}
        updateDeveloperPhotoUI();
        showToast("Foto profil pengembang diperbarui!");
    } catch (err) {
        showToast(err.message || 'Gambar gagal diproses.');
    } finally {
        input.value = '';
    }
}

// Zoom memakai properti CSS `zoom` (bukan transform) supaya area gulir ikut membesar/mengecil
// dan sisi kiri lembar tidak terpotong saat dokumen lebih lebar dari layar.
// zoomFitMode: 'width' = pas lebar (bawaan), 'page' = satu halaman utuh terlihat, null = manual
let zoomFitMode = 'width';
const ZOOM_MIN = 0.25, ZOOM_MAX = 2;

function setZoom(value) {
    appState.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +value.toFixed(2)));
    applyZoom();
}

function adjustZoom(delta) {
    zoomFitMode = null;
    setZoom(appState.zoom + delta);
}

function resetZoom() {
    zoomFitMode = null;
    setZoom(1);
}

// Ukuran asli (zoom 100%) isi pratinjau dan ruang yang tersedia
function measurePreview() {
    const wrapper = document.getElementById('preview-wrapper');
    const container = document.getElementById('sheets-container');
    if (!wrapper || !container || !wrapper.clientWidth) return null;
    const prev = container.style.zoom;
    container.style.zoom = '1';
    const firstSheet = container.querySelector('.print-sheet');
    const m = {
        width: container.scrollWidth,
        sheetHeight: firstSheet ? firstSheet.offsetHeight : container.scrollHeight
    };
    container.style.zoom = prev;
    const cs = getComputedStyle(wrapper);
    m.availW = wrapper.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    m.availH = wrapper.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    return m.width > 0 ? m : null;
}

function fitZoom() {
    zoomFitMode = 'width';
    const m = measurePreview();
    if (m) setZoom(Math.floor(Math.min(1, m.availW / m.width) * 100) / 100);
    else applyZoom();
}

function fitPageZoom() {
    zoomFitMode = 'page';
    const m = measurePreview();
    if (m) setZoom(Math.floor(Math.min(1, m.availW / m.width, m.availH / m.sheetHeight) * 100) / 100);
    else applyZoom();
}

function applyZoom() {
    const container = document.getElementById('sheets-container');
    container.style.zoom = appState.zoom;
    document.getElementById('zoom-label').textContent = Math.round(appState.zoom * 100) + '%';
    const fitBtn = document.getElementById('zoom-fit-btn');
    if (fitBtn) fitBtn.classList.toggle('is-active', zoomFitMode === 'width');
    const pageBtn = document.getElementById('zoom-page-btn');
    if (pageBtn) pageBtn.classList.toggle('is-active', zoomFitMode === 'page');
    updatePageIndicator();
}

// Dipanggil setelah dokumen dirender / ukuran jendela berubah
function refreshZoom() {
    if (zoomFitMode === 'width') fitZoom();
    else if (zoomFitMode === 'page') fitPageZoom();
    else applyZoom();
}

// ---------- Penunjuk halaman "Hal X / N" ----------
function getSheets() {
    return [...document.querySelectorAll('#sheets-container .print-sheet')];
}

function currentSheetIndex() {
    const wrapper = document.getElementById('preview-wrapper');
    const sheets = getSheets();
    if (!wrapper || !sheets.length) return -1;
    const line = wrapper.getBoundingClientRect().top + wrapper.clientHeight * 0.35;
    let idx = 0;
    sheets.forEach((sh, i) => { if (sh.getBoundingClientRect().top <= line) idx = i; });
    return idx;
}

function updatePageIndicator() {
    const el = document.getElementById('page-indicator');
    if (!el) return;
    const total = getSheets().length;
    el.textContent = total ? `${currentSheetIndex() + 1} / ${total}` : '–';
}

function gotoSheet(delta) {
    const wrapper = document.getElementById('preview-wrapper');
    const sheets = getSheets();
    if (!wrapper || !sheets.length) return;
    const target = sheets[Math.min(sheets.length - 1, Math.max(0, currentSheetIndex() + delta))];
    const offset = target.getBoundingClientRect().top - wrapper.getBoundingClientRect().top;
    wrapper.scrollTo({ top: wrapper.scrollTop + offset - 32, behavior: 'smooth' });
}

function initPreviewInteractions() {
    const wrapper = document.getElementById('preview-wrapper');
    if (!wrapper) return;
    let ticking = false;
    wrapper.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { ticking = false; updatePageIndicator(); });
    }, { passive: true });
    // Ctrl/⌘ + roda tetikus = perbesar/perkecil pratinjau (bukan seluruh halaman browser)
    wrapper.addEventListener('wheel', e => {
        if (!(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        adjustZoom(e.deltaY < 0 ? 0.1 : -0.1);
    }, { passive: false });
}

// ---------- Baris kosong yang ramah untuk tabel editor ----------
function emptyRowHTML(colspan, icon, title, hint, actionsHTML) {
    return `<tr><td colspan="${colspan}" class="p-0">
        <div class="empty-state-row">
            <span class="empty-icon"><i data-lucide="${icon}" class="w-5 h-5"></i></span>
            <div class="text-xs font-semibold text-slate-700">${title}</div>
            <div class="text-[11px] text-slate-500 max-w-[260px]">${hint}</div>
            ${actionsHTML ? `<div class="flex flex-wrap justify-center gap-1.5 mt-1">${actionsHTML}</div>` : ''}
        </div>
    </td></tr>`;
}

// ---------- Indikator "Menyiapkan dokumen…" untuk render yang lambat ----------
// Lapisan baru terlihat setelah ±150 ms (lihat .preview-loading di app.css),
// jadi dokumen yang cepat dirender tidak berkedip.
function withPreviewLoading(fn) {
    const el = document.getElementById('preview-loading');
    if (!el) { fn(); return; }
    el.classList.add('is-on');
    requestAnimationFrame(() => setTimeout(() => {
        try { fn(); } finally { el.classList.remove('is-on'); }
    }, 0));
}

// ---------- Tanda kelengkapan di setiap tab pengaturan ----------
function getTabStatus() {
    const filled = v => String(v ?? '').trim() !== '';
    const missing = (pairs) => pairs.filter(([v]) => !filled(v)).map(([, label]) => label);
    // Hitung baris tabel yang punya kolom kosong -> "3 baris panitia belum lengkap"
    const countRows = (rows, keys) => (rows || []).filter(r => keys.some(k => !filled(r && r[k]))).length;
    const status = {};
    const put = (tab, problems) => { status[tab] = problems; };
    const { kegiatan: kg, kop, pengesahan: ps, roomConfig: rc, rekapConfig: rk } = appState;

    put('mode', missing([[kg.singkatan, 'singkatan'], [kg.semester, 'semester'], [kg.namaLengkap, 'nama asesmen'],
        [kg.nama, 'judul kartu'], [kg.tapelAngka, 'tahun pelajaran'], [kg.tahunAnggaran, 'tahun anggaran'],
        [kg.rentangUtama, 'rentang tanggal utama'], [kg.rentangSusulan, 'rentang susulan'],
        [kg.noSk, 'nomor SK'], [kg.tglSk, 'tanggal SK'], [kg.noPos, 'nomor POS'], [kg.moda, 'moda pelaksanaan']]));

    const kopProblems = missing([[kop.logoKiri, 'logo kiri'], [kop.logoKanan, 'logo kanan'],
        [kop.pemda, 'pemda'], [kop.dinas, 'dinas'], [kop.uptd, 'UPTD'], [kop.sekolah, 'nama sekolah'],
        [kop.nssNpsn, 'NSS/NPSN'], [kop.alamatDok, 'alamat dokumen'], [kop.kontakDok, 'kontak sekolah'],
        [kop.alamat, 'alamat kartu'], [kop.kabupaten, 'kabupaten/kota'], [kop.motto, 'motto'], [kop.wilayah, 'wilayah'],
        [ps.tempat, 'tempat pengesahan'], [ps.tanggal, 'tanggal pengesahan'], [ps.jabatan1, 'jabatan baris 1'],
        [ps.jabatan2, 'jabatan baris 2'], [ps.kepsek, 'nama kepala sekolah'], [ps.nip, 'NIP kepala sekolah']]);
    if (ps.metode === 'upload') {
        if (!filled(ps.ttdImg)) kopProblems.push('gambar tanda tangan');
        if (!filled(ps.capImg)) kopProblems.push('gambar stempel');
    }
    put('kop', kopProblems);

    const panitia = [];
    if (!appState.committee.length) panitia.push('belum ada anggota panitia');
    else {
        const n = countRows(appState.committee, ['nama', 'jabatanDinas', 'jabatanPanitia']);
        if (n) panitia.push(`${n} baris panitia belum lengkap`);
    }
    if (!(appState.correctors || []).length) panitia.push('belum ada data korektor');
    else {
        const grades = ((ASSESSMENT_PRESETS[appState.assessmentMode] || ASSESSMENT_PRESETS.ASAS).targetGrades || ['VII', 'VIII', 'IX'])
            .map(g => ({ VII: 'k7', VIII: 'k8', IX: 'k9' })[g]).filter(Boolean);
        const n = countRows(appState.correctors, ['mapel', 'bentuk', 'waktu', ...grades]);
        if (n) panitia.push(`${n} baris korektor belum lengkap`);
    }
    put('panitia', panitia);

    const jadwal = [];
    const rooms = Math.max(1, parseInt(appState.jumlahRuang, 10) || 1);
    const perRuang = getPengawasPerRuang();
    let emptyDay = 0, emptyWaktu = 0, emptyMapel = 0, emptyProctor = 0;
    (appState.schedule || []).forEach(d => {
        if (!filled(d.hari) || !filled(d.tanggal)) emptyDay++;
        (d.sesi || []).forEach(se => {
            if (!filled(se.waktu)) emptyWaktu++;
            if (!filled(se.mapel)) emptyMapel++;
            for (let r = 0; r < rooms; r++) {
                const pair = (se.pengawas || [])[r] || [];
                for (let p = 0; p < perRuang; p++) if (!filled(pair[p])) emptyProctor++;
            }
        });
    });
    if (!(appState.schedule || []).length) jadwal.push('jadwal kosong');
    if (!filled(kg.tanggalMulai)) jadwal.push('tanggal mulai ujian');
    if (emptyDay) jadwal.push(`${emptyDay} hari tanpa hari/tanggal`);
    if (emptyWaktu) jadwal.push(`${emptyWaktu} sesi tanpa waktu`);
    if (emptyMapel) jadwal.push(`${emptyMapel} sesi tanpa mapel`);
    if (emptyProctor) jadwal.push(`${emptyProctor} slot pengawas kosong`);
    if (typeof getProctorCapacity === 'function' && (appState.guruPengawas || []).length) {
        const cap = getProctorCapacity();
        if (cap.kurang) jadwal.push(`guru pengawas kurang ${cap.kurang} orang per sesi`);
    }
    const noPiket = (appState.schedule || []).filter((d, i) =>
        !(((appState.dailyRoster || [])[i] || {}).guru || []).some(filled)).length;
    if (noPiket) jadwal.push(`${noPiket} hari tanpa guru piket`);
    const makeup = countRows(appState.makeupSchedule, ['hariTanggal', 'waktu', 'mapel', 'ruang', 'pengawas']);
    if (makeup) jadwal.push(`${makeup} baris jadwal susulan belum lengkap`);
    put('jadwal', jadwal);

    const active = getActiveStudents();
    const peserta = [];
    if (!appState.students.length) peserta.push('belum ada peserta');
    else if (!active.length) peserta.push('tidak ada peserta untuk mode ini');
    const keys = ['noUjian', 'nama', 'lp', 'kelas', 'ruang'].concat(kg.showNisn ? ['nisn'] : []);
    const incomplete = countRows(appState.students, keys);
    if (incomplete) peserta.push(`${incomplete} peserta datanya belum lengkap`);
    put('peserta', peserta);

    const ruang = [];
    if (!((parseInt(rc.maxPerRoom, 10) || 0) > 0)) ruang.push('maks. peserta per ruang');
    ruang.push(...missing([[rc.pengawas1, 'label meja pengawas 1'], [rc.baWaktu, 'waktu berita acara'],
        [rc.baCatatan, 'catatan berita acara']]));
    if (perRuang === 2 && !filled(rc.pengawas2)) ruang.push('label meja pengawas 2');
    put('ruang', ruang);

    const lap = missing([[rk.mapel, 'mapel rekap'], [rk.guru, 'guru pengampu'], [rk.nip, 'NIP guru'],
        [rk.kktp, 'KKTP'], [rk.lpjTanggal, 'tanggal pengesahan LPJ'], [rk.lpjKehadiran, '% kehadiran']]);
    if (!appState.budget.length) lap.push('anggaran kosong');
    else {
        const n = countRows(appState.budget, ['uraian', 'volume', 'qty', 'harga']);
        if (n) lap.push(`${n} baris anggaran belum lengkap`);
    }
    put('laporan', lap);
    return status;
}

function updateTabBadges() {
    let status;
    try { status = getTabStatus(); } catch (err) { return; }
    Object.entries(status).forEach(([tab, problems]) => {
        const btn = document.getElementById('tab-btn-' + tab);
        if (!btn) return;
        let badge = btn.querySelector('.tab-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'tab-badge';
            btn.appendChild(badge);
        }
        const ok = problems.length === 0;
        badge.classList.toggle('is-ok', ok);
        badge.classList.toggle('is-warn', !ok);
        badge.textContent = ok ? '✓' : '!';
        const name = btn.textContent.replace(/[✓!]/g, '').trim();
        btn.title = ok ? `${name}: lengkap` : `${name}: perlu dilengkapi — ${problems.join(', ')}`;
    });
}

// ---------- Tema terang / gelap (hanya antarmuka; dokumen tetap putih) ----------
function toggleTheme() {
    const dark = document.documentElement.classList.toggle('dark');
    try { localStorage.setItem('asesmen-theme', dark ? 'dark' : 'light'); } catch (err) {}
}

// ---------- Menu tarik-turun di header ----------
function toggleMenu(id, ev) {
    if (ev) ev.stopPropagation();
    const menu = document.getElementById(id);
    const willOpen = menu.classList.contains('hidden');
    closeMenus();
    if (willOpen) menu.classList.remove('hidden');
}

function closeMenus() {
    document.querySelectorAll('.menu-panel').forEach(m => m.classList.add('hidden'));
}

document.addEventListener('click', e => { if (!e.target.closest('[data-menu]')) closeMenus(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenus(); toggleNavDrawer(false); } });

// ---------- Layar kecil: Pengaturan / Pratinjau ----------
function setMobileView(view) {
    document.body.dataset.mview = view;
    ['settings', 'preview'].forEach(v => {
        const b = document.getElementById('mview-' + v);
        if (b) b.classList.toggle('is-active', v === view);
    });
    if (view === 'preview') requestAnimationFrame(refreshZoom);
}

// ---------- Petunjuk di tab Mode yang bisa ditutup ----------
const INTRO_TIP_KEY = 'asesmen-intro-tip-hidden';
function dismissIntroTip() {
    const el = document.getElementById('intro-tip');
    if (el) el.classList.add('hidden');
    try { localStorage.setItem(INTRO_TIP_KEY, '1'); } catch (err) {}
}
function applyIntroTipState() {
    let hidden = false;
    try { hidden = localStorage.getItem(INTRO_TIP_KEY) === '1'; } catch (err) {}
    const el = document.getElementById('intro-tip');
    if (el && hidden) el.classList.add('hidden');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    toast.classList.remove('opacity-0');
    setTimeout(() => toast.classList.add('opacity-0'), 2800);
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

window.onload = function () {
    const restored = loadSavedState();
    initApp();
    switchTab('mode');
    initNavCollapsed();
    applyIntroTipState();
    initPreviewInteractions();
    setMobileView('settings');
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { if (zoomFitMode) refreshZoom(); }, 120);
    });
    if (restored) showToast("Data terakhir dipulihkan dari penyimpanan browser.");
};

// Dialog pilihan sederhana (pengganti confirm() yang hanya punya 2 tombol).
// buttons: [{ label, value, primary }] — mengembalikan Promise berisi value tombol yang diklik.
function showChoiceDialog({ title, html, buttons }) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 text-sm text-slate-700">
                <h3 class="text-base font-bold text-slate-900 mb-2"></h3>
                <div class="max-h-[50vh] overflow-y-auto text-xs leading-relaxed">${html || ''}</div>
                <div class="mt-4 flex flex-wrap justify-end gap-2" data-buttons></div>
            </div>`;
        overlay.querySelector('h3').textContent = title || '';
        const close = value => {
            document.removeEventListener('keydown', onKey);
            overlay.remove();
            resolve(value);
        };
        const onKey = e => { if (e.key === 'Escape') close(null); };
        const bar = overlay.querySelector('[data-buttons]');
        (buttons || [{ label: 'OK', value: true, primary: true }]).forEach(b => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = b.label;
            btn.className = b.primary
                ? 'bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer';
            btn.onclick = () => close(b.value);
            bar.appendChild(btn);
        });
        overlay.addEventListener('click', e => { if (e.target === overlay) close(null); });
        document.addEventListener('keydown', onKey);
        document.body.appendChild(overlay);
        const primary = bar.querySelector('button');
        if (primary) primary.focus();
    });
}
