import { showFeedback, esc, norm, enSpan, makePrompt, makeFeedbackEl, makeSkipRow } from '../ui/feedback.js';
import { makeSkipButton } from '../ui/skip.js';

export function mountOrder(container, item, ctx) {
  container.innerHTML = '';
  container.appendChild(makePrompt(item));

  const zone = document.createElement('div');
  zone.className = 'zone';
  container.appendChild(zone);

  const chips = document.createElement('div');
  chips.className = 'chips';
  container.appendChild(chips);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn small';
  btn.textContent = 'بررسی';
  btn.disabled = true;
  container.appendChild(btn);

  const feedback = makeFeedbackEl();
  container.appendChild(feedback);
  const skipRow = makeSkipRow();
  container.appendChild(skipRow);

  const all = item.words.map((w, i) => {
    const c = document.createElement('button');
    c.type = 'button';
    c.className = 'chip';
    c.textContent = w;
    c.dataset.idx = String(i);
    c.addEventListener('click', () => {
      if (c.disabled) return;
      if (c.parentElement === zone) {
        chips.appendChild(c);
        c.classList.remove('in-zone');
      } else {
        zone.appendChild(c);
        c.classList.add('in-zone');
      }
      btn.disabled = zone.querySelectorAll('.chip').length < item.words.length - (item.extraCount || 0);
    });
    chips.appendChild(c);
    return c;
  });

  function check() {
    const built = [...zone.querySelectorAll('.chip')].map(c => c.textContent).join(' ');
    if (norm(built) === norm(item.answer)) {
      all.forEach(c => { c.disabled = true; });
      btn.disabled = true;
      showFeedback(feedback, esc(item.why || ''), 'ok');
      ctx.onSolved('correct');
    } else {
      ctx.onWrong?.();
      let msg = esc(item.hint || item.why || '');
      if (item.extraCount > 0) {
        msg += `<br>${item.extraCount === 1 ? 'یک کلمهٔ اضافی' : `${item.extraCount} کلمهٔ اضافی`} هم در پاسخ هست که نباید بیاید.`;
      }
      showFeedback(feedback, msg, 'bad');
    }
  }

  btn.addEventListener('click', check);

  skipRow.appendChild(makeSkipButton(container, feedback, item, ctx, enSpan(item.answer)));
}
