import type { TopicRef } from '../../game/level/types';

export const REF_W08: Record<string, TopicRef> = {
  'w8-c1': {
    defs: [
      {
        label: 'Bit',
        tex: '\\log_2 2=1',
        body: 'Unidad que corresponde a distinguir dos posibilidades igualmente probables.',
      },
      {
        label: 'Información individual',
        tex: 'I(x)=-\\log_2p(x)',
        body: 'Mide la información de observar x, en bits. El logaritmo es base dos.',
      },
    ],
    props: [
      {
        label: 'Probabilidades diádicas',
        tex: 'p(x)=2^{-k}\\RightarrowI(x)=k',
        body: 'k particiones por mitades llevan del total a la probabilidad del evento.',
      },
      {
        label: 'Comparar eventos',
        tex: 'I(y)-I(x)=\\log_2\\frac{p(x)}{p(y)}',
        body: 'Una razón de probabilidades se transforma en una diferencia de bits.',
      },
      {
        label: 'Casos límite',
        tex: 'I(1)=0,\\quadI(0)=+\\infty',
        body: 'El cálculo es finito para 0 < p ≤ 1. La rareza no mide el valor del contenido para una investigación.',
      },
    ],
  },
  'w8-c2': {
    defs: [
      {
        label: 'Entropía como media',
        tex: 'H(X)=\\sum_xp(x)I(x)',
        body: 'Información media por símbolo, ponderada con las probabilidades de la fuente.',
      },
      {
        label: 'Entropía en base dos',
        tex: 'H(X)=-\\sum_xp(x)\\log_2p(x)',
        body: 'Se mide en bits por símbolo; la distribución debe sumar uno.',
      },
    ],
    props: [
      {
        label: 'Máximo uniforme',
        tex: '0\\le H(X)\\le\\log_2m',
        body: 'Para m símbolos, el máximo se alcanza con probabilidades 1/m; una fuente constante tiene entropía cero.',
      },
      {
        label: 'Aportes nulos',
        tex: '0\\log_2 0:=0',
        body: 'Una etiqueta imposible aporta cero a la media, aunque su información individual sea infinita.',
      },
      {
        label: 'Información del lote',
        tex: 'I_{\\mathrm{lote}}=NH(P)',
        body: 'Con frecuencias Npᵢ exactas, suma la información de sus N símbolos. H es la cota inferior de longitud media de un código de prefijo.',
      },
      {
        label: 'Ahorro frente a longitud fija',
        tex: '\\Delta=N\\ell_{\\mathrm{fija}}-N\\bar L',
        body: 'Resta el tamaño comprimido al tamaño fijo; usa la longitud media del código efectivamente construido.',
      },
    ],
  },
  'w8-c3': {
    defs: [
      {
        label: 'Código de prefijo',
        tex: 'c(x)\\not\\prec c(y)\\quad(x\\ne y)',
        body: 'Ninguna palabra completa es el inicio de otra. Las palabras terminan en hojas del árbol.',
      },
      {
        label: 'Longitud media',
        tex: '\\bar L=\\sum_i p_i\\ell_i',
        body: 'Pondera el largo de cada palabra por la probabilidad de su símbolo.',
      },
      {
        label: 'Huffman',
        body: 'Une los dos nodos de menor peso, suma sus pesos y repite hasta la raíz. Minimiza la longitud media entre códigos de prefijo por símbolo; los empates pueden producir varios árboles óptimos.',
      },
    ],
    props: [
      {
        label: 'Leer el árbol',
        body: 'Recorre una rama por bit. Al alcanzar una hoja emite su símbolo y vuelve a la raíz. Un flujo puede terminar en una palabra completa, dejar un prefijo incompleto o ser inválido.',
      },
      {
        label: 'Cota binaria',
        tex: 'H(X)\\le\\bar L_{\\mathrm{Huff}}<H(X)+1',
        body: 'Para una fuente no degenerada y un código binario por símbolo.',
      },
      {
        label: 'Igualdad diádica',
        tex: 'p_i=2^{-\\ell_i}\\Rightarrow\\bar L=H(X)',
        body: 'Las longitudes ideales son enteras y alcanzan la cota inferior.',
      },
      {
        label: 'Tamaño por conteos',
        tex: 'L_{\\mathrm{lote}}=\\sum_i n_i\\ell_i=N\\bar L',
        body: 'Las frecuencias de un fragmento aislado no reemplazan las del lote. La compresión conserva símbolos; el cifrado requiere una credencial separada.',
      },
    ],
  },
  'w8-c4': {
    defs: [
      {
        label: 'Probabilidad conjunta',
        tex: 'p(x,y)=P(X=x,Y=y)',
        body: 'Probabilidad de observar el par completo. Las probabilidades de todas las celdas suman uno.',
      },
      {
        label: 'Probabilidad condicional',
        tex: 'p(y\\mid x)=\\frac{p(x,y)}{p(x)}',
        body: 'Para p(x) > 0. Dentro de la fila conocida, las probabilidades se renormalizan para sumar uno.',
      },
      {
        label: 'Entropía conjunta',
        tex: 'H(X,Y)=-\\sum_{x,y}p(x,y)\\log_2p(x,y)',
        body: 'Información media del par, en bits con logaritmos base dos. Las celdas de probabilidad cero aportan cero.',
      },
      {
        label: 'Entropía condicional',
        tex: 'H(Y\\mid X)=\\sum_xp(x)H(Y\\mid X=x)',
        body: 'Información media pendiente sobre Y al conocer X; las filas imposibles no aportan al promedio.',
      },
    ],
    props: [
      {
        label: 'Marginales',
        tex: 'p(x)=\\sum_y p(x,y),\\quad p(y)=\\sum_xp(x,y)',
        body: 'Suma una fila para la torre y una columna para la ruta.',
      },
      {
        label: 'Regla de la cadena',
        tex: '\\begin{aligned}H(X,Y)&=H(X)+H(Y\\mid X)\\\\&=H(Y)+H(X\\mid Y)\\end{aligned}',
        body: 'Ambos órdenes describen el mismo par; las dos entropías condicionales pueden ser distintas.',
      },
      {
        label: 'Condicionar reduce la media',
        tex: '0\\le H(Y\\mid X)\\le H(Y)',
        body: 'Para variables discretas con entropías finitas. Es una cota promedio; no afirma que toda fila tenga menos entropía que la marginal.',
      },
    ],
  },
  'w8-c5': {
    defs: [
      {
        label: 'Información mutua',
        tex: 'I(X;Y)=H(X)-H(X\\mid Y)',
        body: 'Reducción promedio de incertidumbre sobre X cuando conoces Y.',
      },
      {
        label: 'Independencia',
        tex: 'p(x,y)=p(x)p(y)',
        body: 'Conocer una variable no cambia la distribución de la otra.',
      },
    ],
    props: [
      {
        label: 'Entropías y solapamiento',
        tex: 'I(X;Y)=H(X)+H(Y)-H(X,Y)',
        body: 'Retira de la suma el contenido contado dos veces.',
      },
      {
        label: 'Simetría y cotas',
        tex: '\\begin{aligned}I(X;Y)&=I(Y;X)\\\\0\\le I(X;Y)&\\le\\min(H(X),H(Y))\\end{aligned}',
        body: 'Para variables discretas con entropías finitas. El contenido compartido es simétrico aunque lo pendiente pueda ser distinto.',
      },
      {
        label: 'Cero e independencia',
        tex: 'I(X;Y)=0\\iff X\\perp Y',
        body: 'En el caso discreto, información mutua cero equivale a independencia.',
      },
      {
        label: 'Alcance de la medida',
        body: 'La información mutua mide asociación entre las variables elegidas. Por sí sola no determina una causa ni identifica al operador de un enlace.',
      },
    ],
  },
  'w8-c6': {
    defs: [
      {
        label: 'Entropía cruzada',
        tex: 'L_Q(P)=-\\sum_iP_i\\log_2Q_i',
        body: 'Promedio de los largos ideales del perfil Q con las probabilidades de la fuente emisora P.',
      },
      {
        label: 'Divergencia de Kullback–Leibler',
        tex: 'D(P\\Vert Q)=\\sum_iP_i\\log_2\\frac{P_i}{Q_i}',
        body: 'Exceso ideal por símbolo, en bits. Los términos con Pᵢ = 0 aportan cero; si Pᵢ > 0 y Qᵢ = 0, el resultado es infinito.',
      },
    ],
    props: [
      {
        label: 'Exceso ideal',
        tex: 'D(P\\Vert Q)=L_Q(P)-H(P)',
        body: 'KL no es automáticamente el exceso entre códigos enteros arbitrarios. Coincide aquí porque ambos perfiles diádicos alcanzan exactamente sus largos ideales.',
      },
      {
        label: 'No negatividad e igualdad',
        tex: 'D(P\\Vert Q)\\ge0,\\quad D(P\\Vert Q)=0\\iff P=Q',
        body: 'P y Q deben ser distribuciones completas sobre el mismo alfabeto. Los aportes individuales pueden ser negativos; conserva sus signos.',
      },
      {
        label: 'Asimetría',
        tex: 'D(P\\Vert Q)\\ne D(Q\\Vert P)\\quad\\text{en general}',
        body: 'Invertir la dirección cambia qué probabilidades ponderan el promedio. Puede haber pares con igual divergencia en ambos sentidos, pero la simetría no es una propiedad general.',
      },
      {
        label: 'Exceso de un lote diádico',
        tex: '\\Delta=N D(P\\Vert Q)',
        body: 'Si los conteos son exactamente NPᵢ y ambos códigos tienen largos ideales enteros, multiplica los bits extra por símbolo por N.',
      },
    ],
  },

  'w8-c7': {
    defs: [
      {
        label: 'Canal binario simétrico',
        tex: 'P(Y\\ne X)=p,\\quad P(Y=X)=1-p',
        body: 'Cada bit se invierte con igual probabilidad p para ambas entradas. El modelo sin memoria asume inversiones independientes; no borra ni inserta posiciones.',
      },
      {
        label: 'Entropía binaria',
        tex: '\\begin{aligned}h_2(p)&=-p\\log_2p\\\\&\\quad-(1-p)\\log_2(1-p)\\end{aligned}',
        body: 'Entropía de la decisión invertir o conservar; los aportes de probabilidad cero valen cero.',
      },
      {
        label: 'Capacidad',
        tex: 'C=\\max_{P_X}I(X;Y)',
        body: 'Mayor información mutua por uso del canal; se mide en bits útiles por uso.',
      },
      {
        label: 'Tasa útil',
        tex: 'R=k/n',
        body: 'k bits de información transportados en n usos del canal. Multiplica por la frecuencia de usos para obtener bits útiles por segundo.',
      },
    ],
    props: [
      {
        label: 'Capacidad del BSC',
        tex: 'C(p)=1-h_2(p)',
        body: 'Se alcanza con entradas equiprobables. La probabilidad de acierto 1 − p no es la capacidad.',
      },
      {
        label: 'Bordes',
        tex: 'C(0)=1,\\quad C(1/2)=0,\\quad C(1)=1',
        body: 'Una inversión segura se deshace invirtiendo otra vez. Con p = 1/2 la salida es independiente de la entrada.',
      },
      {
        label: 'Tasa y fiabilidad',
        tex: 'R<C',
        body: 'Bajo la capacidad existen códigos suficientemente largos y adecuados para hacer el error arbitrariamente pequeño. La tasa no garantiza cada bloque corto. Sobre C no se consigue error arbitrariamente pequeño.',
      },
      {
        label: 'Probabilidades exactas antes del redondeo',
        tex: '\\begin{aligned}C(1/8)&=-2+\\tfrac78\\log_2 7\\\\C(1/4)&=-1+\\tfrac34\\log_2 3\\end{aligned}',
        body: 'Compara las tasas y multiplica por usos/s antes de redondear. Los huecos marcados se recuperan aparte del canal de inversiones.',
      },
    ],
  },
  'w8-c8': {
    defs: [
      {
        label: 'XOR y paridad par',
        tex: 'b_1\\oplus\\cdots\\oplus b_n\\oplus p=0',
        body: 'XOR es suma módulo dos. El bit añadido deja una cantidad par de unos.',
      },
      {
        label: 'Repetición triple',
        tex: 'R_{\\mathrm{rep}}=1/3',
        body: 'Tres copias transportan un dato; la mayoría corrige hasta una inversión por grupo.',
      },
      {
        label: 'Hamming(7,4)',
        tex: 'w=(p_1,p_2,d_1,p_4,d_2,d_3,d_4)',
        body: 'Numera desde uno a la izquierda. Datos en 3, 5, 6 y 7; comprobaciones en 1, 2 y 4.',
      },
      {
        label: 'Síndrome',
        tex: 'j=s_1+2s_2+4s_4=(s_4s_2s_1)_2',
        body: 'Comprueba los grupos 1 = {1,3,5,7}, 2 = {2,3,6,7} y 4 = {4,5,6,7}. Bajo el límite de una inversión, j señala la posición; j = 0 indica conservar.',
      },
    ],
    props: [
      {
        label: 'Paridades del codificador',
        tex: '\\begin{aligned}p_1&=d_1\\oplus d_2\\oplus d_4\\\\p_2&=d_1\\oplus d_3\\oplus d_4\\\\p_4&=d_2\\oplus d_3\\oplus d_4\\end{aligned}',
      },
      {
        label: 'Alcance de la paridad',
        body: 'Detecta cualquier cantidad impar de inversiones, sin localizar el bit. Una cantidad par puede pasar.',
      },
      {
        label: 'Tasa y distancia de Hamming',
        tex: 'R_{\\mathrm{Ham}}=4/7,\\quad d_{\\min}=3',
        body: 'Garantiza corregir hasta una inversión. Con más errores puede señalar otra posición y dar una palabra válida equivocada; síndrome cero tampoco prueba ausencia de errores sin ese límite.',
      },
      {
        label: 'Comprobación local y autenticidad',
        body: 'Hamming(7,4) sin paridad adicional no detecta de forma segura dos errores. La autenticidad requiere validar el paquete completo; corregir fragmentos cifrados no los descifra. Las tasas 1/3 y 4/7 superan C del enlace del expediente.',
      },
    ],
  },
  'w8-final': {
    defs: [
      {
        label: 'Evento y media',
        tex: 'I(D)=3,\\quad H(P)=7/4',
        body: 'D informa 3 bits; la fuente promedia 1,75 bits por símbolo.',
      },
      {
        label: 'Pruebas del expediente',
        body: 'Compresión, dependencia torre–ruta, costo de perfil, capacidad y corrección local aportan lecturas distintas. La autenticidad se comprueba sobre el paquete completo.',
      },
    ],
    props: [
      {
        label: 'Lote y exceso',
        tex: 'L_P=112,\\quad L_Q=152,\\quad L_Q-L_P=40',
        body: 'Conteos (32,16,8,8); el costo no identifica por sí solo a quien cargó el perfil.',
      },
      { label: 'Ruta y enlace', tex: 'H(Y\\mid X)=1,\\quad I(X;Y)=1,\\quad R=1/4>C(1/4)' },
      {
        label: 'Cadena de validación',
        body: 'Conservar los originales, reconstruir una copia bajo el límite del código, validar el paquete completo y abrir el cuerpo con la credencial del chip.',
      },
    ],
  },
};
