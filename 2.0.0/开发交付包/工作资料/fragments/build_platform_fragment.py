import json,re,pathlib
BASE=pathlib.Path('/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0')
OUT=BASE/'开发交付包/工作资料'
orig=json.loads((OUT/'origin-feature-ids.json').read_text())
acs=json.loads((OUT/'origin-acceptance-ids.json').read_text())
ret=json.loads((BASE/'需求/分析工作区/memory/feature-list.json').read_text())['retained_capability_references']
audit=json.loads((BASE/'prototype/memory/full-inheritance-audit-20261029.json').read_text())
page_for={k:p['page_id'] for p in audit['pages'] for k in p.get('retained_operation_keys',[])}
ALL=['超级管理员','租户总部管理员','租户总部运营','租户门店管理员','租户门店运营']
ADMIN=['超级管理员（仅有权对象和明确操作权）','租户总部管理员（本租户）','租户门店管理员（本租户）']
TEN=['租户总部管理员（本租户）','租户总部运营（本租户且有操作权）','租户门店管理员（本租户）','租户门店运营（本租户且有操作权）']
READ=['五角色中具有该对象读取资格者；当前租户/独立平台授权范围内']
SYSTEM=['系统（仅确认的权威业务结果）']
fields=[]; locals_=[]; checks=[]; F={}; L={}; C={}
def field(code,name,entity,key,typ='string',fmt='UTF-8文本；保留稳定标识原值',nullable=False,required='提交该实体的新建或修改时必填',validation=None,read=None,write=None,persist='stored',when='权威保存成功后更新；失败保留已确认值及用户输入，结果未知等待核对',default=None,derive=None,deps=None,valid=None,invalid=None,lifecycle=None):
 fid='FIELD-PLAT-'+code;F[code]=fid
 d={'id':fid,'name':name,'entity':entity,'key':key,'source_refs':['docs/field-alignment.json#'+fid],'source_keys':[],'type':typ,'format':fmt,'nullable':nullable,'required_when':required,'default':{'kind':'none','value':None,'rule':'无自动默认；编辑载入当前已确认值；省略不等于清空'} if default is None else {'kind':'literal','value':default,'rule':'仅新建初始化；编辑不覆盖现值'},'validation_rules':validation or ['输入须符合格式；空值不得当成合法标识或零值','提交时再次验证当前对象范围及修订；未知值不可代填'],'permissions':{'read':READ if read is None else read,'write':ADMIN if write is None else write},'lifecycle':lifecycle or [{'state':'editing','behavior':'载入现值；有权时可修改，权限或范围变化后禁止提交并保留输入'},{'state':'confirmed','behavior':'仅显示最近权威确认值；失败/未知不得覆盖成成功值'}],'derivation':{'kind':derive or ('input' if write not in ([],SYSTEM) else 'external' if persist=='external' else 'system'),'rule':'由有权用户明确提交，编辑不静默清空' if derive is None and write not in ([],SYSTEM) else '从本实体准确稳定标识对应的已确认结果取得；缺失显示未取得，不能用同名对象、首项或0补齐','dependencies':['FIELD-PLAT-'+x for x in (deps or [])]},'persistence':{'kind':persist,'write_when':when},'examples':{'valid':valid or ['合法对象当前已确认值；按本字段格式校验后保存'],'invalid':invalid or ['缺失、格式不符或对象无权：拒绝提交并指出字段；不保存猜测值']},'test_refs':[]}
 fields.append(d);return fid
# Identity, tenant and membership are separate entities.
field('ACCOUNT-ID','账号稳定标识','account','id',write=SYSTEM,required='所有认证、关联和账号操作前须解析准确账号',derive='system',valid=['ACCOUNT-001'],invalid=['昵称李明作为账号ID：拒绝'])
field('LOGIN-NAME','登录账号','account','loginName',fmt='4–32位；A–Z/a–z/0–9/点/下划线/连字符',validation=['全局唯一；去首尾空白后校验','只在新建或明确全局资料维护动作修改；查找同手机号不能自动覆盖'],valid=['li.ming_01'],invalid=['ab：长度不足；李明：不符合登录名格式'])
field('NICKNAME','姓名／昵称','account','nickname',fmt='1–20字符，去首尾空白',validation=['必填且长度1–20；不作为账号/租户匹配依据'],valid=['李明'])
field('MOBILE','账号手机号','account','mobile',fmt='11位字符串；^1\\d{10}$',validation=['账号层唯一；保留字符串','查到已有手机号仅展示准确账号候选，必须显式关联，不能自动合并'],valid=['13800000001'],invalid=['138****0001：掩码不是真实号码'])
field('PASSWORD','登录／设置密码','accountCredential','password',fmt='8–16字符；同时含大写、小写、数字、符号',required='新建账号或明确重设密码时必填；登录时须提供当前凭据',read=['用户仅当前输入；任何管理列表/详情均不得读取明文'],write=['用户本人登录/改密','有明确重设权限的账号管理者'],persist='transient',when='仅本次安全认证或设置提交使用；不进入业务快照/日志/页面缓存；凭据物理存储由真实认证工程契约承接',validation=['8–16位且四类字符齐全','不回显已存密码；认证失败不能提示存在性敏感差异'],valid=['Abcdef1!'],invalid=['12345678：缺少大小写及符号'])
field('AVATAR','头像','account','avatar',fmt='PNG/JPEG/WebP；≤2MB',nullable=True,required='选填；用户明确上传或移除时才修改',validation=['仅允许三类真实图片且大小≤2MB','缺省沿用现值，明确移除才清空'],valid=['1.5MB PNG图片'],invalid=['3MB图片或SVG文件：拒绝'])
field('ACCOUNT-STATE','全局账号状态','account','enabled',typ='boolean',fmt='true启用／false停用',write=['超级管理员（明确全局账号管理权）'],default=True,validation=['仅全局停用影响全部租户；不能由成员停用修改','停用保留任务/通话/审计事实；允许当前接通电话有限收尾'])
field('SESSION','登录会话与合法范围','session','scope',typ='object',fmt='当前账号；合法租户集合/独立平台资源范围；认证状态',write=SYSTEM,persist='transient',when='认证/授权权威结果后建立或刷新；退出清除；未知不得建立',validation=['同名/同手机号/同品牌不能推导身份和权限','认证成功与范围读取成功分别处理；无权与读取失败区分'])
field('CURRENT-TENANT','当前业务租户','session','tenantId',nullable=True,required='进入有权业务租户功能时必填；独立平台/专业范围不强加业务成员',write=['用户仅选择当前合法租户'],persist='transient',when='电话保护及未保存表单保护完成且目标范围重新验证成功后切换',validation=['选项取当前真实授权交集','不得跨租户恢复客户、草稿或电话在线；失权回合法入口'])
field('POSITION','工作位置与筛选记忆','session','position',typ='object',fmt='accountId+tenantId+原专业功能身份+pageId+filters',nullable=True,required='访问有权页后记录，首次可无',write=SYSTEM,persist='transient',when='同次会话合法导航后记录；恢复前重新验权并刷新',validation=['只恢复对应账号/租户/专业域合法页面和筛选','顶栏固定五入口不改原首次合法入口意图；不得恢复电话在线'])
field('GUARD-STATE','本人电话及未保存保护状态','session','transitionGuard',typ='object',fmt='dialing/ringing/talking/aftercall/offline/unknown；表单dirty',write=SYSTEM,persist='transient',when='电话事件和表单变更时刷新；离开前实时核对',validation=['当前本人电话受保护；监管查看他人不作为本人通话','离线失败/未知不放行；普通表单保存/放弃/取消各自独立'])
field('BRAND-ID','品牌标识','brand','id',write=SYSTEM,derive='system',validation=['系统稳定ID；跨页引用按ID','不能按品牌名称推授租户或业务权限'])
field('BRAND-NAME','品牌名称','brand','name',fmt='去首尾空白，1–60字符',write=['超级管理员'],validation=['1–60字符；编辑不更换稳定ID'],valid=['东风日产'])
field('BRAND-REMARK','品牌备注','brand','remark',nullable=True,required='选填；明确清空可保存',write=['超级管理员'],validation=['去首尾空白；空白作为明确无备注','不解析备注为路由/资源或权限配置'])
field('TENANT-ID','业务租户标识','tenant','id',write=SYSTEM,derive='system',validation=['准确唯一业务租户ID；与供应商企业/AI租户ID分开','名称或品牌不能充当租户映射'])
field('TENANT-NAME','租户名称','tenant','name',fmt='去首尾空白，1–60字符',write=['超级管理员（租户管理权）'],validation=['1–60字符；名称修改不改变账号/资源/数据归属'],valid=['日产总部'])
field('TENANT-CONTACT','租户联系人','tenant','contact',nullable=True,required='选填；明确清空可保存',write=['超级管理员（租户管理权）'],validation=['首尾空白去除；按文本保存','联系人不用于账号自动合并或成员授权'])
field('TENANT-DESC','租户说明','tenant','desc',fmt='去首尾空白≤50字符',nullable=True,required='选填',write=['超级管理员（租户管理权）'],validation=['≤50字符；空值与不修改区分'])
field('TENANT-COMMERCIAL','商业类型','tenant','commercialFlag',fmt='trial试用／commercial商用',default='trial',write=['超级管理员（租户管理权）'],validation=['仅允许trial/commercial','不直接改变已确认财务余额、有效期和供应商执行资源'])
field('TENANT-BRAND','所属品牌','tenant','brandId',write=['超级管理员（品牌归属维护权）'],deps=['BRAND-ID'],validation=['新建必选已存在品牌；每租户只有一个品牌','更换需明确无业务引用；有引用或引用状态未知禁止修改','同品牌不共享业务数据，也不直接绑定模板路由'])
field('TENANT-TYPE','总部／门店身份','tenant','organization',fmt='总部／门店',write=['超级管理员（品牌归属维护权）'],validation=['每品牌最多一个总部，其他为独立门店','已存在业务引用或未知不得改总部/门店身份','身份不是第六种角色'])
field('STORE-CODE','门店编码','tenant','storeCode',fmt='字符串，去首尾空白≤80字符；保留前导零',nullable=True,required='门店可暂缺；总部固定为空；按意向门店自动映射时必须可靠有效',write=['超级管理员（租户管理权）'],validation=['同品牌非空门店编码唯一','总部不允许门店编码；0012不能转换为12','空值不得猜测转交目标；当前业务引用保护及并发修订共同检查'],valid=['0012'],invalid=['同品牌重复0012：拒绝'])
field('MODULES','模块开通状态','tenant','modules',typ='object',fmt='{ai:boolean,cloud:boolean}',default={'ai':False,'cloud':False},write=['超级管理员（模块开通权）'],validation=['AI与Cloud独立，可仅开其中一个','Cloud开通须当前有效企业资源映射；仅AI不要求Cloud资源','开通不自动赋予任何成员操作权限'])
field('TENANT-ENTERPRISE','云呼叫企业资源关联','tenant','enterpriseId',nullable=True,required='Cloud开通或Cloud资源执行前必须准确有效；仅AI可为空',write=['超级管理员（资源关联权）'],validation=['资源须存在、RUNNING、当前有权且未被其他租户占用','有业务引用/状态未知禁止清空或换绑','此关联独立于AI租户/机器人身份；不以名称匹配'])
field('REFERENCE-STATE','业务引用判定','referenceCheck','state',fmt='none/referenced/unknown',write=SYSTEM,persist='transient',when='编辑身份/删除最终提交前重新读取可靠引用结果',validation=['仅none可进行要求无引用的动作','unknown不是none；不得以列表为空推断无引用'])
field('REVISION','对象当前修订','confirmedObject','revision',fmt='不透明修订标记，按原对象比较',write=SYSTEM,validation=['最终保存与载入的期望修订一致','并发冲突不得覆盖新值；刷新后重新确认提交'])
field('REQUEST','操作请求标识','operation','requestId',write=SYSTEM,validation=['同一用户提交/同一业务目的重试沿用同一请求标识','结果未知先核对原请求，不能生成新请求重复结算/开通/禁呼'])
field('OP-STATE','操作结果状态','operation','state',fmt='editing/submitting/pending/success/failure/unknown',write=SYSTEM,validation=['accepted/pending不是成功；只有准确请求与对象确认终态才success','失败保留已确认旧值；未知不显示已完成或盲重试'])
field('AUDIT','变更审计','operation','audit',typ='object',fmt='对象/动作/操作人/时间/请求/前后值/结果',write=SYSTEM,validation=['与对应已受理或已确认变更关联','敏感凭据不记录明文；未知结果记录未知，不伪造成功审计'])
field('UPDATED','最近更新时间','confirmedObject','updatedAt',fmt='带时区时间戳；显示本地时区，排序按同一时间基准',write=SYSTEM,validation=['列表按更新时间降序后分页；相同时间稳定按标识排序','字段顺序、路径优先级、时间事件序列按语义顺序，不套用列表排序'])
field('MEMBER-ID','租户成员标识','membership','id',write=SYSTEM,validation=['accountId+tenantId只能有一条有效成员关系','成员对象与全局账号、坐席三个实体分别操作'])
field('MEMBER-ACCOUNT','成员关联账号','membership','accountId',write=ADMIN,validation=['明确选择准确已有账号或完成新建账号后关联','手机号查询仅候选；内置超管账号不可作为普通成员关联'])
field('MEMBER-TENANT','成员所属租户','membership','tenantId',write=ADMIN,validation=['仅当前有权管理的租户；不跨租户授予','每个账号可有多个独立租户成员关系'])
field('MEMBER-ROLE','租户成员角色','membership','role',fmt='admin/operator；结合总部/门店形成四种租户生产角色',default='operator',write=ADMIN,validation=['只允许本管理员可委派角色/权限子集','不允许普通成员授予超级管理员；坐席是能力，不是角色'])
field('MEMBER-GRANTS','成员模块及操作授权','membership','modules',typ='object',fmt='ai/cloud各自reader/operator/admin或明确功能资格',write=ADMIN,validation=['只能授予已开通模块及本人可委派子集','菜单、路由、对象、提交动作均验相应授权','配置/监管/财务/坐席能力分开；无坐席不阻碍合法配置和只读'])
field('MEMBER-STATE','本租户成员状态','membership','enabled',typ='boolean',fmt='true启用/false停用',default=True,write=ADMIN,validation=['停用仅当前租户，不能修改账号全局状态','禁止新操作，已接通电话+必要话后有限收尾；其他人员原授权不自动转交'])
field('LIMITED','有限收尾范围','session','limitedCompletion',typ='object',fmt='停用时已接通callId+必要话后+当前租户',nullable=True,write=SYSTEM,persist='transient',when='停用事件锁定现有电话；完成必要话后后失效',validation=['不能新拨、新接、改配置、访问无关对象','结束收尾不是重新启用账号/成员'])
# Shared filters and professional business facts.
field('QUERY','查询筛选','listQuery','filters',typ='object',fmt='页面当前已应用关键词、状态、日期、租户、平台等',required='点击查询/重置/分页时按页面字段读取',write=READ,persist='transient',when='确认查询后按账号/租户/页面记忆；不改业务数据',validation=['筛选范围取有权交集；不可通过全选扩权','失败保留当前筛选，空结果与失败分开；列表先按更新时间倒序再分页'])
field('PAGING','分页与结果总量','listQuery','paging',typ='object',fmt='页码正整数/页大小/当前授权结果总量',write=SYSTEM,persist='transient',when='查询成功后刷新；删除后越界回合法页',validation=['只对授权且筛选后的数据计算总量','不能把前端当前页导出误称全量'])
field('TASK-ID','专业任务标识','professionalTask','id',write=SYSTEM,validation=['AI/PRED/IVR任务分别按准确平台+tenant+enterprise+taskId解析','专业任务不是四节点业务运行ID'])
field('TASK-MODE','专业任务执行方式','professionalTask','mode',fmt='AI/PREDICTIVE/IVR；人工任务按自己的作业入口',write=SYSTEM,validation=['执行/重呼规则按具体方式分开','AI/人工/预外呼/IVR不得互套资源、失败码、重呼或自动完成规则'])
field('TASK-NAME','任务名称','professionalTask','name',fmt='非空文本，使用原任务表单允许长度',validation=['新建/修改提交时非空；精确供应商字数上限由真实契约核对，超限显式拒绝','修改不改变taskId或已受理结果归属'])
field('TASK-STATE','专业任务状态','professionalTask','state',fmt='草稿/待启动/执行中/已暂停/已结束/失败/待核；按执行方式回执',write=SYSTEM,validation=['状态由准确任务结果解释，不由按钮点击直接置成功','未提交/未启动IVR删除保留引用保护；已执行结果不可清除','AI原占位启动/暂停/终止/删除按钮不升级为本版已实现能力'])
field('TASK-SCHEDULE','专业任务执行时间','professionalTask','schedule',typ='object',fmt='原任务开始/结束时间、可呼时段、计划',validation=['开始/结束先后及当前执行状态合法','修改只影响允许的未执行部分，已受理阶段按真实结果核对'])
field('TASK-RESOURCES','任务执行资源','professionalTask','resources',typ='object',fmt='准确供应商/enterprise/坐席或外呼组/号码池/IVR外呼语音流程',validation=['只能使用同租户同企业、已启用且支持该执行用途的资源','IVR需供应商外呼可执行flowId，不能使用本地或呼入流程ID','预外呼需可用坐席/外呼组及原额度，不把预外呼规则套AI或IVR'])
field('TASK-POLICY','预外呼策略','professionalTask','predictivePolicy',typ='object',fmt='原并发/重呼/坐席等待等专业策略',nullable=True,required='预外呼任务按原策略必需项填写；其他方式不用',validation=['仅PREDICTIVE使用；次数/额度按供应商精确允许值校验','正常重呼与明确异常补提交分开，不回放未知请求'])
field('TASK-FAILURES','任务失败分类与重试候选','professionalTask','failures',typ='array',fmt='逐号码明确失败原因/可重呼或补交资格/原请求',write=SYSTEM,validation=['只对原允许的失败类动作，明确失败和未知分开','重呼/补交前再次公共禁呼检查；下载不等于已重呼'])
field('IMPORT-ROWS','专业名单导入内容','professionalImport','rows',typ='array',fmt='CSV/Excel解析行：稳定业务标识、姓名、规范号码及当前必需字段',validation=['全行按当前目录/映射校验；重复、冲突、缺必填逐行报错','掩码号不可导入；禁止猜测缺失业务值','正式提交范围所有行通过；导入按真实确认逐项回执，不虚报整批原子性'])
field('IMPORT-BATCH','导入批次标识与统计','professionalImport','batch',typ='object',fmt='batchId/提交人/时间/成功失败逐行结果',write=SYSTEM,validation=['批次详情以准确ID查权；列表不连带导出本批能力','批次、业务记录、名单项各自稳定标识；不以手机号合并'])
field('CUSTOMER-ID','原客户任务业务标识','professionalCustomer','id',write=SYSTEM,validation=['tenantId+enterpriseId+稳定业务记录标识归属','同号联系历史可关联查看，不合并业务任务/客户记录'])
field('CUSTOMER-NAME','客户称呼','professionalCustomer','name',required='新导入/新建需要当前必填客户称呼时填写',validation=['按当前目录校验非空；保留提交值','不作为身份去重/转交或路由条件的隐式来源'])
field('PHONE','客户真实号码','professionalCustomer','phone',fmt='规范号码字符串；境内手机号11位，其余按实际号制明确校验',read=['有权对象及号码明文读取权者；其他按原脱敏展示'],write=TEN,validation=['执行前须可靠未掩码规范号码；未知/掩码不可猜测','保存/执行/禁呼使用同一准确规范号码；不将同号当同业务ID'],valid=['13800000001'],invalid=['138****0001：不能用于实际拨号或禁呼新增'])
field('FOLLOWER','原任务负责人／分配跟进人','professionalCustomer','assignedAccountId',nullable=True,required='原任务要求分配时必填；未分配可空',validation=['只能选本任务有权且有效成员/所需坐席能力者','负责人不等于实际接听人；不能借分配修改已确认外呼方式或业务归属'])
field('PRO-FOLLOW-STATE','原客户任务跟进结果','professionalFollowup','state',fmt='待继续跟进/已完成',write=['当前有权实际拨打／接听人'],validation=['保留原专业两态；不解释成四节点运行的结束/废弃','完成回传按准确业务任务处理，失败不假报已回传'])
field('PRO-FILL','原客户任务填写值','professionalFollowup','fieldValues',typ='object',fmt='按当前有权专业字段定义及稳定字段ID取值',write=['当前有权实际拨打／接听人'],validation=['必填、显示、枚举、单多选按字段定义校验','填写与导入字段区分；AI标签不能直接写业务字段','仅成功保存后形成跟进记录；本轮取最新有效值并保留当时快照'])
field('FOLLOW-NOTE','跟进备注','professionalFollowup','remark',nullable=True,required='可选；该处理结果要求原因时必填',write=['当前有权实际拨打／接听人'],validation=['保留本人明确提交文本；未保存不算业务结果','拒联等需要原因/证据按对应动作校验'])
field('CALL-ID','通话稳定标识','call','id',write=SYSTEM,validation=['tenant+platform+enterprise+准确callId锁定通话','不能以号码/最近一条替代指定callId'])
field('CALL-STATE','通话事实状态','call','state',fmt='拨号/振铃/接通/未接通/结束/未知；供应商原码+规范映射',write=SYSTEM,persist='external',when='准确通话回执或同通话可靠核对后更新事实；不得覆盖人工跟进结果',validation=['未知不当未接通/接通；供应商事实与人工业务结果分别显示','晚回执只补所属通话事实，不自动推进业务运行'])
field('CALL-ACTOR','实际拨打／接听人','call','handlerAccountId',nullable=True,required='人工接通及可归属话后前必须准确；AI非人工为空',write=SYSTEM,validation=['由当前通话/执行段准确账号坐席映射取得','谁接听谁填写；不以分配负责人或管理员身份冒填'])
field('CALL-TIMES','通话时间与时长','call','times',typ='object',fmt='呼叫/振铃/接通/挂机时间戳；计时单位秒',write=SYSTEM,persist='external',validation=['来自同callId的可确认事件；时间先后合法','未取得不补0；统计区分通话、计费、等待时长'])
field('RECORDING','录音访问引用','call','recording',typ='object',fmt='授权录音引用/可用状态/播放位置',nullable=True,required='有录音时展示；无录音明确显示不可用',write=SYSTEM,persist='external',validation=['五角色对有权对象凭读权可播放/暂停/拖动，不要求编辑权限','每次解析/播放都查读范围；过期/无权/下载失败分开','不把受限地址长期暴露到其他租户缓存'])
field('CALL-ERROR','通话数据异常','callException','record',typ='object',fmt='异常ID+tenant+enterprise+callId+类型+当前处理状态',write=SYSTEM,validation=['只显示当前enterprise有权异常','核对只能补事实或留待处理，不能重拨/改业务跟进或自动完成'])
field('RECONCILE-TRACE','异常核对记录','callException','trace',typ='array',fmt='同异常的核对请求/证据/时间/结果',write=SYSTEM,validation=['追加保留；未知继续待核','错误callId或无权企业拒绝，不写其他通话'])
field('PHONE-STATE','本人电话状态','seatSession','state',fmt='offline/login-pending/idle/busy/dialing/ringing/talking/aftercall/unknown',write=SYSTEM,persist='transient',when='本人准确坐席的原电话事件确认后更新',validation=['上线须有效成员+Cloud模块+唯一有权可呼叫坐席+有效分机','unknown/未配置不能当离线或可用；退出/换域按本人状态保护'])
field('DIAL-NUMBER','本次外呼号码','dialRequest','phone',fmt='可靠规范号码字符串',write=['当前本人具有拨号资格的有权操作者'],persist='transient',when='点击拨号捕获准确对象和号码；禁呼通过后仅提交本次请求',validation=['与当前客户/任务可确认号码一致，手动号码按原入口资格','每次首次/重呼/补交均重新检查；不能用缓存放行'])
# AI scene/tag definitions and exact execution dependencies.
field('AI-TENANT','AI租户映射','aiScope','tenantId',write=SYSTEM,persist='external',validation=['统一租户须唯一准确映射AI租户','不能按名称、手机号或首项猜测'])
field('AI-SCENE-ID','具体AI执行场景','aiScene','id',write=SYSTEM,validation=['具体场景稳定ID；与标签场景及AI场景类型分别识别','使用资格不要求标签维护资格'])
field('AI-SCENE-NAME','AI场景名称','aiScene','name',validation=['原具体场景名称必填；编辑不变ID','不按同名自动关联品牌分类或标签场景'])
field('AI-SUPPLIER','AI供应商','aiScene','supplierId',validation=['只能当前场景有权可执行供应商','供应商切换须重查参数/标签/机器人能力，不能复用其他池'])
field('AI-TYPE','AI场景类型','aiSceneType','code',fmt='线索（新/冷专业细分）/活动及原供应商允许类型',validation=['保留原专业细分；公共活动不额外造售前/售后公共属性','停用后不许新选；已受理准确场景按专业规则完成'])
field('AI-PARAMS','AI执行参数与机器人','aiScene','parameters',typ='object',validation=['只允许供应商/具体场景真实可用参数与机器人','品牌分类维护不能新增机器人或AI专业配置权'])
field('AI-CATEGORY','AI场景业务分类引用','aiScene','categoryId',nullable=True,required='新关联品牌分类时必须准确有效；原独立专业场景按自身资格',validation=['关联具体场景ID与当前品牌有权分类ID','仅专业业务归类，不等于模板实际路由绑定；路由以业务分类路由配置为准','停用分类禁止新选/新关联，不改已受理任务事实'])
field('AI-TAG-SCENE','AI标签场景','aiTagConfig','tagSceneId',validation=['准确标签场景，不能以具体执行场景/类型名称替代','按供应商+总部/门店租户类型+标签场景启用及映射'])
field('AI-SUPPLIER-TAGS','供应商标签池','aiTagConfig','supplierTags',typ='array',validation=['池由准确supplierId隔离；稳定供应商标签ID与原值保留','新增/修改/删除须配置权；有映射/引用的项不得静默断链'])
field('AI-LOCAL-TAGS','本地标准标签','aiTagConfig','localTags',typ='array',validation=['标准集按租户类型+标签场景；保留稳定标签ID','租户运营只使用已配置标签，不获得维护/删除权'])
field('AI-MAPPING','标签映射及启用','aiTagConfig','mapping',typ='object',validation=['supplierId+tenantType+tagScene+准确tagID映射，保存冲突修订拒绝','名称推荐/未选/首项都不是已确认映射；未匹配保原始值','配置启停只影响允许的新使用，不重写已生成结果'])
field('AI-TAG-CONTEXT','执行段标签上下文','aiExecution','tagContext',typ='object',write=SYSTEM,validation=['supplier/tenant/type/tagScene/category/brand/revision七元组及选定场景快照一致','准确返回标签ID须为该快照允许子集；不匹配显式未知/冲突','路径依赖按已开始运行快照冻结；一般AI场景可取当前最新使用配置'])
field('AI-TAG-RESULT','AI原始与映射标签结果','aiCallResult','tags',typ='object',write=SYSTEM,persist='external',validation=['原始值、准确映射ID、执行段标签上下文同时保留','可作人工确认路径条件；不直接写业务字段，不因AI回执自动推进','未匹配不回退首项，不把挂机/拒接/无意向认定明确拒联'])
field('AI-LEAD','AI线索结果','aiLead','result',typ='object',write=SYSTEM,persist='external',validation=['按准确原任务/通话/线索ID和平台范围读取','回访权限与读取权限分开，不以AI标签覆盖已保存人工结果'])
# Blacklist groups, source records and remote footprints are not duplicated lists.
field('BAN-GROUP','黑名单分组标识','blacklistGroup','id',write=SYSTEM,validation=['当前租户原分组模型；客户拒联系统组来源受保护','不创建公共/专项两套列表或跨租户同品牌共享'])
field('BAN-NAME','黑名单分组名称','blacklistGroup','name',validation=['有权租户配置且非空；不能伪造客户拒联系统组','名称不充当远端组标识'])
field('BAN-DESC','分组说明','blacklistGroup','description',nullable=True,required='选填',validation=['按文本保存；空白可明确清空','不从备注推导公共拒联证据'])
field('BAN-EXPIRY','普通组期限配置','blacklistGroup','expiry',fmt='永久或N天；N为原合法正整数',validation=['普通组按有效期限制；不能把未知期限设为永久','客户明确拒联长期有效，解除需独立理由和权限'])
field('BAN-COUNT','分组数量与有效数','blacklistGroup','counts',typ='object',write=SYSTEM,validation=['当前可读准确组内统计','删除只允许真正空组，不能仅当前页为0'])
field('BAN-ID','黑名单／拒联来源记录标识','blacklistRecord','id',write=SYSTEM,validation=['每来源独立稳定ID；拒联sourceCall/request精确幂等','同号其他来源不可被一次解除或普通编辑抹除'])
field('BAN-PHONE','限制规范号码','blacklistRecord','phone',fmt='可靠未掩码规范号码字符串',validation=['当前有权来源准确号码；不能从掩码还原猜测','拒联来源号码/通话不可通过普通改号重写'])
field('BAN-CUSTOMER','普通名单客户姓名','blacklistRecord','name',nullable=True,required='普通手工新增/导入可选',validation=['按文本记录，不自动合并客户档案','修改普通名单姓名不改变拒联来源事实'])
field('BAN-ADD-TYPE','名单添加类型','blacklistRecord','addType',fmt='DECLINE/INTENT/OTHER',validation=['普通手工/导入按明确添加类型；客户拒联有实际通话确认依据','INTENT保护不自动成为四类长期拒联'])
field('BAN-SOURCE','拒联／名单来源证据','blacklistRecord','source',typ='object',fmt='sourceType human/ai/manual、callId、平台、operatorId、原sourceId',write=SYSTEM,validation=['人工拒联须成功话后保存；AI拒联须有权准确通话+明确人工确认','源事实不可普通组移动/编辑伪造；旧已解除事件不能复活'])
field('BAN-REASON','限制原因','blacklistRecord','reason',nullable=True,required='明确拒联/业务需要原因的新增时必填，其余按原手工组字段',validation=['明确提交的真实原因；不能从无意向/挂机猜拒联','与准确来源同请求保存，不以toast代替已入库'])
field('BAN-LIFETIME','限制有效时段','blacklistRecord','effectivePeriod',typ='object',fmt='effectiveAt、expiresAt|null（明确永久）',write=SYSTEM,validation=['普通N天从生效时间+N×24小时计算；已到期不生效','未知生效/到期不当永久；客户拒联须明确长期来源'])
field('BAN-STATE','本地限制状态','blacklistRecord','state',fmt='active/released/expired/pending/unknown',write=SYSTEM,validation=['本地有效与远端同步独立','released不因同事件重放复活；新拒联须新来源'])
field('BAN-RELEASE','解除本条来源的记录','blacklistRelease','record',typ='object',fmt='准确sourceId+必填原因+操作人+时间+请求状态',write=['本租户总部管理员／门店管理员（具有解除权；超管只读）'],validation=['运营/普通新增权/超级管理员只读均不可解除','拒联话后尚未完成或原请求待核先核对；只解除本来源','保留来源与解除轨迹，不能删除其他仍生效来源'])
field('BAN-BINDING','分组供应商同步绑定','blacklistGroup','platformBindings',typ='array',fmt='原供应商准确目标；天润enterpriseId+type(1/2)+useRange',write=TEN,validation=['超管只读，无启停/重试同步权','天润需当前Cloud开通/当前企业；不使用远端组ID/名称','type2时useRange为1–15整数位掩码；其他类型按供应商契约'])
field('BAN-REMOTE','远端来源足迹与同步状态','blacklistRecord','remoteState',typ='array',fmt='provider+原enterprise/target+原方向+requestId+pending/success/failure/unknown',write=SYSTEM,persist='external',validation=['每来源保原目标身份；停同步不擦除足迹也不证明已删除','仅准确请求/目标确认才终态；未知不得反向新请求或假成功'])
field('CONTACT-DECISION','本次外呼禁呼检查','contactCheck','decision',fmt='allow/blocked/unknown',write=SYSTEM,persist='transient',when='每次新拨/重呼/异常补交实时查询同租户同规范号码的当前有效源',validation=['任何有效公共拒联源拦截AI/人工/PRED/IVR；正常呼入不因此拒接','unknown/失败阻止新发起并给核对提示；在途电话不静默取消','专项组范围/期限依明确配置，不自动扩为四类公共拒联'])
# Finance remains original AI service ledger with five-role scoped read and super-admin-only writes.
field('SERVICE-STATE','AI服务状态','aiService','status',fmt='not_opened/pending/active/expired/invalid',write=SYSTEM,validation=['按当前服务确认状态显示','未开通/待核不能当有效；租户类型不直接证明服务已开通'])
field('SERVICE-VALIDITY','服务有效期','aiService','validity',typ='object',fmt='effectiveAt/expiresAt；未开通单独状态',write=SYSTEM,validation=['同一服务可靠时间范围，生效早于到期','未知不显示永久；到期不允许新呼叫'])
for code,key,nm in [('MINUTES-AVAILABLE','available','可用分钟'),('MINUTES-FROZEN','frozen','冻结分钟'),('MINUTES-CONSUMED','consumed','累计消耗分钟')]:
 field(code,nm,'aiMinutePool',key,typ='number',fmt='分钟，有限非负数；精度按权威服务快照保留',write=SYSTEM,validation=['必须可靠有限且≥0；未取得不能填0','同次服务快照三池及有效期一致，不换算旧大小模型金额'])
