# Mundo 8 · Las Antenas · Teoría de la información · guion completo

Autor del guion: Codex. Documento para implementar después, con la estructura de `docs/MUNDO-07.md`: escena, `lesson`, `demo`, `challenge` y cierre. Carpeta propuesta: `src/content/w08/`, con un archivo por caso, `final.tsx`, `kit.tsx`, `ref.ts` e `index.ts` con `withLesson`. Este encargo entrega el guion.

World id: `information`. Casos: `w8-c1`…`w8-c8`; final: `w8-final`; módulo de cierre: `w8-closed`. Propuesta para `src/content/sectors.ts`: cambiar únicamente el acento de `information`, actualmente `#a88aff`, por `#38d9c5`. Ese turquesa no coincide con los acentos de los mundos del 1 al 7. Mantener los prerrequisitos del mapa; el orden interno de los casos es consecutivo.

Todos los logaritmos son en base 2. Las cantidades exactas se conservan como fracciones o expresiones con logaritmos; los decimales llevan coma. `answer` es el índice de la opción correcta, contado desde cero. Cada Ask tiene tres opciones y se puede reintentar después de leer la explicación. Las cifras de una práctica son ejercicios del terminal, no nuevos hechos del expediente. Los datos narrativos quedan fijos.

## Historia

Tomás recuperó el dron a las 03:00 en la quebrada Jaime. La caja térmica estaba vacía. El chip conserva rutas y copias de mensajes cifrados que todavía envía a una red de antenas. Teo guardó los paquetes tal como llegaron. Algunos tienen huecos marcados; otros conservan la longitud, pero traen bits cambiados.

La agencia llega a Las Antenas esa misma madrugada. Los metadatos del chip incluyen un contacto de mantención: Inés Araya. Ella puede abrir el terminal de servicio. Quiere evitar que Halcón culpe a quienes arreglan los repetidores del barrio. Conoce la red, pero al principio oculta que autorizó un cambio de perfil durante su turno.

Personaje nuevo: `ines`, Inés Araya, técnica de enlaces e informante de la red, color `#38d9c5`. Voz: baja y cortante cuando alguien toca un cable; habla de puertos y cortes, deja pausas antes de comprometer a sus compañeros. Comprueba lo que oye antes de responder. Ejemplo: «Ese puerto estaba cerrado. Guarda la copia antes de preguntarme quién lo abrió». Se afloja cuando aparece evidencia verificable, sin adoptar el entusiasmo de Teo.

Retrato con opciones existentes de `Look`: `jaw: 'oval'`, `skin: '#b9825a'`, `shade: '#93613f'`, `hair: '#181c22'`, `hairStyle: 'short'`, `iris: '#355c58'`, `brows: 'flat'`, `mouth: 'firm'`, `outfit: 'workjacket'`, `cloth: '#142b2b'`, `cloth2: '#38d9c5'`, `age: false`, `extra: (col) => <Headset col={col} />`. Pelo corto, chaqueta con franja turquesa y auricular de servicio. El accesorio ya existe en `cast.tsx`; habría que incorporar `ines` al elenco al implementar.

Lugar nuevo: `antenas`, para incorporar después a `PlaceId` y `PLACES` en `src/art/places.tsx`. SVG 1600×900: cerros oscuros al fondo, mástiles de celosía y platos orientados hacia el puerto; azotea mojada en primer plano, caseta abierta con cables etiquetados y un monitor de servicio turquesa. La lluvia cruza la luz de la caseta. Un único piloto rojo marca el repetidor de reserva. Las escenas interiores usan el mismo fondo con encuadre de la caseta. Reutilizar `oficina` para revisar el expediente y `servidores` para la copia local de los paquetes. El Observatorio aparece al final en el mapa y en el mensaje; su fondo se resolverá en el mundo siguiente.

La cabecera de control usa símbolos públicos: A = pulso, B = ruta, C = acuse, D = reserva de entrega. El cuerpo del mensaje está cifrado. La compresión de la cabecera permite leer sus símbolos; el cifrado del cuerpo requiere la credencial de recepción guardada en el chip. Teo la usa localmente después de recuperar los paquetes y verificar su autenticidad. Ni el histograma ni Huffman entregan esa credencial.

## Arco

- 8.1: el símbolo D informa 3 bits y señala una reserva de entrega que quedó fuera de la bitácora visible.
- 8.2: la fuente pública tiene entropía 1,75 bits por símbolo; el exceso del contador lleva a revisar el código configurado.
- 8.3: Huffman explica una cabecera de 112 bits y permite separar el flujo en A, B, C y D; D trae una ruta de reserva.
- 8.4: la tabla conjunta relaciona esa ruta con la torre Sur; conocer la torre deja 1 bit pendiente sobre la ruta.
- 8.5: las rutas comparten 1 bit con la torre; el piloto de mantenimiento comparte 0. La conexión útil está en el repetidor de reserva.
- 8.6: el perfil equivocado agrega 40 bits al lote. Inés reconoce su autorización, pero la copia original muestra quién cambió la asignación de símbolos después.
- 8.7: el enlace solicita una tasa superior a su capacidad. Separar los huecos de los bits invertidos revela que existe una copia local utilizable.
- 8.8: las comprobaciones de paridad y el síndrome permiten corregir los bloques elegidos bajo el límite de un error; Teo recupera el paquete y valida el cuerpo cifrado.
- 8.★: cinco lecturas sostienen el expediente. El mensaje fija una entrega en El Observatorio dentro de una ventana de tormenta que el pronóstico oficial sigue mostrando despejada.

## Kit (`src/content/w08/kit.tsx`)

Todos los componentes se dibujan en `Stage` con `viewBox="0 0 1600 900"`. Reservar el sector izquierdo para objetos arrastrables, el derecho para preguntas y perillas, y el borde inferior para el texto. Usar rectángulos, círculos, rutas y etiquetas; sin imágenes rasterizadas ni escenas tridimensionales. Una animación muestra un cambio de estado y conserva el estado final para poder leerlo.

- `SymbolTray({ counts, selected, onPick })`: fichas A–D, tamaño proporcional a la frecuencia y grupos que se parten en mitades. `SplitTree({ depth, path })` anima una decisión binaria por nivel.
- `SourceBars({ probabilities, lengths, onTransfer })`: barras que conservan suma uno al mover fichas entre símbolos; muestra la contribución de cada símbolo y luego su suma. Soporta fuentes de 2, 4 u 8 símbolos.
- `PrefixTree({ nodes, edges, active, onJoin })`: árbol binario con ramas 0 y 1, pesos en nodos y códigos solo en hojas; permite arrastrar los dos nodos de menor peso a un área de unión. Resolver empates por etiqueta para reproducir el ejemplo; aceptar otros árboles óptimos válidos en práctica.
- `BitTape({ bits, groups, erased, flipped, cursor })`: cinta de bits y límites de palabras; `?` solo para un hueco marcado. Permite arrastrar un cursor y un marcador de corrección. El decodificador de prefijo distingue palabra completa, prefijo incompleto y flujo inválido.
- `JointGrid({ counts, rows, columns, filter })`: tabla de conteos y probabilidades conjuntas; arrastrar una ficha de torre filtra una fila y renormaliza las probabilidades condicionales. `SharedBits({ hx, hy, hxy })` muestra áreas de incertidumbre con solapamiento proporcional a la información mutua, siempre con etiquetas numéricas.
- `CodeCost({ source, profile, lengths })`: dos cintas paralelas del mismo lote; cada símbolo ocupa su longitud bajo el perfil escogido. Mostrar por separado contribuciones con signo y exceso total.
- `BinaryChannel({ p, inputBalance, rate, trace })`: dos carriles 0/1 y cruces visibles; perillas discretas para probabilidad de inversión y tasa. La traza demostrativa es reproducible. Las probabilidades teóricas se calculan desde el modelo, no desde una muestra animada pequeña.
- `ParityRack({ received, mode, checks, syndrome })`: XOR como conteo de unos módulo 2; repetición con votación; Hamming con posiciones de izquierda a derecha y comprobaciones superpuestas. Arrastrar una lupa muestra los grupos; arrastrar el marcador invierte el bit elegido.
- Helpers propuestos: `info(p)`, `entropy(ps)`, `jointEntropy(table)`, `conditionalEntropy(table, given)`, `mutualInfo(table)`, `kl(P,Q)`, `meanLength(ps,lengths)`, `huffman(ps)`, `decodePrefix(bits,tree)`, `binaryEntropy(p)`, `bscCapacity(p)`, `xor(bits)`, `hammingEncode(data)`, `hammingSyndrome(word)`, `hammingCorrect(word, assumeAtMostOneError)`, `fmtComma(value,digits)`. Verificar que las distribuciones sumen uno; adoptar $0\log_2 0=0$. `info(0)` devuelve infinito, no un valor finito. `kl` devuelve infinito si algún $P_i>0$ tiene $Q_i=0$.

Convenciones de interacción: las perillas discretas se encajan al soltar; tolerancia numérica cero después del encaje. Un arrastre de ficha entra al destino cuando su centro queda a distancia menor o igual a 24 unidades SVG del centro señalado, es decir, distancia al cuadrado menor o igual a 576; además se comprueba la identidad de la ficha. Los gates tienen confirmación visible y no se aprueban por tiempo transcurrido. En prácticas, enteros, bits, fracciones, posiciones y elecciones se validan exactamente. Si se pide decimal, se solicita a cuatro decimales y se admite error absoluto menor o igual a 0,0001 respecto del valor exacto. Para 0,5 o 1,75 también se acepta la fracción equivalente. Cada ronda entrega retroalimentación específica sobre el error indicado.

## 8.1 «El pulso que falta» · Información de un evento en bits

Id: `w8-c1`.

Escena de apertura (`antenas`, azotea, 03:40; el auricular de Inés cruje con la humedad): la bitácora visible muestra pulsos normales. El chip conserva un símbolo que alguien omitió.

> Inés: No desconectes ese cable. Ahí quedó la copia de mi turno.
> Teo: Hay pulsos, rutas y acuses… Espera, este símbolo tiene otra etiqueta.
> Iris: La etiqueta está. La línea del registro, vacía.
> Tú: Comparemos esa línea con lo que guardó el chip.

Clase. NÓESIS parte con ocho casilleros igualmente posibles; una luz ocupa uno de ellos.

