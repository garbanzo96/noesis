# Contrato de autoría de niveles · NÓESIS v3

Este documento define cómo se construye **un nivel** del juego. El nivel de referencia es
`src/content/w01/levels/L11-logaritmo.tsx`: léelo completo antes de escribir otro. Todo nivel nuevo
debe alcanzar, como mínimo, su calidad.

## 1. Para quién y con qué tono

Investigadores adultos (biología, psicología, neurociencias, informática, filosofía) con tiempo
limitado, que necesitan llegar a leer las ecuaciones de *Active Inference* (Parr, Pezzulo, Friston
2022). No son niños: nada de premios por hacer clic, exclamaciones, emojis ni metáforas infantiles.
Tono: colega competente, seco, preciso. Español neutro. Densidad alta con todos los pasos lógicos.

La narrativa: el jugador restaura a **NOESIS**, un agente de inferencia activa cuyos 14 sectores
cognitivos están fragmentados. NOESIS habla en la consola en primera persona, brevemente.

## 2. Anatomía de un nivel (5–12 minutos)

| Paso | Tipo | Qué debe lograr |
|---|---|---|
| 1 | `brief` | 2–4 líneas de NOESIS: problema concreto que motiva el concepto y para qué sirve en AIF. |
| 2 | `demo` | 6–9 *beats* animados. Objetos antes que símbolos. **≥1 predicción** (`ask`) antes de revelar. **≥1 interacción** (`gate`) cuando sea natural. La fórmula se construye junto a la geometría. |
| 3 | `challenge` | 4–6 rondas **generadas por semilla**, dificultad creciente, manipulación directa (arrastrar, construir, apilar, conectar, ajustar). Nada de opción múltiple como mecánica principal. |
| 4 | `forge` | 2–4 derivaciones con identidades del concepto (si el concepto tiene álgebra). Si no la tiene, un segundo `challenge` distinto. |
| 5 | `codex` | Ficha formal: definición → propiedades → condiciones → errores típicos → dónde aparece en AIF. |

El runner (`src/game/level/LevelRunner.tsx`) ya provee HUD, consola, integridad, pistas, estrellas,
resultados, pausa y transiciones. **El autor solo escribe escenas, mecánicas y contenido.**

Estrellas: ★1 completar · ★2 sin pistas · ★3 ≤ 1 error. Los errores cuestan una celda de integridad
(4 por fase); al agotarse, la fase se reinicia con casos nuevos.

## 3. Archivos y exportaciones

Cada nivel es un archivo `src/content/w01/levels/LNN-slug.tsx` que exporta:

```ts
export const level: LevelSpec;      // sin pos/requires (los fija el índice del sector)
export const codex: CodexEntry[];   // fichas que desbloquea
export const glyphs: Glyph[];       // símbolos que introduce (léxico)
```

Tipos en `src/game/level/types.ts`. IDs estables: nivel `w01-lNN`, ficha `w01-<slug>`,
puzzles de forja `lNN-fK`. Componentes auxiliares reutilizables: `src/content/w01/shared/` con nombre
propio (p. ej. `Machine.tsx`). **No editar** archivos del motor, del juego, del registro ni de otros
niveles; si necesitas un cambio compartido, descríbelo en tu informe final.

## 4. Motor: API disponible

**Escenario** (`engine/Stage.tsx`): coordenadas fijas 1600×900 (16:9), escaladas al contenedor.
- `<Stage ref?>…</Stage>`: SVG + capa HTML. Una escena devuelve exactamente un `Stage`.
- `<Group opacity>`: **usar siempre en lugar de `<g opacity>`** cuando el grupo contiene `Html`
  (si no, las etiquetas no se desvanecen con su grupo).
- `<Html x y size anchor color opacity interactive>`: etiqueta HTML (KaTeX nítido). `size` en
  unidades de escenario (24 ≈ texto normal, 30–36 fórmulas destacadas). `interactive` habilita clics
  (botones `className="stage-btn"`, inputs `className="stage-input"`).
- `plane(xr, yr, box)`: mapa matemático→píxel con `P.x`, `P.y`, `P.pt`, `P.inv`.

**Formas** (`engine/shapes.tsx`): `Axes`, `Curve` (con `progress` = ShowCreation), `Dot`, `Arrow`
(con `progress`, `curve`), `Line`, `NumberLine`, `Chip` (ficha con fórmula), `Brace`, `PlaneClip`.

**Fórmulas** (`engine/Tex.tsx`): `<Tex tex display?>`, `<MorphTex>`, `<Rich text>` (texto con
`$…$` y `**negrita**`). Macros:
- `\g{id}{…}`: etiqueta un símbolo del léxico; al pasar el cursor muestra su ficha. Úsalo en las
  fórmulas de la demo para cada símbolo **nuevo** del nivel. El id debe existir (test lo verifica).
- Colores semánticos: `\Cin{}` cian = entrada/estado oculto; `\Cout{}` ámbar = salida/observación;
  `\Cbel{}` violeta = probabilidad/creencia; `\Clog{}` magenta = escala logarítmica, puntuaciones,
  energías; `\Cok{}` verde; `\Cbad{}` rojo; `\Cop{}` azul = operadores/máquinas; `\Cdim{}`.
- El mismo color = la misma entidad durante todo el nivel y en la geometría (`C.cyan`, etc. de
  `engine/palette.ts`).

**Animación** (`engine/hooks.ts`, `engine/rate.ts`, `engine/anim.ts`):
- En la demo, `beats.at(b)` vale 0 antes del beat `b`, progreso suavizado durante, 1 después.
  La escena es una **función pura** de `at(…)`: `opacity={at(2)}`, `x={lerp(a, b, at(3))}`.
