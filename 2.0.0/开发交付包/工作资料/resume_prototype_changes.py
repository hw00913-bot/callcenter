"""Author the post-step28 product delta from current prototype facts.

Writes planning material only. No build, data reset, source-code overwrite,
workflow completion or approval is performed. The composite source is distinct
from the user's prototype and preserves the former normalized input lineage.
"""
from pathlib import Path
import json, copy, hashlib, datetime, shutil, importlib.util

ROOT=Path(__file__).resolve().parent
PROJECT=ROOT.parent.parent/'prototype'
INPUT=ROOT/'续接输入'
VERSION='2.0.0-current-20261030-step39'
PROJECTION_VERSION='2.0.0-current-20261030-step41'
RETIRED=['FIELD-FLOW-OUTCOME-CONFIG','FIELD-FLOW-OUTCOME-LABEL']
NEW_END='FIELD-FLOW-END-ACTION'
NEW_RUN_END='FIELD-FLOW-RUN-END-ACTION'
NEW_ORIGIN='FIELD-FLOW-END-FOLLOWUP-ORIGIN'

def read(p):return json.loads(Path(p).read_text())
def write(p,x):
    p=Path(p);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def unique(xs):return list(dict.fromkeys(xs))
def replace_strings(v,replacements):
    if isinstance(v,dict):
        return {k:(x if k in ['history','previous_source_records','raw','source_evidence'] else replace_strings(x,replacements)) for k,x in v.items()}
    if isinstance(v,list):return [replace_strings(x,replacements) for x in v]
    if isinstance(v,str):
        for a,b in replacements:v=v.replace(a,b)
    return v

CHANGES=[
 ('CHG-029-NAV','普通导航不再以电话状态拦截','AC-2138','正常跨业务域、切租户及系统退出不因拨号/振铃/通话/话后/电话未知而拦截，也不强制先退出电话；身份、数据范围和普通未保存表单检查保留，撤权后的有限当前收尾是独立机制。',['LOCAL-PLAT-NAVIGATE','LOCAL-PLAT-CONTEXT-SWITCH','LOCAL-PLAT-LOGOUT']),
 ('CHG-030-DIRECTORY','客户档案页签与筛选记忆','AC-2147','业务跟进/联系档案统一页签与tabpanel，键盘方向/Home/End可用；同身份切换保各自查询/分页，跨身份不恢复旧状态，显式客户详情与原摘要刷新仍定位正确。',['LOCAL-FLOW-CUSTOMER-TIMELINE','LOCAL-PLAT-CUSTOMER-DIRECTORY']),
 ('CHG-031-ELSE','当前方案强制唯一末位ELSE','AC-2139','所有有出口的当前新配置须有且仅有一个末位ELSE；IF/ELSE IF按优先级首命中，明确不匹配才到兜底，未知继续PENDING。保存/新导入/重开/启用均校验，不依赖DIRECT绕开分流。',['LOCAL-FLOW-TEMPLATE-CREATE','LOCAL-FLOW-TEMPLATE-EDIT','LOCAL-FLOW-ROUTE-BIND','LOCAL-FLOW-IMPORT-PREVIEW']),
 ('CHG-031-NULL','当前选填导入缺列按空捕获','AC-2140','对当前可可靠读取schema内、启用且支持条件的非必填IMPORT字段，新导入/新run准备时缺列规范化为null用于判断；必填缺失或schema读取失败仍拒绝，通话/填写未知及已捕获历史缺失不在读取时补空。',['LOCAL-FLOW-IMPORT-PREVIEW','LOCAL-FLOW-IMPORT-COMMIT','LOCAL-FLOW-REOPEN','LOCAL-FLOW-ENABLE-TEMPLATE','LOCAL-FLOW-RECLASSIFY']),
 ('CHG-032-EDITOR','条件优先与未选目标草稿','AC-2142','节点按命名→条件→下一节点→继续条件编辑，末位轻量“其他情况”；未选目标可留编辑草稿但不产生业务连线，保存仍逐项拒绝缺项并定位。',['LOCAL-FLOW-TEMPLATE-CREATE','LOCAL-FLOW-TEMPLATE-EDIT']),
 ('CHG-032-END','END两种动作及真实接续','AC-2141','END只配置名称和DIRECT_FOLLOWUP/CLOSE两种后续动作。先结束原run；CLOSE不再跟进，DIRECT_FOLLOWUP同record/当前tenant生成无模板人工周期，不自动起呼。合法END来源可授权此接续，即使分类没有开放普通DIRECT导入；原run/节点/call/快照保留，原人员仅当前仍有效且具电话资格时沿用。',['LOCAL-FLOW-END-HANDOFF']),
 ('CHG-033-TASK','任务页移除额外统计模块','AC-2148','预外呼及IVR页不额外显示“今日任务名单分布”，保原任务查询/筛选/空态/重置和专业报表口径；不因此删除底层任务状态或统计能力。',['LOCAL-PLAT-CLOUD-TASK-QUERY']),
 ('CHG-034-RULE','条件即时修改与防环','AC-2143','条件修改直接进入当前草稿，不再显示待应用三按钮；兼容operator保值，字段/来源或不兼容类型/基数变化清不适用比较值，空判断清值。目标选择/拖线拒环并保原草稿，保存仍防绕过。',['LOCAL-FLOW-TEMPLATE-CREATE','LOCAL-FLOW-TEMPLATE-EDIT']),
 ('CHG-035-SIP','人工/预外呼客户侧SIP判断','AC-2144','流转判断分别使用TIANRUN_MANUAL_SIP_CAUSE和TIANRUN_PREDICTIVE_SIP_CAUSE客户侧结果：200已接通、710～724当前字典；不再用1～4接听标记推断，不改AI状态域或原专业记录的其他状态展示。新回执与实际方式/原段/场景准确关联，未知PENDING。',['LOCAL-FLOW-CALL-FACTS','LOCAL-FLOW-EVALUATE']),
 ('CHG-036-LOCAL','本租户路径继续办理','AC-2145','线索域转交组件允许CURRENT本租户分支；命中后保持owner、run及tenant阶段，不新建跨租户截止/轮次，不清原安排与封存结果，并重核后继CALL资格。OTHER仍执行原意向锚定和跨租户保护；CURRENT不冒充OTHER，拒伪造目标或过期令牌。',['LOCAL-FLOW-TRANSFER','LOCAL-FLOW-IMPORT-PREVIEW','LOCAL-FLOW-TEMPLATE-EDIT']),
 ('CHG-037-038-FEEDBACK','多值提示及错误定位','AC-2146','普通及START比较值提示“多个值请换行填写/每行一个值”，保持IN/NOT_IN类型含义；报错节点/START/提示区统一浅红，切换节点保留定位，编辑该节点清当前标记，保存重新判断，不改变原校验。',['LOCAL-FLOW-TEMPLATE-CREATE','LOCAL-FLOW-TEMPLATE-EDIT']),
 ('CHG-039-ENTRY','移除分类行AI标签快捷入口','AC-2149','业务分类行只保编辑/路由配置/预览/删除；不恢复AI标签配置快捷按钮。标签维护仍在呼叫中心AI配置的独立有权入口，原具体AI场景分类引用及其稳定身份保留。',['LOCAL-FLOW-CATEGORY-EDIT','LOCAL-PLAT-AI-CATEGORY-BIND','LOCAL-PLAT-AI-TAG-CONFIG'])
]

