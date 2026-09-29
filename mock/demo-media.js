/** Keep the existing, explicitly labelled synthetic audio/text example easy to find. */
(function () {
  'use strict';
  const kit = window.DemoFixtureKit;
  const call = CloudCallData.calls.find(row => row.callId === 'CALL-MAN-1001');
  const sample = window.CloudCallMediaFixtures?.['CALL-MAN-1001'];
  if (!kit || !call || !sample?.demo || sample.callId !== call.callId || sample.tenantId !== call.tenantId || sample.enterpriseId !== call.enterpriseId) return;
  // Re-date only this pre-existing curated sample, retaining its 206-second CDR.
  // New simulated calls remain without audio; none borrow this recording or text.
  call.endedAt = kit.at(5);
  call.answeredAt = kit.at(5 + 206 / 60);
  call.ringingAt = kit.at(5 + 214 / 60);
  call.recordingSource = '合成语音样例';
  call.recordingUrlExpiresAt = '';
  call.demoMediaDate = kit.date;
})();
