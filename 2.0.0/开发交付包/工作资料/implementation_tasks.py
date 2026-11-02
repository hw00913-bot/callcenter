"""Authored business work packages; repository/stack binding remains developer-owned.

The group definitions below are product judgments. This script only joins stable
IDs, preserves acceptance text and verifies coverage/dependencies. It never
chooses a production stack, writes prototype code or grants execution authority.
"""
from pathlib import Path
import json, copy, hashlib, datetime, collections, sys

ROOT=Path(__file__).resolve().parent
WS=ROOT/'规划工作区'
OUT=ROOT.parent/'当前交接包'
def read(p):return json.loads(Path(p).read_text())
def write(p,x):
    p=Path(p);p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def md(p,s):
    p=Path(p);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(s.rstrip()+'\n')
def unique(xs):return list(dict.fromkeys(xs))
def tid(n):return f'TASK-{n:03}'
GROUPS=[]
def add(n,title,flow='',plat='',deps=(),phase='业务闭环',deliverables=(),risks=(),refs=(),questions=()):
    ids=['LOCAL-FLOW-'+v for v in flow.split()]+['LOCAL-PLAT-'+v for v in plat.split()]
    GROUPS.append(dict(id=tid(n),title=title,local_ids=ids,depends_on=[tid(v) for v in deps],phase=phase,
                       deliverables=list(deliverables),risks=list(risks),prototype_reference_files=list(refs),engineering_question_ids=list(questions)))

add(1,'统一登录与合法入口',plat='LOGIN',phase='身份与组织',
    deliverables=['认证后按真实成员授权解析单租户直达、多租户选择及合法平台范围。','首次及恢复入口按现有意图选有权页面；无范围、读取失败、退出失效分别表达。'],
    risks=['同名或同手机号不能合并账号；角色不得由前端自选。'],refs=['js/components/login-screen.js','js/components/organization-store.js'],questions=['EQ-PLAT-IDENTITY'])
add(2,'导航、上下文切换与退出保护',plat='NAVIGATE CONTEXT-SWITCH LOGOUT',deps=[1],phase='身份与组织',
    deliverables=['五区导航与菜单/操作/数据范围分别判权，恢复位置按账号和租户隔离。','切租户、退出、进入不同电话现场时分别处理通话、必要话后和未保存普通草稿。'],
    risks=['查看他人坐席状态不代表本人在线；保存失败不能继续切离。'],refs=['js/app.js','js/components/module-host.js','js/components/organization-store.js'],questions=['EQ-PLAT-IDENTITY','EQ-PLAT-PHONE'])
add(3,'品牌档案和关联租户查询',plat='BRAND-QUERY BRAND-SAVE BRAND-TENANTS',deps=[1],phase='身份与组织',
    deliverables=['维护准确品牌身份并按实际管理权查看关联租户。','唯一总部、多独立门店与品牌配置共享边界明确。'],risks=['品牌关系不授跨租户客户/通话/报表权。'],refs=['js/components/organization-store.js'],questions=['EQ-PLAT-IDENTITY'])
add(4,'租户资料与品牌身份同次保存',plat='TENANT-SAVE TENANT-BIND',deps=[3],phase='身份与组织',
    deliverables=['创建业务租户与品牌/HQ-STORE关联同次落地，可查询和重新打开。','普通基本资料修改与品牌/身份/企业绑定的维护权限分开；引用后身份保护。'],risks=['失败无孤立租户，未知核同次请求；不按门店名称猜稳定编码。'],refs=['js/components/organization-store.js'],questions=['EQ-PLAT-IDENTITY'])
add(5,'模块开通、账号和成员授权',plat='TENANT-MODULE ACCOUNT-CREATE ACCOUNT-LINK ACCOUNT-PROFILE MEMBER-GRANT ACCOUNT-QUERY',deps=[4],phase='身份与组织',
    deliverables=['AI和Cloud模块分别开通，账号全局主体与租户成员关系分开。','新建、显式关联已有账号、全局资料修改、本租户角色/模块授权分别落实原权限。'],risks=['坐席是电话能力而非第六个生产角色；不得借配置权授业务数据权。'],refs=['js/components/organization-store.js','js/components/role-permissions.js'],questions=['EQ-PLAT-IDENTITY'])
add(6,'人员停用与有限话后收尾',plat='MEMBER-STOP ACCOUNT-STOP LIMITED-FINISH',deps=[5],phase='身份与组织',
    deliverables=['本租户停用与全局账号停用范围分开，禁止新增操作。','仅允许停用时已有真实通话及必要话后有限收尾；租户任务不自动转交。'],risks=['不把已有后台任务继续等同被停用者可继续操作。','内容已保存但电话退出失败/未知时保留受限上下文，仅允许合法退出重试，不恢复普通办理权。'],refs=['js/components/organization-store.js','js/components/module-host.js','js/adapters/cloud.js'],questions=['EQ-PLAT-IDENTITY','EQ-PLAT-PHONE'])
add(7,'账号与租户引用保护删除',plat='ACCOUNT-DELETE TENANT-DELETE',deps=[5],phase='身份与组织',
    deliverables=['仅在当前权限、准确对象、全部必要业务引用均可核时删除。','多租户账号、默认管理组和既有任务/通话/财务引用保持保护。'],risks=['必要审计本身不虚构成禁止删除的业务引用；HTTP200不等于已删除。'],refs=['js/components/organization-store.js'],questions=['EQ-PLAT-DELETE'])
add(8,'品牌导入/填写字段库与稳定选项',flow='FIELD-CREATE FIELD-EDIT FIELD-STATUS FIELD-DELETE',deps=[3,5],phase='配置与导入',
    deliverables=['两种用途独立存储与引用，同名不合并；IMPORT业务编码必填。','字段及选项的编辑、启停、删除按当前与快照引用保护；不增加格式配置。'],risks=['品牌/用途/类型/编码和已有稳定选项不能通过改名换义；未启用项不能新选。'],refs=['scripts/field_model_build.py','scripts/field_ui_build.py'],questions=['ENG-FLOW-PERSISTENCE'])
add(9,'分类双Tab、业务域和直接跟进开关',flow='CATEGORY-CREATE CATEGORY-EDIT',deps=[8],phase='配置与导入',
    deliverables=['分类独立配置导入/填写字段、顺序、启用与入口必填。','业务域与办理模式分开；allowDirectFollowup仅显式true开放，缺省关闭；保存不更改实际路由绑定。'],risks=['关闭开关禁止新增直接办理，已受理执行和本人必要归档仍能收尾。'],refs=['scripts/direct_followup_build.py','scripts/business_family_build.py','scripts/field_model_build.py'],questions=['ENG-FLOW-PERSISTENCE'])
add(10,'接口填写字段定义与依赖配置',flow='INTERFACE-FIELD',plat='PRO-FIELD',deps=[8,9],phase='配置与导入',
    deliverables=['按准确字典能力配置单/多选、依赖字段与多参数来源；定义维护与本轮取数分权。','原专业字段视图引用同源定义；预览不保存客户值，不复制一套字段库。'],risks=['品牌共享不扩租户取数授权；依赖环、缺来源、字段引用失效应明确反馈。'],refs=['scripts/field_model_build.py','scripts/field_ui_build.py'],questions=['EQ-PLAT-PROFESSIONAL'])
add(11,'四节点参考模板维护',flow='TEMPLATE-CREATE TEMPLATE-EDIT TEMPLATE-READ TEMPLATE-DELETE',deps=[9],phase='配置与导入',
    deliverables=['开始、转交、呼叫、结束组件直接确定职责；字段参考分类只服务编排。','入口、优先级、条件和末位默认规则按现行规格保存；允许二次编辑和当前无绑定保护删除。'],risks=['不恢复空白节点或V1/V2选择；历史运行用自身快照，当前配置未知请求仍须保护。'],refs=['scripts/four-node-model.js','scripts/flow-canvas-ui.js','scripts/flow-node-config.js','scripts/template_lifecycle_build.py'],questions=['ENG-FLOW-PERSISTENCE'])
add(12,'实际分类独立绑定当前路由',flow='ROUTE-BIND',deps=[11],phase='配置与导入',
    deliverables=['在业务分类独立路由入口选一个同品牌兼容模板，准确核用到的字段/选项/AI上下文。','新运行消费当前明确配置，已开始运行保持封存方案；基础配置与路由互不覆盖。'],risks=['模板字段参考分类不能冒充实际绑定；DIRECT不得因为本能力存在而被要求绑定模板。'],refs=['scripts/four-node-model.js','scripts/flow-routing-store.js'],questions=['ENG-FLOW-SCENE'])
add(13,'文件读取、表头及显式列映射',flow='IMPORT-MAP',deps=[9],phase='配置与导入',
    deliverables=['CSV/TSV/XLSX读取与显式目标列/忽略列映射，保持稳定字段身份。','一目标一列，异步文件只允许最新窗口/账号/租户/请求序号结果落回；变化使预览失效。'],risks=['读取未完成不得检查或提交；不能把旧文件回调套到新分类或新模式。'],refs=['js/components/import-workbook.js','js/adapters/four-node-workspace.js'],questions=['ENG-FLOW-CHECKS'])
add(14,'DIRECT/TEMPLATE整批严格预检',flow='IMPORT-PREVIEW',deps=[12,13],phase='配置与导入',
    deliverables=['两模式均校系统必需、分类必填、类型/选项、映射及业务唯一性。','DIRECT仅略路由条件依赖，明确本批方式/AI场景；TEMPLATE重算首次分流、实际承接范围，不静默降级。'],risks=['依赖模板能力的实施完成不增加DIRECT运行时模板门槛；无模板DIRECT正例必须验收。'],refs=['scripts/four-node-model.js','js/adapters/four-node-workspace.js'],questions=['ENG-FLOW-PERSISTENCE','ENG-FLOW-SCENE'])
add(15,'确认导入、业务身份和批次证据',flow='IMPORT-COMMIT',deps=[14],phase='配置与导入',
    deliverables=['全部纳入行成功且确认依据与重算一致才提交；业务、来源、初始租户与批次一致保存。','DIRECT只建业务和直接周期；TEMPLATE才建封存运行及首节点；重复/冲突不覆盖原业务。'],risks=['超时未知沿同次请求核对，不能重导入复制业务或自动重开。'],refs=['scripts/four-node-model.js','scripts/current_planning_build.py'],questions=['ENG-FLOW-PERSISTENCE'])
add(16,'跟进人分配、同组批量及AI安排',flow='ASSIGN ASSIGN-BATCH AI-SCENE',deps=[15,32,49],phase='业务闭环',
    deliverables=['只安排当前负责租户的责任跟进人及必要本租户AI场景，保留原方式与归属。','同组批量分配逐条重核，整组提交失败不部分写；场景失效可在无执行占用时明确重选。'],risks=['不新增坐席/任务/线路选择；场景使用不要求标签维护权；分配不自动起呼。'],refs=['scripts/four-node-model.js','js/adapters/four-node-workspace.js','js/adapters/four-node-execution.js'],questions=['ENG-FLOW-SCENE'])
add(17,'直接跟进完成与再次跟进周期',flow='COMPLETE-DIRECT RESUME-DIRECT',deps=[21],phase='业务闭环',
    deliverables=['完成直接周期须明确结论且已真实归档，或NO_CALL并说明原因。','再次直接跟进明确下次方式/AI场景，建立独立周期并重分人；旧结论、通话和快照不重写。'],risks=['directCycle不是run；关闭分类权限后不能再开直接周期；完成与业务达成分开。'],refs=['scripts/four-node-model.js','js/adapters/four-node-workspace.js'],questions=['ENG-FLOW-PERSISTENCE'])
