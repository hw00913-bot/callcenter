"""Step55–56 current product delta; caller owns projection/export and approvals.

Only edits in-memory authored values. Historical/source-evidence branches are
preserved verbatim. Call after the Step48–54 authoring delta; no runtime writes.
"""
import copy
import re

VERSION = '2.0.0-current-20261102-step56'
AUTHS = [
    'inputs/customer-profile-integration-authorization-20261102.json',
    'inputs/template-ai-task-entry-authorization-20261102.json',
    'inputs/execution-arrangement-authorization-20261031.json',
]
PROOFS = [
    'memory/customer-profile-integration-20261102/verification-proof.json',
    'memory/template-ai-task-entry-20261102/verification-proof.json',
]

PROFILE = '客户档案使用一个当前有权客户列表，统一只读归集统一业务的AI/预外呼/人工跟进、原AI通话及独立AI线索回访、原Cloud/PRED联系与导入历史；业务、跟进、回访资料、通话和实际拨打分别保留，不复制持久客户/业务/通话记录，不按同号合并业务身份。'
PROFILE_IDENTITY = '展示身份为tenantId+enterpriseId+完整规范号码；只消除号码的明确格式差异，不从脱敏、姓名、时间、城市或首项推测客户。同源身份落在不同号码或归属冲突时双方待核，不首行胜出；号码更正后旧实际通话仍留原号码，新号码只关联当前业务而不继承旧通话。'
PROFILE_AUTH = '客户档案原入口权限与各来源原模块/对象/人员范围分别满足；AI通话核PAGE-2108，独立AI回访核PAGE-2109，不要求同时拥有两者。运营同号不取得他人记录；监管和转出截止沿权威已授权投影，不以当前owner再次猜测过滤。聚合身份不授CustomerDirectory.find或原编辑/再次联系资格；详情和录音重核准确原来源及原媒体权限。'
PROFILE_SOURCES = '各来源成功、加载、失败、无权不适用分别表达；无权来源不扩大为读取许可，已知空与未可靠取得不同。脱敏/归属待核记录保准确原引用单列，不虚建客户。查询只构建瞬态投影，原已存话单只读hydrate不启动同步定时器、推进回执或覆盖业务备注；导航偏好和原详情控制器既有缓存仍按原合同保存，不声称浏览器绝对零写入。'
PROFILE_COUNTS = '客户维度业务数、业务跟进段、正常归档段、原AI回访资料、通话记录及可确认拨打分别统计。原AI汇总回访次数不生成明细、通话或正式归档；受理/排队/未拨/事实待核不计确认拨打。仅同租户企业且明确record/segment/原call或providerCall关联的镜像去重；冲突事实保待核，不能仅同号/同名/同时间或跨供应商同call字符串合并。未知时长不补0，已知0保持0，时间缺失不以受理/接收/当前时间补拨打时间。'
PROFILE_REFRESH = '同账号和准确租户范围保查询、来源筛选、分页与选中客户；账号/tenant/enterprise/brand/授权变化及离页后的旧异步结果不能回填。来源完成或失败原位更新列表和自身只读详情，保未提交筛选、焦点/caret、滚动及嵌套来源层；冷恢复的AI-only客户等待可靠来源，源失败不误判撤权，可靠完整后仍不可见才清选中并提示。失败不自动循环重试，明确刷新可重试，接口消失不复用旧成功快照。'
AI_FOLLOWUP_SOURCE = '档案只读取原AI回访真实明细/最近摘要；准确来源不足不调用默认模拟补齐，不授原回访保存资格。'
TEMPLATE = '模板AI呼叫节点直接显示AI呼叫任务，任务先于对应场景；候选仍按原实际执行tenant、分类、供应商/平台、任务状态和对象权筛选。选择准确任务后仅唯一明确sceneId或专业任务关联带出场景，多匹配/冲突/缺证不选首项；可明确暂不指定、后续分配，清本租户任务及场景默认并保其他tenant映射，执行前有效具体任务/场景准入不变。'
TEMPLATE_LOAD = '冷打开已选AI的节点或切换AI时，在合法tenant/category和原ADMIN+task.assign资格下每editor/node/tenant/category自动读取一次目录；异步前后重核编辑器、方式、范围与权限，旧回调不落新草稿。失败明确且不因重绘循环，原刷新按钮允许重试；选择方式/任务和目录完成重绘保右侧配置区滚动，异步返回前读取当前草稿，不丢未提交输入。'
TEMPLATE_AUTH = '无执行tenant、范围不一致、无参照分类或无任务安排权时仍显示禁用AI任务入口及准确原因，不把顶部已选tenant误称未切换，不授SUPER或运营新task.assign权。模板品牌配置权不授其他租户私有资源，原人工MANUAL/SPECIFIC_SEAT、PRED仅任务、五档及已捕获运行快照保持。'
TEMPLATE_LATER = '明确暂不指定时移除本执行tenant的AI默认条目（任务/场景一起清），不是保存缺resourceId的半条AI默认；其他tenant条目和已开运行快照不改。'
TEMPLATE_READ = '只读模板详情和业务运行捕获方案展示原节点、已保存任务/场景身份及当前可读来源信息；当前目录不可核对不替换原选择，不要求查看者选择、清除或保存任务默认。无安排权和只读态控件禁用并说明，当前配置不追改原运行快照。'
BOUNDARY = '本次Step55/56为有限本地Mock和获准HTTP局部修复证据：Step55为70套1222与25条有效修后观察，Step56最终70套1241、适用built48及11条有效最终观察。原Step54的13组已验/9组部分及下载、真实音频、未知回执/停止等组合、file和真实供应商/API/CTI未验边界保留。OBS-PROFILE-STARTUP-01的Observer日志仍未归因，不声明零诊断；DRAFT不升S8/G3、正式工程/业务/运营批准。'

