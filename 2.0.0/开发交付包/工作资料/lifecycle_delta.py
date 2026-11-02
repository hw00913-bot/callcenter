"""Step45 current-product lifecycle audit corrections; no runtime/stage writes."""
import copy

VERSION = '2.0.0-current-20261101-step45'
AUTH = 'inputs/lifecycle-audit-fix-authorization-20261101.json'
CONFIRM='FIELD-FLOW-MISSING-CONTENT-CONFIRM'
FINGERPRINT='FIELD-FLOW-ABANDON-CONFIRMATION'
SETTLEMENT='FIELD-FLOW-ABANDONMENT-SETTLEMENT'
ABANDON_TENANT='FIELD-FLOW-ABANDON-TENANT'
FIELD_IDS=[CONFIRM,FINGERPRINT,SETTLEMENT,ABANDON_TENANT]


def unique(values):
    return list(dict.fromkeys(values))


def apply(b, p, u, pf, rules):
    locals_={l['id']:l for d in [b,p] for l in d['locals']}
    fields={f['id']:f for d in [b,p] for f in d['fields']}
    def add(ident,name,entity,key,kind,fmt,nullable,default,rule,persistence,readonly=False):
        f=copy.deepcopy(fields['FIELD-FLOW-REASON'])
        f.update(id=ident,name=name,entity=entity,key=key,type=kind,format=fmt,nullable=nullable,
                 required_when='受控缺内容确认适用时按准确对象/当前缺失范围提供；旧历史不静默补写',
                 default=default,source_refs=['docs/field-alignment.json#'+ident],source_keys=[],test_refs=['CHECK-FLOW-CONTROLLED-ABANDON','CHECK-FLOW-ABANDON-DIRECT-SETTLEMENT'])
        f['validation_rules']=rule
        f['permissions']={'read':['当前负责租户有本业务废弃资格的ADMIN读取确认概要；已保存审计沿原业务/原段读取范围，不授跨租户私有字段值。'],
                          'write':['系统按已核当前ownerADMIN、准确run/本tenant旧seg、指纹/版本和原因写；用户不可直接改审计身份或终态。' if readonly else '仅当前负责租户且有本业务废弃资格的ADMIN在对应确认窗口明确勾选；不代填本人业务内容。']}
        f['lifecycle']=[{'state':'读取/草稿','behavior':rule[0]},{'state':'确认缺失/历史收尾','behavior':'完成缺内容废弃/历史确认时携runId、confirmationFingerprint和expectedRevision重核；真实执行/核对阻塞中仅登记停止不先强未来确认。'},{'state':'真实终结/历史','behavior':persistence['write_when']}]
        f['derivation']={'kind':'system' if readonly else 'input','rule':'；'.join(rule),'dependencies':['FIELD-FLOW-RUN-ID','FIELD-FLOW-RECORD-REVISION','FIELD-FLOW-REASON']}
        f['persistence']=persistence
        f['examples']={'valid':['当前ownerADMIN确认本tenant原段无法补填、原因与准确指纹/版本一致，真实执行停止后异常结清不计正常完成。'],
                       'invalid':['无确认、无原因、外租户段、过期指纹或用确认代替真实停止，拒绝。']}
        b['fields']=[v for v in b['fields'] if v['id']!=ident]+[f];fields[ident]=f
    add(CONFIRM,'确认必要本人内容无法补齐','AbandonInput','confirmMissingContent','boolean','true/false；缺省false',False,
        {'kind':'literal','value':False,'rule':'默认不勾选；只在当前确有缺失范围且ADMIN复核后明确选择。'},
        ['这是无法补填的确认，不是本人填写、正常归档或真实停止证明；当前缺失范围/实际人/字段及接通calls变化须重新核对。'],
        {'kind':'transient','write_when':'当前确认窗口暂存输入；通过提交时由系统封入原seg的abandonmentSettlement证据，输入本身不修改内容/执行状态。'})
    add(FINGERPRINT,'废弃缺失范围确认依据','AbandonContext','confirmationFingerprint','string','系统生成ABANDON-指纹；用户不可编辑',False,
        {'kind':'none','value':None,'rule':'由abandonContext或abandonedSettlementContext读取准确run及缺失上下文后生成，不人工构造。'},
        ['绑定record/run/本tenant缺失seg、实际人或UNKNOWN、冻结字段scope及接通calls等当前上下文；与expectedRevision一起提交，过期不可复用。'],
        {'kind':'transient','write_when':'每次准确上下文读取生成本次确认依据，相关事实/缺失范围变化使旧值失效；成功后对应缺失指纹仅作为seg审计保存。'},True)
    add(SETTLEMENT,'原跟进的受控废弃收尾证据','Followup','abandonmentSettlement','object',
        '{schema:1,recordId,runId,segmentId,confirmMissingContent,confirmedRole,confirmedBy,confirmedTenantId,confirmedAt,reason,missingContextFingerprint,missingContext,confirmationHistory,settledAt?,contentState?,contentSavedLaterAt?}',True,
        {'kind':'none','value':None,'rule':'只有合法弃/收尾操作生成，不为旧记录读时补造确认。'},
        ['缺内容确认含当前ownerADMIN/原因及准确record-run-seg、本tenant和缺失指纹；missingContext仅实际人或UNKNOWN、冻结字段scope/接通calls，不含私有字段值。',
         'settledAt不独自证明可重开，仍核原执行停止/重试/unknown/冲突及内容收尾；contentState为CONFIRMED_MISSING、SAVED_BY_ORIGINAL_PERSON或NO_HUMAN_CONTENT_REQUIRED。',
         '正常archived/completed不伪写；旧原人后补仍归原段且未正常完成。确认变更留confirmationHistory；历史确认只改本tenant旧seg该对象及事件/修订，不改当前run/direct/exec/arrangement/字段。'],
        {'kind':'stored','write_when':'合法弃确认/历史收尾时封存原seg确认元数据；真实执行可靠停止且内容条件满足时记settledAt/contentState，旧本人后补记contentSavedLaterAt，不回写正常完成。'},True)
    add(ABANDON_TENANT,'运行废弃意图的原租户','FlowRun','abandonTenantId','string','原废弃发起时准确tenantId，旧数据可缺',True,
        {'kind':'none','value':None,'rule':'新废弃操作按真实当前owner租户捕获；旧历史不读时迁移/猜补。'},
        ['与原abandonReason/account/time一起保留废弃意图来源，不随新owner或新run改写；不能作为代其他tenant确认旧段的权限。'],
        {'kind':'stored','write_when':'新废弃请求合法确认时由系统记录当前负责租户，保原原因/账号/请求时间；后续历史收尾不更改当前租户归属。'},True)
    fields[CONFIRM]['required_when']='可靠停止后要完成缺内容废弃，或确认旧ABANDONED本tenant缺失时需要；真实执行/核对阻塞仅登记停止时不强求未来确认'
    serial='同一业务串行；在途/排队/重试/unknown及事实冲突未可靠收敛不启动新段/新run或完成废弃。正常办理的必要本人内容须正常归档；缺内容仅当前负责租户ADMIN确认无法补填+原因并绑定准确run/段/缺失范围后，可在真实执行收敛时受控废弃结清。结清保缺失/未完成，不伪造archive/completed；后继可识别可靠旧废弃收尾，不要求其变正常archived=true。'
    for r in rules:
        if r['id']=='GR-SERIAL':r['statement']=serial
        if r['id']=='GR-END-ACTION':r['statement']='END先结束原run；CLOSE关闭，DIRECT_FOLLOWUP只在同record/owner建立来源准确的首MANUAL周期，不自动起呼。历史END来源保结构合法；分类开关例外仅准确当前origin cycle且MANUAL，不授权resume任何新周期。原角色/模块/资源/事实与正常必要归档仍核，历史不回改。'
        if r['id']=='GR-HANDLING-MODE':
            old='合法END来源可按已确认动作接续当前租户人工周期；它与普通DIRECT导入许可分开，可保已结束run历史但无当前模板节点。'
            new='合法END历史来源可保；分类DIRECT例外仅准确origin首MANUAL周期，resume三方式新周期均核当前allowDirectFollowup；旧已结束run/cycle不改成当前。可靠废弃结清与正常archive分别判，旧已弃原人补齐或合法确认后不永久阻后续DIRECT。'
            r['statement']=r['statement'].replace(old,new)
    abandon=locals_['LOCAL-FLOW-ABANDON']
    abandon['title']='请求及受控完成运行废弃'
    condition='要完成缺内容废弃时仅当前ownerADMIN确认无法补填+原因及准确run/本tenant缺失指纹/版本；真实执行或核对阻塞时可先普通reason登记停止，不强求未来内容确认，其他角色无缺内容结清例外'
    abandon['preconditions']=[v for v in abandon['preconditions'] if not v.startswith('必要本人内容缺失时，仅当前负责租户ADMIN确认无法补填') and not v.startswith('要完成缺内容废弃时仅当前ownerADMIN')]
    abandon['preconditions']=unique(abandon['preconditions']+[condition])
    abandon['postconditions']=['正常归档与可靠废弃结清分开，保缺失及未完成；不代填、不造archived/completedFollowup或正常完成计数；不删除真实通话/内容/历史']
    abandon['steps'][0]['action']='当前run有EXECUTION_ACTIVE/REQUEST_UNKNOWN/FACT_CONFLICT时，ADMIN普通reason可先登记停止→ABANDONING，不先强求未来内容确认；derived canRegisterStopping只指这些真实执行/核对阻塞，FOREIGN_CONTENT不冒充在途'
    abandon['steps'][1]['action']='原执行/排队/重试/unknown/冲突可靠收敛，正常必要内容已归档或缺内容已有合法受控确认时，才ABANDONED；保archiveState=ABANDONED及未正常完成，不把废弃结清写成archived=true'
    for branch in abandon['branches']:
        if branch['id']=='BRANCH-FLOW-ABANDON-1':branch['result']='保ABANDONING且禁止新增派发/新run，不提前释放；准确原已受理事实仍归原seg/attempt登记'
        if branch['id']=='BRANCH-FLOW-ABANDON-2':branch['condition']='真实执行/回执及必要正常归档或合法缺失受控收尾都已明确';branch['result']='ABANDONED保旧plan/内容/通话/缺失和未完成，后续可按受控新run入口，不计正常完成'
    if not any(x['id']=='BRANCH-FLOW-ABANDON-MISSING-CONFIRM' for x in abandon['branches']):
        abandon['branches'].append({'id':'BRANCH-FLOW-ABANDON-MISSING-CONFIRM','condition':'必要本人内容缺失而未获当前ownerADMIN有效确认/原因，或缺失范围已变化','result':'不能完成受控废弃或重开，保输入并准确说明缺失；不代填，不以人工确认替代真实停止','field_ids':['FIELD-FLOW-REASON','FIELD-FLOW-RUN-STATUS','FIELD-FLOW-CONTENT-SAVED'],'test_refs':['CHECK-FLOW-CONTROLLED-ABANDON']})
    for branch in abandon['branches']:
        if branch['id']=='BRANCH-FLOW-ABANDON-MISSING-CONFIRM':branch['result']='不能完成缺内容废弃或重开；如有真实执行/核对阻塞可先普通reason登记ABANDONING，不代填或以确认替代停止；已可靠停止后缺失确认必须补齐'
    close_rule='正常段必要内容/事实正常归档；已可靠废弃结清的旧段另判，不强制archived=true。旧已弃段原人后来补齐或合法确认后可可靠收尾，不永久阻本次后继办理；旧弃不贡献正常完成数。各当前动作仍按自己的独立前置，不能把完成DIRECT周期强加到重开或启用流程。'
    prior_close='正常段必要内容/事实正常归档；已可靠废弃结清的旧段另判，不强制archived=true。旧已弃段原人后来补齐或合法确认后可可靠收尾，不永久阻本次DIRECT；当前周期仍须自身真实完成或合法NO_CALL，旧弃不贡献完成数。'
    history={
        'id':'LOCAL-FLOW-ABANDONED-SETTLEMENT','title':'确认本租户已废弃旧段的缺失收尾','feature_ids':['FUNC-2038'],
        'trigger':'当前业务详情核对旧ABANDONED运行，当前ownerADMIN选择准确历史运行并确认无法补填',
        'preconditions':['当前负责租户ADMIN且有本业务废弃/收尾动作权；准确旧run为ABANDONED，只有本tenant旧seg可确认',
                         '原真实执行/重试/unknown/事实冲突已可靠收敛；其他tenant欠项只保摘要，不代其确认或放整体新run',
                         '不要求当前handlingMode=TEMPLATE或当前run ACTIVE；这不是废弃当前DIRECT周期或更改当前执行'],
        'postconditions':['只更新本tenant旧seg.abandonmentSettlement、r.events的ABANDONED_SETTLEMENT及record revision；当前run/direct/exec/arrangement/字段不变',
                          '缺失/未完成及旧本人内容保事实，不伪archived/completed；后续完成DIRECT/启用流程重新按正常及可靠弃收尾判据核验'],
        'inputs':['FIELD-FLOW-RECORD-ID','FIELD-FLOW-RUN-ID','FIELD-FLOW-RECORD-REVISION','FIELD-FLOW-REASON',CONFIRM,FINGERPRINT,SETTLEMENT,'FIELD-FLOW-EXECUTION-STATE','FIELD-FLOW-HANDLING-MODE'],
        'outputs':[SETTLEMENT,'FIELD-FLOW-RECORD-REVISION'],
        'steps':[
          {'id':'STEP-FLOW-ABANDONED-SETTLEMENT-1','action':'abandonedSettlementContext读取可核旧ABANDONED运行及本tenant缺失摘要/确认指纹/expectedRevision，不给私有字段值；选择run只是目标引用，不改当前run',
           'reads':['FIELD-FLOW-RECORD-ID','FIELD-FLOW-RUN-ID','FIELD-FLOW-EXECUTION-STATE',SETTLEMENT], 'writes':[FINGERPRINT], 'rule_ids':['GR-SERIAL','GR-AUTH','GR-SCOPE','GR-UNKNOWN','GR-LIFECYCLE-SETTLEMENT']},
          {'id':'STEP-FLOW-ABANDONED-SETTLEMENT-2','action':'confirmAbandonedSettlement提交必有runId、无法补填确认、原因及confirmationFingerprint/expectedRevision，重新核当前ownerADMIN、缺失范围/实际人/字段scope/接通calls及真实停止',
           'reads':['FIELD-FLOW-RUN-ID','FIELD-FLOW-RECORD-REVISION','FIELD-FLOW-REASON',CONFIRM,FINGERPRINT,'FIELD-FLOW-EXECUTION-STATE'], 'writes':[SETTLEMENT], 'rule_ids':['GR-SERIAL','GR-AUTH','GR-SCOPE','GR-UNKNOWN','GR-LIFECYCLE-SETTLEMENT']},
          {'id':'STEP-FLOW-ABANDONED-SETTLEMENT-3','action':'只写该旧run的本tenant seg证据/确认历史及ABANDONED_SETTLEMENT事件(原run/segmentIDs/admin/reason/time)和revision；读回剩余欠项，不改变当前DIRECT/运行/执行/字段，不自动重开',
           'reads':['FIELD-FLOW-HANDLING-MODE','FIELD-FLOW-RUN-ID',SETTLEMENT], 'writes':[SETTLEMENT,'FIELD-FLOW-RECORD-REVISION'], 'rule_ids':['GR-SERIAL','GR-DATA-FACTS','GR-NO-HISTORY','GR-LIFECYCLE-SETTLEMENT']}],
        'branches':[
          {'id':'BRANCH-FLOW-ABANDONED-SETTLEMENT-1','condition':'非当前ownerADMIN、旧run不准或请求跨tenant seg','result':'拒绝且不写证据/当前状态，不代填或泄露其他tenant私有值','field_ids':[SETTLEMENT,'FIELD-FLOW-RUN-ID'],'test_refs':['CHECK-FLOW-ABANDON-DIRECT-SETTLEMENT']},
          {'id':'BRANCH-FLOW-ABANDONED-SETTLEMENT-2','condition':'无明确确认/原因，指纹或记录revision过期，原执行/unknown/冲突未收敛','result':'保输入重读/核对，不结清或解锁；确认不能替代真实停止','field_ids':[CONFIRM,FINGERPRINT,'FIELD-FLOW-RECORD-REVISION','FIELD-FLOW-EXECUTION-STATE'],'test_refs':['CHECK-FLOW-ABANDON-DIRECT-SETTLEMENT']},
          {'id':'BRANCH-FLOW-ABANDONED-SETTLEMENT-3','condition':'本tenant旧欠项合法确认，可能仍有其他tenant欠项','result':'只结清本tenant可确认部分并保整体剩余阻塞；同请求重复读原结果，不更当前run/direct/exec/arrangement/字段','field_ids':[SETTLEMENT,'FIELD-FLOW-HANDLING-MODE','FIELD-FLOW-RECORD-REVISION'],'test_refs':['CHECK-FLOW-ABANDON-DIRECT-SETTLEMENT']}],
        'global_rule_ids':['GR-SERIAL','GR-AUTH','GR-SCOPE','GR-UNKNOWN','GR-DATA-FACTS','GR-NO-HISTORY','GR-LIFECYCLE-SETTLEMENT'],
        'field_ids':[],'source_keys':[],'source_refs':['documentation/input/functions.json#FUNC-2038'],
        'test_refs':['CHECK-FLOW-ABANDON-DIRECT-SETTLEMENT']}
    b['locals']=[l for l in b['locals'] if l['id']!=history['id']]+[history];locals_[history['id']]=history
    for ident in FIELD_IDS:
        abandon['inputs']=unique(abandon['inputs']+[ident]);abandon['steps'][-1]['reads']=unique(abandon['steps'][-1]['reads']+[ident])
    abandon['outputs']=unique(abandon['outputs']+[SETTLEMENT,ABANDON_TENANT]);abandon['steps'][-1]['writes']=unique(abandon['steps'][-1]['writes']+[SETTLEMENT,ABANDON_TENANT])
    for lid in ['LOCAL-FLOW-REOPEN','LOCAL-FLOW-COMPLETE-DIRECT','LOCAL-FLOW-ENABLE-TEMPLATE']:
        l=locals_[lid]
        l['preconditions']=[v for v in l['preconditions'] if not v.startswith('正常段必要内容/事实正常归档；已可靠废弃结清的旧段另判')]
        l['preconditions']=unique(l['preconditions']+[close_rule])
        l['steps'][0]['action']=l['steps'][0]['action'].replace('；'+prior_close,'')
        l['steps'][0]['action']+='；'+close_rule if close_rule not in l['steps'][0]['action'] else ''
        for branch in l['branches']:
            if '未归档' in branch['condition'] or '归档未完成' in branch['condition']:
                branch['condition']=branch['condition'].replace('未归档','未正常归档且未可靠废弃结清').replace('必要本人归档未完成','正常必要归档及旧废弃结清未满足')
    locals_['LOCAL-FLOW-COMPLETE-DIRECT']['preconditions'][1]='所有旧真实执行/排队/重试/unknown/冲突可靠收敛；当前周期及正常段必要本人内容正常归档，旧已废弃段按可靠异常收尾判断，不一律要求archived=true'
    locals_['LOCAL-FLOW-ENABLE-TEMPLATE']['preconditions'][2]='全部旧真实执行/排队/重试/unknown/冲突可靠收敛；正常段必要本人内容与归档满足，旧废弃段按可靠结清分别判断'
    locals_['LOCAL-FLOW-ENABLE-TEMPLATE']['preconditions'][4]='当前DIRECT可ACTIVE/COMPLETED，不强制先完成周期；只核全部真实执行收敛、正常必要归档及旧废弃可靠结清，不新增分类DIRECT开关前置'
    for i,pre in enumerate(locals_['LOCAL-FLOW-START']['preconditions']):
        if '前次所需内容和事实已归档' in pre:locals_['LOCAL-FLOW-START']['preconditions'][i]='前正常段必要内容/事实已正常归档或旧已废弃段可靠结清；全部真实在途/重试/unknown/冲突收敛，联系限制及同号/资源协调允许'
    resume=locals_['LOCAL-FLOW-RESUME-DIRECT']
    resume['branches']=[x for x in resume['branches'] if x['id']!='LOCAL-FLOW-RESUME-DIRECT-END-ORIGIN']
    resume['steps'][0]['action']='创建下一MANUAL/AI/PREDICTIVE周期前直接重核当前分类allowDirectFollowup=true，不复用旧当前周期的END准入例外；旧END历史来源结构仍可合法保留'
    handoff=locals_['LOCAL-FLOW-END-HANDOFF']
    handoff['postconditions']=unique(handoff['postconditions']+['历史来源结构与当期例外分开；分类开关豁免只属于准确来源首MANUAL周期，resume新周期不继承'])
    for branch in handoff['branches']:
        if branch['id']=='BRANCH-FLOW-END-HANDOFF-DIRECT':branch['result']='准确END只授权本record/owner来源directCycleId的首MANUAL接续，可不要求普通DIRECT开关；身份/模块/资源/事实/必要归档仍核。历史保留不授resume新周期，后者重核分类。'
    origin_clause='历史END证明与当前周期例外分开：只有同record/owner/来源directCycleId的首MANUAL当前周期可豁免分类开关；resume任何新周期都须当前分类允许，旧来源只保历史。'
    for lid in ['LOCAL-FLOW-ASSIGN','LOCAL-FLOW-START','LOCAL-FLOW-COMPLETE-DIRECT']:
        l=locals_[lid]
        for branch in l['branches']:
            if 'END-ORIGIN' in branch['id']:
                branch['condition']='当前周期恰为可靠END来源的首MANUAL，record/owner/origin directCycleId与当前cycle准确一致'
                branch['result']=origin_clause
    facts=locals_['LOCAL-FLOW-CALL-FACTS']
    fact_rule='新派发准入与入站事实分开；ACTIVE/ABANDONING原已受理且未可靠关闭的准确seg/attempt迟到拨打/接通/终态按原ID归账去重计数，不因非ACTIVE误标dialed=false/0或假冲突；不授新派发、不挂新run/当前身份、不提前释放。已闭段未知新attempt仍原EXECUTION_CLOSED/冲突规则。'
    facts['preconditions']=unique(facts['preconditions']+['停止请求不等真实停止；只登记原受理请求的可靠事实，不以入账授权新调用/重呼'])
    facts['steps'][1]['action']='区分受理/排队/实际dial/接通/实际人工/重试收敛；'+fact_rule
    facts['postconditions']=unique(facts['postconditions']+[fact_rule])
    fields['FIELD-FLOW-RUN-STATUS']['validation_rules']=['ACTIVE/ABANDONING/ABANDONED/ENDED各按真实状态；停止意图不是终态，必要缺内容须合法受控确认且执行真实收敛才完成废弃。']
    fields['FIELD-FLOW-RUN-STATUS']['persistence']['write_when']='新run ACTIVE，END正常结束为ENDED；废弃意图可ABANDONING，真实执行及正常归档/合法缺失收尾都满足才ABANDONED，保原因/确认与未完成事实。'
    fields['FIELD-FLOW-ARCHIVE-STATE']['validation_rules']=unique(fields['FIELD-FLOW-ARCHIVE-STATE']['validation_rules']+['ABANDONED是异常收尾，不等正常COMPLETE；合法缺失结清保必要内容缺失及未完成，不增正常完成数。'])
    fields['FIELD-FLOW-ARCHIVE-STATE']['persistence']['write_when']='正常COMPLETE按原必要事实/内容/下游依据齐备后唯一保存；受控废弃的ABANDONED状态与原运行废弃/旧段收尾一起保存，不要求缺内容被伪补为正常归档。'
    fields['FIELD-FLOW-ARCHIVED']['validation_rules']=unique(fields['FIELD-FLOW-ARCHIVED']['validation_rules']+['可靠废弃收尾不要求archived=true，不能为消除后继结算阻塞伪造正常归档；旧弃原人后来补齐也不改写其正常完成性质。'])
    fields['FIELD-FLOW-CONTENT-SAVED']['validation_rules']=unique(fields['FIELD-FLOW-CONTENT-SAVED']['validation_rules']+['受控缺失确认不生成本人内容；旧已弃段本人首次合法后补仍归原段、不改较新值，也不自动计其正常完成。'])
    for ident in ['FIELD-FLOW-ARCHIVE-STATE','FIELD-FLOW-ARCHIVED','FIELD-FLOW-CONTENT-SAVED']:
        fields[ident]['lifecycle']=fields[ident]['lifecycle']+[{'state':'受控废弃/旧段后补','behavior':'按原弃证据保缺失未完成；旧本人后补属于原段，原异常收尾与正常archive/completed分开，不回写新run/当前字段。'}] if not any(x['state']=='受控废弃/旧段后补' for x in fields[ident]['lifecycle']) else fields[ident]['lifecycle']
    fields['FIELD-FLOW-END-FOLLOWUP-ORIGIN']['validation_rules']=[
        '按同record、原已结束run/END动作/tenant、首MANUAL来源周期证明历史结构；后来周期身份不同不删除合法历史或判整个记录非法。',origin_clause,
        '例外不豁免原模块/本人/资源/真实事实与必要正常归档；不能前端自报、跨owner或改originCycleId续权。',
        '可保已结束runs/nodeRuns历史；DIRECT不能保当前runId/templateRef/nodeId冒充运行中模板。']
    fields['FIELD-FLOW-END-FOLLOWUP-ORIGIN']['derivation']['rule']='合法END建立首MANUAL周期时封存真实来源；历史合法性与当前周期是否享有开关例外分别计算，不从普通导入或人改值生成。'
    fields['FIELD-FLOW-RETRIES-COMPLETE']['validation_rules']=unique(fields['FIELD-FLOW-RETRIES-COMPLETE']['validation_rules']+['停止请求/受理不代表无后续尝试；原已受理迟到真实拨打仍记录，可靠结束且不会再呼叫前不解锁。'])
    for ident in ['FIELD-FLOW-RUN-STATUS','FIELD-FLOW-ARCHIVE-STATE','FIELD-FLOW-ARCHIVED','FIELD-FLOW-CONTENT-SAVED','FIELD-FLOW-RETRIES-COMPLETE']:
        fields[ident]['derivation']['rule']='；'.join(fields[ident]['validation_rules'])
    acs=[
        ('AC-2163','登记停止与完成废弃分开：EXECUTION_ACTIVE/REQUEST_UNKNOWN/FACT_CONFLICT下ADMIN普通reason可先ABANDONING，不强未来内容确认，FOREIGN_CONTENT不冒充在途。可靠停止后仍缺内容须当前ownerADMIN确认无法补填+原因/准确run/本tenant指纹版本才可ABANDONED；保缺失未完成，不代填或假正常archive/completed。'),
        ('AC-2164','正常archive与可靠旧废弃结清分别判断；旧已弃段本人后来补齐或合法确认后可可靠收尾，不永久阻后继DIRECT完成/启用流程，也不贡献当前周期真实完成数或覆盖当前字段。当前必要内容/执行及实质冲突仍原准入。'),
        ('AC-2165','END历史来源保结构合法；分类allowDirect例外仅准确record/owner/originCycleId的首MANUAL当前周期。resume创建MANUAL/AI/PRED新周期都核当前分类允许，不能把历史保留变成永久豁免，也不能误封合法首次接续。'),
        ('AC-2166','ABANDONING不准新派发，但原已受理且未可靠关闭的准确seg/attempt迟到真实拨打/接通/终态归原ID去重计数，不误标0或挂当前，不提前释放；已闭段未知新attempt仍拒/保冲突证据，停止请求不是真停止。')]
    checks=[
        ('CHECK-FLOW-CONTROLLED-ABANDON','LOCAL-FLOW-ABANDON',['AC-2163'],'在途/REQUEST_UNKNOWN/FACT_CONFLICT时ADMIN普通reason先登记停止；原执行可靠停止后仍缺必要本人内容，核reason-only/非ownerADMIN/未确认/无原因/过期范围，再合法确认；FOREIGN_CONTENT单独反例。','真实执行/核对阻塞可先ABANDONING不强未来确认；FOREIGN_CONTENT不是停止借口。完成缺失废弃须停止可靠且本tenant缺失合法确认，保缺失未完成、正常archived/completed不造；不提前释放，历史收尾不放宽。'),
        ('CHECK-FLOW-ABANDON-DIRECT-SETTLEMENT','LOCAL-FLOW-ABANDONED-SETTLEMENT',['AC-2164'],'旧run受控废弃→重开正常完成→END首MANUAL→当前真实直接跟进归档；原本人后来补齐，或当前ownerADMIN用准确旧run/指纹/revision确认本tenant旧欠项，再完成当前DIRECT/启用流程。另含跨tenant/非ADMIN/过期/多个旧run/真实旧冲突。','可靠旧弃收尾不要求正常archived=true，不永久卡DIRECT；只改本tenant旧seg证据/事件/revision，当前状态/字段不变。当前周期凭自身真实完成或合法NO_CALL，旧弃不计正常完成；外tenant/无权/旧unknown冲突仍原守卫。'),
        ('CHECK-FLOW-END-CURRENT-CYCLE','LOCAL-FLOW-RESUME-DIRECT',['AC-2165'],'分类关闭下合法END首MANUAL接续及完成，保历史后resume三方式均试；再分类开启试合法新周期，核current/origin cycle、owner/method错配反例。','合法首次MANUAL可用，三方式新cycle关闭时拒、开启按原资格；历史来源仍合法可查，不伪改来源身份或跨周期借权。'),
        ('CHECK-FLOW-STOPPING-RECEIPTS','LOCAL-FLOW-CALL-FACTS',['AC-2166'],'原受理排队→请求停止/ABANDONING→原attempt迟到拨打/接通/结束，含乱序/重复及新run隔离；核已闭段未知新attempt、停止仅受理而未实际结束。','真实原事实按原seg/attempt入账计数去重，禁止新派发/误挂当前；不提前释放，不抹拨打/伪冲突；已闭未知新attempt依原拒绝/冲突规则。')]
    for aid,statement in acs:b['acceptance_updates']=[a for a in b['acceptance_updates'] if a['id']!=aid]+[{'id':aid,'statement':statement,'source_refs':['docs/exception-definitions.json#CHG-045-LIFECYCLE'],'decision_refs':['CHG-045-LIFECYCLE']}]
    for acceptance in b['acceptance_updates']:
        if acceptance['id']=='AC-2121':acceptance['statement']='同业务串行，真实在途/排队/重试/unknown及冲突不放新执行。正常当前CALL仍依必要内容/事实归档；旧已废弃段可靠结清另判，不强求正常archive。转交仍原独立准入，初次纯IMPORT不先造呼叫/填写。'
        if acceptance['id']=='AC-2141':acceptance['statement']='END先结束原run，CLOSE关闭或DIRECT_FOLLOWUP同record/tenant建准确首MANUAL周期，不自动起呼。历史来源保合法，只有当前cycle恰是该origin首MANUAL才免普通DIRECT开关；resume三方式新周期核当前分类。原身份/模块/资源/事实及必要内容仍核。'
    for cid,lid,aids,procedure,expected in checks:
        b['checks']=[c for c in b['checks'] if c['id']!=cid]+[{'id':cid,'acceptance_ids':aids,'procedure':procedure,'expected':expected,'lifecycle_revision':VERSION}]
        locals_[lid]['test_refs']=unique(locals_[lid]['test_refs']+[cid])
    changed=['LOCAL-FLOW-ABANDON','LOCAL-FLOW-ABANDONED-SETTLEMENT','LOCAL-FLOW-REOPEN','LOCAL-FLOW-COMPLETE-DIRECT','LOCAL-FLOW-ENABLE-TEMPLATE','LOCAL-FLOW-RESUME-DIRECT','LOCAL-FLOW-END-HANDOFF','LOCAL-FLOW-ASSIGN','LOCAL-FLOW-START','LOCAL-FLOW-CALL-FACTS']
    for l in b['locals']:
        if l['id'] not in changed:continue
        l['global_rule_ids']=unique(l['global_rule_ids']+['GR-LIFECYCLE-SETTLEMENT'])
        l['steps'][-1]['rule_ids']=unique(l['steps'][-1]['rule_ids']+['GR-LIFECYCLE-SETTLEMENT'])
        for cid in l['test_refs']:
            c=next((x for x in b['checks'] if x['id']==cid),None)
            if not c or cid in [x[0] for x in checks]:continue
            c['procedure']='按当前Step45生命周期规则：'+l['trigger']+'；'+'；'.join(s['action'] for s in l['steps'])+'；构造无权/缺确认/过期/真实在途或unknown/事实冲突对照。'
            c['expected']='；'.join(l['postconditions'])+'；保原身份/当前值/未完成事实及真实统计，不代填、不借历史END给新周期续权、不提前释放。'
    for f in b['features']:
        aids={'FUNC-2031':['AC-2164','AC-2165','AC-2166'],'FUNC-2032':['AC-2163','AC-2164','AC-2166'],'FUNC-2038':['AC-2163','AC-2164','AC-2165'],'FUNC-2039':['AC-2164','AC-2165']}.get(f['id'],[])
        if aids:f['acceptance_ids']=unique(f['acceptance_ids']+aids);f['source_refs']=unique(f['source_refs']+['docs/exception-definitions.json#CHG-045-LIFECYCLE'])
        if f['id']=='FUNC-2038':f['description']='按准确条件确认后继及END两动作；受控废弃保缺失/未完成，原执行真实收敛后异常结清与新run，不伪造正常archive。END历史结构与准确首MANUAL当期例外分开；旧run/内容/通话/来源保留。'
        if f['id']=='FUNC-2032':f['description']='按准确实际办理/接听人保存本次内容、真实通话及定义/值快照，正常条件满足唯一归档。受控缺失废弃保未完成且与正常archive分开；可靠旧弃结清不永久阻后继DIRECT，但不贡献完成数或绕真实unknown/冲突。原受理迟到事实归原ID入账，内容更正/当前值按原规则。'
    for page in u['ui']['pages']:
        if page['id']=='UI-PAGE-2227':
            page['local_logic_ids']=unique(page['local_logic_ids']+[history['id']])
            for ident in FIELD_IDS:
                if ident in [v['field_id'] for v in page['fields']]:continue
                f=fields[ident];base=copy.deepcopy(page['fields'][0]);is_confirm=ident==CONFIRM
                base.update(field_id=ident,label=f['name'],component_id='UI-COMP-CONFIRM' if is_confirm else 'UI-COMP-READONLY',
                            help_text='；'.join(f['validation_rules']),visible_when='当前run废弃或本tenant旧ABANDONED运行收尾核对窗口，具当前ownerADMIN动作权且有相应上下文时显示；普通历史只按原读权展示审计摘要。',
                            editable_when='仅明确勾选无法补填确认；原因沿原输入。历史run选择只引用目标，不修改当前run。' if is_confirm else '只读系统身份/范围/审计，不让用户手工输入指纹或改证据。',
                            required_indicator='完成缺内容废弃/历史确认才必勾；真实执行/核对阻塞中仅登记停止不强未来确认，无缺失不伪造。' if is_confirm else '系统提供准确值；用户不补输入。',
                            validation_timing='提交重核runId/confirmationFingerprint/expectedRevision、当前ownerADMIN、本tenant缺失范围及真实执行停止；变化后重新读取确认。',
                            error_message='保原因/输入并提示无权、旧范围已变或原执行未收敛；不代填或强结清。',
                            formatting='无法补齐必要本人内容确认（默认不勾选），不代表停止或正常完成。' if is_confirm else '按需显示原运行/原段/租户/确认者/时间/原因及缺失状态摘要，不展示私有字段值或铺内部原始指纹。')
                page['fields'].append(base)
            page['components']=unique(page['components']+['UI-COMP-CONFIRM','UI-COMP-READONLY','UI-COMP-DRAWER','UI-COMP-SELECT'])
            page['interactions']=[i for i in page['interactions'] if i['id']!='UI-FLOW-2227-ABANDONED-SETTLEMENT']+[{
                'id':'UI-FLOW-2227-ABANDONED-SETTLEMENT','trigger':'当前ownerADMIN在业务详情选择“核对历史废弃收尾”，选择准确旧运行、核本tenant缺失概要并确认无法补填/原因',
                'behavior':'不受当前TEMPLATE/DIRECT模式限制；abandonedSettlementContext只读概要，确认携准确旧runId/指纹/版本；只写本tenant旧seg证据及ABANDONED_SETTLEMENT事件/修订，不废弃当前DIRECT或改run/exec/arrangement/字段。已可靠结清显示无需确认；其他tenant欠项只提示不能代确认。',
                'local_logic_ids':[history['id']],'test_refs':['CHECK-FLOW-ABANDON-DIRECT-SETTLEMENT']}]
        for interaction in page['interactions']:
            related=[locals_[lid] for lid in interaction['local_logic_ids'] if lid in locals_]
            if not any(l['id'] in changed for l in related):continue
            interaction['behavior']='；'.join('；'.join(s['action'] for s in l['steps']) for l in related)+'；提交重核当前owner/角色/原执行身份及缺失范围，失败保输入，unknown核同请求。'
            interaction['test_refs']=unique(interaction['test_refs']+[t for l in related for t in l['test_refs']])
        page['test_refs']=unique(page['test_refs']+[t for lid in page['local_logic_ids'] if lid in locals_ for t in locals_[lid]['test_refs']])
    pages={page['source_page_ids'][0]:page for page in u['ui']['pages']}
    for page in pf['pages']:
        current=pages.get(page['id'])
        if current:
            page['interaction_rules']=[a['behavior'] for a in current['interactions']]
            page['local_logic_ids']=unique(page.get('local_logic_ids',[])+current['local_logic_ids'])
            if any(lid in changed for lid in current['local_logic_ids']):page['current_behavior']='；'.join(a['behavior'] for a in current['interactions'])
            if page['id']=='PAGE-2227':page['canonical_field_ids']=unique(page.get('canonical_field_ids',[])+FIELD_IDS)
    for l in b['locals']:
        used=l['inputs']+l['outputs']+[v for s in l['steps'] for v in s['reads']+s['writes']]+[v for z in l['branches'] for v in z['field_ids']]
        l['field_ids']=unique(used)
    statement='受控缺内容废弃仅当前ownerADMIN确认无法补填+原因/准确范围，真实执行收敛后异常结清，保缺失未完成不假archive；旧弃原人补齐/合法结清不永久卡后继DIRECT。END历史合法与首MANUAL当期例外分开，resume新周期核分类；停止中原受理事实按原ID入账不授新派发或提前解锁。'
    b['supersessions']=[x for x in b['supersessions'] if x['id']!='CHG-045-LIFECYCLE']+[{'id':'CHG-045-LIFECYCLE','old':'GR-SERIAL一律要求旧必要内容正常归档才能废弃/新run，另处却允许保缺失废弃；END历史来源被当成新周期例外，停止中原事实受ACTIVE新派发门槛阻断。','current':statement,'evidence_refs':['docs/exception-definitions.json#CHG-045-LIFECYCLE']}]
    b['lifecycle_audit_delta']={'version':VERSION,'authorization':AUTH,'field_ids':FIELD_IDS,'local_ids':[history['id']],'acceptance_ids':[a[0] for a in acs],'check_ids':[c[0] for c in checks],'formal_approval':False,'production_verified':False}
    rules=[r for r in rules if r['id']!='GR-LIFECYCLE-SETTLEMENT']+[{'id':'GR-LIFECYCLE-SETTLEMENT','name':'异常废弃结清与原执行事实隔离','statement':statement,'source_refs':['docs/exception-definitions.json#CHG-045-LIFECYCLE'],'source_keys':[],'test_refs':[c[0] for c in checks]}]
    return b,p,u,pf,rules
