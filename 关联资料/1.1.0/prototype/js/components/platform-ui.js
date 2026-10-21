/** 统一 B 端展示组件。 */
(function () {
  'use strict';

  const toneMap = {
    '健康': 'success', '平稳': 'success', '已启用': 'success', '启用': 'success', '已发布': 'success', '已处理': 'success', '已投递': 'success', '已通过': 'success', '已恢复': 'success', '已完成': 'success', '已收到': 'success', '已就绪': 'success', '已同步': 'success', '同步成功': 'success', '完整': 'success', '空闲': 'success', '可用': 'success', '可承接服务': 'success', '可接收': 'success', '已开放': 'success', '接通': 'success', '执行中': 'processing', '处理中': 'processing', '通知中': 'processing', '同步中': 'processing',
    '已暂停': 'warning', '已升级': 'warning', '需关注': 'warning', '需复核': 'warning', '需增援': 'warning', '待接单': 'warning', '待人工处理': 'warning', '待补全': 'warning', '待就绪': 'warning', '待核验': 'warning', '待发布': 'warning', '待分配技能': 'warning', '停用中': 'warning', '空组不可承接': 'warning', '降级': 'warning', '小休': 'warning', '话后处理': 'warning', '重试中': 'warning', '部分通过': 'warning', '待验收': 'warning', '录音未就绪': 'warning',
    '异常': 'danger', '资源不足': 'danger', '资源不足暂停': 'danger', '同步失败': 'danger', '删除失败': 'danger', '失败': 'danger', '死信': 'danger', '冲突': 'danger', '回流失败': 'danger', '详单缺失': 'danger', '录音缺失': 'danger',
    '离线': 'neutral', '已停用': 'neutral', '已删除': 'neutral', '未开放': 'neutral', '已禁止': 'neutral', '草稿': 'neutral', '未知': 'neutral', '缺失': 'neutral', '未配置': 'neutral', '无录音': 'neutral', '已归档': 'neutral'
  };

  function escape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  // Display names are independent of persisted task types and route keys.
  function callTypeLabel(value) {
    return value === 'IVR 外呼' || value === 'IVR外呼' ? '自动外呼' : value;
  }

  function status(value, extraClass) {
    const text = value == null || value === '' ? '—' : String(value);
    const tone = toneMap[text] || (text.includes('需') || text.includes('待') ? 'warning' : 'neutral');
    return `<span class="status-badge ${tone} ${extraClass || ''}"><i></i>${escape(text)}</span>`;
  }

  const capabilityAliases = {
    '官方直接支持': '官方直接支持',
    '公开能力': '官方直接支持',
    '已验收': '无公开依据需厂商核实',
    '官方能力组合实现': '官方能力组合实现',
    '组合实现': '官方能力组合实现',
    '中台二次开发': '中台二次开发',
    'Mock': '中台二次开发',
    '无公开依据需厂商核实': '无公开依据需厂商核实',
    '需联调': '无公开依据需厂商核实',
    '供应商账号未核验': '无公开依据需厂商核实',
    '需开通核验': '无公开依据需厂商核实',
    '不支持': '不支持'
  };

  const capabilityClasses = {
    '官方直接支持': 'direct',
    '官方能力组合实现': 'composed',
    '中台二次开发': 'platform',
    '无公开依据需厂商核实': 'verification',
    '不支持': 'unsupported'
  };

  function normalizeCapability(value) {
    return capabilityAliases[value] || '无公开依据需厂商核实';
  }

  function capability(value, options) {
    const opts = options || {};
    const label = normalizeCapability(value);
    const attrs = opts.riskId ? ` data-risk-id="${escape(opts.riskId)}"` : '';
    return `<span class="capability-chip ${capabilityClasses[label]}" data-capability-level="${escape(label)}"${attrs}>${escape(label)}</span>`;
  }

  function capabilityLegend() {
    const taxonomy = (window.CloudCallData && window.CloudCallData.capabilityTaxonomy) || [];
    return `<div class="capability-legend" role="list" aria-label="阿里能力五类口径">${taxonomy.map(item => `<div class="capability-legend-item" role="listitem">${capability(item.label)}<span>${escape(item.description)}</span></div>`).join('')}</div>`;
  }

  function capabilityEvidenceLink(item) {
    if (!item || !item.sourceUrl) return '<span class="capability-source-missing">公开资料未覆盖目标行为</span>';
    return `<a href="${escape(item.sourceUrl)}" target="_blank" rel="noreferrer">${escape(item.sourceLabel || '查看官方依据')} ↗</a>`;
  }

  function capabilityRiskCard(item) {
    return `<article class="capability-risk-card ${item.level === '不支持' ? 'unsupported' : 'verification'}" data-risk-card="${escape(item.riskId)}">
      <div class="capability-risk-heading"><div>${capability(item.level, { riskId: item.riskId })}<h3>${escape(item.name)}</h3></div><span>${escape(item.impact)}</span></div>
      <p>${escape(item.evidence)}</p>
      <dl><div><dt>接口 / 能力</dt><dd>${escape((item.interfaces || []).join(' / ') || '—')}</dd></div><div><dt>下一步</dt><dd>${escape(item.nextStep)}</dd></div></dl>
      <div class="capability-risk-actions"><button class="btn btn-default" type="button" onclick="PlatformUI.showCapabilityDetail('${escape(item.riskId)}','evidence')">查看依据</button><button class="btn btn-default" type="button" onclick="PlatformUI.showCapabilityDetail('${escape(item.riskId)}','verification')">查看核验要求</button><button class="btn btn-default" type="button" onclick="PlatformUI.showCapabilityDetail('${escape(item.riskId)}','fallback')">查看降级</button></div>
    </article>`;
  }

  function showCapabilityDetail(riskId, section) {
    const risks = (window.CloudCallData && window.CloudCallData.capabilityRisks) || [];
    const item = risks.find(risk => risk.riskId === riskId);
    if (!item) return;
    const copy = section === 'fallback' ? item.fallback : section === 'verification' ? item.nextStep : item.evidence;
    const title = section === 'fallback' ? '降级路径' : section === 'verification' ? '核验要求' : '能力依据与缺口';
    const target = document.querySelector('[data-capability-detail]');
    if (target) {
      target.innerHTML = `<span>${escape(title)}</span><strong>${escape(item.name)}</strong><p>${escape(copy)}</p>${section === 'evidence' ? capabilityEvidenceLink(item) : ''}`;
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function openCapabilityCenter() {
    const audit=window.CCCSupportAudit;
    if(!audit)return;
    const groups=audit.groups.map(group=>`<details class="technical-details" ${group.key==='poc'?'open':''}><summary>${escape(group.name)} · ${group.rows.length} 项</summary>${group.rows.map(row=>`<section class="detail-section"><div class="detail-section-head"><h3>${escape(row.id)} · ${escape(row.title)}</h3></div><div class="detail-section-body">${row.details.map(text=>'<p>'+escape(text)+'</p>').join('')}<div>${row.links.map(link=>'<a href="'+escape(link.url)+'" target="_blank" rel="noreferrer">'+escape(link.label)+' 官方依据 ↗</a>').join('　')}</div></div></section>`).join('')}</details>`).join('');
    openLayer('capability-center',`<div class="layer-header"><div><h2>阿里支持与待验证事项</h2><p>${escape(audit.date)} · ${escape(audit.sourceVersion)} · 真实环境未验证</p></div><button aria-label="关闭" onclick="PlatformUI.closeLayer('capability-center')">×</button></div><div class="layer-body">${alert('info','只读核验清单','公开能力可支持不等于上线通过。本原型的发布、开通、呼叫、记录及测试均为模拟，不产生真实厂商回执或 POC 证据。')}${groups}</div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('capability-center')">关闭</button></div>`,'wide');
  }

  function openSafeTransferConflict() {
    const item = (window.CloudCallData?.capabilityRisks || []).find(risk => risk.riskId === 'CAP-RISK-SAFE-TRANSFER');
    const source = item?.sourceUrl ? `<a href="${escape(item.sourceUrl)}" target="_blank" rel="noreferrer">AliCti BlindTransfer 官方 API ↗</a>` : '<span>公开资料未覆盖</span>';
    openLayer('safe-transfer-conflict', `<div class="layer-header"><div><span>能力冲突</span><h2>两阶段安全转接</h2></div><button type="button" aria-label="关闭" onclick="PlatformUI.closeLayer('safe-transfer-conflict')">×</button></div><div class="layer-body" data-testid="safe-transfer-conflict"><div class="safe-transfer-boundary">${capability('不支持', { riskId: 'CAP-RISK-SAFE-TRANSFER' })}<strong>BlindTransfer 与业务目标冲突</strong><p>BlindTransfer 会先释放原坐席，无法满足“目标接听前原坐席保持占用”的要求。本期不提供目标选择、执行确认或转接链路。</p></div><dl class="detail-grid"><dt>公开能力</dt><dd>BlindTransfer（盲转）</dd><dt>能力依据</dt><dd>${source}</dd><dt>降级方案</dt><dd>原坐席结束当前通话并保存本平台跟进结果，再由目标坐席基于同一客户任务重新联系。</dd></dl></div><div class="layer-footer"><span class="layer-footer-note">该页面仅说明冲突与降级，不执行话务动作。</span><button data-testid="safe-transfer-close" class="btn" type="button" onclick="PlatformUI.closeLayer('safe-transfer-conflict')">关闭</button></div>`, 'small');
  }

  function openPredictiveInFlightRisk(action, taskId) {
    const risk = (window.CloudCallData?.capabilityRisks || []).find(item => item.riskId === 'CAP-RISK-INFLIGHT-CAMPAIGN');
    const stages = ['拨号', '振铃', '排队', '通话'];
    openLayer('predictive-inflight-risk', `<div class="layer-header"><div><span>预外呼控制边界</span><h2>${escape(action || 'PauseCampaign / AbortCampaign')}</h2></div><button type="button" aria-label="关闭" onclick="PlatformUI.closeLayer('predictive-inflight-risk')">×</button></div><div class="layer-body" data-testid="predictive-inflight-risk"><div class="capability-center-note"><strong>${escape(taskId || '当前任务')} 仅确认 stopNewDialing=true</strong><span>没有批量修改完成、没有在途成功回执，也不承诺已发起呼叫会按某一种方式结束。</span></div>${capability('无公开依据需厂商核实', { riskId: 'CAP-RISK-INFLIGHT-CAMPAIGN' })}<div class="inflight-stage-grid">${stages.map(stage => `<div data-testid="predictive-inflight-${stage}"><strong>${stage}中</strong><span>精确在途语义待厂商核实</span></div>`).join('')}</div><dl class="detail-grid"><dt>公开接口</dt><dd>PauseCampaign / AbortCampaign</dd><dt>公开资料缺口</dt><dd>${escape(risk?.evidence || '公开资料未覆盖四类在途状态的完整行为。')}</dd><dt>验收要求</dt><dd>${escape(risk?.nextStep || '分别对四类状态执行书面确认与 POC。')}</dd></dl></div><div class="layer-footer"><span class="layer-footer-note">本页只记录边界，不产生验收通过或操作成功状态。</span><button data-testid="predictive-inflight-close" class="btn" type="button" onclick="PlatformUI.closeLayer('predictive-inflight-risk')">关闭</button></div>`, 'large');
  }

  function installCapabilityLauncher() {
    if (!window.CloudCallData || document.querySelector('[data-capability-launcher]')) return;
    const launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'capability-launcher';
    launcher.setAttribute('data-capability-launcher', '');
    launcher.innerHTML = '<span>!</span><div><strong>支持与待验证事项</strong><small>公开依据与真实验收分开</small></div>';
    launcher.onclick = () => openCapabilityCenter();
    document.body.appendChild(launcher);
  }

  function pageHeader(title, description, actions, badge) {
    return `<div class="page-title-row"><div><h1>${escape(title)}</h1><p>${escape(description || '')}</p></div><div class="page-actions">${badge ? capability(badge) : ''}${actions || ''}</div></div>`;
  }

  function help(text, label) {
    return `<span class="help-tooltip" tabindex="0" role="button" aria-label="${escape(label || '查看说明')}" data-help="${escape(text || '')}"><span class="help-trigger">?</span></span>`;
  }

  // One top-level overlay serves every table, scroll container and modal.
  let helpOwner=null,helpOverlay=null;
  function hideHelp(){
    helpOwner?.removeAttribute('aria-describedby');helpOwner=null;
    if(helpOverlay){if(helpOverlay.matches?.(':popover-open'))helpOverlay.hidePopover();helpOverlay.remove();helpOverlay=null;}
  }
  function showHelp(owner){
    if(!owner)return;hideHelp();helpOwner=owner;
    const overlay=document.createElement('div');helpOverlay=overlay;
    overlay.id='platform-help-overlay';overlay.className='platform-help-overlay';overlay.setAttribute('role','tooltip');
    overlay.textContent=owner.dataset.help||owner.querySelector('.help-popover')?.textContent||'';
    document.body.appendChild(overlay);owner.setAttribute('aria-describedby',overlay.id);
    if(typeof overlay.showPopover==='function'){overlay.setAttribute('popover','manual');overlay.showPopover();}
    const r=owner.getBoundingClientRect(),box=overlay.getBoundingClientRect(),gap=10;
    overlay.style.left=Math.max(gap,Math.min(window.innerWidth-box.width-gap,r.left+r.width/2-box.width/2))+'px';
    overlay.style.top=Math.max(gap,Math.min(window.innerHeight-box.height-gap,r.top>=box.height+gap?r.top-box.height-gap:r.bottom+gap))+'px';
  }
  document.addEventListener('mouseover',e=>{const el=e.target.closest?.('.help-tooltip');if(el&&el!==helpOwner)showHelp(el);});
  document.addEventListener('mouseout',e=>{if(helpOwner&&e.target.closest?.('.help-tooltip')===helpOwner&&!helpOwner.contains(e.relatedTarget))hideHelp();});
  document.addEventListener('focusin',e=>{const el=e.target.closest?.('.help-tooltip');if(el)showHelp(el);});
  document.addEventListener('focusout',e=>{if(helpOwner&&!helpOwner.contains(e.relatedTarget))hideHelp();});
  document.addEventListener('click',e=>{const el=e.target.closest?.('.help-tooltip');if(el)showHelp(el);else hideHelp();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')hideHelp();else if(['Enter',' '].includes(e.key)&&e.target.closest?.('.help-tooltip')){e.preventDefault();showHelp(e.target.closest('.help-tooltip'));}});
  document.addEventListener('scroll',hideHelp,true);
  window.addEventListener('resize',hideHelp);
  window.addEventListener('hashchange',hideHelp);

  function toolbar(primary, secondary) {
    return `<div class="list-toolbar"><div class="toolbar-primary">${primary || ''}</div><div class="toolbar-secondary">${secondary || ''}</div></div>`;
  }

  function timestamp(value) {
    if (value == null || value === '' || typeof value === 'boolean') return null;
    if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
    const text = String(value).trim();
    if (!text) return null;
    if (typeof value === 'number' || /^\d+(?:\.\d+)?$/.test(text)) {
      const number = Number(value);
      const millis = Math.abs(number) < 1e11 ? number * 1000 : number;
      return Number.isFinite(millis) && millis >= 0 && Number.isFinite(new Date(millis).getTime()) ? millis : null;
    }
    if (!/^\d{4}[-/]/.test(text)) return null;
    const parsed = Date.parse(text);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const updateFields = ['localUpdatedAt', 'updatedAt', 'updateTime', 'updatedTime', 'modifiedAt', 'modifyTime', 'lastModifiedAt', 'lastUpdateTime', 'updated_at', 'update_time', 'modify_time', 'gmtModified', 'customerFollowup.updatedAt'];
  const createFields = ['createdAt', 'createTime', 'createdTime', 'created_at', 'create_time', 'gmtCreate'];
  const fieldValue = (row, field) => String(field).split('.').reduce((value, key) => value?.[key], row);
  function updatedTimestamp(row, fallback = []) {
    const updates = updateFields.map(field => timestamp(fieldValue(row, field))).filter(value => value !== null);
    if (updates.length) return Math.max(...updates);
    const candidates = typeof fallback === 'function' ? fallback(row) : (Array.isArray(fallback) ? fallback : [fallback]).map(field => fieldValue(row, field));
    for (const value of [...(Array.isArray(candidates) ? candidates : [candidates]), ...createFields.map(field => row?.[field])]) {
      const parsed = timestamp(value);
      if (parsed !== null) return parsed;
    }
    return null;
  }
  // Sort display copies before pagination; source arrays also drive call execution.
  function sortByUpdated(rows, fallback = []) {
    return rows.map((row, index) => ({ row, index, time: updatedTimestamp(row, fallback) }))
      .sort((a, b) => (b.time ?? -Infinity) - (a.time ?? -Infinity) || a.index - b.index)
      .map(item => item.row);
  }

  function pagination(total, current, pageSize, handler) {
    const count = Number(total) || 0;
    const size = Number(pageSize) || 10;
    const pages = Math.max(1, Math.ceil(count / size));
    const page = Math.min(pages, Math.max(1, Math.floor(Number(current) || 1)));
    const fn = handler || '';
    return `<div class="list-pagination"><span>共 ${count} 条</span><div><button type="button" aria-label="上一页" ${page <= 1 ? 'disabled' : ''} onclick="${fn}(${page - 1})">‹</button><strong>${page}</strong><span>/ ${pages}</span><button type="button" aria-label="下一页" ${page >= pages ? 'disabled' : ''} onclick="${fn}(${page + 1})">›</button></div></div>`;
  }

  function detailSection(title, body, description) {
    return `<section class="detail-section"><div class="detail-section-head"><div><h3>${escape(title)}</h3>${description ? `<p>${escape(description)}</p>` : ''}</div></div><div class="detail-section-body">${body || ''}</div></section>`;
  }

  function kpi(label, value, meta, tone) {
    return `<div class="kpi-card ${tone || ''}"><span class="kpi-label">${escape(label)}</span><strong class="kpi-value">${escape(value)}</strong><span class="kpi-meta">${meta || ''}</span></div>`;
  }

  function table(columns, rows, options) {
    const opts = options || {};
    // 云呼叫列表统一编号；数据副本保留调用方对象，现有序号列沿用页面规则。
    if(window.AppState?.get().activeDomain==='CLOUD_CONTACT_CENTER'&&opts.numbered!==false&&!columns.some(col=>col.label==='序号')){
      const offset=Number(opts.rowOffset)||0;
      columns=[{key:'__listSequence',label:'序号',width:'64px'},...columns];
      rows=rows.map((row,index)=>({...row,__listSequence:offset+index+1}));
    }
    const head = columns.map(col => `<th class="${escape(col.className || '')}"${col.width ? ` style="width:${escape(col.width)}"` : ''}>${typeof col.headerRender === 'function' ? col.headerRender() : escape(col.label)}${col.help ? help(col.help, col.label) : ''}</th>`).join('');
    const body = rows.length ? rows.map(row => `<tr>${columns.map(col => `<td class="${escape(col.className || '')}">${col.render ? col.render(row[col.key], row) : escape(row[col.key] == null ? '—' : ['callType','type','method'].includes(col.key) ? callTypeLabel(row[col.key]) : row[col.key])}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${columns.length}">${empty(opts.emptyText || '暂无数据', opts.emptyDetail)}</td></tr>`;
    return `<div class="table-card ${escape(opts.className || '')}"><div class="table-scroll"><table class="platform-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>${opts.footer || ''}</div>`;
  }

  function empty(text, detail) {
    return `<div class="empty-state compact"><div class="empty-icon">◇</div><strong>${escape(text || '暂无数据')}</strong>${detail ? `<span>${escape(detail)}</span>` : ''}</div>`;
  }

  function alert(type, title, detail, action) {
    return `<div class="platform-alert ${type || 'info'}"><div><strong>${escape(title)}</strong>${detail ? `<p>${escape(detail)}</p>` : ''}</div>${action || ''}</div>`;
  }

  function timeline(items) {
    return `<div class="platform-timeline">${items.map((item, index) => `<div class="timeline-item ${item.tone || ''}"><span class="timeline-dot"></span><div><div class="timeline-title">${escape(item.title)}</div><div class="timeline-meta">${escape(item.time || '')}${item.detail ? ` · ${escape(item.detail)}` : ''}</div></div>${index < items.length - 1 ? '<span class="timeline-line"></span>' : ''}</div>`).join('')}</div>`;
  }

  function steps(items, current) {
    return `<div class="platform-steps">${items.map((item, index) => `<div class="platform-step ${index + 1 < current ? 'done' : index + 1 === current ? 'current' : ''}"><span>${index + 1 < current ? '✓' : index + 1}</span><em>${escape(item)}</em></div>`).join('')}</div>`;
  }

  // Kept as a compatibility hook; page controls provide the operation path.
  function journey() { return ''; }

  function tabs(pageKey, items, active) {
    return `<div class="platform-tabs">${items.map(item => `<button type="button" class="platform-tab ${item.key === active ? 'active' : ''}" onclick="window.Pages['${pageKey}'].switchTab('${item.key}')">${escape(item.label)}</button>`).join('')}</div>`;
  }

  let layerOrder = 10020;
  function nextLayerZIndex() {
    document.querySelectorAll('.platform-layer,[data-legacy-dialog],.native-call-dock').forEach(node => {
      const z = Number(getComputedStyle(node).zIndex);
      if (Number.isFinite(z)) layerOrder = Math.max(layerOrder, z);
    });
    return ++layerOrder;
  }

  function animateLayerExit(node) {
    if(!node || node.dataset.dialogKind==='confirmation' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    const source=node.querySelector('.layer-panel');
    if(!source?.animate)return;
    const rect=source.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    // A display-only shadow copy keeps business cleanup synchronous and close guards intact.
    const visual=document.createElement('div');visual.className='drawer-exit-visual';visual.inert=true;visual.setAttribute('aria-hidden','true');
    visual.style.cssText=`position:fixed;inset:0;pointer-events:none;z-index:${Number(node.style.zIndex)||10020}`;
    const shadow=visual.attachShadow({mode:'open'});
    document.querySelectorAll('link[rel="stylesheet"],style').forEach(style=>shadow.appendChild(style.cloneNode(true)));
    const backdrop=document.createElement('div');backdrop.style.cssText='position:absolute;inset:0;background:rgba(0,0,0,.45)';shadow.appendChild(backdrop);
    const panel=source.cloneNode(true);panel.removeAttribute('role');panel.removeAttribute('aria-modal');
    panel.querySelectorAll('iframe,audio,video').forEach(media=>media.remove());
    panel.style.cssText+=`;position:absolute!important;top:${rect.top}px!important;left:${rect.left}px!important;right:auto!important;bottom:auto!important;width:${rect.width}px!important;height:${rect.height}px!important;max-height:none!important;transform:none!important;animation:none!important;translate:none;border-radius:0!important;`;
    shadow.appendChild(panel);document.body.appendChild(visual);
    const animation=panel.animate([{translate:'0 0'},{translate:'100% 0'}],{duration:220,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
    backdrop.animate([{opacity:1},{opacity:0}],{duration:220,fill:'forwards'});
    animation.finished.then(()=>visual.remove(),()=>visual.remove());
    setTimeout(()=>visual.remove(),300);
  }

  // Keep a form's original values across redraws of the same editor. Some editors
  // rebuild their layer after changing a field, so the current DOM alone is not
  // enough to tell whether clicking outside would discard a draft.
  const ownDiscardGuards = new Set([
    'alicti-account-editor', 'queue-config', 'queue-detail',
    'queue-scope-picker', 'extension-resource-detail', 'time-condition-detail'
  ]);
  function layerFormSnapshot(node) {
    const controls = node?.querySelectorAll('.layer-body input,.layer-body select,.layer-body textarea,.layer-body [contenteditable="true"]') || [];
    return JSON.stringify(Array.from(controls).filter(el => !el.disabled && !el.readOnly && !['hidden','button','submit','reset'].includes(el.type)).map(el => {
      if(el.isContentEditable) return el.textContent;
      if(el.type === 'checkbox' || el.type === 'radio') return el.checked;
      if(el.type === 'file') return Array.from(el.files || []).map(file => file.name);
      if(el.multiple) return Array.from(el.selectedOptions || []).map(option => option.value);
      return el.value;
    }));
  }
  function needsBackdropDiscardGuard(node) {
    if(!node || node.dataset.dialogKind === 'confirmation' || node._navigation?.backdropGuard === false || ownDiscardGuards.has(node.id)) return false;
    const buttons = node.querySelectorAll('.layer-footer button');
    const canSave = Array.from(buttons).some(button => /保存|提交|创建|新增|导入|分配|关联|确定|下一步/.test(button.textContent || ''));
    return canSave && node.querySelector('.layer-body input:not([readonly]):not([disabled]),.layer-body select:not([disabled]),.layer-body textarea:not([readonly]):not([disabled]),.layer-body [contenteditable="true"]');
  }
  function closeLayerFromBackdrop(node, close) {
    if(typeof node?._navigation?.onBackdropClick==='function'){
      node._navigation.onBackdropClick();
      return;
    }
    if(!needsBackdropDiscardGuard(node) || (!node._navigation?.isDirty?.() && !node._discardDirty && layerFormSnapshot(node) === node._discardBaseline)) {
      close();
      return;
    }
    confirm({
      id: 'unsaved-layer-discard-confirm',
      title: '放弃未保存的内容？',
      body: '<p>当前填写的内容尚未保存。关闭后本次填写内容将丢失。</p>',
      cancelText: '继续填写',
      confirmText: '放弃填写并关闭',
      danger: true,
      onConfirm: close
    });
  }

  function openLayer(id, content, size, navigation = {}) {
    const previous = document.getElementById(id);
    const discardKey = navigation.discardKey || navigation.objectKey || id;
    const previousDirty = previous?._discardKey === discardKey && (previous._discardDirty ||
      (previous._discardBaseline !== undefined && layerFormSnapshot(previous) !== previous._discardBaseline));
    const returnFocus = previous?._returnFocus || document.activeElement;
    const topLayer = Array.from(document.querySelectorAll('.platform-layer')).sort((a,b)=>Number(a.style.zIndex)-Number(b.style.zIndex)).at(-1);
    const enteringAnotherView = previous && navigation.objectKey && previous._navigation?.objectKey && (navigation.objectKey !== previous._navigation.objectKey || topLayer !== previous);
    const previousView = enteringAnotherView ? previous : previous?._previousLayer;
    previous?.remove();
    const node = document.createElement('div');
    node.id = id;
    node.className = 'platform-layer';
    node.innerHTML = `<div class="layer-backdrop" onclick="PlatformUI.closeLayer('${id}')"></div><div class="layer-panel ${size || ''}" onclick="event.stopPropagation()">${content}</div>`;
    document.body.appendChild(node);
    node._returnFocus = returnFocus;
    node._previousLayer = previousView;
    node._navigation = navigation;
    node._discardKey = discardKey;
    node._discardDirty = !!previousDirty;
    if(navigation.nonModal) node.dataset.nonModal='true';
    if(navigation.kind==='confirmation')node.dataset.dialogKind='confirmation';
    else if(!previous||enteringAnotherView){node.classList.add('drawer-entering');node.addEventListener('animationend',()=>node.classList.remove('drawer-entering'),{once:true});}
    node.style.zIndex = String(nextLayerZIndex());
    const panel = node.querySelector('.layer-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', navigation.nonModal?'false':'true');
    panel.tabIndex = -1;
    const header = panel.querySelector('.layer-header');
    if (header) {
      header.classList.add('secondary-dialog-header');
      let close = Array.from(header.querySelectorAll('button')).find(button => /[×✕✖]/.test(button.textContent) || /关闭/.test(button.getAttribute('aria-label') || ''));
      if (!close) {
        close = document.createElement('button');
        close.type = 'button'; close.textContent = '×';
        close.onclick = () => closeLayer(id);
        header.appendChild(close);
      }
      close.classList.add('secondary-close');
      close.setAttribute('aria-label', '关闭'); close.title = '关闭';
      const back = document.createElement('button');
      back.type = 'button'; back.className = 'secondary-back';
      back.textContent = '← 返回'; back.setAttribute('aria-label', '返回上一页');
      back.onclick = () => close.click();
      header.prepend(back);
      node.querySelector('.layer-backdrop').onclick = () => closeLayerFromBackdrop(node, () => close.click());
      const title = header.querySelector('h2,h3');
      if (title) { title.id = title.id || id + '-title'; panel.setAttribute('aria-labelledby', title.id); }
    }
    if(!header) node.querySelector('.layer-backdrop').onclick = () => closeLayerFromBackdrop(node, () => closeLayer(id));
    queueMicrotask(() => { if(node.isConnected) node._discardBaseline = layerFormSnapshot(node); });
    document.body.classList.add('layer-open');
    requestAnimationFrame(() => { if (!node.isConnected) return; node.classList.add('open'); panel.focus({preventScroll:true}); });
  }

  function closeLayer(id, restoreFocus = true) {
    const node = document.getElementById(id);
    if(restoreFocus)animateLayerExit(node);
    if (node) node.remove();
    if (restoreFocus && node?._previousLayer) {
      document.body.appendChild(node._previousLayer);
      node._previousLayer._navigation?.onRestore?.();
    }
    if (restoreFocus) {
      const parent = Array.from(document.querySelectorAll('.platform-layer')).sort((a,b)=>Number(a.style.zIndex)-Number(b.style.zIndex)).at(-1);
      parent?._navigation?.onRestore?.();
    }
    if (!document.querySelector('.platform-layer')) document.body.classList.remove('layer-open');
    if (restoreFocus && node?._returnFocus?.isConnected) node._returnFocus.focus?.({preventScroll:true});
  }

  document.addEventListener('keydown', event => {
    const layers = Array.from(document.querySelectorAll('.platform-layer')).filter(node=>node.dataset.nonModal!=='true');
    const top = layers.sort((a,b) => Number(a.style.zIndex) - Number(b.style.zIndex)).at(-1);
    if (!top) return;
    const legacy = Array.from(document.querySelectorAll('.secondary-dialog-header')).find(header => !header.closest('.platform-layer') && header.getClientRects().length && Number(getComputedStyle(header.closest('[data-legacy-dialog]') || header.parentElement.parentElement).zIndex) > Number(top.style.zIndex));
    if (legacy) return;
    if (event.key === 'Escape') { event.preventDefault(); top.querySelector('.layer-header .secondary-close')?.click(); }
    if (event.key === 'Tab') {
      const buttons = Array.from(top.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')).filter(el => !el.disabled && el.getClientRects().length);
      const first = buttons[0], last = buttons.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !buttons.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !buttons.includes(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
  });

  function confirm(options) {
    const opts = options || {};
    const id = opts.id || 'platform-confirm';
    openLayer(id, `<div class="layer-header"><h2>${escape(opts.title || '确认操作')}</h2><button type="button" onclick="PlatformUI.closeLayer('${id}')">×</button></div><div class="layer-body">${opts.body || ''}</div><div class="layer-footer"><button class="btn btn-default" type="button" onclick="PlatformUI.closeLayer('${id}')">${escape(opts.cancelText || '取消')}</button><button class="btn btn-primary ${opts.danger ? 'btn-danger' : ''}" id="${id}-confirm" type="button">${escape(opts.confirmText || '确认')}</button></div>`, 'small', {kind:'confirmation'});
    const button = document.getElementById(`${id}-confirm`);
    if (button) button.onclick = () => { if (typeof opts.onConfirm === 'function' && opts.onConfirm() === false) return; closeLayer(id); };
  }

  window.PlatformUI = { animateLayerExit, nextLayerZIndex, escape, callTypeLabel, status, capability, capabilityLegend, openCapabilityCenter, openSafeTransferConflict, openPredictiveInFlightRisk, showCapabilityDetail, pageHeader, help, toolbar, timestamp, updatedTimestamp, sortByUpdated, pagination, detailSection, kpi, table, empty, alert, timeline, steps, journey, tabs, openLayer, closeLayer, confirm };
  /* 能力边界在相关业务页面就地呈现，不再以悬浮技术入口打断运营使用。 */
})();
