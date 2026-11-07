import test from 'node:test';
import assert from 'node:assert/strict';
import { VoicePlayer } from '../src/voice-player.js';
import { instructionSpeech, audioKey, GUIDE, DEMOS } from '../src/narration.js';
import { lessons } from '../src/curriculum.js';

class FakeAudio {
  played=[];paused=true;src='';
  pause(){this.paused=true;}
  play(){this.paused=false;this.played.push(this.src);return Promise.resolve();}
  end(){this.paused=true;this.onended?.();}
}
test('narration guides decoding without automatically reading its answer or story',()=>{
  assert.deepEqual(instructionSpeech({mode:'build',questions:[{text:'מָרָק'}],index:0}),[GUIDE.build]);
  for(const lesson of lessons)for(const q of lesson.questions){
    const spoken=instructionSpeech({mode:q.mode||'discover',questions:[q],index:0});
    assert.equal(spoken[0],q.speech||q.prompt);
    if(q.story)assert.ok(!spoken.includes(q.story));
    if(q.hideLabel||q.kind==='rhyme')assert.ok(spoken.includes(q.audio||q.label));
    else assert.equal(spoken.length,1);
  }
  for(const mode of Object.keys(DEMOS))for(let demoStep=0;demoStep<3;demoStep++)assert.equal(instructionSpeech({mode,demo:true,demoStep,questions:[{text:'מָרָק',prompt:'שאלה'}],index:0})[0],DEMOS[mode][demoStep]);
  assert.deepEqual(instructionSpeech({mode:'build',demo:true,demoStep:0,questions:[{text:'מָרָק'}],index:0}),[DEMOS.build[0],'מָרָק']);
});
test('voice plays each instruction clip in order on the same media element',async()=>{
  const audio=new FakeAudio(),player=new VoicePlayer(audio);
  const result=player.play(['שאלה','מילה']);
  assert.deepEqual(audio.played,[`./audio/${audioKey('שאלה')}.mp3`]);
  audio.end();await Promise.resolve();
  assert.equal(audio.played[1],`./audio/${audioKey('מילה')}.mp3`);
  audio.end();assert.equal(await result,true);
});
test('new speech and mute cancel a queued old instruction without overlapping clips',async()=>{
  const audio=new FakeAudio(),player=new VoicePlayer(audio);
  const old=player.play(['ישן','לא להשמיע']);
  const current=player.play(['חדש']);
  assert.equal(await old,false);assert.equal(audio.played.length,2);
  player.stop();assert.equal(await current,false);assert.equal(audio.paused,true);
  assert.equal(await player.play(['שקט'],{enabled:false}),false);
  assert.equal(audio.played.length,2);
  const manual=player.play(['רמז'],{enabled:false,force:true});
  audio.end();assert.equal(await manual,true);
});
test('a denied playback prompts a tap and does not continue the queue',async()=>{
  const audio=new FakeAudio();let notices=0;
  audio.play=()=>Promise.reject(new Error('NotAllowedError'));
  const player=new VoicePlayer(audio,()=>notices++);
  assert.equal(await player.play(['ראשון','שני']),false);assert.equal(notices,1);
});
