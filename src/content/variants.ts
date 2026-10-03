import type { Puzzle, WorldId } from '../domain/types';

export interface VariantInfo {
  seed: number;
  mode: 'numeric-case' | 'choice-order' | 'repeat';
  newCase: boolean;
  template: string;
  parameters: Record<string, number>;
}
export interface VariantPuzzle extends Puzzle {
  variant: VariantInfo;
}
type Patch = Pick<Puzzle, 'setup' | 'prompt' | 'formula' | 'answer' | 'solution' | 'hint'> & {
  parameters: Record<string, number>;
};
interface Random {
  int: (min: number, max: number) => number;
  pick: <T>(values: readonly T[]) => T;
}
const text = (x: number): string => Number(x.toFixed(8)).toString();
const H = (p: number): number => -p * Math.log(p) - (1 - p) * Math.log(1 - p);
function generator(seed: number, id: string): Random {
  let state = (Number.isFinite(seed) ? Math.trunc(seed) : 0) >>> 0;
  for (const char of id) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  // Mulberry32 mixes neighbouring seeds before sampling small parameter pools.
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
  return {
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (values) => values[Math.floor(next() * values.length)],
  };
}
const patch = (
  parameters: Record<string, number>,
  setup: string,
  prompt: string,
  formula: string,
  answer: number,
  solution: string,
  hint: string,
): Patch => ({ parameters, setup, prompt, formula, answer, solution, hint });

