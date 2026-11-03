"""Step57–60 authored product corrections; pure, idempotent in-memory projection.

Apply after profile_template_current_delta. Historical and source-evidence
branches stay unchanged; this module does not write runtime files or approvals.
"""
import copy
import re

from profile_template_current_delta import PROFILE_SOURCES as PREVIOUS_PROFILE_SOURCES

VERSION = '2.0.0-current-20261103-step60'
AUTHS = [
    'inputs/tenant-business-management-authorization-20261103.json',
    'inputs/tenant-management-http-resume-authorization-20261103.json',
    'inputs/predictive-create-feedback-authorization-20261103.json',
    'inputs/ai-full-phone-production-clarification-20261103.json',
    'inputs/ai-task-card-label-authorization-20261103.json',
]
PROOFS = [
    'memory/tenant-business-management-20261103/verification-proof.json',
    'memory/predictive-create-permission-20261103/verification-proof.json',
    'memory/ai-full-phone-profile-20261103/verification-proof.json',
    'memory/ai-task-card-label-20261103/verification-proof.json',
]

TENANT_MENU = '合法已启用账号在已启用总部或门店租户的管理员成员关系中，业务管理的业务分类PAGE-2006、业务字段PAGE-2223、流转模板PAGE-2228属于已确认角色的有效页面投影；旧组织快照缺这三个pages条目不能压掉菜单或原有配置资格。只补本次有效会话副本，不重写旧组织pages、审计或业务存储；运营、禁用/未知身份、其它租户、原独立模块及其它conditional显式页面约束不扩大。原SUPER配置范围仍沿既有合同，不因菜单兼容取得租户任务代建或安排权。'
TASK_CREATE = '任务列表/对象读取与创建资格分别判定；无创建权不阻断原有权列表查询，也不表示全部任务详情均可读。预外呼与共用IVR任务列表按原canUseWorkspace及当前task.create资格显示创建状态：无权或范围失效时新建按钮disabled/aria-disabled，aria-describedby关联列表就近可见的原因，不只依赖title或静默返回。原start及openCreate代理入口再次读取当前资格，无权、失效上下文或不支持方式明确warning并在草稿/恢复/持久写之前拒绝。现行SUPER的F33创建与F34执行仍为拒绝；已授权总部/门店管理员和运营保持原向导、草稿恢复、保存与供应商提交合同。'
FULL_PHONE = '用户确认AI生产来源提供完整客户手机号；原AI通话和独立AI回访按准确tenant/enterprise及完整源号码归入原客户主列表。没有脱敏号码待核表、折叠待核名单或人工核对业务，不开放pendingTable/openUnlinked产品入口。异常号码、归属冲突或来源读取失败仍不造客户，保来源notice及原有读取/对象权限，不能通过放宽身份校验消除异常。'
PROFILE = '客户档案只有一个当前有权客户列表；统一业务AI/预外呼/人工跟进、原AI通话和独立AI回访、原Cloud/PRED历史按准确身份只读归集。' + FULL_PHONE + ' 业务、业务跟进、原回访、话单和实际拨打分别保留；回访摘要及平台汇总次数不增加通话、实际拨打或正常业务归档，不复制持久客户/业务/通话记录。'
PROFILE_SOURCES = '各来源成功、加载、失败、无权不适用分别表达；只可靠已知空才显示为空，未知/失败保可靠子集与明确notice，不复用旧成功快照冒当前完整结果。无效客户身份可留在内部unlinked诊断DTO，既不造客户，也不在客户档案另列可办理名单；无专用查看待核记录动作。查询仅读瞬态投影；对原已存话单只读hydrate，不启动同步定时器、推进回执或覆盖业务备注；导航偏好及原详情控制器既有缓存沿原合同，不声称浏览器绝对零写入。'
DEMO = '七条旧脱敏AI回访样例仅通过mock/ai-profile-phone-facts.json声明的DEMO_ONLY对应关系，在构建期显式改七个phone字面量以符合生产完整手机号口径；五条原完整号码及所有原话单、回访时间/状态/摘要/汇总次数保持。该样例事实修正不代表恢复真实号码，不在runtime按掩码、尾号、时间或冲突callid补号，也不迁移浏览器保存记录或修改原参考/供应商数据。'
CARD = 'AI外呼任务列表卡片不显示供应商徽标；保任务名称、执行状态、导入方式标签及原统计/动作。所属平台筛选与刷新仍按准确供应商身份工作，详情和供应商映射保留原平台信息；不能通过删除card-tag通用样式误删导入方式或详情标签。'
CURRENT = TENANT_MENU + ' ' + TASK_CREATE + ' ' + PROFILE + ' ' + PROFILE_SOURCES + ' ' + DEMO + ' ' + CARD
BOUNDARY = '本次Step57–60为当前本地有限Mock/获准HTTP局部事实：Step57为7套91例及21条观察，Step58为8套134例及18条观察，Step59为8套198例及12条观察，Step60为2套34例及26卡片/平台筛选实点；不能相加为新全量回归，也不把旧Step56的70套1241称为当前构建全量结果。原Step54全流程13组已验/9组部分、下载/真实音频/未知回执停止组合、file与真实供应商/API/CTI边界保持。原Observer启动诊断仍未归因，不声明已修复或零诊断。开发包更新及Git发布不升级DRAFT、整版S8/G3或正式工程/业务/运营审批。'

