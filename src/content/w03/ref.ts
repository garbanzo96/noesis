import type { TopicRef } from '../../game/level/types';

// Reference sheet of Cálculo integral: general definitions and properties per topic.

export const REF_W03: Record<string, TopicRef> = {
  'w3-c1': {
    defs: [
      { label: 'Ritmo y acumulación', body: 'Un ritmo (caudal, velocidad, potencia) dice cuánto cambia una cantidad por unidad de tiempo. Acumular el ritmo da la cantidad total.' },
      { label: 'Ritmo constante', tex: 'V=Q\\cdot t', body: 'Área de un rectángulo de alto $Q$ y ancho $t$ bajo la gráfica del ritmo.' },
    ],
    props: [
      { label: 'Por tramos', tex: 'V=\\sum_i Q_i\\,\\Delta t_i' },
      { label: 'Área = acumulado', body: 'La cantidad acumulada entre $a$ y $b$ es el área bajo la gráfica del ritmo entre $a$ y $b$.' },
      { label: 'Unidades', tex: '\\tfrac{\\text{m}^3}{\\text{s}}\\times\\text{s}=\\text{m}^3,\\qquad \\tfrac{\\text{km}}{\\text{h}}\\times\\text{h}=\\text{km}' },
      { label: 'Proporcionalidad', body: 'Multiplicar el ritmo por $c$ en todo instante multiplica lo acumulado por $c$.' },
    ],
  },
  'w3-c2': {
    defs: [
      { label: 'Partición', tex: '\\Delta x=\\frac{b-a}{n},\\qquad x_i=a+i\\,\\Delta x' },
      { label: 'Sumas de Riemann', tex: 'L_n=\\sum_{i=0}^{n-1}f(x_i)\\Delta x,\\qquad R_n=\\sum_{i=1}^{n}f(x_i)\\Delta x' },
      { label: 'Integral definida', tex: '\\int_a^b f(x)\\,dx=\\lim_{n\\to\\infty}\\sum f(x_i)\\,\\Delta x', body: '$a$ y $b$: límites de integración. $f(x)$: integrando. $dx$: indica la variable y el ancho infinitesimal.' },
    ],
    props: [
      { label: 'Cotas', body: 'Si $f$ crece en $[a,b]$: $L_n\\le\\int_a^b f\\le R_n$. Si decrece, al revés.' },
      { label: 'Regla del trapecio', tex: 'T_n=\\frac{L_n+R_n}{2}' },
      { label: 'Punto medio', tex: 'M_n=\\sum_{i=0}^{n-1}f\\!\\left(x_i+\\tfrac{\\Delta x}{2}\\right)\\Delta x' },
      { label: 'Convergencia', body: 'Si $f$ es continua, todas estas sumas se acercan al mismo valor cuando $n\\to\\infty$.' },
    ],
  },
  'w3-c3': {
    defs: [
      { label: 'Área con signo', body: 'Las regiones sobre el eje cuentan positivo y las de abajo, negativo.' },
      { label: 'Valor medio', tex: '\\bar f=\\frac{1}{b-a}\\int_a^b f(x)\\,dx' },
    ],
    props: [
      { label: 'Cambio neto', tex: "\\int_a^b F'(t)\\,dt=F(b)-F(a)", body: 'La integral de un ritmo es el cambio de la cantidad.' },
      { label: 'Aditividad', tex: '\\int_a^c f=\\int_a^b f+\\int_b^c f' },
      { label: 'Linealidad', tex: '\\int(\\alpha f+\\beta g)=\\alpha\\int f+\\beta\\int g' },
      { label: 'Límites', tex: '\\int_a^a f=0,\\qquad \\int_b^a f=-\\int_a^b f' },
      { label: 'Comparación', tex: 'f\\le g\\ \\text{en}\\ [a,b]\\Rightarrow\\int_a^b f\\le\\int_a^b g' },
    ],
  },
  'w3-c4': {
    defs: [
      { label: 'Función de acumulación', tex: 'A(x)=\\int_a^x f(t)\\,dt', body: 'Área con signo bajo $f$ desde $a$ hasta $x$. La letra $t$ es una variable muda.' },
      { label: 'Variable muda', tex: '\\int_a^x f(t)\\,dt=\\int_a^x f(s)\\,ds', body: 'El nombre de la variable de integración no cambia el resultado.' },
    ],
    props: [
      { label: 'Teorema fundamental (I)', tex: "\\frac{d}{dx}\\int_a^x f(t)\\,dt=f(x)", body: 'Si $f$ es continua.' },
      { label: 'Crecimiento', body: '$A$ crece donde $f>0$ y decrece donde $f<0$; sus extremos están donde $f$ cambia de signo.' },
      { label: 'Concavidad', body: "$A''=f'$: $A$ es cóncava hacia arriba donde $f$ crece." },
      { label: 'Con límite variable', tex: "\\frac{d}{dx}\\int_a^{g(x)}f(t)\\,dt=f(g(x))\\,g'(x)", body: 'Regla de la cadena aplicada a la acumulación.' },
    ],
  },
  'w3-c5': {
    defs: [
      { label: 'Primitiva', tex: "F'(x)=f(x)", body: 'Una función cuya derivada es $f$.' },
      { label: 'Integral indefinida', tex: '\\int f(x)\\,dx=F(x)+C', body: 'La familia de todas las primitivas; $C$ es una constante arbitraria.' },
    ],
    props: [
      { label: 'Teorema fundamental (II)', tex: '\\int_a^b f(x)\\,dx=F(b)-F(a)=\\big[F(x)\\big]_a^b' },
      { label: 'Potencias', tex: '\\int x^n\\,dx=\\frac{x^{n+1}}{n+1}+C\\quad(n\\ne-1)' },
      { label: 'Exponencial y logaritmo', tex: '\\int e^x\\,dx=e^x+C,\\qquad \\int\\frac{dx}{x}=\\ln|x|+C' },
      { label: 'Exponencial con constante', tex: '\\int e^{kx}\\,dx=\\frac{e^{kx}}{k}+C' },
      { label: 'Linealidad', tex: '\\int(\\alpha f+\\beta g)\\,dx=\\alpha\\int f\\,dx+\\beta\\int g\\,dx' },
      { label: 'Con valor inicial', tex: "V(t)=V(0)+\\int_0^t V'(s)\\,ds" },
    ],
  },
  'w3-c6': {
    defs: [
      { label: 'Sustitución', tex: "u=g(x),\\qquad du=g'(x)\\,dx" },
      { label: 'Idea', body: 'Es la regla de la cadena leída al revés: el integrando tiene una función de adentro y su derivada multiplicando.' },
    ],
    props: [
      { label: 'Indefinida', tex: "\\int f\\big(g(x)\\big)g'(x)\\,dx=\\int f(u)\\,du" },
      { label: 'Definida', tex: "\\int_a^b f\\big(g(x)\\big)g'(x)\\,dx=\\int_{g(a)}^{g(b)}f(u)\\,du" },
      { label: 'Lineal adentro', tex: '\\int f(ax+b)\\,dx=\\frac1a F(ax+b)+C' },
      { label: 'Decaimiento', tex: '\\int_0^T e^{-kt}\\,dt=\\frac{1-e^{-kT}}{k}' },
      { label: 'Cociente logarítmico', tex: "\\int\\frac{g'(x)}{g(x)}\\,dx=\\ln|g(x)|+C" },
    ],
  },
  'w3-c7': {
    defs: [
      { label: 'Por partes', tex: '\\int u\\,dv=uv-\\int v\\,du', body: 'Viene de integrar la regla del producto $(uv)\'=u\'v+uv\'$.' },
      { label: 'Con límites', tex: '\\int_a^b u\\,dv=\\big[uv\\big]_a^b-\\int_a^b v\\,du' },
    ],
    props: [
      { label: 'Elegir u', body: '$u$: lo que se simplifica al derivar ($\\ln x$, potencias de $x$). $dv$: lo que se integra fácil ($e^x$, potencias).' },
      { label: 'Ejemplos', tex: '\\int xe^x\\,dx=(x-1)e^x+C,\\qquad \\int\\ln x\\,dx=x\\ln x-x+C' },
      { label: 'Aplicar dos veces', body: 'Con $x^2e^x$ se integra por partes dos veces, bajando la potencia en cada paso.' },
    ],
  },
  'w3-c8': {
    defs: [
      { label: 'Intervalo infinito', tex: '\\int_a^\\infty f=\\lim_{b\\to\\infty}\\int_a^b f', body: 'Converge si el límite existe y es finito; si no, diverge.' },
      { label: 'Integrando no acotado', tex: '\\int_0^1 f=\\lim_{\\varepsilon\\to0^+}\\int_\\varepsilon^1 f' },
    ],
    props: [
      { label: 'Criterio p (infinito)', tex: '\\int_1^\\infty\\frac{dx}{x^p}=\\frac{1}{p-1}\\ \\ (p>1),\\qquad \\text{diverge si }p\\le1' },
      { label: 'Criterio p (cerca de 0)', tex: '\\int_0^1\\frac{dx}{x^p}=\\frac{1}{1-p}\\ \\ (p<1),\\qquad \\text{diverge si }p\\ge1' },
      { label: 'Exponencial', tex: '\\int_0^\\infty A\\,e^{-kt}\\,dt=\\frac{A}{k}\\quad(k>0)' },
      { label: 'Tender a 0 no basta', body: 'Que $f(x)\\to0$ es necesario para converger hacia $\\infty$, pero no suficiente: $1/x$.' },
    ],
  },
};
