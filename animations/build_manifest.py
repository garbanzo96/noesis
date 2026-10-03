"""Authoritative captions and portable media packaging; no external assets."""
import json, pathlib, subprocess, shutil, hashlib

ROOT=pathlib.Path(__file__).resolve().parent
ASSETS=ROOT/'assets'
ASSETS.mkdir(exist_ok=True)

SCENES=[
('jointProbability','JointProbability',[
 (0,'Probabilidad conjunta','Las cuatro barras codifican P(Aᵢ,Bⱼ): 0.1, 0.4, 0.2 y 0.3.','P(A,B)=\\begin{pmatrix}0.1&0.4\\\\0.2&0.3\\end{pmatrix}'),
 (3,'Sumar para marginalizar','Las filas suman 0.5 y 0.5; las columnas suman 0.3 y 0.7.','P(A_i)=\\sum_jP(A_i,B_j),\\quad P(B_j)=\\sum_iP(A_i,B_j)'),
 (6,'Restringir al dato','Condicionar en B₁ conserva únicamente la segunda columna.','P(B_1)=0.7'),
 (8,'Renormalizar la columna','Dividimos las masas 0.4 y 0.3 por 0.7: la distribución condicional suma uno.','P(A|B_1)=(4/7,3/7)')]),
('setsCartesian','SetsCartesian',[
 (0,'Dos conjuntos','A contiene tres elementos; B contiene dos.','A=\\{1,2,3\\},\\;B=\\{a,b\\}'),
 (3,'Todas las combinaciones','Cada elemento de A se combina con cada elemento de B.','A\\times B=\\{(x,y):x\\in A,\\;y\\in B\\}'),
 (7,'Pares ordenados','La posición dentro del par importa. Hay seis pares posibles.','|A\\times B|=|A|\\,|B|=3\\cdot2=6')]),
('functionComposition','FunctionComposition',[
 (0,'Entrada y reglas','La primera regla suma uno. La segunda eleva al cuadrado.','f(x)=x+1,\\quad g(y)=y^2'),
 (3,'Primera transformación','La salida de f pasa a ser la entrada de g.','-1\\mapsto0,\\quad1\\mapsto2,\\quad2\\mapsto3'),
 (6,'Segunda transformación','La composición aplica las reglas en este orden.','(g\\circ f)(x)=g(f(x))=(x+1)^2'),
 (9,'Resultado compuesto','Las mismas entradas producen 0, 4 y 9.','(g\\circ f)(-1)=0,\\;(g\\circ f)(1)=4,\\;(g\\circ f)(2)=9')]),
('derivativeSecantToTangent','DerivativeSecantToTangent',[
 (0,'Una curva','La altura es f(x)=x²/2. Fijamos el punto x=1.','f(x)=x^2/2'),
 (2,'Una secante','El cociente entre el cambio vertical y el horizontal es la pendiente de la secante.','m_h=\\frac{f(1+h)-f(1)}{h}=1+\\frac h2'),
 (3,'Reducir la distancia','El segundo punto se acerca al primero mientras h permanece positivo.','h>0,\\quad h\\to0'),
 (7,'La pendiente local','La secante converge a la tangente; la derivada en x=1 vale 1.','f\u2032(1)=\\lim_{h\\to0}m_h=1')]),
('riemannIntegral','RiemannIntegral',[
 (0,'Área bajo la curva','Una función continua asigna una altura a cada punto del intervalo.','f(x)=1+0.45\\sin(1.6x),\\quad0\\le x\\le4'),
 (3,'Rectángulos','Cada rectángulo usa la altura del punto medio y el ancho Δx.','S_n=\\sum_{i=0}^{n-1} f((i+1/2)\\Delta x)\\Delta x'),
 (4,'Refinar la partición','Pasamos de 4 a 8, 16 y 32 rectángulos; cada ancho se reduce.','\\Delta x=4/n'),
 (10,'El límite es la integral','Al llevar el ancho a cero, la suma converge al área.','\\lim_{n\\to\\infty}S_n=\\int_0^4 f(x)\\,dx')]),
('matrixBasisTransform','MatrixBasisTransform',[
 (0,'Vectores base','Cian y violeta representan e₁ y e₂; ámbar representa su suma.','v=e_1+e_2'),
 (3,'Transformar el espacio','La matriz mantiene e₁ y envía e₂ a e₁+e₂. Toda la cuadrícula sigue la misma regla.','A=\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}'),
 (8,'Linealidad visible','Transformar una suma da la suma de los vectores transformados.','A(e_1+e_2)=Ae_1+Ae_2')]),
('bayesianMassNormalization','BayesianMassNormalization',[
 (0,'Distribución previa','Las alturas representan probabilidades 0.5, 0.3 y 0.2.','P(H)=(0.5,0.3,0.2)'),
 (3,'Compatibilidad con el dato','Cada hipótesis se pondera por su verosimilitud: 0.2, 0.8 y 0.5.','P(D|H)=(0.2,0.8,0.5)'),
 (6,'Masa sin normalizar','Multiplicar deja masas 0.10, 0.24 y 0.10.','P(D|H)P(H)=(0.10,0.24,0.10)'),
 (9,'Normalizar','Dividimos por 0.44. Las probabilidades posteriores vuelven a sumar uno.','P(H|D)=(5/22,6/11,5/22)')]),
('gaussianPrecision','GaussianPrecision',[
 (0,'Precisión e incertidumbre','Una distribución normal describe la incertidumbre alrededor de μ=0.','p(x)=\\mathcal N(x;0,\\sigma^2)'),
 (4,'Aumentar la precisión','σ pasa de 1.35 a 0.48. La masa se concentra sin cambiar su total.','\\Pi=\\sigma^{-2}'),
 (9,'La altura no es probabilidad','La curva es una densidad: la probabilidad corresponde a un área.','\\int_{-\\infty}^{\\infty}p(x)\\,dx=1')]),
('gradientDescentContours','GradientDescentContours',[
 (0,'Curvas de nivel','Cada elipse reúne puntos con la misma energía.','E(x,y)=\\tfrac12(x^2+3y^2)'),
 (3,'Paso opuesto al gradiente','El gradiente apunta al aumento; restarlo lleva a menor energía.','\\nabla E=(x,3y)'),
 (7,'Iterar la actualización','Con η=0.18, ambas coordenadas convergen al mínimo.','x_{k+1}=0.82x_k,\\quad y_{k+1}=0.46y_k'),
 (10,'Un mínimo estable','El objetivo es la energía, no la distancia recorrida.','(x_k,y_k)\\to(0,0),\\quad E_k\\to0')]),
('entropyInformation','EntropyInformation',[
 (0,'Una alternativa domina','La distribución (0.8,0.15,0.05) concentra la masa en A.','H(p)=-\\sum_i p_i\\log_2p_i'),
 (3,'Redistribuir la masa','Aumentamos la incertidumbre llevando las tres alternativas a igual probabilidad.','p\\to(1/3,1/3,1/3)'),
 (7,'Información y entropía','Cada resultado uniforme aporta log₂3 bits; su promedio es la entropía.','I(i)=-\\log_2p_i,\\quad H=\\log_2 3\\approx1.585')]),
('dynamicalAttractor','DynamicalAttractor',[
 (0,'Un campo dinámico','Las flechas muestran la velocidad local de un sistema lineal.','\\dot z=(-0.32+1.15i)z'),
 (2,'Trayectorias','Tres condiciones iniciales recorren espirales distintas bajo la misma regla.','z(t)=z(0)e^{(-0.32+1.15i)t}'),
 (9,'Un atractor estable','La parte real negativa hace que el radio disminuya exponencialmente.','|z(t)|=|z(0)|e^{-0.32t}\\to0')]),
('variationalPosterior','VariationalPosterior',[
 (0,'Una posterior objetivo','Ámbar representa una posterior gaussiana de media 1.1 y desviación 0.7.','p(s|o)=\\mathcal N(s;1.1,0.7^2)'),
 (3,'Una aproximación ajustable','Cian empieza con otra media y otra dispersión.','q(s)=\\mathcal N(s;\\mu,\\sigma^2)'),
 (6,'Reducir la divergencia','Este caso permite a q coincidir exactamente con la posterior.','D_{KL}(q\\|p)=\\int q(s)\\log\\frac{q(s)}{p(s|o)}\\,ds'),
 (10,'Límite de la familia','Aquí la familia gaussiana contiene la solución; en otros modelos queda una brecha.','q=p\\implies D_{KL}(q\\|p)=0')]),
('markovMessages','MarkovMessages',[
 (0,'Estado oculto','La creencia previa sobre dos estados es (0.8,0.2).','b_{t-1}=(0.8,0.2)'),
 (3,'Mensaje predictivo','Una transición simétrica con persistencia 0.85 produce (0.71,0.29).','\\bar b_t(s)=\\sum_{s\u2032}T(s|s\u2032)b_{t-1}(s\u2032)'),
 (6,'Mensaje del dato','La verosimilitud (0.2,0.8) favorece el segundo estado.','b_t(s)\\propto P(o_t|s)\\bar b_t(s)'),
 (9,'Creencia filtrada','La normalización produce aproximadamente (0.380,0.620).','b_t=(0.142,0.232)/0.374')]),
('policyInformation','PolicyInformation',[
 (0,'Dos políticas','Una opción ofrece recompensa inmediata; la otra obtiene una observación.','V(\\pi)=R(\\pi)+\\lambda\\,IG(\\pi)'),
 (4,'Actuar para conocer','La rama cian muestra un resultado informativo de una política de observación.','P(H)=(0.5,0.5)'),
 (7,'La posterior se concentra','Para este resultado, la creencia cambia a (0.92,0.08) y disminuye la entropía.','\\Delta H=H(P(H))-H(P(H|o))>0'),
 (10,'Valor epistémico','El valor esperado requiere promediar sobre todos los posibles resultados; aquí vemos uno.','IG(\\pi)=\\mathbb E_{o|\\pi}[D_{KL}(P(H|o,\\pi)\\|P(H))]')]),
('perceptionAction','PerceptionAction',[
 (0,'Predicción y objetivo','La creencia previa tiene media 1.0; la marca ámbar fija el objetivo en 3.0.','\\mu_0=1,\\quad\\mu^*=3'),
 (2,'Un dato con precisión','La observación vale 2.5 y tiene cuatro veces la precisión previa.','o=2.5,\\quad\\Pi_0=1,\\quad\\Pi_o=4'),
 (4,'Actualizar la percepción','La media posterior pondera predicción y observación según sus precisiones.','\\mu\u2032=(1+4\\cdot2.5)/5=2.2'),
 (7,'Cambiar el entorno','Un controlador proporcional actúa sobre el error: a=0.48; el estado pasa de 2.5 a 2.98.','a=0.6(3-2.2)=0.48')]),
]

