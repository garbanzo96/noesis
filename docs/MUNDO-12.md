# Mundo 12 · La Fábrica · Modelos generativos · guion

Autor del guion: Claude, 2026-10-13. Implementación por misión (Claude o Codex), registrada al pasar la verificación. Estructura como `src/content/w11/` (índice que descubre los casos por archivo; cada caso exporta `level`, `lesson`, `glyphs`, `ref`). World id `'generative'`, carpeta `src/content/w12/`, ids `w12-c1`…`w12-c8`, `w12-final`, module `w12-closed`, acento `#c9b37e`, lugar `fabrica`. Narrativa según `docs/NARRATIVA.md`.

## Historia

En el servidor del Laboratorio (11.★) hay carpetas de registros clínicos «indistinguibles de los reales». Vienen de La Fábrica, una planta de datos de Halcón en el antiguo barrio industrial de Barón: máquinas que aprenden cómo se ven los registros y producen miles de nuevos. Con ellos, Halcón justificó compras de dosis y bonos de riesgo sanitario.

Personaje nuevo: `joaquin`, Joaquín Tapia, operador del turno de noche de La Fábrica (color `#c9b37e`). Voz: lacónico, práctico, habla de lotes, cintas y turnos; desconfía de las máquinas que no se cansan; humor seco de obrero. Retrato: `jaw: 'square'`, pelo `short` canoso, piel morena, `outfit: 'overalls'` (`cloth: '#3a3226'`, `cloth2: '#c9b37e'`), audífonos de protección (`Headphones`). Lugar `fabrica`: nave industrial de noche con cintas transportadoras de carpetas, impresoras en fila, un tablero de luces ámbar y vapor de una caldera vieja.

Arco: 12.1 un modelo generativo es una receta para sacar datos; 12.2 la campana ajustada a los datos; 12.3 mezclas de dos grupos; 12.4 secuencias que se repiten (cadenas de Markov); 12.5 rasgos ocultos que generan muchas columnas; 12.6 el detector que compara verosimilitudes; 12.7 la firma de los primeros dígitos (Benford); 12.8 demasiado perfecto (χ²). 12.★ Cinco lecturas; los registros falsos se usaron para apostar en el mercado antes que nadie → Mundo 13, La Bolsa.

## Kit (`src/content/w12/kit.tsx`)
- Helpers: `fmt`/`tnum` con coma, `mean`, `varMle`, `normalPdf`, `benford(d) = log₁₀(1 + 1/d)`, `chi2(obs, exp)`.
- `Bars({ labels, values, color, max })`: barras con etiquetas (como `Dist` del Mundo 11).

## 12.1 «La receta» · Qué es un modelo generativo
Clase: un modelo generativo describe P(x) y permite sacar datos nuevos. Ejemplo: resultados de un test en tres niveles con P = (0,2; 0,5; 0,3). Muestreo con la acumulada: u uniforme en [0, 1): u < 0,2 → bajo; 0,2 ≤ u < 0,7 → medio; u ≥ 0,7 → alto. Gate: arrastrar u y ver qué nivel sale; desbloquea tras pasar por los tres tramos. Ask: «Si u = 0,65, ¿qué sale?» [«medio», «alto», «bajo»]. Con 1000 muestras, las frecuencias se acercan a 0,2; 0,5; 0,3. Pizarra: `F(x)=P(X\le x)`, `x=F^{-1}(u)`.
Investigación «La cinta de carpetas»: cada carpeta sale con un sorteo; Ask sobre u = 0,15 → bajo; notas.
Práctica: (r0) valor para un u dado; (r1) acumulada en un punto; (r2) frecuencia esperada en n muestras.

## 12.2 «La campana» · Ajustar una normal y generar
Clase: datos 4, 6, 5, 7, 8: media 6, varianza (dividida por n) 2, desviación √2 ≈ 1,41. La máquina genera x = μ + σz con z normal estándar. Gate: mover μ y σ hasta que la curva cubra los datos (μ = 6, σ ≈ 1,41). Pizarra: `\hat\mu=\bar x`, `\hat\sigma^2=\frac1n\sum(x_i-\bar x)^2`.
Práctica: media, varianza y un valor generado desde z.

