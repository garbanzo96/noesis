# NÓESIS 2 · Arquitectura

Aplicación estática React + TypeScript. El navegador ejecuta todos los modelos; no hay backend, clave de API, analítica ni servicios necesarios para aprender. Los videos se sirven como archivos H.264. La vista previa requiere HTTP por los módulos y rutas de assets.

```
src/
  app/App.tsx                 composición de pantallas y navegación
  components/
    game/                    campaña, inventario, arena, agente, ajustes
    scene/                   cine Manim y laboratorios SVG
    learning/                conceptos, problemas y cuaderno
    ui/Math.tsx              KaTeX con MathML accesible
  content/
    worlds.json              orden numérico y metadata de mundos
    chapters.json            70 etapas y 42 misiones
    lessons.json             70 cápsulas y 280 ejercicios de referencia
    media.json               tiempos, hashes y procedencia de 15 clips
    variants.ts              generación determinista de nuevos casos
  domain/                    tipos y modelos matemáticos puros
  engine/                    recompensas, gates, migración y persistencia
  hooks/                     rutas y reloj de animación
  styles/                    sistema visual y adaptación móvil
public/
  media/                     15 MP4 y sus posters
  licenses/                  avisos del motor, tipografía y KaTeX
animations/                  escenas Python y pipeline reproducible
scripts/                     comprobación de contenido y assets
 tests/                      matemáticas, progreso y controles
```

## Contratos

El contenido declara entidades, supuestos, fórmula, ejemplo y transferencia. `models.ts` define parámetros legales, lectura del estado y predicado de objetivo. `Geometry.tsx` representa esos mismos parámetros; un reloj solo anima la trayectoria, no inventa datos ni créditos. El cine usa etapas temporizadas del manifiesto, con reproducción guiada que pausa entre pasos.

`progress.ts` es puro respecto al estado recibido y crea copias al mutar. Una misión entrega 40 XP una vez, el campo 80 y el mundo completo 140. Un gate requiere las tres misiones sin ayuda, el campo y sus prerrequisitos. Máximo 4760 XP. No se recompensa el tiempo, visitar una pantalla ni repetir una respuesta acreditada. El DAG de acceso no es el orden editorial de los 14 sectores; el mapa siempre se presenta 01–14.

`persistence.ts` valida la estructura y reconstruye XP y gates desde evidencias reconocidas; no confía en flags o cantidades importadas. La clave principal es `noesis:progress:v2`; la migración reconoce `noesis-progress-v1` y mantiene XP histórico separado. La exportación es un JSON local. No existe sincronización entre personas ni una certificación server-side: los registros son instrumentos personales de estudio.

## Modelos finales

La arena de localización es un experimento bayesiano con coste de lectura, decisión humana y evaluación Brier. El agente del mundo 14 usa tres políticas con B y A declaradas, preferencias sobre observaciones (0.8,0.2), horizonte de un paso y G=risk+ambiguity. Recomienda el mínimo G, permite intervención y guarda predicción, dato y posterior. El estado real solo produce datos simulados y puede revelarse para auditar; no alimenta el posterior.

## Desarrollo

Node 22+, npm. `npm ci`, `npm run dev`; `npm test`; `npm run build`; `npm run preview`. La salida desplegable es `dist/`. `.openai/hosting.json` conserva la identidad del sitio existente. El motor de render Manim no hace falta para ejecutar la app; solo para reconstruir sus videos, siguiendo `animations/README.md`.

Separar decisiones en módulos permite ampliar bancos de casos, cambiar un render o añadir un mundo sin mezclar cálculo, recompensa y UI. No hay dependencia runtime de Python ni de GPU. Las condiciones matemáticas forman parte de los casos, no de comentarios ocultos.
