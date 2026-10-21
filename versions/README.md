# 云联络中心 1.0.0 历史原型

本目录仅包含 1.0.0 冻结原型及独立查看所需入口。快照标识为 `release-d2618baa-ro-v2`，用于历史只读演示；不连接真实供应商服务。

从仓库根目录启动静态服务：

```sh
python3 -m http.server 18765 --bind 127.0.0.1
```

打开 <http://127.0.0.1:18765/versions/index.html>，选择“打开 1.0.0 历史原型”，再打开冻结原型。也可在本目录启动同一命令并访问 `/index.html`。

- `1.0.0/prototype/`：765件冻结原件，保持源文件原字节。
- `1.0.0/历史只读视图/snapshots/release-d2618baa-ro-v2/prototype/`：765件等字节运行副本。固定返回链接依赖这一层级，所以从本目录的入口进入。
- `prototype/index.html`：冻结页面“返回工作版”的兼容目标，跳回本版总览。

原件内既有说明、供应商快照、演示数据和历史回归材料随完整冻结树保留。没有追加其他版本、外部审批原件、内部工作区、备份、本轮审计报告或开发交付草稿。查看不代表批准、生产接入或业务写入授权。

## 检查边界

主入口、本地运行资源和返回链均可通过 HTTP 独立查看。冻结 `docs/change-log.html` 原有6处追溯链接涉及5个缺失目标：`memory/change-log.md`、`qa/verify-working-mode.cjs`、`qa/verify-call-detail-alignment.cjs`、`documentation/build_development_guide.py`、`reviews/iteration-baseline-20260930.html`。这些历史说明链接保持原样，未为它们补入工作区或审计资料。

请使用本机 HTTP 查看；未以实际 `file://` 浏览进行验证。冻结原型中的登录、写入和只读限制保持原状。
