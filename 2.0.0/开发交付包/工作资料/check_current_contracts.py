"""Focused semantic guard for the audited current ELSE and AI-import contracts."""
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parent
from implementation_tasks import OUT
read=lambda p:json.loads(Path(p).read_text())
plan=read(ROOT/'规划工作区/plan.json');ir=read(ROOT/'规划工作区/product-ir.json');errors=[];checked=[]
def check(name,ok):
 checked.append({'name':name,'passed':bool(ok)})
 if not ok:errors.append(name)
f=next(f for f in plan['logic']['fields'] if f['id']=='FIELD-FLOW-BRANCH-KIND');a=next(a for a in ir['acceptance'] if a['id']=='AC-2124')
check('branch validation, lifecycle and derivation require unique terminal ELSE',all('末位ELSE' in t for t in [*f['validation_rules'],f['lifecycle'][-1]['behavior'],f['derivation']['rule']]))
check('AC-2124 and AC-2139 agree on mandatory ELSE',all('末位ELSE' in next(a['statement'] for a in ir['acceptance'] if a['id']==id) for id in ['AC-2124','AC-2139']))
blocked=['默认可选','默认路径可选','无默认也可合法','单条件路径合法','普通默认可选且']
def active(v):
 if isinstance(v,dict):return {k:active(x) for k,x in v.items() if k not in ['history','previous_source_records','source_evidence','raw','old']}
 if isinstance(v,list):return [active(x) for x in v]
 return v
for path in ['fragments/business.json','fragments/ui.json','fragments/ui-page-facts.json','规划工作区/plan.json','规划工作区/product-ir.json','续接输入/docs/field-alignment.json','续接输入/docs/functional-spec.json','续接输入/documentation/input/pages.json']:
 text=json.dumps(active(read(ROOT/path)),ensure_ascii=False);check('no replaced optional ELSE rule: '+path,not any(x in text for x in blocked))
l=next(l for l in plan['logic']['locals'] if l['id']=='LOCAL-PLAT-AI-LIST-IMPORT');text=json.dumps(l,ensure_ascii=False)
check('AI import explicitly waits without Cloud grants, preserves unknown and checks async invalidation',all(x in text for x in ['AI-only','只读','异步','台账未知','原始联系号码','实际操作人']))
check('stable current coverage retained',len(plan['logic']['fields'])==405 and len(plan['logic']['locals'])==162 and len(ir['acceptance'])==146 and len(plan['tasks'])==56)
if '--package' in sys.argv:
 for rel in ['tasks/TASK-023.md','field-specs.md','acceptance-map.md','ui-spec.md']:
  text=(OUT/rel).read_text();check('export active ELSE rule consistent: '+rel,not any(x in text for x in blocked))
 text=(OUT/'README.md').read_text();check('draft content review distinct from formal semantic handoff gate','DRAFT未声明正式语义交接门禁通过' in text and '草稿，未声明语义门禁通过 | PM' not in text)
 text=(OUT/'开发工程绑定清单.md').read_text();check('binding list uses current counts','405字段' in text and '162项CHECK' in text and '404字段' not in text and '161CHECK' not in text)
 check('export remains unapproved draft',read(OUT/'manifest.json')['status']=='draft' and not read(OUT/'handoff-gates.json')['formal_development_ready'])
result={'schema':'audited-current-contract-check@1','passed':not errors,'errors':errors,'checks':checked};dest=ROOT/'交接检查/current-contracts.json';dest.parent.mkdir(exist_ok=True);dest.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'passed':not errors,'checks':len(checked),'errors':errors},ensure_ascii=False));sys.exit(bool(errors))