add(18,'明确单条及同组批量起呼',flow='START START-BATCH',deps=[16,31,39,42],phase='业务闭环',
    deliverables=['起呼时重核准确业务、负责方、周期/节点、前段归档、本人能力、资源/场景与联系限制。','每条新跟进捕获最新实际分类及有效值，批量AI/预外呼逐条反馈；受理不冒充真实拨打。'],risks=['同业务/同号在途、排队、重试或未知未收敛不得再次发起；不借新周期豁免。'],refs=['scripts/four-node-model.js','js/adapters/four-node-execution.js'],questions=['ENG-FLOW-EXECUTION','EQ-PLAT-PHONE'])
add(19,'准确通话回执、重试与AI标签事实',flow='CALL-FACTS',plat='AI-TAG-RESULT',deps=[18,33],phase='业务闭环',
    deliverables=['按请求/attempt/call/实际办理人和周期或run登记真实拨打、接通、结束、重试收敛；重复乱序不覆写事实。','AI标签只取实际场景快照映射；坐席接听不替代同call客户接通，矛盾明确终态保原事实待核。'],risks=['旧DIRECT回执不推进新run或改新值；跨attempt身份、未核human事实不能开放代填。'],refs=['scripts/four-node-model.js','js/adapters/four-node-execution.js'],questions=['ENG-FLOW-EXECUTION','ENG-FLOW-SCENE'])
add(20,'本人填写、独立取数和正式内容快照',flow='SAVE-CONTENT HANDLER-INBOX INTERFACE-QUERY',deps=[10,19],phase='业务闭环',
    deliverables=['实际拨打/接听人只填写准确原段，最小待填写入口不授整档权限。','取数需独立能力授权且只入本轮草稿；正式保存按本轮展示schema/当前值基准与CAS确认，保provided/confirmed区别。'],risks=['管理员/责任人不能代填；保存时不换schema、不吸未展示值；旧段补录不覆盖新归属当前值。'],refs=['scripts/four-node-model.js','js/adapters/four-node-workspace.js'],questions=['ENG-FLOW-PERSISTENCE','EQ-PLAT-PROFESSIONAL'])
add(21,'唯一跟进归档与统计事实',flow='ARCHIVE',deps=[19,20],phase='业务闭环',
    deliverables=['通话终态、全部重试、必要人内容及依赖证据可靠齐备才唯一归档。','纯AI/明确无人由系统记真实摘要；零拨失败不算完成跟进，统计按真实通话去重。'],risks=['已归档/重复回执不能重复封内容或计数；未知不补0，不伪人工确认。'],refs=['scripts/four-node-model.js'],questions=['ENG-FLOW-PERSISTENCE','ENG-FLOW-EXECUTION'])
add(22,'当前有效资料更正与并发确认',flow='CORRECT',deps=[15,20,21],phase='业务闭环',
    deliverables=['有权管理员带原因明确更正当前有效值，保前后值、操作者与来源。','旧段快照/原导入证据不可改，表单基准与当前值冲突时保输入并重新核对。'],risks=['业务关系与字段稳定身份不按名称重配；转出方不得修改接收方当前资料。'],refs=['scripts/four-node-model.js','js/adapters/four-node-workspace.js'],questions=['ENG-FLOW-PERSISTENCE'])
add(23,'有序条件判断与多值运算',flow='EVALUATE',deps=[12,21,22],phase='业务闭环',
    deliverables=['IMPORT独立、填写/通话/标签按准确来源范围取值；IN/NOT_IN集合、标量单值、多选any/all保持类型含义。','未知阻止较低优先级及默认；已知全不匹配留原节点，条件令牌绑定准确事实。'],risks=['不按同名、首字段或继承的SYSTEM旧值造匹配；DIRECT无模板判断入口。'],refs=['js/components/flow-routing.js','scripts/flow-routing-store.js','scripts/four-node-model.js'],questions=['ENG-FLOW-PERSISTENCE'])
add(24,'确认节点推进和END业务结论',flow='ADVANCE',deps=[23],phase='业务闭环',
    deliverables=['有权人确认同一合法边及当前依据后进入后继，不自动起呼或隐式转交。','CALL必须真实拨打及必要归档；END按配置封独立业务结论，不用运行结束冒充成交。'],risks=['旧确认/未归档/未知拒绝；进入TRANSFER节点不等于已经切换负责租户。'],refs=['scripts/four-node-model.js','js/adapters/four-node-workspace.js'],questions=['ENG-FLOW-PERSISTENCE'])
add(25,'合法总部与门店转交及截止可见性',flow='TRANSFER',deps=[23,24],phase='业务闭环',
    deliverables=['同品牌LEAD仅HQ↔STORE；意向编码唯一映射，编码/名称皆空时仅HQ管理员同次指定。','成功同次封本方截止、切归属/接续轮次并清旧安排；目标另行分配本租户人员/场景。'],risks=['不跨品牌/门店直转门店；未知先核实际归属，不重复转交；DIRECT不得借本任务绕过模式保护。'],refs=['scripts/four-node-model.js','js/adapters/four-node-workspace.js'],questions=['ENG-FLOW-PERSISTENCE'])
add(26,'废弃运行、再次跟进与归属纠偏',flow='ABANDON REOPEN',deps=[24,25,29],phase='业务闭环',
    deliverables=['废弃先收敛执行/待核与必要归档；原终态留存。','结束或废弃完成后按当前负责方和当前有效分类流程显式新run，重核入口/人员/场景，纠偏带原因。'],risks=['不回到初始导入租户，不复活旧回执；重复导入不能代替重开。'],refs=['scripts/four-node-model.js','js/adapters/four-node-workspace.js'],questions=['ENG-FLOW-PERSISTENCE','EQ-PLAT-ACCEPTED-CALL'])
add(27,'受控转冷和分类调整',flow='RECLASSIFY',deps=[26,14],phase='业务闭环',
    deliverables=['仅原运行结束/废弃且无未核执行后，同品牌线索域有权管理员显式转类。','目标当前字段逐项预检，只复用同稳定ID，保同record/统一编码/批次和旧分类运行。'],risks=['不按同名跨用途猜值，不清历史，目标缺资料须补齐确认。'],refs=['scripts/four-node-model.js','js/adapters/four-node-workspace.js'],questions=['ENG-FLOW-PERSISTENCE'])
add(28,'原直接业务显式启用当前流程',flow='ENABLE-TEMPLATE',deps=[12,17,21,29],phase='业务闭环',
    deliverables=['在同record上重新预检当前路由、实际入口、资料及AI场景；旧执行、重试、待核及必要归档必须收敛。','成功才建新run并封直接转换事件；不强制先完成直接周期，已完成周期结论保留。'],risks=['并发schema变化按稳定字段保输入并重检；不复制业务、不让旧DIRECT事实完成新CALL或留下双执行入口。'],refs=['scripts/four-node-model.js','js/adapters/four-node-workspace.js'],questions=['ENG-FLOW-PERSISTENCE','ENG-FLOW-EXECUTION'])
add(29,'未知请求核对与责任交接',flow='REVIEW HANDOFF',deps=[5,15],phase='业务闭环',
    deliverables=['保持同一request身份核对导入/分配/起呼/启用/转交等未知结果；不另造副作用重放。','移交的是核对事项责任，原动作权限、业务归属和实际填写人不随之授予。'],risks=['查询权不等于重放权；未知不能判未发生或假成功。'],refs=['scripts/four-node-model.js','scripts/template_lifecycle_build.py'],questions=['ENG-FLOW-PERSISTENCE','EQ-PLAT-REMOTE'])
add(30,'统一业务队列、批次、详情与联系时间线',flow='QUERY BATCH-READ DETAIL CUSTOMER-TIMELINE',deps=[15,17,21,22,25],phase='业务闭环',
    deliverables=['两模式无run/有run均可见且工作队列指向真实下一步；分类、负责方、责任与实际人分开。','客户档案统一只读归集有权业务及原AI/Cloud/PRED联系与回访，不合并业务身份；当前/本方截止、业务跟进/原回访/通话分别表达。'],risks=['普通列表先更新时间倒序后分页；时间线与字段/优先级按语义顺序；失败不装空态。'],refs=['js/adapters/four-node-workspace.js','js/components/business-link.js','js/components/list-order.js'],questions=['ENG-FLOW-PERSISTENCE'])
add(31,'同号占用、间隔、上限和优先级',flow='CONTACT-POLICY',deps=[5,15],phase='联系与合规',
    deliverables=['同租户规范号码共享有效呼出占用，兼容专业与两模式来源。','维护最短间隔、北京时间日限额与分类优先级；时间/身份未知不放行，业务仍各自独立。'],risks=['不抢占在途执行、不自动续拨；数据来源失败不能清占用或假0。'],refs=['scripts/four-node-model.js','js/components/contact-policy.js','js/components/module-host.js'],questions=['ENG-FLOW-EXECUTION','EQ-PLAT-CONTACT-STATE'])
add(32,'AI专业目录、执行场景与分类引用',plat='AI-CATEGORY-STOP AI-CATEGORY-BIND AI-SCENE-QUERY AI-SCENE-SAVE AI-SCENE-DELETE',deps=[5,9,55],phase='专业能力保留',
    deliverables=['保专业目录、AI业务类型和具体场景身份、供应商与本租户资源参数。','具体场景引用业务分类，不因此绑定模板路由；原引用/删除及专业权限保护保持。'],risks=['场景使用不等于标签字典维护；分类共享不共享私有场景。'],refs=['scripts/category_build.py','js/components/module-host.js'],questions=['ENG-FLOW-SCENE','EQ-PLAT-PROFESSIONAL'])
add(33,'AI标签目录、池、标准集与准确映射',plat='AI-TAG-CONFIG AI-TAXONOMY',deps=[5,9,55],phase='专业能力保留',
    deliverables=['标签场景/供应商目录、原供应商池、租户类型标准集及映射按稳定ID维护。','保配置revision及已有结果原值，不按同名/首项匹配；运营不获标签目录维护权。'],risks=['不把标签场景目录误作运营可维护的执行场景；不自动写业务字段或推进。'],refs=['js/components/module-host.js','js/adapters/unified-ai.js'],questions=['ENG-FLOW-SCENE','EQ-PLAT-PROFESSIONAL'])
add(34,'原AI任务及名单导入维护',plat='AI-TASK-QUERY AI-LIST-IMPORT AI-LIST-REMOVE AI-IMPORT-HISTORY AI-IMPORT-TEMPLATE',deps=[32,39],phase='专业能力保留',
    deliverables=['保准确AI任务查询、名单导入/移除、批次历史及具体场景模板下载。','当前确未实现的专业控制/导出不假报成功，专业名单不伪造四节点run。'],risks=['专业导入与新业务严格导入各有实体身份；受理不宣称远端已完成。'],refs=['js/components/module-host.js','scripts/ai_import_parse_build.py'],questions=['EQ-PLAT-PROFESSIONAL','EQ-PLAT-ACCEPTED-CALL'])
add(35,'原AI线索查询与回访保存',plat='LEAD-QUERY LEAD-CALLBACK',deps=[34],phase='专业能力保留',
    deliverables=['按准确AI线索、任务与租户资格查询详情并保存原回访字段。','原专业结果和新四节点人工内容/业务结论分开，关联不新增权限。'],risks=['不按号码合并业务，不用AI旧值生成本轮人工确认。'],refs=['js/components/module-host.js','js/components/business-link.js'],questions=['EQ-PLAT-PROFESSIONAL'])
