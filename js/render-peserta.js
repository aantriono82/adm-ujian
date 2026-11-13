// ============================================================================
// 11. RENDER MODUL 1–5: KARTU UJIAN, DENAH, NOMOR MEJA, NOMINASI & LABEL PINTU
// ============================================================================
function renderSingleCardHTML(student, layout) {
    const { kop, kegiatan, pengesahan, setting } = appState;
    const theme = THEMES[setting.theme];
    const scale = layout.card.fontScale;

    const fKop1 = (6.6 * scale).toFixed(2);
    const fKopSekolah = (8.1 * scale).toFixed(2);
    const fAlamat = (4.7 * scale).toFixed(2);
    const fTitle = (6.4 * scale).toFixed(2);
    const fBody = (6.3 * scale).toFixed(2);
    const fSign = (5.7 * scale).toFixed(2);

    const logoSize = (0.96 * scale).toFixed(2);
    const watermarkSize = (2.1 * scale).toFixed(2);
    const ttdWidthCm = (2.1 * scale * (pengesahan.ttdScale / 100)).toFixed(2);
    const capSizeCm = (1.35 * scale * (pengesahan.capScale / 100)).toFixed(2);
    const isThemedBanner = theme.bannerBg !== 'transparent';

    return `
    <div class="exam-card font-serif-formal relative select-none overflow-hidden flex flex-col justify-between"
         style="width: ${layout.card.widthCm}cm; height: ${layout.card.heightCm}cm; border: 1.2px solid ${theme.borderColor}; background-color: ${theme.cardBg}; padding: 0.14cm 0.18cm; box-sizing: border-box;">
        
        ${setting.showWatermark && kop.logoKanan ? `
        <div class="card-watermark pointer-events-none" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 0; opacity: 0.10;">
            <img src="${kop.logoKanan}" alt="" style="width: ${watermarkSize}cm; height: ${watermarkSize}cm; object-fit: contain;">
        </div>
        ` : ''}

        <div style="position: relative; z-index: 1;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.1cm; background-color: ${theme.headerBg}; padding: 0.04cm 0.06cm; border-radius: 2px;">
                <div style="width: ${logoSize}cm; height: ${logoSize}cm; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    ${kop.logoKiri ? `<img src="${kop.logoKiri}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` : ''}
                </div>
                <div style="flex: 1; text-align: center; line-height: 1.12; color: ${theme.headerText};">
                    ${kop.pemda ? `<div style="font-size: ${fKop1}pt; font-weight: 700;">${escapeHtml(kop.pemda)}</div>` : ''}
                    ${kop.dinas ? `<div style="font-size: ${fKop1}pt; font-weight: 700;">${escapeHtml(kop.dinas)}</div>` : ''}
                    ${kop.uptd ? `<div style="font-size: ${fKop1}pt; font-weight: 700;">${escapeHtml(kop.uptd)}</div>` : ''}
                    ${kop.sekolah ? `<div style="font-size: ${fKopSekolah}pt; font-weight: 700; color: ${theme.schoolText};">${escapeHtml(kop.sekolah)}</div>` : ''}
                    ${kop.alamat ? `<div style="font-size: ${fAlamat}pt; font-style: italic; color: #334155;">${escapeHtml(kop.alamat)}</div>` : ''}
                </div>
                <div style="width: ${logoSize}cm; height: ${logoSize}cm; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    ${kop.logoKanan ? `<img src="${kop.logoKanan}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` : ''}
                </div>
            </div>

            <div style="border-top: 1.5px solid ${theme.lineColor}; border-bottom: 0.6px solid ${theme.lineColor}; height: 2.2px; margin: 0.05cm 0;"></div>

            <div style="text-align: center; line-height: 1.15; margin-bottom: 0.06cm; ${isThemedBanner ? `background-color: ${theme.bannerBg}; color: ${theme.bannerText}; padding: 1.5px 4px; border-radius: 2px;` : `color: ${theme.bannerText};`}">
                <div style="font-size: ${fTitle}pt; font-weight: 700; text-transform: uppercase;">${escapeHtml(kegiatan.nama)}</div>
                <div style="font-size: ${fTitle}pt; font-weight: 700; text-transform: uppercase;">${escapeHtml(kegiatan.tapel)}</div>
            </div>
        </div>

        <div style="position: relative; z-index: 1; flex: 1; display: flex; justify-content: space-between; align-items: stretch; gap: 0.12cm; padding-top: 0.02cm;">
            <div style="width: 55%; font-size: ${fBody}pt; line-height: 1.26; color: #0f172a;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="width: 37%; vertical-align: top; white-space: nowrap;">Nomor Ujian</td>
                        <td style="width: 4%; vertical-align: top; padding: 0 2px;">:</td>
                        <td style="vertical-align: top; font-weight: 700;">${escapeHtml(student.noUjian)}</td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top;">Nama</td>
                        <td style="vertical-align: top; padding: 0 2px;">:</td>
                        <td style="vertical-align: top; font-weight: 700; text-transform: uppercase;">${escapeHtml(student.nama)}</td>
                    </tr>
                    ${kegiatan.showNisn ? `
                    <tr>
                        <td style="vertical-align: top;">NISN</td>
                        <td style="vertical-align: top; padding: 0 2px;">:</td>
                        <td style="vertical-align: top;">${escapeHtml(student.nisn || '-')}</td>
                    </tr>` : ''}
                    <tr>
                        <td style="vertical-align: top;">Kelas</td>
                        <td style="vertical-align: top; padding: 0 2px;">:</td>
                        <td style="vertical-align: top;">${escapeHtml(student.kelas)}</td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top;">Ruang</td>
                        <td style="vertical-align: top; padding: 0 2px;">:</td>
                        <td style="vertical-align: top; font-weight: 700;">${escapeHtml(student.ruang)}</td>
                    </tr>
                </table>
            </div>

            <div style="width: 45%; font-size: ${fSign}pt; line-height: 1.16; color: #0f172a; display: flex; flex-direction: column; justify-content: space-between; position: relative; padding-left: 0.08cm;">
                <div>
                    <div style="white-space: nowrap;">${escapeHtml(pengesahan.tempat)}, ${escapeHtml(pengesahan.tanggal)}</div>
                    <div style="white-space: nowrap;">${escapeHtml(pengesahan.jabatan1)}</div>
                    <div style="white-space: nowrap;">${escapeHtml(pengesahan.jabatan2)}</div>
                </div>
                <div style="position: relative; flex: 1; min-height: 0.72cm; display: flex; align-items: center;">
                    ${pengesahan.metode === 'upload' ? `
                        ${pengesahan.capImg ? `<img src="${pengesahan.capImg}" style="position: absolute; left: -0.22cm; top: 50%; transform: translateY(-50%); width: ${capSizeCm}cm; height: ${capSizeCm}cm; object-fit: contain; z-index: 2;">` : ''}
                        ${pengesahan.ttdImg ? `<img src="${pengesahan.ttdImg}" style="position: absolute; left: 0.15cm; top: 50%; transform: translateY(-50%); width: ${ttdWidthCm}cm; max-height: 1.15cm; object-fit: contain; z-index: 3;">` : ''}
                    ` : ''}
                </div>
                <div style="position: relative; z-index: 4;">
                    <div style="font-weight: 700; text-decoration: underline; white-space: nowrap;">${escapeHtml(pengesahan.kepsek)}</div>
                    <div style="white-space: nowrap;">NIP. ${escapeHtml(pengesahan.nip)}</div>
                </div>
            </div>
        </div>
    </div>
    `;
}

