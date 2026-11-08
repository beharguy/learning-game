import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pronunciationText} from '../src/pronunciation.js';

test('human-approved audio edits ship intact and still match their narration',async()=>{
 const edits=JSON.parse(await readFile('scripts/audio-edits/manifest.json','utf8'));
 const transcript=JSON.parse(await readFile('docs/audio-transcript.json','utf8'));
 assert.equal(new Set(edits.map(e=>e.id)).size,edits.length);
 for(const edit of edits){
  const clip=transcript.find(c=>c.id===edit.id);assert.ok(clip);
  assert.equal(pronunciationText(clip.text),edit.spokenText);
  const approved=await readFile(edit.file),source=await readFile(edit.source);
  assert.equal(createHash('sha256').update(approved).digest('hex'),edit.sha256);
  assert.equal(createHash('sha256').update(source).digest('hex'),edit.sourceSha256);
  assert.deepEqual(await readFile(`public/audio/${edit.id}.mp3`),approved);
 }
});
