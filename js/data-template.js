// ============================================================================
// 23. TEMPLATE DATA LENGKAP (EXCEL): PESERTA, PANITIA, KOREKTOR, PENGAWAS, PIKET, SUSULAN
// - Unduh: satu berkas .xlsx, tiap jenis data di lembar sendiri, terisi data saat ini
// - Impor: lembar dikenali dari namanya; pengguna memilih bagian mana yang diganti
// ============================================================================
const TPL_MAX_TEXT = 300;
const TPL_ROSTER_SLOTS = 10;
const TPL_MAX_ROOMS = 30;

// Kenali lembar dari namanya (urutan penting: "Jadwal Susulan" harus jatuh ke susulan)
const TPL_SHEETS = {
    peserta: n => n.includes('peserta') || n.includes('siswa'),
    panitia: n => n.includes('panitia'),
    korektor: n => n.includes('korektor') || n.includes('penyusun'),
    susulan: n => n.includes('susulan'),
    piket: n => n.includes('piket'),
    jadwal: n => (n.includes('jadwal') || n.includes('pengawas')) && !n.includes('susulan') && !n.includes('piket')
};
const TPL_LABELS = {
    peserta: 'Peserta', panitia: 'Panitia', korektor: 'Penyusun Soal & Korektor',
    jadwal: 'Jadwal & Pengawas Ruang', piket: 'Guru Piket', susulan: 'Jadwal Susulan'
};

function tplText(v) {
    return String(v === undefined || v === null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, TPL_MAX_TEXT);
}

function findTemplateSheets(workbook) {
    const found = {};
    workbook.SheetNames.forEach(name => {
        const n = normalizeHeader(name);
        for (const key of Object.keys(TPL_SHEETS)) {
            if (!found[key] && TPL_SHEETS[key](n)) { found[key] = name; break; }
        }
    });
    return found;
}

function sheetRows(workbook, name) {
    return XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '', raw: false, blankrows: false });
}

// Cari baris judul kolom (10 baris pertama) yang memuat kolom wajib, lalu petakan kolom
function findHeader(rows, aliases, required) {
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const norm = rows[i].map(normalizeHeader);
        const map = {};
        const used = new Set();
        const pick = exact => Object.keys(aliases).forEach(f => {
            if (map[f] !== undefined) return;
            for (const a of aliases[f]) {
                const idx = norm.findIndex((h, j) => !used.has(j) && h && (exact ? h === a : h.includes(a)));
                if (idx !== -1) { map[f] = idx; used.add(idx); return; }
            }
        });
        pick(true);
        pick(false);
        if (map[required] !== undefined) return { idx: i, map, norm };
    }
    return null;
}

function cellOf(row, map, field) {
    return map[field] === undefined ? '' : tplText(row[map[field]]);
}

