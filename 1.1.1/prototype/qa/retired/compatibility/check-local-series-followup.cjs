/** Preserved legacy local-series profile; currentProfile option loads the real active product profile. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(process.argv[2] || path.join(__dirname,'..'));
let passed=0;
const check=(condition,message)=>{assert.ok(condition,message);passed++;};
const copy=value=>structuredClone(value);
const encode=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const decode=value=>String(value).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const dataKey=name=>name.slice(5).replace(/-([a-z])/g,(_,char)=>char.toUpperCase());
class Element {
  constructor(tag, attributes = {}, document = null) {
    this.tagName = tag.toUpperCase(); this.attributes = {}; this.dataset = {}; this.children = []; this.parentElement = null;
    this.ownerDocument = document; this.style = {}; this._text = ''; this._hidden = false; this.value = ''; this.disabled = false;
    for (const [name, value] of Object.entries(attributes)) this.setAttribute(name, value);
    this.classList = {contains: name => (this.getAttribute('class') || '').split(/\s+/).includes(name), toggle: (name, force) => {
      const classes = new Set((this.getAttribute('class') || '').split(/\s+/).filter(Boolean));
      if (force === undefined ? !classes.has(name) : force) classes.add(name); else classes.delete(name);
      this.setAttribute('class', [...classes].join(' '));
    }};
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name.startsWith('data-')) this.dataset[dataKey(name)] = String(value);
    if (name === 'hidden') this._hidden = true;
    if (name === 'value') this.value = String(value);
    if (name === 'disabled') this.disabled = true;
    if (name === 'tabindex') this.tabIndex = Number(value);
  }
  getAttribute(name) { if (name === 'hidden') return this.hidden ? '' : null; return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null; }
  hasAttribute(name) { return this.getAttribute(name) !== null; }
  removeAttribute(name) {
    delete this.attributes[name];
    if (name.startsWith('data-')) delete this.dataset[dataKey(name)];
    if (name === 'hidden') this._hidden = false;
    if (name === 'disabled') this.disabled = false;
  }
  get hidden() { return this._hidden; }
  set hidden(value) { this._hidden = !!value; if (value) this.attributes.hidden = ''; else delete this.attributes.hidden; }
  get id() { return this.attributes.id || ''; }
  set id(value) { this.setAttribute('id', value); }
  get isConnected() { return this === this.ownerDocument?.body || !!this.parentElement?.isConnected; }
  appendChild(child) { child.parentElement = this; child.ownerDocument = this.ownerDocument; this.children.push(child); return child; }
  contains(node) { return this === node || this.children.some(child => child.contains(node)); }
  remove() { if (this.parentElement) { const parent = this.parentElement; parent.children.splice(parent.children.indexOf(this), 1); this.parentElement = null; } }
  matches(selector) {
    return selector.split(',').some(part => {
      const text = part.trim();
      const tag = text.match(/^[a-z][\w-]*/i)?.[0];
      if (tag && this.tagName !== tag.toUpperCase()) return false;
      const id = text.match(/#([\w-]+)/)?.[1]; if (id && this.id !== id) return false;
      for (const [, name] of text.matchAll(/\.([\w-]+)/g)) if (!this.classList.contains(name)) return false;
      for (const [, name, double, single, bare] of text.matchAll(/\[([^\s=\]]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\]]+)))?\]/g)) {
        const expected = double ?? single ?? bare;
        if (!this.hasAttribute(name) || expected !== undefined && this.getAttribute(name) !== expected) return false;
      }
      return true;
    });
  }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
  querySelectorAll(selector) {
    const parts = selector.trim().split(/\s+(?![^\[]*\])/), last = parts.pop(), result = [];
    const visit = node => { for (const child of node.children) {
      if (child.matches(last)) {
        let ancestor = child.parentElement, index = parts.length - 1;
        while (ancestor && index >= 0) { if (ancestor.matches(parts[index])) index--; ancestor = ancestor.parentElement; }
        if (index < 0) result.push(child);
      }
      visit(child);
    }};
    visit(this); return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  focus() { if (!this.closest('[hidden]')) this.ownerDocument.activeElement = this; }
  scrollIntoView() {}
  addEventListener() {}
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this._text = String(value); this.children.forEach(child => { child.parentElement = null; }); this.children = []; }
  set innerHTML(html) { this.children.forEach(child => { child.parentElement = null; }); this.children = []; parseHTML(String(html), this); }
  set outerHTML(html) {
    const parent = this.parentElement; if (!parent) return;
    const holder = new Element('fragment', {}, this.ownerDocument); parseHTML(String(html), holder);
    const index = parent.children.indexOf(this); this.parentElement = null;
    parent.children.splice(index, 1, ...holder.children); holder.children.forEach(child => { child.parentElement = parent; });
  }
}
function parseHTML(html, parent) {
  const stack = [parent], voidTags = new Set(['input','br','hr','img','meta','link','area','base','embed','source','wbr']);
  for (const token of html.match(/<!--[\s\S]*?-->|<[^>]*>|[^<]+/g) || []) {
    if (token.startsWith('<!--')) continue;
    if (token.startsWith('</')) { if (stack.length > 1) stack.pop(); continue; }
    if (token.startsWith('<')) {
      const tag = token.match(/^<([\w-]+)/)?.[1]; if (!tag) continue;
      const attributes = {};
      const text = token.slice(tag.length + 1, -1);
      for (const [, name, double, single, bare] of text.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attributes[name] = decode(double ?? single ?? bare ?? '');
      const node = new Element(tag, attributes, parent.ownerDocument); stack.at(-1).appendChild(node);
      if (!voidTags.has(tag.toLowerCase()) && !token.endsWith('/>')) stack.push(node);
    } else stack.at(-1)._text += decode(token);
  }
}

function harness(options={}){
  const scope={enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ'},state={...scope,accountId:'LOCAL_SERIES_AGENT',sessionId:'LOCAL_SERIES_SESSION',activeDomain:'CLOUD_CONTACT_CENTER'};
  const storage=new Map(),notices=[],writes=[];
  let valid=true,authorized=true,call=null,values=null,layer=null,managerHtml='';
  const document={activeElement:null,addEventListener(){}};document.body=new Element('body',{},document);
  if(options.currentProfile)document.createElement=tag=>new Element(tag,{},document);
  document.querySelectorAll=selector=>document.body.querySelectorAll(selector);document.querySelector=selector=>document.body.querySelector(selector);document.getElementById=id=>document.body.querySelector('#'+id);
  const win={console,structuredClone,Date,Map,Set,JSON,Object,String,Array,Number,Promise,document,
    crypto:require('node:crypto').webcrypto,setTimeout:()=>0,clearTimeout(){},requestAnimationFrame(){},addEventListener(){},dispatchEvent(){},
    CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},
    fetch(){throw Error('external network prohibited');},XMLHttpRequest:function(){throw Error('external network prohibited');},
    localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))},
    AppState:{get:()=>state,isReady:()=>true,isSuper:()=>true,canMenu:()=>true,effectiveAccess:()=>({roleCode:'SUPER_ADMIN',valid}),authorizeObject:(_,object)=>authorized&&object?.tenantId===scope.tenantId&&object?.enterpriseId===scope.enterpriseId},
    PlatformUI:{escape:encode,status:()=>'',empty:encode,pageHeader:(title,note)=>'<h1>'+encode(title)+'</h1><p>'+encode(note)+'</p>',toolbar:(left,right)=>left+right,table:()=>'',
      openLayer(id,html){managerHtml=html;this.closeLayer(id);const node=new Element('section',{id,class:'platform-layer'},document);document.body.appendChild(node);node.innerHTML=html;},
      closeLayer(id){document.getElementById(id)?.remove();}},
    CustomerDirectory:{phoneOf:row=>row?.customerPhone,list:()=>[],sync(){}},CallState:{view:row=>({answered:row.answered})},
    RouteRuntime:{refreshCurrent(){}},showToast:(...args)=>notices.push(args),Pages:{'cloud-call-records':{openCall(){}}}};
  if(options.currentProfile){win.setTimeout=fn=>{queueMicrotask(fn);return 0;};}
  win.window=win;vm.createContext(win);
  const files=['mock/data.js',...(options.currentProfile?['config/customer-intent-profile.js','mock/mapping-series-data.js','js/components/mapping-series-adapter.js']:[]),'js/components/business-data.js','js/components/customer-business.js','js/components/business-interface-field.js','js/components/customer-followup.js','js/pages/business-categories.js'];
  if(!options.currentProfile)win.CustomerIntentProfile={mode:'local-series-text-store',revision:1,seriesFieldId:'customIntendedSeries',seriesFieldLabel:'本次意向车系',seriesOptions:['A','B','C'].map((letter,index)=>({id:'local-series-'+(index+1),label:'自定义车系 '+letter+'（演示）',businessKey:'LOCAL-SERIES-00'+(index+1)}))};
  for(const file of files)vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),win,{filename:file});
  const C=win.CustomerFollowup,M=win.CustomerBusiness;
  win.AgentWorkbench={setFollowup(id,value){const next=C.update(values,call,id,value);if(next){values=next;writes.push([id,value]);}}};
  function mount(next={},initial={},handler='AgentWorkbench.setFollowup'){
    call={...scope,accountId:state.accountId,callId:'local-series-live',customerPhone:'13800000888',externalDocumentId:'LOCAL_SERIES_DOC',businessType:'lead',callSource:'NATIVE_WORKBENCH',processingStatus:'待填写',endedAt:'2026-10-19 15:00:00',direction:'呼出',callType:'人工外呼',answered:true,...next};
    if(!win.CloudCallData.calls.some(row=>C.identity(row)===C.identity(call)))win.CloudCallData.calls.push(call);
    values={...C.empty(call),...copy(initial)};
    const html=C.form(values,call,'seat-followup',handler);layer?.remove();layer=new Element('section',{class:'platform-layer'},document);document.body.appendChild(layer);layer.innerHTML=html;return html;
  }
  const form=()=>document.querySelectorAll('[data-followup-tabs]').find(node=>node.dataset.followupPrefix==='seat-followup');
  const button=()=>form()?.querySelector('[data-followup-import-action]');
  const field=()=>M.localSeriesField(call,'lead');
  function change(value){const node=document.getElementById('seat-followup-'+field().id);node.value=value;win.eventNode=node;vm.runInContext('(function(){'+node.getAttribute('onchange')+'}).call(eventNode)',win);delete win.eventNode;}
  function saved(id,raw,time,extra={}){
    const next={...call,...extra,callId:id};next.customerFollowup={...C.empty(next),...raw,updatedAt:time};next.customerFollowup.businessFieldSnapshot=M.callbackSnapshot(next.customerFollowup,next);return next;
  }
  mount();
  return {win,C,M,state,scope,storage,notices,writes,mount,form,button,field,change,saved,document,get call(){return call;},get values(){return values;},get managerHtml(){return managerHtml;},setValid:value=>{valid=value;},setAuthorized:value=>{authorized=value;}};
}

