"""One stable current handoff. No stage-named exports, source mutation or approval."""
from pathlib import Path
import json,sys,subprocess,tempfile,shutil,hashlib
from implementation_tasks import ROOT,WS,OUT,read,render
from check_handoff import CLI,run,package_check,tasks_check,current_reference_identity

def command(args):
    result=subprocess.run([sys.executable,*map(str,args)],cwd=ROOT,capture_output=True,text=True)
    if result.returncode:raise RuntimeError(result.stdout+'\n'+result.stderr)
    return json.loads(result.stdout)

def export():
    check=command([CLI,'validate',WS,'--stage','product'])
    if not check['ready'] or check['semantic_review']!='current':raise RuntimeError('当前产品内容或复核已变化；请先刷新来源、实际复核，再导出。')
    coverage=tasks_check(read(WS/'plan.json'),read(WS/'product-ir.json'))
    if not coverage['passed']:raise RuntimeError(str(coverage['errors']))
    if not current_reference_identity()['passed']:raise RuntimeError('只读源指纹发生变化，请先核查来源。')
    projection=read(ROOT/'续接输入/docs/exception-definitions.json');project=ROOT.parent.parent/'prototype'
    if any(hashlib.sha256((project/f['path']).read_bytes()).hexdigest()!=f['sha256'] for f in projection['files']):raise RuntimeError('原型已变化；请先通过续接流程更新当前规格，不沿用旧复核导出。')
    prior=read(OUT/'manifest.json') if OUT.exists() else None
    if prior:
        if prior['status']!='draft':raise RuntimeError('正式确认快照不可覆盖，请使用正式版本工具。')
        for row in prior['files']:
            file=OUT/row['path']
            if not file.is_file() or hashlib.sha256(file.read_bytes()).hexdigest()!=row['sha256']:raise RuntimeError('当前包存在未回写源的手工修改：'+row['path'])
    stage=Path(tempfile.mkdtemp(prefix='.交接生成-',dir=ROOT.parent));stage.rmdir()
    try:
        command([CLI,'export',WS,'--stage','development','--out',stage,'--draft'])
        fresh=read(stage/'manifest.json');names={r['path'] for r in fresh['files']};OUT.mkdir(exist_ok=True)
        for row in fresh['files']:
            target=OUT/row['path'];target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(stage/row['path'],target)
        for row in prior['files'] if prior else []:
            if row['path'] not in names:(OUT/row['path']).unlink()
        shutil.copyfile(stage/'manifest.json',OUT/'manifest.json')
    finally:
        if stage.exists():shutil.rmtree(stage)
    # Check before/after reader rendering because each layer contributes controlled files.
    run('planning');render(OUT);status=run('planning');render(OUT)
    integrity=package_check(OUT)
    if status or not integrity['passed']:raise RuntimeError('当前资料仍有门禁缺口：'+str(integrity))
    print(json.dumps({'current_package':str(OUT),'workspace':str(ROOT),'status':'draft','integrity':integrity,'engineering_owned_by_developer':True},ensure_ascii=False))

if __name__=='__main__':
    try:
        action=sys.argv[1] if len(sys.argv)>1 else 'check'
        if action=='check':sys.exit(run('planning'))
        if action=='export':export()
        elif action!='check':raise RuntimeError('用法：python3 维护交接.py check|export')
    except Exception as exc:
        print(str(exc),file=sys.stderr);sys.exit(1)
