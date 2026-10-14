# Mundo 14 · Torre Halcón · Síntesis final · guion

Autor del guion: Claude, 2026-10-13. Implementación por misión (Claude o Codex), registrada al pasar la verificación. Estructura como `src/content/w13/` (índice que descubre los casos por archivo; cada caso exporta `level`, `lesson`, `glyphs`, `ref`). World id `'active'` (solo el identificador interno; en el texto el mundo se llama «Síntesis final»), carpeta `src/content/w14/`, ids `w14-c1`…`w14-c8`, `w14-final`, module `w14-closed`, acento `#e8364f`, lugar `torre`, guía `iris`. Narrativa según `docs/NARRATIVA.md`. Sin vocabulario de inferencia activa ni energía libre.

Cada caso es un piso de la torre y repasa herramientas de mundos anteriores: la clase es un repaso breve (4–5 beats) que recuerda la idea con un dibujo nuevo y la aplica; la investigación usa datos del edificio; la práctica mezcla rondas de esa herramienta.

## Historia

La cuenta que apostaba un paso antes (13.★) está registrada en el piso 40 de la Torre Halcón. Desde ahí, el Contador —el mismo que escapó del muelle en el caso 1.★— coordinó todo: vacunas desviadas, energía, agua, registros fabricados y apuestas. La agencia sube la torre de noche, piso por piso; cada piso tiene un sistema que hay que leer con las matemáticas aprendidas.

Lugar nuevo `torre`: piso alto de vidrio de noche, la bahía iluminada abajo, ascensor de vidrio, sala de servidores roja al fondo, escritorio vacío con una ficha del Casino Aurora encima.

## 14.1 «El vestíbulo» · Exponenciales y logaritmos (Mundo 1)
La credencial robada del Contador se descarga a la mitad cada 8 horas. Carga 100 %: en 24 h queda 12,5 %; para saber cuándo cae a 12,5 %: t = 8·log₂(100/12,5) = 24 h. Gate: perilla de horas con la curva 100·(1/2)^(t/8). Pizarra: `C(t)=C_0\,2^{-t/8}`, `t=8\log_2\frac{C_0}{C}`.

## 14.2 «El ascensor» · Derivada y optimización (Mundo 2)
El ascensor de vidrio sube h(t) = 120t² − 40t³ metros en t ∈ [0, 2] minutos. Velocidad h′(t) = 240t − 120t², máxima en t = 1 (h″ = 0): 120 m/min. Altura final h(2) = 160 m. Gate: perilla de t con la tangente. Pizarra: `h'(t)=240t-120t^2`, `h''(t)=0\Rightarrow t=1`.

## 14.3 «La sala caliente» · Integral (Mundo 3)
La potencia de los servidores del piso 40 sube antes de cada anuncio: P(t) = 2 + t kW durante 4 horas. Energía = ∫₀⁴ (2 + t) dt = 8 + 8 = 16 kWh. Gate: barrer el área bajo P. Pizarra: `E=\int_0^4(2+t)\,dt=16`.

## 14.4 «Las rondas» · Sistemas lineales (Mundo 4)
Dos guardias hacen rondas: 2x + y = 10 y x − y = 2 (x, y en minutos por tramo). Solución x = 4, y = 2: el hueco entre rondas dura 2 minutos. Gate: mover las dos rectas hasta que se crucen. Pizarra: `\begin{cases}2x+y=10\\x-y=2\end{cases}`.

## 14.5 «La clave» · Información (Mundo 8)
La clave del servidor tiene 40 bits: 2⁴⁰ ≈ 1,1·10¹² combinaciones; a 10⁹ intentos por segundo, ≈ 1100 s ≈ 18 min en el peor caso. Teo prueba solo las claves que siguen el patrón que el Contador usa (fechas): 16 bits efectivos, 65 536 claves. Pizarra: `H=\log_2 N`, `N=2^{40}`.

## 14.6 «La firma» · Bayes con chances (Mundo 10)
¿Es el Contador el dueño de la cuenta? Prior 1 : 9 (diez sospechosos). Tres pruebas independientes con razones de verosimilitud 18 (horario), 4 (firma) y 5 (ficha del casino): chances 1/9·18·4·5 = 40 : 1 → P = 40/41 ≈ 0,976. Gate: aplicar cada prueba sobre la barra de chances. Pizarra: `\text{chances}=\tfrac19\cdot18\cdot4\cdot5=40`.

## 14.7 «Subir o esperar» · Decisión (Mundo 13)
Subir ahora: éxito 0,7 (vale 50), fracaso 0,3 (−30): E = 26. Esperar la siguiente ronda descuenta γ = 0,9: 0,9·26 = 23,4. Se sube ahora. Gate: perilla de γ; esperar solo convendría si la probabilidad mejora. Pizarra: `E[\text{ahora}]=26>\gamma\,E=23{,}4`.

## 14.8 «El modelo de la ciudad» · KL y χ² (Mundos 11 y 12)
El modelo de Halcón dice que la ciudad se reparte en cuatro sectores con q = (0,4; 0,1; 0,1; 0,4); los registros reales son parejos, p = (0,25; 0,25; 0,25; 0,25). KL(p‖q) ≈ 0,32 bits: el modelo concentra recursos donde Halcón tiene contratos. Pizarra: `KL(p\Vert q)=\sum p\log_2\frac pq`.

## 14.★ «El último piso» · Repaso (5 lecturas)
Lecturas: horas de carga (logaritmo); velocidad máxima del ascensor; energía integrada; probabilidad posterior de la firma; KL del modelo. Escenas: el Contador espera junto a la ventana; Iris le muestra las cifras; Teo copia los servidores; NÓESIS cierra: cada pieza fue una matemática que el jugador aprendió desde cero. Epílogo breve en el Puerto: las vacunas vuelven a la Clínica.

## Verificación numérica
14.1: 100·2^(−3) = 12,5; 8·log₂8 = 24. 14.2: h′(1) = 120; h(2) = 480 − 320 = 160. 14.3: 2·4 + 16/2 = 16. 14.4: 3x = 12 → x = 4, y = 2. 14.5: 2⁴⁰ = 1 099 511 627 776; /10⁹ ≈ 1099,5 s; 2¹⁶ = 65 536. 14.6: 18·4·5/9 = 40; 40/41 = 0,9756. 14.7: 35 − 9 = 26; 0,9·26 = 23,4. 14.8: 0,5·log₂(0,625) + 0,5·log₂(2,5) = 0,3219.
