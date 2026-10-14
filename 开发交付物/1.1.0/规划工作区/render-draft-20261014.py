from pathlib import Path
import json,hashlib,os,datetime,re,shutil
R=Path(__file__).resolve().parents[3];D=R/'开发交付物/1.1.0';W=D/'规划工作区';E=D/'规格讨论稿-20261014'
def load(n):return json.loads((W/n).read_text())
def write(n,t):p=E/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_text('\n'.join(line.rstrip() for line in t.rstrip().splitlines())+'\n')
def dump(n,d):write(n,json.dumps(d,ensure_ascii=False,indent=2))
def link(p,at=E):return os.path.relpath(p,at)
def esc(s):return str(s).replace('|','\\|').replace('\n','<br>')
def table(headers,rows):return '\n'.join(['| '+' | '.join(headers)+' |','| '+' | '.join(['---']*len(headers))+' |']+['| '+' | '.join(esc(c) for c in row)+' |' for row in rows])+'\n'
labels={'id':'标识','name':'名称','title':'主题','description':'说明','feature_ids':'功能','acceptance_ids':'验收','rule_ids':'规则','source_refs':'来源','source_files':'来源文件','steps':'步骤','branches':'分支','trigger':'触发','preconditions':'前提','postconditions':'结果','inputs':'输入','outputs':'输出','fields':'字段','field_ids':'字段引用','states':'状态','permissions':'权限','persistence':'保存','write_when':'保存时机','nullable':'允许为空','default':'默认值','type':'类型','key':'存储语义键','status':'状态','evidence':'证据','source_keys':'来源映射','test_refs':'验证引用','source_page_ids':'原页面','layout':'布局','interactions':'交互','direction':'方向','purpose':'用途','verification_status':'核验状态','documented_endpoint':'文档端点','documented_method':'文档方法','production_route':'生产路由','auth':'鉴权','draft_operation_ids':'独立草案操作','formal_stage_pass':'正式阶段通过','source_page_status':'页面来源状态','local_logic_ids':'局部逻辑引用','fact_status':'事实状态','scope':'范围','method':'方法','route':'路由','behavior':'行为','source_operations':'接口操作','shared_guards':'共同约束','event_contracts':'事件契约','internal_capabilities':'内部能力','acceptance_timing':'验收时点','source_semantic_refs':'语义来源','sequence_message_refs':'时序消息','normal':'正常','loading':'加载','empty':'空态','error':'错误','no_permission':'无权','reason':'原因','condition':'条件','result':'结果','validation_rules':'校验规则','examples':'示例','derivation':'派生规则','lifecycle':'生命周期','required_when':'必填条件','format':'格式','implementation_status':'实现状态','current_status':'当前状态','remaining_gaps':'剩余差异','source':'来源','actual_implementation':'当前已实现部分','remaining_scope':'剩余范围','specification_note':'规格阅读说明','local_prototype_evidence':'局部原型证据','implemented':'已实现','limits':'验证边界','scoped_execution':'局部验证'}
labels.update({'priority':'交付优先级','level':'级别','role':'角色','group_ids':'优先组','primary':'直接范围','dependency':'必要依赖','delivery_priority':'交付优先级','priority_policy':'优先级约定'})
def priority_label(x):
 q=x.get('priority',{});return ('P0 · 必要依赖' if q.get('role')=='dependency' else 'P0 · 最高') if q.get('level')=='P0' else '本轮未调整'
def priority_text(x):
 q=x.get('priority',{});return '**优先级**：'+priority_label(x)+(('。'+q.get('scope','')) if q else '')
