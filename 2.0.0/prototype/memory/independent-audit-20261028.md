# 2.0.0 独立全量审计与修复矩阵

更新：2026-10-28T04:58:19.569684+00:00。唯一正式入口：[prototype/index.html](../index.html)。

## 结论与证据口径

自主可完成的审计修复及相关回归已完成。 覆盖43 PAGE、113 ACTION、43 FUNC、38 US、134 AC。37菜单页与4内部页另分；静态追溯不等于每个动作/异常分支已实际重演。旧112/113仅作原证据索引，不新增计数、不重放已批准删除/交易/导入。

本次使用现有主目录，所有浏览器均为独立非持久Chrome，本地HTTP只用于允许的交互检查；未访问原验收浏览器资料。file://和自动文件选择旧限制未绕过。VM使用内存或独立临时数据；Mock、文档、代码、UI与真实供应商证据分别记账。未真实外呼、资金、凭证/安全设置，未修改参考源或冻结需求。

## 发现、复现、修复与影响

| 编号/等级 | 可复现问题/原因 | 最小修复 | 对应回归/证据边界 | 影响范围 |
|---|---|---|---|---|
|AUD-01 P1 · 后续节点未统一核对前段保存|已结束但未保存人工段→请求推进到下一执行节点；原推进可通过。结束/保存守卫只在start，未覆盖advance。|flow_routing_build.py / flow-routing-store.js：非TRANSFER后续核previousSaved；转交仍仅结束且不再呼叫。|55引擎/15存储/旧流转模型；实际Mock UI显示未保存禁用。|流转、跨租户轮次、下一方式；不提高转交保存门槛|
|AUD-02 P1 · 条件证据缺原执行段及标签上下文完整绑定|同轮其他段或同名标签可缺segmentId/tenantType/tagSceneId/brand/category校验；原已知标签可能在状态补核时被改写。|flow-routing.js / flow-routing-store.js：原段四元身份、原固定模板、标签全上下文/版本/稳定ID、已知值不改写与重复事件签名。|55引擎/15存储/12证据模型；真实供应商证明仍未验证。|AI与云条件、历史、重复/乱序事件|
|AUD-03 P2 · 自定义分类无法读取已有AI标签映射|先增加统一分类并明确建立原供应商映射，再读条件目录；旧七类数组被当最终白名单。|unified-ai.js：以当前统一分类源和明确关联投影；隐藏AI帧刷新时读取当前实时分类目录。|core 5组中的自定义分类；模板UI14含重新载入后的映射。|七类与新增分类、供应商/租户/分类稳定关联|
|AUD-04 P2 · 无关字段修改使全部分类版本失效|只改B独有字段，A配置版本也+1；旧比较使用整个字段库JSON。|category_build.py：只比较每个分类引用的字段定义及引用配置。|8组源派生反例/修复：独有、共享、未引用、顺序、绑定。|分类版本、模板引用、检查失效；共享字段仍更新所有实际引用者|
|AUD-05 P2 · 品牌同名被拒且标识/备注不完整|创建同名品牌失败；编辑及列表未完整呈现稳定ID/备注。|organization-store.js / organization.js：ID区分同名品牌，持久可选备注，编辑ID只读，租户选项显示ID。|core模型；实际品牌UI保存、编辑回读2项。|品牌、租户关联；未改变既有ID|
|AUD-06 P2 · 关联租户跳转丢失选中目标|品牌关联租户中选择具体门店，只进入无筛选租户列表。|organization.js：携带focusTenantId，准确显示所选有权租户；查询/重置可解除聚焦。|实际关联租户UI1项；原权限仍由store复查。|PAGE-2005→PAGE-2004|
|AUD-07 P1 · 原值保存模块角色会丢已有独立模板权限|原有PAGE-2228授权人员不改角色直接保存，publicAdmin列表未含模板页而被去除。|organization-store.js：保已有2223/2228独立公共配置权；业务详情页仍随Cloud角色收回，不新增授权。|8组角色权限VM；最终双窗口角色UI。|人员、配置授权；不将配置权升级为业务执行权|
|AUD-08 P1 · 旧Cloud iframe可继续沿启动快照授权|其他窗口降权后仅更新父菜单；直接effectiveAccess/canMenu等仍读旧ADMIN。简单投影又会在current.ensureScope中清当前电话。|cloud.js / 构建期Workbench只读快照：五类查询即时复核，精确已接通/话后通话有限收尾；异步退出/只读事件门禁纳入回归。|auth v2真实函数VM；最终auth-concurrency-ui。电话provider/DOM部分为明确桩，不是实际电话UI证明。|五类鉴权、账号/成员/模块撤权、reader、当前电话；不保留新业务权|
|AUD-09 P1 · 独立人工样例拒联记录可能跨命名空间读写|旧contact-policy固定cloud主前缀，与独立样例实际存储不一致，可能漏拦或串来源。|session-store.nativeStoragePrefix统一host和contact-policy；来源ID带样例命名空间，默认原ID保持。|core命名空间/坏数据模型、原contact回归。|四类外呼、公共来源；呼入仍豁免|
|AUD-10 P1 · AI失败导出使用固定5行样例|失败数量为1也导出固定5行，含成功行/固定号码/2025日期；原导入仅保存数量。|ai_import_result_build.py：本次失败快照和稳定history ID；账号/租户/任务/批次/版本/指纹复核；旧缺明细明确拒绝。|14组实际生成函数/保存回读/CSV字节VM；无GUI文件下载通过声明。|AI当前任务批次失败明细；稳定名单行/tombstone和旧历史保留|
|AUD-11 P1 · AI Excel与合法CSV被当普通文本拆分|旧readAsText处理xlsx ZIP/XML；CSV按换行和逗号split。|ai_import_parse_build.py及build：复用离线真实字节解析，供应商限额与异步失效守卫；xls另存，AI16MB；Cloud默认2000/1MB保持。|18组真实xlsx/CSV/TXT字节与竞态VM；生成语法检查。|AI文件入口；不代表动态属性远端提交或GUI上传通过|
|AUD-12 P2 · 合理重叠被拒/提示被吞，规则详情仍是旧语义|GTE80/GTE60应首命中但原被拒；改warning后Store返回空warning，详情仍显示人工任选/多选标签。|flow-routing.js + feedback构建：重叠提示而非一律拒；统一实时有界提示并移除节点旧副本残留；V2状态/标签/字段/原始域与Mock来源准确显示；legacy保原规则。|11组真实生成片段；最终模板、Mock与重叠条件3项UI。|编排、条件预览、历史只读；完全重复条件仍拒绝|
|AUD-13 P2 · 未保存时顶部推进按钮与提交门禁不一致|条件MATCHED但selectable=false时按钮仍可点，点击才失败。|reasonsFor.advance使用selectable并显示previousSaved具体原因；任一可选TRANSFER不被另一未保存分支否决。|11反馈模型含TRANSFER例外；实际UI未保存禁用。|业务记录详情，不改最终执行语义|
|AUD-14 P1 · 停同步/移组后可丢未解除远端限制|专项已同步→停同步→移除，retired绑定仍待核但历史released使check(AI)放行；移入无绑定组同根。|contact-policy.js / ai-special.js：每条来源保远端足迹及模型维护元数据，未解除转待核；旧released历史仅读时防漏，新纯本地行独立处理。|16组Map及真实confirmAction函数；旧contact回归；不执行现有用户名单删除。|专项来源、同号多来源/租户隔离、保存失败/未知/幂等|
|AUD-15 P2 · 条件模板无可操作的本地证据收口|模板可配置但运行页无法在原段输入分域条件证据，不能独立核对路径。|flow_runtime_build.py / flow-runtime-*：明确Mock表单，终态/重试默认未确认，原固定目录、原段归属、只写证据，不自动保存结果或推进。|12模型 + 实际UI原段提交/重放/未保存阻断；不解除2059。|业务详情本地演示，无真实供应商和独立模板外自动推进|
|AUD-16 P3 · 验收映射漏记既有step-12|S7 preflight在条件模板步骤来源映射处阻断。|acceptance-map R-007补已有step-12；不改Planned状态、冻结需求或阶段完成。|S7 preflight；完整ID集合对账。|验证追溯，不改产品范围|

## 当前生成链及保护校验

