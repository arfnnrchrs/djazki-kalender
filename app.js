import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =========================================================================
// 1. KONFIGURASI SUPABASE (GANTI DENGAN URL & ANON KEY PROYEK SUPABASE-MU)
// =========================================================================
const SUPABASE_URL = 'https://gdmuvnoilqgpkzagklfq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YjPgY5_BZq8mojdqDKFVvw_Z6ih7kkA';

const isConfigured =
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('GANTI-DENGAN') &&
  !SUPABASE_ANON_KEY.includes('GANTI-DENGAN');

const supabase = isConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// =========================================================================
// 2. DATA 9 BIDANG ORGANISASI & IDENTITAS WARNA
// =========================================================================
const BIDANG_LIST = [
  { id: 'PU',       name: 'PU (Pimpinan Umum)',           color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.16)',  border: 'rgba(59, 130, 246, 0.45)' },
  { id: 'Medkom',   name: 'Medkom',                       color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.16)',   border: 'rgba(6, 182, 212, 0.45)' },
  { id: 'Bider',    name: 'Bider (Pembinaan Kader)',      color: '#10b981', bg: 'rgba(16, 185, 129, 0.16)',  border: 'rgba(16, 185, 129, 0.45)' },
  { id: 'Ristek',   name: 'Ristek (Riset & Teknologi)',   color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.16)',  border: 'rgba(139, 92, 246, 0.45)' },
  { id: 'SPM',      name: 'SPM (Sosial & Pemberdayaan)',  color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.16)',  border: 'rgba(245, 158, 11, 0.45)' },
  { id: 'Bidor',    name: 'Bidor (Bidang Organisasi)',    color: '#f97316', bg: 'rgba(249, 115, 22, 0.16)',  border: 'rgba(249, 115, 22, 0.45)' },
  { id: 'Hikmah',   name: 'Hikmah',                       color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.16)',   border: 'rgba(244, 63, 94, 0.45)' },
  { id: 'Immawati', name: 'Immawati',                     color: '#ec4899', bg: 'rgba(236, 72, 153, 0.16)',  border: 'rgba(236, 72, 153, 0.45)' },
  { id: 'Tabligh',  name: 'Tabligh',                      color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.16)',  border: 'rgba(20, 184, 166, 0.45)' },
];

const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const HARI_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// =========================================================================
// 3. STATE APLIKASI
// =========================================================================
const today = new Date();
const state = {
  currentMonth: today.getMonth(),
  currentYear: today.getFullYear(),
  selectedDate: formatDateISO(today),
  activeBidang: localStorage.getItem('org_active_bidang') || 'PU',
  searchQuery: '',
  filterListBidang: 'ALL',
  events: [],
};

// =========================================================================
// 4. UTILITAS (TANGGAL, KEAMANAN SHA-256, SANITASI HTML)
// =========================================================================
function formatDateISO(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateISO(isoStr) {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatReadableDate(isoStr) {
  const d = parseDateISO(isoStr);
  return `${HARI_ID[d.getDay()]}, ${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function calculateDuration(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) return 'Selesai';
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0 && mins > 0) return `${hours} jam ${mins} mnt`;
  if (hours > 0) return `${hours} jam`;
  return `${mins} mnt`;
}

function escapeHTML(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getBidangMeta(bidangId) {
  return BIDANG_LIST.find((b) => b.id === bidangId) || BIDANG_LIST[0];
}

// Hash PIN menggunakan SHA-256 sebelum dikirim ke database
async function hashPin(pin) {
  const data = new TextEncoder().encode(String(pin).trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 transition-all duration-300 text-xs sm:text-sm font-medium px-4 py-3 rounded-2xl shadow-xl border ${
    isError
      ? 'bg-rose-950/95 border-rose-700 text-rose-100'
      : 'bg-slate-800/95 border-slate-700 text-white'
  }`;
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-10');
  }, 3200);
}

// =========================================================================
// 5. KONEKSI DATABASE SUPABASE & REAL-TIME SUBSCRIPTION
// =========================================================================
async function fetchEvents() {
  if (!supabase) {
    document.getElementById('configBanner').classList.remove('hidden');
    renderAll();
    return;
  }

  const { data, error } = await supabase
    .from('proker')
    .select('id, title, event_date, start_time, end_time, bidang, location, note, created_at')
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error(error);
    showToast('Gagal memuat jadwal dari server.', true);
    return;
  }

  state.events = data || [];
  renderAll();
}

