"""Render this project's interface appendix from plan.json; retain draft gate results."""
from pathlib import Path
import json,hashlib,sys,shutil
w=Path(__file__).resolve().parent
out=Path(sys.argv[1]).resolve()
p=json.loads((out/'plan.json').read_text());meta=p['technical_design']['interface_catalog'];items=p['technical_design']['interfaces']
m=json.loads((out/'manifest.json').read_text());assert m['status']=='draft'
assert (out/'plan.json').read_bytes()==(w/'plan.json').read_bytes()
evidence=json.loads((w/'interface-source-evidence.json').read_text())
ir=json.loads((w/'product-ir.json').read_text());apis={x['id']:x for x in ir['interfaces']}
field_ids={x['id'] for x in p['logic']['fields']};api_ids=set(apis)
assert len({x['id'] for x in items})==len(items)
for x in items:
 assert set(x['source_interface_ids'])<=api_ids
 assert set(x['domain_input_field_refs']+x['domain_output_field_refs'])<=field_ids
 assert set(x['supplementary_evidence_ids'])<={d['id'] for d in evidence['documents']}

def cell(s):return str(s).replace('|','\\|').replace('\n',' ')
def links(ids,folder):return '、'.join(f'[{z}]({folder}/{z}.md)' for z in ids) or '—'
def group(x):
 if x['id'] in ['CAP-014','CAP-015']: return 'DCC 结果交付'
 if x['id'] in ['CAP-016','CAP-017']: return '供应商结果接收'
 if int(x['id'][4:])>=18: return '供应商调用'
 return '本平台接入与内部完成机制'
lines=['# v1.1.0 接口与事件清单','**讨论稿：业务能力已列明，正式路由与未核协议仍需补齐；未调用真实接口。**','[返回开发包入口](README.md) · [按功能阅读](features/README.md) · [开发待补事项](developer-supplement.md)',
'本清单覆盖 17 项功能、19 个业务动作和全部 62 条验收，共 23 项接口或处理能力。编号 `CAP-*` 用于清单定位，不表示有 23 个已存在的 HTTP 端点。可信下载完成、结果补送等可能作为内部机制实现；不由此新增页面、按钮或原型目录。',
'本平台的请求与返回按已批准业务语义列出；真实路由、方法、JSON 包装、错误码及安全协议尚未确定。供应商操作只记录既有官方文档快照中能找到的路径和方法，仍保持 partial／missing，不代表真实联调通过。',
'## 快速查找','| 编号 | 能力 | 方向 | 地址或机制 | 当前状态 |','| --- | --- | --- | --- | --- |']
for x in items:
 route=x['documented_endpoint'] or ('下载路由与可信完成机制未定' if x['id']=='CAP-013' else ('内部机制，未定 HTTP 端点' if x['id']=='CAP-015' else '路由及方法未定'))
 lines.append(f"| [{x['id']}](#{x['id'].lower()}) | {cell(x['name'])} | {cell(x['caller']+' → '+x['callee'])} | {cell(route)} | {cell(x['scope_status'])} |")
lines+=['## 批次和请求标识的使用','| 标识 | 使用边界 |','| --- | --- |',
'| DCC `requestId` | 一次业务请求的幂等标识，可含多行；同 ID 同完整归一内容返回原回执。与供应商话单查询返回的 `requestId`、`requestUniqueId` 分开。 |',
'| 本地 `recordId` / `batchId` | 每个有效新业务行独立生成；主批和子批都各自有自己的 `batchId`。 |',
'| 本地 `rootBatchId` | 保存本次所属主批；后来的新主批不改变旧记录或旧事件的 root。不能当供应商 `fileId`。 |',
'| 供应商 `fileId` | 每次实际新导入从供应商响应中取得并保存映射。新导入不带旧 `fileId` 追加；同号两次是否实际接收及得到独立 `fileId` 仍需验证。 |',
'| 供应商通话／事件标识 | 通过可信、精确映射回到原业务记录；只按手机号或当前最近主批不足以关联。 |',
'| 53 分片计数 | `totalBatchCount/currentBatchCount` 描述失败结果分片；不是业务主／子批次号，也不是 `fileId`。 |',
'导入文档的 `name` 是必填批次名称，命名策略由适配设计确定；不是新增业务批次层级。`getTaskFile` 要求 `taskId + fileId`；话单查询 `list_cdr_predictive_call` 没有列出 `fileId` 筛选。删除接口的 `tels`、批次、状态存在优先级，不能视作 AND 交集。']
for title in ['本平台接入与内部完成机制','DCC 结果交付','供应商调用','供应商结果接收']:
 lines+=['## '+title]
 for x in items:
  if group(x)!=title:continue
  lines += [f'<a id="{x["id"].lower()}"></a>',f'### {x["id"]} · {x["name"]}',
   f"**方向**：{x['caller']} → {x['callee']}。",
   f"**用途与边界**：{x['business_summary']} {x['boundary']}",
   f"**请求／输入**：{x['request_summary']}",f"**返回／输出**：{x['response_summary']}",
   f"**鉴权与权限**：{x['auth']}",f"**幂等、异常与重试**：{x['idempotency_and_failure']}",
   f"**批次关联**：{x['batch_mapping']}",
   f"**路径与方法**：{x['documented_endpoint'] or '尚未确定正式路由'}；{x['documented_method'] or '尚未确定方法／消息协议'}。",
   f"**状态与责任**：{x['scope_status']}。开发方补实际模块、报文和协议；涉及业务语义的缺口由产品与接口提供方共同核对。",
   '**关联功能与逻辑**：'+links(x['feature_ids'],'features')+'；'+links(x['local_logic_ids'],'local-logic')+'。',
   '**来源与待核**：'+', '.join(x['source_interface_ids'])+'；来源状态 '+', '.join(k+'='+v for k,v in x['source_statuses'].items())+'；'+('、'.join(x['open_issue_ids']) or '无单独新增业务待核，工程协议仍未定')+'。',
   '**补充文档**：'+(', '.join(x['supplementary_evidence_ids']) if x['supplementary_evidence_ids'] else '沿冻结输入；无额外已核文档')+'。',
   '<details>\n<summary>查看字段和验收追溯</summary>\n\n输入域字段：'+(', '.join(x['domain_input_field_refs']) or '见本项文档字段；不虚构已确认平台物理字段映射')+'。\n\n输出域字段：'+(', '.join(x['domain_output_field_refs']) or '见本项文档响应字段')+'。\n\n这些字段是业务对象的读写依赖，不能把所有字段直接作为请求必填。完整含义见[字段规格](field-specs.md)。\n\n验收：'+', '.join(x['acceptance_ids'])+'；执行办法见[验收映射](acceptance-map.md)，均为计划，未运行生产测试。\n\n</details>']
