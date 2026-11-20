/* ===================================================================
   DASHBOARD KURSUS — app.js
   Logik utama: fetch data, render semua modul, navigasi tab
   =================================================================== */

// ── STATE ────────────────────────────────────────────────────────────
let appData = {
  courses:     [],
  slides:      [],
  assignments: [],
  gallery:     [],
  padlet:      [],
};

let activeCluster   = null;
let activeCourse    = null;
let activeContent   = 'slides';

// ── UTILS ────────────────────────────────────────────────────────────

/**
 * Parse CSV string kepada array of objects.
 * Baris pertama adalah header.
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = parseCSVRow(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseCSVRow(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim().toLowerCase().replace(/\s+/g, '_')] = (vals[i] || '').trim();
    });
    return obj;
  }).filter(row => Object.values(row).some(v => v !== ''));
}

/**
 * Parse satu baris CSV dengan sokongan quoted fields.
 */
function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * Fetch satu tab Google Sheets sebagai CSV, return array of objects.
 * Jika gagal, return array kosong (guna sample data).
 */
async function fetchSheetCSV(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Fetch failed');
    const text = await res.text();
    return parseCSV(text);
  } catch (e) {
    console.warn('Gagal fetch Sheets:', url, e.message);
    return null;
  }
}

// ── DATA LOADING ─────────────────────────────────────────────────────

async function loadData() {
  showLoading(true);

  const isConfigured = SHEET_ID !== 'MASUKKAN_SHEET_ID_ANDA_DI_SINI';

  if (isConfigured) {
    // Fetch semua tab Google Sheets secara selari
    const [courses, slides, assignments, gallery, padlet] = await Promise.all([
      fetchSheetCSV(SHEETS_CONFIG.courses),
      fetchSheetCSV(SHEETS_CONFIG.slides),
      fetchSheetCSV(SHEETS_CONFIG.assignments),
      fetchSheetCSV(SHEETS_CONFIG.gallery),
      fetchSheetCSV(SHEETS_CONFIG.padlet),
    ]);

    appData.courses     = courses     || SAMPLE_DATA.courses;
    appData.slides      = slides      || [];
    appData.assignments = assignments || [];
    appData.gallery     = gallery     || [];
    appData.padlet      = padlet      || [];
  } else {
    // Guna sample data
    appData.courses     = SAMPLE_DATA.courses;
    appData.slides      = [];
    appData.assignments = [];
    appData.gallery     = [];
    appData.padlet      = [];
  }

  showLoading(false);
  renderApp();
}

// ── RENDER APP ───────────────────────────────────────────────────────

function renderApp() {
  renderStats();
  renderClusterTabs();

  // Pilih kluster pertama secara default
  const firstCluster = Object.keys(CLUSTERS)[0];
  selectCluster(firstCluster);
}

// ── STATS ────────────────────────────────────────────────────────────

function renderStats() {
  const totalCourses = appData.courses.length;

  // Kira bilangan kursus per kluster
  const countByCluster = {};
  appData.courses.forEach(c => {
    countByCluster[c.cluster_id] = (countByCluster[c.cluster_id] || 0) + 1;
  });

  const colorClass = { '1': 'blue', '2': 'maroon', '3': 'navy' };
  const numberClass = { '1': '', '2': 'maroon', '3': 'navy' };

  let cardsHTML = Object.entries(CLUSTERS).map(([id, cl]) => `
    <div class="stat-card">
      <div class="stat-icon ${colorClass[id]}">${cl.icon}</div>
      <div>
        <div class="stat-number ${numberClass[id]}">${countByCluster[id] || 0}</div>
        <div class="stat-label">${cl.name}</div>
      </div>
    </div>
  `).join('');

  // Tambah kad jumlah
  cardsHTML += `
    <div class="stat-card">
      <div class="stat-icon total">🎓</div>
      <div>
        <div class="stat-number total">${totalCourses}</div>
        <div class="stat-label">Jumlah Keseluruhan Kursus</div>
      </div>
    </div>
  `;

  document.getElementById('stats-grid').innerHTML = cardsHTML;
}