if(require.main===module) {
const h=harness(),{C,M}=h;
check(h.win.CustomerIntentProfile.mode==='local-series-text-store','test loads the real current product profile');
let field=h.field(),option=copy(field.options[0]),id=field.id;
const html=h.mount({intentionSeriesCode:option.businessKey,intentionStoreCode:'RAW_STORE_CODE',intentionStoreName:'导入门店保留'},{plannedStoreName:'手动计划门店',intendedSeries:{code:'OLD_INTERFACE',name:'旧接口车系'},intendedStore:[{code:'OLD_STORE',name:'旧接口门店'}]});
check(field.type==='select'&&field.localIntentRole==='series'&&h.values[id]==='','current local series starts empty without transferring old interface objects');
check(!html.includes('data-interface-prefix=')&&html.includes('id="seat-followup-'+id+'"')&&html.includes('option value="'+option.id+'"'),'actual product renders the local field as an ordinary single select with its actual field ID');
check(html.includes(encode(option.label+' · '+option.businessKey))&&html.includes('请选择（可清空）'),'operator dropdown shows administrator name/code and can clear selection');
check(html.includes('id="seat-followup-plannedStoreName"')&&html.includes('type="text"'),'planned store remains the original text field');
check(h.values[id]===''&&h.writes.length===0,'rendering imported information never writes a local series');
check(C.update(h.values,h.call,id,[option.id])===null&&C.update(h.values,h.call,id,{code:option.businessKey,name:option.label})===null,'local single select never coerces arrays or old interface objects into a draft value');
check(!C.validate({...h.values,[id]:[option.id]},h.call).ok,'local single-select validation rejects a list even if its string form resembles an option ID');
check(h.button()?.getAttribute('onclick').includes('CustomerFollowup.bringLocalOriginal')&&!html.includes('BusinessInterfaceField.bringOriginal('),'local import uses its own explicit action without an interface host');
h.change(option.id);
check(h.values[id]===option.id&&C.validate(h.values,h.call).ok,'real generated select handler updates and validates the local option ID');
const saved=C.save(h.call,h.values,{wrapping:true,expectedVersion:''});
check(saved.ok&&saved.values[id]===option.id,'actual follow-up save persists the selected internal option ID');
const row=saved.values.businessFieldSnapshot.fields.find(item=>item.fieldId===id);
check(row.localIntentRole==='series'&&row.selectedOptions[0].optionId===option.id&&row.selectedOptions[0].businessOptionCode===option.businessKey&&row.selectedOptions[0].optionName===option.label,'saved snapshot records local role and the exact option ID/code/name');
check(C.detail(saved.values,h.call).includes(encode(option.label+' · '+option.businessKey)),'call detail displays saved local series name and code');
const historical=JSON.stringify(h.call.customerFollowup),journal=storageValue(h);

// Exercise the actual administrator editor, including marker-specific wording and editable options.
h.win.BusinessConfiguration.render('field');h.win.BusinessConfiguration.open('field',id);
check(h.managerHtml.includes('本次意向车系为预置单选字段')&&h.managerHtml.includes('是否显示和必填在分类设置'),'administrator UI explains the fixed single field and category-level controls');
check(h.managerHtml.includes('业务字段编码（选填）')&&h.managerHtml.includes('用于字段映射；具体车系编码请在下方选项中维护。')&&!h.managerHtml.includes('不影响接口查询'),'local field metadata wording separates its optional field code from required series option codes');
check(h.managerHtml.includes('维护下方车系名称和编码，客服每次选择一个车系。'),'local editor starts with name/code maintenance guidance');
check(/id="business-field-type" disabled/.test(h.managerHtml)&&h.managerHtml.includes('车系编码 <b class="business-required">*</b>'),'local series type is locked and its option code is visibly required');
check(h.managerHtml.includes('车系名称和编码均必填，编码须唯一')&&!/placeholder="例如：自定义车系A" readonly/.test(h.managerHtml),'administrator can edit local option names and codes');
h.win.BusinessConfiguration.setOption(0,'label','管理员修改后的车系名称');h.win.BusinessConfiguration.setOption(0,'businessKey','001-RENAMED');h.win.BusinessConfiguration.save();
field=h.field();check(field.options[0].label==='管理员修改后的车系名称'&&field.options[0].businessKey==='001-RENAMED','actual administrator editor saves maintained local names and opaque string codes');
check(C.detail(saved.values,h.call).includes(encode(option.label+' · '+option.businessKey))&&!C.detail(saved.values,h.call).includes('管理员修改后的车系名称'),'renaming current options never changes historical call detail');
let projection=C.aggregate([h.call]);
check(C.detail(projection.groups[0].values,projection.groups[0]).includes(encode(option.label+' · '+option.businessKey)),'group detail retains the saved local option name/code after current configuration changes');
check(JSON.stringify(h.call.customerFollowup)===historical&&storageValue(h)===journal,'detail and aggregate projections leave the original call and journal untouched');

// Mandatory selection is configured independently by category, including explicit clearing.
let category=M.get('lead',h.scope);category.fields.find(ref=>ref.fieldId===id).required=true;check(M.save(category,h.scope).ok,'fixture enables only category-level local-series mandatory selection');
const blank={...C.empty(h.call),plannedStoreName:'手动计划门店'};
check(!C.validate(blank,h.call).ok&&C.validate(blank,h.call).field===id,'required local select rejects an empty value');
check(C.validate(blank,{...h.call,answered:false}).ok,'existing unanswered-outbound optional-field rule remains available');
category=M.get('lead',h.scope);category.fields.find(ref=>ref.fieldId===id).required=false;check(M.save(category,h.scope).ok,'fixture restores local series to optional without changing planned-store rules');
h.mount({callId:'local-series-clear'},{[id]:field.options[0].id});h.change('');
check(h.values[id]===''&&C.save(h.call,h.values,{wrapping:true,expectedVersion:''}).ok,'operator can explicitly clear and save an optional local selection');

// One call replaces the complete intention group, including transitions to/from old interface snapshots.
const first=h.saved('local-first',{[id]:field.options[0].id,plannedStoreName:'原计划门店'},'2026-10-19T01:00:00.000Z');
const cleared=h.saved('local-cleared',{[id]:'',plannedStoreName:''},'2026-10-19T02:00:00.000Z');
const oldSeries={code:'OLD_NEV',name:'历史接口车系',type:'NEV',entryId:'d-series'},oldStore={code:'OLD_STORE',name:'历史接口门店',type:'NEV',entryId:'d-store'};
const legacy={...h.call,callId:'legacy-intention',customerFollowup:{businessType:'lead',intendedSeries:oldSeries,intendedStore:[oldStore],plannedStoreName:'',updatedAt:'2026-10-19T03:00:00.000Z',businessFieldSnapshot:{fields:[{fieldId:'intendedSeries',fieldName:'历史接口车系字段',type:'interface',value:oldSeries},{fieldId:'intendedStore',fieldName:'历史接口门店字段',type:'interface',value:[oldStore]}]}}};
projection=C.aggregate([legacy]);
check(C.detail(projection.groups[0].values,projection.groups[0]).includes('历史接口车系 · OLD_NEV')&&C.detail(projection.groups[0].values,projection.groups[0]).includes('历史接口门店 · OLD_STORE'),'old interface-only archive remains visible under the new local product profile');
projection=C.aggregate([first,cleared]);
check(projection[id]===''&&projection.groups[0].values[id]===''&&!C.detail(projection.groups[0].values,projection.groups[0]).includes('管理员修改后的车系名称'),'latest empty local series clears previous aggregate selection and detail');
check(projection.plannedStoreName==='原计划门店','planned-store text keeps its existing ordinary nonempty aggregation behavior');
projection=C.aggregate([first,legacy]);
check(projection[id]===''&&projection.intendedSeries.code==='OLD_NEV'&&projection.intendedStore[0].code==='OLD_STORE','later historical interface call replaces the complete local intention set');
check(C.detail(projection.groups[0].values,projection.groups[0]).includes('历史接口车系 · OLD_NEV')&&!C.detail(projection.groups[0].values,projection.groups[0]).includes('管理员修改后的车系名称'),'switching to an old interface snapshot uses that same call in group detail');
const localAfter=h.saved('local-after-legacy',{[id]:field.options[1].id,plannedStoreName:''},'2026-10-19T04:00:00.000Z');
projection=C.aggregate([first,legacy,localAfter]);
check(projection[id]===field.options[1].id&&projection.intendedSeries===''&&projection.intendedStore.length===0,'later local call clears the earlier interface series/store set instead of combining calls');
const emptyAfter=h.saved('empty-after-legacy',{[id]:''},'2026-10-19T05:00:00.000Z');projection=C.aggregate([legacy,emptyAfter]);
check(projection[id]===''&&projection.intendedSeries===''&&projection.intendedStore.length===0,'an explicitly empty local snapshot also clears all former interface intentions');

// Explicit import matches only the exact administrator code and never writes imported store data.
field=h.field();option=field.options[0];h.mount({callId:'local-import',intentionSeriesCode:option.businessKey,intentionStoreCode:'RAW_IMPORT_STORE'},{plannedStoreName:'人工门店文本'});
const source=h.button();C.showTab('seat-followup','imported',source);
check(C.bringLocalOriginal('seat-followup',source)===true&&h.values[id]===option.id,'explicit import resolves exactly one current local business code');
check(h.values.plannedStoreName==='人工门店文本'&&!Object.hasOwn(h.values,'intendedStore'),'import does not write imported store into text or interface store fields');
check(h.document.getElementById('seat-followup-'+id).value===option.id&&h.form().dataset.followupTab==='current','successful import updates the actual select and returns to current information');
for(const unmatched of ['',option.businessKey+' ',option.label,'UNKNOWN_CODE']){
  h.mount({callId:'import-unmatched-'+unmatched,intentionSeriesCode:unmatched},{[id]:field.options[1].id,plannedStoreName:'保留门店'});
  const before=JSON.stringify(h.values);check(C.bringLocalOriginal('seat-followup',h.button())===false&&JSON.stringify(h.values)===before,'missing, whitespace-changed, name-only or unknown import codes never guess or clear the draft');
}

// Context, DOM owner, identity and authorization protections apply before the original handler is invoked.
h.mount({callId:'guard-session',intentionSeriesCode:option.businessKey});const beforeGuard=h.writes.length;
h.state.sessionId='OTHER_SESSION';check(!C.bringLocalOriginal('seat-followup',h.button())&&h.writes.length===beforeGuard,'changed login session blocks local import');h.state.sessionId='LOCAL_SERIES_SESSION';
h.setValid(false);check(!C.bringLocalOriginal('seat-followup',h.button())&&h.writes.length===beforeGuard,'invalid effective access blocks local import');h.setValid(true);
h.setAuthorized(false);check(!C.bringLocalOriginal('seat-followup',h.button())&&h.writes.length===beforeGuard,'revoked object authorization blocks local import');h.setAuthorized(true);
h.mount({callId:'guard-account',accountId:'OTHER_AGENT',intentionSeriesCode:option.businessKey});check(!C.bringLocalOriginal('seat-followup',h.button()),'a different workbench account cannot import into this call');
h.mount({callId:'guard-handler',intentionSeriesCode:option.businessKey},{},'UnknownOwner.write');check(!C.bringLocalOriginal('seat-followup',h.button()),'unapproved handler names cannot receive import writes');
h.mount({callId:'guard-old-owner',intentionSeriesCode:option.businessKey});const oldButton=h.button();h.mount({callId:'guard-new-owner',intentionSeriesCode:option.businessKey});check(!C.bringLocalOriginal('seat-followup',oldButton)&&h.values[id]==='','removed prior form owner cannot write into a newly mounted form');
h.mount({callId:'guard-same-call',intentionSeriesCode:option.businessKey});const priorButton=h.button();h.mount({callId:'guard-same-call',intentionSeriesCode:option.businessKey});check(!C.bringLocalOriginal('seat-followup',priorButton)&&h.values[id]==='','same-call reopen cannot revive the previous form token');
h.mount({callId:'guard-identity',intentionSeriesCode:option.businessKey});h.call.callId='REPLACED_IDENTITY';check(!C.bringLocalOriginal('seat-followup',h.button()),'changed call identity blocks a registered local import action');
h.mount({callId:'guard-config-change',intentionSeriesCode:option.businessKey});
const changed=M.getField(id,h.scope);changed.options[0].businessKey='ANOTHER_CODE';check(M.saveField(changed,h.scope).ok,'fixture changes current local codes after a form render');
check(!C.bringLocalOriginal('seat-followup',h.button())&&h.values[id]===''&&h.notices.at(-1)[0].includes('车系配置已更新'),'stale option configuration preserves input and gives a clear refresh-and-retry explanation');

// The ordinary archive editor uses its own real handler and existing edit authorization.
option=h.field().options[0];h.mount({callId:'archive-local-import',callSource:'HISTORY',processingStatus:'已完成',intentionSeriesCode:option.businessKey});
h.win.CustomerDirectory.list=()=>[{...h.scope,phone:h.call.customerPhone,calls:[h.call]}];
C.openEditor(h.call.callId);
const archiveForm=h.document.querySelectorAll('[data-followup-tabs]').find(node=>node.dataset.followupPrefix==='followup'),archiveButton=archiveForm.querySelector('[data-followup-import-action]');
check(C.bringLocalOriginal('followup',archiveButton)===true&&h.document.getElementById('followup-'+id).value===option.id,'authorized archive editor imports through its actual updateEditor handler without an interface host');
C.saveEditor();
check(h.call.customerFollowup[id]===option.id&&h.call.customerFollowup.businessFieldSnapshot.fields.find(item=>item.fieldId===id).selectedOptions[0].businessOptionCode===option.businessKey,'archive save preserves the exact local series snapshot after explicit import');

// Preserved, unused legacy definitions produce a manager notice without blocking local customer fields.
const old=harness(),catalog=old.M.catalog(old.scope),bundle={...old.scope,fields:copy(catalog.fields),types:copy(catalog.rows)};
const backup={...copy(bundle.fields.find(item=>item.id==='intendedSeries')),id:'backupSeries',label:'旧备用车系'};bundle.fields.push(backup);
bundle.fields.find(item=>item.id==='intendedStore').depends=['intendedSeries','backupSeries'];
old.storage.set(old.M.storageKey,JSON.stringify({version:3,revision:9,scopes:[bundle]}));
const warning=old.M.catalog(old.scope).profileWarning,warningHtml=old.win.BusinessConfiguration.render('field');
check(warning.includes('旧多上游')&&warningHtml.includes('<p class="business-config-notice" role="status">'+encode(warning)+'</p>'),'manager displays the real model legacy warning as a nonblocking status notice');
check(!old.M.configurationIssue('lead',old.scope)&&old.C.validate(old.values,old.call).ok,'unused legacy multi-source definitions do not block the current local-series customer path');

// An explicit edit of an old record retains its former interface selections as read-only history.
const edit=harness(),original={businessType:'lead',intendedSeries:copy(oldSeries),intendedStore:[copy(oldStore)],updatedAt:'2026-10-19T01:00:00.000Z',businessFieldSnapshot:{fields:[
  {fieldId:'intendedSeries',fieldName:'当时的车系字段',businessFieldCode:'LEGACY_SERIES_FIELD',type:'interface',value:copy(oldSeries)},
  {fieldId:'intendedStore',fieldName:'当时的门店字段',type:'interface',value:[copy(oldStore)]}
]}};
const untouchedOriginal=JSON.stringify(original);
edit.mount({callId:'legacy-record-edit',callSource:'HISTORY',processingStatus:'已完成',customerFollowup:copy(original)},{...copy(original),plannedStoreName:'仅修改计划门店'});
edit.win.CustomerDirectory.list=()=>[{...edit.scope,phone:edit.call.customerPhone,calls:[edit.call]}];
const edited=edit.C.save(edit.call,edit.values,{expectedVersion:original.updatedAt});
check(edited.ok&&edited.values.plannedStoreName==='仅修改计划门店','authorized old-record edit saves the current ordinary text change');
const legacyRows=edited.values.businessFieldSnapshot.legacyFields;
check(legacyRows.length===2&&legacyRows[0].fieldName==='当时的车系字段'&&legacyRows[0].businessFieldCode==='LEGACY_SERIES_FIELD'&&legacyRows[0].value.code===oldSeries.code&&legacyRows[1].value[0].name===oldStore.name,'former interface field metadata, codes and names survive in an independent legacy snapshot');
const localId=edit.field().id;
check(edited.values[localId]===''&&!Object.hasOwn(edited.values,'intendedSeries')&&!Object.hasOwn(edited.values,'intendedStore')&&!edited.values.businessFieldSnapshot.fields.some(item=>item.fieldId==='intendedSeries'||item.fieldId==='intendedStore'),'legacy interface values never become current local or text-store input');
const historyHtml=edit.C.detail(edited.values,edit.call);
check(historyHtml.includes('历史接口信息（只读）')&&historyHtml.includes('当时的车系字段')&&historyHtml.includes('历史接口车系 · OLD_NEV')&&historyHtml.includes('历史接口门店 · OLD_STORE'),'edited record detail clearly renders retained historical interface names and codes');
const editedProjection=edit.C.aggregate([edit.call]);
check(!editedProjection.intendedSeries&&!editedProjection.intendedStore&&!edit.C.detail(editedProjection.groups[0].values,editedProjection.groups[0]).includes('OLD_NEV'),'legacy-only information does not participate in the current intention aggregate');
const nextDraft={...edited.values,plannedStoreName:'第二次修改计划门店',[localId]:edit.field().options[1].id};
const secondEdit=edit.C.save(edit.call,nextDraft,{expectedVersion:edited.values.updatedAt});
check(secondEdit.ok&&JSON.stringify(secondEdit.values.businessFieldSnapshot.legacyFields)===JSON.stringify(legacyRows),'repeated saves preserve the original legacy segment while current local intention remains independent');
check(secondEdit.values.businessFieldSnapshot.fields.find(item=>item.fieldId===localId).selectedOptions[0].optionId===edit.field().options[1].id&&edit.C.detail(secondEdit.values,edit.call).includes('OLD_NEV'),'a new current local selection coexists with separately labelled read-only legacy history');
check(JSON.stringify(original)===untouchedOriginal,'explicit editing never mutates the old source snapshot object in place');
console.log(JSON.stringify({ok:true,assertions:passed,scope:'real local profile, ordinary series select, code/name snapshots, same-call intention aggregation, explicit import and context guards; no network'}));
function storageValue(value){return value.storage.get('customer-followup-v1');}

}
module.exports={harness,copy,encode};
