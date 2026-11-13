// ============================================================================
// 6. INISIALISASI & SINKRONISASI FORM UI
// ============================================================================
function initApp() {
    syncInputsFromState();
    updateDeveloperPhotoUI();
    populateRoomFilterDropdown();
    renderThemeSelector();
    syncPengawasPerRuangUI();
    renderCommitteeTable();
    renderCorrectorsTable();
    renderScheduleEditor();
    renderGuruPengawasEditor();
    renderMakeupEditor();
    renderBudgetTable();
    renderStudentTable();
    updateModeHighlightUI();
    updateDocPillUI();
    renderAll();
    updateDocGalleryButton();
    refreshIcons();
}

function syncInputsFromState() {
    document.getElementById('input-tugas-pengawas').value = appState.tugasPengawas ?? '';
    document.getElementById('input-singkatan').value = appState.kegiatan.singkatan;
    document.getElementById('input-semester').value = appState.kegiatan.semester;
    document.getElementById('input-nama-asesmen').value = appState.kegiatan.namaLengkap;
    document.getElementById('input-kegiatan').value = appState.kegiatan.nama;
    document.getElementById('input-tapel-angka').value = appState.kegiatan.tapelAngka;
    document.getElementById('input-tahun-anggaran').value = appState.kegiatan.tahunAnggaran;
    document.getElementById('input-rentang-utama').value = appState.kegiatan.rentangUtama;
    document.getElementById('input-rentang-susulan').value = appState.kegiatan.rentangSusulan;
    document.getElementById('input-no-sk').value = appState.kegiatan.noSk;
    document.getElementById('input-tgl-sk').value = appState.kegiatan.tglSk;
    document.getElementById('input-no-pos').value = appState.kegiatan.noPos;
    document.getElementById('input-moda').value = appState.kegiatan.moda;
    document.getElementById('input-filter-target-grade').checked = appState.filterByTargetGrades;
    document.getElementById('input-show-nisn').checked = appState.kegiatan.showNisn;

    document.getElementById('input-pemda').value = appState.kop.pemda;
    document.getElementById('input-dinas').value = appState.kop.dinas;
    document.getElementById('input-uptd').value = appState.kop.uptd;
    document.getElementById('input-sekolah').value = appState.kop.sekolah;
    document.getElementById('input-nss-npsn').value = appState.kop.nssNpsn;
    document.getElementById('input-alamat-dok').value = appState.kop.alamatDok;
    document.getElementById('input-kontak-dok').value = appState.kop.kontakDok;
    document.getElementById('input-alamat').value = appState.kop.alamat;
    document.getElementById('preview-logo-kiri').src = appState.kop.logoKiri;
    document.getElementById('preview-logo-kanan').src = appState.kop.logoKanan;

    document.getElementById('input-tempat').value = appState.pengesahan.tempat;
    document.getElementById('input-tanggal').value = appState.pengesahan.tanggal;
    document.getElementById('input-jabatan1').value = appState.pengesahan.jabatan1;
    document.getElementById('input-jabatan2').value = appState.pengesahan.jabatan2;
    document.getElementById('input-kepsek').value = appState.pengesahan.kepsek;
    document.getElementById('input-nip').value = appState.pengesahan.nip;
    document.getElementById('preview-ttd').src = appState.pengesahan.ttdImg;
    document.getElementById('preview-cap').src = appState.pengesahan.capImg;

    document.getElementById('input-rekap-mapel').value = appState.rekapConfig.mapel;
    document.getElementById('input-rekap-guru').value = appState.rekapConfig.guru;
    document.getElementById('input-rekap-nip').value = appState.rekapConfig.nip;
    document.getElementById('input-rekap-kktp').value = appState.rekapConfig.kktp;
    document.getElementById('input-rekap-kelas').value = appState.rekapConfig.kelasFilter;
    document.getElementById('input-lpj-tanggal').value = appState.rekapConfig.lpjTanggal;
    document.getElementById('input-lpj-kehadiran').value = appState.rekapConfig.lpjKehadiran;

    // Field tambahan & kontrol yang sebelumnya tidak disinkronkan (penting untuk pemulihan data)
    const setVal = (id, v) => { const el = document.getElementById(id); if (el && v !== undefined && v !== null) el.value = v; };
    const setChk = (id, v) => { const el = document.getElementById(id); if (el) el.checked = !!v; };
    const setRadio = (name, v) => { const el = document.querySelector(`input[name="${name}"][value="${v}"]`); if (el) el.checked = true; };
    setVal('input-kabupaten', appState.kop.kabupaten);
    setVal('input-wilayah', appState.kop.wilayah);
    setVal('input-motto', appState.kop.motto);
    setVal('input-jumlah-ruang', appState.jumlahRuang);
    setVal('input-tanggal-mulai', appState.kegiatan.tanggalMulai);
    setVal('input-tanggal-mulai-susulan', appState.kegiatan.tanggalMulaiSusulan);
    setVal('input-ttd-scale', appState.pengesahan.ttdScale);
    setVal('input-cap-scale', appState.pengesahan.capScale);
    document.getElementById('label-ttd-scale').textContent = appState.pengesahan.ttdScale + '%';
    document.getElementById('label-cap-scale').textContent = appState.pengesahan.capScale + '%';
    setRadio('metodeTtd', appState.pengesahan.metode);
    document.getElementById('ttd-upload-controls').classList.toggle('hidden', appState.pengesahan.metode !== 'upload');
    setRadio('paperSize', appState.setting.paperSize);
    setRadio('cardSize', appState.setting.cardSize);
    setChk('input-show-watermark', appState.setting.showWatermark);
    setChk('input-show-foto', appState.setting.showFoto);
    const rc = appState.roomConfig;
    setVal('input-room-max', rc.maxPerRoom);
    setVal('input-seat-pattern', rc.seatPattern);
    setVal('input-seat-cols', rc.seatCols);
    setVal('input-door-pos', rc.doorPos);
    setVal('input-pengawas1', rc.pengawas1);
    setVal('input-pengawas2', rc.pengawas2);
    setVal('input-desk-size', rc.deskSize);
    setVal('input-ba-mapel', rc.baMapel);
    setVal('input-ba-tanggal', rc.baTanggal);
    setVal('input-ba-waktu', rc.baWaktu);
    setVal('input-ba-catatan', rc.baCatatan);
}