add(36,'通话记录、录音和异常核对',plat='CALL-QUERY RECORDING-READ CALL-EXPORT CALL-RECONCILE',deps=[5,55],phase='专业能力保留',
    deliverables=['AI/Cloud原通话记录、准确异常核对及有权Cloud导出保持原口径。','有读权可播放/暂停/seek录音并显示有权号码；跨租户资料接续不自动授录音。'],risks=['媒体失败和无录音区分；不把播放动作变成修改权限。'],refs=['js/components/module-host.js','js/components/business-link.js'],questions=['EQ-PLAT-PHONE','EQ-PLAT-PROFESSIONAL'])
add(37,'原黑名单分组和号码维护',plat='BAN-QUERY BAN-GROUP-SAVE BAN-GROUP-DELETE BAN-NUMBERS BAN-MOVE BAN-REMOVE',deps=[5],phase='联系与合规',
    deliverables=['维护本租户准确原分组/号码模型，查询、导入、移动、删除分别按来源资格。','超管只读，原运营维护不扩大到客户拒联解除；空组和系统分组保护保留。'],risks=['不新建平行禁呼主维护，不因同品牌共享号码限制。'],refs=['js/components/contact-policy.js','js/components/module-host.js'],questions=['EQ-PLAT-CONTACT-STATE'])
add(38,'名单来源详情与供应商同步核对',plat='BAN-DETAIL BAN-SYNC',deps=[37,55],phase='联系与合规',
    deliverables=['逐来源展示期限、同步状态、准确供应商企业及当前结果。','配置/启停/重试按准确原请求和终态核对，不用本方保存冒充远端生效。'],risks=['共享来源与单来源解除分开；失败未知不清其他有效来源。'],refs=['js/components/contact-policy.js','js/components/module-host.js'],questions=['EQ-PLAT-REMOTE'])
add(39,'明确拒联入库、解除与所有外呼准入',plat='BAN-HUMAN BAN-AI CONTACT-CHECK BAN-RELEASE',deps=[37,38],phase='联系与合规',
    deliverables=['人工明确拒联随正式结果保存入库；AI明确拒联由有权人核实，不自动触发。','仅本租户管理员带原因解除准确拒联来源；首次/重呼/补交/已受理未拨均按全部有效来源重核。'],risks=['正常呼入不被外呼限制拦；放行/解除某来源不能清其他有效来源。'],refs=['js/components/contact-policy.js','js/components/module-host.js'],questions=['EQ-PLAT-CONTACT-STATE','EQ-PLAT-ACCEPTED-CALL','EQ-PLAT-REMOTE'])
add(40,'AI服务账户、办理、调整和未知交易核对',plat='FINANCE-QUERY FINANCE-VIEW FINANCE-RECHARGE FINANCE-ADJUST FINANCE-RECONCILE',deps=[5,55],phase='专业能力保留',
    deliverables=['五角色按范围读服务与流水；服务办理/调整/核对仅原超管资格。','分钟池、有效期、业务目录及交易版本同次解释，失败保原值，未知核同请求。'],risks=['不混Cloud账务、不换算旧金额账本；不虚构真实支付或已充值。'],refs=['js/adapters/ai-finance.js','js/components/module-host.js'],questions=['EQ-PLAT-FINANCE'])
add(41,'AI服务汇总八列导出',plat='FINANCE-EXPORT',deps=[40],phase='专业能力保留',
    deliverables=['按准确有权AI租户范围输出名称/ID/类型/可用/冻结/累计消耗分钟/有效期/控制状态八列。','当前筛选与同次快照一致，导出权限与普通账户只读分开。'],risks=['未知分钟不补0，不恢复旧金额或大小模型余额口径。'],refs=['js/adapters/ai-finance.js'],questions=['EQ-PLAT-FINANCE'])
add(42,'本人电话、话后及原坐席监管',plat='PHONE-PREPARE PHONE-OUTBOUND PHONE-INBOUND PHONE-AFTERCALL PHONE-CONTINUE SEAT-SUPERVISE',deps=[5,6,39,49,56],phase='专业能力保留',
    deliverables=['本人有效电话上线/拨接挂/话后与对他人坐席监管分权，振铃上下文按准确call身份。','原专业两态与新run终态分离，开始取最新schema，保存沿本轮已展示依据并由实际人完成。'],risks=['不把监管状态当本人在线；切上下文保护不自动停止后台租户任务。'],refs=['js/components/module-host.js','js/adapters/four-node-execution.js'],questions=['EQ-PLAT-PHONE','EQ-PLAT-PROFESSIONAL'])
add(43,'原客户任务、联系档案和批次',plat='CUSTOMER-DIRECTORY CUSTOMER-IMPORT CUSTOMER-ASSIGN IMPORT-BATCH',deps=[5,9,49],phase='专业能力保留',
    deliverables=['原professionalCustomer任务/批次、导入、分配与联系档案按稳定原身份保持。','原客户任务待继续跟进/已完成仍独立；同号联系归集不合并新业务身份。'],risks=['原专业坐席/任务分配不能替代新业务责任跟进人安排；不删除原能力。'],refs=['js/components/business-link.js','js/adapters/customer-import-enhancements.js'],questions=['EQ-PLAT-PROFESSIONAL'])
add(44,'原业务系统入站与结果回传',plat='BUSINESS-API-IMPORT BUSINESS-API-RESULT',deps=[43],phase='专业能力保留',
    deliverables=['按准确应用、租户、原客户任务接收既有导入及指定坐席；回传原完成结果。','失败/重复/回传未知保同次身份，不把新四节点事件自动扩为新的逐轮回传合同。'],risks=['不扩大为通用CRM集成，不要求外部业务携带内部模板ID。'],refs=['js/components/module-host.js','js/components/business-link.js'],questions=['EQ-PLAT-PROFESSIONAL','ENG-FLOW-EXECUTION'])
add(45,'预外呼/IVR任务配置和名单导入',plat='CLOUD-TASK-QUERY CLOUD-TASK-SAVE CLOUD-TASK-IMPORT',deps=[5,39,52,53,54,55],phase='专业能力保留',
    deliverables=['查询及维护原任务、计划、唯一执行资源和名单导入，方式与资源用途不能混用。','供应商流程/本地映射、计划起止、主叫/号码池、任务内重呼等原参数按规格解释。'],risks=['专业IVR保原能力，不新增为四节点CALL方式或要求新业务选择任务/队列。'],refs=['js/components/module-host.js','js/adapters/customer-import-enhancements.js'],questions=['EQ-PLAT-PROFESSIONAL','EQ-PLAT-ACCEPTED-CALL'])
add(46,'专业任务控制、重呼、补交与结果导出',plat='CLOUD-TASK-CONTROL CLOUD-TASK-RECALL CLOUD-TASK-RESUBMIT CLOUD-TASK-RESULT TASK-EXPORT EXPORT-CUSTOMERS',deps=[45],phase='专业能力保留',
    deliverables=['按每个准确状态控制/暂停/继续/结束/删除，正常重呼与明确异常补交分开。','原失败名单、任务列表/客户明细导出及结果终态精确关联，受理/排队/执行/结束分开。'],risks=['暂停整任务不证明某条号码不再呼叫；未知请求不能重复补交或报成功。'],refs=['js/components/module-host.js'],questions=['EQ-PLAT-ACCEPTED-CALL','EQ-PLAT-PROFESSIONAL'])
add(47,'十类专业报表查询、明细和导出',plat='REPORT-QUERY REPORT-DRILL REPORT-EXPORT',deps=[21,36,43,46],phase='专业能力保留',
    deliverables=['按Cloud七类/AI三类的粒度、归期、列、单位、分母和有效样本解释统计。','明细只沿准确业务/任务/call键查询；已实现导出承接同一筛选，未实现指标明确展示。'],risks=['未知/缺时长不补0；联系次数/接通/处理完成/业务达成不混算。'],refs=['js/components/module-host.js','js/components/list-order.js'],questions=['EQ-PLAT-PROFESSIONAL','EQ-PLAT-FINANCE'])
add(48,'配置审计、操作审计及坐席事件',plat='RESOURCE-AUDIT OPERATION-AUDIT SEAT-EVENT-QUERY',deps=[5,50,55],phase='专业能力保留',
    deliverables=['按准确对象读取配置失败记录与修正入口，保原操作审计/坐席事件查询导出。','读权和维护/修正权分开；原事件时间语义不被更新时间列表规则替代。'],risks=['失败和未知不可用成功toast代替；不泄露无权对象存在或敏感资料。'],refs=['js/components/module-host.js','js/components/list-order.js'],questions=['EQ-PLAT-PROFESSIONAL'])
add(49,'坐席资料与账号准确关联',plat='RESOURCE-AGENT-QUERY RESOURCE-AGENT-SAVE RESOURCE-AGENT-DELETE SEAT-BIND',deps=[5,55],phase='专业能力保留',
    deliverables=['维护本租户准确电话坐席、生命周期、电话身份及唯一账号关联。','可调用资格、本人电话能力和业务责任分配分开，重复映射明确阻断。'],risks=['不借同名/手机号猜坐席，不给无资格人员自动开通或代拨。'],refs=['js/components/module-host.js','js/adapters/four-node-execution.js'],questions=['EQ-PLAT-PHONE','EQ-PLAT-PROFESSIONAL'])
add(50,'供应商坐席批开、同步和失败修正',plat='SEAT-BATCH-CREATE SEAT-BATCH-VERIFY SEAT-CORRECT SEAT-SYNC',deps=[49],phase='专业能力保留',
    deliverables=['批开、已有坐席同步与明确失败修正分开，逐项保准确请求和供应商身份。','未知先核原批次，不重复远端开通；最终本地映射可回读。'],risks=['本方受理/HTTP200不证明远端开通成功；不混不同供应商资格。'],refs=['js/components/module-host.js'],questions=['EQ-PLAT-PROFESSIONAL','EQ-PLAT-REMOTE'])
add(51,'技能目录与坐席技能关联',plat='RESOURCE-SKILL-QUERY RESOURCE-SKILL-SAVE SKILL-MEMBER',deps=[49],phase='专业能力保留',
    deliverables=['维护有权技能目录及坐席技能等级/成员，按准确tenant/enterprise与稳定ID。','配置和实际电话资格保持原联动，不以名称或首项替代。'],risks=['无权/缺资源/未知映射不开放拨接资格。'],refs=['js/components/module-host.js'],questions=['EQ-PLAT-PROFESSIONAL'])
add(52,'队列配置与技能成员核对',plat='RESOURCE-QUEUE-QUERY RESOURCE-QUEUE-SAVE QUEUE-ASSOCIATE',deps=[51],phase='专业能力保留',
    deliverables=['维护队列真实参数、技能关联并核对成员投影，保原优先级及超时含义。','队列/技能/坐席各有准确资源身份和用途边界。'],risks=['队列直接承接不被冒充成当前呼入规则支持项；未知成员不可放行。'],refs=['js/components/module-host.js'],questions=['EQ-PLAT-PROFESSIONAL'])
add(53,'外呼组、号码与号码池',plat='RESOURCE-OUTBOUNDGROUP-QUERY RESOURCE-OUTBOUNDGROUP-SAVE RESOURCE-OUTBOUNDGROUP-DELETE RESOURCE-NUMBER-QUERY RESOURCE-NUMBER-SAVE RESOURCE-NUMBERPOOL-QUERY RESOURCE-NUMBERPOOL-SAVE RESOURCE-NUMBERPOOL-DELETE',deps=[5,55],phase='专业能力保留',
    deliverables=['按原用途维护外呼组、号码属性/绑定、号码池及成员，不混主叫与资源身份。','引用保护删除、启用资格、号码明文读取分别按原范围。'],risks=['新业务起呼仅解析唯一有效方案，不能因此新增任务/号码池挑选环节。'],refs=['js/components/module-host.js'],questions=['EQ-PLAT-PROFESSIONAL'])
