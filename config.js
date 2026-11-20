// ============================================================
//  KONFIGURASI DASHBOARD KURSUS
//  Tukar SHEET_ID kepada ID Google Sheets anda
//  Cara dapatkan SHEET_ID: buka Google Sheets → lihat URL
//  https://docs.google.com/spreadsheets/d/SHEET_ID/edit
// ============================================================

const SHEET_ID = 'MASUKKAN_SHEET_ID_ANDA_DI_SINI';

// URL CSV untuk setiap tab Google Sheets
const SHEETS_CONFIG = {
  courses:     `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Courses`,
  slides:      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Slides`,
  assignments: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Assignments`,
  gallery:     `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Gallery`,
  padlet:      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Padlet`,
};

// Maklumat Instructor
const INSTRUCTOR = {
  name:   'Puan Mira Faizura binti Narawi',
  title:  'DASHBOARD PROGRAM PSH MADAM MIR',
  org:    'Kolej Komuniti Santubong',
  year:   new Date().getFullYear(),
};

// WhatsApp — tukar kepada nombor Madam Mir (format: kod negara + nombor, tanpa +)
// Contoh: 60123456789
const WA_NUMBER = '60123456789';
const WA_DEFAULT_MSG = 'Assalamualaikum Madam Mir, saya ingin bertanya tentang kursus.';

// Kluster kursus (warna & ikon)
const CLUSTERS = {
  '1': { name: 'Komputer & Teknologi Maklumat', icon: '💻', color: '#4169E1' },
  '2': { name: 'Grafik & Multimedia',           icon: '🎨', color: '#800020' },
  '3': { name: 'Pembangunan Diri & Motivasi',   icon: '🌟', color: '#2a4fc4' },
};

// Data contoh (digunakan jika Google Sheets belum dikonfigurasi)
const SAMPLE_DATA = {
  courses: [
    { id: '1', cluster_id: '1', course_title: 'Asas Microsoft Excel' },
    { id: '2', cluster_id: '1', course_title: 'Asas Microsoft Word' },
    { id: '3', cluster_id: '2', course_title: 'Reka Bentuk Grafik Canva' },
    { id: '4', cluster_id: '2', course_title: 'Fotografi Asas' },
    { id: '5', cluster_id: '3', course_title: 'Kemahiran Komunikasi' },
  ],
  slides: [
    // Nota: link pendek Canva tidak boleh diembed terus
    // Gunakan link penuh dari Share → Copy link di Canva untuk embed berfungsi
    // Contoh link penuh: https://www.canva.com/design/DAGXxxxxxx/view
    { course_id: '3', embed_url: '', view_url: 'https://canva.link/canva-ai-untuk-bahan-digital-pdp' },
  ],
};
