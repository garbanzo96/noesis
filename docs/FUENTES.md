# Source-grounded curriculum report

Research date: 2026-10-03. Read-only source inspection; no source files modified. Sources are local materials in `/Users/gabrielsalas/Desktop/enigma/grupo de lectura active inference` (below: `ENIGMA/`). There were no applicable AGENTS.md files on the relevant ancestor paths.

## What is already available

ENIGMA contains a unusually complete curriculum and quality system, not merely reference PDFs:

- `03_guias_nivelacion/00_sistema/00_ARQUITECTURA_DEL_PROYECTO.md`: G00–G13, dependency routes, scope decisions, style guidance.
- `03_guias_nivelacion/00_sistema/03_REGISTRO_GLOBAL_DE_NOTACION.md`: canonical notation, dimensions and implementation conventions.
- `03_guias_nivelacion/00_sistema/04_MATRIZ_DE_COBERTURA_DEL_LIBRO.md`: chapter-by-chapter prerequisite matrix.
- `03_guias_nivelacion/guias/`: 15 substantive guides (G00–G13 and GX1), with definitions, equations, examples, exercises, solutions and figure specifications.
- `03_guias_por_capitulo/`: session 0 and all ten chapters, with guides in Markdown/PDF.
- `04_mapas_y_recursos/`: source map, book map and notation/distinction atlas.
- `02_herramientas_matematicas/Unknown 2026 - Apuntes de Inferencia Estadistica Bayesiana.pdf`: 78 PDF pages, the user's preferred mathematical style.
- `01_bibliografia_base/Parr, Pezzulo, Friston (2022) Active Inference.pdf`: 313 PDF pages.

All 21 PDFs were extracted with pypdf into `work/sources`, with a `=== PDF PAGE N ===` delimiter; all Markdown files were mirrored preserving relative paths. `work/sources/inventory.json` records original paths, extraction paths, page counts and text sizes. Extraction is suitable for search, but equations may lose ordering/symbols; pivotal formulas below were cross-checked against legible guide sources and relevant book text. A visual sample of the user's notes is `work/sources/apuntes-bayes-sample.png` (PDF29/printed28).

## Recommended game curriculum

The source architecture separates a compact common trunk, a discrete branch, and a continuous branch. This is much better aligned with the objective than requiring an entire conventional undergraduate calculus sequence first. The app can still display the user's requested discipline-based worlds, but its recommended path should use a dependency graph and allow mastery checks to skip familiar material.