def apply_delta():
    b=read(ROOT/'fragments/business.json');p=read(ROOT/'fragments/platform.json');u=read(ROOT/'fragments/ui.json');pf=read(ROOT/'fragments/ui-page-facts.json');rules=read(ROOT/'global-rule-drafts.json')
    if b.get('prototype_resume_delta')==VERSION:return
    baseline={'version':PROJECTION_VERSION,'captured_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),
      'old_product_digest':read(ROOT/'规划工作区/product-review.json')['product_digest'],
      'planning_fragments_before':{str(x.relative_to(ROOT)):hashlib.sha256(x.read_bytes()).hexdigest() for x in [ROOT/'fragments/business.json',ROOT/'fragments/platform.json',ROOT/'fragments/ui.json',ROOT/'global-rule-drafts.json']}}
    write(ROOT/'续接记录/before-projection.json',baseline)
    lm={x['id']:x for d in [b,p] for x in d['locals']};fm={x['id']:x for d in [b,p] for x in d['fields']};cm={x['id']:x for d in [b,p] for x in d['checks']}
    old_fields=[copy.deepcopy(fm[x]) for x in RETIRED]
    for x in old_fields:x.update(status='not_adopted',retirement_reason='当前END已移除此配置；仅保留原产品字段ID追溯，不能复用旧ID承担endAction新含义。')
    write(ROOT/'续接记录/retired-end-fields.json',old_fields)
    new=copy.deepcopy(fm[RETIRED[0]])
    new.update(id=NEW_END,name='结束节点后续动作',key='endAction',format='DIRECT_FOLLOWUP（按照无模板跟进）/ CLOSE（业务结束不跟进）',required_when='当前END保存或执行前必须明确二选一',source_refs=['docs/field-alignment.json#'+NEW_END],source_keys=[])
    new['default']={'kind':'none','value':None,'rule':'未选择保留草稿，不推定成交或任意后续动作；保存须明确选择。'}
    new['validation_rules']=['仅END配置此值；不增加承接角色、呼叫方式或业务达成等额外配置。','执行先结束原run；CLOSE关闭，DIRECT_FOLLOWUP建立同业务/当前租户的独立人工周期，不能自动起呼。']
    new['lifecycle']=[{'state':'编辑草稿','behavior':'二选一单选，未选可编辑但不能保存。'},{'state':'保存/执行','behavior':'随模板及实际run方案封存；按准确END动作执行，不能在运行中改写原方案。'}]
    new['derivation']={'kind':'input','rule':'有权配置人对当前END明确选择，系统按该节点捕获值执行。','dependencies':[]}
    new['persistence']={'kind':'stored','write_when':'合法模板保存时进入配置，创建run时随完整planSnapshot封存。'}
    new['examples']={'valid':['END选择DIRECT_FOLLOWUP，原run结束后产生人工直接周期且没有自动拨打。'],'invalid':['以旧outcomeCode=SUCCESS代替endAction，保存拒绝。']}
    rn=copy.deepcopy(new);rn.update(id=NEW_RUN_END,name='原运行已执行的结束动作',entity='FlowRun',key='endAction',source_refs=['docs/field-alignment.json#'+NEW_RUN_END],required_when='run到达END并结束时必须有准确结束动作')
    rn['permissions']['write']=['系统按已捕获END及最后有权办理动作写入；用户不可直接编辑。'];rn['derivation']={'kind':'system','rule':'与endedAt/endNodeId/endedTenantId及原捕获END一致封存。','dependencies':[NEW_END]};rn['persistence']={'kind':'stored','write_when':'到达END结束原run时，与结束事实/后续周期或关闭结果一致保存。'}
    origin=copy.deepcopy(rn);origin.update(id=NEW_ORIGIN,name='END授权直接跟进的来源证明',entity='BusinessRecord',key='endFollowupOrigin',type='object',format='recordId/runId/nodeId/tenantId/directCycleId/at',nullable=True,required_when='仅由已结束END=DIRECT_FOLLOWUP接续的业务持有；普通DIRECT导入没有此证明',source_refs=['docs/field-alignment.json#'+NEW_ORIGIN])
    origin['validation_rules']=['逐项与同record/当前owner、已结束原run、捕获END动作、结束时间及来源END周期一致；不信前端自报。','仅此可靠来源可绕分类普通DIRECT准入开关；人员、资源、联系限制、真实本人填写及归档仍检查。','可保留已结束runs/nodeRuns历史，不能保留当前runId/templateRef/nodeId冒充运行中模板。']
    origin['derivation']={'kind':'system','rule':'原END动作明确执行时生成并准确关联新周期，不从普通导入或人工改值产生。','dependencies':[NEW_RUN_END,'FIELD-FLOW-RECORD-ID','FIELD-FLOW-OWNER-TENANT','FIELD-FLOW-DIRECT-CYCLE-ID']}
    origin['persistence']={'kind':'stored','write_when':'原run结束并建立END来源直接周期时同次保存；原周期/历史来源不可重写。'}
    origin['examples']={'valid':['原run在本租户以DIRECT_FOLLOWUP结束，来源证明一致且无自动呼叫。'],'invalid':['普通DIRECT请求伪造origin绕分类开关，或转出方借旧owner来源办理，拒绝。']}
    b['fields']=[f for f in b['fields'] if f['id'] not in RETIRED]+[new,rn,origin]
    fm={x['id']:x for d in [b,p] for x in d['fields']}
    for l in lm.values():
        for key in ['inputs','outputs','field_ids']:l[key]=[x for x in l[key] if x not in RETIRED]
        for s in l['steps']:
            for key in ['reads','writes']:s[key]=[x for x in s[key] if x not in RETIRED]
        for z in l['branches']:z['field_ids']=[x for x in z['field_ids'] if x not in RETIRED]
    def use(lid,ids,where='reads'):
        l=lm[lid];l['steps'][-1][where]=unique(l['steps'][-1][where]+ids)
    def branch(lid,suffix,condition,result,ids):
        l=lm[lid];l['branches'].append({'id':lid+'-'+suffix,'condition':condition,'result':result,'field_ids':ids,'test_refs':l['test_refs']})
    for lid in ['LOCAL-FLOW-TEMPLATE-CREATE','LOCAL-FLOW-TEMPLATE-EDIT','LOCAL-FLOW-TEMPLATE-READ','LOCAL-FLOW-ROUTE-BIND']:use(lid,[NEW_END])
    for lid in ['LOCAL-FLOW-DETAIL','LOCAL-FLOW-CUSTOMER-TIMELINE']:use(lid,[NEW_RUN_END,NEW_ORIGIN])
    for lid in ['LOCAL-FLOW-ASSIGN','LOCAL-FLOW-START','LOCAL-FLOW-RESUME-DIRECT','LOCAL-FLOW-ENABLE-TEMPLATE']:use(lid,[NEW_ORIGIN])
    for lid in ['LOCAL-FLOW-TEMPLATE-CREATE','LOCAL-FLOW-TEMPLATE-EDIT']:
        l=lm[lid];l['steps'][1]['action']='编排条件优先的入口/路径和单方式CALL，END仅选后续两动作；当前草稿可未选目标但不形成业务边'
        l['steps'][-1]['action']='核稳定字段/类型/值/准确来源、唯一末位ELSE、合法目标/无环及并发后保存；报错定位当前节点'
        l['branches'][0]['result']='保当前草稿并阻非法保存；字段/来源或不兼容类型/基数变化清不适用值，兼容operator保值，不再额外待应用确认'
        branch(lid,'DRAFT-FIRST','条件已填但目标未选，或选择/拖线构成循环','空目标仅留编辑草稿不生成虚连线；循环选择即时拒绝并保原目标；保存缺项/绕过仍拒绝并统一浅红定位',['FIELD-FLOW-NEXT-NODE','FIELD-FLOW-RULE-VALUES','FIELD-FLOW-EDGE-ID'])
    l=lm['LOCAL-FLOW-EVALUATE'];l['branches'][2].update(condition='当前新方案缺唯一末位ELSE，或所有条件明确不匹配',result='缺ELSE的新方案在保存/新输入准入时拒绝；合法方案明确不匹配才用ELSE；未知不落兜底')
    branch('LOCAL-FLOW-EVALUATE','OPTIONAL-NULL','当前新输入中合法启用选填IMPORT缺列','在输入捕获时规范化null，按为空或ELSE判断；必填/目录异常和通话/填写未知不补空；不读改旧快照',['FIELD-FLOW-IMPORT-VALUES','FIELD-FLOW-RULE-VALUES'])
    l=lm['LOCAL-FLOW-TRANSFER'];l['title']='确认本租户继续或合法跨租户转交'
    l['preconditions']=[v.replace('LEAD且同品牌有效HQ↔STORE','线索域有效分支；CURRENT保持本租户，OTHER按同品牌HQ↔STORE') for v in l['preconditions']]
    l['steps'][0]['action']='先区分CURRENT与OTHER；CURRENT锚定准确当前负责方，不查任意门店目标；OTHER仍按意向唯一锚定或HQ ADMIN同次指派'
    l['steps'][1]['action']='重核selected/路径令牌和当前目标版本；CURRENT不能指定外租户或冒充OTHER承接，后继CALL仍核准确方式/AI上下文'
    l['steps'][2]['action']='CURRENT仅推进合法后继并记LOCAL_ROUTE，保持owner/run/租户阶段及已有安排和封存结果；OTHER才封截止/切owner建轮次并清旧安排'
    l['branches'][0].update(condition='跨品牌、OTHER非法同租户/门店直转/映射不明，或CURRENT伪造外目标/冒充OTHER资格',result='拒绝并保原事实；当前本租户路径本身不是非法跨租户转交')
    l['branches'][1]['result']='CURRENT不产生跨租户授权/截止/新轮次；OTHER按原准确目标接续，目标另行安排'
    use('LOCAL-FLOW-TRANSFER',['FIELD-FLOW-RECIPIENT'])
    l=lm['LOCAL-FLOW-ADVANCE'];l['steps'][-1]['action']='进入准确后继；到END由系统按endAction先结束原run，再接续无模板人工周期或关闭，不把运行结束等同业务成交';use(l['id'],[NEW_END,NEW_RUN_END])
    # New independent backend action: reached via import/advance/transfer, not a new button/node type.
    lid='LOCAL-FLOW-END-HANDOFF';cid='CHECK-FLOW-END-HANDOFF'
    l={'id':lid,'title':'执行END两动作并保原运行事实','feature_ids':['FUNC-2038'],'trigger':'有权导入或路径确认可靠定位到当前捕获END后由系统执行',
       'preconditions':['原动作权限、准确业务/负责方/运行/节点及并发依据已核','原执行/重试/未知与必要归档门槛满足；纯无呼叫路径不制造跟进事实'],
       'postconditions':['原run明确结束且保原计划/节点/通话/快照','CLOSE关闭不再跟进；DIRECT_FOLLOWUP建立当前租户MANUAL直接周期但不自动起呼'],
       'inputs':[NEW_END,'FIELD-FLOW-RECORD-ID','FIELD-FLOW-OWNER-TENANT','FIELD-FLOW-RUN-ID','FIELD-FLOW-NODE-ID'],
       'outputs':[NEW_RUN_END,NEW_ORIGIN,'FIELD-FLOW-RUN-STATUS','FIELD-FLOW-HANDLING-MODE','FIELD-FLOW-DIRECT-CYCLE-ID','FIELD-FLOW-DIRECT-CYCLES','FIELD-FLOW-DIRECT-STATUS','FIELD-FLOW-DIRECT-METHOD','FIELD-FLOW-OUTCOME'],
       'steps':[{'id':'STEP-FLOW-END-HANDOFF-1','action':'先封原run结束时间/节点/租户和准确endAction；系统摘要是结束/转无模板，不配置业务达成','reads':[NEW_END,'FIELD-FLOW-RUN-ID','FIELD-FLOW-NODE-ID','FIELD-FLOW-OWNER-TENANT'],'writes':[NEW_RUN_END,'FIELD-FLOW-RUN-STATUS','FIELD-FLOW-OUTCOME'],'rule_ids':['GR-DATA-FACTS','GR-SERIAL','GR-END-ACTION']},
                {'id':'STEP-FLOW-END-HANDOFF-2','action':'DIRECT_FOLLOWUP保同record/owner和已结束历史，清当前run/节点引用，新建MANUAL周期及可信END来源；原责任人仅当前仍有效且具电话资格才沿用，否则待安排','reads':[NEW_RUN_END,'FIELD-FLOW-RECORD-ID','FIELD-FLOW-OWNER-TENANT'],'writes':[NEW_ORIGIN,'FIELD-FLOW-HANDLING-MODE','FIELD-FLOW-DIRECT-CYCLE-ID','FIELD-FLOW-DIRECT-CYCLES','FIELD-FLOW-DIRECT-STATUS','FIELD-FLOW-DIRECT-METHOD'],'rule_ids':['GR-HANDLING-MODE','GR-END-ACTION','GR-PRIVACY']}],
       'branches':[{'id':'BRANCH-FLOW-END-HANDOFF-CLOSE','condition':'捕获动作CLOSE','result':'原run结束且不建直接周期/不再跟进，不虚构成交或通话','field_ids':[NEW_RUN_END,'FIELD-FLOW-RUN-STATUS'],'test_refs':[cid]},
                   {'id':'BRANCH-FLOW-END-HANDOFF-DIRECT','condition':'捕获动作DIRECT_FOLLOWUP且来源可核','result':'合法END来源可授权无模板接续，不要求分类允许普通DIRECT导入；原角色/资源/联系/实际本人保存仍检查，人工起呼仍须明确发起','field_ids':[NEW_ORIGIN,'FIELD-FLOW-DIRECT-METHOD','FIELD-FLOW-HANDLING-MODE'],'test_refs':[cid]},
                   {'id':'BRANCH-FLOW-END-HANDOFF-DENY','condition':'未选动作、伪造来源/旧租户请求或原执行未收敛','result':'拒绝或待核，不写半次结束/新周期，不泄露目标方后续资料','field_ids':[NEW_END,NEW_ORIGIN,'FIELD-FLOW-OWNER-TENANT'],'test_refs':[cid]}],
       'global_rule_ids':['GR-DATA-FACTS','GR-SERIAL','GR-HANDLING-MODE','GR-PRIVACY','GR-END-ACTION'],'source_keys':[],'source_refs':['documentation/input/functions.json#FUNC-2038'],'test_refs':[cid]}
    l['field_ids']=sorted(set(l['inputs']+l['outputs']+[f for s in l['steps'] for k in ['reads','writes'] for f in s[k]]+[f for z in l['branches'] for f in z['field_ids']]));b['locals'].append(l);lm[lid]=l
    c={'id':cid,'acceptance_ids':['AC-2141'],'procedure':'分别在本租户CALL完成/直接入口和跨租户后到达END，测试CLOSE与DIRECT_FOLLOWUP；分类未允许普通DIRECT时保合法END接续，停用原责任人不得沿用；原租户读截止历史且不得代填；新周期明确起呼后由实际人保存。','expected':'原run先结束，同record/当前owner接续或关闭；无自动通话，原计划/通话/段保留，原人员仅当前合格时沿用；伪造来源/未收敛/错租户拒绝。'}
    b['checks'].append(c);cm[cid]=c
    for lid in ['LOCAL-FLOW-ASSIGN','LOCAL-FLOW-START','LOCAL-FLOW-RESUME-DIRECT']:
        branch(lid,'END-ORIGIN','当前直接周期具有可靠END接续来源','可以按已确认END继续人工跟进；普通DIRECT开关不替代此来源，但当前分类/本人/资源/联系/必要归档照常核验',[NEW_ORIGIN])
    # Current input/provenance fields retain their identities with precisely scoped normalization.
    for fid in ['FIELD-FLOW-IMPORT-VALUES','FIELD-FLOW-IMPORT-ORIGINAL']:
        fm[fid]['validation_rules'].append(CHANGES[3][3])
    fm['FIELD-FLOW-BRANCH-KIND']['validation_rules']=['当前新方案有出口时必须唯一末位ELSE，前序IF/ELSEIF按优先级首命中；未知不能进入后续或ELSE。']
    fm['FIELD-FLOW-NEXT-NODE']['required_when']='当前草稿可空且不形成连线，保存前每条保留路径必须选择合法非循环目标'
    fm['FIELD-FLOW-RULE-VALUES']['validation_rules']+=['普通/START修改直接进入草稿；兼容operator保值，字段/来源或不兼容类型/基数变化清值，不再待应用三按钮。','多值按换行填写；空判断清比较值，数字/日期/集合基数仍严格。']
    fm['FIELD-FLOW-RESULT-SOURCE']['format']='AI原域不变；Cloud MANUAL=TIANRUN_MANUAL_SIP_CAUSE，PREDICTIVE=TIANRUN_PREDICTIVE_SIP_CAUSE；sipCause 200/710～724'
    fm['FIELD-FLOW-ROUTING-EVIDENCE']['validation_rules'].append(CHANGES[8][3])
    fm['FIELD-FLOW-RECIPIENT']['validation_rules'].append(CHANGES[9][3])
    fm['FIELD-FLOW-OUTCOME']['format']='当前END系统摘要FLOW_CLOSED/FLOW_TO_DIRECT；直接周期的人工业务结论另有独立字段，不自动推定成交'
    fm['FIELD-FLOW-HANDLING-MODE']['validation_rules']=[s.replace('DIRECT要求所选分类allowDirectFollowup显式true；无run、无当前节点、无planSnapshot，不虚造直接呼叫节点。','普通DIRECT导入要求分类开关；合法END来源是独立接续许可。DIRECT无当前run/节点引用；END来源可保已结束runs/nodeRuns历史，不形成新模板节点。') for s in fm['FIELD-FLOW-HANDLING-MODE']['validation_rules']]
    fm['FIELD-FLOW-DIRECT-CYCLES']['validation_rules'].append('END来源周期记录source=END_NODE及原run/node来源；后续普通/END周期均保各自事实和原结论。')
    # Normal navigation changed; phone operation qualification and revoked finite finish did not disappear.
    nav='GR-NAVIGATION'
    lm['LOCAL-PLAT-CONTEXT-SWITCH']['title']='正常切换上下文并保护身份与普通草稿'
    for lid in ['LOCAL-PLAT-CONTEXT-SWITCH','LOCAL-PLAT-LOGOUT']:
        z=lm[lid];z['preconditions']=['当前身份/目标范围或系统退出动作可核','普通未保存表单按保存/放弃/取消处理，失败保输入']
        z['steps'][0]['action']='正常导航/切换/系统退出不因本人电话拨号、振铃、通话、话后或未知而拦截，不要求先电话离线'
        z['steps'][1]['action']='继续核当前账号、目标租户/页面/数据权和普通未保存表单；不迁入旧租户客户对象/草稿或冒领电话资格'
        z['steps'][2]['action']='合法切换刷新准确范围，系统退出按实际会话结果回登录；不主动取消已受理后台任务；撤权有限收尾另走原机制'
        z['branches'][0]['result']='身份及普通草稿条件满足则正常离开，不弹强制电话退出；失败/未知会话结果仍据真实反馈处理'
        z['global_rule_ids']=unique(z['global_rule_ids']+[nav]);z['postconditions']=['导航不改变业务归属或执行事实；目标范围/退出结果可核，电话状态本身不阻离开']
    lm['LOCAL-PLAT-NAVIGATE']['global_rule_ids'].append(nav)
    for fid in ['FIELD-PLAT-GUARD-STATE','FIELD-PLAT-PHONE-STATE']:
        fm[fid]['validation_rules']=[s for s in fm[fid]['validation_rules'] if '不放行' not in s and '退出/换域' not in s]+[CHANGES[0][3]]
    fm['FIELD-PLAT-GUARD-STATE']['name']='导航身份与普通未保存表单检查状态'
    fm['FIELD-PLAT-GUARD-STATE']['format']='当前身份/目标授权与普通表单保存、放弃、取消结果；电话phase另由PHONE-STATE记录，不作为导航拦截条件'
    fm['FIELD-PLAT-GUARD-STATE']['derivation']['rule']=CHANGES[0][3]
    fm['FIELD-PLAT-PHONE-STATE']['validation_rules'].append('电话作业本身的unknown/未配置不能当离线或可用；此检查不重新变成普通导航前置。')
    for lid in ['LOCAL-PLAT-CONTEXT-SWITCH','LOCAL-PLAT-LOGOUT']:
        z=lm[lid]
        for key in ['inputs','outputs']:z[key]=[f for f in z[key] if f!='FIELD-PLAT-PHONE-STATE']
        for s in z['steps']:
            for key in ['reads','writes']:s[key]=[f for f in s[key] if f!='FIELD-PLAT-PHONE-STATE']
        for z2 in z['branches']:z2['field_ids']=[f for f in z2['field_ids'] if f!='FIELD-PLAT-PHONE-STATE']
    for d in [b,p]:
        for a in d['acceptance_updates']:
            if a['id'] in ['AC-2006','AC-2012','AC-2015']:a['statement']=CHANGES[0][3]
    # Attach current acceptance additions to the real owning locals/features.
    for change,title,aid,statement,lids in CHANGES:
        owners={l['id']:d for d in [b,p] for l in d['locals']}
        d=owners[lids[0]];d['acceptance_updates'].append({'id':aid,'statement':statement,'source_refs':['docs/functional-spec.json#'+aid],'decision_refs':['docs/exception-definitions.json#'+change]})
        for lid in lids:
            z=lm[lid]
            for checkid in z['test_refs']:
                cm[checkid]['acceptance_ids']=unique(cm[checkid]['acceptance_ids']+[aid])
                cm[checkid]['procedure']+='；本次续接核对：'+statement
                cm[checkid]['expected']+='；按本次续接规则执行，不恢复已移除的旧限制或控件。'
            for f in [f for d2 in [b,p] for f in d2['features'] if f['id'] in z['feature_ids']]:
                f['acceptance_ids']=unique(f.get('acceptance_ids',f.get('source_acceptance_ids',[]))+[aid])
                if 'source_acceptance_ids' in f:f['source_acceptance_ids']=f['acceptance_ids'][:]
    for d in [b,p]:
        for f in d['features']:
            if f['id']=='FUNC-2038':f['description']='按准确条件确认后继，END执行无模板跟进/业务结束两动作；原run先结束，原业务与事实保留。'
            if f['id']=='FUNC-2030':f['description']='按当前线索域配置确认CURRENT本租户继续或OTHER同品牌合法转交，分别保归属/阶段或新增截止接续，避免权限混用。'
    added_rules=[
      {'id':nav,'statement':CHANGES[0][3]},
      {'id':'GR-END-ACTION','statement':CHANGES[5][3]},
      {'id':'GR-LOCAL-ROUTE','statement':CHANGES[9][3]},
      {'id':'GR-CUSTOMER-SIP','statement':CHANGES[8][3]}]
    for z in rules:
        if z['id']=='GR-CONFIG':z['statement']+=' 当前有出口新配置必须唯一末位ELSE；END只配置两种后续动作。'
        if z['id']=='GR-FIELDS':z['statement']+=' '+CHANGES[3][3]
        if z['id']=='GR-HANDLING-MODE':z['statement']+=' 合法END来源可按已确认动作接续当前租户人工周期；它与普通DIRECT导入许可分开，可保已结束run历史但无当前模板节点。'
    rules+=added_rules
    for lid in ['LOCAL-FLOW-CALL-FACTS','LOCAL-FLOW-EVALUATE']:lm[lid]['global_rule_ids']=unique(lm[lid]['global_rule_ids']+['GR-CUSTOMER-SIP'])
    lm['LOCAL-FLOW-TRANSFER']['global_rule_ids'].append('GR-LOCAL-ROUTE')
    for lid in ['LOCAL-FLOW-TEMPLATE-CREATE','LOCAL-FLOW-TEMPLATE-EDIT','LOCAL-FLOW-TEMPLATE-READ','LOCAL-FLOW-ROUTE-BIND']:lm[lid]['global_rule_ids']=unique(lm[lid]['global_rule_ids']+['GR-END-ACTION'])
    for d in [b,p]:
        for l in d['locals']:
            l['field_ids']=sorted(set(l['inputs']+l['outputs']+[f for s in l['steps'] for k in ['reads','writes'] for f in s[k]]+[f for z in l['branches'] for f in z['field_ids']]))
            for s in l['steps']:s['rule_ids']=[r for r in s['rule_ids'] if r in l['global_rule_ids']]
        for f in d['fields']:f['test_refs']=unique(c for l in lm.values() if f['id'] in l['field_ids'] for c in l['test_refs'])
    # UI: retire the category shortcut, keep its ID only as lineage; do not remove the professional feature.
    for pg in pf['pages']:
        if pg['id']=='PAGE-2006':
            removed=[a for a in pg['actions'] if a['id']=='ACTION-2022'];pg['actions']=[a for a in pg['actions'] if a['id']!='ACTION-2022'];pg.setdefault('history',{})['removed_shortcut_actions']=removed
            pg['function_ids']=[f for f in pg['function_ids'] if f!='FUNC-2019']
    if not any(c['id']=='UI-COMP-RADIO' for c in u['ui']['global']['components']):u['ui']['global']['components'].append({'id':'UI-COMP-RADIO','name':'明确后续动作单选','variants':['END两动作'],'states':['unselected','selected','disabled','error'],'interaction_rules':['只改当前草稿；未选保存拒绝并定位，不额外增加承接方和方式配置。']})
    affected={lid for row in CHANGES for lid in row[4]}|{'LOCAL-FLOW-ADVANCE'}
    for pg in u['ui']['pages']:
        pg['fields']=[f for f in pg['fields'] if f['field_id'] not in RETIRED]
        if pg['id']=='UI-PAGE-2006':
            removed=[i for i in pg['interactions'] if i.get('source_action_ids')==['ACTION-2022'] or i['id'].startswith('UI-ACT-2022')]
            pg['interactions']=[i for i in pg['interactions'] if i not in removed];pg.setdefault('history',{})['removed_shortcut_interactions']=removed
            pg['layout'].append('分类行操作仅编辑/路由配置/预览/删除；AI标签维护走专业独立入口。')
        if pg['id']=='UI-PAGE-2228':
            pg['layout']+=['节点按名称→条件→下一节点→继续条件，末位轻量“其他情况”；未选目标不形成虚连线。','条件即时修改；多值提示每行一个值，错误节点/开始/提示区统一浅红；修改错误节点清本次标记，保存重判。','END仅名称与两个后续动作单选，不再业务达成枚举或承接方配置。']
            pg['components']=unique(pg['components']+['UI-COMP-RADIO'])
        if pg['id'] in ['UI-PAGE-2205','UI-PAGE-2206']:pg['layout'].append('保原任务列表/筛选/空态/重置，不追加今日任务名单分布。')
        if pg['id']=='UI-PAGE-2203':pg['layout'].append(CHANGES[1][3])
        if pg['id']=='UI-PAGE-2002':
            pg['states']=[{**s,'behavior':CHANGES[0][3] if s['name']=='normal' else s['behavior']} for s in pg['states']]
        if pg['id'] in ['UI-PAGE-2006','UI-PAGE-2228']:
            useid='LOCAL-FLOW-TEMPLATE-EDIT' if pg['id']=='UI-PAGE-2228' else 'LOCAL-FLOW-TEMPLATE-READ'
            pg['local_logic_ids']=unique(pg['local_logic_ids']+[useid]);pg['components']=unique(pg['components']+(['UI-COMP-RADIO'] if pg['id']=='UI-PAGE-2228' else ['UI-COMP-READONLY']))
            pg['fields'].append({'field_id':NEW_END,'component_id':'UI-COMP-RADIO' if pg['id']=='UI-PAGE-2228' else 'UI-COMP-READONLY','label':'结束后续处理','help_text':'按照无模板跟进 / 业务结束不跟进；原运行先结束，接续不自动起呼。','visible_when':'选择END配置时；分类路由预览按准确模板只读展示','editable_when':'仅有权模板编辑草稿可选；路由预览/已运行方案只读','required_indicator':'END保存前二选一','validation_timing':'选择与保存时校验；未选保存定位当前END','error_message':'请选择结束后是否继续跟进','formatting':'两个单选，无额外承接方/方式/业务达成字段'})
        if pg['id']=='UI-PAGE-2227':
            pg['local_logic_ids']=unique(pg['local_logic_ids']+[lid for lid in ['LOCAL-FLOW-END-HANDOFF']]);pg['test_refs']=unique(pg['test_refs']+[cid])
            pg['interactions'].append({'id':'UI-FLOW-END-HANDOFF','trigger':'合法路径/导入已可靠定位END后系统处理','behavior':CHANGES[5][3],'local_logic_ids':['LOCAL-FLOW-END-HANDOFF'],'test_refs':[cid]})
        for i in pg['interactions']:
            if set(i['local_logic_ids'])&affected:
                ls=[lm[x] for x in i['local_logic_ids']];i['behavior']='；'.join(s['action'] for l in ls for s in l['steps'])+'；'+'；'.join(z['result'] for l in ls for z in l['branches'])
        for f in pg['fields']:
            if f['field_id']=='FIELD-FLOW-RECIPIENT':f['visible_when']='仅CALL承接方或TRANSFER分支目标适用；END不显示。'
            if f['field_id']=='FIELD-FLOW-RULE-VALUES':f['help_text']='多个值请换行填写，每行一个值；选择属于任一值/不属于任一值。字段/来源及不兼容类型变化按当前规则清值，无待应用三按钮。'
    for c in u['ui']['global']['components']:
        if c['id']=='UI-COMP-NAV':c['interaction_rules']=[CHANGES[0][3]]
    for perm in u['permissions_summary']['pages']:
        if perm['page_id'] in ['PAGE-2001','PAGE-2002']:perm['operations']=CHANGES[0][3]
    u['ui']['global']['layout_rules'].append('正常导航不以电话状态强制退出；话后与通话资格仍属于电话业务自身检查，撤权有限收尾分开。')
    for d in [b,p]:
        for mapping in d['page_mappings'].values():
            mapping['field_ids']=[f for f in mapping['field_ids'] if f not in RETIRED]
    b['page_mappings']['PAGE-2227']['local_ids'].append('LOCAL-FLOW-END-HANDOFF')
    for pg in u['ui']['pages']:
        u['page_mappings'][pg['source_page_ids'][0]]={'local_ids':pg['local_logic_ids'],'field_ids':[f['field_id'] for f in pg['fields']],'test_refs':pg['test_refs'],'origin_field_groups':u['page_mappings'].get(pg['source_page_ids'][0],{}).get('origin_field_groups',[])}
    b['prototype_resume_delta']=VERSION
    b['supersessions'] += [{'id':change,'old':'步骤28产品整理时的相关规则/入口，原版本保留追溯','current':statement,'evidence_refs':['docs/exception-definitions.json#'+change]} for change,title,aid,statement,lids in CHANGES]
    for name,data in [('business.json',b),('platform.json',p),('ui.json',u),('ui-page-facts.json',pf)]:write(ROOT/'fragments'/name,data)
    write(ROOT/'global-rule-drafts.json',rules)