1. Se ven los casilleros sin símbolos. Una pregunta binaria separa las mitades y deja iluminada la mitad que contiene la luz. NÓESIS: «Un bit alcanza para elegir entre dos posibilidades iguales». Pizarra: `2\ \text{posibilidades}\longrightarrow1\ \text{bit}`.
2. Gate: «Gira la perilla hasta dejar un solo casillero». La profundidad toma valores enteros de 0 a 3; cada paso divide por dos las posibilidades restantes. Desbloquea con profundidad 3 y un casillero restante, tolerancia cero tras encaje. Se anima la ruta completa. NÓESIS: «Necesitaste tres respuestas». Pizarra: `8\to4\to2\to1`.
3. Las fichas se agrupan: A ocupa cuatro casilleros, B dos, C uno y D uno. Se presenta $p$ como la fracción ocupada por el evento. NÓESIS: «El logaritmo cuenta cuántas mitades separan a esa fracción del total». Pizarra: `I(x)=-\log_2 p(x)`.
4. Cada grupo se conecta a su ruta de particiones. A da 1 bit; B, 2; C y D, 3. Ask: «¿Cuánta información trae D, con probabilidad 1/8?» [«1/8 bit», «3 bits», «8 bits»], answer 1. Explicación: $1/8=2^{-3}$; confundir información con probabilidad da el primer distractor, contar casilleros da el tercero. Pizarra: `-\log_2(1/8)=3`.
5. Se compara una ficha rara con una frecuente, sin cambiar su significado narrativo. NÓESIS: «Conocer un evento menos probable reduce más las posibilidades. Eso no dice cuánto vale su contenido para la investigación». Pizarra: `p_1<p_2\RightarrowI_1>I_2`.
6. Un casillero seguro queda solo desde el inicio; un evento imposible se mantiene fuera de la bandeja. NÓESIS: «Si ya estaba asegurado, observarlo agrega cero bits. Un evento de probabilidad cero queda fuera de este cálculo finito». Pizarra: `I(p=1)=0;\quad0<p\le1`.

Investigación «La línea borrada». El lote íntegro del chip tiene 64 cabeceras: A aparece 32 veces; B, 16; C, 8; D, 8. La bitácora de la caseta omite las líneas D, cuya etiqueta pública es «reserva de entrega». Las frecuencias se usan como distribución de este lote; no se declara que describan toda la red.

- Ask 1: «¿Cuántos bits informa una cabecera D bajo esta distribución?» [«3», «8», «1»], answer 0. Explicación: $8/64=1/8$ y $-\log_2(1/8)=3$; 8 es el conteo y 1 corresponde al pulso A.
- Ask 2: «¿Cuánto más informa D que A?» [«Cuatro veces en bits», «2 bits», «1/8 bit»], answer 1. Explicación: sus probabilidades tienen razón cuatro, pero la diferencia de información es $3-1=2$ bits.
- Notas: `p=(1/2,1/4,1/8,1/8)`; `I(A)=1,\ I(B)=2,\ I(C)=I(D)=3`; `I(D)-I(A)=2\ \mathrm{bits}`.

Práctica (3 rondas).

- r0: sortear $k\in\{1,2,3,4\}$, mostrar $p=1/2^k$ con la fracción desarrollada y pedir información en bits; respuesta $k$. Error típico: escribir $p$ o $2^k$.
- r1: sortear $a\in\{1,2\}$ y $d\in\{1,2\}$; eventos con probabilidades $2^{-a}$ y $2^{-(a+d)}$. Pedir cuántos bits más informa el segundo; respuesta $d$. Error típico: usar la razón de probabilidades $2^d$ como diferencia de bits.
- r2: sortear $k\in\{0,1,2,3\}$ y entregar $I=k$. Pedir $p$; respuesta $2^{-k}$. Error típico: perder el signo y responder $2^k$; con $k=0$, tratar lo seguro como imposible.

Cierre (`antenas`): Inés tapa con el pulgar el nombre del puerto al que salió D.

> Inés: Esa reserva entró durante mi turno. Todavía no te dije que la enviara yo.
> Narración: Teo guarda ambas copias. El contador de bits de la caseta sigue subiendo aunque la bitácora tenga líneas vacías.

## 8.2 «El tamaño del tráfico» · Entropía de una fuente

Id: `w8-c2`.

Escena de apertura (`antenas`, caseta, 03:55; un ventilador roza su rejilla): Teo quiere copiar todo el tráfico, pero el terminal exige calcular el espacio necesario. Inés teme que la copia corte el servicio del barrio.

> Teo: Cabe, si ese contador está midiendo lo que dice.
> Inés: Si lo llenas, el repetidor se cae. La gente de abajo usa esta red.
> Iris: Entonces revisa la unidad antes de apretar nada.

Clase. Una bandeja contiene ocho fichas: cuatro A, dos B, una C y una D; las etiquetas muestran sus bits individuales.

1. Las fichas recorren cintas de largos 1, 2, 3 y 3. NÓESIS: «Cada aparición aporta su cantidad. La media cuenta también cuántas veces aparece». Pizarra: `\text{media}=\text{total}/\text{cantidad}`.
2. Gate: «Arrastra fichas hasta que cada símbolo tenga la misma cantidad». Hay ocho fichas y cuatro bandejas; se conserva el total. Desbloquea con conteos $(2,2,2,2)$, tolerancia de arrastre 24 y conteos exactos. Al soltar, se recalculan los bits de cada evento. NÓESIS: «Ahora ninguna etiqueta es más fácil de anticipar que otra». Pizarra: `p_A=p_B=p_C=p_D=1/4`.
3. Vuelve el reparto original; se colorea cada aporte promedio antes de sumar. NÓESIS: «Llamamos entropía a la información media por símbolo de una fuente». Pizarra: `H(X)=\sum_x p(x)I(x)=-\sum_xp(x)\log_2p(x)`.
4. La cinta original suma 14 bits para las ocho fichas. Ask: «¿Cuál es la entropía del reparto original?» [«9 bits/símbolo», «3 bits/símbolo», «1,75 bits/símbolo»], answer 2. Explicación: $14/8=7/4$; 9 suma los bits de las etiquetas sin ponderar y 3 toma solo el máximo individual. Pizarra: `H=\tfrac12\cdot1+\tfrac14\cdot2+\tfrac18\cdot3+\tfrac18\cdot3=7/4`.
5. Se alterna entre reparto original y uniforme. La barra media sube de 1,75 a 2. NÓESIS: «Con cuatro símbolos posibles, el reparto uniforme alcanza el máximo. Si uno domina, quedan menos decisiones pendientes en promedio». Pizarra: `H(X)\le\log_2m;\quad H_{\max}(4)=2`.
6. Todas las fichas pasan a A; las otras bandejas vacías no aportan a la suma. NÓESIS: «Una fuente que siempre emite lo mismo tiene entropía cero. Las bandejas vacías aportan cero». Pizarra: `H(1,0,0,0)=0;\quad0\log_2 0:=0`.

Investigación «El contador de la caseta». Volver al lote de 64 cabeceras de 8.1, con conteos $(32,16,8,8)$. El contador presupone palabras fijas de 2 bits por símbolo y reserva 128 bits. La información total calculada desde la distribución del lote es 112 bits. Este total expresa el límite de longitud media de un código de prefijo; falta comprobar un código que lo alcance.

- Ask 1: «¿Cuánta información suma el lote bajo ese reparto?» [«128 bits», «112 bits», «64 bits»], answer 1. Explicación: $64\cdot7/4=112$; 128 usa longitud fija y 64 asigna un bit a todos.
- Ask 2: «¿Cuál sería la entropía máxima con estas cuatro etiquetas?» [«2 bits/símbolo», «4 bits/símbolo», «1,75 bits/símbolo»], answer 0. Explicación: el máximo es $\log_2 4=2$ y exige etiquetas equiprobables; el lote actual no lo es.
- Notas: `H(P)=7/4\ \mathrm{bits/simbolo}`; `64H(P)=112\ \mathrm{bits}`; `64\cdot2-112=16\ \mathrm{bits}`.

Práctica (3 rondas).

- r0: sortear $k\in\{1,2,3\}$; fuente uniforme de $m=2^k$ símbolos. Pedir $H$; respuesta $k$. Error típico: responder el número de símbolos.
- r1: sortear una permutación de las etiquetas y uno de los repartos $(1/2,1/2)$, $(1/2,1/4,1/4)$ o $(1/2,1/4,1/8,1/8)$. Mostrar bits individuales y pedir media; respuestas respectivas 1, 1,5 y 1,75. Error típico: sumar sin ponderar.
- r2: sortear $t\in\{1,2,3,4\}$; lote de $8t$ símbolos con conteos $(4t,2t,t,t)$. Pedir ahorro frente a palabras fijas de 2 bits si se alcanza $H$; respuesta $2t$ bits. Error típico: entregar $14t$, que es el tamaño comprimido, o aplicar el ahorro individual máximo a todo el lote.

Cierre: el terminal muestra un perfil de palabras variables instalado, aunque su contador todavía usa palabras fijas.

> Teo: El código cambió. El contador quedó atrás.
> Inés: Abre el árbol. Ahí se ve quién tiene la rama corta.

## 8.3 «Las ramas cortas» · Códigos de prefijo y Huffman

Id: `w8-c3`.

Escena de apertura (`antenas`, terminal de servicio, 04:10; el teclado deja gotas sobre la mesa): una cabecera tiene bits continuos y carece de separadores. Iris quiere saber dónde empieza la reserva de entrega sin alterar la copia.

> Iris: Si marcas mal el corte, cambias lo que dice.
> Inés: Ese lector vuelve a la raíz cada vez que llega a una hoja.
> Tú: Probemos los cortes en la copia.

Clase. Árbol de decisiones con símbolos solo en hojas; izquierda vale 0 y derecha vale 1.

1. Se compara el árbol con un cartel ambiguo que asigna A = `0` y B = `01`. «Arrastra el cursor por la cinta `01` y detenlo donde crees que termina A». El cursor encaja tras el primer bit; la rama que continúa deja visible el conflicto antes de nombrarlo. NÓESIS: «Una palabra de prefijo termina en una hoja. Ninguna palabra completa puede ser el comienzo de otra». Pizarra: `c(x)\not\prec c(y)\quad(x\ne y)`; $\prec$ se lee «es prefijo de».
2. Gate: aparecen pesos A = 1/2, B = 1/4, C = 1/8, D = 1/8. «Arrastra los dos pesos menores al área de unión». Desbloquea solo después de unir C y D en 1/4; luego B y CD en 1/2; luego A y BCD en 1. En cada unión se exige ambos nodos correctos dentro del radio 24 y suma exacta. Ante el empate del segundo paso se usa el orden B antes de CD. NÓESIS: «Huffman une los dos pesos menores y repite con el peso nuevo». Pizarra: `1/8+1/8=1/4`.
3. Se despliega el árbol construido: A = `0`, B = `10`, C = `110`, D = `111`. Una luz sigue `010110111` y corta `0|10|110|111`. NÓESIS: «Al llegar a una hoja, lees el símbolo y vuelves a la raíz». Pizarra: `010110111\longrightarrow ABCD`.
4. Las cuatro palabras se miden antes de promediar. Ask: «¿Cuánto vale la longitud media con el reparto de la fuente?» [«2,25 bits/símbolo», «1,75 bits/símbolo», «9 bits/símbolo»], answer 1. Explicación: $\sum p_i\ell_i=7/4$; 2,25 promedia etiquetas como si fueran equiprobables y 9 suma sus longitudes. Pizarra: `\bar L=\sum_i p_i\ell_i=7/4`.
5. Se compara una cinta fija con la de Huffman. NÓESIS: «Para un código binario de prefijo, la media no baja de la entropía. Huffman minimiza esa media entre los códigos de prefijo por símbolo». Pizarra: `H(X)\le\bar L_{\mathrm{Huff}}<H(X)+1`.
6. Se alinea cada longitud con $-\log_2p_i$. NÓESIS: «Aquí las probabilidades son potencias de un medio. Sus longitudes ideales son enteras y alcanzamos la cota inferior». Pizarra: `\ell=(1,2,3,3);\quad\bar L=H=7/4`.

