"""Current-only audit corrections; preserves stable product IDs and archives replaced clauses."""
from pathlib import Path
import copy,json
ROOT=Path(__file__).resolve().parent
VERSION='audit-20261030-step40'
MANDATORY='当前新方案所有有出口节点必须有且仅有一个末位ELSE，前序IF/ELSEIF按优先级首命中；ELSE不带条件，未知事实继续PENDING且不得进入后续或兜底。'
REPLACEMENTS={
 '普通节点默认可选且唯一末位，START必须有唯一末位默认路径。':'所有有出口节点必须有且仅有一个末位ELSE；未知不能进入后序或ELSE。',
 '条件从上到下只取第一条命中；普通节点默认可选、唯一且末位，未命中停留，未知不越过。':'条件从上到下首命中，所有有出口节点须唯一末位ELSE，前序条件明确不匹配才兜底，未知不越过。',
 '严格实际执行／结果归档后判断；默认可选，未知或冲突不推进；操作者明确确认后进入唯一合法节点。':'严格实际执行／结果归档后判断；当前方案必须唯一末位ELSE，未知或冲突不推进；操作者明确确认后进入唯一合法节点。',
 'START必有唯一末位默认，普通节点默认可选且唯一末位；未知不越过后续/默认，已知未命中停留。':'所有有出口节点须唯一末位ELSE；未知保留当前节点/归属且不越过后续/ELSE，前序条件明确均不匹配才进入ELSE。',
 '普通CALL/TRANSFER默认路径可选；有默认则最多一条且末尾，不带规则；单条件路径合法':MANDATORY,
 '单条有条件出口为IF，无默认也可合法。':'单一无条件出口为ELSE；单条条件IF后仍有唯一末位ELSE。',
 '首条条件IF、后续ELSEIF，显式默认ELSE；新单连线初始为默认可改条件':'前序条件依序IF/ELSEIF，唯一末位ELSE为其他情况；只有一条出口时必须为无条件ELSE。',
 '从上到下首命中，未知阻后续；普通默认可选且唯一末位，START唯一默认必需':MANDATORY,
 '路径按优先顺序只选首个命中；任何依赖事实待核都阻后续及默认，已知均不匹配留原节点/owner。普通默认可选且唯一末位，开始必有明确默认；不存在多路径人工任选。':'路径按优先顺序只选首个命中；任何依赖事实待核都阻后续及ELSE，保留原节点/owner。所有有出口节点必须唯一末位ELSE，前序条件明确均不匹配才用ELSE；单一出口为ELSE，不存在多路径人工任选。'
}
def current(v):
 if isinstance(v,dict):return {k:(x if k in ['history','previous_source_records','source_evidence','raw','old'] else current(x)) for k,x in v.items()}
 if isinstance(v,list):return [current(x) for x in v]
 if isinstance(v,str):
  for a,b in REPLACEMENTS.items():v=v.replace(a,b)
 return v

def apply(b,p,u,pf):
 if b.get('audit_corrections')!=VERSION:
  archived={'schema':'superseded-else-clauses@1','status':'historical_only_not_current_requirement','superseded_by':'CHG-031-ELSE / AC-2139 / step-40','field':copy.deepcopy(next(f for f in b['fields'] if f['id']=='FIELD-FLOW-BRANCH-KIND')),'acceptance':copy.deepcopy(next(a for a in b['acceptance_updates'] if a['id']=='AC-2124'))}
  path=ROOT/'续接记录/ELSE-被替代口径.json'
  if not path.exists():path.write_text(json.dumps(archived,ensure_ascii=False,indent=2)+'\n')
 b,p,u,pf=[current(x) for x in [b,p,u,pf]]
 f=next(f for f in b['fields'] if f['id']=='FIELD-FLOW-BRANCH-KIND');f['validation_rules']=[MANDATORY];f['examples']['invalid']=['缺ELSE、两个ELSE、ELSE后仍有条件或单条IF无兜底，拒绝保存和新运行准入。']
 for item in b['supersessions']:
  if item['id']=='SUP-FLOW-ROUTES':item.update(old='被步骤31替代的普通默认可选规则；原记录仅用于追溯',current=MANDATORY,evidence_refs=['docs/exception-definitions.json#CHG-031-ELSE'])
 l=next(l for l in p['locals'] if l['id']=='LOCAL-PLAT-AI-LIST-IMPORT')
 l['steps'][0]['action']='只读查看任务概览不物化默认意向配置；按当前场景读取字段/参数并校验文件映射、号码与重复；只有打开配置编辑才建立可取消草稿'
 l['steps'][1]['action']='显式准备并等待本租户共享联系只读模型，再逐号码核对公共禁呼、专业/业务占用、间隔及当日频控；AI-only成员不依赖Cloud页面或Cloud授权，不增加Cloud权利；模型/台账未知保持待核'
 l['steps'][2]['action']='异步完成后重核账号、租户、任务、AI配置修订、文件及同一导入窗口；失效不得提交，失败保文件并允许明确重试；成功保存准确任务/批次、原始联系号码及实际操作人；列表仍脱敏，原始号码用于共享占用，不宣称供应商已拨打'
 l['branches'][1]['condition']='无权/字段不合法/对象失效/修订冲突，或等待期间撤权、换账号/租户/任务、文件/窗口失效'
 l['branches'][2]['result']='共享模型超时/联系事实或台账未知不放行，保原文件可重试且不清理台账；提交结果未知按同请求核对，不重复提交或假报成功'
 c=next(c for c in p['checks'] if c['id']=='CHECK-PLAT-AI-LIST-IMPORT')
 if c.get('audit_revision')!=VERSION:
  c['history']={'pre_audit_check':copy.deepcopy(c)}
  c['procedure']+='；以仅授权AI的总部/门店管理员及运营冷启动后直接导入完整号码，测试共享模型等待、公共限制、活动占用和联系频控；在等待时撤权/换账号租户/修改AI修订/关闭换文件，及损坏/缺失已初始化台账、读取失败后同文件重试。'
  c['expected']+='；正常AI-only导入成功且未获Cloud权限；所有限制仍拒绝，未知不放行、不清台账，过期异步结果不写入；可可靠重试，失败保原文件。'
  c['audit_revision']=VERSION
 for a in b['acceptance_updates']:
  if a['id']=='AC-2088':a['statement']='OTHER跨租户转交不允许门店直接转另一门店或转当前负责租户；CURRENT本租户路径是内部节点继续，保持owner、run与租户阶段，按AC-2145执行。'
  if a['id']=='AC-2136':a['statement']=a['statement'].replace('独立END结论','END后续动作（CLOSE或DIRECT_FOLLOWUP）')
 b['audit_corrections']=VERSION;p['audit_corrections']=VERSION
 return b,p,u,pf
