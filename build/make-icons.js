// Membuat ikon PWA (192, 512, maskable 512) dari img/favicon.svg memakai Chrome headless.
// Jalankan: node build/make-icons.js  (CHROME_PATH bisa diubah seperti npm test)
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const svg = fs.readFileSync(path.join(ROOT, 'img/favicon.svg'), 'utf8');

// Versi maskable: latar penuh tanpa sudut membulat, logo diperkecil ke zona aman (±80%).
const maskable = svg
    .replace('<rect width="64" height="64" rx="14" fill="url(#g)"/>', '<rect width="64" height="64" fill="url(#g)"/>')
    .replace('translate(8 8) scale(2)', 'translate(15.2 15.2) scale(1.4)');

const icons = [
    { file: 'icon-192.png', size: 192, src: svg },
    { file: 'icon-512.png', size: 512, src: svg },
    { file: 'icon-maskable-512.png', size: 512, src: maskable }
];

(async () => {
    const browser = await chromium.launch({ executablePath: CHROME, headless: true });
    for (const { file, size, src } of icons) {
        const page = await browser.newPage({ viewport: { width: size, height: size } });
        const sized = src.replace('<svg ', `<svg width="${size}" height="${size}" `);
        await page.setContent(`<html><body style="margin:0;background:transparent">${sized}</body></html>`);
        await page.screenshot({ path: path.join(ROOT, 'img', file), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
        await page.close();
        console.log('  ✔ img/' + file);
    }
    await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
