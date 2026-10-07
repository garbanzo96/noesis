# MASTER · NÓESIS / ENIGMA

**Documento de continuidad del proyecto. Actualizado: 3 de octubre de 2026.**

Carpeta de trabajo consolidada: `~/Desktop/NOESIS-ENIGMA`.
La aplicación está en `app/`. Este documento está en la raíz y debe leerse antes de continuar.

## 1. Qué queremos construir

Un videojuego de aprendizaje matemático, en español, para investigadores adultos de alto nivel. Su objetivo es llegar desde primeros principios hasta poder leer, entender, calcular y discutir la matemática del libro *Active Inference*, de Parr, Pezzulo y Friston (2022), y manejar los contenidos de los apuntes bayesianos del usuario.

El usuario tiene altas capacidades, aprendizaje sistemático y estudios de postgrado. Quiere mucha información en poco espacio: comprimida, concisa, ordenada y lógicamente completa. El grupo ENIGMA reúne investigadores de biología, psicología, neurociencias, informática y filosofía. Su experiencia científica no implica conocimientos matemáticos previos; casi ninguno domina todas las herramientas necesarias. Hay que empezar por las entidades, operaciones y supuestos, sin adoptar el ritmo, tono o estilo infantil de una clase escolar.

El producto debe ser **un juego que se aprende jugando**. Las animaciones, experimentos manipulables y consecuencias visibles organizan el aprendizaje. Definiciones, afirmaciones, identidades y demostraciones permiten formalizar lo que se acaba de comprender. Las fórmulas no son decoración. La densidad no autoriza omitir el paso lógico que vuelve inteligible una identidad.

Estética: videojuego minimalista, profesional, ligeramente cyberpunk retro digital. Fondo oscuro, geometría vectorial, cian/magenta/violeta/ámbar, tipografía digital, retícula, señales y HUD sobrio. El jugador es un investigador que construye instrumental y un agente; no un niño que colecciona premios por hacer clic.

## 2. Historia y corrección de alcance

La primera entrega fue rechazada porque se parecía a un manual con fichas y preguntas. No tenía suficientes animaciones centrales, gamificación real ni claridad expositiva; su estética era amateur y el mapa no respetaba el orden numérico. El usuario pidió usar realmente los repositorios de 3Blue1Brown, desarrollar intuición, mejorar arquitectura y depurar todos los flujos.

Esta sesión reconstruyó una base V2 funcional y varios prototipos. **El usuario redefinió explícitamente la entrega al final:** guardar todo en el escritorio, crear este documento maestro, pensar bien la gamificación y la arquitectura, dejar el esqueleto y contenido preparado, y continuar después mundo por mundo. No tratar la amplitud del banco inicial como prueba de que el videojuego ambicioso ya está terminado.

La siguiente sesión debe partir de esta base y de las correcciones del usuario. No volver a empezar sin revisar lo que ya existe. No ampliar indiscriminadamente los 14 mundos a la vez: terminar primero una sección representativa, revisarla y extraer el patrón de producción.

## 3. Fuentes y referencias

Fuente principal del usuario: `~/Desktop/enigma/grupo de lectura active inference`.

Material prioritario:

- `03_guias_nivelacion/00_sistema/00_ARQUITECTURA_DEL_PROYECTO.md`: alcance, rutas y estructura del currículo.
- `03_guias_nivelacion/00_sistema/03_REGISTRO_GLOBAL_DE_NOTACION.md`: notación y dimensiones canónicas.
- `03_guias_nivelacion/00_sistema/04_MATRIZ_DE_COBERTURA_DEL_LIBRO.md`: relación entre conceptos y capítulos.
- `03_guias_nivelacion/guias/`: G00–G13 y GX1, con definiciones, fórmulas, ejercicios, soluciones y propuestas de figuras.
- `03_guias_por_capitulo/`: guías de sesiones y de los diez capítulos.
- `04_mapas_y_recursos/`: atlas de ecuaciones, rutas y distinciones.
- `02_herramientas_matematicas/Unknown 2026 - Apuntes de Inferencia Estadistica Bayesiana.pdf`: 78 páginas, referencia de estilo matemático comprimido.
- `01_bibliografia_base/Parr, Pezzulo, Friston (2022) Active Inference.pdf`: 313 páginas.

La sesión investigó 21 PDF y 42 Markdown. Las extracciones, inventario, informes y versiones anteriores están en `archivo-de-sesion/`. Las extracciones PDF sirven para buscar; algunas ecuaciones pierden orden o símbolos y deben verificarse en la guía o PDF original. No asumir que texto extraído equivale a una fórmula auditada visualmente.