function renderDenahSheetHTML(group, pageIdx, totalPages, paper) {
    const { kegiatan, setting, roomConfig } = appState;
    const theme = THEMES[setting.theme];
    const { matrix, rows, cols } = arrangeSeatingMatrix(group.students, roomConfig.seatCols, roomConfig.seatPattern);

    const doorBadgeHTML = (posKey, label) => {
        if (roomConfig.doorPos !== posKey) return `<div style="width: 2.8cm;"></div>`;
        return `
        <div style="width: 3.1cm; border: 2px dashed #b45309; background: #fef3c7; color: #92400e; padding: 4px 6px; border-radius: 4px; text-align: center; font-weight: 700; font-size: 7.5pt;">
            <div>PINTU MASUK (${label})</div>
        </div>`;
    };

    let seatGridHTML = '';
    for (let r = 0; r < rows; r++) {
        let rowCells = '';
        for (let c = 0; c < cols; c++) {
            const cell = matrix[r][c];
            if (cell) {
                const st = cell.student;
                rowCells += `
                <div style="border: 1.5px solid ${theme.borderColor}; border-radius: 5px; background: #ffffff; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; min-height: 1.8cm;">
                    <div style="background: ${theme.bannerBg === 'transparent' ? '#1e293b' : theme.bannerBg}; color: #ffffff; font-size: 7pt; font-weight: 700; padding: 2px 5px; display: flex; justify-content: space-between;">
                        <span>MEJA ${String(cell.seatNo).padStart(2, '0')}</span>
                        <span>Kls ${escapeHtml(st.kelas)}</span>
                    </div>
                    <div style="padding: 3px 5px; text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 7.8pt; font-weight: 700; color: #1d4ed8;">${escapeHtml(st.noUjian)}</div>
                        <div style="font-size: 6.8pt; font-weight: 700; color: #0f172a; line-height: 1.15; text-transform: uppercase;">${escapeHtml(st.nama)}</div>
                    </div>
                </div>`;
            } else {
                rowCells += `<div style="border: 1px dashed #cbd5e1; border-radius: 5px; background: #f8fafc; min-height: 1.8cm; display: flex; align-items: center; justify-content: center; font-size: 7pt; color: #94a3b8;">Kosong</div>`;
            }
        }
        seatGridHTML += `<div style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 0.24cm; margin-bottom: 0.22cm;">${rowCells}</div>`;
    }

    return `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.8cm 1.0cm;">
        <div>
            ${renderFullPageKopHTML(theme)}
            <div style="text-align: center; margin: 0.15cm 0 0.25cm 0; line-height: 1.25;">
                <div style="font-size: 11.5pt; font-weight: 700; text-transform: uppercase; text-decoration: underline;">DENAH TEMPAT DUDUK PESERTA ${escapeHtml(kegiatan.singkatan)}</div>
                <div style="font-size: 10pt; font-weight: 700; text-transform: uppercase;">${escapeHtml(kegiatan.namaLengkap)}</div>
                <div style="font-size: 9.5pt; font-weight: 700; text-transform: uppercase;">${escapeHtml(kegiatan.tapel)}</div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 10px; margin-bottom: 0.25cm; font-size: 8.5pt; font-weight: 700;">
                <div>RUANG UJIAN : <span style="color: #1d4ed8;">RUANG ${escapeHtml(group.ruangLabel)}</span></div>
                <div>POLA URUTAN : <span style="font-weight: 400;">${getPatternDescription(roomConfig.seatPattern)}</span></div>
                <div>KAPASITAS : <span style="color: #047857;">${group.students.length} PESERTA</span></div>
            </div>

            <div style="border: 2px solid ${theme.borderColor}; border-radius: 6px; padding: 0.3cm; background: #fcfcfd;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.25cm; margin-bottom: 0.25cm;">
                    ${doorBadgeHTML('depan-kiri', 'Depan Kiri')}
                    <div style="flex: 1; max-width: 9.5cm; margin: 0 auto; border: 2px solid #0f172a; background: #1e293b; color: #ffffff; text-align: center; padding: 5px 10px; border-radius: 4px; font-weight: 700; font-size: 8.5pt;">
                        [ PAPAN TULIS DEPAN ]
                    </div>
                    ${doorBadgeHTML('depan-kanan', 'Depan Kanan')}
                </div>

                <div style="display: flex; justify-content: space-around; align-items: center; gap: 1cm; margin-bottom: 0.35cm; padding: 0 0.8cm;">
                    <div style="width: 4.8cm; border: 1.5px solid #0369a1; background: #e0f2fe; color: #0c4a6e; border-radius: 4px; padding: 5px 8px; text-align: center; font-weight: 700; font-size: 8pt;">
                        [ MEJA ${escapeHtml(roomConfig.pengawas1)} ]
                    </div>
                    <div style="width: 4.8cm; border: 1.5px solid #0369a1; background: #e0f2fe; color: #0c4a6e; border-radius: 4px; padding: 5px 8px; text-align: center; font-weight: 700; font-size: 8pt;">
                        [ MEJA ${escapeHtml(roomConfig.pengawas2)} ]
                    </div>
                </div>

                <div>${seatGridHTML}</div>
            </div>
        </div>
        ${renderFullPageSignatureHTML()}
    </div>`;
}

