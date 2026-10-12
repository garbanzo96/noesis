# Mundo 7 · Los Cerros · Varias variables · guion completo

Autor del guion: Claude (director), 2026-10-12. Implementación: Codex por tandas, siguiendo la estructura de `src/content/w04/` y `src/content/w06/` (un archivo por caso con escena de apertura, `lesson`, `demo`, `challenge` de 3 rondas y escena de cierre; `final.tsx` de 5 rondas; `kit.tsx`, `ref.ts`, `index.ts` con `withLesson`). Reglas de narrativa: `docs/NARRATIVA.md`. Reglas de clases: las de `docs/CLASES-W02.md` y las affordances nuevas (perillas con `Knob`, que ya muestran mano fantasma y flechas solas).

Todos los números de este guion están verificados.

## Historia

El informe del Archivo (6.★) llevó a la base de Halcón Drones en Los Cerros: 140 dosis salieron en drones y uno no volvió. Los Bomberos de Cerro Barón tienen un piloto de drones de rescate que conoce cada quebrada. La agencia busca el dron perdido antes de que la lluvia de la noche lo arrastre quebrada abajo; su chip guarda las rutas del contrabando.

Personaje nuevo: `tomas`, Tomás Leiva, bombero voluntario y piloto de drones de rescate (color `#ff6b4a`). Voz: calmado, habla en metros y coordenadas, humor seco de rescatista. Retrato: `jaw: 'square'`, pelo corto oscuro, piel media, chaqueta de bombero con franjas reflectantes y una radio al hombro (nuevo `Outfit` o `extra`). Lugar nuevo `cerros` en `src/art/places.tsx`: cerros de noche con niebla, escaleras, casas con luces, una quebrada oscura y la luz roja de un dron a lo lejos.

Arco: 7.1 la última posición del dron y la altura del terreno; 7.2 la pendiente en ese punto; 7.3 por dónde cae (máximo descenso) hasta la quebrada; 7.4 estimar la altura exacta con un plano tangente; 7.5 el portezuelo entre dos cerros, ruta del contrabando; 7.6 dónde poner la antena con batería limitada (restricción); 7.7 cuánta agua caerá en la quebrada esta noche; 7.8 el radio de búsqueda con 95 % de probabilidad. 7.★ Rescate nocturno: el chip guarda mensajes cifrados que viajan por la red de antenas → Mundo 8, Las Antenas.

## Kit (`src/content/w07/kit.tsx`)

- `Surface({ f, P3, n, color, opacity })`: superficie z=f(x,y) dibujada como malla de alambre en proyección ortográfica (azimut y elevación configurables); `P3` mapea (x,y,z) a coordenadas del escenario. Debe permitir animar el azimut (girar la superficie).
- `ContourMap({ P, f, levels, colors })`: mapa visto desde arriba con curvas de nivel (marching squares sobre una grilla de 80×80) y etiquetas de altura.
- `GradField({ P, grad, step })`: campo de flechas del gradiente.
- Helpers numéricos: `partial(f,x,y,'x'|'y')`, `grad`, `dirDeriv`, `hessD` (determinante del hessiano), `dbl(f, a,b,c,d, n)` (integral doble por punto medio), `fmt` con coma decimal.

## 7.1 «El mapa» · Funciones de dos variables y curvas de nivel

Escena de apertura (cuartel de Bomberos de Cerro Barón, 05:30; olor a café recalentado y radios encendidas): Tomás muestra la última posición del dron y la altura que marcaba; Iris quiere saber dónde está el suelo bajo ese punto.

Clase. Ejemplo $h(x,y)=9-x^2-y^2$ (un cerro redondo).
1. Una función de dos variables le asigna a cada punto del plano un número, como la altura del terreno. La superficie gira lentamente. Pizarra: `z=f(x,y)`.
2. Gate: arrastrar un punto sobre el mapa visto desde arriba; arriba se marca el punto de la superficie y su altura. Desbloquea cuando la altura es 5 (cualquier punto con $x^2+y^2=4$, tolerancia 0,15). Pizarra: `f(2,0)=9-4-0=5`.
3. Cortar la superficie a alturas fijas (0, 3, 6, 8): cada corte, visto desde arriba, es una curva de nivel. Pizarra: `\{(x,y):\ f(x,y)=c\}`.
4. Ask: «¿Qué forma tienen las curvas de nivel de $9-x^2-y^2$?» [«Círculos centrados en el origen», «Rectas paralelas», «Parábolas»], answer 0. Explicación: $9-x^2-y^2=c$ equivale a $x^2+y^2=9-c$.
5. Leer un mapa: otro terreno con curvas desparejas. Donde las curvas están juntas, el terreno es empinado; separadas, suave. Ask: «¿Dónde conviene subir caminando?» [«Donde las curvas están separadas», «Donde están juntas», «Da lo mismo»], answer 0.
6. Pizarra final: el mapa de curvas de nivel es la superficie vista desde arriba.

