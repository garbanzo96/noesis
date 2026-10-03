"""Original NÓESIS scenes. Rendered with the original 3b1b/manim engine.

Scene geometry and teaching sequences are original; no 3Blue1Brown scene or
website content is incorporated. Captions belong to the browser manifest.
"""
from manimlib import *
import math
import numpy as np

CYAN = "#28E7FA"
VIOLET = "#8A5CFF"
MAGENTA = "#FF3BA7"
AMBER = "#FFBC5E"
CREAM = "#F3F0FF"
MUTED = "#413C63"

def pt(x, y):
    return np.array([x, y, 0.0])

def txt(s, x=0, y=3.2, color=CREAM, size=32):
    return Text(s, font="Arial", font_size=size, color=color).move_to(pt(x, y))

def curve(points, color=CYAN, width=4):
    return VMobject(stroke_color=color, stroke_width=width).set_points_smoothly(points)

def graph(fn, xmin, xmax, mapper=lambda x, y: pt(x, y), color=CYAN, samples=121):
    return curve([mapper(x, fn(x)) for x in np.linspace(xmin, xmax, samples)], color)

def grid(xmin=-5, xmax=5, ymin=-2.5, ymax=2.5, step=1):
    return VGroup(*[
        Line(pt(x, ymin), pt(x, ymax), stroke_color=MUTED, stroke_width=1)
        for x in np.arange(xmin, xmax + 0.01, step)
    ], *[
        Line(pt(xmin, y), pt(xmax, y), stroke_color=MUTED, stroke_width=1)
        for y in np.arange(ymin, ymax + 0.01, step)
    ])

def axes(mapper, xmin, xmax, ymin, ymax):
    return VGroup(
        Line(mapper(xmin, 0), mapper(xmax, 0), stroke_color=MUTED, stroke_width=2),
        Line(mapper(0, ymin), mapper(0, ymax), stroke_color=MUTED, stroke_width=2),
    )

def arr(a, b, color=CYAN, thickness=4):
    return Arrow(a, b, buff=0, fill_color=color, thickness=thickness)

def normal(x, mu=0, sigma=1):
    return math.exp(-0.5*((x-mu)/sigma)**2) / (sigma*math.sqrt(2*math.pi))

def bars(values, xs=(-3, 0, 3), base=-2.3, scale=4.6, colors=(CYAN, VIOLET, MAGENTA)):
    out=VGroup()
    for x, v, c in zip(xs, values, colors):
        out.add(Rectangle(width=1.45, height=scale*v, stroke_color=c, stroke_width=2,
            fill_color=c, fill_opacity=.35).move_to(pt(x, base+scale*v/2)))
    return out

class SetsCartesian(Scene):
    def construct(self):
        title=txt("A × B", color=CYAN)
        a=VGroup(*[Dot(pt(-5,y), radius=.1, fill_color=CYAN) for y in (-1.6,0,1.6)])
        b=VGroup(*[Dot(pt(-2.7,y), radius=.1, fill_color=VIOLET) for y in (-.8,.8)])
        labels=VGroup(txt("A",-5,2.5,CYAN),txt("B",-2.7,2.5,VIOLET),
            *[txt(str(i+1),-5.45,y,size=24) for i,y in enumerate((-1.6,0,1.6))],
            txt("a",-3.1,-.8,size=24),txt("b",-3.1,.8,size=24))
        self.play(FadeIn(a),FadeIn(b),FadeIn(labels),FadeIn(title),run_time=2)
        self.wait(1)
        links=VGroup(*[Line(da.get_center(),db.get_center(),stroke_color=MUTED,stroke_width=2) for da in a for db in b])
        self.play(LaggedStart(*[ShowCreation(l) for l in links],lag_ratio=.12),run_time=3)
        self.wait(1)
        dots=VGroup(*[Dot(pt(1+i*1.7,-.8+j*1.6),radius=.14,fill_color=(CYAN,VIOLET)[j]) for i in range(3) for j in range(2)])
        pairlabels=VGroup(*[txt(f"({i+1},{('a','b')[j]})",1+i*1.7,-1.2+j*1.6,size=24) for i in range(3) for j in range(2)])
        self.play(*[TransformFromCopy(links[k],dots[k]) for k in range(6)],FadeIn(pairlabels),run_time=3)
        self.wait(2)

