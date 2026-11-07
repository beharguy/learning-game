import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { lessons } from '../src/curriculum.js';
import { narrationTexts } from '../src/narration.js';
import { pronunciationText } from '../src/pronunciation.js';
import { recommendedActivity } from '../src/engine.js';
import { newState, cleanState, availableModes, eligibleQuestions, eligibleWords, memoryItems, roundQuestions, buildQuestions, memoryCards, recordRound, blooms, graphemes, questionSpeech, recommendedLesson } from '../src/engine.js';

test('the curriculum covers every workbook page exactly once',()=>{
  for(let p=4;p<=79;p++)assert.equal(lessons.filter(l=>l.start<=p&&l.end>=p).length,1,`page ${p}`);
  assert.equal(new Set(lessons.map(l=>l.id)).size,lessons.length);
});
test('every question has one distinct answer and belongs to its documented pages',()=>{
  for(const l of lessons){
    for(const q of l.questions){assert.ok(q.page>=l.start&&q.page<=l.end,`${l.id} page`);assert.ok(q.answers.includes(q.target));assert.equal(new Set(q.answers.map(a=>a.normalize('NFC'))).size,q.answers.length,`${l.id} duplicate`);if(q.pictureAnswers)assert.equal(q.answers.length,q.pictureAnswers.length);}
    for(const w of l.words){assert.ok(w.page>=l.start&&w.page<=l.end);assert.equal(graphemes(w.text).join(''),w.text.normalize('NFC'));}
  }
});
test('page filtering never leaks later exercises, words, or full unit completion requirements',()=>{
  for(let p=4;p<=79;p++)for(const l of lessons){
    const qs=[...roundQuestions(l,p),...roundQuestions(l,p,Math.random,'vowels')],ws=buildQuestions(l,p);
    assert.ok(qs.length<=10&&qs.every(q=>q.page<=p));assert.ok(ws.length<=5&&ws.every(w=>w.page<=p));
    if(l.start>p){assert.deepEqual(availableModes(l,p),[]);assert.equal(memoryItems(l,p).length,0);}
  }
  const q=lessons.find(l=>l.id==='qof');assert.ok(!availableModes(q,23).includes('build'));assert.ok(availableModes(q,24).includes('build'));
  const final=lessons.at(-1);assert.ok(!eligibleQuestions(final,74).some(q=>q.story));
});
test('audio questions never contrast same-sounding kamatz and patah as different answers',()=>{
  const soundKey=s=>s.normalize('NFD').replace(/[\u05B2\u05B7\u05B8]/g,'a');
  for(const l of lessons)for(const q of l.questions.filter(q=>q.kind==='sound'))assert.equal(new Set(q.answers.map(soundKey)).size,q.answers.length,`${l.id}: ${q.label}`);
});
test('reading chunks preserve all niqqud and introduce only one optional distractor',()=>{
  assert.deepEqual(graphemes('בָּרָק'),['בָּ','רָ','ק'].map(s=>s.normalize('NFC')));
  for(const l of lessons)for(const q of buildQuestions(l,79)){
    assert.equal(q.parts.join(''),q.text.normalize('NFC'),q.text);
    assert.equal(new Set(q.tiles.map(t=>t.id)).size,q.tiles.length);
    assert.equal(q.tiles.filter(t=>t.id<q.parts.length).sort((a,b)=>a.id-b.id).map(t=>t.text).join(''),q.text.normalize('NFC'));
    assert.equal(q.tiles.length,q.parts.length+(q.challenge?1:0));
    if(q.challenge)assert.ok(!q.parts.includes(q.tiles.find(t=>t.id===q.parts.length).text));
  }
  const resh=lessons.find(l=>l.id==='resh');
  assert.ok(availableModes(resh,19).includes('build'));
  assert.deepEqual(resh.words.find(w=>w.text==='תָּמָר').parts,['תָּ','מָר']);
});
test('connections match two different representations and respect every page limit',()=>{
  for(let p=4;p<=79;p++)for(const l of lessons)if(availableModes(l,p).includes('memory')){
    const cards=memoryCards(l,p);assert.ok([4,6].includes(cards.length));assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);
    assert.ok(cards.every(c=>c.page<=p));
    for(const pair of new Set(cards.map(c=>c.pair))){
      const pairCards=cards.filter(c=>c.pair===pair);assert.equal(pairCards.length,2);
      assert.deepEqual(pairCards.map(c=>c.side).sort(),['picture','text']);
      const picture=pairCards.find(c=>c.side==='picture');assert.ok(picture.emoji&&picture.audio);assert.equal(picture.text,undefined);
    }
    const items=memoryItems(l,p);
    assert.equal(new Set(items.map(i=>i.emoji)).size,items.length);
    const key=s=>s.normalize('NFD').replace(/[\u05B2\u05B7\u05B8]/g,'a');
    assert.equal(new Set(items.map(i=>key(i.left))).size,items.length);
  }
});
test('vowel practice applies a rule and discovery advances from sounds to comprehension',()=>{
  for(const l of lessons){
    assert.ok(l.questions.every(q=>q.kind!=='warmup'));
    const vowels=roundQuestions(l,79,()=>.5,'vowels');
    assert.ok(vowels.every(q=>q.mode==='vowels'));
    for(const q of vowels.filter(q=>q.formula))assert.equal(q.formula[0].replace(/[\u0591-\u05C7]/g,''),q.target.replace(/[\u0591-\u05C7]/g,''));
    const discovery=roundQuestions(l,79,()=>.5);
    assert.ok(discovery.every(q=>q.mode!=='vowels'));
    for(let i=1;i<discovery.length;i++)assert.ok((discovery[i].level||1)>=(discovery[i-1].level||1));
    for(const q of l.questions.filter(q=>q.kind==='blend'))assert.equal(q.formula.join('').normalize('NFC'),q.target.normalize('NFC'));
    for(const q of l.questions.filter(q=>q.kind==='sound'))assert.equal(q.hideLabel,true);
  }
  const shva=lessons.find(l=>l.id==='shva');
  assert.ok(!roundQuestions(shva,67,()=>.5,'vowels').some(q=>q.kind==='vowel-word'));
  assert.ok(roundQuestions(shva,68,()=>.5,'vowels').some(q=>q.kind==='vowel-word'));
});
test('replaying keeps earned flowers without inflating unique rewards',()=>{
  let s=newState();s=recordRound(s,'hello','discover');assert.equal(blooms(s),1);s=recordRound(s,'hello','discover');assert.equal(blooms(s),1);assert.equal(s.rounds,2);
  s=recordRound(s,'tav','vowels');assert.equal(blooms(s),2);assert.equal(recommendedLesson(s).id,'tav');
  s.page=4;assert.equal(blooms(cleanState(s)),2);
});
test('a parent-selected workbook page recommends the current topic without requiring earlier game completion',()=>{
  assert.equal(recommendedLesson({...newState(),page:23}).id,'qof');
  assert.equal(recommendedLesson({...newState(),page:67}).id,'shva');
  assert.equal(recommendedLesson(newState()).id,'hello');
});
test('restoring malformed storage cannot corrupt the route or progress',()=>{
  assert.deepEqual(cleanState(null),newState());assert.deepEqual(cleanState({version:2}),newState());
  const s=cleanState({version:1,page:999,rounds:-3,completed:{hello:{discover:2,memory:-1,evil:2},unknown:{discover:50}},lastLesson:'evil'});
  assert.equal(s.page,79);assert.equal(s.rounds,0);assert.equal(s.lastLesson,null);assert.deepEqual(s.completed,{hello:{discover:2}});
});
test('all shipped audio entries exist and identifiers have no text collisions',async()=>{
  const clips=JSON.parse(await readFile('docs/audio-transcript.json','utf8'));
  assert.equal(new Set(clips.map(c=>c.id)).size,clips.length);
  const spoken=new Set(clips.map(c=>c.text));
  for(const lesson of lessons){
    if(lesson.rule){assert.ok(spoken.has(lesson.rule.text));if(lesson.rule.result)assert.ok(spoken.has(lesson.rule.result));}
    for(const q of lesson.questions){assert.ok(spoken.has(questionSpeech(q)));for(const key of ['audio','hint','explanation'])if(q[key])assert.ok(spoken.has(q[key]),q[key]);}
    for(const word of lesson.words)assert.ok(spoken.has(word.text));
  }
  for(const text of narrationTexts(lessons))assert.ok(spoken.has(text),text);
  const voice=JSON.parse(await readFile('public/voice.json','utf8'));
  assert.equal(voice.id,'he-IL-HilaNeural');assert.equal(voice.rate,'-12%');
  for(const c of clips){assert.equal(c.spokenText,pronunciationText(c.text));assert.ok((await stat(`public/audio/${c.id}.mp3`)).size>1000,c.text);}
});