PROTECTED = {'history', 'previous_source_records', 'source_evidence', 'raw', 'old'}
CLAUSES = [TENANT_MENU, TASK_CREATE, FULL_PHONE, PROFILE, PROFILE_SOURCES, DEMO, CARD, CURRENT, BOUNDARY]
REPLACEMENTS = {
    PREVIOUS_PROFILE_SOURCES: PROFILE_SOURCES,
    '查询仅读瞬态投影和原已存话单，不启动同步': '查询仅读瞬态投影；对原已存话单只读hydrate，不启动同步',
    '号码或归属待核原记录单列准确来源，不造客户；原填写/录音/再次联系仅沿原入口权限': '完整源号码归集到唯一客户主表，无额外脱敏待核表或折叠待核名单；原填写/录音/再次联系仅沿原入口权限',
    'unlinked按原来源稳定身份保序展示，phoneLabel可为脱敏文本但不能用作客户ID': 'unlinked仅为内部异常诊断集合，不呈现第二张名单或办理入口；phoneLabel不作为客户ID，不补全异常号码',
    'phone仅保原来源定位文本（可能脱敏），不据此拼客户身份。': 'phone按原来源保完整号码定位；AI生产源正常提供完整phone，异常值不补号或生成客户。',
    '原来源定位文本，可能完整或脱敏；仅保原引用，不据脱敏值建立客户。': '原来源完整号码定位；AI原通话/回访按完整phone及准确原引用核对，不适用kind可省略；异常值不补号或建立客户。',
    '当前可读但不能确认客户身份的原记录；按原来源稳定身份保序。': '内部异常诊断原记录集合，不作为客户列表、待核表或人工待办，不开放专用产品动作。',
    '原完整/脱敏/缺失号码资料，仅呈现，不用于补全客户。': '仅内部保原异常号码诊断资料；正常AI源为完整号码，不据本成员补号或建立客户。',
    '原称呼资料；未提供显示未记录，不拿同名认领。': '仅内部异常诊断的原称呼资料；缺失保null或未记录，不作为客户表假称呼或认领依据。',
    '该待核原记录的准确原引用；缺准确引用为null或省略，仅呈现待核原因，不开放首项跳转。': '内部异常的准确原引用；缺准确引用为null或省略，不造默认引用；不为该集合开放openUnlinked或第二表动作。',
    '只在当前有权来源构建可确认的档案投影时提供；无可靠客户身份的原记录进入待核来源，不生成虚假客户行。': '只在当前有权来源构建可确认的档案投影时提供；无可靠客户身份仅保内部异常诊断与来源问题提示，不生成客户行或额外待核业务。',
}