class FunctionComposition(Scene):
    def construct(self):
        xs=(-4.6,0,4.6); ys=(1.6,0,-1.6)
        values=((-1,1,2),(0,2,3),(0,4,9))
        nodes=VGroup(*[Circle(radius=.45,stroke_color=(CYAN,VIOLET,MAGENTA)[j],stroke_width=3).move_to(pt(x,y)) for j,x in enumerate(xs) for y in ys])
        nums=VGroup(*[txt(str(values[j][i]),x,y,size=29) for j,x in enumerate(xs) for i,y in enumerate(ys)])
        names=VGroup(txt("x",xs[0],2.7,CYAN),txt("f(x) = x + 1",xs[1],2.7,VIOLET),txt("g(y) = y²",xs[2],2.7,MAGENTA))
        self.play(FadeIn(nodes),FadeIn(nums),FadeIn(names),run_time=2)
        self.wait(1)
        links1=VGroup(*[arr(pt(xs[0]+.6,y),pt(xs[1]-.6,y),CYAN) for y in ys])
        self.play(LaggedStart(*[GrowArrow(l) for l in links1],lag_ratio=.25),run_time=3)
        links2=VGroup(*[arr(pt(xs[1]+.6,y),pt(xs[2]-.6,y),VIOLET) for y in ys])
        self.play(LaggedStart(*[GrowArrow(l) for l in links2],lag_ratio=.25),run_time=3)
        self.play(FadeIn(txt("(g ∘ f)(x) = (x + 1)²",0,-3.0,AMBER)),run_time=1)
        self.wait(2)

class DerivativeSecantToTangent(Scene):
    def construct(self):
        m=lambda x,y:pt(-4.8+3*x,-2.4+1.15*y)
        f=lambda x:.5*x*x
        ax=axes(m,0,3.2,0,4.7)
        g=graph(f,0,3.1,m)
        h=ValueTracker(1.8)
        fixed=Dot(m(1,f(1)),radius=.1,fill_color=CYAN)
        moving=Dot(m(2.8,f(2.8)),radius=.1,fill_color=MAGENTA)
        secant=Line(m(.25,f(1)+(1+.9)*(.25-1)),m(2.8,f(1)+(1+.9)*(2.8-1)),stroke_color=AMBER,stroke_width=4)
        triangle=VGroup(Line(m(1,f(1)),m(2.8,f(1)),stroke_color=VIOLET,stroke_width=3),Line(m(2.8,f(1)),m(2.8,f(2.8)),stroke_color=MAGENTA,stroke_width=3))
        def update(_):
            hv=h.get_value(); slope=1+hv/2
            moving.move_to(m(1+hv,f(1+hv)))
            secant.put_start_and_end_on(m(.25,f(1)+slope*(.25-1)),m(2.8,f(1)+slope*(2.8-1)))
            triangle[0].put_start_and_end_on(m(1,f(1)),m(1+hv,f(1)))
            triangle[1].put_start_and_end_on(m(1+hv,f(1)),m(1+hv,f(1+hv)))
        secant.add_updater(update)
        self.play(ShowCreation(ax),ShowCreation(g),FadeIn(txt("f(x) = x² / 2",color=CYAN)),run_time=2)
        self.play(FadeIn(fixed),FadeIn(moving),ShowCreation(secant),ShowCreation(triangle),run_time=1)
        self.play(h.animate.set_value(.7),run_time=3)
        self.wait(1)
        self.play(h.animate.set_value(.025),run_time=4)
        secant.clear_updaters()
        self.play(FadeIn(txt("h → 0     Δf / h → f′(1) = 1",0,-3.2,AMBER,size=29)),run_time=1)
        self.wait(1)

