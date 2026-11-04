# NÓESIS · un videojuego para estudiar matemáticas

[![Descargar para Windows](https://img.shields.io/badge/Descargar-Windows-28e7fa?style=for-the-badge)](https://github.com/garbanzo96/noesis/releases/latest/download/NOESIS-Windows.exe)
[![Descargar para Mac con Apple Silicon](https://img.shields.io/badge/Descargar-Mac_M1_o_posterior-28e7fa?style=for-the-badge)](https://github.com/garbanzo96/noesis/releases/latest/download/NOESIS-Mac-arm64.dmg)
[![Descargar para Mac con Intel](https://img.shields.io/badge/Descargar-Mac_Intel-28e7fa?style=for-the-badge)](https://github.com/garbanzo96/noesis/releases/latest/download/NOESIS-Mac-x64.dmg)
[![Descargar para Linux](https://img.shields.io/badge/Descargar-Linux-28e7fa?style=for-the-badge)](https://github.com/garbanzo96/noesis/releases/latest/download/NOESIS-Linux.AppImage)

**▶ O juega en el navegador, sin instalar nada: https://garbanzo96.github.io/noesis/**

Valparaíso, 2089. La Agencia NÓESIS resuelve casos con matemáticas: cada mundo es un área
(precálculo, cálculo diferencial, cálculo integral, álgebra lineal, probabilidad, estadística) y cada caso enseña un tema
desde cero antes de pedir que se use.

Hecho para el grupo de estudio ENIGMA. No necesita cuenta: tu progreso queda guardado en tu equipo.

## Instalar

Aprieta el botón de tu sistema y abre el archivo que se descarga. El instalador no pide permisos de
administrador ni datos personales.

Los instaladores todavía no llevan firma de pago, así que el sistema va a mostrar un aviso la primera vez:

- **Windows**: en «Windows protegió tu PC», elige «Más información» y después «Ejecutar de todas formas».
- **Mac**: arrastra NOESIS a Aplicaciones. En macOS 14 o anterior, haz clic derecho sobre la app y elige
  «Abrir». En macOS 15 o posterior, ábrela una vez y después entra a Ajustes del Sistema, Privacidad y
  seguridad, y elige «Abrir igualmente». Si el sistema dice que la app está dañada, ejecuta en Terminal
  `xattr -cr /Applications/NOESIS.app`.
- **Linux**: dale permiso de ejecución al archivo (`chmod +x NOESIS-Linux.AppImage`) y ábrelo.

Para actualizar, descarga la versión nueva e instálala encima: tu progreso se mantiene.

## Sesiones y modos

Al entrar abres una sesión con tu nombre. En un mismo equipo puede haber varias, cada una con su progreso.

- **Aventura**: sigues la historia en orden. Cada caso que cierras abre el siguiente.
- **Completo**: todo abierto desde el inicio, para estudiar o repasar cualquier tema.

El modo se cambia en Ajustes cuando quieras, sin perder lo avanzado. Nada se envía a ningún servidor:
para seguir en otro computador, guarda una copia en Ajustes y cárgala allá con «Cargar una copia».

## Cómo se estudia

Cada caso tiene cuatro partes:

1. **Historia**: el problema concreto que hay que resolver.
2. **Clase**: NÓESIS desarrolla la idea con ejemplos visuales, animaciones y herramientas interactivas,
   y termina en la fórmula (que también se anima, término por término) escrita en la pizarra.
3. **Investigación**: se aplica lo aprendido a la escena del caso.
4. **Práctica**: tres rondas con valores aleatorios; los errores explican qué falló.

En la clase, la fórmula de cada paso se escribe animada bajo el dibujo y después se guarda en la pizarra. Lo que se
puede arrastrar tiene flechas y, la primera vez, una mano que muestra el gesto. Funciona en PC y en celular
(mejor en horizontal para clases y prácticas).

El menú **Recursos** (tecla `R`) reúne definiciones, notación y propiedades de todos los temas,
con enlaces directos a la clase o a la práctica de cada uno.

## Mundos

| Mundo | Área | Lugar | Estado |
| --- | --- | --- | --- |
| 1 | Precálculo (conjuntos, funciones, sumatorias, exponentes y logaritmos…) | El Puerto | jugable, con clases |
| 2 | Cálculo diferencial (límites, derivada, reglas, cadena, exp y log, optimización, aproximación) | La Planta | jugable, con clases |
| 3 | Cálculo integral (Riemann, área con signo, TFC, sustitución, partes, impropias) | La Represa | jugable, con clases |
| 4 | Álgebra lineal (vectores, matrices, sistemas, determinante, valores propios) | El Metro | jugable, con clases |
| 5 | Probabilidad (espacio muestral, frecuencia, reglas, conjunta y marginal, condicional, independencia, árboles, Bayes, esperanza) | Casino Aurora | jugable, con clases |
| 6 | Estadística (descriptiva, normal, muestreo, intervalos, pruebas, regresión) | El Archivo | jugable, con clases |
| 7 | Varias variables (curvas de nivel, parciales, gradiente, plano tangente, extremos, Lagrange, integrales dobles, polares) | Los Cerros | jugable, con clases |
| 8 | Teoría de la información (bits, entropía, Huffman, entropía condicional, información mutua, KL, capacidad de canal, Hamming) | Las Antenas | jugable, con clases |
| 9 | Sistemas dinámicos (campos de direcciones, exponencial, Euler, logística, sistemas lineales, traza y determinante, oscilador amortiguado, caos) | El Observatorio | jugable, con clases |
| 10 | Inferencia bayesiana (Bayes con frecuencias, tasa base, actualización secuencial, chances y razón de verosimilitud, Beta, resumen del posterior, factor de Bayes, predicción y decisión) | La Clínica | jugable, con clases |
| 11 | Inferencia variacional (evidencia, Monte Carlo, muestreo por importancia, KL, ELBO, campo medio, gradiente, dirección de la KL) | El Laboratorio | jugable, con clases |
| 12 | Modelos generativos (muestreo con la acumulada, normal, mezclas, Markov, variables latentes, detector de verosimilitud, Benford, χ²) | La Fábrica | jugable, con clases |
| 13 | Decisión secuencial (valor esperado, árboles de decisión, valor de la información, descuento, Bellman, parada óptima, explorar o explotar, Kelly) | La Bolsa | jugable, con clases |
| 14 | Síntesis final (repaso por pisos: logaritmos, derivada, integral, sistemas, bits, Bayes con chances, decisión, KL) | Torre Halcón | jugable, con clases |

## Ejecutar localmente

```bash
npm ci
npm run dev        # http://127.0.0.1:8765
```

Otros comandos: `npm run check` (tipos + tests), `npm run build` (compila a `dist/`).
`dist/` está versionada: es lo que publica GitHub Pages y lo que abre `INICIAR.command`.

## Estructura

```
src/engine/    escenario 1600×900 (SVG + KaTeX), formas, animaciones, fórmulas animadas
src/game/      estado y guardado, audio, runner de casos (historia, clase, investigación, práctica), pantallas
src/content/   un directorio por mundo (w01–w14); cada caso en su archivo, con su clase
tests/         contrato de contenido (cada caso tiene clase, referencias y pasos válidos)
docs/          historia, arquitectura y guía de autoría
legacy-v2/, legacy-v3/   versiones anteriores (solo referencia; no se compilan)
```

Stack: React 19, TypeScript, Vite, KaTeX. Licencias de fuentes y bibliotecas en `public/licenses/`.

## Arte y mapa

- Retratos del elenco y fondos de lugares: ilustraciones generadas para el juego (fuentes en `art-src/`, fuera de git; versiones optimizadas en `public/art/`). Se regeneran con `python3 art-src/tools/export_art.py`.
- Mapa de la ciudad: costa, calles y vía Limache–Puerto de [OpenStreetMap](https://www.openstreetmap.org/copyright) (© colaboradores de OpenStreetMap, licencia ODbL), procesados con `art-src/tools/valpo_map.py`.
- QA de legibilidad: `npx vite build --mode qa --outDir qa/snap`, luego `node qa/legibility.mjs w1,w2 > qa/out/leg.json` y `python3 qa/legibility.py qa/out/leg.json --sheets`.
