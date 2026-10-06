import type { TopicRef } from '../../game/level/types';

// Reference sheet of El Puerto (precálculo): general definitions and properties per topic.
// Shown in Resources. Story examples stay in the notebook of each case.

export const REF_W01: Record<string, TopicRef> = {
  'w1-c1': {
    defs: [
      { label: 'Conjunto y pertenencia', tex: 'x\\in A,\\qquad x\\notin A', body: 'Un conjunto es una colección de objetos, sus elementos. $x\\in A$: $x$ pertenece a $A$.' },
      { label: 'Conjunto por comprensión', tex: 'A=\\{x\\in U:\\ P(x)\\}', body: 'Los elementos del universo $U$ que cumplen la condición $P$.' },
      {
        label: 'Intervalos',
        tex: '\\begin{aligned}[a,b]&=\\{x\\in\\mathbb R:\\ a\\le x\\le b\\}\\\\ (a,b)&=\\{x\\in\\mathbb R:\\ a<x<b\\}\\\\ [a,b)&=\\{x\\in\\mathbb R:\\ a\\le x<b\\}\\\\ (-\\infty,b]&=\\{x\\in\\mathbb R:\\ x\\le b\\}\\end{aligned}',
        body: 'Corchete: el extremo se incluye. Paréntesis: no se incluye. Junto a $\\pm\\infty$ siempre va paréntesis.',
      },
      { label: 'Operaciones', tex: 'A\\cap B,\\quad A\\cup B,\\quad A\\setminus B,\\quad A^c', body: '$\\cap$: en ambos. $\\cup$: en al menos uno. $A\\setminus B$: en $A$ y no en $B$. $A^c=U\\setminus A$: lo que no está en $A$.' },
      { label: 'Cardinal', tex: '|A|', body: 'Número de elementos de un conjunto finito.' },
      { label: 'Subconjunto y vacío', tex: 'A\\subseteq B,\\qquad \\varnothing', body: '$A\\subseteq B$: todo elemento de $A$ está en $B$. $\\varnothing$: el conjunto sin elementos.' },
    ],
    props: [
      { label: 'Inclusión–exclusión', tex: '|A\\cup B|=|A|+|B|-|A\\cap B|' },
      { label: 'Diferencia', tex: 'A\\setminus B=A\\cap B^c' },
      { label: 'Leyes de De Morgan', tex: '(A\\cup B)^c=A^c\\cap B^c,\\qquad (A\\cap B)^c=A^c\\cup B^c' },
      { label: 'Intersección de intervalos', tex: '[a,b]\\cap[c,d]=[\\max(a,c),\\ \\min(b,d)]', body: 'Si $\\max(a,c)>\\min(b,d)$, la intersección es vacía.' },
      { label: 'Distributivas', tex: 'A\\cap(B\\cup C)=(A\\cap B)\\cup(A\\cap C)' },
    ],
  },
  'w1-c2': {
    defs: [
      { label: 'Función', tex: 'f:A\\to B,\\qquad x\\mapsto f(x)', body: 'Regla que asigna a **cada** elemento de $A$ **exactamente un** elemento de $B$.' },
      { label: 'Dominio e imagen', tex: '\\mathrm{Dom}(f)=A,\\qquad \\mathrm{Im}(f)=\\{f(x):\\ x\\in A\\}\\subseteq B', body: 'El dominio son las entradas permitidas; la imagen, las salidas que de verdad ocurren.' },
      { label: 'Gráfica', tex: '\\{(x,f(x)):\\ x\\in A\\}', body: 'Cada recta vertical corta la gráfica de una función a lo más una vez.' },
      { label: 'Creciente y decreciente', tex: 'x_1<x_2\\ \\Rightarrow\\ f(x_1)<f(x_2)', body: 'Creciente en un intervalo si cumple esto ahí; decreciente si la desigualdad final se invierte.' },
      { label: 'Máximo y mínimo', tex: 'f(x^*)\\ge f(x)\\quad\\text{para todo }x', body: '$f(x^*)$ es el valor máximo; $x^*$ es dónde se alcanza. Son cosas distintas.' },
      { label: 'Función periódica', tex: 'f(x+T)=f(x)', body: 'La gráfica se repite cada $T$ unidades (período).' },
    ],
    props: [
      { label: 'Evaluar en la gráfica', body: 'Para leer $f(a)$: subir desde $x=a$ hasta la curva y mirar la altura.' },
      { label: 'Desigualdades con la gráfica', tex: '\\{x:\\ f(x)\\ge c\\}', body: 'Son las $x$ donde la gráfica queda sobre la recta horizontal $y=c$. Suele ser una unión de intervalos.' },
      { label: 'Ecuaciones con la gráfica', tex: 'f(x)=c', body: 'Las soluciones son las abscisas de los cortes de la gráfica con $y=c$. Puede haber varias o ninguna.' },
    ],
  },
  'w1-c3': {
    defs: [
      { label: 'Pendiente', tex: 'm=\\frac{\\Delta y}{\\Delta x}=\\frac{y_2-y_1}{x_2-x_1}', body: 'Cuánto cambia $y$ por cada unidad que avanza $x$. En distancia contra tiempo, es la velocidad.' },
      { label: 'Recta', tex: 'y=mx+b', body: '$m$: pendiente. $b$: ordenada en el origen, el valor de $y$ cuando $x=0$.' },
      { label: 'Recta por un punto', tex: 'y-y_1=m\\,(x-x_1)' },
    ],
    props: [
      { label: 'Signo de la pendiente', body: '$m>0$: sube. $m=0$: horizontal (nada cambia). $m<0$: baja.' },
      { label: 'Pendiente constante', body: 'En una recta, cualquier par de puntos da la misma pendiente.' },
      { label: 'Paralelas', tex: 'm_1=m_2', body: 'Misma pendiente, distinta ordenada: nunca se cortan.' },
      { label: 'Intersección de dos rectas', tex: 'm_1x+b_1=m_2x+b_2\\ \\Rightarrow\\ x=\\frac{b_2-b_1}{m_1-m_2}', body: 'El punto común resuelve las dos ecuaciones a la vez.' },
    ],
  },
  'w1-c4': {
    defs: [
      { label: 'Composición', tex: '(g\\circ f)(x)=g\\big(f(x)\\big)', body: 'Primero $f$, después $g$. Se lee de derecha a izquierda.' },
      { label: 'Función inversa', tex: 'f^{-1}(y)=x\\iff f(x)=y', body: 'La función que deshace a $f$. No es $1/f$.' },
      { label: 'Inyectiva', tex: 'f(a)=f(b)\\ \\Rightarrow\\ a=b', body: 'Entradas distintas dan salidas distintas. Solo las inyectivas tienen inversa.' },
    ],
    props: [
      { label: 'El orden importa', tex: 'g\\circ f\\ne f\\circ g\\quad\\text{(en general)}' },
      { label: 'Inversa y composición', tex: 'f^{-1}\\big(f(x)\\big)=x,\\qquad f\\big(f^{-1}(y)\\big)=y' },
      { label: 'Inversa de una cadena', tex: '(g\\circ f)^{-1}=f^{-1}\\circ g^{-1}', body: 'Se deshace primero el último paso.' },
      { label: 'Despejar una función afín', tex: 'y=ax+b\\iff x=\\frac{y-b}{a}\\qquad(a\\ne0)' },
      { label: 'Gráfica de la inversa', body: 'Es el reflejo de la gráfica de $f$ en la recta $y=x$.' },
    ],
  },
  'w1-c5': {
    defs: [
      { label: 'Sumatoria', tex: '\\sum_{i=m}^{n}x_i=x_m+x_{m+1}+\\dots+x_n', body: '$i$ es el índice; $m$ y $n$, los límites, ambos incluidos. Tiene $n-m+1$ términos.' },
      { label: 'Doble índice', tex: 'a_{ij}', body: 'Elemento de la fila $i$ y la columna $j$ de una tabla.' },
      { label: 'Productoria', tex: '\\prod_{k=1}^{n}r_k=r_1\\,r_2\\cdots r_n' },
    ],
    props: [
      { label: 'Sacar constantes', tex: '\\sum_i c\\,x_i=c\\sum_i x_i' },
      { label: 'Separar sumas', tex: '\\sum_i(x_i+y_i)=\\sum_i x_i+\\sum_i y_i' },
      { label: 'Sumar una constante', tex: '\\sum_{i=1}^{n}c=n\\,c' },
      { label: 'Partir el rango', tex: '\\sum_{i=1}^{n}x_i=\\sum_{i=1}^{k}x_i+\\sum_{i=k+1}^{n}x_i' },
      { label: 'Filas y columnas', tex: '\\sum_i\\sum_j a_{ij}=\\sum_j\\sum_i a_{ij}' },
      { label: 'Índice mudo', tex: '\\sum_{i=1}^{n}x_i=\\sum_{k=1}^{n}x_k', body: 'El nombre del índice no cambia el resultado.' },
      { label: 'Suma de Gauss', tex: '\\sum_{i=1}^{n}i=\\frac{n(n+1)}{2}' },
    ],
  },
  'w1-c6': {
    defs: [
      { label: 'Razón', tex: '\\frac{a}{b}', body: 'Cuánto hay de $a$ por cada unidad de $b$.' },
      { label: 'Proporcionalidad directa', tex: 'y=k\\,x', body: 'Duplicar $x$ duplica $y$. $k$ es la constante de proporcionalidad.' },
      { label: 'Normalizar', tex: 'w_i=\\frac{n_i}{\\sum_j n_j}', body: 'Convierte cantidades en fracciones del total.' },
      { label: 'Porcentaje', tex: 'p\\,\\%=\\frac{p}{100}' },
      { label: 'Promedio ponderado', tex: '\\bar x=\\sum_i w_i\\,x_i,\\qquad w_i\\ge0,\\ \\sum_i w_i=1' },
    ],
    props: [
      { label: 'Las fracciones suman 1', tex: '\\sum_i w_i=1' },
      { label: 'Invariancia de escala', tex: '\\frac{c\\,n_i}{\\sum_j c\\,n_j}=\\frac{n_i}{\\sum_j n_j}', body: 'Multiplicar todas las cantidades por lo mismo no cambia las fracciones.' },
      { label: 'Reparto proporcional', tex: 'd_i=w_i\\cdot D', body: 'Cada parte recibe su fracción del total $D$.' },
      { label: 'Promedio simple', tex: 'w_i=\\tfrac1n\\ \\Rightarrow\\ \\bar x=\\tfrac1n\\sum_i x_i' },
      { label: 'Punto de equilibrio', tex: '\\sum_i w_i\\,(x_i-\\bar x)=0', body: 'El promedio ponderado es donde la balanza queda en equilibrio.' },
      { label: 'Variación porcentual', tex: '\\frac{\\text{nuevo}-\\text{inicial}}{\\text{inicial}}\\cdot100\\,\\%' },
    ],
  },
  'w1-c7': {
    defs: [
      { label: 'Potencia', tex: 'b^n=\\underbrace{b\\cdot b\\cdots b}_{n\\ \\text{veces}},\\qquad b^0=1,\\qquad b^{-n}=\\frac1{b^n}' },
      { label: 'Raíz como exponente', tex: 'b^{1/n}=\\sqrt[n]{b},\\qquad b^{m/n}=\\sqrt[n]{b^m}\\quad(b>0)' },
      { label: 'Crecimiento exponencial', tex: 'N(t)=N_0\\,b^{t}', body: '$N_0$: valor inicial. $b$: factor por unidad de tiempo. $b>1$ crece; $0<b<1$ decrece.' },
      { label: 'Número e', tex: 'e=\\lim_{n\\to\\infty}\\left(1+\\tfrac1n\\right)^n\\approx2{,}71828' },
    ],
    props: [
      { label: 'Producto y cociente', tex: 'a^m\\,a^n=a^{m+n},\\qquad \\frac{a^m}{a^n}=a^{m-n}' },
      { label: 'Potencia de potencia', tex: '(a^m)^n=a^{mn},\\qquad (ab)^n=a^n\\,b^n' },
      { label: 'Crecimiento porcentual', tex: 'N(t)=N_0\\,(1+r)^t', body: 'Crecer un $r$ por uno en cada período es multiplicar por $1+r$.' },
      { label: 'Duplicación y vida media', tex: 'N_0\\,2^{t/T_2},\\qquad N_0\\,2^{-t/T_{1/2}}', body: '$T_2$: tiempo de duplicación. $T_{1/2}$: tiempo en que queda la mitad.' },
      { label: 'Lineal contra exponencial', body: 'Lineal suma lo mismo cada período; exponencial multiplica por lo mismo. A la larga, la exponencial supera a cualquier lineal.' },
    ],
  },
  'w1-c8': {
    defs: [
      { label: 'Logaritmo', tex: '\\log_b N=t\\iff b^t=N\\qquad(b>0,\\ b\\ne1,\\ N>0)', body: 'El exponente que lleva $b$ hasta $N$.' },
      { label: 'Bases usuales', tex: '\\log_{10}x,\\qquad \\ln x=\\log_e x,\\qquad \\log_2 x' },
      { label: 'Escala logarítmica', body: 'Distancias iguales representan factores iguales.' },
    ],
    props: [
      { label: 'Inversas', tex: 'b^{\\log_b N}=N,\\qquad \\log_b\\left(b^t\\right)=t' },
      { label: 'Valores especiales', tex: '\\log_b 1=0,\\qquad \\log_b b=1' },
      { label: 'Producto y cociente', tex: '\\log(ab)=\\log a+\\log b,\\qquad \\log\\frac ab=\\log a-\\log b' },
      { label: 'Potencia', tex: '\\log\\left(a^k\\right)=k\\log a' },
      { label: 'Cambio de base', tex: '\\log_b N=\\frac{\\log_c N}{\\log_c b}=\\frac{\\ln N}{\\ln b}' },
      { label: 'Despejar un exponente', tex: 'b^t=N\\iff t=\\frac{\\ln N}{\\ln b}' },
      { label: 'Decibeles', tex: '\\text{dB}=10\\log_{10}\\frac{I}{I_0}', body: '+10 dB multiplica la intensidad por 10; +3 dB, casi por 2.' },
    ],
  },
};
