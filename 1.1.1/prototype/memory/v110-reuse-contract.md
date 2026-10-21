# v1.1.0真实底座复用（用户2026-10-16确认）

> SRC-158 / CHANGE-11106-generic-interface-dependency：当前接口字段可独立查询或配置单上游映射（返回取值字段→下游入参名），依赖分必需／可选，允许多级联动。仅必需依赖强制分类闭合；可选缺上游/空值不传参，已填无效不当空。门店无参查询当前租户全部可用门店，有参数按实际编码查询。旧门店绑定保留必需；车系单选、门店多选、来源权限和历史保留。仍为SRC-155授权模拟试做，真实接口及正式G3待核验。

> SRC-157 / CHANGE-11104-multiple-intention-stores：用户明确意向门店多选；车系仍唯一单选，按单编码查店。门店按逐家有效性和同通集合快照处理，旧单值兼容一项，历史不改。当前覆盖早期门店单选表述。仍为SRC-155授权模拟试做，非G3冻结。


> SRC-156 当前更正（CHANGE-11103-single-intention-series）：用户转述黄专并明确确认，意向车系只有一个字段、单选；门店只关联该字段并按单编码查询。此确认覆盖早期多车系并集方案；原草稿输入与批准历史保持只读。仍为授权模拟试做，非G3冻结。

本次修正实现与已批准视觉方向的偏差，非新增业务事实。使用当前项目prototype作为只读底座，完整复用HTML外壳、assets/js/mock和导航，在本独立目录物理复制并只对必要扩展文件修改。原目录不修改。新的Storage namespace隔离原v1.1.0的本地演示数据。原startup计划、业务AC和G3待确认状态保持。

新增字段格式固定为 type:'interface', dictionaryId, depends:[seriesFieldId]；kind从BusinessData.entry(dictionaryId)的capabilityId推导，capabilities的kind为series/store。依然使用分类ref.required，不另建必填规则。两个样例ID为intendedSeries、intendedStore；移除备选车系，原plannedStoreName与所有预置字段保留。

window.BusinessData是本地模拟字典与取数能力：tenants()返回CloudCallData有效真实演示租户行（tenantId/enterpriseId/name）；capabilities=[{id,label,kind}]；entries()/entry(id)/capability(id)；available(entryId,scope)、sourceVersion(entryId,scope)、canManage()；create({name,capabilityId,tenantIds,enabled})、rename(id,name)、setEnabled(id,bool)、setTenants(id,tenantIds)返回{ok,message}；references(id)为引用数组。querySeries(entryId,scope)、queryStores(entryId,seriesCode,scope)返回Promise<{ok,complete,items,message}>，结果对象为code/name/type，失败不给新候选，complete可为空数组。queryStores失败情景支持partial；sourceVersion按条目+租户变化，改名不使引用失效。env={query:'normal'|'empty'|'partial'|'failure'|'delay',saveFail:false}，仅演示工具维护。scope由准确call的tenantId/enterpriseId组成，不用UI当前租户代替通话身份。

接口组件window.BusinessInterfaceField负责form(value/field)呈现与选择状态，提供control(field,value,prefix,handler,call,values)、validate(field,raw,values,call)、register(prefix,call,values,handler)。CustomerFollowup.form注册当前上下文，fieldControl对interface分支调用组件；update保留选择对象。组件通过handler写回原AgentWorkbench.setFollowup并局部重绘，保留原persist/session及saveDisposition。车系选择为单对象，门店选择为对象数组；每个对象{code,name,type,entryId,state,sourceVersion,verifiedScope}；历史detail直接读保存name/code。需要比较完整关联条件、来源版本、租户、通话身份；晚到响应不写入下通电话。意向车系未填不查店，完整成功才新选，pending/unavailable匹配后仍须确认。原空值必填及未接通条件沿原组件，非空无效值仍阻止提交。

菜单只新增系统管理/业务数据接口字典（SUPER_ADMIN，沿system.applications权限且页面模型二次校验）；保留原客户档案/导入与分配/业务分类、坐席工作台、云呼叫、通话记录、报表等名称和层级。字段配置用原双栏弹层；字典用PlatformUI表格/openLayer/按钮，不加载旧Trial CSS或页面壳。

真实接口和生产草稿契约仍待核验。本地保存/回调shape仅模拟，不能补造真实字段映射或业务批准。说明文档和标注仍不生成。四个交付页复用已有v1.1.1图集和系统页，版本入口仍指当前目录index。