| Stage | Source | Minimum concepts | Observable result / suggested game gate |
|---|---|---|---|
| 1. Mathematical language | G00 | Sets, intervals, equality/definition/approximation/proportionality; variables and indices; functions and composition; sums/products; powers, exp, ln | Read a probability/energy equation without unexplained notation; transform a product likelihood into a log-sum |
| 2. Probability as rational inference | G04 | Propositions and indicators; sum/product rules; joint, marginal, conditional; independence | Construct a normalized joint table, marginalize, distinguish independence from conditional independence |
| 3. Random variables | G05 + integral capsule | PMF/PDF/CDF, support; expectation/variance/covariance; Bernoulli, categorical, binomial, Beta, Gaussian, multivariate Gaussian, Dirichlet | Distinguish density height from probability area; compute expectations and read uncertainty |
| 4. Bayes and evidence | G06 | Prior/likelihood/evidence/posterior; sequential updating; Beta–Bernoulli, Dirichlet–categorical; MLE/MAP/posterior mean; posterior predictive; marginal evidence and model comparison | Infer a hidden cause, learn a probability and distinguish fit from evidence |
| 5. Information | G07 | Surprise, Shannon entropy, cross entropy, directed KL, Jensen/Gibbs, mutual information; constrained MaxEnt/Lagrange | Explain why uncertain but uninformative observations are poor epistemic choices; derive a minimal exponential family |
| 6. Linear algebra | G03 | Column vectors, dimensions, inner/outer/matrix/Hadamard products; transpose/inverse/determinant/trace; stochastic matrices; covariance/precision; conditional tensors | Apply an observation model A to beliefs; update transition beliefs; normalize conditional axes |
| 7. Local approximation and optimization | G01 | Limit/derivative/chain rule; partials/gradient/Jacobian/Hessian; first/second-order Taylor; gradient descent | Explain an update as following the local slope; read curvature as Gaussian precision |
| 8. Variational inference | G08 | Intractable evidence; q approximation; F/ELBO and both decompositions; mean-field; Laplace; descent | Derive the F bound, minimize a small posterior approximation and explain omitted dependencies |
| 9. Generative graphs | G09 | Latent/observed variables; factorization, directed/factor graphs, plates; conditional independence; Markov blanket; local messages | Build a model, identify a collider and explain a local update from its blanket |
| 10. Discrete decision systems | G10 | Markov/HMM/MDP/POMDP; state/observation/action/policy; A–E; softmax; predicted observations; G, risk/ambiguity, pragmatic/epistemic value | Solve a small HMM then choose an informative policy in a T-maze |
| 11. Continuous systems | G02 + G11 | Integrals/densities/substitution/Jacobian; ODE/flow/fixed point/stability; Euler; Gaussian noise/SDE/Euler–Maruyama; OU; Fokker–Planck/NESS; generalized coordinates; precision-weighted errors | Simulate an attractor and show how precision affects perceptual versus action updates |
| 12. Learning and scientific analysis | G12 + chapter9 | Shape/index/normalization/numerical log stability; Dirichlet expected counts; model simulation; behavioral likelihood; parameter recovery; Laplace/evidence/model comparison | Construct and validate a small agent; recover a known parameter rather than just fit it |
| 13. Integration | G13 + chapter10 | Normative principle vs process theory vs empirical evidence; Bayesian brain vs predictive processing/coding; FEP vs Active Inference; attention/precision; homeostasis/allostasis | Read the central equations in the book and state their assumptions and limits |

The source's exact minimum route is `G00 → G04 → G05 → G06 → G07 → G03 → G08 → G09`; add G10 before chapter7. Add `G01 → G02 → G11` before chapter8; add G12 for model building and chapter9. However, full G08's own editorial checklist assumes G01, so a short slope/optimization/Taylor capsule is needed before mean-field/Laplace. Likewise the G03 checklist mentions G02, although core discrete matrix operations do not mathematically require integration: split core matrix work from continuous Gaussian tools instead of imposing that redundant gate.

GX1 (sums, LLN, CLT, convolution, characteristic functions) is explicitly optional for the book, but valuable for mastering all of the user's notes. Fourier/convolution, Dirac distributions, general Euler–Lagrange, Itô versus Stratonovich, full Fokker–Planck derivation, information geometry, PEB/BMR/DCM are advanced expansion zones, not barriers before Bayes or chapter7. If aiming at every book chapter, include concise conceptual PEB/BMR/structure-learning capsules at the end; do not claim implementation coverage from a single introductory lesson.

## Exact book coverage and locations

Book printed pages generally map to PDF page = printed page + 11 (front matter differs). Verified contents:

| Chapter | Printed pages | Needed tools |
|---|---:|---|
| 1. Overview | 3–14 | Action–perception loop, levels of explanation |
| 2. Low Road | 15–40 | G00/G04–G08: Bayes, surprise, KL, F, G |
| 3. High Road | 41–62 | Information, blanket, stochastic steady states conceptually |
| 4. Generative Models | 63–84 | Linear algebra, distributions, variational, graphs; discrete/continuous branch |
| 5. Message Passing and Neurobiology | 85–104 | Local messages, precision, predictive coding |
| 6. Recipe for Designing Models | 105–124 | Model factorization, scientific question, implementation |
| 7. Discrete Time | 125–152 | HMM/POMDP, policies, G, Dirichlet, salience/novelty, hierarchy |
| 8. Continuous Time | 153–172 | Continuous state models, attractors, precision, synchronization, hybrid discrete/continuous models |
| 9. Model-Based Data Analysis | 173–190 | Behavioral likelihood, meta-Bayes, Laplace, evidence/comparison, identifiability/recovery, PEB |
| 10. Unified Theory | 191–224 | Integration and limits |
| A. Mathematical Background | 225–242 | Probability, linear algebra, calculus/Taylor, variational inference, stochastic dynamics |
| B. Equations | 243–258 | Detailed discrete and continuous equations |
| C. MATLAB example | 259–266 | Algorithm reading and validation |