test('guided entry respects the selected page and chooses an unfinished available activity',()=>{
  for(let page=4;page<=79;page++){
    const state={...newState(),page};
    const first=recommendedActivity(state);
    assert.ok(availableModes(first.lesson,page).includes(first.mode));
    state.completed[first.lesson.id]={[first.mode]:1};
    const next=recommendedActivity(state,first.lesson);
    const unfinished=availableModes(first.lesson,page).filter(m=>m!==first.mode);
    if(unfinished.length)assert.ok(unfinished.includes(next.mode));
  }
  assert.equal(recommendedActivity(newState()).lesson.id,'hello');
});
test('first questions offer two choices including the answer; later choices remain available',()=>{
  for(const lesson of lessons)for(const mode of ['vowels','discover']){
    const round=roundQuestions(lesson,79,()=>.2,mode);
    round.forEach((q,i)=>{
      assert.equal(q.choices.length,i<2?2:q.answers.length);
      assert.equal(q.choices.filter(a=>a.text===q.target).length,1);
    });
  }
  assert.equal(memoryCards(lessons.find(l=>l.id==='qof'),79,()=>.5,2).length,4);
});
test('tutorial progress survives old saves and ignores malformed values',()=>{
  assert.deepEqual(cleanState({version:1,tutorials:{build:true,memory:'true',unknown:true}}).tutorials,{build:true});
  assert.deepEqual(cleanState({version:1,completed:{}}).tutorials,{});
});