// ============================================================================
// 7. SWITCHER MODE ASESMEN (ASAS / ASAT / ASAJ)
// ============================================================================
function switchAssessmentMode(modeCode) {
    const preset = ASSESSMENT_PRESETS[modeCode];
    if (!preset) return;

    appState.assessmentMode = modeCode;
    appState.kegiatan.singkatan = preset.code;
    appState.kegiatan.semester = preset.semester;
    appState.kegiatan.namaLengkap = preset.fullName;
    appState.kegiatan.nama = preset.cardTitle;
    appState.kegiatan.noSk = preset.skNumber;
    appState.kegiatan.noPos = preset.posNumber;
    appState.kegiatan.tglSk = preset.skDate;
    appState.pengesahan.tanggal = preset.signDate;
    appState.kegiatan.tanggalMulai = preset.startDate;
    appState.kegiatan.tanggalMulaiSusulan = preset.makeupStart;
    appState.rekapConfig.lpjTanggal = preset.reportDate;
    applyAutoDates(true);

    syncInputsFromState();
    updateModeHighlightUI();
    populateRoomFilterDropdown();
    renderStudentTable();
    renderAll();
    showToast(`Mode dialihkan ke ${preset.fullName} (${preset.targetGradesText})`);
}

function updateModeHighlightUI() {
    const mode = appState.assessmentMode;
    const preset = ASSESSMENT_PRESETS[mode];

    document.body.dataset.mode = mode;

    // Update pill di navbar
    const pill = document.getElementById('nav-mode-pill');
    if (pill) pill.textContent = /kelas/i.test(preset.shortName)
        ? preset.shortName
        : `${preset.shortName} • Kelas ${preset.targetGrades.join(', ')}`;

    // Tombol segmen di navbar (desktop & HP) dan kartu mode di tab 1
    ['ASAS', 'ASAT', 'ASAJ'].forEach(m => {
        ['top-mode-', 'top-mode-m-', 'card-mode-'].forEach(prefix => {
            const el = document.getElementById(prefix + m);
            if (el) el.classList.toggle('is-active', m === mode);
        });
    });

    const sasaranLabel = document.getElementById('label-sasaran-kelas');
    if (sasaranLabel) sasaranLabel.textContent = preset.targetGradesText;
    const activeModeLabel = document.getElementById('label-active-mode');
    if (activeModeLabel) activeModeLabel.textContent = mode;
}

function updateTapelAngka(val) {
    appState.kegiatan.tapelAngka = val;
    appState.kegiatan.tapel = `TAHUN PELAJARAN ${val}`;
    renderAll();
}

// Ambil daftar siswa yang aktif berdasarkan mode (ASAS = 7,8,9 | ASAT = 7,8 | ASAJ = 9)
function getActiveStudents() {
    const preset = ASSESSMENT_PRESETS[appState.assessmentMode];
    if (!appState.filterByTargetGrades || !preset) {
        return appState.students;
    }
    return appState.students.filter(s => preset.targetGrades.includes(gradeOf(s.kelas)));
}

