import json,re
from pathlib import Path
P=Path(__file__).resolve().parents[1]
def tr(v):
 if isinstance(v,str):
  for a,b in [('阿里云 CCC','AliCti'),('CCC/RAM','AliCti'),('CCC','AliCti'),('RAM','待确认'),('品牌实例','品牌供应商账号'),('实例','供应商账号'),('Core SDK','CTILink'),('1—10','合法值域待确认'),('1–10','合法值域待确认')]:v=v.replace(a,b)
  return v
 if isinstance(v,list):return [tr(x) for x in v]
 if isinstance(v,dict):return {k:tr(x) for k,x in v.items() if k not in ['implementation_status','implementation_note','implementation_evidence','legacy_refs']}
 return v
old=json.loads((P/'inputs/baseline-reference/planning/page-index.json').read_text());d=tr(old)
for page in d['pages']:
 page['function_ids']=[]
 page['states']=list(dict.fromkeys(page.get('states',[])+['待确认']))
 page['acceptance_points']=[x for x in page.get('acceptance_points',[]) if not re.search('旧.*(文档|接口)|GetLogin|SignIn|PollUser|ListAttempts',str(x))]
 page['acceptance_points'].append('供应商能力以AliCti文档为最终事实；未明确支持的操作显示待确认，不展示调用成功。')
 page['source_refs']=['inputs/user-instructions.md#本轮差异处理确认']
 for action in page.get('actions',[]):action['source_function_ids']=[]
(P/'planning/page-index.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print('页面结构复用',len(d['pages']),'项，无新增页面')
