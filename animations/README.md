# NÓESIS · películas matemáticas originales

Estas escenas se renderizan con el motor original de Grant Sanderson, `3b1b/manim`, usando su comando `manimgl`. No incorporan escenas, personajes, ilustraciones, videos ni código web de 3Blue1Brown. La geometría, las secuencias y los textos pedagógicos son originales.

## Motor reproducible

- Repositorio: https://github.com/3b1b/manim
- Commit: `fafa083a4fb274bba9cabde0b6e2f50ba6da0622`
- Versión de paquete: `1.7.2`
- Backend de este commit: wgpu / Metal (Apple M3), render sin ventana.
- Python: 3.12.4.
- FFmpeg: 9.0.1, libx264, yuv420p.
- Resolución: 1280×720, 30 fps, sin audio.

El nombre ManimGL se conserva en el paquete y CLI. Este commit upstream ya usa wgpu en su renderer. No se usó Manim Community ni un sustituto JavaScript para los videos.

## Reproducción

```sh
git clone https://github.com/3b1b/manim.git engine
git -C engine checkout fafa083a4fb274bba9cabde0b6e2f50ba6da0622
python3 -m venv .venv
.venv/bin/python -m pip install -e ./engine av
sh render.sh
```

`requirements-lock.txt` registra todas las versiones usadas. `av` se instala explícitamente porque `manimlib.mobject.types.video_mobject` lo importa y el `setup.cfg` de este commit no lo enumera. El render de Text usa Arial y no requiere LaTeX.

`assets/` contiene MP4 H.264 optimizados para navegador y una imagen poster por escena. `manifest.json` contiene dimensiones, duración verificada con ffprobe, hash SHA-256 y etapas temporizadas en español: `at`, `title`, `claim`, `formula`. Las fórmulas del manifiesto usan LaTeX para el navegador; el video usa etiquetas breves con Text. El primer marco útil aparece durante la introducción. Los subtítulos completos se presentan en el reproductor del sitio.

## Referencias consultadas y atribución

Se estudiaron el motor, los ejemplos oficiales y las decisiones pedagógicas de transformaciones, updaters, continuidad de identidad y geometría de límites:

- https://github.com/3b1b/manim
- https://raw.githubusercontent.com/3b1b/manim/master/example_scenes.py
- https://3b1b.github.io/manim/getting_started/example_scenes.html
- https://github.com/3b1b/videos
- https://raw.githubusercontent.com/3b1b/videos/master/_2017/eoc/chapter2.py
- https://raw.githubusercontent.com/3b1b/videos/master/_2016/eola/chapter3.py
- https://github.com/3b1b/3Blue1Brown.com
- https://raw.githubusercontent.com/3b1b/3Blue1Brown.com/main/License.md

El motor está bajo MIT; su aviso completo se conserva en `MANIM-LICENSE.txt`. El repositorio de videos está bajo CC BY-NC-SA 4.0 y el sitio 3Blue1Brown.com reserva derechos: se consultaron como referencia, sin copiar su contenido. No se incluyen PDF privados ni derivados de ellos.

## Alcance matemático

Son ejemplos exactos y acotados. El descenso usa una cuadrática convexa y η=0.18. El atractor es un foco lineal estable. La aproximación variacional usa una posterior gaussiana dentro de la familia elegida. El filtro Markov usa dos estados. La decisión muestra un resultado informativo; el valor epistémico esperado se define en el subtítulo y requiere promediar todos los resultados. Percepción/acción usa una actualización gaussiana y un controlador proporcional, como puente básico y no como prueba completa de inferencia activa.
