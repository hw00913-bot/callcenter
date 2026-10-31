"""Category opt-in for direct follow-up, independent of business family/routes.

Only the shared category definition/editor is extended. The existing ledger and
workspace implement the two handling modes, without parallel data stores.
"""


def one(code, before, after):
    if code.count(before) != 1:
        raise ValueError('Direct follow-up category source conflict: '+before[:140])
    return code.replace(before, after, 1)


def transform(kind, path, code):
    if kind != 'cloud':
        return code
    if path == 'js/components/customer-business.js':
        code = one(code, '  function normalize(input) {', """  function normalize(input) {
    if(input.allowDirectFollowup!==undefined&&typeof input.allowDirectFollowup!=='boolean')return fail('是否允许直接跟进须明确为开或关');""")
        marker='      row.businessFamily=desiredFamily;'
        code = one(code, marker, marker+"\n      row.allowDirectFollowup=input.allowDirectFollowup===undefined?priorCategory?.allowDirectFollowup===true:input.allowDirectFollowup;")
        marker='  function categoryConfigurationIssue(category, definitions, ignoreBindingCompatibility = false) {'
        code = one(code, marker, marker+"\n    if(category.allowDirectFollowup!==undefined&&typeof category.allowDirectFollowup!=='boolean')return '分类直接跟进配置无效，请重新确认';")
    if path == 'js/pages/business-categories.js':
        marker='${fieldTabs()}<div class="business-fields-heading">'
        code = one(code, marker, """<div class="business-category-basics"><label class="field"><span>办理方式</span><span class="checkbox-label"><input id="business-category-allow-direct" type="checkbox" style="width:16px;min-height:16px;vertical-align:middle;margin-right:6px" ${value.allowDirectFollowup===true?'checked':''} ${editor.scope.legacy?'disabled':''} onchange="BusinessConfiguration.setBasic('allowDirectFollowup',this.checked)"> 允许直接跟进（不使用流转模板）</span><small>${editor.scope.legacy?'此专业目录沿原办理方式，不扩展新业务导入。':'开启后，导入可选择直接跟进或按模板流转；未开启则必须使用分类路由。直接跟进仍校验导入必填、唯一性及外呼资格，基础保存不改变路由绑定。'}</small></label></div>"""+marker)
        code = one(code, "category:['label','codeLabel','businessFamily']", "category:['label','codeLabel','businessFamily','allowDirectFollowup']")
        marker='    if(!allowed[editor.kind].includes(key)) return;'
        code = one(code, marker, marker+"\n    if(editor.kind==='category'&&key==='allowDirectFollowup'&&(editor.scope.legacy||typeof value!=='boolean'))return;")
        code = one(code, "['id','label','codeLabel','prefix','enabled','fields','importFields','businessFamily']", "['id','label','codeLabel','prefix','enabled','fields','importFields','businessFamily','allowDirectFollowup']")
        marker="    if(kind==='category') common.push(\n"
        code = one(code, marker, marker+"      {key:'allowDirectFollowup',label:'直接跟进',render:(_,row)=>row.allowDirectFollowup===true?'允许选择':'未开启'},\n")
        # Existing categories remain strict until a manager explicitly opts in.
        code = one(code, 'enabled:true,fields:[],importFields:[]};', 'enabled:true,fields:[],importFields:[],allowDirectFollowup:false};')
    return code
