# Report fact regression

Run from the prototype directory:

- `node qa/verify-alicti-report-facts.cjs` — 39 factual mapping and statistic checks, including saved official response examples.
- `node qa/verify-call-regression-fixes.cjs` — 9 prior late-CDR/human-answer regression checks, with fixtures corrected to official response seconds and explicit bridge duration.
- `node qa/verify-alicti-fields.cjs` — 71 existing contract checks.

The tests make no network requests. `facts-verification.json` lists exact files, source hashes, returned API fields, adopted rules and limits. The new module must load after `alicti-fields.js` and before `report-metrics.js`. These component checks do not claim report UI browser verification or formal workflow completion.
