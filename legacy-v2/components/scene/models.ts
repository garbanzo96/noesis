import type { Params, WorldId } from '../../domain/types';
import { bayes, entropy, gaussianKL, kl, softmax } from '../../domain/math';
export interface Control {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  unit?: string;
}
export interface Model {
  title: string;
  controls: Control[];
  target: string;
  principle: string;
  formula: (p: Params) => string;
  check: (p: Params) => boolean;
  readout: (p: Params) => { label: string; value: number; unit?: string }[];
}
const c = (
  key: string,
  label: string,
  min: number,
  max: number,
  step: number,
  initial: number,
  unit?: string,
): Control => ({ key, label, min, max, step, initial, unit });
export const models: Record<WorldId, Model> = {
  foundations: {
    title: 'Calibrar una cadena de funciones',
    controls: [c('x', 'Entrada x', 0, 1, 0.01, 0.2)],
    target: 'Consigue una salida z = 4. Antes de mover x, predice qué entrada la producirá.',
    principle:
      'f transforma la entrada; g transforma el resultado. La composición se lee desde dentro hacia fuera.',
    formula: (p) =>
      `x=${p.x.toFixed(2)},\\quad f(x)=2x+1,\\quad g(f(x))=${((2 * p.x + 1) ** 2).toFixed(3)}`,
    check: (p) => Math.abs((2 * p.x + 1) ** 2 - 4) < 0.04,
    readout: (p) => [
      { label: 'Salida z', value: (2 * p.x + 1) ** 2 },
      { label: 'Orden inverso f(g(x))', value: 2 * p.x * p.x + 1 },
    ],
  },
  differential: {
    title: 'De secante a tangente',
    controls: [c('x', 'Punto x', -0.5, 2, 0.05, 1), c('h', 'Intervalo h', 0.01, 1, 0.01, 0.7)],
    target:
      'En x = 1, reduce h hasta que la pendiente secante difiera de la derivada en menos de 0.03.',
    principle:
      'La secante compara dos valores. El límite h→0 revela la variación local sin dividir nunca por cero.',
    formula: (p) =>
      `f(x)=x^2,\\quad \\frac{f(x+h)-f(x)}{h}=2x+h=${(2 * p.x + p.h).toFixed(3)},\\quad f'(x)=2x`,
    check: (p) => Math.abs(p.x - 1) < 0.02 && p.h < 0.03,
    readout: (p) => [
      { label: 'Secante', value: 2 * p.x + p.h },
      { label: 'Tangente', value: 2 * p.x },
      { label: 'Error', value: p.h },
    ],
  },
  integral: {
    title: 'Acumular áreas, conservar masa',
    controls: [
      c('n', 'Rectángulos n', 2, 80, 1, 6),
      c('b', 'Extremo superior b', 0.3, 2, 0.05, 1.5),
    ],
    target:
      'Integra x² entre 0 y 1. Ajusta b = 1 y usa suficientes rectángulos para que el error sea menor que 0.02.',
    principle:
      'Cada rectángulo aporta altura × anchura. El área converge cuando las particiones se refinan.',
    formula: (p) =>
      `\\Delta x=\\frac{b}{n},\\quad \\int_0^b x^2dx=\\frac{b^3}{3}=${(p.b ** 3 / 3).toFixed(3)}`,
    check: (p) => Math.abs(p.b - 1) < 0.01 && riemann(p) < 0.02,
    readout: (p) => [
      {
        label: 'Suma por la derecha',
        value: (p.b ** 3 * (p.n + 1) * (2 * p.n + 1)) / (6 * p.n * p.n),
      },
      { label: 'Área exacta', value: p.b ** 3 / 3 },
      { label: 'Error absoluto', value: riemann(p) },
    ],
  },
  linear: {
    title: 'Transformar vectores y bases',
    controls: [
      c('a', 'Escala horizontal a', 0.25, 2, 0.05, 0.6),
      c('b', 'Cizalla b', -1, 1, 0.05, 0.5),
    ],
    target: 'Haz que el vector v = (1, 1) se transforme en (1.5, 1): escoge a y b con a + b = 1.5.',
    principle:
      'Las columnas son los destinos de los vectores de base. Cualquier otro vector combina esas columnas.',
    formula: (p) =>
      `M=\\begin{pmatrix}${p.a.toFixed(2)}&${p.b.toFixed(2)}\\\\0&1\\end{pmatrix},\\quad M\\begin{pmatrix}1\\\\1\\end{pmatrix}=\\begin{pmatrix}${(p.a + p.b).toFixed(2)}\\\\1\\end{pmatrix}`,
    check: (p) => Math.abs(p.a + p.b - 1.5) < 0.03,
    readout: (p) => [
      { label: 'Componente x de Mv', value: p.a + p.b },
      { label: 'Determinante', value: p.a },
    ],
  },
  probability: {
    title: 'Cambiar el universo de referencia',
    controls: [
      c('column', 'Condicionar en B (0 o 1)', 0, 1, 1, 0),
      c('condition', 'Mezclar → condicionar', 0, 1, 0.01, 0.2),
    ],
    target:
      'Aísla por completo la columna B₁. Comprueba que la masa 0.4 pasa a ser 4/7 al normalizar.',
    principle:
      'La probabilidad condicional conserva una columna y divide por su masa total. El denominador es el nuevo universo.',
    formula: (p) =>
      p.column === 1
        ? 'P(A_0|B_1)=\\frac{0.4}{0.4+0.3}=\\frac47'
        : 'P(A_0|B_0)=\\frac{0.1}{0.1+0.2}=\\frac13',
    check: (p) => p.column === 1 && p.condition > 0.98,
    readout: (p) => [
      { label: 'P(B seleccionado)', value: p.column ? 0.7 : 0.3 },
      { label: 'P(A₀ | B)', value: p.column ? 4 / 7 : 1 / 3 },
    ],
  },
  statistics: {
    title: 'Distribución y precisión',
    controls: [
      c('mu', 'Media μ', -2, 2, 0.05, 1.2),
      c('sigma', 'Desviación σ', 0.25, 1.8, 0.05, 1.3),
    ],
    target: 'Construye una distribución centrada en 0 con precisión λ = 4. Recuerda λ = 1/σ².',
    principle:
      'La desviación mide dispersión. La precisión mide cuánto se concentra la densidad; no es probabilidad de un punto.',
    formula: (p) =>
      `p(x)=\\mathcal N(x;${p.mu.toFixed(2)},${(p.sigma ** 2).toFixed(2)}),\\quad \\lambda=\\sigma^{-2}=${(1 / p.sigma ** 2).toFixed(3)}`,
    check: (p) => Math.abs(p.mu) < 0.02 && Math.abs(p.sigma - 0.5) < 0.02,
    readout: (p) => [
      { label: 'Varianza σ²', value: p.sigma ** 2 },
      { label: 'Precisión λ', value: 1 / p.sigma ** 2 },
    ],
  },
  multivariate: {
    title: 'Descender por un paisaje',
    controls: [c('eta', 'Paso η', 0.02, 0.65, 0.01, 0.55), c('steps', 'Iteraciones', 0, 15, 1, 2)],
    target: 'Lleva el punto inicial (2, 1.5) cerca del mínimo: L < 0.02. Elige un paso estable.',
    principle:
      'El gradiente apunta al mayor aumento. Restarlo disminuye L si el paso respeta la curvatura.',
    formula: (p) =>
      `L(x,y)=x^2+2y^2,\\quad \\nabla L=(2x,4y),\\quad z_{k+1}=z_k-\\eta\\nabla L(z_k)`,
    check: (p) => lossAfter(p) < 0.02 && p.eta < 0.5,
    readout: (p) => [
      { label: 'L después de k pasos', value: lossAfter(p) },
      { label: 'η máximo estable', value: 0.5 },
    ],
  },
  information: {
    title: 'Medir incertidumbre y desajuste',
    controls: [
      c('p', 'Creencia p', 0.01, 0.99, 0.01, 0.2),
      c('q', 'Referencia q', 0.01, 0.99, 0.01, 0.8),
    ],
    target:
      'Lleva p y q a 0.5: máxima entropía binaria y desajuste cero. Se admite un error menor que 0.015 en cada ajuste.',
    principle:
      'La entropía pertenece a una distribución. KL compara dos, es dirigida y vale cero cuando coinciden.',
    formula: (p) => `H(p)=-p\\ln p-(1-p)\\ln(1-p),\\quad D_{KL}(p\\|q)=${kl(p.p, p.q).toFixed(4)}`,
    check: (p) => Math.abs(p.p - 0.5) < 0.015 && Math.abs(p.q - p.p) < 0.015,
    readout: (p) => [
      { label: 'Entropía H(p)', value: entropy(p.p), unit: 'nats' },
      { label: 'KL(p‖q)', value: kl(p.p, p.q), unit: 'nats' },
      { label: 'KL(q‖p)', value: kl(p.q, p.p), unit: 'nats' },
    ],
  },
  dynamics: {
    title: 'Flujo, tiempo y estabilidad',
    controls: [c('k', 'Atracción k', 0.2, 3, 0.1, 2), c('dt', 'Paso Δt', 0.02, 1.2, 0.02, 1.1)],
    target:
      'Estabiliza la trayectoria de Euler: tras 20 pasos, |x| < 0.02. Observa cómo un paso grande puede divergir.',
    principle:
      'La ecuación continua atrae hacia cero. Su discretización tiene factor 1−kΔt; estabilidad exige |1−kΔt| < 1.',
    formula: (p) =>
      `\\dot x=-kx,\\quad x_{n+1}=(1-k\\Delta t)x_n,\\quad 1-k\\Delta t=${(1 - p.k * p.dt).toFixed(2)}`,
    check: (p) => Math.abs(1 - p.k * p.dt) < 1 && Math.abs(2 * (1 - p.k * p.dt) ** 20) < 0.02,
    readout: (p) => [
      { label: 'Factor de Euler', value: 1 - p.k * p.dt },
      { label: 'x₂₀ desde x₀=2', value: 2 * (1 - p.k * p.dt) ** 20 },
    ],
  },
  bayesian: {
    title: 'Reponderar antes de normalizar',
    controls: [
      c('prior', 'Tasa base P(H)', 0.01, 0.9, 0.01, 0.5),
      c('sensitivity', 'Sensibilidad P(+|H)', 0.5, 0.99, 0.01, 0.9),
      c('falsePositive', 'Falso positivo P(+|¬H)', 0.01, 0.4, 0.01, 0.1),
    ],
    target:
      'Modela el sensor raro: tasa base 1%, sensibilidad 90%, falsos positivos 10%. Compara el posterior con 90%.',
    principle:
      'Un positivo puede venir de H o de ¬H. Bayes compara las dos masas conjuntas; sensibilidad y posterior invierten la condición.',
    formula: (p) =>
      `P(H|+)=\\frac{P(H)P(+|H)}{P(H)P(+|H)+(1-P(H))P(+|\\neg H)}=${bayes(p.prior, p.sensitivity, p.falsePositive).toFixed(4)}`,
    check: (p) =>
      Math.abs(p.prior - 0.01) < 0.005 &&
      Math.abs(p.sensitivity - 0.9) < 0.005 &&
      Math.abs(p.falsePositive - 0.1) < 0.005,
    readout: (p) => [
      { label: 'Verdaderos positivos', value: p.prior * p.sensitivity },
      { label: 'Falsos positivos', value: (1 - p.prior) * p.falsePositive },
      { label: 'Posterior P(H | +)', value: bayes(p.prior, p.sensitivity, p.falsePositive) },
    ],
  },
  variational: {
    title: 'Ajustar una creencia aproximada',
    controls: [
      c('mu', 'Media de q', -1.5, 2, 0.05, -0.8),
      c('sigma', 'Desviación de q', 0.25, 1.8, 0.05, 1.5),
    ],
    target: 'Ajusta q al posterior p(s|o) = N(0.6, 0.7²). Reduce el gap KL a menos de 0.002.',
    principle:
      'El gap entre F y −ln p(o) es KL. En este caso gaussiano, q puede coincidir exactamente con el posterior.',
    formula: (p) =>
      `F[q]=D_{KL}(q\\|p(s|o))-\\ln p(o),\\quad D_{KL}=${gaussianKL(p.mu, p.sigma).toFixed(4)}`,
    check: (p) => gaussianKL(p.mu, p.sigma) < 0.002,
    readout: (p) => [
      { label: 'Gap de la cota', value: gaussianKL(p.mu, p.sigma), unit: 'nats' },
      { label: 'F si −ln p(o)=1.2', value: 1.2 + gaussianKL(p.mu, p.sigma), unit: 'nats' },
    ],
  },
  generative: {
    title: 'Predecir y corregir un estado oculto',
    controls: [
      c('prior', 'Creencia actual s₀', 0.05, 0.95, 0.01, 0.3),
      c('accuracy', 'Fiabilidad del sensor A', 0.5, 0.95, 0.01, 0.6),
    ],
    target: 'Desde s₀ = 0.8, usa A con fiabilidad 0.8. Predice con B y corrige al observar o₀.',
    principle:
      'B lleva creencias al tiempo siguiente; A convierte estados en observaciones. El dato corrige mediante producto y normalización.',
    formula: (p) => {
      const pred = 0.9 * p.prior + 0.2 * (1 - p.prior);
      return `B=\\begin{pmatrix}.9&.2\\\\.1&.8\\end{pmatrix},\\quad \\hat s_0=${pred.toFixed(3)},\\quad s_0^{nuevo}=${bayes(pred, p.accuracy, 1 - p.accuracy).toFixed(3)}`;
    },
    check: (p) => Math.abs(p.prior - 0.8) < 0.01 && Math.abs(p.accuracy - 0.8) < 0.01,
    readout: (p) => {
      const pred = 0.9 * p.prior + 0.2 * (1 - p.prior);
      return [
        { label: 'Predicción de estado', value: pred },
        { label: 'P(o₀) predictiva', value: p.accuracy * pred + (1 - p.accuracy) * (1 - pred) },
        { label: 'Posterior tras o₀', value: bayes(pred, p.accuracy, 1 - p.accuracy) },
      ];
    },
  },
  decision: {
    title: 'Comparar políticas con el mismo criterio',
    controls: [
      c('accuracy', 'Fiabilidad a del sensor', 0.5, 0.99, 0.01, 0.55),
      c('gamma', 'Precisión de políticas γ', 0.1, 8, 0.1, 1),
    ],
    target:
      'Haz que la política informativa tenga más de 80% de probabilidad: mejora el sensor y la precisión γ.',
    principle:
      'Ambas políticas generan un dato binario con estados y preferencias uniformes; la referencia es un canal independiente del estado. Hábitos E y evidencia pasada F son iguales. G = ln2 − IG; γ es precisión, inversa de temperatura.',
    formula: (p) => {
      const info = Math.log(2) - entropy(p.accuracy);
      return `IG=\\ln2-H(a)=${info.toFixed(3)},\\quad q(\\pi)=\\operatorname{softmax}(-\\gamma G)`;
    },
    check: (p) => softmax([-p.gamma * entropy(p.accuracy), -p.gamma * Math.log(2)])[0] > 0.8,
    readout: (p) => [
      { label: 'IG de observar', value: Math.log(2) - entropy(p.accuracy), unit: 'nats' },
      { label: 'G observar', value: entropy(p.accuracy), unit: 'nats' },
      {
        label: 'q(observar)',
        value: softmax([-p.gamma * entropy(p.accuracy), -p.gamma * Math.log(2)])[0],
      },
    ],
  },
  active: {
    title: 'Cerrar el bucle percepción–acción',
    controls: [
      c('prior', 'Prior de estado izquierdo', 0.05, 0.95, 0.01, 0.5),
      c('accuracy', 'Fiabilidad del dato', 0.5, 0.95, 0.01, 0.6),
      c('observation', 'Dato: izquierda=0, derecha=1', 0, 1, 1, 1),
    ],
    target:
      'Partiendo de un prior 0.5, observa izquierda con sensor 0.8 y obtén el posterior 0.8. Este campo verifica percepción; Decisión enseña la evaluación prospectiva y la arena permite actuar usando la creencia.',
    principle:
      'La percepción actualiza creencias con datos presentes. La política compara futuros; una acción modifica el siguiente dato.',
    formula: (p) => {
      const post = bayes(
        p.prior,
        p.observation === 0 ? p.accuracy : 1 - p.accuracy,
        p.observation === 0 ? 1 - p.accuracy : p.accuracy,
      );
      return `s=P(izq|o)=${post.toFixed(3)},\\quad F:datos\\ presentes,\\quad G:predicciones\\ futuras`;
    },
    check: (p) =>
      Math.abs(p.prior - 0.5) < 0.01 && Math.abs(p.accuracy - 0.8) < 0.01 && p.observation === 0,
    readout: (p) => [
      {
        label: 'Posterior de izquierda',
        value: bayes(
          p.prior,
          p.observation === 0 ? p.accuracy : 1 - p.accuracy,
          p.observation === 0 ? 1 - p.accuracy : p.accuracy,
        ),
      },
    ],
  },
};
function riemann(p: Params) {
  return p.b ** 3 * (((p.n + 1) * (2 * p.n + 1)) / (6 * p.n * p.n) - 1 / 3);
}
export function lossAfter(p: Params) {
  return 4 * (1 - 2 * p.eta) ** (2 * p.steps) + 4.5 * (1 - 4 * p.eta) ** (2 * p.steps);
}
export const initialParams = (id: WorldId): Params =>
  Object.fromEntries(models[id].controls.map((c) => [c.key, c.initial]));
