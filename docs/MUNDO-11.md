# Mundo 11 · El Laboratorio · Inferencia variacional · guion

Autor del guion: Claude, 2026-10-13. Implementación: una misión por tarea (Claude o Codex), cada una registrada al pasar la verificación. Estructura como `src/content/w10/` (índice que descubre los casos por archivo; cada caso exporta `level`, `lesson`, `glyphs`, `ref`). World id `'variational'`, carpeta `src/content/w11/`, ids `w11-c1`…`w11-c8`, `w11-final`, module `w11-closed`, acento `#d68cff`, lugar `laboratorio`. Narrativa según `docs/NARRATIVA.md`. Logaritmos en base 2 (bits), como en el Mundo 8. Sin vocabulario de inferencia activa ni de energía libre: la cota se llama ELBO o «cota inferior de la evidencia».

## Historia

El lector de la Clínica (10.★) guarda un modelo del Laboratorio de Halcón, sede Los Placeres, que decide cuándo marcar un positivo. El Laboratorio dice que el modelo exacto es imposible de calcular y que usa una aproximación. La agencia descubre que la aproximación se eligió para que la forma «sana» de los datos desaparezca: con ella, casi todo sale positivo.

Personaje nuevo: `simon`, Simón Valdés, bioestadístico que renunció al Laboratorio en julio (color `#d68cff`). Voz: habla rápido y en imágenes de cocina («la receta», «el horno»), se corrige a sí mismo, teme a Halcón y lo disimula con ironía. Retrato: `jaw: 'narrow'`, pelo `messy` castaño claro, piel clara, barba corta si existe accesorio (si no, sin barba), `outfit: 'hoodie'` gris (`cloth: '#2a2532'`, `cloth2: '#d68cff'`), lentes rectangulares. Lugar `laboratorio`: sala blanca de noche vista desde el pasillo, mesones con matraces, un rack de servidores con luces lila, pizarra con ecuaciones a medio borrar y el logo de Halcón en el vidrio.

Arco: 11.1 por qué el modelo exacto no se puede calcular (la normalización explota); 11.2 Monte Carlo como salida honesta; 11.3 muestras prestadas con pesos; 11.4 la familia q y la distancia KL; 11.5 la cota (ELBO); 11.6 la aproximación por partes que borra la correlación; 11.7 el ajuste por gradiente y su paso; 11.8 la aproximación de una sola joroba que ignora a los sanos. 11.★ Cinco lecturas del modelo; en el servidor también hay registros sintéticos que parecen reales → Mundo 12, La Fábrica.

## Kit (`src/content/w11/kit.tsx`)
- Helpers: `kl2(q, p)` en bits (0·log 0 = 0, infinito si q>0 y p=0), `normalize(ws)`, `fmt`/`tnum` con coma, `frac`.
- `Dist({ values, probs, color, x, y, w, h })`: barras de una distribución discreta con etiquetas.
- `Scatter({ points, inside })`: puntos aleatorios en un cuadrado con el cuarto de círculo.
- `Hill({ g, m, P })`: curva de una función de un parámetro con un punto móvil y su tangente.

## 11.1 «El denominador» · Por qué el posterior exacto cuesta
Clase. 1. Posterior ∝ prior × verosimilitud; para que sume 1 hay que dividir por la suma de todos los valores (la evidencia). Pizarra: `P(\theta\mid D)=\frac{P(D\mid\theta)P(\theta)}{\sum_\theta P(D\mid\theta)P(\theta)}`. 2. Gate: perilla con el número de parámetros d de 1 a 6; una grilla de 10 valores por parámetro tiene 10^d puntos (se dibuja hasta 10³ y luego se muestran solo los números). Desbloquea en d = 6: un millón de cuentas. 3. Ask: «Con 20 parámetros y 10 valores cada uno, ¿cuántas cuentas?» [«10²⁰», «200», «20¹⁰»]. 4. Pizarra: sumar todo deja de ser posible; se aproxima. 5. Pizarra final: dos caminos, muestrear o elegir una q.
Investigación «La receta del lector»: el modelo tiene 24 parámetros; Ask 1 sobre 10²⁴; Ask 2: «¿Qué hace entonces el Laboratorio?» [«Aproxima el posterior», «Calcula todo igual», «Ignora los datos»].
Práctica: (r0) contar puntos de grilla 10^d o k^d; (r1) normalizar una tabla de 3 valores (prior × verosimilitud); (r2) evidencia como suma.

## 11.2 «Tiradas al azar» · Monte Carlo
Clase con el cuarto de círculo en el cuadrado unitario: la fracción de puntos dentro estima π/4 ≈ 0,785. Gate: perilla de n = 10, 100, 1000, 10 000 (puntos fijos con `rng`). Con 79 de 100 dentro, 4·0,79 = 3,16. El error baja como 1/√n: 0,1 con 100, 0,01 con 10 000. Pizarra: `E[f]\approx\frac1n\sum f(x_i)`.
Investigación «El simulador del Laboratorio». Práctica: estimar desde conteos; error 1/√n; cuántas muestras para un error dado.