CLAUSES = [PROFILE, PROFILE_IDENTITY, PROFILE_AUTH, PROFILE_SOURCES, PROFILE_COUNTS,
           PROFILE_REFRESH, AI_FOLLOWUP_SOURCE, TEMPLATE, TEMPLATE_LOAD, TEMPLATE_AUTH, TEMPLATE_LATER, TEMPLATE_READ, BOUNDARY]
PROTECTED = {'history', 'previous_source_records', 'source_evidence', 'raw', 'old'}
OLD_TABS = '业务跟进/联系档案统一页签与tabpanel，键盘方向/Home/End可用；同身份切换保各自查询/分页，跨身份不恢复旧状态，显式客户详情与原摘要刷新仍定位正确。'
REPLACEMENTS = {
    OLD_TABS: '客户档案已统一为一个客户列表，来源分别只读归集；保当前范围筛选/分页/选中客户及冷恢复，原双主视图页签不再作为当前交互。',
    '客户档案业务跟进与联系档案分视图': '客户档案全来源统一只读归集',
    '客户档案切换业务跟进或联系档案、打开关联业务': '查询统一客户列表、打开客户详情及准确原来源',
    '默认业务跟进视图与联系档案切换，按当前有权租户查询客户': '统一有权客户列表、来源筛选及客户详情，业务与原专业来源分别保留',
    '业务跟进／联系档案两视图': '统一客户列表及全来源只读详情',
}
FIELD_IDS = [
    'FIELD-PROFILE-IDENTITY', 'FIELD-PROFILE-SOURCE-REFS',
    'FIELD-PROFILE-SOURCE-STATES', 'FIELD-PROFILE-AI-FOLLOWUPS',
    'FIELD-PROFILE-COUNTS',
]
PROFILE_CHECKS = ['CHECK-FLOW-CUSTOMER-TIMELINE', 'CHECK-PLAT-CUSTOMER-DIRECTORY']
TEMPLATE_CHECKS = ['CHECK-FLOW-EXECUTION-DEFAULTS', 'CHECK-FLOW-TEMPLATE-CREATE',
                   'CHECK-FLOW-TEMPLATE-EDIT', 'CHECK-FLOW-TEMPLATE-READ']


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
        if strip:
            for text in sorted(CLAUSES, key=len, reverse=True):
                value = value.replace(text, '')
        for old, new in REPLACEMENTS.items():
            value = value.replace(old, new)
        return re.sub(r' {2,}', ' ', value).strip() if value != original else value
    return value


def append_clause(row, key, text):
    if text not in row.get(key, ''):
        row[key] = (row.get(key, '').strip() + ' ' + text).strip()


def extend(row, key, values):
    row[key] = unique(row.get(key, []) + list(values))


def projection_field(ident, name, key, typ, fmt, rules, dependencies, example):
    return {
        'id': ident, 'name': name, 'entity': 'CustomerProfileProjection', 'key': key,
        'source_refs': ['docs/field-alignment.json#' + ident], 'source_keys': [],
        'type': typ, 'format': fmt, 'nullable': False,
        'required_when': '只在当前有权来源构建可确认的档案投影时提供；无可靠客户身份的原记录进入待核来源，不生成虚假客户行。',
        'default': {'kind': 'none', 'value': None, 'rule': '读取实际有权事实派生；已知空、合法0和缺失/读取失败分开，不以默认值补事实。'},
        'validation_rules': rules,
        'permissions': {
            'read': [PROFILE_AUTH],
            'write': ['系统构建本次瞬态只读投影；用户不编辑，不新增业务、原客户或通话写权。'],
        },
        'lifecycle': [
            {'state': '授权读取或刷新', 'behavior': '按当前有权投影构建；原源身份及各来源自身范围分别校验。'},
            {'state': '源失败或未知', 'behavior': '保其他有权来源并明确不完整，不用旧成功快照冒当前完整结果；不补时间、号码或统计。'},
            {'state': '上下文变化或离开', 'behavior': '旧异步结果不能回填，原业务和原专业记录不随投影销毁或改变。'},
        ],
        'derivation': {'kind': 'calculated', 'rule': '；'.join(rules), 'dependencies': dependencies},
        'persistence': {'kind': 'transient', 'write_when': '仅读取/刷新时构建瞬态DTO，不持久复制客户、业务、通话或原回访记录；导航偏好与原详情控制器既有缓存沿原合同，均不属于此投影字段。'},
        'examples': {'valid': [example], 'invalid': ['按同名/脱敏/首项猜关联、以受理造拨打、用投影身份取得原编辑资格、失败当完整0或跨租户复用旧结果。']},
        'test_refs': PROFILE_CHECKS[:], 'interfaces': [],
    }