// Helper nama Ketua, Sekretaris, Bendahara dari tabel Panitia
        function getCommitteeRolePerson(roleKeyword, fallbackName, fallbackNip) {
    const found = appState.committee.find(c => c.jabatanPanitia.toLowerCase().includes(roleKeyword.toLowerCase()));
    return found ? { nama: found.nama, nip: found.nip } : { nama: fallbackName, nip: fallbackNip };
}

// ============================================================================
// 8. NAVIGASI TAB & PEMILIH 16 MODUL DOKUMEN
// ============================================================================
// Judul & keterangan panel pengaturan untuk setiap bagian menu
const SECTION_META = {
    mode:    { icon: 'calendar-cog',   title: 'Mode & Kegiatan',    desc: 'Jenis asesmen, nama kegiatan, tahun pelajaran, nomor SK' },
    kop:     { icon: 'building-2',     title: 'KOP & Pengesahan',   desc: 'Kop surat, logo, kepala sekolah, TTD & cap, kertas' },
    panitia: { icon: 'user-cog',       title: 'Panitia & Korektor', desc: 'Susunan panitia, penyusun soal, dan korektor' },
    jadwal:  { icon: 'calendar-clock', title: 'Jadwal & Pengawas',  desc: 'Hari, tanggal, mapel, dan pengawas per ruang' },
    peserta: { icon: 'users',          title: 'Peserta',            desc: 'Daftar peserta dan impor dari Excel' },
    ruang:   { icon: 'layout-grid',    title: 'Ruang & Denah',      desc: 'Denah tempat duduk, label meja, berita acara' },
    laporan: { icon: 'wallet',         title: 'Nilai & LPJ',        desc: 'Rekap nilai, realisasi anggaran, laporan akhir' }
};

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById('tab-' + tabName);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        const active = btn.id === 'tab-btn-' + tabName;
        btn.classList.toggle('is-active', active);
        if (active) btn.setAttribute('aria-current', 'page'); else btn.removeAttribute('aria-current');
    });

    const meta = SECTION_META[tabName];
    if (meta) {
        const t = document.getElementById('panel-title');
        const d = document.getElementById('panel-desc');
        const i = document.getElementById('panel-icon');
        if (t) t.textContent = meta.title;
        if (d) d.textContent = meta.desc;
        if (i) { i.innerHTML = `<i data-lucide="${meta.icon}" class="w-4 h-4"></i>`; refreshIcons(); }
    }
    const body = document.querySelector('.sidebar-body');
    if (body) body.scrollTop = 0;
}

// Klik menu di sidebar: tampilkan bagian tsb. (buka panel bila sedang ditutup)
function openSection(tabName) {
    switchTab(tabName);
    if (appState.sidebarHidden) toggleSidebar();
    toggleNavDrawer(false);
    if (typeof setMobileView === 'function') setMobileView('settings');
}

// Sidebar diciutkan jadi deretan ikon (desktop)
const NAV_COLLAPSED_KEY = 'asesmen-nav-collapsed';
function setNavCollapsed(collapsed, save) {
    document.body.classList.toggle('nav-collapsed', collapsed);
    if (save) { try { localStorage.setItem(NAV_COLLAPSED_KEY, collapsed ? '1' : '0'); } catch (err) {} }
    setTimeout(() => { if (typeof refreshZoom === 'function') refreshZoom(); }, 220);
}
function toggleNavCollapsed() {
    setNavCollapsed(!document.body.classList.contains('nav-collapsed'), true);
}
function initNavCollapsed() {
    let saved = null;
    try { saved = localStorage.getItem(NAV_COLLAPSED_KEY); } catch (err) {}
    // Bawaan: diciutkan pada layar laptop kecil agar pratinjau tetap lega
    setNavCollapsed(saved === null ? window.innerWidth < 1280 : saved === '1', false);
}

// Menu laci di layar kecil
function toggleNavDrawer(open) {
    document.body.classList.toggle('nav-open', !!open);
}

function setDocMode(mode) {
    appState.docMode = mode;
    const sel = document.getElementById('doc-mode-select');
    if (sel) sel.value = mode;
    renderAll();
    updateDocGalleryButton();
    const wrapper = document.getElementById('preview-wrapper');
    if (wrapper) wrapper.scrollTo(0, 0);
}

// ---------- Galeri dokumen ----------
// Daftar dokumen diambil dari <select id="doc-mode-select"> (satu sumber data).
const DOC_ICONS = {
    kartu: 'id-card', denah: 'layout-grid', meja: 'tag', nominasi: 'list-checks', pintu: 'door-open',
    sk: 'scroll-text', pos: 'book-open', jadwal_pengawas: 'calendar-clock', tatib: 'shield-check',
    dh_panitia: 'clipboard-check', dh_pengawas: 'user-check', berita_acara: 'file-signature',
    dh_peserta: 'users', serah_terima: 'package-check',
    susulan: 'calendar-plus', rekap_nilai: 'bar-chart-3', laporan: 'file-bar-chart'
};