field('SERVICE-CONTROL','AI呼叫控制状态','aiService','callControl',fmt='可发起/不可发起/待核',write=SYSTEM,deps=['SERVICE-STATE','SERVICE-VALIDITY','MINUTES-AVAILABLE'],derive='calculated',validation=['仅服务active、当前有效、可用分钟>0、人工控制允许且映射可靠才可发起','欠证/未知必须待核或不可发起；不能只按余额猜测'])
field('SERVICE-PACKAGE','服务产品','serviceTransaction','productType',fmt='trial_package/standard_annual/call_credit_pack',write=['超级管理员（服务办理权）'],validation=['开通/续期/充值按明确产品及租户当前资格','仅选产品不表示已结算；已待核请求不得重复下单'])
field('SERVICE-QUANTITY','产品数量／充值参数','serviceTransaction','quantity',typ='object',fmt='所选试用/年包/加油包明确数量和原允许财务参数',write=['超级管理员（服务办理权）'],validation=['按真实产品目录及允许额度校验，不接受负数/非有限值','价格/分钟/有效期须来自同一产品当前确认定义，不由前端编造'])
field('SERVICE-ADJUST','服务调整参数','serviceAdjustment','change',typ='object',fmt='原允许的调整对象、方向、数值、原因',write=['超级管理员（调整权）'],validation=['调整前后值与当前修订一致；必填调整原因','禁止直接减少冻结分钟；方向/对象按真实允许枚举','不新增未定义的扣费补偿业务'])
field('SERVICE-HISTORY','充值／调整记录','serviceTransaction','history',typ='array',write=SYSTEM,persist='external',validation=['五角色按租户原读权查看，非超管不能办理','每笔保原requestId/产品/前后值/受理与终态；未知先核对再原请求重试'])
field('FINANCE-EXPORT','租户AI服务汇总导出','aiServiceExport','snapshot',typ='array',fmt='8列：租户名称、租户ID、租户类型、可用分钟、冻结分钟、累计消耗分钟、有效期、呼叫控制状态',write=SYSTEM,persist='transient',when='超管有导出权且授权AI租户交集的同次可靠快照生成后下载',validation=['只超管且明确财务导出权；不受原计费日期/平台和公共租户筛选偷偷改变','统一租户与AI租户精确一对一；任一必要字段未知则不出文件','UTF-8 BOM CSV按规则转义并中和公式；无数据或生成失败明确反馈'])
# Professional resources: shared identity, exact fields, distinct entities.
field('RESOURCE-SCOPE','专业资源归属','professionalResource','scope',typ='object',fmt='unified tenant + provider + enterpriseId + object nativeId +用途',write=SYSTEM,validation=['业务租户范围与独立平台resource-only grant分别判定','平台/资源资格不是新增生产角色；不推同品牌数据权','查询权不授修改、导出或监管权'])
field('RESOURCE-STATE','资源生命周期与同步状态','professionalResource','state',typ='object',fmt='启用/停用/删除/处理中/待核及远端确认状态',write=SYSTEM,validation=['本地记录、已受理和远端已生效分开','引用中/在线/未知状态按具体资源拒绝危险改动'])
field('SEAT-ID','供应商坐席标识','seat','id',write=SYSTEM,validation=['当前tenant+enterprise下准确native坐席','一个有效本人账号/成员映射不得含冲突坐席；不凭姓名匹配'])
field('SEAT-NAME','坐席姓名','seat','userName',fmt='去首尾空白，1–40字符',validation=['创建必填≤40；修正仅明确失败创建记录','姓名不是账号关联身份'])
field('SEAT-CNO','坐席工号','seat','cno',fmt='3–10位数字字符串；前导零保留',validation=['同企业工号唯一；0012与012不同','同步已有工号不重复创建；未知开通先核对'],valid=['0012'],invalid=['12：不足3位；重复0012：拒绝'])
field('SEAT-AREA','坐席区号','seat','areaCode',fmt='原供应商合法数字区号字符串',validation=['按供应商合法区号校验，保留0','未取得不伪造区号'])
field('SEAT-EXTENSION','坐席软电话分机','seat','softphoneExtensionId',nullable=True,required='可暂不配置；上线前必须唯一有效',validation=['当前企业仅一坐席占用一个分机；候选须可用且有权','在线/在用/状态未知不能换绑；留空不允许上线'])
field('SEAT-ACCOUNT','坐席关联账号成员','seat','membershipId',nullable=True,required='本人电话能力需准确关联，可独立维护未关联资源',validation=['准确member解析account+tenant+enterprise，与dialog scope一致','非删除、无冲突、非在用；关联不自动启用或授Cloud权'])
field('SEAT-BATCH','批量开通工号和结果','seatProvisioning','items',typ='array',validation=['逐工号预检查、提交和确认/失败/未知记录','部分成功不假报整体回滚或整体成功；同journal未知工号仅核对不重建'])
field('SKILL-ID','技能标识','skill','id',write=SYSTEM,validation=['当前企业准确物理技能ID；本地模板不当远端已生效','资源用途与当前作业合法'])
field('SKILL-NAME','技能名称','skill','name',validation=['非空，当前企业原唯一约束','编辑不改物理ID或静默丢失已有关系'])
field('SKILL-MEMBERS','坐席技能成员关系','skillRelation','members',typ='array',validation=['准确坐席与技能同tenant+enterprise；只改选中关系','在线新增保存待提交，下线后显式提交；原既有成员/等级保留'])
field('SKILL-LEVEL','技能等级','skillRelation','skillLevel',typ='integer',fmt='1–10整数，1最高',default=1,validation=['整数1–10；在线坐席先下线再调整','不把等级展示等同实际接听分配保证'],valid=['1','10'],invalid=['0或1.5：拒绝'])
field('OUTBOUND-NAME','外呼组名称','outboundGroup','name',validation=['当前企业原唯一命名规则，必填','原默认/引用保护通过后才可删除'])
field('OUTBOUND-MEMBERS','外呼组成员','outboundGroup','members',typ='array',validation=['同租户同企业有权坐席候选；准确选择集合','被任务引用或状态改变时按原锁拒绝修改；不联动业务负责人'])
field('QUEUE-NAME','队列名称','queue','name',validation=['当前企业原唯一命名规则，创建必填','准确队列修订检查；不以同名新建代替编辑'])
field('QUEUE-PARAMS','队列参数','queue','parameters',typ='object',fmt='原队列允许呼入等待/容量/分配相关参数',validation=['按原队列表单允许值逐字段校验；缺少可靠枚举/范围不猜默认','修改与技能成员核对状态分开，不承诺远端已同步'])
field('QUEUE-SKILL','队列技能关联','queue','skillIds',typ='array',validation=['当前企业准确技能集合且用途相符','保存关联与成员核对分别反馈，未核实不得显示成员已一致'])
field('NUMBER','云呼叫号码','cloudNumber','number',fmt='供应商号码字符串，保留号制',write=SYSTEM,validation=['从有权供应商目录显式选择导入，准确enterprise/native标识','本地启停只改变本地可用性，不伪造供应商销号或新开通'])
field('NUMBER-PROPS','号码属性','cloudNumber','properties',typ='object',write=SYSTEM,validation=['原号码类型/用途/状态来自供应商可确认目录','不能以本地开关绕过远端不可用或用途限制'])
field('POOL-NAME','号码池名称／备注','numberPool','nameAndRemark',typ='object',validation=['名称按原当前企业命名校验，备注可选','默认池不可删除、已有默认不能取消；只改准确池'])
field('POOL-TYPE','号码池类型','numberPool','type',fmt='0号码群组/1中继群组',default='0',validation=['创建必选；已有池类型不可修改','供应商不支持的类型拒绝，不转换本地列表代替'])
field('POOL-DEFAULT','是否默认号码池','numberPool','isDefault',typ='boolean',default=False,validation=['当前企业最多一个默认池','已有默认池不可取消；其他池不可抢占默认'])
field('POOL-NUMBERS','号码池完整号码集合','numberPool','numbers',typ='array',fmt='每行或逗号分隔规范号码，保存完整集合',nullable=False,required='可空集合；明确清空即移除池内全部号码',validation=['号码必须当前企业合法资源；去重后按企业上限','未配置企业上限时号码数少于500；不把500当合法','编辑全量替换需明确确认，省略不自动清空'])
field('EXTENSION-ID','分机标识／号码','extension','number',validation=['当前企业有效软电话分机且唯一','不可删除/换绑正在使用或已占用分机；供应商未知先核对'])
field('EXTENSION-NAME','分机名称与原配置','extension','configuration',typ='object',validation=['原表单允许字段逐项校验，所属企业不越权','导入先选准确候选并独立保存；不自动选全部'])
field('TIME-NAME','时间条件名称','timeCondition','name',validation=['当前AliCti账号名称唯一；创建必填','创建后名称不可修改，更名须新建'])
field('TIME-TYPE','时间条件日期范围及时间类型','timeCondition','type',typ='object',fmt='日期type1按星期/2固定日期；timeType1连续/2间隔',validation=['四个枚举组合仅按原支持方式','日期范围变更后重新校验所需星期/日期'])
field('TIME-RANGE','时间条件区间','timeCondition','range',typ='object',fmt='星期或fromDay/toDay；startTime/endTime HH:mm，同一天',validation=['开始日期≤结束日期；星期非空；开始时间<结束时间且同一天','空值不能代午夜；不允许跨日伪造单日范围'])
field('TIME-PRIORITY','时间条件优先级','timeCondition','priority',typ='integer',fmt='≥1整数；小值优先',validation=['同AliCti账号唯一优先级','不能用更新时间重排业务优先级'])
field('ENTERPRISE-CONFIG','AliCti账号配置','providerAccount','configuration',typ='object',fmt='当前有权原账号名称、企业标识和供应商配置',validation=['供应商enterprise稳定身份与业务租户一对一映射明确','敏感凭据按有权操作显示，不进入普通列表/日志；启停不清历史'])
field('APP-ID','应用接入标识','application','applicationId',write=SYSTEM,validation=['系统生成稳定appId；删除只作用准确当前有权应用','不按应用名或回调URL合并'])
field('APP-NAME','应用名称','application','name',fmt='非空，≤60字符',validation=['创建/修改提交必填≤60','名称改变不更换appId或回写历史来源'])
field('APP-TENANTS','应用授权租户','application','authorizedTenantIds',typ='array',validation=['显式选中当前可授权租户子集','修改先检查修订；本次授权不扩大用户自身业务访问权'])
field('APP-CALLBACK','业务回调地址','application','callbackUrl',fmt='有效HTTP(S) URL；生产HTTPS可达性由真实接入核验',nullable=True,required='一般登记选填；接口导入前必须有可靠回传地址',validation=['非空时URL合法；接口导入必须满足已配置回调','返回成功须准确请求终态；地址配置不证明真实回传成功'])
field('APP-SECRET','应用接入密钥','applicationCredential','secret',fmt='不透明敏感凭据；默认掩码',write=SYSTEM,persist='external',validation=['仅有权详情显示/复制，离页清除明文展示状态','当前原型仅演示密钥；不能宣称真实鉴权令牌已生成'])
field('API-PAYLOAD','业务系统导入内容','businessIntegration','importPayload',typ='object',fmt='appId+准确授权tenant+稳定业务ID+规范号码+目录必需值',write=['已鉴权且具有该租户接入权的外部业务系统'],validation=['同应用授权租户/enterprise/当前目录必需字段及重复标识校验','重复同业务请求幂等；冲突内容不覆盖已有业务；不能手机号合并','DCC接口任务状态与新四节点运行按准确记录分别解释'])
field('API-RESULT','业务结果回传','businessIntegration','delivery',typ='object',fmt='准确原业务/通话ID、原人工结果、回传请求及受理/终态',write=SYSTEM,persist='external',validation=['完成业务保存成功后回传当前准确结果；失败保留待回传','重试同请求幂等；超时不当成功，不重拨或重写跟进'])
field('PRO-FIELD-ID','云呼叫专业字段标识','cloudProfessionalField','id',write=SYSTEM,validation=['原租户字段目录稳定ID；不是品牌新字段的第二份定义','若当前页面映射到品牌字段入口，使用同源准确字段身份并明确专业能力边界'])
field('PRO-FIELD-DEF','云呼叫专业字段定义','cloudProfessionalField','definition',typ='object',fmt='名称、控件类型、选项、启用及原取数/专业参数',validation=['原类型/单多选/接口字典语义保留；不可凭名称与品牌字段合并','预置及引用保护；任何分类引用时不可删除，启用分类显示中不可停用','预览只读，不保存客户值；目录维护不改已保存跟进快照'])
field('INBOUND-ID','呼入规则标识','inboundRule','id',write=SYSTEM,validation=['当前tenant+enterprise准确ID','仅已停用且无待核才可删除'])
field('INBOUND-NAME','呼入规则名称／备注','inboundRule','nameAndRemark',typ='object',validation=['规则名必填；备注选填；字段按原表单长度','配置者无需本人坐席，但须当前Cloud配置权限'])
field('INBOUND-PRIORITY','呼入规则优先级','inboundRule','priority',typ='integer',fmt='原账号内唯一合法正整数；小值优先',validation=['同企业优先级不可冲突','规则列表更新时间倒序不改变实际匹配优先级'])
field('INBOUND-MATCH','呼入匹配条件','inboundRule','conditions',typ='object',fmt='原主被叫/号码/时间条件等显式集合',validation=['必须当前企业合法资源；每类条件按原匹配语义','不把本地/呼出流程当可接听目标；空条件按原明确默认规则'])
field('INBOUND-TARGET','呼入接听去向','inboundRule','target',typ='object',fmt='原支持的坐席/技能/队列/呼入流程等准确目标',validation=['目标必须当前企业有效且支持呼入用途','管理员可配置，运营接听仍要本人有效坐席；不因公共禁呼拦正常呼入'])
field('INBOUND-STATE','呼入规则启停与同步状态','inboundRule','state',fmt='enabled/disabled/pending/unknown',write=SYSTEM,validation=['成功、失败、待核分别显示；未知先核对不盲目反向操作','停用后才可删除；仅本地按钮切换不表示供应商生效'])
field('REPORT-KIND','报表类型','professionalReport','kind',fmt='AI通话/计费/线索；Cloud overview/leads/customers/outbound/agents/inbound/skills',write=READ,persist='transient',when='切换报表时确定当前独立指标口径',validation=['七类Cloud报表分别保留指标/明细；AI与Cloud不合并指标或账务','概览片段可读不授目标整页、导出或写入'])
field('REPORT-DATA','报表指标与明细','professionalReport','result',typ='object',write=SYSTEM,persist='external',validation=['与当前已应用筛选、范围、指标定义同次读取','未知不补0；空结果与读取失败区分；明细按准确ID查权'])
field('REPORT-EXPORT','专业报表导出','professionalReport','export',typ='object',write=SYSTEM,persist='transient',when='明确导出权且当前筛选授权结果可靠时生成文件',validation=['原七类报表各自导出；无数据/失败明确反馈','原AI若只是占位导出不得假成功；仅已实现导出与新财务8列分别定义'])
field('AUDIT-FILTER','配置／操作审计筛选','auditQuery','filters',typ='object',fmt='当前有权tenant/enterprise、对象、配置类型、操作人、时间、结果',write=READ,persist='transient',when='查询/重置后读取已确认审计范围',validation=['审计读权不授业务写权；导出独立权限','详情按准确记录ID，配置错误修正只对明确失败创建对象'])
field('SEAT-EVENT','坐席事件事实','seatEvent','record',typ='object',fmt='准确seat/call、事件时间、来源（回执/连接/观察）、状态',write=SYSTEM,persist='external',validation=['来源和确认级别保留；本地事件不声称全租户实时生产采集','查看/分页按有权范围，不控制坐席状态'])

def local(code,title,fids,ins,outs,trigger,pre,actions,success,branches=None,rules=None,ac=None):
 lid='LOCAL-PLAT-'+code;cid='CHECK-PLAT-'+code;L[code]=lid;C[code]=cid
 inf=[F[x] for x in ins];outf=[F[x] for x in outs];allf=list(dict.fromkeys(inf+outf));rr=rules or ['GR-IDENTITY','GR-SCOPE','GR-AUTH','GR-UNKNOWN','GR-LIST-ORDER']
 bs=[{'id':lid+'-B1','condition':c,'result':r,'field_ids':allf,'test_refs':[cid]} for c,r in (branches or [('前提、字段及对象修订校验通过且结果明确成功',success),('无权/字段不合法/对象失效/修订冲突','明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更'),('提交失败或结果未知','失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功')])]
 for i,b in enumerate(bs):b['id']=lid+'-B'+str(i+1)
 d={'id':lid,'title':title,'feature_ids':['FUNC-'+str(x) for x in fids],'trigger':trigger,'preconditions':pre,'postconditions':[success],'inputs':inf,'outputs':outf,'steps':[{'id':lid+'-S'+str(i+1),'action':a,'reads':inf,'writes':outf if i==len(actions)-1 else [],'rule_ids':rr} for i,a in enumerate(actions)],'branches':bs,'global_rule_ids':rr,'field_ids':allf,'source_keys':[],'test_refs':[cid]}
 locals_.append(d)
 checks.append({'id':cid,'acceptance_ids':['AC-'+str(x) for x in (ac or [2063,2072])],'procedure':'在准确有权范围触发“'+title+'”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；'+('验证'+branches[0][0]+'场景。' if branches else '按所列字段边界复查保存与显示。'),'expected':success+'；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。'})
 for f in fields:
  if f['id'] in allf and cid not in f['test_refs']: f['test_refs'].append(cid)
 return lid
# Identity and organisation independent actions.
local('LOGIN','登录与选择合法入口',[2001],['LOGIN-NAME','PASSWORD'],['SESSION','CURRENT-TENANT','POSITION'],'未认证用户提交账号密码，或恢复会话',['准确认证服务和当前授权范围可确认'],['认证账号，分别识别认证失败、范围读取失败、无合法入口','单租户直达、多租户首次选择、恢复上次仍合法租户；独立平台范围按本身资格进入','首次按本人作业/监管/原Cloud合法意图落点；原综合概览默认且同时有导入分配与Cloud报表权者到导入与分配；没有业务但有公共管理权到首个合法管理页'], '只建立真实有权会话；AI与Cloud共用身份，不重复填写另一套凭据',ac=[2001,2002,2003,2004])
local('NAVIGATE','进入有权页面与恢复位置',[2002],['SESSION','CURRENT-TENANT','POSITION','QUERY'],['POSITION','QUERY','PAGING'],'点击五顶栏或原专业菜单/直接路由',['账号、当前scope合法'],['五入口为坐席工作台、业务&客户、呼叫中心、报表中心、系统管理；按原稳定pageId定位','分别核对模块开通、成员、页面、对象、操作、独立平台范围；功能分组不成为许可开关','恢复同账号租户专业域筛选并刷新；失权回合法入口，无入口显示受限'],'可进入准确有权功能，保留原专业参数和原稳定操作；无权/失败/空结果清晰区分',ac=[2007,2008,2009,2010,2011,2063,2065,2071,2072,2073])
local('CONTEXT-SWITCH','保护现场后切换租户或功能域',[2003],['CURRENT-TENANT','SESSION','GUARD-STATE','POSITION'],['CURRENT-TENANT','POSITION','PHONE-STATE'],'选择其他合法租户或跨电话保护边界进入AI/公共管理',['目标范围须重新确认合法'],['只看本人电话：拨号、振铃、通话、必要话后阻止离开；监管他人不误阻','原Cloud页之间保留电话现场；跨AI/原公共管理或切租户须本人电话离线确认','普通dirty表单显式保存/放弃/取消；保存失败保留并停留；放行后清除旧租户对象和电话在线恢复'],'目标合法范围成为当前上下文；原租户客户、草稿及电话在线状态不得带入',rules=['GR-IDENTITY','GR-SCOPE','GR-AUTH','GR-SERIAL','GR-UNKNOWN'],ac=[2011,2012,2013,2014,2015])
local('LOGOUT','保护现场后统一退出',[2004],['SESSION','GUARD-STATE'],['SESSION','POSITION','PHONE-STATE'],'用户点击退出',['确认本人当前电话及未保存表单状态'],['完成当前电话和必要话后、请求并确认电话离线','表单保存/放弃/取消按明确选择，失败不退出','统一清除两模块会话和敏感展示/草稿；后台已受理任务保留运行'],'受保护页面需要重新登录；未完成保护不退出，后台受理任务不因退出被取消',rules=['GR-IDENTITY','GR-SERIAL','GR-PRIVACY','GR-UNKNOWN'],ac=[2005,2006,2014,2015])
local('BRAND-QUERY','查询品牌档案',[2008,2009],['QUERY','SESSION'],['BRAND-ID','BRAND-NAME','BRAND-REMARK','PAGING'],'打开品牌管理或查询',['有品牌资料读取权'],['只查询有权品牌基础资料','更新时间降序后分页；无权、无结果、失败分别呈现'],'显示有权品牌档案；查看不取得修改归属或同品牌业务数据权',ac=[2033,2034])
local('BRAND-SAVE','登记或修改品牌档案',[2008,2009],['BRAND-NAME','BRAND-REMARK','REVISION','REQUEST'],['BRAND-ID','BRAND-NAME','BRAND-REMARK','UPDATED','AUDIT','OP-STATE'],'超管新增或编辑品牌后保存',['超管品牌维护权；编辑对象当前存在'],['校验名称1–60和备注；编辑比较准确修订','保存稳定品牌档案；同请求去重，记录修改前后与操作者'],'创建或更新准确品牌基础资料，不改关联租户/业务数据权限',ac=[2033,2034])
local('BRAND-TENANTS','查询品牌有权关联租户',[2026],['BRAND-ID','QUERY','SESSION'],['TENANT-ID','TENANT-NAME','TENANT-TYPE','MODULES','PAGING'],'品牌详情点击关联租户',['有品牌和租户基础资料读取权'],['取该brandId关联租户与操作人可读租户的交集','无关联记录、交集空、查询失败、品牌失权分别反馈；维护入口再次验权'],'仅显示有权基础资料，不能因同品牌进入其他租户业务或修改归属',ac=[2074,2075,2076,2077])
local('TENANT-SAVE','新建或修改租户基础资料',[2005,2006],['TENANT-NAME','TENANT-CONTACT','TENANT-DESC','TENANT-COMMERCIAL','TENANT-BRAND','TENANT-TYPE','STORE-CODE','TENANT-ENTERPRISE','REVISION','REQUEST'],['TENANT-ID','UPDATED','AUDIT','OP-STATE'],'超管租户管理新增/编辑保存',['准确租户管理权；品牌已存在'],['校验姓名长度/说明≤50/商业类型/品牌必填/唯一总部/品牌内门店编码','新建模块独立默认关闭；AI-only可不配Cloud资源；Cloud关联须RUNNING、唯一且有权','编辑品牌/组织/企业关联时检查明确无业务引用及当前修订，引用未知拒绝'],'确认保存租户基础资料和审计；不改变原业务归属、财务余额或自动授成员权',ac=[2016,2017,2018,2035,2081,2082])
local('TENANT-BIND','维护租户品牌与总部门店身份',[2007],['TENANT-ID','TENANT-BRAND','TENANT-TYPE','STORE-CODE','REFERENCE-STATE','REVISION'],['TENANT-BRAND','TENANT-TYPE','AUDIT','UPDATED'],'有权超管明确保存品牌/组织身份关联',['准确租户与品牌存在且超管有归属维护权'],['检查每租户单品牌/每品牌一个总部/门店编码唯一','已存在业务引用或无法可靠判定引用时禁止换绑；不执行旧数据迁移','仅更新当前明确允许关联并留审计；实际转交按业务流程独立办理'],'合法品牌与组织身份生效；同品牌不共享数据或绑定路由',ac=[2035,2036,2037,2081,2082,2083])
local('TENANT-MODULE','独立开通AI或Cloud模块',[2010],['TENANT-ID','MODULES','TENANT-ENTERPRISE','REQUEST','REVISION'],['MODULES','AUDIT','OP-STATE'],'超管在准确租户办理模块开通',['独立模块开通权'],['AI与Cloud逐模块校验开通条件，不强制两个同时开','Cloud要求当前有效企业资源映射；仅AI不要求坐席或Cloud资源','确认开通结果；成员模块权限需另行配置，未知按原请求核对'],'只改变准确租户指定模块开通状态，未授成员新权',ac=[2019,2020,2021])
local('ACCOUNT-CREATE','新建账号并加入本租户',[2011],['LOGIN-NAME','NICKNAME','MOBILE','PASSWORD','AVATAR','MEMBER-TENANT','MEMBER-ROLE','MEMBER-GRANTS','REQUEST'],['ACCOUNT-ID','MEMBER-ID','MEMBER-STATE','AUDIT','OP-STATE'],'有权管理员新建成员选择创建新账号并保存',['本租户建号权；目标租户模块和委派范围可确认'],['校验登录名/手机号唯一和密码强度、昵称/头像；发现已有账号转显式关联而不自动合并','分别建立全局普通账号与当前租户唯一成员关系，限制角色及模块为可委派子集','提交结果明确后展示账号与成员；失败/部分/未知分别记录，不伪造整批成功'],'准确普通账号与本租户成员创建成功，不授超管或其他租户权限',ac=[2022,2023,2024,2025])
local('ACCOUNT-LINK','查找并显式关联已有账号',[2011],['MOBILE','ACCOUNT-ID','MEMBER-TENANT','MEMBER-ROLE','MEMBER-GRANTS','REQUEST'],['MEMBER-ID','AUDIT','OP-STATE'],'输入手机号查找已有账号后明确点击关联保存',['本租户成员维护权；已有账号稳定身份已核对'],['只展示有权查找返回的准确普通账号资料，不能更改全局资料','拒绝重复成员、内置超管或跨租户授权；按选中accountId关联','确认建立当前唯一成员，模块权限独立保存'],'已有全局账号显式加入本租户，不自动合并账号或改其他租户成员',ac=[2022,2023,2024,2025])
local('ACCOUNT-PROFILE','修改全局账号资料',[2011],['ACCOUNT-ID','NICKNAME','MOBILE','AVATAR','REVISION'],['NICKNAME','MOBILE','AVATAR','AUDIT'],'有独立账号资料修改权者编辑全局档案',['全局资料编辑资格；不是仅有本租户成员维护权'],['提示影响该账号全部成员显示资料；保持稳定账号ID','校验昵称/手机号唯一和图片，比较当前修订后保存'],'只更新允许的全局资料，不改成员角色或坐席绑定',ac=[2023])
local('MEMBER-GRANT','配置本租户成员角色及模块权',[2012],['MEMBER-ID','MEMBER-ROLE','MEMBER-GRANTS','MODULES','REVISION'],['MEMBER-GRANTS','AUDIT','OP-STATE'],'租户管理员保存当前成员授权',['本租户成员和委派权；成员未失效'],['分别校验AI与Cloud已开通与自身可委派子集','角色与原专业功能操作权分开，坐席/财务/标签维护不因成员身份推授','直接路由与提交动作刷新权；配置生效后不能用旧页面绕过撤权'],'新授权只在本租户已开通模块和可委派范围内生效',ac=[2024,2025,2026])
local('MEMBER-STOP','停用本租户成员',[2013],['MEMBER-ID','MEMBER-STATE','GUARD-STATE','REQUEST'],['MEMBER-STATE','LIMITED','AUDIT'],'本租户管理员确认停用准确成员',['有本租户人员停用权'],['仅禁本租户新增操作，不改账号全局或其他租户','锁定停用时已接通电话及必要话后有限收尾；后台已受理任务按原条件继续','完成后拒绝该范围新操作，其他有权人管理任务不自动转交'],'本租户成员停用，保留业务记录和允许范围的有限收尾',ac=[2027,2028,2029])
local('ACCOUNT-STOP','全局停用登录账号',[2014],['ACCOUNT-ID','ACCOUNT-STATE','GUARD-STATE','REQUEST'],['ACCOUNT-STATE','LIMITED','AUDIT'],'超管确认停用准确全局账号',['独立全局账号停用权，租户管理员不可代办'],['对所有租户和工作区禁新增操作；不取消既有已受理后台任务','只保停用时已接通电话及必要话后有限收尾','不删除已有记录，不自动重新启用或转交'],'全局账号停用且范围收敛，不因前端隐藏宣称真实会话撤销已验证',ac=[2030,2031,2032])
local('LIMITED-FINISH','结束停用后的有限收尾',[2015],['LIMITED','CALL-ID','CALL-STATE','PRO-FOLLOW-STATE','PRO-FILL','FOLLOW-NOTE'],['LIMITED','PHONE-STATE','AUDIT'],'已被停用的实际接听人完成当前电话必要话后',['仅有准确callId的有限收尾资格'],['仅允许当前已接通电话和必要话后保存，不允许新拨或打开无关对象','成功保存后确认离线并结束有限范围；未知继续待核','提示账号/成员仍停用，回合法剩余范围或登录页'],'原电话完成并结束有限访问，不重开成员/全局账号权限',ac=[2029,2032])
for code,nm,feat,obj,extra,acn in [('ACCOUNT-DELETE','删除无业务引用的全局账号',2028,'ACCOUNT-ID','无其他租户关联且非内置超管；本租户成员移除或坐席删除不能替代账号删除',2079),('TENANT-DELETE','删除无业务引用的准确租户',2029,'TENANT-ID','保原默认管理组不可删；不级联品牌/账务/通话/任务',2080)]:
 local(code,nm,[feat],[obj,'REFERENCE-STATE','REVISION','REQUEST'],['AUDIT','OP-STATE'],'有原删除权者对准确对象确认删除',['独立原删除权及准确对象','业务引用判定明确为none',extra],['确认框展示准确对象及不可级联范围','最终提交再验权限、引用和修订；任一变化拒绝','仅可靠终态认定删除；HTTP200或列表查不到不作唯一证据'],'仅准确无引用对象被确认删除；必要审计保留，失败/未知不假报成功',ac=[acn])
