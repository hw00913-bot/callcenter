from pathlib import Path
import json,hashlib,re,collections,sys
R=Path(__file__).resolve().parents[3];W=R/'开发交付物/1.1.0/规划工作区';E=W.parent/'规格讨论稿-20261014';P=R/'需求/1.1.0/分析工作区'
def j(p):return json.loads(p.read_text())
s=j(W/'source-draft-20261014.json');p=j(W/'draft-20261014.json');l=j(W/'logic-draft-20261014.json');u=j(W/'ui-draft-20261014.json');a=j(W/'interface-draft-20261014.json')
checks=[];errors=[]
def check(name,result,detail=''):
 checks.append({'name':name,'passed':bool(result),'detail':detail})
 if not result:errors.append(name)
def collect(v,key):
 result=[]
 if isinstance(v,dict):
  for k,x in v.items():
   if k==key and isinstance(x,list):result.extend(x)
   result+=collect(x,key)
 elif isinstance(v,list):
  for x in v:result+=collect(x,key)
 return result
stories=j(P/'memory/normalized-user-stories.json')['user_stories']
ac={x['id']:x['statement'] for st in stories for x in st['acceptance_criteria']}
feat={f['id'] for f in j(P/'memory/feature-list.json')['features']};rules={x['id'] for x in j(P/'memory/business-rules.json')['business_rules']}
ops={x['id'] for x in s['draft_operations']}
check('当前12故事104验收7场景',len(stories)==12 and len(ac)==104 and len(p['scope']['scenario_ids'])==7)
check('旧功能/规则ID沿用且明确待重验',set(p['scope']['feature_ids'])==feat and set(p['scope']['rule_ids'])==rules and 'pending' in p['scope']['feature_review_status'] and s['stage_status']['S3_to_S9']=='stale')
check('当前验收和新增草案操作范围',set(p['scope']['acceptance_ids'])==set(ac) and set(p['scope']['draft_operation_ids'])==ops and len(ops)==3)
for label,obj in [('主计划',p),('逻辑',l)]:
 cs=obj['acceptance_checks'];ids=[c['acceptance_ids'][0] for c in cs]
 check(label+'104条CHECK唯一且正文逐字匹配',len(cs)==104 and len({c['id'] for c in cs})==104 and set(ids)==set(ac) and all(c['expected']==ac[c['acceptance_ids'][0]] and len(c['procedure'])>12 for c in cs))
check('不声称整套已运行',all(c['execution_status']=='not_executed_as_full_suite' for c in p['acceptance_checks']))
check('功能及草案操作验收覆盖无缺失',set(collect(s['features']+s['draft_operations'],'source_acceptance_ids'))==set(ac))
files=s['files']+u.get('source_manifest',[])+a.get('source_files',[])+l.get('source_manifest',[])
missing=[];changed=[]
for f in files:
 if not isinstance(f,dict) or not f.get('path') or not f.get('sha256'):continue
 q=Path(f['path']);q=q if q.is_absolute() else R/q
 if not q.is_file():missing.append(str(q))
 elif hashlib.sha256(q.read_bytes()).hexdigest()!=f['sha256']:changed.append(str(q))