// Each template declares its own generative problem and preserves its assumptions.
// Parameters are exposed for audit/testing, never obtained by scaling the old answer.
const numericTemplates: Record<string, (r: Random) => Patch> = {
  'foundations-mission-1': (r) => {
    const x = r.pick([0.2, 0.3, 0.4, 0.6, 0.7, 0.8]),
      a = r.int(2, 5),
      b = r.int(1, 4),
      intermediate = a * x + b;
    return patch(
      { x, a, b },
      `Lectura x=${text(x)}. Calibración f(x)=${a}x+${b}; energía g(y)=y².`,
      '¿Qué energía produce g(f(x))?',
      `g(f(${text(x)}))=(${a}\\cdot${text(x)}+${b})^2`,
      intermediate ** 2,
      `Primero f(x)=${text(intermediate)}. Después g(f(x))=${text(intermediate)}²=${text(intermediate ** 2)}. Invertir las funciones daría otra operación.`,
      'Aplica la función interior antes de elevar su salida al cuadrado.',
    );
  },
  'foundations-mission-2': (r) => {
    const a = r.int(2, 6),
      b = r.int(1, 7),
      c = r.int(2, 9),
      total = a + b + c;
    return patch(
      { a, b, c },
      `Las únicas causas son A, B y C, con pesos ${a}, ${b} y ${c}.`,
      '¿Qué probabilidad normalizada recibe C?',
      `p_C=\\frac{${c}}{${a}+${b}+${c}}`,
      c / total,
      `El total de pesos es ${total}; C recibe ${c}/${total}≈${text(c / total)}. La suma de las tres probabilidades es uno.`,
      'Divide el peso de C por el total de todas las causas.',
    );
  },
  'differential-mission-1': (r) => {
    const a = r.int(2, 6),
      mu = r.pick([-2, 0, 2, 4, 5]);
    return patch(
      { a, mu },
      `L(μ)=(μ−${a})². La creencia actual es μ=${mu}.`,
      `¿Cuánto vale L′(${mu})?`,
      `L^{\\prime}(\\mu)=2(\\mu-${a})`,
      2 * (mu - a),
      `La derivada es 2(μ−${a}); evaluada en ${mu} da ${2 * (mu - a)}. El signo indica la respuesta local del coste al aumentar μ.`,
      'Deriva el cuadrado y después sustituye la creencia actual.',
    );
  },
  'differential-mission-2': (r) => {
    const a = r.int(2, 6),
      mu = r.int(-2, 1),
      eta = r.pick([0.1, 0.2, 0.3, 0.4]),
      next = mu - eta * 2 * (mu - a);
    return patch(
      { a, mu, eta },
      `L(μ)=(μ−${a})², μ₀=${mu}, η=${text(eta)}.`,
      '¿Cuál es μ₁ después de un paso de descenso?',
      `\\mu_1=${mu}-${text(eta)}\\,2(${mu}-${a})`,
      next,
      `La pendiente actual es ${2 * (mu - a)}. Restar η veces esa pendiente produce μ₁=${text(next)}. Como 0<η<1, el factor de error |1−2η| es menor que uno para este coste.`,
      'Calcula la pendiente; después aplica el signo menos de descenso.',
    );
  },
  'integral-mission-1': (r) => {
    const length = r.pick([0.4, 0.6, 0.8, 1.2]),
      start = length * r.pick([0.1, 0.15, 0.2]),
      width = length * r.pick([0.2, 0.3, 0.4, 0.5]),
      end = start + width;
    return patch(
      { length, start, end },
      `X es uniforme en [0,${text(length)}] segundos, con densidad 1/${text(length)} por segundo. El intervalo de interés es [${text(start)},${text(end)}] segundos.`,
      `¿Cuál es P(${text(start)}≤X≤${text(end)})?`,
      `P=\\int_{${text(start)}}^{${text(end)}}\\frac1{${text(length)}}\\,dx`,
      width / length,
      `El intervalo tiene ancho ${text(width)} segundos. Densidad por ancho da ${text(width)}/${text(length)}=${text(width / length)}. El intervalo está dentro del soporte.`,
      'Multiplica el ancho del intervalo por la densidad uniforme.',
    );
  },
  'integral-mission-2': (r) => {
    const length = r.pick([0.2, 0.4, 0.6, 0.8, 1.2]),
      scale = 1000;
    return patch(
      { length, scale },
      `X es uniforme en [0,${text(length)}] segundos. Y=1000X mide milisegundos y tiene soporte [0,${text(length * scale)}].`,
      '¿Qué densidad constante tiene Y dentro de su soporte, por milisegundo?',
      `p_Y(y)=\\frac1{${text(length)}}\\frac1{1000}`,
      1 / (length * scale),
      `El ancho se multiplica por 1000 y la densidad se divide por 1000. Así, p_Y=${text(1 / (length * scale))} por milisegundo y el área total sigue siendo uno.`,
      'Conserva el producto densidad×ancho al cambiar unidades.',
    );
  },
  'linear-mission-1': (r) => {
    const a = r.pick([0.4, 0.5, 0.6, 0.7]),
      b = r.pick([0.1, 0.15, 0.2]),
      c = r.pick([0.2, 0.3, 0.4]),
      d = r.pick([0.1, 0.2, 0.25]),
      rho = r.pick([0.25, 0.35, 0.45, 0.55, 0.75]);
    return patch(
      { a, b, c, d, rho },
      `A=[[${text(a)},${text(c)}],[${text(b)},${text(d)}],[${text(1 - a - b)},${text(1 - c - d)}]], s=(${text(rho)},${text(1 - rho)})ᵀ. Filas: respuestas; columnas: estados.`,
      '¿Cuál es la probabilidad predicha de la segunda respuesta?',
      `(A s)_2=${text(b)}\\cdot${text(rho)}+${text(d)}\\cdot${text(1 - rho)}`,
      b * rho + d * (1 - rho),
      `La segunda fila aporta ${text(b * rho)} y ${text(d * (1 - rho))}; suman ${text(b * rho + d * (1 - rho))}. Cada columna de A es no negativa y suma uno.`,
      'Combina la segunda fila con las probabilidades de ambos estados.',
    );
  },
  'linear-mission-3': (r) => {
    const v1 = r.pick([2, 3, 5, 8, 9, 12]),
      v2 = r.pick([1, 2, 3, 6]);
    return patch(
      { v1, v2 },
      `La covarianza es Σ=diag(${v1},${v2}), definida positiva.`,
      '¿Qué precisión corresponde a la primera dimensión?',
      `\\Pi=\\Sigma^{-1},\\quad\\Pi_{11}=1/${v1}`,
      1 / v1,
      `Para una covarianza diagonal, la inversa toma recíprocos en la diagonal. La primera precisión es 1/${v1}≈${text(1 / v1)}. Esta regla componente a componente no vale para una matriz con covarianzas cruzadas.`,
      'Invierte la primera varianza, no su raíz.',
    );
  },
  'probability-mission-1': (r) => {
    const prior = r.pick([0.2, 0.3, 0.4]),
      sensitivity = r.pick([0.65, 0.75, 0.85, 0.95]),
      falsePositive = r.pick([0.05, 0.15, 0.25, 0.35]);
    const ap = prior * sensitivity,
      an = prior * (1 - sensitivity),
      ip = (1 - prior) * falsePositive,
      inn = (1 - prior) * (1 - falsePositive);
    return patch(
      { prior, sensitivity, falsePositive },
      `Tabla conjunta: activa/positiva=${text(ap)}, activa/negativa=${text(an)}, inactiva/positiva=${text(ip)}, inactiva/negativa=${text(inn)}.`,
      '¿Cuánto vale P(activa|positiva)?',
      `P(activa\\mid+)={${text(ap)}}/{(${text(ap)}+${text(ip)})}`,
      ap / (ap + ip),
      `La señal positiva tiene masa ${text(ap + ip)}. Dentro de esa columna, la fracción activa es ${text(ap)}/${text(ap + ip)}≈${text(ap / (ap + ip))}. La tabla completa suma uno.`,
      'La condición selecciona la columna positiva y su total es el denominador.',
    );
  },
  'probability-mission-2': (r) => {
    const prior = r.pick([0.25, 0.35, 0.45, 0.65, 0.75]),
      high = r.pick([0.6, 0.7, 0.8, 0.85]),
      low = r.pick([0.15, 0.2, 0.3, 0.4]),
      result = prior * high ** 2 + (1 - prior) * low ** 2;
    return patch(
      { prior, high, low },
      `P(S=1)=${text(prior)}. Dado S=1, cada sensor da + con probabilidad ${text(high)}; dado S=0, con ${text(low)}. Los sensores son independientes dado S.`,
      '¿Cuánto vale P(A=+,B=+)?',
      `P(+,+)=${text(prior)}(${text(high)})^2+${text(1 - prior)}(${text(low)})^2`,
      result,
      `Se multiplica dentro de cada estado y se suma entre estados: ${text(result)}. La marginal de cada sensor es ${text(prior * high + (1 - prior) * low)}; su producto difiere de esta conjunta porque la causa compartida genera dependencia marginal.`,
      'Multiplica las dos señales dentro de cada causa; pondera y suma las causas.',
    );
  },
  'statistics-mission-1': (r) => {
    const n = r.int(11, 25),
      k = r.int(2, n - 2);
    return patch(
      { n, k },
      `${k} aciertos y ${n - k} errores en ${n} ensayos iid Bernoulli con la misma θ.`,
      '¿Cuál es el estimador de máxima likelihood θ̂?',
      `\\hat\\theta=${k}/${n}`,
      k / n,
      `Maximizar θ^${k}(1−θ)^${n - k} da θ̂=${k}/${n}≈${text(k / n)}. El dato queda fijo al variar el parámetro.`,
      'La proporción de éxitos maximiza esta likelihood Bernoulli.',
    );
  },
  'statistics-mission-2': (r) => {
    const sigma = r.int(1, 6),
      rootN = r.pick([3, 5, 6, 7, 8, 9]),
      n = rootN ** 2;
    return patch(
      { sigma, n },
      `${n} mediciones iid con varianza finita conocida σ²=${sigma ** 2}. El estimador es su media.`,
      '¿Cuál es el error estándar de la media?',
      `\\operatorname{SD}(\\bar X)=\\frac{${sigma}}{\\sqrt{${n}}}`,
      sigma / rootN,
      `σ=${sigma} y √n=${rootN}. El error estándar es σ/√n=${sigma}/${rootN}≈${text(sigma / rootN)}. La independencia elimina covarianzas y Var(media)=σ²/n. No se requiere normalidad para esta identidad.`,
      'Toma la raíz de la varianza y divide por la raíz del tamaño de muestra.',
    );
  },
  'multivariate-mission-1': (r) => {
    const a = r.int(2, 5),
      b = r.int(1, 3),
      c = r.int(1, 4),
      dx = r.pick([0.05, 0.1, 0.15]),
      dy = -r.pick([0.05, 0.1, 0.15]),
      result = -2 * a * dx + 2 * c * b * dy;
    return patch(
      { a, b, c, dx, dy },
      `L=(x−${a})²+${c}(y+${b})², punto (0,0), desplazamiento (${text(dx)},${text(dy)}).`,
      '¿Qué cambio de L predice la aproximación de primer orden?',
      `\\Delta L\\approx(-${2 * a},${2 * c * b})\\cdot(${text(dx)},${text(dy)})`,
      result,
      `El gradiente en (0,0) es (−${2 * a},${2 * c * b}). Su producto con el desplazamiento da ${text(result)}. El cambio exacto añade ${text(dx ** 2 + c * dy ** 2)} de términos cuadráticos: distingue aproximación e igualdad.`,
      'Multiplica cada parcial por el desplazamiento de su coordenada y suma.',
    );
  },
  'multivariate-mission-2': (r) => {
    const h1 = r.pick([1, 3, 5, 6]),
      h2 = r.pick([2, 3, 5, 8, 9]);
    return patch(
      { h1, h2 },
      `U es el negativo del log posterior y tiene un mínimo interior. H_U(μ)=diag(${h1},${h2}), definido positivo.`,
      '¿Qué varianza de Laplace corresponde a la segunda coordenada?',
      `\\Sigma\\approx H_U^{-1},\\quad\\Sigma_{22}=1/${h2}`,
      1 / h2,
      `La covarianza local es la inversa de la precisión H_U. La segunda varianza es 1/${h2}≈${text(1 / h2)}; su desviación estándar es la raíz de ese valor.`,
      'Invierte la curvatura positiva de la segunda coordenada.',
    );
  },
  'information-mission-1': (r) => {
    const q = r.pick([0.2, 0.3, 0.4, 0.6, 0.7, 0.8]),
      p = r.pick([0.1, 0.25, 0.35, 0.65, 0.75, 0.9]),
      answer = q * Math.log(q / p) + (1 - q) * Math.log((1 - q) / (1 - p));
    return patch(
      { q, p },
      `q=(${text(q)},${text(1 - q)}), p=(${text(p)},${text(1 - p)}). Ambas distribuciones tienen soporte completo; usa logs naturales.`,
      '¿Cuánto vale KL(q‖p), en nats?',
      `\\mathrm{KL}(q\\Vert p)=${text(q)}\\ln\\frac{${text(q)}}{${text(p)}}+${text(1 - q)}\\ln\\frac{${text(1 - q)}}{${text(1 - p)}}`,
      answer,
      `Se pondera cada log cociente por q, no por p. El resultado es ${text(answer)} nats. Invertir los argumentos calcula otra divergencia.`,
      'Usa q para los pesos y q/p dentro de cada logaritmo.',
    );
  },
  'dynamics-mission-1': (r) => {
    const k = r.pick([0.5, 1, 1.5, 2.5, 3]),
      x = r.pick([-4, -3, -2, 2, 4, 5]),
      dt = r.pick([0.05, 0.1, 0.15, 0.2]);
    return patch(
      { k, x, dt },
      `ẋ=−${text(k)}x, x₀=${x}, Δt=${text(dt)}.`,
      '¿Cuál es x₁ por Euler?',
      `x_1=${x}+${text(dt)}(-${text(k)}\\cdot${x})`,
      x * (1 - k * dt),
      `La velocidad actual es ${text(-k * x)}. Multiplicarla por Δt y sumarla a x₀ da ${text(x * (1 - k * dt))}. El factor 1−kΔt tiene valor absoluto menor que uno en este caso.`,
      'La velocidad debe multiplicarse por la duración del paso.',
    );
  },
  'dynamics-mission-2': (r) => {
    const sigma = r.pick([0.5, 1, 1.5, 3, 4]),
      rootDt = r.pick([0.05, 0.15, 0.2, 0.25]),
      dt = rootDt ** 2;
    return patch(
      { sigma, dt },
      `dX=−Xdt+${text(sigma)}dW. Euler–Maruyama usa ξ~N(0,1) y Δt=${text(dt)}.`,
      '¿Qué coeficiente multiplica ξ en el incremento?',
      `${text(sigma)}\\sqrt{${text(dt)}}`,
      sigma * rootDt,
      `ΔW tiene varianza Δt, de modo que ΔW=√Δt·ξ en distribución. El coeficiente es ${text(sigma)}×${text(rootDt)}=${text(sigma * rootDt)}, no σΔt.`,
      'El incremento browniano escala con la raíz del intervalo.',
    );
  },
  'dynamics-mission-3': (r) => {
    const k = r.pick([0.5, 1, 1.5, 3, 4]),
      D = r.pick([0.25, 0.5, 1.5, 2, 3]);
    return patch(
      { k, D },
      `dX=−${text(k)}Xdt+√(${text(2 * D)})dW. Es Ornstein–Uhlenbeck con k=${text(k)}>0 y D=${text(D)}>0.`,
      '¿Cuál es la varianza de la distribución estacionaria?',
      `\\operatorname{Var}(X_{ss})=\\frac{D}{k}=\\frac{${text(D)}}{${text(k)}}`,
      D / k,
      `La difusión y el retorno equilibran la varianza en D/k=${text(D / k)}. Las trayectorias siguen fluctuando aunque la distribución sea estacionaria.`,
      'Identifica D en el coeficiente √(2D) del ruido.',
    );
  },
  'bayesian-mission-1': (r) => {
    const prior = r.pick([0.005, 0.01, 0.015, 0.02]),
      sensitivity = r.pick([0.65, 0.75, 0.85, 0.95]),
      falsePositive = r.pick([0.03, 0.04, 0.06, 0.08]);
    const numerator = prior * sensitivity,
      evidence = numerator + (1 - prior) * falsePositive;
    return patch(
      { prior, sensitivity, falsePositive },
      `P(activa)=${text(prior)}, P(+|activa)=${text(sensitivity)}, P(+|inactiva)=${text(falsePositive)}. Activa e inactiva agotan las causas.`,
      '¿Qué probabilidad tiene la fuente activa después de un positivo?',
      `P(S\\mid+)={${text(prior)}\\cdot${text(sensitivity)}}/{(${text(prior)}\\cdot${text(sensitivity)}+${text(1 - prior)}\\cdot${text(falsePositive)})}`,
      numerator / evidence,
      `El apoyo activo es ${text(numerator)} y la evidencia positiva total ${text(evidence)}. Su cociente es ${text(numerator / evidence)}. La sensibilidad y la tasa base desempeñan papeles diferentes.`,
      'Incluye la ruta de falsos positivos de la causa frecuente.',
    );
  },
  'bayesian-mission-2': (r) => {
    const alpha = r.int(1, 5),
      beta = r.int(2, 6),
      success = r.int(2, 8),
      failure = r.int(1, 5),
      numerator = alpha + success,
      total = alpha + beta + success + failure;
    return patch(
      { alpha, beta, success, failure },
      `θ~Beta(${alpha},${beta}). Observas ${success} éxitos y ${failure} fracasos independientes dado una θ constante.`,
      '¿Cuál es la probabilidad predictiva del próximo éxito?',
      `P(X_{nuevo}=1\\mid x)=\\frac{${alpha}+${success}}{${alpha}+${beta}+${success}+${failure}}`,
      numerator / total,
      `El posterior es Beta(${alpha + success},${beta + failure}). Su media ${numerator}/${total}≈${text(numerator / total)} predice el siguiente éxito.`,
      'Suma éxitos a α y fracasos a β antes de calcular la media.',
    );
  },
  'bayesian-mission-3': (r) => {
    const mu = r.int(-2, 2),
      y = mu + r.int(2, 6),
      priorVariance = r.pick([1, 2, 3, 5, 6, 9]),
      sensorVariance = r.pick([0.5, 1.5, 2, 3, 4]);
    const lp = 1 / priorVariance,
      ly = 1 / sensorVariance,
      mean = (lp * mu + ly * y) / (lp + ly);
    return patch(
      { mu, y, priorVariance, sensorVariance },
      `Prior s~N(${mu},${text(priorVariance)}), donde la segunda entrada es varianza. Lectura y=${y}, con ruido aditivo N(0,${text(sensorVariance)}) independiente de s.`,
      '¿Cuál es la media posterior de s?',
      `\\mu_{post}=\\frac{${mu}/${text(priorVariance)}+${y}/${text(sensorVariance)}}{1/${text(priorVariance)}+1/${text(sensorVariance)}}`,
      mean,
      `Las precisiones son ${text(lp)} y ${text(ly)}. La media ponderada es ${text(mean)}; la varianza posterior es 1/(λ_prior+λ_sensor)=${text(1 / (lp + ly))}. Precisión es confianza modelada, no garantía de verdad.`,
      'Pondera por inversos de varianzas, no por las varianzas mismas.',
    );
  },
  'variational-mission-1': (r) => {
    const joint1 = r.pick([0.15, 0.2, 0.25, 0.35, 0.4]),
      joint2 = r.pick([0.05, 0.15, 0.2, 0.25]);
    return patch(
      { joint1, joint2 },
      `Dato fijo o: p(o,z₁)=${text(joint1)}, p(o,z₂)=${text(joint2)}. Solo hay estas dos causas; q=(φ,1−φ) sin otra restricción.`,
      '¿Qué φ minimiza F?',
      `\\phi_*=\\frac{${text(joint1)}}{${text(joint1)}+${text(joint2)}}`,
      joint1 / (joint1 + joint2),
      `La evidencia es ${text(joint1 + joint2)}. El posterior asigna ${text(joint1 / (joint1 + joint2))} a z₁. Como pertenece a la familia q, igualarlo cierra la KL y alcanza F=−ln evidencia.`,
      'Normaliza los pesos conjuntos; el mínimo se alcanza en el posterior.',
    );
  },
  'variational-mission-2': (r) => {
    const q = r.pick([0.2, 0.3, 0.4, 0.6, 0.7, 0.8]),
      p = r.pick([0.1, 0.25, 0.35, 0.65, 0.75, 0.9]),
      evidence = r.pick([0.2, 0.3, 0.5, 0.6, 0.8]),
      gap = q * Math.log(q / p) + (1 - q) * Math.log((1 - q) / (1 - p));
    return patch(
      { q, p, evidence },
      `Para un dato fijo: q=(${text(q)},${text(1 - q)}), p(z|o)=(${text(p)},${text(1 - p)}), p(o)=${text(evidence)}. Usa logs naturales.`,
      '¿Cuál es F[q]−(−ln p(o)), en nats?',
      `F[q]+\\ln p(o)=\\mathrm{KL}(q\\Vert p(z\\mid o))`,
      gap,
      `El exceso es KL(q‖posterior)=${text(gap)} nats. La sorpresa fija es ${text(-Math.log(evidence))} y F=${text(gap - Math.log(evidence))}. Cambiar q no cambia la evidencia.`,
      'La diferencia entre F y sorpresa es exactamente una KL dirigida.',
    );
  },
  'generative-mission-1': (r) => {
    const a = r.pick([0.6, 0.7, 0.9, 0.95]),
      b = r.pick([0.1, 0.15, 0.3, 0.35]),
      prior = r.pick([0.25, 0.35, 0.45, 0.55, 0.7]),
      total = a * prior + b * (1 - prior);
    return patch(
      { a, b, prior },
      `A=[[${text(a)},${text(b)}],[${text(1 - a)},${text(1 - b)}]], D=(${text(prior)},${text(1 - prior)}). Filas: respuestas; columnas: estados. Observas la primera respuesta.`,
      '¿Qué posterior recibe el primer estado?',
      `q(s_1)=\\frac{${text(a)}\\cdot${text(prior)}}{${text(a)}\\cdot${text(prior)}+${text(b)}\\cdot${text(1 - prior)}}`,
      (a * prior) / total,
      `La fila del dato aporta likelihoods ${text(a)} y ${text(b)}. Al multiplicar por D y normalizar por ${text(total)}, el primer estado recibe ${text((a * prior) / total)}.`,
      'Selecciona una fila por el dato, multiplica por el prior y normaliza.',
    );
  },
  'generative-mission-2': (r) => {
    const a = r.pick([0.55, 0.65, 0.75, 0.85, 0.95]),
      b = r.pick([0.05, 0.15, 0.25, 0.35, 0.45]),
      prior = r.pick([0.2, 0.3, 0.4, 0.5, 0.7, 0.8]);
    return patch(
      { a, b, prior },
      `Bᵘ=[[${text(a)},${text(b)}],[${text(1 - a)},${text(1 - b)}]], q(s_t)=(${text(prior)},${text(1 - prior)}). Filas: estado siguiente; columnas: estado actual.`,
      '¿Qué probabilidad predices para el primer estado siguiente?',
      `(B^u q)_1=${text(a)}\\cdot${text(prior)}+${text(b)}\\cdot${text(1 - prior)}`,
      a * prior + b * (1 - prior),
      `La primera fila mezcla las dos causas actuales y da ${text(a * prior + b * (1 - prior))}. La probabilidad del segundo estado es su complemento; cada columna de B suma uno.`,
      'Suma las contribuciones de ambos estados actuales a la primera fila.',
    );
  },
  'generative-mission-3': (r) => {
    const px = r.pick([0.2, 0.3, 0.4, 0.6]),
      py = r.pick([0.25, 0.35, 0.5, 0.7]),
      pz = px + py - px * py;
    return patch(
      { px, py },
      `X e Y son binarias independientes: P(X=1)=${text(px)}, P(Y=1)=${text(py)}. Z=1 si X=1 o Y=1. Solo sabes Z=1.`,
      '¿Cuál es P(X=1|Z=1)?',
      `P(X=1\\mid Z=1)=\\frac{${text(px)}}{${text(px)}+${text(py)}-${text(px)}\\cdot${text(py)}}`,
      px / pz,
      `P(Z=1)=${text(pz)} porque se excluye solo X=0,Y=0. Si X=1, Z=1 necesariamente: P(X=1,Z=1)=${text(px)}. El posterior es ${text(px / pz)}. Observar el efecto común cambia las relaciones entre sus causas.`,
      'Enumera los tres casos compatibles con Z=1 y normaliza la masa de X=1.',
    );
  },
  'decision-mission-1': (r) => {
    const rho = r.pick([0.2, 0.3, 0.4, 0.6, 0.7, 0.8]);
    return patch(
      { rho },
      `P(S=0)=${text(rho)}. Preferencias P_C=(0.5,0.5). A informa O=S perfectamente. B devuelve una señal independiente de S con P(O=0)=${text(rho)}. Ambas políticas predicen q(O)=(${text(rho)},${text(1 - rho)}).`,
      '¿Cuánto mayor es G(B) que G(A), en nats?',
      `G(B)-G(A)=H(O\\mid S)_B=-${text(rho)}\\ln${text(rho)}-${text(1 - rho)}\\ln${text(1 - rho)}`,
      H(rho),
      `Las predicciones de O son iguales, así que el riesgo respecto de P_C se cancela. A tiene ambigüedad cero; B tiene ambigüedad H(O)=${text(H(rho))}. Esta es la diferencia de G bajo la misma convención de preferencias sobre observaciones.`,
      'No hace falta que el riesgo sea cero: basta que sea idéntico para ambas políticas.',
    );
  },
  'decision-mission-2': (r) => {
    const ratio = r.pick([2, 4, 5, 6, 8]),
      gamma = r.pick([0.5, 1, 1.5, 2]),
      firstG = r.pick([0.2, 0.4, 0.6]),
      secondG = firstG + Math.log(ratio),
      weight = ratio ** -gamma;
    return patch(
      { ratio, gamma, firstG },
      `Dos políticas tienen E iguales y F iguales. G₁=${text(firstG)}, G₂=${text(firstG)}+ln(${ratio}). Usa γ=${text(gamma)} en softmax(ln E−γG).`,
      '¿Qué probabilidad recibe la primera política?',
      `q(\\pi_1)=\\frac1{1+${ratio}^{-${text(gamma)}}}`,
      1 / (1 + weight),
      `El término común −γG₁ se cancela. Los pesos relativos son 1 y exp(−γln${ratio})=${text(weight)}. La primera probabilidad es ${text(1 / (1 + weight))}. La simplificación usa E y F iguales.`,
      'Resta el término común antes de exponenciar y normalizar.',
    );
  },
  'active-mission-1': (r) => {
    const prior = r.pick([0.25, 0.35, 0.45, 0.65, 0.75]),
      a = r.pick([0.65, 0.75, 0.85, 0.95]),
      b = r.pick([0.1, 0.15, 0.25, 0.35]),
      evidence = prior * a + (1 - prior) * b;
    return patch(
      { prior, a, b },
      `Fuente izquierda/derecha: P(izquierda)=${text(prior)}. P(+|izquierda)=${text(a)}, P(+|derecha)=${text(b)}. Observas +.`,
      '¿Cuál es q(izquierda|+)?',
      `q(L\\mid+)=\\frac{${text(prior)}\\cdot${text(a)}}{${text(prior)}\\cdot${text(a)}+${text(1 - prior)}\\cdot${text(b)}}`,
      (prior * a) / evidence,
      `Los pesos son ${text(prior * a)} y ${text((1 - prior) * b)}. Normalizarlos por ${text(evidence)} da q(izquierda|+)=${text((prior * a) / evidence)}. La creencia cambia; el estado físico no cambia por inferirlo.`,
      'Combina la likelihood de cada ubicación con su propia probabilidad previa.',
    );
  },
  'active-mission-2': (r) => {
    const a = r.pick([1, 3, 4, 5]),
      b = r.int(1, 6);
    return patch(
      { a, b },
      `Estado conocido. Prior Dirichlet para sus dos respuestas: a=(${a},${b}). Observas la primera respuesta una vez, bajo un modelo categórico iid condicional.`,
      '¿Qué probabilidad media tiene ahora esa respuesta en la columna de A?',
      `\\mathbb E[A_{1j}]=\\frac{${a}+1}{${a}+${b}+1}`,
      (a + 1) / (a + b + 1),
      `La actualización conjugada exacta da parámetros (${a + 1},${b}). Su media para la primera respuesta es ${a + 1}/${a + b + 1}≈${text((a + 1) / (a + b + 1))}. Se normaliza solo esta columna.`,
      'Añade la observación a su categoría; luego divide por el total actualizado.',
    );
  },
};
export const NUMERIC_VARIANT_IDS = Object.keys(numericTemplates);

