# Validación de la base V2 · 3 de octubre de 2026

Entrega de continuidad: esqueleto funcional y contenido inicial para revisión mundo por mundo, según el ajuste de alcance del usuario.

## Comprobaciones

- 161 pruebas automáticas: 27 de progreso/persistencia; 61 de escenas y fórmulas; 36 de variantes; 31 del agente; 6 del cine.
- Variantes: 1500 casos numéricos con ecuaciones revisadas y 300 renderizados KaTeX.
- 636 fórmulas estáticas y 28 dinámicas, sin errores de KaTeX en la auditoría; primas múltiples corregidas.
- 14 objetivos de laboratorio alcanzables mediante valores reales de slider; ninguno se cumple con la configuración inicial.
- Gates y DAG, importación, migración V1, repetición sin acumulación, pistas y evidencias separados.
- Modelo de agente verificado por enumeración independiente de eventos, identidad G=riesgo+ambigüedad=coste preferencial−IG, normalización y Bayes.
- Cine probado con media events: pausa guiada, subtítulos, avance, reducedMotion, StrictMode, errores, seeks, cambio de fuente y descarga al desmontar.
- 15 MP4 decodificados por FFmpeg sin errores, geometría distinta entre etapas, SHA256, posters y tiempos verificables.
- npm audit: cero vulnerabilidades conocidas después de actualizar Vite/Vitest.
- TypeScript estricto y build de producción.

## Revisión de interfaz

Navegador real: mapa, escena Manim, lectura de video, campo Precálculo, recompensas y navegación. Diseño inspeccionado en escritorio de 1440 px y vista estrecha. Los tests de componentes no sustituyen una revisión pedagógica con usuarios.

## Límites y próximo trabajo

Los 14 mundos tienen prototipos funcionales, pero no acabado final. Predicciones registradas, retos de construcción, jefes integradores, feedback por error y recuperación espaciada son trabajo pendiente. Un problema fijo o repetido no demuestra por sí solo dominio duradero. Las opciones reordenadas son reconocimiento del mismo principio; solo las variantes numéricas generan casos nuevos.

La carpeta `src/worlds/` es la fuente editorial. Los agregados `src/content/chapters.json` y `lessons.json` se generan con `npm run content:build`. No editar ambas copias por separado.
