# Retired compatibility test evidence

These source copies preserve earlier test intent and evidence; they are excluded from the current `qa/check-*.cjs` execution set. They are not runnable acceptance criteria for the current implementation.

Fully retired: `check-local-series-config.cjs` (former 95), `check-local-series-followup.cjs` test portion (former 63), and `check-local-series-config-staleness.cjs` (former 132). Their local preset, local-to-interface conversion and compatibility-specific checks are outside the confirmed current scope. Those numbers describe historical runs only and must not be reported as current passes.

Mixed suites were revised in place to keep current behavior and retire only obsolete preset projection, multiple-series narrowing, lone-store-to-array conversion, historical-interface compatibility sections, old-key upgrades, and missing-version automatic adoption. The original source copies here record those removed branches. Current call-version, dirty-close, generic dependencies, strict arrays, Mapping provenance and normal saved-field history are checked by active suites with explicit current-schema fixtures.

Shared active test infrastructure lives in `qa/fixtures/current-profile.cjs`, `current-generic.cjs` and `current-component-contract.cjs`. None enables a production legacy mode. Count only the actual results from current top-level suites; do not import or execute these archived suites as fixture dependencies.