function setupRealtime() {
  if (!supabase) return;

  supabase
    .channel('proker-live-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'proker' },
      () => {
        fetchEvents();
      }
    )
    .subscribe();
}

// =========================================================================
// 6. RENDER ANTARMUKA (KALENDER, PANEL SCHEDULED, AGENDA, STATISTIK)
// =========================================================================
function initSelectors() {
  const activeSelect = document.getElementById('activeBidangSelect');
  const modalSelect = document.getElementById('bidangInput');
  const filterSelect = document.getElementById('filterBidangList');
  const legendEl = document.getElementById('bidangLegend');

  BIDANG_LIST.forEach((b) => {
    activeSelect.add(new Option(`Bidang: ${b.id}`, b.id));
    modalSelect.add(new Option(b.name, b.id));
    filterSelect.add(new Option(b.name, b.id));

    const chip = document.createElement('span');
    chip.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border';
    chip.style.backgroundColor = b.bg;
    chip.style.borderColor = b.border;
    chip.style.color = '#f1f5f9';
    chip.innerHTML = `<span class="w-2 h-2 rounded-full" style="background:${b.color}"></span>${b.id}`;
    legendEl.appendChild(chip);
  });

  activeSelect.value = state.activeBidang;
  updateIdentityUI();

  // Bulan & Tahun
  const monthSelect = document.getElementById('monthSelect');
  BULAN_ID.forEach((m, idx) => monthSelect.add(new Option(m, idx)));
  monthSelect.value = state.currentMonth;

  const yearSelect = document.getElementById('yearSelect');
  for (let y = today.getFullYear() - 1; y <= today.getFullYear() + 3; y++) {
    yearSelect.add(new Option(y, y));
  }
  yearSelect.value = state.currentYear;
}

function updateIdentityUI() {
  const meta = getBidangMeta(state.activeBidang);
  const hour = new Date().getHours();
  const sapa = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';

  document.getElementById('greetingText').textContent = `${sapa}, ${meta.id}!`;
  const avatar = document.getElementById('sidebarAvatar');
  avatar.textContent = meta.id.slice(0, 3).toUpperCase();
  avatar.style.backgroundColor = meta.color;
}

