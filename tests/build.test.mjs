import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';
test('the deploy includes every offline asset, install icon and script',async()=>{
  const sw=await readFile('dist/sw.js','utf8');
  const assets=JSON.parse(sw.match(/const ASSETS=(\[[^;]+\]);/)[1]);
  for(const asset of assets)if(asset!=='./')assert.ok((await stat(`dist/${asset.slice(2)}`)).isFile(),asset);
  const manifest=JSON.parse(await readFile('dist/manifest.webmanifest','utf8'));
  assert.equal(manifest.display,'standalone');assert.equal(manifest.dir,'rtl');assert.equal(manifest.lang,'he');
  for(const icon of manifest.icons)assert.ok((await stat(`dist/${icon.src.slice(2)}`)).size>100);
  const html=await readFile('dist/index.html','utf8');assert.ok(html.includes('apple-touch-icon'));assert.ok(html.includes('dir="rtl"'));
});
test('offline audio supports byte ranges requested by tablet browsers',async()=>{
  const listeners={};let pending;
  vm.runInNewContext(await readFile('dist/sw.js','utf8'),{
    self:{location:{origin:'https://garden.test'},addEventListener:(type,handler)=>listeners[type]=handler},
    caches:{open:async()=>({match:async()=>new Response(Uint8Array.from([10,11,12,13,14]),{headers:{'Content-Type':'audio/mpeg'}})})},
    Response,Headers,URL,fetch:()=>{throw new Error('offline');}
  });
  listeners.fetch({request:{method:'GET',url:'https://garden.test/audio/test.mp3',headers:new Headers({range:'bytes=1-3'})},respondWith:p=>pending=p});
  const response=await pending;assert.equal(response.status,206);assert.equal(response.headers.get('content-range'),'bytes 1-3/5');assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[11,12,13]);
  listeners.fetch({request:{method:'GET',url:'https://garden.test/audio/test.mp3',headers:new Headers({range:'bytes=9-'})},respondWith:p=>pending=p});
  assert.equal((await pending).status,416);
});
