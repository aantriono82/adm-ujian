// ============================================================================
// EKSPOR MICROSOFT WORD (.docx)
// ----------------------------------------------------------------------------
// Pratinjau dibangun dengan CSS modern (flex, grid, position:absolute, SVG) yang
// TIDAK dipahami MS Word. Modul ini membaca tata letak yang sudah dihitung
// browser (getComputedStyle + getBoundingClientRect) lalu menuliskannya ulang:
//   • flex baris / grid      → tabel tanpa garis (posisi kolom dipertahankan)
//   • semua gambar (SVG dll) → PNG
//   • cap + TTD bertumpuk     → digabung menjadi satu gambar
//   • gaya                    → style inline (font, ukuran, garis, warna, padding)
// HTML sederhana itu lalu diubah menjadi berkas .docx asli dengan pustaka "docx"
// (vendor/docx, dimuat hanya saat dibutuhkan) — terbuka rapi di MS Word,
// LibreOffice, WPS Office, maupun Google Docs.
// ============================================================================
const WORD_PRECISE_DOCS = ['kartu', 'denah', 'meja', 'nominasi', 'pintu'];
const WORD_PX_TO_PT = 0.75;
const WORD_VENDOR_SCRIPTS = ['vendor/docx/index.iife.js', 'vendor/docx/math.iife.js', 'vendor/docx/html.iife.js'];
const WORD_KEEP_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'b', 'strong', 'i', 'em', 'u', 'sup', 'sub', 'small', 'span', 'div']);
const WORD_TABLE_TAGS = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'colgroup', 'col']);
const WORD_SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'TEMPLATE', 'NOSCRIPT']);

const pt = px => Math.round(px * WORD_PX_TO_PT * 100) / 100;

function wordColor(cssColor) {
    const m = String(cssColor).match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/);
    if (!m) return null;
    let [r, g, b] = [m[1], m[2], m[3]].map(Number);
    let a = m[4] === undefined ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : Number(m[4]));
    if (a === 0) return null;
    // Campur dengan putih karena Word tidak mengenal transparansi warna
    [r, g, b] = [r, g, b].map(c => Math.round(c * a + 255 * (1 - a)));
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

function wordFontFamily(family) {
    const f = String(family).toLowerCase();
    if (f.includes('tinos') || f.includes('times') || f.includes('serif') && !f.includes('sans')) return "'Times New Roman', serif";
    if (f.includes('mono')) return "'Courier New', monospace";
    return 'Arial, sans-serif';
}

// Gaya inline untuk satu elemen (hanya properti yang dipahami Word)
function wordStyle(el, cs, opts = {}) {
    const s = [];
    s.push(`font-family:${wordFontFamily(cs.fontFamily)}`);
    s.push(`font-size:${pt(parseFloat(cs.fontSize))}pt`);
    if (parseInt(cs.fontWeight, 10) >= 600) s.push('font-weight:bold');
    if (cs.fontStyle === 'italic') s.push('font-style:italic');
    const deco = cs.textDecorationLine || cs.textDecoration || '';
    if (deco.includes('underline')) s.push('text-decoration:underline');
    else if (deco.includes('line-through')) s.push('text-decoration:line-through');
    if (cs.textTransform === 'uppercase') s.push('text-transform:uppercase');
    if (['center', 'right', 'justify'].includes(cs.textAlign)) s.push(`text-align:${cs.textAlign}`);
    else if (cs.textAlign === 'end') s.push('text-align:right');
    const color = wordColor(cs.color);
    if (color && color !== '#000000') s.push(`color:${color}`);
    const bg = wordColor(cs.backgroundColor);
    if (bg && bg !== '#ffffff' && !opts.noBox) s.push(`background:${bg}`);
    if (cs.lineHeight !== 'normal') {
        const lh = parseFloat(cs.lineHeight);
        if (lh > 0) s.push(`line-height:${pt(lh)}pt`, 'mso-line-height-rule:at-least');
    }

    ['Top', 'Right', 'Bottom', 'Left'].forEach(side => {
        if (opts.noBox) return;
        const w = parseFloat(cs[`border${side}Width`]);
        const st = cs[`border${side}Style`];
        if (w > 0 && st !== 'none' && st !== 'hidden') {
            const c = wordColor(cs[`border${side}Color`]) || '#000000';
            const style = ['dashed', 'dotted', 'double'].includes(st) ? st : 'solid';
            s.push(`border-${side.toLowerCase()}:${Math.max(0.5, pt(w))}pt ${style} ${c}`);
        }
        const p = parseFloat(cs[`padding${side}`]);
        if (p > 0.5) s.push(`padding-${side.toLowerCase()}:${pt(p)}pt`);
    });

    if (!opts.cell) {
        const mt = parseFloat(cs.marginTop), mb = parseFloat(cs.marginBottom), ml = parseFloat(cs.marginLeft);
        s.push(`margin-top:${mt > 0 ? pt(mt) : 0}pt`, `margin-bottom:${mb > 0 ? pt(mb) : 0}pt`);
        if (ml > 0.5 && !opts.ignoreMarginLeft) s.push(`margin-left:${pt(ml)}pt`);
    } else {
        const va = opts.verticalAlign || ({ middle: 'middle', bottom: 'bottom' }[cs.verticalAlign] || 'top');
        s.push(`vertical-align:${va}`);
        if (opts.widthPx) s.push(`width:${pt(opts.widthPx)}pt`);
    }
    if (opts.heightPx) s.push(`height:${pt(opts.heightPx)}pt`);
    return s.join(';');
}

