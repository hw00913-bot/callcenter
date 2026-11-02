# GitLab必要归档热修合并提醒

2026-10-31，GitLab feat-test已发布独立热修`4cef11918e01eafcd6f8e9a3cffd3376e4e2810a`。本地第42步未完成变更未夹带到该发布，也没有整文件覆盖本地正在修改的模型与工作区。

后续发布第42步前，须按上下文合并本次归档守卫，保留本地新增的具体资源及优先级逻辑。不要用整份旧模型覆盖GitLab最新Demo。

- 模型：fourArchiveProblem/fourRequireArchives；废弃等待必要内容及准确快照归档；reopen和reclassify分别重查；fourFinalize不能因abandoned标记跳过真实内容归档；权限与工作状态同步解释。
- 工作区：废弃意图和完成分开显示，原实际办理/接听人仍可保存，不能代填。
- 新回归：scripts/check-abandon-archive.cjs共12项，覆盖人工、预外呼、未知、系统归档和伪关闭/错误快照标记；必须保留。
- 两条旧回归前提已修为先归档再转类、未知客户事实仍待核；不再允许以未归档废弃来构造正常路径。
- 两份targeted测试改为从自身位置定位当前检出原型；客户档案测试仅显式--output写文件。勿沿用固定本机路径或旧交接检查输出作为新版本证据。
- 源码合并后需重新刷新Cloud运行包、入口缓存版本和reuse-provenance，再对本地第42步的实际构建重新验证。本热修发布39组/535项通过不代签本地第42步或新的完整Loop门禁。

[GitLab修复记录](http://gitlab.chebaba.com/ai-call-center/ai-pipeline-factory-docs/-/blob/feat-test/Demo/2.0.0/开发交付包/工作资料/必要归档守卫修复记录.md)
