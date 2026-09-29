/* Regression checks for late CDR evidence and independent human-answer results. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const root = path.resolve(__dirname, '..'), context = { console, Date }, checks = [];
context.window = context; vm.createContext(context);
for (const file of ['js/components/alicti-fields.js','js/components/alicti-number-status.js','js/components/call-state.js','js/components/alicti-report-facts.js','js/components/report-metrics.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const { CallState: state, CloudReportMetrics: metrics } = context;
const now = new Date('2026-09-15T10:00:00+08:00').getTime();
function call(kind='predictive',status=40) { return {callId:'RG-CALL',contactId:'RG-CALL',enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ',callType:kind==='inbound'?'呼入':kind==='manual'?'人工外呼':'预外呼',caller:'02100008888',callee:'13900009999',result:'待确认',ringingAt:now-10000,endedAt:now,durationSeconds:5,alictiCdr:{kind,raw:{enterpriseId:7522240,status,startTime:(now-10000)/1000,endTime:now/1000}}}; }
function check(name,fn) { fn(); checks.push(name); }
function established(record,role,at) { state.ingest(record,{enterpriseId:'7522240',contactId:'RG-CALL',channelId:role,role,type:'established',at}); }
check('RG-07 late unanswered CDR preserves confirmed customer evidence and reports conflict',()=>{
  const row=call();state.start(row,{at:now-10000});established(row,'customer',now-5000);state.finish(row,{at:now});
  const raw=JSON.stringify(row.alictiCdr.raw), v=state.view(row), s=metrics.stats([row]);
  assert.equal(v.answered,true);assert.equal(v.confirmation,'CONFLICT');assert(v.issues.includes('customer-established-conflicts-with-final-unanswered'));
  assert.equal(s.connected,1);assert.equal(s.unanswered,0);assert.equal(JSON.stringify(row.alictiCdr.raw),raw);
});
check('RG-07 incomplete or duplicate CDR cannot remove positive evidence',()=>{
  const row=call('predictive',999);state.start(row,{at:now-10000});established(row,'customer',now-5000);state.finish(row,{at:now});
  assert.equal(state.view(row).answered,true);assert.equal(state.view(row).answered,true);
});
check('Unknown CDR does not inherit a legacy unanswered label',()=>{const row=call('manual',999);row.result='未接通';assert.equal(state.view(row).answered,null);});
check('A foreign enterprise CDR remains unusable',()=>{const row=call('manual',3);row.alictiCdr.raw.enterpriseId=7000001;assert.equal(state.view(row).answered,null);assert(state.view(row).issues.includes('供应商账号不匹配'));});
check('RG-12 explicit agent-unanswered remains false independently of customer result',()=>{
  for(const [kind,status] of [['inbound','人工未接听'],['predictive',42],['manual',2]]) {
    const row=call(kind,status);if(kind==='inbound')row.alictiCdr.raw.answerTime=(now-8000)/1000;
    assert.equal(state.view(row).agentAnswered,false);assert.equal(metrics.humanAnswer(row),false);
    const s=metrics.stats([row]);assert.equal(s.humanUnanswered,1);assert.equal(s.humanPending,0);
  }
});
check('Explicit both-side connection counts answered without inventing missing duration',()=>{
  const row=call('predictive',43),s=metrics.stats([row]);assert.equal(s.humanConnected,1);assert.equal(s.humanSeconds,null);assert.equal(s.humanDurationMissing,1);
});
check('System answer alone is not an artificial agent connection',()=>{const row=call('inbound','系统应答');assert.equal(state.view(row).answered,true);assert.equal(metrics.humanAnswer(row),null);});
check('Positive agent event survives contradictory later agent failure',()=>{const row=call('predictive',42);row.alictiCdr.raw.bridgeDuration=4;state.start(row,{at:now-10000});established(row,'customer',now-5000);established(row,'agent',now-4000);state.finish(row,{at:now});const v=state.view(row);assert.equal(v.agentAnswered,true);assert(v.issues.includes('agent-established-conflicts-with-final-unanswered'));assert.equal(metrics.humanAnswer(row),true);assert.equal(metrics.humanSeconds(row),4);});
check('Raw conflicting status and timestamps remain available for review',()=>{const row=call('manual',1);row.alictiCdr.raw.bridgeTime=(now-5000)/1000;const before=JSON.stringify(row),v=state.view(row);assert.equal(v.answered,true);assert(v.issues.includes('客户接听状态与时间冲突'));assert.equal(JSON.stringify(row),before);});
console.log(JSON.stringify({result:'pass',count:checks.length,checks},null,2));
