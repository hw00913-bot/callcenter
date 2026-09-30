"""Generate AliCti sequences from current scenario facts and the approved API index."""
import json
from pathlib import Path
P=Path(__file__).resolve().parents[1]
def read(s):return json.loads((P/s).read_text())
def write(s,d):(P/s).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
AP=read('interfaces/interface-index.json'); index=read('scenarios/scenario-index.json'); seqs=[]
# Concrete current-document call placement. Missing contracts remain local pending states.
CALLS={
 '003':{4:[(307,'以enterpriseId作用域提交cno、name、areaCode；明确active/isOb/isAsr','返回创建结果；结果未知不重复创建')]},
 '005':{4:[(308,'仅对文档支持的更新字段提交坐席变更；在线限制先检查','返回更新结果或拒绝；不推断已安全下线')]},
 '007':{4:[(309,'提交完整skillIds/skillLevels列表，最多100坐席；小值优先','逐坐席读取failCno；部分失败不标全部生效')]},
 '008':{4:[(310,'按enterpriseId分页查询企业号码，每页不超过1000','返回号码、用途标记、状态及中继信息')]},
 '011':{4:[(322,'仅导入导出的IVR文件，大小不超过10MB','导入结果；发布与号码绑定仍为待确认')]},
 '014':{4:[(311,'创建type=1任务；autoStart=0，不启用autoDelete；记录autoComplete策略','保存taskId及明确创建结果，不标运行')],7:[(312,'按已确认名单发送JSON；property保存来源；显式importTelAutoStart=0','接收成功/无效计数；默认任务排重与跨批同号冲突保持待确认')],10:[(318,'对已存在通话按时间窗查询预测话单，分页或scroll','客户upTime、坐席bridgeTime、40/41/42/43、重呼轮次及终轮标记')]},
 '015':{4:[(311,'创建type=2任务，指定ivrId或ivrName；autoStart=0，不启用autoDelete','保存taskId及创建结果，不标运行')],7:[(312,'发送名单JSON/property，importTelAutoStart=0；大小<=8MB、单批<=10万','记录有效/失败计数；来源映射未证实的行不假定已贯通')]},
 '017':{5:[(306,'在已收到来电且媒体可用时通过SipSession处理接听','返回软电话实际状态，接口受理不当人工接听')],8:[(319,'查询已存在来电的话单','区分系统应答、人工接听与排队/IVR结果')]},
 '018':{7:[(319,'查询实际呼入话单并核对当前租户归属','保留系统应答、人工接听、未接和排队原因')]},
 '019':{5:[(317,'人工外呼查询：时间窗<=1月，普通分页最多10万或scroll','人工upTime坐席、bridgeTime客户，按1/2/3/4解释'),(318,'预测外呼查询：仅对该类型执行','预测upTime客户、bridgeTime坐席；40/41/42/43'),(319,'来电查询：仅对呼入执行','系统接听不当人工成功')],8:[(320,'在recordFile已就绪时请求录音URL','默认有效120分钟；到期重新获取'),(321,'以mainUniqueId/callType获取ASR，all=true','-2为处理中；side及beginTime/endTime保留，单位与对齐待确认')]},
 '104':{7:[(320,'权限校验后按recordFile获取录音地址','返回限时URL或不可用状态')],9:[(321,'按mainUniqueId/callType获取完整转写','返回按角色区分文本或处理中；对齐能力待确认')]},
 '105':{7:[(313,'仅暂停操作提交taskId；pauseDuration默认0，单位待确认','受理后保持处理中，在途影响不明则待确认'),(314,'仅结束操作提交taskId','结束受理与最终终态分开；继续操作契约待确认')]}
}
PENDING={
 '003':{5:'响应未知时需要坐席查询契约；未明确支持则显示待确认，禁止重复开通'},
 '005':{4:'删除契约及更新对在途通话影响未明确；显示待确认，不模拟删除成功'},
 '006':{4:'技能/队列创建及隔离契约未明确，显示待确认，不发送虚构创建接口',5:'物理组创建证据不充分时不进入保存生效分支'},
 '008':{2:'号码远端开通契约未明确；显示待确认，已存在号码可按查询接口同步'},
 '009':{3:'号码隔离/恢复及呼入入口变更接口未明确；显示待确认，本地冻结仅限制本平台新外呼'},
 '011':{5:'IVR发布、号码绑定及租户分支配置未明确，显示待确认，不标路由已生效'},
 '014':{8:'启动/恢复契约未核验，显示待确认，不发送虚构调用或生成本次通话'},
 '015':{8:'启动/恢复契约未核验，显示待确认，不发送虚构调用或生成本次通话'},
 '017':{2:'共享号码锁定租户和发布路由契约待确认；以下接听仅适用于已证实来源的现有来电'},
 '018':{1:'服务时间、队列与再分配配置契约待确认；不可展示已在供应商生效',3:'队列/拒接再分配结果无证据时待确认，不模拟转给任意坐席'},
 '206':{6:'仅本地草稿可删除并释放客户；已生成供应商taskId的删除契约未明确，显示待确认'}
}
def build(s):
 sid=s['id'];n=sid.split('-')[1];d=read(s['file']);m=[]
 def msg(a,b,t,api=None,kind='request',condition=None):m.append(dict(step=len(m)+1,**{'from':a,'to':b},message=t,type=kind,api_id=f'API-{api}' if api else None,condition=condition))
 participants=[dict(id='u',name='当前有权操作人',kind='actor'),dict(id='ui',name='中台页面',kind='system'),dict(id='svc',name='中台业务服务',kind='system'),dict(id='db',name='中台数据存储',kind='system'),dict(id='cti',name='CTILink / WebRTC',kind='system'),dict(id='vendor',name='AliCti',kind='external_system')]
 msg('u','ui',d['trigger']);msg('ui','svc','提交当前登录态、租户及业务操作；供应商账号由授权映射确定')
 msg('svc','db','校验当前用户、租户、enterpriseId和目标业务对象权限')
 msg('db','svc','返回授权上下文及有效业务数据',kind='response')
 msg('svc','ui','拒绝越权/失效操作，保留输入且不调用供应商',kind='error',condition='校验失败；本路径结束')
 if n=='102':
  msg('ui','cti','执行setup；回调完成后注册电话及媒体事件',303)
  msg('cti','ui','初始化完成',303,'event')
  msg('ui','svc','申请本人电话登录材料；不得指定任意cno')
  msg('svc','vendor','按已授权enterpriseId/cno请求authenticateJsonp',302)
  msg('vendor','svc','返回sessionKey（30秒）及agentGateWayUrl；按JSONP/字符串JSON契约解析',302,'response')
  msg('svc','ui','返回本次短期登录材料，长期token不下发',kind='response')
  msg('ui','cti','Agent.login，bindType=3；loginStatus明确选择',303)
  msg('cti','vendor','建立电话会话及软电话连接',303)
  msg('vendor','cti','返回实际登录与媒体连接结果',303,'event')
  msg('cti','ui','只有实际登录和媒体就绪均满足才开放呼叫',303,'event')
  msg('cti','ui','显示失败/待恢复，禁止重复拨号；过期重新申请材料',303,'error','初始化、登录、媒体失败或超时')
  msg('u','ui','请求结束电话服务')
  msg('ui','svc','检查无进行中通话、无未保存话后结果')
  msg('svc','ui','允许完全退出；不满足则保留会话',kind='response')
  msg('ui','cti','退出时logoutMode=1',304,condition='允许退出')
  msg('cti','ui','实际退出结果；失败不伪造离线',304,'event')
  msg('ui','svc','完全退出确认后释放本地会话',condition='已确认退出')
 elif n=='103':
  msg('svc','db','复检本人坐席/客户/号码/技能及本地呼叫占用；冻结来源快照')
  msg('svc','ui','返回允许拨号的当前业务上下文',kind='response')
  msg('ui','cti','previewOutcall带obClid/requestUniqueId/callVariables，按需指定cdrIsAsr',305,condition='电话与媒体均就绪')
  msg('cti','vendor','发起本人坐席人工预览外呼',305)
  msg('vendor','cti','呼叫受理或错误；受理不是客户接通',305,'response')
  msg('cti','ui','按实际通话事件更新客户和坐席状态',305,'event')
  msg('u','ui','需要时静音/挂断')
  msg('ui','cti','Session.mute按in/out/all切换或Session.unlink；切换操作不盲重试',305)
  msg('cti','ui','返回实际通话状态',305,'event')
  msg('u','ui','保存本次话后结果')
  msg('ui','svc','提交原callId、来源及业务跟进；不修改客户接通证据')
  msg('svc','db','幂等保存业务结果及原批次关系')
  msg('svc','ui','返回保存结果；失败保留输入并阻止下一业务任务',kind='response')
  msg('ui','cti','按已确认坐席状态执行就绪/忙碌控制；自动整理到期行为待确认',304,condition='结果已保存且状态允许')
 else:
  for x in d['main_flow']:
   st=x['step'];action=x['action'];actor=x['actor']
   pending=PENDING.get(n,{}).get(st)
   if pending:msg('svc','ui',pending,kind='response')
   calls=CALLS.get(n,{}).get(st,[])
   if calls:
    for api,request,response in calls:
     c='对应操作/呼叫类型，且其前置路径成立'
     msg('svc' if api!=306 else 'ui','vendor' if api!=306 else 'cti',request,api,condition=c)
     msg('vendor' if api!=306 else 'cti','svc' if api!=306 else 'ui',response,api,'response',c)
   elif not pending:
    if 'AliCti' in actor or '供应商' in actor:
     if n=='016':msg('svc','svc','既有AI域沿用当前链路；不引入AliCti调用')
     elif n=='019' and st==1:
      msg('vendor','svc','按已配置HTTP推送接收话务/话单/录音/ASR事件',315,'event')
      msg('vendor','svc','企业WebSocket事件；默认全席，需服务端按租户拆分',316,'event')
     else:msg('svc','ui','该路径的供应商能力待确认：'+action,kind='response')
    elif '中台' in actor:
     msg('svc','svc',action+'；'+x.get('system_response',''),condition='前置条件成立；待确认路径不得继续标记生效')
    else:msg('u','ui',action,condition='前置业务条件成立')
  for alt in d.get('alternate_flows',[]):
   text='；'.join(alt.get('steps',[])) or alt.get('handling') or alt.get('continuation') or '保留当前输入和业务记录，显示原因；未确认能力不继续执行'
   msg('svc','ui',str(text),kind='error',condition=alt.get('condition','异常分支'))
 msg('svc','ui','返回已证实结果；未知能力显示待确认，保留数据并可再次核对',kind='response')
 used={x['api_id'] for x in m if x['api_id']}
 for a in AP['interfaces']:
  if a['id'] in used:
   assert sid in a['source_scenario_ids'],(sid,a['id'])
   a['used_by_sequence_ids'].append('SEQ-'+n)
 participants=[x for x in participants if any(x['id'] in [z['from'],z['to']] for z in m)]
 out=dict(schema_version='1.0',id='SEQ-'+n,scenario_id=sid,name=s['name']+'时序',participants=participants,messages=m,notes=['接口能力以AliCti文档为最终事实；未明确支持显示待确认，不生成虚构远端成功。','中台权限、数据归属和业务结果保存是本平台职责。演示数据不代表真实联调。'],source_refs=['inputs/source-index.json#SRC-302','inputs/user-instructions.md#本轮差异处理确认'])
 write('sequences/SEQ-'+n+'.json',out);seqs.append(dict(id=out['id'],scenario_id=sid,name=out['name'],file='sequences/'+out['id']+'.json',status='confirmed'))
for a in AP['interfaces']:a['used_by_sequence_ids']=[]
for s in index['scenarios']:
 if s['scope']=='in_scope':build(s)
write('sequences/sequence-index.json',dict(schema_version='1.0',sequences=seqs));write('interfaces/interface-index.json',AP)
print('生成',len(seqs),'份AliCti时序事实；缺失契约只返回待确认')
