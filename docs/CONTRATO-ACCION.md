# Contrato «investigación con acción» para un caso de NÓESIS

Eres parte de un equipo que pule NÓESIS, un juego en español de Chile para aprender matemáticas con una
investigación policial. Quien juega es una persona adulta que estudia en serio.

Tu tarea: dejar la investigación (`kind: 'demo'`) de UN caso con al menos 2 acciones que hagan pensar.
Hoy varios de sus pasos solo se leen o se responden con alternativas. Cada acción convierte un paso en
algo que el jugador hace con el objeto del caso, y su resultado es la pieza de evidencia del paso.

## Qué es una buena acción

- Plantea un problema por resolver: encontrar, separar, ordenar, marcar, medir, comparar, descartar.
- Para lograrla hay que usar la idea del caso. Una perilla que se mueve hasta que algo se ponga verde,
  sin pensar, no sirve. Ejemplos de lo que sí sirve: ubicar el punto donde dos valores se igualan;
  marcar cuáles datos cumplen una condición; ordenar de menor a mayor antes de ver los valores; elegir
  en el dibujo el candidato que calza y descartar los otros; predecir con un marcador y luego comparar.
- La condición que llama a `unlock()` debe poder cumplirse con tolerancia razonable: al menos 2 % del
  rango de una perilla o 20 unidades de escenario. Para arrastrar a una zona, zona de 45 unidades o más.
- Si hay una lectura numérica en vivo, debe ayudar a razonar y no regalar la respuesta.
- Un intento fallido no castiga: el dibujo responde y se puede corregir.

## Qué puedes tocar

Solo el archivo del caso que se te indica y, dentro de él, la escena (`Scene`) de la investigación y sus
`beats`. Cambia pasos pasivos o preguntas prescindibles por acciones; conserva `note`, los hechos de la
historia y los números. Cada `gate` lleva `after`: una o dos frases que digan qué mostró la acción, con los
números concretos. Sigue las reglas de estilo de abajo. No toques la clase, la práctica ni las escenas de
diálogo. La investigación queda con 3 a 5 pasos. Nada avanza solo: el jugador aprieta Seguir.

## Forma del código

- `gate` en el `beat` y `unlock()` en la escena, una vez, cuando se cumple la condición en el paso correcto.
  Comprueba `beat` antes de llamar a `unlock`, para no desbloquear otro paso.
- Perillas con `Knob` y `useSvgDrag`; botones con `Choices` o `Html` con `interactive`; arrastre de fichas con
  un `g` con `cursor: grab`. Mira `src/content/w09/c3-paso.tsx` o `src/content/w10/c5-lote.tsx` como ejemplo.
- Atributos JSX `tex="..."` llevan una barra (`\frac`); strings JS llevan dos (`\\frac`).
- Lo que se lea dentro de un círculo debe caber en él. Texto de escenario con tamaño 24 o más.
- Sin dependencias nuevas. Sin archivos nuevos.

## Estilo

Español de Chile con tú. Decimales con coma: en texto `0,5`, en TeX `0{,}5`. Prosa simple y exacta. Prohibido:
«no X, sino Y»; rayas largas (—); lemas; «clave», «fundamental», «crucial», «poderoso», «fascinante»,
«imagina que». Prohibido nombrar inferencia activa, energía libre o sus siglas.

## Antes de terminar

Corre `npx tsc --noEmit -p tsconfig.json` y `npx vitest run tests/content.test.ts`. No corras git ni prettier.
Termina con la lista de acciones agregadas y su condición de desbloqueo.