def snapshot_and_prepare():
    apply_delta()
    # Finish current-only presentation references without reinterpreting retired IDs.
    u=read(ROOT/'fragments/ui.json');pf=read(ROOT/'fragments/ui-page-facts.json');p=read(ROOT/'fragments/platform.json');b=read(ROOT/'fragments/business.json')
    for f in b['fields']:
        if f['id']=='FIELD-FLOW-OUTCOME':
            f['derivation']['dependencies']=[NEW_END,NEW_RUN_END]
            f['derivation']['rule']='按捕获END的endAction写FLOW_CLOSED/FLOW_TO_DIRECT运行摘要，不推定业务成交。'
            f['name']='运行结束与后续动作摘要';f['nullable']=True;f['required_when']='原run执行END时必须生成准确结束摘要；运行中可尚未产生'
            f['default']={'kind':'none','value':None,'rule':'运行未结束不生成结束摘要，不用默认业务达成。'}
            f['validation_rules']=['当前END仅生成FLOW_CLOSED/FLOW_TO_DIRECT，分别对应CLOSE/DIRECT_FOLLOWUP，不是成交判断。','直接周期的人工业务结论在其独立周期字段中保存；原run结束摘要不可重写成后续周期结论。']
            f['examples']={'valid':['END=CLOSE封存业务结束不跟进；END=DIRECT_FOLLOWUP封存转无模板摘要。'],'invalid':['把FLOW_CLOSED统计成SUCCESS成交，或用后续直接结果覆盖原run摘要。']}
        if f['id']==NEW_END:
            f['default']={'kind':'literal','value':'CLOSE','rule':'当前新增END组件初始为业务结束不跟进，可明确改为DIRECT_FOLLOWUP；缺失/非法值仍拒绝保存。'}
            f['lifecycle'][0]['behavior']='新增组件初始CLOSE，允许在当前草稿改选另一动作；不增加额外配置。'
        if f['id']=='FIELD-FLOW-HANDLING-MODE':
            clause='；当前捕获END=DIRECT_FOLLOWUP结束原run后同次转为DIRECT并存可靠来源；保已结束历史但清当前run/节点引用。'
            f['persistence']['write_when']=f['persistence']['write_when'].replace(clause,'')+clause
    for pg in u['ui']['pages']:
        if pg['id'] in ['UI-PAGE-2001','UI-PAGE-2002']:pg['fields']=[f for f in pg['fields'] if f['field_id']!='FIELD-PLAT-PHONE-STATE']
    def aliases(v):
        if isinstance(v,dict):
            for k,x in v.items():
                if k in ['field_ids','target_field_ids'] and isinstance(x,list):
                    had=any(z in RETIRED for z in x);v[k]=[z for z in x if z not in RETIRED]
                    if had:v[k]=unique(v[k]+[NEW_END])
                elif k not in ['history','raw','previous_source_records']:aliases(x)
        elif isinstance(v,list):
            for x in v:aliases(x)
    aliases(u.get('field_group_mappings',{}))
    for pg in pf['pages']:
        for a in pg.get('actions',[]):aliases(a)
    for f in p['features']:
        if f['id']=='FUNC-2003':f['name']='切换合法上下文并保护普通草稿';f['description']=CHANGES[0][3]
    for l in p['locals']:
        if l['id']=='LOCAL-PLAT-LOGOUT':l['title']='普通草稿检查后统一退出登录'
    changed_locals={lid for row in CHANGES for lid in row[4]}|{'LOCAL-FLOW-ADVANCE','LOCAL-FLOW-ASSIGN','LOCAL-FLOW-START','LOCAL-FLOW-RESUME-DIRECT','LOCAL-FLOW-TEMPLATE-READ'}
    all_locals={l['id']:l for d in [b,p] for l in d['locals']}
    for d in [b,p]:
        checkmap={c['id']:c for c in d['checks']}
        for l in d['locals']:
            if l['id'] not in changed_locals:continue
            for checkid in l['test_refs']:
                c=checkmap[checkid]
                if c.get('resume_check_revision')==VERSION:continue
                c['history']={'pre_resume_check':copy.deepcopy(c)}
                c['procedure']='按当前续接版本执行：'+l['trigger']+'。前提：'+'；'.join(l['preconditions'])+'。操作：'+'；'.join(s['action'] for s in l['steps'])+'。分别构造：'+'；'.join(z['condition'] for z in l['branches'])+'。'
                c['expected']='；'.join(l['postconditions'])+'；'+'；'.join(z['result'] for z in l['branches'])+'。'
                c['resume_check_revision']=VERSION
    from audit_delta import apply as apply_audit
    b,p,u,pf=apply_audit(b,p,u,pf)
    write(ROOT/'fragments/ui.json',u);write(ROOT/'fragments/ui-page-facts.json',pf);write(ROOT/'fragments/platform.json',p);write(ROOT/'fragments/business.json',b)
    # Only normalized product material is copied; there is no runnable parallel prototype.
    oldir=read(ROOT/'规划工作区/product-ir.json')
    for row in oldir['source']['files']:
        source=PROJECT/row['path'];target=INPUT/row['path'];target.parent.mkdir(parents=True,exist_ok=True)
        if not target.exists():shutil.copyfile(source,target)
    tracked=[]
    for directory in ['js','scripts','assets/css']:
        tracked += [p for p in (PROJECT/directory).rglob('*') if p.is_file() and p.suffix in ['.js','.cjs','.py','.css'] and '__pycache__' not in p.parts]
    tracked += [PROJECT/'index.html',PROJECT/'memory/change-log.md',PROJECT/'memory/execution-steps.md',PROJECT/'inputs/local-tenant-flow-authorization-20261030.json',PROJECT/'inputs/cloud-sip-status-authorization-20261030.json']
    tracked += [p for p in (PROJECT/'config').glob('*') if p.is_file() and p.name!='workflow.json' and p.suffix in ['.json','.js']]
    evidence={'schema':'current-prototype-projection@1','version':PROJECTION_VERSION,'captured_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'prototype_root':str(PROJECT),
      'scope':'当前原型和步骤29～41变更记录；只规范化到规划输入，不改原型源码或台账','audit_corrections':{'id':'AUDIT-040','statement':'AI-only准入共享只读模型及异步失效检查；ELSE正文与验收统一，继承测试/入口/状态及统计修复'},'changes':[{'id':c,'title':t,'acceptance_id':a,'statement':s,'local_ids':ls} for c,t,a,s,ls in CHANGES],
      'files':[{'path':p.relative_to(PROJECT).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(set(tracked))]}
    write(ROOT/'续接记录/current-prototype-evidence.json',evidence)
    spec=importlib.util.spec_from_file_location('resume_assembler',ROOT/'assemble_product_specs.py');m=importlib.util.module_from_spec(spec);sys_path=str(ROOT)
    import sys
    if sys_path not in sys.path:sys.path.insert(0,sys_path)
    spec.loader.exec_module(m);m.SRC=INPUT
    original_md=m.md
    def input_md(path,text):
        if Path(path).is_relative_to(INPUT/'memory'):return
        return original_md(path,text)
    m.md=input_md;m.prepare()
    decisions=INPUT/'docs/decisions.md'
    decisions.write_text(decisions.read_text()+'\n\n## step-40 重新审计整改\n\n当前ELSE正文、AC-2124/AC-2139及字段生命周期/推导/示例统一为所有有出口节点唯一末位ELSE，未知保PENDING。AI-only名单导入主动等待共享联系只读模型，不取得Cloud权利；查看概览不写意向草稿，新导入保存准确号码供联系协调且界面脱敏，记录实际操作人。异步失效不提交、未知不放行、不清台账。继承测试按现行五角色；最新任务包为当前交接包，DRAFT未声明正式语义交接门禁通过，工程/真实审批另行完成。\n')
    # Current composite facts explicitly include the code projection; original source stays untouched.
    write(INPUT/'docs/exception-definitions.json',evidence)
    fields=read(INPUT/'docs/field-alignment.json');fields['mappings']+=read(ROOT/'续接记录/retired-end-fields.json');write(INPUT/'docs/field-alignment.json',fields)
    for name in ['docs/functional-spec.json','docs/change-log.json','documentation/input/consolidated-reviewed-facts.json']:
        x=read(INPUT/name);x['version']=PROJECTION_VERSION;write(INPUT/name,x)
    (INPUT/'documentation/README.md').write_text('# 当前原型续接的规划输入\n\n'+evidence['scope']+'。原规范JSON未同步本次代码变化，因此本输入以原规范保留业务ID，并明确追加当前原型变更。代码指纹和规则来源见docs/exception-definitions.json；没有生产工程选择、批准或数据重置。\n')
    write(ROOT/'续接记录/projection-result.json',{'source':str(INPUT),'version':PROJECTION_VERSION,'prototype_files_hashed':len(evidence['files']),'retired_system_field_ids':RETIRED,'prototype_files_modified_by_projection':[]})
    print(json.dumps({'input':str(INPUT),'version':PROJECTION_VERSION,'code_files':len(evidence['files'])},ensure_ascii=False))

if __name__=='__main__':snapshot_and_prepare()
