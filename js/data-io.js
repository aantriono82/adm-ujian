// ============================================================================
// 21. MANAJEMEN DATA PESERTA & EXCEL
// ============================================================================
function renderStudentTable() {
    const tbody = document.getElementById('student-table-body');
    if (!tbody) return;
    const activeStudents = getActiveStudents();
    document.getElementById('student-total-db').textContent = appState.students.length;
    document.getElementById('student-count').textContent = activeStudents.length;

    const preset = ASSESSMENT_PRESETS[appState.assessmentMode];

    tbody.innerHTML = appState.students.map((st, idx) => {
        const k = String(st.kelas || '').toUpperCase().trim();
        const isIncluded = !appState.filterByTargetGrades || preset.targetGrades.includes(gradeOf(k));
        return `
        <tr class="${isIncluded ? 'hover:bg-slate-50' : 'bg-slate-100/70 opacity-50'}">
            <td class="p-1.5 text-center text-slate-400 font-medium">${idx + 1}</td>
            <td class="p-1.5">
                <input type="text" value="${escapeHtml(st.noUjian)}" oninput="appState.students[${idx}].noUjian=this.value;renderAll()" class="w-full font-semibold text-primary-700 bg-transparent outline-none text-[10px]">
                <input type="text" value="${escapeHtml(st.nama)}" oninput="appState.students[${idx}].nama=this.value;renderAll()" class="w-full font-bold text-slate-800 bg-transparent outline-none text-[11px]">
            </td>
            <td class="p-1.5 text-center">
                <input type="text" value="${escapeHtml(st.lp || 'L')}" oninput="appState.students[${idx}].lp=this.value.toUpperCase();renderAll()" class="w-7 text-center bg-slate-100 rounded py-0.5 text-[10px] font-bold">
            </td>
            <td class="p-1.5 text-center">
                <div class="flex items-center gap-1 justify-center">
                    <input type="text" value="${escapeHtml(st.kelas)}" oninput="appState.students[${idx}].kelas=this.value;renderAll()" onchange="renderStudentTable()" class="w-8 text-center bg-slate-100 rounded py-0.5 text-[10px] font-bold" title="Kelas">
                    <input type="text" value="${escapeHtml(st.ruang)}" oninput="appState.students[${idx}].ruang=this.value;renderAll()" class="w-6 text-center bg-primary-50 text-primary-700 rounded py-0.5 text-[10px] font-bold" title="Ruang">
                </div>
            </td>
            <td class="p-1.5 text-center">
                <input type="number" min="0" max="100" value="${escapeHtml(st.nilai === undefined || st.nilai === null ? '' : st.nilai)}" oninput="appState.students[${idx}].nilai=parseNilai(this.value);renderAll()" class="w-10 text-center bg-emerald-50 text-emerald-800 rounded py-0.5 text-[10px] font-bold">
            </td>
            <td class="p-1.5 text-center">
                <button onclick="appState.students.splice(${idx},1);renderStudentTable();renderAll()" class="text-slate-400 hover:text-rose-600"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </td>
        </tr>`;
    }).join('');
    if (!appState.students.length) tbody.innerHTML = emptyRowHTML(6, 'users', 'Daftar peserta masih kosong',
        'Impor dari Excel (pakai template agar kolomnya cocok) atau tambah peserta satu per satu.',
        `<button onclick="document.getElementById('excel-upload').click()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer">Impor Excel</button>
         <button onclick="downloadTemplateExcel()" class="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer">Unduh Template</button>`);
    refreshIcons();
}

function openAddStudentModal() {
    document.getElementById('add-student-box').classList.toggle('hidden');
}

