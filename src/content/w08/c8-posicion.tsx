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
import { pick, randInt, rng } from '../shared/rng';
import { Choices, Confirm, NumberField } from '../shared/ui';
import {
  ACCENT,
  DragToken,
  ParityRack,
  hammingCorrect,
  hammingEncode,
  hammingSyndrome,
  near,
  parseExact,
  sum,
  xor,
} from './kit';

export const flipBit = (word: string, position: number) =>
  [...word].map((bit, i) => (i + 1 === position ? (bit === '0' ? '1' : '0') : bit)).join('');
const VALID = hammingEncode('1011'),
  RECEIVED = flipBit(VALID, 5);
function CorrectionLesson({ beats, unlock, answer, reduced }: DemoProps) {
  const [parity, setParity] = useState<number | null>(null),
    [voted, setVoted] = useState(false),
    [corrected, setCorrected] = useState(false);
  const [groups, setGroups] = useState(() => new Set<number>()),
    [message, setMessage] = useState('');
  const b = beats.beat;
  const word =
    b === 0
      ? '1011' + (parity ?? '')
      : b === 1
        ? '101'
        : b === 2
          ? VALID
          : b === 6
            ? '1010011'
            : b === 5 || (corrected && b === 4)
              ? VALID
              : RECEIVED;
  return (
    <Stage>
      <ParityRack
        received={word}
        mode={b === 0 ? 'parity' : b === 1 ? 'repetition' : 'hamming'}
        showReadings={false}
        inspector={b === 2}
        onInspect={
          b === 2
            ? (g) => {
                const next = new Set(groups).add(g);
                setGroups(next);
                setMessage(`Grupo ${g} revisado.`);
                if (next.size === 3) unlock();
              }
            : undefined
        }
        onCorrect={
          b === 4 && !corrected
            ? (i) => {
                const next = flipBit(RECEIVED, i + 1);
                if (i + 1 === 5 && next === VALID && hammingSyndrome(next).bits === '000') {
                  setCorrected(true);
                  setMessage('Posición 5 invertida · síndrome recalculado: 000 ✓');
                  unlock();
                } else
                  setMessage(
                    `La posición ${i + 1} deja síndrome ${hammingSyndrome(next).bits}. Revisa el índice del síndrome.`,
                  );
              }
            : undefined
        }
        progress={b === 3 && !reduced ? beats.at(3) : 1}
      />
      {b === 0 && (
        <>
          {parity === null && (
            <>
              <rect
                x={750}
                y={480}
                width={120}
                height={85}
                rx={8}
                fill={C.panel}
                stroke={C.amber}
                strokeWidth={3}
              />
              <Cap x={810} y={610} size={18}>
                Paridad par
              </Cap>
              {[0, 1].map((bit) => (
                <DragToken
                  key={bit}
                  x={300 + bit * 180}
                  y={745}
                  label={bit}
                  cue={bit === 1}
                  onDrop={(x, y) => {
                    if (!near(x, y, 810, 522)) return;
                    setParity(bit);
                    if (xor('1011' + bit) === 0 && bit === 1) {
                      setMessage('10111 · cuatro unos · XOR = 0 ✓');
                      unlock();
                    } else {
                      setMessage(
                        'Con 0 quedan tres unos: la paridad es impar. Prueba la otra ficha.',
                      );
                      setParity(null);
                    }
                  }}
                />
              ))}
            </>
          )}
          <Cap x={1250} y={220}>
            Datos: 1011 · tres unos
          </Cap>
          <Cap x={1250} y={320}>
            Una inversión cambia la paridad.
          </Cap>
          <Cap x={1250} y={420} size={19}>
            10111 → 00111: XOR = 1
          </Cap>
          <Cap x={1250} y={520} size={19}>
            10111 → 01111: XOR = 0
          </Cap>
          <Cap x={1250} y={620} size={19}>
            Dos inversiones pueden pasar.
          </Cap>
        </>
      )}
      {b === 1 && (
        <>
          <circle cx={810} cy={535} r={28} fill={C.panel} stroke={ACCENT} strokeWidth={3} />
          <Cap x={810} y={590} size={18}>
            Salida
          </Cap>
          {!voted && (
            <DragToken
              x={300}
              y={745}
              label="1"
              onDrop={(x, y) => {
                if (near(x, y, 810, 535)) {
                  setVoted(true);
                  setMessage('Dos votos de uno: salida 1 ✓');
                  unlock();
                }
              }}
            />
          )}
          {voted && (
            <Cap x={810} y={535} color={C.green}>
              1
            </Cap>
          )}
          <Cap x={1250} y={230}>
            111 → 101
          </Cap>
          <Cap x={1250} y={340}>
            Dos unos · un cero
          </Cap>
          <Cap x={1250} y={450} tex="R=1/3" color={C.amber} />
          <Cap x={1250} y={560} size={19}>
            Hasta una inversión por grupo.
          </Cap>
        </>
      )}
      {b === 2 && (
        <>
          <Cap x={1250} y={200}>
            Datos en 3, 5, 6 y 7
          </Cap>
          <Cap x={1250} y={290}>
            Comprobaciones en 1, 2 y 4
          </Cap>
          <Cap x={1250} y={390} tex="p_1=1\oplus0\oplus1=0" size={21} />
          <Cap x={1250} y={480} tex="p_2=1\oplus1\oplus1=1" size={21} />
          <Cap x={1250} y={570} tex="p_4=0\oplus1\oplus1=0" size={21} />
          <Cap x={1250} y={690} size={19} color={C.amber}>
            {[1, 2, 4].map((g) => `${g}: ${groups.has(g) ? '✓' : 'pendiente'}`).join(' · ')}
          </Cap>
        </>
      )}
      {b === 3 || b === 4 || b === 5 ? (
        <>
          <Cap
            x={1250}
            y={220}
            tex={
              b === 5
                ? '(w_3,w_5,w_6,w_7)'
                : `s_1=${hammingSyndrome(word).checks[0]},\\ s_2=${hammingSyndrome(word).checks[1]},\\ s_4=${hammingSyndrome(word).checks[2]}`
            }
            size={21}
          />
          <Cap
            x={1250}
            y={320}
            tex={
              b === 5
                ? '\\operatorname{datos}(w)'
                : `j=s_1+2s_2+4s_4=${hammingSyndrome(word).position}`
            }
            color={C.amber}
            size={21}
          />
          <Cap x={1250} y={420}>
            Orden del síndrome: s₄s₂s₁
          </Cap>
          <Cap x={1250} y={520} color={corrected && (b === 4 || b === 5) ? C.green : C.red}>
            Síndrome: {hammingSyndrome(word).bits}
          </Cap>
          {b === 5 && answer !== null && (
            <Cap x={1250} y={620}>
              Datos: {hammingCorrect(word, true).data}
            </Cap>
          )}
          <Cap x={1250} y={730} size={18}>
            Supuesto: a lo sumo una inversión.
          </Cap>
        </>
      ) : null}
      {b === 6 && (
        <>
          <Cap x={1250} y={210}>
            Dos inversiones: posiciones 1 y 2
          </Cap>
          <Cap x={1250} y={310}>
            Recibida: 1010011
          </Cap>
          <Cap x={1250} y={410}>
            Síndrome 011 → índice 3
          </Cap>
          <Cap x={1250} y={510}>
            Intento: 1000011 → datos 0011
          </Cap>
          <Cap x={1250} y={610} color={C.red}>
            Síndrome 000; datos equivocados.
          </Cap>
          <Cap x={1250} y={730} tex="1/3>C,\quad4/7>C" size={21} />
        </>
      )}
      {b < 6 && (
        <Cap x={530} y={825} color={C.green} size={18}>
          {message}
        </Cap>
      )}
    </Stage>
  );
}
export const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Paridad, repetición y Hamming(7,4)',
  Scene: CorrectionLesson,
  beats: [
    {
      say: 'Cuenta los unos y completa una cantidad par. La **paridad** detecta cualquier cantidad impar de inversiones, pero no ubica el bit; dos cambios pueden dejarla igual.',
      gate: 'Arrastra la ficha 0 o 1 al centro de la casilla «Paridad par». Deben quedar cuatro unos y XOR cero.',
      board: {
        label: 'Paridad par',
        tex: '\\p{1}{b_1\\oplus\\cdots\\oplus b_n}\\oplus\\p{2}{\\cA{p}}=\\p{3}{0}',
        body: 'XOR es suma módulo dos.',
        parts: ['paridad de los datos', 'bit de comprobación', 'paridad total esperada'],
      },
    },
    {
      say: 'La **repetición triple** copia cada dato tres veces. En 101 gana el uno por mayoría; corrige hasta una inversión por grupo y transporta un dato en tres bits.',
      gate: 'Arrastra el voto 1 al círculo «Salida» del bloque 101.',
      board: {
        label: 'Votación y tasa',
        tex: '\\p{1}{111}\\to\\p{2}{101}\\to\\p{3}{\\cC{1}},\\quad\\p{4}{R=\\tfrac13}',
        parts: [
          'triple copia enviada',
          'copia con una inversión',
          'dato por mayoría',
          'datos por bit enviado',
        ],
      },
    },
    {
      say: 'Hamming distribuye los datos en 3, 5, 6 y 7. Cada posición comparte una combinación distinta de comprobaciones; revisa las conexiones antes de leer la palabra.',
      gate: 'Arrastra la lupa a las posiciones de comprobación 1, 2 y 4, en el centro de sus bits.',
      board: [
        {
          label: 'Posiciones de Hamming',
          tex: '\\p{1}{w}=(\\p{2}{\\cA{p_1,p_2}},\\p{3}{d_1},\\p{4}{\\cA{p_4}},\\p{5}{d_2,d_3,d_4})',
          parts: [
            'palabra codificada',
            'primeras dos comprobaciones',
            'primer dato',
            'tercera comprobación',
            'otros tres datos',
          ],
        },
        {
          label: 'Tasa de Hamming(7,4)',
          tex: '\\p{1}{R}=\\p{2}{\\tfrac47}',
          parts: ['datos por bit enviado', 'cuatro datos entre siete'],
        },
      ],
    },
    {
      say: 'La copia 0110111 falla en los grupos 1 y 4. El **síndrome** junta esas paridades; su orden de escritura es s₄s₂s₁ y su índice se cuenta desde uno a la izquierda.',
      dur: 3,
      board: [
        {
          label: 'Comprobaciones',
          tex: '\\p{1}{s_1=\\cM{1}},\\quad\\p{2}{s_2=0},\\quad\\p{3}{s_4=\\cM{1}}',
          parts: ['falla del primer grupo', 'segundo grupo sin falla', 'falla del tercer grupo'],
        },
        {
          label: 'Índice del síndrome',
          tex: '\\p{1}{j}=\\p{2}{s_1+2s_2+4s_4}=\\p{3}{5}',
          parts: ['posición que corregir', 'posición según paridades', 'quinto bit'],
        },
      ],
    },
    {
      say: 'Corrige la copia en la posición indicada y recalcula las comprobaciones. Después extrae solo los cuatro bits de datos.',
      gate: 'Arrastra el marcador ↺ al quinto bit. Debe quedar 0110011 y síndrome 000.',
      board: {
        label: 'Recalcular después de invertir',
        tex: '\\p{1}{\\operatorname{síndrome}(w)}=\\p{2}{000}',
        parts: ['comprobaciones tras corregir', 'sin fallas de paridad'],
      },
    },
    {
      say: 'La palabra corregida conserva comprobaciones y datos mezclados. Extrae las posiciones de datos indicadas en el esquema.',
      ask: {
        prompt: 'Bajo el límite de una inversión, ¿qué dato recuperas?',
        options: ['1011', '0110', '101'],
        answer: 0,
        explain:
          'Las posiciones 3, 5, 6 y 7 dan 1011. Las primeras cuatro mezclan comprobaciones con datos; 101 es el síndrome, no el dato.',
      },
      board: {
        label: 'Extraer datos',
        tex: '\\p{1}{\\operatorname{datos}(w)}=(\\p{2}{w_3},\\p{3}{w_5},\\p{4}{w_6},\\p{5}{w_7})',
        parts: ['datos recuperados', 'primer dato', 'segundo dato', 'tercer dato', 'cuarto dato'],
      },
    },
    {
      say: 'Con dos inversiones, el síndrome puede señalar otro bit y el intento dar una palabra válida con datos equivocados. Hamming corrige una inversión; estos códigos cortos también tienen tasas superiores a la capacidad del enlace anterior.',
      dur: 3,
      board: [
        {
          label: 'Distancia mínima',
          tex: '\\p{1}{d_{\\min}}=\\p{2}{3}',
          parts: ['separación mínima de códigos', 'bits que los separan'],
        },
        {
          label: 'Límite de la garantía',
          tex: '\\p{1}{\\text{corrección}}:\\ \\p{2}{\\text{hasta una inversión}}',
          body: 'Sin el límite, síndrome cero tampoco prueba ausencia de errores. Hamming(7,4) sin paridad adicional no detecta de manera segura dos errores.',
          parts: ['garantía de recuperación', 'una inversión como máximo'],
        },
      ],
    },
  ],
};
function BlocksDemo({ beats, unlock, answer }: DemoProps) {
  const [corrected, setCorrected] = useState(() => new Set<number>()),
    [message, setMessage] = useState('');
  const b = beats.beat,
    block = b === 0 ? 0 : 1,
    original = block === 0 ? RECEIVED : '1001000',
    acting = b < 2,
    done = corrected.has(block) || !acting,
    word = done ? flipBit(original, 5) : original,
    syndrome = hammingSyndrome(word);
  useEffect(() => setMessage(''), [b]);
  return (
    <Stage>
      <ParityRack
        key={block}
        received={word}
        mode="hamming"
        showReadings={false}
        inspector={false}
        onCorrect={
          acting && !done
            ? (i) => {
                const next = flipBit(original, i + 1);
                if (i + 1 === 5 && hammingSyndrome(next).bits === '000') {
                  setCorrected((prev) => new Set(prev).add(block));
                  setMessage('Quinto bit invertido. Síndrome recalculado: 000.');
                  unlock();
                } else {
                  setMessage(
                    `La posición ${i + 1} deja síndrome ${hammingSyndrome(next).bits}. Revisa el índice.`,
                  );
                }
              }
            : undefined
        }
      />
      <Cap x={530} y={165}>
        Originales conservados: 0110111 y 1001000
      </Cap>
      <Cap x={1250} y={220}>
        A lo sumo una inversión por bloque.
      </Cap>
      <Cap x={1250} y={320} tex="j=s_1+2s_2+4s_4" size={21} />
      <Cap x={1250} y={420} color={done ? C.green : C.red}>
        Síndrome {syndrome.bits} → posición {syndrome.position}
      </Cap>
      {done && (
        <Cap x={1250} y={520}>
          {word} → datos {hammingCorrect(word, true).data}
        </Cap>
      )}
      <Cap x={1250} y={650} size={18}>
        Los datos {b === 0 ? '1011' : '1011 y 0100'} son fragmentos cifrados.
      </Cap>
      <Cap x={530} y={795} size={19}>
        {acting
          ? message
          : b === 3 && answer !== null
            ? 'Reconstruir copia → validar paquete → abrir con credencial'
            : 'La comprobación local no autentica el mensaje completo.'}
      </Cap>
    </Stage>
  );
}
function CorrectionPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 151 + round),
      data = randInt(r, 0, 15).toString(2).padStart(4, '0'),
      proposed = pick(r, [0, 1]),
      bit = pick(r, [0, 1]);
    const position = randInt(r, 0, round === 1 ? 3 : 7),
      code = round === 1 ? String(bit).repeat(3) : hammingEncode(data);
    return { data, proposed, bit, position, received: flipBit(code, position) };
  }, [seed, round]);
  const [first, setFirst] = useState(''),
    [second, setSecond] = useState(''),
    [third, setThird] = useState(''),
    [choice, setChoice] = useState<string | null>(null);
  useEffect(() => {
    setFirst('');
    setSecond('');
    setThird('');
    setChoice(null);
    api.prompt(
      round === 0
        ? `Datos ${d.data}; bit propuesto ${d.proposed}. Escribe la paridad par correcta y decide si la propuesta pasa.`
        : round === 1
          ? `Recibes ${d.received}. Escribe el dato mayoritario y el máximo de inversiones corregibles por grupo.`
          : `Recibes ${d.received}; a lo sumo una inversión. Escribe síndrome s₄s₂s₁ (tres bits), posición (0 = conservar) y datos (cuatro bits).`,
    );
    api.hints(
      round === 0
        ? [
            'Cuenta todos los unos de los datos.',
            'Incluye el bit propuesto al comprobar si la cantidad total es par.',
          ]
        : round === 1
          ? [
              'Compara los votos de cero y uno.',
              'Tres copias garantizan corregir una inversión por grupo.',
            ]
          : [
              'Comprueba los grupos 1, 2 y 4; escribe los resultados en orden 4, 2, 1.',
              'El índice es s₁ + 2s₂ + 4s₄; corrige y extrae 3, 5, 6 y 7.',
            ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    if (round === 0) {
      const a = parseExact(first);
      if (a === null || choice === null) return;
      const parity = xor(d.data),
        passes = xor(d.data + d.proposed) === 0;
      if (a === parity && choice === (passes ? 'Pasa' : 'Falla'))
        return api.result(
          true,
          `Paridad ${parity}; con la propuesta hay ${sum([...d.data].map(Number)) + d.proposed} unos: ${passes ? 'pasa' : 'falla'}.`,
        );
      return api.result(
        false,
        a === 1 - parity
          ? 'Elegiste paridad impar. Agrega un uno si los datos tienen una cantidad impar de unos.'
          : 'La propuesta se comprueba con el bit añadido; no basta contar los cuatro datos.',
      );
    }
    if (round === 1) {
      const a = parseExact(first),
        b = parseExact(second);
      if (a === null || b === null) return;
      if (a === d.bit && b === 1)
        return api.result(
          true,
          `La mayoría de ${d.received} es ${d.bit}; corrige hasta una inversión por grupo.`,
        );
      return api.result(
        false,
        b !== 1
          ? 'Tres copias no corrigen tres inversiones: la garantía es una por grupo.'
          : 'El primer bit puede estar invertido. Cuenta la mayoría de los tres votos.',
      );
    }
    const syndrome = first.trim(),
      position = parseExact(second),
      data = third.trim();
    if (!syndrome || position === null || !data) return;
    const target = hammingSyndrome(d.received),
      corrected = hammingCorrect(d.received, true);
    if (syndrome === target.bits && position === target.position && data === corrected.data)
      return api.result(
        true,
        `Síndrome ${target.bits}; ${position === 0 ? 'conserva' : `invierte posición ${position}`}. Palabra ${corrected.word}; datos ${corrected.data}.`,
      );
    if (syndrome === [...target.bits].reverse().join('') && syndrome !== target.bits)
      return api.result(
        false,
        'Invertiste el orden: escribe s₄s₂s₁, con el grupo 4 a la izquierda.',
      );
    if (position !== target.position)
      return api.result(
        false,
        target.position === 0
          ? 'Sin error, el síndrome es 000: conserva el bloque y usa posición 0.'
          : 'El índice cuenta desde uno a la izquierda, también puede señalar una comprobación; no elijas un dato por defecto.',
      );
    if (data === corrected.word.slice(0, 4) && data !== corrected.data)
      return api.result(
        false,
        'Tomaste las primeras cuatro posiciones. Los datos están en 3, 5, 6 y 7.',
      );
    api.result(
      false,
      'Comprueba los tres grupos, corrige solo la posición indicada y conserva los ceros iniciales de síndrome y datos.',
    );
  };
  return (
    <Stage>
      {round === 0 ? (
        <>
          <ParityRack received={d.data + d.proposed} mode="parity" showReadings={false} />
          <Cap x={530} y={165}>
            Cuatro datos y una propuesta
          </Cap>
        </>
      ) : (
        <ParityRack
          received={d.received}
          mode={round === 1 ? 'repetition' : 'hamming'}
          showReadings={false}
          inspector={false}
        />
      )}
      <Cap x={1250} y={220} color={ACCENT}>
        {round === 0
          ? `Datos: ${d.data} · propuesta: ${d.proposed}`
          : round === 1
            ? 'Decide por mayoría.'
            : 'A lo sumo una inversión.'}
      </Cap>
      <NumberField
        x={1050}
        y={370}
        label={round === 0 ? 'paridad =' : round === 1 ? 'dato =' : 'síndrome ='}
        value={first}
        onChange={setFirst}
        onEnter={submit}
        width={4}
      />
      {round === 0 ? (
        <Choices x={1250} y={500} options={['Pasa', 'Falla']} value={choice} onPick={setChoice} />
      ) : (
        <NumberField
          x={1050}
          y={480}
          label={round === 1 ? 'máximo =' : 'posición ='}
          value={second}
          onChange={setSecond}
          onEnter={submit}
          width={4}
        />
      )}
      {round === 2 && (
        <NumberField
          x={1050}
          y={590}
          label="datos ="
          value={third}
          onChange={setThird}
          onEnter={submit}
          width={4}
        />
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}
export const level: LevelSpec = {
  id: 'w8-c8',
  world: 'information',
  code: '8.8',
  title: 'La posición roja',
  subtitle: 'Paridad, repetición y Hamming(7,4)',
  glyph: '(s_4s_2s_1)_2',
  kind: 'level',
  guide: 'ines',
  teaser:
    'Dos bloques siguen rojos en la copia local. Iris exige guardar los originales y validar el mensaje entero.',
  learn: 'Comprobar paridad, votar por mayoría y corregir Hamming bajo el límite de una inversión.',
  glyphs: ['it-parity', 'it-repetition', 'it-hamming', 'it-syndrome'],
  pitfalls: [
    'La paridad detecta cantidades impares de inversiones y no ubica el bit.',
    'El síndrome se escribe s₄s₂s₁; las posiciones se cuentan desde uno a la izquierda.',
    'Hamming(7,4) garantiza corregir una inversión; sin ese límite puede dar otros datos válidos.',
    'Un síndrome cero no autentica el paquete.',
  ],
  notes: [
    {
      label: 'Datos de los bloques corregidos',
      tex: '\\begin{aligned}\\operatorname{datos}(0110011)&=1011\\\\\\operatorname{datos}(1001100)&=0100\\end{aligned}',
    },
    {
      label: 'Tasas de los códigos cortos',
      tex: 'R_{\\mathrm{rep}}=\\tfrac13,\\quad R_{\\mathrm{Ham}}=\\tfrac47',
      body: 'Ambas tasas superan C del canal anterior. Estos ejemplos locales no prometen fiabilidad arbitraria a ese nivel de ruido.',
    },
    {
      label: 'Validación del paquete',
      body: 'Los fragmentos siguen cifrados. El terminal los une al resto recuperado y verifica el mensaje completo con la credencial del chip; solo la validación permite incorporarlo al expediente.',
    },
  ],
  steps: [
    {
      kind: 'scene',
      place: 'servidores',
      lines: [
        {
          who: 'nar',
          text: 'Copia local del terminal, seis y cuarto. El chip descansaba sobre una toalla húmeda, y Teo abrió un archivo de trabajo.',
        },
        {
          who: 'teo',
          text: 'Las comprobaciones apuntan a una posición. Voy a corregir solo la copia de trabajo.',
        },
        { who: 'iris', text: 'Y después se valida el mensaje entero.' },
        {
          who: 'ines',
          text: 'Esos dos bloques llegaron separados. El hueco entre ellos ya está recuperado.',
        },
        {
          who: 'nar',
          text: 'Los originales quedaron abiertos al lado, y los dos fallaban en los mismos grupos.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'Los dos bloques',
      Scene: BlocksDemo,
      beats: [
        {
          say: 'La copia conserva 0110111 y 1001000. Intentamos corregir bajo el límite de una inversión por bloque; las posiciones empiezan en uno a la izquierda. En 0110111 fallan los grupos 1 y 4: el síndrome 101 indica la posición 5.',
          gate: 'Arrastra el marcador ↺ al quinto bit de 0110111 para dejar la copia en 0110011 y el síndrome en 000.',
        },
        {
          say: 'La primera copia entrega 1011. El segundo bloque, 1001000, también falla en los grupos 1 y 4. Corrige su copia de trabajo y lee las posiciones de datos 3, 5, 6 y 7.',
          gate: 'Arrastra el marcador ↺ al quinto bit de 1001000 para dejar la copia en 1001100 y el síndrome en 000.',
        },
        {
          say: 'Compara la segunda copia corregida con su original y lee los cuatro bits de datos.',
          ask: {
            prompt: '¿Dónde se intenta corregir 1001000 y qué dato queda?',
            options: ['Posición 5; 1001', 'Posición 5; 0100', 'Posición 4; 0000'],
            answer: 1,
            explain:
              's₁ = 1, s₂ = 0, s₄ = 1: índice 5. Cambiarlo da 1001100; las posiciones 3, 5, 6 y 7 entregan 0100. Las primeras cuatro dan 1001; cambiar el cuarto bit da datos 0000.',
          },
          note: {
            label: 'Segundo bloque',
            tex: '1001000\\xrightarrow{j=5}1001100\\longrightarrow0100',
          },
        },
        {
          say: 'Los datos 1011 y 0100 son fragmentos cifrados. El terminal los combina con el resto recuperado; si la validación falla, el paquete sigue inválido y se solicita otra copia.',
          ask: {
            prompt: '¿Qué falta antes de aceptar la entrega recuperada?',
            options: [
              'Nada: síndrome cero prueba que todo el mensaje es auténtico',
              'Invertir también las otras posiciones',
              'Validar el paquete completo con la credencial del chip',
            ],
            answer: 2,
            explain:
              'El síndrome comprueba el código local; no autentica el mensaje ni cubre errores ilimitados. Teo usa la credencial del chip para validar el paquete completo y abrir su cuerpo.',
          },
          note: {
            label: 'Cadena de recuperación',
            body: 'Conservar original → reconstruir copia → validar paquete completo → abrir con credencial. El expediente acepta solo el paquete validado.',
          },
        },
      ],
    },
    {
      kind: 'challenge',
      title: 'Comprobar y corregir copias',
      Comp: CorrectionPractice,
      rounds: 3,
    },
    {
      kind: 'scene',
      place: 'servidores',
      lines: [
        {
          who: 'nar',
          text: 'El paquete reconstruido pasó la validación. Inés se sacó el auricular, y se oyó el agua correr por el desagüe.',
        },
        { who: 'teo', text: 'La copia pasó. Ya puedo abrir el cuerpo con la credencial del chip.' },
        { who: 'iris', text: 'Ábrelo completo. Esta vez el horario también entra al expediente.' },
        {
          who: 'nar',
          text: 'La primera línea nombraba El Observatorio, y el horario aparecía bajo «ventana meteorológica».',
        },
      ],
    },
  ],
};
export const glyphs: Glyph[] = [
  {
    id: 'it-parity',
    world: 'information',
    tex: 'b_1\\oplus\\cdots\\oplus b_n\\oplus p=0',
    name: 'Paridad par',
    read: 'suma módulo dos de datos y paridad igual a cero',
    meaning:
      'Agrega un bit para que la cantidad de unos sea par; detecta una cantidad impar de inversiones, sin localizarlas.',
  },
  {
    id: 'it-repetition',
    world: 'information',
    tex: 'R_{\\mathrm{rep}}=1/3',
    name: 'Repetición triple',
    read: 'tasa de repetición igual a un tercio',
    meaning: 'Tres copias por dato permiten recuperar por mayoría hasta una inversión por grupo.',
  },
  {
    id: 'it-hamming',
    world: 'information',
    tex: 'R_{\\mathrm{Ham}}=4/7',
    name: 'Hamming(7,4)',
    read: 'Hamming de siete, cuatro',
    meaning: 'Cuatro datos en 3, 5, 6 y 7; tres comprobaciones en 1, 2 y 4. Distancia mínima tres.',
    warn: 'Garantiza corregir hasta una inversión. Más errores pueden producir una corrección equivocada.',
  },
  {
    id: 'it-syndrome',
    world: 'information',
    tex: 'j=s_1+2s_2+4s_4=(s_4s_2s_1)_2',
    name: 'Síndrome',
    read: 'ese cuatro, ese dos, ese uno',
    meaning:
      'Resultados de las paridades superpuestas; bajo el límite de una inversión señalan su posición desde uno. Cero indica conservar bajo ese límite.',
    warn: 'El síndrome no autentica el mensaje completo.',
  },
];
