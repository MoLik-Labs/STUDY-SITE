/* =========================================================
   BRAND — Study Focus Fox
   ---------------------------------------------------------
   One module owns the identity so nothing drifts: the product
   name, the pixel mark, the tagline, and the document title.

   The mark is a 16x16 grid. It is drawn from data, not from an
   image file, because:
     · a single HTML file must not depend on a second request;
     · CSP stays strict (no external image host);
     · it scales to any size with crispEdges semantics — no blur.
   Only the left half is stored; the right is mirrored, so the
   fox can never come out asymmetric by accident.
   ========================================================= */

const BRAND = {
  name: 'Study Focus Fox',
  short: 'Focus Fox',
  tagline: { vi: 'Tập trung sâu · Nhớ lâu hơn', en: 'Focus deep · Remember longer' },
  /* palette — must stay in sync with the CSS custom properties */
  colors: { fox: '#c6542d', deep: '#a53e20', ink: '#17150f', cream: '#fcf9f2' },
};

/* Left half of the 16x16 mark. Mirrored at render time.
   Legend: o = fox, d = deep shadow, k = ink (eyes, nose), w = cream muzzle */
const BRAND_MARK_HALF = [
  /* v5. Everything here was chosen after looking at it rendered, which is
     the only way to judge a 16px mark:
       · ears cut steeply inward — an upright triangle reads as a cat;
       · the skull dips between the ears, then flares to cheek tufts;
       · eyes 2x2 and horizontal — a 1px slit reads as a mask, not a face;
       · the white cheek band sits on the OUTER edge and never encloses,
         because an enclosed white blob read as a cat's muzzle;
       · nothing at the exact bottom centre — the apex is the nose. */
  '..o.....',
  '..oo....',
  '.odo....',
  '.oodo...',
  '.ooodo..',
  'oooooo..',
  'ooooooo.',
  'oooooooo',
  '.oookkoo',
  '.oookkoo',
  '..wwoooo',
  '...wwooo',
  '....wwoo',
  '.....wwo',
  '......wo',
  '.......k',
];

const BRAND_MARK_CLASS = { o: 'c1', d: 'c2', k: 'c3', w: 'c4' };

/* Render the mark as a grid of spans. CSS paints each cell. */
function brandMarkHtml(label) {
  const rows = BRAND_MARK_HALF.map(half => half + half.split('').reverse().join(''));
  const cells = rows.map(r => `<span>${[...r].map(c =>
    c === '.' ? '<i></i>' : `<i class="${BRAND_MARK_CLASS[c]}"></i>`).join('')}</span>`).join('');
  return `<span class="px-mark"${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"'}>${cells}</span>`;
}

const GM_SPRITE_MARK = brandMarkHtml('');

/* Keep the browser tab and the <html> element in step with the brand.
   Called on every render, so a route change cannot leave a stale title. */
function syncBrandChrome() {
  const L = typeof i18nLang === 'function' ? i18nLang() : 'vi';
  const tag = BRAND.tagline[L] || BRAND.tagline.vi;
  try {
    document.documentElement.setAttribute('data-brand', 'focusfox');
    document.documentElement.setAttribute('lang', L);
    /* The first title comes from the static <head>, baked at build time in
       Vietnamese. Remember it once, then always regenerate it from the live
       language, otherwise switching to English leaves a Vietnamese tab —
       the one piece of chrome the in-page language switch used to miss. */
    if (!BRAND._title0) BRAND._title0 = document.title;
    const base = BRAND._title0 || '';
    /* Routes that set their own title are left alone; the home title is the
       only one built from the tagline. */
    if (!base || /Study Focus Fox/.test(base)) {
      document.title = BRAND.name + ' — ' + tag;
    }
  } catch (e) { }
}