Investigación «La cabecera continua». El chip guarda el árbol de la fuente P y el lote de 64 símbolos. La cabecera íntegra ocupa 112 bits. Un fragmento público es `010110111`; sus cuatro símbolos son ABCD y D conduce al puerto etiquetado «ruta de reserva». La longitud de ese fragmento aislado es 9 bits; sus frecuencias no reemplazan las del lote.

- Ask 1: «¿Cómo lees el fragmento con este árbol?» [«ABABBABBB», «ABCD», «Un único símbolo de nueve bits»], answer 1. Explicación: las hojas cortan `0|10|110|111`; el primer distractor trata cada 0 como A y cada 1 como B, y el tercero espera un separador externo.
- Ask 2: «¿Por qué 112 bits alcanzan para las 64 cabeceras de este lote?» [«El cifrado eliminó símbolos», «Cada cabecera usa siempre 2 bits», «Las longitudes ponderadas suman 112»], answer 2. Explicación: $32\cdot1+16\cdot2+8\cdot3+8\cdot3=112$; la compresión conserva todos los símbolos.
- Notas: `c=(0,10,110,111)`; `\bar L=7/4=H(P)`; `32+32+24+24=112\ \mathrm{bits}`; `\ell(ABCD)=1+2+3+3=9`.

Práctica (3 rondas).

- r0: sortear dos símbolos distintos entre A–D, concatenar sus códigos y pedir ambos símbolos en orden. Validar la secuencia exacta; longitudes posibles entre 3 y 6 bits. Error típico: cortar en bloques fijos o detenerse antes de una hoja.
- r1: sortear $t\in\{1,2,3,4\}$; conteos $(4t,2t,t,t)$ y el árbol de clase. Pedir tamaño total y longitud media; respuestas $14t$ y $7/4$. Error típico: usar media no ponderada $9/4$.
- r2: sortear el árbol válido de clase o uno con A = `0`, B = `01`, C = `10`, D = `11`. Pedir si es de prefijo y señalar las palabras en conflicto cuando corresponda. Error típico: aprobar porque las palabras son distintas; A es prefijo de B en el segundo árbol.

Cierre: el fragmento D abre una tabla con torre y ruta. La etiqueta «Sur» aparece junto al repetidor que Inés había llamado cerrado.

> Iris: Cerrado para quién.
> Narración: Inés retira el pulgar de la pantalla. La fila sigue ahí.

## 8.4 «La fila Sur» · Entropía conjunta y condicional

Id: `w8-c4`.

Escena de apertura (`antenas`, caseta, 04:25; la puerta golpea con el viento): el terminal muestra dos torres y cuatro rutas. Teo cree que sumar las dos listas basta para medir lo que falta saber. Inés exige mirar qué rutas salen realmente de cada torre.

> Teo: Dos torres, cuatro rutas. Puedo guardar las listas por separado.
> Inés: Y mandar una ruta por una torre que nunca la tuvo.
> Iris: Abre los cruces.

Clase. Definir aquí $X$ = torre, $Y$ = ruta. La tabla muestra cuatro pares igualmente probables: Norte–a, Norte–b, Sur–c, Sur–d; los otros cruces son imposibles. Ocho fichas representan dos apariciones de cada par.

1. Las fichas entran a sus celdas; las celdas vacías quedan rayadas. NÓESIS: «Un resultado completo dice torre y ruta juntas. Cuenta las celdas posibles, no todas las combinaciones dibujadas». Pizarra: `p(x,y)=\text{fraccion en la celda}`.
2. Gate: «Arrastra la ficha Sur al filtro». Se oculta Norte y las dos celdas de Sur ocupan todo el grupo seleccionado. Desbloquea cuando el filtro es Sur y se han mostrado ambas probabilidades condicionales $1/2$, con radio 24 y valores exactos. NÓESIS: «La mitad del lote salió de Sur. Dentro de esa mitad, c y d pesan lo mismo». Pizarra: `p(y\mid x)=p(x,y)/p(x)`.
3. Se quita el filtro; las cuatro celdas activas muestran información individual de 2 bits. NÓESIS: «La entropía conjunta promedia la información de esos pares». Pizarra: `H(X,Y)=-\sum_{x,y}p(x,y)\log_2p(x,y)=2`.
4. Se filtra cada torre; cada fila deja una decisión binaria sobre la ruta. NÓESIS: «La entropía condicional promedia lo que falta saber de Y cuando ya tienes X». Pizarra: `H(Y\mid X)=\sum_xp(x)H(Y\mid X=x)=1`.
5. Las fichas se ordenan primero por torre y después por ruta. Ask: «Si ya sabes que salió de Sur, ¿cuánto queda por saber de la ruta?» [«2 bits», «1 bit», «0 bits»], answer 1. Explicación: quedan c y d equiprobables; 2 ignora el filtro y 0 confunde conocer la torre con conocer la ruta. Pizarra: `H(X,Y)=H(X)+H(Y\mid X)=1+1=2`.
6. Se selecciona la columna d; solo Sur permanece. NÓESIS: «Conocer la ruta sí determina la torre en esta tabla. Cambiar el orden deja otro reparto de los mismos dos bits». Pizarra: `H(X,Y)=H(Y)+H(X\mid Y)=2+0=2`.

Investigación «Los cruces reales». Una bitácora íntegra de rutas, distinta de las cabeceras A–D, tiene 16 registros. La tabla contiene Norte–a = 4, Norte–b = 4, Sur–c = 4, Sur–d = 4; el resto, cero. La cabecera de reserva recuperada en 8.3 nombra la ruta d. La torre de salida fue omitida del informe.

- Ask 1: «Con ruta d, ¿qué torre corresponde y cuánto queda por saber de ella?» [«Sur; 0 bits», «Cualquiera; 1 bit», «Norte; 0 bits»], answer 0. Explicación: toda la columna d pertenece a Sur; el segundo distractor ignora la tabla conjunta y el tercero cambia la fila.
- Ask 2: «Si solo conservaras la etiqueta Sur, ¿cuánto quedaría por saber de la ruta?» [«0 bits», «2 bits», «1 bit»], answer 2. Explicación: Sur conserva c y d con probabilidades $1/2$; faltaría distinguirlas.
- Notas: `p_{Na}=p_{Nb}=p_{Sc}=p_{Sd}=4/16=1/4`; `H(X)=1,\ H(Y)=2,\ H(X,Y)=2`; `H(Y\mid X)=1,\ H(X\mid Y)=0`; `p(S\mid d)=1`.

Práctica (3 rondas).

- r0: sortear $k\in\{1,2\}$; $2^k$ torres equiprobables, cada una con dos rutas exclusivas equiprobables. Mostrar tabla y pedir $H(X,Y)$; respuesta $k+1$. Error típico: contar también cruces imposibles y responder $2k+1$.
- r1: sortear $k\in\{1,2\}$ y una torre en la misma familia; pedir las probabilidades de sus dos rutas y $H(Y\mid X)$; respuestas $1/2$, $1/2$ y 1. Error típico: conservar las probabilidades conjuntas $1/2^{k+1}$ después de filtrar.
- r2: sortear $a,b\in\{1,2,3\}$ y dar $H(X)=a$, $H(Y\mid X)=b$ para una tabla producto uniforme de $2^a$ torres y $2^b$ rutas compartidas. Pedir $H(X,Y)$; respuesta $a+b$. Error típico: multiplicar las entropías o entregar solo $b$. El tablero admite desplazamiento para esta tabla más grande.

Cierre: el filtro Sur deja visibles las rutas c y d. La ruta d termina en el repetidor de reserva, fuera del plano de servicio público.

> Inés: Ese tramo lo mantuvimos andando cuando Halcón dejó de pagar.
> Iris: Alguien encontró un uso rentable.
> Narración: En el plano oficial, el espacio del repetidor es una mancha gris.

## 8.5 «El enlace compartido» · Información mutua

Id: `w8-c5`.

Escena de apertura (`oficina`, mesa de revisión, 05:00; el café de Teo ya tiene una película): una copia añade el estado de un piloto luminoso a cada salida. Iris pide distinguir una pista útil de un indicador que parpadea para todos.

> Teo: El piloto aparece en todos los registros. Puede estar avisando la entrega.
> Inés: Parpadea hasta cuando el puerto está vacío.
> Tú: Veamos si cambia lo que falta saber de la torre.

Clase. Recuperar $X$ = torre y $Y$ = ruta de 8.4. Añadir $Z$ = piloto, apagado o encendido, independiente de la torre y equiprobable en el ejemplo.

1. Dos cubiertas ocultan torre y ruta; retirar la cubierta de ruta deja visible también la torre correspondiente. NÓESIS: «Parte de lo que dice la ruta ya responde dónde salió. Vamos a medir ese contenido compartido». Pizarra: `\text{antes: }H(X)=1`.
2. Gate: «Gira la perilla de evidencia y compara las dos cubiertas». Posiciones discretas «piloto» y «ruta»; se deben visitar ambas y terminar en «ruta». Desbloquea con historial de ambos estados y $H(X\mid Y)=0$, tolerancia cero. La tabla del piloto deja las dos torres; la de ruta deja una. NÓESIS: «Con ruta, la torre queda resuelta. Con piloto, queda la misma decisión». Pizarra: `H(X\mid Y)=0;\quad H(X\mid Z)=1`.
3. Una barra de un bit se vacía al revelar Y; se conserva al revelar Z. NÓESIS: «La información mutua es la reducción promedio de incertidumbre que conocer una variable entrega sobre la otra». Pizarra: `I(X;Y)=H(X)-H(X\mid Y)=1`.
4. El diagrama muestra la suma de las dos entropías y retira el solapamiento contado dos veces. Ask: «Con $H(X)=1$, $H(Y)=2$ y $H(X,Y)=2$, ¿cuánto comparten?» [«3 bits», «1 bit», «0 bits»], answer 1. Explicación: $1+2-2=1$; 3 suma sin retirar duplicación y 0 supone independencia. Pizarra: `I(X;Y)=H(X)+H(Y)-H(X,Y)`.
5. Se invierten las cubiertas: conocer X deja una decisión de ruta, de modo que Y baja de 2 a 1. NÓESIS: «El contenido compartido es el mismo en ambos sentidos. Las incertidumbres que quedan pueden ser distintas». Pizarra: `I(X;Y)=I(Y;X)=2-1=1`.
6. La tabla de piloto muestra los cuatro cruces con $1/4$. NÓESIS: «En una tabla independiente, revelar el piloto no reduce la incertidumbre de la torre. Una asociación tampoco explica por sí sola quién produjo el enlace». Pizarra: `p(x,z)=p(x)p(z)\Rightarrow I(X;Z)=0;\quad0\le I(X;Y)\le\min(H(X),H(Y))`.