function wordHasBox(cs) {
    const bg = wordColor(cs.backgroundColor);
    if (bg && bg !== '#ffffff') return true;
    return ['Top', 'Right', 'Bottom', 'Left'].some(side =>
        parseFloat(cs[`border${side}Width`]) > 0 && !['none', 'hidden'].includes(cs[`border${side}Style`]));
}

// Blok bergaris/berlatar (bingkai kartu, garis kop, kotak judul) → tabel satu sel,
// karena garis paragraf Word tidak dapat membingkai tabel/gambar di dalamnya.
function wordBox(el, cs, innerHtml, fixedHeightPx) {
    const r = el.getBoundingClientRect();
    const cellStyle = wordStyle(el, cs, { cell: true, widthPx: r.width, heightPx: fixedHeightPx });
    const mt = parseFloat(cs.marginTop), mb = parseFloat(cs.marginBottom);
    const tableStyle = `border-collapse:collapse;width:${pt(r.width)}pt;margin-top:${mt > 0 ? pt(mt) : 0}pt;margin-bottom:${mb > 0 ? pt(mb) : 0}pt`;
    const empty = !innerHtml.trim();
    const inner = empty ? `<p style="font-size:1pt;line-height:1pt;margin:0">&nbsp;</p>` : innerHtml;
    return `<table cellspacing="0" cellpadding="0" border="0" style="${tableStyle}"><tr${fixedHeightPx ? ` style="height:${pt(fixedHeightPx)}pt"` : ''}><td style="${cellStyle}">${inner}</td></tr></table>`;
}

function wordVisibleItems(el) {
    const items = [];
    el.childNodes.forEach(n => {
        if (n.nodeType === Node.TEXT_NODE) {
            if (n.nodeValue.trim()) items.push(n);
        } else if (n.nodeType === Node.ELEMENT_NODE && !WORD_SKIP_TAGS.has(n.tagName) && !n.classList.contains('no-print')) {
            const cs = getComputedStyle(n);
            if (cs.display !== 'none' && cs.visibility !== 'hidden') items.push(n);
        }
    });
    return items;
}

function wordRect(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        const r = document.createRange();
        r.selectNodeContents(node);
        return r.getBoundingClientRect();
    }
    return node.getBoundingClientRect();
}

// Kelompokkan item per baris. Flex tanpa wrap selalu satu baris; untuk flex-wrap & grid,
// item yang rentang vertikalnya bertumpang-tindih dianggap satu baris (align-items: center
// membuat posisi "top" tiap item berbeda walau berada di baris yang sama).
function wordGroupRows(items, singleRow) {
    const withRect = items.map(n => ({ n, r: wordRect(n) })).filter(x => x.r.width > 0 || x.r.height > 0);
    if (singleRow) return withRect.length ? [{ items: withRect.sort((a, b) => a.r.left - b.r.left) }] : [];
    withRect.sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left);
    const rows = [];
    withRect.forEach(x => {
        const top = x.r.top, bottom = x.r.top + x.r.height;
        const row = rows.find(rw => Math.min(rw.bottom, bottom) - Math.max(rw.top, top) > 1);
        if (row) {
            row.items.push(x);
            row.top = Math.min(row.top, top);
            row.bottom = Math.max(row.bottom, bottom);
        } else {
            rows.push({ top, bottom, items: [x] });
        }
    });
    rows.forEach(rw => rw.items.sort((a, b) => a.r.left - b.r.left));
    return rows;
}

