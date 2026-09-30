/**
 * Outbound groups management page conforming to AliCti official agentGroup specifications.
 * Enforces 1:N tenant-to-group binding and single-group agent exclusion.
 */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape, api = OutboundGroups;
  let keyword = '', tenantId = '', page = 1, listContext = '', editor = null;
  const command = (method, ...args) => esc(`OutboundGroupManagement.${method}(${args.map(v => JSON.stringify(v)).join(',')})`);
  const denied = () => showToast('权限或工作范围已变化，请重新打开页面', 'warning');

  function render() {
    if (!api.canAccess()) return ui.empty('当前账号没有外呼组管理权限');
    if (listContext !== api.contextKey()) { keyword = ''; tenantId = ''; page = 1; listContext = api.contextKey(); }
    let rows = api.list().filter(g => (!tenantId || g.tenantId === tenantId) && (!keyword || [g.name, g.gno, g.comment || ''].join(' ').toLowerCase().includes(keyword.toLowerCase())));
    rows = ui.sortByUpdated?.(rows, []) || rows;
    page = Math.min(page, Math.max(1, Math.ceil(rows.length / 8)));

    return `<section class="platform-page outbound-group-page">
      ${ui.pageHeader('外呼组管理', '为预外呼任务组建接听团队，维护本租户的外呼组及坐席成员。')}
      ${api.storageError() ? ui.alert('warning', '外呼组暂时无法读取', api.storageError()) : ''}
      <div class="filter-panel">
        <label class="field grow">
          <span>外呼组名称 / 编号</span>
          <input id="obg-keyword" value="${esc(keyword)}" placeholder="输入外呼组名称或编号">
        </label>
        <div class="filter-actions">
          <button class="btn" onclick="OutboundGroupManagement.reset()">重置</button>
          <button class="btn btn-primary" onclick="OutboundGroupManagement.query()">查询</button>
        </div>
      </div>
      <div class="management-list-shell">
        ${ui.toolbar('<button class="btn btn-primary" onclick="OutboundGroupManagement.create()">新增外呼组</button>', '')}
        ${ui.table([
          { key: 'name', label: '外呼组名称', render: (v, g) => `<button class="table-link" onclick="${command('detail', g.outboundGroupId, listContext)}"><strong>${esc(v)}</strong></button>` },
          { key: 'gno', label: '外呼组编号', render: v => `<span class="badge badge-info">${esc(v)}</span>` },
          { key: 'tenantName', label: '所属租户' },
          { key: 'memberCount', label: '成员数', render: n => `${n} 人` },
          { key: 'outboundGroupId', label: '操作', render: (id, g) => `
            <div class="table-actions">
              <button onclick="${command('detail', id, listContext)}">查看</button>
              <button onclick="${command('edit', id, listContext)}">编辑</button>
              <button onclick="${command('members', id, listContext)}">维护成员</button>
              <button class="btn-text-danger" onclick="${command('remove', id, listContext)}">删除</button>
            </div>`
          }
        ], rows.slice((page - 1) * 8, page * 8), { emptyText: '暂无外呼组，点击“新增外呼组”开始配置' })}
        ${ui.pagination(rows.length, page, 8, 'OutboundGroupManagement.setPage')}
      </div>
    </section>`;
  }

  function refresh() { RouteRuntime.refreshCurrent(); }
  function valid(key) { return api.canAccess() && (!key || key === api.contextKey()); }

  function create() {
    if (!valid(listContext)) return denied();
    const tenants = api.tenantOptions();
    if (tenants.length !== 1) return showToast('当前账号须绑定唯一的有效租户', 'warning');
    const autoGno = api.generateGno();
    editor = { kind: 'create', context: api.contextKey(), revision: api.revision() };

    ui.openLayer('outbound-group-edit', `
      <div class="layer-header">
        <h2>新增外呼组</h2>
        <button aria-label="关闭" onclick="PlatformUI.closeLayer('outbound-group-edit')">×</button>
      </div>
      <div class="layer-body">
        <div class="form-vertical" style="display:flex;flex-direction:column;gap:14px;">
          <label class="field">
            <span>所属租户 *</span>
            <input id="obg-tenant" type="hidden" value="${esc(tenants[0].tenantId)}"><strong>${esc(tenants[0].name)}</strong>
          </label>
          <label class="field">
            <span>外呼组编号 *</span>
            <div style="display:flex;gap:8px;">
              <input id="obg-gno" value="${esc(autoGno)}" maxlength="20" placeholder="字母开头，2-20位字母与数字组合" style="flex:1;">
              <button type="button" class="btn" onclick="document.getElementById('obg-gno').value = OutboundGroups.generateGno()">随机生成</button>
            </div>
            <p class="field-hint">2～20 位，以字母开头，须同时包含字母和数字；同一 AliCti 账号内不可重复。</p>
          </label>
          <label class="field">
            <span>外呼组名称 *</span>
            <input id="obg-name" maxlength="50" placeholder="例如：VIP售后回访一组">
          </label>
          <label class="field">
            <span>描述说明</span>
            <input id="obg-comment" maxlength="100" placeholder="说明该外呼组业务目标（可选，最多100字）">
          </label>
        </div>
      </div>
      <div class="layer-footer">
        <button class="btn" onclick="PlatformUI.closeLayer('outbound-group-edit')">取消</button>
        <button class="btn btn-primary" onclick="OutboundGroupManagement.save()">创建并添加成员</button>
      </div>`, 'small');
  }

  function edit(id, key) {
    if (!valid(key)) return denied();
    const g = api.get(id);
    if (!g) return denied();
    editor = { kind: 'edit', id, context: api.contextKey(), revision: api.revision() };

    ui.openLayer('outbound-group-edit', `
      <div class="layer-header">
        <h2>编辑外呼组</h2>
        <button aria-label="关闭" onclick="PlatformUI.closeLayer('outbound-group-edit')">×</button>
      </div>
      <div class="layer-body">
        <div class="form-vertical" style="display:flex;flex-direction:column;gap:14px;">
          <label class="field">
            <span>外呼组编号</span>
            <input value="${esc(g.gno)}" readonly disabled style="background:#f5f7fa;">
            <p class="field-hint">外呼组编号创建后不可修改</p>
          </label>
          <label class="field">
            <span>所属租户</span>
            <input value="${esc(g.tenantName)}" readonly disabled style="background:#f5f7fa;">
          </label>
          <label class="field">
            <span>外呼组名称 *</span>
            <input id="obg-name" value="${esc(g.name)}" maxlength="50">
          </label>
          <label class="field">
            <span>描述说明</span>
            <input id="obg-comment" value="${esc(g.comment || '')}" maxlength="100">
          </label>
        </div>
      </div>
      <div class="layer-footer">
        <button class="btn" onclick="PlatformUI.closeLayer('outbound-group-edit')">取消</button>
        <button class="btn btn-primary" onclick="OutboundGroupManagement.save()">保存修改</button>
      </div>`, 'small');
  }

  function detail(id, key) {
    if (!valid(key)) return denied();
    const g = api.get(id);
    if (!g) return denied();
    const references = api.references(id), used = ui.sortByUpdated?.(references) || references;
    const memberRows = ui.sortByUpdated?.(g.members) || g.members;

    ui.openLayer('outbound-group-detail', `
      <div class="layer-header">
        <div>
          <h2>${esc(g.name)}</h2>
          <p>编号：<span class="badge badge-info">${esc(g.gno)}</span> · ${esc(g.tenantName)} · ${g.memberCount} 位坐席成员</p>
        </div>
        <button aria-label="关闭" onclick="PlatformUI.closeLayer('outbound-group-detail')">×</button>
      </div>
      <div class="layer-body">
        <div class="detail-summary" style="margin-bottom:16px;padding:12px;background:#f9fafb;border-radius:4px;font-size:13px;">
          <div><strong>描述说明：</strong>${esc(g.comment || '无')}</div>
          <div><strong>创建时间：</strong>${esc(g.createTime || '—')}</div>
        </div>
        <h3>外呼组坐席成员</h3>
        ${ui.table([
          { key: 'userName', label: '坐席姓名' },
          { key: 'cno', label: '工号' },
          { key: 'mobile', label: '手机号', render: v => esc(v || '—') }
        ], memberRows, { emptyText: '尚未添加成员，空组不可执行外呼任务' })}

        <h3 style="margin-top:20px;">关联预外呼任务</h3>
        ${ui.table([
          { key: 'name', label: '任务名称' },
          { key: 'status', label: '状态', render: (v, r) => ui.status(r.alictiTaskControlPending ? '待核对' : v) }
        ], used, { emptyText: '暂无关联任务' })}


      </div>
      <div class="layer-footer">
        <button class="btn" onclick="PlatformUI.closeLayer('outbound-group-detail')">关闭</button>
      </div>`, 'wide');
  }

  function members(id, key) {
    if (!valid(key)) return denied();
    const g = api.get(id);
    if (!g) return denied();
    const used = api.references(id).filter(t => t.alictiTaskControlPending || !['已完成', '已终止', '已结束', '已删除'].includes(t.status));
    if (used.length) return showToast('请先结束或删除关联任务后维护成员：' + used.map(t => t.name).join('、'), 'warning');

    editor = { kind: 'members', id, context: api.contextKey(), revision: api.revision() };
    const candidates = api.candidates(g.tenantId, g.enterpriseId);
    const ids = new Set(candidates.map(a => a.contactCenterIdentityId));
    const unavailable = g.memberIdentityIds.filter(mid => !ids.has(mid));

    ui.openLayer('outbound-group-edit', `
      <div class="layer-header">
        <div>
          <h2>维护外呼组成员</h2>
          <p>${esc(g.name)} (编号：${esc(g.gno)}) · ${esc(g.tenantName)}</p>
        </div>
        <button aria-label="关闭" onclick="PlatformUI.closeLayer('outbound-group-edit')">×</button>
      </div>
      <div class="layer-body">
        ${unavailable.length ? ui.alert('warning', '存在不可用成员', '本次保存将自动移除已停用或无法找到的坐席成员。') : ''}
        <p class="field-hint">勾选加入，取消勾选移出。每位坐席只能属于一个外呼组，选择其他组成员会将其移入当前组。</p>
        <div class="obg-member-list" style="max-height:360px;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;padding:8px 0;">
          ${candidates.map(a => {
            const isCurrent = g.memberIdentityIds.includes(a.contactCenterIdentityId);
            const inOther = a.assignedGroupId && a.assignedGroupId !== g.outboundGroupId;
            return `
            <label class="obg-member" style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid #e5e7eb;border-radius:6px;background:${isCurrent ? '#f0fdf4' : '#fff'};cursor:pointer;">
              <input type="checkbox" name="obg-member" value="${esc(a.contactCenterIdentityId)}" ${isCurrent ? 'checked' : ''}>
              <span style="flex:1;">
                <strong>${esc(a.userName)}</strong>
                <small style="color:#6b7280;display:block;">工号: ${esc(a.cno)}</small>
                ${inOther ? `<small style="color:#f59e0b;display:block;">[当前在: ${esc(a.assignedGroupName)}]</small>` : ''}
              </span>
            </label>`;
          }).join('') || ui.empty('当前租户暂无已启用坐席')}
        </div>
      </div>
      <div class="layer-footer">
        <button class="btn" onclick="PlatformUI.closeLayer('outbound-group-edit')">取消</button>
        <button class="btn btn-primary" onclick="OutboundGroupManagement.save()">保存成员</button>
      </div>`, 'wide');
  }

  function remove(id, key) {
    if (!valid(key)) return denied();
    const g = api.get(id);
    if (!g) return denied();
    const used = api.references(id).filter(t => t.alictiTaskControlPending || !['已完成', '已终止', '已结束', '已删除'].includes(t.status));
    if (used.length) {
      return showToast('无法删除！存在执行中或待核对的任务正在使用此外呼组：' + used.map(t => t.name).join('、'), 'warning');
    }

    const context = api.contextKey(), revision = api.revision();
    ui.confirm({title:'删除外呼组',body:`<p>确定删除“${esc(g.name)}”（${esc(g.gno)}）？</p><p>删除后该组将被解散，组内坐席保留。</p>`,confirmText:'确认删除',danger:true,onConfirm(){
      if(!valid(context)){denied();return false;}
      const res = api.deleteGroup(id, context, revision);
      if (!res.ok) {showToast(res.message, 'warning');return false;}
      showToast(res.message, 'success');refresh();
    }});
  }

  function save() {
    const e = editor;
    if (!e || !valid(e.context)) return denied();

    let result;
    if (e.kind === 'create') {
      const tenantSelect = document.getElementById('obg-tenant');
      const tenantVal = tenantSelect ? (tenantSelect.value || AppState.get().tenantId) : AppState.get().tenantId;
      result = api.create({
        name: document.getElementById('obg-name')?.value,
        gno: document.getElementById('obg-gno')?.value,
        comment: document.getElementById('obg-comment')?.value,
        tenantId: tenantVal
      }, e.context, e.revision);
    } else if (e.kind === 'edit') {
      result = api.update(e.id, {
        name: document.getElementById('obg-name')?.value,
        comment: document.getElementById('obg-comment')?.value
      }, e.context, e.revision);
    } else {
      const checkedIds = [...document.querySelectorAll('[name="obg-member"]:checked')].map(n => n.value);
      result = api.setMembers(e.id, checkedIds, e.context, e.revision);
    }

    if (!result.ok) return showToast(result.message, 'warning');
    editor = null;
    ui.closeLayer('outbound-group-edit');
    showToast(result.message, 'success');
    refresh();

    if (e.kind === 'create' && result.group) {
      members(result.group.outboundGroupId, api.contextKey());
    }
  }

  function query() {
    if (!valid(listContext)) return denied();
    keyword = document.getElementById('obg-keyword')?.value.trim() || '';
    tenantId = document.getElementById('obg-filter-tenant')?.value || '';
    page = 1;
    refresh();
  }

  function reset() { keyword = ''; tenantId = ''; page = 1; refresh(); }
  function setPage(value) {
    if (!valid(listContext)) return denied();
    page = Math.max(1, Number(value) || 1);
    refresh();
  }

  window.OutboundGroupManagement = { render, create, edit, detail, members, remove, save, query, reset, setPage };
  window.Pages['outbound-group-management'] = { render, init() {} };
})();