def profile_fields():
    rows = [
        projection_field(FIELD_IDS[0], '客户档案只读展示身份', 'id', 'string',
            'JSON tuple [tenantId:string非空, enterpriseId:string非空, normalizedPhone:string完整7～15位数字]；仅展示分组身份，不是原professionalCustomer.id或业务recordId。',
            [PROFILE_IDENTITY, '仅移除明确号码格式空白/括号/分隔符及有效+86或0086前缀；脱敏、非法长度、空号码不构造客户身份。原源tenant/enterprise由权威授权投影取得，不由当前owner猜补。'],
            ['FIELD-PLAT-RESOURCE-SCOPE', 'FIELD-PLAT-PHONE', 'FIELD-FLOW-PHONE'],
            '["TEN-A","ENT-A","13800000001"]只分组当前可读联系资料；另一企业相同号码仍为不同投影。'),
        projection_field(FIELD_IDS[1], '档案准确原来源引用', 'sourceRefs', 'array',
            'array<object>；kind为BUSINESS/BUSINESS_FOLLOWUP/BUSINESS_CALL/AI_NATIVE/AI_FOLLOWUP/NATIVE_CUSTOMER/NATIVE_CALL/DCC_CALL/DCC_IMPORT。按kind保必要非空原稳定ID字符串：recordId/segmentId/callId/attemptId/taskId/resultId/customerId/sessionId/platform/fingerprint/scopeToken；不适用成员省略。phone仅保原来源定位文本（可能脱敏），不据此拼客户身份。必要tenant/enterprise/account/授权上下文由外层有权快照或该类型原引用携带，不要求各供应商物理同构。禁止录音URL和可变业务值。',
            [PROFILE_AUTH, '引用与准确客户/来源上下文一起再次校验；只有唯一当前可见原行才打开其原控制器，身份、供应商、号码或内容指纹不符拒绝，不回退第一行。仅保明确同源/镜像的多引用，数组按原来源顺序稳定，不因姓名或时间合并。'],
            [FIELD_IDS[0], 'FIELD-FLOW-RECORD-ID', 'FIELD-FLOW-FOLLOWUP-ID', 'FIELD-PLAT-CALL-ID', 'FIELD-PLAT-CUSTOMER-ID'],
            '同一准确通话的业务引用与原专业引用可并列入口；只读查看该引用不授F31媒体权或原记录编辑权。'),
        projection_field(FIELD_IDS[2], '档案来源读取与待核状态', 'sourceStates', 'object',
            '{sources:array<{source:string(BUSINESS/CLOUD_DCC/AI_CALL/AI_FOLLOWUP),status:success/partial/loading/unknown/failed/forbidden/not-applicable,authorized:boolean|null,issues:array<{message:string,sourceRef?:原引用}>}>,sourcesResolved:boolean,unlinked:array<{sourceKind:string,phoneLabel:string|null,label:string|null,sourceRef:原引用|null,reason:string}>}。null表示未核，不同于false；sourcesResolved仅在各原读取为success/forbidden/not-applicable时为true，partial/loading/unknown/failed时为false；true不等于所有原记录已可关联或生产验收。',
            [PROFILE_SOURCES, PROFILE_REFRESH, 'success且原集合已知空才可空；partial保已确认子集及原因但不称完整，forbidden/not-applicable不得继续读取，unknown/loading/failed显示不完整。unlinked按原来源稳定身份保序展示，phoneLabel可为脱敏文本但不能用作客户ID；同身份冲突两侧均待核，不首行取胜。'],
            ['FIELD-PLAT-RESOURCE-SCOPE', 'FIELD-PLAT-QUERY'],
            'AI读取失败而原PRED可读：保PRED行，来源标failed；无AI原读权标not-applicable且不启动AI读取，不显示伪造的完整全来源0。'),
        projection_field(FIELD_IDS[3], '原AI回访真实资料投影', 'aiFollowups', 'array',
            'array<{sourceRef:AI_FOLLOWUP准确原引用,sceneName:string|null,taskName:string|null,resultLabel:string|null,reportedVisitCount:非负整数|仅十进制整数数字字符串|null,visits:array<{followupAt:原日期时间字符串|null,summary:string|null,actorName:string|null}>,latestFollowup:{followupAt:string|null,summary:string|null,actorName:string|null,summaryOnly:boolean}|null}>。visits保原实际明细及原给定顺序；仅最近摘要不构造完整明细，reportedVisitCount仅保原平台汇总，不与本系统通话/归档同义。',
            ['独立AI回访即使不在原通话表也可作为有权来源入档；真实visits或真实最近摘要/时间分别保留，无时间/姓名/内容保持null或未记录，原来源以字面「-」表示缺失时不转默认模拟内容。只显示原明细时不再把最近摘要重复当另一条明细；原汇总0为已知0，缺失/非法或字面「-」为未知，不按汇总生成记录。', PROFILE_AUTH, '来源日期仅给日期时保日期并提示具体时间未记录；非法日历日期待核，不用当前时间、首次默认回访或通话标识补手机号。原回访资料不增加业务跟进段、正常归档数或实际拨打次数。'],
            [FIELD_IDS[1], FIELD_IDS[2]],
            '原平台汇总2但只提供最近摘要：保reportedVisitCount=2、visits=[]、latestFollowup.summaryOnly=true；不造2条明细、2次通话或正式业务归档。'),
        projection_field(FIELD_IDS[4], '客户档案分项统计与已知时长', 'counts', 'object',
            '{businessCount,followupCount,archivedFollowupCount,aiFollowupCount,aiVisitDetailCount,aiLatestSummaryCount,callRecordCount,actualDialCount,pendingCallCount,unknownDurationCount:均为非负整数;totalDurationSeconds:非负有限数(秒，仅已知时长之和);lastContactAt:string原日期时间|null;updatedAt:string原资料时间|null}。数量是当前可见集合的派生数；某来源failed/unknown时不能称全来源完整总量。totalDurationSeconds=0与时长未知由callRecordCount/unknownDurationCount共同区分，单位秒，显示可格式化分:秒。',
            [PROFILE_COUNTS, 'businessCount按独立有权recordId；followupCount按原段稳定ID；archivedFollowupCount仅明确正常归档且非废弃段，不等于业务达成。aiFollowupCount按独立原回访资料，aiVisitDetailCount仅实际visits长度，aiLatestSummaryCount仅无实际visits而确有最近摘要的资料条数。',
             'callRecordCount计有权实际来源记录/尝试，明确镜像才去重；actualDialCount仅dialed=true且无待核镜像关系，pendingCallCount记录未实际拨打或事实/镜像关联待核，二者不得由受理或reportedVisitCount推断。相同供应商call字符串跨平台不自动去重。',
             'unknownDurationCount计缺失/非法/镜像冲突/关联待核时长；已知0秒参与已知总和。无通话或全部时长未知时显示未记录，不显示0秒；有部分已知时长显示已知合计并分别提示未知条数。lastContactAt只取确认拨打的原实际时间；updatedAt只取原有效资料时间，读取不补Date.now。'],
            [FIELD_IDS[1], FIELD_IDS[2], FIELD_IDS[3], 'FIELD-FLOW-CALLS', 'FIELD-FLOW-ARCHIVED', 'FIELD-PLAT-CALL-TIMES'],
            '1条业务、1段正常归档、原AI回访汇总3但只有摘要、1次确认拨打且时长缺失：business1/followup1/archive1/AI资料1/call1/dial1/unknownDuration1；时长显示未记录，汇总3不增加call或archive。'),
    ]
    def member(key, typ, nullable, meaning, unit=None):
        value = {'key': key, 'type': typ, 'nullable': nullable, 'meaning': meaning}
        if unit: value['unit'] = unit
        return value
    rows[1]['object_members'] = [
        member('[].kind', 'enum<string>', False, '原引用类型：BUSINESS/BUSINESS_FOLLOWUP/BUSINESS_CALL/AI_NATIVE/AI_FOLLOWUP/NATIVE_CUSTOMER/NATIVE_CALL/DCC_CALL/DCC_IMPORT；决定必要身份成员及原入口，不互换。'),
        *[member('[].' + key, 'string', True, meaning) for key, meaning in [
            ('recordId', '原业务或原导入记录ID；对应kind需要时必须非空。'),
            ('segmentId', '原业务跟进段稳定身份；不能按当前段或第一段替代。'),
            ('callId', '准确原通话身份；只在原来源范围内解释。'),
            ('attemptId', '原业务尝试稳定身份；未拨尝试可有此引用，不证明已拨打。'),
            ('taskId', '原专业任务身份，DCC来源与其result/record共同定位。'),
            ('resultId', '原DCC结果稳定身份，与taskId共同定位。'),
            ('customerId', '原专业客户稳定ID，区别于FIELD-PROFILE-IDENTITY。'),
            ('sessionId', '原AI通话会话身份，AI_NATIVE与platform及范围共同定位。'),
            ('platform', '原供应商平台身份，不能只据同call字符串跨平台合并。'),
            ('phone', '原来源定位文本，可能完整或脱敏；仅保原引用，不据脱敏值建立客户。'),
            ('fingerprint', '原内容及读取权版本依据；变化后旧引用失效，不开放原默认首项。'),
            ('scopeToken', '原读取上下文不透明标识；不是新增授权，点击仍重核当前范围。'),
        ]],
    ]
    rows[2]['object_members'] = [
        member('sources', 'array<object>', False, '各原来源本次读取状态，保业务/Cloud-DCC/AI通话/独立AI回访边界。'),
        member('sources[].source', 'enum<string>', False, 'BUSINESS/CLOUD_DCC/AI_CALL/AI_FOLLOWUP来源标识。'),
        member('sources[].status', 'enum<string>', False, 'success/partial/loading/unknown/failed/forbidden/not-applicable；partial保可靠子集，不当完整。'),
        member('sources[].authorized', 'boolean', True, 'true为已确认有原读取权，false为无权/不适用，null为尚未可靠核对；值不能授新权限。'),
        member('sources[].issues', 'array<object>', False, '有问题逐项保message及可用的准确sourceRef；已知无问题可[]。'),
        member('sources[].issues[].message', 'string', False, '实际失败、待核或不适配原因，不把未知写成无记录。'),
        member('sources[].issues[].sourceRef', 'typed source reference', True, '有准确原来源时保引用；无依据时省略，不造默认引用。'),
        member('sourcesResolved', 'boolean', False, '只有所有来源处于success/forbidden/not-applicable时为true；其他状态为false，true仍不等于unlinked全能关联。'),
        member('unlinked', 'array<object>', False, '当前可读但不能确认客户身份的原记录；按原来源稳定身份保序。'),
        member('unlinked[].sourceKind', 'string', False, '原来源类别，不推测客户或业务归属。'),
        member('unlinked[].phoneLabel', 'string', True, '原完整/脱敏/缺失号码资料，仅呈现，不用于补全客户。'),
        member('unlinked[].label', 'string', True, '原称呼资料；未提供显示未记录，不拿同名认领。'),
        member('unlinked[].sourceRef', 'typed source reference', True, '该待核原记录的准确原引用；缺准确引用为null或省略，仅呈现待核原因，不开放首项跳转。'),
        member('unlinked[].reason', 'string', False, '号码不完整、来源冲突、身份待核等可解释原因。'),
    ]
    rows[3]['object_members'] = [
        member('[].sourceRef', 'AI_FOLLOWUP typed reference', False, '独立AI回访原引用；自己的读取权不由同号已拥有通话推导。'),
        *[member('[].' + key, 'string', True, meaning) for key, meaning in [
            ('sceneName', '原回访场景名称，缺失不按当前配置或同名补齐。'),
            ('taskName', '原任务显示资料，缺失保未记录。'),
            ('resultLabel', '原回访结果，不将其已接通文字转换为新的通话事实。'),
        ]],
        member('[].reportedVisitCount', 'nonnegative integer | decimal-integer string', True, '仅原平台汇总；0为已知0，缺失/字面「-」/非法为未知，不能生成同数明细、拨打或归档。', '原平台汇总次数'),
        member('[].visits', 'array<object>', False, '仅原来源实际提供的明细，保给定顺序；[]仅表示无可确认明细，不等于平台回访次数0。'),
        member('[].visits[].followupAt', 'date/datetime string', True, '原日期或时间，日期-only注明具体时间未记录，非法日期待核。', '原日期时间'),
        member('[].visits[].summary', 'string', True, '原实际内容，缺失未记录，不调用模拟默认内容。'),
        member('[].visits[].actorName', 'string', True, '原实际办理人；未知不以当前账号、发起人或责任人补填。'),
        member('[].latestFollowup', 'object', True, '原来源仅给最近资料时单列摘要；有实际visits不把同一最近摘要再算一条明细。'),
        member('[].latestFollowup.followupAt', 'date/datetime string', True, '原最近回访时间，未提供不补当前时间。', '原日期时间'),
        member('[].latestFollowup.summary', 'string', True, '最近一次实际摘要，不能冒完整明细。'),
        member('[].latestFollowup.actorName', 'string', True, '原最近实际办理人，未知保持未记录。'),
        member('[].latestFollowup.summaryOnly', 'boolean', False, 'true明确这只是最近摘要；不据此声明完整回访历史或业务归档。'),
    ]
    counter_meanings = {
        'businessCount': ('条独立业务', '按当前可读独立recordId计数，同号多业务不合并。'),
        'followupCount': ('段业务跟进', '按原跟进稳定ID计数，不等于完成或拨打。'),
        'archivedFollowupCount': ('段正常归档', '仅明确正常归档且非废弃的业务段，不等于业务达成。'),
        'aiFollowupCount': ('条原AI回访资料', '按独立原回访资料计，不按reportedVisitCount展开。'),
        'aiVisitDetailCount': ('条原实际明细', '仅实际visits长度的合计。'),
        'aiLatestSummaryCount': ('条仅最近摘要资料', '仅无实际visits且确有latestFollowup的资料条数。'),
        'callRecordCount': ('条联系/通话尝试记录', '有权原记录或业务尝试，明确镜像才去重，不等于确认拨打。'),
        'actualDialCount': ('次可确认拨打', '仅dialed=true且无待核镜像关系，不由受理、排队或回访汇总派生。'),
        'pendingCallCount': ('条未拨或待核记录', '原记录未实际拨打或拨打/镜像关联尚待核，不计确认拨打。'),
        'unknownDurationCount': ('条时长未知记录', '缺失、非法、镜像冲突或关联待核时长；不是0秒。'),
    }
    rows[4]['object_members'] = [
        *[member(key, 'nonnegative integer', False, meaning, unit)
          for key, (unit, meaning) in counter_meanings.items()],
        member('totalDurationSeconds', 'nonnegative finite number', False, '仅已知时长之和；已知0参与合计。无通话或全部时长未知时，依据callRecordCount/unknownDurationCount显示未记录，不把这个合计0当已知0秒。源不完整时只称当前可见已知合计。', '秒'),
        member('lastContactAt', 'date/datetime string', True, '仅确认拨打的原实际时间之最近值；缺失不借受理、接收或当前时间，日期-only注明具体时间未记录。', '原日期时间'),
        member('updatedAt', 'date/datetime string', True, '当前可见原资料的有效原更新时间，未知稳定置后，读取不补时间。', '原日期时间'),
    ]
    return rows


