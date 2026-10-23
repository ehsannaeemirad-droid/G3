import { loadIndex } from '../data.js';
import { store } from '../store.js';
import { faNum } from '../config.js';
import { esc } from '../engine/ui/feedback.js';

const TRACKS = {
  'verb-patterns': 'الگوهای فعل',
  'clauses': 'بندها',
  'tense-aspect': 'زمان و نمود',
  'voice-modality': 'مجهول و وجه',
  'conditionals': 'شرطی‌ها',
  'reporting': 'نقل قول',
};

const STATUS_LABELS = {
  all: 'همه',
  'not-started': 'شروع نشده',
  'in-progress': 'در حال انجام',
  complete: 'کامل',
};

let state = { filter: 'all', track: 'all' };
let indexData = null;

export async function renderLibrary() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="card"><p class="muted">در حال بارگذاری…</p></div>`;

  try {
    indexData = await loadIndex();
  } catch (e) {
    app.innerHTML = `
      <div class="card">
        <h1>خطا</h1>
        <p class="muted">${esc(e.message)}</p>
        <button class="btn full" id="retryBtn" style="margin-top:10px">تلاش دوباره</button>
      </div>`;
    document.getElementById('retryBtn').onclick = () => renderLibrary();
    return;
  }

  state = { filter: 'all', track: 'all' };

  const tracks = [...new Set(indexData.lessons.map(l => l.track))];
  const statusChips = Object.entries(STATUS_LABELS).map(([key, label]) =>
    `<button type="button" class="filter-chip${key === 'all' ? ' active' : ''}" data-filter="${key}">${label}</button>`
  ).join('');
  const trackChips = [
    `<button type="button" class="filter-chip active" data-track="all">همهٔ مسیرها</button>`,
    ...tracks.map(t => `<button type="button" class="filter-chip" data-track="${esc(t)}">${esc(TRACKS[t] || t)}</button>`),
  ].join('');

  app.innerHTML = `
    <div class="card">
      <h1>درس‌ها</h1>
      <p class="small muted">از هر درس، از هر قدمی که می‌خواهی شروع کن.</p>
      <div class="filters" id="statusFilters">${statusChips}</div>
      <div class="filters" id="trackFilters">${trackChips}</div>
    </div>
    <div id="lessonList" style="margin-top:14px"></div>
  `;

  app.querySelector('#statusFilters').addEventListener('click', e => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;
    state.filter = btn.dataset.filter;
    app.querySelectorAll('#statusFilters .filter-chip').forEach(b => b.classList.toggle('active', b === btn));
    paintList();
  });
  app.querySelector('#trackFilters').addEventListener('click', e => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;
    state.track = btn.dataset.track;
    app.querySelectorAll('#trackFilters .filter-chip').forEach(b => b.classList.toggle('active', b === btn));
    paintList();
  });

  paintList();
}

function lessonStatus(progress) {
  if (progress?.completedAt) return 'complete';
  if (progress && progress.lastStep > 0) return 'in-progress';
  return 'not-started';
}

function paintList() {
  const list = document.getElementById('lessonList');
  if (!list || !indexData) return;
  const s = store.get();

  const lessons = indexData.lessons.filter(meta => {
    if (state.track !== 'all' && meta.track !== state.track) return false;
    if (state.filter === 'all') return true;
    return lessonStatus(s.lessons[meta.id]) === state.filter;
  });

  if (!lessons.length) {
    list.innerHTML = `
      <div class="card">
        <div class="placeholder">
          <div class="big">🔍</div>
          <p class="small">چیزی پیدا نشد</p>
        </div>
      </div>`;
    return;
  }

  list.innerHTML = lessons.map(meta => {
    const p = s.lessons[meta.id] || {};
    const status = lessonStatus(p);
    const steps = meta.stepCount || 0;
    const pct = steps ? Math.min(100, Math.round(((p.lastStep || 0) / steps) * 100)) : 0;

    let badge = '';
    if (status === 'complete') badge = `<span class="badge-ok">✓ کامل</span>`;
    else if (status === 'in-progress') badge = `<span class="badge-cont">ادامه</span>`;

    const bar = status !== 'not-started' && steps
      ? `<div class="stepbar" style="margin:10px 0 0"><i style="width:${pct}%"></i></div>`
      : '';

    const track = TRACKS[meta.track] || meta.track;

    return `
      <a class="card lesson-card" href="#/lesson/${meta.id}">
        <div class="lesson-card-head">
          <div>
            <h2>${esc(meta.titleFa)}</h2>
            <p class="small muted" style="margin:0">${esc(meta.subtitleFa || '')}</p>
          </div>
          ${badge}
        </div>
        <div class="meta">${esc(track)} · ${faNum(meta.itemCount)} تمرین · ~${faNum(meta.estimatedMinutes)} دقیقه · ${esc(meta.level || '')}</div>
        ${bar}
      </a>`;
  }).join('');
}
