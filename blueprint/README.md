# 系统架构蓝图维护说明

原型交付入口为 `prototype/related-systems/index.html`，左侧提供系统总览、平台模块、接口适配层、AliCti 模块和接口对照。

`build_blueprint.py` 保存逻辑模块、关系、规则和坐标，读取当前冻结接口索引的 API-301–326，并引用本轮已核对的 API-327 号码识别字段说明。冻结输入仅被读取；该蓝图不新增供应商能力事实。

从本项目目录执行 `python3 blueprint/build_blueprint.py`，生成静态 HTML / SVG 和 `blueprint-data.js`。交互保存在 `prototype/related-systems/blueprint.js`，样式保存在 `prototype/assets/css/system-blueprint.css`；运行页面不需要 Python 或构建工具，也不请求供应商业务接口。

平台模块与适配模块表示本方设计职责；AliCti 视图按公开接口功能归类，连线表示对象引用和结果关联，不表示供应商内部服务、数据库或部署拓扑。文档有依据只表示存在说明，原有边界待确认结论继续保留。

浏览器支持模块与关系详情、跨视图搜索、待确认项突出显示、缩放、全屏和当前视图 SVG 导出。导出文件包含完整样式，不依赖远程资源。接口对照保留 27 项依据与官方文档链接；API-324–325 不补造路径，API-326 为本方职责，API-327 为字段字典。

字段复核后的展示事实由 prototype/docs/field-alignment.json 覆盖加载，生成源同时读取该文件与冻结接口索引；冻结输入保持原状。资源核验采用官方 skill/list、agent/queryAgentSkill、skill/listSkillRelation 名称。字段清单变更后先运行 analysis/field-audit/build_report.py，再运行本目录 build_blueprint.py。
