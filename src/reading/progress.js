import {STORIES,newWords,storyById} from './content.js';
export const initialCursor=()=>({line:0,word:0,stage:'blend'});
export function cleanReading(raw){
 const result={version:1,last:STORIES.some(s=>s.id===raw?.last)?raw.last:null,stories:{}};
 for(const story of STORIES){
  const old=raw?.stories?.[story.id]||{};
  const line=Number.isInteger(old.cursor?.line)?Math.max(0,Math.min(5,old.cursor.line)):0;
  const words=newWords(story,line);
  const word=Number.isInteger(old.cursor?.word)?Math.max(0,Math.min(Math.max(0,words.length-1),old.cursor.word)):0;
  let stage=['blend','word','line','story','done'].includes(old.cursor?.stage)?old.cursor.stage:'blend';
  if(!words.length&&['blend','word'].includes(stage))stage='line';
  result.stories[story.id]={cursor:{line,word,stage},lines:[...new Set(Array.isArray(old.lines)?old.lines.filter(n=>Number.isInteger(n)&&n>=0&&n<6):[])],completed:old.completed===true};
 }
 return result;
}
export function advanceCursor(story,cursor){
 const c={...cursor},words=newWords(story,c.line);
 if(c.stage==='blend')c.stage='word';
 else if(c.stage==='word'){
  if(c.word+1<words.length){c.word++;c.stage='blend';}else c.stage='line';
 }else if(c.stage==='line'){
  if(c.line<5){c.line++;c.word=0;c.stage=newWords(story,c.line).length?'blend':'line';}
  else c.stage='story';
 }else if(c.stage==='story')c.stage='done';
 return c;
}
export function advanceReading(reading,id){
 const state=cleanReading(reading),story=storyById(id);if(!story)return state;
 const progress=state.stories[id],c=progress.cursor;
 if(c.stage==='line'&&!progress.lines.includes(c.line))progress.lines.push(c.line);
 if(c.stage==='story'){progress.completed=true;progress.lines=story.lines.map((_,i)=>i);}
 progress.cursor=advanceCursor(story,c);state.last=id;return state;
}
export function setReadingCursor(reading,id,cursor){
 const state=cleanReading(reading);if(!storyById(id))return state;
 state.last=id;state.stories[id].cursor=cursor;return cleanReading(state);
}
