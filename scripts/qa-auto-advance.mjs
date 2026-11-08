// Isolated profiles only: never modifies a child's browser data.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {BANK,GAMES,SAY} from '../src/neighborhood/content.js';
import {KEY,freshState} from '../src/neighborhood/engine.js';
import {audioKey} from '../src/narration.js';

const base=process.env.QA_URL||'http://localhost:4178';
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],report=[];
async function setup(game='kitchen',{sound=true,rate=4}={}){
 const context=await browser.newContext({viewport:{width:800,height:1280},hasTouch:true,isMobile:true,serviceWorkers:'block'});
 const seed=freshState();seed.sound=sound;
 seed.tutorials=Object.fromEntries(GAMES.map(g=>[g.id,true]));
 await context.addInitScript(({key,seed,rate})=>{
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(seed));
  window.qaEvents=[];
  const setItem=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){
   setItem.call(this,k,v);
   if(k===key)window.qaEvents.push({type:'save',time:performance.now(),state:JSON.parse(v)});
  };
  document.addEventListener('loadedmetadata',e=>{
   if(e.target instanceof HTMLMediaElement)e.target.playbackRate=rate;
  },true);
  for(const type of ['playing','ended','error'])document.addEventListener(type,e=>{
   if(e.target instanceof HTMLMediaElement)window.qaEvents.push({type,time:performance.now(),src:e.target.currentSrc,solved:!!document.querySelector('.game-scene.solved')});
  },true);
 },{key:KEY,seed,rate});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'#map');
 await page.locator(`[data-game="${game}"]`).click();
 await page.locator('.answer:not(:disabled)').first().waitFor();
 const active=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).active,KEY);
 const q=BANK[game].find(q=>q.id===active.id);
 const correct=()=>page.getByRole('button',{name:q.target,exact:true}).click();
 const waitNext=()=>page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).active?.round===1,KEY);
 return {context,page,q,correct,waitNext};
}
const state=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
const events=page=>page.evaluate(()=>window.qaEvents);
function verifyQueue(log,q,game){
 const solvedAt=log.find(e=>e.type==='save'&&e.state.active===null&&e.state.stats[game.id]?.correct===1).time;
 const completed=log.filter(e=>e.type==='ended'&&e.solved&&e.time>=solvedAt);
 const expected=[SAY.correct,q.word||q.completed||q.explanation,...(game.id==='kitchen'?[]:[game.reward])].filter(Boolean).map(t=>audioKey(t)+'.mp3');
 assert.deepEqual(completed.map(e=>e.src.split('/').at(-1)),expected,game.id+' must complete every feedback clip');
 const advanced=log.find(e=>e.type==='save'&&e.state.active?.round===1);
 assert.ok(advanced.time-completed.at(-1).time>=300,game.id+' must leave a breath after feedback');
 return {game:game.id,feedbackClips:expected.length,pauseMs:Math.round(advanced.time-completed.at(-1).time)};
}
try{
 // Actual MP3 playback and ended events, accelerated only inside this test.
 for(const game of GAMES){
  const {context,page,q,correct,waitNext}=await setup(game.id);
  const wrong=await page.locator('.answer').evaluateAll((els,target)=>els.findIndex(e=>e.getAttribute('aria-label')!==target),q.target);
  await page.locator('.answer').nth(wrong).click();await page.waitForTimeout(1700);
  assert.equal((await state(page)).active.round,0,'wrong answer must not advance');
  await correct();await page.locator('.game-scene.solved').waitFor();
  assert.equal(await page.locator('[data-action="next"]').count(),0);
  assert.equal(await page.locator('.answer:not(:disabled)').count(),0);
  await waitNext();
  report.push(verifyQueue(await events(page),q,game));
  assert.equal((await state(page)).stats[game.id].helped,1);
  await context.close();
 }
 // Repeating while feedback is playing must cancel the old completion callback.
 {
  const {context,page,correct,waitNext}=await setup();await correct();
  await page.waitForFunction(()=>document.querySelector('audio').currentTime>.2);
  await page.locator('[data-action="repeat"]').click();
  await page.waitForFunction(()=>document.querySelector('audio').currentTime>.1);
  await page.evaluate(()=>document.querySelector('audio').pause());
  await page.waitForTimeout(1800);
  assert.equal((await state(page)).active,null,'paused replay must hold the solved question');
  assert.equal(await page.locator('.game-scene.solved').count(),1);
  await page.evaluate(()=>document.querySelector('audio').play());await waitNext();
  await page.waitForTimeout(1800);assert.equal((await state(page)).active.round,1);
  assert.equal((await state(page)).stats.kitchen.correct,1);
  report.push({repeatWaitsForAudio:true,noDuplicateAdvance:true});await context.close();
 }
 // Silent mode and browser autoplay rejection still continue after a visible celebration.
 for(const mode of ['muted','playback-rejected']){
  const {context,page,correct,waitNext}=await setup('kitchen',{sound:mode!=='muted'});
  if(mode==='playback-rejected')await page.evaluate(()=>{
   document.querySelector('audio').play=()=>Promise.reject(new DOMException('Blocked for test','NotAllowedError'));
  });
  await correct();await waitNext();
  const log=await events(page),start=log.find(e=>e.type==='save'&&e.state.active===null&&e.state.stats.kitchen.correct===1);
  const end=log.find(e=>e.type==='save'&&e.state.active?.round===1);
  assert.ok(end.time-start.time>=1450);assert.ok(end.time-start.time<5000);
  report.push({mode,celebrationMs:Math.round(end.time-start.time)});await context.close();
 }
 // Exercise the visibility lifecycle deterministically; do not simulate elapsed audio.
 {
  const {context,page,correct,waitNext}=await setup();await correct();
  await page.evaluate(()=>{
   window.qaHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.qaHidden});
   document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(1800);assert.equal((await state(page)).active,null);
  await page.evaluate(()=>{window.qaHidden=false;document.dispatchEvent(new Event('visibilitychange'));});
  await waitNext();assert.equal((await state(page)).stats.kitchen.correct,1);
  report.push({hiddenPausesAndVisibleResumes:true});await context.close();
 }
 // Leaving during success must not move the newly opened game.
 {
  const {context,page,correct}=await setup();await correct();
  await page.locator('[data-action="home"]').click();await page.locator('[data-game="garden"]').click();
  const before=(await state(page)).active;
  await page.waitForTimeout(4000);assert.deepEqual((await state(page)).active,before);
  assert.equal(new URL(page.url()).hash,'#play/garden');
  report.push({navigationCancelsPendingAdvance:true});await context.close();
 }
 assert.deepEqual(errors,[]);
 const out='docs/screenshots/neighborhood';await mkdir(out,{recursive:true});
 await writeFile(out+'/auto-advance-report.json',JSON.stringify({report,errors},null,2));
 console.log(JSON.stringify({report,errors},null,2));
}finally{await browser.close();}
