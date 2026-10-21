// Run with playwright-cli run-code --filename in an isolated QA browser. Clears only that browser storage.
async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8772/Demo_Protype_2/prototype/index.html?ui=20260915-navigation1');
 await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload();
 await page.getByRole('button',{name:'登录',exact:true}).click();
 await page.evaluate(()=>{AppState.chooseInstance('7522240');navigateTo('predictive-tasks');});
 await page.waitForTimeout(200);
 const result=await page.evaluate(()=>{
  const checks=[];const check=(name,ok)=>{checks.push({name,ok:!!ok});};
  const root=document.getElementById('page-content');const rootHTML=root.innerHTML; const hash=location.hash;
  const task=CloudCallData.tasks.find(t=>t.callType==='预外呼'&&t.taskId.startsWith('SHOWCASE')&&t.status==='执行中');
  CloudTaskWorkspace.openTask(task.taskId);
  check('task opens secondary dialog',RouteRuntime.secondaryDepth()===1&&!!document.querySelector('[role=dialog]'));
  check('hash stays in originating menu',location.hash===hash);
  check('sidebar remains predictive',!!document.querySelector('.business-nav-child.active[data-route="predictive-tasks"]'));
  check('only one active page id',document.querySelectorAll('#page-content').length===1);
  CloudCallRecords.openFromTask(task.taskId,'calls');
  check('records nested frame',RouteRuntime.secondaryDepth()===2);
  check('back and close controls',document.querySelectorAll('[data-secondary-route] .layer-header .secondary-close').length===2&&document.querySelectorAll('[data-secondary-route] .layer-header .secondary-back').length===2);
  RouteRuntime.back();check('back restores task',RouteRuntime.secondaryDepth()===1&&RouteRuntime.snapshot().options.taskId===task.taskId);
  RouteRuntime.back();check('back restores list DOM intact',document.getElementById('page-content')===root&&root.innerHTML===rootHTML);
  check('no modal after close',!document.querySelector('.platform-layer')&&!document.body.classList.contains('layer-open'));
  return {checks,task:task.taskId};
 });
 await page.waitForTimeout(300);await page.screenshot({path:'/private/tmp/alicti-secondary-navigation/list.png'});
 return {...result,errors};
}