```json
{
  "status": "passed_with_explicit_external_and_manual_limits",
  "time": "2026-10-28T04:52:03.658263+00:00",
  "repeatBuilds": 2,
  "sixOutputHashesIdenticalToTestedBuild": true,
  "outputHashes": {
    "js/modules/ai.bundle.js": "e6e2ef0abe750220b4ad596b8d9474308ceff270b8ed19605479a3711ceeedf8",
    "js/modules/cloud.bundle.js": "18e6f870cda49db672c62ebdd40d60dc2209a749f24db83a1ccde4976768ebb5",
    "assets/css/cloud-ui.css": "d49af75ceff4268913733c091b4d32a095e8365650f9cf8b4c83ef78fba684a0",
    "assets/css/shared-forms.css": "cd2247fa5742d9617356a6075404efb062b259b74d93b8f820c2cd6c23f487f2",
    "memory/reuse-provenance.json": "41ffc9cb49b429dacc40827f6e6dc1646a1e8174b5bdca81bec63e32abb2a801",
    "index.html": "8fcf6ab566ee6ce9f7be0f5f40b78daca4fa780ea1adc74844236a10c69447af"
  },
  "protected": {
    "references": {
      "checked": 190,
      "changed": []
    },
    "locked": {
      "checked": 90,
      "changed": []
    }
  },
  "syntax": {
    "sourceFiles": 40,
    "inlineScripts": {
      "ai": 28,
      "cloud": 137
    },
    "totalCompiledScripts": 205
  },
  "entryLocalResourceMissing": [],
  "cacheHashMismatch": [],
  "modelSuites": 17,
  "modelSuiteFailures": [],
  "ui": {
    "ui-sweep": {
      "pages": 193,
      "roles": 19,
      "diagrams": 4,
      "errors": 0,
      "network": 0,
      "internal": 4,
      "status": "passed",
      "uniqueMenuPages": 37,
      "internalPageIds": [
        "PAGE-2112",
        "PAGE-2225",
        "PAGE-2226",
        "PAGE-2227"
      ],
      "loginAndScopeSelection": "observed across 19 independent role-scope entries"
    },
    "template-ui-20261028": {
      "status": "passed",
      "checks": 14,
      "errors": 0,
      "network": 0
    },
    "audit-targeted-ui": {
      "checks": 7,
      "errors": 0,
      "network": 0,
      "status": "passed"
    },
    "auth-concurrency-ui": {
      "checks": 3,
      "errors": 0,
      "network": 0,
      "status": "passed"
    },
    "overlap-ui": {
      "checks": 3,
      "errors": 0,
      "network": 0,
      "status": "passed"
    }
  },
  "changedTrackedFiles": [
    {
      "file": "2.0.0/prototype/index.html",
      "before": "9486fdc5986e16c4121d904d122e1b4cf5a29c8c8093f1f633fc40ec13bb6220",
      "after": "8fcf6ab566ee6ce9f7be0f5f40b78daca4fa780ea1adc74844236a10c69447af"
    },
    {
      "file": "2.0.0/prototype/README.md",
      "before": "99006a1927f5c36fcc10f17a35be03dd0a48f1359ba29db718efe12ce22e2e6d",
      "after": "e0cf5b6740157eea5f5e32fb3b14167dfc2ecf800062733ff710ad88a0defd5d"
    },
    {
      "file": "2.0.0/prototype/memory/open-items.md",
      "before": "8d8206ae6ae23b8e6066d0c0261da7cc84e5859bb67b7033545f7bac2246437b",
      "after": "874fc7894bb0c4b6bef13b35e4609fde1746ea87a99b6026b2451b3abf3053c9"
    },
    {
      "file": "2.0.0/prototype/memory/acceptance-map.md",
      "before": "e131b0c06607cc4fef0a4ac11c08f2582d350d79af16a4cdafbf50ffb9d351b3",
      "after": "efd725962ace9ff872f30da3415ab715789d2c4f127128aea9b98e81a5609e48"
    },
    {
      "file": "2.0.0/prototype/memory/verification-log.md",
      "before": "f2a084877c6cf8552eca99d6e3cdef3c495ac6ca2e504f38eb0f24ce5e708469",
      "after": "7046039a90649536407c9455bb9e9de4cedea129f49957ef119fad5eb54ff889"
    },
    {
      "file": "2.0.0/prototype/memory/loop-status.md",
      "before": "0a400787270030afa0fcedaa4fcac96fe9ea53ebcccaa360029e69de08a188df",
      "after": "e84bb91c04f45c21b5b298ea39cf2679230bc0532a95c35ab6b54dc8eae8ba52"
    },
    {
      "file": "2.0.0/prototype/memory/reuse-provenance.json",
      "before": "c29edc4f0874ea4ca9711e47b9958891bc3ba37e6ba60b3ce0dbf42468a0223c",
      "after": "41ffc9cb49b429dacc40827f6e6dc1646a1e8174b5bdca81bec63e32abb2a801"
    },
    {
      "file": "2.0.0/prototype/memory/change-log.md",
      "before": "0ee4cfbeab15ca386bc5b74769cd9c29f779455a48ae40fb734d37a8c5667753",
      "after": "e89ba5240d06d4218facbd00fa669ba3e6cf1a474591f8157aecf28a2ace0084"
    },
    {
      "file": "2.0.0/prototype/memory/circuit-state.json",
      "before": "b1973c5479fff98f743e48824cea6b428f53c7d1ab2c16c7a462c49fbaab4a5e",
      "after": "32d7ce4139ef3aa5819afece8c28b1a56cd7e096324c2dbd6cbad5f59bfe9a60"
    },
    {
      "file": "2.0.0/prototype/scripts/category_build.py",
      "before": "557b17ca338d873e4ae8aed021d5a4819dd66cd33864e56b295ee05a58b4e19a",
      "after": "2b51d1774f571ca2b69b7fc6f828e8eb8c22e90caa0b4386c65fac4840f490e0"
    },
    {
      "file": "2.0.0/prototype/scripts/flow-routing-store.js",
      "before": "52dda69cfffbcd2791a3df9a2848903b822e93fb754856738a3135fc8e0d2eac",
      "after": "f9e91beb226ff71a537af1616bd9671fcc86eb16438e7a0e1790621dcbe0fb89"
    },
    {
      "file": "2.0.0/prototype/scripts/build-modules.py",
      "before": "86f9c03fd92d356dff5dce476d8a4fddb6ccbd5effbc906946e9add1ea6db4a7",
      "after": "e602f1e86e09c617e19852d92b40642440e60b5b7b8095497cd792f129d0483d"
    },
    {
      "file": "2.0.0/prototype/scripts/flow_routing_build.py",
      "before": "1681fdeaa525e460cc84cbfb756668f3963e3e49dd6c53b1f540fb400535516b",
      "after": "19382679453eb8c2ecbae25a03aa67b883f37d6f9d3bf65fd423219b93fb43ba"
    },
    {
      "file": "2.0.0/prototype/js/adapters/cloud.js",
      "before": "473f785318cc7b917418e216dfa3e4e65bfe299becd592f865fc5bb6c8dcce2b",
      "after": "8732b524ab63e4df5119135ab76b239038c7fa7c4b7b66d6436a1b0d84cc09dc"
    },
    {
      "file": "2.0.0/prototype/js/adapters/ai-special.js",
      "before": "f4dae374b51f8326ea40f08ecaf3cc44f95c7f9d081dc117e1e89d42ab856353",
      "after": "a2d1a1c3d3bafcdcee62197644ce4968f1d6d26e6dc6d4128dd1e6a7e5035bb1"
    },
    {
      "file": "2.0.0/prototype/js/adapters/unified-ai.js",
      "before": "1946df6cb67687bd00fb375af4fa311ff92b82e6d31f9d02ada88c53fc52c7ff",
      "after": "42ab4e72dde8aaccd7bcd136c9abdaf0e71b6f1518dbf2b6640ec39126318232"
    },
    {
      "file": "2.0.0/prototype/js/components/session-store.js",
      "before": "bd47ea79030b1aacf6f7d97d66c9d556de3f6bb73bbe7c922a711eaf58bcf23c",
      "after": "57ccb707da740b938e65e9af6a118f188b2fb2a1b3f77b819abae68fbddd57a7"
    },
    {
      "file": "2.0.0/prototype/js/components/organization-store.js",
      "before": "b2fc503bd57548a61d9792d3ff31152810d3e114d1ddf72c626ee6f6cc72cfaf",
      "after": "b7c363b3c5f017ccae528d436c34e77662ea3339774dd5ea197e891d4bfdb3f6"
    },
    {
      "file": "2.0.0/prototype/js/components/contact-policy.js",
      "before": "4c35ad8c587d9a2ff2cb3afdfa8fbba2f3ec9f3269e19463211243ebd773c993",
      "after": "6592065ab659ebf37063a0e717558611559a50599f0906ef47cc58c593fd5c64"
    },
    {
      "file": "2.0.0/prototype/js/components/module-host.js",
      "before": "dafb256b53e54b199ec7911c6ae4c06eb43e0e0da27e68bf70b0acb084380fda",
      "after": "1b2a3693388d2474182cc3de357b003590f7a2e9dddc96a8c9d2e5e67a54574c"
    },
    {
      "file": "2.0.0/prototype/js/components/flow-routing.js",
      "before": "13637975c8bbcf91cdbced9e966ab1624444d266c34dd434ea2ba52274fbb277",
      "after": "a6c94503817202b2e586ee0395ef615dee20f04586c6b4c6dee788f75cb29485"
    },
    {
      "file": "2.0.0/prototype/js/modules/ai.bundle.js",
      "before": "821c17c2dbb7c6eafa5529c60fd1794365077c903b7f6547193f95481ed99653",
      "after": "e6e2ef0abe750220b4ad596b8d9474308ceff270b8ed19605479a3711ceeedf8"
    },
    {
      "file": "2.0.0/prototype/js/modules/cloud.bundle.js",
      "before": "eaa354617557e9d8da8df6113a133e9d75623e2a165ee8cce869021ab966a6dd",
      "after": "18e6f870cda49db672c62ebdd40d60dc2209a749f24db83a1ccde4976768ebb5"
    },
    {
      "file": "2.0.0/prototype/js/pages/organization.js",
      "before": "145f941855a558cbb3cdb923f09b542e1bb48cf86120967091b808ab6c39938a",
      "after": "edece70fbde64acac5e2a0656a7ff3c07fd57b5331bc1682a1fd7829b32e5ea8"
    }
  ],
  "newDeliverableSourceAndDocs": [
    "scripts/flow-warning-feedback.js",
    "scripts/ai_import_result_build.py",
    "scripts/flow-condition-feedback.js",
    "scripts/flow-runtime-store.js",
    "scripts/ai_import_parse_build.py",
    "scripts/flow_runtime_build.py",
    "scripts/flow-runtime-ui.js",
    "scripts/flow_feedback_build.py",
    "docs/role-permissions.md",
    "memory/independent-audit-20261028.md"
  ],
  "scope": {
    "PAGE": 43,
    "ACTION": 113,
    "FUNC": 43,
    "US": 38,
    "AC": 134,
    "originalCoreEvidence": 112,
    "originalCoreTotal": 113
  },
  "notVerified": [
    "file double-click and GUI file selection",
    "ACTION-2059 real 718 retry",
    "actual provider finality/tag IDs/remote restriction release",
    "existing 12 deferred and 14 engineering evidence gaps",
    "formal G3 imported baseline; unchanged mode=none/not-imported, import_analysis verify exit2",
    "production atomic simultaneous writes; local stale-version guard only"
  ],
  "fileDirectTested": false,
  "productionExecuted": false,
  "rolePermissions": {
    "path": "/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/docs/role-permissions.md",
    "sha256": "72e6b1e285cea403da43f5b862d978e7c0f7d3b779db47f353ca352bf0ece5ba",
    "scope": "actual roles, menus, button conditions and data boundaries only",
    "verifiedAgainstFinalGeneratedTransforms": true
  }
}
```

## 本次可复核证据

证据目录：`/tmp/d-v200-independent-audit-20261028/`；专项来源补充位于 `/tmp/modules-draft/`。最终汇总读取当前文件，不把临时候选测试当主项目已合入。

| 范围 | 入口/结果 | 声明边界 |
|---|---|---|
| 菜单/角色/阅读页 | ui-sweep.cjs / ui-sweep.json | 193次页面访问，19范围；状态 passed；每页截图/完整动作不由此推定 |
| 模板实际UI | template-ui.cjs / template-ui-20261028.json | 14项：分类、全屏拖拽、分域条件、返回/取消、版本、失败/未知/历史、桌面布局 |
| 品牌及Mock证据UI | audit-targeted-ui.cjs / audit-targeted-ui.json | 品牌3项+条件证据界面；样例通过公开应用API准备，准备不冒充GUI文件导入 |
| 重叠条件实际UI | overlap-ui.cjs / overlap-ui.json | 交集提示、取消后清除全部旧提示、恢复后保存新版本；合理重叠不拒绝 |
| 双标签降权/保存冲突 | auth-concurrency-ui.cjs / auth-concurrency-ui.json | 旧窗口降权/恢复、旧版本保存拒绝；非同时原子提交保证 |
| 流转引擎/权威存储 | flow-engine-check.cjs / flow-store-check.cjs | 55/15定向模型；内存原段夹具明确标识 |
| 条件Mock/反馈 | flow-runtime-check.cjs；flow-final-feedback/check-feedback.py --applied | 12+11组；读取当前生成片段，未知不落ELSE、转交例外、类型和来源 |
| 组织/隔离/分类 | core-check.cjs；scope-draft/{category-version-regression.py,organization-role-preservation.cjs} | 5组综合、8分类、8角色模型 |
| 权限及有限收尾 | scope-draft/cloud-authorization-v2-regression.cjs / 对应results.json | 真实AppState/Workbench/followup/父协调链；电话与部分DOM桩，非真实电话UI |
| AI失败明细/文件解析 | modules-draft/test-ai-import-result.js；run-parse-tests.py | 14+18组，真实字节及内存；文件选择/供应商写入未验 |
| 专项未解除来源 | /tmp/modules-draft/test-remote-footprint.js | 16组精确来源与异常；未真实删除/同步 |
| 旧业务回归 | /tmp/d-v200-flow-model-check.cjs、d-v200-org-check.cjs、d-v200-contact-check.cjs | 合并后原模型回归；不重放原浏览器业务记录 |

首次导航的1个404来自测试服务器根设为prototype导致../../memory/public无法定位；已将测试根改为项目根，产品文件原本存在。首轮定向UI配置页业务写被正确拒绝，后修测试导航；另一次locator.evaluate参数签名错误、并发夹具用了不允许的ALWAYS（改唯一ELSE）、重叠提示定位匹配两个节点（缩小定位后独立修复旧副本残留）；测试代码错误不当产品缺陷。模板14断言完成、浏览器子进程已退出后Node事件循环残留，仅核对命令的自有PID以SIGTERM关闭，见template-ui-cleanup.json。断线命令曾报创建失败但落盘后核实已执行品牌3项并正确失败退出，已更正，不盲重放现有用户记录。

## 页面→动作→实现→数据/权限→证据完整矩阵

本表每行均已核对源码存在和路由/权限落点。N=本次实际菜单打开；D=定向模型或UI，具体覆盖以证据列表为准；S=静态代码链；P=外部/人工待验。N/S不代表该页全部写操作、状态或AC通过。

