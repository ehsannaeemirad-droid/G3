import { showFeedback, esc } from './feedback.js';

export function makeSkipButton(container, feedbackEl, item, ctx, correctHtml, opts = {}) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'skip-link';
  btn.textContent = 'رد کردن';
  btn.addEventListener('click', () => {
    if (opts.decorate) opts.decorate();
    container.querySelectorAll('button, input').forEach(el => { el.disabled = true; });
    showFeedback(
      feedbackEl,
      `<b>پاسخ درست:</b> ${correctHtml}<br>${esc(item.why || '')}`,
      'bad'
    );
    ctx.onSolved('skipped');
  });
  return btn;
}