Investigación «El piloto de mantenimiento». En los 16 registros de rutas de 8.4, cada uno de los cuatro pares torre–ruta aparece dos veces con piloto apagado y dos veces con piloto encendido. Al agrupar por torre y piloto, cada celda tiene 4 registros. La ruta d sigue apuntando al repetidor de reserva; el piloto es un ciclo general de mantenimiento.

- Ask 1: «¿Qué dato reduce más la incertidumbre sobre la torre?» [«El piloto: 1 bit», «Ambos reducen 1 bit», «La ruta: 1 bit; el piloto: 0»], answer 2. Explicación: la ruta identifica la fila; cada estado del piloto conserva Norte y Sur por mitades.
- Ask 2: «¿La información mutua de 1 bit prueba quién operó el repetidor?» [«Sí, identifica a Inés», «No; mide la asociación y falta revisar el registro de acceso», «Sí, porque un bit identifica una persona»], answer 1. Explicación: la variable medida es la torre, no la identidad ni la causa del envío.
- Notas: `I(X;Y)=1+2-2=1`; `I(X;Z)=1+1-2=0`; `H(X\mid Y)=0,\ H(X\mid Z)=1`.

Práctica (3 rondas).

- r0: sortear $k\in\{1,2,3\}$; X uniforme en $2^k$ símbolos y Y una copia exacta con etiquetas distintas. Pedir $I(X;Y)$; respuesta $k$. Error típico: responder cero porque las etiquetas no son iguales.
- r1: sortear $a,b\in\{1,2\}$; X e Y independientes y uniformes en $2^a$ y $2^b$ símbolos. Dar $H(X,Y)=a+b$ y pedir información mutua; respuesta 0. Error típico: responder $a+b$ o $\min(a,b)$ sin comprobar dependencia.
- r2: sortear $k\in\{1,2\}$; X contiene $k$ bits equiprobables y Y contiene esos mismos bits más un bit independiente. Mostrar $H(X)=k$, $H(Y)=k+1$, $H(X,Y)=k+1$. Pedir información mutua y $H(Y\mid X)$; respuestas $k$ y 1. Error típico: confundir contenido compartido con la incertidumbre restante.

Cierre: Teo aparta las líneas del piloto y amplía la ficha del repetidor. Aparecen el perfil instalado y una autorización de turno con el nombre de Inés.

> Inés: Autoricé un reinicio. Guarda también el archivo que había antes.
> Narración: La copia anterior tiene las mismas etiquetas. Sus ramas están en otro orden.

## 8.6 «El perfil cambiado» · Divergencia de Kullback–Leibler

Id: `w8-c6`.

Escena de apertura (`antenas`, terminal de reserva, 05:25; un relé hace clic sin encender la lámpara): el perfil cargado asigna palabras cortas a los símbolos menos frecuentes del lote. La autorización de Inés podría cubrir ese cambio; ella asegura que guardó el original.

> Inés: Mi firma dejó levantar el servicio. El archivo anterior quedó en el chip.
> Iris: Tu firma sirve. La diferencia entre los archivos también.
> Teo: Tengo los dos. Voy a pasar el mismo lote por cada árbol.

Clase. Fuente real $P=(1/2,1/4,1/8,1/8)$; perfil instalado $Q=(1/8,1/2,1/4,1/8)$, en orden A, B, C, D. Ambos son distribuciones completas. El código de Q es A = `110`, B = `0`, C = `10`, D = `111`, con longitudes $(3,1,2,3)$.

1. Dos cintas reciben las mismas ocho fichas, con conteos $(4,2,1,1)$. Con P, A ocupa una casilla; con Q, tres. NÓESIS: «La fuente sigue emitiendo lo mismo. Cambiaste el espacio reservado para cada etiqueta». Pizarra: `P\ \text{emite};\quad Q\ \text{elige longitudes}`.
2. Gate: «Gira la perilla y pasa el lote por ambos perfiles». Visitar P y Q y terminar en Q; desbloquea después de que las cintas muestren 14 y 19 bits completos, tolerancia cero tras encaje. NÓESIS: «Con el perfil cambiado, este lote gasta cinco bits más». Pizarra: `19-14=5`.
3. Dividir las cintas por sus ocho símbolos. NÓESIS: «La entropía cruzada usa las probabilidades reales para promediar los largos que recomienda Q». Pizarra: `L_Q(P)=-\sum_iP_i\log_2Q_i=19/8`.
4. Retirar la longitud ideal de P y mostrar el exceso. NÓESIS: «La divergencia KL mide ese exceso ideal por símbolo. Aquí coincide exactamente con el costo del código, porque las longitudes de ambos perfiles son enteras y alcanzan sus entropías». Pizarra: `D_{\mathrm{KL}}(P\Vert Q)=\sum_iP_i\log_2(P_i/Q_i)=L_Q(P)-H(P)=5/8`.
5. Ask: «¿Puede un aporte individual ser negativo aunque la divergencia total sea no negativa?» [«Sí; aquí el aporte de B es −1/4 y el total es 5/8», «No; se toma valor absoluto en cada aporte», «Sí; por eso el total correcto es −5/8»], answer 0. Explicación: B tiene $P_B/Q_B=1/2$; se conserva el signo del logaritmo y se suman todos los aportes. Pizarra: `D=\tfrac12\cdot2+\tfrac14\cdot(-1)+\tfrac18\cdot(-1)+\tfrac18\cdot0=5/8`.
6. Invertir fuente y perfil en una tercera cinta: ahora Q emite y P codifica. NÓESIS: «La divergencia total nunca es negativa; vale cero si los repartos coinciden. Cambiar cuál reparto emite puede cambiar el costo». Pizarra: `D(P\Vert Q)=5/8\ne D(Q\Vert P)=1/2;\quad D(P\Vert Q)\ge0`. En una nota de clase: con longitudes ideales, la concavidad de $\log_2$ da $-\sum_iP_i\log_2(Q_i/P_i)\ge-\log_2\sum_iQ_i=0$ para estos soportes positivos. Con probabilidades generales, redondear longitudes o usar un Huffman arbitrario puede agregar otros costos: KL no es automáticamente la diferencia entre dos códigos enteros cualesquiera.

Investigación «La autorización y la copia». Para las 64 cabeceras con conteos $(32,16,8,8)$, el código P ocupa 112 bits. El perfil Q ocupa 152. El exceso de 40 bits localiza el perfil cambiado; por sí solo no identifica a quien lo cargó. Al abrir la revisión de ese perfil, el terminal muestra que la asignación fue guardada con la cuenta receptora «Contador», después de la autorización de reinicio de Inés. Esa línea administrativa se conserva como evidencia separada del cálculo.

- Ask 1: «¿Cuántos bits agrega Q al lote emitido con reparto P?» [«152», «40», «32»], answer 1. Explicación: $64\cdot5/8=40$; 152 es el total y 32 corresponde al costo de invertir fuente y perfil.
- Ask 2: «Si Q emitiera y usara el código de P, ¿el exceso por símbolo sería el mismo?» [«Sí, toda divergencia es simétrica», «Sería −5/8», «No; sería 1/2 bit»], answer 2. Explicación: al invertir, el promedio se pondera con Q; el resultado sigue siendo no negativo.
- Notas: `H(P)=H(Q)=7/4`; `L_Q(P)=19/8=2{,}375`; `D(P\Vert Q)=5/8=0{,}625`; `D(Q\Vert P)=1/2`; `64\cdot19/8=152`; `152-112=40`.

Práctica (3 rondas).

- r0: sortear dirección P→Q o Q→P y una permutación simultánea de las etiquetas. Pedir la longitud media bajo el código del perfil ajeno; respuestas $19/8$ o $9/4$. Error típico: ponderar con el perfil del código en vez de la fuente emisora.
- r1: sortear $t\in\{1,2,3,4,5,6,7,8\}$ y dirección. Lote de $8t$ símbolos con conteos $8tP$ o $8tQ$; pedir exceso total. Respuestas $5t$ o $4t$ bits. Error típico: entregar el tamaño completo o tomar valor absoluto antes de sumar.
- r2: sortear el par P,P; P,Q; o Q,P. Pedir divergencia por símbolo y si coincide con la dirección inversa. Respuestas: $0$ y sí; $5/8$ y no; $1/2$ y no. Error típico: tratar KL como distancia simétrica o creer que solo es cero al comparar códigos idénticos bit a bit. La igualdad depende de las distribuciones.

Cierre: Inés encuentra una segunda casilla bajo el perfil. Solicita cuatro veces la tasa de datos que tenía el enlace de reserva.

> Inés: El reinicio dejaba el servicio lento. Esta casilla la cambiaron después.
> Narración: El auricular vuelve a crujir. Un paquete llega completo de largo, con una comprobación fallida.

## 8.7 «La tasa imposible» · Canal binario simétrico y capacidad

Id: `w8-c7`.

Escena de apertura (`antenas`, acceso al mástil de reserva, 05:50; el viento silba por un pasacables): el monitor marca paquetes de largo correcto que no pasan la validación. Inés quiere bajar la tasa. Iris quiere conservar la configuración que provocó la falla antes de tocarla.

> Inés: Está pidiendo más de lo que este enlace puede cargar.
> Teo: Tengo huecos y tengo bits cambiados. Los voy a separar.
> Iris: Copia la configuración. Después haces la prueba en el terminal.

Clase. Un emisor manda luces 0 y 1; el receptor a veces ve la luz contraria. Este modelo cambia bits, sin borrar ni insertar posiciones.