class RiemannIntegral(Scene):
    def construct(self):
        m=lambda x,y:pt(-5+2.5*x,-2.5+2*y)
        f=lambda x:1+.45*math.sin(1.6*x)
        def rects(n):
            dx=4/n
            return VGroup(*[Polygon(m(i*dx,0),m((i+1)*dx,0),m((i+1)*dx,f((i+.5)*dx)),m(i*dx,f((i+.5)*dx)),stroke_color=VIOLET,stroke_width=.7,fill_color=VIOLET,fill_opacity=.45) for i in range(n)])
        ax=axes(m,0,4.2,0,2)
        g=graph(f,0,4,m)
        self.play(ShowCreation(ax),ShowCreation(g),FadeIn(txt("Σ f(xᵢ) Δx",color=AMBER)),run_time=2)
        self.wait(1)
        r=rects(4)
        self.play(FadeIn(r),run_time=1)
        for n in (8,16,32):
            self.play(Transform(r,rects(n)),run_time=2)
        area=Polygon(m(0,0),*[m(x,f(x)) for x in np.linspace(0,4,100)],m(4,0),stroke_width=0,fill_color=CYAN,fill_opacity=.28)
        self.play(FadeOut(r),FadeIn(area),FadeIn(txt("Δx → 0       ∫₀⁴ f(x) dx",0,-3.2,CYAN,size=29)),run_time=1)
        self.wait(1)

class MatrixBasisTransform(Scene):
    def construct(self):
        g=grid(-4,4,-2,2)
        e1=arr(ORIGIN,pt(1.5,0),CYAN,5); e2=arr(ORIGIN,pt(0,1.5),VIOLET,5)
        v=arr(ORIGIN,pt(1.5,1.5),AMBER,5)
        self.play(ShowCreation(g),GrowArrow(e1),GrowArrow(e2),GrowArrow(v),FadeIn(txt("A = [ 1  1 ; 0  1 ]",color=CREAM)),run_time=2)
        self.wait(1)
        moving=VGroup(g,e1,e2,v)
        self.play(moving.animate.apply_matrix([[1,1],[0,1]]),run_time=4)
        self.wait(1)
        decomposition=VGroup(arr(pt(1.5,0),pt(3,1.5),VIOLET,3),Line(pt(1.5,1.5),pt(3,1.5),stroke_color=CYAN,stroke_width=2))
        self.play(ShowCreation(decomposition),FadeIn(txt("A(e₁ + e₂) = Ae₁ + Ae₂",0,-3.2,AMBER,size=29)),run_time=2)
        self.wait(2)

class BayesianMassNormalization(Scene):
    def construct(self):
        prior=np.array([.5,.3,.2]); like=np.array([.2,.8,.5]); joint=prior*like; posterior=joint/joint.sum()
        labels=VGroup(*[txt(s,x,-2.8,size=28) for s,x in zip(("H₁","H₂","H₃"),(-3,0,3))])
        base=Line(pt(-4.3,-2.3),pt(4.3,-2.3),stroke_color=MUTED)
        b=bars(prior)
        title=txt("P(H)",color=CYAN)
        self.play(FadeIn(b),FadeIn(labels),ShowCreation(base),FadeIn(title),run_time=2)
        self.wait(1)
        evidence=VGroup(*[txt(f"× {v:.1f}",x,.7,AMBER,size=36) for x,v in zip((-3,0,3),like)])
        self.play(FadeIn(evidence),run_time=2)
        self.wait(1)
        self.play(Transform(b,bars(joint)),FadeOut(evidence),Transform(title,txt("P(D|H) P(H)",color=AMBER)),run_time=2)
        self.wait(1)
        self.play(Transform(b,bars(posterior)),Transform(title,txt("P(H|D)       Σ P(H|D) = 1",color=CREAM)),run_time=2)
        self.wait(1)

