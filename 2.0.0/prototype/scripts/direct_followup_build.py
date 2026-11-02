"""Preserve legacy category metadata without exposing an entry-mode switch.

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
    # Step49: import entry determines handling; categories expose no direct switch.
    # Historical category metadata is preserved by the component branch above.
    return code
