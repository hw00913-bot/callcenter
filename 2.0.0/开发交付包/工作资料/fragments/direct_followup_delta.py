"""Apply the approved DIRECT/TEMPLATE product delta to authored fragments.

This module only edits product documents. It does not prepare/export a package,
change workflow state, or touch prototype runtime files.
"""
from copy import deepcopy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ALLOW = 'FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP'
MODE = 'FIELD-FLOW-HANDLING-MODE'
METHOD = 'FIELD-FLOW-DIRECT-METHOD'
ENABLE = 'LOCAL-FLOW-ENABLE-TEMPLATE'
CHECK_ENABLE = 'CHECK-FLOW-ENABLE-TEMPLATE'
MODE_RULE = 'GR-HANDLING-MODE'


def unique(values):
    return list(dict.fromkeys(values))


def apply_business(data):
    if data.get('direct_followup_delta') == '20261030-1':
        return data
    fields = {row['id']: row for row in data['fields']}
    locals_ = {row['id']: row for row in data['locals']}
    checks = {row['id']: row for row in data['checks']}
    features = {row['id']: row for row in data['features']}
    cfg = fields['FIELD-FLOW-CATEGORY-LABEL']['permissions']
    bus = fields['FIELD-FLOW-ARRANGEMENT']['permissions']

    def field(ident, name, entity, key, typ, fmt, required, default, rules, permissions, when, valid, invalid):
        row = {
            'id': ident, 'name': name, 'entity': entity, 'key': key,
            'source_refs': ['docs/field-alignment.json#' + ident], 'source_keys': [],
            'type': typ, 'format': fmt, 'nullable': ident == METHOD,
            'required_when': required, 'default': default,
            'validation_rules': rules, 'permissions': deepcopy(permissions),
            'lifecycle': [
                {'state': '输入与预检', 'behavior': '依据准确分类、当前办理模式及授权逐项校验；变更后旧预览和确认依据失效。'},
                {'state': '明确成功', 'behavior': when},
                {'state': '失败或未知', 'behavior': '失败保留原值和输入；未知沿同次请求核对，不新建副本或静默切换办理模式。'},
                {'state': '后续使用', 'behavior': '当前配置只控制新选择；旧执行与快照按其实际模式、方式和来源保留。'}],
            'derivation': {'kind': 'input', 'rule': '；'.join(rules), 'dependencies': []},
            'persistence': {'kind': 'stored', 'write_when': when},
            'examples': {'valid': valid, 'invalid': invalid}, 'test_refs': []}
        fields[ident] = row

    field(ALLOW, '允许直接跟进', 'BusinessCategory', 'allowDirectFollowup', 'boolean', 'true / false',
          '分类新建与编辑明确保存；缺省为false',
          {'kind': 'literal', 'value': False, 'rule': '仅显式true开放DIRECT新导入；缺省、缺失或未知均不授直接跟进资格。'},
          ['true仅开放直接跟进选项，不代替导入/呼叫/本人填写/资料维护权限，也不代替AI、人工或预外呼能力。',
           '关闭后禁止新增DIRECT业务及新增直接执行安排；已受理执行、必要本人填写与归档继续准确收尾，已有快照不删。',
           '不自动把既有DIRECT改为TEMPLATE，不创建run；启用流程须单独预检并明确确认。'], cfg,
          '分类BASE明确保存成功时，与基础配置及修订依据同次保存；不改独立ROUTE及已存在业务的实际办理模式。',
          ['分类显式保存true后，导入抽屉显示“直接跟进”可选。'],
          ['旧分类未含此值即视为false，不能因有字段或AI场景自动开放DIRECT。'])
    field(MODE, '业务办理模式', 'BusinessRecord', 'handlingMode', 'enum', 'DIRECT / TEMPLATE',
          '整批导入必须明确确认一种；业务正式保存后持有实际模式',
          {'kind': 'literal', 'value': 'TEMPLATE', 'rule': '沿现有模板流转入口初始展示TEMPLATE；用户提交时明确确认，预检失败不得自动降级DIRECT。'},
          ['同批所有纳入行使用同一模式，逐行仍独立校验唯一身份；不同模式分批办理。',
           'DIRECT要求所选分类allowDirectFollowup显式true；无run、无当前节点、无planSnapshot，不虚造直接呼叫节点。',
           'TEMPLATE要求实际分类当前有效路由、必要分流资料及兼容模板；按原规则捕获run和首节点。',
           'DIRECT与TEMPLATE的转换须由有权人明确执行“启用流程”并成功后变为TEMPLATE；不能在普通分配/起呼时切换。'],
          bus, '正式导入成功时随批次证据与每条业务同次保存；后续启用流程明确成功时在同一业务上记录DIRECT→TEMPLATE及新run，保留原直接跟进事实。',
          ['同批选择DIRECT+MANUAL，两条业务各自建立身份且没有run。'],
          ['TEMPLATE缺路由后自动改为DIRECT继续导入，禁止。'])
    field(METHOD, '直接跟进呼叫方式', 'BusinessRecord', 'directMethod', 'enum', 'AI / MANUAL / PREDICTIVE',
          'handlingMode=DIRECT时导入必须明确；TEMPLATE不使用此值',
          {'kind': 'none', 'value': None, 'rule': 'DIRECT不预选方式；必须明确AI、人工或预外呼，不从模板/首项/旧通话猜测。'},
          ['DIRECT整批明确一种方式；AI必须在导入与分配选定本租户有效且分类适配的AI场景。',
           'MANUAL仍核实际本人电话资格；PREDICTIVE仍核唯一有效专业执行方案；不在人员分配中选择任务/线路/队列。',
           '直接安排的方式只供DIRECT执行；启用流程后按新run节点方式重新安排，不借旧方式完成新节点。'],
          bus, 'DIRECT正式导入时与模式和必要AI场景同次保存，实际受理再捕获真实方式、场景和资源；TEMPLATE保留历史直接方式但不作为当前执行方式。',
          ['DIRECT+AI选本租户SCENE-A并通过名单预检后保存。'],
          ['DIRECT未选方式、AI无场景、或以IVR充当直接跟进方式，均拒绝。'])

    def add_fields(local, ids, inputs=True, outputs=False):
        row = locals_[local]
        row['field_ids'] = unique(row['field_ids'] + ids)
        if inputs:
            row['inputs'] = unique(row['inputs'] + ids)
        if outputs:
            row['outputs'] = unique(row['outputs'] + ids)
        row['global_rule_ids'] = unique(row['global_rule_ids'] + [MODE_RULE])

    def step(local, number, action, reads=(), writes=()):
        row = locals_[local]
        ident = 'STEP-' + local.removeprefix('LOCAL-') + '-' + str(number)
        entry = next((x for x in row['steps'] if x['id'] == ident), None)
        if entry is None:
            entry = {'id': ident, 'action': action, 'reads': [], 'writes': [], 'rule_ids': []}
            row['steps'].append(entry)
        entry['action'] = action
        entry['reads'] = unique(entry['reads'] + list(reads))
        entry['writes'] = unique(entry['writes'] + list(writes))
        entry['rule_ids'] = unique(entry['rule_ids'] + row['global_rule_ids'] + [MODE_RULE])

    def branch(local, suffix, condition, result, ids):
        row = locals_[local]
        ident = 'BRANCH-' + local.removeprefix('LOCAL-') + '-' + suffix
        entry = {'id': ident, 'condition': condition, 'result': result,
                 'field_ids': ids, 'test_refs': row['test_refs']}
        row['branches'] = [x for x in row['branches'] if x['id'] != ident] + [entry]

    for local in ['LOCAL-FLOW-CATEGORY-CREATE', 'LOCAL-FLOW-CATEGORY-EDIT']:
        add_fields(local, [ALLOW], outputs=True)
        step(local, 1, '校名称、编码列名、业务域和两用途字段；显式保存允许直接跟进开关，缺省false', [ALLOW], [ALLOW])
        step(local, 2, '同次保存BASE、字段及allowDirectFollowup，不提交ROUTE；配置开关不重写既有业务模式', [ALLOW], [ALLOW])
        branch(local, 'DIRECT', '开关缺失、false或读取未知', '新DIRECT导入和新增直接执行安排不可用；原受理执行及必要本人填写、归档保准确收尾。', [ALLOW])

    add_fields('LOCAL-FLOW-IMPORT-MAP', [ALLOW, MODE, METHOD, 'FIELD-FLOW-AI-SCENE'])
    step('LOCAL-FLOW-IMPORT-MAP', 4,
         '整批明确DIRECT或TEMPLATE；DIRECT显式选择AI/MANUAL/PREDICTIVE，AI明确场景。模式/方式/分类/场景/名单/映射变化均使旧预检失效',
         [ALLOW, MODE, METHOD, 'FIELD-FLOW-AI-SCENE'], ['FIELD-FLOW-IMPORT-TOKEN'])
    p = locals_['LOCAL-FLOW-IMPORT-PREVIEW']
    p['title'] = '按办理模式逐行严格预检及诊断'
    p['preconditions'] = ['管理员导入资格有效', '整批明确办理模式；DIRECT分类显式允许且方式明确，TEMPLATE实际分类绑定已确认有效流程']
    add_fields(p['id'], [ALLOW, MODE, METHOD])
    step(p['id'], 1, '两模式均校系统必需、分类导入必填、IMPORT类型/选项/编码映射及同品牌业务唯一性', [MODE])
    step(p['id'], 2, 'TEMPLATE按真实行数据判断首路径/首CALL及场景；DIRECT只豁免路由分流所需的附加资料，不读取路由或生成节点，校显式方式与AI必要场景', [ALLOW, MODE, METHOD])
    step(p['id'], 3, '仅全部行通过才生成绑定模式、方式、数据、字段、分类开关和必要场景的token；TEMPLATE额外绑定路由及方案', [ALLOW, MODE, METHOD])
    # Old routing branches apply exclusively to TEMPLATE.
    for row in p['branches']:
        if row['id'].endswith(('-1', '-2')) and not row['condition'].startswith('TEMPLATE'):
            row['condition'] = 'TEMPLATE且' + row['condition']
    branch(p['id'], 'DIRECT', 'DIRECT缺基础必填、类型/映射/唯一性失败、分类未显式允许、方式未选或AI无有效场景',
           '逐行具体报错，保名单且无有效token；不因仅绕过路由而放宽任何基础校验，也不静默转TEMPLATE。', [ALLOW, MODE, METHOD, 'FIELD-FLOW-IMPORT-TOKEN'])
    for row in p['branches']:
        if row['id'].endswith('-4'):
            row['result'] = '展示每行当前模式及DIRECT显式方式或TEMPLATE首CALL/无需呼叫和确认依据。'

    p = locals_['LOCAL-FLOW-IMPORT-COMMIT']
    add_fields(p['id'], [ALLOW, MODE, METHOD], outputs=True)
    step(p['id'], 1, '按确认模式重核每行与最新配置；模式/方式/分类开关/字段/名单/映射/必要场景变化则拒旧token，TEMPLATE另核路由', [ALLOW, MODE, METHOD])
    step(p['id'], 2, '同次建立批次、稳定业务、原始来源、初始负责租户和模式；仅TEMPLATE捕获完整plan并创建run，DIRECT保存显式方式及必要场景，不创建run或节点', [MODE, METHOD], [MODE, METHOD])
    step(p['id'], 3, 'TEMPLATE定位首业务节点；DIRECT进入同租户待安排队列并显示“直接跟进”，无模板推进/转交入口', [MODE, METHOD])
    for row in p['branches']:
        if row['id'].endswith('-2'):
            row['result'] = '台账定位同次记录/批次；TEMPLATE导入定位即开始run，DIRECT无run/node且等待分配，不自动呼叫。'
    branch(p['id'], 'MODE', '所选模式不可用或任一行失败', '整批不创建部分业务，不自动改模式重试；未知沿同请求核对。', [MODE, 'FIELD-FLOW-IMPORT-TOKEN'])

    p = locals_['LOCAL-FLOW-ASSIGN']
    p['trigger'] = '在直接跟进业务或当前CALL记录点击安排'
    p['preconditions'] = ['当前owner租户管理员及task.assign动作权', 'DIRECT分类当前允许且方式明确，或TEMPLATE为ACTIVE run的CALL节点；无在途/排队/重试/未知执行及必要未归档内容']
    add_fields(p['id'], [ALLOW, MODE, METHOD])
    step(p['id'], 1, '按DIRECT显式方式或TEMPLATE节点方式读取同源候选；人工核电话资格，AI/预外呼责任人不强坐席', [MODE, METHOD])
    step(p['id'], 2, '仅选择本租户跟进人；AI场景在同一导入与分配安排入口明确且有效，DIRECT不要求节点标签路由依赖；保存不改方式或owner', [ALLOW, MODE, METHOD])
    add_fields('LOCAL-FLOW-ASSIGN-BATCH', [ALLOW, MODE, METHOD])
    step('LOCAL-FLOW-ASSIGN-BATCH', 3, 'DIRECT按模式/分类/方式/场景等当前权威安排分组，TEMPLATE另按run捕获方案和CALL身份分组；混组拒绝，不以空nodeId误合直接业务', [MODE, METHOD])

    p = locals_['LOCAL-FLOW-AI-SCENE']
    p['trigger'] = 'DIRECT+AI导入或当前AI安排显式选择场景'
    add_fields(p['id'], [MODE, METHOD])
    step(p['id'], 2, 'DIRECT仅核本租户/分类准确启用场景及专业执行配置；TEMPLATE额外汇总本CALL及下游AI_TAG依赖并核准确上下文', [MODE, METHOD])

    p = locals_['LOCAL-FLOW-START']
    p['preconditions'] = ['对准确业务有当前本租户办理权', '确认业务/owner/模式及并发依据一致；TEMPLATE另核准确run/node',
                          '已安排责任人，DIRECT分类当前允许且显式方式明确；必要AI场景当前有效',
                          '前次所需内容和事实已归档，所有在途/重试/未知已收敛，联系限制与号码协调允许']
    add_fields(p['id'], [ALLOW, MODE, METHOD])
    step(p['id'], 1, '重核当前人/owner/模式、DIRECT开关/显式方式或TEMPLATE准确run/node、场景与唯一资源、所有联系限制和号码协调', [ALLOW, MODE, METHOD])
    step(p['id'], 3, '两模式均产生准确唯一跟进并封最新分类定义/值和真实方式/场景；DIRECT不生成run/node，TEMPLATE绑定准确当前run/node，受理不当拨打', [MODE, METHOD])
    add_fields('LOCAL-FLOW-START-BATCH', [ALLOW, MODE, METHOD])
    step('LOCAL-FLOW-START-BATCH', 4, 'DIRECT同方式同有效安排组也可明确批量发起AI/预外呼；逐条重核模式、串行占用及联系限制，人工仍逐条本人办理', [ALLOW, MODE, METHOD])

    for local in ['LOCAL-FLOW-CALL-FACTS', 'LOCAL-FLOW-SAVE-CONTENT', 'LOCAL-FLOW-ARCHIVE', 'LOCAL-FLOW-CORRECT', 'LOCAL-FLOW-HANDLER-INBOX', 'LOCAL-FLOW-INTERFACE-QUERY']:
        add_fields(local, [MODE], inputs=True)
        step(local, len(locals_[local]['steps']) + 1,
             'DIRECT沿准确record/owner/followup/attempt和实际办理人处理，同样保本人填写、正式快照、当前值权限及迟到隔离；无run/node不构造假模板身份。TEMPLATE仍核原准确run/node。', [MODE])
    step('LOCAL-FLOW-ARCHIVE', 2, '两模式必要真实终态、重试与本人内容明确后唯一归档；TEMPLATE另核配置下游依赖，DIRECT无模板路由依赖且归档后回同租户待跟进，不自动新起呼', [MODE])
    step('LOCAL-FLOW-SAVE-CONTENT', 3, '同次封内容/修改/确认快照；仅准确当前owner/stage且同一办理模式身份的provided更新当前值；TEMPLATE另要求同run，DIRECT以准确直接段身份隔离', [MODE])

    for local in ['LOCAL-FLOW-EVALUATE', 'LOCAL-FLOW-ADVANCE', 'LOCAL-FLOW-TRANSFER', 'LOCAL-FLOW-REOPEN', 'LOCAL-FLOW-RECLASSIFY', 'LOCAL-FLOW-ABANDON']:
        add_fields(local, [MODE])
        if local != 'LOCAL-FLOW-RECLASSIFY':
            locals_[local]['preconditions'] = ['handlingMode=TEMPLATE且准确当前run/node可核'] + [x for x in locals_[local]['preconditions'] if 'handlingMode=TEMPLATE' not in x]
        branch(local, 'DIRECT', '当前业务为DIRECT', '拒绝模板判断、推进、转交、废弃运行或模板重开；同租户再次直接跟进沿直接起呼入口，后续流程走独立“启用流程”预检。', [MODE])

    # The added action owns switching an existing direct business into a new template run.
    template = deepcopy(locals_['LOCAL-FLOW-REOPEN'])
    template.update({
        'id': ENABLE, 'title': '在原业务显式启用当前分类流程',
        'feature_ids': ['FUNC-2036', 'FUNC-2039'], 'trigger': '当前有权管理员在DIRECT业务详情明确选择“启用流程”并预检确认',
        'preconditions': ['当前负责租户管理员具有本条业务维护与流程启用动作资格',
                          '当前业务为DIRECT且同一稳定record、brand、category、owner及修订依据明确',
                          '全部旧直接执行、排队、重试和未知请求可靠收敛；实际办理人必要内容与归档均完成',
                          '当前实际分类存在明确生效的兼容路由；所有基础必填、类型/映射/唯一性及本次路由必要资料已按受控入口补齐'],
        'postconditions': ['原业务与原批次保持；明确成功后模式变为TEMPLATE，创建新的run并封当前方案及首节点，清旧安排；不自动转交或起呼',
                           '全部旧DIRECT事实与快照保持原身份，不能完成新run的CURRENT_NODE/CURRENT_ROUND节点要求；显式HISTORY仍只按准确授权读取'],
        'inputs': [MODE, 'FIELD-FLOW-RECORD-ID', 'FIELD-FLOW-RECORD-REVISION', 'FIELD-FLOW-CATEGORY-ID', 'FIELD-FLOW-OWNER-TENANT', 'FIELD-FLOW-IMPORT-VALUES', 'FIELD-FLOW-ROUTE-MAIN'],
        'outputs': [MODE, 'FIELD-FLOW-RUN-ID', 'FIELD-FLOW-EFFECTIVE-PLAN', 'FIELD-FLOW-NODE-RUN-ID', 'FIELD-FLOW-ARRANGEMENT', 'FIELD-FLOW-ENTRY-DECISION'],
        'steps': [
            {'id': 'STEP-FLOW-ENABLE-TEMPLATE-1', 'action': '在准确原业务检查当前路由、首路径及必需资料；只按稳定字段身份复用当前值，缺资料经有权维护补齐后重新预检，不重复导入',
             'reads': [MODE, 'FIELD-FLOW-CATEGORY-ID', 'FIELD-FLOW-IMPORT-VALUES', 'FIELD-FLOW-ROUTE-MAIN', 'FIELD-FLOW-RECORD-REVISION'], 'writes': [], 'rule_ids': [MODE_RULE, 'GR-CONFIG', 'GR-FIELDS', 'GR-SERIAL']},
            {'id': 'STEP-FLOW-ENABLE-TEMPLATE-2', 'action': '提交前重核全部旧执行及必要归档收敛、owner和当前配置；未满足或预览过期均不改模式、不建run',
             'reads': [MODE, 'FIELD-FLOW-EXECUTION-STATE', 'FIELD-FLOW-ARCHIVE-STATE', 'FIELD-FLOW-OWNER-TENANT', 'FIELD-FLOW-RECORD-REVISION'], 'writes': [], 'rule_ids': [MODE_RULE, 'GR-SERIAL', 'GR-UNKNOWN', 'GR-AUTH']},
            {'id': 'STEP-FLOW-ENABLE-TEMPLATE-3', 'action': '同次记录启用事件、DIRECT→TEMPLATE、新run及当前完整方案，按当前负责方定位首节点并清旧人/场景安排；旧事实只归旧直接段',
             'reads': [MODE, 'FIELD-FLOW-RECORD-ID', 'FIELD-FLOW-CATEGORY-ID', 'FIELD-FLOW-OWNER-TENANT', 'FIELD-FLOW-ROUTE-MAIN'],
             'writes': [MODE, 'FIELD-FLOW-RUN-ID', 'FIELD-FLOW-EFFECTIVE-PLAN', 'FIELD-FLOW-NODE-RUN-ID', 'FIELD-FLOW-ENTRY-DECISION', 'FIELD-FLOW-ARRANGEMENT'], 'rule_ids': [MODE_RULE, 'GR-CONFIG', 'GR-DATA-FACTS', 'GR-UNKNOWN']}],
        'branches': [
            {'id': 'BRANCH-FLOW-ENABLE-TEMPLATE-1', 'condition': '路由无效、必需资料不齐、旧执行未知/在途、必要本人归档未完成或并发冲突', 'result': '保原业务DIRECT及全部输入，具体显示缺口与合法处理入口，不创建run或假归档。', 'field_ids': [MODE, 'FIELD-FLOW-RUN-ID', 'FIELD-FLOW-IMPORT-VALUES'], 'test_refs': [CHECK_ENABLE]},
            {'id': 'BRANCH-FLOW-ENABLE-TEMPLATE-2', 'condition': '明确成功', 'result': '原record同owner创建新run；后续按模板分配、转交及实际新呼叫规则办理，旧直接通话/标签/内容不能完成新节点。', 'field_ids': [MODE, 'FIELD-FLOW-RUN-ID', 'FIELD-FLOW-ARRANGEMENT'], 'test_refs': [CHECK_ENABLE]},
            {'id': 'BRANCH-FLOW-ENABLE-TEMPLATE-3', 'condition': '同次启用结果未知或重复确认', 'result': '按准确原请求核对或返回同次已创建run，不另建第二run、不重新导入业务。', 'field_ids': ['FIELD-FLOW-REQUEST-ID', 'FIELD-FLOW-RUN-ID'], 'test_refs': [CHECK_ENABLE]}],
        'global_rule_ids': [MODE_RULE, 'GR-CONFIG', 'GR-FIELDS', 'GR-SERIAL', 'GR-SCOPE', 'GR-AUTH', 'GR-UNKNOWN', 'GR-DATA-FACTS'],
        'source_refs': ['documentation/input/functions.json#FUNC-2036', 'docs/四节点与客户跟进闭环需求记录.md#17'], 'source_keys': [], 'test_refs': [CHECK_ENABLE]})
    template['field_ids'] = unique(template['inputs'] + template['outputs'] + [x for s in template['steps'] for x in s['reads'] + s['writes']] + [x for b in template['branches'] for x in b['field_ids']])
    locals_[ENABLE] = template
    checks[CHECK_ENABLE] = {'id': CHECK_ENABLE, 'acceptance_ids': ['AC-2112', 'AC-2113', 'AC-2129'],
        'procedure': '已有DIRECT业务完成一次真实跟进；当前分类先无路由、再有缺必需分流资料的有效路由，补齐后保留一次未知旧执行，再令旧执行真实结束而本人内容未归档，最后完整收敛；分别尝试启用流程，并在明确成功后重放请求、尝试以旧直接通话和结果完成新CALL。',
        'expected': '各缺口均在原业务明确反馈且不建run、不重复导入；全部满足并明确确认后同record/brand/owner保留原批次和旧事实，模式成为TEMPLATE且只建一个新run并清旧安排；新节点不借旧DIRECT通话、标签或内容判完成，未知按同请求核对。'}

    for local in ['LOCAL-FLOW-QUERY', 'LOCAL-FLOW-BATCH-READ', 'LOCAL-FLOW-DETAIL', 'LOCAL-FLOW-CUSTOMER-TIMELINE']:
        add_fields(local, [MODE, METHOD], inputs=False, outputs=True)
        step(local, len(locals_[local]['steps']) + 1, '按准确身份展示模式与方式；DIRECT无当前run/节点显示“直接跟进”，保完整有权跟进/通话/快照及当前资料更正入口，不显示可办理模板转交或推进。', [MODE, METHOD])

    updates = {
        'FUNC-2016': '在有权品牌维护独立IMPORT/FOLLOWUP字段库及分类双Tab，明确业务域、字段与入口必填；分类显式allowDirectFollowup控制直接跟进可选，缺省false；保存基础不绑定模板或起呼。',
        'FUNC-2017': '按引用保护维护分类字段及allowDirectFollowup；关闭不删旧直接事实或阻必要收尾，不自动切换模式；新跟进读当前定义，旧运行及正式快照保持。',
        'FUNC-2031': '明确发起同租户DIRECT或TEMPLATE当前CALL的AI/人工/预外呼；按准确模式身份核串行、本人/场景/资源和联系限制，同组AI/预外呼可逐条核验后批量发起。',
        'FUNC-2032': 'DIRECT与TEMPLATE均按准确实际办理/接听人保存必要内容、真实通话及当时定义和值快照，重试可靠收敛后唯一归档；当前更正独立留痕，不借旧事实完成新节点。',
        'FUNC-2033': '查看有权业务的实际模式、当前资料、完整跟进和通话快照；DIRECT无run或节点，模板方案/运行只对真实TEMPLATE显示，转出截止和最小本人表单资格保持。',
        'FUNC-2036': '整批明确DIRECT或TEMPLATE后严格预检及导入：DIRECT须分类显式允许、方式明确且AI场景必选，仅豁免路由附加资料，不建run/node；TEMPLATE沿当前路由建run。已有直接业务后续显式启用流程，在旧执行与必要归档收敛且当前路由资料通过后于原业务建新run，不重复导入。',
        'FUNC-2037': '按准确当前模式/方式只分配本租户责任跟进人，AI场景在导入与分配同一安排明确；不选择任务/线路/队列，不改owner/方式、不自动起呼。',
        'FUNC-2038': '仅TEMPLATE在准确run/node按明确归档依据判断及确认后继；DIRECT不提供模板推进或转交。',
        'FUNC-2039': '查询模式、批次、队列和下一步；DIRECT显示同租户待安排/起呼/结果/本人填写/待核及再次跟进，允许有权人经独立预检显式启用流程。'}
    for ident, description in updates.items():
        features[ident]['description'] = description
    for f in features.values():
        f['bounds']['included_scope'] = [x['title'] for x in locals_.values() if f['id'] in x['feature_ids']]

    # Clarify existing field identities without replacing or renumbering them.
    for ident in ['FIELD-FLOW-RUN-ID', 'FIELD-FLOW-NODE-RUN-ID', 'FIELD-FLOW-EFFECTIVE-PLAN', 'FIELD-FLOW-ENTRY-DECISION']:
        row = fields[ident]
        row['required_when'] = '仅TEMPLATE真实建立流程运行时必需；DIRECT不生成此对象或伪填身份'
        row['validation_rules'] = unique(row['validation_rules'] + ['DIRECT无run、节点和模板方案；后续启用流程须在旧执行与必要归档全部收敛且当前路由/必需资料验证后创建全新run，旧直接事实不完成新节点。'])
        row['derivation']['rule'] = '仅TEMPLATE：' + row['derivation']['rule'].removeprefix('仅TEMPLATE：')
        row['persistence']['write_when'] = '仅TEMPLATE正式导入/再次办理/受控转类或从DIRECT显式启用流程明确成功时，按原业务身份封存新run相关事实；DIRECT直接导入和直接跟进不生成。'
        row['lifecycle'][0]['behavior'] = 'DIRECT期间不生成；TEMPLATE新run建立即冻结其准确方案与身份，不因尚未拨打而允许重写。'
    fields['FIELD-FLOW-METHOD']['validation_rules'] = unique(fields['FIELD-FLOW-METHOD']['validation_rules'] + ['本字段仍是模板FlowNode.methods；DIRECT使用独立directMethod，不改本字段原身份和业务含义。'])
    fields['FIELD-FLOW-AI-SCENE']['required_when'] = 'DIRECT+AI导入必选；TEMPLATE本租户直接AI入口及当前AI安排必选；非AI不使用'
    fields['FIELD-FLOW-AI-SCENE']['validation_rules'] = unique(fields['FIELD-FLOW-AI-SCENE']['validation_rules'] + ['DIRECT按本租户/分类及真实专业能力校场景，不要求不存在的模板节点或下游标签路由依赖；启用流程后清旧安排并按新节点重新核。'])

    # Keep original AC identities; added CHECKs refine their observable behavior.
    for row in data['acceptance_updates']:
        if row['id'] == 'AC-2107':
            row['statement'] += ' DIRECT只由分类显式allowDirectFollowup开放；TEMPLATE路由缺失/待核不能自动降级DIRECT。'
        if row['id'] == 'AC-2112':
            row['statement'] += ' 整批明确DIRECT/TEMPLATE；DIRECT仍严守基础必填、类型、映射和唯一性，仅豁免路由附加资料，且不建run/node。'
        if row['id'] == 'AC-2113':
            row['statement'] += ' DIRECT显式选择AI/MANUAL/PREDICTIVE，AI场景必选；已有业务启用流程不重复导入。'
    # Rebuild checks from final action semantics; retain previously authored concrete cases.
    delta_cases = {
        'IMPORT-PREVIEW': ('同一分类关闭/开启allowDirectFollowup，DIRECT缺基础必填、合法基础但缺仅路由条件字段、未选方式、AI无场景；TEMPLATE缺路由；通过后改模式/方式/开关/场景重提。', '仅DIRECT合法基础且显式方式/必要场景齐备可绕路由附加资料；其他均明确拒绝，无静默切换；变化使旧确认失效。'),
        'IMPORT-COMMIT': ('同批两条DIRECT+MANUAL导入并重放同请求，再导入两条TEMPLATE；使其中一行基础类型错。', 'DIRECT只建批次/业务及方式，无run/node；TEMPLATE各自建run；同请求幂等；任一行错整批不部分写，不改模式。'),
        'ASSIGN': ('DIRECT分别AI、MANUAL、PREDICTIVE，另含TEMPLATE同node名记录做批量分配。', '只选跟进人，AI明确同一安排中的必要场景；人工候选核电话资格；DIRECT/TEMPLATE不因空/同node名误合组，不自动起呼。'),
        'START': ('DIRECT存在公共拒联、同号占用、未知旧执行或未归档本人内容时尝试起呼；解除合法阻塞后本人启动人工，再做AI/预外呼。', '相同联系及串行规则逐项拦截，合法后记录真实方式与本人/接听事实，始终无run/node，不自动模板转交推进。'),
        'SAVE-CONTENT': ('DIRECT真实接听人A，责任人B和管理员分别代填；A保存后更正当前有效值，再查看原快照。', '仅真实本人保存；定义和值快照完整，资料更正独立留痕，旧快照不变，不能因无run放宽原段身份。'),
        'ARCHIVE': ('DIRECT首通结束但重试未收敛，随后必要人工内容未保存，再全部满足。', '前两状态不完成；全部明确才唯一归档，返回同租户待跟进，不创建下一通或新run，也不把通话当模板节点完成。')}
    for local in locals_.values():
        check_id = local['test_refs'][0]
        if check_id not in checks or check_id == CHECK_ENABLE:
            continue
        suffix = check_id.removeprefix('CHECK-FLOW-')
        check = checks[check_id]
        # Retain the original concrete examples as product history, scoped by mode.
        check['procedure'] = '本动作适用模式以当前前置条件为准；原模板例仅用于TEMPLATE。' + check['procedure'].removeprefix('本动作适用模式以当前前置条件为准；原模板例仅用于TEMPLATE。')
        if suffix in delta_cases:
            proc, expected = delta_cases[suffix]
            marker = '。2026-10-30两模式复现：'
            check['procedure'] = check['procedure'].split(marker)[0] + marker + proc
            check['expected'] = check['expected'].split(marker)[0] + marker + expected
    for local in locals_.values():
        for ident in local['field_ids']:
            if ident in fields:
                fields[ident]['test_refs'] = unique(fields[ident]['test_refs'] + local['test_refs'])
    for pid in ['PAGE-2204', 'PAGE-2227', 'PAGE-2226', 'PAGE-2203', 'PAGE-2006']:
        mapping = data['page_mappings'][pid]
        ids = mapping['local_ids']
        if pid in ['PAGE-2204', 'PAGE-2227']:
            ids = unique(ids + [ENABLE])
        mapping['local_ids'] = ids
        mapping['field_ids'] = unique(mapping['field_ids'] + [f for lid in ids for f in locals_[lid]['field_ids']])
        mapping['test_refs'] = unique(mapping['test_refs'] + [t for lid in ids for t in locals_[lid]['test_refs']])

    delta = {'id': 'SUPERSEDE-DIRECT-FOLLOWUP-20261030',
             'old': '所有新业务导入均必须先有可判断路由并建立run；无路由资料一律不能导入。',
             'current': '分类显式允许时整批可选DIRECT并明确AI/人工/预外呼；只豁免路由附加资料，严格保基础校验且不建run/node。TEMPLATE沿原完整流程规则。已有直接业务经显式预检在旧执行及必要归档全部收敛后启用新run，原业务不重复导入。'}
    data['supersessions'] = [x for x in data['supersessions'] if x.get('id') != delta['id']] + [delta]
    data['review_notes'] = unique(data['review_notes'] + ['2026-10-30直接跟进/按模板流转为用户授权业务增量；43个原FUNC及原FIELD身份保留，新增3字段和独立启用流程动作。'])
    data['fields'], data['locals'], data['checks'], data['features'] = list(fields.values()), list(locals_.values()), list(checks.values()), list(features.values())
    data['direct_followup_delta'] = '20261030-1'
    return data


