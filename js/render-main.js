// ============================================================================
// 19. MASTER RENDER DISPATCHER (16 MODUL LENGKAP)
// ============================================================================
function renderAll() {
    populateRoomFilterDropdown();
    const layout = calculateSheetLayout();
    const paper = layout.paper;
    const mode = appState.docMode;
    const preset = ASSESSMENT_PRESETS[appState.assessmentMode];

    // Update CSS @page Dinamis untuk Print PDF
    const styleEl = document.getElementById('dynamic-print-style');
    styleEl.innerHTML = `
        @page {
            size: ${paper.widthCm}cm ${paper.heightCm}cm;
            margin: 0mm;
        }
    `;

    const sheetsContainer = document.getElementById('sheets-container');
    const summaryEl = document.getElementById('preview-summary-text');

    if (layout.activeStudents.length === 0 && ['kartu', 'denah', 'meja', 'nominasi', 'dh_peserta'].includes(mode)) {
        sheetsContainer.innerHTML = `
            <div class="bg-white rounded-xl p-8 shadow text-center max-w-md">
                <p class="text-sm font-bold text-slate-700">Tidak ada peserta untuk sasaran ${preset.targetGradesText}.</p>
                <p class="text-xs text-slate-500 mt-1">Tambahkan peserta ${preset.targetGradesText} pada tab <strong>5. Peserta</strong> atau matikan centang filter kelas otomatis di tab <strong>1. Mode</strong>.</p>
            </div>`;
        saveStateSoon();
        return;
    }

    if (mode === 'kartu') {
        summaryEl.textContent = `${preset.shortName} • ${layout.activeStudents.length} Peserta (${preset.targetGradesText}) • ${layout.cardsPerPage} Kartu/Lembar (${paper.name}) • ${layout.totalPages} Hal`;
        let sheetsHTML = '';
        for (let pageIdx = 0; pageIdx < layout.totalPages; pageIdx++) {
            const startIdx = pageIdx * layout.cardsPerPage;
            const pageStudents = layout.activeStudents.slice(startIdx, startIdx + layout.cardsPerPage);
            const cardsHTML = pageStudents.map(st => renderSingleCardHTML(st, layout)).join('');
            sheetsHTML += `
            <div class="print-sheet bg-white shadow-xl border border-slate-300 relative box-border flex flex-col items-center"
                 style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: ${paper.marginYCm}cm ${paper.marginXCm}cm;">
                <div class="no-print absolute -top-6 left-0 text-xs font-semibold text-slate-600">
                    Kartu Peserta ${appState.kegiatan.singkatan} — Lembar ${pageIdx + 1} dari ${layout.totalPages} (${paper.name})
                </div>
                <div style="display: grid; grid-template-columns: repeat(${layout.cols}, ${layout.card.widthCm}cm); gap: 0.22cm 0.25cm; justify-content: center;">
                    ${cardsHTML}
                </div>
            </div>`;
        }
        sheetsContainer.innerHTML = sheetsHTML;
    } else if (mode === 'denah') {
        const groups = getRoomGroups();
        summaryEl.textContent = `Denah Tempat Duduk • ${groups.length} Ruang (${paper.name})`;
        sheetsContainer.innerHTML = groups.map((g, idx) => renderDenahSheetHTML(g, idx, groups.length, paper)).join('');
    } else if (mode === 'meja') {
        const groups = getRoomGroups();
        const deskItems = [];
        groups.forEach(g => g.students.forEach((st, idx) => deskItems.push({ student: st, seatIndex: idx + 1 })));
        const isBig = appState.roomConfig.deskSize === 'besar';
        const labelW = isBig ? 9.5 : 9.0;
        const labelH = isBig ? 6.0 : 4.8;
        const cols = 2;
        const rows = Math.max(1, Math.floor((paper.heightCm - 1.2) / (labelH + 0.25)));
        const perPage = cols * rows;
        const totalPages = Math.max(1, Math.ceil(deskItems.length / perPage));
        summaryEl.textContent = `Label Nomor Meja (${labelW}×${labelH} cm) • ${perPage} Label/Lembar • ${totalPages} Hal`;

        let sheetsHTML = '';
        for (let p = 0; p < totalPages; p++) {
            const slice = deskItems.slice(p * perPage, (p + 1) * perPage);
            const cardsHTML = slice.map(item => renderSingleDeskLabelHTML(item.student, item.seatIndex, labelW, labelH)).join('');
            sheetsHTML += `
            <div class="print-sheet bg-white shadow-xl border border-slate-300 relative box-border flex flex-col items-center"
                 style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.5cm 0.4cm;">
                <div style="display: grid; grid-template-columns: repeat(${cols}, ${labelW}cm); gap: 0.25cm 0.3cm; justify-content: center;">
                    ${cardsHTML}
                </div>
            </div>`;
        }
        sheetsContainer.innerHTML = sheetsHTML;
    } else if (mode === 'nominasi') {
        const groups = getRoomGroups();
        summaryEl.textContent = `Daftar Peserta Ruang (Nominasi) • ${groups.length} Ruang`;
        sheetsContainer.innerHTML = groups.map((g, idx) => renderNominasiSheetHTML(g, idx, groups.length, paper)).join('');
    } else if (mode === 'pintu') {
        const groups = getRoomGroups();
        summaryEl.textContent = `Label Pintu Ruang & Harap Tenang • ${groups.length} Ruang`;
        sheetsContainer.innerHTML = groups.map(g => renderRoomDoorSignHTML(g, paper)).join('');
    } else if (mode === 'sk') {
        summaryEl.textContent = `SK Kepanitiaan, Pengawas & Korektor ${appState.kegiatan.singkatan} • 4 Halaman Lengkap`;
        sheetsContainer.innerHTML = renderSKCompleteHTML(paper);
    } else if (mode === 'pos') {
        summaryEl.textContent = `Prosedur Operasional Standar (POS) ${appState.kegiatan.singkatan} • 4 Halaman Lengkap`;
        sheetsContainer.innerHTML = renderPOSCompleteHTML(paper);
    } else if (mode === 'jadwal_pengawas') {
        summaryEl.textContent = `Jadwal ${appState.kegiatan.singkatan} & Pengawas Ruang (Rotasi Sesi 1 & 2 + Guru Piket)`;
        sheetsContainer.innerHTML = renderJadwalDanPengawasHTML(paper);
    } else if (mode === 'tatib') {
        summaryEl.textContent = `Tata Tertib Pengawas Ruang & Peserta ${appState.kegiatan.singkatan} • 2 Halaman`;
        sheetsContainer.innerHTML = renderTataTertibHTML(paper);
    } else if (mode === 'dh_panitia') {
        summaryEl.textContent = `Daftar Hadir Panitia Pelaksana ${appState.kegiatan.singkatan} (6 Hari)`;
        sheetsContainer.innerHTML = renderDaftarHadirPanitiaHTML(paper);
    } else if (mode === 'dh_pengawas') {
        summaryEl.textContent = `Daftar Hadir Pengawas Ruang ${appState.kegiatan.singkatan} (6 Hari)`;
        sheetsContainer.innerHTML = renderDaftarHadirPengawasHTML(paper);
    } else if (mode === 'berita_acara') {
        const groups = getRoomGroups();
        summaryEl.textContent = `Berita Acara Pelaksanaan ${appState.kegiatan.singkatan} • ${groups.length} Ruang`;
        sheetsContainer.innerHTML = renderBeritaAcaraHTML(paper);
    } else if (mode === 'dh_peserta') {
        const groups = getRoomGroups();
        summaryEl.textContent = `Daftar Hadir Peserta ${appState.kegiatan.singkatan} • ${groups.length} Ruang`;
        sheetsContainer.innerHTML = renderDaftarHadirPesertaHTML(paper);
    } else if (mode === 'serah_terima') {
        summaryEl.textContent = `Daftar Serah Terima Naskah Soal & LJK Korektor • 2 Halaman`;
        sheetsContainer.innerHTML = renderSerahTerimaHTML(paper);
    } else if (mode === 'susulan') {
        summaryEl.textContent = `Jadwal & Berita Acara ${appState.kegiatan.singkatan} Susulan • 2 Halaman`;
        sheetsContainer.innerHTML = renderAsesmenSusulanHTML(paper);
    } else if (mode === 'rekap_nilai') {
        summaryEl.textContent = `Daftar Rekapitulasi Nilai & Ketuntasan ${appState.kegiatan.singkatan}`;
        sheetsContainer.innerHTML = renderRekapNilaiHTML(paper);
    } else if (mode === 'laporan') {
        summaryEl.textContent = `Laporan Akhir Pelaksanaan (LPJ) ${appState.kegiatan.singkatan} • 4 Halaman Lengkap`;
        sheetsContainer.innerHTML = renderLaporanAkhirHTML(paper);
    }

    refreshIcons();
    const navSchool = document.getElementById('nav-school-name');
    if (navSchool) navSchool.textContent = appState.kop.sekolah;
    saveStateSoon();
}
