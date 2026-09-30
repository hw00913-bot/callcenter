/* AliCti task retry contract. Local configuration and mapping only; no requests or timers. */
(function (root) {
  'use strict';
  const modes = ['unset', 'advanced'];
  const isAutomatic = type => ['IVR 外呼', '自动外呼'].includes(type);
  const numberCodes = Object.freeze(Array.from(new Set(root.AliCtiNumberStatus.rows.map(row => Number(row[0])))).map(code => Object.freeze({
    code, label: root.AliCtiNumberStatus.rows.filter(row => Number(row[0]) === code).map(row => row[1]).join(' / ')
  })));
  const whole = value => typeof value !== 'boolean' && /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value));
  function create(type) {
    return {version: 1, mode: 'unset', timeType: 1, codes: [], rounds: [{days: 0, hours: 0, minutes: 10}]};
  }
  function minutes(round) { return Number(round.days) * 1440 + Number(round.hours) * 60 + Number(round.minutes); }
  function fromMinutes(total) { return {days: Math.floor(total / 1440), hours: Math.floor(total % 1440 / 60), minutes: total % 60}; }
  function validate(policy, type) {
    if (!policy || policy.version !== 1 || !modes.includes(policy.mode)) return '请重新设置重呼安排';
    if (policy.mode === 'unset') return '';
    if (![1, 2].includes(policy.timeType)) return '请选择重呼间隔的起算方式';
    if (!Array.isArray(policy.rounds) || !policy.rounds.length) return '请至少配置一轮重呼';
    {
      if (!Array.isArray(policy.codes) || !policy.codes.length) return '请至少选择一个需要重呼的呼叫状态。';
      if (policy.codes.some(code => !numberCodes.some(item => item.code === code)) || new Set(policy.codes).size !== policy.codes.length) return '号码状态须使用官方编码，且不能重复';
    }
    let previous = 0;
    for (let index = 0; index < policy.rounds.length; index++) {
      const round = policy.rounds[index], title = `第 ${index + 1} 轮`;
      if (!round || !['days', 'hours', 'minutes'].every(key => whole(round[key])) || Number(round.hours) > 23 || Number(round.minutes) > 59) return `${title}请按天、小时（0–23）、分钟（0–59）填写非负整数`;
      const total = minutes(round);
      if (!Number.isSafeInteger(total) || total <= 0) return `${title}请填写大于 0 的有效等待时间`;
      if (policy.timeType === 1 && total <= previous) return `${title}须晚于上一轮：从首次呼叫起算时，每轮时间必须递增`;
      previous = total;
    }
    return '';
  }
  function map(policy, type) {
    const error = validate(policy, type);
    if (error) return {fields: {}, pending: [error]};
    if (policy.mode === 'unset') return {fields: {}, pending: []};
    const strategy = policy.rounds.map((round, index) => ({round: index + 1, time: `${Number(round.days)}-${Number(round.hours)}-${Number(round.minutes)}`}));
    // D-020: supplier confirmed conditional retry for predictive and automatic tasks.
    // Submit one selected-status group. Scheduling, matching and counters belong to AliCti.
    const payload = [{condition: {sipCause: [...policy.codes]}, retry: strategy.length, sort: 1, strategy}];
    return {
      fields: {retryStrategy: JSON.stringify(payload), retryStrategyTimeType: policy.timeType},
      pending: [], prerequisites: ['实际接入前需开通号码状态识别服务；演示不验证开通']
    };
  }
  function codeLabel(code) { return numberCodes.find(item => item.code === code)?.label || '待确认'; }
  function summary(policy, type) {
    if (!policy) return '尚未设置重呼';
    const error = validate(policy, type);
    if (error) return error;
    if (policy.mode === 'unset') return '重呼开关已关闭';
    const condition = '呼叫状态：' + policy.codes.map(code => `${code} ${codeLabel(code)}`).join('、');
    const timing = policy.rounds.map((round, index) => `第 ${index + 1} 轮 ${Number(round.days)} 天 ${Number(round.hours)} 小时 ${Number(round.minutes)} 分钟`).join('；');
    return `${condition}；最多重呼 ${policy.rounds.length} 次（不含首次）；从${policy.timeType === 1 ? '首次' : '上次'}呼叫起算；${timing}；实际接入前需开通号码状态识别`;
  }
  function duration(round) {
    return [[round.days,'天'],[round.hours,'小时'],[round.minutes,'分钟']].filter(([value])=>Number(value)>0).map(([value,unit])=>Number(value)+' '+unit).join(' ') || '0 分钟';
  }
  function render(policy,type,editor) { return root.AliCtiRetryEditor.render(policy,type,editor); }
  root.AliCtiRetry = Object.freeze({create, validate, map, summary, render, duration, numberCodes, minutes, fromMinutes, isAutomatic});
})(typeof window === 'undefined' ? globalThis : window);
