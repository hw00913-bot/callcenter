"""Focused guards for current ELSE, AI-import and explicit execution arrangements."""
from pathlib import Path
import argparse,json,re,sys
ROOT=Path(__file__).resolve().parent
from implementation_tasks import OUT
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--package',action='store_true');parser.add_argument('--out',type=Path,default=OUT);options=parser.parse_args();OUT=options.out
read=lambda p:json.loads(Path(p).read_text())
plan=read(ROOT/'规划工作区/plan.json');ir=read(ROOT/'规划工作区/product-ir.json');errors=[];checked=[]
business=read(ROOT/'fragments/business.json');platform=read(ROOT/'fragments/platform.json')
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
def current_global_summary_assertions(global_logic):
 """Check rendered global facts, including opposite legacy clauses, not a tag."""
 overview=global_logic.get('overview');shared=global_logic.get('shared_state_rules')
 valid=isinstance(overview,str) and bool(overview.strip()) and isinstance(shared,list) and bool(shared) and all(isinstance(row,str) and row.strip() for row in shared)
 texts=[overview,'\n'.join(shared)] if valid else []
 def both(clauses):return valid and all(all(clause in text for clause in clauses) for text in texts)
 # These are the old unqualified normative sentences. Merely appending the
 # correct new paragraph must not let any of them remain in the current summary.
 obsolete=[
  'END明确CLOSE或DIRECT_FOLLOWUP',
  '导入整批明确DIRECT/TEMPLATE',
  '普通DIRECT/直接完成和再次跟进、启用流程仍按现行资格',
  '仅TEMPLATE在正式导入/再次办理或DIRECT显式启用流程时创建run',
  '原ADMIN+customer.import、模块/任务/来源及分类DIRECT准入固定当前task/scene',
  '三入口业务IMPORT定义唯一：系统code/姓名/号码及分类必填',
  '预外呼明确本次分类',
  'resume任何新cycle重核当前分类允许',
 ]
 compact=[''.join(text.split()) for text in texts]
 return [
  ('actual global overview and shared state fix TASK DIRECT versus CATEGORY TEMPLATE by entry',both(['准确AI/预外呼任务入口固定TASK/DIRECT','业务分类入口固定CATEGORY/TEMPLATE'])),
  ('actual global summary fixes new END CLOSE and scopes old captured exceptions',both(['当前新建/修改模板的END固定正常结束CLOSE','已运行历史按原捕获方案和原合法来源收尾','不借旧END来源授权当前新周期'])),
  ('actual global summary forbids TASK template enablement while retaining only old no-TASK conversion',both(['新TASK/DIRECT始终直接跟进，不显示启用流程','旧无TASK来源DIRECT仅保原合法转换能力'])),
  ('actual global summary removes central mode selection and category direct switches',both(['没有中央模式选择、分类允许直接跟进开关或AI第三种FLOW来源','TEMPLATE失败不降级'])),
  ('actual global summary contains no opposite unqualified legacy mode END or admission clauses',valid and not any(''.join(clause.split()) in text for text in compact for clause in obsolete)),
 ]
for name,ok in current_global_summary_assertions(plan['logic']['global']):check(name,ok)
for path in ['fragments/business.json','fragments/ui.json','fragments/ui-page-facts.json','规划工作区/plan.json','规划工作区/product-ir.json','续接输入/docs/field-alignment.json','续接输入/docs/functional-spec.json','续接输入/documentation/input/pages.json']:
 text=json.dumps(active(read(ROOT/path)),ensure_ascii=False);check('no replaced optional ELSE rule: '+path,not any(x in text for x in blocked))