def unique(values):
    return list(dict.fromkeys(values))


def current(value, strip=False):
    if isinstance(value, dict):
        return {key: item if key in PROTECTED else current(item, strip)
                for key, item in value.items()}
    if isinstance(value, list):
        return [item for entry in value if (item := current(entry, strip)) != '']
    if isinstance(value, str):
        original = value
        # Earlier candidate fragments contained the shorter creation clause.
        # Canonicalize it without duplicating the complete current clause.
        task_marker = '\x00CURRENT_TASK_CREATE\x00'
        value = value.replace(TASK_CREATE, task_marker)
        value = value.replace(TASK_CREATE.split('。', 1)[1], TASK_CREATE)
        value = value.replace(task_marker, TASK_CREATE)
        if value.count(TASK_CREATE) > 1:
            first = value.index(TASK_CREATE) + len(TASK_CREATE)
            value = value[:first] + value[first:].replace(TASK_CREATE, '')
        if strip:
            for clause in sorted(CLAUSES, key=len, reverse=True):
                value = value.replace(clause, '')
        for before, after in REPLACEMENTS.items():
            value = value.replace(before, after)
        return re.sub(r' {2,}', ' ', value).strip() if value != original else value
    return value


def append(row, key, clause):
    if clause not in row.get(key, ''):
        row[key] = (row.get(key, '').strip() + ' ' + clause).strip()


def extend(row, key, values):
    row[key] = unique(row.get(key, []) + list(values))


def _refresh_page(page, locals_by_id):
    for action in page.get('interactions', []) + page.get('actions', []):
        related = [locals_by_id[lid] for lid in action.get('local_logic_ids', []) if lid in locals_by_id]
        if related:
            action['behavior'] = '；'.join(step['action'] for unit in related for step in unit['steps'])
            if 'interactions' in page:
                action['behavior'] += '；分支：' + '；'.join(
                    branch['condition'] + '→' + branch['result'] for unit in related for branch in unit['branches'])


