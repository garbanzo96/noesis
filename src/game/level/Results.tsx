import { useEffect, useState } from 'react';
import { useKey, useTween } from '../../engine/hooks';
import { Rich, Tex } from '../../engine/Tex';
import { GLYPHS } from '../../content/registry';
import { sfx } from '../audio';
import type { LevelDef, Note } from './types';

export interface ResultsData {
  stars: [boolean, boolean, boolean];
  newStars: boolean[];
  gained: number;
  errors: number;
  hints: number;
  seconds: number;
}

const STAR_LABEL = ['Caso resuelto', 'Sin pistas extra', 'Sin errores'];

export function Results({
  level,
  data,
  notes,
  onRetry,
  onExit,
  onNext,
  nextLabel,
  reduced,
  module,
}: {
  level: LevelDef;
  data: ResultsData;
  notes: Note[];
  onRetry: () => void;
  onExit: () => void;
  onNext?: () => void;
  nextLabel?: string;
  reduced: boolean;
  module?: { name: string; description: string };
}) {
  const [revealed, setRevealed] = useState(reduced ? 3 : 0);
  useEffect(() => {
    sfx.complete();
    if (reduced) return;
    const ids = [0, 1, 2].map((i) =>
      setTimeout(() => {
        setRevealed(i + 1);
        if (data.stars[i]) sfx.star(i);
      }, 800 + i * 380),
    );
    return () => ids.forEach(clearTimeout);
  }, [data.stars, reduced]);
  const xp = useTween(revealed >= 3 ? data.gained : 0, 1.2);
  useKey([' ', 'Enter'], (e) => {
    e.preventDefault();
    (onNext ?? onExit)();
  });
  const mm = Math.floor(data.seconds / 60);
  const ss = String(Math.round(data.seconds % 60)).padStart(2, '0');
  return (
    <div className="results">
      <div className="results-card">
        <div className="results-left">
          <div className="stamp">CASO CERRADO</div>
          <span className="results-kicker">CASO {level.code}</span>
          <h2>{level.title}</h2>
          <div className="stars">
            {data.stars.map((on, i) => (
              <div key={i} className={`star ${i < revealed ? (on ? 'on' : 'off') : 'hidden'} ${data.newStars[i] ? 'new' : ''}`}>
                <svg viewBox="-50 -50 100 100">
                  <path d="M0-44L12-14L44-12L19 8L28 40L0 22L-28 40L-19 8L-44-12L-12-14Z" strokeWidth="3" />
                </svg>
                <small>{STAR_LABEL[i]}</small>
              </div>
            ))}
          </div>
          <div className="results-stats">
            <div>
              <b>+{Math.round(xp)}</b>
              <span>XP</span>
            </div>
            <div>
              <b>{data.errors}</b>
              <span>errores</span>
            </div>
            <div>
              <b>{data.hints}</b>
              <span>pistas</span>
            </div>
            <div>
              <b>
                {mm}:{ss}
              </b>
              <span>tiempo</span>
            </div>
          </div>
          {module && (
            <div className="results-module">
              <span>MUNDO COMPLETADO</span>
              <b>{module.name}</b>
              <p>{module.description}</p>
            </div>
          )}
          <div className="results-actions">
            <button className="btn ghost" onClick={onRetry}>
              Repetir
            </button>
            <button className="btn ghost" onClick={onExit}>
              Tablero
            </button>
            {onNext && (
              <button className="btn primary pulse" onClick={onNext}>
                {nextLabel ?? 'Siguiente caso'} ▸
              </button>
            )}
          </div>
        </div>
        <div className="results-notes">
          <span className="results-notes-title">CUADERNO · {level.subtitle}</span>
          <ol>
            {notes.map((n, i) => (
              <li key={i}>
                <span>{n.label}</span>
                {n.tex && <Tex tex={n.tex} display />}
                {n.body && (
                  <p>
                    <Rich text={n.body} />
                  </p>
                )}
              </li>
            ))}
          </ol>
          {level.glyphs.length > 0 && (
            <div className="results-glyphs">
              {level.glyphs.map((g) => (
                <span key={g} className="glyph-chip" title={GLYPHS[g]?.name}>
                  <Tex tex={GLYPHS[g]?.tex ?? g} />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