l=next(l for l in plan['logic']['locals'] if l['id']=='LOCAL-PLAT-AI-LIST-IMPORT');text=json.dumps(l,ensure_ascii=False)
check('AI import explicitly waits without Cloud grants, preserves unknown and checks async invalidation',all(x in text for x in ['AI-only','只读','异步','台账未知','原始联系号码','实际操作人']))
def ids(rows):return [row['id'] for row in rows]
source_fields=ids(business['fields']+platform['fields']);source_locals=ids(business['locals']+platform['locals']);source_checks=ids(business['checks']+platform['checks'])
check('Step48-54 current identities match authored definitions and retained task IDs',
      all(len(values)==len(set(values)) for values in [source_fields,source_locals,source_checks])
      and set(ids(plan['logic']['fields']))==set(source_fields) and set(ids(plan['logic']['locals']))==set(source_locals)
      and set(ids(plan['acceptance_checks']))==set(source_checks)
      and set(ids(ir['acceptance']))==set(a for feature in ir['features'] for a in feature['acceptance_ids'])
      and set(ids(plan['tasks']))=={f'TASK-{number:03}' for number in range(1,57)})
fields={f['id']:f for f in plan['logic']['fields']}
priority=fields['FIELD-FLOW-EXECUTION-PRIORITY']
check('five execution levels default to middle',priority['default']['value']==3 and all(v in priority['format'] for v in ['5最高','4高','3中','2低','1最低']))
check('new target and queue facts have explicit identities',all(k in fields for k in ['FIELD-FLOW-EXECUTION-RESOURCE','FIELD-FLOW-EXECUTION-QUEUED-AT','FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE','FIELD-FLOW-NODE-EXECUTION-PRIORITY','FIELD-FLOW-NODE-EXECUTION-DEFAULTS']))
assign=next(l for l in plan['logic']['locals'] if l['id']=='LOCAL-FLOW-ASSIGN')
text=json.dumps(assign,ensure_ascii=False)
check('both-mode assignment includes method-specific target and five levels',all(s in text for s in ['DIRECT','TEMPLATE','SPECIFIC_SEAT','PRED只任务','AI任务+scene','五档']))
check('obsolete current person-only assignment removed',not any(s in json.dumps(active({'logic':plan['logic'],'ui':plan['ui']}),ensure_ascii=False) for s in ['不选择坐席/任务','不直接绑定坐席或任务','导入分配不提供底层任务/资源选择','不新增坐席/任务/线路选择']))
contact=next(r for r in plan['logic']['global']['invariants'] if r['id']=='GR-CONTACT')['statement']
check('same-number and same-resource coordination use one total order','统一总序' in contact and '不参与新执行排序' in contact and not any(s in json.dumps(active(plan['logic']),ensure_ascii=False) for s in ['同档再沿原分类联系优先级','同档保原分类联系优先级']))
mode=fields['FIELD-FLOW-MANUAL-ASSIGNMENT-MODE'];node_mode=fields['FIELD-FLOW-NODE-MANUAL-ASSIGNMENT-MODE']
check('manual assignment defaults to deferred seat allocation',mode['default']['value']=='MANUAL' and node_mode['default']['value']=='MANUAL' and all(s in mode['format'] for s in ['MANUAL','SPECIFIC_SEAT']) and '可先' in mode['default']['rule'])
check('assignment no longer requires independent follower','FIELD-FLOW-FOLLOWER' not in assign['inputs'] and '不选择独立责任人' in json.dumps(assign,ensure_ascii=False))
current_pages=[p for p in plan['ui']['pages'] if p['id'] in ['UI-PAGE-2204','UI-PAGE-2228']]
check('template and import have no independent person picker',all(f['component_id']=='UI-COMP-READONLY' for p in current_pages for f in p['fields'] if f['field_id'] in ['FIELD-FLOW-FOLLOWER','FIELD-PLAT-FOLLOWER']))
new_ids=['FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY','FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS','FIELD-FLOW-TASK-IMPORT-SOURCE','FIELD-FLOW-TASK-IMPORT-PARAMETERS','FIELD-PLAT-TASK-BUSINESS-RECORD-ID']
check('unified task import has exact mapping/source/row-snapshot identities',all(k in fields for k in new_ids) and fields[new_ids[2]]['key']=='taskImportSource' and fields[new_ids[3]]['key']=='taskImportParameterSnapshot')
check('professional task business record link is only a projection',fields[new_ids[4]]['key']=='recordId' and fields[new_ids[4]]['persistence']['kind']=='transient' and '不落第二份专业业务行' in fields[new_ids[4]]['persistence']['write_when'])
ai=next(l for l in plan['logic']['locals'] if l['id']=='LOCAL-PLAT-AI-LIST-IMPORT');pred=next(l for l in plan['logic']['locals'] if l['id']=='LOCAL-PLAT-CLOUD-TASK-IMPORT');task_text=json.dumps([ai,pred],ensure_ascii=False)
check('task entries enforce current authorization and a single business ledger',all(s in task_text for s in ['ADMIN','customer.import','DIRECT','IMPORT','code','FOLLOWUP','不持久第二份专业业务行','原生','供应商']))
check('AI mappings reference IMPORT definitions without a second business schema',fields[new_ids[1]]['key']=='importFieldMappings' and all(s in json.dumps(fields[new_ids[1]],ensure_ascii=False) for s in ['fieldId','parameter','FOLLOWUP','固定','不自由复制']))
check('professional capacity follows exact target and never truncates',all(s in task_text for s in ['context.importLimits','100行','150000行','2000行','16MB','1MB','不截断']))
check('initial import snapshot does not promise persisted source columns or UI mapping',fields['FIELD-FLOW-IMPORT-MAPPING']['persistence']['kind']=='transient' and '列原文/UI映射' not in fields['FIELD-FLOW-IMPORT-ORIGINAL']['format'] and 'originalImportSnapshot.taskImportParameterSnapshot' in json.dumps(fields[new_ids[3]],ensure_ascii=False))
check('AI-only imports use narrow shared service without Cloud authorization',all(s in json.dumps(ai,ensure_ascii=False) for s in ['精确账号/tenant/task','schema只读','不持久授Cloudcap','配置/起呼','恢复原访问']))
mapping=fields['FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS'];mapping_text=json.dumps(mapping,ensure_ascii=False)
check('AI provider-scene schema2 supports references and dedicated columns',all(s in mapping_text for s in ['schema=2','IMPORT_FIELD','CUSTOM_COLUMN','scene/platform','不同parameter','text/number/date','不增加固定值']))
params=json.dumps(fields['FIELD-FLOW-TASK-IMPORT-PARAMETERS'],ensure_ascii=False)
check('supplier definitions and values are isolated from business fields',all(s in params for s in ['customFields','customValues','record.fields永不混','SUPPLIER_PARAMETER','AI_CUSTOM','originalImportSnapshot.taskImportParameterSnapshot']))
check('scene platform identity is system bound and rechecked',all(s in mapping_text for s in ['系统写importFieldPlatform','不等当前platform时拒绝','name/customerName/calleeNo/remark','fixed/system']))
check('supplier required constraints affect import context without changing category',all(s in params for s in ['businessFields.required','businessRequired','不改字段库','下划线也转义','旧opaque key快照不回写']))
scene=next(l for l in plan['logic']['locals'] if l['id']=='LOCAL-PLAT-AI-SCENE-SAVE')
scene_text=json.dumps(scene,ensure_ascii=False)
check('AI selection and configuration dialogs preserve parent save boundary',all(s in scene_text for s in ['主场景保留原字段表','弹窗独立草稿','确认合法才更新父草稿','取消/关闭无副作用','主场景明确保存','切平台']))
scene_page=next(p for p in plan['ui']['pages'] if p['id']=='UI-PAGE-2110')
check('AI single add entry and online manual dialog preserve existing model',next(v for v in scene_page['fields'] if v['field_id']==mapping['id'])['component_id']=='UI-COMP-DIALOG' and all(s in json.dumps(scene_page,ensure_ascii=False) for s in ['唯一新增入口','添加字段','选择导入字段','手工添加供应商字段','添加场景信息','业务信息只读','场景传入信息','字段名称','参数名','必填/选填radio','取消/确定','类型次要行','不展开全部分类候选']))
check('legacy provider definitions upgrade only on explicit scene save',all(s in mapping_text for s in ['旧schema=1只读兼容','legacy-custom-','父场景明确保存升级schema=2','取消不改旧配置']))
life_ids=['FIELD-FLOW-MISSING-CONTENT-CONFIRM','FIELD-FLOW-ABANDON-CONFIRMATION','FIELD-FLOW-ABANDONMENT-SETTLEMENT','FIELD-FLOW-ABANDON-TENANT']
check('controlled missing-content input and evidence have precise lifetimes',all(k in fields for k in life_ids) and fields[life_ids[0]]['default']['value'] is False and fields[life_ids[1]]['persistence']['kind']=='transient' and fields[life_ids[2]]['key']=='abandonmentSettlement' and fields[life_ids[2]]['persistence']['kind']=='stored' and fields[life_ids[3]]['key']=='abandonTenantId')
history=next(l for l in plan['logic']['locals'] if l['id']=='LOCAL-FLOW-ABANDONED-SETTLEMENT')
check('historical abandoned settlement is not gated by current TEMPLATE mode',any('不要求当前handlingMode=TEMPLATE' in v for v in history['preconditions']) and all(s in json.dumps(history,ensure_ascii=False) for s in ['当前负责租户ADMIN','本tenant','confirmationFingerprint','expectedRevision','当前run/direct/exec/arrangement/字段不变']))
resume=next(l for l in plan['logic']['locals'] if l['id']=='LOCAL-FLOW-RESUME-DIRECT')
check('TASK cycles and legacy END exceptions have distinct current admission',not any('END-ORIGIN' in z['id'] for z in resume['branches']) and all(s in resume['steps'][0]['action'] for s in ['TASK来源','当前准确任务/场景/分类','不依赖已移除旧allowDirect标志','旧无TASK历史','历史例外']))
serial=next(r for r in plan['logic']['global']['invariants'] if r['id']=='GR-SERIAL')['statement']
check('normal archive and controlled abandonment settlement are distinct',all(s in serial for s in ['正常','受控废弃结清','不伪造archive/completed','不要求其变正常archived=true']))
facts=next(l for l in plan['logic']['locals'] if l['id']=='LOCAL-FLOW-CALL-FACTS')
check('stopping accepted facts remain separate from new dispatch',all(s in json.dumps(facts,ensure_ascii=False) for s in ['新派发准入与入站事实分开','ACTIVE/ABANDONING','准确seg/attempt','原ID','不提前释放','EXECUTION_CLOSED']))
abandon=next(l for l in plan['logic']['locals'] if l['id']=='LOCAL-FLOW-ABANDON')
check('register stopping precedes final missing-content confirmation',all(s in abandon['steps'][0]['action'] for s in ['EXECUTION_ACTIVE/REQUEST_UNKNOWN/FACT_CONFLICT','普通reason可先登记停止','不先强求未来内容确认','FOREIGN_CONTENT不冒充在途']))
locals_by_id={row['id']:row for row in plan['logic']['locals']}
def dump(*rows):return json.dumps(active(list(rows)),ensure_ascii=False)
entry=fields['FIELD-FLOW-HANDLING-MODE'];old_direct=fields['FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP'];end=fields['FIELD-FLOW-END-ACTION']
check('current mode is entry-derived and removed direct configuration is historical only',entry['default']['kind']=='derived' and all(s in dump(entry,old_direct,end) for s in ['TASK/DIRECT','CATEGORY/TEMPLATE','当前没有此字段编辑入口','当前CLOSE','历史已捕获DIRECT_FOLLOWUP只读','不提供是否直接跟进配置']))
task_source=fields['FIELD-FLOW-TASK-IMPORT-SOURCE']
check('trusted entry source separates TASK CATEGORY and MANUAL API without new template runs',all(s in dump(task_source,entry) for s in ['entrySource.kind=TASK/CATEGORY','importChannel=MANUAL/API','TASK DIRECT无run/node','schema2','targetFingerprint','parameterMappingFingerprint','系统依据','用户不能直接修改来源']))
scene_text=dump(locals_by_id['LOCAL-PLAT-AI-SCENE-SAVE'])
check('AI scenes retain only MANUAL AUTO and require explicit correction of old FLOW',all(s in scene_text for s in ['仅MANUAL/AUTO','旧FLOW配置提示重新选择','不静默暗转','模板可选其有效场景']))
schema_text=dump(locals_by_id['LOCAL-FLOW-IMPORT-PREVIEW'],locals_by_id['LOCAL-PLAT-AI-IMPORT-TEMPLATE'],fields['FIELD-FLOW-TASK-IMPORT-PARAMETERS'])
check('AI formal schema follows the actual path scene and keeps only its required references',all(s in schema_text for s in ['先确定实际呼叫方式','条件首路径','本次IMPORT条件分流字段','未引用的分类额外必填不阻AI导入','非AI仍按实际分类IMPORT','下载CSV/XLSX','同一准确schema']))
task_text=dump(ai,pred)
check('AI and PRED task imports use exact configured locked context and one light form',all(s in task_text for s in ['导入自动带入并锁定','顶部入口只选择目标任务','同窗展示相同导入表','AUTO/API仅只读','主区不要求重填场景、分类、批次或优先级','批次默认文件名或任务名','选填折叠项']))
check('AI all-rows and PRED valid-subset contracts do not overlap',all(s in task_text for s in ['AI全部行通过才确认','PRED允许当前检查的合法有效子集','成功行封存不重导','原物理行号与当前编辑行号','关闭按钮显示关闭']))
check('unknown original request cannot be cleared by read failure or a new submission',all(s in task_text for s in ['未知导入先核对原请求','读取故障不解除请求身份','不允许以新请求重试产生重复副作用','旧已捕获请求只读重放不接受客户端伪报']))
check('supplier private values and old snapshots stay in trusted original tenant scope',all(s in dump(fields['FIELD-FLOW-TASK-IMPORT-PARAMETERS'],task_source) for s in ['当前/旧/generic','可信原始任务/批次租户','所有值和配置指纹','不泄露给来源方或另一租户','统一历史未知不在读取时首次补类或换类']))
check('current and legacy native roster rows share the original table without guessed back-links',all(s in dump(locals_by_id['LOCAL-PLAT-AI-TASK-QUERY'],locals_by_id['LOCAL-PLAT-CLOUD-TASK-QUERY']) for s in ['原专业名单直接在原列表展示','旧原生行缺业务编码/业务分类/五档执行优先级/导入入口四项时直接留空','不单列历史名单','不按手机号补链','不冒充供应商受理']))
check('exact HP task projection and configuration equivalence retain fail-closed boundaries',all(s in dump(locals_by_id['LOCAL-PLAT-AI-SCENE-SAVE'],locals_by_id['LOCAL-FLOW-START']) for s in ['tenant/brand/account/taskId/唯一scene','不创建供应商任务','未知供应商计数显示待核','已知权威taskStatusCode使用准确可执行枚举',"原status='unknown'仅属兼容状态文本",'不覆盖权威taskStatusCode明确枚举','权威code为null或未知仍拒绝','未知附加项或真实映射/来源/模板/状态变化继续拒绝','不回写旧快照']))
check('queue ownership is current-run specific and list ordering does not invent queue facts',all(s in dump(fields['FIELD-FLOW-EXECUTION-QUEUED-AT'],locals_by_id['LOCAL-FLOW-REOPEN']) for s in ['新运行未安排清当前queue别名','不能借旧运行队列时间或业务createdAt抢队','相同当前运行/资源','新运行重新分配同资源','未安排待办排序与队列时间展示分开']))
check('independent business list restoration is distinct from batch context',all(s in dump(locals_by_id['LOCAL-FLOW-QUERY'],locals_by_id['LOCAL-PLAT-NAVIGATE']) for s in ['导入批次','主菜单打开/刷新不带临时批次过滤','准确批次详情和recordId详情','账号/租户/撤权重新核验']))
check('scene effective required and fast reopen preserve separate raw and saved facts',all(s in scene_text for s in ['下方有效必填','准确参数唯一映射','失效/重复/未读显示待核','上方供应商原模板仍保raw','标记closing的旧层再初始化','活动未保存层拒绝重复打开','延时关闭只删除捕获的旧层','sequence/owner','取消不保存']))
refusal=dump(locals_by_id['LOCAL-PLAT-BAN-AI'])
check('AI refusal remains an authorized detail action rather than an every-row list operation',all(s in refusal for s in ['原列表每行仅保详情','不追加逐行确认拒联','原准确详情保录音/文本','原权限再次校验','不按标签/状态自动拒联']))
delta=business.get('entry_import_current_delta',{})
check('Step54 evidence metadata retains partial HTTP and non-production non-approval status',delta.get('stable_product_ids') is True and delta.get('actual_http_groups')=={'passed':13,'partial':9} and delta.get('formal_approval') is False and delta.get('production_verified') is False and all(s in delta.get('limits','') for s in ['66套1102','13组已验','9组部分已验','下载落地','真实音频','未全部验证','DRAFT']))
# Step55/56 current product contracts are checked alongside all earlier guards.
from profile_template_current_delta import FIELD_IDS as PROFILE_FIELDS, PROFILE, PROFILE_IDENTITY, PROFILE_AUTH, PROFILE_SOURCES, PROFILE_COUNTS, PROFILE_REFRESH, TEMPLATE, TEMPLATE_LOAD, TEMPLATE_AUTH
profile_local=locals_by_id['LOCAL-FLOW-CUSTOMER-TIMELINE'];profile_page=next(row for row in plan['ui']['pages'] if row['id']=='UI-PAGE-2203');template_page=next(row for row in plan['ui']['pages'] if row['id']=='UI-PAGE-2228')
profile_text=dump(profile_local,profile_page);template_text=dump(template_page,locals_by_id['LOCAL-FLOW-TEMPLATE-CREATE'],locals_by_id['LOCAL-FLOW-TEMPLATE-EDIT'])
check('Step55 uses one current customer list rather than obsolete dual main tabs',not any(clause in profile_text for clause in ['客户档案业务跟进与联系档案分视图','切换业务跟进或联系档案','业务跟进/联系档案统一页签与tabpanel']) and '统一' in profile_local['title'])
check('Step55 AC2147 no longer requires Home End dual tab navigation','Home/End' not in next(row['statement'] for row in ir['acceptance'] if row['id']=='AC-2147') and '统一' in next(row['statement'] for row in ir['acceptance'] if row['id']=='AC-2147'))
check('five profile fields are transient projections with explicit source and nested semantics',all(fields[fid]['entity']=='CustomerProfileProjection' and fields[fid]['persistence']['kind']=='transient' for fid in PROFILE_FIELDS) and all(fields[fid].get('object_members') for fid in PROFILE_FIELDS if fid!='FIELD-PROFILE-IDENTITY'))
check('profile identity never changes stored professional customer identity or business statistics',fields['FIELD-PLAT-CUSTOMER-ID']['persistence']['kind']=='stored' and fields['FIELD-FLOW-STATISTICS']['entity']!='CustomerProfileProjection' and PROFILE_IDENTITY in profile_text)
check('profile source permissions independent AI call and followup and exact native write boundaries',PROFILE_AUTH in profile_text and all(value in profile_text for value in ['PAGE-2108','PAGE-2109','CustomerDirectory.find','F31']))
check('profile source loading unknown failed states preserve partial data without read side effects',PROFILE_SOURCES in profile_text and all(value in profile_text for value in ['只读hydrate','不启动同步','不复用旧成功快照']))
check('profile callbacks and cold selected customer update in place preserving inputs and source layers',PROFILE_REFRESH in profile_text and all(value in profile_text for value in ['AI-only','caret','嵌套','可靠完整']))
check('profile counted calls are independent of AI summaries and original business ids',PROFILE_COUNTS in profile_text and all(value in dump(fields['FIELD-PROFILE-COUNTS']) for value in ['businessCount','archivedFollowupCount','aiFollowupCount','actualDialCount','unknownDurationCount','totalDurationSeconds','秒']))
check('template AI task choice precedes scene and requires exact unique binding',TEMPLATE in template_text and all(value in template_text for value in ['sceneId','不选首项','暂不指定','其他tenant']))
check('template cold directory is one read with before after identity guard and explicit retry',TEMPLATE_LOAD in template_text and all(value in template_text for value in ['editor/node/tenant/category','异步前后','不因重绘循环','滚动','草稿']))
check('template node UI does not grant SUPER or operator private task assignment',TEMPLATE_AUTH in template_text and all(value in template_text for value in ['禁用AI任务入口','不授SUPER','task.assign']))
check('global current product summary carries profile and template task source rules',all(clause in plan['logic']['global']['overview'] for clause in [PROFILE,TEMPLATE]) and PROFILE in plan['logic']['global']['data_ownership'])
check('task030 and task011 carry new source components and current same ID checks',all(path in dump(next(row for row in plan['tasks'] if row['id']=='TASK-030')) for path in ['customer-profile.js','customer-profile-workspace.js','check-customer-profile-chain.cjs']) and 'flow-node-config.js' in dump(next(row for row in plan['tasks'] if row['id']=='TASK-011')))
read_local=locals_by_id['LOCAL-FLOW-TEMPLATE-READ'];read_check=next(row for row in plan['acceptance_checks'] if row['id']=='CHECK-FLOW-TEMPLATE-READ')
check('template read-only acceptance does not require editable default actions or saving', '不要求查看者选择、清除或保存' in dump(read_local) and '选择AI后不先选场景' not in read_check['procedure'] and '不选择、清除或保存' in read_check['procedure'])
if options.package:
 for rel in ['tasks/TASK-023.md','field-specs.md','acceptance-map.md','ui-spec.md']:
  text=(OUT/rel).read_text();check('export active ELSE rule consistent: '+rel,not any(x in text for x in blocked))
 text=(OUT/'README.md').read_text();check('draft content review distinct from formal semantic handoff gate','DRAFT未声明正式语义交接门禁通过' in text and '草稿，未声明语义门禁通过 | PM' not in text)
 text=(OUT/'开发工程绑定清单.md').read_text();check('binding list uses current authored field/check counts',str(len(plan['logic']['fields']))+'字段' in text and str(len(plan['acceptance_checks']))+'项CHECK' in text)
 text=(OUT/'当前原型验证边界.md').read_text();check('handoff distinguishes latest local regression from earlier full HTTP partial coverage',all(value in text for value in ['Step55','Step56','70套脚本','1241结构化用例','Step54','66套脚本','1102结构化用例','13组已验','9组部分已验','全量验收未授予','DRAFT','未知回执','file://']))
 check('export remains unapproved draft',read(OUT/'manifest.json')['status']=='draft' and not read(OUT/'handoff-gates.json')['formal_development_ready'])
result={'schema':'audited-current-contract-check@1','passed':not errors,'errors':errors,'checks':checked};dest=ROOT/'交接检查/current-contracts.json';dest.parent.mkdir(exist_ok=True);dest.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'passed':not errors,'checks':len(checked),'errors':errors},ensure_ascii=False));sys.exit(bool(errors))
