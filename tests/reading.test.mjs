import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {STORIES,WORDS,SOUNDS,CUES,newWords,lineText,audioCatalog} from '../src/reading/content.js';
import {cleanReading,advanceReading,setReadingCursor} from '../src/reading/progress.js';
import {freshState,cleanState} from '../src/neighborhood/engine.js';
import {VoicePlayer} from '../src/voice-player.js';

test('the two photographed stories keep every line, vowel and cat rebus',()=>{
 assert.deepEqual(STORIES[0].lines.map((_,i)=>lineText(STORIES[0],i)),[
  'דָּן בָּא לַגַּן.','דָּן רָאָה צָב.','הַצָּב זָחַל.',
  'דָּן נָתַן חַסָּה לַצָּב.','הַצָּב אָכַל חַסָּה.','דָּן שָׂמַח.',
 ]);
 assert.deepEqual(STORIES[1].lines.map((_,i)=>lineText(STORIES[1],i)),[
  'רָן בָּא לַגַּן.','רָן רָאָה 🐱.','הַ🐱 קָפַץ עַל הַגַּג.',
  'רָן דָּאַג.','הַ🐱 יָרַד.','רָן שָׂמַח.',
 ]);
 for(const word of Object.values(WORDS))if(!word.picture){
  assert.equal(word.parts.join('').normalize('NFC'),word.text.normalize('NFC'));
  if(word.parts.length>1)assert.ok(SOUNDS[word.sound]);
 }
 assert.deepEqual(WORDS.ba.parts,['בָּא'],'silent letters must not become artificial sounds');
});

test('each written word is introduced once per story, pictures are not decoding drills',()=>{
 for(const story of STORIES){
  const planned=story.lines.flatMap((_,i)=>newWords(story,i));
  const written=[...new Set(story.lines.flat())].filter(id=>!WORDS[id].picture);
  assert.deepEqual(planned,written);assert.equal(new Set(planned).size,planned.length);
 }
});

test('short steps survive serialization, then reach six lines and the whole story',()=>{
 for(const story of STORIES){
  let reading=cleanReading(),steps=0;
  while(reading.stories[story.id].cursor.stage!=='done'){
   const before=reading.stories[story.id].cursor;
   reading=advanceReading(reading,story.id);
   assert.deepEqual(cleanReading(JSON.parse(JSON.stringify(reading))),reading);
   if(before.stage==='blend')assert.equal(reading.stories[story.id].cursor.stage,'word');
   if(++steps>60)assert.fail('non-terminating reading journey');
  }
  assert.deepEqual(reading.stories[story.id].lines,[0,1,2,3,4,5]);
  assert.equal(reading.stories[story.id].completed,true);
  assert.equal(reading.stories[STORIES.find(s=>s.id!==story.id).id].completed,false);
  reading=setReadingCursor(reading,story.id,{line:2,word:0,stage:'blend'});
  assert.equal(reading.stories[story.id].lines.length,6,'review preserves earned practice');
 }
});

test('malformed cursors cannot escape the authored stories and reset/export include reading',()=>{
 const clean=cleanReading({last:'evil',stories:{dan:{cursor:{line:900,word:-3,stage:'anything'},lines:[-1,0,0,'1',8],completed:'yes'}}});
 assert.equal(clean.last,null);assert.deepEqual(clean.stories.dan.lines,[0]);
 assert.deepEqual(clean.stories.dan.cursor,{line:5,word:0,stage:'blend'});
 const state=freshState();state.stats.kitchen={correct:3};state.reading=advanceReading(state.reading,'dan');
 const backup=cleanState(JSON.parse(JSON.stringify(state)));
 assert.equal(backup.stats.kitchen.correct,3);assert.deepEqual(backup.reading,state.reading);
 assert.deepEqual(freshState().reading,cleanReading());
 assert.deepEqual(cleanState({version:2}).reading,cleanReading(),'older backups remain compatible');
});

test('all narration is shipped with measured boundaries for each printed line',async()=>{
 const catalog=audioCatalog(),manifest=JSON.parse(await readFile('public/reading-audio/manifest.json'));
 assert.equal(manifest.voice,'he-IL-HilaNeural');assert.equal(manifest.rate,'-12%');
 assert.equal(Object.keys(catalog).length,Object.keys(manifest.clips).length);
 for(const [key,spec]of Object.entries(catalog)){
  const clip=manifest.clips[key];assert.equal(clip.text,spec.text,key);
  assert.ok((await stat(`public/reading-audio/${key}.mp3`)).size>500,key);
  if(spec.words){assert.equal(clip.boundaries.length,spec.words,key);let last=-1;for(const b of clip.boundaries){assert.ok(b.start>last&&b.duration>0);last=b.start;}}
 }
 assert.ok(Object.keys(CUES).every(k=>catalog['cue-'+k]));
 const sw=await readFile('dist/sw.js','utf8');
 for(const key of Object.keys(catalog))assert.ok(sw.includes(`./reading-audio/${key}.mp3`),'offline '+key);
});

test('reading playback uses the same media element, supports slow audio, cancels cleanly',async()=>{
 const audio={pause(){},play(){return Promise.resolve();}},clips=[];
 const voice=new VoicePlayer(audio);
 const playing=voice.play(['first','second'],{source:id=>`./reading-audio/${id}.mp3`,rate:.8,onClip:id=>clips.push(id)});
 assert.equal(audio.src,'./reading-audio/first.mp3');assert.equal(audio.playbackRate,.8);
 audio.onended();await Promise.resolve();
 assert.equal(audio.src,'./reading-audio/second.mp3');voice.stop();
 assert.equal(await playing,false);assert.deepEqual(clips,['first','second']);
 const next=voice.play(['usual']);assert.equal(audio.playbackRate,1,'slow reading cannot slow the neighborhood');
 audio.onended();assert.equal(await next,true);
});

test('parent-approved da and Dan recordings remain unchanged',async()=>{
 const review=JSON.parse(await readFile('docs/reading-voice-review.json'));
 for(const [key,approved]of Object.entries(review.clips)){
  assert.equal(audioCatalog()[key].text,approved.text);
  assert.equal(createHash('sha256').update(await readFile(`public/reading-audio/${key}.mp3`)).digest('hex'),approved.sha256,key);
 }
});
