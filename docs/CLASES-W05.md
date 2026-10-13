# Clases del Mundo 5 (Casino Aurora · Probabilidad) · guion pedagógico

Autor del guion: Claude, 2026-10-13. Implementación: una clase por tarea (Claude o Codex), cada una registrada al pasar la verificación. Patrón de código: `src/content/w07/c3-cuesta.tsx` (componente `XxxLesson` + `const lesson: LessonStep` + `export { lesson }`; `withLesson` en `src/content/w05/index.ts`).

## Reglas comunes
- La clase enseña la idea desde cero con un ejemplo propio (moneda, dado, urna, tabla de curso), distinto de los números del caso, para que la investigación siga siendo aplicación.
- 5 a 6 beats, al menos un `gate` (interacción con `unlock()`) y un `ask`. Cada beat deja en la pizarra (`board`) la fórmula o idea que mostró. La última entrada es la fórmula central.
- Voz de NÓESIS: frases cortas, sin vocabulario de inferencia activa. Decimales con coma.
- Dibujo grande en x≈150–900; lecturas en x≈1050–1450. Una sola guía de arrastre por paso.
- Reutilizar `w05/kit.tsx` (`DiceGrid`, `Bars`, `Table`, `Formula`, `fracTex`) y el motor (`Knob`, `useSvgDrag`, `Cap`).

## 5.1 «La casa» · Espacio muestral y eventos
Ejemplo: se lanza una moneda (C, S) y un dado. Ω tiene 2·6 = 12 resultados, en una grilla de 2 filas × 6 columnas.
1. Un experimento aleatorio tiene una lista de resultados posibles: el espacio muestral. Pizarra: `\Omega=\{(m,d)\}`, `|\Omega|=2\cdot6=12`.
2. Gate: marcar las casillas del evento «cara y número par». Desbloquea con exactamente {C2, C4, C6}. Pizarra: `A=\{C2,C4,C6\}\subseteq\Omega`.
3. Ask: «¿Cuántos resultados tiene “número mayor que 4”?» [«4», «2», «8»], answer 0 (C5, C6, S5, S6). Pizarra: `|B|=4`.
4. Complemento: lo que no está en A. 12 − 3 = 9. Pizarra: `|A^c|=|\Omega|-|A|=9`.
5. Ask: «¿Son disjuntos A y B?» [«No: comparten C6», «Sí», «Solo si sale sello»], answer 0. Pizarra: `A\cap B=\{C6\}`.

## 5.2 «Mil tiradas» · Probabilidad y frecuencia
Ejemplo: un dado honesto.
1. Si los resultados son igual de probables, P(A) = casos de A / casos totales. P(5 o 6) = 2/6 = 1/3. Pizarra: `P(A)=\frac{|A|}{|\Omega|}`.
2. Gate: perilla con n = 10, 100, 1 000, 10 000 tiradas (secuencia fija generada con `rng`); se muestra la frecuencia de «5 o 6». Desbloquea al llegar a 10 000. La frecuencia se acerca a 0,333. Pizarra: `\frac{\#A}{n}\to P(A)`.
3. Ask: «En 600 tiradas, ¿cuántas veces esperas “5 o 6”?» [«200», «100», «300»], answer 0. Pizarra: `n\cdot P(A)=600\cdot\tfrac13=200`.
4. Con pocas tiradas la frecuencia salta; con muchas se estabiliza. Pizarra: ley de los grandes números (texto).
5. Pizarra final: `0\le P(A)\le1`, `P(\Omega)=1`.

## 5.3 «Reglas de la casa» · Reglas de la probabilidad
Ejemplo: un dado. A = «par» = {2, 4, 6}; B = «mayor que 3» = {4, 5, 6}; A∩B = {4, 6}; A∪B = {2, 4, 5, 6}.
1. Complemento: P(no sale 6) = 1 − 1/6 = 5/6. Pizarra: `P(A^c)=1-P(A)`.
2. Gate: arrastrar el círculo B sobre A hasta que se superpongan en {4, 6}; la cuenta muestra 3 + 3 = 6 y la unión real tiene 4. Pizarra: `|A\cup B|=|A|+|B|-|A\cap B|`.
3. Ask: «¿Cuánto vale P(A∪B)?» [«2/3», «1», «1/3»], answer 0: 3/6 + 3/6 − 2/6 = 4/6. Pizarra: `P(A\cup B)=P(A)+P(B)-P(A\cap B)`.
4. Disjuntos: «sale 1» y «sale 6» no comparten resultados; P = 1/6 + 1/6 = 1/3. Pizarra: `A\cap B=\varnothing\Rightarrow P(A\cup B)=P(A)+P(B)`.
5. Ask: «P(par o 1)?» [«2/3», «1/2», «5/6»], answer 0 (3/6 + 1/6).

