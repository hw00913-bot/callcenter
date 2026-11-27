(() => {
    "use strict";

    const pages = new Set(["PAGE-2202", "PAGE-2226", "PAGE-2227"]);
    const sessions = new WeakMap();
    const cache = new Map();
    const prefix = "d-contact-210-inline-handoff-v1:";
    const waiting = "接收待核";

    function tenantOf(entry) {
        return entry.options.context?.scope?.id;
    }

    function current(entry) {
        const c = window.DSession?.context();
        const origin = entry.options.context;
        const frame = entry.options.frame;
        const native = frame.contentWindow?.DNativeContext?.context;
        return !!(c && origin && native && c.account.id === origin.account.id &&
            c.scope.id === origin.scope.id && native.account.id === c.account.id && native.scope.id === c.scope.id &&
            frame.isConnected && !frame.hidden && window.DApp?.currentPage() === entry.options.id &&
            window.DSession.allowed(entry.options.id,c));
    }

    function records(tenant) {
        if (cache.has(tenant)) return cache.get(tenant);
        let stored;
        try { stored=JSON.parse(localStorage.getItem(prefix+tenant)); } catch (_) { /* review session fallback */ }
        if (!Array.isArray(stored)) stored=[];
        cache.set(tenant,stored);
        return stored;
    }

    function persist(tenant, rows) {
        cache.set(tenant,rows);
        try { localStorage.setItem(prefix+tenant,JSON.stringify(rows)); } catch (_) { /* keep review data in this session */ }
    }

    function routeFor(entry,row) {
        const tenant=tenantOf(entry);
        let linked;
        try { linked=entry.options.getState?.()?.records; } catch (_) { /* origin stays pending */ }
        const saved=linked?.find(item=>item.tenant===tenant && item.nativeRecordId===row.recordId &&
            item.provenanceVerified===true);
        const origin=[row.review21Intake,row.originalImportSnapshot?.review21Intake,saved]
            .find(item=>item?.provenanceVerified===true && item.tenant===tenant && typeof item.originalKey==="string" && item.originalKey.trim());
        if (!origin) return "";
        if (origin.category==="留资线索" && origin.source==="本司业务系统") return "本司业务系统";
        if (origin.category==="培育线索" && origin.source==="第三方培育系统") return "第三方培育系统";
        return "";
    }

    function recordedFollowups(w, id) {
        const result=w.BusinessFlowStore?.timeline?.(id);
        if (result?.status!=="success") return [];
        return (result.data?.followups || []).filter(item=>!item.abandoned &&
            item.archiveState!=="ABANDONED" && (item.contentSaved===true || !!item.contentSnapshot?.savedAt));
    }

    function segmentOf(row) {
        return row.segmentId || row.followupId;
    }

    function dateOf(row) {
        return Date.parse(row.contentSnapshot?.savedAt || row.savedAt || row.updatedAt || row.endedAt || "") || 0;
    }

    function latestFollowup(w,id) {
        return recordedFollowups(w,id).sort((a,b)=>dateOf(a)-dateOf(b)).at(-1);
    }

    function detailFor(entry,id) {
        const result=entry.options.frame.contentWindow.BusinessFlowStore?.detail?.(id);
        const row=result?.data;
        return result?.status==="success" && row?.recordId===id && row.ownerTenantId===tenantOf(entry) &&
            row.viewIdentity!=="history" && row.viewIdentity!=="regulator" ? row : null;
    }

    function recordDecision(entry,target) {
        if (!current(entry) || !["是","否"].includes(target.decision)) return;
        const tenant=tenantOf(entry);
        const row=target.recordId ? detailFor(entry,target.recordId) : null;
        const destination=target.decision==="是" && row ? routeFor(entry,row) : "";
        const rows=records(tenant);
        const duplicate=rows.find(item=>item.kind===target.kind && item.id===target.id && item.segment===target.segment);
        if (duplicate) return;
        const status=target.decision==="否" ? "不下发，待本地结案" : destination ? "待交接" : "归口待确认";
        persist(tenant,[...rows,{...target,destination,status,at:new Date().toISOString()}]);
    }

    function rememberPending(entry,requestId,target) {
        const tenant=tenantOf(entry);
        const accountId=entry.options.context.account.id;
        const rows=records(tenant);
        if (rows.some(item=>item.kind==="pendingFollowup" && item.requestId===requestId && item.accountId===accountId)) return;
        persist(tenant,[...rows,{kind:"pendingFollowup",requestId,accountId,target}]);
    }

    function addDecision(anchor,draft) {
        const existing=anchor.querySelector("[data-review21-native-decision]");
        if (existing?.dataset.decisionKey===draft.key) return;
        existing?.remove();
        const doc=anchor.ownerDocument;
        const label=doc.createElement("label");
        label.className="field";
        label.dataset.review21NativeDecision="";
        label.dataset.decisionKey=draft.key;
        const title=doc.createElement("span");
        title.textContent="是否下发";
        const select=doc.createElement("select");
        select.setAttribute("aria-label","是否下发");
        for (const [value,text] of [["","暂不判定"],["是","是，交回来源"],["否","否，本地结案"]]) {
            const option=doc.createElement("option");
            option.value=value;
            option.textContent=text;
            select.appendChild(option);
        }
        select.value=draft.decision || "";
        select.addEventListener("change",()=>{draft.decision=select.value;});
        label.append(title,select);
        const reference=anchor.querySelector("#fnw-value-conflicts, .phone-record-more");
        anchor.insertBefore(label,reference?.parentElement===anchor ? reference : null);
    }

    function mountFlowForm(entry) {
        const frame=entry.options.frame;
        const doc=frame.contentDocument;
        const draft=entry.flowDraft;
        const summary=doc.getElementById("fnw-followup-summary");
        const layer=summary?.closest("#four-node-workspace-dialog");
        const body=layer?.querySelector(".layer-body");
        if (draft && body) addDecision(body,draft);
    }

    function mountSeatForm(entry) {
        if (entry.options.id!=="PAGE-2202") return;
        const w=entry.options.frame.contentWindow;
        const call=w.AgentWorkbench?.authorizationSnapshot?.();
        const row=call?.call;
        const node=w.document.getElementById("seat-disposition");
        if (call?.phase!=="wrap" || !row?.callId || row.tenantId!==tenantOf(entry) ||
            row.accountId!==entry.options.context.account.id || !node) return;
        const anchor=node.closest("label")?.parentElement;
        if (!anchor) return;
        const key="call:"+row.callId;
        const draft=entry.seatDraft?.key===key ? entry.seatDraft : {key,decision:"",callId:row.callId};
        entry.seatDraft=draft;
        addDecision(anchor,draft);
    }

    function installFlow(entry,w) {
        const workspace=w.FourNodeWorkspace;
        const store=w.BusinessFlowStore;
        if (!workspace || !store || entry.flowInstalled) return;
        entry.flowInstalled=true;
        const open=workspace.openSaveResult;
        if (typeof open==="function") workspace.openSaveResult=function(recordId,segmentId,...rest) {
            const before=w.document.getElementById("fnw-followup-summary");
            const outcome=open.call(this,recordId,segmentId,...rest);
            const after=w.document.getElementById("fnw-followup-summary");
            if (!current(entry) || !after || after===before) return outcome;
            entry.flowDraft=null;
            const basis=store.followupContext?.(recordId,segmentId);
            if (basis?.status!=="success" || basis.data?.canSave!==true ||
                basis.data.actualAccountId!==entry.options.context.account.id) return outcome;
            entry.flowDraft={key:"followup:"+recordId+":"+segmentId,recordId,segmentId,decision:""};
            mountFlowForm(entry);
            return outcome;
        };
        const save=store.saveResult;
        if (typeof save==="function") store.saveResult=function(recordId,payload,...rest) {
            const draft=entry.flowDraft;
            const decision=current(entry) && draft?.recordId===recordId && draft.segmentId===payload?.segmentId
                ? draft.decision : "";
            const outcome=save.call(this,recordId,payload,...rest);
            if (!decision) return outcome;
            const target={kind:"followup",id:recordId,recordId,segment:payload.segmentId,decision};
            const onResult=result=>{
                if (current(entry)) {
                    if (result?.status==="success" && recordedFollowups(w,recordId).some(row=>segmentOf(row)===target.segment)) {
                        recordDecision(entry,target);
                    } else if (result?.status==="unknown" && (result.requestId || result.data?.requestId)) {
                        rememberPending(entry,result.requestId || result.data.requestId,target);
                    }
                }
                return result;
            };
            return outcome?.then ? outcome.then(onResult) : onResult(outcome);
        };
        const reconcile=store.reconcile;
        if (typeof reconcile==="function") store.reconcile=function(requestId,...rest) {
            const tenant=tenantOf(entry);
            const pending=records(tenant).find(item=>item.kind==="pendingFollowup" &&
                item.requestId===requestId && item.accountId===entry.options.context.account.id);
            const outcome=reconcile.call(this,requestId,...rest);
            if (!pending) return outcome;
            const onResult=result=>{
                const reported=result?.requestId || result?.data?.requestId;
                if (!current(entry) || reported && reported!==requestId) return result;
                const status=result?.data?.status;
                const target=pending.target;
                if (result?.status==="success" && status==="success" &&
                    recordedFollowups(w,target.recordId).some(row=>segmentOf(row)===target.segment)) {
                    recordDecision(entry,target);
                    persist(tenant,records(tenant).filter(item=>item!==pending));
                } else if (status==="failed" && (result.status==="success" || reported===requestId && result.status==="failed")) {
                    persist(tenant,records(tenant).filter(item=>item!==pending));
                }
                return result;
            };
            return outcome?.then ? outcome.then(onResult) : onResult(outcome);
        };
    }

    function installSeat(entry,w) {
        const seat=w.AgentWorkbench;
        if (typeof seat?.saveDisposition!=="function" || entry.seatInstalled) return;
        entry.seatInstalled=true;
        const save=seat.saveDisposition;
        seat.saveDisposition=function(...args) {
            const before=seat.authorizationSnapshot?.();
            const call=before?.call;
            const draft=entry.seatDraft;
            const decision=current(entry) && entry.options.id==="PAGE-2202" && before?.phase==="wrap" &&
                call?.callId && draft?.callId===call.callId && call.tenantId===tenantOf(entry) &&
                call.accountId===entry.options.context.account.id ? draft.decision : "";
            const outcome=save.apply(this,args);
            if (decision && current(entry)) {
                const row=(w.CloudCallData?.calls || []).find(item=>item.callId===call.callId &&
                    item.accountId===call.accountId && item.tenantId===call.tenantId);
                if (row?.processingStatus==="已完成" && row.dispositionAt) {
                    const recordId=row.businessFlowRecordId || row.businessRecordId || row.fourNodeRecordId || "";
                    recordDecision(entry,{kind:"call",id:call.callId,recordId,segment:"",decision});
                }
            }
            return outcome;
        };
    }

    function displayedDecision(entry,id) {
        const w=entry.options.frame.contentWindow;
        const latest=latestFollowup(w,id);
        const rows=records(tenantOf(entry));
        if (latest) {
            const item=rows.find(row=>row.kind==="followup" && row.recordId===id && row.segment===segmentOf(latest));
            if (item) return item;
            const callIds=new Set((latest.calls || []).map(call=>call.callId).filter(Boolean));
            return rows.find(row=>row.kind==="call" && row.recordId===id && callIds.has(row.id));
        }
        const candidates=rows.filter(item=>item.kind==="call" && item.recordId===id &&
            (w.CloudCallData?.calls || []).some(call=>call.callId===item.id &&
                call.tenantId===tenantOf(entry) && call.processingStatus==="已完成"));
        return candidates.at(-1);
    }

    function updateReceipt(entry,row,item,value) {
        if (!current(entry) || !["已接收","明确拒绝",waiting].includes(value)) return;
        const live=detailFor(entry,row.recordId);
        const existing=live && displayedDecision(entry,row.recordId);
        const target=live && routeFor(entry,live);
        if (!live || live.readOnly || existing!==item || !target || target!==item.destination ||
            !["待交接",waiting].includes(item.status)) return;
        item.requestRef ||= "交接-"+(item.segment || item.id);
        item.status=value;
        persist(tenantOf(entry),records(tenantOf(entry)));
        renderDetail(entry);
    }

    function renderDetail(entry) {
        const w=entry.options.frame.contentWindow;
        const position=w.RouteRuntime?.snapshot?.();
        if (position?.key!=="business-record-detail") return;
        const id=position.options?.recordId;
        const doc=w.document;
        const root=doc.querySelector(".fnw-detail-grid > main");
        if (!id || !root) return;
        const row=detailFor(entry,id);
        let card=root.querySelector("[data-review21-inline-handoff]");
        if (!row) { card?.remove(); return; }
        const item=displayedDecision(entry,id);
        const signature=JSON.stringify([id,item?.id,item?.segment,item?.status,item?.destination,item?.requestRef,row.readOnly]);
        if (card?.dataset.signature===signature) return;
        if (!card) {
            card=doc.createElement("section");
            card.className="fnw-card";
            card.dataset.review21InlineHandoff="";
            root.querySelector(":scope > .fnw-card")?.after(card);
            if (!card.isConnected) root.appendChild(card);
        }
        card.dataset.signature=signature;
        const title=doc.createElement("h3");
        title.textContent="跟进结果交接";
        const status=doc.createElement("p");
        status.setAttribute("role","status");
        status.textContent=item ? "是否下发："+item.decision+"　"+item.status+(item.destination?" · "+item.destination:"") : "尚未记录本次下发决定。";
        card.replaceChildren(title,status);
        if (!item || row.readOnly) return;
        if (item.status==="已接收") {
            const hint=doc.createElement("p");
            hint.className="field-hint";
            hint.textContent="对方已收到，后续下发由接收系统处理。";
            card.appendChild(hint);
        }
        if (!["待交接",waiting].includes(item.status) || !item.destination) return;
        const controls=doc.createElement("div");
        controls.className="page-actions";
        const field=doc.createElement("label");
        field.className="field";
        const label=doc.createElement("span");
        label.textContent="演示对方回执";
        const select=doc.createElement("select");
        for (const [value,text] of [["","请选择"],["已接收","已接收"],["明确拒绝","明确拒绝"],[waiting,"暂未确认"]]) {
            const option=doc.createElement("option"); option.value=value; option.textContent=text; select.appendChild(option);
        }
        const button=doc.createElement("button");
        button.type="button";
        button.className="btn btn-primary";
        button.disabled=true;
        button.textContent=item.status===waiting ? "核对原交接" : "记录交接结果";
        select.addEventListener("change",()=>{button.disabled=!select.value;});
        button.addEventListener("click",()=>updateReceipt(entry,row,item,select.value));
        field.append(label,select);
        controls.append(field,button);
        card.appendChild(controls);
    }

    function renderList(entry) {
        const doc=entry.options.frame.contentDocument;
        const root=doc.querySelector("#page-content .fnw-workspace");
        if (!root || root.querySelector(".fnw-detail-grid")) return;
        for (const button of root.querySelectorAll(".management-list-shell .table-link[onclick]")) {
            const match=/^FourNodeWorkspace\.openRecord\(("([^"\\]|\\.)*")\)$/.exec(button.getAttribute("onclick") || "");
            if (!match) continue;
            let id;
            try { id=JSON.parse(match[1]); } catch (_) { continue; }
            const cell=button.closest("td");
            if (!cell) continue;
            let badge=cell.querySelector("[data-review21-handoff-badge]");
            const item=detailFor(entry,id) && displayedDecision(entry,id);
            if (!item) { badge?.remove(); continue; }
            if (!badge) {
                badge=doc.createElement("small");
                badge.className="fnw-secondary";
                badge.dataset.review21HandoffBadge="";
                cell.appendChild(badge);
            }
            if (badge.textContent!==item.status) badge.textContent=item.status;
        }
    }

    function renderSeatStatus(entry) {
        if (entry.options.id!=="PAGE-2202") return;
        const doc=entry.options.frame.contentDocument;
        const saved=doc.querySelector("#native-seat-workspace .seat-saved");
        const button=saved?.querySelector("button[onclick]");
        const match=/^AgentWorkbench\.records\('([^']+)'\)$/.exec(button?.getAttribute("onclick") || "");
        if (!saved || !match) return;
        const item=records(tenantOf(entry)).find(row=>row.kind==="call" && row.id===match[1]);
        if (!item) return;
        let state=saved.querySelector("[data-review21-native-handoff-status]");
        if (!state) {
            state=doc.createElement("span");
            state.dataset.review21NativeHandoffStatus="";
            saved.appendChild(state);
        }
        if (state.textContent!==item.status) state.textContent=item.status;
    }

    function mount(options) {
        const frame=options?.frame;
        if (!frame?.contentDocument || !pages.has(options.id)) return;
        const w=frame.contentWindow;
        let entry=sessions.get(w);
        if (!entry) {
            entry={options};
            sessions.set(w,entry);
        }
        entry.options=options;
        if (!current(entry)) return;
        installFlow(entry,w);
        installSeat(entry,w);
        mountFlowForm(entry);
        mountSeatForm(entry);
        renderDetail(entry);
        renderList(entry);
        renderSeatStatus(entry);
    }

    const skynetLedgerTitles = {sent:"下发记录",incoming:"内部接收记录"};
    const skynetDeliveryTargetTypes = {externalSystem:"外部系统",internalTenant:"内部租户"};
    const ledgerDate = new Intl.DateTimeFormat("zh-CN", {
        timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"
    });

    function skynetStatus(row) {
        return window.DSkynetDeliveryRecords.statusLabel(row);
    }

    function skynetTime(value) {
        const date=Date.parse(value);
        return Number.isFinite(date) ? ledgerDate.format(date) : "—";
    }

    function skynetParty(row,direction) {
        return direction==="incoming" ? row.senderTenantName || row.senderTenantId : row.target.label || row.target.id;
    }

    function openingScope() {
        const context=DSession.context();
        return [context?.account.id,context?.scope.id,context?.scope.tenant?.brandId,DApp.currentPage()].join("|");
    }

    function editableExternal(row) {
        return row.target.type==="externalSystem" && ["awaitingReceipt","unknown"].includes(row.status);
    }

    function canOpenTask(tenantId,taskId,roundId,receiptId) {
        const context=DSession.context();
        if (!taskId || tenantId!==context?.scope.id || !DSession.allowed("PAGE-21008",context) ||
            !window.DReview21NurtureTasks?.openTask) return false;
        const task=window.DReview21?.state()?.records?.find(item=>{
            if (item.tenant!==tenantId || item.taskId!==taskId || !item.skynet) return false;
            const handoff=item.skynet.internalHandoff;
            return receiptId ? handoff?.receiptId===receiptId && handoff.receiverRoundId===roundId :
                item.skynet.roundId===roundId;
        });
        return Boolean(task && window.DReview21Operations?.canViewTask(task,context));
    }

    function skynetLedgerList(view,rows) {
        const e=DUI.esc;
        const pageSize=10;
        const keyword=view.keyword.toLowerCase();
        const filtered=rows.filter(row=>[row.requestId,row.taskId,row.roundId,row.receiptId,row.receiverTaskId,skynetParty(row,view.direction)]
            .some(value=>String(value ?? "").toLowerCase().includes(keyword)));
        const total=Math.max(1,Math.ceil(filtered.length/pageSize));
        view.page=Math.min(view.page,total);
        const resultRows=filtered.slice((view.page-1)*pageSize,view.page*pageSize).map(row=>
            '<tr data-skynet-handoff-record="'+e(row.id)+'"><td>'+e(row.requestId)+'</td><td>'+e(row.taskId)+
            '</td><td>'+e(row.roundId)+'</td><td>'+e(skynetParty(row,view.direction))+'</td><td>'+e(skynetStatus(row))+
            (view.direction==="incoming" && row.receiverTaskId ?
                '<small class="skynet-ledger-task-id">本租户任务 '+e(row.receiverTaskId)+'</small>' : '')+
            '</td><td>'+e(skynetTime(row.sentAt))+'</td><td><button type="button" class="btn-link" data-skynet-handoff-detail="'+
            e(row.id)+'">详情</button></td></tr>').join("");
        return '<form class="filter-panel skynet-ledger-filter" data-rtl-region="filters" data-skynet-handoff-query>'+
            '<label class="field"><span>搜索记录</span><input class="form-control" type="search" name="keyword" '+
            'placeholder="请求、任务、轮次或凭据编号" value="'+e(view.keyword)+'"></label>'+
            '<div class="filter-actions"><button type="submit" class="btn btn-primary">查询</button> '+
            '<button type="button" class="btn" data-skynet-handoff-reset>重置</button></div></form>'+
            '<div class="table-scroll" role="region" tabindex="0" aria-label="'+e(skynetLedgerTitles[view.direction])+
            '" data-rtl-region="table"><table class="platform-table"><thead><tr>'+
            ["原请求编号","原培育任务","原轮次",view.direction==="incoming"?"发送租户":"下发目标","状态","发起时间","操作"]
                .map(label=>'<th scope="col">'+label+'</th>').join("")+'</tr></thead>'+
            '<tbody>'+(resultRows || '<tr><td class="skynet-ledger-empty" colspan="7">'+
            (view.keyword?"没有符合条件的记录":"暂无记录")+'</td></tr>')+'</tbody></table></div>'+
            '<div class="skynet-ledger-pagination" data-rtl-region="pagination" aria-label="记录分页">共 '+ filtered.length +' 条'+
            (total>1?' <button type="button" class="btn" data-skynet-handoff-page="'+(view.page-1)+'" '+
            (view.page===1?'disabled':'')+'>上一页</button> <span>'+view.page+' / '+total+
            '</span> <button type="button" class="btn" data-skynet-handoff-page="'+(view.page+1)+'" '+
            (view.page===total?'disabled':'')+'>下一页</button>':'')+'</div>';
    }

    function receiverTaskForm(view,row) {
        const e=DUI.esc;
        const {rules=[],strategies=[],error}=view.service.taskOptions(row.id);
        if (error || !rules.length) {
            return '<p class="d-muted">'+e(error || "本租户当前没有可用分配规则。")+'</p>';
        }
        const rule=rules.find(item=>item.id===view.taskDraft.ruleId);
        const available=rule ? strategies.filter(item=>item.categoryId===rule.categoryId) : [];
        const options=(rows,selected,placeholder="请选择")=>'<option value="">'+e(placeholder)+'</option>'+rows.map(item=>
            '<option value="'+e(item.id)+'" data-version="'+e(item.version)+'"'+
            (item.id===selected?' selected':'')+'>'+e(item.name+' · v'+item.version)+'</option>').join("");
        return '<section class="skynet-ledger-receive-task" aria-label="建立本租户培育任务">'+
            '<h3>建立本租户培育任务</h3><form class="skynet-ledger-filter" data-skynet-receiver-form>'+
            '<label class="field"><span>分配规则</span><select class="form-select" data-skynet-receiver-rule required>'+
            options(rules,view.taskDraft.ruleId)+'</select></label>'+
            '<label class="field"><span>培育策略</span><select class="form-select" data-skynet-receiver-strategy required'+
            (available.length?'':' disabled')+'>'+options(available,view.taskDraft.strategyId,
                rule?"请选择":"请先选择分配规则")+'</select></label>'+
            '<div class="filter-actions"><button type="submit" class="btn btn-primary" data-skynet-receiver-create'+
            (available.length?'':' disabled')+'>建立培育任务</button></div></form>'+
            (rule && !available.length?'<p class="d-muted">该分配规则的二级分类暂无可用培育策略。</p>':'')+'</section>';
    }

    function skynetLedgerDetail(view,row) {
        const e=DUI.esc;
        const incoming=view.direction==="incoming";
        const internal=row.target.type==="internalTenant";
        const canAct=view.service.canAct(view.direction);
        const fields=[
            ["原请求编号",row.requestId],["原培育任务",row.taskId],["原轮次",row.roundId],
            ["发送租户",row.senderTenantName || row.senderTenantId],
            ["下发目标类型",skynetDeliveryTargetTypes[row.target.type]],["具体下发目标",row.target.label || row.target.id],
            ...(row.application ? [["接收应用",row.application.name || row.application.id],
                ["应用配置版本",row.application.revision],["外部请求单号",row.externalId]] : []),
            ...(row.storeName ? [["下发门店",row.storeName],["下发门店编码",row.storeCode]] : []),
            ...(row.storeMatch ? [["匹配门店业务编码",row.storeMatch.storeCode || "—"],
                ["接收目标来源",row.additionalReceiver ? "1 发多额外指定" : "系统匹配"],
                ["匹配依据",row.storeMatch.kind === "brandHeadquarters" ? "同品牌总部关系" : "品牌、真实门店编码与租户关联"],
                ["门店来源",row.storeMatch.sourceId || row.storeMatch.capabilityId || "同品牌统一门店编码"],
                [row.additionalReceiver ? "意向门店匹配租户（必含目标）" : "匹配的接收租户",row.storeMatch.tenantId]] : []),
            ["下发模板",row.templateName || row.templateId],["下发模板版本",row.templateVersion && "v"+row.templateVersion],
            ["下发类型",row.typeLabel],["下发方式",row.modeLabel],["触发方式",row.trigger==="automatic"?"系统自动":"负责坐席手动"],
            ["发起时间",skynetTime(row.sentAt)],["提交次数",row.attempt],
            ["结果状态",skynetStatus(row),"data-skynet-handoff-status"],
            [internal?"模拟接收流水单号":"模拟外部受理回执",row.receiptId,"data-skynet-handoff-receipt"],
            ["结果登记时间",skynetTime(row.resultAt)]
        ];
        if (internal && row.receiverTaskId) {
            fields.push([incoming?"本租户培育任务":"接收方培育任务",row.receiverTaskId,"data-skynet-receiver-task"]);
            if (incoming) fields.push(
                ["本租户任务首轮",row.receiverRoundId],
                ["本租户分配规则",row.receiverRuleName && row.receiverRuleName+" · v"+row.receiverRuleVersion],
                ["本租户培育策略",row.receiverStrategyName && row.receiverStrategyName+" · v"+row.receiverStrategyVersion],
                ["本租户任务状态",row.receiverTaskStatus],
                ["任务建立时间",skynetTime(row.taskCreatedAt)]
            );
        }
        let actions="";
        if (canAct && incoming && row.status==="awaitingReceipt") {
            actions='<div class="page-actions"><button type="button" class="btn btn-primary" data-skynet-handoff-accept>模拟接收</button></div>';
        } else if (canAct && incoming && row.status==="received" && row.receiptId && !row.receiverTaskId) {
            actions=receiverTaskForm(view,row);
        } else if (canAct && !incoming && editableExternal(row)) {
            actions='<form class="skynet-ledger-filter" data-skynet-external-form="'+e(row.attempt)+'">'+
                '<label class="field"><span>外部系统模拟回执</span><select class="form-select" data-skynet-external-outcome required>'+
                '<option value="">请选择</option><option value="accepted">已受理</option><option value="failed">明确失败</option>'+
                '<option value="unknown">结果待核</option></select></label>'+
                '<div class="filter-actions"><button type="submit" class="btn btn-primary" data-skynet-external-confirm>登记模拟回执</button></div></form>';
        } else if (canAct && !incoming && !internal && row.status==="failed") {
            actions='<div class="page-actions"><button type="button" class="btn btn-primary" data-skynet-external-retry>按原请求重试</button></div>';
        }
        return '<section data-skynet-handoff-view="'+e(row.id)+'">'+
            '<button type="button" class="btn-link" data-skynet-handoff-back>返回记录列表</button>'+
            (!incoming && canOpenTask(row.senderTenantId,row.taskId,row.roundId) ?
                ' <button type="button" class="btn-link" data-skynet-open-original-task>查看原任务</button>' : '')+
            (incoming && row.receiverTaskId && canOpenTask(row.target.id,row.receiverTaskId,row.receiverRoundId,row.receiptId) ?
                ' <button type="button" class="btn-link" data-skynet-open-receiver-task>查看本租户任务</button>' : '')+
            '<dl class="d-org-details skynet-ledger-details">'+fields.map(([label,value,attr])=>
                '<dt>'+label+'</dt><dd'+(attr?' '+attr:'')+'>'+e(value ?? "—")+'</dd>').join("")+'</dl>'+
            '<p class="d-muted">'+(internal?"接收状态以模拟接收流水为准。":"外部回执仅表示模拟接口受理结果。")+
            '</p>'+actions+'</section>';
    }

    function refreshSkynetLedger(view,message="",focus="") {
        if (openingScope()!==view.scope || !view.service.canView(view.direction)) return view.modal.close();
        const result=view.service.list(view.direction);
        const row=view.id && result.rows?.find(record=>record.id===view.id);
        view.displayedRow=row || null;
        const notice=result.error || message || (view.id && !row ? "当前租户未找到该记录。" : "");
        if (!row) {
            view.id="";
            view.taskDraft={ruleId:"",strategyId:""};
        }
        view.host.innerHTML='<div class="skynet-ledger-feedback" role="status">'+DUI.esc(notice)+'</div>'+
            (result.error?"":row?skynetLedgerDetail(view,row):skynetLedgerList(view,result.rows || []));
        if (focus) (view.host.querySelector(focus) || view.modal.buttons[0])?.focus();
    }

    function openSkynetLedger(direction,{id="",trigger}={}) {
        const service=window.DSkynetDeliveryRecords;
        if (!Object.hasOwn(skynetLedgerTitles,direction) || !service?.canView(direction)) return false;
        const modal=DUI.dialog(skynetLedgerTitles[direction],
            '<section data-skynet-handoff-ledger="'+direction+'" data-rtl-page-type="list"></section>',
            [{label:"关闭",run:close=>{close(); if (trigger?.isConnected) trigger.focus();}}],
            {stack:true,dismissible:true});
        const host=modal.element.querySelector('[data-skynet-handoff-ledger]');
        modal.element.querySelector('.d-dialog').classList.add('skynet-config-popup','skynet-ledger-modal');
        host.closest('.d-dialog').querySelector('h2').dataset.rtlRegion="page-header";
        const view={id,direction,host,modal,service,scope:openingScope(),keyword:"",page:1,
            taskDraft:{ruleId:"",strategyId:""},creatingTask:false};
        const current=()=>openingScope()===view.scope && service.canView(direction);
        // Reload the scoped record after each operation.
        function update(result) {
            refreshSkynetLedger(view,result.error || "",'[data-skynet-handoff-back]');
        }
        host.addEventListener("click",event=>{
            const button=event.target.closest("button");
            if (!button || !current()) return;
            const {skynetHandoffDetail,skynetHandoffPage}=button.dataset;
            if (skynetHandoffDetail) {
                view.id=skynetHandoffDetail;
                view.taskDraft={ruleId:"",strategyId:""};
                return refreshSkynetLedger(view,"",'[data-skynet-handoff-back]');
            }
            if (button.hasAttribute("data-skynet-handoff-back")) view.id="";
            else if (button.hasAttribute("data-skynet-handoff-reset")) {
                view.keyword="";
                view.page=1;
            } else if (skynetHandoffPage) view.page=Number(skynetHandoffPage);
            else if (button.hasAttribute("data-skynet-open-original-task") && direction==="sent") {
                const row=service.list(direction).rows?.find(record=>record.id===view.id);
                if (row && canOpenTask(row.senderTenantId,row.taskId,row.roundId) && window.DReview21NurtureTasks.openTask(row.taskId)) {
                    return modal.close();
                }
                return refreshSkynetLedger(view,"当前无法打开该原任务。",'[data-skynet-handoff-back]');
            } else if (button.hasAttribute("data-skynet-open-receiver-task") && direction==="incoming") {
                const row=service.list(direction).rows?.find(record=>record.id===view.id);
                if (row && canOpenTask(row.target.id,row.receiverTaskId,row.receiverRoundId,row.receiptId) &&
                    window.DReview21NurtureTasks.openTask(row.receiverTaskId)) {
                    return modal.close();
                }
                return refreshSkynetLedger(view,"当前无法打开该本租户任务。",'[data-skynet-handoff-back]');
            } else if (button.hasAttribute("data-skynet-handoff-accept") && direction==="incoming" && service.canAct(direction)) {
                return update(service.accept(view.id));
            } else if (button.hasAttribute("data-skynet-external-retry") && direction==="sent" && service.canAct(direction)) {
                const row=view.displayedRow;
                if (!row || row.id!==view.id) return refreshSkynetLedger(view,"请重新打开原下发记录。");
                return update(service.retryExternal(view.id,{attempt:row.attempt,requestId:row.requestId,targetId:row.target.id,
                    applicationId:row.application?.id,connectionKey:row.application?.connectionKey}));
            } else return;
            refreshSkynetLedger(view,"",'[name="keyword"]');
        });
        host.addEventListener("change",event=>{
            if (!current() || view.creatingTask) return;
            if (event.target.hasAttribute("data-skynet-receiver-rule")) {
                view.taskDraft={ruleId:event.target.value,strategyId:""};
                return refreshSkynetLedger(view,"",'[data-skynet-receiver-rule]');
            }
            if (event.target.hasAttribute("data-skynet-receiver-strategy")) view.taskDraft.strategyId=event.target.value;
        });
        host.addEventListener("submit",async event=>{
            event.preventDefault();
            const form=event.target;
            if (!current()) return;
            if (form.hasAttribute("data-skynet-handoff-query")) {
                view.keyword=form.elements.keyword.value.trim();
                view.page=1;
                return refreshSkynetLedger(view,"",'[name="keyword"]');
            }
            if (form.hasAttribute("data-skynet-external-form") && direction==="sent" && service.canAct(direction)) {
                const row=view.displayedRow;
                if (!row || row.id!==view.id) return refreshSkynetLedger(view,"请重新打开原下发记录。");
                const value=form.querySelector('[data-skynet-external-outcome]').value;
                update(service.simulateExternal(view.id,value,Number(form.dataset.skynetExternalForm),{
                    requestId:row.requestId,targetId:row.target.id,applicationId:row.application?.id,connectionKey:row.application?.connectionKey}));
            }
            if (form.hasAttribute("data-skynet-receiver-form") && direction==="incoming" &&
                service.canAct(direction) && !view.creatingTask) {
                const rule=form.querySelector("[data-skynet-receiver-rule]");
                const strategy=form.querySelector("[data-skynet-receiver-strategy]");
                if (!rule.value || !strategy.value) return;
                const id=view.id;
                const selection={ruleId:rule.value,strategyId:strategy.value,
                    ruleVersion:rule.selectedOptions[0].dataset.version,strategyVersion:strategy.selectedOptions[0].dataset.version};
                view.taskDraft={ruleId:rule.value,strategyId:strategy.value};
                view.creatingTask=true;
                const submit=form.querySelector("[data-skynet-receiver-create]");
                [rule,strategy,submit].forEach(control=>{control.disabled=true;});
                form.setAttribute("aria-busy","true");
                submit.textContent="正在建立…";
                let result;
                try { result=await service.createTask(id,selection); }
                catch (_) { result={error:"本次任务尚未确认建立，请刷新后核对。"}; }
                finally { view.creatingTask=false; }
                if (modal.element.isConnected && current() && view.id===id) {
                    refreshSkynetLedger(view,result.error || "",result.error?'[data-skynet-receiver-create]':'[data-skynet-open-receiver-task]');
                }
            }
        });
        const observer=new MutationObserver(()=>{
            if (modal.element.isConnected && current()) return;
            observer.disconnect();
            modal.close();
        });
        observer.observe(modal.element.parentElement,{childList:true});
        const nav=document.getElementById("main-nav");
        if (nav) observer.observe(nav,{childList:true});
        modal.element.addEventListener("keydown",event=>{
            if (event.key!=="Tab") return;
            const controls=[...modal.element.querySelectorAll('button:not(:disabled),select,input,[tabindex="0"]')];
            const first=controls[0],last=controls.at(-1);
            if (event.shiftKey ? document.activeElement===first : document.activeElement===last) {
                event.preventDefault();
                (event.shiftKey ? last : first)?.focus();
            }
        });
        refreshSkynetLedger(view,"",id?'[data-skynet-handoff-back]':'[name="keyword"]');
        return true;
    }

    window.DReview21InlineHandoff={mount,openSkynetLedger};
})();