function addStudentManual() {
    const noUjian = document.getElementById('new-no').value.trim();
    const nama = document.getElementById('new-nama').value.trim();
    const lp = document.getElementById('new-lp').value;
    const nisn = document.getElementById('new-nisn').value.trim();
    const kelas = document.getElementById('new-kelas').value;
    const ruang = document.getElementById('new-ruang').value.trim() || '1';

    if (!nama) {
        showToast("Nama peserta wajib diisi!");
        return;
    }

    appState.students.push({
        noUjian: noUjian || `03-527-${String(appState.students.length + 1).padStart(3, '0')}`,
        nama, lp, nisn, kelas, ruang, nilai: ''
    });

    document.getElementById('new-no').value = '';
    document.getElementById('new-nama').value = '';
    document.getElementById('new-nisn').value = '';
    document.getElementById('add-student-box').classList.add('hidden');

    renderStudentTable();
    renderAll();
    showToast("Peserta baru berhasil ditambahkan!");
}

function resetDefaultStudents() {
    if (appState.students.length && !confirm(`Ganti ${appState.students.length} peserta saat ini dengan data contoh?`)) return;
    appState.students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    renderStudentTable();
    renderAll();
    showToast("Data contoh peserta Kelas VII, VIII, IX berhasil dimuat ulang.");
}