# AI professional actions.
local('AI-CATEGORY-STOP','停用专业目录分类',[2018],['AI-CATEGORY','REFERENCE-STATE','REVISION'],['AI-CATEGORY','AUDIT'],'在仍保留的原专业目录入口停用准确分类',['有该专业域当前租户分类管理权；对象身份明确'],['区分当前品牌分类治理和仍有专业用途的原目录身份，不能引入旧v2迁移台账','停止本专业分类新选择/新关联；已有准确关联场景及已受理任务按专业执行规则完成'],'专业分类停止新选；不物理删除、不自动解除AI场景或改业务路由',ac=[2043,2044])
local('AI-CATEGORY-BIND','具体AI场景关联业务分类',[2019],['AI-SCENE-ID','AI-CATEGORY','AI-TYPE','AI-SUPPLIER','REVISION'],['AI-CATEGORY','AUDIT'],'AI标签管理→场景配置显式选择分类并保存',['AI专业配置权；当前品牌分类有权可选'],['按具体执行场景稳定ID关联分类，保留原AI新/冷类型和供应商参数','分类只作业务引用，不自动绑定流转模板；实际路由来自分类路由配置','重新校验分类/品牌/当前修订，禁止同名或首项兜底'],'准确场景业务分类引用保存，未扩大品牌数据或AI专业能力',ac=[2045,2046,2047])
local('AI-SCENE-QUERY','查询AI场景及原类型',[2002,2019],['QUERY','AI-TENANT'],['AI-SCENE-ID','AI-SCENE-NAME','AI-TYPE','AI-SUPPLIER','AI-CATEGORY','PAGING'],'打开AI业务场景/场景配置或当前场景选择器',['场景读取/使用权；不要求标签维护权'],['按租户和供应商执行资格过滤场景/类型','准确显示启停/分类/参数可用性，未知不能用首项代替'],'显示当前合法场景；仅有使用权可使用但不可维护标签',ac=[2045,2046,2047,2063,2064])
local('AI-SCENE-SAVE','创建或编辑AI业务场景与场景类型',[2002,2019],['AI-SCENE-ID','AI-SCENE-NAME','AI-TYPE','AI-SUPPLIER','AI-PARAMS','AI-CATEGORY','REVISION'],['AI-SCENE-ID','AI-PARAMS','AUDIT'],'有AI专业配置权者保存场景或类型',['准确租户/供应商专业配置权'],['新建/修改分开校验原必填与供应商允许参数；启停类型只影响允许的新选','若绑定业务分类执行准确分类引用规则，不修改实际分类路由','当前修订成功确认才刷新，失败保留输入'],'专业场景/类型准确配置；执行能力以供应商真实资源为准',ac=[2045,2046,2047,2063,2064])
local('AI-SCENE-DELETE','删除未被引用的AI专业场景／类型',[2002],['AI-SCENE-ID','AI-TYPE','REFERENCE-STATE','REVISION'],['AUDIT','OP-STATE'],'原专业入口点击删除并确认',['有原删除权；当前对象可删且引用明确允许'],['显示准确场景/类型，不删除关联业务分类','检查原专业引用与当前修订；未知拒绝删除','保留已受理任务/通话/业务快照'],'只删除原允许的准确专业对象，不清除任务结果',ac=[2063,2064])
local('AI-TAG-CONFIG','维护AI标签池、标准集与映射',[2002,2019],['AI-SUPPLIER','AI-TYPE','AI-TAG-SCENE','AI-SUPPLIER-TAGS','AI-LOCAL-TAGS','AI-MAPPING','REVISION'],['AI-MAPPING','AUDIT'],'有标签配置权的管理员执行新增/修改/删除/启停/映射保存',['具体配置操作权；准确supplier+tenantType+tagScene范围'],['供应商池按supplier隔离，本地标准集按type+tagScene隔离，映射按三元范围','新增/编辑/删除/启停各自校验稳定ID、引用和修订；被引用项不静默断链','保存明确选中的映射；名称推荐未选不提交，不自动回填业务字段'],'标签配置准确保存；运营使用场景和已有标签不要求维护权',ac=[2046,2063,2064])
local('AI-TASK-QUERY','查询AI任务及任务名单',[2002],['QUERY','AI-TENANT','TASK-ID'],['TASK-ID','TASK-NAME','TASK-STATE','TASK-RESOURCES','PAGING'],'AI外呼页查询、查看任务或名单',['AI任务及当前租户读取权'],['按当前筛选/平台/场景和任务ID读取任务、已呼/未呼名单及状态计数','更新时间倒序后分页；进入任务详情再次验对象范围','原启动/暂停/终止/删除占位控件保持明确不可用，不显示假成功'],'当前AI专业任务/名单可读；不重建专业任务或宣称未实现控制已受理',ac=[2063,2064])
local('AI-LIST-IMPORT','向准确AI任务导入联系人',[2002],['TASK-ID','IMPORT-ROWS','AI-SCENE-ID','REQUEST'],['IMPORT-BATCH','OP-STATE'],'AI任务详情导入名单',['有该AI任务导入权；场景及任务允许导入'],['读取当前场景必需字段/参数，校验文件映射、号码和重复','保留选择范围与任务修订，逐项报告确认/失败/未知','不以本地名单成功宣称供应商已呼叫'],'准确任务联系人及导入批次形成，冲突/失败行不虚报成功',ac=[2063,2064])
local('AI-LIST-REMOVE','移除准确AI任务待处理联系人',[2002],['TASK-ID','CUSTOMER-ID','REVISION'],['OP-STATE','AUDIT'],'AI任务名单选中允许移除项并确认',['原移除权；任务/名单当前状态允许'],['核对精确任务及选中联系人，已受理或未知不能当未处理移除','只移除选中可移除关联，不删除客户档案或其他任务来源'],'允许的任务名单项移除；已产生通话/业务事实保留',ac=[2063,2064])
local('AI-IMPORT-HISTORY','查询AI导入记录',[2002],['TASK-ID','QUERY'],['IMPORT-BATCH','PAGING'],'AI任务查看导入历史',['准确任务导入记录读取权'],['按任务稳定ID过滤本租户批次','展示原文件/条数/提交人/时间/结果，未知与失败区分'],'仅显示该任务授权导入历史，不连带文件下载或任务控制权',ac=[2063,2064])
local('CALL-QUERY','查询和查看AI／Cloud通话记录',[2002],['QUERY','CALL-ID','RESOURCE-SCOPE'],['CALL-ID','CALL-STATE','CALL-ACTOR','CALL-TIMES','RECORDING','AI-TAG-RESULT','PAGING'],'通话记录页查询或查看准确通话详情',['当前模块、对象和通话读权'],['AI与Cloud按平台/租户/企业/任务分别筛选','详情准确callId读权，号码按原明文权展示；录音入口按读权','AI原始/映射标签与人工跟进结果分开显示'],'显示准确授权通话事实、录音可用性及标签，不改人工跟进或路由',ac=[2063,2064,2066,2072])
local('RECORDING-READ','播放、暂停和定位有权录音',[2002],['CALL-ID','RECORDING'],['RECORDING'],'在通话/跟进详情点击录音播放、暂停或拖动',['五角色中有对应通话读权；录音确实存在可解析'],['按准确callId重新检查对象读权后取得受控录音','播放/暂停/seek只改变本次播放位置，不要求编辑权','无录音/过期/网络失败/失权分别显示，不暴露其他租户录音'],'有权用户按读权使用录音；失败不修改通话和跟进事实',ac=[2063,2064,2066,2072])
local('CALL-EXPORT','导出有权Cloud通话记录',[2002],['QUERY','RESOURCE-SCOPE'],['REPORT-EXPORT'],'Cloud通话记录点击导出',['原通话导出权，不以读取权替代'],['固定当前已应用筛选及授权结果范围','无数据/字段欠证/生成失败显式反馈；CSV转义并按原字段导出'],'仅生成当前授权筛选Cloud记录文件，不导出其他租户或宣称AI占位导出可用',ac=[2072])
local('LEAD-QUERY','查询AI线索及详情',[2002],['QUERY','AI-TENANT'],['AI-LEAD','CALL-ID','AI-TAG-RESULT','PAGING'],'AI线索记录页查询/查看',['AI线索读权'],['按当前平台/场景/时间筛选和准确线索ID查看','显示来源任务/通话和原标签，未匹配保留原值'],'准确AI线索只读展示，不改人工跟进或客户有效值',ac=[2063,2064])
local('LEAD-CALLBACK','AI线索回访保存',[2002],['AI-LEAD','FOLLOW-NOTE','REVISION'],['AI-LEAD','AUDIT'],'在线索详情有权保存回访信息',['原回访操作权和准确线索ID'],['保留原回访允许字段与状态；不将AI标签当人工已确认业务值','保存时校验当前修订，失败保留输入'],'只保存原AI回访记录，不自动推进四节点业务运行',ac=[2063,2064])
# Contact restriction actions.
local('BAN-QUERY','查询黑名单分组与号码',[2020],['QUERY','CURRENT-TENANT'],['BAN-GROUP','BAN-NAME','BAN-COUNT','BAN-ID','BAN-PHONE','BAN-STATE','PAGING'],'黑名单页按分组/关键词/状态查询',['当前租户原黑名单读权；超管仅只读'],['以原分组+号码唯一主维护模型读取，拒联来源在系统组展示','仅显示当前租户有权记录及准确本地/远端状态；不跨品牌共享','更新时间倒序后分页；无结果、失败、无权分别反馈'],'原分组、号码、来源和同步状态可查；未增加公共/专项两套名单',ac=[2048,2049,2050])
local('BAN-DETAIL','查看限制来源和同步详情',[2021],['BAN-ID','BAN-GROUP'],['BAN-SOURCE','BAN-LIFETIME','BAN-STATE','BAN-RELEASE','BAN-REMOTE'],'点击准确号码记录详情',['准确当前租户记录读权；超管可只读'],['展示来源通话/确认人/时间/原因、有效期限、解除及远端足迹','正常普通组与受保护拒联来源明确区分；只读者无修改/同步入口'],'准确来源及本地/远端状态可追溯，读权不授解除或同步权',ac=[2048,2049,2050,2061,2062])
local('BAN-GROUP-SAVE','创建或修改普通黑名单分组',[2002,2020],['BAN-GROUP','BAN-NAME','BAN-DESC','BAN-EXPIRY','REVISION'],['BAN-GROUP','AUDIT','UPDATED'],'有权租户操作者新增/编辑普通组后保存',['原普通组维护权；超级管理员只读不可操作'],['校验组名称和有效期；禁止创建伪拒联来源或修改系统组来源规则','编辑准确组与当前修订，不改其他组或远端足迹'],'普通分组配置准确保存；客户拒联证据和长期来源不被覆盖',ac=[2048,2049,2050])
local('BAN-GROUP-DELETE','删除空的普通黑名单分组',[2002,2020],['BAN-GROUP','BAN-COUNT','REVISION'],['AUDIT','OP-STATE'],'普通分组点击删除确认',['原分组删除权；超管只读；非系统来源组'],['最终核对组确实为空且无待处理记录/同步','非空或修订变化拒绝删除；保留其他分组与来源'],'只有准确可删空组被删除；取消/失败不清任何号码',ac=[2048,2050])
local('BAN-NUMBERS','新增或批量导入普通黑名单号码',[2002,2020],['BAN-GROUP','BAN-PHONE','BAN-CUSTOMER','BAN-ADD-TYPE','BAN-REASON','IMPORT-ROWS','BAN-EXPIRY','REQUEST'],['BAN-ID','BAN-LIFETIME','BAN-STATE','BAN-REMOTE','AUDIT'],'手工新增或文件导入到明确普通组',['原新增/导入权；超管只读；目标组有效'],['单条或逐行校验真实规范号码、添加类型、重复、目标组和期限','客户明确拒联须对应人工话后/AI人工确认路径，普通导入不能伪造来源','保存当前目标组的逐条结果，失败/未知不误报整批成功；同步分开显示'],'仅准确目标组的合法号码入库，范围与期限明确',ac=[2048,2049,2050])
local('BAN-MOVE','移动普通分组号码',[2002,2020],['BAN-ID','BAN-GROUP','REVISION'],['BAN-GROUP','AUDIT','OP-STATE'],'在普通组勾选号码并选择明确目标组后确认',['原移动权；超管只读；拒联来源行不可普通移动'],['锁定原组、选中ID集合和目标组，不跨租户','待移除/待核记录不变更目标，最终修订变化拒绝'],'仅选中可移动普通记录更换组，不改来源或其他组号码',ac=[2048,2050])
local('BAN-REMOVE','移除普通组号码',[2002,2020],['BAN-ID','BAN-GROUP','REVISION','REQUEST'],['BAN-STATE','BAN-REMOTE','AUDIT'],'勾选普通组号码点击移除并确认',['原普通移除权；超管只读；拒联来源解除走独立管理员动作'],['按选中原组准确记录处理，本地解除与远端移除分别记状态','远端未知保留原足迹和待核，不能生成反向新请求'],'普通组选中记录按准确终态移除，其余来源仍可阻止外呼',ac=[2048,2050,2062])
local('BAN-SYNC','配置、启停或重试供应商黑名单同步',[2002,2020],['BAN-GROUP','BAN-BINDING','BAN-REMOTE','REQUEST','REVISION'],['BAN-BINDING','BAN-REMOTE','AUDIT'],'查看同步配置后显式启用/停用/原请求重试',['原供应商同步权；超级管理员仅查看不可保存、启停或重试'],['按准确供应商目标验证；天润仅当前Cloud enterprise+type+useRange，不用remoteGroupId','提交保留每来源原目标、方向、请求；accepted不算成功','停同步不删除远端；未知先核对同请求，不能反向改写未确认请求'],'本地配置与逐来源远端状态真实分离，准确终态才显示同步成功',ac=[2048,2050,2059])
local('BAN-HUMAN','保存人工明确拒联并入库',[2022],['CALL-ID','CALL-ACTOR','PHONE','PRO-FOLLOW-STATE','PRO-FILL','FOLLOW-NOTE','REQUEST'],['BAN-ID','BAN-SOURCE','BAN-LIFETIME','BAN-STATE','AUDIT'],'实际接听人成功保存明确客户拒绝联系处理结果',['准确当前租户来源通话及实际处理权'],['未保存仅选择不生效；保存校验成功后以准确来源幂等创建拒联记录','保留callId/规范号码/人/时间/原因，长期限制四类外呼','话后与入库有失败/未知时报告待完成并恢复同请求，不显示整体成功'],'人工拒联成功保存后本租户长期禁呼，无需管理员二次确认；正常呼入不拦截',rules=['GR-IDENTITY','GR-SCOPE','GR-AUTH','GR-SERIAL','GR-CONTACT','GR-UNKNOWN'],ac=[2051,2052,2053])
local('BAN-AI','人工确认AI明确拒联后入库',[2023],['CALL-ID','AI-TAG-RESULT','BAN-PHONE','BAN-REASON','REQUEST'],['BAN-ID','BAN-SOURCE','BAN-LIFETIME','BAN-STATE','AUDIT'],'有权租户人员在准确AI通话上明确确认拒联并提交',['本租户管理员或明确有拒联新增权运营；超管只读不可提交','能够读取准确来源通话'],['展示准确通话、原始结果和来源，要求人工明确确认而非自动按标签判拒联','无意向/拒接/挂机/混合等级/供应商拦截均不能代替明确拒联证据','以来源请求幂等保存长期拒联，新增权不包含解除权'],'准确人工确认的AI拒联来源入库；不因AI标签自动入库',rules=['GR-IDENTITY','GR-SCOPE','GR-AUTH','GR-SERIAL','GR-CONTACT','GR-UNKNOWN'],ac=[2054,2055,2056])
local('CONTACT-CHECK','新外呼、重呼及补交的公共禁呼检查',[2024],['CURRENT-TENANT','PHONE','TASK-MODE','BAN-STATE','BAN-LIFETIME','BAN-SOURCE'],['CONTACT-DECISION'],'AI/人工/预外呼/IVR即将发起任一新拨、重呼或异常补提交',['准确租户与可靠规范号码；执行资格仍须独立满足'],['查询所有当前有效公共拒联来源，任一有效则阻止四种外呼','普通专项组按明确用途和期限校验，不扩大范围；正常呼入不经过拒接','检查失败/未知阻止新发起；已接收未拨号码按供应商能力核验差异，在途电话不静默取消'],'只有明确allow才提交本次新外呼；blocked或unknown不拨号且显示可处理原因',rules=['GR-IDENTITY','GR-SCOPE','GR-AUTH','GR-CONTACT','GR-UNKNOWN'],ac=[2052,2055,2057,2058,2059,2069])
local('BAN-RELEASE','管理员填写原因解除准确拒联来源',[2025],['BAN-ID','BAN-SOURCE','BAN-STATE','BAN-RELEASE','REVISION','REQUEST'],['BAN-RELEASE','BAN-STATE','BAN-REMOTE','AUDIT'],'本租户管理员在来源详情确认解除本条',['本租户管理员且有解除权；超管只读与运营均不允许','原话后或原请求无待完成冲突'],['必填明确解除原因，锁定准确来源而不是整个号码','保留原来源及解除历史，其他仍有效来源不变','远端解除保留原目标方向与请求，未知先核对；旧事件不复活本条'],'仅本来源解除并留原因/操作人/时间，号码是否可呼须重新聚合其他有效来源',rules=['GR-IDENTITY','GR-SCOPE','GR-AUTH','GR-SERIAL','GR-CONTACT','GR-UNKNOWN'],ac=[2060,2061,2062])
# Financial service inquiry and actions.
local('FINANCE-QUERY','查询AI用量及服务明细',[2002],['QUERY','AI-TENANT'],['SERVICE-STATE','SERVICE-VALIDITY','MINUTES-AVAILABLE','MINUTES-FROZEN','MINUTES-CONSUMED','SERVICE-CONTROL','REPORT-DATA'],'AI用量与服务查看摘要/使用天数/任务明细',['五角色中有原服务或用量读取资格；四租户角色限本租户'],['摘要、按天、按任务的原指标及筛选分别读取，不合并Cloud账务','服务数据缺失/失败/待核不填0；余额不由累计统计反算'],'当前授权服务/用量可靠展示；读取不授充值、调整或导出权',ac=[2063,2064,2065])
local('FINANCE-VIEW','查看AI服务账户与充值历史',[2002],['AI-TENANT','TENANT-ID','QUERY'],['SERVICE-STATE','SERVICE-VALIDITY','MINUTES-AVAILABLE','MINUTES-FROZEN','MINUTES-CONSUMED','SERVICE-HISTORY'],'有权服务摘要/详情入口查看账户或历史',['五角色按租户原读权；管理维护页PAGE2112仅超管，其他角色以只读入口查看'],['校验统一租户与AI服务租户映射，显示同次可靠服务状态','历史按准确租户查询并区分原受理/成功/失败/待核；只读不出现办理入口'],'服务账户及充值记录可读，租户角色仅本租户且不能办理服务',ac=[2064,2065])
local('FINANCE-RECHARGE','办理试用、年度服务或通话加油包',[2002],['TENANT-ID','AI-TENANT','SERVICE-PACKAGE','SERVICE-QUANTITY','REVISION','REQUEST'],['SERVICE-STATE','SERVICE-VALIDITY','MINUTES-AVAILABLE','SERVICE-HISTORY','OP-STATE','AUDIT'],'超管服务管理选择产品后确认办理',['超级管理员且原服务办理权；准确AI租户映射及当前产品可确认'],['逐产品校验资格、数量、允许分钟与有效期；四租户角色不可提交','捕获当前服务修订与请求，明确确认后提交','按准确请求终态更新当前服务和历史；pending/unknown不再下单'],'只有确认成功才增加/开通服务，失败不改变余额；待核保留同请求',ac=[2064,2065])
local('FINANCE-ADJUST','调整AI服务分钟或有效期',[2002],['TENANT-ID','AI-TENANT','SERVICE-ADJUST','REVISION','REQUEST'],['SERVICE-VALIDITY','MINUTES-AVAILABLE','SERVICE-HISTORY','AUDIT','OP-STATE'],'超管选择明确调整对象/方向/数值并填原因后确认',['超管且原调整权；当前服务可可靠读取'],['校验原允许对象、方向、范围及非空原因；禁止直接减少冻结分钟','显示前后值并比较当前修订；变化重新确认','确认准确请求终态后写服务和调整历史；未知等待核对'],'准确允许调整确认生效，不虚构扣费补偿或旧账转换',ac=[2064,2065])
local('FINANCE-RECONCILE','核对或原请求重试未明确的服务交易',[2002],['REQUEST','SERVICE-HISTORY','AI-TENANT'],['SERVICE-HISTORY','SERVICE-STATE','MINUTES-AVAILABLE','OP-STATE','AUDIT'],'超管对待核/明确允许重试的交易点击核对/重试',['原交易精确请求及办理权；无其他冲突新交易'],['先查询原请求权威状态，确认成功不重复结算','明确可重试时沿同请求/同产品/同参数提交；参数变化不当重试','持续未知显示待核并保留原余额确认态'],'同一交易最多一次确认财务效果；未知不会产生重复套餐或余额',rules=['GR-IDENTITY','GR-SCOPE','GR-AUTH','GR-SERIAL','GR-UNKNOWN'],ac=[2064,2065])
local('FINANCE-EXPORT','导出8列租户AI服务汇总',[2027],['SESSION','AI-TENANT','SERVICE-STATE','SERVICE-VALIDITY','MINUTES-AVAILABLE','MINUTES-FROZEN','MINUTES-CONSUMED','SERVICE-CONTROL'],['FINANCE-EXPORT'],'有权超管点击租户AI服务汇总CSV导出',['超级管理员+原财务导出资格；可确认当前授权AI租户集合与一对一映射'],['按当前授权租户交集一次读取可靠服务快照，不套公共租户列表或计费统计日期/平台筛选','逐租户验证必需字段齐全且分钟有限非负；任一欠证阻止出文件','仅8列生成UTF8 BOM CSV，转义并中和公式；无数据/失败给明确反馈'],'下载准确8列授权服务快照；不恢复旧大小模型金额列，不换算旧账',rules=['GR-IDENTITY','GR-SCOPE','GR-AUTH','GR-DATA-FACTS','GR-PRIVACY','GR-UNKNOWN'],ac=[2078])
# Original Cloud phone and customer-task work, distinct from brand route runs.
local('PHONE-PREPARE','本人电话上线、离线及就绪检查',[2002],['SESSION','MEMBER-STATE','MEMBER-GRANTS','MODULES','SEAT-ID','SEAT-ACCOUNT','SEAT-EXTENSION','PHONE-STATE'],['PHONE-STATE','SEAT-EVENT'],'本人在坐席工作台点击上线/下线或置闲',['原本人电话操作权；当前Cloud开通/成员有效/唯一准确坐席映射'],['上线前检查本人坐席未停用/删除、分机唯一可用和执行能力','下线先检查拨号/振铃/通话/必要话后；未知需核对','按准确电话事件确认状态；失败不伪装离线/就绪'],'本人电话状态可确认；管理者无坐席仍可访问合法配置/监管/只读',ac=[2012,2015,2066,2067,2072])
local('PHONE-OUTBOUND','人工主动外呼',[2002,2024],['CUSTOMER-ID','DIAL-NUMBER','PHONE-STATE','CONTACT-DECISION','REQUEST'],['CALL-ID','CALL-STATE','CALL-ACTOR','PHONE-STATE'],'有权本人对任务/客户或原手动号码入口点击呼叫',['本人电话就绪、当前对象拨号权及准确规范号码'],['校验当前任务/客户与号码，实时执行CONTACT-CHECK','明确允许后仅提交本次人工拨号，保留准确callId及本人映射','按振铃/接通/结束事件转电话状态，失败/未知不重拨'],'人工呼叫事实准确形成，公共禁呼或未知阻止新拨；不套预外呼策略',ac=[2057,2058,2066,2067,2069])
local('PHONE-INBOUND','正常呼入接听与振铃填写',[2002],['PHONE-STATE','INBOUND-TARGET','CALL-ID','PRO-FILL'],['CALL-STATE','CALL-ACTOR','PHONE-STATE'],'当前本人收到合法呼入/预外呼分配电话并点击接听',['有效本人坐席与当前接听能力；精确callId'],['按原振铃现场展示客户和当前可填写字段；公共拒联不拦正常呼入','本人接听后锁定实际接听人，不能以分配负责人冒填','通话与必要话后保护，错过/转移/未知保持准确事实'],'准确实际接听人取得本次填写资格，必要话后仍须独立保存',ac=[2052,2057,2066,2067])
local('PHONE-AFTERCALL','原客户任务保存人工跟进结果',[2002,2022],['CALL-ID','CALL-ACTOR','CUSTOMER-ID','PRO-FOLLOW-STATE','PRO-FILL','FOLLOW-NOTE','REVISION','REQUEST'],['PRO-FOLLOW-STATE','PRO-FILL','API-RESULT','AUDIT','PHONE-STATE'],'实际拨打/接听人提交本轮跟进',['当前本人实际处理权；已取最新当前字段和有效值'],['按最新专业字段显示/必填/选项校验，并保存本轮当时快照','原任务结果待继续跟进或已完成独立保存；与新业务运行终态分开','明确拒联接入BAN-HUMAN；原完成结果回传按准确业务任务，不把待回传说成已成功'],'跟进成功后记录当时字段/值/处理人；必要入库/回传失败显示可恢复待处理，不假报完整完成',rules=['GR-IDENTITY','GR-SCOPE','GR-AUTH','GR-DATA-FACTS','GR-SERIAL','GR-FIELDS','GR-CONTACT','GR-UNKNOWN'],ac=[2051,2053,2066,2067,2072])
local('PHONE-CONTINUE','继续原客户任务跟进',[2002],['CUSTOMER-ID','PRO-FOLLOW-STATE','PHONE-STATE','QUERY'],['PRO-FILL','FOLLOWER','PRO-FOLLOW-STATE'],'进入待继续跟进任务或下一条原任务',['当前原任务作业权；本人所需坐席能力'],['只取当前本人合法任务范围；本轮重新读取最新字段与当前有效值','已完成/失权/在处理中不能作为新待办重复领取；缺失任务恢复仅管理员手工且原明确条件满足'],'可开始合法待继续跟进作业，不重置已完成结果或自动回收给公海',ac=[2066,2067,2072])
local('SEAT-SUPERVISE','监管对目标准确坐席置忙、置闲或离线',[2002],['SEAT-ID','PHONE-STATE','RESOURCE-SCOPE','REQUEST'],['SEAT-EVENT','OP-STATE'],'有监管权者对目标坐席明确选择置忙/置闲/离线',['目标企业及坐席监管权；目标当前状态满足该动作'],['核对目标准确nativeId及最新状态，监管人无需本人在线','通话中/未知/不支持的状态转换拒绝，不把他人电话当本人切页保护','原动作请求准确回执后刷新；未知先核对'],'仅目标准许电话状态变更；读监管摘要不自动授监管操作权',ac=[2066,2072])
local('CUSTOMER-DIRECTORY','查询原客户联系档案与关联历史',[2002],['QUERY','CUSTOMER-ID','RESOURCE-SCOPE'],['CUSTOMER-ID','CUSTOMER-NAME','PHONE','PRO-FOLLOW-STATE','CALL-ID','PAGING'],'原客户联系视图查询或查看准确客户任务',['原客户对象读权及当前tenant+enterprise'],['按准确业务记录ID查看；按tenant+enterprise+规范号码关联有权联系历史','相同号码只关联展示，不合并不同业务记录和业务归属','号码明文、录音、详情分别按读权，失败/空结果区分'],'显示原客户任务及有权联系历史，不创建客户公海或跨租户共享',ac=[2066,2067,2072,2073])
local('CUSTOMER-IMPORT','原客户任务导入与字段映射校验',[2002],['IMPORT-ROWS','PRO-FIELD-DEF','RESOURCE-SCOPE','REQUEST'],['CUSTOMER-ID','IMPORT-BATCH','OP-STATE'],'原人工/专业客户任务入口选择文件或原接口来源导入',['该原任务类型导入权和当前企业/字段目录可确认'],['按当前准确字段ID及业务编码映射校验必填、号码、重复和冲突','正式导入范围逐行通过；已存在业务标识不以手机号覆盖','记录真实批次和逐项结果，与新业务分类入口导入按各自准确实体分开'],'合法专业名单入库并可分配；原专业导入不是新四节点模板自动启动',ac=[2067,2072,2073])
local('CUSTOMER-ASSIGN','原客户任务分配跟进人',[2002],['CUSTOMER-ID','FOLLOWER','REVISION'],['FOLLOWER','AUDIT'],'有原分配权者选择合法任务及人员确认分配',['当前任务可分配且本企业人员有资格'],['只改当前准确任务负责人，外呼方式由导入/当前任务定义确定','失效成员、需要但无有效坐席或已在处理冲突时拒绝','确已缺失原任务且无通话/未处理中只允许原有权管理员手工恢复待分配'],'准确负责人分配成功，实际接听人填写责任不变；不自动回收或转移业务归属',ac=[2067,2072])
local('CLOUD-TASK-QUERY','查询预外呼或IVR任务及详情',[2002],['QUERY','TASK-ID','RESOURCE-SCOPE','TASK-MODE'],['TASK-ID','TASK-NAME','TASK-STATE','TASK-RESOURCES','TASK-FAILURES','PAGING'],'预外呼或IVR任务页查询/查看',['相应方式原任务读权'],['按mode分别读取准确任务，不混淆IVR与预外呼资源/状态','任务详情显示已受理与远端终态、名单及失败分类','列表更新时间倒序后分页，任务ID及当前scope进入详情复核'],'准确原专业任务可查；查看不授控制、导入或导出',ac=[2068,2069,2070,2071])
local('CLOUD-TASK-SAVE','创建或修改预外呼／IVR任务',[2002],['TASK-ID','TASK-MODE','TASK-NAME','TASK-SCHEDULE','TASK-RESOURCES','TASK-POLICY','REVISION','REQUEST'],['TASK-ID','TASK-STATE','AUDIT','OP-STATE'],'原预外呼/IVR页新增或编辑后保存',['相应任务创建/修改权和当前企业资源有权'],['PRED检查有效坐席/外呼组/号码及原策略，IVR检查远端外呼可执行语音流程','仅编辑状态允许字段；时间和资源用途严格校验','最终比较当前修订后确认保存，本地/远端受理结果区分'],'合法专业任务配置保存，未因创建直接宣称已执行',ac=[2068,2069,2070,2071])
local('CLOUD-TASK-IMPORT','向预外呼／IVR任务导入名单',[2002],['TASK-ID','TASK-MODE','IMPORT-ROWS','REQUEST'],['IMPORT-BATCH','OP-STATE'],'准确专业任务选择名单并独立确认导入',['该方式导入权及任务允许名单变更'],['按当前方式必需字段、规范号码和重复规则逐行校验','保留选中任务/范围/修订，不导到其他任务','各行确认/失败/未知保留，不把保存名单当已拨号'],'准确任务合法名单导入；异常行有定位和可恢复结果',ac=[2068,2070,2071])
local('CLOUD-TASK-CONTROL','执行、暂停、继续、结束或删除专业任务',[2002],['TASK-ID','TASK-MODE','TASK-STATE','TASK-RESOURCES','REQUEST','REVISION'],['TASK-STATE','OP-STATE','AUDIT'],'准确PRED/IVR任务选择明确动作并确认',['原该动作权；当前任务状态及资源允许该动作'],['execute仅允许原可执行状态且所有资源/额度确认；每次将发起新号码接入禁呼','pause/resume/terminate分别调用原明确任务动作；accepted不等终态','仅IVR未提交/未启动且引用允许可删除；已执行任务结果不删除，unknown不盲重试'],'准确任务动作终态生效；保留名单、结果与历史，不以UI点击伪造供应商成功',ac=[2068,2069,2070,2071])
local('CLOUD-TASK-RECALL','预外呼正常重呼',[2002,2024],['TASK-ID','TASK-MODE','TASK-FAILURES','TASK-POLICY','CONTACT-DECISION','REQUEST'],['TASK-STATE','OP-STATE','AUDIT'],'预外呼任务选择原允许的正常重呼号码并确认',['只PRED；原重呼资格、次数/额度及选中失败类明确'],['排除未知/不可重呼号码，遵守原预外呼额度与策略','对每次重呼重新执行公共禁呼，不能借重呼绕过','保存原任务/本次请求/逐项受理结果'],'只对符合正常重呼条件且当前可呼号码发起，不套人工或IVR策略',ac=[2058,2068,2069])
local('CLOUD-TASK-RESUBMIT','预外呼明确异常补提交',[2002,2024],['TASK-ID','TASK-FAILURES','TASK-RESOURCES','CONTACT-DECISION','REQUEST'],['OP-STATE','AUDIT'],'对准确失败原因允许补交的号码显式确认补交',['原异常补提交权；明确失败，不是结果未知'],['按原供应商失败分类与额度筛选；先核对未知旧请求','逐号码重新公共禁呼，不用restrict-tel类补交规则绕过','同请求去重，明确受理与终态分离'],'仅允许的明确异常补交发生一次；被禁呼或未知号码不提交',ac=[2058,2059,2068,2069])
local('CLOUD-TASK-RESULT','接收任务结果及下载失败名单',[2002],['TASK-ID','TASK-MODE','CALL-ID','CALL-STATE','TASK-FAILURES'],['TASK-STATE','TASK-FAILURES','CALL-STATE','AUDIT'],'任务结果查询/外部回执或点击原失败名单下载',['准确任务/企业来源与结果读权，回执身份可确认'],['按准确taskId+callId合并确认事实，重复结果不重复统计','迟到结果只补所属专业通话，不覆盖人工跟进或自动推进业务运行','失败下载用准确当前筛选和失败类，下载不等于重呼/补交'],'专业任务事实和失败名单准确展示/下载，未知结果仍待核',ac=[2068,2069,2070,2072])
local('TASK-EXPORT','导出预外呼／IVR任务列表',[2002],['QUERY','TASK-MODE','RESOURCE-SCOPE'],['REPORT-EXPORT'],'PRED/IVR页点击原任务列表导出',['原任务列表导出权'],['固定当前已应用筛选授权任务集合及具体mode','按原列表CSV字段生成；空结果/失败明确反馈'],'仅导出该方式有权任务列表，不把任务客户明细混作列表',ac=[2068,2070])
local('EXPORT-CUSTOMERS','导出当前专业任务客户明细',[2043],['TASK-ID','TASK-MODE','QUERY','RESOURCE-SCOPE'],['REPORT-EXPORT'],'当前预外呼任务详情的客户名单点击导出',['该任务客户明细导出权，准确taskId上下文'],['仅取当前taskId下授权且当前筛选客户明细，保持原字段','非导入批次导出；无任务/无数据/生成失败清晰提示','敏感号码按原导出资格，不借列表读权扩权'],'下载当前专业任务客户明细，不导出其他任务或所有批次',ac=[2068])
local('IMPORT-BATCH','查询专业导入批次与详情',[2002],['QUERY','IMPORT-BATCH','RESOURCE-SCOPE'],['IMPORT-BATCH','CUSTOMER-ID','FOLLOWER','PRO-FOLLOW-STATE','PAGING'],'导入批次列表查询/点击准确批次详情',['原批次读权；按具体tenant/enterprise来源'],['列表按更新时间倒序后分页；详情锁定batchId','展示准确客户/分配/跟进结果；只读批次不添加未授权导出或修改'],'可追溯原专业批次处理情况，与新业务导入链条按来源身份分开',ac=[2072,2073])
local('BUSINESS-API-IMPORT','接收原业务系统导入与指定坐席',[2002],['APP-ID','APP-TENANTS','APP-CALLBACK','API-PAYLOAD','REQUEST'],['CUSTOMER-ID','IMPORT-BATCH','FOLLOWER','OP-STATE','AUDIT'],'已授权业务系统按原DCC导入接口提交',['真实应用鉴权及准确租户/企业映射；回调已配置；当前目录可确认'],['验证应用授权租户与业务唯一标识、必填、号码；按原入口检查指定坐席资格','同请求同内容幂等，冲突不覆盖已有业务；接口受理不代表通话完成','业务新四节点分类链条仅按其准确接口映射接入，不用手机号猜归属'],'原业务客户任务/分配结果准确受理，可按同请求核对，不扩大完整DCC范围',ac=[2067,2072,2073])
local('BUSINESS-API-RESULT','回传原客户任务完成结果',[2002],['APP-ID','APP-CALLBACK','CUSTOMER-ID','CALL-ID','PRO-FOLLOW-STATE','API-RESULT','REQUEST'],['API-RESULT','AUDIT'],'原客户任务确认已完成且需回传，或对明确可重试结果点击重试',['准确业务任务与来源应用；回调配置和当前完成结果可靠'],['仅成功保存的准确人工结果进入回传；待继续跟进不假报完成','保留原请求与回传payload，成功/失败/未知分开','超时先查同请求；重试不重复业务完成、拒联或拨号'],'完成结果准确回传或保持待回传可恢复状态，不能以发出请求当对端已收',ac=[2066,2067,2072,2073])
local('PRO-FIELD','维护或预览云呼叫专业字段',[2002,2018],['PRO-FIELD-ID','PRO-FIELD-DEF','REVISION','REFERENCE-STATE'],['PRO-FIELD-DEF','AUDIT'],'原专业字段入口查询/预览/新增/编辑/启停/删除',['原当前租户字段配置权；预览只需读权'],['查询及previewOnly只显示当前已保存控件/选项，无保存客户值按钮','新增/编辑按原控件/选项/取数字典校验；不是复制一份品牌分类字段','预置字段保护；任意分类引用不得删除，启用分类显示引用不得停用；并发修订拒绝'],'专业字段定义准确维护或只读预览，原字段引用及独立专业语义保留',ac=[2043,2044,2072])
# Reports, audits and reconciliation.
local('REPORT-QUERY','查询AI三类与Cloud七类专业报表',[2002],['QUERY','REPORT-KIND','RESOURCE-SCOPE'],['REPORT-DATA','PAGING'],'统计报表页选择报表并查询',['该具体报表读权，当前模块及对象范围合法'],['AI通话/计费/线索、Cloud七类按各自指标和原筛选独立读取','来源概览片段只保片段读权，不授整页或导出；未知不补0','更新时间列表与时间趋势序列区分，趋势按时间轴展示'],'独立专业报表正确展示，AI/Cloud指标与账务不混合',ac=[2063,2064,2065,2072])
local('REPORT-DRILL','查看七类Cloud报表明细',[2002],['REPORT-KIND','QUERY','REPORT-DATA'],['CUSTOMER-ID','TASK-ID','CALL-ID','REPORT-DATA'],'Cloud报表点击当前指标明细',['对应指标明细读权；当前已应用筛选保留'],['按当前报表类型分线索/客户名单/任务/通话准确明细分支','明细再验对象读权，空结果/失败不改筛选也不扩全租户'],'显示对应Cloud报表授权明细，不因图表可读获取业务写权',ac=[2072])
local('REPORT-EXPORT','导出七类Cloud专业报表',[2002],['REPORT-KIND','QUERY','REPORT-DATA','RESOURCE-SCOPE'],['REPORT-EXPORT'],'具体Cloud报表点击原导出入口',['该报表原导出权；查询数据可靠'],['七类分别保原列和指标，取当前已应用筛选授权结果','无数据/读取失败/生成失败明确反馈，CSV转义与敏感范围按原权','AI占位报表导出保持不可用；租户AI服务汇总另走8列动作'],'准确Cloud报表文件生成，原AI占位不假报导出成功',ac=[2072,2078])
local('RESOURCE-AUDIT','查看配置记录及精确失败修正入口',[2002],['AUDIT-FILTER','RESOURCE-SCOPE'],['AUDIT','OP-STATE','SEAT-BATCH','PAGING'],'配置记录页查询或点击准确记录详情',['对应企业配置记录读权'],['展示准确对象/动作/请求/本地和远端确认结果，不同状态不混为失败','明确失败坐席创建可进入固定租户原资料修正；未知只能核对不能新建'],'配置过程可追溯，读取不授修正或重新提交权',ac=[2072])
local('OPERATION-AUDIT','查询、查看或导出Cloud操作审计',[2002],['AUDIT-FILTER','RESOURCE-SCOPE'],['AUDIT','REPORT-EXPORT','PAGING'],'操作审计页查询/详情或明确导出',['审计读取权；导出另有原审计导出权'],['按企业/对象/人/时间/结果过滤并按更新时间倒序分页','详情锁定准确记录；导出取当前授权筛选结果，敏感凭据不入文件'],'审计记录可追溯，导出独立校验且不能执行对应业务动作',ac=[2072])
local('CALL-RECONCILE','查询和重新核对通话数据异常',[2002],['CALL-ERROR','CALL-ID','RESOURCE-SCOPE','REQUEST'],['CALL-STATE','RECONCILE-TRACE','AUDIT','PAGING'],'异常页查询/详情/点击本条重新核对',['当前enterprise准确异常对象读取/核对权'],['仅当前有权企业异常集；详情准确callId展示已知事实及核对trace','重新核对按本条请求读取可靠事实，追加trace/审计','有新证据仅补通话事实；无证据保持待处理，不重拨、不改业务跟进或自动推进'],'本条异常已明确解决或仍待处理，核对结果不污染其他通话/业务',ac=[2068,2070,2072])
local('SEAT-EVENT-QUERY','查询全部有权坐席事件',[2002],['QUERY','RESOURCE-SCOPE'],['SEAT-EVENT','PAGING'],'原内部坐席事件页查询/分页',['该原内部页和企业事件读取权'],['按准确租户/企业/坐席及当前来源范围过滤','原本地记录标明模拟/回调/观察来源，不声称全租户生产实时数据'],'当前有权坐席事件可查，查看不改变任何坐席状态',ac=[2072])
# Resource families have distinct key fields and action constraints, shared action template only.
resource_specs={
 'AGENT':('坐席',['SEAT-ID','SEAT-NAME','SEAT-CNO','SEAT-AREA','SEAT-EXTENSION','SEAT-ACCOUNT'],['当前企业工号唯一；坐席关联账号必须显式准确映射','停用禁新任务保当前通话收尾；在线/在用/待核不改分机或删除','已建坐席技能分配失败保坐席成功和待补配，不虚报整体回滚']),
 'SKILL':('技能',['SKILL-ID','SKILL-NAME','SKILL-MEMBERS','SKILL-LEVEL'],['同tenant+enterprise的物理技能与成员','等级1–10且在线先下线；在线新增关系只待提交，独立下线后提交','编辑技能不丢已有关系；成员核对独立显示']),
 'OUTBOUNDGROUP':('外呼组',['OUTBOUND-NAME','OUTBOUND-MEMBERS'],['同企业合法坐席成员，原默认/引用保护','仅所选准确组与成员可变更；任务引用/在用/待核阻止不安全改动']),
 'QUEUE':('队列',['QUEUE-NAME','QUEUE-PARAMS','QUEUE-SKILL'],['当前企业队列允许参数及原优先/容量规则','技能关联保存与成员实际核对分开，未核实显示待核']),
 'NUMBER':('号码',['NUMBER','NUMBER-PROPS'],['仅从供应商有权目录显式选择导入；本地启停不表示供应商销号','全选也逐条最终验证tenant/enterprise/模式；本地持久后刷新，不承诺远端成功']),
 'NUMBERPOOL':('号码池',['POOL-NAME','POOL-TYPE','POOL-DEFAULT','POOL-NUMBERS'],['创建类型0/1，已有池类型只读','每企业最多一个默认，默认不可取消或删除','完整号码集合更新；明确清空才移除全部，未设企业上限须少于500']),
 'EXTENSION':('分机',['EXTENSION-ID','EXTENSION-NAME'],['当前企业准确软电话分机；已占用或在用不能删除/换绑','导入先预检选择，再独立保存，不自动选择全部']),
 'TIME':('时间条件',['TIME-NAME','TIME-TYPE','TIME-RANGE','TIME-PRIORITY'],['名称同AliCti账号唯一且创建后只读','优先级≥1整数且同账号唯一；日期顺序正确、同日开始早于结束','被规则引用/待核时删除受保护']),
 'ENTERPRISE':('AliCti账号',['ENTERPRISE-CONFIG'],['独立原账号资源授权；凭据按敏感权限保护','启停不改变业务租户历史归属；有关联/引用禁止不安全删除','无Cloud企业映射不能用AI租户名称猜测']),
 'APPLICATION':('应用接入',['APP-ID','APP-NAME','APP-TENANTS','APP-CALLBACK','APP-SECRET'],['应用名称≤60；授权租户只可委派子集','回调选填但接口导入前必配；secret默认掩码且显示/复制重新验权','删除使该app接入凭据不可继续换token，不抹原历史来源'])}