| PAGE/页面 | ACTION | FUNC/AC | 源码与数据责任 | 权限边界/本次证据 |
|---|---|---|---|---|
|PAGE-2001 登录及合法入口|ACTION-2001, ACTION-2002|FUNC-2001, FUNC-2004；AC-2001, AC-2002, AC-2003, AC-2004, AC-2005, AC-2006|js/app.js; js/nav.js; js/components/session-store.js；统一会话、账号/租户合法范围|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2002 统一业务外壳与顶层区域导航|ACTION-2003, ACTION-2004, ACTION-2005, ACTION-2006, ACTION-2007, ACTION-2086, ACTION-2087|FUNC-2002, FUNC-2003, FUNC-2004；AC-2001, AC-2002, AC-2003, AC-2004, AC-2005, AC-2006, AC-2007, AC-2008, AC-2009, AC-2010, AC-2011, AC-2012, AC-2013, AC-2014, AC-2015|js/app.js; js/nav.js; js/components/session-store.js；统一会话、账号/租户合法范围|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2202 坐席作业与跟进|ACTION-2049, ACTION-2050, ACTION-2051, ACTION-2052, ACTION-2088, ACTION-2089, ACTION-2090|FUNC-2015, FUNC-2022, FUNC-2024；AC-2051, AC-2052, AC-2053, AC-2066, AC-2067, AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2006 业务分类与字段|ACTION-2019, ACTION-2020, ACTION-2021, ACTION-2022, ACTION-2111|FUNC-2016, FUNC-2017, FUNC-2018, FUNC-2019, FUNC-2040；AC-2038, AC-2039, AC-2040, AC-2041, AC-2042, AC-2043, AC-2044, AC-2045, AC-2046, AC-2047, AC-2102, AC-2103, AC-2104, AC-2105, AC-2106, AC-2107, AC-2108, AC-2114, AC-2134, AC-2135|js/pages/catalog.js; js/components/catalog-store.js; js/components/unified-categories.js; scripts/category_build.py; js/adapters/cloud.js; js/modules/cloud.bundle.js；公共组织/分类/来源存储|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2204 业务台账与导入批次|ACTION-2054, ACTION-2055, ACTION-2121|FUNC-2036, FUNC-2039, FUNC-2037；AC-2066, AC-2067, AC-2068, AC-2069, AC-2072, AC-2073, AC-2098, AC-2099, AC-2100, AC-2108, AC-2115, AC-2116, AC-2117, AC-2118, AC-2119, AC-2124, AC-2129, AC-2130, AC-2131, AC-2132, AC-2133|js/pages/business.js; js/components/business-link.js; js/adapters/cloud.js; js/adapters/customer-import-enhancements.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2228 流转规则模板|ACTION-2112, ACTION-2113, ACTION-2114, ACTION-2115|FUNC-2034, FUNC-2035, FUNC-2041, FUNC-2042；AC-2109, AC-2110, AC-2111, AC-2112, AC-2113, AC-2114, AC-2136, AC-2137|scripts/flow-editor.patch.json; scripts/flow-routing-store.js; scripts/flow_routing_build.py; js/components/flow-routing.js; js/components/flow-status-domains.js; js/modules/cloud.bundle.js；公共组织/分类/来源存储|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2007 黑名单与AI专项名单|ACTION-2023, ACTION-2024, ACTION-2025, ACTION-2026, ACTION-2092, ACTION-2093, ACTION-2094, ACTION-2095, ACTION-2096, ACTION-2097, ACTION-2098, ACTION-2099, ACTION-2100, ACTION-2101|FUNC-2020, FUNC-2021, FUNC-2023, FUNC-2025；AC-2048, AC-2049, AC-2050, AC-2051, AC-2052, AC-2053, AC-2054, AC-2055, AC-2056, AC-2057, AC-2058, AC-2059, AC-2060, AC-2061, AC-2062, AC-2063, AC-2064, AC-2065, AC-2078|js/pages/contacts.js; js/components/contact-policy.js; js/adapters/ai-special.js；公共组织/分类/来源存储|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2203 客户联系视图|ACTION-2053|；AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2102 AI用量与服务|ACTION-2028|；AC-2063, AC-2064, AC-2065, AC-2078|js/adapters/ai.js; js/adapters/ai-assignment-identity.js; js/modules/ai.bundle.js；AI租户配置仓库、任务与名单稳定ID、专业回执|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2103 AI外呼|ACTION-2029, ACTION-2030, ACTION-2031, ACTION-2032|；AC-2063, AC-2064, AC-2065, AC-2078|js/adapters/ai.js; js/adapters/ai-assignment-identity.js; js/modules/ai.bundle.js；AI租户配置仓库、任务与名单稳定ID、专业回执|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2108 AI通话记录|ACTION-2038, ACTION-2039|FUNC-2023；AC-2054, AC-2055, AC-2056, AC-2063, AC-2064, AC-2065, AC-2078|js/adapters/ai.js; js/adapters/ai-assignment-identity.js; js/modules/ai.bundle.js；AI租户配置仓库、任务与名单稳定ID、专业回执|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2110 AI业务场景|ACTION-2042|；AC-2063, AC-2064, AC-2065, AC-2078|js/adapters/ai-config-store.js; js/adapters/unified-ai.js; scripts/category_build.py; js/modules/ai.bundle.js；AI租户配置仓库、任务与名单稳定ID、专业回执|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2111 AI标签管理|ACTION-2043, ACTION-2044|FUNC-2019；AC-2045, AC-2046, AC-2047, AC-2063, AC-2064, AC-2065, AC-2078|js/adapters/ai-config-store.js; js/adapters/unified-ai.js; scripts/category_build.py; js/modules/ai.bundle.js；AI租户配置仓库、任务与名单稳定ID、专业回执|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2205 预外呼|ACTION-2056, ACTION-2057, ACTION-2058, ACTION-2059, ACTION-2060|FUNC-2024, FUNC-2043；AC-2068, AC-2069, AC-2072, AC-2073|js/adapters/dcc-import-enhancements.js; js/components/import-workbook.js; js/adapters/cloud.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2206 IVR外呼|ACTION-2061, ACTION-2062, ACTION-2063, ACTION-2064|FUNC-2024；AC-2070, AC-2071, AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2207 呼入服务与规则|ACTION-2065|；AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2208 云呼叫通话记录|ACTION-2066, ACTION-2067|；AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2210 坐席维护|ACTION-2070|；AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2211 技能管理|ACTION-2071|；AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2212 外呼组管理|ACTION-2072|；AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2213 队列管理|ACTION-2073|；AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2214 配置记录|ACTION-2074|；AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2215 号码管理|ACTION-2075|；AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2216 号码池管理|ACTION-2076|；AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2217 分机管理|ACTION-2077|；AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2218 时间条件|ACTION-2078|；AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2219 AliCti账号管理|ACTION-2079|；AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2221 通话数据异常|ACTION-2081|；AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2105 AI通话统计|ACTION-2035|；AC-2063, AC-2064, AC-2065, AC-2078|js/adapters/ai.js; js/adapters/ai-assignment-identity.js; js/modules/ai.bundle.js；AI租户配置仓库、任务与名单稳定ID、专业回执|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2106 AI计费统计|ACTION-2036, ACTION-2103|FUNC-2027；AC-2063, AC-2064, AC-2065, AC-2078|js/adapters/ai-finance.js; js/adapters/ai.js; js/modules/ai.bundle.js；AI租户配置仓库、任务与名单稳定ID、专业回执|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2107 AI线索统计|ACTION-2037|；AC-2063, AC-2064, AC-2065, AC-2078|js/adapters/ai.js; js/adapters/ai-assignment-identity.js; js/modules/ai.bundle.js；AI租户配置仓库、任务与名单稳定ID、专业回执|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2209 云呼叫统计报表|ACTION-2068, ACTION-2069|；AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2003 账号与成员|ACTION-2008, ACTION-2009, ACTION-2010, ACTION-2011, ACTION-2091, ACTION-2102, ACTION-2104|FUNC-2011, FUNC-2012, FUNC-2013, FUNC-2014, FUNC-2028；AC-2022, AC-2023, AC-2024, AC-2025, AC-2026, AC-2027, AC-2028, AC-2029, AC-2030, AC-2031, AC-2032, AC-2063, AC-2064, AC-2065, AC-2072, AC-2073, AC-2078, AC-2079|js/pages/organization.js; js/components/organization-store.js; js/components/session-store.js；公共组织/分类/来源存储|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2004 租户管理|ACTION-2012, ACTION-2013, ACTION-2014, ACTION-2015, ACTION-2105|FUNC-2005, FUNC-2006, FUNC-2007, FUNC-2010, FUNC-2029；AC-2016, AC-2017, AC-2018, AC-2019, AC-2020, AC-2021, AC-2035, AC-2036, AC-2037, AC-2063, AC-2064, AC-2065, AC-2072, AC-2073, AC-2078, AC-2080, AC-2081, AC-2082, AC-2083, AC-2095, AC-2096|js/pages/organization.js; js/components/organization-store.js; js/components/session-store.js；公共组织/分类/来源存储|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2005 品牌管理|ACTION-2016, ACTION-2017, ACTION-2018|FUNC-2008, FUNC-2009, FUNC-2026；AC-2033, AC-2034, AC-2074, AC-2075, AC-2076, AC-2077|js/pages/organization.js; js/components/organization-store.js; js/components/session-store.js；公共组织/分类/来源存储|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2220 应用接入管理|ACTION-2080|；AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2222 云呼叫操作审计|ACTION-2082|；AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2109 AI线索记录与回访|ACTION-2040, ACTION-2041|；AC-2063, AC-2064, AC-2065, AC-2078|js/adapters/ai.js; js/adapters/ai-assignment-identity.js; js/modules/ai.bundle.js；AI租户配置仓库、任务与名单稳定ID、专业回执|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2112 AI租户服务与充值详情|ACTION-2045, ACTION-2046, ACTION-2047|；AC-2063, AC-2064, AC-2065, AC-2078|js/adapters/ai-finance.js; js/adapters/ai.js; js/modules/ai.bundle.js；AI租户配置仓库、任务与名单稳定ID、专业回执|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2223 云呼叫业务字段配置|ACTION-2083|；AC-2038, AC-2039, AC-2040, AC-2041, AC-2042, AC-2043, AC-2044, AC-2072, AC-2073, AC-2102, AC-2103, AC-2105, AC-2106, AC-2107, AC-2108, AC-2135|js/pages/catalog.js; js/components/catalog-store.js; js/components/unified-categories.js; scripts/category_build.py; js/adapters/cloud.js; js/modules/cloud.bundle.js；公共组织/分类/来源存储|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2225 全部坐席事件（原内部页）|ACTION-2085|；AC-2066, AC-2067, AC-2072, AC-2073|js/adapters/cloud.js; js/adapters/cloud-resources.js; js/modules/cloud.bundle.js；原Cloud按tenant+enterprise+对象ID仓库与原状态机|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2226 业务数据的线索视图|ACTION-2106|FUNC-2033；AC-2093, AC-2094, AC-2098, AC-2099, AC-2100, AC-2124, AC-2131, AC-2132, AC-2133|js/pages/business.js; js/components/business-link.js; js/adapters/cloud.js; js/adapters/customer-import-enhancements.js; js/modules/cloud.bundle.js；公共组织/分类/来源存储|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|
|PAGE-2227 业务记录详情|ACTION-2107, ACTION-2108, ACTION-2109, ACTION-2110, ACTION-2116, ACTION-2117|FUNC-2030, FUNC-2031, FUNC-2032, FUNC-2033, FUNC-2038, FUNC-2037；AC-2084, AC-2085, AC-2086, AC-2087, AC-2088, AC-2089, AC-2090, AC-2091, AC-2092, AC-2093, AC-2094, AC-2097, AC-2098, AC-2099, AC-2100, AC-2101, AC-2113, AC-2118, AC-2119, AC-2120, AC-2121, AC-2122, AC-2123, AC-2124, AC-2125, AC-2129, AC-2130, AC-2131, AC-2132, AC-2133|js/pages/business.js; js/components/business-link.js; js/adapters/cloud.js; js/adapters/customer-import-enhancements.js; js/modules/cloud.bundle.js；公共组织/分类/来源存储|N；各ACTION原权限见下表；D见相关回归；真实工程边界P|

## 113动作逐项权限与证据归属

保留每条ACTION，不用112汇总省略2059或文件选择。财务、删除、导入等原实际证据留在verification-log中，本次没有重演不可恢复/既已批准完成的动作。