// ── CLUSTER TABS ─────────────────────────────────────────────────────

function renderClusterTabs() {
  const nav = document.getElementById('cluster-nav');
  nav.innerHTML = Object.entries(CLUSTERS).map(([id, cl]) => `
    <button class="cluster-tab" data-cluster="${id}" onclick="selectCluster('${id}')">
      ${cl.icon} ${cl.name}
    </button>
  `).join('');
}

function selectCluster(clusterId) {
  activeCluster = clusterId;

  // Kemaskini active tab
  document.querySelectorAll('.cluster-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.cluster === clusterId);
  });

  renderCourseTabs(clusterId);
}

// ── COURSE TABS ──────────────────────────────────────────────────────

function renderCourseTabs(clusterId) {
  const courses = appData.courses.filter(c => c.cluster_id === clusterId);
  const nav = document.getElementById('course-nav');

  if (courses.length === 0) {
    nav.innerHTML = '';
    document.getElementById('content-area').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📂</div>
        <div class="empty-state-title">Tiada kursus dalam kluster ini</div>
        <div class="empty-state-desc">Tambah kursus dalam tab <strong>Courses</strong> Google Sheets anda.</div>
      </div>`;
    return;
  }

  nav.innerHTML = courses.map((c, i) => `
    <button class="course-tab" data-course="${c.id}" onclick="selectCourse('${c.id}')">
      ${c.course_title}
    </button>
  `).join('');

  // Pilih kursus pertama
  selectCourse(courses[0].id);
}

function selectCourse(courseId) {
  activeCourse = courseId;

  document.querySelectorAll('.course-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.course === courseId);
  });

  renderContentArea(courseId);
}

// ── CONTENT AREA ─────────────────────────────────────────────────────

function renderContentArea(courseId) {
  const area = document.getElementById('content-area');
  area.innerHTML = `
    <div class="content-tabs">
      <button class="content-tab active" data-tab="slides"      onclick="switchTab('slides')">📑 Slaid</button>
      <button class="content-tab"        data-tab="assignments" onclick="switchTab('assignments')">📝 Tugasan</button>
      <button class="content-tab"        data-tab="gallery"     onclick="switchTab('gallery')">🖼️ Galeri</button>
      <button class="content-tab"        data-tab="padlet"      onclick="switchTab('padlet')">🗒️ Padlet</button>
    </div>
    <div id="tab-slides"      class="tab-panel active">${renderSlides(courseId)}</div>
    <div id="tab-assignments" class="tab-panel">${renderAssignments(courseId)}</div>
    <div id="tab-gallery"     class="tab-panel">${renderGallery(courseId)}</div>
    <div id="tab-padlet"      class="tab-panel">${renderPadlet(courseId)}</div>
  `;
  activeContent = 'slides';
}

function switchTab(tabName) {
  activeContent = tabName;
  document.querySelectorAll('.content-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === `tab-${tabName}`);
  });
}

// ── SLIDES ───────────────────────────────────────────────────────────

function renderSlides(courseId) {
  const slide = appData.slides.find(s => s.course_id === courseId);

  if (!slide || !slide.embed_url) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📑</div>
        <div class="empty-state-title">Tiada slaid buat masa ini</div>
        <div class="empty-state-desc">Instructor akan muat naik slaid tidak lama lagi.</div>
      </div>`;
  }

  return `
    <div class="slide-container">
      <iframe src="${escapeAttr(slide.embed_url)}"
              allowfullscreen
              loading="lazy"
              title="Slaid Kursus"></iframe>
    </div>
    <div class="slide-actions">
      <a href="${escapeAttr(slide.view_url || slide.embed_url)}"
         target="_blank" rel="noopener" class="btn btn-outline">
        ↗ Buka di Canva
      </a>
    </div>`;
}

// ── ASSIGNMENTS ──────────────────────────────────────────────────────

