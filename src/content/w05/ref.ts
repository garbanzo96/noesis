import type { TopicRef } from '../../game/level/types';

// Reference sheet of Casino Aurora (probabilidad): general definitions and properties per topic.

export const REF_W05: Record<string, TopicRef> = {
  'w5-c1': {
    defs: [
      { label: 'Experimento y resultado', body: 'Un experimento aleatorio produce un resultado que no se conoce de antemano: lanzar dos dados, sacar una carta.' },
      { label: 'Espacio muestral', tex: '\\Omega', body: 'Conjunto de todos los resultados posibles. Dos dados: $\\Omega=\\{(a,b):\\ a,b\\in\\{1,\\dots,6\\}\\}$, con 36 pares ordenados.' },
      { label: 'Evento', tex: 'A\\subseteq\\Omega', body: 'Un conjunto de resultados. «Ocurre $A$» si el resultado cae en $A$.' },
      { label: 'Combinar eventos', tex: 'A\\cap B,\\qquad A\\cup B,\\qquad A^c', body: '«$A$ y $B$», «$A$ o $B$» (al menos uno), «no $A$».' },
      { label: 'Eventos disjuntos', tex: 'A\\cap B=\\varnothing', body: 'No pueden ocurrir a la vez.' },
    ],
    props: [
      { label: 'Principio multiplicativo', tex: '|\\Omega_1\\times\\Omega_2|=|\\Omega_1|\\cdot|\\Omega_2|', body: 'Dos dados: $6\\cdot6=36$ resultados.' },
      { label: 'Complemento', tex: '|A^c|=|\\Omega|-|A|' },
      { label: 'De Morgan', tex: '(A\\cup B)^c=A^c\\cap B^c', body: '«Ni $A$ ni $B$» es lo mismo que «no $A$ y no $B$».' },
    ],
  },
  'w5-c2': {
    defs: [
      { label: 'Probabilidad clásica', tex: 'P(A)=\\frac{|A|}{|\\Omega|}', body: 'Solo si todos los resultados son igual de probables.' },
      { label: 'Frecuencia relativa', tex: 'f_n(A)=\\frac{n_A}{n}', body: '$n_A$: veces que ocurrió $A$ en $n$ repeticiones.' },
    ],
    props: [
      { label: 'Ley de los grandes números', tex: 'f_n(A)\\longrightarrow P(A)\\quad(n\\to\\infty)', body: 'Con pocas repeticiones la frecuencia oscila; con muchas, se estabiliza en la probabilidad.' },
      { label: 'Conteo esperado', tex: 'n\\cdot P(A)', body: 'Número de veces que se espera ver $A$ en $n$ repeticiones.' },
      { label: 'Suma de dos dados', tex: 'P(a+b=s)=\\frac{6-|s-7|}{36},\\quad s=2,\\dots,12' },
    ],
  },
  'w5-c3': {
    defs: [
      { label: 'Reglas básicas', tex: '0\\le P(A)\\le1,\\qquad P(\\Omega)=1,\\qquad P(\\varnothing)=0' },
      { label: 'Aditividad', tex: 'A\\cap B=\\varnothing\\ \\Rightarrow\\ P(A\\cup B)=P(A)+P(B)' },
    ],
    props: [
      { label: 'Complemento', tex: 'P(A^c)=1-P(A)', body: 'Útil para «al menos uno»: $P(\\text{al menos uno})=1-P(\\text{ninguno})$.' },
      { label: 'Inclusión–exclusión', tex: 'P(A\\cup B)=P(A)+P(B)-P(A\\cap B)' },
      { label: 'Ninguno de los dos', tex: 'P(A^c\\cap B^c)=1-P(A\\cup B)' },
      { label: 'Monotonía', tex: 'A\\subseteq B\\ \\Rightarrow\\ P(A)\\le P(B)' },
      { label: 'Cota de la unión', tex: 'P(A\\cup B)\\le P(A)+P(B)' },
    ],
  },
  'w5-c4': {
    defs: [
      { label: 'Probabilidad conjunta', tex: 'P(A,B)=P(A\\cap B)', body: 'Probabilidad de que ocurran las dos cosas. En una tabla de conteos: celda dividida por el total.' },
      { label: 'Marginal', tex: 'P(A)=\\sum_{b}P(A,b)', body: 'Se suma la conjunta sobre todos los valores de la otra variable: una fila o una columna completa.' },
    ],
    props: [
      { label: 'Normalización', tex: '\\sum_i\\sum_j P(i,j)=1' },
      { label: 'Marginales suman 1', tex: '\\sum_i P(i)=1,\\qquad \\sum_j P(j)=1' },
      { label: 'Celda faltante', body: 'Una celda desconocida se recupera restando las otras a su marginal (o al total 1).' },
    ],
  },
  'w5-c5': {
    defs: [
      { label: 'Probabilidad condicional', tex: 'P(A\\mid B)=\\frac{P(A\\cap B)}{P(B)}\\qquad(P(B)>0)', body: 'Probabilidad de $A$ sabiendo que ocurrió $B$: el universo se reduce a $B$.' },
      { label: 'Con conteos', tex: 'P(A\\mid B)=\\frac{|A\\cap B|}{|B|}', body: 'En una tabla: la celda dividida por el total de su fila (o columna) de condición.' },
    ],
    props: [
      { label: 'Regla del producto', tex: 'P(A\\cap B)=P(A\\mid B)\\,P(B)=P(B\\mid A)\\,P(A)' },
      { label: 'Complemento condicional', tex: 'P(A^c\\mid B)=1-P(A\\mid B)' },
      { label: 'No es simétrica', tex: 'P(A\\mid B)\\ne P(B\\mid A)\\quad\\text{(en general)}', body: 'Se relacionan por el teorema de Bayes.' },
    ],
  },
  'w5-c6': {
    defs: [
      { label: 'Independencia', tex: 'P(A\\cap B)=P(A)\\,P(B)', body: 'Equivale a $P(A\\mid B)=P(A)$: saber $B$ no cambia la probabilidad de $A$.' },
      { label: 'Varios eventos independientes', tex: 'P(A_1\\cap\\dots\\cap A_k)=\\prod_{i=1}^{k}P(A_i)' },
    ],
    props: [
      { label: 'Al menos uno en k intentos', tex: 'P(\\text{al menos uno})=1-(1-p)^k' },
      { label: 'Todos en k intentos', tex: 'P(\\text{todos})=p^k' },
      { label: 'Sin memoria', body: 'En ensayos independientes, una racha no cambia la probabilidad del próximo resultado.' },
      { label: 'Disjuntos no es independientes', body: 'Si $A\\cap B=\\varnothing$ y ambos tienen probabilidad positiva, saber $B$ hace imposible $A$: son dependientes.' },
      { label: 'Complementos', body: 'Si $A$ y $B$ son independientes, también lo son $A$ y $B^c$, y $A^c$ y $B^c$.' },
    ],
  },
  'w5-c7': {
    defs: [
      { label: 'Árbol de probabilidad', body: 'Cada nivel es una etapa; cada rama lleva la probabilidad de ese paso **sabiendo** los anteriores.' },
      { label: 'Partición', tex: 'A_1,\\dots,A_k\\ \\text{disjuntos},\\quad \\bigcup_i A_i=\\Omega', body: 'Casos que cubren todo sin solaparse.' },
      { label: 'Sin reposición', body: 'Lo que sale no vuelve: cada extracción cambia las probabilidades de las siguientes.' },
    ],
    props: [
      { label: 'Regla de la cadena', tex: 'P(A_1\\cap A_2\\cap A_3)=P(A_1)\\,P(A_2\\mid A_1)\\,P(A_3\\mid A_1\\cap A_2)', body: 'Un camino del árbol se multiplica.' },
      { label: 'Probabilidad total', tex: 'P(B)=\\sum_i P(A_i)\\,P(B\\mid A_i)', body: 'Se suman los caminos que llevan a $B$.' },
      { label: 'Dos extracciones', tex: 'P(R_1\\cap R_2)=\\frac{r}{N}\\cdot\\frac{r-1}{N-1}', body: '$r$ rojas de $N$ cartas, sin reposición.' },
    ],
  },
  'w5-c8': {
    defs: [
      { label: 'Previa', tex: 'P(H)', body: 'Lo que se cree de la hipótesis antes de observar.' },
      { label: 'Verosimilitud', tex: 'P(x\\mid H)', body: 'Qué tan probable es lo observado si la hipótesis fuera cierta. No es la probabilidad de $H$.' },
      { label: 'Posterior', tex: 'P(H\\mid x)', body: 'Lo que se cree de $H$ después de observar $x$.' },
    ],
    props: [
      { label: 'Teorema de Bayes', tex: 'P(H\\mid x)=\\frac{P(x\\mid H)\\,P(H)}{P(x)}' },
      { label: 'Denominador', tex: 'P(x)=\\sum_j P(x\\mid H_j)\\,P(H_j)', body: 'Probabilidad total sobre todas las hipótesis.' },
      { label: 'Forma de chances', tex: '\\frac{P(H_1\\mid x)}{P(H_2\\mid x)}=\\frac{P(x\\mid H_1)}{P(x\\mid H_2)}\\cdot\\frac{P(H_1)}{P(H_2)}', body: 'Chances posteriores = razón de verosimilitud × chances previas.' },
      { label: 'Evidencia acumulada', tex: 'P(H\\mid x_1,x_2)\\propto P(x_2\\mid H)\\,P(x_1\\mid H)\\,P(H)', body: 'Con observaciones independientes dada $H$, el posterior de una es la previa de la siguiente.' },
      { label: 'Peso de la base', body: 'Si $P(H)$ es muy pequeña, incluso una buena prueba puede dejar $P(H\\mid x)$ baja.' },
    ],
  },
  'w5-c9': {
    defs: [
      { label: 'Variable aleatoria', tex: 'X:\\Omega\\to\\mathbb R', body: 'Asigna un número a cada resultado: una ganancia, un conteo, una suma.' },
      { label: 'Distribución', tex: 'p(x)=P(X=x),\\qquad \\sum_x p(x)=1' },
      { label: 'Esperanza', tex: 'E[X]=\\sum_x x\\,p(x)', body: 'Promedio ponderado de los valores; el promedio a la larga de muchas repeticiones.' },
    ],
    props: [
      { label: 'Linealidad', tex: 'E[aX+b]=a\\,E[X]+b,\\qquad E[X+Y]=E[X]+E[Y]' },
      { label: 'n repeticiones', tex: 'E[X_1+\\dots+X_n]=n\\,E[X]' },
      { label: 'Juego justo', tex: 'E[X]=0', body: 'Ni el jugador ni la casa ganan en promedio.' },
      { label: 'Apuesta a un evento', tex: 'E[X]=g\\,P(A)-c\\,P(A^c)', body: 'Ganancia neta $g$ si ocurre $A$, pérdida $c$ si no.' },
      { label: 'Esperanza de un indicador', tex: 'E[\\mathbf 1_A]=P(A)', body: '$\\mathbf 1_A$ vale 1 si ocurre $A$ y 0 si no.' },
    ],
  },
};
