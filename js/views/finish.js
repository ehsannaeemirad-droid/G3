import { faNum } from '../config.js';
import { esc } from '../engine/ui/feedback.js';
import { store } from '../store.js';

export function renderFinish(app, lesson, runner, { onRetry } = {}) {
  const stats = runner.getStats();
  const totalItems = lesson.steps.reduce((n, s) => n + (s.items?.length || 0), 0);
  const entries = Object.entries(stats.byTag);
  const openMistakes = store.unresolvedMistakes().filter(m => m.lessonId === lesson.id).length;
  const weak = entries.filter(([, v]) => (v.t ? v.c / v.t : 0) < 0.7);

  const tiles = entries.map(([tag, v]) => {
    const pct = v.t ? Math.round((v.c / v.t) * 100) : 0;
    return `
      <div class="stat">
        <div class="num">${faNum(pct)}٪</div>
        <div class="lbl">${esc(tag)} · ${faNum(v.c)} از ${faNum(v.t)}</div>
      </div>`;
  }).join('');

  const recommend = weak.length
    ? `<div class="recommend">
         <b>پیشنهاد مرور</b>
         در تگ‌های ${weak.map(([t]) => esc(t)).join('، ')} زیر ۷۰٪ هستی. مرور دوبارهٔ این بخش‌ها کمک می‌کند.
       </div>`
    : `<div class="recommend" style="background:#f0fdf4;border-color:#86efac;color:#14532d">
         <b style="color:#166534">آفرین! 🎉</b>
         در همهٔ تگ‌ها بالای ۷۰٪ هستی.
       </div>`;

  app.innerHTML = `
    <div class="card finish">
      <div class="big">🎉</div>
      <h1>تمام شد!</h1>
      <p class="small muted">${esc(lesson.titleFa)} — ${esc(lesson.subtitleFa || '')}</p>
      <div class="stats">
        ${tiles}
        <div class="stat">
          <div class="num">${faNum(stats.totalSolved)} / ${faNum(totalItems)}</div>
          <div class="lbl">تمرین حل‌شده</div>
        </div>
      </div>
      ${recommend}
      ${openMistakes > 0
        ? `<a class="btn ghost full" href="#/review" style="margin-bottom:10px">مرور سؤال‌های غلط (${faNum(openMistakes)})</a>`
        : ''}
      <button class="btn full" id="retryBtn">یک بار دیگر از اول</button>
      <a href="#/library" class="btn ghost full" style="margin-top:10px">بازگشت به درس‌ها</a>
    </div>
  `;
  document.getElementById('retryBtn').onclick = () => onRetry && onRetry();
}
