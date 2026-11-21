import {STORIES,WORDS,CUES,newWords,storyById} from './content.js';
import {cleanReading,advanceReading,setReadingCursor} from './progress.js';
import {icon} from '../art.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(action,label,body,cls='',attrs='')=>`<button type="button" data-reading="${action}" class="read-button ${cls}" aria-label="${esc(label)}" ${attrs}>${body}</button>`;
const shuffle=xs=>{const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const displayWord=id=>WORDS[id].picture?`<span class="rebus" role="img" aria-label="${id==='cat'?'חתול':'החתול'}">${id==='thecat'?'<span>הַ</span>':''}<span aria-hidden="true">🐱</span></span>`:esc(WORDS[id].text);

export function createStoryReader({root,audio,voice,getState,saveProgress,navigate,storageAvailable=()=>true}){
 let route=null,story=null,cursor=null,run=0,timer=null,clip=null,choices=[],answering=false,helper=null,helperFocus=null,manifest={clips:{}};
 const introduced=new Set();
 const manifestReady=fetch('./reading-audio/manifest.json').then(r=>{if(!r.ok)throw new Error('reading audio manifest');return r.json();}).then(m=>{manifest=m;}).catch(()=>{});
 const progress=()=>cleanReading(getState().reading);
 const write=value=>saveProgress(value);
 const current=()=>progress().stories[story.id];
 const currentWord=()=>newWords(story,cursor.line)[cursor.word];
 function status(text){const el=root.querySelector('.read-status');if(el)el.textContent=text;}
 function clearHighlights(){root.querySelectorAll('.reading-now').forEach(el=>el.classList.remove('reading-now'));}
 function stop(){run++;clearTimeout(timer);timer=null;clip=null;answering=false;voice.stop();clearHighlights();root.querySelector('.read-stop')?.setAttribute('hidden','');}
 function markParts(index){root.querySelectorAll('.read-parts button').forEach((el,i)=>el.classList.toggle('joined',i<=index));}
 async function play(ids,{slow=false,force=true,onClip=()=>{}}={}){
  stop();const token=run;await manifestReady;if(token!==run||document.hidden)return false;
  root.querySelector('.read-stop')?.removeAttribute('hidden');
  const ok=await voice.play(ids,{enabled:getState().sound,force,rate:slow?.8:1,source:id=>`./reading-audio/${id}.mp3`,onClip:id=>{
   clip=id;clearHighlights();onClip(id);
   if(id.startsWith('line-')){
    const line=Number(id.split('-').at(-1));
    const el=root.querySelector(`.read-line[data-line="${line}"]`);
    if(el){el.classList.add('reading-now');if(cursor?.stage==='story')el.scrollIntoView({block:'nearest',behavior:'auto'});}
   }
  }});
  if(token!==run)return false;
  clip=null;clearHighlights();root.querySelector('.read-stop')?.setAttribute('hidden','');
  if(!ok&&(force||getState().sound))status('לֹא שָׁמַעְנוּ? אֶפְשָׁר לִלְחֹץ עַל הָרַמְקוֹל וּלְנַסּוֹת שׁוּב.');
  return ok;
 }
 function onTime(){
  if(!clip?.startsWith('line-'))return;
  const boundaries=manifest.clips[clip]?.boundaries||[],time=audio.currentTime;
  const index=boundaries.findIndex(b=>time>=b.start&&time<b.start+b.duration+.06);
  const line=Number(clip.split('-').at(-1));
  root.querySelectorAll('.read-token').forEach(el=>el.classList.toggle('reading-now',Number(el.dataset.line)===line&&Number(el.dataset.word)===index));
 }
 audio.addEventListener('timeupdate',onTime);
 function header(title,back='shelf'){
  return `<header class="read-header">${button(back,back==='map'?'חזרה לשכונה':'בחירת סיפור',icon(back==='map'?'home':'book'),'read-icon')}<div><small>הַשְּׁכוּנָה שֶׁל עַלְמָה</small><h1>${title}</h1></div>${button('pause','לעצור ולנוח',icon('pause'),'read-icon')}</header>`;
 }
 function audioStatus(){return `<div class="read-audio-status"><p class="read-status" role="status" aria-live="polite"></p>${button('stop','עצירת ההקראה',`${icon('pause')} עֲצִירָה`,'read-stop read-small','hidden')}</div>`;}
 function shelf(){
  const p=progress();
  return `<main class="reading-app read-shelf">${header('הַסִּפּוּרִים שֶׁלִּי','map')}<section class="read-shelf-intro"><span class="read-eyebrow">מִלָּה קְטַנָּה. סִפּוּר שָׁלֵם.</span><h2>אֵיזֶה סִפּוּר נִקְרָא?</h2>${button('instructions','שמיעת ההוראות',icon('volume'),'read-icon')}</section><div class="read-story-cards">${STORIES.map(s=>{
   const saved=p.stories[s.id],started=p.last===s.id||saved.lines.length>0||saved.cursor.word>0||saved.cursor.stage!=='blend';
   return `<button class="read-story-card ${s.color}" data-reading="open" data-story="${s.id}"><span class="read-cover ${s.id}" role="img" aria-label="${s.id==='dan'?'דן מאכיל צב בחסה':'רן מביט בחתול שעל גג'}"></span><span class="read-card-copy"><strong>${s.title}</strong><span class="read-card-progress" aria-label="${saved.lines.length} מתוך 6 שורות תורגלו">${Array.from({length:6},(_,i)=>`<i class="${saved.lines.includes(i)?'earned':''}">★</i>`).join('')}</span><span class="read-card-go">${icon('play')} ${saved.completed?'נִקְרָא שׁוּב':started?'נַמְשִׁיךְ':'נַתְחִיל'}</span></span></button>`;
  }).join('')}</div><p class="read-save-note">${icon('check')} אֶפְשָׁר לַעֲצֹר. הַמָּקוֹם נִשְׁמָר.</p><details class="read-parent-note"><summary>כמה מילים להורים</summary><p>בכל שורה מתרגלים מילים חדשות: מחברים צליל ראשון למילה, מזהים את המילה, ואז מנסים לקרוא את השורה בקול. אותיות בלי תנועה נשמעות כחלק מהמילה השלמה, ולא בשמות האותיות. בסיפור של רן נשמר ציור החתול שמופיע בדף.</p><p>הכוכב בשורה מציין ניסיון קריאה לפי דיווח הילד או ההורה; המשחק לא מקליט ולא בודק הגייה. אפשר לעזור, לנוח, ולחזור לכל שורה בלי מבחן ובלי הגבלת זמן. ההתקדמות נשמרת בדפדפן הזה וכלולה בגיבוי שבהגדרות ההורה.</p></details>${audioStatus()}</main>`;
 }
 function lineMarkup(index){
  return `<div class="read-line" data-line="${index}" dir="rtl">${story.lines[index].map((id,i)=>button('word-help',`עזרה בקריאת ${WORDS[id].say}`,displayWord(id)+(i===story.lines[index].length-1?'.':''),'read-token',`data-word="${i}" data-line="${index}" data-id="${id}"`)).join('')}</div>`;
 }
 function parts(id){const w=WORDS[id];return `<div class="read-parts" dir="rtl" aria-label="חיבור הצלילים של ${w.text}">${w.parts.map((part,i)=>button('part',i===0&&w.sound?'שמיעת הצליל הראשון':'שמיעת המילה המחוברת',esc(part),'',`data-part="${i}" data-id="${id}"`)).join('')}</div>`;}
 function blendPanel(){
  const id=currentWord();return `<span class="read-stage-label">${icon('sparkle')} צְלִילִים מִתְחַבְּרִים</span><h2>נְחַבֵּר לְמִלָּה</h2>${parts(id)}<div class="read-blend-result" aria-live="polite">${esc(WORDS[id].text)}</div><div class="read-main-actions">${button('blend','לחבר את הצלילים',`${icon('volume')} נְחַבֵּר`,'read-primary')}${button('next','לנסות לקרוא את המילה',`${icon('play')} נְנַסֶּה לְבַד`,'read-secondary')}</div>`;
 }
 function wordPanel(){
  const id=currentWord(),pool=[...new Set(story.lines.flat())].filter(k=>k!==id&&!WORDS[k].picture);
  choices=shuffle([id,...shuffle(pool).slice(0,2)]);
  return `<span class="read-stage-label">${icon('search')} מְגַלִּים מִלָּה</span><h2>אֵיזוֹ מִלָּה שָׁמַעְנוּ?</h2>${button('hear-word','שמיעת המילה',`${icon('volume')} לִשְׁמֹעַ`,'read-listen')}<div class="read-choices">${choices.map(k=>button('answer',WORDS[k].text,esc(WORDS[k].text),'read-choice',`data-id="${k}"`)).join('')}</div><div class="read-main-actions">${button('back-blend','עזרה בחיבור הצלילים',`${icon('help')} נְחַבֵּר שׁוּב`,'read-secondary')}</div>`;
 }
 function linePanel(){
  return `<span class="read-stage-label">${icon('book')} קוֹרְאִים שׁוּרָה</span><h2>עַכְשָׁו בְּקוֹל שֶׁלָּנוּ</h2>${lineMarkup(cursor.line)}<div class="read-main-actions">${button('hear-line','שמיעת השורה',`${icon('volume')} בְּיַחַד`,'read-secondary')}${button('slow-line','שמיעת השורה לאט',`🐢 לְאַט`,'read-secondary')}${button('next','ניסיתי לקרוא את השורה בקול',`★ נִסִּיתִי לִקְרֹא`,'read-primary')}</div><p class="read-tip">לְחִיצָה עַל מִלָּה עוֹזֶרֶת לִקְרֹא אוֹתָהּ.</p>`;
 }
 function storyPanel(){
  return `<span class="read-stage-label">${icon('book')} הַסִּפּוּר הַשָּׁלֵם</span><div class="read-main-actions">${button('hear-story','שמיעת כל הסיפור',`${icon('volume')} נִקְרָא יַחַד`,'read-secondary')}${button('slow-story','שמיעת הסיפור לאט',`🐢 לְאַט`,'read-secondary')}</div><div class="read-full-story">${story.lines.map((_,i)=>`<div class="read-story-row">${lineMarkup(i)}${button('hear-line',`שמיעת שורה ${i+1}`,icon('volume'),'read-icon',`data-line="${i}"`)}</div>`).join('')}</div>${button('next','ניסיתי לקרוא את הסיפור בקול',`★ נִסִּיתִי לִקְרֹא אֶת הַסִּפּוּר`,'read-primary')}`;
 }
 function donePanel(){
  return `<div class="read-trophy" aria-hidden="true">${story.symbol}<span>★ ★ ★</span></div><h2>סִפּוּר שָׁלֵם!</h2><p>צַעַד קָטָן, וְעוֹד צַעַד.</p><div class="read-main-actions">${button('whole','לקרוא שוב את הסיפור',`${icon('book')} נִקְרָא שׁוּב`,'read-primary')}${button('shelf','בחירת סיפור אחר',`${icon('play')} עוֹד סִפּוּר`,'read-secondary')}${button('pause','לנוח ולחזור אחר כך',`☁ לָנוּחַ`,'read-secondary')}</div>`;
 }
 function game(){
  const p=current();
  return `<main class="reading-app read-adventure ${story.color}">${header(story.title)}<div class="read-adventure-layout"><aside class="read-scenery"><div class="read-cover ${story.id}" role="img" aria-label="איור הסיפור"></div><div class="read-scenery-caption"><span>${story.symbol}</span><strong>${story.title}</strong><small>בַּקֶּצֶב שֶׁלָּנוּ</small></div></aside><section class="read-workspace"><nav class="read-path" aria-label="בחירת שורה לתרגול">${story.lines.map((_,i)=>button('line',`שורה ${i+1}${p.lines.includes(i)?' — כבר תורגלו המילים':''}`,p.lines.includes(i)?'★':String(i+1),`${cursor.line===i&&!['story','done'].includes(cursor.stage)?'current':''} ${p.lines.includes(i)?'earned':''}`,`data-line="${i}" ${cursor.line===i?'aria-current="step"':''}`)).join('')}${button('whole','כל הסיפור',icon('book'),['story','done'].includes(cursor.stage)?'current':'')}</nav><section class="read-panel" data-stage="${cursor.stage}">${({blend:blendPanel,word:wordPanel,line:linePanel,story:storyPanel,done:donePanel})[cursor.stage]()}</section>${button('instructions','שמיעת ההוראה שוב',`${icon('volume')} אֵיךְ מְשַׂחֲקִים?`,'read-instructions')}${audioStatus()}</section></div><div class="read-overlay-root"></div></main>`;
 }
 function mount(page,id,{guide=true}={}){
  stop();helper=null;route=page;story=storyById(id)||null;
  if(page==='read'&&!story){navigate('stories');return;}
  if(story)cursor={...current().cursor};else cursor=null;
  root.innerHTML=(story?game():shelf())+'<div id="toast" role="status" aria-live="polite"></div>';
  if(!storageAvailable())status('השמירה אינה זמינה בדפדפן הזה. אפשר לשחק, אבל המקום לא יישמר לאחר סגירה.');
  if(guide)guidance(false);
 }
 function guidance(force=true){
  const cue=!story?'choose':cursor.stage==='done'?'finish':cursor.stage;
  const ids=force||!introduced.has(cue)?['cue-'+cue]:[];
  if(['blend','word'].includes(cursor?.stage))ids.push('word-'+currentWord());
  introduced.add(cue);
  if(ids.length)play(ids,{force});
 }
 function refresh(guide=true){mount(route,story?.id,{guide});}
 function setCursor(c){write(setReadingCursor(progress(),story.id,c));refresh();}
 function next(){write(advanceReading(progress(),story.id));refresh();}
 function blend(id=currentWord()){
  const w=WORDS[id],ids=w.sound?['sound-'+w.sound,'word-'+id]:['word-'+id];
  return play(ids,{slow:true,onClip:key=>{const index=key.startsWith('sound-')?0:w.parts.length-1;markParts(index);root.querySelector('.read-blend-result')?.classList.toggle('revealed',key.startsWith('word-'));}});
 }
 async function answer(id,el){
  if(answering)return;
  const target=currentWord();
  if(id!==target){el.classList.add('read-try-again');status('נְנַסֶּה שׁוּב, בְּנַחַת.');await play(['cue-retry','word-'+target]);return;}
  stop();answering=true;const token=run;
  root.querySelectorAll('.read-choice').forEach(b=>{b.disabled=true;b.classList.toggle('read-correct',b===el);});
  root.querySelectorAll('.read-panel button').forEach(b=>{b.disabled=true;});
  status('מָצָאנוּ אֶת הַמִּלָּה!');
  // Save the completed practice before playback, so interruption resumes at
  // the next small step. Reading a line remains an explicit, self-reported try.
  write(advanceReading(progress(),story.id));
  const ok=await voice.play(['word-'+target],{enabled:getState().sound,source:key=>`./reading-audio/${key}.mp3`});
  if(token!==run||document.hidden)return;
  timer=setTimeout(()=>{if(token===run)refresh();},ok?450:1000);
 }
 function openHelper(id,focus){
  stop();helper=id;helperFocus=focus;const w=WORDS[id];
  root.querySelector('.read-overlay-root').innerHTML=`<div class="read-overlay"><section class="read-dialog" role="dialog" aria-modal="true" aria-labelledby="read-help-title">${button('close-help','חזרה לקריאה',icon('close'),'read-close read-icon')}<h2 id="read-help-title">${displayWord(id)}</h2>${w.picture?'<p>הַצִּיּוּר הוּא חֵלֶק מֵהַסִּפּוּר.</p>':parts(id)}<div class="read-main-actions">${!w.picture?button('help-blend','לחבר את הצלילים',`${icon('volume')} נְחַבֵּר`,'read-primary'):''}${button('help-word','שמיעת המילה',`${icon('volume')} הַמִּלָּה`,'read-secondary')}${button('close-help','חזרה לשורה',`${icon('book')} לַשּׁוּרָה`,'read-secondary')}</div></section></div>`;
  root.querySelector('.read-close').focus();play(['word-'+id]);
 }
 function closeHelper(){stop();helper=null;root.querySelector('.read-overlay-root').innerHTML='';helperFocus?.focus();}
 function pause(){
  stop();const area=root.querySelector('.read-overlay-root');
  if(!area){navigate('map');return;}
  helper='pause';helperFocus=document.activeElement;
  area.innerHTML=`<div class="read-overlay"><section class="read-dialog read-rest" role="dialog" aria-modal="true" aria-labelledby="read-rest-title"><span aria-hidden="true">☁</span><h2 id="read-rest-title">אֶפְשָׁר לָנוּחַ</h2><p>הַמָּקוֹם שֶׁלָּנוּ נִשְׁמָר.</p><div class="read-main-actions">${button('resume','להמשיך מהמקום שנשמר',`${icon('play')} נַמְשִׁיךְ`,'read-primary')}${button('shelf','בחירת סיפור',`${icon('book')} לַסִּפּוּרִים`,'read-secondary')}${button('map','חזרה לשכונה',`${icon('home')} לַשְּׁכוּנָה`,'read-secondary')}</div></section></div>`;
  area.querySelector('button').focus();play(['cue-pause']);
 }
 root.addEventListener('click',event=>{
  const el=event.target.closest('[data-reading]');if(!el||el.disabled)return;
  const action=el.dataset.reading;
  if(action==='map'){stop();navigate('map');}
  else if(action==='shelf'){stop();navigate('stories');}
  else if(action==='open'){
   const id=el.dataset.story,p=progress();p.last=id;
   if(p.stories[id].cursor.stage==='done')p.stories[id].cursor.stage='story';
   write(p);navigate('read/'+id);
  }
  else if(action==='pause')pause();
  else if(action==='resume'){refresh(false);}
  else if(action==='stop'){stop();status('הַהַקְרָאָה נֶעֶצְרָה. אֶפְשָׁר לִשְׁמֹעַ שׁוּב.');}
  else if(action==='instructions')guidance();
  else if(action==='next')next();
  else if(action==='blend')blend();
  else if(action==='back-blend')setCursor({...cursor,stage:'blend'});
  else if(action==='part'){
   const w=WORDS[el.dataset.id],i=Number(el.dataset.part);markParts(i);
   play([i===0&&w.sound?'sound-'+w.sound:'word-'+el.dataset.id],{slow:true,onClip:()=>markParts(i)});
  }
  else if(action==='hear-word')play(['word-'+currentWord()]);
  else if(action==='answer')answer(el.dataset.id,el);
  else if(action==='line')setCursor({line:Number(el.dataset.line),word:0,stage:'blend'});
  else if(action==='whole')setCursor({...cursor,stage:'story'});
  else if(action==='hear-line'||action==='slow-line')play([`line-${story.id}-${el.dataset.line??cursor.line}`],{slow:action==='slow-line'});
  else if(action==='hear-story'||action==='slow-story')play(story.lines.map((_,i)=>`line-${story.id}-${i}`),{slow:action==='slow-story'});
  else if(action==='word-help')openHelper(el.dataset.id,el);
  else if(action==='help-blend')blend(helper);
  else if(action==='help-word')play(['word-'+helper]);
  else if(action==='close-help')closeHelper();
 });
 root.addEventListener('keydown',event=>{
  const dialog=root.querySelector('.read-dialog');if(!dialog)return;
  if(event.key==='Escape'){helper==='pause'?refresh(false):closeHelper();}
  if(event.key==='Tab'){
   const buttons=[...dialog.querySelectorAll('button')];
   if(event.shiftKey&&document.activeElement===buttons[0]){event.preventDefault();buttons.at(-1).focus();}
   else if(!event.shiftKey&&document.activeElement===buttons.at(-1)){event.preventDefault();buttons[0].focus();}
  }
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else if(route==='read'&&root.querySelector('.reading-app'))refresh(false);});
 return {mount,stop};
}
