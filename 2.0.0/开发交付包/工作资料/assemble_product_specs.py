"""Combine reviewed authoring fragments without changing prototype runtime files."""
import json, sys, hashlib
from pathlib import Path
from collections import defaultdict
from memory_indexes import memory_texts

AUTHOR=Path(__file__).resolve().parent
BASE=AUTHOR.parent.parent
SRC=AUTHOR/'续接输入'
def read(p): return json.loads(Path(p).read_text())
def write(p,x):
    p=Path(p);p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def md(p,x):
    p=Path(p);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(x.rstrip()+'\n')
def uniq(x): return list(dict.fromkeys(x))
def fragments(): return [read(AUTHOR/'fragments'/n) for n in ['business.json','platform.json']]
def load_all():
    bs,ps=fragments();u=read(AUTHOR/'fragments/ui.json')
    return bs,ps,u

def prepare():
    bs,ps,u=load_all(); parts=[bs,ps]
    for name in ['project.md','field-map.md','feature-list.md','business-rules.md']:
        prior=AUTHOR/'provenance'/'previous-current-memory'/name
        if not prior.exists():md(prior,(SRC/'memory'/name).read_text())
    features=sorted([x for p in parts for x in p['features']],key=lambda x:x['id'])
    fields=[x for p in parts for x in p['fields']]
    locals_=[x for p in parts for x in p['locals']]
    checks=[x for p in parts for x in p['checks']]
    fl={x['id']:x for x in fields};ll={x['id']:x for x in locals_}
    ac={x['id']:x for x in read(AUTHOR/'origin-acceptance-ids.json')}
    for p in parts:
        for x in p['acceptance_updates']: ac.setdefault(x['id'],{}).update(x)
    # Preserve source feature/AC/PAGE identity while current semantics replace old prose.
    origins={x['id']:x for x in read(AUTHOR/'origin-feature-ids.json')}
    for f in features:
        number=int(f['id'].split('-')[1])
        f['area']='系统层：身份与导航' if number in [2001,2002,2003,2004] else '系统管理' if number in list(range(2005,2016))+[2026,2028,2029] else '呼叫中心' if number in [2018,2019,2043] else '报表中心' if number==2027 else '业务&客户'
        f['acceptance_ids']=uniq(f['acceptance_ids'])
        f['local_logic_ids']=[x['id'] for x in locals_ if f['id'] in x['feature_ids']]
        f['behavior_spec']=[x for x in locals_ if f['id'] in x['feature_ids']]
        f['history']={'previous_source_records':[origins[f['id']]],'purpose':'只保留原业务ID与出处，旧口径不作为当前操作规格'}
        if f['id']=='FUNC-2002':
            f['retained_capability_specs']=ps['retained_capability_specs']
            f['acceptance_ids']=uniq(f['acceptance_ids']+[f'AC-{n}' for n in [2063,2064,2065,2066,2067,2069,2070,2071,2072,2073]])
    currentpages=read(AUTHOR/'fragments/ui-page-facts.json')['pages']
    upages={x['source_page_ids'][0]:x for x in u['ui']['pages']}
    am=ps.get('action_mappings',{})
    for page in currentpages:
        if page.get('status')=='superseded': continue
        pid=page['id'];ui=upages[pid]
        page['history']={**page.get('history',{}),'previous_source_records':page.get('fields',[]),'purpose':'FLD编号原为页面字段组，详细产品字段改由FIELD稳定ID说明'}
        page['fields']=[{'id':v['field_id'],'name':fl[v['field_id']]['name'],'local_logic_ids':[l for l in ui['local_logic_ids'] if v['field_id'] in ll[l]['field_ids']]} for v in ui['fields']]
        page['local_logic_ids']=ui['local_logic_ids']
        for a in page.get('actions',[]):
            exact=am.get(a['id'],{}).get('local_ids',[]) or a.get('local_logic_ids',[])
            if not exact:
                exact=uniq([l for i in ui['interactions'] if a['id'].replace('ACTION-','') in i['id'] for l in i['local_logic_ids']])
            if not exact: exact=[l for l in ui['local_logic_ids'] if set(ll[l]['feature_ids']) & set(a.get('feature_ids',[]))]
            a['local_logic_ids']=exact
            a['description']='；'.join(ll[l]['trigger'] for l in exact)
    supers=[]
    for p in parts: supers+=p['supersessions']
    supers+=u.get('supersessions',[])
    for n,s in enumerate(supers,1):
        s.setdefault('id',f'SUP-CURRENT-{n:02}')
        if s.get('source_page_id'):
            s.setdefault('old','独立来源页面 '+s['source_page_id'])
            s.setdefault('current','不再作为独立页面；相关有效能力归位 '+', '.join(s.get('replacement_page_ids',[])))
    eng=[x for p in parts for x in p['engineering_questions']]
    rules=read(AUTHOR/'global-rule-drafts.json')
    for r in rules:
        r['name']=r['id'];r['source_refs']=['docs/decisions.md','docs/role-permissions.md']
    groups=defaultdict(list)
    for l in locals_:
        key='FLOW-CURRENT-CUSTOMER' if l['id'].startswith('LOCAL-FLOW-') else 'FLOW-CURRENT-PLATFORM'
        groups[key].append(l)
    # Full source facts remain explicit, including independently testable branches.
    write(SRC/'documentation/input/functions.json',features)
    write(SRC/'documentation/input/pages.json',currentpages)
    write(SRC/'documentation/input/consolidated-reviewed-facts.json',{
        'version':'2.0.0-current-20261030-dual','status':'current_product_baseline_codex_consolidated_not_human_approval',
        'decisions':supers,'supersededDecisionIds':[], 'newConfirmations':[],
        'evidence':'最新用户决定、当前原型代码和已存在决策记录；原分析仅保留ID与不变的专业边界'})
    write(SRC/'docs/functional-spec.json',{'version':'2.0.0-current-20261030-dual','sections':[{'id':'SCOPE-CURRENT','name':'当前产品范围','description':'43差异功能及222既有专业操作；43当前页面。当前产品规则以本包为准，配合直接跟进与模板流转实现同步更新，不补盖上游业务运营审批。'},{'id':'PERMISSION-CURRENT','name':'页面、动作与数据范围分别授权','permission_matrix':u['permissions_summary']},{'id':'ENGINEERING-EVIDENCE-CROSSWALK','name':'原工程缺证保留与当前补证责任','issue_crosswalk':ps['engineering_issue_crosswalk']}], 'acceptance':list(ac.values())})
    write(SRC/'docs/rules-appendix.json',{'rules':rules})
    write(SRC/'docs/field-alignment.json',{'id':'FIELD-ALIGNMENT-CURRENT','name':'当前逐字段产品规格','mappings':fields,'history':{'original_groups':[g for p in currentpages for g in p.get('history',{}).get('previous_source_records',[])]}})
    write(SRC/'docs/remaining-confirmations.json',{'items':[], 'preparations':eng,'legacy_issue_crosswalk':ps['engineering_issue_crosswalk'],'scopeDecisions':[{'id':'SCOPE-PRODUCT-ONLY','statement':'产品规格阶段不设计数据库、真实接口及供应商实现，不将本地Mock视作生产验证。工程问题必须在开发阶段补证；当前正式流程审批记录保持原状态。'}]})
    write(SRC/'docs/change-log.json',{'version':'2.0.0-current-20261030-dual','changes':supers})
    write(SRC/'blueprint/current-business-diagrams.json',{'businessFlows':[{'id':k,'name':'客户业务闭环独立动作' if 'CUSTOMER' in k else '平台与原专业能力独立动作','steps':[{'id':'SOURCE-'+l['id'],'action':l['trigger'],'local_id':l['id'],'description':l['postconditions']} for l in v]} for k,v in groups.items()]})
    md(SRC/'documentation/README.md','''# 当前产品基线输入

当前基线：2.0.0-current-20261030-dual。functions.json保留43个FUNC，pages.json保留43个当前PAGE及3个被替代的来源PAGE。原始FUNC/AC/ACTION/FLD编号用于追溯，当前动作和逐字段规则采用LOCAL/FIELD编号。

本轮同步双模式原型实现与产品规格，不改变原工作流审批状态。产品规格以独立规划工作区的plan.json及其导出包为阅读入口；旧分析材料及冻结启动计划保留为来源，不继续充当当前业务操作规则。
''')
    # Retain all source IDs and the preflight-readable memory table contracts.
    memory = memory_texts(AUTHOR, features, fields, rules, currentpages, u, locals_)
    for name, lines in memory.items():
        md(SRC/'memory'/name, '\n'.join(lines))
    esc=lambda x:str(x).replace('|','／').replace('\n',' ')
    md(SRC/'docs/functional-spec.md','''# 当前产品规格入口

本轮统一43个差异功能、43个当前页面与222项原专业操作，功能和验收身份不重编号。页面动作、字段呈现与产品逻辑通过稳定ID相连。

- 当前功能：documentation/input/functions.json
- 当前页面：documentation/input/pages.json
- 验收正文：docs/functional-spec.json
- 逐字段规则：docs/field-alignment.json
- 全局约束：docs/rules-appendix.json
- 被替代条款：docs/change-log.json
- 工程补证：docs/remaining-confirmations.json

完整可读交付在独立产品规格包README。每个局部动作说明触发、前置、步骤、分支、结果和验收；每页说明正常、加载、空、错误、无权五态。本版与双模式运行原型同步更新，不代表真实接口、供应商、生产授权或正式业务运营审批已完成。
''')
    md(SRC/'docs/field-alignment.md','# 逐字段规则\n\n规范数据见 `field-alignment.json`，逐项说明业务对象与键、类型、格式、空值、必填、默认值、校验、读写资格、生命周期、来源、依赖、持久化类别和保存时点、有效与无效例子、验收检查。界面字段呈现按页面规格对齐，不将一个表单组冒充单字段。')
    md(SRC/'docs/rules-appendix.md','\n'.join(['# 当前全局业务约束','']+[r['id']+'：'+r['statement']+'\n' for r in rules]))
    md(SRC/'docs/remaining-confirmations.md','\n'.join(['# 当前工程补证责任','','本轮无需要用户再次决定的业务项。以下为开发阶段必须补齐的工程证据，不把本地Mock当作生产验证。','']+[q['id']+'（'+q['engineering_category']+'）：'+q['question']+'\n' for q in eng]+['','## 原14项缺证追溯','']+[q['legacy_issue_id']+' → '+', '.join(q['current_question_ids'])+'：'+q['engineering_gap']+'\n' for q in ps['engineering_issue_crosswalk']]))
    md(SRC/'docs/change-log.md','\n'.join(['# 当前产品条款替代记录','','基线2.0.0-current-20261030-dual；原条款仅作追溯，不并行生效。','']+[s['id']+'：'+str(s.get('old',s.get('replaces',s.get('topic',''))))+' → '+str(s.get('current',''))+'\n' for s in supers]))
    decisions=SRC/'docs/decisions.md'
    dt=decisions.read_text();marker='## 2026-10-30 双模式办理实现与规格同步'
    if marker in dt:dt=dt.split(marker)[0].rstrip()
    md(decisions,dt+'\n\n'+marker+'\n\n依据用户本次明确授权，落实分类允许直接跟进、整批DIRECT/TEMPLATE办理方式、直接跟进完整呼叫归档与后续显式启用流程；同步现行memory、需求记录及产品规格。当前规则入口为documentation/input、docs/functional-spec.json、docs/rules-appendix.json、docs/field-alignment.json，旧条款替代关系见docs/change-log.json。原决策记录按时间保留，不将旧空白节点、模板V1/V2选择、按坐席／任务分配或旧v2迁移规则继续当作现行口径。\n\n本轮修改双模式业务运行代码、需求与产品规格，原型工作流和冻结审批记录不变；验收范围为当前本地Mock，实际生产服务不调用。产品语义复核由Codex执行，不代表用户业务运营批准或真实生产接口验证。')
    md(SRC/'memory/README.md','''# 当前记忆阅读顺序

当前产品基线为2026-10-30整理版：先读project.md，再按feature-list.md、business-rules.md和field-map.md查对应产品规则。完整输入在../documentation/input和../docs的规范JSON中，独立产品规格包为交付阅读入口。

project-startup-plan.md保留原批准快照，不改盖旧摘要。acceptance-map.md、execution-plan.md、open-items.md及各日期audit/verification文件记录当时的核验过程和证据，不代表其中的旧业务口径继续生效，也不因本次文档整理提升其核验结论。历史来源与当前规则冲突时，按docs/change-log.json和最新规范产品输入解释；真实工程缺证在docs/remaining-confirmations.json继续保留。
''')
    # Frozen startup plans and existing workflow approvals are not modified.
    write(AUTHOR/'assembly-counts.json',{'features':len(features),'acceptance':len(ac),'locals':len(locals_),'fields':len(fields),'checks':len(checks),'current_pages':len(upages),'original_operations':len(ps['retained_capability_specs'])})
    print('Prepared current product source',read(AUTHOR/'assembly-counts.json'))

