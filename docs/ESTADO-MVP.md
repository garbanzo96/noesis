# Estado del MVP

Se actualiza en cada tanda de trabajo. Si se corta el trabajo, este archivo dice dónde retomar.

## Hecho (mañana del 2026-11-04)

Lectura en pantalla, medido con `qa/sweep.mjs` en los 132 casos:

| Tamaño | Choques reales antes | Ahora | Fuera del escenario |
|---|---|---|---|
| 1280×720 | 81 | 3 | 0 |
| 1024×768 | 648 | 33 | 0 |

- Causa principal: la franja de fórmulas no tenía tope de alto y apilaba las líneas; con dos o más
  fórmulas dejaba el dibujo diminuto. Ahora van en dos columnas en apaisado.
- Los rótulos cerca del borde se envolvían de más: `left: 86 %` limita el ancho aunque el rótulo esté
  centrado. `.stage-html` usa `width: max-content`, y `--room` manda de verdad.
- Las etiquetas de llaves despejan los límites de las sumatorias y no pasan del borde derecho; las
  fórmulas de la franja se encogen para caber (`useFitTex`).
- La columna derecha empieza en 960 px, el mínimo de la ventana de la app, y el rótulo mínimo baja a
  12 px bajo 1100 px.
- El barrido marca más de lo real: el detector cuenta `encima` en la tabla de cifrado de 1.4 (cajas que
  se rozan), el rótulo opaco de una perilla sobre el número del eje, y `circulo` en el anillo de guía de
  una ficha. Lo que queda sobre 40 % es `(1, 0)` sobre una marca del eje en 1.8, sin choque visible.

Contenido:

- Clases como libro de texto en los mundos 10, 11, 12 y 13, salvo 13.9 (Codex). Revisión automática de
  todas las cifras nuevas contra el código, repitiendo las muestras con semilla: todas correctas.
- Codex había quitado preguntas de predicción. Se repusieron 12 en pasos con acción (mundos 1 a 3, 10, 11
  y 13), los contratos ahora exigen conservarlas y `check_text_only` anota en `work/codex/review.txt`
  cuando una reescritura tiene menos preguntas.

## Hecho (noche del 2026-11-04)

Motor y lectura:

- Nada avanza solo. Acciones de clase e investigación, rondas de práctica y aviso de credibilidad esperan
  a que el jugador apriete «Seguir» (`qa/manual_advance.mjs` lo prueba en tiempo real).
- Las 246 acciones del juego plantean algo por resolver y, al completarse, dicen qué mostraron (`after`).
  Una prueba exige que ninguna quede sin conclusión.
- Rótulos de círculos dibujados en el SVG: sin rectángulo encima, siempre dentro del círculo.
- Llaves de las fórmulas con ancho medido y filas reservadas: no chocan entre sí ni con la explicación.
- La guía del prólogo describe la pantalla real.
- Explicaciones largas caben en la columna derecha.
- TeX mal escapado corregido en W10 y W11, con prueba.

Contenido:

- Mundos 1, 2 y 3: clases reescritas como libro de texto (Codex, revisadas por muestra).
- Casos 1.1 y 1.2: errores reportados corregidos, incluida la marea con dos bajamares y la recta vertical.
- Mundo 13 extendido hasta POMDP: 13.9 MDP, 13.10 estado oculto y filtro, 13.11 política sobre creencias,
  13.12 valor de la información, y un control de creencia e informe en 13.★. Números fijados por
  `tests/pomdp.test.ts`, guion en `docs/MUNDO-13-POMDP.md`.

Plan de mejora:

- Fase 1: cerrada, con el cambio de diseño a columna derecha en lugar de banda inferior.
- Fase 4: solución resuelta tras el segundo error, primera pista gratis, repaso sugerido en el mapa,
  ESLint con reglas de hooks y `npm run qa`.

## Pendiente, en orden

Colas reanudables; `work/codex/done.txt` guarda lo hecho. `qa/codex_manana.sh [HHMM]` corre las tres en
este orden y solo anota «publicado» si el push funcionó, con reintentos durante dos horas.

1. Investigaciones con dos acciones: 66 casos. `python3 qa/codex_accion.py w11 w12 w13 w03 w04 w06 w07
   w14 w02 w05`. Solo confirma los que `qa/gate_sweep.mjs` puede completar; ese barrido marca ATASCADO
   acciones válidas de varios pasos, así que revisar `work/codex/accion-review.txt`.
2. Clases como libro de texto en los mundos 4 a 9 y 14, más 13.9: 60 casos.
   `python3 qa/codex_queue.py w13 w05 w08 w04 w06 w07 w09 w14`.
3. Instrucciones de acción de los mundos 1 a 3 sin valor regalado: 23 casos.
   `python3 qa/codex_queue.py w01 w02 w03 --gates`.
4. Fase 2 del plan: que el elemento del dibujo se ilumine junto con la parte de la fórmula.
5. Carga por mundo: exige separar metadatos de escenas en 130 archivos. Hoy pesa unos 800 KB comprimido.
6. CSS: consolidar las hojas.
7. Observaciones por caso en `docs/PENDIENTES-CASOS.md`.
8. Prueba con estudiantes.

Codex rindió 35 casos en la ventana de la mañana. Quedan unos 150, es decir cuatro o cinco ventanas.

Decisiones de Gabriel: notarización de Apple (99 USD al año) o mandar a usuarios de Mac a la web; sacar un
tag nuevo, porque los instaladores siguen en v0.9.0 sin ninguno de estos arreglos; borrar `v0.9.0-rc.1`.
