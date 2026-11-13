// ============================================================================
// 12. RENDER MODUL 6: SK KEPANITIAAN, PENGAWAS RUANG & KOREKTOR (5 HALAMAN)
// ============================================================================
function renderSKCompleteHTML(paper) {
    const { kop, kegiatan, pengesahan, setting, committee, correctors } = appState;
    const theme = THEMES[setting.theme];
    const preset = ASSESSMENT_PRESETS[appState.assessmentMode];

    const committeeRows = committee.map((c, i) => `
        <tr>
            <td style="border: 1px solid #0f172a; padding: 4px 6px; text-align: center;">${i + 1}</td>
            <td style="border: 1px solid #0f172a; padding: 4px 8px;">
                <div style="font-weight: 700;">${escapeHtml(c.nama)}</div>
                <div style="font-size: 8.5pt;">NIP. ${escapeHtml(c.nip)}</div>
            </td>
            <td style="border: 1px solid #0f172a; padding: 4px 8px;">${escapeHtml(c.jabatanDinas)}</td>
            <td style="border: 1px solid #0f172a; padding: 4px 8px; font-weight: 700;">${escapeHtml(c.jabatanPanitia)}</td>
        </tr>
    `).join('');

    const correctorRows = correctors.map((cr, i) => `
        <tr>
            <td style="border: 1px solid #0f172a; padding: 4px 6px; text-align: center;">${i + 1}</td>
            <td style="border: 1px solid #0f172a; padding: 4px 8px; font-weight: 700;">${escapeHtml(cr.mapel)}</td>
            <td style="border: 1px solid #0f172a; padding: 4px 8px; text-align: center;">${preset.targetGrades.includes('VII') ? escapeHtml(cr.k7) : '-'}</td>
            <td style="border: 1px solid #0f172a; padding: 4px 8px; text-align: center;">${preset.targetGrades.includes('VIII') ? escapeHtml(cr.k8) : '-'}</td>
            <td style="border: 1px solid #0f172a; padding: 4px 8px; text-align: center;">${preset.targetGrades.includes('IX') ? escapeHtml(cr.k9) : '-'}</td>
        </tr>
    `).join('');

    // Rekap pengawas dari jadwal utama (ruang & pengawas aktif) dan jadwal susulan
    const cell = 'border: 1px solid #0f172a; padding: 4px 8px;';
    const rooms = Math.max(1, parseInt(appState.jumlahRuang, 10) || 1);
    const perRuang = getPengawasPerRuang();
    const norm = v => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const proctors = new Map();
    const proctorOf = name => {
        const key = norm(name);
        if (!proctors.has(key)) proctors.set(key, { nama: String(name).trim(), rooms: new Set(), utama: 0, susulan: 0 });
        return proctors.get(key);
    };
    (appState.schedule || []).forEach(d => (d.sesi || []).forEach(se => {
        for (let r = 0; r < rooms; r++) {
            const pair = (se.pengawas || [])[r] || [];
            for (let k = 0; k < perRuang; k++) {
                if (!norm(pair[k])) continue;
                const pr = proctorOf(pair[k]);
                pr.utama++;
                pr.rooms.add(r + 1);
            }
        }
    }));
    (appState.makeupSchedule || []).forEach(m => { if (norm(m.pengawas)) proctorOf(m.pengawas).susulan++; });
    // Butir tugas: satu per baris, nomor lama ("1." / "1)" / "-" / "•") dibuang lalu dinomori ulang
    const tugasItems = String(appState.tugasPengawas ?? '').split(/\r?\n/)
        .map(t => t.replace(/^\s*(?:\d+\s*[.)]|[-•*])\s*/, '').trim()).filter(Boolean);
    const tugasPengawasHTML = tugasItems.length ? `
            <div style="margin-top: 0.4cm; line-height: 1.32;">
                <div style="font-weight: 700;">Tugas Pengawas Ruang:</div>
                <table style="width: 100%; border-collapse: collapse;">
                    ${tugasItems.map((t, i) => `<tr><td style="width: 0.6cm; vertical-align: top; padding: 0;">${i + 1}.</td><td style="vertical-align: top; text-align: justify; padding: 0;">${escapeHtml(t)}</td></tr>`).join('')}
                </table>
            </div>` : '';
    const committeeByName = new Map(committee.map(c => [norm(c.nama), c]));
    const proctorRows = [...proctors.values()].map((pr, i) => {
        const c = committeeByName.get(norm(pr.nama));
        const roomText = [...pr.rooms].sort((a, b) => a - b).map(r => padRoom(r)).join(', ') || '-';
        return `
        <tr>
            <td style="${cell} text-align: center;">${i + 1}</td>
            <td style="${cell}">
                <div style="font-weight: 700;">${escapeHtml(pr.nama)}</div>
                ${c && c.nip ? `<div style="font-size: 8.5pt;">NIP. ${escapeHtml(c.nip)}</div>` : ''}
            </td>
            <td style="${cell}">${escapeHtml(c && c.jabatanDinas ? c.jabatanDinas : 'Guru')}</td>
            <td style="${cell} text-align: center;">${roomText}</td>
            <td style="${cell} text-align: center;">${pr.utama || '-'}</td>
            <td style="${cell} text-align: center;">${pr.susulan || '-'}</td>
        </tr>`;
    }).join('') || `<tr><td colspan="6" style="${cell} text-align: center; font-style: italic;">Belum ada pengawas pada Jadwal &amp; Pengawas.</td></tr>`;

    // Halaman 1: Batang Tubuh SK
    const page1 = `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.8cm 1.2cm; font-size: 9.5pt; line-height: 1.28;">
        <div>
            ${renderFullPageKopHTML(theme)}
            <div style="text-align: center; font-weight: 700; margin: 0.15cm 0 0.25cm 0; line-height: 1.25;">
                <div>SURAT KEPUTUSAN</div>
                <div>KEPALA ${escapeHtml(kop.sekolah)}</div>
                <div>NOMOR: ${escapeHtml(kegiatan.noSk)}</div>
                <div style="margin-top: 3px;">TENTANG</div>
                <div style="text-transform: uppercase;">PEMBENTUKAN PANITIA PELAKSANA, PENGAWAS RUANG, DAN KOREKTOR</div>
                <div style="text-transform: uppercase;">${escapeHtml(kegiatan.namaLengkap)}</div>
                <div style="text-transform: uppercase;">${escapeHtml(kegiatan.tapel)}</div>
                <div style="margin-top: 4px;">KEPALA ${escapeHtml(kop.sekolah)}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                <tr>
                    <td style="width: 16%; vertical-align: top; font-weight: 700; padding: 2px 0;">Menimbang</td>
                    <td style="width: 2%; vertical-align: top; padding: 2px 4px;">:</td>
                    <td style="width: 4%; vertical-align: top; padding: 2px 0;">a.</td>
                    <td style="vertical-align: top; text-align: justify; padding: 2px 0;">Bahwa dalam rangka ${preset.purposeText}, perlu diselenggarakan kegiatan ${escapeHtml(kegiatan.namaLengkap)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)};</td>
                </tr>
                <tr>
                    <td></td><td></td>
                    <td style="vertical-align: top; padding: 2px 0;">b.</td>
                    <td style="vertical-align: top; text-align: justify; padding: 2px 0;">Bahwa agar pelaksanaan ${escapeHtml(kegiatan.namaLengkap)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)} berjalan dengan tertib, lancar, efektif, dan akuntabel, dipandang perlu membentuk Panitia Pelaksana, Penyusun Soal, Pengawas Ruang, dan Korektor;</td>
                </tr>
                <tr>
                    <td></td><td></td>
                    <td style="vertical-align: top; padding: 2px 0;">c.</td>
                    <td style="vertical-align: top; text-align: justify; padding: 2px 0;">Bahwa nama-nama yang tercantum dalam lampiran Surat Keputusan ini dipandang cakap dan mampu melaksanakan tugas kepanitiaan dimaksud.</td>
                </tr>
                <tr>
                    <td style="vertical-align: top; font-weight: 700; padding: 4px 0 2px 0;">Mengingat</td>
                    <td style="vertical-align: top; padding: 4px 4px 2px 4px;">:</td>
                    <td style="vertical-align: top; padding: 4px 0 2px 0;">1.</td>
                    <td style="vertical-align: top; padding: 4px 0 2px 0;">Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;</td>
                </tr>
                <tr><td></td><td></td><td style="vertical-align: top;">2.</td><td style="vertical-align: top;">Peraturan Pemerintah Nomor 57 Tahun 2021 tentang Standar Nasional Pendidikan sebagaimana telah diubah dengan Peraturan Pemerintah Nomor 4 Tahun 2022;</td></tr>
                <tr><td></td><td></td><td style="vertical-align: top;">3.</td><td style="vertical-align: top;">Permendikbudristek Nomor 21 Tahun 2022 tentang Standar Penilaian Pendidikan pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah;</td></tr>
                <tr><td></td><td></td><td style="vertical-align: top;">4.</td><td style="vertical-align: top;">Permendikbudristek Nomor 12 Tahun 2024 tentang Kurikulum pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah;</td></tr>
                <tr><td></td><td></td><td style="vertical-align: top;">5.</td><td style="vertical-align: top;">Kalender Pendidikan ${escapeHtml(toTitleCase(kop.dinas))} ${escapeHtml(kop.kabupaten)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)};</td></tr>
                <tr><td></td><td></td><td style="vertical-align: top;">6.</td><td style="vertical-align: top;">Program Kerja Tahunan ${escapeHtml(kop.sekolah)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)}.</td></tr>
                <tr>
                    <td style="vertical-align: top; font-weight: 700; padding: 4px 0;">Memperhatikan</td>
                    <td style="vertical-align: top; padding: 4px 4px;">:</td>
                    <td colspan="2" style="vertical-align: top; text-align: justify; padding: 4px 0;">Hasil Rapat Dewan Guru dan Tenaga Kependidikan ${escapeHtml(kop.sekolah)} pada tanggal ${escapeHtml(kegiatan.tglSk)} tentang Persiapan Pelaksanaan ${escapeHtml(kegiatan.namaLengkap)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)}.</td>
                </tr>
            </table>

            <div style="text-align: center; font-weight: 700; margin: 0.18cm 0;">MEMUTUSKAN</div>

            <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                <tr>
                    <td style="width: 16%; vertical-align: top; font-weight: 700;">Menetapkan</td>
                    <td style="width: 2%; vertical-align: top; padding: 0 4px;">:</td>
                    <td></td>
                </tr>
                <tr>
                    <td style="vertical-align: top; font-weight: 700; padding: 2px 0;">KESATU</td>
                    <td style="vertical-align: top; padding: 2px 4px;">:</td>
                    <td style="vertical-align: top; text-align: justify; padding: 2px 0;">Membentuk Panitia Pelaksana, Penyusun Kisi-Kisi dan Soal, Pengawas Ruang, serta Pemeriksa/Korektor Hasil ${escapeHtml(kegiatan.namaLengkap)} ${escapeHtml(kop.sekolah)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)} sebagaimana tercantum dalam Lampiran Surat Keputusan ini.</td>
                </tr>
                <tr>
                    <td style="vertical-align: top; font-weight: 700; padding: 2px 0;">KEDUA</td>
                    <td style="vertical-align: top; padding: 2px 4px;">:</td>
                    <td style="vertical-align: top; text-align: justify; padding: 2px 0;">Panitia, Penyusun Soal, Pengawas Ruang, dan Korektor bertugas merencanakan, mempersiapkan, melaksanakan, serta melaporkan seluruh rangkaian kegiatan ${escapeHtml(kegiatan.singkatan)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)} kepada Kepala Sekolah sesuai dengan rincian tugas terlampir.</td>
                </tr>
                <tr>
                    <td style="vertical-align: top; font-weight: 700; padding: 2px 0;">KETIGA</td>
                    <td style="vertical-align: top; padding: 2px 4px;">:</td>
                    <td style="vertical-align: top; text-align: justify; padding: 2px 0;">Segala biaya yang timbul akibat diterbitkannya Surat Keputusan ini dibebankan pada Anggaran Dana Bantuan Operasional Satuan Pendidikan (BOSP) ${escapeHtml(kop.sekolah)} Tahun Anggaran ${escapeHtml(kegiatan.tahunAnggaran)} sesuai dengan ketentuan yang berlaku.</td>
                </tr>
                <tr>
                    <td style="vertical-align: top; font-weight: 700; padding: 2px 0;">KEEMPAT</td>
                    <td style="vertical-align: top; padding: 2px 4px;">:</td>
                    <td style="vertical-align: top; text-align: justify; padding: 2px 0;">Surat Keputusan ini mulai berlaku sejak tanggal ditetapkan, dengan ketentuan apabila di kemudian hari terdapat kekeliruan dalam penetapan ini akan diadakan perbaikan sebagaimana mestinya.</td>
                </tr>
            </table>
        </div>

        <div>
            ${renderFullPageSignatureHTML(kegiatan.tglSk)}
            <div style="font-size: 8pt; margin-top: -0.4cm;">
                <div style="font-weight: 700; text-decoration: underline;">Tembusan Yth.:</div>
                <div>1. Kepala ${escapeHtml(toTitleCase(kop.dinas))} ${escapeHtml(kop.kabupaten)};</div>
                <div>2. Pengawas Bina SMP ${escapeHtml(toTitleCase(kop.dinas))} ${escapeHtml(kop.kabupaten)};</div>
                <div>3. Yang bersangkutan untuk dilaksanakan;</div>
                <div>4. Arsip.</div>
            </div>
        </div>
    </div>`;

    // Halaman 2: Lampiran I Susunan Panitia
    const page2 = `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.9cm 1.2cm; font-size: 9.5pt;">
        <div>
            <div style="margin-left: 50%; font-size: 9pt; line-height: 1.25; margin-bottom: 0.4cm;">
                <div style="font-weight: 700;">LAMPIRAN I</div>
                <div>Keputusan Kepala ${escapeHtml(kop.sekolah)}</div>
                <div>Nomor : ${escapeHtml(kegiatan.noSk)}</div>
                <div>Tanggal : ${escapeHtml(kegiatan.tglSk)}</div>
            </div>

            <div style="text-align: center; font-weight: 700; margin-bottom: 0.35cm; line-height: 1.25;">
                <div>SUSUNAN PANITIA PELAKSANA</div>
                <div style="text-transform: uppercase;">${escapeHtml(kegiatan.namaLengkap)}</div>
                <div style="text-transform: uppercase;">${escapeHtml(kop.sekolah)} ${escapeHtml(kegiatan.tapel)}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
                <thead>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 6%;">No</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 34%;">Nama / NIP</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 25%;">Jabatan Dinas</th>
                        <th style="border: 1px solid #0f172a; padding: 6px; width: 35%;">Jabatan Kepanitiaan</th>
                    </tr>
                </thead>
                <tbody>${committeeRows}</tbody>
            </table>
        </div>
        ${renderFullPageSignatureHTML(kegiatan.tglSk)}
    </div>`;

    // Halaman 3: Lampiran II Rincian Tugas Pokok Panitia
    const page3 = `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.9cm 1.2cm; font-size: 9.5pt; line-height: 1.32;">
        <div>
            <div style="margin-left: 50%; font-size: 9pt; line-height: 1.25; margin-bottom: 0.35cm;">
                <div style="font-weight: 700;">LAMPIRAN II</div>
                <div>Keputusan Kepala ${escapeHtml(kop.sekolah)}</div>
                <div>Nomor : ${escapeHtml(kegiatan.noSk)}</div>
                <div>Tanggal : ${escapeHtml(kegiatan.tglSk)}</div>
            </div>

            <div style="text-align: center; font-weight: 700; margin-bottom: 0.3cm; line-height: 1.25;">
                <div>RINCIAN TUGAS POKOK PANITIA PELAKSANA</div>
                <div style="text-transform: uppercase;">${escapeHtml(kegiatan.namaLengkap)}</div>
                <div style="text-transform: uppercase;">${escapeHtml(kop.sekolah)} ${escapeHtml(kegiatan.tapel)}</div>
            </div>

            <div style="space-y: 0.2cm;">
                <p><strong>1. Penanggung Jawab (Kepala Sekolah)</strong><br>
                • Bertanggung jawab secara keseluruhan atas perencanaan, pelaksanaan, monitoring, dan evaluasi kegiatan ${escapeHtml(kegiatan.singkatan)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)}.<br>
                • Menetapkan kebijakan strategis dan mengesahkan seluruh dokumen administrasi kepanitiaan.</p>

                <p style="margin-top: 6px;"><strong>2. Ketua Pelaksana</strong><br>
                • Mengoordinasikan seluruh tahapan kegiatan mulai dari persiapan, pelaksanaan, hingga pelaporan.<br>
                • Menyusun program kerja (Proker), Prosedur Operasional Standar (POS), dan jadwal kegiatan ${escapeHtml(kegiatan.singkatan)} bersama Sekretaris.<br>
                • Memimpin rapat koordinasi panitia, penyusun soal, dan pengawas ruang.</p>

                <p style="margin-top: 6px;"><strong>3. Sekretaris</strong><br>
                • Menyusun kelengkapan administrasi kepanitiaan (daftar hadir panitia, daftar hadir pengawas, daftar hadir peserta, berita acara, tata tertib, nomor meja, kartu peserta, dan denah ruang).<br>
                • Membuat jadwal pengawasan ruang dan rekapitulasi kehadiran peserta didik.<br>
                • Menyusun laporan akhir pelaksanaan kegiatan ${escapeHtml(kegiatan.namaLengkap)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)}.</p>

                <p style="margin-top: 6px;"><strong>4. Bendahara</strong><br>
                • Menyusun Rencana Anggaran Biaya (RAB) kegiatan ${escapeHtml(kegiatan.singkatan)} sesuai pagu RKAS/BOSP bersama Ketua Panitia.<br>
                • Mengelola pencairan, pendistribusian, dan penyusunan laporan pertanggungjawaban (SPJ) keuangan kegiatan secara akuntabel.</p>

                <p style="margin-top: 6px;"><strong>5. Koordinator Naskah / Proktor & Teknisi</strong><br>
                • Mengumpulkan kisi-kisi, kartu soal, dan naskah soal dari guru mata pelajaran (${preset.targetGradesText}).<br>
                • Melakukan verifikasi kelengkapan format naskah soal maupun penginputan ke dalam sistem/aplikasi asesmen.<br>
                • Menjaga kerahasiaan, ketertiban, dan keamanan dokumen naskah asesmen.</p>

                <p style="margin-top: 6px;"><strong>6. Seksi Penggandaan & Pendistribusian Soal</strong><br>
                • Menggandakan dan melakukan pengepakan naskah soal beserta lembar jawaban per ruang ujian sesuai jumlah peserta.<br>
                • Mendistribusikan amplop soal kepada pengawas ruang dan menerima kembali lembar jawaban yang telah terisi untuk diserahkan kepada guru mata pelajaran/korektor.</p>

                <p style="margin-top: 6px;"><strong>7. Seksi Pengaturan Ruang & Perlengkapan</strong><br>
                • Menyiapkan ruang asesmen, memasang nomor peserta pada meja, serta menempelkan denah tempat duduk dan jadwal di setiap ruang.<br>
                • Menjaga kebersihan, ketertiban, dan kelengkapan sarana prasarana selama asesmen berlangsung.</p>
            </div>
        </div>
        ${renderFullPageSignatureHTML(kegiatan.tglSk)}
    </div>`;

    // Halaman 4: Lampiran III Daftar Pengawas Ruang
    const pagePengawas = `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.9cm 1.2cm; font-size: 9.5pt;">
        <div>
            <div style="margin-left: 50%; font-size: 9pt; line-height: 1.25; margin-bottom: 0.35cm;">
                <div style="font-weight: 700;">LAMPIRAN III</div>
                <div>Keputusan Kepala ${escapeHtml(kop.sekolah)}</div>
                <div>Nomor : ${escapeHtml(kegiatan.noSk)}</div>
                <div>Tanggal : ${escapeHtml(kegiatan.tglSk)}</div>
            </div>

            <div style="text-align: center; font-weight: 700; margin-bottom: 0.3cm; line-height: 1.25;">
                <div style="text-transform: uppercase;">DAFTAR PENGAWAS RUANG ${escapeHtml(kegiatan.namaLengkap)}</div>
                <div style="text-transform: uppercase;">${escapeHtml(kop.sekolah)} ${escapeHtml(kegiatan.tapel)}</div>
                <div style="font-size: 9pt; font-weight: 400;">Jumlah Ruang: ${rooms} &bull; ${perRuang} Pengawas per Ruang &bull; ${proctors.size} Orang Pengawas</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                <thead>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th rowspan="2" style="border: 1px solid #0f172a; padding: 5px; width: 6%;">No</th>
                        <th rowspan="2" style="border: 1px solid #0f172a; padding: 5px; width: 34%;">Nama / NIP</th>
                        <th rowspan="2" style="border: 1px solid #0f172a; padding: 5px; width: 20%;">Jabatan Dinas</th>
                        <th rowspan="2" style="border: 1px solid #0f172a; padding: 5px; width: 16%;">Ruang yang Diawasi</th>
                        <th colspan="2" style="border: 1px solid #0f172a; padding: 5px; width: 24%;">Jumlah Tugas (Sesi)</th>
                    </tr>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th style="border: 1px solid #0f172a; padding: 4px;">Utama</th>
                        <th style="border: 1px solid #0f172a; padding: 4px;">Susulan</th>
                    </tr>
                </thead>
                <tbody>${proctorRows}</tbody>
            </table>

            ${tugasPengawasHTML}
        </div>
        ${renderFullPageSignatureHTML(kegiatan.tglSk)}
    </div>`;

    // Halaman 5: Lampiran IV Daftar Penyusun Soal & Korektor
    const page4 = `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.9cm 1.2cm; font-size: 9.5pt;">
        <div>
            <div style="margin-left: 50%; font-size: 9pt; line-height: 1.25; margin-bottom: 0.35cm;">
                <div style="font-weight: 700;">LAMPIRAN IV</div>
                <div>Keputusan Kepala ${escapeHtml(kop.sekolah)}</div>
                <div>Nomor : ${escapeHtml(kegiatan.noSk)}</div>
                <div>Tanggal : ${escapeHtml(kegiatan.tglSk)}</div>
            </div>

            <div style="text-align: center; font-weight: 700; margin-bottom: 0.3cm; line-height: 1.25;">
                <div style="text-transform: uppercase;">DAFTAR PENYUSUN SOAL DAN KOREKTOR ${escapeHtml(kegiatan.namaLengkap)}</div>
                <div style="text-transform: uppercase;">${escapeHtml(kop.sekolah)} ${escapeHtml(kegiatan.tapel)}</div>
                <div style="font-size: 9pt; color: #1d4ed8;">Sasaran Jenjang: ${preset.targetGradesText}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                <thead>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th style="border: 1px solid #0f172a; padding: 5px; width: 6%;">No</th>
                        <th style="border: 1px solid #0f172a; padding: 5px; width: 34%;">Mata Pelajaran</th>
                        <th style="border: 1px solid #0f172a; padding: 5px; width: 20%;">Kelas VII</th>
                        <th style="border: 1px solid #0f172a; padding: 5px; width: 20%;">Kelas VIII</th>
                        <th style="border: 1px solid #0f172a; padding: 5px; width: 20%;">Kelas IX</th>
                    </tr>
                </thead>
                <tbody>${correctorRows}</tbody>
            </table>
        </div>
        ${renderFullPageSignatureHTML(kegiatan.tglSk)}
    </div>`;

    return page1 + page2 + page3 + pagePengawas + page4;
}

