/** Real current models and read-only usage scanner; browser/storage ports are isolated in memory. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {harness,Element,copy}=require('./current-profile.cjs');
const base=path.resolve(__dirname,'../..');
if(!Element.prototype.usageDom){
 Object.defineProperty(Element.prototype,'usageDom',{value:true});
 Object.defineProperty(Element.prototype,'className',{get(){return this.getAttribute('class')||'';},set(value){this.setAttribute('class',value);}});
 Element.prototype.prepend=function(child){child.parentElement=this;child.ownerDocument=this.ownerDocument;this.children.unshift(child);};
 Element.prototype.append=function(child){return this.appendChild(child);};
 Element.prototype.click=function(){if(this.disabled)return false;if(this.onclick)return this.onclick();const source=this.getAttribute('onclick');if(source){const w=this.ownerDocument.window;w.eventTarget=this;try{return vm.runInContext('(function(){'+source+'}).call(eventTarget)',w);}finally{delete w.eventTarget;}}};
 const query=Element.prototype.querySelectorAll;Element.prototype.querySelectorAll=function(selector){return [...new Set(selector.split(',').flatMap(part=>query.call(this,part)))];};
 const matches=Element.prototype.matches;Element.prototype.matches=function(selector){const negatives=[...selector.matchAll(/:not\(([^)]+)\)/g)].map(row=>row[1]);return !negatives.some(value=>matches.call(this,value))&&matches.call(this,selector.replace(/:not\([^)]+\)/g,''));};
 const inner=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML').set;
 Object.defineProperty(Element.prototype,'innerHTML',{set(value){inner.call(this,value);augment(this);}});
}
function augment(node){node.classList.add=(...items)=>items.forEach(value=>node.classList.toggle(value,true));node.classList.remove=(...items)=>items.forEach(value=>node.classList.toggle(value,false));node.style.setProperty=(key,value)=>{node.style[key]=value;};node.style.removeProperty=key=>delete node.style[key];node.children.forEach(augment);return node;}
function setup({page=false}={}){
 const h=harness(),w=h.win,reads=new Set(),writes=[],events=[];let projections=0,superUser=true;
 h.storage.clear();h.session.clear();for(const key of ['calls','tasks','predictiveTasks','ivrTasks'])w.CloudCallData[key]=[];
 const get=w.localStorage.getItem,set=w.localStorage.setItem,sessionGet=w.sessionStorage.getItem,sessionSet=w.sessionStorage.setItem;
 w.localStorage.getItem=key=>{reads.add('local:'+key);return get(key);};w.localStorage.setItem=(key,value)=>{writes.push(['local',key]);return set(key,value);};
 w.sessionStorage.getItem=key=>{reads.add('session:'+key);return sessionGet(key);};w.sessionStorage.setItem=(key,value)=>{writes.push(['session',key]);return sessionSet(key,value);};
 for(const storage of [w.localStorage,w.sessionStorage]){storage.key=()=>{throw Error('storage enumeration prohibited');};Object.defineProperty(storage,'length',{get(){throw Error('storage enumeration prohibited');}});}
 w.CustomerDirectory.list=w.CustomerDirectory.sync=()=>{projections++;throw Error('mutating directory projection prohibited');};
 w.AgentWorkbench.current=()=>{projections++;throw Error('workbench restoration prohibited');};
 w.AppState.isSuper=()=>superUser;w.dispatchEvent=event=>events.push(event);
 const load=file=>vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),w,{filename:file});
 if(page){w.document.window=w;augment(h.document.body);w.document.createElement=tag=>augment(new Element(tag,{},h.document));w.queueMicrotask=fn=>fn();w.getComputedStyle=node=>({zIndex:node.style.zIndex||'0'});load('js/components/platform-ui.js');load('js/pages/business-data-dictionary.js');}
 const B=w.BusinessData,U=w.BusinessConfigurationUsage,M=w.CustomerBusiness;
 const source=(name='未使用取数接口',capabilityId='series')=>{const result=B.create({name,capabilityId,tenantIds:[h.scope.tenantId],enabled:true});if(!result.ok)throw Error(result.message);return result.row;};
 const field=(id='unusedField',dictionaryId)=>{const row={id,label:'测试字段 '+id,type:dictionaryId?'interface':'text',enabled:true,businessKey:'',options:[],...(dictionaryId?{dictionaryId,useQueryConditions:false,depends:[]}:{})};const result=M.saveField(row,h.scope);if(!result.ok)throw Error(result.message);return result.row;};
 const category=(id='unusedCategory',fields=[])=>{const result=M.save({id,label:'测试分类 '+id,codeLabel:'业务编码',prefix:'TEST',enabled:true,fields:fields.map(fieldId=>({fieldId,enabled:true,required:false}))},h.scope);if(!result.ok)throw Error(result.message);return result.row;};
 const inspect=(kind,id,scope=kind==='interface'?undefined:h.scope)=>U.inspect({kind,id,scope});
 const history=(id='USAGE-HISTORY',businessType='unusedCategory',values={})=>({...h.scope,callId:id,customerPhone:'13900009999',callee:'13900009999',direction:'呼出',accountId:h.state.accountId,businessType,callSource:'NATIVE_WORKBENCH',processingStatus:'已完成',endedAt:'2026-10-20 12:00:00',customerFollowup:copy(values)});
 const manifest=(fieldId,dictionaryId)=>({businessType:'unusedCategory',updatedAt:'2026-10-20T04:00:00.000Z',[fieldId]:dictionaryId?{code:'S1',name:'当时选择',entryId:dictionaryId}:'当时内容',businessFieldSnapshot:{businessType:'unusedCategory',values:{[fieldId]:dictionaryId?{code:'S1',name:'当时选择'}:'当时内容'},fields:[{fieldId,fieldName:'当时字段',type:dictionaryId?'interface':'text',...(dictionaryId?{dictionaryId,interfaceKind:'series',selectionMode:'single'}:{}),value:dictionaryId?{code:'S1',name:'当时选择'}:'当时内容'}]}});
 const render=options=>{const html=w.Pages['business-data-dictionary'].render(options);let node=h.document.getElementById('usage-page-host');if(!node){node=h.document.createElement('main');node.id='usage-page-host';h.document.body.appendChild(node);}node.innerHTML=html;return node;};
 return {...h,w,B,U,M,reads,writes,events,load,source,field,category,inspect,history,manifest,render,get projections(){return projections;},superUser:value=>{superUser=value;},get call(){return h.call;},get values(){return h.values;}};
}
module.exports={setup,copy};
