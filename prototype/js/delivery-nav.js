(function () {
  'use strict';

  var EMBED_PARAM = 'delivery_embed';

  // Presentation-only adaptation: keep the frozen diagram content intact.
  function showAtlasSidebar() {
    var directory = document.querySelector('details.atlas-directory');
    if (!directory) return;
    var sidebar = document.createElement('aside');
    sidebar.className = 'atlas-directory atlas-directory--sidebar';
    sidebar.setAttribute('aria-label', '图集目录');
    var title = document.createElement('h2');
    title.className = 'atlas-directory-title';
    title.textContent = window.location.pathname.indexOf('sequence-interaction') >= 0 ? '时序目录' : '流程与场景';
    sidebar.appendChild(title);
    var list = directory.querySelector('nav');
    if (!list) return;
    sidebar.appendChild(list);
    directory.replaceWith(sidebar);
    document.body.classList.add('has-atlas-sidebar');
    var stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('../assets/css/atlas-sidebar.css', document.currentScript.src).href;
    stylesheet.addEventListener('load', function () { window.dispatchEvent(new Event('resize')); });
    document.head.appendChild(stylesheet);
    var links = Array.from(list.querySelectorAll('a[href^="#"]'));
    function select(id) {
      links.forEach(function (link) {
        var selected = link.hash === '#' + id;
        link.classList.toggle('is-active', selected);
        if (selected) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    list.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (link) select(link.hash.slice(1));
    });
    select(window.location.hash.slice(1) || (links[0] && links[0].hash.slice(1)));
    window.addEventListener('hashchange', function () { select(window.location.hash.slice(1)); });
  }

  showAtlasSidebar();

  function bindEmbeddedActions() {
    document.addEventListener('click', function (event) {
      var jump = event.target.closest('[data-delivery-switch]');
      if (!jump || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (event.button !== undefined && event.button !== 0)) return;
      event.preventDefault();
      window.parent.postMessage({
        type: 'delivery-switch',
        key: jump.getAttribute('data-delivery-switch') || 'prototype'
      }, '*');
    });
  }

  if (window.self !== window.top) {
    bindEmbeddedActions();
    return;
  }

  if (document.querySelector('[data-delivery-nav]')) return;

  var script = document.currentScript;
  var root = script && script.src
    ? new URL('../', script.src)
    : new URL('./', window.location.href);

  function initialize() {
  var pathname = window.location.pathname.toLowerCase();
  var hostKey = pathname.indexOf('/docs/') >= 0
    ? 'docs'
    : pathname.indexOf('/flowcharts/business-process.html') >= 0
      ? 'business-flow'
      : pathname.indexOf('/flowcharts/sequence-interaction.html') >= 0
        ? 'sequence-flow'
        : pathname.indexOf('/related-systems/') >= 0
          ? 'related-systems'
          : 'prototype';
  var items = [
    { key: 'prototype', label: '原型页面', href: new URL('index.html', root).href },
    { key: 'docs', label: '说明文档', href: new URL('docs/functional-spec.html', root).href },
    { key: 'business-flow', label: '业务流程图', href: new URL('flowcharts/business-process.html', root).href },
    { key: 'sequence-flow', label: '时序交互图', href: new URL('flowcharts/sequence-interaction.html', root).href },
    { key: 'related-systems', label: '关联系统蓝图', href: new URL('related-systems/index.html', root).href }
  ];
  var itemMap = {};
  items.forEach(function (item) { itemMap[item.key] = item; });

  function embeddedUrl(href) {
    var url = new URL(href);
    url.searchParams.set(EMBED_PARAM, '1');
    return url.href;
  }

  if (!document.getElementById('delivery-nav-style')) {
    var style = document.createElement('style');
    style.id = 'delivery-nav-style';
    style.textContent = [
      ':root{--delivery-nav-height:48px}',
      'body.has-delivery-nav{padding-top:var(--delivery-nav-height)!important}',
      'body.has-delivery-frame{overflow:hidden!important}',
      'body.has-delivery-nav .auth-gateway{top:var(--delivery-nav-height)}',
      '.delivery-nav{position:fixed;z-index:10012;top:0;left:0;right:0;height:var(--delivery-nav-height);display:flex;align-items:center;gap:24px;padding:0 20px 0 72px;background:#fff;border-bottom:1px solid #e5e7eb;color:#111827;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}',
      '.delivery-nav__brand{flex:0 0 auto;font-size:13px;font-weight:600;color:#374151;letter-spacing:0}',
      '.delivery-nav__tabs{align-self:stretch;display:flex;align-items:stretch;gap:4px;min-width:0;overflow-x:auto}',
      '.delivery-nav__link{position:relative;display:inline-flex;align-items:center;justify-content:center;min-width:88px;padding:0 14px;color:#4b5563;text-decoration:none!important;font-size:14px;font-weight:500;white-space:nowrap}',
      '.delivery-nav__link:hover{color:#111827;background:#f8fafc}',
      '.delivery-nav__link.is-active{color:#2563eb;font-weight:600}',
      '.delivery-nav__link.is-active:after{content:"";position:absolute;left:14px;right:14px;bottom:0;height:2px;background:#2563eb}',
      '.delivery-nav__frame{position:fixed;z-index:10010;left:0;right:0;bottom:0;top:var(--delivery-nav-height);width:100%;height:calc(100vh - var(--delivery-nav-height));border:0;background:#f5f7fa;display:none}',
      '.delivery-nav__frame.is-visible{display:block}',
      'body.has-delivery-nav>.main-layout{height:calc(100vh - var(--delivery-nav-height) - 52px)!important}',
      'body.has-delivery-nav>.app-layout{height:calc(100vh - var(--delivery-nav-height))!important;min-height:calc(100vh - var(--delivery-nav-height))!important}',
      'body.has-delivery-nav>.diagram-layout,body.has-delivery-nav>.flow-layout,body.has-delivery-nav>.docs-layout{min-height:calc(100vh - var(--delivery-nav-height))!important}',
      'body.has-delivery-nav .flow-main{min-height:calc(100vh - var(--delivery-nav-height))!important}',
      '@media(max-width:640px){.delivery-nav{gap:8px;padding:0 8px 0 64px}.delivery-nav__brand{display:none}.delivery-nav__tabs{width:100%}.delivery-nav__link{flex:1 0 auto;min-width:92px;padding:0 10px}}'
    ].join('');
    document.head.appendChild(style);
  }

  var nav = document.createElement('nav');
  nav.className = 'delivery-nav';
  nav.setAttribute('data-delivery-nav', '');
  nav.setAttribute('aria-label', '交付内容分页');

  var brand = document.createElement('span');
  brand.className = 'delivery-nav__brand';
  brand.textContent = '项目交付视图';
  nav.appendChild(brand);

  var tabs = document.createElement('div');
  tabs.className = 'delivery-nav__tabs';
  items.forEach(function (item) {
    var link = document.createElement('a');
    link.className = 'delivery-nav__link';
    link.href = item.href;
    link.dataset.deliveryKey = item.key;
    link.textContent = item.label;
    tabs.appendChild(link);
  });
  nav.appendChild(tabs);

  // Standalone documents use real links, so browser back/forward and open-in-new-tab
  // retain normal navigation. Only the prototype shell owns embedded delivery views.
  if (hostKey !== 'prototype') {
    updateActive(hostKey);
    document.body.classList.add('has-delivery-nav');
    document.body.insertBefore(nav, document.body.firstChild);
    // Repair previously shared delivery hashes without leaving the old body visible.
    var standaloneMatch = window.location.hash.match(/^#delivery=(prototype|docs|business-flow|sequence-flow|related-systems)$/);
    if (standaloneMatch) {
      var standaloneTarget = standaloneMatch[1];
      if (standaloneTarget !== hostKey) window.location.replace(itemMap[standaloneTarget].href);
      else {
        var cleanUrl = new URL(window.location.href);
        cleanUrl.hash = '';
        window.history.replaceState(null, '', cleanUrl.href);
      }
    }
    return;
  }

  var frame = document.createElement('iframe');
  frame.className = 'delivery-nav__frame';
  frame.setAttribute('data-delivery-frame', '');
  frame.setAttribute('title', '交付内容');
  frame.setAttribute('allowfullscreen', '');
  frame.setAttribute('allow', 'fullscreen');

  function updateActive(key) {
    tabs.querySelectorAll('.delivery-nav__link').forEach(function (link) {
      var active = link.dataset.deliveryKey === key;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function setView(key, updateHistory) {
    if (!itemMap[key]) key = itemMap[hostKey] ? hostKey : 'prototype';
    updateActive(key);

    if (key === hostKey) {
      frame.classList.remove('is-visible');
      document.body.classList.remove('has-delivery-frame');
    } else {
      var target = embeddedUrl(itemMap[key].href);
      if (frame.dataset.currentUrl !== target) {
        frame.contentWindow.location.replace(target);
        frame.dataset.currentUrl = target;
      }
      frame.title = itemMap[key].label;
      frame.classList.add('is-visible');
      document.body.classList.add('has-delivery-frame');
    }

    if (updateHistory) {
      var stateUrl = new URL(window.location.href);
      stateUrl.hash = key === hostKey ? '' : 'delivery=' + key;
      window.history.pushState({ deliveryKey: key }, '', stateUrl.href);
    }
  }

  tabs.addEventListener('click', function (event) {
    var link = event.target.closest('[data-delivery-key]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (event.button !== undefined && event.button !== 0)) return;
    event.preventDefault();
    setView(link.dataset.deliveryKey, true);
  });

  window.addEventListener('message', function (event) {
    if (event.source !== frame.contentWindow || !event.data || event.data.type !== 'delivery-switch') return;
    setView(event.data.key, true);
  });

  window.addEventListener('popstate', function (event) {
    var hashMatch = window.location.hash.match(/^#delivery=(prototype|docs|business-flow|sequence-flow|related-systems)$/);
    setView(event.state && event.state.deliveryKey ? event.state.deliveryKey : (hashMatch ? hashMatch[1] : hostKey), false);
  });

  document.body.classList.add('has-delivery-nav');
  document.body.insertBefore(nav, document.body.firstChild);
  document.body.appendChild(frame);

  var initialMatch = window.location.hash.match(/^#delivery=(prototype|docs|business-flow|sequence-flow|related-systems)$/);
  setView(initialMatch ? initialMatch[1] : hostKey, false);
  }

  // This delivered document is available without fetching workflow metadata.
  initialize();
})();
