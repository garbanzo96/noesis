# 10 · Inferencia bayesiana

Estado: **esqueleto funcional para revisión**, aún no un mundo con acabado final.

## Contrato

- Objetivo: Actualizar causas mediante evidencia, conservar el papel del prior y fusionar información según precisión bajo modelos explícitos.
- Guías principales: G06.
- Video principal: `bayesianMassNormalization`. Manifiesto en `../../content/media.json`.
- Requisitos de acreditación: probability, foundations.
- Contenido editable: `chapter.json` y `lessons.json`.
- Modelo interactivo actual: `../../components/scene/models.ts` y `Geometry.tsx`.
- Retos nuevos: plantillas `bayesian-mission-*` en `../../content/variants.ts`.

## Trabajo de la sesión dedicada a este mundo

1. Revisar cada prerrequisito y cada símbolo contra G06.
2. Elegir una sola situación de investigación que organice el mundo.
3. Transformar cada concepto en una escena animada, predicción y acción con consecuencias.
4. Alinear los parámetros del cine, laboratorio, ejemplo y reto cuando usen el mismo caso; rotular explícitamente cuando cambien.
5. Añadir desafío de integración que combine habilidades y cambie visiblemente el sistema.
6. Diseñar feedback por el error concreto; pistas graduadas y reevaluación con caso nuevo.
7. Verificar casos, unidades, límites y condiciones; probar móvil, teclado y movimiento reducido.
8. Pedir revisión del usuario sobre el mundo funcional; registrar correcciones en MASTER.

No acreditar por páginas vistas ni por reproducir videos. Mantener los IDs al mejorar contenido para conservar progreso. Ejecutar `npm run content:build` tras editar datos por mundo.
