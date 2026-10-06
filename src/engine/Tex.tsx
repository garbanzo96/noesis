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
export function AnimTex({ tex, progress = 1, display = true, className }: { tex: string; progress?: number; display?: boolean; className?: string }) {
  const html = useMemo(() => renderTex(tex, display), [tex, display]);
  const ref = useRef<HTMLSpanElement>(null);
  const hover = useGlyphHover();
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const parts = Array.from(root.querySelectorAll<HTMLElement>('[class*="ap-"]'));
    const idx = (el: HTMLElement) => Number(/(?:^|\s)ap-(\d+)/.exec(el.className)?.[1] ?? 0);
    const n = parts.reduce((m, el) => Math.max(m, idx(el)), 0);
    for (const el of parts) {
      const k = idx(el);
      const t = n ? progress * (n + 0.5) - (k - 1) : 1;
      const o = Math.max(0, Math.min(1, t));
      el.style.opacity = String(o);
      el.style.filter = o < 1 ? `blur(${(1 - o) * 3}px)` : '';
      el.style.textShadow = t > 0 && t < 1.6 ? '0 0 12px currentColor' : '';
      el.style.transition = 'opacity .25s, filter .25s, text-shadow .6s';
    }
  }, [html, progress]);
  return <span ref={ref} className={`tex anim-tex ${display ? 'tex-display' : ''} ${className ?? ''}`} {...hover} dangerouslySetInnerHTML={{ __html: html }} />;
}
