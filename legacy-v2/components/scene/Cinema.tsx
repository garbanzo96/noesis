/// <reference types="vite/client" />
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { WorldId } from '../../domain/types';
import media from '../../content/media.json';
import { Math as Formula } from '../ui/Math';

interface Stage {
  at: number;
  title: string;
  claim: string;
  formula?: string;
}
interface Film {
  id: string;
  src: string;
  poster: string;
  duration: number;
  fps: number;
  stages: Stage[];
}
interface CinemaProps {
  world: WorldId;
  reducedMotion: boolean;
  onStage?: (stage: { title: string; claim: string; formula?: string }) => void;
}

const films: Film[] = media.scenes;
const worldFilm: Record<WorldId, string> = {
  foundations: 'setsCartesian',
  differential: 'derivativeSecantToTangent',
  integral: 'riemannIntegral',
  linear: 'matrixBasisTransform',
  probability: 'jointProbability',
  statistics: 'gaussianPrecision',
  multivariate: 'gradientDescentContours',
  information: 'entropyInformation',
  dynamics: 'dynamicalAttractor',
  bayesian: 'bayesianMassNormalization',
  variational: 'variationalPosterior',
  generative: 'markovMessages',
  decision: 'policyInformation',
  active: 'perceptionAction',
};
const filmNames: Record<string, string> = {
  setsCartesian: 'Conjuntos y pares ordenados',
  functionComposition: 'Composición de funciones',
  derivativeSecantToTangent: 'De secante a tangente',
  riemannIntegral: 'De rectángulos a integral',
  matrixBasisTransform: 'La matriz transforma el espacio',
  jointProbability: 'Marginalizar y condicionar',
  bayesianMassNormalization: 'La masa se vuelve posterior',
  gaussianPrecision: 'Precisión de una gaussiana',
  gradientDescentContours: 'Descender por las curvas de nivel',
  entropyInformation: 'La incertidumbre de una distribución',
  dynamicalAttractor: 'Trayectorias hacia un atractor',
  variationalPosterior: 'Aproximar una posterior',
  markovMessages: 'Mensajes de un modelo Markov',
  policyInformation: 'Actuar para conocer',
  perceptionAction: 'Percepción y acción',
};
const mediaUrl = (file: string) => `${import.meta.env.BASE_URL}media/${file}`;
const clamp = (value: number, max: number) =>
  globalThis.Math.max(0, globalThis.Math.min(max, value));
const clock = (value: number) =>
  `${globalThis.Math.floor(value / 60)}:${(value % 60).toFixed(1).padStart(4, '0')}`;

