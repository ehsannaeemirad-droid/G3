import { showFeedback, esc, norm, enSpan, makePrompt, makeFeedbackEl, makeSkipRow } from '../ui/feedback.js';
import { makeSkipButton } from '../ui/skip.js';

export function mountFix(container, item, ctx) {
  container.innerHTML = '';
  container.appendChild(makePrompt(item));

  const sentenceBox = document.createElement('div');
  sentenceBox.className = 'fix-sentence';
  sentenceBox.textContent = item.sentence;
  container.appendChild(sentenceBox);

  const feedback = makeFeedbackEl();
  container.appendChild(feedback);
  const skipRow = makeSkipRow();
  container.appendChild(skipRow);

  let done = false;
  let wrongReported = false;
  const expected = norm(item.isCorrect ? item.sentence : (item.answers || [])[0]);

  function finish(kind) {
    done = true;
    container.querySelectorAll('button, input').forEach(el => { el.disabled = true; });
    showFeedback(feedback, esc(item.why || ''), kind);
    ctx.onSolved(kind === 'ok' ? 'correct' : 'skipped');
  }

  function makeInputRow() {
    const row = document.createElement('div');
    row.className = 'row';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'txt';
    input.dir = 'ltr';
    input.placeholder = item.isCorrect ? 'جمله را دوباره بنویس تا مطمئن شویم…' : 'جملهٔ درست را بنویس…';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn small';
    btn.textContent = 'بررسی';
    row.append(input, btn);
    const check = () => {
      if (done) return;
      const val = norm(input.value);
      if (!val) return;
      if (val === expected) {
        done = true;
        input.classList.remove('bad');
        input.classList.add('ok');
        input.disabled = true;
        btn.disabled = true;
        showFeedback(feedback, esc(item.why || ''), 'ok');
        ctx.onSolved('correct');
      } else {
        if (!wrongReported) { wrongReported = true; ctx.onWrong?.(); }
        input.classList.add('bad');
        showFeedback(feedback, esc(item.wrongFixHint || item.hint || item.why || ''), 'bad');
      }
    };
    btn.addEventListener('click', check);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); check(); }
    });
    return row;
  }

  if (item.isCorrect) {
    const actions = document.createElement('div');
    actions.className = 'fix-actions';

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'fix-btn ok';
    okBtn.textContent = '✅ این جمله درست است';
    okBtn.addEventListener('click', () => {
      if (done) return;
      done = true;
      container.querySelectorAll('button').forEach(el => { el.disabled = true; });
      okBtn.classList.add('ok');
      showFeedback(feedback, esc(item.why || ''), 'ok');
      ctx.onSolved('correct');
    });

    const fixBtn = document.createElement('button');
    fixBtn.type = 'button';
    fixBtn.className = 'fix-btn';
    fixBtn.textContent = '✏️ اصلاح می‌کنم';
    fixBtn.addEventListener('click', () => {
      if (done) return;
      fixBtn.disabled = true;
      okBtn.disabled = true;
      container.insertBefore(makeInputRow(), feedback);
    });

    actions.append(okBtn, fixBtn);
    container.insertBefore(actions, feedback);

    skipRow.appendChild(makeSkipButton(container, feedback, item, ctx,
      `${enSpan(item.sentence)} — این جمله درست بود.`));
  } else {
    container.insertBefore(makeInputRow(), feedback);
    skipRow.appendChild(makeSkipButton(container, feedback, item, ctx,
      enSpan((item.answers || [])[0] || '')));
  }
}
