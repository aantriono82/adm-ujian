// ============================================================================
// 2. PRESET MODE ASESMEN (ASAS, ASAT, ASAJ)
// ============================================================================
const ASSESSMENT_PRESETS = {
    ASAS: {
        code: "ASAS",
        shortName: "ASAS Ganjil",
        fullName: "Asesmen Sumatif Akhir Semester (ASAS) Ganjil",
        cardTitle: "KARTU ASESMEN SUMATIF AKHIR SEMESTER (ASAS)",
        semester: "Ganjil",
        targetGrades: ["VII", "VIII", "IX"],
        targetGradesText: "Kelas VII, VIII, dan IX",
        skNumber: "421.3 / 085 / SMP.01 / XI / 2026",
        posNumber: "421.3 / 086 / SMP.01 / XI / 2026",
        skDate: "6 November 2026",
        signDate: "26 November 2026",
        startDate: "2026-11-30",
        makeupStart: "2026-12-07",
        reportDate: "14 Desember 2026",
        reportMonthYear: "Desember 2026",
        purposeText: "mengukur dan mengevaluasi pencapaian kompetensi peserta didik Kelas VII, VIII, dan IX setelah menyelesaikan proses pembelajaran selama satu semester ganjil pada Kurikulum Merdeka"
    },
    ASAT: {
        code: "ASAT",
        shortName: "ASAT Genap",
        fullName: "Asesmen Sumatif Akhir Tahun (ASAT)",
        cardTitle: "KARTU ASESMEN SUMATIF AKHIR TAHUN (ASAT)",
        semester: "Genap",
        targetGrades: ["VII", "VIII"],
        targetGradesText: "Kelas VII dan VIII",
        skNumber: "421.3 / 042 / SMP.01 / V / 2027",
        posNumber: "421.3 / 043 / SMP.01 / V / 2027",
        skDate: "10 Mei 2027",
        signDate: "25 Mei 2027",
        startDate: "2027-05-31",
        makeupStart: "2027-06-07",
        reportDate: "15 Juni 2027",
        reportMonthYear: "Juni 2027",
        purposeText: "mengukur dan mengevaluasi pencapaian kompetensi peserta didik Kelas VII dan VIII pada akhir tahun pelajaran sebagai dasar penentuan kenaikan kelas pada Kurikulum Merdeka"
    },
    ASAJ: {
        code: "ASAJ",
        shortName: "ASAJ Kelas IX",
        fullName: "Asesmen Sumatif Akhir Jenjang (ASAJ)",
        cardTitle: "KARTU ASESMEN SUMATIF AKHIR JENJANG (ASAJ)",
        semester: "Genap",
        targetGrades: ["IX"],
        targetGradesText: "Kelas IX",
        skNumber: "421.3 / 028 / SMP.01 / IV / 2027",
        posNumber: "421.3 / 029 / SMP.01 / IV / 2027",
        skDate: "5 April 2027",
        signDate: "15 April 2027",
        startDate: "2027-04-19",
        makeupStart: "2027-04-26",
        reportDate: "4 Mei 2027",
        reportMonthYear: "Mei 2027",
        purposeText: "mengukur pencapaian standar kompetensi lulusan peserta didik Kelas IX pada akhir jenjang Satuan Pendidikan SMP sesuai ketentuan Kurikulum Merdeka"
    }
};