function renderAssignments(courseId) {
  const list = appData.assignments.filter(a => a.course_id === courseId);

  if (list.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-title">Tiada tugasan buat masa ini</div>
        <div class="empty-state-desc">Tugasan akan dikemaskini oleh instructor.</div>
      </div>`;
  }

  const cards = list.map(a => `
    <div class="assignment-card">
      <div class="assignment-icon">📄</div>
      <div class="assignment-info">
        <div class="assignment-title">${escapeHTML(a.title)}</div>
        ${a.description ? `<div class="assignment-desc">${escapeHTML(a.description)}</div>` : ''}
        ${a.due_date ? `<span class="assignment-due">📅 Tarikh Akhir: ${escapeHTML(a.due_date)}</span>` : ''}
      </div>
      <div class="assignment-actions">
        ${a.drive_file_id ? `
          <button class="btn btn-primary" onclick="openPDFModal('${escapeAttr(a.drive_file_id)}','${escapeAttr(a.title)}')">
            👁 Lihat PDF
          </button>
          <a href="https://drive.google.com/uc?export=download&id=${escapeAttr(a.drive_file_id)}"
             target="_blank" rel="noopener" class="btn btn-accent">
            ⬇ Muat Turun
          </a>` : ''}
      </div>
    </div>
  `).join('');

  return `<div class="assignment-list">${cards}</div>`;
}

// ── GALLERY ──────────────────────────────────────────────────────────

function renderGallery(courseId) {
  const list = appData.gallery.filter(g => g.course_id === courseId);

  if (list.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🖼️</div>
        <div class="empty-state-title">Tiada galeri buat masa ini</div>
        <div class="empty-state-desc">Gambar aktiviti kursus akan dikemaskini oleh instructor.</div>
      </div>`;
  }

  const cards = list.map(g => `
    <div class="gallery-card">
      <img class="gallery-thumb"
           src="${escapeAttr(g.thumbnail_url)}"
           alt="${escapeAttr(g.album_title)}"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 140%22><rect width=%22200%22 height=%22140%22 fill=%22%23e2e8f0%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2232%22>🖼️</text></svg>'">
      <div class="gallery-info">
        <div class="gallery-title">${escapeHTML(g.album_title)}</div>
        ${g.album_date ? `<div class="gallery-date">📅 ${escapeHTML(g.album_date)}</div>` : ''}
        <a href="${escapeAttr(g.album_url)}" target="_blank" rel="noopener" class="gallery-btn">
          📸 Buka Galeri
        </a>
      </div>
    </div>
  `).join('');

  return `<div class="gallery-grid">${cards}</div>`;
}

// ── PADLET ───────────────────────────────────────────────────────────

function renderPadlet(courseId) {
  const item = appData.padlet.find(p => p.course_id === courseId);

  if (!item || !item.embed_code) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🗒️</div>
        <div class="empty-state-title">Tiada Padlet buat masa ini</div>
        <div class="empty-state-desc">Padlet aktiviti akan dikemaskini oleh instructor.</div>
      </div>`;
  }

  // Extract src URL dari embed code untuk butang "Buka Padlet"
  const srcMatch = item.embed_code.match(/src=["']([^"']+)["']/);
  const padletUrl = srcMatch ? srcMatch[1].replace('/embed/', '/') : '#';

  // Sanitize: hanya benarkan iframe tag
  const sanitized = item.embed_code.replace(/<(?!\/?(iframe)[\s>])/gi, '&lt;');

  return `
    <div class="padlet-container">${sanitized}</div>
    <div class="padlet-actions">
      <a href="${escapeAttr(padletUrl)}" target="_blank" rel="noopener" class="btn btn-outline">
        ↗ Buka Padlet
      </a>
    </div>`;
}

// ── PDF MODAL ────────────────────────────────────────────────────────

function openPDFModal(fileId, title) {
  const modal = document.getElementById('pdf-modal');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-iframe').src =
    `https://drive.google.com/file/d/${fileId}/preview`;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePDFModal() {
  const modal = document.getElementById('pdf-modal');
  modal.classList.remove('open');
  document.getElementById('modal-iframe').src = '';
  document.body.style.overflow = '';
}