check('所有绑定来源仍在且摘要一致',not missing and not changed,{'records':len(files),'missing':missing,'changed':changed})
pages=u['pages'];pageids={x['id'] for x in pages}
check('旧5页与既有工作台草案及逐页五态',pageids==set(u['coverage']['all_page_ids']+u['coverage']['draft_ui_extension_ids']) and len(pages)==6 and all(set(['normal','loading','empty','error','no_permission']).issubset(x['states']) for x in pages))
check('UI验收逐项处置为呈现或后端',set(u['coverage']['all_requirement_acceptance_ids'])==set(ac) and set(u['coverage']['covered_acceptance_ids'])|set(u['coverage']['backend_only_acceptance_ids'])==set(ac) and not(set(u['coverage']['covered_acceptance_ids'])&set(u['coverage']['backend_only_acceptance_ids'])))
currentapis={x['id']:x['verification_status'] for x in j(P/'interfaces/interface-index.json')['interfaces']}
check('14接口原核验状态逐项一致',{x['id']:x['verification_status'] for x in a['interfaces']}==currentapis)
check('8组源操作未伪造路由',len(a['source_operations'])==8 and all(x.get('route') is None for x in a['source_operations']))
check('13高9中1低未决保持',collections.Counter(i['severity'] for i in s['open_items'])=={'high':13,'medium':9,'low':1})
lf=set(collect(l['locals'],'feature_ids'));la=set(collect(l['locals'],'acceptance_ids'))
check('局部逻辑覆盖历史功能与新增独立操作',feat<=lf and ops<=set(collect(l['locals'],'draft_operation_ids')),{'missing_features':sorted(feat-lf)})
check('局部逻辑验收引用无缺失或越界',la==set(ac),{'missing':sorted(set(ac)-la),'unknown':sorted(la-set(ac))})
fieldids={f['id'] for f in l['fields']};localids={x['id'] for x in l['locals']}
check('字段及局部ID不重复',len(l['fields'])==len(fieldids) and len(l['locals'])==len(localids))
required=['type','nullable','default','validation_rules','permissions','persistence']
fieldmissing={f['id']:[k for k in required if k not in f] for f in l['fields']};fieldmissing={k:v for k,v in fieldmissing.items() if v}
check('字段基本语义完整',not fieldmissing,fieldmissing)
refs=set(collect(l['locals'],'field_ids'))|set(collect(u,'related_field_ids'))|set(collect(u,'field_ids'))
check('逻辑与UI字段引用存在',not(refs-fieldids),sorted(refs-fieldids))
check('UI局部逻辑引用存在',set(collect(u,'local_logic_ids'))<=localids,sorted(set(collect(u,'local_logic_ids'))-localids))
check('正式G1/G2/G3保持待批',all(s['stage_status'][g]=='pending' for g in ['G1','G2','G3']))
check('明确草稿且正式源未导入',p['status']=='DRAFT_NOT_READY_FOR_DEVELOPMENT' and not s['formal_import_performed'] and p['source_gate']['formal_profile_import']=='not_performed')
check('未伪造仓库或文件级任务',p['engineering']['repo'] is None and not p['engineering']['implementation_tasks'])
check('真实调用关闭',not p['production_calls_enabled'] and not a['real_calls_allowed'] and not a['production_ready'])
for n,orig in [('draft-20261014.json',p),('source-draft-20261014.json',s),('logic-draft-20261014.json',l),('ui-draft-20261014.json',u),('interface-draft-20261014.json',a)]:check('导出同源 '+n,j(E/n)==orig)
check('独立草案操作有可读详情页',all((E/'features'/f'{op}.md').is_file() for op in ops))
links=[]
for q in E.rglob('*.md'):
 for match in re.finditer(r'\]\(([^)]+)\)',q.read_text()):
  target=match.group(1).split('#')[0]
  if not target or target.startswith(('http:','https:','mailto:')):continue
  dest=Path(target) if target.startswith('/') else q.parent/target
  if not dest.exists():links.append({'file':str(q.relative_to(E)),'target':target})
