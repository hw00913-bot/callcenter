/* Offline synthetic speech for the recording player demonstration only.
 * This is not a supplier recording or speech-recognition result. RASR responses are explicit synthetic fixtures. Transcript text is displayed independently
 * from the audio player and carries no seek positions.
 */
window.CloudCallMediaFixtures = {
  'CALL-MAN-1001': {
    callId: 'CALL-MAN-1001',
    tenantId: 'TEN-NISSAN-HQ',
    enterpriseId: '7522240',
    demo: true,
    url: 'assets/audio/manual-followup-demo.wav',
    label: '合成语音样例',
    scope: '预约到店演示片段',
    uniqueId: 'DEMO-RASR-CALL-MAN-1001',
    transcriptionConditions: { callKind: 'preview', enterpriseAutoAsr: 1, filterBySeat: 1, isAsr: 1, cdrIsAsr: 1 },
    rasr: { result: '0', description: 'RASR 通话文本格式演示，非实际识别结果', data: [
      { monitorSide: '1', text: JSON.stringify([{ text: '您好，这是合成语音演示。我是汽车服务顾问，请问您本周方便到店体验吗？' }]), botText: '[]' },
      { monitorSide: '2', text: JSON.stringify([{ text: '可以，我想预约周六上午十点。' }]), botText: '[]' },
      { monitorSide: '1', text: JSON.stringify([{ text: '好的，已为您记录预约时间。您比较关注空间还是车辆配置？' }]), botText: '[]' },
      { monitorSide: '2', text: JSON.stringify([{ text: '我主要关注空间，想带家人一起看看。' }]), botText: '[]' },
      { monitorSide: '1', text: JSON.stringify([{ text: '没问题，到店后我们会安排体验。以上内容仅为虚构演示，再见。' }]), botText: '[]' },
      { monitorSide: '2', text: JSON.stringify([{ text: '好的，谢谢，再见。' }]), botText: '[]' }
    ] }
  }
};

/** Text-only, fictional dialogue for the existing SHOWCASE calls.
 * Register lazily after saved calls have been restored. No calls, audio, customer
 * history, business results, or supplier responses are created or changed here.
 */
