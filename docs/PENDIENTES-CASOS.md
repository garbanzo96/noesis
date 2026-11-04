# Observaciones de la pasada de texto

Lo que Codex vio en cada caso mientras reescribía sus textos y no le tocaba arreglar. Se revisa caso a caso; las barras TeX que menciona a veces son falsas alarmas (`\n` de párrafo o atributos JSX).

## w01-c1-cadena

Problema observado: en el paso de ALT-12, el texto anuncia una lectura de 8,1 °C, pero la animación muestra inicialmente 8 °C y llega a 8,1 °C después de responder. No modifiqué la animación.

## w01-c2-marea

Problema observado: en el primer paso de la clase, las fichas de entrada 3 y salida 9 desaparecen cuando termina la animación. La máquina queda visible, pero el ejemplo ya no se ve completo.

## w01-c3-camion

Problema observado: en el paso de C, el camión permanece dibujado en el km 150 mientras se ajusta la recta; su posición no cambia con el control. No modifiqué la animación.

Las verificaciones quedaron pendientes: `npx tsc --noEmit -p tsconfig.json` no entregó resultado y `npx vitest run tests/content.test.ts` inició, pero tampoco terminó. Interrumpí ambos procesos, por lo que no puedo afirmar que pasen.

## w01-c5-cuentas

Encontré un posible problema en la escena de la suma de Gauss: la fórmula del dibujo usa `\tfrac` en un string de JavaScript, donde `\t` se interpreta como tabulación. No la modifiqué.

Las verificaciones quedaron pendientes: ejecuté TypeScript y la prueba de contenido, pero ninguna terminó tras la espera; las interrumpí. Por lo tanto, no puedo afirmar que pasen.

## w01-c6-reparto

Problema observado: en el último paso de la investigación, la escena muestra la fórmula y el precio medio aproximado antes de que el jugador mueva el apoyo. No modifiqué la escena.

## w01-c8-cuenta

Detecté que la etiqueta del punto reflejado en la gráfica usa comas tanto para los decimales como para separar las coordenadas, lo que puede dificultar su lectura. No modifiqué la escena.

Las verificaciones **no quedaron completadas**: ejecuté `npx tsc --noEmit -p tsconfig.json` y `npx vitest run tests/content.test.ts`, pero ambos quedaron sin terminar y los interrumpí. No puedo afirmar que hayan pasado.

## w02-c3-grafica

Problema observado: en el paso de tangente horizontal, la pizarra muestra $x=-1$ y $x=1$ antes de que se responda la pregunta. No la modifiqué.

## w02-c4-reglas

Problema observado: en el cuarto paso de la clase, la pizarra muestra que la derivada en `x=1` vale 10 antes de responder la pregunta. No la modifiqué.

Las verificaciones quedaron pendientes: ejecuté `npx tsc --noEmit -p tsconfig.json` y `npx vitest run tests/content.test.ts`, pero ninguna terminó tras más de un minuto; las interrumpí. No puedo afirmar que pasen.

## w02-c6-cadena

Problema observado: en el segundo paso de la investigación, la escena rotula el cociente de cambios finitos como $dy/dx$. Ese cociente se aproxima a la derivada cuando el cambio de $x$ tiende a cero, pero no es exactamente la derivada para los valores mostrados. No modifiqué la escena.

## w02-c8-optimo

Problema observado: la pizarra de la pregunta sobre el área máxima muestra $A(10)=100$ antes de responder. La dejé sin cambios, según el alcance pedido.

## w02-c9-aprox

Problemas existentes que observé y dejé intactos:

- Algunas expresiones TeX de las escenas tienen barras simples en strings, lo que puede alterar su representación.
- La nota de Newton muestra como tercer valor `22,43…`; el tercer paso calculado es aproximadamente `22,4265`, que redondea a `22,43`.

## w03-c1-caudal

Detecté un problema visual en el último paso de la clase: se dibujan cuadrados según la altura de la curva en el centro de cada columna, por lo que algunos cuadrados marcados pueden quedar parcialmente sobre la curva. El texto indica contar cuadrados completos bajo ella. No modifiqué la visualización.

## w03-c2-riemann

Problema observado: la última escena de la investigación dibuja 60 franjas de seis minutos calculadas desde una función; no muestra lecturas minuto a minuto. La suma visible es 25,58, mientras la nota muestra la integral aproximada de 25,7.

## w03-c5-primitivas

Problemas observados, sin modificar:

- Varias fórmulas en `Scene` usan barras simples en atributos JSX. Secuencias como `\frac`, `\text` y `\tfrac` pueden interpretarse como escapes y mostrarse mal.
- Los ocho escalones del gráfico representan aproximaciones locales; sus tramos verticales no suman exactamente el cambio total mostrado.

## w03-c6-sustitucion

Problema observado: la franja en el eje $u$ muestra el cambio finito de $x^2$, pero la cifra de $du$ usa la aproximación diferencial $2x\,dx$. En $x=1{,}5$, el ancho dibujado es $0{,}4725$ y la cifra mostrada es $0{,}45$. No modifiqué la escena.

## w03-c8-impropias

Detecté que varias fórmulas de `Scene` tienen barras sin escapar, por lo que pueden mostrarse incorrectamente. También la gráfica de altura infinita recorta el área cerca de cero mientras el valor calculado sigue avanzando. No modifiqué esos problemas.

Las verificaciones **no quedaron confirmadas**: `tsc` y Vitest seguían ejecutándose sin terminar después de más de un minuto y las interrumpí. Vitest alcanzó a iniciar, pero no entregó resultados.
