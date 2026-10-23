import { showFeedback, esc, makePrompt, makePassage, makeFeedbackEl, makeSkipRow } from '../ui/feedback.js';
import { makeSkipButton } from '../ui/skip.js';

export function mountMcq(container, item, ctx) {
  container.innerHTML = '';

  const passage = makePassage(item);
  if (passage) container.appendChild(passage);
  container.appendChild(makePrompt(item));

  if (item.question) {
    const q = document.createElement('p');
    q.className = 'prompt-q';
    q.textContent = item.question;
    container.appendChild(q);
  }

  const options = document.createElement('div');
  options.className = 'options';
  const feedback = makeFeedbackEl();
  const skipRow = makeSkipRow();

  const btns = item.options.map((opt, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt';
    b.innerHTML = `<span class="en">${esc(opt)}</span>`;
    b.addEventListener('click', () => {
      if (b.disabled) return;
      if (i === item.answer) {
        btns.forEach(x => { x.disabled = true; });
        b.classList.add('ok');
        showFeedback(feedback, esc(item.why || ''), 'ok');
        ctx.onSolved('correct');
      } else {
        ctx.onWrong?.();
        b.classList.add('bad');
        b.disabled = true;
        showFeedback(feedback, esc(item.hint || item.why || ''), 'bad');
      }
    });
    options.appendChild(b);
    return b;
  });

  container.appendChild(options);
  container.appendChild(feedback);
  skipRow.appendChild(makeSkipButton(
    container, feedback, item, ctx,
    `<span class="en">${esc(item.options[item.answer])}</span>`,
    { decorate: () => btns[item.answer].classList.add('ok') }
  ));
  container.appendChild(skipRow);
}