def pretty(v,depth=0):
 if isinstance(v,dict):
  s=[]
  for k,x in v.items():
   if k in {'source_files','source_refs','source_keys','source_semantic_refs','sequence_message_refs','evidence_refs'}:
    s.append(f'**{labels.get(k,k)}**：'+esc(', '.join(map(str,x)) if isinstance(x,list) else x))
   elif isinstance(x,(dict,list)):
    s.append(f'**{labels.get(k,k)}**\n\n'+pretty(x,depth+1))
   else:s.append(f'**{labels.get(k,k)}**：'+('待核／未提供' if x is None else esc(x)))
  return '\n\n'.join(s)
 if isinstance(v,list):
  return '\n\n'.join((f'{i+1}. '+esc(x) if not isinstance(x,(dict,list)) else f'#### {x.get("id",i+1)} {x.get("title",x.get("name",""))}\n\n'+pretty(x,depth+1)) for i,x in enumerate(v))
 return esc(v)
s=load('source-draft-20261014.json');p=load('draft-20261014.json');logic=load('logic-draft-20261014.json');ui=load('ui-draft-20261014.json');api=load('interface-draft-20261014.json')
policy=p['priority_policy']
acceptance_count=len(p['acceptance_checks']); draft_operation_count=len(s['draft_operations'])
priority_section='## 本轮最高优先级（P0）\n\n三项并列最高优先级，先安排方案确认、开发与验收。按依赖推进，不把P0理解为已实现或门禁豁免。\n\n'+table(['优先级','范围','必须交付的行为'],[(g['level'],g['title'],g['scope']) for g in policy['groups']])+'\n**实施顺序**\n\n'+'\n'.join(str(i+1)+'. '+x for i,x in enumerate(policy['implementation_order']))+'\n\n'+policy['other_scope']+'\n\n'
E.mkdir(exist_ok=True)
for name,data in [('draft-20261014.json',p),('source-draft-20261014.json',s),('logic-draft-20261014.json',logic),('ui-draft-20261014.json',ui),('interface-draft-20261014.json',api)]:dump(name,data)
changes=[
('接口业务类型','对外导入未明确业务类型','请求级必填businessType，使用验真租户已启用的稳定类型编码；一次一种、逐条保原码，用于名单/详情和对应跟进表单，每次结果/进度及完成回调均携原码。同requestId改类型冲突，已受理原内容重放不新增，后续停用不改历史。'),
('导入客户资料','缺少本次来源门店/车系/Smartcode/留资时间','每行新增六项选填来源字段，原字符串保存；预览、客户/通话详情和拨号/振铃填单显示，留资时间独立于平台时间，完成快照携原值。局部合成实现有新证据，真实接口仍待实现。'),
('业务批次号','外部业务批次与平台内部批次未独立说明','新接口请求必带业务批次号，建议字段businessBatchNo；同应用/租户可分多次导入复用，每条记录保留原值并随回调返回。requestId仍单独防网络重试，手工CSV不新增必填项。'),
('完成沟通回调','已有每次结果/进度回调，未传本次完整业务表单','通话结束、处理结果为已完成沟通且可靠保存后，将本次通话记录及本次已保存客户业务信息快照回调原应用业务系统，携原业务批次号。不是通用已保存状态；已填选填字段与选项的业务编码随快照回传，多选完整；缺码待完善不假报成功。补送不拨号，原结果回调保留。'),
('应用与租户','短暂确认过一对一/共用租户唯一应用','现以最新确认覆盖：多对多关联；DCC、天网等各自应用、凭据和回调地址。'),
('调用身份','多租户取身份方式未形成方案','建议取token时显式tenantId并核实应用关联；token绑定应用和租户，不默认首个租户，不允许请求正文切换身份。正式契约待审。'),
('外呼方式','接口仅按预测外呼编排','接口明确预外呼或人工外呼。预外呼按任务坐席组；人工外呼指定同租户有效坐席工号，先进入待联系，由坐席发起呼叫。'),
('回传范围','只有DCC回传，天网只在平台查看','所有接入应用都回调原业务系统；导入前必须配置该应用回调地址。手工界面无应用来源的记录保持平台内处理。'),
('工作台','表单原先接通后才显示','已局部修复：人工拨号即显示，预外呼坐席振铃可填写；阶段切换保草稿，结束后保存。未接状态选择/独立保存与条件必填已局部核验；预测转人工归属仍待实现。'),
('继续跟进','未确定预测外呼转人工归属','保存后保留待联系；人工沿原坐席，预外呼归当前坐席后续人工跟进。供应商自动重呼与人工跟进排他仍待核实。'),
('失败与秒挂','已有预测范围规则','预测范围继续沿用三类120秒、八类人工、共享首次外2次；秒挂仅结果分类和回调，不补提交。人工外呼不直接套用预测批次/供应商fileId。'),
('手工导入与任务操作','入口重复、任务按钮不一致','已局部修复：唯一导入弹窗、线索类单一编码、选填后置、任务行操作统一、直接导入不打开管理看板。'),
('结果与回传入口','重复通话结果、独立DCC回传页签','已局部修复：运行监控看汇总、通话记录看明细；回传在记录详情。最新全部应用回调尚未在原型完整实现。')]
write('changes.md','# 本版改动\n\n状态：开发交付讨论版。以最新12个故事、104条验收、7个场景为需求依据；旧版本只供追溯。\n\n'+priority_section+table(['内容','此前口径','本版'],changes)+'\n19个FUNC、22个BR、5个PAGE和14个API沿用旧编号，正式S3～S7待重验；本稿补充三个独立草案操作和现有坐席工作台规格，不冒充新增正式编号。详情见[页面与实现状态](ui-spec.md)。\n')
readme='# v1.1.0 开发交付讨论版 · 2026-10-14\n\n**已同步最新确认，供产品与开发评审；当前仍为 DRAFT。** 需求依据为12个故事、104条验收、7个场景。本次SRC-125完成S1／S2增量核验；G1／G2／G3待确认，旧S3～S9需重验。本次更新需求和现有开发讨论包。\n\n## 阅读入口\n\n先看[本版改动](changes.md)，再按[功能与独立操作目录](features/README.md)阅读[业务逻辑](global-logic.md)、[页面与实现差异](ui-spec.md)和[104条验收](acceptance-map.md)。开发评审另看[接口清单](interface-list.md)、[字段规格](field-specs.md)、[局部逻辑](local-logic.md)、[开发补充清单](developer-supplement.md)与[待核问题](open-items.md)。\n\n## 本版约定\n\n- 导入接口请求级必填businessType（业务类型编码），一次一种，取已验真租户当前启用类型；缺失/无效/停用的新请求拒收。逐条保存原码，名单/详情展示原名称并保编码，坐席按原类型表单跟进，回调携原码。同requestId改类型冲突，已受理同内容技术重放不新增，后续停用不改历史；不同类型分次请求可复用businessBatchNo。原手工CSV不增加逐行必填。\n- 应用回调地址已补到新增／修改和详情，列表显示配置状态；本地保存与缺地址导入阻断已局部验证，真实回调仍待实现。\n- 每条线索新增选填的意向门店编码、意向门店名称、意向车系编码、意向车系、Smartcode及留资时间；原值显示在既有预览、客户/通话详情和早填单。留资时间来自业务方，不默认平台导入时间。\n- 新接口导入请求带业务批次号（建议字段businessBatchNo），同应用/租户可复用；每条记录保存原值并在每次回调带回，requestId继续单独防重。该字段不增加到原手工CSV必填列。\n- 通话结束且处理结果为“已完成沟通”并保存成功后，新增完成沟通回调：包含本次通话记录、本次保存的客户业务信息和原业务批次号。已填选填字段及其选项的业务编码也必须回传，多选保留所有选中编码。每次结果/进度回调仍保留；回调失败只补送，不重新拨号。\n- 应用与租户多对多，业务系统分别配置应用凭据及回调地址。建议取身份时显式指定租户、校验关联并绑定token；正式报文待审。\n- 导入指定预外呼或人工外呼。预外呼仍按任务坐席组分配；人工外呼指定有效坐席工号，进入该坐席待联系，不能套用预测任务和批次。\n- 所有接入应用都回调原业务系统，未配置回调地址先拒绝导入。无应用来源的手工界面导入保持平台内处理。\n- 人工拨号后、预外呼坐席振铃时可填跟进草稿，原型已局部验证；未接通通话状态选择、条件必填与独立保存现已局部核验，712为拒接，同码不同描述分别保留；人工记录不覆盖客观通话结果。\n- 继续跟进在成功保存后保留待联系。预外呼转由当前坐席后续人工跟进；供应商自动重呼排他尚待验证，不能仅凭待联系列表就声称可以安全再次拨号。\n- 预测范围继续沿用三类失败确认后120秒自动补提交、八类人工补提交，共享首次之外2次；未知不盲发，秒挂不重呼。\n\n## 实现及验证范围\n\n沿用19个FUNC、22个BR、5个PAGE及14个API历史编号，并按当前需求形成讨论投影；旧编号对应的正式下游分析未重验。本稿另列人工分配、坐席跟进、完成沟通回调三个草案操作和既有工作台草稿页面。14行接口台账、8组源操作不代表14个已经确定并联调的HTTP端点。\n\n原型中直接导入、统一任务操作、回传详情内嵌、通话入口合并以及拨号即填单属于已有局部修复。沿用此前28组定点回归及浏览器未接状态选择/保存/恢复证据；表单阶段切换保留草稿，结束后保存。六项来源资料已做局部合成展示并记录21组定点检查；新增业务批次号和完成沟通回调尚未实现；多对多身份、双方式接口、全部应用回调及预测转人工归属仍待实现；后端与完整表单契约仍待验证。本次businessType在现有预外呼本地合成接收和原界面完成41组定点源码回归、5项语法及名单/详情浏览器核验；完整人工导入接口与真实回调未实现。当前104条CHECK为验收计划，未执行整版测试；见[核验说明](validation-report.md)。\n\n未决保留13项高、9项中、1项低。用户已批准分阶段验收：先审本方工程设计，实现证据开发后、上线前补齐；供应商关键规则、业务系统正式契约及下载可行性仍须先核实。完整责任与依赖见[待核清单](open-items.md)。\n\n## 来源与后续\n\n包内五份draft语义文件与[规划工作区](../规划工作区/draft-20261014.json)同源；[来源摘要](source-manifest.json)区分当前需求增量、此前S1／S2快照、历史下游及原型局部证据。这不是正式reviewed交接，旧config／plan／product-ir不作为本轮实施依据。正式上游获准后沿原链路刷新，再补真实工程仓库、技术栈及产品／工程验证。\n\n[当前需求审阅](../../../需求/1.1.0/分析工作区/outputs/G2集中审阅方案.md) · [唯一原型](../../../prototype/index.html#predictive-tasks)\n'
readme=readme.replace('## 阅读入口',priority_section+'## 阅读入口',1)
write('README.md',readme)
# Preserve current source semantics exactly; split by original feature IDs.
frows=[]
for f in s['features']:
 ids=f['source_acceptance_ids'];localnames=[]
 for l in logic.get('locals',logic.get('local_logic',[])):
  if f['id'] in l.get('feature_ids',[]):localnames.append(l['id'])
 body=f'# {f["id"]} {f["name"]}\n\n状态：沿用旧FUNC编号的当前讨论投影，正式S7待重验；实际实现需查页面差异。\n\n'+priority_text(f)+'\n\n'+f['description']+'\n\n## 操作边界\n\n'+pretty(f['boundary'])+'\n\n## 验收与关联\n\n'+', '.join(ids)+'\n\n[验收正文与步骤](../acceptance-map.md) · [局部逻辑](../local-logic.md) · [字段](../field-specs.md) · [接口](../interface-list.md) · [UI](../ui-spec.md)\n\n'+('逻辑单元：'+', '.join(localnames)+'\n\n' if localnames else '')+'编号历史来源（已失效、待重验）：`需求/1.1.0/分析工作区/memory/feature-list.json#'+f['id']+'`。\n'
 write(f'features/{f["id"]}.md',body);frows.append((f['id'],f'[{f["name"]}]({f["id"]}.md)',priority_label(f),', '.join(ids)))
