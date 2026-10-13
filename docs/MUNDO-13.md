# Mundo 13 · La Bolsa · Decisión secuencial · guion

Autor del guion: Claude, 2026-10-13. Implementación por misión (Claude o Codex), registrada al pasar la verificación. Estructura como `src/content/w12/` (índice que descubre los casos por archivo; cada caso exporta `level`, `lesson`, `glyphs`, `ref`). World id `'decision'`, carpeta `src/content/w13/`, ids `w13-c1`…`w13-c8`, `w13-final`, module `w13-closed`, acento `#e6e9f2`, lugar `bolsa`. Narrativa según `docs/NARRATIVA.md`. Vocabulario: valor esperado, política, función de valor, Bellman. No escribir «Q(π)» ni términos de inferencia activa (hay un test que los prohíbe); para valores de acción usar `V` o `Q(s,a)`.

## Historia

Los registros fabricados (12.★) no solo pedían dosis: alimentaban anuncios sanitarios que movían contratos de seguros en La Bolsa de Valparaíso. Alguien compraba siempre un paso antes del anuncio. La agencia entra a la sala de operaciones con una operadora que vio los patrones y no se atrevió a reportarlos.

Personaje nuevo: `valentina`, Valentina Ruiz, operadora de mesa en La Bolsa (color `#e6e9f2`). Voz: rápida, precisa, habla en posiciones, márgenes y horarios de cierre; ironía elegante; calcula todo antes de decir que sí. Retrato: `jaw: 'narrow'`, pelo `ponytail` negro, piel clara, `outfit: 'suit'` (`cloth: '#1d2230'`, `cloth2: '#e6e9f2'`), audífono de mesa (`Headset`). Lugar `bolsa`: sala de operaciones de noche con muros de pantallas de cotizaciones, gráficos de velas, un reloj de cierre y la bahía detrás del vidrio.

Arco: 13.1 la apuesta con valor esperado; 13.2 el árbol de decisiones; 13.3 cuánto vale saber antes (EVPI); 13.4 la paciencia: descuento; 13.5 paso a paso: Bellman; 13.6 cuándo parar; 13.7 explorar o explotar; 13.8 un paso antes: tamaño de apuesta de Kelly con ventaja. 13.★ Cinco lecturas; todas las operaciones salen de una cuenta en el último piso de la Torre Halcón → Mundo 14.

## Kit (`src/content/w13/kit.tsx`)
- Helpers: `fmt`/`tnum` con coma, `ev(probs, pays)`, `discount(r, g, t)`, `kellyFrac(p, b) = p − (1 − p)/b`, `growth(p, b, f) = p ln(1 + bf) + (1 − p) ln(1 − f)`.
- `PayTable({ rows, cols, pays })`: tabla de pagos por acción y estado.
- `Tree({ nodes })`: árbol con nodos de decisión (cuadrados) y de azar (círculos), ramas con probabilidades y valores.

## 13.1 «La apuesta» · Valor esperado de una decisión
Clase: contrato que paga +100 si hay brote (p = 0,2) y cuesta −20 si no. E[comprar] = 0,2·100 − 0,8·20 = 4; E[no comprar] = 0 → conviene comprar. Con p = 0,1: −8 → no. Punto de equilibrio: 100p = 20(1 − p) → p = 1/6 ≈ 0,167. Gate: perilla de p; el valor esperado cruza 0 en 1/6. Pizarra: `E[a]=\sum_s P(s)\,u(a,s)`, elegir la acción de mayor E.

## 13.2 «El árbol» · Árboles de decisión
Clase: invertir ahora: 0,5·60 + 0,5·(−20) = 20. Esperar al dato: si es bueno (0,5) invertir rinde 60 − 10 = 50; si es malo (0,5) no invertir, 0: E = 25. Esperar conviene (25 > 20). Se resuelve de atrás hacia adelante: en cada cuadrado se elige la mejor rama; en cada círculo se promedia. Gate: resolver los nodos en orden. Pizarra: `\text{azar: promedio},\ \text{decisión: máximo}`.

