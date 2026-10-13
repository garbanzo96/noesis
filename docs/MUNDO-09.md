# Mundo 9 · El Observatorio · Sistemas dinámicos · guion completo

Autor del guion: Codex, 2026-10-12. Guion para `src/content/w09/`, con la estructura de `src/content/w07/`: un archivo por caso, apertura, `lesson`, `demo`, `challenge` de 3 rondas y cierre; `final.tsx` con repaso de 5 lecturas; `kit.tsx`, `ref.ts`, `index.ts` y `withLesson`. Reglas de escritura: `docs/NARRATIVA.md`. Este documento propone la implementación; no modifica código.

World id: `dynamics`. Casos: `w9-c1`…`w9-c8`; final: `w9-final`, module `w9-closed`. Guía de investigación: `elena`; clases: `noesis`. Propuesta para `src/content/sectors.ts`: cambiar solo el `accent` de `dynamics` a `#e7df5a`, amarillo azufre. Es distinto de los acentos de los mundos anteriores y queda separado del violeta o lila nuevo de Las Antenas.

Todos los cálculos se recogen en «Verificación numérica». Los resultados exactos mandan sobre sus aproximaciones. En texto y etiquetas se usa coma decimal; en TeX, `{,}`. Los horarios son datos del registro, no resultados del modelo.

## Historia

Valparaíso, 2089. El chip que Tomás sacó de la quebrada Jaime estaba entero; la caja térmica ya estaba vacía. En Las Antenas, la agencia recuperó los mensajes del chip durante la madrugada del 17 de agosto. Uno fijaba la entrega de vacunas en El Observatorio para el 18 de agosto, durante la ventana de tormenta de 02:00 a 02:30. El boletín público todavía anunciaba una noche tranquila cuando Halcón confirmó esa entrega.

Fechas del expediente: la exportación privada, el acuse y las modificaciones públicas son del 17 de agosto. Las escenas de este mundo, las mediciones de la tormenta y la entrega son del 18 de agosto. El pronóstico privado del día anterior incluye condiciones iniciales previstas para la 01:00 del día de la entrega; después se contrastan con las mediciones. La agencia llega al Observatorio a las 02:20, cuando la carga ya salió hacia la Clínica.

La agencia llega al Observatorio después de iniciada la tormenta. El papel del registrador muestra lo que la pantalla pública borró. Alguien tenía una salida privada del pronóstico antes de la publicación. La matemática permite reconstruir qué información se conservó, qué cálculo se degradó y qué ajustes se cambiaron. La responsabilidad se establece con registros de acceso y copias firmadas, además de los cálculos.

Personaje nuevo: `elena`, Elena Saavedra, técnica del registrador meteorológico y encargada de calibración del turno nocturno. Color: `#e7df5a`. Voz: habla desde el instrumento, identifica una falla por el movimiento o el ruido; se demora antes de decir quién firmó. Protege a su compañera, que validó el boletín con una pantalla incompleta. «La aguja volvió a cruzar la marca. En la copia quedó una raya derecha». No imparte la clase; entrega datos y objeta conclusiones apresuradas.

Retrato compatible con `Look`: `jaw: 'oval'`, `skin: '#c48f6a'`, `shade: '#9e6b4b'`, `hair: '#d7d2c7'`, `hairStyle: 'short'`, `iris: '#394e49'`, `brows: 'flat'`, `mouth: 'firm'`, `outfit: 'field'`, `cloth: '#243437'`, `cloth2: '#e7df5a'`, `age: true`. Pelo corto canoso, chaqueta de terreno gastada. `extra` nuevo: lápiz detrás de la oreja y una credencial colgada, ambos con trazos SVG; usar el color del personaje para el borde de la credencial. No requiere un `Outfit` nuevo.

Lugar nuevo: `observatorio`, Observatorio meteorológico del cerro, propuesto para `PlaceId` y `PLACES` en `src/art/places.tsx`. Fondo SVG 1600×900: cúpula oscura abierta hacia el puerto, ventanal con lluvia inclinada, pluviómetro y veleta en silueta, mesa con tambor de papel, consolas bajas. Una pantalla amarilla ilumina el rollo; la consola del boletín queda más lejos, azul y tenue. Las vistas del taller, archivo de calibración y sala de consolas son encuadres de este mismo fondo. El exterior de la Clínica del Cerro usa `cerros` con una placa superpuesta en la futura escena, sin inventar un fondo clínico que ya exista.

Los sistemas son modelos reducidos de diagnóstico o bancos de calibración. Sus parámetros y unidades se presentan en cada caso. Ninguna curva de clase pretende describir toda la atmósfera. Las proyecciones recuperadas son pistas sobre las condiciones previstas; el registro de entrega comprueba lo que efectivamente ocurrió.

## Arco

- 9.1 El papel conserva una subida incompatible con la pendiente del boletín. Aparece un canal original excluido de la publicación.
- 9.2 Su crecimiento alcanza el umbral en el comienzo de la ventana del chip. La firma de la salida privada es anterior a la entrega.
- 9.3 El exportador público usó un paso grueso y dejó un índice bajo el umbral. La copia privada conserva pasos más cortos.
- 9.4 Un búfer lleno parece quieto aunque siga sustituyendo datos. Se recupera el paquete que estaba detrás de la lectura constante.
- 9.5 La copia pública convierte una dirección creciente en decreciente. El cambio está en una entrada de la matriz, no en la medición inicial.
- 9.6 Otro canal pasa de espiral saliente a entrante. Los accesos vinculan ambos cambios con una credencial de Halcón.
- 9.7 La oscilación del registrador físico confirma que la medición original sobrevivió y fija la hora de descarga.
- 9.8 Dos estados casi iguales se separan bajo la misma regla. La precisión recortada limita el pronóstico público; la salida privada conservó más cifras. Los recibos enlazan esa salida con la entrega en el Observatorio y el traslado a la Clínica.
- 9.★ La agencia revisa cinco lecturas, reconstruye la cadena documental y encuentra la recepción de las vacunas. En la Clínica, una técnica guarda un test que da positivo demasiadas veces.

## Kit (`src/content/w09/kit.tsx`)

Todo se dibuja dentro de `Stage`, SVG 1600×900. Reservar el lado izquierdo para la imagen y el derecho para perillas, asks y `Cap`. Reutilizar `plane`, `Axes`, `Dot`, `Knob`, `Choices`, `NumberField`, `Confirm` y helpers de azar con semilla. Las fórmulas llegan después de la primera manipulación de cada concepto.

- `DirectionField({ P, f, times, levels })`: segmentos con dirección `(1,f(t,y))`, normalizados visualmente. Siempre mostrar el avance positivo del tiempo; los segmentos indican pendiente, no desplazamientos de magnitud fija. `SolutionTrace({ P, solution, t0, t1, cursor })` dibuja una curva exacta y su tangente en el cursor.
- `SignalPlot({ P, curves, threshold, clock })`: curvas temporales, línea de umbral y reloj de origen explícito; admite expresiones exactas y etiquetas aproximadas.
- `EulerWalk({ P, f, initial, h, end, exact })`: poligonal con nodos; animar cada avance horizontal y su cambio vertical. Comparar siempre en el mismo tiempo final. No llamar exacta a la poligonal.
- `PhaseLine({ P, f, roots, domain, probe })`: eje del estado, flechas de signo a ambos lados y equilibrio hueco o lleno según estabilidad. `BufferStrip({ occupancy, incoming, outgoing })`: casillas que se reemplazan aun cuando el total ocupado permanece igual.
- `LinearPhase({ P, A, initial, exact, eigenDirections })`: flechas `Ax`, trayectorias con tiempo y direcciones propias. Los ejes son componentes del estado; el tiempo se muestra en un reloj aparte. `TraceDetBoard({ A, tau, det, discriminant })` enlaza matriz, plano traza–determinante y retrato.
- `DampedInstrument({ q, v, c, elapsed })`: aguja y amortiguador, con gráfico de posición frente al tiempo y retrato `(q,v)`. El cero es la posición de reposo, no una cantidad negativa de lluvia.
- `LogisticMap({ r, seeds, n, P })`: gráfica de la parábola, diagonal, escalera de iteración y series superpuestas. Diferenciar `r` del mapa de la tasa logística continua del caso 9.4.
- Helpers: `euler(f,t0,y0,h,n)`; `logisticStep(r,x)`; `trace2(A)`; `det2(A)`; `eigen2(A)` mediante el polinomio característico; `linearExact(A,x0,t)` para las familias especificadas; soluciones cerradas del oscilador; `fmt` con coma; `distance` y comparadores por componente. Integración numérica solo para trayectorias decorativas, con paso interno fijo y etiqueta «trazo numérico»; las respuestas usan fórmulas exactas.

Convenciones de evaluación: `answer` es índice desde 0. Cada Ask tiene tres opciones y una explicación después de responder; barajar opciones actualiza el índice. Práctica numérica: tolerancia absoluta 0,005 por campo, salvo indicación propia. Fracciones y expresiones exactas se ofrecen como opciones cuando el campo numérico no las acepta. Los conjuntos de azar son discretos, con elección uniforme; no se generan reales arbitrarios. Los gates tienen su tolerancia propia y nunca se abren por esperar.

## 9.1 «El papel mojado» · Ecuaciones diferenciales y campo de direcciones

Id: `w9-c1`.

Escena de apertura (`observatorio`, 02:20; el papel húmedo raspa al salir del tambor): Elena sostiene el rollo para que Iris no lo arranque. Necesita conservarlo como respaldo del turno; la consola ofrece sobrescribirlo con el boletín.

Elena: «Mira la subida del trazo. La pantalla dejó la aguja horizontal».
Iris: «La pantalla tuvo mejor noche que nosotros».
Tú: «Guardemos el papel antes de tocar la consola».

Clase. NÓESIS usa un depósito de demostración: nivel $y$ en cm, tiempo $t$ en minutos. El aporte neto depende del reloj: $y'=2t$, con $y(0)=1$.

1. Se ve el depósito y una tira de tiempo; el nivel sube cada vez más rápido. NÓESIS: «La altura y la rapidez de subida son datos distintos». Todavía sin ecuación diferencial. Pizarra: `t:\text{ minutos},\quad y:\text{ cm}`.
2. Gate: arrastrar el cursor temporal por la tira, de 0 a 2, y girar la perilla de pendiente, de 0 a 4. En $t=1$, alinear el segmento con la subida marcada. Desbloquea si $|t-1|\le0{,}02$ y $|m-2|\le0{,}05$. El nivel real en ese instante queda en 2; la punta del segmento puede moverse sin cambiarlo. NÓESIS: «Inclina la flecha hasta que acompañe el trazo». Pizarra: `\text{pendiente en }t=1:\ 2`.
3. Aparece una cuadrícula con la pendiente correspondiente a cada punto. Todas las flechas de una misma columna tienen igual inclinación en este ejemplo. NÓESIS: «Una ecuación diferencial da la pendiente que debe tener la solución en cada lugar». Pizarra: `y'=f(t,y),\qquad f(t,y)=2t`.
4. Animar la curva que empieza en el nivel elegido; su tangente sigue las flechas. NÓESIS: «El valor inicial elige por dónde parte la curva». Pizarra: `y(t)=1+t^2,\quad y(0)=1,\quad y'=2t`.
5. Ask: «En $t=2$, ¿qué indica la flecha?» [«Que el nivel vale 4 cm», «Que el nivel sube a 4 cm/min», «Que el nivel subió 2 cm en total»], answer 1. Explicación: la pendiente vale $2\cdot2=4$; el nivel de esta solución vale 5 cm. NÓESIS señala ambos indicadores. Pizarra: `y'(2)=4,\quad y(2)=5`.
6. Cambiar el inicio a 3 cm desplaza la curva hacia arriba sin cambiar las flechas. NÓESIS: «Las dos curvas cumplen la misma regla de pendientes». Pizarra final: `y(t)=C+t^2;\quad y(0)=C`.

