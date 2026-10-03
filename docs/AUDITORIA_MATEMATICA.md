# Educational content audit

Status: COMPLETE. Final bank inspected:70 lessons /280 questions. All requested mathematical/notation fixes verified in the regenerated final JSON; no outstanding material inaccuracies or ambiguous answers found. Question numbers below are 1-based; choice answer indices are 0-based, as stored in curriculum.json.

Verified final SHA256: `7aa25cb6e6e7c451b3a9f91729bc94de08790e029e397a225b4656f4325cca34`.

Scope: mathematical definitions, derivations, worked examples, all numerical question answers, all multiple-choice indices, domain/regularity conditions, F/G conventions, and structural/string checks. This is an educational-content audit, not a proof of complete mastery after the course, a review of the app's code, or a browser-rendering test.

## Findings sent to curriculum author

Findings1–16 below are historical and were verified corrected in the final70-lesson generation. All mathematical numerical answers and intended choice indices are correct.

1. RESOLVED: `foundations-4`, `example.solution`: intended LaTeX `x\ne2` contained an actual newline. Author regenerated the string correctly. Mathematical result x+2 with x≠2 is correct.
2. RESOLVED: `foundations-2`, question4 (answer index1) now declares s discrete. `probability-3` explicitly teaches sum vs integral for discrete vs continuous marginalization.
3. `integral-1`, fundamental theorem core: add f continuous on [a,b] (or a correctly stated broader theorem); the question already includes continuity. Without assumptions, the blanket statement over arbitrary functions is false.
4. `integral-2`, density transport core: declare a differentiable bijective transformation with differentiable inverse on the relevant support. Mere invertibility does not justify this derivative formula. For noninvertible transformations, one must sum over preimage branches.
5. `probability-5`, Dirichlet core: add concentrations α_i>0 and simplex components θ_i≥0. The present formula declares only their sum, allowing negative components/parameters if read literally.
6. `statistics-3`, CLT core and question2 (answer index1): declare 0<σ²<∞. Variance zero is finite but makes the standardized quantity undefined. The intended answer remains index1 with that condition added.
7. `information-3`, question2 (answer index0): declare discrete state/observation. A deterministic invertible continuous observation does not have differential conditional entropy0; its conditional law is singular, and the differential-entropy expression needs different treatment. The discrete answer is correct.
8. `information-2`, question2 (answer index1): declare a discrete state or a set of positive q mass. A continuous density p being0 at one isolated point where q>0 does not imply infinite KL; null sets do not contribute to the integral. The intended discrete result is correct.
9. `multivariate-4`, Lagrange core: the usual necessary condition requires a regular constraint (∇g≠0 at the optimum). Otherwise constrained extrema may fail the multiplier condition. Transport formula needs the same differentiable-inverse condition as integral2.
10. `dynamics-1`, equilibrium core: `f(x*)=0` applies to autonomous systems; after introducing f(x,t), state that a constant equilibrium requires f(x*,t)=0 for all relevant t.
11. `dynamics-2`, OU core: explicitly require k>0 for a restoring drift and nondegenerate stationary normal when σ>0. The numerical examples already use positive k.
12. `bayesian-5`, example: posterior probability0.8 assumes the two models are exhaustive. With additional models, BF12 and equal pairwise priors determine only their posterior odds. Add “dos únicos modelos”.
13. MATERIAL QUESTION AMBIGUITY: `generative-4`, question1, stored answer index2 (Y). Distractor index1 “Z siempre” is also formally true: X⊥Z|Z holds trivially when conditioning on Z itself. Ask specifically which intermediate node blocks the chain, or replace Z with a different distractor. Y is the intended nontrivial separator.
14. `variational-4`, objective core: the displayed fixed-precision error terms are a MAP/negative-log-joint energy. Identifying them with variational F(μ) requires the stated local approximation to also make omitted uncertainty/entropy contributions constant or negligible. For nonlinear g, E_q[log p(o|z)] need not equal log p(o|μ), and optimized covariance can introduce μ-dependent curvature corrections. Add a brief scope qualifier; gradient is correct for the displayed energy. Also “two quadratics” should mean quadratic in errors, not necessarily in μ when g is nonlinear.
15. `statistics-5`, SBC core and rank derivation: the unrandomized strict-less-than rank is uniform only for an appropriate scalar continuous posterior (no ties), assuming exact independent posterior draws. With atoms/discrete parameters, ties break the assertion. Declare no ties/continuous parameter or explain randomized tie breaking. Questions and numerical example are correct.
16. `decision-1`, selection-softmax core: β in exp(βEU) is inverse temperature/precision. Raising β makes selection more concentrated; increasing temperature would do the opposite. Rename the body to “precisión o inversa de temperatura” to match its correct questions.