def apply(b, p, u, pf, rules):
    """Return copied current facts; retain all stable product IDs and typed keys."""
    b, p, u, pf, rules = [current(copy.deepcopy(value)) for value in [b, p, u, pf, rules]]
    identity = tuple(tuple(row['id'] for row in container[key])
                     for container in [b, p] for key in ['features', 'locals', 'fields', 'checks', 'acceptance_updates'])
    units = {row['id']: row for row in b['locals'] + p['locals']}
    checks = {row['id']: row for row in b['checks'] + p['checks']}
    fields = {row['id']: row for row in b['fields'] + p['fields']}
    menu_locals = ['LOCAL-PLAT-LOGIN', 'LOCAL-PLAT-NAVIGATE', 'LOCAL-PLAT-CONTEXT-SWITCH', 'LOCAL-PLAT-MEMBER-GRANT']
    menu_checks = ['CHECK-PLAT-LOGIN', 'CHECK-PLAT-NAVIGATE', 'CHECK-PLAT-CONTEXT-SWITCH', 'CHECK-PLAT-MEMBER-GRANT']
    for lid in menu_locals:
        append(units[lid]['steps'][-1], 'action', TENANT_MENU)
    for cid in menu_checks:
        append(checks[cid], 'procedure', '分别以总部/门店管理员载入缺三页的旧组织快照并刷新/恢复，再核运营、禁用/未知身份、跨租户、独立模块和其它conditional；核原组织存储字节不变。')
        append(checks[cid], 'expected', TENANT_MENU)

    for fid in ['FIELD-PLAT-MEMBER-ROLE', 'FIELD-PLAT-MEMBER-GRANTS']:
        extend(fields[fid], 'validation_rules', [TENANT_MENU])
        append(fields[fid]['derivation'], 'rule', '成员角色/模块按原显式授权保存；三个公共业务管理页仅从合法管理员成员推导本次有效页权限，不回写旧pages或新增持久授予记录。')
    grants = fields['FIELD-PLAT-MEMBER-GRANTS']
    grants['format'] = '授权复合对象：AI/Cloud是否授予独立表达；当前生产租户成员公共role为admin/operator，并结合总部/门店形成四种租户角色。模块能力跟随该成员角色，原功能资格、模块开通及本次有效页面投影分别核验，不新增reader等生产角色。存量原字段不迁移；具体物理映射由工程绑定。'
    grants['examples']['valid'] = ['{"ai":"admin","cloud":""}：本租户管理员只获AI模块资格，三项公共业务管理页仍为角色有效投影；不因此获Cloud执行能力。']

    for lid in ['LOCAL-PLAT-CLOUD-TASK-QUERY', 'LOCAL-PLAT-CLOUD-TASK-SAVE']:
        append(units[lid]['steps'][0], 'action', TASK_CREATE)
        for branch in units[lid]['branches']:
            if '无权' in branch['condition']:
                append(branch, 'result', '无创建权或上下文失效必须给当前准确原因，拒绝在草稿/恢复/持久写之前；不能显示可点击却静默返回的入口。')
    for cid in ['CHECK-PLAT-CLOUD-TASK-QUERY', 'CHECK-PLAT-CLOUD-TASK-SAVE']:
        append(checks[cid], 'procedure', '核SUPER在PRED/IVR列表禁用原因及旧openCreate入口再次拒绝；四种合法租户角色进入原向导、放弃未保存后无新增；核撤权、失效范围和未知类型。')
        append(checks[cid], 'expected', TASK_CREATE)
    extend(fields['FIELD-PLAT-TASK-ID'], 'validation_rules', ['既有任务ID及列表读取资格不等于task.create；PRED/IVR新建与执行分别遵循现行F33/F34矩阵，SUPER拒绝，合法租户成员仍沿原创建/控制合同。'])

    timeline = units['LOCAL-FLOW-CUSTOMER-TIMELINE']
    timeline['title'] = '完整号码客户统一单列表与全来源只读档案'
    timeline['postconditions'] = [PROFILE, PROFILE_SOURCES]
    append(timeline['steps'][0], 'action', FULL_PHONE)
    append(timeline['steps'][-1], 'action', PROFILE_SOURCES)
    for lid in ['LOCAL-PLAT-CUSTOMER-DIRECTORY', 'LOCAL-PLAT-LEAD-QUERY']:
        append(units[lid]['steps'][-1], 'action', FULL_PHONE)
    for cid in ['CHECK-FLOW-CUSTOMER-TIMELINE', 'CHECK-PLAT-CUSTOMER-DIRECTORY', 'CHECK-PLAT-LEAD-QUERY']:
        append(checks[cid], 'procedure', '用完整源号码检索同一客户，核原AI回访、话单及实际拨打分别统计，单主表/来源筛选/刷新及准确原回访入口；无效或冲突源仍显示notice，不生成客户或额外待核名单。')
        append(checks[cid], 'expected', PROFILE + ' ' + PROFILE_SOURCES)
    for fid in ['FIELD-PROFILE-IDENTITY', 'FIELD-PROFILE-SOURCE-REFS', 'FIELD-PROFILE-SOURCE-STATES', 'FIELD-PROFILE-AI-FOLLOWUPS', 'FIELD-PROFILE-COUNTS']:
        extend(fields[fid], 'validation_rules', [FULL_PHONE])
        append(fields[fid]['derivation'], 'rule', FULL_PHONE)
    source_states = fields['FIELD-PROFILE-SOURCE-STATES']
    source_states['name'] = '档案来源读取与内部异常状态'
    append(source_states, 'format', 'unlinked仅保内部异常DTO结构，不对应第二张列表、折叠名单或专用openUnlinked产品动作；正常AI生产来源使用完整手机号。')
    for member in source_states.get('object_members', []):
        if member['key'].startswith('unlinked'):
            append(member, 'meaning', '仅内部异常诊断；不呈现独立待核业务表或提供openUnlinked操作。')
    extend(fields['FIELD-PLAT-PHONE'], 'validation_rules', ['AI生产原通话及原回访使用完整源手机号；不设置脱敏号码待核业务或以掩码补号。一般非法输入/来源身份冲突仍沿原异常校验，不能据此造客户或放宽权限。'])

    append(units['LOCAL-PLAT-AI-TASK-QUERY']['steps'][-1], 'action', CARD)
    append(checks['CHECK-PLAT-AI-TASK-QUERY'], 'procedure', '实际查看全部AI任务卡片，再按所属平台筛选刷新；核供应商徽标已去掉，导入方式及原任务名称/状态/统计仍在，详情供应商未移除。')
    append(checks['CHECK-PLAT-AI-TASK-QUERY'], 'expected', CARD)

    pages = {row['id']: row for row in u['ui']['pages']}
    for pid in ['UI-PAGE-2001', 'UI-PAGE-2002', 'UI-PAGE-2003', 'UI-PAGE-2006', 'UI-PAGE-2223', 'UI-PAGE-2228']:
        page = pages[pid]
        for state in page['states']:
            if state['name'] in ['normal', 'loading', 'error', 'no_permission']:
                append(state, 'behavior', TENANT_MENU)
    for pid in ['UI-PAGE-2205', 'UI-PAGE-2206']:
        page = pages[pid]
        extend(page, 'layout', ['新建任务按原实时创建资格禁用或启用；禁用原因在按钮附近直接可见并以aria-describedby关联，不依赖悬停title。'])
        for state in page['states']:
            if state['name'] in ['normal', 'no_permission', 'error']:
                append(state, 'behavior', TASK_CREATE)
    page = pages['UI-PAGE-2203']
    page['layout'] = [
        '仅一个当前有权客户主列表、完整号码/称呼/业务查询、来源筛选和分页；不设脱敏号码待核第二表或折叠业务名单',
        '客户详情分别保业务、业务跟进/快照、原AI回访、原话单及导入分配历史，准确原来源入口再次核权',
        '来源未知、失败和异常保持notice，不把来源不完整画成完整零记录；异常拒绝不新增客户或专用待核办理流程',
    ]
    for state in page['states']:
        if state['name'] == 'normal': append(state, 'behavior', PROFILE)
        elif state['name'] in ['loading', 'empty', 'error']: append(state, 'behavior', PROFILE_SOURCES)
    for row in page['fields']:
        field = fields.get(row['field_id'])
        if row['field_id'].startswith('FIELD-PROFILE-') and field:
            row['label'] = field['name']
            row['help_text'] = field['derivation']['rule']
            row['formatting'] = field['format']
    page = pages['UI-PAGE-2103']
    extend(page, 'layout', [CARD])
    for state in page['states']:
        if state['name'] == 'normal': append(state, 'behavior', CARD)

    affected_pages = ['PAGE-2001', 'PAGE-2002', 'PAGE-2003', 'PAGE-2006', 'PAGE-2223', 'PAGE-2228', 'PAGE-2203', 'PAGE-2205', 'PAGE-2206', 'PAGE-2103']
    for pid in affected_pages:
        page = pages['UI-' + pid]
        _refresh_page(page, units)
        facts = next(row for row in pf['pages'] if row['id'] == pid)
        facts['layout'] = page['layout'][:]
        _refresh_page(facts, units)
        facts['interaction_rules'] = [a['behavior'] for a in facts.get('actions', []) if 'behavior' in a]
        facts['current_behavior'] = '；'.join(facts['interaction_rules'])
        state_map = pf['page_behavior'].setdefault(pid, {})
        state_map['layout'] = page['layout'][:]
        for state in page['states']: state_map[state['name']] = state['behavior']
        for row in facts.get('fields', []):
            field = fields.get(row.get('id'))
            if field and row['id'].startswith('FIELD-PROFILE-'):
                row['name'] = field['name']
                row['description'] = field['derivation']['rule']

    for check in checks.values():
        if check['id'] in menu_checks + ['CHECK-PLAT-CLOUD-TASK-QUERY', 'CHECK-PLAT-CLOUD-TASK-SAVE', 'CHECK-PLAT-AI-TASK-QUERY', 'CHECK-FLOW-CUSTOMER-TIMELINE', 'CHECK-PLAT-CUSTOMER-DIRECTORY', 'CHECK-PLAT-LEAD-QUERY']:
            check['management_profile_revision'] = VERSION
    for acceptance in b['acceptance_updates'] + p['acceptance_updates']:
        if acceptance['id'] == 'AC-2147':
            append(acceptance, 'statement', PROFILE)
            extend(acceptance, 'decision_refs', ['CHG-059-AI-FULL-PHONE'])
    for rule in rules:
        if rule['id'] in ['GR-IDENTITY', 'GR-AUTH', 'GR-NAVIGATION']: append(rule, 'statement', TENANT_MENU)
        if rule['id'] == 'GR-AUTH': append(rule, 'statement', TASK_CREATE)
        if rule['id'] == 'GR-DATA-FACTS': append(rule, 'statement', PROFILE + ' ' + PROFILE_SOURCES + ' ' + DEMO)

    changes = [
        {'id': 'CHG-057-TENANT-BUSINESS-MENU', 'title': '租户管理员旧菜单快照兼容', 'old': '旧组织快照缺三个公共业务管理页时覆盖当前有效菜单，合法管理员入口消失。', 'current': TENANT_MENU, 'acceptance_ids': unique(checks['CHECK-PLAT-NAVIGATE']['acceptance_ids'] + checks['CHECK-PLAT-MEMBER-GRANT']['acceptance_ids']), 'local_ids': menu_locals, 'authorization': AUTHS[0], 'evidence_refs': [PROOFS[0]]},
        {'id': 'CHG-058-TASK-CREATE-FEEDBACK', 'title': '预外呼及IVR创建权限反馈', 'old': '原列表新建按钮可点击，而SUPER创建资格拒绝时start静默返回。', 'current': TASK_CREATE, 'acceptance_ids': checks['CHECK-PLAT-CLOUD-TASK-SAVE']['acceptance_ids'][:], 'local_ids': ['LOCAL-PLAT-CLOUD-TASK-QUERY', 'LOCAL-PLAT-CLOUD-TASK-SAVE'], 'authorization': AUTHS[2], 'evidence_refs': [PROOFS[1]]},
        {'id': 'CHG-059-AI-FULL-PHONE', 'title': 'AI完整手机号与客户单列表', 'old': '旧演示脱敏回访单列号码或归属待核来源，并提供openUnlinked独立动作。', 'current': PROFILE + ' ' + PROFILE_SOURCES + ' ' + DEMO, 'acceptance_ids': unique(checks['CHECK-FLOW-CUSTOMER-TIMELINE']['acceptance_ids'] + checks['CHECK-PLAT-LEAD-QUERY']['acceptance_ids']), 'local_ids': ['LOCAL-FLOW-CUSTOMER-TIMELINE', 'LOCAL-PLAT-CUSTOMER-DIRECTORY', 'LOCAL-PLAT-LEAD-QUERY'], 'authorization': AUTHS[3], 'evidence_refs': [PROOFS[2]]},
        {'id': 'CHG-060-AI-CARD-BADGE', 'title': 'AI任务列表去供应商徽标', 'old': '每个AI任务卡片在导入方式旁重复显示供应商徽标。', 'current': CARD, 'acceptance_ids': checks['CHECK-PLAT-AI-TASK-QUERY']['acceptance_ids'][:], 'local_ids': ['LOCAL-PLAT-AI-TASK-QUERY'], 'authorization': AUTHS[4], 'evidence_refs': [PROOFS[3]]},
    ]
    for change in changes: change['statement'] = change['current']
    ids = {change['id'] for change in changes}
    b['supersessions'] = [row for row in b['supersessions'] if row.get('id') not in ids] + changes
    metadata = {'version': VERSION, 'authorization_refs': AUTHS[:], 'prototype_proof_refs': PROOFS[:], 'changes': changes, 'stable_product_ids': True, 'formal_approval': False, 'production_verified': False, 'limits': BOUNDARY}
    for container in [b, p, u, pf]: container['management_profile_current_delta'] = copy.deepcopy(metadata)
    b['version'] = u['version'] = VERSION
    for container in [b, p, u]: extend(container, 'review_notes', [BOUNDARY])
    assert identity == tuple(tuple(row['id'] for row in container[key])
                             for container in [b, p] for key in ['features', 'locals', 'fields', 'checks', 'acceptance_updates'])
    return b, p, u, pf, rules