| ACTION / 操作 | PAGE / FUNC | 原授权要求 | 本次结论 |
|---|---|---|---|
|ACTION-2001 提交登录|PAGE-2001；FUNC-2001|AI现有认证；目标统一接入|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2002 重新验证/返回登录|PAGE-2001；FUNC-2001, FUNC-2004|按实际会话结果|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2003 切换有权导航区域及原业务页面|PAGE-2002；FUNC-2002|目标合法租户、原页面/操作/片段实际权限；适用模块及成员条件仍沿原规则|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2004 保存并离开|PAGE-2002；FUNC-2002, FUNC-2003, FUNC-2004|保留原表单保存权，成功才放行|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2005 放弃本次普通草稿|PAGE-2002；FUNC-2002, FUNC-2003, FUNC-2004|仅限可放弃的普通未提交表单|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2006 取消切换|PAGE-2002；FUNC-2002, FUNC-2003|保留当前工作位置|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2007 退出统一系统|PAGE-2002；FUNC-2004|统一退出；电话与话后按保护流程|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2086 进入有权管理功能|PAGE-2002；FUNC-2002|当前合法范围有目标公共页面权限，并通过已确认电话/表单保护|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2087 返回来源业务位置|PAGE-2002；FUNC-2002|来源当前仍合法；恢复子页和筛选前重验权限并刷新，不自动上线/拨号|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2049 原本人电话准备/上线|PAGE-2202；|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2050 本人主动外呼|PAGE-2202；FUNC-2024|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2051 原呼入/预外呼接听|PAGE-2202；|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2052 保存本次跟进及拒联结果|PAGE-2202；FUNC-2022, FUNC-2015|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2088 监管将有权目标坐席置忙|PAGE-2202；|仅当前租户管理员且云呼叫模块及本人班长电话会话合法、电话连接正常，具原队列监控与目标坐席管理授权；目标须为非本人、同租户/企业的唯一有效坐席，已启用且同步成功、未禁止呼叫或接收新任务，并处于已授权队列。仅最新一致监控确认目标空闲且设备未忙时可置忙；加载、操作在途或结果待核时阻断，提交前重核当前上下文、会话及目标资格，经确认提交后重新读取状态，受理不等于已生效。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2089 监管将有权目标坐席置闲|PAGE-2202；|同原班长监管具体授权；不因PAGE可见授予|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2090 监管将有权目标坐席离线|PAGE-2202；|同原班长监管具体授权；不得替他人上线|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2019 新增业务分类|PAGE-2006；FUNC-2016|原租户目录沿本租户原权；新品牌共用分类由有权超管/本品牌租户管理员维护，不授业务数据或AI专业权。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2020 修改业务分类与字段|PAGE-2006；FUNC-2017|原租户目录沿本租户原权；新品牌共用分类由有权超管/本品牌租户管理员维护，不授业务数据或AI专业权。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2021 停用本租户分类|PAGE-2006；FUNC-2018|仅原租户目录已有停用权；本版不新增品牌分类停用/删除生命周期。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2022 进入有权AI场景及标签关联配置|PAGE-2006；FUNC-2019|分类有权查看；进入后另核原AI专业配置权和具体执行/供应商/标签场景可靠关系，非直接维护标签。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2111 配置并保存单模板路由|PAGE-2006；FUNC-2040|有权平台超管/本品牌租户管理员；独立核分类基础、字段和路由版本，单模板兼容。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2054 导入业务数据|PAGE-2204；FUNC-2036|沿原导入资格及当前租户/品牌分类范围，新模板仅核新输入准入，原导入规则及逐条结果保留。|解析/校验D已测；真实GUI文件选择P，本次未重导原名单|
|ACTION-2055 查询业务台账及导入批次|PAGE-2204；FUNC-2039|原数据查询权；超管监管按实际品牌/租户范围只读，不因可见取得业务办理或分配权。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2121 分配所选业务记录|PAGE-2204；FUNC-2037|当前负责租户有原分配权；逐条核记录/安排版本及共同目标资格，任一失败全批不写。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2112 创建流转规则模板|PAGE-2228；FUNC-2034|平台超管或本品牌管理员，保存本品牌模板首版本。 同次保存本模板版本的稳定edge条件；开启条件规则/值不可空，原版本和已有实例不追改。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2113 修改并保存模板新版本|PAGE-2228；FUNC-2035|平台超管或本品牌管理员，原版本保留，新版本不自动替换分类或实例引用。 同次保存本模板版本的稳定edge条件；开启条件规则/值不可空，原版本和已有实例不追改。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2114 查看模板详情|PAGE-2228；FUNC-2041|平台超管或本品牌有权配置管理员按品牌查看已存精确版本；只读，不提交配置或自动替换引用。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2115 删除未被引用模板|PAGE-2228；FUNC-2042|平台超管或本品牌有权管理员；模板没有分类当前/历史、记录/批次及待核配置引用。提交重核品牌资格、模板版本和引用指纹；有引用或引用待核拒绝，结果未知先核同次。|删除守卫/身份D及引用S；不重放原获批删除|
|ACTION-2023 查询名单及详情|PAGE-2007；FUNC-2020, FUNC-2021|本租户名单查看权限，不自动获得来源通话查看权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2024 人工确认AI拒联并加入公共禁呼|PAGE-2007；FUNC-2023|单独新增权＋来源通话查看权；不得按无意向/拒接自动加入|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2025 解除本条公共禁呼|PAGE-2007；FUNC-2025|仅有权管理员，原因必填|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2026 查看原供应商同步结果|PAGE-2007；FUNC-2021|原同步信息查看权；原重试动作按已有授权保留|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2092 新增AI专项名单分组|PAGE-2007；|原AI专项具体操作授权＋已核验的合法身份及目标租户/原平台管理范围；仅真实适用时校验租户成员关系，不从页面可见或角色名称授予写权限。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2093 修改AI专项名单分组|PAGE-2007；|原AI专项具体操作授权＋已核验的合法身份及目标租户/原平台管理范围；仅真实适用时校验租户成员关系，不从页面可见或角色名称授予写权限。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2094 删除空AI专项名单分组|PAGE-2007；|原AI专项具体操作授权＋已核验的合法身份及目标租户/原平台管理范围；仅真实适用时校验租户成员关系，不从页面可见或角色名称授予写权限。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2095 新增AI专项限制号码|PAGE-2007；|原AI专项具体操作授权＋已核验的合法身份及目标租户/原平台管理范围；仅真实适用时校验租户成员关系，不从页面可见或角色名称授予写权限。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2096 批量导入AI专项限制号码|PAGE-2007；|原AI专项具体操作授权＋已核验的合法身份及目标租户/原平台管理范围；仅真实适用时校验租户成员关系，不从页面可见或角色名称授予写权限。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2097 移动AI专项名单分组|PAGE-2007；|原AI专项具体操作授权＋已核验的合法身份及目标租户/原平台管理范围；仅真实适用时校验租户成员关系，不从页面可见或角色名称授予写权限。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2098 移除AI专项限制记录|PAGE-2007；|原AI专项具体操作授权＋已核验的合法身份及目标租户/原平台管理范围；仅真实适用时校验租户成员关系，不从页面可见或角色名称授予写权限。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2099 启用AI专项分组同步|PAGE-2007；|原AI专项具体操作授权＋已核验的合法身份及目标租户/原平台管理范围；仅真实适用时校验租户成员关系，不从页面可见或角色名称授予写权限。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2100 停用AI专项分组同步|PAGE-2007；|原AI专项具体操作授权＋已核验的合法身份及目标租户/原平台管理范围；仅真实适用时校验租户成员关系，不从页面可见或角色名称授予写权限。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2101 重试AI专项名单同步|PAGE-2007；|原AI专项具体操作授权＋已核验的合法身份及目标租户/原平台管理范围；仅真实适用时校验租户成员关系，不从页面可见或角色名称授予写权限。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2053 查询客户档案及原详情|PAGE-2203；|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2028 查询原AI使用情况|PAGE-2102；|原用量明细查看权及原实际适用身份/租户/服务条件独立判断；摘要-only不因此有明细权，容器不得统一要求不适用的业务成员/任务权或本人坐席|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2029 查询原任务列表/详情|PAGE-2103；|沿原AI对应操作权限；查询、名单操作与配置分别校验原权限，不要求普通查询人员具有配置权；真实操作码待核|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2030 原任务呼叫名单手动导入|PAGE-2103；|沿原AI对应操作权限；查询、名单操作与配置分别校验原权限，不要求普通查询人员具有配置权；真实操作码待核|解析/校验D已测；真实GUI文件选择P，本次未重导原名单|
|ACTION-2031 查询原导入记录|PAGE-2103；|沿原AI对应操作权限；查询、名单操作与配置分别校验原权限，不要求普通查询人员具有配置权；真实操作码待核|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2032 原已分配名单单条移除|PAGE-2103；|沿原AI对应操作权限；查询、名单操作与配置分别校验原权限，不要求普通查询人员具有配置权；真实操作码待核|删除守卫/身份D及引用S；不重放原获批删除|
|ACTION-2038 查询原通话记录/详情|PAGE-2108；|沿原AI对应操作权限；查询、名单操作与配置分别校验原权限，不要求普通查询人员具有配置权；真实操作码待核|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2039 从有权来源记录进入人工拒联确认|PAGE-2108；FUNC-2023|独立来源查看权＋公共名单新增权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2042 原业务场景查询与已有配置操作|PAGE-2110；|沿原AI对应操作权限；查询、名单操作与配置分别校验原权限，不要求普通查询人员具有配置权；真实操作码待核|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2043 维护原标签及供应商配置|PAGE-2111；|沿原AI对应专业配置权限；关联另校验当前租户/具体业务场景/公共分类归属，公共目录权不替代专业配置权；真实操作码待核|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2044 设置/修改具体AI业务场景的公共分类关联|PAGE-2111；FUNC-2019|原AI专业场景配置权；具体执行场景归本租户。旧目录及原关系沿原租户身份，新选/更换品牌分类另核当前品牌与目标有权启用稳定标识；目录权不授专业写权。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2056 查询原预测任务/详情|PAGE-2205；|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|解析/校验D已测；真实GUI文件选择P，本次未重导原名单|
|ACTION-2057 原任务新建/编辑|PAGE-2205；|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2058 原任务客户导入|PAGE-2205；|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2059 按原状态办理执行/控制|PAGE-2205；FUNC-2024|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|P：正常718实际重呼仍缺研发执行证据，未通过|
|ACTION-2060 原任务结果查询与失败下载|PAGE-2205；FUNC-2043|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2061 原IVR任务新建/编辑|PAGE-2206；|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2062 原IVR名单处理|PAGE-2206；|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2063 原IVR执行/控制|PAGE-2206；FUNC-2024|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2064 原IVR查询/详情/已有导出|PAGE-2206；|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2065 查询与维护原呼入服务规则|PAGE-2207；|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2066 查询原话单与详情|PAGE-2208；|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2067 原已有导出|PAGE-2208；|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2070 原坐席维护允许的独立操作|PAGE-2210；|该原专业资源/集成/运维具体操作权及原平台/供应商/对象管理范围；实际适用模块/服务约束仍核验，不统一要求本人电话坐席或不适用的租户业务成员权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2071 原技能/映射及分组等级允许的维护操作|PAGE-2211；|该原专业资源/集成/运维具体操作权及原平台/供应商/对象管理范围；实际适用模块/服务约束仍核验，不统一要求本人电话坐席或不适用的租户业务成员权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2072 原外呼组允许的维护操作|PAGE-2212；|该原专业资源/集成/运维具体操作权及原平台/供应商/对象管理范围；实际适用模块/服务约束仍核验，不统一要求本人电话坐席或不适用的租户业务成员权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2073 原队列允许的维护操作|PAGE-2213；|该原专业资源/集成/运维具体操作权及原平台/供应商/对象管理范围；实际适用模块/服务约束仍核验，不统一要求本人电话坐席或不适用的租户业务成员权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2074 查询原配置记录与详情|PAGE-2214；|该原专业资源/集成/运维具体操作权及原平台/供应商/对象管理范围；实际适用模块/服务约束仍核验，不统一要求本人电话坐席或不适用的租户业务成员权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2075 原号码允许的维护/分配操作|PAGE-2215；|该原专业资源/集成/运维具体操作权及原平台/供应商/对象管理范围；实际适用模块/服务约束仍核验，不统一要求本人电话坐席或不适用的租户业务成员权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2076 原号码池允许的维护操作|PAGE-2216；|该原专业资源/集成/运维具体操作权及原平台/供应商/对象管理范围；实际适用模块/服务约束仍核验，不统一要求本人电话坐席或不适用的租户业务成员权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2077 原分机允许的维护操作|PAGE-2217；|该原专业资源/集成/运维具体操作权及原平台/供应商/对象管理范围；实际适用模块/服务约束仍核验，不统一要求本人电话坐席或不适用的租户业务成员权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2078 原时间条件允许的维护操作|PAGE-2218；|该原专业资源/集成/运维具体操作权及原平台/供应商/对象管理范围；实际适用模块/服务约束仍核验，不统一要求本人电话坐席或不适用的租户业务成员权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2079 原AliCti账号允许的维护操作|PAGE-2219；|该原专业资源/集成/运维具体操作权及原平台/供应商/对象管理范围；实际适用模块/服务约束仍核验，不统一要求本人电话坐席或不适用的租户业务成员权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2081 查询及核对原异常|PAGE-2221；|该原专业资源/集成/运维具体操作权及原平台/供应商/对象管理范围；实际适用模块/服务约束仍核验，不统一要求本人电话坐席或不适用的租户业务成员权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2035 查询原通话统计|PAGE-2105；|具体原报表/视图与数据范围及实际适用服务/模块条件；明细/录音/导出/财务操作各独立验原权，不统一要求本人坐席或无关任务操作权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2036 查询原计费统计|PAGE-2106；|具体原报表/视图与数据范围及实际适用服务/模块条件；明细/录音/导出/财务操作各独立验原权，不统一要求本人坐席或无关任务操作权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2103 导出租户AI服务汇总|PAGE-2106；FUNC-2027|独立校验原AI租户汇总财务导出操作权及实际有权AI租户范围；公共资料/品牌/统计查询或明细权均不授导出权，导出-only身份不强制获取无关坐席/业务成员权；真实权限及范围未核实则受阻。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2037 查询原线索统计|PAGE-2107；|具体原报表/视图与数据范围及实际适用服务/模块条件；明细/录音/导出/财务操作各独立验原权，不统一要求本人坐席或无关任务操作权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2068 查询所选原报表|PAGE-2209；|具体原报表/视图与数据范围及实际适用服务/模块条件；明细/录音/导出/财务操作各独立验原权，不统一要求本人坐席或无关任务操作权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2069 原已有详情与导出|PAGE-2209；|具体原报表/视图与数据范围及实际适用服务/模块条件；明细/录音/导出/财务操作各独立验原权，不统一要求本人坐席或无关任务操作权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2008 在本租户创建账号并分配权限|PAGE-2003；FUNC-2011, FUNC-2012|有本租户成员管理权限的租户管理员，限可授范围|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2009 调整本租户AI/云呼叫模块业务授权|PAGE-2003；FUNC-2012|有本租户成员管理权限，不包含模块开通|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2010 停用本租户访问|PAGE-2003；FUNC-2013|有本租户成员停用权限的租户管理员|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2011 停用整个登录账号|PAGE-2003；FUNC-2014|超管|删除守卫/身份D及引用S；不重放原获批删除|
|ACTION-2091 为本租户已有账号关联已有坐席|PAGE-2003；|原canEditMember、AccountSeat.scopeError及同租户/企业唯一绑定、非删除/非使用中检查；不改变角色/模块开通|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2102 查询当前有权租户的账号与成员|PAGE-2003；|原AI账号查询操作权 ∩ 当前已验证可管理的租户范围 ∩ 当前对象/字段读取范围；租户管理员仅本租户；其他管理角色亦仅实际获授租户，不由超管称谓或页面可见推导全部数据权限。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2104 删除无业务引用的账号|PAGE-2003；FUNC-2028|具备原账号删除操作权及相应对象范围的人员；不新增权限、不由超管称谓推定|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2012 创建租户并关联品牌|PAGE-2004；FUNC-2005|有权平台超管；同次核品牌和总部/门店身份及原资料/创建条件，未知先核同次，不重复创建。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2013 修改租户基础资料|PAGE-2004；FUNC-2006|有对应资料维护权及租户管理范围的人员|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2014 维护租户品牌关联|PAGE-2004；FUNC-2007|平台超级管理员在相应品牌/租户对象范围内维护；普通平台资料运营、租户管理员或列表查看者不因此有写权。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2015 开通租户AI/云呼叫模块|PAGE-2004；FUNC-2010|超管独立开通，两模块分别配置资源|删除守卫/身份D及引用S；不重放原获批删除|
|ACTION-2105 删除无业务引用的租户|PAGE-2004；FUNC-2029|具备原租户删除操作权及相应对象范围的人员；不新增权限、不由超管称谓推定|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2016 创建品牌|PAGE-2005；FUNC-2008|平台超级管理员在相应品牌/租户对象范围内维护；普通平台资料运营、租户管理员或列表查看者不因此有写权。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2017 修改品牌资料|PAGE-2005；FUNC-2009|平台超级管理员在相应品牌/租户对象范围内维护；普通平台资料运营、租户管理员或列表查看者不因此有写权。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2018 查询有权品牌关联租户|PAGE-2005；FUNC-2026|相应品牌关联租户查看权∩真实租户基础资料范围；查看不含归属修改权，真实角色/权限码依ISSUE-2010核验|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2080 维护原已有应用接入配置|PAGE-2220；|该原专业资源/集成/运维具体操作权及原平台/供应商/对象管理范围；实际适用模块/服务约束仍核验，不统一要求本人电话坐席或不适用的租户业务成员权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2082 查询原审计及详情|PAGE-2222；|该原专业资源/集成/运维具体操作权及原平台/供应商/对象管理范围；实际适用模块/服务约束仍核验，不统一要求本人电话坐席或不适用的租户业务成员权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2040 查询原线索记录|PAGE-2109；|沿原AI对应操作权限；查询、名单操作与配置分别校验原权限，不要求普通查询人员具有配置权；真实操作码待核|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2041 沿原可用标签与回访操作|PAGE-2109；|沿原AI对应操作权限；查询、名单操作与配置分别校验原权限，不要求普通查询人员具有配置权；真实操作码待核|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2045 办理原已有充值操作|PAGE-2112；|原AI财务操作权限，公共租户资料权不代替|原独立试用/年包流水证据保留；本次静态权限/保存核对，不重复交易|
|ACTION-2046 办理原手工调整|PAGE-2112；|原AI手工调整权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2047 查询原充值/调整记录|PAGE-2112；|原财务记录查看权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2083 维护原云呼叫专业字段配置|PAGE-2223；|原云呼叫对应操作权限，租户模块与成员授权均合法；真实操作码/允许动作沿最终v1.1.0|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2085 查询原全部坐席事件|PAGE-2225；|原监控/事件查看权|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2106 查看业务记录资料|PAGE-2226；FUNC-2033|当前查看资格与资料范围，接收方历轮/转出前截止历史分别校验；同手机号或品牌关系不授全量记录。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2107 选择并启动本次跟进方式|PAGE-2227；FUNC-2031|当前负责租户对该记录和本次方式有原执行权/资源，核固定节点允许方式及本租户拨前禁呼；整条记录最近执行段真实结束且结果已保存，换owner/round不豁免，只有记录从未有段才无前段。转交资格不授执行权。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2108 总部下发同品牌门店|PAGE-2227；FUNC-2030|当前记录归本总部且人员有原转交资格；有有效意向只读核对唯一映射门店，无意向仅当前总部租户管理员同次指定合法门店。核该条执行结束且确认不再呼叫、目标及条件；不一律要求前段已保存。成功同次切归属/新轮并清旧安排。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2109 门店上交本品牌总部|PAGE-2227；FUNC-2030|线索当前归属本门店；本租户管理员、运营人员或该线索当前负责坐席可发起；目标为同品牌唯一总部，该条执行安排已结束且确认不再呼叫，提交时再次复核全部条件。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2110 保存本次人工处理结果|PAGE-2227；FUNC-2032|当前段沿原人工操作资格；原已结束未保存段另允许原仍有权人员首次补录，锁原租户/轮次/段/固定表单，不借补录取得新负责方权限，不读下游或覆盖新值；已保存不重写，停用仅限已确认有限收尾。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2116 确认推进当前节点|PAGE-2227；FUNC-2038|仅当前负责租户原有权人员，核固定模板/节点/路径条件及本动作准入；匹配不自动推进。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|
|ACTION-2117 分配当前业务记录|PAGE-2227；FUNC-2037|沿同一分配事务和原分配资格，不因详情可见取得分配权。|静态逐项核对；同页N与相关D参见上表；未声明全分支UI重演|