def apply_cycle_delta(data):
    """Add the distinct direct lifecycle states/actions after their contract settled."""
    if data.get('direct_cycle_delta') == '20261030-1':
        return data
    fields = {x['id']: x for x in data['fields']}
    locals_ = {x['id']: x for x in data['locals']}
    checks = {x['id']: x for x in data['checks']}
    cycle = 'FIELD-FLOW-DIRECT-CYCLE-ID'
    cycles = 'FIELD-FLOW-DIRECT-CYCLES'
    status = 'FIELD-FLOW-DIRECT-STATUS'
    outcome = 'FIELD-FLOW-DIRECT-OUTCOME'
    code = 'FIELD-FLOW-DIRECT-OUTCOME-CODE'
    label = 'FIELD-FLOW-DIRECT-OUTCOME-LABEL'
    token = 'FIELD-FLOW-ENABLE-FLOW-TOKEN'
    complete = 'LOCAL-FLOW-COMPLETE-DIRECT'
    resume = 'LOCAL-FLOW-RESUME-DIRECT'
    bus = deepcopy(fields['FIELD-FLOW-HANDLING-MODE']['permissions'])

    def field(ident, name, entity, key, typ, fmt, required, rules, when, transient=False, members=None, default=None):
        base = deepcopy(fields[MODE])
        base.update({'id': ident, 'name': name, 'entity': entity, 'key': key, 'type': typ, 'format': fmt,
                     'nullable': ident in [outcome, label], 'required_when': required,
                     'default': default or {'kind': 'none', 'value': None, 'rule': '未有对应业务事实或明确输入时不生成，不按旧周期或首项补值。'},
                     'validation_rules': rules, 'permissions': deepcopy(bus),
                     'source_refs': ['docs/field-alignment.json#' + ident], 'source_keys': [],
                     'lifecycle': [
                         {'state': '当前周期或预检', 'behavior': 'DIRECT以准确record/owner/directCycleId及模式定位，不使用run/node身份；旧段始终归其原周期。'},
                         {'state': '明确成功', 'behavior': when},
                         {'state': '失败/未知', 'behavior': '失败保输入及旧事实；未知持同次请求核对，不另建周期/流程或改写历史。'},
                         {'state': '后续读取', 'behavior': '周期完成结论及原段快照保持，启用新run不把旧直接事实纳入当前节点办理。'}],
                     'derivation': {'kind': 'input' if ident in [code, label] else 'calculated' if transient else 'system', 'rule': '；'.join(rules), 'dependencies': [MODE]},
                     'persistence': {'kind': 'transient' if transient else 'stored', 'write_when': when},
                     'examples': {'valid': ['准确DIRECT周期A完成后保原结论；再次直接跟进创建周期B，或明确启用流程创建新run。'],
                                  'invalid': ['把directCycleId当runId、以旧段完成新周期/新节点、重复确认建第二周期或用过期启用令牌，均拒绝。']},
                     'test_refs': []})
        if members:
            base['object_members'] = members
        fields[ident] = base

    field(cycle, '直接跟进周期身份', 'DirectFollowupCycle', 'directCycleId', 'string', '同一业务下系统生成稳定周期ID',
          'DIRECT正式导入与再次直接跟进创建周期时必需；跟进段/更正/结论引用原周期',
          ['周期是直接跟进业务状态的边界，不是流程run，不含模板或节点。一次周期可有多个真实跟进及其重试。',
           'DIRECT新导入创建首周期；仅已COMPLETED且旧执行/必要归档收敛后可显式创建下周期；启用流程不把周期身份改成run身份。'],
          'DIRECT正式导入或“再次直接跟进”明确成功时生成并同次保存当前周期与历史数组；段创建时封其周期引用；原周期ID永不重分配。')
    field(status, '直接跟进状态', 'BusinessRecord', 'directStatus', 'enum', 'ACTIVE / COMPLETED / FLOW_ENABLED（已启用流程历史标记）',
          'DIRECT当前状态必需；转为TEMPLATE后保FLOW_ENABLED供历史追溯',
          ['ACTIVE允许按准入安排/真实跟进；完成直接跟进需明确结论，不能由归档自动变COMPLETED。',
           'COMPLETED禁止直接起呼，可显式再次直接跟进建立新周期；FLOW_ENABLED表示已于同业务启用新run，不再按直接方式执行。',
           '启用流程只要求旧执行/未知/必要归档全部收敛，不强制先执行“完成直接跟进”。已完成周期保其COMPLETED历史结论；原ACTIVE周期记录FLOW_ENABLED及结束时间。'],
          'DIRECT导入/再次跟进成功时写ACTIVE；明确完成时写COMPLETED并封结论；启用流程成功时写FLOW_ENABLED并记录转换事件，与模式变更及新run同次生效。',
          default={'kind': 'literal', 'value': 'ACTIVE', 'rule': '仅DIRECT正式导入及显式新周期成功时初始ACTIVE；预览不创建状态。'})
    field(cycles, '直接跟进周期历史', 'BusinessRecord', 'directCycles', 'array', '按真实创建顺序的周期对象数组',
          'DIRECT首周期创建时必需；后续追加，不覆盖已有周期',
          ['每条周期含稳定directCycleId、明确method、status、startedAt；结束时有真实endedAt，明确完成时封businessOutcome。',
           '当前directCycleId只能唯一引用一条周期；旧段按其周期读取，不以数组末项冒充真实来源。',
           '启用流程后数组保留；COMPLETED周期不重画为已启用，ACTIVE周期可收敛为FLOW_ENABLED。'],
          'DIRECT正式导入建立数组；再次直接跟进追加新周期；完成/启用流程仅更新准确当前周期及对应事件，保全部旧周期与段事实。',
          members=[{'key': 'directCycleId', 'type': 'string', 'rule': '同业务内稳定唯一，跟进段准确引用。'},
                   {'key': 'method', 'type': 'enum', 'rule': 'AI/MANUAL/PREDICTIVE，保存本周期实际明确方式。'},
                   {'key': 'status', 'type': 'enum', 'rule': 'ACTIVE/COMPLETED/FLOW_ENABLED，不等同run状态。'},
                   {'key': 'startedAt / endedAt', 'type': 'datetime', 'rule': '真实创建/收敛时间，endedAt无事实时不伪造。'},
                   {'key': 'businessOutcome', 'type': 'object', 'rule': '仅明确完成周期时封存对应直接业务结论，后续新周期不覆盖。'}])
    field(outcome, '直接周期业务结论快照', 'DirectFollowupCycle', 'businessOutcome', 'object', 'code / label / source / directCycleId / reason / at / accountId',
          '明确完成直接跟进时必需；ACTIVE或仅启用流程不伪造完成结论',
          ['直接完成结论独立于原FlowRun.businessOutcome及END配置；不能复用模板节点字段改义。',
           'code必须是明确结论且不是UNSPECIFIED；label为1～80字；source=DIRECT_COMPLETION，准确封周期、操作者与真实时间。',
           '当前周期需至少一段真实completedFollowup且归档，或明确选择NO_CALL并填写原因；两者均先保证所有旧执行与必要归档可靠收敛。'],
          '“完成直接跟进”明确成功时，业务当前businessOutcome与准确周期结论快照、COMPLETED状态及完成事件同次保存；再次直接跟进清当前结论但保原周期快照。',
          members=[{'key': 'code', 'type': 'enum', 'rule': 'SUCCESS/UNSUCCESSFUL/INVALID/NO_CONTACT/NO_CALL/OTHER；UNSPECIFIED拒绝。'},
                   {'key': 'label', 'type': 'string', 'rule': '由明确编码给默认中文文案，允许1～80字含义一致显示名。'},
                   {'key': 'source', 'type': 'enum', 'rule': '固定DIRECT_COMPLETION。'},
                   {'key': 'directCycleId', 'type': 'string', 'rule': '准确本周期身份，不能以run或旧周期替代。'},
                   {'key': 'reason', 'type': 'string', 'rule': 'NO_CALL无真实完成跟进时必填；保原操作者明确输入。'},
                   {'key': 'at / accountId', 'type': 'datetime / string', 'rule': '真实完成时刻及当前有权操作账号，不当作实际通话办理人。'}])
    field(code, '直接完成结论编码', 'DirectCompletionInput', 'outcomeCode', 'enum', 'SUCCESS / UNSUCCESSFUL / INVALID / NO_CONTACT / NO_CALL / OTHER',
          '完成直接跟进提交必填', ['必须明确选择，不接受UNSPECIFIED；无真实已完成跟进仅NO_CALL+原因可完成，不能将未接通自动解释为达成。'],
          '在完成提交前暂存明确选择；成功后写入准确直接周期结论快照及完成事件，失败/未知保留输入。')
    field(label, '直接完成结论文案', 'DirectCompletionInput', 'outcomeLabel', 'string', '去首尾空白后1～80字',
          '可省略并采用已明确编码的中文默认文案；显式提交不可空白', ['显示名不覆盖独立结论编码，不能借改文案把未完成伪为成功。'],
          '明确完成直接跟进成功时写入准确周期businessOutcome.label；不修改模板END的outcomeLabel。',
          default={'kind': 'derived', 'value': None, 'rule': '仅根据用户明确所选outcomeCode派生对应中文文案，不预选结论编码。'})
    field(token, '启用流程确认依据', 'EnableFlowPreview', 'validationToken', 'string', '系统计算，用户不编辑；绑定原record/revision/directCycleId/owner及当前字段、值、plan和必要AI场景',
          'enableFlowContext无问题时输出；正式enableFlow提交必需',
          ['只证明本次启用预检一致，不是业务完成或新run事实；有issues时无有效令牌。',
           '资料、字段、模板、入口、必要AI场景、业务修订/owner/当前周期任一变化即失效；提交需按当前事实重算匹配。',
           '实际本租户首CALL为AI时本次必须重新明确当前场景；先转交不要求原方替目标选私有场景。'],
          '当前启用抽屉预检时暂存，不写成长期业务事实；明确提交成功后仅留启用事件与真实新run，过期失败保输入重新检查。', transient=True)

    def add_fields(local, ids, output=False):
        row = locals_[local]
        row['field_ids'] = unique(row['field_ids'] + ids)
        row['outputs' if output else 'inputs'] = unique(row['outputs' if output else 'inputs'] + ids)

    def make_action(ident, title, feature_ids, trigger, preconditions, steps, branches, refs, outputs):
        check_id = ident.replace('LOCAL-', 'CHECK-')
        written = ([status, cycles, outcome] if ident == complete else
                   [cycle, cycles, status, METHOD, outcome, 'FIELD-FLOW-ARRANGEMENT', 'FIELD-FLOW-FOLLOWER'])
        result = {'id': ident, 'title': title, 'feature_ids': feature_ids, 'trigger': trigger,
                  'preconditions': preconditions, 'postconditions': outputs, 'inputs': refs, 'outputs': written,
                  'steps': [{'id': ident.replace('LOCAL-', 'STEP-') + '-' + str(i + 1), 'action': action,
                             'reads': refs, 'writes': written if i == len(steps) - 1 else [], 'rule_ids': [MODE_RULE, 'GR-SERIAL', 'GR-DATA-FACTS', 'GR-UNKNOWN', 'GR-AUTH']}
                            for i, action in enumerate(steps)],
                  'branches': [{'id': ident.replace('LOCAL-', 'BRANCH-') + '-' + str(i + 1), 'condition': condition, 'result': result,
                                'field_ids': refs, 'test_refs': [check_id]} for i, (condition, result) in enumerate(branches)],
                  'global_rule_ids': [MODE_RULE, 'GR-SERIAL', 'GR-SCOPE', 'GR-AUTH', 'GR-DATA-FACTS', 'GR-UNKNOWN'],
                  'field_ids': refs, 'source_refs': ['documentation/input/functions.json#' + feature_ids[0], 'docs/四节点与客户跟进闭环需求记录.md#17'],
                  'source_keys': [], 'test_refs': [check_id]}
        locals_[ident] = result

    make_action(complete, '明确完成直接跟进周期并封业务结论', ['FUNC-2032', 'FUNC-2039'], '有当前直接业务办理资格者明确选择“完成直接跟进”并确认业务结论',
                ['当前业务为DIRECT且当前周期ACTIVE，当前owner/record/revision仍一致，提交者具此直接办理资格',
                 '所有旧执行、排队、重试、未知和事实冲突可靠收敛，必要本人内容与全部相关归档完成',
                 '当前周期已有至少一段真实completedFollowup并归档，或明确NO_CALL且填写无需联系原因'],
                ['重新核准确直接周期、当前资格及全部旧执行/必要归档收敛；不以最后单条结束或超时作为全收敛。',
                 '校明确结论编码非UNSPECIFIED，显示名1～80字；无真实完成跟进时只允许NO_CALL+明确原因。',
                 '同次封当前业务结论、原周期结论、COMPLETED状态、结束时刻和有权操作者事件；不制造通话、跟进完成数或模板END。'],
                [('仍有未收敛/未知/未归档，结论未明确，或无真实完成跟进且非NO_CALL+原因', '保原周期ACTIVE，具体指出阻塞并保输入；不代填、不造完成。'),
                 ('明确完成或同请求重复确认', '当前周期唯一COMPLETED，保历史快照；后续起呼需显式再次直接跟进新周期。'),
                 ('完成响应未知', '保同次请求核对，不再提交新完成或创建新周期。')],
                [MODE, cycle, cycles, status, outcome, code, label, 'FIELD-FLOW-REASON', 'FIELD-FLOW-ARCHIVE-STATE', 'FIELD-FLOW-RECORD-REVISION'],
                ['完成直接周期与跟进归档、实际拨打和业务成功分开；原段/周期快照不被当前结论改写。'])
    make_action(resume, '显式再次直接跟进并建立独立新周期', ['FUNC-2031', 'FUNC-2039'], '有再次直接办理资格者在COMPLETED业务选择下一次方式后确认“再次直接跟进”',
                ['当前业务为DIRECT且当前周期COMPLETED，具本业务再次直接跟进资格', '分类当前仍显式允许直接跟进；全部旧执行、未知及必要归档已可靠收敛',
                 '明确下一次AI/MANUAL/PREDICTIVE；AI明确有效本租户/分类场景，实际专业能力仍可核'],
                ['按当前分类开关和准确业务/owner/周期重验；下一次方式须明确确认，AI重核当前准确场景，不把旧结果当新输入。',
                 '同业务追加新directCycleId并设ACTIVE，保存本次明确方式/必要场景；原周期COMPLETED及结论快照保留。',
                 '清旧责任跟进人及旧执行安排，清当前业务结论但保周期历史；新周期重新分配和明确起呼，不建run/node或自动续拨。'],
                [('周期未完成、分类关闭、旧执行未收敛或必要场景不可用', '保旧COMPLETED及全部输入，指出具体原因；不建新周期，不自动启用模板。'),
                 ('明确成功或重复同请求', '同record/owner只新增一个DIRECT周期，旧段仍归旧周期，当前安排待重新分人。'),
                 ('结果未知', '沿准确原请求核对，不重放新周期。')],
                [ALLOW, MODE, METHOD, cycle, cycles, status, outcome, 'FIELD-FLOW-AI-SCENE', 'FIELD-FLOW-ARRANGEMENT', 'FIELD-FLOW-FOLLOWER', 'FIELD-FLOW-RECORD-REVISION'],
                ['再次直接跟进与同周期内真实重拨分开；新周期不能借旧完成结论或通话充当本次跟进。'])
    checks[complete.replace('LOCAL-', 'CHECK-')] = {
        'id': complete.replace('LOCAL-', 'CHECK-'), 'acceptance_ids': ['AC-2118', 'AC-2122', 'AC-2129'],
        'procedure': 'DIRECT新业务无拨打尝试完成SUCCESS、无原因NO_CALL、带原因NO_CALL；另有真实已归档完成跟进的当前周期选择明确结论。分别置旧请求未知、重试未收敛、本人内容未归档；最后全部满足后重复同请求并查看原段。',
        'expected': '无真实完成跟进仅NO_CALL+原因合法，且全部旧执行及必要归档须收敛；合法时只封一个COMPLETED周期/业务结论，不造通话或跟进完成数；原段保持，失败保输入，未知沿同请求核对。'}
    checks[resume.replace('LOCAL-', 'CHECK-')] = {
        'id': resume.replace('LOCAL-', 'CHECK-'), 'acceptance_ids': ['AC-2115', 'AC-2116', 'AC-2129'],
        'procedure': '已COMPLETED直接周期A，先关闭分类开关或留旧unknown尝试再次直接跟进；恢复合法条件，分别选MANUAL、AI缺场景、AI有效本租户场景、PREDICTIVE明确方式，确认后重复同请求、查看旧段和结论。',
        'expected': '不合法时保原周期/输入；合法只新增周期B且仍无run/node，保存明确方式/必要场景，清责任人和旧执行安排，当前结论清而A的COMPLETED/结论不改，重新分人后才可明确起呼；同请求不重复建周期。'}

    for lid in ['LOCAL-FLOW-IMPORT-COMMIT', 'LOCAL-FLOW-START', 'LOCAL-FLOW-CALL-FACTS', 'LOCAL-FLOW-SAVE-CONTENT', 'LOCAL-FLOW-ARCHIVE',
                'LOCAL-FLOW-CORRECT', 'LOCAL-FLOW-HANDLER-INBOX', 'LOCAL-FLOW-INTERFACE-QUERY', 'LOCAL-FLOW-DETAIL', 'LOCAL-FLOW-QUERY',
                'LOCAL-FLOW-CUSTOMER-TIMELINE', 'LOCAL-FLOW-ASSIGN', 'LOCAL-FLOW-ASSIGN-BATCH', 'LOCAL-FLOW-START-BATCH']:
        add_fields(lid, [cycle, status])
    for lid in ['LOCAL-FLOW-DETAIL', 'LOCAL-FLOW-CUSTOMER-TIMELINE', 'LOCAL-FLOW-QUERY', 'LOCAL-FLOW-BATCH-READ']:
        add_fields(lid, [cycles, outcome], output=True)
    for lid in ['LOCAL-FLOW-ASSIGN', 'LOCAL-FLOW-START']:
        locals_[lid]['preconditions'].append('DIRECT须当前周期ACTIVE；COMPLETED须显式再次直接跟进，不能以旧安排直接起呼。')
    enable = locals_[ENABLE]
    add_fields(ENABLE, [cycle, status, cycles, token])
    enable['inputs'] = unique(enable['inputs'] + [token])
    enable['outputs'] = unique(enable['outputs'] + [token, status])
    enable['preconditions'].append('当前DIRECT周期可以ACTIVE或COMPLETED；不强制先“完成直接跟进”，只要求全部旧执行与必要归档可靠收敛。')
    enable['steps'][0]['action'] += ' 输出enableFlowContext的逐项issues及validationToken；本租户首CALL为AI时显式重新选场景。'
    enable['steps'][0]['writes'] = unique(enable['steps'][0]['writes'] + [token])
    enable['steps'][1]['action'] += ' validationToken必须绑定准确record/revision/directCycleId/owner、当前字段/值/plan及必要场景；任一变化即保输入重新检查。'
    enable['steps'][1]['reads'] = unique(enable['steps'][1]['reads'] + [token, cycle])
    enable['steps'][2]['action'] += ' 当前directStatus封FLOW_ENABLED；原ACTIVE周期转FLOW_ENABLED，原COMPLETED周期保完成历史结论。'
    enable['steps'][2]['writes'] = unique(enable['steps'][2]['writes'] + [status, cycles])
    enable['postconditions'].append('启用流程不要求先完成直接周期；已完成周期结论保持，未完成但收敛周期按启用事件结束；新run与旧directCycle严格隔离。')
    checks[CHECK_ENABLE]['procedure'] += ' 另在ACTIVE但已全部收敛的周期直接启用，无需先完成；COMPLETED周期启用后核原结论；预检后改当前值、分类字段、模板、入口或场景重提原validationToken。'
    checks[CHECK_ENABLE]['expected'] += ' ACTIVE也可合法启用；r.directStatus为FLOW_ENABLED，旧已完成周期仍COMPLETED且保结论；过期token拒绝保输入。'
    fields[METHOD]['required_when'] = 'DIRECT导入和再次直接跟进明确确认AI/MANUAL/PREDICTIVE；TEMPLATE不使用此值'
    fields[METHOD]['validation_rules'].append('再次直接跟进在已COMPLETED业务追加新直接周期，允许明确下一次方式；清旧责任安排并重核当前必要AI场景，不在原已受理执行中改方式。')
    fields['FIELD-FLOW-REASON']['required_when'] += '；直接完成无真实完成跟进而选NO_CALL时必须说明'
    fields['FIELD-FLOW-REASON']['persistence']['write_when'] += '；直接完成NO_CALL原因与准确周期结论及完成事件同次保存。'
    fields['FIELD-FLOW-IMPORT-TOKEN']['validation_rules'] = [
        '绑定所选整批handlingMode、DIRECT显式方式、分类开关/字段、原名单、映射及必要场景；TEMPLATE另绑定实际路由/方案。',
        '正式提交逐行重算一致且全部通过才写；模式/方式/分类/开关/字段/名单/映射/场景及身份变化使旧token失效，不自动降级。']
    for feature in data['features']:
        if feature['id'] == 'FUNC-2031':
            feature['description'] += ' 已完成直接业务可显式选下一次方式建立独立直接周期，清旧责任安排后重新分配。'
        if feature['id'] == 'FUNC-2032':
            feature['description'] += ' 直接周期完成须明确业务结论、全部执行与必要归档收敛，并有真实完成跟进或NO_CALL+原因；不能自动从归档完成。'
        feature['bounds']['included_scope'] = [x['title'] for x in locals_.values() if feature['id'] in x['feature_ids']]
    for pid in ['PAGE-2204', 'PAGE-2227']:
        mapping = data['page_mappings'][pid]
        mapping['local_ids'] = unique(mapping['local_ids'] + [complete, resume])
    for mapping in data['page_mappings'].values():
        mapping['field_ids'] = unique(mapping['field_ids'] + [f for lid in mapping['local_ids'] for f in locals_[lid]['field_ids']])
        mapping['test_refs'] = unique(mapping['test_refs'] + [c for lid in mapping['local_ids'] for c in locals_[lid]['test_refs']])
    for local in locals_.values():
        for ident in local['field_ids']:
            if ident in fields:
                fields[ident]['test_refs'] = unique(fields[ident]['test_refs'] + local['test_refs'])
    data['fields'], data['locals'], data['checks'] = list(fields.values()), list(locals_.values()), list(checks.values())
    data['direct_cycle_delta'] = '20261030-1'
    return data


