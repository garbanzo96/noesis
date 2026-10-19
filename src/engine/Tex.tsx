import katex from 'katex';
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';

// Every formula in the game goes through here. Two conventions make formulas playable:
//   \g{id}{...}      tags a glyph: hovering it opens the lexicon entry `id`.
//   \Cin{...} etc.   semantic colors (see palette.ts) driven by CSS classes.
// The Forge additionally uses \htmlData{n=path}{...} to make subexpressions clickable.
const MACROS: Record<string, string> = {
  '\\g': '\\htmlData{g=#1}{#2}',
  '\\Cin': '\\htmlClass{k-in}{#1}',
  '\\Cout': '\\htmlClass{k-out}{#1}',
  '\\Cbel': '\\htmlClass{k-bel}{#1}',
  '\\Clog': '\\htmlClass{k-log}{#1}',
  '\\Cok': '\\htmlClass{k-ok}{#1}',
  '\\Cbad': '\\htmlClass{k-bad}{#1}',
  '\\Cop': '\\htmlClass{k-op}{#1}',
  '\\Cdim': '\\htmlClass{k-dim}{#1}',
  '\\R': '\\mathbb{R}',
  '\\N': '\\mathbb{N}',
  '\\Z': '\\mathbb{Z}',
  '\\softmax': '\\operatorname{softmax}',
  // animated parts: \p{2}{x^2} appears as part 2 of the formula (see AnimTex)
  '\\p': '\\htmlClass{ap-#1}{#2}',
  // lesson colours, matching the stage palette
  '\\cC': '\\htmlClass{lc-c}{#1}',
  '\\cA': '\\htmlClass{lc-a}{#1}',
  '\\cM': '\\htmlClass{lc-m}{#1}',
  '\\cG': '\\htmlClass{lc-g}{#1}',
  '\\cV': '\\htmlClass{lc-v}{#1}',
  '\\cR': '\\htmlClass{lc-r}{#1}',
  '\\cB': '\\htmlClass{lc-b}{#1}',
  '\\argmax': '\\operatorname*{arg\\,max}',
};

const cache = new Map<string, string>();
export function renderTex(tex: string, display = false): string {
  const key = (display ? 'D' : 'I') + tex;
  const hit = cache.get(key);
  if (hit) return hit;
  let html: string;
  try {
    html = katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      strict: 'ignore',
      trust: (ctx) => ctx.command === '\\htmlData' || ctx.command === '\\htmlClass',
      macros: { ...MACROS },
      output: 'html',
    });
  } catch {
    html = tex;
  }
  if (cache.size > 4000) cache.clear();
  cache.set(key, html);
  return html;
}

/** Lets the game layer show the lexicon card for a hovered glyph. */
export interface GlyphApi {
  show: (id: string, rect: DOMRect) => void;
  hide: () => void;
}
export const GlyphContext = createContext<GlyphApi | null>(null);

export function useGlyphHover() {
  const api = useContext(GlyphContext);
  return {
    onMouseOver: (e: MouseEvent) => {
      if (!api) return;
      const el = (e.target as HTMLElement).closest('[data-g]') as HTMLElement | null;
      if (el) api.show(el.dataset.g!, el.getBoundingClientRect());
    },
    onMouseOut: (e: MouseEvent) => {
      if (!api) return;
      const from = (e.target as HTMLElement).closest('[data-g]');
      const to = (e.relatedTarget as HTMLElement | null)?.closest?.('[data-g]');
      if (from && from !== to) api.hide();
    },
  };
}

