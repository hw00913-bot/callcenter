# v1.1.1 独立模拟原型执行边界

此项目按用户 SRC-155 明确批准的草稿试做例外制作，不是 G3 冻结导入，也不是生产或开发交付。config/requirement-analysis.json 保持 none / not-imported；不制造冻结包、接口证据或批准。正式需求仍在分析工作区，ISSUE-11102/11105 保持开放。

先读 memory/project-startup-plan.md、memory/project.md、memory/business-rules.md、memory/feature-list.md、memory/field-map.md、memory/execution-steps.md。inputs/product-draft 为只读草稿来源快照，不重编号或改写 AC/FUNC/PAGE/ACTION；发现需求差异回上游。

仅在本目录实现 HTML/CSS/vanilla JS。页面逻辑、Mock 数据、公共模型和样式分开。使用虚构车系和门店，所有数据与异常只在浏览器内模拟，不调用任何外部业务接口。仅支持本演示会话，不承诺生产草稿恢复。

8项功能、5处页面：超管字典维护，分类字段来源配置，坐席填写和保存，两处既有只读结果适配。原导入信息和原计划到店文本保留。按多个独立车系字段查询，门店取权威模拟结果并集；新选择须查全，异常不当失配。来源恢复须重查和确认。保留必填与未接通的原条件，不加通用编排和历史编辑。

沿用原 v1.1.0 的深蓝侧栏、白色表格卡片、蓝色主按钮和表单结构。桌面1440/1920评审。仅本目录可编辑，禁止改写现有 prototype、v1.1.0、v2.0.0、版本清单与历史快照。工具包不属于业务源码。

功能说明文档：不生成。标注：不生成。每步完成由 prototype-verifier 验证，记录真实证据与限制，不把静态模拟验证说成生产验证。

## 开始工作前

按顺序阅读 @memory/project-startup-plan.md、@memory/project.md、@memory/business-rules.md、@memory/feature-list.md、@memory/source-materials.md、@memory/open-items.md 以及字段和执行步骤。它们服务于已授权草稿试做，不能称为G3基线。

## 项目执行边界

业务源码仅在本目录修改，工具包和既有版本只读。无外部请求，无未请求可选文档及标注。每个动作对应已授权FUNC，后台只模拟，不扩大生产承诺。

## Loop 阶段预检

每阶段通过 tools/loop_run.py check / complete 推进，不能手改workflow状态。检查失败先修复实际产物，核验结论绑定本轮实现及证据。最终通过仅指本模拟试做，非正式冻结导入。
