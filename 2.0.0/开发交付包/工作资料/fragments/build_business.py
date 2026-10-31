from pathlib import Path
import json
O=Path(__file__).parent; base=O.parent
coord=json.loads((base/'coordination.json').read_text()); originals={r['id']:r for r in json.loads((base/'origin-feature-ids.json').read_text())}
F=[]; L=[]; C=[]; P={}; evidence=[]
CFG=['获对应品牌配置权的超级管理员或本品牌租户管理员']; BUS=['当前负责租户中有此业务读取资格的管理员或运营','本租户准确原段实际办理／接听人的最小表单读取','管理范围内超级管理员只读监管','转出方按已封存本方截止范围只读']
ADMIN=['当前负责租户管理员，具有相应动作权且当前状态允许']; HANDLER=['本次实际拨打／接听账号，在本租户原段已结束且内容尚未正式保存时']; SYS=['系统根据准确动作、执行事实或已授权提交生成；用户不直接编辑']
T='北京时间显示；真实时刻使用明确时区/偏移，不按到达时间推断发生时间'
def fid(x):return 'FIELD-FLOW-'+x

def field(x,name,entity,key,typ,fmt,rule,nullable=False,required='所属动作提交时必须具备；只读输出由系统按事实提供',default=None,read=None,write=None,persist='stored',when=None,life=None,derive='input',deps=None,valid=None,invalid=None):
 d={'id':fid(x),'name':name,'entity':entity,'key':key,'source_refs':['docs/field-alignment.json#'+fid(x)],'source_keys':[], 'type':typ,'format':fmt,'nullable':nullable,'required_when':required,'default':default or {'kind':'none','value':None,'rule':'没有业务依据时不生成、不以空值、零或首项替代'},'validation_rules':[rule],'permissions':{'read':read or BUS,'write':write or SYS},'lifecycle':life or [{'state':'产生或输入','behavior':rule},{'state':'提交或取用','behavior':'重新核对稳定身份、所属业务范围和动作状态；失败保留输入/已有事实并明确原因'},{'state':'已生效','behavior':when or '按本字段的生效时点保存，后续引用保持准确业务身份，不按名称重定位'}],'derivation':{'kind':derive,'rule':rule,'dependencies':[fid(i) for i in (deps or [])]},'persistence':{'kind':persist,'write_when':when or '对应动作明确成功时与其结果同次保存；失败不替换已生效值，结果未知先核对原请求'},'examples':{'valid':valid or ['在所属动作中以真实稳定身份提供，校验通过后读取同一值'],'invalid':invalid or ['所属范围、身份或状态无法核定时拒绝本次动作并保留原值']},'test_refs':[]}
 F.append(d);return d['id']

def add_table(rows):
 for row in rows: field(*row)