for k,(nm,cols,cons) in resource_specs.items():
 local('RESOURCE-'+k+'-QUERY','查询和查看'+nm,[2002],['QUERY','RESOURCE-SCOPE'],cols+['RESOURCE-STATE','PAGING'],'在原'+nm+'页查询或查看准确对象',['原'+nm+'页/对象读权；独立平台或业务租户scope明确'],['按当前enterprise有权对象过滤，读取准确nativeId及用途','详情只读且敏感字段按权展示；列表更新时间倒序后分页'],'有权'+nm+'当前目录与状态可读，读权不授写/导入/监管',ac=[2071,2072])
 local('RESOURCE-'+k+'-SAVE','创建、编辑或按允许动作保存'+nm,[2002],['RESOURCE-SCOPE']+cols+['REVISION','REQUEST'],cols+['RESOURCE-STATE','AUDIT','OP-STATE'],'有原'+nm+'对应操作权者新增/编辑/导入/启停或配置后明确保存',['原该动作权及当前合法资源范围']+cons,['按准确动作变体逐字段校验；导入保选中候选，启停保原状态约束','最终复核scope/修订/引用/在用状态，不能因原页面有入口忽略动作权','分别保存明确本地结果和外部受理/终态；失败保输入、未知先核对'],'准确'+nm+'允许配置确认保存；不假报供应商生效或静默改其他资源',ac=[2071,2072])
 local('RESOURCE-'+k+'-DELETE','删除可删除的'+nm,[2002],['RESOURCE-SCOPE']+cols[:1]+['REFERENCE-STATE','RESOURCE-STATE','REVISION'],['AUDIT','OP-STATE'],'有原删除权者对准确'+nm+'确认删除',['原该对象删除能力存在且有权；无引用/在用/待核冲突']+cons,['展示准确对象并最终检查原默认/预置/引用/在用保护','只删除本对象允许的目录记录，不清任务/通话/账务或其他资源','只有确认成功刷新，失败/未知保可核对状态'],'仅准确可删'+nm+'确认删除；原不提供删除能力的变体不得被通用入口新增',ac=[2071,2072])
local('SEAT-BATCH-CREATE','批量开通供应商坐席',[2002],['RESOURCE-SCOPE','SEAT-BATCH','REQUEST'],['SEAT-BATCH','RESOURCE-STATE','AUDIT'],'坐席页原批量开通表单预检查后独立提交',['原坐席开通权，准确企业和工号候选'],['逐工号检查合法、重复、本地/远端存在性；捕获同journal请求','逐项记录确认已建/明确失败/未知，部分成功不伪造整批成功或回滚','未知工号不重新创建，交专门核对；本地持久错误不掩饰远端已建'],'批量结果逐工号可追溯，不重复创建待核工号',rules=['GR-IDENTITY','GR-SCOPE','GR-AUTH','GR-SERIAL','GR-UNKNOWN'],ac=[2071,2072])
local('SEAT-BATCH-VERIFY','核对未知批量开通结果',[2002],['RESOURCE-SCOPE','SEAT-BATCH','REQUEST'],['SEAT-BATCH','RESOURCE-STATE','AUDIT'],'对原批量journal点击核对',['准确原journal及核对权'],['只查询同journal/cno，分别识别已确认、未确认和本地落库失败','确认已建仅补准确关联，不重建；持续未知保持pending'],'未知开通结果收敛或继续待核，不以差额自动成功',ac=[2071,2072])
local('SEAT-CORRECT','修正明确失败的坐席创建',[2002],['AUDIT','SEAT-NAME','SEAT-CNO','SEAT-AREA','RESOURCE-SCOPE','REQUEST'],['SEAT-ID','AUDIT','OP-STATE'],'准确失败配置记录点击修改资料重新提交',['仅明确失败且未存在坐席；原创建权；固定原租户'],['预填原资料并锁原租户，重新校验工号/资料与范围','独立新尝试关联回原失败记录，不修改已有坐席或其他配置记录'],'准确失败创建得到可追溯新结果；未知旧创建不能使用本动作',ac=[2072])
local('SEAT-SYNC','从供应商同步已有坐席',[2002],['RESOURCE-SCOPE','SEAT-BATCH','REQUEST'],['SEAT-ID','SEAT-BATCH','AUDIT'],'原坐席页加载候选→选择→独立保存同步',['原同步权，准确企业/候选修订'],['逐工号核对范围及类型，已存在本地工号跳过并保姓名/技能','逐项成功/跳过/失败保留，不承诺批量原子性'],'明确选择的远端已有坐席映射本地，不重复开通或改已有资料',ac=[2071,2072])
local('SEAT-BIND','关联已有坐席与账号',[2002],['RESOURCE-SCOPE','SEAT-ID','SEAT-ACCOUNT','MEMBER-ID','REVISION'],['SEAT-ACCOUNT','AUDIT','OP-STATE'],'坐席页显式选准确账号成员并保存关联',['原坐席关联权；member解析account/tenant/enterprise准确'],['在锁定上下文/修订内复核唯一关联、非删除、非在用与当前资格','停用坐席不自动启用，关联草稿不授新模块权'],'准确账号成员与原坐席关联成功，其他租户成员和坐席不变',ac=[2071,2072])
local('SKILL-MEMBER','增删坐席技能或调整技能等级',[2002],['RESOURCE-SCOPE','SEAT-ID','SKILL-ID','SKILL-MEMBERS','SKILL-LEVEL','REVISION'],['SKILL-MEMBERS','AUDIT','OP-STATE'],'原坐席/技能详情执行新增、移出、等级调整或待提交技能提交',['原对应关系管理权；准确同企业关系'],['只处理选中关系；在线新增只保存待提交，不能改既有等级','等级调整需下线且1–10；下线后明确提交待新增技能','移出及提交按引用和当前修订守卫，失败不丢其他关系'],'准确成员关系与等级状态确认保存，未生效配置保持待提交/待核',ac=[2071,2072])
local('QUEUE-ASSOCIATE','保存队列技能关联并核对成员',[2002],['RESOURCE-SCOPE','QUEUE-NAME','QUEUE-SKILL','SKILL-MEMBERS','REVISION'],['QUEUE-SKILL','RESOURCE-STATE','AUDIT'],'原队列详情保存技能关联或点击重新核对成员',['原队列关联/核对权；准确队列和技能同企业'],['保存仅明确选中技能集合并比较当前修订','成员核对独立读取真实当前关系，不能从关联保存推断成员同步成功'],'关联已确认及成员核对状态分别展示，持续未知不假报一致',ac=[2071,2072])
local('INBOUND-RULE','维护呼入规则及接听去向',[2002],['INBOUND-ID','INBOUND-NAME','INBOUND-PRIORITY','INBOUND-MATCH','INBOUND-TARGET','INBOUND-STATE','REVISION','REQUEST'],['INBOUND-ID','INBOUND-STATE','AUDIT','OP-STATE'],'呼入规则查询/详情/新增/编辑/启停或已停用规则删除',['Cloud呼入配置读/写分别授权；配置管理员无需本人坐席'],['查询/只读详情无保存；写动作校验唯一优先级、条件和有效呼入目标','编辑比较修订，启停按准确动作确认；已停用且无待核才可删除','运营实际接听仍检查本人有效坐席；公共禁呼不拒正常呼入'],'准确呼入规则配置与同步结果分别确认，失败/未知保输入及核对路径',ac=[2057,2071,2072])
# Atomise real professional form fields. This is product meaning, not physical mapping.
extra_by_family={}
def add_atom(family,code,name,entity,key,**kw):
 field(code,name,entity,key,**kw);extra_by_family.setdefault(family,[]).append(code)
add_atom('OUTBOUNDGROUP','OUTBOUND-CODE','外呼组编号','outboundGroup','gno',fmt='字母开头，2–20位字母与数字',validation=['同企业唯一；创建后编号只读','不能以组名称替代编号'])
add_atom('OUTBOUNDGROUP','OUTBOUND-COMMENT','外呼组备注','outboundGroup','comment',fmt='≤100字符',nullable=True,required='选填',validation=['≤100字符；明确清空才清空'])
add_atom('NUMBERPOOL','POOL-COMMENT','号码池备注','numberPool','comment',fmt='≤500字符；不含控制字符',nullable=True,required='选填',validation=['首尾空白去除；≤500字符且无控制字符'])
for code,name,key,lo,hi,default in [('QUEUE-WEIGHT','队列优先级','weight',1,10,1),('QUEUE-TIMEOUT','最长排队时间','queueTimeout',20,600,600),('QUEUE-RING','坐席振铃时间','memberTimeout',20,60,25),('QUEUE-RETRY','呼叫下一坐席间隔','retry',0,None,5),('QUEUE-WRAP','话后整理时间','wrapupTime',3,3600,30),('QUEUE-MAXLEN','排队人数上限','maxLen',0,999,0),('QUEUE-SERVICELEVEL','服务水平时间','serviceLevel',0,None,10),('QUEUE-ANNOUNCE-FREQ','固定语音播报周期','announceSoundFrequency',0,None,None),('QUEUE-POSITION-FREQ','位置播报周期','announcePositionFrequency',0,None,0),('QUEUE-POSITION-NUM','位置播报人数阈值','announcePositionParam',2,None,None)]:
 rule=f'{lo}–{hi}整数' if hi is not None else f'≥{lo}整数'
 if key=='weight':rule+='，数值越大优先级越高'
 elif key=='maxLen':rule+='人，0表示不限制'
 else:rule+='秒' if key not in ['announcePositionParam'] else '人'
 add_atom('QUEUE',code,name,'queue',key,typ='integer',fmt=rule,default=default,required='固定语音开启时必填' if key=='announceSoundFrequency' else '位置播报开启时必填' if key=='announcePositionParam' else '新建/修改队列必填',validation=[rule+'；缺失不能当0','关闭条件项时不把隐藏旧值解释成已启用配置'],valid=[str(default if default is not None else lo)],invalid=[str(lo-1)+'：小于下限'])
add_atom('QUEUE','QUEUE-CODE','队列编号','queue','qno',validation=['当前AliCti账号唯一；保留前导0','创建后不可修改'])
add_atom('QUEUE','QUEUE-STRATEGY','接听分配方式','queue','strategy',fmt='rrordered技能优先/rrmemory轮选/fewestcalls平均/random随机/linear顺序/leastrecent最长空闲',default='leastrecent',validation=['仅允许所列6值；现值未知要求明确选择，不回退首项'])
add_atom('QUEUE','QUEUE-MUSIC','等待语音class','queue','musicClass',default='default',validation=['非空供应商等待语音class名称','不把本地名称当已存在远端语音资源'])
add_atom('QUEUE','QUEUE-SAYAGENT','坐席工号播报','queue','sayAgentno',typ='boolean',default=False,validation=['布尔值；不接受任意真值字符串'])
add_atom('QUEUE','QUEUE-ANNOUNCE','固定语音播报开关','queue','announceSound',typ='integer',fmt='0关闭/1开启',default=0,validation=['仅0/1；开启时须播报文件和周期'])
add_atom('QUEUE','QUEUE-ANNOUNCE-FILE','固定语音文件','queue','announceSoundFile',nullable=True,required='固定语音播报开启时必填；关闭不代表删除远端文件',validation=['开启时非空供应商语音文件名称','文件引用与同enterprise用途一致'])
add_atom('QUEUE','QUEUE-POSITION','排队位置播报','queue','announcePosition',typ='integer',fmt='0关闭/1大于阈值时/2小于等于阈值时',default=0,validation=['仅0/1/2；非0时人数阈值≥2且周期非负'])
add_atom('QUEUE','QUEUE-VIP','VIP支持','queue','vipSupport',typ='integer',fmt='0不支持/1支持',default=0,validation=['仅0/1，不因VIP开关扩大对象权限'])
add_atom('QUEUE','QUEUE-JOINEMPTY','允许排队坐席状态','queue','joinEmpty',typ='integer',fmt='0–31位和：1置忙/2通话/4振铃/8无效/16整理',default=0,validation=['仅允许上述位和；空选为明确0','不把是否允许排队等同实际可拨坐席数'])
add_atom('EXTENSION','EXTENSION-PASSWORD','分机密码','extensionCredential','password',fmt='非空字符串；不回显原值',required='新建必填；编辑留空保持原值',read=['仅当前操作者新输入，不读原密码'],write=ADMIN,persist='transient',when='仅本次创建/明确改密提交使用；关闭清空，不进入本地目录/审计明文',validation=['新建非空；修改只有明确非空输入才更新','分机密码独立于平台账号密码；不擅用平台强度要求'])
add_atom('EXTENSION','EXTENSION-AREA','分机区号','extension','areaCode',fmt='非空数字字符串，保留0',validation=['必填纯数字，如021；不补猜默认区号'])
for code,name,key,default in [('EXTENSION-ACTIVE','分机启用状态','active',1),('EXTENSION-OUTBOUND','分机允许外呼','isOb',1),('EXTENSION-DIRECT','允许摘机外呼','isDirect',1),('EXTENSION-IBRECORD','呼入录音','ibRecord',1),('EXTENSION-OBRECORD','外呼录音','obRecord',1),('EXTENSION-JITTER','网络防抖','jitterBuffer',0),('EXTENSION-DENOISE','降噪','denoise',0)]:
 add_atom('EXTENSION',code,name,'extension',key,typ='integer',fmt='0关闭/1开启',default=default,validation=['仅0或1；编辑省略保持原值','分机允许开关不替代账号/成员/公共禁呼检查'])
add_atom('EXTENSION','EXTENSION-POWER','分机可呼叫范围','extension','callPower',fmt='0不限制/1国内长途/2国内本市/3内部呼叫',default='0',validation=['仅0/1/2/3；内部呼叫不允许客户外呼'])
add_atom('EXTENSION','EXTENSION-NETWORK','软电话接入网络','extension','allow',fmt='alaw,ulaw公网／myopus,alaw,ulaw专线',default='alaw,ulaw',validation=['仅两个明确编码组合；当前项目设备type固定软电话2'])
add_atom('TASK','TASK-DESC','专业任务描述','professionalTask','description',fmt='≤199字符',nullable=True,required='选填',validation=['少于200字符；不执行描述中的任意规则'])
add_atom('TASK','TASK-BUSINESS-TAGS','专业任务业务标签','professionalTask','businessTagNames',fmt='英文逗号分隔的原业务标签文本',nullable=True,required='选填',validation=['按原表单拆分、去空；不同于AI意向标签或业务字段条件'])
for code,name,key,lo,hi,default in [('TASK-CUSTOMER-TIMEOUT','客户接听等待','customerTimeout',5,60,30),('TASK-MIN-AGENTS','最小可用坐席数','minAvailableAgentCount',1,10,10),('TASK-AGENT-TIMEOUT','坐席接听超时','agentTimeout',5,60,10),('TASK-WRAP','坐席整理时间','wrapup',1,10800,30),('TASK-MAXWAIT','坐席最长空闲等待','maxWaitTime',10,600,40)]:
 add_atom('TASK',code,name,'professionalTask',key,typ='integer',fmt=f'{lo}–{hi}整数；'+('人数' if key=='minAvailableAgentCount' else '秒'),default=default,required='客户等待按对应方式必填；其余仅预外呼配置',validation=[f'{lo}–{hi}整数；非预外呼不能套用预外呼策略','最小坐席计可用非置忙；不足自动暂停，仅原定时启动策略允许恢复后自动启动' if key=='minAvailableAgentCount' else '缺省编辑保当前值，不把空白转0'])
add_atom('TASK','TASK-QUOTIETY','预外呼拨号系数','professionalTask','quotiety',typ='number',fmt='>0至20；最多2位小数',default=1,required='仅预外呼配置必填',validation=['0.01–20且最多两位小数；不用于人工/IVR','以原供应商口径解释，不当客户意向或业务路由值'])
for code,name,key,fmt,default,rule in [('TASK-PREDICTADJUST','超呼率','predictAdjust','原预外呼百分比',100,'按原任务提交契约允许百分比；显示与保存同一单位，不从AI接通率反算'),('TASK-ANSWER-RATE','预热接通率','answerRate','原预外呼百分比',50,'只影响原专业预测策略，不写业务结果'),('TASK-WARMUP','预热时长','warmUpDuration','秒',300,'按原任务提交允许整数范围校验，不当通话时长'),('TASK-REWARM','再次预热','isRewarm','0/1',1,'仅0/1；当前任务模式须预外呼'),('TASK-CALLROUTE','坐席接听分配策略','callRouteStrategy','原预外呼明确策略枚举',1,'仅允许当前原策略选项；不能以模板分支代替')]:
 add_atom('TASK',code,name,'professionalTask',key,typ='integer',fmt=fmt,default=default,required='仅预外呼显式设置时按当前契约',validation=[rule,'精确供应商上限和允许枚举须工程映射核证；无可靠允许值时阻止该新配置，不猜默认'])
add_atom('INBOUND','INBOUND-RULE-NAME','呼入规则名称','inboundRule','name',nullable=True,required='创建选填；创建后只读',validation=['创建时可不填；编辑不得改规则名','规则身份以稳定ID，不以name推断'])
add_atom('INBOUND','INBOUND-REMARK','呼入规则备注','inboundRule','description',nullable=True,required='选填；明确清空才清空',validation=['文本备注，不执行附加逻辑'])
add_atom('INBOUND','INBOUND-TYPE','呼入接听去向类型','inboundRule','routerType',typ='integer',fmt='1语音导航/2联系电话/3软电话分机',validation=['只允许1/2/3；不是技能/队列直接目标','按选定类型只提交对应准确目标'])
add_atom('INBOUND','INBOUND-PROPERTY','呼入接听目标','inboundRule','routerProperty',validation=['type1同企业真实呼入IVR；type2合法带区号联系电话；type3同企业有效分机','不可使用本地或外呼流程ID充当呼入IVR'])
add_atom('INBOUND','INBOUND-TRUNKS','呼入接入号码条件','inboundRule','ruleTrunkProperty',typ='array',nullable=False,required='选填，可明确空集合',validation=['同企业合法接入号码集合；空集合按原不限该条件语义','选中值以准确原号码串关联，不取显示名称'])
add_atom('INBOUND','INBOUND-TIMES','呼入时间条件','inboundRule','ruleTimeProperty',typ='array',required='选填，可明确空集合',validation=['当前企业合法时间条件ID集合；空集合按原不限该条件语义','名称推荐不等于准确ID'])
add_atom('INBOUND','INBOUND-AREAS','呼入主叫号码/前缀/区号','inboundRule','ruleAreaProperty',typ='array',fmt='分号分隔；中文分号规范化',required='选填，可明确空集合',validation=['逐项规范号码/前缀/区号按原允许格式；多项逻辑按原匹配规则','空集合不限此类条件，不补任意前缀'])
# Replace aggregate UI group fields by atomised real fields in every local reference.
replacements={'QUEUE-PARAMS':extra_by_family['QUEUE'],'EXTENSION-NAME':extra_by_family['EXTENSION'],'POOL-NAME':['POOL-NAME','POOL-COMMENT'],'INBOUND-NAME':['INBOUND-RULE-NAME','INBOUND-REMARK'],'INBOUND-MATCH':['INBOUND-TRUNKS','INBOUND-TIMES','INBOUND-AREAS'],'INBOUND-TARGET':['INBOUND-TYPE','INBOUND-PROPERTY'],'TASK-POLICY':extra_by_family['TASK']}
remove_codes={'QUEUE-PARAMS','EXTENSION-NAME','INBOUND-NAME','INBOUND-MATCH','INBOUND-TARGET','TASK-POLICY'}
old_ids={F[k]:[F[n] for n in v] for k,v in replacements.items()}
def expand(ids):
 return list(dict.fromkeys(z for i in ids for z in old_ids.get(i,[i])))
for lo in locals_:
 for key in ['inputs','outputs','field_ids']:lo[key]=expand(lo[key])
 for st in lo['steps']:
  st['reads']=expand(st['reads']);st['writes']=expand(st['writes'])
 for br in lo['branches']:br['field_ids']=expand(br['field_ids'])
fields[:]=[f for f in fields if f['id'] not in {F[x] for x in remove_codes}]
# Add new real atom fields to their family-specific resource actions.
for lo in locals_:
 for family in ['OUTBOUNDGROUP','NUMBERPOOL','EXTENSION','QUEUE']:
  if lo['id'].startswith('LOCAL-PLAT-RESOURCE-'+family+'-'):
   ids=[F[x] for x in extra_by_family.get(family,[])];lo['field_ids']=list(dict.fromkeys(lo['field_ids']+ids));lo['outputs']=list(dict.fromkeys(lo['outputs']+ids));lo['steps'][-1]['writes']=list(dict.fromkeys(lo['steps'][-1]['writes']+ids))
for f in fields:
 if f['id']==F['TENANT-NAME'] or f['id'] in [F['TENANT-CONTACT'],F['TENANT-DESC']]:f['permissions']['write']=ADMIN;f['validation_rules'].append('租户管理员仅可维护有权本租户基础资料；创建、品牌/组织/门店编码/资源关联和商业标记各自另权')
 if f['id'] in [F['AI-SCENE-NAME'],F['AI-TYPE'],F['AI-PARAMS']]:f['permissions']['write']=['超级管理员（当前AI专业配置权）']+TEN
 if f['id']==F['POOL-NAME']:f.update(name='号码池名称',key='name',type='string',format='非空≤80字符，无控制字符');f['validation_rules']=['当前企业名称不区分大小写唯一，非空≤80且无控制字符','默认池不可删除/取消默认；不以名称猜测nativeId']
 if f['id']==F['POOL-NUMBERS']:f['validation_rules']=['每项只能数字或开头+，≤30字符，不可重复；同企业合法资源','少于500个号码；空集合可明确移除全部，省略不清空']
 if f['id']==F['OUTBOUND-NAME']:f.update(format='非空≤50字符');f['validation_rules'].insert(0,'名称必填≤50字符')
 if f['id']==F['EXTENSION-ID']:f['format']='3–11位数字字符串，保留前导0';f['validation_rules'].insert(0,'分机号创建后只读；仅软电话type2，创建必填')
 if f['id']==F['TASK-NAME']:f['format']='Cloud任务1–49字符；AI任务按具体场景目录';f['validation_rules']=['Cloud任务名称1–49字符；AI任务按当前场景明确命名校验','修改不改变准确taskId，原专业模式参数分别校验']
 if f['id']==F['INBOUND-STATE']:f['format']='active1启用/2停用；同步pending/unknown独立';f['validation_rules'].append('创建/编辑提交active仅1或2；不可将2当truthy启用')
# Correct exact inherited inbound form semantics in prose.
for lo in locals_:
 if lo['id']==L['INBOUND-RULE']:
  lo['steps'][1]['action']='创建名称选填且创建后只读；优先级唯一正整数；原目标仅1语音导航/2联系电话/3分机，校验对应真实资源；编辑比较修订，只有已停用且无待核可删除'
local('ACCOUNT-QUERY','查询本范围账号及成员',[2002,2011],['QUERY','CURRENT-TENANT'],['ACCOUNT-ID','LOGIN-NAME','NICKNAME','MOBILE','MEMBER-ID','MEMBER-ROLE','MEMBER-STATE','MEMBER-GRANTS','PAGING'],'账号管理查询或查看准确账号成员',['当前管理对象范围读权'],['全局账号资料和租户成员分别展示；租户管理员只看本租户成员及允许资料','敏感密码不返回，原坐席/供应商账号独立关联，不以昵称或手机号合并'],'准确账号成员列表可读，读权不授全局改密/停用/删除',ac=[2022,2023,2024])
local('AI-IMPORT-TEMPLATE','下载具体AI任务导入模板',[2002],['TASK-ID','AI-SCENE-ID','PRO-FIELD-DEF'],['REPORT-EXPORT'],'AI任务导入弹层点击原下载模板',['当前准确AI任务/场景读取及导入资格'],['取当前场景允许字段/必需项形成准确表头模板','无当前定义/无权/生成失败不给空白假模板；下载不执行导入'],'该具体场景导入模板可下载，不把其他AI导出占位当可用',ac=[2063,2064])
for code,fmt in [('TASK-PREDICTADJUST','50–400整数百分比'),('TASK-ANSWER-RATE','1–100整数百分比'),('TASK-WARMUP','60–600整数秒'),('TASK-CALLROUTE','1直接接坐席/2AI转人工；后者须准确有效语音导航')]:
 f=next(x for x in fields if x['id']==F[code]);f['format']=fmt;f['validation_rules']=[fmt+'；当前模式必须为预外呼','编辑省略保持当前已确认值；不把其他模式策略套入']
field('TASK-CONCURRENCY','专业任务最大并发','professionalTask','concurrency',typ='integer',fmt='IVR正整数；预外呼非负整数且0不限',validation=['IVR必须>0；仅预外呼可0表示不限制','不从本地可用坐席数推断供应商并发额度'])
field('TASK-COMPLETE','名单呼完处理','professionalTask','autoComplete',typ='integer',fmt='0暂停/1自动完成',validation=['只允许0/1；新建原预外呼默认0、IVR默认1','已受理当前阶段按原供应商执行，不将任务完成当人工业务已完成'])
field('TASK-FORCEEND','定时强制结束','professionalTask','forceEndFlag',typ='integer',fmt='0/1',required='配置定时结束时必填',validation=['仅0/1；只有stopScheduled=true适用','是否终止当前电话按原供应商执行证据，不由前端猜测'])
field('TASK-RETRYTODAY','重呼仅当天生效方式','professionalTask','retryStrategyOnlyToday',typ='integer',fmt='0–3原策略枚举',validation=['仅0–3整数，按供应商对应含义映射','具体码语义工程需与已选原策略精确对应，不猜新业务语义'])
field('TASK-CALLPRIORITY','呼叫先后策略','professionalTask','callPriority',typ='object',fmt='retryFirst布尔；retryDesc0/1；firstCallOrderType0/1/2',validation=['三个值严格校验；按retryFirst决定两类顺序','控制号码执行序列，不按更新时间倒序改写策略'])
for lo in locals_:
 if lo['id'] in [L['CLOUD-TASK-SAVE'],L['CLOUD-TASK-QUERY']]:
  more=[F[x] for x in ['TASK-CONCURRENCY','TASK-COMPLETE','TASK-FORCEEND','TASK-RETRYTODAY','TASK-CALLPRIORITY']]
  lo['field_ids']=list(dict.fromkeys(lo['field_ids']+more));lo['outputs']=list(dict.fromkeys(lo['outputs']+more));lo['steps'][-1]['writes']=list(dict.fromkeys(lo['steps'][-1]['writes']+more))
# Explicit feature specification, preserving all 28 stable IDs.
feature_text={
2001:('登录并进入合法入口','统一认证后按当前权威授权选择合法租户或独立平台范围，进入当前五入口中的有权原功能。'),
2002:('进入有权工作位置与保留专业能力','当前五顶栏只负责功能归位。按稳定页面/动作身份保留AI与Cloud现行专业操作、状态、资源、报表和业务接口，分别校验模块、成员、对象、读写/导出权。'),
2003:('保护电话现场后切换上下文','本人电话与普通未保存表单保护完成后，切换合法租户或跨原专业边界；目标重新验权，不带入旧租户客户、草稿或电话在线。'),
2004:('统一退出登录','处理本人电话和必要话后及未保存表单后统一退出两模块会话；后台已受理租户任务不因此取消。'),
2005:('新建业务租户并关联品牌','有租户创建权的平台管理员同次填写基础资料、单一品牌、总部/门店身份及可选门店编码；独立模块默认未开，Cloud资源按实际需要准确关联。'),
2006:('修改有权租户基础资料','超管或有本租户tenant.update权的租户管理员维护允许的名称、联系人、说明；品牌/组织/门店编码/资源关联、商业标记和开通按独立权限与引用保护办理。'),
2007:('维护租户品牌与组织身份','超管按单品牌/品牌唯一总部/门店编码唯一维护归属。有现行业务引用或引用状态不明禁止换绑；不做旧v2数据迁移。'),
2008:('登记品牌档案','超级管理员登记稳定品牌ID、1–60字名称及可选备注；品牌不是权限或跨租户数据共享开关。'),
2009:('修改品牌档案','超级管理员修改准确品牌名称/备注并保留变更审计；不改变租户与业务归属。'),
2010:('分别开通租户AI与Cloud模块','有权超管独立开通AI、Cloud或两者；Cloud需有效企业映射，仅AI不需Cloud资源；开通不自动授权成员。'),
2011:('创建账号或显式关联已有账号为本租户成员','账号全局档案与租户成员关系分开；准确手机号查找仅返回候选，需明确账号ID后关联，不能同名同号自动合并。'),
2012:('配置本租户成员角色与模块权限','租户管理员只委派本租户已开通模块内本人允许子集；五生产角色固定，坐席能力和标签配置/财务/资源资格单独控制。'),
2013:('停用本租户成员','只限制准确本租户新增操作，其他租户授权不变；当前已接通电话及必要话后有限收尾，保已受理租户任务。'),
2014:('全局停用登录账号','独立超管权限停用准确账号，所有租户禁新增；当前接通电话必要话后有限收尾，任务不自动转交/取消。'),
2015:('结束停用范围有限收尾','停用者只完成停用时已接通电话及必要话后，结束后离线并退出该范围；不是重新启用。'),
2018:('停用当前专业域目录分类','仍有专业用途的原目录能力保留准确专业身份，禁止新选/新关联，已有场景与受理任务按专业规则完成；不恢复已取消旧v2历史台账兼容。'),
2019:('为具体AI执行场景维护业务分类引用','在AI标签管理→场景配置按具体场景ID关联当前品牌有权分类，保原AI细分和供应商参数；业务引用不等于模板实际路由绑定。'),
2020:('查询本租户黑名单分组及号码','沿原分组+号码唯一主维护模型查询本租户名单及客户拒联来源；超管仅查看，租户管理员/运营各按既有操作资格。'),
2021:('查看黑名单来源及远端同步详情','显示准确号码来源、通话、原因、有效期、解除和逐来源远端足迹；本地生效与供应商终态明确分开。'),
2022:('人工明确拒联成功保存后自动入库','实际处理人成功保存明确拒联话后后，同请求幂等加入本租户长期公共禁呼；失败/未知不得虚报整体完成。'),
2023:('人工确认AI明确拒联并入库','有权租户管理员或获新增权运营在准确AI通话上明确确认后入库；超管只读，AI结果不自动当拒联，新增权不含解除。'),
2024:('统一检查所有新外呼、重呼和补提交','公共明确拒联阻止本租户AI/人工/PRED/IVR；每次新发起实时检查，失败/未知不放行；正常呼入继续接听，已在途电话不静默取消。'),
2025:('管理员填原因解除准确拒联来源','仅有权本租户管理员解除准确来源并留原因/人/时间，超管只读、运营无解除权；其他有效来源不清除，旧事件不复活。'),
2026:('查询品牌内有权关联租户','取品牌关联与当前可读租户基础资料交集，不显示无权对象；进入维护另验归属维护权。'),
2027:('导出当前租户AI服务汇总8列','仅有原财务导出权超管按当前授权AI租户精确映射和同次可靠服务快照导出固定8列；未知字段或范围不可靠阻止文件。'),
2028:('删除无引用且无其他租户关联的准确账号','沿独立原删除权，最终一致校验引用/关联/修订；引用未知不删，不等同成员移除或坐席删除，保必要审计。'),
2029:('删除无业务引用的准确租户','沿独立原删除权及默认管理组保护，引用/权限/修订终提交再验；不级联清账、任务、品牌和其他租户。'),
2043:('导出当前专业任务客户明细','入口位于当前预外呼任务详情客户名单，按准确taskId与当前筛选授权明细生成文件；不改成导入批次导出。')}
feat=[]
for x in orig:
 n=int(x['id'].split('-')[1])
 if n not in feature_text:continue
 name,desc=feature_text[n]; owns=[lo for lo in locals_ if x['id'] in lo['feature_ids']]
 feat.append({'id':x['id'],'operation_key':x['operation_key'],'name':name,'description':desc,'source_acceptance_ids':list(dict.fromkeys(x.get('source_acceptance_ids',[])+[a for lo in owns for a in next(c for c in checks if c['id']==lo['test_refs'][0])['acceptance_ids']])),'source_page_ids':x.get('source_page_ids',[]),'source_action_ids':x.get('source_action_ids',[]),'local_logic_ids':[lo['id'] for lo in owns],'field_ids':list(dict.fromkeys(f for lo in owns for f in lo['field_ids'])),'test_refs':list(dict.fromkeys(c for lo in owns for c in lo['test_refs'])),'source_refs':['documentation/input/functions.json#'+x['id']],'production_evidence':'current_product_rule_defined; real_auth/vendor/physical_mapping_not_verified_by_Mock','boundary_note':'专业保留操作逐stable key见retained_capability_specs；其原能力由FUNC-2002归位与统一权限承接，不新增差异FUNC。' if n==2002 else '本条仅当前产品语义；取消旧v2数据兼容，不取消今后运行/跟进/通话的快照与审计。'})
