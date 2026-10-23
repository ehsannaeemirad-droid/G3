import { APP_VERSION } from './config.js';

const cache = new Map();

/* version.json is fetched fresh (no-store) once per page load and used to
 * cache-bust lesson JSON fetches. Falls back to APP_VERSION when offline
 * with no service worker yet. Bump it together with CACHE_VERSION in sw.js. */
let appVersion = null;
async function getVersion() {
  if (appVersion !== null) return appVersion;
  try {
    const res = await fetch('./version.json', { cache: 'no-store' });
    const { v } = await res.json();
    appVersion = v;
  } catch {
    appVersion = APP_VERSION;
  }
  return appVersion;
}

export async function loadIndex() {
  if (cache.has('__index')) return cache.get('__index');
  const v = await getVersion();
  const res = await fetch(`./data/lessons-index.json?v=${v}`);
  if (!res.ok) throw new Error('lessons-index.json not found');
  const data = await res.json();
  cache.set('__index', data);
  return data;
}

export async function loadLesson(id) {
  if (cache.has(id)) return cache.get(id);
  const v = await getVersion();
  const res = await fetch(`./data/lessons/${id}.json?v=${v}`);
  if (!res.ok) throw new Error(`درس «${id}» پیدا نشد`);
  const data = await res.json();
  cache.set(id, data);
  return data;
}

export async function getLessonMeta(id) {
  const index = await loadIndex();
  return index.lessons.find(l => l.id === id) || null;
}
