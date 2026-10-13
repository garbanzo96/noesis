# Mundo 10 · La Clínica · Inferencia bayesiana · guion

Autor del guion: Claude, 2026-10-13. Implementación: una misión por tarea (Claude o Codex), registrada al pasar la verificación. Estructura como `src/content/w07/`: un archivo por caso con escena de apertura, `lesson`, `demo`, `challenge` de 3 rondas y escena de cierre; `final.tsx` de 5 lecturas; `kit.tsx`, `ref.ts`, `index.ts` con `withLesson`. World id `'bayesian'`, carpeta `src/content/w10/`, ids `w10-c1`…`w10-c8`, `w10-final`, module `w10-closed`, acento `#ff8fa3`, lugar `clinica`. Narrativa según `docs/NARRATIVA.md`.

## Historia

El recibo del Observatorio (9.★) lleva las vacunas desviadas a la Clínica del Cerro. Ahí, el test rápido de la campaña da positivo demasiadas veces, y cada positivo autoriza a pedir más dosis. Halcón no necesita robar vacunas si consigue que la Clínica las pida.

Personaje nuevo: `rocio`, Rocío Pizarro, tecnóloga médica del laboratorio de la Clínica (color `#ff8fa3`). Voz: precisa y cansada, habla en muestras, controles y turnos; desconfía de los números redondos. Retrato: `jaw: 'oval'`, pelo `bun` castaño, piel media, `outfit: 'cardigan'` sobre delantal claro (`cloth: '#e8eef2'`, `cloth2: '#ff8fa3'`), lentes redondos. Lugar `clinica`: pasillo de laboratorio de noche, refrigerador de vacunas con luz azul, mesón con tubos y un lector de tests, ventana al cerro con lluvia.

Arco: 10.1 de 1000 positivos posibles, pocos son enfermos de verdad; 10.2 la prevalencia que usa la Clínica está inflada; 10.3 repetir el test cambia todo; 10.4 las chances explican por qué un negativo tranquiliza tanto; 10.5 la tasa de positivos de un lote, con lo que se sabía antes; 10.6 el resumen del lote; 10.7 el lector de tests, ¿honesto o alterado?; 10.8 los positivos reportados no calzan con lo esperado: 600 contra 201. 10.★ Cinco lecturas del informe sanitario; el lector alterado salió del Laboratorio de Halcón, donde corren un modelo «imposible de calcular» → Mundo 11, El Laboratorio.

## Kit (`src/content/w10/kit.tsx`)
- `People({ total, groups, cols })`: grilla de íconos de personas (1000 = 40 × 25) coloreada por grupos (enfermo/sano × positivo/negativo), con transición animada al reagrupar.
- `TreeBayes({ prior, sens, spec, n })`: árbol de frecuencias con conteos en cada rama.
- `OddsBar({ odds })`: barra partida en proporción a:b.
- `BetaCurve({ a, b, P })`: densidad Beta(a, b) en un plano; marca media y moda.
- Helpers: `ppv(prev, sens, spec)`, `oddsOf(p)`, `probOf(odds)`, `betaPdf(x,a,b)`, `fmt` con coma.

