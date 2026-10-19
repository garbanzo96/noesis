import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage } from '../../engine/Stage';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
  TopicRef,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { fmt, kl2, tnum } from './kit';

// Ejemplo didáctico: p(D)=1/4, posterior=(1/4,1/2,1/4).
// Familia q_t=(t,1/2,1/2-t), 0≤t≤1/2: KL mínima 0 en t=1/4.
// En t=1/2, KL=1/2 bit y ELBO=-5/2 bits.
const POST = [0.25, 0.5, 0.25];
const qAt = (t: number) => [t, 0.5, 0.5 - t];
const gapAt = (t: number) => Math.max(0, kl2(qAt(t), POST));
const X = (t: number) => 220 + 1360 * t;
const Y = (gap: number) => 300 + 520 * gap;
const IDENTITY = '\\log_2 p(D)=\\operatorname{ELBO}(q)+KL(q\\Vert p(\\cdot\\mid D))';

function BoundPicture({ gap, showBound = true }: { gap: number; showBound?: boolean }) {
  return (
    <g>
      <Cap x={550} y={180} size={24}>
        El logaritmo de la evidencia es el techo
      </Cap>
      <line x1={170} x2={940} y1={300} y2={300} stroke={C.cyan} strokeWidth={4} />
      <Cap x={550} y={255} tex="\log_2 p(D)=-2" color={C.cyan} />
      {showBound && (
        <>
          <line x1={170} x2={940} y1={Y(gap)} y2={Y(gap)} stroke={C.amber} strokeWidth={5} />
          <Cap
            x={550}
            y={Y(gap) + 50}
            tex={`\\operatorname{ELBO}=${tnum(-2 - gap)}`}
            color={C.amber}
          />
          {gap > 0 && (
            <>
              <line x1={850} x2={850} y1={310} y2={Y(gap) - 10} stroke={C.green} strokeWidth={3} />
              <Cap x={550} y={430} tex={`KL=${tnum(gap)}\\ \\text{bits}`} color={C.green} />
            </>
          )}
        </>
      )}
    </g>
  );
}

function BoundLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [t, setT] = useState(0.5);
  const { beat } = beats;
  const gap = gapAt(t);
  const drag = useSvgDrag(svg, (px) => {
    if (beat !== 2) return;
    const raw = clamp((px - 220) / 1360, 0, 0.5);
    // Ajuste al mínimo exacto para que también sea alcanzable en pantalla táctil.
    setT(Math.abs(raw - 0.25) < 0.012 ? 0.25 : raw);
  });
  useEffect(() => {
    if (beat === 2 && t === 0.25) unlock();
  }, [beat, t, unlock]);
  const path = Array.from({ length: 101 }, (_, i) => {
    const u = i / 200;
    return `${i === 0 ? 'M' : 'L'}${X(u)} ${Y(gapAt(u))}`;
  }).join(' ');
  return (
    <Stage ref={svg}>
      {beat === 2 ? (
        <>
          <Cap x={550} y={175} size={24}>
            Cada posición elige una q
          </Cap>
          <line
            x1={170}
            x2={940}
            y1={300}
            y2={300}
            stroke={C.cyan}
            strokeWidth={3}
            strokeDasharray="8 8"
          />
          <Cap x={550} y={250} tex="\log_2 p(D)=-2" color={C.cyan} />
          <path d={path} fill="none" stroke={C.amber} strokeWidth={5} />
          <circle cx={X(t)} cy={Y(gap)} r={10} fill={C.amber} />
          <line
            x1={X(t)}
            x2={X(t)}
            y1={Y(gap) + 16}
            y2={670}
            stroke={C.line}
            strokeDasharray="5 6"
          />
          <line x1={220} x2={900} y1={720} y2={720} stroke={C.line} strokeWidth={4} />
          <Cap x={220} y={785}>
            t = 0
          </Cap>
          <Cap x={900} y={785}>
            t = 0,5
          </Cap>
          <Knob x={X(t)} y={720} axis="x" label="t" color={C.amber} onPointerDown={drag} />
        </>
      ) : (
        <BoundPicture
          gap={beat === 4 || beat === 3 ? 0 : 0.5}
          showBound={beat !== 3 || answer !== null}
        />
      )}
      <Cap x={1250} y={200} tex="p(D)=\tfrac14" color={C.cyan} />
      {beat === 0 && <Cap x={1250} y={290} tex="KL=0{,}5\ \text{bits}" color={C.green} />}
      {beat === 1 && (
        <>
          <Cap x={1250} y={290} tex="KL\ge0" color={C.green} />
          <Cap x={1250} y={380} tex="\operatorname{ELBO}\le\log_2 p(D)" color={C.amber} size={23} />
        </>
      )}
      {beat === 2 && (
        <>
          <Cap x={1250} y={290} tex={`q=(${tnum(t)};0{,}5;${tnum(0.5 - t)})`} size={22} />
          <Cap x={1250} y={380} tex={`KL=${tnum(gap, 3)}\\ \\text{bits}`} color={C.green} />
          <Cap x={1250} y={470} tex={`\\operatorname{ELBO}=${tnum(-2 - gap, 3)}`} color={C.amber} />
          <Cap x={1250} y={560} size={20}>
            {t === 0.25 ? 'Mínimo alcanzado: q = posterior.' : 'Sube la cota hasta su máximo.'}
          </Cap>
        </>
      )}
      {beat === 3 && <Cap x={1250} y={290} tex="KL=0" color={C.green} />}
      {beat === 3 && answer !== null && (
        <Cap x={1250} y={380} tex="\operatorname{ELBO}=-2" color={C.amber} />
      )}
      {beat === 4 && (
        <>
          <Cap x={1250} y={290} size={21}>
            La evidencia queda fija.
          </Cap>
          <Cap x={1250} y={380} size={21}>
            Subir ELBO reduce KL.
          </Cap>
          <Cap x={1250} y={470} size={20}>
            El máximo depende de la familia.
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'La cota inferior de la evidencia',
  Scene: BoundLesson,
  beats: [
    {
      say: 'La **ELBO** es una cota inferior del logaritmo de la evidencia. Si p(D) = 1/4, su logaritmo en base 2 es −2; con KL = 0,5, la cota queda en −2,5 bits.',
      board: {
        label: 'Identidad de la cota',
        tex: IDENTITY,
        body: '−2 = −2,5 + 0,5. Todos los logaritmos están en base 2: las unidades son bits.',
      },
    },
    {
      say: 'La separación entre la cota y el logaritmo de la evidencia es la KL. Como nunca es negativa, la ELBO puede tocar ese techo, pero no pasarlo.',
      board: {
        label: 'Cota inferior',
        tex: '\\p{1}{KL\\ge0}\\quad\\Rightarrow\\quad\\p{2}{\\operatorname{ELBO}(q)\\le\\log_2 p(D)}',
      },
    },
    {
      say: 'Mueve q para subir la cota: la evidencia permanece fija mientras la KL baja. En esta familia puedes alcanzar el posterior exacto.',
      gate: 'Arrastra la perilla t hasta el máximo de la curva, donde KL = 0.',
      board: {
        label: 'Ajustar q',
        tex: '\\p{1}{q_t}=\\p{2}{(t;\\tfrac12;\\tfrac12-t)},\\quad\\p{3}{0\\le t\\le\\tfrac12}',
      },
    },
    {
      say: 'Ahora imagina una q cuya KL al posterior es cero.',
      ask: {
        prompt: 'Con log₂ p(D) = −2 y KL = 0, ¿cuánto vale la ELBO?',
        options: ['−2 bits', '0 bits', '−2,5 bits'],
        answer: 0,
        explain:
          'La identidad queda −2 = ELBO + 0: ELBO = −2. Una KL nula borra la separación, no el valor de la evidencia.',
      },
      board: {
        label: 'Cuando q coincide',
        tex: '\\p{1}{KL}=\\p{2}{0}\\quad\\Rightarrow\\quad\\p{3}{\\operatorname{ELBO}}=\\p{4}{\\log_2 p(D)}',
      },
    },
    {
      say: 'Puedes calcular la ELBO desde el modelo conjunto y q, sin normalizar el posterior. Para datos y modelo fijos, maximizarla minimiza la KL dentro de tu familia; si esa familia excluye el posterior, queda una separación.',
      board: {
        label: 'Objetivo calculable',
        tex: '\\p{1}{\\operatorname{ELBO}(q)}=\\p{2}{\\sum_\\theta q(\\theta)\\log_2\\frac{p(D,\\theta)}{q(\\theta)}}',
        body: 'El ejemplo pequeño permite dibujar el techo. Al ajustar un modelo grande, la ELBO no requiere calcular p(D); evaluar o estimar esta suma todavía tiene un costo.',
      },
    },
  ],
};

function AuditCards({ values }: { values: (number | null)[] }) {
  return (
    <g>
      {['log₂ p(D)', 'ELBO(q)', 'KL(q ‖ posterior)'].map((label, i) => (
        <g key={label}>
          <rect
            x={170}
            y={205 + i * 175}
            width={770}
            height={130}
            rx={16}
            fill={C.panel}
            stroke={C.line}
            strokeWidth={2}
          />
          <Cap x={380} y={270 + i * 175} size={24}>
            {label}
          </Cap>
          <Cap x={780} y={270 + i * 175} size={28} color={[C.cyan, C.amber, C.green][i]}>
            {values[i] === null ? '?' : `${fmt(values[i]!)} bits`}
          </Cap>
        </g>
      ))}
    </g>
  );
}

function BoundDemo({ beats, answer }: DemoProps) {
  const revealed = answer !== null;
  return (
    <Stage>
      <Cap x={550} y={125} size={24}>
        Registro de ajuste · mismo modelo y datos
      </Cap>
      <AuditCards
        values={
          beats.beat === 0 ? [revealed ? -2 : null, -3.25, 1.25] : [-2, -2.5, revealed ? 0.5 : null]
        }
      />
      <Cap x={1250} y={240} size={21}>
        {beats.beat === 0 ? 'Control pequeño verificable.' : 'Segunda q del mismo ajuste.'}
      </Cap>
      <Cap x={1250} y={330} size={21}>
        log₂ p(D) = ELBO + KL
      </Cap>
      {revealed && (
        <Cap x={1250} y={420} size={21} color={C.green}>
          {beats.beat === 0 ? 'La evidencia es 1/4.' : 'La separación bajó a 0,5 bits.'}
        </Cap>
      )}
    </Stage>
  );
}

function BoundPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 191 + round);
    const log = -randInt(r, 1, 6);
    const gap = randInt(r, 1, 8) / 4;
    const elbo = log - gap;
    const missing = [1, 0, 2][round];
    const full = [log, elbo, gap];
    return {
      log,
      gap,
      elbo,
      missing,
      target: full[missing],
      values: full.map((v, i) => (i === missing ? null : v)),
    };
  }, [seed, round]);
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue('');
    api.prompt(
      [
        'Completa la ELBO en bits.',
        'Completa log₂ p(D) en bits; no escribas p(D).',
        'Completa la KL al posterior en bits.',
      ][round],
      IDENTITY,
    );
    api.hints(
      [
        [
          'Despeja ELBO en la identidad.',
          'Resta KL al logaritmo de la evidencia; conserva el signo negativo.',
        ],
        ['El lado izquierdo es un logaritmo.', 'Suma ELBO y KL; no eleves 2 a ese resultado.'],
        [
          'KL mide la separación hasta el techo.',
          'Resta ELBO al logaritmo de la evidencia; la KL debe ser no negativa.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(value);
    if (v === null || !Number.isFinite(v)) return;
    const near = (n: number) => Math.abs(v - n) < 0.001;
    if (near(d.target))
      return api.result(
        true,
        `$${tnum(d.log)}=${tnum(d.elbo)}+${tnum(d.gap)}$. La identidad queda completa, en bits.`,
      );
    if (round === 0 && near(d.log + d.gap))
      return api.result(
        false,
        'Sumaste la KL. La ELBO queda bajo el logaritmo de la evidencia: réstale la KL.',
      );
    if (round === 1 && near(d.elbo - d.gap))
      return api.result(
        false,
        'Restaste la KL. Para recuperar el techo, suma la separación a la ELBO.',
      );
    if (round === 1 && near(2 ** d.log))
      return api.result(false, 'Escribiste p(D). Aquí se pide log₂ p(D), que puede ser negativo.');
    if (round === 2 && near(d.elbo - d.log))
      return api.result(
        false,
        'Invertiste la resta y la KL quedó negativa. Usa log₂ p(D) menos ELBO.',
      );
    if (near(-d.target))
      return api.result(
        false,
        round === 2
          ? 'La KL no puede ser negativa: mide cuánto falta hasta el techo.'
          : 'Cambiaste el signo. Los valores negativos del logaritmo y de la ELBO son válidos.',
      );
    return api.result(
      false,
      [
        'Despeja ELBO = log₂ p(D) − KL. Restar una separación baja la cota.',
        'Despeja log₂ p(D) = ELBO + KL. Suma con los signos de la tabla.',
        'Despeja KL = log₂ p(D) − ELBO. Restar una ELBO negativa suma su magnitud.',
      ][round],
    );
  };
  return (
    <Stage>
      <Cap x={550} y={125} size={24}>
        Completa el registro de control
      </Cap>
      <AuditCards values={d.values} />
      <Cap x={1250} y={240} size={21}>
        Todas las lecturas están en bits.
      </Cap>
      <NumberField
        x={1060}
        y={420}
        value={value}
        onChange={setValue}
        onEnter={submit}
        label={['ELBO =', 'log₂ p(D) =', 'KL ='][round]}
        width={4}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w11-c5',
  world: 'variational',
  code: '11.5',
  title: 'La cota',
  subtitle: 'ELBO',
  glyph: '\\operatorname{ELBO}',
  kind: 'level',
  guide: 'simon',
  teaser:
    'El registro muestra una cota que sube. Simón quiere saber qué permite afirmar esa mejora.',
  learn:
    'Completar la identidad entre logaritmo de la evidencia, ELBO y KL, y entender por qué subir la cota acerca q al posterior.',
  glyphs: ['vi-elbo-bound', 'vi-elbo-identity'],
  pitfalls: [
    'ELBO = log₂ p(D) − KL: sumar la KL invierte la cota.',
    'Una ELBO negativa es válida; la KL siempre es no negativa.',
    'El máximo en una familia restringida puede quedar bajo log₂ p(D).',
    'Mejorar la ELBO compara aproximaciones para un mismo modelo y los mismos datos.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'El rack soplaba aire tibio sobre el café frío de Simón. En la pantalla, un registro de ajuste terminaba con la palabra «convergió».',
        },
        {
          who: 'simon',
          text: 'La cota subió y dieron el ajuste por terminado. Halcón quería ese sello antes de las ocho.',
        },
        { who: 'iris', text: '¿El sello garantiza que quedó bien?' },
        {
          who: 'simon',
          text: 'Tengo un control chico que sí se puede revisar entero. El grande viene con una receta que yo no elegí.',
        },
        { who: 'tu', text: 'Abre el control; el sello puede esperar.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El sello del ajuste',
      Scene: BoundDemo,
      beats: [
        {
          say: 'El control pequeño registra ELBO = −3,25 bits y KL = 1,25 bits. Usa la identidad para recuperar el logaritmo de la evidencia.',
          ask: {
            prompt: '¿Cuánto vale log₂ p(D)?',
            options: ['−2 bits', '−4,5 bits', '0,25 bits'],
            answer: 0,
            explain: '−3,25 + 1,25 = −2 bits. 0,25 es p(D), una probabilidad; no es su logaritmo.',
          },
          note: {
            label: 'Techo del control',
            tex: '\\log_2 p(D)=-3{,}25+1{,}25=-2',
            body: 'p(D) = 1/4. Este control pequeño permite verificar la separación exacta.',
          },
        },
        {
          say: 'Con el mismo modelo y datos, otra q sube la ELBO a −2,5 bits. El logaritmo de la evidencia sigue en −2.',
          ask: {
            prompt: '¿Qué KL tiene la nueva q?',
            options: ['0,5 bits', '−0,5 bits', '0 bits'],
            answer: 0,
            explain:
              'KL = −2 − (−2,5) = 0,5 bits. Subir la cota redujo la separación desde 1,25, pero todavía no llegó a cero.',
          },
          note: {
            label: 'Mejora del ajuste',
            tex: 'KL=-2-(-2{,}5)=0{,}5',
            body: 'Una cota mayor acerca q al posterior para el mismo modelo y datos; el sello «convergió» no garantiza KL = 0.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Completar las cotas', Comp: BoundPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'Simón puso el control junto al registro grande. Con el dedo tapaba la firma al pie de la hoja.',
        },
        {
          who: 'simon',
          text: 'Subió, pero quedó espacio hasta el techo. Y si el molde es angosto, se puede ajustar toda la noche y seguir lejos.',
        },
        { who: 'iris', text: 'Muéstrame quién eligió el molde.' },
        {
          who: 'simon',
          text: 'El archivo está acá. Se llama «por separado».',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'vi-elbo-bound',
    world: 'variational',
    tex: '\\operatorname{ELBO}(q)\\le\\log_2 p(D)',
    name: 'Cota inferior de la evidencia',
    read: 'elbo de cu, menor o igual que logaritmo en base dos de pe de de',
    meaning:
      'Objetivo calculable desde q y el modelo conjunto que acota por abajo el logaritmo de la evidencia.',
    warn: 'Puede ser negativa. La igualdad exige que q coincida con el posterior.',
  },
  {
    id: 'vi-elbo-identity',
    world: 'variational',
    tex: IDENTITY,
    name: 'Identidad de la ELBO',
    read: 'logaritmo de la evidencia igual a elbo más ka ele',
    meaning: 'La KL al posterior es la separación entre la ELBO y el logaritmo de la evidencia.',
    warn: 'La equivalencia entre subir ELBO y bajar KL requiere mantener fijos el modelo y los datos.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'ELBO (caso discreto)',
      tex: '\\operatorname{ELBO}(q)=\\sum_\\theta q(\\theta)\\log_2\\frac{p(D,\\theta)}{q(\\theta)}',
      body: 'q es una distribución normalizada. Los términos con q = 0 aportan 0; si q > 0 donde la probabilidad conjunta vale 0, la cota es −∞.',
    },
    {
      label: 'Separación al posterior',
      tex: 'KL(q\\Vert p(\\cdot\\mid D))=\\sum_\\theta q(\\theta)\\log_2\\frac{q(\\theta)}{p(\\theta\\mid D)}',
    },
  ],
  props: [
    {
      label: 'Identidad',
      tex: IDENTITY,
      body: 'Para p(D) > 0 y términos finitos; con logaritmos en base 2, las magnitudes se expresan en bits.',
    },
    {
      label: 'Cota inferior',
      tex: '\\operatorname{ELBO}(q)\\le\\log_2 p(D)',
      body: 'La igualdad ocurre si y solo si q coincide con el posterior.',
    },
    {
      label: 'Optimización en una familia',
      tex: '\\underset{q\\in\\mathcal Q}{\\arg\\max}\\,\\operatorname{ELBO}(q)=\\underset{q\\in\\mathcal Q}{\\arg\\min}\\,KL(q\\Vert p(\\cdot\\mid D))',
      body: 'Mismo modelo y datos. Se puede optimizar la ELBO sin calcular la evidencia; una familia restringida puede impedir alcanzar KL = 0.',
    },
  ],
};

export { lesson };
