# Bounded code review — Nóesis

Reviewed `dist/app.js`, `dist/visuals.js`, `dist/field.js`, and responsive CSS. Read-only review; root made all app repairs.

## Material issues found and repaired during review

1. **Import HTML injection:** history dates accepted arbitrary strings, then `settingsPage()` interpolated `date.slice(5)` as HTML. Root now checks YYYY-MM-DD, discards unknown history fields, and escapes rendering. Node check confirmed malicious date rejection and unknown-field removal.
2. **Review interval compounded per question:** four correct repairs for one mission doubled its interval four times instead of once. Root now groups results by mission, updates the interval once, and schedules immediate repair when any wrong/assisted result remains.
3. **Unreachable Markov objective:** strict alternation with α=.15, β=.35, likelihood .8 approaches p(L)=.949568869, so the former >.95 target was impossible. Root now requires >.94 with ≥3 predictions and observations, checks unrounded belief data, and exposes action counts. Three alternating cycles reach .948831802.
4. **Invalid deep links crashed initialization:** malformed URI fragments threw in decodeURIComponent; inherited VISUALS keys such as `constructor`/`__proto__` were treated as valid labs. Root now guards decoding and uses own-property checks in navigation, lab rendering and imported badges.
5. **Gradient slider quantization contradicted the trajectory:** internal exact updates were assigned to range controls with .05 steps, causing native sanitization while the path retained unsnapped values. Root now uses step=any for x/y; η retains a useful selectable step.
6. **Completed challenge navigation asked an unnecessary exit confirmation:** root now only checks unfinished sessions.

## Continuation issue also repaired

`openLesson()` now saves `seen` and `lastLesson` only after `go()` succeeds. Cancelling navigation preserves the previous continuation and active quiz. This repair was included in the subsequent DOM tests.

## Verification and calculation review

- Numeric parser: eight finite-number, decimal comma, Unicode minus, fraction, exponent and invalid-input cases passed; zero denominators and malformed fractions reject.
- All 13 field validators accepted chosen target witnesses. The targets match slider ranges. This is validator/calculation verification, not a substitute for browser interaction testing.
- Default gradient descent reaches E<.005 after 11 η=.15 steps from (2.3,1.8), with the exact position state now retained.
- Checked right-Riemann relative error 3/(2n)+1/(2n²), column orientation of matrix and Markov B, Bayes normalization, Gaussian precision, Bernoulli entropy/KL, Gaussian KL/F/ELBO, OU mean/stationary variance and policy softmax sign. No further material arithmetic issue identified.
- Agent goal is achievable after a correct first sensor reading and corresponding action; validator state was checked, while random episodes require browser QA.
- User-entered atlas search, numeric answers, field readouts and imported profile strings are escaped where rendered; KaTeX trust=false is appropriate. Remaining raw strings are shipped static content or internally constructed numerical values.
- CSS includes minmax(0,1fr), overflow handling for formulas, stacked mobile layouts, horizontal lab selection and reduced-motion rules. No material layout flaw was established from static review. Actual device-width screenshots remain root UI QA.

## Scope limits

Did not edit the app, run live browser interactions, or assess mathematical curriculum completeness (assigned separately). The code is compact/minified by line, so locations are functions rather than stable line ranges while root is editing.