// ---------------------------------------------------------------------------
// UNDUH TEMPLATE
// ---------------------------------------------------------------------------
// only: daftar lembar yang dibuat (selain Petunjuk); kosong = semua lembar
function downloadFullTemplate(only) {
    if (!ensureXLSX()) return;
    const wb = XLSX.utils.book_new();
    const add = (name, aoa, cols) => {
        if (only && name !== 'Petunjuk' && !only.includes(name)) return;
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        ws['!cols'] = cols.map(wch => ({ wch }));
        XLSX.utils.book_append_sheet(wb, ws, name);
    };

    add('Petunjuk', [
        ['TEMPLATE DATA ASESMEN — ' + (appState.kegiatan.singkatan || '')],
        [''],
        ['Cara memakai:'],
        ['1. Isi atau ubah data di setiap lembar yang ada di berkas ini.'],
        ['2. Jangan ubah nama lembar dan baris judul kolom (baris pertama tiap lembar).'],
        ['3. Simpan berkas, lalu di aplikasi klik Impor Template (menu Data & Backup, Panitia, atau Jadwal & Pengawas).'],
        ['4. Pilih bagian yang ingin dimuat. Bagian yang dipilih akan MENGGANTI data lama di aplikasi.'],
        [''],
        ['Keterangan per lembar:'],
        ['Peserta', 'Kelas: VII / VIII / IX (atau 7 / 8 / 9). L/P: L atau P. Ruang: angka (1, 2, ...). Nilai boleh kosong.'],
        ['Panitia', 'Satu baris per orang. Jabatan Panitia memakai kata kunci seperti "Penanggung Jawab", "Ketua", "Sekretaris" agar tanda tangan dokumen terisi tepat.'],
        ['Korektor', 'Satu baris per mata pelajaran; isi nama guru untuk Kelas VII, VIII, IX.'],
        ['Jadwal_Pengawas', 'Satu baris per SESI. Untuk sesi kedua di hari yang sama, kolom Hari & Tanggal boleh dikosongkan.'],
        ['', 'Banyaknya hari & sesi bebas: tambah atau hapus baris sesuai kebutuhan.'],
        ['', 'Jumlah ruang mengikuti banyaknya kolom ruang. Tambah kolom (mis. "Ruang 4 - Pengawas 1") bila ruangnya lebih banyak.'],
        ['', '1 pengawas tiap ruang: cukup kolom "Ruang N - Pengawas". 2 pengawas: kolom "Ruang N - Pengawas 1" dan "Ruang N - Pengawas 2".'],
        ['Guru_Piket', 'Satu baris per hari ujian (urutan sama dengan jadwal), maksimal 10 guru per hari.'],
        ['Susulan', 'Satu baris per hari susulan.']
    ], [18, 110]);

    add('Peserta', [
        ['No', 'Nomor Ujian', 'Nama Lengkap', 'L/P', 'NISN', 'Kelas', 'Ruang', 'Nilai'],
        ...appState.students.map((s, i) => [i + 1, s.noUjian, s.nama, s.lp || 'L', s.nisn || '', s.kelas, s.ruang,
            s.nilai === undefined || s.nilai === null ? '' : s.nilai])
    ], [5, 18, 34, 6, 15, 8, 7, 7]);

    add('Panitia', [
        ['No', 'Nama Lengkap & Gelar', 'NIP', 'Jabatan Panitia', 'Jabatan Dinas'],
        ...appState.committee.map((c, i) => [i + 1, c.nama, c.nip, c.jabatanPanitia, c.jabatanDinas])
    ], [5, 34, 22, 40, 24]);

    add('Korektor', [
        ['No', 'Mata Pelajaran', 'Kelas VII', 'Kelas VIII', 'Kelas IX', 'Bentuk Soal', 'Waktu'],
        ...appState.correctors.map((c, i) => [i + 1, c.mapel, c.k7, c.k8, c.k9, c.bentuk || '', c.waktu || ''])
    ], [5, 40, 26, 26, 26, 42, 12]);

    ensureScheduleRooms();
    const n = appState.jumlahRuang;
    const ppr = getPengawasPerRuang();
    const roomHeads = [];
    for (let r = 1; r <= n; r++) {
        if (ppr === 1) roomHeads.push(`Ruang ${r} - Pengawas`);
        else roomHeads.push(`Ruang ${r} - Pengawas 1`, `Ruang ${r} - Pengawas 2`);
    }
    const jadwal = [['Hari', 'Tanggal', 'Sesi', 'Waktu', 'Mata Pelajaran', ...roomHeads]];
    appState.schedule.forEach(d => d.sesi.forEach((ss, sIdx) => {
        jadwal.push([sIdx === 0 ? d.hari : '', sIdx === 0 ? d.tanggal : '', sIdx + 1, ss.waktu, ss.mapel,
            ...ss.pengawas.slice(0, n).flatMap(p => [p[0] || '', p[1] || ''].slice(0, ppr))]);
    }));
    add('Jadwal_Pengawas', jadwal, [10, 20, 5, 14, 34, ...roomHeads.map(() => 24)]);

    const guruHeads = Array.from({ length: TPL_ROSTER_SLOTS }, (_, i) => `Guru ${i + 1}`);
    add('Guru_Piket', [
        ['Hari', ...guruHeads],
        ...appState.schedule.map((d, i) => {
            const guru = ((appState.dailyRoster || [])[i] || {}).guru || [];
            return [d.hari, ...guruHeads.map((_, k) => guru[k] || '')];
        })
    ], [10, ...guruHeads.map(() => 24)]);

    add('Susulan', [
        ['Hari / Tanggal', 'Waktu', 'Mata Pelajaran', 'Ruang', 'Pengawas'],
        ...appState.makeupSchedule.map(m => [m.hariTanggal, m.waktu || '', m.mapel, m.ruang || '', m.pengawas])
    ], [22, 28, 40, 16, 30]);

    const jenis = only ? 'Jadwal' : 'Data_Lengkap';
    XLSX.writeFile(wb, `Template_${jenis}_${appState.kegiatan.singkatan}.xlsx`);
    showToast(only ? 'Template jadwal berhasil diunduh!' : 'Template data lengkap berhasil diunduh!');
}

