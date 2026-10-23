const routes = new Map();
const patterns = [];
let notFound = null;
let activeNav = null;
let onChange = null;

export const router = {
  add(path, handler, navId = null) {
    routes.set(path, { handler, navId });
    return router;
  },
  addPattern(pattern, handler, navId = null) {
    const keys = [...pattern.matchAll(/:([^/]+)/g)].map(m => m[1]);
    const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$');
    patterns.push({ regex, keys, handler, navId });
    return router;
  },
  fallback(handler) {
    notFound = { handler, navId: null };
    return router;
  },
  onChange(fn) {
    onChange = fn;
    return router;
  },
  parse() {
    const raw = location.hash.replace(/^#/, '') || '/';
    return raw.startsWith('/') ? raw : '/' + raw;
  },
  navigate(path) {
    if (location.hash === '#' + path) {
      render();
    } else {
      location.hash = path;
    }
  },
  start() {
    window.addEventListener('hashchange', render);
    render();
  },
};

function render() {
  const path = router.parse();
  let route = routes.get(path);

  if (!route) {
    for (const p of patterns) {
      const m = path.match(p.regex);
      if (m) {
        const params = {};
        p.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
        route = { handler: () => p.handler(params), navId: p.navId };
        break;
      }
    }
  }

  if (!route) route = notFound;
  if (!route) return;

  if (route.navId !== activeNav) {
    activeNav = route.navId;
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.classList.toggle('active', el.dataset.nav === activeNav);
    });
  }

  route.handler();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