## 13.3 «Saber antes» · Valor de la información perfecta
Clase: con la apuesta de 13.1 (p = 0,2): con información perfecta se compra solo si hay brote: E = 0,2·100 + 0,8·0 = 20. Sin información, lo mejor es 4. EVPI = 20 − 4 = 16 por contrato. Pizarra: `\text{EVPI}=E[\text{con información}]-E[\text{sin información}]`. Investigación: cuánto vale conocer un anuncio un día antes.

## 13.4 «Paciencia» · Descuento
Clase: con γ = 0,9 por día, 10 dentro de 3 días valen hoy 10·0,9³ = 7,29; 100 en dos días, 81; 10 cada día para siempre, 10/(1 − 0,9) = 100. Gate: perilla de t y de γ. Pizarra: `\text{VP}=\gamma^t r`, `\sum_{t\ge0}\gamma^t r=\frac{r}{1-\gamma}`.

## 13.5 «Paso a paso» · Ecuación de Bellman
Clase: tres etapas de una operación. En la etapa 3 se cobra 10. En la etapa 2 se puede cerrar con 5 o seguir: max(5; 0,9·10) = 9. En la etapa 1: cerrar con 3 o seguir: max(3; 0,9·9) = 8,1. Gate: calcular de atrás hacia adelante. Pizarra: `V(s)=\max_a\{r(s,a)+\gamma V(s')\}`.

## 13.6 «Cuándo parar» · Parada óptima
Clase: 10 ofertas en orden al azar; solo se puede aceptar al momento. Regla: dejar pasar las primeras r − 1 y aceptar la primera mejor que todas las anteriores. Con n = 10, dejar pasar 3 da P ≈ 0,399 (máximo). Para n grande, dejar pasar n/e y P → 1/e ≈ 0,368. Gate: perilla de r con la probabilidad de éxito. Pizarra: `P(r)=\frac{r-1}{n}\sum_{i=r}^{n}\frac{1}{i-1}`.

## 13.7 «Explorar o explotar» · Bandidos
Clase: dos mesas con tasas de acierto desconocidas (0,4 y 0,6). Tras 5 pruebas en cada una: A 3 de 5 (0,6), B 1 de 5 (0,2): elegir siempre A puede quedarse con la peor si las muestras engañan. ε-codicioso: con probabilidad ε explora al azar. Arrepentimiento al jugar 100 veces la peor: 100·0,2 = 20. Pizarra: `\text{arrepentimiento}=\sum_t(\mu^*-\mu_{a_t})`.

## 13.8 «Un paso antes» · Tamaño de apuesta (Kelly)
Clase: quien conoce el anuncio gana con p = 0,6 una apuesta a la par (b = 1). Fracción de Kelly f* = p − (1 − p)/b = 0,2. Crecimiento por apuesta: 0,6 ln 1,2 + 0,4 ln 0,8 ≈ 0,0201. Apostar la mitad del capital (f = 0,5) da 0,6 ln 1,5 + 0,4 ln 0,5 ≈ −0,034: se pierde aunque se tenga ventaja. Gate: perilla de f con la curva de crecimiento. Pizarra: `f^*=p-\frac{1-p}{b}`.
Investigación: la cuenta que siempre apuesta 20 % del capital, justo antes de cada anuncio.

## 13.★ «La cuenta del último piso» · Repaso (5 lecturas)
Lecturas: valor esperado de un contrato; EVPI; valor presente con descuento; Bellman de dos etapas; fracción de Kelly. Escena final: la cuenta que opera un paso antes está registrada en el piso 40 de la Torre Halcón → Mundo 14.

## Verificación numérica
13.1: 0,2·100 − 0,8·20 = 4; 0,1·100 − 0,9·20 = −8; 20/120 = 1/6. 13.2: 30 − 10 = 20; 0,5·50 = 25. 13.3: 20 − 4 = 16. 13.4: 10·0,729 = 7,29; 100·0,81 = 81; 10/0,1 = 100. 13.5: max(5; 9) = 9; max(3; 8,1) = 8,1. 13.6: n = 10: r = 3 → 0,366; r = 4 → 0,399; r = 5 → 0,398; 1/e = 0,368. 13.7: 100·(0,6 − 0,4) = 20. 13.8: 0,6 − 0,4 = 0,2; 0,6·0,18232 + 0,4·(−0,22314) = 0,02014; 0,6·0,40547 + 0,4·(−0,69315) = −0,03398.
