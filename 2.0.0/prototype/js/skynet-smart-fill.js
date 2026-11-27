(() => {
  'use strict';

  async function query(context, request) {
    const access = window.DIntegrationApplications.status(context,'formFilling');
    const call = request?.call;
    if (access.status !== 'connected' || access.application.id !== request?.applicationId ||
        (access.application.connectionKey || access.application.id) !== (request.connectionKey || request.applicationId) ||
        call?.tenantId !== context.scope.id || !call.taskId || !call.roundId ||
        !['已接通','正常接通'].includes(call.contact)) return {status:'unavailable'};

    // API-013 uses local fixtures until the actual application contract is verified.
    await new Promise(resolve => window.setTimeout(resolve,350));
    const latest = window.DIntegrationApplications.status(context,'formFilling');
    if (latest.status !== 'connected' || latest.application.id !== request.applicationId ||
        (latest.application.connectionKey || latest.application.id) !== (request.connectionKey || request.applicationId)) {
      return {status:'unavailable'};
    }
    if (request.applicationId === 'DEMO-FILL-TIMEOUT') return {status:'timeout'};
    if (request.applicationId === 'DEMO-FILL-EMPTY') return {status:'unavailable'};
    return {status:'available',values:{
      result:'待考虑',intentLevel:'B',
      intentCar:request.lead?.series,intentStore:request.lead?.dealer,
      note:'【模拟】客户希望先了解车型和到店安排，请坐席核对回访内容。'
    }};
  }

  window.DSkynetSmartFill = Object.freeze({query});
})();