// ---------------------------------------------------------------------------
// Gambar
// ---------------------------------------------------------------------------
function wordRegisterImage(ctx, pngDataUrl, key) {
    if (key) ctx.cache.set(key, pngDataUrl);
    return pngDataUrl;
}

// Ukuran tampil sebenarnya dari <img> dengan object-fit: contain
function wordFittedImageRect(img) {
    const r = img.getBoundingClientRect();
    const cs = getComputedStyle(img);
    const nw = img.naturalWidth, nh = img.naturalHeight;
    if (cs.objectFit !== 'contain' || !nw || !nh || !r.width || !r.height) return r;
    const scale = Math.min(r.width / nw, r.height / nh);
    const w = nw * scale, h = nh * scale;
    return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
}

function wordImgTag(src, w, h, extraStyle = '') {
    return `<img src="${src}" width="${Math.round(w)}" height="${Math.round(h)}" style="width:${pt(w)}pt;height:${pt(h)}pt;${extraStyle}">`;
}

async function wordImage(img, ctx) {
    const fr = wordFittedImageRect(img);
    if (fr.width < 1 || fr.height < 1 || !img.currentSrc && !img.src) return '';
    const src = img.currentSrc || img.src;
    const key = `${src.length}:${src.slice(-64)}:${Math.round(fr.width)}x${Math.round(fr.height)}`;
    let loc = ctx.cache.get(key);
    if (!loc) {
        const png = await rasterizeToPng(src, fr.width, fr.height);
        loc = wordRegisterImage(ctx, png, key);
    }
    return wordImgTag(loc, fr.width, fr.height);
}

// Wadah yang isinya hanya gambar bertumpuk (cap di bawah TTD) → satu gambar gabungan
async function wordCompositeImages(container, imgs, ctx) {
    const boxes = imgs.map(img => ({ img, r: wordFittedImageRect(img), z: parseInt(getComputedStyle(img).zIndex, 10) || 0 }))
        .filter(b => b.r.width > 0 && b.r.height > 0)
        .sort((a, b) => a.z - b.z);
    const cr = container.getBoundingClientRect();
    if (!boxes.length) return `<div style="height:${pt(cr.height)}pt;margin:0">&nbsp;</div>`;
    const left = Math.min(cr.left, ...boxes.map(b => b.r.left));
    const top = Math.min(cr.top, ...boxes.map(b => b.r.top));
    const right = Math.max(cr.right, ...boxes.map(b => b.r.left + b.r.width));
    const bottom = Math.max(cr.bottom, ...boxes.map(b => b.r.top + b.r.height));
    const W = right - left, H = bottom - top, density = 3;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(W * density);
    canvas.height = Math.round(H * density);
    const g = canvas.getContext('2d');
    g.imageSmoothingQuality = 'high';
    for (const b of boxes) {
        const el = await loadImageElement(b.img.currentSrc || b.img.src);
        g.globalAlpha = parseFloat(getComputedStyle(b.img).opacity) || 1;
        g.drawImage(el, (b.r.left - left) * density, (b.r.top - top) * density, b.r.width * density, b.r.height * density);
    }
    const loc = wordRegisterImage(ctx, canvas.toDataURL('image/png'));
    return `<div style="margin:0;margin-left:${pt(Math.min(0, left - cr.left))}pt">${wordImgTag(loc, W, H)}</div>`;
}

// ---------------------------------------------------------------------------
// Konversi elemen
// ---------------------------------------------------------------------------
async function wordConvertChildren(el, ctx, items) {
    let out = '';
    for (const n of (items || wordVisibleItems(el))) out += await wordConvertNode(n, ctx);
    return out;
}