Referencias explícitas del usuario:

1. https://github.com/ontoterrorist/logica-advance · referencia de juego de lógica de un amigo.
2. https://github.com/3b1b/manim · motor de animación matemática.
3. https://github.com/3b1b/videos · referencia de escenas y exposición geométrica.
4. https://github.com/3b1b/3Blue1Brown.com · referencia de estructura explicativa.
5. La app anterior para aprender alemán: referencia de compresión, progresión y autonomía, no plantilla visual definitiva.

**Uso real de Manim:** 15 escenas Python originales se renderizaron con el repositorio original `3b1b/manim`, ManimGL 1.7.2, commit `fafa083a4fb274bba9cabde0b6e2f50ba6da0622`, sin modificar el motor. Backend wgpu/Metal en Apple M3. Videos H.264/yuv420p, 1280×720, 30 fps, silenciosos; 12 segundos por clip, salvo derivada de 13. Total 1.37 MB. Manifiesto con SHA256, tiempos y subtítulos. El motor es MIT; las escenas son propias. No se copiaron escenas del repositorio videos bajo CC BY-NC-SA ni código del sitio con derechos reservados.

## 4. Qué funciona ahora y qué no significa

### Implementado en la base V2

- React + TypeScript + Vite; aplicación estática sin backend ni claves API.
- Mapa de 14 mundos, **siempre 01–14**; acceso por un DAG distinto del orden editorial.
- Navegación Campaña, Arena, Cuaderno, Herramientas y Ajustes.
- Tres modos por mundo: Observar, Manipular y Resolver.
- 15 clips Manim reales, dos en Precálculo; subtítulos temporizados, etapas, pausa, repetición, velocidad, recorrido y fotogramas.
- Reproducción guiada que pausa entre pasos; control del ritmo y movimiento reducido.
- 14 laboratorios SVG con parámetros, ecuación, lecturas numéricas y objetivo verificable.
- 70 etapas introductorias: cinco conceptos por mundo. No son 70 videos distintos.
- 42 misiones iniciales: tres por mundo, con problemas, pistas, soluciones y transferencia.
- Variantes específicas de las 30 misiones numéricas. Las 12 de alternativas reordenan opciones y conservan el mismo principio; no fingir que son casos nuevos.
- Cuaderno con 70 cápsulas y 280 ejercicios de referencia; intuición, núcleo, derivación, ejemplo, distinción, puente y fuentes.
- Recompensas por evidencias, inventario, progreso exportable/importable y migración V1.
- Arena de cinco rondas: encontrar una señal con un sensor de fiabilidad 0.8, coste de observar, elección humana y error Brier.
- Agente activo discreto en el mundo 14: tres políticas, B/A declaradas, cálculo de G, ejecución, dato y posterior auditables.
- Arquitectura separada en contenido, dominio matemático, progreso, escenas y UI.
- Pruebas automáticas de cálculo, casos, dependencias, persistencia, cine y agente.

### Estado real del producto

La campaña completa puede recorrerse y tiene contenido inicial en todos sus sectores. **Cada mundo sigue siendo un prototipo funcional por revisar.** Quedan pendientes escenas específicas para muchos subtemas, mejores predicciones antes de manipular, jefes de integración, feedback detallado por error, evaluación espaciada, relaciones conceptuales y acabado de cada secuencia. No afirmar cobertura ejecutable completa de todas las extensiones del libro a partir de una cápsula.

Las 42 misiones verifican resultados concretos. XP y herramientas no certifican dominio permanente, retención o transferencia amplia. La próxima evaluación debe recoger resultados de casos nuevos y recuperación tras un intervalo. El progreso es local y editable: sirve para estudio, no como certificación oficial.

## 5. Propuesta estratégica de juego

### Fantasía y objetivo compartido

**Construir un agente capaz de percibir, aprender y actuar en un entorno incierto.** Cada mundo entrega un instrumento que amplía lo que el jugador puede hacer. El final no debe ser una pantalla de felicitación: debe ser un agente visible cuyas decisiones, creencias, errores y aprendizaje puedan inspeccionarse.

Un mismo universo de investigación conecta los mundos: localizar una señal, calibrar sensores, inferir causas, diseñar un modelo, controlar un sistema y comprobar sus predicciones. Variar ejemplos científicos sin cambiar arbitrariamente el lenguaje o la notación.

