(() => {
  'use strict';

  const pageId = 'PAGE-2007';
  const title = 'AI 外呼黑名单';
  const group = '呼叫拦截';
  const entry = DNav.pages.find(page => page.id === pageId);
  Object.assign(entry, {name:title, group});

  const page = window.Pages[pageId];
  const render = page.render;
  page.render = function (...args) {
    return render.apply(this,args)
      .replace('<h1>呼叫拦截</h1>', `<h1>${title}</h1>`)
      .replace('aria-label="呼叫拦截"', `aria-label="${title}"`);
  };

  const ai = window.DNativeModules.ai;
  const provider = ",{code:'天润',name:'天润云呼叫',available:true,providerCode:'TIANRUN'}";
  if (!ai.html.includes(provider)) throw new Error('无法定位 AI 黑名单的平台选项。');
  ai.html = ai.html.replace(provider,'')
    .replaceAll('<h2>呼叫拦截</h2>', `<h2>${title}</h2>`)
    .replaceAll('AI 平台或天润云呼叫','电声平台')
    .replace('本组号码统一维护，各平台独立显示同步结果。天润按企业账号同步号码；移除或到期后，分别核对各平台的解除结果，同号其他分组的限制继续保留。','本组号码统一维护。移除或到期后，核对电声平台的解除结果，同号其他分组的限制继续保留。')
    .replace('function selectSyncPlatform(code){storeSyncDraft();',
      'function selectSyncPlatform(code){if(!platformCatalog.some(function(p){return p.code===code;}))return;storeSyncDraft();');
})();
