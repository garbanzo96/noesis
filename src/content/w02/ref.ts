import type { TopicRef } from '../../game/level/types';

// Reference sheet of La Planta (cálculo diferencial): general definitions and properties per topic.

export const REF_W02: Record<string, TopicRef> = {
  'w2-c1': {
    defs: [
      { label: 'Límite', tex: '\\lim_{x\\to a}f(x)=L', body: '$f(x)$ queda tan cerca de $L$ como se quiera si $x$ está suficientemente cerca de $a$, con $x\\ne a$. No depende de $f(a)$.' },
      { label: 'Límites laterales', tex: '\\lim_{x\\to a^-}f(x),\\qquad \\lim_{x\\to a^+}f(x)', body: 'Acercándose solo por valores menores ($^-$) o mayores ($^+$) que $a$.' },
      { label: 'Continuidad en un punto', tex: '\\lim_{x\\to a}f(x)=f(a)', body: 'Exige que $f(a)$ exista, que el límite exista y que coincidan.' },
      { label: 'Límite al infinito', tex: '\\lim_{x\\to\\infty}f(x)=L', body: '$f(x)$ se acerca a $L$ cuando $x$ crece sin cota. La recta $y=L$ es una asíntota horizontal.' },
    ],
    props: [
      { label: 'Existencia', tex: '\\lim_{x\\to a}f(x)=L\\iff \\lim_{x\\to a^-}f(x)=\\lim_{x\\to a^+}f(x)=L' },
      { label: 'Álgebra de límites', tex: '\\lim(f\\pm g)=\\lim f\\pm\\lim g,\\quad \\lim(fg)=\\lim f\\cdot\\lim g,\\quad \\lim\\frac fg=\\frac{\\lim f}{\\lim g}', body: 'Si los límites existen (y el del denominador no es 0).' },
      { label: 'Funciones continuas', body: 'Polinomios, $e^x$, $\\sin x$ y $\\cos x$ son continuas en todo $\\mathbb R$; $\\ln x$ en $x>0$; un cociente, donde el denominador no se anula. Ahí el límite se calcula reemplazando.' },
      { label: 'Formas 0/0', tex: '\\frac{x^2-a^2}{x-a}=x+a\\quad(x\\ne a)', body: 'Se factoriza y se cancela el factor que anula; luego se reemplaza.' },
      { label: 'Cocientes al infinito', tex: '\\lim_{x\\to\\infty}\\frac{px+q}{rx+s}=\\frac pr', body: 'Se divide por la mayor potencia de $x$.' },
      { label: 'Exponencial decreciente', tex: '\\lim_{x\\to\\infty}e^{-x}=0' },
    ],
  },
  'w2-c2': {
    defs: [
      { label: 'Razón de cambio media', tex: '\\frac{\\Delta f}{\\Delta x}=\\frac{f(b)-f(a)}{b-a}', body: 'Pendiente de la secante entre $(a,f(a))$ y $(b,f(b))$.' },
      { label: 'Derivada en un punto', tex: "f'(a)=\\lim_{h\\to0}\\frac{f(a+h)-f(a)}{h}", body: 'Ritmo de cambio instantáneo: pendiente de la recta tangente en $a$. Existe si el límite existe.' },
      { label: 'Recta tangente', tex: "y=f(a)+f'(a)\\,(x-a)" },
      { label: 'Notaciones', tex: "f'(x),\\qquad \\frac{df}{dx},\\qquad \\frac{d}{dx}f(x),\\qquad \\dot x(t)" },
    ],
    props: [
      { label: 'Unidades', body: "Las unidades de $f'$ son las de $f$ divididas por las de $x$: MWh por hora = MW; metros por segundo; etc." },
      { label: 'Linealidad local', body: 'Cerca de $a$, una función derivable es casi igual a su tangente.' },
      { label: 'Derivable implica continua', body: 'Si $f\'(a)$ existe, $f$ es continua en $a$. Al revés no: $|x|$ es continua en 0 pero tiene una esquina.' },
      { label: 'Recta', tex: "f(x)=mx+b\\ \\Rightarrow\\ f'(x)=m", body: 'Una recta tiene la misma pendiente en todas partes.' },
      { label: 'Cuadrado', tex: "f(x)=x^2\\ \\Rightarrow\\ \\frac{(x+h)^2-x^2}{h}=2x+h\\ \\to\\ 2x" },
    ],
  },
  'w2-c3': {
    defs: [
      { label: 'Función derivada', tex: "f':\\ x\\mapsto f'(x)", body: 'A cada $x$ le asigna la pendiente de $f$ en $x$.' },
      { label: 'Punto crítico', tex: "f'(c)=0", body: 'La tangente es horizontal (o $f\'$ no existe). Candidatos a máximo o mínimo.' },
      { label: 'Segunda derivada', tex: "f''=(f')'", body: 'Mide cómo cambia la pendiente.' },
      { label: 'Concavidad e inflexión', body: "$f''>0$: cóncava hacia arriba (las tangentes quedan bajo la curva). $f''<0$: hacia abajo. Inflexión: donde $f''$ cambia de signo." },
    ],
    props: [
      { label: 'Signo y monotonía', tex: "f'>0\\ \\text{en }I\\Rightarrow f\\ \\text{crece en }I,\\qquad f'<0\\Rightarrow f\\ \\text{decrece}" },
      { label: 'Extremos de la derivada', body: "En una inflexión, $f'$ alcanza un máximo o mínimo local: ahí $f$ cambia más rápido." },
      { label: 'Leer la derivada en la gráfica', body: "Tangente horizontal → $f'=0$ (cruza el eje). Tramo que sube → $f'$ sobre el eje. Tramo recto → $f'$ constante." },
      { label: 'Altura y pendiente', body: "El valor de $f$ y el de $f'$ son independientes: $f$ puede ser grande con $f'$ pequeña, y al revés." },
    ],
  },
  'w2-c4': {
    defs: [
      { label: 'Notación de Leibniz', tex: "\\frac{dy}{dx}=f'(x)", body: 'Cambio de $y$ por cada pequeño cambio de $x$.' },
      { label: 'Diferencial', tex: "dy=f'(x)\\,dx", body: 'Cambio aproximado de $y$ cuando $x$ cambia en $dx$.' },
    ],
    props: [
      { label: 'Constante', tex: "\\frac{d}{dx}c=0" },
      { label: 'Potencia', tex: '\\frac{d}{dx}x^n=n\\,x^{n-1}\\qquad(n\\in\\mathbb R)' },
      { label: 'Casos frecuentes', tex: '\\frac{d}{dx}\\frac1x=-\\frac1{x^2},\\qquad \\frac{d}{dx}\\sqrt x=\\frac1{2\\sqrt x}' },
      { label: 'Linealidad', tex: "(a\\,f+b\\,g)'=a\\,f'+b\\,g'" },
      { label: 'Polinomios', tex: "\\frac{d}{dx}\\sum_{k=0}^{n}a_kx^k=\\sum_{k=1}^{n}k\\,a_kx^{k-1}" },
      { label: 'Recta tangente', tex: "y=f(x_0)+f'(x_0)\\,(x-x_0)", body: 'Pendiente $m=f\'(x_0)$; ordenada $b=f(x_0)-m\\,x_0$.' },
    ],
  },
  'w2-c5': {
    defs: [
      { label: 'Producto de funciones', tex: '(f\\,g)(x)=f(x)\\,g(x)' },
      { label: 'Cociente de funciones', tex: '\\left(\\frac fg\\right)(x)=\\frac{f(x)}{g(x)}\\qquad(g(x)\\ne0)' },
    ],
    props: [
      { label: 'Regla del producto', tex: "(f\\,g)'=f'\\,g+f\\,g'" },
      { label: 'Regla del cociente', tex: "\\left(\\frac fg\\right)'=\\frac{f'\\,g-f\\,g'}{g^2}" },
      { label: 'Recíproco', tex: "\\left(\\frac1g\\right)'=-\\frac{g'}{g^2}" },
      { label: 'Producto de tres', tex: "(fgh)'=f'gh+fg'h+fgh'" },
      { label: 'Tasas relativas', tex: "\\frac{(fg)'}{fg}=\\frac{f'}{f}+\\frac{g'}{g},\\qquad \\frac{(f/g)'}{f/g}=\\frac{f'}{f}-\\frac{g'}{g}", body: 'Los porcentajes de cambio se suman en un producto y se restan en un cociente.' },
    ],
  },
  'w2-c6': {
    defs: [
      { label: 'Composición', tex: '(f\\circ g)(x)=f\\big(g(x)\\big)', body: 'Primero $g$ (adentro), después $f$ (afuera).' },
      { label: 'Razones relacionadas', body: 'Si varias cantidades dependen del tiempo y están ligadas por una fórmula, al derivar la fórmula respecto de $t$ se relacionan sus ritmos.' },
    ],
    props: [
      { label: 'Regla de la cadena', tex: "(f\\circ g)'(x)=f'\\big(g(x)\\big)\\,g'(x)" },
      { label: 'Forma de Leibniz', tex: '\\frac{dy}{dx}=\\frac{dy}{du}\\cdot\\frac{du}{dx}' },
      { label: 'Potencia de una función', tex: "\\frac{d}{dx}\\big(u(x)\\big)^n=n\\,u^{n-1}\\,u'" },
      { label: 'Raíz de una función', tex: "\\frac{d}{dx}\\sqrt{u(x)}=\\frac{u'}{2\\sqrt u}" },
      { label: 'Engranajes', body: 'En una cadena de etapas, la razón total es el producto de las razones de cada etapa.' },
      { label: 'Ejemplos de razones', tex: '\\frac{d}{dt}\\pi r^2=2\\pi r\\,\\frac{dr}{dt},\\qquad \\frac{d}{dt}\\tfrac43\\pi r^3=4\\pi r^2\\,\\frac{dr}{dt}' },
    ],
  },
  'w2-c7': {
    defs: [
      { label: 'Exponencial natural', tex: 'e^x,\\qquad e\\approx2{,}71828', body: 'La única exponencial cuya pendiente es igual a su altura.' },
      { label: 'Logaritmo natural', tex: '\\ln x=\\log_e x\\qquad(x>0)' },
      { label: 'Ley de enfriamiento de Newton', tex: "T'=-k\\,(T-T_a),\\qquad T(t)=T_a+(T_0-T_a)\\,e^{-kt}" },
    ],
    props: [
      { label: 'Exponenciales', tex: "\\left(e^x\\right)'=e^x,\\qquad \\left(e^{kx}\\right)'=k\\,e^{kx},\\qquad \\left(b^x\\right)'=\\ln b\\cdot b^x" },
      { label: 'Logaritmos', tex: "\\left(\\ln x\\right)'=\\frac1x,\\qquad \\left(\\log_b x\\right)'=\\frac{1}{x\\ln b}" },
      { label: 'Con la cadena', tex: "\\left(e^{u}\\right)'=u'\\,e^{u},\\qquad \\left(\\ln u\\right)'=\\frac{u'}{u}" },
      { label: 'Crecimiento proporcional', tex: "y'=k\\,y\\iff y=y_0\\,e^{kx}", body: 'Si el ritmo es proporcional a la cantidad, la cantidad es exponencial.' },
      { label: 'Derivada logarítmica', tex: "\\frac{y'}{y}=(\\ln y)'", body: 'Ritmo relativo de cambio.' },
    ],
  },
  'w2-c8': {
    defs: [
      { label: 'Máximo y mínimo local', body: '$f(c)$ es máximo local si $f(c)\\ge f(x)$ para los $x$ cercanos a $c$; mínimo local, al revés.' },
      { label: 'Máximo y mínimo absoluto', body: 'El mayor (o menor) valor de $f$ en todo el dominio considerado.' },
      { label: 'Punto crítico', tex: "f'(c)=0\\quad\\text{o}\\quad f'(c)\\ \\text{no existe}" },
    ],
    props: [
      { label: 'Fermat', body: "Si $f$ tiene un extremo local en un punto interior $c$ y es derivable ahí, entonces $f'(c)=0$." },
      { label: 'Primera derivada', body: "Si $f'$ pasa de $+$ a $-$ en $c$: máximo local. De $-$ a $+$: mínimo local. Si no cambia de signo: no es extremo." },
      { label: 'Segunda derivada', tex: "f'(c)=0:\\quad f''(c)<0\\Rightarrow\\text{máx.},\\qquad f''(c)>0\\Rightarrow\\text{mín.}", body: 'Si $f\'\'(c)=0$ la prueba no decide.' },
      { label: 'Intervalo cerrado', body: 'Una función continua en $[a,b]$ alcanza máximo y mínimo. Se comparan los puntos críticos interiores con $f(a)$ y $f(b)$.' },
      { label: 'Receta para modelar', body: '1) Nombrar la variable. 2) Escribir la cantidad a optimizar como función de una sola variable. 3) Derivar e igualar a 0. 4) Comprobar que es máximo o mínimo y revisar los bordes.' },
      { label: 'Resultados útiles', tex: 'a\\,x-b\\,x^2\\ \\text{máx. en}\\ x=\\frac{a}{2b},\\qquad a\\,q+\\frac bq\\ \\text{mín. en}\\ q=\\sqrt{\\frac ba}' },
    ],
  },
  'w2-c9': {
    defs: [
      { label: 'Linealización', tex: "L(x)=f(a)+f'(a)\\,(x-a)", body: 'La tangente en $a$ usada como aproximación de $f$ cerca de $a$.' },
      { label: 'Diferencial', tex: "dy=f'(x)\\,dx", body: 'Cambio aproximado de $y$ para un cambio pequeño $dx$.' },
      { label: 'Método de Newton', tex: "x_{n+1}=x_n-\\frac{g(x_n)}{g'(x_n)}", body: 'Iteración para resolver $g(x)=0$ siguiendo tangentes.' },
    ],
    props: [
      { label: 'Aproximación lineal', tex: "f(a+h)\\approx f(a)+f'(a)\\,h" },
      { label: 'Tamaño del error', body: "Para $f$ con segunda derivada, el error de la aproximación lineal es del orden de $h^2$: duplicar $h$ cuadruplica el error, más o menos." },
      { label: 'Aproximaciones clásicas', tex: '\\sqrt{a^2+h}\\approx a+\\frac{h}{2a},\\qquad (1+h)^n\\approx1+nh,\\qquad e^h\\approx1+h,\\qquad \\ln(1+h)\\approx h' },
      { label: 'Propagación de errores', tex: "\\Delta y\\approx f'(x)\\,\\Delta x,\\qquad \\frac{\\Delta y}{y}\\approx n\\,\\frac{\\Delta x}{x}\\ \\ \\text{si } y=x^n" },
      { label: 'Newton para raíces', tex: 'x_{n+1}=\\frac12\\left(x_n+\\frac{N}{x_n}\\right)', body: 'Es Newton aplicado a $x^2-N$; converge muy rápido a $\\sqrt N$.' },
    ],
  },
};