## 43功能与134验收项双向追溯

逐FUNC核对实现入口、动作边界与AC归属；未擅改功能清单、报价、冻结六区文字或后续已批准五区/三菜单调整。没有从按钮数量倒推新增功能。

| FUNC / 功能 | PAGE | ACTION | AC |
|---|---|---|---|
|FUNC-2001 登录并进入合法入口|PAGE-2001|ACTION-2001, ACTION-2002|AC-2001, AC-2002, AC-2003, AC-2004|
|FUNC-2002 进入有权工作位置|PAGE-2002|ACTION-2003, ACTION-2004, ACTION-2005, ACTION-2006, ACTION-2086, ACTION-2087|AC-2007, AC-2008, AC-2009, AC-2010, AC-2011, AC-2012, AC-2013, AC-2014, AC-2015|
|FUNC-2003 切换当前租户|PAGE-2002|ACTION-2004, ACTION-2005, ACTION-2006|AC-2001, AC-2007, AC-2011, AC-2012, AC-2013, AC-2015|
|FUNC-2004 退出统一登录|PAGE-2001, PAGE-2002|ACTION-2002, ACTION-2004, ACTION-2005, ACTION-2007|AC-2005, AC-2006, AC-2012, AC-2013, AC-2015|
|FUNC-2005 创建业务租户并同次关联品牌|||AC-2016, AC-2017, AC-2018, AC-2035, AC-2081, AC-2082, AC-2095, AC-2096|
|FUNC-2006 修改已有业务租户基础资料|||AC-2016, AC-2017|
|FUNC-2007 保存已有租户品牌关联|||AC-2035, AC-2036, AC-2037, AC-2081, AC-2082, AC-2083|
|FUNC-2008 登记品牌档案|||AC-2033, AC-2034|
|FUNC-2009 修改品牌档案|||AC-2033, AC-2034|
|FUNC-2010 开通租户业务模块|PAGE-2004|ACTION-2015|AC-2019, AC-2020, AC-2021|
|FUNC-2011 创建本租户系统账号|PAGE-2003|ACTION-2008|AC-2022, AC-2023|
|FUNC-2012 配置成员模块权限|PAGE-2003|ACTION-2008, ACTION-2009|AC-2024, AC-2025, AC-2026|
|FUNC-2013 停用本租户人员|PAGE-2003|ACTION-2010|AC-2027, AC-2028, AC-2029|
|FUNC-2014 停用全局登录账号|PAGE-2003|ACTION-2011|AC-2030, AC-2031, AC-2032|
|FUNC-2015 结束停用范围的收尾访问|PAGE-2202|ACTION-2052|AC-2029, AC-2032|
|FUNC-2016 创建品牌共用业务分类基础资料|||AC-2038, AC-2039, AC-2040, AC-2102, AC-2103, AC-2105, AC-2135|
|FUNC-2017 修改品牌共用业务分类基础资料|||AC-2041, AC-2042, AC-2102, AC-2103, AC-2105, AC-2135|
|FUNC-2018 按原规则停用本租户旧目录分类|||AC-2043, AC-2044|
|FUNC-2019 关联具体AI执行场景与业务分类|PAGE-2006, PAGE-2111|ACTION-2022, ACTION-2044|AC-2045, AC-2046, AC-2047|
|FUNC-2020 查询本租户限制名单|PAGE-2007|ACTION-2023|AC-2048, AC-2049, AC-2050|
|FUNC-2021 查看限制名单详情|PAGE-2007|ACTION-2023, ACTION-2026|AC-2048, AC-2049, AC-2050, AC-2061, AC-2062|
|FUNC-2022 自动入库人工拒联|PAGE-2202, PAGE-2227|ACTION-2052, ACTION-2110|AC-2051, AC-2052, AC-2053|
|FUNC-2023 确认AI拒联并加入公共禁呼|PAGE-2007, PAGE-2108|ACTION-2024, ACTION-2039|AC-2054, AC-2055, AC-2056|
|FUNC-2024 执行公共外呼禁呼检查|PAGE-2202, PAGE-2205, PAGE-2206, PAGE-2227|ACTION-2050, ACTION-2059, ACTION-2063, ACTION-2107|AC-2057, AC-2058, AC-2059, AC-2052, AC-2055|
|FUNC-2025 解除本条公共禁呼|PAGE-2007|ACTION-2025|AC-2060, AC-2061, AC-2062|
|FUNC-2026 查询品牌关联租户|PAGE-2005|ACTION-2018|AC-2074, AC-2075, AC-2076, AC-2077|
|FUNC-2027 导出租户AI服务汇总|PAGE-2106|ACTION-2103|AC-2078|
|FUNC-2028 删除无业务引用的账号|PAGE-2003|ACTION-2104|AC-2079|
|FUNC-2029 删除无业务引用的租户|PAGE-2004|ACTION-2105|AC-2080|
|FUNC-2030 转交同品牌线索归属|||AC-2084, AC-2085, AC-2086, AC-2087, AC-2088, AC-2089, AC-2097, AC-2098, AC-2099, AC-2100, AC-2101, AC-2123, AC-2124, AC-2125|
|FUNC-2031 主动启动本次业务处理段|||AC-2090, AC-2091, AC-2120, AC-2121, AC-2122|
|FUNC-2032 归档原处理段结果|||AC-2092, AC-2121, AC-2122, AC-2123, AC-2135|
|FUNC-2033 查看业务记录接续详情|||AC-2093, AC-2094, AC-2131, AC-2132, AC-2133|
|FUNC-2034 创建流转规则模板|||AC-2109, AC-2110, AC-2111, AC-2112, AC-2113, AC-2114|
|FUNC-2035 修改并保存模板新版本|||AC-2109, AC-2110, AC-2111, AC-2112, AC-2113, AC-2114|
|FUNC-2036 按分类导入业务记录|||AC-2115, AC-2116, AC-2117|
|FUNC-2037 分配本租户执行责任|||AC-2118, AC-2119|
|FUNC-2038 确认推进本租户节点|||AC-2120, AC-2122, AC-2123, AC-2124, AC-2125|
|FUNC-2039 查询统一业务台账与批次|||AC-2129, AC-2130, AC-2131, AC-2132, AC-2133|
|FUNC-2040 保存分类独立单模板路由|||AC-2104, AC-2106, AC-2107, AC-2108, AC-2134, AC-2135|
|FUNC-2041 查看流转模板精确版本详情|||AC-2136|
|FUNC-2042 删除未被引用的流转模板|||AC-2137|
|FUNC-2043 导出当前任务客户明细（入口修正）|||AC-2068|

