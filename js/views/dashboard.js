import { faNum } from '../config.js';
import { store } from '../store.js';
import { loadIndex } from '../data.js';
import { esc } from '../engine/ui/feedback.js';

export async function renderDashboard() {
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
    document.getElementById('retryBtn').onclick = () => renderDashboard();
    return;
  }

  const s = store.get();
  const lessons = index.lessons;
  const totalLessons = lessons.length;
  const completed = lessons.filter(l => s.lessons[l.id]?.completedAt).length;
  const totalItems = lessons.reduce((n, l) => n + (l.itemCount || 0), 0);
  const solvedSum = lessons.reduce((n, l) => {
    const p = s.lessons[l.id];
    return n + Math.min(p?.solvedCount || 0, l.itemCount || 0);
  }, 0);

  const completedWithMastery = lessons.filter(l => {
    const m = s.lessons[l.id]?.mastery;
    return m && Object.keys(m).length;
  });
  const avgMastery = completedWithMastery.length
    ? Math.round(completedWithMastery.reduce((n, l) => {
        const vals = Object.values(s.lessons[l.id].mastery);
        return n + vals.reduce((a, b) => a + b, 0) / vals.length;
      }, 0) / completedWithMastery.length)
    : null;

  const activeDays = (s.activityDays || []).length;

  const inProgress = lessons
    .filter(l => {
      const p = s.lessons[l.id];
      return p && p.lastStep > 0 && !p.completedAt;
    })
    .sort((a, b) => (s.lessons[b.id]?.startedAt || 0) - (s.lessons[a.id]?.startedAt || 0));

  const continueCard = inProgress.length ? (() => {
    const meta = inProgress[0];
    const p = s.lessons[meta.id];
    const steps = meta.stepCount || 7;
    const pct = Math.min(100, Math.round(((p.lastStep || 0) / steps) * 100));
    return `
      <div class="card" style="margin-top:14px">
        <h2>ادامه بده</h2>
        <p class="small muted" style="margin-bottom:8px">${esc(meta.titleFa)} — قدم ${faNum((p.lastStep || 0) + 1)} از ${faNum(steps)}</p>
        <div class="stepbar"><i style="width:${pct}%"></i></div>
        <a href="#/lesson/${meta.id}" class="btn full">ادامهٔ درس</a>
      </div>`;
  })() : '';

  const lessonsCard = Object.keys(s.lessons).length
    ? `<a class="btn ghost full" href="#/library" style="margin-top:6px">همهٔ درس‌ها ←</a>`
    : `<p class="small muted" style="margin:0 0 10px">هنوز درسی شروع نکرده‌ای. از درس اول شروع کن!</p>
       <a href="#/library" class="btn full">رفتن به درس‌ها</a>`;

  app.innerHTML = `
    <div class="card">
      <h1>سلام 👋</h1>
      <p>به اپ گرامر خوش آمدی. از اینجا شروع کن.</p>
      <a href="#/library" class="btn ghost full" style="margin-top:4px">رفتن به درس‌ها</a>
    </div>
    ${continueCard}
    <div class="card" style="margin-top:14px">
      <h2>خلاصهٔ پیشرفت</h2>
      <div class="stat-grid">
        <div class="stat"><div class="num">${faNum(completed)} / ${faNum(totalLessons)}</div><div class="lbl">درس کامل‌شده</div></div>
        <div class="stat"><div class="num">${faNum(solvedSum)} / ${faNum(totalItems)}</div><div class="lbl">تمرین حل‌شده</div></div>
        <div class="stat"><div class="num">${avgMastery === null ? '—' : faNum(avgMastery) + '٪'}</div><div class="lbl">میانگین تسلط</div></div>
        <div class="stat"><div class="num">${faNum(activeDays)}</div><div class="lbl">روزهای فعال</div></div>
      </div>
    </div>
    <div class="card" style="margin-top:14px">
      <h2>درس‌ها</h2>
      ${lessonsCard}
    </div>
  `;
}