// "6. SK Kepanitiaan (Lengkap Lampiran I-IV)" → { no: '6', title: 'SK Kepanitiaan', sub: 'Lengkap Lampiran I-IV' }
function parseDocLabel(text) {
    const m = text.match(/^(\d+)\.\s*(.*?)(?:\s*\(([^)]*)\))?$/);
    return m ? { no: m[1], title: m[2], sub: m[3] || '' } : { no: '', title: text, sub: '' };
}

function getDocGroups() {
    return [...document.querySelectorAll('#doc-mode-select optgroup')].map(g => ({
        label: g.label.replace(/^[A-Z]\.\s*/, ''),
        letter: (g.label.match(/^([A-Z])\./) || [])[1] || '',
        docs: [...g.querySelectorAll('option')].map(o => Object.assign({ value: o.value }, parseDocLabel(o.textContent.trim())))
    }));
}

function renderDocGallery() {
    const panel = document.getElementById('doc-gallery');
    if (!panel) return;
    panel.innerHTML = getDocGroups().map(g => `
        <div class="doc-group">
            <div class="doc-group-title"><span>${escapeHtml(g.letter)}</span>${escapeHtml(g.label)}</div>
            <div class="doc-grid">
                ${g.docs.map(d => `
                <button onclick="closeMenus(); withPreviewLoading(() => setDocMode('${d.value}'))" class="doc-item${d.value === appState.docMode ? ' is-active' : ''}" title="${escapeHtml(d.title)}${d.sub ? ' (' + escapeHtml(d.sub) + ')' : ''}">
                    <span class="doc-icon"><i data-lucide="${DOC_ICONS[d.value] || 'file-text'}" class="w-4 h-4"></i></span>
                    <span class="min-w-0">
                        <span class="doc-item-title">${escapeHtml(d.no)}. ${escapeHtml(d.title)}</span>
                        ${d.sub ? `<span class="doc-item-sub">${escapeHtml(d.sub)}</span>` : ''}
                    </span>
                </button>`).join('')}
            </div>
        </div>`).join('');
    refreshIcons();
}

function toggleDocGallery(ev) {
    const panel = document.getElementById('doc-gallery');
    if (panel && panel.classList.contains('hidden')) {
        renderDocGallery();
        // Layar sempit: panel selebar layar, tepat di bawah tombol
        const narrow = window.innerWidth < 640;
        const btn = document.getElementById('doc-gallery-btn');
        panel.style.position = narrow ? 'fixed' : '';
        panel.style.left = narrow ? '.75rem' : '';
        panel.style.right = narrow ? '.75rem' : '';
        panel.style.width = narrow ? 'auto' : '';
        panel.style.top = narrow && btn ? (btn.getBoundingClientRect().bottom + 6) + 'px' : '';
    }
    toggleMenu('doc-gallery', ev);
}

function updateDocGalleryButton() {
    const opt = document.querySelector(`#doc-mode-select option[value="${appState.docMode}"]`);
    const label = document.getElementById('doc-current-label');
    const icon = document.getElementById('doc-current-icon');
    if (!opt || !label || !icon) return;
    const d = parseDocLabel(opt.textContent.trim());
    label.innerHTML = `<span class="text-slate-400 font-medium">${escapeHtml(d.no)}.</span> ${escapeHtml(d.title)}`;
    icon.innerHTML = `<i data-lucide="${DOC_ICONS[appState.docMode] || 'file-text'}" class="w-3.5 h-3.5"></i>`;
    refreshIcons();
}

// Pindah ke dokumen sebelum/berikutnya (tombol ‹ ›)
function stepDocMode(delta) {
    const values = [...document.querySelectorAll('#doc-mode-select option')].map(o => o.value);
    const idx = values.indexOf(appState.docMode);
    const next = values[(idx + delta + values.length) % values.length];
    if (next) setDocMode(next);
}

function updateDocPillUI() {
    // Bar tombol kapsul telah dihapus agar tampilan lebih ringkas
}

