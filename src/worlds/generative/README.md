# 12 · Modelos generativos

Estado: **esqueleto funcional para revisión**, aún no un mundo con acabado final.

## Contrato

- Objetivo: Factorizar un modelo pequeño, orientar A y B, separar D/C/E y reconocer cómo condicionar cambia una dependencia.
- Guías principales: G09.
- Video principal: `markovMessages`. Manifiesto en `../../content/media.json`.
- Requisitos de acreditación: probability, linear, bayesian.
- Contenido editable: `chapter.json` y `lessons.json`.
- Modelo interactivo actual: `../../components/scene/models.ts` y `Geometry.tsx`.
- Retos nuevos: plantillas `generative-mission-*` en `../../content/variants.ts`.

## Trabajo de la sesión dedicada a este mundo

1. Revisar cada prerrequisito y cada símbolo contra G09.
2. Elegir una sola situación de investigación que organice el mundo.
3. Transformar cada concepto en una escena animada, predicción y acción con consecuencias.
4. Alinear los parámetros del cine, laboratorio, ejemplo y reto cuando usen el mismo caso; rotular explícitamente cuando cambien.
5. Añadir desafío de integración que combine habilidades y cambie visiblemente el sistema.
6. Diseñar feedback por el error concreto; pistas graduadas y reevaluación con caso nuevo.
7. Verificar casos, unidades, límites y condiciones; probar móvil, teclado y movimiento reducido.
8. Pedir revisión del usuario sobre el mundo funcional; registrar correcciones en MASTER.

No acreditar por páginas vistas ni por reproducir videos. Mantener los IDs al mejorar contenido para conservar progreso. Ejecutar `npm run content:build` tras editar datos por mundo.