逐AC记录的是审计覆盖与证据边界，**没有将134项整体写为通过**。

| AC / US | 验收要求 | 对应FUNC/PAGE与本次证据 |
|---|---|---|
|AC-2001 / US-2001|一次登录后，先按真实授权确定合法租户；单租户直接进入，多租户首次选择，后续恢复上次仍合法租户。当前租户有权AI/云呼叫功能共用认证，无需再次填写另一套系统凭证。|FUNC-2001, FUNC-2003；PAGE-2001, PAGE-2002。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2002 / US-2001|以AI生产账号/租户及历史归属为存量基准，云呼叫映射接入。|FUNC-2001；PAGE-2001。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2003 / US-2001|首次登录在已开通且有权时优先原云呼叫合法入口；原默认综合概览、无明确本人作业／监管默认入口且同时有导入与分配和云报表权限的人群，首次进入导入与分配。后续恢复上次合法位置；单一模块按其合法入口进入。本次首次选择不新增历史失效兜底优先级。|FUNC-2001；PAGE-2001。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2004 / US-2001|本版不新增统一首页。取消独立运营概览，原入口按有权内容归位；没有业务入口但有公共管理权时，进入公共菜单顺序首个有权页。|FUNC-2001；PAGE-2001。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2005 / US-2002|统一退出系统身份及两模块会话，再次访问受保护页面需要登录；实际会话失效机制待核验。|FUNC-2004；PAGE-2001, PAGE-2002。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2006 / US-2002|退出前处理在途电话及未保存内容，提示和异常细节沿后续流程评审，不直接丢失未保存输入。|FUNC-2004；PAGE-2001, PAGE-2002。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2007 / US-2003|统一界面采用工作台、业务中心、客户中心、呼叫中心、报表中心、系统管理六个顶层功能入口；按既有页面主对象归位并保留原稳定入口及身份。业务集中分类/规则与记录办理，客户集中原档案/联系和有权关联，呼叫集中专业执行与资源；不新增统一首页，不重建专业任务或客户数据。|FUNC-2002, FUNC-2003；PAGE-2002。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2008 / US-2003|六入口是功能展示分组，不新增许可开关、客户业务域角色或统一业务成员门槛。AI/云呼叫仍独立开通；各业务动作按原模块/成员/对象/操作资格，配置、监管、公共名单、原财务和平台资源依各自资格判断，互不自动授权。|FUNC-2002；PAGE-2002。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2009 / US-2003|原合法页面和仅管理功能入口按稳定ID映射到新区域。原首次/历史失效回退及管理菜单顺序意图沿用，不因六入口顶栏排序重算登录优先级；分类或名单迁位不强开业务模块。无合法入口提示受限，身份/租户读取失败与无权分别反馈。|FUNC-2002；PAGE-2002。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2010 / US-2004|同账号同租户返回原合法页面/视图时恢复筛选，重新验权并刷新数据。原公共管理功能分入业务中心、客户中心或系统管理后，仍保留原同窗口进入/返回和同次登录内合法管理页记忆；由被复用功能身份识别，不把整个新区域都当原公共管理。|FUNC-2002；PAGE-2002。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2011 / US-2004|位置按账号、租户及原业务/功能域隔离，原稳定页映射到新导航路径；原管理功能记忆时效、草稿和业务位置规则沿用。失权回退原合法入口，不跨租户恢复对象、不恢复电话在线；不因中心名称改变权限或保存时效。|FUNC-2002, FUNC-2003；PAGE-2002。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2012 / US-2005|沿用原云呼叫电话现场：云呼叫原页面之间（含客户档案、名单作业及云报表）保留电话条及原检查，迁入工作台/业务/客户/呼叫/报表中心不要求额外离线。进入AI专业页、原公共管理功能或切租户前，先完成当前通话、必要话后并确认本人电话坐席离线；边界按实际页面功能判断。|FUNC-2002, FUNC-2003, FUNC-2004；PAGE-2001, PAGE-2002。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2013 / US-2005|普通未保存表单按原流程提示保存、放弃或取消切换；保存失败保留输入并停留原页。|FUNC-2002, FUNC-2003, FUNC-2004；PAGE-2001, PAGE-2002。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2014 / US-2005|AI、预外呼、IVR后台任务按原规则运行；电话坐席退出造成的可用坐席变化沿原任务规则。|FUNC-2002；PAGE-2002。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2015 / US-2005|拨号、振铃、通话、必要话后未保存、离线失败及状态未知均保留保护分支。新顶层区域变化不扩大原Cloud离线要求，同一区域内进入AI或原公共管理功能也不能绕过原保护；仅看监管且本人无电话会话不按他人状态受阻，不新增跨域常驻电话控件。|FUNC-2002, FUNC-2003, FUNC-2004；PAGE-2001, PAGE-2002。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2016 / US-2006|两模块共用同一业务租户及基础资料，AI生产身份及历史关系优先延续。|FUNC-2005, FUNC-2006；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2017 / US-2006|各模块供应商资源、专属配置及业务数据按原规则管理；账号、电话坐席、供应商账号和机器人分别映射。|FUNC-2005, FUNC-2006；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2018 / US-2006|新建业务租户须关联品牌；存量未关联租户保留原有功能并标记待补关联。|FUNC-2005；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2019 / US-2007|超管为租户独立开通AI、云呼叫，支持仅AI、仅云呼叫及两者同时使用。|FUNC-2010；PAGE-2004。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2020 / US-2007|已有AI生产租户沿用当前开通与启停状态；云呼叫完成对应资源配置后单独开通。|FUNC-2010；PAGE-2004。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2021 / US-2007|仅AI不要求云呼叫执行资源，仅云呼叫不要求AI机器人；开通不等于自动给全部成员使用权。|FUNC-2010；PAGE-2004。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2022 / US-2008|公共账号管理按全已有功能原则承接AI文档所述的本租户建号能力；实际生产授权和上限仍待核验，不自动扩展为跨租户建号或授予超管身份。|FUNC-2011；PAGE-2003。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2023 / US-2008|身份冲突及已有账号复用须核对稳定标识后处理，不能因同名或同手机号自动合并、改写历史归属。|FUNC-2011；PAGE-2003。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2024 / US-2009|租户管理员只在本租户已开通模块及允许业务角色范围内维护成员使用和操作权限。|FUNC-2012；PAGE-2003。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2025 / US-2009|同一成员在AI和云呼叫可有不同操作权限，沿用AI生产既有授权并单独分配云呼叫权限。|FUNC-2012；PAGE-2003。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2026 / US-2009|菜单、直接路由和业务操作使用相应授权，具体生产权限码及撤权生效时间待核验。|FUNC-2012；PAGE-2003。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2027 / US-2010|租户管理员停用本租户人员时限制该租户AI/云呼叫访问，其他租户已有授权不受影响。|FUNC-2013；PAGE-2003。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2028 / US-2010|保留历史任务、通话和操作记录；不把本租户停用显示为整个账号停用。|FUNC-2013；PAGE-2003。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2029 / US-2010|本租户人员停用后，禁止其在本租户新增操作；停用时已接通的当前电话及必要话后允许有限收尾，完成后结束该范围使用。停用前系统已受理的AI/预外呼/IVR租户任务在原条件满足时继续，停用者不能再操作，其他已有权人员依原权限管理，不自动转交。|FUNC-2013, FUNC-2015；PAGE-2003, PAGE-2202。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2030 / US-2011|整个登录账号停用归超管，租户管理员不能借本租户停用改动全局状态。|FUNC-2014；PAGE-2003。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2031 / US-2011|全局停用保留历史任务、通话及操作记录；重新启用、删除等不因本项自动新增。|FUNC-2014；PAGE-2003。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2032 / US-2011|账号全局停用后，对全部租户和工作区禁止新增操作；仅允许停用时已接通的当前电话及必要话后有限收尾，完成后结束该范围使用。停用前系统已受理的租户后台任务按原条件继续，停用者不能再操作，不自动转交；会话和电话具体生效机制仍须核验，不能用前端隐藏代替。|FUNC-2014, FUNC-2015；PAGE-2003, PAGE-2202。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2033 / US-2012|接入品牌资料由平台超级管理员统一维护。|FUNC-2008, FUNC-2009；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2034 / US-2012|租户管理员只读本租户品牌归属；不因共享品牌而拥有其他租户权限。|FUNC-2008, FUNC-2009；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2035 / US-2013|关联成功的每个租户只对应一个接入品牌。|FUNC-2005, FUNC-2007；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2036 / US-2013|新建业务租户品牌必填；存量未关联租户保留原有功能。已有历史线索但无品牌的租户允许首次绑定，绑定后有线索时禁止更换品牌及总部/门店身份；不补品牌、初始化轮次或迁移旧线索。|FUNC-2007；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2037 / US-2013|品牌关联变更保留前后信息、操作人和时间；品牌相同不自动共享线索/名单、授予总部品牌全量查看或触发转交。跨租户线索仅按独立的本次转交规则办理，普通租户资料编辑不得绕过归属与身份锁定。|FUNC-2007；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2081 / US-2013|同一接入品牌可关联多个租户。|FUNC-2005, FUNC-2007；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2082 / US-2013|每品牌对应一个总部租户及多个独立门店租户。|FUNC-2005, FUNC-2007；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2083 / US-2013|租户所属品牌由平台超级管理员统一维护。|FUNC-2007；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2095 / US-2013|超管创建业务租户时选择本平台品牌及总部/门店身份，租户和关联同次保存，遵守单品牌及唯一总部。|FUNC-2005；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2096 / US-2013|明确保存后能定位及持久查询记录；保存异常保留填写且无孤立租户或关联，旧会话与历史身份兼容不覆盖既有引用。|FUNC-2005；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2038 / US-2014|新模型由有权超管及租户管理员维护其有管理资格的品牌共用分类，普通运营只选择；替代新模型中的租户独立目录治理。旧租户目录不按同名合并，不把管理品牌配置等同于全品牌数据权限；该治理变化已由SRC2086确认。|FUNC-2016；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2039 / US-2014|公共线索归类采用线索类，AI保留新/冷细分；公共活动归类采用活动类，不另列售前/售后活动或增加相应公共属性。|FUNC-2016；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2040 / US-2014|新增公共分类不自动扩展供应商的AI执行能力，原模块字段及执行规则继续保留。|FUNC-2016；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2102 / US-2014|超管及管理员可在其有管理权限的品牌内维护业务分类和流转模板，同品牌租户共用；配置管理权不自动扩大业务记录查看权。|FUNC-2016, FUNC-2017；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2103 / US-2014|业务分类具有稳定标识，保存业务编码名称、字段与必填配置，统一导入和查看按分类配置生成内容。|FUNC-2016, FUNC-2017；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2105 / US-2014|流转标签条件直接引用本品牌业务分类中已添加且显示/启用的多选字段及其稳定选项ID；不再另行指定单一标签来源。每条规则按自己的fieldId取本记录当前有效已保存值，字段之间独立，不按名称或首字段猜取。|FUNC-2016, FUNC-2017；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2041 / US-2015|新模型的有权管理人员修改品牌共用分类基础资料，只改基础信息、原字段显示/顺序/必填和取数配置；不另指定标签来源，单模板路由独立保存。修改不追改既有实例快照，不取得AI专业配置权；旧租户目录及旧AI关联继续按原ID和原规则处理。|FUNC-2017；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2042 / US-2015|公共分类保持一个基础主维护入口，承接原字段顺序、显示、必填、专业编码说明及取数接口字典，保原多源属性到多参数、接口单/多选等已有类型及原授权；独立路由只保存一个模板版本及兼容状态，不覆盖基础/接口。AI场景类型、供应商参数及历史统计语义保留，不复制第二份可编辑分类，也不扩大原取数来源。|FUNC-2017；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2043 / US-2016|租户管理员可停用本租户公共分类，未据此增加物理删除能力。|FUNC-2018；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2044 / US-2016|公共分类停用后仅禁止新选择和新关联；已关联该分类的AI场景保留原关联，并可按原专业规则继续创建任务；已受理任务按原规则继续，历史分类和专业执行参数保留，不自动解除或改写关联。|FUNC-2018；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2045 / US-2017|在原标签管理→场景配置入口补充公共分类关联，保留AI原分类、标签及供应商配置。|FUNC-2019；PAGE-2006, PAGE-2111。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2046 / US-2017|公共分类维护权不下放AI专业配置权，新/冷细分及供应商执行允许值沿原规则。保原供应商标签池按supplierId、标签启用与映射按supplierId+总部/门店租户类型+AI标签场景、本地标准集按租户类型+标签场景的作用域；标签场景、具体AI执行场景及公共分类以准确身份关联，不因品牌共用就共享全部标签。|FUNC-2019；PAGE-2006, PAGE-2111。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2047 / US-2017|按本租户具体AI业务场景，以稳定ID关联当前品牌有权共用的公共分类；同一AI类型的不同场景可分别归类，沿原标签管理→场景配置入口，保留原AI类型、专业标签/供应商参数和权限。旧租户分类关联保留原ID，不按名称自动合并，实际映射及生产历史引用继续核验。 存量未绑定品牌仍按原租户目录及原ID维护旧配置，不被新品牌前置阻断；新选品牌分类才核品牌引用。|FUNC-2019；PAGE-2006, PAGE-2111。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2048 / US-2018|客户中心的联系限制入口承接当前租户原公共及专项名单的唯一主维护，原AI拦截入口继续作为同一名单的有权范围视图。保留来源、分组、专项范围、期限和原操作资格，不建立第二份客户名单/禁呼开关，不自动跨租户或品牌共享。|FUNC-2020, FUNC-2021；PAGE-2007。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2049 / US-2018|历史名单按证据和当前有效状态分流承接：当前有效、租户归属清楚且可核实客户明确拒联证据的记录，经对账后纳入当前租户公共拒联；AI意向保护等专项保留原范围及期限；已解除或已到期记录不重新生效；证据、期限或解除含义不明的保留原记录和原系统既有约束待核，不自动永久化或扩为四类公共禁呼。|FUNC-2020, FUNC-2021；PAGE-2007。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2050 / US-2018|本地生效与已有供应商同步状态分开表达；没有实际回执不能显示远端已成功。|FUNC-2020, FUNC-2021；PAGE-2007。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2051 / US-2019|坐席成功保存客户拒绝联系处理结果后，自动加入本租户公共禁呼，无需管理员再次确认。|FUNC-2022；PAGE-2202, PAGE-2227。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2052 / US-2019|保留来源通话、操作人和时间，四类外呼禁呼且长期有效，正常呼入继续接听。|FUNC-2022, FUNC-2024；PAGE-2202, PAGE-2205, PAGE-2206, PAGE-2227。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2053 / US-2019|仅选择而未保存成功不算完成入库；保存与入库一致性、失败恢复须在流程与接口阶段解决，不能虚报整体成功。|FUNC-2022；PAGE-2202, PAGE-2227。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2054 / US-2020|有权管理员及单独获公共禁呼新增授权的运营，需有权查看本租户来源通话并确认拒联后从公共入口加入。|FUNC-2023；PAGE-2007, PAGE-2108。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2055 / US-2020|保留来源及人工确认记录，长期有效、四类外呼拦截；运营新增权不包含解除权。|FUNC-2023, FUNC-2024；PAGE-2007, PAGE-2108, PAGE-2202, PAGE-2205, PAGE-2206, PAGE-2227。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2056 / US-2020|本版不自动按AI结果入库；无意向、拒接、挂机、混合意向等级及供应商拦截结果不直接认定明确拒联。|FUNC-2023；PAGE-2007, PAGE-2108。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2057 / US-2021|公共禁呼覆盖AI、人工、预外呼、IVR，正常呼入不因此被拒接。|FUNC-2024；PAGE-2202, PAGE-2205, PAGE-2206, PAGE-2227。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2058 / US-2021|首次外呼、重呼及异常补提交须接入禁呼检查，不能以供应商restrict tel补提交规则绕过客户明确拒联。|FUNC-2024；PAGE-2202, PAGE-2205, PAGE-2206, PAGE-2227。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2059 / US-2021|供应商已接收未拨号码的拦截/取消/删除能力逐供应商核验，能力不足须提交差异，不能降低已确认覆盖目标。|FUNC-2024；PAGE-2202, PAGE-2205, PAGE-2206, PAGE-2227。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2060 / US-2022|仅本租户管理员或有该租户管理权限的平台管理员解除，填写原因、保留操作人和时间。|FUNC-2025；PAGE-2007。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2061 / US-2022|只有业务运营或只有新增名单权限者不能解除；保留原入库来源和解除历史。|FUNC-2021, FUNC-2025；PAGE-2007。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2062 / US-2022|已解除或已到期的历史记录不因旧事件或历史承接重新生效；仅解除本条不自动清除其他来源限制。真实记录的来源/期限/解除含义、多来源有效判定、解除生效时点及远端处理结果仍按实际契约核验后细化。|FUNC-2021, FUNC-2025；PAGE-2007。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2063 / US-2023|接入AI全部已有可用功能，原专业参数、机器人/供应商差异与执行统计规则保留；占位不自动新增开发。|；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2064 / US-2023|原AI任务、通话／计费／线索统计、通话／线索记录、场景／标签及专业服务充值能力全量盘点；原首页摘要与使用情况合并为AI用量与服务，摘要／明细／财务分权；原拦截能力归同一公共名单的AI范围。保留旧PAGE及ACTION来源追溯，最终范围以生产可用清单复核。 原供应商标签池、场景启用及标准标签映射继续保来源和原授权；名称推荐/首项兜底不是已确认映射或业务结果，不能据此写业务字段、覆盖人工结果或判路径匹配。本版AI标签仅整合配置、映射和结果展示；不新增AI标准标签向业务字段写入及由此新增自动流转。原供应商池/场景映射/标准关联、原始及映射结果保留，未匹配保原值且不回退首项；既有业务字段条件、人工保存和其他原有流转不变。仅限本版，不作未来永久限制。|；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2065 / US-2023|账号与租户基础资料移交公共后，AI专属资源、计费/分钟与充值业务继续保留，不自动合并云呼叫账务。|；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2078 / US-2023|原租户AI汇总CSV改用当前统一分钟与服务口径，仅含租户名称、租户ID、租户类型、可用分钟、冻结分钟、累计消耗分钟、有效期、呼叫控制状态8列；移除冲突的旧金额及大/小模型独立可用余额列，不换算或恢复旧账。复用原全部有权AI租户导出意图和CSV下载交互，文件为当前服务快照，与原计费统计日期/平台筛选及公共租户列表筛选分开；财务导出权、实际有权租户范围、身份映射和可靠一致取数须按真实能力核验，未证实则受阻，不由本次列口径确认授予或扩大权限，不改其他原报表。|FUNC-2027；PAGE-2106。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2079 / US-2023|原AI账号删除在PAGE-2003沿原删除权承接为准确账号主体删除，独立于本租户成员移除、停用和坐席删除；仅无任务、通话、账务等业务引用且没有其他租户关联时允许删除，有业务历史则禁止删除，必要删除审计及稳定身份追溯保留。复用原确认和反馈，提交前及最终提交时一致校验准确对象、原权和资格；未核实体/原权/一致执行能力时不调用DELETE，明确失败保留可确认状态，结果未知先按已有可靠能力核对、不盲重试，HTTP200或列表查不到不单独算成功，不因超管称谓授予删除权。|FUNC-2028；PAGE-2003。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2080 / US-2023|原AI租户删除在PAGE-2004沿原删除权只作用于准确单个业务租户；仅无任务、通话、账务等业务引用时可删，有业务历史继续保留，必要删除审计保留并维持原默认管理组不可删保护。复用原确认和反馈，最终提交中一致校验对象、原权和资格，引用/授权并发变化时拒绝或按真实结果处理；实体/能力未核不调用DELETE，失败或未知不假报成功、不盲重试，HTTP200或列表查不到不能单独证明已删。不级联清历史、自动清账/取消任务，不删除品牌或其他租户，不增租户停用或新增删除权限。|FUNC-2029；PAGE-2004。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2066 / US-2024|承接云呼叫最终v1.1.0范围内的人工工作台、主动外呼、呼入接听、跟进与保存结果，沿各自原规则。|；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2067 / US-2024|当前核对口径包括人工接口线索指定坐席、振铃填写和后续人工跟进；最终以v1.1.0确认基线逐项对账，不在v2改写其需求。|；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2068 / US-2025|承接v1.1.0最终范围的预外呼任务、导入、任务所用坐席／外呼组及其他资源、正常重呼、异常补提交及结果查询/下载，原执行规则保留。|FUNC-2043；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2069 / US-2025|公共禁呼检查接入不改变原供应商失败分类及额度，不将预外呼策略套用于人工或IVR。|；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2070 / US-2026|承接既有IVR外呼任务、语音流程资源及结果处理，与人工/预外呼各自执行方式区分。|；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2071 / US-2026|资源必须归属对应租户、供应商账号及外呼用途；具体校验沿原最终基线，不把本地或呼入流程ID直接当可执行外呼资源。|；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2072 / US-2027|承接云呼叫v1.1.0最终范围的坐席／供应商资源、呼入配置、记录、七类原报表及必要DCC导入／回传／应用接入。原综合概览的统计、任务、监管、租户及号码片段归既有目标，来源查看权不授目标整页、导出或写入；不合并AI／Cloud指标或账务。 继续复用原导入分配、批次详情、字段与取数字典、人工结果“待继续跟进/已完成”、原完成回传及按tenantId+enterpriseId+规范号码和原权限归集的联系历史。原任务确已缺失、无通话且未处理中时，沿原有权管理员手工恢复待分配；不扩大为客户公海或自动回收，不用手机号合并业务记录。|；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2073 / US-2027|必要接口承接本身不扩业务范围；v1.2同品牌总部/门店线索流转按SRC-2081本次明确要求独立纳入，完整DCC业务、通用自动规则引擎及独立v1.1.1新接口需求不自动加入本版。|；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2074 / US-2028|在品牌管理提供关联租户列表，按当前品牌与操作人有权查看的租户基础资料范围取交集，只展示该范围内的基础资料。|FUNC-2026；PAGE-2005。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2075 / US-2028|同品牌不授予其他租户的基础资料、业务、线索、任务或报表权限；无权租户不得因列表、直接请求或维护入口被展示或进入。|FUNC-2026；PAGE-2005。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2076 / US-2028|查询列表不自动修改归属；需要维护时复用既有租户管理路径及品牌归属维护权限，列表查看权不包含归属修改权。|FUNC-2026；PAGE-2005。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2077 / US-2028|区分无关联记录、可查看交集为空、查询失败及品牌或权限失效；失败保留查询上下文，不将缓存当最新结果，进入维护前再次核验实际权限。|FUNC-2026；PAGE-2005。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2084 / US-2029|转交成功即把跟进归属从A切换给B，由B接续，无需B再确认接收；同次清除旧租户的assignment/assignedAccountId等执行安排，接收方另按本租户资格分配，不带入旧坐席、不自动发起呼叫。|FUNC-2030；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2085 / US-2029|本期跨租户线索转交发生在同一品牌关联范围内。|FUNC-2030；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2086 / US-2029|支持媒体来源线索经总部培育后，由人员确认向该线索意向门店所唯一对应的同品牌有效门店租户转交；没有意向门店时按总部待指派分支处理，不任意指定另一门店。|FUNC-2030；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2087 / US-2029|支持门店自有线索经门店培育后按既有流程上交总部；总部再培育后按意向门店锚定规则或无意向待指派分支确认下发，不因缺少意向门店自动改变门店原归属。|FUNC-2030；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2088 / US-2029|门店不能直接向另一门店转交线索。|FUNC-2030；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2089 / US-2029|门店培育后需要再分给门店时，先按既有流程交总部；总部再按线索意向门店锚定下发，无意向门店时由总部管理员补选并确认，门店不能直接互转。|FUNC-2030；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2097 / US-2029|总部下发或再分发时，目标只由本条线索的意向门店唯一解析到同品牌有效门店租户；有权人员核对并确认，不能改选其他门店，解析本身不自动转交或呼叫。|FUNC-2030；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2098 / US-2029|总部当前线索缺失意向门店时，沿用同一记录标记目标门店待指派，保留原记录ID、品牌编码、批次和历史，总部继续负责；不复制线索、不新增模板实例、不将其等同于坐席或任务未分配。|FUNC-2030；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2099 / US-2029|目标门店待指派时，仅当前负责总部租户管理员可在本次转交中补选同品牌有效门店并确认提交；运营、当前坐席及超管监管身份不因此获得该补选资格，查看仍沿原有授权范围。 成功后保留客户原始意向，另行记录人工指派来源、目标、指派人和时间。|FUNC-2030；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2100 / US-2029|已有意向门店但缺少可靠身份、无对应租户、映射不唯一、跨品牌或目标停用等情况明确标记映射待核或不可办理；不能按门店名称、列表首店猜测，不能伪装无意向门店而开放任意补选。|FUNC-2030；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2101 / US-2029|提交下发时重新核对本条意向门店或无意向补选分支、目标映射与有效性、当前资格/归属/固定模板节点及不再呼叫条件；字段或映射变化、取消、失败和结果未知均不伪报转交成功，同次幂等不重复切换归属或建轮次。|FUNC-2030；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2090 / US-2030|总部处理媒体线索及承接门店上交线索的培育阶段均支持选择AI、预外呼、人工跟进。|FUNC-2031；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2091 / US-2030|门店处理自有线索及承接总部下发线索的培育阶段均支持选择AI、预外呼、人工跟进。|FUNC-2031；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2092 / US-2030|每一轮由当前负责租户按需组合或先后使用AI、预外呼、人工。启动下一方式核整条记录最近执行段已结束且结果保存，换负责租户或换轮次不能豁免，只有整条记录从未有执行段才无前段；转交本身仍按结束且不再呼叫准入，不一律追加结果先保存。原有权人员可首次补录已结束未保存的原人工段，锁原租户/轮次/段及固定表单，不读取下游字段、不改新归属或覆盖当前值；已保存结果不可借补录重写，停用仍限已确认收尾。|FUNC-2032；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2093 / US-2031|接收租户可查看转入线索的基本信息。|FUNC-2033；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2094 / US-2031|接收租户可查看该线索历轮跟进结果。|FUNC-2033；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2104 / US-2032|对已保存的本品牌业务分类，从分类列表独立路由配置入口关联且只关联一个有效流转模板保存版本；核对品牌、分类字段/标签、节点及路径条件兼容；不提供备用模板或接续映射配置。|FUNC-2040；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2106 / US-2032|分类列表保留独立路由配置按钮和独立保存；基础新增/编辑不嵌入模板关联；路由配置只选择一个模板并展示节点说明。|FUNC-2040；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2107 / US-2032|独立路由保存只更新本次选定的一个模板版本及兼容结果；核品牌、BASE/字段与ROUTE版本，不覆盖分类名称/字段/接口；冲突、取消或响应未知保留输入，同次核对不重复生成版本。|FUNC-2040；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2108 / US-2032|分类可先保留为未关联模板；仅有关联的有效兼容模板才能接收新数据。分类字段变更破坏模板条件兼容时保引用、标需复核并拦新输入。新记录固定当时基础、路由和单一模板/路径条件快照；既有实例及历史不追改。|FUNC-2040；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2134 / US-2032|路由配置选择模板后立即只读展示该精确保存版本的模板名称/版本、起始节点及各节点名称、职责、允许处理方式、后续路径与已配置条件；不修改模板内容，不假定列表顺序就是线性流转，未选择显示引导空态。|FUNC-2040；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2135 / US-2032|分类新增/编辑与独立路由均无独立标签来源指定控件；保存分类不提交tagFieldId。路由逐条件校验fieldId及选项属于分类已启用多选字段，既有字段/路由互不覆盖。新记录按各字段固定定义和各自当前已保存值判定，省略不清空、显式空数组只清该字段、旧段迟到不覆盖更新值；旧历史不迁移。|FUNC-2016, FUNC-2017, FUNC-2032, FUNC-2040；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2109 / US-2033|有权配置人员可创建模板，或修改模板并形成可识别的新版本；节点包含职责、处理方式及合法接续路径。 新建模板不预设节点，添加节点为空白，由有权人员逐个配置；起始节点明确选择。|FUNC-2034, FUNC-2035；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2110 / US-2033|业务实例记录使用的模板版本；后续修改模板不得静默改变已经执行的节点或历史资料。|FUNC-2034, FUNC-2035；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2111 / US-2033|模板保持品牌及目标资格校验；线索分类继续遵守总部与门店合法方向，模板不能绕过执行与归属准入。|FUNC-2034, FUNC-2035；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2112 / US-2033|有权超管或品牌租户管理员可在流转模板的后续路径上配置通话状态、线索标签等流转条件；只有所选路径条件符合才允许确认流转，条件配置不是自动呼叫或自动推进开关。|FUNC-2034, FUNC-2035；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2113 / US-2033|多条条件支持配置全部满足或任一满足；同一个通话状态条件可选择多个状态，实际状态命中任一所选值即符合该条条件。|FUNC-2034, FUNC-2035；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2114 / US-2033|后续路径可不配置附加条件并沿用原人工准入；开启条件则须有合法规则，条件组支持ALL/ANY，通话状态单规则多值命中任一，标签规则可配置包含任一或包含全部。字段须来自可核目录、类型及操作符相容、所选状态或标签选项身份有效；空规则、缺失/停用字段或非法值不得保存为可用条件。 普通配置操作局部更新并保留滚动位置、已有输入和展开状态；暂时关闭再开启条件保留组合及规则草稿，新增节点和保存校验可按意图定位。|FUNC-2034, FUNC-2035；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2136 / US-2033|流转模板列表提供独立查看详情入口；只读展示精确保存版本的名称、起始节点、各节点职责、允许方式、后续路径与条件，字段含义与新增/编辑一致；历史配置为辅助只读查看，不能修改已保存版本。|FUNC-2041；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2137 / US-2033|流转模板列表提供独立删除入口；有权人员核对后仅可删除没有分类当前/历史、记录/批次或待核配置引用的模板；提交复核品牌权限、模板版本与引用，取消/失败不删除，响应未知只核同次结果，引用保护不得被绕过，已有实例和历史不受影响。|FUNC-2042；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2115 / US-2034|导入前选择有权业务分类，字段、业务编码名称和必填校验随分类配置变化，至少用线索类和另一分类验收。|FUNC-2036；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2116 / US-2034|业务记录在同品牌、同业务分类内编码唯一，跨分类可以同码；线索分类保留品牌内线索编码唯一。不以手机号归并，平台记录ID稳定。|FUNC-2036；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2117 / US-2034|导入结果能在统一台账定位并继续分配/处理；同条业务重复接收不得覆盖当前归属及既有历史，冲突给出明确处理结果。|FUNC-2036；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2118 / US-2035|租户内分配坐席或加入任务不改变负责租户；跨租户归属转交作为不同业务动作执行并留痕。|FUNC-2037；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2119 / US-2035|分配时核对当前归属、人员资格、分类节点允许方式、记录/安排版本及本租户任务/坐席资源；过期或无权不改变记录。复用原批次多选分配时逐条复核，共同资源合法后同次提交，任一行失败全批不写，不以分配代替租户转交或自动启动。|FUNC-2037；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2120 / US-2036|节点由人员确认推进，处理方式也由人员主动启动；选择模板不自动发起呼叫或转交。|FUNC-2031, FUNC-2038；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2121 / US-2036|线索分类同一条记录串行执行。人员启动下一种方式时核整条记录最近执行段已结束且结果保存，换租户/换轮次不免除；仅整条记录从未有执行段时无前段。实际租户转交只按执行结束及确认不再呼叫等原准入，不额外要求所有前段结果已保存。|FUNC-2031, FUNC-2032；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2122 / US-2036|受理、结束、保存、归属与节点推进分别确认；办理状态待核先核对同次实际结果，不能重复推进或制造重复执行。|FUNC-2031, FUNC-2032, FUNC-2038；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2123 / US-2036|条件通话状态取当前负责租户当前培育轮次最近一次已结束通话，不用其他租户或历史轮次任意命中；每条多选规则直接按自身fieldId/optionId读取本记录对应字段当前有效已保存值及来源/版本，各字段独立，不借同名或首字段代取。本版AI标签仅整合配置、映射和结果展示；不新增AI标准标签向业务字段写入及由此新增自动流转。原供应商池/场景映射/标准关联、原始及映射结果保留，未匹配保原值且不回退首项；既有业务字段条件、人工保存和其他原有流转不变。仅限本版，不作未来永久限制。|FUNC-2030, FUNC-2032, FUNC-2038；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2124 / US-2036|办理时分别显示匹配、未匹配、待核及原因；未满足或整体待核时保留原节点/归属，不自动推进、呼叫或更换模板。缺值/未知的单条规则不当作true；ALL为任一明确false则不匹配、否则有unknown则待核，ANY为任一明确true则匹配、否则有unknown则待核，其余按正常三值逻辑。多条路径明确符合时由人员选择一条，不默认首条或使用历史任意命中。|FUNC-2030, FUNC-2038；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2125 / US-2036|人员确认所选路径时，重新核对固定单模板版本/路径、当前负责租户本轮最近结束通话，以及各规则对应业务fieldId当前有效已保存值/来源/定义和值版本，同时满足原权限、节点、门店锚定/无意向HQ管理员同次指派与执行准入。配置或取值过期须重核；无附加条件不豁免原准入，只有条件实际引用的字段须已有可核值，不把所有转交统一加上先保存结果要求。|FUNC-2030, FUNC-2038；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2129 / US-2038|超管具有所管理品牌/租户/分类的监管查看视角，菜单、列表、详情与直接访问资格一致；监管查看不自动赋予业务代处理权限。|FUNC-2039；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2130 / US-2038|监管查询和业务处理读取同一记录及实际轨迹，不需要冒用业务租户身份或建立第二份线索表。|FUNC-2039；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2131 / US-2039|工作区统一承载数据台账、导入批次及记录详情，展示字段按分类变化，旧入口可定位对应记录或批次。|FUNC-2033, FUNC-2039；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2132 / US-2039|业务人员仍按当前负责或有权历史范围查看；线索已转出方按截止裁剪，再次承接按当前身份，不因品牌共用配置获得全品牌业务数据权。|FUNC-2033, FUNC-2039；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|
|AC-2133 / US-2039|仅新进入的数据使用模板；存量保留原查询和原处理，不自动迁移或绑定新模板。分类配置或名称变化后新模型历史按保存快照可读。|FUNC-2033, FUNC-2039；。源追溯S已核；N/D仅限对应测试，外部/未重演分支P。|

