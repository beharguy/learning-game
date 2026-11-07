import test from 'node:test';
import assert from 'node:assert/strict';
import { pronunciationText } from '../src/pronunciation.js';
import { audioKey, narrationTexts, DEMOS, GUIDE } from '../src/narration.js';
import { lessons } from '../src/curriculum.js';

test('speech-only hints distinguish kol and nikud',()=>{
  assert.equal(pronunciationText('כָּל הַכָּבוֹד!'),'כּוֹל הַכָּבוֹד!'.normalize('NFC'));
  assert.equal(pronunciationText('נִקּוּד. הַנִּקּוּד.'),'נִיקוּד. הַנִיקוּד.'.normalize('NFC'));
  assert.equal(pronunciationText('כָּלָה'),'כָּלָה'.normalize('NFC'));
});
test('pronunciation hints preserve learning words, character genders and repeated processing',()=>{
  for(const lesson of lessons)for(const word of lesson.words)assert.equal(pronunciationText(word.text),word.text.normalize('NFC'));
  for(const text of narrationTexts(lessons))assert.ok(!text.includes('מָצָאת'),text);
  assert.equal(GUIDE.correct,'כָּל הַכָּבוֹד! תְּשׁוּבָה נְכוֹנָה!');
  const story='בָּרָק רָקַד. תָּמָר שָׁרָה.';
  assert.equal(pronunciationText(story),story.normalize('NFC'));
  for(const text of narrationTexts(lessons))assert.equal(pronunciationText(pronunciationText(text)),pronunciationText(text));
  for(const lines of Object.values(DEMOS))assert.ok(!lines.some(t=>/עוברים|לוחצים|בוחרים/.test(t.replace(/[\u0591-\u05c7]/g,''))));
});
test('a pronunciation fix changes its generation cache key without changing the displayed text key',()=>{
  const text='כָּל הַכָּבוֹד!';
  assert.notEqual(audioKey(text),audioKey(pronunciationText(text)));
  const unchanged='מָרָק';assert.equal(audioKey(unchanged),audioKey(pronunciationText(unchanged)));
});
