/** Dependency-free runner: execute all groups; skips are never passes. */
class SkippedCheck extends Error {}
function createRunner() {
  const checks = [];
  function result(name, error) {
    if (!error) checks.push({ name, status: 'passed' });
    else if (error instanceof SkippedCheck) checks.push({ name, status: 'skipped', reason: error.message });
    else checks.push({ name, status: 'failed', error: error.stack || String(error) });
  }
  return {
    test(name, run) { try { run(); result(name); } catch (error) { result(name, error); } },
    async testAsync(name, run) { try { await run(); result(name); } catch (error) { result(name, error); } },
    skip(reason) { throw new SkippedCheck(reason); },
    report(evidence) {
      const counts = Object.fromEntries(['passed', 'failed', 'skipped'].map(status => [status, checks.filter(check => check.status === status).length]));
      const output = { total: checks.length, ...counts, checks, evidence };
      console.log(JSON.stringify(output, null, 2));
      if (counts.failed) process.exitCode = 1;
      return output;
    }
  };
}
module.exports = { createRunner };
