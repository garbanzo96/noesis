import { useEffect, useMemo, useState } from 'react';
import { C } from '../../engine/palette';
import { Stage } from '../../engine/Stage';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng, shuffle } from '../shared/rng';
import { Choices, Confirm, NumberField } from '../shared/ui';
import {
  ACCENT,
  parseExact,
  CodeCost,
  CODES,
  COUNTS,
  DiscreteDial,
  P,
  Q,
  Q_CODES,
  SYMBOLS,
  bitsText,
  entropy,
  fraction,
  info,
  kl,
  meanLength,
  sum,
} from './kit';

const LP = P.map(info),
  LQ = Q.map(info);
const OWN = 8 * meanLength(P, LP),
  OTHER = 8 * meanLength(P, LQ);
const profileTex = (xs: number[]) => `(${xs.map(fraction).join(',')})`;
function ProfileLesson({ beats, unlock, answer, reduced }: DemoProps) {
  const [profile, setProfile] = useState(0);
  const [visited, setVisited] = useState(() => new Set<number>());
  const b = beats.beat,
    reverse = b === 5,
    source = reverse ? Q : P;
  const chosen = b === 1 ? (profile === 0 ? P : Q) : reverse ? P : Q;
  const codes = chosen === P ? CODES : Q_CODES;
  const complete = profile === 1 && visited.size === 2;
  return (
    <Stage>
      <CodeCost
        source={source}
        profile={chosen}
        count={8}
        showReadings={false}
        showContributions={b === 3 || (b === 4 && answer !== null) || b === 5}
        progress={b === 0 && !reduced ? beats.at(0) : 1}
      />
      {b <= 2 &&
        SYMBOLS.map((symbol, i) => (
          <Cap
            key={symbol}
            x={230 + i * 190}
            y={745}
            tex={`${symbol}=${codes[symbol as keyof typeof codes]}`}
            size={20}
            color={C.amber}
          />
        ))}
      <Cap x={1250} y={230} color={ACCENT}>
        {reverse ? 'Q emite; P elige longitudes.' : 'P emite; el perfil elige longitudes.'}
      </Cap>
      {b === 0 && (
        <>
          <Cap x={1250} y={330} tex="P=(\frac12,\frac14,\frac18,\frac18)" size={21} />
          <Cap x={1250} y={430} tex="Q=(\frac18,\frac12,\frac14,\frac18)" size={21} />
          <Cap x={1250} y={540}>
            A: una casilla con P; tres con Q.
          </Cap>
        </>
      )}
      {b === 1 && (
        <>
          <Cap x={1250} y={330}>
            Propio: {bitsText(OWN)} · Elegido: {bitsText(8 * meanLength(P, chosen.map(info)))}
          </Cap>
          <DiscreteDial
            value={profile}
            max={1}
            labels={['P', 'Q']}
            y={460}
            onChange={setProfile}
            onSettle={(i) => {
              const next = new Set(visited).add(i);
              setVisited(next);
              setProfile(i);
              if (i === 1 && next.size === 2 && OWN === 14 && OTHER === 19) unlock();
            }}
          />
          <Cap x={1250} y={600} size={19} color={complete ? C.green : C.amber}>
            {complete
              ? 'Ambas cintas completas: 14 y 19 bits.'
              : 'Suelta en P; después suelta en Q.'}
          </Cap>
          <Cap x={1250} y={690} size={19}>
            {visited.has(0) ? 'P ✓' : 'P pendiente'} · {visited.has(1) ? 'Q ✓' : 'Q pendiente'}
          </Cap>
        </>
      )}
      {b === 2 && (
        <>
          <Cap x={1250} y={330} tex="\ell_Q=(3,1,2,3)" color={C.amber} />
          <Cap x={1250} y={430} tex="L_Q(P)=\frac{19}{8}=2{,}375" />
          <Cap x={1250} y={540}>
            Los pesos siguen siendo los de P.
          </Cap>
        </>
      )}
      {b === 3 && (
        <>
          <Cap x={1250} y={330} tex="H(P)=\frac74" />
          <Cap x={1250} y={430} tex="D(P\Vert Q)=\frac{19}{8}-\frac74" size={21} />
          <Cap x={1250} y={540} tex="D(P\Vert Q)=\frac58=0{,}625" color={C.magenta} />
          <Cap x={1250} y={650} size={18}>
            Aportes inferiores: bits por símbolo.
          </Cap>
        </>
      )}
      {b === 4 && (
        <>
          <Cap x={1250} y={330} tex="\frac{P_B}{Q_B}=\frac12" color={C.amber} />
          <Cap x={1250} y={440} tex="D=\sum_i P_i\log_2(P_i/Q_i)" size={21} />
          {answer !== null && (
            <Cap x={1250} y={550} tex="1-\frac14-\frac18+0=\frac58" color={C.magenta} />
          )}
        </>
      )}
      {b === 5 && (
        <>
          <Cap x={1250} y={330} tex="L_P(Q)=\frac94" />
          <Cap x={1250} y={430} tex="D(Q\Vert P)=\frac12" color={C.amber} />
          <Cap x={1250} y={530} tex="D(P\Vert Q)=\frac58" color={C.magenta} />
          <Cap x={1250} y={640} tex="D(P\Vert P)=0" />
        </>
      )}
    </Stage>
  );
}
const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Divergencia de Kullback–Leibler',
  intro: {
    question: '¿Cuánto se pierde al usar un código pensado para otra fuente?',
    text: 'Si se codifica una fuente con un código armado para otra, cada símbolo cuesta más bits de lo necesario. La divergencia de Kullback–Leibler mide ese exceso; nunca es negativa y no es simétrica. El perfil cargado en el chip reparte las ramas distinto que el archivo anterior.',
  },
  Scene: ProfileLesson,
  beats: [
    {
      say: 'Las dos cintas reciben las mismas ocho fichas: cuatro A, dos B, una C y una D. P sigue emitiendo lo mismo; Q asigna una palabra de tres bits a A, que con P usaba uno.',
      dur: 3,
      board: {
        label: 'Fuente y perfil',
        tex: '\\p{1}{\\cC{P}\\ \\text{emite}},\\quad\\p{2}{\\cA{Q}\\ \\text{elige largos}}',
        parts: ['fuente de los símbolos', 'perfil para codificar'],
      },
    },
    {
      say: 'Pasa el lote por ambos perfiles. Las cintas conservan sus conteos y miden los bits completos de cada código.',
      gate: 'Suelta la perilla en P para leer 14 bits; luego arrástrala y suéltala en Q para leer 19 bits.',
      board: {
        label: 'Exceso del lote pequeño',
        tex: '\\p{1}{\\cA{19}}-\\p{2}{\\cC{14}}=\\p{3}{\\cM{5}}',
        parts: ['bits con perfil ajeno', 'bits con perfil propio', 'bits de exceso'],
      },
    },
    {
      say: 'Divide por los ocho símbolos. La **entropía cruzada** promedia con las probabilidades reales de P los largos ideales que recomienda Q.',
      dur: 3,
      board: [
        {
          label: 'Entropía cruzada',
          tex: '\\p{1}{\\cA{L_Q(P)}}=\\p{2}{-\\sum_i\\cC{P_i}\\log_2Q_i}',
          parts: ['bits medios con q', 'largos ideales según p'],
        },
        {
          label: 'Media del perfil ajeno',
          tex: '\\p{1}{L_Q(P)}=\\p{2}{\\tfrac{19}{8}}=\\p{3}{2{,}375}',
          parts: ['bits medios con q', 'bits entre símbolos', 'bits por símbolo'],
        },
      ],
    },
    {
      say: 'Resta la longitud ideal propia. La **divergencia KL** mide ese exceso ideal por símbolo; aquí coincide con el exceso del código porque ambos perfiles tienen largos ideales enteros.',
      dur: 3,
      board: [
        {
          label: 'Divergencia KL',
          tex: '\\p{1}{\\cM{D(P\\Vert Q)}}=\\p{2}{\\sum_iP_i\\log_2\\frac{P_i}{Q_i}}',
          parts: ['exceso ideal por símbolo', 'aportes del desajuste'],
        },
        {
          label: 'Exceso ideal por símbolo',
          tex: '\\p{1}{D(P\\Vert Q)}=\\p{2}{L_Q(P)-H(P)}=\\p{3}{\\tfrac58}',
          parts: ['exceso ideal por símbolo', 'costo ajeno menos propio', 'bits extra por símbolo'],
        },
      ],
    },
    {
      say: 'Cada aporte conserva el signo de su logaritmo. Revisa el cociente de B antes de sumar; no tomes valores absolutos.',
      ask: {
        prompt:
          '¿Puede un aporte individual ser negativo aunque la divergencia total sea no negativa?',
        options: [
          'Sí; aquí B aporta −1/4 y el total es 5/8',
          'No; se toma valor absoluto en cada aporte',
          'Sí; por eso el total correcto es −5/8',
        ],
        answer: 0,
        explain:
          'P_B/Q_B = 1/2 y su logaritmo es −1. El aporte es −1/4; sumado con los otros da 1 − 1/4 − 1/8 + 0 = 5/8.',
      },
      board: {
        label: 'Conservar los signos',
        tex: '\\p{1}{D(P\\Vert Q)}=\\p{2}{\\sum_i\\cC{P_i}\\log_2\\frac{P_i}{\\cA{Q_i}}}',
        parts: ['exceso ideal por símbolo', 'aportes con su signo'],
      },
    },
    {
      say: 'Ahora Q emite y P codifica. La divergencia nunca es negativa y vale cero cuando los repartos coinciden; cambiar la fuente puede cambiar el costo.',
      dur: 3,
      board: [
        {
          label: 'Cambiar la dirección',
          tex: '\\p{1}{D(P\\Vert Q)=\\cM{\\tfrac58}}\\ne\\p{2}{D(Q\\Vert P)=\\cA{\\tfrac12}}',
          parts: ['exceso al usar q', 'exceso al usar p'],
        },
        {
          label: 'No negatividad e igualdad',
          tex: '\\p{1}{D(P\\Vert Q)}\\ge\\p{2}{0},\\quad\\p{3}{D(P\\Vert P)=0}',
          body: 'Para estos soportes positivos, la concavidad del logaritmo da $-\\sum_iP_i\\log_2(Q_i/P_i)\\ge-\\log_2\\sum_iQ_i=0$. KL mide largos ideales: redondear o usar códigos enteros arbitrarios puede añadir otros costos.',
          parts: ['exceso ideal por símbolo', 'mínimo del exceso', 'sin exceso al coincidir'],
        },
      ],
    },
  ],
};
function AuthorizationDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const reverse = beat >= 2;
  const acting = beat === 0 || beat === 2;
  const [profile, setProfile] = useState(0);
  useEffect(() => setProfile(reverse ? 1 : 0), [beat, reverse]);
  const selected = acting ? profile : reverse ? 0 : 1;
  const source = reverse ? Q : P;
  const chosen = selected === 0 ? P : Q;
  return (
    <Stage>
      <CodeCost
        source={source}
        profile={chosen}
        count={sum(COUNTS)}
        showReadings={false}
        showContributions={false}
      />
      <Cap x={1250} y={230} color={ACCENT}>
        {reverse ? 'Q emite' : 'P emite'} · {selected === 0 ? 'P' : 'Q'} codifica
      </Cap>
      <Cap x={1250} y={330}>
        64 cabeceras · Propio: 112 bits
      </Cap>
      <Cap x={1250} y={410}>
        Perfil: {bitsText(sum(COUNTS) * meanLength(source, chosen.map(info)))}
      </Cap>
      {answer !== null && (
        <Cap
          x={1250}
          y={490}
          color={C.magenta}
          tex={reverse ? 'D(Q\\Vert P)=\\tfrac12' : '152-112=64\\cdot\\tfrac58=40'}
          size={21}
        />
      )}
      {acting && (
        <DiscreteDial
          key={beat}
          value={profile}
          max={1}
          labels={['P', 'Q']}
          y={620}
          onChange={setProfile}
          onSettle={(i) => {
            if (i === (reverse ? 0 : 1)) unlock();
          }}
        />
      )}
      <Cap x={530} y={745} size={19}>
        Revisión de perfil: cuenta receptora «Contador»
      </Cap>
      <Cap x={1250} y={790} size={18}>
        Guardado después del reinicio de Inés.
      </Cap>
    </Stage>
  );
}
function ProfilePractice({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 139 + round),
      reverse = pick(r, [false, true]),
      equal = round === 2 && pick(r, [0, 1, 2]) === 0;
    const order = shuffle(r, [0, 1, 2, 3]),
      t = randInt(r, 1, 8);
    const source = order.map((i) => (equal || !reverse ? P : Q)[i]);
    const profile = order.map((i) => (equal || reverse ? P : Q)[i]);
    return {
      t,
      source,
      profile,
      labels: order.map((i) => SYMBOLS[i]),
      sourceName: equal || !reverse ? 'P' : 'Q',
      profileName: equal || reverse ? 'P' : 'Q',
      equal,
    };
  }, [seed, round]);
  const [value, setValue] = useState('');
  const [symmetric, setSymmetric] = useState<string | null>(null);
  const mean = meanLength(data.source, data.profile.map(info)),
    divergence = kl(data.source, data.profile);
  const count = round === 1 ? 8 * data.t : 8;
  useEffect(() => {
    setValue('');
    setSymmetric(null);
    api.prompt(
      round === 0
        ? `La fuente ${data.sourceName} emite; el código del perfil ${data.profileName} usa los largos ideales mostrados. Escribe la longitud media exacta, como decimal o fracción.`
        : round === 1
          ? `${count} símbolos emitidos por ${data.sourceName}; codificados con ${data.profileName}. Escribe el exceso total en bits respecto del código propio.`
          : `Compara ${data.sourceName} con ${data.profileName}. Escribe D por símbolo, como decimal o fracción exacta, y decide si coincide con la dirección inversa.`,
    );
    api.hints(
      round === 0
        ? [
            'Multiplica cada largo por la probabilidad de la fuente emisora.',
            'Los pesos son los de la fuente; el perfil aporta los largos.',
          ]
        : round === 1
          ? [
              'Resta la longitud media propia a la del perfil ajeno.',
              'Multiplica el exceso por la cantidad de símbolos; conserva los signos al sumar.',
            ]
          : [
              'Suma los aportes Pᵢ log₂(Pᵢ/Qᵢ) usando la fuente indicada.',
              'La igualdad depende de los repartos, no del nombre ni de la escritura de sus códigos.',
            ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, round]);
  const submit = () => {
    const v = parseExact(value);
    if (v === null || !Number.isFinite(v) || (round === 2 && symmetric === null)) return;
    const target = round === 0 ? mean : round === 1 ? count * divergence : divergence;
    const same = kl(data.profile, data.source) === divergence;
    if (v === target && (round !== 2 || symmetric === (same ? 'Sí' : 'No')))
      return api.result(
        true,
        round === 0
          ? `$L_{${data.profileName}}(${data.sourceName})=${fraction(mean)}$ bits/símbolo.`
          : round === 1
            ? `$${count}\\cdot${fraction(divergence)}=${target}$ bits extra.`
            : `$D(${data.sourceName}\\Vert${data.profileName})=${fraction(divergence)}$. ${same ? 'Los repartos coinciden; la inversa también vale cero.' : 'La dirección inversa cambia los pesos y el resultado.'}`,
      );
    if (round === 0 && v === entropy(data.profile))
      return api.result(
        false,
        'Ponderaste con el perfil del código. Los símbolos siguen llegando con las probabilidades de la fuente emisora.',
      );
    if (round === 1 && v === count * mean)
      return api.result(
        false,
        'Ese es el tamaño completo. Resta el tamaño que ocupaba el mismo lote con su código propio.',
      );
    const absolute = sum(data.source.map((p, i) => Math.abs(p * Math.log2(p / data.profile[i]))));
    if (round === 1 && v === count * absolute)
      return api.result(
        false,
        'Tomaste valores absolutos antes de sumar. Los aportes negativos reducen el exceso y deben conservarse.',
      );
    if (round === 1 && v === divergence)
      return api.result(
        false,
        'Entregaste bits por símbolo. Multiplica por la cantidad de símbolos para hallar el exceso del lote.',
      );
    if (round === 2 && !data.equal && symmetric === 'Sí')
      return api.result(
        false,
        'KL no es simétrica. Invertir fuente y perfil cambia las probabilidades que ponderan el promedio.',
      );
    if (round === 2 && data.equal)
      return api.result(
        false,
        'Los repartos coinciden: cada cociente vale uno y su logaritmo vale cero. La inversa también es cero; los códigos podrían escribir palabras distintas.',
      );
    if (v < 0)
      return api.result(
        false,
        'Los aportes individuales pueden ser negativos; la divergencia total de distribuciones completas es no negativa.',
      );
    api.result(
      false,
      round === 0
        ? 'Promedia los largos con las probabilidades de la fuente emisora, respetando cada etiqueta.'
        : 'Resta la entropía de la fuente al largo medio del perfil ajeno; revisa la dirección antes de multiplicar por el lote.',
    );
  };
  return (
    <Stage>
      <CodeCost
        source={data.source}
        profile={data.profile}
        labels={data.labels}
        count={count}
        showReadings={false}
        showContributions={false}
      />
      <Cap
        x={530}
        y={735}
        tex={`${data.sourceName}=${profileTex(data.source)}`}
        size={21}
        color={ACCENT}
      />
      <Cap
        x={530}
        y={805}
        tex={`${data.profileName}=${profileTex(data.profile)}`}
        size={21}
        color={C.amber}
      />
      <Cap x={1250} y={230}>
        {data.sourceName} emite · {data.profileName} codifica
      </Cap>
      <Cap
        x={1250}
        y={330}
        tex={`\\ell_{${data.profileName}}=${profileTex(data.profile.map(info))}`}
        color={C.amber}
        size={21}
      />
      <NumberField
        x={1050}
        y={460}
        label={round === 0 ? 'media =' : round === 1 ? 'exceso =' : 'D ='}
        width={4}
        value={value}
        onChange={setValue}
        onEnter={submit}
      />
      {round === 2 && (
        <>
          <Cap x={1250} y={570} size={20}>
            ¿Coincide con la inversa?
          </Cap>
          <Choices
            x={1250}
            y={660}
            options={['Sí', 'No']}
            value={symmetric}
            onPick={setSymmetric}
          />
        </>
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}
export const level: LevelSpec = {
  id: 'w8-c6',
  world: 'information',
  code: '8.6',
  title: 'El perfil cambiado',
  subtitle: 'Divergencia de Kullback–Leibler',
  glyph: 'D(P\\Vert Q)',
  kind: 'level',
  guide: 'ines',
  teaser: 'La firma de Inés permite un reinicio. La copia anterior conserva otro reparto de ramas.',
  learn:
    'Calcular entropía cruzada y divergencia KL, conservar los signos y comparar ambas direcciones.',
  glyphs: ['it-cross-entropy', 'it-kl'],
  pitfalls: [
    'La fuente emisora aporta los pesos; el perfil del código aporta los largos.',
    'Los aportes individuales pueden ser negativos y no se toman valores absolutos.',
    'KL no es simétrica ni equivale al exceso entre códigos enteros arbitrarios.',
    'El costo localiza un cambio de perfil; la autoría requiere el registro de acceso.',
  ],
  notes: [
    { label: 'Entropías de ambos perfiles', tex: 'H(P)=H(Q)=\\tfrac74' },
    { label: 'Costo de Q para la fuente P', tex: 'L_Q(P)=\\tfrac{19}{8}=2{,}375' },
    { label: 'Divergencias', tex: 'D(P\\Vert Q)=\\tfrac58,\\quad D(Q\\Vert P)=\\tfrac12' },
    {
      label: 'Cuenta de revisión',
      body: 'La asignación fue guardada con la cuenta receptora «Contador» después del reinicio autorizado por Inés. Este registro administrativo se conserva separado del cálculo.',
    },
  ],
  steps: [
    {
      kind: 'scene',
      place: 'antenas',
      lines: [
        {
          who: 'nar',
          text: 'Terminal de reserva, cinco y veinticinco. Un relé hizo clic sin encender la lámpara, e Inés apartó la mano de la tecla de reinicio.',
        },
        {
          who: 'ines',
          text: 'Con mi firma se pudo levantar el servicio. El archivo anterior quedó en el chip.',
        },
        { who: 'iris', text: 'Tu firma sirve, y la diferencia entre los dos archivos también.' },
        { who: 'teo', text: 'Tengo los dos. Voy a pasar el mismo lote por cada árbol.' },
        { who: 'nar', text: 'La rama corta de A había quedado larga en el archivo cargado.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La autorización y la copia',
      Scene: AuthorizationDemo,
      beats: [
        {
          say: 'Las 64 cabeceras tienen conteos (32,16,8,8). Con P ocupan 112 bits. Cambia el perfil a Q y lee el tamaño del mismo lote. La revisión administrativa sitúa el cambio con la cuenta «Contador», después del reinicio de Inés.',
          gate: 'Arrastra la perilla desde P hasta Q y suéltala para medir el lote.',
        },
        {
          say: 'El mismo lote ocupa 112 bits con P y 152 con Q. Compara los tamaños que mediste.',
          ask: {
            prompt: '¿Cuántos bits agrega Q al lote emitido con reparto P?',
            options: ['152', '40', '32'],
            answer: 1,
            explain:
              '64 × 5/8 = 40. El 152 es el total; el 32 corresponde al exceso al invertir fuente y perfil.',
          },
          note: {
            label: 'Exceso del perfil cambiado',
            tex: '64\\cdot\\tfrac{19}{8}-112=152-112=40',
            body: 'El costo demuestra el aumento. La cuenta de revisión es evidencia administrativa separada.',
          },
        },
        {
          say: 'Invierte la comparación: Q emite 64 cabeceras con su propio reparto, con conteos (8,32,16,8). Con Q ocupan 112 bits. Cambia el perfil a P y mide el nuevo tamaño.',
          gate: 'Arrastra la perilla desde Q hasta P y suéltala para medir el lote inverso.',
        },
        {
          say: 'El lote de Q ocupa 144 bits con P y 112 con su código propio. Divide los 32 bits de exceso por las 64 cabeceras para comparar ambas direcciones.',
          ask: {
            prompt: 'Si Q emitiera y usara el código de P, ¿el exceso por símbolo sería el mismo?',
            options: ['Sí, toda divergencia es simétrica', 'Sería −5/8', 'No; sería 1/2 bit'],
            answer: 2,
            explain:
              'L_P(Q) = 9/4 y H(Q) = 7/4. El exceso es 1/2 bit por símbolo; invertir cambia los pesos y mantiene el total no negativo.',
          },
          note: {
            label: 'Costo en dirección inversa',
            tex: 'D(Q\\Vert P)=\\tfrac94-\\tfrac74=\\tfrac12',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Comparar perfiles y lotes', Comp: ProfilePractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'antenas',
      lines: [
        {
          who: 'nar',
          text: 'Inés encontró otra casilla bajo el perfil. El auricular crujió antes de que alcanzara a leerla.',
        },
        {
          who: 'ines',
          text: 'El reinicio dejaba el servicio lento, y esta casilla la cambiaron después.',
        },
        {
          who: 'teo',
          text: 'Pide cuatro veces la tasa anterior. La copia guarda las dos configuraciones.',
        },
        {
          who: 'nar',
          text: 'Llegó un paquete del largo completo, y su comprobación quedó en rojo.',
        },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'it-cross-entropy',
    world: 'information',
    tex: 'L_Q(P)=-\\sum_iP_i\\log_2Q_i',
    name: 'Entropía cruzada',
    read: 'ele sub equ de pe',
    meaning: 'Promedio de los largos ideales de Q ponderado por la fuente real P.',
  },
  {
    id: 'it-kl',
    world: 'information',
    tex: 'D(P\\Vert Q)=\\sum_iP_i\\log_2(P_i/Q_i)',
    name: 'Divergencia KL',
    read: 'divergencia de pe respecto de equ',
    meaning:
      'Exceso ideal por símbolo de usar Q para una fuente P; es no negativo y puede cambiar al invertir los repartos.',
    warn: 'Si Pᵢ > 0 y Qᵢ = 0, la divergencia es infinita. La igualdad en cero depende de las distribuciones.',
  },
];