# Configured reusable definitions, not one field per page occurrence.
add_table([
('BRAND-ID','所属品牌','BusinessBrand','brandId','string','稳定不透明品牌ID','分类、字段、模板与实际绑定必须同品牌，品牌配置管理不扩大业务数据范围',False,'创建／读取配置与业务时必需',None,CFG+BUS,SYS),
('FIELD-ID','自定义字段稳定身份','FieldDefinition','id','string','系统生成稳定ID，用户不编辑','定义在同品牌同用途字段库中唯一；同名IMPORT与FOLLOWUP仍为两份独立身份',False,'创建字段时系统生成；分类和规则引用时必需',None,CFG+BUS,SYS),
('FIELD-USAGE','字段用途','FieldDefinition','usage','enum','IMPORT / FOLLOWUP','新增必须明确导入或填写；存在配置/业务引用后不得原地改用途',False,'新增字段时必填',None,CFG,CFG),
('FIELD-LABEL','字段名称','FieldDefinition','label','string','1～40字，去首尾空白','同品牌同用途名称不可重复；相同稳定身份只允许不改变业务含义的文字调整',False,'新增／编辑必填',None,CFG+BUS,CFG),
('FIELD-TYPE','字段类型','FieldDefinition','type','enum','text/textarea/number/select/multiselect/date/datetime/interface','导入字段不支持interface；已引用字段类型不可原地改；不提供格式配置项',False,'新增必填',None,CFG+BUS,CFG),
('FIELD-KEY','字段业务编码','FieldDefinition','businessKey','string','不透明文本≤80字，无控制字符；不规定统一编码格式','IMPORT必填且禁止保留键；同品牌同用途非空编码唯一，前导零保留；引用后不改',True,'IMPORT定义必填；FOLLOWUP可省略',None,CFG+BUS,CFG),
('FIELD-ENABLED','字段启用状态','FieldDefinition','enabled','boolean','true/false','停用前核当前分类与接口依赖；停用不删除已经捕获的事实；引用保护不能通过停用绕过',False,'字段保存时必需',{'kind':'literal','value':True,'rule':'仅新增字段初始启用；编辑保留实际值'},CFG+BUS,CFG),
('FIELD-OPTIONS','选项定义顺序','FieldDefinition','options','array','select/multiselect为1～50项；其他类型为空','每项含稳定id/label/businessKey/可用状态；顺序由配置决定，不按更新时间排序；引用后不删除既有ID或改选项业务编码',False,'选择类型字段必需',{'kind':'literal','value':[],'rule':'新增非选择类型无选项；选择类型保存前补足1～50项'},CFG+BUS,CFG),
('OPTION-ID','选项稳定身份','FieldOption','id','string','同字段非空唯一，≤80字；禁止保留键','结果和条件保存稳定ID；显示名、业务编码不能替代含义不明的选项',False,'新增选项系统生成，引用时必需',None,CFG+BUS,SYS),
('OPTION-LABEL','选项文案','FieldOption','label','string','1～80字','同一字段内名称不重复；修改只能保持原业务含义；预置统计字段选项文案不可改',False,'保存选项必填',None,CFG+BUS,CFG),
('OPTION-KEY','业务选项编码','FieldOption','businessKey','string','选填，不透明文本≤80字','同一字段内非空编码唯一；存在引用后不得改为另一编码',True,'专业对接有明确编码时填写',None,CFG+BUS,CFG),
('OPTION-ENABLED','选项启用状态','FieldOption','enabled','boolean','true/false','停用选项不能新选，已捕获值按当时文案可读；预置线索统计字段选项不能停用',False,'选项保存时明确',{'kind':'literal','value':True,'rule':'新增选项可选；编辑不把省略当重启'},CFG+BUS,CFG),
('DICTIONARY-ID','取数能力字典引用','InterfaceField','dictionaryId','string','已有稳定接口能力ID','仅FOLLOWUP interface使用，必须为本租户获授权启用能力；不能凭共享品牌配置跨租户取数',False,'保存接口字段必填',None,CFG+BUS,CFG),
('SELECTION-MODE','接口返回选择方式','InterfaceField','selectionMode','enum','single / multiple','决定选中返回对象单选或多选，保留完整对象及准确返回属性；接口对象不能用于流转比较',False,'接口字段保存时明确',{'kind':'literal','value':'single','rule':'新增单选接口初始single，显式选多选才变更'},CFG+BUS,CFG),
('QUERY-CONDITIONS','是否关联查询条件','InterfaceField','useQueryConditions','boolean','true/false','独立查询false时不得附带依赖及参数映射；true时必须明确一个上游填写字段',False,'保存接口字段必需',{'kind':'literal','value':False,'rule':'新增接口默认独立查询；不猜上游'},CFG+BUS,CFG),
('FIELD-DEPENDS','接口上游依赖','InterfaceField','depends','array','独立查询为空；关联查询为一个同目录字段ID','不可引用自身、不可形成循环；上游必须FOLLOWUP且在同分类启用，配置顺序使依赖可用',False,'关联查询时必需',{'kind':'literal','value':[],'rule':'独立查询无依赖'},CFG+BUS,CFG),
('PARAM-BINDINGS','上游属性到查询参数映射','InterfaceField','parameterBindings','array','每项parameterName/sourceValueKey/required','每个目标参数来源明确，允许同上游对象多个属性分别映射多参数；来源/能力缺失不猜值、不回退首项',False,'关联查询时按所选能力补齐',{'kind':'literal','value':[],'rule':'独立查询不提交条件映射'},CFG+BUS,CFG),
('CATEGORY-ID','实际业务分类身份','BusinessCategory','id','string','稳定分类ID；七个预置分类保各自ID','分类引用与记录身份用稳定ID，不按同名合并。新/冷线索、督办、服务、回访、售后、活动同一品牌目录',False,'分类创建系统生成，导入/路由必需',None,CFG+BUS,SYS),
('CATEGORY-LABEL','业务分类名称','BusinessCategory','label','string','1～40字','名称用于显示和选择，改变名称不改变业务身份，不把历史快照按最新名字重画',False,'分类保存必填',None,CFG+BUS,CFG),
('CODE-LABEL','业务记录编码列名','BusinessCategory','codeLabel','string','1～40字','用于导入模板与表单说明；实际值为业务编码，列名变化不改变去重规则或既有业务编码',False,'分类保存必填',None,CFG+BUS,CFG),
('BUSINESS-FAMILY','业务类型域','BusinessCategory','businessFamily','enum','LEAD / ORDINARY','新/冷预置固定LEAD；自定义显式选择；已有配置、运行或业务引用后锁定，不按名称猜线索域',False,'新分类保存时必填',{'kind':'literal','value':'ORDINARY','rule':'自定义分类默认普通业务；新/冷由预置规则固定LEAD'},CFG+BUS,CFG),
('CATEGORY-IMPORT-REFS','分类导入字段引用','BusinessCategory','importFields','array','有序{fieldId,enabled,required}；最多30项','仅同品牌IMPORT用途；每个fieldId最多一次；隐藏/停用字段不能required；顺序用于导入模板',False,'分类保存时明确，可为空',{'kind':'literal','value':[],'rule':'新分类尚无导入字段，系统必需客户称呼/号码/业务编码仍适用'},CFG+BUS,CFG),
('CATEGORY-FOLLOWUP-REFS','分类填写字段引用','BusinessCategory','fields','array','有序{fieldId,enabled,required}；最多30项','仅同品牌FOLLOWUP用途；保持接口依赖闭包和顺序；填写必填只约束本次真实适用人工保存',False,'分类保存时明确，可为空',{'kind':'literal','value':[],'rule':'新自定义分类尚无填写字段；预置分类按明确预置规则初始化'},CFG+BUS,CFG),
('CATEGORY-REVISION','分类基础／字段校验依据','BusinessCategory','configurationVersion','integer','内部正整数；不提供V1/V2选择器','每次明确保存基础/字段后更新，提交并发重核；不是人工选择业务版本',False,'配置并发保存、预览/运行捕获时系统提供',None,CFG,SYS),
('TEMPLATE-ID','流转模板稳定身份','FlowTemplate','templateId','string','系统生成稳定ID','按品牌唯一定位；当前分类实际引用及配置待核保护删除，参考分类不形成应用绑定',False,'模板首次保存系统生成',None,CFG+BUS,SYS),
('TEMPLATE-NAME','流转模板名称','TemplateConfiguration','name','string','非空名称；现有原型未规定额外统一长度','模板列表、引用选择和当前运行展示采用名称；改名不改模板ID',False,'模板保存必填',None,CFG+BUS,CFG),
('TEMPLATE-REF-CATEGORY','字段参考分类','TemplateConfiguration','categoryRef','object','同品牌分类ID及当次字段依据','只读取参考分类最新字段供条件编排，不自动绑定实际业务；不得按此值决定记录实际分类或表单',False,'模板编排/保存必需',None,CFG+BUS,CFG),
('TEMPLATE-REVISION','模板当前配置修订依据','FlowTemplate','latestVersion','integer','内部正整数，仅用于当前配置和并发校验','修改形成新当前配置，界面不按V1/V2区分；未确认保存不能供新业务，已开run不重取当前定义',False,'配置保存／查询时系统提供',None,CFG,SYS),
('NODES','模板业务节点','TemplateConfiguration','nodes','array','TRANSFER/CALL/END组件；开始为唯一入口锚点','拖组件即定类型，不再二次选类型；各节点稳定ID/名称，必须从开始可达并有可达结束，禁止环路',False,'保存模板至少有结束节点',None,CFG+BUS,CFG),
('EDGES','模板出口路径','TemplateConfiguration','edges','array','稳定edgeId和from/to、顺序、规则组；转交另有recipient','连线与侧栏一份配置；from/to存在且每对唯一，条件路径至少一合法规则，不保存第二份副本',False,'非结束节点必须有出口，结束没有出口',{'kind':'literal','value':[],'rule':'空模板刚打开没有出口，不能借初始值宣称可用'},CFG+BUS,CFG),
('ENTRY-RULES','开始入口分流','TemplateConfiguration','entryRules','array','有序入口条件，仅IMPORT和CONTEXT；唯一默认入口末尾','按导入资料/当前负责方/办理目的选一个业务入口；未明事实不落默认；无需外呼可直接END',False,'保存模板必须有明确默认业务入口',None,CFG+BUS,CFG),
('NODE-ID','节点稳定身份','FlowNode','nodeId','string','所属模板中非空唯一','名称可改但身份不按位置变化；业务实例读取捕获节点身份',False,'节点生成系统提供',None,CFG+BUS,SYS),
('NODE-NAME','节点名称','FlowNode','name','string','非空显示名','新组件自动给转交n/呼叫n/结束n，允许按业务改名；不以名称决定动作种类',False,'模板保存必需',{'kind':'derived','value':None,'rule':'新增组件按类型生成不重名默认名称'},CFG+BUS,CFG),
('NODE-TYPE','节点组件类型','FlowNode','type','enum','产品START/TRANSFER/CALL/END；原型内部PROCESS映射CALL','由拖入的四种组件确定；开始唯一且不可删除；不再出现空白节点、分配节点或节点类型选择器',False,'组件产生时确定',None,CFG+BUS,SYS),
('RECIPIENT','节点或路径承接方','RecipientRule','recipient','object','{kind:HQ|TENANT,scope:CURRENT|OTHER,tenantId?}','CURRENT指运行时当前负责租户而非模板创建者；CALL不改归属，OTHER须先合法转交；转交目标放每条路径',False,'CALL与TRANSFER路径必须配置',{'kind':'derived','value':None,'rule':'CALL默认当前负责租户；TRANSFER默认其他租户，均不默认选择具体目标'},CFG+BUS,CFG),
('METHOD','本节点唯一呼叫方式','FlowNode','methods','array','CALL恰一个AI/PREDICTIVE/MANUAL；其他节点不适用','方式由节点确定，导入/分配不重复选方式；不允许一节点多方式并行或操作者临时改方式',False,'保存CALL必填',None,CFG+BUS,CFG),
('NEXT-NODE','后继节点','FlowEdge','toNodeId','string','有效的另一业务节点ID','必须与节点后继列表/画布连线一一对应；提交流转还核已捕获路径，不按节点名称猜',False,'保存每条路径必填',None,CFG+BUS,CFG),
('EDGE-ID','出口路径稳定身份','FlowEdge','edgeId','string','所属模板非空唯一','保存及确认判断都引用同edgeId；路径目标或条件改变使旧判断令牌失效',False,'路径产生系统提供',None,CFG+BUS,SYS),
('BRANCH-KIND','条件路径／默认路径','FlowEdge','branch.kind','enum','IF/ELSEIF/ELSE对应有序条件路径／默认路径','当前新方案所有有出口节点必须有且仅有一个末位ELSE，前序IF/ELSEIF按优先级首命中；ELSE不带条件，未知事实继续PENDING且不得进入后续或兜底。',False,'保存路径必需',{'kind':'derived','value':None,'rule':'前序条件依序IF/ELSEIF，唯一末位ELSE为其他情况；只有一条出口时必须为无条件ELSE。'},CFG+BUS,CFG),
('BRANCH-PRIORITY','出口优先顺序','FlowEdge','branch.priority','integer','从1连续，不重复','从上到下只选择首个命中；未知阻后续和默认，不提供多匹配人工任选',False,'路径排序时系统归一化',{'kind':'derived','value':None,'rule':'按侧栏／连线共享路径顺序计算'},CFG+BUS,CFG),
('GROUP-MODE','组内条件组合','ConditionGroup','mode','enum','ALL / ANY','明确且/或组合；当前合同任一依赖尚未就绪则组待核并暂停后续；均已知才计算匹配',False,'条件组保存必填',{'kind':'literal','value':'ALL','rule':'新增条件组默认全部满足，操作者可改为任一'},CFG+BUS,CFG),
('RULES','判断规则组','ConditionGroup','rules','array','至少一规则的稳定有序集合','每条稳定ruleId；空组不可保存为条件路径，默认路径必须无规则',False,'有条件出口必需',{'kind':'literal','value':[],'rule':'新组未配置规则，不可作为可用条件保存'},CFG+BUS,CFG),
('RULE-ID','规则身份','ConditionRule','ruleId','string','所属条件组非空唯一','修改来源、判断和值仍保持其身份；非法切换不静默清旧草稿值',False,'新增规则系统提供',None,CFG+BUS,SYS),
('RULE-SOURCE','条件来源','ConditionRule','source','enum','IMPORT/FOLLOWUP/CALL_STATUS/AI_TAG；入口额外CONTEXT','导入独立；AI结果仅状态/标签；人工或预外呼状态/填写字段；转交选择可达上游呼叫来源',False,'条件保存必填',None,CFG+BUS,CFG),
('RULE-FIELD','条件字段身份','ConditionRule','fieldId','string','同品牌、同用途、实际分类启用字段稳定ID','不按同名或业务编码猜配；仅条件实际使用的字段必须在目标分类启用且类型相容；接口对象不可用于比较',True,'IMPORT/FOLLOWUP必需；CALL_STATUS/AI_TAG不以普通字段替代',None,CFG+BUS,CFG),
('RULE-OPERATOR','判断运算符','ConditionRule','operator','enum','按类型允许EQ/NE/IN/NOT_IN/GT/GTE/LT/LTE/CONTAINS_ANY/CONTAINS_ALL/IS_EMPTY/IS_NOT_EMPTY','集合IN任一匹配；NOT_IN全部不匹配且值已知非空；等于/不等于/大小比较单值；多选/标签仅任一/全部与空判断',False,'保存条件必填',None,CFG+BUS,CFG),
('RULE-VALUES','比较值集合','ConditionRule','values','array','每行一值；文本保留逗号与行内空格，忽略空白行；数值日期按类型','IN/NOT_IN至少1且不重复，EQ/NE/顺序恰1，空值判断0；选项/状态/标签用稳定ID；非法原输入保留待校验',False,'随运算符定义',{'kind':'literal','value':[],'rule':'新规则无比较值，需补齐；不当作全匹配'},CFG+BUS,CFG),
('RESULT-SOURCE','结果依据与范围','ConditionSource','conditionSource','object','channel/domainId/sourceNodeId/scope及AI精确supplier/tenant/type/tagScene/revision','本节点或可达同承接阶段准确上游；CURRENT_NODE/CURRENT_ROUND/HISTORY显式，不借其他租户或新run的旧事实；IMPORT不依赖呼叫方式',True,'引用通话/标签/填写时须可核来源；纯IMPORT无需呼叫来源',None,CFG+BUS,CFG),
('ENTRY-CONTEXT','开始业务上下文','EntryContext','context','object','OWNER_KIND=HQ|STORE；PURPOSE=FIRST|FOLLOWUP|CORRECTION|RECLASSIFY','取本次实际负责方和办理目的；不得由导入列冒充当前租户或目的',False,'开始分流由系统产生',None,CFG+BUS,SYS),
('ROUTE-MAIN','实际分类单模板绑定','BusinessCategoryRoute','main','object','{templateId,version}；用户只选当前模板，无主备／映射选择','实际使用关系仅在业务分类独立路由配置保存；同品牌不同参考分类可复用，核实际所用字段、AI上下文和业务域',True,'配置基础可尚未绑定；正式导入/新run必须有效绑定',None,CFG+BUS,CFG),
('ROUTE-VERSION','路由并发校验依据','BusinessCategoryRoute','routeVersion','string','内部校验依据，UI不展示版本选择','独立保存重核品牌、基础/字段/路由依据，不能覆盖BASE；源数据变化保草稿重新读取',False,'路由提交时必需',None,CFG,SYS),
('EFFECTIVE-PLAN','实际分类有效方案','FlowRun','planSnapshot','object','完整节点/路径/条件/入口/承接关系/方式、实际categoryRef/catalog及reference元信息','新运行使用实际绑定分类最新有效目录，参考只记编排来源；创建run时固定，之后不随配置重绘或换绑',False,'每次正式创建run必需',None,BUS,SYS),
('IMPORT-TEXT','待导入名单文本','ImportDraft','text','string','带表头CSV或TSV，支持本地CSV/XLSX读入；XLS明确不支持','只做本次草稿，不把读取成功当导入成功；原非空行不能因忽略列而静默丢弃',False,'预览至少有表头和一数据行',None,ADMIN,ADMIN,'transient','本次对话草稿中保留；正式导入后以批次及原始/规范化证据保存，不冒充业务记录'),
('IMPORT-MAPPING','导入列映射','ImportDraft','mapping','array','原列序号到本分类IMPORT稳定字段key；可显式@ignore','一目标仅一列，必填目标必须映射，不能映射FOLLOWUP或未知键；变更名单表头/分类/字段使原预览失效',False,'非标准表头或歧义时须明确映射；可自动识别合法表头',None,ADMIN,ADMIN,'transient','仅当前导入草稿；确认后与批次导入依据一起保留'),
('FILE-READ','文件读取请求序号','ImportDraft','fileReadVersion','integer','当前窗口递增整数；结合所属窗口/身份和基准文本判定本次响应','只最新请求可应用结果/错误；读取中不能检查或提交旧文本；手工改、换类、样例或关窗取消旧结果',False,'发生文件读取时系统提供',None,ADMIN,SYS,'transient','仅当前窗口读取期间；不创建业务事实'),
('BATCH-NAME','导入批次名称','BusinessImportBatch','name','string','1～50字','每次导入明确名称，示例只提供格式且不猜分流值；名称不是去重身份',False,'正式导入必填',None,ADMIN,ADMIN),
('BATCH-ID','导入批次身份','BusinessImportBatch','batchId','string','系统生成稳定ID','准确关联当次客户行、来源及逐行结果；转交/转类不改变原批次身份',False,'确认导入明确成功时生成',None,BUS,SYS),
('IMPORT-PREVIEW','逐行导入检查结果','ImportDraft','preview','object','行号/业务编码/首个呼叫方式/状态/具体原因/确认依据','未提供首次分流资料为数据待输入，预录不假红；实际行未命中或缺依据不发token；不匹配指出节点/字段与条件',True,'确认前必须有同一输入最新通过预览',None,ADMIN,SYS,'transient','检查时生成，只适用于当时名单／映射／分类／流程／场景；变化立即失效'),
('IMPORT-TOKEN','导入确认依据','ImportDraft','importBasisToken','string','系统生成一致性令牌，不由用户编辑','绑定原名单、字段、实际流程和场景配置；正式提交重算一致且每行通过才写，不复用过期依据',True,'正式导入时必需，失败或有问题行无有效token',None,ADMIN,SYS,'transient','预览全部成功后产生；正式提交后不用于创建第二批'),
('IMPORT-ORIGINAL','原始导入证据','BusinessRecord','originalImportSnapshot','object','批次/原字段及原值/映射依据/发生时间','资料更正或同步只能更改当前值，不能覆盖最初来源证据；同次来源身份可复验',False,'新业务导入成功时生成',None,BUS,SYS),
('RECORD-ID','业务记录身份','BusinessRecord','recordId','string','系统生成稳定ID','独立于手机号、分类名称和执行方式；转交/转类/重开保同一业务ID',False,'正式导入成功系统生成',None,BUS,SYS),
('BUSINESS-CODE','业务记录编码','BusinessRecord','businessCode','string','按分类编码列名输入，不透明字符串保前导零','LEAD同品牌跨新/冷/自定义线索域唯一；ORDINARY同品牌同分类唯一。重复不覆盖归属/当前值/结果、不自动重开',False,'每行正式导入必填',None,BUS,ADMIN),
('CUSTOMER-NAME','客户称呼','BusinessRecordCurrentImport','name','string','导入系统必需文本','可由IMPORT businessKey=name映射，字段类型需兼容文本；不能与别名显式提供不同值',False,'新业务导入必填',None,BUS,ADMIN),
('PHONE','实际客户联系号码','BusinessRecordCurrentImport','phone','string','合法完整规范号码；去空格括号连字符，国内手机可去+86前缀','导入必填；不凭掩码猜原号码；按当前负责租户+规范号作联系限制/占用，手机号不合并业务',False,'新业务导入及每次起呼必需',None,BUS,ADMIN),
('IMPORT-NOTE','联系备注','BusinessRecordCurrentImport','note','string','选填文本','只读带入新跟进；更正留前后值，未提供与明确清空区分',True,'有资料时提供',None,BUS,ADMIN),
('IMPORT-VALUES','当前有效导入值','BusinessRecord','fields','object','按稳定IMPORT fieldId及已配置businessKey准确关联的类型值','正式导入先规范类型/选项/别名一致性；后续仅有权更正或明确生效同步更新，填写同名字段不能替代',False,'业务导入成功后持有当前有效集合',None,BUS,ADMIN),
('FOLLOWUP-VALUES','当前有效填写值','BusinessRecord','followupValues','object','按稳定FOLLOWUP fieldId的类型值；没有键为未提供','仅本次实际provided项正式保存且仍同owner/stage/run时更新；后续有权更正直改并留来源，旧段不覆盖新值',False,'有正式人填或更正后产生对应键',{'kind':'literal','value':{},'rule':'新业务无人工填写事实，不用默认空填全字段'},BUS,HANDLER+ADMIN),
('OWNER-TENANT','当前负责租户','BusinessRecord','ownerTenantId','string','准确同品牌HQ或STORE租户ID','导入初始取实际操作租户；仅明确成功的合法转交变更，CALL承接规则不隐式改owner',False,'新业务及每次办理必需',{'kind':'derived','value':None,'rule':'导入取当前合法租户；转交取本次准确确认目标'},BUS,SYS),
('FOLLOWER','责任跟进人','BusinessRecord','assignedAccountId','string','当前负责租户有效账号ID','仅当前管理员安排；人工候选须当前电话资格，AI/预外呼责任人不强有坐席；转交/新run清安排',True,'CALL办理前必需；TRANSFER/END无需',None,BUS,ADMIN),
('ARRANGEMENT','本次执行安排','BusinessRecord','arrangement','object','run/nodeRun/tenant/method/follower及AI scene快照','同一权威安排，导入/分配读取同一份；跨租户、新run或不适配方式清除；执行中不更换',True,'CALL已安排时必需',None,BUS,ADMIN),
('AI-SCENE','本次AI呼叫场景','ExecutionArrangement','aiSceneId','string','本执行租户获权、启用、实际分类匹配的稳定场景ID','直接本租户AI在导入明确选，分配可重新确认；先转交不代选目标私有场景，目标租户后选，不选首项',True,'实际本租户直接AI入口和AI安排必填；非AI不要求',None,BUS,ADMIN),
('SCENE-SNAPSHOT','实际执行场景及配置','Followup','sceneSnapshot','object','场景ID、实际分类/tenant/supplier/tagScene/type、AI上下文及配置指纹','起呼重核live使用资格和本节点/下游标签依赖，实际受理后封本次场景；事实按此快照验证，普通AI不因闲置tag元信息强绑',True,'AI实际受理时捕获，非AI不适用',None,BUS,SYS),
('RESOURCE-SNAPSHOT','实际执行配置','Followup','resourceSnapshot','object','已唯一解析的本租户有效执行方案/本人坐席及来源','导入分配不提供底层任务/资源选择；解析失败/多个冲突不选首项，人工不能借他人坐席',False,'实际起呼受理时必需',None,BUS,SYS),
('RECORD-REVISION','记录并发修订依据','BusinessRecord','revision','integer','内部单调修订值','提交前检查当前业务/归属/状态未变；读取不伪造保存时间，旧确认失败保草稿',False,'有权变更提交时使用系统提供值',None,BUS,SYS),
('UPDATED-AT','业务更新时间','BusinessRecord','updatedAt','datetime',T,'只在真实明确保存业务变更时更新，不在只读时补当前时间；先倒序再分页，未知原时间稳定置后',True,'存在可靠更新时间时展示',None,BUS,SYS),
('RUN-ID','本次流程运行身份','FlowRun','runId','string','同业务下系统生成稳定ID','导入定位首节点即已开始；仅新run读最新方案，预览未创建不算运行；不加人工启动流程按钮',False,'每次正式建立run生成',None,BUS,SYS),
('RUN-PURPOSE','办理目的','FlowRun','purpose','enum','FIRST/FOLLOWUP/CORRECTION/RECLASSIFY','初次、再次跟进、归属纠偏、转类作为独立新运行入口；不能借目的绕过目标分类/角色约束',False,'建立run必需',{'kind':'literal','value':'FIRST','rule':'仅初次导入默认首次办理；其他入口显式目的'},BUS,SYS),
('RUN-STATUS','流程运行状态','FlowRun','status','enum','ACTIVE/ABANDONING/ABANDONED/ENDED','正常结束或废弃完成后才可新run；废弃请求遇在途/排队/重试/未知先ABANDONING，不宣称已废弃',False,'run存在必需',{'kind':'literal','value':'ACTIVE','rule':'创建run并定位首节点；若合法直接END即转ENDED'},BUS,SYS),
('ENTRY-DECISION','入口判断依据','FlowRun','entryDecision','object','命中entryId、实际owner/目的/条件来源及时间','按一致当次导入值和上下文依次判定；未知不猜默认，后续不重算历史入口',False,'创建run时捕获',None,BUS,SYS),
('NODE-RUN-ID','本次节点办理身份','NodeRun','nodeRunId','string','每次进入节点生成，不是仅nodeId','同模板相同nodeId在不同run/stage不能借用结果；确认、回执、跟进都归准确节点运行',False,'进入业务节点时生成',None,BUS,SYS),
('STAGE-ID','租户承接阶段身份','OwnershipStage','roundId','string','同记录每次租户负责期间的稳定ID','转交成功新阶段，清旧安排；纯转交不生成假跟进，来源数据按本方截止裁剪',False,'导入初阶段及每次明确转交成功生成',None,BUS,SYS),
('STAGE-TRANSFER','本阶段转入依据','OwnershipStage','entryTransfer','object','source/target tenant、run、stage、时间','供后继CALL OTHER承接合法性核验，同一阶段连续呼叫保此依据，新run不借上run事实',True,'实际转入时必需；初始导入不伪造',None,BUS,SYS),
('DEPARTURE-SNAPSHOT','本方转出截止快照','BusinessDeparture','historySnapshot','object','本方fields/followupValues/categorySnapshot、owner stage/run及cutoff时间','转出方只读本方截止资料，辅助API也裁剪，不暴露接收方新节点、AI安排或之后字段',False,'明确转交时与owner切换同次封存',None,BUS,SYS),
('FOLLOWUP-ID','本次业务跟进身份','Followup','followupId','string','实际开始一次办理生成，原型segmentId同身份','同次重拨/草稿/提交重试沿用，不按任务批次合一条跟进；纯查看或转交不生成',False,'明确实际开始办理时生成',None,BUS,SYS),
('ACTOR','执行发起账号','Followup','actorAccountId','string','本次真实发起的当前账号','发起人、责任人、实际拨打人/接听人分开；不以角色管理员自动替代实际办理人',False,'执行受理时记录',None,BUS,SYS),
('ACTUAL-HANDLER','实际人工拨打账号','Followup','assignedAccountId','string','MANUAL实际本人坐席账号；与记录责任跟进人独立','由本次实际解析的本人资源确定；管理员可本人拨打，但不能借他人坐席或代填别人段',True,'MANUAL受理时必需；AI及预外呼不以责任人冒充拨打人',None,BUS,SYS),
('HUMAN-ANSWER','人工接听事实','Followup','humanAnswerState','enum','UNKNOWN/KNOWN/NONE','UNKNOWN不能当无人；NONE只能由可靠明确结果给出，后续相反身份是冲突；AI机器不算人工接听',False,'预外呼归档前必须可核',{'kind':'derived','value':None,'rule':'AI无人工路径标NONE；预外呼先UNKNOWN；人工办理身份按真实本人资源确定'},BUS,SYS),
('BASIS','本次跟进基础快照','Followup','basis','object','实际分类、最新字段定义、当前导入/填写值、来源/owner/run/stage/node、capturedAt','开始实际跟进时读取最新有权资料并封存；填写中不静默换schema或保存时拼未展示的新资料',False,'创建实际跟进时捕获',None,BUS,SYS),
('FORM-VALUES','本次填写草稿','FollowupDraft','values','object','只含原表单允许字段及原businessType','草稿不参与流转，原段分类不能换为记录后来分类；关闭可继续/保存/明确放弃，放弃仅删此原段草稿',False,'实际办理人填写时使用',{'kind':'derived','value':None,'rule':'从该次basis已知值预填；原本缺失不以默认空成为已知事实'},HANDLER,HANDLER,'transient','只有正式保存成功才形成内容快照；失败/并发冲突保本次输入'),
('MODIFIED-FIELDS','本次显式修改字段','FollowupContent','modifiedFieldIds','array','稳定FOLLOWUP fieldId集合','只记本次明确操作/提交的provided字段；未操作保当前有效值，显式清空才更新为空；拒绝未声明值变更',False,'人工正式保存时明确',{'kind':'literal','value':[],'rule':'本轮无人工修改则空；不是把全部表单当修改'},BUS,HANDLER),
('CONFIRMED-FIELDS','本次正式确认字段','FollowupContent','confirmedFieldIds','array','basis真实已有键且值非undefined，加本次provided；去重','正式人填可确认已知预填不要求无意义重输；absent默认空不确认；SYSTEM不产生新人工确认',False,'人工正式保存时系统据本次提交生成',{'kind':'derived','value':None,'rule':'由基础已知集合与实际provided集合计算，不能人工传任意确认ID'},BUS,SYS),
('CONTENT-SNAPSHOT','正式跟进内容快照','Followup','contentSnapshot','object','当时basis、最终values、modified/confirmed、archiver、run/followup/follower、时间和calls','一次正式保存封存，不因后来更新当前值、迟到结果或配置改变重写；错误用有权当前更正',True,'正式内容明确成功后存在',None,BUS,HANDLER+SYS),
('CONTENT-SAVED','内容正式保存标记','Followup','contentSaved','boolean','true/false','内容保存与整体归档独立；保存失败不撤销已发生通话，已保存内容不能再次提交重写',False,'跟进创建即有',{'kind':'literal','value':False,'rule':'开始办理并不代表有正式结果'},BUS,SYS),
('ARCHIVE-STATE','跟进唯一归档状态','Followup','archiveState','enum','WAITING_CONTENT/WAITING_FACTS/WAITING_REVIEW/COMPLETE/ABANDONED','实际执行终态、重试结束、必要状态/下游标签、人工事实和内容全明确才COMPLETE；归档只计一次',False,'发生结果评估后提供',None,BUS,SYS),
('ARCHIVED','跟进完成事实','Followup','archived','boolean','true/false','必要事实/内容齐备后可唯一封存；是否计completed另看真实dial，零拨打启动失败可封事实但不计完成跟进',False,'跟进存在时可计算',{'kind':'literal','value':False,'rule':'受理/建跟进/首通终态都不等于完成'},BUS,SYS),
('ROUTING-FIELD-SNAPSHOT','本次字段判断证据','Followup','routingFieldSnapshot','object','record/tenant/stage/nodeRun/followup/categoryRef+provided/confirmed+values','仅正式确认值可供对应范围判断；SYSTEM无新增人工字段确认，无快照不得借result.values兼容回退',True,'正式人工内容保存时产生',None,BUS,SYS),
('VALUE-CONFLICT','当前值差异与确认','FollowupDraft','valueConfirmationToken','object','开始值/当前值/本次值及绑定当前value/source的确认令牌','开始后有其他正式保存/更正时，覆盖前显示差异并明确确认，不能只重开表单拿新记录revision绕过',True,'有真实差异时保存必需',None,HANDLER+ADMIN,SYS,'transient','差异核对时产生；当前值/来源再变则旧确认失效'),
('CALLS','实际通话尝试','Followup','calls','array','本跟进零至多次准确尝试，逐次attemptId/事实','同次重试属同跟进，每次真实拨打各一尝试；受理不造拨打、接通或录音',False,'执行开始后可为空；真实拨打后按事实追加',{'kind':'literal','value':[],'rule':'仅执行受理时还没有真实通话'},BUS,SYS),
('ATTEMPT-ID','通话尝试身份','CallAttempt','attemptId','string','准确归属record/run/stage/nodeRun/followup','不能只凭手机号或当前指针挂载；不同供应商相同裸ID不混同',False,'每个实际尝试创建时生成',None,BUS,SYS),
('PROVIDER-CALL-ID','供应商通话标识','CallAttempt','providerCallId','string','租户/供应商/执行域范围内唯一关联','到达后精确关联原尝试；不与其他域同裸ID直接合并，镜像仅明确来源关系才去重',True,'供应商实际提供后保存；没有不伪造',None,BUS,SYS),
('CALL-STATE','尝试执行状态','CallAttempt','state','enum','QUEUED/RUNNING/ENDED及明确失败事实','终态不复活；晚到queued/running不改已结束事实；冲突待核而非按最后消息覆盖',False,'尝试存在时必需',None,BUS,SYS),
('DIALED','真实拨打标记','CallAttempt','dialed','boolean','true/false','只有明确actual dial事实才true；受理/排队不计拨打或占用频控次数',False,'尝试建立时有',{'kind':'literal','value':False,'rule':'刚入队未真实拨打'},BUS,SYS),
('DIALED-AT','真实拨打时间','CallAttempt','dialedAt','datetime',T,'按首个可核拨打事实封存；跨日排队按实际拨打日计频次，重放不改；无证据保未知不猜排队时间',True,'已拨打且准确时间可核时必需',None,BUS,SYS),
('CUSTOMER-ANSWERED','客户接通事实','CallAttempt','customerAnswered','boolean','明确true/false；尚未核定不提供','客户侧接通不等实际人工接听；不接受true/false字符串冒充布尔；相反终态冲突待核',True,'最终归档前每个已拨通话必须有可靠布尔事实',None,BUS,SYS),
('RETRIES-COMPLETE','重试计划收敛事实','Followup','retriesCompleted','boolean','true/false','首通终态不能代表所有重试结束；真实无后续重呼才释放并准入后续办理',False,'归档、推进、转交前必需明确true',{'kind':'literal','value':False,'rule':'启动时计划尚未确认收敛'},BUS,SYS),
('EXECUTION-STATE','整业务当前执行事实','BusinessRecord','execution','object','state和noMoreCalls，准确followupId','当前有效执行串行；未知/排队/重试占用不解锁；旧段迟到不能改当前执行身份或终态',False,'业务创建后有初始空闲事实',{'kind':'derived','value':None,'rule':'新业务无执行时明确ended/noMoreCalls；接受新执行后据真实事件更新'},BUS,SYS),
('ROUTING-EVIDENCE','通话状态判断证据','Followup','routingEvidence','object','channel/domain/raw code/raw label/normalized state/value及准确四元组','AI与云原始域分开；原码和映射保留，UNKNOWN/PENDING不得当空或未接通；仅明确终态作条件',True,'条件引用真实通话结果时必需',None,BUS,SYS),
('TAG-EVIDENCE','实际AI意向标签事实','RoutingEvidence','tags','object','supplier/tenant/type/tagScene/category/brand/revision、state与合法stable IDs','所有已提供标签只能匹配实际sceneSnapshot上下文；KNOWN合法非空子集，NONE明确空，PENDING未知；不按名称映射或写入同名填写字段',True,'AI有标签事实时记录；无标签依赖普通AI可不提供',None,BUS,SYS),
('EVENT-ID','来源事件身份','ExecutionEvent','eventId','string','同来源可唯一重放关联的事件身份','同event+同内容幂等；相反或不一致重复保原事实并待核；不制造新拨打/跟进计数',False,'处理执行事件必需',None,BUS,SYS),
('EVALUATION','路径判断结果','RouteEvaluation','edgeEvaluations','array','每路径MATCHED/UNMATCHED/PENDING及规则事实来源、原因、唯一selectedEdgeId','按捕获方案和准确当前范围判断；任何待核高优先级阻后续/默认；全不匹配留当前节点/归属',False,'执行条件判断时生成',None,BUS,SYS,'transient','判断时一致读取；确认推进前重算，不当作修改业务或自动执行'),
('EVALUATION-TOKEN','流转确认依据','RouteEvaluation','evaluationToken','string','绑定record revision/run/nodeRun/owner/当前全部事实','动作重核旧依据，失效不静默选另一条路径；人员只能确认唯一当前选中的合法路径',False,'确认推进或转交必需',None,BUS,SYS,'transient','本次判断时产生，仅同次输入/事实仍一致时有效'),
('INTENDED-STORE','客户意向门店业务编码','BusinessRecordCurrentImport','intentionStoreCode','string','不透明门店业务编码，保前导零','有意向必须映射同品牌唯一有效门店；名称不是定位依据；无意向才允许当前HQ管理员同次指派',True,'提供意向门店时必须可核；无意向保缺失并标待指派',None,BUS,ADMIN),
('DESTINATION','转交目标定位','TransferDecision','destination','object','MATCHED/UNASSIGNED/PENDING、target/candidates及准确mapping依据','有意向锁唯一目标，缺映射/多映射不冒充无意向；只HQ↔STORE同品牌有效，不转当前或门店直转',False,'TRANSFER判断/确认时必需',None,BUS,SYS,'transient','每次定位和提交重核，用户取消不写归属'),
('TARGET-TENANT','本次明确转交目标','TransferDecision','targetTenantId','string','准确合法承接租户ID','固定目标不得覆盖意向锚定；无意向只当前HQ ADMIN补选；后继AI私有标签上下文须能由目标执行',False,'确认实际转交必填',None,BUS,ADMIN),
('RESOLUTION-TOKEN','门店定位确认依据','TransferDecision','resolutionToken','string','绑定实际意向、目标映射和有效性','提交前变化拒绝并保输入，不以新映射暗换目标',False,'TRANSFER提交必需',None,BUS,SYS,'transient','本次准确定位时产生，映射/意向/资格变化失效'),
('CORRECTIONS','当前资料更正事实','BusinessRecord','corrections','array','字段稳定ID/来源、before/after、reason、操作者、时间和run/stage','管理员直接更新允许维护的当前有效值，原导入/内容快照不改；填写同名不能改IMPORT，旧段不覆盖新值',False,'发生更正时追加',{'kind':'literal','value':[],'rule':'无更正事实即空，不补造来源'},BUS,ADMIN),
('REASON','业务维护原因','BusinessActionInput','reason','string','去首尾空白的非空原因；无额外来源统一长度限制','当前更正、废弃、纠偏、转类、核对移交须说明，不以空白备注提交',False,'上述维护动作必填',None,ADMIN,ADMIN),
('OUTCOME','本次业务结论','FlowRun','businessOutcome','object','PENDING或UNSPECIFIED/SUCCESS/UNSUCCESSFUL/INVALID/NO_CONTACT/NO_CALL/OTHER及显示名/来源','END按捕获配置明确封存；未配置不推成功；跟进完成/客户接通/流程结束/达成分别表达',False,'运行存在时显示独立口径',{'kind':'derived','value':None,'rule':'ACTIVE显示待产生；END取该节点明确配置，未配置UNSPECIFIED'},BUS,SYS),
('OUTCOME-CONFIG','结束节点结论配置','FlowNode','outcomeCode','enum','UNSPECIFIED/SUCCESS/UNSUCCESSFUL/INVALID/NO_CONTACT/NO_CALL/OTHER','结论显示名1～80字且保持所选口径；不能把END自动等同成功',False,'END保存时有配置',{'kind':'literal','value':'UNSPECIFIED','rule':'新增END未设置业务结论'},CFG+BUS,CFG),
('RECLASSIFY-TARGET','目标线索分类','ReclassificationInput','targetCategoryId','string','同品牌其他启用LEAD分类','仅原run已END/ABANDONED且无未核执行，保record/brand/编码/原批次；目标字段与当前绑定先严格预检',False,'受控转冷／转类必填',None,ADMIN,ADMIN),
('RECLASSIFY-TOKEN','转类预检确认依据','ReclassificationInput','validationToken','string','绑定原record revision/run和目标分类/字段/流程/补充values','只复用稳定字段身份，不以同名或跨用途key猜配；实际提交变化则重新预检',True,'转类正式提交必需',None,ADMIN,SYS,'transient','目标资料预检全部通过后产生，本次确认外失效'),
('REQUEST-ID','同次业务请求身份','BusinessRequest','requestId','string','每次明确用户意图的稳定请求ID','同请求/同payload重放读原结果，不能换新身份重发未知操作，不能用相同ID做不同动作或对象',False,'所有业务写动作提交需系统关联',None,BUS,SYS),
('REQUEST-STATUS','请求确认状态','BusinessRequest','status','enum','success/failed/unknown','受理或读取成功不等动作完成；unknown核原请求，失败保原事实，成功可靠回读本次准确对象',False,'请求提交后提供',None,BUS,SYS),
('REVIEW-ASSIGNEE','原请求核对责任人','BusinessRequest','reviewAccountId','string','同本租户有效账号','管理员对准确request移交最小核对权，不授整档案、原动作重放、代填或越租户权限',True,'明确移交核对责任时必填',None,ADMIN,ADMIN),
('WORK-STATE','当前工作队列状态','BusinessRecordProjection','workState','object','code/label/nextAction/reason及可用时间','从真实当前run/执行/内容/条件/安排/联系资格派生，不单独伪写成功；每条按钮沿同源模型守卫',False,'台账/详情读取时产生',None,BUS,SYS,'transient','只读实时计算，不因查询更新原业务时间'),
('STATISTICS','业务跟进与通话统计','BusinessRecordProjection','statistics','object','activities/completed/dials/connected/notExecuted','一次真实办理身份记activity，归档且真实拨打才completed，每actual dial计dials，明确客户接通计connected，零拨失败单列',False,'读取有权业务统计时计算',None,BUS,SYS,'transient','依据准确原事实集合去重汇总，不为显示补造执行'),
('CONTACT-POLICY','本租户联系协调设置','TenantContactPolicy','policy','object','minimumIntervalMinutes/dailyDialLimit/categoryPriorities','同规范号码跨业务仅一有效呼出；排队/重试/未知保占用，额外频控默认关闭，不抢占、不自动续拨',False,'本租户有权管理员配置时使用',None,ADMIN,ADMIN),
('CONTACT-INTERVAL','最短联系间隔','TenantContactPolicy','minimumIntervalMinutes','integer','0～10080分钟','0不附加间隔；有可靠真实拨打时间才计算最早可用，缺准确事实先待核',False,'保存协调策略必需',{'kind':'literal','value':0,'rule':'默认不开启额外间隔'},ADMIN,ADMIN),
('CONTACT-DAILY-LIMIT','每日真实拨打上限','TenantContactPolicy','dailyDialLimit','integer','0～1000次／北京时间自然日','0无额外次数限制；只计真实拨打及重拨，不计受理排队；身份/时间不可靠先核对',False,'保存协调策略必需',{'kind':'literal','value':0,'rule':'默认不加日限'},ADMIN,ADMIN),
('CATEGORY-PRIORITY','分类联系优先级','TenantContactPolicy','categoryPriorities','array','本品牌categoryId唯一，priority整数0～999，数大优先','已安排同号码高优先级先，等优先FIFO；完成待流转/待核不发起新呼叫的沿原协调跳过，已知无匹配仍可跟进者仍参与',False,'配置优先级时提供，可空',{'kind':'literal','value':[],'rule':'未设置分类同级，按先后顺序协调'},ADMIN,ADMIN),
])
# Preconfigured follow-up values are business fields, independent of definition metadata.
preset=[('LEAD-LEVEL','线索等级','leadLevel','enum','A级/B级/C级/D级','预置统计选项身份和文案不可改'),('INTENTION-LEVEL','意向等级','intentionLevel','enum','高意向/中意向/低意向/无意向','保预置统计口径'),('VISIT-INTENTION','到店意向','visitIntention','enum','有意向/暂不确定/无意向','不由AI标签自动写入'),('TESTDRIVE-INTENTION','试驾意向','testDriveIntention','enum','有意向/暂不确定/无意向','独立填写与统计'),('PLANNED-VISIT','计划到店时间','plannedVisitAt','datetime',T,'无真实填写不生成日期'),('PLANNED-STORE','计划到店门店','plannedStoreName','string','自由文本','展示名称不是意向门店租户定位依据'),('MAPPING-SERIES','本次意向车系','mappingIntendedSeries','object','本租户授权Mapping车系接口选中对象','独立查询，无需其他字段；保持预置接口角色，不改手工选项，不用于普通流转值比较'),('SERVICE-CONCERN','服务反馈','serviceConcern','string','多行文本','按售后类最新显示/必填规则填写'),('SERVICE-SATISFACTION','服务满意度','serviceSatisfaction','enum','满意/一般/不满意','存稳定选项，不以文案推导其他字段'),('NEXT-SERVICE','计划保养日期','nextServiceDate','date','YYYY-MM-DD','有效日历日期，无值不造默认今天'),('ACTIVITY-INTEREST','参与意向','activityInterest','enum','愿意参加/待考虑/不参加','按当前活动分类规则填写'),('PARTICIPANTS','参加人数','participantCount','number','有限数值；当前源未规定单独整数/正数门槛','空白不转0，不自行添加来源未定义的量程或舍入'),('INTERESTED-ITEMS','感兴趣的活动','interestedItems','array','到店体验/试驾体验/车主活动的稳定选项集合','多选每项合法且不重复')]
for id,name,key,t,fmt,rule in preset:
 field(id,name,'CurrentFollowupValues',key,t,fmt,rule,True,'对应分类启用且适用本次人工填写时按该引用required确定；预置初始化选填',None,BUS,HANDLER+ADMIN,when='实际办理人正式提交且仍属当前run/stage/owner时，只更新实际操作项；后续有权更正直改当前值并留来源；原快照不变')
