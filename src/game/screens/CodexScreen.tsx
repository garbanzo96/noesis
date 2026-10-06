import { useMemo, useState } from 'react';
import { useKey } from '../../engine/hooks';
import { Rich, Tex } from '../../engine/Tex';
import { CODEX_LIST, GLYPH_LIST, LEVELS } from '../../content/registry';
import { useGame } from '../state';
import { CodexCard } from '../ui/CodexCard';

/** Codex (formal cards collected by playing) and Lexicon (every symbol, always readable). */
export function CodexScreen({ onClose }: { onClose: () => void }) {
  const game = useGame();
  const [tab, setTab] = useState<'cards' | 'lexicon'>('cards');
  const [q, setQ] = useState('');
  const unlocked = (id: string) => game.settings.freeMode || game.codex.includes(id);
  const firstOpen = CODEX_LIST.find((c) => unlocked(c.id));
  const [open, setOpen] = useState<string | null>(firstOpen?.id ?? null);
  useKey('Escape', onClose);
  const needle = q.trim().toLowerCase();
  const cards = useMemo(
    () =>
      CODEX_LIST.filter(
        (c) => !needle || c.title.toLowerCase().includes(needle) || c.summary.toLowerCase().includes(needle),
      ),
    [needle],
  );
  const glyphs = useMemo(
    () =>
      GLYPH_LIST.filter(
        (g) => !needle || g.name.toLowerCase().includes(needle) || g.meaning.toLowerCase().includes(needle),
      ),
    [needle],
  );
  const entry = CODEX_LIST.find((c) => c.id === open);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="codex-screen" onClick={(e) => e.stopPropagation()}>
        <header className="codex-head">
          <div className="tabs">
            <button className={tab === 'cards' ? 'on' : ''} onClick={() => setTab('cards')}>
              Fichas · {game.codex.length}/{CODEX_LIST.length}
            </button>
            <button className={tab === 'lexicon' ? 'on' : ''} onClick={() => setTab('lexicon')}>
              Léxico · {game.glyphs.length}/{GLYPH_LIST.length}
            </button>
          </div>
          <input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn ghost small" onClick={onClose}>
            Cerrar <kbd>Esc</kbd>
          </button>
        </header>
        {tab === 'cards' ? (
          <div className="codex-body">
            <nav className="codex-list">
              {cards.length === 0 && <p className="muted">Aún no hay fichas.</p>}
              {cards.map((c) => {
                const u = unlocked(c.id);
                return (
                  <button
                    key={c.id}
                    className={`codex-item ${open === c.id ? 'on' : ''} ${u ? '' : 'locked'}`}
                    onClick={() => u && setOpen(c.id)}
                  >
                    <span>{LEVELS[c.level]?.code ?? ''}</span>
                    {u ? c.title : '▒▒▒▒▒▒▒'}
                    {!u && <small>completa {LEVELS[c.level]?.code}</small>}
                  </button>
                );
              })}
            </nav>
            <div className="codex-view">
              {entry && unlocked(entry.id) ? (
                <CodexCard entry={entry} />
              ) : (
                <p className="muted">Completa protocolos para archivar fichas. El léxico está siempre disponible.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="lexicon">
            {glyphs.map((g) => {
              const known = game.glyphs.includes(g.id);
              return (
                <div key={g.id} className={`lex ${known ? 'known' : ''}`}>
                  <div className="lex-sym">
                    <Tex tex={g.tex} />
                  </div>
                  <div className="lex-body">
                    <b>{g.name}</b>
                    <small>«{g.read}»</small>
                    <p>
                      <Rich text={g.meaning} />
                    </p>
                    {g.warn && (
                      <p className="glyph-warn">
                        ⚠ <Rich text={g.warn} />
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