class JointProbability(Scene):
    def construct(self):
        # P(A_i,B_j)=[[.1,.4],[.2,.3]]. Table cell areas are fixed;
        # bar heights, rather than cell area or opacity, encode probability.
        cells=VGroup(*[Rectangle(width=2.15,height=1.9,stroke_color=MUTED,stroke_width=2).move_to(pt(-3+j*2.2,1-i*2)) for i in range(2) for j in range(2)])
        masses=((.1,.4),(.2,.3))
        bars2=VGroup(*[Rectangle(width=.75,height=3*masses[i][j],fill_color=(CYAN,VIOLET)[j],fill_opacity=.45,stroke_color=(CYAN,VIOLET)[j],stroke_width=2).move_to(pt(-3+j*2.2,.15-i*2+1.5*masses[i][j])) for i in range(2) for j in range(2)])
        values=VGroup(*[txt(f"{masses[i][j]:.1f}",-3+j*2.2,1.68-i*2,size=27) for i in range(2) for j in range(2)])
        names=VGroup(txt("B₀",-3,2.45,CYAN),txt("B₁",-.8,2.45,VIOLET),txt("A₀",-4.55,1,size=27),txt("A₁",-4.55,-1,size=27))
        self.play(FadeIn(cells),FadeIn(bars2),FadeIn(values),FadeIn(names),FadeIn(txt("P(A,B)",color=CREAM)),run_time=2)
        self.wait(1)
        marginals=VGroup(txt("Σ = 0.5",.9,1,AMBER,size=27),txt("Σ = 0.5",.9,-1,AMBER,size=27),txt("0.3",-3,-2.6,AMBER,size=27),txt("0.7",-.8,-2.6,AMBER,size=27))
        self.play(FadeIn(marginals),run_time=2)
        self.wait(1)
        self.play(cells[0].animate.set_opacity(.15),cells[2].animate.set_opacity(.15),bars2[0].animate.set_opacity(.15),bars2[2].animate.set_opacity(.15),values[0].animate.set_opacity(.15),values[2].animate.set_opacity(.15),run_time=2)
        cond=bars([4/7,3/7],xs=(3.25,5.1),base=-1.95,scale=3.5,colors=(CYAN,VIOLET))
        self.play(TransformFromCopy(VGroup(bars2[1],bars2[3]),cond),FadeIn(txt("A₀",3.25,-2.4,size=26)),FadeIn(txt("A₁",5.1,-2.4,size=26)),FadeIn(txt("P(A | B₁)",4.1,2.4,AMBER,size=29)),run_time=3)
        self.wait(1)

class GaussianPrecision(Scene):
    def construct(self):
        m=lambda x,y:pt(1.5*x,-2.4+5*y)
        ax=axes(m,-3.7,3.7,0,1)
        sigma=ValueTracker(1.35)
        g=graph(lambda x:normal(x,0,1.35),-3.6,3.6,m)
        ghost=g.copy().set_stroke(VIOLET,2,opacity=.45)
        self.play(ShowCreation(ax),FadeIn(txt("Π = 1 / σ²",color=AMBER)),run_time=1)
        self.play(ShowCreation(g),run_time=2)
        self.wait(1)
        self.add(ghost)
        g.add_updater(lambda mob:mob.become(graph(lambda x:normal(x,0,sigma.get_value()),-3.6,3.6,m)))
        self.play(sigma.animate.set_value(.48),run_time=4)
        g.clear_updaters()
        self.wait(1)
        self.play(ShowCreation(Line(m(0,0),m(0,normal(0,0,.48)),stroke_color=AMBER,stroke_width=2)),FadeIn(txt("∫ p(x) dx = 1",0,-3.2,size=29)),run_time=1)
        self.wait(2)

class GradientDescentContours(Scene):
    def construct(self):
        # E(x,y)=1/2(x²+3y²); exact level sets and Euler descent.
        rings=VGroup(*[Ellipse(width=2*r,height=2*r/math.sqrt(3),stroke_color=VIOLET,stroke_width=2,fill_opacity=0).set_stroke(opacity=.3+.1*i) for i,r in enumerate((.6,1.2,1.8,2.4,3))])
        self.play(ShowCreation(rings),FadeIn(txt("E(x,y) = ½(x² + 3y²)",color=CREAM)),run_time=2)
        x=np.array([2.8,1.45]); dot=Dot(pt(*x),radius=.12,fill_color=CYAN)
        self.play(FadeIn(dot),run_time=1)
        for _ in range(7):
            nxt=x-.18*np.array([x[0],3*x[1]])
            arrow=arr(pt(*x),pt(*nxt),AMBER,3)
            self.play(GrowArrow(arrow),dot.animate.move_to(pt(*nxt)),run_time=1)
            x=nxt
        self.add(txt("xₖ₊₁ = xₖ − η ∇E(xₖ)",0,-3.2,AMBER,size=29))
        self.wait(2)

class EntropyInformation(Scene):
    def construct(self):
        p=np.array([.8,.15,.05]); b=bars(p)
        labels=VGroup(*[txt(s,x,-2.8,size=28) for s,x in zip(("A","B","C"),(-3,0,3))])
        self.play(FadeIn(b),FadeIn(labels),FadeIn(txt("H(p) = Σ pᵢ log₂(1/pᵢ)",color=CREAM)),run_time=2)
        self.wait(1)
        self.play(Transform(b,bars([1/3]*3)),run_time=3)
        self.wait(1)
        information=VGroup(*[txt("1.585 bits",x,.2,AMBER,size=27) for x in (-3,0,3)])
        self.play(FadeIn(information),FadeIn(txt("p = (⅓, ⅓, ⅓)       H = log₂ 3",0,-3.3,AMBER,size=29)),run_time=3)
        self.wait(2)