// ============================================================================
// 9. EDITOR TABEL PANITIA, KOREKTOR, JADWAL, DAN ANGGARAN
// ============================================================================
function renderCommitteeTable() {
    const tbody = document.getElementById('committee-table-body');
    if (!tbody) return;
    tbody.innerHTML = appState.committee.map((c, idx) => `
        <tr class="hover:bg-slate-50">
            <td class="p-1.5 text-center font-bold text-slate-400">${idx + 1}</td>
            <td class="p-1.5">
                <input type="text" value="${escapeHtml(c.nama)}" oninput="appState.committee[${idx}].nama=this.value;renderAll()" class="w-full font-bold text-slate-800 bg-transparent border-b border-transparent focus:border-primary-400 outline-none">
                <input type="text" value="${escapeHtml(c.nip)}" oninput="appState.committee[${idx}].nip=this.value;renderAll()" class="w-full text-[10px] text-slate-500 bg-transparent border-b border-transparent focus:border-primary-400 outline-none" placeholder="NIP">
            </td>
            <td class="p-1.5">
                <input type="text" value="${escapeHtml(c.jabatanPanitia)}" oninput="appState.committee[${idx}].jabatanPanitia=this.value;renderAll()" class="w-full font-semibold text-primary-700 bg-transparent border-b border-transparent focus:border-primary-400 outline-none">
                <input type="text" value="${escapeHtml(c.jabatanDinas)}" oninput="appState.committee[${idx}].jabatanDinas=this.value;renderAll()" class="w-full text-[10px] text-slate-500 bg-transparent border-b border-transparent focus:border-primary-400 outline-none">
            </td>
            <td class="p-1.5 text-center">
                <button onclick="appState.committee.splice(${idx},1);renderCommitteeTable();renderAll()" class="text-slate-400 hover:text-rose-600"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </td>
        </tr>
    `).join('');
    if (!appState.committee.length) tbody.innerHTML = emptyRowHTML(4, 'user-cog', 'Belum ada anggota panitia',
        'Panitia dipakai di SK, POS, daftar hadir, dan laporan akhir.',
        `<button onclick="addCommitteeMember()" class="bg-primary-600 hover:bg-primary-700 text-white px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer">+ Tambah Panitia</button>`);
    refreshIcons();
}

function addCommitteeMember() {
    appState.committee.push({ nama: "Nama Panitia Baru, S.Pd", nip: "-", jabatanDinas: "Guru", jabatanPanitia: "Anggota Panitia" });
    renderCommitteeTable();
    renderAll();
}

function renderCorrectorsTable() {
    const tbody = document.getElementById('correctors-table-body');
    if (!tbody) return;
    tbody.innerHTML = appState.correctors.map((cr, idx) => `
        <tr class="hover:bg-slate-50">
            <td class="p-1.5">
                <input type="text" value="${escapeHtml(cr.mapel)}" oninput="appState.correctors[${idx}].mapel=this.value;renderAll()" class="w-full font-bold text-slate-800 bg-transparent outline-none">
            </td>
            <td class="p-1.5">
                <input type="text" value="${escapeHtml(cr.k7)}" oninput="appState.correctors[${idx}].k7=this.value;renderAll()" class="w-full text-slate-700 bg-transparent outline-none">
            </td>
            <td class="p-1.5">
                <input type="text" value="${escapeHtml(cr.k8)}" oninput="appState.correctors[${idx}].k8=this.value;renderAll()" class="w-full text-slate-700 bg-transparent outline-none">
            </td>
            <td class="p-1.5">
                <input type="text" value="${escapeHtml(cr.k9)}" oninput="appState.correctors[${idx}].k9=this.value;renderAll()" class="w-full text-slate-700 bg-transparent outline-none">
            </td>
        </tr>
    `).join('');
}

function addCorrectorRow() {
    appState.correctors.push({ mapel: "Mata Pelajaran Baru", k7: "-", k8: "-", k9: "-", bentuk: "PT: 25 / B-S: 5 / MJ: 5 / IS: 5 / U: 5 (45 soal)", waktu: "90 Menit" });
    renderCorrectorsTable();
    renderAll();
}

