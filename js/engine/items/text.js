import { showFeedback, esc, norm, enSpan, makePrompt, makeFeedbackEl, makeSkipRow } from '../ui/feedback.js';
import { makeSkipButton } from '../ui/skip.js';

export function mountText(container, item, ctx) {
  container.innerHTML = '';
  container.appendChild(makePrompt(item));

  const row = document.createElement('div');
  row.className = 'row';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'txt';
  input.dir = 'ltr';
  input.placeholder = item.placeholder || '';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn small';
  btn.textContent = 'بررسی';
  row.append(input, btn);
  container.appendChild(row);

  const feedback = makeFeedbackEl();
  container.appendChild(feedback);
  const skipRow = makeSkipRow();
  container.appendChild(skipRow);

  const answers = (item.answers || []).map(norm);
  const allowsEmpty = answers.includes('');
  let attempts = 0;
  let done = false;
  let revealBtn = null;

  function showReveal() {
    if (revealBtn) return;
    revealBtn = document.createElement('button');
    revealBtn.type = 'button';
    revealBtn.className = 'reveal';
    revealBtn.textContent = 'پاسخ را نشان بده';
    revealBtn.addEventListener('click', () => {
      if (done) return;
      ctx.onWrong?.();
      done = true;
      input.value = item.answers[0];
      input.classList.remove('bad');
      input.classList.add('ok');
      input.disabled = true;
      btn.disabled = true;
      revealBtn.remove();
      showFeedback(feedback, esc(item.why || ''), 'ok');
      ctx.onSolved('correct');
    });
    skipRow.appendChild(revealBtn);
  }

  function check() {
    if (done) return;
    const val = norm(input.value);
    if (!val && !allowsEmpty) return;
    if (answers.includes(val)) {
      done = true;
      input.classList.remove('bad');
      input.classList.add('ok');
      input.disabled = true;
      btn.disabled = true;
      if (revealBtn) revealBtn.remove();
      showFeedback(feedback, esc(item.why || ''), 'ok');
      ctx.onSolved('correct');
    } else {
      ctx.onWrong?.();
      attempts += 1;
      input.classList.add('bad');
      showFeedback(feedback, esc(item.hint || item.why || ''), 'bad');
      if (attempts >= 2) showReveal();
    }
  }

  btn.addEventListener('click', check);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); check(); }
  });

  skipRow.appendChild(makeSkipButton(container, feedback, item, ctx,
    `${enSpan(item.answers[0] || '(هیچ — قابل حذف است)')}`));
}