add(54,'分机与时间条件',plat='RESOURCE-EXTENSION-QUERY RESOURCE-EXTENSION-SAVE RESOURCE-EXTENSION-DELETE RESOURCE-TIME-QUERY RESOURCE-TIME-SAVE RESOURCE-TIME-DELETE',deps=[5,55],phase='专业能力保留',
    deliverables=['维护原分机参数与时间条件、名称/编码和允许编辑范围，保引用删除保护。','按实际时间/时区和启停规则解释，调用方不以首项兜底。'],risks=['失效/不存在/无权限分别反馈，不把未知配置当全天可用。'],refs=['js/components/module-host.js'],questions=['EQ-PLAT-PROFESSIONAL'])
add(55,'供应商账号与应用接入',plat='RESOURCE-ENTERPRISE-QUERY RESOURCE-ENTERPRISE-SAVE RESOURCE-APPLICATION-QUERY RESOURCE-APPLICATION-SAVE RESOURCE-APPLICATION-DELETE',deps=[4,5],phase='专业能力保留',
    deliverables=['保AliCti企业账号与应用接入准确租户/供应商/用途和敏感字段权限。','原增改删、只读基础及引用保护逐项落实；凭据由开发指定安全承载，不写入前端产品包。'],risks=['配置管理不授业务数据办理；不生成生产密钥或假联通结果。'],refs=['js/components/module-host.js','js/components/organization-store.js'],questions=['EQ-PLAT-PROFESSIONAL','EQ-PLAT-IDENTITY'])
add(56,'呼入规则与接听去向',plat='INBOUND-RULE',deps=[52,53,54],phase='专业能力保留',
    deliverables=['原呼入规则去向为IVR/电话/分机，按当前有效资源和时间条件配置。','规则创建选填/编辑只读的原字段边界与正常呼入保持；进入振铃/填写沿准确通话关联。'],risks=['不把外呼禁呼规则套到正常呼入，不扩未确认接听类型。'],refs=['js/components/module-host.js'],questions=['EQ-PLAT-PROFESSIONAL','EQ-PLAT-PHONE'])

# Explicit current-prototype continuation; IDs and unaffected task contracts stay stable.
CURRENT_TASK_CHANGES={
  2:('身份/草稿检查下的导航与退出',['五区导航、目标身份/数据资格及普通未保存表单检查保留。','正常导航/切业务域/切租户/系统退出不因电话phase而拦截，不强制先结束通话或电话离线；已受理后台任务不因此取消。'],['电话自身作业资格与撤权后有限当前收尾仍独立，不因正常导航放行而扩大授权。']),
  9:(None,None,['关闭普通DIRECT开关不删除既有事实，也不撤销可准确验证的END来源接续许可；不能借此给其他业务开放普通DIRECT。','分类行仅编辑/路由配置/预览/删除，标签维护走独立专业入口，不恢复旧快捷按钮。']),
  11:('条件优先的四节点参考模板维护',['四组件职责固定；按名称→条件→下一节点→继续条件编辑，空目标只是草稿且不产生虚连线。','当前有出口配置须唯一末位ELSE；条件即时改，兼容operator保值，来源/字段或不兼容类型/基数清不适用值。','END仅名称及DIRECT_FOLLOWUP/CLOSE二选一；多值换行提示、选择/拖线拒环、保存定位和错误同色反馈均按当前原型。'],['不恢复旧三按钮待应用层或END业务达成/承接配置；旧产品配置字段保留溯源，不改义复用。']),
  14:(None,['两模式均严格校系统/分类必填、类型/选项、映射及唯一性；当前schema启用可判断的选填IMPORT缺列在新输入捕获为null。','TEMPLATE检当前ELSE完整方案及首次真实分流，DIRECT不读路由；未知目录、必填缺失、通话/填写待核不借ELSE放行。'],['不将新输入补null扩成历史读取迁移，不靠普通DIRECT绕过不完整模板。']),
  17:(None,['完成直接周期仍需明确结论及真实已归档跟进，或NO_CALL带原因；后续再次跟进保原周期事实。','区分普通DIRECT准入和可信END来源接续；两者都保持准确当前租户/实际人/资源/限制和直接周期，不伪造活动run。'],['END来源可保已结束runs/nodeRuns历史；这不允许普通DIRECT请求伪造来源绕分类开关。']),
  19:(None,None,['人工/预外呼路由回执分别用TIANRUN_MANUAL_SIP_CAUSE/TIANRUN_PREDICTIVE_SIP_CAUSE客户侧200/710～724，不从旧1～4接听标记推算；AI域和其他专业显示字段不强改。']),
  23:('有序强兜底条件与准确结果判断',['IMPORT/填写/通话/标签按准确来源/范围和类型判断，人工/预外呼使用客户侧SIP域。','当前所有有出口新方案均强制唯一末位ELSE，明确不匹配才到兜底；任何未知仍PENDING；新选填缺列null只在可靠schema输入捕获时产生。'],['不恢复当前无ELSE配置或让NOT_IN把未知当匹配；不按label、首字段或旧接听标记猜值。']),
  24:('确认节点推进及END两动作接续',['确认准确边与令牌后进入后继；到END先封原run，再执行CLOSE或DIRECT_FOLLOWUP。','CLOSE业务结束不跟进；DIRECT_FOLLOWUP在同record/当前tenant建立MANUAL直接周期，保结束run/原通话/快照，不自动起呼。','原跟进人仅当前有效且有电话资格才沿用，否则待安排；合法END来源与分类普通DIRECT许可分开验证。'],['运行关闭/转无模板是系统动作摘要，不推定成交；END不增加承接方和呼叫方式配置。']),
  25:('本租户路径与合法跨租户转交',['线索域转交组件先区分CURRENT/OTHER；CURRENT锚定当前负责方并确认合法后继，保owner/run/租户阶段/既有安排及封存结果。','OTHER按原意向唯一映射或HQ管理员同次指定，才封截止/改归属/建接续轮次并清旧安排。'],['CURRENT不产生跨租户授权、不冒充OTHER，不因保留旧安排豁免后继CALL资格/场景重核；不扩普通业务域转交。']),
  30:(None,None,['客户档案统一标题、可聚焦页签和tabpanel；同身份保两视图查询/分页，跨身份不恢复旧对象，显式详情/摘要刷新定位正确。']),
  33:(None,None,['标签集中专业入口保留；不要恢复已删除的分类行AI标签配置快捷跳转。']),
  45:(None,None,['预外呼/IVR页面保原列表/查询/重置/空态，不增加今日任务名单分布；不删除独立专业报表能力。'])
}
for number,(title,deliverables,risks) in CURRENT_TASK_CHANGES.items():
    group=next(x for x in GROUPS if x['id']==tid(number))
    if title:group['title']=title
    if deliverables:group['deliverables']=deliverables
    if risks:group['risks']+=risks
next(x for x in GROUPS if x['id']==tid(24))['local_ids'].append('LOCAL-FLOW-END-HANDOFF')

# User-authorized Step42 changes keep task identities and replace obsolete assignment prose.
EXECUTION_TASK_CHANGES={
  11:('四节点模板与分租户默认执行安排',[
      '四组件、条件优先与唯一末位ELSE按现行规格；CALL提供五档默认优先级及当前有权执行租户的具体任务/坐席、人员和必要场景默认。',
      '同品牌模板保其他租户映射，不展示其私有候选；新run捕获当前方案，旧run和已受理执行不追改。'],[
      '换方式时重核不兼容目标；品牌配置权不授跨租户资源使用权；END仍只配置原两动作。']),
  14:(None,[
      '两模式严格校基础必填、类型/选项、映射及唯一性；TEMPLATE核实际首CALL并分组显示目标/等级，DIRECT不读模板。',
      '支持导入同次安排或稍后手动分配；明确的任务/坐席、人员、场景、等级及节点默认与预检绑定，变化使旧确认失效。'],[
      '同次纳入行失败不部分导入；目标停用、异租户或场景冲突保输入，不按首项猜测。']),
  15:(None,[
      '同次重核业务身份、名单、字段、模式及安排依据；明确选择的具体目标/人员/场景/五档等级与业务和批次一致保存。',
      '选择稍后安排时保原待安排入口；DIRECT只建直接周期，TEMPLATE建捕获run及首节点，导入不自动起呼。'],None),
  16:('两模式手动分配具体任务或坐席及五档优先级',[
      'TEMPLATE与DIRECT共用本租户具体任务/坐席、责任跟进人、必要AI场景及1～5五档执行优先级；默认中。',
      '导入后原单条/同组批量手动分配保留；共同候选逐条重核，整组失败不部分写；选定resourceId保存回读，不按首项推断。'],[
      '实际人工起呼须为所选坐席对应本人，责任跟进人单独保留；任务内线路/队列参数沿专业配置，不自动授电话权或起呼。']),
  18:('按具体安排与执行优先级明确起呼',[
      '按保存resourceId、必要场景及准确业务/周期/节点重核本人与资源；人工仅所选坐席本人办理。',
      '同资源可办理待办按五档降序、同档入队时间和稳定序号升序派发；独立资源可办理，不抢占已受理执行。',
      '每业务独立跟进、受理及失败/未知反馈；禁呼、频控、同号占用和必要归档等原限制照常检查。'],None),
  30:(None,[
      '业务列表/详情展示模式、具体任务或坐席、五档等级和当前待办状态，责任跟进人与实际办理人分列。',
      '待执行推荐视图按同资源等级及同级入队FIFO，普通业务/历史仍更新时间倒序；长期等待提示有权人员处理。'],None),
  31:(None,[
      '同号码继续唯一有效呼出、联系间隔和每日次数控制；同号与同资源使用五档降序、queuedAt/queueSequence FIFO及稳定业务ID的同一总序，避免循环等待。',
      '旧0～999分类配置仅保历史/原专业兼容，当前UI只读且不参与新排序；不抢占在途、不自动续拨。'],None)
}
for number,(title,deliverables,risks) in EXECUTION_TASK_CHANGES.items():
    group=next(x for x in GROUPS if x['id']==tid(number))
    if title:group['title']=title
    if deliverables:group['deliverables']=deliverables
    if risks:group['risks']=[r for r in group['risks'] if '不新增坐席/任务/线路选择' not in r]+risks