Important anchors (from the atlas, cross-checked in the book extraction):

- Bayes ec.2.1 printed17/PDF28; ec.4.1 printed64/PDF75.
- KL and Bayesian surprise ecs.2.3–2.4 printed20/PDF31.
- F's three decompositions ec.2.5 printed28/PDF39.
- G/ec.2.6 printed33–36/PDF44–47.
- A–D/policies ecs.4.5–4.10 printed71–74/PDF82–85.
- Policy posterior ec.4.14 printed75/PDF86: `softmax(−G−F)` in the simplest form.
- Continuous model/predictive coding ecs.4.15–4.22 printed78–83/PDF89–94.
- Information gain ec.7.8 printed135/PDF146.
- Dirichlet learning ecs.7.9–7.10 printed142–143/PDF153–154; novelty ec.7.11 printed144/PDF155.
- Hybrid model ec.8.8 printed167/PDF178.
- Behavioral model inversion ecs.9.1–9.5 printed174–179/PDF185–190.
- Posterior including habitual prior B.9 printed247/PDF258: `softmax(ln E−F−G)`.
- Computable G: B.28–B.30 printed252/PDF263; parameter novelty B.31–B.34 printed252–253/PDF263–264.
- Continuous filtering B.42–B.48 printed255–257/PDF266–268.

## Canonical formulas and distinctions to enforce

Use natural logs, information in nats; explicit bases when bits are used.

`F[q] = E_q[ln q(z) − ln p(x,z)] = KL(q(z)||p(z|x)) − ln p(x) ≥ −ln p(x)`.

`F = KL(q||prior) − E_q[ln likelihood] = complexity − accuracy`; accuracy is expected log likelihood, not classification accuracy. `ELBO = −F ≤ ln p(x)`. F is evaluated on observed data and approximate beliefs; it is not necessarily nonnegative (continuous density/evidence can exceed1), and it is not metabolic energy.

For an explicitly declared observation-preference convention:

`Gτ(π) = KL(q(oτ|π)||P_C(oτ)) + E_q(sτ|π)[H[p(oτ|sτ)]]`

`= −I_q(Sτ;Oτ|π) − E_q(oτ|π)[ln P_C(oτ)]`.

G scores prospective outcomes under a policy. Risk is divergence from preferences; ambiguity is expected likelihood entropy. High predictive entropy alone does not imply useful information. Salience/information gain about states and novelty/information gain about parameters are distinct. The book's derivation distinguishes state-preference risk from observation-preference risk (B.27 has an inequality); do not present every literature G definition as an unconditional algebraic identity.

If the app uses `q(π)=softmax(ln E−γG)`, label this a simplified policy selection rule with equal/omitted observed-data evidence. The general book posterior also includes `−F(π)`; this term accounts for how well policies explain observed past/present data. Do not call the simplified rule the full posterior.

Vectors are columns. `A∈R^(No×Ns)` has outcome rows/state columns; `B^u∈R^(Ns×Ns)` has next-state rows/current-state columns; each conditional column sums to1. `o_pred=A s_pred`. Learning A must use `outer(o,s)` in this orientation; some chapter guides use an outer-product symbol/order that is tied to the book's own tensor layout and should not be copied into NumPy blindly. `Π=Σ⁻¹`; precision is modeled certainty/gain, not factual truth.

