// Uji asap (smoke test) seluruh menu & fitur di Chrome headless, dalam mode OFFLINE.
// Jalankan: npm install && npm test
// Ubah lokasi Chrome dengan variabel CHROME_PATH bila perlu.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'index.html');
const OUT = path.join(ROOT, 'test-output');
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';

let failures = 0;
const ok = (cond, label, extra = '') => {
    console.log(`${cond ? '  ✔' : '  ✘'} ${label}${extra ? ' — ' + extra : ''}`);
    if (!cond) failures++;
};

async function download(page, trigger, clickText) {
    const dl = page.waitForEvent('download', { timeout: 60000 });
    await page.evaluate(trigger);
    if (clickText) {
        const btn = await page.waitForSelector(`button:has-text("${clickText}")`, { timeout: 5000 }).catch(() => null);
        if (btn) await btn.click();
    }
    const d = await dl;
    const file = path.join(OUT, d.suggestedFilename());
    await d.saveAs(file);
    return file;
}

async function dialogText(page) {
    const el = await page.waitForSelector('[role=dialog]', { timeout: 5000 }).catch(() => null);
    return el ? el.innerText() : null;
}
async function closeDialog(page, label) {
    const btn = await page.$(`[role=dialog] button:has-text("${label}")`);
    if (btn) await btn.click();
}

