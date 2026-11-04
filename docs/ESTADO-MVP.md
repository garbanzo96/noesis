# Estado del MVP

Se actualiza en cada tanda de trabajo. Si se corta el trabajo, este archivo dice dónde retomar.

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

1. Clases como libro de texto en los mundos 4 a 14. Cola lista: `python3 qa/codex_queue.py w10 w11 w12 w13
   w05 w08 w04 w06 w07 w09 w14`. Es reanudable: `work/codex/done.txt` guarda lo hecho.
2. Investigaciones con dos acciones (68 casos). Cola lista: `python3 qa/codex_accion.py w11 w12 w13 w03 w04
   w06 w07 w14 w02 w05`. Solo confirma los casos que `qa/gate_sweep.mjs` puede completar.
3. Instrucciones de acción de los mundos 1 a 3 sin valor regalado: `python3 qa/codex_queue.py w01 w02 w03 --gates`.
4. Fase 2 del plan: que el elemento del dibujo se ilumine junto con la parte de la fórmula.
5. Carga por mundo: exige separar metadatos de escenas en 130 archivos. Hoy pesa 667 KB comprimido.
6. CSS: consolidar las hojas y borrar 61 clases sin uso.
7. Observaciones por caso en `docs/PENDIENTES-CASOS.md`.
8. Prueba con estudiantes.

Codex rinde unos 30 casos por ventana de cuota. `qa/codex_manana.sh` retoma las tres colas a las 07:02.
