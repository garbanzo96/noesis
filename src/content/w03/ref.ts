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
};