## 5.4 «La tabla de jugadores» · Probabilidad conjunta y marginal
Ejemplo: curso de 100 estudiantes. Deporte sí/no × música sí/no: (D, M) = 30, (D, no M) = 20, (no D, M) = 10, (no D, no M) = 40.
1. Cada celda cuenta a quienes cumplen dos cosas a la vez. P(D y M) = 30/100 = 0,30. Pizarra: `P(D\cap M)=0{,}30`.
2. Gate: arrastrar la barra de suma por la fila D; aparece 30 + 20 = 50. Desbloquea al soltarla en el margen. Pizarra: `P(D)=P(D\cap M)+P(D\cap M^c)=0{,}50`.
3. Ask: «¿Cuánto vale P(M)?» [«0,40», «0,30», «0,60»], answer 0 (30 + 10). Pizarra: `P(M)=0{,}40`.
4. La tabla completa suma 1: 0,30 + 0,20 + 0,10 + 0,40. Pizarra: `\sum P=1`.
5. Pizarra final: marginal = suma de una fila o columna de la conjunta.

## 5.5 «Dado que…» · Probabilidad condicional
Misma tabla de 5.4.
1. Saber algo achica el universo: si sabemos que la persona hace deporte, quedan 50. Pizarra: «nuevo total = 50».
2. Gate: tocar la fila D para filtrar; las otras celdas se apagan y las de D se reescalan a 30/50 y 20/50. Pizarra: `P(M\mid D)=\frac{P(M\cap D)}{P(D)}=\frac{0{,}30}{0{,}50}=0{,}6`.
3. Ask: «¿Cuánto vale P(D | M)?» [«0,75», «0,60», «0,30»], answer 0 (30/40). Pizarra: `P(D\mid M)=\frac{30}{40}=0{,}75`.
4. El orden importa: 0,6 ≠ 0,75. Pizarra: `P(M\mid D)\neq P(D\mid M)`.
5. Regla del producto: P(D y M) = P(D)·P(M | D) = 0,5·0,6 = 0,3. Pizarra final: `P(A\cap B)=P(A)\,P(B\mid A)`.

## 5.6 «Independencia» · Eventos independientes
1. Moneda y dado: saber que salió cara no cambia la probabilidad de 6. P(cara y 6) = 1/12 = (1/2)(1/6). Pizarra: `P(A\cap B)=P(A)P(B)`.
2. En la tabla de 5.4: P(D y M) = 0,30 pero P(D)P(M) = 0,5·0,4 = 0,20. No son independientes. Pizarra: `0{,}30\neq0{,}20`.
3. Gate: perilla que mueve personas entre celdas manteniendo filas (50, 50) y columnas (40, 60). Desbloquea cuando (D, M) = 20: entonces P(M | D) = 20/50 = 0,4 = P(M). Pizarra: `P(M\mid D)=P(M)`.
4. Ask: «Con (D, M) = 20, ¿cuánto vale (no D, M)?» [«20», «10», «30»], answer 0 (40 − 20).
5. Pizarra final: independientes ⇔ `P(B\mid A)=P(B)`.