for f in s['draft_operations']:
 write(f'features/{f["id"]}.md',f'# {f["id"]} {f["name"]}\n\n当前独立操作草案，正式FUNC编号与S7拆分待评审。\n\n'+pretty(f)+'\n\n[验收](../acceptance-map.md) · [局部逻辑](../local-logic.md) · [字段](../field-specs.md) · [页面](../ui-spec.md)\n')
 frows.append((f['id'],f'[{f["name"]}]({f["id"]}.md)',priority_label(f),', '.join(f['source_acceptance_ids'])))
write('features/README.md','# 功能与独立操作目录\n\n19个历史FUNC编号的当前讨论投影，另有3个独立草案操作。正式功能拆分与编号待S7重验；下表不是22项已冻结功能或实现通过声明。\n\n'+priority_section+table(['标识','独立操作','优先级','验收'],sorted(frows,key=lambda row:0 if row[2]=='P0 · 最高' else 1 if row[2]=='P0 · 必要依赖' else 2)))
write('acceptance-map.md','# 验收检查（104条）\n\n以下为本版计划执行的验收步骤；整版执行状态均为未执行。已有局部原型证据另列，不代替供应商/后端验收。预期结果逐字取当前需求验收正文。\n\n'+'\n\n'.join(f'## {c["id"]} / {c["acceptance_ids"][0]}\n\n{priority_text(c)}\n\n**操作**：{c["procedure"]}\n\n**预期**：{c["expected"]}\n\n**执行**：本版未执行整套验收；来源 `{c["source"]}`。'+('\n\n**局部验证**\n\n'+pretty(c['scoped_execution']) if c.get('scoped_execution') else '') for c in p['acceptance_checks']))
write('business-rules.md','# 业务规则讨论投影\n\n沿用22个历史BR编号，按最新S1／S2验收重新表述；正式S3未重验，并非当前已冻结规则原文。坐席振铃、继续跟进、业务批次及完成沟通回调另见全局逻辑草案规则。\n\n'+'\n\n'.join(f'## {r["id"]} {r["name"]}\n\n{r["statement"]}' for r in s['rules']))
# Agent-authored specifications, no inferred business prose by exporter.
print('logic keys',list(logic));print('ui keys',list(ui))
globaldata={k:v for k,v in logic.items() if k not in {'locals','local_logic','fields','source_files','source_manifest','acceptance_checks','validation'}}
write('global-logic.md','# 全局业务逻辑\n\n[22条规则讨论投影](business-rules.md) · [局部逻辑](local-logic.md) · [字段](field-specs.md)\n\n'+pretty(globaldata))
write('local-logic.md','# 独立操作与分支\n\n'+pretty(logic.get('locals',logic.get('local_logic',[]))))
write('field-specs.md','# 字段业务规格\n\n以下为产品语义与保存时点。物理表、索引、生产报文字段类型及接口映射须在真实工程中补齐；候选键不冒充正式协议。\n\n'+pretty(logic.get('fields',[])))
write('ui-spec.md','# 页面、交互与当前原型差异\n\n'+pretty({k:v for k,v in ui.items() if k not in {'source_files'}}))
write('interface-list.md','# 接口与事件清单\n\n业务系统导入客户请看 API-001 / DCC-RST-IMPORT（业务系统 → 呼叫中心）。API-002 / importTaskTel 是呼叫中心 → AliCti 的供应商接口，其参数表不代表业务系统报文。\n\n## 业务系统导入的请求级业务类型\n\n'+table(['字段（拟名）','业务含义','必填','说明'],[(f['key'],f['label'],'是' if f['required'] is True else '否',f['rule']) for f in next(x for x in api['interfaces'] if x['id']=='API-001')['request_fields_schema']])+'\n本表仅突出本次新增的请求级字段；callMode、taskId/agentWorkNo、requestId、businessBatchNo等原条件仍见下方DCC-RST-IMPORT。businessType不放进每行CSV，不替代leadCode。\n\n## 业务系统导入的逐行字段\n\n'+table(['字段（拟名）','业务含义','必填','说明'],[(f['key'],f['label'],'人工外呼必填' if f['required']=='manual_only' else '是' if f['required'] is True else '否',f['rule']) for f in next(x for x in api['interfaces'] if x['id']=='API-001')['row_fields_schema']])+'\n\n14条原台账／8组源操作；内部能力是阅读分组，不代表新增已确认端点。missing／partial及退役状态保持原样；文档有端点不等于本项目已联调。\n\n'+table(['ID','接口','范围','优先级','状态'],[(i['id'],i['name'],i['scope'],priority_label(i),i['verification_status']) for i in api['interfaces']])+'\n'+pretty({k:api[k] for k in ['interface_reading_guide','source_operations','interfaces','internal_capabilities','event_contracts','shared_guards']}))
write('open-items.md','# 待核问题与分阶段验收\n\n13高、9中、1低，状态保持open；ISSUE-024沿004/039证据，不重复新增业务。用户已批准先审本方工程方案、开发后验证实现；未批准风险豁免。\n\n'+'\n\n'.join(f'## {i["id"]} [{i["severity"]}] {i["title"]}\n\n{i["description"]}\n\n'+pretty(i.get('acceptance_plan',{'note':'历史原消息追溯项；不伪造缺失正文。'})) for i in s['open_items']))
write('developer-supplement.md','# 开发接包后补什么\n\n当前是可审阅方案讨论版。尚无正式工程仓库与技术栈，不生成虚构文件路径、实现任务或测试命令。\n\n'+priority_section+'## P0验收与依赖\n\n'+pretty(policy['dependencies'])+'\n## 当前可以组织的设计评审\n\n'+pretty(p['engineering']['design_now'])+'\n\n## 七类工程输入\n\n'+table(['类别','开发方需提供'],[('仓库与脚手架','仓库、分支、当前提交、可重复构建/启动方式；静态原型不能代替后端仓库。'),('技术栈','前后端框架、运行时、版本与团队标准。'),('服务边界','应用身份、接收、调度、供应商适配、事件、回传、下载与授权落点。'),('数据','记录/主子/attempt/预算/结果版本/快照的持久实体、约束、事务和迁移；旧数据未知先隔离核实。'),('接口','本方正式报文与鉴权/错误语义，各接入应用结果版本与ACK协议，AliCti目标版本配置及精确映射。'),('编码规范','团队规则及可定位版本，错误处理、日志脱敏、迁移与兼容规范。'),('验证','承接104条CHECK，填写真实框架/命令和测试环境；补并发/崩溃/未知/权限/删除/下载/回传验证。')])+'\n## 实施前与实施后\n\n供应商关键规则、业务系统正式契约和下载技术可行性先核实；工程原子保存、并发计次及恢复实现证据开发后、上线前补齐。逐项责任和依赖见[待核清单](open-items.md)。局部浏览器保存验证不等同生产后端删除安全性。\n\n## 正式交接\n\n上游当前方案获正式批准后，用真实reviewed交接沿原链路刷新，承接本稿并重审范围、字段、UI及104条验收；补足工程约束后再拆文件级任务。只有标准产品/工程检查及联合语义评审通过才可标READY_FOR_DEVELOPMENT。本次未运行05正式导出；04仅将新范围登记并重验S1/S2，不批准G1/G2/G3或改变02/05门禁。\n')
dump('source-manifest.json',{'status':'DRAFT','source_files':s['files'],'component_files':[{'path':n,'sha256':hashlib.sha256((W/n).read_bytes()).hexdigest()} for n in ['draft-20261014.json','source-draft-20261014.json','logic-draft-20261014.json','ui-draft-20261014.json','interface-draft-20261014.json']]})
print('rendered',E)
