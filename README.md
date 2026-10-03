# NÓESIS · ENIGMA

Videojuego de investigación matemática para llegar desde primeros principios a active inference. Diseñado en español para investigadores de postgrado: exposición comprimida, representaciones visuales, modelos manipulables y problemas de aplicación.

- 14 mundos numerados y acceso por prerrequisitos explícitos.
- 15 animaciones originales, renderizadas con el ManimGL de 3Blue1Brown.
- Cine guiado: subtítulos sincronizados, pausa, velocidad, etapas y fotogramas.
- 14 laboratorios con objetivo verificable y lecturas en tiempo real.
- 70 secuencias de fundamentos, 42 misiones y variantes numéricas.
- Cuaderno con 70 cápsulas: definiciones, identidades, derivación, ejemplo, advertencia, puente y 280 ejercicios.
- XP por resolver, inventario de herramientas y recompensas sin repetición ilimitada.
- Arena de sensor incierto y simulador de agente activo discreto.
- Progreso local con importación, exportación y migración de la versión anterior.

## Ejecutar

Con Node 22+:

```sh
npm ci
npm run dev
```

Abre http://127.0.0.1:8765. Para distribución:

```sh
npm test
npm run build
npm run preview
```

La versión compilada está incluida en `dist/`. También puede servirse con `python3 -m http.server 8080 --directory dist` y abrir http://localhost:8080. No requiere conexión después de tener los archivos: videos, tipografías y fórmulas se sirven localmente. Abrir index.html con doble clic no sustituye el servidor HTTP.

## Recorrido

Campaña → Observar → Manipular → Resolver. Ver contenido no entrega XP. Cada herramienta exige tres problemas resueltos sin ayuda y un objetivo de campo verificado. Puedes saltar la exposición si ya sabes resolver el mundo, o explorar las escenas de mundos futuros antes de acreditar sus prerrequisitos. Las pistas permiten estudiar y los casos nuevos permiten volver a intentarlo con otros valores.

La ruta al agente discreto está indicada en el mapa. La rama continua añade cálculo integral, varias variables y dinámica. El cuaderno conserva extensiones como coordenadas generalizadas, Dirac, convolución, MaxEnt, Jeffreys, SBC y PEB/BMR; su lectura no implica que una escena corta certifique dominio de esos temas.

## Fuentes y alcance

Basado en las guías G00–G13 del grupo ENIGMA, apuntes bayesianos y Parr, Pezzulo y Friston (2022). El contenido es una adaptación didáctica original; no distribuye los PDFs de estudio. `docs/FUENTES.md`, `docs/ARQUITECTURA.md` y `docs/VALIDACION_V2.md` describen procedencia, estructura y comprobaciones.

Motor visual: https://github.com/3b1b/manim, ManimGL 1.7.2, commit `fafa083a4fb274bba9cabde0b6e2f50ba6da0622`, MIT. Escenas Python propias en `animations/`. Se revisaron https://github.com/3b1b/videos y https://github.com/3b1b/3Blue1Brown.com como referencias; no se copió código de escenas bajo CC BY-NC-SA ni código web con derechos reservados. El repositorio de lógica del usuario sirvió de referencia de progresión, no de contenido matemático.

Esta entrega es una campaña completa de sus 14 herramientas y un recurso de estudio extensible. La acreditación registra casos concretos resueltos; no afirma dominio permanente ni sustituye la lectura crítica del libro o validación empírica de modelos.