lines+=['## 已退出本期的接口','| 来源 ID | 当前处置 |','| --- | --- |']
for id in meta['excluded_source_api_ids']:lines.append(f'| {id} | {cell(apis[id]["name"])}；保留历史 ID，不列为本期实施接口。 |')
lines+=[meta['not_required_clarification'],'## 不单独新增接口的行为']+['- '+s for s in meta['non_api_items']]
lines+=['## 供应商文档依据','本轮读取既有文档快照，未重新联网验证最新版本。下表记录能核得的原文地址；原地址缺失的项保留本地快照指纹，需开发方取正式文档复验。证据定位、SHA 和摘要见 [interface-evidence.json](interface-evidence.json)。','| 证据 | 来源 | 使用限制 |','| --- | --- | --- |']
for d in evidence['documents']:
 link=f"[原文]({d['original_url']})" if d['original_url'] else '本地已存文档快照；原网页地址未恢复'
 lines.append(f"| {d['id']} | {link} | {cell(d['note'])} |")
lines+=['## 形成可实施接口契约还需补齐']+['- '+s for s in meta['completion_requirements']]
lines+=['8 项原有真实接口／行为待核继续保留。本清单补充不改变已批准原型，不升级需求或开发门禁状态。',
'本清单由工作区 `plan.json` 的 `technical_design.interfaces` 生成，避免另维护一套业务规则。生成时规划文件 SHA-256：`'+hashlib.sha256((out/'plan.json').read_bytes()).hexdigest()+'`。']
body=''
for i,line in enumerate(lines):
 body+=('\n' if i and line.startswith('|') and lines[i-1].startswith('|') else ('\n\n' if i else ''))+line
(out/'interface-list.md').write_text(body+'\n')
shutil.copyfile(w/'interface-source-evidence.json',out/'interface-evidence.json')
if (w/'interface-review-20261012.json').exists():shutil.copyfile(w/'interface-review-20261012.json',out/'interface-review.json')
home=(out/'README.md').read_text();needle='## 当前能用于什么'
home=home.replace(needle,'## 接口清单\n\n[接口与事件清单](interface-list.md)已按本平台接入、DCC 回传、供应商调用和结果接收集中列出 23 项能力，覆盖 17 项功能。内部完成信号和补送不自动视为新 HTTP 端点；路径、方法和协议证据的未决项逐条标明。\n\n'+needle)
(out/'README.md').write_text(home)
technical=(out/'technical-design.md').read_text().replace('## 接口与能力依据','## 接口与能力依据\n\n见[接口与事件清单](interface-list.md)。这是本轮补充的接口契约讨论稿：包含已确认业务边界与带来源的供应商文档事实；未验证的协议仍明确列为缺口，不表示其余工程设计已完成。')
(out/'technical-design.md').write_text(technical)
supplement=(out/'developer-supplement.md').read_text()
supplement+='\n## 接口清单维护\n\n接口条目统一维护在工作区 plan.json 的 technical_design.interfaces 中。重新生成产品讨论稿后，再用同一工作区 render-interface-catalog.py 指定新导出目录，生成 interface-list.md、证据引用和入口，并更新文件清单指纹。该补充器只接受 draft，不改变两阶段门禁结果；接口真实验证和正式工程交付仍按本清单前述要求完成。\n'
(out/'developer-supplement.md').write_text(supplement)
m['extensions']={'interface_catalog':{'source':'plan.json#/technical_design/interfaces','entrypoint':'interface-list.md','capability_count':len(items),'real_calls_verified':False,'renderer_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}}
m['files']=[{'path':f.relative_to(out).as_posix(),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in sorted(out.rglob('*')) if f.is_file() and f.name not in ['manifest.json','.DS_Store']]
(out/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'interface_list':str(out/'interface-list.md'),'capabilities':len(items),'manifest_files':len(m['files'])},ensure_ascii=False))