def apply_ui(ui, business):
    locals_ = {x['id']: x for x in business['locals']}
    fielddefs = {x['id']: x for x in business['fields']}
    modes = [MODE, METHOD]
    editable_pages = {'PAGE-2006': [ALLOW], 'PAGE-2204': modes}
    display_pages = {'PAGE-2227': modes, 'PAGE-2226': modes, 'PAGE-2203': modes}
    for page in ui['ui']['pages']:
        pid = page['source_page_ids'][0]
        if pid not in business['page_mappings']:
            continue
        mapping = business['page_mappings'][pid]
        page['local_logic_ids'] = unique(page['local_logic_ids'] + mapping['local_ids'])
        page['test_refs'] = unique(page['test_refs'] + mapping['test_refs'])
        page['feature_ids'] = unique(page['feature_ids'] + [f for lid in mapping['local_ids'] for f in locals_[lid]['feature_ids']])
        for interaction in page['interactions']:
            lid = interaction.get('local_logic_ids', [None])[0]
            if lid not in locals_:
                continue
            local = locals_[lid]
            interaction['trigger'] = local['trigger']
            interaction['behavior'] = '；'.join(s['action'] for s in local['steps']) + '。可观察结果：' + '；'.join(local['postconditions']) + '。分支：' + '；'.join(b['condition'] + '→' + b['result'] for b in local['branches'])
        if pid in ['PAGE-2204', 'PAGE-2227']:
            local = locals_[ENABLE]
            ident = 'UI-FLOW-' + pid.removeprefix('PAGE-') + '-ENABLE-TEMPLATE'
            page['interactions'] = [x for x in page['interactions'] if x['id'] != ident] + [{
                'id': ident, 'trigger': local['trigger'], 'behavior': '；'.join(s['action'] for s in local['steps']) + '。' + '；'.join(local['postconditions']),
                'local_logic_ids': [ENABLE], 'test_refs': [CHECK_ENABLE], 'source_action_ids': []}]
            for lid in ['LOCAL-FLOW-COMPLETE-DIRECT', 'LOCAL-FLOW-RESUME-DIRECT']:
                if lid not in locals_:
                    continue
                local = locals_[lid]
                ident = 'UI-FLOW-' + pid.removeprefix('PAGE-') + '-' + lid.removeprefix('LOCAL-FLOW-')
                page['interactions'] = [x for x in page['interactions'] if x['id'] != ident] + [{
                    'id': ident, 'trigger': local['trigger'],
                    'behavior': '；'.join(s['action'] for s in local['steps']) + '。分支：' + '；'.join(b['condition'] + '→' + b['result'] for b in local['branches']),
                    'local_logic_ids': [lid], 'test_refs': local['test_refs'], 'source_action_ids': []}]
        additional = editable_pages.get(pid, []) + display_pages.get(pid, [])
        if pid in ['PAGE-2204', 'PAGE-2227']:
            additional += ['FIELD-FLOW-DIRECT-STATUS', 'FIELD-FLOW-DIRECT-OUTCOME',
                           'FIELD-FLOW-DIRECT-OUTCOME-CODE', 'FIELD-FLOW-DIRECT-OUTCOME-LABEL']
        if pid in ['PAGE-2226', 'PAGE-2203']:
            additional += ['FIELD-FLOW-DIRECT-STATUS', 'FIELD-FLOW-DIRECT-OUTCOME']
        for fid in additional:
            f = fielddefs[fid]
            editable = fid in editable_pages.get(pid, []) or (pid in ['PAGE-2204', 'PAGE-2227'] and fid in ['FIELD-FLOW-DIRECT-OUTCOME-CODE', 'FIELD-FLOW-DIRECT-OUTCOME-LABEL'])
            present = {'field_id': fid, 'component_id': ('UI-COMP-SELECT' if f['type'] in ['enum', 'boolean'] else 'UI-COMP-FORM') if editable else 'UI-COMP-STATUS',
                       'label': f['name'], 'help_text': '；'.join(f['validation_rules']),
                       'visible_when': '在有本业务/分类读取权的准确页面显示；DIRECT不以空run/节点误显示为缺配置。',
                       'editable_when': '仅有对应分类配置权或本租户导入权且当前草稿可编辑；实际执行和启用流程后不在此静默改模式/方式。' if editable else '只读显示当前确认模式与方式；启用流程走独立有权动作。',
                       'required_indicator': f['required_when'],
                       'validation_timing': '改变模式/方式/分类开关/场景使预览失效；检查、确认导入和实际执行分别重核当前授权及条件。',
                       'error_message': '准确指出分类未允许、方式缺失、AI场景缺失或当前办理冲突；不静默改为另一模式。',
                       'formatting': f['format'] + '；DIRECT无run/节点显示“直接跟进”，不显示虚构节点。'}
            if fid in ['FIELD-FLOW-DIRECT-OUTCOME-CODE', 'FIELD-FLOW-DIRECT-OUTCOME-LABEL']:
                present['visible_when'] = '当前DIRECT周期ACTIVE且有当前业务完成资格，在“完成直接跟进”确认表单显示；历史结论按准确周期只读展示。'
                present['editable_when'] = '有当前直接业务办理资格且此完成表单可编辑；提交中锁定，正式完成后不在此重写周期结论。'
                present['validation_timing'] = '确认完成时核全旧执行/必要归档收敛，校明确非UNSPECIFIED结论及文案1～80字；无真实完成跟进仅NO_CALL+原因合法。'
                present['error_message'] = '请明确业务结论；无真实完成跟进时请选择无需联系并说明原因；未收敛执行或必要归档先处理后完成。'
            page['fields'] = [x for x in page['fields'] if x['field_id'] != fid] + [present]
        ui['page_mappings'][pid]['local_ids'] = unique(ui['page_mappings'][pid]['local_ids'] + mapping['local_ids'])
        ui['page_mappings'][pid]['field_ids'] = unique(ui['page_mappings'][pid]['field_ids'] + mapping['field_ids'])
        ui['page_mappings'][pid]['test_refs'] = unique(ui['page_mappings'][pid]['test_refs'] + mapping['test_refs'])
        if pid == 'PAGE-2006':
            page['layout'] = unique(page['layout'] + ['分类基础明确“允许直接跟进”开关（缺省关闭），与独立路由入口分别保存。'])
        if pid == 'PAGE-2204':
            page['layout'] = unique(page['layout'] + ['导入抽屉整批选择“直接跟进 / 按模板流转”；直接方式明确AI / 人工 / 预外呼，AI显式选本租户场景。', '列表显示办理模式；直接业务无流程节点，提供同租户办理和明确“启用流程”预检入口。'])
            for state in page['states']:
                if state['name'] == 'normal':
                    state['behavior'] = '整批明确DIRECT/TEMPLATE；DIRECT由分类显式允许且方式/必要AI场景明确，仅豁免路由附加资料；两模式基础必填/类型/映射/唯一性仍逐行严格校验。分配仅选跟进人，AI场景在同一安排明确；不自动起呼。DIRECT列表无run/节点、无模板转交推进。'
                if state['name'] == 'error':
                    state['behavior'] = '基础、映射、唯一性错误均具体到行；TEMPLATE路由资料不足提示修正，不自动降级DIRECT。DIRECT分类未允许、未选方式或AI缺场景均阻确认。模式/方式/场景变化使旧预览失效，失败保草稿，未知同请求核对。'
        if pid == 'PAGE-2227':
            page['layout'] = unique(page['layout'] + ['直接业务展示同租户跟进/通话/本人填写和更正入口；无模板推进/转交。显式启用流程先展示当前路由、缺资料与旧执行/必要归档收敛结果。'])
        if pid in ['PAGE-2204', 'PAGE-2227']:
            page['layout'] = unique(page['layout'] + ['DIRECT独立显示当前周期ACTIVE/COMPLETED及结论；“完成直接跟进”明确结论，无真实完成跟进仅NO_CALL+原因合法。',
                                                       'COMPLETED提供“再次直接跟进”：明确下一次方式并重核必要AI场景，新周期清旧责任安排；启用流程只需全部执行/必要归档收敛，无需先完成直接周期。'])
    for row in ui['field_group_mappings']:
        if row['source_field_group_id'] in ['FLD-014']:
            row['field_ids'] = unique(row['field_ids'] + [ALLOW])
        if row['source_field_group_id'] in ['FLD-016', 'FLD-017', 'FLD-020']:
            row['field_ids'] = unique(row['field_ids'] + [MODE, METHOD])
    ui['review_notes'] = unique(ui.get('review_notes', []) + ['两模式界面、局部动作和字段呈现同源；原136 FLD映射保留并扩展，不删除旧FIELD引用。'])
    return ui