async function wordConvertNode(node, ctx) {
    if (node.nodeType === Node.TEXT_NODE) {
        return escapeHtml(node.nodeValue.replace(/\s+/g, ' '));
    }
    const el = node;
    const tag = el.tagName.toLowerCase();
    const cs = getComputedStyle(el);
    // Tanda air transparan di belakang kartu tidak dapat ditiru Word → dilewati
    if (cs.position === 'absolute' && parseFloat(cs.opacity) < 0.5) return '';
    if (tag === 'img') return wordImage(el, ctx);
    if (tag === 'br') return '<br>';
    if (tag === 'svg') {
        const r = el.getBoundingClientRect();
        if (r.width < 1) return '';
        const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(el));
        const loc = wordRegisterImage(ctx, await rasterizeToPng(svgUrl, r.width, r.height));
        return wordImgTag(loc, r.width, r.height);
    }

    const items = wordVisibleItems(el);
    const elementItems = items.filter(n => n.nodeType === Node.ELEMENT_NODE);
    if (elementItems.length && elementItems.length === items.length &&
        elementItems.every(n => n.tagName === 'IMG' && getComputedStyle(n).position === 'absolute')) {
        return wordCompositeImages(el, elementItems, ctx);
    }

    if (WORD_TABLE_TAGS.has(tag)) return wordTableElement(el, cs, tag, ctx);

    const isRowFlex = (cs.display === 'flex' || cs.display === 'inline-flex') && cs.flexDirection.startsWith('row');
    const isGrid = cs.display === 'grid' || cs.display === 'inline-grid';
    if ((isRowFlex || isGrid) && items.length >= 2) {
        return wordLayoutTable(el, cs, items, ctx, isRowFlex && cs.flexWrap === 'nowrap');
    }
    // Satu anak yang digeser (justify-content: flex-end/center), mis. blok tanda tangan rata kanan
    if (isRowFlex && items.length === 1 && items[0].nodeType === Node.ELEMENT_NODE) {
        const box = el.getBoundingClientRect(), r = items[0].getBoundingClientRect();
        const offset = r.left - (box.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft));
        if (offset > 2) return wordLayoutTable(el, cs, items, ctx, true);
    }

    const children = await wordConvertChildren(el, ctx, items);
    const isInline = cs.display.startsWith('inline') && !cs.display.includes('flex') && !cs.display.includes('grid');
    const outTag = WORD_KEEP_TAGS.has(tag) ? (tag === 'span' && !isInline ? 'div' : tag) : (isInline ? 'span' : 'div');
    if (outTag === 'span' || ['b', 'strong', 'i', 'em', 'u', 'sup', 'sub', 'small'].includes(outTag)) {
        return `<${outTag} style="${wordInlineStyle(cs)}">${children}</${outTag}>`;
    }
    const rectH = el.getBoundingClientRect().height;
    if (wordHasBox(cs) && !['li', 'ul', 'ol'].includes(outTag)) {
        return wordBox(el, cs, children, children.trim() ? 0 : rectH);
    }
    // Wadah kosong yang hanya memberi jarak (mis. ruang tanda tangan)
    if (!children.trim()) {
        if (rectH < 2) return '';
        return `<p style="font-size:1pt;line-height:${pt(rectH)}pt;mso-line-height-rule:exactly;margin:0">&nbsp;</p>`;
    }
    return `<${outTag} style="${wordStyle(el, cs)}">${children}</${outTag}>`;
}

function wordInlineStyle(cs) {
    const s = [];
    if (parseInt(cs.fontWeight, 10) >= 600) s.push('font-weight:bold');
    if (cs.fontStyle === 'italic') s.push('font-style:italic');
    const deco = cs.textDecorationLine || '';
    if (deco.includes('underline')) s.push('text-decoration:underline');
    if (cs.textTransform === 'uppercase') s.push('text-transform:uppercase');
    const color = wordColor(cs.color);
    if (color && color !== '#000000') s.push(`color:${color}`);
    const bg = wordColor(cs.backgroundColor);
    if (bg && bg !== '#ffffff') s.push(`background:${bg}`);
    s.push(`font-size:${pt(parseFloat(cs.fontSize))}pt`);
    const border = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none';
    if (border) s.push(`border:${Math.max(0.5, pt(parseFloat(cs.borderTopWidth)))}pt solid ${wordColor(cs.borderTopColor) || '#000000'}`);
    const pl = parseFloat(cs.paddingLeft);
    if (pl > 0.5) s.push(`padding:0 ${pt(pl)}pt`);
    return s.join(';');
}

