const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root='/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype';
const code=fs.readFileSync(root+'/js/components/session-store.js','utf8');
function fn(name){const a=new RegExp('^    function '+name+'\\(','m').exec(code);assert(a,name);const b=/^    function \w+\(/m.exec(code.slice(a.index+a[0].length));assert(b,name);return code.slice(a.index,a.index+a[0].length+b.index);}
const clone=x=>JSON.parse(JSON.stringify(x));
let saved={version:1,accounts:{A:{positions:{T:{pageId:'PAGE-2204',filters:{batchId:'AI-BATCH-OLD',batchDetail:true},pageFilters:{'PAGE-2204':{batchId:'AI-BATCH-OLD',batchDetail:true}},areaPages:{}}}}}};
const box={accountId:'A',scopeId:'T',persistent:{},copy:clone,preferences:()=>clone(saved),context:()=>({scope:{grant:{landing:'PAGE-2204'}}}),isGlobalManagementPage:()=>false,authorityScopeId:()=> 'T',allowed:()=>true,page:id=>({id,area:'业务&客户',module:'cloud'}),available:()=>[],write:(_storage,_key,data)=>{saved=clone(data);}};
vm.createContext(box);vm.runInContext(['storedPosition','hasPositionContext','position','landing','remember','filters'].map(fn).join('\n')+'\nthis.api={remember,position,landing,filters};',box);
box.api.remember('PAGE-2226',{});
const outcome={rememberedPage:saved.accounts.A.positions.T.pageId,rememberedFilters:saved.accounts.A.positions.T.filters,position:box.api.position(),landingAfterReload:box.api.landing(),restoredFallbackFilters:box.api.filters('PAGE-2204')};
assert.equal(outcome.rememberedPage,'PAGE-2226');assert.equal(outcome.position,null);assert.equal(outcome.landingAfterReload,'PAGE-2204');assert.equal(outcome.restoredFallbackFilters.batchId,'AI-BATCH-OLD');
box.api.remember('PAGE-2226',{batchKey:'OLD-REQUIRED-CONTEXT'});outcome.contrastLandingWithLegacyBatchKey=box.api.landing();assert.equal(outcome.contrastLandingWithLegacyBatchKey,'PAGE-2226');
fs.writeFileSync('/tmp/qa54-session-restore-repro.json',JSON.stringify(outcome,null,2)+'\n');console.log(JSON.stringify(outcome));