## 仍需用户/研发的最小步骤

1. **file与文件选择人工验收（P）**：直接双击唯一index.html，核验登录→合法租户→AI/云专业页→阅读图页；在独立测试范围选择合法.xlsx/CSV检查预览，确认取消/重新选择会使旧检查失效。原浏览器业务记录、既有批次和财务流水不清理、不重导。本次HTTP和字节模型不能替代file通过。
2. **ACTION-2059（P）**：提供实际部署API/build、任务type、识别开关，同tenant/enterprise/task/file/phone的retry/timeType/次数配置、首次原始718及后续attemptId/时间记录；区别718、聚合-700、重复/晚到话单。无需再造本地调度器，也无需为此再次导入。
3. **供应商终态/标签/禁呼（P）**：固定task/segment/providerID、原rawDomain/code/label、最终重试完成及无剩余重试证明；标签实际supplier/tenant/type/scene/category/brand/稳定ID与版本。天润manual 1–4、predictive 40–43、auto 40–43域独立，坐席接听不等于客户接听；718是sipCauseRaw。真实解除须精确来源回执，停同步不是解除。
4. **原12延期/14工程缺证（P）**：沿open-items现有项，不因本次Mock、文档或原112计数关闭。localStorage旧版本比较能拒陈旧窗口，但不承诺跨进程同时提交的数据库原子性；生产需服务端并发/幂等与权限契约。
5. **正式基线状态**：import_analysis.py verify拒绝，原因是项目原配置mode=none/status=not-imported，formalG3Approved=false；本轮未擅自导入、盖章或更改该状态。190参考/90锁定逐文件哈希独立核验不替代正式G3冻结。
6. **当前接口使用边界**：checkBatch的complete=false仅核公共限制，当前唯一调用是Cloud PREDICTIVE/IVR，AI包调用数0；未来AI若接该入口必须补专项及完整名单证明。未将该未调用分支误报为现有UI绕过。