function downloadScheduleTemplate() {
    downloadFullTemplate(['Jadwal_Pengawas', 'Guru_Piket', 'Susulan']);
}

// ---------------------------------------------------------------------------
// PARSER PER LEMBAR — mengembalikan { data, info, warnings } atau { error }
// ---------------------------------------------------------------------------
function parseCommitteeSheet(rows) {
    const h = findHeader(rows, {
        nama: ['namalengkapgelar', 'namalengkap', 'nama'],
        nip: ['nip', 'nik', 'nuptk'],
        jabatanPanitia: ['jabatanpanitia', 'tugas', 'jabatandalampanitia'],
        jabatanDinas: ['jabatandinas', 'jabatan']
    }, 'nama');
    if (!h) return { error: 'kolom "Nama" tidak ditemukan.' };
    const data = [];
    const noJab = [];
    rows.slice(h.idx + 1).forEach((row, i) => {
        const nama = cellOf(row, h.map, 'nama');
        if (!nama) return;
        const jabatanPanitia = cellOf(row, h.map, 'jabatanPanitia');
        if (!jabatanPanitia) noJab.push(h.idx + i + 2);
        data.push({ nama, nip: cellOf(row, h.map, 'nip') || '-', jabatanDinas: cellOf(row, h.map, 'jabatanDinas'), jabatanPanitia: jabatanPanitia || 'Anggota Panitia' });
    });
    if (!data.length) return { error: 'tidak ada baris yang berisi nama.' };
    const warnings = noJab.length ? [`Jabatan Panitia kosong, diisi "Anggota Panitia". Baris: ${noJab.join(', ')}`] : [];
    return { data, info: `${data.length} orang`, warnings };
}

function parseCorrectorSheet(rows) {
    const h = findHeader(rows, {
        mapel: ['matapelajaran', 'mapel'],
        k7: ['kelasvii', 'kelas7', 'klsvii', 'vii'],
        k8: ['kelasviii', 'kelas8', 'klsviii', 'viii'],
        k9: ['kelasix', 'kelas9', 'klsix', 'ix'],
        bentuk: ['bentuksoal', 'bentuk'],
        waktu: ['waktu', 'durasi', 'alokasi']
    }, 'mapel');
    if (!h) return { error: 'kolom "Mata Pelajaran" tidak ditemukan.' };
    const data = [];
    rows.slice(h.idx + 1).forEach(row => {
        const mapel = cellOf(row, h.map, 'mapel');
        if (!mapel) return;
        data.push({
            mapel,
            k7: cellOf(row, h.map, 'k7') || '-', k8: cellOf(row, h.map, 'k8') || '-', k9: cellOf(row, h.map, 'k9') || '-',
            bentuk: cellOf(row, h.map, 'bentuk') || PT45, waktu: cellOf(row, h.map, 'waktu') || '90 Menit'
        });
    });
    if (!data.length) return { error: 'tidak ada baris yang berisi mata pelajaran.' };
    return { data, info: `${data.length} mapel`, warnings: [] };
}

