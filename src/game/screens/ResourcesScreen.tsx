import { useEffect, useMemo, useRef, useState } from 'react';
import { useKey } from '../../engine/hooks';
import { Rich, Tex } from '../../engine/Tex';
import { GLYPHS, LEVELS, PLAYABLE, TOPICS } from '../../content/registry';
import type { Glyph, LevelDef, Note, WorldId } from '../level/types';

/** Lowercase without accents, for search. */
const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

interface TopicView {
  level: LevelDef;
  defs: Note[];
  props: Note[];
  glyphs: Glyph[];
  pitfalls: string[];
}

function topicView(l: LevelDef): TopicView {
  return {
    level: l,
    defs: l.ref?.defs ?? [],
    props: l.ref?.props ?? [],
    glyphs: l.glyphs.map((g) => GLYPHS[g]).filter(Boolean),
    pitfalls: l.pitfalls ?? [],
  };
}

function filterTopic(t: TopicView, needle: string): TopicView | null {
  if (!needle) return t;
  const hit = (...xs: (string | undefined)[]) => xs.some((x) => x && fold(x).includes(needle));
  const head = hit(t.level.subtitle, t.level.title);
  const v: TopicView = {
    level: t.level,
    defs: head ? t.defs : t.defs.filter((n) => hit(n.label, n.body, n.tex)),
    props: head ? t.props : t.props.filter((n) => hit(n.label, n.body, n.tex)),
    glyphs: head ? t.glyphs : t.glyphs.filter((g) => hit(g.name, g.read, g.meaning, g.tex)),
    pitfalls: head ? t.pitfalls : t.pitfalls.filter((p) => hit(p)),
  };
  return v.defs.length + v.props.length + v.glyphs.length + v.pitfalls.length > 0 ? v : null;
}

function Entry({ n }: { n: Note }) {
  return (
    <div className="res-entry">
      <b>{n.label}</b>
      <div>
        {n.tex && (
          <div className="res-tex">
            <Tex tex={n.tex} display />
          </div>
        )}
        {n.body && (
          <p>
            <Rich text={n.body} />
          </p>
        )}
      </div>
    </div>
  );
}