### Bucle básico que debe pulirse

1. **Situación:** una pregunta concreta, entidades visibles y objetivo breve.
2. **Predicción:** anticipar qué cambia antes de mover o calcular. Registrar la propuesta, sin castigo por equivocarse.
3. **Animación:** mostrar la operación paso a paso, con colores estables, flechas y números legibles; pausa manual.
4. **Manipulación:** ajustar, arrastrar, combinar o construir. La acción debe afectar al sistema matemático.
5. **Formalización:** definición → identidad/afirmación → condiciones → derivación breve → caso resuelto.
6. **Reto:** conseguir un objetivo o reparar un modelo. Feedback explica la discrepancia exacta.
7. **Transferencia:** usar la misma operación en otro caso o en una situación que combine herramientas.
8. **Recompensa y conexión:** activar el instrumento, ver qué abre y cómo entra en una ecuación real de active inference.

Ahora existen Observar/Manipular/Resolver y objetivos de campo. La predicción registrada y el jefe de transferencia aún deben completarse como mecánicas, no solo como instrucciones en el texto.

### Ritmo y curva de aprendizaje

- La exposición de un concepto debe caber en una unidad breve y completa; no fijar una duración artificial igual para todos los temas.
- Permitir **ruta exprés**: demostrar lo conocido y saltar la exposición, conservando las pruebas de integración.
- Permitir **ruta guiada**: objetos antes que símbolos, ejemplos concretos, pistas graduadas y derivación opcional.
- La dificultad crece por composición y autonomía: observar una operación → predecir → configurar → resolver → construir → criticar un modelo.
- Mantener un reto ligeramente por encima de lo que el participante acaba de dominar. Los avances científicos relevantes producen interés; una larga cola de cálculos repetidos no.
- Dar libertad de exploración y mostrar prerrequisitos con razones. Evitar que el orden numérico imponga dependencias matemáticas falsas.

### Recompensas con significado

Reglas actuales, implementadas y probadas:

| Evidencia | XP | Condición |
|---|---:|---|
| Primera misión resuelta sin ayuda | 40 | Respuesta correcta a un caso válido |
| Primer objetivo de campo verificado | 80 | Modelo cumple el predicado visible |
| Mundo completado | 140 | Tres misiones + campo + prerrequisitos |
| Mirar una escena, leer o avanzar | 0 | No es evidencia de resolución |
| Repetir un crédito ya obtenido | 0 | Evita acumulación ilimitada |

Máximo de campaña: 4760 XP. Rangos cada 400 XP. Herramientas: circuito de cálculo, actualizador local, acumulador de masa, operador de estados, tabla conjunta, banco de validación, mapa de sensibilidades, medidor de información, simulador temporal, actualizador de creencias, aproximador posterior, grafo del modelo, comparador de políticas y agente mínimo.

La recompensa principal debe ser **una nueva capacidad jugable**. En la base actual los instrumentos son inventario y gates; hay que convertirlos gradualmente en acciones que alteren la arena/agente. Añadir celebraciones cortas, cambios visibles del mapa y señales de logro ligadas al resultado. Evitar interrumpir una demostración con efectos.

Una pista identifica práctica asistida. Después puede resolverse otro caso numérico sin ayuda. Las alternativas reordenadas permiten reevaluar reconocimiento del mismo principio; no llamarlas transferencia. Los errores no restan XP; la arena tiene costes de acción explícitos dentro del experimento, separados del progreso curricular.

### Qué hará que apetezca volver

- Un problema que despierta curiosidad y produce un cambio visible.
- Desafíos cortos con cierre claro y una siguiente herramienta alcanzable.
- Control del ritmo y opción de explorar estrategias alternativas.
- Casos nuevos, semillas reproducibles y comparación de soluciones.
- Mejorar un agente persistente, no solo rellenar barras.
- Revisión de errores propios y reaparición de un concepto en un contexto nuevo.
- Jefes de mundo que integran habilidades y pueden resolverse de más de una manera.

Estos últimos puntos son dirección de diseño, no funciones ya implementadas en su totalidad. Priorizar uno o dos sobre añadir decoraciones o monedas.

### Jefes propuestos

Precálculo: construir un circuito de calibración, invertirlo y normalizar causas. Probabilidad: recuperar una tabla conjunta incompleta. Bayes: distinguir señal rara de falsos positivos. Lineal: diseñar A/B que respeten ejes y normalización. Información: elegir un sensor que informa frente a uno solo ruidoso. Variacional: ajustar q y explicar el gap. Modelos: reconstruir un grafo y resolver un collider. Decisión: comparar políticas con el mismo criterio. Activa: cerrar un experimento de percepción, aprendizaje Dirichlet y acción, registrando qué hipótesis podría contrastarse con datos.

