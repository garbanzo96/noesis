# Mundo 13, segunda parte · Del MDP al POMDP · guion

Autor del guion: Claude, 2026-11-04. Gabriel pidió que decisión secuencial apunte a POMDP. Este mundo
termina ahora en decidir con estado oculto: creencias, filtro, política sobre creencias y valor de
mirar antes de actuar. Los casos 13.1 a 13.8 quedan como están; se agregan cuatro y se ajusta el repaso.

Reglas generales:

- Cada caso es un archivo en `src/content/w13/` que exporta `level`, `lesson`, `glyphs` y `ref`, con la
  misma forma de `src/content/w13/c5-bellman.tsx`. El índice ya los descubre y ya tiene su posición.
- Ids `w13-c9`, `w13-c10`, `w13-c11`, `w13-c12`. Códigos `13.9` a `13.12`. Guía `valentina`, lugar `bolsa`.
- Modelo y funciones: `src/content/w13/kit.tsx`. Úsalos; no reescribas las cuentas. `tests/pomdp.test.ts`
  fija todos los números que cita este guion.
- Textos: `docs/CONTRATO-LIBRO.md` (clase como libro de texto, cada `gate` lleva `after`). Escenas: voz de
  `docs/NARRATIVA.md`, sección «Voz: Agatha Christie». Ninguna frase nombra inferencia activa, energía
  libre ni sus siglas; tampoco uses las palabras «epistémico» ni «pragmático».
- Nada avanza solo. Cada acción (`gate`) debe tener condición clara en el código (`unlock()`).
- Cada paso de clase con `board` lleva `parts` que nombren cada `\p{n}`.
- Dibujo grande, aprovecha el escenario de 1600×900. Tamaño de texto de escenario 24 o más para lo
  importante. Sin rótulos encima de otros. Lo que se lea sobre un círculo se dibuja dentro de él.

## El modelo común

Mercado con dos estados que nadie publica: calma y rumor. Cada día la mesa de Valentina puede esperar o
calmar (publicar un comunicado).

| | calma | rumor |
|---|---|---|
| $r(s,\text{esperar})$ | 0 | −10 |
| $r(s,\text{calmar})$ | −4 | −4 |
| $P(\text{rumor mañana}\mid s,\text{esperar})$ | 0,2 | 0,9 |
| $P(\text{rumor mañana}\mid s,\text{calmar})$ | 0,1 | 0,1 |
| $P(\text{volumen alto}\mid s)$ | 0,2 | 0,8 |
| $P(\text{informe positivo}\mid s)$ | 0,1 | 0,9 |

$\gamma=0{,}9$. Un informe cuesta 1. La creencia $b$ es siempre $P(s=\text{rumor})$.

## Historia

13.8 terminó con la dirección: Torre Halcón, piso 40. Con una dirección no alcanza para retener la cuenta.
Valentina necesita mostrar a la comisión cómo decide esa cuenta, y eso exige reconstruir lo que ella veía.
Cada caso agrega una pieza y la comparan con las órdenes reales de la cuenta.

- 13.9: Valentina dibuja el mercado como estados y flechas, tal como lo describiría alguien que lo viera todo.
- 13.10: Teo nota que el estado no se publica: la cuenta solo pudo ver el volumen. Lo que llevaba era una creencia.
- 13.11: las compras de la cuenta caen siempre justo sobre la misma creencia, 0,4. Es una regla, no suerte.
- 13.12: la cuenta pagó informes solo cuando su creencia estaba cerca de ese umbral, y las facturas llevan
  la misma dirección del piso 40. Queda armado lo que se lee en 13.★.

## 13.9 «Lo que se vería desde arriba» · Procesos de decisión de Markov

Archivo `c9-mesa.tsx`. Glifos: `dec-mdp`, `dec-policy`, `dec-transition`.

Clase: `intro.question` «¿Cómo se decide cuando cada acción cambia lo que viene después y lo que viene
tiene azar?». Dibujo base: dos nodos grandes, calma y rumor, flechas con probabilidad, tabla de recompensas.

1. Definición de MDP: tupla $(S,A,T,r,\gamma)$. Dibujo aparece nodo por nodo.
2. Propiedad de Markov: lo que sigue depende del estado y la acción de hoy, no de la historia.
   Pizarra: $P(s_{t+1}\mid s_t,a_t,s_{t-1},\dots)=T(s_{t+1}\mid s_t,a_t)$. Recuerda las cadenas del Mundo 12.
3. Transición por acción: dos botones esperar y calmar cambian las flechas. `gate`: pulsar ambos.
   `after`: cada fila suma 1; calmar deja el rumor en 0,1 aunque hoy haya rumor.
