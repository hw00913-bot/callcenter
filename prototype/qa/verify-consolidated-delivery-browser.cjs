async page => {
 const currentUrl=page.url();
 const base=/^https?:\/\//.test(currentUrl)&&currentUrl.includes('/prototype/')?currentUrl.slice(0,currentUrl.indexOf('/prototype/')+11):'http://127.0.0.1:8773/Demo_Protype_2/prototype/';
 const version='2026-09-18-seat-operations-1';
 const checks=[],errors=[],requests=[];
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name)};
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400 && r.url().startsWith(base)) requests.push({url:r.url(),status:r.status()})});
 await page.setViewportSize({width:1440,height:1050});
 for(const file of ['functional-spec','interaction','field-alignment','remaining-confirmations','change-log','development','exception-definitions','release-notes']){
  await page.goto(base+'docs/'+file+'.html');
  if(file==='release-notes')await page.waitForURL('**/docs/change-log.html');
  check(file+' title',!!await page.title());
  check(file+' content',(await page.locator('body').innerText()).length>100);
  check(file+' single history entry',await page.locator('aside a[href="change-log.html"]').count()===1);
  check(file+' no separate release entry',await page.locator('aside a[href="release-notes.html"]').count()===0);
  check(file+' no horizontal page overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 }
 await page.goto(base+'docs/functional-spec.html#FS-13');
 check('FS13 official creation',await page.locator('body').innerText().then(t=>t.includes('ivrRouter/create')&&t.includes('routerType')));
 await page.getByLabel('文档目录').getByRole('link',{name:'规则附表 A–N',exact:true}).click();
 check('appendix navigation',page.url().endsWith('interaction.html'));
 for(const n of [36,37,38,39,40,41,42,43])check('in-call appendix G-'+n,await page.locator('#G-'+n).count()===1);
 for(const n of [25,26,27])check('account read-only appendix A-'+n,await page.locator('#A-'+n).count()===1);
 for(const [prefix,from,to] of [['C',59,62],['F',26,27],['H',20,31]])for(let n=from;n<=to;n++)check('queue increment appendix '+prefix+'-'+n,await page.locator('#'+prefix+'-'+n).count()===1);
 const ruleText=async id=>page.locator('#'+id).evaluate(el=>(el.closest('tr')||el).textContent);
 const queueRoleRule=await ruleText('F-27');
 check('queue ADMIN write rule scoped',['仅本租户维护','候选只返回本租户','不允许','版本'].every(t=>queueRoleRule.includes(t)));
 check('queue view action remains read-only',await ruleText('F-26').then(t=>['只读','不含配置','不产生写入'].every(v=>t.includes(v))));
 check('dedicated queue tenant boundary',await ruleText('H-20').then(t=>['enterpriseId','专用队列','跨租户','不增加'].every(v=>t.includes(v))));
 check('association preserves provider skills',await ruleText('H-21').then(t=>['本地映射','不调用queue/update','不自动替换'].every(v=>t.includes(v))));
 check('queue membership does not imply route readiness',await ruleText('H-29').then(t=>['目标供应商技能','空名单','需重新核对','不证明'].every(v=>t.includes(v))));
 check('predictive defaults preserve legacy',await ruleText('C-60').then(t=>['默认4','默认1','不将既有历史'].every(v=>t.includes(v))));
 check('six optional business rules',await page.locator('body').innerText().then(t=>['线索等级','意向等级','到店意向','试驾意向','计划到店时间','计划到店门店'].every(v=>t.includes(v))));
 await page.goto(base+'docs/functional-spec.html#FS-11');
 const workbenchText=await page.locator('body').innerText();
 check('in-call functional contract visible',['D-038','通话中','自动暂存','草稿','确认保存'].every(text=>workbenchText.includes(text)));
 check('after-call-only writing instruction removed',!workbenchText.includes('通话结束后填写处理结果与备注'));
 const sectionText=async id=>page.locator('#'+id).evaluate(el=>{const texts=[];let next=el;do{texts.push(next.textContent);next=next.nextElementSibling}while(next&&!/^H[123]$/.test(next.tagName));return texts.join(' ')});
 await page.goto(base+'docs/functional-spec.html#FS-12');
 const seatDoc=await sectionText('FS-12');
 check('seat runtime increment documented',['D-042','CAP-SEAT-09','pause','unpause','LOCAL_MOCK.inspectSeatSession'].every(t=>seatDoc.includes(t)));
 await page.goto(base+'docs/functional-spec.html#FS-01');
 const accountDoc=await sectionText('FS-01');
 check('account read-only contract visible',['D-039','只读','关联租户','直接打开','不切换','不自动再打开详情'].every(t=>accountDoc.includes(t)));
 await page.goto(base+'docs/functional-spec.html#FS-02');
 const tenantDoc=await sectionText('FS-02');
 check('independent tenant creation contract visible',['D-039','租户管理','启用','账号'].every(t=>tenantDoc.includes(t)));
 await page.goto(base+'docs/functional-spec.html#FS-05');
 const queueDoc=await sectionText('FS-05');
 check('queue functionality scope documented',['D-040','API-377','API-378','专用接听队列','queueSkills','同账号同租户'].every(t=>queueDoc.includes(t)));
 check('queue ADMIN maintenance documented',/ADMIN[^。]*本租户[^。]*接听队列/.test(queueDoc)&&queueDoc.includes('租户管理员可新增、关联、修改、核对和解除本租户队列'));
 check('queue view action is read-only',queueDoc.includes('独立只读右侧抽屉')&&queueDoc.includes('查看抽屉不含新增、管理或修改按钮'));
 check('queue strategy and priority distinct',['rrordered','rrmemory','fewestcalls','random','linear','leastrecent','数值越大队列优先级越高','实际分配由对应呼叫场景与策略决定'].every(t=>queueDoc.includes(t)));
 check('queue mock and production boundary',queueDoc.includes('不向AliCti发送写请求')&&queueDoc.includes('浏览器版本检查不是生产原子锁'));
 await page.goto(base+'docs/functional-spec.html#FS-09');
 const assignmentDoc=await sectionText('FS-09');
 check('predictive assignment separate from queue',['D-041','callStrategy','String','显式默认4','原接口默认1','自动IVR任务不携带','冻结快照'].every(t=>assignmentDoc.includes(t)));
 await page.goto(base+'docs/change-log.html');
 for(const [id,required] of [['D-040',['队列','租户','技能']],['D-041',['callStrategy','预测','4','1']]]){
  const link=page.locator('aside a[href^="#'+id+'"]');
  check(id+' history entry unique',await link.count()===1);
  const anchor=await link.getAttribute('href');await link.click();
  check(id+' history navigation',decodeURIComponent(page.url().split('#')[1]||'')===decodeURIComponent(anchor.slice(1)));
  const detail=await sectionText(decodeURIComponent(anchor.slice(1)));
  check(id+' scoped history content',required.every(t=>detail.includes(t)));
 }
 const accountHistoryLink=page.locator('aside a[href^="#D-039"]');
 check('new account read-only history entry unique',await accountHistoryLink.count()===1);
 const accountHistoryAnchor=await accountHistoryLink.getAttribute('href');
 await accountHistoryLink.click();
 check('new account read-only history navigation',decodeURIComponent(page.url().split('#')[1]||'')===decodeURIComponent(accountHistoryAnchor.split('#')[1]||''));
 const inCallHistoryLink=page.locator('aside a[href^="#D-038"]');
 check('new in-call history entry unique',await inCallHistoryLink.count()===1);
 const inCallHistoryAnchor=await inCallHistoryLink.getAttribute('href');
 await inCallHistoryLink.click();
 check('new in-call history navigation',decodeURIComponent(page.url().split('#')[1]||'')===decodeURIComponent(inCallHistoryAnchor.split('#')[1]||''));
 await page.getByRole('link',{name:'D-025 客户业务信息与通话快照',exact:true}).click();
 check('changelog section navigation',decodeURIComponent(page.url()).includes('#D-025'));
 await page.screenshot({path:'/private/tmp/consolidated-change-log.png',fullPage:false});
 await page.goto(base+'related-systems/index.html');
  const blueprintVersion=await page.evaluate(()=>window.SystemBlueprintData?.version);
  check('blueprint current source version',blueprintVersion==='1.15'&&await page.evaluate(()=>window.SystemBlueprintData?.deliveryVersion)==version);
  check('blueprint current version',await page.locator('.bp-version').innerText()==='蓝图 v'+blueprintVersion);
 for(const view of ['overview','platform','adapter','alicti','reports']){
  await page.locator('[data-view-link="'+view+'"]').click();
  const svg=page.locator('[data-view-svg="'+view+'"]');
  check(view+' visible',await svg.isVisible());
  const issues=await svg.evaluate(svg=>{
   const vb=svg.viewBox.baseVal;return [...svg.querySelectorAll('text')].flatMap(t=>{const b=t.getBBox();return b.x<0||b.y<0||b.x+b.width>vb.width+1||b.y+b.height>vb.height+1?[t.textContent]:[]});
  });
  check(view+' text within canvas '+JSON.stringify(issues),!issues.length);
  await page.locator('[data-action="zoom-in"]').click();
  check(view+' zoom readable',!!(await page.locator('#bp-zoom').innerText()));
  await page.locator('[data-action="fit"]').click();
 }
 await page.locator('[data-view-link="platform"]').click();
 await page.locator('[data-node-id="platform-business-info"]').click();
 check('customer business inspector',await page.locator('#bp-detail-content').innerText().then(t=>t.includes('线索等级')&&t.includes('计划到店时间')&&t.includes('历史')));
 await page.locator('#bp-close-detail').click();
 check('inspector closes',await page.locator('#bp-inspector').isHidden());
 await page.locator('[data-node-id="platform-inbound-rules"]').click();
 check('inbound inspector sources',await page.locator('#bp-detail-content').innerText().then(t=>t.includes('API-350')&&t.includes('API-354')));
 await page.locator('#bp-close-detail').click();
 await page.screenshot({path:'/private/tmp/consolidated-blueprint.png',fullPage:false});
 await page.locator('[data-view-link="platform"]').click();
 await page.locator('[data-node-id="platform-account-directory"]').click();
 check('account directory inspector',await page.locator('#bp-detail-content').innerText().then(t=>['D-039','FA-149','只读','账号列表'].every(x=>t.includes(x))));
 await page.locator('#bp-close-detail').click();
 await page.screenshot({path:'/private/tmp/account-details-platform-blueprint-20260918.png',fullPage:false});
 for(const [view,node,required] of [
  ['platform','platform-queue-config',['队列','D-040']],
  ['platform','platform-queue-check',['技能','成员']],
  ['platform','platform-predictive-strategy',['callStrategy','D-041']],
  ['adapter','adapter-queue-contract',['queue','queueSkills']],
  ['adapter','adapter-queue-reconcile',['技能','成员']],
  ['alicti','alicti-queue',['queue','API-377']]
 ]){
  await page.locator('[data-view-link="'+view+'"]').click();
  await page.locator('[data-node-id="'+node+'"]').click();
  check(node+' inspector scoped content',await page.locator('#bp-detail-content').innerText().then(t=>required.every(v=>t.includes(v))));
  await page.locator('#bp-close-detail').click();
 }
 await page.locator('[data-view-link="interfaces"]').click();
 check('69 blueprint source entries displayed',await page.locator('.bp-api-table tbody tr').count()===69);
 await page.goto(base+'docs/functional-spec.html#FS-16');
 check('lead rules visible',await page.locator('body').innerText().then(t=>['线索成效','线索编码','首次','calledCount'].every(x=>t.includes(x))));
 for(const file of ['business-process','sequence-interaction']){
  await page.goto(base+'flowcharts/'+file+'.html');
  for(const n of ['006','008','014','015','103','105','208','211','212','213','214','215','216','217','218','219','220','221']){
   const id=(file==='business-process'?'SC-':'SEQ-')+n, card=page.locator('#'+id), svg=card.locator('svg');
   check(id+' current diagram',await svg.count()===1);
   check(id+' current version',await card.getAttribute('data-current-version')===version);
   const clipped=await svg.evaluate(el=>{const v=el.viewBox.baseVal;return [...el.querySelectorAll('text')].filter(t=>{const b=t.getBBox();return b.x<0||b.y<0||b.x+b.width>v.width+1||b.y+b.height>v.height+1}).map(t=>t.textContent)});
   check(id+' text inside canvas '+JSON.stringify(clipped),!clipped.length);
   const currentDiagramText=(await card.innerText()).replace(/\s+/g,'');
   if(n==='006')check(id+' current queue preparation boundary',['D-040','队列'].every(t=>currentDiagramText.includes(t)));
   if(['014','015'].includes(n))check(id+' current task assignment boundary',['D-041','callStrategy'].every(t=>currentDiagramText.includes(t)));
   if(n==='218'){
    const required=file==='business-process'?['queue+queueSkills','只保存本地映射','接听配置']:['本地绑定','不生成供应商技能修改','不执行任何网络调用'];
    check(id+' queue creation and association boundary',required.every(t=>currentDiagramText.includes(t)));
   }
   if(n==='219'){
    const required=file==='business-process'?['唯一技能ID','Stringcno','缺失与额外']:['技能映射','精确比对成员','空空不能跳过技能'];
    check(id+' queue skill and agent comparison boundary',required.every(t=>currentDiagramText.includes(t)));
   }
   if(['103','208','214'].includes(n)){
    const diagramText=(await card.innerText()).replace(/\s+/g,'');
    check(id+' recording lifecycle visible',['草稿','暂存','不发送AliCti','确认保存','wrap'].every(text=>diagramText.includes(text)));
   }
   if(['216','217'].includes(n)){
    const diagramText=await card.innerText();
    check(id+' read-only entry boundaries visible',['D-039','SRC-071','只读','租户管理','账号列表','A-25','A-26','A-27'].every(t=>diagramText.includes(t)));
    check(id+' old nested management path removed',!diagramText.includes('查看账号详情，选择新增租户或管理租户')&&!diagramText.includes('从详情选择新增租户或进入账号使用'));
   }
   if(['006','103','208','214','215','216','217','218','219','220','221'].includes(n)){
    await card.getByRole('button',{name:'阅读模式',exact:true}).click();
    const before=await svg.boundingBox();
    await card.getByRole('button',{name:'放大',exact:true}).click();
    check(id+' zoom works',(await svg.boundingBox()).width>before.width);
    await card.getByRole('button',{name:'适应宽度',exact:true}).click();
    await card.getByRole('button',{name:'全屏',exact:true}).click();
    check(id+' fullscreen works',await card.locator('[data-diagram-panel]').evaluate(el=>el.classList.contains('atlas-expanded')||document.fullscreenElement===el));
    if(await page.evaluate(()=>!!document.fullscreenElement)) {
     await card.getByRole('button',{name:'全屏',exact:true}).click();
     await page.waitForFunction(()=>!document.fullscreenElement);
    } else {await page.keyboard.press('Escape');}
    check(id+' fullscreen closes',await card.locator('[data-diagram-panel]').evaluate(el=>!el.classList.contains('atlas-expanded')&&!document.fullscreenElement));
    await card.locator('.diagram').evaluate(el=>{el.scrollTop=0;el.scrollLeft=0;});
    await card.locator('h2').scrollIntoViewIfNeeded();
    await page.screenshot({path:'/private/tmp/consolidated-'+id+'-20260918.png',fullPage:false});
   }
  }
 }
 await page.goto(base+'docs/release-notes.html');
 await page.waitForURL('**/docs/change-log.html');
 check('legacy release redirects',page.url().endsWith('/docs/change-log.html'));
 check('release current version',await page.locator('main').innerText().then(t=>t.includes(version)));
 const releaseCounts=await page.locator('#本版数量与边界 + .table-wrap tbody tr').evaluateAll(rows=>Object.fromEntries(rows.map(row=>[row.cells[0].textContent.trim(),row.cells[1].textContent.trim()])));
 for(const [label,expected] of [['字段映射',178],['附表规则',399],['官方文档快照',82]])check('release count '+label,releaseCounts[label]===String(expected));
 const releaseChanges=await sectionText('本版变化');
 check('release new decisions summarized',['D-042','坐席','电话','队列'].every(t=>releaseChanges.includes(t)));
 await page.screenshot({path:'/private/tmp/consolidated-release-notes-20260918.png',fullPage:false});
 await page.goto(base+'docs/development.html');
 check('lightweight guide visible',await page.getByRole('heading',{name:'开发阅读指引',exact:true}).count()===1);
 check('no package download',await page.locator('a[href$=".zip"]').count()===0);
 check('guide references canonical business docs',await page.locator('main a[href="functional-spec.html"]').count()>0);
 check('no page errors',errors.length===0);check('no failed local resources',requests.length===0);
 return {checks,count:checks.length,errors,requests};
}