- `useTween(valor, dur)`: anima hacia un objetivo cuando cambia (respuestas reveladas, cursores).
- `useSvgDrag(svgRef, (x, y, fase) => …)`: arrastre en coordenadas de escenario.
- Curvas de tiempo de Manim: `smooth`, `thereAndBack`, `rushInto`, `overshoot`, `lagged(t,i,n)`.
- `lerp`, `clamp`, `fmt` (formato con −), `tfmt` (para TeX), `lerpColor`.
- Semillas: `rng(seed)`, `pick`, `randInt`, `shuffle` en `content/w01/shared/rng.ts`.

## 5. Demostración: patrón

```tsx
function MiDemo({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const reveal = useTween(beat > 3 || (beat === 3 && answer !== null) ? 1 : 0, 1);
  …
  return <Stage>…</Stage>;
}
```

- Beats con `ask`: la escena **no** muestra la respuesta hasta `answer !== null` (y debe seguir
  mostrándola en beats posteriores). Las opciones deben ser errores plausibles reales.
- Beats con `gate`: la escena llama `unlock()` cuando el jugador realiza la acción (arrastrar hasta
  alinear, conectar, etc.). Dar *snap* al valor correcto.
- Una idea por beat. El texto del beat (`say`) explica la operación; `tex` muestra la fórmula
  que corresponde exactamente a lo que se ve.
- Movimiento con propósito (3Blue1Brown): construir, transformar, comparar. Trazos finos y
  luminosos, pocos elementos, nada decorativo que compita con la idea. Duración 1.2–2.5 s por beat.

## 6. Retos: patrón

```tsx
function MiReto({ seed, round, api }: ChallengeProps) {
  const caso = useMemo(() => generar(rng(seed), round), [seed, round]);
  useEffect(() => { api.prompt(texto, tex); api.hints([pista1, pista2]); }, [caso]);
  …
  const fijar = () => correcto ? api.result(true, 'por qué es correcto')
                               : api.result(false, 'qué discrepancia exacta hay');
}
```

- La ronda `round` controla la dificultad (0 = caso canónico; 3+ = combinación/transferencia).
- El feedback de error **nombra la discrepancia** con el caso concreto ("tu cursor marca 9, no 12:
  falta ×4/3"), nunca solo "incorrecto".
- Dos pistas graduadas por ronda: la primera orienta; la segunda casi resuelve.
- El jugador construye o manipula el objeto matemático y luego **fija** su respuesta. Reintentar
  el mismo caso es gratis salvo la celda de integridad.
- Separa la lógica de generación/verificación en funciones puras y pruébalas en `tests/`.

## 7. Forja: patrón

Cada puzzle: `start`, `goal` (sintaxis de `forge/parse.ts`), `rules` (ids disponibles), `par`
(movimientos de la derivación de referencia), `symbols` (tex, `pos: true` para positivos,
`tpl` para indexados), `hints`, `bridge` (una línea hacia AIF). Reglas existentes en
`forge/rules.ts`. Para reglas nuevas: defínelas en el archivo del nivel y llama
`registerRules([...])` a nivel de módulo; deben ser puras, con condiciones explícitas
(`blocked(motivo)` si no se garantizan) y con tests. Incluye al menos una regla distractora
plausible en el *toolbox*. El test `tests/content.test.ts` verifica con un solucionador BFS que cada
puzzle es resoluble dentro de su `par`.

## 8. Ficha de códex y léxico

Ficha: `summary` (una intuición), `blocks` (Definición, Propiedades, Condiciones, …) con `tex`
exacto, `pitfalls` (errores típicos reales), `aif` (ecuaciones del libro o de las guías donde
aparece, sin inventar números de ecuación). Glifo: `tex`, `name`, `read` (cómo se lee en voz
alta), `meaning`, `warn` (colisiones de notación), `aif`.

## 9. Reglas matemáticas obligatorias

- Ningún símbolo sin entidad. Distinguir `:=` (definición), `=` (identidad), `≈`, `≤` (cota), `∝`.
- Dominios, soporte, normalización y condiciones siempre visibles (`ln` exige `x>0`, `∝` respecto de
  qué variable, etc.).
- Índices desde 1 en matemáticas. Vectores en negrita (`\mathbf z`). `\ln` natural. En el libro
  `σ` es **softmax** (no sigmoide ni desviación estándar). `\mathbf 1_A` indicadora (los apuntes la
  escriben `Q(A)`; `q` se reserva para creencias variacionales). `\mathbf A`: filas = observaciones,
  columnas = estados (columnas suman 1).
- No citar números de ecuación del libro salvo que estén en las guías. Ejemplos numéricos
  verificados (calcula y prueba).

## 10. Verificación antes de entregar

1. `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "LNN|shared/Tu"` → sin errores en tus archivos.
2. `npx vitest run` → pasan los tests (incluidos los tuyos y el contrato de contenido).
3. Capturas headless (el servidor de desarrollo ya corre en `http://localhost:8765`):
   `node <qa>/shot.mjs <spec.json>` con `"url": "http://localhost:8765/?step=N#/level/w01-lNN"`
   (ver `<qa>/l11.json`). Revisa con la herramienta Read cada beat, una ronda acertada, una fallida
   y cada puzzle. Sin errores de consola. Usa `storage.json` (texto instantáneo, modo libre).
4. Comprueba legibilidad: nada se solapa, nada se sale del escenario, contraste suficiente.
