// PWA: daftarkan service worker (mode offline & bisa dipasang), tombol "Pasang Aplikasi",
// dan pemberitahuan saat versi baru tersedia. Hanya aktif bila dibuka lewat http(s) —
// saat index.html dibuka langsung (file://) aplikasi tetap berjalan seperti biasa.
(function () {
    const supported = 'serviceWorker' in navigator && /^https?:$/.test(location.protocol);
    let deferredPrompt = null;
    let reloading = false;

    function setInstallVisible(show) {
        const btn = document.getElementById('pwa-install-btn');
        if (btn) btn.classList.toggle('hidden', !show);
    }

    window.installApp = async function () {
        if (!deferredPrompt) return;
        const prompt = deferredPrompt;
        deferredPrompt = null;
        setInstallVisible(false);
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome !== 'accepted') showToast('Pemasangan dibatalkan. Bisa dipasang lagi lewat menu Alat.');
    };

    function showUpdateBanner(worker) {
        const el = document.getElementById('pwa-update');
        if (!el) return;
        el.classList.remove('hidden');
        document.getElementById('pwa-update-reload').onclick = () => {
            reloading = true;
            worker.postMessage('SKIP_WAITING');
        };
        document.getElementById('pwa-update-close').onclick = () => el.classList.add('hidden');
    }

    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
        setInstallVisible(true);
    });
    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        setInstallVisible(false);
        showToast('Aplikasi terpasang. Buka dari layar utama / menu aplikasi.');
    });

    if (!supported) return;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) location.reload();
    });

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
            const watch = worker => {
                if (!worker) return;
                worker.addEventListener('statechange', () => {
                    // Ada controller lama = ini pembaruan, bukan pemasangan pertama.
                    if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner(worker);
                });
            };
            if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg.waiting);
            watch(reg.installing);
            reg.addEventListener('updatefound', () => watch(reg.installing));
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') reg.update().catch(() => {});
            });
        }).catch(err => console.warn('Service worker gagal didaftarkan:', err));
    });
})();
