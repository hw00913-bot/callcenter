/* Pure request/response contracts for AliCti queue configuration.
 * Sources: official 配置管理/队列管理 pages, checked 2026-09-18.
 * No authentication, network calls, tenant allocation or member-selection logic.
 */
(function (global) {
  'use strict';

  const strategies = Object.freeze({
    rrordered: '技能优先', rrmemory: '轮选', fewestcalls: '平均',
    random: '随机', linear: '顺序', leastrecent: '最长空闲时间'
  });
  // Only the values identified as "official" below are documented defaults.
  // All other defaults are this prototype's explicit configuration choices.
  const defaults = Object.freeze({
    musicClass: 'default', queueTimeout: 600, sayAgentno: false,
    memberTimeout: 25, retry: 5, wrapupTime: 30, maxLen: 0,
    strategy: 'leastrecent', serviceLevel: 10, weight: 1, vipSupport: 0,
    joinEmpty: 0, announceSound: 0, announcePosition: 0,
    announcePositionFrequency: 0
  });
  const defaultSources = Object.freeze(Object.keys(defaults).reduce(function (result, key) {
    result[key] = ['queueTimeout', 'memberTimeout'].includes(key) ? 'official' : 'local';
    return result;
  }, {}));
  const endpoints = Object.freeze({
    create: '/interface/v10/queue/create', update: '/interface/v10/queue/update',
    list: '/interface/v10/queue/list', get: '/interface/v10/queue/get',
    skills: '/interface/v10/queueSkill/list', members: '/interface/v10/agent/query'
  });
  const integerRules = Object.freeze({
    queueTimeout: [20, 600], memberTimeout: [20, 60], retry: [0, null],
    wrapupTime: [3, 3600], maxLen: [0, 999], serviceLevel: [0, null], weight: [1, 10],
    vipSupport: [0, 1], joinEmpty: [0, 31], announceSound: [0, 1],
    announceSoundFrequency: [0, null], announcePosition: [0, 2],
    announcePositionFrequency: [0, null], announcePositionYouarenext: [0, 1],
    announcePositionParam: [2, null], maxPauseAgentFlag: [0, 1],
    maxPauseAgentType: [0, 1], maxPauseAgentValue: [0, null]
  });
  const labels = Object.freeze({
    qno: '队列编号', description: '队列名称', musicClass: '等待语音',
    queueTimeout: '最长排队时间', memberTimeout: '坐席应答时间', retry: '呼叫下一坐席的间隔',
    wrapupTime: '话后整理时间', maxLen: '最大等待人数', strategy: '坐席分配方式',
    serviceLevel: '服务水平时间', weight: '队列优先级', vipSupport: 'VIP 支持',
    joinEmpty: '允许排队的坐席状态', announceSound: '固定语音播报',
    announceSoundFrequency: '固定语音播报周期', announceSoundFile: '固定语音文件',
    announcePosition: '排队位置播报', announcePositionFrequency: '位置播报周期',
    announcePositionYouarenext: '下一位提示', announcePositionParam: '位置播报人数',
    maxPauseAgentFlag: '并发置忙限制', maxPauseAgentType: '并发置忙限制方式',
    maxPauseAgentValue: '并发置忙限制值', sayAgentno: '坐席工号播报'
  });
  const queueFields = new Set(['qno', 'description', 'musicClass', 'strategy', 'sayAgentno',
    'announceSoundFile', 'createTime'].concat(Object.keys(integerRules)));
  const requiredCreateFields = Object.freeze(['qno', 'description'].concat(Object.keys(defaults)));
  const has = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const clone = value => JSON.parse(JSON.stringify(value));
  const output = (fields, errors) => ({ ok: errors.length === 0, fields: errors.length ? null : fields, errors });

  function integer(value) {
    if (typeof value === 'number') return Number.isSafeInteger(value) ? value : null;
    if (typeof value === 'string' && /^[+-]?\d+$/.test(value.trim())) {
      const converted = Number(value.trim());
      return Number.isSafeInteger(converted) ? converted : null;
    }
    return null;
  }

  function string(value, field, errors, allowEmpty) {
    if (typeof value !== 'string' || (!allowEmpty && !value.trim())) {
      errors.push((labels[field] || field) + '须填写非空文本');
      return null;
    }
    return value.trim();
  }

  function queueValue(key, value, errors) {
    const label = labels[key] || key;
    if (has(integerRules, key)) {
      const range = integerRules[key], number = integer(value);
      if (number === null || number < range[0] || (range[1] !== null && number > range[1])) {
        errors.push(label + '须为' + (range[1] === null ? '不小于 ' + range[0] : range[0] + '～' + range[1]) + '的整数');
        return null;
      }
      return number;
    }
    if (key === 'strategy') {
      if (typeof value !== 'string' || !has(strategies, value)) {
        errors.push('请选择接口支持的坐席分配方式');
        return null;
      }
      return value;
    }
    if (key === 'sayAgentno') {
      if (value === true || value === false) return value;
      if (value === 'true' || value === 'false') return value === 'true';
      errors.push('坐席工号播报须为布尔值');
      return null;
    }
    return string(value, key, errors, key === 'announceSoundFile');
  }

  function prepareQueue(input, creation, qno, errors) {
    if (!object(input)) { errors.push('队列配置须为对象'); return {}; }
    const supplied = {};
    Object.keys(input).forEach(function (key) {
      if (key !== 'name' && !queueFields.has(key)) {
        errors.push('不支持的队列配置字段：' + key);
        return;
      }
      supplied[key === 'name' ? 'description' : key] = input[key];
    });
    if (has(input, 'name') && has(input, 'description') && input.name !== input.description) {
      errors.push('队列名称存在两种不同的配置');
    }
    if (!creation) {
      if (has(supplied, 'qno') && supplied.qno !== qno) errors.push('不能通过更新修改队列编号');
      supplied.qno = qno;
    }
    const values = creation ? Object.assign({}, defaults, supplied) : supplied;
    const queue = {};
    if (creation) requiredCreateFields.forEach(function (key) {
      if (!has(values, key)) errors.push('缺少队列配置：' + (labels[key] || key));
    });
    Object.keys(values).forEach(function (key) { queue[key] = queueValue(key, values[key], errors); });
    if (creation && queue.announceSound === 1) {
      if (!has(values, 'announceSoundFrequency')) errors.push('开启固定语音后须配置播报周期');
      if (!has(values, 'announceSoundFile') || typeof queue.announceSoundFile !== 'string' || !queue.announceSoundFile) errors.push('开启固定语音后须选择语音文件');
    }
    // For updates, inspect only values supplied by the caller. No omitted field
    // is manufactured or used to reset an existing supplier-side configuration.
    if (queue.maxPauseAgentFlag === 1 && queue.maxPauseAgentType === 0 &&
        has(queue, 'maxPauseAgentValue') && (queue.maxPauseAgentValue < 1 || queue.maxPauseAgentValue > 100)) {
      errors.push('并发置忙比例须为 1～100 的整数');
    }
    return queue;
  }

  function skills(input, errors) {
    if (!Array.isArray(input)) { errors.push('须提供队列技能数组'); return []; }
    const seen = new Set();
    return input.map(function (row, index) {
      if (!object(row) || !has(row, 'skillId') || !has(row, 'skillLevel') ||
          integer(row.skillId) === null || integer(row.skillLevel) === null) {
        errors.push('第 ' + (index + 1) + ' 项队列技能须包含整数 skillId 和 skillLevel');
        return null;
      }
      const identity = String(integer(row.skillId));
      if (seen.has(identity)) errors.push('队列技能不能重复：' + identity);
      seen.add(identity);
      // Preserve the documented values and their original string/number types.
      // Do not infer skill thresholds, ranking or a derived agent list.
      return { skillId: row.skillId, skillLevel: row.skillLevel };
    });
  }

  function createFields(input, queueSkills) {
    const errors = [], queue = prepareQueue(input, true, null, errors);
    const related = skills(queueSkills, errors);
    return output({ queue, queueSkills: related }, errors);
  }

  function updateFields(qno, changes) {
    const errors = [], queue = prepareQueue(changes, false, qno, errors);
    if (Object.keys(queue).filter(key => key !== 'qno').length === 0) errors.push('没有需要修改的队列配置');
    return output({ queue }, errors);
  }

  function listFields(input) {
    input = input === undefined ? {} : input;
    const errors = [], fields = {};
    if (!object(input)) return output(null, ['查询条件须为对象']);
    const allowed = new Set(['limit', 'offset', 'qno', 'description', 'order', 'startTime', 'endTime']);
    Object.keys(input).forEach(key => { if (!allowed.has(key)) errors.push('不支持的队列查询字段：' + key); });
    [['limit', 500, 1, 500], ['offset', 0, 0, null]].forEach(function (rule) {
      const key = rule[0], value = has(input, key) ? integer(input[key]) : rule[1];
      if (value === null || value < rule[2] || (rule[3] !== null && value > rule[3])) errors.push('队列查询 ' + key + ' 超出允许范围');
      else fields[key] = value;
    });
    if (has(input, 'order')) {
      const order = integer(input.order);
      if (order !== 0 && order !== 1) errors.push('队列排序只支持 0 或 1');
      else fields.order = order;
    }
    ['qno', 'description', 'startTime', 'endTime'].forEach(function (key) {
      if (has(input, key)) fields[key] = string(input[key], key, errors, false);
    });
    return output(fields, errors);
  }

  function getFields(qno) {
    const errors = [], value = string(qno, 'qno', errors, false);
    return output({ qno: value }, errors);
  }

  function responseData(response, errors) {
    if (!object(response)) { errors.push('队列接口响应格式不正确'); return null; }
    if (response.result !== 0 && response.result !== '0') {
      errors.push(typeof response.description === 'string' && response.description ? response.description : '队列接口未返回成功结果');
      return null;
    }
    if (!object(response.data)) { errors.push('队列接口缺少 data 对象'); return null; }
    return response.data;
  }

  function validateResponseQueue(row, errors, label) {
    if (!object(row)) { errors.push(label + '缺少队列对象'); return; }
    string(row.qno, 'qno', errors, false);
    Object.keys(row).forEach(function (key) {
      // AliCti's list/get examples return 0 for an inactive announcement's
      // threshold; create/update use >= 2 when configuring this threshold.
      if (key === 'announcePositionParam' && integer(row[key]) === 0 && integer(row.announcePosition) === 0) return;
      if (queueFields.has(key) && key !== 'qno') queueValue(key, row[key], errors);
    });
  }

  function parseListResponse(response) {
    const errors = [], data = responseData(response, errors);
    if (data && !Array.isArray(data.list)) errors.push('队列列表须位于 data.list');
    const rows = data && Array.isArray(data.list) ? data.list : [];
    rows.forEach((row, index) => validateResponseQueue(row, errors, '第 ' + (index + 1) + ' 项'));
    const total = data ? integer(data.total) : null;
    if (data && (total === null || total < rows.length)) errors.push('队列列表总数不正确');
    return { ok: errors.length === 0, rows: errors.length ? [] : clone(rows), total: errors.length ? 0 : total, errors };
  }

  function parseGetResponse(response) {
    const errors = [], data = responseData(response, errors);
    if (data) validateResponseQueue(data.queue, errors, '详情');
    if (data) skills(data.queueSkills, errors);
    return { ok: errors.length === 0, queue: errors.length ? null : clone(data.queue),
      queueSkills: errors.length ? [] : clone(data.queueSkills), errors };
  }

  global.AliCtiQueueContracts = Object.freeze({
    strategies, defaults, defaultSources, endpoints, requiredCreateFields,
    createFields, updateFields, listFields, getFields, parseListResponse, parseGetResponse
  });
})(window);