check('交付Markdown本地链接有效',not links,links[:20])
manifest=j(E/'source-manifest.json')
check('导出组件摘要一致',all(hashlib.sha256((W/x['path']).read_bytes()).hexdigest()==x['sha256'] for x in manifest['component_files']))
policy=p.get('priority_policy',{})
check('三组P0及用户原句有明确依据',policy.get('level')=='P0' and [x['id'] for x in policy.get('groups',[])]==['P0-APP','P0-IMPORT','P0-FOLLOWUP'] and '应用接入、导入客户接口、外呼时未接通显示填单内容' in policy.get('user_request',''))
check('源快照与主计划优先级政策同源',s.get('delivery_priority_policy')==policy)
check('主计划与逻辑104条优先级逐项一致',{x['id']:x.get('priority') for x in p['acceptance_checks']}=={x['id']:x.get('priority') for x in l['acceptance_checks']})
check('P0分主范围与依赖且保留其他验收',sum(c.get('priority',{}).get('role')=='primary' for c in p['acceptance_checks'])==39 and sum(c.get('priority',{}).get('role')=='dependency' for c in p['acceptance_checks'])==20 and sum(not c.get('priority') for c in p['acceptance_checks'])==45)
check('手工CSV与自动补提交未整体提级',not next(x for x in l['locals'] if x['id']=='DLOCAL-004-MANUAL').get('priority',{}).get('level')=='P0' and all(not next(x for x in s['features'] if x['id']==fid).get('priority') for fid in ['FUNC-014','FUNC-022']))
check('优先级贯穿主要阅读入口',all('P0' in (E/name).read_text() for name in ['README.md','features/README.md','acceptance-map.md','interface-list.md','local-logic.md','ui-spec.md','developer-supplement.md']))
check('SRC125增量核验与局部原型证据边界',s['stage_status']['S1']=='passed_SRC125' and s['stage_status']['S2']=='passed_SRC125' and 'workbench-manual-status-20261014.json' in str(p['prototype_evidence_update']) and not p['prototype_evidence_update']['full_acceptance_suite_executed'])
newacs={'AC-093','AC-094','AC-095','AC-096','AC-097','AC-098'}
check('新增六项仅进入相关P0范围',newacs<=set(ac) and all(c.get('priority',{}).get('role')=='primary' for c in p['acceptance_checks'] if c['acceptance_ids'][0] in newacs))
check('当前源快照104条AC全文逐字相同',{x['id']:x['statement'] for x in s['acceptance']}==ac)
check('新批次与完成快照字段定义存在',all(fid in fieldids for fid in ['DFIELD-124','DFIELD-125']))
completion=next(x for x in l['locals'] if x['id']=='DLOCAL-COMPLETION-CALLBACK')
check('完成回调是独立草案操作且未实现',completion['draft_operation_ids']==['DRAFT-OP-COMPLETION-CALLBACK'] and completion['implementation_status']=='requirements_and_design_only_not_implemented' and {'AC-095','AC-096','AC-097'}<=set(completion['acceptance_ids']))
check('每次结果与完成事件同时保留',{'EVENT-DCC-RESULT','EVENT-FOLLOWUP-COMPLETED'}<=set(x['id'] for x in a['event_contracts']))
check('局部步骤及字段依赖无悬空引用',not ((set(collect(l['locals'],'inputs'))|set(collect(l['locals'],'outputs'))|set(collect(l['locals'],'reads'))|set(collect(l['locals'],'writes'))|set(collect(l['fields'],'dependencies')))-fieldids))
check('全局流程引用有效且ID唯一',set(collect(l['global']['flows'],'local_ids'))<=localids and len({x['id'] for x in l['global']['flows']})==len(l['global']['flows']) and all(st['local_id'] in localids for f in l['global']['flows'] for st in f['steps']))
check('只有一个当前规格讨论目录',[x.name for x in W.parent.glob('规格讨论稿-*') if x.is_dir()]==['规格讨论稿-20261014'])
import_fields={'intentionStoreCode','intentionStoreName','intentionSeriesCode','intentionSeries','smartCode','leadCreatedAt'}
row_schema=next(x for x in a['interfaces'] if x['id']=='API-001')['row_fields_schema'];rowmap={f['key']:f for f in row_schema}
check('业务接口展开leadCode手机号priority必填',all(rowmap[k]['required'] is True for k in ['leadCode','phone','priority']))
check('六个新增来源字段选填并映射逻辑字段',import_fields<=set(rowmap) and all(rowmap[k]['required'] is False and rowmap[k]['field_ref'] in fieldids for k in import_fields))
check('原界面展示与完成快照覆盖新增三条',{'AC-099','AC-100','AC-101'}<=set(ac) and {'AC-100'}<=set(u['coverage']['covered_acceptance_ids']) and import_fields<=set(f['key'] for f in l['fields']))
check('留资时间独立于平台导入时间且新证据有绑定',next(f for f in l['fields'] if f['id']=='DFIELD-131')['key']=='leadCreatedAt' and 'imported-customer-info-20261014.json' in str(p['prototype_evidence_update']))