def refresh_interactions(page, locals_by_id):
    for interaction in page.get('interactions', []):
        related = [locals_by_id[i] for i in interaction.get('local_logic_ids', []) if i in locals_by_id]
        if related:
            interaction['behavior'] = '；'.join(step['action'] for unit in related for step in unit['steps']) + '；分支：' + '；'.join(branch['condition'] + '→' + branch['result'] for unit in related for branch in unit['branches'])


def apply(b, p, u, pf, rules):
    """Return updated copies; no writes, approval changes, or new stable action IDs."""
    b, p, u, pf, rules = [current(copy.deepcopy(x), strip=True) for x in [b, p, u, pf, rules]]
    original_ids = ({x['id'] for x in b['features'] + p['features']}, {x['id'] for x in b['locals'] + p['locals']}, {x['id'] for x in b['checks'] + p['checks']}, {x['id'] for x in b['acceptance_updates'] + p['acceptance_updates']})
    new_fields = profile_fields()
    b['fields'] = [field for field in b['fields'] if field['id'] not in FIELD_IDS] + new_fields
    fields = {x['id']: x for x in b['fields'] + p['fields']}
    locals_by_id = {x['id']: x for x in b['locals'] + p['locals']}
    checks = {x['id']: x for x in b['checks'] + p['checks']}
    for field in new_fields:
        assert all(ident in fields for ident in field['derivation']['dependencies'])

    timeline = locals_by_id['LOCAL-FLOW-CUSTOMER-TIMELINE']
    timeline.update(title='客户档案全来源统一只读归集', trigger='查询统一客户列表、打开客户详情及准确原来源',
                    preconditions=[PROFILE_AUTH], postconditions=[PROFILE, PROFILE_SOURCES])
    actions = [PROFILE + ' ' + PROFILE_IDENTITY + ' ' + PROFILE_AUTH,
               PROFILE_SOURCES + ' ' + PROFILE_COUNTS,
               PROFILE_REFRESH + ' 详情保各独立业务、原跟进快照和原通话；DIRECT不造模板run/node，历史按本方已授权截止投影。']
    for step, action in zip(timeline['steps'], actions):
        step['action'] = action
        extend(step, 'reads', ['FIELD-PLAT-RESOURCE-SCOPE', 'FIELD-PLAT-PHONE', 'FIELD-FLOW-PHONE', 'FIELD-FLOW-CALLS'])
    timeline['steps'][-1]['writes'] = FIELD_IDS[:]
    extend(timeline, 'outputs', FIELD_IDS)
    extend(timeline, 'field_ids', FIELD_IDS)
    for branch in timeline['branches']:
        append_clause(branch, 'result', PROFILE_AUTH)
        extend(branch, 'field_ids', FIELD_IDS)
    for ident, text in [('LOCAL-PLAT-CUSTOMER-DIRECTORY', PROFILE_AUTH + ' ' + PROFILE_SOURCES),
                        ('LOCAL-PLAT-CALL-QUERY', PROFILE_AUTH),
                        ('LOCAL-PLAT-LEAD-QUERY', AI_FOLLOWUP_SOURCE + ' ' + PROFILE_AUTH)]:
        append_clause(locals_by_id[ident]['steps'][-1], 'action', text)
    for ident in ['LOCAL-FLOW-TEMPLATE-CREATE', 'LOCAL-FLOW-TEMPLATE-EDIT']:
        append_clause(locals_by_id[ident]['steps'][-1], 'action', TEMPLATE + ' ' + TEMPLATE_LOAD + ' ' + TEMPLATE_AUTH)
    append_clause(locals_by_id['LOCAL-FLOW-TEMPLATE-READ']['steps'][-1],'action',TEMPLATE_READ)
    append_clause(locals_by_id['LOCAL-FLOW-AI-SCENE']['steps'][-1], 'action', '模板节点默认采用先选准确任务、再按唯一绑定带出或确认场景；TASK内导入的任务/场景锁定及后续安排原动作合同不因节点UX放宽。')

    checks['CHECK-FLOW-CUSTOMER-TIMELINE'].update(
        procedure='当前统一列表分别核AI/PRED/人工新业务、原AI通话、独立AI回访及原Cloud/PRED；核完整号码/来源引用、分项计数、原快照/详情、返回筛选分页、冷恢复有效PRED及AI-only选择、源成功/失败、上下文切换、号码更正、镜像冲突和原接听者。',
        expected=PROFILE + ' ' + PROFILE_IDENTITY + ' ' + PROFILE_AUTH + ' ' + PROFILE_SOURCES + ' ' + PROFILE_COUNTS + ' ' + PROFILE_REFRESH)
    for ident in ['CHECK-PLAT-CUSTOMER-DIRECTORY', 'CHECK-PLAT-CALL-QUERY', 'CHECK-PLAT-LEAD-QUERY']:
        append_clause(checks[ident], 'expected', PROFILE_AUTH + ' ' + PROFILE_SOURCES)
    for ident in [name for name in TEMPLATE_CHECKS if name!='CHECK-FLOW-TEMPLATE-READ']:
        append_clause(checks[ident], 'procedure', '选择AI后不先选场景或手动刷新，核冷目录、准确唯一绑定、多匹配/冲突、无权/范围/参照分类缺失、明确后续分配、保存重开及滚动/草稿保持。')
        append_clause(checks[ident], 'expected', TEMPLATE + ' ' + TEMPLATE_LOAD + ' ' + TEMPLATE_AUTH)
    checks['CHECK-FLOW-TEMPLATE-READ'].update(procedure='分别构造无查看权、配置读取失败及可读配置；以只有查看资格的账号打开当前模板及业务运行捕获方案，核原任务/场景身份、来源信息和只读禁用原因；不选择、清除或保存任务默认，不追改原快照。',expected=TEMPLATE_READ+' 无查看权明确拒绝，不泄露无权业务或其他租户场景；读取失败保原引用并说明失败，不伪装没有配置。')
    for check in checks.values():
        if check['id'] in PROFILE_CHECKS + TEMPLATE_CHECKS:
            check['profile_template_revision'] = VERSION
    for acceptance in b['acceptance_updates'] + p['acceptance_updates']:
        if acceptance['id'] == 'AC-2147':
            acceptance['statement'] = PROFILE + ' ' + PROFILE_REFRESH
            extend(acceptance, 'decision_refs', ['CHG-055-CUSTOMER-PROFILE'])
        elif acceptance['id'] in ['AC-2130', 'AC-2132']:
            append_clause(acceptance, 'statement', PROFILE_AUTH)
        elif acceptance['id'] == 'AC-2153':
            append_clause(acceptance, 'statement', TEMPLATE + ' ' + TEMPLATE_LOAD + ' ' + TEMPLATE_AUTH)

    for ident in ['FIELD-FLOW-NODE-EXECUTION-DEFAULTS', 'FIELD-FLOW-EXECUTION-RESOURCE', 'FIELD-FLOW-AI-SCENE']:
        field = fields[ident]
        extend(field, 'validation_rules', [TEMPLATE, TEMPLATE_AUTH])
        append_clause(field['derivation'], 'rule', '仅模板节点默认交互先选具体AI任务，再按准确唯一关联派生或明确核对场景；不改TASK内导入场景锁定或其他原安排合同。')
        if ident == 'FIELD-FLOW-NODE-EXECUTION-DEFAULTS':
            extend(field, 'validation_rules', [TEMPLATE_LATER])

    pages = {page['id']: page for page in u['ui']['pages']}
    profile_page = pages['UI-PAGE-2203']
    profile_page['layout'] = ['一个有权客户列表、客户/业务查询、来源筛选与分页', '客户详情分别展示独立业务、业务跟进/原快照、原AI回访、原联系通话及原导入分配；各原来源入口再次核权', '号码或归属待核原记录单列准确来源，不造客户；原填写/录音/再次联系仅沿原入口权限']
    profile_page['components'] = [item for item in profile_page['components'] if item != 'UI-COMP-TABS']
    states = {'normal': PROFILE + ' ' + PROFILE_IDENTITY + ' ' + PROFILE_COUNTS,
              'loading': PROFILE_SOURCES + ' ' + PROFILE_REFRESH,
              'empty': '仅当前范围和各来源可靠已知空时显示无记录；单一来源缺失不冒全来源完整0。有回访摘要但无通话/业务时保原摘要而不造业务。',
              'error': PROFILE_SOURCES + ' ' + PROFILE_REFRESH,
              'no_permission': PROFILE_AUTH,
              'submitting': '本页只读归集，不新增业务写提交；进入原来源后的保存/办理资格、提交锁及失败/未知合同仍由该原动作执行。'}
    for state in profile_page['states']:
        if state['name'] in states: state['behavior'] = states[state['name']]
    for field in new_fields:
        profile_page['fields'] = [row for row in profile_page['fields'] if row['field_id'] != field['id']]
        profile_page['fields'].append({'field_id': field['id'], 'component_id': 'UI-COMP-STATUS' if field['id'] == FIELD_IDS[2] else 'UI-COMP-READONLY',
            'label': field['name'], 'help_text': field['derivation']['rule'],
            'visible_when': '仅当前档案及该来源有权读取时显示；内部身份/引用用于准确原来源入口，不作为用户可编辑表单。',
            'editable_when': '只读；不因投影存在而授原客户编辑、业务办理、录音或再次联系权。',
            'required_indicator': '只读不画输入必填；缺失、已知空、0及未可靠取得分别表达。',
            'validation_timing': '读取、刷新、冷恢复、来源完成和原入口点击时重核准确身份及当前上下文。',
            'error_message': '来源未可靠取得或归属待核时明确说明，保其他有权资料，不按首项补全。',
            'formatting': field['format']})
    for interaction in profile_page['interactions']:
        if 'ACTION-2053' in interaction.get('source_action_ids', []) or interaction['id'] == 'UI-ACT-2053':
            extend(interaction, 'local_logic_ids', ['LOCAL-FLOW-CUSTOMER-TIMELINE'])
            extend(interaction, 'test_refs', PROFILE_CHECKS)
    template_page = pages['UI-PAGE-2228']
    extend(template_page, 'layout', ['AI呼叫任务先于对应场景，节点冷打开自动读一次目录；明确后续分配、禁用原因、场景准确关联及保存重开', '右侧节点配置区独立滚动；方式/任务变化及异步读取完成保滚动与当前草稿'])
    for state in template_page['states']:
        if state['name'] == 'normal': append_clause(state, 'behavior', TEMPLATE)
        elif state['name'] in ['loading', 'error']: append_clause(state, 'behavior', TEMPLATE_LOAD)
        elif state['name'] == 'no_permission': append_clause(state, 'behavior', TEMPLATE_AUTH)
    for row in template_page['fields']:
        if row['field_id'] in ['FIELD-FLOW-NODE-EXECUTION-DEFAULTS', 'FIELD-FLOW-EXECUTION-RESOURCE', 'FIELD-FLOW-AI-SCENE']:
            row['help_text'] = TEMPLATE + ' ' + TEMPLATE_LOAD + ' ' + TEMPLATE_AUTH
            row['editable_when'] = '仅当前实际执行租户ADMIN及原task.assign资格、准确参照分类和可编辑当前草稿；其他情形禁用并说明，不新授SUPER/运营资格。'
    refresh_interactions(profile_page, locals_by_id)
    refresh_interactions(template_page, locals_by_id)

    for container in [b, p, u]:
        if 'PAGE-2203' in container.get('page_mappings', {}):
            mapping = container['page_mappings']['PAGE-2203']
            extend(mapping, 'field_ids', FIELD_IDS)
            extend(mapping, 'test_refs', PROFILE_CHECKS)
    for ident in ['PAGE-2203', 'PAGE-2228']:
        page = next(row for row in pf['pages'] if row['id'] == ident)
        ui_page = pages['UI-' + ident]
        if ident == 'PAGE-2203':
            extend(page, 'canonical_field_ids', FIELD_IDS)
            extend(page, 'test_refs', PROFILE_CHECKS)
            for field in new_fields:
                page['fields'] = [row for row in page['fields'] if row.get('id') != field['id']]
                page['fields'].append({'id': field['id'], 'name': field['name'], 'local_logic_ids': ['LOCAL-FLOW-CUSTOMER-TIMELINE'], 'description': field['derivation']['rule']})
            for row in page['fields']:
                if row.get('origin_field_group_id') == 'FLD-038':
                    row['description'] = PROFILE
                    extend(row, 'target_field_ids', FIELD_IDS)
            for action in page.get('actions', []):
                if action.get('id') == 'ACTION-2053':
                    extend(action, 'local_logic_ids', ['LOCAL-FLOW-CUSTOMER-TIMELINE'])
                    extend(action, 'field_ids', FIELD_IDS)
                    extend(action, 'test_refs', PROFILE_CHECKS)
        for action in page.get('actions', []):
            related = [locals_by_id[unit] for unit in action.get('local_logic_ids', []) if unit in locals_by_id]
            if related: action['behavior'] = '；'.join(step['action'] for unit in related for step in unit['steps'])
        page['interaction_rules'] = [action['behavior'] for action in page.get('actions', []) if 'behavior' in action]
        page['current_behavior'] = '；'.join(page['interaction_rules'])
        page['layout'] = ui_page['layout'][:]
        behavior = pf['page_behavior'].setdefault(ident, {})
        behavior['layout'] = ui_page['layout'][:]
        for state in ui_page['states']:
            behavior[state['name']] = state['behavior']
    for container in [u, pf]:
        for mapping in container.get('field_group_mappings', []):
            if mapping.get('source_page_id') == 'PAGE-2203' and mapping.get('source_field_group_id') == 'FLD-038':
                mapping['current_name'] = '客户档案统一只读归集'
                extend(mapping, 'field_ids', FIELD_IDS)
    for rule in rules:
        if rule['id'] in ['GR-DATA-FACTS', 'GR-PRIVACY', 'GR-SCOPE']:
            append_clause(rule, 'statement', {'GR-DATA-FACTS': PROFILE_COUNTS + ' ' + PROFILE_SOURCES, 'GR-PRIVACY': PROFILE_AUTH, 'GR-SCOPE': PROFILE_IDENTITY + ' ' + PROFILE_REFRESH}[rule['id']])
        elif rule['id'] == 'GR-EXECUTION-ARRANGEMENT':
            append_clause(rule, 'statement', TEMPLATE + ' ' + TEMPLATE_LOAD + ' ' + TEMPLATE_AUTH)
    timeline=next(unit for unit in b['locals'] if unit['id']=='LOCAL-FLOW-CUSTOMER-TIMELINE')
    extend(timeline,'preconditions',['原AI录音播放继续核PAGE-2108与F31；归集DTO不传媒体URL，不以档案读取权代替录音权。'])
    timeline['field_ids']=unique(timeline['inputs']+timeline['outputs']+[field for step in timeline['steps'] for field in step.get('reads',[])+step.get('writes',[])]+[field for branch in timeline['branches'] for field in branch.get('field_ids',[])])
    changes = [
        {'id': 'CHG-055-CUSTOMER-PROFILE', 'title': '客户档案全来源统一只读归集', 'old': '业务跟进与原联系档案分视图，原AI通话及独立AI回访未完整归集。', 'current': PROFILE + ' ' + PROFILE_IDENTITY + ' ' + PROFILE_AUTH + ' ' + PROFILE_SOURCES + ' ' + PROFILE_COUNTS + ' ' + PROFILE_REFRESH, 'acceptance_ids': ['AC-2130', 'AC-2131', 'AC-2132', 'AC-2147'], 'local_ids': ['LOCAL-FLOW-CUSTOMER-TIMELINE', 'LOCAL-PLAT-CUSTOMER-DIRECTORY', 'LOCAL-PLAT-CALL-QUERY', 'LOCAL-PLAT-LEAD-QUERY'], 'authorization': AUTHS[0], 'evidence_refs': [PROOFS[0]]},
        {'id': 'CHG-056-TEMPLATE-AI-TASK', 'title': '模板AI任务先选、自动目录及准确场景联动', 'old': '先选场景再出现默认任务，部分范围整块隐藏；冷目录依赖手动刷新，重绘回顶部。', 'current': TEMPLATE + ' ' + TEMPLATE_LOAD + ' ' + TEMPLATE_AUTH, 'acceptance_ids': ['AC-2153'], 'local_ids': ['LOCAL-FLOW-TEMPLATE-CREATE', 'LOCAL-FLOW-TEMPLATE-EDIT', 'LOCAL-FLOW-TEMPLATE-READ', 'LOCAL-FLOW-AI-SCENE'], 'authorization': AUTHS[1], 'evidence_refs': [PROOFS[1]]},
    ]
    for change in changes: change['statement'] = change['current']
    b['supersessions'] = [row for row in b['supersessions'] if row.get('id') not in {change['id'] for change in changes}] + changes
    metadata = {'version': VERSION, 'authorization_refs': AUTHS[:], 'prototype_proof_refs': PROOFS[:], 'changes': changes, 'field_ids': FIELD_IDS[:], 'stable_product_ids': True, 'formal_approval': False, 'production_verified': False, 'limits': BOUNDARY}
    for container in [b, p, u, pf]: container['profile_template_current_delta'] = copy.deepcopy(metadata)
    b['version'] = u['version'] = VERSION
    for container in [b, p, u]:
        extend(container, 'review_notes', [BOUNDARY])
    assert original_ids == ({x['id'] for x in b['features'] + p['features']}, {x['id'] for x in b['locals'] + p['locals']}, {x['id'] for x in b['checks'] + p['checks']}, {x['id'] for x in b['acceptance_updates'] + p['acceptance_updates']})
    return b, p, u, pf, rules


