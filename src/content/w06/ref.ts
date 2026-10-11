import type { TopicRef } from '../../game/level/types';

// Reference sheet of Estadística: general definitions and properties per topic.

export const REF_W06: Record<string, TopicRef> = {
  'w6-c1': {
    defs: [
      { label: 'Variable', body: 'Característica medida en cada individuo. **Cualitativa** (categorías) o **cuantitativa**: discreta (se cuenta) o continua (se mide).', tex: '\\text{cualitativa}\\ \\cdot\\ \\text{discreta}\\ \\cdot\\ \\text{continua}' },
      { label: 'Frecuencias', tex: 'f_i,\\qquad h_i=\\frac{f_i}{n},\\qquad F_i=f_1+\\dots+f_i', body: 'Absoluta, relativa y acumulada de la clase $i$.' },
      { label: 'Histograma', body: 'Barras pegadas sobre clases del mismo ancho, con altura proporcional a $f_i$.', tex: '[a,b):\\ a\\le x<b' },
    ],
    props: [
      { label: 'Suma de frecuencias', tex: '\\sum_i f_i=n,\\qquad \\sum_i h_i=1' },
      { label: 'Formas', body: 'Simétrica, sesgada a la derecha (cola larga a la derecha), sesgada a la izquierda, bimodal (dos grupos).' },
      { label: 'Ancho de clase', body: 'Clases muy anchas esconden la forma; muy angostas muestran ruido.' },
    ],
  },
  'w6-c2': {
    defs: [
      { label: 'Media', tex: '\\bar x=\\frac1n\\sum_{i=1}^n x_i' },
      { label: 'Mediana', body: 'Dato central de los datos ordenados; con $n$ par, el promedio de los dos centrales.', tex: '\\tilde x' },
      { label: 'Moda', body: 'Valor (o categoría) de mayor frecuencia.', tex: '\\text{Mo}' },
    ],
    props: [
      { label: 'Equilibrio', tex: '\\sum_i(x_i-\\bar x)=0', body: 'La media es el punto de equilibrio de los datos.' },
      { label: 'Media ponderada', tex: '\\bar x=\\frac{\\sum f_i\\,x_i}{\\sum f_i}' },
      { label: 'Resistencia', body: 'La mediana no se mueve con valores extremos; la media sí.' },
      { label: 'Asimetría', body: 'Con cola larga a la derecha, en general media > mediana.' },
    ],
  },
  'w6-c3': {
    defs: [
      { label: 'Rango', tex: 'R=x_{\\max}-x_{\\min}' },
      { label: 'Varianza', tex: '\\sigma^2=\\frac1n\\sum(x_i-\\bar x)^2,\\qquad s^2=\\frac{1}{n-1}\\sum(x_i-\\bar x)^2', body: 'Poblacional y muestral.' },
      { label: 'Desviación estándar', tex: '\\sigma=\\sqrt{\\sigma^2},\\qquad s=\\sqrt{s^2}' },
    ],
    props: [
      { label: 'Desplazar', tex: '\\sigma_{x+c}=\\sigma_x' },
      { label: 'Escalar', tex: '\\sigma_{kx}=|k|\\,\\sigma_x,\\qquad \\sigma^2_{kx}=k^2\\sigma^2_x' },
      { label: 'Fórmula alternativa', tex: '\\sigma^2=\\overline{x^2}-\\bar x^2' },
      { label: 'Unidades', body: 'La varianza está en unidades al cuadrado; la desviación estándar, en las de los datos.' },
    ],
  },
  'w6-c4': {
    defs: [
      { label: 'Puntaje z', tex: 'z=\\frac{x-\\mu}{\\sigma}' },
      { label: 'Distribución normal', tex: 'X\\sim N(\\mu,\\sigma^2)', body: 'Campana simétrica centrada en $\\mu$; el área bajo la curva es probabilidad.' },
      { label: 'Normal estándar', tex: 'Z\\sim N(0,1),\\qquad \\Phi(z)=P(Z\\le z)' },
    ],
    props: [
      { label: 'Regla 68–95–99,7', tex: 'P(|Z|<1)\\approx0{,}68,\\ \\ P(|Z|<2)\\approx0{,}95,\\ \\ P(|Z|<3)\\approx0{,}997' },
      { label: 'Estandarizar', tex: 'P(X\\le x)=\\Phi\\!\\left(\\frac{x-\\mu}{\\sigma}\\right)' },
      { label: 'Simetría', tex: '\\Phi(-z)=1-\\Phi(z)' },
      { label: 'Despejar', tex: 'x=\\mu+z\\,\\sigma' },
    ],
  },
  'w6-c5': {
    defs: [
      { label: 'Parámetro y estadístico', body: 'Un parámetro describe a la población ($\\mu$, $\\sigma$, $p$); un estadístico se calcula con la muestra ($\\bar x$, $s$, $\\hat p$).', tex: '\\mu\\ \\text{vs}\\ \\bar x' },
      { label: 'Error estándar', tex: '\\text{EE}(\\bar x)=\\frac{\\sigma}{\\sqrt n}' },
    ],
    props: [
      { label: 'Centro de la media muestral', tex: 'E[\\bar X]=\\mu' },
      { label: 'Teorema central del límite', tex: '\\bar X\\approx N\\!\\left(\\mu,\\frac{\\sigma^2}{n}\\right)', body: 'Para $n$ grande (en la práctica, $n\\gtrsim30$), aunque la población no sea normal.' },
      { label: 'z de una media', tex: 'z=\\frac{\\bar x-\\mu}{\\sigma/\\sqrt n}' },
      { label: 'Tamaño y precisión', body: 'Cuadruplicar $n$ reduce el error estándar a la mitad.' },
    ],
  },
  'w6-c6': {
    defs: [
      { label: 'Intervalo de confianza', tex: '\\bar x\\pm z^*\\frac{\\sigma}{\\sqrt n}', body: 'Con $z^*=1{,}645$ (90 %), $1{,}96$ (95 %), $2{,}576$ (99 %).' },
      { label: 'Margen de error', tex: 'E=z^*\\frac{\\sigma}{\\sqrt n}' },
    ],
    props: [
      { label: 'Interpretación', body: 'El nivel de confianza es la proporción de intervalos que, repitiendo el muestreo, contendrían a $\\mu$.' },
      { label: 'Tamaño de muestra', tex: 'n=\\left(\\frac{z^*\\sigma}{E}\\right)^2\\ \\text{(redondeado hacia arriba)}' },
      { label: 'σ desconocida', tex: '\\bar x\\pm t^*\\frac{s}{\\sqrt n}' },
      { label: 'Ancho', body: 'Más confianza o más dispersión ensanchan el intervalo; más datos lo angostan.' },
    ],
  },
  'w6-c7': {
    defs: [
      { label: 'Hipótesis', tex: 'H_0:\\ p=p_0\\qquad H_1:\\ p<p_0\\ (\\text{o}\\ >,\\ \\neq)' },
      { label: 'Estadístico (proporción)', tex: 'z=\\frac{\\hat p-p_0}{\\sqrt{p_0(1-p_0)/n}}' },
      { label: 'Valor p', body: 'Probabilidad, suponiendo $H_0$ cierta, de un resultado al menos tan extremo como el observado.', tex: 'P(Z\\le z_{\\text{obs}}\\mid H_0)' },
    ],
    props: [
      { label: 'Decisión', tex: '\\text{valor }p<\\alpha\\Rightarrow\\text{rechazar }H_0' },
      { label: 'Errores', body: 'Tipo I: rechazar $H_0$ verdadera (probabilidad $\\alpha$). Tipo II: no rechazar $H_0$ falsa.' },
      { label: 'Valores críticos (una cola)', tex: 'z_{0{,}05}=-1{,}645,\\qquad z_{0{,}01}=-2{,}326' },
      { label: 'Cuidado', body: 'No rechazar $H_0$ no demuestra que sea cierta.' },
    ],
  },
  'w6-c8': {
    defs: [
      { label: 'Correlación', tex: 'r=\\frac{1}{n-1}\\sum\\frac{x_i-\\bar x}{s_x}\\cdot\\frac{y_i-\\bar y}{s_y}', body: '$-1\\le r\\le1$.' },
      { label: 'Recta de regresión', tex: '\\hat y=a+bx,\\qquad b=r\\frac{s_y}{s_x},\\quad a=\\bar y-b\\bar x' },
      { label: 'Residuo', tex: 'e_i=y_i-\\hat y_i' },
    ],
    props: [
      { label: 'Mínimos cuadrados', tex: '\\min\\sum_i e_i^2,\\qquad \\sum_i e_i=0' },
      { label: 'Punto de medias', body: 'La recta pasa por $(\\bar x,\\bar y)$.' },
      { label: 'Coeficiente de determinación', tex: 'r^2', body: 'Fracción de la variación de $y$ explicada por la recta.' },
      { label: 'Causalidad', body: 'Una correlación alta no implica que $x$ cause $y$.' },
    ],
  },
};
