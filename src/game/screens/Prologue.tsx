import { useState } from 'react';
import { CAST, Portrait, type CastId } from '../../art/cast';
import { Backdrop, type PlaceId } from '../../art/places';
import { useKey } from '../../engine/hooks';
import { sfx } from '../audio';
import { useGame } from '../state';
import { Typewriter } from '../ui/Typewriter';

interface Panel {
  place: PlaceId;
  who: CastId | 'nar';
  text: string;
}

// The prologue: who you are, what the agency does, what the mission is, and how studying works.
const PANELS: Panel[] = [
  {
    place: 'puerto',
    who: 'nar',
    text: 'Valparaíso, 2089. Una sola empresa, Halcón, administra el puerto, la energía, el agua y los datos de la ciudad, y cada mes publica un informe que cuadra hasta el último decimal.',
  },
  {
    place: 'puerto',
    who: 'nar',
    text: 'En la Clínica del Cerro, mientras tanto, las vacunas llegan con atraso, la luz se corta los jueves y el agua no alcanza. En el informe de Halcón no aparece nada de eso.',
  },
  {
    place: 'oficina',
    who: 'iris',
    text: 'Iris Montt, de la Agencia NÓESIS. Tenemos una oficina con vista a la bahía y revisamos las cuentas que Halcón preferiría que nadie revisara.',
  },
  {
    place: 'oficina',
    who: 'iris',
    text: 'Te contraté como analista. Vas a aprender la matemática que haga falta, desde la base, y la vas a usar en casos reales.',
  },
  {
    place: 'oficina',
    who: 'teo',
    text: 'Yo soy Teo. Consigo los datos: sensores, registros, cualquier aparato que tenga memoria. Leerlos es tu parte.',
  },
  {
    place: 'oficina',
    who: 'noesis',
    text: 'Y yo soy NÓESIS, la tutora de la agencia. Cada vez que el caso pida una herramienta, primero la verás funcionar en un dibujo y después aprenderás a escribirla.',
  },
  {
    place: 'oficina',
    who: 'iris',
    text: 'Llevamos meses mirando cifras de Halcón que cuadran demasiado bien. Alguien está usando la ciudad para algo y lo esconde en las cuentas.',
  },
  {
    place: 'oficina',
    who: 'iris',
    text: 'En el puerto le dicen el Contador. Nadie le ha visto la cara, pero todas las cifras arregladas tienen la misma letra.',
  },
  {
    place: 'oficina',
    who: 'noesis',
    text: 'La ciudad tiene catorce distritos y cada uno pide una rama de la matemática. Iremos en orden, del Puerto a la Torre Halcón, porque cada distrito usa lo aprendido en los anteriores.',
  },
  {
    place: 'oficina',
    who: 'iris',
    text: 'Empezamos por el puerto. Anoche salieron de la bodega 9 cuarenta cajas de vacunas, y nadie firmó la salida.',
  },
];

const GUIDE_TITLES = ['Cómo se estudia', 'La pantalla de una clase', 'Investigar y practicar'];

/**
 * The only tutorial of the game: how a world is organised, what each part of the lesson screen
 * does and how investigations and practice are scored. Missions start straight away after it.
 */
