/* Exact, read-only AI scene input-source classification. Never migrates stored scenes. */
(function(root){
  'use strict';
  const known=new Set(['MANUAL','AUTO']);
  const nativeModes=Object.freeze({'手动导入':'MANUAL','自动传入':'AUTO','接口传入':'AUTO'});
  const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
  function mode(scene){
    if(!scene||typeof scene!=='object'||Array.isArray(scene))return 'UNKNOWN';
    try{
      const has=own(scene,'dataImportSource'),canonical=scene.dataImportSource,native=scene.importType;
      const nativeMode=typeof native==='string'&&own(nativeModes,native)?nativeModes[native]:'UNKNOWN';
      if(has){
        if(!known.has(canonical))return 'UNKNOWN';
        if(native!==undefined&&native!==null&&native!==''&&nativeMode!==canonical)return 'UNKNOWN';
        return canonical;
      }
      return nativeMode;
    }catch(_){return 'UNKNOWN';}
  }
  function nativeValue(source,platform){return source==='MANUAL'?'手动导入':source==='AUTO'?(platform==='冰兰'?'接口传入':'自动传入'):'';}
  function label(scene){const source=mode(scene);if(source==='UNKNOWN')return scene?.dataImportSource==='FLOW'||scene?.importType==='流转模板传入'?'流转模板传入（待修正）':'待核';return typeof scene.importType==='string'&&nativeModes[scene.importType]===source?scene.importType:nativeValue(source,scene.platform);}
  function forHandlingMode(handlingMode){return ['TEMPLATE','DIRECT'].includes(handlingMode)?handlingMode:'UNKNOWN';}
  function forImportChannel(importChannel='MANUAL'){return importChannel==='MANUAL'?'TASK_MANUAL':importChannel==='API'?'TASK_AUTO':'UNKNOWN';}
  function eligibleForEntry(scene,entry){const source=mode(scene);return (entry==='TEMPLATE'||entry==='DIRECT')?known.has(source):entry==='TASK_MANUAL'?source==='MANUAL':entry==='TASK_AUTO'?source==='AUTO':false;}
  function fingerprint(scene){
    if(!scene||typeof scene!=='object'||Array.isArray(scene))return JSON.stringify({source:'UNKNOWN',validObject:false});
    try{return JSON.stringify({policy:2,source:mode(scene),canonicalPresent:own(scene,'dataImportSource'),dataImportSource:scene.dataImportSource??null,nativePresent:own(scene,'importType'),importType:scene.importType??null});}
    catch(_){return JSON.stringify({source:'UNKNOWN',invalidValue:true});}
  }
  root.DAISceneImportSource=Object.freeze({mode,nativeValue,label,forHandlingMode,forImportChannel,eligibleForEntry,fingerprint});
})(window);
