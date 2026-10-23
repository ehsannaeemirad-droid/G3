import { showFeedback, esc, norm, enSpan, makePrompt, makeFeedbackEl, makeSkipRow } from '../ui/feedback.js';
import { makeSkipButton } from '../ui/skip.js';

export function mountIdent(container, item, ctx) {
  container.innerHTML = '';
  const prompt = makePrompt(item);
  prompt.innerHTML += `<span class="en">${esc(item.wrongWord)} → ?</span>`;
  container.appendChild(prompt);

  const row = document.createElement('div');
  row.className = 'row';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'txt';
  input.dir = 'ltr';
  input.placeholder = 'شکل درست را بنویس…';
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

  const correct = norm(item.correctWord);
  const why = item.why || `«${item.wrongWord}» غلط است؛ درستش «${item.correctWord}» است.`;
  let done = false;

  function check() {
    if (done) return;
    const val = norm(input.value);
    if (!val) return;
    if (val === correct) {
      done = true;
      input.classList.remove('bad');
      input.classList.add('ok');
      input.disabled = true;
      btn.disabled = true;
      showFeedback(feedback, esc(why), 'ok');
      ctx.onSolved('correct');
    } else {
      ctx.onWrong?.();
      input.classList.add('bad');
      showFeedback(feedback, esc(item.hint || why), 'bad');
    }
  }

  btn.addEventListener('click', check);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); check(); }
  });

  skipRow.appendChild(makeSkipButton(container, feedback, item, ctx,
    `${enSpan(item.correctWord)} — ${esc(why)}`));
}
