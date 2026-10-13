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
  'w9-c4': {
    defs: [
      {
        label: 'Ecuación autónoma',
        tex: "y'=f(y)",
        body: 'La pendiente depende del estado, sin dependencia explícita del tiempo.',
      },
      {
        label: 'Equilibrio',
        tex: 'f(y_*)=0',
        body: 'Estado que permanece constante al iniciar exactamente en él.',
      },
      {
        label: 'Estabilidad y atracción',
        body: 'Estable: estados suficientemente cercanos permanecen cerca. Asintóticamente estable: además convergen al equilibrio con el tiempo.',
      },
      {
        label: 'Logística continua',
        tex: "y'=ry(1-y/K),\\quad r>0,\\ K>0",
        body: 'r es una tasa por unidad de tiempo; K es la capacidad de referencia del modelo.',
      },
    ],
    props: [
      {
        label: 'Ceros y signos logísticos',
        tex: '\\begin{aligned}f(0)&=f(K)=0\\\\0<y<K&\\Rightarrow f(y)>0\\\\y>K&\\Rightarrow f(y)<0\\end{aligned}',
        body: 'En el dominio no negativo, 0 es inestable por el lado positivo y K es asintóticamente estable.',
      },
      {
        label: 'Curva del banco',
        tex: '\\begin{aligned}B(t)&=\\frac8{1+e^{-t}}\\\\B(0)&=4,\\quad B(\\ln3)=6\\end{aligned}',
        body: 'Cumple B′ = B(1 − B/8). Desde 4 se acerca a 8 sin alcanzarlo en tiempo finito.',
      },
      {
        label: 'Ocupación y tráfico',
        tex: "B'=\\text{entrada}-\\text{salida}",
        body: 'En una regla de intercambio, cambio neto cero permite tráfico: 2 entradas/min durante 3 min suman 6 paquetes, aunque el búfer siga lleno.',
      },
    ],
  },
  'w9-c5': {
    defs: [
      {
        label: 'Sistema lineal autónomo',
        tex: "\\mathbf x'=A\\mathbf x",
        body: 'Matriz constante que transforma un estado de dos componentes en dos pendientes.',
      },
      {
        label: 'Vector y valor propios',
        tex: 'A\\mathbf v=\\lambda\\mathbf v,\\quad\\mathbf v\\ne\\mathbf0',
        body: 'La matriz conserva la dirección del vector propio y lo multiplica por su valor propio.',
      },
      {
        label: 'Retrato de fase',
        body: 'Conjunto de trayectorias del estado. Los ejes son sus componentes; el reloj del recorrido se presenta aparte.',
      },
    ],
    props: [
      {
        label: 'Modo exponencial',
        tex: '\\mathbf x(t)=c e^{\\lambda t}\\mathbf v',
        body: 'Cada dirección propia real produce un modo de solución. Para λ negativa decae; para λ positiva crece.',
      },
      {
        label: 'Superposición con inicio',
        tex: '\\begin{aligned}\\mathbf x(t)&=c_1e^{\\lambda_1t}\\mathbf v_1\\\\&\\quad+c_2e^{\\lambda_2t}\\mathbf v_2\\\\\\mathbf x_0&=c_1\\mathbf v_1+c_2\\mathbf v_2\\end{aligned}',
        body: 'Con dos vectores propios reales independientes, los coeficientes se fijan por el estado inicial en t = 0.',
      },
      {
        label: 'Modos del banco acoplado',
        tex: '\\begin{aligned}A&=\\begin{pmatrix}-2&1\\\\1&-2\\end{pmatrix}\\\\\\mathbf v_1&=(1,1),\\quad\\lambda_1=-1\\\\\\mathbf v_2&=(1,-1),\\quad\\lambda_2=-3\\end{aligned}',
        body: 'Las amplitudes modales se suman y restan para reconstruir u y v.',
      },
      {
        label: 'Matriz diagonal',
        tex: '\\begin{aligned}A&=\\operatorname{diag}(a,b)\\\\\\mathbf x(t)&=(u_0e^{at};v_0e^{bt})\\end{aligned}',
        body: 'Los ejes son direcciones propias. En una matriz acoplada, las entradas diagonales no entregan por sí solas los valores propios.',
      },
    ],
  },
  'w9-c6': {
    defs: [
      {
        label: 'Traza y determinante',
        tex: '\\begin{aligned}\\tau&=\\operatorname{tr}A=a+d\\\\D&=\\det A=ad-bc\\end{aligned}',
        body: 'Para A con filas (a,b) y (c,d), son la suma y el producto de los valores propios.',
      },
      {
        label: 'Discriminante',
        tex: '\\Delta=\\tau^2-4D',
        body: 'Discriminante del polinomio λ² − τλ + D; es distinto del determinante D.',
      },
      {
        label: 'Centro lineal',
        tex: '\\tau=0,\\quad D>0',
        body: 'Valores propios imaginarios puros. Trayectorias cercanas cerradas: estable, sin atracción al origen.',
      },
    ],
    props: [
      {
        label: 'Polinomio y raíces',
        tex: '\\begin{aligned}\\lambda^2-\\tau\\lambda+D&=0\\\\\\lambda_{1,2}&=\\frac{\\tau\\pm\\sqrt{\\Delta}}2\\end{aligned}',
        body: 'Δ positiva: dos raíces reales; negativa: conjugadas complejas; cero: raíz real repetida.',
      },
      {
        label: 'Silla y nodo',
        tex: '\\begin{aligned}D<0&:\\ \\text{silla}\\\\D>0,\\Delta>0&:\\ \\text{nodo}\\end{aligned}',
        body: 'En el nodo, τ negativa da entrada y positiva da salida. Una silla tiene valores propios de signos opuestos, aunque la traza sea negativa.',
      },
      {
        label: 'Espiral y centro',
        tex: '\\begin{aligned}D>0,\\Delta<0,\\tau\\ne0&:\\ \\text{espiral}\\\\D>0,\\Delta<0,\\tau=0&:\\ \\text{centro}\\end{aligned}',
        body: 'La parte real es τ/2: negativa atrae y positiva repele. En un centro los estados permanecen cerca sin converger.',
      },
      {
        label: 'Bordes de la clasificación',
        tex: '\\begin{aligned}D>0,\\Delta=0&:\\ \\lambda=\\tau/2\\\\D=0&:\\ \\text{revisar el sistema}\\end{aligned}',
        body: 'La raíz repetida da nodo estrellado o impropio según sus vectores propios. D = 0 puede dejar equilibrios no aislados. Un centro de la parte lineal no resuelve por sí solo la estabilidad no lineal.',
      },
    ],
  },

  'w9-c7': {
    defs: [
      {
        label: 'Segundo orden',
        tex: "q''+cq'+25q=0",
        body: 'Aguja de masa normalizada: q es posición desde el reposo, c el freno positivo y 25 la rigidez. Tiempo en segundos; c en s⁻¹ y rigidez en s⁻².',
      },
      {
        label: 'Estado de la aguja',
        tex: "\\mathbf x=(q,v)^{\\mathsf T},\\quad v=q'",
        body: 'La trayectoria requiere posición y velocidad iniciales; una posición negativa queda al otro lado del reposo.',
      },
      {
        label: 'Regímenes de amortiguación',
        tex: '\\Delta=c^2-100',
        body: 'Δ negativa: subamortiguado; nula: crítico; positiva: sobreamortiguado, con c positivo y rigidez 25.',
      },
    ],
    props: [
      { label: 'Sistema equivalente', tex: "\\begin{aligned}q'&=v\\\\v'&=-25q-cv\\end{aligned}" },
      {
        label: 'Raíces',
        tex: '\\begin{aligned}\\lambda^2+c\\lambda+25&=0\\\\\\lambda_{1,2}&=\\frac{-c\\pm\\sqrt{c^2-100}}2\\end{aligned}',
        body: 'c = 6: −3 ± 4i; c = 10: −5 doble; c = 26: −1 y −25.',
      },
      {
        label: 'Soluciones para q₀ = 1 y v₀ = 0',
        tex: '\\begin{aligned}q_6&=e^{-3t}(\\cos4t+\\tfrac34\\sin4t)\\\\q_{10}&=(1+5t)e^{-5t}\\\\q_{26}&=\\frac{25e^{-t}-e^{-25t}}{24}\\end{aligned}',
      },
      {
        label: 'Raíz repetida e inicio',
        tex: 'q=(A+Bt)e^{-5t}',
        body: 'A y B ajustan ambos datos iniciales. Con raíces reales puede haber un cruce según el inicio, pero no oscilaciones repetidas.',
      },
      {
        label: 'Cruce del papel',
        tex: 'q_6(\\pi/4)=-e^{-3\\pi/4}<0',
        body: 'El cálculo valida el movimiento; el reloj independiente del papel aporta la hora de descarga.',
      },
    ],
  },
  'w9-c8': {
    defs: [
      {
        label: 'Mapa logístico',
        tex: 'x_{n+1}=rx_n(1-x_n)',
        body: 'Actualización discreta: cada salida vuelve a ser entrada. n cuenta iteraciones sin equivalencia horaria; r es distinto de la tasa de la logística continua.',
      },
      {
        label: 'Distancia entre ejecuciones',
        tex: 'd_n=|z_n-x_n|',
        body: 'Compara dos estados en el mismo número de actualización, sin redondear entre pasos.',
      },
      {
        label: 'Sensibilidad inicial',
        body: 'Inicios cercanos pueden generar recorridos separados bajo la misma regla. La pareja de clase ilustra sensibilidad en el régimen caótico r = 4.',
      },
    ],
    props: [
      {
        label: 'Determinismo',
        body: 'Un inicio exacto y una regla fija determinan cada paso; la precisión de la medición limita el pronóstico.',
      },
      {
        label: 'Acotación, estiramiento y plegado',
        tex: '\\begin{aligned}4x(1-x)&=1-(2x-1)^2\\\\x\\in[0,1]&\\Rightarrow4x(1-x)\\in[0,1]\\end{aligned}',
        body: 'La parábola pliega ambos lados del máximo x = 1/2, donde la salida vale 1.',
      },
      {
        label: 'Inicio excepcional',
        tex: '\\frac14\\longrightarrow\\frac34\\longrightarrow\\frac34',
        body: 'Una separación aislada no demuestra caos; también puede ocurrir en sistemas sin caos.',
      },
      {
        label: 'Separación tras un paso',
        tex: '\\begin{aligned}f(\\tfrac14+\\varepsilon)&=\\tfrac34+2\\varepsilon-4\\varepsilon^2\\\\d_1&=2\\varepsilon-4\\varepsilon^2\\end{aligned}',
        body: 'Para ε = 1/10000 o 1/5000 la expresión es positiva. El factor del mapa depende del estado.',
      },
      {
        label: 'Copias del banco',
        tex: '\\begin{aligned}x_0&=\\tfrac15,\\quad z_0=\\tfrac{2001}{10000}\\\\d_{10}&\\approx0{,}101341\\end{aligned}',
        body: 'La distancia puede disminuir entre pasos: baja en 6 y 9. Más precisión inicial no asegura conocer perfectamente el futuro.',
      },
      {
        label: 'Cálculo y acceso',
        body: 'La sensibilidad explica un límite del cálculo público. El recibo firmado enlazado a la copia privada y al mensaje documenta acceso temprano; parte y guía confirman el recorrido de las vacunas.',
      },
    ],
  },
  'w9-final': {
    defs: [
      {
        label: 'Revisión del expediente',
        body: 'Cada cálculo se conserva junto a la copia de la que salió; las horas del 17 preceden a la recepción del 18 de agosto.',
      },
      {
        label: 'Evidencia documental',
        body: 'La copia, el recibo, el historial, el parte y la guía documentan acceso, edición y recepción. Sus identificadores se conservan en los originales.',
      },
    ],
    props: [
      {
        label: 'Euler y referencia',
        tex: 'Q^E_1=8<10<4e',
        body: 'La salida pública de paso único queda bajo el umbral; la referencia exacta lo supera.',
      },
      {
        label: 'Traslado observado',
        tex: '02{:}00<02{:}10<02{:}30<02{:}40',
        body: '18 de agosto: recepción en el Observatorio dentro de la ventana prevista y recepción en la Clínica del Cerro a las 02:40.',
      },
    ],
  },
};
