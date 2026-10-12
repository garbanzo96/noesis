import { useMemo, useState } from 'react';
import { CAST, Portrait, type CastId } from '../../art/cast';
import { Backdrop } from '../../art/places';
import { useKey } from '../../engine/hooks';
import { sfx } from '../audio';
import { Typewriter } from '../ui/Typewriter';
import { useRun } from './context';
import type { SceneStep } from './types';

const TEAM: CastId[] = ['iris', 'teo'];

/** Visual-novel scene: location backdrop, the people present, one line at a time. */
export function ScenePlayer({ step }: { step: SceneStep }) {
  const run = useRun();
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState(false);
  const [skip, setSkip] = useState(0);
  const line = step.lines[i];
  // left: agency team; right: everybody else (first appearance order)
  const present = useMemo(() => {
    const seen: CastId[] = [];
    for (const l of step.lines) if (l.who !== 'tu' && l.who !== 'nar' && !seen.includes(l.who)) seen.push(l.who);
    return { left: seen.filter((c) => TEAM.includes(c)).slice(0, 2), right: seen.filter((c) => !TEAM.includes(c)).slice(0, 2) };
  }, [step.lines]);

  const advance = () => {
    if (!typed) {
      setSkip((s) => s + 1);
      return;
    }
    if (i < step.lines.length - 1) {
      sfx.advance();
      setTyped(false);
      setI(i + 1);
    } else {
      sfx.select();
      run.complete();
    }
  };
  useKey([' ', 'Enter', 'ArrowRight'], (e) => {
    e.preventDefault();
    advance();
  }, !run.paused);

  const speaker = line.who;
  const name = speaker === 'tu' ? 'Tú' : speaker === 'nar' ? '' : CAST[speaker].name;
  const color = speaker === 'tu' || speaker === 'nar' ? '#c9c2e6' : CAST[speaker].color;
  return (
    <div className="scene" onClick={advance}>
      <Backdrop place={step.place} dim={0.4} className="scene-backdrop" />
      <div className="scene-rain" aria-hidden />
      <div className="scene-cast left">
        {present.left.map((c) => (
          <div key={c} className={`scene-actor ${speaker === c ? 'on' : ''}`}>
            <Portrait id={c} size={330} talking={speaker === c && !typed} dim={speaker !== c} />
          </div>
        ))}
      </div>
      <div className="scene-cast right">
        {present.right.map((c) => (
          <div key={c} className={`scene-actor ${speaker === c ? 'on' : ''}`}>
            <Portrait id={c} size={330} talking={speaker === c && !typed} dim={speaker !== c} flip />
          </div>
        ))}
      </div>
      <div className={`dialogue ${speaker === 'nar' ? 'narration' : ''} ${present.right.includes(speaker as CastId) ? 'from-right' : ''}`} style={{ ['--who' as string]: color }}>
        {speaker !== 'tu' && speaker !== 'nar' && (
          <div className="dialogue-face" aria-hidden>
            <Portrait id={speaker} size={84} talking={!typed} />
          </div>
        )}
        {name && (
          <div className="dialogue-name">
            <b>{name}</b>
            {speaker !== 'tu' && speaker !== 'nar' && <span>{CAST[speaker].role}</span>}
          </div>
        )}
        <p className="dialogue-text">
          <Typewriter key={i} text={line.text} speed={run.textSpeed === 'slow' ? 'normal' : run.textSpeed === 'normal' ? 'fast' : 'instant'} skip={skip} onDone={() => setTyped(true)} />
        </p>
        <div className="dialogue-foot">
          <span>
            {i + 1}/{step.lines.length}
          </span>
          <span className={typed ? 'ready' : ''}>
            <span className="k-desk">{i < step.lines.length - 1 ? 'ESPACIO ▸' : 'ESPACIO · comenzar ▸'}</span>
            <span className="k-touch">{i < step.lines.length - 1 ? 'Toca para seguir ▸' : 'Toca para comenzar ▸'}</span>
          </span>
        </div>
      </div>
      <button
        className="scene-skip"
        onClick={(e) => {
          e.stopPropagation();
          run.complete();
        }}
      >
        Saltar escena ▸▸
      </button>
    </div>
  );
}
