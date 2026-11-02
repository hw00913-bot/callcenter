/* One local contact-policy authority. Original source records are not rewritten. */
(function(){
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x)),methods=['AI','MANUAL','PREDICTIVE','IVR','INBOUND'],legacyGroupId='legacy-customer-refusal';
  function create(session,storage,fixtures=()=>({groups:[],rows:[],calls:[]}),clock=()=>Date.now()){
    const key=session.prefix+'contact-policy';
    const nativePrefix=()=>session.nativeStoragePrefix?session.nativeStoragePrefix():session.prefix+'cloud:';
    function read(){let raw;try{raw=storage.getItem(key);}catch(_){throw Error('联系限制暂时无法读取，请重试。');}if(raw===null)return {version:1,publicRecords:[],releases:[],specialScopes:{},audit:[]};let d;try{d=JSON.parse(raw);}catch(_){throw Error('联系限制记录格式异常，原数据保留。');}if(d.version!==1||!Array.isArray(d.publicRecords)||!Array.isArray(d.releases)||!d.specialScopes||Array.isArray(d.specialScopes)||!Array.isArray(d.audit))throw Error('联系限制记录需要核对，不能视为空名单。');return d;}
    function write(d){try{storage.setItem(key,JSON.stringify(d));}catch(_){throw Error('保存失败，原记录未改变，请保留输入后重试。');}try{if(storage.getItem(key)!==JSON.stringify(d))throw Error();}catch(_){throw Error('保存结果待核，请先重新读取本次记录，不要重复提交。');}}
    const context=()=>session.context();
    const normalize=p=>typeof p==='string'?p.trim().replace(/[\s-]/g,''):'';
    const valid=p=>/^(1[3-9]\d{9}|0\d{9,11})$/.test(normalize(p));
    const stamp=()=>new Date(clock()).toISOString();
    const uid=prefix=>prefix+'-'+clock()+'-'+Math.random().toString(36).slice(2,10);
    function scopeAllowed(tenantId){const c=context();return !!c&&(c.scope.kind==='tenant'?c.scope.id===tenantId:(c.scope.grant.tenantIds||[]).includes(tenantId));}
    const blacklistReadOnly=(c=context())=>!!c&&(session.roleKey?.(c)==='super'||c.scope.grant.role==='super'||c.account.platformAdministrator===true);
    function administrator(tenantId){const c=context();return scopeAllowed(tenantId)&&(session.isPlatformContext(c)?(c.scope.grant.permissions||[]).includes('tenant.update'):c.scope.grant.role==='admin');}
    function canPublic(tenantId,action='view'){const c=context();if(!scopeAllowed(tenantId)||!session.allowed('PAGE-2007')||action!=='view'&&blacklistReadOnly(c))return false;if(action==='release')return administrator(tenantId);if(action==='add')return administrator(tenantId)||c.scope.kind==='tenant'&&c.scope.grant.contactAdd===true;return session.roleKey?.(c)?session.can('F45',c):administrator(tenantId)||c.scope.grant.pages.includes('PAGE-2007')||c.scope.grant.contactAdd===true;}
    function enabledModule(name,c=context()){return !!c&&c.scope.kind==='tenant'&&c.scope.tenant?.modules?.[name]===true&&(c.scope.grant.modules||[]).includes(name);}
    function specialScope(){const c=context();if(!c)return '';if(c.scope.kind==='platform')return c.scope.grant.specialScope||'';return enabledModule('ai',c)||enabledModule('cloud',c)||canPublic(c.scope.id)?'tenant:'+c.scope.id:'';}
    function canOrdinary(scope,action='view'){
      const c=context();if(!c||!scope||specialScope()!==scope||!session.allowed('PAGE-2007')||action!=='view'&&blacklistReadOnly(c))return false;
      if(c.scope.kind==='platform')return (c.scope.grant.specialPermissions||[]).includes(action==='view'?'view':action==='sync.update'?'sync.enable':action);
      if(!enabledModule('ai',c)&&!enabledModule('cloud',c))return false;
      if(session.roleKey?.(c))return session.can(action==='view'?'F49':'F50',c);
      const roles=c.scope.grant.moduleRoles||{};return action==='view'?!!(enabledModule('ai',c)&&roles.ai||enabledModule('cloud',c)&&roles.cloud):(enabledModule('ai',c)&&roles.ai==='admin'||enabledModule('cloud',c)&&roles.cloud==='admin');
    }
    function canSpecial(scope,action='view'){
      if(!['view','group.create','group.update','group.delete','record.add','record.confirm','record.import','record.export','record.move','record.remove','sync.enable','sync.update','sync.disable','sync.retry'].includes(action))return false;
      const c=context();if(!c||!scope||specialScope()!==scope||!session.allowed('PAGE-2007')||action!=='view'&&blacklistReadOnly(c))return false;
      if(action==='record.confirm')return c.scope.kind==='tenant'&&canPublic(c.scope.id,'add')&&session.allowed('PAGE-2108');
      if(canOrdinary(scope,action))return true;
      return c.scope.kind==='tenant'&&(action==='view'&&canPublic(c.scope.id)||action==='record.remove'&&canPublic(c.scope.id,'release'));
    }
    function humanRows(){const prefix=nativePrefix(),nativeKey=prefix+'native-workbench-records-v1';let raw;try{raw=storage.getItem(nativeKey);}catch(_){throw Error('人工话后限制状态未能读取，暂不能确认可外呼。');}if(raw===null)return [];let rows;try{rows=JSON.parse(raw);}catch(_){throw Error('人工话后记录待核，不能视为无联系限制。');}if(!Array.isArray(rows))throw Error('人工话后记录格式待核。');
      const result=[],seen=new Map();for(const r of rows){const v=r.publicRefusalEvent;if(!v||v.schema!==1||v.origin!=='human-aftercall'||r.callSource!=='NATIVE_WORKBENCH')continue;const pending=v.committed!==true,id='human:'+(prefix===session.prefix+'cloud:'?'':prefix.slice((session.prefix+'cloud:').length))+r.tenantId+':'+r.callId;const record={id,tenantId:r.tenantId,phone:normalize(v.phone),sourceType:'human',sourceCallId:r.callId,reason:pending?'拒联话后保存结果待核':'客户明确拒绝后续联系',operatorId:v.operatorId,createdAt:v.at,state:pending?'pending':'active',remoteState:'待核对'};
        if(v.tenantId!==r.tenantId||v.callId!==r.callId){record.phone='';record.state='pending';}
        if(seen.has(id)){const prior=seen.get(id);if(prior.phone!==record.phone){prior.phone='';prior.state='pending';}continue;}seen.set(id,record);result.push(record);
      }return result;
    }
    function allPublic(d){const merged=new Map(d.publicRecords.map(r=>[r.id,r]));humanRows().forEach(r=>merged.set(r.id,r));return [...merged.values()].map(r=>{const release=d.releases.find(x=>x.id===r.id&&x.tenantId===r.tenantId);return {...clone(r),...(release?{state:'released',releasedAt:release.at,releaseReason:release.reason,releasedBy:release.actorId}:{})};});}
    function list(tenantId){if(!canPublic(tenantId))throw Error('没有本租户黑名单查看权限。');return DListOrder.rows(allPublic(read()).filter(r=>r.tenantId===tenantId),{keys:[...DListOrder.updateKeys,'releasedAt'],fallbackKeys:['createdAt']});}
    function aiCalls(tenantId){const c=context();if(!scopeAllowed(tenantId)||!session.allowed('PAGE-2108'))throw Error('需要本租户原AI通话记录查看权限。');return clone(fixtures().calls||[]);}
    function add(input,requestId){const {tenantId}=input;if(!canPublic(tenantId,'add'))throw Error('没有本租户黑名单新增权限。');const phone=normalize(input.phone);if(!valid(phone))throw Error('请输入完整的手机号或带区号固定电话。');if(input.confirmed!==true)throw Error('请先确认客户明确拒绝后续联系。');const reason=String(input.reason||'').trim();if(!reason)throw Error('请填写确认依据。');
      const c=context();let sourceCallId='',sourceType=input.sourceType;
      if(sourceType==='ai'){const call=aiCalls(tenantId).find(r=>String(r.sessionId)===String(input.sourceCallId)&&r.platform===input.platform);if(!call||normalize(call.phone)!==phone)throw Error('来源通话、所属平台或号码不匹配，请重新核对。');sourceCallId=String(call.sessionId);}else{if(!administrator(tenantId))throw Error('授权运营须从有权AI通话记录确认拒联，不能绕过来源核验。');sourceType='manual';}
      const d=read(),id=sourceType==='ai'?'ai:'+tenantId+':'+input.platform+':'+sourceCallId:'manual:'+tenantId+':'+(requestId||uid('public'));const existing=allPublic(d).find(r=>r.id===id);
      if(existing){if(existing.phone!==phone||existing.sourceType!==sourceType||existing.reason!==reason)throw Error('同次办理的内容已变化，请先核对原保存结果。');if(existing.state==='released')throw Error('该来源已解除；新的拒联需使用新的来源记录。');return existing;}
      const record={id,tenantId,phone,sourceType,sourceCallId,platform:input.platform||'',reason,operatorId:c.account.id,createdAt:stamp(),state:'active',remoteState:'待核对'};d.publicRecords.push(record);d.audit.push({type:'add-public',recordId:id,tenantId,actorId:c.account.id,at:stamp()});write(d);return clone(record);
    }
    function reconcilePublic(tenantId,input,requestId){
      if(!canPublic(tenantId))throw Error('当前已无该租户黑名单查看权限。');
      const source=input.sourceType==='ai'?'ai':'manual',id=source==='ai'?'ai:'+tenantId+':'+input.platform+':'+input.sourceCallId:'manual:'+tenantId+':'+requestId;
      const row=allPublic(read()).find(r=>r.tenantId===tenantId&&r.id===id);
      if(!row||row.phone!==normalize(input.phone)||row.sourceType!==source||row.reason!==String(input.reason||'').trim())throw Error('尚未查到可确认的本次来源记录，请保留本次内容并继续核对。');
      return clone(row);
    }
    function release(tenantId,id,reason){if(!canPublic(tenantId,'release'))throw Error('当前没有本租户客户拒联来源的解除权限。');if(!String(reason||'').trim())throw Error('请填写解除原因。');const d=read(),row=allPublic(d).find(r=>r.id===id&&r.tenantId===tenantId);if(!row)throw Error('该来源记录不存在或无权查看。');if(row.state==='released')return row;if(row.state==='pending')throw Error('原话后结果尚待核对，不能按已完成记录解除。');const receipt={id,tenantId,reason:String(reason).trim(),actorId:context().account.id,at:stamp()};d.releases.push(receipt);d.audit.push({type:'release-public',recordId:id,tenantId,actorId:receipt.actorId,at:receipt.at});write(d);return {...row,state:'released',releaseReason:receipt.reason,releasedAt:receipt.at};}
    function specialState(r){if(r._legacyRefusal&&r._legacyState==='pending')return 'pending';if(r._legacyRefusal&&r._legacyState==='released')return 'released';if(r._terminal==='released')return 'released';if(r._terminal==='expired'||r._expiresAt&&Date.parse(r._expiresAt)<=clock())return 'expired';if(r._removalPending)return 'removal-pending';if(r._expiryUnknown)return 'expiry-pending';return 'active';}
    // Remote provenance belongs to each original source, independently of current sync settings.
    // This local prototype has no authoritative remote release receipt: retained footprints stay pending.
    function remoteFootprints(row,group,includeActive=true){
      if(row._retiredRemote!==undefined&&!Array.isArray(row._retiredRemote))throw Error('该名单来源的远端解除足迹待核，不能按已解除处理。');
      const prior=clone(row._retiredRemote||[]),bindings=(includeActive?group?.platformBindings||[]:[]).concat(row._remoteHistoryKnown===true?[]:group?._retiredBindings||[]);
      const found=new Map();prior.concat(bindings.map(b=>({...clone(b),groupId:group.id,remoteState:'未删除，待核对'}))).forEach(b=>{
        if(!b||typeof b!=='object'||typeof b.groupId!=='string'||!b.groupId||typeof b.platformCode!=='string'||!b.platformCode)throw Error('该名单来源的远端归属待核，不能清除限制。');
        const key=JSON.stringify([b.groupId,b.platformCode,b.externalGroupId||'',b.externalGroupCode||'',b.enterpriseId||'',b.type||'',b.useRange||'']);if(!found.has(key))found.set(key,b);
      });return [...found.values()];
    }
    function hasRemoteFootprint(row,group,includeActive=true){return row._removalPending===true||remoteFootprints(row,group,includeActive).length>0;}
    function retainRemoteFootprints(row,prior,group,bindings){
      const preserved=remoteFootprints(prior,group,false),added=(bindings||[]).map(b=>({...clone(b),groupId:group.id,retiredAt:stamp(),remoteState:'未删除，待核对'}));
      row._retiredRemote=remoteFootprints({_retiredRemote:preserved.concat(added),_remoteHistoryKnown:true},null,false);row._remoteHistoryKnown=true;
    }
    function historicalRemotePending(s,row){
      if(row._terminal!=='released'||row._expiresAt&&Number.isFinite(Date.parse(row._expiresAt))&&Date.parse(row._expiresAt)<=clock())return false;
      if(hasRemoteFootprint(row,null,false))return true;
      return (s.groups||[]).concat(s.deletedGroups||[]).filter(g=>g.id===row.groupId).some(g=>hasRemoteFootprint(row,g,false));
    }
    function initialSpecial(scope,seed){const source=fixtures(scope)||{groups:[],rows:[]};return {version:0,groups:clone(source.groups||[]),rows:(source.rows||[]).map((r,i)=>({...clone(r),_id:r._id||'original:'+scope+':'+r.groupId+':'+r.phone+':'+i,_legacy:true,_expiryUnknown:r.effective!=='永久'&&(!r._expiresAt||!Number.isFinite(Date.parse(r._expiresAt)))})),history:[]};}
    function storedSpecial(scope,seed,d=read()){
      if(!Object.hasOwn(d.specialScopes,scope))return initialSpecial(scope,seed);
      const value=d.specialScopes[scope];if(!value||!Number.isInteger(value.version)||!Array.isArray(value.groups)||!Array.isArray(value.rows)||!Array.isArray(value.history))throw Error('黑名单资料格式待核，原数据已保留。');return clone(value);
    }
    // Old refusal events remain in their original journals. The unified view projects
    // them into an ordinary named group without copying or reviving source records.
    function rawSpecial(scope,seed,d=read()){
      const value=storedSpecial(scope,seed,d),tenantId=scope.startsWith('tenant:')?scope.slice(7):'';
      if(!tenantId)return value;
      const originals=allPublic(d).filter(r=>r.tenantId===tenantId);if(!originals.length)return value;
      if(value.groups.some(g=>g.id===legacyGroupId))throw Error('原拒联来源与分组标识冲突，请保留数据并核对。');
      value.groups.unshift({id:legacyGroupId,name:'客户拒联',desc:'原通话及人工确认记录，保留来源和解除审计',expire:'永久',count:originals.length,platformBindings:[],_legacyRefusalGroup:true});
      value.rows.push(...originals.map(r=>({phone:r.phone,name:'',groupId:legacyGroupId,addType:'DECLINE',reason:r.reason,source:r.sourceType==='human'?'人工话后':r.sourceType==='ai'?'AI通话人工确认':'人工确认',sourceType:r.sourceType,creator:r.operatorId||'',createdAt:r.createdAt,...(r.updatedAt||r.releasedAt?{updatedAt:r.updatedAt||r.releasedAt}:{}),effective:'永久',platformSync:{},_id:'legacy-refusal:'+r.id,_legacy:true,_legacyRefusal:true,_legacyRecordId:r.id,_legacyState:r.state,_terminal:r.state==='released'?'released':undefined,_sourceCallId:r.sourceCallId||'',_releasedAt:r.releasedAt||'',_releaseReason:r.releaseReason||''})));
      return value;
    }
    function visibleSpecial(scope,value){if(canOrdinary(scope))return value;return {...value,groups:value.groups.filter(g=>g._legacyRefusalGroup),rows:value.rows.filter(r=>r._legacyRefusal),history:[],deletedGroups:[]};}
    function getSpecial(scope,seed){if(!canSpecial(scope))return {version:0,groups:[],rows:[],history:[]};return visibleSpecial(scope,rawSpecial(scope,seed));}
    function validateLegacyProjection(d,old,next,operation,target,scope){
      if(next.groups.some(g=>g._legacyRefusalGroup&&g.id!==legacyGroupId))throw Error('不能创建伪造的原拒联来源组。');
      const oldGroup=old.groups.find(g=>g._legacyRefusalGroup),nextGroup=next.groups.find(g=>g.id===legacyGroupId),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
      if(!oldGroup){if(nextGroup||next.rows.some(r=>r._legacyRefusal))throw Error('不能创建伪造的原拒联来源。');return;}
      const stripCount=g=>{const copy=clone(g);delete copy.count;return copy;};
      if(!nextGroup||!same(stripCount(oldGroup),stripCount(nextGroup)))throw Error('客户拒联来源组保留原记录，请在普通分组管理新号码。');
      const sourceRows=old.rows.filter(r=>r._legacyRefusal),nextRows=next.rows.filter(r=>r._legacyRefusal),removed=sourceRows.filter(r=>!nextRows.some(n=>n._id===r._id));
      if(next.rows.some(r=>r.groupId===legacyGroupId&&!r._legacyRefusal)||nextRows.some(r=>!sourceRows.some(x=>x._id===r._id&&same(x,r))))throw Error('原拒联来源不能通过新增、移动或同步配置改写。');
      if(removed.length){const tenantId=scope.slice(7),reason=String(target.releaseReason||'').trim();if(operation!=='record.remove'||target.groupId!==legacyGroupId||!canPublic(tenantId,'release'))throw Error('只有有权管理员可解除原客户拒联来源。');if(!reason)throw Error('请填写解除原因。');if(removed.some(r=>r._legacyState==='pending'))throw Error('原话后结果尚待核对，不能按已完成记录解除。');
        removed.filter(r=>r._legacyState!=='released').forEach(r=>{d.releases.push({id:r._legacyRecordId,tenantId,reason,actorId:context().account.id,at:stamp()});d.audit.push({type:'release-blacklist-source',recordId:r._legacyRecordId,tenantId,actorId:context().account.id,at:stamp()});});
      }
    }
    function withoutLegacy(value){const next=clone(value);next.groups=next.groups.filter(g=>!g._legacyRefusalGroup);next.rows=next.rows.filter(r=>!r._legacyRefusal);return next;}
    function tianrunBinding(binding){return binding?.providerCode==='TIANRUN'||binding?.platformCode==='天润';}
    function validateBindings(groups,scope,old){
      for(const group of groups){const codes=new Set();for(const binding of group.platformBindings||[]){if(!binding||typeof binding.platformCode!=='string'||codes.has(binding.platformCode))throw Error('同一分组的平台同步配置重复或不完整。');codes.add(binding.platformCode);if(!tianrunBinding(binding))continue;
        const prior=old.groups.find(g=>g.id===group.id)?.platformBindings?.find(b=>b.platformCode===binding.platformCode),base=value=>{const copy=clone(value);['status','recordCount','lastSync','lastError'].forEach(k=>delete copy[k]);return copy;};if(prior&&JSON.stringify(base(prior))===JSON.stringify(base(binding)))continue;
        const c=context();if(scope!=='tenant:'+c?.scope.id||!enabledModule('cloud',c))throw Error('当前租户未开通或未授权云呼叫，不能配置天润同步。');
        const enterprise=String(c.scope.tenant.enterpriseId||'');if(!enterprise||String(binding.enterpriseId)!==enterprise)throw Error('天润企业账号与当前租户绑定不匹配。');
        if(![1,2].includes(binding.type)||binding.type===2&&(!Number.isInteger(binding.useRange)||binding.useRange<1||binding.useRange>15))throw Error('请配置有效的天润呼叫方向和外呼范围。');
        if(binding.platformCode!=='天润'||binding.providerCode!=='TIANRUN')throw Error('天润平台标识不匹配。');
        if(binding.externalGroupId||binding.externalGroupCode||binding.externalGroupName)throw Error('天润按企业号码管理，不使用远端分组标识。');
      }}
    }
    function expiry(row,at){const days=/^(\d+)\s*天$/.exec(row.effective||'');row._effectiveAt=at;row._expiresAt=days?new Date(Date.parse(at)+Number(days[1])*86400000).toISOString():null;row._expiryUnknown=row.effective!=='永久'&&!days;}
    function validateSpecialDelta(old,next,operation,target){
      if(!Array.isArray(next.groups)||!Array.isArray(next.rows))throw Error('黑名单资料结构不完整。');
      const stripped=(value,keys)=>{const x=clone(value);keys.forEach(k=>delete x[k]);return x;},equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
      const groupBase=g=>{const x=stripped(g,['count','_retiredBindings']);x.platformBindings=(x.platformBindings||[]).map(b=>stripped(b,['status','recordCount','lastSync','lastError']));return x;};
      const newGroups=next.groups.filter(g=>!old.groups.some(x=>x.id===g.id)),deletedGroups=old.groups.filter(g=>!next.groups.some(x=>x.id===g.id));
      if(newGroups.length&&(operation!=='group.create'||newGroups.length!==1)||deletedGroups.length&&(operation!=='group.delete'||deletedGroups.some(g=>g.id!==target.groupId||old.rows.some(r=>r.groupId===g.id))))throw Error('本次操作不能增加、删除或清空其他分组。');
      for(const g of next.groups){const previous=old.groups.find(x=>x.id===g.id);if(!previous)continue;for(const key of ['createdAt','updatedAt']){if(Object.hasOwn(previous,key))g[key]=previous[key];else delete g[key];}if(Object.hasOwn(previous,'_retiredBindings'))g._retiredBindings=clone(previous._retiredBindings);else delete g._retiredBindings;let left=groupBase(previous),right=groupBase(g);
        if(operation==='group.update'&&g.id===target.groupId){['name','desc','expire'].forEach(k=>{delete left[k];delete right[k];});}
        if(['sync.enable','sync.update','sync.disable'].includes(operation)&&g.id===target.groupId){delete left.platformBindings;delete right.platformBindings;}
        if(!equal(left,right))throw Error('分组变更超出本次操作的准确目标。');
      }
      const removed=old.rows.filter(r=>!next.rows.some(x=>x._id===r._id));
      if(removed.length&&(operation!=='record.remove'||removed.some(r=>r.groupId!==target.groupId||hasRemoteFootprint(r,old.groups.find(g=>g.id===r.groupId)))))throw Error('不能清除其他组来源，供应商解除未核定的记录也不能直接移除。');
      for(const r of next.rows){const prior=r._id&&old.rows.find(x=>x._id===r._id);if(!prior){if(!['record.add','record.import'].includes(operation)||r.groupId!==target.groupId)throw Error('新增记录不属于本次目标分组。');continue;}
        const metadata=['_effectiveAt','_expiresAt','_expiryUnknown','_terminal','_legacy','_retiredRemote','_remoteHistoryKnown','createdAt','updatedAt'];metadata.forEach(k=>{if(Object.hasOwn(prior,k))r[k]=clone(prior[k]);else delete r[k];});
        let ignored=metadata.concat(['platformSync']);
        if(operation==='record.move'&&prior.groupId===target.groupId){if(prior._removalPending)throw Error('原解除结果待核，不能通过移组改写目标。');ignored=ignored.concat(['groupId','effective']);}
        if(operation==='record.remove'&&prior.groupId===target.groupId){if(prior._removalPending&&!r._removalPending)throw Error('未核解除不能自行回退为生效。');ignored.push('_removalPending');}
        if(!equal(stripped(prior,ignored),stripped(r,ignored)))throw Error('记录变更超出本次允许的来源及操作。');
        if(prior.groupId!==target.groupId&&operation!=='record.move'&&!equal(prior.platformSync,r.platformSync))throw Error('不能把同步回执写入其他组。');
      }
    }
    function validateConfirmedSource(old,next,target,scope){
      const c=context(),tenantId=c?.scope.id;if(c?.scope.kind!=='tenant'||scope!=='tenant:'+tenantId||target.groupId===legacyGroupId)throw Error('来源确认只能加入当前租户的普通黑名单分组。');
      const group=old.groups.find(g=>g.id===target.groupId);if(!group)throw Error('请选择当前有权查看的黑名单分组。');
      const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),groupShape=g=>{const copy=clone(g);delete copy.count;copy.platformBindings=(copy.platformBindings||[]).map(b=>{const out=clone(b);['status','recordCount','lastSync','lastError'].forEach(k=>delete out[k]);return out;});return copy;};
      if(next.groups.length!==old.groups.length||next.groups.some(g=>!old.groups.some(o=>o.id===g.id&&same(groupShape(o),groupShape(g)))))throw Error('来源确认不能创建、修改或移除分组。');
      if(old.rows.some(r=>!next.rows.some(n=>n._id===r._id&&same(n,r))))throw Error('来源确认不能修改或移除已有号码。');
      const added=next.rows.filter(r=>!r._id||!old.rows.some(o=>o._id===r._id));if(added.length!==1)throw Error('一次来源确认只能新增一个号码。');
      const row=added[0],reason=String(row.reason||'').trim();if(row.groupId!==target.groupId||row.addType!=='DECLINE'||!reason||row.effective!==group.expire)throw Error('来源确认须为当前分组的明确拒绝记录，并填写确认依据。');
      const sourceCallId=String(target.sourceCallId||''),platform=String(target.platform||''),calls=aiCalls(tenantId).filter(call=>String(call.sessionId)===sourceCallId&&call.platform===platform);
      if(!sourceCallId||!platform||calls.length!==1||normalize(calls[0].phone)!==normalize(row.phone))throw Error('来源通话、平台或号码无法准确匹配，请重新核对。');
      if(row._terminal||row._removalPending||row._legacyRefusal)throw Error('来源确认不能指定解除或历史状态。');
      Object.assign(row,{phone:normalize(row.phone),reason,source:'AI通话人工确认',sourceType:'ai',sourceCallId,platform,creator:c.account.name||c.account.id});
      row.platformSync={};(group.platformBindings||[]).forEach(binding=>{row.platformSync[binding.platformCode]={status:'待核对',lastSync:'-',lastError:'供应商处理结果尚未核定'};});
      // Status metadata is not an extra write privilege for a source-only confirmer.
      next.groups=clone(old.groups);
    }
    // Metadata is written only after the original exact-target authorization and delta checks.
    function stampSpecialChanges(old,next){
      const at=stamp(),groups=new Set(),body=value=>{const copy=clone(value);delete copy.updatedAt;delete copy.createdAt;delete copy.count;return JSON.stringify(copy);};
      for(const row of next.rows){const previous=old.rows.find(item=>item._id===row._id);if(!previous||body(previous)!==body(row)){row.updatedAt=at;if(!previous)row.createdAt=at;groups.add(row.groupId);if(previous)groups.add(previous.groupId);}}
      for(const previous of old.rows)if(!next.rows.some(row=>row._id===previous._id))groups.add(previous.groupId);
      for(const group of next.groups){const previous=old.groups.find(item=>item.id===group.id);if(!previous||body(previous)!==body(group)||groups.has(group.id)){group.updatedAt=at;if(!previous)group.createdAt=at;}}
      for(const row of next.history||[])if(!old.history?.some(item=>item._id===row._id&&item.removedAt===row.removedAt)&&row.removedAt)row.updatedAt=row.removedAt;
      for(const group of next.deletedGroups||[])if(!old.deletedGroups?.some(item=>item.id===group.id&&item.deletedAt===group.deletedAt)&&group.deletedAt)group.updatedAt=group.deletedAt;
    }
    function saveSpecial(scope,snapshot,operation,expectedVersion,requestId,target={}){if(!canSpecial(scope,operation))throw Error('没有当前黑名单范围内的此项操作权限。');const d=read(),projectedOld=rawSpecial(scope,undefined,d),projectedNext=clone(snapshot);if(!Array.isArray(projectedNext.groups)||!Array.isArray(projectedNext.rows))throw Error('黑名单资料结构不完整。');if(operation!=='record.confirm'&&target.groupId!==legacyGroupId&&!canOrdinary(scope,operation))throw Error('没有普通黑名单分组的此项操作权限。');if(!canOrdinary(scope)){if(projectedNext.groups.some(g=>!g._legacyRefusalGroup)||projectedNext.rows.some(r=>!r._legacyRefusal))throw Error('不能改写无权查看的黑名单分组。');projectedNext.groups.push(...projectedOld.groups.filter(g=>!g._legacyRefusalGroup));projectedNext.rows.push(...projectedOld.rows.filter(r=>!r._legacyRefusal));}validateLegacyProjection(d,projectedOld,projectedNext,operation,target,scope);const old=withoutLegacy(projectedOld),next=withoutLegacy(projectedNext);const done=requestId&&d.audit.find(x=>x.requestId===requestId&&x.scope===scope);if(done)throw Error('本次办理结果待核，请按原请求核对，不重复提交。');if(old.version!==expectedVersion)throw Error('黑名单资料已更新，请关闭当前窗口、刷新后重新核对。');if(operation==='record.confirm')validateConfirmedSource(old,next,target,scope);validateSpecialDelta(old,next,operation==='record.confirm'?'record.add':operation,target);validateBindings(next.groups,scope,old);if(!Array.isArray(next.groups)||!Array.isArray(next.rows))throw Error('黑名单资料结构不完整。');const groupIds=new Set(next.groups.map(g=>g.id));if(groupIds.size!==next.groups.length)throw Error('分组标识重复。');const pairs=new Set();next.rows.forEach(r=>{if(!groupIds.has(r.groupId)||!valid(r.phone))throw Error('记录号码或分组不完整。');const pair=r.groupId+':'+r.phone;if(pairs.has(pair))throw Error('同一目标组已有该号码，不能覆盖或合并原来源。');pairs.add(pair);let prior=r._id&&old.rows.find(x=>x._id===r._id);if(!prior){r._id=uid('special');r._legacy=false;r._remoteHistoryKnown=true;r._retiredRemote=[];expiry(r,stamp());}else if(prior.groupId!==r.groupId){const sourceGroup=old.groups.find(g=>g.id===prior.groupId);retainRemoteFootprints(r,prior,sourceGroup,sourceGroup?.platformBindings||[]);if(['expired','released'].includes(specialState(prior))){Object.assign(r,{_terminal:specialState(prior),_expiresAt:prior._expiresAt});}else expiry(r,stamp());}else{for(const key of ['_effectiveAt','_expiresAt','_expiryUnknown','_terminal','_legacy'])if(Object.hasOwn(prior,key))r[key]=prior[key];}});
      next.deletedGroups=clone(old.deletedGroups||[]);old.groups.filter(g=>!next.groups.some(n=>n.id===g.id)).forEach(g=>next.deletedGroups.push({...g,deletedAt:stamp(),remoteState:'待核对'}));if(['sync.disable','sync.update'].includes(operation)){next.groups.forEach(g=>{const prior=old.groups.find(p=>p.id===g.id);if(!prior)return;const removed=prior.platformBindings.filter(b=>!g.platformBindings.some(n=>n.platformCode===b.platformCode&&(!tianrunBinding(b)||String(n.enterpriseId)===String(b.enterpriseId)&&n.type===b.type&&n.useRange===b.useRange)));if(removed.length){g._retiredBindings=(prior._retiredBindings||[]).concat(removed.map(b=>({...b,retiredAt:stamp(),remoteState:'未删除，待核对'})));next.rows.filter(r=>r.groupId===g.id).forEach(r=>{const source=old.rows.find(x=>x._id===r._id);if(source)retainRemoteFootprints(r,source,prior,removed);});}});}next.history=clone(old.history||[]);old.rows.filter(r=>!next.rows.some(n=>n._id===r._id)).forEach(r=>next.history.push({...r,_terminal:'released',removedAt:stamp()}));stampSpecialChanges(old,next);next.version=old.version+1;d.specialScopes[scope]=next;d.audit.push({type:operation,scope,requestId:requestId||uid('special-request'),actorId:context().account.id,at:stamp(),version:next.version});write(d);return visibleSpecial(scope,rawSpecial(scope,undefined,d));
    }
    // Each provider call mode keeps its own contributing records and deadline.
    // A 7-day prediction restriction never inherits another mode's permanent term.
    function planFor(scope,phone){
      const snapshot=rawSpecial(scope),plans=new Map();phone=phone?normalize(phone):'';
      const groups=snapshot.groups.concat(snapshot.deletedGroups||[]);
      for(const row of snapshot.rows.concat(snapshot.history||[])){
        if(row._legacyRefusal||phone&&normalize(row.phone)!==phone)continue;
        const group=groups.find(g=>g.id===row.groupId),bindings=remoteFootprints(row,group).filter(tianrunBinding);
        for(const binding of bindings){const type=Number(binding.type),range=Number(binding.useRange),enterpriseId=String(binding.enterpriseId||'');if(!enterpriseId||![1,2].includes(type))continue;
          const bits=type===1?[0]:[1,2,4,8].filter(bit=>(range&bit)!==0);
          for(const mode of bits){const key=JSON.stringify([enterpriseId,type,mode,normalize(row.phone)]);let plan=plans.get(key);if(!plan){plan={enterpriseId,type,mode,useRange:mode,phone:normalize(row.phone),records:[],expiresAt:'',shortTerm:false,remotePending:false};plans.set(key,plan);}
            if(plan.records.some(r=>r.id===row._id))continue;
            const state=specialState(row),expiresAt=row.effective==='永久'?null:row._expiresAt||'',days=/^(\d+)\s*天$/.exec(row.effective||'');
            plan.records.push({id:row._id,groupId:row.groupId,groupName:group?.name||row.groupId,effective:row.effective,expiresAt,state,removalPending:row._removalPending===true});
            plan.shortTerm=plan.shortTerm||!!days&&Number(days[1])<30;
            plan.remotePending=plan.remotePending||['expired','released','removal-pending','expiry-pending'].includes(state)||binding.remoteState==='未删除，待核对';
          }
        }
      }
      for(const plan of plans.values()){const active=plan.records.filter(r=>!['expired','released'].includes(r.state)),relevant=active.length?active:plan.records;plan.expiresAt=relevant.some(r=>r.expiresAt===null)?null:relevant.some(r=>!r.expiresAt)?'':relevant.map(r=>r.expiresAt).sort().at(-1)||'';}
      return [...plans.values()];
    }
    function tianrunPlan(scope,phone){if(!canOrdinary(scope))throw Error('没有当前黑名单范围的查看权限。');return clone(planFor(scope,phone));}
    function methodMode(method,options={}){if([1,2,4,8].includes(options.tianrunMode))return options.tianrunMode;return method==='MANUAL'?4:method==='PREDICTIVE'?8:null;}
    function relevantPlan(plans,method,options={}){if(method==='INBOUND')return plans.filter(p=>p.type===1);const outbound=plans.filter(p=>p.type===2),mode=methodMode(method,options);return mode?outbound.filter(p=>p.mode===mode):outbound;}
    function check(tenantId,phone,method,options={}){
      if(!methods.includes(method)||!scopeAllowed(tenantId))return {allowed:false,state:'scope-denied',message:'执行范围无法确认，未发起呼叫。'};
      phone=normalize(phone);if(!valid(phone))return {allowed:false,state:'invalid-phone',message:'号码不完整，未发起呼叫。'};
      try{
        const records=method==='INBOUND'?[]:allPublic(read()).filter(r=>r.tenantId===tenantId&&r.state!=='released');
        if(records.some(r=>!valid(r.phone)))return {allowed:false,state:'pending',message:'本租户有拒联来源号码待核，暂不能确认可外呼。'};
        if(records.some(r=>normalize(r.phone)===phone))return {allowed:false,state:'blocked',message:'该号码有当前租户生效或待核的黑名单来源，未发起外呼。'};
        const scope='tenant:'+tenantId,snapshot=rawSpecial(scope);
        if(method==='AI'){
          if(snapshot.rows.concat(snapshot.history).some(r=>normalize(r.phone)===phone&&historicalRemotePending(snapshot,r)))return {allowed:false,state:'blacklist-pending',message:'该号码原黑名单来源仍有远端解除待核记录，未发起外呼。'};
          if(snapshot.rows.some(r=>normalize(r.phone)===phone&&!['released','expired'].includes(specialState(r))))return {allowed:false,state:'blacklist',message:'该号码受当前租户黑名单限制，未发起AI外呼。'};
        }else{
          const plans=relevantPlan(planFor(scope,phone),method,options);
          if(plans.length){if(method!=='INBOUND'&&methodMode(method,options)===null)return {allowed:false,state:'range-pending',message:'该号码有天润黑名单，当前呼叫方式的天润范围映射待核，未提交。'};
            const active=plans.some(p=>p.records.some(r=>!['expired','released'].includes(r.state)));
            return {allowed:false,state:active?'blacklist':'remote-release-pending',message:active?'该号码受当前租户黑名单的天润生效范围限制，未发起呼叫。':'该号码本地期限已结束，天润解除结果仍待核，未确认远端可呼叫。'};
          }
        }
        if(method!=='INBOUND'&&typeof window.DModuleHost?.readContactCoordination==='function'){
          const coordination=window.DModuleHost.readContactCoordination(tenantId,phone);
          if(coordination?.allowed!==true)return {allowed:false,state:coordination?.state||'coordination-pending',message:coordination?.message||'当前号码联系协调待核'};
        }
        return {allowed:true,state:method==='INBOUND'?'not-applicable':'locally-clear'};
      }catch(error){return {allowed:false,state:'unavailable',message:error.message};}
    }
    function checkBatch(tenantId,numbers,method,complete,options={}){
      try{
        if(!scopeAllowed(tenantId))return {allowed:false,message:'任务租户范围未核定。'};
        if(!methods.includes(method))return {allowed:false,message:'任务呼叫方式未核定。'};
        if(!complete){
          if(method!=='INBOUND'&&typeof window.DModuleHost?.contactCoordinationActive==='function'){const coordination=window.DModuleHost.contactCoordinationActive(tenantId);if(coordination.known!==true||coordination.active===true)return {allowed:false,state:'coordination-list-pending',message:'当前联系协调需核对完整待拨名单，不能凭不完整名单启动或继续任务'};}
          const legacy=method!=='INBOUND'&&allPublic(read()).some(r=>r.tenantId===tenantId&&r.state!=='released'),snapshot=rawSpecial('tenant:'+tenantId),active=method==='AI'?snapshot.rows.some(r=>!['expired','released'].includes(specialState(r))):relevantPlan(planFor('tenant:'+tenantId),method,options).length>0;
          if(legacy||active)return {allowed:false,state:'pending',message:'本租户有适用的黑名单，当前任务完整待拨名单尚未核对，未提交启动或继续。'};
          return {allowed:true,state:'no-blacklist-restriction'};
        }
        for(const p of numbers){const result=check(tenantId,p,method,options);if(!result.allowed)return result;}
        return {allowed:true,state:'locally-clear'};
      }catch(error){return {allowed:false,state:'unavailable',message:error.message};}
    }
    function reconcileSpecial(scope,requestId){if(!canSpecial(scope))throw Error('当前已无此黑名单范围的查看权限。');const d=read(),r=d.audit.find(x=>x.scope===scope&&x.requestId===requestId);if(!r)throw Error('本次结果尚未核定，请勿重复提交。');return visibleSpecial(scope,rawSpecial(scope));}
    return {reconcileSpecial,reconcilePublic,key,get nativeKey(){return nativePrefix()+'native-workbench-records-v1';},normalize,valid,scopeAllowed,canPublic,specialScope,canSpecial,list,add,release,aiCalls,getSpecial,saveSpecial,specialState,hasRemoteFootprint,tianrunPlan,check,checkBatch};
  }
  window.createDContactPolicy=create;
  window.DContactPolicy=create(DSession,localStorage,scope=>scope===undefined?window.DNativeModules?.ai?.fixtures||{groups:[],rows:[],calls:[]}:scope==='platform:ai-original-demo'?window.DNativeModules?.ai?.fixtures||{groups:[],rows:[],calls:[]}:DSeed.specialFixtures?.[scope]||{groups:[],rows:[]});
})();