function renderScheduleEditor() {
    const container = document.getElementById('schedule-editor-container');
    if (!container) return;
    ensureScheduleRooms();
    const n = appState.jumlahRuang;
    const ppr = getPengawasPerRuang();
    const gridCols = ppr === 1 ? 'grid-cols-[2.25rem_1fr]' : 'grid-cols-[2.25rem_1fr_1fr]';
    const sesiColors = ['blue', 'emerald', 'amber', 'purple'];
    container.innerHTML = appState.schedule.map((d, idx) => `
        <div class="border border-slate-200 rounded-lg p-2.5 bg-slate-50 space-y-2 text-[11px]">
            <div class="grid grid-cols-3 gap-2">
                <input type="text" value="${escapeHtml(d.hari)}" oninput="appState.schedule[${idx}].hari=this.value;if(appState.dailyRoster[${idx}])appState.dailyRoster[${idx}].hari=this.value;renderAll()" class="border border-slate-300 rounded px-2 py-1 font-bold bg-white" placeholder="Hari">
                <input type="text" value="${escapeHtml(d.tanggal)}" oninput="appState.schedule[${idx}].tanggal=this.value;renderAll()" class="col-span-2 border border-slate-300 rounded px-2 py-1 font-semibold bg-white" placeholder="Tanggal">
            </div>
            ${d.sesi.map((ss, sIdx) => {
                const c = sesiColors[sIdx % sesiColors.length];
                return `
            <div class="bg-white border border-${c}-200 rounded p-2 space-y-1.5">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold text-${c}-700 uppercase">Sesi ${sIdx + 1}</span>
                    ${sIdx > 0 ? `<button onclick="rotateProctorsForSesi(${idx}, ${sIdx})" class="text-[10px] bg-${c}-50 hover:bg-${c}-100 text-${c}-700 border border-${c}-200 px-1.5 py-0.5 rounded font-semibold cursor-pointer" title="Isi pengawas sesi ini dengan menggeser pengawas sesi sebelumnya satu ruang">Rotasi Otomatis</button>` : ''}
                </div>
                <div class="grid grid-cols-3 gap-1.5">
                    <input type="text" value="${escapeHtml(ss.waktu)}" oninput="appState.schedule[${idx}].sesi[${sIdx}].waktu=this.value;renderAll()" class="border border-slate-300 rounded px-2 py-1 bg-slate-50" placeholder="Waktu">
                    <input type="text" value="${escapeHtml(ss.mapel)}" title="${escapeHtml(ss.mapel)}" oninput="appState.schedule[${idx}].sesi[${sIdx}].mapel=this.value;this.title=this.value;renderAll()" class="col-span-2 border border-slate-300 rounded px-2 py-1 font-semibold bg-slate-50" placeholder="Mata Pelajaran">
                </div>
                <div class="space-y-1 text-[11px]">
                    <div class="grid ${gridCols} gap-1.5 text-[10px] font-semibold text-slate-500">
                        <span>Ruang</span>${ppr === 1 ? '<span>Pengawas</span>' : '<span>Pengawas 1</span><span>Pengawas 2</span>'}
                    </div>
                    ${ss.pengawas.slice(0, n).map((pair, rIdx) => `
                    <div class="grid ${gridCols} gap-1.5 items-center">
                        <span class="font-bold text-slate-600">R.${rIdx + 1}</span>
                        <input type="text" value="${escapeHtml(pair[0])}" title="${escapeHtml(pair[0])}" oninput="appState.schedule[${idx}].sesi[${sIdx}].pengawas[${rIdx}][0]=this.value;this.title=this.value;renderAll()" class="w-full min-w-0 border border-slate-200 rounded px-1.5 py-1" placeholder="${ppr === 1 ? 'Pengawas' : 'Pengawas 1'}">
                        ${ppr === 2 ? `<input type="text" value="${escapeHtml(pair[1])}" title="${escapeHtml(pair[1])}" oninput="appState.schedule[${idx}].sesi[${sIdx}].pengawas[${rIdx}][1]=this.value;this.title=this.value;renderAll()" class="w-full min-w-0 border border-slate-200 rounded px-1.5 py-1" placeholder="Pengawas 2">` : ''}
                    </div>`).join('')}
                </div>
            </div>`;
            }).join('')}
        </div>
    `).join('');
}

// Pastikan setiap sesi punya pasangan pengawas sebanyak jumlah ruang
function ensureScheduleRooms() {
    const n = Math.max(1, parseInt(appState.jumlahRuang, 10) || 1);
    appState.jumlahRuang = n;
    appState.schedule.forEach(d => {
        if (!Array.isArray(d.sesi)) d.sesi = [];
        d.sesi.forEach(ss => {
            if (!Array.isArray(ss.pengawas)) ss.pengawas = [];
            while (ss.pengawas.length < n) ss.pengawas.push(["", ""]);
            // data ruang berlebih tidak dihapus, hanya disembunyikan, agar tidak hilang bila jumlah ruang dinaikkan lagi
            ss.pengawas = ss.pengawas.map(p => Array.isArray(p) ? [p[0] || "", p[1] || ""] : ["", ""]);
        });
    });
}

function setJumlahRuang(val) {
    const n = Math.min(30, Math.max(1, parseInt(val, 10) || 1));
    appState.jumlahRuang = n;
    const el = document.getElementById('input-jumlah-ruang');
    if (el && String(el.value) !== String(n)) el.value = n;
    ensureScheduleRooms();
    renderScheduleEditor();
    renderAll();
}

function setPengawasPerRuang(val) {
    appState.pengawasPerRuang = parseInt(val, 10) === 1 ? 1 : 2;
    syncPengawasPerRuangUI();
    renderScheduleEditor();
    renderAll();
}

// Butir "Tugas Pengawas Ruang" (Lampiran III SK)
function updateTugasPengawas(val) {
    appState.tugasPengawas = val;
    renderAll();
}
function resetTugasPengawas() {
    appState.tugasPengawas = DEFAULT_TUGAS_PENGAWAS;
    document.getElementById('input-tugas-pengawas').value = DEFAULT_TUGAS_PENGAWAS;
    renderAll();
    showToast('Tugas Pengawas Ruang dikembalikan ke teks bawaan.');
}

