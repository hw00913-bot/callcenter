/* AliCti number recognition only. Keep this dictionary aligned with mock/alicti-number-status.json. */
(function (root) {
  'use strict';
  const rows = [
    [710, '占线'], [711, '暂时无人接听'], [712, '拒接'], [713, '空号'], [714, '关机'],
    [715, '用户线故障'], [715, '暂时无法接通'], [715, '秘书台'], [716, '停机'],
    [717, '呼叫受限'], [718, '无人接听'], [719, '正在通话中'], [720, '暂停服务'],
    [721, '来电提醒'], [722, '不再使用'], [723, '来电助手'], [724, '号码格式不正确'],
    [183, '嘟嘟'], [183, '静音'], [183, '未知']
  ].map(row => Object.freeze(row));
  const descriptions = new Map();
  rows.forEach(([code, description]) => descriptions.set(String(code), [...(descriptions.get(String(code)) || []), description]));
  const sourceUrl = 'https://wiki.alicti.cn/html/wiki/API/字段定义/接口部分/号码状态识别编码.html';
  const text = value => value === undefined || value === null ? '' : String(value).trim();
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const supplied = value => value !== undefined && value !== null && value !== '';

  function resolve(rawCode, rawDescription) {
    const code = text(rawCode), originalDescription = text(rawDescription);
    const candidates = descriptions.get(code) || [];
    const exact = candidates.includes(originalDescription);
    const known = candidates.length > 0;
    const ambiguous = candidates.length > 1 && !exact;
    const description = exact ? originalDescription : candidates.join(' / ');
    const status = !code ? 'missing' : !known ? 'unknown' : ambiguous ? 'ambiguous' : 'recognized';
    const label = !code ? '待确认' : !known ? code + ' · 待确认' : code + ' · ' + description + (ambiguous ? '（待确认）' : '');
    const help = !code ? '未返回号码状态识别编码，保留原始资料等待核对。' : !known ? '此编码未列入号码状态识别编码表，保留原值等待核对。' : ambiguous ? '官方同一编码对应多条描述，尚不能确定具体一项。' : '名称直接采用 AliCti 号码状态识别编码表。';
    return { code, description, rawCode, rawDescription: originalDescription, candidates: candidates.slice(), known, ambiguous, status, label, help, sourceUrl };
  }

  function fromCdr(kind, cdr) {
    cdr = object(cdr) ? cdr : {};
    const manual = kind === 'manual', predictive = kind === 'predictive';
    // Inbound recognition is supplementary (usually for a seat's bound mobile).
    // This project uses softphones. No inbound recognition field mapping is
    // confirmed, and its absence is not a pending answer or a data anomaly.
    if (kind === 'inbound') return { ...resolve(), kind, endpoint: '/cc/list_cdr_ib', codeField: '', descriptionField: '', raw: cdr, status: 'supplementary-unavailable', label: '—', help: '当前使用软电话，呼入接听情况以接听状态为准；号码识别仅作补充。', asyncUpdateMode: 'not-applicable', asyncUpdateLabel: '' };
    if (!manual && !predictive) return { ...resolve(), kind: text(kind), endpoint: '', codeField: '', descriptionField: '', raw: cdr, asyncUpdateMode: 'not-applicable', asyncUpdateLabel: '' };
    const codeField = manual ? 'sipCauseCode' : 'sipCause', descriptionField = manual ? 'obSipCauseRaw' : 'obSipCause';
    const result = resolve(cdr[codeField], cdr[descriptionField]);
    if (manual && result.code === '183' && result.ambiguous) {
      result.label = '183 · 待确认';
      result.help = '话单仅提供 SIP 183；尚不能确定为嘟嘟、静音或未知中的哪一项。';
    }
    // D-053: this is a predictive CDR write-back indicator, never a call state,
    // pending flag, recognition-success guarantee, or local retry trigger.
    const asyncUpdateFlag = predictive ? cdr.sipCauseAsyncUpdateFlag : undefined;
    const asyncUpdateMode = !predictive ? 'not-applicable' : asyncUpdateFlag === 0 || asyncUpdateFlag === '0' ? 'synchronous' : asyncUpdateFlag === 1 || asyncUpdateFlag === '1' ? 'asynchronously_written_back_to_sipCause' : !supplied(asyncUpdateFlag) ? 'unreported' : 'unknown';
    const asyncUpdateLabel = { synchronous: '同步识别', asynchronously_written_back_to_sipCause: '已异步写回', unknown: '标识待确认' }[asyncUpdateMode] || '';
    return { ...result, kind, codeField, descriptionField, endpoint: manual ? '/cc/list_cdr_ob' : '/cc/list_cdr_predictive_call', raw: cdr, asyncUpdateFlag, asyncUpdateMode, asyncUpdateLabel };
  }

  function read(record) {
    const source = record?.alictiCdr;
    const result = source ? fromCdr(source.kind, source.raw) : record?.callType === '呼入' ? fromCdr('inbound') : resolve();
    const issues = [];
    if (source) {
      if (!object(source.raw)) issues.push('话单原始响应不可用');
      const raw = object(source.raw) ? source.raw : {};
      const expectedKind = { '人工外呼': 'manual', '预外呼': 'predictive', 'IVR 外呼': 'automatic', '自动外呼': 'automatic', '呼入': 'inbound' }[record.callType];
      if (expectedKind && source.kind !== expectedKind) issues.push('话单接口与通话类型不匹配');
      const expectedEnterprise = record.providerEnterpriseId ?? record.enterpriseId;
      if (supplied(raw.enterpriseId) && (!supplied(expectedEnterprise) || String(raw.enterpriseId) !== String(expectedEnterprise))) issues.push('供应商账号不匹配');
      // Local callId/contactId (including CallState's fallback session key) and
      // provider identifiers are different namespaces. Compare explicit links.
      const links = [
        ['mainUniqueId', record.providerMainUniqueId ?? record.mainUniqueId],
        ['requestUniqueId', record.requestUniqueId],
        ['callId', record.providerCallId ?? record.alictiCallId],
        ['uniqueId', record.providerUniqueId ?? record.uniqueId]
      ];
      links.forEach(([key, expected]) => {
        if (supplied(raw[key]) && supplied(expected) && (typeof raw[key] !== 'string' || typeof expected !== 'string' || raw[key] !== expected)) issues.push('通话标识不匹配：' + key);
      });
    }
    if (issues.length) return { ...resolve(), kind: text(source?.kind), raw: source?.raw, endpoint: result.endpoint, codeField: result.codeField, descriptionField: result.descriptionField, status: 'context-mismatch', help: '话单与当前通话不匹配，未采用号码识别结果。', asyncUpdateMode: 'not-applicable', asyncUpdateLabel: '', issues, mock: source?.mock === true };
    return { ...result, issues, mock: source?.mock === true };
  }

  // Explicit local examples only; callers supply an official code, never derive one from stored result text.
  function demoCdr(kind, code, description) {
    if (!['manual', 'predictive'].includes(kind)) return null;
    return { kind, raw: kind === 'manual' ? { sipCauseCode: code, obSipCauseRaw: description || '' } : { sipCause: code, obSipCause: description || '' }, mock: true };
  }

  root.AliCtiNumberStatus = Object.freeze({ rows: Object.freeze(rows), sourceUrl, resolve, fromCdr, read, demoCdr });
})(typeof window === 'undefined' ? globalThis : window);
