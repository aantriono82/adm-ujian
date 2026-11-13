// ============================================================================
// 14. RENDER MODUL 8 & 9: JADWAL ASESMEN & PENGAWAS RUANG + TATA TERTIB RESMI
// ============================================================================
function chunkRooms(n, size) {
    const out = [];
    for (let i = 0; i < n; i += size) out.push(Array.from({ length: Math.min(size, n - i) }, (_, k) => i + k));
    return out;
}

function renderJadwalDanPengawasHTML(paper) {
    const { kegiatan, setting, schedule, dailyRoster } = appState;
    const theme = THEMES[setting.theme];
    const n = appState.jumlahRuang;
    const chunks = chunkRooms(n, 4);
    const td = 'border: 1px solid #0f172a; padding: 4px 5px;';

    const rosterDays = schedule.slice(0, 6);
    const rosterCols = rosterDays.map((d, i) => {
        const byIdx = (dailyRoster || [])[i];
        const byName = (dailyRoster || []).find(r => (r.hari || '').toLowerCase() === (d.hari || '').toLowerCase());
        return (byIdx || byName || { guru: [] }).guru || [];
    });
    let rosterRowsHTML = '';
    for (let rIdx = 0; rIdx < 10; rIdx++) {
        rosterRowsHTML += `<tr>${rosterCols.map(col => `<td style="border: 1px solid #0f172a; padding: 2.5px 5px; font-size: 7.5pt;">${escapeHtml(col[rIdx] || '')}</td>`).join('')}</tr>`;
    }
    const colW = rosterDays.length ? (100 / rosterDays.length).toFixed(1) : 16.6;

    const ppr = getPengawasPerRuang();
    return chunks.map((rooms, cIdx) => {
        const isLast = cIdx === chunks.length - 1;
        const pw = (57 / (rooms.length * ppr)).toFixed(1);
        const rows = schedule.map((d, idx) => d.sesi.map((ss, sIdx) => `
            <tr>
                ${sIdx === 0 ? `<td rowspan="${d.sesi.length}" style="${td} text-align: center; font-weight: 700;">${idx + 1}</td>
                <td rowspan="${d.sesi.length}" style="${td} font-weight: 700;">${escapeHtml(d.hari)}, ${escapeHtml(d.tanggal)}</td>` : ''}
                <td style="${td} text-align: center; white-space: nowrap;">${escapeHtml(ss.waktu)}</td>
                <td style="${td} font-weight: 700;">${escapeHtml(ss.mapel)}</td>
                ${rooms.map(r => { const p = ss.pengawas[r] || ['', '']; return p.slice(0, ppr).map(nm => `<td style="${td}">${escapeHtml(nm)}</td>`).join(''); }).join('')}
            </tr>`).join('')).join('');
        const subTitle = chunks.length > 1 ? `<div style="font-size: 9pt;">(Ruang ${padRoom(rooms[0] + 1)} – ${padRoom(rooms[rooms.length - 1] + 1)} • Lembar ${cIdx + 1} dari ${chunks.length})</div>` : '';
        return `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.7cm 0.9cm; font-size: 8pt;">
        <div>
            ${renderFullPageKopHTML(theme)}
            <div style="text-align: center; font-weight: 700; margin: 0.1cm 0 0.2cm 0; line-height: 1.25;">
                <div style="font-size: 11pt; text-decoration: underline; text-transform: uppercase;">JADWAL ${escapeHtml(kegiatan.namaLengkap)} DAN PENGAWAS RUANG</div>
                <div style="font-size: 10pt; text-transform: uppercase;">${escapeHtml(kegiatan.tapel)}</div>
                ${subTitle}
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 7.4pt;">
                <thead>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th rowspan="2" style="border: 1px solid #0f172a; padding: 4px; width: 3%;">No</th>
                        <th rowspan="2" style="border: 1px solid #0f172a; padding: 4px; width: 13%;">Hari Dan Tanggal</th>
                        <th rowspan="2" style="border: 1px solid #0f172a; padding: 4px; width: 9%;">Waktu</th>
                        <th rowspan="2" style="border: 1px solid #0f172a; padding: 4px; width: 18%;">Mata Pelajaran</th>
                        ${rooms.map(r => `<th colspan="${ppr}" style="border: 1px solid #0f172a; padding: 4px; text-align: center;">Ruang ${padRoom(r + 1)}</th>`).join('')}
                    </tr>
                    <tr style="background: #f8fafc; font-weight: 700;">
                        ${rooms.map(() => (ppr === 1 ? ['Pengawas'] : ['Pengawas 1', 'Pengawas 2']).map(h => `<th style="border: 1px solid #0f172a; padding: 3px; width: ${pw}%;">${h}</th>`).join('')).join('')}
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>

            ${isLast ? `${renderFullPageSignatureHTML()}

            <div style="margin-top: 0.25cm; border-top: 1px dashed #94a3b8; padding-top: 0.15cm;">
                <div style="font-size: 8pt; font-weight: 700; margin-bottom: 4px;">DAFTAR GURU PENGAWAS HARIAN (${escapeHtml(kegiatan.singkatan)}):</div>
                <table style="width: 100%; border-collapse: collapse; font-size: 7.4pt;">
                    <thead>
                        <tr style="background: #f1f5f9; font-weight: 700; text-align: center;">
                            ${rosterDays.map(d => `<th style="border: 1px solid #0f172a; padding: 3px; width: ${colW}%;">${escapeHtml(d.hari)}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>${rosterRowsHTML}</tbody>
                </table>
            </div>` : ''}
        </div>
    </div>`;
    }).join('');
}

function renderTataTertibHTML(paper) {
    const { kop, kegiatan, setting } = appState;
    const theme = THEMES[setting.theme];

    const pagePengawas = `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.8cm 1.2cm; font-size: 9.2pt; line-height: 1.28;">
        <div>
            ${renderFullPageKopHTML(theme)}
            <div style="text-align: center; font-weight: 700; margin: 0.15cm 0 0.2cm 0; line-height: 1.25;">
                <div style="font-size: 11.5pt; text-decoration: underline; text-transform: uppercase;">TATA TERTIB PENGAWAS RUANG</div>
                <div style="font-size: 10.5pt; text-transform: uppercase;">${escapeHtml(kegiatan.namaLengkap)}</div>
                <div style="font-size: 10pt; text-transform: uppercase;">${escapeHtml(kop.sekolah)} ${escapeHtml(kegiatan.tapel)}</div>
            </div>

            <ol style="list-style-type: decimal; padding-left: 0.6cm; text-align: justify;">
                <li style="margin-bottom: 2px;">Tiga puluh (30) menit sebelum ujian dimulai Pengawas Ruang telah hadir di lokasi sekolah/madrasah penyelenggara.</li>
                <li style="margin-bottom: 2px;">Pengawas Ruang menerima penjelasan dan pengarahan dari Ketua Penyelenggara.</li>
                <li style="margin-bottom: 2px;">Pengawas Ruang menerima bahan ${escapeHtml(kegiatan.namaLengkap)} yang berupa amplop naskah soal, amplop lembar jawaban, dan daftar hadir.</li>
                <li style="margin-bottom: 2px;">Pengawas Ruang masuk ke dalam ruang dua puluh (20) menit sebelum waktu pelaksanaan dan memeriksa kesiapan ruang ujian.</li>
                <li style="margin-bottom: 2px;">Pengawas Ruang mempersilakan peserta untuk memasuki ruang dan menempati tempat duduk sesuai nomor yang telah ditentukan.</li>
                <li style="margin-bottom: 2px;">Pengawas Ruang memeriksa setiap peserta untuk tidak membawa tas, buku atau catatan lain, alat komunikasi elektronik, kalkulator dan sebagainya ke dalam ruang ujian kecuali alat tulis yang akan dipergunakan.</li>
                <li style="margin-bottom: 2px;">Pengawas Ruang membacakan Tata Tertib ${escapeHtml(kegiatan.namaLengkap)}.</li>
                <li style="margin-bottom: 2px;">Pengawas Ruang meminta peserta ujian menandatangani daftar hadir ${escapeHtml(kegiatan.namaLengkap)}.</li>
                <li style="margin-bottom: 2px;">Pengawas Ruang membagikan lembar jawaban kepada peserta, dan memandu serta memeriksa pengisian identitas peserta (nomor ujian, nama, tanggal lahir, dan tanda tangan) sebelum waktu ${escapeHtml(kegiatan.namaLengkap)} dimulai.</li>
                <li style="margin-bottom: 2px;">Setelah seluruh peserta selesai mengisi identitas, Pengawas Ruang membuka amplop soal, memeriksa kelengkapan bahan ujian, dan meyakinkan bahwa amplop tersebut dalam keadaan baik dan tertutup rapat, disaksikan oleh peserta ujian.</li>
                <li style="margin-bottom: 2px;">Pengawas Ruang membagikan naskah soal, dengan cara meletakkan di atas meja peserta dalam posisi tertutup (terbalik). Peserta tidak diperkenankan menyentuhnya sampai tanda waktu Ujian dimulai.</li>
                <li style="margin-bottom: 2px;">Pengawas Ruang mengecek kelengkapan soal ${escapeHtml(kegiatan.namaLengkap)}.</li>
                <li style="margin-bottom: 2px;">Setelah tanda waktu mengerjakan dimulai, Pengawas Ruang mempersilakan peserta untuk mulai mengerjakan soal dan mengingatkan peserta agar terlebih dahulu membaca petunjuk cara menjawab soal.</li>
                <li style="margin-bottom: 2px;">Kelebihan naskah soal selama ujian berlangsung tetap disimpan di ruang ujian.</li>
                <li style="margin-bottom: 2px;">Selama ${escapeHtml(kegiatan.namaLengkap)} berlangsung, Pengawas Ruang wajib menjaga ketertiban dan ketenangan suasana sekitar ruang ujian, memberi peringatan dan sanksi kepada peserta yang melakukan kecurangan, serta melarang orang lain yang tidak berkepentingan memasuki ruang Ujian.</li>
                <li style="margin-bottom: 2px;">Pengawas Ruang dilarang memberi isyarat, petunjuk dan bantuan apapun kepada peserta berkaitan dengan jawaban dari soal ${escapeHtml(kegiatan.namaLengkap)} yang diujikan.</li>
                <li style="margin-bottom: 2px;">Lima menit sebelum waktu ${escapeHtml(kegiatan.namaLengkap)} selesai, Pengawas Ruang memberi peringatan kepada peserta bahwa waktu tinggal lima menit.</li>
                <li style="margin-bottom: 2px;">Setelah waktu ${escapeHtml(kegiatan.namaLengkap)} selesai, Pengawas Ruang mempersilakan peserta untuk berhenti mengerjakan soal. Pengawas mengumpulkan lembar jawaban dan naskah soal ${escapeHtml(kegiatan.namaLengkap)}. Peserta dipersilakan meninggalkan ruang ujian, setelah pengawas menghitung jumlah lembar jawaban sama dengan jumlah peserta ujian.</li>
                <li style="margin-bottom: 2px;">Pengawas Ruang menyusun secara urut lembar jawaban dari nomor peserta terkecil dan memasukkannya ke dalam amplop semula.</li>
                <li style="margin-bottom: 2px;">Pengawas Ruang menyerahkan amplop lembar jawaban dan naskah soal ${escapeHtml(kegiatan.namaLengkap)} dan kelengkapan lainnya kepada Penyelenggara.</li>
            </ol>
        </div>
        ${renderFullPageSignatureHTML()}
    </div>`;

    const ljCode = `LJ${escapeHtml(kegiatan.singkatan)}`;
    const pagePeserta = `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.8cm 1.2cm; font-size: 9pt; line-height: 1.26;">
        <div>
            ${renderFullPageKopHTML(theme)}
            <div style="text-align: center; font-weight: 700; margin: 0.12cm 0 0.18cm 0; line-height: 1.22;">
                <div style="font-size: 11.5pt; text-decoration: underline; text-transform: uppercase;">TATA TERTIB PESERTA ${escapeHtml(kegiatan.namaLengkap)}</div>
                <div style="font-size: 10.5pt; text-transform: uppercase;">${escapeHtml(kop.sekolah)}</div>
                <div style="font-size: 10pt; text-transform: uppercase;">${escapeHtml(kegiatan.tapel)}</div>
            </div>

            <div style="margin-bottom: 4px;">Tata Tertib Peserta ${escapeHtml(kegiatan.namaLengkap)} ${escapeHtml(kegiatan.tapel)} yaitu sebagai berikut:</div>

            <ol style="list-style-type: decimal; padding-left: 0.55cm; text-align: justify;">
                <li style="margin-bottom: 2px;">Peserta ${escapeHtml(kegiatan.namaLengkap)} memasuki ruangan setelah tanda masuk dibunyikan, yakni lima belas (15) menit sebelum ${escapeHtml(kegiatan.namaLengkap)} dimulai.</li>
                <li style="margin-bottom: 2px;">Peserta ${escapeHtml(kegiatan.namaLengkap)} yang terlambat hadir hanya diperkenankan mengikuti ${escapeHtml(kegiatan.namaLengkap)} setelah mendapat izin dari ketua panitia ${escapeHtml(kegiatan.namaLengkap)} tanpa diberi perpanjangan waktu.</li>
                <li style="margin-bottom: 2px;">Peserta ${escapeHtml(kegiatan.namaLengkap)} dilarang membawa alat komunikasi elektronik dan kalkulator.</li>
                <li style="margin-bottom: 2px;">Tas, buku, dan catatan dalam bentuk apapun dikumpulkan di depan kelas di samping pengawas ruang.</li>
                <li style="margin-bottom: 2px;">Peserta ${escapeHtml(kegiatan.namaLengkap)} membawa alat tulis dan kartu tanda/peserta ujian.</li>
                <li style="margin-bottom: 2px;">Peserta ${escapeHtml(kegiatan.namaLengkap)} mengisi daftar hadir menggunakan pulpen yang disediakan oleh pengawas ruang.</li>
                <li style="margin-bottom: 2px;">Peserta ${escapeHtml(kegiatan.namaLengkap)} mengisi identitas pada ${ljCode} secara lengkap dan benar.</li>
                <li style="margin-bottom: 2px;">Peserta ${escapeHtml(kegiatan.namaLengkap)} yang memerlukan penjelasan cara pengisian identitas pada ${ljCode} dapat bertanya kepada pengawas ruang dengan cara mengacungkan tangan terlebih dahulu.</li>
                <li style="margin-bottom: 2px;">Peserta ${escapeHtml(kegiatan.namaLengkap)} mulai mengerjakan soal setelah ada tanda waktu mulai ujian.</li>
                <li style="margin-bottom: 2px;">Selama ${escapeHtml(kegiatan.namaLengkap)} berlangsung, peserta hanya dapat meninggalkan ruangan dengan izin dan pengawasan dari pengawas ruang.</li>
                <li style="margin-bottom: 2px;">Peserta ${escapeHtml(kegiatan.namaLengkap)} yang memperoleh naskah soal yang cacat atau rusak, pengerjaan soal tetap dilakukan sambil menunggu pergantian naskah soal.</li>
                <li style="margin-bottom: 2px;">Peserta ${escapeHtml(kegiatan.namaLengkap)} yang meninggalkan ruangan setelah membaca soal dan tidak kembali lagi sampai tanda selesai dibunyikan, dinyatakan telah selesai menempuh/mengikuti ${escapeHtml(kegiatan.namaLengkap)} mata pelajaran yang terkait.</li>
                <li style="margin-bottom: 2px;">Peserta ${escapeHtml(kegiatan.namaLengkap)} yang telah selesai mengerjakan soal sebelum waktu berakhir tidak diperbolehkan meninggalkan ruangan sebelum berakhirnya waktu ujian.</li>
                <li style="margin-bottom: 2px;">Peserta ${escapeHtml(kegiatan.namaLengkap)} berhenti mengerjakan soal setelah ada waktu ujian berakhir dan meletakkan lembar jawaban serta naskah soal di atas meja masing-masing.</li>
                <li style="margin-bottom: 2px;">Selama ${escapeHtml(kegiatan.namaLengkap)} berlangsung, peserta dilarang:
                    <ol style="list-style-type: lower-alpha; padding-left: 0.55cm; margin-top: 1px;">
                        <li>menanyakan jawaban soal kepada siapa pun,</li>
                        <li>bekerja sama dengan peserta lain, memberi atau menerima bantuan dalam menjawab soal,</li>
                        <li>memperlihatkan pekerjaan sendiri kepada peserta lain atau melihat pekerjaan peserta lain,</li>
                        <li>membawa naskah soal ${escapeHtml(kegiatan.namaLengkap)} dan ${ljCode} keluar dari ruang ujian, dan</li>
                        <li>menggantikan atau digantikan oleh orang lain.</li>
                    </ol>
                </li>
                <li style="margin-bottom: 2px;">Meninggalkan ruang ${escapeHtml(kegiatan.namaLengkap)} dengan tertib dan tenang setelah pengawas ruang ujian mengumpulkan dan menghitung lembar jawaban dan naskah soal sesuai dengan jumlah peserta ${escapeHtml(kegiatan.namaLengkap)}.</li>
                <li style="margin-bottom: 2px;">Peserta ${escapeHtml(kegiatan.namaLengkap)} yang melanggar tata tertib ujian, diberi peringatan/teguran oleh pengawas ruang ${escapeHtml(kegiatan.namaLengkap)} dan dicatat dalam berita acara ${escapeHtml(kegiatan.namaLengkap)} sebagai salah satu bahan pertimbangan kelulusan/kenaikan kelas.</li>
            </ol>
        </div>
        ${renderFullPageSignatureHTML()}
    </div>`;

    return pagePengawas + pagePeserta;
}

// ============================================================================
// 15. RENDER MODUL 10 & 11: DAFTAR HADIR PANITIA & DAFTAR HADIR PENGAWAS
// ============================================================================
function renderDaftarHadirPanitiaHTML(paper) {
    const { kegiatan, setting, committee, schedule } = appState;
    const theme = THEMES[setting.theme];

    const dayHeaders = schedule.slice(0, 6).map(d => `
        <th style="border: 1px solid #0f172a; padding: 4px 2px; font-size: 7.5pt; text-align: center;">
            <div>${escapeHtml(d.hari.toUpperCase())}</div>
            <div style="font-weight: 400; font-size: 6.8pt;">${escapeHtml(d.tanggal)}</div>
        </th>
    `).join('');

    const bodyRows = committee.map((c, idx) => {
        const signCells = schedule.slice(0, 6).map((_, dIdx) => `
            <td style="border: 1px solid #0f172a; padding: 6px 4px; height: 0.85cm; vertical-align: top; font-size: 7.5pt; color: #475569;">
                <div style="${idx % 2 === 1 ? 'padding-left: 35%;' : ''}">${idx + 1}. ............</div>
            </td>
        `).join('');

        return `
        <tr>
            <td style="border: 1px solid #0f172a; padding: 4px; text-align: center; font-weight: 700;">${idx + 1}</td>
            <td style="border: 1px solid #0f172a; padding: 4px 6px;">
                <div style="font-weight: 700;">${escapeHtml(c.nama)}</div>
                <div style="font-size: 7.5pt;">NIP. ${escapeHtml(c.nip)}</div>
            </td>
            <td style="border: 1px solid #0f172a; padding: 4px 6px; font-weight: 700; text-align: center;">${escapeHtml(c.jabatanPanitia)}</td>
            ${signCells}
        </tr>`;
    }).join('');

    return `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.8cm 1.0cm;">
        <div>
            ${renderFullPageKopHTML(theme)}
            <div style="text-align: center; font-weight: 700; margin: 0.15cm 0 0.25cm 0; line-height: 1.25;">
                <div style="font-size: 11.5pt; text-decoration: underline; text-transform: uppercase;">DAFTAR HADIR PANITIA PELAKSANA</div>
                <div style="font-size: 10pt; text-transform: uppercase;">${escapeHtml(kegiatan.namaLengkap)}</div>
                <div style="font-size: 9.5pt; text-transform: uppercase;">${escapeHtml(kegiatan.tapel)}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
                <thead>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th rowspan="2" style="border: 1px solid #0f172a; padding: 4px; width: 4%;">No</th>
                        <th rowspan="2" style="border: 1px solid #0f172a; padding: 4px; width: 22%;">Nama / NIP</th>
                        <th rowspan="2" style="border: 1px solid #0f172a; padding: 4px; width: 16%;">Jabatan Kepanitiaan</th>
                        <th colspan="6" style="border: 1px solid #0f172a; padding: 4px; text-align: center;">TANDA TANGAN KEHADIRAN HARIAN</th>
                    </tr>
                    <tr style="background: #f8fafc;">
                        ${dayHeaders}
                    </tr>
                </thead>
                <tbody>${bodyRows}</tbody>
            </table>
        </div>
        ${renderFullPageSignatureHTML()}
    </div>`;
}

function renderDaftarHadirPengawasHTML(paper) {
    const { kegiatan, setting, schedule } = appState;
    const theme = THEMES[setting.theme];
    const chunks = chunkRooms(appState.jumlahRuang, 3);
    const td = 'border: 1px solid #0f172a; padding: 4px;';
    const ppr = getPengawasPerRuang();
    const slots = ppr === 1 ? [0] : [0, 1];

    return chunks.map((rooms, cIdx) => {
        const nameW = (48 / rooms.length).toFixed(1);
        const ttdW = (24 / rooms.length).toFixed(1);
        const rowsHTML = schedule.map((d, idx) => {
            const sesiCount = Math.max(1, d.sesi.length);
            const mapelList = d.sesi.map((ss, i) => `${i + 1}. ${escapeHtml(ss.mapel)}`).join('<br>');
            return d.sesi.map((ss, sIdx) => slots.map(pIdx => `
            <tr>
                ${sIdx === 0 && pIdx === 0 ? `<td rowspan="${sesiCount * ppr}" style="${td} text-align: center; font-weight: 700;">${idx + 1}</td>
                <td rowspan="${sesiCount * ppr}" style="${td} padding: 4px 6px;">
                    <div style="font-weight: 700;">${escapeHtml(d.hari)},</div>
                    <div style="font-size: 8pt;">${escapeHtml(d.tanggal)}</div>
                    <div style="font-size: 7.2pt; color: #1d4ed8; margin-top: 2px;">${mapelList}</div>
                </td>` : ''}
                ${rooms.map(r => { const p = ss.pengawas[r] || ['', '']; return `<td style="${td} font-size: 8pt;">${pIdx === 0 ? `<span style="font-size:6.5pt;color:#64748b;">S${sIdx + 1}</span> ` : ''}${ppr === 2 ? `${pIdx + 1}. ` : ''}${escapeHtml(p[pIdx])}</td>
                <td style="${td} font-size: 7.5pt; color: #64748b;">${ppr === 2 ? `${pIdx + 1}. ` : ''}.........</td>`; }).join('')}
            </tr>`).join('')).join('');
        }).join('');
        const subTitle = chunks.length > 1 ? `<div style="font-size: 9pt;">(Ruang ${padRoom(rooms[0] + 1)} – ${padRoom(rooms[rooms.length - 1] + 1)} • Lembar ${cIdx + 1} dari ${chunks.length})</div>` : '';
        return `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.8cm 1.0cm;">
        <div>
            ${renderFullPageKopHTML(theme)}
            <div style="text-align: center; font-weight: 700; margin: 0.15cm 0 0.25cm 0; line-height: 1.25;">
                <div style="font-size: 11.5pt; text-decoration: underline; text-transform: uppercase;">DAFTAR HADIR PENGAWAS RUANG</div>
                <div style="font-size: 10pt; text-transform: uppercase;">${escapeHtml(kegiatan.namaLengkap)}</div>
                <div style="font-size: 9.5pt; text-transform: uppercase;">${escapeHtml(kegiatan.tapel)}</div>
                ${subTitle}
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 8.2pt;">
                <thead>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th rowspan="2" style="${td} width: 4%;">No</th>
                        <th rowspan="2" style="${td} width: 24%;">Hari, Tanggal & Mata Pelajaran</th>
                        ${rooms.map(r => `<th colspan="2" style="${td} text-align: center;">RUANG ${padRoom(r + 1)}</th>`).join('')}
                    </tr>
                    <tr style="background: #f8fafc; font-weight: 700;">
                        ${rooms.map(() => `<th style="border: 1px solid #0f172a; padding: 3px; width: ${nameW}%;">Nama Pengawas</th><th style="border: 1px solid #0f172a; padding: 3px; width: ${ttdW}%;">TTD</th>`).join('')}
                    </tr>
                </thead>
                <tbody>${rowsHTML}</tbody>
            </table>
        </div>
        ${renderFullPageSignatureHTML()}
    </div>`;
    }).join('');
}

// ============================================================================
// 16. RENDER MODUL 11, 12, 13: BERITA ACARA, DAFTAR HADIR PESERTA, SERAH TERIMA
// ============================================================================
function renderBeritaAcaraHTML(paper) {
    const { kegiatan, pengesahan, setting, roomConfig } = appState;
    const theme = THEMES[setting.theme];
    const groups = getRoomGroups();

    return groups.map(group => {
        const kelasUnik = [...new Set(group.students.map(s => s.kelas))].join(', ') || 'VII / VIII / IX';
        const mapelVal = roomConfig.baMapel ? escapeHtml(roomConfig.baMapel) : '.......................................................................................';
        const tglVal = roomConfig.baTanggal ? escapeHtml(roomConfig.baTanggal) : 'Pada hari ini ....................... tanggal .......... bulan .......................... tahun ' + escapeHtml(kegiatan.tahunAnggaran);
        const waktuVal = roomConfig.baWaktu ? escapeHtml(roomConfig.baWaktu) : 'Pukul ............... s.d. ............... WIB (Sesi .......)';

        return `
        <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
             style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.9cm 1.2cm; font-size: 9.8pt; line-height: 1.35;">
            <div>
                ${renderFullPageKopHTML(theme)}
                <div style="text-align: center; font-weight: 700; margin: 0.15cm 0 0.25cm 0; line-height: 1.25;">
                    <div style="font-size: 12pt; text-decoration: underline;">BERITA ACARA PELAKSANAAN</div>
                    <div style="font-size: 10.5pt; text-transform: uppercase;">${escapeHtml(kegiatan.namaLengkap)}</div>
                    <div style="font-size: 10pt; text-transform: uppercase;">${escapeHtml(kegiatan.tapel)}</div>
                </div>

                <p style="text-align: justify; margin-bottom: 0.2cm;">
                    ${tglVal}, telah dilaksanakan ${escapeHtml(kegiatan.namaLengkap)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)} untuk:
                </p>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 0.25cm; font-size: 9.8pt;">
                    <tr>
                        <td style="width: 24%; padding: 3px 0; font-weight: 700;">Mata Pelajaran</td>
                        <td style="width: 3%;">:</td>
                        <td style="padding: 3px 0; font-weight: 700;">${mapelVal}</td>
                    </tr>
                    <tr>
                        <td style="padding: 3px 0; font-weight: 700;">Tingkat / Kelas</td>
                        <td>:</td>
                        <td style="padding: 3px 0; font-weight: 700;">Kelas ${escapeHtml(kelasUnik)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 3px 0; font-weight: 700;">Ruang Ujian</td>
                        <td>:</td>
                        <td style="padding: 3px 0; font-weight: 700;">Ruang ${escapeHtml(padRoom(group.ruangLabel))}</td>
                    </tr>
                    <tr>
                        <td style="padding: 3px 0; font-weight: 700;">Waktu / Sesi</td>
                        <td>:</td>
                        <td style="padding: 3px 0;">${waktuVal}</td>
                    </tr>
                </table>

                <div style="font-weight: 700; margin-bottom: 4px;">A. DATA JUMLAH PESERTA</div>
                <table style="width: 75%; border-collapse: collapse; margin-bottom: 0.25cm; margin-left: 0.4cm;">
                    <tr>
                        <td style="width: 50%; padding: 2px 0;">1. Jumlah Peserta Terdaftar</td>
                        <td>: <strong>${group.students.length}</strong> Orang</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 0;">2. Jumlah Peserta Hadir</td>
                        <td>: ......... Orang</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 0;">3. Jumlah Peserta Tidak Hadir</td>
                        <td>: ......... Orang</td>
                    </tr>
                </table>

                <div style="font-weight: 700; margin-bottom: 6px;">B. DAFTAR PESERTA YANG TIDAK HADIR</div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 0.3cm; font-size: 9.2pt;">
                    <thead>
                        <tr style="background: #e2e8f0; font-weight: 700;">
                            <th style="border: 1px solid #0f172a; padding: 5px; width: 8%;">No</th>
                            <th style="border: 1px solid #0f172a; padding: 5px; width: 25%;">Nomor Peserta</th>
                            <th style="border: 1px solid #0f172a; padding: 5px; width: 42%;">Nama Peserta</th>
                            <th style="border: 1px solid #0f172a; padding: 5px; width: 25%;">Keterangan (Sakit/Izin/Alfa)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td style="border:1px solid #0f172a;padding:6px;text-align:center;">1</td><td style="border:1px solid #0f172a;padding:6px;"></td><td style="border:1px solid #0f172a;padding:6px;"></td><td style="border:1px solid #0f172a;padding:6px;"></td></tr>
                        <tr><td style="border:1px solid #0f172a;padding:6px;text-align:center;">2</td><td style="border:1px solid #0f172a;padding:6px;"></td><td style="border:1px solid #0f172a;padding:6px;"></td><td style="border:1px solid #0f172a;padding:6px;"></td></tr>
                        <tr><td style="border:1px solid #0f172a;padding:6px;text-align:center;">3</td><td style="border:1px solid #0f172a;padding:6px;"></td><td style="border:1px solid #0f172a;padding:6px;"></td><td style="border:1px solid #0f172a;padding:6px;"></td></tr>
                        <tr><td style="border:1px solid #0f172a;padding:6px;text-align:center;">4</td><td style="border:1px solid #0f172a;padding:6px;"></td><td style="border:1px solid #0f172a;padding:6px;"></td><td style="border:1px solid #0f172a;padding:6px;"></td></tr>
                    </tbody>
                </table>

                <div style="font-weight: 700; margin-bottom: 6px;">C. CATATAN SELAMA PELAKSANAAN UJIAN</div>
                <div style="border: 1px solid #0f172a; border-radius: 4px; padding: 10px; min-height: 1.5cm; font-style: italic;">
                    ${escapeHtml(roomConfig.baCatatan)}
                </div>
            </div>

            <div style="margin-top: 0.4cm;">
                <div style="text-align: right; margin-bottom: 0.2cm;">
                    ${escapeHtml(pengesahan.tempat)}, ${roomConfig.baTanggal ? escapeHtml(roomConfig.baTanggal) : '................................... ' + escapeHtml(kegiatan.tahunAnggaran)}
                </div>
                <table style="width: 100%; border-collapse: collapse; text-align: center;">
                    <tr>
                        ${(getPengawasPerRuang() === 1 ? ['', 'Pengawas Ruang,'] : ['Pengawas I,', 'Pengawas II,']).map(title => `
                        <td style="width: 50%; vertical-align: top;">${title ? `
                            <div style="font-weight: 700;">${title}</div>
                            <div style="height: 1.6cm;"></div>
                            <div style="font-weight: 700;">( ............................................................ )</div>
                            <div>NIP. ....................................................</div>` : ''}
                        </td>`).join('')}
                    </tr>
                </table>
            </div>
        </div>`;
    }).join('');
}

function renderDaftarHadirPesertaHTML(paper) {
    const { kegiatan, setting, roomConfig } = appState;
    const theme = THEMES[setting.theme];
    const groups = getRoomGroups();

    return groups.map(group => {
        const kelasUnik = [...new Set(group.students.map(s => s.kelas))].join(', ') || 'VII';
        const mapelVal = roomConfig.baMapel ? escapeHtml(roomConfig.baMapel) : '..................................................';
        const tglVal = roomConfig.baTanggal ? escapeHtml(roomConfig.baTanggal) : '....................................................';
        const waktuVal = roomConfig.baWaktu ? escapeHtml(roomConfig.baWaktu) : '....................................................';

        const studentRows = group.students.map((st, idx) => `
            <tr>
                <td style="border: 1px solid #0f172a; padding: 3.5px 5px; text-align: center; font-weight: 700;">${idx + 1}</td>
                <td style="border: 1px solid #0f172a; padding: 3.5px 6px; text-align: center; font-weight: 700;">${escapeHtml(st.noUjian)}</td>
                <td style="border: 1px solid #0f172a; padding: 3.5px 8px; font-weight: 700; text-transform: uppercase;">${escapeHtml(st.nama)}</td>
                <td style="border: 1px solid #0f172a; padding: 3.5px 5px; text-align: center;">${escapeHtml(st.lp || 'L')}</td>
                <td style="border: 1px solid #0f172a; padding: 3.5px 8px; font-size: 8.5pt; ${idx % 2 === 1 ? 'padding-left: 3.2cm;' : ''}">
                    ${idx + 1}. ........................
                </td>
            </tr>
        `).join('');

        return `
        <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
             style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.8cm 1.1cm; font-size: 9pt;">
            <div>
                ${renderFullPageKopHTML(theme)}
                <div style="text-align: center; font-weight: 700; margin: 0.1cm 0 0.2cm 0; line-height: 1.2;">
                    <div style="font-size: 11.5pt; text-decoration: underline;">DAFTAR HADIR PESERTA</div>
                    <div style="font-size: 10pt; text-transform: uppercase;">${escapeHtml(kegiatan.namaLengkap)}</div>
                    <div style="font-size: 9.5pt; text-transform: uppercase;">${escapeHtml(kegiatan.tapel)}</div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 0.15cm; font-size: 8.8pt; font-weight: 700;">
                    <tr>
                        <td style="width: 15%; padding: 2px 0;">Mata Pelajaran</td>
                        <td style="width: 35%; padding: 2px 0;">: ${mapelVal}</td>
                        <td style="width: 15%; padding: 2px 0;">Hari / Tanggal</td>
                        <td style="width: 35%; padding: 2px 0;">: ${tglVal}</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 0;">Kelas / Ruang</td>
                        <td style="padding: 2px 0;">: Kelas ${escapeHtml(kelasUnik)} / Ruang ${escapeHtml(padRoom(group.ruangLabel))}</td>
                        <td style="padding: 2px 0;">Waktu / Sesi</td>
                        <td style="padding: 2px 0;">: ${waktuVal}</td>
                    </tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; font-size: 8.8pt;">
                    <thead>
                        <tr style="background: #e2e8f0; font-weight: 700;">
                            <th style="border: 1px solid #0f172a; padding: 4px; width: 6%;">No</th>
                            <th style="border: 1px solid #0f172a; padding: 4px; width: 20%;">Nomor Peserta</th>
                            <th style="border: 1px solid #0f172a; padding: 4px; width: 36%; text-align: left;">Nama Peserta Didik</th>
                            <th style="border: 1px solid #0f172a; padding: 4px; width: 7%;">L/P</th>
                            <th style="border: 1px solid #0f172a; padding: 4px; width: 31%;">Tanda Tangan</th>
                        </tr>
                    </thead>
                    <tbody>${studentRows}</tbody>
                </table>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 0.25cm; font-size: 9pt;">
                <div style="line-height: 1.4;">
                    <div style="font-weight: 700; text-decoration: underline;">Keterangan:</div>
                    <div>- Jumlah Terdaftar : <strong>${group.students.length}</strong> Orang</div>
                    <div>- Hadir &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ......... Orang</div>
                    <div>- Tidak Hadir &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ......... Orang</div>
                </div>
                <div style="width: 6.5cm; text-align: center;">
                    <div style="font-weight: 700;">Pengawas Ruang,</div>
                    <div style="height: 1.4cm;"></div>
                    <div style="font-weight: 700;">( ............................................................ )</div>
                    <div>NIP. ....................................................</div>
                </div>
            </div>
        </div>`;
    }).join('');
}

function renderSerahTerimaHTML(paper) {
    const { kegiatan, setting, handoverLjk } = appState;
    const theme = THEMES[setting.theme];
    const groups = getRoomGroups();
    const ketua = getCommitteeRolePerson('Ketua', '....................', '');

    // Halaman 1: Serah Terima Naskah Soal & LJK Per Ruang
    let ruangRows = '';
    const totalRuang = Math.max(5, groups.length);
    for (let i = 0; i < totalRuang; i++) {
        const g = groups[i];
        const rLabel = g ? `Ruang ${padRoom(g.ruangLabel)}` : `Ruang ${padRoom(i + 1)}`;
        const targetCount = g ? `${g.students.length} Siswa` : '';
        ruangRows += `
        <tr>
            <td style="border: 1px solid #0f172a; padding: 6px; text-align: center; font-weight: 700;">${i + 1}</td>
            <td style="border: 1px solid #0f172a; padding: 6px 8px; font-weight: 700;">${escapeHtml(rLabel)}</td>
            <td style="border: 1px solid #0f172a; padding: 6px; text-align: center;">${escapeHtml(targetCount)}</td>
            <td style="border: 1px solid #0f172a; padding: 6px; text-align: center;">....... Eks</td>
            <td style="border: 1px solid #0f172a; padding: 6px 8px;">${i + 1}. ......................</td>
            <td style="border: 1px solid #0f172a; padding: 6px; text-align: center;">....... Lbr</td>
            <td style="border: 1px solid #0f172a; padding: 6px 8px;">${i + 1}. ......................</td>
        </tr>`;
    }

    const page1 = `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.9cm 1.2cm; font-size: 9.5pt;">
        <div>
            ${renderFullPageKopHTML(theme)}
            <div style="text-align: center; font-weight: 700; margin: 0.15cm 0 0.25cm 0; line-height: 1.25;">
                <div style="font-size: 11.5pt; text-decoration: underline;">DAFTAR SERAH TERIMA NASKAH SOAL DAN LEMBAR JAWABAN</div>
                <div style="font-size: 10pt; text-transform: uppercase;">${escapeHtml(kegiatan.namaLengkap)}</div>
                <div style="font-size: 9.5pt; text-transform: uppercase;">${escapeHtml(kegiatan.tapel)}</div>
            </div>

            <div style="display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 0.2cm;">
                <div>Hari / Tanggal : ....................................................</div>
                <div>Mata Pelajaran : ....................................................</div>
            </div>
            <div style="font-weight: 700; margin-bottom: 0.25cm;">Sesi / Jam Ke- : ....................................................</div>

            <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                <thead>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 6%;">No</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 18%;">Ruang</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 14%;">Target Peserta</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 14%;">Jml Soal</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 17%;">TTD Pengawas</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 14%;">Jml LJK</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 17%;">TTD Panitia</th>
                    </tr>
                </thead>
                <tbody>${ruangRows}</tbody>
            </table>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 0.4cm;">
            <div style="width: 6.5cm; text-align: center;">
                <div style="font-weight: 700;">Ketua Pelaksana,</div>
                <div style="height: 1.5cm;"></div>
                <div style="font-weight: 700; text-decoration: underline;">${escapeHtml(ketua.nama)}</div>
                <div>NIP. ${escapeHtml(ketua.nip)}</div>
            </div>
        </div>
    </div>`;

    // Halaman 2: Serah Terima Lembar Jawaban kepada Korektor / Guru Mapel
    const ljkRows = handoverLjk.map((item, idx) => `
        <tr>
            <td style="border: 1px solid #0f172a; padding: 5px; text-align: center; font-weight: 700;">${idx + 1}</td>
            <td style="border: 1px solid #0f172a; padding: 5px 8px; font-weight: 700;">${escapeHtml(item.mapel)}</td>
            <td style="border: 1px solid #0f172a; padding: 5px 8px;">${escapeHtml(item.penerima)}</td>
            <td style="border: 1px solid #0f172a; padding: 5px 8px; text-align: center;">....... Des ${escapeHtml(kegiatan.tahunAnggaran)}</td>
            <td style="border: 1px solid #0f172a; padding: 5px 8px; ${idx % 2 === 1 ? 'padding-left: 2.5cm;' : ''}">${idx + 1}. ........................</td>
        </tr>
    `).join('');

    const page2 = `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.9cm 1.2cm; font-size: 9.5pt;">
        <div>
            ${renderFullPageKopHTML(theme)}
            <div style="text-align: center; font-weight: 700; margin: 0.15cm 0 0.25cm 0; line-height: 1.25;">
                <div style="font-size: 11.5pt; text-decoration: underline;">DAFTAR SERAH TERIMA LEMBAR JAWABAN (LJK) KOREKTOR</div>
                <div style="font-size: 10pt; text-transform: uppercase;">${escapeHtml(kegiatan.namaLengkap)}</div>
                <div style="font-size: 9.5pt; text-transform: uppercase;">${escapeHtml(kegiatan.tapel)}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                <thead>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th style="border: 1px solid #0f172a; padding: 5px; width: 6%;">No.</th>
                        <th style="border: 1px solid #0f172a; padding: 5px; width: 32%; text-align: left;">Mata Pelajaran</th>
                        <th style="border: 1px solid #0f172a; padding: 5px; width: 26%; text-align: left;">Nama Guru / Korektor Penerima</th>
                        <th style="border: 1px solid #0f172a; padding: 5px; width: 16%;">Tanggal Terima</th>
                        <th style="border: 1px solid #0f172a; padding: 5px; width: 20%;">Tanda Tangan</th>
                    </tr>
                </thead>
                <tbody>${ljkRows}</tbody>
            </table>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 0.3cm;">
            <div style="width: 6.5cm; text-align: center;">
                <div style="font-weight: 700;">Ketua Pelaksana,</div>
                <div style="height: 1.5cm;"></div>
                <div style="font-weight: 700; text-decoration: underline;">${escapeHtml(ketua.nama)}</div>
                <div>NIP. ${escapeHtml(ketua.nip)}</div>
            </div>
        </div>
    </div>`;

    return page1 + page2;
}

// ============================================================================
// 17. RENDER MODUL 14 & 15: ASESMEN SUSULAN & REKAPITULASI NILAI
// ============================================================================
function renderAsesmenSusulanHTML(paper) {
    const { kegiatan, pengesahan, setting, makeupSchedule } = appState;
    const theme = THEMES[setting.theme];
    const ketua = getCommitteeRolePerson('Ketua', '....................', '');

    const makeupRows = makeupSchedule.map((m, i) => `
        <tr>
            <td style="border: 1px solid #0f172a; padding: 6px; text-align: center; font-weight: 700;">${i + 1}</td>
            <td style="border: 1px solid #0f172a; padding: 6px 8px; font-weight: 700;">${escapeHtml(m.hariTanggal)}</td>
            <td style="border: 1px solid #0f172a; padding: 6px 8px; text-align: center;">${escapeHtml(m.waktu)}</td>
            <td style="border: 1px solid #0f172a; padding: 6px 8px; font-weight: 700;">${escapeHtml(m.mapel)}</td>
            <td style="border: 1px solid #0f172a; padding: 6px 8px; text-align: center;">${escapeHtml(m.ruang)}</td>
            <td style="border: 1px solid #0f172a; padding: 6px 8px;">${escapeHtml(m.pengawas)}</td>
        </tr>
    `).join('');

    const page1 = `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.9cm 1.2cm; font-size: 9.5pt;">
        <div>
            ${renderFullPageKopHTML(theme)}
            <div style="text-align: center; font-weight: 700; margin: 0.15cm 0 0.25cm 0; line-height: 1.25;">
                <div style="font-size: 11.5pt; text-decoration: underline; text-transform: uppercase;">JADWAL PELAKSANAAN ${escapeHtml(kegiatan.namaLengkap)} SUSULAN</div>
                <div style="font-size: 10pt; text-transform: uppercase;">${escapeHtml(kegiatan.tapel)}</div>
            </div>

            <p style="margin-bottom: 0.2cm;">Jadwal pelaksanaan ujian susulan bagi peserta didik yang berhalangan hadir pada asesmen utama karena sakit atau izin resmi:</p>

            <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                <thead>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 6%;">No</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 18%;">Hari, Tanggal</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 20%;">Waktu / Sesi</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 26%;">Mata Pelajaran</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 13%;">Ruang Ujian</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 17%;">Pengawas Susulan</th>
                    </tr>
                </thead>
                <tbody>${makeupRows}</tbody>
            </table>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 0.4cm;">
            <div style="width: 6.8cm;">
                <div>${escapeHtml(pengesahan.tempat)}, ${escapeHtml(pengesahan.tanggal)}</div>
                <div style="font-weight: 700;">Ketua Panitia ${escapeHtml(kegiatan.singkatan)},</div>
                <div style="height: 1.5cm;"></div>
                <div style="font-weight: 700; text-decoration: underline;">${escapeHtml(ketua.nama)}</div>
                <div>NIP. ${escapeHtml(ketua.nip)}</div>
            </div>
        </div>
    </div>`;

    let blankSusulanRows = '';
    for (let i = 1; i <= 15; i++) {
        blankSusulanRows += `
        <tr>
            <td style="border: 1px solid #0f172a; padding: 4.5px; text-align: center;">${i}</td>
            <td style="border: 1px solid #0f172a; padding: 4.5px;"></td>
            <td style="border: 1px solid #0f172a; padding: 4.5px;"></td>
            <td style="border: 1px solid #0f172a; padding: 4.5px; text-align: center;"></td>
            <td style="border: 1px solid #0f172a; padding: 4.5px;"></td>
            <td style="border: 1px solid #0f172a; padding: 4.5px; text-align: center;"></td>
            <td style="border: 1px solid #0f172a; padding: 4.5px; ${i % 2 === 0 ? 'padding-left: 2cm;' : ''}">${i}. ....................</td>
        </tr>`;
    }

    const page2 = `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.8cm 1.2cm; font-size: 9pt;">
        <div>
            ${renderFullPageKopHTML(theme)}
            <div style="text-align: center; font-weight: 700; margin: 0.1cm 0 0.2cm 0; line-height: 1.2;">
                <div style="font-size: 11.5pt; text-decoration: underline; text-transform: uppercase;">DAFTAR HADIR DAN BERITA ACARA ${escapeHtml(kegiatan.singkatan)} SUSULAN</div>
                <div style="font-size: 9.5pt; text-transform: uppercase;">${escapeHtml(kegiatan.tapel)}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 0.15cm; font-weight: 700;">
                <tr>
                    <td style="width: 16%; padding: 2px 0;">Hari, Tanggal</td>
                    <td style="width: 34%;">: ....................................................</td>
                    <td style="width: 16%;">Waktu / Sesi</td>
                    <td style="width: 34%;">: ....................................................</td>
                </tr>
                <tr>
                    <td style="padding: 2px 0;">Mata Pelajaran</td>
                    <td>: ....................................................</td>
                    <td>Ruang Ujian</td>
                    <td>: Ruang Susulan</td>
                </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
                <thead>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 5%;">No</th>
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 17%;">No. Peserta</th>
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 28%;">Nama Siswa</th>
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 8%;">Kelas</th>
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 16%;">Alasan Susulan</th>
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 8%;">Jml LJK</th>
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 18%;">Tanda Tangan</th>
                    </tr>
                </thead>
                <tbody>${blankSusulanRows}</tbody>
            </table>

            <div style="margin-top: 0.2cm;">
                <div style="font-weight: 700;">Catatan Pengawas Susulan:</div>
                <div style="border-bottom: 1px dotted #0f172a; height: 0.5cm;"></div>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; text-align: center; margin-top: 0.3cm;">
            <tr>
                <td style="width: 50%;">
                    <div style="font-weight: 700;">Ketua Panitia Pelaksana ${escapeHtml(kegiatan.singkatan)},</div>
                    <div style="height: 1.4cm;"></div>
                    <div style="font-weight: 700; text-decoration: underline;">${escapeHtml(ketua.nama)}</div>
                    <div>NIP. ${escapeHtml(ketua.nip)}</div>
                </td>
                <td style="width: 50%;">
                    <div style="font-weight: 700;">Pengawas Ruang Susulan,</div>
                    <div style="height: 1.4cm;"></div>
                    <div style="font-weight: 700;">( ............................................................ )</div>
                    <div>NIP. ....................................................</div>
                </td>
            </tr>
        </table>
    </div>`;

    return page1 + page2;
}

function renderRekapNilaiHTML(paper) {
    const { kegiatan, pengesahan, setting, rekapConfig } = appState;
    const theme = THEMES[setting.theme];
    const ketua = getCommitteeRolePerson('Ketua', '....................', '');

    let list = getActiveStudents();
    if (rekapConfig.kelasFilter !== 'ALL') {
        list = list.filter(s => gradeOf(s.kelas) === rekapConfig.kelasFilter);
    }

    const kktp = Number(rekapConfig.kktp) || 75;
    const scores = list.map(s => Number(s.nilai) || 0).filter(n => n > 0);
    const maxVal = scores.length ? Math.max(...scores) : 0;
    const minVal = scores.length ? Math.min(...scores) : 0;
    const avgVal = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0.0';
    const tuntasCount = scores.filter(n => n >= kktp).length;
    const pctTuntas = scores.length ? ((tuntasCount / scores.length) * 100).toFixed(1) : '0.0';

    const rowsHTML = list.map((st, idx) => {
        const n = Number(st.nilai) || 0;
        const isTuntas = n >= kktp;
        return `
        <tr>
            <td style="border: 1px solid #0f172a; padding: 3.5px 6px; text-align: center; font-weight: 700;">${idx + 1}</td>
            <td style="border: 1px solid #0f172a; padding: 3.5px 6px; text-align: center;">${escapeHtml(st.noUjian)} / ${escapeHtml(st.nisn || '-')}</td>
            <td style="border: 1px solid #0f172a; padding: 3.5px 8px; font-weight: 700; text-transform: uppercase;">${escapeHtml(st.nama)}</td>
            <td style="border: 1px solid #0f172a; padding: 3.5px 6px; text-align: center; font-weight: 700;">${escapeHtml(st.kelas)}</td>
            <td style="border: 1px solid #0f172a; padding: 3.5px 6px; text-align: center; font-weight: 700; color: #1d4ed8;">${n > 0 ? n : ''}</td>
            <td style="border: 1px solid #0f172a; padding: 3.5px 6px; text-align: center; font-weight: 700; color: ${isTuntas ? '#047857' : '#dc2626'};">
                ${n > 0 ? (isTuntas ? 'Tuntas' : 'Belum Tuntas') : ''}
            </td>
        </tr>`;
    }).join('');

    return `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.8cm 1.2cm; font-size: 9pt;">
        <div>
            ${renderFullPageKopHTML(theme)}
            <div style="text-align: center; font-weight: 700; margin: 0.1cm 0 0.2cm 0; line-height: 1.25;">
                <div style="font-size: 11.5pt; text-decoration: underline; text-transform: uppercase;">DAFTAR REKAPITULASI NILAI ${escapeHtml(kegiatan.namaLengkap)}</div>
                <div style="font-size: 10pt; text-transform: uppercase;">${escapeHtml(kegiatan.tapel)}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 0.15cm; font-weight: 700; font-size: 9pt;">
                <tr>
                    <td style="width: 16%; padding: 2px 0;">Mata Pelajaran</td>
                    <td style="width: 44%;">: ${escapeHtml(rekapConfig.mapel)}</td>
                    <td style="width: 14%;">Kelas Sasaran</td>
                    <td style="width: 26%;">: ${rekapConfig.kelasFilter === 'ALL' ? 'Semua Kelas Aktif' : 'Kelas ' + escapeHtml(rekapConfig.kelasFilter)}</td>
                </tr>
                <tr>
                    <td style="padding: 2px 0;">Guru Pengampu</td>
                    <td>: ${escapeHtml(rekapConfig.guru)}</td>
                    <td>KKTP / KKM</td>
                    <td>: ${kktp}</td>
                </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; font-size: 8.6pt;">
                <thead>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 6%;">No</th>
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 24%;">No. Peserta / NISN</th>
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 34%; text-align: left;">Nama Peserta Didik</th>
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 8%;">Kelas</th>
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 12%;">Nilai Akhir ${escapeHtml(kegiatan.singkatan)}</th>
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 16%;">Keterangan</th>
                    </tr>
                </thead>
                <tbody>${rowsHTML}</tbody>
            </table>

            <div style="border: 1px solid #0f172a; background: #f8fafc; padding: 6px 10px; margin-top: 0.2cm; font-weight: 700; text-align: center; font-size: 8.8pt;">
                Statistik Nilai: &nbsp;&nbsp; Nilai Tertinggi: ${maxVal} &nbsp;&nbsp;|&nbsp;&nbsp; Nilai Terendah: ${minVal} &nbsp;&nbsp;|&nbsp;&nbsp; Rata-rata Kelas: ${avgVal} &nbsp;&nbsp;|&nbsp;&nbsp; % Ketuntasan: ${pctTuntas}%
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; text-align: center; margin-top: 0.3cm; font-size: 9pt;">
            <tr>
                <td style="width: 50%;">
                    <div>Mengetahui,</div>
                    <div style="font-weight: 700;">Ketua Panitia ${escapeHtml(kegiatan.singkatan)},</div>
                    <div style="height: 1.4cm;"></div>
                    <div style="font-weight: 700; text-decoration: underline;">${escapeHtml(ketua.nama)}</div>
                    <div>NIP. ${escapeHtml(ketua.nip)}</div>
                </td>
                <td style="width: 50%;">
                    <div>${escapeHtml(pengesahan.tempat)}, ${escapeHtml(rekapConfig.lpjTanggal)}</div>
                    <div style="font-weight: 700;">Guru Mata Pelajaran,</div>
                    <div style="height: 1.4cm;"></div>
                    <div style="font-weight: 700; text-decoration: underline;">${escapeHtml(rekapConfig.guru)}</div>
                    <div>NIP. ${escapeHtml(rekapConfig.nip)}</div>
                </td>
            </tr>
        </table>
    </div>`;
}

// ============================================================================
// 18. RENDER MODUL 16: LAPORAN AKHIR PELAKSANAAN / LPJ (SAMPUL, PENGESAHAN, KATA PENGANTAR, DAFTAR ISI + 1 HALAMAN PER BAB)
// ============================================================================
function renderLaporanAkhirHTML(paper) {
    const { kop, kegiatan, pengesahan, setting, committee, budget, rekapConfig } = appState;
    const theme = THEMES[setting.theme];
    const preset = ASSESSMENT_PRESETS[appState.assessmentMode];
    const activeStudents = getActiveStudents();
    const groups = getRoomGroups();

    const ketua = getCommitteeRolePerson('Ketua', '....................', '');
    const sekretaris = getCommitteeRolePerson('Sekretaris', '....................', '');

    // Statistik Peserta per Kelas VII, VIII, IX
    const countByGradeGender = (gradeStr, lpStr) => activeStudents.filter(s => {
        // gradeOf() mengenali kelas paralel (VII.A, VII-B, 7C, ...) sama seperti filter kelas
        const matchK = gradeOf(s.kelas) === gradeStr;
        const matchG = String(s.lp || 'L').toUpperCase().trim() === lpStr;
        return matchK && matchG;
    }).length;

    const k7L = countByGradeGender('VII', 'L'), k7P = countByGradeGender('VII', 'P'), k7Tot = k7L + k7P;
    const k8L = countByGradeGender('VIII', 'L'), k8P = countByGradeGender('VIII', 'P'), k8Tot = k8L + k8P;
    const k9L = countByGradeGender('IX', 'L'), k9P = countByGradeGender('IX', 'P'), k9Tot = k9L + k9P;
    const totL = k7L + k8L + k9L, totP = k7P + k8P + k9P, grandTot = totL + totP;

    // Halaman 1: Sampul Laporan Akhir
    const page1 = `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between items-center text-center"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 1.5cm 1.5cm; border: 3px double #0f172a;">
        <div style="width: 100%; margin-top: 0.5cm;">
            <div style="font-size: 16pt; font-weight: 700; letter-spacing: 0.5px;">LAPORAN AKHIR PELAKSANAAN</div>
            <div style="font-size: 15pt; font-weight: 700; color: #1e3a8a; text-transform: uppercase; margin-top: 6px;">${escapeHtml(kegiatan.namaLengkap)}</div>
            <div style="font-size: 14pt; font-weight: 700; margin-top: 4px;">${escapeHtml(kegiatan.tapel)}</div>
            <div style="font-size: 11pt; font-weight: 700; color: #047857; margin-top: 6px;">Sasaran Peserta: ${preset.targetGradesText}</div>
        </div>

        <div style="margin: 1cm 0;">
            <img src="${imgUrl(kop.logoKanan)}" style="width: 4.2cm; height: 4.2cm; object-fit: contain; margin: 0 auto;">
        </div>

        <div>
            <div style="font-size: 11pt; font-weight: 700;">DISUSUN OLEH:</div>
            <div style="font-size: 13pt; font-weight: 700; text-transform: uppercase; margin-top: 4px;">PANITIA PELAKSANA ${escapeHtml(kegiatan.singkatan)}</div>
            <div style="font-size: 13pt; font-weight: 700; text-transform: uppercase;">${escapeHtml(kop.sekolah)}</div>
        </div>

        <div style="width: 100%; border-top: 2.5px solid #0f172a; padding-top: 0.35cm; line-height: 1.3;">
            <div style="font-size: 12.5pt; font-weight: 700;">${escapeHtml(kop.pemda)}</div>
            <div style="font-size: 12.5pt; font-weight: 700;">${escapeHtml(kop.dinas)}</div>
            <div style="font-size: 13.5pt; font-weight: 700; color: #1e3a8a;">${escapeHtml(kop.sekolah)}</div>
            <div style="font-size: 12pt; font-weight: 700;">TAHUN ${escapeHtml(kegiatan.tahunAnggaran)}</div>
        </div>
    </div>`;

    // Halaman 2: Lembar Pengesahan
    const page2 = `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.8cm 1.2cm; font-size: 9.2pt; line-height: 1.28;">
        <div>
            ${renderFullPageKopHTML(theme)}
            <div style="text-align: center; font-weight: 700; margin: 0.1cm 0 0.15cm 0;">
                <div style="font-size: 11pt; text-decoration: underline;">LEMBAR PENGESAHAN</div>
                <div style="text-transform: uppercase;">LAPORAN PERTANGGUNGJAWABAN ${escapeHtml(kegiatan.namaLengkap)}</div>
                <div>${escapeHtml(kegiatan.tapel)}</div>
            </div>

            <p style="text-align: justify;">Laporan Akhir Pelaksanaan ${escapeHtml(kegiatan.namaLengkap)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)} ${escapeHtml(kop.sekolah)} ini telah diteliti, diperiksa, dan disahkan oleh pihak sekolah pada Tanggal <strong>${escapeHtml(rekapConfig.lpjTanggal)}</strong> bertempat di <strong>${escapeHtml(kop.sekolah)}</strong>.</p>

            <table style="width: 100%; border-collapse: collapse; text-align: center; margin: 0.25cm 0; font-size: 9pt;">
                <tr>
                    <td style="width: 50%;">
                        <div>Mengetahui,</div>
                        <div style="font-weight: 700;">Ketua Panitia ${escapeHtml(kegiatan.singkatan)},</div>
                        <div style="height: 1.2cm;"></div>
                        <div style="font-weight: 700; text-decoration: underline;">${escapeHtml(ketua.nama)}</div>
                        <div>NIP. ${escapeHtml(ketua.nip)}</div>
                    </td>
                    <td style="width: 50%;">
                        <div>${escapeHtml(pengesahan.tempat)}, ${escapeHtml(rekapConfig.lpjTanggal)}</div>
                        <div style="font-weight: 700;">Sekretaris Panitia ${escapeHtml(kegiatan.singkatan)},</div>
                        <div style="height: 1.2cm;"></div>
                        <div style="font-weight: 700; text-decoration: underline;">${escapeHtml(sekretaris.nama)}</div>
                        <div>NIP. ${escapeHtml(sekretaris.nip)}</div>
                    </td>
                </tr>
                <tr>
                    <td colspan="2" style="padding-top: 0.2cm;">
                        <div>Mengesahkan,</div>
                        <div style="font-weight: 700;">Kepala ${escapeHtml(kop.sekolah)},</div>
                        <div style="height: 1.3cm;"></div>
                        <div style="font-weight: 700; text-decoration: underline;">${escapeHtml(pengesahan.kepsek)}</div>
                        <div>NIP. ${escapeHtml(pengesahan.nip)}</div>
                    </td>
                </tr>
            </table>
        </div>
        <div style="font-size: 8pt; color: #64748b; text-align: right;">Laporan Akhir ${escapeHtml(kegiatan.singkatan)} — Halaman i</div>
    </div>`;

    // Halaman Kata Pengantar & Daftar Isi — masing-masing satu halaman tersendiri
    const frontSheet = (inner, n) => `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.8cm 1.2cm; font-size: 9.2pt; line-height: 1.32;">
        <div>
${inner}        </div>
        <div style="font-size: 8pt; color: #64748b; text-align: right;">Laporan Akhir ${escapeHtml(kegiatan.singkatan)} — Halaman ${n}</div>
    </div>`;

    const pageKataPengantar = frontSheet(`
            <div style="text-align: center; font-weight: 700; font-size: 10.5pt; margin-bottom: 0.15cm;">KATA PENGANTAR</div>
            <p style="text-align: justify;">Puji dan syukur kami panjatkan ke hadirat Tuhan Yang Maha Esa atas rahmat dan hidayah-Nya, sehingga kegiatan ${escapeHtml(kegiatan.namaLengkap)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)} di ${escapeHtml(kop.sekolah)} dapat terlaksana secara tertib, aman, dan lancar. Laporan ini disusun sebagai bentuk pertanggungjawaban panitia pelaksana mengenai seluruh rangkaian kegiatan mulai dari tahap persiapan, penyusunan kisi-kisi dan naskah soal, pelaksanaan asesmen utama maupun susulan, pengolahan nilai, hingga administrasi pelaporan dan pertanggungjawaban keuangan.</p>
`, 'ii');

    const tocEntries = [
        ['Lembar Pengesahan', 'i'],
        ['Kata Pengantar', 'ii'],
        ['Daftar Isi', 'iii'],
        ['BAB I — Pendahuluan (Latar Belakang & Tujuan)', '1'],
        ['BAB II — Pengorganisasian Kepanitiaan', '2'],
        ['BAB III — Pelaksanaan Asesmen', '3'],
        ['BAB IV — Analisis Hasil & Hambatan', '4'],
        ['BAB V — Laporan Keuangan & Anggaran', '5'],
        ['BAB VI — Penutup, Rekomendasi & Lampiran', '6'],
    ];
    const tocRows = tocEntries.map(([label, hal]) => `
                <tr>
                    <td style="padding: 3px 0; border-bottom: 1px dotted #64748b;">${label}</td>
                    <td style="padding: 3px 0; width: 1.2cm; text-align: right; border-bottom: 1px dotted #64748b;">${hal}</td>
                </tr>`).join('');
    const pageDaftarIsi = frontSheet(`
            <div style="text-align: center; font-weight: 700; font-size: 10.5pt; margin-bottom: 0.25cm;">DAFTAR ISI</div>
            <table style="width: 100%; border-collapse: collapse;">${tocRows}
            </table>
`, 'iii');

    const committeeListLPJ = committee.map(c => `<li><strong>${escapeHtml(c.jabatanPanitia)}</strong> : ${escapeHtml(c.nama)} (NIP. ${escapeHtml(c.nip)})</li>`).join('');

    let totalBudget = 0;
    const budgetRows = budget.map((b, i) => {
        const sub = (Number(b.qty) || 1) * (Number(b.harga) || 0);
        totalBudget += sub;
        return `
        <tr>
            <td style="border: 1px solid #0f172a; padding: 4px; text-align: center;">${i + 1}</td>
            <td style="border: 1px solid #0f172a; padding: 4px 8px;">${escapeHtml(b.uraian)}</td>
            <td style="border: 1px solid #0f172a; padding: 4px 6px; text-align: center;">${escapeHtml(b.volume)}</td>
            <td style="border: 1px solid #0f172a; padding: 4px 8px; text-align: right;">Rp ${sub.toLocaleString('id-ID')}</td>
        </tr>`;
    }).join('');

    // Setiap BAB dicetak pada halaman tersendiri (tidak ada dua BAB dalam satu halaman).
    // Nomor halaman mengikuti Daftar Isi (BAB I = 1 … BAB VI = 6); BAB VI diakhiri pengesahan.
    const babSheet = (inner, footer) => `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.8cm 1.2cm; font-size: 9.2pt; line-height: 1.32;">
        <div>
${inner}        </div>
        ${footer}
    </div>`;
    const pageFooter = (n) => `<div style="font-size: 8pt; color: #64748b; text-align: right;">Laporan Akhir ${escapeHtml(kegiatan.singkatan)} — Halaman ${n}</div>`;

    const babBlocks = [
        `
            <div style="font-weight: 700; font-size: 10.5pt; text-align: center; margin-bottom: 0.15cm;">BAB I — PENDAHULUAN</div>
            <p style="text-align: justify;"><strong>A. Latar Belakang:</strong> ${escapeHtml(kegiatan.namaLengkap)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)} merupakan bagian integral dari proses pembelajaran dalam rangka ${preset.purposeText}.</p>
            <p style="margin-top: 3px;"><strong>B. Dasar Hukum:</strong> 1) UU Nomor 20 Tahun 2003 tentang Sisdiknas; 2) PP Nomor 57 Tahun 2021 jo. PP Nomor 4 Tahun 2022; 3) Permendikbudristek Nomor 21 Tahun 2022 tentang Standar Penilaian Pendidikan; 4) SK Kepala ${escapeHtml(kop.sekolah)} Nomor: ${escapeHtml(kegiatan.noSk)} tentang Penetapan Panitia Pelaksana ${escapeHtml(kegiatan.namaLengkap)}.</p>
            <p style="margin-top: 3px;"><strong>C. Tujuan dan Sasaran:</strong> Mengukur capaian kompetensi akademik peserta didik ${preset.targetGradesText}, menyediakan data pengisian nilai Rapor Semester ${escapeHtml(kegiatan.semester)}, serta menjadi bahan evaluasi strategi pembelajaran.</p>