Choose one C convention: the leveling guides use relative logits C and `P_C=softmax(C)`; the main book sometimes writes C itself as a categorical probability vector (B.28). Explicitly translate this on first book bridge. E is a habitual prior over policies. Distinguish discrete D (initial-state prior) from continuous derivative/shift operator `𝒟`. A policy is a sequence of actions, not one action.

For continuous models, distinguish the generative model (`ẋ=f(x,v)+ωx`, `y=g(x,v)+ωy`) from the effective process whose dynamics include action u. Generalized coordinates collect value and successive temporal derivatives; they are not arbitrary coordinates or a list of discrete time points. Generalized filtering assumes sufficiently smooth noise; do not derive differentiable noise coordinates from ideal white-noise sample paths without this assumption.

Normative objective, neural process hypothesis, and empirical evidence are separate levels; a formal minimum of F/G does not by itself establish a biological mechanism or clinical conclusion.

## User's notes: style and translation issues

The actual notes show a dense but legible construction: definition, local symbols, numbered central equation, explicit algebraic transformation, short interpretation, worked numerical example, and occasional compact tables/annotations. The app should preserve this chain in each capsule while adding interactive manipulation and short challenges. Compression must remove redundant prose, not conditions or nontrivial steps. The materials explicitly prefer original examples/figures rather than copying long passages from books.

The progression of the notes (printed numbers, PDF page is one higher from the main text):

- pp4–25: indicator Q, propositional algebra, estimation/linearity, discrete/continuous expectation, Riemann sums, Dirac, domain changes, Jensen and differentiation under expectation.
- pp26–34: probability rules, marginalization, Bayes, evidence and update ratios.
- pp35–46: KL, Gibbs, Shannon entropy/information.
- pp47–67: log likelihood, MLE/MAP, prior choices/Jeffreys, LLN, sums/convolution/Fourier/characteristic functions.
- pp68–77: MaxEnt, constraints/Lagrange multipliers, continuous limit.

First-principles entry: `P(A|I):=⟨Q(A)⟩_I`, where Q(A) is a0/1 indicator and I prior information; `⟨f(X)⟩_I ≡ E[f(X)|I]`. For the game, use `1_A` for the indicator and lower-case q for the variational distribution, with an explicit notation bridge. This avoids confusing the notes' Q with the book's approximate posterior Q.

Two genuine notation differences need explicit treatment:

1. Notes printed28/PDF29 label `R(T;E)=P(E|T,I0)/P(E|I0)` a Bayes factor. This is an update multiplier for one hypothesis against the entire prior predictive mixture. Standard pairwise `BF12=p(E|M1)/p(E|M2)` multiplies posterior odds between two models. Teach both meanings rather than equating them.
2. The notes write `P(X=x)` for a continuous density derived through Dirac indicators. In ordinary continuous notation, write `p_X(x)` for density; `P(X=x)=0`; interval probability is an integral. Density can exceed1 and depends on units. Preserve the translation instead of carrying the ambiguous notation into beginner challenges.

## Supporting sources and their roles

- Smith et al.2022,60pp: discrete implementation bridge, A–E, Dirichlet, F/G, behavioral fitting.
- Bogacz2017,14pp: excellent minimal Gaussian perception/gradient/predictive-error derivation; do not generalize this special Gaussian case to all Active Inference.
- Mann et al.2022,35pp: examples and careful separation of scientific/generative models and formal/empirical claims.
- FEP math,77pp: technical auditing of Gaussian/Laplace/mean-field/generalized-coordinate assumptions.
- Friston et al.2023,64pp: advanced stochastic/NESS/high-road expansion.
- Namjoshi,808pp: broad secondary reference; useful for targeted explanations, not an initial required course.

Several chapter guides still mark local equations/notational details `POR VERIFICAR`; the app should ground final formulas in the book or independently verified derivations, not display those uncertain statements as settled. There is enough material for a complete common trunk and both branches, but the aspirational maximum includes specialized expansion topics that need separate substantive missions.