# Provenance for features and current normative changes.
new={
2016:('创建品牌共用业务分类与字段基础','在有权品牌维护独立IMPORT/FOLLOWUP字段库及分类基础，分类导入/填写双Tab，明确业务域、编码名称、有序字段与入口必填；保存基础不关联模板、不起呼。'),
2017:('维护品牌共用业务分类、字段及取数规则','按引用保护维护当前字段与分类基础，保稳定身份和接口依赖；变更只在新跟进读取最新定义，已开始流程与正式快照不被重画。'),
2030:('按路径确认同品牌线索转交','当前有权人员在合法TRANSFER节点确认同品牌HQ与STORE之间唯一目标；有意向锁定编码映射，无意向仅总部管理员补选，同次切归属、建阶段、清安排并封本方截止。'),
2031:('明确发起当前呼叫及同组批呼叫','固定CALL节点只用已配置一种方式；本租户按明确跟进人/AI场景安排与准确资源发起。受理不代表拨打或完成，同记录/同号码守卫与逐条批反馈分开。'),
2032:('保存本轮跟进、准确通话事实并唯一归档','实际拨打／接听者正式填写，系统对无人工执行按真实事实归档；每轮basis与内容封存，区分modified/confirmed/未提供，迟到事实归原段，不覆盖新值。'),
2033:('查看业务、运行和有权跟进通话详情','在同权威账本查看实际分类、当前有效资料、流程run/stage、原段快照及通话；转出方只见本方截止，实际接听人可经最小原段入口填写。'),
2034:('创建四节点流转模板','以字段参考分类读取条件来源，在唯一开始锚点编排转交、呼叫、结束，组件定类型、每CALL单方式、有序首命中路径，保存模板不绑定业务。'),
2035:('编辑流转模板当前配置','有权修改最新模板配置，保规则身份与输入；配置待核先核同请求，业务执行待核不冻结独立配置维护，已开始run沿自身捕获方案。'),
2036:('按实际分类严格预检并导入业务','选择实际分类、CSV/XLSX列映射，逐行校系统必需及IMPORT字段、唯一编码、首次路径和直接AI场景；全提交范围均通过且确认依据一致才建业务/批次/run。'),
2037:('分配本租户责任跟进人与AI安排','仅当前有权管理员按同组准确业务资格分配跟进人；方式由节点确定，AI明确本租户场景，人工候选先核电话资格，不选择坐席/任务、不自动呼叫。'),
2038:('判断并确认本租户后继节点','按已捕获方案和准确当前事实有序首命中，明确等待／不匹配／命中；CALL真实拨打及归档后才可退出，确认令牌过期不推进、不自动转交或起呼。'),
2039:('查询业务、批次和工作队列','按当前业务／有权截止历史／管理监管范围读取同一账本；展示下一步及阻塞原因，更新时间倒序再分页，客户号码归集不合并不同业务。'),
2040:('在实际业务分类独立绑定单模板路由','分类路由是唯一实际应用绑定处；同品牌不同字段参考分类可复用，按实际所用字段、AI准确上下文及业务域校验，确认保存不覆盖BASE。'),
2041:('查看当前模板及绑定方案说明','只读查看四节点/入口/条件/承接方/方式，区分字段参考和实际应用分类，实际路由预览使用目标目录当前标签；不展示分类V1/V2选择。'),
2042:('删除当前未被使用的模板定义','当前分类仍绑定或配置操作待核则阻删；否则在对象/品牌/并发依据一致时移除当前定义，不建旧模板归档兼容索引，已开始run靠完整planSnapshot继续办理。')}
features=[]
for num,(name,description) in new.items():
 old=originals['FUNC-'+str(num)]
 features.append({'id':old['id'],'name':name,'description':description,'acceptance_ids':old.get('source_acceptance_ids',[]),'source_refs':['documentation/input/functions.json#'+old['id']],'status':'current','bounds':{'included_scope':[description],'excluded_scope':['不增加历史数据迁移／旧模板兼容','本地原型通过不证明真实供应商执行或生产接口已实现']}})