ASSIGNMENT_SIMPLIFICATION_CHANGES={
  11:('四节点模板与分租户执行安排',[
      'CALL人工提供MANUAL人工分配（默认）/SPECIFIC_SEAT指定坐席；MANUAL可无seat先保存，SPECIFIC_SEAT才核有效seat。',
      'PRED默认仅任务、AI默认任务+scene，模板默认责任跟进人控件移除；分租户映射保权限与历史。'],[
      '删除独立person输入不授无权任务/资源；旧人员事实及已受理快照不清理。']),
  14:(None,[
      '两模式保持基础导入及路由校验；人工MANUAL可无seat导入为待分配，SPECIFIC_SEAT才必选合法seat。',
      'PRED安排只任务、AI任务+scene，不要求独立责任人；目标/人工分配方式/scene/等级变更失效旧预检。'],None),
  15:(None,[
      '与名单/模式同次保存当前人工分配方式或准确任务安排及五档等级，无独立person输入。',
      '人工MANUAL待分配保持原单条/批量分配入口；实际发起前再落实有效seat，不自动起呼。'],None),
  16:('任务确认与人工分配方式/坐席',[
      '人工默认MANUAL待分配，可随后原单条/批量分配seat；SPECIFIC_SEAT才必选seat。PRED只任务，AI任务+scene。',
      '模板、导入及分配独立责任人控件全部移除；人工责任由有效seat.accountId派生，AI/PRED不伪填actor为负责人。'],[
      '实际发起/拨打/接听及填写事实分别记录，谁接听谁填写；取消person必填不扩大任务/租户/模块权。']),
  18:('按方式与具体安排明确起呼',[
      '人工只有已落实有效seat且当前为其本人才能发起；MANUAL pending保待分配，不以临时当前actor替填。',
      'PRED合法任务、AI合法任务+scene在无独立责任人值时可发起；真实actor/拨打/接听事实另存。',
      '五档/FIFO总序、手工启动、联系限制、在途/未知和必要归档守卫继续，旧人员历史不迁移。'],None),
  25:(None,[
      'CURRENT保持owner/run/租户阶段和封存事实，当前执行安排先服从后继节点捕获策略。新MANUAL明确清前seat并待分配，SPECIFIC_SEAT才可按本节点、同tenant/method及有效资源沿用或确认。',
      'OTHER仍按原合法目标转交后封截止、切归属并清当前安排；旧无策略快照按原解释，不读取时迁移。'],[
      '不得用前节点已指定seat覆盖新MANUAL的待分配意图，也不因人工待分配擅自改变业务归属。']),
  30:(None,[
      '列表/详情明确人工分配或指定坐席、任务/场景及五档状态；MANUAL缺seat显示待分配，AI/PRED不因人员空值显示待安排。',
      '实际及历史人员只读展示，配置/导入/分配无独立责任人控件；待执行按原统一五档/FIFO推荐。'],None)
}
for number,(title,deliverables,risks) in ASSIGNMENT_SIMPLIFICATION_CHANGES.items():
    group=next(x for x in GROUPS if x['id']==tid(number))
    if title:group['title']=title
    if deliverables:group['deliverables']=deliverables
    if risks:group['risks']+=risks

TASK_IMPORT_UNIFICATION_CHANGES={
  14:('三入口共同分类字段与准确目标预检',[
      '客户维护、AI任务和预外呼任务共用分类IMPORT及code/姓名/号码等系统必需schema，FOLLOWUP排除。',
      '任务内固定准确task/必要scene并默认DIRECT，重核ADMIN+customer.import/模块/任务/来源及分类allowDirectFollowup；字段/映射/目标变化失效旧确认。',
      '读取/预检采用exact context.importLimits；保原AI大众100/厚朴150000/其他2000行与16MB、PRED2000行/1MB，超限提示分批不截断。'],[
      '不能因分类已绑模板要求任务DIRECT走模板，不能按手机号生成/认领业务，不把任意maxRows参数当权威目标限额。']),
  15:('三入口统一业务及任务来源同请求保存',[
      '纳入行全部同源校验通过后，同请求只写统一业务账本及DIRECT周期/必要模板运行，任务内不建run/node。',
      '保存全部IMPORT规范值及本次定义/来源/参数快照、taskImportSource、逐行taskImportParameterSnapshot、批次和等级；UI列映射仅导入前校验，未知核原请求。',
      '专业名单只读recordId投影，不新增原生行/第二账本或重复提交供应商，旧历史和同号其他业务不自动认领。'],None),
  32:('AI场景供应商独立参数与弹窗配置',[
      '按准确scene/platform保存schema2/importFieldCategoryId/importFieldPlatform/importFieldMappings，IMPORT_FIELD引用分类、CUSTOM_COLUMN定义本场景text/number/date列；同fieldId可映多个不同parameter，参数名唯一。',
      '主场景保原“添加字段”唯一新增入口，点击后二选“选择导入字段”/“手工添加供应商字段”；手工“添加场景信息”沿线上业务信息只读、字段名称、参数名、必填/选填radio和取消/确定，类型次要行。子确认只入父草稿，主保存才持久，schema2/80与64约束不变。',
      '固定供应商项按精确协议来源或本场景默认专业列处理，required不减；importFieldPlatform不符拒绝，切平台不混草稿，schema1和legacy customInputFields只读兼容，父保存升级才清旧重复定义。'],[
      '场景配置权不授业务字段维护/任务导入权；业务定义不复制，专属列/值不污染分类，无固定值配置，FOLLOWUP/异分类/失效引用及重复参数拒绝。']),
  34:('AI任务内DIRECT统一业务与名单投影',[
      '保准确任务/历史查看；新任务导入用实际scene分类共同IMPORT+系统必需字段，固定task+scene建立统一DIRECT业务。',
      'ADMIN+customer.import、原AI模块/任务/来源及分类DIRECT准入均核验；AI-only合法管理员不需Cloud菜单，ops不扩导入写权。',
      '模板/列映射共用businessFields+本scene/platform customFields；供应商需值合并当前required，businessRequired保分类基础定义不改库；归一行拆业务fields/customValues，参数快照封customFields/customValues/parameters/mappings/fingerprint，不混record.fields。',
      '专业名单按recordId只读投影，旧parser只历史兼容，无第二新写入口或重复供应商提交，后改配置不重绘历史。'],[
      '不能按手机号绑定旧业务；新统一业务保存不等供应商受理/拨打，原未实现专业控制/导出仍不假成功。']),
  43:(None,[
      '原人工/接口客户任务、批次及联系档案保准确原身份/来源，旧专业数据不迁移到统一业务。',
      'AI/PRED本轮新任务导入统一DIRECT并投影，不能把旧专业与统一业务各自分开的历史口径继续作为本轮完整入口规则。'],None),
  45:('预外呼任务统一业务导入与原IVR边界',[
      '预外呼任务内选实际分类，固定task并默认DIRECT/PRED；共同IMPORT+code等必需校验及五档保存，无额外seat/person选择。',
      '保原接口/手工来源锁定、ADMIN+customer.import及Cloud/任务资格，2000行/1MB按exact目标校验；新名单只读统一recordId投影。',
      '原任务资源、计划/重呼/参数及旧名单历史保持；IVR不扩DIRECT，不以统一写入追加原生行或重复供应商提交。'],None)
}
for number,(title,deliverables,risks) in TASK_IMPORT_UNIFICATION_CHANGES.items():
    group=next(x for x in GROUPS if x['id']==tid(number))
    if title:group['title']=title
    if deliverables:group['deliverables']=deliverables
    if risks:group['risks']+=risks

group26=next(g for g in GROUPS if g['id']==tid(26))
group26['local_ids']=unique(group26['local_ids']+['LOCAL-FLOW-ABANDONED-SETTLEMENT'])
LIFECYCLE_AUDIT_CHANGES={
  17:(None,[
      '当前DIRECT周期完成仍依自身真实归档完成跟进或合法NO_CALL及原因；旧已弃历史按可靠异常收尾，不强求archived=true或把它计当前完成。',
      'END历史来源保结构合法，但普通开关豁免仅准确首MANUAL当前cycle；resume三方式任何新cycle均核当前分类允许。'],[
      '保原END/cycle历史，不伪改originCycleId；正常当前必要内容/真实在途unknown冲突不因旧弃结清被跳过。']),
  18:(None,[
      '新起呼/新派发与原受理事实入站分开；正常段先正常归档，旧弃可靠结清可供后继，不以正常archived=true一概扫描。',
      'ABANDONING仍拒新起呼/派发；来源可靠、准确原seg/attempt迟到事实归原ID，不误挂当前或提前解锁。'],None),
  19:(None,[
      '按准确record/run/stage/followup/attempt记录真实拨打/接通/终态，停止请求不等真实停止。',
      'ACTIVE/ABANDONING原已受理且未可靠关闭的事实照常登记去重计数；已闭段未知新attempt仍按EXECUTION_CLOSED/冲突，不抹真实事实或授权新派发。'],None),
  24:(None,[
      '原run执行END后CLOSE关闭，DIRECT_FOLLOWUP只建来源准确的首MANUAL周期，无自动起呼。',
      '历史来源可保但当前例外须同record/owner/originCycle和MANUAL，后继resume任何新周期重验分类；原权限/资源/正常归档仍核。'],None),
  26:('受控缺内容废弃及历史异常结清',[
      '真实EXECUTION_ACTIVE/REQUEST_UNKNOWN/FACT_CONFLICT下ADMIN普通reason可先登记停止→ABANDONING，不先强未来内容确认；FOREIGN_CONTENT不当在途。',
      '可靠停止后完成缺内容废弃才须当前ownerADMIN勾无法补填+原因及准确run/本tenant缺失指纹/record revision；正常archive与异常settlement分开。',
      '原受理/在途/重试/unknown/冲突可靠收敛后才ABANDONED与新run，保缺失未完成，不代填/不假正常完成。',
      '历史收尾确认不要求当前TEMPLATE；只更新本tenant旧seg.abandonmentSettlement与事件/revision，不废弃当前DIRECT或改当前run/exec/arrangement/字段。'],[
      '不可代其他tenant确认；变更缺失范围重核，旧本人后来补录不把旧弃改正常完成；可靠旧弃收尾不得永久卡后继DIRECT。']),
  28:(None,[
      '同record显式启用当前模板仍核原路由/资料/权限；真实旧执行闭合，正常必要归档与旧可靠弃结清分别判。',
      '不因所有旧abandoned段archived=false永久阻；不新增DIRECT开关前置，不重导入或让旧DIRECT事实完成新节点。'],None)
}
for number,(title,deliverables,risks) in LIFECYCLE_AUDIT_CHANGES.items():
    group=next(g for g in GROUPS if g['id']==tid(number))
    if title:group['title']=title
    if deliverables:group['deliverables']=deliverables
    if risks:group['risks']+=risks

