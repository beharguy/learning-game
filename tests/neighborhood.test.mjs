import test from 'node:test';
import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {BANK,GAMES,allAudioTexts} from '../src/neighborhood/content.js';
import {freshState,cleanState,available,nextQuestion,materialize,recordSuccess,instruction,helpSpeech} from '../src/neighborhood/engine.js';
import {audioKey} from '../src/narration.js';
let seed=321;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
test('all six games have substantial banks, unique tasks and exactly one correct choice',()=>{
 const ids=new Set();
 for(const game of GAMES){
  assert.ok(BANK[game.id].length>=100,game.id);
  for(const q of BANK[game.id]){
   assert.ok(!ids.has(q.id));ids.add(q.id);
   assert.ok(q.page>=game.start&&q.page<=79,q.id+' page');assert.ok(q.prompt);
   for(let i=0;i<5;i++){
    const r=materialize(q,rand);assert.ok(r.choices.length>=2&&r.choices.length<=3,q.id+' choices');
    assert.equal(r.choices.filter(o=>o.text===q.target).length,1,q.id);
    const texts=r.choices.map(o=>o.text.normalize('NFC'));assert.equal(new Set(texts).size,texts.length,q.id);
   }
   if(q.type==='complete'){assert.equal(q.parts.join('').normalize('NFC'),q.word.normalize('NFC'));const sound=t=>t.normalize('NFD').replace(/[\u05b2\u05b7\u05b8]/g,'a');assert.ok(q.foils.every(p=>sound(p)!==sound(q.target)),q.id+' ambiguous vowel foil');}
  }
 }
});
test('every page limit excludes later material from the selected questions and stamps',()=>{
 for(let page=4;page<=79;page++)for(const game of GAMES){
  const s=freshState({page});s.level='all';
  for(let i=0;i<15;i++){const q=nextQuestion(s,game.id,rand);if(q){assert.ok(q.page<=page);if(page<64&&q.type==='stamp')assert.ok(!q.choices.some(o=>o.text.includes('\u05b0')));}}
 }
});
test('random bag exhausts eligible tasks before repeating and survives reload',()=>{
 for(const game of GAMES){
  let s=freshState();s.level='all';const pool=available(game.id,79),seen=new Set();
  for(let i=0;i<pool.length;i++){
   const q=nextQuestion(s,game.id,rand);assert.ok(!seen.has(q.id),q.id);seen.add(q.id);
   s=cleanState(JSON.parse(JSON.stringify(s)));
  }
  assert.equal(seen.size,pool.length);const last=s.seen[game.id].at(-1);assert.notEqual(nextQuestion(s,game.id,rand).id,last);
 }
});
test('question and option orders vary, help does not masquerade as independent learning',()=>{
 const q=BANK.kitchen[0],positions=new Set();for(let i=0;i<40;i++)positions.add(materialize(q,rand).choices.findIndex(o=>o.text===q.target));assert.ok(positions.size>1);
 const s=freshState();recordSuccess(s,'kitchen',true);recordSuccess(s,'kitchen',false);
 assert.deepEqual(s.stats.kitchen,{correct:2,helped:1,independent:1,rounds:0});
 assert.ok(nextQuestion(s,'kitchen',rand).level===1);
 s.stats.kitchen.independent=30;assert.ok(Array.from({length:70},()=>nextQuestion(s,'kitchen',rand)).some(q=>q.level===3));
});
test('narration supports nonreaders without automatically revealing decoding targets',()=>{
 for(const [game,qs]of Object.entries(BANK))for(const source of qs){
  const q=materialize(source,rand),spoken=instruction(q);assert.ok(spoken[0]);
  if(['boat','theater','library'].includes(game)){
   if(q.story)assert.ok(!spoken.includes(q.story));
   if(q.label)assert.ok(!spoken.includes(q.label));
   assert.ok(helpSpeech(q).length>=2);
  }
  if(q.auditory)assert.ok(spoken.includes(q.cue));
 }
});
test('malformed progress and stale pending tasks cannot break navigation or page gates',()=>{
 const s=cleanState({version:2,page:4,stats:{garden:{correct:-100,independent:'bad'}},seen:{garden:['bad-id']},active:{game:'library',id:BANK.library.at(-1).id},lastGame:'unknown'});
 assert.equal(s.active,null);assert.equal(s.lastGame,null);assert.equal(s.stats.garden.correct,0);assert.deepEqual(s.seen.garden,[]);
 assert.deepEqual(cleanState(null,{page:24,sound:false}).page,24);
});
test('every new spoken instruction has a packaged audio file',async()=>{
 for(const text of allAudioTexts())assert.ok((await stat('public/audio/'+audioKey(text)+'.mp3')).size>1000,text);
});
