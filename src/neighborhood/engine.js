import { BANK, GAMES, SAY } from './content.js';
import { shuffle } from '../engine.js';
export const KEY='alma-neighborhood-v2';
export const SESSION_SIZE=6;
const safeInt=(x,max=100000)=>Number.isSafeInteger(x)&&x>=0?Math.min(x,max):0;
export function freshState(legacy={}){
 return {version:2,page:Number.isInteger(legacy?.page)?Math.max(4,Math.min(79,legacy.page)):79,sound:legacy?.sound!==false,motion:true,level:'auto',seen:{},stats:{},tutorials:{},lastGame:null,active:null};
}
export function cleanState(raw,legacy){
 const s=freshState(legacy);if(raw?.version!==2)return s;
 s.page=Number.isInteger(raw.page)?Math.max(4,Math.min(79,raw.page)):79;
 s.sound=raw.sound!==false;s.motion=raw.motion!==false;s.level=['auto','all'].includes(raw.level)?raw.level:'auto';
 for(const g of GAMES){
  const ids=new Set(BANK[g.id].map(q=>q.id));
  s.seen[g.id]=[...new Set(Array.isArray(raw.seen?.[g.id])?raw.seen[g.id].filter(id=>ids.has(id)):[])];
  const t=raw.stats?.[g.id]||{};s.stats[g.id]={correct:safeInt(t.correct),independent:safeInt(t.independent),helped:safeInt(t.helped),rounds:safeInt(t.rounds)};
  s.tutorials[g.id]=raw.tutorials?.[g.id]===true;
 }
 s.lastGame=GAMES.some(g=>g.id===raw.lastGame)?raw.lastGame:null;
 const active=raw.active;
 if(active&&BANK[active.game]?.some(q=>q.id===active.id&&q.page<=s.page))s.active={game:active.game,id:active.id,round:safeInt(active.round,5),helped:!!active.helped};
 return s;
}
export function available(game,page){return BANK[game].filter(q=>q.page<=page);}
export function readyGames(state){return GAMES.filter(g=>available(g.id,state.page).length);}
export function materialize(q,random=Math.random){
 let options;
 if(q.type==='complete')options=[{text:q.target},...shuffle(q.foils,random).slice(0,q.level>1?2:1).map(text=>({text}))];
 else if(q.options)options=q.options;
 else{
  const unique=[...new Map(q.foils.filter(o=>o.text!==q.target).map(o=>[o.text,o])).values()];
  options=[q.correct,...shuffle(unique,random).slice(0,q.type==='initial'||q.type==='ending'?2:1)];
 }
 return {...q,choices:shuffle(options,random)};
}
export function nextQuestion(state,game,random=Math.random){
 let pool=available(game,state.page);if(!pool.length)return null;
 const independent=state.stats[game]?.independent||0;
 const cap=state.level==='all'?3:independent<8?1:independent<24?2:3;
 const minLevel=Math.min(...pool.map(q=>q.level));
 pool=pool.filter(q=>q.level<=Math.max(cap,minLevel));
 const seen=state.seen[game]||[];
 let fresh=pool.filter(q=>!seen.includes(q.id));
 if(!fresh.length){
  // Reset only this eligible pool; preserve history for other page/difficulty bands.
  const ids=new Set(pool.map(q=>q.id));state.seen[game]=seen.filter(id=>!ids.has(id));
  fresh=pool.length>1?pool.filter(q=>q.id!==seen.at(-1)):pool;
 }
 const previous=BANK[game].find(q=>q.id===seen.at(-1));
 const key=q=>q?.word||q?.cue||q?.story||q?.id;
 const varied=fresh.filter(q=>key(q)!==key(previous));
 const q=shuffle(varied.length?varied:fresh,random)[0];
 state.seen[game]||=[];state.seen[game].push(q.id);state.lastGame=game;
 return materialize(q,random);
}
export function recordSuccess(state,game,helped){
 state.stats[game]||={correct:0,independent:0,helped:0,rounds:0};
 const s=state.stats[game];s.correct++;s[helped?'helped':'independent']++;
}
export function instruction(q){
 const result=[q.prompt];
 if(q.type==='complete')result.push(q.word);
 if(q.auditory)result.push(q.cue);
 result.push(...(q.automatic||[]));
 return result.filter(Boolean);
}
export function helpSpeech(q){
 if(q.auditory)return [q.prompt,q.cue,...q.choices.map(o=>o.text)];
 if(q.type==='complete')return [SAY.listenWord,q.word];
 return [SAY.helpRead,q.read||q.hint||q.explanation||q.prompt].filter(Boolean);
}
export function summary(state){return GAMES.map(g=>({...g,count:available(g.id,state.page).length,...(state.stats[g.id]||{correct:0,independent:0,helped:0,rounds:0})}));}
