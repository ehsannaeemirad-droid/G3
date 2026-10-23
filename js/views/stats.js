import { store } from '../store.js';
import { loadIndex } from '../data.js';
import { faNum } from '../config.js';
import { esc } from '../engine/ui/feedback.js';

const TAG_FA = {
  // gerunds
  'gerund': 'کاربرد gerund',
  'contrast': 'فرق gerund و to',
  'detect': 'تشخیص خطا',
  // noun clauses
  'noun-clause': 'بند اسمی',
  'word-order': 'ترتیب کلمات در بند',
  // adjective clauses
  'relative': 'ضمیر وصفی',
  'comma': 'کاما در بند وصفی',
  // present perfect
  'form': 'ساختار',
  'since-for': 'since / for',
  // present perfect continuous
  'duration': 'مدت زمان',
  'simple-continuous': 'فرق ساده و استمراری',
  // past perfect
  'sequence': 'توالی گذشته',
  'before-after': 'before / after',
  // future continuous
  'parallel': 'فعالیت موازی',
  // passive
  'agent': 'فاعل در مجهول',
  // perfect modals
  'meaning': 'معنی',
  // conditional 2
  'unless': 'unless / provided that',
  // conditional 3
  'regret': 'پشیمانی',
  // mixed conditionals
  'combination': 'ترکیب زمان‌ها',
  'time-marker': 'نشانه‌های now / then',
  // wish
  'present-wish': 'آرزوی حال',
  'past-wish': 'پشیمانی گذشته',
  // reported speech
  'backshift': 'عقب‌گرد زمان',
  'questions': 'سؤال گزارش‌شده',
};

export async function renderStats() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="card"><p class="muted">در حال بارگذاری…</p></div>`;

  let index;
  try {
    index = await loadIndex();
  } catch (e) {
    app.innerHTML = `
      <div class="card">
        <h1>خطا</h1>
        <p class="muted">${esc(e.message)}</p>
        <button class="btn full" id="retryBtn" style="margin-top:10px">تلاش دوباره</button>
      </div>`;
    document.getElementById('retryBtn').onclick = () => renderStats();
    return;
  }

  const s = store.get();
  const lessons = index.lessons;
  const started = lessons.filter(l => s.lessons[l.id]);
  const completed = started.filter(l => s.lessons[l.id].completedAt);
  const activityDays = (s.activityDays || []).length;
  const mistakes = s.mistakesBank || [];
  const unresolved = mistakes.filter(m => !m.resolvedAt).length;
  const resolved = mistakes.length - unresolved;

  if (!started.length && !mistakes.length && !activityDays) {
    app.innerHTML = `
      <div class="card">
        <h1>پیشرفت</h1>
      </div>
      <div class="card" style="margin-top:14px">
        <div class="placeholder">
          <div class="big">📊</div>
          <p class="small">هنوز آماری نداری. یک درس را کامل کن.</p>
        </div>
      </div>`;
    return;
  }

  const totalItems = started.reduce((n, l) => n + (l.itemCount || 0), 0);
  const totalMs = started.reduce((n, l) => n + (s.lessons[l.id].elapsedMs || 0), 0);
  const totalMinutes = Math.round(totalMs / 60000);

  const masteryVals = [];
  completed.forEach(l => {
    Object.values(s.lessons[l.id].mastery || {}).forEach(v => masteryVals.push(v));
  });
  const avgMastery = masteryVals.length
    ? Math.round(masteryVals.reduce((a, b) => a + b, 0) / masteryVals.length)
    : null;

  const lessonCards = completed.map(meta => {
    const mastery = s.lessons[meta.id].mastery || {};
    const bars = Object.entries(mastery).map(([tag, pct]) => `
      <div class="bar-row">
        <span class="bar-label">${esc(TAG_FA[tag] || tag)}</span>
        <span class="bar"><i style="width:${pct}%"></i></span>
        <span class="bar-pct">${faNum(pct)}٪</span>
      </div>`).join('');
    return `
      <div class="card" style="margin-top:14px">
        <div class="lesson-card-head">
          <h2>${esc(meta.titleFa)}</h2>
          <span class="badge-ok">✓ کامل</span>
        </div>
        ${bars}
      </div>`;
  }).join('');

  app.innerHTML = `
    <div class="card">
      <h1>پیشرفت</h1>
      <div class="stat-grid">
        <div class="stat"><div class="num">${faNum(activityDays)}</div><div class="lbl">روزهای فعال</div></div>
        <div class="stat"><div class="num">${faNum(totalItems)}</div><div class="lbl">کل تمرین درس‌های شروع‌شده</div></div>
        <div class="stat"><div class="num">${avgMastery === null ? '—' : faNum(avgMastery) + '٪'}</div><div class="lbl">میانگین تسلط</div></div>
        <div class="stat"><div class="num">${faNum(totalMinutes)}</div><div class="lbl">دقیقهٔ تمرین</div></div>
      </div>
    </div>
    ${lessonCards || `
      <div class="card" style="margin-top:14px">
        <div class="placeholder">
          <div class="big">📘</div>
          <p class="small">هنوز هیچ درسی را کامل نکرده‌ای.</p>
        </div>
      </div>`}
    <div class="card" style="margin-top:14px">
      <h2>مرور</h2>
      <p class="small muted">${faNum(unresolved)} اشتباه حل‌نشده · ${faNum(resolved)} اشتباه حل‌شده</p>
      ${unresolved > 0 ? `<a class="btn full" href="#/review" style="margin-top:8px">رفتن به مرور</a>` : ''}
    </div>
  `;
}