Investigación «La columna borrada». Canal original: nivel de agua de un colector de prueba, $H(t)=3+t^2$ cm, reloj local $t=0$ a las 01:00; dominio $0\le t\le2$ min. En $t=1$, el papel marca 4 cm y pendiente 2 cm/min. El boletín exportó nivel 4 cm con pendiente 0. La cabecera del canal identifica la copia original como «entrada auxiliar».

Ask 1: «¿Qué flecha debe acompañar el papel en ese punto?» [«Horizontal, pendiente 0», «Pendiente 4», «Pendiente 2»], answer 2. Explicación: $H'=2t$; 4 es el nivel, no su rapidez de cambio.
Ask 2: «¿Cuál de estas curvas conserva el inicio de 3 cm y esas pendientes?» [«$3+t^2$», «$3+2t$», «$t^2$»], answer 0. Explicación: la segunda usa pendiente constante; la tercera pierde la condición inicial.
Notas: `H(0)=3,\ H(1)=4,\ H'(1)=2`; `H(t)=3+t^2\Rightarrow H'(t)=2t`.

Práctica, 3 rondas:
- r0: elegir $a\in\{1;2;3\}$, $b\in\{0;1;2\}$ y $t_*\in\{1;2\}$. Se da $y'=at+b$ y un nivel marcado de $at_*+b+1$. Pedir la pendiente: $at_*+b$. Error típico: responder el nivel del punto; queda siempre una unidad sobre la respuesta.
- r1: elegir $C\in\{2;3\}$ y $t_*\in\{1;2\}$. Para $y'=2t$, $y(0)=C$, pedir $y(t_*)=C+t_*^2$. Error típico: responder $2t_*$ o perder $C$.
- r2: elegir $C\in\{1;2;3\}$. Dar $y'=2t$, $y(0)=C$ y elegir entre $C+t^2$, $C+2t$, $t^2$. Correcta: $C+t^2$. Error típico: creer que basta cumplir la pendiente o el inicio por separado.

Cierre (`observatorio`; Elena tapa el botón de sobrescritura con la mano): Teo abre la cabecera recuperada.
Teo: «El canal auxiliar salió a una dirección de Halcón. La pantalla del turno ni lo menciona».
Elena: «Mi compañera firmó lo que pudo ver».
Iris mira el rollo: «Entonces habrá que leer lo que le escondieron».

## 9.2 «El horario reservado» · Crecimiento y decaimiento exponencial

Id: `w9-c2`.

Escena de apertura (`observatorio`, 02:30; una luz de respaldo zumba sobre la mesa): Teo encuentra una señal que crece por proporciones y una batería de calibración que pierde carga. Elena quiere comprobar el reloj antes de aceptar la hora de la entrega.

Teo: «¡La cabecera guarda el valor inicial y la tasa! Con eso puedo dibujar la curva completa».
Iris: «Primero la hora».
Elena: «El reloj lo contrasté con la radio del puerto».

Clase. Señal normalizada $y$, tiempo en horas. Crecimiento: $y'=y$, $y(0)=2$. Decaimiento: $z'=-z$, $z(0)=8$.

1. Dos barras: una recibe un aporte proporcional a lo que ya tiene; la otra pierde una parte de su nivel. Animar ambas desde el mismo reloj. NÓESIS: «Con el mismo factor, una barra grande cambia más por hora». Pizarra: `\text{cambio proporcional al nivel}`.
2. Gate: perilla del tiempo en $[0;1]$. La barra decreciente permite mover un marcador a su mitad, 4. Desbloquea si $|t-\ln2|\le0{,}01$ y $|8e^{-t}-4|\le0{,}05$. NÓESIS: «Detén el reloj cuando quede la mitad». Pizarra: `z(t)=4`.
3. Las flechas se empinan según la altura de la barra; presentar la tasa $k$ y la solución. NÓESIS: «$k$ es la tasa por unidad de tiempo. Su signo decide crecimiento o decaimiento». Pizarra: `y'=ky,\quad y(t)=y_0e^{kt}`. Comprobar en pantalla que $y(0)=y_0$ y que al derivar vuelve $ky$.
4. Mostrar las curvas de clase y sus inicios. Ask: «Para $y'=y$, $y(0)=2$, ¿cuál es la solución?» [«$e^t$», «$2+t$», «$2e^t$»], answer 2. Explicación: $e^t$ empieza en 1 y $2+t$ tiene pendiente constante. Pizarra: `y(1)=2e,\quad z(1)=8e^{-1}`.
5. Repetir la animación de la mitad; cada intervalo igual reduce otra mitad. NÓESIS: «La vida media mide el tiempo, aunque cambie el nivel inicial». Pizarra: `T_{1/2}=\frac{\ln2}{|k|}\quad(k<0)`; aquí $T_{1/2}=\ln2$ h.
6. Mostrar una señal con $k=\ln2$ por hora y nivel inicial 4. En una hora pasa a 8. NÓESIS: «El reloj empieza donde se tomó el dato inicial». Pizarra final: `4e^{(\ln2)t}=4\cdot2^t`.

Investigación «La ventana del chip». Modelo reducido del canal de intensidad de lluvia: $R'=(\ln2)R$, $R(0)=4$ mm/h; $t$ en horas desde la 01:00 del 18 de agosto. Umbral operativo de ocultación visual: $R=8$ mm/h. La salida privada se firmó a las 00:00 del 17 de agosto con esa condición inicial prevista; la medición del día de la entrega confirmó el inicio. El acuse enlazado al mensaje recuperado en Las Antenas confirmó la reserva a las 00:10 del 17, para 02:00–02:30 del 18. El registro observado a las 02:00 marca 8 mm/h.

Ask 1: «¿Cuándo alcanza 8 según esta salida?» [«A las 01:30», «A las 02:00», «A la 03:00»], answer 1. Explicación: $4\cdot2^t=8$ da $t=1$ h desde las 01:00.
Ask 2: «En el banco de batería, $z'=-z$ y $z(0)=8$. ¿Cuánto queda tras una vida media?» [«4», «$8e^{-1}$», «0»], answer 0. Explicación: una vida media dura $\ln2$ h en ese banco; una hora deja $8e^{-1}$, que es otro valor.
Notas: `4e^{(\ln2)t}=8\Rightarrow t=1\ \mathrm h`; `8e^{-\ln2}=4`; `00{:}10<01{:}00<02{:}00`.

Práctica, 3 rondas:
- r0: elegir $y_0\in\{2;4;8\}$, $s\in\{-1;1\}$ y $n\in\{1;2\}$; $k=s\ln2$ h$^{-1}$, pedir $y(n)=y_0\,2^{sn}$. Error típico: sumar $kn$ al inicio en vez de multiplicar por el factor.
- r1: elegir $a\in\{1;2;4\}$, con $k=-\ln2/a$ h$^{-1}$. Pedir vida media $a$ h. Error típico: usar $k$ sin valor absoluto y dar tiempo negativo.
- r2: elegir $a\in\{1;2\}$, $y_0\in\{4;8\}$ y $n\in\{1;2\}$; $k=-\ln2/a$. Descartar combinaciones con $na=y_0/2^n$. Pedir el tiempo para llegar a $y_0/2^n$: $na$ h. Error típico: confundir una mitad con varias mitades o responder el nivel restante como tiempo.

Cierre: Teo pone la firma privada junto al mensaje del chip.
Iris: «Confirmaron la entrega antes de que el turno recibiera el primer dato».
Elena abre el historial del exportador: «También cambiaron cuánto avanzaba el reloj entre cálculos».

## 9.3 «El paso largo» · Método de Euler

Id: `w9-c3`.

Escena de apertura (`observatorio`, 02:40; el ventilador de la consola roza su carcasa): el archivo original cabe en la memoria de Teo, pero la exportación pública salta entre muestras. Elena teme que culpen al computador viejo por un ajuste que alguien eligió.

Elena: «La máquina aguanta pasos más cortos. Los dejé guardados».
Tú: «Comparemos las dos salidas en la misma hora».

Clase. Depósito de prueba normalizado: $y'=y$, $y(0)=1$, de $t=0$ a $t=1$; tiempo en horas.

1. Una flecha tangente sale del punto inicial y se prolonga como una regla recta. La curva exacta se dobla y se aparta. NÓESIS: «Podemos avanzar un trecho con la pendiente que conocemos». Pizarra: `\text{paso horizontal }h`.
2. Gate: perilla de $h$ con valores $1$, $1/2$, $1/4$. Cada cambio rehace la poligonal hasta el mismo final $t=1$. Desbloquea con $|h-1/4|\le0{,}001$ y al arrastrar el cursor al último nodo, $|t-1|\le0{,}01$. NÓESIS: «Acorta el paso y mira cuánto se acerca el final». Pizarra: `h=1/4`.
3. Animar avance horizontal $h$ y luego cambio vertical pendiente por paso. NÓESIS: «Euler recalcula la pendiente en cada nodo. La usa durante el próximo paso». Pizarra: `t_{n+1}=t_n+h,\quad y_{n+1}=y_n+h f(t_n,y_n)`.
4. Mostrar $y_1=2$ para $h=1$ y $y_2=9/4$ para $h=1/2$. Ask: «Con $h=1/2$, ¿cuál es el primer cambio vertical desde $y_0=1$?» [«1», «$1/2$», «$3/2$»], answer 1. Explicación: $hf=(1/2)\cdot1=1/2$; $3/2$ es el nuevo nivel. Pizarra: `y_1=1+\frac12=\frac32`.
5. Superponer la referencia $e^t$: a $t=1$, Euler da 2; $9/4$; $625/256$ según el paso. NÓESIS: «Aquí el error final aumenta al agrandar el paso». Pizarra: `E_h=|e-(1+h)^{1/h}|` para estos pasos. Los errores aproximados son 0,718282; 0,468282; 0,276876.
6. Distinguir paso y horizonte. NÓESIS: «Comparaste en el mismo tiempo final. Un paso chico suele ayudar, dentro de un rango estable y con una regla suave». Explicar que esto no garantiza que cualquier ecuación tolere cualquier paso. Pizarra final: `\text{Euler aproxima; la referencia permite medir el error}`.

