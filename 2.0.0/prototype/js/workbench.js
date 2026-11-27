(function () {
  "use strict";

  const sections = window.reviewSections ||= {};
  const manual = "人工外呼";
  const hasOutboundTask = record => typeof record?.taskId === "string" && Boolean(record.taskId.trim());
  const predictive = "预外呼";
  const incoming = "待接听";
  const nextVisit = "下次回访";
  const activeCalls = new Set(["requested", "active", "aftercall"]);
  const inCall = record => ["requested", "active"].includes(record.callState);
  const phoneKey = value => String(value ?? "").replace(/[\s()-]/g, "").replace(/^(?:\+86|0086)(?=1\d{10}$)/, "");
  const activeContact = record => activeCalls.has(record.callState) || record.assignmentPending || record.pendingReassignment;
  const queuedContact = record => record.taskStatus === incoming ||
    record.taskStatus === "待办理" && Boolean(record.ownerId && record.taskId);
  const contactWaitReason = "同一号码已有呼出安排，等待原安排结束";
  const visibleInScope = record => !record.skynet || window.DSkynetIntake?.inScope(DSession.context(),record) === true;
  const taskEnded = record => ["已完成", "已结束"].includes(record.taskStatus);
  const nurturePending = record => Boolean(record.skynet && record.taskStatus === "待处理");
  const nurtureHandoff = record => Boolean(record.skynet && ["待AI外呼","待预外呼","待企微培育"].includes(record.taskStatus));
  const deliveryState = record => window.DSkynetIntake?.deliveryState?.(record);
  const deliveryStatus = record => record.skynet?.delivery?.status || deliveryState(record)?.status;
  const legacyHandoffWritable = record => !record.skynet && record.demoTask !== true;

  function contactBusy(state, record, advancing=false) {
    const phone = phoneKey(record.phone);
    if (!phone) return false;
    const index = state.records.indexOf(record);
    const arrangedAt = Date.parse(record.lastCheckedAt) || 0;
    return state.records.some((other,otherIndex) => {
      if (other === record || other.tenant !== record.tenant || phoneKey(other.phone) !== phone) return false;
      if (record.skynet && (window.DSkynetIntake.isRetiredContact(other) || other.brandId && other.brandId !== record.brandId)) return false;
      if (activeContact(other)) return true;
      if (!queuedContact(other)) return false;
      if (!advancing || !queuedContact(record) && !activeContact(record)) return true;
      if (activeContact(record)) return false;
      // Earlier reservations in existing review data can complete first.
      const otherAt = Date.parse(other.lastCheckedAt) || 0;
      return otherAt < arrangedAt || otherAt === arrangedAt && otherIndex < index;
    });
  }
  const nextResults = new Set(["下次回访", "有意向", "待考虑", "稍后回拨", "短信跟进", "已邀约到店", "已预约试驾"]);
  const connectedResults = ["下次回访", "有意向", "待考虑", "已邀约到店", "已预约试驾", "下发门店", "试驾线索下发", "意向线索下发", "战败", "休眠未购", "无效结案", "阶段性战败"];
  const missedResults = ["稍后回拨", "下次回访", "短信跟进", "无人接下发", "休眠失联"];
  let selectedRecordId = "";
  let selectedTaskId = "";

  function ownSeat(state) {
    return state.seats.find((seat) => seat.id === state.seatId && seat.tenant === state.tenant);
  }

  function seatLabel(state, id) {
    return state.seats.find((seat) => seat.id === id)?.name || "尚未分派";
  }

  const unarranged = record => ["待安排", "待流转"].includes(record.taskStatus);

  function progress(record) {
    if (unarranged(record)) return "待安排";
    if (record.callState === "requested") return "等待拨出";
    if (record.callState === "active") return "通话中";
    if (record.callState === "aftercall") return "待填写回访";
    return record.taskStatus || record.intakeState || "待办理";
  }

  function displayTime(value) {
    if (!value) return "—";
    const text = String(value);
    if (/(?:Z|[+-]\d{2}:\d{2})$/i.test(text) && Number.isFinite(Date.parse(text))) {
      return new Date(text).toLocaleString("zh-CN",{timeZone:"Asia/Shanghai",hour12:false});
    }
    return text.replace("T", " ");
  }

  function seatUsage(state, seat) {
    const native = window.document?.querySelector('iframe[data-native-module="cloud"]')?.contentWindow;
    const projected = native?.CustomerTasks?.manualBatchSeatUsage;
    const saved = projected ? projected(state.tenant,state.today,seat.id) : {newCount:0,followCount:0};
    return saved ? {newCount:Number(seat.newCount || 0)+saved.newCount, followCount:Number(seat.followCount || 0)+saved.followCount} :
      {newCount:null,followCount:null};
  }

  function seatCapacity(state, seat, additional = 1) {
    if (!seat || seat.enabled === false) return "坐席当前不可接单";
    if (seat.bindingState && seat.bindingState !== "已关联") return seat.bindingState;
    if (state.schedules?.[seat.id]?.[state.today] === "休息") return "今日休息";
    const shift = state.schedules?.[seat.id]?.[state.today];
    const hours = window.DReview21Schedule?.shiftHours(state,shift) ??
      {早班:['09:00','18:00'],中班:['12:00','21:00'],晚班:['14:00','23:00']}[shift];
    if (hours) {
      const now = new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());
      if (now < hours[0] || now >= hours[1]) return "当前不在班次时段";
    }
    const max = seat.quotaMax;
    if (max !== null && max !== "" && max !== undefined) {
      const {newCount,followCount} = seatUsage(state,seat);
      if (newCount === null) return "今日接收量暂不可核对";
      if (newCount + followCount >= Number(max)) return "今日接收量已满";
      if (newCount + followCount + additional > Number(max)) return "今日剩余接收量不足";
    }
    return "";
  }

  function newTaskAssignment(state, record, seat) {
    record.ownerId = seat.id;
    record.assignedOn = state.today;
    record.taskStatus = "待办理";
    record.dailyCounts ||= {};
    const key = state.today + '|' + seat.id;
    if (!record.dailyCounts[key] || record.dailyCounts[key].refunded) {
      seat.newCount = Number(seat.newCount || 0) + 1;
      record.dailyCounts[key] = {kind:'new',started:false,refunded:false};
    }
    record.countedDay = state.today;
  }

  function countContinued(state, record, seat) {
    record.dailyCounts ||= {};
    const key = state.today + '|' + seat.id;
    const previous = record.dailyCounts[key];
    if (previous && !previous.refunded) { previous.started = true; return; }
    const originalDay = record.assignedOn || record.lastFollowupAt?.slice(0, 10);
    // Older review data recorded a day but had no per-seat entry yet.
    const alreadyCounted = !previous && record.ownerId===seat.id && record.countedDay===state.today &&
      !Object.keys(record.dailyCounts).some(item=>item.startsWith(state.today+'|'));
    if(alreadyCounted){
      if(originalDay)record.dailyCounts[key]={kind:originalDay<state.today?'continued':'new',started:true,refunded:false};
      return;
    }
    if (originalDay && originalDay < state.today) {
      seat.followCount = Number(seat.followCount || 0) + 1;
      record.countedDay = state.today;
      record.dailyCounts[key]={kind:'continued',started:true,refunded:false};
    }
  }

  function formatRecord(state, record, ui) {
    const e = ui.esc;
    return `<dl class="wb-details">
      <div><dt>客户</dt><dd>${e(record.name || "未填写")} <span class="muted">${e(record.phone || "")}</span></dd></div>
      <div><dt>来源</dt><dd>${e(record.category || "—")} · ${e(record.source || "—")}</dd></div>
      <div><dt>跟进人</dt><dd>${e(seatLabel(state, record.ownerId))}</dd></div>
      <div><dt>办理状态</dt><dd>${e(progress(record))}</dd></div>
      <div><dt>最新回访</dt><dd>${e(record.followupResult || "尚无记录")}</dd></div>
      <div><dt>下次跟进</dt><dd>${e(displayTime(record.nextAt))}</dd></div>
      <div><dt>本任务已完成跟进</dt><dd>${e(record.followupCount || 0)} 次</dd></div>
      ${record.intakeState ? `<div><dt>接入结果</dt><dd>${e(window.DReview21Intake.receiptStatus(record.intakeState))}</dd></div>` : ""}
      ${record.handoffState ? `<div><dt>交接状态</dt><dd>${e(record.handoffState)}</dd></div>` : ""}
      ${record.followupNote ? `<div class="wb-wide"><dt>回访记录</dt><dd>${e(record.followupNote)}</dd></div>` : ""}
    </dl>`;
  }

  function styles() {
    return `<style>
      .wb-two{display:grid;grid-template-columns:minmax(235px,0.75fr) minmax(350px,1.25fr);gap:16px;align-items:start}
      .wb-stack{display:grid;gap:16px}.wb-list{display:grid;gap:8px;margin-top:12px}
      .wb-item{display:flex;width:100%;text-align:left;align-items:center;justify-content:space-between;gap:10px;padding:12px;border:1px solid #dfe6f0;background:#fff;border-radius:8px;color:inherit;cursor:pointer}
      .wb-item:hover,.wb-item[aria-current="true"]{border-color:#8db4ec;background:#eef5ff}
      .wb-item small{display:block;margin-top:4px}.wb-details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 18px;margin:14px 0}
      .wb-two details{margin-top:16px;color:#435670}.wb-two summary{cursor:pointer;font-size:.9em}
      .wb-details dt{font-size:.85em;color:#5e7088}.wb-details dd{margin:3px 0 0;overflow-wrap:anywhere}
      .wb-wide{grid-column:1/-1}.wb-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center}
      .wb-form{display:grid;gap:10px;margin-top:14px}.wb-form label{display:grid;gap:5px}
      .wb-form textarea{resize:vertical;min-height:68px}
      .wb-form :is(textarea,select,input:not([type=checkbox],[type=radio])),.wb-filter,.wb-dcc-search input{
        box-sizing:border-box;min-height:var(--ui-control-height,34px);max-width:100%;padding:5px 9px;
        border:1px solid #d9d9d9;border-radius:6px;background:#fff;color:var(--ui-text,#262626);font:inherit
      }
      .wb-form :is(select,input,textarea):disabled{color:var(--ui-text-muted,#8c8c8c);background:#f5f5f5}
      .wb-queue-dialog{width:min(590px,calc(100vw - 32px));max-height:85vh;border:1px solid #d8e2ef;border-radius:12px;padding:22px;color:#20344d;box-shadow:0 18px 58px #16376138}
      .wb-queue-dialog::backdrop{background:#17263f55}.wb-queue-dialog .section-title{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .wb-row-button{white-space:nowrap}.wb-filter-empty[hidden],.wb-next-time[hidden],.wb-queue-dialog [hidden]{display:none}
      .wb-delivery{margin:0 0 12px;padding:12px;border:1px solid var(--ui-border,#e8e8e8);border-radius:6px}
      .wb-delivery .wb-meta{margin-top:6px}.wb-delivery .wb-actions{margin-top:8px}
      .wb-internal-match{padding:10px 12px;margin:10px 0;border:1px solid #bae0ff;border-radius:6px;background:#f0f8ff;line-height:1.7;overflow-wrap:anywhere}
      .wb-internal-match.is-error{border-color:#ffd591;background:#fff7e6;color:#874d00}
      .wb-internal-match p{margin:3px 0}
      .wb-delivery-options{display:grid;gap:8px;border:0;padding:0;margin:10px 0 0}
      .wb-delivery-options legend{font-weight:600;padding:0;margin-bottom:8px}
      .wb-delivery-options label{display:flex;align-items:center;gap:8px;min-height:34px;padding:0 10px;border:1px solid var(--ui-border,#e8e8e8);border-radius:6px;cursor:pointer}
      .wb-delivery-options label:has(:checked){border-color:var(--ui-primary,#1677ff);background:#e6f4ff}
      .wb-delivery-options input{margin:0;accent-color:var(--ui-primary,#1677ff)}
      .wb-delivery-stores{padding-top:6px;border-top:1px solid var(--ui-border,#e8e8e8)}
      .wb-delivery-stores .wb-delivery-options{max-height:210px;overflow:auto}
      .wb-delivery-store-option{flex:1;min-width:0}
      .wb-delivery-store-option small{display:block;color:#53657d}
      .wb-delivery-leads{margin-top:10px;overflow:auto}
      .wb-delivery-leads table{width:100%;border-collapse:collapse}
      .wb-delivery-leads th,.wb-delivery-leads td{text-align:left;padding:6px;border-bottom:1px solid var(--ui-border,#e8e8e8);overflow-wrap:anywhere}
      .wb-delivery-leads :is(th,td):first-child:not([colspan]){width:3em;white-space:nowrap}
      .wb-delivery-error{color:var(--ui-danger,#a8071a)}
      .wb-wecom-form [role="alert"]{color:var(--ui-danger,#a8071a)}
      .wb-wecom-form .wb-wecom-confirmation{display:flex;align-items:center;gap:7px}
      [data-wb-wecom-overdue][hidden],[data-wb-wecom-check-result][hidden]{display:none!important}
      [data-wb-wecom-followup] .wb-actions{margin-top:8px}
      [data-wb-delivery-dialog] .wb-actions{justify-content:flex-end}
      .wb-inline{padding:12px 16px;border-bottom:1px solid #e5eaf0;gap:10px}
      .wb-inline .panel{border:1px solid #e5eaf0;border-radius:8px;background:#fff;padding:12px;margin:0;min-width:0}
      .wb-inline .toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
      .wb-inline .wb-two{grid-template-columns:minmax(135px,0.75fr) minmax(175px,1.25fr);gap:10px}
      .wb-inline .wb-item{padding:8px;gap:6px}.wb-inline .wb-list{margin-top:7px;gap:5px}
      .wb-inline h3{margin:0;font-size:14px}.wb-inline p{margin:5px 0 0}
      .wb-inline .wb-details{gap:8px 12px;margin:8px 0}.wb-inline .muted{color:#52647d}
      .wb-inline .button{
        display:inline-flex;align-items:center;justify-content:center;min-height:var(--ui-control-height,34px);
        font:inherit;font-size:13px;color:var(--ui-text,#262626);border:1px solid #d9d9d9;
        border-radius:6px;background:#fff;padding:0 12px;cursor:pointer
      }
      .wb-inline .button:not(:disabled):hover{border-color:var(--ui-primary,#1677ff);color:var(--ui-primary,#1677ff)}
      .wb-inline .button.primary{background:var(--ui-primary,#1677ff);border-color:var(--ui-primary,#1677ff);color:#fff}
      .wb-inline .button.primary:not(:disabled):hover{background:var(--ui-primary-hover,#0958d9);color:#fff}
      .wb-inline .button:disabled{color:#bfbfbf;background:#f5f5f5;border-color:#e8e8e8;cursor:not-allowed}
      .wb-inline .tag{display:inline-block;padding:1px 6px;border-radius:4px;color:#0958d9;background:#e6f4ff;font-size:12px;white-space:nowrap}
      .seat-workspace .workbench-domain-block:has([data-review21-inline-workbench] .wb-dcc-topbar){padding:0;border:0;background:transparent}
      .seat-workspace .workbench-domain-block:has([data-review21-inline-workbench] .wb-dcc-topbar)>.workbench-domain-title,
      .seat-workspace .panel-card:has(>[data-review21-inline-workbench] .wb-dcc-topbar)>.panel-header{display:none}
      .seat-workspace .panel-card:has(>[data-review21-inline-workbench]){margin-top:0;border:0;overflow:visible;box-shadow:none;background:transparent}
      .wb-inline:has(.wb-dcc-topbar){padding:0;border:0}
      .wb-dcc-topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
      .wb-dcc-topbar h2{margin:0;font-size:16px;line-height:24px;color:var(--ui-text,#262626)}
      .wb-dcc-topbar .wb-actions{margin:0}
      .wb-dcc-layout{
        position:relative;display:grid;grid-template-columns:clamp(190px,22%,250px) minmax(0,1fr) clamp(232px,28%,340px);
        height:clamp(380px,calc(100dvh - 250px),900px);overflow:hidden;border:1px solid var(--ui-border,#e8e8e8);
        border-radius:var(--ui-card-radius,8px);background:#fff
      }
      .wb-dcc-layout.wb-dcc-collapsed{grid-template-columns:clamp(190px,22%,250px) minmax(0,1fr)}
      .wb-dcc-layout>.panel{min-height:0;min-width:0;display:flex;flex-direction:column;gap:0;padding:0;margin:0;border:0;border-radius:0;overflow:hidden;background:#fff}
      .wb-dcc-layout>.wb-dcc-sidebar{border-right:1px solid #e8edf3}
      .wb-dcc-layout>.wb-dcc-assistant{border-left:1px solid #e8edf3}
      .wb-dcc-sidebar-head,.wb-dcc-assistant-head{padding:12px 14px;border-bottom:1px solid var(--ui-border,#e8e8e8)}
      .wb-dcc-scroll{flex:1 1 auto;min-height:0;overflow:auto}
      .wb-dcc-sidebar .wb-dcc-scroll{padding:6px 8px}
      .wb-dcc-center .wb-dcc-scroll,.wb-dcc-assistant .wb-dcc-scroll{padding:12px 16px 16px}
      .wb-dcc-empty{min-height:100%;display:grid;align-content:center;justify-items:center;gap:8px;padding:24px 12px;text-align:center;box-sizing:border-box}
      .wb-dcc-empty h3{margin:0;color:var(--ui-text,#262626);font-size:16px}
      .wb-dcc-empty p{max-width:32em;margin:0;color:var(--ui-text-secondary,#595959)}
      .wb-dcc-empty .button{margin-top:4px}
      .wb-dcc-search{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
      .wb-dcc-search input{flex:1;min-width:80px;width:0}
      .wb-dcc-queues button[aria-pressed="true"]{color:#0958d9;background:#e6f4ff;font-weight:600}
      .wb-dcc-queues b{color:#52647d;font-size:12px}
      .wb-dcc-queues{display:grid;gap:3px}
      .wb-dcc-queues button{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:7px 9px;text-align:left;border:0;border-radius:6px;background:#fff;color:#374e66;font:inherit;cursor:pointer}
      .wb-dcc-queues button:hover{background:#f5f8ff}
      .wb-dcc-filter{display:grid;gap:4px;margin:10px 4px 4px;font-size:12px;color:#425570}
      .wb-dcc-filter select{width:100%;min-height:30px}
      .wb-dcc-layout summary{cursor:pointer}
      .wb-dcc-sidebar .wb-item{display:block;text-align:left;background:#fff}
      .wb-dcc-sidebar .wb-item[aria-current="true"],.wb-dcc-sidebar .wb-item:hover{background:#eff6ff}
      .wb-task-line{display:flex;justify-content:space-between;align-items:center;gap:4px;min-width:0}
      .wb-task-line strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .wb-task-line small{white-space:nowrap;color:#52647d}
      .wb-assistant-tabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:2px;padding:0 6px;border-bottom:1px solid #edf0f4}
      .wb-assistant-tabs>button{min-width:0;border:0;border-bottom:2px solid transparent;background:#fff;color:#475569;padding:9px 0;cursor:pointer;font:inherit;font-size:12px;text-wrap:balance}
      .wb-assistant-tabs button[aria-selected="true"]{color:#0958d9;border-bottom-color:#1677ff}
      .wb-pre-rating h4{margin:4px 0 12px;color:#52647d;font-size:13px}
      .wb-pre-rating-metrics{display:grid;grid-template-columns:auto auto minmax(22px,1fr) auto;align-items:center;gap:8px}
      .wb-pre-rating-level{padding-right:8px;border-right:1px solid #dbe3ef;color:#2459db;font-size:32px;font-weight:700;line-height:1.15}
      .wb-pre-rating-score{color:#111e31;font-size:30px;font-weight:750;line-height:1.15;white-space:nowrap;font-variant-numeric:tabular-nums}
      .wb-pre-rating-score small{font-size:12px;font-weight:600}
      .wb-pre-rating-metrics progress{appearance:none;width:100%;height:7px;border:0;border-radius:8px;background:#dfe6ef;accent-color:#2459db;overflow:hidden}
      .wb-pre-rating-metrics progress::-webkit-progress-bar{background:#dfe6ef}
      .wb-pre-rating-metrics progress::-webkit-progress-value{background:#2459db;border-radius:8px}
      .wb-pre-rating-metrics progress::-moz-progress-bar{background:#2459db;border-radius:8px}
      .wb-pre-rating-percent{color:#52647d;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums}
      .wb-pre-rating-summary{margin:16px 0 0;padding:12px;background:#f0f5fc;border-radius:8px;color:#24354b;line-height:1.65;overflow-wrap:anywhere}
      .wb-pre-rating-source{margin:8px 0 0}
      .wb-excellent-script{padding:12px 0;border-bottom:1px solid var(--ui-border,#e5e7eb)}
      .wb-excellent-script h4{margin:0 0 8px}
      .wb-excellent-script p{margin:0;line-height:1.7;overflow-wrap:anywhere}
      .wb-dcc-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 12px;margin:10px 0}
      .wb-dcc-fields div{min-width:0}.wb-dcc-fields dt{font-size:12px;color:#566980}.wb-dcc-fields dd{margin:3px 0 0;overflow-wrap:anywhere}
      .wb-dcc-assistant .wb-dcc-fields{grid-template-columns:1fr}.wb-dcc-assistant .wb-dcc-fields div{display:grid;grid-template-columns:minmax(82px,auto) 1fr;gap:8px}.wb-dcc-assistant .wb-dcc-fields dd{margin:0}
      .wb-imported-fields .wb-dcc-fields>div{grid-template-columns:minmax(0,2fr) minmax(0,3fr);align-items:baseline}
      .wb-imported-fields dt{overflow-wrap:anywhere}
      .wb-imported-fields [data-wb-copy]{min-height:24px;font-size:12px;padding:0 6px}
      .wb-placeholder{font-size:12px;color:#596d85}.wb-critical{color:#ae381b}
      .wb-profile-task{margin-bottom:14px;border:1px solid #e4eaf1;border-radius:6px;overflow:hidden}
      .wb-profile-entry{padding:10px 12px;border-bottom:1px solid #e4eaf1}
      .wb-profile-entry:last-child{border-bottom:0}.wb-profile-entry h5{margin:0 0 5px;font-size:13px;color:#24354b}
      .wb-profile-tags{display:flex;flex-wrap:wrap;gap:6px;margin:9px 0}
      .wb-profile-tag{white-space:normal;overflow-wrap:anywhere;max-width:100%}
      .wb-profile-empty{padding:8px 2px}.wb-profile-empty h4{margin:0 0 7px;color:#344b65;font-size:13px}
      .wb-followup-task{margin:0 0 16px;border:1px solid #e4eaf1;border-radius:6px;overflow:hidden}
      .wb-followup-task-head{padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e4eaf1}
      .wb-followup-task-head h4{margin:0 0 3px;font-size:13px;color:#24354b;overflow-wrap:anywhere}
      .wb-followup-task .wb-followup-entry{margin:0;padding:12px;border-bottom:1px solid #e4eaf1}
      .wb-followup-task .wb-followup-entry:last-child{border-bottom:0}
      .wb-followup-entry h5{margin:0 0 8px;font-size:13px;color:#24354b}
      .wb-followup-entry dd{white-space:pre-wrap}
      .wb-dcc-history{border-top:1px solid #e4ebf2;margin-top:12px;padding-top:12px}
      .wb-dcc-history>small{display:block;margin-top:4px;color:#566980}
      .wb-dcc-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;border:0;margin:0;padding:0}
      .wb-dcc-form-grid .wb-wide{grid-column:1/-1}.wb-dcc-form-grid [hidden]{display:none!important}
      .wb-dcc-form-grid label,.wb-dcc-form-grid input,.wb-dcc-form-grid textarea,.wb-dcc-form-grid select{min-width:0;width:100%;box-sizing:border-box}
      .wb-call-tools{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:8px 16px;border-bottom:1px solid #e8edf3}
      .wb-call-tools p,.wb-dcc-overview .wb-actions{margin:0}
      .wb-dcc-overview{flex:none;background:#fff;padding:14px 16px 10px;border-bottom:1px solid #e8edf3}
      .wb-dcc-overview .wb-meta{font-size:12px;color:#595959;line-height:1.6}
      .wb-dcc-overview .wb-customer-name{font-size:17px;color:#1f2937}
      .wb-dcc-overview .wb-identity{display:flex;align-items:center;flex-wrap:wrap;gap:8px}
      .wb-dcc-center .wb-form{margin-top:0}
      .wb-dcc-center .wb-section-title{border-left:3px solid #1677ff;padding-left:8px;margin:0 0 10px}
      .wb-required{color:#d4380d;margin-right:5px}
      .wb-dcc-form-grid>details,.wb-dcc-form-grid>.wb-form-context{grid-column:1/-1}
      .wb-dcc-form-grid summary{padding:6px 0;color:#595959}
      .wb-dcc-form-grid .wb-form-context{display:flex;flex-wrap:wrap;gap:8px;color:#595959;font-size:12px}
      .wb-field-readonly{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px;color:#595959;font-size:12px}
      .wb-context-disclosure summary{font-size:13px;color:#334155;font-weight:600}
      .wb-context-leads li{overflow-wrap:anywhere}
      .wb-context-disclosure{padding:8px 0;border-bottom:1px solid #e8edf3}
      .wb-context-disclosure:last-child{border-bottom:0}
      .wb-context-leads{list-style:none;padding:0;margin:8px 0 0;display:grid;gap:5px}
      .wb-context-leads li{background:#f8fafc;padding:6px 8px;border-radius:4px}
      .wb-context-leads small{display:block;color:#52647d}
      .wb-dcc-overview .wb-current-facts,.wb-round-result dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(124px,100%),1fr));gap:8px 12px;margin:10px 0 0}
      .wb-current-facts dt,.wb-round-result dt{color:#52647d;font-size:12px}
      .wb-current-facts dd,.wb-round-result dd{margin:3px 0 0;overflow-wrap:anywhere}
      .wb-round-result{margin-bottom:12px;padding:12px;border:1px solid #e8edf3;border-radius:6px;background:#f8fafc}
      .wb-round-result .wb-meta{color:#334155}
      .wb-workbench-action{padding:12px;margin-bottom:12px;border:1px solid #e8edf3;border-radius:6px}
      .wb-workbench-action:has(>.wb-delivery){padding:0;border:0;margin-bottom:0}
      .wb-workbench-action .wb-actions{margin-top:10px}
      .wb-workbench-action .wb-meta{overflow-wrap:anywhere}
      .wb-call-bar{display:flex;align-items:center;justify-content:space-between;flex:none;flex-wrap:wrap;gap:8px 16px;padding:8px 16px;border-bottom:1px solid #e8edf3;background:#f8fafc}
      .wb-call-bar .wb-actions{margin:0}
      .wb-call-status{display:flex;align-items:center;flex-wrap:wrap;gap:8px}
      .wb-call-timer{font-variant-numeric:tabular-nums;font-weight:600;color:#1f2937}
      .wb-inline .wb-call-bar .button.danger{background:#cf1322;border-color:#cf1322;color:#fff}
      .wb-inline .wb-call-bar .button.danger:hover{background:#a8071a;border-color:#a8071a;color:#fff}
      .wb-inline .notice{background:#edf4ff;color:#224674;border-radius:5px;padding:6px 8px}
      @media (max-width:780px){
        .wb-dcc-layout,.wb-dcc-layout.wb-dcc-collapsed{grid-template-columns:minmax(164px,30%) minmax(0,1fr)}
        .wb-dcc-layout>.wb-dcc-assistant{position:absolute;inset:0 0 0 auto;width:min(330px,100%);z-index:2;box-shadow:-6px 0 20px #1018281a}
      }
      @media (max-width:550px){
        .wb-dcc-layout,.wb-dcc-layout.wb-dcc-collapsed{grid-template-columns:1fr;grid-template-rows:180px minmax(0,1fr);height:clamp(570px,calc(100dvh - 180px),900px)}
        .wb-dcc-layout>.wb-dcc-sidebar{border-right:0;border-bottom:1px solid var(--ui-border,#e8e8e8)}
      }
      @media (max-width:670px){.wb-inline .wb-two{grid-template-columns:1fr}}
      @media (max-width:850px){.wb-two{grid-template-columns:1fr}.wb-details{grid-template-columns:1fr}}
    </style>`;
  }

  function detailsDialog(state, record, ui) {
    if (!record) return "";
    const e = ui.esc;
    const eligible = window.DReview21Operations?.canManage() && window.DReview21Operations.canAssign(state, record);
    const seats = state.seats.filter((seat) => seat.tenant === state.tenant);
    const options = seats.map((seat) => {
      const reason = window.DReview21Operations?.eligibility(state, record, seat);
      return `<option value="${e(seat.id)}" ${reason ? "disabled" : ""}>${e(seat.name)}${reason ? ` · ${e(reason)}` : ""}</option>`;
    }).join("");
    return `<dialog class="wb-queue-dialog" data-queue-dialog>
      <div class="section-title"><h2>业务详情</h2><button type="button" class="button secondary" data-close-details>关闭</button></div>
      ${formatRecord(state, record, ui)}
      ${eligible ? `<form class="wb-form" data-assign-form>
        <label>分派给<select name="seat" required><option value="">请选择坐席</option>${options}</select></label>
        <div class="wb-actions"><button class="button primary" type="submit">确认分派</button></div>
      </form>` : ""}
      ${record.ownerId === state.seatId && record.taskId ? `<div class="wb-actions"><button class="button primary" type="button" data-open-task>进入我的作业</button></div>` : ""}
      ${unarranged(record) ? '<p class="notice">来件已接收，任务待安排。</p>' : ""}
    </dialog>`;
  }

  function queueRender(state, ui) {
    const e = ui.esc;
    const visible = state.records.filter((record) => record.tenant === state.tenant &&
      (state.role === "admin" && (!record.skynet || window.DReview21Operations?.canViewTask(record)) ||
       state.seatId && record.ownerId === state.seatId && visibleInScope(record)));
    const selected = visible.find((record) => record.id === selectedRecordId);
    const table = visible.map((record) => `<tr data-queue-row data-search="${e([record.name, record.phone, record.category, record.originalKey, seatLabel(state, record.ownerId), progress(record)].join(" "))}">
        <td><strong>${e(record.name || "未填写")}</strong><br><small class="muted">${e(record.phone || "—")}</small></td>
        <td>${e(record.category || "—")}</td><td>${e(seatLabel(state, record.ownerId))}</td>
        <td><span class="tag">${e(progress(record))}</span></td><td>${e(displayTime(record.nextAt))}</td>
        <td><button type="button" class="button secondary wb-row-button" data-queue-open="${e(record.id)}">查看详情</button></td>
      </tr>`).join("");
    return `${styles()}<section class="panel">
      <div class="toolbar">
        <div><h2>业务名单</h2><p class="muted">${state.role === "admin" ? "查看本租户线索进度，选择待分派的任务安排跟进人。" : "查看我的线索、回访记录和跟进安排。"}</p></div>
        <label class="field">查找<input class="wb-filter" type="search" placeholder="客户、分类或跟进人" data-queue-filter></label>
      </div>
      ${visible.length ? `<div class="table-wrap"><table>
        <thead><tr><th>客户</th><th>分类</th><th>跟进人</th><th>办理状态</th><th>下次跟进</th><th>操作</th></tr></thead>
        <tbody>${table}</tbody>
      </table></div><p class="empty wb-filter-empty" data-queue-empty hidden>没有符合条件的线索。</p>` : '<p class="empty">当前范围内还没有线索。</p>'}
    </section>${detailsDialog(state, selected, ui)}`;
  }

  function queueBind(state, ui) {
    const root = ui.root || document.querySelector("#workspace");
    const dialog = root.querySelector("[data-queue-dialog]");
    root.querySelector("[data-queue-filter]")?.addEventListener("input", (event) => {
      const query = event.target.value.trim().toLowerCase();
      let count = 0;
      root.querySelectorAll("[data-queue-row]").forEach((row) => {
        row.hidden = !row.dataset.search.toLowerCase().includes(query);
        if (!row.hidden) count++;
      });
      const empty = root.querySelector("[data-queue-empty]");
      if (empty) empty.hidden = count > 0;
    });
    root.querySelectorAll("[data-queue-open]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedRecordId = button.dataset.queueOpen;
        ui.go("queue");
      });
    });
    if (!dialog) return;
    dialog.showModal();
    dialog.addEventListener("close", () => { selectedRecordId = ""; });
    dialog.querySelector("[data-close-details]").addEventListener("click", () => dialog.close());
    dialog.querySelector("[data-open-task]")?.addEventListener("click", () => {
      selectedTaskId = selectedRecordId;
      const record = state.records.find(item => item.id === selectedTaskId);
      if (record) focusWorkbenchTask(workbenchView(state),record,state.today);
      dialog.close();
      ui.go("workbench");
    });
    dialog.querySelector("[data-assign-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if(ui.canSave?.()===false)return;
      const record = state.records.find((item) => item.id === selectedRecordId);
      const Form = event.target.ownerDocument?.defaultView?.FormData || FormData;
      const seat = state.seats.find((item) => item.id === new Form(event.target).get("seat") &&
        item.tenant === state.tenant);
      if (!window.DReview21Operations?.assign(state, record, seat)) {
        ui.toast("当前坐席暂不可接收，请核对班次、上线方式和接收量。");
        return;
      }
      selectedRecordId = "";
      dialog.close();
      ui.save(record.taskStatus === incoming ? "已安排通话，等待接听" : `已分派给${seat.name}，可在本人待办查看`);
    });
  }

  function predictiveTaskInScope(state, seat, record) {
    const context = DSession.context();
    return Boolean(hasOutboundTask(record) && record.skynet?.nurtureTemplateId && record.skynet.nurtureTemplateVersion &&
      record.skynet.roundId && record.roundId === record.skynet.roundId &&
      context?.scope?.id === state.tenant && record.tenant === state.tenant &&
      record.brandId === context.scope.tenant?.brandId && visibleInScope(record) &&
      seat?.id === state.seatId && seat.accountId === context.account.id &&
      seat.enabled === true && seat.bindingState === "已关联" &&
      (!record.workbenchSampleSeatId || record.workbenchSampleSeatId === seat.id) &&
      (!record.ownerId || record.ownerId === seat.id) &&
      (!record.expectedSeatId || record.expectedSeatId === seat.id) && !record.callState &&
      !record.assignmentPending && !record.pendingReassignment &&
      record.requiredMode === predictive && record.skynet.processing?.method === predictive);
  }

  function predictiveTargetReason(record) {
    const context = DSession.context();
    const processing = record.skynet.processing;
    if (processing.waitingForTarget || !processing.targetTaskId || processing.targetTaskTenantId !== context.scope.id) {
      return "本轮预外呼目标尚不可用，请核对原任务。";
    }
    if (window.DSkynetIntake.usesLocalPredictiveSample(record,context)) return "";
    let resolved;
    try { resolved = window.DSkynetOutboundTargets?.resolve(context,predictive,processing.targetTaskId); }
    catch (_) { /* Keep the existing round available when its target cannot be checked. */ }
    const target = resolved?.task;
    return resolved?.status === "available" && target?.id === processing.targetTaskId &&
      target.tenantId === context.scope.id && target.brandId === context.scope.tenant?.brandId ? "" :
      resolved?.reason || "本轮预外呼目标暂不可核对，请稍后重试。";
  }

  function incomingCard(state, seat, mode, ui) {
    if (mode !== predictive || !seat) return "";
    const waiting = state.records.filter((item) => hasOutboundTask(item) && item.tenant === state.tenant &&
      item.taskStatus === incoming && item.expectedSeatId === seat.id &&
      (item.skynet ? predictiveTaskInScope(state,seat,item) : !item.ownerId));
    const record = waiting.find(item => !contactBusy(state,item,true)) || waiting[0];
    const e = ui.esc;
    if (!record) {
      const pending = state.records.filter(item => item.taskStatus === "待预外呼" &&
        !item.expectedSeatId && predictiveTaskInScope(state,seat,item) && !predictiveTargetReason(item));
      const showSamples = !window.DSkynetIntake.hasWorkbenchSamples(state,seat.id,predictive);
      return `<div class="wb-call-tools" aria-label="预外呼状态"><p><strong>等待来电</strong> <span class="muted">接听后进入跟进中</span></p>
        ${showSamples ? '<button type="button" class="button secondary" data-wb-generate-samples>生成预外呼模拟任务</button>' : ""}
        ${pending.map(item => `<div class="wb-actions"><span>${e(item.name || "未命名客户")} · ${e(item.taskId)} · ${e(item.skynet.processing.targetTaskName || item.skynet.processing.targetTaskId)}</span>
          <button type="button" class="button secondary" data-wb-action="offer-predictive" data-record="${e(item.id)}">模拟来电</button></div>`).join("")}
      </div>`;
    }
    const reason = record.skynet && predictiveTargetReason(record) ||
      (contactBusy(state,record,true) ? contactWaitReason : seatCapacity(state, seat));
    return `<div class="wb-call-tools" role="status"><strong>来电待接听</strong> <span>${e(record.name)} · ${e(record.phone)}</span>
      ${reason ? `<span class="muted">${e(reason)}</span>` : ""}
      <button type="button" class="button primary" data-wb-action="answer" data-record="${e(record.id)}" ${reason ? "disabled" : ""}>接听</button>
      <button type="button" class="button secondary" data-wb-action="miss" data-record="${e(record.id)}">未接听</button>
    </div>`;
  }

  function visitDraft(record) {
    const draft = visitDrafts.get(record);
    if (draft && draft.roundId === record.roundId) return draft;
    const saved = record.followupDraft;
    return saved && saved.roundId === record.roundId ? saved : null;
  }

  function readVisitDraft(form, record) {
    const Form = form.ownerDocument.defaultView.FormData;
    const data = new Form(form);
    const details = {}, options = {};
    for (const control of form.querySelectorAll("[data-wb-detail]")) {
      if (control.disabled && control.dataset.wbLinkageFixed!=="true" || control.closest("[hidden]")) continue;
      const key = control.dataset.wbDetail;
      if (control.tagName === "SELECT") {
        const selected = [...control.selectedOptions].filter(option => option.value && !option.disabled);
        if (!selected.length) continue;
        details[key] = control.multiple ? selected.map(option => option.textContent) : selected[0].textContent;
        options[key] = control.multiple ? selected.map(option => option.value) : selected[0].value;
      } else if (control.value.trim()) {
        details[key] = control.value.trim();
      }
    }
    return {
      roundId:record.roundId, result:String(form.elements.result?.dataset.wbLinkageFixed==="true" ?
        form.elements.result.value : data.get("result") || ""), note:String(data.get("note") || "").trim(),
      nextAt:String(data.get("nextAt") || ""), details, options
    };
  }

  function draftKey(draft) {
    return JSON.stringify(draft, (_,value) => value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(Object.keys(value).sort().map(key => [key,value[key]])) : value);
  }

  function taskFormConfig(record, root) {
    if (record.callState && record.roundId && record.followupSchema?.roundId === record.roundId) return record.followupSchema;
    return window.DReview21DccFollowupFields.taskForm(record,root?.ownerDocument?.defaultView,DSession.context());
  }

  function visitDefinitions(config) {
    const keyOf = window.DReview21DccFollowupFields.fieldKey;
    return new Map(config.fields.map(field => [keyOf(field) || `field:${field.id}`,field]));
  }

  function normalContact(record) {
    return ["已接通","正常接通"].includes(record.callContact);
  }

  const smartFillRequests = new WeakMap();
  function smartFillContext(record, schema, form) {
    const field = Array.isArray(schema?.fields) ? visitDefinitions(schema).get('contactStatus') : null;
    let contact = record.callContact || '', source = 'call', selected = '';
    if (field) {
      source = 'form';
      const control = form?.querySelector('[data-wb-detail="contactStatus"]');
      const draft = !form && visitDraft(record);
      selected = control ? (control.disabled && control.dataset.wbLinkageFixed!=="true" ? '' : control.value) :
        draft?.options?.contactStatus ?? draft?.details?.contactStatus ?? '';
      const option = (field.options || []).find(item => item.enabled !== false &&
        [item.id,item.businessKey,item.label].includes(selected));
      if (selected && !option && field.type !== 'text') {
        return {key:'',contact:'',source,message:'当前接触状态已失效，请重新选择有效选项。'};
      }
      const aliases = option ? [option.businessKey,option.id,option.label] : field.type === 'text' ? [selected] : [];
      contact = aliases.some(value => ['已接通','正常接通'].includes(value)) ? '已接通' : option?.label || (field.type === 'text' ? selected : '') || '';
    }
    if (!record.taskId || !record.roundId) return {key:'',contact,source,message:'当前任务缺少有效轮次，暂不能智能填单。'};
    if (form && (form.dataset.record !== record.id || form.dataset.round !== record.roundId)) {
      return {key:'',contact,source,message:'任务或轮次已变化，请重新打开填写表单。'};
    }
    const connected = ['已接通','正常接通'].includes(contact);
    if (!connected || source === 'call' && !['active','aftercall'].includes(record.callState)) {
      return {key:'',contact,source,message:source === 'form' ?
        selected ? '当前接触状态不是已接通，智能填单暂不可用。' : '选择接触状态为已接通后可智能填单。' : '通话接通后可用'};
    }
    return {key:JSON.stringify([record.taskId,record.roundId,source,selected,contact,record.callTiming?.startedAt || null]),
      contact,source,message:''};
  }

  function smartFillAccess() {
    try { return window.DIntegrationApplications?.status(DSession.context(),'formFilling') || {status:'unavailable'}; }
    catch (_) { return {status:'unavailable'}; }
  }

  function smartFillAccessMessage(access) {
    return access?.status === 'unconnected' ? '当前租户未关联智能填单，请在智能体关联中配置后使用。' :
      '智能填单配置暂不可用，可继续人工填写。';
  }

  function smartFillTools(record, ui) {
    const context = smartFillContext(record,taskFormConfig(record,ui.root));
    const key = context.key, access = smartFillAccess();
    const connected = access.status === 'connected' && Boolean(access.application?.id);
    const latest = smartFillRequests.get(record);
    const request = key && latest?.key === key && latest.root === ui.root ? latest : null;
    const message = !key ? context.message : !connected ? smartFillAccessMessage(access) : request?.message || '';
    return `<div class="wb-actions"><button type="button" class="button secondary" data-wb-smart-fill${
      !key || !connected || request?.pending ? " disabled" : ""}>智能填单</button>
      <span class="wb-meta" role="status" data-wb-smart-fill-status>${ui.esc(message)}</span></div>`;
  }

  function applySmartFill(form, schema, values) {
    const definitions = visitDefinitions(schema);
    const Event = form.ownerDocument.defaultView.Event;
    const linkage = window.DFieldLinkageWorkbench;
    if (linkage?.sync(form)?.ok===false) return 0;
    let filled = 0;
    for (const control of form.querySelectorAll('[data-wb-detail],[name="result"],[name="note"],[name="nextAt"]')) {
      const key = control.dataset.wbDetail || control.name;
      if (key === "contactStatus" || !Object.hasOwn(values,key) || control.disabled || control.readOnly || control.closest('[hidden]')) continue;
      const value = values[key];
      if (control.tagName === "SELECT") {
        if ([...control.selectedOptions].some(option => option.value)) continue;
        const candidates = Array.isArray(value) ? value : [value];
        if (!control.multiple && candidates.length !== 1) continue;
        const options = definitions.get(key)?.options || [];
        const allowed = [...control.options].filter(option => option.value && !option.disabled);
        const choices = candidates.filter(item => typeof item === "string" || typeof item === "number").map(item => {
          const text = String(item);
          const id = options.find(option => option.businessKey === text)?.id;
          return allowed.find(option => option.value === text || option.value === id || option.textContent === text);
        }).filter(Boolean);
        if (!choices.length) continue;
        if (linkage?.canSuggest(form,schema,control,control.multiple ? choices.map(choice=>choice.value) : choices[0].value)===false) continue;
        for (const choice of choices) choice.selected = true;
        if (key === "result") control.dispatchEvent(new Event("change",{bubbles:true}));
      } else {
        if (control.value.trim() || !["string","number"].includes(typeof value)) continue;
        const text = String(value).trim();
        if (!text || control.maxLength >= 0 && text.length > control.maxLength) continue;
        if (linkage?.canSuggest(form,schema,control,text)===false) continue;
        const previous = control.value;
        control.value = text;
        if (!control.value || !control.validity.valid) {
          control.value = previous;
          continue;
        }
      }
      filled++;
      linkage?.sync(form);
    }
    if (filled) form.dispatchEvent(new Event("input",{bubbles:true}));
    return filled;
  }

  function bindSmartFill(form, record, root, ui, owned, state) {
    const button = form.querySelector('[data-wb-smart-fill]');
    if (!button) return;
    let previousKey;
    const refresh = () => {
      const context = smartFillContext(record,taskFormConfig(record,root),form);
      const existing = smartFillRequests.get(record);
      if (previousKey !== undefined && previousKey !== context.key || existing?.form && existing.form !== form) {
        smartFillRequests.delete(record);
      }
      previousKey = context.key;
      const latest = smartFillRequests.get(record);
      const request = latest?.key === context.key && latest?.form === form ? latest : null;
      const access = smartFillAccess();
      const connected = access.status === 'connected' && Boolean(access.application?.id);
      button.disabled = !context.key || !connected || Boolean(request?.pending);
      const status = form.querySelector('[data-wb-smart-fill-status]');
      if (status) status.textContent = !context.key ? context.message : !connected ? smartFillAccessMessage(access) :
        request?.message || '可根据本次填写内容智能填单。';
      return context;
    };
    const onContactChange = event => {
      if (event.target?.dataset?.wbDetail === 'contactStatus') refresh();
    };
    form.addEventListener('change',onContactChange);
    form.addEventListener('input',onContactChange);
    refresh();
    button.addEventListener("click", async () => {
      const basis = refresh(), key = basis.key;
      const latest = smartFillRequests.get(record);
      if (!key || button.disabled || !form.isConnected || form.dataset.round !== record.roundId || owned(record.id) !== record ||
          ui.canSave?.() === false || (latest?.key === key && latest.root === root && latest.pending)) return;
      const context = DSession.context();
      const access = window.DIntegrationApplications?.status(context,'formFilling');
      const request = {key,root,form,pending:false,message:""};
      smartFillRequests.set(record,request);
      if (access?.status !== 'connected') {
        request.message = smartFillAccessMessage(access);
        refresh();
        return;
      }
      request.pending = true;
      request.message = '正在智能填单…';
      refresh();
      const applicationId = access.application.id;
      const connectionKey = access.application.connectionKey || applicationId;
      let result;
      try {
        result = await window.DSkynetSmartFill.query(context,{applicationId,connectionKey,
          call:{taskId:record.taskId,roundId:record.roundId,tenantId:record.tenant,method:record.callMode,
            contact:basis.contact,contactSource:basis.source,
            startedAt:record.callTiming?.startedAt,endedAt:record.callTiming?.endedAt},
          lead:{series:record.series,dealer:record.dealer}
        });
      } catch (_) { /* Keep manual handling available when the simulated call fails. */ }

      if (smartFillRequests.get(record) !== request) return;
      const liveForm = root.querySelector('[data-wb-smart-fill]')?.closest('form');
      const current = DSession.context();
      if (!liveForm?.isConnected || liveForm !== form || liveForm.dataset.record !== record.id || liveForm.dataset.round !== record.roundId ||
          current?.account.id !== context.account.id || current?.scope.id !== context.scope.id ||
          current?.scope.tenant?.brandId !== context.scope.tenant?.brandId ||
          owned(record.id) !== record || smartFillContext(record,taskFormConfig(record,root),liveForm).key !== key) {
        smartFillRequests.delete(record);
        if (form.isConnected) refresh();
        return;
      }
      request.pending = false;
      if (ui.canSave?.() === false) {
        request.message = '任务状态已变化，请重新打开后填单。';
        refresh();
        return;
      }
      const currentAccess = window.DIntegrationApplications.status(current,'formFilling');
      const values = result?.values;
      const usable = result?.status === 'available' && currentAccess.status === 'connected' &&
        currentAccess.application?.id === applicationId &&
        (currentAccess.application.connectionKey || currentAccess.application.id) === connectionKey && values && typeof values === "object" && !Array.isArray(values);
      const schema = taskFormConfig(record,root);
      if (state) {
        const labels = new Map([...visitDefinitions(schema)].map(([field,definition])=>[field,definition.label]));
        labels.set('result',labels.get('visitResult') || '回访结果');
        labels.set('note',labels.get('visitDesc') || '回访描述');
        labels.set('nextAt',labels.get('nextVisitTime') || '下次回访时间');
        labels.delete('contactStatus');
        const saved = window.DSmartFillReview?.retain(state,current,record,{roundId:record.roundId,
          application:access.application,outcome:usable ? 'available' : result?.status==='timeout' ? 'timeout' : 'unavailable',
          values:usable ? values : {},labels,contact:basis.contact});
        if (!saved?.ok) {
          request.message = saved?.error || '填单记录暂不可保存，请继续人工填写。';
          refresh();
          return;
        }
      }
      const filled = usable ? applySmartFill(liveForm,schema,values) : 0;
      request.message = filled ? `已补齐 ${filled} 个空白字段（模拟），请核对后提交。` :
        usable ? '本次没有可补齐的空白字段。' :
        result?.status === 'timeout' ? '智能填单超时，暂无建议，可继续人工填写。' :
        '智能填单结果不可用，暂无建议，可继续人工填写。';
      refresh();
    });
  }

  function configuredResults(field, allowed) {
    if (field?.type !== "select") return allowed.map(label => ({value:label,label}));
    const choices = new Map();
    const normal = value => value === "无人接听下发" ? "无人接下发" : value;
    for (const option of field.options || []) {
      if (option.enabled === false) continue;
      const value = [option.businessKey,option.id,option.label].map(normal).find(key => allowed.includes(key));
      if (value && !choices.has(value)) choices.set(value,{value,label:option.label});
    }
    return [...choices.values()];
  }

  const requiredMark = required => required ? '<span class="wb-required" aria-hidden="true">*</span>' : "";

  function resultSelect(results, selected, ui, required = true) {
    const e = ui.esc;
    return `<select name="result"${required ? " required" : ""}><option value="">${results.length ? "请选择" : "暂无适用的回访结果"}</option>${
      results.map(option => `<option value="${e(option.value)}"${option.value === selected ? " selected" : ""}>${e(option.label)}</option>`).join("")}</select>`;
  }

  function followupField(field, key, details, options, ui, visible=true) {
    const e = ui.esc;
    const value = details[key] ?? "";
    const selected = options[key] ?? value;
    const selectedValues = Array.isArray(selected) ? selected : [selected];
    const name = key.startsWith("field:") ? "business-" + field.id : key;
    const binding = ` name="${e(name)}" data-wb-detail="${e(key)}" data-wb-field-label="${e(field.label)}"`;
    const required = field.required && visible ? " required" : "";
    const attrs = binding + required + (visible ? "" : " disabled");
    const wide = field.type === "textarea" ? ' class="wb-wide"' : "";
    const condition = key === "expectStoreTime" ? ` data-wb-store-time data-wb-required="${Boolean(field.required)}"${visible ? "" : " hidden"}` : "";
    let control;
    if (field.type === "interface") {
      const available = availableValue(value) !== null;
      return `<div class="wb-field-readonly"${condition}${field.required && !available ? ` data-wb-required-unavailable="${e(field.label)}"` : ""}>
        <span>${requiredMark(field.required)}${e(field.label)}</span><span>${displayValue(ui,value)}</span></div>`;
    }
    if (["select","multiselect"].includes(field.type)) {
      const multi = field.type === "multiselect";
      const items = (field.options || []).filter(option => option.enabled !== false);
      const selectedIds = items.filter(option => selectedValues.includes(option.id)).map(option => option.id);
      const values = selectedIds.length ? selectedIds : items.filter(option => selectedValues.includes(option.label)).map(option => option.id);
      control = `<select${attrs}${multi ? ' multiple size="3"' : ""}>${multi ? "" : '<option value="">请选择</option>'}${items.map(option =>
        `<option value="${e(option.id)}"${values.includes(option.id) ? " selected" : ""}>${e(option.label)}</option>`).join("")}</select>`;
    } else if (field.type === "textarea") {
      control = `<textarea${attrs} rows="2" maxlength="${key === "remark" ? 300 : 2000}">${e(value)}</textarea>`;
    } else {
      const type = key === "altPhone" ? "tel" : {datetime:"datetime-local",date:"date",number:"number"}[field.type] || "text";
      control = `<input${attrs} type="${type}"${type === "number" ? ' step="any"' : ' maxlength="200"'} value="${e(value)}" placeholder="请输入">`;
    }
    return `<label${wide}${condition}><span>${requiredMark(field.required)}${e(field.label)}</span>${control}</label>`;
  }

  function roundLeadStatusField(record,details,options,ui) {
    const profile = window.DSkynetConfig?.intakeFieldProfile(DSession.context(),record.categoryId);
    const field = profile?.fields.find(item => item.key === "leadStatus");
    if (!field?.options?.length) return "";
    const value = options.leadStatus || details.leadStatus || record.skynet.lastRound?.leadStatus ||
      record.leadStatus || record.businessImportSnapshot?.values?.leadStatus;
    const selected = window.DSkynetIntake.canonicalOption(field,value)?.value;
    const e = ui.esc;
    return `<label>本轮线索状态<select name="leadStatus" data-wb-detail="leadStatus" data-wb-field-label="线索状态">
      <option value="">待补充</option>${field.options.map(option => `<option value="${e(option.value)}"${
        option.value === selected ? " selected" : ""}>${e(option.label)}</option>`).join("")}</select></label>`;
  }

  function followupForm(record, ui, editable) {
    const e = ui.esc;
    const completed = taskEnded(record) || nurturePending(record) || nurtureHandoff(record) || deliveryState(record);
    const savedDraft = editable && visitDraft(record);
    const draft = savedDraft || (!editable && completed ? {result:record.followupResult,note:record.followupNote,nextAt:record.nextAt} : {});
    const config = taskFormConfig(record,ui.root);
    const definitions = visitDefinitions(config);
    const label = (key,fallback) => e(definitions.get(key)?.label || fallback);
    const allowed = editable ? normalContact(record) ? connectedResults : missedResults : [...new Set([...connectedResults,...missedResults])];
    const results = configuredResults(definitions.get("visitResult"),allowed);
    const chosenResult = results.some(option => option.value === draft.result) ? draft.result : "";
    const needNext = !editable || nextResults.has(chosenResult);
    const needStore = !editable || storeVisitResults.has(chosenResult);
    const defaults = savedDraft ? draft.details || {} : record.visitDetails || {};
    const selectedOptions = savedDraft ? draft.options || {} : record.visitOptionValues || {};
    const freshRound = editable && !savedDraft;
    const details = freshRound ? {...defaults,...(record.skynet?{intentLevel:undefined}:{}),contactStatus:undefined} : defaults;
    const options = freshRound ? {...selectedOptions,...(record.skynet?{intentLevel:undefined}:{}),contactStatus:undefined} : selectedOptions;
    const standard = new Set(["contactStatus","visitResult","nextVisitTime","visitDesc"]);
    const more = [...definitions].filter(([key]) => !standard.has(key));
    const previous = record.followupHistory?.at(-1);
    const contactField = definitions.get("contactStatus");
    const savedContact = previous?.details?.contactStatus || previous?.contact || record.visitDetails?.contactStatus || record.callContact;
    const contactInput = contactField ? followupField(contactField,"contactStatus",details,options,ui) : "";
    const lastVisit = previous?.at || previous?.date || record.lastFollowupAt;
    const tag = editable ? "form" : "section";
    const attribute = editable ? "data-followup-form" : "data-wb-followup-preview";
    return `<${tag} class="wb-form" ${attribute} data-record="${e(record.id)}" data-round="${e(record.roundId || "")}">
      <h3 class="wb-section-title">回访提交</h3>
        <p class="wb-meta">${e(config.label)}${editable ? "" : " · " + (completed ? "已保存的回访" : "通话结束后可填写")}</p>
      ${config.message ? `<p class="wb-placeholder">${e(config.message)}</p>` : ""}
      ${editable && record.followupDraft?.roundId === record.roundId && record.followupDraft ? '<p class="notice">本轮回访已暂存，可继续填写。</p>' : ""}
      ${editable ? smartFillTools(record,ui) : ""}
      ${editable ? window.DLeadRatingWorkbench?.demo(record,config,ui) || "" : ""}
      <fieldset class="wb-dcc-form-grid"${editable ? "" : " disabled"}>
        <div class="wb-form-context"><span>上次回访时间 · ${lastVisit ? e(displayTime(lastVisit)) : "暂无回访"}</span></div>
        ${editable ? contactInput :
          `<div class="wb-field-readonly"><span>${label("contactStatus","接触状态")}</span><span>${displayValue(ui,savedContact)}</span></div>`}
        <label><span>${requiredMark(editable)}${label("visitResult","回访结果")}</span>${resultSelect(results,chosenResult,ui)}</label>
        <label class="wb-next-time"${needNext ? "" : " hidden"}><span>${requiredMark(editable)}${label("nextVisitTime","下次回访时间")}</span><input type="datetime-local" name="nextAt" value="${e(draft.nextAt || "")}"${needNext ? " required" : " disabled"}></label>
        ${record.skynet && !definitions.has("leadStatus") ? roundLeadStatusField(record,details,options,ui) : ""}
        ${more.map(([key,field]) => followupField(field,key,details,options,ui,key !== "expectStoreTime" || needStore)).join("")}
        <label class="wb-wide"><span>${requiredMark(editable)}${label("visitDesc","回访描述")}</span><textarea name="note" required placeholder="填写本次沟通内容、客户异议和已确认结论">${e(draft.note || "")}</textarea></label>
      </fieldset>
      ${editable ? `<div class="wb-actions">
        <button type="submit" class="button primary">提交回访</button>
        <button type="button" class="button secondary" data-wb-save-draft>暂存回访</button>
        ${hasOutboundTask(record) && record.callContact === "未接听" && record.callMode === manual ? `<button type="button" class="button secondary" data-wb-action="redial" data-record="${e(record.id)}">本轮再拨一次</button>` : ""}
        <details><summary>更多作业工具</summary><p class="wb-placeholder">短信、门店查询 · ${disconnected}</p></details>
      </div>` : ""}
    </${tag}>`;
  }

  function handoffActions(record, ui) {
    if (!legacyHandoffWritable(record)) return "";
    const flow = window.DReview21Handoff;
    const recheck = flow?.mayRecheck(record);
    const target = recheck ? record.handoffTarget : flow?.destination(record);
    if (!target || !(recheck || flow?.maySubmit(record))) return "";
    return `<form class="wb-form" data-wb-handoff data-record="${ui.esc(record.id)}" data-recheck="${recheck ? "yes" : "no"}">
      <p class="muted">交回：${ui.esc(target)}${recheck ? ` · 核对原交接 ${ui.esc(record.handoffRequest)}` : ""}</p>
      <label>演示接收结果<select name="receipt" required><option value="">请选择</option><option>已接收</option><option>对方拒绝</option><option>接收待核</option></select></label>
      <div class="wb-actions"><button type="submit" class="button primary">${recheck ? "核对原交接" : "交回结果"}</button></div>
    </form>`;
  }

  function deliveryTargetName(target) {
    const type = {externalSystem:"外部系统",internalTenant:"内部租户"}[target?.type];
    return [type,target?.label || target?.id].filter(Boolean).join(" · ");
  }

  function deliveryModeLabel(delivery) {
    return delivery.modeLabel || window.DSkynetConfig?.deliveryModes?.find(mode => mode.value === delivery.mode)?.label;
  }

  function deliveryResultsMarkup(results,ui) {
    if (!results) return "";
    if (results.error) return `<p class="wb-meta" role="status">${ui.esc(results.error)}</p>`;
    if (!results.rows.length) return '<p class="wb-meta">当前下发暂无可核对的交接凭据。</p>';
    const e = ui.esc;
    const ledger = window.DSkynetDeliveryRecords;
    const rows = results.rows.map(row => `<tr data-wb-delivery-result="${e(row.status)}">
      <td>${e(deliveryTargetName(row.target))}</td><td>${e(row.requestId)}</td>
      <td>${e(ledger.statusLabel(row))}</td><td>${e(row.attempt)}</td><td>${e(row.receiptId || "—")}</td>
    </tr>`).join("");
    return `<div class="wb-delivery-leads"><table aria-label="逐目标下发结果">
      <thead><tr><th scope="col">下发目标</th><th scope="col">原请求编号</th><th scope="col">结果</th>
      <th scope="col">提交次数</th><th scope="col">接收流水／受理回执</th></tr></thead><tbody>${rows}</tbody>
    </table></div>`;
  }

  function internalMatchMarkup(match,ui) {
    if (!match) return '';
    const e=ui.esc;
    if (match.status!=='available') return `<section class="wb-internal-match is-error" data-wb-internal-store-match="${e(match.status || 'unavailable')}" role="status">
      <strong>接收租户待匹配</strong><p>${e(match.reason || '意向门店或租户关联暂不可核对。')}</p><p>请核对本轮意向门店与租户关联后重试。</p></section>`;
    const store=match.store;
    return `<section class="wb-internal-match" data-wb-internal-store-match="available"><strong>${store?.code ? '意向门店 → 接收租户' : '同品牌总部匹配'}</strong>
      ${store?.code ? `<p data-wb-matched-store>${e(store.name || '门店')}（${e(store.code)}）</p>` : ''}
      <p data-wb-matched-tenant>${e(match.tenant?.name || match.targets?.[0]?.label || '接收租户')} · ${e(match.tenant?.id || match.targets?.[0]?.id)}</p></section>`;
  }

  function internalMatchSignature(match) {
    return JSON.stringify([match?.status,match?.store?.code,match?.store?.value,match?.store?.sourceId,
      match?.store?.capabilityId,match?.store?.sourceVersion,match?.tenant?.id,match?.match?.bindingRevision]);
  }

  function deliveryCard(state,record,delivery,ui) {
    const e = ui.esc;
    const flow = window.DSkynetIntake;
    const context = DSession.context();
    const sent = delivery.status === "已下发";
    const automatic = delivery.trigger === "automatic";
    const heading = sent ? "下发结果" : "下发办理";
    const results = sent ? window.DSkynetDeliveryRecords?.forResponsibleSeat?.(record.taskId,delivery.roundId) : null;
    const status = sent && delivery.simulated ?
      (results?.rows.length ? "已提交（模拟）" : automatic ? "已自动下发（模拟）" : "已下发（模拟）") :
      delivery.status;
    const available = !automatic && flow.canDispatchDelivery(state,context,record);
    const needsReview = available && flow.deliveryReviewRequired(state,context,record);
    const review = delivery.review;
    const submitted = review?.status === "pending" || review?.status === "approved";
    const recipients = (delivery.targets || (submitted ? review.targets : []))?.filter(item=>item.type==="internalTenant")
      .map(item => item.label || item.id).filter(Boolean) || [];
    const target = recipients.length ? "内部租户 · " + recipients.join("、") :
      !sent && delivery.targetType === "internalTenant" ? "内部租户 · 按门店与组织关系匹配" : deliveryTargetName(delivery.target);
    const matched = !sent && delivery.status === '待下发' && delivery.targetType === 'internalTenant' ?
      flow.internalDeliveryMatch?.(state,context,record) : null;
    const modeLabel = deliveryModeLabel(delivery);
    const unavailableReason = delivery.status === "待下发" && !available
      ? flow.deliveryTargetWarning?.(state,context,record) || record.waitReason || "请核对当前坐席权限或下发模板版本。"
      : "";
    const meta = [delivery.templateName, delivery.templateVersion && "v" + delivery.templateVersion].filter(Boolean).join(" ");
    const stores = delivery.stores?.map(store => store.name || store.id).filter(Boolean).join("、");
    const sentTime = delivery.sentAt && displayTime(delivery.sentAt);
    const leadRows = (delivery.leads || []).map(lead => `<tr>
      <td>${lead.kind === "derived" ? "派生" : "原生"}</td>
      <td>${e(lead.localLeadCode || "—")}</td><td>${e(lead.sourceLeadCode ?? "—")}</td>
      ${automatic ? "" : `<td>${e(lead.storeName || lead.storeId || "—")}</td>`}</tr>`).join("");
    return `<section class="wb-delivery" aria-label="${heading}" data-wb-delivery-state>
      <h3>${heading} <span class="tag">${e(status)}</span></h3>
      ${meta ? `<p class="wb-meta">下发模板 ${e(meta)}</p>` : ""}
      ${delivery.typeLabel ? `<p class="wb-meta">下发类型 ${e(delivery.typeLabel)}</p>` : ""}
      ${target ? `<p class="wb-meta" data-wb-delivery-target>下发目标 ${e(target)}</p>` : ""}
      ${internalMatchMarkup(matched,ui)}
      ${modeLabel && (!automatic || modeLabel !== "自动下发") ? `<p class="wb-meta">下发方式 ${e(modeLabel)}</p>` : ""}
      ${stores ? `<p class="wb-meta">下发门店 ${e(stores)}</p>` :
        !target && delivery.targetLabel ? `<p class="wb-meta">意向门店 ${e(delivery.targetLabel)}</p>` : ""}
      ${automatic ? '<p class="wb-meta">下发触发 系统自动</p>' :
        delivery.operatorName ? `<p class="wb-meta">下发坐席 ${e(delivery.operatorName)}</p>` : ""}
      ${review?.status === "pending" ? '<p class="notice" data-wb-awaiting-delivery-review>已提交本租户管理员审核，通过后下发。</p>' : ""}
      ${review?.status === "rejected" ? `<p class="notice" data-wb-delivery-rejection>审核驳回 · ${e(review.reason)}</p>` : ""}
      ${review?.status === "approved" ? `<p class="wb-meta">审核通过 · ${e(review.reviewedByName || review.reviewedBy)}</p>` : ""}
      ${sentTime ? `<p class="wb-meta">下发时间 ${e(sentTime)}</p>` : ""}
      ${leadRows ? `<div class="wb-delivery-leads" data-wb-delivery-leads>
        <table aria-label="下发线索明细"><thead><tr><th scope="col">类型</th><th scope="col">本地线索编码</th>
          <th scope="col">传入线索编码</th>${automatic ? "" : '<th scope="col">下发门店</th>'}</tr></thead><tbody>${leadRows}</tbody></table></div>` : ""}
      ${results ? `<section data-wb-delivery-results data-record="${e(record.id)}" data-round="${e(delivery.roundId)}">
        <div class="wb-actions"><button type="button" class="button secondary" data-wb-refresh-delivery>刷新下发结果</button></div>
        <div data-wb-delivery-result-list aria-live="polite">${deliveryResultsMarkup(results,ui)}</div>
      </section>` : ""}
      ${unavailableReason ? `<p class="wb-meta">${e(unavailableReason)}</p>` : ""}
      ${available ? `<div class="wb-actions"><button type="button" class="button primary" data-wb-action="open-delivery" data-record="${e(record.id)}">${needsReview ? (review?.status === "rejected" ? "重新提交审核" : "提交下发审核") : "下发"}</button>
        ${delivery.targetType==='internalTenant' && context.scope.tenant.organization==='总部' ? `<button type="button" class="button secondary" data-wb-correct-intent-store="${e(record.id)}">补录/核对意向门店</button>` : ''}</div>` : ""}
    </section>`;
  }

  function wecomFormContent(record,wecom,ui) {
    const e = ui.esc;
    if (wecom.stage === "friendship") {
      return {action:"friendship",label:wecom.friendshipOutcome === "failed" ? "重新查询好友关系" : "核验好友关系",fields:
        `<label>模拟好友核验结果<select name="outcome" required><option value="">请选择</option>
          <option value="friend">已是好友</option><option value="notFriend">明确非好友</option><option value="failed">查询失败</option>
        </select></label>`};
    }
    if (wecom.stage === "push") {
      const addingFriend = wecom.status === "待添加好友";
      const retry = addingFriend || wecom.pushOutcome === "failed";
      return {action:"push",label:retry ? "重新推送企微培育任务" : "推送企微移交包",fields:
        `${addingFriend ? '<label class="wb-wecom-confirmation"><input type="checkbox" name="friendAdded" required>模拟已添加该客户为好友</label>' : ""}
          <label>模拟企微接收结果<select name="outcome" required><option value="">请选择</option>
            <option value="success">推送成功</option><option value="failed">推送失败</option>
          </select></label>`};
    }
    if (wecom.stage !== "completion") return null;
    const settings = window.DSkynetConfig;
    const intent = settings.roundFields.find(field=>field.key === "round.intentLevel");
    const lead = settings.intakeFieldProfile(DSession.context(),record.categoryId).fields.find(field=>field.key === "leadStatus");
    const select = (name,label,field) => field?.options?.length ? `<label>${label}<select name="${name}">
      <option value="">回包未提供</option>${field.options.map(({value,label}) => `<option value="${e(value)}">${e(label)}</option>`).join("")}
      </select></label>` : "";
    return {action:"complete",label:"模拟完成回包",fields:`<fieldset class="wb-dcc-form-grid">
      <label class="wb-wide">本轮回访结果<input name="result" maxlength="100" required placeholder="填写与策略条件对应的回访结果"></label>
      ${select("intentLevel","本轮意向等级",intent)}
      ${select("leadStatus","本轮线索状态",lead)}
      <label class="wb-wide">回访小结<textarea name="note" maxlength="1000" rows="2"></textarea></label>
    </fieldset>`};
  }

  function wecomRequestApplication(state,context,task) {
    const summary = window.DSkynetIntake?.wecomWorkbenchState?.(state,context,task);
    return summary?.canAct && summary.applicationId && summary.connectionKey ?
      {applicationId:summary.applicationId,connectionKey:summary.connectionKey} : null;
  }

  function wecomWorkbenchCard(record,wecom,ui) {
    const e = ui.esc;
    const controls = wecom.canAct && wecomFormContent(record,wecom,ui);
    const ongoing = wecom.stage === "completion";
    return `<section aria-label="企微培育" data-wb-wecom-stage="${e(wecom.stage || "")}">
      <h3 data-wb-wecom-status>${e(wecom.status)}</h3>
      <p class="wb-meta">轮次编号 ${e(wecom.roundId)} · 企微回访编号 ${e(wecom.visitId)}</p>
      <p class="wb-meta" data-wb-wecom-application>企微应用：${e(wecom.applicationName || "未关联")}</p>
      ${wecom.applicationUnavailable ? `<p class="notice wb-critical" data-wb-wecom-application-unavailable>${e(typeof wecom.applicationUnavailable === "string" ? wecom.applicationUnavailable : wecom.reason)}</p>` : ""}
      <p class="notice">${e(wecom.reason)}</p>
      ${wecom.firstPushedAt ? `<p class="wb-meta">移交包首次推送成功 ${e(displayTime(wecom.firstPushedAt))}</p>` : ""}
      ${ongoing ? `<div data-wb-wecom-followup>
        <p class="wb-meta" data-wb-wecom-last-progress>最近有效跟进 ${wecom.lastProgressAt ?
          e(displayTime(wecom.lastProgressAt)) + (wecom.lastProgressResult ? " · " + e(wecom.lastProgressResult) : "") : "暂无进展回包"}</p>
        ${wecom.followupSince ? `<p class="wb-meta">本段计时起点 ${e(displayTime(wecom.followupSince))}</p>` : ""}
        <p class="notice wb-critical" data-wb-wecom-overdue${wecom.overdue ? "" : " hidden"}>企微跟进异常 · 本轮超过 7 天未收到有效跟进回包。</p>
      </div>` : ""}
      ${controls ? `<form class="wb-form wb-wecom-form" data-wb-wecom-form="${controls.action}" data-record="${e(record.id)}"
        data-task="${e(record.taskId)}" data-round="${e(wecom.roundId)}" data-visit="${e(wecom.visitId)}">
        ${controls.fields}
        <p role="alert" hidden></p>
        <div class="wb-actions">
          ${ongoing ? '<button type="submit" class="button primary" data-wb-wecom-progress>模拟进展回包</button>' : ""}
          <button type="submit" class="button ${ongoing ? "secondary" : "primary"}" data-wb-wecom-submit>${controls.label}</button>
        </div>
      </form>` : ""}
      ${ongoing && controls ? `<div class="wb-actions" aria-label="模拟跟进时长检查">
        <span class="wb-meta">企微模拟时长检查</span>
        <button type="button" class="button secondary" data-wb-wecom-check-days="7">满 7 天</button>
        <button type="button" class="button secondary" data-wb-wecom-check-days="8">超过 7 天</button>
      </div><p class="wb-meta" data-wb-wecom-check-result role="status" hidden></p>` : ""}
    </section>`;
  }

  function elapsedCallTime(start,end = Date.now()) {
    if (!Number.isFinite(start) || start <= 0 || !Number.isFinite(end)) return "—";
    const seconds = Math.max(0,Math.floor((end - start) / 1000));
    const minutes = Math.floor(seconds / 60);
    const parts = minutes >= 60 ? [Math.floor(minutes / 60),minutes % 60,seconds % 60] : [minutes,seconds % 60];
    return parts.map(value => String(value).padStart(2,"0")).join(":");
  }

  const showCallBar = record => inCall(record) || record.callState === "aftercall" && Boolean(record.callTiming?.endedAt);

  function callBar(record,button) {
    const waiting = record.callState === "requested";
    const ended = record.callState === "aftercall";
    const connected = normalContact(record);
    const start = Number(waiting ? record.callRequestedAt : record.callTiming?.startedAt);
    const end = ended ? Number(record.callTiming.endedAt) : undefined;
    const status = waiting ? "呼叫中" : ended ? connected ? "通话已结束" : "拨打已结束" :
      connected ? "已接通" : "通话中";
    const clockLabel = waiting ? "拨号计时" : ended && !connected ? "拨打耗时" : "通话计时";
    const actions = waiting ? button("确认已拨出", "dialed") + button("取消拨打", "failed", "secondary") :
      connected ? button("挂断", "end-connected", "danger") :
      button("确认接通", "connected", "secondary") + button("挂断（已接通）", "end-connected", "danger") +
      button("未接听，结束拨打", "end-missed", "secondary");
    return `<div class="wb-call-status"><strong>${status}</strong><span>${clockLabel}</span>
      <time class="wb-call-timer" data-wb-call-timer${ended ? "" : " data-running"} data-start="${Number.isFinite(start) ? start : ""}" data-end="${Number.isFinite(end) ? end : ""}">${elapsedCallTime(start,end)}</time></div>
      ${ended ? "" : `<div class="wb-actions">${actions}</div>`}`;
  }

  function taskActions(state, record, mode, ui) {
    const e = ui.esc;
    const button = (label, action, style = "primary") =>
      `<button type="button" class="button ${style}" data-wb-action="${action}" data-record="${e(record.id)}">${label}</button>`;
    if (window.DLeadRatingWorkbench?.pending(record)) return '<h3>正在结算线索评级</h3><p class="notice">回访已经保存。智能体返回后，系统按规则输出评级并自动继续本轮办理。</p>';
    const delivery = deliveryState(record);
    if (delivery) return deliveryCard(state,record,delivery,ui);
    if (showCallBar(record)) return callBar(record,button);
    if (record.callState === "aftercall") return "";
    if (nurturePending(record)) {
      const processing = record.skynet.processing;
      if (processing?.waitingForColdWindow) {
        return `<h3>等待下一轮冷线索培育</h3><p class="notice" data-wb-cold-window>${e(record.waitReason)}</p>`;
      }
      const fields = window.DSkynetIntake?.roundSupplementFields?.(state,DSession.context(),record,
        ui.root?.ownerDocument?.defaultView);
      const missingKeys = processing?.missingFieldKeys || [];
      const responsibility = fields?.length ? "当前跟进坐席" :
        processing?.waitingForTarget || processing?.waitingForTemplate || processing?.waitingForCold ||
          processing?.waitingForDeliveryTarget ? "配置人员核对" :
        processing?.waitingForPredictiveHandoff ? (record.skynet.predictiveHandoff?.stage==="admin"?"管理员人工判断":"等待本轮回调或 AI 结果") :
        missingKeys.includes("previous.tags") ? "等待对应话单的通话标签" :
        processing?.followupRoundId && missingKeys.some(key=>key.endsWith(".callStatus")) ? "等待本轮对应话单" :
        processing?.missingFields?.length ? "等待规则所需的业务数据" : "等待核对任务";
      return `<h3>待处理</h3><p class="wb-meta" data-wb-waiting-owner>处理责任 · ${e(responsibility)}</p>
        <p class="notice" data-wb-nurture-pending>${e(processing.waitingForRating && fields?.length ?
          "本轮回访需补录意向级别，请补录后继续办理。" : record.waitReason || "培育任务待处理。")}</p>
        ${fields?.length ? `<div class="wb-actions">${button("补录本轮资料", "supplement-round")}</div>` : ""}`;
    }
    if (nurtureHandoff(record)) {
      if (record.taskStatus === "待企微培育") {
        const service = window.DSkynetIntake;
        const context = DSession.context();
        const wecom = service?.wecomWorkbenchState?.(state,context,record) || service?.wecomAssignmentState?.(state,context,record);
        if (wecom) return wecomWorkbenchCard(record,wecom,ui);
      }
      const reason = {
        待AI外呼:"等待 AI 外呼任务执行及结果回传。",
        待预外呼:"等待预外呼安排，来电时通过接听完成承接。",
        待企微培育:"等待企微任务承接及结果回传。"
      }[record.taskStatus];
      return `<h3>${e(record.taskStatus)}</h3><p class="notice">${e(reason)}</p>
        ${record.waitReason && record.waitReason !== reason ? `<p class="wb-meta">${e(record.waitReason)}</p>` : ""}`;
    }
    if (record.taskStatus === "已结束") return "";
    if (record.taskStatus === "已完成" && !legacyHandoffWritable(record)) {
      return !record.skynet && record.handoffState ? `<p class="notice">处理状态：${e(record.handoffState)}</p>` : "";
    }
    const decisions = record.followupResult && record.taskStatus === "已完成" && !record.decision
      ? `<p class="muted">本轮回访已保存。确认后续处理方式。</p><div class="wb-actions">${button("确认下发", "decision-yes")}${button("确认不下发", "decision-no", "secondary")}</div>`
      : record.decision ? `<p class="notice">处理状态：${e(record.handoffState || (record.decision === "是" ? "待交接" : "本地结案"))}</p>
        ${record.decision === "是" && record.taskStatus === "已完成" ? handoffActions(record, ui) : ""}` : "";
    if (record.taskStatus === "已完成") return record.skynet ? "" : decisions;
    if (!hasOutboundTask(record)) return '<p class="notice">请从已分配的外呼任务发起拨打。</p>';
    if (unarranged(record)) return '<p class="notice">来件已接收，任务待安排。</p>';
    if (record.nextAt && Date.parse(record.nextAt + '+08:00') > Date.now()) {
      return '<p class="notice">已安排下次跟进，请在约定日期继续办理。</p>';
    }
    if (!mode) return '<p class="notice">请先从右上角「座席登录」选择外呼方式。</p>';
    if (mode !== manual) return '<p class="notice">当前为预外呼模式。本任务需要人工外呼时，请切换坐席工作方式。</p>';
    if (state.records.some(item => item !== record && item.ownerId === state.seatId && activeCalls.has(item.callState))) {
      return '<p class="muted">请先处理上一轮回访。</p>';
    }
    return `<div class="wb-actions">${button(record.nextAt ? "继续跟进" : "发起拨打", "dial")}</div>`;
  }

  const disconnected = "暂未对接数据";
  const dccQueues = [["pendingFollowup","待跟进"],["following","跟进中"],["followed","已跟进"],["pendingDelivery","待下发"],["sent","已下发"]];
  const followupFilters = [["all","全部安排"],["new","未安排跟进"],["today","今日跟进"],["overdue","逾期"],
    ["future","未来跟进"],["handoff","待承接"]];
  const queueEmptyText = {
    pendingFollowup:"暂无待跟进线索",following:"暂无跟进中的线索",followed:"暂无已跟进线索",pendingDelivery:"暂无待下发线索",sent:"暂无已下发线索"
  };
  const dccTabs = [["rating","智能预评"],["scripts","推荐话术"],["details","线索详情"],["records","回访记录"],["profile","客户画像"]];
  const storeVisitResults = new Set(["已邀约到店","已预约试驾","下发门店","试驾线索下发"]);
  const visitDrafts = new WeakMap();
  const visitBaselines = new WeakMap();
  let activeWorkbench = null;

  function workbenchView(state) {
    const key = state.tenant + "|" + state.seatId;
    if (activeWorkbench?.key !== key) {
      activeWorkbench = {key,queue:"",followupFilter:"all",keyword:"",tab:"",assistant:null,scroll:new Map()};
    }
    return activeWorkbench;
  }

  function availableValue(value) {
    if (Array.isArray(value)) value = value.filter(Boolean).join("、");
    return value !== "" && value != null && value !== "-" && value !== "—" && typeof value !== "object" ? value : null;
  }

  function displayValue(ui, value) {
    const available = availableValue(value);
    return available === null ? '<span class="wb-placeholder">' + disconnected + '</span>' : ui.esc(available);
  }

  function dccFieldList(ui, fields) {
    const known = fields.filter(([,value]) => availableValue(value) !== null);
    const rows = known.map(([label,value,copy]) =>
      `<div><dt>${ui.esc(label)}</dt><dd>${displayValue(ui,value)}${copy && value ?
        ` <button type="button" class="button secondary" data-wb-copy="${ui.esc(value)}" aria-label="复制${ui.esc(label)}">复制</button>` : ""}</dd></div>`).join("");
    return (rows ? `<dl class="wb-dcc-fields">${rows}</dl>` : "") +
      (known.length < fields.length ? `<p class="wb-placeholder">${known.length ? "部分资料 · " : ""}${disconnected}</p>` : "");
  }

  function dccQueue(record) {
    const status = deliveryStatus(record);
    if (status === "已下发") return "sent";
    if (record.callState === "active") return "following";
    if (record.callState === "requested") return record.callContact === "未接听" ? "followed" : "pendingFollowup";
    if (record.callState === "aftercall") return "followed";
    if (status === "待下发") return "pendingDelivery";
    if (status === "待下发审核" || taskEnded(record)) return "followed";
    if (nurturePending(record) && record.skynet.processing?.followupRoundId) return "followed";
    if (nurtureHandoff(record) && record.taskStatus !== "待预外呼") return "following";
    return "pendingFollowup";
  }

  function isEntryDelivery(record) {
    const delivery = record.skynet?.delivery;
    return Boolean(delivery?.directStore || delivery?.directDeliveryTarget || delivery?.event === "接入后");
  }

  function dccExecutionMode(record,queue) {
    const normalize = window.DSkynetIntake.nurtureMethod;
    const {skynet} = record;
    if (record.callState) return normalize(record.callMode) || normalize(record.requiredMode);
    if (queue === "pendingFollowup" || queue === "following") {
      return normalize(record.requiredMode) || normalize(skynet?.processing?.method);
    }
    const delivery = skynet?.delivery;
    if (isEntryDelivery(record)) return "";
    const currentRoundId = record.roundId || skynet?.roundId;
    const roundId = delivery?.roundId || skynet?.processing?.followupRoundId || currentRoundId;
    const latestVisit = record.followupHistory?.at(-1);
    const visit = roundId ? record.followupHistory?.findLast(item => item.roundId === roundId) : latestVisit;
    const round = skynet?.lastRound?.roundId === roundId ? skynet?.lastRound :
      skynet?.completedRounds?.find(item => item.roundId === roundId);
    const recorded = normalize(visit?.callMode) || normalize(visit?.callType) || normalize(round?.callMethod);
    if (recorded) return recorded;
    if (roundId && (roundId !== currentRoundId || latestVisit?.roundId && latestVisit.roundId !== roundId)) return "";
    return normalize(record.callMode) || normalize(record.requiredMode);
  }

  function followupFilterFor(record,today) {
    if (nurtureHandoff(record)) return "handoff";
    if (!record.nextAt) return "new";
    const date = String(record.nextAt).slice(0,10);
    return date < today ? "overdue" : date > today ? "future" : "today";
  }

  function focusWorkbenchTask(view,record,today) {
    selectedTaskId = record.id;
    view.queue = dccQueue(record);
    view.keyword = "";
    if (view.queue === "pendingFollowup" && view.followupFilter !== "all" &&
        view.followupFilter !== followupFilterFor(record,today)) view.followupFilter = "all";
  }

  function dccTaskList(state, records, selected, ui) {
    const e = ui.esc;
    const context = DSession.context();
    return `<div class="wb-list">${records.map(record => {
      const wecom = record.taskStatus === "待企微培育" && window.DSkynetIntake?.wecomWorkbenchState?.(state,context,record);
      const delivery = record.skynet?.delivery;
      const autoSent = delivery?.trigger === "automatic" && delivery.status === "已下发" && delivery.simulated;
      const label = wecom?.overdue ? "企微跟进异常" : autoSent ? "已自动下发（模拟）" :
        deliveryStatus(record) || (record.criticalReminder ? "关键提醒" : progress(record));
      return `<button type="button" class="wb-item" data-wb-select="${e(record.id)}" aria-current="${record.id === selected?.id}">
        <span class="wb-task-line"><strong>${e(record.name || "未命名客户")}</strong>
          ${record.intentLevel ? `<span class="tag">${e(record.intentLevel)}级</span>` : ""}
          ${record.nextAt ? `<small>${e(displayTime(record.nextAt))}</small>` : ""}</span>
        <span class="wb-task-line"><small>${e(record.phone || "号码未记录")}${record.series ? " · " + e(record.series) : ""}</small>
          <span class="tag${record.criticalReminder || wecom?.overdue ? " wb-critical" : ""}"${wecom?.stage === "completion" ? " data-wb-wecom-queue-status" : ""}>${e(label)}</span></span>
        <span class="wb-task-line"><small>${e(record.taskId)}${record.skynet?.roundNumber ?
          " · 第 " + e(record.skynet.roundNumber) + " 轮" : ""}${record.requiredMode ? " · " + e(record.requiredMode) : ""}</small></span>
      </button>`;
    }).join("")}</div>`;
  }

  function visibleTasks(view, tasks) {
    const keyword = view.keyword.toLowerCase();
    const results = tasks.filter(record => dccQueue(record) === view.queue &&
      (view.queue !== "pendingFollowup" || view.followupFilter === "all" || followupFilterFor(record,view.today) === view.followupFilter) &&
      (!keyword || [record.phone,record.name,record.taskId,record.originalKey,record.skynet?.roundId]
        .some(value => String(value || "").toLowerCase().includes(keyword))));
    if (view.queue === "followed") {
      const priority = record => record.callState === "aftercall" ? 0 :
        deliveryStatus(record) === "待下发审核" ? 1 : nurturePending(record) ? 2 : 3;
      return results.sort((first,second) => priority(first)-priority(second));
    }
    if (view.queue !== "pendingFollowup") return results;
    const priority = record => inCall(record) ? 0 :
      {overdue:1,today:2,new:3,handoff:4,future:5}[followupFilterFor(record,view.today)];
    return results.sort((first,second) => priority(first)-priority(second) ||
      String(first.nextAt || "").localeCompare(String(second.nextAt || "")));
  }

  function hasTaskFilters(view) {
    return Boolean(view.keyword) || view.queue === "pendingFollowup" && view.followupFilter !== "all";
  }

  function dccLeftPanel(state, view, tasks, queues, selected, seat, ui) {
    const e = ui.esc;
    const rows = visibleTasks(view,tasks);
    const usage = seat ? seatUsage(state,seat) : null;
    const counts = {};
    for (const record of tasks) {
      const key = dccQueue(record);
      counts[key] = (counts[key] || 0) + 1;
    }
    const queueButtons = queues.map(([key,label]) =>
      `<button type="button" aria-pressed="${view.queue === key}" data-wb-queue="${key}"><span>${label}</span><b>${counts[key] || 0}</b></button>`).join("");
    return `<aside class="panel wb-dcc-sidebar" aria-label="培育队列" data-rtl-region="queue">
      <header class="wb-dcc-sidebar-head"><h3>培育队列</h3>
        ${usage ? `<p class="wb-placeholder">今日新增 ${e(usage.newCount ?? '待核对')} · 继续跟进 ${e(usage.followCount ?? '待核对')}</p>` : ""}
        <form class="wb-dcc-search" data-wb-search>
          <input aria-label="按姓名、手机号或任务编号搜索" name="keyword" type="search" placeholder="手机号、姓名或任务编号" value="${e(view.keyword)}">
          <button type="submit" class="button secondary">搜索</button>
        </form>
      </header>
      <div class="wb-dcc-scroll" data-wb-scroll="queue:${e(view.queue)}">
          <div class="wb-dcc-queues" aria-label="培育执行进度">${queueButtons}</div>
          ${view.queue === "pendingFollowup" ? `<label class="wb-dcc-filter">跟进安排
            <select class="wb-filter" data-wb-followup-filter>${followupFilters.map(([key,label]) =>
              `<option value="${key}"${view.followupFilter === key ? " selected" : ""}>${label}</option>`).join("")}</select></label>` : ""}
          ${view.queue === "pendingDelivery" && window.DSkynetIntake.canStageWorkbenchDeliverySamples?.(state,DSession.context()) ?
            '<div class="wb-actions"><button type="button" class="button secondary" data-wb-generate-delivery-samples>生成待下发模拟线索</button></div>' : ""}
          ${rows.length ? dccTaskList(state,rows,selected,ui) :
            `<p class="empty">${hasTaskFilters(view) ? "没有匹配的任务" : queueEmptyText[view.queue]}</p>`}
      </div>
    </aside>`;
  }

  function dccEmptyWorkspace(state,seat,mode,allTasks,tasks,view,ui) {
    let title = queueEmptyText[view.queue] || "暂无培育任务";
    let detail = "可切换左侧队列查看当前工作模式的其他任务。";
    const filtered = Boolean(seat && hasTaskFilters(view));
    if (!seat) {
      title = "当前账号未关联坐席";
      detail = "请在当前租户关联坐席账号后查看分配给自己的培育任务。";
    } else if (filtered) {
      title = "没有匹配的任务";
      detail = "清除筛选条件后，可查看当前队列的任务。";
    } else if (!mode) {
      title = "座席尚未登录";
      detail = "通过电话栏的「座席登录」选择人工外呼或预外呼。";
    } else if (mode === predictive && view.queue === "following") {
      detail = "接听预外呼来电后，对应任务会进入「跟进中」。";
    } else if (!allTasks.length && mode === manual) {
      detail = "分配给你的人工外呼培育任务会出现在「待跟进」。";
    } else if (!tasks.length && allTasks.length) {
      detail = "当前工作模式下暂无培育任务，可切换工作模式查看。";
    } else if (!tasks.length) {
      detail = "当前工作模式下暂无培育任务。";
    }
    const showSamples = seat && mode === manual && view.queue === "pendingFollowup" && !filtered &&
      !window.DSkynetIntake.hasWorkbenchSamples(state,seat.id,manual);
    return `<div class="wb-dcc-empty" data-wb-empty-workspace>
      <h3>${ui.esc(title)}</h3><p>${ui.esc(detail)}</p>
      ${filtered ? '<button type="button" class="button secondary" data-wb-clear-filters>清除筛选</button>' : ""}
      ${showSamples ? '<button type="button" class="button secondary" data-wb-generate-samples>生成模拟任务</button>' : ""}
    </div>`;
  }

  function dccLeadDetails(record, ui) {
    const native=ui.root?.ownerDocument?.defaultView;
    const fields=window.DReview21DccFollowupFields.leadImports(record,native,DSession.context());
    const rows=fields.map(({label,value,copy})=>`<div><dt>${ui.esc(label)}</dt><dd>${availableValue(value)===null ?
      '<span class="wb-placeholder">未提供</span>' : ui.esc(value)}${copy && availableValue(value)!==null ?
      ` <button type="button" class="button secondary" data-wb-copy="${ui.esc(value)}" aria-label="复制${ui.esc(label)}">复制</button>` : ""}</dd></div>`).join("");
    return `<section class="wb-imported-fields" aria-label="线索导入资料"><h4>导入字段</h4>${rows ?
      `<dl class="wb-dcc-fields">${rows}</dl>` : '<p class="wb-placeholder">暂无可展示的导入字段数据。</p>'}</section>`;
  }

  function draftLeadFields(record, ui) {
    const e = ui.esc;
    const config = taskFormConfig(record,ui.root);
    const draft = visitDraft(record);
    const details = draft ? draft.details || {} : {...record.visitDetails};
    const options = draft ? draft.options || {} : {...record.visitOptionValues};
    if (!draft) {
      delete details.contactStatus;
      delete options.contactStatus;
      if (record.skynet) {
        delete details.intentLevel;
        delete options.intentLevel;
      }
    }
    const fields = [...visitDefinitions(config)].map(([key,field]) => {
      const label = `<span>${requiredMark(field.required)}${e(field.label)}</span>`;
      if (key === "visitResult") {
        const results = configuredResults(field,[...connectedResults,...missedResults]);
        return `<label>${label}${resultSelect(results,draft?.result,ui,Boolean(field.required))}</label>`;
      }
      const required = field.required ? " required" : "";
      if (key === "nextVisitTime") return `<label>${label}<input type="datetime-local" name="nextAt" value="${e(draft?.nextAt || "")}"${required}></label>`;
      if (key === "visitDesc") return `<label class="wb-wide">${label}<textarea name="note" maxlength="2000"${required}>${e(draft?.note || "")}</textarea></label>`;
      return followupField(field,key,details,options,ui);
    });
    const heading = '<h3 class="wb-section-title" id="wb-pending-fields-title">线索填写字段</h3>';
    if (!fields.length) return `<section>${heading}<p class="wb-placeholder">${e(config.message || "当前业务分类暂无填写字段。")}</p></section>`;
    return `<form class="wb-form" ${inCall(record) ? 'data-wb-call-fields' : 'data-wb-pending-fields'} data-record="${e(record.id)}" data-round="${e(record.roundId || "")}" aria-labelledby="wb-pending-fields-title" novalidate>
      ${heading}<p class="wb-meta">${e(config.label)}</p>
      ${smartFillTools(record,ui)}
      <fieldset class="wb-dcc-form-grid">${fields.join("")}</fieldset>
      <div class="wb-actions"><button class="button secondary" type="submit" data-wb-save-precall>暂存</button></div>
    </form>`;
  }

  const historyFieldLabels = Object.freeze({contactStatus:"接触状态",gender:"性别",visitResult:"回访结果",
    intentLevel:"意向级别",altPhone:"备用电话",nextVisitTime:"下次回访时间",intentCar:"意向车辆",
    intentStore:"意向门店",purchaseType:"购车方式",planBuyTime:"计划购买时间",wecomStatus:"添加企微",
    expectStoreTime:"预计到店时间",resultReason:"结果原因",visitDesc:"回访描述",remark:"备注信息",leadStatus:"线索状态"});

  function followupFields(item) {
    const details = item.details && typeof item.details === "object" && !Array.isArray(item.details) ? item.details : {};
    const refs = (Array.isArray(item.detailFields) ? item.detailFields : []).filter(field =>
      Array.isArray(field) && typeof field[0] === "string" && field[0].trim() &&
      typeof field[1] === "string" && field[1].trim());
    const labels = new Map([...Object.entries(historyFieldLabels),...refs]);
    const keys = [...new Set([...refs.map(([key])=>key),...Object.keys(details)])];
    const fields = item.wecom ? [["企微回访编号",item.visitId],["回访小结",item.note ?? details.visitDesc]] :
      [[labels.get("contactStatus"),details.contactStatus ?? item.contact],
        [labels.get("visitDesc"),item.note ?? details.visitDesc],
        [labels.get("nextVisitTime"),(item.nextAt || details.nextVisitTime) ? displayTime(item.nextAt || details.nextVisitTime) : "未安排"]];
    if (Object.hasOwn(details,"leadStatus") || item.leadStatus!=null) fields.push([labels.get("leadStatus"),details.leadStatus ?? item.leadStatus]);
    const primary = new Set(item.wecom ? ["leadStatus","visitDesc"] : ["contactStatus","visitDesc","nextVisitTime","leadStatus"]);
    for (const key of keys) if (!primary.has(key)) fields.push([labels.get(key) || key,details[key]]);
    return fields;
  }

  function historyFieldValue(value) {
    if (typeof value === "boolean") return value ? "是" : "否";
    if (Array.isArray(value)) return value.map(historyFieldValue).filter(value=>value!=null && value!=="").join("、");
    if (value && typeof value === "object") {
      const key=["label","name","value","id"].find(key=>Object.hasOwn(value,key) && value[key]!=null && value[key]!=="");
      return key ? historyFieldValue(value[key]) : JSON.stringify(value);
    }
    return value;
  }

  function followupData(fields,ui) {
    return '<dl class="wb-dcc-fields">'+fields.map(([label,raw])=>{
      const value=historyFieldValue(raw);
      return '<div><dt>'+ui.esc(label)+'</dt><dd>'+ (value==null || value==="" ?
        '<span class="wb-placeholder">未记录</span>' : ui.esc(value))+'</dd></div>';
    }).join("")+'</dl>';
  }

  function callAnalysisHistory(state,record,ui) {
    const items = window.DSkynetCallAnalysis?.list(state,record,DSession.context()) || [];
    if (!items.length) return "";
    return '<h4>通话分析</h4>'+items.map(({call,result})=>`<article class="wb-dcc-history" data-wb-analysis-row="${ui.esc(call.callId)}">
      <strong>${ui.esc(call.callMode || "通话")}</strong><small>${ui.esc(call.callAt || call.endedAt)}</small>
      ${result.status==="available" ? dccFieldList(ui,[["通话标签",result.tags],["通话小结",result.summary]]) :
        `<p class="wb-placeholder">${result.status==="pending"?"正在分析":result.status==="timeout"?"通话分析超时 · 暂未取得结果":
          result.status==="unconfigured"?"通话分析未配置 · 暂未取得结果":"通话分析 · 暂未取得结果"}</p>`}
    </article>`).join("");
  }

  function authorizedHistoryTasks(state,record) {
    const context=DSession.context();
    if (context?.scope?.kind!=='tenant' || state.tenant!==context.scope.id || record.tenant!==state.tenant ||
        !state.seats.some(seat=>seat.id===state.seatId && seat.tenant===state.tenant && seat.accountId===context.account?.id)) return null;
    const canReadOther=window.DReview21Operations?.canView?.(context) === true && DSession.allowed('PAGE-21008',context);
    return state.records.filter(item=>item.tenant===state.tenant && visibleInScope(item) &&
      (!item.brandId || item.brandId===context.scope.tenant?.brandId) &&
      (item.ownerId===state.seatId || canReadOther));
  }

  function dccRecords(state, record, ui) {
    const context=DSession.context(), e=ui.esc;
    const authorized=authorizedHistoryTasks(state,record);
    if (!authorized) return '<p class="empty">当前账号或租户资料已变化，请刷新工作台。</p>';
    const groups=window.DWorkbenchFollowupHistory?.collect(authorized,record,{
      tenantId:state.tenant,brandId:context.scope.tenant?.brandId
    }) || [];
    const visits=groups.map(group=>{
      const task=group.record;
      return `<section class="wb-followup-task" aria-label="任务 ${e(group.taskId || "ID 未记录")} 回访记录" data-wb-followup-task="${e(group.taskId)}">
        <header class="wb-followup-task-head"><h4>任务 ID：${e(group.taskId || "未记录")}</h4>
          <span class="wb-meta">${group.completed ? "已完成任务" : "当前任务"} · ${group.visits.length} 条回访</span></header>
        ${group.visits.length ? group.visits.map(({visit:item,timeText})=>{
          const actor=state.seats.find(seat=>seat.tenant===task.tenant && seat.id===item.seat);
          const meta=[["回访时间",timeText ? displayTime(timeText) : "未记录"],
            ["轮次",Number(item.roundNumber)>0 ? "第 "+item.roundNumber+" 轮" : item.roundId || "未记录"],
            ["办理坐席",actor?.name || item.seat || "未记录"],
            ["培育方式",item.callMode || item.callType || (item.wecom ? "企微培育" : "未记录")],
            ...(item.visitId && !item.wecom ? [["回访 ID",item.visitId]] : [])];
          return `<article class="wb-dcc-history wb-followup-entry" data-wb-followup-record="${e(item.visitId || item.roundId || "")}">
            <h5>${e(item.result || "回访结果未记录")}</h5>
            ${followupData(meta,ui)}${followupData(followupFields(item),ui)}
            ${window.DLeadRatingWorkbench?.history(item.ratingEvaluation,ui) || ""}
          </article>`;
        }).join("") : '<p class="wb-placeholder">该任务暂无已保存的回访数据。</p>'}
      </section>`;
    }).join("");
    const round = record.skynet?.lastRound;
    const callTags = Array.isArray(round?.callTags) && round.callTags.length ?
      dccFieldList(ui,[[`${round.callMethod || "本轮"}通话标签`,round.callTags]]) : "";
    return (visits || '<p class="empty">暂无已完成培育任务的回访记录</p>')+
      callTags+`<section data-wb-call-analysis="${e(record.id)}">${callAnalysisHistory(state,record,ui)}</section>`;
  }

  function dccProfile(state,record,ui) {
    const authorized=authorizedHistoryTasks(state,record), context=DSession.context(), e=ui.esc;
    if (!authorized) return '<p class="empty">当前账号或租户资料已变化，请刷新工作台。</p>';
    const groups=window.DWorkbenchAIProfile?.collect(authorized,record,{
      tenantId:state.tenant,brandId:context.scope.tenant?.brandId,
      enterpriseId:context.scope.tenant?.enterpriseId,calls:state.callRecords
    }) || [];
    if (!groups.length) return '<div class="wb-profile-empty"><h4>暂无 AI 外呼画像标签</h4>'+
      '<p class="wb-placeholder">AI 外呼完成并返回标签后，这里将按任务和轮次展示。</p></div>';
    const sourceNames={call:"AI 外呼话单",visit:"AI 外呼回访结果",round:"AI 外呼轮次结果"};
    return groups.map(group=>`<section class="wb-profile-task" aria-label="任务 ${e(group.taskId || "ID 未记录")} AI画像" data-wb-profile-task="${e(group.taskId)}">
      <header class="wb-followup-task-head"><h4>任务 ID：${e(group.taskId || "未记录")}</h4>
        <span class="wb-meta">AI 外呼 · ${group.entries.length} 次结果</span></header>
      ${group.entries.map(entry=>`<article class="wb-profile-entry" data-wb-profile-round="${e(entry.roundId || "")}">
        <h5>${entry.roundNumber>0 ? "第 "+e(entry.roundNumber)+" 轮" : "轮次："+e(entry.roundId || "未记录")}</h5>
        <p class="wb-meta">${e(entry.timeText ? displayTime(entry.timeText) : "时间未记录")}</p>
        ${entry.callId ? `<p class="wb-meta">通话记录 ID：${e(entry.callId)}</p>` : ""}
        <div class="wb-profile-tags">${entry.tags.length ? entry.tags.map(tag=>`<span class="tag wb-profile-tag">${e(tag)}</span>`).join(""):
          '<p class="wb-placeholder">本次 AI 外呼未返回画像标签。</p>'}</div>
        <p class="wb-meta">${e(sourceNames[entry.source] || "AI 外呼结果")}</p>
      </article>`).join("")}
    </section>`).join("");
  }

  function workbenchPreRatingKey(record) {
    return record && JSON.stringify([record.id,record.taskId,record.roundId || record.skynet?.roundId || "",record.categoryId || record.skynet?.categoryId || ""]);
  }

  function workbenchPreRatingMarkup(result,ui) {
    const e = ui.esc;
    if (!result) return '<p class="wb-placeholder">点击「智能预评」查询当前线索的预评分。</p>';
    if (result.status === "loading") return '<p class="wb-placeholder">正在查询预评分…</p>';
    if (result.status === "unconfigured") return `<p class="wb-placeholder">${e(result.message || "当前业务分类尚未关联预评分应用。")}</p>
      <p class="wb-placeholder">在「应用接入 → 外部依赖」登记预评分接口后，到「业务&客户 → 业务配置 → 业务分类 → 场景应用」关联当前二级分类。</p>`;
    const {score,level,summary,applicationName,queriedAt,simulated} = result;
    if (result.status !== "available" || !Number.isFinite(score) || score < 0 || score > 100) {
      return `<p class="wb-placeholder">${e(result.message || "暂未取得预评分，请重新点击智能预评。")}</p>`;
    }
    return `<h4>当前预评分</h4><div class="wb-pre-rating-metrics">
      <strong class="wb-pre-rating-level" aria-label="预评等级 ${e(level)}">${e(level)}</strong>
      <strong class="wb-pre-rating-score">${e(score)}<small>分</small></strong>
      <progress aria-label="预评分百分比" max="100" value="${score}"></progress>
      <span class="wb-pre-rating-percent">${e(score)}%</span></div>
      ${summary ? `<p class="wb-pre-rating-summary">${e(summary)}</p>` : ""}
      <p class="wb-placeholder wb-pre-rating-source">${e(applicationName || "预评分系统")}${simulated ? " · 模拟结果" : ""}${queriedAt ? " · " + e(displayTime(queriedAt)) : ""}</p>`;
  }

  function workbenchScriptsMarkup(result,ui) {
    const e = ui.esc;
    if (!result) return '<p class="wb-placeholder">点击「推荐话术」获取当前任务的话术。</p>';
    if (result.status === "loading") return '<p class="wb-placeholder">正在获取推荐话术…</p>';
    if (result.status === "unconfigured") return `<p class="wb-placeholder">${e(result.message || "当前业务分类尚未关联优秀话术应用。")}</p>
      <p class="wb-placeholder">可在「业务&客户 → 业务配置 → 业务分类 → 场景应用」选择话术来源。</p>`;
    if (result.status !== "available" || !Array.isArray(result.items)) return `<p class="wb-placeholder">${e(result.message || "暂未取得推荐话术，请重新点击查询。")}</p>`;
    if (!result.items.length) return '<p class="wb-placeholder">本次查询暂无推荐话术。</p>';
    return `<p class="wb-meta" data-wb-excellent-source>${e(result.applicationName)} · 本地模拟查询 · ${e(displayTime(result.queriedAt))}</p>` +
      result.items.map(item=>`<article class="wb-excellent-script"><h4>${e(item.title)}</h4><p>${e(item.content)}</p></article>`).join("") +
      '<p class="wb-placeholder">话术仅供沟通参考，请结合客户实际情况使用。</p>';
  }

  function dccAssistantBody(state, record, view, ui) {
    if (view.tab === "details") {
      const e = ui.esc;
      const skynet = record.skynet;
      const target = skynet?.processing;
      const handoff = skynet?.internalHandoff;
      const leads = window.DSkynetIntake?.workbenchNativeLeads?.(state,DSession.context(),record) || [];
      return `${dccLeadDetails(record,ui)}${handoff?.receiptId ? `<details class="wb-context-disclosure" data-wb-internal-receipt>
        <summary>内部接收来源</summary>
        ${dccFieldList(ui,[["接收流水单号",handoff.receiptId],["发送租户",handoff.senderTenantName || handoff.senderTenantId],
          ["发送方原任务",handoff.senderTaskId],["发送方原轮次",handoff.senderRoundId]])}</details>` : ""}
        ${leads.length ? `<details class="wb-context-disclosure" data-wb-related-leads>
        <summary>关联原生线索 · ${leads.length} 条</summary>
        <ul class="wb-context-leads">${leads.map(lead=>`<li><strong>${e(lead.sourceLeadCode)}</strong>
          ${lead.storeName ? `<small>${e(lead.storeName)}</small>` : ""}</li>`).join("")}</ul></details>` : ""}
        ${skynet ? `<details class="wb-context-disclosure"><summary>策略路径和模板版本</summary>
          ${dccFieldList(ui,[["线索来源",record.source],["原来件",skynet.intakeId],["轮次编号",skynet.roundId],
            ["培育模板",[skynet.nurtureTemplateName,skynet.nurtureTemplateVersion].filter(Boolean).join(" · ")],
            ["下发模板",[skynet.deliveryTemplateName,skynet.deliveryTemplateVersion].filter(Boolean).join(" · ")],
            ["目标外呼任务",[target?.targetTaskName,target?.targetTaskId].filter(Boolean).join(" · ")],
            ["冷线索分配规则",skynet.coldTransfer?.targetRuleName || skynet.coldTransfer?.targetRuleId],
            ["关联冷线索任务",skynet.coldTransfer?.taskId]].filter(([,value])=>value))}
          ${skynet.strategyPath?.length ? `<p class="wb-meta" data-skynet-strategy-path>策略路径 ${e(skynet.strategyPath
            .map(step => step.name + (step.fallback ? "（兜底）" : "")).join(" → "))}</p>` : ""}
        </details>` : ""}`;
    }
    if (view.tab === "records") return dccRecords(state,record,ui);
    if (view.tab === "rating") {
      const result = view.preRating?.key === workbenchPreRatingKey(record) ? view.preRating.result : undefined;
      const traits = record.customerTraits || {};
      const fields = [["基础画像",traits.basic],["互动表现",traits.behavior],["兴趣偏好",traits.interest],
        ["购车需求",traits.purchase],["沟通提示",record.communicationHint]].filter(([,value]) => availableValue(value) !== null);
      return `<section class="wb-pre-rating" data-wb-pre-rating aria-live="polite">${workbenchPreRatingMarkup(result,ui)}</section>` +
        (fields.length ? `<div class="wb-dcc-history"><h4>客户特征</h4>${dccFieldList(ui,fields)}</div>` : "");
    }
    if (view.tab === "scripts") {
      const result = view.excellentScripts?.key === workbenchPreRatingKey(record) ? view.excellentScripts.result : undefined;
      return `<section class="wb-excellent-scripts" data-wb-excellent-scripts aria-live="polite">${workbenchScriptsMarkup(result,ui)}</section>`;
    }
    if (view.tab === "profile") return dccProfile(state,record,ui);
    return `<p class="wb-placeholder">${disconnected}</p>`;
  }

  function dccAssistant(state, record, view, ui) {
    const e = ui.esc;
    const button = ([key,label]) => `<button type="button" role="tab" id="wb-assistant-${key}"
      aria-controls="wb-assistant-content" aria-selected="${view.tab === key}" data-wb-tab="${key}">${label}</button>`;
    return `<aside class="panel wb-dcc-assistant" aria-label="客户辅助信息" data-rtl-region="context">
      <header class="wb-dcc-assistant-head toolbar"><h3>客户辅助信息</h3><button type="button" class="button secondary" data-wb-assistant aria-label="收起客户辅助信息">收起</button></header>
      <div class="wb-assistant-tabs" role="tablist" aria-label="客户辅助信息">${dccTabs.map(button).join("")}</div>
      <div class="wb-dcc-scroll" role="tabpanel" id="wb-assistant-content" aria-labelledby="wb-assistant-${e(view.tab)}"
        data-wb-scroll="assistant:${e(record.id)}:${e(view.tab)}">${dccAssistantBody(state,record,view,ui)}</div>
    </aside>`;
  }

  function dccOverview(state, record, ui) {
    const e = ui.esc;
    const skynet = record.skynet;
    const status = deliveryStatus(record) || progress(record);
    const methods = [manual,predictive,"AI 外呼","企微培育"];
    const method = [record.requiredMode,record.callMode,skynet?.lastRound?.callMethod,
      skynet?.processing?.method].find(value=>methods.includes(value));
    const round = skynet?.roundNumber ? "第 " + skynet.roundNumber + " 轮" : record.roundId;
    const facts = [["任务编号", record.taskId],["当前轮次", round],["培育方式",method],
      ["跟进坐席",seatLabel(state,record.ownerId)],["下次跟进",record.nextAt ? displayTime(record.nextAt) : ""],
      ['当前意向',record.intentLevel]].filter(([,value])=>value);
    return `<header class="wb-dcc-overview">
      <div class="wb-identity"><h3 class="wb-customer-name">${e(record.name || "未命名客户")}</h3>
        <span class="tag">${e(status)}</span>
        <span>${e(record.phone || "号码未记录")}</span> ${record.phone ?
          `<button type="button" class="button secondary" data-wb-copy="${e(record.phone)}" aria-label="复制客户电话">复制</button>` : ""}
        <button type="button" class="button secondary" data-wb-edit-name="${e(record.id)}" aria-label="编辑客户姓名">编辑姓名</button></div>
      <dl class="wb-current-facts" data-skynet-task-context>${facts.map(([label,value])=>
        `<div><dt>${label}</dt><dd>${e(value)}</dd></div>`).join("")}</dl>
      ${record.criticalReminder ? `<p class="notice wb-critical">关键提醒 · ${e(record.criticalReminder)}</p>` : ""}
    </header>`;
  }

  function dccRoundResult(record, ui) {
    const e = ui.esc;
    const skynet = record.skynet;
    const round = skynet?.lastRound;
    if (!round?.result) return "";
    const gate = round.deliveryGate;
    const gateText = {matched:"命中下发",missing:"缺少影响下发判定的数据",notMatched:"未命中下发条件",
      notConfigured:"未配置下发条件"}[gate?.outcome];
    const delivery = deliveryStatus(record);
    const next = delivery || (nurturePending(record) ? "待处理" : skynet.coldTransfer ? "已转冷线索" :
      taskEnded(record) ? skynet.endReason || "培育结束" : skynet.roundNumber > round.number ?
        "进入第 " + skynet.roundNumber + " 轮" + (record.requiredMode ? " · " + record.requiredMode : "") :
        skynet.processing?.destination);
    const fields = [["企微回访编号",round.visitId],["回访结果",round.result],["通话状态",round.callStatus],
      ["意向等级",round.intentLevel],["线索状态",round.leadStatus],
      ["下发判定",[gateText,gate?.typeLabel].filter(Boolean).join(" · ")],["后续去向",next]].filter(([,value])=>value);
    return `<section class="wb-round-result" data-wb-round-result><h3>${round.number ? "第 " + e(round.number) + " 轮办理结果" : "最近一轮办理结果"}</h3>
      <dl>${fields.map(([label,value])=>`<div><dt>${label}</dt><dd>${e(value)}</dd></div>`).join("")}</dl></section>`;
  }

  function workbenchRender(state, ui) {
    const inline = ui.root?.hasAttribute("data-review21-inline-workbench");
    const seat = ownSeat(state);
    const mode = seat ? seatLoginMode(ui.root) : "";
    const e = ui.esc;
    const allTasks = seat ? state.records.filter(record => record.tenant === state.tenant && record.ownerId === seat.id &&
      record.taskId && record.taskStatus !== incoming && visibleInScope(record)) : [];
    const queues = mode === predictive ? dccQueues.slice(1) : dccQueues;
    const tasks = mode ? allTasks.filter(record => {
      const queue = dccQueue(record);
      if (mode === predictive && queue === "pendingFollowup") return false;
      if (isEntryDelivery(record)) return true;
      const executionMode = dccExecutionMode(record,queue);
      // Delivery is a seat action, even when the completed round used a non-seat channel.
      return executionMode === mode || ![manual,predictive].includes(executionMode) &&
        ["待下发","待下发审核","已下发"].includes(deliveryStatus(record));
    }) : allTasks;
    const view = workbenchView(state);
    if (view.mode !== undefined && view.mode !== mode) {
      view.queue = "";
      view.keyword = "";
      view.followupFilter = "all";
      selectedTaskId = "";
    }
    view.mode = mode;
    const viewWindow = ui.root?.ownerDocument?.defaultView || window;
    view.assistant ??= !viewWindow.matchMedia?.("(max-width: 780px)")?.matches;
    view.today = state.today;
    const priorityTask = tasks.find(inCall) || (!view.queue && tasks.find(record => record.callState === "aftercall"));
    if (priorityTask) focusWorkbenchTask(view,priorityTask,state.today);
    let chosen = tasks.find(record => record.id === selectedTaskId);
    if (!view.queue) {
      view.queue = chosen ? dccQueue(chosen) : mode === predictive ? "following" : mode === manual ? "pendingFollowup" :
        queues.find(([key]) => tasks.some(record => dccQueue(record) === key))?.[0] || "pendingFollowup";
    }
    const visible = visibleTasks(view,tasks);
    if (!priorityTask && !visible.includes(chosen)) chosen = visible[0];
    if (chosen) {
      selectedTaskId = chosen.id;
      view.tab ||= "details";
    }
    if (view.preRating && view.preRating.key !== workbenchPreRatingKey(chosen)) view.preRating = undefined;
    if (view.excellentScripts && view.excellentScripts.key !== workbenchPreRatingKey(chosen)) view.excellentScripts = undefined;
    const pending = tasks.find(record => record.callState === "aftercall" && record !== chosen);
    const capacity = seat && seatCapacity(state,seat);
    const busy = allTasks.some(record => activeCalls.has(record.callState));
    const otherModeBusy = busy && !tasks.some(record => activeCalls.has(record.callState));
    const controls = chosen ? taskActions(state,chosen,mode,ui) : "";
    const hasCallBar = chosen && showCallBar(chosen);
    const readOnly = chosen && (taskEnded(chosen) || nurturePending(chosen) || nurtureHandoff(chosen) || deliveryState(chosen));
    const editable = chosen && !readOnly && chosen.callState === "aftercall";
    const followup = editable ? followupForm(chosen,ui,true) : "";
    const leadFields = chosen && (view.queue === "pendingFollowup" || inCall(chosen)) ? draftLeadFields(chosen,ui) : "";
    const roundResult = chosen && !editable ? dccRoundResult(chosen,ui) : "";
    const savedVisit = readOnly && chosen.followupResult && !chosen.followupHistory?.at(-1)?.wecom ? `<details class="wb-context-disclosure">
      <summary>查看已保存的回访</summary>${followupForm(chosen,ui,false)}</details>` : "";
    const workspaceScroll = leadFields ? ["draft",chosen.id,chosen.roundId || ""].join(":") :
      ["visit",chosen?.id || "",chosen?.roundId || "",view.queue,chosen?.callState || ""].join(":");
    return `${styles()}<div class="wb-stack${inline ? " wb-inline" : ""}" data-rtl-page-type="workbench">
      <header class="wb-dcc-topbar" data-rtl-region="page-header"><h2>培育工作台</h2>
        ${chosen && !view.assistant ? `<div class="wb-actions">
          <button type="button" class="button secondary" data-wb-assistant aria-expanded="false">展开辅助信息</button>
        </div>` : ""}</header>
      ${capacity && seat.enabled !== false ? `<p class="notice">${e(capacity)}，已有待办仍可继续跟进。</p>` : ""}
      ${otherModeBusy ? '<p class="notice">另一工作模式有未完成的通话或回访，请切回原模式继续办理。</p>' : ""}
      ${busy ? "" : incomingCard(state,seat,mode,ui)}
      <div class="wb-dcc-layout${view.assistant && chosen ? "" : " wb-dcc-collapsed"}">
        ${dccLeftPanel(state,view,tasks,queues,chosen,seat,ui)}
        <section class="panel wb-dcc-center" aria-label="当前办理" data-rtl-region="workspace">
          ${chosen ? dccOverview(state,chosen,ui) : ""}
          ${hasCallBar ? `<section class="wb-call-bar" aria-label="当前通话">${controls}</section>` : ""}
          <div class="wb-dcc-scroll" data-wb-scroll="${e(workspaceScroll)}">
            ${pending ? `<button type="button" class="button secondary" data-wb-resume="${e(pending.id)}">返回待回访 · ${e(pending.name || "客户")}</button>` : ""}
            ${chosen ? (window.DLeadRatingWorkbench?.card(chosen,ui) || "") + roundResult + (controls && !hasCallBar ? `<section class="wb-workbench-action" aria-label="本任务下一步">${controls}</section>` : "") +
              leadFields + followup + savedVisit : dccEmptyWorkspace(state,seat,mode,allTasks,tasks,view,ui)}
          </div>
        </section>
        ${view.assistant && chosen ? dccAssistant(state,chosen,view,ui) : ""}
      </div>
      <dialog class="wb-queue-dialog" data-wb-name-dialog></dialog>
      <dialog class="wb-queue-dialog" data-wb-delivery-dialog aria-label="手动下发"></dialog>
      <dialog class="wb-queue-dialog" data-wb-switch-dialog aria-label="处理未保存的回访">
        <h3>本轮回访还有未保存内容</h3><p>切换后可以返回本任务继续提交回访。</p>
        <div class="wb-actions"><button type="button" class="button secondary" data-wb-switch="stay">继续填写</button>
        <button type="button" class="button secondary" data-wb-switch="discard">放弃本次修改</button>
        <button type="button" class="button primary" data-wb-switch="save">暂存并切换</button></div>
      </dialog>
    </div>`;
  }

  function seatLoginMode(root) {
    const phone = root?.ownerDocument?.defaultView;
    if (!phone?.AgentWorkbench?.telephoneStatus?.()?.online) return "";
    const mode = phone.AliCtiSeatOperations?.current?.()?.workingMode;
    return mode === "4" ? manual : mode === "5" ? predictive : "";
  }

  function openDirectDeliveryDialog(state,record,dialog,delivery,ui,onSent) {
    const e = ui.esc;
    const review = window.DSkynetIntake.deliveryReviewRequired(state,DSession.context(),record);
    dialog.innerHTML = `<form class="wb-form" data-wb-direct-delivery>
      <h3>${review ? '提交直发审核' : '确认接入直发'}</h3>
      <p class="wb-meta" data-wb-delivery-target>下发对象 ${e(deliveryTargetName(delivery.target))}</p>
      <p class="wb-meta" data-wb-direct-store>下发门店 ${e(delivery.directStore.name)} · ${e(delivery.directStore.id)}</p>
      <p class="wb-delivery-error" role="alert" hidden></p>
      <div class="wb-actions"><button type="button" class="button secondary" data-wb-cancel-delivery>取消</button>
      <button type="submit" class="button primary" data-wb-confirm-delivery>${review ? '提交审核' : '确认下发'}</button></div>
    </form>`;
    const form = dialog.querySelector('form');
    form.querySelector('[data-wb-cancel-delivery]').onclick = () => dialog.close();
    form.onsubmit = event => {
      event.preventDefault();
      const submit = form.querySelector('[data-wb-confirm-delivery]');
      if (submit.disabled || ui.canSave?.() === false) return;
      submit.disabled = true;
      const result = window.DSkynetIntake.dispatchDelivery(state,DSession.context(),record,'oneToOne');
      if (result.error) {
        submit.disabled = false;
        const feedback = form.querySelector('[role="alert"]');
        feedback.textContent = result.error;
        feedback.hidden = false;
        return;
      }
      dialog.close();
      onSent();
      ui.toast(result.delivery.status === '待下发审核' ? '已提交下发审核' : '模拟下发已登记，培育任务已结束');
    };
    dialog.showModal();
  }

  function racingStoreNote(race) {
    if (!race?.prioritized) return '';
    const score=Number.isFinite(race.score) ? race.score : '未配置';
    const groups=(race.groupNames || []).filter(name=>typeof name==='string' && name).join('、');
    return '赛马优先 · 评分 '+score+(groups ? ' · 小组 '+groups : '');
  }
  function racingOrderDetails(race,ui) {
    if (!race) return '';
    const e=ui.esc,names=(race.matchedGroups || []).map(group=>group.name).filter(Boolean);
    const sources=race.sources || [],warnings=(race.warnings || []).filter(value=>typeof value==='string' && value);
    return `<section class="wb-racing-order" data-wb-racing-order aria-label="赛马门店排序">
      <p class="wb-meta">${names.length ? '命中赛马组：'+e(names.join('、'))+'；组内候选按评分降序优先显示。可继续选择任一可用门店。' : e(race.reason || '按原门店顺序显示。')}</p>
      ${sources.length ? `<details class="wb-context-disclosure"><summary>导入值来源 · ${e(sources.length)} 条</summary>
        <ul>${sources.map(source=>`<li>${e(source.sourceLeadCode || source.receiptId || source.taskId || '原始来件')} · ${e(source.fieldLabel || '导入门店字段')}：${e((source.values || []).join('、'))}</li>`).join('')}</ul></details>` : ''}
      ${warnings.length ? `<p class="wb-meta">${e([...new Set(warnings)].join('；'))}</p>` : ''}
    </section>`;
  }

  function openIntentStoreCorrection(state,record,root,ui,onSaved) {
    const dialog=root.querySelector('[data-wb-name-dialog]');
    if (!dialog || dialog.open || ui.canSave?.()===false) return;
    const context=DSession.context(),e=ui.esc;
    const choices=window.DIntentStoreIdentity?.candidates?.(context,record);
    const rows=choices?.status==='available'?choices.rows:[];
    dialog.innerHTML=`<form class="wb-form" data-wb-intent-store-correction><h3>补录/核对本轮意向门店</h3>
      <p class="wb-meta">${e(record.taskId)} · ${e(record.roundId)}</p><p>仅补充或更正本轮意向门店并保留核对记录；其他回访资料和处理结果保持原值，保存后仍需另行确认下发。</p>
      <p class="wb-meta">候选来自本任务的意向门店填写配置，并显示真实门店编码。</p>
      <p class="wb-meta">原填写：${e(record.visitDetails?.intentStore || '尚未填写')}</p>
      <label>选择当前确认的意向门店<select name="intentStoreOption" required${rows.length?'':' disabled'}><option value="">请选择门店</option>${rows.map(row=>`<option value="${e(row.value)}">${e(row.label || row.store.name)}（${e(row.store.code)}）</option>`).join('')}</select></label>
      ${rows.length?'':`<p class="wb-delivery-error">${e(choices?.reason || '当前填写配置没有可核对的门店，请先维护字段或来源后重新打开。')}</p>`}
      <p class="wb-meta" data-wb-intent-store-correction-preview role="status"></p><p class="wb-delivery-error" role="alert" hidden></p>
      <div class="wb-actions"><button type="button" class="button secondary" data-wb-cancel-store-correction>取消</button><button type="submit" class="button primary" data-wb-save-store-correction${rows.length?'':' disabled'}>确认并保存门店</button></div></form>`;
    const form=dialog.querySelector('form'),select=form.elements.intentStoreOption,error=form.querySelector('[role="alert"]');
    select.onchange=()=>{
      const row=rows.find(row=>row.value===select.value);error.hidden=true;
      form.querySelector('[data-wb-intent-store-correction-preview]').textContent=row?
        '本次确认的真实门店编码：'+row.store.code+'；保存后按该编码重新匹配接收租户。':'';
    };
    form.querySelector('[data-wb-cancel-store-correction]').onclick=()=>dialog.close();
    form.onsubmit=event=>{
      event.preventDefault();if(ui.canSave?.()===false || !rows.some(row=>row.value===select.value))return;
      const result=window.DSkynetIntake.confirmIntentStore?.(state,DSession.context(),record,select.value,{expectedSignature:choices.signature});
      if(!result?.ok){error.textContent=result?.error || '本轮门店未保存，请重新核对。';error.hidden=false;return;}
      dialog.close();onSaved();ui.toast(result.matching?.status==='available'?'本轮门店已保存，接收租户匹配成功。':'本轮门店已保存，接收租户仍需核对：'+(result.matching?.reason || '尚未建立可用关联。'));
    };
    dialog.showModal();
  }

  function openDeliveryDialog(state,record,root,ui,onSent) {
    const flow = window.DSkynetIntake;
    const dialog = root.querySelector("[data-wb-delivery-dialog]");
    const context = DSession.context();
    if (!dialog || dialog.open || !flow.canDispatchDelivery(state,context,record)) return;
    const delivery = deliveryState(record);
    if (delivery.directStore) return openDirectDeliveryDialog(state,record,dialog,delivery,ui,onSent);
    const needsReview = flow.deliveryReviewRequired(state,context,record);
    const mode = delivery.mode || "oneToOne";
    const modeLabel = deliveryModeLabel({...delivery,mode});
    const multi = mode === "oneToMany";
    const chooseReceiver = delivery.targetType === "internalTenant";
    const receivers = chooseReceiver ? flow.deliveryReceiverOptions(state,context,record) : [];
    const internalMatch = chooseReceiver ? flow.internalDeliveryMatch?.(state,context,record) ||
      {status:'unavailable',reason:'门店与租户匹配服务暂不可用，请刷新后重试。'} : null;
    const matchedReceiverId = internalMatch?.status === 'available' ? internalMatch.tenant?.id || internalMatch.targets?.[0]?.id || '' : '';
    const target = deliveryTargetName(delivery.target);
    const {stores,preferredStoreId,requiredStoreIds = [],nativeLeadCount,missingNativeStoreCount = 0,race} =
      chooseReceiver ? {stores:[]} : flow.deliveryTargets(state,context,record);
    const requiredStores = new Set(requiredStoreIds);
    const e = ui.esc;
    const receiverHelp = context.scope.tenant.organization === "门店" ?
      "接收方固定为同品牌总部。" : "按本轮填写的真实门店编码匹配接收租户，不能改选其他租户绕过匹配。";
    const receiverFields = multi ?
      `<fieldset class="wb-delivery-stores" data-wb-delivery-receiver aria-describedby="wb-receiver-scope">
        <legend>接收租户</legend><p class="wb-meta">必须包含匹配的意向门店租户，再明确选择其他接收租户，合计至少 2 个。</p>
        <div class="wb-delivery-options">${receivers.map(({value,label}) =>
          `<label><input type="checkbox" name="receiverTenantIds" value="${e(value)}"${value===matchedReceiverId?' checked disabled':''}> ${e(label)}${value===matchedReceiverId?' · 意向门店匹配，必选':''}</label>`).join("")}</div>
      </fieldset>` : `<label>接收租户（系统匹配）
        <input name="receiverTenantId" data-wb-delivery-receiver aria-describedby="wb-receiver-scope" readonly
          value="${e(internalMatch?.tenant?.name || '')}" placeholder="等待意向门店匹配">
      </label>`;
    const storeFields = multi ?
      `<fieldset class="wb-delivery-stores" data-wb-delivery-stores>
        <legend>下发门店</legend><p class="wb-meta">请选择至少 2 家门店。</p>
        <div class="wb-delivery-options">${stores.map(({value,label,nativeLeadCount:count,race:ranking}) => {
          const required = requiredStores.has(value);
          const detail = required ? (count ? "复用 " + count + " 条原生线索 · 必选" : "原生线索意向门店 · 必选") :
            nativeLeadCount != null ? "选中后生成派生线索" : "";
          return `<label><input type="checkbox" name="storeIds" value="${e(value)}"${required ? " checked disabled" : ""}>
            <span class="wb-delivery-store-option">${e(label)}${racingStoreNote(ranking) ? `<small class="wb-racing-priority">${e(racingStoreNote(ranking))}</small>` : ''}${detail ? `<small>${e(detail)}</small>` : ""}</span></label>`;
        }).join("")}</div>
        ${missingNativeStoreCount ? `<label>缺少可用意向门店的线索（${e(missingNativeStoreCount)} 条）
          <select name="fallbackStoreId"><option value="">从选中的门店中指定承接门店</option></select></label>` : ""}
      </fieldset>` : `<div class="wb-delivery-stores" data-wb-delivery-single>
        <label>下发门店<select name="singleStoreId" required><option value="">请选择门店</option>${stores.map(({value,label,race:ranking}) =>
          `<option value="${e(value)}"${value === preferredStoreId ? " selected" : ""}>${e(label+(racingStoreNote(ranking) ? ' · '+racingStoreNote(ranking) : ''))}</option>`).join("")}</select></label>
      </div>`;
    const available = (chooseReceiver ? receivers : stores).length;
    const insufficient = available < (multi ? 2 : 1) || chooseReceiver && !matchedReceiverId;
    const shortage = chooseReceiver ? internalMatch?.reason || "可选接收租户不足，无法按模板下发。" : "可选下发门店不足，无法按模板下发。";
    dialog.innerHTML = `<form class="wb-form">
      <h3>${needsReview ? "提交下发审核" : "手动下发"}</h3>
      <p class="wb-meta">${e(record.name || "未命名客户")} · ${e(record.taskId)}</p>
      ${delivery.typeLabel ? `<p class="wb-meta">下发类型 ${e(delivery.typeLabel)}</p>` : ""}
      ${target ? `<p class="wb-meta" data-wb-delivery-target>下发目标 ${e(target)}</p>` : ""}
      <p class="wb-meta" data-wb-delivery-mode>下发方式 ${e(modeLabel)}</p>
      ${chooseReceiver ? internalMatchMarkup(internalMatch,ui) + receiverFields + `<p id="wb-receiver-scope" class="wb-meta">${e(receiverHelp)}</p>` : racingOrderDetails(race,ui)+storeFields}
      ${insufficient ? `<p class="wb-meta">${e(shortage)}</p>` : ""}
      ${nativeLeadCount ? `<p class="wb-meta">本任务关联 ${e(nativeLeadCount)} 条原生线索，确认下发时同步本次培育结果。</p>` : ""}
      <section data-wb-delivery-preview aria-label="下发明细预览" hidden>
        <h4>下发明细预览</h4>
        <p class="wb-meta" data-wb-delivery-preview-summary aria-live="polite"></p>
        <div class="wb-delivery-leads" data-wb-delivery-preview-rows></div>
      </section>
      <p class="wb-delivery-error" role="alert" hidden></p>
      <div class="wb-actions"><button type="button" class="button secondary" data-wb-cancel-delivery>取消</button>
      <button type="submit" class="button primary" data-wb-confirm-delivery disabled>${needsReview ? "提交审核" : "确认下发"}</button></div>
    </form>`;
    const form = dialog.querySelector("form");
    const feedback = form.querySelector('[role="alert"]');
    const submit = form.querySelector("[data-wb-confirm-delivery]");
    const singleStore = form.elements.singleStoreId;
    const fallbackStore = form.elements.fallbackStoreId;
    const preview = form.querySelector("[data-wb-delivery-preview]");
    const previewSummary = form.querySelector("[data-wb-delivery-preview-summary]");
    const previewRows = form.querySelector("[data-wb-delivery-preview-rows]");
    const checked = name => Array.from(form.querySelectorAll(`input[name="${name}"]:checked`),input => input.value);
    const storeIds = () => chooseReceiver ? [] : multi ? checked("storeIds") : [singleStore.value];
    const receiverIds = () => chooseReceiver ? (multi ? checked("receiverTenantIds") : [matchedReceiverId]) : undefined;
    const ready = () => !insufficient &&
      (receiverIds() || storeIds()).filter(Boolean).length >= (multi ? 2 : 1) &&
      (!fallbackStore || Boolean(fallbackStore.value));
    const error = message => {
      feedback.textContent = message;
      feedback.hidden = !message;
    };
    function showPreview(plan) {
      if (chooseReceiver) {
        previewSummary.textContent = `接收租户 ${plan.targets.length} 个`;
        previewRows.innerHTML = '<ul>' + plan.targets.map(item => '<li>' + e(item.label || item.id)+
          (item.id===matchedReceiverId?' · 系统匹配的意向门店／总部':' · 本次额外选择') + '</li>').join("") + '</ul>';
        preview.hidden = false;
        return;
      }
      const nativeCount = plan.leads.filter(row => row.kind === "native").length;
      previewSummary.textContent = `原生线索 ${nativeCount} 条，预计新增派生线索 ${plan.leads.length - nativeCount} 条`;
      const groups = new Map(plan.stores.map(store => [store.id,[]]));
      for (const lead of plan.leads) groups.get(lead.storeId).push(lead);
      previewRows.innerHTML = `<table aria-label="预计下发线索"><thead><tr>
        <th scope="col">类型</th><th scope="col">本地线索编码</th><th scope="col">传入线索编码</th>
        </tr></thead>${plan.stores.map(store => {
          const rows = groups.get(store.id);
          const originals = rows.filter(lead => lead.kind === "native").length;
          const derived = rows.length - originals;
          const counts = [originals ? `复用原生 ${originals} 条` : "",derived ? `新增派生 ${derived} 条` : ""].filter(Boolean).join(" · ");
          return `<tbody data-wb-delivery-preview-store="${e(store.id)}"><tr><th scope="rowgroup" colspan="3">${e(store.name)} · ${e(counts)}</th></tr>
            ${rows.map(lead => `<tr><td>${lead.kind === "native" ? "原生" : "派生"}</td>
              <td>${e(lead.localLeadCode || "确认后生成")}</td><td>${e(lead.sourceLeadCode ?? "—")}</td></tr>`).join("")}</tbody>`;
        }).join("")}</table>`;
      preview.hidden = false;
    }
    form.querySelector("[data-wb-cancel-delivery]").onclick = () => dialog.close();
    form.onchange = () => {
      if (fallbackStore) {
        const selected = new Set(storeIds());
        const previous = fallbackStore.value;
        fallbackStore.innerHTML = '<option value="">从选中的门店中指定承接门店</option>' +
          stores.filter(store => selected.has(store.value)).map(({value,label}) =>
            `<option value="${e(value)}"${value === previous ? " selected" : ""}>${e(label)}</option>`).join("");
      }
      submit.disabled = true;
      preview.hidden = true;
      error(chooseReceiver && internalMatch?.status!=='available' ? internalMatch?.reason || '接收租户匹配未完成。' : "");
      if (!ready()) return;
      const plan = flow.previewDelivery(state,DSession.context(),record,mode,storeIds(),
        fallbackStore?.value,receiverIds());
      if (plan.error) {
        error(plan.error);
        return;
      }
      showPreview(plan);
      submit.disabled = false;
    };
    form.onsubmit = event => {
      event.preventDefault();
      if (submit.disabled || !ready() || ui.canSave?.() === false) return;
      submit.disabled = true;
      if (chooseReceiver && internalMatchSignature(flow.internalDeliveryMatch?.(state,DSession.context(),record)) !== internalMatchSignature(internalMatch)) {
        error('意向门店或租户关联已变化，请关闭后重新核对匹配结果。');return;
      }
      const result = flow.dispatchDelivery(state,DSession.context(),record,mode,storeIds(),fallbackStore?.value,receiverIds());
      if (result.error) {
        submit.disabled = false;
        error(result.error);
        return;
      }
      dialog.close();
      onSent();
      ui.toast(result.delivery.status === "待下发审核" ? "已提交下发审核" : "模拟下发已登记，培育任务已结束");
    };
    dialog.showModal();
    form.onchange();
  }

  function openRoundSupplement(state,record,root,ui,onSaved) {
    const service = window.DSkynetIntake;
    const nativeWindow = root.ownerDocument?.defaultView;
    const fields = service?.roundSupplementFields?.(state,DSession.context(),record,nativeWindow);
    if (!fields?.length || root.querySelector("[data-wb-supplement-dialog]")) return;
    const roundId = record.roundId;
    const e = ui.esc;
    const dialog = root.ownerDocument.createElement("dialog");
    dialog.className = "wb-queue-dialog";
    dialog.dataset.wbSupplementDialog = "";
    dialog.setAttribute("aria-label","补录本轮回访");
    dialog.innerHTML = `<form class="wb-form">
      <h3>补录本轮回访</h3>
      <p class="wb-meta">${e(record.name || record.taskId)} · 第 ${e(record.skynet.roundNumber)} 轮</p>
      ${fields.map(field=>`<label>${e(field.label)}<select name="${e(field.key)}" required>
        <option value="">请选择</option>${field.options.map(option=>`<option value="${e(option.value)}"${field.value===option.value ? " selected" : ""}>${e(option.label)}</option>`).join("")}
        </select></label>`).join("")}
      <p class="wb-delivery-error" role="alert" hidden></p>
      <div class="wb-actions">
        <button type="button" class="button secondary" data-wb-cancel-supplement>取消</button>
        <button type="submit" class="button primary">保存并重新判断</button>
      </div>
    </form>`;
    root.append(dialog);
    dialog.addEventListener("close",()=>dialog.remove(),{once:true});
    dialog.querySelector("[data-wb-cancel-supplement]").onclick = () => dialog.close();
    const form = dialog.querySelector("form");
    const feedback = form.querySelector('[role="alert"]');
    form.onsubmit = event => {
      event.preventDefault();
      if (ui.canSave?.()===false) return;
      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      const values = Object.fromEntries(new nativeWindow.FormData(form));
      const result = service.supplementRound(state,DSession.context(),record,{roundId,values,nativeWindow});
      if (result.error) {
        feedback.hidden = false;
        feedback.textContent = result.error;
        submit.disabled = false;
        return;
      }
      dialog.close();
      onSaved(result.outcome);
    };
    dialog.showModal();
  }

  const wecomReminderTimers = new WeakMap();

  function stopWecomReminderCheck(root) {
    if (!wecomReminderTimers.has(root)) return;
    root.ownerDocument?.defaultView?.clearTimeout(wecomReminderTimers.get(root));
    wecomReminderTimers.delete(root);
  }

  function markWecomOverdue(root,task) {
    const row = Array.from(root.querySelectorAll("[data-wb-select]")).find(item=>item.dataset.wbSelect === task.id);
    const tag = row?.querySelector("[data-wb-wecom-queue-status]");
    if (tag) {
      tag.textContent = "企微跟进异常";
      tag.classList.add("wb-critical");
    }
    const active = root.querySelector('[data-wb-wecom-form="complete"]');
    const notice = active?.dataset.record === task.id && root.querySelector("[data-wb-wecom-overdue]");
    if (notice) notice.hidden = false;
  }

  function bindWecomReminderCheck(state,root,ui,seat) {
    const service = window.DSkynetIntake;
    const ownerAccount = DSession.context()?.account.id;
    if (!ownerAccount || !service?.wecomWorkbenchState || !service.simulateWecomAction) return;
    const nativeWindow = root.ownerDocument.defaultView;
    function check() {
      wecomReminderTimers.delete(root);
      const context = DSession.context();
      if (!root.isConnected || context?.account.id !== ownerAccount || context?.scope.id !== state.tenant ||
          window.DApp?.currentPage?.() !== "PAGE-2202" || !window.DReview21?.isLatest?.(state)) return;
      let next = Infinity;
      const notified = [];
      for (const task of state.records) {
        if (task.tenant !== state.tenant || task.ownerId !== seat.id || task.taskStatus !== "待企微培育") continue;
        const stage = service.wecomWorkbenchState(state,context,task);
        if (stage?.stage !== "completion" || !stage.canAct) continue;
        if (stage.reminderDue) {
          markWecomOverdue(root,task);
          const result = service.simulateWecomAction(state,context,task,{
            action:"reminder",taskId:task.taskId,roundId:stage.roundId,visitId:stage.visitId,
            applicationId:stage.applicationId,connectionKey:stage.connectionKey
          });
          if (result?.notified) {
            notified.push(task);
          } else if (!result?.ok) {
            next = Math.min(next,Date.now() + 60_000);
          }
        } else {
          const due = Date.parse(stage.reminderDueAt);
          if (Number.isFinite(due)) next = Math.min(next,due);
        }
      }
      if (notified.length) {
        const label = notified.length === 1 ? (notified[0].name || notified[0].taskId) + "的企微任务" :
          notified.length + " 项企微任务";
        ui.toast(label + "超过 7 天未收到有效跟进回包。");
      }
      if (Number.isFinite(next) && window.DReview21.isLatest(state)) {
        const delay = Math.min(2147483647,Math.max(next - Date.now(),1));
        wecomReminderTimers.set(root,nativeWindow.setTimeout(check,delay));
      }
    }
    check();
  }

  function workbenchBind(state, ui) {
    const root = ui.root || document.querySelector("#workspace");
    stopWecomReminderCheck(root);
    const seat = ownSeat(state);
    if (!seat) return;
    const getMode = () => seatLoginMode(root);
    const nativePhoneBusy = () => {
      const phone = root.ownerDocument?.defaultView?.AgentWorkbench?.authorizationSnapshot?.();
      return phone?.phase && phone.phase !== "idle";
    };
    const owned = (id) => state.records.find((record) =>
      record.id === id && record.tenant === state.tenant && record.ownerId === seat.id && visibleInScope(record));
    function analyzeCall(record,call) {
      if (!call || !window.DSkynetCallAnalysis) return;
      const redraw = () => {
        const panel = root.querySelector("[data-wb-call-analysis]");
        if (root.isConnected && panel?.dataset.wbCallAnalysis===record.id) {
          panel.innerHTML = callAnalysisHistory(state,record,ui);
        }
      };
      const request = window.DSkynetCallAnalysis.analyze(state,record,call,DSession.context(),root.ownerDocument.defaultView);
      redraw();
      void request.then(redraw);
    }
    const analysisPanel = root.querySelector("[data-wb-call-analysis]");
    const analysisTask = analysisPanel && owned(analysisPanel.dataset.wbCallAnalysis);
    if (analysisTask) {
      const calls = window.DSkynetCallAnalysis?.list(state,analysisTask,DSession.context()) || [];
      for (const {call,result} of calls) if (result.status==="notStarted") analyzeCall(analysisTask,call);
    }
    const timer = root.querySelector("[data-wb-call-timer][data-running]");
    if (timer && Number(timer.dataset.start) > 0) {
      const start = Number(timer.dataset.start);
      const frame = timer.ownerDocument.defaultView;
      const tick = () => {
        if (!timer.isConnected) return;
        timer.firstChild.nodeValue = elapsedCallTime(start);
        frame.setTimeout(tick,1000);
      };
      tick();
    }
    const draftForm = root.querySelector("[data-wb-pending-fields],[data-wb-call-fields]");
    const draftRecord = draftForm && owned(draftForm.dataset.record);
    const storeDraft = (record,draft) => {
      if (!draft) return;
      record.followupDraft = {...draft,roundId:record.roundId};
      visitDrafts.set(record,record.followupDraft);
    };
    const formDraft = record => draftRecord === record && visitDraft(record) ? readVisitDraft(draftForm,record) : null;
    if (draftRecord) {
      bindSmartFill(draftForm,draftRecord,root,ui,owned,state);
      window.DFieldLinkageWorkbench?.bind(draftForm,{record:draftRecord,schema:taskFormConfig(draftRecord,root),
        context:()=>DSession.context(),onChange:()=>visitDrafts.set(draftRecord,readVisitDraft(draftForm,draftRecord))});
      draftForm.addEventListener("input", () => visitDrafts.set(draftRecord,readVisitDraft(draftForm,draftRecord)));
      draftForm.addEventListener("submit", event => {
        event.preventDefault();
        if (ui.canSave?.() === false || (draftRecord.roundId || "") !== draftForm.dataset.round ||
            !inCall(draftRecord) && dccQueue(draftRecord) !== "pendingFollowup") return;
        if (window.DFieldLinkageWorkbench?.sync(draftForm)?.ok===false) {
          ui.toast("字段联动规则暂时无法核对，请保留填写内容后重试。");return;
        }
        const previous = draftRecord.followupDraft;
        storeDraft(draftRecord,readVisitDraft(draftForm,draftRecord));
        ui.save("本轮填写已暂存", () => { draftRecord.followupDraft = previous; });
      });
    }

    const deliveryPanel = root.querySelector("[data-wb-delivery-results]");
    if (deliveryPanel) {
      const openingScope = DSession.context();
      deliveryPanel.querySelector("[data-wb-refresh-delivery]").addEventListener("click",() => {
        const current = DSession.context();
        if (!deliveryPanel.isConnected) return;
        if (window.DApp?.currentPage?.() !== "PAGE-2202" ||
            current?.account?.id !== openingScope?.account?.id || current?.scope?.id !== openingScope?.scope?.id ||
            current?.scope?.tenant?.brandId !== openingScope?.scope?.tenant?.brandId) {
          deliveryPanel.replaceChildren();
          return;
        }
        const record = owned(deliveryPanel.dataset.record);
        const results = record && window.DSkynetDeliveryRecords?.forResponsibleSeat?.(record.taskId,deliveryPanel.dataset.round);
        if (!results) {
          deliveryPanel.replaceChildren();
          return;
        }
        deliveryPanel.querySelector("[data-wb-delivery-result-list]").innerHTML = deliveryResultsMarkup(results,ui);
      });
    }

    const view = workbenchView(state);
    const draw = () => ui.go("workbench");
    window.DLeadRatingWorkbench?.bindDemo(root,owned);
    window.DLeadRatingWorkbench?.bindRetry(state,root,ui,owned);
    state.records.filter(record=>owned(record.id)===record && window.DLeadRatingWorkbench?.pending(record))
      .forEach(record=>window.DLeadRatingWorkbench.schedule(state,record,root,ui));
    root.querySelectorAll("[data-wb-scroll]").forEach(pane => {
      const id = pane.dataset.wbScroll;
      pane.scrollTop = view.scroll.get(id) || 0;
      pane.addEventListener("scroll", () => view.scroll.set(id,pane.scrollTop), {passive:true});
    });
    function bindButtons(selector, action) {
      root.querySelectorAll(selector).forEach(button => button.addEventListener("click", () => action(button)));
    }
    function switchTask(changeSelection) {
      if (state.records.some(record => record.tenant === state.tenant && record.ownerId === seat.id && inCall(record))) {
        ui.toast("请先结束当前通话");
        return;
      }
      const form = root.querySelector("[data-followup-form]");
      const record = form && owned(form.dataset.record);
      const currentDraft = record && readVisitDraft(form,record);
      const saved = record && (record.followupDraft?.roundId === record.roundId && record.followupDraft?.options ?
        record.followupDraft : visitBaselines.get(record));
      if (!currentDraft || draftKey(currentDraft) === draftKey(saved)) {
        changeSelection();
        draw();
        return;
      }
      const dialog = root.querySelector("[data-wb-switch-dialog]");
      dialog.querySelectorAll("[data-wb-switch]").forEach(button => {
        button.onclick = () => {
          dialog.close();
          const choice = button.dataset.wbSwitch;
          if (choice === "stay") return;
          if (choice === "discard") {
            visitDrafts.delete(record);
            changeSelection();
            draw();
            return;
          }
          if(ui.canSave?.()===false)return;
          const previous = record.followupDraft;
          const selection = {...view,taskId:selectedTaskId};
          record.followupDraft = currentDraft;
          visitDrafts.set(record,currentDraft);
          changeSelection();
          ui.save("回访已暂存", () => {
            record.followupDraft = previous;
            selectedTaskId = selection.taskId;
            delete selection.taskId;
            Object.assign(view,selection);
          });
        };
      });
      dialog.showModal();
    }
    bindButtons("[data-wb-queue]", button => {
      if (view.queue !== button.dataset.wbQueue) switchTask(() => { view.queue = button.dataset.wbQueue; });
    });
    root.querySelector("[data-wb-followup-filter]")?.addEventListener("change", event => {
      const filter = event.currentTarget.value;
      event.currentTarget.value = view.followupFilter;
      if (filter !== view.followupFilter) switchTask(() => { view.followupFilter = filter; });
    });
    bindButtons("[data-wb-clear-filters]", () => switchTask(() => {
      view.keyword = "";
      if (view.queue === "pendingFollowup") view.followupFilter = "all";
    }));
    bindButtons("[data-wb-generate-delivery-samples]", () => {
      if (view.queue !== "pendingDelivery" || ui.canSave?.() === false) return;
      const result = window.DSkynetIntake.stageWorkbenchDeliverySamples(state,DSession.context());
      if (result.error) return ui.toast(result.error);
      const keys = ["records","skynetReceipts","skynetSequences"];
      const previous = keys.map(key => ({key,exists:Object.hasOwn(state,key),value:state[key]}));
      const selection = {taskId:selectedTaskId,queue:view.queue,keyword:view.keyword};
      Object.assign(state,{records:result.records,skynetReceipts:result.receipts,skynetSequences:result.sequences});
      focusWorkbenchTask(view,result.samples[0],state.today);
      ui.save("已生成 " + result.samples.length + " 条待下发模拟线索，仅供演示。", () => {
        for (const {key,exists,value} of previous) {
          if (exists) state[key] = value;
          else delete state[key];
        }
        selectedTaskId = selection.taskId;
        view.queue = selection.queue;
        view.keyword = selection.keyword;
      });
    });
    bindButtons("[data-wb-generate-samples]", () => {
      const mode = getMode();
      if (![manual,predictive].includes(mode) || state.seatModes?.[seat.id] !== mode || ui.canSave?.() === false) return;
      const result = window.DSkynetIntake.stageWorkbenchSamples(state,DSession.context());
      if (result.error) return ui.toast(result.error);
      const previous = {records:state.records,skynetReceipts:state.skynetReceipts,skynetSequences:state.skynetSequences};
      const previousCount = seat.newCount;
      const previousSelection = selectedTaskId;
      Object.assign(state,{records:result.records,skynetReceipts:result.receipts,skynetSequences:result.sequences});
      seat.newCount = result.newCount;
      selectedTaskId = mode === manual ? result.samples[0].id : "";
      const hint = mode === predictive ? "，点击「模拟来电」开始验证" : "";
      ui.save("已生成 " + result.samples.length + " 条模拟任务" + hint, () => {
        Object.assign(state,previous);
        seat.newCount = previousCount;
        selectedTaskId = previousSelection;
      });
    });
    bindButtons("[data-wb-resume]", button => switchTask(() => {
      const task = owned(button.dataset.wbResume);
      if (!task) return;
      focusWorkbenchTask(view,task,state.today);
    }));
    bindButtons("[data-wb-tab]", async button => {
      const tab = button.dataset.wbTab;
      const previousTab = view.tab;
      view.tab = tab;
      if (!["rating","scripts"].includes(tab)) {
        view.preRating = undefined;
        view.excellentScripts = undefined;
        draw();
        root.querySelector(`[data-wb-tab="${tab}"]`)?.focus({preventScroll:true});
        return;
      }
      const record = owned(selectedTaskId);
      if (!record) return;
      const context = DSession.context();
      const request = {recordId:record.id,taskId:record.taskId,roundId:record.roundId || record.skynet?.roundId};
      const pending = {key:workbenchPreRatingKey(record),result:{status:"loading"}};
      const slot = tab === "rating" ? "preRating" : "excellentScripts";
      const panelSelector = tab === "rating" ? "[data-wb-pre-rating]" : "[data-wb-excellent-scripts]";
      const markup = tab === "rating" ? workbenchPreRatingMarkup : workbenchScriptsMarkup;
      view.preRating = undefined;
      view.excellentScripts = undefined;
      view[slot] = pending;
      if (previousTab !== tab) {
        draw();
        root.querySelector(`[data-wb-tab="${tab}"]`)?.focus({preventScroll:true});
      } else {
        const panel = root.querySelector(panelSelector);
        if (panel) panel.innerHTML = markup(pending.result,ui);
      }
      let result;
      try {
        const service = tab === "rating" ? window.DSkynetPreRating : window.DSkynetExcellentScripts;
        result = await service?.readWorkbench(context,request);
      } catch (_) { /* Treat a failed provider call as temporary unavailability. */ }
      const current = DSession.context();
      if (!root.isConnected || window.DApp?.currentPage?.() !== "PAGE-2202" || view[slot] !== pending ||
          view.tab !== tab || current?.account?.id !== context?.account?.id || current?.scope?.id !== context?.scope?.id ||
          current?.scope?.tenant?.brandId !== context?.scope?.tenant?.brandId ||
          workbenchPreRatingKey(owned(selectedTaskId)) !== pending.key) return;
      pending.result = result || {status:"unavailable"};
      const panel = root.querySelector(panelSelector);
      if (panel) panel.innerHTML = markup(pending.result,ui);
    });
    bindButtons("[data-wb-assistant]", () => { view.assistant = !view.assistant; draw(); });
    bindButtons("[data-wb-copy]", async button => {
      try {
        await root.ownerDocument.defaultView.navigator.clipboard.writeText(button.dataset.wbCopy);
        ui.toast("已复制");
      } catch (_) {
        ui.toast("复制未完成，可选中内容后手动复制");
      }
    });
    bindButtons('[data-wb-correct-intent-store]',button=>{
      const record=owned(button.dataset.wbCorrectIntentStore);
      if(record)openIntentStoreCorrection(state,record,root,ui,draw);
    });
    root.querySelector("[data-wb-search]")?.addEventListener("submit", event => {
      event.preventDefault();
      const keyword = event.currentTarget.elements.keyword.value.trim();
      if (view.keyword !== keyword) switchTask(() => { view.keyword = keyword; });
    });
    bindButtons("[data-wb-edit-name]", button => {
      const record = owned(button.dataset.wbEditName);
      const dialog = root.querySelector("[data-wb-name-dialog]");
      if (!record || !dialog) return;
      dialog.innerHTML = `<form class="wb-form"><h3>编辑客户姓名</h3><label>客户姓名<input name="name" maxlength="20" value="${ui.esc(record.name || "")}" required></label>
        <div class="wb-actions"><button type="button" class="button secondary" data-close>取消</button><button type="submit" class="button primary">保存</button></div></form>`;
      dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
      dialog.querySelector("form").addEventListener("submit", event => {
        event.preventDefault();
        if(ui.canSave?.()===false)return;
        const name = event.currentTarget.elements.name.value.trim();
        if (!name) return;
        record.name = name;
        dialog.close();
        ui.save("客户姓名已保存");
      });
      dialog.showModal();
    });
    bindButtons("[data-wb-select]", button => {
      if (selectedTaskId !== button.dataset.wbSelect) switchTask(() => { selectedTaskId = button.dataset.wbSelect; });
    });
    root.querySelectorAll("[data-wb-action]").forEach((button) => {
      button.addEventListener("click", () => {
        if(ui.canSave?.()===false)return;
        const { wbAction: action, record: id } = button.dataset;
        if (action === "offer-predictive") {
          const record = state.records.find(item => item.id === id && item.taskStatus === "待预外呼");
          if (getMode() !== predictive || !predictiveTaskInScope(state,seat,record) || record.expectedSeatId ||
              !window.DReview21.isLatest(state)) return;
          const reason = predictiveTargetReason(record) || seatCapacity(state,seat);
          const busy = nativePhoneBusy() || state.records.some(item =>
            item.tenant === state.tenant && (item.ownerId === seat.id && activeCalls.has(item.callState) ||
              item.taskStatus === incoming && item.expectedSeatId === seat.id));
          if (reason || busy || contactBusy(state,record,true)) {
            ui.toast(reason || (busy ? "请先完成当前来电、通话或回访" : contactWaitReason));
            return;
          }
          const previous = {...record};
          Object.assign(record,{taskStatus:incoming,expectedSeatId:seat.id,waitReason:"本轮模拟来电，等待实际接听"});
          ui.save("本轮来电已就绪，接听后承接原培育任务", () => {
            for (const key of Object.keys(record)) if (!Object.hasOwn(previous,key)) delete record[key];
            Object.assign(record,previous);
          });
          return;
        }
        if (action === "answer" || action === "miss") {
          const record = state.records.find((item) => item.id === id && item.tenant === state.tenant &&
            item.taskStatus === incoming && item.expectedSeatId === seat.id &&
            (item.skynet ? predictiveTaskInScope(state,seat,item) : !item.ownerId));
          if (!hasOutboundTask(record) || getMode() !== predictive) return;
          if (record.skynet && !window.DReview21.isLatest(state)) return;
          const previous = structuredClone(record);
          const previousCounts = {newCount:seat.newCount,followCount:seat.followCount};
          const previousSelection = {queue:view.queue,followupFilter:view.followupFilter,keyword:view.keyword};
          const previousTaskId = selectedTaskId;
          const rollback = () => {
            for (const key of Object.keys(record)) if (!Object.hasOwn(previous,key)) delete record[key];
            Object.assign(record,previous);
            Object.assign(seat,previousCounts);
            Object.assign(view,previousSelection);
            selectedTaskId = previousTaskId;
          };
          if (action === "miss") {
            record.taskStatus = record.skynet ? "待预外呼" : "未接听";
            record.requiredMode = predictive;
            record.lastUnanswered = {seatId:seat.id,at:new Date().toISOString()};
            record.expectedSeatId = "";
            record.waitReason = record.skynet ? "本次模拟来电未接听，可沿本轮重试" : "本次预外呼未接听，可由租户管理员重新分配";
            ui.save(record.skynet ? "本次未接听，原培育轮次保留待重试" : "来电未接听，可由租户管理员重新分配",rollback);
            return;
          }
          const reason = record.skynet && predictiveTargetReason(record) || seatCapacity(state, seat);
          const busy = nativePhoneBusy() || state.records.some(item => item.ownerId === seat.id && activeCalls.has(item.callState));
          if (reason || busy || contactBusy(state,record,true)) {
            ui.toast(reason || (busy ? "请先完成当前通话或回访" : contactWaitReason));
            return;
          }
          if (!record.ownerId) newTaskAssignment(state, record, seat);
          else record.taskStatus = "待办理";
          if (record.skynet) record.expectedSeatId = "";
          record.callState = "active";
          record.callMode = predictive;
          record.callContact = "已接通";
          record.callTiming = {startedAt:Date.now()};
          record.roundId = record.skynet?.roundNumber ? record.skynet.roundId : record.taskId + '-' + Date.now();
          record.followupSchema = {...taskFormConfig(record,root),roundId:record.roundId};
          countContinued(state, record, seat);
          focusWorkbenchTask(view,record,state.today);
          ui.save("已接听，线索已进入跟进中",rollback);
          return;
        }
        const record = owned(id);
        if (!record) return;
        if (action === "supplement-round") {
          if (nativePhoneBusy() || state.records.some(item=>item.tenant===state.tenant && item.ownerId===seat.id && inCall(item))) {
            ui.toast("请先完成当前通话");
            return;
          }
          openRoundSupplement(state,record,root,ui,outcome => {
            focusWorkbenchTask(view,record,state.today);
            draw();
            ui.toast(outcome?.warning || "本轮回访已补录，任务去向已更新");
          });
          return;
        }
        if (action === "open-delivery") {
          openDeliveryDialog(state,record,root,ui,() => {
            focusWorkbenchTask(view,record,state.today);
            draw();
          });
          return;
        }
        if (action === "dial" || action === "redial") {
          if (!hasOutboundTask(record)) return ui.toast("请从已分配的外呼任务发起拨打");
          if (nativePhoneBusy() || state.records.some(item => item !== record && item.ownerId === seat.id && activeCalls.has(item.callState))) {
            ui.toast("请先完成当前通话或回访");
            return;
          }
          if (seat.enabled === false) {
            ui.toast("坐席当前不可办理");
            return;
          }
          if (getMode() !== manual) return ui.toast("当前外呼方式无法拨打");
          if (contactBusy(state,record,true)) return ui.toast(contactWaitReason);
          if (taskEnded(record) || nurturePending(record) || nurtureHandoff(record) || deliveryState(record)) {
            return ui.toast('请按当前任务状态办理');
          }
          if (action === 'redial' && (record.callState !== "aftercall" || record.callContact !== "未接听")) return;
          if (action !== 'redial' && (unarranged(record) ||
              record.nextAt && Date.parse(record.nextAt + '+08:00') > Date.now())) {
            ui.toast('请按当前任务状态和约定时间办理'); return;
          }
          const previous = {roundId:record.roundId,callState:record.callState,callMode:record.callMode,callRequestedAt:record.callRequestedAt,
            callContact:record.callContact,followupSchema:record.followupSchema,followupDraft:record.followupDraft};
          const draft = action === 'dial' ? formDraft(record) : visitDraft(record);
          if (action !== 'redial') {
            record.roundId = record.skynet?.roundNumber ? record.skynet.roundId : record.taskId + '-' + Date.now();
            record.callContact = "";
            record.followupSchema = {...taskFormConfig(record,root),roundId:record.roundId};
          }
          storeDraft(record,draft);
          record.callState = "requested";
          record.callMode = manual;
          record.callRequestedAt = Date.now();
          ui.save("已发起拨打，等待确认", () => {
            Object.assign(record,previous);
            if (draft) visitDrafts.set(record,draft);
          });
        } else if (action === "dialed" && record.callState === "requested") {
          if (!hasOutboundTask(record)) return ui.toast("请从已分配的外呼任务发起拨打");
          const previous = {callState:record.callState,callContact:record.callContact,callTiming:record.callTiming,
            callRequestedAt:record.callRequestedAt,followupDraft:record.followupDraft,countedDay:record.countedDay,
            dailyCounts:structuredClone(record.dailyCounts)};
          const previousFollowCount = seat.followCount;
          storeDraft(record,formDraft(record));
          record.callState = "active";
          record.callContact = "";
          record.callTiming = {startedAt:Date.now()};
          delete record.callRequestedAt;
          countContinued(state, record, seat);
          ui.save("已确认实际拨出", () => {
            Object.assign(record,previous);
            seat.followCount = previousFollowCount;
          });
        } else if (action === "failed" && record.callState === "requested") {
          const wasRedial = record.callContact === "未接听";
          const previous = {callState:record.callState,callRequestedAt:record.callRequestedAt,
            followupSchema:record.followupSchema,followupDraft:record.followupDraft};
          storeDraft(record,formDraft(record));
          record.callState = wasRedial ? "aftercall" : "";
          delete record.callRequestedAt;
          if (!wasRedial) delete record.followupSchema;
          focusWorkbenchTask(view,record,state.today);
          ui.save(wasRedial ? "重拨未实际拨出，可继续填写本轮回访" : "本次未实际拨出，可重新发起",
            () => Object.assign(record,previous));
        } else if (action === "connected" && record.callState === "active" && record.callMode === manual && !normalContact(record)) {
          const previous = {callContact:record.callContact,followupDraft:record.followupDraft};
          storeDraft(record,formDraft(record));
          record.callContact = "已接通";
          ui.save("已确认接通，可智能填单", () => Object.assign(record,previous));
        } else if ((action === "end-connected" || action === "end-missed" && !normalContact(record)) && record.callState === "active") {
          const previous = {callState:record.callState,callContact:record.callContact,callTiming:record.callTiming,
            followupDraft:record.followupDraft};
          const previousCalls = state.qualityCallAttempts;
          storeDraft(record,formDraft(record));
          record.callState = "aftercall";
          record.callContact = action === "end-connected" ? "已接通" : "未接听";
          if (record.callTiming?.startedAt) record.callTiming = {...record.callTiming,endedAt:Date.now()};
          const finishedCall = window.DQualityCallSource?.stageWorkbenchCall(state,DSession.context(),record,seat);
          focusWorkbenchTask(view,record,state.today);
          if (ui.save("通话已结束，请填写本轮回访", () => {
            Object.assign(record,previous);
            state.qualityCallAttempts = previousCalls;
          })) {
            analyzeCall(record,finishedCall);
            const form = root.querySelector("[data-followup-form]");
            const contact = form?.elements.contactStatus;
            (contact && !contact.value ? contact : form?.elements.result)?.focus();
          }
        } else if ((action === "decision-yes" || action === "decision-no") &&
            legacyHandoffWritable(record) && record.followupResult && record.taskStatus === "已完成" && !record.decision) {
          record.decision = action === "decision-yes" ? "是" : "否";
          const target = window.DReview21Handoff?.destination(record);
          record.handoffTarget = record.decision === "是" ? target || "" : "";
          record.handoffState = record.decision === "是" ? target ? "待交接" : "归口待确认" : "已结案";
          ui.save(record.handoffState);
        }
      });
    });
    const handoff = root.querySelector("[data-wb-handoff]");
    handoff?.addEventListener("submit", (event) => {
      event.preventDefault();
      if(ui.canSave?.()===false)return;
      const record = owned(handoff.dataset.record);
      const receipt = handoff.elements.receipt.value;
      if (!record || !legacyHandoffWritable(record) || record.decision !== "是" || record.taskStatus !== "已完成" ||
          !["已接收", "对方拒绝", "接收待核"].includes(receipt)) return;
      if (window.DReview21Handoff?.recordHandoff(state, record, "是", receipt, handoff.dataset.recheck === "yes")) {
        ui.save(record.handoffState);
      }
    });
    const wecomForm = root.querySelector("[data-wb-wecom-form]");
    let progressCallbackId;
    if (wecomForm?.dataset.wbWecomForm === "complete") {
      void window.DSkynetOutboundTargets?.load(DSession.context());
      bindButtons("[data-wb-wecom-check-days]", button=>{
        if (ui.canSave?.() === false) return;
        const task = owned(wecomForm.dataset.record);
        if (!task) return;
        const {task:taskId,round:roundId,visit:visitId} = wecomForm.dataset;
        const application = wecomRequestApplication(state,DSession.context(),task);
        const feedback = root.querySelector("[data-wb-wecom-check-result]");
        if (!application) {
          feedback.textContent = "企微应用当前不可用，请核对已绑定的应用后重试。";
          feedback.hidden = false;
          return;
        }
        const result = window.DSkynetIntake?.simulateWecomAction?.(state,DSession.context(),task,{
          taskId,roundId,visitId,action:"reminder",mockElapsedDays:Number(button.dataset.wbWecomCheckDays),...application
        });
        if (result?.notified) {
          feedback.hidden = true;
          markWecomOverdue(root,task);
          ui.toast(result.reason);
        } else {
          feedback.textContent = result?.error || result?.reason || "无法核对本轮跟进状态，请重试。";
          feedback.hidden = false;
        }
      });
    }
    wecomForm?.addEventListener("submit", event => {
      event.preventDefault();
      if (ui.canSave?.() === false) return;
      const submit = wecomForm.querySelector("[data-wb-wecom-submit]");
      const progress = wecomForm.querySelector("[data-wb-wecom-progress]");
      const task = owned(wecomForm.dataset.record);
      if (submit.disabled || !task) return;
      const nativeWindow = root.ownerDocument.defaultView;
      const payload = new nativeWindow.FormData(wecomForm);
      const {task:taskId,round:roundId,visit:visitId,wbWecomForm:formAction} = wecomForm.dataset;
      const isProgress = formAction === "complete" && progress && (!event.submitter || event.submitter === progress);
      const feedback = wecomForm.querySelector('[role="alert"]');
      const application = wecomRequestApplication(state,DSession.context(),task);
      if (!application) {
        feedback.textContent = "企微应用当前不可用，请核对已绑定的应用后重试。";
        feedback.hidden = false;
        return;
      }
      if (isProgress) progressCallbackId ||= nativeWindow.crypto.randomUUID();
      submit.disabled = true;
      if (progress) progress.disabled = true;
      feedback.hidden = true;
      const result = window.DSkynetIntake?.simulateWecomAction?.(state,DSession.context(),task,{
        taskId,roundId,visitId,action:isProgress ? "progress" : formAction,nativeWindow,
        ...application,
        ...(isProgress ? {callbackId:progressCallbackId} : {}),
        outcome:payload.get("outcome"),friendAdded:payload.has("friendAdded"),
        result:payload.get("result"),intentLevel:payload.get("intentLevel"),leadStatus:payload.get("leadStatus"),note:payload.get("note")
      });
      if (!result?.ok) {
        feedback.textContent = result?.error || "本轮企微办理保存失败，请重试。";
        feedback.hidden = false;
        submit.disabled = false;
        if (progress) progress.disabled = false;
        return;
      }
      focusWorkbenchTask(view,task,state.today);
      draw();
      ui.toast(result.reason || result.status);
    });
    bindWecomReminderCheck(state,root,ui,seat);
    const form = root.querySelector("[data-followup-form]");
    if (!form) return;
    const editingRecord = owned(form.dataset.record);
    if (!editingRecord) return;
    bindSmartFill(form,editingRecord,root,ui,owned,state);
    if (editingRecord.skynet) void window.DSkynetOutboundTargets?.load(DSession.context());
    const nativeWindow = root.ownerDocument?.defaultView;
    const formSchema = taskFormConfig(editingRecord,root);
    const definitions = visitDefinitions(formSchema);
    const leadStatus = draft => draft.options.leadStatus || draft.details.leadStatus;
    const decideRound = (record,draft,completedAt = new Date().toISOString()) => record.skynet && window.DSkynetIntake.roundDecision(state,DSession.context(),record,{
      result:draft.result,details:draft.details,options:draft.options,note:draft.note,nextAt:draft.nextAt,completedAt,
      callStatus:record.callContact,leadStatus:leadStatus(draft),
      callMode:record.callMode,nativeWindow
    });
    const requiresNext = (draft,plan) => nextResults.has(draft.result) && (!plan || plan.action === manual ||
      plan.ruleEvaluations?.some(rule=>rule.conditions?.some(condition=>condition.coldCallbackWindow)));
    const syncNext = () => {
      const draft = readVisitDraft(form,editingRecord);
      const next = requiresNext(draft,decideRound(editingRecord,draft));
      form.querySelector(".wb-next-time").hidden = !next;
      form.elements.nextAt.disabled = !next;
      form.elements.nextAt.required = next;
    };
    syncNext();
    const baseline = visitBaselines.get(editingRecord);
    if (!baseline || baseline.roundId !== editingRecord.roundId) visitBaselines.set(editingRecord,readVisitDraft(form,editingRecord));
    form.elements.nextAt.min = `${state.today}T00:00`;
    form.addEventListener("input", () => {
      syncNext();
      visitDrafts.set(editingRecord,readVisitDraft(form,editingRecord));
    });
    form.querySelector("[data-wb-save-draft]").addEventListener("click", () => {
      if(ui.canSave?.()===false)return;
      if (window.DFieldLinkageWorkbench?.sync(form)?.ok===false) {
        ui.toast("字段联动规则暂时无法核对，请保留填写内容后重试。");return;
      }
      const previous = editingRecord.followupDraft;
      editingRecord.followupDraft = readVisitDraft(form,editingRecord);
      visitDrafts.set(editingRecord,editingRecord.followupDraft);
      ui.save("本轮回访已暂存", () => { editingRecord.followupDraft = previous; });
    });
    form.elements.result.addEventListener("change", () => {
      const store = form.querySelector("[data-wb-store-time]");
      if (store) {
        const visible = storeVisitResults.has(form.elements.result.value);
        store.hidden = !visible;
        const time = form.elements.expectStoreTime;
        if (time) {
          time.disabled = !visible;
          time.required = visible && store.dataset.wbRequired === "true";
        }
      }
      syncNext();
      visitDrafts.set(editingRecord,readVisitDraft(form,editingRecord));
    });
    const fieldLinkage = window.DFieldLinkageWorkbench?.bind(form,{record:editingRecord,schema:formSchema,
      context:()=>DSession.context(),onChange:()=>{
        syncNext();visitDrafts.set(editingRecord,readVisitDraft(form,editingRecord));
      }});
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if(ui.canSave?.()===false)return;
      const record = owned(form.dataset.record);
      if (!record || record.callState !== "aftercall" || (record.roundId || "") !== form.dataset.round) return;
      const linkageCheck = fieldLinkage?.validate() || {ok:true};
      if (!linkageCheck.ok) {
        ui.toast(window.DFieldLinkageWorkbench.errorsOf(linkageCheck).join("；"));return;
      }
      const draft = readVisitDraft(form,record);
      const {result,note,nextAt:plannedAt,details} = draft;
      if (definitions.get("contactStatus")?.required && !details.contactStatus) {
        ui.toast("请选择接触状态");
        return;
      }
      const completedAt = new Date().toISOString();
      const decision = decideRound(record,draft,completedAt);
      const next = requiresNext(draft,decision);
      const nextAt = next ? plannedAt : "";
      const unavailable = [...form.querySelectorAll("[data-wb-required-unavailable]")].find(field => !field.closest("[hidden]"));
      if (unavailable) {
        ui.toast(unavailable.dataset.wbRequiredUnavailable + "暂未对接，请联系管理员核对填写配置");
        return;
      }
      if (!result || !note) {
        ui.toast("请填写回访结果和记录");
        return;
      }
      if (next && !(Date.parse(nextAt + '+08:00') > Date.now())) {
        ui.toast("下次回访时间须晚于当前时间");
        return;
      }
      const previous = {...record};
      const previousCalls = state.qualityCallAttempts;
      const previousSelection = {queue:view.queue,followupFilter:view.followupFilter,keyword:view.keyword};
      const previousTaskId = selectedTaskId;
      const beforeTransfer = decision?.action === "转冷线索" ? structuredClone(state) : null;
      let rollbackFillReview;
      const rollback = () => {
        rollbackFillReview?.();
        if (beforeTransfer) {
          for (const key of Object.keys(state)) if (!Object.hasOwn(beforeTransfer,key)) delete state[key];
          Object.assign(state,beforeTransfer);
        } else {
          for (const key of Object.keys(record)) if (!Object.hasOwn(previous,key)) delete record[key];
          Object.assign(record,previous);
          state.qualityCallAttempts = previousCalls;
        }
        const restored = state.records.find(item => item.id === record.id);
        if (restored) visitDrafts.set(restored,draft);
        Object.assign(view,previousSelection);
        selectedTaskId = previousTaskId;
      };
      const controls = [...form.querySelectorAll("[data-wb-detail]")];
      const retainedDetails = {...record.visitDetails};
      const retainedOptions = {...record.visitOptionValues};
      for (const control of controls) {
        delete retainedDetails[control.dataset.wbDetail];
        delete retainedOptions[control.dataset.wbDetail];
      }
      form.querySelector('[type="submit"]').disabled = true;
      record.followupResult = result;
      record.followupNote = note;
      record.nextAt = nextAt;
      record.lastFollowupAt = state.today;
      record.visitDetails = {...retainedDetails,...details};
      record.visitOptionValues = {...retainedOptions,...draft.options};
      if (details.intentLevel) record.intentLevel = details.intentLevel;
      delete record.followupDraft;
      visitDrafts.delete(record);
      record.followupHistory = [...(record.followupHistory || [])];
      let finishedCall;
      const visitId = nativeWindow.crypto.randomUUID(), factsVersion = nativeWindow.crypto.randomUUID();
      if (!record.followupHistory.some(item => item.roundId && item.roundId === record.roundId)) {
        finishedCall = window.DQualityCallSource?.stageWorkbenchCall(state,DSession.context(),record,seat);
        const detailFields = controls.filter(control => Object.hasOwn(details,control.dataset.wbDetail))
          .map(control => [control.dataset.wbDetail,control.dataset.wbFieldLabel]);
        const selectedStore = window.DIntentStoreIdentity?.capture(DSession.context(),record,formSchema,
          {roundId:record.roundId,options:draft.options,details:draft.details});
        record.followupHistory.push({taskId:record.taskId,roundId:record.roundId,roundNumber:record.skynet?.roundNumber,visitId,factsVersion,
          date:state.today,seat:seat.id,contact:record.callContact,result,note,nextAt,details,options:structuredClone(draft.options),detailFields,
          intentStoreIdentityState:{version:1,status:selectedStore?.status || 'unavailable',
            ...(selectedStore?.status==='available'?{}:{reason:selectedStore?.reason || '门店来源核对服务未就绪，请重新确认本轮意向门店。'})},
          ...(selectedStore?.status === 'available' && selectedStore.snapshot ? {intentStoreIdentity:structuredClone(selectedStore.snapshot)} : {}),
          ...(linkageCheck.snapshot ? {fieldLinkageSnapshot:structuredClone(linkageCheck.snapshot)} : {}),
          ...(finishedCall ? {qualityCallId:finishedCall.callId} : {}),
          ...(record.callMode ? {callMode:record.callMode} : {}),
          leadStatus:leadStatus(draft),at:completedAt});
        record.followupCount = Number(record.followupCount || 0) + 1;
        rollbackFillReview = window.DSmartFillReview?.stageVisit(state,DSession.context(),record,record.followupHistory.at(-1));
      }
      record.callState = "";
      delete record.callTiming;
      delete record.followupSchema;
      record.taskStatus = next ? nextVisit : "已完成";
      let outcome, ratingStage;
      try {
        if (definitions.has("intentLevel") && window.DLeadRatingRules) {
          const options = window.DLeadRatingWorkbench.choices(formSchema);
          const selected = options.find(option=>option.id===draft.options.intentLevel || option.value===details.intentLevel || option.label===details.intentLevel);
          const ratingInput = {
            categoryId:formSchema.categoryId,roundId:record.roundId,visitId,factsVersion,mode:record.callMode,leadStatus:leadStatus(draft),result,
            contact:definitions.has("contactStatus") ? smartFillContext(record,formSchema,form).contact : "",
            manual:selected?.value || null,manualOriginal:details.intentLevel || null,
            allowed:options.map(option=>option.value),actor:{seatId:seat.id}
          };
          const config = window.DLeadRatingRules.readConfig(DSession.context());
          ratingStage = window.DLeadRatingRules.matches(ratingInput) && (config.enabled || !config.ok) ?
            window.DLeadRatingRules.stage(record,DSession.context(),ratingInput) : {ok:true,requested:false};
          if (!ratingStage.ok) {
            rollback();draw();ui.toast(ratingStage.error || "评级规则暂时无法执行，请核对配置后提交。");return;
          }
          if (ratingStage.requested) window.DLeadRatingWorkbench.hold(record);
        }
        if (!window.DLeadRatingWorkbench?.pending(record) && record.skynet) outcome = window.DSkynetIntake.completeRound(state,DSession.context(),record,{
          callStatus:record.callContact,leadStatus:leadStatus(draft),nativeWindow
        });
      } catch (_) {
        rollback();
        draw();
        ui.toast("本轮未保存，请核对任务后重试");
        return;
      }
      focusWorkbenchTask(view,record,state.today);
      const automaticDelivery = record.skynet?.delivery?.trigger === "automatic" && record.skynet.delivery.simulated;
      const message = window.DLeadRatingWorkbench?.pending(record) ? "回访已保存，命中评级规则，正在异步结算。" : outcome?.warning || (automaticDelivery ? "回访已提交，已记录自动下发模拟结果" :
        outcome?.status === "待处理" ? "回访已提交，培育策略待处理" :
        outcome?.status === "待下发" ? "本轮已完成，等待手动下发" : outcome?.coldTransfer ? "培育已结束，线索已转入冷线索分配规则" :
        outcome?.status === "已结束" ? "回访已提交，培育已结束" :
        nurtureHandoff(record) ? "回访已提交，任务进入「" + record.taskStatus + "」" :
        nextAt ? "回访已提交，下次跟进已安排" :
        legacyHandoffWritable(record) ? "回访已提交，请确认是否下发" : "回访已提交");
      if (ui.save(message,rollback)) {
        if (window.DLeadRatingWorkbench?.pending(record)) window.DLeadRatingWorkbench.schedule(state,record,root,ui);
        analyzeCall(record,finishedCall);
      }
    });
  }

  sections.queue = { title: "业务名单", render: queueRender, bind: queueBind };
  sections.workbench = { title: "坐席作业", render: workbenchRender, bind: workbenchBind };
  function release(state, record) {
    const seat = state.seats.find(item => item.id === record.ownerId);
    const entry = record.dailyCounts?.[state.today + '|' + record.ownerId];
    if (seat && entry?.kind === 'new' && !entry.started && !entry.refunded) {
      seat.newCount = Math.max(0, Number(seat.newCount || 0)-1); entry.refunded=true;
    }
  }
  window.DReview21Workbench = {seatCapacity, seatUsage, seatLoginMode, assign:newTaskAssignment, release, countContinued, progress,
    phoneKey,contactBusy,contactWaitReason,followupFields,stopWecomReminderCheck,
    smartFill:{context:smartFillContext,bind:bindSmartFill,apply:applySmartFill}};
})();
