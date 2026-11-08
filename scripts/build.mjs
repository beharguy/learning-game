import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const root=process.cwd(),dist=path.join(root,'dist');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
await cp('index.html',path.join(dist,'index.html'));
await cp('src',path.join(dist,'src'),{recursive:true});
await cp('public',dist,{recursive:true});
async function walk(dir){const entries=await readdir(dir,{withFileTypes:true});const files=[];for(const e of entries){const p=path.join(dir,e.name);if(e.isDirectory())files.push(...await walk(p));else files.push(p);}return files;}
const files=(await walk(dist)).sort();
const hash=createHash('sha256');hash.update(await readFile(new URL(import.meta.url)));for(const file of files)hash.update(await readFile(file));
const version=hash.digest('hex').slice(0,12);
const precache=['./',...files.filter(f=>!['_headers'].includes(path.basename(f))).map(f=>'./'+path.relative(dist,f).split(path.sep).join('/'))];
const worker=`// Generated from every shipped asset. No user data leaves this device.
const CACHE='hebrew-garden-${version}';
const ASSETS=${JSON.stringify(precache)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hebrew-garden-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  if(new URL(event.request.url).pathname.endsWith('/sw.js'))return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const response=await cache.match(event.request.mode==='navigate'?'./index.html':event.request,{ignoreSearch:true});
    if(response && event.request.headers.has('range')) {
      const range=event.request.headers.get('range').match(/^bytes=(\\d*)-(\\d*)$/);
      if(range && (range[1]||range[2])) {
        const data=await response.arrayBuffer(),total=data.byteLength;
        const start=range[1]?Number(range[1]):Math.max(0,total-Number(range[2]));
        const end=range[1]&&range[2]?Math.min(Number(range[2]),total-1):total-1;
        if(start>=total||start>end)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+total}});
        const headers=new Headers(response.headers);headers.set('Content-Range','bytes '+start+'-'+end+'/'+total);headers.set('Content-Length',String(end-start+1));headers.set('Accept-Ranges','bytes');
        return new Response(data.slice(start,end+1),{status:206,headers});
      }
    }
    return response||fetch(event.request);
  }));
});
`;
await writeFile(path.join(dist,'sw.js'),worker);
console.log(`Built ${files.length+1} files. Offline cache: ${version}. Deploy the dist/ folder.`);