Investigación «El índice que no cruzó». Banco de validación del exportador: índice de alerta $Q'=Q$, $Q(0)=4$, tiempo en horas, horizonte $t=1$. Esta es una prueba del cálculo, distinta del canal $R$ anterior. Umbral: $Q=10$. Archivo público: $h=1$ h. Archivo privado: $h=1/8$ h. Referencia exacta: $Q(1)=4e$. El ajuste público queda bajo el umbral; el privado lo supera. La configuración guarda la casilla «usar para boletín» junto al paso público.

Ask 1: «¿Qué publicó Euler con un solo paso?» [«$4e$», «12», «8»], answer 2. Explicación: $4+1\cdot4=8$; el cambio es 4 y el nivel final es 8.
Ask 2: «¿Qué salida del banco supera el umbral?» [«La de $h=1/8$, con $4(9/8)^8$», «La de $h=1$, con 8», «Ambas dan lo mismo porque usan la misma regla»], answer 0. Explicación: la primera vale aproximadamente 10,263138; la referencia es aproximadamente 10,873127. Compartir la ecuación no iguala los errores numéricos.
Notas: `Q^E_1=4+4=8<10`; `Q^E_8=4(9/8)^8\approx10{,}263138>10`; `Q(1)=4e\approx10{,}873127`.

Práctica, 3 rondas:
- r0: elegir $y_n\in\{2;4;8\}$, $k\in\{-1;1\}$ y $h\in\{1/4;1/2\}$. Para $y'=ky$, pedir un paso $y_{n+1}=y_n(1+hk)$. Error típico: omitir $h$.
- r1: elegir $y_0\in\{4;8\}$ y $h=1/2$ para $y'=y$. Pedir el valor tras dos pasos, $y_2=9y_0/4$. Error típico: usar la pendiente inicial en ambos pasos y dar $2y_0$.
- r2: elegir $y_0\in\{1;2;4\}$; comparar a $t=1$ los pasos $h=1$ y $h=1/2$, con referencia $y_0e$. Pedir cuál tiene menor error y cuánto vale su aproximación: $h=1/2$, $9y_0/4$. Error típico: comparar un paso de cada tamaño en tiempos finales distintos.

Cierre: Elena encuentra su ajuste original debajo de una versión posterior.
Elena: «El paso corto seguía disponible».
Teo: «La pantalla dice que la cola de datos estaba quieta. Pero el contador de paquetes seguía corriendo».

## 9.4 «Ocho casillas» · Ecuaciones autónomas, equilibrios y logística

Id: `w9-c4`.

Escena de apertura (`observatorio`, 02:50; una gota cae sobre el cajón de repuestos): el monitor mantiene todas las casillas ocupadas. Teo cree que el registrador dejó de recibir. Elena le muestra que el papel sigue avanzando; necesita recuperar un paquete antes de que sea reemplazado.

Teo: «El total no cambia. Quizás se cortó la entrada».
Elena: «Escucha el motor. Cada golpe trae otra línea».

Clase. Modelo de llenado regulado del banco de memoria: $B'=B(1-B/8)$; $B$ es ocupación continua equivalente, tiempo en minutos. El banco de clase permite exceder la marca de referencia; el búfer real solo admite de 0 a 8 unidades.

1. Una fila de casillas se llena rápido y luego más lento. Se duplica el reloj en pantalla: para la misma ocupación, ambos relojes muestran la misma rapidez. NÓESIS: «La regla usa el estado actual. No necesita leer la hora». Pizarra: `\text{misma ocupación}\Rightarrow\text{misma pendiente}`.
2. Gate: arrastrar la ficha de estado por $0\le B\le12$. Visitar $B=4$ y después $B=12$; desbloquea cuando ambas visitas cumplen $|B-B_*|\le0{,}05$. Se animan flechas a la derecha en 4 y a la izquierda en 12. El segundo valor pertenece al banco de clase, no al búfer físico. NÓESIS: «Prueba a ambos lados de la marca». Pizarra: `B'(4)=2,\quad B'(12)=-6`.
3. Dibujar la línea de fase con ceros en 0 y 8. NÓESIS: «Una ecuación autónoma depende del estado. Un equilibrio mantiene ese estado porque su cambio es cero». Pizarra: `y'=f(y),\quad f(y_*)=0`.
4. Flechas del dominio $B\ge0$: entre 0 y 8 avanzan hacia 8; sobre 8 vuelven a 8. En 0, una perturbación positiva se aleja. NÓESIS: «Un equilibrio estable retiene estados cercanos. Si además se acercan con el tiempo, es asintóticamente estable». Ask: «¿Qué ocurre con un inicio apenas mayor que 0?» [«Vuelve a 0», «Crece hacia 8», «Permanece exactamente donde empezó»], answer 1. Explicación: en $0<B<8$, $B'>0$. El cero es inestable por el lado físico. Pizarra: `0<B<8:\ B'>0;\quad B>8:\ B'<0`.
5. Mostrar crecimiento proporcional al inicio y freno que aumenta al acercarse a la capacidad. NÓESIS: «La logística junta ambos efectos. $r$ fija la tasa; $K$ marca la capacidad». Pizarra: `y'=ry(1-y/K),\quad r>0,\ K>0`; `y_*=0,\ K`.
6. Animar la curva de ejemplo $B(t)=8/(1+e^{-t})$, que empieza en 4 y cumple la regla al derivarla; no pedir resolver la ecuación general. En $t=\ln3$ vale 6 y se acerca a 8 sin alcanzarlo en tiempo finito. Luego mostrar el búfer real lleno: entran y salen paquetes, aunque la ocupación quede en 8. NÓESIS: «La línea de fase explica la ocupación. Para conocer el tráfico necesitas otro contador». Pizarra final: `B'=0\ \not\Rightarrow\ \text{entrada}=0`.

Investigación «La lectura quieta». Búfer físico con capacidad de 8 paquetes. En la prueba de intercambio entran 2 paquetes/min y salen 2 paquetes/min por reemplazo; comienza lleno y se mantiene lleno durante 3 min. Es una regla de intercambio, distinta del modelo continuo de llenado. El paquete que Teo recupera tiene la matriz original del canal de presión; la pantalla pública solo retuvo el total ocupado.

Ask 1: «¿Cuántos paquetes nuevos entraron durante esa prueba?» [«0», «8», «6»], answer 2. Explicación: $2\cdot3=6$; la ocupación constante no cuenta los reemplazos.
Ask 2: «En el modelo logístico de clase, ¿qué estado positivo atrae las trayectorias?» [«8», «0», «4»], answer 0. Explicación: las flechas a ambos lados de 8 apuntan hacia él; en 4 todavía hay crecimiento.
Notas: `B'=2-2=0,\quad B=8`; `\text{paquetes entrantes}=2\cdot3=6`; `B(\ln3)=8/(1+1/3)=6`.

Práctica, 3 rondas:
- r0: elegir $K\in\{8;16\}$, $r\in\{1;2\}$ y $y\in\{K/4;K/2;3K/4\}$. Pedir $ry(1-y/K)$; se obtienen múltiplos de 0,5. Error típico: usar solo $ry$ y omitir el freno.
- r1: elegir $K\in\{4;8;12\}$ y $r\in\{1;2\}$. Pedir los dos equilibrios, 0 y $K$, y cuál atrae estados positivos cercanos: $K$. Error típico: confundir el máximo crecimiento en $K/2$ con equilibrio.
- r2: elegir $K\in\{4;8;12\}$ y $r\in\{1;2\}$. Probar $y=3K/2$ en el modelo matemático y elegir dirección: disminuye, pues $y'=-3rK/4$. Error típico: suponer que una tasa $r>0$ hace crecer todos los estados. Aclarar que un modelo de ocupación física puede excluir ese inicio.

Cierre: las casillas vuelven a llenarse mientras Teo inmoviliza una copia del paquete.
Teo: «Aquí hay dos componentes. La pantalla las mezcló en un solo indicador».
Elena: «El original tiene una flecha que se aleja. En el boletín vuelve».

## 9.5 «Dos agujas» · Sistemas lineales y direcciones propias

Id: `w9-c5`.

Escena de apertura (`observatorio`, 03:00; Elena frota el vidrio empañado de dos indicadores): el paquete recuperado conserva los componentes de presión y viento del banco de cálculo. Iris quiere saber si el cambio de dirección viene del inicio o de la regla.

Iris: «Mismos datos de entrada. Distintas salidas».
Elena: «Las agujas estaban bien. Revisa la tabla que las juntaba».

Clase. Dos desviaciones normalizadas $u,v$, tiempo adimensional de calibración. Matriz $A=\begin{pmatrix}-2&1\\1&-2\end{pmatrix}$. Un punto representa ambas agujas al mismo tiempo, no su posición en el mapa de Valparaíso.

1. Cada aguja cambia según su lectura y la de la otra. En el plano aparece el estado $(u,v)$ con la flecha de cambio conjunto. NÓESIS: «Necesitamos dos pendientes para seguir dos lecturas». Pizarra: `\mathbf x=(u,v)^{\mathsf T}`.
2. Gate: arrastrar el inicio por el plano $[-3;3]\times[-3;3]$ hasta $(2,2)$; desbloquea si cada componente queda a distancia menor o igual a 0,05 del objetivo. La flecha es $(-2,-2)$ y la trayectoria sigue la diagonal hacia el origen. NÓESIS: «Pon ambas agujas en la misma marca». Pizarra: `A(2,2)^{\mathsf T}=(-2,-2)^{\mathsf T}`.
3. Separar las dos ecuaciones y volver a juntarlas en la matriz. NÓESIS: «La matriz transforma el estado en su velocidad de cambio». Pizarra: `\mathbf x'=A\mathbf x`; `u'=-2u+v,\quad v'=u-2v`.
4. Encender las diagonales $(1,1)$ y $(1,-1)$: en ellas la flecha conserva la dirección. NÓESIS: «Un vector propio marca una dirección que la matriz conserva. Su valor propio dice cuánto multiplica el cambio en esa dirección». Pizarra: `A\mathbf v=\lambda\mathbf v`; `\mathbf v_1=(1,1),\ \lambda_1=-1`; `\mathbf v_2=(1,-1),\ \lambda_2=-3`.
5. Mostrar dos modos como barras independientes, cada una con su exponencial; sumarlas en el plano. NÓESIS: «Cada modo sigue la regla exponencial. La suma debe partir en el estado inicial». Pizarra: `\mathbf x(t)=c_1e^{-t}(1,1)+c_2e^{-3t}(1,-1)`. Para $(2,0)$, $c_1=c_2=1$. Ask: «¿Dónde queda ese estado en $t=\ln2$?» [«$(1;0)$», «$(5/8;3/8)$», «$(1/2;1/8)$»], answer 1. Explicación: los modos valen $1/2$ y $1/8$; las componentes son su suma y su diferencia. Pizarra: `\mathbf x(\ln2)=(1/2+1/8;1/2-1/8)`.
6. Animar distintos inicios en el mismo campo; definir retrato de fase como conjunto de trayectorias del estado. NÓESIS: «El tiempo recorre cada trayectoria. Aquí ambos modos se apagan y el estado vuelve al origen». Pizarra final: `\lambda<0:\ e^{\lambda t}\to0;\quad\lambda>0:\ e^{\lambda t}\text{ crece}`.