function renderSingleDeskLabelHTML(student, seatIndex, widthCm, heightCm) {
    const { kop, kegiatan, setting } = appState;
    const theme = THEMES[setting.theme];
    const isThemedBanner = theme.bannerBg !== 'transparent';

    return `
    <div class="font-serif-formal relative select-none overflow-hidden flex flex-col justify-between"
         style="width: ${widthCm}cm; height: ${heightCm}cm; border: 1.8px solid ${theme.borderColor}; background-color: #ffffff; padding: 0.14cm 0.2cm; box-sizing: border-box;">
        <div style="position: relative; z-index: 1;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.1cm; border-bottom: 1.5px solid ${theme.lineColor}; padding-bottom: 0.06cm;">
                <div style="width: 0.75cm; height: 0.75cm; display: flex; align-items: center; justify-content: center;">
                    ${kop.logoKiri ? `<img src="${kop.logoKiri}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` : ''}
                </div>
                <div style="flex: 1; text-align: center; line-height: 1.1;">
                    <div style="font-size: 7pt; font-weight: 700; text-transform: uppercase;">${escapeHtml(kegiatan.namaLengkap)}</div>
                    <div style="font-size: 7.2pt; font-weight: 700; color: ${theme.schoolText};">${escapeHtml(kop.sekolah)} - T.P. ${escapeHtml(kegiatan.tapelAngka)}</div>
                </div>
                <div style="width: 0.75cm; height: 0.75cm; display: flex; align-items: center; justify-content: center;">
                    ${kop.logoKanan ? `<img src="${kop.logoKanan}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` : ''}
                </div>
            </div>
        </div>

        <div style="position: relative; z-index: 1; text-align: center; padding: 0.04cm 0;">
            <div style="font-size: 6.2pt; font-weight: 700; letter-spacing: 0.8px; color: #475569;">NOMOR PESERTA :</div>
            <div style="font-size: 16pt; font-weight: 700; letter-spacing: 0.8px; color: ${isThemedBanner ? theme.bannerBg : '#0f172a'}; background: ${theme.accentBadge}; border: 1px solid ${theme.borderColor}; border-radius: 4px; padding: 1px 6px; margin: 2px 0;">
                ${escapeHtml(student.noUjian)}
            </div>
            <div style="font-size: 8.5pt; font-weight: 700; color: #0f172a; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${escapeHtml(student.nama)}
            </div>
        </div>

        <div style="position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #cbd5e1; padding-top: 0.05cm; font-size: 7pt; font-weight: 700; color: #1e293b;">
            <span>KELAS / RUANG : ${escapeHtml(student.kelas)} / RUANG ${escapeHtml(padRoom(student.ruang))}</span>
            <span style="background: #1e293b; color: #fff; padding: 1px 6px; border-radius: 3px;">NOMOR MEJA : ${String(seatIndex).padStart(2, '0')}</span>
        </div>
    </div>`;
}

function renderNominasiSheetHTML(group, pageIdx, totalPages, paper) {
    const { kegiatan, setting } = appState;
    const theme = THEMES[setting.theme];
    const rowsHTML = group.students.map((st, idx) => `
        <tr>
            <td style="border: 1px solid #1e293b; padding: 4px 6px; text-align: center; font-weight: 700;">${idx + 1}</td>
            <td style="border: 1px solid #1e293b; padding: 4px 8px; text-align: center; font-weight: 700; color: #1d4ed8;">${escapeHtml(st.noUjian)}</td>
            <td style="border: 1px solid #1e293b; padding: 4px 8px; font-weight: 700; text-transform: uppercase;">${escapeHtml(st.nama)}</td>
            <td style="border: 1px solid #1e293b; padding: 4px 6px; text-align: center;">${escapeHtml(st.lp || 'L')}</td>
            <td style="border: 1px solid #1e293b; padding: 4px 6px; text-align: center;">${escapeHtml(st.nisn || '-')}</td>
            <td style="border: 1px solid #1e293b; padding: 4px 6px; text-align: center; font-weight: 700;">${escapeHtml(st.kelas)}</td>
            <td style="border: 1px solid #1e293b; padding: 4px 6px; text-align: center; font-weight: 700;">Ruang ${escapeHtml(padRoom(st.ruang))}</td>
        </tr>
    `).join('');

    return `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 0.9cm 1.2cm;">
        <div>
            ${renderFullPageKopHTML(theme)}
            <div style="text-align: center; margin: 0.2cm 0 0.25cm 0; line-height: 1.25;">
                <div style="font-size: 12pt; font-weight: 700; text-transform: uppercase; text-decoration: underline;">DAFTAR PESERTA UJIAN PER RUANG (NOMINASI)</div>
                <div style="font-size: 10.5pt; font-weight: 700; text-transform: uppercase;">${escapeHtml(kegiatan.namaLengkap)}</div>
                <div style="font-size: 10pt; font-weight: 700; text-transform: uppercase;">${escapeHtml(kegiatan.tapel)}</div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 0.2cm; font-size: 9.5pt; font-weight: 700;">
                <div>RUANG UJIAN : RUANG ${escapeHtml(padRoom(group.ruangLabel))}</div>
                <div>JUMLAH PESERTA : ${group.students.length} SISWA</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 9pt; color: #0f172a;">
                <thead>
                    <tr style="background-color: #e2e8f0; font-weight: 700;">
                        <th style="border: 1px solid #1e293b; padding: 5px; width: 6%;">NO</th>
                        <th style="border: 1px solid #1e293b; padding: 5px; width: 20%;">NOMOR PESERTA</th>
                        <th style="border: 1px solid #1e293b; padding: 5px; text-align: left;">NAMA PESERTA DIDIK</th>
                        <th style="border: 1px solid #1e293b; padding: 5px; width: 7%;">L/P</th>
                        <th style="border: 1px solid #1e293b; padding: 5px; width: 15%;">NISN</th>
                        <th style="border: 1px solid #1e293b; padding: 5px; width: 10%;">KELAS</th>
                        <th style="border: 1px solid #1e293b; padding: 5px; width: 12%;">RUANG</th>
                    </tr>
                </thead>
                <tbody>${rowsHTML}</tbody>
            </table>
        </div>
        ${renderFullPageSignatureHTML()}
    </div>`;
}

// MODUL 5: LABEL PINTU RUANG & PERINGATAN HARAP TENANG
function renderRoomDoorSignHTML(group, paper) {
    const { kop, kegiatan, setting } = appState;
    const theme = THEMES[setting.theme];
    const firstNo = group.students[0] ? group.students[0].noUjian : '........';
    const lastNo = group.students[group.students.length - 1] ? group.students[group.students.length - 1].noUjian : '........';

    return `
    <div class="print-sheet font-serif-formal bg-white shadow-xl border border-slate-300 relative box-border flex flex-col justify-between"
         style="width: ${paper.widthCm}cm; min-height: ${paper.heightCm}cm; padding: 1.0cm 1.2cm;">
        <div>
            ${renderFullPageKopHTML(theme)}

            <!-- Kotak Besar Identitas Ruang Ujian -->
            <div style="border: 4px double #0f172a; padding: 0.9cm 0.6cm; text-align: center; margin-top: 0.6cm; border-radius: 6px;">
                <div style="font-size: 38pt; font-weight: 700; letter-spacing: 2px; color: #1e3a8a; line-height: 1.1;">
                    RUANG ${escapeHtml(padRoom(group.ruangBase))}
                </div>
                <div style="border-top: 2px solid #0f172a; width: 60%; margin: 0.3cm auto;"></div>
                <div style="font-size: 15pt; font-weight: 700; text-transform: uppercase; margin-top: 0.2cm;">
                    ${escapeHtml(kegiatan.namaLengkap)}
                </div>
                <div style="font-size: 14pt; font-weight: 700; text-transform: uppercase; color: #047857; margin-top: 0.1cm;">
                    ${escapeHtml(kop.sekolah)}
                </div>
                <div style="font-size: 13pt; font-weight: 700; margin-top: 0.1cm;">
                    ${escapeHtml(kegiatan.tapel)}
                </div>
                <div style="font-size: 11.5pt; font-weight: 700; margin-top: 0.4cm; background: #f1f5f9; border: 1px solid #94a3b8; display: inline-block; padding: 6px 18px; border-radius: 4px;">
                    Kapasitas: ${group.students.length} Peserta (No. ${escapeHtml(firstNo)} s.d. ${escapeHtml(lastNo)})
                </div>
            </div>

            <!-- Kotak Besar Harap Tenang -->
            <div style="border: 4px solid #dc2626; background: #fef2f2; padding: 0.9cm 0.6cm; text-align: center; margin-top: 1.2cm; border-radius: 6px;">
                <div style="font-size: 30pt; font-weight: 700; color: #dc2626; letter-spacing: 1.5px;">
                    HARAP TENANG!
                </div>
                <div style="font-size: 16pt; font-weight: 700; color: #0f172a; margin-top: 0.2cm; text-transform: uppercase;">
                    SEDANG BERLANGSUNG ${escapeHtml(kegiatan.namaLengkap)}
                </div>
                <div style="border-top: 1.5px solid #dc2626; width: 70%; margin: 0.35cm auto;"></div>
                <div style="font-size: 13pt; font-weight: 700; color: #7f1d1d;">
                    Selain Peserta Ujian dan Pengawas Ruang
                </div>
                <div style="font-size: 20pt; font-weight: 700; color: #dc2626; margin-top: 0.1cm; text-decoration: underline;">
                    DILARANG MASUK
                </div>
            </div>
        </div>
    </div>`;
}