TASK_RULES = {
    'TASK-011': {'title': '四节点模板、AI任务先选及分租户默认安排', 'deliverables': [TEMPLATE, TEMPLATE_LOAD, TEMPLATE_AUTH], 'risks': ['任务先选是节点默认UX，不放宽真实起呼、导入来源或其他tenant私有资源权限。'], 'refs': ['scripts/flow-node-config.js', 'scripts/check-execution-arrangement-workspace.cjs']},
    'TASK-030': {'title': '客户档案统一只读归集、业务名单与当前队列', 'deliverables': [PROFILE, PROFILE_IDENTITY, PROFILE_AUTH, PROFILE_SOURCES, PROFILE_COUNTS, PROFILE_REFRESH], 'risks': ['只读展示身份不替代专业客户或recordId，不授原写资格；源不完整不得画全来源完整总量。'], 'refs': ['js/components/customer-profile.js', 'js/adapters/customer-profile-workspace.js', 'js/adapters/customer-profile-workspace.css', 'scripts/customer_profile_build.py', 'scripts/check-customer-profile.cjs', 'scripts/check-customer-profile-workspace.cjs', 'scripts/check-customer-profile-chain.cjs']},
    'TASK-035': {'deliverables': ['向客户档案提供原独立AI回访真实visits或最近摘要的有权只读投影，即使原通话表没有此客户；保原回访保存能力及其原资格。'], 'risks': ['不调用默认模拟内容补齐，不按汇总次数或脱敏号码造原明细/通话/业务归档，不由档案授回访保存权。'], 'refs': ['js/adapters/ai-customer-profile.js', 'scripts/ai_customer_profile_build.py', 'scripts/check-ai-customer-profile.cjs']},
    'TASK-036': {'deliverables': ['档案原AI通话引用按准确session/platform及当前范围重核后打开原详情，原录音F31和文本原入口保留。'], 'risks': ['聚合DTO不提供媒体URL；原场景/供应商/号码/权限变化拒绝，延后回调不得在离页或撤权后打开其他或第一条通话。'], 'refs': ['js/adapters/ai-customer-profile.js', 'js/adapters/ai.js', 'js/components/module-host.js', 'scripts/check-customer-profile-chain.cjs']},
    'TASK-043': {'deliverables': ['向统一档案提供原客户/Cloud/PRED授权只读快照；已存话单纯hydrate保最新结果、时长及业务备注，原导入/再次联系和原写资格仍由原控制器核验。'], 'risks': ['不覆盖CustomerDirectory.list/find为AI或统一业务授写权，不因读取调度同步、推进回执或迁移原客户历史。'], 'refs': ['scripts/customer_profile_build.py', 'js/adapters/four-node-workspace.js', 'js/adapters/cloud.js', 'scripts/check-customer-profile.cjs']},
    'TASK-016': {'deliverables': ['承接模板已保存的当前tenant具体任务及准确场景默认；TASK内导入锁定和后续安排各自原动作合同不因节点UX放宽。'], 'risks': [TEMPLATE_AUTH], 'refs': ['scripts/flow-node-config.js']},
}


def apply_task_groups(groups):
    """Use as GROUPS = apply_task_groups(GROUPS) before ordinary task build."""
    result = copy.deepcopy(groups)
    for group in result:
        rule = TASK_RULES.get(group['id'])
        if not rule: continue
        if rule.get('title'): group['title'] = rule['title']
        for key in ['deliverables', 'risks']:
            group[key] = unique(group.get(key, []) + rule.get(key, []))
        group['prototype_reference_files'] = unique(group.get('prototype_reference_files', []) + rule.get('refs', []))
    assert [row['id'] for row in result] == [row['id'] for row in groups]
    return result