Investigación «El signo cambiado». Modelo reducido recuperado: $M=\operatorname{diag}(1,-2)$; copia pública: $M_p=\operatorname{diag}(-1,-2)$. Mismo estado inicial $(2,4)$, tiempo adimensional de calibración. Se compara en $t=\ln2$. Original: $(4,1)$; público: $(1,1)$. La primera entrada de la matriz cambió de signo; el archivo de medición inicial es idéntico en ambas copias.

Ask 1: «¿Qué dirección crece en el original?» [«La segunda, con valor propio $-2$», «Ninguna», «La primera, con valor propio 1»], answer 2. Explicación: el primer componente multiplica su inicio por $e^t$.
Ask 2: «¿Qué cambio explica que el primer componente pase de 4 a 1 en la salida pública?» [«Cambiar el valor propio de 1 a $-1$», «Cambiar solo el segundo componente inicial», «Sumar las componentes sin cambiar la regla»], answer 0. Explicación: $2e^{\ln2}=4$ y $2e^{-\ln2}=1$.
Notas: `\mathbf x(t)=(2e^t;4e^{-2t})`; `\mathbf x_p(t)=(2e^{-t};4e^{-2t})`; `\mathbf x(\ln2)=(4;1),\quad\mathbf x_p(\ln2)=(1;1)`.

Práctica, 3 rondas:
- r0: elegir $a,b\in\{1;2;3\}$, $u,v\in\{1;2\}$ y $A=\operatorname{diag}(-a,-b)$. Pedir el vector de cambio $A(u,v)^{\mathsf T}=(-au,-bv)^{\mathsf T}$. Error típico: responder el estado o sumar las filas sin multiplicar cada componente.
- r1: elegir $a\in\{1;2\}$, $b\in\{3;4\}$, matriz $A=\frac12\begin{pmatrix}-(a+b)&b-a\\b-a&-(a+b)\end{pmatrix}$. Dar $(1,1)$ y $(1,-1)$; pedir sus valores propios, $-a$ y $-b$. Error típico: confundir las entradas diagonales con los valores propios de una matriz no diagonal.
- r2: elegir $c_1,c_2\in\{1;2\}$ y usar la matriz de clase. Inicio $(c_1+c_2;c_1-c_2)$. Pedir el estado en $t=\ln2$: $(c_1/2+c_2/8;c_1/2-c_2/8)$. Error típico: entregar los coeficientes de los modos como si fueran las componentes finales.

Cierre: Iris deja ambas matrices abiertas sobre la mesa.
Iris: «Le cambiaron el signo a una dirección que crecía».
Elena: «Hay otro canal. Ese daba vueltas antes de salir de la escala».
En la segunda copia, las vueltas se aprietan hacia el centro.

## 9.6 «Las vueltas de la pantalla» · Traza, determinante y tipos de equilibrio

Id: `w9-c6`.

Escena de apertura (`observatorio`, 03:10; la impresora expulsa una hoja todavía caliente): cuatro retratos del banco tienen el mismo punto de reposo, pero respuestas distintas. El jefe de turno los archivó bajo una misma etiqueta. Elena quiere que Iris distinga una mala etiqueta de un cambio en el cálculo.

Elena: «Ponerles el mismo nombre fue flojera. Cambiar las vueltas requirió otra copia».
Iris: «Veamos cuál hicieron».

Clase. Sistemas lineales reales de dos componentes, matriz constante. Usar $N=\operatorname{diag}(-1,-2)$; $S=\operatorname{diag}(1,-1)$; $F=\begin{pmatrix}-1&-2\\2&-1\end{pmatrix}$; $C=\begin{pmatrix}0&-2\\2&0\end{pmatrix}$.

1. Cuatro fichas parten cerca del origen: una entra sin girar, otra entra por una dirección y sale por otra, otra gira entrando y la última gira con radio constante. NÓESIS: «El origen es equilibrio en todos. Lo que cambia es el recorrido cercano». Pizarra: `A\mathbf0=\mathbf0`.
2. Gate: perilla discreta de selección de retrato. Elegir $S$ y arrastrar un inicio cerca de $(1,0)$, con tolerancia 0,05 por componente; luego elegir $F$ y arrastrar cerca de $(1,0)$ con la misma tolerancia. Desbloquea al completar ambas pruebas. Se ve salida recta y entrada giratoria. NÓESIS: «Compara la dirección que se aleja con la trayectoria que gira». Pizarra: `\text{silla};\quad\text{espiral entrante}`.
3. Mostrar la suma de las entradas diagonales y el determinante. NÓESIS: «La traza suma los valores propios. El determinante los multiplica». Pizarra: `\tau=\operatorname{tr}A,\quad D=\det A`; `\lambda^2-\tau\lambda+D=0`. Definir $\Delta=\tau^2-4D$ como discriminante del polinomio, distinto de $D$.
4. Enlazar las cuatro matrices con su clasificación. NÓESIS: «Un determinante negativo da una silla. Con determinante positivo, el discriminante separa valores reales de complejos». Pizarra: `D<0:\text{ silla}`; `D>0,\Delta>0:\text{ nodo}`; `D>0,\Delta<0,\tau\ne0:\text{ espiral}`; `D>0,\Delta<0,\tau=0:\text{ centro}`. Con $D>0$, el signo de $\tau$ da entrada si es negativo y salida si es positivo.
5. Mostrar $C$: círculos con distintas amplitudes. Introducir $i^2=-1$ solo como notación para las raíces complejas; la animación del estado sigue siendo real. Ask: «El centro lineal, con $\tau=0$, $D=4$, ¿cómo responde a un inicio cercano?» [«Se acerca al origen», «Se aleja sin límite», «Permanece cerca, girando sin acercarse»], answer 2. Explicación: valores propios $\pm2i$; es estable y no asintóticamente estable. Pizarra: `u^2+v^2=\text{constante}`.
6. Revisar los bordes de la tabla. Para $D>0$, $\Delta=0$, el valor propio real repetido es $\tau/2$: nodo, con retrato estrellado o impropio según los vectores propios disponibles. $D=0$ puede dejar equilibrios no aislados; no aplicar la tabla de origen aislado. NÓESIS: «Esta tabla clasifica estos sistemas lineales. Una parte lineal con centro no resuelve por sí sola la estabilidad de un sistema no lineal». Pizarra final: `\Delta=0:\ \lambda=\tau/2`; `D=0:\text{ revisar el sistema}`.

Investigación «El archivo entrante». Canal original $F_+=\begin{pmatrix}1&-2\\2&1\end{pmatrix}$; público $F_-=\begin{pmatrix}-1&-2\\2&-1\end{pmatrix}$. Original: $\tau=2$, $D=5$, $\Delta=-16$, espiral saliente. Público: $\tau=-2$, $D=5$, $\Delta=-16$, espiral entrante. El historial de archivos atribuye esta sustitución y la de 9.5 a la misma credencial «Halcón / enlace externo». Elena reconoce el puerto de acceso: debía consultar, no editar.

Ask 1: «¿Qué propiedad se conserva entre esas dos matrices?» [«La estabilidad asintótica», «El giro, porque ambas tienen valores propios complejos», «El signo de la traza»], answer 1. Explicación: ambas tienen $\Delta=-16$; cambia el signo de la parte real, $\tau/2$.
Ask 2: «¿Qué decía el original sobre el origen?» [«Que las trayectorias cercanas giraban alejándose», «Que todas volvían al origen», «Que era una silla»], answer 0. Explicación: $D>0$, $\Delta<0$, $\tau>0$; las raíces son $1\pm2i$.
Notas: `\tau_+=2,\ \tau_-=-2,\ D=1+4=5`; `\Delta=4-20=-16`; `\lambda_+=1\pm2i,\quad\lambda_-=-1\pm2i`.

Práctica, 3 rondas:
- r0: elegir $a,b\in\{1;2;3\}$ y $A=\operatorname{diag}(a,-b)$. Pedir $\tau=a-b$, $D=-ab$ y tipo silla. Error típico: decidir estabilidad solo por una traza negativa.
- r1: elegir $a\in\{-2;-1;1;2\}$, $b\in\{1;2\}$, $A=\begin{pmatrix}a&-b\\b&a\end{pmatrix}$. Pedir $\tau=2a$, $D=a^2+b^2$ y espiral entrante si $a<0$, saliente si $a>0$. Error típico: llamar nodo a toda matriz con determinante positivo.
- r2: elegir $b\in\{1;2;3\}$; $A=\begin{pmatrix}0&-b\\b&0\end{pmatrix}$. Elegir centro estable, centro asintóticamente estable o silla; correcta: centro estable. Error típico: confundir permanecer cerca con converger al origen.

Cierre: el historial marca una exportación privada antes de los cambios públicos.
Teo: «La credencial sacó una copia y después editó la otra».
Elena desenrolla el tramo de papel que dejó debajo de la mesa: «La aguja guardó el golpe de la descarga. Esa hora también la podemos revisar».

## 9.7 «La aguja vuelve» · Oscilador amortiguado

Id: `w9-c7`.

Escena de apertura (`observatorio`, 03:20; olor a aceite del mecanismo abierto): el registrador físico imprime un pulso cuando la consola exporta un archivo. Su reloj se contrastó con la señal del puerto. El pulso de la copia privada lleva la marca 00:00, pero la exportación pública lo dibuja sin cruce del reposo.

Elena: «Se mueve después del golpe. Si la frenan en el archivo, parece otro mecanismo».
Iris: «¿Puedes mostrar la diferencia sin abrir la consola?».
Elena apoya un dedo en el tambor: «Todavía está en el papel».

Clase. Aguja de calibración con masa normalizada, posición $q$ en divisiones de escala desde el reposo, tiempo $t$ en segundos. Modelo $q''+cq'+25q=0$, $q(0)=1$, $q'(0)=0$. Comparar $c=6$, $10$, $26$, todos en s$^{-1}$; el coeficiente 25 está en s$^{-2}$.