## 12.3 «Dos grupos» · Mezclas
Clase: dos máquinas A y B producen valores 0–3 con A = (0,5; 0,3; 0,15; 0,05), B = (0,05; 0,15; 0,3; 0,5), mitad y mitad. Un registro con x = 2: P(A | x = 2) = 0,5·0,15/(0,5·0,15 + 0,5·0,3) = 1/3. Pizarra: `P(x)=\pi P_A(x)+(1-\pi)P_B(x)`, responsabilidad `r_A=\frac{\pi P_A(x)}{P(x)}`.

## 12.4 «Lo que se repite» · Cadenas de Markov
Clase: estados «sano» (S) y «enfermo» (N) en registros diarios: P(S→S) = 0,9, P(S→N) = 0,1, P(N→S) = 0,5, P(N→N) = 0,5. P(S, S, N) desde S = 0,9·0,1 = 0,09. Distribución estacionaria: (5/6, 1/6). Gate: avanzar días y ver la fracción acercarse a 5/6. Pizarra: `\pi_S=\frac{P(N\to S)}{P(S\to N)+P(N\to S)}`.

## 12.5 «Rasgos ocultos» · Variables latentes
Clase: dos mediciones x = μ + z·w con μ = (5, 5), w = (0,6; 0,8) y z un rasgo oculto. Para x = (5,6; 6,2): z = w·(x − μ) = 0,6·0,6 + 0,8·1,2 = 1,32; reconstrucción μ + 1,32w = (5,792; 6,056). Gate: mover z y ver el punto recorrer la recta. Pizarra: `x=\mu+z\,w`, `\hat z=w^\top(x-\mu)`.

## 12.6 «El detector» · Comparar verosimilitudes
Clase: registros reales p = (0,2; 0,6; 0,2) en {bajo, medio, alto}; la máquina q = (0,1; 0,8; 0,1). Un lote con 8 «medio», 1 «bajo» y 1 «alto»: razón real/máquina = (0,6/0,8)⁸·(0,2/0,1)² ≈ 0,40 < 1: más probable de la máquina. Pizarra: `\Lambda=\prod_i\frac{p(x_i)}{q(x_i)}`.

## 12.7 «La firma» · Ley de Benford
Clase: en montos reales, el primer dígito d aparece con P(d) = log₁₀(1 + 1/d): 1 → 0,301; 2 → 0,176; … 9 → 0,046. Los registros de la máquina tienen primeros dígitos casi uniformes (1/9 ≈ 0,111). Gate: arrastrar la barra del 1 hasta 0,30. Pizarra: `P(d)=\log_{10}\!\left(1+\tfrac1d\right)`.

## 12.8 «Demasiado perfecto» · Prueba χ²
Clase: χ² = Σ (O − E)²/E. Con 1000 montos y primeros dígitos uniformes frente a Benford: χ² ≈ 402 (mucho más que 15,5, el corte del 5 % con 8 grados de libertad). Pero el lote de la Fábrica da χ² ≈ 0,002: con datos reales lo esperable es un valor cerca de 8; tan poco desvío es una firma de fabricación (corte inferior del 5 %: 2,73). Gate: mover un conteo y ver χ² subir. Pizarra: `\chi^2=\sum\frac{(O-E)^2}{E}`.

## 12.★ «El lote perfecto» · Repaso (5 lecturas)
Lecturas: valor desde u; media y varianza; responsabilidad en una mezcla; probabilidad estacionaria; χ² de un lote. Escena final: los registros falsos alimentaron apuestas de seguros sanitarios en La Bolsa antes de cada anuncio → Mundo 13.

## Verificación numérica
12.2: media (4+6+5+7+8)/5 = 6; varianza (4+0+1+1+4)/5 = 2; √2 = 1,414. 12.3: 0,075/(0,075 + 0,15) = 1/3. 12.4: 0,9·0,1 = 0,09; 0,5/(0,1 + 0,5) = 5/6. 12.5: 0,36 + 0,96 = 1,32; 5 + 0,792 = 5,792; 5 + 1,056 = 6,056. 12.6: 0,75⁸ = 0,1001; ·4 = 0,4005. 12.7: log₁₀2 = 0,301; log₁₀1,5 = 0,176; log₁₀(10/9) = 0,046. 12.8: χ² uniforme frente a Benford con 1000 = 401,7; lote (301, 176, 125, 97, 79, 67, 58, 51, 46) = 0,002; χ²₀,₉₅(8) = 15,51; χ²₀,₀₅(8) = 2,73.