## 10.1 «Mil personas» · Bayes con frecuencias naturales
Escena: laboratorio, 06:10; el lector de tests pita cada vez que sale un positivo. Rocío muestra la planilla: 67 positivos en el último lote de 1000.
Clase (ejemplo: prevalencia 2 %, sensibilidad 90 %, especificidad 95 %, 1000 personas).
1. 1000 íconos; 20 enfermos (2 %). Pizarra: `1000\cdot0{,}02=20`.
2. Gate: arrastrar la perilla de sensibilidad a 90 %: 18 de los 20 enfermos se vuelven positivos. Pizarra: `20\cdot0{,}9=18`.
3. Los sanos también dan positivo: 5 % de 980 = 49. Pizarra: `980\cdot0{,}05=49`.
4. Ask: «Si alguien da positivo, ¿qué probabilidad tiene de estar enfermo?» [«18/67 ≈ 0,27», «0,90», «0,95»], answer 0. Pizarra: `P(E\mid+)=\tfrac{18}{18+49}\approx0{,}27`.
5. Pizarra final: `P(E\mid+)=\frac{P(+\mid E)P(E)}{P(+)}`.
Investigación «La planilla del turno»: lote de 1000 con 67 positivos; Ask 1: «¿Cuántos de esos positivos se esperan enfermos?» [«18», «67», «60»]; Ask 2: «¿Qué cifra usó la Clínica para pedir dosis?» [«Los 67 positivos como si fueran enfermos», «Los 18», «Los 49»].
Práctica: (r0) contar positivos verdaderos con prevalencia, sensibilidad dadas; (r1) falsos positivos; (r2) P(E | +) a dos decimales. Error típico: confundir P(E | +) con la sensibilidad.
Cierre: Rocío anota 18 en la pizarra blanca; Iris pregunta de dónde salió el 2 %.

## 10.2 «La cifra base» · Tasa base y valor predictivo
Clase: el mismo test con prevalencia 20 %: 200 enfermos, 180 positivos verdaderos, 40 falsos (5 % de 800); VPP = 180/220 ≈ 0,82.
1. Gate: perilla de prevalencia de 1 % a 20 %; la grilla y el VPP se actualizan. Desbloquea en 20 %.
2. Ask: «¿Por qué el VPP cambió tanto si el test es el mismo?» [«Porque hay más enfermos para detectar y los mismos 5 % de sanos», «Porque el test mejoró», «Porque bajaron los falsos negativos»], answer 0.
3. Pizarra: `\text{VPP}=\frac{s\,\pi}{s\,\pi+(1-e)(1-\pi)}`.
Investigación «La prevalencia del informe»: la Clínica declaró 20 % de prevalencia para estimar casos; el censo regional dice 2 %. Con 20 % parecían 82 % de positivos reales; con 2 %, 27 %.
Práctica: VPP con prevalencia, sensibilidad y especificidad sorteadas (números de tabla de 1000). Error típico: olvidar los falsos positivos.

## 10.3 «La segunda muestra» · Actualización secuencial
Clase: después de un positivo, P = 18/67 pasa a ser el nuevo punto de partida; un segundo test independiente positivo da 16,2/(16,2 + 2,45) = 324/373 ≈ 0,87.
Gate: arrastrar el resultado del primer test a la entrada del segundo árbol. Ask: «¿P(E | dos positivos)?» [«≈ 0,87», «≈ 0,27», «0,90»].
Investigación «Las muestras repetidas»: la Clínica nunca repitió el test a los positivos.
Práctica: actualización en dos pasos con números de tabla. Error típico: multiplicar sensibilidades sin normalizar.

## 10.4 «Chances» · Odds y razón de verosimilitud
Clase: prior 2 % = chances 1:49. LR+ = 0,9/0,05 = 18 → chances 18:49 → P = 18/67. Dos positivos: 324:49 → 324/373. LR− = 0,1/0,95 = 2/19 → negativo: 2:931 → P = 2/933 ≈ 0,002.
Gate: arrastrar el multiplicador LR sobre la barra de chances. Pizarra final: `\text{chances}_\text{post}=\text{chances}_\text{prior}\cdot LR`.
Investigación «El negativo que tranquiliza». Práctica: chances posteriores y probabilidad.

## 10.5 «El lote» · Prior y posterior para una proporción
Clase: tasa de positivos θ de un lote; prior Beta(1, 1) (nada sabido) y 7 positivos de 10 → Beta(8, 4), media 8/12 = 2/3. Con lo que se sabía de otras clínicas, Beta(2, 8) (media 0,2) → Beta(9, 11), media 9/20 = 0,45. Gate: perilla de positivos observados de 0 a 10 actualiza la curva. Pizarra: `\text{Beta}(a,b)+k\text{ de }n\Rightarrow\text{Beta}(a+k,\ b+n-k)`.
Investigación «Los lotes de agosto». Práctica: parámetros y media posterior. Error típico: sumar n a ambos parámetros.

