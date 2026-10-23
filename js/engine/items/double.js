import { showFeedback, esc, norm, enSpan, makePrompt, makeFeedbackEl, makeSkipRow } from '../ui/feedback.js';
import { makeSkipButton } from '../ui/skip.js';

export function mountDouble(container, item, ctx) {
  container.innerHTML = '';
  container.appendChild(makePrompt(item));

  const box = document.createElement('div');
  box.className = 'double-sentence';
  const parts = item.template.split(/\{(\d+)\}/g);
  const inputs = [];
  parts.forEach((part, i) => {
    if (i % 2 === 0) {
      box.appendChild(document.createTextNode(part));
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = '?';
      input.dataset.slot = part;
      inputs[+part] = input;
      box.appendChild(input);
    }
  });
  container.appendChild(box);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn small';
  btn.textContent = 'بررسی';
  container.appendChild(btn);

  const feedback = makeFeedbackEl();
  container.appendChild(feedback);
  const skipRow = makeSkipRow();
  container.appendChild(skipRow);

  const answers1 = (item.answers1 || []).map(norm);
  const answers2 = (item.answers2 || []).map(norm);
  let done = false;

  function check() {
    if (done) return;
    const v0 = norm(inputs[0].value);
    const v1 = norm(inputs[1].value);
    if (!v0 || !v1) return;
    const ok0 = answers1.includes(v0);
    const ok1 = answers2.includes(v1);
    inputs[0].classList.toggle('ok', ok0);
    inputs[0].classList.toggle('bad', !ok0);
    inputs[1].classList.toggle('ok', ok1);
    inputs[1].classList.toggle('bad', !ok1);
    if (ok0 && ok1) {
      done = true;
      inputs.forEach(i => { i.disabled = true; });
      btn.disabled = true;
      showFeedback(feedback, esc(item.why || ''), 'ok');
      ctx.onSolved('correct');
    } else {
      ctx.onWrong?.();
      showFeedback(feedback, esc(item.hint || item.why || ''), 'bad');
    }
  }

  btn.addEventListener('click', check);
  inputs.forEach(input => input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); check(); }
  }));

  skipRow.appendChild(makeSkipButton(container, feedback, item, ctx,
    `${enSpan(item.answers1[0])} · ${enSpan(item.answers2[0])}`,
    { decorate: () => {
      inputs[0].value = item.answers1[0];
      inputs[1].value = item.answers2[0];
    } }
  ));
}