1. Dos carriles muestran una entrada 0 que puede llegar como 0 o 1, y una entrada 1 que puede llegar como 1 o 0. NÓESIS: «En el canal binario simétrico, cada bit se invierte con la misma probabilidad p. Asumimos inversiones independientes entre usos». Pizarra: `P(Y\ne X)=p;\quad P(Y=X)=1-p`.
2. Gate: «Gira la perilla hasta que la salida deje de distinguir las entradas». Valores $p\in\{0,1/8,1/4,1/2\}$; se recorren primero 0 y después 1/2. Desbloquea en 1/2 con ambos estados visitados y filas de transición $(1/2,1/2)$, tolerancia cero. NÓESIS: «Ahora cualquiera de las entradas produce las dos salidas por igual». Pizarra: `p=1/2\Rightarrow Y\ \text{independiente de }X`.
3. La perilla vuelve a 1/4; mostrar la decisión «se invirtió / se conservó». NÓESIS: «La entropía binaria mide lo que falta saber de esa decisión. Usa p y su complemento». Pizarra: `h_2(p)=-p\log_2p-(1-p)\log_2(1-p)`.
4. Con entradas 0 y 1 equiprobables, la salida también tiene entropía 1. Su parte pendiente dado X es $h_2(p)$. NÓESIS: «La capacidad es la mayor información mutua por uso del canal. En este canal se alcanza con entrada equilibrada». Pizarra: `C=\max_{P_X}I(X;Y)=1-h_2(p)`.
5. Se encienden cuatro fichas de probabilidad: una inversión y tres conservaciones. Ask: «Con $p=1/4$, ¿cuál es la capacidad?» [«3/4 bit/uso», «Aproximadamente 0,1887 bit/uso», «Aproximadamente 0,8113 bit/uso»], answer 1. Explicación: $h_2(1/4)=2-(3/4)\log_2 3$ y se resta de 1; 3/4 mide acierto de un bit aislado y 0,8113 es la entropía de la inversión. Pizarra: `C(1/4)=-1+\tfrac34\log_2 3\approx0{,}1887`.
6. Una segunda perilla compara tasa $R=1/8$ con $R=1/4$ sobre la barra de capacidad. NÓESIS: «Por debajo de la capacidad existen códigos largos que pueden hacer el error tan pequeño como se necesite. La tasa por sí sola no garantiza que este bloque corto llegue bien». Pizarra: `R<C:\ \text{fiabilidad con codigos adecuados};\quad R>C:\ \text{no hay error arbitrariamente pequeno}`. Añadir tarjetas de borde: `C(0)=1;\ C(1/2)=0;\ C(1)=1`; una inversión segura se deshace invirtiendo otra vez. Los logaritmos de 3 y 7 aparecen por los complementos de 1/4 y 1/8; se muestran exactos antes de aproximarlos.

Investigación «El enlace de reserva». Una trama de calibración conocida contiene 16 ceros y 16 unos. Llegan invertidos 4 de los ceros y 4 de los unos: 8 inversiones en 32 usos. Para este ejercicio se adopta un BSC sin memoria con $p=1/4$; la muestra calibra p, y la independencia es una hipótesis explícita del modelo. El terminal realiza 100 usos por segundo. La configuración anterior pedía $R=1/16$ bit útil por uso; la nueva pide $R=1/4$, cuatro veces más. Los huecos marcados `?` se apartan y se solicitan a la copia local; no entran a este BSC. La comparación de capacidad corresponde al enlace modelado de inversiones, no al servicio completo con huecos.

- Ask 1: «La configuración pide 25 bits útiles por segundo. ¿Qué dice el modelo?» [«Es fiable porque acierta tres de cada cuatro bits», «Supera el máximo de aproximadamente 18,8722 bits/s», «La capacidad es 81,1278 bits/s»], answer 1. Explicación: $100C\approx18,8722$; 25 viene de $100/4$, y el tercer distractor usa $100h_2(p)$.
- Ask 2: «¿Qué afirmación sobre bajar a $R=1/8$ es correcta?» [«Queda bajo C; faltan un código adecuado y validación», «Garantiza cero errores en cada bloque», «Sigue sobre C porque 1/8 supera 0,1887»], answer 0. Explicación: $1/8=0,125<C$; estar bajo la capacidad habilita fiabilidad con codificación apropiada, sin garantizar un paquete corto particular.
- Notas: `\hat p=8/32=1/4`; `C=-1+\tfrac34\log_2 3\approx0{,}1887\ \mathrm{bits/uso}`; `100C\approx18{,}8722\ \mathrm{bits/s}`; `100/16=6{,}25;\ 100/4=25;\ 100/8=12{,}5\ \mathrm{bits/s}`; `(1/4)/(1/16)=4`.

Práctica (3 rondas).

- r0: sortear $p\in\{0,1/8,1/4,1/2\}$; pedir $h_2(p)$ y C a cuatro decimales. Respuestas respectivas $(0,1)$, $(0,5436;0,4564)$, $(0,8113;0,1887)$ y $(1,0)$. Error típico: confundir $1-p$ con C u omitir el complemento en la entropía.
- r1: sortear $p\in\{1/8,1/4\}$ y $R\in\{1/8,1/4,1/2\}$; comparar R con C usando valores exactos, y elegir «bajo C» o «sobre C». Error típico: redondear C a cero o uno antes de comparar. Todas las parejas evitan igualdad.
- r2: sortear $t\in\{1,2,3,4\}$; canal sin inversiones, $p=0$, con $16t$ usos/s. Pedir capacidad en bits/s; respuesta $16t$. Después preguntar qué ocurre con $p=1/2$ a la misma frecuencia; respuesta 0. Error típico: confundir frecuencia de usos con información útil cualquiera sea el ruido.

Cierre: al separar los huecos, aparece una carpeta de paquetes recibidos en el terminal de reserva. Sus bloques incluyen posiciones de comprobación. Teo hace la copia por el cable de servicio, sin someterla otra vez al enlace de radio.

> Teo: Los huecos se pueden pedir de nuevo. Estos otros bloques ya están acá, con sus comprobaciones.
> Inés: Guarda también los que fallen. Mi turno quedó entre esos archivos.
> Narración: La carpeta conserva el cuerpo cifrado de una reserva de entrega. Dos bloques cortos siguen marcados en rojo.

## 8.8 «La posición roja» · Paridad, repetición y Hamming(7,4)

Id: `w8-c8`.

Escena de apertura (`servidores`, copia local del terminal, 06:15; el chip descansa sobre una toalla húmeda): Teo puede intentar reconstruir dos bloques, pero Iris exige conservar los originales y comprobar el mensaje completo antes de dar por válida la entrega.

> Teo: Las comprobaciones apuntan a una posición. Voy a corregir solo la copia de trabajo.
> Iris: Y el mensaje entero se valida después.
> Inés: Esos dos bloques llegaron separados. El hueco entre ellos ya está recuperado.

Clase. Bits de datos `1011`; se comparan tres maneras de agregar comprobaciones. En los ejercicios de Hamming se declara a lo sumo una inversión por bloque. Esa condición pertenece al ejercicio; un BSC real puede invertir más de un bit.

1. Se cuentan tres unos en `1011`. Gate de paridad: «Arrastra el bit que deja una cantidad par de unos a la casilla vacía». Desbloquea al soltar 1 en esa casilla, radio 24, palabra exacta `10111` y cuatro unos. Después, invertir una posición deja un conteo impar. NÓESIS: «El bit de paridad completa una cantidad par de unos. Detecta cualquier cantidad impar de inversiones, pero no localiza el bit». Pizarra: `b_1\oplus\cdots\oplus b_n\oplus p=0`; $\oplus$ es suma módulo 2. Dos inversiones quedan visibles como ejemplo de fallo de detección.
2. Cada dato se copia tres veces. `111` llega como `101` y la mayoría recupera 1. Gate breve: «Arrastra el voto hasta el valor mayoritario»; desbloquea al soltar la ficha 1 en la salida del bloque `101`, radio 24 y voto exacto. NÓESIS: «La repetición triple corrige una inversión por grupo. Usa tres bits para transportar uno». Pizarra: `111\to101\to1;\quad R=1/3`.
3. Se despliegan siete posiciones de izquierda a derecha. Los datos ocupan 3, 5, 6 y 7; las comprobaciones, 1, 2 y 4. «Arrastra la lupa por cada grupo para ver cuáles posiciones comparte». La lupa encaja en cada comprobación; sus conexiones quedan encendidas antes de escribirlas. NÓESIS: «Hamming coloca comprobaciones superpuestas. Cada posición pertenece a una combinación distinta de grupos». Pizarra: `w=(p_1,p_2,d_1,p_4,d_2,d_3,d_4);\quad R=4/7`. Para datos `1011`, encender los grupos y después mostrar `p_1=d_1\oplus d_2\oplus d_4=0`, `p_2=d_1\oplus d_3\oplus d_4=1`, `p_4=d_2\oplus d_3\oplus d_4=0`; palabra `0110011`.
4. La copia recibida es `0110111`. Se anima cada comprobación: grupo 1 = posiciones 1, 3, 5, 7; grupo 2 = 2, 3, 6, 7; grupo 4 = 4, 5, 6, 7. NÓESIS: «El síndrome junta los resultados de esas paridades. Lee el orden con cuidado». Pizarra: `s_1=1,\ s_2=0,\ s_4=1;\quad j=s_1+2s_2+4s_4=(s_4s_2s_1)_2=5`.
5. Gate principal: «Arrastra el marcador de corrección al bit que indica el síndrome». Desbloquea solo al elegir posición 5, invertirla, obtener `0110011` y recalcular síndrome `000`; tolerancia de arrastre 24, posición y bits exactos. Ask: «Bajo el límite de una inversión, ¿qué dato recuperas?» [«1011», «0110», «101»], answer 0. Explicación: extraer posiciones 3, 5, 6, 7 da `1011`; `0110` toma las primeras cuatro posiciones y `101` confunde el síndrome con datos. Pizarra: `0110111\xrightarrow{j=5}0110011\longrightarrow1011`.
6. Dos bits se invierten en una copia aparte; el síndrome señala otra posición y se bloquea la etiqueta «corrección garantizada». NÓESIS: «Hamming(7,4) corrige una inversión. Con más, el mismo síndrome puede llevarte a una corrección equivocada; cero tampoco prueba ausencia de errores sin ese límite». Pizarra: `d_{\min}=3;\quad\text{garantia: hasta una inversion}`. El ejemplo invierte posiciones 1 y 2 de `0110011`: recibe `1010011`, síndrome `011` e índice 3; corregirlo produciría otra palabra válida, `1000011`, con datos distintos. No usar el Hamming sin paridad adicional como detector seguro de dos errores. Para el enlace de 8.7, $1/3>C$ y $4/7>C$: estos códigos cortos muestran correcciones y tasas, sin prometer fiabilidad arbitraria a ese nivel de ruido.

Investigación «Los dos bloques». La copia recibida conserva `0110111` y `1001000`. Las posiciones se numeran desde 1 a la izquierda. Bajo el intento de una inversión por bloque, ambos síndromes son `101`, índice 5. Las correcciones dan `0110011` y `1001100`; extraer los datos entrega `1011` y `0100`. Son fragmentos del cuerpo cifrado, no palabras de texto. El terminal combina estos fragmentos con el resto del paquete ya recuperado. Teo usa la credencial del chip y verifica la autenticidad del mensaje completo; si falla, se mantiene como inválido y se pide otra copia. La validación del paquete decide si este intento puede incorporarse al expediente.

- Ask 1: «¿Dónde se intenta corregir `1001000` y qué dato queda?» [«Posición 5; 1001», «Posición 5; 0100», «Posición 4; 0000»], answer 1. Explicación: $s_1=1$, $s_2=0$, $s_4=1$; al cambiar el quinto bit queda `1001100` y sus datos son `0100`. El primer distractor extrae las primeras cuatro posiciones; el tercero usa índice desde cero en una tabla numerada desde uno y termina cambiando el cuarto bit.
- Ask 2: «¿Qué falta antes de aceptar la entrega recuperada?» [«Nada: síndrome cero prueba que todo el mensaje es auténtico», «Invertir también las otras posiciones», «Validar el paquete completo con la credencial del chip»], answer 2. Explicación: el síndrome evalúa comprobaciones del código; no autentica el mensaje ni cubre una cantidad ilimitada de errores.
- Notas: `j=1+2\cdot0+4\cdot1=5`; `\operatorname{datos}(0110011)=1011`; `\operatorname{datos}(1001100)=0100`; `R_{\mathrm{rep}}=1/3,\ R_{\mathrm{Ham}}=4/7`; `\operatorname{sindrome}(w)=000\ \text{para palabras validas}`.

