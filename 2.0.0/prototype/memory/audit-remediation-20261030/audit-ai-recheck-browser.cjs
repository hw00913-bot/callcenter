async page => {
 const f=page.frameLocator('iframe[data-native-module=ai]');
 const before=await page.evaluate(()=>{const a=document.querySelector('iframe[data-native-module=ai]').contentWindow;return a.DAIConfigStore.reviewCurrent().revision});
 await f.getByRole('button',{name:'手动导入',exact:true}).click();await f.locator('#importModalBackdrop input[type=file]').setInputFiles('/private/tmp/audit-ai-admin-current.csv');await f.getByRole('button',{name:'开始上传',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('iframe[data-native-module=ai]').contentDocument.body.innerText.includes('本次无可提交号码'));
 const blocked=await page.evaluate(()=>{const a=document.querySelector('iframe[data-native-module=ai]').contentWindow;return {revision:a.DAIConfigStore.reviewCurrent().revision,fileKept:a.document.querySelector('#importModalBackdrop').innerText.includes('audit-ai-admin-current.csv'),enabled:!a.document.getElementById('btnStartUpload').disabled,message:a.document.body.innerText.slice(-150)}});
 if(blocked.revision!==before||!blocked.fileKept||!blocked.enabled)throw Error('blocked import changed committed state or lost file');
 await page.screenshot({path:'/private/tmp/audit-ai-repeated-blocked.png'});
 await f.locator('#importModalBackdrop .close-btn').click();await f.getByText('数据概览',{exact:true}).click();
 await f.getByText('⚙ 配置',{exact:true}).click();
 const open=await page.evaluate(()=>{const a=document.querySelector('iframe[data-native-module=ai]').contentWindow;return {intents:a.Pages['scene-list'].integrationIntents(),text:a.document.getElementById('intentConfigBackdrop').innerText}});
 return {before,blocked,open};
}