(function (root) {
  'use strict';
  const source = 'SHOWCASE_DIALOGUE_V1';
  const scopes = {
    HQ: { tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240' },
    SH: { tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241' }
  };
  const conversations = {
    lead: [
      ['坐席', '您好，我是汽车服务顾问，想了解一下您最近的看车需求，现在方便聊几句吗？'],
      ['客户', '方便，我主要想了解适合家用的车型。'],
      ['坐席', '您平时主要是上下班通勤，还是也会经常带家人一起出行？'],
      ['客户', '两种情况都有，比较在意后排空间和乘坐舒适度。'],
      ['坐席', '了解了。到店时可以重点体验后排空间，也可以安排试驾。'],
      ['客户', '可以，我先和家人商量一下时间。'],
      ['坐席', '好的，等您确定方便的时间后，我们再沟通具体安排。'],
      ['客户', '没问题，谢谢。']
    ],
    aftersales: [
      ['坐席', '您好，我是售后服务顾问，想回访一下您最近的用车情况。'],
      ['客户', '目前使用正常，最近也准备了解一下保养安排。'],
      ['坐席', '好的，您可以结合车辆提示和保养手册，确认需要检查的项目。'],
      ['客户', '到店之前需要先预约吗？'],
      ['坐席', '建议先和门店确认时间，接待人员会再核对车辆情况和具体项目。'],
      ['客户', '明白，我确认好时间再联系。'],
      ['坐席', '好的，后续有用车问题也可以随时咨询我们。'],
      ['客户', '谢谢，再见。']
    ],
    activity: [
      ['坐席', '您好，这里是门店客户服务，想了解一下您是否有兴趣参加周末到店体验。'],
      ['客户', '可以先介绍一下主要内容吗？'],
      ['坐席', '主要是车辆展示和体验，您也可以带家人一起来了解车型。'],
      ['客户', '我比较关注空间，现场可以看不同车型吗？'],
      ['坐席', '可以，到店前我们会再确认可体验的车型和时间。'],
      ['客户', '好的，我看看周末的安排。'],
      ['坐席', '没问题，等您确定后我们再联系。'],
      ['客户', '好的，谢谢。']
    ],
    predictive: [
      ['坐席', '您好，我是汽车服务顾问，想跟进一下您之前咨询的试驾需求。'],
      ['客户', '我还在看车型，想先了解一下实际乘坐感受。'],
      ['坐席', '您最关注哪一方面？我们可以按您的需求安排体验。'],
      ['客户', '主要看后排空间，平时也会带家人出行。'],
      ['坐席', '了解，到店时可以重点体验空间和座椅。您方便时再确认到店时间就可以。'],
      ['客户', '好的，我和家人商量一下。'],
      ['坐席', '没问题，后续我们按约定再联系。'],
      ['客户', '谢谢，再见。']
    ],
    followup: [
      ['坐席', '您好，我是汽车服务顾问，想继续跟进一下您的看车安排。'],
      ['客户', '我还有几个车型问题，今天暂时不方便详细聊。'],
      ['坐席', '没问题，您更方便哪个时间再沟通？'],
      ['客户', '晚一点再联系吧，我也需要和家人商量。'],
      ['坐席', '好的，我先记录需要再次联系，后续再和您确认具体安排。'],
      ['客户', '可以，谢谢理解。']
    ],
    inbound: [
      ['客户', '您好，我想咨询一下到店看车的安排。'],
      ['坐席', '您好，可以的。请问您有比较关注的车型或使用需求吗？'],
      ['客户', '主要是家用，想带家人一起看看空间。'],
      ['坐席', '了解，您到店时可以重点体验后排和后备箱空间。'],
      ['客户', '如果想试驾，需要提前准备什么？'],
      ['坐席', '我们会在确认预约时告知具体要求，并和您核对方便的时间。'],
      ['客户', '好的，我先确定一下时间。'],
      ['坐席', '没问题，欢迎您随时联系。']
    ],
    automatic: [
      ['机器人', '您好，这里是车辆保养提醒服务。'],
      ['机器人', '请结合车辆提示和保养手册，了解近期是否需要安排车辆保养。'],
      ['机器人', '如需咨询或预约，请在方便时联系您的服务门店。'],
      ['机器人', '本次提醒结束，感谢您的接听，祝您用车愉快。']
    ]
  };
  function kindFor(call) {
    if (!call || call.simulation !== true || call.demoPack !== 'alicti-showcase-v1') return null;
    const match = /^SHOWCASE-(HQ|SH)-(\d{8})-(.+)$/.exec(call.callId || '');
    const scope = match && scopes[match[1]], suffix = match?.[3] || '';
    if (!scope || call.demoCohort !== match[2] || call.tenantId !== scope.tenantId || call.enterpriseId !== scope.enterpriseId) return null;
    if (!call.endedAt || call.result !== '接通' || !['DEMO_FIXTURE_HISTORY', 'LOCAL_TASK_SIMULATION'].includes(call.callSource)) return null;
    let kind = '', conversation = '';
    const manual = /^MANUAL-(LEAD|AFTERSALES|ACTIVITY)-C0[1-4]-CALL-1$/.exec(suffix);
    if (manual) { kind = 'manual'; conversation = manual[1].toLowerCase(); }
    else if (/^PRED-(RUNNING|PAUSED|ENDED|FOLLOWUP|SAME-TASK-FOLLOWUP)-C0[1-6]-CALL-[12]$/.test(suffix)) { kind = 'predictive'; conversation = suffix.includes('FOLLOWUP') ? 'followup' : 'predictive'; }
    else if (/^INBOUND-C0[1-4]-CALL-1-IN$/.test(suffix)) { kind = 'inbound'; conversation = 'inbound'; }
    else if (/^AUTO-(RUNNING|PAUSED|ENDED)-C0[1-6]-CALL-[12]$/.test(suffix)) { kind = 'automatic'; conversation = 'automatic'; }
    if (!kind) return null;
    const cdr = call.alictiCdr, raw = cdr?.raw;
    if (cdr?.mock !== true || cdr.kind !== kind || !raw || raw.mainUniqueId !== call.callId || String(raw.enterpriseId) !== scope.enterpriseId) return null;
    const connectedStatus = { manual: '3', predictive: '43', inbound: '人工接听', automatic: '客户接听' };
    if (String(raw.status) !== connectedStatus[kind]) return null;
    // A customer's answer alone never supplies an invented human conversation.
    if (kind !== 'automatic' && !(Number(raw.bridgeDuration) > 0)) return null;
    if (kind === 'automatic' && !(Number(raw.customerBridgeDuration) > 0)) return null;
    return { kind, conversation };
  }
  function register(call) {
    const existing = root.CloudCallMediaFixtures?.[call?.callId];
    const match = kindFor(call);
    if (!match) {
      // A saved correction can remove earlier eligibility without leaving stale text.
      if (existing?.fixtureSource === source && existing.tenantId === call?.tenantId && existing.enterpriseId === call?.enterpriseId) delete root.CloudCallMediaFixtures[call.callId];
      return null;
    }
    if (existing && existing.fixtureSource !== source) return null;
    if (existing?.conversation === match.conversation && existing.tenantId === call.tenantId && existing.enterpriseId === call.enterpriseId) return existing;
    const uniqueId = 'DEMO-RASR-' + call.callId;
    const fixture = {
      callId: call.callId, tenantId: call.tenantId, enterpriseId: call.enterpriseId,
      demo: true, transcriptOnly: true, fixtureSource: source, conversation: match.conversation,
      label: '演示通话文本', scope: '虚构对话样例', uniqueId,
      rasr: {
        result: '0', description: '虚构演示对话，非真实录音或语音识别结果',
        enterpriseId: call.enterpriseId, uniqueId,
        data: conversations[match.conversation].map(([role, text]) => ({
          monitorSide: role === '客户' ? '2' : '1',
          text: JSON.stringify(role === '机器人' ? [] : [{ text }]),
          botText: JSON.stringify(role === '机器人' ? [{ text }] : [])
        }))
      }
    };
    root.CloudCallMediaFixtures[call.callId] = fixture;
    return fixture;
  }
  root.CloudCallDemoTranscripts = Object.freeze({ register });
})(window);
