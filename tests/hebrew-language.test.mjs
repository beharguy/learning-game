import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {BANK, SAY, allAudioTexts} from '../src/neighborhood/content.js';
import {GUIDE, DEMOS, narrationTexts, audioKey} from '../src/narration.js';
import {lessons} from '../src/curriculum.js';
import {pronunciationText} from '../src/pronunciation.js';

const unpointed=text=>text.normalize('NFD').replace(/[\u0591-\u05c7]/g,'');
const catalog=()=>[...new Set([...allAudioTexts(),...narrationTexts(lessons)])];

test('player guidance has no gendered direct address, including imported lesson prompts',()=>{
  const instructions=[...Object.values(SAY),...Object.values(GUIDE),...Object.values(DEMOS).flat(),
    ...Object.values(BANK).flatMap(qs=>qs.flatMap(q=>[q.prompt,q.hint])),
    ...lessons.flatMap(l=>[l.rule?.text,...l.questions.flatMap(q=>[q.prompt,q.speech,q.hint])])].filter(Boolean);
  const directForms=new Set(['בואי','בוא','בחרי','לחצי','הקשיבי','חברי','קראי','מצאי','בדקי','חפשי','שימי','קחי','חשבי','תוכלי','תרכיבי','תורך','איתך','שלך']);
  for(const text of instructions){
    const words=unpointed(text).split(/[^א-ת]+/);
    assert.ok(!words.some(w=>directForms.has(w)||w.startsWith('ו')&&directForms.has(w.slice(1))),text);
    for(const address of ['אַתְּ','אַתָּה','לָךְ','לְךָ'])assert.ok(!text.normalize('NFC').includes(address.normalize('NFC')),text);
    assert.ok(!/מוכנה ל|מוכן ל|ברוכה הבאה|ברוך הבא/.test(unpointed(text)),text);
  }
});

test('grammar exercises retain the correct verb for each named character',()=>{
  const pairs=[['קָם','קָמָה'],['בָּא','בָּאָה'],['שָׁר','שָׁרָה'],['יָשַׁב','יָשְׁבָה'],['שָׁרַק','שָׁרְקָה'],
    ['חָשַׁב','חָשְׁבָה'],['רָקַד','רָקְדָה'],['יָשַׁן','יָשְׁנָה'],['לָמַד','לָמְדָה'],['בָּרַח','בָּרְחָה']];
  const genders={'תָּמָר':'f','אַיָּלָה':'f','בָּרָק':'m','שַׁחַר':'m','נָדָב':'m'};
  const counts={f:0,m:0};
  for(const q of BANK.theater.filter(q=>['verb','verb-transfer'].includes(q.type))){
    const subject=q.completed.split(' ')[0],sex=genders[subject];
    assert.ok(sex,q.completed);assert.equal(q.actor,sex);counts[sex]++;
    const pair=pairs.find(p=>p.includes(q.target));assert.ok(pair,q.target);
    assert.equal(q.target,pair[sex==='f'?1:0],q.completed);
    assert.equal(q.completed,`${subject} ${q.target}.`);
    if(q.type==='verb-transfer'){
      const [source,verb]=q.sentence.split(' ');
      assert.equal(verb,pair[genders[source]==='f'?1:0]+'.',q.sentence);
    }
    const spokenSubject=subject==='תָּמָר'?'תמר':subject;
    assert.equal(pronunciationText(q.completed),`${spokenSubject} ${q.target}.`.normalize('NFC'));
  }
  assert.ok(counts.f>0&&counts.m>0);
  for(const q of BANK.library.filter(q=>q.type==='what')){
    const sex=genders[q.story.split(' ')[0]];
    assert.ok(q.story.includes(sex==='f'?'רָאֲתָה':'רָאָה'),q.story);
    assert.ok(q.prompt.includes(sex==='f'?'רָאֲתָה':'רָאָה'),q.prompt);
  }
});

test('vowel names use the standard vocalization without altering teaching words',()=>{
  // Academy of the Hebrew Language, grammar terminology: קָמָץ, פַּתָּח, שְׁוָא.
  for(const text of catalog())assert.ok(!text.normalize('NFC').includes('קָמַץ'.normalize('NFC')),text);
  const names=new Set(lessons.flatMap(l=>l.questions.map(q=>q.markName).filter(Boolean)));
  for(const name of ['קָמָץ','פַּתָּח','שְׁוָא','חֲטַף פַּתָּח'])assert.ok(names.has(name),name);
  const spokenWords=new Map([['תָּמָר','תמר'],['לְתָמָר','לתמר'],['וְתָמָר','ותמר']]);
  for(const lesson of lessons)for(const word of lesson.words)assert.equal(pronunciationText(word.text),(spokenWords.get(word.text)||word.text).normalize('NFC'));
});

test('published audio catalog matches current wording and excludes obsolete clips',async()=>{
  const expected=catalog().map(text=>({id:audioKey(text),text,spokenText:pronunciationText(text),cacheId:audioKey(pronunciationText(text))}));
  const transcript=JSON.parse(await readFile('docs/audio-transcript.json','utf8'));
  const sort=items=>items.toSorted?items.toSorted((a,b)=>a.id.localeCompare(b.id)):[...items].sort((a,b)=>a.id.localeCompare(b.id));
  assert.deepEqual(sort(transcript),sort(expected));
  const ids=expected.map(c=>c.id).sort();
  assert.deepEqual(JSON.parse(await readFile('public/audio-index.json','utf8')).sort(),ids);
  assert.deepEqual((await readdir('public/audio')).filter(f=>f.endsWith('.mp3')).map(f=>f.slice(0,-4)).sort(),ids);
});