def run(args):
    return subprocess.check_output(args,text=True)

items=[]
for scene_id,klass,stages in SCENES:
    source=ROOT/'raw'/f'{klass}.mp4'
    if not source.exists():
        matches=list((ROOT/'raw').rglob(f'{klass}.mp4'))
        if not matches:
            print(f'MISSING {klass}'); continue
        source=matches[0]
    dest=ASSETS/f'{scene_id}.mp4'
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-an','-c:v','libx264','-crf','27','-preset','slow','-pix_fmt','yuv420p','-movflags','+faststart',str(dest)],check=True)
    probe=json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(dest)]))
    duration=float(probe['format']['duration'])
    poster=ASSETS/f'{scene_id}.jpg'
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(duration-1),'-i',str(dest),'-frames:v','1','-q:v','3',str(poster)],check=True)
    items.append({'id':scene_id,'class':klass,'src':f'{scene_id}.mp4','poster':f'{scene_id}.jpg','duration':duration,'width':1280,'height':720,'fps':30,'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'stages':[{'at':at,'title':title,'claim':claim,'formula':formula} for at,title,claim,formula in stages]})
    print(f'{scene_id}: {duration:.3f}s, {dest.stat().st_size/1024:.0f} KiB')

manifest={'engine':{'name':'ManimGL (original 3b1b/manim)','version':'1.7.2','commit':'fafa083a4fb274bba9cabde0b6e2f50ba6da0622','repository':'https://github.com/3b1b/manim','renderer':'wgpu / Metal on Apple M3','license':'MIT'},'originalScenes':True,'audio':False,'codec':'H.264 / yuv420p','scenes':items}
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
shutil.copy2(ROOT/'engine'/'LICENSE.md',ROOT/'MANIM-LICENSE.txt')
(ROOT/'requirements-lock.txt').write_text(run([str(ROOT/'.venv/bin/python'),'-m','pip','freeze']).replace(str(ROOT/'engine'),'./engine'))
print(f'TOTAL: {len(items)} videos, {sum(i["bytes"] for i in items)/1e6:.2f} MB')
