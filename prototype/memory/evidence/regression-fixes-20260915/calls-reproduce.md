# Calls regression evidence

Run from `/private/tmp` using an isolated `playwright-cli -s=fix-calls` session. Open the preview shown in `calls-verification.json`. Do not reuse a user browser session. The scripts operate fictional local data only.

1. Clear only the isolated session localStorage/sessionStorage and reload to the login screen. Run `calls-workbench-browser.js` through `playwright-cli run-code`. It logs in and selects the demo operator, verifies login errors, then injects individual browser-storage write failures and retries the same call.
2. Run `calls-recovery-browser.js` next. The runner yields on each beforeunload dialog; accept the dialogs to let reload continue. Read `JSON.parse(sessionStorage.getItem("fix-calls-recovery-result"))` afterwards and require `complete === true` and all seven checks. The script stores partial progress so a yield or unfinished run is not mistaken for a pass.
3. Run `calls-final-browser.js`. This verifies a one-shot noncritical directory refresh failure after persistence, then reloads and observes script/network errors.
4. Reset only the isolated test session and rerun `calls-workbench-browser.js`, then `calls-pages-browser.js` to verify clean fixture anomaly attempts, audit allowed/denied access, expired recording filtering, call conflict details and inbound human metrics.
5. Close the isolated session.

State regression command: `node qa/verify-call-regression-fixes.cjs` from the prototype directory. Fixture command: `node qa/verify-demo-fixtures.cjs`.

The saved result JSON files contain the actual successful assertions. `calls-*-runner.txt` retains CLI evidence. Beforeunload runner yields are not successful assertions. Browser scripts are evidence support only; they do not advance workflow stages.
