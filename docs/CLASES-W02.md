# Clases del Mundo 2 (Cálculo diferencial) · guion pedagógico

Autor del guion: Claude (director), 2026-10-11. Implementación: Codex, siguiendo el patrón de `src/content/w03/c2-riemann.tsx` (componente `XxxLesson` + `const lesson: LessonStep` + `export { lesson }`).

## Reglas comunes
- La clase enseña la idea desde cero con un ejemplo matemático limpio, distinto de los números de la investigación del caso, para que la investigación siga siendo aplicación y no repetición.
- 5 a 7 beats. Al menos un `gate` (interacción con `unlock()`) y al menos un `ask` (predicción, sin castigo). Cada beat escribe en la pizarra (`board`) la fórmula o idea que acaba de mostrar; la última línea de la pizarra es la fórmula central del tema.
- Voz de NÓESIS: frases cortas, español neutro-chileno, sin vocabulario de inferencia activa (hay un test que lo prohíbe). `say` de una o dos oraciones.
- Usar las piezas de `w02/kit.tsx` (`Secant`, `Tangent`, `SlopeLine`, `deriv`, `nt`) y del engine (`Axes`, `Curve`, `Dot`, `Line`, `Cap`, `Knob`, `useSvgDrag`) como hace el Mundo 3.
- Todos los números que aparecen en `say`, `board`, `ask` deben ser correctos. Calcularlos, no escribirlos de memoria. Decimales con coma en el texto (`7{,}5` en TeX).

## 2.1 «La señal» · Límites y continuidad
Función de ejemplo: $g(x)=\frac{x^2-4}{x-2}$ (hueco en $x=2$, tiende a 4).
1. Se dibuja $g$ con un hueco en $x=2$. Idea: el límite pregunta a qué valor se acerca $g(x)$ cuando $x$ se acerca a 2, sin usar $g(2)$. Pizarra: $\lim_{x\to a} f(x)=L$.
2. Gate: arrastrar un punto hacia $x=2$ desde la izquierda y desde la derecha; una tabla o etiqueta muestra $x$ y $g(x)$ (1,9→3,9; 1,99→3,99; 2,01→4,01). Desbloquea al quedar a menos de 0,05 de 2 por ambos lados. Pizarra: límites laterales $\lim_{x\to a^-}$, $\lim_{x\to a^+}$; el límite existe si coinciden.
3. Un salto: $h(x)=1$ si $x<1$, $h(x)=3$ si $x\ge1$. Laterales 1 y 3 distintos → no hay límite en 1. Ask: «¿Existe $\lim_{x\to1}h(x)$?» opciones [«No: por la izquierda da 1 y por la derecha 3», «Sí, vale 3», «Sí, vale 2»], answer 0.
4. Continuidad: tres condiciones (existe $f(a)$, existe el límite, son iguales). Pizarra: $\lim_{x\to a}f(x)=f(a)$.
5. Forma $\frac00$: factorizar $\frac{x^2-4}{x-2}=x+2$ para $x\neq2$, luego el límite es 4. Ask: «¿Cuánto vale $\lim_{x\to2}\frac{x^2-4}{x-2}$?» [«4», «0», «No existe»], answer 0.
6. Límite al infinito: $\lim_{x\to\infty}\frac{1}{x}=0$ y $\lim_{x\to\infty}\left(5-\frac{3}{x}\right)=5$; la curva se pega a una asíntota horizontal. Pizarra final: $\lim_{x\to\infty}f(x)=L$ (asíntota $y=L$).

## 2.2 «Potencia» · La derivada
Función de ejemplo: $f(x)=x^2$, punto $a=1$.
1. Pendiente de una recta entre dos puntos = cambio en $y$ sobre cambio en $x$. Secante entre $x=1$ y $x=3$: pendiente $(9-1)/2=4$. Pizarra: $\frac{\Delta f}{\Delta x}=\frac{f(b)-f(a)}{b-a}$.
2. Gate: arrastrar el segundo punto hacia $a=1$ (h = 2 → 1 → 0,5 → 0,1); la etiqueta muestra la pendiente $2+h$ (4; 3; 2,5; 2,1). Desbloquea cuando $h<0{,}1$. Pizarra: $\frac{f(a+h)-f(a)}{h}$.
3. La secante se vuelve tangente; su pendiente límite es la derivada. Pizarra: $f'(a)=\lim_{h\to0}\frac{f(a+h)-f(a)}{h}$.
4. Cálculo: $\frac{(1+h)^2-1}{h}=\frac{2h+h^2}{h}=2+h\to2$. Ask: «Entonces, ¿cuánto vale $f'(1)$ para $f(x)=x^2$?» [«2», «1», «4»], answer 0.
5. Lupa: de muy cerca la curva parece su tangente (aproximación local). Mostrar zoom alrededor de $x=1$.
6. Unidades: si $f$ está en metros y $x$ en segundos, $f'$ está en metros por segundo; tasa instantánea de cambio. Pizarra final: $f'(a)$ = pendiente de la tangente = tasa de cambio instantánea, con unidades $\frac{[f]}{[x]}$.

