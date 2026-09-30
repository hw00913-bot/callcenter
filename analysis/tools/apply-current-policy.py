import json,re
from pathlib import Path
P=Path(__file__).resolve().parents[1]
def clean(v):
 if isinstance(v,str):
  repl={
  '在中台开通供应商坐席并保留旧导入规划边界':'在中台开通供应商坐席',
  '在当前租户申请新建坐席；旧RAM导入保持规划边界':'在当前租户申请新建坐席',
  '不提供未经核验的AliCti RAM导入入口':'其他导入能力待确认',
  '原RAM导入保留为旧供应商专有规划，不在AliCti原型假造可执行入口。':'文档未明确支持的导入能力显示待确认。',
  '旧RAM导入的AliCti替代方案须单独核验':'未明确支持的坐席查询和导入能力显示待确认',
  '旧RAM导入仅保留历史规划，不新增AliCti导入承诺':'未明确支持的导入能力显示待确认',
  '旧RAM导入仅保留原规划边界，不构造AliCti支持承诺':'未明确支持的导入能力显示待确认',
  '原RAM导入不当作AliCti能力':'导入能力待确认',
  '按 1—10 级技能等级执行组内优先分配':'按skillLevels数值越小优先级越高执行分配，合法值域待确认',
  '保留现有等级页面；AliCti的skillLevels数值越小优先，现有1—10业务等级与厂商有效范围/路由语义的映射作为待核验条件，不默认原值等价':'AliCti的skillLevels数值越小优先；控件不预设无依据的1—10范围，合法值域显示待确认',
  '保留原等级页面；AliCti有效值与方向映射须核验':'按skillLevels越小优先；合法值域待确认',
  '原等级页面与厂商值域/路由映射待核验':'合法值域待确认',
  '原页面1–10值域映射待核对':'合法值域待确认，不预设取值范围',
  '等级方向和值域单独映射':'数值越小优先；合法值域待确认',
  '原型只模拟候选契约':'接口文档未明确支持时显示待确认，不执行远端动作',
  '不凭旧平台接口推断AliCti启动、恢复或删除行为':'未明确支持的启动、恢复或删除行为显示待确认',
  '缺乏端到端证据的厂商动作是条件化设计，须在S4/G2逐项核验。':'供应商动作以AliCti文档为最终事实；未明确支持的动作显示待确认，不模拟远端成功。',
  '待核验':'待确认',
  }
  for a,b in repl.items():v=v.replace(a,b)
  return v
 if isinstance(v,list):return [clean(x) for x in v]
 if isinstance(v,dict):return {k:clean(x) for k,x in v.items() if k not in ['legacy_refs','historical_verification_status']}
 return v
for rel in ['memory/normalized-user-stories.json','scenarios/scenario-index.json','memory/business-rules.json','memory/project-facts.json','interfaces/interface-index.json']+['scenarios/'+x.name for x in (P/'scenarios').glob('SC-*.json')]:
 f=P/rel
 if f.exists():f.write_text(json.dumps(clean(json.loads(f.read_text())),ensure_ascii=False,indent=2)+'\n')
issues=json.loads((P/'runtime/open-items.json').read_text())
for x in issues['items']:
 x['status']='accepted_risk';x['resolution']='用户本轮确认：新接口文档为最终事实，未支持展示待确认；本项仅接受在模拟原型中保留待确认状态，不接受生产风险，不代表实测解决。';x['accepted_by']='当前用户';x['decision_ref']='inputs/user-instructions.md#本轮差异处理确认'
(P/'runtime/open-items.json').write_text(json.dumps(issues,ensure_ascii=False,indent=2)+'\n')
(P/'runtime/current-policy-decision.md').write_text('''# 当前差异处理决定\n\n用户已确认：以AliCti接口文档为最终事实，未明确支持的能力显示“待确认”；本期展示不保留旧接口关联规则。26场景范围和页面复用原则不变。\n\n技能等级按skillLevels小值优先，范围待确认；坐席创建按cno/name/areaCode；未支持的导入不保留旧入口说明。资源创建/删除、号码发布绑定、任务启动恢复等缺口不画为已成功调用。已文档化的任务创建、导入、暂停、结束分别依照参数执行，生产在途语义仍待确认。\n\n旧材料仅留输入快照供审计，不作为本期接口事实或展示说明。未决项accepted_risk只表示同意以“待确认”形式交付模拟原型，不表示生产验证通过。\n''')
