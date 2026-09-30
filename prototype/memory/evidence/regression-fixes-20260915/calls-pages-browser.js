async page => {
 const out={checks:[],cases:[],errors:[]};const check=(ok,label)=>{if(!ok)throw Error(label);out.checks.push(label);};page.on('pageerror',e=>out.errors.push(e.message));
 await page.evaluate(()=>{DemoSwitch.enter('ACC-SUPER-001');AppState.chooseInstance('7522240');AppState.chooseDomain('CLOUD_CONTACT_CENTER');navigateTo('event-callbacks');});
 for(const id of ['VIEW-DEMO-HQ-DATA','VIEW-DEMO-SH-DATA']) {
  const r=await page.evaluate(id=>{CallDataIssues.open(id);return {id,text:document.getElementById('call-data-issue')?.innerText,row:CloudCallData.callDataIssues.find(r=>r.issueId===id)};},id);
  check(r.text?.includes('历史异常依据待核对')&&Array.isArray(r.row.trace),'K01 '+id+'详情有异常说明且不崩溃');out.cases.push({id,traceLength:r.row.trace.length,status:r.row.status});
 }
 await page.evaluate(()=>CallDataIssues.recheck('VIEW-DEMO-SH-DATA'));await page.waitForFunction(()=>CloudCallData.callDataIssues.find(r=>r.issueId==='VIEW-DEMO-SH-DATA').status!=='核对中');
 check(await page.evaluate(()=>{const r=CloudCallData.callDataIssues.find(r=>r.issueId==='VIEW-DEMO-SH-DATA');return r.status==='仍需处理'&&r.attempts===1&&r.trace.length===1;}),'K01资料不足核对保留待处理且记录尝试，不虚假恢复');
 await page.evaluate(()=>{const row={issueId:'FIX-MISSING-ISSUE',enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ',callId:'MISSING',status:'待核对'};CloudCallData.callDataIssues.push(row);CallDataIssues.open(row.issueId);});
 check(await page.locator('#call-data-issue').innerText().then(t=>t.includes('异常类型待核对')),'K01缺字段记录提供安全占位，不伪造依据');
 await page.evaluate(()=>{PlatformUI.closeLayer('call-data-issue');navigateTo('audit');Pages['system-center'].openAudit('SHOWCASE-SH-AUDIT-3');});
 check(await page.locator('#audit-detail').innerText().then(t=>t.includes('上海华东门店')),'RG15授权超管可正常查看目标审计');
 await page.evaluate(()=>{PlatformUI.closeLayer('audit-detail');DemoSwitch.enter('ACC-OPS-108');AppState.chooseDomain('CLOUD_CONTACT_CENTER');Pages['system-center'].openAudit('SHOWCASE-SH-AUDIT-3');});
 check(!await page.locator('#audit-detail').count(),'RG15无菜单权限且跨租户运营不能打开审计详情');
 await page.evaluate(()=>{DemoSwitch.enter('ACC-SUPER-001');AppState.chooseInstance('7522240');AppState.chooseDomain('CLOUD_CONTACT_CENTER');navigateTo('cloud-call-records');const now=Date.now();const row={callId:'FIX-EXPIRED',enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ',callType:'人工外呼',caller:'02112345678',callee:'13900009876',result:'接通',durationSeconds:30,answeredAt:new Date(now-30000).toISOString(),ringingAt:new Date(now-35000).toISOString(),endedAt:new Date(now).toISOString(),recordingUrlExpiresAt:'2026-09-14 00:00:00',alictiRecording:{result:0,data:'https://voice-1.alicti.cn/fix-expired.mp3'}};CloudCallData.calls.push(row);});
 await page.locator('#recordKeyword').fill('FIX-EXPIRED');await page.locator('#recordingFilter').selectOption('录音链接已过期');await page.evaluate(()=>Pages['cloud-call-records'].query());
 check((await page.locator('#page-content tbody').innerText()).includes('FIX-EXPIRED'),'RG13官方过期录音按产品状态筛选仍可找到');
 out.expired=await page.evaluate(()=>CloudCallMedia.resolve(CloudCallData.calls.find(c=>c.callId==='FIX-EXPIRED')).status);
 const states=await page.evaluate(()=>{const now=Date.now(),row={callId:'FIX-ANSWERED',contactId:'FIX-ANSWERED',enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ',callType:'预外呼',caller:'02112345678',callee:'13900009875',durationSeconds:5,ringingAt:new Date(now-10000).toISOString(),endedAt:new Date(now).toISOString(),result:'待确认'};CallState.start(row,{at:now-10000});CallState.ingest(row,{enterpriseId:'7522240',contactId:row.callId,channelId:'customer',role:'customer',type:'Established',at:now-5000});CallState.finish(row,{at:now});row.alictiCdr={kind:'predictive',raw:{enterpriseId:7522240,status:40,endTime:now}};CloudCallData.calls.push(row);Pages['cloud-call-records'].openCall(row.callId);
 const inbound={...row,callId:'FIX-HUMAN-UNANSWERED',contactId:'FIX-HUMAN-UNANSWERED',telephony:undefined,callType:'呼入',alictiCdr:{kind:'inbound',raw:{enterpriseId:7522240,status:'人工未接听',answerTime:now-8000,endTime:now}}};CloudCallData.calls.push(inbound);const model=CloudReportData.getModel('inbound',{period:'今日',keyword:inbound.callId});return {call:CallState.view(row),text:document.getElementById('cloud-call-detail').innerText,inbound:{row:model.rows.find(r=>r.id===inbound.callId)?.humanResult,unanswered:model.summary.humanUnanswered,pending:model.summary.humanPending}};});
 check(states.call.answered===true&&states.call.confirmation==='CONFLICT'&&states.text.includes('接通已确认，结束原因待核对'),'RG07实际通话详情保留接通并展示冲突');
 check(states.inbound.row==='人工未接通'&&states.inbound.unanswered===1&&states.inbound.pending===0,'RG12呼入报表明确人工未接听计入已知未接分母');out.cases.push(states);
 await page.screenshot({path:'/private/tmp/fix-calls-conflict.png',fullPage:true,animations:'disabled'});
 check(out.errors.length===0,'异常/审计/录音/报表验证无浏览器异常');return out;
}