function Topic({ t, onGo }: { t: TopicView; onGo: (id: string, step: number) => void }) {
  const l = t.level;
  const lessonAt = l.steps.findIndex((s) => s.kind === 'lesson');
  const demo = lessonAt >= 0 ? lessonAt : l.steps.findIndex((s) => s.kind === 'demo');
  const practice = l.steps.findIndex((s) => s.kind === 'challenge');
  return (
    <section className="res-topic" id={`res-${l.id}`}>
      <header>
        <span className="res-code">{l.code}</span>
        <div>
          <h3>{l.subtitle}</h3>
          <small>Caso «{l.title}»</small>
        </div>
        <div className="res-actions">
          {demo >= 0 && (
            <button className="btn small" onClick={() => onGo(l.id, demo)}>
              Clase ▸
            </button>
          )}
          {practice >= 0 && (
            <button className="btn small primary" onClick={() => onGo(l.id, practice)}>
              Práctica ▸
            </button>
          )}
        </div>
      </header>
      {t.defs.length > 0 && (
        <div className="res-sec">
          <h4>Definiciones</h4>
          {t.defs.map((n) => (
            <Entry key={n.label} n={n} />
          ))}
        </div>
      )}
      {t.glyphs.length > 0 && (
        <div className="res-sec">
          <h4>Notación</h4>
          <table className="res-notation">
            <tbody>
              {t.glyphs.map((g) => (
                <tr key={g.id}>
                  <td className="res-sym">
                    <Tex tex={g.tex} />
                  </td>
                  <td>
                    <b>{g.name}</b> <small>«{g.read}»</small>
                    <p>
                      <Rich text={g.meaning} />
                    </p>
                    {g.warn && (
                      <p className="res-warn">
                        <Rich text={g.warn} />
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {t.props.length > 0 && (
        <div className="res-sec">
          <h4>Propiedades e igualdades</h4>
          {t.props.map((n) => (
            <Entry key={n.label} n={n} />
          ))}
        </div>
      )}
      {t.pitfalls.length > 0 && (
        <div className="res-sec">
          <h4>Errores frecuentes</h4>
          <ul className="res-pitfalls">
            {t.pitfalls.map((p) => (
              <li key={p}>
                <Rich text={p} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/**
 * Resources: the reference of every topic, always available, ordered by district and topic.
 * Definitions, notation, properties and identities, frequent mistakes, and direct links to the
 * explanation or the practice of each topic.
 */
export function ResourcesScreen({
  onClose,
  focus,
  onGo,
}: {
  onClose: () => void;
  focus?: string;
  onGo: (id: string, step: number) => void;
}) {
  const firstWorld = (focus && LEVELS[focus]?.world) || TOPICS[0].world;
  const [world, setWorld] = useState<WorldId>(firstWorld);
  const [q, setQ] = useState('');
  const [active, setActive] = useState<string | null>(focus ?? null);
  const doc = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  useKey('Escape', onClose);
  useKey('/', (e) => {
    e.preventDefault();
    search.current?.focus();
  });
  const needle = fold(q.trim());

  const groups = useMemo(() => {
    const src = needle ? TOPICS : TOPICS.filter((g) => g.world === world);
    return src
      .map((g) => ({
        world: g.world,
        topics: g.levels
          .map(topicView)
          .map((t) => filterTopic(t, needle))
          .filter((t): t is TopicView => !!t),
      }))
      .filter((g) => g.topics.length > 0);
  }, [needle, world]);

  const jump = (id: string) => {
    setActive(id);
    document.getElementById(`res-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  useEffect(() => {
    if (focus)
      requestAnimationFrame(() =>
        document.getElementById(`res-${focus}`)?.scrollIntoView({ block: 'start' }),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // highlight the topic being read
  useEffect(() => {
    const root = doc.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id.replace(/^res-/, ''));
      },
      { root, rootMargin: '0px 0px -70% 0px' },
    );
    root.querySelectorAll('.res-topic').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [groups]);

  const navTopics = needle
    ? groups.flatMap((g) => g.topics.map((t) => t.level))
    : (TOPICS.find((g) => g.world === world)?.levels ?? []);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="res-screen" onClick={(e) => e.stopPropagation()}>
        <header className="res-head">
          <span className="res-title">RECURSOS</span>
          <div className="tabs">
            {TOPICS.map((g) => (
              <button
                key={g.world}
                className={!needle && world === g.world ? 'on' : ''}
                onClick={() => {
                  setQ('');
                  setWorld(g.world);
                  doc.current?.scrollTo({ top: 0 });
                }}
              >
                {PLAYABLE[g.world]!.name} · {PLAYABLE[g.world]!.tag}
              </button>
            ))}
          </div>
          <input
            ref={search}
            placeholder="Buscar definición, símbolo, propiedad…  ( / )"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn ghost small" onClick={() => window.print()}>
            Imprimir
          </button>
          <button className="btn ghost small" onClick={onClose}>
            Cerrar <kbd>Esc</kbd>
          </button>
        </header>
        <label className="res-topic-select">
          <span>Tema</span>
          <select
            value={navTopics.some((l) => l.id === active) ? active! : ''}
            onChange={(e) => jump(e.target.value)}
            disabled={!navTopics.length}
          >
            <option value="" disabled>
              {navTopics.length ? 'Elige un tema' : 'Sin resultados'}
            </option>
            {navTopics.map((l) => (
              <option key={l.id} value={l.id}>
                {l.code} · {l.subtitle}
              </option>
            ))}
          </select>
        </label>
        <div className="res-body">
          <nav className="res-nav">
            {needle && (
              <span className="res-nav-kicker">
                {navTopics.length ? 'Resultados' : 'Sin resultados'}
              </span>
            )}
            {navTopics.map((l) => (
              <button key={l.id} className={active === l.id ? 'on' : ''} onClick={() => jump(l.id)}>
                <span>{l.code}</span>
                {l.subtitle}
              </button>
            ))}
          </nav>
          <div className="res-doc" ref={doc}>
            {groups.map((g) => (
              <div key={g.world}>
                <div className="res-world">
                  <span>{PLAYABLE[g.world]!.tag.toUpperCase()}</span>
                  <h2>{PLAYABLE[g.world]!.name}</h2>
                </div>
                {g.topics.map((t) => (
                  <Topic key={t.level.id} t={t} onGo={onGo} />
                ))}
              </div>
            ))}
            {groups.length === 0 && <p className="muted">Nada coincide con «{q}».</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