## 6. Arquitectura y lugar de cada archivo

```
NOESIS-ENIGMA/
  MASTER.md                     continuidad, intención y criterios
  INICIAR.command               abrir la versión compilada local
  app/                          proyecto ejecutable y editable
    src/app/                    composición de pantallas
    src/components/game/        campaña, arena, agente, ajustes
    src/components/scene/       cine, geometría y laboratorios
    src/components/learning/    conceptos, problemas, cuaderno
    src/components/ui/          fórmula y primitivas comunes
    src/worlds/<id>/            chapter.json, lessons.json, README
    src/content/                catálogo global y datos compilados
    src/domain/                 matemáticas puras y tipos
    src/engine/                 evidencias, XP, gates y persistencia
    src/hooks/                  rutas y reloj
    src/styles/                 sistema visual
    public/media/               videos y posters
    animations/                 scripts Manim y pipeline
    tests/                      comprobaciones independientes
    scripts/                    compilación de contenido y assets
    docs/                       arquitectura, fuentes y validación
    dist/                       aplicación compilada para servir
  fuentes-originales/           material local de lectura, uso privado
  archivo-de-sesion/            informes, extracciones y trabajo original
  entregas/                     copias de entregables anteriores
```

**Fuente de autoría por mundo:** editar `app/src/worlds/<id>/chapter.json` y `lessons.json`; ejecutar `npm run content:build`. Los JSON agregados en `src/content/` son salida de esa compilación. Mantener IDs estables al mejorar escenas o preguntas.

El modelo del laboratorio está separado de la representación: `models.ts` declara parámetros, ecuaciones, lecturas y predicado; `Geometry.tsx` representa esos datos. `useTimeline` ilustra evolución y no concede XP. `Cinema` usa las marcas del manifiesto. `progress.ts` decide créditos con evidencias; `persistence.ts` valida e importa, reconstruyendo valores derivados.

**Refactor de siguiente etapa:** separar los renderizadores actuales del switch Geometry en módulos por mundo a medida que se produzca cada uno. No reescribir los 14 de golpe. Un módulo debe declarar objetos, parámetros, escena, metas, feedback, supuestos y ejercicios. Añadir primitivas compartidas de ejes, curvas, distribuciones, flechas y campos sin meter la lógica pedagógica en CSS.

El banco de misiones debe tener un contrato verificable para la variante, su respuesta y sus condiciones. El estado de pista pertenece al caso concreto. El motor futuro de evaluación debe almacenar ID de caso/semilla, respuesta, asistencia, tipo de error, latencia opcional y revisión pendiente. Las vistas solo solicitan acciones; no inventan recompensas.

## 7. Mundos y plan de producción

Todos tienen banco inicial, cine/laboratorio y tres misiones. Su estado editorial es **pendiente de revisión dedicada**.

| N.º | ID | Mundo | Guías | Próximo foco |
|---:|---|---|---|---|
| 01 | foundations | Precálculo | G00 | Entidades, notación y composición; cerrar el patrón de juego |
| 02 | differential | Cálculo diferencial | G01 | Cambio local, límite, cadena, Taylor y descenso |
| 03 | integral | Cálculo integral | G02 | Área, densidad, CDF, expectativas y cambio de unidades |
| 04 | linear | Álgebra lineal | G03 | Bases, matrices estocásticas, productos y precisión |
| 05 | probability | Probabilidad | G04/G05 | Universo, conjunta, marginal, condicional e independencia |
| 06 | statistics | Estadística | G05/G06/G12 | Familias, verosimilitud, estimación y validación |
| 07 | multivariate | Varias variables | G01/G08 | Gradiente, Jacobiano, Hessiano y restricciones |
| 08 | information | Información | G07 | Sorpresa, entropía, KL, IG y MaxEnt |
| 09 | dynamics | Sistemas dinámicos | G11 | Estabilidad, ruido, Euler, OU y generalizadas |
| 10 | bayesian | Inferencia bayesiana | G06 | Tasa base, conjugación, predictiva y evidencia |
| 11 | variational | Inferencia variacional | G08 | F/ELBO, gap, mean-field y Laplace |
| 12 | generative | Modelos generativos | G09 | Grafos, placas, independencia y mensajes |
| 13 | decision | Decisión/POMDP | G10 | Políticas, preferencias, riesgo, ambigüedad y epistemia |
| 14 | active | Active inference | G12/G13 | Percepción, aprendizaje, acción y contraste científico |

