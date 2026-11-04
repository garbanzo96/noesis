# Contrato «libro de texto» para un caso de NÓESIS

Eres parte de un equipo que pule NÓESIS, un juego en español de Chile para aprender matemáticas con
una investigación policial en Valparaíso 2089. Quien juega es una persona adulta que estudia en
serio. Quiere entender de verdad; ninguna frase debe sonar a libro infantil ni a publicidad.

Tu tarea: reescribir SOLO textos de un caso para que su clase funcione como un libro de texto y para
que cada acción del jugador tenga sentido. No cambies lógica, dibujos, números, escenas ni pruebas.

## Qué puedes tocar

Dentro de los pasos (`beats`) de la clase (`kind: 'lesson'`) y de la investigación (`kind: 'demo'`) del
caso, solo estos campos de texto:

- `say`: la explicación del paso.
- `gate`: la instrucción de la acción.
- `after`: campo nuevo, va inmediatamente después de `gate`.

Nada más. No toques `board`, `ask`, `note`, `parts`, `tex`, `intro`, `dur`, ni el código de los
componentes. No crees archivos. No toques otros casos.

## `say` en una clase (`kind: 'lesson'`)

Hay una columna completa a la derecha para leer, a tu ritmo: nada avanza solo. Escribe como un buen
libro: lo que falte aquí, el jugador no lo va a encontrar en otra parte.

- Si el paso presenta un concepto, da la definición completa y precisa, con sus condiciones.
- Explica para qué sirve o qué problema resuelve, y cómo se lee en voz alta la notación nueva.
- Incluye un ejemplo con números cuando ayude, y advierte el error típico cuando exista.
- Entre 3 y 6 frases, sin pasar de 520 caracteres por paso. Si el paso es de transición, 2 frases bastan.
- Separa ideas en dos párrafos con `\n\n` dentro del string cuando el paso sea largo.
- Conserva todo lo verdadero que ya decía. Los términos que se definen van en `**negrita**`.
- Debe calzar con lo que muestra el dibujo y la pizarra (`board`) de ESE paso. Lee el componente
  `Scene` para saber qué se ve en cada `beat`. No nombres algo que no está en pantalla como si estuviera.
- No adelantes en el `say` la respuesta de un `ask` o de un `gate`: la conclusión va en `after`.

## `say` en una investigación (`kind: 'demo'`)

La investigación es parte de la historia: mantén la voz del personaje que guía y conserva los hechos.
Máximo 3 frases. Solo agrega lo que haga falta para que se entienda qué se busca y por qué.

## `gate` y `after`: que la acción enseñe algo

Mover una perilla sin saber para qué no enseña nada. Por eso:

- `gate` dice qué hacer y qué mirar mientras se hace. Debe plantear algo por descubrir, en una o dos
  frases. Ejemplo: «Mueve $p$ y fíjate en qué valor el valor esperado cruza el cero».
- Si cambias `gate`, la instrucción debe seguir siendo exactamente lo que el código exige para
  desbloquear (lee la condición que llama a `unlock()`). Nunca prometas otra acción.
- Todo paso con `gate` debe llevar `after`: una o dos frases que digan qué mostró la acción y por qué
  importa, con los números concretos que el jugador acaba de ver. Aparece cuando la acción se completa.
  Ejemplo: «El valor esperado cruza el cero en $p=1/6$: bajo esa probabilidad, el contrato pierde en
  promedio aunque a veces pague 100».

## Estilo obligatorio

- Español de Chile con tú (no voseo, no «tenéis»). Decimales con coma: en texto `0,5`, en TeX `0{,}5`.
- Prosa simple y exacta. Sin frases cliché ni tono de IA.
- Prohibido: la construcción «no X, sino Y»; rayas largas (—); tríadas de relleno; lemas; cierres
  rimbombantes; «clave», «fundamental», «crucial», «poderoso», «fascinante», «imagina que».
- Prohibido nombrar inferencia activa, energía libre o sus siglas.
- TeX en strings de una comilla lleva barra doble (`\\frac`, `\\in`), igual que el resto del archivo.
  Fórmulas en línea entre `$...$`. Si el texto lleva apóstrofe o comilla, cuida el escape.

## Antes de terminar

1. Corre `npx tsc --noEmit -p tsconfig.json` y `npx vitest run tests/content.test.ts`. Deben pasar.
2. Verifica cada número que escribiste contra el código del caso.
3. No corras git: no tienes permiso de escritura en `.git`. No ejecutes prettier.
4. Termina con una lista de los pasos que cambiaste y cualquier problema del caso que hayas visto
   (por ejemplo, una animación que no muestra lo que el texto dice). No lo arregles: repórtalo.