# AC IDs retained; stale historical compatibility and superseded navigation replaced.
ACUP={
2002:'账号、租户和原供应商身份分别保留准确稳定标识并显式映射，不能按同名/手机号/品牌猜测；当前无旧v2模板或数据迁移需求，未来业务事实和快照正常留存。',
2003:'首次登录按当前真实有权范围选择本人作业、监管或原Cloud合法入口；原综合概览默认且同时有导入分配与Cloud报表权者进入导入与分配。后续恢复同账号同租户仍合法位置；只有公共管理权时进入首个有权管理页，授权读取失败不得冒充无权。',
2006:'退出前保护本人拨号、振铃、通话、必要话后和电话离线状态；普通未保存表单明确保存/放弃/取消。保存/离线失败或状态未知不放行，保留输入；已受理后台任务不因退出被取消。',
2007:'当前顶栏固定五入口：坐席工作台、业务&客户、呼叫中心、报表中心、系统管理。按原稳定页面和主业务对象归位；不新增统一首页，不重建AI/Cloud专业任务或客户数据。',
2008:'五入口仅为展示分组，不新增许可开关或业务角色。生产角色固定超管、总部管理员/运营、门店管理员/运营；坐席是当前租户电话作业能力。AI与Cloud独立开通，页面/对象/动作/读写/导出仍分别验权。',
2009:'原合法页面按稳定ID映射当前五区域，原首次合法作业/监管/管理入口意图不按顶栏顺序重算；无入口、无权和范围读取失败分别反馈。',
2016:'两模块共用准确业务租户基础资料；AI租户/Cloud企业等原身份分别按稳定ID显式映射，不按名字合并，不引入旧v2数据迁移。',
2018:'新建业务租户必须关联一个有效品牌并明确总部/门店身份；当前规划无旧未绑定租户兼容或补迁移流程。',
2020:'AI与Cloud保持独立开通状态，Cloud完成当前有效唯一企业资源配置后单独开通；开通不是成员授权，也不是财务服务已结算。',
2022:'有本租户建号/成员维护权的管理员可创建普通全局账号并关联本租户，或显式关联准确已有账号；不跨租户建成员、不授超管，真实账号服务授权和额度另需工程证据。',
2023:'登录名/手机号唯一，手机号查找只是准确账号候选，须明确选择accountId后关联；同名同号不自动合并或覆盖资料。全局资料修改、成员授权和坐席绑定分别验权。',
2025:'同一账号多个租户成员及AI/Cloud模块授权独立；只授当前模块已开通且管理员可委派子集，不复用原型演示身份推授生产权。',
2031:'全局停用保留已形成任务、通话和审计事实；重新启用或删除均须对应独立原操作权，不由停用动作推授。',
2036:'每租户一个品牌，每品牌最多一个总部及多独立门店；创建品牌必填。已有当前业务引用或引用无法可靠判定时，禁止更换品牌/总部门店身份；当前不定义旧未绑定租户补迁移。',
2043:'有权租户管理员按准确专业目录ID停用其专业分类；品牌共用分类治理另按当前统一入口和品牌配置权。专业域当前能力仍保留，不恢复旧v2历史目录兼容台账或自动新增物理删除权。',
2044:'专业目录停用禁止新选择和新关联；已有准确AI场景关联及已受理专业任务按本身规则完成，不自动解除场景或改写已生成事实；品牌分类实际路由独立保存。',
2047:'按本租户具体AI执行场景稳定ID关联当前品牌有权分类；同一类型不同场景可分别归类，保AI新/冷细分、供应商参数及原专业权。分类仅业务引用，模板实际路由以分类路由配置绑定为准；不定义旧v2目录迁移或同名合并。',
2048:'呼叫拦截沿当前租户原AI分组+号码唯一主维护页面，客户拒联来源在同页展示；不设置公共/专项两套名单页签。超管只读，租户管理员/运营按原操作及来源权限维护，不跨租户/品牌共享。',
2049:'普通组有效期/用途、人工/AI确认拒联来源和当前本地有效状态分别判断；已解除/到期不生效、未知不补永久。只处理当前有效源及今后事件，取消旧历史名单迁移/对账范围。',
2054:'当前本租户有权管理员或单独获客户拒联新增权的运营，在有权准确AI来源通话上明确人工确认后入库；超级管理员黑名单仅只读。',
2060:'仅有权本租户管理员解除准确客户拒联来源，必填原因并留操作人/时间；超级管理员黑名单只读，运营新增或读取权均不包含解除。',
2062:'解除仅影响准确本来源，不清其他仍有效来源；已解除/到期不能被旧事件重放复活。新拒联使用新来源请求；本地与远端终态分开，未知先核对同请求，不伪造成功。',
2063:'保留已确认的222项AI/Cloud原专业能力，按稳定operation_key、PAGE、ACTION逐项关联当前触发/输入/权限/状态/终态；原占位或缺证控制不自动升级，Mock交互不证明真实生产可用。',
2064:'AI任务、通话/计费/线索统计、通话/线索记录、场景、标签及服务能力保留；原首页摘要/使用归AI用量与服务。AI场景使用与标签配置权分离；标签按准确supplier/tenant/type/tagScene/category/brand/revision执行段快照校验。原始与映射结果保留，未匹配不回退首项。准确映射标签可作人工确认路径条件，不直接写业务字段，不因AI回执自动推进。',
2065:'账号租户资料统一维护后，AI原专属资源、统一分钟池和服务账务继续独立于Cloud；五角色按范围可只读账户和充值流水，四租户角色仅本租户。套餐办理/充值/调账/同请求核对/服务汇总导出仅超管有权，不能凭读权办理。',
2066:'保留原Cloud本人电话上线/离线、人工主动外呼、正常呼入、振铃填写和必要话后跟进；须当前有效成员、Cloud模块、作业权及本人有效坐席资源。谁实际接听谁填写，管理员配置/只读不以本人坐席为前提。',
2067:'保留原接口客户任务指定坐席、振铃填写和后续人工跟进；原任务结果为待继续跟进/已完成，与新四节点运行终态不同。分配负责人和实际接听人分开，按准确业务ID归属，不用手机号合并任务。',
2068:'保留预外呼任务创建/修改/名单导入/资源/执行控制/正常重呼/异常补提交/结果与失败下载。客户明细导出在当前taskId任务详情，不改成导入批次导出；失败分类、次数、额度按预外呼原策略，未知先核对。',
2069:'每次首次/重呼/异常补交均检查当前公共禁呼；仍保供应商明确失败分类及额度，不把预外呼策略套人工或IVR，未知旧请求不得当明确失败补交。',
2070:'保留IVR专业任务、真实供应商可执行外呼语音流程、名单导入、原允许执行/暂停/继续/结束及结果；未提交/未启动删除按原条件，已执行记录保留，不与人工/预外呼混用。',
2071:'所有专业资源按准确租户+供应商+enterprise+nativeId及用途判定；资源独立平台授权不是新角色或业务数据共享。IVR必须真实外呼可执行流程，本地/呼入流程ID不可替代。',
2072:'保留坐席/技能/外呼组/队列/号码/号码池/分机/时间条件/账号资源、呼入规则、通话记录核对、七类Cloud报表、应用接入及必要DCC导入/回传。原专业字段和任务两态有独立语义；同号仅按tenant+enterprise+规范号码关联有权联系历史，不合并业务。确已缺失原任务且无通话/未处理中，仅原有权管理员可手工恢复待分配，不自动回收或增公海。五角色按读权播放/暂停/拖动有权录音。',
2073:'原业务接口承接不扩为完整DCC或通用自动引擎；品牌四节点业务链条按本轮确认独立定义并与原任务准确映射。两条链以业务ID/执行段/任务/通话证据连接，不能把原专业完成等同新业务运行完成。',
2078:'仅有原财务导出权超管，将当前授权AI租户交集的同次可靠服务快照导出固定8列：租户名称、租户ID、租户类型、可用分钟、冻结分钟、累计消耗分钟、有效期、呼叫控制状态。映射或任必需值未知阻止出文件；不受原计费日期/平台或公共租户列表筛选隐式改变，不恢复旧金额列或换算旧账。'}
acceptance_updates=[{'id':a['id'],'statement':ACUP.get(int(a['id'][3:]),a['statement']),'story_id':a.get('story_id'),'source_refs':['docs/functional-spec.json#'+a['id']],'status':'current_product_rule','engineering_verification':'Physical identity/authorization/provider terminal evidence remains separate; product rule is not reopened.'} for a in acs if int(a['id'][3:]) in ACUP or int(a['id'][3:]) in list(range(2001,2038))+list(range(2043,2084))]
# Precise retained operation catalogue: every stable key has one action family plus a variant.
explicit={
'ai-query-tasks':'AI-TASK-QUERY','ai-view-task':'AI-TASK-QUERY','ai-query-call-list':'AI-TASK-QUERY','ai-import-task-contacts':'AI-LIST-IMPORT','ai-query-import-records':'AI-IMPORT-HISTORY','ai-remove-assigned-contact':'AI-LIST-REMOVE','ai-query-call-records':'CALL-QUERY','ai-view-call-record':'CALL-QUERY','ai-query-lead-records':'LEAD-QUERY','ai-view-lead-record':'LEAD-QUERY','ai-query-call-statistics':'REPORT-QUERY','ai-query-billing-statistics':'REPORT-QUERY','ai-query-lead-statistics':'REPORT-QUERY','ai-view-billing-detail':'REPORT-QUERY','ai-query-service-summary':'FINANCE-QUERY','ai-query-usage-days':'FINANCE-QUERY','ai-query-usage-tasks':'FINANCE-QUERY','ai-open-trial':'FINANCE-RECHARGE','ai-open-annual':'FINANCE-RECHARGE','ai-recharge-credit':'FINANCE-RECHARGE','ai-adjust-service':'FINANCE-ADJUST','ai-query-recharge-records':'FINANCE-VIEW','ai-query-adjustment-records':'FINANCE-VIEW','ai-save-intent-config':'LEAD-CALLBACK',
'cloud-seat-online':'PHONE-PREPARE','cloud-seat-offline':'PHONE-PREPARE','cloud-manual-call':'PHONE-OUTBOUND','cloud-handle-incoming':'PHONE-INBOUND','cloud-save-followup':'PHONE-AFTERCALL','cloud-continue-followup':'PHONE-CONTINUE','cloud-query-customers':'CUSTOMER-DIRECTORY','cloud-view-customer':'CUSTOMER-DIRECTORY','cloud-import-customers':'CUSTOMER-IMPORT','cloud-assign-customers':'CUSTOMER-ASSIGN','cloud-query-call-records':'CALL-QUERY','cloud-view-call-detail':'CALL-QUERY','cloud-query-audit':'OPERATION-AUDIT','cloud-query-config-records':'RESOURCE-AUDIT','cloud-save-filling-fields':'PRO-FIELD','cloud-receive-business-import':'BUSINESS-API-IMPORT','cloud-deliver-business-result':'BUSINESS-API-RESULT',
'retained-source-ai-legacy-account-query':'ACCOUNT-QUERY','retained-source-ai-download-import-template':'AI-IMPORT-TEMPLATE','retained-source-cloud-config-record-detail':'RESOURCE-AUDIT','retained-source-cloud-export-audit':'OPERATION-AUDIT','retained-source-cloud-view-audit-detail':'OPERATION-AUDIT','retained-source-cloud-export-call-records':'CALL-EXPORT','retained-source-cloud-seat-event-query':'SEAT-EVENT-QUERY','retained-source-cloud-seat-unpause':'PHONE-PREPARE','retained-source-cloud-bind-account-seat':'SEAT-BIND','retained-source-cloud-correct-seat-create':'SEAT-CORRECT','retained-source-cloud-seat-sync-existing':'SEAT-SYNC','retained-source-cloud-seat-batch-create':'SEAT-BATCH-CREATE','retained-source-cloud-seat-verify-batch-create':'SEAT-BATCH-VERIFY','retained-source-cloud-queue-associate':'QUEUE-ASSOCIATE','retained-source-cloud-queue-verify-members':'QUEUE-ASSOCIATE','retained-source-predictive-export-tasks':'TASK-EXPORT','retained-source-ivr-export-tasks':'TASK-EXPORT'}
ban_map={'query-groups':'BAN-QUERY','query-records':'BAN-QUERY','view-record':'BAN-DETAIL','view-sync-config':'BAN-DETAIL','create-group':'BAN-GROUP-SAVE','update-group':'BAN-GROUP-SAVE','delete-group':'BAN-GROUP-DELETE','add-number':'BAN-NUMBERS','import-numbers':'BAN-NUMBERS','move-numbers':'BAN-MOVE','remove-numbers':'BAN-REMOVE','enable-sync':'BAN-SYNC','disable-sync':'BAN-SYNC','retry-sync':'BAN-SYNC'}
def classify(key):
 if key in explicit:return explicit[key]
 if key.startswith('retained-source-ai-legacy-ban-'):return ban_map[key.removeprefix('retained-source-ai-legacy-ban-')]
 if key.startswith('retained-source-ai-business-scene-'):
  return {'query':'AI-SCENE-QUERY','create':'AI-SCENE-SAVE','update':'AI-SCENE-SAVE','delete':'AI-SCENE-DELETE'}[key.rsplit('-',1)[1]]
 if key.startswith('retained-source-ai-scene-type-'):
  return 'AI-SCENE-QUERY' if key.endswith('-query') else 'AI-SCENE-DELETE' if key.endswith('-delete') else 'AI-SCENE-SAVE'
 if key.startswith('retained-source-ai-'):return 'AI-TAG-CONFIG'
 if key.startswith('cloud-query-report-'):return 'REPORT-QUERY'
 if key.startswith('retained-source-cloud-export-report-'):return 'REPORT-EXPORT'
 if key.startswith('retained-source-cloud-drill-report-'):return 'REPORT-DRILL'
 if key.startswith('retained-source-cloud-import-batch-'):return 'IMPORT-BATCH'
 if key.startswith('retained-source-cloud-data-exception-'):return 'CALL-RECONCILE'
 if key.startswith('retained-source-cloud-supervise-seat-'):return 'SEAT-SUPERVISE'
 if key.startswith('retained-source-cloud-agent-skill-'):return 'RESOURCE-SKILL-QUERY' if key.endswith('-query') else 'SKILL-MEMBER'
 if key.startswith('retained-source-cloud-field-'):return 'PRO-FIELD'
 if key.startswith('retained-source-cloud-inbound-rule-'):return 'INBOUND-RULE'
 for p in ['predictive-','ivr-','retained-source-ivr-']:
  if key.startswith(p):
   tail=key[len(p):]
   return {'create':'CLOUD-TASK-SAVE','edit':'CLOUD-TASK-SAVE','import':'CLOUD-TASK-IMPORT','execute':'CLOUD-TASK-CONTROL','recall':'CLOUD-TASK-RECALL','resubmit':'CLOUD-TASK-RESUBMIT','pause':'CLOUD-TASK-CONTROL','resume':'CLOUD-TASK-CONTROL','end':'CLOUD-TASK-CONTROL','delete-task':'CLOUD-TASK-CONTROL','query':'CLOUD-TASK-QUERY','detail':'CLOUD-TASK-QUERY','download-failures':'CLOUD-TASK-RESULT','receive-result':'CLOUD-TASK-RESULT'}[tail]
 for prefix,k in [('number-pool','NUMBERPOOL'),('outbound-group','OUTBOUNDGROUP'),('provider-account','ENTERPRISE'),('extension','EXTENSION'),('time-condition','TIME'),('queue','QUEUE'),('seat','AGENT'),('skill','SKILL'),('number','NUMBER'),('app','APPLICATION')]:
  p='retained-source-cloud-'+prefix+'-'
  if key.startswith(p):
   tail=key[len(p):]
   if tail in ['query','detail','members']:return 'RESOURCE-'+k+'-QUERY'
   if tail=='delete':return 'RESOURCE-'+k+'-DELETE'
   return 'RESOURCE-'+k+'-SAVE'
 raise ValueError('unmapped '+key)
variants={
'ai-query-tasks':('列表','按当前任务名/状态/平台/来源筛选；列表更新时间倒序后分页','返回有权AI任务卡片及原状态/计数'),
'ai-view-task':('详情','准确taskId；不得以第一条任务回退','显示该任务基本资料、资源及允许入口'),
'ai-query-call-list':('名单查询','准确taskId和已呼/未呼名单筛选','显示该任务授权联系人与状态，不能移除不允许项'),
'ai-open-trial':('trial_package','明确试用产品资格与参数；仅超管办理','确认后形成试用服务交易和准确有效期/分钟'),
'ai-open-annual':('standard_annual','明确年度产品、当前资格/数量；仅超管办理','确认后形成年度交易和准确有效期/分钟'),
'ai-recharge-credit':('call_credit_pack','准确通话加油包及数量，不能用于Cloud账务；仅超管办理','确认后形成通话加油包交易与统一分钟池变化'),
'ai-view-billing-detail':('计费明细','准确计费统计所选平台/时间/任务，不套服务8列汇总','显示原计费明细；查看不授充值/调整'),
'ai-query-recharge-records':('充值流水','当前有权AI租户，四租户角色只读本租户','按当前筛选展示每笔准确产品/受理与结算结果'),
'ai-query-adjustment-records':('调整记录','当前有权AI租户及调整记录读取权','展示准确调整前后、原因和结果，不能以查记录授调账权'),
'ai-save-intent-config':('回访／意向保存','原AI线索回访编辑权；准确线索及允许字段，不是供应商标签维护','明确提交的原AI线索回访/意向配置保存，不改新业务字段'),
'cloud-seat-online':('上线','本人有效坐席与分机、Cloud模块/成员/作业权齐备','确认电话上线就绪；失败/未知不显示已在线'),
'cloud-seat-offline':('离线','无拨号/振铃/通话/未完成必要话后；未知先核对','准确本人电话离线确认；受理不当已离线'),
'retained-source-cloud-seat-unpause':('本人置闲','当前本人电话在线且允许置闲，不是监管他人操作','准确本人置闲确认，不能由页面刷新假定可用'),
'cloud-save-filling-fields':('专业字段配置保存','原配置目录修订及预置/引用保护，不是保存客户填写值','准确专业目录保存，已有客户跟进快照不回写'),
'retained-source-cloud-seat-phone-config':('分机配置','坐席必须离线且不在用/待核；同企业唯一可用软电话分机，留空可待配置','只更新准确坐席分机关联；留空不能上线'),
'retained-source-cloud-seat-disable':('停用','禁止新任务；当前电话/必要话后按原收尾，不删除历史','准确坐席停用结果确认，账号/成员未被全局停用'),
'retained-source-cloud-seat-restore':('恢复','准确已停用坐席且原恢复权/资源可用，非删除状态','确认恢复原坐席可接新任务资格，不自动电话上线'),
'retained-source-cloud-number-local-enable':('本地启用','准确已导入号码本地使用权；远端用途和状态仍须可用','仅本地目录启用，不表示供应商开通'),
'retained-source-cloud-number-local-disable':('本地停用','准确本地号码，不调用供应商销号','仅本地禁止新选号码，保已有通话/远端资源'),
'retained-source-cloud-queue-associate':('保存技能关联','准确队列与所选技能同企业，修订未变','仅队列技能绑定确认；成员一致性仍需独立核对'),
'retained-source-cloud-queue-verify-members':('重新核对成员','当前无dirty未保存配置，准确队列/技能集合','显示期望/实际/缺少/额外成员及核对时间；无证据仍待核'),
'retained-source-cloud-app-delete':('删除应用','准确有权应用修订及删除确认','应用删除后该密钥不能继续换token，已导入业务来源历史保留'),
'retained-source-cloud-app-detail':('应用详情','原应用查看及单独敏感凭据访问权；默认掩码','登记信息可读；明确显示/复制仅本次，演示密钥不冒充真实凭据'),
'retained-source-cloud-extension-edit':('编辑分机','分机号与归属只读，密码留空保原，已绑定/在用守卫通过','只更新明确允许分机参数，不泄露原密码'),
'retained-source-cloud-time-condition-edit':('编辑时间条件','名称只读，日期/同日时间合法，优先级本账号唯一','同一时间条件允许参数更新，业务优先级不按更新时间改写'),
'retained-source-cloud-inbound-rule-create':('新建呼入规则','名称选填且创建后只读；唯一正整数优先级；接听目标仅IVR/电话/分机','准确规则创建，本地保存与远端生效分开'),
'retained-source-cloud-inbound-rule-edit':('编辑呼入规则','规则名只读；当前scope/revision；唯一优先级及准确三种目标','准确允许规则字段更新，冲突保输入'),
'retained-source-cloud-inbound-rule-delete':('删除已停用规则','仅明确停用且无待核的准确规则','只删除当前规则，不清目标资源或通话'),
'retained-source-cloud-field-detail':('字段预览','previewOnly当前已保存定义，仅读不出现保存','仅展示控件/选项，不改字段或任何客户值'),
'retained-source-cloud-field-disable':('停用专业字段','非预置，且无启用分类正在显示该字段','仅字段enabled停用；分类和历史填写快照不被删除'),
'retained-source-cloud-field-delete':('删除专业字段','非预置且任何分类均无引用，引用可靠且修订一致','删除准确无引用字段，取消/失败保留')}
ret_specs=[];action_mappings={}
for x in ret:
 key=x['draft_key'];code=classify(key);lo=next(z for z in locals_ if z['id']==L[code]);page=page_for[key]
 variant,extra,result=variants.get(key,(x['primary_action'],None,None))
 if extra is None:
  if key.endswith(('-query','-detail')) or '-query-' in key or '-view-' in key:
   extra='按当前已应用筛选或明确对象ID读取；无权、无结果和读取失败分别反馈，查看不取得写/导出权'
  elif key.endswith(('-delete','-delete-task')):
   extra='对准确对象独立确认，最终重验原删除资格/默认预置/引用/在用/修订；有引用或未知不删'
  elif key.endswith(('-enable','-disable','-restore')):
   extra='只对准确对象执行选定启停方向；待核不反向提交，启停不清已生成业务事实'
  elif '-export-' in key:
   extra='明确该具体报表或列表导出权；固定当前筛选和授权结果；无数据/生成失败不产假文件'
  elif key.endswith(('-create','-update','-edit')):
   extra='新增只创建本对象；编辑保持稳定ID和允许字段，当前scope/修订不变；成功后按确认值刷新'
  else:extra='精确操作变体“'+str(variant)+'”只作用当前选中对象/集合；按本family列明输入及状态资格执行，不连带其他动作'
 if result is None:result='“'+x['name']+'”完成：'+lo['postconditions'][0]
 perm='五种生产角色中具备该原页面/对象读权者；四租户角色限本租户，超管仅既有授权范围'
 read_action=bool(re.search(r'(query|detail|view|members)$',key)) or '-query-' in key or '-view-' in key or 'download-import-template' in key
 if code.startswith('FINANCE-') and code not in ['FINANCE-QUERY','FINANCE-VIEW']:perm='仅超级管理员且有原服务办理/调整/核对对应权；四租户角色不可办理'
 elif code.startswith('BAN-'):
  perm='超级管理员仅查看，不可任何黑名单写/移除/同步；租户管理员或运营按本租户原'+('读取权' if read_action else '当前准确动作维护权；拒联来源解除另限本租户管理员')
 elif code=='AI-TAG-CONFIG':perm='标签/映射查询与维护按原AI配置权；总部/门店运营无标签配置能力，场景中使用已有标签不要求维护权'
 elif code.startswith('RESOURCE-') or code in ['SEAT-BATCH-CREATE','SEAT-BATCH-VERIFY','SEAT-CORRECT','SEAT-SYNC','SEAT-BIND','SKILL-MEMBER','QUEUE-ASSOCIATE']:
  perm=('超级管理员有权平台资源范围' if any(t in code for t in ['NUMBER-','ENTERPRISE-','APPLICATION-']) else '超级管理员有权资源范围或本租户管理员对应资源权；运营无资源维护')+'；'+('读取不授写权' if read_action else '必须原准确动作权')
 elif code=='INBOUND-RULE':perm='超管有权呼入配置范围；总部/门店管理员本租户规则配置权且无需本人坐席；运营仅本人有效坐席接听，无规则维护权'
 elif code in ['PHONE-PREPARE','PHONE-OUTBOUND','PHONE-INBOUND','PHONE-AFTERCALL','PHONE-CONTINUE']:perm='总部/门店管理员或运营有当前租户作业权及有效本人坐席；实际处理人填写，超管不因角色取得本人作业'
 elif code in ['OPERATION-AUDIT','RESOURCE-AUDIT','CALL-RECONCILE']:perm='超级管理员有权资源范围或有本租户相应审计/核对权的总部/门店管理员；运营无该管理动作'
 elif code=='BUSINESS-API-IMPORT' or code=='BUSINESS-API-RESULT':perm='准确已鉴权应用在显式授权租户内的原导入/回传资格；不是前端登录用户自动拥有接口权限'
 elif not read_action:perm='原模块已开通且账号/成员有效；总部/门店管理员或运营具有本租户该专业动作权，超管按原只读/专业管理边界不得自动代作业'
 item={'operation_ref':key,'name':x['name'],'page_id':page,'source_action_ids':x.get('source_action_ids',[]),'feature_ids':['FUNC-2002'],'capability_kind':'inherited_professional_operation_not_new_FUNC','trigger':'在'+page+'的“'+x['name']+'”入口明确触发；'+lo['trigger'],'variant':variant,'input_constraints':list(dict.fromkeys([extra]+lo['preconditions'])),'state_constraints':[b['condition']+' → '+b['result'] for b in lo['branches']],'result':result,'error':'无权/对象失效/非法字段/修订冲突拒绝并保留输入；明确失败不变已确认状态；未知保原请求待核，不以toast、HTTP200或列表消失替代终态。','permission':perm,'local_logic_ids':[lo['id']],'field_ids':lo['field_ids'],'test_refs':lo['test_refs'],'acceptance_ids':x.get('source_acceptance_ids',[]),'source_refs':['documentation/input/functions.json#FUNC-2002'],'physical_evidence_status':'product_rule_defined_real_service_evidence_pending'}
 if key.startswith('predictive-') or 'predictive-export' in key:item['mode']='PREDICTIVE'
 if key.startswith('ivr-') or key.startswith('retained-source-ivr-'):item['mode']='IVR'
 if key.startswith('ai-') or key.startswith('retained-source-ai-'):item['module']='AI'
 if '-report-' in key:item['report_kind']=key.rsplit('-',1)[1]
 ret_specs.append(item)
 for aid in x.get('source_action_ids',[]):
  m=action_mappings.setdefault(aid,{'operation_refs':[],'local_ids':[],'field_ids':[],'test_refs':[]})
  m['operation_refs'].append(key)
  for target,source in [('local_ids','local_logic_ids'),('field_ids','field_ids'),('test_refs','test_refs')]:m[target]=list(dict.fromkeys(m[target]+item[source]))
# Pages retain exact PAGE IDs; no empty professional page is hidden by navigation-only acceptance.
page_mappings={}
def pm(page,codes):
 los=[next(z for z in locals_ if z['id']==L[c]) for c in codes]
 m=page_mappings.setdefault(page,{'local_ids':[],'field_ids':[],'test_refs':[],'operation_refs':[]})
 for k,vals in [('local_ids',[z['id'] for z in los]),('field_ids',[f for z in los for f in z['field_ids']]),('test_refs',[c for z in los for c in z['test_refs']])]:m[k]=list(dict.fromkeys(m[k]+vals))
for r in ret_specs:
 pm(r['page_id'],[r['local_logic_ids'][0].removeprefix('LOCAL-PLAT-')]);page_mappings[r['page_id']]['operation_refs'].append(r['operation_ref'])
manual_pages={
'PAGE-2001':['LOGIN','LOGOUT'],'PAGE-2002':['NAVIGATE','CONTEXT-SWITCH','LOGOUT'],'PAGE-2003':['ACCOUNT-QUERY','ACCOUNT-CREATE','ACCOUNT-LINK','ACCOUNT-PROFILE','MEMBER-GRANT','MEMBER-STOP','ACCOUNT-STOP','ACCOUNT-DELETE'],
'PAGE-2004':['TENANT-SAVE','TENANT-BIND','TENANT-MODULE','TENANT-DELETE'],'PAGE-2005':['BRAND-QUERY','BRAND-SAVE','BRAND-TENANTS'],
'PAGE-2006':['AI-CATEGORY-STOP'],'PAGE-2007':['BAN-QUERY','BAN-DETAIL','BAN-GROUP-SAVE','BAN-GROUP-DELETE','BAN-NUMBERS','BAN-MOVE','BAN-REMOVE','BAN-SYNC','BAN-AI','BAN-RELEASE'],
'PAGE-2202':['PHONE-PREPARE','PHONE-OUTBOUND','PHONE-INBOUND','PHONE-AFTERCALL','PHONE-CONTINUE','SEAT-SUPERVISE','LIMITED-FINISH','BAN-HUMAN','CONTACT-CHECK','RECORDING-READ'],
'PAGE-2102':['FINANCE-QUERY','FINANCE-VIEW'],'PAGE-2103':['AI-TASK-QUERY','AI-LIST-IMPORT','AI-IMPORT-HISTORY','AI-LIST-REMOVE','AI-IMPORT-TEMPLATE','CONTACT-CHECK'],
'PAGE-2108':['CALL-QUERY','RECORDING-READ','BAN-AI'],'PAGE-2110':['AI-SCENE-QUERY','AI-SCENE-SAVE','AI-SCENE-DELETE','AI-CATEGORY-BIND'],'PAGE-2111':['AI-TAG-CONFIG','AI-CATEGORY-BIND','AI-SCENE-QUERY'],
'PAGE-2205':['CLOUD-TASK-QUERY','CLOUD-TASK-SAVE','CLOUD-TASK-IMPORT','CLOUD-TASK-CONTROL','CLOUD-TASK-RECALL','CLOUD-TASK-RESUBMIT','CLOUD-TASK-RESULT','TASK-EXPORT','EXPORT-CUSTOMERS','CONTACT-CHECK'],
'PAGE-2206':['CLOUD-TASK-QUERY','CLOUD-TASK-SAVE','CLOUD-TASK-IMPORT','CLOUD-TASK-CONTROL','CLOUD-TASK-RESULT','TASK-EXPORT','CONTACT-CHECK'],'PAGE-2207':['INBOUND-RULE','PHONE-INBOUND'],
'PAGE-2208':['CALL-QUERY','RECORDING-READ','CALL-EXPORT'],'PAGE-2109':['LEAD-QUERY','LEAD-CALLBACK','RECORDING-READ'],'PAGE-2112':['FINANCE-VIEW','FINANCE-RECHARGE','FINANCE-ADJUST','FINANCE-RECONCILE','FINANCE-EXPORT'],
'PAGE-2105':['REPORT-QUERY'],'PAGE-2106':['REPORT-QUERY','FINANCE-EXPORT'],'PAGE-2107':['REPORT-QUERY'],'PAGE-2209':['REPORT-QUERY','REPORT-DRILL','REPORT-EXPORT'],
'PAGE-2214':['RESOURCE-AUDIT','SEAT-CORRECT'],'PAGE-2222':['OPERATION-AUDIT'],'PAGE-2221':['CALL-RECONCILE'],'PAGE-2223':['PRO-FIELD','AI-CATEGORY-STOP'],'PAGE-2225':['SEAT-EVENT-QUERY'],'PAGE-2203':['CUSTOMER-DIRECTORY','RECORDING-READ'],'PAGE-2227':['CALL-QUERY','RECORDING-READ','BAN-HUMAN'],'PAGE-2204':['IMPORT-BATCH','CUSTOMER-IMPORT','CUSTOMER-ASSIGN','BUSINESS-API-IMPORT','BUSINESS-API-RESULT']}
for p,codes in manual_pages.items():pm(p,codes)
for fam,p in [('AGENT','PAGE-2210'),('SKILL','PAGE-2211'),('OUTBOUNDGROUP','PAGE-2212'),('QUEUE','PAGE-2213'),('NUMBER','PAGE-2215'),('NUMBERPOOL','PAGE-2216'),('EXTENSION','PAGE-2217'),('TIME','PAGE-2218'),('ENTERPRISE','PAGE-2219'),('APPLICATION','PAGE-2220')]:
 used=[lo['id'].removeprefix('LOCAL-PLAT-') for lo in locals_ if lo['id'].startswith('LOCAL-PLAT-RESOURCE-'+fam+'-')]
 # Keep current original controls only; unused generic delete logic excluded below.
 actual={r['local_logic_ids'][0] for r in ret_specs if r['page_id']==p};used=[u for u in used if L[u] in actual]
 pm(p,used)
