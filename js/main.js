import { router } from './router.js';
import { store } from './store.js';

import { renderDashboard } from './views/dashboard.js';
import { renderLibrary } from './views/library.js';
import { renderLesson } from './views/lesson.js';
import { renderReview } from './views/review.js';
import { renderStats } from './views/stats.js';
import { renderSettings } from './views/settings.js';

/* make sure store initialized */
store.get();

export function applyTheme() {
  const s = store.get().settings;
  const theme = s.theme || 'auto';
  let effective = theme;
  if (theme === 'auto') {
    effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = effective;
}

export function applyFontSize() {
  const s = store.get().settings;
  document.documentElement.dataset.fontsize = s.fontSize || 'medium';
}

applyTheme();
applyFontSize();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

router
  .add('/', renderDashboard, 'dashboard')
  .add('/library', renderLibrary, 'library')
  .add('/review', renderReview, 'review')
  .add('/stats', renderStats, 'stats')
  .add('/settings', renderSettings, null)
  .addPattern('/lesson/:id', ({ id }) => renderLesson(id), 'library')
  .fallback(() => {
    const app = document.getElementById('app');
    document.querySelectorAll('[data-nav]').forEach(el => el.classList.remove('active'));
    app.innerHTML = `
      <div class="card">
        <h1>صفحه پیدا نشد</h1>
        <p>این صفحه وجود ندارد.</p>
        <button class="btn full" onclick="location.hash='#/'">بازگشت به خانه</button>
      </div>
    `;
  });

router.start();

/* ---------- PWA: service worker ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      // a new SW version is downloaded on page loads; let it take over at once
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            sw.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    }).catch(() => { /* SW unavailable (insecure context etc.) — app still works */ });
  });

  // reload once when a newer SW takes control (never on the very first install)
  let hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) { hadController = true; return; }
    location.reload();
  });
}
