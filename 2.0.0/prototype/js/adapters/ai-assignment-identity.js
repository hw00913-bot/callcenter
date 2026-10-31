/* Stable tenant/task-scoped identities for original AI assigned rows. */
(function(){
 'use strict';
 function normalize(assigned,tenant){
  if(!assigned||typeof assigned!=='object'||Array.isArray(assigned))throw Error('名单结构待核');
  Object.entries(assigned).forEach(([task,rows])=>{
   if(!Array.isArray(rows))throw Error('名单结构待核');
   const seen=new Set();
   rows.forEach((r,i)=>{
    if(!r||typeof r!=='object')throw Error('名单行待核');
    if(!r.assignmentId){
     // Legacy positional identities are assigned once and retained, including tombstones.
     r.assignmentId='AIROW-'+encodeURIComponent(tenant)+'-'+encodeURIComponent(task)+'-'+i;
     r.assignmentTenant=tenant;r.assignmentTask=String(task);r.assignmentOrigin='legacy';
    }
    if(!/^AIROW-[A-Za-z0-9%_.~-]+$/.test(r.assignmentId)||r.assignmentTenant!==tenant||r.assignmentTask!==String(task)||seen.has(r.assignmentId))throw Error('名单身份冲突，请保留原数据核对');
    seen.add(r.assignmentId);
   });
  });return assigned;
 }
 function locate(assigned,tenant,task,id){
  const rows=assigned?.[String(task)];if(!Array.isArray(rows)||typeof id!=='string'||!id.startsWith('AIROW-'))return null;
  const matches=rows.filter(r=>r.assignmentId===id);
  if(matches.length!==1)return null;const r=matches[0];
  return r.assignmentTenant===tenant&&r.assignmentTask===String(task)&&!r.removedAt?r:null;
 }
 window.DAIAssignmentIdentity={normalize,locate};
})();