function syncPengawasPerRuangUI() {
    const ppr = getPengawasPerRuang();
    const sel = document.getElementById('input-pengawas-per-ruang');
    if (sel) sel.value = String(ppr);
    const p2 = document.getElementById('field-pengawas2');
    if (p2) p2.classList.toggle('hidden', ppr === 1);
    const l1 = document.getElementById('label-pengawas1');
    if (l1) l1.textContent = ppr === 1 ? 'Label Meja Pengawas' : 'Label Meja Pengawas 1';
}

function syncJumlahRuangFromStudents() {
    const rooms = new Set(getActiveStudents().map(s => String(s.ruang || '1').trim() || '1'));
    setJumlahRuang(Math.max(1, rooms.size));
    showToast(`Jumlah ruang disamakan dengan data peserta: ${appState.jumlahRuang} ruang.`);
}

// Sesi ke-s: ruang r diawasi pasangan dari ruang r+1 pada sesi sebelumnya (rotasi silang)
function rotateProctorsForSesi(idx, sIdx) {
    const d = appState.schedule[idx];
    if (!d || !d.sesi[sIdx] || !d.sesi[sIdx - 1]) return;
    const n = appState.jumlahRuang;
    const prev = d.sesi[sIdx - 1].pengawas;
    for (let r = 0; r < n; r++) {
        const src = prev[(r + 1) % n] || ["", ""];
        d.sesi[sIdx].pengawas[r] = [src[0], src[1]];
    }
    renderScheduleEditor();
    renderAll();
    showToast(`Pengawas Sesi ${sIdx + 1} hari ${d.hari} berhasil dirotasi silang!`);
}

// Isi kotak pengawas yang kosong (mis. ruang baru) dengan guru yang paling sedikit bertugas,
// tanpa mengubah nama yang sudah diisi dan tanpa guru dobel dalam satu sesi.
function fillEmptyProctors() {
    ensureScheduleRooms();
    const n = appState.jumlahRuang;
    const usage = new Map();
    const addName = (nm) => {
        const v = String(nm || '').trim();
        if (v && v !== '-' && !usage.has(v)) usage.set(v, 0);
    };
    const ppr = getPengawasPerRuang();
    // Sumber utama: guru yang dicentang di Daftar Guru Pengawas
    const daftar = typeof getActiveGuruNames === 'function' ? getActiveGuruNames() : [];
    daftar.forEach(addName);
    if (!daftar.length) {
        // Nama di kotak pengawas 2 yang tersembunyi (mode 1 pengawas) tetap dipakai sebagai daftar guru
        appState.schedule.forEach(d => d.sesi.forEach(ss => ss.pengawas.slice(0, n).forEach(p => { addName(p[0]); addName(p[1]); })));
        (appState.dailyRoster || []).forEach(r => (r.guru || []).forEach(addName));
        // Panitia hanya cadangan bila jadwal & guru piket belum berisi nama (agar Kepala Sekolah dkk. tidak otomatis jadi pengawas)
        if (!usage.size) (appState.committee || []).forEach(c => addName(c.nama));
    }
    if (!usage.size) {
        showToast("Belum ada nama guru. Isi Daftar Guru Pengawas atau minimal satu pengawas dulu.");
        return;
    }
    appState.schedule.forEach(d => d.sesi.forEach(ss => ss.pengawas.slice(0, n).forEach(p => p.slice(0, ppr).forEach(nm => {
        const v = String(nm || '').trim();
        if (usage.has(v)) usage.set(v, usage.get(v) + 1);
    }))));

    let filled = 0, unfilled = 0;
    const names = [...usage.keys()];
    appState.schedule.forEach(d => d.sesi.forEach(ss => {
        const inSession = new Set(ss.pengawas.slice(0, n).map(p => p.slice(0, ppr)).flat().map(v => String(v || '').trim()).filter(Boolean));
        for (let r = 0; r < n; r++) {
            for (let k = 0; k < ppr; k++) {
                if (String(ss.pengawas[r][k] || '').trim()) continue;
                const pick = names
                    .filter(nm => !inSession.has(nm))
                    .sort((a, b) => usage.get(a) - usage.get(b))[0];
                if (!pick) { unfilled++; continue; }
                ss.pengawas[r][k] = pick;
                inSession.add(pick);
                usage.set(pick, usage.get(pick) + 1);
                filled++;
            }
        }
    }));
    renderScheduleEditor();
    renderAll();
    if (!filled && !unfilled) showToast("Semua kotak pengawas sudah terisi.");
    else showToast(`${filled} kotak pengawas diisi otomatis.` + (unfilled ? ` ${unfilled} kotak tetap kosong karena jumlah guru kurang.` : ''));
}