// Tabel asli dari pratinjau: pertahankan struktur, ubah gaya menjadi inline
async function wordTableElement(el, cs, tag, ctx) {
    const attrs = [];
    ['colspan', 'rowspan'].forEach(a => { if (el.hasAttribute(a)) attrs.push(`${a}="${escapeHtml(el.getAttribute(a))}"`); });
    if (tag === 'table') {
        const w = el.getBoundingClientRect().width;
        attrs.push('cellspacing="0"', 'cellpadding="0"', 'border="0"');
        const style = `${wordStyle(el, cs)};border-collapse:collapse;width:${pt(w)}pt;mso-table-lspace:0;mso-table-rspace:0`;
        return `<table ${attrs.join(' ')} style="${style}">${await wordConvertChildren(el, ctx)}</table>`;
    }
    if (tag === 'td' || tag === 'th') {
        const r = el.getBoundingClientRect();
        const style = wordStyle(el, cs, { cell: true, widthPx: el.hasAttribute('colspan') ? 0 : r.width });
        const inner = await wordConvertChildren(el, ctx);
        return `<${tag} ${attrs.join(' ')} style="${style}">${inner.trim() ? inner : '&nbsp;'}</${tag}>`;
    }
    if (tag === 'tr') {
        const h = el.getBoundingClientRect().height;
        return `<tr style="height:${pt(h)}pt;page-break-inside:avoid">${await wordConvertChildren(el, ctx)}</tr>`;
    }
    if (tag === 'col' || tag === 'colgroup') return '';
    return `<${tag}>${await wordConvertChildren(el, ctx)}</${tag}>`;
}

// flex (baris) dan grid → tabel tanpa garis. Celah antar-item dijadikan sel kosong
// sehingga perataan (space-between, flex-end, center) tetap sama seperti di pratinjau.
async function wordLayoutTable(el, cs, items, ctx, singleRow) {
    const rows = wordGroupRows(items, singleRow);
    const box = el.getBoundingClientRect();
    const contentLeft = box.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft);
    const contentWidth = box.width - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const vAlign = { center: 'middle', 'flex-end': 'bottom', end: 'bottom' }[cs.alignItems] || 'top';
    const rowGap = parseFloat(cs.rowGap) || 0;

    let tables = '';
    for (let ri = 0; ri < rows.length; ri++) {
        let cells = '', cursor = contentLeft;
        for (const { n, r } of rows[ri].items) {
            const gap = r.left - cursor;
            if (gap > 1) cells += `<td style="width:${pt(gap)}pt;padding:0">&nbsp;</td>`;
            const ncs = n.nodeType === Node.ELEMENT_NODE ? getComputedStyle(n) : cs;
            const selfAlign = n.nodeType === Node.ELEMENT_NODE ? ({ center: 'middle', 'flex-end': 'bottom', end: 'bottom' }[ncs.alignSelf]) : null;
            const inner = await wordConvertNode(n, ctx);
            const textStyle = `font-family:${wordFontFamily(ncs.fontFamily)};font-size:${pt(parseFloat(ncs.fontSize))}pt`;
            cells += `<td style="width:${pt(r.width)}pt;padding:0;vertical-align:${selfAlign || vAlign};${textStyle}">${inner.trim() ? inner : '&nbsp;'}</td>`;
            cursor = r.left + r.width;
        }
        const pad = ri < rows.length - 1 && rowGap > 0 ? `margin-bottom:${pt(rowGap)}pt;` : '';
        tables += `<table cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;width:${pt(contentWidth)}pt;${pad}mso-table-lspace:0;mso-table-rspace:0"><tr>${cells}</tr></table>`;
    }
    // Wadah flex/grid bisa punya garis, latar & padding sendiri (mis. bingkai kartu)
    if (wordHasBox(cs)) return wordBox(el, cs, tables, 0);
    return `<div style="${wordStyle(el, cs)}">${tables}</div>`;
}

