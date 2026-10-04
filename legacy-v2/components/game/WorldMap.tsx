import { ArrowRight, Check, Lock, Play, ChevronRight } from '../ui/icons';
import { worlds, getWorld } from '../../content';
import type { GameState, WorldId } from '../../domain/types';
import { getProgress, worldStatus, campaignPrerequisites } from '../../engine/progress';
const tools = [
  'Circuito de cálculo',
  'Actualizador local',
  'Acumulador de masa',
  'Operador de estados',
  'Tabla conjunta',
  'Banco de validación',
  'Mapa de sensibilidades',
  'Medidor de información',
  'Simulador temporal',
  'Actualizador de creencias',
  'Aproximador posterior',
  'Grafo del modelo',
  'Comparador de políticas',
  'Agente mínimo',
];
export { tools };
export function WorldMap({ state, onOpen }: { state: GameState; onOpen: (w: WorldId) => void }) {
  const completed = worlds.filter((w) => worldStatus(state, w.id) === 'complete').length;
  const next = worlds.find((w) => worldStatus(state, w.id) === 'available') ?? worlds[13];
  const nprog = getProgress(state, next.id);
  const segments = worlds.map((w, i) => {
    const a = (i / 14) * Math.PI * 2 - Math.PI / 2,
      b = ((i + 0.75) / 14) * Math.PI * 2 - Math.PI / 2;
    return {
      w,
      d: `M${140 + 105 * Math.cos(a)} ${140 + 105 * Math.sin(a)}A105 105 0 0 1 ${140 + 105 * Math.cos(b)} ${140 + 105 * Math.sin(b)}`,
    };
  });
  return (
    <main className="campaign">
      <section className="campaign-hero">
        <div>
          <span className="eyebrow">ENIGMA · CAMPAÑA DE INVESTIGACIÓN</span>
          <h1>
            Del primer símbolo
            <br />a un agente que actúa.
          </h1>
          <p>
            Reconstruye la matemática de active inference. Observa una idea, manipula su mecanismo y
            demuestra que puedes usarla.
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={() => onOpen(next.id)}>
              <Play size={17} />{' '}
              {completed === 14
                ? 'Revisitar protocolo'
                : completed
                  ? 'Continuar campaña'
                  : 'Iniciar protocolo'}{' '}
              <ArrowRight size={17} />
            </button>
            <a href="#arena" className="text-action">
              Probar el sensor incierto <ChevronRight size={16} />
            </a>
          </div>
          <div className="campaign-specs">
            <span>14 MUNDOS</span>
            <span>15 ANIMACIONES MANIM</span>
            <span>42 MISIONES</span>
          </div>
        </div>
        <div className="reactor">
          <svg viewBox="0 0 280 280" role="img" aria-label={`${completed} herramientas de 14`}>
            <defs>
              <radialGradient id="core">
                <stop offset="0" stopColor="#28e7fa" stopOpacity=".17" />
                <stop offset="1" stopColor="#28e7fa" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="140" cy="140" r="130" fill="url(#core)" />
            {segments.map(({ w, d }) => (
              <path
                key={w.id}
                d={d}
                fill="none"
                stroke={worldStatus(state, w.id) === 'complete' ? w.accent : '#392948'}
                strokeWidth="9"
              />
            ))}
            <circle
              cx="140"
              cy="140"
              r="86"
              fill="none"
              stroke="#a88aff55"
              strokeDasharray="2 10"
            />
            <path
              d="M100 150L125 95L165 95L185 150L145 183Z"
              stroke="#28e7fa77"
              fill="none"
              strokeWidth="1.5"
            />
            <text
              x="140"
              y="151"
              textAnchor="middle"
              fill="#f3f0ff"
              fontSize="38"
              fontFamily="Orbitron"
            >
              {String(completed).padStart(2, '0')}
            </text>
            <text
              x="140"
              y="210"
              textAnchor="middle"
              fill="#a88aff"
              fontSize="10"
              letterSpacing="3"
            >
              HERRAMIENTAS / 14
            </text>
          </svg>
          <span>REACTOR DE INFERENCIA</span>
        </div>
      </section>
      <section className="next-mission">
        <div className="next-index">{String(next.number).padStart(2, '0')}</div>
        <div>
          <span className="eyebrow">
            {completed === 14 ? 'CAMPAÑA COMPLETA / REVISITAR' : 'SIGUIENTE HERRAMIENTA'}
          </span>
          <h2>
            {next.name} <span>/ {tools[next.number - 1]}</span>
          </h2>
          <p>
            {nprog.puzzles.length}/3 misiones ·{' '}
            {nprog.field ? 'laboratorio verificado' : 'laboratorio por verificar'}
          </p>
        </div>
        <button onClick={() => onOpen(next.id)} aria-label={`Entrar en ${next.name}`}>
          <ArrowRight size={22} />
        </button>
      </section>
      <div className="map-heading">
        <div>
          <span className="eyebrow">ATLAS DEL PROTOCOLO</span>
          <h2>14 mundos. Un sistema.</h2>
        </div>
        <p>
          Orden numérico por disciplina.
          <br />
          Los enlaces de acceso siguen sus prerrequisitos.
        </p>
      </div>
      <section className="world-map" aria-label="Mapa de mundos en orden numérico">
        {worlds.map((w) => {
          const status = worldStatus(state, w.id),
            pr = getProgress(state, w.id),
            req = campaignPrerequisites[w.id];
          return (
            <button
              key={w.id}
              className={`world-node ${status}`}
              style={{ '--world': w.accent } as React.CSSProperties}
              onClick={() => onOpen(w.id)}
              aria-label={`Mundo ${w.number}: ${w.name}. ${status === 'complete' ? 'Completado' : status === 'locked' ? 'Vista previa; requiere ' + req.map((id) => getWorld(id).name).join(', ') : 'Disponible'}`}
            >
              <span className="node-top">
                <span>SECTOR {String(w.number).padStart(2, '0')}</span>
                {status === 'complete' ? (
                  <Check size={14} />
                ) : status === 'locked' ? (
                  <Lock size={13} />
                ) : (
                  <Play size={13} />
                )}
              </span>
              <div className="node-symbol">
                {w.symbol}
                <div className="node-orbit" />
              </div>
              <h3>{w.name}</h3>
              <span className="node-tag">{w.tag}</span>
              <div className="node-progress">
                {[0, 1, 2, 3].map((i) => (
                  <i
                    key={i}
                    className={i < pr.puzzles.length || (i === 3 && pr.field) ? 'lit' : ''}
                  />
                ))}
              </div>
              <span className="node-status">
                {status === 'complete'
                  ? 'HERRAMIENTA ACTIVA'
                  : status === 'available'
                    ? 'ENTRAR AL MUNDO'
                    : 'EXPLORAR · PREVIA'}
              </span>
            </button>
          );
        })}
      </section>
      <section className="route-brief">
        <div>
          <span className="eyebrow">RUTA AL AGENTE DISCRETO</span>
          <p>01 → 05 → 10 → 08 → 04 → 02 → 11 → 12 → 13 → 14</p>
        </div>
        <p>
          La rama continua añade integración, varias variables y dinámica. Puedes explorar cualquier
          escena y usar las misiones como prueba rápida de conocimientos previos.
        </p>
      </section>
    </main>
  );
}
