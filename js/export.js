// ============================================================================
// 23. OUTPUT CETAK PDF & UNDUH EXCEL LENGKAP (.XLSX)
// ============================================================================
function printPDF() {
    const container = document.getElementById('sheets-container');
    const prevZoom = container.style.zoom;
    container.style.zoom = '1';
    setTimeout(() => {
        window.print();
        container.style.zoom = prevZoom;
    }, 150);
}

// exportWord() ada di js/export-word.js

function exportExcelOutput() {
    if (!ensureXLSX()) return;
    const wb = XLSX.utils.book_new();
    const activeStudents = getActiveStudents();

    // Sheet 1: Peserta Aktif & Rekap Nilai
    const wsPeserta = XLSX.utils.json_to_sheet(activeStudents.map((s, i) => ({
        "No": i + 1,
        "Nomor Ujian": s.noUjian,
        "Nama Peserta Didik": s.nama,
        "L/P": s.lp || "L",
        "NISN": s.nisn || "-",
        "Kelas": s.kelas,
        "Ruang": s.ruang,
        "Nilai Akhir": s.nilai || 0,
        "Kegiatan": appState.kegiatan.namaLengkap,
        "Tahun Pelajaran": appState.kegiatan.tapelAngka
    })));
    XLSX.utils.book_append_sheet(wb, wsPeserta, "Peserta_dan_Nilai");

    // Sheet 2: Susunan Panitia
    const wsPanitia = XLSX.utils.json_to_sheet(appState.committee.map((c, i) => ({
        "No": i + 1,
        "Nama Lengkap": c.nama,
        "NIP": c.nip,
        "Jabatan Dinas": c.jabatanDinas,
        "Jabatan Kepanitiaan": c.jabatanPanitia
    })));
    XLSX.utils.book_append_sheet(wb, wsPanitia, "Susunan_Panitia");

    // Sheet 3: Jadwal Ujian & Pengawas Ruang (Sesi 1 & Sesi 2)
    const jadwalRowsExcel = [];
    appState.schedule.forEach((d, i) => {
        d.sesi.forEach((ss, sIdx) => {
            const row = {
                "No": sIdx === 0 ? i + 1 : "",
                "Hari & Tanggal": sIdx === 0 ? `${d.hari}, ${d.tanggal}` : "",
                "Sesi": sIdx + 1,
                "Waktu": ss.waktu,
                "Mata Pelajaran": ss.mapel
            };
            for (let r = 0; r < appState.jumlahRuang; r++) {
                const p = ss.pengawas[r] || ["", ""];
                if (getPengawasPerRuang() === 1) {
                    row[`Ruang ${r + 1} - Pengawas`] = p[0];
                } else {
                    row[`Ruang ${r + 1} - Pengawas 1`] = p[0];
                    row[`Ruang ${r + 1} - Pengawas 2`] = p[1];
                }
            }
            jadwalRowsExcel.push(row);
        });
    });
    const wsJadwal = XLSX.utils.json_to_sheet(jadwalRowsExcel);
    XLSX.utils.book_append_sheet(wb, wsJadwal, "Jadwal_dan_Pengawas");

    // Sheet 4: Daftar Korektor
    const wsKorektor = XLSX.utils.json_to_sheet(appState.correctors.map((cr, i) => ({
        "No": i + 1,
        "Mata Pelajaran": cr.mapel,
        "Korektor Kelas VII": cr.k7,
        "Korektor Kelas VIII": cr.k8,
        "Korektor Kelas IX": cr.k9,
        "Bentuk & Jumlah Soal": cr.bentuk,
        "Alokasi Waktu": cr.waktu
    })));
    XLSX.utils.book_append_sheet(wb, wsKorektor, "Daftar_Korektor");

    // Sheet 5: Realisasi Anggaran (LPJ)
    const wsBudget = XLSX.utils.json_to_sheet(appState.budget.map((b, i) => ({
        "No": i + 1,
        "Uraian Pengeluaran": b.uraian,
        "Volume": b.volume,
        "Total Biaya (Rp)": (Number(b.qty) || 1) * (Number(b.harga) || 0)
    })));
    XLSX.utils.book_append_sheet(wb, wsBudget, "Realisasi_Anggaran");

    XLSX.writeFile(wb, `Administrasi_Lengkap_${appState.kegiatan.singkatan}_${appState.kegiatan.tapelAngka.replace('/', '-')}.xlsx`);
    showToast("Seluruh tabel administrasi berhasil diunduh ke Excel (.xlsx)!");
}
