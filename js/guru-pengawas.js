// ============================================================================
// DAFTAR GURU PENGAWAS & PEMBAGIAN PENGAWAS OTOMATIS
// - Daftar semua guru (nama, NIP, jabatan) + centang "bertugas mengawas"
// - Bagi Pengawas Otomatis: mengisi ulang SELURUH kotak pengawas jadwal utama,
//   merata per guru, tidak dobel dalam satu sesi, ruang berganti-ganti,
//   dan guru piket hari itu baru dipakai bila guru lain tidak cukup
// ============================================================================
const normGuru = v => String(v || '').replace(/\s+/g, ' ').trim();
const keyGuru = v => normGuru(v).toLowerCase();

function getGuruList() {
    if (!Array.isArray(appState.guruPengawas)) appState.guruPengawas = [];
    return appState.guruPengawas;
}

function getActiveGuruNames() {
    const seen = new Set();
    return getGuruList().filter(g => g.aktif !== false).map(g => normGuru(g.nama)).filter(nm => {
        const k = nm.toLowerCase();
        if (!nm || seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}

// Jumlah tugas mengawas (jadwal utama) per nama, kunci huruf kecil
function countProctorDuties() {
    const n = Math.max(1, parseInt(appState.jumlahRuang, 10) || 1);
    const ppr = getPengawasPerRuang();
    const count = new Map();
    (appState.schedule || []).forEach(d => (d.sesi || []).forEach(ss => (ss.pengawas || []).slice(0, n).forEach(p => {
        (p || []).slice(0, ppr).forEach(nm => {
            const k = keyGuru(nm);
            if (k && k !== '-') count.set(k, (count.get(k) || 0) + 1);
        });
    })));
    return count;
}

// Kebutuhan pengawas dibanding guru aktif
function getProctorCapacity() {
    const rooms = Math.max(1, parseInt(appState.jumlahRuang, 10) || 1);
    const ppr = getPengawasPerRuang();
    const perSesi = rooms * ppr;
    const sesi = (appState.schedule || []).reduce((a, d) => a + (d.sesi || []).length, 0);
    const aktif = getActiveGuruNames().length;
    return { rooms, ppr, perSesi, sesi, total: perSesi * sesi, aktif, kurang: Math.max(0, perSesi - aktif) };
}

// ---------------------------------------------------------------------------
// TAMPILAN DAFTAR
// ---------------------------------------------------------------------------
function renderGuruPengawasEditor() {
    const box = document.getElementById('guru-pengawas-list');
    if (!box) return;
    const list = getGuruList();
    if (!list.length) {
        box.innerHTML = `<p class="text-[11px] text-slate-500 text-center py-3">Daftar masih kosong. Tempel nama guru di atas, lalu klik <strong>Tambahkan</strong>.</p>`;
    } else {
        box.innerHTML = list.map((g, i) => `
            <div class="grid grid-cols-[1.25rem_1fr_8rem_2rem_1.25rem] gap-1.5 items-center text-[11px] ${g.aktif === false ? 'opacity-60' : ''}" data-guru-row="${i}">
                <input type="checkbox" ${g.aktif === false ? '' : 'checked'} onchange="setGuruAktif(${i}, this.checked)" class="w-3.5 h-3.5 cursor-pointer" title="Bertugas mengawas">
                <input type="text" value="${escapeHtml(g.nama)}" title="${escapeHtml(g.nama)}" onchange="updateGuruField(${i}, 'nama', this.value)" class="w-full min-w-0 border border-slate-200 rounded px-1.5 py-1 font-semibold" placeholder="Nama guru">
                <input type="text" value="${escapeHtml(g.nip)}" onchange="updateGuruField(${i}, 'nip', this.value)" class="w-full min-w-0 border border-slate-200 rounded px-1.5 py-1" placeholder="NIP (opsional)">
                <span data-guru-count="${i}" class="text-center font-bold rounded bg-slate-100 text-slate-700 py-0.5" title="Jumlah sesi mengawas di jadwal utama">0</span>
                <button onclick="removeGuru(${i})" class="text-slate-400 hover:text-rose-600 font-bold cursor-pointer" title="Hapus dari daftar">&times;</button>
            </div>`).join('');
    }
    refreshGuruPengawasStats();
}

// Dipanggil setiap renderAll: perbarui jumlah tugas & peringatan kapasitas tanpa membangun ulang daftar
function refreshGuruPengawasStats() {
    const box = document.getElementById('guru-pengawas-list');
    if (!box) return;
    const list = getGuruList();
    const duties = countProctorDuties();
    box.querySelectorAll('[data-guru-count]').forEach(el => {
        const g = list[+el.dataset.guruCount];
        el.textContent = g ? String(duties.get(keyGuru(g.nama)) || 0) : '0';
    });

    const cap = getProctorCapacity();
    const countEl = document.getElementById('guru-pengawas-count');
    if (countEl) countEl.textContent = `${cap.aktif} bertugas dari ${list.length} guru`;
    const capEl = document.getElementById('guru-pengawas-capacity');
    if (!capEl) return;
    const need = `${cap.rooms} ruang × ${cap.ppr} pengawas = <strong>${cap.perSesi} guru tiap sesi</strong>`;
    if (!cap.aktif) {
        capEl.className = 'rounded-lg border border-amber-200 bg-amber-50 text-amber-900 p-2 text-[11px] leading-relaxed';
        capEl.innerHTML = `Butuh ${need}. Belum ada guru yang dicentang bertugas.`;
    } else if (cap.kurang) {
        const alt = cap.ppr === 2 && cap.aktif >= cap.rooms ? ' Pilih <strong>1 pengawas tiap ruang</strong>,' : '';
        capEl.className = 'rounded-lg border border-rose-200 bg-rose-50 text-rose-900 p-2 text-[11px] leading-relaxed';
        capEl.innerHTML = `Butuh ${need}, guru bertugas hanya <strong>${cap.aktif}</strong> — <strong>kurang ${cap.kurang} guru</strong>.${alt} tambah guru, atau kurangi jumlah ruang. Bila tetap dibagi, ${cap.kurang * cap.sesi} kotak akan kosong.`;
    } else {
        const avg = cap.total / cap.aktif;
        const lo = Math.floor(avg), hi = Math.ceil(avg);
        capEl.className = 'rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 p-2 text-[11px] leading-relaxed';
        capEl.innerHTML = `Butuh ${need}; ${cap.aktif} guru bertugas, cadangan ${cap.aktif - cap.perSesi} guru per sesi. ` +
            `${cap.sesi} sesi = ${cap.total} tugas, tiap guru mengawas <strong>${lo === hi ? lo : `${lo}–${hi}`} sesi</strong>.`;
    }
}

// ---------------------------------------------------------------------------
// UBAH DAFTAR
// ---------------------------------------------------------------------------
function setGuruAktif(i, on) {
    const g = getGuruList()[i];
    if (!g) return;
    g.aktif = !!on;
    renderGuruPengawasEditor();
    renderAll();
}

function setAllGuruAktif(on) {
    getGuruList().forEach(g => { g.aktif = !!on; });
    renderGuruPengawasEditor();
    renderAll();
}

function updateGuruField(i, field, val) {
    const list = getGuruList();
    const g = list[i];
    if (!g) return;
    const v = normGuru(val);
    if (field === 'nama') {
        if (!v) { showToast('Nama guru tidak boleh kosong. Gunakan tombol × untuk menghapus.'); renderGuruPengawasEditor(); return; }
        if (list.some((x, j) => j !== i && keyGuru(x.nama) === v.toLowerCase())) {
            showToast(`"${v}" sudah ada di daftar.`);
            renderGuruPengawasEditor();
            return;
        }
    }
    g[field] = v;
    renderGuruPengawasEditor();
    renderAll();
}

function removeGuru(i) {
    getGuruList().splice(i, 1);
    renderGuruPengawasEditor();
    renderAll();
}

async function clearGuruList() {
    if (!getGuruList().length) return;
    const ok = await showChoiceDialog({
        title: 'Hapus seluruh Daftar Guru Pengawas?',
        html: '<p>Hanya daftarnya yang dihapus. Nama pengawas yang sudah ada di jadwal tidak berubah.</p>',
        buttons: [{ label: 'Hapus Daftar', value: true, primary: true }, { label: 'Batal', value: false }]
    });
    if (!ok) return;
    appState.guruPengawas = [];
    renderGuruPengawasEditor();
    renderAll();
}

// Tempel dari Excel/teks: satu guru per baris; kolom dipisah Tab atau ";" -> [No] Nama [NIP] [Jabatan]
function parseGuruPaste(text) {
    const out = [];
    String(text || '').split(/\r?\n/).forEach(line => {
        let cols = line.split(/\t|;/).map(c => normGuru(c));
        if (cols.some(c => /^nama\b/i.test(c))) return; // baris judul kolom dari Excel
        if (cols.length > 1 && /^\d{1,3}\.?$/.test(cols[0])) cols = cols.slice(1); // kolom "No" dari Excel
        while (cols.length && !cols[0]) cols = cols.slice(1);
        let nama = (cols[0] || '').replace(/^\d{1,3}\s*[.)]\s+/, ''); // "1. Nama" / "1) Nama"
        if (!nama) return;
        const rest = cols.slice(1).filter(Boolean);
        const nipIdx = rest.findIndex(c => /^[\d\s.-]{8,}$/.test(c) || c === '-');
        const nip = nipIdx >= 0 ? rest.splice(nipIdx, 1)[0].replace(/\s+/g, '') : '';
        out.push({ nama: nama.slice(0, 300), nip: nip === '-' ? '' : nip, jabatan: rest[0] || '' });
    });
    return out;
}

// Gabungkan ke daftar: nama baru ditambahkan (aktif), nama lama hanya dilengkapi NIP/jabatannya
function mergeGuru(items, aktif = true) {
    const list = getGuruList();
    const byKey = new Map(list.map(g => [keyGuru(g.nama), g]));
    let added = 0, updated = 0;
    items.forEach(it => {
        const k = keyGuru(it.nama);
        if (!k) return;
        const ex = byKey.get(k);
        if (ex) {
            let ch = false;
            if (!ex.nip && it.nip) { ex.nip = it.nip; ch = true; }
            if ((!ex.jabatan || ex.jabatan === 'Guru') && it.jabatan) { ex.jabatan = it.jabatan; ch = true; }
            if (ch) updated++;
            return;
        }
        const g = { nama: normGuru(it.nama), nip: it.nip || '', jabatan: it.jabatan || 'Guru', aktif };
        list.push(g);
        byKey.set(k, g);
        added++;
    });
    return { added, updated };
}

function addGuruFromPaste() {
    const ta = document.getElementById('input-guru-paste');
    const items = parseGuruPaste(ta ? ta.value : '');
    if (!items.length) { showToast('Tempel atau ketik nama guru dulu (satu nama per baris).'); return; }
    const { added, updated } = mergeGuru(items);
    if (ta) ta.value = '';
    renderGuruPengawasEditor();
    renderAll();
    const skipped = items.length - added - updated;
    showToast(`${added} guru ditambahkan` + (updated ? `, ${updated} dilengkapi NIP/jabatannya` : '') + (skipped > 0 ? `, ${skipped} sudah ada` : '') + '.');
}

// Ambil nama yang sudah ada di aplikasi: pengawas jadwal, piket & susulan (dicentang),
// panitia (tidak dicentang, agar Kepala Sekolah dkk. tidak otomatis mengawas)
function importGuruFromApp() {
    const fromSched = guruListFromSchedule(appState);
    (appState.makeupSchedule || []).forEach(m => {
        const nm = normGuru(m.pengawas);
        if (nm && nm !== '-' && !fromSched.some(g => keyGuru(g.nama) === nm.toLowerCase())) fromSched.push({ nama: nm, nip: '', jabatan: 'Guru' });
    });
    const a = mergeGuru(fromSched, true);
    const b = mergeGuru((appState.committee || []).map(c => ({ nama: c.nama, nip: c.nip === '-' ? '' : c.nip, jabatan: c.jabatanDinas })), false);
    renderGuruPengawasEditor();
    renderAll();
    const added = a.added + b.added;
    if (!added && !a.updated && !b.updated) { showToast('Semua nama dari jadwal, piket & panitia sudah ada di daftar.'); return; }
    showToast(`${added} guru ditambahkan` + (b.added ? ` (${b.added} dari panitia belum dicentang — centang bila ikut mengawas)` : '') + '.');
}

// ---------------------------------------------------------------------------
// PEMBAGIAN OTOMATIS
// ---------------------------------------------------------------------------
// Mengembalikan { filled, empty, min, max } dan mengubah appState.schedule
function distributeProctors(names) {
    ensureScheduleRooms();
    const n = appState.jumlahRuang;
    const ppr = getPengawasPerRuang();
    const order = new Map(names.map((nm, i) => [nm, i]));
    const usage = new Map(names.map(nm => [nm, 0]));
    const lastTurn = new Map(names.map(nm => [nm, -1]));
    const roomUse = new Map(names.map(nm => [nm, new Array(n).fill(0)]));
    let turn = 0, filled = 0, empty = 0;

    appState.schedule.forEach((d, dIdx) => {
        const piket = new Set((((appState.dailyRoster || [])[dIdx] || {}).guru || []).map(keyGuru).filter(Boolean));
        (d.sesi || []).forEach(ss => {
            // Paling sedikit bertugas dulu, lalu yang paling lama istirahat; guru piket hari ini paling akhir
            const chosen = names.slice().sort((a, b) =>
                (piket.has(a.toLowerCase()) - piket.has(b.toLowerCase())) ||
                (usage.get(a) - usage.get(b)) ||
                (lastTurn.get(a) - lastTurn.get(b)) ||
                (order.get(a) - order.get(b))
            ).slice(0, n * ppr);

            // Sebar ke ruang: tiap kotak diisi guru yang paling jarang di ruang itu; titik mulai bergeser tiap sesi
            const slots = [];
            for (let i = 0; i < n; i++) {
                const r = (i + turn) % n;
                for (let k = 0; k < ppr; k++) slots.push([r, k]);
            }
            const fresh = Array.from({ length: Math.max(n, ss.pengawas.length) }, (_, r) =>
                r < n ? ['', ''] : [ss.pengawas[r][0] || '', ss.pengawas[r][1] || '']);
            const pool = chosen.slice();
            slots.forEach(([r, k]) => {
                if (!pool.length) { empty++; return; }
                let best = 0;
                for (let j = 1; j < pool.length; j++) {
                    if (roomUse.get(pool[j])[r] < roomUse.get(pool[best])[r]) best = j;
                }
                const nm = pool.splice(best, 1)[0];
                fresh[r][k] = nm;
                roomUse.get(nm)[r]++;
                usage.set(nm, usage.get(nm) + 1);
                lastTurn.set(nm, turn);
                filled++;
            });
            ss.pengawas = fresh;
            turn++;
        });
    });
    const counts = names.map(nm => usage.get(nm));
    return { filled, empty, min: Math.min(...counts), max: Math.max(...counts) };
}

async function autoDistributeProctors() {
    const names = getActiveGuruNames();
    if (!names.length) { showToast('Centang minimal satu guru yang bertugas mengawas di Daftar Guru Pengawas.'); return; }
    const cap = getProctorCapacity();
    const hasNames = countProctorDuties().size > 0;
    if (hasNames || cap.kurang) {
        const ok = await showChoiceDialog({
            title: 'Bagi pengawas otomatis?',
            html: `<p>Seluruh kotak pengawas pada <strong>${cap.sesi} sesi</strong> jadwal utama akan <strong>diganti</strong> dengan pembagian baru dari ${names.length} guru yang dicentang.</p>
                ${cap.kurang ? `<p class="mt-2 text-rose-700">Guru kurang ${cap.kurang} orang per sesi, jadi ${cap.kurang * cap.sesi} kotak akan tetap kosong.</p>` : ''}
                <p class="mt-2 text-slate-500">Tips: simpan dulu lewat Backup (.json) bila pembagian lama masih diperlukan.</p>`,
            buttons: [{ label: 'Bagi Sekarang', value: true, primary: true }, { label: 'Batal', value: false }]
        });
        if (!ok) return;
    }
    const res = distributeProctors(names);
    renderScheduleEditor();
    renderGuruPengawasEditor();
    renderAll();
    const rata = res.min === res.max ? `${res.min}` : `${res.min}–${res.max}`;
    showToast(`${res.filled} tugas mengawas dibagi ke ${names.length} guru (${rata} sesi per guru).` + (res.empty ? ` ${res.empty} kotak kosong karena guru kurang.` : ''));
}
