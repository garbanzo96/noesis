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
};
