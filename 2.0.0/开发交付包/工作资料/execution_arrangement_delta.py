"""Maintain the user-approved current execution/import/lifecycle product deltas.

Does not change runtime code, frozen analysis, workflow state or approvals.
Run `apply` before the ordinary current-source projection and planning refresh.
"""
from pathlib import Path
import copy
import datetime
import hashlib
import importlib.util
import json
import sys

ROOT = Path(__file__).resolve().parent
VERSION = '2.0.0-current-20261102-step56'
RESOURCE = 'FIELD-FLOW-EXECUTION-RESOURCE'
PRIORITY = 'FIELD-FLOW-EXECUTION-PRIORITY'
QUEUED = 'FIELD-FLOW-EXECUTION-QUEUED-AT'
SEQUENCE = 'FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE'
NODE_PRIORITY = 'FIELD-FLOW-NODE-EXECUTION-PRIORITY'
DEFAULTS = 'FIELD-FLOW-NODE-EXECUTION-DEFAULTS'
MANUAL_MODE = 'FIELD-FLOW-MANUAL-ASSIGNMENT-MODE'
NODE_MANUAL_MODE = 'FIELD-FLOW-NODE-MANUAL-ASSIGNMENT-MODE'
EXEC_FIELDS = [RESOURCE, PRIORITY, QUEUED, SEQUENCE]
NODE_FIELDS = [NODE_PRIORITY, DEFAULTS]
AUTH = 'inputs/execution-arrangement-authorization-20261031.json'
SIMPLIFY_AUTH = 'inputs/execution-assignment-simplification-20261031.json'
TASK_IMPORT_AUTH = 'inputs/task-business-import-authorization-20261101.json'
LIFECYCLE_AUTH = 'inputs/lifecycle-audit-fix-authorization-20261101.json'
PROVIDER_AUTH = 'inputs/ai-provider-field-dialog-authorization-20261101.json'
ADD_FIELD_UX_AUTH = 'inputs/ai-add-field-entry-authorization-20261101.json'


def read(path):
    return json.loads(Path(path).read_text())


