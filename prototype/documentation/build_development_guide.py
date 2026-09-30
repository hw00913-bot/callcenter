"""Generate the small reading entry; do not duplicate development artifacts."""
from pathlib import Path
import re

from build_delivery import heading_id, markdown_html, shell

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs'

CONTENT = '''# 开发阅读指引

事实基线：2026-09-29-multiple-caller-navigation-1；局部交互增量：2026-09-30-call-data-sync-demo-1（D-087）；本地逻辑修复：2026-09-30-local-logic-fixes-1（D-088）。按本次开发任务选择相关材料即可，无须全量读取原型或全部文档。独立开发包及其重复模型、契约、任务清单已取消。

## 先确定依据

从[功能说明](functional-spec.html)找到相关 FS 章节，结合[规则附表](interaction.html)确认状态、权限和业务边界。界面交互参考[当前原型](../index.html)；接口字段参考[字段对齐清单](field-alignment.html)及其引用的供应商原文，采用决定见[版本与变更记录](change-log.html)。

当前交付仅包含 AliCti 云联络中心；`documentation/input/functions.json` 和 `pages.json` 已按现行范围筛选。`memory/`、`inputs/`、旧回归报告及证据目录只用于追溯，不作为生成新页面或功能的需求来源。AliCti 自动外呼（IVR）和预测任务的 `callRouteStrategy=2`（接口称“AI转人工”）属于现行接口能力，不能与历史上已移除的独立产品模块混同。

开始接口开发前，只检查涉及的[待确认事项与接入准备](remaining-confirmations.html)。未知项不能按演示结果推断为供应商已支持。

## 按任务阅读

| 本次任务 | 优先阅读 |
| --- | --- |
| 账号、租户、权限 | 功能说明 FS-01/02、D-068账号唯一业务租户与相关附表；页面 `js/pages/account-tenant.js`、`alicti-accounts.js` |
| 坐席、技能、队列、外呼组 | 功能说明 FS-04/05/12/21；[坐席工具条接口映射](seat-toolbar-interface-map.md)；D-082本租户ADMIN未关联本人坐席或未上线可查看今日统计、逐工号只读坐席状态和二级页签事件日志，队列实时状态及管理仍须关联有效班长坐席、本人上线与班长授权；D-072 坐席登录单面板一次提交；D-076普通退出固定logoutMode=1、removeBinding=0保留接听分机绑定，不提供解绑选项；相关 `js/pages/` 与 `js/components/` |
| 分机、时间条件 | 功能说明 [FS-22](functional-spec.html#FS-22)、[FS-23](functional-spec.html#FS-23)；时间优先级为手工必填，同一 AliCti 账号内唯一，见 D-061 |
| 客户、业务分类及业务配置 | 从客户管理→业务分类一个菜单进入，在同页维护分类和独立字段库；分类用有序fields直接引用字段，显示/必填按分类配置，不再维护业务模板。功能说明 [FS-07](functional-spec.html#FS-07)、[FS-24](functional-spec.html#FS-24)；现行关系见 D-085、FA-192–195/214–215，D-074/D-077仅留历史；档案列表精简见 D-063；关联组件 `customer-business.js`、`customer-followup.js` |
| 外呼任务、再次联系 | 功能说明 FS-08/09/10；D-083预测任务最小可用座席数默认10、范围1–10，低于阈值自动暂停；只有autoStart=1且因座席不足自动暂停的任务，恢复达阈值后自动启动。自动外呼不显示该字段。D-086同一enterpriseId可登记多个外显导航，建任务时选一个，可配合多个号码池，见FA-197/198、C-73/74。导航核验及选号待CF-15联调，自动恢复待CF-18联调。任务编辑与再次联系沿用D-075/D-060；入口 `cloud-task-workspace.js` |
| 通话记录与原任务关联 | 功能说明 [FS-11](functional-spec.html#FS-11)、[FS-14](functional-spec.html#FS-14)、[FS-15](functional-spec.html#FS-15)、附表 B/K、D-066/D-087；`cloud-call-records.js` 共用 `alicti-report-facts.js`，按 API-317/318/319/362 分清实际话单和任务设置；本地异步资料演示位于 `call-data-sync.js` |
| 号码归属 | 功能说明 FS-06、D-067/D-068；导入即归属唯一业务租户，详情不嵌套管理 |
| 号码池管理 | [四个官方接口摘录](../references/README.md)：`hybridGroup/list`、`create`、`delete`、`update`；D-081按当前租户唯一关联的enterpriseId隔离，租户管理员维护本租户号码池；预外呼和自动外呼任务从本租户池列表选名称，不允许手填跨租户池名 |
| 呼入与报表 | 功能说明 FS-13/16；D-068当前账号单租户统计，不新增跨账号汇总；按需查看对应字段、状态规则与供应商原文 |
| 跨系统协作或异步处理 | 按需查看[业务流程](../flowcharts/business-process.html)、[时序图](../flowcharts/sequence-interaction.html)、[系统蓝图](../related-systems/index.html)中的相关场景 |

## 外显导航与座席不足暂停

AliCti技术答复经用户转述：一个enterpriseId可关联多个外显导航，一个导航可使用多个号码池。线下提供的导航名称和标识登记在现有账号资料中；创建预外呼或自动外呼任务时显式选择一个导航，可从当前租户选择多个AliCti号码池。任务提交`customerClidsCategory=5`和单个`customerClidsGroup`；`clidPoolList`每项只传池名和选填优先级。`customerTimeout`默认30秒、范围5–60秒。API-311/API-404只定义单次任务字段，供应商导航查询、标识有效性与池选号见[CF-15](remaining-confirmations.html#CF-15)联调。

预测任务的`minAvailableAgentCount`默认10，允许1–10整数。API-311/API-404明确：任务内可用座席数低于该值自动暂停。用户转述的供应商业务规则是：仅设置定时开始`autoStart=1`且因座席不足自动暂停的任务，人数恢复到不少于阈值时自动启动。手工暂停、号码停用保护暂停及已结束任务不因人数恢复启动；自动外呼不显示或提交阈值。接口原文未明示自动恢复，触发时点、暂停原因和状态回查见[CF-18](remaining-confirmations.html#CF-18)。

| 页面配置 | 接口对应与校验 |
| --- | --- |
| 外显导航 | 从当前账号已登记导航中选择一个；`customerClidsCategory=5`、单个`customerClidsGroup` |
| 指定号码池（选填） | 可选多个；`clidPoolList`每项传当前enterpriseId池名与选填整数`priority`；池名来自`hybridGroup/list` |
| 客户接听等待时间 | 两类任务创建传`customerTimeout`，默认30秒、5–60秒 |
| 最小可用座席数 | 仅预测任务`minAvailableAgentCount`，默认10、1–10；小于阈值自动暂停 |
| 定时自动恢复 | 仅`autoStart=1`且因座席不足自动暂停后，人数恢复达阈值才自动启动；待真实联调 |
| 逐客户指定号码 | API-312 `task/importTaskTel.taskTelList[].clid`仅在该客户行显式提供时可选，不能由任务配置推导 |

任务保存所选外显导航、号码池、等待时间和预测阈值的本任务快照；账号目录变化不回填已建任务。启动或继续时，若任务保存的`customerClidsGroup`已从当前账号目录移除，先阻断操作，须从原任务编辑入口选择有效导航，以API-404 `task/update`提交，再用DOC-334 `task/get`核对同一`taskId`和可回读值。编辑期间目录变化则拒绝过期提交并保留输入；供应商实际生效仍待联调。

任务中心运行概览有折叠的“演示座席人数变化”入口，仅对本地演示中运行或暂停的预外呼任务显示。输入观察到的可用人数会在本地模拟低于阈值暂停、符合定时开始条件时恢复；它不读取实时座席人数，也不向供应商执行真实任务操作。通话详情只展示话单实际外显号码，不由导航或号码池名猜测。D-083的单一默认导航假设仅作历史记录，当前以D-086为准。静态原型只模拟请求和状态，不能作为供应商真实选号或自动恢复的验收证据。

## 话后资料同步交互

D-087把通话结束、跟进保存和资料同步分开。话后资料同步中、同步异常或待核对时，坐席仍可按原校验“保存并完成”，继续既有自动置闲流程；业务保存与电话整理失败保留原处理。通话列表及详情展示同步中、已有资料或已同步、同步异常、待核对，并显示最近同步时间和“刷新资料”；已有资料没有本轮同步时间时显示未记录。任务执行进度与已同步话单统计分别展示，不能因资料未齐把已保存跟进回退，也不能把任务已处理数当成话单齐全数。

详情“演示资料同步”默认折叠，仅对已结束、当前授权范围内的本地演示记录开放。delayed约6秒后话单到达；media先显示话单已同步，约8秒后提供明确标注的合成语音样例；error约1.5秒后显示同步异常，点击“刷新资料”约1.5秒后恢复。这些时间是原型节奏，不是供应商SLA，不能用于推定真实话单或录音就绪时间。

`call-data-sync.js`用独立本地journal模拟后台技术资料，仅覆盖同一通话的电话事实与同步状态。已保存跟进、业务字段及原客户、任务、批次来源仍从当前业务记录读取，迟到快照不得覆盖；同一浏览器刷新后可恢复状态并处理已到期演示。刷新资料不拨号、不改跟进或来源、不新增联系历史。它没有真实后台服务，也不证明浏览器关闭期间有服务执行；服务端定时话单查询、事件加速补查、幂等入库与真实供应商接入另行实现。录音、文本状态独立，不阻塞基础话单展示和话后保存。

## 定位代码和原文

- 页面位于 `js/pages/`，共享逻辑位于 `js/components/`；从对应页面追踪实际依赖，不预设生产服务拆分。
- [Mock 说明](../mock/README.md)介绍演示数据；按模块读取需要的样例即可。
- [供应商原文索引](../references/README.md)保留官方快照和已采纳回复。先从字段清单取得 API-/DOC- 编号，再读取该份原文，避免将全部快照放入上下文。
- 功能说明各节已有验收要点；相关原型检查位于 `qa/`。只运行与修改有关的检查，跨模块调整再扩大回归范围。

## 开发与验证边界

原型和 Mock 用于表达业务与交互，不代表真实接口接通或生产验收通过。开发项目自行确定技术栈、持久化和服务实现；接入时替换模拟响应，并验证真实鉴权、权限、字段、回调和失败处理。完成后回写相关原型或说明及变更记录，保持同一份业务依据。
'''


def main():
    DOC.mkdir(parents=True, exist_ok=True)
    nav = [(heading_id(title), title) for title in re.findall(r'^## (.+)$', CONTENT, re.M)]
    (DOC / 'development.md').write_text(CONTENT, encoding='utf-8')
    (DOC / 'development.html').write_text(
        shell('开发阅读指引', markdown_html(CONTENT), nav, 'development.md', 'development'),
        encoding='utf-8',
    )
    print('Generated docs/development.md and docs/development.html')


if __name__ == '__main__':
    main()
