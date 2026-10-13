import type { TopicRef } from '../../game/level/types';

export const REF_W07: Record<string, TopicRef> = {
  'w7-c1': {
    defs: [
      {
        label: 'Función de dos variables',
        tex: 'f:D\\subseteq\\mathbb R^2\\longrightarrow\\mathbb R',
        body: 'Asigna un número a cada par $(x,y)$ de su dominio.',
      },
      {
        label: 'Superficie',
        tex: 'z=f(x,y)',
        body: 'Gráfica de la función en el espacio: cada punto del plano lleva su altura.',
      },
      {
        label: 'Curva de nivel',
        tex: 'N_c=\\{(x,y)\\in D:f(x,y)=c\\}',
        body: 'Reúne todos los puntos con un mismo valor c.',
      },
    ],
    props: [
      {
        label: 'Evaluar',
        tex: 'f(a,b)=f(x,y)\\big|_{x=a,\\,y=b}',
        body: 'Reemplaza x por la primera coordenada e y por la segunda.',
      },
      {
        label: 'Niveles de un cerro redondo',
        tex: 'a-x^2-y^2=c\\iff x^2+y^2=a-c',
        body: 'Para $c<a$, el radio es $\\sqrt{a-c}$. Con $c=a$ queda el origen; con $c>a$ el nivel está vacío.',
      },
      {
        label: 'Separación entre curvas',
        body: 'Al comparar intervalos iguales de altura, curvas cercanas indican mayor pendiente y curvas separadas, menor pendiente.',
      },
    ],
  },
  'w7-c2': {
    defs: [
      {
        label: 'Parcial respecto de x',
        tex: 'f_x(a,b)=\\lim_{h\\to0}\\frac{f(a+h,b)-f(a,b)}{h}',
        body: 'Tasa de cambio en x dejando y fija, cuando existe el límite.',
      },
      {
        label: 'Parcial respecto de y',
        tex: 'f_y(a,b)=\\lim_{h\\to0}\\frac{f(a,b+h)-f(a,b)}{h}',
        body: 'Tasa de cambio en y dejando x fija, cuando existe el límite.',
      },
    ],
    props: [
      {
        label: 'La otra variable es constante',
        tex: '\\begin{aligned}\\partial_x(xy)&=y,&\\partial_x(y^2)&=0\\\\\\partial_y(xy)&=x,&\\partial_y(x^2)&=0\\end{aligned}',
      },
      {
        label: 'Pendientes de los cortes',
        tex: "g(x)=f(x,b)\\Rightarrow g'(a)=f_x(a,b)",
        body: "De igual modo, para $k(y)=f(a,y)$, $k'(b)=f_y(a,b)$. Son pendientes de curvas en planos de corte.",
      },
      {
        label: 'Signo y módulo',
        body: 'En el sentido positivo del eje, una parcial positiva indica subida y una negativa, bajada. Para comparar cuán empinados son los ejes, compara $|f_x|$ y $|f_y|$.',
      },
    ],
  },
  'w7-c3': {
    defs: [
      {
        label: 'Gradiente',
        tex: '\\nabla f=(f_x,f_y)',
        body: 'Vector formado por las derivadas parciales.',
      },
      {
        label: 'Dirección unitaria',
        tex: '\\vec u=\\frac{\\vec v}{\\|\\vec v\\|},\\quad\\vec v\\ne\\vec0',
        body: 'Conserva el sentido del vector y tiene norma 1.',
      },
      {
        label: 'Derivada direccional',
        tex: 'D_{\\vec u}f(a,b)=\\lim_{h\\to0}\\frac{f((a,b)+h\\vec u)-f(a,b)}{h}',
        body: 'Tasa de cambio por unidad de distancia en una dirección con $\\|\\vec u\\|=1$.',
      },
    ],
    props: [
      {
        label: 'Producto punto',
        tex: 'D_{\\vec u}f=\\nabla f\\cdot\\vec u=f_xu_1+f_yu_2',
        body: 'Válido para una función diferenciable en el punto.',
      },
      {
        label: 'Máximo ascenso y descenso',
        tex: '\\begin{aligned}\\max_{\\|\\vec u\\|=1}D_{\\vec u}f&=\\|\\nabla f\\|\\\\\\min_{\\|\\vec u\\|=1}D_{\\vec u}f&=-\\|\\nabla f\\|\\end{aligned}',
        body: 'Si el gradiente es distinto de cero, las direcciones son $\\nabla f/\\|\\nabla f\\|$ y $-\\nabla f/\\|\\nabla f\\|$, respectivamente.',
      },
      {
        label: 'Perpendicularidad',
        tex: '\\nabla f\\perp\\vec t,\\quad\\nabla f\\cdot\\vec t=0',
        body: 'En un punto regular de una curva de nivel, t es su vector tangente.',
      },
      { label: 'Norma del gradiente', tex: '\\|\\nabla f\\|=\\sqrt{f_x^2+f_y^2}' },
    ],
  },
  'w7-c4': {
    defs: [
      {
        label: 'Plano tangente',
        tex: 'z=L(x,y)',
        body: 'Para una superficie diferenciable z = f(x,y), plano que comparte el valor y las dos pendientes de f en (a,b).',
      },
      {
        label: 'Aproximación lineal',
        tex: '\\begin{aligned}L(x,y)&=f(a,b)\\\\&\\quad+f_x(a,b)(x-a)\\\\&\\quad+f_y(a,b)(y-b)\\end{aligned}',
        body: 'Usa los desplazamientos desde el punto de contacto para estimar valores cercanos.',
      },
      { label: 'Incrementos', tex: '\\Delta x=x-a,\\quad\\Delta y=y-b' },
    ],
    props: [
      {
        label: 'Contacto y pendientes',
        tex: '\\begin{aligned}L(a,b)&=f(a,b)\\\\L_x&=f_x(a,b),\\quad L_y=f_y(a,b)\\end{aligned}',
      },
      {
        label: 'Cambio estimado',
        tex: '\\Delta f\\approx f_x(a,b)\\Delta x+f_y(a,b)\\Delta y',
        body: 'Para estimar el nuevo valor de f, suma también el valor inicial f(a,b).',
      },
      {
        label: 'Error de una función diferenciable',
        tex: '\\lim_{(x,y)\\to(a,b)}\\frac{f(x,y)-L(x,y)}{\\sqrt{(x-a)^2+(y-b)^2}}=0',
        body: 'El error es pequeño respecto de la distancia al contacto cuando te acercas. Lejos del contacto puede crecer.',
      },
    ],
  },
  'w7-c5': {
    defs: [
      {
        label: 'Punto crítico regular',
        tex: '\\nabla f(a,b)=(0,0)',
        body: 'En una función diferenciable, punto donde fₓ y fᵧ se anulan.',
      },
      {
        label: 'Matriz hessiana',
        tex: '\\operatorname{Hess}f=\\begin{pmatrix}f_{xx}&f_{xy}\\\\f_{yx}&f_{yy}\\end{pmatrix}',
        body: 'Matriz de segundas parciales. Si son continuas, fₓᵧ = fᵧₓ.',
      },
      {
        label: 'Determinante del hessiano',
        tex: 'D=f_{xx}f_{yy}-f_{xy}^2',
        body: 'Se evalúa en el punto crítico para aplicar el criterio de la segunda derivada.',
      },
    ],
    props: [
      {
        label: 'Mínimo y máximo locales',
        tex: '\\begin{aligned}D>0,\\ f_{xx}>0&\\Rightarrow\\text{mínimo local}\\\\D>0,\\ f_{xx}<0&\\Rightarrow\\text{máximo local}\\end{aligned}',
        body: 'Requiere un punto crítico y segundas parciales continuas en un entorno.',
      },
      {
        label: 'Silla',
        tex: 'D<0\\Rightarrow\\text{punto silla}',
        body: 'Hay valores mayores y menores que f(a,b) arbitrariamente cerca: unas direcciones suben y otras bajan.',
      },
      {
        label: 'Criterio inconcluso',
        tex: 'D=0\\Rightarrow\\text{sin conclusión}',
        body: 'Hay que estudiar la función con otra herramienta; gradiente cero por sí solo tampoco clasifica el punto.',
      },
    ],
  },
  'w7-c6': {
    defs: [
      {
        label: 'Objetivo y restricción',
        tex: '\\text{optimizar }f(x,y)\\quad\\text{con }g(x,y)=c',
        body: 'El objetivo es el valor que buscas maximizar o minimizar; la restricción limita los puntos disponibles.',
      },
      {
        label: 'Multiplicador de Lagrange',
        tex: '\\nabla f=\\lambda\\nabla g',
        body: 'Número λ que relaciona los gradientes paralelos en un extremo regular con restricción.',
      },
    ],
    props: [
      {
        label: 'Sistema de candidatos',
        tex: '\\begin{cases}f_x=\\lambda g_x\\\\f_y=\\lambda g_y\\\\g(x,y)=c\\end{cases}',
        body: 'Condición necesaria en un extremo regular de funciones con parciales continuas, donde el gradiente de g no sea cero.',
      },
      {
        label: 'Comparar valores',
        body: 'Comprueba la restricción y evalúa f en los candidatos. Para decidir extremos globales, incluye puntos singulares y bordes adicionales, si existen.',
      },
      {
        label: 'Objetivo lineal sobre un círculo',
        tex: '\\begin{aligned}\\max_{x^2+y^2=R^2}(ux+vy)&=R\\sqrt{u^2+v^2}\\\\(x,y)&=\\frac{R(u,v)}{\\sqrt{u^2+v^2}}\\end{aligned}',
        body: 'Para R > 0 y (u,v) distinto de (0,0). El punto opuesto da el mínimo.',
      },
      {
        label: 'Producto con suma fija',
        tex: 'x+y=s\\Rightarrow xy\\le\\frac{s^2}{4}',
        body: 'La igualdad se alcanza en x = y = s/2, porque xy = s²/4 − (x − s/2)².',
      },
    ],
  },
  'w7-c7': {
    defs: [
      {
        label: 'Integral doble',
        tex: '\\iint_R f(x,y)\\,dA',
        body: 'Límite de sumas de valores de f por áreas de pequeñas celdas de R. Para f no negativa, representa el volumen bajo la superficie.',
      },
      {
        label: 'Elemento de área rectangular',
        tex: 'dA=dx\\,dy',
        body: 'Cada base rectangular tiene área Δx por Δy.',
      },
      {
        label: 'Valor medio',
        tex: 'f_{\\mathrm{med}}=\\frac{1}{\\operatorname{área}(R)}\\iint_R f\\,dA',
        body: 'Total dividido por el área, que debe ser positiva.',
      },
    ],
    props: [
      {
        label: 'Fubini',
        tex: '\\begin{aligned}\\iint_R f\\,dA&=\\int_a^b\\!\\int_c^d f(x,y)\\,dy\\,dx\\\\&=\\int_c^d\\!\\int_a^b f(x,y)\\,dx\\,dy\\end{aligned}',
        body: 'Para f continua en el rectángulo $R=[a,b]\\times[c,d]$. En la integral interior, la otra variable queda fija.',
      },
      {
        label: 'Área de un rectángulo',
        tex: '\\operatorname{área}(R)=(b-a)(d-c)',
        body: 'Con a < b y c < d.',
      },
      {
        label: 'Linealidad',
        tex: '\\iint_R(\\alpha f+\\beta g)\\,dA=\\alpha\\iint_R f\\,dA+\\beta\\iint_R g\\,dA',
      },
      {
        label: 'Lluvia y unidades',
        tex: '1\\;\\mathrm{mm\\,km^2}=1\\,000\\;\\mathrm{m^3}',
        body: 'Para una intensidad constante en el tiempo, multiplica la integral espacial de la intensidad por la duración; después convierte las unidades.',
      },
    ],
  },
  'w7-c8': {
    defs: [
      {
        label: 'Coordenadas polares',
        tex: '\\begin{aligned}x&=r\\cos\\theta\\\\y&=r\\sin\\theta\\end{aligned}',
        body: 'r ≥ 0 es la distancia al origen; θ es el ángulo en radianes.',
      },
      {
        label: 'Elemento de área polar',
        tex: 'dA=r\\,dr\\,d\\theta',
        body: 'El factor r aparece porque los arcos crecen al alejarse del centro.',
      },
    ],
    props: [
      {
        label: 'Cambio a polares',
        tex: '\\iint_D f\\,dA=\\iint_{D^*}f(r\\cos\\theta,r\\sin\\theta)\\,r\\,dr\\,d\\theta',
        body: 'Usa límites que cubran la región una sola vez, salvo sus bordes; convierte tanto el integrando como el área.',
      },
      {
        label: 'Disco y sector',
        tex: '\\begin{aligned}A_{\\mathrm{disco}}&=\\pi R^2\\\\A_{\\mathrm{sector}}&=\\tfrac12R^2\\theta\\end{aligned}',
        body: 'Para R ≥ 0 y un sector con 0 ≤ θ ≤ 2π.',
      },
      {
        label: 'Potencia radial en un disco',
        tex: '\\iint_{r\\le R}r^n\\,dA=\\frac{2\\pi R^{n+2}}{n+2}',
        body: 'Para R > 0 y n > −2, la integral converge también en el centro.',
      },
      {
        label: 'Densidad de la búsqueda',
        tex: '\\begin{aligned}p(x,y)&=\\tfrac1\\pi e^{-(x^2+y^2)}\\\\P(r\\le R)&=1-e^{-R^2}\\end{aligned}',
        body: 'Densidad sobre todo el plano, con las distancias en km y R ≥ 0. Su integral total es 1.',
      },
      {
        label: 'Radio para una probabilidad',
        tex: 'R_p=\\sqrt{-\\ln(1-p)}',
        body: 'Para 0 < p < 1, en el modelo anterior. El radio exacto del 95 % es $\\sqrt{\\ln20}$, aproximadamente 1,73 km.',
      },
    ],
  },
};