function downloadTemplateExcel() {
    if (!ensureXLSX()) return;
    const rows = appState.students.map((s, i) => ({
        "No": i + 1,
        "Nomor Ujian": s.noUjian,
        "Nama Lengkap": s.nama,
        "L/P": s.lp || "L",
        "NISN": s.nisn || "",
        "Kelas": s.kelas,
        "Ruang": s.ruang,
        "Nilai": s.nilai === undefined || s.nilai === null ? "" : s.nilai
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 5 }, { wch: 18 }, { wch: 34 }, { wch: 6 }, { wch: 15 }, { wch: 10 }, { wch: 8 }, { wch: 8 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Database_Peserta");
    XLSX.writeFile(wb, `Template_Peserta_${appState.kegiatan.singkatan}.xlsx`);
    showToast("Format Excel berhasil diunduh!");
}

// ---------------------------------------------------------------------------
// IMPOR PESERTA DARI EXCEL / CSV
// - Baris judul di atas tabel (mis. "DAFTAR PESERTA ...") dilewati otomatis
// - Setiap baris divalidasi; masalah ditampilkan sebelum data diterapkan
// - Pengguna memilih: ganti data lama, tambahkan, atau batal
// ---------------------------------------------------------------------------
const EXCEL_HEADER_ALIASES = {
    noUjian: ['nomorujian', 'noujian', 'nopeserta', 'nomorpeserta', 'nopes'],
    nama: ['namalengkap', 'namasiswa', 'namapeserta', 'nama'],
    lp: ['lp', 'jk', 'jeniskelamin', 'kelamin', 'gender'],
    nisn: ['nisn', 'nis'],
    kelas: ['kelas', 'rombel', 'tingkat'],
    ruang: ['ruang', 'ruangan', 'noruang', 'lokal'],
    nilai: ['nilaiakhir', 'nilai', 'skor']
};
// Kolom yang mengandung kata "nama" tetapi bukan nama peserta
const EXCEL_NAMA_EXCLUDE = ['ayah', 'ibu', 'wali', 'ortu', 'orangtua', 'sekolah', 'guru', 'pengawas'];
const EXCEL_ALLOWED_EXT = /\.(xlsx|xls|csv)$/i;

function normalizeHeader(h) {
    return String(h === undefined || h === null ? '' : h).toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Petakan setiap field ke indeks kolom: cocok persis dulu, baru cocok sebagian
function mapExcelHeaders(headerRow) {
    const norm = headerRow.map(normalizeHeader);
    const used = new Set();
    const map = {};
    const pick = (field, predicate) => {
        for (const alias of EXCEL_HEADER_ALIASES[field]) {
            const idx = norm.findIndex((h, i) => !used.has(i) && h && predicate(h, alias) &&
                !(field === 'nama' && EXCEL_NAMA_EXCLUDE.some(x => h.includes(x))));
            if (idx !== -1) { map[field] = idx; used.add(idx); return; }
        }
    };
    const fields = Object.keys(EXCEL_HEADER_ALIASES);
    fields.forEach(f => pick(f, (h, a) => h === a));
    fields.filter(f => map[f] === undefined).forEach(f => pick(f, (h, a) => h.includes(a)));
    return map;
}

function parseNilai(v) {
    const t = String(v === undefined || v === null ? '' : v).trim().replace(',', '.');
    if (t === '') return '';
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0 || n > 100) return '';
    return Math.round(n * 100) / 100;
}

function normalizeLP(v) {
    const t = String(v || '').trim().toUpperCase();
    if (!t) return '';
    if (/^(L|LK|LAKI|LAKI-LAKI|LAKI LAKI|PRIA|M|MALE)$/.test(t)) return 'L';
    if (/^(P|PR|PEREMPUAN|WANITA|W|F|FEMALE)$/.test(t)) return 'P';
    return '';
}

// Ubah isi workbook menjadi daftar peserta + daftar peringatan
function parseStudentsFromWorkbook(workbook, existingStudents, sheetName) {
    const name = sheetName || workbook.SheetNames[0];
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, blankrows: false });
    if (!rows.length) return { error: sheetName ? `Lembar "${name}" kosong.` : 'Lembar pertama berkas Excel kosong.' };

    // Cari baris judul kolom (yang memuat kolom Nama) di 20 baris pertama
    let headerIdx = -1, map = null;
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const m = mapExcelHeaders(rows[i]);
        if (m.nama !== undefined) { headerIdx = i; map = m; break; }
    }
    if (headerIdx === -1) {
        return { error: 'Kolom "Nama" tidak ditemukan. Pastikan ada baris judul kolom seperti: Nomor Ujian, Nama Lengkap, L/P, NISN, Kelas, Ruang, Nilai. Gunakan tombol "Unduh Format Excel" sebagai contoh.' };
    }

    const cell = (row, field) => map[field] === undefined ? '' : String(row[map[field]] === undefined ? '' : row[map[field]]).trim();
    const warn = { kelas: [], lp: [], ruang: [], noUjian: [], nilai: [], dupNo: [], dupNisn: [] };
    const students = [];
    const seenNo = new Map(), seenNisn = new Map();
    (existingStudents || []).forEach(s => {
        if (s.noUjian) seenNo.set(String(s.noUjian).trim(), 'data lama');
        if (s.nisn) seenNisn.set(String(s.nisn).trim(), 'data lama');
    });
    let nextAutoNo = (existingStudents || []).length + 1;

    for (let i = headerIdx + 1; i < rows.length; i++) {
        const row = rows[i];
        const excelRow = i + 1; // nomor baris seperti terlihat di Excel
        const nama = cell(row, 'nama');
        if (!nama) continue;

        let noUjian = cell(row, 'noUjian');
        if (!noUjian) {
            noUjian = `03-527-${String(nextAutoNo).padStart(3, '0')}`;
            warn.noUjian.push(excelRow);
        }
        nextAutoNo++;

        const lpRaw = cell(row, 'lp');
        let lp = normalizeLP(lpRaw);
        if (!lp) { lp = 'L'; warn.lp.push(excelRow); }

        const kelas = cell(row, 'kelas');
        if (!gradeOf(kelas)) warn.kelas.push(excelRow);

        let ruang = cell(row, 'ruang');
        if (!ruang) { ruang = '1'; warn.ruang.push(excelRow); }

        const nilaiRaw = cell(row, 'nilai');
        const nilai = parseNilai(nilaiRaw);
        if (nilaiRaw !== '' && nilai === '') warn.nilai.push(excelRow);

        const nisn = cell(row, 'nisn');
        if (seenNo.has(noUjian)) warn.dupNo.push(`${excelRow} (${noUjian})`);
        else seenNo.set(noUjian, excelRow);
        if (nisn) {
            if (seenNisn.has(nisn)) warn.dupNisn.push(`${excelRow} (${nisn})`);
            else seenNisn.set(nisn, excelRow);
        }

        students.push({ noUjian, nama, lp, nisn, kelas, ruang, nilai });
    }

    if (!students.length) {
        return { error: `Judul kolom ditemukan di baris ${headerIdx + 1}, tetapi tidak ada baris peserta yang memiliki Nama.` };
    }

    const list = rowsArr => rowsArr.length > 6 ? rowsArr.slice(0, 6).join(', ') + `, … (+${rowsArr.length - 6})` : rowsArr.join(', ');
    const warnings = [];
    if (warn.kelas.length) warnings.push(`Kelas kosong / tidak dikenali (harus VII, VIII, IX atau 7, 8, 9) — peserta ini tidak akan masuk dokumen bila filter kelas aktif. Baris: ${list(warn.kelas)}`);
    if (warn.dupNo.length) warnings.push(`Nomor Ujian ganda pada baris: ${list(warn.dupNo)}`);
    if (warn.dupNisn.length) warnings.push(`NISN ganda pada baris: ${list(warn.dupNisn)}`);
    if (warn.lp.length) warnings.push(`L/P kosong / tidak dikenali, diisi "L". Baris: ${list(warn.lp)}`);
    if (warn.ruang.length) warnings.push(`Ruang kosong, diisi "1". Baris: ${list(warn.ruang)}`);
    if (warn.noUjian.length) warnings.push(`Nomor Ujian kosong, dibuat otomatis. Baris: ${list(warn.noUjian)}`);
    if (warn.nilai.length) warnings.push(`Nilai bukan angka 0–100, dikosongkan. Baris: ${list(warn.nilai)}`);
    const missingCols = ['noUjian', 'lp', 'kelas', 'ruang'].filter(f => map[f] === undefined);
    if (missingCols.length) {
        const label = { noUjian: 'Nomor Ujian', lp: 'L/P', kelas: 'Kelas', ruang: 'Ruang' };
        warnings.unshift(`Kolom tidak ditemukan: ${missingCols.map(f => label[f]).join(', ')}.`);
    }
    return { students, warnings };
}

