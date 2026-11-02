"""Project original native contacts without running their cache write/sync timers."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def one(code, old, new):
    if code.count(old) != 1:
        raise ValueError('Customer profile native source anchor changed: ' + old[:100])
    return code.replace(old, new, 1)


def transform(kind, path, code):
    if kind != 'cloud':
        return code
    if path == 'js/components/call-data-sync.js':
        code = one(code, '  function restore(row) {', '''  function hydrateSnapshot(row) {
    let projected;
    try { projected = clone(row); }
    catch (_) { return {ok:false,call:null,message:'原通话资料无法可靠投影。'}; }
    if (!projected?.callId || !projected.tenantId || !projected.enterpriseId) return {ok:false,call:projected,message:'原通话身份尚未完整。'};
    if (!allowed(projected)) return {ok:true,call:projected,applicable:false};
    try {
      const entry = stored(projected);
      if (entry) apply(projected, entry);
      return {ok:true,call:projected};
    } catch (_) {
      return {ok:false,call:projected,message:'已存话单同步资料暂无法可靠读取，原记录保留待核。'};
    }
  }
  function restore(row) {''')
        return one(code, '  root.CloudCallSync = Object.freeze({ read, restore, begin, refresh, demo, summary });',
                   '  root.CloudCallSync = Object.freeze({ read, restore, hydrateSnapshot, begin, refresh, demo, summary });')
    if path != 'js/components/customer-directory.js':
        return code
    code = one(code, '  function sync() {\n    if (syncing) return CloudCallData.calls || [];',
               '  function sync(options = {}) {\n    const readOnly = options?.readOnly === true;\n    if (syncing) return readOnly ? clone(CloudCallData.calls || []) : CloudCallData.calls || [];')
    code = one(code, '      calls.forEach(row => window.CloudCallSync?.restore(row));',
               '''      // Read persisted telephone facts without starting timers or advancing receipts.
      if (readOnly) return calls.map(row => {
        const result = window.CloudCallSync?.hydrateSnapshot?.(row);
        const projected = result?.call || clone(row);
        if (!result || result.ok !== true) {
          projected.profileSyncIssue = result?.message || '已存话单同步的只读投影暂不可用，原记录保留待核。';
          projected.durationSeconds = null;
          storageIssue = projected.profileSyncIssue;
        }
        return projected;
      });
      calls.forEach(row => window.CloudCallSync?.restore(row));''')
    code = one(code, '  function list() {\n    sync();', '  function list(options = {}) {\n    const snapshotCalls = sync(options);')
    code = one(code, '    for (const call of AppState.scoped(CloudCallData.calls)) {',
               '    for (const call of AppState.scoped(options?.readOnly === true ? snapshotCalls : CloudCallData.calls)) {')
    code = one(code, '  window.CustomerDirectory = { sync, list, calls, find, open, normalizePhone, duration, result, dispositionLabel, provenance, phoneOf, at,',
               '''  function readSnapshot() {
    const prior = {storageIssue,conflicts,readFailures};
    try {
      const customers = list({readOnly:true});
      for (const customer of customers) for (const call of customer.calls || []) {
        call.profileResultLabel = call.profileSyncIssue ? '最新话单资料待核' : result(call);
        call.profileDispositionLabel = dispositionLabel(call);
        const facts = window.CallState?.view(call);
        call.profileActualDialed = typeof call.dialed === 'boolean' ? call.dialed : call.actualDialed === true || facts?.answered === true || call.directoryMeta?.ledgerResult === true && call.directoryMeta.customerAnswered === true ? true : null;
      }
      const issues = [storageIssue, conflicts.length ? '部分原联系标识有冲突，未强行归并。' : ''].filter(Boolean);
      return {status:issues.length?'partial':'success',data:{customers:clone(customers),issues}};
    } catch(error) {
      return {status:'failed',message:error.message||'原联系来源暂无法可靠读取，原记录未改动。',data:{customers:[],issues:[]}};
    } finally {
      storageIssue=prior.storageIssue;conflicts=prior.conflicts;readFailures=prior.readFailures;
    }
  }
  window.CustomerDirectory = { sync, list, calls, find, open, readSnapshot, normalizePhone, duration, result, dispositionLabel, provenance, phoneOf, at,''')
    return code


def model_source():
    return (ROOT / 'js/components/customer-profile.js').read_text()


def runtime_source():
    return (ROOT / 'js/adapters/customer-profile-workspace.js').read_text()


def style_source():
    return (ROOT / 'js/adapters/customer-profile-workspace.css').read_text()
