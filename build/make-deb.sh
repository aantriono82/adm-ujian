#!/bin/sh
# Membuat paket Debian/Ubuntu: dist/asesmen-sumatif_<versi>_all.deb
#
#   npm run build:deb            (versi diambil dari package.json)
#   VERSION=1.2.0 npm run build:deb
#
# Isi paket:
#   /usr/share/asesmen-sumatif/            berkas aplikasi (index.html, css, js, img, vendor, ...)
#   /usr/bin/asesmen-sumatif               peluncur (build/deb/asesmen-sumatif)
#   /usr/share/applications/...desktop     entri menu aplikasi
#   /usr/share/icons/hicolor/...           ikon
set -eu

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

PKG=asesmen-sumatif
VERSION=${VERSION:-$(node -p "require('./package.json').version")}
MAINTAINER=${MAINTAINER:-"$(git config user.name 2>/dev/null || echo Pengembang) <$(git config user.email 2>/dev/null || echo noreply@example.com)>"}
OUT="$ROOT/dist"
STAGE="$OUT/${PKG}_${VERSION}_all"
DEB="$STAGE.deb"

for f in index.html manifest.webmanifest sw.js css/tailwind.css img/favicon.svg img/icon-512.png; do
    [ -f "$f" ] || { echo "Berkas $f tidak ada — jalankan 'npm run build' dulu." >&2; exit 1; }
done
# Daftar cache offline (sw.js) harus cocok dengan berkas yang dipaketkan
node build/build-sw.js --check >/dev/null || { echo "sw.js usang — jalankan 'npm run build' dulu." >&2; exit 1; }

rm -rf "$STAGE" "$DEB"
APP="$STAGE/usr/share/$PKG"
mkdir -p "$APP" "$STAGE/DEBIAN" "$STAGE/usr/bin" "$STAGE/usr/share/applications" \
         "$STAGE/usr/share/icons/hicolor/scalable/apps" "$STAGE/usr/share/doc/$PKG"

# 1. Berkas aplikasi
cp -r index.html manifest.webmanifest sw.js css js img vendor "$APP/"
# Baris ke-2 = sidik isi berkas (dari sw.js): salinan untuk browser Snap ikut diperbarui
# walau paket dibangun ulang dengan nomor versi yang sama.
BUILD_ID=$(sed -n "s/^const CACHE_VERSION = '\([^']*\)';/\1/p" sw.js)
printf '%s\n%s\n' "$VERSION" "$BUILD_ID" > "$APP/VERSION"
cp README.md "$STAGE/usr/share/doc/$PKG/"

# 2. Peluncur
install -m 0755 build/deb/asesmen-sumatif "$STAGE/usr/bin/$PKG"

# 3. Ikon
cp img/favicon.svg "$STAGE/usr/share/icons/hicolor/scalable/apps/$PKG.svg"
for s in 192 512; do
    mkdir -p "$STAGE/usr/share/icons/hicolor/${s}x${s}/apps"
    cp "img/icon-$s.png" "$STAGE/usr/share/icons/hicolor/${s}x${s}/apps/$PKG.png"
done

# 4. Entri menu
cat > "$STAGE/usr/share/applications/$PKG.desktop" <<EOF
[Desktop Entry]
Type=Application
Version=1.0
Name=Asesmen Sumatif
GenericName=Administrasi Asesmen Sumatif
Comment=Administrasi ASAS, ASAT, dan ASAJ — bekerja tanpa internet
Exec=$PKG
Icon=$PKG
Terminal=false
Categories=Education;
Keywords=asesmen;ujian;ASAS;ASAT;ASAJ;sekolah;
StartupWMClass=$PKG
StartupNotify=true
EOF

# 5. Metadata paket
find "$STAGE" -type d -exec chmod 0755 {} +
find "$STAGE/usr/share" -type f -exec chmod 0644 {} +
SIZE=$(du -sk --exclude=DEBIAN "$STAGE" | cut -f1)
cat > "$STAGE/DEBIAN/control" <<EOF
Package: $PKG
Version: $VERSION
Section: education
Priority: optional
Architecture: all
Maintainer: $MAINTAINER
Installed-Size: $SIZE
Depends: xdg-utils
Recommends: chromium | google-chrome-stable | microsoft-edge-stable | brave-browser
Homepage: https://github.com/aantriono82/adm-ujian
Description: Administrasi Asesmen Sumatif (ASAS, ASAT, ASAJ)
 Aplikasi pembuat dokumen administrasi asesmen sumatif sekolah: daftar
 peserta, kartu, denah, jadwal pengawas, berita acara, SK, dan lainnya,
 dengan ekspor PDF, Word, dan Excel. Berjalan sepenuhnya tanpa internet;
 dibuka sebagai jendela aplikasi di browser Chromium/Chrome/Edge.
EOF

dpkg-deb --root-owner-group -Zxz --build "$STAGE" "$DEB" >/dev/null
rm -rf "$STAGE"
echo "Paket dibuat: ${DEB#$ROOT/} ($(du -h "$DEB" | cut -f1))"