Ruta discreta actual: **01 → 05 → 10 → 08 → 04 → 02 → 11 → 12 → 13 → 14**. Integral, multivariate y dynamics amplían la rama continua. Estadística puede recorrerse tras probabilidad. La guía fuente divide también G05 aleatorias de G04 probabilidades; su colocación en la app debe conservar los prerrequisitos aunque la interfaz use categorías disciplinares.

La revisión por mundo debe cerrar: contenido mínimo, símbolos, escenas, reto generado, solución, feedback, puente al libro, pruebas y estética. Anotar qué se modifica, por qué y qué falta; no declarar un mundo terminado solo porque renderiza.

## 8. Criterios pedagógicos y matemáticos obligatorios

- No introducir un símbolo sin entidad o significado. Diferenciar igualdad, definición, aproximación y proporcionalidad.
- Comprimir con condiciones: dominios, soporte, independencia, dimensiones, normalización y unidades permanecen visibles.
- El color identifica la misma entidad durante toda la secuencia. No cambiar su función a mitad de una demostración.
- Usar texto que explica una operación, no narraciones largas que compiten con la animación.
- Distinguir un ejemplo numérico, una identidad general y una afirmación con supuestos.
- La demostración conecta cada paso con una razón. Poner el caso concreto junto a la definición, no ocultarlo en un manual separado.
- Alinear cine y laboratorio cuando representen el mismo caso. Actualmente algunos usan números diferentes; están rotulados como un nuevo caso. Conviene unificarlos al producir cada mundo.
- Los gráficos no cambian unidades o escalas silenciosamente; recortes y límites de visualización se declaran.
- Formular objetivos verificables: calcular, construir, configurar, distinguir, predecir o explicar; no solo «conocer».

Precauciones de contenido ya auditadas:

1. `F[q]=E_q[ln q−ln p(o,s)]=KL(q||p(s|o))−ln p(o)`; ELBO=−F. F no es energía metabólica ni debe afirmarse F≥0 en general con densidades continuas.
2. `G=KL(q(o|π)||P_C(o))+E_q H[p(o|s)] = −IG−E_q ln P_C(o)` bajo la convención de preferencias sobre observaciones y conjunta predictiva declaradas. No generalizar sin condiciones a todas las definiciones de G de la literatura.
3. Posterior completo de políticas: `softmax(ln E−F(π)−G(π))`. Si se usa `softmax(−γG)`, declarar E y F iguales u omitidas bajo una simplificación.
4. A: filas de observaciones, columnas de estados. B: filas de siguiente estado, columnas de actual; columnas normalizadas. Conteos A con `outer(o,s)`, B con `outer(s_next,s_current)` en esta orientación.
5. C puede ser logits que pasan por softmax; el libro a veces llama C a la distribución de preferencias. Traducir explícitamente.
6. D inicial discreta y 𝒟 derivada temporal son objetos diferentes.
7. Densidad puntual no es probabilidad de un punto. Cambiar unidades conserva masa mediante Jacobiano.
8. Precisión = inversa de varianza/covarianza, no veracidad. Covarianza diagonal permite reciprocidad componente a componente; una matriz general requiere inversión matricial.
9. Beta/Dirichlet exactas con conteos categóricos y estados conocidos. Recuentos fraccionales con estado incierto requieren declarar la aproximación variacional cuando corresponda.
10. Euler depende del paso; ruido Browniano escala con √Δt. No derivar ruido blanco ideal como si fuera una trayectoria suave en coordenadas generalizadas.
11. Indicadores de los apuntes Q(A) se traducen como 1_A; q se reserva para creencias variacionales. Distinguir BF pareado del cociente likelihood/evidencia de una actualización.
12. CLT, LLN, SBC y otras extensiones conservan sus hipótesis. Un ajuste empírico no demuestra una implementación neural ni un principio ontológico.

## 9. Cobertura del libro y extensiones

Cap.1: bucle y niveles de explicación. Cap.2: Bayes/KL/F/G. Cap.3: blanket, dinámica estocástica y estados estacionarios. Cap.4: modelos discretos/continuos. Cap.5: mensajes y precisión. Cap.6: diseño de modelos. Cap.7: HMM/POMDP, G y Dirichlet. Cap.8: atractores, sincronización y modelos continuos/híbridos. Cap.9: likelihood conductual, inversión, identificación, evidencia y PEB. Cap.10: integración y límites. Apéndices A/B/C: herramientas, ecuaciones y algoritmo.

