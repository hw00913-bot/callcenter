/* Current product reading guide. Original source SVG geometry is not modified. */
(function(){
 'use strict';
 const root=document.documentElement,kind=root.dataset.deliveryDiagram||document.querySelector('[data-delivery-diagram]')?.dataset.deliveryDiagram;
 if(!kind||document.getElementById('current-product-guide'))return;
 const style=document.createElement('style');style.textContent='.current-product-guide{margin:16px 20px;padding:18px 22px;background:#fff;border:1px solid #d6e4ff;border-radius:10px;color:#243746;font:14px/1.65 system-ui,sans-serif}.current-product-guide h2{margin:0 0 8px;font-size:19px}.current-product-guide p{margin:8px 0}.current-chain{display:flex;align-items:stretch;gap:8px;overflow:auto;padding:10px 0}.current-chain-node{flex:1;min-width:145px;padding:12px;border:1px solid #b6d0ff;border-radius:7px;background:#f3f7ff}.current-chain-node b{display:block;margin-bottom:5px;color:#17478f}.current-chain-arrow{align-self:center;color:#1677ff;font-size:20px}.current-sequence{width:100%;border-collapse:collapse;margin:12px 0}.current-sequence th,.current-sequence td{text-align:left;border:1px solid #e2e8f0;padding:9px;vertical-align:top}.current-sequence th{background:#f3f7ff}.current-reference-note{color:#64748b;font-size:13px}';document.head.appendChild(style);
 const sourceNote=[...document.querySelectorAll('header p')].find(node=>node.textContent.startsWith('本地模拟评审，生产待核事项保留'));if(sourceNote)sourceNote.textContent='本地Mock评审，生产待核事项保留。当前配置按四节点、两办理模式及最新产品规格执行；不提供旧v2模板或数据迁移。已开始的本版运行与正式快照保留，原始图集仅作来源参照。当前链条与时序见下方说明。';
 const guide=document.createElement('section');guide.id='current-product-guide';guide.className='current-product-guide';guide.dataset.currentProductBaseline='2.0.0-current-step45';
 const process='<h2>当前业务链：分类 → 导入 → 分配 → 跟进</h2><div class="current-chain" aria-label="当前产品业务流程">'+[
 ['配置','品牌内分别维护导入/填写字段。AI场景引用导入字段并映射供应商参数。模板只参考字段，分类路由才绑定实际使用关系。'],
 ['导入','客户维护选择直接跟进或按模板流转；AI／预外呼任务内导入固定直接跟进，读取分类导入字段并带入当前任务。基础及分类校验通过后同次建立统一业务，不建模板运行。'],
 ['安排与呼叫','人工可先待分配，或指定有效坐席；预外呼仅选具体任务，AI选择任务与适配场景。无需另选责任人。同资源可办理项按五档/FIFO，由有权人员确认起呼。'],
 ['跟进归档','准确通话及实际办理人对应；新跟进读最新资料，正式内容与当时快照保留。必要内容无法补填时，由当前负责租户管理员明确核实并保缺失事实，可靠停止后独立完成废弃收尾，不计正常完成。'],
 ['条件与去向','按顺序首命中；所有有出口节点唯一末位ELSE，未知停留。人员确认后本租户继续或合法转交。'],
 ['结束与接续','结束节点关闭业务，或先结束原运行再转无模板人工跟进；不会自动发起下一通。']
 ].map((x,i)=>(i?'<span class="current-chain-arrow" aria-hidden="true">→</span>':'')+'<div class="current-chain-node"><b>'+x[0]+'</b>'+x[1]+'</div>').join('')+'</div><p>四节点为开始、转交、呼叫、结束。CURRENT为本租户节点继续，保持归属与阶段；OTHER才做合法同品牌跨租户转交并清旧安排。已开始运行保持捕获方案；新运行使用最新确认配置。</p>';
 const sequence='<h2>当前交互时序：请求、执行事实与归档分别确认</h2><table class="current-sequence" aria-label="当前产品交互时序"><thead><tr><th>顺序</th><th>操作人 / 页面</th><th>业务模型与结果</th><th>外部执行边界</th></tr></thead><tbody>'+[
 ['1','客户维护选择分类/办理模式，或在AI／预外呼任务内导入并检查名单','读取最新分类导入字段；AI按场景引用及参数映射核必需值。任务内固定DIRECT，不依赖模板；分类仍须允许直接跟进，错误保留输入','当前原型使用本地资料；供应商身份不按名称推断'],
 ['2','确认本次导入及必要的当前节点执行安排','同次创建统一批次/业务、完整字段/来源任务/参数快照和五档安排。人工可稍后分配；TEMPLATE捕获运行方案，任务内DIRECT保独立周期、不创建模板节点','导入及分配不自动发起外呼；统一业务保存不伪造供应商名单或受理回执'],
 ['3','手动分配人工坐席，或调整任务/场景和五档优先级；确认发起','重核当前执行目标与联系限制。同资源可办理项先高后低、同级入队FIFO，不抢占已受理执行；受理不算实际拨打','真实CTI/供应商调度及回调由开发联调，本地顺序与执行事件明确标为模拟'],
 ['4','接收准确执行结果，实际办理人填写','按本次执行身份保存正式内容及快照；当前有效值更正留原因，旧快照不改','未知结果核同请求；停止处理中仍登记原已受理执行的准确迟到事实，不授权新派发或提前释放；不伪造已接通、重试结束或远端成功'],
 ['5','确认唯一命中去向','重核判断与目标令牌；本租户继续、合法转交或END后续动作','归属变化、运行结束与业务成交分别记录，不自动替代'],
 ['6','下一次跟进或新运行','每次新跟进读最新资料，已开始运行继续原方案；END首人工周期例外不延续到新周期，新周期重验分类开关。旧废弃收尾与正常归档分开，原事实仍可追溯','生产幂等、事务、权限和时点由真实工程验证']
 ].map(x=>'<tr>'+x.map(v=>'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
 guide.innerHTML=(kind==='sequence-interaction'?sequence:process)+'<p class="current-reference-note">当前说明依据已确认的四节点、两办理模式及步骤29～45补充，包含任务内分类字段同源导入、AI场景独立DIRECT、供应商参数映射、统一业务/任务来源、人工分配/指定坐席、预外呼仅任务、去独立责任人和最高、高、中、低、最低五档执行优先级（默认中）。下方保留原始分析图集及其来源几何，供追溯关系；其中早期只分配跟进人、电话离开前置、可选兜底、空白节点或版本选择等说法按当前产品规格的替代记录理解。真实接口和批准状态独立核验。</p>';
 const main=document.querySelector('main');if(main)main.insertBefore(guide,main.firstChild);else document.body.insertBefore(guide,document.body.firstChild);
})();