# Current acceptance statements replace, never duplicate, the old contract.
updates={
'AC-2038':'有品牌配置权的超管及租户管理员维护同品牌分类与两类独立字段库，普通运营只按权限选择；配置权不扩大业务数据权。',
'AC-2039':'同一品牌提供新线索、冷线索、督办、服务、回访、售后类、活动类七预置分类；新/冷线索属LEAD，其他默认ORDINARY；自定义显式业务域。',
'AC-2040':'新增或配置业务分类不新增供应商执行能力；场景、接口与电话资源仍需专业授权且准确匹配。',
'AC-2041':'修改分类基础仅更新名称、编码列名、业务域及导入/填写有序引用和校验规则，不提交或覆盖路由；已开run及正式快照保持。',
'AC-2042':'字段库与分类基础各有唯一维护入口；IMPORT编码必填、无格式配置，FOLLOWUP可用接口单/多选及明确依赖参数映射，实际取数仍按租户授权。',
'AC-2102':'配置人员只能在获权品牌内维护分类、字段与模板；共享配置不授全品牌业务或录音访问。',
'AC-2103':'分类稳定身份、业务域及编码名称明确，导入/填写两个Tab分别维护同用途有序字段、显示及对应入口必填。',
'AC-2105':'条件按IMPORT/FOLLOWUP稳定fieldId或准确通话/AI上下文取值，不设单一标签来源，不按同名或首字段替代。',
'AC-2135':'分类BASE、独立ROUTE、模板字段参考互不覆盖；实际绑定按所用稳定ID/用途/类型/选项/AI上下文校验，新跟进取最新资料而正式/运行快照不追改，未操作/缺失/明确清空分开。',
'AC-2084':'明确转交时owner、新阶段、后继节点、旧安排清除及本方截止快照同次生效；无需接收方二次确认，不自动分配或起呼。',
'AC-2085':'仅同品牌LEAD业务可在合法有效HQ与STORE之间转交。',
'AC-2086':'总部下发以客户意向门店稳定编码唯一定位并由人员确认；无意向只总部管理员同次指派，不按名称或首店猜。',
'AC-2087':'门店自有及转入线索可按流程上交总部，总部再按意向锚定或无意向指派接续；初始归属不因意向空缺自动变化。',
'AC-2088':'门店不得直接转另一门店，亦不得转当前负责租户。',
'AC-2089':'纠偏或再次分发在原run完成/废弃后新run从原负责方按入口办理，仍走门店→总部→合法门店，不插改原流程。',
'AC-2097':'已有意向锁定唯一同品牌有效门店，不允许人为改另一门店；解析不等转交成功。',
'AC-2098':'无意向保原record/brand/code/batch及当前HQ负责，目标待指派不是人员未分配，不复制业务或造新run。',
'AC-2099':'只有当前负责总部管理员可在本次无意向转交补选目标；成功保原客户意向，另留人工目标/来源/人/时间。',
'AC-2100':'意向映射缺失、多义、跨品牌或目标停用为待核/不可办，不能冒充无意向开放补选；后继AI依赖也须由目标租户实际执行。',
'AC-2101':'转交重核当前owner/run/node、唯一selected边、判断与目标令牌、同品牌方向和终态；失败/取消不改，unknown核同请求。',
'AC-2090':'总部CALL节点可配置一种AI/预外呼/人工；本次方式由捕获节点确定，人员明确启动，非导入/分配再选。',
'AC-2091':'门店CALL方式同样由节点确定为单一AI/预外呼/人工，使用目标本租户有效场景/方案和真实身份。',
'AC-2120':'开始/转交/呼叫/结束组件直接定类型；人员明确发起实际CALL或确认后续动作，配置/分配/条件命中不自动执行。',
'AC-2121':'同业务本run执行串行；排队/重试/unknown不放行。新起呼、CALL退出及有前执行的转交核最近必要内容与事实已归档；初次纯IMPORT转交无先填表/先呼叫要求。',
'AC-2122':'受理、真实拨打、执行终态、内容保存、唯一归档、节点、owner及业务结论分别确认；未知核原请求而非新身份重发。',
'AC-2092':'每次实际办理独立followup，开始捕获最新实际分类资料，实际办理/接听人唯一正式提交；纯AI/无人时系统按真实事实唯一归档。正式内容不重写，更正直改当前有效值并留因，旧段迟到不覆盖新值。',
'AC-2123':'IMPORT独立读取当前有效导入值；FOLLOWUP读取指定范围正式确认或授权更正，SYSTEM继承result不冒充新确认；通话/AI标签按准确run/stage/sourceNode/执行场景和版本，不借其他租户；CURRENT_NODE/CURRENT_ROUND不借旧run，显式HISTORY另按本租户准确历史范围核验。',
'AC-2124':'路径按优先顺序只选首个命中；任何依赖事实待核都阻后续及ELSE，保留原节点/owner。所有有出口节点必须唯一末位ELSE，前序条件明确均不匹配才用ELSE；单一出口为ELSE，不存在多路径人工任选。',
'AC-2125':'确认动作重核同一业务owner/run/node、selected edge及evaluationToken、精确当前事实和目标解析；过期保输入重判，不静默换路径；CALL必须真实拨打/必要归档。',
'AC-2093':'接收方在明确转交后按本租户资格读取同条线索基础资料，不因共享模板获得其他租户业务范围。',
'AC-2094':'有权接收方可查看同条业务按既定范围可读的原跟进/通话事实；转出方严格本方截止投影，最小接听表单不等整档案读取。',
'AC-2131':'同台账工作区承载分类导入、批次、记录详情、工作状态、当前有效值及各轮快照；默认列表按更新时间倒序再分页。',
'AC-2132':'当前负责、有权本方截止历史和超管管理范围监管分别投影；辅助运行API不泄露接收方后续节点/场景。',
'AC-2133':'本轮无旧规划数据迁移或旧模板适配；未来本版业务/运行/跟进/通话快照按发生时保存，名称/配置更改不重画已开run或正式内容。',
'AC-2109':'新模板自带唯一开始锚点，拖入转交/呼叫/结束即定类型和默认名称；首个业务节点及合法有序入口明确，不再空白节点二次选类型。',
'AC-2110':'新run捕获完整有效plan并按实际分类记录，模板后续编辑/删除不追改已开run；导入成功定位即已开始。',
'AC-2111':'同品牌模板/实际分类字段与业务域兼容；CALL不隐式换owner，OTHER先转交，不允许普通业务或门店直转越权。',
'AC-2112':'条件支持独立IMPORT，AI状态/标签与人工/预外呼状态/填写；转交精确上游来源，条件配置不授自动呼叫/推进权。',
'AC-2113':'组ALL/ANY明确且已知时计算，标量IN/NOT_IN每行多个值，EQ/NE/大小比较单值；多选及AI标签包含任一/全部，空值独立。',
'AC-2114':'规则字段/选项/类型/作用域合法才可保存；未知不反向放行，逗号保文本，空白行忽略。普通交互保已有输入、比较值、滚动/展开；改变定义不静默丢值。',
'AC-2115':'按实际分类生成系统必需和IMPORT列及必填校验；合法等待名单数据中性提示，检查后具体报字段/节点/条件；正式提交所有行通过且token一致。',
'AC-2116':'LEAD同品牌统一编码跨分类/来源唯一，ORDINARY同品牌同分类唯一；不凭手机号合并，不覆盖重复业务或自动重开。',
'AC-2117':'导入失败保名单可重检；确认全部通过才同次创建批次/记录/实际run及首节点；重复/冲突不改原owner/值/结果。',
'AC-2118':'分配只确定当前租户责任跟进人和必要AI场景，方式已由节点明确，不选择坐席/任务，不改owner、不自动起呼。',
'AC-2119':'仅当前管理员及分配动作权；核active run/本租户/节点/无在途执行/人员与场景。批量同权威组任一不满足全组不写；普通运营仍可按资格AI/预外呼起呼。',
'AC-2129':'超管在管理范围仅监管查询，列表/详情/直接访问一致，不代分配、起呼、填结果或转交。',
'AC-2130':'所有监管和办理读同权威业务事实，不造第二份线索账本或冒用目标身份。',
'AC-2104':'实际应用绑定唯一在分类路由；同品牌不同字段参考分类模板可选，校实际所需字段及AI上下文，只有一个当前模板，无主备/接续映射。',
'AC-2106':'分类列表独立路由入口和独立保存，基础表单不嵌模板；预览区分字段参考分类与实际应用分类，用目标目录显示条件。',
'AC-2107':'路由仅更新本次单模板应用及兼容依据，提交核基础/字段/路由并发，不覆盖BASE；unknown配置不进入新业务。',
'AC-2108':'新运行使用当前明确确认的分类/模板；已定位首业务节点的run保持原方案，只可完成或废弃后新run，不运行中换绑。',
'AC-2134':'路由保存需当前配置资格、同品牌、真实兼容目标字段与类型/用途/选项、AI准确配置，失败/过期/unknown均有明确反馈并保本次草稿。',
'AC-2136':'模板/实际路由只读说明展示当前四节点与入口、有序条件、承接方、方式和独立END结论，参考与应用分明；记录内历史按其捕获方案只读，不提供V1/V2分类选择。',
'AC-2137':'未被当前分类绑定且无同模板待核配置请求时可删除当前定义；前后对象/品牌/版本/引用重核，unknown核同请求，已开run和字段引用依靠自身快照，不建旧归档兼容索引。'}
# Every local is an independently observable action, not a page-sized superflow.
def local(suffix,title,features,acs,trigger,pre,inputs,outputs,steps,branches,post,pages,groups=None):
 id='LOCAL-FLOW-'+suffix;check='CHECK-FLOW-'+suffix; fs=lambda seq:list(dict.fromkeys(fid(x) for x in seq))
 step_rows=[]
 for j,(action,reads,writes) in enumerate(steps,1):step_rows.append({'id':'STEP-FLOW-'+suffix+'-'+str(j),'action':action,'reads':fs(reads),'writes':fs(writes),'rule_ids':groups or ['GR-SCOPE','GR-AUTH','GR-DATA-FACTS','GR-UNKNOWN']})
 br=[]
 for j,(cond,result,ids) in enumerate(branches,1):br.append({'id':'BRANCH-FLOW-'+suffix+'-'+str(j),'condition':cond,'result':result,'field_ids':fs(ids),'test_refs':[check]})
 union=set(fs(inputs+outputs))
 for x in step_rows:union.update(x['reads']+x['writes'])
 for x in br:union.update(x['field_ids'])
 row={'id':id,'title':title,'feature_ids':['FUNC-'+str(x) for x in features],'trigger':trigger,'preconditions':pre,'postconditions':post,'inputs':fs(inputs),'outputs':fs(outputs),'steps':step_rows,'branches':br,'global_rule_ids':groups or ['GR-SCOPE','GR-AUTH','GR-DATA-FACTS','GR-UNKNOWN'],'field_ids':sorted(union),'source_keys':[],'source_refs':['documentation/input/functions.json#FUNC-'+str(x) for x in features],'test_refs':[check]};L.append(row)
 C.append({'id':check,'acceptance_ids':acs,'procedure':trigger+'。'+ '；'.join(pre)+'。依次执行：'+'；'.join(x[0] for x in steps)+'。分别构造：'+'；'.join(x[0] for x in branches),'expected':'；'.join(x[1] for x in branches)+'；'+'；'.join(post)})
 for page in pages:
  d=P.setdefault(page,{'local_ids':[],'field_ids':[],'test_refs':[],'origin_field_groups':[]});d['local_ids'].append(id);d['field_ids']=sorted(set(d['field_ids'])|union);d['test_refs'].append(check)
 return row
cfgpre=['当前品牌及配置管理资格真实有效','提交来源与当前上下文一致']
buspre=['对准确业务有当前本租户办理权','确认业务/run/node/owner及并发依据仍一致']
fieldDefs=['FIELD-ID','BRAND-ID','FIELD-USAGE','FIELD-LABEL','FIELD-TYPE','FIELD-KEY','FIELD-ENABLED','FIELD-OPTIONS'];opts=['OPTION-ID','OPTION-LABEL','OPTION-KEY','OPTION-ENABLED'];iface=['DICTIONARY-ID','SELECTION-MODE','QUERY-CONDITIONS','FIELD-DEPENDS','PARAM-BINDINGS'];cat=['CATEGORY-ID','BRAND-ID','CATEGORY-LABEL','CODE-LABEL','BUSINESS-FAMILY','CATEGORY-IMPORT-REFS','CATEGORY-FOLLOWUP-REFS','CATEGORY-REVISION']
plan=['TEMPLATE-ID','BRAND-ID','TEMPLATE-NAME','TEMPLATE-REF-CATEGORY','TEMPLATE-REVISION','NODES','EDGES','ENTRY-RULES'];node=['NODE-ID','NODE-NAME','NODE-TYPE','RECIPIENT','METHOD','NEXT-NODE','EDGE-ID','BRANCH-KIND','BRANCH-PRIORITY','GROUP-MODE','RULES','RULE-ID','RULE-SOURCE','RULE-FIELD','RULE-OPERATOR','RULE-VALUES','RESULT-SOURCE','ENTRY-CONTEXT','OUTCOME-CONFIG']
local('FIELD-CREATE','新建品牌独立用途字段',[2016],['AC-2038','AC-2042'],'从业务字段或分类Tab新建字段',cfgpre,fieldDefs[1:]+opts+iface,fieldDefs+opts+iface,[('明确品牌、IMPORT/FOLLOWUP用途及当前类型，生成独立稳定ID',fieldDefs[1:4],['FIELD-ID']),('校名称/编码唯一、选项和引用能力；IMPORT必有编码且无接口类型',fieldDefs+opts+iface,fieldDefs+opts+iface)],[('合法新定义','保存字段库，提示尚未加入分类；不自动产生业务或分类引用',fieldDefs),('用途/编码/选项不合法或当前无权','保输入并拒绝，不生成半条字段',fieldDefs+opts)],['字段可被同品牌同用途分类显式添加'],['PAGE-2223','PAGE-2006'],['GR-CONFIG','GR-FIELDS','GR-SCOPE','GR-AUTH','GR-UNKNOWN'])
local('FIELD-EDIT','编辑字段定义与引用保护',[2017],['AC-2041','AC-2042','AC-2135'],'打开已有字段并保存修改',cfgpre,fieldDefs+opts+iface,fieldDefs+opts+iface,[('读取当前定义和实际使用位置，锁定已用身份、用途、品牌、类型、编码',fieldDefs+opts,['FIELD-ID']),('保存保持含义的文案/允许选项修改，重核分类和接口依赖闭包',fieldDefs+opts+iface,fieldDefs+opts+iface)],[('已有使用引用且请求改关键含义','拒绝并显示使用位置，需新建字段身份',fieldDefs),('仅合法文案或允许状态变更','保存当前定义；已捕获快照不追改',fieldDefs+opts)],['普通编辑保原输入与稳定ID'],['PAGE-2223','PAGE-2006'],['GR-CONFIG','GR-FIELDS','GR-DATA-FACTS','GR-AUTH'])
local('FIELD-STATUS','停启字段或选项',[2017],['AC-2041','AC-2042'],'确认字段或选项启停',cfgpre,['FIELD-ID','FIELD-ENABLED','FIELD-OPTIONS']+opts,['FIELD-ENABLED','FIELD-OPTIONS'],[('核有效分类/接口依赖及预置统计保护',['FIELD-ID','FIELD-ENABLED','FIELD-OPTIONS']+iface,[]),('只更新获允许状态，不删除稳定身份',['FIELD-ENABLED','FIELD-OPTIONS'],['FIELD-ENABLED','FIELD-OPTIONS'])],[('停用破坏已启用分类依赖或为受保护预置选项','明确拒绝，原状态保持',['FIELD-ENABLED','OPTION-ENABLED']),('允许状态变化','新选择候选更新，旧快照和已知值仍可按当时定义显示',['FIELD-ENABLED','OPTION-ENABLED'])],['停用不绕过引用删除保护'],['PAGE-2223'],['GR-FIELDS','GR-CONFIG','GR-AUTH'])
local('FIELD-DELETE','删除无实际引用字段',[2017],['AC-2041','AC-2135'],'从字段使用预检确认删除',cfgpre,['FIELD-ID','BRAND-ID'],['FIELD-ID'],[('读取分类、条件、接口、当前run/form/内容等实际引用',['FIELD-ID']+cat+plan+['EFFECTIVE-PLAN','BASIS','CONTENT-SNAPSHOT'],[]),('对无引用准确对象重新核上下文与前后定义后移除',['FIELD-ID','BRAND-ID'],['FIELD-ID'])],[('存在引用、引用未知或期间变化','阻删并保对象及使用位置',['FIELD-ID']),('无引用且前后校验一致','删除本次定义，不级联删业务/其他字段',['FIELD-ID'])],['字段存在与删除结果可准确回读'],['PAGE-2223'],['GR-FIELDS','GR-CONFIG','GR-UNKNOWN','GR-AUTH'])
local('INTERFACE-FIELD','配置接口填写字段定义与依赖',[2016,2017],['AC-2042'],'在品牌字段库或分类配置中保存接口字段定义',cfgpre,iface+['FIELD-ID','FIELD-USAGE'],iface,[('仅FOLLOWUP可选本租户获授权能力及单/多选，明确独立查询或一个上游字段',iface+['FIELD-USAGE'],iface),('校能力、一个上游字段到多参数映射、无自依赖/循环及分类依赖闭包，保存定义',iface+['FIELD-ID'],iface)],[('配置管理资格不足、能力无权/停用或依赖映射不合法','保定义草稿并具体拒绝，不执行取数也不写客户值',iface),('定义合法且明确保存','只更新接口字段配置，供分类启用与后续新跟进读取',iface)],['接口对象不参与普通流转比较，配置权不自动授专业取数或业务填写权'],['PAGE-2223','PAGE-2006'],['GR-FIELDS','GR-CONFIG','GR-SCOPE','GR-AUTH','GR-UNKNOWN'])
for suffix,num,title in [('CATEGORY-CREATE',2016,'新增分类基础与双字段Tab'),('CATEGORY-EDIT',2017,'编辑分类基础与双字段Tab')]:
 local(suffix,title,[num],['AC-2103','AC-2041' if num==2017 else 'AC-2039','AC-2135'],'在业务分类基础表单保存',cfgpre,cat[1:]+fieldDefs+iface,cat,[('校名称、编码列名、业务域和两用途字段的显示/顺序/必填及依赖',cat+fieldDefs+iface,cat),('仅同次保存BASE与字段，不提交ROUTE或AI专业设置',cat,cat)],[('类型/用途错配、依赖不满足或已用业务域被改','保输入拒绝，不动原基础及路由',cat),('合法基础及字段配置','基础成功，尚未绑定路由可保存，提示独立路由入口',cat)],['新跟进读最新定义，已开run/正式内容保持原貌'],['PAGE-2006'],['GR-CONFIG','GR-FIELDS','GR-SCOPE','GR-AUTH'])