def write(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def unique(values):
    return list(dict.fromkeys(values))


REPLACEMENTS = {
    '人工责任人不自动成为实际拨打人，管理员可本人执行但不换责任身份。': '人工责任人不自动成为实际拨打人；管理员仅在目标明确为本人有效坐席时本人办理，责任身份分别保留。',
    '人工本人拨打，管理员可用本人已有效坐席，明确实际人与责任人不同': '所选具体坐席对应本人拨打；管理员也须使用当前明确安排的本人有效坐席，实际人与责任人分别记录',
    '有冲突按已配置分类优先级及稳定顺序协调。': '有冲突按五档降序、queuedAt/queueSequence入队FIFO及稳定业务ID的统一总序协调；同号与同资源使用同一顺序，旧分类0～999仅保历史和原专业兼容，不参与新执行排序。',
    '有冲突先比较当前五档执行优先级，同档再沿原分类联系优先级及稳定等待顺序协调；旧0～999分类配置不迁移为五档。': '有冲突按五档降序、queuedAt/queueSequence入队FIFO及稳定业务ID的统一总序协调；同号与同资源使用同一顺序，旧分类0～999仅保历史和原专业兼容，不参与新执行排序。',
    '普通业务列表按真实更新时间倒序后分页；无可靠时间保持稳定，不在读取时造时间。': '普通业务/历史列表按真实更新时间倒序后分页；待执行推荐视图按同资源五档执行优先级及同级入队时间/稳定序号排序。无可靠时间保持稳定，不在读取时造时间。',
    '按准确当前模式/方式只分配本租户责任跟进人，AI场景在导入与分配同一安排明确；不选择任务/线路/队列，不改owner/方式、不自动起呼。': 'DIRECT与TEMPLATE均安排本租户责任跟进人、具体AI/预外呼任务或人工坐席及五档执行优先级；AI明确适配场景。保留导入后单条/批量手动分配，不改owner或模板方式，不自动起呼。',
    '分配只确定当前租户责任跟进人和必要AI场景，方式已由节点明确，不选择坐席/任务，不改owner、不自动起呼。': '两模式分配明确当前租户责任跟进人、具体任务/坐席、必要AI场景及五档执行优先级；TEMPLATE方式由节点确定，DIRECT由显式选择确定。不改owner、不自动起呼。',
    '仅分配本租户有权跟进账号；不直接绑定坐席或任务，不自动拨打。': '本租户责任跟进人与具体执行任务/坐席分别保存；两模式共用安排，分配不自动拨打。',
    '导入分配不提供底层任务/资源选择；解析失败/多个冲突不选首项，人工不能借他人坐席': '导入或手动分配明确本租户具体任务/坐席；起呼按保存resourceId复核范围、方式、有效状态及AI场景，不按首项猜测；人工须为所选坐席准确关联的本人',
    '已唯一解析的本租户有效执行方案/本人坐席及来源': '已明确选择并在实际受理时复核的本租户具体任务/本人坐席及来源',
    '不选底层任务。': '任务/坐席另在同一执行安排明确，不自动起呼。',
    'MANUAL仍核实际本人电话资格；PREDICTIVE仍核唯一有效专业执行方案；不在人员分配中选择任务/线路/队列。': 'MANUAL选择有效具体坐席且起呼核实际本人电话资格；PREDICTIVE选择本租户具体任务，AI选择适配场景及任务；任务内线路/队列参数沿专业配置。',
    '仅选择本租户跟进人；AI场景在同一导入与分配安排入口明确且有效，DIRECT不要求节点标签路由依赖；保存不改方式或owner': '选择本租户跟进人、具体任务/坐席、五档执行优先级及必要AI场景；DIRECT不要求节点标签路由依赖；保存不改方式或owner，不自动起呼',
    '只改责任及场景安排，不改owner/方式、不起呼': '同次保存责任、具体任务/坐席、场景及执行优先级，不改owner/方式、不起呼',
    '按分类优先及同级先后逐条重核，不抢占已有执行': '同资源可办理待执行项按五档执行优先级降序、同级入队时间及稳定序号升序逐条重核；不同资源独立办理，不抢占已受理执行',
    '已安排同号码高优先级先，等优先FIFO；完成待流转/待核不发起新呼叫的沿原协调跳过，已知无匹配仍可跟进者仍参与': '旧分类0～999仅保历史及原专业兼容，当前UI只读、不参与新执行排序；同号及同资源统一按五档、queuedAt/queueSequence FIFO及稳定业务ID协调，不抢占在途',
    '同号协调先比较当前五档执行优先级；同档可沿原分类联系优先级再协调，随后按等待先后；既有0～999配置不迁移为五档，不抢占在途执行': '旧分类0～999仅保历史及原专业兼容，当前UI只读、不参与新执行排序；同号及同资源统一按五档、queuedAt/queueSequence FIFO及稳定业务ID协调，不抢占在途',
    '同号码先比较当前五档执行优先级，同档保原分类联系优先级再协调；0～999旧配置保留不迁移，不抢占在途。': '同号码及同资源使用五档降序、queuedAt/queueSequence入队FIFO和稳定业务ID的统一总序，避免交叉等待；旧分类0～999仅保历史/原专业兼容，不参与新排序，当前UI只读，不抢占在途。',
    'run/nodeRun/tenant/method/follower及AI scene快照': 'mode/run/nodeRun或directCycle/tenant/method/follower/resourceId/resourceSnapshot/AI scene/executionPriority/queuedAt/queueSequence',
}


def current_strings(value):
    if isinstance(value, dict):
        return {k: (v if k in ['history', 'previous_source_records', 'raw', 'source_evidence'] else current_strings(v)) for k, v in value.items()}
    if isinstance(value, list):
        return [current_strings(v) for v in value]
    if isinstance(value, str):
        for before, after in REPLACEMENTS.items():
            value = value.replace(before, after)
    return value


def simplify_assignment(b, p, u, pf, rules):
    """Step43 replaces configuration of a separate person with execution facts."""
    changes = {
        'CURRENT分支只在本租户确认后继': 'CURRENT分支只在本租户确认后继，执行安排先服从后继节点本次捕获策略',
        'CURRENT本租户路径保持owner/run/租户阶段及既有安排和封存结果': 'CURRENT本租户路径保持owner/run/租户阶段和封存结果，当前安排按后继节点策略重核：新MANUAL明确待分配，SPECIFIC_SEAT才可按同tenant/method及有效资源沿用',
        'MANUAL选择有效具体坐席且起呼核实际本人电话资格': 'MANUAL可人工分配先待分配，SPECIFIC_SEAT才必选有效坐席；真正拨打前仍须落实有效seat且本人办理',
        '当前待执行安排固定具体resourceId': '已具备发起资格的安排固定具体resourceId，人工MANUAL待分配可先没有seat',
        'DIRECT与TEMPLATE均安排本租户责任跟进人、具体AI/预外呼任务或人工坐席及五档执行优先级；AI明确适配场景。': 'DIRECT与TEMPLATE共用具体执行安排及五档优先级：人工默认人工分配，可先待分配，指定坐席才必选有效seat；PRED只任务，AI任务+适配场景，不再选择独立责任跟进人。',
        '两模式分配明确当前租户责任跟进人、具体任务/坐席、必要AI场景及五档执行优先级；': '两模式按方式明确任务或人工分配方式/坐席、必要AI场景及五档执行优先级，不选择独立责任跟进人；',
        '选择本租户跟进人、具体任务/坐席、五档执行优先级及必要AI场景': '人工选择人工分配或指定坐席，PRED只选任务，AI选任务+场景；维护五档等级，不选择独立责任跟进人',
        '具体任务/坐席、责任跟进人、必要AI场景和五档等级': '本方式具体任务或人工分配方式/坐席、必要AI场景及五档等级',
        '具体任务/坐席、责任跟进人、必要场景及五档等级': '本方式具体任务或人工分配方式/坐席、必要场景及五档等级',
        '具体目标、人员、场景和优先级': '具体目标或人工分配方式、场景和优先级',
        '任务/坐席与五档执行优先级维护在同一份安排': '任务或人工分配方式/坐席与五档优先级维护在同一份安排',
        '人员、任务/坐席有效性': '当前方式必需任务/坐席有效性',
        '同次保存责任、具体任务/坐席、场景及执行优先级': '同次保存本方式任务或人工分配方式/坐席、场景及执行优先级，人员仅按坐席或真实执行事实产生',
        '责任跟进人和具体执行任务/坐席分别保存': '执行安排不独立选择责任人，真实分配/发起/拨打/接听事实分别保存',
        '本租户责任跟进人与具体执行任务/坐席分别保存': '执行安排不独立选择责任人，真实分配/发起/拨打/接听事实分别保存',
        '已安排责任人，DIRECT分类当前允许且显式方式明确；必要AI场景当前有效': '本方式执行安排有效：人工已落实有效坐席，PRED任务明确，AI任务及场景明确；DIRECT分类允许且显式方式确定，不依赖独立责任人值',
        '安排当前租户责任跟进人': '确认本方式执行安排及人工坐席分配',
        '先选择本租户合法跟进人': '先完成本方式必需的任务或坐席安排',
        '场景及跟进人': '适配场景及本方式执行目标',
        '默认任务/坐席与必要AI场景；品牌共享不扩大资源权。': '默认任务或人工分配方式/坐席及必要AI场景；没有默认责任跟进人控件，品牌共享不扩大资源权。',
    }
    def rewrite(value):
        if isinstance(value, dict):
            return {k: (v if k in ['history', 'previous_source_records', 'raw', 'source_evidence', 'old'] else rewrite(v)) for k, v in value.items()}
        if isinstance(value, list):
            return [rewrite(v) for v in value]
        if isinstance(value, str):
            for old, new in changes.items():
                value = value.replace(old, new)
        return value
    b, p, u, pf, rules = [rewrite(x) for x in [b, p, u, pf, rules]]
    fields = {f['id']: f for f in b['fields']}
    locals_ = {l['id']: l for l in b['locals']}
    follower = fields['FIELD-FLOW-FOLLOWER']
    follower.update(name='实际人工坐席分配及历史人员事实', nullable=True, required_when='新人工指定/后续坐席分配后由有效seat关联账号产生；AI/PRED无独立责任人必填')
    follower['validation_rules'] = ['新安排没有独立责任人输入；人工从有效seat.accountId派生，AI/PRED不伪填操作者为责任人，空值不阻合法任务安排/发起；历史原人员事实只读保留。']
    follower['permissions']['write'] = ['系统按合法人工坐席分配或原实际执行事实写入；当前配置、导入和分配无独立责任人编辑。']
    follower['lifecycle'] = [{'state': '新安排', 'behavior': '人工MANUAL未分配时为空；SPECIFIC_SEAT从seat派生；AI/PRED不依赖此值。'}, {'state': '实际执行与历史', 'behavior': '真实发起/拨打/接听及旧人员分别记录；已受理段与封存历史不回改。'}]
    follower['derivation'] = {'kind': 'system', 'rule': follower['validation_rules'][0], 'dependencies': [RESOURCE, MANUAL_MODE]}
    follower['persistence']['write_when'] = '合法人工坐席分配时派生保存；AI/PRED新安排保持空，原已保存人员不清理。'
    follower['examples'] = {'valid': ['PRED仅TASK-A无follower可保存；MANUAL待分配为空，指定SEAT-A后记录其accountId。'], 'invalid': ['把当前操作者伪填为AI/PRED责任人，或以旧follower代替当前指定seat资格。']}
    for f in p['fields']:
        if f['id'] == 'FIELD-PLAT-FOLLOWER':
            f.update(name='原任务分配及历史人员事实', nullable=True, required_when='仅按原专业坐席分配/实际人员事实形成，不是新两模式独立必填')
            f['validation_rules'] = ['新两模式模板、导入、分配无独立责任人选择；人工由有效坐席分配派生，原专业/历史人员按其真实事实保留。']
            f['derivation']['rule'] = f['validation_rules'][0]
    resource = fields[RESOURCE]
    resource.update(nullable=True, required_when='AI/PRED明确实际安排时须有任务；人工SPECIFIC_SEAT或实际拨打前须有seat，MANUAL待分配可空')
    resource['validation_rules'] = ['只选本租户合法目标：PRED只任务，AI任务+适配场景；人工MANUAL可先无seat保存/导入待分配，SPECIFIC_SEAT才必选有效seat；真正起呼前人工必须落实seat且本人办理。取消独立责任人不放宽任务/模块授权。']
    resource['derivation']['rule'] = resource['validation_rules'][0]
    fields[DEFAULTS]['format'] = '[{tenantId,method?,manualAssignmentMode?,resourceId?,aiSceneId?}]；人工seat账号由合法seat派生，旧人员事实只读'
    fields[DEFAULTS]['validation_rules'] = ['节点/当前有权tenant默认无独立责任人控件。人工默认MANUAL可无seat保存；SPECIFIC_SEAT才核有效seat；PRED只任务、AI任务+scene。其他tenant映射保原值且不暴露私有候选。']
    fields[DEFAULTS]['derivation']['rule'] = fields[DEFAULTS]['validation_rules'][0]
    fields[DEFAULTS]['derivation']['dependencies'] = unique(fields[DEFAULTS]['derivation']['dependencies'] + [MANUAL_MODE, NODE_MANUAL_MODE])
    fields['FIELD-FLOW-ARRANGEMENT']['format'] = 'mode/run/nodeRun或directCycle/tenant/method/manualAssignmentMode/resourceId?/resourceSnapshot?/AI scene/executionPriority/queuedAt/queueSequence；人员由seat/真实事实派生'
    fields['FIELD-FLOW-ARRANGEMENT']['persistence']['write_when']='导入同次或原单条/批量安排明确成功时，保存准确模式/周期或节点、tenant、方式、manualAssignmentMode及本方式必要任务/seat/scene/五档等级；MANUAL可先无seat待分配，人工落实seat时派生账号，AI/PRED无独立责任人。'
    fields['FIELD-FLOW-ARRANGEMENT']['validation_rules']=unique(fields['FIELD-FLOW-ARRANGEMENT']['validation_rules']+['到后继新人工节点先按其本次策略：MANUAL清前seat并待分配，SPECIFIC_SEAT仅按本节点及原同tenant/method/有效资源规则沿用或确认；旧快照无新策略时保原解释，不读取时迁移。'])
    for ident, entity, name, when in [
        (MANUAL_MODE, 'ExecutionArrangement', '当前人工分配方式', '当前人工安排保存或导入时'),
        (NODE_MANUAL_MODE, 'FlowNode', '节点默认人工分配方式', '当前人工CALL节点保存时')]:
        if ident not in fields:
            f = copy.deepcopy(fields[PRIORITY if entity == 'ExecutionArrangement' else NODE_PRIORITY])
            f.update(id=ident, name=name, entity=entity, key='manualAssignmentMode', type='enum', format='MANUAL（人工分配） / SPECIFIC_SEAT（指定坐席）', nullable=False,
                     required_when='仅人工方式适用，缺省MANUAL；AI/PRED不要求此字段', source_refs=['docs/field-alignment.json#' + ident], source_keys=[],
                     test_refs=['CHECK-FLOW-MANUAL-ASSIGNMENT-MODE'])
            f['default'] = {'kind': 'literal', 'value': 'MANUAL', 'rule': '人工默认人工分配，可先保存/导入待分配；不默认选seat。'}
            f['validation_rules'] = ['人工仅MANUAL/SPECIFIC_SEAT；MANUAL无seat可保存及导入待分配，SPECIFIC_SEAT须当前有效seat；实际拨打前必须分配有效seat并核本人。AI/PRED不沿用人工seat或要求独立责任人。']
            f['derivation'] = {'kind': 'input', 'rule': '节点默认带出，导入或当前人工安排可明确覆盖；不伪造实际拨打。', 'dependencies': [RESOURCE]}
            f['persistence'] = {'kind': 'stored', 'write_when': when + '与本次准确对象同次保存；已受理执行及原历史不追改。'}
            f['lifecycle'] = [{'state': '草稿/保存', 'behavior': f['validation_rules'][0]}, {'state': '真实发起', 'behavior': '人工必须已落实seat且仅其本人发起；mode自身不授资源权。'}, {'state': '历史', 'behavior': '不迁移已受理段或封存旧值。'}]
            f['examples'] = {'valid': ['MANUAL不选seat先保存或导入待分配；SPECIFIC_SEAT选择SEAT-A。'], 'invalid': ['SPECIFIC_SEAT无seat，或AI/PRED借manual mode绕任务/场景校验。']}
            b['fields'].append(f);fields[ident] = f
        fields[ident]['validation_rules']=unique(fields[ident]['validation_rules']+['新后继人工节点MANUAL明确进入待分配，不继承前seat；SPECIFIC_SEAT才可在本节点、同tenant/method和有效资源下沿用或确认。旧快照无策略时按原解释，不读取时迁移。'])
    for ident in [NODE_MANUAL_MODE,NODE_PRIORITY]:
        fields[ident]['permissions']['read']=['具有本品牌模板读取资格的配置管理人；业务运行按原对象权限读取自身捕获快照。']
        fields[ident]['permissions']['write']=['具有本品牌模板维护动作权的超级管理员或租户管理员；仅改公共节点配置，不因此获得租户任务/坐席使用权。']
    assignment_locals = ['LOCAL-FLOW-ASSIGN', 'LOCAL-FLOW-ASSIGN-BATCH', 'LOCAL-FLOW-IMPORT-PREVIEW', 'LOCAL-FLOW-IMPORT-COMMIT', 'LOCAL-FLOW-START', 'LOCAL-FLOW-START-BATCH']
    for lid in assignment_locals:
        l = locals_[lid]
        l['inputs'] = [v for v in l['inputs'] if v != 'FIELD-FLOW-FOLLOWER']
        l['inputs'] = unique(l['inputs'] + [MANUAL_MODE])
        l['field_ids'] = unique(l['field_ids'] + [MANUAL_MODE])
        for step in l['steps']:
            step['reads'] = [v for v in step['reads'] if v != 'FIELD-FLOW-FOLLOWER']
        l['steps'][-1]['reads'] = unique(l['steps'][-1]['reads'] + [MANUAL_MODE])
    for lid in ['LOCAL-FLOW-QUERY','LOCAL-FLOW-DETAIL','LOCAL-FLOW-BATCH-READ','LOCAL-FLOW-CUSTOMER-TIMELINE','LOCAL-FLOW-HANDLER-INBOX']:
        if lid not in locals_:continue
        l=locals_[lid];l['inputs']=unique(l['inputs']+[MANUAL_MODE]);l['field_ids']=unique(l['field_ids']+[MANUAL_MODE]);l['steps'][-1]['reads']=unique(l['steps'][-1]['reads']+[MANUAL_MODE])
    for lid in ['LOCAL-FLOW-ADVANCE','LOCAL-FLOW-TRANSFER']:
        l=locals_[lid];l['inputs']=unique(l['inputs']+[MANUAL_MODE,NODE_MANUAL_MODE]);l['steps'][-1]['reads']=unique(l['steps'][-1]['reads']+[MANUAL_MODE,NODE_MANUAL_MODE])
        clause='后继新人工节点按其捕获策略：MANUAL明确清前seat并待分配，SPECIFIC_SEAT才可按本节点/同tenant/method及有效资源沿用或确认；旧无策略快照保原解释，不迁移'
        if clause not in l['steps'][-1]['action']:l['steps'][-1]['action']+='；'+clause
    for lid in ['LOCAL-FLOW-TEMPLATE-CREATE', 'LOCAL-FLOW-TEMPLATE-EDIT', 'LOCAL-FLOW-TEMPLATE-READ']:
        l = locals_[lid];l['inputs'] = unique(l['inputs'] + [NODE_MANUAL_MODE]);l['field_ids'] = unique(l['field_ids'] + [NODE_MANUAL_MODE]);l['steps'][-1]['reads'] = unique(l['steps'][-1]['reads'] + [NODE_MANUAL_MODE])
        if lid != 'LOCAL-FLOW-TEMPLATE-READ':
            l['outputs'] = unique(l['outputs'] + [NODE_MANUAL_MODE]);l['steps'][-1]['writes'] = unique(l['steps'][-1]['writes'] + [NODE_MANUAL_MODE])
    locals_['LOCAL-FLOW-ASSIGN']['title'] = '确认任务或人工分配方式及坐席'
    locals_['LOCAL-FLOW-ASSIGN']['steps'][0]['action'] = '按当前模式/方式读取本租户有权任务/场景或坐席；不读取独立责任人候选作为必填'
    locals_['LOCAL-FLOW-ASSIGN']['steps'][1]['action'] = '人工默认MANUAL可先待分配，SPECIFIC_SEAT才必选seat；PRED只任务，AI任务+scene，不选择独立责任人；保存五档等级，人员仅由seat或真实执行事实产生，不改owner/模板方式、不自动起呼'
    locals_['LOCAL-FLOW-ASSIGN-BATCH']['steps'][1]['action'] = '同组按方式确认任务或人工分配方式/坐席、必要scene及五档等级，不选择独立责任人；任一资源无权或失效全组不写'
    locals_['LOCAL-FLOW-START']['steps'][1]['action'] = '人工须已明确有效seat且仅其本人办理；AI/PRED不要求独立assignedAccountId或followupAccountId，真实actor/拨打/接听事实分别写入'
    for f in b['features']:
        if f['id'] == 'FUNC-2037':
            f['description'] = 'DIRECT与TEMPLATE共用任务或人工分配方式/坐席及五档等级：人工默认待分配、指定坐席才必选seat；PRED只任务，AI任务+scene。模板/导入/分配无独立责任人输入，实际人员由坐席分配及真实执行/接听事实记录；保留原单条/批量分配，不改owner或自动起呼。'
            f['bounds']['included_scope'] = ['两模式按方式确认任务或人工分配方式/坐席及五档等级', '人工MANUAL可先保存/导入待分配，SPECIFIC_SEAT才必选seat，保留原单条/批量分配', 'PRED只任务、AI任务+scene，不额外选责任人；真实人员事实系统记录']
        if f['id']=='FUNC-2034':
            f['description']='以字段参考分类读取条件来源，在唯一开始锚点编排转交、呼叫、结束；每CALL单方式、有序首命中路径。人工默认MANUAL可无seat先保存，SPECIFIC_SEAT才必选有效seat；PRED默认只任务，AI默认任务+scene，无默认责任人控件。CALL默认五档等级与分租户目标维护不扩大资源权，保存模板不绑定业务。'
        f['bounds']['included_scope']=unique(f['bounds']['included_scope'])
    acs = [
        ('AC-2155', 'TEMPLATE与DIRECT人工均提供MANUAL人工分配（默认）和SPECIFIC_SEAT指定坐席；前者可无seat先保存模板/导入待分配，后者才必选本租户有效seat。后继新人工节点MANUAL明确待分配，不继承前seat；SPECIFIC_SEAT才可按本节点及原同tenant/method/有效资源规则沿用或确认。旧快照无策略按原解释，不迁移；原单条/批量分配可随后落实seat，实际拨打仅对应本人。'),
        ('AC-2156', '预外呼只必选具体任务，坐席/队列/策略沿任务；AI仍必选任务和适配scene。模板默认、导入和分配均无独立责任跟进人选择，不因缺少该值阻合法任务安排/发起，也不伪填当前actor为负责人。'),
        ('AC-2157', '人工分配责任从有效seat账号派生，真实发起/拨打/接听/填写及旧人员事实分别保存；谁接听谁填写，已受理段及封存历史不迁移。取消独立person必填不扩大任务、租户、模块权限或绕五档/FIFO、联系、手工启动、在途/未知准入。')]
    for aid, statement in acs:
        b['acceptance_updates'] = [a for a in b['acceptance_updates'] if a['id'] != aid] + [{'id': aid, 'statement': statement, 'source_refs': ['docs/exception-definitions.json#CHG-043-ASSIGNMENT'], 'decision_refs': ['CHG-043-ASSIGNMENT']}]
    for a in b['acceptance_updates']:
        if a['id'] == 'AC-2150':a['statement'] = '两模式AI任务+scene、PRED仅任务，人工MANUAL待分配或SPECIFIC_SEAT才必选seat；实际发起复核准确资源，人工须已分配且本人办理，不选择独立责任人。'
        if a['id'] == 'AC-2118':a['statement'] = '两模式按方式安排任务或人工分配方式/坐席、必要scene及五档等级；模板、导入、分配不再选择独立责任人。人工MANUAL可先待分配，PRED只任务，AI任务+scene，不改owner或自动起呼。'
    checks = [
        ('CHECK-FLOW-MANUAL-ASSIGNMENT-MODE', 'LOCAL-FLOW-TEMPLATE-EDIT', ['AC-2155'], '两模式人工分别MANUAL无seat保存模板/导入，再原单条/批量分配；SPECIFIC_SEAT缺seat及有合法seat两例；前节点已指定seat后进入新MANUAL/SPECIFIC_SEAT后继及旧无策略快照，刷新回读并由目标本人起呼。', 'MANUAL缺省无seat可先待分配，新MANUAL后继不继承前seat；SPECIFIC_SEAT缺seat拒绝，仅按本节点及原同tenant/method/有效资源规则沿用或确认。旧快照无策略保原解释，不读取时迁移；有效分配后仅本人办理，五档与原守卫不变。'),
        ('CHECK-FLOW-TASK-WITHOUT-FOLLOWER', 'LOCAL-FLOW-ASSIGN', ['AC-2156'], 'TEMPLATE/DIRECT的PRED仅给有效任务，AI给任务+scene，不传person；模板默认、导入、单条/批量分配及发起均覆盖，并加入异租户/失效/模块无权任务。', '无独立人员控件或必填；合法任务可安排/发起，不额外选坐席，不伪填actor；非法或无权任务仍拒绝。'),
        ('CHECK-FLOW-DERIVED-PEOPLE-HISTORY', 'LOCAL-FLOW-START', ['AC-2157'], '人工待分配、指定seat、PRED实际接听本人及AI实际发起分别记录；回读旧follower/已受理段和封存快照，构造未知与在途、无权资源。', '人工责任由seat派生，AI/PRED当前安排不强造负责人；实际actor/拨打/接听/archiver准确，谁接听谁填写，旧人员历史不改，所有原权限和执行限制继续。')]
    for cid, lid, aids, procedure, expected in checks:
        b['checks'] = [c for c in b['checks'] if c['id'] != cid] + [{'id': cid, 'acceptance_ids': aids, 'procedure': procedure, 'expected': expected, 'assignment_simplification_revision': VERSION}]
        locals_[lid]['test_refs'] = unique(locals_[lid]['test_refs'] + [cid])
    for f in b['features']:
        aids = {'FUNC-2031':['AC-2156','AC-2157'], 'FUNC-2034':['AC-2155','AC-2156'], 'FUNC-2035':['AC-2155','AC-2156'], 'FUNC-2036':['AC-2155','AC-2156'], 'FUNC-2037':['AC-2155','AC-2156','AC-2157'], 'FUNC-2039':['AC-2157']}.get(f['id'], [])
        if aids:f['acceptance_ids'] = unique(f['acceptance_ids'] + aids);f['source_refs'] = unique(f['source_refs'] + ['docs/exception-definitions.json#CHG-043-ASSIGNMENT'])
    for page in u['ui']['pages']:
        if page['id'] == 'UI-PAGE-2228':page['fields'] = [f for f in page['fields'] if f['field_id'] not in ['FIELD-FLOW-FOLLOWER','FIELD-PLAT-FOLLOWER']]
        for field in page['fields']:
            if field['field_id'] in ['FIELD-FLOW-FOLLOWER','FIELD-PLAT-FOLLOWER']:
                field.update(label='分配及实际人员事实',component_id='UI-COMP-READONLY',help_text=follower['validation_rules'][0],editable_when='只读实际或历史人员事实，当前无独立责任人选择。',required_indicator='不是新安排输入或必填。',formatting='人工从seat派生；AI/PRED无独立责任人时显示尚未产生人员事实，不显示为人员缺失阻塞。')
        if page['id'] not in ['UI-PAGE-2204','UI-PAGE-2226','UI-PAGE-2227','UI-PAGE-2228']:continue
        ident = NODE_MANUAL_MODE if page['id']=='UI-PAGE-2228' else MANUAL_MODE
        if ident not in [f['field_id'] for f in page['fields']]:
            base=copy.deepcopy(next(f for f in page['fields'] if f['field_id'] in [PRIORITY,NODE_PRIORITY]));base.update(field_id=ident,label=fields[ident]['name'],component_id='UI-COMP-SELECT',help_text=fields[ident]['validation_rules'][0],visible_when='当前呼叫方式为MANUAL时显示；AI/PRED隐藏且不校验此值。',required_indicator='人工缺省MANUAL；仅SPECIFIC_SEAT显示具体seat必填。',formatting=fields[ident]['format']);page['fields'].append(base)
        for field in page['fields']:
            if field['field_id'] in [RESOURCE,DEFAULTS]:field['help_text']='；'.join(fields[field['field_id']]['validation_rules']);field['required_indicator']='按方式及分配模式条件必填：人工MANUAL可空，SPECIFIC_SEAT才需seat；AI任务+scene，PRED仅任务，无独立责任人。'
        page['test_refs']=unique(page['test_refs']+[c[0] for c in checks if c[1] in page['local_logic_ids']])
        for interaction in page['interactions']:
            related=[locals_[lid] for lid in interaction['local_logic_ids'] if lid in locals_]
            if not any(l['id'] in assignment_locals+['LOCAL-FLOW-TEMPLATE-CREATE','LOCAL-FLOW-TEMPLATE-EDIT','LOCAL-FLOW-TEMPLATE-READ'] for l in related):continue
            interaction['behavior']='；'.join('；'.join(s['action'] for s in l['steps']) for l in related)+'；无独立责任人输入；失败/未知保当前草稿和准确身份，不自动起呼。'
            interaction['test_refs']=unique(interaction['test_refs']+[t for l in related for t in l['test_refs']])
    for page in pf['pages']:
        if page['id'] not in ['PAGE-2204','PAGE-2226','PAGE-2227','PAGE-2228']:continue
        ident=NODE_MANUAL_MODE if page['id']=='PAGE-2228' else MANUAL_MODE
        page['canonical_field_ids']=unique(page.get('canonical_field_ids',[])+[ident])
        if ident not in [f.get('id',f.get('field_id')) for f in page['fields']]:page['fields'].append({'id':ident,'name':fields[ident]['name'],'local_logic_ids':[lid for lid in page['local_logic_ids'] if lid in locals_ and ident in locals_[lid]['field_ids']]})
    for l in b['locals']:
        if l['id'] not in assignment_locals+['LOCAL-FLOW-TEMPLATE-CREATE','LOCAL-FLOW-TEMPLATE-EDIT']:continue
        for cid in l['test_refs']:
            c=next((x for x in b['checks'] if x['id']==cid),None)
            if not c or cid in [x[0] for x in checks]:continue
            c['procedure']='按当前Step43安排规则：'+l['trigger']+'；'+'；'.join(s['action'] for s in l['steps'])+'。同时构造资源失效、异租户、未知/在途及人工SPECIFIC缺seat反例。'
            c['expected']='；'.join(l['postconditions'])+'；'+'；'.join(z['result'] for z in l['branches'])+'；人工MANUAL可先待分配；PRED只任务/AI任务+scene无独立人员必填，权限/五档/FIFO与历史继续。'
    statement='人工默认MANUAL人工分配，可无seat先保存/导入待分配，SPECIFIC_SEAT才必选seat；PRED只任务、AI任务+scene，模板/导入/分配无独立责任人。真实人员由坐席分配及实际执行/接听事实记录，历史不迁移，原权限与五档/FIFO/在途继续。'
    b['supersessions']=[s for s in b['supersessions'] if s['id']!='CHG-043-ASSIGNMENT']+[{'id':'CHG-043-ASSIGNMENT','old':'Step42所有人工安排先选seat，模板/导入/分配同时选择独立责任跟进人。','current':statement,'evidence_refs':['docs/exception-definitions.json#CHG-043-ASSIGNMENT']}]
    for supersession in b['supersessions']:
        if supersession['id']=='SUP-FLOW-ASSIGN':supersession['current']=statement
    b['execution_assignment_simplification']={'version':VERSION,'authorization':SIMPLIFY_AUTH,'field_ids':[MANUAL_MODE,NODE_MANUAL_MODE],'acceptance_ids':[a[0] for a in acs],'formal_approval':False,'production_verified':False}
    rules=[r for r in rules if r['id']!='GR-ASSIGNMENT-SIMPLIFICATION']+[{'id':'GR-ASSIGNMENT-SIMPLIFICATION','name':'按方式分配并移除独立责任人','statement':statement,'source_refs':['docs/exception-definitions.json#CHG-043-ASSIGNMENT'],'source_keys':[],'test_refs':[c[0] for c in checks]}]
    for lid in assignment_locals+['LOCAL-FLOW-TEMPLATE-CREATE','LOCAL-FLOW-TEMPLATE-EDIT']:
        l=locals_[lid];l['global_rule_ids']=unique(l['global_rule_ids']+['GR-ASSIGNMENT-SIMPLIFICATION']);l['steps'][-1]['rule_ids']=unique(l['steps'][-1]['rule_ids']+['GR-ASSIGNMENT-SIMPLIFICATION'])
    for l in b['locals']:
        for step in l['steps']:step['action']='；'.join(unique(part.strip() for part in step['action'].split('；') if part.strip()))
        used=l['inputs']+l['outputs']+[v for s in l['steps'] for v in s['reads']+s['writes']]+[v for z in l['branches'] for v in z['field_ids']]
        l['field_ids']=unique(used)
    return b,p,u,pf,rules


def apply():
    b = current_strings(read(ROOT / 'fragments/business.json'))
    p = current_strings(read(ROOT / 'fragments/platform.json'))
    u = current_strings(read(ROOT / 'fragments/ui.json'))
    pf = current_strings(read(ROOT / 'fragments/ui-page-facts.json'))
    rules = current_strings(read(ROOT / 'global-rule-drafts.json'))
    fields = {f['id']: f for f in b['fields']}
    locals_ = {l['id']: l for l in b['locals']}
    legacy_priority = fields['FIELD-FLOW-CATEGORY-PRIORITY']
    legacy_priority.update(name='历史分类联系权重', required_when='仅原专业兼容或旧保存值存在时保留，当前执行安排不新增此配置')
    legacy_priority['validation_rules'] = ['仅保留原0～999分类权重供历史及原专业兼容；当前UI只读，不迁移为五档，也不参与当前同号或同资源排序。']
    legacy_priority['default'] = {'kind': 'literal', 'value': [], 'rule': '没有旧配置时保持空；当前执行安排使用五档默认中，不在此新增数字配置。'}
    legacy_priority['permissions']['write'] = ['原专业兼容路径按原独立权限处理；当前两模式执行优先级入口不可编辑此历史字段。']
    legacy_priority['lifecycle'] = [{'state': '当前读取', 'behavior': '有原值时只读展示历史含义并引导五档执行安排；没有值不新增数字编辑。'}, {'state': '新执行协调', 'behavior': '五档降序、queuedAt/queueSequence FIFO和稳定业务ID；同号/同资源同一总序，不读取此旧权重。'}]
    legacy_priority['derivation'] = {'kind': 'input', 'rule': legacy_priority['validation_rules'][0], 'dependencies': []}
    legacy_priority['persistence']['write_when'] = '保留既有历史值和原专业兼容写回，当前两模式新安排不写旧分类权重。'
    legacy_priority['examples'] = {'valid': ['原保存lead=10/lxs=2只读保留，不影响当前同档FIFO。'], 'invalid': ['把旧权重插在五档与FIFO之间改变当前顺序，或在当前UI编辑旧值。']}
    for feature in b['features']:
        clauses = {
            'FUNC-2031': '当前待执行安排固定具体resourceId；同资源可办理待办按五档等级及同级入队FIFO派发，不抢占已受理执行，人工仍所选坐席本人办理。',
            'FUNC-2034': 'CALL可设置默认执行优先级及按实际承接tenant的默认任务/坐席与必要AI场景；品牌共享不扩大资源权。',
            'FUNC-2035': '修改CALL默认安排仅影响新运行，其他租户映射保留且本租户不可越权修改；已受理执行快照不追改。',
            'FUNC-2036': '导入可按本批实际首CALL分组确认具体目标和五档等级，也可先导入后手动分配；改变安排使旧预检失效。',
            'FUNC-2039': '列表和详情展示具体目标与五档等级；待执行视图按资源内等级与入队先后，普通历史列表仍更新时间倒序，长期等待可提示。',
        }
        if feature['id'] == 'FUNC-2037':
            feature['name'] = '分配本租户具体任务或坐席及执行优先级'
            feature['bounds']['included_scope'] = ['本租户单条/同组批量手动分配具体任务或坐席、责任人和五档执行优先级', '两模式导入同次安排或导入后安排', '选择并重核适配的当前AI场景及具体任务']
        clause = clauses.get(feature['id'])
        if clause and clause not in feature['description']:
            feature['description'] += ' ' + clause
        if feature['id'] in ['FUNC-2031', 'FUNC-2034', 'FUNC-2035', 'FUNC-2036', 'FUNC-2037', 'FUNC-2039']:
            feature['source_refs'] = unique(feature['source_refs'] + ['docs/exception-definitions.json#CHG-042-EXECUTION'])
            if clause:
                feature['bounds']['included_scope'] = unique(feature['bounds']['included_scope'] + [clause])

    def add_field(ident, name, entity, key, kind, fmt, rule, default, test_refs, dependencies, read_only=False):
        if ident in fields:
            return
        field = copy.deepcopy(fields['FIELD-FLOW-ARRANGEMENT'])
        field.update(id=ident, name=name, entity=entity, key=key, type=kind, format=fmt,
                     nullable=False, required_when='本次明确安排或节点配置生效时必需；尚未安排可没有该当前安排',
                     source_refs=['docs/field-alignment.json#' + ident], source_keys=[], test_refs=test_refs)
        field['default'] = default
        field['validation_rules'] = [rule]
        field['derivation'] = {'kind': 'system' if read_only else 'input', 'rule': rule, 'dependencies': dependencies}
        field['persistence'] = {'kind': 'stored', 'write_when': '合法安排/节点保存时产生；当前执行受理后封存于原跟进快照，跨租户不沿用旧安排；普通读取不写。'}
        field['lifecycle'] = [
            {'state': '草稿与明确保存', 'behavior': rule},
            {'state': '失败、未知或并发冲突', 'behavior': '保原选择和输入，重验或核对同次请求；不部分写入、猜首项或自动再次起呼。'},
            {'state': '历史读取', 'behavior': '当前配置或改派不追改已受理执行的原值/快照。'}]
        field['examples'] = {'valid': [rule], 'invalid': ['非法等级、异租户资源、失效目标或伪造入队时间，拒绝且保输入。']}
        if read_only:
            field['permissions']['write'] = ['系统依据当前合法安排和队列事实生成；用户不可直接编辑。']
        fields[ident] = field
        b['fields'].append(field)

    check_assign = ['CHECK-FLOW-EXECUTION-TARGET', 'CHECK-FLOW-IMPORT-ARRANGEMENT']
    add_field(RESOURCE, '当前具体任务或坐席', 'ExecutionArrangement', 'resourceId', 'string', '当前负责租户资源稳定ID；AI/预外呼为任务，MANUAL为坐席',
              '按当前tenant、方式、分类及必要AI场景取合法候选；明确选具体resourceId，提交和实际起呼复核；多个候选不猜首项。',
              {'kind': 'none', 'value': None, 'rule': '可带出本租户有效节点默认；无明确安排时保待安排，不造资源ID。'}, check_assign,
              ['FIELD-FLOW-OWNER-TENANT', 'FIELD-FLOW-METHOD', 'FIELD-FLOW-AI-SCENE'])
    add_field(PRIORITY, '执行优先级', 'ExecutionArrangement', 'executionPriority', 'integer', '5最高 / 4高 / 3中 / 2低 / 1最低',
              '仅整数1～5，缺省3；当前明确安排覆盖模板节点默认；同资源可办理待执行项高先，同级按queuedAt和queueSequence先后。旧分类0～999不静默转档。',
              {'kind': 'literal', 'value': 3, 'rule': '未显式覆盖时采用有效节点默认，否则中；旧分类数值不是五档来源。'},
              ['CHECK-FLOW-EXECUTION-PRIORITY'], [NODE_PRIORITY])
    add_field(QUEUED, '当前安排入队时间', 'ExecutionArrangement', 'queuedAt', 'datetime', '带时区时间戳，界面按北京时间展示',
              '当前安排首次进入待执行队列时由系统记录；同一安排仅改等级、查询或普通编辑不刷新时间；新节点/阶段或显式新安排形成新的入队事实。',
              {'kind': 'none', 'value': None, 'rule': '尚无当前安排不伪造入队时间。'}, ['CHECK-FLOW-EXECUTION-PRIORITY'], [RESOURCE], True)
    add_field(SEQUENCE, '同刻入队稳定顺序', 'ExecutionArrangement', 'queueSequence', 'integer', '系统生成非负整数；同毫秒等优先队列的稳定顺序',
              '同优先且queuedAt相同的记录按系统既有入队序号升序；读取和仅调优先级不重建序号，不按列表更新时间代替入队顺序。',
              {'kind': 'none', 'value': None, 'rule': '建立当前合法安排时与入队时间同次产生。'}, ['CHECK-FLOW-EXECUTION-PRIORITY'], [QUEUED], True)
    add_field(NODE_PRIORITY, '呼叫节点默认执行优先级', 'FlowNode', 'executionPriority', 'integer', '5最高 / 4高 / 3中 / 2低 / 1最低',
              'CALL节点配置默认等级，缺省中；导入或手动安排可明确覆盖；新运行捕获模板当时值，历史运行不追改。',
              {'kind': 'literal', 'value': 3, 'rule': '新CALL节点默认中。'}, ['CHECK-FLOW-EXECUTION-DEFAULTS'], [])
    add_field(DEFAULTS, '呼叫节点分租户默认安排', 'FlowNode', 'executionDefaults', 'array', '[{tenantId,method?,resourceId,accountId,aiSceneId?}]；tenantId唯一',
              '仅可维护当前实际有权执行租户的映射；不展示其他租户私有候选，保存保留其他租户原映射。资源与节点单方式/场景适配；换方式不得沿用不兼容目标。',
              {'kind': 'literal', 'value': [], 'rule': '没有明确映射时由导入或手动分配补齐，不按首项代填。'},
              ['CHECK-FLOW-EXECUTION-DEFAULTS'], ['FIELD-FLOW-OWNER-TENANT', 'FIELD-FLOW-METHOD', RESOURCE])

    # Extend existing independently testable operations instead of inventing a second workflow.
    uses = {
        'LOCAL-FLOW-ASSIGN': EXEC_FIELDS,
        'LOCAL-FLOW-ASSIGN-BATCH': EXEC_FIELDS,
        'LOCAL-FLOW-IMPORT-PREVIEW': EXEC_FIELDS + NODE_FIELDS,
        'LOCAL-FLOW-IMPORT-COMMIT': EXEC_FIELDS + NODE_FIELDS,
        'LOCAL-FLOW-START': EXEC_FIELDS,
        'LOCAL-FLOW-START-BATCH': EXEC_FIELDS,
        'LOCAL-FLOW-QUERY': EXEC_FIELDS,
        'LOCAL-FLOW-DETAIL': EXEC_FIELDS,
        'LOCAL-FLOW-TEMPLATE-CREATE': NODE_FIELDS,
        'LOCAL-FLOW-TEMPLATE-EDIT': NODE_FIELDS,
        'LOCAL-FLOW-TEMPLATE-READ': NODE_FIELDS,
        'LOCAL-FLOW-CONTACT-POLICY': [PRIORITY, QUEUED, SEQUENCE],
    }
    for lid, ids in uses.items():
        local = locals_[lid]
        local['inputs'] = unique(local['inputs'] + ids)
        local['field_ids'] = unique(local['field_ids'] + ids)
        local['steps'][-1]['reads'] = unique(local['steps'][-1]['reads'] + ids)
        if lid in ['LOCAL-FLOW-ASSIGN', 'LOCAL-FLOW-ASSIGN-BATCH', 'LOCAL-FLOW-IMPORT-COMMIT']:
            local['outputs'] = unique(local['outputs'] + EXEC_FIELDS)
            local['steps'][-1]['writes'] = unique(local['steps'][-1]['writes'] + EXEC_FIELDS)
        elif lid in ['LOCAL-FLOW-TEMPLATE-CREATE', 'LOCAL-FLOW-TEMPLATE-EDIT']:
            local['outputs'] = unique(local['outputs'] + NODE_FIELDS)
            local['steps'][-1]['writes'] = unique(local['steps'][-1]['writes'] + NODE_FIELDS)
    locals_['LOCAL-FLOW-ASSIGN']['title'] = '安排本租户具体任务或坐席及执行优先级'
    locals_['LOCAL-FLOW-ASSIGN-BATCH']['title'] = '同组批量手动分配具体执行目标'
    locals_['LOCAL-FLOW-CONTACT-POLICY']['steps'][0]['action'] = '校0禁用额外频控及有效范围；旧分类权重仅有值时只读保留，当前界面不再编辑，五档等级从当前执行安排维护'
    changes = {
        'LOCAL-FLOW-ASSIGN-BATCH': '同组共同候选中选择具体任务/坐席、责任跟进人、必要AI场景和五档等级，逐条重核后同次写入；任一行失败全组不写，保原手动分配入口。',
        'LOCAL-FLOW-IMPORT-PREVIEW': '按本批实际首CALL分组显示方式/数量、具体任务或坐席、必要场景及五档等级；导入安排可覆盖本租户节点默认，也可保留稍后手动分配；目标/等级变化失效旧预览。',
        'LOCAL-FLOW-IMPORT-COMMIT': '同次重核并保存本次明确的具体目标、人员、场景和优先级；未选择同次分配时形成待安排记录，保原单条/批量手动分配入口；不自动起呼。',
        'LOCAL-FLOW-TEMPLATE-CREATE': 'CALL配置五档默认等级及当前有权执行tenant的任务/坐席默认；保存其他tenant映射不变，不展示私有候选。',
        'LOCAL-FLOW-TEMPLATE-EDIT': 'CALL默认等级及当前有权tenant映射可改，换方式重核目标，保其他tenant映射；仅新运行捕获新默认。',
        'LOCAL-FLOW-START': '按准确保存resourceId及场景重新核资源；manual仅所选坐席本人起呼。同资源高等级的可办理待办优先，既有执行不被抢占；所有原联系/资格限制先检查。',
        'LOCAL-FLOW-QUERY': '列表/详情展示mode、具体任务/坐席及等级；待执行视图以资源内等级降序、入队时间和稳定序号升序推荐，普通历史查询仍更新时间倒序；长期等待提示处理。',
        'LOCAL-FLOW-CONTACT-POLICY': '同号码及同资源使用五档降序、queuedAt/queueSequence入队FIFO和稳定业务ID的统一总序，避免交叉等待；旧分类0～999仅保历史/原专业兼容，不参与新排序，当前UI只读，不抢占在途。',
    }
    for lid, clause in changes.items():
        if clause not in locals_[lid]['steps'][-1]['action']:
            locals_[lid]['steps'][-1]['action'] += '；' + clause
    checks = [
        ('CHECK-FLOW-EXECUTION-TARGET', 'LOCAL-FLOW-ASSIGN', ['AC-2118', 'AC-2150'],
         'TEMPLATE与DIRECT分别构造AI、预外呼及人工；同方式至少两个本租户任务/坐席，明确选择其中一项保存，刷新后按准确resourceId发起；构造异租户、停用、场景冲突、失效资源。',
         '保存并实际使用明确目标；非法对象拒绝且保草稿，多个候选不取首项；人工由所选坐席本人办理，责任跟进人分别保留。'),
        ('CHECK-FLOW-IMPORT-ARRANGEMENT', 'LOCAL-FLOW-IMPORT-PREVIEW', ['AC-2151'],
         '两模式导入选择同次安排或稍后分配；TEMPLATE名单命中不同首CALL时逐组确认目标及适用数量；修改目标、场景或等级后复用旧预检，再重新检查。',
         '同次安排与导入一致提交；稍后安排保原单条/批量手动分配入口；组间不混资源，旧确认失效，任何本次纳入行失败均不部分写入。'),
        ('CHECK-FLOW-EXECUTION-PRIORITY', 'LOCAL-FLOW-START-BATCH', ['AC-2152'],
         '同资源构造5/4/3/2/1待执行项与同档不同入队时间/同刻序号；另有独立资源、在途执行、联系受限、非法等级及长期等待项，明确发起。',
         '缺省中；同资源可办理项先高后低、同档按入队FIFO和稳定序号，人工推荐及AI/预外呼派发一致；独立资源可办理，不抢占在途、不绕联系限制，长期等待可提示。'),
        ('CHECK-FLOW-EXECUTION-DEFAULTS', 'LOCAL-FLOW-TEMPLATE-EDIT', ['AC-2153'],
         '同品牌两个租户在同CALL维护各自默认任务/坐席和五档默认；本租户保存、另一租户查看；导入显式覆盖；更换CALL方式并使用旧目标。',
         '只出现本有权tenant候选，保存保其他tenant映射；按实际承接tenant带出默认，导入可覆盖；换方式须重核兼容目标，历史运行不变。'),
        ('CHECK-FLOW-EXECUTION-HISTORY', 'LOCAL-FLOW-DETAIL', ['AC-2154'],
         '保存执行安排后发起并捕获实际跟进快照；改派未启动记录、调整级别、跨租户转交及对未知请求重试；回读原段和转出截止。',
         '已受理目标及等级快照保留；仅未启动安排可改，跨tenant清旧责任/资源安排；未知按同请求核对，不能改目标重呼，旧快照不追改。'),
    ]
    for cid, lid, aids, procedure, expected in checks:
        item = {'id': cid, 'acceptance_ids': aids, 'procedure': procedure, 'expected': expected,
                'execution_arrangement_revision': VERSION}
        b['checks'] = [c for c in b['checks'] if c['id'] != cid] + [item]
        locals_[lid]['test_refs'] = unique(locals_[lid]['test_refs'] + [cid])
    acs = [
        ('AC-2150', 'TEMPLATE与DIRECT均能指定当前负责租户具体AI/预外呼任务或人工坐席；AI任务与场景适配。保存和启动按准确resourceId重核，多个候选不猜首项，人工由所选坐席对应本人办理。'),
        ('AC-2151', '两模式均保留原手动单条/同组批量分配，可导入时安排或先导入后安排；TEMPLATE按实际首CALL分组确认，目标/人员/场景/等级变化失效旧预检，同次纳入行失败不部分写入。'),
        ('AC-2152', '执行优先级为最高5、高4、中3、低2、最低1，缺省中；同资源可办理待办按等级降序、同档入队时间及稳定序号升序，人工推荐与AI/预外呼显式派发一致。独立资源可办理、不抢占在途、不绕联系限制，长期等待可提示。'),
        ('AC-2153', 'CALL配置默认等级及按实际承接tenant的默认任务/坐席/场景；仅修改本有权tenant映射且保其他tenant原值，导入可明确覆盖；方式切换重核不兼容目标，已开运行和快照不追改。'),
        ('AC-2154', '具体执行目标、等级及入队事实随当前安排保存；已受理执行固定原目标和等级，合法跨租户清旧安排，未知核同次请求，不借改派再次起呼；历史跟进/通话/截止快照保留原事实。'),
    ]
    for aid, statement in acs:
        b['acceptance_updates'] = [a for a in b['acceptance_updates'] if a['id'] != aid] + [
            {'id': aid, 'statement': statement, 'source_refs': ['docs/exception-definitions.json#CHG-042-EXECUTION'], 'decision_refs': ['CHG-042-EXECUTION']}]
    memberships = {'FUNC-2031': ['AC-2150', 'AC-2152', 'AC-2154'], 'FUNC-2034': ['AC-2153'],
                   'FUNC-2035': ['AC-2153'], 'FUNC-2036': ['AC-2151'],
                   'FUNC-2037': ['AC-2150', 'AC-2151', 'AC-2152'], 'FUNC-2039': ['AC-2152', 'AC-2154']}
    for f in b['features']:
        f['acceptance_ids'] = unique(f['acceptance_ids'] + memberships.get(f['id'], []))
    for local in b['locals']:
        if local['id'] not in uses:
            continue
        # Existing CHECKs follow current operation text; their prior history stays unchanged.
        for cid in local['test_refs']:
            item = next((c for c in b['checks'] if c['id'] == cid), None)
            if not item or cid.startswith('CHECK-FLOW-EXECUTION') or cid == 'CHECK-FLOW-IMPORT-ARRANGEMENT':
                continue
            item['procedure'] = '按当前两模式安排版本执行：' + local['trigger'] + '。操作：' + '；'.join(s['action'] for s in local['steps']) + '。分别构造：' + '；'.join(z['condition'] for z in local['branches']) + '。'
            item['expected'] = '；'.join(local['postconditions']) + '；' + '；'.join(z['result'] for z in local['branches']) + '。'
            item['execution_arrangement_revision'] = VERSION

    for page in u['ui']['pages']:
        for value in page['fields']:
            if value['field_id'] == 'FIELD-FLOW-CATEGORY-PRIORITY':
                value.update(label='历史分类联系权重', component_id='UI-COMP-READONLY',
                             help_text=legacy_priority['validation_rules'][0], editable_when='当前界面只读，无旧值不显示数字编辑；修改执行等级请到本条或本批五档执行安排。',
                             required_indicator='历史只读展示，无当前输入必填。',
                             formatting='保原0～999权重及其历史含义，不作为当前执行优先级。')
        if page['id'] not in ['UI-PAGE-2204', 'UI-PAGE-2226', 'UI-PAGE-2227', 'UI-PAGE-2228']:
            continue
        ids = NODE_FIELDS if page['id'] == 'UI-PAGE-2228' else EXEC_FIELDS
        base = next((f for f in page['fields'] if f['component_id'] == 'UI-COMP-SELECT'), page['fields'][0])
        for ident in ids:
            if ident in [f['field_id'] for f in page['fields']]:
                continue
            spec = fields[ident]
            readonly = ident in [QUEUED, SEQUENCE]
            f = copy.deepcopy(base)
            f.update(field_id=ident, label=spec['name'], component_id='UI-COMP-READONLY' if readonly else 'UI-COMP-SELECT',
                     help_text='；'.join(spec['validation_rules']), formatting=spec['format'],
                     required_indicator='当前明确安排/保存时显示必需标记；只读队列事实不显示输入必填。',
                     editable_when='只读系统队列事实。' if readonly else '当前有权管理员且待执行安排可修改；模板仅改本有权tenant映射，未知或已受理执行不可修改。',
                     error_message='保原输入并显示准确目标/等级/范围失效原因；重新核验，不首项代填。')
            page['fields'].append(f)
        page['components'] = unique(page['components'] + ['UI-COMP-SELECT', 'UI-COMP-READONLY'])
        for interaction in page['interactions']:
            lids = interaction['local_logic_ids']
            if not any(lid in uses for lid in lids):
                continue
            item_locals = [locals_[lid] for lid in lids if lid in locals_]
            if not item_locals:
                continue
            interaction['behavior'] = '；'.join('；'.join(s['action'] for s in local['steps']) for local in item_locals) + '。失败/未知保草稿与准确身份，明确成功才更新；不自动起呼。'
            interaction['test_refs'] = unique(interaction['test_refs'] + [ref for local in item_locals for ref in local['test_refs']])
        page['test_refs'] = unique(page['test_refs'] + [ref for lid in page['local_logic_ids'] if lid in locals_ for ref in locals_[lid]['test_refs']])
    for page in pf['pages']:
        if page['id'] not in ['PAGE-2204', 'PAGE-2226', 'PAGE-2227', 'PAGE-2228']:
            continue
        ids = NODE_FIELDS if page['id'] == 'PAGE-2228' else EXEC_FIELDS
        page['canonical_field_ids'] = unique(page.get('canonical_field_ids', []) + ids)
        present = {f.get('id', f.get('field_id')) for f in page['fields']}
        page['fields'] += [{'id': ident, 'name': fields[ident]['name'], 'local_logic_ids': [lid for lid in page['local_logic_ids'] if lid in locals_ and ident in locals_[lid]['field_ids']]} for ident in ids if ident not in present]
    clause = 'TEMPLATE与DIRECT共用本租户具体任务/坐席与五档执行优先级，模板分租户默认和导入覆盖均按当前实际执行权复核；同资源可办理待办先高后低、同级入队FIFO，不抢占既有执行，手动分配入口保留。'
    rules = [r for r in rules if r['id'] != 'GR-EXECUTION-ARRANGEMENT'] + [
        {'id': 'GR-EXECUTION-ARRANGEMENT', 'name': '具体执行安排与五档优先级', 'statement': clause,
         'source_refs': ['docs/exception-definitions.json#CHG-042-EXECUTION'], 'source_keys': [],
         'test_refs': [c[0] for c in checks]}]
    for lid in uses:
        local = locals_[lid]
        local['global_rule_ids'] = unique(local['global_rule_ids'] + ['GR-EXECUTION-ARRANGEMENT'])
        local['steps'][-1]['rule_ids'] = unique(local['steps'][-1]['rule_ids'] + ['GR-EXECUTION-ARRANGEMENT'])
    b['supersessions'] = [s for s in b['supersessions'] if s['id'] != 'CHG-042-EXECUTION'] + [
        {'id': 'CHG-042-EXECUTION', 'old': '导入与分配只维护责任跟进人与AI场景，不提供具体任务/坐席选择；仅分类联系优先级0～999协调同号。',
         'current': clause, 'evidence_refs': ['docs/exception-definitions.json#CHG-042-EXECUTION']}]
    b['execution_arrangement_delta'] = {'version': VERSION, 'authorization': AUTH, 'acceptance_ids': [a[0] for a in acs],
                                        'field_ids': EXEC_FIELDS + NODE_FIELDS, 'formal_approval': False, 'production_verified': False}
    for question in b['engineering_questions']:
        if question['id'] == 'ENG-FLOW-EXECUTION':
            clause = '本次具体resourceId与真实供应商任务/坐席的准确映射、五档及入队FIFO的真实派发顺序/容量约束需工程证据；本地模拟顺序不证明供应商已支持优先级。'
            if clause not in question['question']:
                question['question'] += ' ' + clause
    b,p,u,pf,rules=simplify_assignment(b,p,u,pf,rules)
    from task_import_delta import apply as apply_task_import
    b,p,u,pf,rules=apply_task_import(b,p,u,pf,rules)
    from lifecycle_delta import apply as apply_lifecycle
    b,p,u,pf,rules=apply_lifecycle(b,p,u,pf,rules)
    from ai_provider_delta import apply as apply_ai_provider
    b,p,u,pf,rules=apply_ai_provider(b,p,u,pf,rules)
    from entry_import_current_delta import apply as apply_entry_current
    b,p,u,pf,rules=apply_entry_current(b,p,u,pf,rules)
    from profile_template_current_delta import apply as apply_profile_template
    b,p,u,pf,rules=apply_profile_template(b,p,u,pf,rules)
    for name, data in [('business.json', b), ('platform.json', p), ('ui.json', u), ('ui-page-facts.json', pf)]:
        write(ROOT / 'fragments' / name, data)
    write(ROOT / 'global-rule-drafts.json', rules)
    print(json.dumps({'version': VERSION, 'current_fields':len(b['fields'])+len(p['fields']),
                      'authored_acceptance_updates':len(b['acceptance_updates']), 'task_import_delta':b['task_import_delta'],
                      'runtime_modified': False, 'frozen_sources_modified': False}, ensure_ascii=False))


def project():
    """Refresh normalized current product inputs after apply; leave runtime and root memory alone."""
    sys.path.insert(0, str(ROOT))
    import assemble_product_specs as assembler
    assembler.prepare()
    source = ROOT / '续接输入'
    prototype = ROOT.parent.parent / 'prototype'
    for relative in ['docs/role-permissions.md','docs/interaction.html']:
        (source/relative).parent.mkdir(parents=True,exist_ok=True)
        (source/relative).write_bytes((prototype/relative).read_bytes())
    alignment = read(source / 'docs/field-alignment.json')
    retired = ROOT / '续接记录/retired-end-fields.json'
    if retired.exists():
        known = {f['id'] for f in alignment['mappings']}
        alignment['mappings'] += [f for f in read(retired) if f['id'] not in known]
        write(source / 'docs/field-alignment.json', alignment)
    previous = read(source / 'docs/exception-definitions.json')
    previous['version'] = VERSION
    previous['scope'] = '当前原型步骤29～56的产品投影；保Step48～54入口/导入/执行合同，并同步Step55客户档案全来源只读归集及Step56模板AI任务先选/自动目录/准确场景联动。局部通过不提升Step54的13组已验/9组部分、file/真实接口或正式审批。'
    previous['changes'] = [c for c in previous.get('changes', []) if c['id'] != 'CHG-042-EXECUTION'] + [
        {'id': 'CHG-042-EXECUTION', 'title': '两模式具体执行安排与五档执行优先级',
         'acceptance_ids': ['AC-2150', 'AC-2151', 'AC-2152', 'AC-2153', 'AC-2154'],
         'statement': next(s['current'] for s in read(ROOT / 'fragments/business.json')['supersessions'] if s['id']=='CHG-042-EXECUTION'),
         'authorization': AUTH, 'local_ids': ['LOCAL-FLOW-ASSIGN', 'LOCAL-FLOW-ASSIGN-BATCH', 'LOCAL-FLOW-IMPORT-PREVIEW',
                                           'LOCAL-FLOW-IMPORT-COMMIT', 'LOCAL-FLOW-START', 'LOCAL-FLOW-START-BATCH',
                                           'LOCAL-FLOW-TEMPLATE-CREATE', 'LOCAL-FLOW-TEMPLATE-EDIT', 'LOCAL-FLOW-QUERY']}]
    previous['changes']=[c for c in previous['changes'] if c['id']!='CHG-043-ASSIGNMENT']+[{'id':'CHG-043-ASSIGNMENT','title':'人工分配可选及删除冗余责任人','acceptance_ids':['AC-2155','AC-2156','AC-2157'],'statement':next(s['current'] for s in read(ROOT/'fragments/business.json')['supersessions'] if s['id']=='CHG-043-ASSIGNMENT'),'authorization':SIMPLIFY_AUTH,'local_ids':['LOCAL-FLOW-ASSIGN','LOCAL-FLOW-ASSIGN-BATCH','LOCAL-FLOW-TEMPLATE-CREATE','LOCAL-FLOW-TEMPLATE-EDIT','LOCAL-FLOW-IMPORT-PREVIEW','LOCAL-FLOW-IMPORT-COMMIT','LOCAL-FLOW-START']}]
    previous['changes']=[c for c in previous['changes'] if c['id']!='CHG-044-TASK-IMPORT']+[{'id':'CHG-044-TASK-IMPORT','title':'三入口IMPORT同源与任务DIRECT统一账本','acceptance_ids':['AC-2158','AC-2159','AC-2160','AC-2161','AC-2162'],'statement':next(s['current'] for s in read(ROOT/'fragments/business.json')['supersessions'] if s['id']=='CHG-044-TASK-IMPORT'),'authorization':TASK_IMPORT_AUTH,'local_ids':['LOCAL-FLOW-IMPORT-PREVIEW','LOCAL-FLOW-IMPORT-COMMIT','LOCAL-PLAT-AI-SCENE-SAVE','LOCAL-PLAT-AI-LIST-IMPORT','LOCAL-PLAT-CLOUD-TASK-IMPORT']}]
    previous['changes']=[c for c in previous['changes'] if c['id']!='CHG-045-LIFECYCLE']+[{'id':'CHG-045-LIFECYCLE','title':'受控废弃结清与当前END例外/停止事实','acceptance_ids':['AC-2163','AC-2164','AC-2165','AC-2166'],'statement':next(s['current'] for s in read(ROOT/'fragments/business.json')['supersessions'] if s['id']=='CHG-045-LIFECYCLE'),'authorization':LIFECYCLE_AUTH,'local_ids':['LOCAL-FLOW-ABANDON','LOCAL-FLOW-COMPLETE-DIRECT','LOCAL-FLOW-ENABLE-TEMPLATE','LOCAL-FLOW-RESUME-DIRECT','LOCAL-FLOW-CALL-FACTS']}]
    previous['changes']=[c for c in previous['changes'] if c['id']!='CHG-046-AI-PROVIDER-DIALOG']+[{'id':'CHG-046-AI-PROVIDER-DIALOG','title':'AI场景供应商独立参数与弹窗配置','acceptance_ids':['AC-2158','AC-2159'],'statement':next(s['current'] for s in read(ROOT/'fragments/business.json')['supersessions'] if s['id']=='CHG-046-AI-PROVIDER-DIALOG'),'authorization':PROVIDER_AUTH,'local_ids':['LOCAL-PLAT-AI-SCENE-SAVE','LOCAL-PLAT-AI-IMPORT-TEMPLATE','LOCAL-PLAT-AI-LIST-IMPORT','LOCAL-FLOW-IMPORT-PREVIEW','LOCAL-FLOW-IMPORT-COMMIT']}]
    previous['changes']=[c for c in previous['changes'] if c['id']!='CHG-047-AI-ADD-FIELD-UX']+[{'id':'CHG-047-AI-ADD-FIELD-UX','title':'保留添加字段单入口与线上弹窗呈现','acceptance_ids':['AC-2159'],'statement':next(s['current'] for s in read(ROOT/'fragments/business.json')['supersessions'] if s['id']=='CHG-047-AI-ADD-FIELD-UX'),'authorization':ADD_FIELD_UX_AUTH,'local_ids':['LOCAL-PLAT-AI-SCENE-SAVE']}]
    latest=read(ROOT/'fragments/business.json')['entry_import_current_delta']
    ids={c['id'] for c in latest['changes']}
    previous['changes']=[c for c in previous['changes'] if c['id'] not in ids]+latest['changes']
    from profile_template_current_delta import BOUNDARY
    current_delta=read(ROOT/'fragments/business.json')['profile_template_current_delta']
    new_ids={row['id'] for row in current_delta['changes']}
    previous['changes']=[row for row in previous['changes'] if row['id'] not in new_ids]+current_delta['changes']
    previous['current_verification_boundary']=BOUNDARY
    # This is the current mutable documentation source, not a historical source snapshot.
    write(source / 'docs/exception-definitions.json', previous)
    for relative in ['docs/functional-spec.json', 'docs/change-log.json', 'documentation/input/consolidated-reviewed-facts.json']:
        value = read(source / relative)
        value['version'] = VERSION
        write(source / relative, value)
    for relative in ['docs/change-log.md', 'documentation/README.md']:
        file = source / relative
        file.write_text(file.read_text().replace('2.0.0-current-20261030-dual', VERSION))
    decisions = source / 'docs/decisions.md'
    text = decisions.read_text()
    text += '\n\n## 2026-10-31 Step42具体执行安排\n\n当前两模式任务/坐席与五档执行优先级取代旧“只选跟进人、不选任务/坐席”限制；当前事实以本版规范JSON及CHG-042-EXECUTION为准。用户授权' + AUTH + '；历史口径只作追溯，不声明正式G3、真实调度接口或业务/运营批准。\n'
    text += '\n\n## 2026-10-31 Step43人工分配及人员事实修正\n\n人工默认MANUAL人工分配可先保存/导入待分配，SPECIFIC_SEAT才必选有效seat；PRED只任务，AI任务+scene，不再选择独立责任人。人员由seat分配或真实发起/拨打/接听事实记录，旧历史不改；权限、联系、五档/FIFO和在途守卫继续。来源'+SIMPLIFY_AUTH+'；当前规则取代Step42人工总必选seat与独立责任人输入，不改变正式审批。\n'
    text += '\n\n## 2026-11-01 Step44三入口同源业务导入\n\n客户维护、AI任务及预外呼任务统一分类IMPORT和code等系统必需schema；场景引用字段并保存供应商参数映射，不复制定义。任务新导入ADMIN+customer.import并叠原模块/任务/来源准入，默认DIRECT；统一账本保存taskImportSource及逐行参数快照，专业视图只读recordId，不新增原生行或重复供应商提交。分类允许DIRECT时独立于模板，旧历史不迁移、不按手机号认领。来源'+TASK_IMPORT_AUTH+'；原专业容量按exact context.importLimits保留，超限提示分批不截断，不提升真实接口/G3。\n'
    text += '\n\n## 2026-11-01 Step45生命周期审计收口\n\n缺必要本人内容仅当前ownerADMIN确认无法补填+原因/准确范围，在真实执行收敛后可受控废弃结清；保缺失未完成，不假正常archive，旧弃可靠收尾不永久卡DIRECT。历史END证明与当期首MANUAL例外分开，resume新周期核分类；停止中原受理迟到事实仍归原ID计数，不授新派发/提前释放。来源'+LIFECYCLE_AUTH+'；旧审计/冻结不改，新证据另核，不继承前轮通过。\n'
    text += '\n\n## 2026-11-01 Step46供应商场景参数与弹窗\n\n当前AI场景schema2按scene/platform独立配置IMPORT_FIELD引用和CUSTOM_COLUMN专属列；允许一字段多参数，分类定义仍权威，专属定义/规范值和参数快照独立。选择/配置均弹窗，子确认只入父草稿，主保存才持久，取消不升级旧配置。来源'+PROVIDER_AUTH+'；取代Step44仅fieldId限制，不提升供应商接口或正式批准。\n'
    text += '\n\n## 2026-11-01 Step47添加字段入口及线上布局\n\n原添加字段为主场景唯一新增入口，点击后二选来源；手工添加场景信息按线上业务信息只读、字段名称、参数名、必填/选填radio和取消/确定呈现，类型次要行保留。来源'+ADD_FIELD_UX_AUTH+'；只是原功能UI表现修正，schema2/80与64约束/权限/历史/快照不变，不增产品字段或编号。\n'
    from entry_import_current_delta import ENTRY, AI_SCHEMA, SIMPLE, SOURCE, CLOSE, LIMITS
    latest_note='\n\n<!-- STEP54-CURRENT-ENTRY -->\n## Step48～54 当前入口与有限验收\n\n'+ENTRY+'\n\n'+AI_SCHEMA+'\n\n'+SIMPLE+'\n\n'+SOURCE+'\n\n'+CLOSE+'\n\n'+LIMITS+'\n<!-- /STEP54-CURRENT-ENTRY -->\n'
    import re
    text=re.sub(r'\n*<!-- STEP54-CURRENT-ENTRY -->.*?<!-- /STEP54-CURRENT-ENTRY -->\n*','\n',text,flags=re.S)+latest_note
    from profile_template_current_delta import PROFILE, TEMPLATE, BOUNDARY
    current_note='\n\n<!-- STEP55-56-CURRENT -->\n## Step55～56 当前客户档案与模板任务入口\n\n'+PROFILE+'\n\n'+TEMPLATE+'\n\n'+BOUNDARY+'\n<!-- /STEP55-56-CURRENT -->\n'
    text=re.sub(r'\n*<!-- STEP55-56-CURRENT -->.*?<!-- /STEP55-56-CURRENT -->\n*','\n',text,flags=re.S)+current_note
    decisions.write_text(text)
    # Root current docs/readers are requested user deliverables, while root memory/control stays with orchestrator.
    relatives = ['docs/functional-spec.json', 'docs/functional-spec.md', 'docs/field-alignment.json', 'docs/field-alignment.md',
                 'docs/rules-appendix.json', 'docs/rules-appendix.md', 'docs/change-log.json', 'docs/change-log.md',
                 'docs/remaining-confirmations.json', 'docs/remaining-confirmations.md', 'docs/exception-definitions.json', 'documentation/README.md',
                 'documentation/input/functions.json', 'documentation/input/pages.json', 'documentation/input/consolidated-reviewed-facts.json']
    for relative in relatives:
        target = prototype / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes((source / relative).read_bytes())
    print(json.dumps({'normalized_source': str(source), 'current_documentation_files': relatives,
                      'root_memory_modified': False, 'workflow_modified': False}, ensure_ascii=False))


def capture():
    """Bind the current product projection to settled runtime files without claiming verification."""
    prototype = ROOT.parent.parent / 'prototype'
    tracked = []
    for directory in ['js', 'scripts', 'assets/css']:
        tracked += [p for p in (prototype / directory).rglob('*') if p.is_file() and p.suffix in ['.js', '.cjs', '.py', '.css'] and '__pycache__' not in p.parts]
    tracked += [prototype / 'index.html',prototype/'version-history.html', prototype / 'memory/change-log.md', prototype / 'memory/execution-steps.md',prototype/'memory/reuse-provenance.json', prototype / AUTH, prototype / SIMPLIFY_AUTH, prototype / TASK_IMPORT_AUTH,prototype/LIFECYCLE_AUTH,prototype/PROVIDER_AUTH,prototype/ADD_FIELD_UX_AUTH]
    tracked += [p for p in (prototype / 'config').glob('*') if p.is_file() and p.name != 'workflow.json' and p.suffix in ['.json', '.js']]
    from entry_import_current_delta import AUTHS, PROOF
    tracked += [prototype/rel for rel in AUTHS]
    tracked += [prototype/PROOF, prototype/'memory/http-e2e-acceptance-20261101/actual-click-checklist.json', prototype/'memory/http-e2e-acceptance-20261101/regression-final-race/summary.json', prototype/'memory/http-e2e-acceptance-20261101/regression-final-race/source-stability.json', prototype/'memory/http-e2e-acceptance-20261101/scene-reopen-fix.json']
    from profile_template_current_delta import AUTHS as PROFILE_AUTHS, PROOFS as PROFILE_PROOFS
    tracked += [prototype/rel for rel in PROFILE_AUTHS+PROFILE_PROOFS]
    tracked += [prototype/'inputs/development-package-and-dual-publish-authorization-20261102-step56.json',prototype/'docs/customer-profile-integration.md']
    for directory in ['memory/customer-profile-integration-20261102','memory/template-ai-task-entry-20261102']:
        base=prototype/directory
        tracked += [base/name for name in ['browser-evidence.json','static-verification.json','report.html','browser-final-assets.json','browser-final-metadata.json','final-binding-dom.json'] if (base/name).is_file()]
    evidence = read(ROOT / '续接输入/docs/exception-definitions.json')
    evidence.update(version=VERSION, captured_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    prototype_root=str(prototype),
                    files=[{'path': p.relative_to(prototype).as_posix(), 'bytes': p.stat().st_size,
                            'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(set(tracked))])
    write(ROOT / '续接输入/docs/exception-definitions.json', evidence)
    write(prototype / 'docs/exception-definitions.json', evidence)
    write(ROOT / '续接记录/current-prototype-evidence.json', evidence)
    write(ROOT / '续接记录/projection-result.json', {'source': str(ROOT / '续接输入'), 'version': VERSION,
                                                  'prototype_files_hashed': len(evidence['files']),
                                                  'prototype_files_modified_by_projection': [],
                                                  'implementation_verified_by_capture': False})
    print(json.dumps({'version': VERSION, 'hashed_files': len(evidence['files']), 'verification_claimed': False}, ensure_ascii=False))


if __name__ == '__main__':
    actions = {'apply': apply, 'project': project, 'capture': capture}
    if len(sys.argv) != 2 or sys.argv[1] not in actions:
        raise SystemExit('usage: python3 execution_arrangement_delta.py apply|project|capture')
    actions[sys.argv[1]]()