class DynamicalAttractor(Scene):
    def construct(self):
        # Stable linear focus: z(t)=z(0) exp((-0.32+1.15i)t).
        mat=np.array([[-.32,-1.15],[1.15,-.32]])
        field=VGroup()
        for x in np.arange(-4,4.1,1):
            for y in np.arange(-2.5,2.6,1):
                vec=mat@np.array([x,y]); length=np.linalg.norm(vec)
                if length>.1: field.add(arr(pt(x,y),pt(x,y)+np.r_[.35*vec/length,0],MUTED,2))
        self.play(ShowCreation(field),FadeIn(txt("ż = (−0.32 + 1.15i) z",color=CREAM)),run_time=2)
        paths=[]; dots=[]
        for i,z0 in enumerate((3.8+1.4j,-3.6+1j,1.2-2.6j)):
            c=(CYAN,VIOLET,MAGENTA)[i]
            points=[pt((z0*np.exp((-.32+1.15j)*t)).real,(z0*np.exp((-.32+1.15j)*t)).imag) for t in np.linspace(0,10,401)]
            path=curve(points,c,3); dot=Dot(points[0],radius=.1,fill_color=c)
            paths.append(path); dots.append(dot)
        self.add(*dots)
        self.play(*[ShowCreation(path,rate_func=linear) for path in paths],*[MoveAlongPath(dot,path,rate_func=linear) for dot,path in zip(dots,paths)],run_time=7)
        self.play(FadeIn(Dot(ORIGIN,radius=.08,fill_color=AMBER)),FadeIn(txt("|z(t)| = |z(0)| e⁻⁰·³²ᵗ",0,-3.3,AMBER,size=29)),run_time=1)
        self.wait(2)

class VariationalPosterior(Scene):
    def construct(self):
        m=lambda x,y:pt(1.5*x,-2.5+6*y)
        p=graph(lambda x:normal(x,1.1,.7),-3.8,3.8,m,AMBER)
        ax=axes(m,-3.8,3.8,0,.8)
        self.play(ShowCreation(ax),ShowCreation(p),FadeIn(txt("p(s|o)",2.8,2.7,AMBER)),run_time=2)
        self.wait(1)
        mu=ValueTracker(-1.2); sigma=ValueTracker(1.3)
        q=graph(lambda x:normal(x,-1.2,1.3),-3.8,3.8,m,CYAN)
        self.play(ShowCreation(q),FadeIn(txt("q(s)",-3,2.7,CYAN)),run_time=2)
        self.wait(1)
        q.add_updater(lambda mob:mob.become(graph(lambda x:normal(x,mu.get_value(),sigma.get_value()),-3.8,3.8,m,CYAN)))
        self.play(mu.animate.set_value(1.1),sigma.animate.set_value(.7),run_time=4)
        q.clear_updaters()
        self.add(txt("Dₖₗ(q || p) → 0",0,-3.3,CYAN,size=29))
        self.wait(2)

