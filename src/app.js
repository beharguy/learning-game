import { GAMES, BANK, SAY } from './neighborhood/content.js';
import { KEY, SESSION_SIZE, cleanState, freshState, available, readyGames, materialize, nextQuestion, recordSuccess, instruction, helpSpeech, summary } from './neighborhood/engine.js';
import { icon, visual } from './art.js';
import { VoicePlayer } from './voice-player.js';

const app=document.querySelector('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storageOK=true,state;
try{state=cleanState(JSON.parse(localStorage.getItem(KEY)||'null'),JSON.parse(localStorage.getItem('hebrew-garden-v1')||'null'));}catch{state=freshState();storageOK=false;}
let pendingImport=null;
let session=null,installEvent=null,transitionTimer=null,toastTimer=null,modalFocus=null,updateWaiting=null,offlineReady=false,reloadForUpdate=false;
const audio=new Audio();audio.preload='auto';audio.hidden=true;audio.id='narration-audio';document.body.append(audio);
const voice=new VoicePlayer(audio,()=>notify('אֶפְשָׁר לִלְחֹץ עַל הָרַמְקוֹל כְּדֵי לִשְׁמֹעַ שׁוּב.'));
const speak=(text,force=false)=>voice.play(Array.isArray(text)?text:[text],{enabled:state.sound,force});
const objects=['🍲','🍎','🍌','🥕','🐇','🐈','🎁','🎈','🌙','🌳','🏠','🦆','🔑','📓','pencilcase','eraser','🪞','date','🍞','🥛','🌊','⛰️','⚡','🌸','🐊','🐓','🚂','🚦','🦁','🐘','❤️','⭐','☁️','🌧️','🌈','🐭'];
const pic=(p,cls='')=>{const i=objects.indexOf(p);return i>=0?`<span class="picture object-sprite ${cls}" aria-hidden="true" style="background-position:${i%6*20}% ${Math.floor(i/6)*20}%"></span>`:`<span class="picture ${cls}" aria-hidden="true">${visual(p||'✨')}</span>`;};
const btn=(action,label,body,cls='',extra='')=>`<button type="button" class="${cls}" data-action="${action}" aria-label="${esc(label)}" ${extra}>${body}</button>`;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageOK=false;notify('השמירה אינה זמינה בדפדפן הזה. אפשר להמשיך לשחק.');}}
function notify(text){const el=document.querySelector('#toast');if(!el)return;el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4200);}
function go(path){clearTimeout(transitionTimer);voice.stop();if(location.hash==='#'+path)render();else location.hash=path;}
const path=()=>location.hash.slice(1).split('/');
const asset=name=>`./assets/neighborhood/${name}.webp`;
function scene(name,content,classes=''){
 return `<main class="scene ${classes}" style="--scene-image:url('${new URL(asset(name),document.baseURI).href}')"><div class="world"><img class="backdrop" src="${asset(name)}" alt="" draggable="false" fetchpriority="high">${content}</div></main>`;
}
function controls(title,{home=true,parents=false,game=false}={}){
 return `<header class="hud"><div class="hud-left">${home?btn('home','חזרה לשכונה',icon('home'),'round-button home-control'):''}${parents?btn('parents','הגדרות להורים',icon('settings'),'round-button parent-control'):''}</div><h1 class="title-pill">${title}</h1></header>
 <div class="bottom-controls">${btn('repeat','שמיעת ההוראה שוב',icon('volume'),'round-button speak-control')}${game?btn('help','עזרה — הקראה ורמז',icon('help'),'round-button hint-control'):btn('sound',state.sound?'כיבוי צליל':'הפעלת צליל',icon(state.sound?'volume':'mute'),'round-button sound-control',`aria-pressed="${state.sound}"`)}</div>`;
}
function welcome(){
 return scene('welcome',`<section class="welcome-copy"><span class="welcome-kicker">לְגַלּוֹת. לְשַׂחֵק. לִלְמֹד.</span><h1>הַשְּׁכוּנָה<br><span>שֶׁל עַלְמָה</span></h1><button class="start-button" data-action="enter">${icon('play')} <span>נְשַׂחֵק יַחַד</span></button></section>`,'welcome-scene')+controls('',{home:false,parents:true});
}
function recommended(){const open=readyGames(state);return open.find(g=>!state.stats[g.id]?.correct)||open.reduce((a,b)=>(state.stats[a.id]?.correct||0)<=(state.stats[b.id]?.correct||0)?a:b,open[0]);}
function neighborhood(){
 const rec=recommended();
 const hot=GAMES.map(g=>{const unlocked=available(g.id,state.page).length>0,count=state.stats[g.id]?.correct||0;
  return `<button class="neighbor ${unlocked?'':'sleeping'} ${rec?.id===g.id?'inviting':''}" data-action="visit" data-game="${g.id}" style="--x:${g.x}%;--y:${g.y}%" aria-label="${esc(g.person)} — ${unlocked?'להתחיל לשחק':`נפתח בעמוד ${g.start}`}" aria-disabled="${!unlocked}"><span class="neighbor-bubble">${unlocked?pic(g.symbol):icon('lock')}<span class="mini-play">${icon(unlocked?'play':'lock')}</span></span><span class="neighbor-ring"></span><span class="neighbor-name">${g.person}${count?` <small>★ ${count}</small>`:''}</span></button>`;
 }).join('');
 const trail=Array.from({length:6},(_,i)=>`<span class="path-print" style="--i:${i}">✦</span>`).join('');
 return scene('neighborhood',hot+`<div class="map-trail" aria-hidden="true">${trail}</div>`,'map-scene')+controls('הַשְּׁכוּנָה שֶׁל עַלְמָה',{home:false,parents:true})+
 `<div class="map-invitation">${icon('play')} <span>לְחִיצָה עַל דְּמוּת פּוֹתַחַת מִשְׂחָק</span></div>${state.lastGame&&state.active?btn('resume','להמשיך מהמשחק האחרון',`${icon('undo')} לְהַמְשִׁיךְ`,'resume-button'):''}`;
}
function persistActive(){if(session&&!session.solved)state.active={game:session.game.id,id:session.q.id,round:session.round,helped:session.helped};else state.active=null;save();}
function createSession(id){
 const game=GAMES.find(g=>g.id===id);if(!game||!available(id,state.page).length)return false;
 const a=state.active?.game===id?state.active:null;
 const source=a?BANK[id].find(q=>q.id===a.id&&q.page<=state.page):null;
 const q=source?materialize(source):nextQuestion(state,id);
 session={game,q,round:source?a.round:0,helped:source?a.helped:false,solved:false,errors:0,wrong:[],demonstrating:false};
 persistActive();return true;
}
function begin(id){if(!createSession(id)){speak(SAY.locked);return;}go('play/'+id);}
function partMarkup(q){return q.parts.map((part,i)=>`<span class="word-part ${i===q.gap?'missing':''}">${i===q.gap&&!session.solved?'<span class="slot-spark">✦</span>':esc(part)}</span>`).join('');}
function puppetMarkup(q){
 return ['f','m'].map((sex,i)=>{
  const active=session.solved&&(!q.actor||q.actor==='both'||q.actor===sex);
  const pose=active?(['sing','whistle'].includes(q.animation)?3:q.animation==='dance'?2:['sit','think','sleep','read'].includes(q.animation)?1:0):q.animation==='sit'?0:1;
  return `<div class="puppet ${i?'boy':'girl'} ${active?'acting '+(q.animation||'bow'):''}" aria-hidden="true" style="background-position:${i*100}% ${pose/3*100}%"></div>`;
 }).join('');
}
function puzzle(q,game){
 if(game.id==='kitchen')return `<section class="puzzle kitchen-puzzle" aria-label="המילה להשלמה"><div class="recipe-picture">${pic(q.picture)}</div><div class="word-parts ${q.parts.length>2?'many-parts':''}" dir="rtl">${partMarkup(q)}</div></section>`;
 if(game.id==='garden')return `<section class="puzzle garden-puzzle"><button class="speech-bubble" data-action="hear-cue" aria-label="שמיעת מילת הרמז">${icon('volume')}${pic(q.picture)}<span class="sound-symbol">${q.type==='rhyme'?'♫':q.type==='ending'?'←':'→'}</span></button><div class="garden-growth" aria-hidden="true">${Array.from({length:Math.min(state.stats.garden?.correct||0,7)},(_,i)=>`<span style="--i:${i}">🌷</span>`).join('')}</div></section>`;
 if(game.id==='workshop')return `<section class="puzzle workshop-puzzle"><div class="workshop-cue">${q.picture?pic(q.picture):q.type==='stamp'?`<span class="mark-hint">${esc(q.prompt.split('עִם ')[1]||'')}</span>`:''}</div><div class="workshop-sign ${q.display?.length>10?'compact':''}">${q.type==='stamp'?`<span class="letter-base">${esc(session.solved?q.completion:q.base)}</span>${!session.solved?'<span class="stamp-slot">✦</span>':''}`:`<span class="formula" dir="rtl">${esc(q.display||'◌')}</span>`}</div></section>`;
 if(game.id==='boat')return `<section class="puzzle boat-puzzle"><div class="cargo-label">${esc(q.label)}</div>${session.solved?'<div class="flying-parcel" aria-hidden="true">🎁</div>':''}</section>`;
 if(game.id==='theater')return puppetMarkup(q)+`<section class="puzzle theater-puzzle"><div class="script-line ${q.sentence.length>25?'compact':''}" dir="rtl">${esc(q.sentence).replace('____',`<span class="script-gap">${session.solved?esc(q.target):'✦'}</span>`)}</div></section><div class="stage-action ${session.solved?'performing':''} ${q.animation||'bow'}" aria-hidden="true"><span>${pic(q.picture||'🎵')}</span></div>`;
 return `<section class="puzzle library-puzzle"><div class="book-text ${q.story?.length>70?'long':''}">${q.story?`<p>${esc(q.story)}</p>`:q.picture?`<div class="book-picture">${pic(q.picture)}</div>`:''}<h2>${esc(q.prompt)}</h2></div></section>`;
}
function answerMarkup(q,g){
 const images=q.auditory||['picture-delivery','owner','recipient'].includes(q.type)||!!q.options?.[0]?.picture||['what','who','where'].includes(q.type);
 return `<div class="answers ${g.id}-answers ${images?'image-answers':''}" role="group" aria-label="אפשרויות תשובה" style="--choices:${q.choices.length}">${q.choices.map((o,i)=>{
 const wrong=session.wrong.includes(i),correct=session.solved&&o.text===q.target;
 return `<div class="answer-wrap ${wrong?'tried':''} ${correct?'chosen':''}"><button class="answer ${g.id==='garden'?'seed-packet':''}" data-action="answer" data-index="${i}" aria-label="${esc(o.text)}" ${session.solved||wrong?'disabled':''}>${images&&o.picture?pic(o.picture):''}<span class="answer-text ${images&&o.picture?'picture-caption':''}">${images&&o.picture&&q.auditory?'':esc(o.text)}</span>${correct?`<span class="answer-tick">${icon('check')}</span>`:''}</button>${q.auditory?btn('hear-option',`שמיעת ${o.text}`,icon('volume'),'option-audio',`data-index="${i}" ${session.solved?'disabled':''}`):''}</div>`;
 }).join('')}</div>`;
}
function gameScreen(){
 const {q,game:g}=session;
 const earned=state.stats[g.id]?.correct||0;
 const reward=session.solved?`<div class="success-reaction" aria-hidden="true"><span>${g.symbol}</span><i>✦</i><i>✦</i><i>✦</i></div>`:'';
 const repair=g.id==='workshop'?`<div class="bridge-repairs" aria-hidden="true">${Array.from({length:Math.min(earned,5)},()=>'<i>✿</i>').join('')}</div>`:'';
 return scene(g.asset,puzzle(q,g)+answerMarkup(q,g)+reward+repair,`game-scene ${g.id}-scene ${session.solved?'solved':''}`)+controls(g.name,{game:true})+
 `<div class="round-progress" aria-label="התקדמות בסבב">${Array.from({length:SESSION_SIZE},(_,i)=>`<span class="${i<session.round+(session.solved?1:0)?'filled':''}">${icon('star')}</span>`).join('')}</div>
 <div class="instruction-strip" role="status">${session.solved?g.reward:esc(q.prompt)}</div>
 ${session.solved?btn('next','להמשיך',`${icon('left')}<span>${session.round+1===SESSION_SIZE?'סִיַּמְנוּ!':'עוֹד אֶחָד'}</span>`,'next-button'):btn('demo','הדגמה — איך משחקים',icon('play'),'demo-button')}`;
}
function finishScreen(){
 const g=session.game,score=state.stats[g.id]?.correct||0;
 return scene(g.asset,'','finish-scene')+`<section class="finish-card"><div class="finish-symbol">${pic(g.symbol)}</div><h1>${g.reward}</h1><p>אֵיזֶה כֵּיף לְשַׂחֵק יַחַד!</p><div class="celebration-stars">★ ★ ★</div><div class="finish-actions">${btn('again','עוד סבב אצל '+g.person,`${icon('play')} עוֹד סִבּוּב`,'start-button')}${btn('home','לבחור חבר אחר',`${icon('home')} לַשְּׁכוּנָה`,'secondary-button')}</div><small>${score} ${g.verb} בשכונה שלך</small></section>`+controls('',{home:true});
}
function render(){
 clearTimeout(transitionTimer);voice.stop();const [page,id]=path();
 document.documentElement.classList.toggle('reduced-motion',!state.motion);
 if(page==='play'){
  if(!session||session.game.id!==id||session.finished){if(!createSession(id)){location.hash='map';return;}}
  app.innerHTML=gameScreen();
 }else if(page==='finish'&&session)app.innerHTML=finishScreen();
 else if(['map','garden','learn'].includes(page))app.innerHTML=neighborhood();
 else {session=null;app.innerHTML=welcome();}
 app.insertAdjacentHTML('beforeend','<div id="toast" role="status" aria-live="polite"></div><div id="modal-root"></div><div id="live-result" class="sr-only" role="status" aria-live="polite"></div>');
 if(!storageOK)notify('השמירה אינה זמינה. אפשר להמשיך לשחק.');
 if(page==='play'){
  speak(instruction(session.q));
  if(!state.tutorials[session.game.id]){state.tutorials[session.game.id]=true;save();showDemo(false);}
 }else if(page==='map')speak(SAY.map);
 else if(page==='finish')speak(SAY.finish);
}
function showDemo(withSpeech=true){
 if(!session||session.solved)return;
 document.querySelectorAll('.answer').forEach(el=>{el.classList.remove('tap-demo');void el.offsetWidth;el.classList.add('tap-demo');});
 const el=document.createElement('div');el.className='touch-demo';el.setAttribute('aria-hidden','true');el.textContent='☝';document.querySelector('.answers')?.append(el);
 setTimeout(()=>el.remove(),2600);
 if(withSpeech)speak(instruction(session.q),true);
}
function answer(i){
 if(!session||session.solved||session.wrong.includes(i))return;
 const q=session.q,o=q.choices[i];if(!o)return;
 voice.stop();
 if(o.text!==q.target){
  session.errors++;session.helped=true;session.wrong.push(i);persistActive();
  const wrap=document.querySelectorAll('.answer-wrap')[i];wrap.classList.add('tried','wiggle');wrap.querySelector('.answer').disabled=true;
  document.querySelector('#live-result').textContent='ננסה שוב';speak([SAY.retry,...(session.errors>=2?helpSpeech(q):[])]);
  if(session.errors>=2)document.querySelectorAll('.answer')[q.choices.findIndex(x=>x.text===q.target)]?.classList.add('gentle-hint');
  return;
 }
 session.solved=true;recordSuccess(state,session.game.id,session.helped);state.active=null;save();
 app.innerHTML=gameScreen()+'<div id="toast" role="status" aria-live="polite"></div><div id="modal-root"></div><div id="live-result" class="sr-only" role="status" aria-live="polite">תשובה נכונה</div>';
 if(session.game.id==='boat')document.querySelector('.flying-parcel')?.style.setProperty('--dock',i===0?'70%':'-42%');
 speak([SAY.correct,q.word||q.completed||q.explanation,session.game.reward]);
 document.querySelector('.next-button')?.focus({preventScroll:true});
}
function next(){
 if(!session?.solved)return;
 session.round++;
 if(session.round>=SESSION_SIZE){session.finished=true;state.stats[session.game.id].rounds++;save();go('finish');return;}
 session.q=nextQuestion(state,session.game.id);session.solved=false;session.helped=false;session.errors=0;session.wrong=[];persistActive();render();
}
function modal(html){
 modalFocus=document.activeElement;voice.stop();
 document.querySelector('#modal-root').innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">${btn('close-modal','סגירה',icon('close'),'modal-close')}${html}</section></div>`;
 document.querySelector('.modal button, .modal input')?.focus();
}
function parentGate(){modal('<h2 id="modal-title">כניסה להורים</h2><p>כדי לשנות את קצב הלימוד, פתרו:</p><label class="gate-label">כמה זה <b dir="ltr">7 + 5</b>? <input id="gate-answer" inputmode="numeric" type="text" autocomplete="off" maxlength="2"></label>'+btn('unlock-parents','פתיחת הגדרות','כניסה','secondary-button')+'<p id="gate-error" role="status"></p>');document.querySelector('#gate-answer').focus();}
function parents(){
 const rows=summary(state),total=Object.values(BANK).reduce((n,qs)=>n+qs.length,0);
 modal(`<h2 id="modal-title">השכונה של עלמה — להורים</h2><p>עד איזה עמוד אפשר לתרגל? תמיד אפשר לחזור לחומר שכבר נלמד.</p><label>לומדים עד עמוד <output id="page-value">${state.page}</output><input id="page-range" type="range" min="4" max="79" value="${state.page}"></label><label class="select-label">רמת הקושי<select id="difficulty"><option value="auto" ${state.level==='auto'?'selected':''}>הדרגתית — מתחילים פשוט ומתקדמים</option><option value="all" ${state.level==='all'?'selected':''}>כל הרמות עד העמוד שנבחר</option></select></label><div class="setting-toggles"><label><input id="sound-setting" type="checkbox" ${state.sound?'checked':''}> הקראה בקול של הילה</label><label><input id="motion-setting" type="checkbox" ${state.motion?'checked':''}> תנועה וחגיגות</label></div><p class="parent-note">${total} משימות במאגר. סדר המשימות והתשובות משתנה. משימות שכבר הוצגו נשמרות במכשיר, וחוזרות אחרי מיצוי המאגר הזמין ברמה הנוכחית.</p><table><thead><tr><th>משחק</th><th>זמינות</th><th>עצמאית</th><th>עם עזרה</th></tr></thead><tbody>${rows.map(g=>`<tr><td>${g.symbol} ${g.person}</td><td>${g.count}</td><td>${g.independent||0}</td><td>${g.helped||0}</td></tr>`).join('')}</tbody></table><p class="parent-note">ההוראות מנוסחות ללא פנייה בזכר או בנקבה. דוגמאות הלימוד שומרות על ההתאמה הדקדוקית לדמות. עזרה בקריאת תשובה או ניסיון נוסף נרשמים כהצלחה עם עזרה. הגדרות והתקדמות נשמרות בדפדפן הזה.</p><div class="parent-actions">${updateWaiting?btn('update','טעינת הגרסה החדשה','טעינת הגרסה החדשה','text-button'):''}${btn('save-parents','שמירת ההגדרות','שמירה וחזרה לשכונה','secondary-button')}${btn('install','הוספה למסך הבית','הוספה למסך הבית','text-button')}${btn('export','שמירת גיבוי','שמירת גיבוי','text-button')}${btn('import','טעינת גיבוי','טעינת גיבוי','text-button')}<input type="file" id="import-file" accept="application/json" hidden>${btn('reset-prompt','איפוס התקדמות','איפוס התקדמות','text-button')}</div><p class="offline-status" id="offline-status">${offlineReady?'המשחק מוכן גם ללא חיבור לרשת במכשיר הזה.':'התוכן נשמר למכשיר. בפתיחה הראשונה השאירו את המשחק פתוח עם חיבור לרשת.'}</p>`);
}
function closeModal(){document.querySelector('#modal-root').innerHTML='';modalFocus?.focus?.();}
async function install(){if(installEvent){await installEvent.prompt();installEvent=null;return;}modal('<h2 id="modal-title">המשחק במסך הבית</h2><p>בטאבלט Android: פתחו ב־Chrome את תפריט שלוש הנקודות, גללו למטה ובחרו <b>״התקנה ויצירת קיצור דרך״</b> או <b>״הוספה למסך הבית״</b>.</p><p>ב־iPad: ב־Safari לחצו על שיתוף ובחרו ״הוספה למסך הבית״.</p>');}
app.addEventListener('click',async event=>{
 const el=event.target.closest('[data-action]');if(!el||el.disabled)return;
 switch(el.dataset.action){
  case 'enter': go('map');break;
  case 'home': if(session)persistActive();session=null;go('map');break;
  case 'visit': begin(el.dataset.game);break;
  case 'resume': begin(state.active?.game||state.lastGame);break;
  case 'answer': answer(Number(el.dataset.index));break;
  case 'next': next();break;
  case 'again': {const id=session.game.id;state.active=null;session=null;begin(id);break;}
  case 'repeat': speak(session&&path()[0]==='play'?instruction(session.q):path()[0]==='map'?SAY.map:SAY.welcome,true);break;
  case 'hear-cue': speak(session.q.cue,true);break;
  case 'hear-option': speak(session.q.choices[Number(el.dataset.index)].text,true);break;
  case 'help': if(!session.solved){session.helped=true;persistActive();document.querySelectorAll('.answer').forEach(e=>e.classList.add('help-available'));speak(helpSpeech(session.q),true);if(++session.errors>=2)document.querySelectorAll('.answer')[session.q.choices.findIndex(o=>o.text===session.q.target)]?.classList.add('gentle-hint');}break;
  case 'demo': showDemo();break;
  case 'sound': state.sound=!state.sound;save();render();break;
  case 'parents': parentGate();break;
  case 'unlock-parents': if(document.querySelector('#gate-answer').value.trim()==='12')parents();else document.querySelector('#gate-error').textContent='נסו שוב';break;
  case 'close-modal': closeModal();break;
  case 'save-parents': state.page=Number(document.querySelector('#page-range').value);state.sound=document.querySelector('#sound-setting').checked;state.motion=document.querySelector('#motion-setting').checked;state.level=document.querySelector('#difficulty').value;state.active=null;save();session=null;go('map');break;
  case 'reset-prompt': modal('<h2 id="modal-title">להתחיל מחדש?</h2><p>כל ההתקדמות והמשימות שכבר נראו בשכונה יימחקו מהמכשיר הזה.</p>'+btn('reset-confirm','איפוס ההתקדמות','כן, להתחיל מחדש','secondary-button')+btn('unlock-back','ביטול','ביטול','text-button'));break;
  case 'unlock-back': parents();break;
  case 'reset-confirm': state=freshState({page:state.page,sound:state.sound});save();session=null;go('home');break;
  case 'export': {const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='alma-neighborhood-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);break;}
  case 'import': document.querySelector('#import-file').click();break;
  case 'confirm-import': if(pendingImport){state=pendingImport;pendingImport=null;session=null;save();go('map');}break;
  case 'install': await install();break;
  case 'update': reloadForUpdate=true;updateWaiting?.postMessage({type:'SKIP_WAITING'});break;
 }
});
app.addEventListener('change',async e=>{
 if(e.target.id!=='import-file')return;
 try{const file=e.target.files[0];if(!file||file.size>2000000)throw new Error();const raw=JSON.parse(await file.text());if(raw.version!==2||!raw.stats)throw new Error();pendingImport=cleanState(raw);modal('<h2 id="modal-title">לטעון את הגיבוי?</h2><p>הגיבוי יחליף את ההתקדמות השמורה במכשיר הזה.</p>'+btn('confirm-import','טעינת הגיבוי','טעינת הגיבוי','secondary-button')+btn('unlock-back','ביטול','ביטול','text-button'));}catch{notify('הקובץ אינו גיבוי תקין של השכונה של עלמה.');}
});
app.addEventListener('input',e=>{if(e.target.id==='page-range')document.querySelector('#page-value').value=e.target.value;});
document.addEventListener('keydown',e=>{
 const dlg=document.querySelector('.modal');if(!dlg)return;
 if(e.key==='Escape')closeModal();
 if(e.key==='Enter'&&e.target.id==='gate-answer')document.querySelector('[data-action="unlock-parents"]').click();
 if(e.key==='Tab'){const focus=[...dlg.querySelectorAll('button,input,select,a')].filter(x=>!x.disabled);if(e.shiftKey&&document.activeElement===focus[0]){e.preventDefault();focus.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===focus.at(-1)){e.preventDefault();focus[0].focus();}}
});
window.addEventListener('hashchange',render);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;});
window.addEventListener('pagehide',()=>{voice.stop();if(session&&!session.solved)persistActive();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)voice.stop();});
if('serviceWorker'in navigator){
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloadForUpdate)location.reload();});
 navigator.serviceWorker.ready.then(()=>{offlineReady=true;const status=document.querySelector('#offline-status');if(status)status.textContent='המשחק מוכן גם ללא חיבור לרשת במכשיר הזה.';});
 navigator.serviceWorker.register('./sw.js').then(reg=>{
  const readyUpdate=()=>{if(reg.waiting){updateWaiting=reg.waiting;notify('גרסה חדשה מוכנה. היא תופיע בפתיחה הבאה.');}};
  readyUpdate();reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',readyUpdate));
 }).catch(()=>{});
}
render();