function parseScheduleSheet(rows) {
    const h = findHeader(rows, {
        hari: ['hari'], tanggal: ['tanggal', 'tgl'], sesi: ['sesi', 'jamke'], waktu: ['waktu', 'jam', 'pukul'],
        mapel: ['matapelajaran', 'mapel']
    }, 'mapel');
    if (!h) return { error: 'kolom "Mata Pelajaran" tidak ditemukan.' };
    // Kolom pengawas: "Ruang 1 - Pengawas" (1 pengawas), "Ruang 1 - Pengawas 1", "R1 P2", ...
    const roomCols = [];
    h.norm.forEach((t, j) => {
        const m = t.match(/^(?:ruang|r)(\d{1,2})(?:pengawas|p)([12])?$/);
        if (m) roomCols.push({ col: j, room: parseInt(m[1], 10) - 1, slot: m[2] ? parseInt(m[2], 10) - 1 : 0 });
    });
    const valid = roomCols.filter(c => c.room >= 0 && c.room < TPL_MAX_ROOMS);
    if (!valid.length) return { error: 'kolom pengawas (mis. "Ruang 1 - Pengawas 1") tidak ditemukan.' };
    const nRooms = Math.max(...valid.map(c => c.room)) + 1;
    const ppr = valid.some(c => c.slot === 1) ? 2 : 1;

    const days = [];
    rows.slice(h.idx + 1).forEach(row => {
        const hari = cellOf(row, h.map, 'hari');
        const tanggal = cellOf(row, h.map, 'tanggal');
        const mapel = cellOf(row, h.map, 'mapel');
        const waktu = cellOf(row, h.map, 'waktu');
        const pengawas = Array.from({ length: nRooms }, () => ['', '']);
        valid.forEach(c => { pengawas[c.room][c.slot] = tplText(row[c.col]); });
        const anyProctor = pengawas.some(p => p[0] || p[1]);
        if (!mapel && !waktu && !anyProctor && !hari && !tanggal) return;
        let day = days[days.length - 1];
        const newDay = (hari || tanggal) && (!day || hari !== day.hari || tanggal !== day.tanggal);
        if (newDay || !day) { day = { hari, tanggal, sesi: [] }; days.push(day); }
        day.sesi.push({ waktu, mapel, pengawas });
    });
    if (!days.length) return { error: 'tidak ada baris jadwal.' };
    const sesiCount = days.reduce((a, d) => a + d.sesi.length, 0);
    const warnings = [];
    if (days.some(d => !d.hari)) warnings.push('Ada hari ujian tanpa nama hari; isi kolom Hari pada baris sesi pertama tiap hari.');
    const emptySlots = days.reduce((a, d) => a + d.sesi.reduce((b, ss) => b + ss.pengawas.map(p => p.slice(0, ppr)).flat().filter(v => !v).length, 0), 0);
    if (emptySlots) warnings.push(`${emptySlots} kotak pengawas kosong (bisa diisi dengan tombol "Isi Pengawas Kosong Otomatis").`);
    return {
        data: { schedule: days, jumlahRuang: nRooms, pengawasPerRuang: ppr },
        info: `${days.length} hari, ${sesiCount} sesi, ${nRooms} ruang, ${ppr} pengawas/ruang`, warnings
    };
}

