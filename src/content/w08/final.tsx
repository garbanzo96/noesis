import { useEffect, useMemo, useState } from 'react';
import { C } from '../../engine/palette';
import { useTween } from '../../engine/hooks';
import { Html, Stage } from '../../engine/Stage';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, NumberField } from '../shared/ui';
import {
  ACCENT,
  BitTape,
  CODES,
  COUNTS,
  CodeCost,
  DragToken,
  JointGrid,
  P,
  ParityRack,
  PrefixTree,
  Q,
  ROUTE_COUNTS,
  ROUTE_TABLE,
  SymbolTray,
  TREE,
  bscCapacity,
  conditionalEntropy,
  decodePrefix,
  entropy,
  fraction,
  hammingCorrect,
  hammingSyndrome,
  info,
  kl,
  meanLength,
  mutualInfo,
  near,
  num,
  parseExact,
  sum,
} from './kit';
import { capacityTex } from './c7-tasa';
import { flipBit } from './c8-posicion';

const COUNT = sum(COUNTS),
  OWN = COUNT * meanLength(P, TREE.lengths),
  OTHER = COUNT * meanLength(P, Q.map(info));
const VALID = '0110011',
  RECEIVED = flipBit(VALID, 5);
const JUSTIFICATIONS = [
  'La torre deja dos rutas y la ruta determina la torre',
  'Todas las combinaciones son independientes',
  'Conocer la torre determina siempre la ruta',
];
const NEXT_STEPS = [
  'Aceptar cualquier mensaje con síndrome cero',
  'Validar el paquete completo',
  'Interpretar el síndrome como fecha',
];
function EvidenceOptions({
  options,
  value,
  onPick,
  y = 545,
}: {
  options: string[];
  value: string | null;
  onPick: (v: string) => void;
  y?: number;
}) {
  return (
    <>
      {options.map((option, i) => (
        <Html
          key={option}
          x={1250}
          y={y + i * 90}
          size={18}
          interactive
          style={{ width: 'max(calc(var(--su) * 410), 17em)', whiteSpace: 'normal' }}
        >
          <button
            className={`stage-btn ${value === option ? 'on' : ''}`}
            style={{ width: '100%', whiteSpace: 'normal', lineHeight: 1.3 }}
            onClick={() => onPick(option)}
          >
            {option}
          </button>
        </Html>
      ))}
    </>
  );
}
function ReviewLesson({ beats, unlock, answer, reduced }: DemoProps) {
  const [placed, setPlaced] = useState(false),
    [message, setMessage] = useState('');
  const b = beats.beat;
  const returnProgress = useTween(placed ? 1 : 0, 0.8, undefined, reduced);
  const route = [TREE.nodes.find((n) => n.symbol === 'D')!];
  while (route.at(-1)!.id !== TREE.root) {
    const edge = TREE.edges.find((e) => e.to === route.at(-1)!.id)!;
    route.push(TREE.nodes.find((n) => n.id === edge.from)!);
  }
  const segment = Math.min(route.length - 2, Math.floor(returnProgress * (route.length - 1)));
  const local = returnProgress * (route.length - 1) - segment;
  const marker = {
    x: route[segment].x + (route[segment + 1].x - route[segment].x) * local,
    y: route[segment].y + (route[segment + 1].y - route[segment].y) * local,
  };
  return (
    <Stage>
      {b === 0 && (
        <>
          <SymbolTray counts={COUNTS} selected={3} y={230} height={400} fillOpacity={0.7} />
          <Cap x={1250} y={240} tex="p(D)=8/64=1/8" />
          <Cap x={1250} y={350} tex="I(D)=3\ \mathrm{bits}" color={ACCENT} />
        </>
      )}
      {b === 1 && (
        <>
          <PrefixTree nodes={TREE.nodes} edges={TREE.edges} active={placed ? '111' : ''} />
          {placed && <circle cx={marker.x} cy={marker.y} r={11} fill={C.amber} />}
          {!placed && (
            <DragToken
              x={350}
              y={750}
              label="D"
              onDrop={(x, y) => {
                const leaf = TREE.nodes.find((n) => n.symbol === 'D')!;
                if (near(x, y, leaf.x, leaf.y) && TREE.codes.D === '111') {
                  setPlaced(true);
                  setMessage('D en la hoja 111 ✓ · el lector vuelve a la raíz');
                  unlock();
                } else
                  setMessage('Suelta D en el centro del nodo de su hoja, sobre la etiqueta D.');
              }}
            />
          )}
          <Cap x={1250} y={240} tex="c(D)=111" color={ACCENT} />
          <Cap x={1250} y={350} tex="\bar L=H(P)=7/4" />
          <Cap x={1250} y={460} size={19}>
            La hoja completa la palabra.
          </Cap>
          <Cap x={530} y={835} color={C.green} size={18}>
            {message}
          </Cap>
        </>
      )}
      {b === 2 && (
        <>
          <JointGrid
            counts={ROUTE_COUNTS}
            rows={['Norte', 'Sur']}
            columns={['a', 'b', 'c', 'd']}
            columnFilter={3}
          />
          <Cap x={1250} y={240}>
            Dato conocido: ruta d
          </Cap>
          <Cap x={1250} y={350} tex="H(X\mid Y)=H(X,Y)-H(Y)" size={20} />
          {answer !== null && (
            <>
              <Cap x={1250} y={460} tex="H(X\mid Y)=0" color={ACCENT} />
              <Cap x={1250} y={570} tex="I(X;Y)=1\ \mathrm{bit}" color={C.magenta} />
            </>
          )}
        </>
      )}
      {b === 3 && (
        <>
          <CodeCost
            source={P}
            profile={Q}
            count={COUNT}
            showReadings={false}
            showContributions={false}
            progress={reduced ? 1 : beats.at(3)}
          />
          <Cap x={1250} y={240} tex="D(P\Vert Q)=5/8" color={C.amber} />
          <Cap x={1250} y={350}>
            KL: bits por símbolo
          </Cap>
          <Cap x={1250} y={460} tex={`C=${capacityTex(1 / 4)}`} size={21} />
          <Cap x={1250} y={570}>
            Capacidad: bits útiles por uso
          </Cap>
          <Cap x={1250} y={680} tex="R=1/4>C" color={C.red} />
        </>
      )}
      {b === 4 && (
        <>
          <ParityRack
            received={RECEIVED}
            mode="hamming"
            inspector={false}
            showReadings={false}
            progress={reduced ? 1 : beats.at(4)}
          />
          <Cap x={1250} y={240}>
            Síndrome 101 → posición 5
          </Cap>
          <Cap x={1250} y={350}>
            Una inversión como máximo.
          </Cap>
          <Cap x={1250} y={460} color={C.green}>
            Copia reconstruida: 0110011
          </Cap>
          <Cap x={1250} y={570}>
            Paquete completo validado.
          </Cap>
          <Cap x={1250} y={680}>
            Cuerpo abierto con la credencial.
          </Cap>
        </>
      )}
    </Stage>
  );
}
export const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Revisar la cadena de pruebas',
  Scene: ReviewLesson,
  beats: [
    {
      say: 'Recupera la probabilidad de D antes de leer sus bits. Los ocho eventos D pertenecen a un lote de 64 cabeceras.',
      dur: 3,
      board: {
        label: 'Evento de reserva',
        tex: '\\p{1}{I(D)}=\\p{2}{-\\log_2(8/64)}=\\p{3}{\\cC{3}}',
        parts: ['información de d', 'con los datos del lote', 'bits del evento'],
      },
    },
    {
      say: 'La palabra de D termina en su hoja. Al leerla, el decodificador vuelve a la raíz; los largos del árbol alcanzan la entropía de este reparto.',
      gate: 'Arrastra D al centro del nodo de su hoja 111, sobre la etiqueta D.',
      board: {
        label: 'Palabra y media',
        tex: '\\p{1}{c(D)=\\cC{111}},\\quad\\p{2}{\\bar L=H(P)=\\tfrac74}',
        parts: ['palabra asignada a d', 'media igual a entropía'],
      },
    },
    {
      say: 'Filtra la ruta d y mira qué torre queda. Distingue lo pendiente de lo que ambas variables comparten.',
      ask: {
        prompt: 'Con la ruta d conocida, ¿cuántos bits faltan sobre la torre?',
        options: ['1', '0', '2'],
        answer: 1,
        explain:
          'Solo Sur usa d: la torre queda determinada. El 1 mide la torre antes del filtro; el 2 mide la ruta antes de conocer nada.',
      },
      board: {
        label: 'Entropía condicional',
        tex: '\\p{1}{H(X\\mid Y)}=\\p{2}{H(X,Y)-H(Y)}',
        parts: ['torre pendiente dada ruta', 'par menos ruta conocida'],
      },
    },
    {
      say: 'Compara las cintas y la capacidad. KL mide espacio extra por símbolo; C mide información útil por uso del canal: conserva las unidades al comparar.',
      dur: 3,
      board: [
        {
          label: 'Perfil cambiado',
          tex: '\\p{1}{D(P\\Vert Q)}=\\p{2}{\\cA{\\tfrac58}\\ \\mathrm{bits/símbolo}}',
          parts: ['exceso por perfil ajeno', 'bits extra por símbolo'],
        },
        {
          label: 'Enlace de inversiones',
          tex: '\\p{1}{C}\\approx\\p{2}{\\cC{0{,}1887}\\ \\mathrm{bits/uso}}',
          parts: ['información máxima por uso', 'bits útiles por uso'],
        },
      ],
    },
    {
      say: 'Las comprobaciones proponen una posición bajo el límite de una inversión. La copia reconstruida entra al expediente después de la validación del paquete completo.',
      dur: 3,
      board: [
        {
          label: 'Posición de corrección',
          tex: '\\p{1}{j}=\\p{2}{s_1+2s_2+4s_4}',
          parts: ['posición que corregir', 'posición según paridades'],
        },
        {
          label: 'Orden del síndrome',
          tex: '\\p{1}{(s_4s_2s_1)_2}=\\p{2}{101_2}=\\p{3}{5}',
          parts: ['paridades ordenadas por peso', 'síndrome del caso', 'quinto bit'],
        },
      ],
    },
  ],
};
function FileDemo({ beats, answer }: DemoProps) {
  return (
    <Stage>
      <CodeCost
        source={P}
        profile={Q}
        count={COUNT}
        showReadings={false}
        showContributions={false}
      />
      <Cap x={1250} y={230}>
        64 cabeceras · P: 112 bits
      </Cap>
      <Cap x={1250} y={330}>
        Mismo lote con Q: 152 bits
      </Cap>
      {beats.beat === 0 && answer !== null && (
        <Cap x={1250} y={440} tex="152-112=40\ \mathrm{bits}" color={C.amber} />
      )}
      <Cap x={1250} y={550} size={18}>
        Perfil guardado después del reinicio.
      </Cap>
      <Cap x={1250} y={650} size={18}>
        Cuenta receptora: «Contador»
      </Cap>
      <Cap x={530} y={760} size={19}>
        {beats.beat === 1 && answer !== null
          ? 'Original conservado · copia reconstruida · paquete validado'
          : 'Ruta d → Sur · enlace con R sobre C · fragmentos 1011 y 0100'}
      </Cap>
    </Stage>
  );
}
function FiveReadings({ round, api }: ChallengeProps) {
  const [first, setFirst] = useState(''),
    [second, setSecond] = useState(''),
    [third, setThird] = useState(''),
    [choice, setChoice] = useState<string | null>(null);
  useEffect(() => {
    setFirst('');
    setSecond('');
    setThird('');
    setChoice(null);
    const prompts = [
      'Lectura 1. Con conteos (32,16,8,8), escribe la información individual de D y la entropía de la fuente, en bits y bits/símbolo. Usa decimal o fracción exacta.',
      'Lectura 2. Decodifica 010110111 con el árbol P y calcula el tamaño de las 64 cabeceras. Escribe los símbolos juntos en orden y los bits del lote.',
      'Lectura 3. X es torre; Y es ruta. Escribe H(Y dado X), I(X;Y) y elige la explicación que sostiene ambos cálculos.',
      'Lectura 4. Escribe el exceso de Q para las 64 cabeceras y C del BSC con p = 1/4 a cuatro decimales. Decide si R = 1/4 está por debajo o por encima de C.',
      'Lectura 5. Recibes 0110111; a lo sumo una inversión. Escribe síndrome s₄s₂s₁, posición y cuatro datos corregidos. Elige qué sigue antes de aceptar el texto.',
    ];
    api.prompt(prompts[round]);
    api.hints(
      [
        [
          'D es un evento. H promedia todas las etiquetas.',
          'Usa las frecuencias del lote para ponderar la información individual.',
        ],
        [
          'Corta solo al llegar a una hoja; después pondera los largos por los conteos.',
          'Reinicia desde la raíz tras cada símbolo. El lote no tiene las frecuencias del fragmento.',
        ],
        [
          'Filtra una fila y después una columna.',
          'La torre conserva dos rutas; cada ruta pertenece a una sola torre.',
        ],
        [
          'Resta los largos del lote; para el enlace resta la entropía binaria de uno.',
          'No confundas bits extra por símbolo con bits totales ni probabilidad de acierto con capacidad.',
        ],
        [
          'Las comprobaciones ubican un bit; la autenticidad se revisa en el paquete.',
          'Lee s₄s₂s₁, corrige desde uno y extrae posiciones 3, 5, 6 y 7.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);
  const submit = () => {
    if (!first.trim() || !second.trim()) return;
    const a = parseExact(first),
      b = parseExact(second);
    if (round === 0) {
      if (a === null || b === null) return;
      const targetI = info(P[3]),
        targetH = entropy(P);
      return api.result(
        a === targetI && b === targetH,
        a === targetI && b === targetH
          ? '$I(D)=3$ bits; $H(P)=7/4=1{,}75$ bits/símbolo.'
          : b === targetI
            ? 'Entregaste la información de D como entropía. H pondera también A, B y C con sus frecuencias.'
            : 'Convierte 8/64 en la probabilidad de D; promedia las cuatro informaciones para H.',
      );
    }
    if (round === 1) {
      if (b === null) return;
      const decoded = decodePrefix('010110111', CODES).symbols.join('');
      if (first.trim().toUpperCase() === decoded && b === OWN)
        return api.result(
          true,
          '0 | 10 | 110 | 111 → ABCD. El lote ocupa 32 × 1 + 16 × 2 + 8 × 3 + 8 × 3 = 112 bits.',
        );
      return api.result(
        false,
        first.trim().toUpperCase() !== decoded
          ? 'Los cortes son hojas, no bloques fijos. Vuelve a la raíz tras cada símbolo.'
          : b === sum(TREE.lengths)
            ? 'Sumaste los cuatro largos sin contar sus apariciones: multiplica cada largo por su frecuencia.'
            : 'El fragmento se decodifica aparte; para el lote usa los conteos (32,16,8,8), no longitud fija de dos bits.',
      );
    }
    if (round === 2) {
      if (a === null || b === null || choice === null) return;
      const conditional = conditionalEntropy(ROUTE_TABLE),
        shared = mutualInfo(ROUTE_TABLE);
      const ok = a === conditional && b === shared && choice === JUSTIFICATIONS[0];
      return api.result(
        ok,
        ok
          ? 'H(Y dado X) = 1 bit; I(X;Y) = 1 bit. Cada torre deja dos rutas; cada ruta determina su torre.'
          : a === 0
            ? 'Condicionaste en el sentido contrario: la ruta determina la torre, pero la torre todavía deja dos rutas.'
            : choice === JUSTIFICATIONS[1]
              ? 'Los cruces imposibles descartan independencia: solo hay cuatro celdas equiprobables.'
              : 'Distingue la incertidumbre pendiente de ruta del bit compartido; conocer la torre no fija una ruta única.',
      );
    }
    if (round === 3) {
      if (a === null || b === null || choice === null) return;
      const c = bscCapacity(1 / 4),
        ok = a === OTHER - OWN && Math.abs(b - c) <= 0.0001 && choice === 'Por encima';
      if (ok)
        return api.result(
          true,
          `$152-112=40$ bits; $C=${capacityTex(1 / 4)}\\approx${num(c)}$ bits/uso; $1/4>C$.`,
        );
      return api.result(
        false,
        a === kl(P, Q)
          ? 'Ese exceso es por símbolo. Multiplica por las 64 cabeceras para hallar el total.'
          : Math.abs(b - 3 / 4) <= 0.0001
            ? 'El 3/4 mide probabilidad de acierto. La capacidad resta h₂(1/4) de uno.'
            : a !== OTHER - OWN
              ? 'Resta el tamaño propio al tamaño con Q; el 152 es el total, no el exceso.'
              : 'Evalúa ambos términos de la entropía binaria y resta de uno. Compara 1/4 con C antes de redondear.',
      );
    }
    if (b === null || !third.trim() || choice === null) return;
    const syndrome = hammingSyndrome(RECEIVED),
      corrected = hammingCorrect(RECEIVED, true);
    const ok =
      first.trim() === syndrome.bits &&
      b === syndrome.position &&
      third.trim() === corrected.data &&
      choice === NEXT_STEPS[1];
    return api.result(
      ok,
      ok
        ? 'Síndrome 101; posición 5; datos 1011. Valida el paquete completo antes de aceptar el texto.'
        : choice !== NEXT_STEPS[1]
          ? 'El síndrome evalúa comprobaciones locales: no autentica el mensaje ni representa una fecha. Falta validar el paquete entero.'
          : b === 4
            ? 'Las posiciones empiezan en uno, no en cero: usa s₁ + 2s₂ + 4s₄.'
            : third.trim() === corrected.word.slice(0, 4)
              ? 'Las primeras cuatro posiciones mezclan datos y comprobaciones. Extrae 3, 5, 6 y 7.'
              : 'Recalcula los grupos 1, 2 y 4; conserva el orden s₄s₂s₁ y los cuatro datos tras corregir.',
    );
  };
  const field = (value: string, onChange: (s: string) => void, label: string, y: number) => (
    <NumberField
      x={1050}
      y={y}
      label={label}
      value={value}
      onChange={onChange}
      onEnter={submit}
      width={4}
    />
  );
  return (
    <Stage>
      {round === 0 && <SymbolTray counts={COUNTS} y={230} height={400} fillOpacity={0.7} />}
      {round === 1 && (
        <>
          <PrefixTree nodes={TREE.nodes} edges={TREE.edges} />
          <BitTape bits="010110111" y={750} />
          <Html x={1050} y={360} size={26} anchor="left" interactive>
            <label className="stage-choices">
              <span className="stage-choices-label">símbolos =</span>
              <input
                aria-label="Símbolos decodificados"
                className="stage-input"
                style={{ width: '4em' }}
                value={first}
                onChange={(e) => setFirst(e.target.value.toUpperCase().replace(/[^ABCD]/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit();
                }}
              />
            </label>
          </Html>
        </>
      )}
      {round === 2 && (
        <JointGrid counts={ROUTE_COUNTS} rows={['Norte', 'Sur']} columns={['a', 'b', 'c', 'd']} />
      )}
      {round === 3 && (
        <CodeCost
          source={P}
          profile={Q}
          count={COUNT}
          showReadings={false}
          showContributions={false}
        />
      )}
      {round === 4 && (
        <ParityRack received={RECEIVED} mode="hamming" inspector={false} showReadings={false} />
      )}
      <Cap x={1250} y={200} color={ACCENT} size={20}>
        {
          [
            'Conteos (32,16,8,8)',
            'Árbol P · lote de 64 cabeceras',
            'X: torre · Y: ruta',
            'p = 1/4 · R = 1/4',
            'A lo sumo una inversión',
          ][round]
        }
      </Cap>
      {round !== 1 &&
        field(
          first,
          setFirst,
          ['I(D) =', '', 'H(Y|X) =', 'exceso =', 'síndrome ='][round],
          round === 4 ? 290 : 350,
        )}
      {field(
        second,
        setSecond,
        ['H(P) =', 'bits =', 'I(X;Y) =', 'C =', 'posición ='][round],
        round === 4 ? 390 : 450,
      )}
      {round === 4 && field(third, setThird, 'datos =', 490)}
      {round === 2 && (
        <EvidenceOptions options={JUSTIFICATIONS} value={choice} onPick={setChoice} />
      )}
      {round === 3 && (
        <EvidenceOptions
          options={['Por debajo', 'Por encima']}
          value={choice}
          onPick={setChoice}
          y={580}
        />
      )}
      {round === 4 && (
        <EvidenceOptions options={NEXT_STEPS} value={choice} onPick={setChoice} y={590} />
      )}
      <Cap x={530} y={860} size={18}>
        Lectura {round + 1} de 5 · corrige para continuar
      </Cap>
      <Confirm onClick={submit} />
    </Stage>
  );
}
export const level: LevelSpec = {
  id: 'w8-final',
  world: 'information',
  code: '8.★',
  title: 'La ventana',
  subtitle: 'Repaso del mundo · cinco lecturas',
  glyph: '\\bigstar',
  kind: 'boss',
  module: 'w8-closed',
  guide: 'ines',
  teaser:
    'El mensaje está abierto. Iris pide revisar cada prueba antes de incorporar la entrega al informe.',
  learn: 'Unir información, códigos, dependencias, costos y corrección en un expediente validado.',
  glyphs: [
    'it-information',
    'it-entropy',
    'it-length',
    'it-mutual',
    'it-kl',
    'it-capacity',
    'it-syndrome',
  ],
  notes: [
    {
      label: 'Lote del expediente',
      tex: '\\begin{aligned}64\\bar L_P&=112\\\\64\\bar L_Q&=152\\\\64D(P\\Vert Q)&=40\\end{aligned}',
    },
    { label: 'Ruta y enlace', tex: 'p(S\\mid d)=1,\\quad R=1/4>C(1/4)' },
    {
      label: 'Texto aceptado',
      body: 'Los originales se conservaron; se corrigió una copia y se validó el paquete completo antes de abrirlo con la credencial del chip. El registro de acceso identifica por separado la revisión posterior al reinicio.',
    },
  ],
  steps: [
    {
      kind: 'scene',
      place: 'antenas',
      lines: [
        {
          who: 'nar',
          text: 'Caseta, veinte para las siete. La luz del monitor se reflejaba en el auricular que Inés había dejado sobre la mesa, e Iris todavía no cerraba el informe.',
        },
        {
          who: 'ines',
          text: 'Mi autorización queda en el informe, y el cambio de perfil también.',
        },
        {
          who: 'iris',
          text: 'Quedan las dos. El informe se sostiene si se sostiene cada lectura.',
        },
        { who: 'tu', text: 'La ruta d, la copia original y el paquete validado van juntos.' },
        {
          who: 'nar',
          text: 'Teo abrió el mensaje. Bajo el destino aparecía un campo meteorológico.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'El expediente de Las Antenas',
      Scene: FileDemo,
      beats: [
        {
          say: 'El lote P ocupa 112 bits con su código y 152 con Q. La revisión administrativa sitúa el cambio de perfil después del reinicio de Inés; el cálculo mide su costo.',
          ask: {
            prompt: '¿Qué sostiene que Q aumentó el tamaño de este lote?',
            options: ['La firma de Inés', 'El piloto encendido', 'El cálculo 152 − 112 = 40 bits'],
            answer: 2,
            explain:
              'Las longitudes ponderadas demuestran el aumento. La firma y la luz pertenecen a otras pruebas; no calculan el tamaño del lote.',
          },
          note: { label: 'Costo demostrado', tex: '152-112=64\\cdot5/8=40' },
        },
        {
          say: 'La ruta d determina Sur. El enlace pide una tasa sobre C; la copia local permitió reconstruir los fragmentos 1011 y 0100 y comprobar el mensaje entero.',
          ask: {
            prompt: '¿Qué permite incorporar el texto recuperado al informe?',
            options: [
              'La reconstrucción seguida de la validación del paquete',
              'La entropía alta del mensaje',
              'Un síndrome cero sin revisar nada más',
            ],
            answer: 0,
            explain:
              'La cadena conserva el original, reconstruye una copia y valida el paquete completo. La entropía mide información media; el síndrome no autentica texto.',
          },
          note: {
            label: 'Paquete incorporado',
            body: 'Copia reconstruida, autenticidad comprobada y cuerpo abierto con la credencial del chip.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Cinco lecturas del expediente', Comp: FiveReadings, rounds: 5 },
    {
      kind: 'scene',
      place: 'antenas',
      lines: [
        {
          who: 'nar',
          text: 'Cinco para las siete. La lluvia golpeaba el plato de reserva cuando Teo mostró el mensaje validado: «Entrega de vacunas: El Observatorio. 18 de agosto de 2089, de 02:00 a 02:30. Usar ventana de tormenta. Mantener el horario fuera del pronóstico público».',
        },
        {
          who: 'teo',
          text: 'La fecha estaba en el cuerpo. La cabecera solo nos trajo hasta esta copia.',
        },
        { who: 'ines', text: 'A mí me pidieron sostener el enlace. Nadie habló de vacunas.' },
        { who: 'iris', text: 'Entonces alguien miró el cielo antes de fijar la entrega.' },
        { who: 'tu', text: 'El pronóstico público para esa ventana sigue despejado.' },
        {
          who: 'nar',
          text: 'Teo abrió el mapa de El Observatorio. Una estación de ladera había registrado una ráfaga que el modelo dejó fuera, y el aviso oficial seguía con su fondo azul.',
        },
      ],
    },
  ],
};
export const glyphs: Glyph[] = [];
