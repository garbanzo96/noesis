import { useMemo, useRef, useState, type MouseEvent } from 'react';
import { useKey } from '../../engine/hooks';
import { Rich, Tex, renderTex } from '../../engine/Tex';
import {
  RULE_BY_ID,
  applyAt,
  children,
  loadPuzzle,
  parsePathKey,
  pathKey,
  reached,
  toTex,
  type Expr,
  type Path,
} from '../../forge';
import { sfx } from '../audio';
import { Console, KeyHint } from './Console';
import { INTEGRITY, Integrity } from './ChallengePlayer';
import { useRun } from './context';
import type { ForgeStep } from './types';

function allPaths(e: Expr, p: Path = [], out: Path[] = []): Path[] {
  out.push(p);
  children(e).forEach((c, i) => allPaths(c, [...p, i], out));
  return out;
}

interface Line {
  expr: Expr;
  rule?: string;
  fresh?: string[];
}

/**
 * The Forge: derive an identity by applying rules to subexpressions.
 * Select a node (click; click again to widen) and press a lit rule, or press a rule first
 * and pick among the highlighted targets. Blocked rules state the violated condition.
 */
export function ForgePlayer({ step }: { step: ForgeStep }) {
  const run = useRun();
  const [k, setK] = useState(0);
  const puzzle = step.puzzles[k];
  const loaded = useMemo(() => loadPuzzle(puzzle), [puzzle]);
  const [lines, setLines] = useState<Line[]>(() => [{ expr: loaded.start }]);
  const [sel, setSel] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [integrity, setIntegrity] = useState(INTEGRITY);
  const [msg, setMsg] = useState<{ text: string; tone?: 'ok' | 'bad' | 'hint' | 'info' } | null>(null);
  const [shownHints, setShownHints] = useState(0);
  const [solved, setSolved] = useState(false);
  const lastClick = useRef<string | null>(null);

  const cur = lines[lines.length - 1].expr;
  const moves = lines.length - 1;
  const paths = useMemo(() => allPaths(cur), [cur]);

  const matches = useMemo(() => {
    const out: Record<string, { ok: string[]; blocked: string[] }> = {};
    for (const id of puzzle.rules) {
      const r = { ok: [] as string[], blocked: [] as string[] };
      for (const p of paths) {
        const m = applyAt(cur, p, id);
        if (m) (m.ok ? r.ok : r.blocked).push(pathKey(p));
      }
      out[id] = r;
    }
    return out;
  }, [cur, paths, puzzle.rules]);

  const status = (id: string): 'ok' | 'blocked' | 'no' => {
    const m = matches[id];
    if (!m) return 'no';
    if (sel) return m.ok.includes(sel) ? 'ok' : m.blocked.includes(sel) ? 'blocked' : 'no';
    return m.ok.length ? 'ok' : m.blocked.length ? 'blocked' : 'no';
  };

  const resetPuzzle = (idx = k) => {
    const L = loadPuzzle(step.puzzles[idx]);
    setLines([{ expr: L.start }]);
    setSel(null);
    setPending(null);
    setMsg(null);
    setShownHints(0);
    setSolved(false);
  };

  const commit = (path: string, ruleId: string) => {
    const m = applyAt(cur, parsePathKey(path), ruleId);
    if (!m) {
      sfx.glitch();
      setMsg({ text: `**${RULE_BY_ID[ruleId].name}** no se aplica a esa subexpresión.`, tone: 'info' });
      return;
    }
    if (!m.ok) {
      sfx.bad();
      run.error();
      const left = integrity - 1;
      setIntegrity(left);
      setMsg({ text: `Bloqueado: ${m.reason}`, tone: 'bad' });
      if (left <= 0) {
        sfx.glitch();
        setMsg({ text: 'Integridad agotada. La derivación se reinicia.', tone: 'bad' });
        setTimeout(() => {
          setIntegrity(INTEGRITY);
          resetPuzzle();
        }, 1400);
      }
      return;
    }
    sfx.snap();
    const next: Line = { expr: m.expr, rule: ruleId, fresh: m.fresh };
    setLines((ls) => [...ls, next]);
    setSel(null);
    setPending(null);
    if (reached(m.expr, loaded.goal)) {
      setSolved(true);
      setTimeout(() => sfx.ok(2), 120);
      const par = moves + 1 <= puzzle.par ? ' Dentro del par.' : ` Par: ${puzzle.par}.`;
      setMsg({ text: `∎ Identidad derivada en ${moves + 1} movimientos.${par} ${puzzle.bridge ?? ''}`, tone: 'ok' });
    } else setMsg(null);
  };

  const pressRule = (id: string) => {
    if (solved) return;
    sfx.click();
    if (sel) return commit(sel, id);
    const m = matches[id];
    const targets = [...m.ok, ...m.blocked];
    if (targets.length === 0) {
      sfx.glitch();
      setMsg({ text: `**${RULE_BY_ID[id].name}** no encuentra dónde aplicarse en esta expresión.`, tone: 'info' });
      return;
    }
    if (targets.length === 1) return commit(targets[0], id);
    setPending(id);
    setMsg({ text: `Elige dónde aplicar **${RULE_BY_ID[id].name}**: las subexpresiones posibles brillan.`, tone: 'info' });
  };

  const nodeFromEvent = (e: MouseEvent) =>
    ((e.target as HTMLElement).closest('[data-n]') as HTMLElement | null)?.dataset.n ?? null;

  const clickExpr = (e: MouseEvent) => {
    e.stopPropagation();
    if (solved) return;
    const n = nodeFromEvent(e);
    if (!n) return;
    if (pending) {
      const m = matches[pending];
      // accept the clicked node or its nearest candidate ancestor
      let p = parsePathKey(n);
      while (true) {
        const key = pathKey(p);
        if (m.ok.includes(key) || m.blocked.includes(key)) return commit(key, pending);
        if (!p.length) break;
        p = p.slice(0, -1);
      }
      sfx.glitch();
      return;
    }
    sfx.select();
    if (lastClick.current === n && sel) {
      // repeated clicks on the same spot widen the selection outward
      const p = parsePathKey(sel);
      setSel(p.length ? pathKey(p.slice(0, -1)) : sel);
    } else setSel(n);
    lastClick.current = n;
    setMsg(null);
  };

  const undo = () => {
    if (lines.length <= 1 || solved) return;
    sfx.click();
    setLines((ls) => ls.slice(0, -1));
    setSel(null);
    setPending(null);
  };
  const nextPuzzle = () => {
    if (!solved) return;
    if (k + 1 < step.puzzles.length) {
      sfx.advance();
      setK(k + 1);
      resetPuzzle(k + 1);
    } else run.complete();
  };
  const hints = puzzle.hints ?? [];
  const revealHint = () => {
    if (shownHints >= hints.length || solved) return;
    sfx.hint();
    run.hint();
    setShownHints(shownHints + 1);
  };

  const active = !run.paused;
  useKey(['1', '2', '3', '4', '5', '6', '7', '8', '9'], (e) => {
    const id = puzzle.rules[Number(e.key) - 1];
    if (id) pressRule(id);
  }, active && !solved);
  useKey(['z', 'Z', 'Backspace'], undo, active);
  useKey(['r', 'R'], () => !solved && resetPuzzle(), active);
  useKey(['h', 'H'], revealHint, active);
  useKey('ArrowUp', () => {
    if (!sel) return;
    const p = parsePathKey(sel);
    if (p.length) setSel(pathKey(p.slice(0, -1)));
  }, active);
  useKey([' ', 'Enter'], (e) => {
    if (!solved) return;
    e.preventDefault();
    nextPuzzle();
  }, active);

  const activeTex = toTex(cur, {
    interactive: !solved,
    selected: sel,
    hover,
    fresh: lines[lines.length - 1].fresh,
    cands: pending ? [...(matches[pending]?.ok ?? []), ...(matches[pending]?.blocked ?? [])] : [],
  });

  return (
    <div className="play">
      <div className={`play-stage forge ${solved ? 'solved' : ''}`} onClick={() => !pending && setSel(null)}>
        <div className="forge-top">
          <div>
            <span className="forge-tag">
              FORJA · DERIVACIÓN {k + 1}/{step.puzzles.length}
            </span>
            <h3>{puzzle.title}</h3>
            <p className="forge-brief">
              <Rich text={puzzle.brief} />
            </p>
          </div>
          <div className="forge-goal">
            <span className="forge-goal-label">OBJETIVO</span>
            <Tex tex={toTex(loaded.goal)} display />
          </div>
        </div>
        <div className="forge-derivation">
          {lines.slice(0, -1).map((l, i) => (
            <div key={i} className="dline">
              <span className="eq">{i === 0 ? '' : '='}</span>
              <Tex tex={toTex(l.expr)} display />
              <span className="why">{l.rule ? RULE_BY_ID[l.rule].name : 'inicio'}</span>
            </div>
          ))}
          <div className="dline active">
            <span className="eq">{lines.length > 1 ? '=' : ''}</span>
            <div
              className={`forge-expr ${pending ? 'choosing' : ''}`}
              onClick={clickExpr}
              onMouseMove={(e) => setHover(nodeFromEvent(e))}
              onMouseLeave={() => setHover(null)}
              dangerouslySetInnerHTML={{ __html: renderTex(activeTex, true) }}
            />
            <span className="why">
              {lines.length > 1 ? RULE_BY_ID[lines[lines.length - 1].rule!].name : 'inicio'}
              {solved && <b className="qed"> ∎</b>}
            </span>
          </div>
        </div>
        <div className="forge-tools" onClick={(e) => e.stopPropagation()}>
          {puzzle.rules.map((id, i) => {
            const r = RULE_BY_ID[id];
            const st = status(id);
            return (
              <button
                key={id}
                className={`tool ${st} ${pending === id ? 'pending' : ''}`}
                onClick={() => pressRule(id)}
                disabled={solved}
                title={r.cond ? `Condición: ${r.cond}` : undefined}
              >
                <span className="tool-head">
                  <kbd>{i + 1}</kbd> {r.name}
                </span>
                <Tex tex={r.schema} />
                {r.cond && (
                  <span className="tool-cond">
                    <Tex tex={r.cond} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="forge-meta">
          <span>
            MOVIMIENTOS <b>{moves}</b> · PAR <b>{puzzle.par}</b>
          </span>
          <button className="btn ghost small" onClick={undo} disabled={lines.length <= 1 || solved}>
            Deshacer (Z)
          </button>
          <button className="btn ghost small" onClick={() => resetPuzzle()} disabled={solved}>
            Reiniciar (R)
          </button>
        </div>
      </div>
      <Console
        text={
          msg?.text ??
          (pending
            ? 'Elige la subexpresión objetivo.'
            : sel
              ? 'Selección activa. Las reglas aplicables se iluminan; ↑ amplía la selección.'
              : 'Haz clic en una subexpresión, o elige primero una regla. Cada movimiento es una identidad.')
        }
        mood={msg?.tone === 'ok' ? 'ok' : msg?.tone === 'bad' ? 'bad' : 'talk'}
        tone={msg?.tone === 'info' ? undefined : msg?.tone}
        actions={
          <>
            <Integrity value={integrity} />
            {solved ? (
              <button className="btn primary pulse" onClick={nextPuzzle}>
                {k + 1 < step.puzzles.length ? 'Siguiente derivación' : 'Continuar'} ▸
              </button>
            ) : (
              <button className="btn hint" onClick={revealHint} disabled={shownHints >= hints.length}>
                Pista {hints.length ? `${shownHints}/${hints.length}` : ''}
              </button>
            )}
          </>
        }
      >
        {shownHints > 0 && !solved && (
          <ol className="hints">
            {hints.slice(0, shownHints).map((h, i) => (
              <li key={i}>
                <Rich text={h} />
              </li>
            ))}
          </ol>
        )}
        <div className="console-keys">
          <KeyHint k="1-9">regla</KeyHint>
          <KeyHint k="↑">ampliar</KeyHint>
          <KeyHint k="Z">deshacer</KeyHint>
          <KeyHint k="H">pista</KeyHint>
        </div>
      </Console>
    </div>
  );
}