export function Cinema({ world, reducedMotion, onStage }: CinemaProps) {
  const [foundationFilm, setFoundationFilm] = useState('setsCartesian');
  const film = films.find(
    (item) => item.id === (world === 'foundations' ? foundationFilm : worldFilm[world]),
  )!;
  const videoRef = useRef<HTMLVideoElement>(null);
  const onStageRef = useRef(onStage);
  const motionRef = useRef(reducedMotion);
  const guidedRef = useRef(true);
  const generationRef = useRef(0);
  const playRequestRef = useRef(0);
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopRef = useRef<{ at: number; next: number | null } | null>(null);
  const nextTramoRef = useRef<number | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const durationRef = useRef(film.duration);
  const [position, setPosition] = useState({ filmId: film.id, time: 0 });
  const time = position.filmId === film.id ? position.time : 0;
  const setTime = useCallback(
    (value: number) => {
      if (Number.isFinite(value))
        setPosition({ filmId: film.id, time: clamp(value, durationRef.current) });
    },
    [film.id],
  );
  const [duration, setDuration] = useState(film.duration);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [guided, setGuided] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [introReading, setIntroReading] = useState(false);
  const [error, setError] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const id = useId();
  const stageIndex = film.stages.reduce(
    (index, item, i) => (time + 0.001 >= item.at ? i : index),
    0,
  );
  const stage = film.stages[stageIndex];
  const finished = time >= duration - 0.001;

  const clearIntro = useCallback(() => {
    if (introTimerRef.current !== null) clearTimeout(introTimerRef.current);
    introTimerRef.current = null;
    setIntroReading(false);
  }, []);
  const pause = useCallback((video = videoRef.current) => {
    playRequestRef.current++;
    video?.pause();
    setPlaying(false);
  }, []);
  const armTramo = useCallback(
    (at: number) => {
      if (!guidedRef.current) {
        stopRef.current = null;
        return;
      }
      const next = film.stages.find((item) => item.at > at + 0.001)?.at;
      const end = durationRef.current;
      stopRef.current =
        next !== undefined && next < end
          ? { at: globalThis.Math.max(at, next - 1 / film.fps), next }
          : { at: end, next: null };
    },
    [film.stages, film.fps],
  );
  const seek = useCallback(
    (value: number) => {
      const next = clamp(Number.isFinite(value) ? value : 0, durationRef.current);
      const video = videoRef.current;
      pendingSeekRef.current = next;
      if (video) {
        try {
          video.currentTime = next;
          pendingSeekRef.current = null;
        } catch {
          /* Apply when metadata arrives. */
        }
      }
      nextTramoRef.current = null;
      setWaiting(false);
      armTramo(next);
      setTime(next);
    },
    [armTramo, setTime],
  );
  const requestPlay = useCallback((video: HTMLVideoElement) => {
    const generation = generationRef.current;
    const request = ++playRequestRef.current;
    const current = () =>
      generation === generationRef.current &&
      request === playRequestRef.current &&
      video === videoRef.current;
    try {
      void video
        .play()
        .then(() => {
          if (current()) setAutoplayBlocked(false);
        })
        .catch(() => {
          if (current()) {
            setAutoplayBlocked(true);
            setPlaying(false);
          }
        });
    } catch {
      if (current()) {
        setAutoplayBlocked(true);
        setPlaying(false);
      }
    }
  }, []);
  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    clearIntro();
    if (nextTramoRef.current !== null) seek(nextTramoRef.current);
    else if (video.ended || video.currentTime >= durationRef.current - 0.001) seek(0);
    else armTramo(video.currentTime);
    setWaiting(false);
    requestPlay(video);
  }, [armTramo, clearIntro, requestPlay, seek]);
  const sync = useCallback(
    (video: HTMLVideoElement) => {
      if (video !== videoRef.current || !Number.isFinite(video.currentTime)) return;
      const stop = stopRef.current;
      if (guidedRef.current && stop && !video.paused && video.currentTime >= stop.at) {
        stopRef.current = null;
        pause(video);
        try {
          video.currentTime = stop.at;
        } catch {
          pendingSeekRef.current = stop.at;
        }
        nextTramoRef.current = stop.next;
        setWaiting(true);
        setTime(stop.at);
        return;
      }
      setTime(video.currentTime);
    },
    [pause, setTime],
  );

  useEffect(() => {
    onStageRef.current = onStage;
  }, [onStage]);
  useEffect(() => {
    motionRef.current = reducedMotion;
    if (reducedMotion) {
      clearIntro();
      pause();
    }
  }, [reducedMotion, clearIntro, pause]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const generation = ++generationRef.current;
    playRequestRef.current++;
    durationRef.current = film.duration;
    nextTramoRef.current = null;
    pendingSeekRef.current = null;
    setTime(0);
    setDuration(film.duration);
    setPlaying(false);
    setWaiting(false);
    setError(false);
    setAutoplayBlocked(false);
    video.muted = true;
    video.src = mediaUrl(film.src);
    video.load();
    armTramo(0);
    if (!motionRef.current) {
      if (guidedRef.current) {
        setIntroReading(true);
        introTimerRef.current = setTimeout(() => {
          introTimerRef.current = null;
          if (
            generation !== generationRef.current ||
            video !== videoRef.current ||
            motionRef.current
          )
            return;
          setIntroReading(false);
          requestPlay(video);
        }, 3000);
      } else requestPlay(video);
    } else setIntroReading(false);
    return () => {
      generationRef.current++;
      playRequestRef.current++;
      if (introTimerRef.current !== null) clearTimeout(introTimerRef.current);
      introTimerRef.current = null;
      stopRef.current = null;
      nextTramoRef.current = null;
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [film.id, film.src, film.duration, world, armTramo, requestPlay, setTime]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed, film.id]);
  useEffect(() => {
    onStageRef.current?.({ title: stage.title, claim: stage.claim, formula: stage.formula });
  }, [film.id, stage.title, stage.claim, stage.formula]);
  useEffect(() => {
    if (!playing) return;
    let frame: number;
    const tick = () => {
      const video = videoRef.current;
      if (!video) return;
      sync(video);
      if (!video.paused) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, sync]);

  const toggle = () => {
    if (videoRef.current?.paused) play();
    else {
      clearIntro();
      pause();
    }
  };
  const step = (direction: number) => {
    clearIntro();
    pause();
    seek((videoRef.current?.currentTime ?? time) + direction / film.fps);
  };
  const jump = (at: number) => {
    clearIntro();
    pause();
    seek(at);
  };
  const changeGuided = (checked: boolean) => {
    setGuided(checked);
    guidedRef.current = checked;
    nextTramoRef.current = null;
    setWaiting(false);
    armTramo(videoRef.current?.currentTime ?? time);
  };
  const retry = () => {
    setError(false);
    const video = videoRef.current;
    if (!video) return;
    clearIntro();
    pause();
    video.src = mediaUrl(film.src);
    video.load();
    seek(0);
    if (!reducedMotion) requestPlay(video);
  };
  const keyboard = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target !== event.currentTarget && target.closest('button, input, select, a, textarea'))
      return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if ([' ', 'k', 'ArrowLeft', 'ArrowRight', 'Home', 'End', ',', '.'].includes(event.key))
      event.preventDefault();
    if (event.key === ' ' || event.key === 'k') toggle();
    else if (event.key === 'ArrowLeft') {
      clearIntro();
      seek((videoRef.current?.currentTime ?? time) - 1);
    } else if (event.key === 'ArrowRight') {
      clearIntro();
      seek((videoRef.current?.currentTime ?? time) + 1);
    } else if (event.key === 'Home') jump(0);
    else if (event.key === 'End') jump(duration);
    else if (event.key === ',') step(-1);
    else if (event.key === '.') step(1);
  };

  return (
    <section
      className="scene-shell"
      tabIndex={0}
      onKeyDown={keyboard}
      aria-label={`Animación: ${filmNames[film.id]}`}
      aria-describedby={`${id}-keys`}
    >
      <div className="scene-eyebrow">
        <span>GEOMETRÍA EN MOVIMIENTO</span>
        <span>
          {filmNames[film.id]} · {stageIndex + 1}/{film.stages.length}
        </span>
      </div>
      {world === 'foundations' && (
        <label className="cinema-selector" htmlFor={`${id}-film`}>
          Explorar{' '}
          <select
            id={`${id}-film`}
            value={foundationFilm}
            onChange={(event) => setFoundationFilm(event.target.value)}
          >
            <option value="setsCartesian">Conjuntos y pares ordenados</option>
            <option value="functionComposition">Composición de funciones</option>
          </select>
        </label>
      )}
      <video
        key={`${world}:${film.id}`}
        ref={videoRef}
        className="cinema-video"
        src={mediaUrl(film.src)}
        poster={mediaUrl(film.poster)}
        muted
        playsInline
        preload="metadata"
        aria-label={filmNames[film.id]}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          if (video !== videoRef.current) return;
          if (Number.isFinite(video.duration) && video.duration > 0) {
            durationRef.current = video.duration;
            setDuration(video.duration);
          }
          if (pendingSeekRef.current !== null) {
            const pending = clamp(pendingSeekRef.current, durationRef.current);
            try {
              video.currentTime = pending;
              pendingSeekRef.current = null;
            } catch {
              /* Keep pending seek. */
            }
            setTime(pending);
          }
          video.playbackRate = speed;
          armTramo(video.currentTime);
        }}
        onTimeUpdate={(event) => sync(event.currentTarget)}
        onSeeked={(event) => sync(event.currentTarget)}
        onPlay={() => {
          setPlaying(true);
          setAutoplayBlocked(false);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          pause();
          stopRef.current = null;
          nextTramoRef.current = null;
          setWaiting(false);
          setTime(durationRef.current);
        }}
        onError={() => {
          clearIntro();
          pause();
          setError(true);
        }}
      >
        Tu navegador no puede reproducir esta animación. Las etapas explicadas siguen disponibles
        debajo.
      </video>
      {error && (
        <div role="alert" className="cinema-error">
          <p>
            No se pudo cargar la animación. La explicación y su fórmula siguen disponibles debajo.
          </p>
          <button type="button" onClick={retry}>
            Reintentar
          </button>
        </div>
      )}
      <div className="cinema-controls" aria-label="Controles de la animación">
        <button
          type="button"
          onClick={toggle}
          disabled={error}
          aria-label={playing ? 'Pausar animación' : 'Reproducir animación'}
        >
          {playing ? 'Ⅱ Pausar' : '▶ Reproducir'}
        </button>
        {guided && (
          <button type="button" disabled={error || playing || finished} onClick={play}>
            {finished ? 'Secuencia completada' : 'Continuar secuencia'}
          </button>
        )}
        <button type="button" aria-pressed={guided} onClick={() => changeGuided(!guided)}>
          Pausar entre pasos
        </button>
        <button
          type="button"
          disabled={error}
          onClick={() => {
            seek(0);
            play();
          }}
        >
          ↺ Repetir
        </button>
        <button
          type="button"
          disabled={error}
          onClick={() => step(-1)}
          aria-label="Retroceder un fotograma"
        >
          ‹ Fotograma
        </button>
        <button
          type="button"
          disabled={error}
          onClick={() => step(1)}
          aria-label="Avanzar un fotograma"
        >
          Fotograma ›
        </button>
        <label htmlFor={`${id}-speed`}>
          Velocidad{' '}
          <select
            id={`${id}-speed`}
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={1.5}>1.5×</option>
            <option value={2}>2×</option>
          </select>
        </label>
        <label htmlFor={`${id}-time`}>
          Recorrido{' '}
          <input
            id={`${id}-time`}
            type="range"
            min={0}
            max={duration}
            step={1 / film.fps}
            value={clamp(time, duration)}
            aria-valuetext={`${time.toFixed(1)} de ${duration.toFixed(1)} segundos`}
            onChange={(event) => {
              clearIntro();
              seek(Number(event.target.value));
            }}
          />
        </label>
        <output htmlFor={`${id}-time`}>
          {clock(time)} / {clock(duration)}
        </output>
      </div>
      {introReading && (
        <p className="cinema-motion-note">
          Lee el primer paso. La animación comenzará en 3 segundos.
        </p>
      )}
      {guided && waiting && !finished && (
        <p className="cinema-motion-note">
          Observa el resultado y lee la explicación. Continúa cuando estés listo.
        </p>
      )}
      {reducedMotion && (
        <p className="cinema-motion-note">
          La reproducción automática está desactivada. Puedes avanzar por etapas o fotogramas.
        </p>
      )}
      {!error && autoplayBlocked && !reducedMotion && (
        <p className="cinema-motion-note">Presiona Reproducir para iniciar la animación.</p>
      )}
      <nav className="cinema-timeline" aria-label="Etapas de la explicación">
        {film.stages.map((item, index) => (
          <button
            type="button"
            key={item.at}
            aria-current={index === stageIndex ? 'step' : undefined}
            aria-label={`Ir a la etapa ${index + 1}: ${item.title}, segundo ${item.at}`}
            onClick={() => jump(item.at)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span> {item.title}
          </button>
        ))}
      </nav>
      <div className="cinema-caption" aria-live="polite" aria-atomic="true">
        <h3>{stage.title}</h3>
        <p>{stage.claim}</p>
        {stage.formula && <Formula tex={stage.formula} block />}
        {error && stage.formula && (
          <p className="cinema-formula-text">
            <span>Fórmula en texto: </span>
            <code>{stage.formula}</code>
          </p>
        )}
      </div>
      <p id={`${id}-keys`} className="cinema-keyboard-hint">
        Con el panel enfocado: Espacio reproduce o pausa; ← y → recorren un segundo; coma y punto
        avanzan por fotogramas.
      </p>
    </section>
  );
}

export default Cinema;