## 交付与进程状态

```json
{
  "complete": true,
  "scope": "All autonomous audit fixes, targeted regression and requested role-permission document completed; external/manual acceptance remains open",
  "time": "2026-10-28T12:58:19.545411+08:00",
  "entry": "/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/index.html",
  "report": "/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/memory/independent-audit-20261028.md",
  "rolePermissions": "/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/docs/role-permissions.md",
  "ownBrowserTestsEnded": true,
  "ownLocalServersEnded": true,
  "ownModelTestsEnded": true,
  "subagentsEnded": true,
  "scopedProcessQuery": "No matches; pgrep exit 1 for exact own UI scripts",
  "cleanup": "template-ui 14 assertions passed; browser child already closed, verified own lingering Node PID66601 terminated SIGTERM; no other process stopped",
  "originalAcceptanceBrowserTouched": false,
  "realCallsOrProviderRequests": false,
  "realTransactions": false,
  "priorApprovedDataOperationsReplayed": false,
  "referenceOrFrozenChanges": 0,
  "writeOwnershipReleasedAtFinalResponse": true,
  "fullACorProductionPass": false
}
```

唯一正式入口维持 `2.0.0/prototype/index.html`。无替代原型、备份包或ZIP；参考/锁定文件保护结果以final-checks为准。
