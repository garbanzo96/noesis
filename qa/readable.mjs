// Runs in the page. What the player reads must have nothing on top of it and must be on screen or
// reachable by scrolling. Scrolling boxes are checked again at their far end, and the ones that need
// it are reported as ['scroll', px]; a page that scrolls sideways as ['ancho', px].
export function readable() {
  const txt = (e) => e.textContent.trim().slice(0, 36);
  const canScroll = (p) => p.scrollHeight > p.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(p).overflowY);
  const scrollerOf = (e) => {
    for (let p = e.parentElement; p; p = p.parentElement) if (canScroll(p)) return p;
    return null;
  };
  const root = document.querySelector('.overlay, .results') ?? document.querySelector('.play, .scene') ?? document.body;
  const scan = () => {
    const found = new Map();
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const el = n.parentElement;
      if (!n.textContent.trim() || el.closest('.stage-overlay, svg, .katex-mathml, .sr-only, .solved-flash')) continue;
      if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < 12 && !el.closest('.katex')) found.set('c' + txt(el), ['chica', txt(el), size]);
      const range = document.createRange();
      range.selectNodeContents(n);
      const scroller = scrollerOf(el);
      const view = scroller?.getBoundingClientRect();
      for (const r of range.getClientRects()) {
        if (r.width < 2 || r.height < 2) continue;
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        if (view && (y < view.top || y > view.bottom || x < view.left || x > view.right)) continue;
        const top = x >= 0 && y >= 0 && x <= innerWidth && y <= innerHeight ? document.elementFromPoint(x, y) : null;
        if (!top) {
          if (!el.closest('.rail')) found.set('p' + txt(el), ['pantalla', txt(el)]);
          continue;
        }
        if (top === el || el.contains(top) || top.contains(el)) continue;
        // KaTeX lays out with struts that paint nothing
        const box = top.getBoundingClientRect();
        if (box.width < 1 || box.height < 1 || top.classList.contains('vlist-s')) continue;
        if (el.closest('.katex') && el.closest('.katex') === top.closest('.katex')) continue;
        found.set('t' + txt(el), ['tapado', txt(el), (top.getAttribute('class') ?? top.tagName).slice(0, 30)]);
      }
    }
    return [...found.values()];
  };
  const out = scan();
  for (const s of root.querySelectorAll('*')) {
    if (!canScroll(s) || s.closest('.rail')) continue;
    const extra = s.scrollHeight - s.clientHeight;
    out.push(['scroll', extra]);
    const was = s.scrollTop;
    s.scrollTop = extra;
    out.push(...scan());
    s.scrollTop = was;
  }
  const wide = document.documentElement.scrollWidth - innerWidth;
  if (wide > 1) out.push(['ancho', wide]);
  return out;
}
