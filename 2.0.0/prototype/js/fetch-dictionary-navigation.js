(() => {
  'use strict';

  const id = 'PAGE-21016';
  const name = '取数接口字典';
  const route = 'business-data-dictionary';
  const area = '系统管理';
  const group = '基础配置';
  const fieldPage = 'PAGE-2223';
  const cloud = window.DNativeModules.cloud;
  let html = cloud.html;

  function replaceOnce(before, after) {
    const start = html.indexOf(before);
    if (start < 0 || html.indexOf(before,start+before.length) >= 0) {
      throw Error('无法定位取数接口字典迁移配置。');
    }
    html = html.slice(0,start) + after + html.slice(start+before.length);
  }

  function replaceBetween(start, end, replacement = '') {
    const from = html.indexOf(start);
    const to = html.indexOf(end,from+start.length);
    if (from < 0 || to < 0) throw Error('无法定位业务字段原字典入口。');
    replaceOnce(html.slice(from,to),replacement);
  }

  replaceOnce(
    "routes['business-data-dictionary'] = { key: 'business-data-dictionary', page: 'brand-business-categories', view:'dictionary', label: '取数接口字典', permission: 'business.dictionary', domain: 'CLOUD_CONTACT_CENTER', internal: true, parent: 'business-management', breadcrumb: ['业务管理', '业务分类', '取数接口字典'] };",
    `routes['${route}'] = {key:'${route}',page:'${route}',label:'${name}',permission:'business.dictionary',domain:'CLOUD_CONTACT_CENTER',internal:true,parent:'system',breadcrumb:['${area}','${group}','${name}']};`
  );
  replaceOnce(
    "    const kinds=model.canManage()&&(brands.length||window.DSharedConfiguration?.legacySource())?(window.DSharedConfiguration?.legacySource()?['category','field']:['category','field','dictionary']):[];\n"+
    "    if(!kinds.length && window.BusinessData?.canManage?.()===true)kinds.push('dictionary');\n"+
    "    return kinds.filter(k=>parent.DApp.currentPage()==='PAGE-2223'?k!=='category':k==='category');",
    "    return model.canManage()&&(brands.length||window.DSharedConfiguration?.legacySource())?\n"+
    "      [parent.DApp.currentPage()==='PAGE-2223'?'field':'category']:[];"
  );
  replaceBetween('  function links(kind) {','  function operationGuide() {',"  function links(kind) { return ''; }\n");
  replaceBetween('  function readonlyDictionary(scope) {','  function render(kind=activeKind) {');
  replaceBetween("    if(kind==='dictionary') {","    const data=catalog(), rows=data.ok?sortedRows(kind,data):[];");
  replaceOnce("['category','field','dictionary'].includes(options?.view)","['category','field'].includes(options?.view)");
  replaceOnce("['category','field','dictionary'].includes(options.view)","['category','field'].includes(options.view)");
  replaceOnce('可在“业务分类 → 自定义字段”选择此接口。','可在“业务&客户 → 业务配置 → 业务字段”选择此接口。');
  cloud.html = html;

  DNav.pages.push({id,name,area,group,route,menu:true,module:'public',phoneDomain:'outside'});
  window.DCatalogEntries[id] = {kind:'cloud',route};
  const pagePolicy = DRolePermissions.page;
  DRolePermissions.page = (page,context,seat) => page===id ? DSession.allowed(fieldPage,context) : pagePolicy(page,context,seat);
  const writePolicy = DRolePermissions.writable;
  DRolePermissions.writable = (page,context,seat) => writePolicy(page===id ? fieldPage : page,context,seat);
})();
