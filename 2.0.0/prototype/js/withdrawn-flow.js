/* Remove the withdrawn 2.0-derived workflow surfaces from this review only. */
(() => {
  'use strict';
  window.DNav.pages = window.DNav.pages.filter(page => page.id !== 'PAGE-2228');
  delete window.DCatalogEntries['PAGE-2228'];

  const cloud = window.DNativeModules.cloud;
  const retiredActions = JSON.stringify([
    'openEnableFlow', 'openTransition', 'openReopen', 'openReclassify',
    'openAbandon', 'openAbandonFollowup', 'openHistoricalSettlement'
  ]);
  const retiredCalls = JSON.stringify([
    'enableFlow', 'advance', 'transfer', 'reopen', 'reclassify',
    'abandon', 'confirmAbandonedSettlement'
  ]);

  cloud.html = cloud.html
    .replace(/^\s*\{ key: 'flow-templates', page: 'flow-templates',.*?\}\s*$/m, '')
    .replace("window.Pages['flow-templates']={render:()=>render('template')};",
      "window.Pages['flow-templates']={render:()=>''};")
    .replace(/\$\{kind==='category'&&!currentScope\(\)\.legacy\?\x60<button data-action="ACTION-11220".*?<\/button>\x60:''\}/,
      '')
    .replace(/^.*\{key:'flowBinding',label:currentScope\(\)\.legacy.*\n/m, '')
    .replace('维护品牌共用业务分类及导入、填写字段；关联的流转模板从列表“路由配置”独立维护。',
      '维护品牌共用业务分类及导入、填写字段。')
    .replace("${kind==='category'?categoryImportAction(row):''}", '')
    .replace(/^  function categoryImportAction\(row\)\{[\s\S]*?(?=^  function rowActions\(kind,row,data\))/m,
      '  function openCategoryImport(){return false;}\n')
    .replace("function call(name,...args){let store;",
      `function call(name,...args){if(${retiredCalls}.includes(name)||name==='importRecords'&&args[0]?.handlingMode==='TEMPLATE')return {status:'failed',message:'此操作已从当前评审范围撤下。'};let store;`)
    .replace("const button=(label,name,args=[],disabled=false,primary=false)=>",
      `const button=(label,name,args=[],disabled=false,primary=false)=>${retiredActions}.includes(name)?'':`)
    .replace(/if\(action==='(?:transfer|advance|reopen)'&&permit\(row,'(?:transfer|advance|reopen)'\)\)return button\([^;]+;/g, '')
    .replace("if(isDirect(row)&&action==='enableFlow'&&row.permissions?.enableFlow===true)return button('启用流程','openEnableFlow',[id],false,true);", '')
    .replace("flowAllowed=row.permissions?.enableFlow===true", "flowAllowed=false")
    .replace(/^  async function openImport\(categoryId\)\{[\s\S]*?^  \}(?=\r?\n  function importCategory\()/m,
      '  async function openImport(){return false;}');
})();