// Isi hari & tanggal jadwal utama dan susulan dari tanggal mulai (Minggu dilewati)
function applyAutoDates(silent) {
    const k = appState.kegiatan;
    const days = schoolDaysFrom(k.tanggalMulai, appState.schedule.length);
    if (days.length) {
        appState.schedule.forEach((d, i) => {
            d.hari = NAMA_HARI[days[i].getDay()];
            d.tanggal = formatTanggal(days[i]);
            if (appState.dailyRoster[i]) appState.dailyRoster[i].hari = d.hari;
        });
        k.rentangUtama = formatRentang(days[0], days[days.length - 1]);
    }
    const mDays = schoolDaysFrom(k.tanggalMulaiSusulan, appState.makeupSchedule.length);
    if (mDays.length) {
        appState.makeupSchedule.forEach((m, i) => {
            const d = mDays[i];
            m.hariTanggal = `${NAMA_HARI[d.getDay()]}, ${d.getDate()} ${NAMA_BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
        });
        k.rentangSusulan = formatRentang(mDays[0], mDays[mDays.length - 1]);
    }
    syncInputsFromState();
    renderScheduleEditor();
    renderMakeupEditor();
    renderAll();
    if (!silent) showToast("Hari & tanggal jadwal utama dan susulan diperbarui.");
}

function updateTanggalMulai() {
    appState.kegiatan.tanggalMulai = document.getElementById('input-tanggal-mulai').value;
    appState.kegiatan.tanggalMulaiSusulan = document.getElementById('input-tanggal-mulai-susulan').value;
    saveStateSoon();
}

function renderMakeupEditor() {
    const container = document.getElementById('makeup-editor-container');
    if (!container) return;
    const field = (idx, key, ph, extra = '') => {
        const v = escapeHtml(appState.makeupSchedule[idx][key] || '');
        return `<input type="text" value="${v}" title="${v}" placeholder="${ph}" oninput="appState.makeupSchedule[${idx}].${key}=this.value;this.title=this.value;renderAll()" class="w-full min-w-0 border border-slate-200 rounded px-1.5 py-1 ${extra}">`;
    };
    container.innerHTML = appState.makeupSchedule.map((m, idx) => `
        <div class="border border-slate-200 rounded-lg p-2 bg-white text-[11px] space-y-1.5">
            <div class="grid grid-cols-2 gap-1.5">
                ${field(idx, 'hariTanggal', 'Hari, tanggal', 'font-semibold')}
                ${field(idx, 'waktu', 'Waktu')}
            </div>
            ${field(idx, 'mapel', 'Mata Pelajaran', 'font-semibold')}
            <div class="grid grid-cols-[1fr_2fr] gap-1.5">
                ${field(idx, 'ruang', 'Ruang')}
                ${field(idx, 'pengawas', 'Pengawas')}
            </div>
        </div>
    `).join('');
}

function renderBudgetTable() {
    const tbody = document.getElementById('budget-table-body');
    if (!tbody) return;
    tbody.innerHTML = appState.budget.map((b, idx) => `
        <tr>
            <td class="p-1.5">
                <input type="text" value="${escapeHtml(b.uraian)}" oninput="appState.budget[${idx}].uraian=this.value;renderAll()" class="w-full bg-transparent outline-none font-medium">
            </td>
            <td class="p-1.5">
                <input type="text" value="${escapeHtml(b.volume)}" oninput="appState.budget[${idx}].volume=this.value;renderAll()" class="w-full bg-transparent outline-none">
            </td>
            <td class="p-1.5">
                <input type="number" value="${b.harga * b.qty}" oninput="appState.budget[${idx}].qty=1;appState.budget[${idx}].harga=parseInt(this.value||0,10);renderAll()" class="w-full text-right bg-transparent outline-none font-bold text-slate-800">
            </td>
            <td class="p-1.5 text-center">
                <button onclick="appState.budget.splice(${idx},1);renderBudgetTable();renderAll()" class="text-slate-400 hover:text-rose-600"><i data-lucide="x" class="w-3 h-3"></i></button>
            </td>
        </tr>
    `).join('');
    if (!appState.budget.length) tbody.innerHTML = emptyRowHTML(4, 'wallet', 'Belum ada rincian anggaran',
        'Rincian ini tampil di BAB V Laporan Akhir.',
        `<button onclick="addBudgetItem()" class="bg-primary-600 hover:bg-primary-700 text-white px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer">+ Tambah Baris</button>`);
    refreshIcons();
}

function addBudgetItem() {
    appState.budget.push({ uraian: "Kebutuhan Operasional Lainnya", volume: "1 Paket", qty: 1, harga: 150000 });
    renderBudgetTable();
    renderAll();
}
