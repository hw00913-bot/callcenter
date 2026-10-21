/** Actual shared layer snapshots and nested BusinessConfiguration ownership. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(process.argv[2] || path.join(__dirname,'..'));
const {harness}=require(path.join(base,'qa/check-business-config-dirty-close.cjs'));
let assertions=0;const check=(v,m)=>{assert.ok(v,m);assertions++;};
{
 const h=harness(),U=h.win.PlatformUI;check(!U.hasUnsavedLayers(),'no open draft allows navigation');h.open();check(!U.hasUnsavedLayers(),'unchanged saved field is clean');
 h.P.setBasic('label','新名称草稿');check(U.hasUnsavedLayers(),'real field editor reports its independent model draft');
 const before=JSON.stringify(h.M.getField(h.id,h.scope));h.P.close();check(U.hasUnsavedLayers(),'discard confirmation does not hide the underlying draft');h.key('Escape');check(U.hasUnsavedLayers(),'continue editing retains the leave guard');
 h.P.close();h.confirmButton().click();check(!U.hasUnsavedLayers(),'explicit discard clears the guard');check(JSON.stringify(h.M.getField(h.id,h.scope))===before,'discard never saves the draft');
 h.open();h.P.setBasic('label','实际保存名称');h.P.save();check(!U.hasUnsavedLayers(),'saving clears field draft');check(h.M.getField(h.id,h.scope).label==='实际保存名称','save persists through the real model');
}
{
 const h=harness(),U=h.win.PlatformUI;h.P.render('category');h.P.open('category','lead');h.P.setBasic('label','父分类未保存名称');h.P.openRelated('field');
 check(U.hasUnsavedLayers(),'clean child still protects an unsaved parent category');
 h.P.setBasic('label','子字段草稿');check(U.hasUnsavedLayers(),'dirty child is protected');h.P.close();h.confirmButton().click();
 check(U.hasUnsavedLayers()&&h.node('business-category-label').value==='父分类未保存名称','child discard preserves parent draft and leave guard');h.P.close();h.confirmButton().click();check(!U.hasUnsavedLayers(),'discarding parent leaves no stale guard');
}
{
 const h=harness(),U=h.win.PlatformUI;vm.runInContext(fs.readFileSync(path.join(base,'js/pages/business-data-dictionary.js'),'utf8'),h.win);
 const D=h.win.Pages['business-data-dictionary'];D.render({embedded:true,scope:h.scope});D.open();
 check(!U.hasUnsavedLayers(),'untouched interface dictionary form is clean');h.node('business-data-name').value='未保存取数接口';check(U.hasUnsavedLayers(),'real dictionary form change is detected without global dirty flag');
 D.close();check(!U.hasUnsavedLayers(),'closing the dictionary removes its draft guard');
 U.confirm({id:'ordinary-confirmation',title:'确认测试',body:'<p>没有业务草稿</p>'});check(!U.hasUnsavedLayers(),'ordinary confirmation alone is not a draft');
}
console.log(JSON.stringify({ok:true,assertions,scope:'actual field/category/dictionary drafts, nested ownership, save/discard and clean dialogs'}));
