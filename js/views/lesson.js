import { loadLesson } from '../data.js';
import { LessonRunner } from '../engine/lesson-runner.js';
import { mountItem } from '../engine/item-mounter.js';
import { esc } from '../engine/ui/feedback.js';
import { store } from '../store.js';
import { faNum } from '../config.js';
import { renderFinish } from './finish.js';

let activeRunner = null;

export async function renderLesson(lessonId) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="card"><p class="muted">در حال بارگذاری…</p></div>`;

  let lesson;
  try {
    lesson = await loadLesson(lessonId);
  } catch (e) {
    app.innerHTML = `
      <div class="card">
        <h1>خطا</h1>
        <p class="muted">${esc(e.message)}</p>
        <a href="#/library" class="btn full" style="margin-top:12px">بازگشت به درس‌ها</a>
      </div>`;
    return;
  }

  const progress = store.get().lessons[lessonId] || {};
  const last = progress.lastStep || 0;
  activeRunner = new LessonRunner(lesson, {
    initialStep: last >= lesson.steps.length ? 0 : last,
    initialOutcomes: progress.outcomes || {},
    startTime: progress.startedAt || Date.now(),
    onOutcomeSaved: (outcomes) => store.patchLesson(lessonId, { outcomes }),
    onRender: (r) => paint(app, r, lesson),
    onComplete: (r) => completeLesson(lessonId, lesson, r),
  });
  activeRunner.render();
}

function setActiveNav() {
  document.querySelectorAll('[data-nav]').forEach(el => el.classList.remove('active'));
  document.querySelector('[data-nav="library"]')?.classList.add('active');
}

function paint(app, runner, lesson) {
  if (location.hash !== `#/lesson/${lesson.id}`) return;
  setActiveNav();
  const step = lesson.steps[runner.step];

  if (runner.mode === 'teach') return paintTeach(app, runner, lesson, step);
  if (runner.mode === 'item') return paintItem(app, runner, lesson, step);
  if (runner.mode === 'complete') return paintComplete(app, runner, lesson, step);
}

function stepbar(runner, lesson) {
  const pct = ((runner.step + 1) / lesson.steps.length) * 100;
  return `<div class="stepbar"><i style="width:${pct}%"></i></div>`;
}

function highlight(text, hlList) {
  let html = esc(text);
  (hlList || []).forEach(word => {
    if (!word) return;
    const safe = esc(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`\\b(${safe})\\b`, 'gi'), '<span class="g">$1</span>');
  });
  return html;
}

function paintTeach(app, runner, lesson, step) {
  const examples = (step.examples || []).map(ex => `
    <div class="ex">
      <div class="en">${highlight(ex.en, ex.hl)}</div>
      <div class="fa">${esc(ex.fa)}</div>
    </div>`).join('');

  app.innerHTML = `
    <div class="card">
      ${stepbar(runner, lesson)}
      <span class="step-label">قدم ${faNum(runner.step + 1)} / ${faNum(lesson.steps.length)}</span>
      <h2>${esc(step.titleFa)}</h2>
      <div class="teach">
        <p>${esc(step.intro)}</p>
        ${examples}
        ${step.note ? `<div class="note">${esc(step.note)}</div>` : ''}
        ${step.mistake ? `
          <div class="warn">
            <b>خطای رایج:</b>
            <span class="en-inline">❌ ${esc(step.mistake.wrong)}</span> ·
            <span class="en-inline">✅ ${esc(step.mistake.right)}</span><br>
            ${esc(step.mistake.whyFa)}
          </div>` : ''}
      </div>
      <button class="btn full" id="startBtn" style="margin-top:6px">شروع تمرین</button>
    </div>
  `;
  document.getElementById('startBtn').onclick = () => runner.startPractice();
}

function paintItem(app, runner, lesson, step) {
  const total = step.items.length;
  const dots = step.items.map((_, i) => {
    const key = `s${runner.step}-${i}`;
    if (i === runner.item) return `<span class="dot on"></span>`;
    if (runner.solved.has(key)) return `<span class="dot done"></span>`;
    return `<span class="dot"></span>`;
  }).join('');

  app.innerHTML = `
    <div class="card">
      ${stepbar(runner, lesson)}
      ${step.isFinal ? `
        <div class="skip-stage">
          <button class="skip-link" id="skipStageBtn">رد کردن این مرحله ←</button>
        </div>` : ''}
      <div class="item-counter">
        <span class="label">سؤال ${faNum(runner.item + 1)} از ${faNum(total)}</span>
        <span class="dots">${dots}</span>
      </div>
      <div class="item-body"></div>
    </div>
  `;

  if (step.isFinal) {
    document.getElementById('skipStageBtn').onclick = () => {
      if (!confirm('کل این مرحله رد شود؟')) return;
      runner.skipStage();
    };
  }

  const body = app.querySelector('.item-body');
  const ctx = {
    onSolved: (result) => {
      runner.markSolved(result);
      const prev = store.get().lessons[lesson.id] || {};
      store.patchLesson(lesson.id, {
        lastStep: runner.step,
        startedAt: prev.startedAt || Date.now(),
        solvedCount: (prev.solvedCount || 0) + 1,
      });
    },
    onSkip: () => {},
    onWrong: () => {
      store.addMistake(lesson.id, `${step.id}-${runner.item}`);
    },
    showFeedback: (html, kind) => {
      const el = app.querySelector('.item-body .feedback');
      if (el) {
        el.className = 'feedback' + (kind ? ' ' + kind : '');
        el.innerHTML = html;
      }
    },
  };
  mountItem(body, step.items[runner.item], ctx);
}

function paintComplete(app, runner, lesson, step) {
  const isLast = runner.step + 1 >= lesson.steps.length;
  app.innerHTML = `
    <div class="card">
      ${stepbar(runner, lesson)}
      <div class="placeholder">
        <div class="big">✅</div>
      </div>
      <h2 style="text-align:center">مرحله را کامل کردی</h2>
      <button class="btn full" id="nextBtn" style="margin-top:10px">
        ${isLast ? 'پایان درس' : 'مرحلهٔ بعد'}
      </button>
    </div>
  `;
  document.getElementById('nextBtn').onclick = () => runner.nextStep();
}

function completeLesson(lessonId, lesson, runner) {
  const stats = runner.getStats();
  store.trackActivity();
  store.patchLesson(lessonId, {
    completedAt: Date.now(),
    lastStep: lesson.steps.length,
    startedAt: null,
    mastery: Object.fromEntries(
      Object.entries(stats.byTag).map(([t, v]) => [t, v.t ? Math.round((v.c / v.t) * 100) : 0])
    ),
    elapsedMs: stats.elapsedMs,
  });
  renderFinish(document.getElementById('app'), lesson, runner, {
    onRetry: () => {
      // start over from a clean slate: drop this attempt's outcomes and progress
      store.patchLesson(lessonId, {
        outcomes: {},
        lastStep: 0,
        startedAt: Date.now(),
        completedAt: null,
        mastery: null,
        elapsedMs: null,
      });
      location.hash = `#/lesson/${lessonId}`;
      location.reload();
    },
  });
}