for suffix,num,title in [('TEMPLATE-CREATE',2034,'新建四节点字段参考模板'),('TEMPLATE-EDIT',2035,'维护模板当前配置')]:
 local(suffix,title,[num],['AC-2109','AC-2110','AC-2111','AC-2112','AC-2113','AC-2114'],'从流转模板新建／编辑当前配置',cfgpre,plan[1:]+node,plan+node,[('选择字段参考分类读最新字段，唯一开始锚点与组件确定类型',plan+node,plan+node),('编排入口/条件路径、单方式CALL、承接方及独立END结论',plan+node,plan+node),('核稳定引用、类型/值/AI来源、可达结束无环及并发后保存',plan+node,plan)],[('单模板配置请求尚待核、条件不合法或并发已变','保草稿并阻再次保存，不清旧比较值',plan+node),('合法明确保存','更新当前定义，不自动绑定任何分类、不起呼；已开run不追改',plan)],['业务执行待核不无必要冻结独立模板编辑，配置待核仍核原请求'],['PAGE-2228'],['GR-CONFIG','GR-FIELDS','GR-UNKNOWN','GR-AUTH','GR-SCOPE'])
local('TEMPLATE-READ','只读查看模板与节点条件',[2041],['AC-2136'],'从列表、分类路由或业务方案查看模板说明',['有本品牌模板查看资格；不要求修改/删除权','读取业务run捕获方案时须有该业务准确读取权，不因此取得当前模板配置权'],plan+node,plan+node,[('读取准确当前模板或业务run捕获方案',plan+['EFFECTIVE-PLAN'],[]),('分开显示字段参考和实际应用、入口、方式、承接方、条件及业务结论',plan+node+['CATEGORY-ID'],[])],[('无权或读取失败','明确无权/失败，不伪装没有配置',['TEMPLATE-ID']),('可读配置','只读呈现，不生成运行或改变分类绑定',plan+node)],['只读不暴露无权业务/其他租户场景'],['PAGE-2228','PAGE-2006','PAGE-2227'],['GR-CONFIG','GR-SCOPE','GR-AUTH','GR-PRIVACY'])
local('TEMPLATE-DELETE','移除当前未使用模板定义',[2042],['AC-2137'],'在准确模板删除预检后确认',cfgpre,['TEMPLATE-ID','TEMPLATE-REVISION','ROUTE-MAIN','REQUEST-STATUS'],['TEMPLATE-ID','REQUEST-STATUS'],[('只核当前实际分类绑定与未核配置，读取前后使用指纹',['TEMPLATE-ID','ROUTE-MAIN','REQUEST-STATUS'],[]),('准确对象和并发依据一致时移除当前定义，记录本次请求结果',['TEMPLATE-ID','TEMPLATE-REVISION','REQUEST-ID'],['TEMPLATE-ID','REQUEST-STATUS'])],[('当前类别仍绑定或同模板配置待核','阻删并说明实际使用/核对入口；分类当前只支持更换路由模板，无解绑按钮',['ROUTE-MAIN','REQUEST-STATUS']),('仅当前run捕获依赖且没有当前绑定','可以删除定义，run完整快照仍可继续',['TEMPLATE-ID','EFFECTIVE-PLAN']),('结果unknown','保原requestId核对，不重复删除',['REQUEST-ID','REQUEST-STATUS'])],['不维护旧模板归档兼容索引，不损已捕获业务事实'],['PAGE-2228'],['GR-CONFIG','GR-UNKNOWN','GR-NO-HISTORY','GR-AUTH'])
local('ROUTE-BIND','实际分类独立绑定单模板',[2040],['AC-2104','AC-2106','AC-2107','AC-2108','AC-2134','AC-2135'],'从已保存分类的路由配置选择并保存模板',cfgpre,['CATEGORY-ID','BRAND-ID','ROUTE-MAIN','ROUTE-VERSION','CATEGORY-REVISION']+plan+node,['ROUTE-MAIN','ROUTE-VERSION'],[('列本品牌全部当前模板，不按字段参考分类硬筛选',['BRAND-ID','TEMPLATE-REF-CATEGORY','TEMPLATE-ID'],[]),('按实际分类所用稳定字段/用途/类型/选项、AI上下文、LEAD转交域生成有效预览',['CATEGORY-ID']+plan+node+fieldDefs,['EFFECTIVE-PLAN']),('只保存必选单模板应用关系或更换该模板，不提供解绑；重核BASE/fields/route依据，不写基础',['ROUTE-MAIN','ROUTE-VERSION','CATEGORY-REVISION'],['ROUTE-MAIN','ROUTE-VERSION'])],[('缺所用字段/上下文、跨品牌或配置待核','阻保存并具体说明，不按同名猜配',['ROUTE-MAIN','RULE-FIELD','RESULT-SOURCE']),('明确成功','新run用本次当前关系，已开run按原完整plan',['ROUTE-MAIN','EFFECTIVE-PLAN']),('结果未知或冲突','保本次选择，核同请求或重读，不接收新run',['REQUEST-ID','REQUEST-STATUS','ROUTE-VERSION'])],['参考与应用保持分离，分类字段/名称不被覆盖'],['PAGE-2006'],['GR-CONFIG','GR-FIELDS','GR-SCOPE','GR-UNKNOWN','GR-AUTH'])
local('IMPORT-MAP','读取名单并显式列映射',[2036],['AC-2115'],'在导入与分配粘贴CSV/TSV或选择CSV/XLSX并配置映射',['当前租户管理员有customer.import资格'],['CATEGORY-ID','IMPORT-TEXT','IMPORT-MAPPING','FILE-READ'],['IMPORT-TEXT','IMPORT-MAPPING','FILE-READ'],[('按实际分类导入schema识别表头，非标准列明确目标或忽略',['CATEGORY-ID','CATEGORY-IMPORT-REFS','IMPORT-TEXT'],['IMPORT-MAPPING']),('核一目标一列、必填列和未知数据列；映射/表头/字段变化使预览失效',['IMPORT-MAPPING','IMPORT-TEXT'],['IMPORT-PREVIEW','IMPORT-TOKEN']),('读取期间锁检查/提交，仅最新窗口/身份/序号结果可应用',['FILE-READ','IMPORT-TEXT'],['FILE-READ','IMPORT-TEXT'])],[('重复目标、未映必填或FOLLOWUP/未知目标','保原文本具体报错，不静默丢行',['IMPORT-MAPPING','IMPORT-TEXT']),('旧文件迟到/读取失败/用户手改','不覆盖新文本或新窗口，旧预览不可提交',['FILE-READ','IMPORT-TEXT']),('映射合法','生成规范字段输入，但尚未创建业务',['IMPORT-MAPPING'])],['格式示例只示格式，不保证满足分流'],['PAGE-2204'],['GR-AUTH','GR-FIELDS','GR-DATA-FACTS','GR-UNKNOWN'])
local('IMPORT-PREVIEW','逐行严格预检及首次分流诊断',[2036],['AC-2115','AC-2116','AC-2117'],'点击检查名单',['管理员导入资格有效','实际分类已绑定确认的有效流程'],['CATEGORY-ID','BATCH-NAME','IMPORT-TEXT','IMPORT-MAPPING','AI-SCENE'],['IMPORT-PREVIEW','IMPORT-TOKEN'],[('校系统必需、IMPORT类型/选项/编码映射、同品牌编码去重',['CATEGORY-ID','BUSINESS-CODE','CUSTOMER-NAME','PHONE','IMPORT-NOTE','IMPORT-VALUES'],['IMPORT-PREVIEW']),('按真实每行数据选合法入口/首转交和首个呼叫；直接AI核明确本租户场景',['ENTRY-RULES','ENTRY-CONTEXT','IMPORT-VALUES','RECIPIENT','AI-SCENE'],['IMPORT-PREVIEW']),('只有全部行成功时生成绑定数据/字段/流程/场景的token',['IMPORT-PREVIEW'],['IMPORT-TOKEN'])],[('尚未输入可影响路由的IMPORT资料','中性列所需分流字段，不提前标配置错误',['IMPORT-PREVIEW']),('实际行空/不匹配/首次依赖未来通话或填写','具体报节点、字段和条件，无token不创建业务',['IMPORT-PREVIEW','IMPORT-TOKEN']),('存在重复或类型/选项错误','给逐行原因，不覆盖已有业务',['BUSINESS-CODE','IMPORT-PREVIEW']),('所有行通过','展示本行首个呼叫方式/无需呼叫及确认依据',['IMPORT-PREVIEW','IMPORT-TOKEN'])],['预览不转交、不起呼、不写正式业务'],['PAGE-2204'],['GR-CONFIG','GR-FIELDS','GR-SCOPE','GR-AUTH','GR-UNKNOWN','GR-DATA-FACTS'])
local('IMPORT-COMMIT','确认导入并创建实际运行',[2036],['AC-2115','AC-2116','AC-2117'],'点击确认导入',['当前管理员资格及实际分类关系仍有效','本次正式范围所有行通过且token与重算完全一致'],['IMPORT-TOKEN','IMPORT-PREVIEW','BATCH-NAME','CATEGORY-ID','IMPORT-VALUES','AI-SCENE'],['BATCH-ID','RECORD-ID','OWNER-TENANT','RUN-ID','EFFECTIVE-PLAN','ENTRY-DECISION','IMPORT-ORIGINAL','NODE-RUN-ID'],[('提交前重核每行数据及最新确认配置，不以旧预览直接写',['IMPORT-TOKEN','IMPORT-VALUES','ROUTE-MAIN'],[]),('同次建立批次/业务身份/原始来源/初始负责租户及捕获完整plan的run',['BATCH-NAME','BUSINESS-CODE','CATEGORY-ID','IMPORT-VALUES'],['BATCH-ID','RECORD-ID','OWNER-TENANT','IMPORT-ORIGINAL','RUN-ID','EFFECTIVE-PLAN']),('按入口定位首业务节点，合法END直接结束，其他等待转交或安排',['ENTRY-RULES','ENTRY-CONTEXT','EFFECTIVE-PLAN'],['ENTRY-DECISION','NODE-RUN-ID','RUN-STATUS','OUTCOME'])],[('任何行失败或token过期','整个提交不建部分业务，保名单重检',['IMPORT-TOKEN','IMPORT-PREVIEW']),('明确成功','台账可定位当前记录/批次；导入定位即已开始运行',['RECORD-ID','BATCH-ID','RUN-ID']),('响应未知','保同请求核对，不另建重复批次',['REQUEST-ID','REQUEST-STATUS'])],['不自动分配、转交或呼叫'],['PAGE-2204'],['GR-CONFIG','GR-FIELDS','GR-SCOPE','GR-AUTH','GR-UNKNOWN','GR-DATA-FACTS'])
local('ASSIGN','安排当前租户责任跟进人',[2037],['AC-2118','AC-2119'],'在当前CALL记录点击安排',['当前owner租户管理员及task.assign动作权','ACTIVE run、CALL节点且无在途/排队/重试/未知执行'],['RECORD-ID','RECORD-REVISION','FOLLOWER','AI-SCENE','ARRANGEMENT'],['FOLLOWER','ARRANGEMENT'],[('读取模型同源候选，人工前置核电话身份/资源资格，AI/预外呼责任不强坐席',['RECORD-ID','METHOD','RECIPIENT'],['FOLLOWER']),('AI明确当前实际租户/分类/节点及下游所需场景后保存同一安排',['FOLLOWER','AI-SCENE','METHOD'],['ARRANGEMENT','RECORD-REVISION'])],[('人员失效、原安排不适配或源配置变更','具体说明并保选择，不能保存无权安排',['FOLLOWER','AI-SCENE']),('合法保存','只改责任及场景安排，不改owner/方式、不起呼',['FOLLOWER','ARRANGEMENT','OWNER-TENANT'])],['按钮、上下文和模型动作资格一致'],['PAGE-2204','PAGE-2227'],['GR-AUTH','GR-SCOPE','GR-SERIAL','GR-CONFIG'])
local('ASSIGN-BATCH','同组批量安排',[2037],['AC-2119'],'勾选同组记录后分配跟进人',['管理员对每行有当前assign资格','分组含owner/分类/捕获模板/节点/方式/场景一致'],['RECORD-ID','FOLLOWER','AI-SCENE','ARRANGEMENT','RECORD-REVISION'],['FOLLOWER','ARRANGEMENT'],[('逐条读取实际可安排上下文并求共同有效候选',['RECORD-ID','ARRANGEMENT'],[]),('同组选择人及必要AI场景，提交前每行重核',['FOLLOWER','AI-SCENE','RECORD-REVISION'],['FOLLOWER','ARRANGEMENT'])],[('跨组或任一记录/候选不合法','全组不写，提示分组或具体不合格原因',['ARRANGEMENT']),('全部合法','同次保存组内安排，不自动批起呼',['FOLLOWER','ARRANGEMENT'])],['不按相同nodeId误合不同模板组'],['PAGE-2204'],['GR-AUTH','GR-SCOPE','GR-SERIAL','GR-CONFIG'])
local('AI-SCENE','选择并重核当前AI场景',[2037,2031],['AC-2118','AC-2119','AC-2111'],'导入直接AI或当前AI安排显式选择场景',['实际执行租户及当前成员有AI使用模块','真实场景目录可核'],['CATEGORY-ID','OWNER-TENANT','AI-SCENE','RESULT-SOURCE','EFFECTIVE-PLAN'],['AI-SCENE','SCENE-SNAPSHOT'],[('只投影实际租户/分类当前启用场景，不要求标签维护权',['CATEGORY-ID','OWNER-TENANT'],['AI-SCENE']),('汇总本CALL及下游取数节点的AI_TAG依赖，核supplier/tenant/type/tagScene/revision与合法tag IDs',['EFFECTIVE-PLAN','RESULT-SOURCE','AI-SCENE'],['SCENE-SNAPSHOT'])],[('需标签依赖但当前上下文不一致','阻选择/起呼并指出需核流程与场景，不把其他租户标签替代',['AI-SCENE','SCENE-SNAPSHOT']),('普通AI无标签条件依赖','沿执行配置有效性可正常选/起呼，不因闲置标签metadata强绑',['AI-SCENE']),('首节点先转交','原方不选目标私有场景，接收方接续再选',['OWNER-TENANT','AI-SCENE'])],['场景不是客户永久属性，受理后按实际快照保留'],['PAGE-2204','PAGE-2227'],['GR-SCOPE','GR-AUTH','GR-CONFIG','GR-DATA-FACTS'])
local('START','明确发起本条CALL实际执行',[2031],['AC-2090','AC-2091','AC-2120','AC-2121','AC-2122'],'确认开始本次办理',buspre+['本CALL已安排责任人且必要场景当前可用','前次所需内容和事实已归档，联系限制与号码协调允许'],['RECORD-ID','ARRANGEMENT','METHOD','AI-SCENE','PHONE','RECORD-REVISION'],['FOLLOWUP-ID','ACTOR','ACTUAL-HANDLER','BASIS','SCENE-SNAPSHOT','RESOURCE-SNAPSHOT','EXECUTION-STATE'],[('重核当前人/owner/run/node、场景依赖、唯一资源及公共联系限制',['RECORD-ID','ARRANGEMENT','METHOD','PHONE','CONTACT-POLICY'],[]),('人工本人拨打，管理员可用本人已有效坐席，明确实际人与责任人不同',['FOLLOWER','ACTOR','RESOURCE-SNAPSHOT'],['ACTUAL-HANDLER']),('产生唯一跟进，捕获最新实际分类定义/值与实际场景，记录受理而非拨打',['CATEGORY-ID','IMPORT-VALUES','FOLLOWUP-VALUES'],['FOLLOWUP-ID','BASIS','SCENE-SNAPSHOT','RESOURCE-SNAPSHOT','EXECUTION-STATE'])],[('资格/资源/场景/频次失败','无新执行段，保原安排并准确原因',['ARRANGEMENT','EXECUTION-STATE']),('明确受理','执行中但calls可为空，等待真实事实',['FOLLOWUP-ID','CALLS','EXECUTION-STATE']),('受理结果未知','持同请求核对，不再起第二次',['REQUEST-ID','EXECUTION-STATE'])],['不自动推进节点或改变owner'],['PAGE-2204','PAGE-2227'],['GR-SCOPE','GR-AUTH','GR-SERIAL','GR-CONTACT','GR-DATA-FACTS','GR-UNKNOWN'])
local('START-BATCH','同组AI／预外呼逐条批发起',[2031],['AC-2120','AC-2121','AC-2122'],'勾选同组AI/预外呼并明确确认发起',buspre+['每行有startMany资格，分类/模板/节点/方式/场景同组'],['RECORD-ID','ARRANGEMENT','METHOD','CONTACT-POLICY'],['FOLLOWUP-ID','EXECUTION-STATE','REQUEST-STATUS'],[('按分类优先及同级先后逐条重核，不抢占已有执行',['RECORD-ID','CATEGORY-PRIORITY','ARRANGEMENT'],[]),('每记录独立建立跟进/受理结果，仍对同号执行协调',['RECORD-ID','PHONE','ARRANGEMENT'],['FOLLOWUP-ID','EXECUTION-STATE','REQUEST-STATUS'])],[('部分受理/失败/未知','逐行准确反馈和身份，已受理不回滚成未发生，失败不自动续拨',['REQUEST-STATUS','FOLLOWUP-ID']),('人工或跨组混选','阻批发起，人工本人逐条处理',['METHOD','ARRANGEMENT'])],['分配批次与执行批次不是同一成功口径'],['PAGE-2204'],['GR-SERIAL','GR-CONTACT','GR-AUTH','GR-DATA-FACTS','GR-UNKNOWN'])
local('CALL-FACTS','登记准确执行和通话回执',[2032],['AC-2092','AC-2122','AC-2123'],'外部执行事实或本地明确模拟事件到达',['原执行段/尝试身份可唯一关联','事实来源授权与原tenant/method一致'],['FOLLOWUP-ID','ATTEMPT-ID','EVENT-ID','PROVIDER-CALL-ID','CALL-STATE','DIALED','DIALED-AT','CUSTOMER-ANSWERED','HUMAN-ANSWER','RETRIES-COMPLETE','ROUTING-EVIDENCE','TAG-EVIDENCE'],['CALLS','EXECUTION-STATE','ROUTING-EVIDENCE','TAG-EVIDENCE'],[('按准确record/run/stage/nodeRun/followup/attempt归原事实，不凭号码或当前指针',['RECORD-ID','RUN-ID','STAGE-ID','NODE-RUN-ID','FOLLOWUP-ID','ATTEMPT-ID'],['CALLS']),('区分受理/排队/实际dial/客户接通/实际人工身份/重试收敛',['DIALED','DIALED-AT','CUSTOMER-ANSWERED','HUMAN-ANSWER','RETRIES-COMPLETE'],['CALLS','EXECUTION-STATE']),('标签事实只匹配实际sceneSnapshot七元组及合法命中子集，NONE准确空也是已知',['SCENE-SNAPSHOT','TAG-EVIDENCE'],['ROUTING-EVIDENCE','TAG-EVIDENCE'])],[('同事件同内容重复','读原结果，不重复拨打、接通、跟进计数',['EVENT-ID','STATISTICS']),('相反终态/身份或其他scene回调','保原事实，拒或冲突待核，不复活已结束通话',['CALLS','ROUTING-EVIDENCE']),('迟到原段准确信息','只补原段，不改新run/currentowner/已封内容',['FOLLOWUP-ID','CONTENT-SNAPSHOT','EXECUTION-STATE'])],['普通AI可记录本轮实际新标签版本，不能用run旧catalog误拒准确可选标签事实'],['PAGE-2227'],['GR-DATA-FACTS','GR-UNKNOWN','GR-SERIAL','GR-PRIVACY'])
local('SAVE-CONTENT','实际办理人正式保存本轮内容',[2032],['AC-2092','AC-2123','AC-2135'],'实际拨打/接听人从准确原段表单正式保存',['原段已结束，仍未contentSaved','提交者准确等于原实际办理/接听账号且tenant一致'],['FOLLOWUP-ID','FORM-VALUES','MODIFIED-FIELDS','VALUE-CONFLICT'],['CONTENT-SNAPSHOT','CONTENT-SAVED','CONFIRMED-FIELDS','ROUTING-FIELD-SNAPSHOT','FOLLOWUP-VALUES'],[('使用本次basis实际展示定义，校必填/类型/选项和原businessType',['BASIS','FORM-VALUES'],[]),('比较开始后当前有效值差异，未确认则保草稿等待核对',['FORM-VALUES','MODIFIED-FIELDS','VALUE-CONFLICT'],[]),('同次封内容/修改/确认快照；仅同owner/stage/run的provided更新当前有效值',['BASIS','FORM-VALUES','MODIFIED-FIELDS'],['CONTENT-SNAPSHOT','CONTENT-SAVED','CONFIRMED-FIELDS','ROUTING-FIELD-SNAPSHOT','FOLLOWUP-VALUES'])],[('管理员/责任人但非实际人，或已正式保存','拒代填/重写，原段快照不变',['ACTUAL-HANDLER','CONTENT-SNAPSHOT']),('基础已知预填但未修改且正式确认','可纳confirmed用于条件，modified仍为空，不要求重输',['CONFIRMED-FIELDS','MODIFIED-FIELDS']),('基础absent默认空','不成为已知人工确认；显式provided清空才known empty',['ROUTING-FIELD-SNAPSHOT']),('并发当前值改变且无准确确认令牌','保三方差异和输入，阻覆盖',['VALUE-CONFLICT','FORM-VALUES'])],['内容保存成功不自动宣称整次执行完成'],['PAGE-2227','PAGE-2203'],['GR-DATA-FACTS','GR-FIELDS','GR-AUTH','GR-PRIVACY','GR-UNKNOWN'])
local('ARCHIVE','唯一完成跟进归档',[2032],['AC-2092','AC-2121','AC-2122'],'通话终态/人工保存/必要证据齐备后系统评估',['同followup准确身份','真实所有拨打结束、重试完毕、实际人工事实和必要状态/下游tags可核'],['FOLLOWUP-ID','CALLS','CONTENT-SAVED','HUMAN-ANSWER','RETRIES-COMPLETE','ROUTING-EVIDENCE','TAG-EVIDENCE'],['ARCHIVED','ARCHIVE-STATE','CONTENT-SNAPSHOT','STATISTICS'],[('有人工必须由实际人先保存内容；纯AI/明确无人由系统保存事实摘要',['ACTUAL-HANDLER','HUMAN-ANSWER','CONTENT-SAVED'],['CONTENT-SNAPSHOT','CONTENT-SAVED']),('必要终态/内容/下游依赖全部明确才唯一COMPLETE',['RETRIES-COMPLETE','ROUTING-EVIDENCE','TAG-EVIDENCE','CONTENT-SAVED'],['ARCHIVED','ARCHIVE-STATE','STATISTICS'])],[('首通结束但重试或人/标签事实未知','保持待结果/待核，不计完成',['ARCHIVE-STATE','STATISTICS']),('SYSTEM未接听自动归档','只记录真实事实，不以继承旧result值造新人工confirmed',['CONFIRMED-FIELDS','ROUTING-FIELD-SNAPSHOT']),('完成或同事件重复到达','不重复封内容或计完成；真实零拨失败只记异常',['ARCHIVED','STATISTICS'])],['完成跟进与流程END及业务达成分开'],['PAGE-2227','PAGE-2203'],['GR-DATA-FACTS','GR-UNKNOWN','GR-SERIAL'])
local('CORRECT','有权管理员更正当前有效资料',[2032],['AC-2092','AC-2135'],'更正当前资料并填写原因',buspre+['当前管理员有资料维护资格'],['RECORD-ID','IMPORT-VALUES','FOLLOWUP-VALUES','REASON','RECORD-REVISION'],['IMPORT-VALUES','FOLLOWUP-VALUES','CORRECTIONS'],[('仅显示当前启用可维护定义，分IMPORT/FOLLOWUP身份和类型校验；号码等允许清空为未知，后续实际起呼仍必须重校有效号码',['CATEGORY-ID','IMPORT-VALUES','FOLLOWUP-VALUES'],[]),('按明确字段直接更新当前值及别名一致性，留before/after/来源和原因',['REASON','RECORD-REVISION'],['IMPORT-VALUES','FOLLOWUP-VALUES','CORRECTIONS'])],[('无权、未知字段/非法值或并发变化','拒并保输入，不动原当前值',['RECORD-REVISION','IMPORT-VALUES','FOLLOWUP-VALUES']),('合法明确更正','当前判断可用此授权来源，原导入/跟进快照保持',['CORRECTIONS','CONTENT-SNAPSHOT','IMPORT-ORIGINAL'])],['更正不是重新提交原正式跟进，也不自动发起新run'],['PAGE-2227'],['GR-FIELDS','GR-DATA-FACTS','GR-AUTH','GR-UNKNOWN'])
local('EVALUATE','读取准确事实并有序判断路径',[2038,2030],['AC-2123','AC-2124','AC-2125'],'判断当前后续路径',buspre,['RECORD-ID','EFFECTIVE-PLAN','IMPORT-VALUES','FOLLOWUP-VALUES','ROUTING-FIELD-SNAPSHOT','ROUTING-EVIDENCE','TAG-EVIDENCE'],['EVALUATION','EVALUATION-TOKEN'],[('按规则精确来源和声明scope读取已确认事实，IMPORT无需呼叫',['RULE-SOURCE','RULE-FIELD','RESULT-SOURCE','IMPORT-VALUES','ROUTING-FIELD-SNAPSHOT'],[]),('计算类型允许单值/多值条件、组和优先路径，未知阻后序/default',['RULE-OPERATOR','RULE-VALUES','GROUP-MODE','BRANCH-PRIORITY'],['EVALUATION']),('记录一致事实与唯一selected边，生成确认token',['RECORD-REVISION','EVALUATION'],['EVALUATION-TOKEN'])],[('缺失、草稿、错租户/错run/错scene或冲突','PENDING并解释来源，不反向当NOT_IN成功',['EVALUATION']),('已知空与非空','空只用为空类命中，EQ/NE/集合不借空放行',['EVALUATION']),('所有已知条件不匹配且无default','留当前node/owner，CALL可按资格继续跟进',['WORK-STATE','EVALUATION']),('首个合法条件或default命中','只选一个，仍需人员确认动作',['EVALUATION','EVALUATION-TOKEN'])],['本次判断不自动执行或改归属；SYSTEM不刷新也不抹除同scope先前有效人工确认'],['PAGE-2227'],['GR-DATA-FACTS','GR-FIELDS','GR-SERIAL','GR-UNKNOWN','GR-SCOPE'])
local('ADVANCE','确认本租户节点推进或END',[2038],['AC-2120','AC-2122','AC-2125'],'人员确认唯一已满足后继路径',buspre+['当前CALL实际拨打及必要跟进已归档','无执行/重试/unknown占用'],['RECORD-ID','EVALUATION-TOKEN','EDGE-ID'],['NODE-RUN-ID','RUN-STATUS','OUTCOME'],[('重算同一selected边、token及后继承接范围，不静默改选',['EVALUATION-TOKEN','EDGE-ID','RECIPIENT'],[]),('进入准确后继节点；END封独立业务结论，其他节点等待明确办理',['NEXT-NODE','EFFECTIVE-PLAN','OUTCOME-CONFIG'],['NODE-RUN-ID','RUN-STATUS','OUTCOME'])],[('未做实际CALL或未归档/旧确认过期','拒推进并保原node/owner',['NODE-RUN-ID','EVALUATION-TOKEN']),('明确成功','只推进节点，不自动起呼、不隐式转交',['NODE-RUN-ID','RUN-STATUS']),('请求未知','核同request，不重复进入节点',['REQUEST-ID','REQUEST-STATUS'])],['无需呼叫业务应在START直接END，不能默认出口绕CALL'],['PAGE-2227'],['GR-SERIAL','GR-DATA-FACTS','GR-AUTH','GR-UNKNOWN'])
local('TRANSFER','确认同品牌线索租户转交',[2030],['AC-2084','AC-2085','AC-2086','AC-2087','AC-2088','AC-2089','AC-2097','AC-2098','AC-2099','AC-2100','AC-2101'],'在TRANSFER命中路径确认目标',buspre+['LEAD且同品牌有效HQ↔STORE','无在途/重试/unknown，已有前执行的必要内容/事实已归档'],['EVALUATION-TOKEN','EDGE-ID','INTENDED-STORE','TARGET-TENANT','RESOLUTION-TOKEN'],['OWNER-TENANT','STAGE-ID','STAGE-TRANSFER','DEPARTURE-SNAPSHOT','NODE-RUN-ID','ARRANGEMENT'],[('门店上交定位同品牌唯一有效总部；总部下发有编码唯一锚定，编码和名称皆无才由HQ ADMIN同次选合法门店',['INTENDED-STORE','DESTINATION','TARGET-TENANT'],[]),('重核selected/目标令牌、合法方向和后继CALL/AI私有上下文',['EVALUATION-TOKEN','RESOLUTION-TOKEN','RECIPIENT'],[]),('同次封本方截止、切owner/阶段/节点并清责任和执行安排',['OWNER-TENANT','STAGE-ID'],['DEPARTURE-SNAPSHOT','OWNER-TENANT','STAGE-ID','STAGE-TRANSFER','NODE-RUN-ID','FOLLOWER','ARRANGEMENT'])],[('同租户/门店直转/跨品牌/普通业务/映射不明','拒，不假成功或改原客户意向',['OWNER-TENANT','DESTINATION']),('明确成功','同业务ID接续，目标无需接收确认，后续再安排私有场景/人',['RECORD-ID','OWNER-TENANT','ARRANGEMENT']),('失败或未知','原事实保留，未知按同请求核对，不重复owner切换',['REQUEST-ID','REQUEST-STATUS'])],['转交不生成客户跟进，不自动呼叫'],['PAGE-2227','PAGE-2204'],['GR-SCOPE','GR-AUTH','GR-PRIVACY','GR-SERIAL','GR-DATA-FACTS','GR-UNKNOWN'])
local('ABANDON','请求并明确废弃本运行',[2038,2032],['AC-2122','AC-2110'],'当前管理员确认废弃并写原因',buspre+['有废弃资格且run ACTIVE或ABANDONING'],['RUN-ID','RUN-STATUS','REASON','EXECUTION-STATE'],['RUN-STATUS','ARCHIVE-STATE'],[('登记本次废弃意图及原因，保实际已发生事实',['RUN-ID','REASON'],['RUN-STATUS']),('核所有执行/重试及同业务unknown已收敛，才能标废弃完成',['EXECUTION-STATE','REQUEST-STATUS'],['RUN-STATUS','ARCHIVE-STATE'])],[('仍在途/排队/重试/unknown','ABANDONING，不能另起或宣称完成',['RUN-STATUS']),('已准确终止并核结果','ABANDONED，保旧plan/内容/通话；可经受控新run入口',['RUN-STATUS','EFFECTIVE-PLAN','CONTENT-SNAPSHOT'])],['不把废弃当业务达成或删除真实通话'],['PAGE-2227'],['GR-SERIAL','GR-UNKNOWN','GR-DATA-FACTS','GR-AUTH'])
local('REOPEN','再次跟进／归属纠偏新运行',[2038,2031],['AC-2108','AC-2110','AC-2122'],'原流程完成或废弃完成后管理员开始再次办理',buspre+['原run ENDED/ABANDONED且无未核执行','实际分类当前路由及模板保存均明确确认可用'],['RECORD-ID','RUN-PURPOSE','REASON','IMPORT-VALUES','ROUTE-MAIN'],['RUN-ID','EFFECTIVE-PLAN','ENTRY-DECISION','RUN-STATUS','ARRANGEMENT'],[('再次跟进或带原因纠偏，从实际当前owner/目的重核入口和首呼合法性',['OWNER-TENANT','RUN-PURPOSE','IMPORT-VALUES'],[]),('读取实际分类最新字段/确认模板，建新run并清旧安排，保旧run/seg',['CATEGORY-ID','ROUTE-MAIN'],['RUN-ID','EFFECTIVE-PLAN','ENTRY-DECISION','ARRANGEMENT'])],[('路由或模板结果待核、无合法入口、仍在执行','拒新run且原业务不变',['RUN-STATUS','REQUEST-STATUS']),('明确创建','同record/owner新run，重核分配/场景；CURRENT_NODE/CURRENT_ROUND不借旧run结果，显式HISTORY仅沿其准确本租户历史资格',['RUN-ID','OWNER-TENANT','ARRANGEMENT'])],['纠偏不直接改owner或门店互转，不在原流程插节点'],['PAGE-2227'],['GR-CONFIG','GR-SERIAL','GR-SCOPE','GR-UNKNOWN','GR-DATA-FACTS'])
local('RECLASSIFY','同业务受控转冷／转类',[2038,2036],['AC-2108','AC-2116','AC-2122'],'当前管理员选择同品牌目标线索分类并预检确认',buspre+['原run已结束/废弃完成，无执行unknown','原分类与目标均同品牌LEAD，目标当前route可用'],['RECLASSIFY-TARGET','IMPORT-VALUES','REASON','RECLASSIFY-TOKEN'],['CATEGORY-ID','IMPORT-VALUES','RUN-ID','EFFECTIVE-PLAN'],[('只按稳定字段身份复用，缺目标必填由管理员明确补充并预检',['RECLASSIFY-TARGET','IMPORT-VALUES'],['RECLASSIFY-TOKEN']),('重核目标schema/route/原record依据，保持业务ID、brand、统一编码和原批次',['RECLASSIFY-TOKEN','RECORD-REVISION','BUSINESS-CODE','BATCH-ID'],['CATEGORY-ID','IMPORT-VALUES','RUN-ID','EFFECTIVE-PLAN'])],[('跨品牌/普通域/重复统一编码/缺字段或token过期','保输入拒，不合并或覆盖其他业务',['RECLASSIFY-TOKEN','CATEGORY-ID']),('明确成功','记录转类原因和前后分类/当前值，原运行快照仍按其原分类可读',['CATEGORY-ID','CORRECTIONS','CONTENT-SNAPSHOT'])],['同一业务新run而非重复导入，owner不自动变'],['PAGE-2227'],['GR-FIELDS','GR-SCOPE','GR-CONFIG','GR-DATA-FACTS','GR-UNKNOWN','GR-AUTH'])
local('QUERY','查询统一台账及工作队列',[2039],['AC-2129','AC-2130','AC-2131','AC-2132'],'进入导入与分配／业务列表并筛选队列',['当前身份及租户范围可核'],['CATEGORY-ID','WORK-STATE','OWNER-TENANT'],['RECORD-ID','WORK-STATE','OUTCOME','UPDATED-AT','STATISTICS'],[('从同权威账本按当前/截止历史/管理监管资格投影，不用品牌配置权扩范围',['OWNER-TENANT','DEPARTURE-SNAPSHOT'],[]),('算工作状态、下一步和阻塞原因，先更新时间倒序全量过滤再分页',['RUN-STATUS','EXECUTION-STATE','ARRANGEMENT','EVALUATION'],['WORK-STATE','STATISTICS']),('入口按钮按行实际动作资格，普通运营可起呼但不导入/分配',['WORK-STATE'],[])],[('确定空记录','显示空态及有权下一步，不假造条数',['RECORD-ID']),('范围或读取失败','显示错误/无权而非空成功',['WORK-STATE']),('当前记录可办','队列可定位待转交/待安排/待起呼/待结果/待填写/待流转/条件未满足/待核等',['WORK-STATE'])],['读取不改变业务更新时间或状态'],['PAGE-2204','PAGE-2226'],['GR-LIST-ORDER','GR-SCOPE','GR-AUTH','GR-DATA-FACTS','GR-PRIVACY'])
local('BATCH-READ','读取有权导入批次和逐行结果',[2039],['AC-2131','AC-2132'],'从当前台账打开批次查看业务',['本次批次可见范围有效'],['BATCH-ID'],['RECORD-ID','IMPORT-PREVIEW','WORK-STATE'],[('按实际可见记录裁剪批次及私有行，准确表明部分可见',['BATCH-ID','OWNER-TENANT','DEPARTURE-SNAPSHOT'],[]),('可见集按真实更新时间倒序分页，关联到准确业务',['BATCH-ID','UPDATED-AT'],['RECORD-ID','WORK-STATE'])],[('本范围无可见内容','明确无权/不可读，不暴露其他租户名单',['BATCH-ID']),('有可见行','展示真实逐行结果和当前办理入口，不按手机号猜记录',['RECORD-ID','IMPORT-PREVIEW'])],['不通过批次扩大跨租户字段或电话读取'],['PAGE-2204','PAGE-2226'],['GR-LIST-ORDER','GR-SCOPE','GR-PRIVACY'])
local('DETAIL','读取当前业务与本方截止详情',[2033],['AC-2093','AC-2094','AC-2131','AC-2132','AC-2133'],'打开准确业务详情或辅助run/timeline接口',['当前读取资格和准确业务身份可核'],['RECORD-ID'],['IMPORT-VALUES','FOLLOWUP-VALUES','RUN-ID','EFFECTIVE-PLAN','CONTENT-SNAPSHOT','CALLS','CORRECTIONS','WORK-STATE','OUTCOME'],[('分别投影当前负责、超管管理只读、本方转出截止三身份',['RECORD-ID','OWNER-TENANT','DEPARTURE-SNAPSHOT'],[]),('按各自快照显示当前资料、实际run、原段内容和通话，辅助接口同样裁剪',['EFFECTIVE-PLAN','BASIS','CONTENT-SNAPSHOT','CALLS'],[])],[('实际接听人只有原段资格','只通过最小待填写入口，不由detail获得整档案',['ACTUAL-HANDLER','FOLLOWUP-ID']),('转出方历史','不返回接收方当前run/node/arrangement/后续值',['DEPARTURE-SNAPSHOT']),('超管监管','只读真实数据，不出现代办按钮',['WORK-STATE'])],['查看不创建跟进或运行'],['PAGE-2227','PAGE-2226'],['GR-SCOPE','GR-PRIVACY','GR-AUTH','GR-DATA-FACTS'])
local('CUSTOMER-TIMELINE','客户档案业务跟进与联系档案分视图',[2033,2039],['AC-2130','AC-2131','AC-2132'],'客户档案切换业务跟进或联系档案、打开关联业务',['各来源本来有权读取，不因归集新增授权'],['PHONE','RECORD-ID'],['CONTENT-SNAPSHOT','CALLS','WORK-STATE'],[('同租户规范号码仅展示归集有权业务，不合并身份/编码/结果',['PHONE','OWNER-TENANT','RECORD-ID'],[]),('保原联系档案/独立呼入临时通话，业务followup按准确关联展示',['CONTENT-SNAPSHOT','CALLS'],[])],[('独立来电或临时通话无业务关联','显示有权联系历史，不猜挂某条业务',['CALLS']),('同号多业务','各自可打开有权记录及跟进，仍有独立run和联系策略',['RECORD-ID','RUN-ID'])],['档案归集不是第二套可变业务账本'],['PAGE-2203'],['GR-SCOPE','GR-PRIVACY','GR-DATA-FACTS'])
local('HANDLER-INBOX','实际接听人最小原段待填写入口',[2032,2033],['AC-2092','AC-2132'],'实际办理/接听人打开自己的准确待填跟进',['本租户本账号真实关联该已结束未提交人工段'],['FOLLOWUP-ID','ACTUAL-HANDLER'],['BASIS','FORM-VALUES','CONTENT-SNAPSHOT'],[('只列本人真实关联且未contentSaved原段，不要求整业务detail资格',['FOLLOWUP-ID','ACTUAL-HANDLER','CONTENT-SAVED'],[]),('读取本次必要定义和资料，按原分类表单提交，再沿正式保存规则校验',['BASIS','FORM-VALUES'],['CONTENT-SNAPSHOT'])],[('只是责任人/管理员/核对人','不取得代填权，保持原缺内容事实',['ACTUAL-HANDLER']),('本人有效关联且未保存','给最小表单，保存成功后移出待填写',['CONTENT-SAVED','FORM-VALUES'])],['无自动全档案权或其他业务查阅权'],['PAGE-2203','PAGE-2227'],['GR-AUTH','GR-PRIVACY','GR-SCOPE','GR-DATA-FACTS'])
local('REVIEW','核对同次未知请求',[2032,2038],['AC-2122'],'从待核列表打开准确requestId',['仅原本可核人员或被明确移交的本租户核对人'],['REQUEST-ID','REQUEST-STATUS'],['REQUEST-STATUS','WORK-STATE'],[('读取准确原请求实际状态及最小可见结果，unknown不当成功/失败',['REQUEST-ID'],['REQUEST-STATUS']),('明确原已执行或未执行后只改变确认表达，不重办原动作',['REQUEST-STATUS'],['REQUEST-STATUS','WORK-STATE'])],[('仍unknown','继续待核并保同身份，不释放占用或新request重发',['REQUEST-ID','WORK-STATE']),('确认先前已成功','返回原一次结果，不再建followup、转交或删模板',['REQUEST-STATUS']),('核对人缺原业务权限','只见最小请求，不授数据详情或原动作重放',['REQUEST-ID'])],['核对不是业务代办或人工结果代填'],['PAGE-2204','PAGE-2227','PAGE-2228','PAGE-2006'],['GR-UNKNOWN','GR-AUTH','GR-PRIVACY','GR-DATA-FACTS'])
local('HANDOFF','管理员移交准确请求核对责任',[2032],['AC-2122'],'对准确未知request选择本租户核对人并说明原因',['当前owner租户有权管理员及该request存在本租户待核'],['REQUEST-ID','REVIEW-ASSIGNEE','REASON'],['REVIEW-ASSIGNEE','REQUEST-STATUS'],[('明确唯一请求和本租户有效账号，不按记录模糊移交所有权限',['REQUEST-ID','REVIEW-ASSIGNEE'],[]),('保存本次移交人/接收人/原因/时间，接收人只核该request',['REASON','REVIEW-ASSIGNEE'],['REVIEW-ASSIGNEE'])],[('请求不唯一、失效或人员无效','拒并保选择，不扩大原权限',['REQUEST-ID','REVIEW-ASSIGNEE']),('明确移交','myReviewWork可定位准确事项，不能读整档案、重放原操作、代填',['REVIEW-ASSIGNEE'])],['不改变原业务owner和责任跟进人'],['PAGE-2227'],['GR-AUTH','GR-SCOPE','GR-PRIVACY','GR-UNKNOWN'])
local('CONTACT-POLICY','维护本租户同号联系协调',[2031,2039],['AC-2121','AC-2122'],'管理员从导入与分配维护联系协调设置',['仅当前实际租户管理员维护'],['CONTACT-INTERVAL','CONTACT-DAILY-LIMIT','CATEGORY-PRIORITY'],['CONTACT-POLICY'],[('校0禁用额外频控、有效范围和分类优先唯一',['CONTACT-INTERVAL','CONTACT-DAILY-LIMIT','CATEGORY-PRIORITY'],['CONTACT-POLICY']),('起呼按完整规范号、准确原专业及本账本事实协调占用与频次',['PHONE','CALLS','CONTACT-POLICY'],[])],[('已在途/排队/重试/unknown或频次/高优先条件不允','阻新呼叫并给原因及可核最早时间，不自动续拨',['CONTACT-POLICY','WORK-STATE']),('明确终止且事实完整/策略允许','仅解除原占用，人员仍须明确发起',['EXECUTION-STATE','CONTACT-POLICY'])],['不靠掩码猜号码，不因维护策略放松公共拒联或供应商边界'],['PAGE-2204'],['GR-CONTACT','GR-SERIAL','GR-AUTH','GR-DATA-FACTS'])
# Atomic current fields used by the shared identity, save and END behavior.
field('ACTUAL-ANSWER','预外呼实际接听账号','Followup','actualAnswerAccountId','string','本租户实际接听坐席准确映射账号，未知为空','只有准确接听回执/本人关联可确定；管理员、责任人、核对人不能指定代填人；与客户接通事实独立',True,'PREDICTIVE存在真实人工接听时必需',None,BUS,SYS)
field('FOLLOWUP-SUMMARY','本次跟进摘要','FollowupResult','summary','string','可选文本；当前来源未另定长度限制','实际办理人保存时与原段内容同次封存；系统摘要明确区分真实归档/零拨异常，不能据摘要推断拨打或成功',True,'有人工摘要时提供；省略使用明确保存提示',{'kind':'derived','value':None,'rule':'人工省略摘要使用本次跟进内容已保存；系统按真实终态/零拨事实给说明'},BUS,HANDLER+SYS)
field('OUTCOME-LABEL','结束结论文案','FlowNode','outcomeLabel','string','非空1～80字','绑定所选END outcomeCode显示；文案不覆盖独立统计编码，不以流程结束推业务成功',False,'END保存时明确或由所选编码给默认文案',{'kind':'derived','value':None,'rule':'新增或未填文案按明确所选结论编码取对应显示名'},CFG+BUS,CFG)
field('VALUE-SOURCES','当前有效值来源','BusinessRecord','currentValueSources','object','按稳定字段身份记录FOLLOWUP/CORRECTION/RECLASSIFY及准确发生身份和时间','仅当前仍匹配owner/stage/run的provided保存更新；更正留correctionId，转类留changeId；与当前值同次生效，支撑差异确认',False,'当前有效值首次产生或明确维护时追加/更新',{'kind':'literal','value':{},'rule':'导入初始化尚无人填写/更正来源，不造人工确认'},BUS,SYS)
field('FILE-PENDING','当前文件读取中','ImportDraft','fileReadPending','boolean','true/false','与当前fileReadVersion同属一个窗口和身份；true时检查与导入均不可操作，旧请求失败不清新请求pending',False,'文件读取窗口打开时提供',{'kind':'literal','value':False,'rule':'尚未选择读取文件时没有在途读取'},ADMIN,SYS,'transient','只在当前窗口读取期间更新；切换文本/分类/样例或关窗使原请求作废')
field('INTENDED-STORE-NAME','客户原意向门店名称','BusinessRecordCurrentImport','intentionStoreName','string','可选原始显示名称；不能作为租户定位键','总部下发时编码/名称都缺才视为无意向；只有名称无准确编码须待核，不按同名猜配；门店上交按本品牌唯一有效总部',True,'有原始名称资料时提供；没有不猜生成',None,BUS,ADMIN)
local('INTERFACE-QUERY','实际办理人按原段表单查询并选择接口结果',[2032],['AC-2092'],'实际拨打/接听人从准确原段填写表单查询或选择接口结果',['本租户本账号有该准确原段待填写资格；不要求品牌字段/分类配置管理权','原段已结束尚未contentSaved，所需接口在原段basis中允许显示','当前本租户获该接口独立取数授权，能力启用且必要上游值准确可核'],['FOLLOWUP-ID','ACTUAL-HANDLER','ACTUAL-ANSWER','BASIS','FORM-VALUES']+iface,['FORM-VALUES'],[('从本次basis读取接口定义及选中方式，不把保存时的新分类字段拼入原表单',['BASIS','FIELD-ID']+iface,[]),('独立查询不带依赖；关联查询读取唯一上游字段明确属性并逐参数映射，按本租户能力授权查询',iface+['FORM-VALUES'],[]),('本人明确选择合法单/多选返回对象，仅更新原段草稿；正式内容另按SAVE-CONTENT确认',['SELECTION-MODE','FORM-VALUES'],['FORM-VALUES'])],[('只有管理员/责任人身份但不是该原段实际办理/接听人','拒取该段表单，不能借配置权代填',['ACTUAL-HANDLER','ACTUAL-ANSWER','FOLLOWUP-ID']),('接口未获本租户取数授权/已停用、上游缺值或参数映射不明','保草稿并明确字段/能力/参数原因，不取首项、不跨租户补结果',iface+['FORM-VALUES']),('实际本人无字段配置权但原段及能力取数资格均满足','允许本次查询与明确选择，仍不能修改接口定义或分类',['FORM-VALUES','BASIS']),('查询及选择成功','只写草稿，不生成正式确认、当前有效值或流转证据',['FORM-VALUES','CONTENT-SNAPSHOT','ROUTING-FIELD-SNAPSHOT'])],['返回对象保准确属性与来源，接口结果草稿不参加流转；正式保存沿原段定义、本人权限及差异确认校验'],['PAGE-2227','PAGE-2203'],['GR-FIELDS','GR-SCOPE','GR-AUTH','GR-PRIVACY','GR-DATA-FACTS','GR-UNKNOWN'])

