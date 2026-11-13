// Memperbarui daftar berkas (PRECACHE) & versi cache di sw.js berdasarkan isi berkas aplikasi.
// Jalankan `npm run build:sw` setelah mengubah berkas apa pun; `--check` hanya memeriksa (dipakai npm test).
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SW = path.join(ROOT, 'sw.js');
const ROOT_FILES = ['index.html', 'manifest.webmanifest'];
const DIRS = ['css', 'js', 'img', 'vendor'];
const SKIP = /(^|\/)LICENSE[^/]*$/;

function walk(dir) {
    return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
        const rel = dir + '/' + e.name;
        return e.isDirectory() ? walk(rel) : [rel];
    });
}

function computeAssets() {
    const files = [...ROOT_FILES, ...DIRS.flatMap(walk).filter(f => !SKIP.test(f)).sort()];
    const hash = crypto.createHash('sha256');
    for (const f of files) hash.update(f + '\0').update(fs.readFileSync(path.join(ROOT, f)));
    return { files, version: hash.digest('hex').slice(0, 12) };
}

function render(src, { files, version }) {
    const list = ['./', ...files].map(f => `    '${f === './' ? f : './' + f}'`).join(',\n');
    return src
        .replace(/const CACHE_VERSION = '[^']*';/, `const CACHE_VERSION = '${version}';`)
        .replace(/const PRECACHE = \[[\s\S]*?\];/, `const PRECACHE = [\n${list}\n];`);
}

const current = fs.readFileSync(SW, 'utf8');
const next = render(current, computeAssets());
if (process.argv.includes('--check')) {
    if (next !== current) {
        console.error('sw.js tidak sesuai dengan berkas aplikasi. Jalankan: npm run build:sw');
        process.exit(1);
    }
    console.log('sw.js mutakhir');
} else {
    fs.writeFileSync(SW, next);
    console.log('sw.js diperbarui');
}