# Step48-54 replaces the active entry/reader contracts; old source decisions stay
# in authored supersessions, not as contradictory current task instructions.
ENTRY_CURRENT_TASK_CHANGES={
  9:('分类双用途字段、业务域和入口资格',[
      '分类独立维护IMPORT/FOLLOWUP、业务编码及业务域；基础配置和实际路由分别保存，引用后稳定身份保持保护。',
      '分类列表添加导入名单，人工或接口均固定TEMPLATE；直接名单从准确AI/预外呼任务进入。旧allowDirectFollowup仅保原存量准入/历史解释，不恢复分类编辑切换开关。'],[
      '任务DIRECT准入按准确当前合同重核，不因分类已有模板而强制走模板；共享分类不授跨租户业务数据权。']),
  11:('四节点模板、正常结束与分租户执行安排',[
      '四组件、显式入口、条件及唯一末位ELSE保持；CALL按MANUAL人工分配或SPECIFIC_SEAT指定坐席、PRED只任务、AI任务+scene及五档优先级配置本租户默认。',
      '当前END仅正常CLOSE，不提供是否直接跟进配置；旧DIRECT_FOLLOWUP快照只按准确原run/cycle只读解释，不迁移或追改旧运行。'],[
      '换方式重核目标，模板品牌配置权不授异租户资源使用权；未指定的人工可合法待分配。']),
  13:('按准确方式与场景读取文件和列映射',[
      '先由入口/任务/当前模板分流确定呼叫方式及必要AI场景，再形成正式导入字段；AI取该scene/platform的业务字段映射和供应商专属列，PRED取任务已关联分类IMPORT。',
      '保CSV/TSV/XLSX、前导零、物理原始行号及显式列映射；文件异步回调按窗口/账号/租户/序号失效，变化使检查token失效。'],[
      '模板下载的落地/回读是独立验收，上传成功或生成提示不等于下载通过；容量按准确context.importLimits，不截断。']),
  14:('任务DIRECT与分类TEMPLATE两类入口预检',[
      '任务内固定准确任务、已关联分类/AI场景及原手工/API来源，派生DIRECT；分类入口只人工/API进TEMPLATE，不再让导入时切办理模式。',
      '同源schema校必需/必填、类型/选项、唯一性、原模块/任务/分类资格及当前任务/scene配置依据；TEMPLATE重算条件首组后确定各组场景字段。',
      'AI纳入行须全部通过；PRED可仅确认已检查的有效子集，失败行继续原草稿；任何编辑/范围/字段/目标变化均需重新检查。'],[
      '未知目录/原请求待核不当空或未发生；AI不借PRED的有效子集规则放行，不按首项/名称猜场景和任务。']),
  15:('统一业务、导入入口标识与失败草稿',[
      '只写统一业务账本，entrySource区分TASK/CATEGORY及MANUAL/API；任务DIRECT不创建模板run/node，分类TEMPLATE捕获当前方案。',
      '准确taskImportSource与逐行参数/业务schema快照同次封存；PRED成功行移出剩余草稿且不重复保存，失败草稿保检查时物理原行信息，AI保全通过约束。',
      '批次名和中档默认可自动带入，五档等选项收起为选填；成功完成后关闭文案与禁用状态同步，不自动起呼。'],[
      '原请求未知先核同次，不允许关闭/重开逃避待核；专业表只读投影，不双写原生新行或重复提交供应商。']),
  17:('TASK直接周期完成、再次办理与旧来源边界',[
      '完成当前直接周期须真实执行/重试及必要本人内容归档收敛，或合法无需联系并说明依据；业务结论显式选择，不把归档视为业务达成。',
      '新TASK DIRECT的再次周期沿准确当前任务/场景/分类/渠道资格，不读已移除的分类开关；旧无TASK来源按原准入，旧END例外仅准确原首MANUAL周期，不授新输入或其他周期。'],[
      '新TASK来源不显示启用模板，不复制业务或清旧事实；旧unknown/在途/必要内容阻断新周期，不能借旧受控废弃确认覆盖新缺失。']),
  24:('确认后继及正常END关闭',[
      '按准确当前边与令牌显式推进；当前END仅CLOSE，关闭原run并保业务实际结论，不提供模板直接跟进设置。',
      '存量DIRECT_FOLLOWUP运行来源只按原捕获计划/原首MANUAL周期解释；再次直接跟进须重新核普通准入，不用历史来源豁免新周期。'],[
      '流程结束不等于业务达成，不自动拨打；旧来源快照不迁移或重写。']),
  28:('旧无TASK直接业务的合法模板转换',[
      '先核准确entrySource；新TASK DIRECT拒绝启用模板且不展示入口、不生成转换预检token，保持任务直接跟进。',
      '仅旧无TASK标记的历史DIRECT沿原合法路由/资料/权限及执行/必要归档收敛条件显式转换，同record新run保旧周期快照及结论，不重导、不伪造TASK来源。'],[
      '旧历史转换不能变成新TASK业务模板入口；旧周期事实不完成新CALL，不迁移来源或留下双执行入口。']),
  30:('导入批次、独立业务名单与准确当前队列',[
      '客户维护入口为导入批次查看，新增名单从分类行发起；原任务名单同表展示新recordId投影和旧原生历史，缺新增字段留空。',
      '独立业务名单恢复不要求batchKey，详情仍须recordId；批次/全业务范围、账号/租户和撤权恢复分别核对。',
      '当前run无有效安排不展示旧队列时间；排序依据独立使用可信当前队列/节点进入/当前周期开始，重分配同资源取得新队列身份，不让旧历史抢队。'],[
      '实际人员保历史原值；AI空责任人行不冒充待分配或当前actor，不迁移旧事实。']),
  32:('AI供应商参数弹窗、准确任务目录与草稿生命周期',[
      '保单一添加字段入口和来源选择/配置弹窗，schema2的IMPORT_FIELD/CUSTOM_COLUMN按scene/platform独立；必填显示合并准确供应商/映射/引用字段要求，原协议表保持原值。',
      '已确认关联的专业任务按准确tenant/account/task/scene只读进入原任务目录，不创建供应商任务；未知原统计保待核，不补0。',
      '场景仅一个活动实例；取消后动画中的旧层在新初始化前移除，旧关闭定时器与迟到字段返回不得清空新抽屉或解锁新层；主保存才持久。'],[
      '活动未保存草稿不能被另开场景替换；取消不污染映射/参数指纹，未知配置或来源仍拒绝。']),
  34:('AI任务共享导入与原名单投影',[
      '准确AI任务自动带入scene/class，不重复选择或重填业务元信息；手工入口共享填写/检查/确认，API入口只读接收该场景正式字段。',
      '正式字段取对应scene/platform业务映射和CUSTOM_COLUMN，保分类定义/参数快照与专属值隔离；全行校验、权限、容量和原请求核对保持。',
      '导入和执行使用一致的完整配置指纹/权威任务资格；已证明等价旧包装仅只读兼容，真实来源/映射/任务状态变化仍拒绝，不写回旧快照。'],[
      '原任务表承接统一recordId投影和历史空字段，不建第二账本；保存业务不等供应商受理、拨打或已完成。']),
  36:('原通话详情、录音及准确拒联入口',[
      '原AI通话列表操作仅详情，准确详情保录音/文本/结果/信息页签；有权人工核实拒联保留在详情，按原来源/租户/供应商资格执行。',
      'Cloud原话单、异常核对及原导出保持；媒体失败/无录音分别反馈，真实音频和无权反向点击仍需实际验证。'],[
      '不在全部列表行追加确认拒联，不以通话状态或标签自动拒联；无新增限制保存证据不能宣称真实生效。']),
  43:('原客户任务与统一业务批次阅读',[
      '原人工/接口客户任务、批次及联系档案保稳定原身份、字段和合法原操作，不自动迁移、认领或覆盖。',
      '新AI/PRED任务入口建立统一DIRECT并显示准确入口标识；客户维护导入批次只查看，分类行添加名单走模板。'],[
      '原专业历史和新统一业务不能各自再写一份；品牌共享不授私有名单读取权。']),
  45:('预外呼任务关联分类与共享客户导入',[
      '在任务配置关联业务分类及原manual/api来源；任务内及列表顶部选择准确任务后同一导入界面自动带入分类与字段，不临时重复选择。',
      '手工共享填写/检查/确认，2000行/1MB及五档沿准确context；API仅只读接收说明。新名单为统一DIRECT，PRED安排仅任务不加seat/person。',
      '任务原资源/计划/重呼及旧历史原表保留；缺分类/关联失效引导维护任务配置，不能按首项或名字猜测。'],[
      'IVR保原专业边界，不扩四节点CALL；新任务导入不双写原生行或重复供应商提交。']),
  53:(None,None,[
      '导入/分配可指定具体任务，起呼按保存目标解析原专业主叫/线路/号码池；不新增号码池随意挑选或放宽原用途/引用保护。'])
}
for number,(title,deliverables,risks) in ENTRY_CURRENT_TASK_CHANGES.items():
    group=next(g for g in GROUPS if g['id']==tid(number))
    if title:group['title']=title
    if deliverables:group['deliverables']=deliverables
    if risks is not None:group['risks']=risks
for number,paths in {
    15:['js/adapters/task-business-import.js','scripts/task-business-import-model.js'],
    18:['js/adapters/four-node-execution.js'],
    30:['js/components/session-store.js','js/adapters/task-roster-view.js'],
    32:['js/adapters/ai-task-directory.js','scripts/ai_task_directory_build.py','scripts/ai_parity_build.py','scripts/ai-import-field-ui.js'],
    34:['js/adapters/task-business-import.js','js/adapters/task-roster-view.js','js/adapters/four-node-execution.js'],
    36:['scripts/ai_parity_build.py'],
    45:['js/adapters/task-business-import.js','scripts/task_business_import_build.py'],
}.items():
    group=next(g for g in GROUPS if g['id']==tid(number));group['prototype_reference_files']=unique(group['prototype_reference_files']+paths)

from profile_template_current_delta import apply_task_groups
GROUPS=apply_task_groups(GROUPS)

def topological(tasks):
    deps={t['id']:set(t['depends_on']) for t in tasks};order=[]
    while deps:
        ready=sorted(k for k,v in deps.items() if not v)
        if not ready:raise ValueError('Task dependency cycle: '+str(deps))
        for key in ready:
            order.append(key);deps.pop(key)
        for vs in deps.values():vs.difference_update(ready)
    return order

def build():
    plan=read(WS/'plan.json');ir=read(WS/'product-ir.json')
    lm={l['id']:l for l in plan['logic']['locals']};checks={c['id']:c for c in plan['acceptance_checks']}
    fields={f['id']:f for f in plan['logic']['fields']};pages=plan['ui']['pages']
    counts=collections.Counter(lid for g in GROUPS for lid in g['local_ids'])
    missing=set(lm)-set(counts);extra=set(counts)-set(lm);dups={k:v for k,v in counts.items() if v!=1}
    if missing or extra or dups:raise ValueError({'unmapped':sorted(missing),'unknown':sorted(extra),'duplicate':dups})
    feature_ac={f['id']:set(f['acceptance_ids']) for f in ir['features']}
    tasks=[]
    for g in GROUPS:
        ls=[lm[lid] for lid in g['local_ids']];test_ids=unique(c for l in ls for c in l['test_refs'])
        primary=sorted(set(f for l in ls for f in l['feature_ids']));aids=sorted(set(a for c in test_ids for a in checks[c]['acceptance_ids']))
        fids=set(primary);missing_acs=set(aids)-set().union(*(feature_ac[f] for f in fids))
        for ac in sorted(missing_acs):
            owners=sorted(f for f,acs in feature_ac.items() if ac in acs)
            if not owners:raise ValueError('Acceptance without source feature '+ac)
            fids.add(owners[0])
        ui_ids=sorted(p['id'] for p in pages if set(g['local_ids']) & set(p['local_logic_ids']))
        task={'id':g['id'],'title':g['title'],'goal':'；'.join(g['deliverables']),
              'feature_ids':sorted(fids),'primary_feature_ids':primary,'acceptance_ids':aids,
              'global_rule_ids':sorted(set(r for l in ls for r in l['global_rule_ids'])),
              'local_logic_ids':g['local_ids'],'field_ids':sorted(set(f for l in ls for f in l['field_ids'])),
              'ui_page_ids':ui_ids,'depends_on':g['depends_on'],
              'allowed_files':[],'context_files':[],'changes':[],
              'implementation_notes':g['deliverables']+g['risks']+[
                  '按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。',
                  '依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。',
                  '目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。'],
              'tests':[{**copy.deepcopy(checks[c]),'kind':'manual','command':None,
                        'execution_note':'保留原产品检查正文；目前为人工业务验收方案，开发须绑定自动化层次、环境与可执行命令后完成验证门禁。'} for c in test_ids],
              'done_when':g['deliverables']+[
                  '本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。',
                  '开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。',
                  '产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。'],
              'planning_status':'ready_for_engineering_binding','phase':g['phase'],
              'responsibility':{'implementation':'开发负责人指定的实现人员','acceptance':'测试负责人组织，产品/业务核对结果','engineering_decisions':'开发负责人','real_service_evidence':'对应服务或供应商对接负责人'},
              'engineering_binding':{'status':'required_from_development','repository':None,'module_owners':[],
                                     'required':['目标仓库','实际模块/服务责任','精确allowed_files/context_files/changes','字段物理存储和接口映射','同ID测试的真实环境与执行命令','共享文件冲突依赖'],
                                     'question_ids':g['engineering_question_ids']},
              'prototype_reference_files':[{'path':'../../prototype/'+p,'role':'只读行为参考，非生产可写目标'} for p in g['prototype_reference_files']]}
        tasks.append(task)
    order=topological(tasks)
    # Preserve all retained professional keys explicitly; FUNC-2002 is not a
    # substitute for their independent state/permission/result obligations.
    operations=read(ROOT/'fragments/platform.json')['retained_capability_specs']
    bylocal={lid:t['id'] for t in tasks for lid in t['local_logic_ids']}
    bytask={t['id']:t for t in tasks}
    operation_map=[]
    for op in operations:
        related=unique(bylocal[lid] for lid in op['local_logic_ids'])
        if not related:raise ValueError('Unowned professional operation '+op['operation_ref'])
        row={**copy.deepcopy(op),'primary_task_id':related[0],'related_task_ids':related}
        operation_map.append(row)
        for owner in related:bytask[owner].setdefault('retained_operation_refs',[]).append(op['operation_ref'])
    write(ROOT/'原专业操作任务映射.json',{'schema':'retained-operation-task-map@1','count':len(operation_map),'operations':operation_map})
    plan['tasks']=tasks
    # Empty typed collections keep this draft serializable, not resolved.
    # Physical mappings/notes stay unbound and the engineering gate stays open.
    for field in plan['logic']['fields']:field.setdefault('interfaces',[])
    write(WS/'plan.json',plan)
    write(ROOT/'实施任务拆分.json',{'schema':'business-implementation-tasks@1','scope':'完整当前产品范围，工程由开发绑定',
         'source_product_digest':read(WS/'product-review.json')['product_digest'],'task_order':order,'tasks':tasks,
         'engineering_boundary':'未选择生产技术栈、仓库或物理实现；本拆分不构成正式开工授权。'})
    report={'tasks':len(tasks),'locals':len(lm),'fields':len(fields),'pages':len(pages),'checks':len(checks),
            'features':len(plan['scope']['feature_ids']),'acceptance':len(ir['acceptance']),
            'each_local_owned_once':all(v==1 for v in counts.values()),'dependency_cycle':False,
            'engineering_bindings_complete':False,'task_order':order}
    write(ROOT/'任务覆盖摘要.json',report)
    print(json.dumps(report,ensure_ascii=False))