# Add exact atomic participation to existing action boundaries, then calculate unions.
additional={
 'ACTUAL-ANSWER':['CALL-FACTS','SAVE-CONTENT','ARCHIVE','DETAIL','CUSTOMER-TIMELINE','HANDLER-INBOX'],
 'FOLLOWUP-SUMMARY':['SAVE-CONTENT','ARCHIVE','DETAIL','CUSTOMER-TIMELINE','HANDLER-INBOX'],
 'OUTCOME-LABEL':['TEMPLATE-CREATE','TEMPLATE-EDIT','TEMPLATE-READ','ROUTE-BIND','ADVANCE','DETAIL'],
 'VALUE-SOURCES':['START','SAVE-CONTENT','CORRECT','RECLASSIFY','DETAIL'],
 'FILE-PENDING':['IMPORT-MAP','IMPORT-PREVIEW','IMPORT-COMMIT'],
 'INTENDED-STORE-NAME':['IMPORT-PREVIEW','IMPORT-COMMIT','EVALUATE','TRANSFER','CORRECT','DETAIL']
}
for key,suffixes in additional.items():
 for row in L:
  if row['id'] in ['LOCAL-FLOW-'+suffix for suffix in suffixes]:
   row['inputs'].append(fid(key));row['inputs']=sorted(set(row['inputs']));row['field_ids']=sorted(set(row['field_ids'])|{fid(key)})
