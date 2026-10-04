import katex from 'katex';
import {
  createContext,
  useContext,
  useEffect,
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
