// ============================================================================
// 20. HANDLER INPUT PENGATURAN UMUM
// ============================================================================
function updateConfigFromInputs() {
    appState.kegiatan.singkatan = document.getElementById('input-singkatan').value;
    appState.kegiatan.semester = document.getElementById('input-semester').value;
    appState.kegiatan.namaLengkap = document.getElementById('input-nama-asesmen').value;
    appState.kegiatan.nama = document.getElementById('input-kegiatan').value;
    appState.kegiatan.tahunAnggaran = document.getElementById('input-tahun-anggaran').value;
    appState.kegiatan.rentangUtama = document.getElementById('input-rentang-utama').value;
    appState.kegiatan.rentangSusulan = document.getElementById('input-rentang-susulan').value;
    appState.kegiatan.noSk = document.getElementById('input-no-sk').value;
    appState.kegiatan.tglSk = document.getElementById('input-tgl-sk').value;
    appState.kegiatan.noPos = document.getElementById('input-no-pos').value;
    appState.kegiatan.moda = document.getElementById('input-moda').value;
    appState.filterByTargetGrades = document.getElementById('input-filter-target-grade').checked;
    appState.kegiatan.showNisn = document.getElementById('input-show-nisn').checked;

    appState.kop.pemda = document.getElementById('input-pemda').value;
    appState.kop.dinas = document.getElementById('input-dinas').value;
    appState.kop.uptd = document.getElementById('input-uptd').value;
    appState.kop.sekolah = document.getElementById('input-sekolah').value;
    appState.kop.nssNpsn = document.getElementById('input-nss-npsn').value;
    appState.kop.alamatDok = document.getElementById('input-alamat-dok').value;
    appState.kop.kontakDok = document.getElementById('input-kontak-dok').value;
    appState.kop.alamat = document.getElementById('input-alamat').value;
    appState.kop.kabupaten = document.getElementById('input-kabupaten').value;
    appState.kop.wilayah = document.getElementById('input-wilayah').value;
    appState.kop.motto = document.getElementById('input-motto').value;

    appState.pengesahan.tempat = document.getElementById('input-tempat').value;
    appState.pengesahan.tanggal = document.getElementById('input-tanggal').value;
    appState.pengesahan.jabatan1 = document.getElementById('input-jabatan1').value;
    appState.pengesahan.jabatan2 = document.getElementById('input-jabatan2').value;
    appState.pengesahan.kepsek = document.getElementById('input-kepsek').value;
    appState.pengesahan.nip = document.getElementById('input-nip').value;

    const ttdScale = parseInt(document.getElementById('input-ttd-scale').value || 100, 10);
    const capScale = parseInt(document.getElementById('input-cap-scale').value || 100, 10);
    appState.pengesahan.ttdScale = ttdScale;
    appState.pengesahan.capScale = capScale;
    document.getElementById('label-ttd-scale').textContent = ttdScale + '%';
    document.getElementById('label-cap-scale').textContent = capScale + '%';

    const selectedCardSize = document.querySelector('input[name="cardSize"]:checked');
    if (selectedCardSize) appState.setting.cardSize = selectedCardSize.value;

    const selectedPaperSize = document.querySelector('input[name="paperSize"]:checked');
    if (selectedPaperSize) appState.setting.paperSize = selectedPaperSize.value;

    appState.setting.showWatermark = document.getElementById('input-show-watermark').checked;

    // Ruang Config
    appState.roomConfig.filterRuang = document.getElementById('input-room-filter').value;
    appState.roomConfig.maxPerRoom = Math.max(0, parseInt(document.getElementById('input-room-max').value || 0, 10));
    appState.roomConfig.seatPattern = document.getElementById('input-seat-pattern').value;
    appState.roomConfig.seatCols = parseInt(document.getElementById('input-seat-cols').value || 4, 10);
    appState.roomConfig.doorPos = document.getElementById('input-door-pos').value;
    appState.roomConfig.pengawas1 = document.getElementById('input-pengawas1').value;
    appState.roomConfig.pengawas2 = document.getElementById('input-pengawas2').value;
    appState.roomConfig.deskSize = document.getElementById('input-desk-size').value;
    appState.roomConfig.baMapel = document.getElementById('input-ba-mapel').value;
    appState.roomConfig.baTanggal = document.getElementById('input-ba-tanggal').value;
    appState.roomConfig.baWaktu = document.getElementById('input-ba-waktu').value;
    appState.roomConfig.baCatatan = document.getElementById('input-ba-catatan').value;

    // Rekap & LPJ Config
    appState.rekapConfig.mapel = document.getElementById('input-rekap-mapel').value;
    appState.rekapConfig.guru = document.getElementById('input-rekap-guru').value;
    appState.rekapConfig.nip = document.getElementById('input-rekap-nip').value;
    appState.rekapConfig.kktp = parseInt(document.getElementById('input-rekap-kktp').value || 75, 10);
    appState.rekapConfig.kelasFilter = document.getElementById('input-rekap-kelas').value;
    appState.rekapConfig.lpjTanggal = document.getElementById('input-lpj-tanggal').value;
    appState.rekapConfig.lpjKehadiran = document.getElementById('input-lpj-kehadiran').value;

    renderStudentTable();
    renderAll();
}

