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
};