`,
        `
            <div style="font-weight: 700; font-size: 10.5pt; text-align: center; margin-bottom: 0.15cm;">BAB II — PENGORGANISASIAN DAN STRUKTUR KEPANITIAAN</div>
            <p>Susunan Panitia Pelaksana ${escapeHtml(kegiatan.namaLengkap)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)} ${escapeHtml(kop.sekolah)} terdiri atas:</p>
            <ul style="list-style-type: disc; padding-left: 0.6cm; margin-top: 3px; font-size: 8.6pt;">${committeeListLPJ}</ul>
`,
        `
            <div style="font-weight: 700; font-size: 10.5pt; text-align: center; margin-bottom: 0.15cm;">BAB III — PELAKSANAAN ASESMEN</div>
            <p><strong>A. Data Peserta Asesmen (${preset.targetGradesText}):</strong></p>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.6pt; margin: 4px 0;">
                <thead>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th style="border: 1px solid #0f172a; padding: 4px;">Tingkat Kelas</th>
                        <th style="border: 1px solid #0f172a; padding: 4px;">Status Sasaran</th>
                        <th style="border: 1px solid #0f172a; padding: 4px;">Laki-Laki (L)</th>
                        <th style="border: 1px solid #0f172a; padding: 4px;">Perempuan (P)</th>
                        <th style="border: 1px solid #0f172a; padding: 4px;">Jumlah Siswa</th>
                        <th style="border: 1px solid #0f172a; padding: 4px;">Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border:1px solid #0f172a;padding:4px;font-weight:700;text-align:center;">Kelas VII</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;">${preset.targetGrades.includes('VII') ? 'Mengikuti' : '-'}</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;">${k7L}</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;">${k7P}</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;font-weight:700;">${k7Tot} Siswa</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;">Hadir Lengkap / Susulan</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #0f172a;padding:4px;font-weight:700;text-align:center;">Kelas VIII</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;">${preset.targetGrades.includes('VIII') ? 'Mengikuti' : '-'}</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;">${k8L}</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;">${k8P}</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;font-weight:700;">${k8Tot} Siswa</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;">Hadir Lengkap / Susulan</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #0f172a;padding:4px;font-weight:700;text-align:center;">Kelas IX</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;">${preset.targetGrades.includes('IX') ? 'Mengikuti' : '-'}</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;">${k9L}</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;">${k9P}</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;font-weight:700;">${k9Tot} Siswa</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;">Hadir Lengkap / Susulan</td>
                    </tr>
                    <tr style="background:#f8fafc;font-weight:700;">
                        <td colspan="2" style="border:1px solid #0f172a;padding:4px;text-align:center;">TOTAL PESERTA AKTIF</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;">${totL}</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;">${totP}</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;color:#1d4ed8;">${grandTot} Siswa</td>
                        <td style="border:1px solid #0f172a;padding:4px;text-align:center;">${groups.length} Ruang Ujian</td>
                    </tr>
                </tbody>
            </table>
            <p style="margin-top: 4px;"><strong>B. Jadwal & Pembagian Ruang:</strong> Asesmen utama berlangsung pada tanggal <strong>${escapeHtml(kegiatan.rentangUtama)}</strong> menggunakan <strong>${groups.length} ruang ujian</strong> (kapasitas maksimal ${appState.roomConfig.maxPerRoom || 20} peserta/ruang), dilanjutkan Asesmen Susulan pada tanggal <strong>${escapeHtml(kegiatan.rentangSusulan)}</strong>.</p>
