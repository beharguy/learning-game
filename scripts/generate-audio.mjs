// Optional build-time operation: only game text is sent for speech generation.
// Ordinary build/deploy uses the already shipped MP3s, without any voice service.
import { lessons } from '../src/curriculum.js';
import { audioKey, narrationTexts } from '../src/narration.js';
import { pronunciationText } from '../src/pronunciation.js';
import { mkdir, writeFile, rm, readdir, copyFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const transcript=narrationTexts(lessons).map(text=>{
  const spokenText=pronunciationText(text);
  return {id:audioKey(text),text,spokenText,cacheId:audioKey(spokenText)};
});
if(new Set(transcript.map(c=>c.id)).size!==transcript.length)throw new Error('Audio ID collision');
const spokenIds=new Map();
for(const clip of transcript){
  if(spokenIds.has(clip.cacheId)&&spokenIds.get(clip.cacheId)!==clip.spokenText)throw new Error('Spoken audio ID collision');
  spokenIds.set(clip.cacheId,clip.spokenText);
}
const cache='.cache/voice-hila-v1-rate12';await mkdir(cache,{recursive:true});
const input=path.join(cache,'transcript.json');await writeFile(input,JSON.stringify(transcript,null,2));
execFileSync(process.env.VOICE_PYTHON||'.venv-voice/bin/python',['scripts/generate-neural-audio.py',input,cache],{stdio:'inherit'});
// Validate the complete new catalog before replacing the shipped one.
for(const clip of transcript)if((await stat(path.join(cache,clip.cacheId+'.mp3'))).size<1000)throw new Error('Missing clip '+clip.id);
if(process.argv.includes('--prepare')){
  console.log(`Prepared ${transcript.length} clips in ${cache}; shipped audio is unchanged.`);
  process.exit(0);
}
await mkdir('public/audio',{recursive:true});
for(const clip of transcript)await copyFile(path.join(cache,clip.cacheId+'.mp3'),path.join('public/audio',clip.id+'.mp3'));
await writeFile('public/audio-index.json',JSON.stringify(transcript.map(c=>c.id)));
await writeFile('docs/audio-transcript.json',JSON.stringify(transcript,null,2));
await writeFile('public/voice.json',JSON.stringify({id:'he-IL-HilaNeural',label:'הילה',format:'mp3',rate:'-12%',synthetic:true},null,2));
const keep=new Set(transcript.map(c=>c.id+'.mp3'));
for(const file of await readdir('public/audio'))if(/\.(mp3|m4a)$/.test(file)&&!keep.has(file))await rm(path.join('public/audio',file));
console.log(`Audio ready: ${transcript.length} Hila voice clips.`);
