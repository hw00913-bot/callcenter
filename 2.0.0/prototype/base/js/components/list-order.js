/* Shared display ordering. No storage writes and no source-array mutations. */
(function(root){
  'use strict';
  const updateKeys=Object.freeze(['localUpdatedAt','updatedAt','updateTime','updatedTime','modifiedAt','modifyTime','lastModifiedAt','lastUpdateTime','updated_at','update_time','modify_time','gmtModified','customerFollowup.updatedAt']);
  const createKeys=Object.freeze(['createdAt','createTime','createdTime','created_at','create_time','gmtCreate']);
  function parse(value){
    if(value===null||value===undefined||value==='')return null;
    if(Object.prototype.toString.call(value)==='[object Date]'){const result=value.getTime();return Number.isFinite(result)?result:null;}
    if(typeof value==='number'||typeof value==='string'&&/^\d{10,13}(?:\.\d+)?$/.test(value.trim())){
      const number=Number(value),result=Math.abs(number)>=1e11?number:number*1000;
      return Number.isFinite(result)&&Math.abs(result)<=8640000000000000?result:null;
    }
    if(typeof value!=='string')return null;
    const text=value.trim(),match=/^(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})日?(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2})(\.\d{1,3})?)?)?(Z|[+-]\d{2}:?\d{2})?$/.exec(text);
    if(!match)return null;
    const [,year,month,day,hour='0',minute='0',second='0',fraction='',zone='']=match;
    const calendar=new Date(Date.UTC(+year,+month-1,+day));
    if(calendar.getUTCFullYear()!==+year||calendar.getUTCMonth()!==+month-1||calendar.getUTCDate()!==+day||+hour>23||+minute>59||+second>59)return null;
    const pad=value=>String(value).padStart(2,'0'),offset=zone?(zone==='Z'?'Z':zone.replace(/^([+-]\d{2})(\d{2})$/,'$1:$2')):'+08:00';
    const result=Date.parse(year+'-'+pad(month)+'-'+pad(day)+'T'+pad(hour)+':'+pad(minute)+':'+pad(second)+fraction+offset);
    return Number.isFinite(result)?result:null;
  }
  function valuesAt(row,path){
    const segments=String(path).replace(/\[\]/g,'.*').split('.');
    const visit=(value,index)=>{
      if(index===segments.length)return Array.isArray(value)?value.flatMap(item=>visit(item,index)):[value];
      if(value===null||value===undefined)return [];
      if(segments[index]==='*')return Array.isArray(value)?value.flatMap(item=>visit(item,index+1)):[];
      return visit(value[segments[index]],index+1);
    };
    return visit(row,0);
  }
  function time(row,options={}){
    if(!row||typeof row!=='object')return parse(row);
    const keys=Array.isArray(options.keys)?options.keys:updateKeys;
    const updates=keys.flatMap(key=>valuesAt(row,key)).map(parse).filter(value=>value!==null);
    if(updates.length)return Math.max(...updates);
    const explicit=typeof options.fallback==='function'?options.fallback(row):[];
    const fallback=[...(Array.isArray(explicit)?explicit:[explicit]),...(options.fallbackKeys||[]).flatMap(key=>valuesAt(row,key)),...createKeys.flatMap(key=>valuesAt(row,key))];
    for(const value of fallback){const result=parse(value);if(result!==null)return result;}
    return null;
  }
  function rows(source,options={}){
    return (Array.isArray(source)?source:[]).map((row,index)=>({row,index,time:time(row,options)}))
      .sort((a,b)=>(b.time??-Infinity)-(a.time??-Infinity)||a.index-b.index).map(item=>item.row);
  }
  root.DListOrder=Object.freeze({parse,time,rows,updateKeys,createKeys});
})(typeof window==='undefined'?globalThis:window);
