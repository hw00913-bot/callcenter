/**
 * js/common.js — 全站公共工具函数
 * 提取自原 script.js 的通用模块
 */

/* ===== 全局通知（Toast） ===== */
function showToast(msg, type = 'default') {
  let toast = document.getElementById('toast-tip');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-tip';
    toast.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      color: #fff; padding: 10px 24px;
      border-radius: 4px; font-size: 14px; z-index: 10050;
      transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex; align-items: center; gap: 8px;
      opacity: 0; pointer-events: none;
    `;
    document.body.appendChild(toast);
  }
  const bgMap = { success: '#52c41a', info: '#1677ff', warning: '#faad14', error: '#ff4d4f', default: 'rgba(0,0,0,0.75)' };
  toast.style.background = bgMap[type] || bgMap.default;
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.top = '40px';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.top = '20px';
  }, 3000);
}

/* ===== 异步导出模拟 ===== */
function doExport(event) {
  const btn = event.currentTarget;
  if (btn.classList.contains('loading')) return;
  const originalContent = btn.innerHTML;
  btn.classList.add('loading');
  btn.innerHTML = '<span class="loading-icon"></span> 导出中...';
  btn.disabled = true;
  btn.style.cursor = 'not-allowed';
  btn.style.opacity = '0.7';
  showToast('导出任务已提交，系统正在生成报表，请稍后...', 'info');
  setTimeout(() => {
    btn.classList.remove('loading');
    btn.innerHTML = originalContent;
    btn.disabled = false;
    btn.style.cursor = 'pointer';
    btn.style.opacity = '1';
    showToast('导出成功！文件已准备就绪。', 'success');
  }, 2500);
}

function doQuery() {
  const activePanel = document.querySelector('.tab-panel[style*="display:flex"], .tab-panel[style*="display: flex"], .tab-panel:not([style*="display:none"]):not([style*="display: none"])');
  // 若没有 tab-panel 结构（如外呼列表卡片页），降级为整个 page-content 容器
  if (!activePanel) {
    showToast('查询完成', 'info');
    return;
  }

  const subPanels = activePanel.querySelectorAll('.sub-tab-panel');
  const scope = (subPanels && subPanels.length > 0)
    ? (Array.from(subPanels).find(sp => sp.style.display !== 'none') || subPanels[0])
    : activePanel;

  const conditions = [];
  const dateInputs = scope.querySelectorAll('.filter-date-range input');
  if (dateInputs.length === 2 && dateInputs[0].value && dateInputs[1].value) {
    conditions.push(`时间: ${dateInputs[0].value} ~ ${dateInputs[1].value}`);
  }
  scope.querySelectorAll('.filter-select').forEach(sel => {
    if (sel.value) conditions.push(sel.value);
  });
  scope.querySelectorAll('.multi-select-display').forEach(disp => {
    const text = disp.textContent.trim();
    if (text && text !== '全部') conditions.push(text);
  });

  // 优先在当前激活的面板 (scope) 内查找表格和统计元素，避免跨 tab 错误更新
  const table = scope.querySelector('table.data-table');
  let filteredCount = 0;

  if (table) {
    const tbody = table.querySelector('tbody');
    const rows = tbody ? tbody.querySelectorAll('tr') : [];
    const hasFilters = conditions.length > 0;

    rows.forEach(row => {
      if (!hasFilters) {
        row.style.display = '';
        filteredCount++;
        return;
      }
      const text = row.textContent.toLowerCase();
      let match = false;
      scope.querySelectorAll('.filter-select').forEach(sel => {
        if (sel.value && text.includes(sel.value.toLowerCase())) match = true;
      });
      if (match || conditions.length === 0) {
        row.style.display = '';
        filteredCount++;
      } else {
        row.style.display = 'none';
      }
    });

    const totalEl = scope.querySelector('.total-text');
    if (totalEl) totalEl.textContent = `共 ${filteredCount} 条数据`;
  }

  const msg = conditions.length > 0 ? `查询完成，筛选：${conditions.join('、')}，共 ${filteredCount} 条` : '查询完成，显示全部数据';
  showToast(msg, 'info');
}

function doRefresh() {
  const activePanel = document.querySelector('.tab-panel[style*="display:flex"], .tab-panel[style*="display: flex"], .tab-panel:not([style*="display:none"]):not([style*="display: none"])');
  let scope = document.getElementById('page-content') || document;
  
  if (activePanel) {
    const subPanels = activePanel.querySelectorAll('.sub-tab-panel');
    scope = (subPanels && subPanels.length > 0)
      ? (Array.from(subPanels).find(sp => sp.style.display !== 'none') || subPanels[0])
      : activePanel;
  }

  scope.querySelectorAll('.filter-date-range input, .filter-input').forEach(inp => { inp.value = ''; });
  scope.querySelectorAll('.multi-select-wrap').forEach(wrap => {
    const allCb = wrap.querySelector('.opt-all');
    const items = wrap.querySelectorAll('.opt-item');
    if (allCb) allCb.checked = true;
    items.forEach(i => i.checked = false);
    updateMultiSelectDisplay(wrap);
  });
  scope.querySelectorAll('table.data-table tbody tr').forEach(row => { row.style.display = ''; });
  scope.querySelectorAll('.total-text').forEach(el => { el.textContent = '共 5 条数据'; });
  initDefaultDates(scope);
  showToast('已刷新', 'success');
}

/* ===== 筛选重置（传入容器限定范围） ===== */
function resetFilter(container) {
  const scope = container || document;
  scope.querySelectorAll('input:not([type="checkbox"])').forEach(inp => inp.value = '');
  scope.querySelectorAll('.multi-select-wrap').forEach(wrap => {
    const allCb = wrap.querySelector('.opt-all');
    const items = wrap.querySelectorAll('.opt-item');
    if (allCb) allCb.checked = true;
    items.forEach(i => i.checked = false);
    updateMultiSelectDisplay(wrap);
  });
  scope.querySelectorAll('.store-search-wrap input').forEach(inp => {
    inp.value = '';
    handleStoreSearch(inp);
  });
  showToast('已重置筛选条件');
}

/* ===== 多选下拉框 ===== */
function toggleMultiSelect(e, el) {
  e.stopPropagation();
  const dropdown = el.nextElementSibling;
  const isOpen = dropdown.classList.contains('open');
  document.querySelectorAll('.multi-select-dropdown').forEach(d => d.classList.remove('open'));
  if (!isOpen) dropdown.classList.add('open');
}

function handleAllOptions(cb) {
  const wrap = cb.closest('.multi-select-wrap');
  const items = wrap.querySelectorAll('.opt-item');
  if (cb.checked) items.forEach(i => i.checked = false);
  updateMultiSelectDisplay(wrap);
}

function handleOptionItem(cb) {
  const wrap = cb.closest('.multi-select-wrap');
  const allCb = wrap.querySelector('.opt-all');
  const checkedItems = wrap.querySelectorAll('.opt-item:checked');
  allCb.checked = checkedItems.length === 0;
  updateMultiSelectDisplay(wrap);
}

function updateMultiSelectDisplay(wrap) {
  const allCb = wrap.querySelector('.opt-all');
  const checkedItems = wrap.querySelectorAll('.opt-item:checked');
  const display = wrap.querySelector('.multi-select-display');
  if (allCb && allCb.checked) {
    display.textContent = '全部';
  } else if (checkedItems.length === 1) {
    display.textContent = checkedItems[0].nextElementSibling.textContent;
  } else if (checkedItems.length > 1) {
    display.textContent = '已选 ' + checkedItems.length + ' 项';
  } else {
    display.textContent = '请选择';
  }
}

/* ===== 初始化默认日期（最近7天） ===== */
function initDefaultDates(container) {
  const now = new Date();
  const past = new Date();
  past.setDate(now.getDate() - 7);
  const pad = (n) => n < 10 ? '0' + n : n;
  const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmtDateTime = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const scope = container || document;
  scope.querySelectorAll('.filter-date-range').forEach(range => {
    const inputs = range.querySelectorAll('input.filter-input');
    if (inputs.length === 2) {
      const type = inputs[0].getAttribute('type');
      if (type === 'date') {
        inputs[0].value = fmtDate(past);
        inputs[1].value = fmtDate(now);
      } else if (type === 'datetime-local') {
        inputs[0].value = fmtDateTime(past);
        inputs[1].value = fmtDateTime(now);
      }
    }
  });
}

/* ===== 级联菜单（大区 -> 小区 -> 门店） ===== */
const storeHierarchy = {
  "华东": { "浙江区": ["杭州旗舰店","杭州西湖店","杭州滨江店"], "上海区": ["上海静安店","上海徐汇店"] },
  "华南": { "广东一区": ["广州天河店","深圳南山店"], "广东二区": ["佛山顺德店"] },
  "华北": { "北京区": ["北京朝阳店","北京海淀店"] }
};

function handleRegionChange(selectElem) {
  const region = selectElem.value;
  const parentContainer = selectElem.closest('.filter-bar');
  const districtSelect = parentContainer.querySelector('.district-select');
  const storeList = parentContainer.querySelector('.store-options-list');
  const searchInput = parentContainer.querySelector('.store-search-wrap input');

  districtSelect.innerHTML = '<option value="">全部</option>';
  if (storeList) storeList.innerHTML = '<div class="multi-select-option"><input type="checkbox" class="opt-all" checked onchange="handleAllOptions(this)"><label>全部</label></div>';
  if (searchInput) searchInput.value = '';

  if (region && storeHierarchy[region]) {
    for (let district in storeHierarchy[region]) {
      const option = document.createElement('option');
      option.value = district;
      option.textContent = district;
      districtSelect.appendChild(option);
    }
  }
  parentContainer.querySelector('.multi-select-display').innerText = '全部';
}

function handleDistrictChange(selectElem) {
  const district = selectElem.value;
  const parentContainer = selectElem.closest('.filter-bar');
  const region = parentContainer.querySelector('.region-select').value;
  const storeList = parentContainer.querySelector('.store-options-list');
  const searchInput = parentContainer.querySelector('.store-search-wrap input');

  if (storeList) storeList.innerHTML = '<div class="multi-select-option"><input type="checkbox" class="opt-all" checked onchange="handleAllOptions(this)"><label>全部</label></div>';
  if (searchInput) searchInput.value = '';

  if (region && district && storeHierarchy[region][district]) {
    storeHierarchy[region][district].forEach(store => {
      const div = document.createElement('div');
      div.className = 'multi-select-option';
      div.innerHTML = `<input type="checkbox" class="opt-item" onchange="handleOptionItem(this)"><label>${store}</label>`;
      if (storeList) storeList.appendChild(div);
    });
  }
  parentContainer.querySelector('.multi-select-display').innerText = '全部';
}

/* ===== 门店模糊搜索 ===== */
function handleStoreSearch(inputElem) {
  const query = inputElem.value.trim().toLowerCase();
  const dropdown = inputElem.closest('.multi-select-dropdown');
  const storeList = dropdown.querySelector('.store-options-list');
  if (!storeList) return;
  const options = storeList.querySelectorAll('.multi-select-option');
  options.forEach(option => {
    const label = option.querySelector('label');
    if (!label) return;
    const text = label.textContent.toLowerCase();
    if (text === '全部') {
      option.style.display = query ? 'none' : 'flex';
    } else {
      option.style.display = text.includes(query) ? 'flex' : 'none';
    }
  });
}

/* ===== Tab 切换 ===== */
function switchTab(el, tabId) {
  const bar = el.closest('.tab-bar');
  if (bar) bar.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  else document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  el.classList.add('active');

  const container = el.closest('.tab-container') || document;
  container.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
  const panel = container.querySelector('#' + tabId) || document.getElementById(tabId);
  if (panel) panel.style.display = 'flex';
}

function switchSubTab(el, subTabId) {
  const parentPanel = el.closest('.tab-panel');
  if (!parentPanel) return;
  parentPanel.querySelectorAll('.sub-tab-item').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  parentPanel.querySelectorAll('.sub-tab-panel').forEach(p => p.style.display = 'none');
  const panel = parentPanel.querySelector('#' + subTabId);
  if (panel) panel.style.display = 'flex';
}

/* ===== 全局事件委托：点击空白处关闭多选下拉 + 点击整行选复选框 ===== */
document.addEventListener('click', (e) => {
  if (!e.target.closest('.multi-select-wrap')) {
    document.querySelectorAll('.multi-select-dropdown').forEach(d => d.classList.remove('open'));
  }
  const option = e.target.closest('.multi-select-option');
  if (option && e.target.tagName !== 'INPUT') {
    const checkbox = option.querySelector('input[type="checkbox"]');
    if (checkbox) {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
});

/* ===== 云外呼平台通用辅助 ===== */
function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function maskPhone(value) {
  const phone = String(value || '');
  if (phone.includes('*')) return phone;
  return phone.length >= 7 ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone;
}

function visiblePhone(row) {
  if (window.AppState && AppState.canSensitive('number.plain')) return row.rawPhone || row.phone || '—';
  return maskPhone(row.phone || row.rawPhone || '');
}

function requireAction(permission, callback, deniedMessage) {
  if (window.AppState && !AppState.canAction(permission)) {
    showToast(deniedMessage || '当前权限视角无此操作权限', 'warning');
    return false;
  }
  if (typeof callback === 'function') callback();
  return true;
}

window.formatDuration = formatDuration;
window.maskPhone = maskPhone;
window.visiblePhone = visiblePhone;
window.requireAction = requireAction;

/* ===== 继承页面弹窗：统一返回、关闭与父弹窗保留 ===== */
window.LegacyDialogUI = (function () {
  'use strict';
  const headers = '.scene-detail-header,.record-detail-header,.intent-config-header,.import-modal-header,.billing-detail-header,.billing-call-header,.block-modal-head,.biz-drawer-header,.biz-dialog-header,.modal-overlay .modal-header';
  const overlays = '.scene-detail-backdrop,.record-detail-backdrop,.intent-config-backdrop,.import-modal-backdrop,.billing-detail-backdrop,.billing-call-backdrop,.block-modal-mask,.biz-drawer-backdrop,.biz-dialog-backdrop,.modal-overlay';
  const panels = '.scene-detail-drawer,.record-detail-modal,.intent-config-modal,.import-modal,.billing-detail-modal,.billing-call-drawer,.block-modal,.biz-drawer,.biz-dialog,.modal-content';
  let scheduled = false;

  function visible(node) {
    return !!(node && node.isConnected && !node.hidden && getComputedStyle(node).display !== 'none' && node.getClientRects().length);
  }
  function decorate(header) {
    if (!header || header.closest('.legacy-drawer-ghost') || header.dataset.secondaryNavigation === 'ready') return;
    const close = Array.from(header.querySelectorAll('button,span,a')).find(node =>
      !node.classList.contains('secondary-back') && node.getAttribute('onclick') &&
      (/close/i.test(node.getAttribute('onclick')) || /^[×✕✖✗]$/.test(node.textContent.trim())));
    if (!close) return;
    header.dataset.secondaryNavigation = 'ready';
    const overlay = header.closest(overlays);
    if (overlay) overlay.setAttribute('data-legacy-dialog', '');
    header.classList.add('secondary-dialog-header');
    close.classList.add('secondary-close');
    close.setAttribute('aria-label', '关闭');
    close.setAttribute('title', '关闭');
    if (close.tagName === 'BUTTON') close.type = 'button';
    else {
      close.setAttribute('role', 'button');
      close.tabIndex = 0;
      close.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); close.click(); }
      });
    }
    let back = header.querySelector('.secondary-back');
    if (!back) {
      back = document.createElement('button');
      back.type = 'button';
      back.className = 'secondary-back';
      back.innerHTML = '<span aria-hidden="true">←</span> 返回';
      back.setAttribute('aria-label', '返回上一页');
      back.onclick = () => close.click();
      header.prepend(back);
    }
    const panel = header.closest(panels) || header.parentElement;
    if (panel) {
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      const title = Array.from(header.children).filter(node => node !== back && node !== close).map(node => node.textContent.trim()).filter(Boolean).join(' ');
      if (title) panel.setAttribute('aria-label', title);
      const confirmation = panel.matches('.block-confirm-modal') ||
        (overlay && (overlay.id === 'confirm-modal-overlay' || /Delete.*Backdrop$/.test(overlay.id))) ||
        /^(删除确认|操作确认|停用确认|启用确认)$/.test(title);
      if (overlay && confirmation) {
        overlay.setAttribute('data-dialog-kind', 'confirmation');
        panel.setAttribute('data-confirmation-panel', '');
      }
      if (overlay && !confirmation) {
        overlay.setAttribute('data-legacy-drawer', '');
        panel.setAttribute('data-legacy-drawer-panel', '');
        const last = panel.lastElementChild;
        if (last && last !== header && last.querySelector('button') &&
            (/footer/.test(last.className || '') || !last.querySelector('input,textarea,select,table,form'))) {
          last.classList.add('legacy-drawer-footer');
        }
        Array.from(panel.children).forEach(child => {
          if (child === header || /header|footer|tabs|tab-bar/.test(child.className || '')) return;
          child.classList.add('legacy-drawer-content');
        });
      }
    }
  }
  function drawerContext() {
    if (!window.AppState || !AppState.isReady()) return '';
    const state = AppState.get();
    return JSON.stringify([state.accountId, state.tenantId, state.enterpriseId, state.activeDomain, state.roleCode]);
  }
  function animateRemovedDrawer(overlay) {
    const context = drawerContext();
    if (!context || !overlay || overlay._legacyDrawerContext !== context ||
        !overlay._legacyDrawerSeen || overlay._legacyDrawerExitShown ||
        !overlay.matches('[data-legacy-drawer]') ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const original = overlay.querySelector('[data-legacy-drawer-panel]');
    if (!original || original.classList.contains('closing') || overlay.classList.contains('legacy-drawer-closing')) return;
    overlay._legacyDrawerExitShown = true;
    // The real dialog has already closed. This inert image of its DOM only finishes the exit motion.
    const ghost = document.createElement('div');
    ghost.className = 'legacy-drawer-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.inert = true;
    ghost.style.zIndex = overlay.style.zIndex || '5500';
    const shadow = ghost.attachShadow({ mode: 'open' });
    document.querySelectorAll('link[rel="stylesheet"],style').forEach(style => shadow.appendChild(style.cloneNode(true)));
    const frame = document.createElement('div');
    frame.className = 'legacy-drawer-ghost';
    const copy = original.cloneNode(true);
    copy.classList.add('legacy-drawer-exit-panel');
    const originalNodes = [original, ...original.querySelectorAll('*')];
    const copyNodes = [copy, ...copy.querySelectorAll('*')];
    copyNodes.forEach((node, index) => {
      Array.from(node.attributes).forEach(attribute => {
        if (attribute.name === 'id' || attribute.name.startsWith('on') ||
            ['autofocus', 'autoplay', 'role', 'aria-modal', 'aria-label'].includes(attribute.name)) node.removeAttribute(attribute.name);
      });
      const source = originalNodes[index];
      if (node.matches('input,textarea,select')) {
        node.value = source.value;
        if ('checked' in node) node.checked = source.checked;
        node.disabled = true;
      }
    });
    copy.querySelectorAll(overlays + ',iframe,audio,video').forEach(node => node.remove());
    frame.appendChild(copy);
    shadow.appendChild(frame);
    document.body.appendChild(ghost);
    copyNodes.forEach((node, index) => {
      node.scrollTop = originalNodes[index].scrollTop;
      node.scrollLeft = originalNodes[index].scrollLeft;
    });
    setTimeout(() => ghost.remove(), 220);
  }
  function enhance(scope) {
    if (!scope || !scope.querySelectorAll) return;
    if (scope.matches && scope.matches(headers)) decorate(scope);
    scope.querySelectorAll(headers).forEach(decorate);
  }
  function syncScrollLock() {
    scheduled = false;
    document.querySelectorAll(overlays).forEach(node => {
      if (!visible(node)) {
        if (node._secondaryStackActive) animateRemovedDrawer(node);
        node._secondaryStackActive = false;
        return;
      }
      if (node.matches('[data-legacy-drawer]') && !node._secondaryStackActive) {
        node._legacyDrawerSeen = true;
        node._legacyDrawerExitShown = false;
        node._legacyDrawerContext = drawerContext();
        node.classList.remove('legacy-drawer-closing');
      }
      if (node._secondaryStackActive) return;
      node._secondaryStackActive = true;
      if (window.PlatformUI && typeof PlatformUI.nextLayerZIndex === 'function') node.style.zIndex = String(PlatformUI.nextLayerZIndex());
    });
    const hasDialog = Array.from(document.querySelectorAll(overlays + ',.platform-layer')).some(visible);
    const overflow = hasDialog ? 'hidden' : '';
    if (document.body.style.overflow !== overflow) document.body.style.overflow = overflow;
  }
  function scheduleScrollLock() {
    if (!scheduled) { scheduled = true; queueMicrotask(syncScrollLock); }
  }
  function start() {
    enhance(document);
    new MutationObserver(records => {
      let relevant = false;
      records.forEach(record => {
        if (record.type === 'childList') {
          record.addedNodes.forEach(node => {
            if (node.nodeType !== 1 || node.closest('.legacy-drawer-ghost')) return;
            enhance(node);
            if (node.matches(overlays) || node.querySelector(overlays)) relevant = true;
          });
          record.removedNodes.forEach(node => {
            if (node.nodeType !== 1 || node.classList.contains('legacy-drawer-ghost')) return;
            if (node.matches(overlays)) { animateRemovedDrawer(node); relevant = true; }
            node.querySelectorAll(overlays).forEach(overlay => { animateRemovedDrawer(overlay); relevant = true; });
          });
        } else if (record.target.matches && record.target.matches(overlays)) {
          const overlay = record.target;
          if (record.attributeName === 'class' && overlay.matches('[data-legacy-drawer]') &&
              /(^|\s)open(\s|$)/.test(record.oldValue || '') && !overlay.classList.contains('open')) {
            overlay.classList.add('legacy-drawer-closing');
          } else if (record.attributeName === 'class' && overlay.matches('[data-legacy-drawer]') &&
                     overlay.classList.contains('open') && overlay.classList.contains('legacy-drawer-closing')) {
            overlay.classList.remove('legacy-drawer-closing');
          }
          relevant = true;
        }
      });
      if (relevant) scheduleScrollLock();
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'], attributeOldValue: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  return { enhance, syncScrollLock };
})();