function renderThemeSelector() {
    const container = document.getElementById('theme-selector-grid');
    if (!container) return;
    container.innerHTML = Object.values(THEMES).map(t => {
        const isSelected = appState.setting.theme === t.id;
        return `
        <button onclick="appState.setting.theme='${t.id}';renderThemeSelector();renderAll()" class="p-2 rounded-lg border text-left transition flex items-center gap-2 cursor-pointer ${isSelected ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600' : 'border-slate-200 hover:bg-slate-50'}">
            <div class="w-4 h-4 rounded-full shrink-0 border border-black/20" style="background: ${t.bannerBg === 'transparent' ? '#1e293b' : t.bannerBg}"></div>
            <span class="text-[11px] font-semibold text-slate-800 truncate">${t.name}</span>
        </button>`;
    }).join('');
}

function populateRoomFilterDropdown() {
    const select = document.getElementById('input-room-filter');
    if (!select) return;
    const currentVal = appState.roomConfig.filterRuang || 'ALL';
    const activeStudents = getActiveStudents();
    const uniqueRooms = [...new Set(activeStudents.map(s => String(s.ruang || '1').trim()))].filter(Boolean);
    let html = `<option value="ALL">Semua Ruang (${uniqueRooms.length} Ruang)</option>`;
    uniqueRooms.forEach(r => {
        html += `<option value="${escapeHtml(r)}">Ruang ${escapeHtml(padRoom(r))}</option>`;
    });
    select.innerHTML = html;
    if (uniqueRooms.includes(currentVal) || currentVal === 'ALL') {
        select.value = currentVal;
    } else {
        select.value = 'ALL';
        appState.roomConfig.filterRuang = 'ALL';
    }
}

function changeMetodeTtd(metode) {
    appState.pengesahan.metode = metode;
    const controls = document.getElementById('ttd-upload-controls');
    if (metode === 'upload') {
        controls.classList.remove('hidden');
    } else {
        controls.classList.add('hidden');
    }
    renderAll();
}

async function handleImageUpload(event, targetKey) {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) { showToast(problem); input.value = ''; return; }
    try {
        const dataUrl = await compressImageFile(file, IMAGE_MAX_DIM[targetKey] || 600);
        if (targetKey === 'logoKiri') {
            appState.kop.logoKiri = dataUrl;
            document.getElementById('preview-logo-kiri').src = dataUrl;
        } else if (targetKey === 'logoKanan') {
            appState.kop.logoKanan = dataUrl;
            document.getElementById('preview-logo-kanan').src = dataUrl;
        } else if (targetKey === 'ttdImg') {
            appState.pengesahan.ttdImg = dataUrl;
            document.getElementById('preview-ttd').src = dataUrl;
        } else if (targetKey === 'capImg') {
            appState.pengesahan.capImg = dataUrl;
            document.getElementById('preview-cap').src = dataUrl;
        }
        renderAll();
        const kb = Math.round(dataUrl.length * 0.75 / 1024);
        showToast(`Gambar berhasil diperbarui (${kb} KB setelah dioptimalkan).`);
    } catch (err) {
        showToast(err.message || 'Gambar gagal diproses.');
    } finally {
        input.value = '';
    }
}

function resetLogo(targetKey) {
    if (targetKey === 'logoKiri') {
        appState.kop.logoKiri = DEFAULT_LOGO_PEMDA;
        document.getElementById('preview-logo-kiri').src = DEFAULT_LOGO_PEMDA;
    } else if (targetKey === 'logoKanan') {
        appState.kop.logoKanan = DEFAULT_LOGO_SEKOLAH;
        document.getElementById('preview-logo-kanan').src = DEFAULT_LOGO_SEKOLAH;
    } else if (targetKey === 'ttdImg') {
        appState.pengesahan.ttdImg = DEFAULT_TTD_SVG;
        document.getElementById('preview-ttd').src = DEFAULT_TTD_SVG;
    } else if (targetKey === 'capImg') {
        appState.pengesahan.capImg = DEFAULT_CAP_SVG;
        document.getElementById('preview-cap').src = DEFAULT_CAP_SVG;
    }
    renderAll();
    showToast("Gambar dikembalikan ke default.");
}