1. La aguja se suelta desde una división; un resorte la lleva hacia el reposo y un freno limita su movimiento. NÓESIS: «Para saber qué hará necesitas su posición y su velocidad». Marcar que una posición negativa significa estar al otro lado del reposo. Pizarra: `q:\text{ posición},\quad v:\text{ velocidad}`.
2. Gate: perilla discreta de freno $c\in\{6;10;26\}$; probar 6 y arrastrar el reloj hasta $t=\pi/4$ s, tolerancia 0,01 s. Después elegir 10 y volver al mismo tiempo con la misma tolerancia. Desbloquea tras ambas visitas. En la primera la aguja está negativa; en la segunda sigue positiva. NÓESIS: «Compara el mismo instante con los dos frenos». Pizarra: `q_6(\pi/4)=-e^{-3\pi/4}<0;\quad q_{10}(\pi/4)>0`.
3. Mostrar velocidad como segunda aguja y construir el sistema desde la segunda derivada, que mide aceleración. NÓESIS: «Llamamos $v$ a la velocidad. Su cambio es la aceleración que queda después del resorte y el freno». Pizarra: `q'=v,\quad v'=-25q-cv`; `\frac{d}{dt}\binom{q}{v}=\begin{pmatrix}0&1\\-25&-c\end{pmatrix}\binom{q}{v}`.
4. La animación enlaza los regímenes con las raíces. NÓESIS: «Con poco freno, cruza el reposo mientras baja la amplitud. Con raíces reales, desaparecen las vueltas». Pizarra: `\lambda^2+c\lambda+25=0`; `c=6:\ -3\pm4i`; `c=10:\ -5\text{ doble}`; `c=26:\ -1,-25`. Subamortiguado, crítico y sobreamortiguado, respectivamente; aquí $c>0$.
5. Mostrar las tres curvas para el mismo inicio. Pizarra: `q_6=e^{-3t}(\cos4t+\frac34\sin4t)`; `q_{10}=(1+5t)e^{-5t}`; `q_{26}=\frac{25e^{-t}-e^{-25t}}{24}`. NÓESIS: «En la raíz repetida aparece también un término con $t$. Hace falta para ajustar los dos datos iniciales». Ask: «¿Qué solución cumple $q(0)=1$, $q'(0)=0$ cuando $c=10$?» [«$e^{-5t}$», «$(1+5t)e^{-5t}$», «$\cos5t$»], answer 1. Explicación: la primera empieza bien, pero con velocidad $-5$; la tercera cumple el inicio y carece del decaimiento requerido.
6. Animar varios inicios: con raíces reales una trayectoria puede cruzar el reposo según su velocidad inicial, pero no oscila repetidamente. Evitar definir esos regímenes como «jamás cruza». NÓESIS: «El régimen depende de las raíces. El inicio decide el recorrido concreto». Pizarra final: `c^2<100:\text{ subamortiguado};\ c^2=100:\text{ crítico};\ c^2>100:\text{ sobreamortiguado}`. Con este inicio, el crítico vuelve más rápido que el sobreamortiguado sin oscilar.

Investigación «El pulso de exportación». Calibración original $c=6$, $q(0)=1$, $v(0)=0$. El papel cruza al lado negativo en $t=\pi/4$ s después del pulso marcado 00:00. El archivo público conserva el mismo inicio, pero usa $c=10$ y mantiene $q>0$ para $t\ge0$. La prueba de calibración anterior, archivada con firma de Elena, identifica el mecanismo como el de $c=6$. El reloj del papel es independiente del archivo editado. El cálculo valida el movimiento conservado; la marca horaria la aporta ese reloj.

Ask 1: «¿Qué valor respalda el cruce que quedó en el papel?» [«$e^{-3\pi/4}$», «0», «$-e^{-3\pi/4}$»], answer 2. Explicación: en $t=\pi/4$, $\cos(4t)=-1$ y $\sin(4t)=0$; queda el signo negativo.
Ask 2: «¿Qué dato alcanza para determinar una trayectoria de segundo orden con esta regla?» [«Posición y velocidad iniciales», «Solo la posición inicial», «Solo el freno»], answer 0. Explicación: al convertirla en sistema hay dos componentes iniciales; el régimen por sí solo no fija la trayectoria.
Notas: `q_6(\pi/4)=-e^{-3\pi/4}\approx-0{,}094780`; `q_{10}(\pi/4)=(1+5\pi/4)e^{-5\pi/4}>0`; `q''+cq'+25q=0\Leftrightarrow(q',v')=(v,-25q-cv)`.

Práctica, 3 rondas:
- r0: elegir $c\in\{6;10;26\}$, $q_0\in\{1;2\}$ y $v_0\in\{0;1\}$. Pedir el vector inicial de cambio $(v_0;-25q_0-cv_0)$. Error típico: poner $q_0$ en la primera componente o cambiar el signo del resorte.
- r1: elegir $a\in\{1;2\}$ y un régimen del conjunto subamortiguado, crítico, sobreamortiguado. Dar rigidez $25a^2$ y freno $6a$, $10a$ o $26a$, respectivamente. Pedir régimen y raíces: $-3a\pm4ai$, $-5a$ doble, o $-a,-25a$. Error típico: llamar crítico a cualquier sistema con raíces negativas.
- r2: elegir $Q\in\{1;2;3\}$, con $c=10$, $q(0)=Q$, $v(0)=0$. Elegir $Q(1+5t)e^{-5t}$, $Qe^{-5t}$ o $Q\cos5t$. Correcta: la primera. Error típico: borrar el término de raíz repetida y perder la velocidad inicial.

Cierre: Elena deja el pulso original bajo una lámina seca.
Elena: «La descarga fue a medianoche del día anterior. El papel ya no depende de lo que diga esa pantalla».
Teo compara las condiciones iniciales de ambas exportaciones: «También cortaron cifras al inicio. Quiero medir cuánto cambia eso después».

## 9.8 «La cifra que cortaron» · Sensibilidad inicial y caos

Id: `w9-c8`.

Escena de apertura (`observatorio`, 03:30; el café de Teo dejó una marca seca junto al teclado): dos copias del banco de pronóstico usan la misma regla, pero una redondeó el estado de entrada. Iris necesita separar esa pérdida de precisión de los cambios deliberados ya documentados.

Teo: «Se ven iguales si escondo las últimas cifras».
Tú: «Déjalas a la vista. Corre el mismo número de pasos».
Iris: «Y guarda quién eligió esconderlas».

Clase. Mapa logístico, índice adimensional en $[0;1]$, iteraciones sin equivalencia horaria. Es un modelo de aula para estudiar sensibilidad. Usar $x_{n+1}=4x_n(1-x_n)$; dos inicios, $x_0=0{,}2$ y $z_0=0{,}2001$. Esta $r=4$ es parámetro del mapa discreto, distinto de la tasa de la ecuación logística continua.

1. Una ficha entra a una máquina, sale con otro nivel y vuelve a entrar. La parábola asciende y luego desciende; todos los niveles siguen en $[0;1]$. NÓESIS: «Ahora actualizamos por turnos. Cada salida se convierte en la próxima entrada». Pizarra: `n:\text{ número de actualización}`.
2. Gate: mantener el primer inicio en 0,2; perilla del segundo en $[0{,}2000;0{,}2010]$, con marcas cada 0,0001. Visitar 0,2000 y luego 0,2001, tolerancia absoluta 0,0000005; arrastrar el contador a $n=10$, tolerancia 0 sobre marcas enteras. Desbloquea solo con esas visitas, $z_0=0{,}2001$ y $n=10$. Se muestra separación mayor que 0,1. NÓESIS: «Cambia una cifra al inicio y compara después del mismo número de turnos». Pizarra: `|z_0-x_0|=0{,}0001`.
3. Seguir un paso por la parábola y volver por la diagonal. NÓESIS: «Esta regla es determinista: un inicio exacto fija cada paso. La precisión del inicio limita lo que puedes anticipar». Pizarra: `x_{n+1}=r x_n(1-x_n),\quad r=4`; `x_1=4(0{,}2)(0{,}8)=0{,}64`.
4. Las series se separan sin salir del intervalo. En $n=10$, $x_{10}\approx0{,}147837$, $z_{10}\approx0{,}249178$, diferencia aproximada 0,101341. Ask: «¿Qué produjo la diferencia de estas dos ejecuciones?» [«Una regla distinta en cada paso», «Un cambio pequeño en el estado inicial», «Un crecimiento ilimitado de ambos índices»], answer 1. Explicación: comparten la regla y el parámetro; ambos índices permanecen acotados. Pizarra: `d_{10}=|z_{10}-x_{10}|\approx0{,}101341`.
5. Mostrar estiramiento y plegado de una banda de inicios bajo el mapa. NÓESIS: «En el régimen caótico, la regla puede separar estados muy cercanos mientras mantiene sus recorridos acotados». Aclarar que separarse durante un intervalo también puede ocurrir en sistemas sin caos; esta pareja ilustra sensibilidad dentro del régimen caótico del mapa con $r=4$. Hay inicios excepcionales: $1/4\to3/4\to3/4$. Pizarra: `4\cdot\frac14\cdot\frac34=\frac34`; `4\cdot\frac34\cdot\frac14=\frac34`.
6. Volver a las dos copias: la distancia no crece en todos los pasos; a veces disminuye antes de volver a aumentar. NÓESIS: «Conservar más cifras mejora el inicio. Todavía necesitas medir y revisar el pronóstico». Pizarra final: `\text{misma regla}+\text{inicios cercanos}\Rightarrow\text{recorridos que pueden separarse}`. No atribuir conocimiento perfecto del futuro a quien guardó la copia precisa.

Investigación «La copia reservada». Banco de comprobación que usa este mapa: condición original $z_0=0{,}2001$, pública $x_0=0{,}2$, $r=4$. Alarma de diagnóstico en la lectura $n=10$ si el índice es mayor que 0,2. La privada supera esa marca y la pública queda debajo. El paquete firmado a las 00:00 del 17 incluía también el canal $R$ de 9.2 y fijaba la ventana prevista; el diagnóstico del mapa no traduce iteraciones a una hora de tormenta. Un recibo de las 00:10 del 17 enlaza la copia privada con el mensaje de entrega. El parte registra recepción de vacunas en el Observatorio a las 02:10 del 18 y salida inmediata. La guía adjunta acredita su llegada a la Clínica del Cerro a las 02:40.

Ask 1: «¿Qué copia activa la alarma de diagnóstico en $n=10$?» [«La pública, con aproximadamente 0,147837», «Ninguna», «La privada, con aproximadamente 0,249178»], answer 2. Explicación: solo la privada es mayor que 0,2 en esa lectura; no se está preguntando si cruzaron la marca antes.
Ask 2: «¿Qué permite afirmar que Halcón recibió información de la ventana antes de la entrega?» [«El recibo firmado enlazado al pronóstico y al mensaje», «Solo que las dos curvas se separaron», «Que un sistema caótico predice siempre la hora exacta»], answer 0. Explicación: la sensibilidad explica un límite del cálculo público; la copia y el recibo documentan el acceso temprano. El parte y la guía confirman el recorrido efectivo.
Notas: `x_0=1/5,\quad z_0=2001/10000`; `d_{10}\approx0{,}101341`; `x_{10}<0{,}2<z_{10}`; `02{:}00<02{:}10<02{:}30`; `02{:}10<02{:}40`.

