/* Use the existing Cloud journal format to free space without removing any records. */
(() => {
  'use strict';

  // Both the native Cloud reader and the shell reference inspector support this exact set.
  const journals = [
    'customer-task-batches-v1',
    'local-task-result-journal-v1',
    'customer-directory-v1',
    'customer-followup-v111-current',
    'native-workbench-records-v1',
    'native-workbench-session-v1'
  ];
  const packedPrefix = '\u001ealicti-json-dict-v2:';
  const quotedStrings = /"(?:[^"\\]|\\.)*"/g;
  const marker = index => '\u0001'+index.toString(36)+';';
  const isPacked = raw => typeof raw==='string' && raw.startsWith(packedPrefix);

  function unpack(raw) {
    if (!isPacked(raw)) return raw;
    const end = raw.indexOf('\n',packedPrefix.length);
    if (end<0) throw Error('本地资料压缩格式无效。');
    const dictionary = JSON.parse(raw.slice(packedPrefix.length,end));
    if (!Array.isArray(dictionary) || dictionary.some(token=>typeof token!=='string')) throw Error('本地资料字典无效。');
    return raw.slice(end+1).replace(/\u0001([0-9a-z]+);/g,(_,index)=>{
      const token = dictionary[parseInt(index,36)];
      if (token===undefined) throw Error('本地资料字典引用无效。');
      return token;
    });
  }

  function pack(raw) {
    if (!raw || raw.length<256 || raw.startsWith('\u001ealicti-json-dict-')) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data!=='object') return null;

    const counts = new Map();
    for (const [token] of raw.matchAll(quotedStrings)) {
      if (token.length>=8) counts.set(token,(counts.get(token) || 0)+1);
    }
    const candidates = [...counts].filter(([,count])=>count>1)
      .sort(([a,aCount],[b,bCount])=>(b.length-8)*bCount-(a.length-8)*aCount);
    const dictionary = [];
    const indexes = new Map();
    for (const [token,count] of candidates) {
      const literalCost = JSON.stringify(token).length-2;
      const referenceCost = marker(dictionary.length).length;
      if ((literalCost-referenceCost)*count<=literalCost+3) continue;
      indexes.set(token,dictionary.length);
      dictionary.push(token);
    }
    if (!dictionary.length) return null;

    const encoded = raw.replace(quotedStrings,token=>indexes.has(token)?marker(indexes.get(token)):token);
    const packed = packedPrefix+JSON.stringify(dictionary)+'\n'+encoded;
    if (packed.length>=raw.length) return null;
    return unpack(packed)===raw ? packed : null;
  }

  function reclaim() {
    const prefix = window.DSession?.nativeStoragePrefix?.();
    if (!prefix || !prefix.startsWith(window.DSession.prefix+'cloud:')) return 0;
    let released = 0;
    for (const journal of journals) {
      const key = prefix+journal;
      try {
        const raw = window.localStorage.getItem(key);
        const packed = pack(raw);
        if (!packed || window.localStorage.getItem(key)!==raw) continue;
        window.localStorage.setItem(key,packed);
        if (window.localStorage.getItem(key)===packed) released+=raw.length-packed.length;
      } catch (_) {
        // Invalid text and denied writes leave the original bytes in place.
      }
    }
    return released;
  }

  window.DReviewStorageRecovery = Object.freeze({reclaim,pack,unpack,isPacked});

  const nativeAI = window.DNativeModules?.ai;
  if (nativeAI) {
    const original = 'candidate=JSON.stringify({schema:1,revision:revision+1,data});localStorage.setItem(key,candidate);';
    const at = nativeAI.html.indexOf(original);
    if (at>=0 && at===nativeAI.html.lastIndexOf(original)) {
      const retry = `candidate=JSON.stringify({schema:1,revision:revision+1,data});
      try {
        localStorage.setItem(key,candidate);
      } catch(error) {
        if(error.name!=='QuotaExceededError' || !parent.DReviewStorageRecovery?.reclaim()) throw error;
        if(!contextValid() || !parent.DSession.canWrite(parent.DApp.currentPage())) {
          throw Error('当前配置权限已变化，尚未保存的修改保留在本页。');
        }
        if(localStorage.getItem(key)!==existing) {
          throw Error('其他窗口已更新配置，请先核对；本页修改尚未覆盖保存。');
        }
        localStorage.setItem(key,candidate);
      }`;
      nativeAI.html = nativeAI.html.slice(0,at)+retry+nativeAI.html.slice(at+original.length);
    }
  }

  // Opening a new tab can release space for an untouched draft in an older tab.
  reclaim();
})();
