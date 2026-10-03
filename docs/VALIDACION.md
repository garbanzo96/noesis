# Validación · 3 de octubre de 2026

## Contenido

- 70 misiones, 280 ejercicios, 14 mundos; IDs, campos, referencias e índices de respuestas validados.
- 469 fórmulas explícitas/en línea renderizadas con KaTeX sin errores.
- Auditoría matemática independiente del banco completo; 16 precisiones de supuestos/notación corregidas. Detalle en AUDITORIA_MATEMATICA.md.

## Funcionamiento

Comprobaciones automáticas en un DOM aislado, sin modificar la partida del usuario:

- Misión completa con una pista: 4 aciertos, 3 sin ayuda, dominio acreditado y 85 XP.
- Repetición sin acumulación artificial de XP.
- Recuperación de errores y duplicación del intervalo una sola vez por misión.
- Guardado, importación validada, restauración y defensa ante contenido HTML importado.
- Números, coma decimal, fracciones, exponentes y entradas inválidas.
- Navegación cancelada, enlaces incompletos y nombres de laboratorio inválidos.
- Montaje y objetivos alcanzables de los 20 laboratorios; agente probado con escenario determinista.
- Herramientas WebMCP con lectura, navegación e IDs inválidos sin corrupción de estado.

## Navegador

Vista local comprobada con controles reales: ecuaciones, elección de respuestas, pistas, fracciones, feedback y laboratorio variacional. El objetivo variacional produjo KL=0, F=1.609 y +40 XP. Lectura/navegación WebMCP real verificadas; ID inválido rechazado.

Se revisaron el mapa y las superficies de misión y laboratorio en escritorio y ancho de 390 px. Se corrigió una cascada de estilos que dejaba el panel de misión comprimido en móvil. El diseño soporta texto ampliado, foco visible, navegación por teclado y movimiento reducido.

## Alcance

Las pruebas verifican funcionamiento y aritmética, no resultados educativos longitudinales. El repaso usa un algoritmo explícito sencillo; las preguntas se reutilizan. Los temas avanzados son cápsulas de entrada con referencias, no implementaciones completas de PEB/DCM ni validación biológica del framework.
