import type { TopicRef } from '../../game/level/types';

// Reference sheet of Álgebra lineal (plano): general definitions and properties per topic.

export const REF_W04: Record<string, TopicRef> = {
  'w4-c1': {
    defs: [
      { label: 'Vector', tex: '\\vec v=\\begin{pmatrix}v_1\\\\v_2\\end{pmatrix}=(v_1,v_2)', body: 'Flecha con tamaño y dirección, sin posición fija. $v_1$, $v_2$: sus componentes.' },
      { label: 'Norma', tex: '\\|\\vec v\\|=\\sqrt{v_1^2+v_2^2}', body: 'Longitud del vector (Pitágoras).' },
      { label: 'Vector entre puntos', tex: '\\overrightarrow{PQ}=Q-P' },
    ],
    props: [
      { label: 'Suma', tex: '\\vec u+\\vec v=(u_1+v_1,\\ u_2+v_2)', body: 'Punta con cola; es conmutativa y asociativa.' },
      { label: 'Escalar por vector', tex: 'k\\vec v=(kv_1,\\ kv_2)', body: 'Estira $|k|$ veces; si $k<0$ invierte el sentido.' },
      { label: 'Norma de un múltiplo', tex: '\\|k\\vec v\\|=|k|\\,\\|\\vec v\\|' },
      { label: 'Resta', tex: '\\vec u-\\vec v=\\vec u+(-1)\\vec v' },
    ],
  },
  'w4-c2': {
    defs: [
      { label: 'Combinación lineal', tex: 'a\\vec u+b\\vec v,\\quad a,b\\in\\mathbb R' },
      { label: 'Espacio generado', tex: '\\operatorname{gen}\\{\\vec u,\\vec v\\}=\\{a\\vec u+b\\vec v\\}' },
      { label: 'Independencia lineal', body: '$\\vec u,\\vec v$ son independientes si ninguno es múltiplo del otro: $a\\vec u+b\\vec v=\\vec 0$ solo con $a=b=0$.', tex: 'a\\vec u+b\\vec v=\\vec 0\\Rightarrow a=b=0' },
      { label: 'Base', body: 'Dos vectores independientes del plano. Cada vector se escribe de una única forma $a\\vec u+b\\vec v$; $(a,b)$ son sus coordenadas.', tex: '[\\vec w]_{\\{\\vec u,\\vec v\\}}=(a,b)' },
    ],
    props: [
      { label: 'Paralelos', body: 'Si $\\vec v=k\\vec u$, generan solo la recta de $\\vec u$.' },
      { label: 'Independientes', body: 'Dos vectores independientes del plano generan todo el plano.' },
      { label: 'Base usual', tex: '\\vec e_1=(1,0),\\ \\vec e_2=(0,1),\\quad (x,y)=x\\vec e_1+y\\vec e_2' },
      { label: 'Hallar coordenadas', body: 'Igualar componentes de $a\\vec u+b\\vec v=\\vec w$: un sistema de dos ecuaciones.' },
    ],
  },
  'w4-c3': {
    defs: [
      { label: 'Producto punto', tex: '\\vec u\\cdot\\vec v=u_1v_1+u_2v_2', body: 'Es un número.' },
      { label: 'Ángulo entre vectores', tex: '\\cos\\theta=\\frac{\\vec u\\cdot\\vec v}{\\|\\vec u\\|\\,\\|\\vec v\\|}' },
      { label: 'Componente y proyección', tex: '\\operatorname{comp}_{\\vec u}\\vec v=\\frac{\\vec u\\cdot\\vec v}{\\|\\vec u\\|},\\quad \\operatorname{proy}_{\\vec u}\\vec v=\\frac{\\vec u\\cdot\\vec v}{\\|\\vec u\\|^2}\\vec u' },
    ],
    props: [
      { label: 'Forma geométrica', tex: '\\vec u\\cdot\\vec v=\\|\\vec u\\|\\,\\|\\vec v\\|\\cos\\theta' },
      { label: 'Perpendicularidad', tex: '\\vec u\\perp\\vec v\\iff\\vec u\\cdot\\vec v=0' },
      { label: 'Norma', tex: '\\vec v\\cdot\\vec v=\\|\\vec v\\|^2' },
      { label: 'Simetría y linealidad', tex: '\\vec u\\cdot\\vec v=\\vec v\\cdot\\vec u,\\quad \\vec u\\cdot(a\\vec v+b\\vec w)=a\\,\\vec u\\cdot\\vec v+b\\,\\vec u\\cdot\\vec w' },
      { label: 'Signo', body: 'Positivo: ángulo agudo. Cero: recto. Negativo: obtuso.' },
    ],
  },
  'w4-c4': {
    defs: [
      { label: 'Transformación lineal', tex: 'T(\\vec u+\\vec v)=T\\vec u+T\\vec v,\\quad T(k\\vec v)=kT\\vec v' },
      { label: 'Matriz', tex: 'A=\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}=\\big(A\\hat\\imath\\ \\ A\\hat\\jmath\\big)', body: 'Sus columnas son las imágenes de $\\hat\\imath=(1,0)$ y $\\hat\\jmath=(0,1)$.' },
      { label: 'Matriz por vector', tex: '\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}\\begin{pmatrix}x\\\\y\\end{pmatrix}=\\begin{pmatrix}ax+by\\\\cx+dy\\end{pmatrix}' },
    ],
    props: [
      { label: 'Por columnas', tex: 'A\\begin{pmatrix}x\\\\y\\end{pmatrix}=x\\,(A\\hat\\imath)+y\\,(A\\hat\\jmath)' },
      { label: 'Origen fijo', tex: 'A\\vec 0=\\vec 0' },
      { label: 'Identidad', tex: 'I=\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix},\\quad I\\vec v=\\vec v' },
      { label: 'Ejemplos', tex: '\\text{giro }90^\\circ\\!:\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix},\\ \\text{cizalle}\\!:\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix},\\ \\text{reflejo}\\!:\\begin{pmatrix}1&0\\\\0&-1\\end{pmatrix}' },
    ],
  },
  'w4-c5': {
    defs: [
      { label: 'Ecuación lineal', tex: 'a_1x_1+a_2x_2+\\dots+a_nx_n=b', body: 'Con dos incógnitas, sus soluciones forman una recta.' },
      { label: 'Forma matricial', tex: 'A\\vec x=\\vec b', body: '$A$: coeficientes; $\\vec x$: incógnitas; $\\vec b$: términos libres.' },
      { label: 'Matriz ampliada', tex: '(A\\,|\\,\\vec b)' },
    ],
    props: [
      { label: 'Número de soluciones', body: 'Una, ninguna o infinitas. En el plano: rectas que se cortan, paralelas distintas o coincidentes.' },
      { label: 'Operaciones de fila', body: 'Intercambiar filas, multiplicar una fila por un número $\\neq0$ y sumar a una fila un múltiplo de otra. No cambian las soluciones.' },
      { label: 'Gauss', body: 'Escalonar con operaciones de fila y resolver de abajo hacia arriba (sustitución regresiva).' },
      { label: 'Solución única', tex: '\\det A\\neq0\\iff A\\vec x=\\vec b\\ \\text{tiene solución única}' },
    ],
  },
  'w4-c6': {
    defs: [
      { label: 'Producto de matrices', tex: '(AB)_{ij}=\\sum_k A_{ik}B_{kj}', body: 'Fila $i$ de $A$ por columna $j$ de $B$.' },
      { label: 'Composición', tex: '(AB)\\vec v=A(B\\vec v)', body: 'Primero actúa $B$, después $A$.' },
    ],
    props: [
      { label: 'Por columnas', tex: 'AB=\\big(A\\vec b_1\\ \\ A\\vec b_2\\big)' },
      { label: 'No conmutativo', tex: 'AB\\neq BA\\ \\text{en general}' },
      { label: 'Asociativo', tex: '(AB)C=A(BC)' },
      { label: 'Identidad', tex: 'AI=IA=A' },
      { label: 'Distributivo', tex: 'A(B+C)=AB+AC' },
    ],
  },
  'w4-c7': {
    defs: [
      { label: 'Determinante', tex: '\\det\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}=ad-bc', body: 'Factor por el que la matriz multiplica las áreas (con signo).' },
      { label: 'Inversa', tex: 'A^{-1}=\\frac{1}{ad-bc}\\begin{pmatrix}d&-b\\\\-c&a\\end{pmatrix}', body: 'Deshace $A$: $A^{-1}A=AA^{-1}=I$.' },
    ],
    props: [
      { label: 'Áreas', tex: '\\text{área}(A\\,R)=|\\det A|\\cdot\\text{área}(R)' },
      { label: 'Signo', body: '$\\det A<0$: la transformación invierte la orientación (como un espejo).' },
      { label: 'Invertibilidad', tex: 'A^{-1}\\ \\text{existe}\\iff\\det A\\neq0' },
      { label: 'Producto', tex: '\\det(AB)=\\det A\\,\\det B' },
      { label: 'Resolver', tex: 'A\\vec x=\\vec b\\Rightarrow\\vec x=A^{-1}\\vec b' },
    ],
  },
  'w4-c8': {
    defs: [
      { label: 'Vector y valor propio', tex: 'A\\vec v=\\lambda\\vec v,\\quad \\vec v\\neq\\vec 0' },
      { label: 'Ecuación característica', tex: '\\det(A-\\lambda I)=0', body: 'En $2\\times2$: $\\lambda^2-(a+d)\\lambda+(ad-bc)=0$.' },
      { label: 'Traza', tex: '\\operatorname{tr}A=a+d' },
    ],
    props: [
      { label: 'Suma y producto', tex: '\\lambda_1+\\lambda_2=\\operatorname{tr}A,\\qquad \\lambda_1\\lambda_2=\\det A' },
      { label: 'Múltiplos', body: 'Si $\\vec v$ es vector propio, también lo es $k\\vec v$ para todo $k\\neq0$.' },
      { label: 'Triangulares', body: 'En una matriz triangular, los valores propios son los de la diagonal.' },
      { label: 'Iterar', body: '$A^k\\vec v$ se alinea con el vector propio del valor propio de mayor módulo.' },
      { label: 'Estado estable', body: 'Un reparto que no cambia cumple $M\\vec v=\\vec v$: vector propio con $\\lambda=1$.' },
    ],
  },
};
