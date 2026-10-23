import { store } from '../store.js';
import { APP_VERSION } from '../config.js';
import { applyTheme, applyFontSize } from '../main.js';

const THEMES = [
  ['auto', 'خودکار (سیستم)'],
  ['light', 'روشن'],
  ['dark', 'تاریک'],
];

const SIZES = [
  ['small', 'کوچک'],
  ['medium', 'متوسط'],
  ['large', 'بزرگ'],
];

export function renderSettings() {
  const app = document.getElementById('app');
  const s = store.get();
  const settings = s.settings || {};

  const radioGroup = (name, options, current) => options.map(([value, label]) => `
    <label class="radio-option${current === value ? ' checked' : ''}">
      <input type="radio" name="${name}" value="${value}"${current === value ? ' checked' : ''}>
      <span>${label}</span>
    </label>`).join('');

  app.innerHTML = `
    <div class="card">
      <h1>تنظیمات</h1>
      <p class="small muted">ظاهر و داده‌های اپ را اینجا کنترل کن.</p>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>ظاهر</h2>
      <div class="radio-group" id="themeGroup">
        ${radioGroup('theme', THEMES, settings.theme || 'auto')}
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>اندازهٔ متن</h2>
      <div class="radio-group" id="sizeGroup">
        ${radioGroup('fontSize', SIZES, settings.fontSize || 'medium')}
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>داده</h2>
      <p class="small muted">پیشرفتت را به فایل JSON بگیر یا از فایل برگردان.</p>
      <button class="btn full" id="exportBtn" style="margin-top:4px">خروجی JSON</button>
      <label class="btn ghost full file-btn" style="margin-top:10px">
        ورودی JSON
        <input type="file" id="importInput" accept=".json,application/json">
      </label>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>پاک کردن پیشرفت</h2>
      <p class="small muted">همهٔ داده‌های محلی حذف می‌شود. این کار قابل بازگشت نیست.</p>
      <button class="btn ghost full" id="resetBtn" style="margin-top:8px">پاک کردن همه‌چیز</button>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>درباره</h2>
      <p class="small muted">اپ گرامر — نسخهٔ ${APP_VERSION}</p>
      <p class="small muted">ساخته‌شده برای فارسی‌زبان‌هایی که گرامر انگلیسی یاد می‌گیرند.</p>
    </div>
  `;

  app.querySelector('#themeGroup').addEventListener('change', e => {
    const value = e.target.value;
    if (!value) return;
    store.set({ settings: { ...store.get().settings, theme: value } });
    applyTheme();
    app.querySelectorAll('#themeGroup .radio-option').forEach(el => {
      el.classList.toggle('checked', el.querySelector('input').checked);
    });
  });

  app.querySelector('#sizeGroup').addEventListener('change', e => {
    const value = e.target.value;
    if (!value) return;
    store.set({ settings: { ...store.get().settings, fontSize: value } });
    applyFontSize();
    app.querySelectorAll('#sizeGroup .radio-option').forEach(el => {
      el.classList.toggle('checked', el.querySelector('input').checked);
    });
  });

  document.getElementById('exportBtn').onclick = () => {
    const blob = new Blob([store.export()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grammar-progress-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const importInput = document.getElementById('importInput');
  importInput.addEventListener('change', async () => {
    const file = importInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      if (store.import(text)) location.reload();
      else alert('این فایل معتبر نیست.');
    } catch {
      alert('خواندن فایل ناموفق بود.');
    }
  });

  document.getElementById('resetBtn').onclick = () => {
    if (!confirm('همهٔ پیشرفت پاک شود؟')) return;
    if (!confirm('آخرین بار: مطمئنی؟ همهٔ داده‌های محلی حذف می‌شود.')) return;
    store.reset();
    location.hash = '#/';
    location.reload();
  };
}