/** A new numerical case, or an explicitly labelled rearrangement/repetition. */
export function makeVariant(world: WorldId, base: Puzzle, seed: number): VariantPuzzle {
  const normalizedSeed = Number.isFinite(seed) ? Math.trunc(seed) : 0;
  const cloned: Puzzle = {
    ...base,
    choices: base.choices?.slice(),
    answer: Array.isArray(base.answer) ? base.answer.slice() : base.answer,
  };
  const r = generator(normalizedSeed, `${world}:${base.id}`);
  const repeat: VariantInfo = {
    seed: normalizedSeed,
    mode: 'repeat',
    newCase: false,
    template: base.id,
    parameters: {},
  };
  if (!base.id.startsWith(`${world}-mission-`)) return { ...cloned, variant: repeat };
  if (base.kind === 'numeric' && numericTemplates[base.id]) {
    const { parameters, ...content } = numericTemplates[base.id](r);
    return {
      ...cloned,
      ...content,
      variant: { ...repeat, mode: 'numeric-case', newCase: true, parameters },
    };
  }
  if (
    base.kind === 'choice' &&
    typeof base.answer === 'number' &&
    Number.isInteger(base.answer) &&
    base.choices &&
    base.answer >= 0 &&
    base.answer < base.choices.length
  ) {
    const order = base.choices.map((_, index) => index);
    for (let i = order.length - 1; i > 0; i--) {
      const j = r.int(0, i);
      [order[i], order[j]] = [order[j], order[i]];
    }
    if (order.length > 1 && order.every((index, position) => index === position))
      order.push(order.shift()!);
    return {
      ...cloned,
      choices: order.map((index) => base.choices![index]),
      answer: order.indexOf(base.answer),
      variant: { ...repeat, mode: 'choice-order' },
    };
  }
  return { ...cloned, variant: repeat };
}
export function variantInfo(puzzle: Puzzle): VariantInfo | undefined {
  return (puzzle as Partial<VariantPuzzle>).variant;
}