class MarkovMessages(Scene):
    def construct(self):
        # Binary filter: prior=(.8,.2), T=[[.85,.15],[.15,.85]], L=(.2,.8).
        xs=(-4.4,0,4.4); ys=(1,-1)
        nodes=VGroup(*[Circle(radius=.45,stroke_color=(CYAN,VIOLET)[j],stroke_width=3).move_to(pt(x,y)) for x in xs for j,y in enumerate(ys)])
        labels=VGroup(*[txt(f"s{j}",x,y,size=24) for x in xs for j,y in enumerate(ys)],*[txt(s,x,2.4,size=29) for s,x in zip(("t − 1","t: pred.","t: dato"),xs)])
        self.play(FadeIn(nodes),FadeIn(labels),run_time=2)
        links=VGroup(*[arr(pt(xs[0]+.6,ys[j]),pt(xs[1]-.6,ys[l]),MUTED,2) for j in range(2) for l in range(2)],*[arr(pt(xs[1]+.6,y),pt(xs[2]-.6,y),AMBER,2) for y in ys],txt("× 0.2",2.2,1.35,AMBER,size=23),txt("× 0.8",2.2,-.65,AMBER,size=23))
        self.play(ShowCreation(links),run_time=1)
        def belief_bars(values,x):
            return VGroup(*[Rectangle(width=.36,height=v,stroke_color=c,stroke_width=2,fill_color=c,fill_opacity=.4).move_to(pt(x+offset,-2.65+v/2)) for v,offset,c in zip(values,(-.25,.25),(CYAN,VIOLET))])
        prior=belief_bars([.8,.2],xs[0])
        predicted=belief_bars([.71,.29],xs[1])
        posterior=belief_bars([.142/.374,.232/.374],xs[2])
        self.add(prior)
        self.play(TransformFromCopy(prior,predicted),run_time=3)
        self.play(TransformFromCopy(predicted,posterior),run_time=3)
        self.play(FadeIn(txt("bₜ ∝ P(oₜ|sₜ) Σ T(sₜ|sₜ₋₁) bₜ₋₁",0,3.3,AMBER,size=29)),run_time=1)
        self.wait(2)

class PolicyInformation(Scene):
    def construct(self):
        root=Dot(pt(-4.8,0),radius=.16,fill_color=CREAM)
        exploit=Circle(radius=.5,stroke_color=MAGENTA,stroke_width=3).move_to(pt(0,1.5))
        explore=Circle(radius=.5,stroke_color=CYAN,stroke_width=3).move_to(pt(0,-1.5))
        links=VGroup(arr(root.get_center(),exploit.get_center(),MAGENTA),arr(root.get_center(),explore.get_center(),CYAN))
        self.play(FadeIn(root),ShowCreation(links),FadeIn(exploit),FadeIn(explore),FadeIn(txt("valor = recompensa + información",color=CREAM,size=30)),run_time=2)
        broad=bars([.5,.5],xs=(3.1,4.8),base=-2.6,scale=1.9,colors=(CYAN,VIOLET))
        narrow=bars([.92,.08],xs=(3.1,4.8),base=-2.6,scale=1.9,colors=(CYAN,VIOLET))
        labels=VGroup(txt("R = 1.0",0,1.5,MAGENTA,size=24),txt("R = 0.2",0,-1.5,CYAN,size=24),txt("P(H)",4,0,CYAN,size=28))
        self.play(FadeIn(broad),FadeIn(labels),run_time=2)
        token=Dot(root.get_center(),radius=.12,fill_color=AMBER)
        self.add(token)
        self.play(token.animate.move_to(explore.get_center()),GrowArrow(arr(explore.get_center(),pt(3.7,-1.5),AMBER)),run_time=3)
        self.play(Transform(broad,narrow),FadeIn(txt("ΔH > 0",4,.8,AMBER,size=29)),run_time=3)
        self.wait(2)

class PerceptionAction(Scene):
    def construct(self):
        # Gaussian precision-weighted perception then proportional action.
        m=lambda x,y:pt(-4.9+1.4*x,y)
        target=3.0; prior=1.0; observed=2.5; post=(prior+4*observed)/5
        axis=Line(m(0,-1.8),m(7,-1.8),stroke_color=MUTED,stroke_width=2)
        goal=Line(m(target,-2.4),m(target,2.1),stroke_color=AMBER,stroke_width=2)
        belief=Dot(m(prior,.8),radius=.15,fill_color=CYAN)
        body=Dot(m(observed,-1.8),radius=.15,fill_color=MAGENTA)
        self.play(ShowCreation(axis),ShowCreation(goal),FadeIn(belief),FadeIn(body),FadeIn(txt("μ′ = (Π₀μ₀ + Πₒo) / (Π₀ + Πₒ)",color=CREAM,size=30)),run_time=2)
        observation=Dot(m(observed,.8),radius=.12,fill_color=VIOLET)
        self.play(FadeIn(observation),ShowCreation(Line(belief.get_center(),observation.get_center(),stroke_color=VIOLET,stroke_width=2)),run_time=2)
        self.play(belief.animate.move_to(m(post,.8)),run_time=3)
        self.play(body.animate.move_to(m(observed+.6*(target-post),-1.8)),FadeIn(txt("a = 0.6 (μ* − μ′)",0,-3.0,AMBER,size=29)),run_time=3)
        self.wait(2)
