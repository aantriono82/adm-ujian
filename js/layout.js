// ============================================================================
// 10. KALKULASI TATA LETAK, PENGELOMPOKAN RUANG & KOP SURAT
// ============================================================================
function getRoomGroups() {
    const { filterRuang, maxPerRoom } = appState.roomConfig;
    const activeStudents = getActiveStudents();
    const filtered = activeStudents.filter(s => {
        if (filterRuang === 'ALL') return true;
        return String(s.ruang || '1').trim() === filterRuang;
    });

    const map = new Map();
    filtered.forEach(s => {
        const rKey = String(s.ruang || '1').trim() || '1';
        if (!map.has(rKey)) map.set(rKey, []);
        map.get(rKey).push(s);
    });

    const groups = [];
    for (const [ruangName, list] of map.entries()) {
        if (maxPerRoom > 0 && list.length > maxPerRoom) {
            const totalChunks = Math.ceil(list.length / maxPerRoom);
            for (let i = 0; i < totalChunks; i++) {
                groups.push({
                    ruangLabel: `${ruangName} (Sesi ${i + 1})`,
                    ruangBase: ruangName,
                    students: list.slice(i * maxPerRoom, (i + 1) * maxPerRoom)
                });
            }
        } else {
            groups.push({
                ruangLabel: ruangName,
                ruangBase: ruangName,
                students: list
            });
        }
    }
    return groups;
}

function arrangeSeatingMatrix(studentsList, cols, pattern) {
    const total = studentsList.length;
    const rows = Math.max(1, Math.ceil(total / cols));
    const matrix = Array.from({ length: rows }, () => Array(cols).fill(null));

    if (pattern === 'lr-tb') {
        studentsList.forEach((st, idx) => {
            const r = Math.floor(idx / cols);
            const c = idx % cols;
            matrix[r][c] = { student: st, seatNo: idx + 1 };
        });
    } else if (pattern === 'snake-h') {
        studentsList.forEach((st, idx) => {
            const r = Math.floor(idx / cols);
            const rem = idx % cols;
            const c = (r % 2 === 0) ? rem : (cols - 1 - rem);
            matrix[r][c] = { student: st, seatNo: idx + 1 };
        });
    } else if (pattern === 'tb-lr') {
        studentsList.forEach((st, idx) => {
            const c = Math.floor(idx / rows);
            const r = idx % rows;
            if (c < cols) matrix[r][c] = { student: st, seatNo: idx + 1 };
        });
    } else if (pattern === 'snake-v') {
        studentsList.forEach((st, idx) => {
            const c = Math.floor(idx / rows);
            const rem = idx % rows;
            const r = (c % 2 === 0) ? rem : (rows - 1 - rem);
            if (c < cols) matrix[r][c] = { student: st, seatNo: idx + 1 };
        });
    }
    return { matrix, rows, cols };
}

function getPatternDescription(pattern) {
    if (pattern === 'snake-h') return 'Zig-Zag / Ular Horizontal (Samping)';
    if (pattern === 'snake-v') return 'Zig-Zag / Ular Vertikal (Ke Belakang)';
    if (pattern === 'lr-tb') return 'Lurus Horizontal (Kiri ke Kanan)';
    return 'Lurus Vertikal (Depan ke Belakang)';
}

function calculateSheetLayout() {
    const card = CARD_SIZES[appState.setting.cardSize];
    const paper = PAPER_SIZES[appState.setting.paperSize];
    const activeStudents = getActiveStudents();

    const availWidth = paper.widthCm - (paper.marginXCm * 2);
    const availHeight = paper.heightCm - (paper.marginYCm * 2);

    const cols = Math.max(1, Math.floor((availWidth + 0.05) / card.widthCm));
    const rows = Math.max(1, Math.floor((availHeight + 0.05) / card.heightCm));
    const cardsPerPage = cols * rows;
    const totalPages = Math.max(1, Math.ceil(activeStudents.length / cardsPerPage));

    return { card, paper, cols, rows, cardsPerPage, totalPages, activeStudents };
}

