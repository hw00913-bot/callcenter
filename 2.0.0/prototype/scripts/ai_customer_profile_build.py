"""Expose the current native AI call reader without copying its provider logic."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PROJECTION = r'''  // Customer profiles reuse original provider status/summary semantics only.
  function dCustomerProfileProjection(item) {
    var detail=resolveDetailContext(item), value=detail && detail.item || item;
    var scopeEvidence={};
    ['tenantId','nativeTenantId','aiTenantId','integrationTenantId','ownerTenantId','sourceTenantId','brandId','enterpriseId'].forEach(function(key){if(Object.prototype.hasOwnProperty.call(value,key))scopeEvidence[key]=value[key];});
    var factSource={};
    ['startTime','endTime','dialedAt','actualDialedAt','duration','durationSeconds','actualDialed','dialed','answered','customerConnected'].forEach(function(key){if(Object.prototype.hasOwnProperty.call(value,key))factSource[key]=value[key];});
    return {
      resultLabel:resolveStatus(value),
      summary:typeof value.summary==='string'?cleanTranscriptText(value.summary):'',
      aiTagName:typeof value.aiTagName==='string'?value.aiTagName:'',
      intention:typeof value.intention==='string'?value.intention:'',
      tags:Array.isArray(value.tags)?value.tags.filter(function(tag){return typeof tag==='string';}):[],
      componentTags:detail && Array.isArray(detail.componentTagNames)?detail.componentTagNames:[],
      scopeEvidence:scopeEvidence,
      factSource:factSource,
      detailIdentity:detail && detail.isDazhong && detail.state==='fetched'?{callid:detail.callid,recordid:detail.recordid,phone:value.phone}:null
    };
  }

'''

EXPORT = r'''    integrationProfileRows:function(){
      return window.DCustomerProfileAI ? window.DCustomerProfileAI.fromNativeRows(rows,dCustomerProfileProjection) : {status:'failed',code:'PROFILE_AI_UNAVAILABLE',message:'AI通话来源尚未就绪',data:{rows:[],issues:[]}};
    },
'''

FOLLOWUP_EXPORT = r'''    integrationProfileFollowups:function(){
      return window.DCustomerProfileAI ? window.DCustomerProfileAI.fromNativeFollowups(allRows) : {status:'failed',code:'PROFILE_AI_UNAVAILABLE',message:'AI回访来源尚未就绪',data:{rows:[],issues:[]}};
    },
    integrationOpenProfileFollowup:function(ref){
      return window.DCustomerProfileAI ? window.DCustomerProfileAI.openFollowupFromNative(allRows,ref) : {status:'failed',code:'PROFILE_AI_UNAVAILABLE',message:'AI回访来源尚未就绪',data:{rows:[],issues:[]}};
    },
'''


def transform(kind, path, code):
    if kind != 'ai' or path not in ['js/pages/result-records.js', 'js/pages/result-clue.js']:
        return code
    if path == 'js/pages/result-clue.js':
        if 'integrationProfileFollowups:function()' in code:
            if FOLLOWUP_EXPORT not in code:
                raise ValueError('AI followup profile reader differs; rebuild before checking')
            return code
        marker = "  window.Pages['result-clue'] = {"
        if code.count(marker) != 1:
            raise ValueError('Native AI result-clue profile reader anchor changed')
        return code.replace(marker, marker + '\n' + FOLLOWUP_EXPORT, 1)
    if '  function dCustomerProfileProjection(item)' in code:
        if PROJECTION not in code or EXPORT not in code:
            raise ValueError('AI customer profile reader differs; rebuild before checking')
        return code
    marker = "  window.Pages = window.Pages || {};\n  window.Pages['result-records'] = {"
    if code.count(marker) != 1:
        raise ValueError('Native AI result-records profile reader anchor changed')
    return code.replace(marker, PROJECTION + marker + '\n' + EXPORT, 1)


def runtime_source():
    return (ROOT / 'js/adapters/ai-customer-profile.js').read_text()