TASK_RULES = {
    'TASK-001': {'deliverables': [TENANT_MENU], 'refs': ['js/components/session-store.js', 'scripts/check-tenant-business-management.cjs']},
    'TASK-002': {'deliverables': [TENANT_MENU], 'risks': ['旧组织菜单兼容不是普通conditional绕权或跨租户授权；直接管理地址、刷新、冷恢复均再次判权。'], 'refs': ['js/components/session-store.js', 'js/app.js', 'scripts/check-tenant-business-management.cjs']},
    'TASK-005': {'deliverables': [TENANT_MENU], 'risks': ['有效页权限只在合法管理员会话副本补三项，不把读取/兼容当作成员授权写操作或修改旧审计。'], 'refs': ['js/components/session-store.js', 'js/components/organization-store.js']},
    'TASK-030': {'title': '完整号码客户单列表、全来源只读档案与业务队列', 'deliverables': [PROFILE, PROFILE_SOURCES], 'risks': ['内部异常unlinked DTO不对应第二张待核名单或专用openUnlinked动作；保来源失败notice，不虚建客户或静默隐藏未知。'], 'refs': ['js/adapters/customer-profile-workspace.js', 'js/adapters/cloud.js', 'scripts/check-customer-profile-workspace.cjs', 'scripts/check-customer-profile-chain.cjs']},
    'TASK-034': {'deliverables': [CARD], 'risks': ['只删除卡片供应商徽标；导入方式、平台筛选、详情和供应商映射仍保原身份。'], 'refs': ['scripts/build-modules.py', 'scripts/check-ai-task-directory.cjs']},
    'TASK-035': {'deliverables': [FULL_PHONE, DEMO], 'risks': ['七个显式demo号码修正不构成生产身份恢复规则，不按冲突callid/掩码补号，不迁移保存数据；原回访资料不增加实际拨打。'], 'refs': ['mock/ai-profile-phone-facts.json', 'scripts/ai_profile_demo_build.py', 'scripts/check-ai-profile-demo-phones.cjs', 'js/adapters/ai-customer-profile.js']},
    'TASK-045': {'deliverables': [TASK_CREATE], 'risks': ['不为解决无响应而赋SUPER的F33/F34；原合法草稿/恢复/保存和供应商执行路径保持。'], 'refs': ['scripts/task_creation_access_build.py', 'scripts/check-task-create-permission.cjs', 'js/adapters/cloud-resources.js']},
}


def apply_task_groups(groups):
    result = current(copy.deepcopy(groups))
    for group in result:
        rule = TASK_RULES.get(group['id'])
        if not rule: continue
        if rule.get('title'): group['title'] = rule['title']
        for key in ['deliverables', 'risks']: extend(group, key, rule.get(key, []))
        extend(group, 'prototype_reference_files', rule.get('refs', []))
    assert [row['id'] for row in result] == [row['id'] for row in groups]
    return result
