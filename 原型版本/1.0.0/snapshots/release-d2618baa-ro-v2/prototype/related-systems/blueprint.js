(function () {
  'use strict';
  var data = window.SystemBlueprintData;
  if (!data) return;
  var views = {}, nodes = {}, edges = {};
  data.views.forEach(function (view) {
    views[view.id] = view;
    view.nodes.forEach(function (node) { nodes[node.id] = Object.assign({ view: view.id }, node); });
    view.edges.forEach(function (edge) { edges[edge.id] = Object.assign({ view: view.id }, edge); });
  });
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var state = { view: 'overview', selected: null, query: '', pending: false, zoom: 1, autoFit: true };
  var workspace = $('bp-workspace'), canvas = $('bp-canvas'), inspector = $('bp-inspector');
  var search = $('bp-search'), results = $('bp-search-results'), toastTimer, returnFocus;
  var allItems = Object.values(nodes).map(function (n) { return { id: n.id, view: n.view, title: n.title, type: 'node', item: n }; })
    .concat(Object.values(edges).map(function (e) { return { id: e.id, view: e.view, title: e.label, type: 'edge', item: e }; }));
  function searchText(item) {
    return [item.title, item.subtitle, item.label, item.role, item.detail, item.scope, (item.identifiers || []).join(' '), (item.rules || []).join(' ')]
      .concat((item.refs || []).map(function (id) { var api = data.apis[id]; return id + ' ' + api.name + ' ' + (api.endpoint || ''); })).join(' ').toLowerCase();
  }
  function isPending(item) {
    return item.status === 'pending' || (item.refs || []).some(function (id) { return data.apis[id].status === 'missing'; }) || /待确认|未确认|未核实/.test((item.rules || []).join(' ') + (item.detail || ''));
  }
  function notify(message) {
    window.clearTimeout(toastTimer); $('bp-toast').textContent = message; $('bp-toast').hidden = false;
    toastTimer = window.setTimeout(function () { $('bp-toast').hidden = true; }, 4000);
  }
  function currentSvg() { return document.querySelector('[data-view-svg="' + state.view + '"]'); }
  function fitScale() { return Math.max(0.32, Math.min(1.3, (canvas.clientWidth - 1) / 1200)); }
  function setScale(scale, autoFit) {
    state.zoom = Math.max(0.32, Math.min(2, scale)); state.autoFit = !!autoFit;
    var svg = currentSvg();
    if (svg) { svg.style.width = (1200 * state.zoom) + 'px'; svg.style.height = (views[state.view].height * state.zoom) + 'px'; }
    $('bp-zoom').textContent = Math.round(state.zoom * 100) + '%';
    document.querySelector('[data-action="zoom-out"]').disabled = state.view === 'interfaces' || state.zoom <= 0.32;
    document.querySelector('[data-action="zoom-in"]').disabled = state.view === 'interfaces' || state.zoom >= 2;
  }
  function filterTable() {
    var count = 0;
    document.querySelectorAll('[data-api-row]').forEach(function (row) {
      var api = data.apis[row.dataset.apiRow];
      var matches = !state.query || (api.id + ' ' + api.name + ' ' + (api.endpoint || '') + ' ' + api.notes.join(' ') + ' ' + row.textContent).toLowerCase().indexOf(state.query) >= 0;
      var pending = !state.pending || api.status === 'missing' || api.status === 'partial' || api.status === 'dictionary';
      row.hidden = !(matches && pending); if (!row.hidden) count++;
    });
    $('bp-table-count').textContent = '显示 ' + count + ' / 27 项'; $('bp-table-empty').hidden = count !== 0;
  }
  function paint() {
    filterTable();
    var v = views[state.view]; if (!v) return;
    var related = new Set(), selected = nodes[state.selected] || edges[state.selected];
    if (selected) {
      related.add(state.selected);
      if (nodes[state.selected]) v.edges.forEach(function (e) { if (e.source === state.selected || e.target === state.selected) { related.add(e.id); related.add(e.source); related.add(e.target); } });
      else { related.add(selected.source); related.add(selected.target); }
    }
    var queryHits = new Set();
    v.nodes.concat(v.edges).forEach(function (item) { if (!state.query || searchText(item).indexOf(state.query) >= 0) queryHits.add(item.id); });
    if (state.query) v.edges.forEach(function (edge) { if (queryHits.has(edge.id)) { queryHits.add(edge.source); queryHits.add(edge.target); } });
    currentSvg().querySelectorAll('[data-node-id],[data-edge-id]').forEach(function (element) {
      var id = element.dataset.nodeId || element.dataset.edgeId, item = nodes[id] || edges[id];
      var dim = (state.selected && !related.has(id)) || (state.query && !queryHits.has(id)) || (state.pending && !isPending(item));
      element.classList.toggle('is-dim', !!dim); element.classList.toggle('is-selected', id === state.selected);
      element.classList.toggle('is-related', !!state.selected && related.has(id));
      element.setAttribute('aria-pressed', id === state.selected ? 'true' : 'false');
    });
    $('bp-footer-text').textContent = state.pending ? '突出明确缺口与未确认边界；点击模块或连线查看具体依据。' : '点击模块查看职责与接口；点击连线查看流向与确认边界。';
  }
  function closeDetail(restoreFocus) {
    inspector.hidden = true; workspace.classList.remove('has-detail'); state.selected = null; paint();
    if (restoreFocus && returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
  }
  function showView(id, updateHash) {
    if (!views[id] && id !== 'interfaces') id = 'overview';
    state.view = id; state.selected = null; inspector.hidden = true; workspace.classList.remove('has-detail'); results.hidden = true;
    document.querySelectorAll('[data-view-panel]').forEach(function (panel) { panel.hidden = panel.dataset.viewPanel !== id; });
    document.querySelectorAll('[data-view-link]').forEach(function (link) {
      var selected = link.dataset.viewLink === id; link.classList.toggle('is-active', selected);
      if (selected) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    $('bp-view-title').textContent = views[id] ? views[id].name : '接口与模块对照';
    $('bp-view-subtitle').textContent = views[id] ? views[id].subtitle : '从接口依据追溯业务功能、适配模块和具体缺口。';
    $('bp-view-count').textContent = views[id] ? views[id].nodes.length + ' 个模块 · ' + views[id].edges.length + ' 条关系' : Object.keys(data.apis).length + ' 项接口与字段依据';
    ['fit', 'export'].forEach(function (action) { document.querySelector('[data-action="' + action + '"]').disabled = id === 'interfaces'; });
    canvas.scrollTop = 0; canvas.scrollLeft = 0;
    setScale(fitScale(), true); paint();
    if (updateHash && window.location.hash !== '#' + id) window.history.replaceState(null, '', '#' + id);
  }
  function listSection(title, values) {
    if (!values || !values.length) return '';
    return '<section class="bp-detail-section"><h3>' + esc(title) + '</h3><ul>' + values.map(function (value) { return '<li>' + esc(value) + '</li>'; }).join('') + '</ul></section>';
  }
  function referenceHtml(ids) {
    return '<section class="bp-detail-section"><h3>关联接口与字段依据 · ' + ids.length + ' 项</h3>' + ids.map(function (id) {
      var api = data.apis[id];
      var label = { documented: '文档有依据', partial: '有文档 · 边界待确认', missing: '待确认 · 无明确端点', not_required: '平台职责', dictionary: '字段字典 · 非调用端点' }[api.status];
      var tone = api.status === 'missing' ? 'pending' : api.status === 'not_required' ? 'platform' : 'documented';
      return '<div class="bp-ref-card"><strong><span class="bp-api-id">' + esc(id) + '</span>' + esc(api.name) + '</strong><span class="bp-pill bp-pill--' + tone + '">' + label + '</span>' + (api.endpoint ? '<code>' + esc(api.endpoint) + '</code>' : '') + api.notes.map(function (note) { return '<p>' + esc(note) + '</p>'; }).join('') + (api.sources.length ? api.sources.map(function (url) { return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">查看接口文档 ↗</a>'; }).join('') : '<a href="../docs/interaction.html#M">查看规则附表 ↗</a>') + '</div>';
    }).join('') + '</section>';
  }
  function selectItem(id, focusClose) {
    var item = nodes[id] || edges[id]; if (!item) return;
    if (state.view !== item.view) showView(item.view, true);
    returnFocus = document.activeElement;
    state.selected = id; inspector.hidden = false; workspace.classList.add('has-detail'); results.hidden = true;
    var isNode = !!nodes[id]; $('bp-detail-kind').textContent = isNode ? '模块详情' : '关系详情';
    var title = isNode ? item.title : item.label;
    var scope = isNode ? item.scope : nodes[item.source].title + (item.bidirectional ? ' ⇄ ' : ' → ') + nodes[item.target].title;
    var content = '<div class="bp-detail-head"><span class="bp-pill bp-pill--' + item.status + '">' + data.statuses[item.status] + '</span><h2>' + esc(title) + '</h2><p>' + esc(scope) + '</p>' + (item.drill ? '<button type="button" class="bp-drill" data-drill="' + item.drill + '">展开' + esc(views[item.drill].short) + ' →</button>' : '') + '</div>';
    content += '<section class="bp-detail-section"><h3>' + (isNode ? '职责与边界' : '关系说明') + '</h3><p>' + esc(item.role || item.detail) + '</p></section>';
    content += listSection('输入', item.inputs) + listSection('输出', item.outputs);
    if (item.identifiers && item.identifiers.length) content += '<section class="bp-detail-section"><h3>关联标识</h3><div class="bp-identifier-list">' + item.identifiers.map(function (value) { return '<code>' + esc(value) + '</code>'; }).join('') + '</div></section>';
    content += listSection('具体规则与待确认边界', item.rules);
    if (isNode) {
      var relations = views[item.view].edges.filter(function (edge) { return edge.source === id || edge.target === id; });
      content += '<section class="bp-detail-section"><h3>模块关系 · ' + relations.length + ' 条</h3>' + relations.map(function (edge) {
        return '<button type="button" class="bp-relation-button" data-select-item="' + edge.id + '">' + esc(edge.label) + '<small>' + esc(nodes[edge.source].title + (edge.bidirectional ? ' ⇄ ' : ' → ') + nodes[edge.target].title) + '</small></button>';
      }).join('') + (relations.length ? '' : '<p>共享平台身份与域授权；使用既有独立链路。参见系统总览。</p>') + '</section>';
    } else {
      content += '<section class="bp-detail-section"><h3>关联模块</h3>' + [item.source, item.target].map(function (nodeId) { return '<button type="button" class="bp-relation-button" data-select-item="' + nodeId + '">' + esc(nodes[nodeId].title) + '</button>'; }).join('') + '</section>';
    }
    content += referenceHtml(item.refs || []); $('bp-detail-content').innerHTML = content; inspector.scrollTop = 0; paint();
    if (isNode && canvas.clientWidth > inspector.clientWidth + 240) {
      var selectedElement = document.querySelector('[data-node-id="' + id + '"]');
      var itemBox = selectedElement.getBoundingClientRect(), canvasBox = canvas.getBoundingClientRect();
      var availableRight = canvasBox.right - inspector.clientWidth - 18;
      if (itemBox.right > availableRight) canvas.scrollLeft += itemBox.right - availableRight;
      else if (itemBox.left < canvasBox.left + 18) canvas.scrollLeft -= canvasBox.left + 18 - itemBox.left;
    }
    if (focusClose) $('bp-close-detail').focus({ preventScroll: true });
  }
  function renderSearch() {
    state.query = search.value.trim().toLowerCase(); $('bp-clear-search').hidden = !state.query;
    state.selected = null; inspector.hidden = true; workspace.classList.remove('has-detail'); paint();
    if (!state.query || state.view === 'interfaces') { results.hidden = true; return; }
    var matches = allItems.filter(function (entry) { return searchText(entry.item).indexOf(state.query) >= 0; });
    matches.sort(function (a, b) { return Number(b.view === state.view) - Number(a.view === state.view) || (a.type === 'node' ? -1 : 1); });
    results.innerHTML = '<div class="bp-search-summary">' + matches.length + ' 处关联 · ' + (matches.length > 14 ? '显示前 14 项' : '点击定位') + '</div>' + (matches.length ? matches.slice(0, 14).map(function (entry) {
      return '<button type="button" data-search-id="' + entry.id + '">' + esc(entry.title) + '<small>' + esc(views[entry.view].short) + ' / ' + (entry.type === 'node' ? '模块' : '关系') + '</small></button>';
    }).join('') : '<p class="bp-search-empty">没有匹配项，可尝试 enterpriseId、IVR 或 API-325。</p>');
    results.hidden = false;
  }
  function jumpToItem(id) {
    var item = nodes[id] || edges[id]; if (!item) return;
    state.query = ''; search.value = ''; $('bp-clear-search').hidden = true;
    if (state.view !== item.view) showView(item.view, true);
    selectItem(id, true);
    var element = document.querySelector('[data-node-id="' + id + '"],[data-edge-id="' + id + '"]');
    if (element) {
      var box = element.getBoundingClientRect(), bounds = canvas.getBoundingClientRect();
      canvas.scrollTop += box.top - bounds.top - Math.max(40, canvas.clientHeight / 3);
      // Keep a selected module visible beside the inspector at larger scales.
      canvas.scrollLeft += Math.max(0, box.right - (bounds.right - inspector.clientWidth - 16));
    }
  }
  async function toggleFullscreen() {
    if (document.fullscreenElement === workspace) { await document.exitFullscreen(); return; }
    if (workspace.classList.contains('is-expanded')) { workspace.classList.remove('is-expanded'); document.querySelector('[data-action="fullscreen"]').textContent = '全屏'; setScale(fitScale(), true); return; }
    if (workspace.requestFullscreen) {
      try { await workspace.requestFullscreen(); return; } catch (error) { /* Embedded contexts may deny native fullscreen. */ }
    }
    workspace.classList.add('is-expanded'); document.querySelector('[data-action="fullscreen"]').textContent = '退出全屏'; setScale(fitScale(), true);
  }
  function exportSvg() {
    var current = currentSvg(); if (!current) return;
    var clone = current.cloneNode(true);
    clone.removeAttribute('style'); clone.setAttribute('width', '1200'); clone.setAttribute('height', String(views[state.view].height));
    clone.querySelectorAll('.is-dim,.is-selected,.is-related').forEach(function (el) { el.classList.remove('is-dim', 'is-selected', 'is-related'); });
    clone.querySelectorAll('[aria-pressed]').forEach(function (el) { el.removeAttribute('aria-pressed'); });
    var blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'AliCti-' + views[state.view].name + '-20260911.svg'; document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 10000); notify('已导出当前蓝图，包含完整模块、连线和样式。');
  }
  document.addEventListener('click', function (event) {
    var viewLink = event.target.closest('[data-view-link]');
    if (viewLink) { event.preventDefault(); showView(viewLink.dataset.viewLink, true); return; }
    var graphItem = event.target.closest('[data-node-id],[data-edge-id]');
    if (graphItem) { selectItem(graphItem.dataset.nodeId || graphItem.dataset.edgeId, false); return; }
    var itemLink = event.target.closest('[data-select-item],[data-jump-node],[data-search-id]');
    if (itemLink) { jumpToItem(itemLink.dataset.selectItem || itemLink.dataset.jumpNode || itemLink.dataset.searchId); return; }
    var drill = event.target.closest('[data-drill]'); if (drill) { showView(drill.dataset.drill, true); return; }
    var action = event.target.closest('[data-action]');
    if (action) {
      if (action.dataset.action === 'zoom-in') setScale(state.zoom + 0.15, false);
      else if (action.dataset.action === 'zoom-out') setScale(state.zoom - 0.15, false);
      else if (action.dataset.action === 'fit') { setScale(fitScale(), true); canvas.scrollLeft = 0; }
      else if (action.dataset.action === 'fullscreen') toggleFullscreen();
      else if (action.dataset.action === 'export') exportSvg();
      else if (action.dataset.action === 'reset') { state.query = ''; search.value = ''; state.pending = false; $('bp-pending').checked = false; $('bp-clear-search').hidden = true; showView(state.view, false); }
    }
    if (!event.target.closest('.bp-search-wrap')) results.hidden = true;
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      if (!inspector.hidden) closeDetail(true);
      else if (!results.hidden) results.hidden = true;
      else if (workspace.classList.contains('is-expanded')) toggleFullscreen();
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-node-id],[data-edge-id]')) {
      event.preventDefault(); selectItem(event.target.dataset.nodeId || event.target.dataset.edgeId, true);
    }
    if (event.key === 'ArrowDown' && event.target === search && !results.hidden) {
      var first = results.querySelector('button'); if (first) { event.preventDefault(); first.focus(); }
    }
  });
  $('bp-close-detail').addEventListener('click', function () { closeDetail(true); });
  search.addEventListener('input', renderSearch);
  search.addEventListener('focus', function () { if (search.value && state.view !== 'interfaces') renderSearch(); });
  $('bp-clear-search').addEventListener('click', function () { search.value = ''; renderSearch(); search.focus(); });
  $('bp-pending').addEventListener('change', function () { state.pending = this.checked; closeDetail(false); paint(); });
  window.addEventListener('hashchange', function () { var id = window.location.hash.slice(1); if (id !== state.view) showView(id, false); });
  window.addEventListener('resize', function () { if (state.autoFit) setScale(fitScale(), true); });
  document.addEventListener('fullscreenchange', function () { document.querySelector('[data-action="fullscreen"]').textContent = document.fullscreenElement === workspace ? '退出全屏' : '全屏'; setScale(fitScale(), true); });
  if (window.ResizeObserver) new ResizeObserver(function () { if (state.autoFit) setScale(fitScale(), true); }).observe(canvas);
  showView(window.location.hash.slice(1) || 'overview', false);
})();
