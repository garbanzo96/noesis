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
};
