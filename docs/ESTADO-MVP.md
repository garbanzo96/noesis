# Estado del MVP

Se actualiza en cada tanda de trabajo. Lo más reciente va primero en «Avance».

## Pendiente de hoy (noche del 2026-11-04)

Encargo de Gabriel: corregir errores de lectura y de visualización en todo el juego, que nada avance
solo, clases como libro de texto, ejercicios que enseñen algo, decisión secuencial hasta POMDP y cerrar
el plan de mejora.

## Avance

- Nada avanza solo: acciones de clase e investigación, rondas de práctica y aviso de credibilidad
  esperan a que el jugador apriete «Seguir».
- Cada acción puede decir qué mostró (`after`): reemplaza la instrucción cuando la acción se completa.
- Rótulos dentro de círculos dibujados en el SVG: ya no aparece un rectángulo encima.
- Llaves de las fórmulas: medidas con el ancho real del texto y con filas reservadas, sin chocar con
  la explicación.
- Guía del prólogo: describe la pantalla real (explicación a la derecha, pizarra en pestaña).
- Caso 1.2: prueba de la recta vertical a mano, marea con lectura de hora y altura bajo el cursor,
  media hora de cruce admite ambas respuestas, dos bajamares aceptadas.
- Herramientas: `qa/sweep.mjs` barre 128 casos en 11 minutos, `qa/beat.mjs` captura un paso,
  `qa/check_text_only.py` y `qa/codex_queue.py` para la pasada de texto.