Anclas verificadas: Bayes ec.2.1 p.17; KL ecs.2.3–2.4 p.20; F ec.2.5 p.28; G ec.2.6 pp.33–36; A–D/políticas ecs.4.5–4.10 pp.71–74; posterior B.9 p.247; G computable B.28–30 p.252; Dirichlet ecs.7.9–10 pp.142–143; análisis conductual ecs.9.1–5 pp.174–179. La paginación PDF suele añadir 11 páginas a la impresa.

Extensiones como Fourier/convolución, Dirac, Euler–Lagrange general, Itô/Stratonovich, Fokker–Planck/NESS completo, geometría informacional y PEB/BMR/DCM necesitan escenas y misiones adicionales. No deben bloquear innecesariamente el agente discreto mínimo, ni omitirse del plan si el objetivo final sigue siendo comprender todo el libro y los apuntes.

## 10. Cómo revisar y ejecutar

Abrir `INICIAR.command` en la carpeta del escritorio. Sirve `app/dist/` por HTTP y abre el navegador. La app compilada usa archivos locales; Python y un navegador son suficientes. No depende de Manim o GPU para aprender.

Desarrollo en `app/` con Node 22+:

```sh
npm ci
npm run dev
npm run content:build
npm test
npm run check:assets
npm run build
```

Dev: http://127.0.0.1:8765. Preview compilada: `npm run preview`, puerto 8876. Evitar varias compilaciones simultáneas. Los clips se reconstruyen siguiendo `app/animations/README.md`.

Sitio existente: https://noesis-matematica-enigma.garbanzo.chatgpt.site
Proyecto Sites: `appgprj_6ac088e4e6d08191a27ef42f5148756a`. **Conservar esta identidad; no crear un sitio nuevo.** Acceso actual privado, no se ha ampliado al grupo. Para compartir con el grupo hace falta decidir audiencia o distribuir una copia local. No subir fuentes originales ni PDFs a la salida web.

El progreso local de cada navegador es independiente. Exportar en Ajustes para trasladarlo. La copia de código no exporta automáticamente el localStorage de la persona.

## 11. Próxima sesión: instrucciones concretas

1. Leer MASTER y las correcciones que el usuario haga sobre la base funcional.
2. Abrir `app/`, ejecutar pruebas y revisar `src/worlds/foundations/README.md`.
3. Trabajar **solo el mundo 01** hasta lograr una sección representativa profesional.
4. Definir sus objetos, secuencia, predicciones, operaciones y jefe. Revisar G00 y las primeras cápsulas de los apuntes.
5. Producción visual: escena por concepto necesario, controles claros, sincronía entre geometría y afirmación, casos coherentes.
6. Integrar una herramienta realmente usable fuera del mundo; probar el ciclo completo con ayudas y caso nuevo.
7. Verificar matemáticas y UX; demostrar la versión funcional al usuario.
8. Registrar ajustes y estado en MASTER; repetir el patrón aprobado en el mundo siguiente.

No hacer una nueva página de tarjetas de teoría como sustituto del juego. No afirmar perfección, profesionalidad completa o cobertura total a partir de tests técnicos. La medida central es si la experiencia hace comprensible y operable la idea matemática para el público descrito.

## 12. Continuidad y registro de decisiones

Decisiones tomadas: conservar mapa por disciplinas pero ruta por dependencias; usar Manim real para cine y SVG para manipulación; generar casos numéricos auditables; separar asistencia de evidencias; guardar fuentes privadas fuera de public; mantener sitio existente y audiencia; construir por mundos después de estabilizar el esqueleto.

Pendientes prioritarios: revisión del usuario; acabar un mundo de referencia; predicción registrada; objetivos construidos en vez de simples sliders cuando aporte aprendizaje; feedback específico; jefes; revisión espaciada; agent/inventario persistente con nuevas capacidades; navegación precisa desde una cápsula a la escena correspondiente; ampliación de figuras en móvil; mejoras de legibilidad y sincronía; recuperación de parámetros/validación científica en niveles finales.

Actualizaciones futuras deben añadir al final: fecha, mundo trabajado, decisiones, criterios probados, comentarios del usuario y siguiente tarea. Mantener una sola dirección pedagógica y una lista explícita de qué está implementado.
