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

    console.log('10. Galat JavaScript');
    ok(errors.length === 0, 'Tidak ada galat di konsol', errors.slice(0, 5).join(' | '));

    await browser.close();
    console.log(failures ? `\n${failures} pemeriksaan GAGAL` : '\nSemua pemeriksaan LULUS');
    process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