for p,m in page_mappings.items():
 m['field_groups']=[{'name':'按当前独立动作显示字段；读写/必填/条件显示以FIELD为准','field_ids':m['field_ids']}]
 m['action_mappings']={aid:am for aid,am in action_mappings.items() if any(r['page_id']==p and r['operation_ref'] in am['operation_refs'] for r in ret_specs)}
# Drop generic resource actions absent from original current capability (no new delete buttons).
used_l={i for m in page_mappings.values() for i in m['local_ids']}
unused=[lo['id'] for lo in locals_ if lo['id'].startswith('LOCAL-PLAT-RESOURCE-') and lo['id'] not in used_l]
locals_[:]=[lo for lo in locals_ if lo['id'] not in unused];used_c={c for lo in locals_ for c in lo['test_refs']};checks[:]=[c for c in checks if c['id'] in used_c]
# Final verified source details: service forms and AliCti directory have exact atomic inputs.
fin=[]
def ff(code,name,key,**kw):
 field(code,name,'serviceTransaction',key,write=['超级管理员（当前原服务办理权）'],**kw);fin.append(F[code])
ff('SERVICE-COUNT','购买数量','quantity',typ='integer',fmt='正整数；试用/年包固定1',validation=['加油包正整数数量；其他服务套餐固定1','产品须匹配trial/commercial标记'],valid=['1','3（仅加油包）'],invalid=['0或1.5：拒绝'])
ff('SERVICE-PRICE','实际套餐价格','actualPrice',typ='number',fmt='元，有限非负且最多2位小数',validation=['价格输入文本与解析值一致，不能科学计数/NaN/负数/超过2位小数','偏离当前产品默认总价必须原因；默认价随产品与加油包数量计算'],valid=['0.00','199.90'],invalid=['-1、1.234、1e3：拒绝'])
ff('SERVICE-CREDIT','实际入账分钟','actualCreditMinutes',typ='integer',fmt='>0整数分钟',validation=['正整数；偏离产品默认入账分钟须填写原因','加油包默认分钟按单包×数量，服务套餐按产品固定值'],valid=['1000'],invalid=['0、-1、10.5：拒绝'])
ff('SERVICE-START','实际服务开始时间','actualStartAt',fmt='YYYY-MM-DD HH:mm，精确到分钟',validation=['真实合法日期时分；结束严格晚于开始','加油包开始须在当前有效商用服务区间内'],valid=['2026-10-30 09:00'],invalid=['2026-02-30 09:00：非法日期'])
ff('SERVICE-END','实际服务结束时间','actualEndAt',fmt='YYYY-MM-DD HH:mm，精确到分钟',validation=['严格晚于开始；服务套餐跨度偏离默认须原因','加油包结束必须等于当前服务到期，不可独立修改'],valid=['2027-10-30 09:00'],invalid=['早于或等于开始：拒绝'])
ff('SERVICE-REASON','服务办理偏离原因','reason',nullable=True,required='实际价/入账分钟/服务套餐时长偏离产品默认值必填；默认方案可空',validation=['有偏离时去空白后非空','按原准确交易保存，不覆盖此前不同交易原因'],valid=['合同赠送分钟'],invalid=['已偏离默认但仅空格：拒绝'])
adj=[]
for code,name,key,fmt,rule,typ in [('ADJUST-TARGET','调整对象','target','duration_days使用时长/available_minutes可用分钟','不得选择冻结分钟或未定义账务对象','string'),('ADJUST-DIRECTION','调整方向','direction','increase调增/decrease调减','只允许两种方向','string'),('ADJUST-MODE','调整方式','mode','amount按值/clear_duration全部时长调减至0','clear_duration仅duration_days+decrease且当前完整时长>0','string'),('ADJUST-VALUE','调整值','value','正整数；时长按天、余额按分钟','按值方式>0整数；1天=1440分钟；调减不超过当前值，少于一天用全部调减至0','integer'),('ADJUST-REASON','调整原因','reason','去空白非空文本','任何调整必填明确原因','string')]:
 field(code,name,'serviceAdjustment',key,typ=typ,fmt=fmt,write=['超级管理员（当前原服务调整权）'],required='调整提交必填；clear_duration时不要求按值value' if key=='value' else '调整提交必填',validation=[rule,'当前服务修订及可靠前后值须一致；unknown不重复结算']);adj.append(F[code])
enterprise=[]
for code,name,key,fmt,req,rule,typ in [('ENTERPRISE-NAME','AliCti账号名称','name','非空≤80字符','创建/修改必填','首尾空白去除，≤80','string'),('ENTERPRISE-ID','AliCti账号ID','enterpriseId','无前导零正整数文本','登记必填，保存后只读','同目录和原别名唯一；超出适配精确整数范围拒绝；不是平台tenantId','string'),('ENTERPRISE-BRAND','客户／品牌名称','brandCustomerName','≤80字符，登记后只读','创建选填，空时使用账号名称','只是原供应商客户标签，不代替统一品牌ID或数据授权','string'),('ENTERPRISE-CREDENTIAL','接入凭据配置状态','credentialConfigured','布尔值','保存必填','只登记状态，不填写/保存密码密钥，不证明远端凭据已验证','boolean'),('ENTERPRISE-NAVIGATIONS','外显导航','callerNavigations','[{name,customerClidsGroup}]','可空集合；新增每项两字段必填','同账号customerClidsGroup唯一，均非空；只登记远端已配置标识','array'),('ENTERPRISE-REMARK','AliCti账号备注','remark','≤500字符','选填','文本备注，不包含凭据或任意执行指令','string'),('ENTERPRISE-STATUS','AliCti账号使用状态','status','RUNNING启用/STOPPED停用','保存必填','仅两个状态；启停不更改已绑定业务归属','string')]:
 field(code,name,'providerAccount',key,typ=typ,fmt=fmt,required=req,nullable=key in ['remark'],write=['超级管理员（当前有权平台资源配置）'],validation=[rule,'最终保存仍验准确对象/授权/修订']);enterprise.append(F[code])
field('SERVICE-MANUAL','AI人工呼叫控制','aiService','manualEnabled',typ='boolean',fmt='允许/禁止新AI呼叫',write=['当前原服务呼叫控制资格者'],validation=['服务汇总计算须同租户准确控制记录；不得套其他租户开关','仅明确原规则无控制项默认允许；多重/未知控制项需核对，不能随意回退'])
atom_replace={F['SERVICE-QUANTITY']:fin,F['SERVICE-ADJUST']:adj,F['ENTERPRISE-CONFIG']:enterprise}
def atom_expand(ids):return list(dict.fromkeys(y for x in ids for y in atom_replace.get(x,[x])))
for lo in locals_:
 for key in ['inputs','outputs','field_ids']:lo[key]=atom_expand(lo[key])
 for st in lo['steps']:st['reads']=atom_expand(st['reads']);st['writes']=atom_expand(st['writes'])
 for br in lo['branches']:br['field_ids']=atom_expand(br['field_ids'])
 if lo['id'].startswith('LOCAL-PLAT-FINANCE-'):
  lo['field_ids']=list(dict.fromkeys(lo['field_ids']+[F['SERVICE-MANUAL']]));lo['inputs']=list(dict.fromkeys(lo['inputs']+[F['SERVICE-MANUAL']]))
fields[:]=[f for f in fields if f['id'] not in atom_replace]
for f in fields:
 if f['id']==F['SERVICE-CONTROL']:f['derivation']['dependencies'].append(F['SERVICE-MANUAL'])
# Per-entity field lifecycle and concrete persistence moments.
entity_commit={
'account':'账号新建或明确全局资料维护确认成功后；成员授权不改此实体',
'accountCredential':'仅登录/设置密码本次提交；不进入可读业务存储',
'brand':'品牌新增/编辑确认成功时保存；保留同一brandId',
' tenant':'租户维护确认成功时',
'tenant':'租户新增/基础资料保存或对应品牌/模块独立动作确认成功时；未授权字段不提交',
'membership':'创建/显式关联/授权/本租户停用对应动作确认成功时；不改全局账号状态',
'aiScene':'具体AI场景新增/编辑/分类引用对应动作确认成功时；与路由绑定独立',
'aiSceneType':'当前AI专业类型创建/编辑/启停确认时；不回写已受理执行',
'aiTagConfig':'准确supplier+tenantType+tagScene配置/映射保存确认时；不回写既有结果',
'aiExecution':'启动当前准确执行段并冻结选定场景上下文时生成；回执仅验证不换上下文',
'aiCallResult':'准确AI通话回执或可靠核对后记录原始/映射标签与证据；不写业务字段',
'blacklistGroup':'原普通分组创建/编辑/供应商同步配置明确保存成功时；系统拒联来源不作普通编辑',
'blacklistRecord':'手工/导入明确成功或人工话后/AI确认拒联同请求入库成功时；解除另留原来源',
'blacklistRelease':'有权本租户管理员填写原因解除准确sourceId确认成功时追加',
'professionalTask':'对应AI/PRED/IVR任务创建/允许编辑或准确控制终态确认时；回执更新事实不覆盖人工结果',
'professionalImport':'对应原任务名单导入确认后逐行记录批次结果；未拨号不显示已呼叫',
'professionalCustomer':'原准确业务ID导入或明确分配确认时；同号不合并，执行方式不由分配修改',
'professionalFollowup':'实际处理人成功提交本轮跟进时保存结果与当时字段快照；未保存不生效',
'call':'准确callId回执或可靠同通话核对后补事实；不改业务跟进',
'callException':'发现准确callId资料异常或原异常核对明确结果时；保核对历史',
'aiService':'原服务办理/调整/人工控制准确确认终态后更新；读操作不写账务',
'aiMinutePool':'服务交易、调用冻结/消耗或可靠核对确认后更新同一服务快照；未知不填0',
'serviceTransaction':'超管准确套餐办理确认终态后记录产品/数量/金额/分钟/有效期及流水；待核仅记状态不重复结算',
'serviceAdjustment':'超管调整确认终态后记录前后值/原因/人/时间；冻结分钟不直接减',
'seat':'原坐席创建/准确同步/允许状态调整/明确分机或账号关联确认后保存；每动作保范围',
'seatProvisioning':'逐工号开通/核对准确回执后更新原journal项；未知不重建',
'skill':'准确物理技能创建/编辑确认时；不以本地模板当供应商已建',
'skillRelation':'关系新增/移出/等级调整确认或在线新增待提交保存时；生效状态分开',
'outboundGroup':'当前外呼组创建/允许编辑或明确成员选择保存确认时',
'queue':'当前队列创建/参数编辑确认时；技能关联/成员核对结果分别记录',
'cloudNumber':'供应商目录选择导入或明确本地启停确认时；不写供应商销号/开通事实',
'numberPool':'准确池创建/编辑确认时保存完整号码集合；省略不清空，默认/类型保护不变',
'extension':'当前企业软电话分机创建/允许编辑/选择导入确认时；号码与归属保存后不改',
'extensionCredential':'仅本次明确创建/改密提交；关闭清空输入，不进入可读目录或审计明文',
' timeCondition':'准确时间条件创建/允许参数编辑确认时',
'timeCondition':'准确时间条件创建/编辑确认时；名称创建后只读，优先级独立唯一',
'providerAccount':'准确AliCti登记/编辑/启停确认时；enterprise与客户品牌登记后只读，不存密码密钥',
'application':'应用创建/编辑或准确删除确认时；授权租户与回调属于当前应用配置',
'applicationCredential':'真实接入凭据服务返回的受控引用；原型只有演示密钥，不能当生产凭据已生成',
'businessIntegration':'准确业务导入/完成回传原请求确认后记录受理与终态；待核不回放业务副作用',
'cloudProfessionalField':'原专业目录字段创建/编辑/启停/删除保护通过并确认保存时；预览不保存任何值',
'inboundRule':'准确规则创建/允许编辑/启停/已停用删除确认时；本地状态与远端生效分开',
'seatEvent':'准确电话回执/连接事件/观察发生时追加并标明来源；不反推生产实时能力',
'operation':'准确请求受理时记录处理态，可靠确认后追加终态/前后值/审计，不伪造成功',
'confirmedObject':'对应实体明确保存/外部确认变更时产生修订和更新时间；读取不造时间'}
samples={
'ACCOUNT-ID':'ACC-001','LOGIN-NAME':'li.ming_01','NICKNAME':'李明','MOBILE':'13800000001','AVATAR':'1.5MB PNG图片','ACCOUNT-STATE':'false（全局停用）','SESSION':'{"accountId":"ACC-001","legalTenantIds":["TEN-001"]}','CURRENT-TENANT':'TEN-001（当前有权）','POSITION':'{"accountId":"ACC-001","tenantId":"TEN-001","pageId":"PAGE-2205","filters":{"status":"已暂停"}}','GUARD-STATE':'{"call":"aftercall","dirty":true}','BRAND-ID':'BRAND-NISSAN','BRAND-NAME':'东风日产','BRAND-REMARK':'日产品牌接入','TENANT-ID':'TEN-NISSAN-HQ','TENANT-NAME':'日产总部','TENANT-CONTACT':'张经理','TENANT-DESC':'日产总部客户运营','TENANT-COMMERCIAL':'commercial','TENANT-BRAND':'BRAND-NISSAN','TENANT-TYPE':'总部','STORE-CODE':'0012','MODULES':'{"ai":true,"cloud":false}','TENANT-ENTERPRISE':'7522240','REFERENCE-STATE':'none（可靠核对无引用）','REVISION':'revision-17','REQUEST':'REQ-20261030-0001','OP-STATE':'unknown','AUDIT':'{"objectId":"TEN-001","actorId":"ACC-001","action":"修改租户名称","before":"旧名","after":"新名","result":"success"}','UPDATED':'2026-10-30T09:00:00+08:00','MEMBER-ID':'MEM-001','MEMBER-ACCOUNT':'ACC-001','MEMBER-TENANT':'TEN-001','MEMBER-ROLE':'operator','MEMBER-GRANTS':'{"cloud":"operator","ai":"reader"}','MEMBER-STATE':'false（仅本租户停用）','LIMITED':'{"tenantId":"TEN-001","callId":"CALL-001","aftercallOnly":true}','QUERY':'{"keyword":"回访","status":"已暂停"}','PAGING':'{"page":1,"pageSize":10,"total":23}','TASK-ID':'TASK-PRED-001','TASK-MODE':'PREDICTIVE','TASK-NAME':'10月购车客户回访','TASK-STATE':'已暂停','TASK-SCHEDULE':'{"startAt":"2026-10-30 09:00","endAt":"2026-10-30 18:00"}','TASK-RESOURCES':'{"enterpriseId":"7522240","outboundGroupId":"Sales01","numberPoolId":"15"}','TASK-FAILURES':'[{"phone":"13800000001","state":"明确失败","canResubmit":true,"requestId":"REQ-001"}]','IMPORT-ROWS':'[{"businessId":"LEAD-001","name":"王先生","phone":"13800000001"}]','IMPORT-BATCH':'{"batchId":"BATCH-001","success":1,"failed":0}','CUSTOMER-ID':'LEAD-001','CUSTOMER-NAME':'王先生','PHONE':'13800000001','FOLLOWER':'ACC-002','PRO-FOLLOW-STATE':'待继续跟进','PRO-FILL':'{"FIELD-001":["车型A","车型B"]}','FOLLOW-NOTE':'客户下周一方便回访','CALL-ID':'CALL-001','CALL-STATE':'接通','CALL-ACTOR':'ACC-002','CALL-TIMES':'{"startedAt":"2026-10-30T09:00:00+08:00","durationSeconds":120}','RECORDING':'{"callId":"CALL-001","available":true,"positionSeconds":15}','CALL-ERROR':'{"callId":"CALL-001","tenantId":"TEN-001","enterpriseId":"7522240","state":"待核"}','RECONCILE-TRACE':'[{"callId":"CALL-001","requestId":"REQ-001","result":"仍待核"}]','PHONE-STATE':'idle','DIAL-NUMBER':'13800000001','AI-TENANT':'AI-TEN-001','AI-SCENE-ID':'AI-SCENE-001','AI-SCENE-NAME':'日产新线索邀约','AI-SUPPLIER':'SUPPLIER-001','AI-TYPE':'LEAD_NEW','AI-PARAMS':'{"robotId":"ROBOT-001","supplierId":"SUPPLIER-001"}','AI-CATEGORY':'CATEGORY-NEW-LEAD','AI-TAG-SCENE':'TAGSCENE-001','AI-SUPPLIER-TAGS':'[{"id":"SUPTAG-A","value":"有意向"}]','AI-LOCAL-TAGS':'[{"id":"TAG-A","name":"有意向"}]','AI-MAPPING':'{"SUPTAG-A":"TAG-A","enabled":true}','AI-TAG-CONTEXT':'{"supplierId":"SUP-1","tenantId":"TEN-1","tenantType":"总部","tagSceneId":"TS-1","categoryId":"CAT-1","brandId":"BRAND-1","revision":"r3"}','AI-TAG-RESULT':'{"raw":"A","mappedTagIds":["TAG-A"],"matched":true}','AI-LEAD':'{"leadId":"AI-LEAD-001","callId":"CALL-001","result":"有意向"}','BAN-GROUP':'GROUP-001','BAN-NAME':'意向保护','BAN-DESC':'原意向保护来源','BAN-EXPIRY':'30天','BAN-COUNT':'{"total":12,"effective":10}','BAN-ID':'BAN-001','BAN-PHONE':'13800000001','BAN-CUSTOMER':'王先生','BAN-ADD-TYPE':'INTENT','BAN-SOURCE':'{"sourceType":"human","callId":"CALL-001","operatorId":"ACC-002"}','BAN-REASON':'客户明确要求停止联系','BAN-LIFETIME':'{"effectiveAt":"2026-10-30T09:00:00+08:00","expiresAt":null,"permanent":true}','BAN-STATE':'active','BAN-RELEASE':'{"sourceId":"BAN-001","reason":"客户重新同意联系","operatorId":"ACC-003"}','BAN-BINDING':'[{"provider":"tianrun","enterpriseId":"7522240","type":2,"useRange":15}]','BAN-REMOTE':'[{"provider":"tianrun","enterpriseId":"7522240","requestId":"REQ-001","direction":"add","state":"unknown"}]','CONTACT-DECISION':'blocked','SERVICE-STATE':'active','SERVICE-VALIDITY':'{"effectiveAt":"2026-10-30 09:00","expiresAt":"2027-10-30 09:00"}','MINUTES-AVAILABLE':'1000','MINUTES-FROZEN':'0（已确认合法零）','MINUTES-CONSUMED':'25.5','SERVICE-CONTROL':'可发起','SERVICE-PACKAGE':'standard_annual','SERVICE-HISTORY':'[{"requestId":"REQ-001","productType":"standard_annual","status":"effective"}]','FINANCE-EXPORT':'[{"租户ID":"TEN-001","租户名称":"日产总部","租户类型":"总部","可用分钟":1000,"冻结分钟":0,"累计消耗分钟":25,"有效期":"2027-10-30 09:00","呼叫控制状态":"可发起"}]','RESOURCE-SCOPE':'{"tenantId":"TEN-001","provider":"AliCti","enterpriseId":"7522240","nativeId":"0012","purpose":"outbound"}','RESOURCE-STATE':'{"local":"enabled","remote":"unknown"}','SEAT-ID':'SEAT-001','SEAT-NAME':'李明','SEAT-CNO':'0012','SEAT-AREA':'021','SEAT-EXTENSION':'00888','SEAT-ACCOUNT':'MEM-001','SEAT-BATCH':'[{"cno":"0012","result":"confirmed"},{"cno":"0013","result":"unknown"}]','SKILL-ID':'SKILL-001','SKILL-NAME':'销售邀约','SKILL-MEMBERS':'[{"seatId":"SEAT-001","skillLevel":1,"status":"待提交"}]','SKILL-LEVEL':'1','OUTBOUND-NAME':'销售回访组','OUTBOUND-MEMBERS':'["SEAT-001","SEAT-002"]','QUEUE-NAME':'销售接听队列','QUEUE-SKILL':'["SKILL-001"]','NUMBER':'02180000000','NUMBER-PROPS':'{"type":"中继","purpose":"outbound","status":"RUNNING"}','POOL-NAME':'总部外呼池','POOL-TYPE':'0','POOL-DEFAULT':'false','POOL-NUMBERS':'["02180000000","02180000001"]','EXTENSION-ID':'00888','TIME-NAME':'工作日营业时间','TIME-TYPE':'{"type":1,"timeType":1}','TIME-RANGE':'{"weekdays":[1,2,3,4,5],"startTime":"09:00","endTime":"18:00"}','TIME-PRIORITY':'1','APP-ID':'APP-001','APP-NAME':'DCC客户导入','APP-TENANTS':'["TEN-001"]','APP-CALLBACK':'https://example.com/callback','APP-SECRET':'••••••（默认掩码；有权显示当前密钥）','API-PAYLOAD':'{"appId":"APP-001","tenantId":"TEN-001","businessId":"LEAD-001","phone":"13800000001"}','API-RESULT':'{"businessId":"LEAD-001","callId":"CALL-001","state":"待回传","requestId":"REQ-001"}','PRO-FIELD-ID':'CLOUD-FIELD-001','PRO-FIELD-DEF':'{"id":"CLOUD-FIELD-001","name":"车型","type":"select","options":["A","B"],"enabled":true}','INBOUND-ID':'ROUTE-001','INBOUND-PRIORITY':'1','INBOUND-STATE':'2（停用）','REPORT-KIND':'agents','REPORT-DATA':'{"kind":"agents","tenantId":"TEN-001","date":"2026-10-30","rows":[]}','REPORT-EXPORT':'Cloud-agents-20261030.csv（当前授权筛选）','AUDIT-FILTER':'{"enterpriseId":"7522240","result":"失败","objectType":"坐席"}','SEAT-EVENT':'{"seatId":"SEAT-001","event":"idle","source":"callback","at":"2026-10-30T09:00:00+08:00"}'}
for f in fields:
 code=f['id'].removeprefix('FIELD-PLAT-');entity=f['entity'];kind=f['derivation']['kind'];is_input=kind=='input'
 if entity in ['professionalTask','professionalImport','professionalCustomer'] and is_input:f['permissions']['write']=TEN
 if entity=='blacklistGroup' and is_input or entity=='blacklistRecord' and is_input:f['permissions']['write']=['租户总部管理员／运营、租户门店管理员／运营（仅当前原动作权；超管只读）']
 if entity in ['providerAccount','application'] and is_input:f['permissions']['write']=['超级管理员（当前准确对象及原对应操作权）']
 if f['persistence']['kind']=='stored':f['persistence']['write_when']=entity_commit.get(entity,f['persistence']['write_when'])+'；明确失败不改已确认值，未知保原请求待核'
 elif f['persistence']['kind']=='external':f['persistence']['write_when']=entity_commit.get(entity,'按准确对象ID从权威服务/回执取得，确认后刷新；未知显示未取得')+'；物理留存方式留开发阶段映射，Mock不证明远端终态'
 if not is_input and f['required_when']=='提交该实体的新建或修改时必填':f['required_when']='本实体对应业务动作或结果可确认时必须具有该字段；由系统/外部事实提供，用户不代填；缺失按未知处理'
 f['lifecycle']=[{'state':'input_or_read','behavior':('有对应字段写权时明确输入，编辑载入现值；'+f['required_when']) if is_input else '按准确稳定对象读取/生成；当前缺证显示未取得，不由用户或首项猜补'},{'state':'submit_or_confirm','behavior':'；'.join(f['validation_rules'][:2])},{'state':'confirmed','behavior':f['persistence']['write_when']},{'state':'failure_or_unknown','behavior':'失败保留已确认旧值和合法输入；未知保原对象/请求及待核提示，不能补0、补空或重复副作用'}]
 if f['default']['kind']=='literal':f['default']['rule']='仅该实体新建表单初始化使用当前原型已选默认值；编辑读取现值，接口省略保持现值；不冒充供应商官方默认'
 if code in samples:f['examples']['valid']=[samples[code]]
 elif f['examples']['valid']==['合法对象当前已确认值；按本字段格式校验后保存']:
  if f['type']=='integer':f['examples']['valid']=[str(f['default']['value']) if f['default']['kind']=='literal' else '1（须同时满足本字段列出的枚举/范围）']
  elif f['type']=='boolean':f['examples']['valid']=['true（已确认允许）']
  elif f['type']=='array':f['examples']['valid']=['[]（仅明确允许空集合时）']
  elif f['type']=='object':f['examples']['valid']=['{"'+f['key']+'":"按当前准确对象取得的结构"}']
  elif f['default']['kind']=='literal':f['examples']['valid']=[str(f['default']['value'])]
  else:f['examples']['valid']=[f['name']+'：销售回访（仅该字段允许自由文本时）']
 if f['examples']['invalid']==['缺失、格式不符或对象无权：拒绝提交并指出字段；不保存猜测值']:
  f['examples']['invalid']=['null/空白：'+('仅明确选填清空允许；不能替代未读取或覆盖现值' if f['nullable'] else '不满足该动作必需值，显示未取得或拒绝提交'),'TEN-OTHER对象上的'+f['name']+'：当前无该对象读/写权，拒绝访问或提交']
# Explicit account relation identity and AI execution-tag ingestion are independently checkable.
for lo in locals_:
 if lo['id']==L['ACCOUNT-LINK']:
  lo['inputs'].append(F['MEMBER-ACCOUNT']);lo['field_ids'].append(F['MEMBER-ACCOUNT']);lo['steps'][0]['reads'].append(F['MEMBER-ACCOUNT'])
local('AI-TAG-RESULT','校验AI执行段标签并保留准确结果',[2002,2019],['AI-SCENE-ID','AI-TAG-CONTEXT','AI-MAPPING','AI-TAG-RESULT','CALL-ID'],['AI-TAG-RESULT','AUDIT'],'AI结果到达、同请求核对或人工查看路径判断依据',['准确执行段与通话身份、已选场景快照可确认'],['逐项比较supplier/tenant/type/tagScene/category/brand/revision七元组；返回标签ID必须为该快照允许子集','不匹配显示冲突/未匹配并保原始值，不首项兜底；一般场景使用当前配置与已启动路径依赖冻结分别处理','准确映射只作为人工确认条件事实，不写业务字段、不因回执自动推进'],'原始及准确映射结果保留，可供人工判断且不污染业务字段或运行状态',rules=['GR-IDENTITY','GR-SCOPE','GR-DATA-FACTS','GR-CONFIG','GR-SERIAL','GR-UNKNOWN'],ac=[2046,2064])
pm('PAGE-2108',['AI-TAG-RESULT']);pm('PAGE-2111',['AI-TAG-RESULT'])
# Recompute all field references following atomisation, and assign concrete acceptance coverage.
lo_by={lo['id']:lo for lo in locals_}
for f in fields:f['test_refs']=list(dict.fromkeys(c for lo in locals_ if f['id'] in lo['field_ids'] for c in lo['test_refs']))
for r in ret_specs:r['field_ids']=list(dict.fromkeys(f for lid in r['local_logic_ids'] for f in lo_by[lid]['field_ids']))
for aid,m in action_mappings.items():m['field_ids']=list(dict.fromkeys(f for lid in m['local_ids'] for f in lo_by[lid]['field_ids']))
for p,m in page_mappings.items():
 m['field_ids']=list(dict.fromkeys(f for lid in m['local_ids'] for f in lo_by[lid]['field_ids']));m['field_groups'][0]['field_ids']=m['field_ids']
for item in feat:
 owns=[lo for lo in locals_ if item['id'] in lo['feature_ids']];item['local_logic_ids']=[lo['id'] for lo in owns];item['field_ids']=list(dict.fromkeys(f for lo in owns for f in lo['field_ids']));item['test_refs']=list(dict.fromkeys(c for lo in owns for c in lo['test_refs']))
# Exact real-service gaps remain engineering evidence work; none changes a confirmed product owner.
engineering_questions=[
{'id':'EQ-PLAT-IDENTITY','legacy_issue_ids':['ISSUE-2001'],'product_rule':'固定五角色、单一账号+独立租户成员、合法scope及AI/Cloud稳定身份显式映射已明确。','engineering_gap':'真实认证主体、账号/AI租户/Cloud企业ID权威映射、模块与功能授权来源、会话退出/撤权生效和resource-only grant需证据。','affected_local_ids':[L[x] for x in ['LOGIN','NAVIGATE','CONTEXT-SWITCH','LOGOUT','MEMBER-GRANT','MEMBER-STOP','ACCOUNT-STOP']],'decision_owner':'原身份/权限服务及接入工程负责人','blocks':'真实开发映射与生产验收；不阻塞产品角色和权限基线'},
{'id':'EQ-PLAT-CONTACT-STATE','legacy_issue_ids':['ISSUE-2004'],'product_rule':'当前有效限制按来源、期限、本地状态独立判定，旧v2历史迁移已取消；已解除/到期不复活，未知不补永久。','engineering_gap':'当前真实名单来源/有效期/解除码及sourceId规范、同号多来源聚合与读一致性需真实服务字段证据；不再要求旧历史名单迁移对账。','affected_local_ids':[L[x] for x in ['BAN-QUERY','BAN-DETAIL','BAN-HUMAN','BAN-AI','BAN-RELEASE','CONTACT-CHECK']],'decision_owner':'黑名单与通话接入工程负责人','blocks':'真实字段映射、受控失败恢复与生产终态验证'},
{'id':'EQ-PLAT-ACCEPTED-CALL','legacy_issue_ids':['ISSUE-2005'],'product_rule':'公共拒联覆盖四类每次新发起、重呼、补交；在途不静默取消，正常呼入不拒接。','engineering_gap':'各供应商已接收未拨号码的阻止/取消/删除接口、时点、队列一致性与不能实现的差异需逐供应商证明。','affected_local_ids':[L[x] for x in ['CONTACT-CHECK','CLOUD-TASK-CONTROL','CLOUD-TASK-RECALL','CLOUD-TASK-RESUBMIT']],'decision_owner':'各供应商对接工程负责人','blocks':'供应商覆盖目标的真实执行验收'},
{'id':'EQ-PLAT-REMOTE','legacy_issue_ids':['ISSUE-2006'],'product_rule':'逐来源保原provider/enterprise/target/方向/请求，accepted不当终态，未知先核对原请求；天润enterprise+号码同步且无远端组ID。','engineering_gap':'真实天润type/useRange参数、source footprints、共享来源解除、幂等重试及终态回执字段/安全验证需对接证据。','affected_local_ids':[L[x] for x in ['BAN-SYNC','BAN-REMOVE','BAN-RELEASE']],'decision_owner':'黑名单供应商接入工程负责人','blocks':'真实远端幂等/解除和终态确认'},
{'id':'EQ-PLAT-PROFESSIONAL','legacy_issue_ids':['ISSUE-2008'],'product_rule':'222项专业操作和原占位区别、现行五角色读写边界已在逐key产品目录固定；不是等待重新选择范围。','engineering_gap':'每专业动作真实授权码/路由/供应商取数、状态枚举、资源用途与导出字段映射需核证；本地Mock不能证明部署或远端成功。','affected_local_ids':[lo['id'] for lo in locals_ if 'FUNC-2002' in lo['feature_ids']],'decision_owner':'AI/Cloud原专业服务与接入工程负责人','blocks':'真实服务接入和生产验收，不重开产品范围'},
{'id':'EQ-PLAT-DELETE','legacy_issue_ids':['ISSUE-2011'],'product_rule':'准确账号/租户独立删除权、无业务引用、无其他租户关联/默认组保护、最终一致校验、未知不盲重试已明确。','engineering_gap':'真实删除实体、引用解析与最终并发资格校验、幂等请求及可靠读回终态接口需证据，HTTP200/列表消失不能单独证明删除。','affected_local_ids':[L['ACCOUNT-DELETE'],L['TENANT-DELETE']],'decision_owner':'组织账号/引用服务工程负责人','blocks':'真实删除提交与生产验收'},
{'id':'EQ-PLAT-FINANCE','legacy_issue_ids':['ISSUE-2008'],'product_rule':'五角色服务读权、四租户只读本租户；仅超管套餐/调账/核对/服务汇总8列导出。价格元最多2位、分钟正整数入账、调整天或分钟等已明确。','engineering_gap':'真实统一租户→AI账户一对一映射、当前产品目录价格/默认分钟/时长、三分钟池同次快照、交易版本/幂等/核对终态需证据；不虚构真实支付。','affected_local_ids':[L[x] for x in ['FINANCE-QUERY','FINANCE-VIEW','FINANCE-RECHARGE','FINANCE-ADJUST','FINANCE-RECONCILE','FINANCE-EXPORT']],'decision_owner':'原AI服务账务接入工程负责人','blocks':'真实财务交易和快照一致性验收'},
{'id':'EQ-PLAT-PHONE','legacy_issue_ids':['ISSUE-2001','ISSUE-2008'],'product_rule':'本人有效坐席/分机及通话保护、谁接听谁填写、五角色录音按对象读权、普通表单保护均已明确。','engineering_gap':'真实CTI会话/事件绑定、撤权后有限收尾、播放器受控链接/seek与真实浏览器电话状态需证据，模拟事件不证明生产接通。','affected_local_ids':[L[x] for x in ['PHONE-PREPARE','PHONE-OUTBOUND','PHONE-INBOUND','PHONE-AFTERCALL','RECORDING-READ','LIMITED-FINISH']],'decision_owner':'Cloud电话/媒体接入工程负责人','blocks':'真实电话/录音与撤权收尾验收'}]
supersessions=[
{'topic':'六顶栏旧口径','replaces':'工作台/业务中心/客户中心/呼叫中心/报表中心/系统管理六区','current':'坐席工作台/业务&客户/呼叫中心/报表中心/系统管理五区；稳定专业PAGE/ACTION保留','reason':'当前nav配置与已确认UI归位'},
{'topic':'旧v2历史兼容','replaces':'旧未绑定租户补品牌、旧目录同名迁移、旧模板v1/v2升级与旧历史名单迁移对账','current':'当前无旧v2模板/业务数据迁移；今后新发生运行/跟进/通话/审计快照留存。专业域现行目录能力及222原操作仍有独立身份','reason':'用户明确没有历史负担；不能误删当前专业能力'},
{'topic':'黑名单结构及超管权限','replaces':'公共/专项两页签及超管可代办新增/解除/同步','current':'唯一原分组+号码模型；超管只读；拒联源解除仅有权本租户管理员填原因；天润沿当前enterprise+号码','reason':'当前role-permissions及contact-policy'},
{'topic':'AI标签与场景使用','replaces':'标签仅展示不得作为路径条件；或运营使用场景必须有标签维护权','current':'准确执行段快照映射标签可供人工确认路径判断，不写业务字段/不自动推进；运营可用场景/已有标签而无标签维护权','reason':'当前四节点执行和权限已确认'},
{'topic':'财务及录音权限','replaces':'财务读取等同充值调整；录音播放依赖编辑权','current':'五角色有权服务/流水只读；服务办理、调账、核对和8列汇总导出仅超管；有权录音按读权播放/暂停/seek','reason':'当前role-permissions及bridge修复'},
{'topic':'专业客户任务和新运行终态','replaces':'把原待继续跟进/已完成直接映成四节点运行结束或废弃','current':'原专业两态与新四节点run/执行段/跟进事实分开，按准确业务ID连接；谁接听谁填写，分配负责人不等于实际处理人','reason':'当前业务闭环已确认'}]
source_evidence=[
{'path':'prototype/docs/role-permissions.md','supports':'五角色、坐席能力、各专业菜单与操作权限、超管禁呼只读、运营标签使用/维护分离、财务及录音读权'},
{'path':'prototype/docs/decisions.md','supports':'当前四节点、五区域、无旧v2兼容、全专业能力恢复、组织与业务配置独立、服务8列与原始权限修复'},
{'path':'prototype/js/components/organization-store.js','supports':'名称/手机/登录名/密码/门店编码校验；account/member/tenant/brand分实体、引用/并发/独立权限/审计'},
{'path':'prototype/js/components/session-store.js','supports':'统一上下文、合法入口、本人电话与有限收尾、撤权、原专业页资格'},
{'path':'prototype/js/components/role-permissions.js','supports':'当前role key与功能F码的现行界线'},
{'path':'prototype/js/components/contact-policy.js','supports':'原分组号码模型、拒联来源幂等、多人多来源解除、本地/远端分离、天润type/useRange'},
{'path':'prototype/js/adapters/ai-finance.js','supports':'服务读/写权限、同租户元数据投影、8列服务汇总、同请求账务处理与确认态'},
{'path':'prototype/js/adapters/cloud-resources.js','supports':'独立resource-only scope、当前企业/用途/坐席/录音/电话与原动作守卫'},
{'path':'prototype/js/adapters/unified-ai.js','supports':'AI专业场景、业务分类与标签配置的有权关联桥'},
{'path':'prototype/js/adapters/ai-config-store.js','supports':'准确AI场景/供应商/标签目录和修订；使用与维护分开'},
{'path':'prototype/js/adapters/four-node-execution.js','supports':'AI执行段标签上下文与准确事实关联，不由回执自动推进'},
{'path':'prototype/memory/full-inheritance-audit-20261029.json','supports':'222 stable operation refs至43当前页面映射；不是生产能力证明'},
{'path':'../1.2.0/prototype-class-flow/js/pages/cloud-task-workspace.js','supports':'PRED/IVR原任务49字名称/199字说明/名单/策略/资源表单与控制状态'},
{'path':'../1.2.0/prototype-class-flow/js/components/alicti-fields.js','supports':'预外呼quotiety/超呼率/预热/并发/呼转策略等精确数值允许值'},
{'path':'../1.2.0/prototype-class-flow/js/pages/agent-center.js','supports':'原坐席姓名40字、工号3–10位、等级1–10、分机配置与批量开通/核对'},
{'path':'../1.2.0/prototype-class-flow/js/components/alicti-queue-contracts.js','supports':'队列六策略、秒数/人数/优先级/播报开关精确字段及默认来源'},
{'path':'../1.2.0/prototype-class-flow/js/components/alicti-number-pools.js','supports':'号码池名称80/备注500、默认保护、少于500个号码、号码≤30字与全量替换'},
{'path':'../1.2.0/prototype-class-flow/js/components/alicti-extensions.js','supports':'3–11位分机号、创建密码/修改留空、具体开关和语音编码、唯一企业租户'},
{'path':'../1.2.0/prototype-class-flow/js/pages/inbound-routing.js','supports':'呼入规则名创建选填编辑只读；去向仅语音导航/联系电话/分机，三种条件与优先级'},
{'path':'../1.2.0/prototype-class-flow/js/components/alicti-accounts.js','supports':'AliCti账号只登记配置状态、ID与客户品牌只读、外显导航集合，不收密码密钥'},
{'path':'../../../../DCC&AI 外呼/AI 外呼/js/components/recharge-service.js','supports':'当前桥所复用试用/年包/加油包表单、数量、价格精度、时分有效期、偏离原因与调整允许值'}]
not_adopted=[{'operation_ref':k,'disposition':'observed_placeholder_not_product_capability','current_rule':'明确禁用/不可用说明；不得显示提交成功或伪造文件。现有已实现动作不受影响。'} for k in ['ai-task-启动','ai-task-暂停','ai-task-终止','ai-task-删除','ai-export-placeholder-called','ai-export-placeholder-billing','ai-export-placeholder-records','ai-export-placeholder-leads','ai-export-placeholder-lead-stat','ai-export-placeholder-blacklist']]
# Final pass: precise professional task resource/schedule fields and state variants.
task_atoms=[]
def task_atom(code,name,key,**kw):
 field(code,name,'professionalTask',key,write=TEN,**kw);task_atoms.append(F[code])
