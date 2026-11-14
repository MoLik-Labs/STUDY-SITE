(async () => {
  const S = ms => new Promise(r => setTimeout(r, ms));
  const out = { errors: [], routes: [] };
  window.__qaErrors = [];
  window.addEventListener('error', e => window.__qaErrors.push(e.message));
  const routes = ['#/', '#/exam', '#/review', '#/stats', '#/papers', '#/qa', '#/solve', '#/calc', '#/lab', '#/build', '#/sim', '#/subjects', '#/subject/9/vatli', '#/read/seed0', '#/studio', '#/mine', '#/files', '#/study', '#/cards', '#/practice', '#/plan', '#/focus', '#/progress', '#/timetable', '#/calendar', '#/about', '#/flash', '#/notes', '#/library', '#/settings'];
  for (const r of routes) {
    if (location.hash === r) { location.hash = '#/'; await S(150); }
    location.hash = r; await S(650);
    const de = document.documentElement;
    const over = de.scrollWidth - window.innerWidth;
    const inScroller = el => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (/auto|scroll/.test(cs.overflowX)) return true;
      }
      return false;
    };
    const clipped = [...document.querySelectorAll('#main *')].filter(el => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && (b.right > window.innerWidth + 2 || b.left < -2)
        && getComputedStyle(el).position !== 'fixed' && !inScroller(el)
        && !el.closest('svg');
    }).slice(0, 4).map(el => el.className || el.tagName);
    out.routes.push({ r, over, clipped, h: Math.round(de.scrollHeight) });
  }
  out.errors = window.__qaErrors;
  return out;
})()
