// Real touch targets and visible artwork, in isolated profiles with no family data.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {GAMES} from '../src/neighborhood/content.js';

const base=process.env.QA_URL||'http://localhost:4178';
const output='docs/screenshots/neighborhood';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],failures=[],report=[];
// Face coordinates in the two source illustrations, independent of button centers.
const faces={
 landscape:{kitchen:[16.7,20],garden:[43.2,17.5],workshop:[78.4,20],boat:[14.4,73],theater:[40,73],library:[79,73]},
 portrait:{kitchen:[24,18],garden:[65.5,18],workshop:[22,48.5],boat:[72,48.5],theater:[16.5,78.5],library:[64,78.5]}
};
async function inspectMap(page,width,height,label){
 const portrait=height>width;
 await page.waitForFunction(p=>{
  const image=document.querySelector('.map-scene .backdrop');
  return image?.complete&&image.naturalWidth>0&&image.currentSrc.endsWith(p?'neighborhood-portrait.webp':'neighborhood.webp');
 },portrait);
 const layout=await page.evaluate(anchors=>{
  const map=document.querySelector('.map-scene'),world=map.querySelector('.world').getBoundingClientRect();
  const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const points={};
  for(const [id,[x,y]]of Object.entries(anchors)){
   const point={x:world.x+world.width*x/100,y:world.y+world.height*y/100};
   points[id]={...point,hit:document.elementFromPoint(point.x,point.y)?.closest('[data-game]')?.dataset.game};
  }
  const targets=[...map.querySelectorAll('.neighbor-name,.neighbor-bubble,.mini-play')].map(el=>{
   const r=rect(el),owner=el.closest('[data-game]').dataset.game;
   const unobstructed=[[.2,.2],[.5,.5],[.8,.8]].every(([x,y])=>document.elementFromPoint(r.x+r.width*x,r.y+r.height*y)?.closest('[data-game]')?.dataset.game===owner);
   return {owner,kind:el.className,...r,unobstructed};
  });
  return {points,targets,visibleHeight:Math.min(world.bottom,map.getBoundingClientRect().bottom)-Math.max(world.top,0),
   repeatedArtwork:getComputedStyle(map).backgroundImage.includes('url(')||getComputedStyle(map,'::before').content!=='none',
   controls:[...document.querySelectorAll('.hud button,.bottom-controls button,.map-footer button')].map(rect)};
 },faces[portrait?'portrait':'landscape']);
 assert.equal(layout.repeatedArtwork,false,label+' repeated background characters');
 assert.ok(layout.visibleHeight/height>.7,label+' map compressed to a small strip');
 const inside=r=>r.x>=-1&&r.y>=-1&&r.right<=width+1&&r.bottom<=height+1;
 for(const target of layout.targets){
  assert.ok(inside(target),label+' clipped station '+JSON.stringify(target));
  assert.ok(target.unobstructed,label+' covered station '+JSON.stringify(target));
  if(target.kind==='neighbor-bubble')assert.ok(target.width>=44&&target.height>=44,label+' small play badge');
 }
 for(const r of layout.controls)assert.ok(inside(r)&&r.width>=44&&r.height>=44,label+' inaccessible control '+JSON.stringify(r));
 for(const [id,point]of Object.entries(layout.points))assert.equal(point.hit,id,label+' tap on the illustrated '+id+' character');
 return layout;
}
try{
 for(const [label,width,height]of [
  ['tablet-portrait',800,1280],['tablet-landscape',1280,800],
  ['android-portrait',800,1232],['android-landscape',1280,752],
  ['ipad-portrait',768,1024],['small-tablet',1024,768],
  ['phone-portrait',390,844],['phone-landscape',844,390]
 ]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/sw.js'))failures.push(r.status()+' '+r.url());});
  await page.goto(base+'/');await page.locator('[data-action="enter"]').tap();await page.waitForURL('**/#map');
  await inspectMap(page,width,height,label);
  await page.evaluate(async()=>{
   await document.fonts.ready;
   const sprite=new Image();sprite.src=new URL('assets/neighborhood/objects.webp',document.baseURI).href;await sprite.decode();
  });
  await page.screenshot({path:output+'/'+label+'-map-fixed.png'});
  for(const game of GAMES){
   // A hash changes before its hashchange handler paints the new screen.
   // Wait for the map, not just its URL, before tapping canvas coordinates.
   const layout=await inspectMap(page,width,height,label+' before '+game.id);
   const point=layout.points[game.id];
   await page.touchscreen.tap(point.x,point.y);
   await page.waitForURL('**/#play/'+game.id);await page.locator('.answers').waitFor();
   await page.locator('[data-action="home"]').tap();
   await page.waitForURL('**/#map');
   // Returning adds a resume button; it must not cover any station.
   await inspectMap(page,width,height,label+' resumed');
   await page.locator(`[data-game="${game.id}"] .neighbor-bubble`).tap();
   await page.waitForURL('**/#play/'+game.id);
   await page.locator('[data-action="home"]').tap();await page.waitForURL('**/#map');
  }
  report.push({label,width,height,charactersAndBadgesTapped:6,allLabelsVisible:true,unobstructed:true});
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:800,height:1280},hasTouch:true,isMobile:true,serviceWorkers:'block',reducedMotion:'reduce'});
 const page=await context.newPage();await page.goto(base+'/');await page.locator('[data-action="enter"]').tap();await page.waitForURL('**/#map');
 await page.locator('[data-game="kitchen"]').tap();await page.locator('.answers').waitFor();
 const saved=await page.evaluate(()=>localStorage.getItem('alma-neighborhood-v2'));
 for(const [width,height]of [[1280,800],[800,1280]]){
  await page.setViewportSize({width,height});
  assert.equal(await page.evaluate(()=>localStorage.getItem('alma-neighborhood-v2')),saved,'rotation changed saved progress');
  assert.equal(new URL(page.url()).hash,'#play/kitchen');
 }
 await page.locator('[data-action="home"]').tap();await page.waitForURL('**/#map');
 for(const [width,height]of [[1280,800],[800,1280]]){
  await page.setViewportSize({width,height});
  await inspectMap(page,width,height,'rotation');
  assert.equal(await page.evaluate(()=>localStorage.getItem('alma-neighborhood-v2')),saved,'map rotation changed progress');
 }
 await context.close();
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
 const result={report,rotationPreservesProgress:true,errors,failures};
 await writeFile(output+'/map-layout-report.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
