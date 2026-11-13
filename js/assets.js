// ============================================================================
// 1. DEFAULT SVG ASSETS (Logo Pemda & Sekolah generik, TTD, Cap contoh)
// ============================================================================
const DEFAULT_LOGO_PEMDA = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 145">
    <path d="M8 6 L112 6 L112 88 C112 118 60 139 60 139 C60 139 8 118 8 88 Z" fill="#15803d" stroke="#facc15" stroke-width="5"/>
    <rect x="11" y="9" width="98" height="18" fill="#ffffff"/>
    <text x="60" y="22" font-family="Arial" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">LOGO PEMDA</text>
    <polygon points="60,40 66,58 85,58 70,69 76,87 60,76 44,87 50,69 35,58 54,58" fill="#facc15" stroke="#ffffff" stroke-width="1.5"/>
    <path d="M28 100 Q60 116 92 100" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
    <text x="60" y="124" font-family="Arial" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle">GANTI LOGO</text>
</svg>`);

const DEFAULT_LOGO_SEKOLAH = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 130">
    <polygon points="65,5 123,46 101,118 29,118 7,46" fill="#0284c7" stroke="#0f172a" stroke-width="3.5"/>
    <text x="65" y="40" font-family="Arial" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">LOGO SEKOLAH</text>
    <path d="M40 62 L65 52 L90 62 L65 72 Z" fill="#facc15" stroke="#0f172a" stroke-width="1.5"/>
    <path d="M48 66 L48 78 Q65 88 82 78 L82 66" fill="none" stroke="#ffffff" stroke-width="3"/>
    <text x="65" y="104" font-family="Arial" font-size="7.5" font-weight="bold" fill="#ffffff" text-anchor="middle">GANTI LOGO</text>
</svg>`);

const DEFAULT_TTD_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 100">
    <path d="M25 75 C45 20, 65 85, 90 35 C105 10, 110 80, 135 45 C150 25, 165 65, 195 30" fill="none" stroke="#1d4ed8" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M45 62 Q110 52 185 60" fill="none" stroke="#1d4ed8" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M75 22 C65 45, 70 75, 82 88" fill="none" stroke="#1d4ed8" stroke-width="2" stroke-linecap="round"/>
</svg>`);

const DEFAULT_CAP_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140">
    <g opacity="0.82" transform="rotate(-8 70 70)">
        <circle cx="70" cy="70" r="62" fill="none" stroke="#4338ca" stroke-width="3.5"/>
        <circle cx="70" cy="70" r="56" fill="none" stroke="#4338ca" stroke-width="1.2"/>
        <circle cx="70" cy="70" r="38" fill="none" stroke="#4338ca" stroke-width="2"/>
        <line x1="10" y1="56" x2="130" y2="56" stroke="#4338ca" stroke-width="1.8"/>
        <line x1="10" y1="84" x2="130" y2="84" stroke="#4338ca" stroke-width="1.8"/>
        <text x="70" y="32" font-family="Arial" font-size="8.5" font-weight="bold" fill="#4338ca" text-anchor="middle">PEMERINTAH KABUPATEN</text>
        <text x="70" y="45" font-family="Arial" font-size="7.5" font-weight="bold" fill="#4338ca" text-anchor="middle">DINAS PENDIDIKAN</text>
        <text x="70" y="73" font-family="Arial" font-size="9.5" font-weight="bold" fill="#4338ca" text-anchor="middle">CAP SEKOLAH</text>
        <text x="70" y="102" font-family="Arial" font-size="8" font-weight="bold" fill="#4338ca" text-anchor="middle">CONTOH</text>
        <polygon points="70,108 72,114 78,114 73,117 75,123 70,119 65,123 67,117 62,114 68,114" fill="#4338ca"/>
    </g>
</svg>`);

const DEFAULT_DEV_PHOTO_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 300">
    <rect width="240" height="300" fill="#e60000"/>
    <path d="M12 300 C18 228, 60 205, 120 205 C180 205, 222 228, 228 300 Z" fill="#0f172a"/>
    <polygon points="88,200 152,200 132,295 108,295" fill="#ffffff"/>
    <polygon points="86,192 120,226 102,242 78,208" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
    <polygon points="154,192 120,226 138,242 162,208" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
    <polygon points="111,222 129,222 133,236 120,245 107,236" fill="#090d16"/>
    <polygon points="114,241 126,241 131,300 109,300" fill="#090d16"/>
    <polygon points="78,204 108,295 62,295" fill="#1e293b"/>
    <polygon points="162,204 132,295 178,295" fill="#1e293b"/>
    <rect x="94" y="162" width="52" height="46" rx="16" fill="#d99b78"/>
    <ellipse cx="69" cy="126" rx="8" ry="16" fill="#d99b78"/>
    <ellipse cx="171" cy="126" rx="8" ry="16" fill="#d99b78"/>
    <path d="M72 88 C72 54, 168 54, 168 88 C168 142, 152 180, 120 180 C88 180, 72 142, 72 88 Z" fill="#e5a985"/>
    <path d="M68 106 C64 72, 78 44, 118 42 C156 40, 176 62, 172 104 C168 82, 158 68, 136 64 C104 58, 78 72, 68 106 Z" fill="#141414"/>
    <path d="M86 105 Q99 100 110 105" fill="none" stroke="#1f1f1f" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M130 105 Q141 100 154 105" fill="none" stroke="#1f1f1f" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="98" cy="116" rx="8" ry="4.5" fill="#ffffff"/>
    <circle cx="98" cy="116" r="3.8" fill="#1f1610"/>
    <ellipse cx="142" cy="116" rx="8" ry="4.5" fill="#ffffff"/>
    <circle cx="142" cy="116" r="3.8" fill="#1f1610"/>
    <path d="M120 114 L117 136 Q120 140 126 136" fill="none" stroke="#b57957" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M104 153 Q120 158 136 153" fill="none" stroke="#8c4a3e" stroke-width="3" stroke-linecap="round"/>
</svg>`);
