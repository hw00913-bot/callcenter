import json,re
from pathlib import Path
P=Path(__file__).resolve().parents[1]
def read(s):return json.loads((P/s).read_text())
def write(s,d):(P/s).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def tr(s):
 for a,b in [('品牌实例','品牌供应商账号'),('实例','供应商账号'),('阿里云 CCC','AliCti'),('阿里','AliCti'),('CCC','AliCti')]:s=s.replace(a,b)
 return s
stories=read('memory/normalized-user-stories.json')['user_stories']; ac={a['id']:a['statement'] for s in stories for a in s['acceptance_criteria']};byus={s['id']:s for s in stories}
original=read('inputs/baseline-reference/memory/feature-list.json');features=[]
overrides={
 '210':'按enterpriseId创建供应商坐席，填写cno、name、areaCode及所需状态；明确成功后保存本地租户归属。',
 '211':'坐席导入能力待确认；保留入口位置与待确认提示，不展示可执行供应商导入或成功结果。',
 '213':'查看失败对象原因；供应商查证与重试契约未明确时显示待确认，禁止重复创建。',
 '214':'本地先限制新任务；active/isOb按文档更新，在线限制及在途影响待确认，不凭受理结果宣告安全停用。',
 '215':'复核本地授权并按文档更新坐席状态；未知显示待确认，恢复不等于已上线。',
 '216':'删除供应商坐席能力待确认；不虚构远端成功或提前释放占用，保留历史。',
 '219':'保存中台逻辑技能配置；供应商技能/队列创建及租户隔离能力待确认，不标为远端已生效。',
 '221':'按完整skillIds/skillLevels列表添加成员技能；保留其他技能，最多100坐席，逐项检查failCno。',
 '222':'按skillLevels小值优先调整；有效取值范围待确认，不预设无依据范围。全量提交完整技能列表并检查部分失败。',
 '223':'形成移除后的完整技能列表并全量更新；skillIds=0表示清空，逐项失败不得伪造成功。',
 '229':'登记已确认开通的本地线路资料；供应商开通能力待确认，登记不是线路开通。',
 '231':'企业号码导入能力待确认；页面不显示已开通或远端导入成功。',
 '232':'按enterpriseHotline/listPage同步已有号码并核对enterpriseId；远端新增关联能力待确认。',
 '236':'本地冻结新外呼；供应商号码隔离及呼入入口控制待确认，不宣称已切断远端呼入。',
 '237':'复核本地授权与已知号码状态；供应商恢复和入口控制待确认，不自动恢复任务。',
 '245':'创建type=1预测任务，autoStart=0；明确最少空闲人数1–10及默认10、autoComplete策略，不启用autoDelete。名单导入显式importTelAutoStart=0。',
 '246':'创建type=2自动IVR任务，指定ivrId或ivrName，autoStart=0；IVR发布和号码绑定待确认。名单导入显式importTelAutoStart=0。',
 '249':'复检名单、授权、坐席/外呼组任务互斥和空闲人数；任务启动接口待确认，不虚构启动成功。',
 '111':'按task/pause提交暂停；pauseDuration默认0但单位待确认；受理后显示处理中，在途影响或终态未知保持待确认。',
 '112':'任务恢复接口待确认；已结束任务不可恢复，不模拟继续成功。',
 '113':'本地未创建供应商任务的记录可结束；已有taskId按task/stop提交，结果及在途影响未知保持待确认，保留历史。',
 '250':'本地从未启动且无通话的草稿经确认删除并释放客户；已有供应商taskId的远端删除能力待确认。',
 '251':'保存本地呼入配置；ivrProfile/import仅导入定义，发布、号码绑定及租户分流待确认，不标远端已生效。',
 '253':'对来源已明确的现有来电，以CTILink软电话接听；系统应答与人工接听分开。路由配置能力待确认。',
 '254':'呼入服务时段、排队、再分配及兜底执行规则待确认；已有话单按实际结果归集，不模拟配置已生效。',
 '258':'CTILink setup回调后注册事件；后端核验本人enterpriseId/cno并获取30秒sessionKey及agentGateWayUrl；bindType=3登录，实际媒体就绪后可呼叫。',
 '259':'无在途及未保存结果时logoutMode=1完全退出；实际成功后释放会话，失败保留待确认。',
 '104':'本人坐席previewOutcall，使用obClid/requestUniqueId/callVariables；保持原客户来源，请求成功不等于客户接听。',
 '260':'校验本人通话后Session.mute按指定方向切换；结果未知不盲重试，不把点击当成功。',
 '261':'校验当前静音态后使用Session.mute切换；状态未知先核对，禁止盲重试。',
 '262':'按CTILink会话/软电话适用操作结束通话；实际终态确认前保持处理中，不自动重拨。',
 '263':'按enterpriseId和通话归属保存推送、去重并分类查话单：人工upTime坐席、bridgeTime客户；预测相反。状态及重呼轮次分别解释，未知待确认。',
 '266':'播放授权有效录音URL，默认120分钟；支持基础播放工具。ASR时间单位、偏移及多段对齐待确认，不伪造可靠文本定位。',
 '271':'按人工/预测/呼入各自话单核对原通话；时间窗<=1月，普通分页最多10万或scroll；查询无数据保持待确认，不重拨。',
 '282':'按当前授权获取可用录音地址并下载；地址过期重新申请，保留演示音频标识。'
}
for f in original['features']:
 num=f['id'].split('-')[1];name=tr(f['name']);desc=overrides.get(num,tr(f['description']))
 b=f['boundary']; rules=[ac[x] for x in f['source_acceptance_ids'] if x in ac]
 features.append(dict(id=f['id'],version='0.2.0-alicti',module_l1=f['module_l1'],module_l2=tr(f['module_l2']),module_l3=f['module_l3'],name=name,description=desc,notes='新接口文档为最终事实；未明确支持的能力显示待确认。',change_type='iteration',boundary=dict(business_object=tr(b['business_object']),primary_action=name,system_boundary='中台负责业务授权、客户归属、配置与结果持久化；AliCti仅采用文档明确支持的接口能力；既有AI域保留。',initiator=b['initiator'],trigger='有权用户或系统按业务条件发起'+name,primary_outcome=desc,completion_result=desc+' 未确认能力只返回待确认，不伪造成功。',included_scope=[desc],excluded_scope=['无文档依据的供应商能力实现','真实生产联调验收'],business_rules=rules,exception_paths=['越权或对象归属失效时拒绝，保留输入','失败、超时或未知结果不当成功，不盲重试有副作用操作'],dependencies=[x+' / '+x.replace('SC-','SEQ-') for x in f['source_scenario_ids']],assumptions=['未明确支持的供应商能力保持待确认，见已确认处置记录。'],split_rationale='按“'+tr(b['business_object'])+'—'+name+'”保留单一独立操作。开通/停用/恢复/删除、查询/详情/导出分别引用既有独立FUNC；字段和必要校验归本操作，不新增长期未确认供应商功能。'),change_detail=dict(before='页面复用基底：DEMO_PROTYPE；本条稳定业务操作ID '+f['id']+'。',after=desc,impact=['采用AliCti文档及待确认展示规则','复用既有页面位置和本地业务对象']),source_story_ids=f['source_story_ids'],source_acceptance_ids=f['source_acceptance_ids'],source_scenario_ids=f['source_scenario_ids']))
write('memory/feature-list.json',dict(schema_version='1.0',granularity_version='business-operation@2',features=features))
pages=read('planning/page-index.json');oldpages={x['id']:x for x in read('inputs/baseline-reference/planning/page-index.json')['pages']}
scindex={x['id']:x for x in read('scenarios/scenario-index.json')['scenarios']}
for page in pages['pages']:
 old=oldpages[page['id']];page['function_ids']=old['function_ids']
 for act in page['actions']:
  oa=next(x for x in old['actions'] if x['id']==act['id']);act['source_function_ids']=oa['source_function_ids']
 page['acceptance_points']=list(dict.fromkeys(a['statement'] for sid in page['scenario_ids'] for uid in scindex[sid]['source_story_ids'] for a in byus[uid]['acceptance_criteria']))
 page.pop('notes',None);page.pop('implementation_notes',None)
 page['planning_notes']=['复用既有页面布局与操作位置；未明确支持的供应商动作显示待确认。']
write('planning/page-index.json',pages)
print('复核',len(features),'项独立业务操作；页面/操作关联已回填')
