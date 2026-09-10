/** 本地原型账户服务。业务时钟统一为北京时间，不代表生产接口实现。 */
(function () {
  'use strict';
  var MINUTE = 60000;
  var DAY = 1440 * MINUTE;
  var OFFSET = 8 * 60 * MINUTE;
  function data() { return window.MockRechargeIteration; }
  function parse(value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(value || ''));
    if (!m || +m[1] < 1000 || +m[2] < 1 || +m[2] > 12 || +m[3] < 1 || +m[4] > 23 || +m[5] > 59 || +(m[6] || 0) > 59) return NaN;
    var utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
    var check = new Date(utc);
    if (check.getUTCFullYear() !== +m[1] || check.getUTCMonth() !== +m[2] - 1 || check.getUTCDate() !== +m[3]) return NaN;
    return utc - OFFSET;
  }
  function format(value) {
    var timestamp = typeof value === 'number' ? value : parse(value);
    if (!Number.isFinite(timestamp)) return '';
    var local = new Date(timestamp + OFFSET);
    if (!Number.isFinite(local.getTime()) || local.getUTCFullYear() < 1000 || local.getUTCFullYear() > 9999) return '';
    return local.toISOString().slice(0, 16).replace('T', ' ');
  }
  function minuteInput(value) { return /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(String(value)) && Number.isFinite(parse(value)); }
  function input(value) { return format(value).replace(' ', 'T'); }
  function now() { return parse(data().simulatedNow); }
  function addDays(value, days) { return format(parse(value) + Number(days) * DAY); }
  function durationMinutes(entitlement) {
    var e = entitlement || {};
    return (parse(e.expiresAt) - parse(e.effectiveAt)) / MINUTE;
  }
  function status(entitlement, at) {
    var e = entitlement || {};
    if (!e.effectiveAt && !e.expiresAt) return 'not_opened';
    var start = parse(e.effectiveAt), end = parse(e.expiresAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 'invalid';
    if (end === start) return 'expired';
    var t = at == null ? now() : (typeof at === 'number' ? at : parse(at));
    if (!Number.isFinite(t)) return 'invalid';
    return t < start ? 'pending' : (t < end ? 'active' : 'expired');
  }
  function statusText(value) {
    return { not_opened: '未开通', pending: '待生效', active: '有效', expired: '已过期', invalid: '服务时间异常' }[value] || '服务时间异常';
  }
  function spanText(minutes) {
    if (!Number.isFinite(minutes) || minutes < 0) return '时间异常';
    if (minutes < 60) return minutes + ' 分钟';
    var days = Math.floor(minutes / 1440), hours = Math.floor(minutes % 1440 / 60), rest = minutes % 60;
    return (days ? days + ' 天 ' : '') + (hours ? hours + ' 小时 ' : '') + (rest || (!days && !hours) ? rest + ' 分钟' : '') + '（' + minutes.toLocaleString('zh-CN') + ' 分钟）';
  }
  function profile(id) { return data().tenants.find(function (t) { return String(t.id) === String(id); }) || null; }
  function auth() { return data().authContexts[data().activeAuthKey] || null; }
  function mayManage(id) {
    var a = auth();
    return !!(a && a.role === 'super_admin' && profile(id) && (a.accessibleTenantIds || []).some(function (v) { return v === '*' || String(v) === String(id); }));
  }
  function operatorText(record) { return record.operatorUsername || record.operatorAccountId || '账号信息缺失'; }
  var serial = 0;
  function businessKey(prefix) { return prefix + '-' + Date.now() + '-' + (++serial); }
  function positive(value) { return Number.isSafeInteger(value) && value > 0; }
  function productsFor(p) { return p && p.commercialFlag === 'trial' ? ['trial_package'] : (p && p.commercialFlag === 'commercial' ? ['standard_annual', 'call_credit_pack'] : []); }
  function defaults(p, type, quantity) {
    var product = data().products[type] || {}, pack = type === 'call_credit_pack', q = pack ? quantity : 1;
    return { price: product.unitPrice * q, quantity: q, durationDays: product.defaultDurationDays,
      creditMinutes: pack ? product.defaultCreditMinutesPerPack * q : product.defaultCreditMinutes };
  }
  function previewRecharge(request) {
    var p = profile(request.tenantId), errors = [], pack = request.productType === 'call_credit_pack';
    var d = defaults(p, request.productType, request.quantity);
    var start = parse(request.actualStartAt), end = parse(request.actualEndAt);
    if (!p) errors.push('租户账户不存在');
    if (!productsFor(p).includes(request.productType)) errors.push('充值类型与租户商用/试用标记不匹配');
    if (!positive(request.quantity) || (!pack && request.quantity !== 1)) errors.push('购买数量必须为正整数，服务套餐固定为 1');
    if (!minuteInput(request.actualStartAt) || !minuteInput(request.actualEndAt)) errors.push('请填写有效的开始和结束时间，精确到日期、时分');
    else if (end <= start) errors.push('结束时间必须晚于开始时间');
    if (!positive(request.actualCreditMinutes)) errors.push('实际入账分钟必须为大于 0 的整数');
    if (!/^\d+(\.\d{1,2})?$/.test(String(request.priceText)) || !Number.isFinite(request.actualPrice) || request.actualPrice < 0 || Number(request.priceText) !== request.actualPrice) errors.push('套餐价格须不小于 0，最多两位小数');
    var deviated = request.actualPrice !== d.price || request.actualCreditMinutes !== d.creditMinutes || (!pack && (end - start) !== d.durationDays * DAY);
    if (deviated && !String(request.reason || '').trim()) errors.push('实际价格、区间跨度或分钟偏离默认值时，请填写原因');
    if (p) {
      var currentStatus = status(p.entitlement);
      if (pack) {
        if (currentStatus !== 'active') errors.push('话费充值包仅能在有效的商用服务期内购买');
        if (start < parse(p.entitlement.effectiveAt) || start >= parse(p.entitlement.expiresAt)) errors.push('话费包开始时间必须在租户当前服务区间内');
        if (end !== parse(p.entitlement.expiresAt)) errors.push('话费包结束时间必须跟随租户到期，不可独立修改');
      } else if (currentStatus === 'active' || currentStatus === 'pending') errors.push('当前服务有效或待生效，不可重复开通；请使用手工调整');
      else if (currentStatus === 'invalid') errors.push('租户服务时间异常，请核对账户');
      if (!Number.isSafeInteger(Number(p.unifiedMinutePool.availableMinutes) + request.actualCreditMinutes)) errors.push('分钟数超出可安全记录范围');
    }
    return { errors: errors, defaults: d, deviated: deviated, profile: p,
      effectiveAt: format(start), expiresAt: format(end),
      status: p && pack ? status(p.entitlement) : status({ effectiveAt: format(start), expiresAt: format(end) }),
      beforeValue: p ? p.unifiedMinutePool.availableMinutes : null,
      afterValue: p ? p.unifiedMinutePool.availableMinutes + request.actualCreditMinutes : null };
  }
  function transactions() { return data().operationResults || (data().operationResults = []); }
  function requestSignature(request) {
    var values = Object.assign({}, request); delete values.expectedVersion; delete values.businessKey;
    return JSON.stringify(values);
  }
  function transactionGuard(request, kind) {
    var a = auth(), p = profile(request.tenantId);
    if (!mayManage(request.tenantId) || !a.id || !a.username || request.actorId !== a.id) return { status: 'denied', errors: ['登录身份或操作权限已变化，请重新打开表单'] };
    if (!request.businessKey) return { status: 'invalid', errors: ['缺少本次业务标识'] };
    var records = transactions(), old = records.find(function (r) { return r.businessKey === request.businessKey; });
    if (old) {
      if (old.kind !== kind || old.actorId !== a.id || old.tenantId !== p.id || old.signature !== requestSignature(request)) return { status: 'invalid', errors: ['同次业务标识不能用于不同配置'] };
      return { status: old.unresolved ? 'unknown' : 'success', duplicate: true, record: old.unresolved ? null : old.record };
    }
    if (records.some(function (r) { return r.tenantId === p.id && r.actorId === a.id && r.unresolved; })) return { status: 'unknown', errors: ['该账户有结果待核对的操作，请先核对原流水'] };
    if (request.expectedVersion !== p.unifiedMinutePool.accountVersion) return { status: 'conflict', version: p.unifiedMinutePool.accountVersion, errors: ['账户版本已变化，请按最新账户重新预览确认'] };
    return null;
  }
  function finishTransaction(request, kind, record, unknown) {
    transactions().push({ businessKey: request.businessKey, kind: kind, actorId: request.actorId, tenantId: request.tenantId,
      signature: requestSignature(request), request: Object.assign({}, request), record: record, unresolved: !!unknown });
    return { status: unknown ? 'unknown' : 'success', record: unknown ? null : record };
  }
  function reconcile(key) {
    var r = transactions().find(function (item) { return item.businessKey === key; }), a = auth();
    if (r && (!mayManage(r.tenantId) || r.actorId !== a.id)) return { status: 'denied', errors: ['无权限核对该操作'] };
    if (data().demoStates && data().demoStates.lookupUnavailable) return { status: 'unknown', errors: ['暂时仍无法核对，请继续核对，不要重复提交'] };
    if (!r) return { status: 'not_found' };
    r.unresolved = false;
    return { status: 'success', record: r.record };
  }
  function outstanding(tenantId) { var a = auth(); return transactions().find(function (r) { return a && r.tenantId === tenantId && r.actorId === a.id && r.unresolved; }); }
  function commitRecharge(request) {
    var guard = transactionGuard(request, 'recharge'); if (guard) return guard;
    var v = previewRecharge(request); if (v.errors.length) return { status: 'invalid', errors: v.errors };
    var demo = data().demoStates || (data().demoStates = {});
    if (demo.failNextRecharge) { demo.failNextRecharge = false; return { status: 'failed', errors: ['写账失败，账户及成功流水均未发生变化；可按同次标识重试'] }; }
    var p = v.profile, oldPool = p.unifiedMinutePool, pool = Object.assign({}, oldPool, { availableMinutes: v.afterValue, accountVersion: businessKey('MP') });
    var entitlement = Object.assign({}, p.entitlement);
    if (request.productType !== 'call_credit_pack') {
      entitlement = { productType: request.productType, effectiveAt: v.effectiveAt, expiresAt: v.expiresAt,
        durationDays: (parse(v.expiresAt) - parse(v.effectiveAt)) / DAY, status: v.status };
    }
    var record = { internalNo: businessKey('RC' + format(now()).slice(0, 10).replace(/-/g, '')),
      businessKey: request.businessKey, tenantId: p.id, tenantName: p.name, productType: request.productType,
      productName: data().products[request.productType].name, quantity: request.quantity, price: request.actualPrice,
      defaultPrice: v.defaults.price, actualStartAt: v.effectiveAt, actualEndAt: v.expiresAt,
      actualCreditMinutes: request.actualCreditMinutes, beforeValue: v.beforeValue, afterValue: v.afterValue,
      beforeStartAt: p.entitlement.effectiveAt, beforeEndAt: p.entitlement.expiresAt, afterStartAt: entitlement.effectiveAt, afterEndAt: entitlement.expiresAt,
      valueUnit: '分钟', operatorUsername: auth().username, operatorAccountId: auth().id,
      operatedAt: format(now()), reason: request.reason || '使用默认值', status: 'effective', accountVersion: pool.accountVersion };
    // 所有检查在前；单一同步内存提交，不产生半笔账。
    data().rechargeRecords.unshift(record); p.entitlement = entitlement; p.unifiedMinutePool = pool;
    var unknown = !!demo.unknownNextRecharge; demo.unknownNextRecharge = false;
    return finishTransaction(request, 'recharge', record, unknown);
  }
  function previewAdjustment(request) {
    var p = profile(request.tenantId), errors = [], duration = request.target === 'duration_days';
    if (!p) return { errors: ['租户账户不存在'] };
    if (!['increase', 'decrease'].includes(request.direction)) errors.push('请选择调整方向');
    if (!['duration_days', 'available_minutes'].includes(request.target)) errors.push('请选择调整对象');
    if (!['amount', 'clear_duration'].includes(request.mode)) errors.push('请选择有效的调整方式');
    var clear = request.mode === 'clear_duration';
    var span = durationMinutes(p.entitlement);
    if (duration && (!Number.isSafeInteger(span) || span < 0)) errors.push('当前服务区间不可调整，请先核对或开通服务');
    if (clear && (!duration || request.direction !== 'decrease')) errors.push('全部调减至0仅用于使用时长调减');
    if (clear && !(span > 0)) errors.push('当前完整服务时长已为0，不可重复执行零量调整');
    if (!clear && !positive(request.value)) errors.push('调整值必须为大于 0 的整数（时长按天、余额按分钟）');
    if (!String(request.reason || '').trim()) errors.push('请填写调整原因');
    var before = duration ? span : Number(p.unifiedMinutePool.availableMinutes);
    var delta = clear ? span : Number(request.value) * (duration ? 1440 : 1);
    var after = request.direction === 'decrease' ? before - delta : before + delta;
    if (!Number.isSafeInteger(after) || after < 0) errors.push('调减不能超过当前值；不足一天请使用全部调减至0');
    var start = format(p.entitlement.effectiveAt), end = format(p.entitlement.expiresAt);
    var afterEnd = duration ? format(parse(start) + after * MINUTE) : end;
    if (duration && !minuteInput(afterEnd)) errors.push('调整后的结束时间超出可配置日期范围');
    return { errors: errors, profile: p, beforeValue: before, afterValue: after, deltaMinutes: delta,
      beforeStartAt: start, beforeEndAt: end, afterStartAt: start, afterEndAt: afterEnd,
      status: duration ? status({ effectiveAt: start, expiresAt: afterEnd }) : status(p.entitlement) };
  }
  function commitAdjustment(request) {
    var guard = transactionGuard(request, 'adjustment'); if (guard) return guard;
    var v = previewAdjustment(request); if (v.errors.length) return { status: 'invalid', errors: v.errors };
    var demo = data().demoStates || (data().demoStates = {});
    if (demo.failNextAdjustment) { demo.failNextAdjustment = false; return { status: 'failed', errors: ['调整写入失败，账户未变；可按同次标识重试'] }; }
    var p = v.profile, duration = request.target === 'duration_days', clear = request.mode === 'clear_duration';
    var pool = Object.assign({}, p.unifiedMinutePool, { accountVersion: businessKey('MP') });
    var entitlement = Object.assign({}, p.entitlement);
    if (duration) { entitlement.expiresAt = v.afterEndAt; entitlement.durationDays = v.afterValue / 1440; entitlement.status = v.status; }
    else pool.availableMinutes = v.afterValue;
    var record = { adjustmentNo: businessKey('ADJ' + format(now()).slice(0, 10).replace(/-/g, '')),
      businessKey: request.businessKey, tenantId: p.id, tenantName: p.name,
      direction: request.direction, target: request.target, mode: request.mode, value: clear ? v.deltaMinutes : request.value,
      valueUnit: duration && !clear ? '天' : '分钟', durationDeltaMinutes: duration ? v.deltaMinutes : null,
      beforeValue: v.beforeValue, afterValue: v.afterValue, beforeValueUnit: '分钟',
      beforeStartAt: v.beforeStartAt, beforeEndAt: v.beforeEndAt, afterStartAt: v.afterStartAt, afterEndAt: v.afterEndAt,
      reason: request.reason, operatorUsername: auth().username, operatorAccountId: auth().id, operatedAt: format(now()),
      accountVersion: pool.accountVersion, frozenMinutesBefore: pool.frozenMinutes, frozenMinutesAfter: pool.frozenMinutes, status: 'effective' };
    data().adjustmentRecords.unshift(record); p.entitlement = entitlement; p.unifiedMinutePool = pool;
    var unknown = !!demo.unknownNextAdjustment; demo.unknownNextAdjustment = false;
    return finishTransaction(request, 'adjustment', record, unknown);
  }
  window.RechargeService = {
    parse: parse, format: format, input: input, minuteInput: minuteInput, now: now, addDays: addDays,
    status: status, statusText: statusText, durationMinutes: durationMinutes, spanText: spanText,
    profile: profile, auth: auth, mayManage: mayManage, operatorText: operatorText,
    businessKey: businessKey, productsFor: productsFor, defaults: defaults,
    previewRecharge: previewRecharge, commitRecharge: commitRecharge, reconcile: reconcile, outstanding: outstanding,
    previewAdjustment: previewAdjustment, commitAdjustment: commitAdjustment
  };
})();