## 11.3 «Muestras prestadas» · Muestreo por importancia
Clase: se quiere E_p[f] con p = (1/2, 1/3, 1/6) sobre f = (0, 1, 2), pero solo se puede muestrear q uniforme. Pesos w = p/q = (3/2, 1, 1/2). Promedio pesado = (0·1,5 + 1·1 + 2·0,5)/(1,5 + 1 + 0,5) = 2/3 = E_p[f]. Gate: arrastrar cada peso sobre su barra. Pizarra: `E_p[f]\approx\frac{\sum w_i f(x_i)}{\sum w_i},\ w=\frac pq`.
Práctica: pesos y estimaciones con tablas de 3 valores.

## 11.4 «La familia» · Aproximar con q y medir con KL
Clase: el posterior p = (1/4, 1/2, 1/4); una q de la familia «dos valores» q = (1/2, 1/2, 0): KL(q‖p) = 1/2·log₂2 + 1/2·log₂1 = 0,5 bits. Gate: elegir la q de la familia con menor KL. Pizarra: `KL(q\Vert p)=\sum q\log_2\frac qp\ge0`.
Práctica: KL de distribuciones pequeñas en bits.

## 11.5 «La cota» · ELBO
Clase: log₂ p(D) = ELBO(q) + KL(q‖p(·|D)). Con p(D) = 1/4 (log₂ = −2) y KL = 0,5: ELBO = −2,5. Como KL ≥ 0, ELBO ≤ log p(D); subir la cota acerca q al posterior sin calcular la evidencia. Gate: mover q para subir la ELBO hasta la KL mínima. Ask sobre qué pasa con la ELBO cuando KL = 0.
Práctica: completar la identidad con dos de los tres valores.

## 11.6 «Por separado» · Campo medio
Clase: p(x, y) con x e y binarios muy correlacionados: (0,0) y (1,1) con 0,4; (0,1) y (1,0) con 0,1. P(x = y) = 0,8. La mejor aproximación q(x)q(y) con marginales 1/2 da 0,25 en cada celda: P(x = y) = 0,5. KL(q‖p) ≈ 0,32 bits. Pizarra: `q(x,y)=q(x)\,q(y)`. La aproximación por partes borra la relación.
Investigación: el lector usa q por partes para síntomas que van juntos.

## 11.7 «Bajar la cuesta» · Ajuste por gradiente y tamaño de paso
Clase: maximizar g(m) = −(m − 3)² con m_{t+1} = m_t + η g'(m_t) = m_t − 2η(m_t − 3), desde m₀ = 0. η = 0,25: 1,5; 2,25; 2,625. η = 0,5: 3 en un paso. η = 1: 6, 0, 6… oscila. Gate: perilla de η; ver la trayectoria. Pizarra: `m_{t+1}=m_t+\eta\,g'(m_t)`.
Práctica: un paso de gradiente; reconocer oscilación.

## 11.8 «Dos jorobas» · La dirección de la KL
Clase: p = (0,45; 0,1; 0,45) sobre {sano, dudoso, enfermo}; familia de una joroba. q₁ = (0,8; 0,2; 0): KL(q₁‖p) ≈ 0,86 bits. q₂ = (0,1; 0,8; 0,1): ≈ 1,97 bits. KL(q‖p) prefiere quedarse con una joroba e ignorar la otra; KL(p‖q₁) es infinita porque q₁ no da probabilidad a algo que p sí. Gate: elegir la q que minimiza KL(q‖p). Ask: «¿Qué joroba ignora el Laboratorio si su q se queda con “enfermo”?» → la de los sanos.
Cierre: el Laboratorio eligió la joroba «enfermo».

## 11.★ «La receta» · Repaso (5 lecturas)
Lecturas: puntos de grilla; estimación Monte Carlo desde un conteo; promedio con pesos de importancia; ELBO con la identidad; KL de una q de una joroba. Escena final: en el servidor hay carpetas de registros sintéticos «indistinguibles de los reales» → La Fábrica (mundo 12).

## Verificación numérica
11.1: 10⁶; 10²⁰; 10²⁴. 11.2: 4·0,79 = 3,16; 1/√100 = 0,1; 1/√10 000 = 0,01. 11.3: 0·1/2 + 1·1/3 + 2·1/6 = 2/3; (0·1,5 + 1 + 1)/(3) = 2/3. 11.4: 0,5·log₂(0,5/0,25) + 0,5·log₂(0,5/0,5) = 0,5. 11.5: −2 − 0,5 = −2,5. 11.6: 2·0,25·log₂(0,25/0,4) + 2·0,25·log₂(0,25/0,1) = 0,3219. 11.7: η = 0,25 → 1,5; 2,25; 2,625. η = 0,5 → 3. η = 1 → 6, 0, 6. 11.8: KL(q₁‖p) = 0,8·log₂(0,8/0,45) + 0,2·log₂(0,2/0,1) = 0,8641; KL(q₂‖p) = 1,9660; KL((0,5; 0; 0,5)‖p) = 0,1520.
