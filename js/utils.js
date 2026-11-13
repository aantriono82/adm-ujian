// ============================================================================
// 24. UTILITAS ZOOM, MODAL PENGEMBANG & ESCAPE HTML
// ============================================================================
function updateDeveloperPhotoUI() {
    const photoSrc = appState.developerPhoto || DEFAULT_DEV_PHOTO_SVG;
    ['nav-dev-photo', 'sidebar-dev-photo', 'modal-dev-photo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.src = photoSrc;
    });
}

function toggleDeveloperModal(show) {
    const modal = document.getElementById('developer-modal');
    if (!modal) return;
    modal.classList.toggle('hidden', !show);
    modal.classList.toggle('flex', show);
}

async function handleDevPhotoUpload(event) {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) { showToast(problem); input.value = ''; return; }
    try {
        const dataUrl = await compressImageFile(file, IMAGE_MAX_DIM.devPhoto);
        appState.developerPhoto = dataUrl;
        try { localStorage.setItem('devPhoto_Pramudito', dataUrl); } catch (err) {}
        updateDeveloperPhotoUI();
        showToast("Foto profil pengembang diperbarui!");
    } catch (err) {
        showToast(err.message || 'Gambar gagal diproses.');
    } finally {
        input.value = '';
    }
}

// Zoom memakai properti CSS `zoom` (bukan transform) supaya area gulir ikut membesar/mengecil
// dan sisi kiri lembar tidak terpotong saat dokumen lebih lebar dari layar.
let zoomFitMode = true; // aktif: zoom otomatis menyesuaikan lebar layar

function adjustZoom(delta) {
    zoomFitMode = false;
    appState.zoom = Math.min(1.5, Math.max(0.3, +(appState.zoom + delta).toFixed(2)));
    applyZoom();
}

function resetZoom() {
    zoomFitMode = false;
    appState.zoom = 1.0;
    applyZoom();
}

function fitZoom() {
    zoomFitMode = true;
    const wrapper = document.getElementById('preview-wrapper');
    const container = document.getElementById('sheets-container');
    if (!wrapper || !container || !wrapper.clientWidth) return;
    const prev = container.style.zoom;
    container.style.zoom = '1';
    const natural = container.scrollWidth;
    container.style.zoom = prev;
    const cs = getComputedStyle(wrapper);
    const avail = wrapper.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (natural > 0) appState.zoom = Math.max(0.3, Math.min(1, Math.floor(avail / natural * 100) / 100));
    applyZoom();
}

function applyZoom() {
    const container = document.getElementById('sheets-container');
    container.style.zoom = appState.zoom;
    document.getElementById('zoom-label').textContent = Math.round(appState.zoom * 100) + '%';
    const fitBtn = document.getElementById('zoom-fit-btn');
    if (fitBtn) fitBtn.classList.toggle('is-active', zoomFitMode);
}

// Dipanggil setelah dokumen dirender / ukuran jendela berubah
function refreshZoom() {
    if (zoomFitMode) fitZoom(); else applyZoom();
}

// ---------- Menu tarik-turun di header ----------
function toggleMenu(id, ev) {
    if (ev) ev.stopPropagation();
    const menu = document.getElementById(id);
    const willOpen = menu.classList.contains('hidden');
    closeMenus();
    if (willOpen) menu.classList.remove('hidden');
}

function closeMenus() {
    document.querySelectorAll('.menu-panel').forEach(m => m.classList.add('hidden'));
}

document.addEventListener('click', e => { if (!e.target.closest('[data-menu]')) closeMenus(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenus(); });

// ---------- Layar kecil: Pengaturan / Pratinjau ----------
function setMobileView(view) {
    document.body.dataset.mview = view;
    ['settings', 'preview'].forEach(v => {
        const b = document.getElementById('mview-' + v);
        if (b) b.classList.toggle('is-active', v === view);
    });
    if (view === 'preview') requestAnimationFrame(refreshZoom);
}

// ---------- Petunjuk di tab Mode yang bisa ditutup ----------
const INTRO_TIP_KEY = 'asesmen-intro-tip-hidden';
function dismissIntroTip() {
    const el = document.getElementById('intro-tip');
    if (el) el.classList.add('hidden');
    try { localStorage.setItem(INTRO_TIP_KEY, '1'); } catch (err) {}
}
function applyIntroTipState() {
    let hidden = false;
    try { hidden = localStorage.getItem(INTRO_TIP_KEY) === '1'; } catch (err) {}
    const el = document.getElementById('intro-tip');
    if (el && hidden) el.classList.add('hidden');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    toast.classList.remove('opacity-0');
    setTimeout(() => toast.classList.add('opacity-0'), 2800);
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

window.onload = function () {
    const restored = loadSavedState();
    initApp();
    applyIntroTipState();
    setMobileView('settings');
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { if (zoomFitMode) fitZoom(); }, 120);
    });
    if (restored) showToast("Data terakhir dipulihkan dari penyimpanan browser.");
};

// Dialog pilihan sederhana (pengganti confirm() yang hanya punya 2 tombol).
// buttons: [{ label, value, primary }] — mengembalikan Promise berisi value tombol yang diklik.
function showChoiceDialog({ title, html, buttons }) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 text-sm text-slate-700">
                <h3 class="text-base font-bold text-slate-900 mb-2"></h3>
                <div class="max-h-[50vh] overflow-y-auto text-xs leading-relaxed">${html || ''}</div>
                <div class="mt-4 flex flex-wrap justify-end gap-2" data-buttons></div>
            </div>`;
        overlay.querySelector('h3').textContent = title || '';
        const close = value => {
            document.removeEventListener('keydown', onKey);
            overlay.remove();
            resolve(value);
        };
        const onKey = e => { if (e.key === 'Escape') close(null); };
        const bar = overlay.querySelector('[data-buttons]');
        (buttons || [{ label: 'OK', value: true, primary: true }]).forEach(b => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = b.label;
            btn.className = b.primary
                ? 'bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer';
            btn.onclick = () => close(b.value);
            bar.appendChild(btn);
        });
        overlay.addEventListener('click', e => { if (e.target === overlay) close(null); });
        document.addEventListener('keydown', onKey);
        document.body.appendChild(overlay);
        const primary = bar.querySelector('button');
        if (primary) primary.focus();
    });
}