`,
        `
            <div style="font-weight: 700; font-size: 10.5pt; text-align: center; margin-bottom: 0.15cm;">BAB IV — ANALISIS HASIL, FAKTOR PENDUKUNG, DAN HAMBATAN</div>
            <p><strong>A. Faktor Pendukung:</strong> 1) Tingginya dedikasi panitia pelaksana, pendidik, dan tenaga kependidikan; 2) Kesiapan administrasi ruang dan naskah soal yang terorganisasi baik; 3) Tingkat kehadiran peserta didik yang tinggi mencapai <strong>${escapeHtml(rekapConfig.lpjKehadiran)}%</strong>.</p>
            <p style="margin-top: 3px;"><strong>B. Hambatan & Solusi:</strong> Peserta yang terkendala hadir karena sakit atau cuaca difasilitasi melalui penyesuaian waktu dan pelaksanaan ${escapeHtml(kegiatan.singkatan)} Susulan secara tertib.</p>
`,
        `
            <div style="font-weight: 700; font-size: 10.5pt; text-align: center; margin-bottom: 0.15cm;">BAB V — LAPORAN KEUANGAN DAN REALISASI ANGGARAN</div>
            <p>Rekapitulasi penggunaan dana operasional ${escapeHtml(kegiatan.namaLengkap)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)} (Sumber Dana BOSP Tahun ${escapeHtml(kegiatan.tahunAnggaran)}):</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.6pt; margin: 4px 0;">
                <thead>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 6%;">No.</th>
                        <th style="border: 1px solid #0f172a; padding: 4px; text-align: left;">Uraian Pengeluaran</th>
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 18%;">Volume / Jumlah</th>
                        <th style="border: 1px solid #0f172a; padding: 4px; width: 22%; text-align: right;">Total Biaya (Rp)</th>
                    </tr>
                </thead>
                <tbody>
                    ${budgetRows}
                    <tr style="background: #f8fafc; font-weight: 700;">
                        <td colspan="3" style="border: 1px solid #0f172a; padding: 5px 8px; text-align: right;">TOTAL REALISASI ANGGARAN</td>
                        <td style="border: 1px solid #0f172a; padding: 5px 8px; text-align: right; color: #1d4ed8;">Rp ${totalBudget.toLocaleString('id-ID')}</td>
                    </tr>
                </tbody>
            </table>
