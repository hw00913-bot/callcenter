(() => {
  'use strict';

  const tabs = [...document.querySelectorAll('.review-view-tabs [role="tab"]')];
  const workspace = document.getElementById('workspace');
  const changes = document.getElementById('release-changes');
  const prototypeLayers = [workspace, document.getElementById('dialog-root'), document.getElementById('toast-root')];
  const search = document.getElementById('release-search');
  const type = document.getElementById('release-type');
  const group = document.getElementById('release-group');
  const download = document.getElementById('release-export');
  const result = document.getElementById('release-result');
  const tbody = document.getElementById('release-rows');
  const nav = new Map(window.DNav.pages.map(page => [page.id, page]));

  const make = (tag, value, className) => {
    const node = document.createElement(tag);
    if (value) node.textContent = value;
    if (className) node.className = className;
    return node;
  };

  function locate(location) {
    if (typeof location === 'string') return {path: location};
    const [id, ...steps] = location;
    const page = nav.get(id);
    const path = page ? DNav.sidebar.path(page).join(' → ') : '原型位置待核对';
    return {id, path, steps: steps.join(' → ')};
  }

  const entries = window.DReleaseChanges.flatMap(([group, items]) => items.map(item => {
    const places = item.locations.map(locate);
    const text = [group, item.name, item.type, item.before, item.after,
      ...places.map(place => [place.path, place.steps].join(' '))].join(' ').toLowerCase();
    return {...item, group, places, text};
  }));

  for (const [label] of window.DReleaseChanges) {
    const option = make('option', label);
    option.value=label;
    group.append(option);
  }
  const totals = [...type.options].map(option => option.value).filter(Boolean)
    .map(label => entries.filter(entry => entry.type === label).length + ' 项' + label).join(' · ');

  function canOpen(id) {
    return Boolean(nav.get(id)?.menu && window.DApp?.currentPage() && window.DSession?.allowed(id));
  }

  function renderLocation(place) {
    const item = make('li');
    if (canOpen(place.id)) {
      const button = make('button', place.path, 'release-location-link');
      button.type = 'button';
      button.title = '打开 ' + place.path;
      button.dataset.releasePage = place.id;
      item.append(button);
    } else {
      item.append(make('span', place.path, 'release-location-text'));
    }
    if (place.steps) item.append(make('span', ' → ' + place.steps, 'release-steps'));
    return item;
  }

  function renderTable() {
    const terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matching = entries.filter(entry =>
      (!group.value || entry.group === group.value) && (!type.value || entry.type === type.value) && terms.every(term => entry.text.includes(term)));
    const rows = matching.map(entry => {
      const row = make('tr');
      const category = make('td');
      const tag = make('span', entry.type, 'release-tag');
      tag.dataset.type = entry.type;
      category.append(tag);
      const name = make('th');
      name.scope = 'row';
      name.append(make('strong', entry.name), make('span', entry.group, 'release-meta'));
      const location = make('td');
      const list = make('ul', '', 'release-locations');
      list.append(...entry.places.map(renderLocation));
      location.append(list);
      row.append(category, name, make('td', entry.before), make('td', entry.after), location);
      return row;
    });
    if (!rows.length) {
      const row = make('tr');
      const empty = make('td', '未找到匹配的变更，试试其他关键词或类型。', 'release-empty');
      empty.colSpan = 5;
      row.append(empty);
      rows.push(row);
    }
    tbody.replaceChildren(...rows);
    result.textContent = group.value || type.value || terms.length
      ? '显示 ' + matching.length + ' 项，共 ' + entries.length + ' 项'
      : '共 ' + entries.length + ' 项 · ' + totals;
  }

  const menuObserver = new MutationObserver(renderTable);

  function showChanges(show) {
    menuObserver.disconnect();
    if (show) {
      renderTable();
      // A restored session can finish loading its seat and authorized menus after this view opens.
      const menu = document.getElementById('main-nav');
      if (menu) menuObserver.observe(menu, {childList: true});
    }
    document.body.dataset.reviewView = show ? 'changes' : 'prototype';
    prototypeLayers.forEach(layer => { layer.inert = show; });
    changes.hidden = !show;
    tabs.forEach((tab, index) => {
      const selected = index === Number(show);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showChanges(index === 1));
    tab.addEventListener('keydown', event => {
      const next = {ArrowLeft: 1 - index, ArrowRight: 1 - index, Home: 0, End: 1}[event.key];
      if (next === undefined) return;
      event.preventDefault();
      showChanges(next === 1);
      tabs[next].focus();
    });
  });
  search.addEventListener('input', renderTable);
  type.addEventListener('change', renderTable);
  group.addEventListener('change', renderTable);
  download.addEventListener('click', () => {
    const rows = [['模块','变更类型','功能','1.2.0 原型','2.0.0 原型','2.0.0 原型位置'],
      ...entries.map(item=>[item.group,item.type,item.name,item.before,item.after,
        item.places.map(place=>[place.path,place.steps].filter(Boolean).join(' → ')).join('；')])];
    const csv = rows.map(row=>row.map(v=>'"'+v.replaceAll('"','""')+'"').join(',')).join('\r\n');
    const uri = URL.createObjectURL(new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8'}));
    const link = make('a'); link.href=uri; link.download='云呼叫 1.2.0 至 2.0.0 原型变更对比.csv';
    document.body.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(uri),1000);
  });
  tbody.addEventListener('click', event => {
    const button = event.target.closest('[data-release-page]');
    const id = button?.dataset.releasePage;
    if (!id || !canOpen(id)) return;
    showChanges(false);
    tabs[0].focus();
    window.DApp.openPage(id, {menuEntry:true});
  });

  if (new URLSearchParams(location.search).get('view') === 'changes') showChanges(true);
})();