Práctica, 3 rondas:
- r0: elegir $r\in\{2;4\}$ y $x_0\in\{1/4;1/2;3/4\}$. Pedir $x_1=rx_0(1-x_0)$. Error típico: omitir el factor $(1-x_0)$ o usar la regla continua $x'=rx$.
- r1: elegir $x_0\in\{1/8;1/2;7/8\}$, $r=4$. Pedir $x_2$ tras calcular y reutilizar $x_1$. Resultados: $63/64$, 0, $63/64$, respectivamente. Error típico: usar otra vez el inicio en el segundo paso.
- r2: elegir $\varepsilon\in\{1/10000;1/5000\}$, $r=4$, $x_0=1/4$, $z_0=1/4+\varepsilon$. Dar la fórmula y pedir la separación exacta tras un paso: $2\varepsilon-4\varepsilon^2$, positiva para ambos valores. Opciones exactas: esa expresión, $\varepsilon$, $4\varepsilon$. Error típico: multiplicar la diferencia por $r$ ignorando el factor dependiente del estado. Después elegir qué se puede concluir [«Una separación aislada demuestra caos», «Hace falta estudiar la dinámica», «La regla tuvo que cambiar»], answer 1. La separación aislada no basta.

Cierre: Teo abre el parte de recepción y su guía adjunta. Elena reconoce el sello de la Clínica del Cerro.
Elena: «Dejaron la caja acá y la retiraron al tiro. Mi compañera creía que era una entrega de repuestos».
Iris: «El recibo dice vacunas».
La firma de recepción se repite en las fichas alteradas que Ana encontró en el Archivo.

## 9.★ «La copia y el recibo» · Repaso del mundo (5 lecturas)

Id: `w9-final`. Module de cierre: `w9-closed`.

Escena de apertura (`observatorio`, 03:45; el tambor se detiene y queda un silencio áspero): Elena tiene que devolver la consola al turno. Iris necesita cerrar la cadena de evidencia antes de retirar las copias; Teo no quiere perder los registros de lectura.

Elena: «Puedes llevarte el duplicado. El original queda acá con mi firma».
Iris: «Cinco lecturas antes de separarlos».
Tú: «Deja cada cálculo junto al archivo del que salió».

Clase de repaso, sin conceptos nuevos:
1. Mostrar juntos el papel y el canal de intensidad de 9.2. NÓESIS: «Primero distingue un nivel de su pendiente». Animar el inicio de ambos trazos. Pizarra: `H'=2t;\quad R'=(\ln2)R`.
2. Gate: perilla del paso de Euler entre $1$ y $1/8$ para el banco $Q'=Q$, $Q_0=4$. Desbloquea con $|h-1/8|\le0{,}001$ y cursor final $|t-1|\le0{,}01$; $h$ se ajusta solo a las marcas. NÓESIS: «Vuelve a comparar en el mismo final». Pizarra: `Q^E_8=4(9/8)^8>10`.
3. Dibujar el equilibrio 8 de la logística y la ocupación física del búfer; animar reemplazos sobre el segundo. Ask: «La ocupación no cambia. ¿Qué dato falta para saber si entran paquetes?» [«El color de la pantalla», «El contador de entradas», «Otro valor inicial de la logística»], answer 1. Explicación: equilibrio de ocupación y ausencia de tráfico son afirmaciones distintas. Pizarra: `B'=0\ \not\Rightarrow\ \text{entrada}=0`.
4. Superponer la silla original, la espiral pública y la aguja amortiguada. NÓESIS: «Clasifica la regla antes de describir un recorrido particular». Animar un inicio en cada imagen. Pizarra: `D<0:\text{ silla};\quad\Delta<0,\tau<0:\text{ espiral entrante}`; `q'=v`.
5. Superponer los dos mapas logísticos y detenerlos en la lectura común. NÓESIS: «Una diferencia de cálculo y una prueba de acceso responden preguntas distintas». Pizarra final: `d_n=|z_n-x_n|`; `\text{recibo firmado}\longrightarrow\text{acceso documentado}`.

Investigación «La cadena de copias». Mesa con el papel marcado 00:00, salida privada firmada a la misma hora, recibo de Halcón de las 00:10 y modificaciones públicas de las 00:20, todos del 17 de agosto. El parte del 18 registra recepción de vacunas en el Observatorio a las 02:10; su guía adjunta acredita la llegada a la Clínica a las 02:40. El mensaje de Las Antenas conserva la ventana de 02:00–02:30. Los documentos guardan sus identificadores completos, sin generar nuevos números de folio para el repaso.

Ask 1: «¿Qué secuencia conserva la cadena documentada?» [«Publicación, entrega y después copia privada», «Entrega y después recibo del pronóstico», «Copia privada, recibo y después entrega»], answer 2. Explicación: la copia y el recibo preceden a la recepción nocturna; las modificaciones públicas ocurrieron entre ambos eventos.
Ask 2: «¿Qué documento fija el destino de las vacunas después del Observatorio?» [«La guía de recepción de la Clínica», «La curva de Euler por sí sola», «La ocupación del búfer»], answer 0. Explicación: los cálculos reconstruyen lo que las copias mostraban; la guía registra quién recibió la carga después del traslado.
Notas: `00{:}00<00{:}10<00{:}20<02{:}10\ \text{del día siguiente}`; `R(1)=8`; `Q^E_1=8<10<Q(1)`.

Práctica preparatoria, 3 rondas; no sustituye las cinco lecturas de cierre:
- r0: elegir $R_0\in\{2;4;8\}$, tasa $\ln2$ por hora y objetivo $2R_0$. Pedir el tiempo: 1 h. Error típico: tratar una duplicación como una suma fija por hora.
- r1: elegir $a,b\in\{1;2\}$ y matriz $\operatorname{diag}(a,-b)$. Pedir valores propios y clasificación: $a,-b$, silla. Error típico: concluir «estable» si la traza es cero o negativa.
- r2: elegir $\varepsilon\in\{1/10000;1/5000\}$ y reutilizar el par de 9.8 alrededor de $1/4$. Pedir la diferencia después de un paso: $2\varepsilon-4\varepsilon^2$, y elegir qué respalda acceso temprano: el recibo enlazado a la copia. Error típico: transformar sensibilidad inicial en prueba de autoría.

Repaso final, 5 lecturas con datos fijos del caso. Cada lectura admite campos relacionados o una elección explicada; se avanza cuando todos sus campos están correctos. Tolerancia numérica 0,005, salvo lectura 5: 0,000005. Sin azar para la evidencia del cierre.

