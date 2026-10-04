import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { GlyphContext, Rich, Tex } from '../../engine/Tex';
import { GLYPHS } from '../../content/registry';

/** Hovering any tagged symbol (\g{id}{...}) shows its lexicon entry. */
export function GlyphProvider({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<{ id: string; rect: DOMRect } | null>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const show = useCallback((id: string, rect: DOMRect) => {
    window.clearTimeout(hideTimer.current);
    if (GLYPHS[id]) setTip({ id, rect });
  }, []);
  const hide = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setTip(null), 120);
  }, []);
  const api = useMemo(() => ({ show, hide }), [show, hide]);
  const g = tip ? GLYPHS[tip.id] : null;
  let style: React.CSSProperties = {};
  if (tip) {
    const w = 340;
    const left = Math.min(window.innerWidth - w - 12, Math.max(12, tip.rect.left + tip.rect.width / 2 - w / 2));
    const below = tip.rect.top < 260;
    style = below
      ? { left, top: tip.rect.bottom + 10, width: w }
      : { left, top: tip.rect.top - 10, width: w, transform: 'translateY(-100%)' };
  }
  return (
    <GlyphContext.Provider value={api}>
      {children}
      {g && (
        <div className="glyph-tip" style={style} role="tooltip">
          <div className="glyph-tip-head">
            <span className="glyph-tip-sym">
              <Tex tex={g.tex} />
            </span>
            <div>
              <b>{g.name}</b>
              <small>se lee: «{g.read}»</small>
            </div>
          </div>
          <p>
            <Rich text={g.meaning} />
          </p>
          {g.warn && (
            <p className="glyph-warn">
              ⚠ <Rich text={g.warn} />
            </p>
          )}
          {g.aif && (
            <p className="glyph-aif">
              AIF · <Rich text={g.aif} />
            </p>
          )}
        </div>
      )}
    </GlyphContext.Provider>
  );
}
