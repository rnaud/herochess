import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
let server,origin,revision=0;
test.beforeAll(async()=>{
 execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build']);
 server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),path=url.pathname.replace(/^\/herochess\//,'');if(path.includes('..')||!url.pathname.startsWith('/herochess/')){res.writeHead(404).end();return;}let bytes=await readFile(`dist/${path||'index.html'}`);if(path==='sw.js'&&revision)bytes=Buffer.from(bytes.toString().replace("const CACHE='herochess-","const CACHE='herochess-update-"));const type=path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.webmanifest')?'application/manifest+json':path.endsWith('.png')?'image/png':path.endsWith('.jpg')?'image/jpeg':path.endsWith('.svg')?'image/svg+xml':'text/html';res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'}).end(bytes);}catch{res.writeHead(404).end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${server.address().port}/herochess/`;
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve));});
test('Android manifest, offline art and CPU play work at the GitHub Pages subpath; updates wait',async({page,context})=>{
 test.setTimeout(60000);await page.goto(origin);await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 const manifest=await page.evaluate(async()=>await (await fetch('./manifest.webmanifest')).json());expect(manifest.display).toBe('standalone');expect(manifest.scope).toBe('./');expect(manifest.icons.map(i=>i.sizes)).toContain('512x512');
 for(const icon of manifest.icons){const bytes=await readFile('dist/'+icon.src);expect(bytes.readUInt32BE(16)).toBe(Number(icon.sizes.split('x')[0]));}
 await page.locator('#view-2d').click();await page.locator('[data-square="12"]').click();await page.locator('[data-square="28"]').click();await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});const saved=await page.evaluate(()=>localStorage.getItem('herochess-cards-v2'));
 revision=1;await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();await registration.update();});await expect.poll(()=>page.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting)).toBe(true);expect(await page.evaluate(()=>localStorage.getItem('herochess-cards-v2'))).toBe(saved);
 await context.setOffline(true);await page.reload();await expect(page.locator('#move-count')).toHaveText('02');await expect(page.locator('#board-view canvas')).toBeVisible();
 expect(await page.evaluate(async()=>{const cache=await caches.open((await caches.keys()).find(k=>k.startsWith('herochess-')&&!k.startsWith('herochess-update-')));const urls=(await cache.keys()).filter(r=>r.url.includes('/art/realms/'));return (await Promise.all(urls.map(async r=>(await fetch(r.url)).ok))).every(Boolean)&&urls.length>=18;})).toBe(true);
 await page.locator('#new-button').click();await page.getByRole('button',{name:'Deal & play'}).click();await page.locator('#difficulty').selectOption('1');await page.locator('#view-2d').click();await page.locator('[data-square="12"]').click();await page.locator('[data-square="28"]').click();await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});
});
