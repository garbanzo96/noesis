import type { TopicRef } from '../../game/level/types';
export const REF_W09: Record<string, TopicRef> = {
  'w9-c1': {
    defs: [
      {
        label: 'Ecuación diferencial de primer orden',
        tex: "y'=f(t,y)",
        body: 'Asigna una pendiente a cada tiempo y estado del dominio.',
      },
      {
        label: 'Solución',
        tex: "y(t)=\\varphi(t),\\quad\\varphi'(t)=f(t,\\varphi(t))",
        body: 'Función diferenciable cuya pendiente cumple la regla en cada punto de su recorrido.',
      },
      {
        label: 'Condición inicial',
        tex: 'y(t_0)=y_0',
        body: 'Fija el estado en el tiempo de origen.',
      },
    ],
    props: [
      {
        label: 'Familia del depósito',
        tex: "y'=2t\\Rightarrow y=C+t^2",
        body: 'Cada constante desplaza la curva sin cambiar las pendientes.',
      },
      {
        label: 'Inicio y pendiente',
        tex: "\\begin{aligned}y(0)&=C\\\\y'(t)&=2t\\end{aligned}",
        body: 'Comprueba ambas condiciones. El nivel se mide en cm; la pendiente, en cm/min.',
      },
      {
        label: 'Campo de direcciones',
        body: 'Los segmentos apuntan hacia tiempos crecientes y muestran la inclinación local de una solución. Su longitud visual no representa un avance fijo del estado.',
      },
    ],
  },
  'w9-c2': {
    defs: [
      {
        label: 'Tasa proporcional constante',
        tex: "y'=ky",
        body: 'k tiene unidades de tiempo inverso. Su signo decide crecimiento o decaimiento para un nivel positivo.',
      },
      {
        label: 'Vida media',
        tex: 'y(t+T_{1/2})=\\frac{y(t)}2',
        body: 'Tiempo para dividir por dos un nivel que decae exponencialmente.',
      },
    ],
    props: [
      {
        label: 'Solución exponencial',
        tex: 'y(t)=y_0e^{k(t-t_0)}',
        body: 'Usa el tiempo transcurrido desde el dato inicial y conserva y(t₀) = y₀.',
      },
      {
        label: 'Vida media para k negativo',
        tex: 'T_{1/2}=\\frac{\\ln2}{|k|},\\quad k<0',
        body: 'No depende del nivel inicial y siempre es positiva.',
      },
      {
        label: 'Tasa de duplicación',
        tex: 'e^{(\\ln2)t}=2^t',
        body: 'Si k = ln 2 por hora, cada hora duplica el nivel.',
      },
      {
        label: 'Mitades sucesivas',
        tex: 'y(nT_{1/2})=y_0\\,2^{-n}',
        body: 'Con t₀ = 0, n mitades requieren n intervalos de vida media.',
      },
    ],
  },
  'w9-c3': {
    defs: [
      {
        label: 'Paso temporal',
        tex: 'h=t_{n+1}-t_n>0',
        body: 'Duración de cada avance del reloj de cálculo.',
      },
      {
        label: 'Aproximación de Euler',
        tex: 'y^E_{n+1}=y^E_n+h f(t_n,y^E_n)',
        body: 'Usa la pendiente del nodo actual para aproximar el siguiente estado.',
      },
      {
        label: 'Error final absoluto',
        tex: 'E_h=|y(t_f)-y^E(t_f)|',
        body: 'Compara referencia y aproximación en el mismo tiempo final.',
      },
    ],
    props: [
      {
        label: 'Recalcular en cada nodo',
        tex: '\\begin{aligned}t_{n+1}&=t_n+h\\\\\\Delta y_n&=hf(t_n,y^E_n)\\end{aligned}',
        body: 'El nuevo nivel pasa a ser la entrada del siguiente cálculo de pendiente.',
      },
      {
        label: 'Banco exponencial',
        tex: "y'=y,\\quad y^E_N=y_0(1+h)^N",
        body: 'Con t₀ = 0 y horizonte 1, N = 1/h debe ser entero.',
      },
      {
        label: 'Comparación del banco',
        tex: '\\begin{aligned}y^E_{h=1}(1)&=2y_0\\\\y^E_{h=1/2}(1)&=\\tfrac94y_0\\\\y(1)&=y_0e\\end{aligned}',
        body: 'Para y₀ positivo, el paso 1/2 tiene menor error final en este banco.',
      },
      {
        label: 'Alcance del método',
        body: 'Un paso más corto suele reducir el error para reglas suaves dentro de un rango estable. Otras ecuaciones requieren revisar la estabilidad del paso.',
      },
    ],
  },
};