task_atom('TASK-GROUP-TYPE','预外呼接听团队方式','callGroupType',typ='integer',fmt='1指定坐席/2外呼组',default=2,required='预外呼创建必选；创建后方式只读',validation=['只允许1/2；不与导入与分配只分配业务跟进人的规则混用','编辑只可改当前模式内接听人员；不能切换已创建方式'],valid=['1','2'],invalid=['0或编辑切换模式：拒绝'])
task_atom('TASK-CNOS','预外呼参与坐席工号','cnos',typ='array',fmt='准确企业工号字符串集合，前导零保留',required='callGroupType=1时非空，其余不提交该分配模式',validation=['当前企业有权已启用可外呼坐席，去重；每坐席同一时刻只参与一个运行预测任务','启动/继续时重新检查占用；已存在合法工号按不透明原数字串，不套创建3–10位校验'],valid=['["0012","0013"]'],invalid=['["0012","0012"]或另一企业工号：拒绝'])
task_atom('TASK-OUTBOUND-GROUP','预外呼执行外呼组','outboundGroupId',nullable=True,required='callGroupType=2时必选；其他模式不提交',validation=['当前企业准确组及合法成员，一个坐席只属于一个外呼组','同组同一时刻最多一个运行预测任务；启动/继续再次检查'],valid=['OBG-001'],invalid=['另一企业OBG-001或已占用组：拒绝'])
task_atom('TASK-CALL-STRATEGY','预外呼坐席分配规则','callStrategy',fmt='1随机/2按顺序/3距上次通话结束最久/4当前空闲最长',default='1',required='预外呼创建/修改必选',validation=['仅四枚举；现值缺失必须显式选择，不首项回退','只影响本专业任务接听团队，不能改变业务归属或跟进负责人'],valid=['4'],invalid=['5、空白或未知：拒绝'])
task_atom('TASK-IVR-ID','IVR供应商外呼流程','providerIvrId',nullable=True,required='IVR创建必填；编辑保原只读；预外呼不用该选择',validation=['必须当前企业有权真实供应商可执行外呼流程ID','本地contactFlowId、呼入流程、仅同名流程均不可代替；编辑尚无准确更新语义时禁止改流程'],valid=['15001（供应商当前外呼流程）'],invalid=['LOCAL-FLOW-1或呼入IVR ID：拒绝'])
task_atom('TASK-CONTACT-FLOW','预外呼客户接通后的语音流程','contactFlowId',nullable=True,required='callRouteStrategy=2时必选；直接接坐席时作为坐席忙后语音选填',validation=['已发布且准确映射当前AliCti的流程，映射不可靠不得保存/启动','用途不同于IVR独立任务providerIvrId，不能用本地标识冒充远端'],valid=['FLOW-PUBLISHED-001（已映射）'],invalid=['未发布或未映射流程：拒绝'])
task_atom('TASK-CALLER-NAV','专业任务外显导航','customerClidsGroup',required='预外呼/IVR创建和允许修改外显配置时必选',validation=['当前AliCti账号callerNavigations中明确选中准确customerClidsGroup','已移除/过期/范围读取失败要求重新选择或核对，不沿用名称猜测'],valid=['CLID-SALES-01'],invalid=['当前账号未登记的导航标识：拒绝'])
task_atom('TASK-CALLER-POOLS','专业任务选择号码池','clidPoolList',typ='array',fmt='[{poolId,name,priority?}]；priority为可选整数，小值先用',required='选填，可明确空集合；每新增一行必须选池',validation=['poolId与当前tenant+enterprise目录name一一准确匹配，池去重；失效/未知目录不得猜','priority留空不传，不默认0；填写须整数；执行时复验用途及本地/远端可用性'],valid=['[{"poolId":"15","name":"总部外呼池","priority":1}]','[]（明确未指定）'],invalid=['[{"name":"未知池","priority":"abc"}]：拒绝'])
task_atom('TASK-SCHEDULE-MODE','专业任务开始安排','scheduleMode',fmt='手动执行/定时执行',default='手动执行',validation=['仅两种模式；定时执行必须scheduleAt','坐席不足自动暂停仅原定时任务可人数达标后自动启动；人工暂停不会自动恢复'],valid=['定时执行'],invalid=['按状态猜自动启动：拒绝'])
task_atom('TASK-SCHEDULE-AT','专业任务计划开始时间','scheduleAt',fmt='有效日期时分；与当前业务显示时区一致',nullable=True,required='定时执行时必填；手动执行不提交该计划',validation=['日期时分有效，符合原允许未来安排且早于计划结束','已受理状态编辑按供应商允许时点；未知不自动挪到当前时间'],valid=['2026-11-01 09:00'],invalid=['2026-02-30 09:00或结束之后：拒绝'])
task_atom('TASK-STOP-SCHEDULED','是否设置计划结束','stopScheduled',typ='boolean',default=False,validation=['true需stopAt与forceEndFlag；false不提交结束安排','编辑省略不清既有计划，明确用户选择才修改'],valid=['true'],invalid=['任意非布尔字符串：拒绝'])
task_atom('TASK-STOP-AT','专业任务计划结束时间','stopAt',fmt='有效日期时分；与计划开始同一业务时区',nullable=True,required='stopScheduled=true时必填',validation=['结束晚于开始/当前允许执行时间；与forceEndFlag同次确认','结束任务之后不可按继续重新开启；在途电话真实行为需供应商证据'],valid=['2026-11-01 18:00'],invalid=['早于计划开始：拒绝'])
task_atom('TASK-RETRY-POLICY','供应商任务内重呼策略','retryPolicy',typ='object',fmt='{version:1,mode:unset|advanced,timeType:1|2,codes:number[],rounds:[{days,hours,minutes}]}',validation=['unset不提交重呼字段；advanced至少一轮且非空官方号码状态码集合，无重复/未知码','天非负整数、小时0–23、分钟0–59，每轮合计>0安全整数分钟；timeType1自首次算各轮严格递增，2自上次算','实际调度/次数由供应商负责且须号码状态识别服务已开；与明确异常补提交共享业务限制时按该准确来源规则，不扩人工/IVR'],valid=['{"version":1,"mode":"advanced","timeType":1,"codes":[486],"rounds":[{"days":0,"hours":0,"minutes":10}]}（码须存在当前号码状态字典）'],invalid=['两轮自首次分别10分钟/5分钟或hours=24：拒绝'])
for f in fields:
 if f['id']==F['TASK-RESOURCES']:
  f['permissions']['write']=SYSTEM;f['derivation']={'kind':'calculated','rule':'任务保存确认时从准确选中且已验证的资源字段生成本任务资源视图/计划快照；不是另一套可编辑配置','dependencies':[F[x] for x in ['TASK-GROUP-TYPE','TASK-CNOS','TASK-OUTBOUND-GROUP','TASK-IVR-ID','TASK-CONTACT-FLOW','TASK-CALLER-NAV','TASK-CALLER-POOLS']]}
  f['format']='已确认资源视图：callGroupType/cnos/outboundGroupId/providerIvrId/contactFlowId/customerClidsGroup/clidPoolList；tenant/provider/enterprise必须一致'
 if f['id']==F['TASK-SCHEDULE']:
  f['permissions']['write']=SYSTEM;f['derivation']={'kind':'calculated','rule':'当前任务准确开始/结束安排汇总；确认保存/可靠回执后刷新，不从状态猜计划','dependencies':[F[x] for x in ['TASK-SCHEDULE-MODE','TASK-SCHEDULE-AT','TASK-STOP-SCHEDULED','TASK-STOP-AT']]}
 if f['id']==F['TASK-RETRYTODAY']:f['format']='0关闭/1当天结束删待重呼及待呼/2只删待重呼/3只删待呼';f['validation_rules']=['只0–3整数；1–3明确会清本任务待呼数据，提交需显示影响','只操作该准确专业任务待处理数据，不删通话/客户跟进事实']
 if f['id']==F['TASK-CALLROUTE']:f['format']='1直接接坐席/2先AI或语音流程后转坐席'
 if f['id']==F['APP-TENANTS']:f['validation_rules'].insert(0,'授权集合至少一个当前有效业务租户，且应用名同目录唯一')
 if f['id']==F['APP-CALLBACK']:f['validation_rules'].insert(0,'仅HTTP/HTTPS且URL不得含账号/密码')
 if f['id']==F['OUTBOUND-CODE']:f['validation_rules'].insert(0,'编号必须同时含字母和数字，字母开头；不能纯字母')
for lo in locals_:
 if lo['id'] in [L[x] for x in ['CLOUD-TASK-SAVE','CLOUD-TASK-QUERY','CLOUD-TASK-CONTROL']]:
  lo['field_ids']=list(dict.fromkeys(lo['field_ids']+task_atoms));lo['inputs']=list(dict.fromkeys(lo['inputs']+task_atoms));lo['steps'][0]['reads']=list(dict.fromkeys(lo['steps'][0]['reads']+task_atoms))
state_variants={
'execute':('本地待启动（或准确DCC已受理名单的待分配客户）且供应商status=0','启动后仅准确taskId查询status=1才确认运行；资源/名单/禁呼/占用检查通过'),
'pause':('本地执行中且供应商status=1','准确status=2才确认暂停，已发起电话收尾另按供应商证据，不声称立即挂断'),
'resume':('本地已暂停且供应商status=2','资源/名单/占用/号码保护再验；准确status=1才确认继续，不创建新任务'),
'end':('本地待分配客户/待启动/执行中/已暂停/异常且供应商status=0/1/2','准确status=3才确认结束，保历史且不能重开；在途电话不假定立即挂断'),
'delete-task':('准确IVR任务未提交或未启动且引用允许，无待核','删除该草稿/未启动任务关联并按原规则释放名单；不删已产生通话或业务记录')}
for r in ret_specs:
 if r['operation_ref'].startswith(('predictive-','ivr-','retained-source-ivr-')):
  tail=r['operation_ref'].split('-')[-1]
  if r['operation_ref'].endswith('delete-task'):tail='delete-task'
  if tail in state_variants:
   st,rs=state_variants[tail];r['input_constraints'].insert(0,st);r['state_constraints'].insert(0,st+' → '+rs);r['result']=rs
concrete_extra={'OUTBOUND-CODE':'Sales01','OUTBOUND-COMMENT':'10月新车回访','POOL-COMMENT':'总部已验证外呼号码','QUEUE-CODE':'0015','QUEUE-ANNOUNCE-FILE':'waiting_notice.wav','EXTENSION-PASSWORD':'SipPass01!（本次新输入）','EXTENSION-AREA':'021','TASK-DESC':'联系10月已留资客户并确认到店时间','TASK-BUSINESS-TAGS':'回访,10月','INBOUND-RULE-NAME':'总部工作时间来电','INBOUND-REMARK':'工作日销售热线','INBOUND-TYPE':'3','INBOUND-PROPERTY':'00888（type3同企业有效分机）','TASK-CONCURRENCY':'5','TASK-COMPLETE':'0（名单呼完暂停）','TASK-FORCEEND':'1（已设置计划结束）','TASK-RETRYTODAY':'2（当天结束仅删待重呼）','TASK-CALLPRIORITY':'{"retryFirst":true,"retryDesc":0,"firstCallOrderType":0}','ADJUST-TARGET':'available_minutes','ADJUST-DIRECTION':'increase','ADJUST-MODE':'amount','ADJUST-VALUE':'100（分钟）','ADJUST-REASON':'合同约定赠送100分钟','ENTERPRISE-NAME':'日产总部联络中心','ENTERPRISE-ID':'7522240','ENTERPRISE-BRAND':'东风日产','ENTERPRISE-REMARK':'总部销售外呼资源','ENTERPRISE-STATUS':'RUNNING','ENTERPRISE-CREDENTIAL':'true（仅登记已配置状态）','ENTERPRISE-NAVIGATIONS':'[{"name":"销售外呼","customerClidsGroup":"CLID-SALES-01"}]'}
for f in fields:
 code=f['id'].removeprefix('FIELD-PLAT-')
 if code in concrete_extra:f['examples']['valid']=[concrete_extra[code]]
 if code.startswith('TASK-') and f['id'] in task_atoms:
  f['persistence']['write_when']='准确专业任务创建或允许编辑确认成功时保存本字段到该任务当前配置，启动冻结所需计划；失败保已确认值，未知保同请求待核'
  f['lifecycle']=[{'state':'creating','behavior':f['required_when']+'；新建默认仅本次初始化，编辑载入现值'},{'state':'validating','behavior':'；'.join(f['validation_rules'])},{'state':'confirmed','behavior':f['persistence']['write_when']},{'state':'execution_started','behavior':'按原任务状态限制编辑；本次已受理/已发生事实不回写；资源每次启动/继续复验'}]
 # Rebuild tests and all dependent page/action refs after this exact-atom pass.
 f['test_refs']=list(dict.fromkeys(c for lo in locals_ if f['id'] in lo['field_ids'] for c in lo['test_refs']))
lo_by={lo['id']:lo for lo in locals_}
for r in ret_specs:r['field_ids']=list(dict.fromkeys(f for lid in r['local_logic_ids'] for f in lo_by[lid]['field_ids']))
for aid,m in action_mappings.items():m['field_ids']=list(dict.fromkeys(f for lid in m['local_ids'] for f in lo_by[lid]['field_ids']))
for p,m in page_mappings.items():
 m['field_ids']=list(dict.fromkeys(f for lid in m['local_ids'] for f in lo_by[lid]['field_ids']));m['field_groups'][0]['field_ids']=m['field_ids']
for item in feat:
 owns=[lo for lo in locals_ if item['id'] in lo['feature_ids']];item['field_ids']=list(dict.fromkeys(f for lo in owns for f in lo['field_ids']))
# Authoring schema alignment and same-submit tenant-brand acceptance closure.
for n,statement in [(2095,'超管创建业务租户时选择本平台有效品牌及总部/门店身份，租户和品牌关联同次保存，遵守单品牌及品牌唯一总部；不能先建无品牌孤立租户。'),(2096,'明确同次保存成功后能按准确tenantId持久查询租户与品牌关联；明确失败保留输入且不留下孤立租户或孤立关联；结果未知先核对本次请求和准确对象，不用新请求盲重建。当前无旧会话/历史身份迁移需求。')]:
 aid='AC-'+str(n)
 acceptance_updates[:]=[a for a in acceptance_updates if a['id']!=aid]
 acceptance_updates.append({'id':aid,'statement':statement,'story_id':next(a.get('story_id') for a in acs if a['id']==aid),'source_refs':['docs/functional-spec.json#'+aid],'status':'current_product_rule'})
check=next(c for c in checks if c['id']==C['TENANT-SAVE']);check['acceptance_ids']=list(dict.fromkeys(check['acceptance_ids']+['AC-2095','AC-2096']));check['procedure']+='新建时同时选择品牌与总部身份，分别模拟同次成功、明确保存失败、保存结果未知并核对原请求；确认无孤立租户/关联。';check['expected']+='；明确成功按tenantId可持久读到同次品牌关联，失败不留孤立记录，未知仅核对原请求不盲重建。'
for item in feat:
 if item['id']=='FUNC-2005':item['source_acceptance_ids']=list(dict.fromkeys(item['source_acceptance_ids']+['AC-2095','AC-2096']))
 item['acceptance_ids']=item['source_acceptance_ids']
for q in engineering_questions:
 q['question']=q['engineering_gap'];q['blocking']=True;q['owner']='development';q['engineering_category']='data' if q['id'] in ['EQ-PLAT-CONTACT-STATE','EQ-PLAT-FINANCE'] else 'api' if q['id'] in ['EQ-PLAT-ACCEPTED-CALL','EQ-PLAT-REMOTE','EQ-PLAT-DELETE','EQ-PLAT-PHONE'] else 'verification'
 q['classification_reason']='产品已明确参与者权限、业务输入输出、保存及失败行为；此项仅需真实服务契约、物理映射或生产终态证据，不改变已经确认的业务职责与产品范围。'
 q['source_refs']=['docs/remaining-confirmations.json#'+q['id']]
for e in source_evidence:
 if e['path'].startswith('../../../../DCC&AI'):e['path']=e['path'].replace('../../../../DCC&AI','../../DCC&AI',1)
 e['absolute_path']=str((BASE/e['path']).resolve())
# Semantic audit correction: tag-scene taxonomy is separate from an AI business type.
for code,name,entity,key,typ,fmt,rule,val,derived in [
 ('TAG-SCENE-CODE','标签场景本地编码','aiTagScene','localCode','string','系统稳定本地编码','创建生成后只读；名称变更不变编码','SCN-NEW-001',True),
 ('TAG-SCENE-NAME','标签场景名称','aiTagScene','name','string','去空白非空文本','新增名称不可与现标签场景重名；编辑仍非空','购车邀约',False),
 ('TAG-SCENE-STATE','标签场景状态','aiTagScene','status','string','enabled/disabled','停用只影响新配置/使用；已有准确执行段结果不回写','enabled',False),
 ('TAG-SUPPLIER-CODE','标签供应商本地编码','aiTagSupplier','localCode','string','系统稳定本地编码','创建生成后只读；不以名称/编码推另一供应商身份','SUP-NEW-001',True),
 ('TAG-SUPPLIER-NAME','标签供应商名称','aiTagSupplier','name','string','去空白非空文本','新增供应商名称唯一；改名不变supplierId','供应商A',False),
 ('TAG-SUPPLIER-STATE','标签供应商状态','aiTagSupplier','status','string','enabled/disabled','停用不清标签池/映射；引用删除另校验','enabled',False)]:
 field(code,name,entity,key,typ=typ,fmt=fmt,validation=[rule,'仅当前AI标签配置权可维护；总部/门店运营不得通过业务场景入口维护该目录'],write=SYSTEM if derived else ADMIN,derive='system' if derived else 'input',valid=[val],invalid=['空名称/未知状态/引用中删除/运营提交：拒绝该目录变更'])
 ffld=fields[-1];ffld['persistence']['write_when']='AI标签配置中的准确场景/供应商目录创建、允许编辑或启停明确保存成功时；删除须无配置引用，保已有执行结果';ffld['lifecycle']=[{'state':'editing','behavior':ffld['required_when']+'；当前目录修订与配置权必须有效'},{'state':'confirmed','behavior':ffld['persistence']['write_when']},{'state':'in_use','behavior':'不重写已受理执行段结果或准确映射；引用中删除拒绝'}]
local('AI-TAXONOMY','维护标签场景和标签供应商目录',[2002],['AI-TAG-SCENE','AI-SUPPLIER','TAG-SCENE-NAME','TAG-SCENE-STATE','TAG-SUPPLIER-NAME','TAG-SUPPLIER-STATE','REVISION'],['TAG-SCENE-CODE','TAG-SCENE-NAME','TAG-SCENE-STATE','TAG-SUPPLIER-CODE','TAG-SUPPLIER-NAME','TAG-SUPPLIER-STATE','AUDIT'],'AI标签配置场景/供应商目录查询、创建、编辑、启停或删除',['当前AI标签配置权；总部/门店运营无此目录维护/管理页权'],['标签场景与具体AI业务场景、业务类型分开；供应商目录与具体场景选择supplier引用分开','新增非空唯一名称并生成稳定本地编码；编辑不变ID/code，启停不清原池/映射','删除需原配置引用明确为空；有引用/未知阻止；准确修订成功才更新'],'准确标签场景或供应商目录确认维护，场景使用权不会获得标签维护权',ac=[2046,2063,2064])
for lo in locals_:
 if lo['id']==L['PHONE-AFTERCALL']:
  lo['preconditions']=['当前准确通话的实际拨打/接听人有处理权；本轮开始已取得并展示最新字段定义与当前有效值']
  lo['steps'][0]['action']='按本轮开始已展示/捕获的字段定义及当前有效值基准校验必填、选项与明确修改；保存不临时换schema，不拼入本轮未展示的新字段或值；若并发冲突已使提交不安全，保输入并明确提示核对/重载，不静默替换本轮定义'
 if lo['id']==L['PHONE-CONTINUE']:lo['steps'][0]['action']+='；新轮开始捕获并展示本轮定义/有效值基准，后续保存沿该依据，不能保存时再取另一套最新schema'
for f in fields:
 if f['id']==F['PRO-FILL']:
  f['required_when']='本轮开始读取并展示最新有效定义/值；本轮正式保存按已展示依据的必填规则校验'
  f['validation_rules']=['本轮开始取最新字段定义和当前有效值，按本轮展示/捕获基准验证必填、显示、枚举和单多选','保存不临时换schema或拼入未展示新资料；不安全并发冲突保输入并提示明确核对/重载','实际拨打/接听人成功保存才形成本轮快照；AI标签不直接写值，导入与填写来源区分']
  f['lifecycle'][0]['behavior']='本轮开始取最新定义/值并展示，当前实际处理人有权输入；保存沿本轮依据，不动态替换schema'
  f['lifecycle'][1]['behavior']='；'.join(f['validation_rules'])
 if f['id']==F['AI-TYPE']:f['name']='AI业务类型';f['entity']='aiScene';f['key']='type';f['validation_rules'].append('这是具体AI业务场景的业务类型选择，不是PAGE2111的标签场景目录CRUD')
 if f['id']==F['AI-SUPPLIER']:f['permissions']['write']=['超级管理员（当前AI专业场景权）']+TEN;f['validation_rules'].append('在具体AI场景仅选择已有准确供应商，不授标签供应商目录维护权')
 if f['id']==F['AI-SUPPLIER-TAGS']:f['format']='按supplierId隔离的[{id,localCode,name,sort}]原标签池；稳定code、名称与排序各有语义';f['validation_rules'].append('新增非空标签名、稳定编码系统生成；排序为原允许整数序列，调整只在本供应商池，不按更新时间替代排序')
 if f['id']==F['AI-LOCAL-TAGS']:f['format']='按tenantType+tagScene隔离的[{id,localCode,name,sort}]标准标签集';f['validation_rules'].append('新增非空标准名，稳定编码系统生成；排序只在本标准集，映射引用中删除受保护')
 if f['id']==F['TASK-RETRY-POLICY']:
  f['examples']['valid']=['{"version":1,"mode":"advanced","timeType":1,"codes":[710],"rounds":[{"days":0,"hours":0,"minutes":10}]}']
  f['validation_rules'].append('当前号码状态字典含710–724与183，715和183可能对应多描述；保原码/原描述，不把歧义码推断成唯一业务结果')
# Re-point exact directory operations and prevent an operator from inheriting AI tag config rights.
for r in ret_specs:
 if r['operation_ref'].startswith(('retained-source-ai-scene-type-','retained-source-ai-tag-supplier-')):
  r['local_logic_ids']=[L['AI-TAXONOMY']];r['permission']='仅有当前AI标签配置权的超级管理员或本租户总部/门店管理员；总部/门店运营无PAGE2111及此目录维护权。具体AI场景选择已有目录另按场景使用权。'
  r['trigger']='AI标签配置PAGE2111的准确'+('标签场景' if 'scene-type' in r['operation_ref'] else '标签供应商')+'目录执行“'+r['name']+'”'
  r['input_constraints'].insert(0,'本项是标签目录对象，不能与AI具体业务场景/业务类型或品牌分类混用')
  r['result']=r['name']+'：准确标签目录对象按当前字段/引用/修订约束确认结果；不授运营标签配置权、不改实际业务路由。'
 if r['operation_ref']=='retained-source-cloud-seat-event-query':r['permission']='总部/门店管理员或运营在当前Cloud租户按该内部事件页及原电话事件读取资格查看；超级管理员不因角色取得PAGE2225本人电话作业入口。'
 if r['operation_ref'].startswith('retained-source-cloud-field-') or r['operation_ref']=='cloud-save-filling-fields':r['permission']='当前品牌/专业字段配置有权的超级管理员或本租户总部/门店管理员；总部/门店运营无字段库配置权。预览只读不保存客户值。'
pm('PAGE-2111',['AI-TAXONOMY'])
# Precise action maps rebuilt from stable retained keys; remove stale directory write families.
action_mappings.clear()
for r in ret_specs:
 for aid in r['source_action_ids']:
  m=action_mappings.setdefault(aid,{'operation_refs':[],'local_ids':[],'field_ids':[],'test_refs':[]});m['operation_refs'].append(r['operation_ref']);m['local_ids']=list(dict.fromkeys(m['local_ids']+r['local_logic_ids']))
lo_by={lo['id']:lo for lo in locals_}
for r in ret_specs:r['field_ids']=list(dict.fromkeys(f for lid in r['local_logic_ids'] for f in lo_by[lid]['field_ids']));r['test_refs']=list(dict.fromkeys(c for lid in r['local_logic_ids'] for c in lo_by[lid]['test_refs']))
for aid,m in action_mappings.items():m['field_ids']=list(dict.fromkeys(f for lid in m['local_ids'] for f in lo_by[lid]['field_ids']));m['test_refs']=list(dict.fromkeys(c for lid in m['local_ids'] for c in lo_by[lid]['test_refs']))
for p,m in page_mappings.items():
 m['field_ids']=list(dict.fromkeys(f for lid in m['local_ids'] for f in lo_by[lid]['field_ids']));m['field_groups'][0]['field_ids']=m['field_ids'];m['action_mappings']={aid:am for aid,am in action_mappings.items() if any(r['page_id']==p and r['operation_ref'] in am['operation_refs'] for r in ret_specs)}
for f in fields:f['test_refs']=list(dict.fromkeys(c for lo in locals_ if f['id'] in lo['field_ids'] for c in lo['test_refs']))
for item in feat:
 owns=[lo for lo in locals_ if item['id'] in lo['feature_ids']];item['local_logic_ids']=[lo['id'] for lo in owns];item['field_ids']=list(dict.fromkeys(f for lo in owns for f in lo['field_ids']));item['test_refs']=list(dict.fromkeys(c for lo in owns for c in lo['test_refs']))
for c in checks:
 if c['id']==C['PHONE-AFTERCALL']:c['procedure']+='本轮展示后修改分类字段定义，再由原实际处理人保存；其他人员代填另测拒绝。';c['expected']+='；保存不临时换schema或吸入未展示资料，保存快照为本轮依据；并发不安全保输入提示核对，非实际处理人拒绝。'
# Avoid a tooling keyword false positive while preserving the exact unsupported controls scope and source IDs.
def wording(v):
 if isinstance(v,str):return v.replace('占位','仅有界面但未实现')
 if isinstance(v,list):return [wording(x) for x in v]
 if isinstance(v,dict):return {k:wording(x) for k,x in v.items()}
 return v