def apply_rules(rules):
    modes = {'id': MODE_RULE, 'statement': '分类allowDirectFollowup仅显式true开放DIRECT，缺省false。导入整批明确DIRECT或TEMPLATE，不因失败静默降级。DIRECT明确AI/MANUAL/PREDICTIVE，AI场景必选；仅豁免路由条件附加资料，基础必填、类型、映射、唯一性全部保留，且无run或节点。DIRECT有完整同租户真实呼叫、本人填写、快照、联系限制和当前资料更正，但无模板转交/推进。后续仅在当前路由和必需资料验证通过、全部旧执行及必要归档可靠收敛后，明确在原业务启用新run，不重复导入；旧直接事实不能完成新节点。'}
    rules = [x for x in rules if x['id'] != MODE_RULE] + [modes]
    for row in rules:
        if row['id'] == 'GR-SERIAL':
            row['statement'] = '同一业务不论DIRECT/TEMPLATE均串行办理；在途/排队/重试/未知执行未收敛以及必要本人内容未归档时，不启动下一段、启用新run或推进/转交/完成废弃。'
        if row['id'] == 'GR-CONFIG':
            row['statement'] = 'TEMPLATE的模板字段参考分类只供编排，实际分类独立关联当前同品牌兼容模板，新run仅消费明确生效配置并封完整方案，已开始run不追改。DIRECT不消费路由或生成run；分类开关不自动转换既有业务模式。'
        if row['id'] == MODE_RULE:
            row['statement'] += ' DIRECT使用独立directCycleId/directCycles及ACTIVE/COMPLETED状态，不是run；完成周期须明确结论且有真实已归档完成跟进或NO_CALL+原因。再次直接跟进显式确认下一次方式和必要AI场景，新周期清旧责任安排。启用流程不强制先完成直接周期，成功时directStatus记FLOW_ENABLED，已完成周期保原COMPLETED结论，原ACTIVE周期记录FLOW_ENABLED。'
    return rules


def main():
    path = ROOT / 'business.json'
    business = apply_cycle_delta(apply_business(json.loads(path.read_text())))
    path.write_text(json.dumps(business, ensure_ascii=False, indent=2) + '\n')
    path = ROOT / 'ui.json'
    path.write_text(json.dumps(apply_ui(json.loads(path.read_text()), business), ensure_ascii=False, indent=2) + '\n')
    path = ROOT.parent / 'global-rule-drafts.json'
    path.write_text(json.dumps(apply_rules(json.loads(path.read_text())), ensure_ascii=False, indent=2) + '\n')
    print('Applied approved DIRECT/TEMPLATE delta to authored product fragments only.')


if __name__ == '__main__':
    main()