function getFilteredEvents() {
  const q = state.searchQuery.trim().toLowerCase();
  if (!q) return state.events;
  return state.events.filter(
    (ev) =>
      ev.title.toLowerCase().includes(q) ||
      ev.bidang.toLowerCase().includes(q) ||
      (ev.location && ev.location.toLowerCase().includes(q)) ||
      (ev.note && ev.note.toLowerCase().includes(q))
  );
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  document.getElementById('monthSelect').value = state.currentMonth;
  document.getElementById('yearSelect').value = state.currentYear;

  const firstDay = new Date(state.currentYear, state.currentMonth, 1).getDay();
  const daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(state.currentYear, state.currentMonth, 0).getDate();
  const todayISO = formatDateISO(today);
  const filteredEvents = getFilteredEvents();

  // Total 35 atau 42 sel agar rapi
  const totalCells = firstDay + daysInMonth > 35 ? 42 : 35;

  for (let i = 0; i < totalCells; i++) {
    let dayNum, cellMonth = state.currentMonth, cellYear = state.currentYear, isOtherMonth = false;

    if (i < firstDay) {
      dayNum = prevMonthDays - firstDay + i + 1;
      cellMonth = state.currentMonth - 1;
      if (cellMonth < 0) { cellMonth = 11; cellYear--; }
      isOtherMonth = true;
    } else if (i >= firstDay + daysInMonth) {
      dayNum = i - (firstDay + daysInMonth) + 1;
      cellMonth = state.currentMonth + 1;
      if (cellMonth > 11) { cellMonth = 0; cellYear++; }
      isOtherMonth = true;
    } else {
      dayNum = i - firstDay + 1;
    }

    const cellISO = formatDateISO(new Date(cellYear, cellMonth, dayNum));
    const isSelected = cellISO === state.selectedDate;
    const isToday = cellISO === todayISO;
    const dayEvents = filteredEvents.filter((e) => e.event_date === cellISO);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `min-h-[62px] sm:min-h-[96px] p-1.5 sm:p-2.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer relative overflow-hidden ${
      isSelected
        ? 'active-date-glow border-blue-400 text-white'
        : isOtherMonth
        ? 'bg-base/40 border-borderSubtle/40 text-slate-600 hover:bg-card/50'
        : 'bg-card/75 hover:bg-cardHover border-borderSubtle/80 text-slate-200'
    }`;

    // Header Nomor Tanggal
    const topRow = document.createElement('div');
    topRow.className = 'flex items-center justify-between w-full';
    topRow.innerHTML = `
      <span class="text-xs sm:text-sm font-bold ${
        isSelected ? 'text-white' : isToday ? 'text-blue-400 underline decoration-2 underline-offset-4' : ''
      }">${dayNum}</span>
      ${
        dayEvents.length > 0
          ? `<span class="hidden sm:inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
              isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
            }">${dayEvents.length}</span>`
          : ''
      }
    `;
    btn.appendChild(topRow);

    // Indikator Agenda: Titik warna di Mobile, Pill Judul di Desktop
    if (dayEvents.length > 0) {
      // Mobile Dots
      const mobileDots = document.createElement('div');
      mobileDots.className = 'flex sm:hidden flex-wrap gap-1 mt-1';
      dayEvents.slice(0, 4).forEach((ev) => {
        const meta = getBidangMeta(ev.bidang);
        const dot = document.createElement('span');
        dot.className = 'w-1.5 h-1.5 rounded-full';
        dot.style.backgroundColor = isSelected ? '#ffffff' : meta.color;
        mobileDots.appendChild(dot);
      });
      btn.appendChild(mobileDots);

      // Desktop Event Pills
      const desktopList = document.createElement('div');
      desktopList.className = 'hidden sm:flex flex-col gap-1 w-full mt-1.5';
      dayEvents.slice(0, 2).forEach((ev) => {
        const meta = getBidangMeta(ev.bidang);
        const pill = document.createElement('div');
        pill.className = 'text-[11px] font-medium truncate px-1.5 py-0.5 rounded-md border-l-2';
        pill.style.borderLeftColor = isSelected ? '#ffffff' : meta.color;
        pill.style.backgroundColor = isSelected ? 'rgba(255,255,255,0.16)' : 'rgba(15, 23, 42, 0.65)';
        pill.textContent = ev.title;
        desktopList.appendChild(pill);
      });
      if (dayEvents.length > 2) {
        const more = document.createElement('span');
        more.className = `text-[10px] font-semibold pl-1 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`;
        more.textContent = `+${dayEvents.length - 2} lainnya`;
        desktopList.appendChild(more);
      }
      btn.appendChild(desktopList);
    }

    btn.addEventListener('click', () => {
      state.selectedDate = cellISO;
      if (isOtherMonth) {
        state.currentMonth = cellMonth;
        state.currentYear = cellYear;
      }
      renderCalendar();
      renderScheduledPanel();
    });

    grid.appendChild(btn);
  }
}

function createEventCard(ev, showDateBadge = false) {
  const meta = getBidangMeta(ev.bidang);
  const duration = calculateDuration(ev.start_time, ev.end_time);

  const card = document.createElement('div');
  card.className = 'bg-card border border-borderSubtle rounded-2xl p-4 relative overflow-hidden hover:border-slate-500/70 transition';

  const isUrl = ev.location && /^https?:\/\//i.test(ev.location.trim());
  const locationHTML = ev.location
    ? isUrl
      ? `<a href="${escapeHTML(ev.location.trim())}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:underline mt-2">📍 Buka Link Meeting ↗</a>`
      : `<div class="inline-flex items-center gap-1 text-[11px] text-slate-300 bg-base/80 px-2.5 py-1 rounded-lg mt-2">📍 ${escapeHTML(ev.location)}</div>`
    : '';

  card.innerHTML = `
    <!-- Garis Warna Penanggung Jawab -->
    <div class="h-1.5 w-full rounded-full mb-3" style="background-color: ${meta.color}"></div>

    <div class="flex items-start justify-between gap-2">
      <div>
        ${showDateBadge ? `<span class="inline-block text-[11px] font-semibold text-blue-400 mb-1">${formatReadableDate(ev.event_date)}</span>` : ''}
        <h3 class="text-sm sm:text-base font-bold text-white leading-snug">${escapeHTML(ev.title)}</h3>
      </div>

      <div class="flex items-center gap-1 shrink-0">
        <button data-action="edit" class="p-1.5 rounded-lg bg-base/70 hover:bg-blue-600/30 text-slate-400 hover:text-blue-300 transition cursor-pointer" title="Edit Proker (Butuh PIN)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
        </button>
        <button data-action="delete" class="p-1.5 rounded-lg bg-base/70 hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 transition cursor-pointer" title="Hapus Proker (Butuh PIN)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>

    ${ev.note ? `<p class="text-xs text-slate-400 mt-1.5 leading-relaxed">${escapeHTML(ev.note)}</p>` : ''}

    <div class="flex items-center justify-between text-xs text-slate-300 mt-3 pt-2.5 border-t border-borderSubtle/60">
      <span class="inline-flex items-center gap-1.5 font-medium">
        🕒 ${escapeHTML(ev.start_time)} – ${escapeHTML(ev.end_time)}
      </span>
      <span class="text-[11px] text-slate-400 font-medium">${duration}</span>
    </div>

    ${locationHTML}

    <div class="flex items-center gap-2 mt-3 pt-2.5 border-t border-borderSubtle/60">
      <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style="background-color: ${meta.color}">
        ${meta.id.slice(0, 2).toUpperCase()}
      </span>
      <span class="text-xs font-semibold text-slate-200">${escapeHTML(meta.name)}</span>
    </div>
  `;

  card.querySelector('[data-action="edit"]').addEventListener('click', () => openEditModal(ev));
  card.querySelector('[data-action="delete"]').addEventListener('click', () => openDeleteModal(ev));

  return card;
}

function renderScheduledPanel() {
  document.getElementById('selectedDateLabel').textContent = formatReadableDate(state.selectedDate);
  const container = document.getElementById('scheduledList');
  container.innerHTML = '';

  const dayEvents = getFilteredEvents().filter((e) => e.event_date === state.selectedDate);

  if (dayEvents.length === 0) {
    container.innerHTML = `
      <div class="border border-dashed border-borderSubtle rounded-2xl p-6 text-center my-4">
        <p class="text-sm font-semibold text-slate-300">Belum ada proker terjadwal</p>
        <p class="text-xs text-slate-400 mt-1">Klik tombol <strong>Tambah Proker</strong> untuk mengisi agenda di tanggal ini.</p>
      </div>
    `;
    return;
  }

  dayEvents.forEach((ev) => container.appendChild(createEventCard(ev, false)));
}

function renderAllEventsView() {
  const container = document.getElementById('allEventsContainer');
  container.innerHTML = '';

  const monthPrefix = `${state.currentYear}-${String(state.currentMonth + 1).padStart(2, '0')}`;
  document.getElementById('listSubtitle').textContent = `Agenda bulan ${BULAN_ID[state.currentMonth]} ${state.currentYear}`;

  let list = getFilteredEvents().filter((e) => e.event_date.startsWith(monthPrefix));
  if (state.filterListBidang !== 'ALL') {
    list = list.filter((e) => e.bidang === state.filterListBidang);
  }

  if (list.length === 0) {
    container.innerHTML = `<p class="text-sm text-slate-400 col-span-full py-8 text-center">Tidak ada proker ditemukan untuk filter ini.</p>`;
    return;
  }

  list.forEach((ev) => container.appendChild(createEventCard(ev, true)));
}

function renderStatsView() {
  const container = document.getElementById('statsContainer');
  container.innerHTML = '';
  const totalAll = state.events.length || 1;

  BIDANG_LIST.forEach((b) => {
    const count = state.events.filter((e) => e.bidang === b.id).length;
    const pct = Math.round((count / totalAll) * 100);

    const box = document.createElement('div');
    box.className = 'bg-card border border-borderSubtle rounded-2xl p-4';
    box.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white" style="background:${b.color}">${b.id.slice(0, 2).toUpperCase()}</span>
          <div>
            <h4 class="text-sm font-bold text-white">${b.name}</h4>
            <p class="text-[11px] text-slate-400">${pct}% dari total proker</p>
          </div>
        </div>
        <span class="text-xl font-bold text-white">${count}</span>
      </div>
      <div class="w-full h-2 bg-base rounded-full overflow-hidden mt-3">
        <div class="h-full rounded-full transition-all duration-500" style="width:${pct}%; background:${b.color}"></div>
      </div>
    `;
    container.appendChild(box);
  });
}