`,
        `
            <div style="font-weight: 700; font-size: 10.5pt; text-align: center; margin-bottom: 0.15cm;">BAB VI — PENUTUP DAN REKOMENDASI</div>
            <p style="text-align: justify;">Secara keseluruhan, kegiatan ${escapeHtml(kegiatan.namaLengkap)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)} di ${escapeHtml(kop.sekolah)} telah terlaksana dengan baik, jujur, dan akuntabel.</p>

            <div style="border: 1px solid #0f172a; background: #f8fafc; padding: 6px 10px; border-radius: 4px; margin-top: 0.18cm; font-size: 8.2pt;">
                <div style="font-weight: 700; text-decoration: underline; margin-bottom: 2px;">LAMPIRAN-LAMPIRAN WAJIB DALAM BENDEL LAPORAN:</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1px 12px;">
                    <div>1. SK Penetapan Panitia, Pengawas & Korektor</div>
                    <div>6. Daftar Hadir Peserta & Berita Acara Ruang</div>
                    <div>2. Prosedur Operasional Standar (POS) ${escapeHtml(kegiatan.singkatan)}</div>
                    <div>7. Daftar Serah Terima Naskah Soal & LJK</div>
                    <div>3. Jadwal Asesmen Utama & Jadwal Pengawas</div>
                    <div>8. Rekapitulasi Nilai & Berkas Ujian Susulan</div>
                    <div>4. Tata Tertib Peserta & Tata Tertib Pengawas</div>
                    <div>9. Kartu Peserta, Denah Kursi & Nomor Meja</div>
                    <div>5. Daftar Hadir Panitia & Daftar Hadir Pengawas</div>
                    <div>10. Dokumentasi Foto Kegiatan Pelaksanaan</div>
                </div>
            </div>
`
    ];
    const babPages = babBlocks.map((inner, i) => babSheet(inner,
        i === babBlocks.length - 1 ? renderFullPageSignatureHTML(rekapConfig.lpjTanggal) : pageFooter(i + 1))).join('');

    return page1 + page2 + pageKataPengantar + pageDaftarIsi + babPages;
}
