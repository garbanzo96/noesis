# NÓESIS v3 · videojuego de matemáticas hacia Active Inference

Juego web (React 19 + TypeScript + Vite) para el grupo ENIGMA. El jugador restaura a NOESIS,
un agente de inferencia activa, reconstruyendo su matemática sector por sector.

## Jugar

- Doble clic en `../INICIAR.command` (sirve `dist/` con Python y abre el navegador).
- O, para desarrollo: `npm ci && npm run dev` → http://127.0.0.1:8765

## Estructura

```
src/engine/   motor gráfico: escenario 1600×900 (SVG + KaTeX), formas, curvas de tiempo de ManimGL
src/forge/    la Forja: expresiones, parser, reglas con condiciones, solucionador BFS
src/game/     estado y guardado, audio sintetizado, runner de niveles, pantallas
src/content/  sectores y registro; w01/levels/*.tsx = un archivo por nivel
tests/        motor de la Forja + contrato de contenido (toda derivación resoluble dentro del par)
docs/AUTORIA-NIVELES.md   cómo escribir un nivel nuevo
legacy-v2/    la interfaz V2 anterior (solo referencia; no se compila)
```

## Comandos

```
npm run dev      # servidor de desarrollo
npm run check    # tipos + tests
npm run build    # compila a dist/
```

Ayudas de autoría: `?step=N` en la URL abre un nivel en la fase N
(p. ej. `http://127.0.0.1:8765/?step=3#/level/w01-l11`). En Ajustes, «modo libre» abre todo.

Nota: `package.json` fija `rollup` 4.63.6 (overrides) porque 4.64.0 se cuelga al empaquetar react-dom.
