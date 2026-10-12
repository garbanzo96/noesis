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
};