(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ offline: true, acceptDownloads: true, viewport: { width: 1500, height: 950 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    page.on('requestfailed', r => errors.push('request gagal: ' + r.url()));
    page.on('dialog', d => d.accept());

    console.log('1. Memuat aplikasi tanpa internet');
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForTimeout(800);
    const env = await page.evaluate(() => ({
        xlsx: typeof XLSX, lucide: typeof lucide,
        tailwind: getComputedStyle(document.querySelector('.bg-blue-600')).backgroundColor,
        font: document.fonts.check('12px Inter'),
        docModes: [...document.querySelectorAll('#doc-mode-select option')].map(o => o.value)
    }));
    ok(env.xlsx === 'object', 'SheetJS termuat dari vendor/');
    ok(env.lucide === 'object', 'Ikon Lucide termuat dari vendor/');
    ok(env.tailwind === 'rgb(37, 99, 235)', 'CSS Tailwind lokal diterapkan', env.tailwind);
    ok(env.font, 'Font Inter lokal tersedia');

    console.log('2. Render 3 mode asesmen × semua dokumen');
    const renderIssues = await page.evaluate(docModes => {
        const issues = [];
        for (const am of ['ASAS', 'ASAT', 'ASAJ']) {
            switchAssessmentMode(am);
            for (const dm of docModes) {
                try {
                    setDocMode(dm);
                    const c = document.getElementById('sheets-container');
                    if (!c.querySelector('.print-sheet')) issues.push(`${am}/${dm}: kosong`);
                    const m = c.innerText.match(/.{0,30}\b(undefined|NaN|\[object Object\])\b.{0,30}/);
                    if (m) issues.push(`${am}/${dm}: "${m[0]}"`);
                } catch (e) { issues.push(`${am}/${dm}: ${e.message}`); }
            }
        }
        switchAssessmentMode('ASAS');
        return issues;
    }, env.docModes);
    ok(renderIssues.length === 0, `${env.docModes.length * 3} kombinasi dokumen tampil`, renderIssues.join('; '));

    console.log('2b. Mode gelap tidak mengubah warna isi dokumen');
    const darkDiff = await page.evaluate(docModes => {
        const snap = () => [...document.querySelectorAll('#sheets-container .print-sheet, #sheets-container .print-sheet *')]
            .filter(el => !el.closest('.no-print'))
            .map(el => { const c = getComputedStyle(el); return [c.color, c.backgroundColor, c.borderTopColor].join('|'); });
        const issues = [];
        for (const dm of docModes) {
            setDocMode(dm);
            document.documentElement.classList.remove('dark'); const light = snap();
            document.documentElement.classList.add('dark'); const dark = snap();
            document.documentElement.classList.remove('dark');
            const n = light.length === dark.length ? light.filter((x, i) => x !== dark[i]).length : -1;
            if (n) issues.push(`${dm}: ${n < 0 ? 'struktur berbeda' : n + ' elemen beda warna'}`);
        }
        return issues;
    }, env.docModes);
    ok(darkDiff.length === 0, `Warna ${env.docModes.length} dokumen sama di mode terang & gelap`, darkDiff.join('; '));

    console.log('3. Tab & tombol aksi');
    const actionIssues = await page.evaluate(() => {
        const issues = [];
        const run = (label, fn) => { try { fn(); } catch (e) { issues.push(`${label}: ${e.message}`); } };
        ['mode', 'kop', 'panitia', 'jadwal', 'ruang', 'peserta', 'laporan'].forEach(t => run('tab ' + t, () => switchTab(t)));
        run('tambah panitia', addCommitteeMember);
        run('tambah korektor', addCorrectorRow);
        run('tambah anggaran', addBudgetItem);
        run('isi pengawas', fillEmptyProctors);
        run('rotasi pengawas', () => rotateProctorsForSesi(0, 1));
        run('tanggal otomatis', () => applyAutoDates(true));
        run('zoom', () => { adjustZoom(0.1); adjustZoom(-0.1); resetZoom(); });
        run('sidebar', () => { toggleSidebar(); toggleSidebar(); });
        run('modal pengembang', () => { toggleDeveloperModal(true); toggleDeveloperModal(false); });
        run('tema gelap', () => { toggleTheme(); toggleTheme(); });
        run('menu sidebar', () => {
            ['mode', 'kop', 'panitia', 'jadwal', 'peserta', 'ruang', 'laporan'].forEach(openSection);
            if (document.getElementById('panel-title').textContent !== 'Nilai & LPJ') throw new Error('judul panel tidak berubah');
            toggleNavCollapsed(); toggleNavCollapsed(); toggleNavDrawer(true); toggleNavDrawer(false); openSection('mode');
        });
        run('galeri dokumen', () => { renderDocGallery(); stepDocMode(1); stepDocMode(-1); });
        run('zoom pas halaman', () => { fitPageZoom(); fitZoom(); gotoSheet(1); });
        run('tanda kelengkapan tab', () => { updateTabBadges(); if (!document.querySelector('.tab-badge')) throw new Error('lencana tidak muncul'); });
        return issues;
    });
    ok(actionIssues.length === 0, 'Semua aksi berjalan', actionIssues.join('; '));

    console.log('4. Mengetik di kolom Kelas tidak kehilangan fokus');
    await page.evaluate(() => switchTab('peserta'));
    const kelasInput = page.locator('#student-table-body input[title="Kelas"]').first();
    await kelasInput.fill('');
    await kelasInput.type('VIII');
    ok(await kelasInput.inputValue() === 'VIII', 'Kolom Kelas menerima ketikan utuh', await kelasInput.inputValue());
    await page.evaluate(() => { appState.students[0].kelas = 'VII'; renderStudentTable(); renderAll(); });

    console.log('5. Ekspor');
    const xlsxFile = await download(page, () => exportExcelOutput());
    ok(fs.statSync(xlsxFile).size > 5000, 'Excel administrasi lengkap', path.basename(xlsxFile));
    const tplFile = await download(page, () => downloadTemplateExcel());
    ok(fs.statSync(tplFile).size > 5000, 'Template Excel peserta', path.basename(tplFile));
    const jsonFile = await download(page, () => saveConfigJSON());
    const backup = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    ok(!('developerPhoto' in backup) && Array.isArray(backup.students), 'Backup JSON (tanpa foto pengembang)');

    const wordIssues = [];
    for (const dm of env.docModes) {
        await page.evaluate(dm => setDocMode(dm), dm);
        try {
            const f = await download(page, () => { exportWord(); }, 'Tetap unduh Word');
            const head = fs.readFileSync(f).subarray(0, 2).toString();
            if (head !== 'PK' || fs.statSync(f).size < 5000) wordIssues.push(dm + ': berkas tidak valid');
        } catch (e) { wordIssues.push(dm + ': ' + e.message.split('\n')[0]); }
    }
    ok(wordIssues.length === 0, `Word (.docx) untuk ${env.docModes.length} dokumen`, wordIssues.join('; '));

    console.log('6. Impor Excel');
    const makeXlsx = rows => page.evaluate(rows => {
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        return Array.from(new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' })));
    }, rows).then(a => Buffer.from(a));
    const upload = (selector, name, buffer, mimeType) =>
        page.setInputFiles(selector, { name, mimeType, buffer });
    const EXCEL = 'input[onchange*="handleExcelUpload"]';

    await upload(EXCEL, 'template.xlsx', fs.readFileSync(tplFile), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    let txt = await dialogText(page);
    ok(txt && /Ditemukan 40 peserta/.test(txt), 'Template dibaca: 40 peserta', txt && txt.split('\n')[0]);
    await closeDialog(page, 'Tambahkan');
    ok(await page.evaluate(() => appState.students.length) === 80, 'Mode "Tambahkan" menambah data (80 peserta)');

    const messy = await makeXlsx([
        ['DAFTAR PESERTA ASESMEN'], [''],
        ['No', 'Nama Siswa', 'Jenis Kelamin', 'NISN', 'Rombel', 'Ruangan', 'Nilai Akhir', 'Nama Ayah'],
        [1, 'Andi', 'Laki-laki', '0012', '7A', '1', '88,5', 'Pak Andi'],
        [2, 'Budi', 'perempuan?', '0012', '', '', 'abc', 'Pak Budi'],
        [3, '', '', '', '', '', '', '']
    ]);
    await upload(EXCEL, 'berantakan.xlsx', messy, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    txt = await dialogText(page);
    ok(txt && /Ditemukan 2 peserta/.test(txt), 'Baris judul di atas tabel dilewati');
    ok(txt && /Kelas kosong/.test(txt) && /NISN ganda/.test(txt) && /Nilai bukan angka/.test(txt) && /L\/P/.test(txt),
        'Peringatan validasi tampil (kelas, NISN ganda, nilai, L/P)');
    await closeDialog(page, 'Ganti');
    const imported = await page.evaluate(() => appState.students);
    ok(imported.length === 2 && imported[0].nama === 'Andi' && imported[0].nilai === 88.5 && imported[0].lp === 'L' && imported[1].nilai === '',
        'Mode "Ganti" + konversi nilai "88,5" dan L/P', JSON.stringify(imported[0]));

    const noName = await makeXlsx([['Kode', 'Alamat'], ['1', 'Jl. A']]);
    await upload(EXCEL, 'tanpa-nama.xlsx', noName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    txt = await dialogText(page);
    ok(txt && /Kolom "Nama" tidak ditemukan/.test(txt), 'Berkas tanpa kolom Nama → pesan jelas');
    await closeDialog(page, 'Tutup');

    console.log('6b. Template data lengkap (unduh & impor)');
    const fullTpl = await download(page, () => downloadFullTemplate());
    const fullBuf = fs.readFileSync(fullTpl);
    const sheetNames = await page.evaluate(a => XLSX.read(new Uint8Array(a), { type: 'array' }).SheetNames, Array.from(fullBuf));
    ok(['Petunjuk', 'Peserta', 'Panitia', 'Korektor', 'Jadwal_Pengawas', 'Guru_Piket', 'Susulan'].every(n => sheetNames.includes(n)),
        'Template lengkap berisi 7 lembar', sheetNames.join(', '));

    const jadwalTpl = await download(page, () => downloadScheduleTemplate());
    const jadwalSheets = await page.evaluate(a => XLSX.read(new Uint8Array(a), { type: 'array' }).SheetNames, Array.from(fs.readFileSync(jadwalTpl)));
    ok(jadwalSheets.join() === 'Petunjuk,Jadwal_Pengawas,Guru_Piket,Susulan', 'Template jadwal hanya berisi lembar jadwal', jadwalSheets.join(', '));

    // Template lengkap lewat tombol impor peserta → lembar "Peserta" yang dibaca, bukan "Petunjuk"
    await upload(EXCEL, 'lengkap.xlsx', fullBuf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    txt = await dialogText(page);
    ok(txt && /Ditemukan 2 peserta/.test(txt), 'Impor peserta membaca lembar Peserta dari template lengkap', txt && txt.split('\n')[0]);
    await closeDialog(page, 'Batal');

    // Ubah isi template: panitia baru, jadwal 1 hari 2 sesi dengan 4 ruang, piket & susulan
    const editedTpl = await page.evaluate(a => {
        const wb = XLSX.read(new Uint8Array(a), { type: 'array' });
        const put = (name, aoa) => { wb.Sheets[name] = XLSX.utils.aoa_to_sheet(aoa); };
        put('Panitia', [['No', 'Nama Lengkap & Gelar', 'NIP', 'Jabatan Panitia', 'Jabatan Dinas'],
            [1, 'Kepala Uji, M.Pd.', '1975', 'Penanggung Jawab', 'Kepala Sekolah'],
            [2, 'Ketua Uji, S.Pd.', '1980', 'Ketua Pelaksana', 'Waka Kurikulum'],
            [3, 'Anggota Uji', '', '', 'Guru']]);
        put('Korektor', [['No', 'Mata Pelajaran', 'Kelas VII', 'Kelas VIII', 'Kelas IX', 'Bentuk Soal', 'Waktu'],
            [1, 'Mapel Uji', 'Guru A', 'Guru B', 'Guru C', '', '60 Menit']]);
        const heads = []; for (let r = 1; r <= 4; r++) heads.push(`Ruang ${r} - Pengawas 1`, `Ruang ${r} - Pengawas 2`);
        put('Jadwal_Pengawas', [['Hari', 'Tanggal', 'Sesi', 'Waktu', 'Mata Pelajaran', ...heads],
            ['Senin', '1 Desember 2026', 1, '07.30 - 09.00', 'Matematika', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'],
            ['', '', 2, '09.30 - 11.00', 'IPA', 'P2', 'P1', 'P4', 'P3', 'P6', 'P5', 'P8', ''],
            ['Selasa', '2 Desember 2026', 1, '07.30 - 09.00', 'IPS', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8']]);
        put('Guru_Piket', [['Hari', 'Guru 1', 'Guru 2'], ['Senin', 'Piket A', 'Piket B'], ['Selasa', 'Piket C', '']]);
        put('Susulan', [['Hari / Tanggal', 'Waktu', 'Mata Pelajaran', 'Ruang', 'Pengawas'], ['Senin, 8 Des 2026', '07.30', 'Matematika', '', 'Pengawas S']]);
        return Array.from(new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' })));
    }, Array.from(fullBuf)).then(a => Buffer.from(a));
    await page.setInputFiles('#full-template-upload', { name: 'lengkap-diisi.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: editedTpl });
    txt = await dialogText(page);
    ok(txt && /3 orang/.test(txt) && /2 hari, 3 sesi, 4 ruang, 2 pengawas/.test(txt) && /1 kotak pengawas kosong/.test(txt) && /Jabatan Panitia kosong/.test(txt),
        'Ringkasan impor per lembar + peringatan', txt && txt.replace(/\n+/g, ' | ').slice(0, 300));
    await page.uncheck('[role=dialog] input[data-tpl-sec="peserta"]');
    await closeDialog(page, 'Muat Bagian Terpilih');
    const after = await page.evaluate(() => ({
        students: appState.students.length, committee: appState.committee.map(c => c.nama), jab3: appState.committee[2].jabatanPanitia,
        rooms: appState.jumlahRuang, days: appState.schedule.length, sesi: appState.schedule[0].sesi.length,
        r4: appState.schedule[0].sesi[0].pengawas[3], ljk: appState.handoverLjk.length, piket: appState.dailyRoster[0].guru.slice(0, 2),
        susulan: appState.makeupSchedule[0].pengawas, roomInput: document.getElementById('input-jumlah-ruang').value
    }));
    ok(after.students === 2, 'Bagian yang tidak dicentang (Peserta) tidak diubah');
    ok(after.committee.length === 3 && after.jab3 === 'Anggota Panitia', 'Panitia diganti dari template', after.committee.join(', '));
    ok(after.rooms === 4 && after.roomInput === '4' && after.days === 2 && after.sesi === 2 && after.r4.join() === 'P7,P8',
        'Jadwal & pengawas 4 ruang dimuat', JSON.stringify(after.r4));
    ok(after.ljk === 1 && after.piket.join() === 'Piket A,Piket B' && after.susulan === 'Pengawas S', 'Korektor, guru piket & susulan dimuat');
    await page.evaluate(() => setDocMode('jadwal_pengawas'));
    ok(await page.evaluate(() => /Piket A/.test(document.getElementById('sheets-container').innerText)), 'Guru piket tampil di dokumen jadwal');

    console.log('6c. Pengawas per ruang: 1 atau 2');
    const one = await page.evaluate(() => {
        setPengawasPerRuang(1);
        const editorInputs = document.querySelectorAll('#schedule-editor-container input[placeholder^="Pengawas"]').length;
        const docs = {};
        for (const dm of ['jadwal_pengawas', 'dh_pengawas', 'berita_acara', 'denah', 'pos']) {
            setDocMode(dm);
            docs[dm] = document.getElementById('sheets-container').innerText;
        }
        // data pengawas 2 tetap tersimpan meski disembunyikan
        const kept = appState.schedule[0].sesi[0].pengawas[0][1];
        appState.schedule[0].sesi[0].pengawas[0][0] = '';
        fillEmptyProctors();
        const filledSlot2 = appState.schedule[0].sesi[0].pengawas[0][1];
        return { editorInputs, docs, kept, filledSlot2, label2Hidden: document.getElementById('field-pengawas2').classList.contains('hidden') };
    });
    ok(one.editorInputs === 4 * 2 + 4 * 1, 'Editor hanya menampilkan 1 kotak pengawas per ruang', String(one.editorInputs));
    ok(!/Pengawas 2/.test(one.docs.jadwal_pengawas) && !/Pengawas II/.test(one.docs.berita_acara) && /Pengawas Ruang,/.test(one.docs.berita_acara),
        'Dokumen jadwal & berita acara memakai 1 pengawas');
    ok(!/PENGAWAS 2/.test(one.docs.denah) && /1 \(satu\) orang pengawas/.test(one.docs.pos) && one.label2Hidden, 'Denah, POS & label meja menyesuaikan');
    ok(one.kept === 'P2' && one.filledSlot2 === 'P2', 'Nama pengawas 2 tetap tersimpan & tidak diisi ulang otomatis');
    const tpl1 = await download(page, () => downloadScheduleTemplate());
    const head1 = await page.evaluate(a => {
        const wb = XLSX.read(new Uint8Array(a), { type: 'array' });
        return XLSX.utils.sheet_to_json(wb.Sheets.Jadwal_Pengawas, { header: 1 })[0];
    }, Array.from(fs.readFileSync(tpl1)));
    ok(head1.includes('Ruang 1 - Pengawas') && !head1.some(h => /Pengawas 2/.test(h)), 'Template jadwal: 1 kolom pengawas per ruang', head1.slice(5, 8).join(', '));
    await page.evaluate(() => setPengawasPerRuang(2));
    await page.setInputFiles('#full-template-upload', { name: 'satu-pengawas.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: fs.readFileSync(tpl1) });
    txt = await dialogText(page);
    ok(txt && /1 pengawas\/ruang/.test(txt), 'Impor template 1 pengawas dikenali');
    await closeDialog(page, 'Muat Bagian Terpilih');
    ok(await page.evaluate(() => appState.pengawasPerRuang === 1 && document.getElementById('input-pengawas-per-ruang').value === '1'),
        'Impor mengubah pengaturan menjadi 1 pengawas per ruang');
    await page.evaluate(() => setPengawasPerRuang(2));

    console.log('7. Muat backup JSON');
    const JSONIN = 'input[onchange*="loadConfigJSON"]';
    await upload(JSONIN, 'backup.json', fs.readFileSync(jsonFile), 'application/json');
    await dialogText(page);
    await closeDialog(page, 'Muat & Ganti');
    await page.waitForTimeout(300);
    ok(await page.evaluate(() => appState.students.length) === backup.students.length, 'Backup dipulihkan');

    const evil = Object.assign({}, backup, { kop: Object.assign({}, backup.kop, { logoKiri: 'x" onerror="window.__xss=1' }), students: 'rusak' });
    await upload(JSONIN, 'jahat.json', Buffer.from(JSON.stringify(evil)), 'application/json');
    await dialogText(page);
    await closeDialog(page, 'Muat & Ganti');
    txt = await dialogText(page);
    ok(txt && /logoKiri/.test(txt) && /students/.test(txt), 'Logo berbahaya & data rusak ditolak dengan peringatan');
    await closeDialog(page, 'OK');
    ok(await page.evaluate(() => !window.__xss && appState.kop.logoKiri.startsWith('data:image/')), 'Tidak ada skrip yang tereksekusi');

    await upload(JSONIN, 'rusak.json', Buffer.from('{rusak'), 'application/json');
    txt = await dialogText(page);
    ok(txt && /bukan JSON yang valid/.test(txt), 'JSON rusak → pesan jelas, data tidak berubah');
    await closeDialog(page, 'Tutup');

    console.log('8. Unggah gambar dikompresi');
    const bigPng = Buffer.from(await page.evaluate(async () => {
        // ±6 MB: setara foto cap/TTD langsung dari kamera HP
        const c = document.createElement('canvas'); c.width = 1500; c.height = 1500;
        const g = c.getContext('2d'); const img = g.createImageData(1500, 1500);
        for (let i = 0; i < img.data.length; i++) img.data[i] = (i % 4 === 3) ? 255 : Math.random() * 255;
        g.putImageData(img, 0, 0);
        return c.toDataURL('image/png').split(',')[1];
    }), 'base64');
    await upload('input[onchange*="capImg"]', 'cap-besar.png', bigPng, 'image/png');
    await page.waitForTimeout(1500);
    const capKb = await page.evaluate(() => Math.round(appState.pengesahan.capImg.length * 0.75 / 1024));
    ok(capKb < 600, `Gambar ${Math.round(bigPng.length / 1024)} KB diperkecil`, `${capKb} KB tersimpan`);
    await upload('input[onchange*="ttdImg"]', 'bukan-gambar.txt', Buffer.from('halo'), 'text/plain');
    await page.waitForTimeout(300);
    ok(await page.evaluate(() => appState.pengesahan.ttdImg.startsWith('data:image/')), 'Berkas bukan gambar ditolak');

    console.log('9. Simpan otomatis');
    await page.evaluate(() => { appState.kegiatan.singkatan = 'UJI-SIMPAN'; saveStateNow(); });
    await page.reload();
    await page.waitForTimeout(800);
    ok(await page.evaluate(() => appState.kegiatan.singkatan) === 'UJI-SIMPAN', 'Data bertahan setelah halaman dimuat ulang');

    console.log('10. Tampilan cetak (desktop & HP, terang & gelap)');
    const printIssues = [];
    for (const [w, h] of [[1500, 950], [390, 844]]) {
        await page.setViewportSize({ width: w, height: h });
        for (const dark of [false, true]) {
            await page.evaluate(d => { document.documentElement.classList.toggle('dark', d); setDocMode('sk'); }, dark);
            await page.emulateMedia({ media: 'print' });
            const r = await page.evaluate(() => ({
                sidebar: getComputedStyle(document.getElementById('left-sidebar')).display,
                main: getComputedStyle(document.querySelector('.print-main-area')).display,
                bg: getComputedStyle(document.body).backgroundColor,
                sheets: document.querySelectorAll('#sheets-container .print-sheet').length
            }));
            await page.emulateMedia({ media: 'screen' });
            const tag = `${w}px${dark ? ' gelap' : ''}`;
            if (r.sidebar !== 'none') printIssues.push(`${tag}: panel pengaturan ikut tercetak`);
            if (r.main === 'none' || !r.sheets) printIssues.push(`${tag}: dokumen tidak tercetak`);
            if (r.bg !== 'rgb(255, 255, 255)') printIssues.push(`${tag}: latar cetak ${r.bg}`);
        }
    }
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.setViewportSize({ width: 1500, height: 950 });
    ok(printIssues.length === 0, 'Hanya dokumen yang tercetak, latar putih', printIssues.join('; '));

    console.log('11. Galat JavaScript');
    ok(errors.length === 0, 'Tidak ada galat di konsol', errors.slice(0, 5).join(' | '));

    await browser.close();
    console.log(failures ? `\n${failures} pemeriksaan GAGAL` : '\nSemua pemeriksaan LULUS');
    process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
