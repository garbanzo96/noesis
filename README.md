# NÓESIS · un videojuego para estudiar matemáticas

**▶ Jugar en el navegador: https://garbanzo96.github.io/noesis/**

Valparaíso, 2089. La Agencia NÓESIS resuelve casos con matemáticas: cada mundo es un área
(precálculo, cálculo diferencial, cálculo integral, álgebra lineal, probabilidad, estadística) y cada caso enseña un tema
desde cero antes de pedir que se use.

Hecho para el grupo de estudio ENIGMA. No requiere instalación ni cuenta; el progreso se guarda en el navegador.

## Cómo se estudia

Cada caso tiene cuatro partes, y se puede entrar a cualquiera desde el mapa:

1. **Historia**: el problema concreto que hay que resolver.
2. **Clase**: NÓESIS desarrolla la idea con ejemplos visuales, animaciones y herramientas interactivas,
   y termina en la fórmula (que también se anima, término por término) escrita en la pizarra.
3. **Investigación**: se aplica lo aprendido a la escena del caso.
4. **Práctica**: tres rondas con valores aleatorios; los errores explican qué falló.

El menú **Recursos** (tecla `R`) reúne definiciones, notación y propiedades de todos los temas,
con enlaces directos a la clase o a la práctica de cada uno. Los mundos se pueden recorrer en cualquier orden.

## Mundos

| Mundo | Área | Lugar | Estado |
| --- | --- | --- | --- |
| 1 | Precálculo (conjuntos, funciones, sumatorias, exponentes y logaritmos…) | El Puerto | jugable, con clases |
| 2 | Cálculo diferencial | La Planta | jugable |
| 3 | Cálculo integral (Riemann, área con signo, TFC, sustitución, partes, impropias) | La Represa | jugable, con clases |
| 4 | Álgebra lineal (vectores, matrices, sistemas, determinante, valores propios) | El Metro | jugable, con clases |
| 5 | Probabilidad | Casino Aurora | jugable |
| 6 | Estadística (descriptiva, normal, muestreo, intervalos, pruebas, regresión) | El Archivo | jugable, con clases |

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
src/content/   un directorio por mundo (w01–w06); cada caso en su archivo, con su clase
tests/         contrato de contenido (cada caso tiene clase, referencias y pasos válidos)
docs/          historia, arquitectura y guía de autoría
legacy-v2/, legacy-v3/   versiones anteriores (solo referencia; no se compilan)
```

Stack: React 19, TypeScript, Vite, KaTeX. Licencias de fuentes y bibliotecas en `public/licenses/`.
