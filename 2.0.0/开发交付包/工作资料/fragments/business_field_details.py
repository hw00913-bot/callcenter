"""Business-level semantic details; no physical storage or API design."""
def enrich_fields(fields):
 examples='''BRAND-ID|当前明确品牌BRAND-A下新建字段，brandId引用BRAND-A。|BRAND-A管理员提交BRAND-B字段，拒绝且不切换品牌。
FIELD-ID|同名“意向”分别建立IMPORT-F1、FOLLOWUP-F2两个稳定ID。|把已用IMPORT-F1改作填写用途，引用保护阻止覆盖。
FIELD-USAGE|新建导入字段明确usage=IMPORT。|导入Tab提交FOLLOWUP用途，保存拒绝。
FIELD-LABEL|同品牌IMPORT名称“来源渠道”，长度4字。|同品牌同用途已有“来源渠道”再建同名，提示重复；41字拒绝。
FIELD-TYPE|导入来源配置text，填写结果配置select。|IMPORT选择interface，拒绝该类型。
FIELD-KEY|导入字段业务编码“001渠道”非空且保留前导零。|IMPORT业务编码空白或含控制字符，拒绝；不要求大写英文格式。
FIELD-ENABLED|无当前启用分类/接口依赖的自定义字段可停用。|停用使仍启用分类失去依赖，阻止并列引用位置。
FIELD-OPTIONS|select含稳定ID o1/o2、文案“愿意/暂缓联系”的两项。|选择字段零选项或51项，拒绝；引用后的o1不能删后重用。
OPTION-ID|同字段两个选项ID o1、o2，保存后按o1引用。|同字段两项都为o1，拒绝重复身份。
OPTION-LABEL|选项o1显示“愿意参加”，改为等义文案不改ID。|同字段两项都叫“愿意参加”或81字，拒绝。
OPTION-KEY|同字段o1业务编码“001”按不透明文本保存。|同字段o2也用非空“001”，拒绝；引用后不能改原编码含义。
OPTION-ENABLED|未受保护的自定义o2停用后不再新选，既有快照仍读原o2。|停用预置线索等级A级选项，拒绝改变统计口径。
DICTIONARY-ID|选择本租户已授权启用的能力d-mapping-series。|填写另一租户私有能力ID，拒绝取数并保留草稿。
SELECTION-MODE|接口字段selectionMode=multiple可显式选两个返回对象。|本次明确single却提交多对象，按所选方式拒绝。
QUERY-CONDITIONS|useQueryConditions=false时depends和parameterBindings均为空。|false仍携带上游参数，保存拒绝，不能悄悄执行关联查询。
FIELD-DEPENDS|关联查询只依赖本分类已启用上游FOLLOWUP-A。|依赖自身、两个上游或形成A→B→A循环，拒绝。
PARAM-BINDINGS|同上游对象的dealerCode和cityCode分别映射两个明确查询参数。|参数dealerCode无来源属性或来源不在唯一上游，拒绝且不猜首项。
CATEGORY-ID|预置新线索稳定ID lead；改显示名不改该ID。|把与lead同名的新对象当lead合并，拒绝身份替代。
CATEGORY-LABEL|自定义分类“活动回访”1～40字内。|仅空格或41字，保输入并阻保存。
CODE-LABEL|活动类导入业务编码列名设为“活动业务编码”。|空列名或超过40字，拒绝；改列名不得重置已有编码。
BUSINESS-FAMILY|新分类显式LEAD，后续按同品牌线索统一编码去重。|已有业务的ORDINARY分类改LEAD，引用保护拒绝。
CATEGORY-IMPORT-REFS|添加同品牌IMPORT-F1，enabled=true、required=true，排序为第一项。|引用FOLLOWUP-F1，或enabled=false仍required=true，拒绝。
CATEGORY-FOLLOWUP-REFS|启用填写FOLLOWUP-F2且接口上游先于下游，各自明确必填。|引用IMPORT或让接口上游缺失/停用，保存拒绝。
CATEGORY-REVISION|分类基础合法变更后内部修订由1递增，界面不让用户选V1。|用旧修订提交覆盖新基础，拒绝并保草稿。
TEMPLATE-ID|模板FLOW-A引用同品牌字段，用稳定templateId供分类另行绑定。|按相同名称把FLOW-A和FLOW-B当同一模板，拒绝猜配。
TEMPLATE-NAME|模板名“总部转门店后跟进”明确保存。|只含空白名称，保草稿并阻保存。
TEMPLATE-REF-CATEGORY|参考新线索编排字段，兼容的冷线索可在自身路由绑定该模板。|保存参考分类时自动将新线索绑定模板，禁止副作用。
TEMPLATE-REVISION|再次编辑同一模板保存后成为当前配置，已开run仍读原plan。|要求业务用户选择模板V1/V2或直接覆盖在跑plan，禁止。
NODES|唯一开始锚点连接转交→呼叫→结束，所有组件可达。|空白节点、第二个开始、孤立节点或循环，阻模板保存。
EDGES|两节点间一条稳定edge，画布与侧栏共同编辑同一条。|同from/to重复连线或to不存在，拒绝保存。
ENTRY-RULES|IMPORT来源条件按顺序列出，唯一默认入口最后直达结束。|没有默认入口、两个默认或入口依赖未来通话，阻保存或导入预检。
NODE-ID|同模板TRANSFER-1与CALL-1不同ID；改名不改ID。|两个节点共用CALL-1或条件按名称定位，拒绝。
NODE-NAME|拖入呼叫组件生成“呼叫1”，可改为“总部复核”。|空白节点名，保存拒绝；名称不能改变组件类型。
NODE-TYPE|拖入呼叫组件后产品类型CALL，无二次类型选择。|把转交组件配置成多类型或显示空白节点类型，拒绝。
RECIPIENT|CALL选本租户CURRENT，按当前owner运行；转交路径另定OTHER目标。|CALL直接将owner从总部改其他门店，必须先转交，拒绝越步。
METHOD|呼叫节点methods仅为[AI]，分配页不再重选方式。|同一CALL配置AI和MANUAL两种，拒绝。
NEXT-NODE|出口明确指向现有END-1，结束节点无出口。|指向已删节点或自己形成环，拒绝保存。
EDGE-ID|EDGE-1用于画布、侧栏和唯一命中确认。|旧确认拿EDGE-1但此边目标已变，拒绝旧确认。
BRANCH-KIND|单一无条件出口为ELSE；单条条件IF后仍有唯一末位ELSE。|普通节点两个ELSE或ELSE后再条件，拒绝。
BRANCH-PRIORITY|三个出口按1、2、3保存，首命中仅选一条。|重复优先级或试图多匹配后人工任选，拒绝。
GROUP-MODE|ALL中每项已知再算全满足；ANY中每项已知再算任一满足。|ANY已有一项真但另一项PENDING就放行，当前规则禁止并保持待核。
RULES|条件路径含IMPORT sc属于[1,2]一条规则。|条件路径rules=[]或默认路径带规则，拒绝。
RULE-ID|规则RULE-1更换比较值时保持同一ID。|同组重复RULE-1或无稳定身份，拒绝保存。
RULE-SOURCE|单独IMPORT条件读取sc，不要求关联任何呼叫方式。|AI通话来源混用人工填写结果或接口对象比较，拒绝来源错配。
RULE-FIELD|实际目标分类启用同一稳定IMPORT-F1，可使用它的条件。|目标只有同名不同ID字段，阻绑定，不能按名称猜配。
RULE-OPERATOR|文本选IN并提供两个明确值，数值可选GTE单值。|文本用GT或EQ填写多个值，提示换合法运算符。
RULE-VALUES|IN输入两行“001”和“002”；一行“001,002”是一个完整文本值。|EQ两行值、IN重复项或数值行空白被变成0，拒绝并保输入。
RESULT-SOURCE|下游转交取本run本承接阶段上游CALL-1已确认状态。|CURRENT_NODE借新run以外旧段结果或另一租户AI标签，保持PENDING。
ENTRY-CONTEXT|总部导入生成OWNER_KIND=HQ、PURPOSE=FIRST。|名单自带PURPOSE=CORRECTION试图绕过受控入口，拒绝冒充上下文。
ROUTE-MAIN|实际分类选择本品牌兼容FLOW-A并独立保存main。|把模板参考分类当强制相等条件，或提供解绑按钮，均不符合当前产品。
ROUTE-VERSION|同次读取的routeVersion用于提交确认；基础改后重读再存。|旧routeVersion覆盖期间已改绑定，拒绝并保本次选择。
EFFECTIVE-PLAN|正式导入为实际冷线索捕获完整plan，参考分类元信息另记。|实际run直接引用可被后续编辑重绘的当前模板，禁止。
IMPORT-TEXT|有表头的CSV客户编码、姓名、号码和真实sc列，经显式映射检查。|非空数据列被静默忽略导致原行消失，拒绝并提示映射/忽略。
IMPORT-MAPPING|“联系电话”列明确映射系统phone，备注列明确忽略。|两列映射同一目标或必需phone未映射，阻检查并保输入。
FILE-READ|当前窗口请求序号2完成后仅应用2的文本，迟到的1丢弃。|旧窗口序号1读取失败覆盖新窗口输入或错误状态，禁止。
BATCH-NAME|输入“10月总部新线索”，导入成功后批次保存该名。|把尚未提交的名称显示成已经创建的正式批次，禁止。
BATCH-ID|正式导入同次创建BATCH-A，重放原request读同一批次。|unknown后换requestId再创建BATCH-B，阻止重复导入。
IMPORT-PREVIEW|实际两行均通过，逐行显示首呼方式及分流依据。|一行缺sc仍将另一行默默导入，禁止；整次保名单重检。
IMPORT-TOKEN|同份名单、字段、模板、AI场景下最新token提交可确认导入。|预检后改一个sc值仍用旧token提交，拒绝并要求重检。
IMPORT-ORIGINAL|导入保存sc=1及原映射；更正sc=2后原始快照仍为1。|更正当前值时把originalImportSnapshot改成2，禁止覆盖来源。
RECORD-ID|导入创建REC-A，转交/再次跟进/转类仍沿REC-A。|同手机号把REC-A和REC-B合为一条，禁止。
BUSINESS-CODE|LEAD编码“001”保留原文本，在同品牌新/冷线索间统一查重。|同品牌冷线索已有001再新线索导入001，拒绝重复且不覆盖。
CUSTOMER-NAME|导入“张先生”满足系统必需称呼，按原文存当前值。|正式导入姓名空白，阻该行；更正清空不回写旧快照。
PHONE|导入13800000001通过当前联系电话校验；更正明确清空后起呼受阻。|无效号码或UNKNOWN直接实际起呼，拒绝，不按排队号码猜补。
IMPORT-NOTE|“下午联系”可选导入并只读进入本轮basis。|省略note被解释为把既有备注清空，禁止；明确更正才变当前值。
IMPORT-VALUES|IMPORT-F1业务编码sc，字段ID值与sc别名均为文本“1”。|稳定ID为1但sc别名为2，拒绝映射不一致。
FOLLOWUP-VALUES|FOLLOWUP-F2由本人明确provided为高意向后成为当前有效值。|未操作预填值或旧run迟到结果覆盖新current，拒绝。
OWNER-TENANT|总部导入初始owner为当前总部；合法转交同次切目标门店。|仅分配跟进人就切owner，禁止。
FOLLOWER|管理员在当前CALL安排本租户合法账号ACCOUNT-A。|跨租户账号或人工缺本人电话资格的候选，拒绝；不选底层任务。
ARRANGEMENT|当前run/node/tenant/AI方式与所选场景形成一份安排。|旧run或转交前租户的安排被继承用于新owner，清除且重配。
AI-SCENE|直接AI首呼导入明确选择本租户本实际分类的SCENE-A。|导入仅填AI方式而无场景，拒绝；先转交时不强迫原方选目标私有场景。
SCENE-SNAPSHOT|已受理FOLLOWUP-A封存SCENE-A准确tenant、分类和标签上下文修订。|另一场景/修订回调冒充本段标签，拒绝且保原事实。
RESOURCE-SNAPSHOT|MANUAL受理捕获本人唯一合法坐席资源，AI捕获已解析执行方案。|候选资源多义时自动取第一项或借他人坐席，阻发起。
RECORD-REVISION|读取revision=4提交前仍为4可按资格办理，成功递增。|另一人已变为5仍按4转交，拒绝，保原选择。
UPDATED-AT|保存责任人后更新时间变化，列表全量倒序再分页。|仅打开详情就写当前时间使其置顶，禁止。
RUN-ID|正式导入即RUN-A，未拨打也冻结；结束后再次跟进建RUN-B。|因从未拨打就认为没有run、改绑后重写RUN-A，禁止。
RUN-PURPOSE|原run结束后管理员明确FOLLOWUP创建新运行。|运行中传CORRECTION绕过结束/废弃及转交规则，拒绝。
RUN-STATUS|废弃有在途时ABANDONING，全部明确收敛后ABANDONED。|有unknown执行即标ABANDONED并放新呼叫，禁止。
ENTRY-DECISION|导入sc=1命中ENTRY-1，当次owner/目的/时间一并封存。|后来更正sc=2就重算并覆盖旧入口，禁止。
NODE-RUN-ID|新run再次进入CALL-1生成新的NODERUN-B。|仅凭同nodeId借NODERUN-A的本节点结果，拒绝。
STAGE-ID|总部转门店成功后新STAGE-B，旧STAGE-A封存。|同一stage同时代表两个当前owner，禁止。
STAGE-TRANSFER|STAGE-B记录源总部、目标门店、本run及转交时间。|新run借上次run的entryTransfer宣称已经转交，拒绝。
DEPARTURE-SNAPSHOT|总部转出时封本方sc=1；门店后来改2，总部仍只见1。|历史详情或辅助runContext泄露门店后来场景、节点和值，禁止。
FOLLOWUP-ID|一次实际受理FOLLOWUP-A下两次重拨仍同一followup。|每次回调/重试/打开详情新建一个followup，禁止重复计数。
ACTOR|总部管理员用本人合法坐席代责任人发起，actor记管理员本人。|把assigned follower冒充实际发起人，禁止。
ACTUAL-HANDLER|MANUAL按本次本人资源assignedAccountId=ACCOUNT-C，C有原段保存权。|责任人ACCOUNT-A或管理员ACCOUNT-B替C保存，拒绝。
HUMAN-ANSWER|预外呼起初UNKNOWN；明确无人参与结果才NONE。|UNKNOWN当NONE自动归档或已NONE后悄悄改KNOWN，保冲突待核。
BASIS|开始时捕获当前实际分类字段和sc=1、填写值A；期间改值不换表单。|保存时拼入从未展示的新定义/新导入值，禁止。
FORM-VALUES|原段表单按basis预填A，本次把允许字段改B留在草稿。|提交未在原段表单中的字段或改businessType，拒绝并保草稿。
MODIFIED-FIELDS|只实际修改FOLLOWUP-F2，集合仅含F2；显式清空也算修改。|把未操作全部预填字段标为已改，或值变更却未声明，拒绝。
CONFIRMED-FIELDS|basis已知F1=A且本次提交确认、未修改，confirmed含F1而modified为空。|basis无F2键却因控件默认空就confirmed含F2，禁止。
CONTENT-SNAPSHOT|本人正式保存封basis、最终值、modified/confirmed及原followup身份。|再编辑同一正式快照或迟到回调重写内容，拒绝。
CONTENT-SAVED|本人首次保存成功变true，但事实未齐仍不代表整体归档。|受理或首通结束直接设true，禁止伪造内容。
ARCHIVE-STATE|已有内容但标签待核为WAITING_FACTS；冲突为WAITING_REVIEW。|必要下游标签尚PENDING就COMPLETE，禁止。
ARCHIVED|零拨失败明确终态可封archive=true，但completedFollowup=false。|以archived=true直接把零拨记完成跟进或记拨打，禁止。
ROUTING-FIELD-SNAPSHOT|人工正式提交包含F1确认值及准确run/stage/nodeRun身份。|没有该快照改读旧result.values凑本节点字段依据，禁止。
VALUE-CONFLICT|开始值A、当前更正B、本次C，显示三方差异后拿当前值/来源token确认。|只刷新record revision仍用旧value token覆盖B，拒绝并保草稿。
CALLS|受理后calls=[]；真实两次尝试CALL-A、CALL-B分别记录。|刚受理即生成已接通CALL或按同手机号合并不同尝试，禁止。
ATTEMPT-ID|ATTEMPT-A准确归属REC-A/RUN-A/STAGE-A/FOLLOWUP-A。|回调只有号码无原执行关联却挂到最新followup，拒绝。
PROVIDER-CALL-ID|租户A供应商X/call=001与供应商Y/call=001独立保留。|只按裸001合并跨供应商/租户通话，禁止。
CALL-STATE|QUEUED→RUNNING→ENDED按准确事件记录。|ENDED后迟到QUEUED让通话复活，拒绝/保冲突。
DIALED|收到真实拨打事件才dialed=true，排队仍false。|把accepted=true解释为dialed=true，禁止增加拨打次数。
DIALED-AT|2026-10-30T00:05:00+08:00按实际拨打日期计频次。|跨日排队用前日queuedAt代替dialedAt，禁止；缺证据待核。
CUSTOMER-ANSWERED|明确客户接通true，但预外呼实际接听账号仍可待核。|字符串“false”或未核结果冒充布尔false，拒绝。
RETRIES-COMPLETE|最后真实尝试终止且无后续重试，retriesCompleted=true。|第一通结束而重拨排队仍设true释放占用，禁止。
EXECUTION-STATE|排队/执行/unknown时noMoreCalls=false，不能新起呼。|旧followup迟到终态将新followup的执行改空闲，禁止。
ROUTING-EVIDENCE|云MANUAL原状态码和域映射为KNOWN终态，准确关联原段。|AI码直接按云状态比较或PENDING当未接通，保持待核。
TAG-EVIDENCE|本次sceneSnapshot一致的revision、合法标签ID子集为KNOWN；明确空为NONE。|标签同名但来自另一租户/场景/修订，拒绝；NONE携带非空ID也拒绝。
EVENT-ID|同EVENT-A同内容重放，返回原事实不重复计数。|同EVENT-A载荷相反状态，保原事实并记冲突。
EVALUATION|第一条MATCHED后只该selected；更高优先PENDING阻后续默认。|两条匹配都可任选或PENDING先落默认，禁止。
EVALUATION-TOKEN|同record/run/nodeRun/owner/当前事实得到token，确认前重核一致。|中途更正sc后用旧token流转，拒绝并保原节点。
INTENDED-STORE|意向编码“001”唯一映射本品牌有效门店，前导零保留。|有001但无映射时冒充无意向开放任意选门店，拒绝。
DESTINATION|缺意向且总部管理员可选合法STORE候选，状态UNASSIGNED。|多映射/停用映射当UNASSIGNED手工绕过，保持PENDING不可转交。
TARGET-TENANT|同品牌HQ到有效STORE-A，后继CALL承接范围匹配。|STORE-A直转STORE-B、当前租户或跨品牌，拒绝。
RESOLUTION-TOKEN|目标映射与意向未变，原定位token可确认。|门店映射被改后沿旧token转交，拒绝且不暗换目标。
CORRECTIONS|管理员将sc由1更正2并说明原因，追加before/after和原run/stage来源。|更正直接覆写原始导入/正式跟进快照，禁止。
REASON|原因“客户确认原门店录入错误”，随本次维护事实保存。|空白原因发起更正/废弃/纠偏/转类/核对移交，拒绝。
OUTCOME|结束节点配置NO_CONTACT，END时封对应结论与来源。|所有END或归档都自动记SUCCESS，禁止。
OUTCOME-CONFIG|END outcomeCode=NO_CALL明确表示无需呼叫。|未设置结论却默认SUCCESS，禁止；保持UNSPECIFIED。
RECLASSIFY-TARGET|原新线索已结束，目标同品牌冷线索LEAD经严格预检。|活动ORDINARY、跨品牌或运行中转类，拒绝。
RECLASSIFY-TOKEN|目标补齐字段、路由和原record依据未变时提交同一token。|预检后目标必填字段/路由变更仍用旧token，拒绝。
REQUEST-ID|同一次导入意图REQUEST-A重试查询同结果。|REQUEST-A unknown后新REQUEST-B重办，阻止；同ID不能换对象/载荷。
REQUEST-STATUS|unknown保原请求待核；查明已成功后展示原一次结果。|超时当failed自动释放/重发，禁止。
REVIEW-ASSIGNEE|本租户管理员将准确REQUEST-A移交有效ACCOUNT-R并说明原因。|只凭“该客户”模糊移交整档案或把核对权当代填权，拒绝。
WORK-STATE|已安排且无阻塞为READY_TO_CALL；真实待填为WAITING_CONTENT并给下一步。|仅靠按钮页面写成成功或读取时改变状态，禁止。
STATISTICS|一次followup两次真实dial一次客户接通：activities1、dials2、connected1。|把一次受理计一次拨打、零拨异常计completed或重放增加计数，禁止。
CONTACT-POLICY|本租户设置间隔30分钟和每日3次，仍保持单号码一个有效执行。|策略改0就解除既有unknown/重试占用，禁止。
CONTACT-INTERVAL|0关闭额外间隔；10080分钟为合法上界。|负数、10081或1.5分钟，拒绝且保原策略。
CONTACT-DAILY-LIMIT|0无额外次数上限；1000为合法上界。|1001、负数或小数，拒绝。
CATEGORY-PRIORITY|categoryId lead优先级10、lxs为2；同级按等待先后。|同一分类重复两项、1000或抢占已在执行安排，拒绝。
LEAD-LEVEL|本分类启用字段时保存稳定A级选项ID。|自由文本“超A级”或改预置A级统计文案/停用，拒绝。
INTENTION-LEVEL|实际办理人选当前稳定“高意向”ID。|AI高意向标签自动写同名填写字段，禁止来源混用。
VISIT-INTENTION|选“暂不确定”稳定ID，仍保其独立统计。|用另一字段同名选项ID或失效选项新保存，拒绝。
TESTDRIVE-INTENTION|本人选“有意向”稳定ID，不推断已经试驾。|借到店意向自动改试驾意向，禁止。
PLANNED-VISIT|2026-11-01T14:30:00+08:00为明确计划时间。|非法日期或缺时区的歧义时间，拒绝；空白不默认今天。
PLANNED-STORE|填写“广州体验店”作为显示名称。|用此自由文本直接定位owner或转交目标，禁止。
MAPPING-SERIES|从有权Mapping车系能力明确选中返回对象。|改成手工固定选项或将接口对象作普通流转比较值，拒绝。
SERVICE-CONCERN|售后分类保存“空调异响”多行反馈文本。|未展示字段却在保存时拼入别的分类值，拒绝。
SERVICE-SATISFACTION|选当前“满意”稳定选项ID。|输入不在当前选项中的“非常满意”或跨字段ID，拒绝。
NEXT-SERVICE|2026-11-30为有效计划日期。|2026-02-30或空白转今天，拒绝非法值/禁止猜默认。
ACTIVITY-INTEREST|保存“待考虑”稳定ID，按活动分类要求校验。|自由文本替代稳定选项或未实际确认就写值，拒绝。
PARTICIPANTS|有限数值2；空白保空不生成0。|NaN、Infinity、非数值“多人”，拒绝且不舍入猜值。
INTERESTED-ITEMS|明确选“到店体验”和“车主活动”两个稳定ID。|集合重复ID、未知ID或把逗号文本当选项集合，拒绝。
ACTUAL-ANSWER|预外呼准确回执及本人映射指向ACCOUNT-P，P有原段最小填写权。|管理员指定责任人代实际接听人，拒绝；UNKNOWN不当无人。
FOLLOWUP-SUMMARY|本人摘要“客户希望下周联系”与本次原段正式内容一并封存。|修改已正式保存摘要或以摘要声称实际拨打发生，禁止。
OUTCOME-LABEL|NO_CONTACT显示“未联系成功”，长度6字。|空白且无法从编码生成、81字或文案代替统计编码，拒绝。
VALUE-SOURCES|F2当前值来自FOLLOWUP-A，后更正后指向CORRECTION-B，旧来源仍在原事实。|只改当前值不改来源，令旧差异token继续有效，禁止。
FILE-PENDING|最新序号文件读取时true，返回或明确取消后才false。|读取中用旧预览提交或迟到请求清除新请求pending，禁止。\nINTENDED-STORE-NAME|保留原名称“广州体验店”供阅读；有编码001才依编码唯一定位。|仅有名称无编码就开放无意向手工选店，禁止；应待核准确编码。'''
 pairs={}
 for line in examples.splitlines():
  key,valid,invalid=line.split('|',2);pairs[key]=(valid,invalid)
 by={r['id'].removeprefix('FIELD-FLOW-'):r for r in fields}
 assert set(by)==set(pairs),(set(by)-set(pairs),set(pairs)-set(by))
 # Saving semantics grouped only where the same real product action owns them.
 groups=[
 ('字段当前定义明确保存成功时，与该字段稳定身份一起写入字段库；编辑原对象仅更新获准部分；失败/unknown不把草稿当新配置。','定义新增/编辑','有配置权者提交合法品牌/用途/名称/业务编码/类型/选项，成功后成为当前定义；已有引用关键含义锁定。','FIELD-ID FIELD-USAGE FIELD-LABEL FIELD-TYPE FIELD-KEY FIELD-ENABLED FIELD-OPTIONS OPTION-ID OPTION-LABEL OPTION-KEY OPTION-ENABLED DICTIONARY-ID SELECTION-MODE QUERY-CONDITIONS FIELD-DEPENDS PARAM-BINDINGS'),
 ('分类基础及两用途字段的BASE保存明确成功时写入；不写路由main，原字段和已正式内容快照不改。','分类基础保存','新增/编辑校验同品牌字段、用途、依赖顺序、必填和业务域后生效；编辑未确认仍保原分类。','CATEGORY-ID CATEGORY-LABEL CODE-LABEL BUSINESS-FAMILY CATEGORY-IMPORT-REFS CATEGORY-FOLLOWUP-REFS CATEGORY-REVISION'),
 ('流转模板当前配置明确保存成功时写入同一配置；新建草稿不供业务使用；后续编辑只影响新运行可用方案。','模板保存','编排组件/路径/条件为草稿，合法确认后成为当前模板；当前分类应用另行独立保存，已开run快照不改。','TEMPLATE-ID TEMPLATE-NAME TEMPLATE-REF-CATEGORY TEMPLATE-REVISION NODES EDGES ENTRY-RULES NODE-ID NODE-NAME NODE-TYPE RECIPIENT METHOD NEXT-NODE EDGE-ID BRANCH-KIND BRANCH-PRIORITY GROUP-MODE RULES RULE-ID RULE-SOURCE RULE-FIELD RULE-OPERATOR RULE-VALUES RESULT-SOURCE OUTCOME-CONFIG OUTCOME-LABEL'),
 ('当前窗口中读取/输入/映射/预检时暂存；不是正式批次或业务事实。名单、字段、路由、场景或身份变动即失效；关闭窗口不据此创建业务。','导入准备','选择实际分类后生成本窗口输入；文件读取只应用最新序号；有错保输入，预检通过后才生成可提交依据。','IMPORT-TEXT IMPORT-MAPPING FILE-READ FILE-PENDING IMPORT-PREVIEW IMPORT-TOKEN'),
 ('正式导入所有行重检通过并明确成功时，同次建立批次、记录及原始来源；重放同请求返回原结果，失败不形成部分批次。','正式导入','预览仅临时显示；正式确认后方有稳定身份/原始来源，重复编码不覆盖已有业务。','BATCH-NAME BATCH-ID RECORD-ID BUSINESS-CODE IMPORT-ORIGINAL'),
 ('正式导入写当前资料；之后仅有权明确更正、明确来源同步或受控转类补充更新当前值；每次变动留前后/来源，原导入及跟进快照不改。','当前导入资料','导入需满足实际分类schema及首分流；当前维护可明确清空并留因，后续起呼仍核有效号码/必要依据。','CUSTOMER-NAME PHONE IMPORT-NOTE IMPORT-VALUES INTENDED-STORE INTENDED-STORE-NAME'),
 ('创建实际followup时，按最新实际分类及当前值捕获；受理成功封存本段basis/资源/实际场景；不随后来当前配置改变。','开始本次办理','起呼前重核身份/资源/场景；明确受理后本段身份和已捕获依据固定；受理不代表真实拨打。','FOLLOWUP-ID ACTOR ACTUAL-HANDLER BASIS SCENE-SNAPSHOT RESOURCE-SNAPSHOT'),
 ('对应实际执行/回执准确关联后写入原段事实；同event同内容幂等；冲突保旧事实待核，旧段晚到不改新执行。','实际执行事实','受理/排队/拨打/接通/终态/人工身份/重试收敛分阶段记录；缺证据保未知；终态不能复活。','ACTUAL-ANSWER HUMAN-ANSWER CALLS ATTEMPT-ID PROVIDER-CALL-ID CALL-STATE DIALED DIALED-AT CUSTOMER-ANSWERED RETRIES-COMPLETE EXECUTION-STATE ROUTING-EVIDENCE TAG-EVIDENCE EVENT-ID'),
 ('实际办理/接听人首次正式保存原段内容明确成功时与contentSnapshot同次封存；内容不可二次重写。系统仅在合法无人工路径归档时封真实摘要，不造新人工确认。','正式内容提交','按原basis展示填写；保存校原段身份/必填/类型/并发差异；成功后保持原貌且与整体执行归档分开。','MODIFIED-FIELDS CONFIRMED-FIELDS CONTENT-SNAPSHOT CONTENT-SAVED ROUTING-FIELD-SNAPSHOT FOLLOWUP-SUMMARY'),
 ('精确followup的事实、内容和必要下游依据齐备后只封存一次；已归档不重复计数；零拨可封异常事实但completed必须false。','本轮归档','内容保存与真实终态各自等待；全部必要事实明确才COMPLETE，冲突WAITING_REVIEW，废弃ABANDONED。','ARCHIVE-STATE ARCHIVED'),
 ('实际原段provided保存且仍同owner/stage/run时，或有权更正/转类确认时，与当前有效值同次更新；旧段晚到不覆盖新current。','当前填写值生效','新轮开始读取最新current，原段快照独立保留；未操作与显式清空不同，已知预填可确认但不自动当modified。','FOLLOWUP-VALUES VALUE-SOURCES LEAD-LEVEL INTENTION-LEVEL VISIT-INTENTION TESTDRIVE-INTENTION PLANNED-VISIT PLANNED-STORE MAPPING-SERIES SERVICE-CONCERN SERVICE-SATISFACTION NEXT-SERVICE ACTIVITY-INTEREST PARTICIPANTS INTERESTED-ITEMS'),
 ('判断/预检/差异确认时一致读取当前事实计算，暂存本次结果和确认依据；不是业务完成事实；相关资料再变使其失效。','判断/确认准备','本次计算给准确原因及唯一可选结果；用户取消不改owner/节点；正式动作前重算原依据，过期保输入重新核对。','VALUE-CONFLICT EVALUATION EVALUATION-TOKEN DESTINATION RESOLUTION-TOKEN RECLASSIFY-TARGET RECLASSIFY-TOKEN'),
 ('读取真实有权事实时派生展示，不独立写业务状态/时间/计数；事实变化后重新读取，不以页面缓存做准入。','有权只读投影','当前负责、监管只读、本方转出截止分别裁剪；列表过滤后按真实更新时间倒序分页，未知原时间保后。','WORK-STATE STATISTICS'),
 ('本租户管理员明确保存联系协调成功时写当前策略；既有实际受理/排队/重试/unknown占用继续有效；不自动发起或续拨。','联系协调保存','新增默认额外频次关闭；编辑校边界及分类唯一性；起呼前使用当前有效策略计算是否允许。','CONTACT-POLICY CONTACT-INTERVAL CONTACT-DAILY-LIMIT CATEGORY-PRIORITY')]
 assigned=set()
 for when,state,behavior,keys in groups:
  for key in keys.split():
   r=by[key];assigned.add(key);r['persistence']['write_when']=when
   r['lifecycle']=[{'state':state,'behavior':behavior},{'state':'失败/未知或并发变化','behavior':'保留本次输入与已经明确生效的原事实，说明本字段对应原因；unknown沿准确原请求核对。'},{'state':'后续读取/使用','behavior':r['validation_rules'][0]}]
 transient='IMPORT-TEXT IMPORT-MAPPING FILE-READ FILE-PENDING IMPORT-PREVIEW IMPORT-TOKEN FORM-VALUES VALUE-CONFLICT EVALUATION EVALUATION-TOKEN DESTINATION TARGET-TENANT RESOLUTION-TOKEN RECLASSIFY-TARGET RECLASSIFY-TOKEN WORK-STATE STATISTICS ROUTE-VERSION'
 for key in transient.split():by[key]['persistence']['kind']='transient'
 special={
 'BRAND-ID':('品牌主资料由品牌管理维护；本单元只在字段/分类/模板/业务保存时引用当前明确brandId，不在流程中创造新品牌。','当前品牌上下文明确可核后派生，缺失/跨品牌拒绝进入配置或业务。'),
 'ENTRY-CONTEXT':('正式导入/再次跟进/纠偏/转类建立run时，将实际owner种类与明确办理目的封入entryDecision；预览时仅临时计算。','上下文由本次真实租户和目的生成，不接受导入行伪造。'),
 'ROUTE-MAIN':('分类独立路由明确保存成功时写入必选单模板关系或更换关系；不提供解绑；不覆盖分类BASE；新运行读取当前确认配置。','初始未绑定分类可以保存基础但不能导入；绑定只核实际用到字段和上下文，不要求参考分类等于本分类。'),
 'ROUTE-VERSION':('每次路由读取/提交重核时根据当前绑定生成本次并发依据，不作为可选业务版本保存。','改变基础、字段或绑定后旧确认失效，保选择重读。'),
 'EFFECTIVE-PLAN':('正式导入/再次跟进/纠偏/受控转类明确建立新run时封存完整planSnapshot；路由兼容预览仅临时计算；现run永远不重取当前模板。','新run按实际应用分类最新已确认目录捕获，模板字段参考分类只留来源元信息。'),
 'OWNER-TENANT':('正式导入取当前有权租户；合法转交明确成功时与departure cutoff、新stage及节点同次切换；分配、起呼、更正不改owner。','当前仅一个负责租户；转交失败/unknown保原归属表达，查同请求后以明确事实确认。'),
 'FOLLOWER':('当前租户管理员安排成功时更新责任账号；合法转交或新run清空；原段followupAccountId快照不追改。','候选依方式核资格；人工责任人不自动成为实际拨打人，管理员可本人执行但不换责任身份。'),
 'ARRANGEMENT':('直接AI首呼正式导入可只捕获已选场景而责任人空；之后管理员安排成功保存准确run/node/tenant/方式/人/场景；转交/新run清空。','尚无责任人时不能起呼；安排成功不代表受理，后续仍核live场景与资源。'),
 'AI-SCENE':('直接AI首呼正式导入成功或当前AI安排成功时保存所选scene ID；实际受理再捕获准确sceneSnapshot；其他租户私有场景不由原方选择。','场景随当前run/node/owner安排生效，不是客户永久属性；转交后接收方重新明确。'),
 'RECORD-REVISION':('确有业务写动作明确成功时随其事实递增；并发提交前重核；只读不修改。','旧修订失败保草稿，但值冲突还必须核currentValueSources对应令牌，不能只换revision绕过。'),
 'UPDATED-AT':('真实明确业务变更保存时记录可信发生/保存时刻；只读和错误提交不刷新；源无可靠时间保未知不补现在。','先按真实更新时间降序再分页；条件/字段顺序保业务含义，不跟更新时间打乱。'),
 'RUN-ID':('正式导入/再次跟进/纠偏/受控转类确认成功时生成唯一新run ID；预览不生成；业务原record保持。','导入定位节点已构成ACTIVE运行，尚未实际拨打也不能重写该run方案。'),
 'RUN-PURPOSE':('创建新run时与完整plan及entryDecision同次封存；原run目的不因后来再次办理改写。','FIRST来自导入，FOLLOWUP/CORRECTION/RECLASSIFY需各自受控准入。'),
 'RUN-STATUS':('新run ACTIVE；进入END明确成功变ENDED；废弃意图先ABANDONING，全部执行/unknown收敛后ABANDONED；保状态事实及原因。','ACTIVE时不能重开；ABANDONING未完成时仍不能起第二运行。'),
 'ENTRY-DECISION':('正式新run建立时按一致当次values/owner/purpose判断并封存；后续当前值更新不重算原入口。','unknown不得默认放行；未选出合法入口不建立新run。'),
 'NODE-RUN-ID':('每次明确进入业务节点生成并与本run/stage关联；确认流转失败不生成新身份；同次重试沿原请求结果。','相同nodeId在不同run/stage具有不同办理身份，回执和条件不得混读。'),
 'STAGE-ID':('导入初承接阶段或成功转交生成；转交与旧阶段closedAt、新owner、departure snapshot同次生效。','本方历史按对应阶段截止，不能把后段当原段。'),
 'STAGE-TRANSFER':('转交成功的新stage上记录准确源/目标/run/新stage/时间；初始导入不伪造该字段。','作为同run后继CALL承接合法依据，后续新run不能借旧转交记录。'),
 'DEPARTURE-SNAPSHOT':('合法转交成功与owner切换同次封本方资料/字段/分类/当前来源/截止位置；之后只读不随接收方变化。','转出方原有有权账号按截止快照读取；辅助timeline/runContext同样裁剪。'),
 'FORM-VALUES':('本次原段填写期间暂存；只有本人首次正式保存明确成功才进入contentSnapshot/current更新；失败/并发差异保草稿。','从原basis已知值预填；未提供和主动清空区别保留；放弃只删本段草稿不动通话。'),
 'TARGET-TENANT':('本次定位/人工合法补选时暂存；实际转交成功作为新owner/stage/event保存；取消不改归属。','有意向锁唯一映射，无意向仅当前总部管理员可补选合法门店。'),
 'CORRECTIONS':('当前管理员带非空原因明确更正成功时追加before/after/原身份/操作者/时间，与current及source同次生效。','更正只改当前允许维护定义；原导入、正式内容和旧场景不修改。'),
 'REASON':('更正/废弃/纠偏/转类/核对移交明确成功时，与对应事件/请求事实保存；非空且不拿旧动作原因代填新动作。','填写阶段输入可修改；明确成功后原事实原因不追改。'),
 'OUTCOME':('进入END时按捕获节点的明确outcomeCode/Label与本run结束同次封存；ACTIVE显示PENDING为只读派生，不预存成功。','归档、接通、流程结束、业务达成各自口径，废弃不自动给成功结论。'),
 'REQUEST-ID':('每次明确业务意图首次提交前建立稳定身份并沿该次结果保存；同payload重放查原结果，unknown不换ID重办。','核对只确认原请求，不重放原业务动作；同ID不同payload拒绝。'),
 'REQUEST-STATUS':('原请求提交/核对时保存明确success/failed/unknown；未知期间保原对象及占用，只明确原事实才更新确认状态。','成功含义以该具体动作结果为准，不把HTTP读取成功当业务成功。'),
 'REVIEW-ASSIGNEE':('当前管理员针对准确待核request明确移交成功时保存reviewAccountId和移交记录；不更改业务owner/责任人。','仅同租户有效账号获得该request最小核对权，不取得整档案/代填/原动作重放权。')}
 for key,(when,behavior)in special.items():
  r=by[key];assigned.add(key);r['persistence']['write_when']=when;r['lifecycle']=[{'state':'产生/当前阶段','behavior':behavior},{'state':'提交失败/未知','behavior':'保留已经明确事实和本次输入；沿同一准确身份核对，不另造成功或新业务。'},{'state':'后续使用','behavior':r['validation_rules'][0]}]
 assert assigned==set(by),(set(by)-assigned)
 for key,r in by.items():r['examples']={'valid':[pairs[key][0]],'invalid':[pairs[key][1]]}
 deps={
 'BRAND-ID':[], 'CATEGORY-REVISION':['CATEGORY-ID','CATEGORY-IMPORT-REFS','CATEGORY-FOLLOWUP-REFS'],
 'TEMPLATE-REVISION':['TEMPLATE-ID','NODES','EDGES','ENTRY-RULES'],
 'ROUTE-VERSION':['CATEGORY-ID','ROUTE-MAIN','CATEGORY-REVISION'],
 'EFFECTIVE-PLAN':['CATEGORY-ID','CATEGORY-IMPORT-REFS','CATEGORY-FOLLOWUP-REFS','ROUTE-MAIN','TEMPLATE-ID','NODES','EDGES','ENTRY-RULES'],
 'ENTRY-CONTEXT':['OWNER-TENANT','RUN-PURPOSE'],
 'IMPORT-PREVIEW':['IMPORT-TEXT','IMPORT-MAPPING','CATEGORY-ID','ROUTE-MAIN','AI-SCENE'],
 'IMPORT-TOKEN':['IMPORT-PREVIEW','IMPORT-TEXT','IMPORT-MAPPING','CATEGORY-REVISION','ROUTE-VERSION','TEMPLATE-REVISION','AI-SCENE'],
 'RESOURCE-SNAPSHOT':['OWNER-TENANT','METHOD','ACTOR','ARRANGEMENT'],
 'SCENE-SNAPSHOT':['AI-SCENE','OWNER-TENANT','CATEGORY-ID','RESULT-SOURCE'],
 'BASIS':['CATEGORY-ID','CATEGORY-IMPORT-REFS','CATEGORY-FOLLOWUP-REFS','IMPORT-VALUES','FOLLOWUP-VALUES','VALUE-SOURCES'],
 'CONFIRMED-FIELDS':['BASIS','MODIFIED-FIELDS','FORM-VALUES'],
 'ROUTING-FIELD-SNAPSHOT':['CONTENT-SNAPSHOT','CONFIRMED-FIELDS','RUN-ID','STAGE-ID','NODE-RUN-ID'],
 'VALUE-CONFLICT':['BASIS','FORM-VALUES','FOLLOWUP-VALUES','VALUE-SOURCES'],
 'EVALUATION':['EFFECTIVE-PLAN','IMPORT-VALUES','ROUTING-FIELD-SNAPSHOT','ROUTING-EVIDENCE','TAG-EVIDENCE'],
 'EVALUATION-TOKEN':['EVALUATION','RECORD-REVISION','RUN-ID','NODE-RUN-ID','OWNER-TENANT'],
 'DESTINATION':['INTENDED-STORE','INTENDED-STORE-NAME','OWNER-TENANT','RECIPIENT'],
 'RESOLUTION-TOKEN':['DESTINATION','INTENDED-STORE','INTENDED-STORE-NAME','TARGET-TENANT'],
 'OUTCOME':['OUTCOME-CONFIG','OUTCOME-LABEL','RUN-STATUS'],
 'RECLASSIFY-TOKEN':['RECLASSIFY-TARGET','IMPORT-VALUES','ROUTE-MAIN','RECORD-REVISION'],
 'WORK-STATE':['RUN-STATUS','EXECUTION-STATE','ARCHIVE-STATE','CONTENT-SAVED','ARRANGEMENT','EVALUATION'],
 'STATISTICS':['FOLLOWUP-ID','ARCHIVED','CALLS','DIALED','CUSTOMER-ANSWERED']}
 for key,keys in deps.items():by[key]['derivation']['dependencies']=['FIELD-FLOW-'+x for x in keys]
 by['BRAND-ID']['derivation']={'kind':'system','rule':'取当前明确身份/品牌配置范围的brandId；可见品牌不扩大业务读取范围。','dependencies':[]}
 by['BRAND-ID']['default']={'kind':'derived','value':None,'rule':'只在当前有权品牌已明确时带入该brandId；未知、越权不预选其他品牌。'}
 by['ROUTE-VERSION']['derivation']['kind']='calculated'
 by['PHONE']['nullable']=True
 by['PHONE']['required_when']='正式导入及实际起呼必须有有效号码；有权更正可明确清空为未知，此后实际起呼阻止'
 by['PHONE']['validation_rules'].append('当前更正允许null/空串；这些不等于有效号码，不能据此起呼；导入必填规则不因更正可清空而放松。')
 by['ARCHIVED']['name']='本轮事实归档标记'
 # Read access is a union of separately cropped views, never automatic full access.
 template_read=['有本品牌当前模板查看资格者；查看不要求修改/删除权','有准确业务读取权者只读本run完整捕获方案；不因此取得当前模板配置权']
 for key in 'TEMPLATE-ID TEMPLATE-NAME TEMPLATE-REF-CATEGORY TEMPLATE-REVISION NODES EDGES ENTRY-RULES NODE-ID NODE-NAME NODE-TYPE RECIPIENT METHOD NEXT-NODE EDGE-ID BRANCH-KIND BRANCH-PRIORITY GROUP-MODE RULES RULE-ID RULE-SOURCE RULE-FIELD RULE-OPERATOR RULE-VALUES RESULT-SOURCE OUTCOME-CONFIG OUTCOME-LABEL'.split():
  by[key]['permissions']['read']=template_read
 full_business=['当前负责租户中确有该业务读取资格者，按其业务范围','超级管理员仅在管理范围只读监管','转出方仅按本方已封存截止快照读取；不返回接收方后续状态']
 for key in 'EFFECTIVE-PLAN RUN-ID RUN-PURPOSE RUN-STATUS ENTRY-DECISION NODE-RUN-ID STAGE-ID STAGE-TRANSFER DEPARTURE-SNAPSHOT EVALUATION EVALUATION-TOKEN DESTINATION TARGET-TENANT RESOLUTION-TOKEN OUTCOME WORK-STATE STATISTICS CONTACT-POLICY'.split():
  by[key]['permissions']['read']=full_business if key!='CONTACT-POLICY' else ['本租户有权管理员可读/维护；当前业务起呼者仅看到准入阻塞原因，不取得其他业务或完整策略目录']
 for key in 'REQUEST-ID REQUEST-STATUS REVIEW-ASSIGNEE'.split():
  by[key]['permissions']['read']=['原本有权读取该准确请求结果者，按原对象范围','被明确移交的本租户核对人，只读准确request最小状态，不扩展整业务读取']
 by['RULES']['validation_rules'].append('不同出口完全相同条件组拒绝保存；存在交集但不完全重复可提示重叠，继续按优先级只取首命中。')
 by['RESULT-SOURCE']['validation_rules'][0]='CURRENT_NODE/CURRENT_ROUND只能取当前run及准确当前节点/承接阶段的声明来源；显式HISTORY仅本记录当前owner租户的可核历史，仍校准确分类ref/字段类型/选项及sourceNode，不跨租户借用。IMPORT与呼叫方式独立。'
 by['RESULT-SOURCE']['derivation']['rule']=by['RESULT-SOURCE']['validation_rules'][0]
 by['RESULT-SOURCE']['lifecycle'][-1]['behavior']=by['RESULT-SOURCE']['validation_rules'][0]
 by['MODIFIED-FIELDS']['examples']['invalid']=['界面将未操作的整张预填表自动标modified不符合产品；提交值已变但未声明为provided时拒绝，保草稿。']

 by['DESTINATION']['validation_rules'][0]='先核同品牌唯一有效总部及品牌关联可核；STORE_TO_HQ只定位该总部。HQ_TO_STORE有意向编码则唯一映射合法门店；编码与名称皆无才UNASSIGNED允许本总部管理员补选；仅名称、缺映射、多映射、停用/未知均PENDING。'
 by['DESTINATION']['derivation']['rule']=by['DESTINATION']['validation_rules'][0]
 by['DESTINATION']['lifecycle'][-1]['behavior']=by['DESTINATION']['validation_rules'][0]