function parseRosterSheet(rows) {
    const h = findHeader(rows, { hari: ['hari'] }, 'hari');
    if (!h) return { error: 'kolom "Hari" tidak ditemukan.' };
    const guruCols = h.norm.map((t, j) => /^(guru|nama|piket)\d*$/.test(t) ? j : -1).filter(j => j !== -1 && j !== h.map.hari);
    if (!guruCols.length) return { error: 'kolom "Guru 1", "Guru 2", ... tidak ditemukan.' };
    const data = [];
    rows.slice(h.idx + 1).forEach(row => {
        const hari = cellOf(row, h.map, 'hari');
        const guru = guruCols.map(j => tplText(row[j])).filter(Boolean).slice(0, TPL_ROSTER_SLOTS);
        if (!hari && !guru.length) return;
        while (guru.length < TPL_ROSTER_SLOTS) guru.push('');
        data.push({ hari, guru });
    });
    if (!data.length) return { error: 'tidak ada baris guru piket.' };
    const warnings = guruCols.length > TPL_ROSTER_SLOTS ? [`Hanya ${TPL_ROSTER_SLOTS} guru pertama per hari yang dipakai.`] : [];
    return { data, info: `${data.length} hari`, warnings };
}

function parseMakeupSheet(rows) {
    const h = findHeader(rows, {
        hariTanggal: ['haritanggal', 'tanggal', 'hari'], waktu: ['waktu', 'jam', 'pukul'],
        mapel: ['matapelajaran', 'mapel'], ruang: ['ruang', 'tempat'], pengawas: ['pengawas']
    }, 'mapel');
    if (!h) return { error: 'kolom "Mata Pelajaran" tidak ditemukan.' };
    const data = [];
    rows.slice(h.idx + 1).forEach(row => {
        const mapel = cellOf(row, h.map, 'mapel');
        const hariTanggal = cellOf(row, h.map, 'hariTanggal');
        if (!mapel && !hariTanggal) return;
        data.push({
            hariTanggal, waktu: cellOf(row, h.map, 'waktu'), mapel,
            ruang: cellOf(row, h.map, 'ruang') || 'Ruang Susulan', pengawas: cellOf(row, h.map, 'pengawas')
        });
    });
    if (!data.length) return { error: 'tidak ada baris jadwal susulan.' };
    return { data, info: `${data.length} hari`, warnings: [] };
}

function parseFullTemplate(workbook) {
    const sheets = findTemplateSheets(workbook);
    const parsers = { panitia: parseCommitteeSheet, korektor: parseCorrectorSheet, jadwal: parseScheduleSheet, piket: parseRosterSheet, susulan: parseMakeupSheet };
    const sections = [];
    Object.keys(TPL_LABELS).forEach(key => {
        const name = sheets[key];
        if (!name) return;
        let res;
        try {
            if (key === 'peserta') {
                const r = parseStudentsFromWorkbook(workbook, [], name);
                res = r.error ? r : { data: r.students, info: `${r.students.length} siswa`, warnings: r.warnings };
            } else {
                res = parsers[key](sheetRows(workbook, name));
            }
        } catch (err) {
            res = { error: 'lembar tidak dapat dibaca.' };
        }
        sections.push(Object.assign({ key, sheet: name }, res));
    });
    return sections;
}

function applyTemplateSection(sec) {
    switch (sec.key) {
        case 'peserta': appState.students = sec.data; break;
        case 'panitia': appState.committee = sec.data; break;
        case 'korektor':
            appState.correctors = sec.data;
            // Serah terima LJK mengikuti daftar mapel & korektor yang baru
            appState.handoverLjk = sec.data.map(c => ({ mapel: c.mapel, penerima: c.k7 }));
            break;
        case 'jadwal':
            appState.schedule = sec.data.schedule;
            appState.jumlahRuang = sec.data.jumlahRuang;
            appState.pengawasPerRuang = sec.data.pengawasPerRuang;
            appState.schedule.forEach((d, i) => { if (appState.dailyRoster[i] && d.hari) appState.dailyRoster[i].hari = d.hari; });
            break;
        case 'piket': appState.dailyRoster = sec.data; break;
        case 'susulan': appState.makeupSchedule = sec.data; break;
    }
}