Práctica (3 rondas).

- r0: sortear datos entre `0000` y `1111` y un bit de paridad propuesto 0 o 1. Pedir la paridad par correcta y si la propuesta pasa. Respuesta XOR de los cuatro datos, con validación exacta. Error típico: usar paridad impar o ignorar el bit añadido.
- r1: sortear dato 0 o 1 y posición de inversión $j\in\{0,1,2,3\}$, donde 0 significa sin inversión. Mostrar repetición triple recibida; pedir dato y número máximo de inversiones corregibles por grupo. Respuestas: mayoría y 1. Error típico: confiar en el primer bit o decir que tres copias corrigen tres errores.
- r2: sortear cualquiera de los 16 datos de cuatro bits y $j\in\{0,1,2,3,4,5,6,7\}$; codificar con la convención de clase e invertir j si no es cero. Declarar a lo sumo una inversión. Pedir síndrome en orden $s_4s_2s_1$, posición y cuatro datos recuperados. Error típico: leer $s_1s_2s_4$ como índice, corregir un bit de datos por defecto o extraer las primeras cuatro posiciones. Se incluyen errores en las comprobaciones y el bloque sin error.

Cierre: el paquete reconstruido pasa la validación. Teo abre el cuerpo con la credencial del chip. La primera línea nombra El Observatorio; el horario queda debajo de un campo marcado «ventana meteorológica».

> Teo: La copia pasó. Ya puedo abrir el cuerpo.
> Iris: Déjalo completo. Esta vez el horario también entra al expediente.
> Narración: Inés se saca el auricular. En el silencio de la sala se oye el agua correr por el desagüe.

## 8.★ «La ventana» · Repaso del mundo (5 lecturas)

Id: `w8-final`. World: `information`. Module: `w8-closed`. Guía de escena: `ines`; tutora del repaso: `noesis`. El desafío final obligatorio tiene cinco lecturas. La Clase reactiva herramientas; Investigación fija el expediente; las tres rondas de Práctica son preparación antes de esas cinco lecturas, sin agregar lecturas al desafío final.

Escena de apertura (`antenas`, caseta, 06:40; la luz del monitor se refleja en el auricular abandonado): el mensaje está abierto, pero Iris quiere una revisión de las pruebas que llevaron hasta él. Inés quiere que el expediente incluya la copia anterior a su reinicio.

> Inés: Mi autorización queda. El cambio de perfil también.
> Iris: Quedan las dos cosas. El informe aguanta si aguanta cada lectura.
> Tú: La ruta d, la copia original y el paquete validado van juntos.

Clase. Repaso visual, sin conceptos nuevos.

1. Vuelve la bandeja de 64 cabeceras y se ilumina D. NÓESIS: «Recupera la probabilidad antes de leer sus bits». Pizarra: `I(D)=-\log_2(8/64)=3`.
2. Gate: «Arrastra D hasta su hoja». Desbloquea al alcanzar la hoja `111` del árbol P, con radio 24, etiqueta y palabra exactas; se anima el regreso a la raíz. NÓESIS: «La palabra termina donde el árbol lo indica». Pizarra: `c(D)=111;\quad\bar L=H(P)=7/4`.
3. La tabla torre–ruta filtra d y se muestra la barra compartida. Ask: «Con la ruta d conocida, ¿cuántos bits faltan sobre la torre?» [«1», «0», «2»], answer 1. Explicación: solo Sur usa d; 1 corresponde a la torre antes del filtro y 2 a la ruta antes de conocer nada. Pizarra: `H(X\mid Y)=0;\quad I(X;Y)=1`.
4. Las cintas P y Q se alinean con la barra de capacidad del enlace. NÓESIS: «Separa espacio por símbolo de información por uso del canal. Son unidades distintas». Pizarra: `D(P\Vert Q)=5/8\ \mathrm{bits/simbolo};\quad C\approx0{,}1887\ \mathrm{bits/uso}`.
5. Se superponen los grupos de Hamming y luego el sello de validación del paquete. NÓESIS: «El síndrome propone una posición bajo el límite del código. El paquete completo todavía tiene su propia validación». Pizarra: `j=s_1+2s_2+4s_4;\quad(s_4s_2s_1)_2=101_2=5`.

Investigación «El expediente de Las Antenas». Datos fijos: el lote P tiene 64 cabeceras y requiere 112 bits con su código; Q lo lleva a 152. La ruta d determina Sur. El enlace modelado con $p=1/4$ pide $R=1/4$, sobre C. El intento de corrección produjo `1011` y `0100`, y el paquete completo pasó la validación antes de abrirse. La revisión administrativa sitúa el cambio de perfil después del reinicio autorizado por Inés.

- Ask 1: «¿Qué sostiene la afirmación de que Q aumentó el tamaño de este lote?» [«La firma de Inés», «El piloto encendido», «El cálculo 152 − 112 = 40 bits»], answer 2. Explicación: el aumento se demuestra con las longitudes ponderadas; autoría y luces son datos de otra parte del expediente.
- Ask 2: «¿Qué permite incorporar el texto recuperado al informe?» [«La reconstrucción seguida de la validación del paquete», «La entropía alta del mensaje», «Un síndrome cero sin revisar nada más»], answer 0. Explicación: la cadena conserva el original, reconstruye una copia y comprueba el cuerpo completo; ninguna entropía autentica texto.
- Notas: `64\bar L_P=112`; `64\bar L_Q=152`; `64D(P\Vert Q)=40`; `p(S\mid d)=1`; `R=1/4>C(1/4)`.

Práctica de preparación (3 rondas).

- r0: sortear $t\in\{1,2,3,4\}$; lote P de $8t$ cabeceras. Pedir información individual de D y bits totales del código P; respuestas 3 y $14t$. Error típico: multiplicar todo el lote por 3.
- r1: sortear dirección P→Q o Q→P. Pedir costo extra por símbolo; respuestas $5/8$ o $1/2$. Error típico: suponer simetría o usar longitud total como exceso.
- r2: sortear $j\in\{1,2,3,4,5,6,7\}$ e invertir esa posición de `0110011`. Pedir posición de corrección y datos; respuestas j y `1011`, bajo el límite de una inversión. Error típico: corregir siempre el quinto bit porque fue el ejemplo anterior.

Repaso «Cinco lecturas del expediente». Las cinco usan datos fijos de los casos; la práctica anterior ya ofreció variantes. Respuestas numéricas exactas salvo la capacidad, pedida a cuatro decimales con tolerancia 0,0001. Cada lectura bloquea la siguiente hasta corregirse y ofrece una pista ligada al error.

1. Lectura de 8.1–8.2: con conteos $(32,16,8,8)$, entregar información de D y entropía de la fuente. Respuestas $3$ bits y $7/4$ bits/símbolo. Pista: «D es un evento. H promedia todas las etiquetas». Error a detectar: entregar 3 como entropía del conjunto.
2. Lectura de 8.3: decodificar `010110111` con el árbol P y calcular el tamaño de las 64 cabeceras. Respuestas ABCD y 112 bits. Pista: «Corta solo al llegar a una hoja; después pondera los largos por los conteos». Error a detectar: bloques fijos o suma sin frecuencias.
3. Lectura de 8.4–8.5: con la tabla de cuatro celdas equiprobables, entregar $H(Y\mid X)$ y $I(X;Y)$. Respuestas 1 bit y 1 bit; justificar seleccionando «La torre deja dos rutas y la ruta determina la torre», entre esa opción, «Todas las combinaciones son independientes» y «Conocer la torre determina siempre la ruta», answer 0. Pista: «Filtra una fila y después una columna». Error a detectar: condicionar en sentido contrario.
4. Lectura de 8.6–8.7: calcular el exceso de Q para las 64 cabeceras y C del enlace con $p=1/4$; decidir si $R=1/4$ está por debajo o por encima. Respuestas 40 bits, aproximadamente 0,1887 bits/uso y «por encima». Pista: «Resta los largos del lote; para el enlace resta la entropía binaria de uno». Error a detectar: usar el exceso por símbolo como total o la probabilidad de acierto como capacidad.
5. Lectura de 8.8: para `0110111`, entregar síndrome $s_4s_2s_1$, posición y datos corregidos bajo el límite de una inversión. Respuestas `101`, 5, `1011`. Elegir el paso siguiente entre [«Aceptar cualquier mensaje con síndrome cero», «Validar el paquete completo», «Interpretar el síndrome como fecha»], answer 1. Pista: «Las comprobaciones ubican un bit; la autenticidad se revisa en el paquete». Error a detectar: confundir comprobación local con autenticidad.

Escena final (`antenas`, 06:55; la lluvia golpea el plato de reserva). Teo muestra el mensaje validado, descifrado con la credencial del chip:

> Mensaje: «Entrega de vacunas: El Observatorio. 18 de agosto de 2089, de 02:00 a 02:30. Usar ventana de tormenta. Mantener el horario fuera del pronóstico público».
> Teo: La fecha estaba en el cuerpo. La cabecera solo nos trajo hasta esta copia.
> Inés: A mí me pidieron sostener el enlace. Nadie habló de vacunas.
> Iris: Alguien sí miró el cielo antes de fijar la entrega.
> Tú: El pronóstico público para esa ventana sigue despejado.
> Narración: Teo abre el mapa de El Observatorio. En otra pestaña, una estación de ladera registra una ráfaga que el modelo dejó fuera; el aviso oficial conserva su fondo azul.

Transición: Mundo 9 · El Observatorio · Sistemas dinámicos. La entrega quedó fijada para una tormenta que los modelos no predijeron. El nuevo mundo tendrá que investigar cómo evolucionaron las mediciones y por qué el pronóstico se apartó de ellas. No desarrollar sus herramientas en este cierre.

