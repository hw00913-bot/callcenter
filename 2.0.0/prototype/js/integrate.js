(() => {
    "use strict";

    const schedulePage = "PAGE-21001";
    const sections = window.reviewSections;
    const sample = window.reviewSample;
    const readPrefix = "d-contact-210-integrated-review-v1:";
    const tenantRoles = new Set(["hq_admin", "hq_ops", "store_admin", "store_ops"]);
    const labels = {seats:"坐席接收量",info:"我的工作信息"};
    const clone = value => JSON.parse(JSON.stringify(value));
    const esc = DUI.esc;
    const toast = message => { if (message) DUI.toast(message); };
    const context = () => DSession.context();
    const activePage = () => window.DApp?.currentPage();
    const scopeKey = c => c?.scope.kind === "tenant" ? c.scope.id : "";
    const identity = c => c ? c.account.id + "|" + c.scope.id : "";
    const role = c => DSession.roleKey(c);
    const allowedScope = c => Boolean(c && scopeKey(c) && DRolePermissions.moduleEnabled("cloud", c) &&
        (tenantRoles.has(role(c)) || role(c)==="super" && DSession.platformAuthority(c)?.tenantIds?.includes(scopeKey(c))));
    const isAdmin = c => role(c)==="super" || role(c).endsWith("_admin");
    const isOperator = c => role(c).endsWith("_ops");
    const canUseWorkbench = c => allowedScope(c) && DSession.can("F37", c);
    const getCloudFrame = () => document.querySelector('iframe[data-native-module="cloud"]');
    const dateParts = new Intl.DateTimeFormat("en-CA", {
        timeZone:"Asia/Shanghai", year:"numeric", month:"2-digit", day:"2-digit"
    });

    function today() {
        const parts = Object.fromEntries(dateParts.formatToParts(new Date()).map(part => [part.type, part.value]));
        return parts.year + "-" + parts.month + "-" + parts.day;
    }

    function nativeSeats(c, frame) {
        const w = frame?.contentWindow;
        const native = w?.DNativeContext?.context;
        if (identity(native) !== identity(c)) return {rows:[], own:""};
        const tenantId = scopeKey(c);
        const enterpriseId = c.scope.tenant.enterpriseId;
        const raw = Array.from(w.CloudCallData?.agents || []);
        const scoped = raw.filter(row => row.tenantId === tenantId && String(row.enterpriseId) === String(enterpriseId) &&
            row.lifecycleStatus !== "已删除" && row.agentRecordId && w.AppState?.authorizeObject?.("",row)!==false);
        const members = new Map(DOrganization.members(tenantId).map(member => [member.account.id, member]));
        const nativeAccounts = new Map((w.CloudCallData?.accounts || []).map(account => [account.accountId, account]));
        const bindingCounts = new Map();
        for (const row of scoped) {
            if (row.accountId) bindingCounts.set(row.accountId, (bindingCounts.get(row.accountId) || 0) + 1);
        }
        const rows = scoped.map(row => {
            const account = members.get(row.accountId)?.account || (row.accountId === c.account.id ? c.account : null);
            const bound = Boolean(account && bindingCounts.get(row.accountId) === 1);
            return {
                id: String(row.agentRecordId), accountId: row.accountId || "", tenant: tenantId,
                tenantName: c.scope.tenant.name,
                name: row.userName || row.realName || row.name || "坐席",
                account: bound ? nativeAccounts.get(row.accountId)?.loginUsername || account.login || "" : "",
                bindingState: bound ? "已关联" : row.accountId ? "关联待核对" : "未关联平台账号",
                employeeNo: String(row.cno || row.agentNo || row.workNo || "—"),
                enabled: !["已停用","停用","禁用","已关闭","已注销"].includes(row.lifecycleStatus) && row.enabled !== false
            };
        });
        const actual = w.AccountSeat?.forAccount?.(c.account.id, tenantId, enterpriseId);
        const own = actual?.agentRecordId && rows.some(row => row.id === String(actual.agentRecordId))
            ? String(actual.agentRecordId) : "";
        return {rows, own};
    }

    const states = new Map();
    const stateVersions = new WeakMap();
    const stateSaveErrors = new WeakMap();
    const readReviewBytes = bytes => JSON.parse(window.DReviewStorageRecovery?.unpack?.(bytes) ?? bytes);
    let activeSessionSeat=null;
    const retiredAuditDemo = record => record.demoTask === true && record.id === "L-1036" &&
        record.taskId === "T-1036" && record.originalKey === "H-1036" && record.phone === "17000001036";

    const simulatedSources = new Set([window.DSkynetIntakeFixtures.sourceApplicationId,"PARTNER-A"]);

    function legacyBinding(book, binding) {
        const config = window.DSkynetConfig;
        const find = (kind, id, version) => config.version(book,kind,id,version);
        const rule = find("rules",binding?.assignmentRuleId,binding?.assignmentRuleVersion);
        const strategy = find("nurtureTemplates",binding?.nurtureTemplateId,binding?.nurtureTemplateVersion);
        const delivery = find("deliveryTemplates",binding?.deliveryTemplateId,binding?.deliveryTemplateVersion);
        const oldDelivery = delivery && !config.isDeliveryTemplateConfigured(delivery);
        return Boolean(rule && !rule.cleaning || strategy && !strategy.strategyTree || oldDelivery);
    }

    function oldSample(record) {
        if (record.skynet) return false;
        const original = sample.records.some(item => item.id === record.id && item.taskId === record.taskId &&
            item.originalKey === record.originalKey);
        const personal = record.ownerId && record.id === "L-" + record.ownerId && record.taskId === "T-" + record.ownerId &&
            record.originalKey === "C-" + record.ownerId && record.phone === sample.records[0].phone;
        const call = /^CALL-(\d+)$/.exec(record.id || "");
        const predictive = call && record.taskId === "T-" + record.id && record.originalKey === "H-DEMO-" + call[1] &&
            record.phone === "13900000031";
        return record.demoTask === true || original || personal || predictive;
    }

    function removeRetiredDemoState(state) {
        const retiredCategory = item => ["三无忧", "留资未满"].includes(item.category) ||
            [item.categoryId, item.categoryContext].some(key => ["review21-sanwu", "review21-unfilled"].includes(key));
        const receipts = state.skynetReceipts || [];
        const book = window.DSkynetConfig.read(state);
        const oldReceipts = new Set(receipts.filter(receipt => receipt.tenant === state.tenant &&
            simulatedSources.has(receipt.sourceApplicationId) && legacyBinding(book,receipt)).map(receipt => receipt.id));
        const retiredRecords = state.records.filter(record => retiredCategory(record) || retiredAuditDemo(record) ||
            (record.tenant === state.tenant && (oldSample(record) || record.skynet && !record.skynet.internalHandoff &&
                (oldReceipts.has(record.skynet.intakeId) || simulatedSources.has(record.sourceApplicationId || record.skynet.sourceApplicationId) &&
                    legacyBinding(book,record.skynet)))));
        const retiredIds = new Set(retiredRecords.map(record => record.id));
        const retiredTaskIds = new Set(retiredRecords.map(record => record.taskId).filter(Boolean));
        const retiredReceipts = receipts.filter(receipt => receipt.tenant === state.tenant && simulatedSources.has(receipt.sourceApplicationId) &&
            (oldReceipts.has(receipt.id) || retiredTaskIds.has(receipt.taskId)));
        const retiredReceiptIds = new Set(retiredReceipts.map(receipt => receipt.id));
        if (retiredTaskIds.size || retiredReceiptIds.size) window.DSkynetIntake.reserveSkynetSequences(state);
        const dailyKey = seat => state.today + "|" + seat.id;
        const retiredCounts = [...retiredRecords, ...(state.testDrive?.tickets || [])];
        for (const seat of state.seats || []) {
            const counts = retiredCounts.map(record => record.dailyCounts?.[dailyKey(seat)]).filter(count => count && !count.refunded);
            seat.newCount = Math.max(0, Number(seat.newCount || 0) - counts.filter(count => count.kind === "new").length);
            seat.followCount = Math.max(0, Number(seat.followCount || 0) - counts.filter(count => count.kind === "continued").length);
        }
        state.records = state.records.filter(record => !retiredIds.has(record.id));
        if (retiredReceiptIds.size) state.skynetReceipts = receipts.filter(receipt => !retiredReceiptIds.has(receipt.id));
        if (retiredTaskIds.size && Array.isArray(state.callRecords)) {
            state.callRecords = state.callRecords.filter(record => !retiredTaskIds.has(record.taskId));
        }
        if (retiredTaskIds.size && Array.isArray(state.qualityCallAttempts)) {
            state.qualityCallAttempts = state.qualityCallAttempts.filter(record => !retiredTaskIds.has(record.taskId));
        }
        if (Array.isArray(state.intakeHistory)) {
            state.intakeHistory = state.intakeHistory.filter(item => !retiredCategory(item) && !retiredIds.has(item.recordId));
        }
        if (state.lifecycleIntakeResult && (retiredCategory(state.lifecycleIntakeResult) || retiredCategory(state.lifecycleIntakeDraft || {}))) delete state.lifecycleIntakeResult;
        if (state.lifecycleIntakeDraft && retiredCategory(state.lifecycleIntakeDraft)) delete state.lifecycleIntakeDraft;
        delete state.testDrive;
        delete state.allocationRules;
        delete state.lastAssignedSeatId;
        for (const record of state.records) {
            if (record.skynet?.roundId) continue;
            if (record.taskId && !record.ownerId && !record.expectedSeatId && ["待安排", "待分配"].includes(record.taskStatus) &&
                (record.dccAssignment || record.lastIntakeRequest)) {
                const wasQueued = record.taskStatus === "待分配" && ["人工外呼", "预外呼"].includes(record.requiredMode);
                record.taskStatus = "待分配";
                if (!wasQueued) {
                    record.requiredMode = "人工外呼";
                    record.waitReason = "";
                }
            }
            if (!record.ownerId && !record.expectedSeatId && record.taskStatus === "待分配") {
                delete record.waitReason;
                delete record.lastCheckedAt;
            }
            delete record.dccAssignment;
            delete record.smartFill;
            delete record.followupCallRef;
            delete record.followupTranscript;
            delete record.testDriveOrderId;
            if (record.followupResult === "试驾排程下发") record.followupResult = "";
            for (const visit of record.followupHistory || []) {
                if (visit.result === "试驾排程下发") visit.result = "";
            }
            const draft = record.followupDraft;
            if (!draft) continue;
            for (const field of draft.smartFields || []) {
                if (field === "visitDesc") draft.note = "";
                else {
                    if (draft.details) delete draft.details[field];
                    if (draft.options) delete draft.options[field];
                }
            }
            if (draft.result === "试驾排程下发") draft.result = "";
            delete draft.booking;
            delete draft.smartFields;
            delete draft.manualFields;
        }
        return {taskIds:retiredTaskIds,receiptIds:retiredReceiptIds,
            requestIds:new Set(retiredReceipts.map(receipt => receipt.requestId).filter(Boolean)),
            changed:retiredRecords.length > 0 || retiredReceipts.length > 0};
    }

    function stateFor(c, frame, {reload = false} = {}) {
        const tenant = scopeKey(c);
        const {rows, own} = nativeSeats(c, frame);
        const day = today();
        let state = states.get(tenant);
        const refreshing = state && reload && !isLatest(state);
        if (!state || refreshing) {
            let bytes, known=false;
            try {
                bytes=localStorage.getItem(readPrefix+tenant);
                const stored=readReviewBytes(bytes);
                known=bytes===null||stored?.tenant===tenant&&Array.isArray(stored.records);
                if (known) state=stored;
            } catch (_) { /* Keep unrecognized stored data available for recovery. */ }
            if (refreshing && !known) return null;
            if (!Array.isArray(state?.records)) {
                state = {tenant,today:day,seats:[],schedules:{},changes:[],records:[]};
            }
            const hasRetiredAllocation = Object.hasOwn(state,"allocationRules") || Object.hasOwn(state,"lastAssignedSeatId");
            const discarded = known && bytes !== null ? removeRetiredDemoState(state) : null;
            if(known)stateVersions.set(state,bytes);
            states.set(tenant,state);
            if ((discarded?.changed || hasRetiredAllocation) && persist(state) && discarded?.changed) {
                window.DBatchFailureLog?.discardDemoRecords(c,discarded);
                window.DSkynetDeliveryRecords?.discardDemoEvidence(c,discarded.taskIds);
            }
        }
        state.role = isAdmin(c) ? "admin" : "operator";
        state.seatId = own;
        if (state.today !== day) {
            state.today = day;
            state.seats.forEach(seat => { seat.newCount=0; seat.followCount=0; });
        }
        const previous = new Map(state.seats.map(seat => [seat.id,seat]));
        state.seats = rows.map(row => {
            const existing=previous.get(row.id);
            return existing ? Object.assign(existing,row) : {
                quotaMin:null, quotaMax:null, newCount:0, followCount:0, workWeChat:"", ...row
            };
        });
        // Retain object identity for active workbench handlers. Recover only
        // counts already evidenced by this local demo's current-day ledger.
        for (const seat of state.seats) {
            const entries=state.records.map(r=>r.dailyCounts?.[day+'|'+seat.id]).filter(v=>v&&!v.refunded);
            seat.newCount=Math.max(Number(seat.newCount||0),entries.filter(v=>v.kind==='new').length);
            seat.followCount=Math.max(Number(seat.followCount||0),entries.filter(v=>v.kind==='continued').length);
        }
        state.seatModes ||= {};
        if (own) {
            const phone=frame?.contentWindow;
            const online=phone?.AgentWorkbench?.telephoneStatus?.()?.online;
            const mode=phone?.AliCtiSeatOperations?.current?.()?.workingMode;
            const actualMode=online ? mode==='4'?'人工外呼':mode==='5'?'预外呼':'' : '';
            const modeChanged=state.seatModes[own]!==actualMode;
            state.seatModes[own]=actualMode;
            activeSessionSeat={identity:identity(c),tenant,seatId:own};
            if(modeChanged)persist(state);
        }
        return state;
    }

    function isLatest(state) {
        try {
            return stateVersions.has(state)&&localStorage.getItem(readPrefix+state.tenant)===stateVersions.get(state);
        } catch (_) { return false; }
    }

    function saveFailure(state,fallback="本次修改未保存，请重试。") {
        return isLatest(state)?stateSaveErrors.get(state) || fallback:"当前租户资料已变化，请刷新后再操作。";
    }

    function canSave(state) {
        if(isLatest(state))return true;
        toast(saveFailure(state));return false;
    }

    function persist(state) {
        stateSaveErrors.delete(state);
        if(!isLatest(state))return false;
        const recovery=window.DReviewStorageRecovery;
        const key=readPrefix+state.tenant;
        const sameSession=identity(context());
        const isQuota=error=>error?.name==='QuotaExceededError' || error?.name==='NS_ERROR_DOM_QUOTA_REACHED';
        const failed=error=>{
            if (isQuota(error)) stateSaveErrors.set(state,"浏览器本地存储空间不足，本次修改未保存。");
            else if (error?.name==='SecurityError') stateSaveErrors.set(state,"浏览器限制写入本地存储，本次修改未保存。");
            return false;
        };
        let raw,bytes;
        try {
            raw=JSON.stringify(state);
            bytes=recovery?.isPacked?.(stateVersions.get(state)) ? recovery.pack(raw) || raw : raw;
        } catch (error) { return failed(error); }
        if(!isLatest(state))return false;
        try { localStorage.setItem(key,bytes); }
        catch (error) {
            if (!isQuota(error) || !recovery) return failed(error);
            try { if (scopeKey(context())===state.tenant) recovery.reclaim(); }
            catch (_) { /* Packing the review ledger can still recover this write. */ }
            if (identity(context())!==sameSession || !isLatest(state)) return false;
            try {
                bytes=bytes===raw ? recovery.pack?.(raw) || raw : bytes;
                localStorage.setItem(key,bytes);
            } catch (retryError) { return failed(retryError); }
        }
        stateVersions.set(state,bytes);
        try { window.DBatchFailureLog?.capture(context(),state); }
        catch (_) { /* A failed log projection cannot roll back the saved operation. */ }
        return true;
    }

    function commitHandoffTask(state,stage) {
        const failure=()=>({error:saveFailure(state,"接收任务未保存，请重试。")});
        if (!allowedScope(context()) || state.tenant!==scopeKey(context()) || !isLatest(state)) return failure();
        const draft=structuredClone(state);
        stateVersions.set(draft,stateVersions.get(state));
        const result=stage(draft,getCloudFrame()?.contentWindow);
        if (result.error) return result;
        if (!persist(draft)) return failure();
        Object.assign(state,draft);
        stateVersions.set(state,stateVersions.get(draft));
        return result;
    }

    let dialog = null;
    let activeReview = null;
    let scheduleReview = null;

    function closeReview() {
        const node=dialog;
        activeReview=null;
        dialog=null;
        if (node?.open) node.close();
        node?.remove();
    }

    function canOpen(key, c, id) {
        if (!allowedScope(c)) return false;
        if (key === "info") return canUseWorkbench(c);
        if (key === "schedule") return DSession.allowed(schedulePage);
        return key === "seats" && id === "PAGE-2210" && isAdmin(c) && DSession.allowed(id);
    }

    function renderInfo(state,c) {
        const seat=state.seats.find(row=>row.id===state.seatId);
        if (!seat) return '<p class="muted">本人坐席信息暂未读取，请稍后再试。</p>';
        const external=window.DReview21Accounts?.read(state.tenant,c.account.id) || {};
        const {newCount,followCount}=DReview21Workbench.seatUsage(state,seat);
        const rows=[
            ["姓名",c.account.name],["所属租户",seat.tenantName],["登录账号",seat.account || seat.bindingState],["坐席工号",seat.employeeNo],
            ["企微员工号",external.unavailable ? "待核对" : external.workWeChat || "未关联"],
            ["今日班次",state.schedules[seat.id]?.[state.today] || "未配置"],
            ["新增／继续跟进",newCount==null ? "待核对" : newCount+"／"+followCount],
            ["最大接收量／新增目标",(seat.quotaMax??"未配置")+"／"+(seat.quotaMin??"未配置")]
        ];
        return '<dl class="detail-list">'+rows.map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join("")+
            '</dl><p class="review21-foot"><button type="button" class="btn" data-review21-schedule>查看我的排班</button></p>';
    }

    function makeUI(session, draw) {
        return {
            esc, toast, focusSeatId:session.focusSeatId,
            canSave:()=>session.identity===identity(context())&&canSave(session.state),
            save(message, update) {
                if (session.identity!==identity(context())) {
                    toast("当前使用范围已变化，请重新打开。");
                    return false;
                }
                if(!canSave(session.state))return false;
                if (session.key==="schedule" && update) {
                    const before=clone(session.state);
                    update();
                    if (!persist(session.state)) {
                        for (const key of Object.keys(session.state)) if (!Object.hasOwn(before,key)) delete session.state[key];
                        Object.assign(session.state,before);
                        toast(saveFailure(session.state));
                        return false;
                    }
                } else if(!persist(session.state)){
                    toast(saveFailure(session.state));
                    return false;
                }
                draw();
                toast(message);
                return true;
            },
            go(key) {
                if (session.identity!==identity(context())) return toast("当前使用范围已变化，请重新打开。");
                if (key===session.key) return draw();
                if (key==="schedule") {
                    closeReview();
                    DApp.openPage(schedulePage);
                    return;
                }
                if (!canOpen(key,context(),session.origin)) return toast("请在对应的业务页面打开。");
                session.key=key;
                draw();
            }
        };
    }

    function drawDialog() {
        const session=activeReview;
        const node=dialog;
        if (!session || !node?.isConnected) return;
        if (session.identity!==identity(context()) || session.origin!==activePage()) return closeReview();
        node.querySelector("h2").textContent=labels[session.key];
        const content=node.querySelector(".review21-content");
        if (session.key==="info") {
            content.innerHTML=renderInfo(session.state,context());
            content.querySelector("[data-review21-schedule]")?.addEventListener("click",() => {
                closeReview();
                DApp.openPage(schedulePage);
            });
        } else {
            const section=sections[session.key];
            const ui=makeUI(session,drawDialog);
            content.innerHTML=section.render(session.state,ui);
            section.bind?.(session.state,ui);
        }
    }

    async function openSection(key, options={}) {
        const c=context();
        const origin=activePage();
        if (!canOpen(key,c,origin)) return toast("当前身份无法办理此项操作。");
        if (key==="schedule") return DApp.openPage(schedulePage);
        let frame=getCloudFrame();
        if (!nativeSeats(c,frame).rows.length) {
            try { await DModuleHost.prepareIntegration(); } catch (_) { /* report at panel entry */ }
            frame=getCloudFrame();
        }
        if (identity(c)!==identity(context()) || origin!==activePage() || !canOpen(key,context(),origin)) return;
        const state=stateFor(c,frame);
        if (key==="seats" && !state.seats.length) return toast("当前租户暂无可查看的坐席。");
        const focusSeatId=state.seats.some(seat=>seat.id===options.seatId) ? options.seatId : "";
        closeReview();
        const node=document.createElement("dialog");
        node.className="review21-drawer";
        node.setAttribute("aria-labelledby","review21-drawer-title");
        node.innerHTML='<header><div><h2 id="review21-drawer-title"></h2><small>演示数据</small></div><button class="btn" type="button" data-review21-close>关闭</button></header><div class="review21-content"></div>';
        document.getElementById("workspace").appendChild(node);
        dialog=node;
        activeReview={key,state,origin,identity:identity(c),focusSeatId};
        node.addEventListener("close",()=>{if(dialog===node) closeReview();});
        node.querySelector("[data-review21-close]").addEventListener("click",closeReview);
        drawDialog();
        node.showModal();
    }

    function drawSchedule() {
        const session=scheduleReview;
        const root=document.getElementById("review21-schedule-content");
        if (!session || !root || session.identity!==identity(context()) || activePage()!==schedulePage) return;
        if (session.state.role==="operator" && (!session.state.seats.length || !session.state.seatId)) {
            root.innerHTML='<p class="muted">暂无可查看的排班。</p>';
            return;
        }
        const ui=makeUI(session,drawSchedule);
        root.innerHTML=sections.schedule.render(session.state,ui);
        sections.schedule.bind?.(session.state,ui);
    }

    const mountedSections=new WeakMap();
    const inlineStyles=`
        .review21-content{--line:#e8edf4;--text:#21324a;--muted:#64748b;color:var(--text);min-width:0}
        .review21-content .panel{background:#fff;border:1px solid var(--line);border-radius:8px;padding:12px;margin:0 0 12px;min-width:0}
        .review21-content :is(h2,h3){margin:0 0 8px;font-size:15px}
        .review21-content .muted{color:var(--muted)}
        .review21-content :is(.toolbar,.section-title,.metrics){display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:10px}
        .review21-content .section-title{justify-content:space-between}
        .review21-content .field{display:grid;gap:4px;min-width:0}
        .review21-content :is(input:not([type=checkbox]),select,textarea){min-height:32px;padding:5px 8px;border:1px solid #ccd7e4;border-radius:5px;background:#fff;color:var(--text);max-width:100%}
        .review21-content textarea{min-height:70px;resize:vertical}
        .review21-content .button{display:inline-flex;align-items:center;min-height:32px;border:1px solid #ccd7e4;border-radius:5px;padding:4px 10px;background:#fff;color:#214a7d;cursor:pointer}
        .review21-content .button.primary{border-color:#1677ff;background:#1677ff;color:#fff}
        .review21-content button:disabled{opacity:.55;cursor:not-allowed}
        .review21-content .notice{padding:8px 10px;background:#edf5ff;border-left:3px solid #82b5ff;border-radius:5px;margin:7px 0}
        .review21-content .tag{display:inline-block;padding:2px 7px;border-radius:5px;background:#eaf1fc;color:#215c9f;font-size:12px;white-space:nowrap}
        .review21-content .metric{flex:1 1 120px;padding:7px 10px;border:1px solid var(--line);border-radius:6px}
        .review21-content .metric strong{display:block;font-size:17px}
        .review21-content .empty{padding:10px;text-align:center;color:var(--muted)}
        .review21-content .table-wrap{overflow:auto}
        .review21-content table{width:100%;border-collapse:collapse;text-align:left}
        .review21-content :is(th,td){padding:6px 8px;border-bottom:1px solid var(--line)}
        .review21-content .lifecycle-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:9px}
        .review21-content .lifecycle-form :is(.toolbar,.notice,.dcc-intake-fields){grid-column:1/-1}
        .review21-content .dcc-intake-fields summary{cursor:pointer;color:#305676}
        .review21-content .dcc-intake-field-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:9px;margin-top:8px}
        .review21-content [hidden]{display:none!important}
        [data-review21-native-empty]{display:none!important}
    `;

    function frameStyles(doc) {
        if (doc.getElementById("review21-inline-styles")) return;
        const style=doc.createElement("style");
        style.id="review21-inline-styles";
        style.textContent=inlineStyles;
        doc.head.appendChild(style);
    }

    function canMountInline(key,c,id) {
        if (!allowedScope(c) || !DSession.allowed(id)) return false;
        if (key==="workbench") return id==="PAGE-2202" && canUseWorkbench(c);
        return key==="intake" && ["PAGE-2006","PAGE-2204","PAGE-2226"].includes(id) && isAdmin(c);
    }

    function mountSection(key,host,options={}) {
        const c=context(), id=activePage(), frame=getCloudFrame();
        if (!host?.isConnected || !frame || host.ownerDocument!==frame.contentDocument || !canMountInline(key,c,id)) return;
        const current=mountedSections.get(host);
        const detail=key==="workbench" ? window.DReview21Workbench?.seatLoginMode(host) : options.categoryHint;
        const mountKey=identity(c)+"|"+id+"|"+key+"|"+(detail||"");
        if (current===mountKey) return;
        const section=sections[key];
        if (!section) return;
        const state=stateFor(c,frame,{reload:key==="workbench"});
        if (!state || key==="workbench" && !state.seatId) return;
        mountedSections.set(host,mountKey);
        frameStyles(host.ownerDocument);
        host.classList.add("review21-content");
        const stillCurrent=()=>host.isConnected && activePage()===id && identity(context())===identity(c) && canMountInline(key,context(),id);
        const draw=()=>{
            if (!stillCurrent()) return;
            const ui={
                esc, toast, root:host, options,
                canSave:()=>stillCurrent()&&canSave(state),
                save(message,onFailure) {
                    if (!stillCurrent()) return false;
                    if (!persist(state)) {
                        if(typeof onFailure==="function"){onFailure();draw();}
                        toast(saveFailure(state,"保存未完成，请重试。"));
                        return false;
                    }
                    draw();
                    toast(message);
                    return true;
                },
                go(next) { if (next===key) draw(); }
            };
            host.innerHTML=section.render(state,ui);
            section.bind?.(state,ui);
        };
        draw();
    }

    if (!DNav.pages.some(page=>page.id===schedulePage)) {
        const seatIndex=DNav.pages.findIndex(page=>page.id==="PAGE-2210");
        DNav.pages.splice(seatIndex+1,0,{id:schedulePage,name:"排班管理",area:"呼叫中心",group:"坐席资源",menu:true,module:"public",route:"",phoneDomain:"outside"});
    }
    const originalPagePolicy=DRolePermissions.page;
    DRolePermissions.page=(id,c,seat)=>id===schedulePage
        ? allowedScope(c) && (isAdmin(c) || isOperator(c) && DSession.boundSeat(c))
        : originalPagePolicy(id,c,seat);
    window.Pages ||= {};
    Pages[schedulePage]={
        render:()=>'<section class="platform-page"><div class="d-page-heading"><h1>排班管理</h1></div><div id="review21-schedule-content" class="schedule-management"><p role="status">正在读取坐席排班…</p></div></section>',
        async init(c) {
            let frame=getCloudFrame();
            if (!nativeSeats(c,frame).rows.length) {
                try { await DModuleHost.prepareIntegration(); } catch (_) { /* render empty */ }
                frame=getCloudFrame();
            }
            if (identity(c)!==identity(context()) || activePage()!==schedulePage) return;
            scheduleReview={key:"schedule",origin:schedulePage,state:stateFor(c,frame),identity:identity(c)};
            drawSchedule();
        }
    };

    let observedFrame=null;
    let frameObserver=null;
    let queued=false;
    function queueMount() {
        if (queued) return;
        queued=true;
        requestAnimationFrame(()=>{queued=false;mount();});
    }
    function watchFrame(frame) {
        if (observedFrame===frame) return;
        frameObserver?.disconnect();
        window.DReview21InlineWorkbench?.unmount(observedFrame);
        observedFrame=frame;
        if (!frame) return;
        const observe=()=>{
            frameObserver?.disconnect();
            const body=frame.contentDocument?.body;
            if (!body || observedFrame!==frame) return;
            frameObserver=new MutationObserver(queueMount);
            frameObserver.observe(body,{childList:true,subtree:true});
            queueMount();
        };
        frame.addEventListener("load",observe);
        observe();
    }
    function mount() {
        const c=context(), id=activePage();
        if (activeReview && (activeReview.identity!==identity(c) || activeReview.origin!==id)) closeReview();
        const foot=document.querySelector(".d-sidebar-footnote");
        if (foot && foot.textContent!=="v2.0.0 · 评审演示") foot.textContent="v2.0.0 · 评审演示";
        window.DReview21Accounts?.mount(id,c);
        const frame=getCloudFrame();
        watchFrame(frame);
        if (c && id && frame && !frame.hidden && DModuleHost.isActive("cloud")) {
            window.DReview21Catalog?.mount({id,frame,context:c});
            window.DReview21Cloud?.mount({id,frame,context:c,openSection});
            const currentScope=()=>allowedScope(context()) && identity(context())===identity(c) && activePage()===id && DSession.allowed(id);
            const inline={id,frame,context:c,mountSection,notify:toast,
                getState:()=>currentScope() ? stateFor(c,frame) : null};
            window.DReview21InlineWorkbench?.mount(inline);
            window.DReview21InlineIntake?.mount(inline);
            window.DReview21InlineHandoff?.mount(inline);
            window.DReview21NurtureTasks?.mount(inline);
        } else {
            window.DReview21InlineWorkbench?.unmount(frame);
        }
        const actions=document.querySelector(".d-user");
        let info=actions?.querySelector("[data-review21-info]");
        if (actions && canUseWorkbench(c)) {
            if (!info) {
                info=document.createElement("button");
                info.type="button";
                info.className="d-text-button";
                info.dataset.review21Info="";
                info.textContent="我的工作信息";
                info.onclick=()=>openSection("info");
                actions.insertBefore(info,actions.querySelector("#logout"));
            }
        } else info?.remove();
    }

    let predictiveLedger;
    function predictiveCallbackRows(viewer, callId) {
        const c=context(),tenant=scopeKey(c);
        if (!tenant || !viewer || identity(viewer)!==identity(c) || scopeKey(viewer)!==tenant ||
            viewer.scope.tenant?.brandId!==c.scope.tenant?.brandId ||
            String(viewer.scope.tenant?.enterpriseId)!==String(c.scope.tenant?.enterpriseId) ||
            !DSession.allowed('PAGE-2208',c)) return null;
        try {
            const bytes=localStorage.getItem(readPrefix+tenant);
            if (predictiveLedger?.tenant!==tenant || predictiveLedger.bytes!==bytes) {
                const rows=new Map();
                const ledger=readReviewBytes(bytes);
                if (bytes!==null && ledger?.tenant!==tenant) return null;
                for (const row of Array.isArray(ledger?.callRecords)?ledger.callRecords:[]) {
                    if (row?.callType!=='预外呼' || row.tenant!==tenant || !row.predictiveCallback || !row.callId) continue;
                    if (!rows.has(row.callId)) rows.set(row.callId,[]);
                    rows.get(row.callId).push(row);
                }
                predictiveLedger={tenant,bytes,rows};
            }
            return predictiveLedger.rows.get(callId) || [];
        } catch (_) { return null; }
    }

    window.addEventListener('storage',event=>{
        if (event.key===readPrefix+scopeKey(context()) || event.key===null)
            window.DPredictiveAiHandoff?.refreshCdrLabels();
    });

    window.DReview21={openSection,
        context, isAdmin, allowedScope, canUseWorkbench,isLatest,saveFailure,predictiveCallbackRows,
        async ensureState({reload = false} = {}) {
            const c=context(); if (!allowedScope(c)) return null;
            let frame=getCloudFrame();
            if (!nativeSeats(c,frame).rows.length) {
                try { await DModuleHost.prepareIntegration(); } catch (_) { return null; }
                frame=getCloudFrame();
            }
            return identity(c)===identity(context()) ? stateFor(c,frame,{reload}) : null;
        },
        state({reload = false} = {}) {
            const c=context(),frame=getCloudFrame();
            if (!allowedScope(c) || identity(frame?.contentWindow?.DNativeContext?.context)!==identity(c)) return null;
            return stateFor(c,frame,{reload});
        },
        save(state) {
            return allowedScope(context()) && state.tenant===scopeKey(context()) && persist(state);
        },
        notify:toast
    };
    // Static prototype only: check the persistent waiting queue while this
    // workspace is open. No external calls or browser-closed background job.
    window.setInterval(()=>{
        const c=context();
        if (!allowedScope(c) || !getCloudFrame() || !window.DSkynetIntake?.tickColdNurture) return;
        const state=window.DReview21.state();
        if (!state || !state.records.some(task=>task.skynet?.pendingColdNurture)) return;
        const count=window.DSkynetIntake.tickColdNurture(state,c);
        if (count) toast(count + " 条冷线索已到期，已触发下一轮培育。");
    },15_000);
    window.DSkynetDeliveryRecords = window.createSkynetDeliveryRecords(tenant => {
        const stored=readReviewBytes(localStorage.getItem(readPrefix+tenant));
        if (!stored) return null;
        if (stored.tenant!==tenant || !Array.isArray(stored.records)) throw Error('租户业务记录暂时无法读取。');
        removeRetiredDemoState(stored);
        return stored;
    },commitHandoffTask);
    DSession.subscribe(c=>{
        if(activeSessionSeat&&activeSessionSeat.identity!==identity(c)){
            const old=states.get(activeSessionSeat.tenant);
            if(old?.seatModes){old.seatModes[activeSessionSeat.seatId]='';persist(old);}
            activeSessionSeat=null;
        }
    });
    new MutationObserver(queueMount).observe(document.getElementById("workspace"),{childList:true,subtree:true});
    queueMount();
})();
