/* Current storage codec: no startup migration; explicit current writes remain atomic. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const prefix='alicti-v1.1.1-interface-trial:';
let passed=0;const check=(value,message)=>{assert.ok(value,message);passed++;};
const reads=[],writes=[],removed=[],events=new Map();
class Storage {
  constructor(seed={}){this.values=new Map(Object.entries(seed));this.failSet=false;}
  getItem(key){reads.push(String(key));return this.values.get(String(key))??null;}
  setItem(key,value){if(this.failSet)throw Error('QuotaExceededError');writes.push(String(key));this.values.set(String(key),String(value));}
  removeItem(key){removed.push(String(key));this.values.delete(String(key));}
  key(index){return [...this.values.keys()][index]??null;}
  get length(){return this.values.size;}
}
const oldConfig='{"version":3,"scopes":[{"legacy":"123 and old intendedStore dependencies"}]}';
const oldFollowup='{"version":1,"entries":[{"legacyFields":["old intent"]}]}';
const oldTasks=JSON.stringify(Array.from({length:50},()=>({note:'Existing journal must not be rewritten during startup.'})));
const local=new Storage({[prefix+'customer-business-config-v3']:oldConfig,[prefix+'customer-followup-v1']:oldFollowup,[prefix+'customer-task-batches-v1']:oldTasks,'unrelated-site-key':'outside'});
const session=new Storage({[prefix+'customer-task-batches-v1']:oldTasks});
const beforeLocal=[...local.values],beforeSession=[...session.values];
const context={Storage,localStorage:local,sessionStorage:session,navigator:{},addEventListener:(name,fn)=>events.set(name,fn)};
context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(base,'js/alicti-storage.js'),'utf8'),context,{filename:'js/alicti-storage.js'});
check(!reads.length&&!writes.length&&!removed.length,'loading the codec never scans, rewrites or deletes existing journals');
check(JSON.stringify([...local.values])===JSON.stringify(beforeLocal)&&JSON.stringify([...session.values])===JSON.stringify(beforeSession),'old configuration, old followup and existing task bytes remain untouched at startup');
local.setItem('customer-business-config-v111-current','{"version":1,"revision":1,"scopes":[]}');
check(local.getItem('customer-business-config-v111-current')==='{"version":1,"revision":1,"scopes":[]}','current business configuration persists and reads without a legacy source');
check(!reads.includes(prefix+'customer-business-config-v3')&&!writes.includes(prefix+'customer-business-config-v3'),'current configuration access never reads or writes the old business key');
const repeated=JSON.stringify(Array.from({length:90},(_,index)=>({label:'A meaningful repeated current-record label',note:'Literal control escape: \\u0001; current string retained',index})));
local.setItem('customer-directory-v1',repeated);
check(local.getItem('customer-directory-v1')===repeated,'normal current journal encoding has a lossless roundtrip');
check(local.values.get(prefix+'customer-directory-v1').length<repeated.length,'current writes still compact repeated strings to avoid unnecessary quota usage');
local.failSet=true;let quota=false;try{local.setItem('customer-directory-v1','new value');}catch(_){quota=true;}local.failSet=false;
check(quota&&local.getItem('customer-directory-v1')===repeated,'an unsuccessful current write preserves prior stored bytes and cached contents');
check(local.values.get(prefix+'customer-business-config-v3')===oldConfig&&local.values.get(prefix+'customer-followup-v1')===oldFollowup&&local.values.get(prefix+'customer-task-batches-v1')===oldTasks,'unrelated old journals are not migrated while current values are saved');
let stopped=false;events.get('storage')({key:'unrelated-site-key',stopImmediatePropagation(){stopped=true;}});
check(stopped,'foreign storage events remain isolated from this prototype');
const event={key:prefix+'customer-business-config-v111-current',oldValue:null,newValue:'current',stopImmediatePropagation(){throw Error('should remain in scope');}};
events.get('storage')(event);
check(event.key==='customer-business-config-v111-current'&&event.newValue==='current','current storage events retain their logical key and contents');
const ids=Array.from({length:local.length},(_,index)=>local.key(index));
check(ids.includes('customer-business-config-v111-current')&&!ids.includes('unrelated-site-key'),'the normal namespace inventory does not expose foreign site values');
console.log(JSON.stringify({passed,scope:'no startup migration, current persistence/codec/quota and namespace events'}));
