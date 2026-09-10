/**
 * js/pages/result-records.js — 通话记录
 * 以中科金接入 demo 为底座，整合大众通信回调落库 + callid 查询详情链路（六平台整合版）。
 */
(function () {
  'use strict';

  var sourceRows = window.MockCallRecordRows || [];
  var rows = sourceRows.filter(function (item) {
    return item.platform !== '大众通信' || Boolean(item.callid);
  });
  var dazhongDetails = window.MockDazhongCallDetailByRecordId || {};
  var sortField = null;   // 'startTime' | 'endTime'
  var sortOrder = 'asc';  // 'asc' | 'desc'
  var audioTimer = null;
  var DccStatusList = [
    '已接通', '秒挂', '伪接通', '无人接听', '占线', '拒接', '空号', '关机', '停机', '欠费',
    '无法接通', '黑名单过滤', '拦截规则', '等待呼叫', '待呼叫去重', '分机号错误',
    '呼叫受限', '主叫欠费', '呼损客户', '外呼失败', '转人工呼损', '线路拦截',
    '等待重呼', '号码故障', '线路故障'
  ];

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function maskPhone(value) {
    var phone = String(value === undefined || value === null ? '' : value);
    return /^1\d{10}$/.test(phone) ? phone.slice(0, 3) + '****' + phone.slice(-4) : phone;
  }

  function syncScope() {
    sourceRows = window.MockCallRecordRows || [];
    var access = window.AppState && window.AppState.effectiveAccess ? window.AppState.effectiveAccess() : { tenantIds: [] };
    var tenantIds = access.tenantIds || [];
    rows = sourceRows.filter(function (item) {
      return tenantIds.indexOf(item.tenantId) >= 0 && (item.platform !== '大众通信' || Boolean(item.callid));
    });
  }

  function cleanTranscriptText(value) {
    return String(value || '')
      .replace(/<break\b[^>]*\/?\s*>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* ===== 大众通信原始状态 0-12 → DCC 统一通话状态 ===== */
  var DazhongStatusLabels = {
    0: '等待呼叫',
    1: '已接通',
    2: '线路拦截',
    3: '拒接',
    4: '无人接听',
    5: '空号',
    6: '关机',
    7: '停机',
    8: '占线',
    9: '呼叫受限',
    10: '欠费',
    11: '黑名单过滤',
    12: '黑名单过滤'
  };

  function formatDazhongCallStatus(code) {
    if (code === undefined || code === null || code === '') return '-';
    var key = String(code);
    if (Object.prototype.hasOwnProperty.call(DazhongStatusLabels, key)) {
      return DazhongStatusLabels[key];
    }
    return '未映射';
  }

  /* ===== 厚朴 rawStatusCode 770-790 完整本地映射 → DCC 通话状态 ===== */
  var HoupoRawStatusMap = {
    770: '关机',
    771: '停机',
    772: '无法接通',
    773: '占线',
    774: '空号',
    775: '无人接听',
    776: '无人接听',
    777: '呼叫受限',
    778: '无法接通',
    779: '呼叫受限',
    780: '占线',
    781: '拒接',
    782: '无法接通',
    783: '伪接通',
    784: '伪接通',
    785: '已接通',
    786: '伪接通',
    787: '无人接听',
    788: '无人接听',
    789: '无人接听',
    790: '无人接听'
  };

  /* 记录 → 中文：厚朴优先映射 rawStatusCode，大众走枚举转换，其余平台 status 本身即中文 */
  function resolveStatus(item) {
    if (item.platform === '厚朴' && item.rawStatusCode !== undefined && item.rawStatusCode !== null && item.rawStatusCode !== '') {
      var houpoKey = String(item.rawStatusCode);
      if (Object.prototype.hasOwnProperty.call(HoupoRawStatusMap, houpoKey)) {
        return HoupoRawStatusMap[houpoKey];
      }
      return '未映射';
    }
    if (item.platform === '大众通信' && item.status !== undefined && item.status !== null && item.status !== '') {
      return formatDazhongCallStatus(item.status);
    }
    if (item.status === undefined || item.status === null || item.status === '') return '-';
    return DccStatusList.indexOf(item.status) >= 0 ? item.status : '未映射';
  }

  /* ===== 大众详情：records → 对话文本 ===== */
  function extractDazhongDialogRows(records) {
    var list = Array.isArray(records) ? records.slice() : [];
    var keptProgress = {};
    return list.filter(function (record, index) {
      if (record.notify !== 'asrprogress_notify') return true;
      var key = String(record.question_index === undefined ? index : record.question_index);
      var hasFinal = list.slice(index + 1).some(function (next) {
        return next.question_index === record.question_index && next.notify === 'asrmessage_notify';
      });
      if (hasFinal || keptProgress[key]) return false;
      keptProgress[key] = true;
      return true;
    }).sort(function (a, b) {
      return Number(a.sequence || 0) - Number(b.sequence || 0);
    }).reduce(function (dialogRows, record) {
      var question = cleanTranscriptText(record.question);
      var answer = cleanTranscriptText(record.answer_content);
      if (question) dialogRows.push({ role: '客户', text: question, sequence: record.sequence });
      if (answer) dialogRows.push({ role: record.bridge_status ? '人工客服' : 'AI客服', text: answer, sequence: record.sequence });
      return dialogRows;
    }, []);
  }

  /* ===== 大众详情：componet → 通话总结 / 通话标签 ===== */
  function flattenComponentValues(input, output) {
    if (input === undefined || input === null) return output;
    if (Array.isArray(input)) {
      input.forEach(function (item) { flattenComponentValues(item, output); });
      return output;
    }
    if (typeof input !== 'object') return output;
    output.push(input);
    ['children', 'fields', 'items', 'values', 'components', 'component', 'componet'].forEach(function (key) {
      flattenComponentValues(input[key], output);
    });
    return output;
  }

  function getComponentText(component) {
    return ['value', 'text', 'content', 'result', 'answer', 'fieldValue'].map(function (key) {
      return cleanTranscriptText(component[key]);
    }).filter(function (value) { return Boolean(value); })[0] || '';
  }

  function getComponentLabelText(component) {
    return [component.name, component.title, component.label, component.key, component.field, component.fieldName, component.code]
      .map(function (value) { return String(value || '').toLowerCase(); })
      .join(' ');
  }

  function getComponentDisplayName(component) {
    return [component.name, component.title, component.label, component.fieldName, component.field, component.key, component.code].map(function (value) {
      return cleanTranscriptText(value);
    }).filter(function (value) { return Boolean(value); })[0] || '';
  }

  function isSummaryComponent(component) {
    return /通话总结|外呼总结|总结|summary|call_summary/.test(getComponentLabelText(component));
  }

  function extractDazhongComponentSummary(detail) {
    var roots = [detail.componet, detail.component, detail.components, detail.customFields, detail.custom_fields];
    var components = flattenComponentValues(roots, []);
    return components.map(function (component) {
      if (!isSummaryComponent(component)) return '';
      return getComponentText(component);
    }).filter(function (value) { return Boolean(value); })[0] || '';
  }

  function extractDazhongComponentTagNames(detail) {
    var roots = [detail.componet, detail.component, detail.components, detail.customFields, detail.custom_fields];
    var components = flattenComponentValues(roots, []);
    var seen = {};
    return components.reduce(function (names, component) {
      var name = getComponentDisplayName(component);
      if (!name || isSummaryComponent(component) || !getComponentText(component) || seen[name]) return names;
      seen[name] = true;
      names.push(name);
      return names;
    }, []);
  }

  /* ===== 筛选 + 排序 ===== */
  function getFilteredRows() {
    var page = document.querySelector('.result-records-page');
    if (!page) return rows;

    var phoneInput = document.getElementById('recordPhone');
    var sceneInput = document.getElementById('recordScene');
    var phoneVal = phoneInput ? phoneInput.value.trim() : '';
    var sceneVal = sceneInput ? sceneInput.value.trim() : '';

    var selects = page.querySelectorAll('.filter-select, .record-select');
    var statusVal = selects[0] ? selects[0].value : '';
    var platformVal = selects[1] ? selects[1].value : '';

    var list = rows.filter(function (item) {
      if (platformVal && item.platform !== platformVal) return false;
      if (phoneVal && (item.phone || '').indexOf(phoneVal) === -1) return false;
      if (sceneVal && (item.sceneName || '').indexOf(sceneVal) === -1) return false;
      if (statusVal && resolveStatus(item) !== statusVal) return false;
      return true;
    });

    if (!sortField) return list;
    list.sort(function (a, b) {
      var va = a[sortField] || '';
      var vb = b[sortField] || '';
      if (sortOrder === 'asc') return va.localeCompare(vb);
      return vb.localeCompare(va);
    });
    return list;
  }

  /* ===== 列表 ===== */
  function renderRow(item, index, realIndex) {
    var durationText = item.duration && item.duration !== '-' ? item.duration : '-';
    var summaryHtml = item.summary ? escapeHtml(item.summary) : '';
    return '<tr>' +
      '<td>' + (index + 1) + '</td>' +
      '<td>' + escapeHtml(maskPhone(item.phone)) + '</td>' +
      '<td>' + item.startTime + '</td>' +
      '<td>' + item.endTime + '</td>' +
      '<td>' + durationText + '</td>' +
      '<td>' + item.sceneName + '</td>' +
      '<td>' + resolveStatus(item) + '</td>' +
      '<td class="record-summary-col" title="' + summaryHtml + '">' + summaryHtml + '</td>' +
      '<td class="record-action-cell"><a href="#" class="record-detail-link" onclick="event.preventDefault();window.Pages[\'result-records\'].showDetail(' + realIndex + ')">详情</a></td>' +
      '</tr>';
  }

  function renderRows() {
    var list = getFilteredRows();
    if (!list.length) {
      return '<tr><td colspan="9"><div class="report-empty"><div class="report-empty-icon">&#128230;</div><div>暂无数据</div></div></td></tr>';
    }
    return list.map(function (item, index) {
      return renderRow(item, index, rows.indexOf(item));
    }).join('');
  }

  /* ===== 展开/收起高级筛选 ===== */
  var isExpanded = false;
  function toggleExpand(e) {
    if (e && e.preventDefault) e.preventDefault();
    isExpanded = !isExpanded;
    var extraRow = document.getElementById('recordExtraFilterRow');
    var expandLink = document.getElementById('recordExpandLink');
    if (extraRow) extraRow.style.display = isExpanded ? 'flex' : 'none';
    if (expandLink) {
      expandLink.innerHTML = isExpanded ? '收起 <span class="arrow" style="font-size:10px;">▲</span>' : '展开 <span class="arrow" style="font-size:10px;">▼</span>';
    }
  }

  /* ===== 详情：对话文本 ===== */
  function getDefaultDialogRows() {
    return [
      { role: '客服', text: '您好~' },
      { role: '客户', text: '用户无应答' },
      { role: '客服', text: '喂，尊敬的客户您好，我是东风日产厂家客服，看您之前有关注过日产的车，想问您最近还考虑买车吗？' },
      { role: '客户', text: '忙着呢，什么事啊，我知道了，你那有这打电话这个' },
      { role: '客户', text: '哦，我我你能不能联系我了，我知道了，我我现在开着车忙呢，不方便接听啊' },
      { role: '客服', text: '好的，您先忙，稍后安排4S销售顾问联系您，有需要的可以再了解下，感谢您的接听，再见！' }
    ];
  }

  function renderDialogRows(dialogRows) {
    if (!dialogRows || !dialogRows.length) {
      return '<div class="record-detail-empty" style="padding:20px;border:1px dashed #d9d9d9;border-radius:8px;color:#8c8c8c;background:#fafafa;text-align:center;line-height:1.6;">本次通话未生成对话文本</div>';
    }
    return dialogRows.map(function (row) {
      return '<div class="record-detail-talk-row"><div class="record-detail-speaker">' + escapeHtml(row.role) + '</div><div class="record-detail-bubble">' + escapeHtml(row.text) + '</div></div>';
    }).join('');
  }

  /* ===== 详情上下文：大众走 callid 查询，其余平台静态展示 ===== */
  function resolveDetailContext(item) {
    if (item.platform !== '大众通信') {
      return { item: item, isDazhong: false, state: 'legacy', dialogRows: getDefaultDialogRows(), recordingAvailable: true, recordingDuration: '0:23' };
    }
    var callid = item.callid || '';
    if (!callid) return null;
    var detail = dazhongDetails[callid];
    if (!detail) {
      return { item: item, isDazhong: true, state: 'not-found', callid: callid, recordid: callid, dialogRows: [], recordingAvailable: false };
    }
    var componentSummary = extractDazhongComponentSummary(detail);
    var componentTagNames = extractDazhongComponentTagNames(detail);
    var bailianSummary = cleanTranscriptText(item.bailianSummary || detail.bailianSummary);
    var bailianTagName = cleanTranscriptText(item.bailianTagName || detail.bailianTagName || item.aiTagName);
    var dazhongTagName = cleanTranscriptText(item.dazhongTagName || detail.dazhongTagName || item.aiTagName);
    var merged = {};
    var key;
    for (key in item) { if (Object.prototype.hasOwnProperty.call(item, key)) merged[key] = item[key]; }
    for (key in detail) { if (Object.prototype.hasOwnProperty.call(detail, key)) merged[key] = detail[key]; }
    merged.summary = componentSummary || bailianSummary || '-';
    merged.bailianSummary = bailianSummary;
    merged.bailianTagName = bailianTagName;
    merged.dazhongTagName = dazhongTagName;
    merged.aiTagName = bailianTagName || item.aiTagName || detail.aiTagName || '-';
    return {
      item: merged,
      isDazhong: true,
      state: 'fetched',
      callid: callid,
      recordid: detail.recordid,
      componentSummary: componentSummary,
      componentTagNames: componentTagNames,
      dialogRows: extractDazhongDialogRows(detail.records),
      recordingUrl: item.recordingUrl || '',
      recordingAvailable: Boolean(item.recordingUrl),
      recordingDuration: detail.recordingDuration || '0:00'
    };
  }

  /* ===== 详情：录音播放器 ===== */
  function renderAudioSection(context) {
    if (context.isDazhong && !context.recordingAvailable) {
      return '<div class="record-detail-section-title" style="margin-bottom:10px;">通话录音</div>' +
        '<div class="record-audio-card"><div class="record-detail-empty" style="width:100%;padding:10px;color:#8c8c8c;text-align:center;">本次未生成录音</div></div>';
    }
    var pill;
    if (context.isDazhong) {
      pill = '<div class="record-audio-pill" title="' + escapeHtml(context.recordingUrl) + '">' +
        '<button type="button" class="record-audio-play" style="border:none;background:transparent;padding:0;color:#1677ff;font-size:15px;cursor:pointer;" aria-label="播放录音" onclick="window.Pages[\'result-records\'].toggleAudio(this)">&#9654;</button>' +
        '<span><span class="record-audio-current">0:00</span> / <span class="record-audio-duration">' + escapeHtml(context.recordingDuration || '0:00') + '</span></span>' +
        '<span class="record-audio-line" style="position:relative;cursor:pointer;" onclick="window.Pages[\'result-records\'].seekAudio(event,this)"><span class="record-audio-progress" style="position:absolute;left:0;top:0;height:100%;width:0;background:#1677ff;"></span></span>' +
        '<span class="record-audio-volume" title="音量">&#128266;</span>' +
        '<span class="record-audio-more" title="更多">&#8942;</span>' +
        '</div>';
    } else {
      pill = '<div class="record-audio-pill"><span class="record-audio-play">&#9654;</span><span>0:00 / 0:23</span><span class="record-audio-line"></span><span class="record-audio-volume">&#128266;</span><span class="record-audio-more">&#8942;</span></div>';
    }
    return '<div class="record-detail-section-title" style="margin-bottom:10px;">通话录音</div>' +
      '<div class="record-audio-card">' + pill + '<span class="record-audio-icon">&#127911;</span><span class="record-audio-icon">&#128196;</span></div>';
  }

  /* ===== 详情：右栏面板 ===== */
  function renderOutboundResult(item, context) {
    if (context && context.isDazhong && context.state !== 'fetched') {
      return '<div class="record-detail-fields"><div class="record-detail-empty" style="margin-top:24px;padding:20px;border-radius:8px;color:#8c8c8c;background:#fafafa;text-align:center;line-height:1.6;">详情查询暂未命中，请稍后重试。</div></div>';
    }
    return '<div class="record-detail-fields">' +
      '<div class="record-detail-section-title">外呼小结</div>' +
      '<div class="record-detail-summary" style="margin-bottom:16px;">' + escapeHtml(item.summary || '-') + '</div>' +
      '<div><span class="record-info-label">意向标签：</span><span class="record-info-value">' + escapeHtml(item.aiTagName || '-') + '</span></div>' +
      '<div><span class="record-info-label">计划到店时间：</span><span class="record-info-value">-</span></div>' +
      '<div><span class="record-info-label">预计购车时间：</span><span class="record-info-value">-</span></div>' +
      '<div><span class="record-info-label">意向品牌中文名：</span><span class="record-info-value">-</span></div>' +
      '<div><span class="record-info-label">意向车系中文名：</span><span class="record-info-value">-</span></div>' +
      '</div>';
  }

  function renderInfoValue(value) {
    if (Array.isArray(value)) {
      if (!value.length) return '-';
      return '<span class="record-info-pill-list" style="display:inline-flex;flex-wrap:wrap;justify-content:flex-end;gap:6px;max-width:100%;">' + value.map(function (name) {
        return '<span class="record-info-pill" style="display:inline-flex;align-items:center;min-height:20px;padding:0 8px;border-radius:10px;color:#1677ff;background:#e6f4ff;font-size:12px;">' + escapeHtml(name) + '</span>';
      }).join('') + '</span>';
    }
    return escapeHtml(value);
  }

  function renderDetailInfo(item, context) {
    var isDazhong = Boolean(context && context.isDazhong);
    var fields;
    if (item.platform === '厚朴') {
      fields = [
        ['用户号码', maskPhone(item.phone) || '-'],
        ['场景名称', item.sceneName || '-'],
        ['通话时长', item.duration || '-'],
        ['通话开始时间', item.startTime || '-'],
        ['通话结束时间', item.endTime || '-'],
        ['原始状态码', item.rawStatusCode],
        ['原始状态描述', item.rawStatusName || '-'],
        ['DCC通话状态', resolveStatus(item)],
        ['会话 id', item.sessionId || item.callid || '-'],
        ['主叫号码归属', item.callerLocation || '-'],
        ['被叫号码省份城市', item.calleeLocation || '-']
      ];
      var houpoOptional = [
        ['任务ID', item.taskId],
        ['批次号', item.batchId],
        ['通话ID', item.callId],
        ['意向', item.intention],
        ['标签', item.tags]
      ];
      houpoOptional.forEach(function (pair) {
        var hasValue = Array.isArray(pair[1])
          ? pair[1].length > 0
          : pair[1] !== undefined && pair[1] !== null && pair[1] !== '';
        if (hasValue) fields.push(pair);
      });
    } else if (isDazhong) {
      fields = [
        ['会话 id', context.callid || '-'],
        ['用户号码', maskPhone(item.phone) || '-'],
        ['场景编码', item.sceneCode || '-'],
        ['场景名称', item.sceneName || '-'],
        ['对话时长', item.duration || '-'],
        ['通话开始时间', item.startTime || '-'],
        ['通话结束时间', item.endTime || '-'],
        ['通话结果', resolveStatus(item)],
        ['转人工状态', item.transferStatus || '无转人工'],
        ['转人工时间', item.transferTime || '-'],
        ['用户关注', item.userConcern || '-'],
        ['意向标签', item.dazhongTagName || '-'],
        ['通话标签', context.componentTagNames || []]
      ];
    } else {
      fields = [
        ['用户号码', maskPhone(item.phone) || '-'],
        ['号码提交时间', item.submitTime || '-'],
        ['已拨打次数', item.dialCount !== undefined ? item.dialCount : 0],
        ['外呼通道', item.channel || '-'],
        ['最终外呼时间', item.lastCallTime || item.startTime || '-'],
        ['通话时长', item.duration || '-'],
        ['会话 id', item.sessionId || item.callid || '-'],
        ['主叫号码归属', item.callerLocation || '-'],
        ['被叫号码省份城市', item.calleeLocation || '-']
      ];
    }
    var infoRows = fields.map(function (f) {
      return '<div class="record-info-row"><span class="record-info-label">' + escapeHtml(f[0]) + ':</span><span class="record-info-value">' + renderInfoValue(f[1]) + '</span></div>';
    }).join('');
    return '<div class="record-info-list">' + infoRows + '</div>';
  }

  function renderRightPanel(item, context) {
    return '<div class="record-detail-right-tabs">' +
      '<div class="record-tab active" onclick="window.Pages[\'result-records\'].switchDetailTab(this,\'outbound\')">外呼结果</div>' +
      '<div class="record-tab" onclick="window.Pages[\'result-records\'].switchDetailTab(this,\'info\')">详细信息</div>' +
      '</div>' +
      '<div class="record-detail-tab-content" id="recordDetailTabContent">' + renderOutboundResult(item, context) + '</div>';
  }

  function renderDetailModal(context) {
    var item = context.item;
    var titleId = context.isDazhong ? context.callid : (item.sessionId || '-');
    var leftContent;
    if (context.isDazhong && context.state !== 'fetched') {
      leftContent = '<div class="record-detail-empty" style="display:flex;align-items:center;justify-content:center;min-height:220px;margin-top:14px;border:1px dashed #d9d9d9;border-radius:8px;color:#8c8c8c;background:#fafafa;text-align:center;line-height:1.6;">已使用 recordid 查询，详情暂未返回。</div>';
    } else {
      leftContent = renderAudioSection(context) +
        '<div class="record-detail-transcript">' +
        '<div class="record-detail-section-title" style="margin-bottom:10px;">通话文本</div>' +
        renderDialogRows(context.dialogRows) +
        '</div>';
    }
    return '<div class="record-detail-backdrop" id="recordDetailBackdrop" onclick="window.Pages[\'result-records\'].closeDetail(event)">' +
      '<div class="record-detail-modal" data-anno-page="ai-call-records" data-anno-label="通话详情" data-anno-kind="region" data-anno-fields="FLD-037,FLD-039,FLD-040,FLD-041,FLD-042,FLD-045,FLD-047,FLD-048,FLD-049,FLD-050,FLD-051,FLD-052" onclick="event.stopPropagation()">' +
        '<div class="record-detail-header">' +
          '<button class="record-detail-close" onclick="window.Pages[\'result-records\'].closeDetail()">&#215;</button>' +
          '<span class="record-detail-title">会话 id：' + escapeHtml(titleId) + '</span>' +
        '</div>' +
        '<div class="record-detail-body">' +
          '<div class="record-detail-left">' + leftContent + '</div>' +
          '<div class="record-detail-right"><div class="record-detail-content">' + renderRightPanel(item, context) + '</div></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function showDetail(index) {
    var item = rows[index] || rows[0] || {};
    var context = resolveDetailContext(item);
    if (!context) return;
    document.body.insertAdjacentHTML('beforeend', renderDetailModal(context));
    var backdrop = document.getElementById('recordDetailBackdrop');
    if (backdrop) {
      backdrop._detailIndex = index;
      backdrop._detailContext = context;
    }
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      var backdrop = document.getElementById('recordDetailBackdrop');
      var drawer = backdrop ? backdrop.querySelector('.record-detail-modal') : null;
      if (backdrop) backdrop.classList.add('open');
      if (drawer) drawer.classList.add('open');
    });
  }

  function closeDetail(e) {
    if (e && e.target !== e.currentTarget) return;
    var backdrop = document.getElementById('recordDetailBackdrop');
    var drawer = backdrop ? backdrop.querySelector('.record-detail-modal') : null;
    if (!backdrop) return;
    stopAudioPlayback();
    backdrop.classList.remove('open');
    if (drawer) drawer.classList.add('closing');
    setTimeout(function () {
      if (backdrop) backdrop.remove();
      document.body.style.overflow = '';
    }, 260);
  }

  function switchDetailTab(el, tab) {
    var container = document.getElementById('recordDetailTabContent');
    if (!container) return;
    el.parentElement.querySelectorAll('.record-tab').forEach(function (t) { t.classList.remove('active'); });
    el.classList.add('active');
    var backdrop = el.closest('.record-detail-backdrop');
    var context = backdrop ? backdrop._detailContext : null;
    var item = context ? context.item : (rows[backdrop && backdrop._detailIndex !== undefined ? backdrop._detailIndex : 0] || {});
    container.innerHTML = tab === 'outbound' ? renderOutboundResult(item, context) : renderDetailInfo(item, context);
  }

  /* ===== 筛选操作 ===== */
  function resetFilters() {
    var page = document.querySelector('.result-records-page');
    if (!page) return;
    page.querySelectorAll('input').forEach(function (inp) { inp.value = ''; });
    page.querySelectorAll('select').forEach(function (sel) { sel.selectedIndex = 0; });
    var tbody = page.querySelector('.record-table tbody');
    if (tbody) tbody.innerHTML = renderRows();
    showToast('已重置筛选条件');
  }

  function doQuery() {
    var page = document.querySelector('.result-records-page');
    var tbody = page ? page.querySelector('.record-table tbody') : null;
    if (tbody) tbody.innerHTML = renderRows();
    showToast('查询完成', 'info');
  }

  /* ===== 排序 ===== */
  function toggleSort(field, el) {
    if (sortField === field) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortOrder = 'asc';
    }
    document.querySelectorAll('.sort-toggle').forEach(function (s) { s.textContent = '\u21c5'; });
    el.textContent = sortOrder === 'asc' ? '\u2191' : '\u2193';
    var page = document.querySelector('.result-records-page');
    var tbody = page ? page.querySelector('.record-table tbody') : null;
    if (tbody) tbody.innerHTML = renderRows();
  }

  /* ===== 录音播放模拟（大众详情 recordingDuration） ===== */
  function parseDuration(value) {
    var parts = String(value || '0:00').split(':');
    if (parts.length !== 2) return 0;
    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  function formatAudioTime(seconds) {
    var value = Math.max(0, Math.floor(seconds || 0));
    var sec = value % 60;
    return Math.floor(value / 60) + ':' + (sec < 10 ? '0' + sec : String(sec));
  }

  function stopAudioPlayback() {
    if (audioTimer) clearInterval(audioTimer);
    audioTimer = null;
  }

  function updateAudioPlayer(card, current, total) {
    var currentEl = card.querySelector('.record-audio-current');
    var progressEl = card.querySelector('.record-audio-progress');
    if (currentEl) currentEl.textContent = formatAudioTime(current);
    if (progressEl) progressEl.style.width = (total ? Math.min(100, current / total * 100) : 0) + '%';
    card._audioCurrent = current;
  }

  function toggleAudio(button) {
    var card = button.closest('.record-audio-card');
    if (!card) return;
    var durationLabel = card.querySelector('.record-audio-duration');
    var total = parseDuration(durationLabel ? durationLabel.textContent : '0:00');
    if (button.classList.contains('is-playing')) {
      stopAudioPlayback();
      button.classList.remove('is-playing');
      button.innerHTML = '&#9654;';
      button.setAttribute('aria-label', '播放录音');
      return;
    }
    stopAudioPlayback();
    document.querySelectorAll('.record-audio-play.is-playing').forEach(function (other) {
      other.classList.remove('is-playing');
      other.innerHTML = '&#9654;';
    });
    button.classList.add('is-playing');
    button.innerHTML = '&#10074;&#10074;';
    button.setAttribute('aria-label', '暂停录音');
    audioTimer = setInterval(function () {
      var next = Number(card._audioCurrent || 0) + 1;
      if (next >= total) {
        next = total;
        stopAudioPlayback();
        button.classList.remove('is-playing');
        button.innerHTML = '&#9654;';
      }
      updateAudioPlayer(card, next, total);
    }, 1000);
  }

  function seekAudio(event, track) {
    var card = track.closest('.record-audio-card');
    if (!card) return;
    var durationLabel = card.querySelector('.record-audio-duration');
    var total = parseDuration(durationLabel ? durationLabel.textContent : '0:00');
    var rect = track.getBoundingClientRect();
    var ratio = rect.width ? Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) : 0;
    updateAudioPlayer(card, Math.round(total * ratio), total);
  }

  /* ===== 页面渲染（100% 对齐截图） ===== */
  function render() {
    syncScope();
    var statusOptions = DccStatusList;
    var statusSelectHtml = '<option value="">请选择</option>' + statusOptions.map(function (s) {
      return '<option value="' + s + '">' + s + '</option>';
    }).join('');
    var platformOptions = '<option value="">全部</option>' + (window.MockPlatforms || []).map(function (p) {
      return '<option value="' + p.name + '">' + p.name + '</option>';
    }).join('');

    return '<div class="result-records-page" data-anno="ai-call-records" data-anno-page="ai-call-records" data-anno-label="智能外呼通话记录" data-anno-kind="region" data-anno-fields="FLD-021,FLD-022,FLD-023,FLD-024,FLD-038">' +
      '<div class="record-header">' +
        '<span class="record-title">通话记录</span>' +
        '<span class="record-subtitle">查看每一通外呼的结果</span>' +
      '</div>' +
      '<div class="filter-bar" data-anno-page="result-records" data-anno-label="通话记录筛选" data-anno-kind="region" data-anno-fields="FLD-020,FLD-021,FLD-022,FLD-024,FLD-025,FLD-027" style="margin-bottom:16px;">' +
        '<div class="filter-row">' +
          '<div class="filter-item"><label>用户号码：</label><input type="text" id="recordPhone" class="filter-input" placeholder="请输入" style="width:170px;"></div>' +
          '<div class="filter-item"><label>通话开始时间：</label><div class="filter-date-range"><input type="text" class="date-input" placeholder="请选择"><span class="sep">~</span><input type="text" class="date-input" placeholder="请选择"><span class="calendar-icon">&#128197;</span></div></div>' +
          '<div class="filter-item"><label>通话结束时间：</label><div class="filter-date-range"><input type="text" class="date-input" placeholder="请选择"><span class="sep">~</span><input type="text" class="date-input" placeholder="请选择"><span class="calendar-icon">&#128197;</span></div></div>' +
          '<div class="btn-group">' +
            '<button class="btn btn-default" onclick="window.Pages[\'result-records\'].resetFilters()">重置</button>' +
            '<button class="btn btn-primary" onclick="window.Pages[\'result-records\'].doQuery()">查询</button>' +
            '<a href="#" class="filter-expand-link" id="recordExpandLink" onclick="window.Pages[\'result-records\'].toggleExpand(event)">展开 <span class="arrow" style="font-size:10px;">&#9660;</span></a>' +
          '</div>' +
        '</div>' +
        '<div class="filter-row" id="recordExtraFilterRow" style="display:none; padding-top:8px;">' +
          '<div class="filter-item"><label>场景名称：</label><input type="text" id="recordScene" class="filter-input" placeholder="请输入" style="width:170px;"></div>' +
          '<div class="filter-item"><label>通话状态：</label><select class="filter-select" style="width:170px;">' + statusSelectHtml + '</select></div>' +
          '<div class="filter-item"><label>智能平台：</label><select class="filter-select" style="width:170px;">' + platformOptions + '</select></div>' +
        '</div>' +
      '</div>' +
      '<div class="record-table-panel">' +
        '<div class="record-toolbar">' +
          '<button class="btn btn-primary btn-export" onclick="showToast(\'导出任务已提交，系统正在生成报表...\',\'info\')"><span style="font-size:14px;font-weight:bold;margin-right:2px;">+</span> 导出</button>' +
          '<span class="report-icon-btn" onclick="doRefresh()" title="刷新">&#10227;</span>' +
          '<span class="report-icon-btn" onclick="showToast(\'设置功能开发中\',\'info\')" title="列设置">&#9881;</span>' +
        '</div>' +
        '<div class="record-table-scroll">' +
          '<table class="record-table" data-anno-page="ai-call-records" data-anno-label="通话记录列表" data-anno-kind="table" data-anno-fields="FLD-037,FLD-038,FLD-039,FLD-042,FLD-043,FLD-044,FLD-045,FLD-046">' +
            '<thead><tr>' +
              '<th style="width: 60px;">序号</th>' +
              '<th style="width: 140px;">用户号码</th>' +
              '<th style="width: 180px;">通话开始时间 <span class="sort-toggle" onclick="window.Pages[\'result-records\'].toggleSort(\'startTime\', this)" title="排序">&#8693;</span></th>' +
              '<th style="width: 180px;">通话结束时间 <span class="sort-toggle" onclick="window.Pages[\'result-records\'].toggleSort(\'endTime\', this)" title="排序">&#8693;</span></th>' +
              '<th style="width: 90px;">通话时长</th>' +
              '<th style="width: 240px;">场景名称</th>' +
              '<th style="width: 100px;">通话状态</th>' +
              '<th></th>' +
              '<th class="record-action-cell">操作</th>' +
            '</tr></thead>' +
            '<tbody>' + renderRows() + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function init() { syncScope(); }

  window.Pages = window.Pages || {};
  window.Pages['result-records'] = {
    render: render,
    init: init,
    resetFilters: resetFilters,
    doQuery: doQuery,
    toggleExpand: toggleExpand,
    showDetail: showDetail,
    closeDetail: closeDetail,
    switchDetailTab: switchDetailTab,
    toggleSort: toggleSort,
    toggleAudio: toggleAudio,
    seekAudio: seekAudio
  };
})();