Investigación «La última posición»: mapa de curvas de 60, 80, 100, 120 y 140 m. El dron volaba a 120 m de altitud y a 20 m del suelo. Ask 1: «¿Sobre qué curva estaba?» [«La de 100 m», «La de 120 m», «La de 140 m»]. Ask 2: la curva de 100 m pasa por dos zonas; la antena que recibió la última señal está al este. «¿Cuál de los dos puntos marcados es?» → el del este. Notas: `altura del suelo = 120-20 = 100`, `curva de nivel f(x,y)=100`.

Práctica: (r0) evaluar un polinomio $f(x,y)$ en un punto (enteros pequeños); (r1) escribir el radio de la curva de nivel $c$ de $f=a-x^2-y^2$ (radio $\sqrt{a-c}$, dos decimales); (r2) en un mapa con curvas cada 20 m, estimar la altura de un punto a medio camino entre dos curvas (promedio, tolerancia 3 m).

Cierre: el punto este cae sobre un sendero que baja a una quebrada. Tomás: el dron no se queda quieto en una ladera mojada.

## 7.2 «La ladera» · Derivadas parciales

Escena: subida por la escalera Fischer, garúa. Tomás explica que un dron caído resbala; Iris quiere saber hacia dónde.

Clase. Ejemplo $f(x,y)=x^2+3xy-y^2$ en $(1,2)$: $f=3$.
1. Cortar la superficie con un plano $y=2$ deja una curva de una sola variable; su pendiente es la derivada parcial respecto de $x$. Pizarra: `\frac{\partial f}{\partial x}`: se deriva en $x$ dejando $y$ fija.
2. Gate: mover el plano de corte (perilla) y mirar cómo cambia la curva y su tangente; desbloquea al llegar a $y=2$.
3. Cálculo: $f_x=2x+3y$; en $(1,2)$ vale 8. Pizarra: `f_x=2x+3y,\ f_x(1,2)=8`.
4. Ask: «¿Cuánto vale $f_y=\partial f/\partial y$?» [«$3x-2y$», «$2x+3y$», «$3y-2$»], answer 0. En $(1,2)$ vale $-1$.
5. Interpretación: caminando hacia el este la altura sube 8 por unidad; hacia el norte baja 1. Pizarra final: `f_x,\ f_y` = pendientes en las dos direcciones de los ejes.

Investigación «La pendiente del sendero»: terreno $H(x,y)=200-2x^2-y^2$ (m), punto $(3,4)$ km a escala: $H=166$, $H_x=-12$, $H_y=-8$. Ask: «¿En qué dirección de los ejes baja más rápido?» [«Hacia el este (x crece)», «Hacia el norte», «Igual»]. Notas: `H_x(3,4)=-12`, `H_y(3,4)=-8`.

Práctica: (r0) $f_x$ de un polinomio en un punto; (r1) $f_y$ en un punto; (r2) elegir qué dirección de los ejes es más empinada comparando $|f_x|$ y $|f_y|$.

Cierre: el sendero se abre en abanico; Teo nota que el agua de la lluvia ya baja en diagonal, no por los ejes.

## 7.3 «Cuesta abajo» · Gradiente y derivada direccional