// Tutup modal bila klik luar
document.addEventListener('click', e => {
  if (e.target.id === 'pdf-modal') closePDFModal();
});

// ── LOADING ──────────────────────────────────────────────────────────

function showLoading(show) {
  document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
}

// ── SECURITY HELPERS ─────────────────────────────────────────────────

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return String(str)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── LIVE CLOCK & DATE ────────────────────────────────────────────────

const HARI = ['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'];
const BULAN = ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogos','Sep','Okt','Nov','Dis'];

function updateClock() {
  const now = new Date();

  // Masa — HH:MM:SS
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  const ss = now.getSeconds().toString().padStart(2, '0');
  const timeEl = document.getElementById('live-time');
  if (timeEl) timeEl.textContent = `${hh}:${mm}:${ss}`;

  // Tarikh — Hari, DD Bulan YYYY
  const hari  = HARI[now.getDay()];
  const dd    = now.getDate();
  const bulan = BULAN[now.getMonth()];
  const yyyy  = now.getFullYear();
  const dateEl = document.getElementById('live-date');
  if (dateEl) dateEl.textContent = `${hari}, ${dd} ${bulan} ${yyyy}`;
}

// ── INIT ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footer-name').textContent = INSTRUCTOR.name;
  document.getElementById('footer-org').textContent  = INSTRUCTOR.org  || '';
  document.getElementById('footer-year').textContent = INSTRUCTOR.year;

  // Mulakan jam langsung
  updateClock();
  setInterval(updateClock, 1000);

  loadData();
});

// ── WHATSAPP CHAT WIDGET ─────────────────────────────────────────────

let waOpen = false;
let waNotified = false;

function toggleWAChat() {
  waOpen = !waOpen;
  const panel = document.getElementById('wa-panel');
  const notif = document.getElementById('wa-notification');

  panel.classList.toggle('open', waOpen);

  // Sembunyikan notifikasi bila dibuka
  if (waOpen) {
    notif.style.display = 'none';
    waNotified = true;
    // Fokus input
    setTimeout(() => {
      const input = document.getElementById('wa-input');
      if (input) input.focus();
    }, 300);
  }
}

function openWhatsApp() {
  const input = document.getElementById('wa-input');
  const userMsg = input ? input.value.trim() : '';
  const msg = userMsg
    ? `Assalamualaikum Madam Mir, ${userMsg}`
    : WA_DEFAULT_MSG;

  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank', 'noopener,noreferrer');

  // Tambah bubble mesej pengguna dalam panel
  if (input && userMsg) {
    addUserBubble(userMsg);
    input.value = '';
  }
}

function addUserBubble(text) {
  const body = document.querySelector('.wa-panel-body');
  if (!body) return;

  const now = new Date();
  const time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');

  const bubble = document.createElement('div');
  bubble.className = 'wa-bubble wa-bubble-out';
  bubble.innerHTML = `
    <div class="wa-bubble-text">${escapeHTML(text)}</div>
    <div class="wa-bubble-time">${time} ✓✓</div>
  `;
  body.appendChild(bubble);
  body.scrollTop = body.scrollHeight;

  // Tambah mesej balas automatik
  setTimeout(() => {
    const reply = document.createElement('div');
    reply.className = 'wa-bubble wa-bubble-in';
    reply.innerHTML = `
      <div class="wa-bubble-text">Terima kasih! Mesej anda telah dihantar kepada Madam Mir melalui WhatsApp. 📱</div>
      <div class="wa-bubble-time">Madam Mir</div>
    `;
    body.appendChild(reply);
    body.scrollTop = body.scrollHeight;
  }, 800);
}

// Tunjuk notifikasi selepas 3 saat jika belum buka
setTimeout(() => {
  if (!waNotified) {
    const notif = document.getElementById('wa-notification');
    if (notif) notif.style.display = 'flex';
  }
}, 3000);