# The identifiers below have an observable generated or computed origin, not user input.
system_fields={'BRAND-ID','FIELD-ID','OPTION-ID','CATEGORY-ID','CATEGORY-REVISION','TEMPLATE-ID','TEMPLATE-REVISION','NODE-ID','NODE-TYPE','EDGE-ID','BRANCH-PRIORITY','ROUTE-VERSION','BATCH-ID','RECORD-ID','OWNER-TENANT','RECORD-REVISION','UPDATED-AT','RUN-ID','ENTRY-DECISION','NODE-RUN-ID','STAGE-ID','STAGE-TRANSFER','DEPARTURE-SNAPSHOT','FOLLOWUP-ID','ACTOR','ACTUAL-HANDLER','CONFIRMED-FIELDS','CONTENT-SAVED','ARCHIVE-STATE','ARCHIVED','ROUTING-FIELD-SNAPSHOT','ATTEMPT-ID','VALUE-SOURCES','REQUEST-ID','REQUEST-STATUS','FILE-READ','FILE-PENDING'}
external_fields={'ACTUAL-ANSWER','HUMAN-ANSWER','PROVIDER-CALL-ID','CALL-STATE','DIALED','DIALED-AT','CUSTOMER-ANSWERED','RETRIES-COMPLETE','EXECUTION-STATE','ROUTING-EVIDENCE','TAG-EVIDENCE','EVENT-ID'}
computed_fields={'EFFECTIVE-PLAN','IMPORT-PREVIEW','IMPORT-TOKEN','SCENE-SNAPSHOT','RESOURCE-SNAPSHOT','BASIS','VALUE-CONFLICT','EVALUATION','EVALUATION-TOKEN','DESTINATION','RESOLUTION-TOKEN','OUTCOME','RECLASSIFY-TOKEN','WORK-STATE','STATISTICS'}
for row in F:
 key=row['id'].removeprefix('FIELD-FLOW-')
 if key in system_fields:row['derivation']['kind']='system'
 if key in external_fields:row['derivation']['kind']='external'
 if key in computed_fields:row['derivation']['kind']='calculated'