function renderAll() {
  renderCalendar();
  renderScheduledPanel();
  renderAllEventsView();
  renderStatsView();
}

// =========================================================================
// 7. MODAL TAMBAH, EDIT & HAPUS (DENGAN VALIDASI PIN)
// =========================================================================
function openAddModal() {
  document.getElementById('eventForm').reset();
  document.getElementById('eventIdInput').value = '';
  document.getElementById('modalTitle').textContent = 'Tambah Proker Baru';
  document.getElementById('dateInput').value = state.selectedDate;
  document.getElementById('bidangInput').value = state.activeBidang;
  document.getElementById('pinLabel').textContent = 'Buat PIN Keamanan (4–6 Digit Angka) *';
  document.getElementById('pinHelper').textContent = 'PIN ini wajib diingat karena hanya pemilik PIN yang dapat mengedit atau menghapus proker ini.';
  document.getElementById('pinInput').placeholder = 'Contoh: 1234';
  document.getElementById('eventModal').classList.remove('hidden');
}

function openEditModal(ev) {
  document.getElementById('eventForm').reset();
  document.getElementById('eventIdInput').value = ev.id;
  document.getElementById('modalTitle').textContent = 'Edit Proker';
  document.getElementById('titleInput').value = ev.title;
  document.getElementById('dateInput').value = ev.event_date;
  document.getElementById('bidangInput').value = ev.bidang;
  document.getElementById('startTimeInput').value = ev.start_time;
  document.getElementById('endTimeInput').value = ev.end_time;
  document.getElementById('locationInput').value = ev.location || '';
  document.getElementById('noteInput').value = ev.note || '';
  document.getElementById('pinLabel').textContent = 'Masukkan PIN Proker untuk Menyimpan Perubahan *';
  document.getElementById('pinHelper').textContent = 'Verifikasi PIN yang dibuat saat proker ini pertama kali ditambahkan.';
  document.getElementById('pinInput').placeholder = 'Masukkan PIN (4–6 digit)';
  document.getElementById('eventModal').classList.remove('hidden');
}