## 2.3 «La gráfica del pico» · La derivada como función
Función de ejemplo: $f(x)=x^3-3x$ (máx. local en $x=-1$, mín. en $x=1$, inflexión en 0). $f'(x)=3x^2-3$, $f''(x)=6x$.
1. Gate: recorrer $f$ con la tangente (knob en $x\in[-2,2]$); abajo se va trazando la pendiente punto a punto: aparece $f'$. Desbloquea al recorrer de −1,5 a 1,5. Pizarra: $x\mapsto f'(x)$ es una función.
2. Signo: donde $f'>0$ la función sube, donde $f'<0$ baja. Colorear tramos. Pizarra: $f'>0\Rightarrow f$ crece; $f'<0\Rightarrow f$ decrece.
3. Ask: «¿En qué $x$ la tangente queda horizontal?» [«$x=-1$ y $x=1$», «$x=0$», «$x=\pm2$»], answer 0. Pizarra: $f'(x)=0$ en picos y valles.
4. Más alto no es más empinado: en $x=-1$ la función está alta y la pendiente es 0. Marcar ambos puntos.
5. Segunda derivada: la pendiente de la pendiente. $f''(x)=6x$: cóncava hacia abajo si $x<0$, hacia arriba si $x>0$. Pizarra: $f''>0$ ∪, $f''<0$ ∩.
6. Inflexión en $x=0$: ahí la pendiente es mínima ($f'(0)=-3$) y cambia la concavidad. Pizarra final: punto de inflexión donde $f''$ cambia de signo.

## 2.4 «Cuadrados que crecen» · Reglas de derivación
1. Cuadrado de lado $x$. Gate: arrastrar un control para agrandar el lado en $h$ y achicar $h$ hasta menos de 0,1; se ven dos franjas $x\cdot h$ y un cuadradito $h^2$ que casi desaparece. Pizarra: $(x+h)^2=x^2+2xh+h^2$, así $\frac{d}{dx}x^2=2x$.
2. Cubo: $(x+h)^3=x^3+3x^2h+3xh^2+h^3$, sobreviven las tres caras: $\frac{d}{dx}x^3=3x^2$. Ask: «¿Cuánto vale la derivada de $x^3$ en $x=2$?» [«12», «8», «6»], answer 0.
3. Regla de la potencia $\frac{d}{dx}x^n=n\,x^{n-1}$; vale también para $x^{-1}$ (da $-x^{-2}$) y $\sqrt{x}=x^{1/2}$ (da $\frac{1}{2\sqrt x}$).
4. Constantes y sumas: $(c\,f)'=c\,f'$, $(f+g)'=f'+g'$, la derivada de una constante es 0. Ejemplo: $\frac{d}{dx}(4x^3-2x+7)=12x^2-2$; en $x=1$ vale 10. Ask: «¿Cuánto vale esa derivada en $x=1$?» [«10», «9», «12»], answer 0.
5. Pizarra final: regla de la potencia + linealidad.

## 2.5 «Voltaje por corriente» · Producto y cociente
Ejemplo: $u(x)=x^2$, $v(x)=3x+1$, rectángulo de lados $u$ y $v$.
1. Gate: arrastrar $x$ un poco; el área crece en dos franjas, $u\,\Delta v$ y $v\,\Delta u$, más una esquina $\Delta u\,\Delta v$ que se vuelve despreciable. Pizarra: $(uv)'=u'v+uv'$.
2. Cálculo: $(uv)'=2x(3x+1)+x^2\cdot3=9x^2+2x$. Comprobación expandiendo: $uv=3x^3+x^2$, derivada $9x^2+2x$. En $x=1$ vale 11.
3. El error típico: $(uv)'\neq u'v'$. Aquí $u'v'=6x$, en $x=1$ da 6. Ask: «¿Cuánto vale $(uv)'$ en $x=1$?» [«11», «6», «4»], answer 0.
4. Cociente: $\left(\frac uv\right)'=\frac{u'v-uv'}{v^2}$. Ejemplo $q=\frac{x}{x+1}$: $q'=\frac{(x+1)-x}{(x+1)^2}=\frac{1}{(x+1)^2}$. Ask: «¿Cuánto vale $q'(1)$?» [«0,25», «0,5», «1»], answer 0.
5. Pizarra final: reglas del producto y del cociente.

## 2.6 «Engranajes» · Regla de la cadena
Ejemplo: $x\to u=3x+1\to y=u^2$.
1. Tres engranajes. Gate: girar el primero (arrastre); $u$ gira 3 veces más rápido que $x$, y en $x=1$ ($u=4$) $y$ gira $2u=8$ veces más rápido que $u$. Pizarra: $\frac{du}{dx}=3$, $\frac{dy}{du}=2u$.
2. Ask: «Si $u$ va 3 veces más rápido que $x$ e $y$ va 8 veces más rápido que $u$, ¿cuántas veces más rápido que $x$ va $y$?» [«24», «11», «8/3»], answer 0. Pizarra: $\frac{dy}{dx}=\frac{dy}{du}\cdot\frac{du}{dx}$.
3. Composición: $(f\circ g)'(x)=f'(g(x))\,g'(x)$. Ejemplo: $\frac{d}{dx}(x^2+1)^5=5(x^2+1)^4\cdot2x$; en $x=1$ vale 160.
4. Razones relacionadas: un círculo cuyo radio crece a 2 cm/s. $A=\pi r^2$, $\frac{dA}{dt}=2\pi r\,\frac{dr}{dt}$; con $r=3$: $12\pi\approx37{,}7$ cm²/s.
5. Pizarra final: regla de la cadena en las dos notaciones.

## 2.7 «Enfriamiento» · Derivadas de exp y log
1. Gate: recorrer $y=e^x$ con un punto; dos etiquetas muestran altura y pendiente, siempre iguales (en $x=1$: 2,718). Pizarra: $(e^x)'=e^x$.
2. Otras bases: $(a^x)'=a^x\ln a$. Para $2^x$, la pendiente en 0 es $\ln2\approx0{,}693$. Ask: «¿Qué base tiene pendiente exactamente 1 en $x=0$?» [«$e\approx2{,}718$», «2», «10»], answer 0.
3. Con la cadena: $(e^{kx})'=k\,e^{kx}$. Ejemplo de decaimiento (no usar la ley de enfriamiento, que es la investigación): $Q(t)=100\,e^{-0{,}5t}$, $Q'(t)=-50\,e^{-0{,}5t}$, $Q'(0)=-50$. Pendiente negativa: la cantidad baja, cada vez más lento.
4. Logaritmo: $\ln x$ es la inversa de $e^x$; su pendiente es $\frac1x$. Ask: «¿Cuánto vale la derivada de $\ln x$ en $x=4$?» [«0,25», «4», «1»], answer 0.
5. Pizarra final: $(e^x)'=e^x$, $(\ln x)'=\frac1x$.

## 2.8 «Máxima eficiencia» · Optimización
Ejemplo: 40 m de reja para un rectángulo; ancho $x$, largo $20-x$, área $A(x)=x(20-x)=20x-x^2$.
1. Gate: arrastrar $x$ entre 0 y 20; una barra o etiqueta muestra el área. Desbloquea al pasar por $x\in[9{,}5;10{,}5]$. Pizarra: $A(x)=20x-x^2$.
2. Ask: «¿Qué ancho da el área máxima?» [«10 m», «20 m», «5 m»], answer 0.
3. En el máximo la tangente es horizontal: $A'(x)=20-2x=0\Rightarrow x=10$, $A(10)=100$ m². Pizarra: puntos críticos donde $f'=0$ o $f'$ no existe.
4. Segunda derivada: $A''=-2<0$, cóncava hacia abajo: es máximo.
5. Intervalo cerrado $[0,20]$: comparar extremos $A(0)=A(20)=0$ con $A(10)=100$.
6. Pizarra final: los pasos para modelar (variable, función, dominio, $f'=0$, comprobar).

## 2.9 «La estimación» · Aproximación lineal y Newton
1. Recta tangente como aproximación: $L(x)=f(a)+f'(a)(x-a)$. Ejemplo $\sqrt x$ cerca de 4: $f(4)=2$, $f'(4)=0{,}25$. Gate: mover $x$ cerca de 4 y ver la distancia entre curva y recta; desbloquea con $|x-4|<0{,}2$. $\sqrt{4{,}1}\approx2{,}025$ (real 2,02485).
2. Ask: «Con esa recta, ¿cuánto estima $\sqrt{4{,}4}$?» [«2,1», «2,4», «2,04»], answer 0. Explicación: $2+0{,}25\cdot0{,}4=2{,}1$; el real es 2,0976.
3. Diferenciales: $dy=f'(x)\,dx$, el cambio estimado.
4. Newton para resolver $x^2-2=0$: $x_{n+1}=x_n-\frac{f(x_n)}{f'(x_n)}$. Desde $x_0=1$: $x_1=1{,}5$, $x_2\approx1{,}41667$, $x_3\approx1{,}414216$ ($\sqrt2=1{,}414214$). Mostrar las tangentes cortando el eje.
5. Pizarra final: aproximación lineal y fórmula de Newton.
