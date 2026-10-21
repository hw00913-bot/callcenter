/** Tenant-managed AliCti caller-number pools. All supplier operations are simulated by AliCtiNumberPools. */
(function(root){
  'use strict';
  const ui=root.PlatformUI,esc=ui.escape,layer='number-pool-detail',pageSize=8;
  const service=()=>root.AliCtiNumberPools;
  const command=(name,...args)=>esc(`NumberPoolManagement.${name}(${args.map(value=>JSON.stringify(value)).join(',')})`);
  const text=value=>value==null?'':String(value);
  const timeText=value=>{const at=ui.timestamp?.(value);return at==null?'—':new Date(at).toLocaleString('sv-SE');};
  const key=()=>service()?.contextKey?.()||'';
  let filter='',page=1,listKey='',editor=null;
  const can=current=>!!service()?.canAccess?.()&&(!current||current===key());
  const denied=()=>root.showToast('账号或租户已切换，请重新打开号码池管理。','warning');
  const resultRows=()=>service()?.catalog?.()||{ok:false,rows:[],message:'号码池暂时无法读取'};
  function render(){
    if(!can())return ui.empty('当前账号无号码池管理权限');
    if(listKey!==key()){filter='';page=1;listKey=key();if(editor)invalidate();service()?.list?.();}
    const catalog=resultRows(),needle=filter.toLowerCase();
    let rows=(catalog.ok?catalog.rows:[]).filter(row=>!needle||`${row.name} ${row.comment||''}`.toLowerCase().includes(needle));
    rows=ui.sortByUpdated?.(rows,['localUpdatedAt','createTime'])||rows;
    page=Math.max(1,Math.min(page,Math.ceil(rows.length/pageSize)||1));
    const start=(page-1)*pageSize,scope=key();
    const columns=[
      {key:'name',label:'号码池',render:(value,row)=>`<button class="table-link" onclick="${command('open','view',row.id,scope)}"><strong>${esc(value)}</strong></button>`},
      {key:'type',label:'类型',render:value=>esc(Number(value)===1?'中继群组':'号码群组')},
      {key:'numbers',label:'号码数',render:value=>`${Array.isArray(value)?value.length:0} 个`},
      {key:'isDefault',label:'默认池',render:value=>Number(value)===1?ui.status('是'):'否'},
      {key:'comment',label:'备注',render:value=>esc(value||'—')},
      {key:'createTime',label:'创建时间',render:value=>esc(timeText(value))},
      {key:'id',label:'操作',render:(value,row)=>`<div class="table-actions"><button onclick="${command('open','view',value,scope)}">查看</button><button onclick="${command('open','edit',value,scope)}">编辑</button><button onclick="${command('open','remove',value,scope)}">删除</button></div>`}
    ];
    return `<section class="platform-page number-pool-page">${ui.pageHeader('号码池管理','维护当前租户在 AliCti 账号下的外显号码池，预外呼任务从这里选择。')}
      <div class="filter-panel"><label class="field grow"><span>名称 / 备注</span><input id="number-pool-filter" value="${esc(filter)}" placeholder="输入号码池名称或备注" onkeydown="if(event.key==='Enter')NumberPoolManagement.query()"></label><div class="filter-actions"><button class="btn" onclick="NumberPoolManagement.reset()">重置</button><button class="btn btn-primary" onclick="NumberPoolManagement.query()">查询</button></div></div>
      ${catalog.ok?'':ui.alert('warning','号码池暂时无法读取',catalog.message||'请刷新后重试。')}
      <div class="management-list-shell">${ui.toolbar(`<button class="btn btn-primary" ${catalog.ok?'':'disabled'} onclick="${command('open','create',null,scope)}">新增号码池</button>`,'<button class="btn" onclick="NumberPoolManagement.refresh()">刷新</button>')}${ui.table(columns,rows.slice(start,start+pageSize),{rowOffset:start,emptyText:catalog.ok?'暂无符合条件的号码池':'请刷新后重试'})}${ui.pagination(rows.length,page,pageSize,'NumberPoolManagement.setPage')}</div></section>`;
  }
  function query(){if(!can(listKey))return denied();filter=document.getElementById('number-pool-filter')?.value.trim()||'';page=1;root.RouteRuntime.refreshCurrent();}
  function reset(){if(!can(listKey))return denied();filter='';page=1;root.RouteRuntime.refreshCurrent();}
  function setPage(value){if(!can(listKey))return denied();page=Math.max(1,Number(value)||1);root.RouteRuntime.refreshCurrent();}
  function refresh(){if(!can(listKey))return denied();service()?.list?.();root.RouteRuntime.refreshCurrent();}
  function invalidate(){editor=null;ui.closeLayer(layer,false);}
  function error(message){const node=document.getElementById('number-pool-error');if(node)node.textContent=message;else if(message)root.showToast(message,'warning');return false;}
  function close(force=false){if(!editor)return ui.closeLayer(layer);if(editor.pending)return error('正在保存，请稍候。');if(editor.dirty&&!force){ui.confirm({id:'number-pool-discard',title:'放弃号码池修改？',body:'<p>当前填写的内容尚未保存。</p>',confirmText:'放弃修改并关闭',danger:true,onConfirm:()=>close(true)});return false;}editor=null;try{root.AppState.setDirty(false);}catch(_){}ui.closeLayer(layer);return true;}
  function open(mode,id,scope){
    if(!can(scope))return denied();
    if(!['create','view','edit','remove'].includes(mode))return;
    if(editor?.pending||editor?.dirty)return error('请先保存或关闭当前号码池。');
    if(editor)close(true);
    const catalog=resultRows();if(!catalog.ok)return root.showToast(catalog.message,'warning');
    const row=mode==='create'?null:catalog.rows.find(item=>String(item.id)===String(id));
    if(mode!=='create'&&!row)return root.showToast('号码池已变化，请刷新后重新打开。','warning');
    const values=row?{name:text(row.name),comment:text(row.comment),type:String(row.type),isDefault:String(row.isDefault??0),numbers:Array.isArray(row.numbers)?row.numbers.join('\n'):''}:{name:'',comment:'',type:'0',isDefault:'0',numbers:''};
    editor={mode,id:row?.id,row:row?structuredClone(row):null,values,initial:JSON.stringify(values),revision:catalog.revision,context:catalog.context||key(),scope:key(),dirty:false,pending:false};
    draw();
  }
  function input(label,name,opts={}){
    const value=editor.values[name],required=opts.required?' <b>*</b>':'';
    return `<label class="field ${opts.full?'full':''}"><span>${label}${required}</span><input id="number-pool-${name}" value="${esc(value)}" ${opts.readonly?'readonly':''} ${opts.placeholder?`placeholder="${esc(opts.placeholder)}"`:''} oninput="NumberPoolManagement.setField('${name}',this.value)">${opts.hint?`<small>${esc(opts.hint)}</small>`:''}</label>`;
  }
  function form(){
    const e=editor,defaultPool=Number(e.row?.isDefault)===1,hasDefault=resultRows().rows.some(row=>Number(row.isDefault)===1&&String(row.id)!==String(e.id));
    return `<div class="form-grid number-pool-form">${input('号码池名称','name',{required:true,readonly:defaultPool,placeholder:'例如：总部销售',hint:defaultPool?'默认号码池不能更名。':'同一个 AliCti 企业 ID 下，名称不能重复。'})}
      <label class="field"><span>号码池类型 <b>*</b></span><select id="number-pool-type" ${e.mode==='edit'?'disabled':''} onchange="NumberPoolManagement.setField('type',this.value)"><option value="0" ${e.values.type==='0'?'selected':''}>号码群组</option><option value="1" ${e.values.type==='1'?'selected':''}>中继群组</option></select>${e.mode==='edit'?'<small>接口不支持修改已有号码池的类型。</small>':''}</label>
      <label class="field"><span>默认号码池 <b>*</b></span><select id="number-pool-isDefault" ${defaultPool||hasDefault?'disabled':''} onchange="NumberPoolManagement.setField('isDefault',this.value)"><option value="0" ${e.values.isDefault==='0'?'selected':''}>否</option><option value="1" ${e.values.isDefault==='1'?'selected':''}>是</option></select>${defaultPool?'<small>已有默认号码池不能取消默认。</small>':hasDefault?'<small>当前账号已有默认号码池。</small>':''}</label>
      ${input('备注','comment',{placeholder:'可选'})}
      <label class="field full"><span>号码清单 <small>（选填）</small></span><textarea id="number-pool-numbers" rows="7" placeholder="每行一个号码，也可用逗号分隔" oninput="NumberPoolManagement.setField('numbers',this.value)">${esc(e.values.numbers)}</textarea><small>保存时向 AliCti 更新接口提交完整号码清单；清空意味着移除池内全部号码。默认未配置企业上限时，号码数须少于 500。</small></label>
      </div>`;
  }
  function details(){const row=editor.row;return `<div class="number-pool-overview"><strong>${esc(row.name)}</strong><span>${Number(row.type)===1?'中继群组':'号码群组'} · ${Number(row.isDefault)===1?'默认号码池':'普通号码池'}</span></div><dl class="detail-grid"><dt>所属租户</dt><dd>${esc(root.CloudCallData.tenants.find(t=>t.enterpriseId===row.enterpriseId&&!t.builtIn)?.name||row.tenantId||'—')}</dd><dt>备注</dt><dd>${esc(row.comment||'—')}</dd><dt>创建时间</dt><dd>${esc(timeText(row.createTime))}</dd><dt>池内号码</dt><dd>${Array.isArray(row.numbers)&&row.numbers.length?row.numbers.map(esc).join('、'):'暂无号码'}</dd></dl>`;}
  function draw(){
    if(!editor||!can(editor.scope))return invalidate();
    const title={create:'新增号码池',view:'号码池详情',edit:'编辑号码池',remove:'删除号码池'}[editor.mode];
    const body=editor.mode==='view'?details():editor.mode==='remove'?`<p>确认删除号码池 <strong>${esc(editor.row.name)}</strong>？</p><p class="number-pool-note">删除后，任务将无法再选用该池。已被任务引用或正在使用的默认池不可删除。</p>`:form();
    const action={create:'创建号码池',edit:'保存修改',remove:'确认删除'}[editor.mode];
    ui.openLayer(layer,`<div class="layer-header"><h2>${title}</h2><button type="button" aria-label="关闭" onclick="NumberPoolManagement.close()">×</button></div><div class="layer-body number-pool-body">${body}<div id="number-pool-error" class="number-pool-error" role="alert"></div></div><div class="layer-footer"><button class="btn" onclick="NumberPoolManagement.close()">${editor.mode==='view'?'关闭':'取消'}</button>${action?`<button id="number-pool-save" class="btn btn-primary ${editor.mode==='remove'?'btn-danger':''}" onclick="NumberPoolManagement.save()">${action}</button>`:''}</div>`,'wide',{objectKey:`number-pool:${editor.mode}:${editor.id??'new'}`});
  }
  function setField(name,value){
    if(!editor||!can(editor.scope)||!['create','edit'].includes(editor.mode)||editor.pending||!Object.hasOwn(editor.values,name))return;
    if(editor.mode==='edit'&&name==='type'||editor.row&&Number(editor.row.isDefault)===1&&['name','isDefault'].includes(name))return;
    editor.values[name]=value;editor.dirty=JSON.stringify(editor.values)!==editor.initial;try{root.AppState.setDirty(editor.dirty);}catch(_){}error('');
  }
  function numbers(value){return String(value||'').split(/[\s,，;；]+/).map(v=>v.trim()).filter(Boolean);}
  function inputValues(){const v=editor.values;return {name:v.name.trim(),comment:v.comment.trim(),type:Number(v.type),isDefault:Number(v.isDefault),numbers:numbers(v.numbers)};}
  function validate(value){
    if(!value.name)return '请填写号码池名称。';
    if(![0,1].includes(value.type)||![0,1].includes(value.isDefault))return '请选择有效的号码池类型和默认状态。';
    if(value.numbers.some(number=>!/^\+?\d+$/.test(number)))return '号码清单只能包含数字，国际号码可带 + 前缀。';
    if(new Set(value.numbers).size!==value.numbers.length)return '同一号码池内不能重复添加号码。';
    if(value.numbers.length>=500)return '未配置企业上限时，号码池须少于 500 个号码。';
    return '';
  }
  function setPending(value){if(!editor)return;editor.pending=value;document.querySelectorAll(`#${layer} input,#${layer} textarea,#${layer} select,#${layer} button`).forEach(node=>{if(value){node.dataset.poolWasDisabled=node.disabled?'1':'0';node.disabled=true;}else{node.disabled=node.dataset.poolWasDisabled==='1';delete node.dataset.poolWasDisabled;}});const button=document.getElementById('number-pool-save');if(button)button.textContent=value?'正在保存…':({create:'创建号码池',edit:'保存修改',remove:'确认删除'}[editor.mode]||'');}
  async function commit(){
    const active=editor;if(!active||!can(active.scope))return denied();
    const value=active.mode==='remove'?null:inputValues(),message=value?validate(value):'';
    if(message)return error(message);
    const current=resultRows();if(!current.ok)return error(current.message||'号码池暂时无法读取');
    if(current.revision!==active.revision)return error('号码池已变化，请关闭后重新打开。');
    setPending(true);error('');
    const options={expectedContext:active.context,expectedRevision:active.revision};
    try{
      const result=active.mode==='create'?await service().create(value,options):active.mode==='edit'?await service().update(active.id,value,options):await service().remove(active.id,options);
      if(editor!==active)return false;setPending(false);
      if(!can(active.scope)){invalidate();root.RouteRuntime.refreshCurrent();return false;}
      if(!result?.ok)return error(result?.message||'号码池操作未完成，请刷新后重试。');
      active.dirty=false;try{root.AppState.setDirty(false);}catch(_){}close(true);root.RouteRuntime.refreshCurrent();root.showToast(result.message||'号码池已保存','success');return true;
    }catch(_){if(editor===active){setPending(false);error('操作未完成，原配置已保留，请稍后重试。');}return false;}
  }
  function save(){
    if(!editor||editor.pending||editor.mode==='view')return false;
    if(editor.mode==='edit'&&editor.row?.numbers?.length&&!numbers(editor.values.numbers).length){ui.confirm({id:'number-pool-clear-confirm',title:'清空号码池？',body:'<p>本次保存将从号码池中移除全部号码。</p>',confirmText:'确认清空并保存',danger:true,onConfirm:()=>{commit();}});return false;}
    return commit();
  }
  root.NumberPoolManagement={render,init(){},query,reset,setPage,refresh,open,close,setField,save,captureNavigationState:()=>({filter,page,listKey}),restoreNavigationState:s=>{if(s?.listKey===key()){filter=s.filter;page=s.page;listKey=s.listKey;}}};
  root.Pages=root.Pages||{};root.Pages['number-pool-management']=root.NumberPoolManagement;
  root.AppState?.subscribe?.(()=>{if(editor&&!can(editor.scope))invalidate();});
})(window);