// ---------------------------------------------------------------------------
// Pembuatan berkas .docx
// ---------------------------------------------------------------------------
function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[data-src="${src}"]`)) return resolve();
        const el = document.createElement('script');
        el.src = src;
        el.dataset.src = src;
        el.onload = () => resolve();
        el.onerror = () => { el.remove(); reject(new Error(`Pustaka ${src} tidak ditemukan. Pastikan folder "vendor" ikut tersalin bersama index.html.`)); };
        document.head.appendChild(el);
    });
}

async function loadDocxLibraries() {
    if (window.docx && window.docxHtml) return;
    for (const src of WORD_VENDOR_SCRIPTS) await loadScriptOnce(src); // urutan penting
    if (!window.docx || !window.docxHtml) throw new Error('Pustaka pembuat Word gagal dimuat.');
}

function wordWaitForImages(root) {
    return Promise.all([...root.querySelectorAll('img')].map(img =>
        img.complete ? Promise.resolve() : new Promise(res => { img.onload = img.onerror = res; })));
}

// Ubah lembar-lembar pratinjau menjadi HTML sederhana per halaman + ukuran kertas
async function buildWordPages(container) {
    const sheets = [...container.querySelectorAll('.print-sheet')];
    if (!sheets.length) return null;
    const ctx = { cache: new Map() };
    const first = sheets[0];
    const fcs = getComputedStyle(first);
    const widthCm = parseFloat(first.style.width) || 21;
    const heightCm = parseFloat(first.style.minHeight || first.style.height) || 29.7;
    const pxToCm = px => (parseFloat(px) || 0) / 96 * 2.54;
    const margin = {
        top: Math.max(0.5, pxToCm(fcs.paddingTop)), bottom: Math.max(0.5, pxToCm(fcs.paddingBottom)),
        left: Math.max(0.5, pxToCm(fcs.paddingLeft)), right: Math.max(0.5, pxToCm(fcs.paddingRight))
    };
    const pages = [];
    for (const sheet of sheets) pages.push(await wordConvertChildren(sheet, ctx));
    return { pages, widthCm, heightCm, margin };
}

async function buildDocxBlob(container) {
    await loadDocxLibraries();
    const built = await buildWordPages(container);
    if (!built) return null;
    const { Document, Packer, PageOrientation } = window.docx;
    const cmToTwip = cm => Math.round(cm / 2.54 * 1440);
    const contentWidthPx = (built.widthCm - built.margin.left - built.margin.right) / 2.54 * 96;
    const landscape = built.widthCm > built.heightCm;
    const warnings = [];

    const sections = built.pages.map(html => ({
        properties: {
            page: {
                // docx menukar lebar/tinggi sendiri untuk lanskap, jadi berikan ukuran potret
                size: {
                    width: cmToTwip(Math.min(built.widthCm, built.heightCm)),
                    height: cmToTwip(Math.max(built.widthCm, built.heightCm)),
                    orientation: landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT
                },
                margin: {
                    top: cmToTwip(built.margin.top), bottom: cmToTwip(built.margin.bottom),
                    left: cmToTwip(built.margin.left), right: cmToTwip(built.margin.right),
                    header: 0, footer: 0
                }
            }
        },
        children: window.docxHtml.htmlToContent(html, {
            maxImageWidth: Math.floor(contentWidthPx),
            onWarning: w => warnings.push(w)
        })
    }));

    const doc = new Document({
        creator: 'Sistem Administrasi Asesmen Sumatif Terpadu',
        title: `${appState.kegiatan.singkatan} - ${appState.docMode}`,
        styles: {
            default: {
                document: {
                    run: { font: 'Times New Roman', size: 22 },
                    paragraph: { spacing: { before: 0, after: 0 } }
                }
            }
        },
        sections
    });
    if (warnings.length) console.info('Catatan konversi Word:', warnings);
    return Packer.toBlob(doc);
}

async function exportWord() {
    if (WORD_PRECISE_DOCS.includes(appState.docMode)) {
        const choice = await showChoiceDialog({
            title: 'Dokumen ini paling rapi dicetak sebagai PDF',
            html: `<p>Kartu peserta, denah, nomor meja, daftar nominasi, dan label pintu memakai tata letak presisi (ukuran cm).
                   Word tidak mendukung tata letak tersebut sepenuhnya sehingga posisi dapat sedikit bergeser.</p>
                   <p class="mt-2">Untuk hasil yang identik dengan pratinjau, gunakan <strong>Cetak / PDF</strong>.
                   Ekspor Word paling cocok untuk dokumen teks: SK, POS, Tata Tertib, Berita Acara, Daftar Hadir, dan Laporan.</p>`,
            buttons: [
                { label: 'Cetak / PDF', value: 'pdf', primary: true },
                { label: 'Tetap unduh Word', value: 'word' },
                { label: 'Batal', value: null }
            ]
        });
        if (choice === 'pdf') { printPDF(); return; }
        if (choice !== 'word') return;
    }

    showToast("Menyiapkan dokumen Microsoft Word (.docx)...");
    const container = document.getElementById('sheets-container');
    const prevTransform = container.style.transform;
    container.style.transform = 'none'; // ukur dalam skala 100%, bukan skala zoom
    try {
        await wordWaitForImages(container);
        const blob = await buildDocxBlob(container);
        if (!blob) { showToast('Tidak ada dokumen untuk diekspor.'); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${appState.docMode.toUpperCase()}_${appState.kegiatan.singkatan}_${String(appState.kegiatan.tapelAngka || '').replace(/[\\/:*?"<>|]/g, '-')}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast("Dokumen Word (.docx) berhasil diunduh!");
    } catch (err) {
        console.error(err);
        showToast('Gagal membuat dokumen Word: ' + (err.message || err));
    } finally {
        container.style.transform = prevTransform;
    }
}