4. Política $\pi:S\to A$. Dos interruptores, uno por estado. `gate`: dejar calmar en rumor y esperar en calma.
5. Valor de una política: $V^\pi(s)=r(s,\pi(s))+\gamma\sum_{s'}T(s'\mid s,\pi(s))\,V^\pi(s')$. Perilla de
   iteraciones $k$ de 0 a 60 con dos barras: `bellmanStep`. Con esa política: $k=1$: 0 y −4; $k=2$: −0,72 y
   −4,36; $k=3$: −1,30 y −4,98. Converge a −6,61 y −10,28. `gate`: llevar $k$ hasta que las barras no se muevan.
6. Comparar políticas (`ask`): valores en calma: nunca calmar −48,65; siempre calmar −40; calmar solo en
   rumor −6,61. Pregunta cuál conviene y por qué siempre calmar pierde: paga 4 también en los días tranquilos.
7. Ecuación óptima: $V^*(s)=\max_a\big[r(s,a)+\gamma\sum_{s'}T(s'\mid s,a)V^*(s')\big]$, generaliza 13.5.
   En rumor: esperar −18,92, calmar −10,28. En calma: esperar −6,61, calmar −10,28.

Investigación (4 pasos, 2 acciones): con los interruptores, el jugador prueba las cuatro políticas y anota
cuál tiene el mayor valor; luego una predicción: si el rumor durara menos, ¿sube o baja la ventaja de calmar?

Práctica, 3 rondas con datos generados: (1) un paso de Bellman para una política dada, con `NumberField`;
(2) dados $V(\text{calma})$ y $V(\text{rumor})$, calcular $Q(s,a)$ de las dos acciones en un estado y elegir;
(3) elegir la política con mayor valor en calma, entre tres, con valores que hay que calcular de una tabla.
Errores específicos: olvidar $\gamma$; usar la fila de la otra acción; sumar sin ponderar por $T$.

`ref`: definición de MDP, política, valor, ecuación de Bellman de una política y óptima.

## 13.10 «Lo que no se publica» · Estado oculto y creencia

Archivo `c10-oculto.tsx`. Glifos: `dec-pomdp`, `dec-belief`, `dec-filter`.

Clase: `intro.question` «¿Qué se sabe del estado cuando solo se ven señales?». Dibujo base: una barra
grande de creencia de 0 a 1 y una tira de días con señales alto o bajo.

1. POMDP: $(S,A,T,r,\Omega,O,\gamma)$ con $b_0$. Se agregan observaciones $\Omega$ y $O(o\mid s)$. El estado
   existe, pero no se ve.
2. Modelo de observación: tabla 0,2 y 0,8. Una señal no prueba nada, inclina.
3. Creencia: $b(s)=P(s\mid\text{historia})$. Resume todo lo visto y hecho: con ella no hace falta recordar
   la historia. Es lo que permite aplicar lo del Mundo 10 día a día.
4. Corregir con Bayes, estado quieto: $b'(s)=\eta\,O(o\mid s)\,b(s)$. Botones alto y bajo. Desde $b=0{,}2$:
   alto da 0,5; otro alto, 0,8; un bajo vuelve a 0,5. `gate`: llegar a 0,8 con dos señales altas.
   `after`: dos señales altas seguidas pasan de 0,2 a 0,8.
5. Pregunta (`ask`): con $b=0{,}5$ y señal baja, ¿cuánto queda? 0,2.
6. Predecir: $\bar b(s')=\sum_s T(s'\mid s,a)\,b(s)$. El tiempo difumina: desde 0,2 con esperar queda 0,34.
   Perilla de días sin mirar: $b$ se acerca a 2/3, la proporción de largo plazo. `gate`: mover la perilla a 30 días.
   `after`: sin señales la creencia olvida su punto de partida y llega a 0,67, la distribución estacionaria.
7. Filtro completo: $b'(s')=\eta\,O(o\mid s')\sum_s T(s'\mid s,a)\,b(s)$, con $\eta=1/P(o\mid b,a)$. Desde 0,2 y
   esperar: predicción 0,34; $P(\text{alto})=0{,}404$; alto da 0,673; bajo da 0,114.
8. La creencia es el nuevo estado: se conoce siempre y evoluciona con la acción y la señal.

Investigación (4 pasos, 2 acciones): siete días de señales reales de la mesa; el jugador aplica predecir y
corregir con botones, y compara su curva de creencia con las horas en que la cuenta compró.

Práctica, 3 rondas: (1) corregir, (2) predecir, (3) filtro completo, con `NumberField` y tolerancia 0,01.
Errores específicos: olvidar normalizar; corregir antes de predecir; usar la fila de la acción equivocada.

`ref`: POMDP, creencia, predicción, corrección, filtro.

## 13.11 «Decidir sin ver» · Política sobre creencias

Archivo `c11-creencia.tsx`. Glifos: `dec-qbelief`, `dec-alpha`, `dec-beliefmdp`.

Clase: `intro.question` «¿Cuál es la mejor acción si no sabes en qué estado estás?». Dibujo base: gráfico
ancho con $b$ en el eje horizontal y el valor en el vertical.

1. Recompensa esperada: $r(b,a)=\sum_s b(s)\,r(s,a)$. Esperar: $-10b$. Calmar: $-4$.
2. Perilla de $b$ con las dos rectas. `gate`: encontrar dónde se cruzan. `after`: se cruzan en $b=0{,}4$; bajo
   ese valor esperar cuesta menos, sobre él conviene calmar.
3. Umbral general: $b^*=\dfrac{c}{L}$ con costo de calmar $c$ y pérdida del rumor $L$ (usa `threshold`). Con
   $c=4$, $L=10$: 0,4.
4. Valor: $V_1(b)=\max_a r(b,a)$, el borde superior de las rectas. Cada acción es un vector $\alpha_a$ con sus
   recompensas por estado, y $V_1(b)=\max_a \alpha_a\cdot b$. Es convexa y lineal por tramos. La acción
   depende de la creencia y no del estado: eso es una política sobre creencias.
5. Pregunta (`ask`): $V_1(0{,}3)$ y $V_1(0{,}7)$: −3 y −4.
6. POMDP como MDP de creencias: $V(b)=\max_a\big[r(b,a)+\gamma\sum_o P(o\mid b,a)\,V(b'_{a,o})\big]$. El estado
   es $b$, y la transición la da el filtro.
7. Dos etapas desde $b=0{,}2$: esperar: $-2+0{,}9\,[0{,}404\cdot(-4)+0{,}596\cdot(-1{,}14)]=-4{,}07$. Calmar:
   $-4+0{,}9\cdot(-1)=-4{,}90$ (usa `q2`). Conviene esperar, y parte de esa ventaja viene de que mañana se
   decide con una señal más.
8. Por qué mirar ayuda: $V$ es convexa, así que el promedio de $V$ en las creencias posibles supera a $V$
   en el promedio: −2,30 contra −3,40 con $b=0{,}34$. Queda planteado 13.12.

Investigación (4 pasos, 2 acciones): marcar en el gráfico cada compra de la cuenta según su creencia ese día.
Todas quedan sobre 0,4. El jugador arrastra la regla vertical hasta separar compras de no compras.

Práctica, 3 rondas: (1) calcular el umbral con $c$ y $L$ generados; (2) calcular $V_1(b)$ y elegir acción;
(3) comparar dos etapas: dado $P(o)$ y $V_1$ de las dos creencias, calcular $Q(b,\text{esperar})$.

`ref`: recompensa esperada, vectores $\alpha$, política por umbral, ecuación en creencias.

## 13.12 «Mirar antes de actuar» · Valor de la información en un POMDP

Archivo `c12-mirar.tsx`. Glifos: `dec-voi`, `dec-look`.

Clase: `intro.question` «¿Cuándo conviene pagar por saber más antes de decidir?». Dibujo base: la gráfica
$V_1(b)$ con una cuerda entre las dos creencias posibles tras el informe.

1. Una acción puede no cambiar el mundo y cambiar la creencia. Pedir un informe cuesta 1 y acierta con 0,9.
2. Desde $b=0{,}4$: $P(\text{positivo})=0{,}42$; positivo da 0,857; negativo da 0,069.
3. Valor de la información: $\text{VI}(b)=\sum_o P(o\mid b)\,V_1(b_o)-V_1(b)$. Con $b=0{,}4$: $-2{,}08-(-4)=1{,}92$.
4. Perilla de $b$: la cuerda y la distancia a $V_1$ (`voi`). `gate`: buscar dónde es máxima. `after`: el máximo
   está en 0,4, donde la decisión está más dudosa.
5. Pregunta (`ask`): con $b=0{,}9$, ¿cuánto vale el informe? 0: ningún resultado cambia la decisión.
6. Regla: la información vale solo si puede cambiar lo que harías. Con $b=0{,}05$ también vale 0; con $b=0{,}1$ vale 0,18.
7. Perilla del costo: se mira cuando $\text{VI}(b)>c$. Con $c=1$: $b$ entre 0,24 y 0,62. Con $c\ge1{,}92$ no se
   mira nunca. `gate`: subir el costo hasta que la franja desaparezca.
8. Todo cabe en una sola ecuación: $Q(b,\text{mirar})=-c+\sum_o P(o\mid b)\,V(b_o)$ compite con las acciones
   que cambian el mundo. Con eso, reducir incertidumbre y ganar recompensa se comparan en la misma moneda.

Investigación (4 pasos, 2 acciones): las facturas de informes de la cuenta, cada una con la creencia de ese día.
El jugador las ubica en el gráfico y todas caen entre 0,24 y 0,62. Última pantalla: la dirección de las facturas.

Práctica, 3 rondas: (1) calcular las dos creencias tras el informe; (2) calcular $\text{VI}(b)$; (3) con costo
dado, decidir entre mirar, esperar o calmar, con `Choices` y justificación numérica en la retroalimentación.

`ref`: valor de la información, regla de decisión, relación con EVPI de 13.3 (EVPI es la cota con señal perfecta).

## 13.★ Ajuste del repaso

Archivo `final.tsx`. Las cinco lecturas pasan a ser: contrato (valor esperado), información previa (EVPI),
cerrar o seguir (Bellman), creencia (filtro completo) y mirar o actuar (valor de la información con costo).
Se retiran de las lecturas pago futuro y tamaño de posición. El texto de `intro` y las escenas se ajustan
a eso, sin cambiar la revelación final.