def render(out=OUT):
    out=Path(out);plan=read(WS/'plan.json');index=read(ROOT/'实施任务拆分.json')
    tasks=plan['tasks'];tm={t['id']:t for t in tasks};lm={l['id']:l for l in plan['logic']['locals']}
    operations=read(ROOT/'原专业操作任务映射.json')['operations'];gate=read(ROOT/'交接检查/handoff-gates.json')
    global_ready=next(g['status']=='passed' for g in gate['gates'] if g['id']=='G-GLOBAL')
    current=read(ROOT.parent.parent/'prototype/memory/http-e2e-acceptance-verification-20261101.json')
    latest=read(ROOT/'交接检查/current-runtime-summary.json')
    current_reg={'suites':latest['script_count'],'structuredPassed':latest['passed_cases'],'structuredFailed':latest['failed_cases']};current_http=current['groupCounts']
    current_scope='最新Step56记录'+str(current_reg['suites'])+'套/'+str(current_reg['structuredPassed'])+'结构化用例通过、'+str(current_reg['structuredFailed'])+'失败；Step55客户档案及Step56模板任务入口局部实际HTTP已核。Step54全流程仍'+str(current_http['passed'])+'组已验/'+str(current_http['partial'])+'组部分已验，完整验收未授予；本包只核对应源码身份，未重复跑回归或补齐未验。'
    esc=lambda v:str(v).replace('|','／').replace('\n',' ')
    lines=['# 实施任务索引','','[返回交接入口](README.md)','',''+str(len(tasks))+'个业务实施任务包覆盖完整当前产品；任务按可验收的职责分组，不按按钮计新增功能。每个LOCAL恰好有一个主实施任务，任务CHECK与本版产品规范逐项一致；相对上版的规则变更和验收修订保留溯源。','',
      '开发负责补目标仓库、实际模块/文件/物理接口及测试命令。空allowed_files不授代码写入权；本文逻辑依赖不增加用户操作门槛，也不代表共享真实文件已允许并行修改。','',
      '| 任务 | 实施结果 | 局部动作数 | 前置任务 |','|---|---|---|---|']
    for ident in index['task_order']:
        t=tm[ident];lines.append('| '+' | '.join(map(esc,[f"[{ident} {t['title']}](tasks/{ident}.md)",t['goal'],len(t['local_logic_ids']),', '.join(t['depends_on']) or '无业务任务依赖；工程入口仍须绑定']))+' |')
    lines+=['','## 责任边界','','- 开发负责人：选择工程上下文，指定实际实现人员并绑定生产模块、文件、接口和数据。','- 实现人员：逐LOCAL落实规则与异常，承接原CHECK，提交实现和验证证据。','- 测试负责人：组织逐任务及跨任务批次验收，区分Mock/契约/真实服务结果。','- 产品与业务/运营责任人：核对产品行为和实际操作结果；业务变化返回产品规格。','- 交接检查：仅检查当前证据和状态，不代任何责任人签署批准。']
    if (ROOT/'原型续接差异.md').exists():
        md(out/'原型续接差异.md',(ROOT/'原型续接差异.md').read_text())
    md(out/'实施任务索引.md','\n'.join(lines))
    for t in tasks:
        p=out/'tasks'/f"{t['id']}.md";text=p.read_text().split('\n\n## 本轮工程绑定边界',1)[0]
        text+='\n\n## 本轮工程绑定边界\n\n本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。\n\n'
        text+='只读原型行为参考：\n\n'+'\n'.join('- ['+Path(r['path']).name+'](../'+r['path']+') · '+r['role'] for r in t['prototype_reference_files'])
        text+='\n\n需开发处理的问题：'+(', '.join(t['engineering_binding']['question_ids']) or '统一工程七项与本任务物理绑定')+'。\n'
        if t.get('retained_operation_refs'):text+='\n原专业操作：\n\n'+'\n'.join('- ['+key+'](../原专业操作任务映射.md#'+key+')' for key in t['retained_operation_refs'])+'\n'
        md(p,text)
    lines=['# 原专业操作的任务责任','','[返回交接入口](README.md)','','222个原operation_key分别保留权限、输入、状态和结果。主任务负责交付，关联任务承接共享规则，不以导航整合替代专业能力。','']
    for op in operations:
        lines+=['<a id="'+op['operation_ref']+'"></a>','## '+op['operation_ref']+' · '+op['name'],'',
                '主任务：['+op['primary_task_id']+'](tasks/'+op['primary_task_id']+'.md)；相关任务：'+', '.join('['+t+'](tasks/'+t+'.md)' for t in op['related_task_ids'])+'。',
                '页面：'+op['page_id']+'；原ACTION：'+', '.join(op.get('source_action_ids',[]))+'。',
                '触发：'+op['trigger'],'输入：'+'；'.join(op['input_constraints']),
                '状态：'+'；'.join(op['state_constraints']),'权限：'+op['permission'],'结果：'+op['result'],'异常：'+op['error'],
                '详细逻辑：'+', '.join('['+l+'](local-logic/'+l+'.md)' for l in op['local_logic_ids']),
                '检查：'+', '.join(op['test_refs']),'']
    md(out/'原专业操作任务映射.md','\n'.join(lines))
    lines=['# 开发工程绑定清单','','[返回交接入口](README.md)','','工程上下文由开发决定。本清单说明需要交回的内容及关闭条件，不指定技术栈、库表、服务框架或仓库路径。','',
       '| 工程项 | 开发交回的内容 | 关闭条件 |','|---|---|---|',
       '| 目标仓库/脚手架 | 实际目录、分支/版本、入口、安装构建/启动办法、脚手架复验记录 | 快照可访问；入口命令真实可复验 |',
       '| 技术栈与编码规范 | 版本、团队标准来源、适用范围及编码/协作约定 | engineering七项有当前证据，继承标准标版本 |',
       '| 后端与模块 | 服务边界、责任、错误和未知处理、每个LOCAL的实际模块归属 | local.module与工程模块、技术方案一致 |',
       f"| 数据职责 | {len(plan['logic']['fields'])}字段的物理保存/读取/原子与唯一性映射、租户及版本控制 | persistence.mapping具体；未来事实快照与当前值不混；不新增旧规划迁移 |",
       '| 接口 | 真实输入/输出、角色/范围、事件身份/终态、重试/幂等/取消/核对证据 | 字段interfaces/interface_note与契约一致，缺能力有正式差异结论 |',
       '| 精确文件与依赖 | '+str(len(tasks))+'任务的真实allowed_files/context_files/changes和模块责任 | 文件集合一致，创建/更新状态正确，共享写入有先后依赖 |',
       f"| 验证 | 当前{len(plan['acceptance_checks'])}项CHECK的层次、环境、命令及结果，跨任务批次和供应商联调 | 同ID验收正文不改；非空命令真实可执行，人工步骤可复现 |",
       '', '## 现有12组工程问题','', '| 问题 | 当前待交证据 | 受影响任务 |','|---|---|---|']
    for q in plan['open_questions']:
        owners=[t['id'] for t in tasks if q['id'] in t['engineering_binding']['question_ids']]
        lines.append('| '+' | '.join(map(esc,[q['id'],q['question'],', '.join(owners)]))+' |')
    lines+=['','这些问题继续保持原阻塞状态。登记开发责任不表示已解决，也不以本地Mock替代真实认证、供应商、财务或CTI证据。']
    md(out/'开发工程绑定清单.md','\n'.join(lines))
    lines=['# 交接门禁检查','','[返回交接入口](README.md)','','本轮检查分为产品/任务资料承接、原型有限Mock制作验收、工程开工与版本批准。资料可交开发补工程，不等于允许直接实施业务代码。','',
       '| 门禁 | 当前结果 | 关闭依据 / 下一步 |','|---|---|---|']
    for g in gate['gates']:lines.append('| '+' | '.join(map(esc,[g['name'],g['status'],g['summary']]))+' |')
    lines+=['','## 已执行与未执行','',current_scope+' 产品/任务/源与包核查另列。下载落地、真实音频、未知回执/停止等未验组合及file/真实CTI/供应商/认证/账务分列，不生成工程执行授权。','',
       '完整机器结果：[handoff-gates.json](handoff-gates.json)。原始检查：[证据目录](gate-evidence/README.md)。',
       '', '## 原型正式门禁的具体处理','',
       ('当前S8/final制作门禁的状态以本页门禁表及准确证据为准。原16条Partial的历史处置保留溯源；当前Step54实际覆盖和工程真实子条件分别核定。源码/标准变化后仍须重新验证，不能复用旧通过。' if global_ready else '当前S8/final制作门禁保持阻塞，按实际缺证补验后用受控工具记录。历史Step28、localTenant、旧S8/final只保当时事实，不能替代当前Step54；9组部分已验不自动等同9个产品缺陷，真实服务与工程子条件继续由开发核证。'),
       '', '| 类别 | 数量 | 责任与关闭办法 |','|---|---|---|']
    for group in gate['prototype_blocker_groups']:lines.append('| '+' | '.join(map(esc,[group['category'],group['count'],group['action']]))+' |')
    lines+=['','## 原16条Partial的范围核定','','下表只关闭已实测的原型部分；真实供应商、认证/CTI/账务等工程要求保留，不改为生产通过。旧原文/状态及当前对照均保留。','','| 原条目 | 关联任务 | 原型结论 / 开发责任 |','|---|---|---|']
    scope_file=ROOT/'交接检查/prototype-scope-boundary.json'
    for row in (read(scope_file)['rows'] if scope_file.exists() else []):
        lines.append('| '+' | '.join(map(esc,[row['requirement_id'],', '.join(row['task_ids']),row['status']+'；'+row['prototype_scope']+'；开发：'+', '.join(row['development_open_questions'])]))+' |')
    lines+=['', '## 正式确认与导出','',
       '当前版本台账没有正式阶段批准记录，现规划使用current/standalone。产品语义复核是真实Codex复核，不等于业务/运营或开发联合批准。责任人实际审阅当前内容/摘要后，通过受控版本工具登记证据；源或工程变化后重新检查，旧批准不能复用。',
       '', '正式导出仍使用原项目与规划工具的检查；此检查报告及'+str(len(tasks))+'个任务不生成execution-authority，也不替代开工前check-package。']
    md(out/'交接门禁.md','\n'.join(lines))
    # Scoped acceptance batches reuse CHECK IDs; no duplicate test ownership.
    batches=[('BATCH-01','身份/租户/模块/撤权及资源权限',list(range(1,8))+[49,50,51,52,53,54,55,56]),
             ('BATCH-02','字段/分类/参考模板/实际路由/两模式导入',list(range(8,16))),
             ('BATCH-03','DIRECT人工/AI/预外呼完整周期及启用模板',[16,17,18,19,20,21,22,28,29,30,31,39]),
             ('BATCH-04','TEMPLATE入口/条件/流转/转交/结束与再次办理',[18,19,20,21,23,24,25,26,27,29,30]),
             ('BATCH-05','原AI/Cloud/IVR/接口/报表/服务专业能力',list(range(32,57))),
             ('BATCH-06','未知/重试/并发/迟到/同号限制/跨域可见性',[6,14,15,18,19,20,21,22,25,26,28,29,30,31,38,39,46])]
    lines=['# 接包与验收执行顺序','','[返回交接入口](README.md)','','1. 产品/开发/测试先选任务，沿LOCAL/FIELD/UI/CHECK核对职责和异常；本次任务依赖是实施关系，不新增运行时前置步骤。','2. 开发交回工程七项、目标仓库与12组契约证据，绑定精确文件、模块、数据/接口和命令；补共享文件依赖后才能决定真正的并行范围。','3. 各实现任务保原验收ID、步骤和预期，先验证本动作，再按下面批次做联调；人工方案不代表已有自动化脚本。','4. '+current_scope+'开发实现/源变化后按同准则复验，真实服务/供应商联调仍由对应负责人提供证据。','5. 完成当前版本真实业务/运营/工程联合复核和标准快照记录，重新validate/review --stage development，正式导出并在开工前现场check-package。','',
       '工程未绑定前可以进行开发设计和技术验证；本包不授予正式业务实现许可。','', '## 跨任务验收批次','']
    batch_rows=[]
    for ident,name,nums in batches:
        ts=[tid(n) for n in nums];cs=unique(c['id'] for t in tasks if t['id'] in ts for c in t['tests'])
        batch_rows.append({'id':ident,'name':name,'task_ids':ts,'check_ids':cs,'owner':'测试负责人组织，对应业务/开发负责人核对','status':'not_executed_by_this_handoff_check'})
        lines+=['### '+ident+' '+name,'','任务：'+', '.join('['+t+'](tasks/'+t+'.md)' for t in ts)+'。','复用 '+str(len(cs))+' 个原CHECK，按各任务原文执行；当前未声称完成该批次真实工程联调。','']
    md(out/'接包执行顺序.md','\n'.join(lines));write(out/'验收批次.json',batch_rows)
    write(out/'任务覆盖核查.json',read(ROOT/'交接检查/task-coverage.json'))
    write(out/'原专业操作任务映射.json',read(ROOT/'原专业操作任务映射.json'))
    write(out/'handoff-gates.json',gate)
    evidence=out/'gate-evidence';evidence.mkdir(exist_ok=True)
    for f in (ROOT/'交接检查').rglob('*.json'):write(evidence/f.relative_to(ROOT/'交接检查'),read(f))
    md(evidence/'README.md','# 本轮交接检查证据\n\n这些文件是实际只读检查结果，不是业务/运营批准。product-validation.json、development-validation.json为原工具完整结果；prototype-s7/s8/final.json为本次实际预检；task-coverage.json为逻辑任务覆盖；source-fingerprints.json/current-runtime-summary.json核最新Step56回归对应191文件身份，未重复跑70套；current-http-acceptance.json保Step54的13组已验/9组部分已验及Step55/56独立局部结果和未验边界。其余旧prototype-*报告只保各自日期/范围，不代替当前Step56局部或Step54部分结论；version-state.json保留真实版本阶段状态。')
    # Keep the real independent product review without inventing a development review.
    review=read(WS/'product-review.json');write(out/'product-review.json',review)
    source_evidence=Path(review['evidence']['path']);md(out/'product-semantic-review.md',source_evidence.read_text())
    md(out/'task-handoff-review.md',(ROOT/'实施任务与门禁复核.md').read_text())
    entry=out/'README.md';text=entry.read_text()
    import re
    text=re.sub(r'<!-- CURRENT-PROTOTYPE-RESUME -->[\s\S]*?<!-- /CURRENT-PROTOTYPE-RESUME -->\n*','',text)
    if '## 本次接包入口' in text:
        a=text.index('## 本次接包入口');b=text.index('## 从这里开始',a)
        text=text[:a]+text[b:]
    text=text.replace('**DRAFT — 供讨论与补充，尚未完成本阶段交接**',
        '**实施任务交接版：产品与任务内容已检查；工程由开发绑定，正式开工门禁保持关闭。**\n\n本包保留原工具DRAFT状态，不是READY_FOR_DEVELOPMENT或执行授权。')
    a=text.index('## 从这里开始')
    text=text[:a]+'''## 本次接包入口

- [实施任务索引](实施任务索引.md)：稳定任务ID、目标、依赖、LOCAL/FIELD/UI/CHECK及责任。
- [交接门禁结果](交接门禁.md)：通过项、原型全局复验项、工程和真实评审责任。
- [开发工程绑定清单](开发工程绑定清单.md)：由开发决定的内容及关闭条件。
- [接包和验收执行顺序](接包执行顺序.md)：开发绑定、逐任务、跨任务联调和正式导出顺序。
- [222个原专业操作的主任务](原专业操作任务映射.md)：防止入口整合吞掉既有能力。

下文原工具门禁中的工程缺项仍是真实开放项；当前空文件清单和人工验收方案不表示生产实现或自动化命令已就绪。

'''+text[a:]
    text=text.replace('这是开发规划说明，业务实现和运行时测试尚未完成。','本次产品/任务规划已完成；当前原型制作门禁结果见交接门禁，生产业务实现与真实工程验证仍需开发承接。')
    text=text.replace('| 通过 | 草稿，未声明语义门禁通过 | PM；', '| 通过 | 当前内容复核记录current；DRAFT未声明正式语义交接门禁通过 | PM；')
    text=text.replace('本包是草稿；即使某项检查无错误，也不据此声明任一语义门禁已通过。可先澄清缺口、开展开发准备。','本包是DRAFT。产品确定性检查通过，独立内容复核记录为current，见product-review.json及复核证据；这是资料内容核对，未声明正式语义交接门禁、业务运营批准或开发联合批准通过。工程与实施阶段仍待补齐，可开展开发准备。')
    md(entry,text)
    if (ROOT/'续接记录/projection-result.json').exists():
        text=entry.read_text();marker='## 本次接包入口'
        intro='<!-- CURRENT-PROTOTYPE-RESUME -->\n本版已承接当前原型步骤29～56。客户档案全来源统一只读归集，模板AI任务先选、自动目录和准确场景带出，冷恢复与滚动保持按最新局部规格执行。入口分为任务DIRECT与业务分类TEMPLATE：任务按既有AI/预外呼手工或接口来源锁定任务/场景/分类，分类只人工/接口入模板；不新增AI第三来源，不保留模板直接跟进设置。AI场景schema2按scene/platform配置IMPORT_FIELD与CUSTOM_COLUMN，保唯一“添加字段”入口及选择/配置弹窗；实际导入字段先确定方式和场景。任务原表合并新统一业务与旧历史，旧缺新字段留空；五档、人工分配、PRED只任务和原权限保持。受控缺内容废弃与正常archive分开，停止中原受理事实按原ID收敛，新运行不沿用旧队列事实；历史END来源仍只按准确旧周期解释。AI准确已有任务目录、任务导入到执行的配置指纹、有效必填展示、主名单刷新和场景快速重开均承接当前修复。原'+str(len(tasks))+'任务号保留，现为'+str(len(plan['logic']['locals']))+'个局部动作、'+str(len(plan['logic']['fields']))+'个当前逻辑字段及'+str(len(read(WS/'product-ir.json')['acceptance']))+'个验收条目。'+current_scope+'\n\n[当前HTTP实际验收与修复报告](../../prototype/'+current['report']+')、[当前需求记录](../../prototype/docs/四节点与客户跟进闭环需求记录.md)、[当前产品内容复核](product-semantic-review.md)和[开发验证边界](当前原型验证边界.md)分别说明事实、规则、复核及未验范围。当前规范输入位于工作资料/续接输入；原始审计与冻结保其原结论，旧字段只保追溯，不恢复当前已移除控件。\n<!-- /CURRENT-PROTOTYPE-RESUME -->\n\n'
        md(entry,text.replace(marker,intro+marker,1))
    if (ROOT/'审计整改记录-20261030.md').exists():
        text=entry.read_text();line='\n[历史20261030审计整改记录](../工作资料/审计整改记录-20261030.md)：仅保当时问题、修复、复验及门禁范围，不代替当前Step54结论。\n'
        if line.strip() not in text:md(entry,text+line)
    if (ROOT/'原型全局验收报告-20261030.md').exists():
        text=entry.read_text();line='\n[历史20261030原型S8/final报告](../工作资料/原型全局验收报告-20261030.md)：仅保当时受控范围、修复与工程边界，不代替当前Step54结论。\n'
        if line.strip() not in text:md(entry,text+line)
    from developer_appendices import render as render_appendices
    render_appendices(out)
    reindex(out)
    print(json.dumps({'output':str(out),'tasks':len(tasks),'operations':len(operations),'gates':[(g['id'],g['status']) for g in gate['gates']]},ensure_ascii=False))

def reindex(out):
    m=read(out/'manifest.json')
    if m['status']!='draft':raise ValueError('Never rewrite a confirmed delivery')
    m['files']=[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(out.rglob('*')) if p.is_file() and p.name!='manifest.json']
    m['handoff_scope']='产品与逻辑实施任务移交；工程由开发绑定，不授业务代码执行权'
    m['reader_extension']={'source':'implementation_tasks.py render','business_projection_unchanged':True,'formal_approval_created':False}
    write(out/'manifest.json',m)

if __name__=='__main__':
    if sys.argv[1]=='build':build()
    if sys.argv[1]=='render':render(Path(sys.argv[2]) if len(sys.argv)>2 else OUT)