function openDeleteModal(ev) {
  document.getElementById('deleteForm').reset();
  document.getElementById('deleteIdInput').value = ev.id;
  document.getElementById('deleteTargetName').textContent = `Masukkan PIN untuk menghapus "${ev.title}".`;
  document.getElementById('deleteModal').classList.remove('hidden');
}

// Submit Tambah / Edit
document.getElementById('eventForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!supabase) {
    showToast('Hubungkan Supabase terlebih dahulu di app.js', true);
    return;
  }

  const saveBtn = document.getElementById('saveEventBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Menyimpan...';

  const id = document.getElementById('eventIdInput').value;
  const payload = {
    title: document.getElementById('titleInput').value.trim(),
    event_date: document.getElementById('dateInput').value,
    bidang: document.getElementById('bidangInput').value,
    start_time: document.getElementById('startTimeInput').value,
    end_time: document.getElementById('endTimeInput').value,
    location: document.getElementById('locationInput').value.trim() || null,
    note: document.getElementById('noteInput').value.trim() || null,
  };
  const rawPin = document.getElementById('pinInput').value.trim();

  try {
    const pinHash = await hashPin(rawPin);

    if (!id) {
      // INSERT BARU
      const { error } = await supabase.from('proker').insert([{ ...payload, pin_hash: pinHash }]);
      if (error) throw error;
      showToast('Proker berhasil ditambahkan!');
    } else {
      // UPDATE DENGAN VERIFIKASI PIN VIA RPC
      const { data: isSuccess, error } = await supabase.rpc('update_proker_with_pin', {
        p_id: id,
        p_pin_hash: pinHash,
        p_title: payload.title,
        p_event_date: payload.event_date,
        p_start_time: payload.start_time,
        p_end_time: payload.end_time,
        p_bidang: payload.bidang,
        p_location: payload.location,
        p_note: payload.note,
      });

      if (error) throw error;
      if (!isSuccess) {
        showToast('PIN salah! Perubahan ditolak.', true);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Simpan Proker';
        return;
      }
      showToast('Proker berhasil diperbarui!');
    }

    state.selectedDate = payload.event_date;
    const d = parseDateISO(payload.event_date);
    state.currentMonth = d.getMonth();
    state.currentYear = d.getFullYear();

    document.getElementById('eventModal').classList.add('hidden');
    await fetchEvents();
  } catch (err) {
    console.error(err);
    showToast('Terjadi kesalahan saat menyimpan data.', true);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Simpan Proker';
  }
});