1. «El trazo y la ventana» (9.1–9.2): para $H=3+t^2$, pedir $H'(1)$: 2 cm/min; para $R=4\cdot2^t$, pedir tiempo hasta 8: 1 h, las 02:00 desde la 01:00. Pizarra: `H'=2t;\quad4\cdot2^t=8`. Detectar nivel 4 usado como pendiente y hora de inicio ignorada.
2. «El paso público» (9.3): para $Q'=Q$, $Q_0=4$, $h=1$, pedir salida en $t=1$: 8; elegir si supera 10: no. Elegir comparación correcta [«La referencia exacta $4e$ sí supera 10», «La referencia exacta también vale 8», «El inicio ya superaba 10»], answer 0. Pizarra: `Q^E_1=4+4=8;\quad Q(1)=4e`. Detectar confundir aproximación con solución exacta.
3. «La cola quieta» (9.4): para la logística con $r=1$, $K=8$, pedir equilibrio positivo: 8; en el búfer lleno con 2 entradas/min durante 3 min, pedir entradas: 6. Pizarra: `B(1-B/8)=0;\quad2\cdot3=6`. Detectar máximo crecimiento usado como equilibrio y ocupación usada como tráfico.
4. «El signo original» (9.5–9.6): matriz $M=\operatorname{diag}(1,-2)$, inicio $(2,4)$, $t=\ln2$. Pedir estado $(4,1)$, traza $-1$, determinante $-2$ y elegir [«Nodo entrante», «Silla», «Centro»], answer 1. Pizarra: `\mathbf x=(2e^t;4e^{-2t});\quad D=-2<0`. Detectar clasificar solo por traza y omitir la condición inicial.
5. «El pulso y las cifras» (9.7–9.8): elegir régimen del papel, $c=6$, rigidez 25 [«Crítico», «Sobreamortiguado», «Subamortiguado»], answer 2. Pedir separación de los dos índices en $n=10$, tabla de 9.8 visible: aproximadamente 0,101341. Elegir qué documento confirma acceso previo [«El recibo de las 00:10», «La separación por sí sola», «El signo negativo de la aguja por sí solo»], answer 0. Pizarra: `\lambda=-3\pm4i;\quad d_{10}=|z_{10}-x_{10}|`. Detectar confundir movimiento físico, sensibilidad y prueba documental.

Escena final (`observatorio`, 04:00; Elena alisa el duplicado con el dorso de la mano): las cinco lecturas quedan junto a los documentos.

Elena: «Ahora sí puedo mostrarle esto al turno. La firma de mi compañera queda con la pantalla que le dieron».
Iris: «Y la credencial de Halcón, con los archivos que cambió».
Teo: «La entrega acá quedó dentro de la ventana. La guía sigue hasta la Clínica del Cerro».

Corte a `cerros`, 04:20, entrada de la Clínica del Cerro; olor a cloro por la puerta entreabierta. Una técnica de recepción aprieta una carpeta contra el pecho. La agencia trae el parte de vacunas; ella quiere dejar una copia de los resultados antes de que abra el siguiente turno.

Técnica: «Las vacunas entraron por atrás. Esto salió del laboratorio después».
Iris: «¿Qué te hizo guardarlo?».
Técnica: «Un test que da positivo demasiadas veces. Hasta en las muestras que mandaron como control».
Tú: «Deja juntas las etiquetas y los resultados».

En la carpeta, una etiqueta de la caja térmica cubre parte de la hoja del test. El Mundo 10, La Clínica, empieza con esa hoja; el cálculo de sus resultados queda para ese mundo.

## Verificación numérica

Comprobación con `python3`, usando `fractions.Fraction` para operaciones racionales y `math` para exponenciales, logaritmos y aproximaciones. Se comprobaron todos los conjuntos de práctica por enumeración. Los conjuntos de resultados que siguen incluyen todas sus combinaciones; las fórmulas parametrizadas identifican la respuesta de cada combinación. Los números que funcionan como ids, horarios, dimensiones del escenario, colores, marcas de control o tolerancias son especificaciones del guion. Los distractores representan los cálculos erróneos indicados; no se presentan como resultados correctos.

### 9.1 · Pendiente, nivel e inicio

- $y=1+t^2\Rightarrow y'=2t$. Inicio: $y(0)=1$. En $t=1$: nivel $1+1=2$ y pendiente $2\cdot1=2$. En $t=2$: nivel $1+4=5$ y pendiente $2\cdot2=4$. Distractores del Ask: 4 como nivel confunde ambos indicadores; 2 como cambio total omite $t^2=4$.
- Inicio alternativo: $y=3+t^2$; $y(0)=3$, $y(1)=4$, $y(2)=7$, mismas pendientes. En general, $(C+t^2)'=2t$ y $y(0)=C$.
- Investigación: $H(0)=3+0=3$; $H(1)=3+1=4$; $H'(1)=2$. La copia de pendiente 0 no es tangente al papel. $(3+2t)'=2$ constante: solo coincide con la pendiente correcta en $t=1$, no con el campo completo; además da nivel 5 allí. $t^2$ empieza en 0.
- Práctica r0: $m=at_*+b$. Con los conjuntos definidos, $m\in\{1;2;3;4;5;6;7;8\}$; el nivel señalado es $m+1\in\{2;3;4;5;6;7;8;9\}$. Nunca coincide con la pendiente.
- Práctica r1: pares $(C,t_*)=(2,1),(3,1),(2,2),(3,2)$ producen niveles 3, 4, 6, 7, respectivamente. Las pendientes correspondientes son 2, 2, 4, 4; omitir $C$ da 1, 1, 4, 4. Ambos errores quedan separados de la respuesta correcta.
- Práctica r2: $C+t^2$ cumple campo e inicio para cada $C\in\{1;2;3\}$. $C+2t$ conserva el inicio, pero tiene derivada 2; $t^2$ conserva el campo, pero inicia en 0.

### 9.2 · Exponenciales y reloj

- $y_0e^{kt}$ inicia en $y_0$ porque $e^0=1$; su derivada es $ky_0e^{kt}=ky$. Para $y_0=2,k=1$: $y(1)=2e\approx5{,}436564$. Para $z_0=8,k=-1$: $z(1)=8e^{-1}\approx2{,}943036$.
- Mitad: $8e^{-t}=4\Rightarrow e^{-t}=1/2\Rightarrow t=\ln2\approx0{,}693147$ h. $8e^{-\ln2}=8/2=4$. Otro intervalo igual deja 2. En general, $e^{-|k|T}=1/2\Rightarrow T=\ln2/|k|$.
- Distractores: $e^t$ empieza en 1; $2+t$ empieza en 2, pero su derivada es 1 y no su nivel. En el banco de decaimiento, 0 nunca se alcanza en un tiempo finito desde un inicio positivo.
- Canal de lluvia: $R(t)=4e^{(\ln2)t}=4\cdot2^t$. $R(0)=4$; $R(1/2)=4\sqrt2\approx5{,}656854$; $R(1)=8$; $R(2)=16$. Así se verifican también las horas distractoras 01:30 y 03:00. $4\cdot2^t=8\Rightarrow2^t=2\Rightarrow t=1$ h. De 01:00 a 02:00 transcurre esa hora.
- Práctica r0: $y(n)=y_0\,2^{sn}$. Enumeración completa de valores: $\{1/2;1;2;4;8;16;32\}$. El cálculo aditivo incorrecto sería $y_0+sn\ln2$, con unidad y regla distintas del factor multiplicativo solicitado.
- Práctica r1: con $k=-\ln2/a$, $T_{1/2}=\ln2/(\ln2/a)=a$, resultados $\{1;2;4\}$ h. Usar $\ln2/k$ sin valor absoluto da $-a$ h.
- Práctica r2: $e^{-(\ln2)t/a}=2^{-n}\Rightarrow t=na$. Se excluyen $(a,y_0,n)=(1,8,2)$ y $(2,4,1)$ por igualdad entre el número del nivel y el del tiempo. Las seis combinaciones restantes dan tiempos $\{1;2;4\}$ h y niveles objetivo $\{1;2;4\}$; en cada pregunta el nivel y el tiempo quedan distintos.

### 9.3 · Euler, mismo horizonte

Para $y'=y$, $y_0=1$, Euler cumple $y_{n+1}=(1+h)y_n$. Con $N=1/h$ pasos hasta $t=1$, el final es $(1+h)^N$.

| Paso $h$ | Nodos después del inicio, hasta $t=1$ | Final exacto de Euler | Error frente a $e$, aproximado |
|---|---|---|---|
| $1$ | $2$ | $2$ | 0,718282 |
| $1/2$ | $3/2;9/4$ | $9/4=2{,}25$ | 0,468282 |
| $1/4$ | $5/4;25/16;125/64;625/256$ | $625/256=2{,}44140625$ | 0,276876 |

- Referencia: $e\approx2{,}718282$. Primer cambio con $h=1/2$: $(1/2)\cdot1=1/2$. Primer nivel: $1+1/2=3/2$. Los distractores 1 y $3/2$ son pendiente inicial y nivel final, respectivamente.
- Banco $Q_0=4$: paso único $4+1\cdot4=8$. Con $h=1/2$, final $4\cdot9/4=9$. Con $h=1/4$, final $4\cdot625/256=625/64=9{,}765625$. Con $h=1/8$, final $4(9/8)^8=43046721/4194304\approx10{,}263138$. Referencia $4e\approx10{,}873127$.
- Errores del banco en esos cuatro pasos: aproximadamente 2,873127; 1,873127; 1,107502; 0,609989. Se cumple $8<10<10{,}263138<4e$. El distractor 12 del Ask corresponde a duplicar el incremento: $4+2\cdot4=12$.
- Práctica r0: $y_{n+1}=y_n(1+hk)$ produce exactamente $\{1;3/2;2;5/2;3;4;5;6;10;12\}$. Los factores posibles son $3/4$, $1/2$, $5/4$, $3/2$, todos positivos; omitir $h$ daría factor 0 o 2.
- Práctica r1: $y_0=4$ da $6\to9$; $y_0=8$ da $12\to18$. Mantener la pendiente inicial en ambos pasos da 8 o 16, respectivamente.
- Práctica r2: para $y_0\in\{1;2;4\}$, el final con paso 1 es $2y_0\in\{2;4;8\}$; con paso $1/2$ es $9y_0/4\in\{9/4;9/2;9\}$. Sus errores son $y_0(e-2)$ y $y_0(e-9/4)$; el segundo es menor porque $2<9/4<e$.

### 9.4 · Logística y tráfico

- $f(B)=B(1-B/8)$. $f(0)=0$; $f(4)=4(1-1/2)=2$; $f(8)=0$; $f(12)=12(1-3/2)=-6$. Signos: positivo entre 0 y 8, negativo sobre 8. El cero es inestable por el lado positivo; 8 es asintóticamente estable.
- $f'(B)=1-B/4$: $f'(0)=1$, $f'(8)=-1$. Son comprobaciones de los signos ya mostrados, no un criterio adicional exigido al jugador.
- Curva de ejemplo: $B=8/(1+e^{-t})$; $B(0)=8/2=4$. Su derivada es $8e^{-t}/(1+e^{-t})^2$, igual a $B(1-B/8)$. En $t=\ln3$, $e^{-t}=1/3$ y $B=8/(4/3)=6$. Para $t\ge0$, $e^{-t}>0$; $B<8$, con límite 8.
- Búfer real: $2-2=0$ paquetes/min de cambio neto; $B=8$ permanece constante. Durante 3 min entran $2\cdot3=6$ paquetes y se reemplazan otros 6.
- Práctica r0: en $y=K/4$ o $3K/4$, la pendiente es $3rK/16$; en $y=K/2$, es $rK/4$. Para $K\in\{8;16\}$ y $r\in\{1;2\}$, resultados $\{3/2;2;3;4;6;8\}$, todos múltiplos de 0,5. El cálculo sin freno daría $rK/4$, $rK/2$ o $3rK/4$, según el estado de entrada.
- Práctica r1: $ry(1-y/K)=0\Rightarrow y=0,K$. Capacidades posibles 4, 8, 12; el equilibrio positivo es cada $K$. En $K/2$, $f=rK/4>0$, por lo que no es equilibrio.
- Práctica r2: en $y=3K/2$, $f=r(3K/2)(1-3/2)=-3rK/4$. Resultados $\{-3;-6;-9;-12;-18\}$: todos apuntan hacia estados menores.

### 9.5 · Matrices, modos y condiciones iniciales

- $A(2,2)^{\mathsf T}=(-4+2;2-4)^{\mathsf T}=(-2,-2)^{\mathsf T}$.
- $A(1,1)^{\mathsf T}=(-1,-1)^{\mathsf T}=-(1,1)^{\mathsf T}$. $A(1,-1)^{\mathsf T}=(-3,3)^{\mathsf T}=-3(1,-1)^{\mathsf T}$. Valores propios $-1,-3$.
- Inicio $(2,0)=(1,1)+(1,-1)$: $c_1=c_2=1$. En $t=\ln2$, $e^{-t}=1/2$, $e^{-3t}=1/8$, de modo que el estado es $(1/2+1/8;1/2-1/8)=(5/8;3/8)$. Los distractores $(1;0)$ y $(1/2;1/8)$ corresponden a aplicar un solo factor al inicio y a entregar amplitudes modales como componentes.
- Original $M=\operatorname{diag}(1,-2)$: $(2e^t;4e^{-2t})$ inicia en $(2,4)$. En $\ln2$: $(2\cdot2;4/4)=(4,1)$. Público $M_p=\operatorname{diag}(-1,-2)$: $(2/2;4/4)=(1,1)$.
- Práctica r0: respuesta $(-au;-bv)$ para cada combinación. Cada componente pertenece a $\{-1;-2;-3;-4;-6\}$, de forma independiente. Todas las matrices son diagonales, de modo que sus entradas diagonales sí son valores propios.
- Práctica r1: la matriz dada cumple $A(1,1)=-a(1,1)$ y $A(1,-1)=-b(1,-1)$. Pares de valores propios $(-1,-3)$, $(-1,-4)$, $(-2,-3)$, $(-2,-4)$. Sus matrices son, respectivamente, $\begin{pmatrix}-2&1\\1&-2\end{pmatrix}$, $\begin{pmatrix}-5/2&3/2\\3/2&-5/2\end{pmatrix}$, $\begin{pmatrix}-5/2&1/2\\1/2&-5/2\end{pmatrix}$, $\begin{pmatrix}-3&1\\1&-3\end{pmatrix}$.
- Práctica r2: para $(c_1,c_2)=(1,1),(1,2),(2,1),(2,2)$, los inicios son $(2,0)$, $(3,-1)$, $(3,1)$, $(4,0)$; los finales son $(5/8;3/8)$, $(3/4;1/4)$, $(9/8;7/8)$, $(5/4;3/4)$, respectivamente.

### 9.6 · Clasificación lineal

| Matriz | $\tau$ | $D$ | $\Delta=\tau^2-4D$ | Valores propios | Tipo |
|---|---|---|---|---|---|
| $N=\operatorname{diag}(-1,-2)$ | $-3$ | $2$ | $9-8=1$ | $-1,-2$ | Nodo entrante |
| $S=\operatorname{diag}(1,-1)$ | $0$ | $-1$ | $0+4=4$ | $1,-1$ | Silla |
| $F_-=\begin{pmatrix}-1&-2\\2&-1\end{pmatrix}$ | $-2$ | $1+4=5$ | $4-20=-16$ | $-1\pm2i$ | Espiral entrante |
| $C=\begin{pmatrix}0&-2\\2&0\end{pmatrix}$ | $0$ | $4$ | $0-16=-16$ | $\pm2i$ | Centro |
| $F_+=\begin{pmatrix}1&-2\\2&1\end{pmatrix}$ | $2$ | $1+4=5$ | $4-20=-16$ | $1\pm2i$ | Espiral saliente |
| $M=\operatorname{diag}(1,-2)$ | $-1$ | $-2$ | $1+8=9$ | $1,-2$ | Silla |

- Para $C$, $u'=-2v$, $v'=2u$. La derivada de $u^2+v^2$ es $2u(-2v)+2v(2u)=0$: el radio permanece constante. Esto verifica estabilidad sin atracción.
- Para las matrices de giro $\begin{pmatrix}a&-b\\b&a\end{pmatrix}$, el cambio del radio al cuadrado es $2a(u^2+v^2)$; el signo de $a$ verifica entrada o salida. Valores propios $a\pm bi$, traza $2a$, determinante $a^2+b^2$, discriminante $-4b^2$.
- Práctica r0: $\tau=a-b\in\{-2;-1;0;1;2\}$ y $D=-ab\in\{-9;-6;-4;-3;-2;-1\}$. $\Delta=(a+b)^2>0$, con resultados $\{4;9;16;25;36\}$. Todas son sillas, incluso con traza negativa.
- Práctica r1: $\tau\in\{-4;-2;2;4\}$, $D\in\{2;5;8\}$, $\Delta\in\{-4;-16\}$. Las raíces $a\pm bi$ son complejas para todo el conjunto; $a<0$ da entrada, $a>0$ salida.
- Práctica r2: $\tau=0$, $D=b^2\in\{1;4;9\}$, $\Delta=-4b^2\in\{-4;-16;-36\}$; raíces $\pm bi$. Son centros estables sin convergencia.
- Borde repetido: con $D>0$, $\Delta=0$, la raíz es $\tau/2\ne0$. Su signo determina atracción o repulsión; la multiplicidad geométrica distingue estrella de nodo impropio. Con $D=0$, una raíz es 0 y se debe examinar el sistema aparte.

### 9.7 · Segundo orden y amortiguación

- Sustituir $v=q'$ transforma $q''+cq'+25q=0$ en $(q',v')=(v,-25q-cv)$. La matriz tiene traza $-c$, determinante 25 y discriminante $c^2-100$.

| Freno $c$ | Discriminante | Factorización o raíces | Régimen |
|---|---|---|---|
| 6 | $36-100=-64$ | $(-6\pm8i)/2=-3\pm4i$ | Subamortiguado |
| 10 | $100-100=0$ | $(\lambda+5)^2=0$ | Crítico |
| 26 | $676-100=576$ | $(\lambda+1)(\lambda+25)=0$ | Sobreamortiguado |

- En $q_6=e^{-3t}(\cos4t+\frac34\sin4t)$, $q_6(0)=1$ y $q_6'(t)=-\frac{25}{4}e^{-3t}\sin4t$, por lo que $q_6'(0)=0$. Su segunda derivada es $\frac{75}{4}e^{-3t}\sin4t-25e^{-3t}\cos4t$; al sumar $6q_6'+25q_6$ queda 0.
- En $q_{10}=(1+5t)e^{-5t}$, $q_{10}(0)=1$, $q_{10}'=-25te^{-5t}$ y $q_{10}'(0)=0$. $q_{10}''=(-25+125t)e^{-5t}$; $q_{10}''+10q_{10}'+25q_{10}=0$.
- En $q_{26}=(25e^{-t}-e^{-25t})/24$, el inicio es $(25-1)/24=1$; la derivada inicial es $(-25+25)/24=0$. Cada exponencial satisface una raíz del polinomio, de modo que la combinación satisface la ecuación.
- Pulso: $4(\pi/4)=\pi$, $\cos\pi=-1$, $\sin\pi=0$. $q_6(\pi/4)=-e^{-3\pi/4}\approx-0{,}094780$. $q_{10}(\pi/4)=(1+5\pi/4)e^{-5\pi/4}\approx0{,}097076>0$. En $t=\pi/2$, la aguja subamortiguada vuelve al lado positivo: $q_6(\pi/2)=e^{-3\pi/2}\approx0{,}008983$.
- Distractores críticos: $e^{-5t}$ tiene derivada inicial $-5$; $\cos5t$ tiene derivada inicial 0, pero $q''+10q'+25q=-50\sin5t$, que no es idénticamente cero. Para un inicio $Q$, ambas expresiones se multiplican por $Q$ y conservan sus respectivos errores.
- Comparación ilustrativa para el inicio común: $q_{10}(1)=6e^{-5}\approx0{,}040428$; $q_{26}(1)=(25e^{-1}-e^{-25})/24\approx0{,}383208$. El crítico tiene raíz $-5$ doble; el modo lento sobreamortiguado tiene raíz $-1$.
- Práctica r0: primera componente $v_0\in\{0;1\}$; segunda $-25q_0-cv_0\in\{-25;-31;-35;-50;-51;-56;-60;-76\}$. La fórmula define qué segunda componente acompaña a cada primera.
- Práctica r1: con $a=1$ se recupera la tabla; con $a=2$, rigidez $25\cdot4=100$, frenos 12, 20, 52. Raíces: $-6\pm8i$, $-10$ doble, $-2,-50$. Discriminantes: $144-400=-256$, $400-400=0$, $2704-400=2304$; raíces reales en el último caso porque $\sqrt{2304}=48$.
- Práctica r2: $Q(1+5t)e^{-5t}$ inicia en $Q\in\{1;2;3\}$ y tiene derivada inicial 0. $Qe^{-5t}$ inicia con velocidad $-5Q\in\{-5;-10;-15\}$. $Q\cos5t$ mantiene amplitud y deja residuo $-50Q\sin5t$ en la ecuación amortiguada.

### 9.8 · Iteraciones y separación

Los valores de esta tabla se obtuvieron iterando exactamente fracciones desde $x_0=1/5$ y $z_0=2001/10000$, sin redondear entre pasos. Se muestran aproximaciones a seis decimales. La columna de distancia se redondea desde la diferencia exacta, no desde las otras dos columnas ya redondeadas.

| $n$ | $x_n$, copia pública | $z_n$, copia privada | $|z_n-x_n|$ |
|---|---|---|---|
| 0 | 0,200000 | 0,200100 | 0,000100 |
| 1 | 0,640000 | 0,640240 | 0,000240 |
| 2 | 0,921600 | 0,921331 | 0,000269 |
| 3 | 0,289014 | 0,289921 | 0,000907 |
| 4 | 0,821939 | 0,823467 | 0,001528 |
| 5 | 0,585421 | 0,581477 | 0,003944 |
| 6 | 0,970813 | 0,973446 | 0,002633 |
| 7 | 0,113339 | 0,103396 | 0,009944 |
| 8 | 0,401974 | 0,370820 | 0,031154 |
| 9 | 0,961563 | 0,933250 | 0,028314 |
| 10 | 0,147837 | 0,249178 | 0,101341 |
| 11 | 0,503924 | 0,748353 | 0,244429 |
| 12 | 0,999938 | 0,753283 | 0,246655 |

- Primer paso: $4(1/5)(4/5)=16/25=0{,}64$; privado $4(2001/10000)(7999/10000)=16005999/25000000=0{,}64023996$. Diferencia $5999/25000000=0{,}00023996$.
- Segundo paso público: $4(16/25)(9/25)=576/625=0{,}9216$. Cada fila siguiente usa $x_{n+1}=4x_n(1-x_n)$ y la misma regla para $z$; esta recurrencia con las fracciones iniciales especifica exactamente todos los resultados mostrados.
- En $n=10$, se verifica $x_{10}<0{,}2<z_{10}$ y $d_{10}>0{,}1$. En los pasos 6 y 9 la separación baja respecto del paso anterior: el gate no supone crecimiento monótono.
- Acotación: $4x(1-x)=1-(2x-1)^2$. Para $0\le x\le1$, el resultado está en $[0;1]$. La parábola pliega ambos lados del máximo $x=1/2$, donde da 1. El punto $1/4$ da $3/4$, y $3/4$ vuelve a dar $3/4$: un inicio excepcional no tiene la conducta de un recorrido genérico.
- Práctica r0: para $r=2$ y los inicios $1/4,1/2,3/4$, los resultados son $3/8,1/2,3/8$. Para $r=4$, son $3/4,1,3/4$. Omitir $(1-x_0)$ daría $rx_0$, que no cumple las salidas del mapa.
- Práctica r1: $1/8\to7/16\to63/64$; $1/2\to1\to0$; $7/8\to7/16\to63/64$. Los dos pasos de los extremos usan $4(7/16)(9/16)=63/64$. Reutilizar el inicio en vez de $x_1$ daría $7/16$, 1 o $7/16$, respectivamente; todos difieren del segundo paso correcto.
- Práctica r2: $f(1/4+\varepsilon)=3/4+2\varepsilon-4\varepsilon^2$. Con $\varepsilon=1/10000$, $d_1=4999/25000000=0{,}00019996$; con $\varepsilon=1/5000$, $d_1=2499/6250000=0{,}00039984$. Distractor $\varepsilon$: 0,0001 o 0,0002; distractor $4\varepsilon$: 0,0004 o 0,0008. Ninguno coincide con la diferencia correcta.

### 9.★ · Respuestas de cierre y cronología

- Lectura 1: $H'(1)=2$; $4\cdot2^t=8\Rightarrow t=1$ h; 01:00 más una hora es 02:00 del mismo día.
- Lectura 2: $4+4=8<10$, mientras $4e\approx10{,}873127>10$.
- Lectura 3: $B(1-B/8)=0\Rightarrow B=0,8$; positivo: 8. Entradas: $2\cdot3=6$.
- Lectura 4: estado $(4,1)$; traza $1-2=-1$; determinante $1(-2)=-2$; discriminante $(-1)^2-4(-2)=9$; raíces 1 y $-2$, silla.
- Lectura 5: $c=6$ da $c^2-100=-64$, raíces $-3\pm4i$, subamortiguado; $d_{10}\approx0{,}101341$. Acceso documentado por el recibo de las 00:10.
- Práctica preparatoria r0: $(2R_0)/R_0=2\Rightarrow t=1$ h para cada $R_0\in\{2;4;8\}$; objetivos 4, 8, 16. r1: pares $(1,-1),(1,-2),(2,-1),(2,-2)$; trazas 0, $-1$, 1, 0; determinantes $-1,-2,-2,-4$, todas sillas. r2: diferencias 0,00019996 y 0,00039984, como en 9.8; la prueba de acceso sigue siendo documental.
- La copia privada de las 00:00 del 17 precede al recibo de las 00:10 por 10 min; las modificaciones de las 00:20 vienen otros 10 min después. De 00:00 del 17 a 02:10 del 18 transcurren $24\cdot60+2\cdot60+10=1570$ min. La ventana dura 30 min; la recepción en el Observatorio a las 02:10 cae 10 min después de su inicio y 20 min antes del final. De 02:10 a la recepción clínica de las 02:40 pasan 30 min. El pronóstico conservado y la entrega observada no se confunden.