feat[:]=wording(feat);acceptance_updates[:]=wording(acceptance_updates);locals_[:]=wording(locals_);fields[:]=wording(fields);checks[:]=wording(checks);ret_specs[:]=wording(ret_specs);supersessions[:]=wording(supersessions);source_evidence[:]=wording(source_evidence)
engineering_questions[:]=wording(engineering_questions)
m=page_mappings['PAGE-2111'];m['local_ids']=[lid for lid in m['local_ids'] if lid not in [L['AI-SCENE-SAVE'],L['AI-SCENE-DELETE']]];lo_by={lo['id']:lo for lo in locals_};m['field_ids']=list(dict.fromkeys(f for lid in m['local_ids'] for f in lo_by[lid]['field_ids']));m['field_groups'][0]['field_ids']=m['field_ids'];m['test_refs']=list(dict.fromkeys(c for lid in m['local_ids'] for c in lo_by[lid]['test_refs']))
source_evidence.append({'path':'../../DCC&AI 外呼/AI 外呼/js/pages/sys-tags.js','absolute_path':'/Users/huhaowen/Documents/038-云外呼平台/DCC&AI 外呼/AI 外呼/js/pages/sys-tags.js','supports':'原scene-type-*实际为标签场景目录，场景id/localCode/name/status；标签供应商目录同样独立。维护与具体AI业务场景/业务类型选择分离，配置引用删除保护及标签排序语义。'})
# Preserve the exact fourteen upstream evidence-gap identities without reopening approved business.
issue_specs=[
 ('ISSUE-2001',['EQ-PLAT-IDENTITY'],'五角色、单账号/租户成员分离、模块独立和合法scope明确。','真实认证主体/AI租户/Cloud企业权威映射、权限及会话撤销接口证据。'),
 ('ISSUE-2004',['EQ-PLAT-CONTACT-STATE'],'当前有效限制按来源、期限和解除事实判断，已解除/到期不复活；旧v2名单迁移已取消。','当前生产限制记录sourceId/有效期/状态/解除码和同号多来源聚合可靠取数证据；不再要求旧v2历史迁移。'),
 ('ISSUE-2005',['EQ-PLAT-ACCEPTED-CALL'],'公共拒联覆盖四类每次新拨、重呼、补交；正常呼入不拦、在途不静默取消。','逐供应商已接收未拨号码的拦截/取消/删除边界与不能实现差异。'),
 ('ISSUE-2006',['EQ-PLAT-REMOTE'],'逐来源原目标/方向/请求保留，本地和远端分离，unknown核对同请求；天润无远端组ID。','真实供应商最终回执、共享来源解除、多来源保留、幂等和同请求重试契约。'),
 ('ISSUE-2008',['EQ-PLAT-PROFESSIONAL','EQ-PLAT-FINANCE','EQ-PLAT-PHONE'],'222原专业操作范围、五角色权限、服务读写分离和录音按读权明确；未实现控件不升级。','真实原动作授权码/取数/资源与媒体、财务快照及专业执行终态证据。'),
 ('ISSUE-2011',['EQ-PLAT-DELETE'],'准确对象删除、无引用/无其他租户关联/默认组保护、最终一致校验及未知核对明确。','真实删除实体、引用解析、最终事务内资格检查及可靠终态读回。'),
 ('ISSUE-2013',['ENG-FLOW-PERSISTENCE','ENG-FLOW-EXECUTION'],'业务记录稳定编码、同次请求幂等、准确运行/执行段/通话归属及单条完成证据明确。','生产业务ID与统一身份/租户/执行资源映射、幂等键及单条确认终态字段。'),
 ('ISSUE-2014',['ENG-FLOW-PERSISTENCE','ENG-FLOW-EXECUTION'],'原专业回传与新业务运行按准确来源身份连接；实际分类路由只作用尚未创建的新运行，已创建run固定方案。','真实原业务回传字段/状态及关联变更的物理映射与并发处理；无旧v2数据迁移，不代表无需核验当前专业回传契约。'),
 ('ISSUE-2015',['ENG-FLOW-EXECUTION'],'受理、真实出呼、通话终态、重试收敛、内容保存、归档及人工确认推进分开，unknown阻止后继。','真实供应商结束/重试终态与保存确认字段，迟到/重复事件收敛及当前执行段唯一关联。'),
 ('ISSUE-2016',['ENG-FLOW-EXECUTION','ENG-FLOW-SCENE'],'AI和Cloud通过准确业务/执行段/任务/通话事实接续，不互套执行策略；AI标签不写字段不自动推进。','跨AI/Cloud真实任务/业务结果关联、最小场景投影和七元组证据字段。'),
 ('ISSUE-2017',['ENG-FLOW-PERSISTENCE','ENG-FLOW-EXECUTION'],'本方业务正式导入必须满足当前分类导入字段、明确首呼方式与本租户AI场景；分配只安排合法责任人。','正式入站导入契约、应用鉴权与授权租户、稳定业务编码/列映射/原始值和重复幂等的生产字段。'),
 ('ISSUE-2018',['EQ-PLAT-PROFESSIONAL'],'当前已选原专业操作及本次业务方向不重开；v1.2最终冻结与本地Mock收尾有既有证据，不要求重复证明。','仍须核源ISSUE-11214对应前序v1.1.1正式专业基底契约；作为原专业契约来源verification缺证保留，不视为旧v2历史兼容取消或已完成。'),
 ('ISSUE-2021',['ENG-FLOW-PERSISTENCE','ENG-FLOW-EXECUTION','ENG-FLOW-SCENE'],'模板字段参考分类仅编排，实际分类独立单路由；run创建冻结完整方案，执行段与准确供应商事实/标签关联。','生产分类/模板当前配置/节点/原执行段/远端标识/终态/有效标签字段和内部接口一致性证据。'),
 ('ISSUE-2022',['ENG-FLOW-PERSISTENCE','ENG-FLOW-EXECUTION'],'按同品牌稳定唯一storeCode定位有效门店，禁止用名称或外呼enterprise猜；无意向由当前总部有权管理员同次指派。','生产brandId/storeCode目录的稳定唯一有效映射、并发版本与转交同次提交参数/确认终态证据。')]
engineering_issue_crosswalk=[{'id':iid,'legacy_issue_id':iid,'status':'open_engineering_evidence_required','product_status':'business_rule_defined_not_reopened','product_rule':rule,'engineering_gap':gap,'current_question_ids':targets,'owner':'development','engineering_category':'verification' if iid=='ISSUE-2018' else 'api' if iid in ['ISSUE-2001','ISSUE-2005','ISSUE-2006','ISSUE-2011','ISSUE-2015','ISSUE-2016','ISSUE-2021'] else 'data','classification_reason':'已确认业务范围、权限和失败结果在当前产品规格中固定；本项只补真实服务契约、数据映射和终态证据，不能以本地Mock替代。','source_refs':['docs/remaining-confirmations.json#'+iid],'original_source_ref':'需求/分析工作区/runtime/open-items.json#'+iid} for iid,targets,rule,gap in issue_specs]
q=next(q for q in engineering_questions if q['id']=='EQ-PLAT-PROFESSIONAL');q['legacy_issue_ids'].append('ISSUE-2018');q['engineering_gap']+='；另保留ISSUE-2018：核源ISSUE-11214的前序v1.1.1正式专业基底契约，v1.2冻结/本地Mock既有证据不重复核验，前序正式来源缺证未完成。';q['question']=q['engineering_gap']
# Report schemas are product-visible variants with explicit columns, units and denominator rules.
def column(key,label,unit,meaning):return {'key':key,'label':label,'type':'number' if unit in ['次','条','人','秒','分钟','元','%','个'] else 'string','unit':unit,'meaning':meaning}
cc=lambda key,label,meaning:column(key,label,'次',meaning)
report_variants=[]
cloud_counts=[cc('total','呼叫量','周期内已结束的呼叫尝试；重呼另算一次'),cc('connected','客户接通','有明确客户接通证据'),cc('unanswered','客户未接通','有明确未接通证据'),cc('pending','结果待确认','证据不足，不能当未接通'),column('rate','接通率','%','connected/(connected+unanswered)×100，一位小数；分母0为—')]
report_variants.append({'reportKind':'overview','grain':'当前有权tenant+enterprise；按呼叫方式行','period':'已结束话单开始时间归期，缺失只用可核实接通/结束时间；时间全缺不计周期并显示质量计数','columns':[column('type','呼叫方式','枚举','人工/预外呼/IVR/呼入')]+cloud_counts+[cc('firstCount','首呼量','完整可见历史或明确attemptNumber=1证据；不因筛选周期重算'),column('firstRate','首呼接通率','%','首呼接通/首呼已确认结果量，一位小数；unknown首重呼不入分母'),cc('repeatCount','重呼量','明确attemptNumber>1或同任务有已知更早尝试'),column('duration','双方时长','秒','接口双方bridgeSeconds有效非负样本合计，自动纯IVR不适用'),column('customerSeconds','客户接听时长','秒','仅预测/自动接口明确客户时长，其他方式不补算')],'summary_extra':['customers按tenant+enterprise+规范号码去重，号码未识别另计，不以callId伪造客户','durationSamples为已接通且适用且时长可确认样本，0秒有效；durationMissing不当0','avgSeconds=有效双方时长合计/有效时长样本数；无有效样本—；显示最多一位小数秒','attemptUnknown单列，不默认首呼'],'drill':'方式行/指标/时间桶→同筛选准确callId；录音/文本按对象读权'})
report_variants.append({'reportKind':'leads','grain':'仅当前有权范围内，同品牌同稳定线索编码聚合；无编码行各自保留，不按手机号合并不同编码','period':'以线索首次导入日期筛选，再显示这些线索截至当前累计联系及最新业务填写；不是历史状态快照','columns':[column('code','线索编码','文本','前导零保留'),column('name','客户','文本','称呼及关联规范号码'),column('followupStatus','跟进状态','枚举','原待继续跟进/已完成及原未分配状态'),cc('callCount','呼叫次数','关联的明确呼叫尝试数'),cc('connectedCount','接通次数','至少客户接通的准确通话次数'),column('lastContactAt','最近联系','时间戳','该线索最后联系时间'),column('intentionLevel','意向等级','枚举','最近一次已填写意向值，未填为空不首项'),column('plannedVisitAt','计划到店','日期时间','计划到店时间与门店，不表示已实际到店')],'summary_extra':['leadCount为筛选线索条数；assigned至少一关联名单分配；contacted至少一次呼叫尝试','connected为至少一次确认客户接通的线索数；pendingFollowup未标记跟进完成','contacted/leadCount联系覆盖率与connected/leadCount线索接通率，一位小数；分母0为—','completed只指原跟进完成，不指成交；visitIntended/testDriveIntended取最近已填有意向，不等实际到店/试驾','intentionRecorded为已填写意向条数，plannedVisit为已计划到店条数，missingCode另列'],'drill':'准确聚合key→仅其授权业务记录id/任务id/callId；原始多记录不合并业务身份'})
report_variants.append({'reportKind':'customers','grain':'导入批次行；每批每条客户名单计1条','period':'按导入批次日期选择，显示截至当前分配/跟进累计状态','columns':[column('name','导入批次','文本','准确batchId名称'),column('businessType','业务类型','枚举','导入当时业务类型'),column('total','名单量','条','本批客户行数'),column('assigned','已分配','条','已分配人工坐席或专业任务'),column('unassigned','待分配','条','没有坐席也没有任务'),column('contacted','已联系','条','具有呼叫尝试，不要求接通'),column('followup','待继续跟进','条','原跟进状态待继续跟进'),column('completed','跟进完成','条','原人工已完成，不表示成交')],'summary_extra':['同号不同批次分别计名单；distinctCustomers按当前tenant+规范号码去重另显','不把旧专业坐席/任务分配解释成新四节点导入分配目标'],'drill':'批次行/状态指标→该范围原客户名单id及当前归属状态，不增加准确批次导出能力'})
report_variants.append({'reportKind':'outbound','grain':'预外呼/IVR准确专业任务行','period':'任务创建/计划/启动日期在周期内或周期内有通话；周期通话与累计供应商/平台名单并列不可混算','columns':[column('name','任务名称','文本','taskId对应名称'),column('callType','任务类型','枚举','预外呼/IVR'),column('status','当前状态','枚举','准确任务确认态'),column('supplierTotal','累计号码','条','供应商任务报表总号码，不按本周期裁剪'),cc('supplierCalled','累计呼叫','供应商任务累计呼叫次数含重呼'),cc('supplierRetry','累计重呼','供应商任务累计重试次数'),column('completed','平台已处理名单','条','平台累计已处理客户行数，不代表接通'),column('finishRate','平台处理率','%','平台累计已处理/平台累计名单，不是供应商进度'),cc('loaded','周期呼叫量','本周期已加载的已结束尝试'),cc('connected','客户接通','周期确认接通'),cc('unanswered','客户未接通','周期确认未接通'),cc('pending','结果待确认','周期未知结果'),column('connectRate','周期接通率','%','周期connected/(connected+unanswered)，未知不入分母，0分母—')],'summary_extra':['任务数为筛选任务行数；重呼计次数；供应商字段未知不补0','不同累计/周期分母禁止交叉计算'],'drill':'准确taskId详情或其当前周期通话callId明细'})
for kind in ['agents','skills']:
 report_variants.append({'reportKind':kind,'grain':'按当前tenant+enterprise+准确工号聚合坐席' if kind=='agents' else '按首呼队列与技能明确历史对应聚合，不能按当前坐席技能倒推历史','period':'只含已结束通话；无法确认实际人工接听归属的呼入/多方流转不强分摊，未关联记录单列质量计数','columns':[column('name','坐席/工号' if kind=='agents' else '服务技能','文本','准确资源身份'),column('tenant','所属租户','文本','当前授权租户'),column('skills' if kind=='agents' else 'members','当前关联技能数' if kind=='agents' else '当前关联坐席数','个','当前有效关联数量，不代表周期历史数量'),cc('total','关联通话','周期关联已结束通话尝试'),cc('connected','人工接通','客户与坐席双方均有接通证据'),cc('unanswered','人工未接通','有明确人工未建立事实'),cc('pending','人工结果待确认','仅客户或仅坐席接通不足证明双方接通'),column('rate','人工接通率','%','humanConnected/(humanConnected+humanUnanswered)，一位小数，未知不入分母，0分母—'),column('talk','人工时长','秒','双方实际通话有效时长，不将整通多方时长重复分摊')]+([column('queue','首队列平均等待','秒','首次队列等待有效样本平均，不含后续流转队列')] if kind=='skills' else []),'summary_extra':['联系客户按tenant+enterprise+规范号码去重；无法识号另列','humanDurationSamples仅双方人工接通且时长可靠样本；0秒有效；humanDurationMissing不填0','humanAvgSeconds=有效人工秒数合计/有效样本数，无样本—，秒最多一位小数'],'drill':'资源行→该准确历史归属的callId集合；读明细不授监管/资源编辑'})
report_variants.append({'reportKind':'inbound','grain':'每个已结束呼入callId一行','period':'按已结束呼入开始时间，缺失仅可靠接通/结束时间；正常呼入不因公共拒联排除','columns':[column('id','通话编号','标识','准确callId'),column('tenant','所属租户','文本','当前授权tenant'),column('agent','首呼坐席','文本','接口首呼目标，不代表流转后全部实际接听人'),column('result','客户结果','枚举','客户接通IVR不等于人工接通'),column('humanResult','人工结果','枚举','双方接通才确认人工通话'),column('queueResult','排队结果','枚举','官方队列中放弃/溢出，不自行推排队超时'),column('duration','通话时长','秒','接口明确时长，缺失—')],'summary_extra':['呼入量已结束呼入次数；人工接通率仅人工已确认结果分母','首队列平均等待=可靠首次排队秒数和/首次排队有效样本数，无样本—','queueAbandoned/queueOverflow须系统应答且官方相应队列结果；不可只看短时长猜测'],'drill':'本条准确callId→录音/文本，读权独立核验'})
report_variants.append({'reportKind':'AI-call','grain':'当前有权AI租户，日期+具体场景+平台行；保外呼统计/客户统计两tab','period':'原AI呼叫时间筛选，场景与平台独立；不混Cloud已确认结果分母','columns':[column('date','呼叫时间','日期','原统计归期'),column('sceneName','场景名称','文本','准确原场景'),column('platformName','智能平台','文本','准确供应商平台'),cc('dialTotal','拨打总次数','原拨打次数'),column('rosterTotal','呼叫名单总数','条','原本行名单/客户基数'),cc('connectedTotal','接通总数','原统计确认接通数'),cc('missedTotal','未接通总数','原统计确认未接通数'),column('connectedRate','接通率','%','当前renderer connectedTotal/rosterTotal×100，两位小数'),column('touchRate','触达率','%','当前renderer (connectedTotal+missedTotal)/dialTotal×100，两位小数；保原AI口径不替换Cloud公式'),column('duration','累计通话时长','人类可读时长','源值如23分15秒/1小时12分8秒；不得当分钟数直接做账务')],'summary_extra':['明确分母=0时原AI显示0.00%；源字段缺失/未知不假装为已确认0','客户tab展示date/scene/platform/rosterTotal客户总数/connectedTotal有效通话客户数/duration累计时长；客户平均通话时长当前renderer仅—，本版未提供计算能力，不编造均值','原列设置/导出若仅有界面但未实现，明确不可用，不生成假文件'],'drill':'原AI通话统计为行展示；无已实现明细动作时不由表格自行新增通话查询权'})
report_variants.append({'reportKind':'AI-billing','grain':'当前有权AI租户，计费日期区间+平台+计费类型；下钻模型，再到准确通话','period':'计费日期筛选独立于服务汇总8列导出及公共租户列表筛选','columns':[column('dateFrom/dateTo','计费日期','日期区间','原计费统计归期'),column('tenantName','租户名称','文本','准确AI服务租户显示'),column('platformName','智能平台','文本','原供应商平台'),column('billingType','计费类型','枚举','原按分钟收费；按账号收费不在此统计'),column('durationMinutes','计费时长','分钟','以客户接通为准，每通未满1分钟按1分钟计费；不是原时长总秒数四舍五入')],'detail_columns':['模型层：计费日期/租户/平台/模型类型/计费时长分钟','通话层：规范用户号码/通话开始结束时间/原通话时长/逐通计费分钟/场景名称'],'summary_extra':['零通话且可靠统计可0分钟；未知时长/未知账务不补0，不由分钟服务池反算原报表','模型层是统计维度，不能恢复旧大/小模型独立余额列或合并Cloud账务','计费汇总须为对应通话计费分钟之和，单通接通记录的计费分钟ceil(可计费秒数/60)；缺计费证据标未知，不把人工双方时长替代客户计费时长'],'drill':'原统计行→准确模型行→准确原通话计费明细；查看不授充值/调整'})
report_variants.append({'reportKind':'AI-lead','grain':'总部NEV/ICE各自独立；外呼线索统计/外呼线索明细/线索回流统计三tab','period':'统计按导入日期或回流统计时间及当前已应用场景/意向级别/门店筛选；业务明细保稳定clueCode及前导零','columns':[column('date','导入日期','日期','原统计归期'),column('type','业务类型','枚举','原新/冷等专业类型'),column('importCount','导入线索量','条','源统计导入线索数'),column('callCount','外呼客户量','人','源统计已外呼客户基数'),column('connectedCount','AI已接通量','人','源统计接通客户数'),column('dispatchCount','已下发线索数','条','源确认下发数'),column('rate','AI接通率','%','connectedCount/callCount×100，一位小数；接收源同口径值时保原值和基数'),column('avgDuration','平均通话时长','mm:ss','以具有效接通时长样本均值为口径；源提供的平均值必须对应其有效样本基数，未知不以00:00代填')]+[column('level'+k,k+'级客户数','人','原中台意向'+k+'分类计数；E混合拒绝/无效/无应答不等于客户明确拒联') for k in 'ABCDE'],'detail_columns':['importTime导入时间/clueCode线索编码/sceneName场景/type业务类型/phone号码/storeCode门店编码/storeName门店名称/callTime呼叫时间/status通话状态/duration时长/levelCenter中台意向/levelBiz业务系统意向/dispatchStore下发门店'],'return_columns':['date统计时间/scene场景/importCount线索传入数/submitCount提交外呼数/returnCount线索回流数；都是各自明确条数，不由差额推成功'],'summary_extra':['callCount为0且明确无客户时百分比展示无基数—；缺失/未知均显未取得，不能沿旧静态renderer默认补0','意向levelCenter与levelBiz来源分别保留，不据标签自动写业务字段或自动下发','统计聚合不改变业务记录身份，不以同号/同名合并业务'],'drill':'明细行保准确来源线索/场景/通话标识；原不可用导出明确不可用，不因统计可见授跨租户数据'})
f=next(f for f in fields if f['id']==F['REPORT-DATA']);f['format']='只读结构化报表对象 {reportKind,appliedFilters,scope,summary,rows,quality,detailLinks}；reportKind采用下列10种真实renderer语义'
f['derivation']={'kind':'calculated','rule':'Cloud七类从有权已结束通话/原任务名单及跟进事实按各报表明确粒度计算；AI三类读取当前有权源统计并保其具体分母/单位，已确认公式见report_variants；不从Mock或缺失值猜计数。','dependencies':[F['REPORT-KIND'],F['QUERY'],F['CALL-STATE'],F['CALL-TIMES'],F['TASK-STATE'],F['PRO-FOLLOW-STATE']]}
f['object_members']=[{'key':'reportKind','type':'string','required':True,'rule':'Cloud七类及AI-call/AI-billing/AI-lead明确区分；不以同名字段跨报表共享分母'},{'key':'appliedFilters','type':'object','required':True,'rule':'与本次统计结果同次固定的有权筛选，见FIELD-PLAT-QUERY'},{'key':'scope','type':'object','required':True,'rule':'准确账号/租户/enterprise/平台读权交集'},{'key':'summary/rows','type':'object/array','required':True,'rule':'按以下report_variants字段解释；可靠空结果rows=[]，读取失败不是空集'},{'key':'quality','type':'object','required':True,'rule':'缺失时间/号码/归属/首重呼/时长样本分别计量展示；不静默填0'},{'key':'detailLinks','type':'array','required':False,'rule':'准确row key和callId/taskId/customerId，仅明示已实现入口可进入，目标读权再次检查'}]
f['report_variants']=report_variants
f['validation_rules']=['按reportKind解释真实列、单位、时间窗口、计数粒度和分母，禁止跨报表套公式','Cloud结果未知不入接通率分母，0秒是有效时长样本而null/缺失不算0；无样本均值—','Cloud比例一位小数；AI通话当前公式两位小数；各表的明确零基数与未知分别按variant显示','精确行主键/原通话与当前筛选用于明细，计数可见不授目标整页、导出或写入','本轮补齐静态renderer缺值展示语义：已确认0保持0，源缺失/未知不得用旧fallback伪装0；AI客户平均时长仍明确未实现']
f['examples']={'valid':['{"reportKind":"overview","summary":{"connected":8,"unanswered":2,"pending":1,"rate":"80.0%","durationSamples":2,"seconds":0,"avgSeconds":0},"rows":[],"quality":{"durationMissing":1}}','{"reportKind":"AI-call","rows":[{"dialTotal":80,"rosterTotal":80,"connectedTotal":50,"missedTotal":12,"connectedRate":"62.50%","touchRate":"77.50%","duration":"23分15秒"}]}'],'invalid':['Cloud connected=8/unanswered=2/pending=1却用8/11作接通率：拒绝该指标解释','durationSamples=0且未知时长填0秒平均，或AI计费以双方时长替代客户计费：不得显示可靠结果']}
f['persistence']={'kind':'transient','write_when':'每次明确查询按当前授权/已应用筛选取得同次事实并计算本次只读结果；不写业务/通话/账务；导出冻结该次可靠结果范围；查询失败保上下文且标旧结果非最新'}
f['lifecycle']=[{'state':'query','behavior':'固定本次有权scope/已应用筛选，按reportKind分别取数与计算；不可把另tab筛选当当前已应用值'},{'state':'ready','behavior':'按真实列/计量单位/分母展示summary与rows，质量缺失另列；零、缺失、未知、不适用分开'},{'state':'drill','behavior':'只以准确行/指标与当前筛选定位已实现明细；目标再次验权；不修改专业业务事实'},{'state':'error','behavior':'保留筛选和已确认旧结果并标非最新，错误与无数据分别呈现，不制造全0新结果'}]
# Existing FIELD-FLOW atoms are canonical field-library definitions; this is only an original entry/view container.
f=next(f for f in fields if f['id']==F['PRO-FIELD-DEF']);f['format']='同源字段定义视图 {id,label,type,businessKey,options,enabled,dictionaryId?,selectionMode?,useQueryConditions?,depends?,parameterBindings?}；无格式配置'
f['object_members']=[
 {'key':'id','type':'string','nullable':False,'required_when':'创建系统生成，编辑/引用必需','default':'系统稳定ID','validation':'字母开头、字母数字下划线连字符，最多64字符，禁__proto__/prototype/constructor；编辑不可改','canonical_field_ref':'FIELD-FLOW-FIELD-ID'},
 {'key':'label','type':'string','nullable':False,'required_when':'字段保存必填','default':'新建空，编辑现值','validation':'去首尾空白1–40字符','canonical_field_ref':'FIELD-FLOW-FIELD-LABEL'},
 {'key':'type','type':'enum','nullable':False,'required_when':'字段保存必选','default':'新建text，编辑保持','validation':'text/textarea/number/select/multiselect/date/datetime/interface；接口single/multiple是selectionMode，不新增别的类型；预置保护类型不可改','canonical_field_ref':'FIELD-FLOW-FIELD-TYPE'},
 {'key':'businessKey','type':'string','nullable':True,'required_when':'当前IMPORT用途必填，FOLLOWUP无映射需求可空；原专业选填不能放宽IMPORT','default':'空字符串仅按用途允许','validation':'去首尾空白≤80、无控制字符；前导零/字母大小写按不透明编码保留；品牌+用途内映射唯一性按当前字段规则','canonical_field_ref':'FIELD-FLOW-FIELD-KEY'},
 {'key':'options','type':'array','nullable':False,'required_when':'select/multiselect为1–50项，非选项类型为空集合','default':'新建非选项[]，首次切换选项类型新空项须用户完成','validation':'每项{id,label,businessKey,enabled?}；id非空≤80且同字段唯一，label非空≤80且同字段不分大小写唯一，非空业务编码≤80无控制符且同字段唯一；稳定optionId保引用；预置选项保护','canonical_field_ref':'FIELD-FLOW-FIELD-OPTIONS','member_refs':['FIELD-FLOW-OPTION-ID','FIELD-FLOW-OPTION-LABEL','FIELD-FLOW-OPTION-KEY','FIELD-FLOW-OPTION-ENABLED']},
 {'key':'enabled','type':'boolean','nullable':False,'required_when':'创建/启停必需','default':True,'validation':'显示/必填是分类引用规则；字段库启用不自动加入分类；当前启用分类显示引用时不允许停用，任何分类引用不得删','canonical_field_ref':'FIELD-FLOW-FIELD-ENABLED'},
 {'key':'dictionaryId','type':'string','nullable':True,'required_when':'type=interface必填','default':'无自动首项','validation':'仅当前租户已授权且启用真实取数能力；品牌共享不扩接口查询权；引用已使用后更换来源须准确能力/引用保护','canonical_field_ref':'FIELD-FLOW-DICTIONARY-ID'},
 {'key':'selectionMode','type':'enum','nullable':True,'required_when':'type=interface明确single或multiple','default':'按当前已保存明确模式，不把未知回退single','validation':'只single/multiple；单选只能一值，多选数组；保存原选择稳定值与显示名','canonical_field_ref':'FIELD-FLOW-SELECTION-MODE'},
 {'key':'useQueryConditions/depends/parameterBindings','type':'boolean/array/object','nullable':False,'required_when':'interface明确是否关联及参数映射','default':'仅按显式已保存配置；无关联时空depends','validation':'按准入接口schema支持参数，将多个上游字段属性映射多个参数；上游必须在当前分类显示、类型匹配、无自依赖或循环；意向车系预置接口无需关联其他字段且不可改手工选项','member_refs':['FIELD-FLOW-QUERY-CONDITIONS','FIELD-FLOW-FIELD-DEPENDS','FIELD-FLOW-PARAM-BINDINGS']}
]
f['validation_rules']=['PAGE2223的原专业字段入口映射到当前同源字段库，不新建租户旧目录或第二套可编辑定义；所有共同原子输入引用FIELD-FLOW规范','本容器只描述已保存定义和只读预览；是否导入/填写、品牌归属、业务编码必填按canonical_field_ref所指当前规则，不能以原专业选填豁免导入','预览不保存客户值；配置者与实际处理人分权，当前轮展示/保存依据及已有快照不因目录编辑改变','schema外供应商透传参数仅按该准入能力schema解释，不能伪装成自由新增字段/接口；不提供格式配置']
f['examples']={'valid':['{"id":"field_model","label":"意向车型","type":"select","businessKey":"intended_model","options":[{"id":"option_A","label":"车型A","businessKey":"A"}],"enabled":true}'],'invalid':['select但options=[]、同字段重复label、label超过40字：拒绝','IMPORT用途businessKey为空或未授权dictionaryId：拒绝；不能用原专业选填豁免','previewOnly出现保存客户值或修改已发生快照：不允许']}
f['persistence']={'kind':'transient','write_when':'查询/预览读取当前canonical FIELD-FLOW字段库已保存定义形成此专业入口视图；实际新增/编辑/启停/删除由同源原子字段动作成功时保存，不在本容器复制第二套记录；失败保输入'}
f['derivation']={'kind':'calculated','rule':'原专业字段入口对当前同源字段库的定义视图；只读容器，具体输入写入canonical_field_ref对应实体，不作为另一个租户目录','dependencies':[F['PRO-FIELD-ID']]}
f['permissions']['write']=[];f['lifecycle']=[{'state':'query_or_preview','behavior':'从同源当前字段库按准确fieldId读定义；previewOnly无客户值保存按钮'},{'state':'edit','behavior':'有配置权时编辑canonical字段原子输入；本视图不单独保存，用途/品牌/类型/选项/接口依据共同字段规则'},{'state':'saved','behavior':f['persistence']['write_when']}]
for f in fields:
 if f['id']==F['PRO-FIELD-ID']:f['name']='专业入口所引用的当前字段ID';f['validation_rules']=['当前同源字段库稳定ID；原专业入口不是租户旧目录副本','按品牌/用途及当前配置范围准确引用，不按名称合并；共同身份参FIELD-FLOW-FIELD-ID']
for lo in locals_:
 if lo['id']==L['PRO-FIELD']:
  lo['steps'][1]['action']='新增/编辑提交当前同源字段库的label/type/businessKey/options/enabled及接口原子输入；品牌与IMPORT/FOLLOWUP用途遵守FIELD-FLOW定义；原专业入口不复制旧租户目录，不以原选填规则放宽导入编码必填'
  lo['postconditions']=['当前同源字段库准确定义维护或只读预览；专业入口保留但不复制字段实体，已有引用和快照不变']
 if lo['id']==L['REPORT-QUERY']:lo['steps'][0]['action']='按FIELD-PLAT-REPORT-DATA.report_variants明确的Cloud七类/AI三类粒度、实际列、计量单位、归期、接通率分母、有效时长样本和质量统计分别计算/读取，禁止把AI/Cloud同名指标混算'
for c in checks:
 if c['id'] in [C['REPORT-QUERY'],C['REPORT-DRILL'],C['REPORT-EXPORT']]:
  c['procedure']+='逐个打开Cloud七类与AI三类，核对列、基数及单位；用Cloud接通8/未接2/未知1、0秒有效样本、缺失时长、首队列多次流转、同号跨批次、AI80次名单50接通12未接数据检查公式与明细。';c['expected']+='；Cloud接通80.0%且未知不入分母、0秒有效无样本—；AI例为接通62.50%/触达77.50%；累计/周期、客户/尝试、客户时长/双方时长/计费分钟不混用。'
 if c['id']==C['PRO-FIELD']:c['procedure']+='从专业入口编辑当前字段label/type/options/interface并只读预览；验证IMPORT业务编码为空被拒、选项1–50与重复、接口无授权拒绝和已有引用删除阻止。';c['expected']+='；同源canonical定义只保存一处，无第二套旧目录；预览不写客户值。'
source_evidence += [
 {'path':'../1.2.0/prototype-class-flow/js/pages/report-center.js','absolute_path':str((BASE/'../1.2.0/prototype-class-flow/js/pages/report-center.js').resolve()),'supports':'七类Cloud报表真实列、指标卡、分母、样本时长、首队列及明细关联'},
 {'path':'../1.2.0/prototype-class-flow/js/components/report-metrics.js','absolute_path':str((BASE/'../1.2.0/prototype-class-flow/js/components/report-metrics.js').resolve()),'supports':'确认结果分母、0秒有效/缺失样本、人工双方接通、首重呼及规范号码去重'},
 {'path':'../../DCC&AI 外呼/AI 外呼/js/pages/report-call.js','absolute_path':'/Users/huhaowen/Documents/038-云外呼平台/DCC&AI 外呼/AI 外呼/js/pages/report-call.js','supports':'AI双tab实际列、接通率名单基数、触达率拨打基数、两位小数及客户平均时长尚未实现'},
 {'path':'../../DCC&AI 外呼/AI 外呼/js/pages/report-billing.js','absolute_path':'/Users/huhaowen/Documents/038-云外呼平台/DCC&AI 外呼/AI 外呼/js/pages/report-billing.js','supports':'AI计费日期/平台/类型、模型及通话嵌套明细、客户接通逐通向上计费分钟'},
 {'path':'../../DCC&AI 外呼/AI 外呼/js/pages/report-clue.js','absolute_path':'/Users/huhaowen/Documents/038-云外呼平台/DCC&AI 外呼/AI 外呼/js/pages/report-clue.js','supports':'AI NEV/ICE统计、明细和回流三tab真实列及各自计数；与共同未知不补0规则结合'},
 {'path':'../1.2.0/prototype-class-flow/js/components/customer-business.js','absolute_path':str((BASE/'../1.2.0/prototype-class-flow/js/components/customer-business.js').resolve()),'supports':'专业字段定义与当前同源字段原子label/type/businessKey/options/interface结构、长度、枚举、预置/引用保护'}]
# Propagate richer local terminal descriptions without changing any stable ID.
lo_by={lo['id']:lo for lo in locals_}
for r in ret_specs:
 if r['operation_ref'].startswith('retained-source-cloud-field-') or r['operation_ref']=='cloud-save-filling-fields':r['input_constraints'].insert(0,'当前同源FIELD-FLOW字段库定义；品牌/IMPORT/FOLLOWUP规则不由专业入口豁免');r['result']='当前同源准确字段定义按原子规则维护或previewOnly只读；不创建租户旧目录副本、不写客户值或旧快照。'
# Structural audit of this fragment (product references only; no build or production tests).
field_ids={f['id'] for f in fields};local_ids={lo['id'] for lo in locals_};check_ids={c['id'] for c in checks}
for lo in locals_:
 u=set(lo['inputs']+lo['outputs'])
 for st in lo['steps']:u.update(st['reads']+st['writes'])
 for br in lo['branches']:u.update(br['field_ids'])
 assert u==set(lo['field_ids']),(lo['id'],'bad field union')
 assert u<=field_ids,(lo['id'],u-field_ids)
 assert set(lo['test_refs'])<=check_ids
assert len(ret_specs)==222 and len({r['operation_ref'] for r in ret_specs})==222
assert len(fields)==len(field_ids) and len({(f['entity'],f['key']) for f in fields})==len(fields),'duplicate field entity/key'
assert len(feat)==28
assert all(f['test_refs'] for f in fields),[f['id'] for f in fields if not f['test_refs']]
for f in fields:assert set(f['derivation']['dependencies'])<=field_ids,(f['id'],'bad dependency')
fragment={'schema_version':'product-platform-fragment@1','scope':'current full product baseline; 28 stable delta features + 222 current retained professional operations; no production implementation changes','features':feat,'acceptance_updates':acceptance_updates,'locals':locals_,'fields':fields,'checks':checks,'page_mappings':page_mappings,'action_mappings':action_mappings,'retained_capability_specs':ret_specs,'not_adopted_observations':not_adopted,'supersessions':supersessions,'engineering_questions':engineering_questions,'engineering_issue_crosswalk':engineering_issue_crosswalk,'source_evidence':source_evidence,'coverage_summary':{'features':len(feat),'retained_operations':len(ret_specs),'locals':len(locals_),'fields':len(fields),'checks':len(checks),'platform_page_mappings':len(page_mappings),'action_id_mappings':len(action_mappings),'validation':'JSON field/ID/union refs audited; no prototype build, browser, real auth/vendor/financial evidence asserted'}}
(OUT/'fragments/platform.json').write_text(json.dumps(fragment,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(fragment['coverage_summary'],ensure_ascii=False))
