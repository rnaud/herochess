import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export function offlineApp(){return {name:'herochess-offline',apply:'build',async closeBundle(){
 async function files(dir){const result=[];for(const entry of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${entry.name}`;result.push(...(entry.isDirectory()?await files(path):[path]));}return result;}
 const skip=p=>p.endsWith('/sw.js')||p.startsWith('dist/fonts/')||p==='dist/art/interface/tabletop.webp'||p==='dist/art/interface/social.jpg'||p.endsWith('-960.webp');
 const paths=(await files('dist')).filter(p=>!skip(p)).sort();
 const hash=createHash('sha256');for(const path of paths)hash.update(await readFile(path));
 const urls=paths.map(p=>'./'+p.slice(5));
 await writeFile('dist/sw.js',`const CACHE='herochess-${hash.digest('hex').slice(0,12)}';
const FILES=${JSON.stringify(urls)};
const ROOT=new URL('./',self.location.href).href;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
// Updates wait until existing game windows close: never reload a match mid-turn.
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('herochess-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||!url.href.startsWith(ROOT))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);const key=event.request.mode==='navigate'?new URL('./index.html',ROOT).href:event.request;const stored=await cache.match(key);if(stored)return stored;const response=await fetch(event.request);if(response.ok&&event.request.method==='GET')cache.put(event.request,response.clone());return response;})());
});
`);
}};}
