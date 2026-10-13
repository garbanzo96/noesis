import { useEffect, useMemo, useState } from 'react';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Axes, Dot } from '../../engine/shapes';
import type { ChallengeProps, Glyph, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, rng } from '../shared/rng';
import { Choices, Confirm, NumberField, parseNum } from '../shared/ui';
import { ContourMap, H, Surface, num, ortho, terrain } from './kit';

const MAP = plane([-5, 5], [-5, 5], { x: 300, y: 170, w: 580, h: 580 });
const SLOPE = plane([1, 5], [2, 6], { x: 300, y: 170, w: 580, h: 580 });
const HEIGHTS = [60, 80, 100, 120, 140];
const LOCAL_HEIGHTS = [120, 140, 160, 166, 180];
const TYPES = ['Mínimo', 'Máximo', 'Silla'];

function Rescue({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed);
    const dx = pick(r, [0.1, 0.2, 0.5]),
      dy = pick(r, [-0.1, 0, 0.1]);
    const [a, c] = pick(r, [
      [1, -1],
      [2, -1],
      [1, 2],
      [-2, -1],
    ]);
    return {
      dx,
      dy,
      a,
      c,
      D: 4 * a * c,
      estimate: H(3, 4) - 12 * dx - 8 * dy,
      type: a * c < 0 ? 'Silla' : a > 0 ? 'Mínimo' : 'Máximo',
      tex: `${a === 1 ? '' : a === -1 ? '-' : a}x^2${c < 0 ? '-' : '+'}${Math.abs(c) === 1 ? '' : Math.abs(c)}y^2+50`,
    };
  }, [seed]);
  const [first, setFirst] = useState(''),
    [second, setSecond] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  useEffect(() => {
    setFirst('');
    setSecond('');
    setChoice(null);
    const prompts: [string, string, string[]][] = [
      [
        'Lectura 1. El dron marcaba 120 m de altitud y 20 m sobre el suelo. ¿Qué altura del terreno debes seguir en las curvas del mapa?',
        'h=\\text{altitud}-\\text{distancia al suelo}',
        ['La altura del vuelo incluye la separación del terreno.', 'Resta 20 a 120.'],
      ],
      [
        'Lectura 2. El terreno es $H=200-2x^2-y^2$. Calcula las dos componentes del gradiente en (3, 4).',
        '\\nabla H=(H_x,H_y)',
        [
          'Deriva en x dejando y fija y después en y dejando x fija.',
          '$H_x=-4x$ y $H_y=-2y$; evalúa en el punto.',
        ],
      ],
      [
        `Lectura 3. Desde (3, 4), el desplazamiento estimado es $(${num(d.dx)};${num(d.dy)})$ km. Con $H(3,4)=166$, $H_x=-12$ y $H_y=-8$, estima la nueva altura (dos decimales si hace falta).`,
        'L=H(3,4)+H_x\\Delta x+H_y\\Delta y',
        [
          'Multiplica cada pendiente por su desplazamiento con signo.',
          'Suma los cambios al valor inicial de 166 m.',
        ],
      ],
      [
        `Lectura 4. Un tramo cercano se modela con $S=${d.tex}$. Clasifica el punto crítico (0, 0).`,
        'D=S_{xx}S_{yy}-S_{xy}^2',
        [
          'Las segundas parciales son constantes y la mixta vale cero.',
          'D < 0 indica silla; con D > 0 usa el signo de Sₓₓ.',
        ],
      ],
      [
        'Lectura 5. Con $P(r\\le R)=1-e^{-R^2}$, calcula el radio que cubre el 95 % de las posiciones posibles alrededor de la última señal (dos decimales, en km).',
        'R=\\sqrt{-\\ln(1-p)}',
        ['Fuera del disco debe quedar 0,05.', 'Usa $R=\\sqrt{\\ln20}$.'],
      ],
    ];
    const [text, tex, hints] = prompts[round];
    api.prompt(text, tex);
    api.hints(hints);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    if (round === 3) {
      if (choice === null) return;
      return api.result(
        choice === d.type,
        choice === d.type
          ? `$D=(${2 * d.a})(${2 * d.c})=${d.D}$ y $S_{xx}=${2 * d.a}$: ${d.type.toLowerCase()}.`
          : d.D < 0
            ? `D = ${d.D} es negativo: hay direcciones de subida y de bajada.`
            : `D = ${d.D} es positivo; revisa el signo de Sₓₓ = ${2 * d.a}.`,
      );
    }
    const v = parseNum(first);
    if (v === null) return;
    if (round === 1) {
      const w = parseNum(second);
      if (w === null) return;
      if (Math.abs(v + 12) < 0.011 && Math.abs(w + 8) < 0.011)
        return api.result(
          true,
          '$\\nabla H(3,4)=(-12,-8)$ m/km. El descenso apunta en el sentido opuesto.',
        );
      if (Math.abs(v - 12) < 0.011 && Math.abs(w - 8) < 0.011)
        return api.result(
          false,
          'Escribiste el máximo descenso. Esta lectura pide el gradiente, con el signo de las parciales.',
        );
      return api.result(false, 'Revisa Hₓ = −4x y Hᵧ = −2y, en el orden x, y.');
    }
    const target = round === 0 ? 100 : round === 2 ? d.estimate : Math.sqrt(Math.log(20));
    if (Math.abs(v - target) < 0.011)
      return api.result(
        true,
        round === 0
          ? '120 − 20 = 100 m: sigue la curva de nivel de 100 m.'
          : round === 2
            ? `$L=166-12(${num(d.dx)})-8(${num(d.dy)})=${num(target)}$ m: una estimación local.`
            : '$R=\\sqrt{\\ln20}\\approx1{,}73$ km. La zona de búsqueda queda delimitada.',
      );
    if (round === 0)
      return api.result(
        false,
        'La curva marca altura del suelo. Resta la separación del dron a su altitud.',
      );
    if (round === 2)
      return api.result(
        false,
        `Los cambios de altura son $${num(-12 * d.dx)}$ m y $${num(-8 * d.dy)}$ m. Súmalos a 166 m.`,
      );
    if (Math.abs(v - Math.log(20)) < 0.011)
      return api.result(false, 'Calculaste el radio al cuadrado. Falta sacar la raíz positiva.');
    return api.result(
      false,
      'El logaritmo usa la probabilidad fuera del disco: 0,05. Cambia el signo y saca raíz.',
    );
  };
  return (
    <Stage>
      {round === 0 && (
        <>
          <Axes P={MAP} xLabel="\text{este}" yLabel="\text{norte}" />
          <ContourMap P={MAP} f={terrain} levels={HEIGHTS} />
          <Dot x={MAP.x(3)} y={MAP.y(Math.sqrt(8))} color={C.amber} />
          <Cap x={1230} y={250} tex="\text{altitud: }120\;\mathrm m" />
          <Cap x={1230} y={325} tex="\text{sobre el suelo: }20\;\mathrm m" />
        </>
      )}
      {(round === 1 || round === 2) && (
        <>
          <Axes
            P={SLOPE}
            xTicks={[1, 3, 5]}
            yTicks={[2, 4, 6]}
            xLabel="\text{este (km)}"
            yLabel="\text{norte (km)}"
          />
          <ContourMap P={SLOPE} f={H} levels={LOCAL_HEIGHTS} />
          <Dot x={SLOPE.x(3)} y={SLOPE.y(4)} color={C.amber} />
          <Cap x={SLOPE.x(3) - 28} y={SLOPE.y(4) + 30} tex="(3,4)" color={C.amber} />
          <Cap x={1230} y={230} tex="H=200-2x^2-y^2" />
          {round === 2 && (
            <>
              <Dot x={SLOPE.x(3 + d.dx)} y={SLOPE.y(4 + d.dy)} color={C.magenta} />
              <Cap
                x={1230}
                y={310}
                tex={`\\Delta x=${num(d.dx)},\\quad\\Delta y=${num(d.dy)}`}
                color={C.magenta}
              />
            </>
          )}
        </>
      )}
      {round === 3 && (
        <>
          <Surface
            f={(x, y) => d.a * x * x + d.c * y * y}
            P3={ortho({ cx: 600, scale: 90, zScale: 0.2, xr: [-2, 2], yr: [-2, 2] })}
          />
          <Cap x={650} y={170} tex={`S=${d.tex}`} />
          <Cap x={650} y={690} tex="\nabla S(0,0)=(0,0)" color={C.amber} />
          <Choices x={1230} y={410} options={TYPES} value={choice} onPick={setChoice} />
        </>
      )}
      {round === 4 && (
        <>
          <circle
            cx={590}
            cy={450}
            r={220}
            fill={C.amber}
            fillOpacity={0.12}
            stroke={C.amber}
            strokeWidth={3}
            strokeDasharray="8 8"
          />
          <Dot x={590} y={450} color={C.text} />
          <Cap x={590} y={170}>
            Último punto recibido
          </Cap>
          <Cap x={590} y={720} size={19}>
            Radio por calcular; esquema sin escala.
          </Cap>
          <Cap x={1230} y={240} tex="P(r\le R)=1-e^{-R^2}" color={C.cyan} />
          <Cap x={1230} y={325} tex="p=0{,}95" color={C.magenta} />
        </>
      )}
      {round !== 3 && (
        <NumberField
          x={1050}
          y={440}
          label={round === 0 ? 'suelo =' : round === 1 ? 'Hₓ =' : round === 2 ? 'L =' : 'R ='}
          unit={round === 0 || round === 2 ? 'm' : round === 4 ? 'km' : undefined}
          value={first}
          onChange={setFirst}
          onEnter={submit}
        />
      )}
      {round === 1 && (
        <NumberField
          x={1050}
          y={545}
          label="Hᵧ ="
          value={second}
          onChange={setSecond}
          onEnter={submit}
        />
      )}
      <Cap x={1230} y={710} size={17} color={C.muted}>
        Lectura {round + 1} de 5
      </Cap>
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w7-final',
  world: 'multivariate',
  code: '7.★',
  title: 'La quebrada',
  subtitle: 'Repaso del mundo',
  glyph: '\\bigstar',
  kind: 'boss',
  module: 'w7-closed',
  guide: 'tomas',
  teaser:
    'Llueve en la quebrada Jaime. Tomás espera las últimas lecturas antes de bajar por el dron y su chip.',
  learn:
    'Usar curvas de nivel, gradientes, estimaciones lineales, puntos críticos y coordenadas polares en un rescate.',
  glyphs: ['mv-contour', 'mv-gradient', 'mv-linearization', 'mv-hessian', 'mv-polar-area'],
  notes: [
    { label: 'Radio del rescate', tex: 'R_{95}=\\sqrt{\\ln20}\\approx1{,}73\\;\\mathrm{km}' },
  ],
  steps: [
    {
      kind: 'scene',
      place: 'cerros',
      lines: [
        {
          who: 'nar',
          text: 'Quebrada Jaime, 03:00. La lluvia golpea el casco de Tomás mientras prueba el peso de la cuerda.',
        },
        {
          who: 'tomas',
          text: 'El anclaje aguanta. Necesito las lecturas revisadas antes de bajar; desde abajo la radio se corta.',
        },
        {
          who: 'teo',
          text: 'La luz sigue dentro de la zona de búsqueda. Puedo mantener la antena ahí mientras queda batería.',
        },
        {
          who: 'iris',
          text: 'Cinco lecturas. Después me dices si esa cuerda también aguanta el chip.',
        },
        { who: 'tomas', text: 'El chip pesa poco. Lo complicado suele venir con él.' },
      ],
    },
    { kind: 'challenge', title: 'Rescate nocturno', Comp: Rescue, rounds: 5 },
    {
      kind: 'scene',
      place: 'cerros',
      lines: [
        {
          who: 'nar',
          text: 'La cuerda vuelve mojada y tensa. Tomás aparece con el dron sujeto al arnés; la luz roja le ilumina los guantes.',
        },
        {
          who: 'tomas',
          text: 'Está entero. La caja térmica está vacía; alguien la abrió antes de que llegara el agua.',
        },
        { who: 'iris', text: 'Las vacunas siguieron viaje. ¿Y el chip?' },
        {
          who: 'teo',
          text: 'Sigue transmitiendo mensajes cifrados. Las rutas guardadas enlazan una red de antenas, y varios mensajes llegan con bits perdidos.',
        },
        { who: 'tu', text: 'Guarda las rutas y los mensajes tal como llegaron.' },
        {
          who: 'nar',
          text: 'Teo abre el mapa de Las Antenas. Sobre los cerros, una luz distante parpadea al mismo ritmo que el chip.',
        },
      ],
    },
  ],
};
export const glyphs: Glyph[] = [];
