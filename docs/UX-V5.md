# UX V5 · diagnóstico y plan

Fecha: 2026-10-12. Base: recorrido con capturas en celular vertical (390×844), celular horizontal (844×390) y PC (1440×860) de portada, prólogo, mapa, tablero, escena, clase, investigación, práctica y recursos.

## Diagnóstico

La causa principal es estructural. El escenario es un lienzo fijo de 1600×900 que se escala entero a la pantalla, y todo texto dentro de él escala con el lienzo: en PC queda entre 10 y 12 px, en celular entre 5 y 7 px. Los paneles laterales (pizarra, cuaderno) tienen ancho fijo de escritorio, así que en celular se comen el escenario o se salen de la pantalla; la consola parte el texto en una palabra por línea.

En PC hay además ruido que compite por la atención: fondo ilustrado detrás de cada gráfico, cuadrícula de puntos, pizarra y cuaderno con todo el historial a igual brillo, consola con atajos de teclado y etiquetas en mayúsculas pequeñas. La fórmula nueva aparece en la pizarra lateral, lejos de donde mira el jugador (el gráfico). Los personajes son siluetas oscuras recortadas por el borde de la pantalla y tapadas por el decorado.

Los elementos interactivos no se anuncian: una perilla arrastrable se ve igual que un punto del gráfico, no muestra hacia dónde se mueve y no hay ninguna demostración de cómo usarla.

## Principios (de referencias revisadas)

- Un foco por paso. Cada paso pide una acción antes de revelar lo siguiente y deja todo lo demás atenuado (Mathigon, Brilliant).
- Controles evidentes y respuesta inmediata: si un objeto se puede arrastrar, se ve agarrable, cambia al pasar el cursor y responde al instante (PhET, Red Blob Games).
- Guía implícita antes que instrucciones largas: limitar qué se puede tocar, mostrar el gesto una vez con una mano fantasma y retirarla cuando el jugador ya lo hizo.
- Lo formal nace junto a lo visual. La fórmula se escribe animada en el escenario, al lado del dibujo que la explica, con los mismos colores; después se guarda en la pizarra, que pasa a ser el registro (vocabulario de animación de Manim: escribir, transformar por partes, indicar, aparecer escalonado).

## Plan

1. Estructura adaptable. PC: escenario grande, pizarra/cuaderno en una columna angosta y discreta. Tablet y celular horizontal: escenario a pantalla casi completa, pizarra en un cajón que se abre con un botón, consola compacta. Celular vertical: menús, mapa, escenas y recursos pensados para vertical; en clase, investigación y práctica se sugiere girar el teléfono y, si no, se apila escenario arriba y consola abajo.
2. Tipografía: tamaño mínimo para todo texto del escenario (13 px en PC, 11 px en celular), escala tipográfica única en la interfaz, nada bajo 12 px salvo etiquetas de ejes.
3. Fórmula en foco: la línea nueva de la pizarra se escribe grande sobre el escenario, término por término; al seguir, vuela a la pizarra. La pizarra muestra la última línea completa y las anteriores compactas.
4. Affordances: perillas con halo, flechas de dirección y cursor de agarre; mano fantasma que demuestra el gesto en cada paso con acción pendiente hasta el primer toque; botón «Seguir» deshabilitado con el motivo visible mientras falte la acción; campos de respuesta con foco automático y botón Confirmar inactivo si están vacíos.
5. Personajes: retratos nuevos con rasgos, ropa y luz coherentes; en escena, enmarcados y completos dentro de la pantalla; en celular, el retrato del que habla va dentro del cuadro de diálogo.
6. Menos ruido: sin decorado detrás de los gráficos de clase y práctica, sin cuadrícula de puntos donde ya hay ejes, atajos de teclado solo en PC.
7. Narrativa: guía de estilo con ejemplos y reescritura de escenas y textos de guía, mundo por mundo.
8. QA completa en los tres tamaños con capturas antes de seguir con el Mundo 7.

## Fuentes

- Mathigon, cursos interactivos de código abierto: https://github.com/mathigon/textbooks
- PhET, estudio de diseño de interfaz: https://phet.colorado.edu/publications/archive/PhET%20Interview%20Paper%20Part%20II.htm
- Red Blob Games, arrastre en diagramas interactivos: https://www.redblobgames.com/making-of/draggable/
- Brilliant, descripción de sus lecciones: https://brilliantorg.notion.site/About-Brilliant-lessons-f90ec481d92c4f0fb28c5f5d346db90d
- manim-web, port de Manim a TypeScript (MIT): https://github.com/maloyan/manim-web