// ============================================================================
// 3. DATA CONTOH (FIKTIF) — GANTI DENGAN DATA SEKOLAH ANDA
// ============================================================================
const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// Ambil n hari sekolah (Senin–Sabtu) mulai dari tanggal ISO
function schoolDaysFrom(isoDate, n) {
    const out = [];
    const parts = String(isoDate || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return out;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    while (out.length < n) {
        if (d.getDay() !== 0) out.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }
    return out;
}
function formatTanggal(d) { return `${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`; }
function formatRentang(a, b) {
    if (!a || !b) return '';
    if (a.getFullYear() !== b.getFullYear()) return `${formatTanggal(a)} s.d. ${formatTanggal(b)}`;
    if (a.getMonth() !== b.getMonth()) return `${a.getDate()} ${NAMA_BULAN[a.getMonth()]} s.d. ${formatTanggal(b)}`;
    return `${a.getDate()} s.d. ${formatTanggal(b)}`;
}
function presetRangeText(iso, n) {
    const days = schoolDaysFrom(iso, n);
    return days.length ? formatRentang(days[0], days[days.length - 1]) : '';
}

const INITIAL_STUDENTS = (() => {
    const kelas7 = [["ADI NUGROHO","L"],["ALYA RAHMAWATI","P"],["BAYU SAPUTRA","L"],["CITRA AYU LESTARI","P"],["DANI PRATAMA","L"],["DEWI ANGGRAINI","P"],["EKO WIBOWO","L"],["FITRIA NINGSIH","P"],["GALIH PERMANA","L"],["HANA SALSABILA","P"],["IRFAN MAULANA","L"],["JIHAN AULIA","P"],["KEVIN ARDIANSYAH","L"],["LAILA NURJANAH","P"],["MUHAMMAD RIZKI","L"],["NABILA PUTRI","P"],["OKTA FIRMANSYAH","L"],["PUTRI AMALIA","P"],["RAFI HIDAYAT","L"],["SALMA AZZAHRA","P"]];
    const kelas8 = [["TAUFIK HAKIM","L"],["UMI KALSUM","P"],["VINO SETIAWAN","L"],["WULAN SARI","P"],["YOGA PRATAMA","L"],["ZAHRA KAMILA","P"],["ARIF RAHMAN","L"],["BELLA SAFITRI","P"],["CAHYO WICAKSONO","L"],["DINDA MAHARANI","P"]];
    const kelas9 = [["FAHMI ALFARIZI","L"],["GITA PERMATASARI","P"],["HAFIZ RAMADHAN","L"],["INTAN PERMATA","P"],["JUNAIDI SAPUTRA","L"],["KARINA OKTAVIANI","P"],["LUTFI HAKIM","L"],["MAYA ANGELINA","P"],["NAUFAL ARKAN","L"],["RATNA DEWI","P"]];
    const nilaiContoh = [86, 84, 80, 88, 78, 90, 82, 85, 79, 83, 81, 77, 89, 84, 87, 80, 74, 85, 81, 83];
    const out = [];
    let no = 1;
    [[kelas7, "VII", "1", "01"], [kelas8, "VIII", "2", "02"], [kelas9, "IX", "3", "03"]].forEach(([list, kelas, ruang, kode]) => {
        list.forEach(([nama, lp], i) => {
            out.push({
                noUjian: `26-001-${String(no).padStart(3, '0')}`,
                nama, lp,
                nisn: `00${kode}${String(no).padStart(6, '0')}`,
                kelas, ruang,
                nilai: nilaiContoh[(no * 7) % nilaiContoh.length]
            });
            no++;
        });
    });
    return out;
})();

// Guru contoh (fiktif)
const G = {
    kepsek: "Budi Santoso, S.Pd., M.Pd.",
    ketua: "Sri Wahyuni, S.Pd.",
    sekretaris: "Dewi Lestari, S.Pd.",
    bendahara: "Agus Prasetyo, S.Pd.",
    proktor: "Rina Marlina, S.Kom.",
    g6: "Hendra Gunawan, S.Pd.",
    g7: "Nurhayati, S.Pd.",
    g8: "Ahmad Fauzi, S.Pd.I.",
    g9: "Siti Aminah, S.Pd.",
    g10: "Joko Purnomo, S.Pd.",
    g11: "Fitri Handayani, S.Pd.",
    g12: "Rudi Hartono, S.Pd."
};

const INITIAL_COMMITTEE = [
    { nama: G.kepsek, nip: "197501012000031001", jabatanDinas: "Kepala Sekolah", jabatanPanitia: "Penanggung Jawab" },
    { nama: G.ketua, nip: "198203152006042003", jabatanDinas: "Waka Kurikulum", jabatanPanitia: "Ketua Pelaksana" },
    { nama: G.sekretaris, nip: "198807202014022002", jabatanDinas: "Guru / Staf TU", jabatanPanitia: "Sekretaris" },
    { nama: G.bendahara, nip: "197911102005011004", jabatanDinas: "Guru IPS", jabatanPanitia: "Bendahara" },
    { nama: G.proktor, nip: "199002052019032006", jabatanDinas: "Guru Informatika", jabatanPanitia: "Koordinator Naskah / Proktor & Teknisi" },
    { nama: G.g6, nip: "198405172010011007", jabatanDinas: "Guru Matematika", jabatanPanitia: "Seksi Penggandaan & Pendistribusian Soal" },
    { nama: G.g7, nip: "198109232008012005", jabatanDinas: "Guru Bahasa Indonesia", jabatanPanitia: "Seksi Penggandaan & Pendistribusian Soal" },
    { nama: G.g8, nip: "197806142006041009", jabatanDinas: "Guru PAI", jabatanPanitia: "Seksi Pengaturan Ruang & Tempat Duduk" },
    { nama: G.g9, nip: "198512082011012004", jabatanDinas: "Guru IPA", jabatanPanitia: "Seksi Konsumsi & Perlengkapan" },
    { nama: G.g10, nip: "198702262015031002", jabatanDinas: "Guru PJOK", jabatanPanitia: "Seksi Konsumsi & Perlengkapan" }
];

const PT45 = "PT: 25 / B-S: 5 / MJ: 5 / IS: 5 / U: 5 (45 soal)";
const PT40 = "PT: 20 / B-S: 5 / MJ: 5 / IS: 5 / U: 5 (40 soal)";
const INITIAL_CORRECTORS = [
    { mapel: "Pendidikan Agama dan Budi Pekerti", k7: G.g8, k8: G.g8, k9: G.g8, bentuk: PT45, waktu: "90 Menit" },
    { mapel: "Pendidikan Pancasila", k7: G.g12, k8: G.g12, k9: G.g12, bentuk: PT45, waktu: "90 Menit" },
    { mapel: "Bahasa Indonesia", k7: G.g7, k8: G.g7, k9: G.g7, bentuk: PT45, waktu: "120 Menit" },
    { mapel: "Matematika", k7: G.g6, k8: G.g6, k9: G.g6, bentuk: PT40, waktu: "120 Menit" },
    { mapel: "Ilmu Pengetahuan Alam (IPA)", k7: G.g9, k8: G.g9, k9: G.g9, bentuk: PT40, waktu: "120 Menit" },
    { mapel: "Ilmu Pengetahuan Sosial (IPS)", k7: G.bendahara, k8: G.bendahara, k9: G.bendahara, bentuk: PT45, waktu: "120 Menit" },
    { mapel: "Bahasa Inggris", k7: G.sekretaris, k8: G.sekretaris, k9: G.sekretaris, bentuk: PT45, waktu: "120 Menit" },
    { mapel: "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)", k7: G.g10, k8: G.g10, k9: G.g10, bentuk: PT45, waktu: "90 Menit" },
    { mapel: "Informatika", k7: G.proktor, k8: G.proktor, k9: G.proktor, bentuk: PT40, waktu: "90 Menit" },
    { mapel: "Seni Budaya dan Prakarya", k7: G.g11, k8: G.g11, k9: G.g11, bentuk: PT45, waktu: "90 Menit" },
    { mapel: "Muatan Lokal (Bahasa Daerah)", k7: G.g11, k8: G.g11, k9: G.g11, bentuk: PT45, waktu: "90 Menit" },
    { mapel: "Pendidikan Anti Korupsi (PAK)", k7: G.g12, k8: G.g12, k9: G.g12, bentuk: PT45, waktu: "90 Menit" }
];

const INITIAL_HANDOVER_LJK = INITIAL_CORRECTORS.map(c => ({ mapel: c.mapel, penerima: c.k7 }));

// Pengawas & jadwal: struktur fleksibel { hari, tanggal, sesi: [{ waktu, mapel, pengawas: [[p1, p2], ...per ruang] }] }
const PENGAWAS_POOL = [G.g6, G.g7, G.g8, G.g9, G.g10, G.g11, G.g12, G.sekretaris, G.bendahara, G.proktor, G.ketua];
const DEFAULT_MAPEL_HARIAN = [
    ["Bahasa Indonesia", "Pendidikan Agama dan Budi Pekerti"],
    ["Matematika", "Seni Budaya dan Prakarya"],
    ["Bahasa Inggris", "Informatika"],
    ["Ilmu Pengetahuan Alam", "Pendidikan Pancasila"],
    ["Ilmu Pengetahuan Sosial", "Muatan Lokal (Bahasa Daerah)"],
    ["PJOK", "Pendidikan Anti Korupsi (PAK)"]
];
const DEFAULT_WAKTU_SESI = ["07.30 - 09.30", "10.00 - 11.30"];

function pengawasPair(dayIdx, sesiIdx, roomIdx) {
    const n = PENGAWAS_POOL.length;
    const base = (dayIdx * 3 + sesiIdx * 5 + roomIdx * 2) % n;
    return [PENGAWAS_POOL[base], PENGAWAS_POOL[(base + 1) % n]];
}

function buildDefaultSchedule(jumlahRuang, startIso) {
    const days = schoolDaysFrom(startIso, DEFAULT_MAPEL_HARIAN.length);
    return DEFAULT_MAPEL_HARIAN.map((mapels, dIdx) => ({
        hari: days[dIdx] ? NAMA_HARI[days[dIdx].getDay()] : "",
        tanggal: days[dIdx] ? formatTanggal(days[dIdx]) : "",
        sesi: mapels.map((mapel, sIdx) => ({
            waktu: DEFAULT_WAKTU_SESI[sIdx],
            mapel,
            pengawas: Array.from({ length: jumlahRuang }, (_, rIdx) => pengawasPair(dIdx, sIdx, rIdx))
        }))
    }));
}

function buildDefaultRoster(schedule) {
    return schedule.map((d, i) => ({
        hari: d.hari,
        guru: Array.from({ length: 10 }, (_, k) => k < 8 ? PENGAWAS_POOL[(i + k) % PENGAWAS_POOL.length] : "")
    }));
}

const DEFAULT_MAKEUP_MAPEL = [
    "PAI & Budi Pekerti / Bahasa Indonesia", "Matematika / Pendidikan Pancasila", "IPA / Bahasa Inggris",
    "IPS / PJOK", "Informatika / Seni Budaya & Prakarya", "Bahasa Daerah / PAK"
];
function buildDefaultMakeup(startIso) {
    const days = schoolDaysFrom(startIso, DEFAULT_MAKEUP_MAPEL.length);
    return DEFAULT_MAKEUP_MAPEL.map((mapel, i) => {
        const d = days[i];
        const pendek = d ? `${NAMA_HARI[d.getDay()]}, ${d.getDate()} ${NAMA_BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}` : "";
        return { hariTanggal: pendek, waktu: "07.30 - 09.00 & 09.30 - 11.00", mapel, ruang: "Ruang Susulan", pengawas: PENGAWAS_POOL[i % PENGAWAS_POOL.length] };
    });
}

// Butir "Tugas Pengawas Ruang" pada Lampiran III SK (satu butir per baris, bisa diubah di tab Jadwal & Pengawas)
const DEFAULT_TUGAS_PENGAWAS = [
    "Hadir di lokasi paling lambat 30 menit sebelum asesmen dimulai dan menandatangani daftar hadir pengawas.",
    "Menerima amplop naskah soal dan lembar jawaban dari panitia, lalu membukanya di dalam ruang di hadapan peserta.",
    "Memeriksa kartu peserta, mengedarkan daftar hadir peserta, dan menjaga ketertiban serta kejujuran selama asesmen berlangsung sesuai Tata Tertib.",
    "Mengisi berita acara pelaksanaan dan menyerahkan lembar jawaban beserta kelengkapan administrasi kepada panitia setelah asesmen selesai.",
    "Jadwal tugas tiap pengawas per hari, sesi, dan ruang tercantum pada Jadwal Asesmen & Pengawas Ruang."
].join("\n");

const DEFAULT_JUMLAH_RUANG = 3;
const INITIAL_SCHEDULE = buildDefaultSchedule(DEFAULT_JUMLAH_RUANG, ASSESSMENT_PRESETS.ASAS.startDate);
const INITIAL_DAILY_ROSTER = buildDefaultRoster(INITIAL_SCHEDULE);
const INITIAL_MAKEUP_SCHEDULE = buildDefaultMakeup(ASSESSMENT_PRESETS.ASAS.makeupStart);

// Daftar Guru Pengawas: sumber nama untuk "Bagi Pengawas Otomatis" (aktif = ikut dibagi tugas mengawas)
const INITIAL_GURU_PENGAWAS = PENGAWAS_POOL.map(nama => {
    const c = INITIAL_COMMITTEE.find(x => x.nama === nama);
    return { nama, nip: c ? c.nip : '', jabatan: c ? c.jabatanDinas : 'Guru', aktif: true };
});

const INITIAL_BUDGET = [
    { uraian: "Penggandaan Naskah Soal dan Lembar Jawaban (LJK)", volume: "12 Pak", qty: 12, harga: 85000 },
    { uraian: "Penyusunan Berkas Administrasi, Kartu Peserta, & Nomor Meja", volume: "1 Paket", qty: 1, harga: 350000 },
    { uraian: "Pengadaan Alat Tulis Kantor (Kertas, Amplop Naskah, Label)", volume: "1 Paket", qty: 1, harga: 275000 },
    { uraian: "Konsumsi Panitia dan Pengawas Ruang (6 Hari)", volume: "10 Orang", qty: 10, harga: 120000 },
    { uraian: "Honorarium Kepanitiaan dan Pengawasan (Sesuai Ketentuan BOSP)", volume: "10 Orang", qty: 10, harga: 150000 }
];

// ============================================================================
// 4. KONFIGURASI UKURAN & TEMA WARNA
// ============================================================================
const CARD_SIZES = {
    id1: { id: 'id1', name: 'Standar ID-1 (KTP/ATM)', widthCm: 8.56, heightCm: 5.4, fontScale: 0.96 },
    custom: { id: 'custom', name: 'Standar Custom', widthCm: 8.0, heightCm: 5.3, fontScale: 1.0 },
    b2: { id: 'b2', name: 'Kantong Plastik B2', widthCm: 10.5, heightCm: 6.5, fontScale: 1.16 }
};

const PAPER_SIZES = {
    A4: { id: 'A4', name: 'A4', widthCm: 21.0, heightCm: 29.7, marginXCm: 0.4, marginYCm: 0.5 },
    F4: { id: 'F4', name: 'Folio / F4', widthCm: 21.5, heightCm: 33.0, marginXCm: 0.3, marginYCm: 0.5 }
};

const THEMES = {
    klasik: {
        id: 'klasik', name: 'Klasik Putih Resmi',
        borderColor: '#1e293b', headerBg: '#ffffff', headerText: '#0f172a', schoolText: '#0f172a',
        lineColor: '#0f172a', bannerBg: 'transparent', bannerText: '#0f172a', cardBg: '#ffffff', accentBadge: '#f8fafc'
    },
    biru: {
        id: 'biru', name: 'Biru Kemendikbud',
        borderColor: '#1e40af', headerBg: '#eff6ff', headerText: '#1e3a8a', schoolText: '#1d4ed8',
        lineColor: '#1e40af', bannerBg: '#1d4ed8', bannerText: '#ffffff', cardBg: '#ffffff', accentBadge: '#dbeafe'
    },
    hijau: {
        id: 'hijau', name: 'Hijau Daerah',
        borderColor: '#065f46', headerBg: '#ecfdf5', headerText: '#064e3b', schoolText: '#047857',
        lineColor: '#065f46', bannerBg: '#047857', bannerText: '#ffffff', cardBg: '#ffffff', accentBadge: '#d1fae5'
    },
    emas: {
        id: 'emas', name: 'Kuning Emas Akademik',
        borderColor: '#92400e', headerBg: '#fffbeb', headerText: '#78350f', schoolText: '#b45309',
        lineColor: '#92400e', bannerBg: '#b45309', bannerText: '#ffffff', cardBg: '#ffffff', accentBadge: '#fef3c7'
    }
};
