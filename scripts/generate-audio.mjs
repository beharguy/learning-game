// Optional build-time operation: only game text is sent for speech generation.
// Ordinary build/deploy uses the already shipped MP3s, without any voice service.
import { allAudioTexts } from '../src/neighborhood/content.js';
import { lessons } from '../src/curriculum.js';
import { audioKey, narrationTexts } from '../src/narration.js';
import { pronunciationText } from '../src/pronunciation.js';
import { mkdir, readFile, writeFile, rm, readdir, copyFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
const transcript=[...new Set([...narrationTexts(lessons),...allAudioTexts()])].map(text=>{
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
// Keep human-approved timing edits stable across future speech regeneration.
// Their raw source, exact edit recipe and approval are checked in alongside them.
const edits=JSON.parse(await readFile('scripts/audio-edits/manifest.json','utf8'));
const overrides=new Map();
for(const edit of edits){
  const clip=transcript.find(c=>c.id===edit.id);
  if(!clip||clip.spokenText!==edit.spokenText)throw new Error('Audio edit no longer matches speech text: '+edit.id);
  if(overrides.has(edit.id))throw new Error('Duplicate audio edit: '+edit.id);
  const hash=createHash('sha256').update(await readFile(edit.file)).digest('hex');
  if(hash!==edit.sha256)throw new Error('Approved audio edit changed: '+edit.id);
  overrides.set(edit.id,edit.file);
}
const source=clip=>overrides.get(clip.id)||path.join(cache,clip.cacheId+'.mp3');
const input=path.join(cache,'transcript.json');await writeFile(input,JSON.stringify(transcript.filter(c=>!overrides.has(c.id)),null,2));
execFileSync(process.env.VOICE_PYTHON||'.venv-voice/bin/python',['scripts/generate-neural-audio.py',input,cache],{stdio:'inherit'});
// Validate the complete new catalog before replacing the shipped one.
for(const clip of transcript)if((await stat(source(clip))).size<1000)throw new Error('Missing clip '+clip.id);
if(process.argv.includes('--prepare')){
  console.log(`Prepared ${transcript.length} clips from ${cache} and ${overrides.size} approved edits; shipped audio is unchanged.`);
  process.exit(0);
}
await mkdir('public/audio',{recursive:true});
for(const clip of transcript)await copyFile(source(clip),path.join('public/audio',clip.id+'.mp3'));
await writeFile('public/audio-index.json',JSON.stringify(transcript.map(c=>c.id)));
await writeFile('docs/audio-transcript.json',JSON.stringify(transcript,null,2));
await writeFile('public/voice.json',JSON.stringify({id:'he-IL-HilaNeural',label:'הילה',format:'mp3',rate:'-12%',synthetic:true},null,2));
const keep=new Set(transcript.map(c=>c.id+'.mp3'));
for(const file of await readdir('public/audio'))if(/\.(mp3|m4a)$/.test(file)&&!keep.has(file))await rm(path.join('public/audio',file));
console.log(`Audio ready: ${transcript.length} Hila voice clips.`);
