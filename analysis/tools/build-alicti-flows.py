"""Derive the independent AliCti business-flow branch; never writes the source."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD = ROOT.parents[1] / 'work/baseline-current'

def read(path):
    return json.loads(path.read_text())

def write(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')

def transform(value):
    if isinstance(value, str):
        for a,b in [('阿里云 CCC','AliCti'),('阿里云CCC','AliCti'),('品牌实例','品牌供应商账号'),('实例','供应商账号'),('阿里','AliCti'),('CCC','AliCti'),('MQ 通道事件','后台话务事件'),('MQ事件','后台话务事件'),('MQ 事件','后台话务事件')]:
            value=value.replace(a,b)
        return value
    if isinstance(value,list): return [transform(v) for v in value]
    if isinstance(value,dict): return {k:transform(v) for k,v in value.items()}
    return value

# Step overrides express business effects as well as supplier-specific constraints.
CHANGES = {
 'SC-003': {
  1:('在当前租户申请新建坐席；旧RAM导入保持规划边界','不提供未经核验的AliCti RAM导入入口'),
  3:('准备工号、姓名、区号和目标供应商账号','cno、name、areaCode；平台账号与坐席独立'),
  4:('按当前供应商账号创建坐席','返回坐席信息或明确错误；响应不确定时先核查'),
  5:('核对实际坐席工号及供应商账号归属','以enterpriseId和cno定位，不把请求ID当坐席ID')},
 'SC-005': {
  3:('停用先阻止新任务并等待在途通话/话后完成；恢复先复检资源','未安全结束保持待停用，不强制挂断'),
  4:('在安全状态执行坐席变更并反馈结果','active/isOb等更新；在线限制或失败保持待处理，删除需对应契约核验'),
  5:('安全条件和厂商操作结果均已确认？','未确认不伪造停用、恢复或删除成功')},
 'SC-006': {3:('准备本租户独占的技能与队列映射','企业账号内资源唯一归属'),4:('按经核验的技能/队列配置处理资源','具体创建与路由隔离仍需补证；原型只模拟候选契约')},
 'SC-007': {3:('读取既有技能并形成完整目标技能列表','保留未修改技能；等级方向和值域单独映射'),4:('全量更新坐席技能并返回逐项结果','skillIds/skillLevels；小值优先，逐个核对failCno'),5:('目标坐席均已确认成功且技能列表一致？','部分失败不当全量成功，在线限制明确提示')},
 'SC-008': {1:('选择供应商已有号码同步或外部号码接入路径','两种来源分别管理'),2:('完成线路开通和必要配置','外部号码接入契约待核验；导入不等于开通'),3:('查询已开通号码；外部来源仅在接入确认后登记','未核验接入不展示厂商成功'),4:('返回企业号码、用途、状态与中继组信息','按enterpriseId查询可用资源；不由查询推断开通能力')},
 'SC-009': {3:('按经验证的号码及入口规则执行隔离或恢复','厂商执行契约未完备时保留待核验，不能宣布呼入已阻断'),4:('用途、入口兜底及执行结果均已核实？','仅本地冻结不等于供应商线路已停用')},
 'SC-011': {4:('部署对应语音导航及号码入口配置','IVR导入与号码绑定/发布分开核验；保留供应商配置前提'),5:('发布、号码入口与租户分支映射均已验证？','文件导入成功不等于路由已生效')},
 'SC-014': {4:('确认提交配置及可选客户关联，保持未启动','禁止定时/导入自动启动，草稿不占用名单'),6:('名单、授权及坐席/外呼组任务互斥均满足？','核对最小可用坐席、并发、额度、流程及重呼开通条件'),7:('冻结来源快照并核对名单实际导入结果','跨批同号不因任务默认排重丢失；部分失败保留明细'),8:('启动预测任务，客户接听后分配本租户坐席','type=1；一坐席/外呼组只能处于一个运行任务'),10:('按预测事件与话单校准原通话和批次','客户接听、双方接听、重呼轮次与最终尝试分别记录')},
 'SC-015': {4:('确认提交配置及可选客户关联，保持未启动','禁止导入/定时自动启动，草稿不占用名单'),6:('名单、用号权及已验证的语音导航执行条件有效？','纯IVR零坐席、转人工资源及节点输出是POC前提'),7:('冻结来源快照并核对名单实际导入结果','为批次客户建立独立映射，避免跨批同号被任务排重'),8:('启动自动任务并转入指定语音导航','type=2，ivrId或ivrName；纯IVR/转人工结果条件化验证'),10:('归集IVR轨迹和适用话单，更新原批次','未知保持待确认；纯IVR不等待虚构人工录音')},
 'SC-017': {2:('在已验证的号码入口与语音导航中锁定唯一租户','不明确归属进入异常，不路由到任意租户'),5:('自有界面收到来电并通过软电话接听','CTILink.SipSession接听；音频状态与业务接通分开'),8:('结束后归集来电话单与媒体并保存话后','系统应答不计人工接听；保存前保护就绪状态')},
 'SC-019': {1:('分别提供话务事件、分类话单和媒体状态','后台推送/企业事件流是候选来源；可靠补偿待验证'),2:('以供应商账号和通话关联去重并持久化证据','企业全量事件须在后端校验租户与坐席归属'),5:('返回对应呼叫类型的话单及可核验终态','人工upTime是坐席接起，预测upTime是客户接听'),8:('独立更新录音和ASR可用性','录音地址过期可刷新；ASR处理中不伪造文本/时间轴')},
 'SC-101': {6:('原子保存平台账号与本租户坐席的一对一关系','平台accountId—本地坐席ID—enterpriseId/cno，UUID不参与')},
 'SC-102': {4:('初始化电话组件、注册事件并取得本人短期登录材料','setup回调后注册事件；后端校验绑定后申请sessionKey'),5:('电话就绪后处理业务；无在途和未保存结果时申请下线','拨号/接听/挂断沿用原操作权限'),6:('通话结束且结果已保存，并允许完全退出？','不满足则保留会话与输入'),7:('确认完全下线成功后释放本地会话与锁','logoutMode=1；退出失败不伪造离线')},
 'SC-103': {3:('客户、本人电话会话、禁呼及资源复检通过？','业务就绪与媒体可用均须满足'),4:('以本人坐席发起预览外呼','previewOutcall带requestUniqueId，回调成功不等于客户接通'),5:('按实际状态静音或挂断，并填写话后结果','mute为切换操作，失败不盲重试；客户/坐席状态独立'),8:('业务结果保存后才允许继续接收新任务','结合置忙/整理/置闲处理；厂商整理到期行为需POC')},
 'SC-105': {6:('当前任务状态和资源互斥检查通过？','已结束不能继续；长期暂停自动结束须同步原因'),7:('按本地草稿或厂商任务选择控制路径','type=1/2任务控制；无厂商任务不虚构调用'),8:('厂商结果与在途保护均已确认？','暂停/结束影响在途的语义待POC，不强行改通话终态')}
}

index=read(ROOT/'scenarios/scenario-index.json')
for entry in index['scenarios']:
    if entry['scope']!='in_scope':continue
    sid=entry['id']; original=read(OLD/entry['file']); detail=transform(original)
    detail['name']=entry['name']; detail['summary']=entry['result']
    detail['source_refs']=['inputs/baseline-reference/scenarios/'+sid+'.json','inputs/source-index.json#SRC-302','inputs/source-index.json#SRC-303']
    write(ROOT/'inputs/baseline-reference'/entry['file'], original)
    for step in detail['main_flow']:
        override=CHANGES.get(sid,{}).get(step['step'])
        if override:
            step['action'],step['system_response']=override
            step['input']='当前租户及enterpriseId范围内经授权的业务上下文'
    for node in detail['flow_diagram']['nodes']:
        if node.get('step_ref') in CHANGES.get(sid,{}):
            step=next(s for s in detail['main_flow'] if s['step']==node['step_ref'])
            node['label']=step['action'] if node['type']=='decision' else step['action']+'\n'+step['system_response']
    if sid=='SC-102':
        for node in detail['flow_diagram']['nodes']:
            if node['id']=='N4-AliCti': node['label']='处理本人坐席登录及软电话媒体连接\n返回登录结果和实际状态'
            if node['id']=='READY-CHECK':node['label']='登录与软电话就绪均已确认？'
        detail['alternate_flows'][-1]['condition']='初始化、短期令牌、坐席登录或软电话就绪失败/未确认'
        detail['alternate_flows'][-1]['continuation']='先核对登录状态，过期令牌重新申请；不自动重复拨号。'
    if sid=='SC-105':
        for node in detail['flow_diagram']['nodes']:
            if node['id']=='CLOUD_CONTROL':node['label']='AliCti任务控制\n暂停/启动继续/结束；结果不明先回查，不自动重拨'
    if sid=='SC-014':
        for node in detail['flow_diagram']['nodes']:
            if 'Core SDK answer' in node['label']:node['label']='本租户就绪坐席在自有界面接听\nCTILink软电话音频；客户与坐席接听分别确认'
    if sid=='SC-003':
        detail['acceptance_points']=['新建坐席不依赖外部人员目录；旧RAM导入仅保留历史规划，不新增AliCti导入承诺。','确认enterpriseId/cno实际创建结果并保存唯一租户归属；失败不重复建号。']
    # Preserve existing independent media and multi-branch routes; remove obsolete vendor notes.
    detail['notes']=['AliCti独立分析：保留业务分支及原SC编号；原型仅模拟，图形不是生产联调证据。','enterpriseId是供应商账号ID，UUID不用于接口；平台租户与人员账号独立。','缺乏端到端证据的厂商动作是条件化设计，须在S4/G2逐项核验。']
    detail['postconditions']=[entry['result']]
    write(ROOT/entry['file'],detail)

rules=transform(read(ROOT/'inputs/baseline-reference/memory/business-rules.json'))
for b in rules['business_rules']:
    b['source_refs']=['inputs/source-index.json#SRC-301','inputs/source-index.json#SRC-303']
    if b['id']=='BR-003':b['statement']='在本租户创建并核实enterpriseId/cno身份；旧RAM导入仅保留原规划边界，不构造AliCti支持承诺。'
    if b['id']=='BR-007':b['statement']='技能全量更新须保留未修改项，核对逐坐席失败；AliCti小值优先，原等级页面与厂商值域/路由映射待核验。'
    if b['id']=='BR-102':b['statement']='setup回调后注册事件，后端验证本人绑定并申请30秒sessionKey；CTILink登录/媒体就绪后可呼叫；完全下线成功才释放会话，通话/未保存话后不退出。'
    if b['id']=='BR-103':b['statement']='本人坐席previewOutcall，requestUniqueId用于关联不证明幂等；静音切换不可盲重试；业务结果保存后才允许接收后续任务，自动整理到期须验证。'
    if b['id']=='BR-019':b['statement']='按enterpriseId及通话ID归属持久化事件，分类映射客户/坐席时间与接听状态；话单校准不重拨，未知不当未接；录音ASR分别就绪。'
for f in rules['business_flows']:
    f['source_refs']=['inputs/source-index.json#SRC-301','inputs/source-index.json#SRC-302','inputs/source-index.json#SRC-303']
    if f['id']=='FLOW-101':
        f['steps'][4]='本人绑定检查后完成CTILink初始化、短期令牌、登录和媒体就绪；人工预览外呼'
        f['steps'][5]='后台话务事件按enterpriseId与通话归属持久化；客户接通和双方接听分别记录'
    if f['id']=='FLOW-201':
        f['steps'][2]='在enterpriseId下创建坐席，确认cno及租户归属；原RAM导入不当作AliCti能力'
        f['steps'][4]='映射本租户技能/队列，全量更新成员技能并核对逐项失败与优先级'
    if f['id']=='FLOW-202':
        f['steps'][3]='单独启动前核对名单、供应商限额、坐席/外呼组互斥和最小可用坐席；明确关闭自动启动'
        f['steps'][4]='type=1预测或type=2自动IVR执行；暂停/继续/结束受厂商状态约束，在途保护需验证'
    if f['id']=='FLOW-203':f['steps'][1]='在已验证的号码入口上配置语音导航及租户分支；导入文件成功不等于发布生效'
write(ROOT/'memory/business-rules.json',rules)

facts=transform(read(ROOT/'inputs/baseline-reference/memory/project-facts.json'))
facts={k:facts[k] for k in ['schema_version','project','actors','systems','scope','product_structure','state_models','assumptions'] if k in facts}
facts['project']={'name':'AliCti独立原型与业务图集','version':'0.1.0-alicti-review','objective':'继承现有26场景及页面底座；enterpriseId承接供应商账号范围；形成独立原型、流程与时序，严格区分模拟与真实接口证据。'}
facts['assumptions']=['本轮仅模拟原型，不发真实电话或生产接口请求。','厂商资源隔离、路由发布、任务在途、结果关联与媒体时间轴均待POC；未冻结。']
facts['systems']=[{'name':'平台前端与业务服务','description':'维护平台账号/租户、客户分配、来源快照、话后、统一状态与报表；演示使用独立Mock。'},{'name':'AliCti API','description':'enterpriseId资源范围；供应商坐席、技能、号码、任务及话单/媒体候选接口。'},{'name':'CTILink与WebRTC','description':'自有界面的电话控制与媒体；短期sessionKey、实际状态和设备条件独立验证。'},{'name':'后台推送与补偿服务','description':'接收企业事件/HTTP推送、归属隔离、持久化、去重与话单回查；不自动重拨。'},{'name':'既有AI外呼供应商','description':'原智能外呼业务域及计费报表保留，不自动迁移。'}]
facts['scope']['in']=[x.replace('自有 UI + AliCti Core SDK 3.x + 本人身份后端代理；后端接收 MQ、幂等归一、最终 CDR 校准、待确认与数据异常核查。','自有UI + CTILink + 本人身份后端校验；后台接收话务事件、归一与分类话单校准，未知保留待确认。') for x in facts['scope']['in']]
for model in facts.get('state_models',[]):
    model['transitions']=[str(x).replace('客户侧有效 Established 证据确认客户接通；坐席接通不替代客户接通','按呼叫类型的客户接听事件/话单确认客户接通；坐席接听不替代客户接通').replace('单通道 Released 不结束整通；最终 ReleaseTime 或本地演示明确结束动作界定结束','以同次通话终态证据确认结束；单侧事件不直接认定整通结束').replace('结束后通过 AliCti CDR/适用的 ListAttempts 校准，缺证据保持待确认；迟到证据不使已结束通话复活','结束后通过对应类型AliCti话单校准，证据不足保持待确认；迟到证据不重新开启通话') for x in model.get('transitions',[])]
for actor in facts['actors']:actor['source_refs']=['inputs/source-index.json#SRC-301']
write(ROOT/'memory/project-facts.json',facts)
print('Wrote 26 scenario graphs and 6 business flows; source files unchanged.')