// Berkas template lengkap: pakai lembar "Peserta"; berkas biasa: lembar pertama
function pesertaSheetName(workbook) {
    return workbook.SheetNames.find(n => /peserta|siswa/.test(normalizeHeader(n))) || workbook.SheetNames[0];
}

function handleExcelUpload(event) {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;
    if (!ensureXLSX()) { input.value = ''; return; }
    if (!EXCEL_ALLOWED_EXT.test(file.name)) {
        showToast('Format berkas harus .xlsx, .xls, atau .csv.');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onerror = () => { showToast('Berkas tidak dapat dibaca.'); input.value = ''; };
    reader.onload = async function (e) {
        input.value = '';
        let result;
        try {
            const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
            result = parseStudentsFromWorkbook(workbook, [], pesertaSheetName(workbook));
        } catch (err) {
            showChoiceDialog({
                title: 'Gagal membaca berkas Excel',
                html: `<p>Berkas mungkin rusak, terkunci kata sandi, atau bukan berkas Excel yang valid.</p>`,
                buttons: [{ label: 'Tutup', value: null, primary: true }]
            });
            return;
        }
        if (result.error) {
            showChoiceDialog({
                title: 'Tidak ada data peserta yang dapat diimpor',
                html: `<p>${escapeHtml(result.error)}</p>`,
                buttons: [{ label: 'Tutup', value: null, primary: true }]
            });
            return;
        }

        const existing = appState.students.length;
        const warnHtml = result.warnings.length
            ? `<div class="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900">
                   <p class="font-bold mb-1">Perlu diperiksa:</p>
                   <ul class="list-disc pl-5 space-y-1">${result.warnings.map(w => `<li>${escapeHtml(w)}</li>`).join('')}</ul>
               </div>`
            : `<p class="mt-2 text-emerald-700 font-semibold">Semua baris valid.</p>`;
        const buttons = existing
            ? [
                { label: `Ganti ${existing} peserta lama`, value: 'replace', primary: true },
                { label: 'Tambahkan ke data lama', value: 'append' },
                { label: 'Batal', value: null }
              ]
            : [{ label: 'Impor', value: 'replace', primary: true }, { label: 'Batal', value: null }];

        const choice = await showChoiceDialog({
            title: `Ditemukan ${result.students.length} peserta di "${file.name}"`,
            html: warnHtml,
            buttons
        });
        if (!choice) return;

        let imported = result.students;
        if (choice === 'append') {
            // Ulangi validasi agar nomor otomatis & pengecekan ganda memperhitungkan data lama
            const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
            const res2 = parseStudentsFromWorkbook(workbook, appState.students, pesertaSheetName(workbook));
            imported = res2.students;
            if (res2.warnings.some(w => /ganda/.test(w))) {
                showToast('Perhatian: ada Nomor Ujian/NISN yang sama dengan data lama.');
            }
            appState.students = appState.students.concat(imported);
        } else {
            appState.students = imported;
        }
        renderStudentTable();
        renderAll();
        showToast(`Berhasil memuat ${imported.length} peserta dari Excel!`);
    };
    reader.readAsArrayBuffer(file);
}

// ============================================================================
// 22. FITUR SIMPAN & MUAT KONFIGURASI SEMESTER/TAHUN (.JSON)
// ============================================================================
function saveConfigJSON() {
    // Foto profil pengembang tidak ikut dicadangkan (bukan data sekolah, memperbesar berkas)
    const toSave = Object.assign({}, appState);
    delete toSave.developerPhoto;
    const dataStr = JSON.stringify(toSave, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Administrasi_${appState.kegiatan.singkatan}_${String(appState.kegiatan.tapelAngka || '').replace(/[\\/:*?"<>|]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Backup pengaturan semester/tahun berhasil disimpan!");
}

function loadConfigJSON(event) {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
        showToast('Berkas backup terlalu besar (maksimal 20 MB).');
        input.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = async function (e) {
        input.value = '';
        let loaded;
        try {
            loaded = JSON.parse(e.target.result);
            sanitizeLoadedState(loaded); // validasi dulu sebelum menyentuh data aktif
        } catch (err) {
            showChoiceDialog({
                title: 'Berkas backup tidak dapat dimuat',
                html: `<p>${escapeHtml(err instanceof SyntaxError ? 'Isi berkas bukan JSON yang valid (mungkin rusak atau terpotong).' : err.message)}</p>`,
                buttons: [{ label: 'Tutup', value: null, primary: true }]
            });
            return;
        }
        const ok = await showChoiceDialog({
            title: `Muat backup "${file.name}"?`,
            html: `<p>Seluruh data yang sedang terbuka (${appState.students.length} peserta, pengaturan, jadwal, panitia) akan <strong>diganti</strong> dengan isi backup. Simpan backup data saat ini dulu bila masih diperlukan.</p>`,
            buttons: [{ label: 'Muat & Ganti', value: true, primary: true }, { label: 'Batal', value: false }]
        });
        if (!ok) return;

        const previous = JSON.stringify(appState);
        try {
            const warnings = mergeIntoState(loaded);
            initApp();
            saveStateNow();
            if (warnings.length) {
                showChoiceDialog({
                    title: 'Backup dimuat dengan beberapa perbaikan',
                    html: `<ul class="list-disc pl-5 space-y-1">${warnings.map(w => `<li>${escapeHtml(w)}</li>`).join('')}</ul>`,
                    buttons: [{ label: 'OK', value: null, primary: true }]
                });
            } else {
                showToast("Pengaturan semester/tahun berhasil dimuat!");
            }
        } catch (err) {
            // Kembalikan data sebelumnya agar aplikasi tidak tertinggal dalam keadaan rusak
            appState = JSON.parse(previous);
            initApp();
            showToast("Backup tidak kompatibel; data sebelumnya dipulihkan.");
        }
    };
    reader.readAsText(file);
}
