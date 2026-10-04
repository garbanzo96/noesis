import type { Params, WorldId } from '../../domain/types';
import { bayes, clamp, entropy, gaussian, lerp } from '../../domain/math';
import type { ReactNode } from 'react';
const cyan = '#28e7fa',
  pink = '#ff3ba7',
  violet = '#a88aff',
  amber = '#ffbc5e';
const X = (x: number) => 480 + x * 110,
  Y = (y: number) => 245 - y * 90;
const curve = (fn: (x: number) => number, min = -3.5, max = 3.5) =>
  Array.from({ length: 160 }, (_, i) => {
    const x = lerp(min, max, i / 159);
    return `${i ? 'L' : 'M'}${X(x)} ${Y(fn(x))}`;
  }).join(' ');
function Text({
  x,
  y,
  children,
  color = '#a99fbd',
  size = 16,
}: {
  x: number;
  y: number;
  children: ReactNode;
  color?: string;
  size?: number;
}) {
  return (
    <text x={x} y={y} textAnchor="middle" fill={color} fontSize={size}>
      {children}
    </text>
  );
}
function Axes() {
  return (
    <g>
      <path d="M80 245H890M480 40V410" stroke="#625174" strokeWidth="1.5" />
      {[-3, -2, -1, 1, 2, 3].map((x) => (
        <g key={x}>
          <path d={`M${X(x)} 240v10`} stroke="#776489" />
          <Text x={X(x)} y={267} size={13}>
            {x}
          </Text>
        </g>
      ))}
      <Text x={910} y={250}>
        x
      </Text>
      <Text x={495} y={40}>
        y
      </Text>
    </g>
  );
}
function Bar({
  x,
  y,
  h,
  label,
  color = cyan,
  value,
}: {
  x: number;
  y: number;
  h: number;
  label: string;
  color?: string;
  value?: string;
}) {
  return (
    <g>
      <rect
        x={x - 36}
        y={y - h}
        width="72"
        height={Math.max(1, h)}
        fill={color}
        fillOpacity=".24"
        stroke={color}
        strokeWidth="2"
      />
      <Text x={x} y={y + 27} size={15}>
        {label}
      </Text>
      {value && (
        <Text x={x} y={y - h - 15} color={color}>
          {value}
        </Text>
      )}
    </g>
  );
}
function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = cyan,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
}) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="3" />
      <circle cx={x2} cy={y2} r="5" fill={color} />
    </g>
  );
}
function Box({
  x,
  y,
  label,
  value,
  color = cyan,
}: {
  x: number;
  y: number;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <g>
      <rect
        x={x - 85}
        y={y - 60}
        width="170"
        height="120"
        fill="#0c0920"
        stroke={color}
        strokeWidth="2"
      />
      <Text x={x} y={y - 25} size={13}>
        {label}
      </Text>
      <Text x={x} y={y + 20} color={color} size={28}>
        {value}
      </Text>
    </g>
  );
}
export function Geometry({ world, p, t }: { world: WorldId; p: Params; t: number }) {
  let body: ReactNode;
  switch (world) {
    case 'foundations': {
      const y = 2 * p.x + 1,
        z = y * y;
      body = (
        <>
          <path d="M75 205H885" stroke="#574074" strokeWidth="2" />
          <Box x={180} y={205} label="ENTRADA x" value={p.x.toFixed(2)} />
          <Box x={480} y={205} label="f(x) = 2x + 1" value={y.toFixed(2)} />
          <Box x={780} y={205} label="g(y) = y²" value={z.toFixed(2)} color={pink} />
          <circle cx={75 + t * 810} cy="205" r="7" fill={cyan} />
          <Text x={480} y={340} color={violet} size={20}>
            g ∘ f: primero f, después g
          </Text>
          <Text x={480} y={375}>
            {Math.abs(2 * p.x * p.x + 1 - z) < 0.001
              ? 'Aquí coinciden; en general el orden importa.'
              : `Invertir el orden da ${(2 * p.x * p.x + 1).toFixed(2)}, frente a ${z.toFixed(2)}.`}
          </Text>
        </>
      );
      break;
    }
    case 'differential': {
      const { x, h } = p,
        slope = 2 * x + h;
      body = (
        <>
          <Axes />
          <path d={curve((x) => x * x, -1.2, 2.2)} stroke={violet} strokeWidth="3" fill="none" />
          <path
            d={curve((u) => x * x + slope * (u - x), x - 0.9, x + h + 0.7)}
            stroke={cyan}
            strokeWidth="3"
            fill="none"
          />
          <path
            d={curve((u) => x * x + 2 * x * (u - x), x - 0.9, x + 0.9)}
            stroke={pink}
            strokeWidth="2"
            strokeDasharray="7 5"
            fill="none"
          />
          <Arrow x1={X(x)} y1={Y(x * x)} x2={X(x + h)} y2={Y((x + h) ** 2)} />
          <circle cx={X(x)} cy={Y(x * x)} r="6" fill={pink} />
          <Text x={180} y={50} color={cyan}>
            Secante: {(2 * x + h).toFixed(2)}
          </Text>
          <Text x={180} y={82} color={pink}>
            Tangente: {(2 * x).toFixed(2)}
          </Text>
          <Text x={720} y={385}>
            h = {h.toFixed(2)}; error = h
          </Text>
        </>
      );
      break;
    }
    case 'integral': {
      const dx = p.b / p.n;
      body = (
        <>
          <Axes />
          {Array.from({ length: p.n }, (_, i) => {
            const x = (i + 1) * dx;
            return (
              <rect
                key={i}
                x={X(i * dx)}
                y={Y(x * x)}
                width={Math.max(1, dx * 110)}
                height={x * x * 90}
                fill={cyan}
                fillOpacity={i / p.n < t ? 0.32 : 0.12}
                stroke={cyan}
                strokeOpacity=".7"
              />
            );
          })}
          <path d={curve((x) => x * x, 0, 2)} stroke={pink} strokeWidth="3" fill="none" />
          <Text x={220} y={50} color={cyan}>
            n = {p.n}; Δx = {dx.toFixed(3)}
          </Text>
          <Text x={480} y={393}>
            El área exacta es b³/3. Refinar no cambia el intervalo.
          </Text>
        </>
      );
      break;
    }
    case 'linear': {
      const f = (x: number, y: number) => [X(p.a * x + p.b * y), Y(y)];
      const a = f(1, 0),
        b = f(0, 1),
        v = f(1, 1);
      body = (
        <>
          {Array.from({ length: 9 }, (_, i) => i - 4).map((i) => (
            <g key={i}>
              <path
                d={`M${f(i, -2).join(' ')}L${f(i, 2).join(' ')}`}
                stroke="#655183"
                strokeOpacity=".45"
              />
              <path
                d={`M${f(-3, i).join(' ')}L${f(3, i).join(' ')}`}
                stroke="#655183"
                strokeOpacity=".45"
              />
            </g>
          ))}
          <Axes />
          <Arrow x1={X(0)} y1={Y(0)} x2={a[0]} y2={a[1]} color={cyan} />
          <Arrow x1={X(0)} y1={Y(0)} x2={b[0]} y2={b[1]} color={pink} />
          <Arrow
            x1={X(0)}
            y1={Y(0)}
            x2={lerp(X(1), v[0], t)}
            y2={lerp(Y(1), v[1], t)}
            color={amber}
          />
          <Text x={a[0]} y={a[1] + 30} color={cyan}>
            M e₁
          </Text>
          <Text x={b[0]} y={b[1] - 20} color={pink}>
            M e₂
          </Text>
          <Text x={720} y={395} color={amber}>
            v → Mv = ({(p.a + p.b).toFixed(2)}, 1)
          </Text>
        </>
      );
      break;
    }
    case 'probability': {
      const masses = [0.1, 0.4, 0.2, 0.3];
      body = (
        <>
          {masses.map((mass, i) => {
            const col = i % 2;
            const selected = col === p.column;
            const val = lerp(mass, selected ? mass / (p.column ? 0.7 : 0.3) : 0, p.condition);
            return (
              <Bar
                key={i}
                x={230 + i * 170}
                y={315}
                h={val * 250}
                value={val.toFixed(3)}
                label={`A${Math.floor(i / 2)}, B${col}`}
                color={selected ? cyan : pink}
              />
            );
          })}
          <Text x={480} y={55} color={violet} size={20}>
            {p.condition > 0.98 ? 'DISTRIBUCIÓN CONDICIONAL' : 'TABLA CONJUNTA → CONDICIONAL'}
          </Text>
          <Text x={480} y={390}>
            La columna seleccionada divide por {p.column ? '0.7' : '0.3'}; las otras masas quedan
            fuera.
          </Text>
        </>
      );
      break;
    }
    case 'statistics':
    case 'variational': {
      const isV = world === 'variational';
      body = (
        <>
          <Axes />
          {isV && (
            <path
              d={curve((x) => gaussian(x, 0.6, 0.7))}
              fill="none"
              stroke={pink}
              strokeWidth="3"
              strokeDasharray="7 4"
            />
          )}
          <path
            d={curve((x) => gaussian(x, p.mu, p.sigma))}
            fill="none"
            stroke={cyan}
            strokeWidth="3"
          />
          <line
            x1={X(p.mu)}
            y1={Y(0)}
            x2={X(p.mu)}
            y2={Y(gaussian(p.mu, p.mu, p.sigma))}
            stroke={cyan}
            strokeDasharray="5 5"
          />
          <circle
            cx={X(lerp(-3, 3, t))}
            cy={Y(gaussian(lerp(-3, 3, t), p.mu, p.sigma))}
            r="5"
            fill={cyan}
          />
          <Text x={210} y={55} color={cyan}>
            {isV ? 'q aproximada' : 'Densidad p(x) · eje y = p(x)'}
          </Text>
          {isV && (
            <Text x={750} y={55} color={pink}>
              Posterior: N(0.6, 0.7²)
            </Text>
          )}
          <Text x={480} y={385}>
            {isV
              ? 'KL mide el gap, no el área entre curvas.'
              : 'Área total = 1. Altura = densidad; anchura = dispersión.'}
          </Text>
        </>
      );
      break;
    }
    case 'multivariate': {
      const steps = Math.round(p.steps);
      const path = Array.from({ length: steps + 1 }, (_, i) => [
        2 * (1 - 2 * p.eta) ** i,
        1.5 * (1 - 4 * p.eta) ** i,
      ]);
      body = (
        <>
          <Axes />
          {[0.2, 0.5, 1, 1.5, 2, 2.5].map((r) => (
            <ellipse
              key={r}
              cx={X(0)}
              cy={Y(0)}
              rx={r * 110}
              ry={(r / Math.sqrt(2)) * 90}
              fill="none"
              stroke={violet}
              opacity=".55"
            />
          ))}
          <path
            d={path
              .map(
                ([x, y], i) =>
                  `${i ? 'L' : 'M'}${X(clamp(x, -3.5, 3.5))} ${Y(clamp(y, -1.7, 2.2))}`,
              )
              .join(' ')}
            fill="none"
            stroke={cyan}
            strokeWidth="2"
          />
          {path.slice(0, Math.max(1, Math.ceil(t * path.length))).map(([x, y], i) => (
            <circle
              key={i}
              cx={X(clamp(x, -3.5, 3.5))}
              cy={Y(clamp(y, -1.7, 2.2))}
              r="4"
              fill={i === steps ? pink : cyan}
            />
          ))}
          <Text x={480} y={393}>
            Curvas de nivel: igual L. Valores fuera del rango se muestran en el borde.
          </Text>
        </>
      );
      break;
    }
    case 'information': {
      body = (
        <>
          <path
            d={Array.from({ length: 150 }, (_, i) => {
              const x = (i + 0.5) / 150;
              return `${i ? 'L' : 'M'}${150 + 650 * x} ${330 - entropy(x) * 330}`;
            }).join(' ')}
            fill="none"
            stroke={violet}
            strokeWidth="3"
          />
          <path d="M150 330H800" stroke="#625174" />
          <circle cx={150 + 650 * p.p} cy={330 - entropy(p.p) * 330} r="8" fill={cyan} />
          <Text x={150} y={360}>
            0
          </Text>
          <Text x={475} y={360}>
            0.5
          </Text>
          <Text x={800} y={360}>
            1
          </Text>
          <Text x={475} y={50} color={violet} size={20}>
            ENTROPÍA DE UNA BERNOULLI
          </Text>
          <Text x={475} y={397}>
            H(0.5) = ln 2; certeza en los extremos → H = 0
          </Text>
          <line
            x1={150 + 650 * p.q}
            y1={325}
            x2={150 + 650 * p.q}
            y2={342}
            stroke={pink}
            strokeWidth="4"
          />
          <Text x={150 + 650 * p.q} y={382} color={pink}>
            q
          </Text>
        </>
      );
      break;
    }
    case 'dynamics': {
      const fac = 1 - p.k * p.dt;
      const path = Array.from({ length: 21 }, (_, i) => 2 * fac ** i);
      body = (
        <>
          <path d="M110 230H880M110 60V380" stroke="#625174" />
          <path
            d={path
              .map((x, i) => `${i ? 'L' : 'M'}${110 + i * 36} ${230 - clamp(x, -2, 2) * 70}`)
              .join(' ')}
            stroke={cyan}
            strokeWidth="2"
            fill="none"
          />
          <path
            d={Array.from(
              { length: 150 },
              (_, i) =>
                `${i ? 'L' : 'M'}${110 + (i / 149) * 720} ${230 - 2 * Math.exp(-p.k * ((i / 149) * 20 * p.dt)) * 70}`,
            ).join(' ')}
            stroke={pink}
            strokeWidth="2"
            fill="none"
            strokeDasharray="7 4"
          />
          {path.slice(0, Math.ceil(t * 21) + 1).map((x, i) => (
            <circle key={i} cx={110 + i * 36} cy={230 - clamp(x, -2, 2) * 70} r="4" fill={cyan} />
          ))}
          <Text x={270} y={55} color={cyan}>
            Euler: muestras discretas
          </Text>
          <Text x={700} y={55} color={pink}>
            Solución continua
          </Text>
          <Text x={480} y={408}>
            20 pasos; puntos fuera de ±2 se muestran en el borde.
          </Text>
        </>
      );
      break;
    }
    case 'bayesian': {
      const tp = p.prior * p.sensitivity,
        fp = (1 - p.prior) * p.falsePositive,
        post = tp / (tp + fp);
      body = (
        <>
          <Bar x={240} y={315} h={tp * 500} label="H y +" value={tp.toFixed(4)} />
          <Bar x={420} y={315} h={fp * 500} label="¬H y +" value={fp.toFixed(4)} color={pink} />
          <path d="M530 205H630" stroke={violet} strokeWidth="2" />
          <Text x={580} y={175} color={violet} size={13}>
            NORMALIZAR
          </Text>
          <Bar x={710} y={315} h={post * 230} label="P(H | +)" value={post.toFixed(4)} />
          <Bar
            x={840}
            y={315}
            h={(1 - post) * 230}
            label="P(¬H | +)"
            value={(1 - post).toFixed(4)}
            color={pink}
          />
          <Text x={480} y={55} color={amber} size={20}>
            EL DATO CAMBIA LOS PESOS RELATIVOS
          </Text>
          <Text x={480} y={398}>
            Masa total de positivos: {(tp + fp).toFixed(4)}. El posterior divide por ese total.
          </Text>
        </>
      );
      break;
    }
    case 'generative': {
      const pred = 0.9 * p.prior + 0.2 * (1 - p.prior),
        obs = p.accuracy * pred + (1 - p.accuracy) * (1 - pred),
        post = bayes(pred, p.accuracy, 1 - p.accuracy);
      body = (
        <>
          <path d="M190 200H780" stroke="#574074" strokeWidth="2" />
          <Box x={190} y={200} label="ESTADO ACTUAL" value={p.prior.toFixed(3)} />
          <Box x={480} y={200} label="PREDICCIÓN B s" value={pred.toFixed(3)} />
          <Box x={770} y={200} label="CORRECCIÓN A, o₀" value={post.toFixed(3)} color={pink} />
          <Text x={335} y={170} color={violet}>
            B
          </Text>
          <Text x={625} y={170} color={violet}>
            Aᵀ o ⊙ ŝ
          </Text>
          <circle cx={105 + t * 750} cy="200" r="6" fill={cyan} />
          <Text x={480} y={330} color={amber}>
            Predicción observable: P(o₀) = {obs.toFixed(3)}
          </Text>
          <Text x={480} y={375}>
            Cada caja muestra P(estado izquierdo). El otro estado vale 1 − este valor.
          </Text>
        </>
      );
      break;
    }
    case 'decision': {
      const ig = Math.log(2) - entropy(p.accuracy);
      body = (
        <>
          <Box x={265} y={200} label="OBSERVAR · G" value={entropy(p.accuracy).toFixed(3)} />
          <Box
            x={695}
            y={200}
            label="CANAL SIN INFO · G"
            value={Math.log(2).toFixed(3)}
            color={pink}
          />
          <Text x={265} y={300} color={cyan}>
            Información esperada: {ig.toFixed(3)} nats
          </Text>
          <Text x={695} y={300} color={pink}>
            Información esperada: 0 · canal independiente
          </Text>
          <Text x={480} y={55} color={amber} size={20}>
            MENOR G → MAYOR PESO EN LA POLÍTICA
          </Text>
          <Text x={480} y={375}>
            Estados equiprobables; preferencias uniformes; coste de medición igual a cero.
          </Text>
          <path d="M480 110V345" stroke="#574074" strokeDasharray="5 5" />
        </>
      );
      break;
    }
    case 'active': {
      const post = bayes(
        p.prior,
        p.observation === 0 ? p.accuracy : 1 - p.accuracy,
        p.observation === 0 ? 1 - p.accuracy : p.accuracy,
      );
      body = (
        <>
          <Box
            x={235}
            y={190}
            label="MUNDO · DATO o"
            value={p.observation === 0 ? 'IZQUIERDA' : 'DERECHA'}
            color={pink}
          />
          <Box x={725} y={190} label="CREENCIA · P(izq | o)" value={post.toFixed(3)} />
          <path
            d="M320 170Q480 70 640 170M640 245Q480 375 320 245"
            fill="none"
            stroke={violet}
            strokeWidth="3"
          />
          <Text x={480} y={100} color={cyan}>
            PERCEPCIÓN · F
          </Text>
          <Text x={480} y={340} color={pink}>
            ACCIÓN · G
          </Text>
          <circle
            cx={480 + 240 * Math.cos(t * Math.PI * 2)}
            cy={205 + 125 * Math.sin(t * Math.PI * 2)}
            r="7"
            fill={amber}
          />
          <Text x={480} y={382} color={amber}>
            Acción de localización: {post >= 0.5 ? 'izquierda' : 'derecha'} · criterio: mayor
            probabilidad de acierto
          </Text>
          <Text x={480} y={415}>
            Este ejemplo usa decisión bayesiana; el criterio G se desarrolla en el mundo 13.
          </Text>
        </>
      );
      break;
    }
  }
  return (
    <svg
      className="math-scene"
      viewBox="0 0 960 440"
      role="img"
      aria-label={`Visualización interactiva de ${world}`}
    >
      <defs>
        <pattern id={`grid-${world}`} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="#292044" strokeWidth=".7" />
        </pattern>
        <clipPath id="scene-clip">
          <rect width="960" height="440" />
        </clipPath>
      </defs>
      <rect width="960" height="440" fill={`url(#grid-${world})`} />
      <g clipPath="url(#scene-clip)" fontFamily="Space Grotesk, sans-serif">
        {body}
      </g>
    </svg>
  );
}
