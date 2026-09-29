"""Run the explicit portable prototype checks; no provider calls or installs."""
from pathlib import Path
import subprocess, json, sys
ROOT=Path(__file__).resolve().parents[1]
NAMES=['skill-group-management', 'alicti-fields', 'alicti-retry', 'alicti-ivr', 'alicti-task-control', 'demo-fixtures', 'regression-fields', 'call-regression-fixes', 'task-attachment-transaction', 'alicti-report-facts', 'lead-report', 'alicti-report-summary', 'customer-followup-version', 'alicti-receiving', 'repeat-predictive', 'repeat-task-workspace', 'storage-compaction', 'alicti-number-import', 'alicti-accounts', 'alicti-account-context', 'incall-followup', 'alicti-queue-contracts', 'alicti-queues', 'queue-config', 'predictive-strategy', 'task-time-conditions', 'seat-operations', 'seat-phone-config', 'tenant-call-monitor', 'tenant-supervisor-migration', 'supervisor-management', 'supervisor-workbench', 'number-resource-rules', 'number-tenant-scope', 'queue-catalog', 'queue-detail', 'queue-management', 'queue-multi-skills', 'outbound-groups', 'task-direct-import', 'delivery-navigation', 'seat-recreation', 'seat-batch-clarification', 'seat-reconnect', 'seat-reconnect-workbench', 'seat-cno-report', 'predictive-recognition', 'inbound-recognition', 'extension-management']
NAMES.extend(['time-conditions', 'business-custom-fields', 'seat-optional-skills', 'phone-toolbar-actions', 'working-mode'])
NAMES.extend(['task-caller-settings', 'caller-navigation-simulation', 'alicti-task-settings', 'task-detail-alignment', 'task-list-export'])
NAMES.extend(['alicti-task-update-fields', 'alicti-task-update', 'task-edit-ui'])
NAMES.append('task-availability')
NAMES.append('task-wizard-backdrop')
# Node on this macOS arm64 host can terminate VM-heavy suites with SIGSEGV
# before printing any assertion results (seen with extension management,
# time conditions, and repeat predictive on v24). Run those suites with JIT disabled; do not retry
# failed assertions. Preserve flags and runtime in every result for review.
NODE_VERSION=subprocess.run(['node','--version'],text=True,capture_output=True,check=True).stdout.strip()
NODE_FLAGS={'extension-management':['--jitless'], 'time-conditions':['--jitless'], 'repeat-predictive':['--jitless']}
results=[]
for name in NAMES:
    flags=NODE_FLAGS.get(name,[])
    p=subprocess.run(['node',*flags,str(ROOT/'qa'/('verify-'+name+'.cjs'))],cwd=ROOT,text=True,capture_output=True)
    results.append({'suite':name,'nodeVersion':NODE_VERSION,'nodeFlags':flags,'exitCode':p.returncode,'output':p.stdout.strip(),'error':p.stderr.strip()})
print(json.dumps({'scope':'local_prototype_not_supplier_integration','suites':len(results),'failed':sum(r['exitCode']!=0 for r in results),'results':results},ensure_ascii=False,indent=2))
sys.exit(any(r['exitCode']!=0 for r in results))
