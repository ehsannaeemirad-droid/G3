import { APP_VERSION } from './config.js';

/* storage key stays v1 on purpose: only cache busting bumps APP_VERSION */
const KEY = 'grammarApp.progress.v1';

const DEFAULT = {
  version: APP_VERSION,
  createdAt: null,
  lessons: {},
  mistakesBank: [],
  activityDays: [],
  settings: {
    lang: 'fa',
    theme: 'auto',
    fontSize: 'medium',
  },
};

let cache = null;

function load() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      cache = structuredClone(DEFAULT);
      cache.createdAt = Date.now();
      save();
      return cache;
    }
    const parsed = JSON.parse(raw);
    cache = { ...structuredClone(DEFAULT), ...parsed };
    return cache;
  } catch {
    cache = structuredClone(DEFAULT);
    cache.createdAt = Date.now();
    return cache;
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('save failed', e);
  }
}

export const store = {
  get: () => load(),
  set(patch) {
    cache = { ...load(), ...patch };
    save();
    return cache;
  },
  patchLesson(lessonId, patch) {
    const s = load();
    s.lessons[lessonId] = { ...(s.lessons[lessonId] || {}), ...patch };
    save();
    return s;
  },
  reset() {
    cache = structuredClone(DEFAULT);
    cache.createdAt = Date.now();
    save();
  },
  addMistake(lessonId, itemId) {
    const s = load();
    const existing = s.mistakesBank.find(m => m.lessonId === lessonId && m.itemId === itemId);
    if (existing) {
      existing.attempts = (existing.attempts || 1) + 1;
      existing.lastWrongAt = Date.now();
      existing.resolvedAt = null;
    } else {
      s.mistakesBank.push({
        lessonId,
        itemId,
        attempts: 1,
        firstWrongAt: Date.now(),
        lastWrongAt: Date.now(),
        resolvedAt: null,
      });
    }
    save();
  },
  resolveMistake(lessonId, itemId) {
    const s = load();
    const m = s.mistakesBank.find(x => x.lessonId === lessonId && x.itemId === itemId);
    if (m && !m.resolvedAt) { m.resolvedAt = Date.now(); save(); }
  },
  unresolvedMistakes() {
    return load().mistakesBank.filter(m => !m.resolvedAt);
  },
  trackActivity() {
    const s = load();
    const day = new Date().toISOString().slice(0, 10);
    if (!s.activityDays) s.activityDays = [];
    if (!s.activityDays.includes(day)) { s.activityDays.push(day); save(); }
  },
  export() {
    return JSON.stringify(load(), null, 2);
  },
  import(json) {
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed !== 'object' || !parsed.version) throw new Error('bad json');
      cache = parsed;
      save();
      return true;
    } catch (e) {
      console.warn('import failed', e);
      return false;
    }
  },
};
