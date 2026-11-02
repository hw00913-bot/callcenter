  // Project supplier-private import evidence for the original tenant only.
  // This never mutates the stored ledger, sealed source history, or shared fields.
  function fourPrivateProjection(value,a=access(),state){
    if(value===undefined||value===null||typeof value!=='object')return value;
    const view=clone(value);let recordIndex=Array.isArray(state?.records)?new Map(state.records.map(record=>[record.recordId,record])):null;
    const recordSource=id=>{if(!recordIndex){try{recordIndex=new Map(read().records.map(record=>[record.recordId,record]));}catch(_){recordIndex=new Map();}}const row=recordIndex.get(id);return row?.taskImportSource?.tenantId||row?.originalImportSnapshot?.taskImportSource?.tenantId||row?.entrySource?.tenantId;};
    const privateKeys=(node)=>{const result=new Set(),take=snapshot=>{for(const field of snapshot?.customFields||[])for(const key of [field.key,field.id])if(typeof key==='string')result.add(key);for(const key of Object.keys(snapshot?.customValues||{}))result.add(key);};take(node.taskImportParameterSnapshot);take(node.originalImportSnapshot?.taskImportParameterSnapshot);take(node.taskImportParameterMapping);for(const snapshot of node.aiImportParameterSnapshots||[])if(snapshot?.tenantId!==a.tenantId)take(snapshot);return result;};
    const bags=new Set(['fields','values','parameters','businessValues','followupValues','providedValues','providedTargetValues','beforeValues','customValues','importValues','originalValues']);
    const metadata=new Set(['taskImportSource','sceneSnapshot','resourceSnapshot','sourceResolution','taskImportParameterMapping']);
    const visit=(node,sourceTenant,contextTenant,keys=new Set(),insideMetadata=false,privateContext=false)=>{
      if(!node||typeof node!=='object')return;
      if(Array.isArray(node)){for(const item of node)visit(item,sourceTenant,contextTenant,keys,insideMetadata,privateContext);return;}
      const explicit=node.taskImportSource?.tenantId||node.originalImportSnapshot?.taskImportSource?.tenantId||node.entrySource?.tenantId;
      const origin=explicit||sourceTenant||(typeof node.recordId==='string'?recordSource(node.recordId):undefined),tenant=typeof node.tenantId==='string'?node.tenantId:contextTenant;
      const own=typeof origin==='string'&&origin===a.tenantId,allKeys=new Set([...keys,...privateKeys(node)]),hasPrivate=privateContext||!!node.taskImportSource||!!node.taskImportParameterSnapshot||!!node.taskImportParameterMapping||Array.isArray(node.aiImportParameterSnapshots);
      if(!own){
        delete node.taskImportParameterSnapshot;delete node.taskImportParameterMapping;
        for(const key of ['targetFingerprint','parameterMappingFingerprint','taskTargetFingerprint','importBasisToken','fieldBasisToken'])delete node[key];
        if(hasPrivate){delete node.customValues;delete node.raw;delete node.originalRaw;delete node.rawData;}
        if(insideMetadata)for(const key of ['configurationFingerprint','executionConfigurationFingerprint','fingerprint','raw','parameters','customValues'])delete node[key];
      }
      if(node.type==='AI_IMPORT_DATA_SAVED'&&node.tenantId!==a.tenantId)delete node.customValues;
      if(Array.isArray(node.aiImportParameterSnapshots)){
        node.aiImportParameterSnapshots=node.aiImportParameterSnapshots.filter(snapshot=>snapshot?.tenantId===a.tenantId);
        for(const snapshot of node.aiImportParameterSnapshots)visit(snapshot,snapshot.tenantId,snapshot.tenantId,new Set(),false,true);
      }
      if(node.aiImportParameterSnapshot){const owner=node.aiImportParameterSnapshot.tenantId||tenant;if(owner!==a.tenantId||tenant&&tenant!==a.tenantId)delete node.aiImportParameterSnapshot;else visit(node.aiImportParameterSnapshot,owner,owner,new Set(),false,true);}
      for(const [key,child]of Object.entries(node)){
        if(['aiImportParameterSnapshots','aiImportParameterSnapshot'].includes(key)||!child||typeof child!=='object')continue;
        if(bags.has(key)){
          if(!own&&allKeys.size)for(const privateKey of allKeys)delete child[privateKey];
          continue;
        }
        if(key==='taskImportParameterSnapshot'){visit(child,origin,tenant,new Set(),false,true);continue;}
        let nextOrigin=origin,nextTenant=tenant,nextKeys=allKeys;
        if(key==='historySnapshot'&&typeof child.tenantId==='string')nextOrigin=child.tenantId;
        if(['sceneSnapshot','resourceSnapshot','sourceResolution'].includes(key)&&typeof (child.tenantId||tenant)==='string')nextOrigin=child.tenantId||tenant;
        if(key==='events'&&Array.isArray(child)){
          for(const event of child)visit(event,event?.type==='AI_IMPORT_DATA_SAVED'?event.tenantId:origin,event?.tenantId||tenant,allKeys,false,hasPrivate);continue;
        }
        visit(child,nextOrigin,nextTenant,nextKeys,metadata.has(key),hasPrivate);
      }
    };
    visit(view,undefined,undefined);return view;
  }
  function fourProjectAIImportData(view,a){return fourPrivateProjection(view,a);}
  function fourProjectAIImportBatch(batch,a){return fourPrivateProjection(batch,a);}
