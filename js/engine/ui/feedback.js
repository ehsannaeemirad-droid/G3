export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function norm(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[.,!?;:'"’‘`«»()؟،؛…]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function showFeedback(el, html, kind) {
  el.className = 'feedback' + (kind ? ' ' + kind : '');
  el.innerHTML = html;
}

export function enSpan(text) {
  return `<span class="en">${esc(text)}</span>`;
}

export function makePrompt(item) {
  const el = document.createElement('div');
  el.className = 'prompt';
  el.innerHTML = esc(item.prompt || '') +
    (item.sentence ? `<span class="en">${esc(item.sentence)}</span>` : '');
  return el;
}

export function makePassage(item) {
  if (!item.passage) return null;
  const el = document.createElement('div');
  el.className = 'passage';
  el.textContent = item.passage;
  return el;
}

export function makeFeedbackEl() {
  const el = document.createElement('div');
  el.className = 'feedback';
  return el;
}

export function makeSkipRow() {
  const el = document.createElement('div');
  el.className = 'skip-row';
  return el;
}