function renderFullPageKopHTML(theme) {
    const { kop } = appState;
    return `
    <div style="width: 100%; margin-bottom: 0.2cm;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.25cm; padding-bottom: 0.1cm;">
            <div style="width: 1.85cm; height: 1.85cm; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${kop.logoKiri ? `<img src="${imgUrl(kop.logoKiri)}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` : ''}
            </div>
            <div style="flex: 1; text-align: center; line-height: 1.15; color: ${theme.headerText};">
                ${kop.pemda ? `<div style="font-size: 11pt; font-weight: 700;">${escapeHtml(kop.pemda)}</div>` : ''}
                ${kop.dinas ? `<div style="font-size: 11pt; font-weight: 700;">${escapeHtml(kop.dinas)}</div>` : ''}
                ${kop.uptd ? `<div style="font-size: 10.5pt; font-weight: 700;">${escapeHtml(kop.uptd)}</div>` : ''}
                ${kop.sekolah ? `<div style="font-size: 13.5pt; font-weight: 700; color: ${theme.schoolText};">${escapeHtml(kop.sekolah)}</div>` : ''}
                ${kop.nssNpsn ? `<div style="font-size: 8.8pt; font-weight: 700; letter-spacing: 0.2px;">${escapeHtml(kop.nssNpsn)}</div>` : ''}
                ${kop.alamatDok ? `<div style="font-size: 8.2pt; font-style: italic; color: #1e293b;">${escapeHtml(kop.alamatDok)}</div>` : ''}
                ${kop.kontakDok ? `<div style="font-size: 8.2pt; font-style: italic; color: #1e293b;">${escapeHtml(kop.kontakDok)}</div>` : ''}
            </div>
            <div style="width: 1.85cm; height: 1.85cm; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${kop.logoKanan ? `<img src="${imgUrl(kop.logoKanan)}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` : ''}
            </div>
        </div>
        <div style="border-top: 2.2px solid ${theme.lineColor}; border-bottom: 0.8px solid ${theme.lineColor}; height: 3px;"></div>
    </div>
    `;
}

function renderFullPageSignatureHTML(customDateStr = null) {
    const { pengesahan } = appState;
    const ttdWidthCm = (2.8 * (pengesahan.ttdScale / 100)).toFixed(2);
    const capSizeCm = (1.85 * (pengesahan.capScale / 100)).toFixed(2);
    const dateToUse = customDateStr || pengesahan.tanggal;

    // margin-bottom: auto → di lembar flex-col justify-between, ruang kosong diserap di
    // BAWAH blok ini, sehingga tanda tangan menempel tepat di bawah teks terakhir
    // (tidak terdorong ke dasar halaman) dan elemen sesudahnya (kaki halaman) tetap di bawah.
    return `
    <div style="width: 100%; display: flex; justify-content: flex-end; margin-top: 0.5cm; margin-bottom: auto; font-size: 9.5pt; line-height: 1.22; color: #0f172a;">
        <div style="width: 6.8cm; position: relative;">
            <div>Ditetapkan di : ${escapeHtml(pengesahan.tempat)}</div>
            <div>Pada tanggal &nbsp;: ${escapeHtml(dateToUse)}</div>
            <div style="margin-top: 2px;">${escapeHtml(pengesahan.jabatan1)}</div>
            <div>${escapeHtml(pengesahan.jabatan2)},</div>
            <div style="position: relative; height: 1.4cm; display: flex; align-items: center;">
                ${pengesahan.metode === 'upload' ? `
                    ${pengesahan.capImg ? `<img src="${imgUrl(pengesahan.capImg)}" style="position: absolute; left: -0.35cm; top: 50%; transform: translateY(-50%); width: ${capSizeCm}cm; height: ${capSizeCm}cm; object-fit: contain; z-index: 2;">` : ''}
                    ${pengesahan.ttdImg ? `<img src="${imgUrl(pengesahan.ttdImg)}" style="position: absolute; left: 0.25cm; top: 50%; transform: translateY(-50%); width: ${ttdWidthCm}cm; max-height: 1.55cm; object-fit: contain; z-index: 3;">` : ''}
                ` : ''}
            </div>
            <div style="font-weight: 700; text-decoration: underline; position: relative; z-index: 4;">${escapeHtml(pengesahan.kepsek)}</div>
            <div style="position: relative; z-index: 4;">NIP. ${escapeHtml(pengesahan.nip)}</div>
        </div>
    </div>
    `;
}