Clase. Mismo $f$ en $(1,2)$: $\nabla f=(8,-1)$, $\|\nabla f\|=\sqrt{65}\approx8{,}06$.
1. El gradiente junta las dos parciales en un vector. Pizarra: `\nabla f=(f_x,f_y)`.
2. Gate: girar una flecha de dirección unitaria $\vec u$ en el punto; una etiqueta muestra $D_{\vec u}f=\nabla f\cdot\vec u$. Desbloquea al acercarse al máximo (ángulo con $\nabla f$ menor a 8°). Pizarra: `D_{\vec u}f=\nabla f\cdot\vec u` (usa el producto punto del Mundo 4).
3. Con $\vec u=(\tfrac35,\tfrac45)$: $D_{\vec u}f=8\cdot0{,}6-1\cdot0{,}8=4$. Ask: «¿Cuál es la mayor tasa de subida posible en $(1,2)$?» [«$\sqrt{65}\approx8{,}06$», «8», «4»], answer 0.
4. El gradiente es perpendicular a las curvas de nivel: mostrarlo sobre el mapa. Pizarra: `\nabla f\perp` curva de nivel.
5. Máximo descenso: $-\nabla f$. El agua y un objeto que rueda bajan por ahí. Pizarra final: dirección de máximo ascenso $\nabla f$, valor $\|\nabla f\|$.

Investigación «Por dónde cayó»: campo $-\nabla H$ sobre el mapa de $H$; desde $(3,4)$ se traza la trayectoria de máximo descenso hasta la quebrada. Ask: dirección inicial de caída: $-\nabla H(3,4)=(12,8)$ normalizado $\approx(0{,}83;\,0{,}55)$. Notas: `-\nabla H(3,4)=(12,8)`.

Práctica: (r0) vector gradiente en un punto (dos campos); (r1) derivada direccional con $\vec u$ de la forma $(3/5,4/5)$ o $(4/5,-3/5)$; (r2) $\|\nabla f\|$ con dos decimales.

Cierre: la trayectoria termina en la quebrada Jaime, justo donde Tomás dejó de tener señal.

## 7.4 «La lupa» · Plano tangente y aproximación lineal

Clase. $f$ en $(1,2)$: $L(x,y)=3+8(x-1)-(y-2)$.
1. De muy cerca, una superficie suave parece un plano (zoom). Pizarra: plano tangente.
2. Pizarra: `L(x,y)=f(a,b)+f_x(a,b)(x-a)+f_y(a,b)(y-b)`.
3. Gate: mover un punto cerca de $(1,2)$ y comparar $f$ y $L$; desbloquea con distancia menor a 0,15.
4. Ask: «¿Cuánto estima $L(1{,}1;\,1{,}9)$?» [«3,9», «3,8», «4,1»], answer 0. Real: 3,87.
5. Pizarra final: error pequeño cerca del punto, grande lejos.

Investigación «El barómetro»: el dron reportó una caída de presión que equivale a bajar 7 m; con $H$ en $(3,4)$ y un desplazamiento $(0{,}5;\,0)$ estimado, $L=166-12\cdot0{,}5=160$; real $H(3{,}5;4)=159{,}5$. Notas con ambos valores.

Práctica: tres estimaciones lineales en puntos cercanos con datos $f(a,b)$, $f_x$, $f_y$ dados.

## 7.5 «El portezuelo» · Puntos críticos y criterio de la segunda derivada

Clase. Ejemplo $f(x,y)=x^3-3x+y^2$.
1. Punto crítico: donde el plano tangente es horizontal, $\nabla f=\vec 0$. Pizarra.
2. $f_x=3x^2-3=0\Rightarrow x=\pm1$; $f_y=2y=0\Rightarrow y=0$. Puntos $(1,0)$ y $(-1,0)$.
3. Tres tipos: máximo (cumbre), mínimo (hoyo) y silla (portezuelo: sube en una dirección y baja en otra). Mostrar las tres superficies.
4. Criterio: $D=f_{xx}f_{yy}-f_{xy}^2$ (el determinante del Mundo 4 aplicado a la matriz hessiana). $D>0$ y $f_{xx}>0$: mínimo; $D>0$ y $f_{xx}<0$: máximo; $D<0$: silla. Aquí $D=12x$.
5. Ask: «¿Qué es $(-1,0)$?» [«Una silla: $D=-12<0$», «Un mínimo», «Un máximo»], answer 0. Y $(1,0)$ es mínimo ($D=12$, $f_{xx}=6$).
6. Pizarra final: tabla del criterio.

Investigación «La ruta del contrabando»: entre Cerro Barón y Cerro Los Placeres hay un portezuelo (silla) por donde los drones cruzan bajo el radar. Superficie $S(x,y)=x^2-y^2+50$ cerca del paso. Ask sobre el tipo de punto en $(0,0)$.

Práctica: cuadráticas $ax^2+bxy+cy^2+dx+ey$: (r0) hallar el punto crítico (dos campos, solución entera); (r1) calcular $D$; (r2) clasificar.

