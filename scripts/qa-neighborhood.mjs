// Local, isolated browser QA. Never uses the parent's browser profile or saved progress.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {BANK,GAMES} from '../src/neighborhood/content.js';
import assert from 'node:assert/strict';
const base=process.env.QA_URL||'http://localhost:4178';
const output='docs/screenshots/neighborhood';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],failures=[];const report=[];
try{
 for(const [label,width,height]of [['landscape',1280,800],['portrait',800,1280],['small-tablet',1024,768],['phone',390,844]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:1,serviceWorkers:'block'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(label+': '+e.message));
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/sw.js'))failures.push(r.status()+' '+r.url());});
  await page.goto(base);await page.locator('.start-button').waitFor();await page.screenshot({path:output+'/'+label+'-welcome.png'});
  await page.locator('[data-action="enter"]').click();await page.locator('.neighbor').first().waitFor();
  assert.equal(await page.locator('.neighbor').count(),6);await page.screenshot({path:output+'/'+label+'-map.png'});
  for(const game of GAMES){
   await page.locator('[data-game="'+game.id+'"]').click();await page.locator('.answers').waitFor();
   await page.screenshot({path:output+'/'+label+'-'+game.id+'.png'});
   const bounds=await page.locator('.answer').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};}));
   assert.ok(bounds.every(r=>r.width>=44&&r.height>=44&&r.x>=0&&r.y>=0&&r.right<=width+1&&r.bottom<=height+1),label+' '+game.id+' answer bounds '+JSON.stringify(bounds));
   const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('alma-neighborhood-v2')));
   const q=BANK[game.id].find(q=>q.id===before.active.id);assert.ok(q);
   // A wrong answer followed by a correct one counts once and as helped.
   const wrong=page.locator('.answer').filter({hasNotText:q.target});
   const choices=await page.locator('.answer').evaluateAll(els=>els.map(el=>el.getAttribute('aria-label')));
   const wrongIndex=choices.findIndex(s=>s!==q.target);await page.locator('.answer').nth(wrongIndex).click();
   await page.locator('.answer').nth(choices.indexOf(q.target)).click();await page.locator('.next-button').waitFor();
   const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('alma-neighborhood-v2')));
   assert.equal(after.stats[game.id].correct,1);assert.equal(after.stats[game.id].helped,1);assert.equal(after.stats[game.id].independent,0);
   await page.locator('[data-action="next"]').click();await page.locator('.answer:not(:disabled)').first().waitFor();
   const active=await page.evaluate(()=>JSON.parse(localStorage.getItem('alma-neighborhood-v2')).active);
   await page.reload();await page.locator('.answers').waitFor();
   const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('alma-neighborhood-v2')).active);assert.equal(restored.id,active.id);assert.equal(restored.round,1);
   await page.locator('[data-action="home"]').click();await page.locator('.neighbor').first().waitFor();
  }
  await page.locator('[data-action="parents"]').click();await page.locator('#gate-answer').fill('12');await page.locator('[data-action="unlock-parents"]').click();
  await page.locator('#page-range').fill('24');await page.locator('[data-action="save-parents"]').click();
  assert.equal(await page.locator('.neighbor[aria-disabled="true"]').count(),2);
  report.push({label,width,height,games:6,answersInsideViewport:true,helpedProgress:true,resume:true,pageGates:true});await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
 await writeFile(output+'/qa-report.json',JSON.stringify({report,errors,failures},null,2));console.log(JSON.stringify({report,errors,failures},null,2));
}finally{await browser.close();}
