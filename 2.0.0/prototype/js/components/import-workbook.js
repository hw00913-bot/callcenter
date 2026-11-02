/* Offline OOXML/CSV I/O. JSZip 3.10.1 and SAX 1.6.1 are bundled with their licenses. */
(function(root){
  'use strict';
  const MAX_BYTES=1048576,MAX_ROWS=2000,MAX_COLS=100;
  const xmlEscape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  function csvCell(v){const s=String(v??'');return /[,"\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
  const toCsv=rows=>rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
  function parseCsv(input){
    const s=String(input??'').replace(/^\uFEFF/,''),rows=[];let row=[],cell='',quoted=false,closed=false;
    for(let i=0;i<s.length;i++){
      const c=s[i];
      if(quoted){if(c==='"'){if(s[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;continue;}
      if(c==='"'){if(cell.trim()||closed)throw Error('第'+(rows.length+1)+'行第'+(row.length+1)+'列：引号位置不正确');cell='';quoted=true;}
      else if(c===','||c==='\n'){row.push(cell);cell='';closed=false;if(c==='\n'){rows.push(row);row=[];}}
      else if(c!=='\r'){if(closed&&c.trim())throw Error('第'+(rows.length+1)+'行第'+(row.length+1)+'列：引号后有多余字符');cell+=c;}
    }
    if(quoted)throw Error('第'+(rows.length+1)+'行第'+(row.length+1)+'列：引号未闭合');row.push(cell);
    if(row.some(v=>v.length)||!rows.length)rows.push(row);
    while(rows.length&&!rows.at(-1).some(v=>String(v).trim()))rows.pop();
    return rows;
  }
  function xml(input){
    if(input.length>12000000)throw Error('工作簿内容过大，请仅保留本次名单');
    const parser=root.sax.parser(true,{xmlns:true}),stack=[];let top=null,nodes=0;
    parser.ondoctype=()=>{throw Error('不支持含DOCTYPE的工作簿');};
    parser.onopentag=n=>{if(++nodes>150000)throw Error('工作簿内容过多');const node={name:n.local,attrs:{},children:[],content:[]};for(const a of Object.values(n.attributes)){node.attrs[a.name]=a.value;if(a.local==='id'&&a.uri==='http://schemas.openxmlformats.org/officeDocument/2006/relationships')node.attrs['r:id']=a.value;}if(stack.length){stack.at(-1).children.push(node);stack.at(-1).content.push(node);}else top=node;stack.push(node);};
    parser.ontext=parser.oncdata=t=>{if(stack.length)stack.at(-1).content.push(t);};parser.onclosetag=()=>stack.pop();
    parser.onerror=()=>{throw Error('Excel XML内容损坏，无法读取');};parser.write(input).close();return top;
  }
  const kids=(node,name)=>(node?.children||[]).filter(n=>n.name===name),one=(n,name)=>kids(n,name)[0];
  const text=n=>(n?.content||[]).map(x=>typeof x==='string'?x:text(x)).join('');
  const descendants=(n,name)=>[...(n?.name===name?[n]:[]),...(n?.children||[]).flatMap(c=>descendants(c,name))];
  function zipBudget(bytes){
    const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
    for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(v.getUint32(i,true)===0x06054b50){end=i;break;}
    if(end<0)throw Error('不是有效的.xlsx工作簿，请勿只修改文件后缀');
    const count=v.getUint16(end+10,true),start=v.getUint32(end+16,true);let at=start,total=0;
    if(count===65535||start===0xffffffff||count>3000)throw Error('工作簿结构过大，请另存简化的.xlsx');
    for(let i=0;i<count;i++){
      if(at+46>bytes.length||v.getUint32(at,true)!==0x02014b50)throw Error('Excel压缩目录损坏');
      if(v.getUint16(at+8,true)&1)throw Error('不支持加密的Excel，请另存未加密.xlsx');
      total+=v.getUint32(at+24,true);if(total>24000000)throw Error('工作簿解压内容过大，请仅保留本次名单');
      at+=46+v.getUint16(at+28,true)+v.getUint16(at+30,true)+v.getUint16(at+32,true);
    }
  }
  function resolve(base,target){const parts=(target.startsWith('/')?target.slice(1):base+'/'+target).split('/'),out=[];for(const p of parts){if(p==='..'){if(!out.length)throw Error('Excel关系路径损坏');out.pop();}else if(p&&p!=='.')out.push(p);}return out.join('/');}
  function column(ref){const m=/^([A-Z]+)([1-9]\d*)$/.exec(ref||'');if(!m)throw Error('Excel单元格坐标损坏');let c=0;for(const x of m[1])c=c*26+x.charCodeAt(0)-64;return {c:c-1,r:Number(m[2])-1};}
  function dateValue(value,date1904,format){const n=Number(value);if(!Number.isFinite(n))throw Error('无效Excel日期');const d=new Date((date1904?Date.UTC(1904,0,1):Date.UTC(1899,11,30))+n*86400000);if(!Number.isFinite(d.getTime()))throw Error('无效Excel日期');return /[hs]/i.test(format)?d.toISOString().slice(0,19).replace('T',' '):d.toISOString().slice(0,10);}
  async function readXlsx(bytes){
    if(!root.JSZip||!root.sax)throw Error('本地Excel解析组件未就绪');zipBudget(bytes);
    let zip;try{zip=await root.JSZip.loadAsync(bytes,{checkCRC32:true});}catch(e){throw Error('Excel文件损坏或不是.xlsx格式');}
    const read=async path=>{const f=zip.file(path);if(!f)throw Error('Excel缺少必要部件：'+path);return xml(await f.async('string'));};
    if(!zip.file('[Content_Types].xml'))throw Error('不是有效的.xlsx工作簿');
    const workbook=await read('xl/workbook.xml'),rels=kids(await read('xl/_rels/workbook.xml.rels'),'Relationship');
    const relationship=id=>rels.find(r=>r.attrs.Id===id),sheets=kids(one(workbook,'sheets'),'sheet').filter(s=>s.attrs.state!=='hidden'&&s.attrs.state!=='veryHidden');
    const candidates=sheets.filter(s=>!['字段说明','填写说明'].includes(s.attrs.name));const sheet=candidates.find(s=>s.attrs.name==='导入名单')||(candidates.length===1?candidates[0]:null);
    if(!sheet)throw Error('请仅保留一个名单工作表，或将要导入的工作表命名为“导入名单”');
    const sr=relationship(sheet.attrs['r:id']);if(!sr||sr.attrs.TargetMode==='External')throw Error('Excel工作表关系损坏');
    const lookup=async(type,fallback)=>{const r=rels.find(x=>x.attrs.Type?.endsWith('/'+type));const path=r?resolve('xl',r.attrs.Target):fallback;return zip.file(path)?read(path):null;};
    const shared=await lookup('sharedStrings','xl/sharedStrings.xml'),strings=kids(shared,'si').map(n=>descendants(n,'t').map(text).join(''));
    const styles=await lookup('styles','xl/styles.xml'),formats=new Map(kids(one(styles,'numFmts'),'numFmt').map(n=>[Number(n.attrs.numFmtId),n.attrs.formatCode]));
    const styleIds=kids(one(styles,'cellXfs'),'xf').map(n=>Number(n.attrs.numFmtId)),date1904=['1','true'].includes(one(workbook,'workbookPr')?.attrs.date1904);
    const rows=[],data=one(await read(resolve('xl',sr.attrs.Target)),'sheetData');
    for(const row of kids(data,'row'))for(const c of kids(row,'c')){
      const pos=column(c.attrs.r);if(pos.r>MAX_ROWS||pos.c>=MAX_COLS)throw Error('Excel最多2000条数据、100列，请删除多余数据后重试');
      if(one(c,'f'))throw Error('第'+(pos.r+1)+'行第'+(pos.c+1)+'列：请将公式转为文本或值后导入');
      let value=text(one(c,'v')),type=c.attrs.t,formatId=styleIds[Number(c.attrs.s||0)]||0,format=formats.get(formatId)||'';
      if(type==='s'){if(!/^\d+$/.test(value)||strings[Number(value)]===undefined)throw Error('Excel共享文本索引损坏');value=strings[Number(value)];}
      else if(type==='inlineStr')value=descendants(one(c,'is'),'t').map(text).join('');
      else if(type==='b'){if(!['0','1'].includes(value))throw Error('第'+(pos.r+1)+'行第'+(pos.c+1)+'列：无效布尔值');value=value==='1'?'TRUE':'FALSE';}
      else if(type==='e')throw Error('第'+(pos.r+1)+'行第'+(pos.c+1)+'列：Excel错误值'+value);
      else if(value&&(!type||type==='n')){
        if(!Number.isFinite(Number(value)))throw Error('第'+(pos.r+1)+'行第'+(pos.c+1)+'列：无效数值');
        if((formatId>=14&&formatId<=22)||(formatId>=45&&formatId<=47)||/[ydh]/i.test(format.replace(/"[^"]*"|\[[^\]]*\]/g,'')))value=dateValue(value,date1904,format||'yyyy-mm-dd');
        else if(Number.isInteger(Number(value))&&!Number.isSafeInteger(Number(value)))throw Error('第'+(pos.r+1)+'行第'+(pos.c+1)+'列：长编码请设置为文本，避免精度丢失');
        else if(/^0{2,}$/.test(format)&&/^\d+$/.test(value))value=value.padStart(format.length,'0');
        else value=String(Number(value));
      }
      while(rows.length<=pos.r)rows.push([]);rows[pos.r][pos.c]=value;
    }
    return rows.map(row=>Array.from({length:row.length},(_,i)=>String(row[i]??'')));
  }
  async function readFile(file){
    if(!file||!Number.isFinite(file.size)||file.size>MAX_BYTES)throw Error('文件不能超过1 MB');
    const ext=String(file.name||'').toLowerCase().split('.').pop();
    if(ext==='xls')throw Error('暂不支持旧版.xls，请另存为.xlsx或UTF-8 CSV');
    if(!['csv','xlsx'].includes(ext))throw Error('请选择.xlsx或UTF-8 CSV文件');
    const bytes=new Uint8Array(await file.arrayBuffer());if(bytes.length>MAX_BYTES)throw Error('文件不能超过1 MB');
    let rows;if(ext==='csv'){let s;try{s=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch(_){throw Error('CSV请另存为UTF-8编码');}rows=parseCsv(s);}else rows=await readXlsx(bytes);
    if(rows.length>MAX_ROWS+1)throw Error('每次导入最多2000条客户');if(rows.some(r=>r.length>MAX_COLS))throw Error('名单列数过多');
    return {rows,text:toCsv(rows),format:ext,fileName:file.name};
  }
  function headerKey(title,schema){const matches=schema.filter(c=>c.label===title||c.key===title||c.businessKey===title||(c.aliases||[]).includes(title));return matches.length===1?matches[0].key:'';}
  function validDate(value){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(value);if(!m)return false;const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));return d.getUTCFullYear()===+m[1]&&d.getUTCMonth()===+m[2]-1&&d.getUTCDate()===+m[3];}
  function inspect(table,schema,{duplicatePhone='warn',codeKey='leadCode'}={}){
    if(!schema.length)throw Error('请先选择业务分类');if(!table.length||!table[0]?.some(v=>String(v).trim()))throw Error('第1行：表头为空，请使用当前分类模板');
    const header=table[0].map(v=>String(v).trim()),keys=header.map(v=>headerKey(v,schema)),seenKeys=new Set();
    for(let i=0;i<header.length;i++){if(!keys[i])throw Error('第1行第'+(i+1)+'列：未识别表头“'+header[i]+'”');if(seenKeys.has(keys[i]))throw Error('第1行第'+(i+1)+'列：字段“'+header[i]+'”重复');seenKeys.add(keys[i]);}
    for(const c of schema)if(c.required&&!seenKeys.has(c.key))throw Error('第1行：缺少必填列“'+c.label+'”');
    const entries=table.slice(1).map((cells,i)=>({cells,line:cells._sourceLine||i+2})).filter(x=>x.cells.some(v=>String(v).trim()));if(!entries.length||entries.length>MAX_ROWS)throw Error('请填写1至2000条客户，空模板不能提交');
    const seenPhone=new Map(),seenCode=new Map();const rows=entries.map(({cells,line})=>{
      const row={_line:line,_schemaErrors:[],_schemaWarnings:[]};if(cells.length>keys.length)row._schemaErrors.push('第'+line+'行第'+(keys.length+1)+'列：超出表头列数');
      keys.forEach((k,i)=>{const c=schema.find(s=>s.key===k),v=String(cells[i]??'');row[k]=v;let reason='';
        if(c.required&&!v.trim())reason='必填';else if(v.trim()){
          if(c.maxLength&&v.length>c.maxLength)reason='最多'+c.maxLength+'字';
          else if(c.type==='number'&&!Number.isFinite(Number(v)))reason='须为有效数字';
          else if(c.type==='phone'&&!/^(1[3-9]\d{9}|0\d{9,11})$/.test(v.replace(/[\s-]/g,'')))reason='手机号或带区号固定电话格式错误';
          else if(c.type==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!validDate(v)))reason='格式须为有效YYYY-MM-DD日期';
          else if(c.type==='datetime'&&(!/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(v)||!validDate(v)||Number.isNaN(Date.parse(v))))reason='格式须为有效YYYY-MM-DD HH:mm或ISO时间';
          else if(c.options?.length){const parts=c.type==='multiselect'?v.split('|').map(x=>x.trim()).filter(Boolean):[v];if(parts.some(part=>!c.options.some(o=>o?.enabled!==false&&(String(o.id??o)===part||String(o.label??o)===part||o.businessKey&&String(o.businessKey)===part))))reason='不在当前字段可选值中';else if(new Set(parts).size!==parts.length)reason='选项重复';}
        }if(reason)row._schemaErrors.push('第'+line+'行第'+(i+1)+'列“'+c.label+'”：'+reason);
      });
      const phone=String(row.phone||'').replace(/[\s-]/g,'');if(phone&&seenPhone.has(phone)){const msg='第'+line+'行“客户号码”：与第'+seenPhone.get(phone)+'行号码重复，不按手机号合并；请核对独立业务编码';(duplicatePhone==='error'?row._schemaErrors:row._schemaWarnings).push(msg);}else if(phone)seenPhone.set(phone,line);
      const code=row[codeKey];if(code&&seenCode.has(code))row._schemaErrors.push('第'+line+'行“业务编码”：与第'+seenCode.get(code)+'行重复');else if(code)seenCode.set(code,line);return row;
    });return {rows,keys};
  }
  function describe(c){return c.description||({phone:'手机号或带区号固定电话；建议文本格式',number:'有效数字',date:'YYYY-MM-DD',datetime:'北京时间YYYY-MM-DD HH:mm或含时区的ISO时间',multiselect:'填写选项名称或编码，多个选项用 | 分隔',select:'填写选项名称或编码',text:'按文本填写，编码保留前导零'}[c.type]||'按当前字段规则填写')+(c.maxLength?'，最多'+c.maxLength+'字':'');}
  function worksheet(rows){return '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+rows.map((r,i)=>'<row r="'+(i+1)+'">'+r.map((v,j)=>{let n=j+1,col='';while(n){n--;col=String.fromCharCode(65+n%26)+col;n=Math.floor(n/26);}return '<c r="'+col+(i+1)+'" s="1" t="inlineStr"><is><t xml:space="preserve">'+xmlEscape(v)+'</t></is></c>';}).join('')+'</row>').join('')+'</sheetData></worksheet>';}
  async function template(schema,label,format='xlsx',prefix='预外呼导入模板'){
    if(!['csv','xlsx'].includes(format))throw Error('模板仅支持.xlsx或CSV，旧版.xls请另存');
    if(new Set(schema.map(c=>c.key)).size!==schema.length||new Set(schema.map(c=>c.label)).size!==schema.length||schema.some(c=>headerKey(c.label,schema)!==c.key))throw Error('当前分类的导入列名重复或与已有字段冲突，请先核对分类配置');
    if(!schema.length)throw Error('请先选择业务分类再下载模板');const fileName=prefix+'_'+String(label||'当前分类').replace(/[\\/:*?"<>|]/g,'_')+'.'+format;
    if(format==='csv')return {fileName,bytes:new TextEncoder().encode('\uFEFF'+toCsv([schema.map(c=>c.label)])),mime:'text/csv;charset=utf-8'};
    const zip=new root.JSZip();zip.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>');
    zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    zip.file('xl/workbook.xml','<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="导入名单" sheetId="1" r:id="rId1"/><sheet name="字段说明" sheetId="2" r:id="rId2"/></sheets></workbook>');
    zip.file('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
    zip.file('xl/styles.xml','<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>');
    zip.file('xl/worksheets/sheet1.xml',worksheet([schema.map(c=>c.label)]));zip.file('xl/worksheets/sheet2.xml',worksheet([['列名','必填','格式说明'],...schema.map(c=>[c.label,c.required?'必填':'选填',describe(c)]),['操作说明','','仅在导入名单填写数据，先检查再确认；.xls请另存为.xlsx或CSV']]));
    return {fileName,bytes:await zip.generateAsync({type:'uint8array',compression:'DEFLATE'}),mime:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
  }
  function save(f){const url=URL.createObjectURL(new Blob([f.bytes],{type:f.mime})),a=document.createElement('a');a.href=url;a.download=f.fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);return f.fileName;}
  async function download(schema,label,format){return save(await template(schema,label,format));}
  root.DImportFiles={MAX_BYTES,MAX_ROWS,parseCsv,toCsv,readFile,readXlsx,inspect,headerKey,describe,template,save,download};
})(typeof window==='undefined'?globalThis:window);