## 10.6 «El resumen» · Media, moda e intervalo creíble
Clase: grilla de θ ∈ {0,1; 0,3; 0,5; 0,7; 0,9} con prior uniforme y 7 de 10 positivos: posteriores ≈ 0,0000; 0,0200; 0,2602; 0,5924; 0,1274. Moda 0,7; media ≈ 0,665; el conjunto {0,5; 0,7} acumula ≈ 0,853 (≥ 80 %). Con Beta(8, 4): media 2/3, moda 7/10. Gate: ir agregando valores de θ al conjunto creíble hasta pasar 80 %.
Investigación y práctica: resumir posteriores de grillas pequeñas. Error típico: confundir media y moda.

## 10.7 «El lector» · Factor de Bayes
Clase: ¿lector honesto (positivo con prob. 0,5 en muestras de control ambiguas) o alterado (0,8)? 4 positivos en 5 controles: P(D | honesto) = 0,5⁵ = 1/32 = 0,03125; P(D | alterado) = 0,8⁴·0,2 = 0,08192; factor de Bayes ≈ 2,62; con chances 1:1, P(alterado | D) ≈ 0,72. Gate: agregar controles uno a uno y ver el factor. Pizarra: `BF=\frac{P(D\mid M_1)}{P(D\mid M_0)}`.
Investigación «Los controles del lector». Práctica: factores de Bayes con datos cortos.

## 10.8 «Seiscientos» · Predicción y decisión
Clase: con prevalencia 2 % y el test honesto, P(+) = 0,067; en 3000 tests se esperan 201 positivos. La Clínica reportó 600. Decidir: tratar si P(E | datos) > umbral c_{FP}/(c_{FP}+c_{FN}); con costos 1 y 4, umbral 0,2: tratar con un positivo (0,27), no tratar con un negativo (0,002). Gate: perilla de costos que mueve el umbral. Ask: «¿Qué indican 600 positivos de 3000?» [«Que el lector o la prevalencia fueron alterados», «Que la epidemia creció 3 veces», «Nada: es azar»].
Investigación «El informe de agosto». Práctica: positivos esperados, umbral, decisión.
Cierre: el lector tiene una etiqueta de calibración del Laboratorio de Halcón.

## 10.★ «El informe sanitario» · Repaso (5 lecturas)
Lecturas: VPP con prevalencia real; actualización con dos tests; chances con LR; media posterior Beta; positivos esperados frente a reportados. Escena final: Rocío entrega el lector; en su memoria hay un modelo que el Laboratorio «no puede calcular exacto» y aproxima → El Laboratorio (mundo 11).

## Verificación numérica
1000·0,02 = 20; 20·0,9 = 18; 980·0,05 = 49; 18/67 = 0,26866. Prevalencia 20 %: 200·0,9 = 180; 800·0,05 = 40; 180/220 = 0,81818. Segundo test: 18·0,9 = 16,2; 49·0,05 = 2,45; 16,2/18,65 = 324/373 = 0,86863. Chances: 0,02/0,98 = 1/49; LR+ = 18; 18/49 → 18/67; 324/49 → 324/373; LR− = 0,1/0,95 = 2/19; (1/49)(2/19) = 2/931 → 2/933 = 0,00214. Beta(1,1) + 7 de 10 → Beta(8,4), media 8/12 = 0,667, moda 7/10; Beta(2,8) + 7 de 10 → Beta(9,11), media 0,45. Grilla: verosimilitud θ⁷(1−θ)³ normalizada → 0,00002; 0,01998; 0,26017; 0,59239; 0,12743; media 0,6654; {0,5; 0,7} = 0,8526. Factor de Bayes: 0,5⁵ = 0,03125; 0,8⁴·0,2 = 0,08192; 2,62144; 2,62144/3,62144 = 0,72387. P(+) = 67/1000; 3000·0,067 = 201. Umbral 1/(1+4) = 0,2.
