# 当前工程补证责任

本轮无需要用户再次决定的业务项。以下为开发阶段必须补齐的工程证据，不把本地Mock当作生产验证。

ENG-FLOW-PERSISTENCE（data）：生产业务/运行/跟进/通话/请求的物理模型、事务与唯一约束如何映射当前产品字段及同次结果？

ENG-FLOW-EXECUTION（api）：真实AI/预外呼/人工执行的请求ID、供应商callId、事件身份与最终重试收敛怎样准确关联？

ENG-FLOW-SCENE（backend）：AI场景与supplier/tenant/type/tagScene/category/brand/revision的最小只读投影由哪个生产服务提供？

ENG-FLOW-CHECKS（verification）：将本产品CHECK与真实CTI、回调、文件、同号并发及幂等测试环境和CI如何对接？

EQ-PLAT-IDENTITY（verification）：真实认证主体、账号/AI租户/Cloud企业ID权威映射、模块与功能授权来源、会话退出/撤权生效和resource-only grant需证据。

EQ-PLAT-CONTACT-STATE（data）：当前真实名单来源/有效期/解除码及sourceId规范、同号多来源聚合与读一致性需真实服务字段证据；不再要求旧历史名单迁移对账。

EQ-PLAT-ACCEPTED-CALL（api）：各供应商已接收未拨号码的阻止/取消/删除接口、时点、队列一致性与不能实现的差异需逐供应商证明。

EQ-PLAT-REMOTE（api）：真实天润type/useRange参数、source footprints、共享来源解除、幂等重试及终态回执字段/安全验证需对接证据。

EQ-PLAT-PROFESSIONAL（verification）：每专业动作真实授权码/路由/供应商取数、状态枚举、资源用途与导出字段映射需核证；本地Mock不能证明部署或远端成功。；另保留ISSUE-2018：核源ISSUE-11214的前序v1.1.1正式专业基底契约，v1.2冻结/本地Mock既有证据不重复核验，前序正式来源缺证未完成。

EQ-PLAT-DELETE（api）：真实删除实体、引用解析与最终并发资格校验、幂等请求及可靠读回终态接口需证据，HTTP200/列表消失不能单独证明删除。

EQ-PLAT-FINANCE（data）：真实统一租户→AI账户一对一映射、当前产品目录价格/默认分钟/时长、三分钟池同次快照、交易版本/幂等/核对终态需证据；不虚构真实支付。

EQ-PLAT-PHONE（api）：真实CTI会话/事件绑定、撤权后有限收尾、播放器受控链接/seek与真实浏览器电话状态需证据，模拟事件不证明生产接通。


## 原14项缺证追溯

ISSUE-2001 → EQ-PLAT-IDENTITY：真实认证主体/AI租户/Cloud企业权威映射、权限及会话撤销接口证据。

ISSUE-2004 → EQ-PLAT-CONTACT-STATE：当前生产限制记录sourceId/有效期/状态/解除码和同号多来源聚合可靠取数证据；不再要求旧v2历史迁移。

ISSUE-2005 → EQ-PLAT-ACCEPTED-CALL：逐供应商已接收未拨号码的拦截/取消/删除边界与不能实现差异。

ISSUE-2006 → EQ-PLAT-REMOTE：真实供应商最终回执、共享来源解除、多来源保留、幂等和同请求重试契约。

ISSUE-2008 → EQ-PLAT-PROFESSIONAL, EQ-PLAT-FINANCE, EQ-PLAT-PHONE：真实原动作授权码/取数/资源与媒体、财务快照及专业执行终态证据。

ISSUE-2011 → EQ-PLAT-DELETE：真实删除实体、引用解析、最终事务内资格检查及可靠终态读回。

ISSUE-2013 → ENG-FLOW-PERSISTENCE, ENG-FLOW-EXECUTION：生产业务ID与统一身份/租户/执行资源映射、幂等键及单条确认终态字段。

ISSUE-2014 → ENG-FLOW-PERSISTENCE, ENG-FLOW-EXECUTION：真实原业务回传字段/状态及关联变更的物理映射与并发处理；无旧v2数据迁移，不代表无需核验当前专业回传契约。

ISSUE-2015 → ENG-FLOW-EXECUTION：真实供应商结束/重试终态与保存确认字段，迟到/重复事件收敛及当前执行段唯一关联。

ISSUE-2016 → ENG-FLOW-EXECUTION, ENG-FLOW-SCENE：跨AI/Cloud真实任务/业务结果关联、最小场景投影和七元组证据字段。

ISSUE-2017 → ENG-FLOW-PERSISTENCE, ENG-FLOW-EXECUTION：正式入站导入契约、应用鉴权与授权租户、稳定业务编码/列映射/原始值和重复幂等的生产字段。

ISSUE-2018 → EQ-PLAT-PROFESSIONAL：仍须核源ISSUE-11214对应前序v1.1.1正式专业基底契约；作为原专业契约来源verification缺证保留，不视为旧v2历史兼容取消或已完成。

ISSUE-2021 → ENG-FLOW-PERSISTENCE, ENG-FLOW-EXECUTION, ENG-FLOW-SCENE：生产分类/模板当前配置/节点/原执行段/远端标识/终态/有效标签字段和内部接口一致性证据。

ISSUE-2022 → ENG-FLOW-PERSISTENCE, ENG-FLOW-EXECUTION：生产brandId/storeCode目录的稳定唯一有效映射、并发版本与转交同次提交参数/确认终态证据。
