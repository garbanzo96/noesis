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

## Casos 2.4–2.9
Pendientes para la siguiente tanda (mismo formato): reglas de derivación, producto y cociente, cadena y razones relacionadas, exp y log, optimización, aproximación lineal y Newton.