Scope note resolved: `active-3` now also includes the B expected-transition-count update `b^u_ij ← b^u_ij + 1[u_t=u] q(s_{t+1}=i,s_t=j)`, in the declared next-state-row/current-state-column convention.

## Initial answer audit

All280 inspected questions have correct numeric answers or intended indices. The formerly ambiguous generative4 question1 has been reworded to uniquely identify Y. No duplicate/out-of-range answer indices or unexpected control characters were found in the final70-lesson file. F/ELBO identities, G_RA identity under its declared joint, full policy posterior including F, expected-count Dirichlet approximation, OU/Fokker–Planck, Laplace/precision, Bayes factors and BMR were reviewed against their stated assumptions.

| Lesson | Choice answer indices / numeric answers in question order |
|---|---|
| foundations-1 | 1,12,2,0 |
| foundations-2 | 3,10,24,1 |
| foundations-3 | 2,4,0,3 |
| foundations-4 | 4,1,32,3 |
| foundations-5 | 2,3,0.75,0 |
| foundations-6 | 1,3,0.64,1 |
| foundations-7 | 4,2,0,1 |
| foundations-8 | 1.03,3,0,1 |
| differential-1 | 8,2,0.1,3 |
| differential-2 | 1,12,3,2 |
| differential-3 | 2,1.22,0,2 |
| differential-4 | 5,1,1,0 |
| integral-1 | 2,2,12,0 |
| integral-2 | 0.25,2,1,3 |
| integral-3 | 0.25,3,0.25,1 |
| integral-4 | 3,1,1,0 |
| linear-1 | 10,10,2,0 |
| linear-2 | 4,2,4,0 |
| linear-3 | 3,3,1,2 |
| linear-4 | 3,1,1,3 |
| linear-5 | 4,1,1,2 |
| probability-1 | 0.3,0.7,2,3 |
| probability-2 | 2,0.8,0.3,1 |
| probability-3 | 0.5,2,0.2,0 |
| probability-4 | 0.25,0.25,1,2 |
| probability-5 | 0.3,3,0.25,0 |
| statistics-1 | 0.6,2,0,2/3 |
| statistics-2 | 4,2,3,0 |
| statistics-3 | 1,1,2,4 |
| statistics-4 | 0.09,1,0.04,2 |
| multivariate-1 | 12,0,2,2 |
| multivariate-2 | 15,3,0.5,0 |
| multivariate-3 | 6,2,0.2,0 |
| multivariate-4 | 1,1,0.1,3 |
| information-1 | 0,2,3,3 |
| information-2 | 0,1,2,2 |
| information-3 | 1.5,0,0,2 |
| information-4 | 1,0,2,0 |
| dynamics-1 | -6,1,3,2 |
| dynamics-2 | 0.2,2,2,1 |
| dynamics-3 | 1,2,2,0 |
| dynamics-4 | 2,1,2,3 |
| bayesian-1 | 5,0.625,1,0 |
| bayesian-2 | 5,2,1,0.25 |
| bayesian-3 | 2,3,0,3 |
| bayesian-4 | 1,0.9,2,0.6 |
| bayesian-5 | 4,6,1,2 |
| variational-1 | 3.5,-2.4,1,2 |
| variational-2 | 1.9,2,0,1 |
| variational-3 | 0,0.75,2,1 |
| variational-4 | -1,1,1,2 |
| generative-1 | 5,2,0.65,0 |
| generative-2 | 1,0.7,2,1 |
| generative-3 | 1,0.8,0,3 |
| generative-4 | 2,0,3,1 |
| decision-1 | 3,1,2,3.5 |
| decision-2 | 0.8,2,1.5,0 |
| decision-3 | 1,0.3,2,0 |
| decision-4 | 0.5,1,0.75,2 |
| active-1 | 1,0.6,0,2 |
| active-2 | 0,1,0,2 |
| active-3 | 0.4,1,2,0 |
| active-4 | -2,1,2,0 |
| active-5 | 1,2,2,0 |
| integral-5 | 0,3,1,2 |
| probability-6 | 0.5,7,1,0 |
| information-5 | 0.2,2,0.75,1 |
| bayesian-6 | 4,0.5,1,2 |
| statistics-5 | 0.9,2,5,1 |
| active-6 | 1.5,1,2,0.6 |

The real-domain log/exponent constraints, no cancellation at excluded denominator zeros, inverse-function injectivity requirement, radian convention and local-validity warning for Taylor approximations are present and correct. The foundations-4 density-units question assumes the coordinate is measured in metres, as implied by its available unit options; it would be clearer to state that explicitly if revised.
