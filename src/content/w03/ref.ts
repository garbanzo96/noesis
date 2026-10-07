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
};