## 5.7 «Sin reposición» · Árboles y probabilidad total
Ejemplo: urna con 3 rojas y 2 azules; se sacan 2 sin devolver.
1. Primer nivel del árbol: R con 3/5, A con 2/5. Pizarra: ramas suman 1.
2. Gate: sacar una roja (arrastrarla fuera de la urna); el segundo nivel se recalcula: R con 2/4, A con 2/4. Pizarra: `P(R_2\mid R_1)=\tfrac24`.
3. Multiplicar por la rama: P(R, R) = 3/5 · 2/4 = 6/20 = 3/10. Pizarra: `P(R_1\cap R_2)=\tfrac35\cdot\tfrac24=\tfrac{3}{10}`.
4. Ask: «¿P(dos colores distintos)?» [«3/5», «3/10», «2/5»], answer 0: 3/5·2/4 + 2/5·3/4 = 12/20.
5. Probabilidad total: P(segunda roja) = 3/5·2/4 + 2/5·3/4 = 3/5. Con reposición, P(R, R) = 9/25. Pizarra final: `P(B)=\sum_i P(A_i)P(B\mid A_i)`.

## 5.8 «El dado cargado» · Teorema de Bayes
Ejemplo: en una bolsa hay una moneda honesta y una trucada con dos caras. Se toma una al azar y sale cara.
1. 100 repeticiones: 50 honestas, 50 trucadas. Pizarra: prior `P(T)=\tfrac12`.
2. Gate: repartir las caras (arrastre): de las honestas salen 25 caras; de las trucadas, 50. Desbloquea al completar ambas. Pizarra: `P(\text{cara}\mid T)=1`, `P(\text{cara}\mid H)=\tfrac12`.
3. Ask: «Salió cara. ¿Probabilidad de que sea la trucada?» [«2/3», «1/2», «1»], answer 0 (50 de 75).
4. Fórmula: P(T | cara) = (1/2·1)/(1/2·1 + 1/2·1/2) = (1/2)/(3/4) = 2/3. Pizarra: `P(T\mid C)=\frac{P(C\mid T)P(T)}{P(C)}`.
5. Pizarra final: `P(C)=P(C\mid T)P(T)+P(C\mid H)P(H)=\tfrac34`.

## 5.9 «La ventaja de la casa» · Variable aleatoria y esperanza
Ejemplo: pagas 1 ficha por lanzar un dado; si sale 6 recibes 4 fichas (ganancia neta +3); si no, pierdes la ficha (−1).
1. Una variable aleatoria asigna un número a cada resultado. X = +3 con 1/6; −1 con 5/6. Pizarra: tabla de X.
2. Esperanza = promedio ponderado: E[X] = 3·1/6 − 1·5/6 = −2/6 = −1/3. Pizarra: `E[X]=\sum x\,P(X=x)=-\tfrac13`.
3. Ask: «En 600 juegos, ¿cuánto esperas ganar en total?» [«−200 fichas», «−100», «0»], answer 0. Pizarra: `600\cdot(-\tfrac13)=-200`.
4. Gate: perilla del premio (2 a 8 fichas recibidas). Desbloquea en 6: ganancia neta +5 con 1/6 y −1 con 5/6, E = 5/6 − 5/6 = 0 (juego justo). Pizarra: `E[X]=0`.
5. Pizarra final: la casa gana si `E[X]<0` para el jugador.

## Verificación numérica
5.1: 2·6 = 12; 12 − 3 = 9; {C5, C6, S5, S6} = 4; A∩B = {C6}. 5.2: 2/6 = 1/3; 600/3 = 200. 5.3: 1 − 1/6 = 5/6; 3/6 + 3/6 − 2/6 = 4/6 = 2/3; 1/6 + 1/6 = 1/3; 3/6 + 1/6 = 4/6 = 2/3. 5.4: 30 + 20 = 50; 30 + 10 = 40; 30 + 20 + 10 + 40 = 100. 5.5: 30/50 = 0,6; 30/40 = 0,75; 0,5·0,6 = 0,3. 5.6: (1/2)(1/6) = 1/12; 0,5·0,4 = 0,20; 20/50 = 0,4; 40 − 20 = 20. 5.7: 3/5·2/4 = 6/20 = 3/10; 3/5·2/4 + 2/5·3/4 = 12/20 = 3/5; (3/5)² = 9/25. 5.8: 25 + 50 = 75; 50/75 = 2/3; (1/2)/(3/4) = 2/3; 1/2 + 1/4 = 3/4. 5.9: 3/6 − 5/6 = −1/3; 600·(−1/3) = −200; 5/6 − 5/6 = 0.