// ============================================================================
// 13. RENDER MODUL 7: PROSEDUR OPERASIONAL STANDAR / POS (4 HALAMAN LENGKAP)
// ============================================================================
function renderPOSCompleteHTML(paper) {
    const { kop, kegiatan, pengesahan, setting, committee, correctors, schedule } = appState;
    const theme = THEMES[setting.theme];
    const preset = ASSESSMENT_PRESETS[appState.assessmentMode];

    // Halaman 1: Sampul Resmi POS
    const coverPOS = `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between items-center text-center"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 1.4cm 1.5cm; border: 3px double #1e293b;">
        
        <div style="width: 100%;">
            <div style="font-size: 13pt; font-weight: 700; line-height: 1.3;">
                <div>${escapeHtml(kop.pemda)}</div>
                <div>${escapeHtml(kop.dinas)}</div>
                <div style="font-size: 14pt; color: #1e3a8a;">${escapeHtml(kop.uptd)} ${escapeHtml(kop.sekolah)}</div>
            </div>
            <div style="border-top: 2.5px solid #0f172a; border-bottom: 1px solid #0f172a; height: 3px; margin: 0.35cm 0 0.8cm 0;"></div>

            <div style="display: flex; justify-content: center; align-items: center; gap: 1.8cm; margin: 0.8cm 0;">
                <img src="${kop.logoKiri}" style="width: 3.4cm; height: 3.4cm; object-fit: contain;">
                <img src="${kop.logoKanan}" style="width: 3.4cm; height: 3.4cm; object-fit: contain;">
            </div>

            <div style="font-size: 11pt; font-weight: 700; letter-spacing: 1.5px; color: #475569; margin-top: 0.6cm;">DOKUMEN RESMI SATUAN PENDIDIKAN</div>
            <div style="font-size: 20pt; font-weight: 700; margin-top: 0.15cm; text-decoration: underline;">PROSEDUR OPERASIONAL STANDAR (POS)</div>
            
            <div style="border: 2px solid #1e3a8a; background: #eff6ff; padding: 0.35cm 0.5cm; border-radius: 6px; margin: 0.5cm auto; max-width: 15cm;">
                <div style="font-size: 13pt; font-weight: 700;">PENYELENGGARAAN</div>
                <div style="font-size: 14pt; font-weight: 700; color: #1e3a8a; text-transform: uppercase; margin-top: 2px;">${escapeHtml(kegiatan.namaLengkap)}</div>
                <div style="font-size: 11pt; font-weight: 700; margin-top: 4px;">SASARAN PESERTA: ${preset.targetGradesText.toUpperCase()}</div>
            </div>

            <div style="font-size: 14pt; font-weight: 700; margin-top: 0.3cm;">${escapeHtml(kegiatan.tapel)}</div>

            <div style="border: 1px solid #94a3b8; background: #f8fafc; padding: 0.25cm 0.6cm; display: inline-block; border-radius: 4px; margin-top: 0.6cm; text-align: left; font-size: 10pt;">
                <div><strong>Ditetapkan dengan Keputusan Kepala ${escapeHtml(kop.sekolah)}</strong></div>
                <div>Nomor &nbsp;&nbsp;&nbsp;: ${escapeHtml(kegiatan.noPos)}</div>
                <div>Tanggal &nbsp;: ${escapeHtml(pengesahan.tanggal)}</div>
            </div>
        </div>

        <div style="width: 100%; border-top: 2px solid #0f172a; padding-top: 0.3cm;">
            <div style="font-size: 13pt; font-weight: 700;">${escapeHtml(kop.sekolah)}</div>
            <div style="font-size: 10pt; font-weight: 700; color: #0369a1; margin: 2px 0;">${escapeHtml(kop.motto || '')}</div>
            <div style="font-size: 9.5pt;">${escapeHtml(kop.wilayah || '')}</div>
        </div>
    </div>`;

    // Halaman 2: BAB I, II, III
    const committeeRowsCompact = committee.map((c, i) => `
        <tr>
            <td style="border: 1px solid #0f172a; padding: 3px 5px; text-align: center;">${i + 1}</td>
            <td style="border: 1px solid #0f172a; padding: 3px 6px; font-weight: 700;">${escapeHtml(c.jabatanPanitia)}</td>
            <td style="border: 1px solid #0f172a; padding: 3px 6px;">${escapeHtml(c.nama)} (NIP. ${escapeHtml(c.nip)})</td>
            <td style="border: 1px solid #0f172a; padding: 3px 6px;">${escapeHtml(c.jabatanDinas)}</td>
        </tr>
    `).join('');

    const posPage2 = `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.8cm 1.2cm; font-size: 9.2pt; line-height: 1.28;">
        <div>
            ${renderFullPageKopHTML(theme)}
            <div style="text-align: center; font-weight: 700; margin-bottom: 0.2cm; line-height: 1.2;">
                <div>KEPUTUSAN KEPALA ${escapeHtml(kop.sekolah)}</div>
                <div>NOMOR: ${escapeHtml(kegiatan.noPos)}</div>
                <div>TENTANG PROSEDUR OPERASIONAL STANDAR (POS) PENYELENGGARAAN</div>
                <div style="text-transform: uppercase;">${escapeHtml(kegiatan.namaLengkap)} ${escapeHtml(kegiatan.tapel)}</div>
            </div>

            <div style="font-weight: 700; text-align: center; margin: 0.15cm 0 0.1cm 0;">BAB I — PENDAHULUAN</div>
            <p style="text-align: justify;"><strong>A. Latar Belakang:</strong> ${escapeHtml(kegiatan.namaLengkap)} merupakan kegiatan pengukuran dan penilaian pencapaian kompetensi peserta didik ${preset.targetGradesText} setelah menyelesaikan kegiatan pembelajaran pada Kurikulum Merdeka. Agar penyelenggaraan ${escapeHtml(kegiatan.singkatan)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)} di ${escapeHtml(kop.sekolah)} berjalan tertib, lancar, efektif, dan akuntabel, perlu ditetapkan Prosedur Operasional Standar (POS) sebagai pedoman teknis.</p>
            <p style="margin-top: 4px;"><strong>B. Dasar Hukum:</strong> 1) UU Nomor 20 Tahun 2003 tentang Sisdiknas; 2) PP Nomor 57 Tahun 2021 jo. PP Nomor 4 Tahun 2022 tentang Standar Nasional Pendidikan; 3) Permendikbudristek Nomor 21 Tahun 2022 tentang Standar Penilaian Pendidikan; 4) Permendikbudristek Nomor 12 Tahun 2024 tentang Kurikulum Merdeka; 5) Kalender Pendidikan ${escapeHtml(toTitleCase(kop.dinas))} ${escapeHtml(kop.kabupaten)} T.P. ${escapeHtml(kegiatan.tapelAngka)}; 6) SK Kepala ${escapeHtml(kop.sekolah)} Nomor: ${escapeHtml(kegiatan.noSk)} tanggal ${escapeHtml(kegiatan.tglSk)}.</p>
            <p style="margin-top: 4px;"><strong>C. Tujuan dan Fungsi:</strong> Mengukur pencapaian hasil belajar peserta didik ${preset.targetGradesText} sesuai Tujuan Pembelajaran (TP) dan Capaian Pembelajaran (CP) serta menjadi bahan pertimbangan pengisian Laporan Hasil Belajar (E-Rapor) Semester ${escapeHtml(kegiatan.semester)}.</p>

            <div style="font-weight: 700; text-align: center; margin: 0.18cm 0 0.1cm 0;">BAB II — PESERTA DAN SATUAN PENDIDIKAN PELAKSANA</div>
            <p style="text-align: justify;"><strong>A. Persyaratan Peserta:</strong> 1) Terdaftar aktif sebagai peserta didik ${preset.targetGradesText} pada ${escapeHtml(kop.sekolah)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)} dan tercatat dalam Dapodik; 2) Mengikuti pembelajaran dengan kehadiran minimal 80% dari hari efektif; 3) Memiliki Kartu Peserta ${escapeHtml(kegiatan.singkatan)} yang disahkan Kepala Sekolah.</p>
            <p style="margin-top: 4px;"><strong>B. Hak & Kewajiban Peserta:</strong> Berhak mengikuti asesmen utama maupun susulan (dengan bukti sah) serta wajib mematuhi seluruh Tata Tertib Peserta ${escapeHtml(kegiatan.singkatan)}.</p>

            <div style="font-weight: 700; text-align: center; margin: 0.18cm 0 0.1cm 0;">BAB III — KEPANITIAAN DAN PENYELENGGARA</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-top: 4px;">
                <thead>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th style="border: 1px solid #0f172a; padding: 3px; width: 6%;">No</th>
                        <th style="border: 1px solid #0f172a; padding: 3px; width: 32%;">Jabatan Kepanitiaan</th>
                        <th style="border: 1px solid #0f172a; padding: 3px; width: 38%;">Nama / NIP</th>
                        <th style="border: 1px solid #0f172a; padding: 3px; width: 24%;">Jabatan Dinas</th>
                    </tr>
                </thead>
                <tbody>${committeeRowsCompact}</tbody>
            </table>
        </div>
        <div style="font-size: 8pt; color: #64748b; text-align: right;">POS ${escapeHtml(kegiatan.singkatan)} ${escapeHtml(kop.sekolah)} — Halaman 2</div>
    </div>`;

    // Halaman 3: BAB IV & BAB V
    const mapelSpecRows = correctors.map((cr, i) => `
        <tr>
            <td style="border: 1px solid #0f172a; padding: 2.5px 5px; text-align: center;">${i + 1}</td>
            <td style="border: 1px solid #0f172a; padding: 2.5px 6px; font-weight: 700;">${escapeHtml(cr.mapel)}</td>
            <td style="border: 1px solid #0f172a; padding: 2.5px 6px; text-align: center;">${escapeHtml(cr.bentuk || 'PT: 25 / B-S: 5 / MJ: 5 / IS: 5 / U: 5 (45 soal)')}</td>
            <td style="border: 1px solid #0f172a; padding: 2.5px 6px; text-align: center;">${escapeHtml(cr.waktu || '90 Menit')}</td>
        </tr>
    `).join('');

    const scheduleRowsPOS = schedule.map(d => `
        <tr>
            <td style="border: 1px solid #0f172a; padding: 3px 6px; font-weight: 700;">${escapeHtml(d.hari)}, ${escapeHtml(d.tanggal)}</td>
            <td style="border: 1px solid #0f172a; padding: 3px 6px; text-align: center;">I<br>II</td>
            <td style="border: 1px solid #0f172a; padding: 3px 6px; text-align: center;">${d.sesi.map(ss => escapeHtml(ss.waktu)).join('<br>')}</td>
            <td style="border: 1px solid #0f172a; padding: 3px 6px;">${d.sesi.map((ss, i) => `${i + 1}. ${escapeHtml(ss.mapel)}`).join('<br>')}</td>
        </tr>
    `).join('');

    const posPage3 = `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.8cm 1.2cm; font-size: 9pt; line-height: 1.25;">
        <div>
            <div style="font-weight: 700; text-align: center; margin-bottom: 0.1cm;">BAB IV — PENYIAPAN BAHAN DAN INSTRUMEN ASESMEN</div>
            <p style="text-align: justify;"><strong>A. Ketentuan Penyusunan:</strong> Naskah soal disusun oleh guru mata pelajaran disertai Kisi-kisi, Kartu Soal, Naskah Soal, serta Kunci Jawaban & Rubrik Penskoran. Proporsi level kognitif: Level 1 (Pemahaman) ±25%, Level 2 (Penerapan) ±50%, dan Level 3 (Penalaran) ±25%.</p>
            <p style="margin-top: 3px;"><strong>B. Mata Pelajaran, Bentuk Soal (PT, B/S, MJ, IS, U), dan Alokasi Waktu:</strong></p>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.2pt; margin-top: 3px;">
                <thead>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th style="border: 1px solid #0f172a; padding: 3px; width: 6%;">No</th>
                        <th style="border: 1px solid #0f172a; padding: 3px; width: 38%;">Mata Pelajaran</th>
                        <th style="border: 1px solid #0f172a; padding: 3px; width: 40%;">Bentuk & Jumlah Soal</th>
                        <th style="border: 1px solid #0f172a; padding: 3px; width: 16%;">Alokasi Waktu</th>
                    </tr>
                </thead>
                <tbody>${mapelSpecRows}</tbody>
            </table>

            <div style="font-weight: 700; text-align: center; margin: 0.2cm 0 0.1cm 0;">BAB V — PELAKSANAAN ASESMEN</div>
            <p><strong>A. Moda Pelaksanaan:</strong> Diselenggarakan secara tatap muka menggunakan moda <strong>${escapeHtml(kegiatan.moda)}</strong> pada tanggal <strong>${escapeHtml(kegiatan.rentangUtama)}</strong>.</p>
            <p style="margin-top: 3px;"><strong>B. Jadwal Pelaksanaan ${escapeHtml(kegiatan.singkatan)} Utama:</strong></p>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.2pt; margin-top: 3px;">
                <thead>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th style="border: 1px solid #0f172a; padding: 3px; width: 25%;">Hari / Tanggal</th>
                        <th style="border: 1px solid #0f172a; padding: 3px; width: 10%;">Jam Ke-</th>
                        <th style="border: 1px solid #0f172a; padding: 3px; width: 22%;">Waktu (WIB)</th>
                        <th style="border: 1px solid #0f172a; padding: 3px; width: 43%;">Mata Pelajaran</th>
                    </tr>
                </thead>
                <tbody>${scheduleRowsPOS}</tbody>
            </table>
            <p style="margin-top: 5px;"><strong>C. Jadwal Susulan & Pengaturan Ruang:</strong> Asesmen Susulan dilaksanakan pada tanggal <strong>${escapeHtml(kegiatan.rentangSusulan)}</strong>. Setiap ruang ditempati maksimal ${appState.roomConfig.maxPerRoom || 20} peserta didik dan diawasi oleh 2 (dua) orang Pengawas Ruang.</p>
        </div>
        <div style="font-size: 8pt; color: #64748b; text-align: right;">POS ${escapeHtml(kegiatan.singkatan)} ${escapeHtml(kop.sekolah)} — Halaman 3</div>
    </div>`;

    // Halaman 4: BAB VI, VII, VIII, IX + Pengesahan
    const posPage4 = `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.8cm 1.2cm; font-size: 9pt; line-height: 1.28;">
        <div>
            <div style="font-weight: 700; text-align: center; margin-bottom: 0.08cm;">BAB VI — PENGAWASAN, TATA TERTIB, DAN SANKSI</div>
            <p style="text-align: justify;">Setiap ruang diawasi oleh ${getPengawasPerRuang() === 1 ? '1 (satu) orang' : '2 (dua) orang'} pengawas ruang. Pengawas dan peserta wajib mematuhi Tata Tertib yang ditetapkan. Pelanggaran dikenakan sanksi bertahap mulai dari Teguran Lisan, Pencatatan pada Berita Acara, hingga Dikeluarkan dari Ruang Asesmen.</p>

            <div style="font-weight: 700; text-align: center; margin: 0.18cm 0 0.08cm 0;">BAB VII — PEMERIKSAAN DAN PENGOLAHAN HASIL ASESMEN</div>
            <p style="text-align: justify;">Nilai ${escapeHtml(kegiatan.singkatan)} setiap mata pelajaran dihitung pada skala 0–100 dengan pembobotan per bentuk soal sebagai berikut:</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin: 4px 0;">
                <thead>
                    <tr style="background: #e2e8f0; font-weight: 700;">
                        <th style="border: 1px solid #0f172a; padding: 3px; width: 6%;">No</th>
                        <th style="border: 1px solid #0f172a; padding: 3px;">Bentuk Soal</th>
                        <th style="border: 1px solid #0f172a; padding: 3px; text-align: center;">Jumlah Soal (Kel. A / Kel. B)</th>
                        <th style="border: 1px solid #0f172a; padding: 3px; text-align: center;">Bobot</th>
                        <th style="border: 1px solid #0f172a; padding: 3px; text-align: center;">Skor/Butir (Kel. A / B)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style="border:1px solid #0f172a;padding:3px;text-align:center;">1</td><td style="border:1px solid #0f172a;padding:3px;">Pilihan Tunggal (PT)</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;">20 / 25</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;font-weight:700;">40%</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;">2,00 / 1,60</td></tr>
                    <tr><td style="border:1px solid #0f172a;padding:3px;text-align:center;">2</td><td style="border:1px solid #0f172a;padding:3px;">Benar / Salah (B/S)</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;">5 / 5</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;font-weight:700;">10%</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;">2,00 / 2,00</td></tr>
                    <tr><td style="border:1px solid #0f172a;padding:3px;text-align:center;">3</td><td style="border:1px solid #0f172a;padding:3px;">Menjodohkan (MJ)</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;">5 / 5</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;font-weight:700;">10%</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;">2,00 / 2,00</td></tr>
                    <tr><td style="border:1px solid #0f172a;padding:3px;text-align:center;">4</td><td style="border:1px solid #0f172a;padding:3px;">Isian Singkat (IS)</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;">5 / 5</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;font-weight:700;">15%</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;">3,00 / 3,00</td></tr>
                    <tr><td style="border:1px solid #0f172a;padding:3px;text-align:center;">5</td><td style="border:1px solid #0f172a;padding:3px;">Uraian (U)</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;">5 / 5</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;font-weight:700;">25%</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;">5,00 / 5,00</td></tr>
                    <tr style="background:#f8fafc;font-weight:700;"><td colspan="2" style="border:1px solid #0f172a;padding:3px;text-align:center;">JUMLAH</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;">40 / 45 Soal</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;">100%</td><td style="border:1px solid #0f172a;padding:3px;text-align:center;">Skala 100</td></tr>
                </tbody>
            </table>
            <div style="border: 1px solid #0f172a; background: #f8fafc; padding: 5px 8px; font-weight: 700; text-align: center; font-size: 8.5pt; margin-top: 4px;">
                Rumus Nilai ${escapeHtml(kegiatan.singkatan)} = [(SPT / SPT maks) × 40] + [(SBS / SBS maks) × 10] + [(SMJ / SMJ maks) × 10] + [(SIS / SIS maks) × 15] + [(SU / SU maks) × 25]
            </div>

            <div style="font-weight: 700; text-align: center; margin: 0.18cm 0 0.08cm 0;">BAB VIII — PEMBIAYAAN, MONITORING, DAN PELAPORAN</div>
            <p style="text-align: justify;">Seluruh biaya penyelenggaraan kegiatan ${escapeHtml(kegiatan.singkatan)} bersumber dari Dana BOSP ${escapeHtml(kop.sekolah)} Tahun Anggaran ${escapeHtml(kegiatan.tahunAnggaran)}. Monitoring dilakukan oleh Kepala Sekolah dan Pengawas Bina SMP ${escapeHtml(toTitleCase(kop.dinas))} ${escapeHtml(kop.kabupaten)}.</p>

            <div style="font-weight: 700; text-align: center; margin: 0.18cm 0 0.08cm 0;">BAB IX — PENUTUP</div>
            <p style="text-align: justify;">POS ini disusun sebagai acuan resmi penyelenggaraan ${escapeHtml(kegiatan.namaLengkap)} di ${escapeHtml(kop.sekolah)} Tahun Pelajaran ${escapeHtml(kegiatan.tapelAngka)} dan berlaku sejak tanggal ditetapkan.</p>
        </div>
        ${renderFullPageSignatureHTML()}
    </div>`;

    return coverPOS + posPage2 + posPage3 + posPage4;
}
