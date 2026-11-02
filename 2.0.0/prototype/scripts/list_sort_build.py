"""Shared list ordering hooks, preserving original arrays and semantic config order."""


def transform(kind, path, code):
    if kind == 'cloud' and path == 'js/components/platform-ui.js':
        start = code.index('  function updatedTimestamp(row, fallback = []) {')
        end = code.index('  function pagination(', start)
        code = code[:start] + '''  function updatedTimestamp(row,fallback=[]){
    return DListOrder.time(row,typeof fallback==='function'?{fallback}:{fallbackKeys:Array.isArray(fallback)?fallback:[fallback]});
  }
  function sortByUpdated(rows,fallback=[]){
    return DListOrder.rows(rows,typeof fallback==='function'?{fallback}:{fallbackKeys:Array.isArray(fallback)?fallback:[fallback]});
  }
\n''' + code[end:]
    return code
