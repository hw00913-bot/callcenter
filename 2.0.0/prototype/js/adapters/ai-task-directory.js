/* Read existing professional HP tasks through confirmed local scene associations. */
(function(root){
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const text=value=>typeof value==='string'?value.trim():'';
  const identity=value=>typeof value==='string'||typeof value==='number'?String(value):'';
  const encoded=value=>encodeURIComponent(value).replace(/[!'()*]/g,ch=>'%'+ch.charCodeAt(0).toString(16).toUpperCase());
  const taskKey=(tenantId,taskId)=>'AI-HP-LINK:'+encoded(tenantId)+':'+encoded(taskId);
  function create(reader){
    function read(){
      const input=reader(),c=input.context,owner=input.owner,scope=c?.scope,tenant=scope?.tenant;
      if(!c||!owner||c.account?.enabled===false||scope?.kind!=='tenant'||c.account?.id!==owner.account?.id||scope.id!==owner.scope?.id||!tenant?.enabled||tenant.modules?.ai!==true||!scope.grant?.modules?.includes('ai')||!tenant.brandId||owner.scope?.tenant?.brandId!==tenant.brandId)throw Error('当前AI专业任务的账号、租户或品牌范围已变化，请重新进入。');
      if(!Array.isArray(input.nativeRows)||!Array.isArray(input.scenes)||!Array.isArray(input.remoteTasks)||!Array.isArray(input.accounts))throw Error('当前AI专业任务或已保存场景目录尚未核定，不能视为空名单。');
      const rows=input.nativeRows.slice(),issues=[],links=new Map(),nativeIds=new Set(rows.map(row=>identity(row?.id))),nativeRemote=new Set(rows.filter(row=>row?.platform==='厚朴'&&row.integrationTenantId===scope.id).map(row=>text(row.task_id)||text(row.taskId)).filter(Boolean));
      for(const scene of input.scenes){
        if(!scene||scene.platform!=='厚朴'||scene.enabled===false||scene.deleted===true||['disabled','stopped','停用','已停用'].includes(scene.status))continue;
        const own=scene.integrationTenantId===scope.id||scene.tenantId===scope.id||Array.isArray(scene.tenantIds)&&scene.tenantIds.includes(scope.id);
        if(!own||scene.brandId&&scene.brandId!==tenant.brandId)continue;
        const remoteId=text(scene.taskId),sceneId=identity(scene.id),categoryId=text(scene.unifiedCategoryId);
        if(!remoteId||!sceneId||!text(scene.sceneId)||!categoryId||!text(scene.houpuAccountId)||scene.task_id!=null&&text(scene.task_id)!==remoteId){issues.push('厚朴场景的任务、分类或账号关联尚待核对。');continue;}
        const list=links.get(remoteId)||[];list.push(scene);links.set(remoteId,list);
      }
      for(const [remoteId,scenes] of links){
        if(scenes.length!==1){issues.push('厚朴任务 '+remoteId+' 关联多个业务场景，请先核对唯一关联。');continue;}
        if(nativeRemote.has(remoteId))continue; // Original tasks keep their original objects and counters.
        const scene=scenes[0],accounts=input.accounts.filter(row=>row?.id===scene.houpuAccountId&&row.enabled!==false),remote=input.remoteTasks.filter(row=>row?.taskId===remoteId&&row.accountId===scene.houpuAccountId);
        if(accounts.length!==1||remote.length!==1){issues.push('厚朴任务 '+remoteId+' 的原任务或账号资料缺失或不唯一，请重新查询关联。');continue;}
        const task=remote[0];if(task.enabled===false||task.deleted===true)continue;
        if(!text(scene.templateId)||task.templateId!==scene.templateId){issues.push('厚朴任务 '+remoteId+' 的号码模板已变化，请重新查询并核对场景。');continue;}
        const id=taskKey(scope.id,remoteId);if(nativeIds.has(id)){issues.push('厚朴专业任务的本地身份冲突，请保留资料后核对。');continue;}
        const mode=input.sourceMode?.(scene)||'UNKNOWN',source=mode==='MANUAL'?'手动导入':mode==='AUTO'?'接口传入':'待核';
        const projected={id,name:text(scene.name)||text(task.taskName)||remoteId,taskName:text(task.taskName)||remoteId,platform:'厚朴',task_id:remoteId,taskStatus:task.taskStatus,status:'unknown',source,workflowSceneId:identity(scene.id),sceneId:identity(scene.id),unifiedCategoryId:scene.unifiedCategoryId,integrationTenantId:scope.id,brandId:tenant.brandId,enabled:true,assigned:null,pending:null,called:null,_linkedProfessionalTask:true,_professionalTask:clone(task),_linkedSceneId:identity(scene.id)};
        for(const key of ['autoStartOnAdd','autoStart','startOnAssign','running'])if(Object.hasOwn(task,key))projected[key]=task[key];
        rows.push(projected);nativeIds.add(id);
      }
      return {rows,issues:[...new Set(issues)],tenantId:scope.id,brandId:tenant.brandId};
    }
    function rows(){return read().rows;}
    function find(id){return rows().find(row=>identity(row.id)===identity(id));}
    function detail(id){const row=find(id);if(!row?._linkedProfessionalTask)return null;const task=row._professionalTask,bots=reader().bots||[],matched=bots.filter(bot=>bot?.botId===task.botId);return {task_id:task.taskId,taskName:task.taskName||task.taskId,botId:task.botId||'',botName:matched.length===1?matched[0].name||'':'',forbiddenCallTime:text(task.forbiddenCallTime)||'未提供',recall:text(task.redialText)||'未提供'};}
    return {read,rows,find,detail};
  }
  const live=create(()=>({context:root.parent?.DSession?.context?.(),owner:root.DNativeContext?.context,nativeRows:root.MockSceneList,scenes:root.Pages?.['sys-scene']?.integrationState?.()||root.MockSceneRows,remoteTasks:root.MockHoupuRemoteTasks,accounts:root.MockHoupuAccounts,bots:root.MockHoupuBots,sourceMode:scene=>(root.DAISceneImportSource||root.parent?.DAISceneImportSource)?.mode(scene)}));
  root.DAITaskDirectory={...live,create};
})(window);