function Guide({ onDone, returning }: { onDone: () => void; returning: boolean }) {
  const [page, setPage] = useState(0);
  const last = page === GUIDE_TITLES.length - 1;
  const next = () => (last ? onDone() : setPage(page + 1));
  useKey([' ', 'Enter', 'ArrowRight'], (e) => {
    if ((e.target as HTMLElement)?.closest('button, select')) return;
    e.preventDefault();
    next();
  });
  useKey('ArrowLeft', () => setPage((p) => Math.max(0, p - 1)));
  return (
    <div className="prologue-guide">
      <Backdrop place="oficina" dim={0.75} className="title-bg" />
      <div className="guide-card">
        <span className="eyebrow">
          GUÍA · {page + 1}/{GUIDE_TITLES.length} · {GUIDE_TITLES[page].toUpperCase()}
        </span>
        {page === 0 && (
          <>
            <h2>Un curso de matemáticas, caso por caso</h2>
            <p>
              Cada <b>mundo</b> es un área de la matemática y un distrito de la ciudad: el Puerto es
              Precálculo, la Planta es Cálculo diferencial, el Casino es Probabilidad… Cada mundo
              tiene ocho casos y un caso final de repaso. Cada caso tiene cuatro pasos:
            </p>
            <ol className="guide-steps">
              <li>
                <b>Historia</b>
                <span>El problema del caso: qué pasó y por qué esta matemática sirve ahora.</span>
              </li>
              <li>
                <b>Clase</b>
                <span>
                  NÓESIS desarrolla la idea desde cero: primero la ves moverse, después la escribes.
                </span>
              </li>
              <li>
                <b>Investigación</b>
                <span>
                  Usas lo aprendido con los datos del caso. Antes de cada revelación, predices.
                </span>
              </li>
              <li>
                <b>Práctica</b>
                <span>Tres rondas con datos nuevos. Cada error trae una explicación concreta.</span>
              </li>
            </ol>
            <p>
              Todo está abierto: puedes entrar a cualquier mundo o caso, o ir directo a la clase o a
              la práctica de un tema para repasar.
            </p>
          </>
        )}
        {page === 1 && (
          <>
            <h2>La pantalla de una clase</h2>
            <div className="guide-mock" aria-hidden>
              <div className="gm-top">
                <span>CASO 7.4 · La lupa</span>
                <span className="gm-tabs">
                  Historia · <b>Clase</b> · Investigación · Práctica
                </span>
              </div>
              <div className="gm-body">
                <div className="gm-stage">
                  <span className="gm-n">1</span>
                  <span className="gm-knob">
                    ◉<span className="gm-hand">☝</span>
                  </span>
                </div>
                <div className="gm-rail">
                  <span className="gm-n">4</span>
                  <i />
                  <i />
                  <i className="on" />
                </div>
                <div className="gm-focus">
                  <span className="gm-n">2</span>
                  <em>L(x,y) = f(a,b) + …</em>
                </div>
                <div className="gm-console">
                  <span className="gm-n">3</span>
                  <em>☝ Arrastra la perilla…</em>
                  <b className="gm-btn">Seguir ▸</b>
                </div>
              </div>
            </div>
            <ol className="guide-legend">
              <li>
                <b>Escenario.</b> Aquí se ve la idea. Lo que tiene un halo y flechas se puede
                arrastrar; la primera vez, una mano muestra el gesto.
              </li>
              <li>
                <b>Fórmula del paso.</b> Bajo el dibujo se escribe la parte formal, pieza por pieza,
                con los mismos colores del dibujo.
              </li>
              <li>
                <b>Consola de NÓESIS.</b> Explica cada paso. Si hay algo que hacer, aparece un
                recuadro con ☝ y «Seguir» espera hasta que lo hagas. «Atrás» repite el paso
                anterior.
              </li>
              <li>
                <b>Pizarra.</b> Al seguir, la fórmula vuela a la pizarra: queda el registro de toda
                la clase. En pantallas chicas se abre con el botón «Pizarra».
              </li>
            </ol>
          </>
        )}
        {page === 2 && (
          <>
            <h2>Investigar y practicar</h2>
            <ul className="guide-points">
              <li>
                <b>Antes de mirar.</b> En la investigación predices antes de que el dibujo revele la
                respuesta. Equivocarte aquí no cuesta nada: sirve para notar lo que esperabas.
              </li>
              <li>
                <b>Comprueba.</b> En la clase, algunas preguntas verifican que seguiste la idea; la
                explicación aparece apenas respondes.
              </li>
              <li>
                <b>Práctica.</b> Escribes o eliges tu respuesta y la confirmas. Hay dos pistas por
                ronda. Cada error gasta una celda de <b>credibilidad</b>; si se acaban, el caso se
                reabre con datos nuevos.
              </li>
              <li>
                <b>Estrellas.</b> Tres por caso: resolverlo, hacerlo sin pistas y hacerlo sin
                errores.
              </li>
              <li>
                <b>Cuaderno y Recursos.</b> El cuaderno guarda lo que descubres en cada caso.
                Recursos reúne definiciones, notación y propiedades de todos los temas.
              </li>
            </ul>
            <table className="guide-keys">
              <tbody>
                <tr>
                  <td>
                    <kbd>Espacio</kbd> <kbd>→</kbd>
                  </td>
                  <td>seguir</td>
                  <td>
                    <kbd>←</kbd>
                  </td>
                  <td>paso anterior</td>
                </tr>
                <tr>
                  <td>
                    <kbd>1</kbd>–<kbd>4</kbd>
                  </td>
                  <td>elegir respuesta</td>
                  <td>
                    <kbd>H</kbd>
                  </td>
                  <td>pista</td>
                </tr>
                <tr>
                  <td>
                    <kbd>R</kbd>
                  </td>
                  <td>recursos</td>
                  <td>
                    <kbd>Esc</kbd>
                  </td>
                  <td>menú</td>
                </tr>
              </tbody>
            </table>
            <p className="guide-note">
              En celular, gira el teléfono para ver el escenario más grande en las clases.
            </p>
          </>
        )}
        <div className="guide-nav">
          {page > 0 && (
            <button className="btn ghost" onClick={() => setPage(page - 1)}>
              ◂ Atrás
            </button>
          )}
          <button className="btn primary big" onClick={next}>
            {last ? (returning ? 'Volver al mapa ▸' : 'Ir al mapa de mundos ▸') : 'Siguiente ▸'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Story introduction followed by the guide to how the game teaches. */
export function Prologue({ onDone }: { onDone: () => void }) {
  const game = useGame();
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState(false);
  const [skip, setSkip] = useState(0);
  const guide = i >= PANELS.length;
  const advance = () => {
    if (guide) return onDone();
    if (!typed) return setSkip((s) => s + 1);
    sfx.advance();
    setTyped(false);
    setI(i + 1);
  };
  useKey([' ', 'Enter', 'ArrowRight'], (e) => {
    if ((e.target as HTMLElement)?.closest('button, select')) return;
    e.preventDefault();
    advance();
  });

  if (guide) return <Guide onDone={onDone} returning={Object.keys(game.levels).length > 0} />;

  const p = PANELS[i];
  const name = p.who === 'nar' ? '' : CAST[p.who].name;
  const color = p.who === 'nar' ? '#c9c2e6' : CAST[p.who].color;
  return (
    <div className="scene prologue-scene" onClick={advance}>
      <Backdrop place={p.place} dim={0.15} />
      <div className="scene-rain" aria-hidden />
      {p.who !== 'nar' && (
        <div className={`scene-cast ${p.who === 'iris' || p.who === 'teo' ? 'left' : 'right'}`}>
          <div className="scene-actor on">
            <Portrait id={p.who} size={330} talking flip={!(p.who === 'iris' || p.who === 'teo')} />
          </div>
        </div>
      )}
      <div
        className={`dialogue ${p.who === 'nar' ? 'narration' : ''}`}
        style={{ ['--who' as string]: color }}
      >
        {name && (
          <div className="dialogue-name">
            <b>{name}</b>
            <span>{CAST[p.who as CastId].role}</span>
          </div>
        )}
        <p className="dialogue-text">
          <Typewriter
            key={i}
            text={p.text}
            speed="fast"
            skip={skip}
            onDone={() => setTyped(true)}
          />
        </p>
        <div className="dialogue-foot">
          <span>
            PRÓLOGO · {i + 1}/{PANELS.length}
          </span>
          <button
            className={`btn small prologue-next ${typed ? 'ready' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              advance();
            }}
          >
            {typed ? 'Avanzar ▸' : 'Mostrar texto ▸'}
          </button>
        </div>
      </div>
      <button
        className="scene-skip"
        onClick={(e) => {
          e.stopPropagation();
          setI(PANELS.length);
        }}
      >
        Saltar prólogo ▸▸
      </button>
    </div>
  );
}