# Current list/detail summaries are real readable business fields.
summary_fields=['BRAND-ID','BUSINESS-CODE','CUSTOMER-NAME','PHONE','CATEGORY-ID','FOLLOWER','OWNER-TENANT','BATCH-ID','RUN-ID','NODE-ID','METHOD','UPDATED-AT']
for row in L:
 if row['id'] in ['LOCAL-FLOW-QUERY','LOCAL-FLOW-DETAIL','LOCAL-FLOW-BATCH-READ','LOCAL-FLOW-CUSTOMER-TIMELINE']:
  row['outputs']=sorted(set(row['outputs'])|{fid(x) for x in summary_fields})
  row['steps'][0]['reads']=sorted(set(row['steps'][0]['reads'])|{fid(x) for x in summary_fields})
  row['field_ids']=sorted(set(row['inputs']+row['outputs']+[x for step in row['steps'] for x in step['reads']+step['writes']]+[x for branch in row['branches'] for x in branch['field_ids']]))
from business_field_details import enrich_fields
enrich_fields(F)

# Check references for every field are derived from actual behavior usage, never arbitrary.
by={x['id']:x for x in F}
for l in L:
 for i in l['field_ids']:
  if i not in by:raise ValueError('undefined '+i)
  by[i]['test_refs']=sorted(set(by[i]['test_refs']+l['test_refs']))
# Preconfigured values participate in formal form, correction and timeline actions.
for x in F:
 if x['entity']=='CurrentFollowupValues':
  for l in L:
   if l['id'] in ['LOCAL-FLOW-SAVE-CONTENT','LOCAL-FLOW-CORRECT','LOCAL-FLOW-CUSTOMER-TIMELINE']:
    l['field_ids'].append(x['id']);l['field_ids']=sorted(set(l['field_ids']));l['inputs'].append(x['id']);l['inputs']=sorted(set(l['inputs']));x['test_refs']=sorted(set(x['test_refs']+l['test_refs']))
for x in F:
 if not x['test_refs']:raise ValueError('unused field '+x['id'])
# More precise page surfaces do not make hidden fields into visible form inputs.
P['PAGE-2204']['origin_field_groups']=['FLD-016','FLD-017','FLD-018','FLD-019','FLD-020']
P['PAGE-2228']['origin_field_groups']=['FLD-021','FLD-022','FLD-023','FLD-024']
# Category page and two library views retain current source IDs; page aliases root-owned.
for pid,mp in P.items():
 mp['local_ids']=sorted(set(mp['local_ids']));mp['test_refs']=sorted(set(mp['test_refs']));mp['field_ids']=sorted({f for row in L if row['id'] in mp['local_ids'] for f in row['field_ids']})
 mp['mapping_scope']='related_business_fields'
 mp['visibility_note']='field_ids是本页动作涉及的业务字段并集，包含快照/状态/确认依据等隐藏读写字段，不表示都应出现在表单。UI仅把实际呈现字段加入field_presentations；身份令牌、内部修订和完整事实对象通过相应操作使用。'

sup=[
 {'id':'SUP-FLOW-NODES','old':'添加空白节点后逐次选择类型/职责/多种方式','current':'唯一START锚点；组件确定TRANSFER/CALL/END，每CALL仅一种方式','evidence_refs':['docs/decisions.md#四节点改造本轮交付记录','docs/四节点与客户跟进闭环需求记录.md#2']},
 {'id':'SUP-FLOW-ASSIGN','old':'分配坐席、选择AI/预外呼任务或在分配时选择方式','current':'仅分配责任跟进人及必要AI场景；方式固定于当前CALL，真实执行人另记','evidence_refs':['docs/四节点与客户跟进闭环需求记录.md#6','docs/decisions.md#step-24']},
 {'id':'SUP-FLOW-ROUTES','old':'多条条件同时符合时人工任意选择；普通节点必须ELSE','current':'当前新方案所有有出口节点必须有且仅有一个末位ELSE，前序IF/ELSEIF按优先级首命中；ELSE不带条件，未知事实继续PENDING且不得进入后续或兜底。','evidence_refs':['docs/decisions.md#普通节点默认路径可选','js/components/flow-routing.js#evaluate']},
 {'id':'SUP-FLOW-REFERENCE','old':'模板字段参考分类必须等于实际业务分类','current':'参考只编排字段；实际分类独立路由绑定同品牌兼容模板，运行按目标目录捕获','evidence_refs':['docs/decisions.md#字段参考分类与应用关系']},
 {'id':'SUP-FLOW-IMPORT','old':'按原逐行受理/失败结果导入，不把确认范围改全批回滚','current':'正式提交范围所有行均通过才同次创建；有错保名单重检，不静默过滤失败行','evidence_refs':['docs/四节点与客户跟进闭环需求记录.md#6.1','scripts/four-node-model.js#importRecords']},
 {'id':'SUP-FLOW-HISTORY','old':'保旧模板归档索引、旧schema回退和旧记录result.values兼容','current':'无旧规划迁移/模板适配；未来本版run/内容/实际场景/转出截止事实照常封存','evidence_refs':['docs/decisions.md#用户更正：规划功能无旧历史负担','docs/decisions.md#step-24']},
 {'id':'SUP-FLOW-FIELD-CONFIRM','old':'只有本次provided才有值，或SYSTEM继承result可直接作本节点填写依据','current':'正式人填区分modified与confirmed；basis已知预填可确认，absent和SYSTEM不造新确认','evidence_refs':['docs/decisions.md#业务产品链审计规则细化']},
 {'id':'SUP-FLOW-TAG-FACTS','old':'AI标签事实只要属于运行catalog即可，场景可不核下游依赖','current':'依赖按冻结plan，实际事实按执行段所选sceneSnapshot；所有提供tags核准确上下文与版本','evidence_refs':['scripts/four-node-model.js#fourCheckTagEvidence','js/adapters/four-node-execution.js#choices','docs/decisions.md#step-24']},
 {'id':'SUP-FLOW-VALUES','old':'只有单值比较或只支持部分类型IN，START与普通解析不同','current':'统一每行多值IN/NOT_IN与类型规范化，EQ/NE/大小比较仍单值，空值及unknown独立','evidence_refs':['docs/decisions.md#多值比较']},
 {'id':'SUP-FLOW-PREVIEW','old':'空名单预录即红报错；演示数据仿佛保证能通过','current':'名单依赖中性说明，实际行具体给节点/字段/条件；格式示例不猜业务分流值','evidence_refs':['docs/decisions.md#step-27','scripts/four-node-model.js#fourThrowRouteFailure']}
]
questions=[
 {'id':'ENG-FLOW-PERSISTENCE','question':'生产业务/运行/跟进/通话/请求的物理模型、事务与唯一约束如何映射当前产品字段及同次结果？','blocking':True,'owner':'development','engineering_category':'data','classification_reason':'产品已明确何时保存、唯一性和并发效果；数据库结构及事务实施是工程映射','source_refs':['docs/field-alignment.json#FIELD-FLOW-RECORD-ID']},
 {'id':'ENG-FLOW-EXECUTION','question':'真实AI/预外呼/人工执行的请求ID、供应商callId、事件身份与最终重试收敛怎样准确关联？','blocking':True,'owner':'development','engineering_category':'api','classification_reason':'产品已规定受理/真实通话/终态/未知分层及失败关闭，供应商字段和认证接入需真实工程契约','source_refs':['documentation/input/functions.json#FUNC-2031','documentation/input/functions.json#FUNC-2032']},
 {'id':'ENG-FLOW-SCENE','question':'AI场景与supplier/tenant/type/tagScene/category/brand/revision的最小只读投影由哪个生产服务提供？','blocking':True,'owner':'development','engineering_category':'backend','classification_reason':'产品已明确使用场景不要求标签维护权及数据最小范围，服务职责和投影实现待工程选择','source_refs':['docs/field-alignment.json#FIELD-FLOW-SCENE-SNAPSHOT']},
 {'id':'ENG-FLOW-CHECKS','question':'将本产品CHECK与真实CTI、回调、文件、同号并发及幂等测试环境和CI如何对接？','blocking':True,'owner':'development','engineering_category':'verification','classification_reason':'可观察业务预期已给出，真实环境命令与自动化执行方式属于工程验证准备','source_refs':['documentation/input/functions.json#FUNC-2036']}
]
source=[{'path':'docs/decisions.md','supports':'最新用户决定及step13-27覆盖旧条款，尤其字段参考、无历史、配置待核、人工确认/AI事实和导入提示'}, {'path':'docs/四节点与客户跟进闭环需求记录.md','supports':'四节点、导入分配、运行与跟进、转交和统计完整产品关系；冲突处最新decisions优先'}, {'path':'scripts/four-node-model.js','supports':'当前单模型状态/准入/保存/来源及真实参数上限'}, {'path':'scripts/field-import-store.js','supports':'IMPORT系统字段与稳定业务编码映射、别名一致和typed规范化'}, {'path':'scripts/field_model_build.py','supports':'品牌与用途、字段与选项引用锁、分类双字段与依赖规则'}, {'path':'scripts/multiple_values_ui_build.py','supports':'当前多值填写、普通/START共享parser和当前说明'}, {'path':'js/components/flow-routing.js','supports':'有序首命中、UNKNOWN保守暂停、稳定来源、NOT_IN空值语义和明确确认快照'}, {'path':'js/adapters/four-node-workspace.js','supports':'实际列表队列/最小表单/映射/文件竞态/用户提交与反馈'}, {'path':'docs/role-permissions.md','supports':'五角色、坐席能力非角色、AI场景使用与标签维护分权'}]
# Reproducible business fixtures supplement independent action checks without commands.
check_cases={
 'ROUTE-BIND':('在同品牌创建参考分类A与实际分类B，共享稳定IMPORT-F1；模板只用F1条件。先将B仅配置同名不同ID的F2，再改为启用F1；保存时另窗口改B基础后用旧依据提交。','仅同名F2时具体报缺F1；启用F1并满足所用类型/选项/AI上下文后允许绑定，参考A不阻B；并发变化保选择阻覆盖；绑定不改BASE。'),
 'IMPORT-PREVIEW':('模板首分流使用IMPORT sc=1且无适用其他路径。先不输入名单，再填一行系统必需数据完整但sc为空，再填真实sc=1。另构造两行一成一败，并在通过预检后改sc重提。','空名单给中性所需字段提示；实际空sc行给准确路径/字段诊断，不自动落ELSE；sc=1行按准确首呼方式预检；一败则整个正式提交不可用；改值后旧token拒绝。'),
 'IMPORT-COMMIT':('以全部通过的两行名单确认导入后立即更换分类路由，再查看尚未实际拨打记录；同request重放一次。','只建一次批次及两条record/run；导入时即冻结各自完整plan，未拨打记录仍保持原plan；同request读原结果，不重复创建。'),
 'ASSIGN':('当前CALL先AI后另建MANUAL记录；AI选择非坐席合法责任人及明确场景；MANUAL候选中加入无电话资格账号。','AI责任人不强制坐席；MANUAL无资格候选拒绝；安排只写责任/场景，不改方式、owner或产生通话。'),
 'START':('责任人A已安排；有权管理员B用本人唯一合法人工坐席发起；先观察仅accepted无拨打，再收到真实dial。','followupAccountId仍A、actor和实际MANUAL assignedAccountId为B；accepted时calls不伪造；真实dial才增加尝试与拨打计数。'),
 'SAVE-CONTENT':('开始basis已有F1=A、F2缺失；原段表单预填F1不修改。期间管理员将当前F1更正B；本人提交本次值C，不带确认、带旧revision新开表单、再经三方差异取当前值/来源token分别提交。','本人正式保存可confirmed既有F1而modified仍只含实际provided；F2控件默认空不造确认；未确认覆盖及仅换revision均拒绝保草稿；准确确认后只同run/stage/owner的provided更新current，旧快照不改。'),
 'ARCHIVE':('AI节点出边只用状态，下游转交另用本AI标签。首通结束但重试尚未收敛、随后重试结束而标签PENDING、再提供与实际sceneSnapshot一致NONE；另做零拨启动失败。','前两状态不得归档完成；准确NONE可满足明确无标签事实，不造人工字段确认；零拨异常可封档而completedFollowup与dials不增加。'),
 'EVALUATE':('文本IMPORT字段设IN，按两行001与002保存；分别用001、字面001,002、已知空和缺失数据判断。另设先IF后IF/ELSE，第一条PENDING第二条真；组内ANY已真但另一项PENDING。最后以新run CURRENT_NODE与显式HISTORY分别取旧段。','001命中；字面001,002不是两值；空只由空判断处理；缺失PENDING不反向命中NOT_IN；高优先/组内PENDING均阻后续默认；CURRENT_NODE不借旧run，HISTORY仅准确本租户历史及配置引用可核时可读。'),
 'TRANSFER':('总部有意向编码001唯一映射门店A时尝试指定B；仅名称无编码时尝试当无意向；编码名称皆无由总部管理员选A；门店A反向上交。','编码锚定不许改B；只有名称必须待核；真正无意向可合法同次补选；门店上交仅本品牌唯一有效总部。成功封本方截止、切owner/stage、清人/安排，不起呼；任何失败不改owner。'),
 'DETAIL':('总部向门店成功转交后，门店更正字段并选私有AI场景；分别以原总部、门店、超管和仅有原段待填权实际接听人读取详情与辅助timeline/runContext。','总部只见本方截止；门店按当前业务资格；超管管理范围只读；最小待填人不能用辅助接口取整档案或门店后续私有资料。'),
 'REOPEN':('业务正式导入但从未拨打时改绑定并尝试重开；然后原run明确结束/废弃完成后再以FOLLOWUP开新run。','未拨打也已ACTIVE，禁止运行中重开/重写原plan；完成后新run用最新明确配置，原run/跟进/通话快照不改，责任/场景重新核。'),
 'QUERY':('准备更新时间为10:00、12:00、11:00的三条有权业务和一条无权业务；每页两条，查询后重复打开详情。','过滤后先按12:00、11:00、10:00倒序再分页；无权行不计入可见集；只读不改变时间，分支/字段业务顺序不被排序规则打乱。')
}
for row in C:
 key=row['id'].removeprefix('CHECK-FLOW-')
 if key in check_cases:
  procedure,expected=check_cases[key];row['procedure']+='。具体复现：'+procedure;row['expected']+='。该例预期：'+expected

for row in C:
 if row['id']=='CHECK-FLOW-CATEGORY-CREATE':
  row['acceptance_ids']=sorted(set(row['acceptance_ids'])|{'AC-2040','AC-2102'})
  row['procedure']+='。权限与能力复现：品牌A配置管理员新建自定义LEAD分类后，读取品牌B配置、同品牌另租户业务/录音；在本租户尚无AI使用资格、未授权接口能力或无本人电话资源时尝试取数/起呼。'
  row['expected']+='。分类可合法新建不代表新供应商类型/机器人/线路/电话能力已经产生；缺专业授权/资源仍拒绝；品牌B配置拒绝，同品牌共享配置不开放其他租户业务或录音。'
 if row['id']=='CHECK-FLOW-EVALUATE':
  row['acceptance_ids']=sorted(set(row['acceptance_ids'])|{'AC-2105'})
  row['procedure']+='。字段来源复现：同品牌建立同名IMPORT-F1与FOLLOWUP-F2，分别保存不同值；条件逐个引用其稳定ID，再构造只剩同名F3及另一AI上下文同名标签的情况。'
  row['expected']+='。IMPORT-F1按导入来源独立读取且不要求呼叫方式；FOLLOWUP-F2仅按准确已确认填写来源；同名F3/另一AI标签不替代，保待核或配置错误；不存在全分类单一标签来源或首字段默认。'

# Normalize feature bounds with relevant local titles so no standalone action is hidden.
for feature in features:
 feature['bounds']['included_scope']=[row['title'] for row in L if feature['id'] in row['feature_ids']]
featureids=set(coord['domain_b']);assert {x['id'] for x in features}==featureids
assert len({(x['entity'],x['key']) for x in F})==len(F)
checks={x['id'] for x in C}
assert all(set(x['test_refs'])<=checks for x in F+L)
fragment={'schema':'product-business-fragment@1','version':'2.0.0-current','features':features,'acceptance_updates':[{'id':id,'statement':statement,'source_refs':['docs/functional-spec.json#'+id],'decision_refs':['docs/decisions.md']} for id,statement in updates.items()],'locals':L,'fields':F,'checks':C,'page_mappings':P,'supersessions':sup,'engineering_questions':questions,'source_evidence':source,'business_open_questions':[],'review_notes':['只以当前四节点及最新决定为准，无旧模板/数据兼容；未来运行/跟进/通话快照不是迁移负担','当前逻辑全部产品行为有来源；外部真实接口和CTI结果仍是工程契约与验收缺口，不声明生产已验证','自定义字段值以元定义约束，不能为每个用户建的示例字段创造产品永久字段；预置统计字段另明确实际业务口径','参与分流字段不等于每列全局必填：按实际路径资料判断，缺依据/全不匹配仍不可导入']}
from direct_followup_delta import apply_business, apply_cycle_delta
fragment=apply_cycle_delta(apply_business(fragment))
(O/'business.json').write_text(json.dumps(fragment,ensure_ascii=False,indent=2)+'\n')
print('business',len(fragment['features']),'features',len(fragment['acceptance_updates']),'AC updates',len(fragment['locals']),'locals',len(fragment['fields']),'fields',len(fragment['checks']),'checks',len(fragment['page_mappings']),'pages')