api_import=next(x for x in a['interfaces'] if x['id']=='API-001');op_import=next(x for x in a['source_operations'] if x['id']=='DCC-RST-IMPORT')
type_fields=[f for f in l['fields'] if f['key']=='businessType']
check('业务类型复用唯一DFIELD024且仅请求级必填',len(type_fields)==1 and type_fields[0]['id']=='DFIELD-024' and all(next(f for f in v['request_fields_schema'] if f['key']=='businessType')['required'] is True for v in [api_import,op_import]) and all('businessType' not in {f['key'] for f in v['row_fields_schema']} for v in [api_import,op_import]))
check('业务类型验收跨来源主计划逻辑UI正文完全一致',all(next(c for c in p['acceptance_checks'] if aid in c['acceptance_ids'])['expected']==next(c for c in l['acceptance_checks'] if aid in c['acceptance_ids'])['expected']==next(c for c in u['coverage']['dispositions'] if c['acceptance_id']==aid)['current_requirement']==ac[aid] for aid in ['AC-102','AC-103','AC-104']))
check('业务类型逐条保存且不改原分组预算键',type_fields[0]['persistence']['kind']=='stored' and all(v['business_type_contract']['classification_keys_unchanged'] is True and v['business_type_contract']['authority']=='authenticated_token_tenant_enabled_stable_business_type_code' for v in [api_import,op_import]))
check('原类型码同时进入每次结果与完成快照回调',all(next(v for v in a['event_contracts'] if v['id']==eid)['business_type_contract']['source']=='original_saved_record_businessType' for eid in ['EVENT-DCC-RESULT','EVENT-FOLLOWUP-COMPLETED']) and 'DFIELD-024' in next(v for v in l['locals'] if v['id']=='DLOCAL-010')['field_ids'] and 'DFIELD-024' in completion['field_ids'])
check('既有名单和工作台均承接原业务类型且不新增页面',all(next(f for f in page['fields'] if f['id']=='businessType')['field_id']=='DFIELD-024' and 'AC-103' in page['traceability']['acceptance_ids'] for page in pages if page['id'] in ['PAGE-002','DRAFT-UI-WORKBENCH']) and len(pages)==6)
check('本次业务类型不污染供应商API002报文',hashlib.sha256(json.dumps(next(v for v in a['interfaces'] if v['id']=='API-002'),ensure_ascii=False,sort_keys=True).encode()).hexdigest()=='3c457664200d721a1a5bdaee596ef13fff30d22819cc7373ca1272896e419ea8')

report={'schema_version':'draft-check@2','date':'2026-10-14','scope':'更新讨论稿的结构、引用、来源一致性；不替代标准产品/开发门禁或运行测试','checks':checks,'passed':not errors,'errors':errors,'formal_validation_executed':False,'formal_product_gate':'not_passed_current_G1_G2_G3_pending','formal_development_gate':'not_passed_repository_contracts_and_review_pending','runtime_tests_executed_by_this_validator':False,'full_acceptance_suite_executed':False,'scoped_runtime_evidence':['prototype/memory/verification-evidence/imported-customer-info-20261014.json','prototype/memory/verification-evidence/application-callback-ui-20261014.json','prototype/memory/verification-evidence/api-business-type-20261014.json']}
for f in [W/'draft-validation-20261014.json',E/'validation.json']:f.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'passed':not errors,'checks':len(checks),'errors':errors},ensure_ascii=False));sys.exit(bool(errors))
