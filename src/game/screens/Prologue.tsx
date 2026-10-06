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
  { place: 'puerto', who: 'nar', text: 'Valparaíso, 2089. Una sola empresa, Halcón, administra el puerto, la energía, el agua y los datos de la ciudad.' },
  { place: 'puerto', who: 'nar', text: 'Sus informes siempre cuadran. Las vacunas llegan, la luz no se corta, el agua alcanza. Al menos en el papel.' },
  { place: 'oficina', who: 'iris', text: 'Soy Iris Montt, de la Agencia NÓESIS. Investigamos lo que los números esconden.' },
  { place: 'oficina', who: 'iris', text: 'Te contraté como analista. No necesito que ya sepas matemáticas. Necesito que las aprendas bien, desde la base.' },
  { place: 'oficina', who: 'teo', text: 'Yo soy Teo: sensores, código, cifrados. Te consigo los datos; tú los haces hablar.' },
  { place: 'oficina', who: 'noesis', text: 'Y yo soy NÓESIS, la tutora de la agencia. Antes de usar una herramienta matemática, te la enseño desde cero: primero la ves, después la escribes.' },
  { place: 'oficina', who: 'iris', text: 'La misión: alguien dentro de Halcón usa la ciudad para algo grande. Cada distrito guarda una pieza, y cada pieza exige una rama de la matemática.' },
  { place: 'oficina', who: 'iris', text: 'Empezamos por el puerto. Ayer desaparecieron cuarenta cajas de vacunas.' },
];

/** Story introduction followed by a short guide to how the game teaches. */
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
    e.preventDefault();
    advance();
  });

  if (guide)
    return (
      <div className="prologue-guide">
        <Backdrop place="oficina" dim={0.75} className="title-bg" />
        <div className="guide-card">
          <span className="eyebrow">CÓMO SE ESTUDIA EN NÓESIS</span>
          <h2>Un curso de matemáticas, caso por caso</h2>
          <p>
            Cada <b>mundo</b> es un área de la matemática: Precálculo, Cálculo diferencial, Cálculo integral, Álgebra lineal, Probabilidad… Cada mundo se divide en <b>temas</b>, y cada tema tiene cuatro pasos:
          </p>
          <ol className="guide-steps">
            <li>
              <b>Historia</b>
              <span>El problema del caso: por qué esta matemática importa ahora.</span>
            </li>
            <li>
              <b>Clase</b>
              <span>NÓESIS desarrolla el concepto desde cero con animaciones y herramientas que puedes mover. A la derecha, la pizarra escribe la parte formal término a término.</span>
            </li>
            <li>
              <b>Investigación</b>
              <span>Aplicas lo aprendido en la historia, con guía.</span>
            </li>
            <li>
              <b>Práctica</b>
              <span>Tres rondas con datos nuevos. Cada error trae una explicación concreta.</span>
            </li>
          </ol>
          <p>
            Todo está abierto: puedes ir a cualquier mundo o tema para repasar, entrar directo a una clase o a la práctica, y consultar <b>Recursos</b> (tecla R): el formulario con definiciones, notación y propiedades de cada tema.
          </p>
          <button className="btn primary big" onClick={onDone}>
            {Object.keys(game.levels).length ? 'Volver al mapa' : 'Ir al mapa de mundos'} ▸
          </button>
        </div>
      </div>
    );

  const p = PANELS[i];
  const name = p.who === 'nar' ? '' : CAST[p.who].name;
  const color = p.who === 'nar' ? '#c9c2e6' : CAST[p.who].color;
  return (
    <div className="scene" onClick={advance}>
      <Backdrop place={p.place} dim={0.15} />
      <div className="scene-rain" aria-hidden />
      {p.who !== 'nar' && (
        <div className={`scene-cast ${p.who === 'iris' || p.who === 'teo' ? 'left' : 'right'}`}>
          <div className="scene-actor on">
            <Portrait id={p.who} size={330} talking flip={!(p.who === 'iris' || p.who === 'teo')} />
          </div>
        </div>
      )}
      <div className={`dialogue ${p.who === 'nar' ? 'narration' : ''}`} style={{ ['--who' as string]: color }}>
        {name && (
          <div className="dialogue-name">
            <b>{name}</b>
            <span>{CAST[p.who as CastId].role}</span>
          </div>
        )}
        <p className="dialogue-text">
          <Typewriter key={i} text={p.text} speed="fast" skip={skip} onDone={() => setTyped(true)} />
        </p>
        <div className="dialogue-foot">
          <span>
            PRÓLOGO · {i + 1}/{PANELS.length}
          </span>
          <span className={typed ? 'ready' : ''}>ESPACIO ▸</span>
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