export function Tex({
  tex,
  display = false,
  className,
  style,
}: {
  tex: string;
  display?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const html = useMemo(() => renderTex(tex, display), [tex, display]);
  const hover = useGlyphHover();
  return (
    <span
      className={`tex ${display ? 'tex-display' : ''} ${className ?? ''}`}
      style={style}
      {...hover}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Formula that cross-fades and scans when its content changes (TransformMatchingTex-lite). */
export function MorphTex({
  tex,
  display = true,
  className,
  style,
}: {
  tex: string;
  display?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const [layers, setLayers] = useState<{ tex: string; id: number; out: boolean }[]>([
    { tex, id: 0, out: false },
  ]);
  const counter = useRef(0);
  useEffect(() => {
    setLayers((ls) => {
      if (ls[ls.length - 1]?.tex === tex) return ls;
      counter.current += 1;
      return [...ls.map((l) => ({ ...l, out: true })), { tex, id: counter.current, out: false }];
    });
    const id = setTimeout(() => setLayers((ls) => ls.filter((l) => !l.out)), 450);
    return () => clearTimeout(id);
  }, [tex]);
  const hover = useGlyphHover();
  return (
    <span className={`morph ${className ?? ''}`} style={style} {...hover}>
      {layers.map((l) => (
        <span
          key={l.id}
          className={`morph-layer ${l.out ? 'morph-out' : 'morph-in'} ${display ? 'tex-display' : ''}`}
          dangerouslySetInnerHTML={{ __html: renderTex(l.tex, display) }}
        />
      ))}
    </span>
  );
}

/** Inline text with $...$ math segments. */
export function Rich({ text, className }: { text: string; className?: string }) {
  const parts = useMemo(() => {
    const out: { math: boolean; s: string }[] = [];
    const re = /\$([^$]+)\$/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push({ math: false, s: text.slice(last, m.index) });
      out.push({ math: true, s: m[1] });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ math: false, s: text.slice(last) });
    return out;
  }, [text]);
  const hover = useGlyphHover();
  return (
    <span className={className} {...hover}>
      {parts.map((p, i) =>
        p.math ? (
          <span key={i} className="tex" dangerouslySetInnerHTML={{ __html: renderTex(p.s) }} />
        ) : (
          <Fragmented key={i} s={p.s} />
        ),
      )}
    </span>
  );
}

// **bold** support inside rich text, nothing more.
function Fragmented({ s }: { s: string }) {
  const bits = s.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {bits.map((b, i) =>
        b.startsWith('**') && b.endsWith('**') ? <strong key={i}>{b.slice(2, -2)}</strong> : b,
      )}
    </>
  );
}

/**
 * A formula whose parts appear in order. Parts are marked in TeX with \p{1}{...}, \p{2}{...};
 * `progress` (0..1) reveals them one after another with a short fade; unmarked TeX is always
 * visible. Lets the blackboard build an equation term by term in sync with the animation.
 */
/** one colour per explained part, in order (palette: cyan, amber, magenta, green, violet, blue) */
const PART_COLORS = ['#28e7fa', '#ffbc5e', '#ff3ba7', '#4dffa6', '#a88aff', '#6f9cff'];
const partOf = (el: HTMLElement) => Number(/(?:^|\s)ap-(\d+)/.exec(el.className)?.[1] ?? 0);

export function AnimTex({
  tex,
  progress = 1,
  display = true,
  className,
  labels,
}: {
  tex: string;
  progress?: number;
  display?: boolean;
  className?: string;
  /** what each \p{n} part means: drawn under it with a brace, in its colour, as it is written */
  labels?: string[];
}) {
  const html = useMemo(() => renderTex(tex, display), [tex, display]);
  const ref = useRef<HTMLSpanElement>(null);
  const wrap = useRef<HTMLSpanElement>(null);
  const hover = useGlyphHover();
  const [marks, setMarks] = useState<
    { k: number; x: number; w: number; y: number; up: boolean; c: string }[]
  >([]);
  const [lit, setLit] = useState(0);
  const explained = !!labels?.length;
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const parts = Array.from(root.querySelectorAll<HTMLElement>('[class*="ap-"]'));
    const n = parts.reduce((m, el) => Math.max(m, partOf(el)), 0);
    let shown = 0;
    for (const el of parts) {
      const k = partOf(el);
      const t = n ? progress * (n + 0.5) - (k - 1) : 1;
      const o = Math.max(0, Math.min(1, t));
      if (o > 0) shown = Math.max(shown, k);
      el.style.opacity = String(Math.min(1, o * 2));
      // each part is written left to right, as in Manim's Write
      el.style.clipPath = o < 1 ? `inset(-30% ${(1 - o) * 100}% -30% -2%)` : '';
      el.style.filter = '';
      el.style.textShadow = t > 0 && t < 1.6 ? '0 0 14px currentColor' : '';
      el.style.transition = 'text-shadow .6s';
    }
    // in an explained formula each part wears the colour of its brace, so term and label match
    if (explained)
      for (const el of parts) {
        el.classList.add('part-tint');
        el.style.color = PART_COLORS[(partOf(el) - 1) % PART_COLORS.length];
      }
    setLit(shown);
    // formulas without marked parts are written left to right as a whole
    const w = n ? 1 : Math.max(0, Math.min(1, progress * 1.25));
    root.style.clipPath = w < 1 ? `inset(-20% ${(1 - w) * 100}% -20% 0)` : '';
  }, [html, progress, explained]);
  // where each explained part sits, in the wrapper's own (unzoomed) units
  useLayoutEffect(() => {
    const root = ref.current;
    const box = wrap.current;
    if (!explained || !root || !box) return setMarks([]);
    const measure = () => {
      const rb = box.getBoundingClientRect();
      const zoom = box.offsetWidth ? rb.width / box.offsetWidth : 1;
      const groups = new Map<number, { l: number; r: number; t: number; b: number; c: string }>();
      for (const el of Array.from(root.querySelectorAll<HTMLElement>('[class*="ap-"]'))) {
        const k = partOf(el);
        // KaTeX shifts fractions and scripts inside their box: measure the glyphs, not the wrapper
        const glyphs = Array.from(
          el.querySelectorAll<HTMLElement>(
            '.mord, .mbin, .mrel, .mop, .mopen, .mclose, .mpunct, .frac-line',
          ),
        );
        for (const q of (glyphs.length ? glyphs : [el]).map((e) => e.getBoundingClientRect())) {
          if (!q.width) continue;
          const g = groups.get(k) ?? {
            l: Infinity,
            r: -Infinity,
            t: Infinity,
            b: -Infinity,
            c: PART_COLORS[(k - 1) % PART_COLORS.length],
          };
          groups.set(k, {
            l: Math.min(g.l, q.left),
            r: Math.max(g.r, q.right),
            t: Math.min(g.t, q.top),
            b: Math.max(g.b, q.bottom),
            c: g.c,
          });
        }
      }
      const list = [...groups.entries()].sort((a, b) => a[0] - b[0]);
      const top = Math.min(...list.map(([, g]) => g.t));
      const bottom = Math.max(...list.map(([, g]) => g.b));
      // a term in the upper half (a numerator, an exponent) is braced from above, the rest from below
      setMarks(
        list.map(([k, g]) => {
          const up = list.length > 1 && g.b <= (top + bottom) / 2 + 2;
          return {
            k,
            x: (g.l - rb.left) / zoom,
            w: (g.r - g.l) / zoom,
            y: ((up ? g.t : g.b) - rb.top) / zoom,
            up,
            c: g.c,
          };
        }),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, [html, explained]);
  // labels sit on shared lines under (or over) the formula, each on the first row where it fits
  const layout = useMemo(() => {
    const below = marks.filter((m) => !m.up);
    const above = marks.filter((m) => m.up);
    const baseBelow = Math.max(0, ...below.map((m) => m.y));
    const baseAbove = Math.min(Infinity, ...above.map((m) => m.y));
    const rows = new Map<number, number>();
    for (const group of [below, above]) {
      const ends: number[] = [];
      for (const m of [...group].sort((a, b) => a.x - b.x)) {
        const half = ((labels?.[m.k - 1]?.length ?? 0) * 6.6 + 8) / 2;
        const c = m.x + m.w / 2;
        let row = ends.findIndex((end) => end < c - half);
        if (row < 0) row = ends.length;
        ends[row] = c + half + 8;
        rows.set(m.k, Math.min(row, 2));
      }
    }
    return { baseBelow, baseAbove, rows };
  }, [marks, labels]);
  return (
    <span ref={wrap} className={`anim-tex-wrap ${explained ? 'explained' : ''}`}>
      <span
        ref={ref}
        className={`tex anim-tex ${display ? 'tex-display' : ''} ${className ?? ''}`}
        {...hover}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {explained && marks.length > 0 && (
        <span className="part-notes" aria-hidden>
          {marks.map(({ k, x, w, y, up, c }) => {
            const label = labels![k - 1];
            if (!label) return null;
            const ww = Math.max(w, 8);
            return (
              <span
                key={k}
                className={`part-note ${up ? 'up' : ''} ${k <= lit ? 'on' : ''} ${k === lit ? 'now' : ''}`}
                style={{ left: x, top: y, width: ww, ['--part' as string]: c }}
              >
                <svg viewBox={`0 0 ${ww} 10`} width={ww} height={10}>
                  <path
                    d={`M1 1Q1 5 5 5H${ww / 2 - 4}Q${ww / 2} 5 ${ww / 2} 9Q${ww / 2} 5 ${ww / 2 + 4} 5H${ww - 5}Q${ww - 1} 5 ${ww - 1} 1`}
                  />
                </svg>
                <span
                  className="part-label"
                  style={
                    up
                      ? { bottom: y - layout.baseAbove + 14 + (layout.rows.get(k) ?? 0) * 17 }
                      : { top: layout.baseBelow - y + 14 + (layout.rows.get(k) ?? 0) * 17 }
                  }
                >
                  {label}
                </span>
              </span>
            );
          })}
        </span>
      )}
    </span>
  );
}