Referencias de control matemático, fuera del diálogo: definiciones y cotas contrastadas con [apuntes de teoría de la información de MIT](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/5d8f16adc3385c9ff2975b121bd620e4_MIT6_441S16_course_notes.pdf); canal contrastado con [clase sobre capacidad y canal binario simétrico](https://ocw.mit.edu/courses/6-441-information-theory-spring-2010/resources/mit6_441s10_lec08/); comprobaciones de Hamming contrastadas con [apuntes sobre corrección de errores de MIT](https://web.mit.edu/6.02/www/s2012/handouts/5.pdf). Los lotes, perfiles, tablas y escenas de este guion son ejemplos propios calculados abajo.

## Verificación numérica

Comprobación ejecutada con `python3`, usando fracciones exactas para probabilidades diádicas y logaritmos base 2 para las entropías. Se recorrieron todos los valores de los rangos de práctica; las permutaciones simultáneas de etiquetas conservan los resultados. Los cálculos repetidos entre casos y final se registran una vez con sus usos. Los valores que funcionan como distractores se identifican como resultados de operaciones equivocadas; no son respuestas válidas.

Los ids, acentos hex, año narrativo, horas de escenas, fecha de entrega, dimensiones del SVG y tolerancias de interfaz son datos de diseño. No se presentan como conclusiones del cálculo. El encabezado cubre ocho casos y un final: $8+1=9$ niveles. El mensaje fija una ventana de $02{:}30-02{:}00=30$ minutos; la fecha es un dato del cuerpo descifrado. Para el arrastre, $24^2=576$; para validar cuatro decimales, el error de redondeo máximo es $1/(2\cdot10^4)=0,00005<0,0001$.

### 8.1 · Evento individual

- $32+16+8+8=64$; $32/64=1/2$, $16/64=1/4$, $8/64=1/8$. Suma: $1/2+1/4+1/8+1/8=1$.
- $-\log_2 1=0$, $-\log_2(1/2)=1$, $-\log_2(1/4)=2$, $-\log_2(1/8)=3$, $-\log_2(1/16)=4$. Es la tabla completa para $k\in\{0,1,2,3,4\}$: $2^k=(1,2,4,8,16)$ y $2^{-k}=(1,1/2,1/4,1/8,1/16)$.
- Gate: $8/2^0=8$, $8/2^1=4$, $8/2^2=2$, $8/2^3=1$; tres divisiones resuelven ocho posibilidades. A ocupa $4/8=1/2$, B $2/8=1/4$, C y D $1/8$ cada uno.
- Comparación D/A: $3-1=2$ bits; $(1/2)/(1/8)=4$ es la razón de probabilidades, no la diferencia de bits.

| Práctica r1: a | d | Probabilidad del primer evento | Probabilidad del segundo | Diferencia de bits | Razón de probabilidades |
|---|---|---|---|---|---|
| 1 | 1 | 1/2 | 1/4 | 2 − 1 = 1 | 2 |
| 1 | 2 | 1/2 | 1/8 | 3 − 1 = 2 | 4 |
| 2 | 1 | 1/4 | 1/8 | 3 − 2 = 1 | 2 |
| 2 | 2 | 1/4 | 1/16 | 4 − 2 = 2 | 4 |

### 8.2–8.3 · Entropía, prefijo y lotes

- Ocho fichas de clase: $4+2+1+1=8$; información total $4\cdot1+2\cdot2+1\cdot3+1\cdot3=14$ bits. Media $14/8=7/4=1,75$.
- Aportes a H: $(1/2)\cdot1=1/2$; $(1/4)\cdot2=1/2$; cada $(1/8)\cdot3=3/8$. Suma $1/2+1/2+3/8+3/8=7/4$.
- Gate equiprobable: $2+2+2+2=8$; cada probabilidad $2/8=1/4$; $H=4\cdot(1/4)\cdot2=2$. Fuente constante: $-1\log_2 1=0$ y tres aportes nulos dan $H=0$.
- Fuentes de práctica: $H(1/2,1/2)=1$; $H(1/2,1/4,1/4)=1/2+1/2+1/2=3/2=1,5$; $H(P)=7/4$. Uniformes de 2, 4 y 8 símbolos: $\log_2m=1,2,3$ respectivamente.
- Huffman: $1/8+1/8=1/4$; $1/4+1/4=1/2$; $1/2+1/2=1$. Las profundidades de A, B, C, D son $(1,2,3,3)$ y ninguna palabra de $(0,10,110,111)$ es prefijo de otra. La suma de sus espacios de prefijo es $2^{-1}+2^{-2}+2^{-3}+2^{-3}=1$.
- Cota en el ejemplo: $H=\bar L=7/4<7/4+1=11/4=2,75$ bits/símbolo. Longitud fija de cuatro símbolos: $\log_2 4=2$ bits/símbolo.
- Lote narrativo: $32\cdot1=32$, $16\cdot2=32$, $8\cdot3=24$ dos veces; $32+32+24+24=112$. También $64\cdot7/4=112$. Código fijo: $64\cdot2=128$; ahorro $128-112=16$ bits.
- Fragmento: `010110111` se separa como `0|10|110|111`, resultado ABCD; largo $1+2+3+3=9$. Leer cada bit con la asignación errada 0→A, 1→B produce `ABABBABBB`. Otros distractores: suma de longitudes sin ponderar $1+2+3+3=9$; media entre etiquetas equiprobables $9/4=2,25$; máximo individual 3.
- Práctica de dos símbolos distintos: hay $4\cdot3=12$ secuencias ordenadas. AB y BA ocupan 3 bits; AC, CA, AD y DA, 4; BC, CB, BD y DB, 5; CD y DC, 6. La decodificación devuelve la secuencia original en las doce. En el árbol inválido, `0` es prefijo de `01`.

La siguiente tabla cubre todas las escalas de lotes de 8.2, 8.3, 8.6 y 8.★. Para $N=8t$: P emite conteos $(4t,2t,t,t)$; Q emite $(t,4t,2t,t)$. «P con Q» significa fuente P y código Q; «Q con P», fuente Q y código P. El código propio de Q también ocupa $14t$ bits. Las prácticas que llegan solo hasta $t=4$ usan las primeras cuatro filas.

| t | N | Código propio | P con Q | Q con P | Exceso P con Q | Exceso Q con P | Fijo de 2 bits | Ahorro propio/fijo |
|---|---|---|---|---|---|---|---|---|
| 1 | 8 | 14 | 19 | 18 | 5 | 4 | 16 | 2 |
| 2 | 16 | 28 | 38 | 36 | 10 | 8 | 32 | 4 |
| 3 | 24 | 42 | 57 | 54 | 15 | 12 | 48 | 6 |
| 4 | 32 | 56 | 76 | 72 | 20 | 16 | 64 | 8 |
| 5 | 40 | 70 | 95 | 90 | 25 | 20 | 80 | 10 |
| 6 | 48 | 84 | 114 | 108 | 30 | 24 | 96 | 12 |
| 7 | 56 | 98 | 133 | 126 | 35 | 28 | 112 | 14 |
| 8 | 64 | 112 | 152 | 144 | 40 | 32 | 128 | 16 |

Operaciones de cada columna: propio $8t\cdot7/4=14t$; P con Q $8t\cdot19/8=19t$; Q con P $8t\cdot9/4=18t$; excesos $19t-14t=5t$ y $18t-14t=4t$; fijo $8t\cdot2=16t$; ahorro $16t-14t=2t$. El resultado equivocado que multiplica todo por la información de D daría $8t\cdot3=24t$ en lugar de $14t$.

### 8.4–8.5 · Tablas, cadena e información mutua

- Tabla narrativa de rutas: $4+4+4+4=16$; cada celda activa $4/16=1/4$. Filas Norte y Sur: $8/16=1/2$ cada una. Columnas a–d: $4/16=1/4$ cada una.
- $H(X)=2\cdot(1/2)\cdot1=1$; $H(Y)=4\cdot(1/4)\cdot2=2$; $H(X,Y)=4\cdot(1/4)\cdot2=2$.
- En Sur: $p(c\mid S)=p(d\mid S)=(1/4)/(1/2)=1/2$. Entropía de cada fila: $2\cdot(1/2)\cdot1=1$; promedio $H(Y\mid X)=(1/2)\cdot1+(1/2)\cdot1=1$.
- En la columna d: $p(S\mid d)=(1/4)/(1/4)=1$; $H(X\mid Y=d)=0$. Todas las columnas determinan su torre, por lo que $H(X\mid Y)=0$.
- Cadena: $1+1=2$ y $2+0=2$. Información mutua: $I(X;Y)=1-0=2-1=1+2-2=1$ bit; el distractor que suma sin descontar da $1+2=3$.
- Tabla de piloto: cuatro pares torre–ruta, dos estados por par y dos apariciones por estado: $4\cdot2\cdot2=16$. Al agrupar torre–piloto, cada celda tiene $2+2=4$, probabilidad $4/16=1/4=(1/2)(1/2)$. Entonces $H(Z)=1$, $H(X,Z)=2$, $H(X\mid Z)=1$ e $I(X;Z)=1+1-2=0$.

| Práctica de rutas exclusivas: k | Torres | Rutas | Pares posibles | Probabilidad conjunta activa | H(X) | H(Y) = H(X,Y) | H(Y dado X) | H(X dado Y) | I |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2 | 4 | 4 | 1/4 | 1 | 2 | 1 | 0 | 1 |
| 2 | 4 | 8 | 8 | 1/8 | 2 | 3 | 1 | 0 | 2 |

Operaciones: torres $2^k$; rutas y pares $2\cdot2^k=2^{k+1}$; información conjunta $\log_2(2^{k+1})=k+1$. Renormalizar una fila da $(1/2^{k+1})/(1/2^k)=1/2$. Contar como posibles los cruces vacíos daría $\log_2(2^k\cdot2^{k+1})=2k+1$, es decir, 3 o 5; esos son errores.

Para la práctica producto uniforme con $a,b\in\{1,2,3\}$: hay $2^{a+b}$ pares y cada uno pesa $2^{-(a+b)}$; $H(X)=a$, $H(Y\mid X)=b$, $H(X,Y)=a+b$. La tabla enumera todos los resultados solicitados:

| a \ b | 1 | 2 | 3 |
|---|---|---|---|
| 1 | 2 | 3 | 4 |
| 2 | 3 | 4 | 5 |
| 3 | 4 | 5 | 6 |

Los valores distintos de $a+b$ son 2, 3, 4, 5 y 6; corresponden a 4, 8, 16, 32 y 64 pares con probabilidades 1/4, 1/8, 1/16, 1/32 y 1/64. Multiplicar entropías sería otra operación: $ab$ en lugar de $a+b$; cuando coinciden numéricamente, el diagnóstico debe pedir la regla de la cadena, sin atribuir un error solo por el valor.

Práctica de información mutua:

- Copia exacta, $k\in\{1,2,3\}$: $H(X)=H(Y)=H(X,Y)=k$ y $I=k+k-k=k$, resultados 1, 2 y 3; cantidades de símbolos 2, 4 y 8.
- Independientes, $(a,b)=(1,1),(1,2),(2,1),(2,2)$: $H(X,Y)=2,3,3,4$ respectivamente; en cada pareja $I=a+b-(a+b)=0$.
- Y contiene X más un bit independiente: con $k=1$, $(H(X),H(Y),H(X,Y))=(1,2,2)$ y $(I,H(Y\mid X))=(1,1)$; con $k=2$, las ternas son $(2,3,3)$ y las respuestas $(2,1)$.

### 8.6 · Código ajeno y asimetría

- Q suma $1/8+1/2+1/4+1/8=1$. Sus códigos $(110,0,10,111)$ tienen largos $(3,1,2,3)$; costo propio $H(Q)=(1/8)\cdot3+(1/2)\cdot1+(1/4)\cdot2+(1/8)\cdot3=7/4$.
- Fuente P con código Q: $L_Q(P)=(1/2)\cdot3+(1/4)\cdot1+(1/8)\cdot2+(1/8)\cdot3=12/8+2/8+2/8+3/8=19/8=2,375$.
- Cocientes $P_i/Q_i=(4,1/2,1/2,1)$; logaritmos $(2,-1,-1,0)$. Aportes ponderados $(1,-1/4,-1/8,0)$; suma $1-1/4-1/8=5/8=0,625$. También $19/8-7/4=19/8-14/8=5/8$.
- Lote mínimo: $4\cdot3+2\cdot1+1\cdot2+1\cdot3=19$; $19-14=5$ bits. Lote narrativo: $32\cdot3+16\cdot1+8\cdot2+8\cdot3=96+16+16+24=152$; $152-112=40$; $64\cdot5/8=40$.
- Dirección inversa: $Q_i/P_i=(1/4,2,2,1)$ y logaritmos $(-2,1,1,0)$. $D(Q\Vert P)=-(1/8)\cdot2+(1/2)\cdot1+(1/4)\cdot1= -1/4+1/2+1/4=1/2=0,5$.
- $L_P(Q)=(1/8)\cdot1+(1/2)\cdot2+(1/4)\cdot3+(1/8)\cdot3=1/8+1+3/4+3/8=9/4=2,25$. Restar $H(Q)=7/4$ da $1/2$; para 64 símbolos, $64\cdot9/4=144$ y $144-112=32$.
- Igualdad: $D(P\Vert P)=\sum_iP_i\log_2 1=0$; cota no negativa en estos perfiles: $\sum_iQ_i=1$ y $-\log_2 1=0$. La permutación simultánea de A–D tiene $4!=24$ posibilidades; en todas conserva ambos costos. Escalas de práctica y preparación final: tabla de lotes anterior.

### 8.7 · Entropía binaria, capacidad y tasa

Las expresiones exactas para los valores no enteros son $h_2(1/8)=3-(7/8)\log_2 7$, $C(1/8)=-2+(7/8)\log_2 7$, $h_2(1/4)=2-(3/4)\log_2 3$ y $C(1/4)=-1+(3/4)\log_2 3$. Se evaluó primero la expresión exacta y después se redondeó a cuatro decimales. No calcular bits por segundo multiplicando una capacidad ya redondeada.

| p | 1 − p | h₂(p) | C = 1 − h₂(p) | 100h₂(p) | 100C |
|---|---|---|---|---|---|
| 0 | 1 | 0 | 1 | 0 | 100 |
| 1/8 | 7/8 | ≈ 0,5436 | ≈ 0,4564 | ≈ 54,3564 | ≈ 45,6436 |
| 1/4 | 3/4 | ≈ 0,8113 | ≈ 0,1887 | ≈ 81,1278 | ≈ 18,8722 |
| 1/2 | 1/2 | 1 | 0 | 100 | 0 |
| 1 | 0 | 0 | 1 | 0 | 100 |

- Calibración: $16+16=32$ usos; $4+4=8$ inversiones; $4/16=1/4$ en cada tipo de entrada y $8/32=1/4$ en conjunto. Conservaciones $32-8=24$, fracción $24/32=3/4$.
- Gate: con $p=0$, cada entrada determina la salida; con $p=1/2$, cada fila es $(1/2,1/2)$. Entrada uniforme da salida uniforme, $H(Y)=1$; por tanto $I(X;Y)=1-h_2(p)$.
- Tasas narrativas a 100 usos/s: $100/16=25/4=6,25$; $100/4=25$; $100/8=25/2=12,5$ bits útiles/s. Razón nueva/anterior $(1/4)/(1/16)=4$.
- Comparaciones: $1/16=0,0625<C(1/4)$; $1/8=0,125<C(1/4)$; $1/4=0,25>C(1/4)$. Por segundo: $6,25<18,8722$, $12,5<18,8722$, $25>18,8722$, conservando el valor exacto al validar.

| Práctica r1: p | R = 1/8 | R = 1/4 | R = 1/2 |
|---|---|---|---|
| 1/8 | Bajo C | Bajo C | Sobre C |
| 1/4 | Bajo C | Sobre C | Sobre C |

Práctica r2: $16t$ usos/s con $t=1,2,3,4$ da 16, 32, 48 y 64. Con $p=0$, multiplicar por C = 1 conserva esos cuatro valores; con $p=1/2$, multiplicar por C = 0 entrega cero en todos. Distractor del acierto: $1-1/4=3/4=0,75$, distinto de C. Distractor de entropía por segundo: $100h_2(1/4)\approx81,1278$, distinto de $100C$.

### 8.8 · Paridades, síndromes y corrección

- `1011` tiene $1+0+1+1=3$ unos; paridad par $3\bmod2=1$; `10111` tiene $3+1=4$ unos. Cada inversión cambia el total módulo 2; dos inversiones cambian la paridad dos veces y la dejan igual.
- Repetición: mayoría de `101` = 1, con $1+0+1=2$ votos frente a uno; $2>3/2$. Tasas: repetición $1/3$ y Hamming $4/7$; ambas son mayores que $C(1/4)\approx0,1887$. No se las identifica con códigos que alcancen la capacidad.
- Para datos $(d_1,d_2,d_3,d_4)=(1,0,1,1)$: $p_1=(1+0+1)\bmod2=0$; $p_2=(1+1+1)\bmod2=1$; $p_4=(0+1+1)\bmod2=0$. Palabra $(0,1,1,0,0,1,1)$ = `0110011`.
- Recibida `0110111`: $s_1=(0+1+1+1)\bmod2=1$; $s_2=(1+1+1+1)\bmod2=0$; $s_4=(0+1+1+1)\bmod2=1$. Índice $1+2\cdot0+4\cdot1=5$; orden $s_4s_2s_1=101$. Cambiar posición 5 devuelve `0110011`; comprobaciones $s_1=(0+1+0+1)\bmod2=0$, $s_2=(1+1+1+1)\bmod2=0$, $s_4=(0+0+1+1)\bmod2=0$. Datos en 3, 5, 6, 7: `1011`.
- Segundo bloque, datos `0100`: $p_1=(0+1+0)\bmod2=1$, $p_2=(0+0+0)\bmod2=0$, $p_4=(1+0+0)\bmod2=1$; palabra `1001100`. Recibida `1001000`: $s_1=(1+0+0+0)\bmod2=1$, $s_2=(0+0+0+0)\bmod2=0$, $s_4=(1+0+0+0)\bmod2=1$; índice 5. Corregida `1001100`: grupos con sumas 2, 0 y 2, todos pares; datos `0100`. El distractor que extrae las primeras cuatro posiciones obtiene `1001`. Cambiar equivocadamente posición 4 de `1001000` produce `1000000`, cuyos datos extraídos son `0000`.
- Contraejemplo de dos inversiones: `0110011` con posiciones 1 y 2 invertidas da `1010011`. Grupos con sumas 3, 3 y 2; $(s_1,s_2,s_4)=(1,1,0)$, índice $1+2=3$, síndrome `011`. Cambiar el tercer bit da `1000011`, grupos con sumas 2, 2 y 2, síndrome `000`; datos `0011`, distintos de `1011`. Eso comprueba el límite del intento de corrección.

La tabla siguiente enumera los 16 mensajes posibles, $2^4=16$. La columna de paridades se lee $p_1p_2p_4$, a diferencia del síndrome, que se lee $s_4s_2s_1$. En todas las palabras codificadas, el síndrome es `000`.

| Datos | p₁p₂p₄ | Palabra Hamming |
|---|---|---|
| `0000` | `000` | `0000000` |
| `0001` | `111` | `1101001` |
| `0010` | `011` | `0101010` |
| `0011` | `100` | `1000011` |
| `0100` | `101` | `1001100` |
| `0101` | `010` | `0100101` |
| `0110` | `110` | `1100110` |
| `0111` | `001` | `0001111` |
| `1000` | `110` | `1110000` |
| `1001` | `001` | `0011001` |
| `1010` | `101` | `1011010` |
| `1011` | `010` | `0110011` |
| `1100` | `011` | `0111100` |
| `1101` | `100` | `1010101` |
| `1110` | `000` | `0010110` |
| `1111` | `111` | `1111111` |

Para cualquiera de esas palabras, la siguiente tabla cubre los ocho estados permitidos por la práctica: ausencia de error o una inversión. El síndrome de un error es la representación binaria de su posición porque las comprobaciones de esa columna coinciden con los bits del índice.

| Posición invertida j | s₁ | s₂ | s₄ | s₄s₂s₁ | s₁ + 2s₂ + 4s₄ | Acción |
|---|---|---|---|---|---|---|
| 0, sin inversión | 0 | 0 | 0 | `000` | 0 | Conservar |
| 1 | 1 | 0 | 0 | `001` | 1 | Invertir 1 |
| 2 | 0 | 1 | 0 | `010` | 2 | Invertir 2 |
| 3 | 1 | 1 | 0 | `011` | 3 | Invertir 3 |
| 4 | 0 | 0 | 1 | `100` | 4 | Invertir 4 |
| 5 | 1 | 0 | 1 | `101` | 5 | Invertir 5 |
| 6 | 0 | 1 | 1 | `110` | 6 | Invertir 6 |
| 7 | 1 | 1 | 1 | `111` | 7 | Invertir 7 |

Se verificaron $16\cdot8=128$ escenarios: todos recuperan la palabra y los datos originales bajo el límite indicado. También se compararon $16\cdot15/2=120$ pares de palabras válidas: distancia mínima 3. La práctica de paridad recorre $16\cdot2=32$ propuestas; una pasa exactamente cuando el bit propuesto coincide con el XOR de datos. Repetición recorre $2\cdot4=8$ escenarios: para dato 0 recibe `000`, `100`, `010` o `001`, siempre con mayoría 0; para dato 1 recibe `111`, `011`, `101` o `110`, siempre con mayoría 1. La preparación final recorre las siete inversiones de `0110011`; aplica la misma tabla y recupera `1011` en todas.

### 8.★ · Resultados de las cinco lecturas

| Lectura | Cálculo | Resultado |
|---|---|---|
| 1 | $-\log_2(8/64)$ y $\sum p_i(-\log_2p_i)$ | 3 bits; 7/4 = 1,75 bits/símbolo |
| 2 | `0|10|110|111`; $32\cdot1+16\cdot2+8\cdot3+8\cdot3$ | ABCD; 112 bits |
| 3 | $H(Y\mid X)=2-1$; $I(X;Y)=1+2-2$ | 1 bit; 1 bit |
| 4 | $152-112$; $1-[2-(3/4)\log_2 3]$; comparar con 1/4 | 40 bits; C ≈ 0,1887 bits/uso; R sobre C |
| 5 | $(s_1,s_2,s_4)=(1,0,1)$; $1+2\cdot0+4\cdot1$; extraer 3, 5, 6, 7 tras corregir | Síndrome `101`; posición 5; datos `1011`; validar paquete completo |