// ---------------------------------------------------------------------------
// IMPOR TEMPLATE
// ---------------------------------------------------------------------------
function handleFullTemplateUpload(event) {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;
    if (!ensureXLSX()) { input.value = ''; return; }
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
        showToast('Template lengkap harus berupa berkas .xlsx atau .xls.');
        input.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onerror = () => { showToast('Berkas tidak dapat dibaca.'); input.value = ''; };
    reader.onload = async function (e) {
        input.value = '';
        let sections;
        try {
            sections = parseFullTemplate(XLSX.read(new Uint8Array(e.target.result), { type: 'array' }));
        } catch (err) {
            showChoiceDialog({
                title: 'Gagal membaca berkas Excel',
                html: '<p>Berkas mungkin rusak, terkunci kata sandi, atau bukan berkas Excel yang valid.</p>',
                buttons: [{ label: 'Tutup', value: null, primary: true }]
            });
            return;
        }
        const usable = sections.filter(s => !s.error);
        if (!usable.length) {
            const why = sections.length
                ? `<ul class="list-disc pl-5 space-y-1">${sections.map(s => `<li><strong>${escapeHtml(s.sheet)}</strong>: ${escapeHtml(s.error)}</li>`).join('')}</ul>`
                : '<p>Tidak ada lembar bernama Peserta, Panitia, Korektor, Jadwal_Pengawas, Guru_Piket, atau Susulan. Unduh template lengkap dari menu Data &amp; Backup sebagai contoh.</p>';
            showChoiceDialog({ title: 'Tidak ada data yang dapat diimpor', html: why, buttons: [{ label: 'Tutup', value: null, primary: true }] });
            return;
        }

        const selected = new Set(usable.map(s => s.key));
        const onChange = ev => {
            const t = ev.target;
            if (t && t.dataset && t.dataset.tplSec) t.checked ? selected.add(t.dataset.tplSec) : selected.delete(t.dataset.tplSec);
        };
        document.addEventListener('change', onChange);
        const html = `
            <p class="mb-2">Centang bagian yang ingin dimuat. Data lama pada bagian yang dicentang akan <strong>diganti</strong>.</p>
            <div class="space-y-2">
            ${sections.map(s => s.error
                ? `<div class="border border-rose-200 bg-rose-50 rounded-lg p-2 text-rose-800"><strong>${escapeHtml(TPL_LABELS[s.key])}</strong> (lembar "${escapeHtml(s.sheet)}") dilewati: ${escapeHtml(s.error)}</div>`
                : `<label class="block border border-slate-200 rounded-lg p-2 cursor-pointer hover:bg-slate-50">
                       <span class="flex items-center gap-2">
                           <input type="checkbox" data-tpl-sec="${s.key}" checked>
                           <span class="font-bold text-slate-800">${escapeHtml(TPL_LABELS[s.key])}</span>
                           <span class="text-slate-500">— ${escapeHtml(s.info)}</span>
                       </span>
                       ${s.warnings.length ? `<ul class="mt-1 ml-6 list-disc pl-4 text-amber-800 space-y-0.5">${s.warnings.map(w => `<li>${escapeHtml(w)}</li>`).join('')}</ul>` : ''}
                   </label>`).join('')}
            </div>`;
        const ok = await showChoiceDialog({
            title: `Impor "${file.name}"`,
            html,
            buttons: [{ label: 'Muat Bagian Terpilih', value: true, primary: true }, { label: 'Batal', value: false }]
        });
        document.removeEventListener('change', onChange);
        if (!ok) return;
        const chosen = usable.filter(s => selected.has(s.key));
        if (!chosen.length) { showToast('Tidak ada bagian yang dipilih.'); return; }

        const previous = JSON.stringify(appState);
        try {
            chosen.forEach(applyTemplateSection);
            ensureScheduleRooms();
            initApp();
            saveStateNow();
            showToast(`Berhasil memuat: ${chosen.map(s => TPL_LABELS[s.key]).join(', ')}.`);
        } catch (err) {
            appState = JSON.parse(previous);
            initApp();
            showToast('Impor gagal; data sebelumnya dipulihkan.');
        }
    };
    reader.readAsArrayBuffer(file);
}
