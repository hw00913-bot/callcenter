/** 呼入规则：按 AliCti ivrRouter 接口管理来电条件与接听去向。 */
(function(){
  'use strict';
  const ui=PlatformUI,esc=ui.escape;
  let keyword='',status='',dialog=null;
  const service=()=>window.AliCtiInbound;
  const command=(method,...args)=>esc(`window.Pages['inbound-routing'].${method}(${args.map(x=>JSON.stringify(x)).join(',')})`);
  const split=value=>String(value||'').split(';').filter(Boolean);
  const types={1:'语音导航',2:'指定电话',3:'分机'};
  const title=row=>row.name||'未命名呼入规则';
  function targetLabel(row,resources){
    const value=String(row.routerProperty||'');
    if(Number(row.routerType)===1)return resources.ivrs?.find(x=>String(x.id)===value)?.ivrName||'语音导航 '+value;
    if(Number(row.routerType)===3)return '分机 '+value;
    return value||'未设置';
  }
  function conditionLabel(row,resources){
    const trunks=split(row.ruleTrunkProperty).map(value=>{const t=resources.trunks?.find(x=>String(x.numberTrunk)===value);return t?(t.areaCode||'')+t.numberTrunk:value;});
    const times=split(row.ruleTimeProperty).map(value=>resources.times?.find(x=>String(x.id)===value)?.name||'时间条件 '+value);
    return [trunks.length?'接入号码：'+trunks.join('、'):'',times.length?'时间：'+times.join('、'):'',row.ruleAreaProperty?'来电号码 / 区号：'+split(row.ruleAreaProperty).join('、'):''].filter(Boolean).join('；')||'未设置匹配条件';
  }
  function render(){
    if(!service()?.allowed())return ui.empty('当前工作范围无呼入规则查看权限');
    const listed=service().list(),resources=service().resources(),key=service().context();
    let rows=(listed.rows||[]).filter(r=>(!keyword||`${title(r)} ${r.routerProperty} ${r.ruleTrunkProperty} ${conditionLabel(r,resources)}`.toLowerCase().includes(keyword.toLowerCase()))&&(!status||String(r.active)===status));
    rows = ui.sortByUpdated?.(rows, []) || rows;
    const actions=service().allowed(true)?`<button class="btn btn-primary" onclick="${command('openRoute','',key)}">新建呼入规则</button>`:'';
    return `<section class="platform-page inbound-route-page">${ui.pageHeader('呼入规则','设置客户来电的匹配条件和接听去向；数字越小的优先级越高。')}
      <div class="filter-panel"><label class="field grow"><span>规则 / 号码</span><input id="routeKeyword" value="${esc(keyword)}" placeholder="搜索规则名称或号码"></label><label class="field"><span>启用状态</span><select id="routeStatus"><option value="">全部</option><option value="1" ${status==='1'?'selected':''}>已启用</option><option value="2" ${status==='2'?'selected':''}>已停用</option></select></label><div class="filter-actions"><button class="btn" onclick="${command('resetFilters')}">重置</button><button class="btn btn-primary" onclick="${command('query')}">查询</button></div></div>
      <div id="inbound-list-feedback" aria-live="polite">${!listed.ok?ui.alert('warning','未能获取呼入规则',esc(listed.message||'请重新获取')):''}</div>
      <div class="management-list-shell">${ui.toolbar(actions,`<button class="btn" onclick="${command('refresh')}">刷新</button>`)}${ui.table([
        {key:'priority',label:'优先级'},
        {key:'name',label:'规则名称',render:(_,r)=>`<button class="table-link" onclick="${command('openRoute',r.id,key,true)}"><strong>${esc(title(r))}</strong><small>${esc(r.description||'')}</small></button>`},
        {key:'routerType',label:'接听去向',render:(v,r)=>`<strong>${esc(types[v]||'未知')}</strong><small>${esc(targetLabel(r,resources))}</small>`},
        {key:'ruleTrunkProperty',label:'匹配条件',render:(_,r)=>`<span class="inbound-condition-copy">${esc(conditionLabel(r,resources))}</span>`},
        {key:'active',label:'状态',render:(v,r)=>ui.status(r.pending?'待核对':Number(v)===1?'已启用':'已停用')},
        {key:'id',label:'操作',className:'action-column',render:(id,r)=>`<div class="table-actions"><button onclick="${command('openRoute',id,key,!service().allowed(true))}">${service().allowed(true)?'编辑':'查看'}</button>${service().allowed(true)&&!r.pending?`<button onclick="${command('changeActive',id,Number(r.active)===1?2:1,key)}">${Number(r.active)===1?'停用':'启用'}</button>${Number(r.active)===2?`<button class="danger" onclick="${command('remove',id,key)}">删除</button>`:''}`:''}</div>`}
      ],rows,{emptyText:listed.ok?'暂无符合条件的呼入规则':'暂未取得规则列表'})}</div></section>`;
  }
  function openList(){if(service()?.allowed())RouteRuntime.openSecondary('inbound-routes',{refreshOnClose:true});}
  function options(rows,valueKey,label,value){return '<option value="">请选择</option>'+rows.map(r=>`<option value="${esc(r[valueKey])}" ${String(r[valueKey])===String(value)?'selected':''}>${esc(label(r))}</option>`).join('');}
  function checkboxes(rows,valueKey,label,selected,name,disabled){
    const values=split(selected),known=new Set(rows.map(r=>String(r[valueKey])));
    return `<div class="inbound-options">${rows.map(r=>`<label><input type="checkbox" name="${name}" value="${esc(r[valueKey])}" ${values.includes(String(r[valueKey]))?'checked':''} ${disabled?'disabled':''}><span>${esc(label(r))}</span></label>`).join('')}${values.filter(v=>!known.has(v)).map(v=>`<label><input type="checkbox" name="${name}" value="${esc(v)}" checked ${disabled?'disabled':''}><span>原记录：${esc(v)}</span></label>`).join('')}${!rows.length&&!values.length?'<span class="form-help">暂无可选项</span>':''}</div>`;
  }
  function openRoute(id='',key,readOnly=false){
    if(!service()?.allowed()||(key&&key!==service().context())||(!id&&!service().allowed(true)))return;
    const result=id?service().get(id):{ok:true,row:{name:'',routerType:1,active:1,priority:'',ruleTrunkProperty:'',ruleTimeProperty:'',ruleAreaProperty:'',description:''}};
    if(result.code==='scope')return showToast(result.message,'warning');
    const resources=service().resources(),readonly=!!id&&(readOnly||!service().allowed(true));
    const current={id:String(id),key:service().context(),expectedRevision:result.revision,readonly,busy:false};dialog=current;
    if(!result.ok||!resources.ok){
      ui.openLayer('route-detail',`<div class="layer-header"><h2>呼入规则</h2><button aria-label="关闭" onclick="${command('close')}">×</button></div><div class="layer-body">${ui.alert('warning','暂时无法读取配置',esc(result.message||resources.message||'请重新获取'))}</div><div class="layer-footer"><button class="btn" onclick="${command('close')}">关闭</button><button class="btn btn-primary" onclick="${command('openRoute',id,current.key,readOnly)}">重新获取</button></div>`,'wide');return;
    }
    const row=result.row,type=Number(row.routerType),disabled=readonly?'disabled':'',selected=String(row.routerProperty||'');
    const header=readonly?'呼入规则详情':id?'编辑呼入规则':'新建呼入规则';
    const basic=`<div class="form-grid"><label class="field"><span>规则名称${id?'':'（选填）'}</span><input id="routeName" value="${esc(row.name||'')}" placeholder="例如：总部工作时间来电" ${id?'readonly':''} ${disabled}></label><label class="field"><span>优先级 <b class="inbound-required">*</b></span><input id="routePriority" type="number" min="1" step="1" value="${esc(row.priority)}" placeholder="请输入大于 0 的整数" ${disabled}><small>同一账号内不能重复，数字越小越优先。</small></label><label class="field"><span>启用状态</span><select id="routeActive" ${disabled}><option value="1" ${Number(row.active)===1?'selected':''}>启用</option><option value="2" ${Number(row.active)===2?'selected':''}>停用</option></select></label><label class="field"><span>备注（选填）</span><input id="routeDescription" value="${esc(row.description||'')}" placeholder="填写这条规则的用途" ${disabled}></label></div>`;
    const target=`<div class="inbound-targets">${Object.entries(types).map(([v,label])=>`<label><input type="radio" name="routeType" value="${v}" ${type===Number(v)?'checked':''} onchange="${command('changeTarget')}" ${disabled}><strong>${label}</strong><small>${v==='1'?'进入已配置的语音导航':v==='2'?'转接至指定联系电话':'转接至已有分机'}</small></label>`).join('')}</div>
      <label class="field" data-route-target="1" ${type===1?'':'hidden'}><span>语音导航 <b class="inbound-required">*</b></span><select id="routeIvr" ${disabled}>${options(resources.ivrs,'id',r=>r.ivrName,type===1?selected:'')}</select></label>
      <label class="field" data-route-target="2" ${type===2?'':'hidden'}><span>接听电话 <b class="inbound-required">*</b></span><input id="routeTel" type="tel" value="${type===2?esc(selected):''}" placeholder="请输入接听电话，固话请带区号" ${disabled}></label>
      <label class="field" data-route-target="3" ${type===3?'':'hidden'}><span>接听分机 <b class="inbound-required">*</b></span><select id="routeExten" ${disabled}>${options(resources.extens,'exten',r=>r.exten+(r.name?' · '+r.name:''),type===3?selected:'')}</select></label>`;
    const conditions=`<p class="form-help">可按接入号码、时间条件及主叫号码设置来电范围。以下条件均为选填。</p><div class="inbound-condition-field"><span>接入号码</span>${checkboxes(resources.trunks,'numberTrunk',r=>(r.areaCode||'')+r.numberTrunk+(r.name?' · '+r.name:''),row.ruleTrunkProperty,'routeTrunks',readonly)}</div><div class="inbound-condition-field"><span>时间条件</span>${checkboxes(resources.times,'id',r=>r.name+(r.startTime&&r.endTime?' · '+r.startTime+'–'+r.endTime:''),row.ruleTimeProperty,'routeTimes',readonly)}</div><label class="field"><span>来电号码、号码前缀或区号</span><input id="routeAreas" value="${esc(split(row.ruleAreaProperty).join('；'))}" placeholder="例如：010；0218700，多个条件用分号分隔" ${disabled}></label>`;
    ui.openLayer('route-detail',`<div class="layer-header"><div><h2>${header}</h2><p>${readonly?esc(title(row)):'设置什么来电、按什么顺序、转到哪里。'}</p></div><button aria-label="关闭" onclick="${command('close')}">×</button></div><div class="layer-body inbound-rule-form">${ui.detailSection('1. 基本信息',basic)}${ui.detailSection('2. 接听去向',target)}${ui.detailSection('3. 来电匹配条件',conditions)}<div id="routeError" aria-live="polite"></div></div><div class="layer-footer"><button class="btn" onclick="${command('close')}">${readonly?'关闭':'取消'}</button>${readonly?'':`<button class="btn btn-primary" id="routeSave" onclick="${command('save')}">保存规则</button>`}</div>`,'wide',{objectKey:id||'new',onRestore(){dialog=current;}});
  }
  function changeTarget(){if(!dialog||dialog.key!==service().context())return;const type=document.querySelector('#route-detail input[name="routeType"]:checked')?.value;document.querySelectorAll('#route-detail [data-route-target]').forEach(n=>n.hidden=n.dataset.routeTarget!==type);}
  function refreshViews(){
    const route=RouteRuntime.snapshot()?.key;if(!['inbound-routes','inbound-service'].includes(route))return;
    const draftKeyword=document.getElementById('routeKeyword')?.value,draftStatus=document.getElementById('routeStatus')?.value;
    RouteRuntime.refreshCurrent();
    if(draftKeyword!==undefined&&document.getElementById('routeKeyword'))document.getElementById('routeKeyword').value=draftKeyword;
    if(draftStatus!==undefined&&document.getElementById('routeStatus'))document.getElementById('routeStatus').value=draftStatus;
  }
  function feedback(result){const node=document.getElementById('routeError')||document.getElementById('inbound-list-feedback');if(node){node.innerHTML=ui.alert('warning',result.pending?'处理结果待核对':'未能保存',esc(result.message||'请检查后重试'));node.scrollIntoView({block:'nearest'});}else showToast(result.message||'操作未完成','warning');}
  async function save(){
    const current=dialog;if(!current||current.busy||current.readonly||current.key!==service().context()||!service().allowed(true))return;
    const val=id=>document.getElementById(id)?.value.trim()||'',checked=name=>[...document.querySelectorAll(`#route-detail input[name="${name}"]:checked`)].map(n=>n.value).join(';');
    const type=Number(document.querySelector('#route-detail input[name="routeType"]:checked')?.value);
    const input={routerType:type,active:Number(val('routeActive')),priority:val('routePriority'),description:val('routeDescription'),ruleAreaProperty:val('routeAreas').replaceAll('；',';'),ruleTimeProperty:checked('routeTimes'),ruleTrunkProperty:checked('routeTrunks')};
    if(!current.id)input.name=val('routeName');
    if(type===1)input.ivrId=val('routeIvr');if(type===2)input.tel=val('routeTel');if(type===3)input.exten=val('routeExten');
    current.busy=true;document.getElementById('routeSave').disabled=true;
    try{
      const result=await service().save(input,{id:current.id,context:current.key,expectedRevision:current.expectedRevision});
      if(dialog!==current||current.key!==service().context())return;
      if(!result.ok){feedback(result);return;}
      close();refreshViews();showToast(current.id?'呼入规则已更新':'呼入规则已创建','success');
    }catch(_){if(dialog===current)feedback({message:'暂时无法保存，请保留当前填写内容后重试。'});}
    finally{current.busy=false;const button=document.getElementById('routeSave');if(dialog===current&&button)button.disabled=false;}
  }
  function changeActive(id,active,key){
    if(!service()?.allowed(true)||key!==service().context())return;
    ui.confirm({id:'route-state-confirm',title:active===1?'启用呼入规则':'停用呼入规则',body:`<p>确认${active===1?'启用':'停用'}这条呼入规则？</p>`,confirmText:active===1?'确认启用':'确认停用',onConfirm:async()=>{const result=await service().setActive(id,active,key);if(key!==service().context())return;if(result.ok){refreshViews();showToast(active===1?'规则已启用':'规则已停用','success');}else feedback(result);}});
  }
  function remove(id,key){
    if(!service()?.allowed(true)||key!==service().context())return;
    ui.confirm({id:'route-delete-confirm',title:'删除呼入规则',danger:true,body:'<p>确认删除这条已停用的呼入规则？</p>',confirmText:'确认删除',onConfirm:async()=>{const result=await service().remove(id,key);if(key!==service().context())return;if(result.ok){refreshViews();showToast('呼入规则已删除','success');}else feedback(result);}});
  }
  function close(){dialog=null;ui.closeLayer('route-detail');}
  function query(){keyword=document.getElementById('routeKeyword')?.value||'';status=document.getElementById('routeStatus')?.value||'';RouteRuntime.refreshCurrent();}
  function resetFilters(){keyword='';status='';RouteRuntime.refreshCurrent();}
  function refresh(){if(service()?.allowed())refreshViews();}
  function captureNavigationState(){return {keyword,status};}
  function restoreNavigationState(s){if(s){keyword=s.keyword||'';status=s.status||'';}}
  window.Pages=window.Pages||{};window.Pages['inbound-routing']={render,init(){},openList,openRoute,changeTarget,save,changeActive,remove,close,query,resetFilters,refresh,targetLabel,conditionLabel,captureNavigationState,restoreNavigationState};
})();