// Submit Hapus
document.getElementById('deleteForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!supabase) return;

  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true;
  btn.textContent = 'Memeriksa...';

  const id = document.getElementById('deleteIdInput').value;
  const rawPin = document.getElementById('deletePinInput').value.trim();

  try {
    const pinHash = await hashPin(rawPin);
    const { data: isDeleted, error } = await supabase.rpc('delete_proker_with_pin', {
      p_id: id,
      p_pin_hash: pinHash,
    });

    if (error) throw error;
    if (!isDeleted) {
      showToast('PIN salah! Proker gagal dihapus.', true);
      btn.disabled = false;
      btn.textContent = 'Hapus';
      return;
    }

    document.getElementById('deleteModal').classList.add('hidden');
    showToast('Proker telah dihapus.');
    await fetchEvents();
  } catch (err) {
    console.error(err);
    showToast('Gagal menghapus proker.', true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Hapus';
  }
});

// =========================================================================
// 8. EVENT LISTENERS NAVIGASI & KONTROL
// =========================================================================
document.getElementById('activeBidangSelect').addEventListener('change', (e) => {
  state.activeBidang = e.target.value;
  localStorage.setItem('org_active_bidang', state.activeBidang);
  updateIdentityUI();
});

document.getElementById('searchInput').addEventListener('input', (e) => {
  state.searchQuery = e.target.value;
  renderAll();
});

document.getElementById('filterBidangList').addEventListener('change', (e) => {
  state.filterListBidang = e.target.value;
  renderAllEventsView();
});

document.getElementById('monthSelect').addEventListener('change', (e) => {
  state.currentMonth = Number(e.target.value);
  renderAll();
});

document.getElementById('yearSelect').addEventListener('change', (e) => {
  state.currentYear = Number(e.target.value);
  renderAll();
});

document.getElementById('prevMonthBtn').addEventListener('click', () => {
  state.currentMonth--;
  if (state.currentMonth < 0) { state.currentMonth = 11; state.currentYear--; }
  renderAll();
});

document.getElementById('nextMonthBtn').addEventListener('click', () => {
  state.currentMonth++;
  if (state.currentMonth > 11) { state.currentMonth = 0; state.currentYear++; }
  renderAll();
});

document.getElementById('todayBtn').addEventListener('click', () => {
  const now = new Date();
  state.currentMonth = now.getMonth();
  state.currentYear = now.getFullYear();
  state.selectedDate = formatDateISO(now);
  renderAll();
});

document.getElementById('prevDayBtn').addEventListener('click', () => {
  const d = parseDateISO(state.selectedDate);
  d.setDate(d.getDate() - 1);
  state.selectedDate = formatDateISO(d);
  state.currentMonth = d.getMonth();
  state.currentYear = d.getFullYear();
  renderCalendar();
  renderScheduledPanel();
});

document.getElementById('nextDayBtn').addEventListener('click', () => {
  const d = parseDateISO(state.selectedDate);
  d.setDate(d.getDate() + 1);
  state.selectedDate = formatDateISO(d);
  state.currentMonth = d.getMonth();
  state.currentYear = d.getFullYear();
  renderCalendar();
  renderScheduledPanel();
});

// Navigasi Tab (Kalender / Agenda / Statistik)
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.view;
    document.querySelectorAll('.view-section').forEach((sec) => sec.classList.add('hidden'));
    document.getElementById(`view-${target}`).classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach((b) => {
      const isMatch = b.dataset.view === target;
      b.classList.toggle('bg-blue-600', isMatch && b.closest('aside'));
      b.classList.toggle('text-white', isMatch && b.closest('aside'));
      b.classList.toggle('text-blue-400', isMatch && !b.closest('aside'));
      b.classList.toggle('text-slate-400', !isMatch);
    });
  });
});

// Buka & Tutup Modal
document.getElementById('openAddModalBtn').addEventListener('click', openAddModal);
document.getElementById('mobileAddBtn').addEventListener('click', openAddModal);
document.getElementById('closeEventModalBtn').addEventListener('click', () => document.getElementById('eventModal').classList.add('hidden'));
document.getElementById('cancelEventModalBtn').addEventListener('click', () => document.getElementById('eventModal').classList.add('hidden'));
document.getElementById('cancelDeleteBtn').addEventListener('click', () => document.getElementById('deleteModal').classList.add('hidden'));

// Inisialisasi Aplikasi
initSelectors();
fetchEvents();
setupRealtime();