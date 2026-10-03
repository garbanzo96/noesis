# NÓESIS

Juego matemático intensivo para adultos: desde primeros principios hasta las ecuaciones de Active Inference. Basado en las guías de nivelación ENIGMA, los apuntes de Inferencia Estadística Bayesiana y Parr, Pezzulo y Friston (2022).

## Jugar

Abre `dist/index.html` en tu navegador. Todo el contenido, las ecuaciones y los laboratorios están incluidos: no requiere instalación ni conexión. Si tu navegador limita archivos locales, desde esta carpeta ejecuta:

```sh
python3 -m http.server 8876 --bind 127.0.0.1 --directory dist
```

Abre `http://127.0.0.1:8876/`. El origen del navegador determina dónde queda tu progreso. Usa Bitácora → Exportar/Importar para trasladarlo entre la copia local y la versión alojada.

## Qué incluye

- 14 mundos y 70 misiones: precálculo, cálculo diferencial/integral, álgebra lineal, probabilidad, estadística, varias variables, información, dinámica, Bayes, inferencia variacional, modelos generativos, POMDP e inferencia activa.
- 280 desafíos con cálculo y comprensión, feedback razonado, pistas y pruebas de salto.
- 20 laboratorios originales en SVG con objetivos verificables: conjuntos, funciones, sumas, rotación, límites, tangentes, integral, transformaciones lineales, Bayes, Gaussianas, gradiente, entropía/KL, OU, F/ELBO, Markov, políticas, agente con sensor ruidoso, convolución, CLT y MaxEnt.
- Fichas compactas: definición → supuestos → derivación → ejemplo → aplicación.
- Atlas de 30 ecuaciones y distinciones; ruta discreta/continua y bibliografía.
- Progreso local, XP sin acumulación por repetir preguntas, repaso espaciado y respaldos JSON.

## Ruta sugerida

Lenguaje → probabilidad → distribuciones → Bayes → información → álgebra lineal → cápsula de cálculo/gradiente → variacional → modelos generativos. Luego:

- Discreto: POMDP → políticas y G → aprendizaje de A/B → agente.
- Continuo: derivadas → integrales → multivariado → dinámica y precisión → percepción/acción continuas.

Los mundos están abiertos: la recomendación orienta, no bloquea. Las pruebas de salto acreditan con 85% sin pistas; las misiones con 3/4 sin ayuda. El repaso empieza al día siguiente y duplica su intervalo una vez por misión hasta 60 días. Errores y respuestas asistidas se reactivan hoy. Este banco reutiliza preguntas; el indicador de dominio es apoyo al estudio, no una certificación externa.

## Cobertura y límites

La ruta cubre las herramientas centrales de los capítulos 1–10 y apéndices matemáticos del libro. Los temas especializados —coordenadas generalizadas, Fokker–Planck, Fourier, Jeffreys, SBC y PEB/BMR— tienen cápsulas introductorias con supuestos explícitos. No incluye una implementación completa de DCM/PEB, inferencia neural experimental ni el código MATLAB del libro.

F y G mantienen contextos diferentes. Los laboratorios de G declaran preferencias sobre observaciones. El posterior de políticas completo conserva F(π); la demostración simplificada señala cuándo se omite. C son logits en la app; A y B tienen columnas normalizadas. El atlas traduce las convenciones ambiguas de los apuntes sin propagar sus ambigüedades.

## Fuentes y código

`docs/FUENTES.md` registra la investigación y las anclas verificadas. `docs/AUDITORIA_MATEMATICA.md` registra la revisión independiente de 70 misiones/280 preguntas. `docs/VALIDACION.md` registra pruebas de funcionamiento y alcance.

El código de la app está en `dist/`; contenido en `dist/data/`. No hay servidor de aplicación ni API de pago. No se transmite progreso al servidor. La copia publicada tiene acceso privado por defecto.

Las visualizaciones son originales e interactivas; no ejecutan Manim ni copian escenas de 3Blue1Brown. Su geometría sirve como referencia pedagógica. KaTeX se incluye con su licencia MIT en `dist/vendor/KATEX-LICENSE.txt`. El repositorio logica-advance propuesto como referencia no pudo consultarse, y no se reutilizó su código.
