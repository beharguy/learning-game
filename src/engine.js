import { lessons } from './curriculum.js';

export const STORAGE_KEY = 'hebrew-garden-v1';
export function newState() {
  return { version:1, page:79, sound:true, tutorials:{}, completed:{}, lastLesson:null, rounds:0 };
}
export function cleanState(raw) {
  const fresh = newState();
  if (!raw || raw.version !== 1) return fresh;
  const completed = {};
  for (const lesson of lessons) {
    const entry = raw.completed?.[lesson.id];
    if (!entry || typeof entry !== 'object') continue;
    completed[lesson.id] = {};
    for (const mode of ['vowels','discover','build','memory']) {
      if (Number.isSafeInteger(entry[mode]) && entry[mode] > 0) completed[lesson.id][mode] = Math.min(entry[mode],100000);
    }
  }
  return { ...fresh, page:Number.isInteger(raw.page) ? Math.max(4,Math.min(79,raw.page)) : 79,
    sound:raw.sound !== false, tutorials:Object.fromEntries(['vowels','discover','build','memory'].filter(m=>raw.tutorials?.[m]===true).map(m=>[m,true])), completed,
    lastLesson:lessons.some(l=>l.id === raw.lastLesson) ? raw.lastLesson : null,
    rounds:Number.isSafeInteger(raw.rounds) && raw.rounds >= 0 ? Math.min(raw.rounds,1000000) : 0 };
}
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i=result.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [result[i],result[j]]=[result[j],result[i]]; }
  return result;
}
export function graphemes(text) {
  // Keep vowels, dagesh and shin dots attached to their consonant on every device.
  return text.normalize('NFC').match(/[^\p{M}]\p{M}*/gu) || [];
}
export function questionSpeech(q) {
  if(q.speech)return q.speech;
  if(q.story)return `${q.story} ${q.prompt}`;
  if(q.sentence)return `${q.prompt} ${q.sentence.replace('____','מה מתאים כאן?')}`;
  return q.prompt;
}
export function eligibleQuestions(lesson,page) { return lesson.questions.filter(q=>q.page<=page); }
export function eligibleWords(lesson,page) { return lesson.words.filter(w=>w.page<=page); }
export function memoryItems(lesson,page) {
  if(lesson.start>page||lesson.id==='hello')return [];
  // A pair links two representations. Never match an identical printed symbol.
  const words=eligibleWords(lesson,page).filter(w=>w.emoji&&!['↔','⋯','✓','✕','👫'].includes(w.emoji));
  const uniqueWords=words.filter((w,i)=>words.findIndex(x=>x.emoji===w.emoji)===i);
  if(uniqueWords.length>=2)return uniqueWords.map(w=>({page:w.page,left:w.text,emoji:w.emoji,audio:w.text,cue:'מִלָּה',kind:'word'}));
  const prior=lessons.filter(l=>l.start<=lesson.start);
  const candidates=[lesson,...prior.filter(l=>l!==lesson).reverse()].flatMap(l=>eligibleQuestions(l,page)
    .filter(q=>q.kind==='sound'&&['start','end'].includes(q.position)));
  const selected=[],sounds=new Set(),pictures=new Set();
  for(const q of candidates){
    // Kamatz and patah are not two different auditory answers here.
    const key=q.target.normalize('NFD').replace(/[\u05B2\u05B7\u05B8]/g,'a');
    if(sounds.has(key)||pictures.has(q.emoji))continue;
    selected.push({page:q.page,left:q.target,emoji:q.emoji,audio:q.audio,cue:q.position==='end'?'בַּסּוֹף':'בַּהַתְחָלָה',kind:'sound'});
    sounds.add(key);pictures.add(q.emoji);
    if(selected.length===3)break;
  }
  return selected;
}
export function availableModes(lesson,page) {
  const result=[],questions=eligibleQuestions(lesson,page);
  if(questions.some(q=>q.mode==='vowels'))result.push('vowels');
  if(questions.some(q=>q.mode!=='vowels'))result.push('discover');
  if(eligibleWords(lesson,page).length>=2)result.push('build');
  if(memoryItems(lesson,page).length>=2)result.push('memory');
  return result;
}
export function roundQuestions(lesson,page,random=Math.random,mode='discover') {
  const pool=shuffle(eligibleQuestions(lesson,page).filter(q=>(q.mode==='vowels')===(mode==='vowels')),random);
  // Include each available skill level, then progress from supported to applied.
  const selected=[];
  for(const level of [1,2,3]){const candidate=pool.find(q=>(q.level||1)===level);if(candidate)selected.push(candidate);}
  selected.push(...pool.filter(q=>!selected.includes(q)).slice(0,5-selected.length));
  return selected.sort((a,b)=>(a.level||1)-(b.level||1)).map((q,index)=>{
    const all=q.answers.map((text,i)=>({text,emoji:q.pictureAnswers?.[i]}));
    const choices=index<2?[all.find(a=>a.text===q.target),...shuffle(all.filter(a=>a.text!==q.target),random).slice(0,1)]:all;
    return {...q,choices:shuffle(choices,random)};
  });
}
export function buildQuestions(lesson,page,random=Math.random) {
  const words=eligibleWords(lesson,page);
  return shuffle(words,random).sort((a,b)=>a.parts.length-b.parts.length).slice(0,5).map((w,index)=>{
    const pieces=w.parts.map(text=>text.normalize('NFC'));
    const extra=index>=2?shuffle(words.flatMap(x=>x.parts).filter(p=>!pieces.includes(p.normalize('NFC'))),random)[0]:null;
    return {...w,parts:pieces,challenge:!!extra,
      tiles:shuffle([...pieces,...(extra?[extra.normalize('NFC')]:[])].map((text,id)=>({text,id})),random)};
  });
}
export function memoryCards(lesson,page,random=Math.random,pairCount=3) {
  const items=shuffle(memoryItems(lesson,page),random).slice(0,pairCount);
  return shuffle(items.flatMap((item,pair)=>[
    {id:`${pair}-0`,pair,side:'text',text:item.left,cue:item.cue,kind:item.kind,page:item.page},
    {id:`${pair}-1`,pair,side:'picture',emoji:item.emoji,audio:item.audio,kind:item.kind,page:item.page}
  ]),random);
}
export function recordRound(state,lessonId,mode) {
  const next=cleanState(state);
  next.completed[lessonId] ||= {};
  next.completed[lessonId][mode]=(next.completed[lessonId][mode]||0)+1;
  next.rounds++;
  next.lastLesson=lessonId;
  return next;
}
export function blooms(state) {
  return Object.values(state.completed).reduce((sum,entry)=>sum+Object.keys(entry).length,0);
}
export function recommendedLesson(state) {
  const open=lessons.filter(l=>l.start<=state.page);
  // A parent-selected page should bring the current classroom topic forward,
  // even if earlier units were learned at school instead of inside the app.
  if(state.page<79)return open.find(l=>l.end>=state.page)||open.at(-1);
  return open.find(l=>availableModes(l,state.page).some(mode=>!state.completed[l.id]?.[mode])) || open[0];
}

export function recommendedActivity(state,lesson=recommendedLesson(state)) {
  const available=availableModes(lesson,state.page);
  return {lesson,mode:available.find(m=>!state.completed[lesson.id]?.[m])||available.reduce((best,m)=>(state.completed[lesson.id]?.[m]||0)<(state.completed[lesson.id]?.[best]||0)?m:best,available[0])};
}
