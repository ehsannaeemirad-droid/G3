import { store } from '../store.js';
import { loadLesson } from '../data.js';
import { faNum } from '../config.js';
import { esc } from '../engine/ui/feedback.js';
import { ReviewRunner } from '../engine/review-runner.js';
import { mountItem } from '../engine/item-mounter.js';

export async function renderReview() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="card"><p class="muted">در حال بارگذاری…</p></div>`;

  const mistakes = store.unresolvedMistakes();
  if (!mistakes.length) {
    app.innerHTML = `
      <div class="card">
        <h1>مرور</h1>
        <p class="small muted">سؤال‌هایی که اشتباه زدی اینجا جمع می‌شوند.</p>
      </div>
      <div class="card" style="margin-top:14px">
        <div class="placeholder">
          <div class="big">🔁</div>
          <p class="small">هیچ اشتباهی برای مرور نداری. آفرین!</p>
        </div>
      </div>`;
    return;
  }

  // build per-lesson groups with the real items
  const groups = [];
  for (const m of mistakes) {
    let lesson;
    try {
      lesson = await loadLesson(m.lessonId);
    } catch {
      continue;
    }
    const parsed = m.itemId.match(/^(s\d+)-(\d+)$/);
    if (!parsed) continue;
    const step = lesson.steps.find(s => s.id === parsed[1]);
    const item = step?.items?.[+parsed[2]];
    if (!item) continue;

    let group = groups.find(g => g.lesson.id === m.lessonId);
    if (!group) {
      group = { lesson, entries: [] };
      groups.push(group);
    }
    group.entries.push({ mistake: m, item, itemId: m.itemId });
  }

  if (!groups.length) {
    app.innerHTML = `
      <div class="card">
        <h1>مرور</h1>
        <p class="muted">اشتباه‌های ذخیره‌شده دیگر در دسترس نیستند.</p>
      </div>`;
    return;
  }

  const total = groups.reduce((n, g) => n + g.entries.length, 0);

  const groupCards = groups.map(g => {
    const rows = g.entries.map(e => {
      const prompt = (e.item.prompt || '').slice(0, 80);
      const sentence = e.item.sentence ? `<span class="en">${esc(e.item.sentence)}</span>` : '';
      return `
        <div class="review-item">
          <div class="prompt-short">${esc(prompt)}${prompt.length >= 80 ? '…' : ''} ${sentence}</div>
          <button type="button" data-lesson="${esc(g.lesson.id)}" data-item="${esc(e.itemId)}">حل شد</button>
        </div>`;
    }).join('');
    return `
      <div class="card" style="margin-top:14px">
        <div class="lesson-card-head">
          <h2>${esc(g.lesson.titleFa)}</h2>
          <span class="badge-cont">${faNum(g.entries.length)} مورد</span>
        </div>
        ${rows}
      </div>`;
  }).join('');

  app.innerHTML = `
    <div class="card">
      <h1>مرور</h1>
      <p class="small muted">${faNum(total)} اشتباه برای مرور</p>
      <button class="btn full" id="startReviewBtn" style="margin-top:8px">شروع مرور</button>
    </div>
    ${groupCards}
  `;

  app.addEventListener('click', e => {
    const btn = e.target.closest('.review-item button');
    if (!btn) return;
    store.resolveMistake(btn.dataset.lesson, btn.dataset.item);
    renderReview();
  }, { once: true });

  document.getElementById('startReviewBtn').onclick = () => {
    const sessionItems = groups.flatMap(g =>
      g.entries.map(e => ({
        lessonId: g.lesson.id,
        itemId: e.itemId,
        item: e.item,
        lessonTitleFa: g.lesson.titleFa,
      }))
    );
    const runner = new ReviewRunner(sessionItems, {
      onRender: r => paintSession(app, r),
      onComplete: r => paintComplete(app, r),
    });
    runner.render();
  };
}

function setActiveNav() {
  document.querySelectorAll('[data-nav]').forEach(el => el.classList.remove('active'));
  document.querySelector('[data-nav="review"]')?.classList.add('active');
}

function paintSession(app, runner) {
  if (location.hash !== '#/review') return;
  setActiveNav();
  const cur = runner.current();
  const total = runner.items.length;
  const dots = runner.items.map((it, i) => {
    if (i === runner.index) return `<span class="dot on"></span>`;
    if (runner.results.has(`${it.lessonId}/${it.itemId}`)) return `<span class="dot done"></span>`;
    return `<span class="dot"></span>`;
  }).join('');

  app.innerHTML = `
    <div class="card">
      <span class="step-label">مرور · ${esc(cur.lessonTitleFa)}</span>
      <div class="item-counter">
        <span class="label">مرور · سؤال ${faNum(runner.index + 1)} از ${faNum(total)}</span>
        <span class="dots">${dots}</span>
      </div>
      <div class="item-body"></div>
    </div>
  `;

  const body = app.querySelector('.item-body');
  mountItem(body, cur.item, {
    onSolved: result => runner.markSolved(result),
    onSkip: () => {},
    onWrong: () => store.addMistake(cur.lessonId, cur.itemId),
    showFeedback: (html, kind) => {
      const el = app.querySelector('.item-body .feedback');
      if (el) {
        el.className = 'feedback' + (kind ? ' ' + kind : '');
        el.innerHTML = html;
      }
    },
  });
}

function paintComplete(app, runner) {
  if (location.hash !== '#/review') return;
  setActiveNav();
  const stats = runner.getStats();

  runner.items.forEach(it => {
    if (stats.results[`${it.lessonId}/${it.itemId}`] === 'correct') store.resolveMistake(it.lessonId, it.itemId);
  });
  store.trackActivity();

  const allRight = stats.correct === stats.total;

  app.innerHTML = `
    <div class="card finish">
      <div class="big">${allRight ? '🎉' : '🔁'}</div>
      <h1>مرور تمام شد</h1>
      <p class="small muted">${faNum(stats.correct)} از ${faNum(stats.total)} درست</p>
      ${allRight
        ? `<div class="recommend" style="background:#f0fdf4;border-color:#86efac;color:#14532d">
             <b style="color:#166534">آفرین! 🎉</b>
             همهٔ اشتباه‌های این دور را درست جواب دادی.
           </div>`
        : `<div class="recommend">
             <b>ادامه بده</b>
             چند مورد هنوز در لیست مرور می‌ماند؛ می‌توانی دوباره تمرین کنی.
           </div>`}
      <button class="btn full" id="backToReviewBtn">بازگشت به مرور</button>
    </div>
  `;

  document.getElementById('backToReviewBtn').onclick = () => renderReview();
}