## 7.6 «La batería» · Optimización con restricción (Lagrange)

Clase. Maximizar $f(x,y)=3x+4y$ sobre el círculo $x^2+y^2=1$.
1. Gate: mover un punto sobre el círculo; la etiqueta muestra $f$. Desbloquea cerca del máximo ($f>4{,}95$).
2. En el máximo, la curva de nivel de $f$ toca al círculo sin cruzarlo: son tangentes. Pizarra: `\nabla f=\lambda\,\nabla g`.
3. $(3,4)=\lambda(2x,2y)$ con $x^2+y^2=1$: $(x,y)=(0{,}6;\,0{,}8)$, máximo 5. Ask: «¿Cuánto vale el máximo?» [«5», «7», «1»], answer 0.
4. Ejemplo clásico: maximizar $xy$ con $x+y=10$: $x=y=5$, producto 25.
5. Pizarra final: sistema de Lagrange.

Investigación «La antena»: el dron de búsqueda tiene batería para un círculo de 2 km alrededor del cuartel; la intensidad de la señal crece como $3x+4y$ hacia la quebrada. Máximo en $2\cdot(0{,}6;\,0{,}8)=(1{,}2;\,1{,}6)$ con valor 10.

Práctica: problemas con restricción lineal y objetivo cuadrático de solución entera; (r2) el valor del máximo.

## 7.7 «La lluvia» · Integrales dobles

Clase. $\iint_R (x+y)\,dA$ con $R=[0,2]\times[0,1]$.
1. Volumen bajo una superficie con columnas: suma de Riemann doble (gate: aumentar el número de columnas 2→4→16→64).
2. Pizarra: `\iint_R f\,dA=\lim\sum f(x_i,y_j)\,\Delta x\,\Delta y`.
3. Integrales iteradas (Fubini): $\int_0^2\!\int_0^1 (x+y)\,dy\,dx=\int_0^2 (x+\tfrac12)\,dx=3$. Ask con opciones [«3», «2», «4»].
4. Valor medio: integral dividida por el área: $3/2=1{,}5$.
5. Pizarra final: Fubini y valor medio.

Investigación «Agua en la quebrada»: la lluvia de la noche cae con intensidad $r(x,y)=4+x$ mm/h sobre la cuenca $[0,3]\times[0,2]$ km; en 3 horas el volumen es $3\cdot\iint r\,dA$ (calcular y convertir a m³: $\iint(4+x)\,dA=24+9=33$ mm·km²; 1 mm·km² = 1 000 m³; en 3 h: 99 000 m³).

Práctica: integrales iteradas de polinomios sobre rectángulos; valor medio.

## 7.8 «El radio de búsqueda» · Coordenadas polares

Clase.
1. Coordenadas polares $(r,\theta)$; elemento de área $dA=r\,dr\,d\theta$ (dibujar el sector que crece con $r$).
2. Área del disco: $\int_0^{2\pi}\!\int_0^R r\,dr\,d\theta=\pi R^2$.
3. Ask: $\iint_{r\le2}(x^2+y^2)\,dA=\int_0^{2\pi}\!\int_0^2 r^3\,dr\,d\theta=8\pi$ [«$8\pi$», «$4\pi$», «$16\pi$»].
4. Gate: agrandar el radio de búsqueda con una perilla; la probabilidad $1-e^{-R^2}$ crece; desbloquea al pasar 0,95.
5. Pizarra final: `P(r\le R)=1-e^{-R^2}`, $R_{95}=\sqrt{\ln 20}\approx1{,}73$.

Investigación «Dónde buscar»: densidad de la posición del dron alrededor del último punto, $p=\tfrac1\pi e^{-r^2}$ (km). $P(r\le1)=0{,}632$; para 95 % hace falta $R\approx1{,}73$ km.

Práctica: (r0) área de un sector; (r1) $\iint r^n$ sobre un disco; (r2) radio para una probabilidad dada.

## 7.★ «La quebrada» (5 rondas)

03:00, quebrada Jaime, lluvia. Rondas: altura del suelo con una curva de nivel; gradiente en un punto; estimación lineal; clasificar un punto crítico; radio de búsqueda. Cierre: Tomás baja con cuerda; el dron está entero, con una caja térmica vacía y un chip que sigue transmitiendo mensajes cifrados a una red de antenas → Las Antenas.