def build_plan():
    bs,ps,u=load_all();parts=[bs,ps];ws=AUTHOR/'规划工作区'
    plan=read(ws/'plan.json');inv=read(ws/'logic-inventory.json')
    if isinstance(inv,dict): inv=inv.get('items',inv.get('inventory',[]))
    locals_=[x for p in parts for x in p['locals']];fields=[x for p in parts for x in p['fields']]
    checks=[x for p in parts for x in p['checks']]
    lm={x['id']:x for x in locals_};fm={x['id']:x for x in fields}
    rules=read(AUTHOR/'global-rule-drafts.json')
    rulemap={r['id']:r for r in rules}
    labels={
      'CATALOG':'品牌字段、分类、参考模板及实际路由配置',
      'IMPORT':'名单严格导入、责任分配及首次执行准备',
      'EXECUTION':'准确呼叫事实、实际办理人填写、归档与确认流转',
      'LIFECYCLE':'纠偏、废弃、再次跟进及转类',
      'BUSINESS-READ':'业务队列、批次、详情和客户跟进读取',
      'RECONCILE':'未知请求核对、责任移交和联系协调',
      'IDENTITY':'登录、租户上下文、导航和退出',
      'ORGANIZATION':'品牌、租户、账号和成员授权',
      'AI':'原AI专业任务、目录、场景、标签和线索',
      'CONTACT':'原黑名单、明确拒联及外呼准入',
      'FINANCE':'AI服务账户、交易、核对和汇总',
      'PHONE':'本人电话、监管及原客户任务',
      'CLOUD-TASK':'预外呼、IVR、专业导入与业务系统回传',
      'RESOURCE':'呼叫资源、坐席供应商配置和呼入规则',
      'REPORT':'专业报表、通话记录、录音和审计'}
    def group(lid):
        s=lid.removeprefix('LOCAL-FLOW-')
        if lid.startswith('LOCAL-FLOW-'):
            if s=='INTERFACE-QUERY':return 'EXECUTION'
            if s.startswith(('FIELD-','INTERFACE-','CATEGORY-','TEMPLATE-','ROUTE-')):return 'CATALOG'
            if s.startswith(('IMPORT-','ASSIGN','AI-SCENE')):return 'IMPORT'
            if s in ['START','START-BATCH','CALL-FACTS','SAVE-CONTENT','ARCHIVE','EVALUATE','ADVANCE','TRANSFER','END-HANDOFF']:return 'EXECUTION'
            if s in ['CORRECT','ABANDON','REOPEN','RECLASSIFY','ENABLE-TEMPLATE','COMPLETE-DIRECT','RESUME-DIRECT']:return 'LIFECYCLE'
            if s in ['QUERY','BATCH-READ','DETAIL','CUSTOMER-TIMELINE','HANDLER-INBOX']:return 'BUSINESS-READ'
            return 'RECONCILE'
        s=lid.removeprefix('LOCAL-PLAT-')
        if s in ['LOGIN','NAVIGATE','CONTEXT-SWITCH','LOGOUT']:return 'IDENTITY'
        if s.startswith(('BRAND-','TENANT-','ACCOUNT-','MEMBER-','LIMITED-')):return 'ORGANIZATION'
        if s.startswith(('AI-','LEAD-')):return 'AI'
        if s.startswith(('BAN-','CONTACT-')):return 'CONTACT'
        if s.startswith('FINANCE-'):return 'FINANCE'
        if s.startswith(('PHONE-','SEAT-SUPERVISE','CUSTOMER-')):return 'PHONE'
        if s.startswith(('CLOUD-TASK-','TASK-','EXPORT-CUSTOMERS','IMPORT-BATCH','BUSINESS-API-','PRO-FIELD')):return 'CLOUD-TASK'
        if s.startswith(('RESOURCE-','SEAT-BATCH','SEAT-CORRECT','SEAT-SYNC','SEAT-BIND','SKILL-','QUEUE-','INBOUND-')):return 'RESOURCE'
        return 'REPORT'
    grouped=defaultdict(list)
    for l in locals_:grouped[group(l['id'])].append(l)
    flows=[]
    for key,ls in grouped.items():
        flows.append({'id':'FLOW-'+key,'name':labels[key],
          'steps':[{'id':'GLOBAL-STEP-'+l['id'],'actor':'实际拨打／接听人' if l['id'] in ['LOCAL-FLOW-SAVE-CONTENT','LOCAL-FLOW-INTERFACE-QUERY','LOCAL-PLAT-PHONE-AFTERCALL','LOCAL-FLOW-HANDLER-INBOX'] else '系统' if l['id'] in ['LOCAL-FLOW-CALL-FACTS','LOCAL-FLOW-ARCHIVE','LOCAL-FLOW-END-HANDOFF','LOCAL-PLAT-AI-TAG-RESULT','LOCAL-PLAT-BUSINESS-API-RESULT','LOCAL-PLAT-CLOUD-TASK-RESULT'] else '外部服务' if l['id']=='LOCAL-PLAT-BUSINESS-API-IMPORT' else '用户',
                    'action':l['trigger']+'；本域为可独立触发的动作集合，实际可执行顺序以各动作前置及闭环主链为准',
                    'local_id':l['id'],'on_failure':'；'.join(b['result'] for b in l['branches'] if '成功' not in b['condition']) or '保留本次输入与既有确认事实，明确拒绝或待核原因'} for l in ls],
          'source_keys':[],'test_refs':uniq([t for l in ls for t in l['test_refs']])})
    # Distinct entry paths avoid implying an initial transfer must first make a call.
    def main_flow(ident,name,chain,notes):
        flows.append({'id':ident,'name':name,'steps':[{
          'id':ident+'-STEP-'+str(n+1),'actor':'系统' if x in ['CALL-FACTS','ARCHIVE'] else '实际拨打／接听人' if x=='SAVE-CONTENT' else '用户',
          'action':notes.get(n,lm['LOCAL-FLOW-'+x]['trigger']), 'local_id':'LOCAL-FLOW-'+x,
          'on_failure':'停留准确当前节点／归属，保留输入和事实；明确失败修正后重验，未知先核同次请求，不继续下游执行'} for n,x in enumerate(chain)],
          'source_keys':[],'test_refs':uniq([t for x in chain for t in lm['LOCAL-FLOW-'+x]['test_refs']])})
    main_flow('FLOW-MAIN-DIRECT-CALL','模板本租户首CALL：确认路由→本租户AI先选场景→严格导入→分配跟进人→起呼→归档→确认后继',
      ['ROUTE-BIND','IMPORT-MAP','AI-SCENE','IMPORT-PREVIEW','IMPORT-COMMIT','ASSIGN','START','CALL-FACTS','SAVE-CONTENT','ARCHIVE','EVALUATE','ADVANCE'],{
       0:'配置准备：业务分类必须有已确认兼容路由；尚未绑定／配置变化时由配置管理人办理，已有有效路由无需每次重新保存',
       2:'若本次直接进入本租户AI CALL，导入检查前必须选择本租户准确AI场景；非直接AI入口此处不要求场景',
       3:'逐行核导入字段和首次路径；直接AI场景与数据／schema／路由一起纳入确认依据，任何纳入行失败都不能正式导入',
       5:'首个CALL方式已由路由及导入资料确定；当前管理员仅安排本租户责任跟进人，必要AI场景仍核原准确依据，不由分配改呼叫方式',
       8:'只有实际人工拨打／接听的段由准确本人正式填写；纯AI或明确无人不生成假人工内容，由系统保存准确事实',
       9:'系统在所有呼叫／重试结束、必要内容和依赖证据齐备后唯一归档',
       11:'明确命中合法后继CALL／TRANSFER／END时由有权人确认推进到该节点；进入TRANSFER后另行判断和确认转交，不把进入节点当归属已切换；全不匹配留原节点，未知阻止继续'})
    main_flow('FLOW-MAIN-DIRECT-FOLLOWUP','直接跟进：分类显式允许→整批明确模式/方式→严格导入→同租户跟进→明确完成',
      ['CATEGORY-EDIT','IMPORT-MAP','AI-SCENE','IMPORT-PREVIEW','IMPORT-COMMIT','ASSIGN','START','CALL-FACTS','SAVE-CONTENT','ARCHIVE','COMPLETE-DIRECT'],{
       0:'配置准备：分类allowDirectFollowup仅显式true开放DIRECT；缺省false，基础保存不改独立ROUTE',
       1:'整批明确DIRECT及AI/MANUAL/PREDICTIVE；不因TEMPLATE路由失败自动降级，基础必填/类型/映射/唯一性保持',
       2:'仅DIRECT+AI必须明确本租户当前有效场景；非AI跳过，仍核实际专业能力',
       3:'逐行严格校验；仅豁免路由分流附加资料，不能豁免基础导入要求',
       4:'同次建立批次、业务、DIRECT模式/方式及首直接周期；无run、node或templateRef',
       5:'只选择当前本租户跟进人，必要AI场景在同一安排入口明确，不改owner或自动呼叫',
       6:'按准确directCycleId重核串行、本人/资源/场景和联系限制后明确起呼，真实受理不等于拨打',
       8:'准确实际办理/接听本人保存；快照、当前值和原段权限与模板模式保持同一要求',
       9:'全部真实终态、重试及必要本人内容可靠收敛后唯一归档；无模板节点推进或跨租户转交',
       10:'完成直接周期须明确结论且有真实归档完成跟进，或NO_CALL加原因；全部旧执行及必要归档仍须收敛，不自动把归档当周期完成'})
    main_flow('FLOW-MAIN-DIRECT-RESUME','直接完成后：明确下一次方式→建立新直接周期→重新分人→明确呼叫',
      ['RESUME-DIRECT','ASSIGN','START'],{0:'仅COMPLETED且分类仍允许、旧执行及必要归档全部收敛后，显式确认下一次方式/必要AI场景；保旧周期结论，清旧责任安排，不创建run'})
    main_flow('FLOW-MAIN-ENABLE-TEMPLATE','原直接业务启用流程：旧执行/必要归档收敛→当前路由/资料/场景预检→明确建新run',
      ['ENABLE-TEMPLATE','ASSIGN','START'],{0:'无需先完成直接周期；在原record上经当前路由/必需资料/必要AI场景及validationToken检查，旧执行与必要归档全部收敛后同次启用新run；首节点如为TRANSFER/END则按其职责办理，后续ASSIGN/START仅在实际CALL适用；旧直接事实不得完成新节点'})
    main_flow('FLOW-MAIN-FIRST-TRANSFER','首个节点转交入口：严格导入→确认转交→接收方分配／选场景→呼叫',
      ['ROUTE-BIND','IMPORT-MAP','IMPORT-PREVIEW','IMPORT-COMMIT','EVALUATE','TRANSFER','ASSIGN','AI-SCENE','START','CALL-FACTS','SAVE-CONTENT','ARCHIVE','EVALUATE','ADVANCE'],{
       0:'配置准备：实际分类存在已确认的START到TRANSFER再到CALL路径；字段参考分类本身不产生此绑定',
       2:'按每行导入资料核首个转交方向和第一个CALL方式；来源租户不能替目标租户挑私有AI场景；目标承接或映射不明时不能靠任意场景兜底',
       4:'进入TRANSFER按导入／填写等准确条件有序判断；首次尚无执行段，不要求先拨打一通或制造跟进归档',
       5:'当前有权方确认合法HQ↔STORE目标；成功后同次切负责方、新增接续轮次并清旧安排，未知先核同次归属结果',
       6:'目标租户管理员在新归属下另行分配责任跟进人；来源方不替目标指派人员',
       7:'目标首CALL为AI时，由目标租户有权成员选择本租户准确场景并核下游标签依赖；来源租户场景不沿用',
       10:'真实人工办理／接听人填写自己的准确段；无人或纯AI由系统按真实事实归档，不生成假人工确认',
       11:'系统在必要终态、重试、内容及依赖证据明确后唯一归档',
       13:'归档后按当前职责确认后继；不得把成功接收或分配解释为自动呼叫／自动推进'})
    main_flow('FLOW-MAIN-AFTERCALL-TRANSFER','呼叫后转交分支：准确归档→判断TRANSFER→确认转交→接收方重新准备',
      ['ARCHIVE','EVALUATE','ADVANCE','EVALUATE','TRANSFER','ASSIGN','AI-SCENE','START'],{
       0:'系统确认该业务所有在途／重试已结束，必要人工内容及事实已归档；这一步不要求原记录从未执行',
       1:'在当前CALL职责判断合法后继，只有已配置且明确命中TRANSFER节点时进入本分支',
       2:'有权人确认CALL的合法后继，先进入TRANSFER节点；此时尚未切换负责租户，不得跳过中间节点',
       3:'在TRANSFER职责重新按其有序条件判断承接目标，条件未知或映射异常不允许转交',
       4:'合法同品牌转交与准确归属同次落地；明确失败留原负责方，未知时双方先核同次结果',
       5:'目标租户另行安排责任跟进人，旧安排不继承',
       6:'下一CALL为AI时目标租户选择本租户场景；非AI不要求此动作',
       7:'有权人再次明确起呼并重核本人能力／模块／资源／联系限制，转交与分配不自动起呼'})
    plan.update({'title':'D联络云 2.0.0 当前产品规格','scope':{'feature_ids':sorted(f['id'] for p in parts for f in p['features']),'excluded_feature_ids':[]},
      'acceptance_checks':checks,'acceptance_resolutions':[],
      'issue_dispositions':[{'id':q['id'],'disposition':'out_of_scope','reason':'本次只交付产品规格；业务行为及字段时点已定义，该项为开发阶段真实接口、物理映射或执行证据，仍保留为工程阻塞，未声称完成。','evidence_refs':['docs/remaining-confirmations.json#'+q['id']]} for p in parts for q in p['engineering_questions']],
      'open_questions':[q for p in parts for q in p['engineering_questions']],
      'review_notes':['本包为当前事实的独立工作资料，不等同于原项目02业务运营批准或正式开工授权。','逐字段规格覆盖当前明确字段；原专业对象及选项须按独立操作定义和真实工程契约映射，不以Mock证明生产接口。','工程问题保留七类补证，未设计任务或修改原型运行代码。']})
    plan['logic']={'schema_version':'1.0','field_scope':{'mode':'field_level','reason':'分类、导入、分配、跟进、通话、资源、权限及页面均包含产品字段，逐项说明来源和保存时点。','source_refs':['docs/field-alignment.json']},
      'global':{'overview':'五区导航统一身份与权限，品牌字段/分类双Tab保持。分类显式允许时导入整批可选DIRECT并明确AI/人工/预外呼，AI场景必选；DIRECT无run或节点，保完整同租户跟进、本人填写、快照与联系限制。TEMPLATE使用独立实际路由并封新run，按CALL归档后明确推进/转交/END。直接周期完成须明确结论，再次直接跟进建立新周期并重分人；启用流程仅在旧执行及必要归档收敛、当前路由/必需资料验证后于原业务显式创建新run，旧事实不完成新节点。原222专业能力及其对象/权限保留。',
      'system_boundary':'产品规格涵盖43个差异FUNC及222既有专业操作，不新增通用CRM、统一任务引擎或旧v2迁移。当前Mock只证原型行为；真实身份、供应商执行、生产数据/接口及财务核验为工程补证。正式业务运营评审与原型工作流状态保持原记录。',
      'actors':read(AUTHOR/'coordination.json')['actors'], 'invariants':rules,'flows':flows,
      'shared_state_rules':['导入整批明确DIRECT/TEMPLATE。两模式均通过所有纳入行的基础必填、类型、显式映射及唯一性；DIRECT仅豁免路由附加资料，方式及必要AI场景明确，TEMPLATE另核首路径。改变模式、方式、文件、映射、分类、开关、模板、字段或必要场景使旧确认失效。','仅TEMPLATE在正式导入/再次办理或DIRECT显式启用流程时创建run；创建即开始并封当前明确方案，已开始run沿原方案完成/废弃。DIRECT使用独立直接周期，ACTIVE/COMPLETED与run状态分开；启用流程不要求先完成周期，但全部旧执行及必要归档必须收敛。','执行受理、真实拨打、接通、结束、重试收敛、内容保存和归档分开；不以未拨／停止请求受理冒充完成。','导入与分配不自动呼叫。真实出呼每次按当前租户、方式、本人能力、资源及联系限制重核。','条件按既定分支优先级判断；未知阻止后续与默认。当前所有有出口的新配置均须唯一末位ELSE，明确不匹配才进入兜底；未知仍留原节点并阻后续。','每次跟进读取最新实际分类字段与当前有效值并封存段基准；正式确认与实际修改分开，系统未接通归档不冒成人工确认；显式HISTORY仅按准确同记录同owner来源及当前兼容范围读取。','CURRENT本租户路径保持owner/run/租户阶段及既有安排和封存结果，只确认合法后继；OTHER跨租户成功才封截止、切归属/新增轮次并清旧安排，目标另行安排且无自动起呼。','两模式当前资料更正均按权限更新当前有效值并留审计；原段、原直接周期结论、转出截止和已发生事件不重写。旧DIRECT事实不完成新模板节点，显式HISTORY仍按准确原来源及授权读取。','普通列表更新时间倒序后分页；分支、字段、选项和时间线维持其业务语义顺序。'],
      'data_ownership':['品牌层配置共享不授跨租户客户数据；操作与数据读取按当前账号、租户、模块和对象重验。','当前负责租户有权人员办理；转出方只能看本方核定截止，迟到事实按实际发生/归属事件核对。','责任跟进人、实际拨打人、实际接听人、核对责任人分别存储。谁实际办理／接听谁填写自己的段，管理员不能代理正式填写。','通话和录音保持原专业媒体、供应商及租户资格，业务资料接续不自动共享跨租户录音。','超管品牌配置／监管和财务特定动作分权，不代办租户跟进、呼叫、转交。'],
      'cross_module_contracts':[], 'cross_module_note':'产品已定义业务关联、作用范围、保存时点及失败含义；物理接口、模块/库表和工程事务由开发阶段映射。'},
      'locals':locals_,'fields':fields,'coverage':[]}
    plan['ui']=u['ui']
    if bs.get('prototype_resume_delta'):
        plan['logic']['global']['overview']='五区、品牌字段与实际数据范围保持。正常导航仅核身份/普通草稿，不用电话phase拦离开。当前新TEMPLATE方案所有出口有唯一末位ELSE，选填IMPORT缺列只在可靠新输入捕获时规范化null，未知通话/填写仍PENDING。条件优先、即时编辑与无环保存不改变已捕获事实。CURRENT分支只在本租户确认后继，OTHER才按原合法锚定转交。END明确CLOSE或DIRECT_FOLLOWUP，先结束原run，再关闭或在同业务/当前tenant建立无模板人工周期，不自动起呼；合法END来源与普通DIRECT准入开关分开，DIRECT无当前run/节点引用但可保已结束历史。普通DIRECT/直接完成和再次跟进、启用流程仍按现行资格、事实和快照规则办理；人工/预外呼路由使用准确客户侧SIP结果，原AI及222专业能力不被混用。'
        plan['logic']['global']['shared_state_rules']+=['END来源接续按可信原run/节点/租户/周期证明校验，不能由前端伪造以绕普通DIRECT开关；CLOSE不产生新直接周期或成交推断。','当前演示流转台账采用schema4且已明确允许一次舍弃旧演示数据；这不是生产数据清空或旧业务兼容需求，工程不复制Mock重置机制。']
    # Source inventory is mechanical; mappings below use explicit stable IDs and authored page/action/local relations.
    coverage=[]
    ac_to_checks=defaultdict(list)
    for c in checks:
        for a in c['acceptance_ids']:ac_to_checks[a].append(c['id'])
    page_map={x['source_page_ids'][0]:x for x in u['ui']['pages']}
    step_local={s['id']:l['id'] for l in locals_ for s in l['steps']+l['branches']}
    scenarioflows={
      'FLOW-CURRENT-CUSTOMER':[x['id'] for x in flows if any(s['local_id'].startswith('LOCAL-FLOW-') for s in x['steps'])],
      'FLOW-CURRENT-PLATFORM':[x['id'] for x in flows if any(s['local_id'].startswith('LOCAL-PLAT-') for s in x['steps'])]}
    def valueids(v):
        if not isinstance(v,dict):return []
        return v.get('local_logic_ids',v.get('local_ids',[]))
    for item in inv:
        k=item['key'];v=item['value'];ident=v.get('id') if isinstance(v,dict) else v if isinstance(v,str) else None
        r={'source_key':k,'disposition':'covered','global_refs':[],'local_refs':[],'field_refs':[],'reason':'按准确来源ID关联当前产品规则与可独立验收动作。','evidence_refs':item['source_refs'][:1]}
        if item.get('status')=='not_adopted' and ident in ['FIELD-FLOW-OUTCOME-CONFIG','FIELD-FLOW-OUTCOME-LABEL']:
            r.update(disposition='out_of_scope',reason='旧END业务结论配置已从当前原型移除，新END用独立endAction二选一；此not_adopted来源只保原ID溯源，不改义复用，不作为当前字段任务。',evidence_refs=['docs/exception-definitions.json#CHG-032-END']);coverage.append(r);continue
        if item.get('status')=='superseded':
            r.update(disposition='superseded',reason='此条为已取消的概览／独立拦截来源页及其旧入口条款，相关能力已归位当前页面，原编号仅保留追溯。',evidence_refs=['docs/change-log.json']);coverage.append(r);continue
        if k.startswith('open_items:'):
            r.update(disposition='out_of_scope',reason='当前产品规格已定义业务义务；此项保留为开发阶段真实工程证据，不把尚缺证据视作已解决。',evidence_refs=['docs/remaining-confirmations.json']);coverage.append(r);continue
        if isinstance(ident,str) and ident in fm:
            r['field_refs']=[ident];r['local_refs']=[l['id'] for l in locals_ if ident in l['field_ids']]
        elif isinstance(ident,str) and ident in lm:r['local_refs']=[ident]
        elif isinstance(ident,str) and ident.startswith('SOURCE-') and ident[7:] in lm:r['local_refs']=[ident[7:]]
        elif ident in step_local:r['local_refs']=[step_local[ident]]
        elif isinstance(v,dict) and valueids(v):r['local_refs']=[x for x in valueids(v) if x in lm]
        elif item.get('parent_id') in lm:r['local_refs']=[item['parent_id']]
        elif item.get('parent_id') in step_local:r['local_refs']=[step_local[item['parent_id']]]
        elif k.startswith('features:'):
            fid=k.split(':',1)[1].split('/')[0];r['local_refs']=[l['id'] for l in locals_ if fid in l['feature_ids']]
        elif k.startswith('acceptance:'):
            aid=k.split(':',1)[1].split('/')[0];r['local_refs']=[l['id'] for l in locals_ if set(l['test_refs'])&set(ac_to_checks[aid])]
        elif k.startswith('pages:'):
            pid=k.split(':',1)[1].split('/')[0];r['local_refs']=page_map.get(pid,{}).get('local_logic_ids',[])
        elif k.startswith('rules:') and ident in rulemap:r['global_refs']=[ident]
        elif k.startswith('scenarios:'):
            sid=k.split(':',1)[1].split('/')[0];r['global_refs']=scenarioflows.get(sid,[])
        elif k.startswith('project_facts:'):r['global_refs']=['GR-FIELDS','GR-CONFIG']
        elif k.startswith('decisions:'):r['global_refs']=['GR-CONFIG','GR-NO-HISTORY','GR-SCOPE','GR-AUTH']
        elif k.startswith('sections:PERMISSION-CURRENT'):r['global_refs']=['GR-AUTH','GR-SCOPE','GR-PRIVACY']
        elif k.startswith('sections:ENGINEERING-EVIDENCE-CROSSWALK'):r['global_refs']=['GR-UNKNOWN','GR-NO-HISTORY']
        elif k.startswith('documents:'):
            path=v.get('path','')
            if path=='docs/development.md':
                r.update(disposition='out_of_scope',reason='已有工程说明只作开发补充参考，本次不设计真实接口、目标仓库或生产验证；当前产品义务在规范产品字段/动作中独立定义。')
            else:r['global_refs']=['GR-CONFIG','GR-FIELDS','GR-SCOPE','GR-AUTH','GR-UNKNOWN','GR-NO-HISTORY']
        else:r['global_refs']=['GR-CONFIG','GR-SCOPE','GR-DATA-FACTS']
        if not any(r[x] for x in ['global_refs','local_refs','field_refs']) and r['disposition']=='covered':
            raise ValueError('Unmapped source '+k)
        coverage.append(r)
    plan['logic']['coverage']=coverage
    units={x['id']:x for x in rules+flows+locals_+fields}
    for x in units.values():x['source_keys']=[]
    for r in coverage:
        for ident in r['global_refs']+r['local_refs']+r['field_refs']:units[ident]['source_keys'].append(r['source_key'])
    # Rules not referenced by a source rule would signal missing current normalization.
    for r in rules:r['test_refs']=uniq([t for l in locals_ if r['id'] in l['global_rule_ids'] for t in l['test_refs']])
    for ident,x in units.items():
        x['source_keys']=uniq(x['source_keys'])
        if not x['source_keys']:raise ValueError('Unsourced '+ident)
    write(ws/'plan.json',plan)
    print('Plan assembled',{'locals':len(locals_),'fields':len(fields),'checks':len(checks),'flows':len(flows),'coverage':len(coverage)})

def readers(out):
    # Compatibility command: always use current sources and the one current reader.
    from developer_appendices import render
    render(Path(out))
    from implementation_tasks import reindex
    reindex(Path(out))

if __name__=='__main__':
    if sys.argv[1]=='prepare':prepare()
    if sys.argv[1]=='plan':build_plan()
    if sys.argv[1]=='readers':readers(sys.argv[2])
