import { Rich, Tex } from '../../engine/Tex';
import type { CodexEntry } from '../level/types';

/** The formal card: definition → properties → conditions → pitfalls → where it appears in AIF. */
export function CodexCard({ entry, compact = false }: { entry: CodexEntry; compact?: boolean }) {
  return (
    <article className={`codex-card ${compact ? 'compact' : ''}`}>
      <header>
        <span className="codex-kicker">CÓDEX · {entry.id.toUpperCase()}</span>
        <h3>{entry.title}</h3>
        <p className="codex-summary">
          <Rich text={entry.summary} />
        </p>
      </header>
      <div className="codex-blocks">
        {entry.blocks.map((b, i) => (
          <section key={i} className="codex-block">
            <h4>{b.label}</h4>
            {b.tex && (
              <div className="codex-tex">
                <Tex tex={b.tex} display />
              </div>
            )}
            {b.body && (
              <p>
                <Rich text={b.body} />
              </p>
            )}
          </section>
        ))}
      </div>
      {entry.pitfalls && entry.pitfalls.length > 0 && (
        <section className="codex-pitfalls">
          <h4>Errores típicos</h4>
          <ul>
            {entry.pitfalls.map((p, i) => (
              <li key={i}>
                <Rich text={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {entry.aif && entry.aif.length > 0 && (
        <section className="codex-aif">
          <h4>En Active Inference</h4>
          {entry.aif.map((a, i) => (
            <div key={i} className="aif-row">
              {a.tex && <Tex tex={a.tex} display />}
              <p>
                <Rich text={a.text} />
              </p>
            </div>
          ))}
        </section>
      )}
    </article>
  );
}
