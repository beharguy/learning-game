import { lessons, chapters, modes } from './curriculum.js';
import { STORAGE_KEY, newState, cleanState, questionSpeech, availableModes, roundQuestions, buildQuestions, memoryCards, recordRound, blooms, recommendedLesson, recommendedActivity } from './engine.js';
import { icon, mascot, plant, visual } from './art.js';
import { GUIDE, DEMOS, instructionSpeech } from './narration.js';
import { VoicePlayer } from './voice-player.js';

const app=document.querySelector('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=newState(), storageOK=true, session=null, installPrompt=null, lastFocus=null;
let offlineReady=false;
const voicePlayer=new VoicePlayer(new Audio(),()=>toast('לַחֲצִי עַל הָרַמְקוֹל כְּדֵי לִשְׁמֹעַ שׁוּב.'));
voicePlayer.audio.id='narration-audio';
voicePlayer.audio.hidden=true;
document.body.append(voicePlayer.audio);
try { state=cleanState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')); } catch { storageOK=false; }

function save() { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); } catch { storageOK=false; toast('הַהִתְקַדְּמוּת לֹא נִשְׁמְרָה. אֶפְשָׁר לְהַמְשִׁיךְ לְשַׂחֵק.'); } }
function route() { return (location.hash.slice(1)||'home').split('/'); }
function go(path) { if(location.hash===`#${path}`)render(); else location.hash=path; }
function cancelAudio(){voicePlayer.stop();}
function speak(text,force=false){return voicePlayer.play(Array.isArray(text)?text:[text],{enabled:state.sound,force});}
function narrate(){if(session)speak(instructionSpeech(session));}
function toast(text) { const el=document.querySelector('#toast');if(!el)return;el.textContent=text;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),4500); }
const flowerCount=n=>n===1?'פרח אחד':`${n} פרחים`;
const gameCount=n=>n===1?'משחקון אחד':`${n} משחקונים`;
const pageLabel=l=>`עמ׳ ${l.start}–${l.end}`;
const button=(action,text,cls='button',data='')=>`<button class="${cls}" data-action="${action}" ${data}>${text}</button>`;
function chrome(content,tab='home') {
  return `<div class="site-shell"><header class="topbar">
    <a class="brand" href="#home" aria-label="גינת המילים — דף הבית"><span class="brand-mark">${icon('sprout')}</span><span>גינת המילים<small>מְשַׂחֲקִים. מְגַלִּים. צוֹמְחִים.</small></span></a>
    <nav class="desktop-nav" aria-label="ניווט ראשי">${nav(tab)}</nav>
    <div class="header-actions">${button('sound',icon(state.sound?'volume':'mute'),'icon-button',`aria-label="${state.sound?'כיבוי':'הפעלת'} צליל" aria-pressed="${state.sound}"`)}${button('parents',`${icon('settings')}<span>להורים</span>`,'parent-button','aria-label="להורים"')}</div>
  </header><main id="main" tabindex="-1">${content}</main>
  <footer class="site-footer"><span>${icon('heart')} כל צעד קטן מצמיח משהו גדול.</span><button data-action="install">${icon('download')} הוספה למסך הבית</button></footer>
  <nav class="mobile-nav" aria-label="ניווט בטאבלט">${nav(tab)}</nav></div><div id="toast" class="toast" role="status" aria-live="polite"></div><div id="modal-root"></div>`;
}
function nav(tab) { return [['home','home','הַבַּיִת'],['learn','book','הַמַּסְלוּל שֶׁלִּי'],['garden','flower','הַגִּנָּה שֶׁלִּי']].map(([id,i,t])=>`<a href="#${id}" class="nav-link ${tab===id?'active':''}" ${tab===id?'aria-current="page"':''}>${icon(i)}<span>${t}</span></a>`).join(''); }
function statBar() { return `<div class="progress-strip"><span>${icon('book')} לפי החוברת <strong>קסם וחברים 2</strong></span><button data-action="parents">${state.page===79?'כל החוברת פתוחה':`לומדים עד עמ׳ ${state.page}`} ${icon('settings')}</button><span>${icon('flower')} <strong>${flowerCount(blooms(state))}</strong> בגינה</span></div>`; }
function home() {
  const recommended=recommendedLesson(state);
  const chapter=chapters.find(c=>recommended.start>=c.start&&recommended.start<=c.end);
  return chrome(`<section class="hero">
    <div class="hero-copy"><div class="eyebrow"><span class="small-dot"></span> גִּנָּה קְטַנָּה. תַּגְלִיּוֹת גְּדוֹלוֹת.</div>
      <h1>עוֹד מִלָּה, <br>וְהַגִּנָּה <span>פּוֹרַחַת.</span></h1>
      <p>בּוֹאִי לְשַׂחֵק עִם מִלִּים, <br>לְגַלּוֹת צְלִילִים וּלְהַצְמִיחַ פְּרָחִים.</p>
      <button class="button primary hero-cta" data-action="quick-start">${icon('play')} בּוֹאִי נְשַׂחֵק ${icon('left')}</button><button class="welcome-audio" data-action="welcome-audio" aria-label="שמיעת ברכה והסבר">${icon('volume')} לִשְׁמֹעַ</button>
      <div class="hero-note">${icon('clock')} משחק קטן של 2–4 דקות <span>·</span> בקצב שלך</div>
    </div>
    <div class="hero-art"><div class="art-sun"></div><span class="floating-letter letter-one">אַ</span><span class="floating-letter letter-two">מָ</span><span class="floating-letter letter-three">תַ</span><span class="art-spark">✦</span>${mascot()}<div class="hello-bubble">הַי, אֲנִי נִצָּן!<span>נְגַלֶּה יַחַד?</span></div><div class="art-ground"></div><div class="art-plant">${plant(0)}</div></div>
  </section>${statBar()}
  ${!storageOK?'<p class="storage-warning" role="status">השמירה בדפדפן אינה זמינה. המשחק עובד, אבל ההתקדמות עלולה להיעלם בסגירה.</p>':''}
  <section class="home-lower"><div class="next-section"><div class="section-heading"><div><span class="eyebrow">צַעַד קָטָן לַהַתְחָלָה</span><h2>הַתַּחֲנָה הַבָּאָה שֶׁלָּךְ</h2></div><a class="text-link" href="#learn">לכל המסלול ${icon('left')}</a></div>
  <a class="next-card ${recommended.color}" href="#lesson/${recommended.id}"><span class="lesson-badge">${esc(recommended.badge)}</span><div><span class="card-overline">${chapter.title} · ${pageLabel(recommended)}</span><h3>${esc(recommended.title)}</h3><p>${esc(recommended.subtitle)}</p><span class="mini-games">${gameCount(availableModes(recommended,state.page).length)} ${availableModes(recommended,state.page).length===1?'מחכה':'מחכים'} לך</span></div><span class="round-arrow">${icon('left')}</span></a></div>
  <a class="garden-peek" href="#garden"><div><span class="eyebrow">מַשֶּׁהוּ טוֹב צוֹמֵחַ פֹּה</span><h3>הַגִּנָּה שֶׁלִּי</h3><p>${blooms(state)?`${flowerCount(blooms(state))} כבר ${blooms(state)===1?'צמח':'צמחו'}. בואי לבקר!`:'כל משחק חדש מצמיח פרח קטן.'}</p><span class="text-link">נכנסים לגינה ${icon('left')}</span></div><div class="peek-plants">${plant(0)}${plant(2)}${plant(1)}</div></a></section>
  <section class="chapter-preview"><div class="section-heading"><h2>מַה נְגַלֶּה בַּדֶּרֶךְ?</h2><span>22 תחנות, מהאות הראשונה ועד סיפור שלם</span></div><div class="chapter-tiles">${chapters.map((c,i)=>`<a href="#learn/chapter-${i}" class="chapter-tile"><span class="chapter-icon chapter-${i}">${icon(c.icon)}</span><div><h3>${c.title}</h3><p>עמ׳ ${c.start}–${c.end}</p></div>${icon('left')}</a>`).join('')}</div></section>`);
}
function learn() {
  return chrome(`<div class="page-heading"><span class="eyebrow">בַּקֶּצֶב שֶׁלָּךְ</span><h1>הַמַּסְלוּל שֶׁלִּי</h1><p>בוחרים נושא לפי העמוד בחוברת. תמיד אפשר לחזור ולשחק שוב.</p></div>${statBar()}<div class="chapter-jump">${chapters.map((c,i)=>`<button data-action="chapter" data-index="${i}">${icon(c.icon)} ${c.title}</button>`).join('')}</div>
  ${chapters.map((c,i)=>`<section class="chapter-section" id="chapter-${i}"><div class="section-heading"><div class="chapter-title"><span class="chapter-icon chapter-${i}">${icon(c.icon)}</span><div><span class="eyebrow">פרק ${i+1} · עמ׳ ${c.start}–${c.end}</span><h2>${c.title}</h2><p>${c.subtitle}</p></div></div></div><div class="lesson-grid">${lessons.filter(l=>l.start>=c.start&&l.start<=c.end).map(l=>{
    const locked=l.start>state.page, played=Object.keys(state.completed[l.id]||{}).length;
    return `<${locked?'div':'a'} ${locked?'':`href="#lesson/${l.id}"`} class="lesson-card ${l.color} ${locked?'locked':''}"><div class="lesson-card-top"><span class="lesson-badge">${esc(l.badge)}</span><span class="page-pill">${pageLabel(l)}</span></div><h3>${esc(l.title)}</h3><p>${esc(l.subtitle)}</p><div class="lesson-card-bottom"><span>${locked?`${icon('lock')} נפתח בעמ׳ ${l.start}`:played?`${icon('flower')} ${flowerCount(played)} ${played===1?'צמח':'צמחו'} כאן`:gameCount(availableModes(l,state.page).length)}</span>${locked?'':icon('left')}</div></${locked?'div':'a'}>`;
  }).join('')}</div></section>`).join('')}`,'learn');
}
function formula(parts,result='') {
  return `<div class="reading-formula" dir="rtl" aria-label="קוראים את החלקים מימין לשמאל">${parts.map((part,i)=>`${i?'<span class="formula-plus" aria-hidden="true">+</span>':''}<span class="reading-part">${esc(part)}</span>`).join('')}${result?`<span class="formula-equals">=</span><strong class="reading-result">${esc(result)}</strong>`:''}</div>`;
}
function learningCard(lesson){
  const r=lesson.rule;
  if(!r)return '';
  // A rule can mention later material; use only its introduction before then.
  const early=r.examplePage&&state.page<r.examplePage;
  const text=early?(lesson.id==='shva'?'שְׁוָא הוּא שְׁתֵּי נְקֻדּוֹת זוֹ מֵעַל זוֹ. נִקְרָא אוֹתוֹ בְּתוֹךְ מִלִּים.':'לְמִי? לְתָמָר.'):r.text;
  return `<aside class="learning-card"><div><span class="eyebrow">לוֹמְדִים רֶגַע</span><h2>${r.title}</h2><p>${text}</p><button class="listen-word" data-action="rule-audio" data-lesson="${lesson.id}">${icon('volume')} לִשְׁמֹעַ אֶת הַהֶסְבֵּר</button></div><div class="rule-example">${early?`<span class="reading-part">${lesson.id==='shva'?'◌ְ':'לְ'}</span>`:(r.result?formula(r.example,r.result):`<div class="example-variants">${r.example.map(x=>`<span class="reading-part">${esc(x)}</span>`).join('')}</div>`)}${!early&&r.result?`<button class="listen-word" data-action="example-audio" data-lesson="${lesson.id}">${icon('volume')} לִשְׁמֹעַ אֶת הַמִּלָּה</button>`:''}${r.symbols?'<span class="rule-label">קָמַץ · פַּתָּח</span>':''}</div></aside>`;
}
function lessonView(lesson) {
  if(lesson.start>state.page)return chrome(`<div class="empty-state">${icon('lock')}<h1>עוד מעט מגיעים לכאן</h1><p>הנושא מתחיל בעמוד ${lesson.start}. אפשר לשנות את העמוד באזור ההורים.</p><a class="button primary" href="#learn">בחזרה למסלול</a></div>`,'learn');
  const available=availableModes(lesson,state.page);
  return chrome(`<a class="back-link" href="#learn">${icon('arrow')} בחזרה למסלול</a><section class="lesson-hero ${lesson.color}"><div><span class="eyebrow">${pageLabel(lesson)} · קסם וחברים 2</span><h1>${esc(lesson.title)}</h1><p>${esc(lesson.subtitle)}</p></div><span class="big-letter">${esc(lesson.badge)}</span></section>
  <button class="button primary lesson-start" data-action="quick-start" data-lesson="${lesson.id}">${icon('play')} בּוֹאִי נְשַׂחֵק ${icon('left')}</button>${learningCard(lesson)}<div class="section-heading"><h2>בְּמָה נְשַׂחֵק הַיּוֹם?</h2><span>${icon('clock')} 2–4 דקות לכל משחק</span></div><div class="mode-grid">${available.map((mode,i)=>`<button class="mode-card mode-${i}" data-action="start" data-lesson="${lesson.id}" data-mode="${mode}"><span class="mode-icon">${icon(modes[mode].icon)}</span><h3>${modes[mode].title}</h3><p>${modes[mode].description}</p><span class="mode-footer">${state.completed[lesson.id]?.[mode]?`${icon('flower')} נשחק שוב`:'בּוֹאִי נַתְחִיל'} ${icon('left')}</span></button>`).join('')}</div><div class="gentle-note">${icon('heart')} אין שעון ואין ניקוד שיורד. אפשר להקשיב, להיעזר ולנסות שוב.</div>${state.page<lesson.end?`<p class="page-note">מוצגים רק תרגילים עד עמוד ${state.page}. המשך התחנה ייפתח כשתעדכנו את העמוד.</p>`:''}`,'learn');
}
function garden() {
  const earned=lessons.flatMap(l=>Object.keys(state.completed[l.id]||{}).map(mode=>({lesson:l,mode})));
  return chrome(`<div class="page-heading"><span class="eyebrow">כָּל פֶּרַח הוּא תַּגְלִית</span><h1>הַגִּנָּה שֶׁלִּי</h1><p>${earned.length?`${flowerCount(earned.length)} ${earned.length===1?'צמח':'צמחו'} בזכות המשחקים שלך. איזה כיף לראות את הגינה גדלה!`:'הגינה מחכה לפרח הראשון שלך. כל משחק חדש שתסיימי יוסיף פרח.'}</p></div><div class="garden-board">${earned.length?earned.map((e,i)=>`<button class="garden-flower" data-action="flower" data-lesson="${e.lesson.id}" data-mode="${e.mode}" aria-label="פרח: ${esc(e.lesson.title)} — ${esc(modes[e.mode].title)}">${plant(i)}<span>${esc(e.lesson.title)}</span></button>`).join(''):`<div class="empty-garden">${mascot()}<h2>נַצְמִיחַ פֶּרַח רִאשׁוֹן?</h2><a class="button primary" href="#learn">בּוֹאִי נְשַׂחֵק ${icon('left')}</a></div>`}</div><div class="gentle-note">${icon('heart')} אפשר לשחק שוב בכל משחק. הפרחים שכבר צמחו נשארים בגינה.</div>`,'garden');
}
function begin(lessonId,mode) {
  const lesson=lessons.find(l=>l.id===lessonId);
  if(!lesson||!availableModes(lesson,state.page).includes(mode))return;
  session={lesson,mode,index:0,feedback:null,selected:null,hint:false,wrong:[],chosen:[],flipped:[],matched:[],turns:0,recorded:false,demo:!state.tutorials[mode],demoStep:0,
    questions:['discover','vowels'].includes(mode)?roundQuestions(lesson,state.page,Math.random,mode):mode==='build'?buildQuestions(lesson,state.page):memoryCards(lesson,state.page,Math.random,state.completed[lessonId]?.memory?3:2)};
  state.lastLesson=lesson.id;save();go(`play/${lessonId}/${mode}`);narrate();
}
function demonstration(){
  const s=session,q=s.questions[s.index],step=s.demoStep;
  let scene='';
  if(s.mode==='build'){
    scene=`<div class="demo-object">${visual(q.emoji)}</div><div class="demo-parts">${q.parts.map((part,i)=>`<span class="demo-tile ${step>0?'placed':''}" style="--delay:${i*.4}s">${step>0?esc(part):'·'}</span>`).join('')}</div>${step>1?`<div class="reading-result">${esc(q.text)} ${icon('check')}</div>`:`<span class="demo-hand" aria-hidden="true">☝️</span>`}`;
  }else if(s.mode==='memory'){
    const first=s.questions[0].pair,t=s.questions.find(c=>c.pair===first&&c.side==='text'),p=s.questions.find(c=>c.pair===first&&c.side==='picture');
    scene=`<div class="demo-link"><div class="demo-tile ${step>0?'placed':''}"><small>${esc(t.cue)}</small>${esc(t.text)}</div><span class="demo-connector ${step>0?'connected':''}">↔</span><div class="demo-tile demo-picture ${step>0?'placed':''}">${visual(p.emoji)}</div></div>${step>0?icon('check'):'<span class="demo-hand" aria-hidden="true">☝️</span>'}`;
  }else{
    const exampleChoices=q.choices.filter(a=>a.text===q.target||a===q.choices.find(c=>c.text!==q.target));
    scene=`<p class="demo-question">${esc(q.prompt)}</p>${q.formula?formula(q.formula):q.emoji?`<div class="demo-object">${visual(q.emoji)}</div>`:`<div class="demo-object">${icon('book')}</div>`}<div class="demo-choices">${exampleChoices.map(a=>`<span class="demo-tile ${step>0&&a.text===q.target?'placed selected-demo':''}">${a.emoji?`<small>${a.emoji}</small>`:''}${esc(a.text)}${step>0&&a.text===q.target?'<span class="demo-pointer" aria-hidden="true">☝️</span>':''}</span>`).join('')}</div>`;
  }
  return `<div class="play-shell"><header class="play-header">${button('exit',`${icon('close')}<span>חזרה</span>`,'exit-button')}<span class="demo-top-label">${modes[s.mode].title}</span>${button('sound',icon(state.sound?'volume':'mute'),'icon-button',`aria-label="${state.sound?'כיבוי':'הפעלת'} צליל"`)}</header><main class="game-panel tutorial-panel"><span class="skill-label">נַנְסֶה יַחַד</span><h1>${['מַקְשִׁיבוֹת','רוֹאוֹת אֵיךְ','עַכְשָׁו תּוֹרֵךְ!'][step]}</h1><div class="demo-dots" aria-label="שלב ${step+1} מתוך 3">${[0,1,2].map(i=>`<span class="${i===step?'current':''}"></span>`).join('')}</div><div class="demo-scene">${scene}</div><p class="demo-caption">${DEMOS[s.mode][step]}</p><div class="demo-controls">${button('demo-replay',icon('volume'),'icon-button','aria-label="שמיעת ההדגמה שוב"')}${button(step===2?'demo-done':'demo-next',`${step===2?'בּוֹאִי נְשַׂחֵק':'מַמְשִׁיכוֹת'} ${icon('left')}`,'button primary')}</div>${button('demo-done','אֲנִי כְּבָר מַכִּירָה','text-button')}</main></div><div id="toast" class="toast" role="status"></div><div id="modal-root"></div>`;
}
function game() {
  if(!session)return chrome(`<div class="empty-state"><h1>נַתְחִיל סִיבוּב חָדָשׁ?</h1><p>סיבובים שהושלמו נשמרו בגינה שלך.</p><a class="button primary" href="#learn">בוחרים משחק</a></div>`,'learn');
  if(session.demo)return demonstration();
  const s=session,q=s.questions[s.index],choice=['discover','vowels'].includes(s.mode),correct=s.feedback==='correct';
  const pairs=s.mode==='memory'?s.questions.length/2:0,total=pairs||s.questions.length,progress=pairs?s.matched.length:s.index;
  const title=choice?q.prompt:s.mode==='build'?'חַבְּרִי חֲלָקִים לְמִלָּה.':'מָה מַתְאִים לְמָה?';
  let body='';
  if(choice){
    body=`${q.story?`<div class="story-box">${esc(q.story)}</div>`:''}${q.sentence?`<div class="sentence">${esc(q.sentence).replace('____','<span class="blank">?</span>')}</div>`:''}
      ${q.formula?formula(q.formula):''}${q.markName?`<p class="mark-name">${esc(q.markName)}</p>`:''}
      ${q.model?`<div class="model-letter">${esc(q.model)}</div>`:''}${q.emoji?`<div class="question-emoji" aria-hidden="true">${visual(q.emoji)}</div>`:''}
      ${q.hideLabel?`<button class="listen-word prominent-listen" data-action="word-audio">${icon('volume')} הַקְשִׁיבִי לַמִּלָּה</button>${correct||s.hint?`<div class="revealed-word">${esc(q.label||q.audio)}</div>`:''}`:q.label?`<div class="word-label">${esc(q.label)} ${button('word-audio',icon('volume'),'audio-inline','aria-label="שמיעת המילה"')}</div>`:''}
      <div class="answers ${q.choices.length===2?'two':''}">${q.choices.map((a,i)=>`<button data-action="answer" data-index="${i}" class="answer ${correct&&a.text===q.target?'correct':''} ${s.wrong.includes(a.text)?'tried':''}" ${correct?'disabled':''}>${a.emoji?`<span class="answer-emoji" aria-hidden="true">${a.emoji}</span>`:''}<span>${esc(a.text)}</span>${correct&&a.text===q.target?icon('check'):''}</button>`).join('')}</div>`;
  }else if(s.mode==='build') {
    body=`<p class="skill-caption">${q.challenge?'אֶתְגָּר קָטָן: יֵשׁ חֵלֶק אֶחָד מְיֻתָּר.':'קוֹרְאִים אֶת הַחֲלָקִים מִיָּמִין לִשְׂמֹאל.'}</p><div class="question-emoji" aria-hidden="true">${visual(q.emoji)}</div><button class="listen-word prominent-listen" data-action="word-audio">${icon('volume')} לִשְׁמֹעַ אֶת הַמִּלָּה</button>${q.clue?`<p class="build-clue">${esc(q.clue)}</p>`:''}
    <div class="build-slots" aria-label="המילה שהרכבת" dir="rtl">${q.parts.map((_,i)=>`<button class="letter-slot chunk-slot ${s.chosen[i]!==undefined?'filled':''}" data-action="remove-tile" data-index="${i}" aria-label="${s.chosen[i]!==undefined?'הסרת החלק':'מקום לחלק'} ${i+1}" ${correct?'disabled':''}>${s.chosen[i]!==undefined?esc(q.tiles.find(t=>t.id===s.chosen[i]).text):'<span>·</span>'}</button>`).join('')}</div>
    <div class="letter-bank">${q.tiles.map(t=>`<button class="letter-tile" data-action="tile" data-id="${t.id}" ${s.chosen.includes(t.id)||correct||s.chosen.length===q.parts.length?'disabled':''}>${esc(t.text)}</button>`).join('')}</div>
    ${correct?`<div class="joined-word"><span>יַחַד קוֹרְאִים</span><strong>${esc(q.text)}</strong>${button('word-audio',icon('volume'),'audio-inline','aria-label="שמיעת המילה השלמה"')}</div>`:s.hint?`<p class="word-hint">${s.hint>1?'הַמִּלָּה שֶׁלָּנוּ:':'הַחֵלֶק הָרִאשׁוֹן:'}<strong>${esc(s.hint>1?q.text:q.parts[0])}</strong></p>`:''}`;
  }else{
    body=`<p class="memory-instruction">בַּחֲרִי כַּרְטִיס מִכָּל צַד וְחַבְּרִי בֵּינֵיהֶם.</p><div class="connection-board">${['text','picture'].map(side=>`<div class="connection-column"><span class="connection-heading">${side==='text'?'קוֹרְאִים':'מְחַבְּרִים לִתְמוּנָה'}</span>${s.questions.map((card,i)=>({card,i})).filter(({card})=>card.side===side).map(({card,i})=>{
      const matched=s.matched.includes(card.pair),selected=s.flipped.includes(i);
      return `<div class="connection-item"><button data-action="flip" data-index="${i}" class="connection-card ${matched?'matched':''} ${selected?'selected':''} ${selected&&s.feedback==='mismatch'?'mismatch':''}" ${matched||s.feedback?'disabled':''} aria-pressed="${selected}" aria-label="${side==='text'?esc(card.text+' '+card.cue):`תמונה ${s.questions.filter(c=>c.side==='picture').indexOf(card)+1}`}">${side==='text'?`<small>${esc(card.cue)}</small><span>${esc(card.text)}</span>`:`<span aria-hidden="true">${visual(card.emoji)}</span>`}${matched?icon('check'):''}</button>${side==='picture'?`<button class="connection-audio" data-action="pair-audio" data-index="${i}" aria-label="שמיעת שם התמונה ${s.questions.filter(c=>c.side==='picture').indexOf(card)+1}">${icon('volume')}</button>`:''}</div>`;
    }).join('')}</div>`).join('')}</div>`;
  }
  const explanation=correct&&choice?q.explanation:'';
  return `<div class="play-shell"><header class="play-header">${button('exit',`${icon('close')}<span>חזרה</span>`,'exit-button')}<div class="round-progress"><div class="progress-dots" aria-label="${progress} מתוך ${total} הושלמו">${Array.from({length:total},(_,i)=>`<span class="${i<progress?'done':i===progress?'current':''}">${i<progress?icon('check'):''}</span>`).join('')}</div><span>${esc(s.lesson.title)} · ${pageLabel(s.lesson)}</span></div>${button('sound',icon(state.sound?'volume':'mute'),'icon-button',`aria-label="${state.sound?'כיבוי':'הפעלת'} צליל"`)}</header>
    <main class="game-panel"><span class="skill-label">${modes[s.mode].title}</span><div class="game-title"><h1>${title}</h1>${button('prompt-audio',icon('volume'),'icon-button','aria-label="שמיעת ההוראה"')}</div>${body}
    <div class="feedback ${correct?'success':s.feedback?'retry':''}" role="status" aria-live="polite">${correct?`${icon('check')} ${s.mode==='memory'?'הַכַּרְטִיסִים מַתְאִימִים!':'כָּל הַכָּבוֹד!'}`:s.feedback==='wrong'?'עוֹד נִסָּיוֹן קָטָן. אֶפְשָׁר לְהֵעָזֵר בְּרֶמֶז.':s.feedback==='mismatch'?'נַקְשִׁיב וְנִקְרָא שׁוּב. נְנַסֶּה קֶשֶׁר אַחֵר.':' '}</div>
    ${explanation?`<div class="explanation">${q.revealEmoji?`<span aria-hidden="true">${visual(q.revealEmoji)}</span>`:''}<p>${esc(explanation)}</p>${button('explanation-audio',icon('volume'),'audio-inline','aria-label="שמיעת ההסבר"')}</div>`:''}
    <div class="game-controls">${s.mode!=='memory'?button('hint',`${icon('help')} ${s.mode==='build'&&s.hint?'עוֹד רֶמֶז':'רֶמֶז'}`,'button subtle',correct?'disabled':''):''}${s.mode==='build'&&!correct?button('check-build',`בּוֹדְקִים ${icon('check')}`,'button primary',s.chosen.length!==q.parts.length?'disabled':''):''}${correct?button('next',`${(pairs?s.matched.length===pairs:s.index===s.questions.length-1)?'סִיַּמְנוּ!':'מַמְשִׁיכוֹת'} ${icon('left')}`,'button primary next-button'):s.feedback==='mismatch'?button('hide-cards','נְנַסֶּה שׁוּב','button primary'):''}</div>
    ${s.hint&&choice&&!correct?`<div class="hint-box">${q.hintMark?`<strong class="hint-mark">${esc(q.hintMark)}</strong>`:''}${esc(q.hint||'אֶפְשָׁר לְהַקְשִׁיב שׁוּב וּלְבַקֵּשׁ עֶזְרָה.')} ${button('hint-audio',icon('volume'),'audio-inline','aria-label="שמיעת הרמז"')}</div>`:''}<button class="tutorial-help" data-action="demo-open">${icon('help')} אֵיךְ מְשַׂחֲקִים?</button></main><div class="play-caption">${icon('sprout')} צעד קטן, תגלית גדולה.</div></div><div id="toast" class="toast" role="status"></div><div id="modal-root"></div>`;
}
function finish() {
  if(!session)return;
  if(!session.recorded){state=recordRound(state,session.lesson.id,session.mode);save();session.recorded=true;}
  go(`done/${session.lesson.id}`);speak(GUIDE.finish);
}
function done() {
  if(!session?.recorded)return home();
  return chrome(`<section class="celebration"><div class="celebration-stars">✦ <span>✧</span> ✦</div><div class="celebration-plant">${plant(blooms(state)-1)}</div><span class="eyebrow">כָּל הַכָּבוֹד עַל הַהִתְנַסּוּת!</span><h1>עוֹד קְצָת, וְצָמַחְתְּ!</h1><p>סִיַּמְתְּ אֶת הַמִּשְׂחָק.<br>הַפֶּרַח שֶׁלָּךְ מְחַכֶּה לָךְ בַּגִּנָּה.</p><div class="finish-actions"><button class="button primary" data-action="quick-start">עוֹד מִשְׂחָק ${icon('left')}</button><a class="button secondary" href="#garden">לַגִּנָּה שֶׁלִּי ${icon('flower')}</a><a class="button secondary" href="#lesson/${session.lesson.id}">עוֹד מִשְׂחָק קָטָן ${icon('left')}</a></div><p class="break-note">וְאֶפְשָׁר גַּם לָנוּחַ. הַגִּנָּה תְּחַכֶּה לָךְ.</p></section>`,'garden');
}
function render() {
  const [page,id]=route();
  if(!['play','done'].includes(page))cancelAudio();
  app.innerHTML=page==='learn'?learn():page==='garden'?garden():page==='lesson'?lessonView(lessons.find(l=>l.id===id)||lessons[0]):page==='play'?game():page==='done'?done():home();
  document.title=page==='play'?'משחקים — גינת המילים':'גינת המילים — משחקים וצומחים בעברית';
}
function updateGame(focusSelector) { app.innerHTML=game();if(focusSelector)document.querySelector(focusSelector)?.focus({preventScroll:true}); }
function feedback(ok) {
  session.feedback=ok?'correct':'wrong';
  updateGame(ok?'.next-button':null);
  speak(ok?[GUIDE.correct,session.questions[session.index]?.explanation]:GUIDE.retry);
}
function dialog(title,body) {
  lastFocus=document.activeElement;
  document.querySelector('#modal-root').innerHTML=`<dialog class="modal" aria-labelledby="dialog-title"><div class="modal-header"><h2 id="dialog-title">${title}</h2>${button('close-modal',icon('close'),'icon-button','aria-label="סגירה"')}</div>${body}</dialog>`;
  const d=document.querySelector('dialog');d.addEventListener('close',()=>lastFocus?.focus());d.showModal();
}
function parentGate() { dialog('רגע קטן להורים',`<p>כדי להיכנס להגדרות, פתרו את התרגיל:</p><form id="parent-gate"><label for="gate-answer" class="math-label" dir="ltr">17 + 8 = ?</label><input id="gate-answer" type="text" inputmode="numeric" autocomplete="off" required aria-label="תשובה לתרגיל" autofocus/><p id="gate-error" role="status"></p><button class="button primary" type="submit">כניסה להגדרות</button></form>`); }
function settings() {
  dialog('הפינה של ההורים',`<form id="settings-form"><label for="page-number" class="setting-label">עד איזה עמוד בחוברת להציג משחקים?</label><p class="setting-help">79 פותח את כל המסלול. כל הנושאים הקודמים נשארים זמינים לחזרה. הגבלת העמוד לא מוחקת הישגים.</p><div class="page-setting"><input id="page-range" type="range" min="4" max="79" value="${state.page}" aria-label="עמוד בחוברת"/><input id="page-number" type="number" min="4" max="79" value="${state.page}" required aria-label="מספר עמוד בחוברת"/></div><p id="page-topic" class="page-topic">${esc(lessons.find(l=>state.page>=l.start&&state.page<=l.end)?.title)}</p><label class="checkbox-label"><input type="checkbox" name="sound" ${state.sound?'checked':''}/> צלילים והקראה</label><button class="button primary" type="submit">שמירת ההגדרות ${icon('check')}</button></form>
  <div class="settings-section"><h3>התקדמות</h3><p>${state.rounds===1?'משחק אחד הושלם':`${state.rounds} משחקים הושלמו`} · ${flowerCount(blooms(state))} בגינה.</p><p>ההתקדמות נשמרת בדפדפן ובמכשיר הזה. אפשר להעביר אותה לטאבלט באמצעות קובץ גיבוי.</p><div class="settings-buttons">${button('export','הורדת גיבוי','button secondary')}<label class="button secondary file-label">טעינת גיבוי<input type="file" id="import-progress" accept="application/json,.json"/></label></div></div>
  <div class="settings-section"><h3>בטאבלט</h3><p>המשחק מתאים למגע, לרוחב ולאורך. ${offlineReady?'המשחק מוכן גם לשימוש ללא חיבור.':'לאחר טעינה מלאה, המשחק יישמר גם לשימוש ללא חיבור.'}</p>${button('install','הוראות הוספה למסך הבית','button secondary')}</div>
  <div class="settings-section"><h3>על התוכן</h3><p>22 תחנות לפי עמודים 4–79 בחוברת ״קסם וחברים 2״. התרגילים והאיורים במשחק נוצרו במיוחד למשחק. משחקי הצלילים נעזרים בהקראת מילים שלמות; לא נדרשת הבחנה שמיעתית בין קמץ לפתח.</p><p>להיכרות ראשונה מומלץ לשחק יחד סיבוב קצר. הקול הוא ״הילה״, קול נשי מסונתז בעברית בקצב רגוע. ההוראות מוקראות בתחילת כל תרגיל; המילים לתרגול קריאה מוקראות לפי בקשה. לכל סוג משחק יש הדגמה קצרה שאפשר לשמוע שוב.</p></div>
  <div class="settings-section">${button('reset-confirm','איפוס ההתקדמות במכשיר הזה','text-button danger')}</div>`);
}
function installHelp() {
  dialog('המשחק במסך הבית',`${installPrompt?button('install-now',`${icon('download')} הוספת המשחק`,'button primary'):''}<div class="install-step"><span>1</span><div><h3>פותחים את הקישור הקבוע</h3><p>אחרי פריסה לענן, פותחים בטאבלט את כתובת המשחק.</p></div></div><div class="install-step"><span>2</span><div><h3>ב־iPad</h3><p>פותחים ב־Safari ← שיתוף ← עוד, אם צריך ← הוספה למסך הבית. אם מופיעה האפשרות ״פתיחה כיישום אינטרנט״, מפעילים אותה ולוחצים ״הוספה״.</p></div></div><div class="install-step"><span>3</span><div><h3>בטאבלט Android</h3><p>פותחים ב־Chrome ← תפריט ⋮ ← התקנה / הוספה למסך הבית. שם האפשרות תלוי בגרסת הדפדפן.</p></div></div><p class="setting-help">הסמל יפתח את המשחק ישירות. בפעם הראשונה פותחים כשהטאבלט מחובר לאינטרנט ומחכים לטעינה מלאה.</p>`);
}
app.addEventListener('click',e=>{
  const b=e.target.closest('[data-action]');if(!b||b.disabled)return;
  const action=b.dataset.action,s=session,q=s?.questions[s.index];
  switch(action){
    case 'sound':state.sound=!state.sound;save();if(!state.sound)cancelAudio();render();if(state.sound&&route()[0]==='play')narrate();break;
    case 'parents':parentGate();break;
    case 'close-modal':document.querySelector('dialog')?.close();break;
    case 'chapter':document.querySelector(`#chapter-${b.dataset.index}`)?.scrollIntoView({behavior:'smooth',block:'start'});break;
    case 'rule-audio':{const l=lessons.find(x=>x.id===b.dataset.lesson),r=l?.rule;if(r){const early=r.examplePage&&state.page<r.examplePage;speak(early?(l.id==='shva'?'שְׁוָא הוּא שְׁתֵּי נְקֻדּוֹת זוֹ מֵעַל זוֹ. נִקְרָא אוֹתוֹ בְּתוֹךְ מִלִּים.':'לְמִי? לְתָמָר.'):r.text,true);}break;}
    case 'example-audio':speak(lessons.find(x=>x.id===b.dataset.lesson)?.rule?.result,true);break;
    case 'explanation-audio':speak(q?.explanation,true);break;
    case 'pair-audio':speak(s?.questions[Number(b.dataset.index)]?.audio,true);break;
    case 'welcome-audio':speak(GUIDE.welcome,true);break;
    case 'quick-start':{const l=lessons.find(x=>x.id===b.dataset.lesson);const next=recommendedActivity(state,l);begin(next.lesson.id,next.mode);break;}
    case 'demo-next':if(s?.demo&&s.demoStep<2){s.demoStep++;updateGame();narrate();}break;
    case 'demo-replay':if(s?.demo)speak(instructionSpeech(s),true);break;
    case 'demo-done':if(s?.demo){state.tutorials[s.mode]=true;save();s.demo=false;updateGame();narrate();}break;
    case 'demo-open':if(s){s.demo=true;s.demoStep=0;updateGame();narrate();}break;
    case 'start':begin(b.dataset.lesson,b.dataset.mode);break;
    case 'answer':{
      if(!s||s.feedback==='correct')break;
      const choice=q.choices[Number(b.dataset.index)];if(!choice)break;
      if(choice.text!==q.target&&!s.wrong.includes(choice.text))s.wrong.push(choice.text);
      feedback(choice.text===q.target);break;
    }
    case 'tile':if(s&&s.feedback!=='correct'&&s.chosen.length<q.parts.length&&!s.chosen.includes(Number(b.dataset.id))){s.chosen.push(Number(b.dataset.id));s.feedback=null;updateGame(s.chosen.length===q.parts.length?'[data-action="check-build"]':null);}break;
    case 'remove-tile':if(s&&s.feedback!=='correct'){s.chosen.splice(Number(b.dataset.index),1);s.feedback=null;updateGame();}break;
    case 'check-build':if(s&&s.feedback!=='correct'&&s.chosen.length===q.parts.length)feedback(s.chosen.map(id=>q.tiles.find(t=>t.id===id).text).join('').normalize('NFC')===q.text.normalize('NFC'));break;
    case 'hint':if(s){s.hint=(Number(s.hint)||0)+1;updateGame();if(s.mode==='build')speak(q.text);else speak(q.hint||'אֶפְשָׁר לְהַקְשִׁיב שׁוּב וּלְבַקֵּשׁ עֶזְרָה.');}break;
    case 'hint-audio':speak(q?.hint||'אֶפְשָׁר לְהַקְשִׁיב שׁוּב וּלְבַקֵּשׁ עֶזְרָה.',true);break;
    case 'word-audio':speak(s?.mode==='build'?q.text:q?.audio||q?.label,true);break;
    case 'prompt-audio':if(s){speak(s.mode==='memory'?GUIDE.connect:s.mode==='build'?GUIDE.build:questionSpeech(q),true);}break;
    case 'flip':{
      if(!s||s.feedback)break;const i=Number(b.dataset.index),card=s.questions[i];
      if(!card||s.matched.includes(card.pair))break;
      if(s.flipped.includes(i)){s.flipped=s.flipped.filter(n=>n!==i);updateGame();break;}
      s.flipped=s.flipped.filter(n=>s.questions[n].side!==card.side);s.flipped.push(i);
      if(s.flipped.length===2){s.turns++;const match=s.questions[s.flipped[0]].pair===card.pair;if(match){s.matched.push(card.pair);s.feedback='correct';speak(GUIDE.connection);}else{s.feedback='mismatch';speak(GUIDE.retry);}}
      updateGame(s.feedback?'[data-action="next"], [data-action="hide-cards"]':null);break;
    }
    case 'hide-cards':s.flipped=[];s.feedback=null;updateGame();narrate();break;
    case 'next':if(s?.feedback==='correct'){if(s.mode==='memory'){if(s.matched.length===s.questions.length/2)finish();else{s.flipped=[];s.feedback=null;updateGame();}}else if(s.index===s.questions.length-1)finish();else{s.index++;s.feedback=null;s.hint=false;s.wrong=[];s.chosen=[];updateGame();narrate();}}break;
    case 'exit':dialog('לחזור למסלול?',`<p>הסיבוב הזה עוד לא הושלם. הפרחים ממשחקים קודמים שמורים.</p><div class="settings-buttons">${button('close-modal','ממשיכים לשחק','button primary')}${button('leave-round','חזרה למסלול','button secondary')}</div>`);break;
    case 'leave-round':{const id=s?.lesson.id;session=null;cancelAudio();go(id?`lesson/${id}`:'learn');break;}
    case 'flower':dialog('פרח של תגלית',`${plant(lessons.findIndex(l=>l.id===b.dataset.lesson))}<p>${esc(lessons.find(l=>l.id===b.dataset.lesson)?.title)} · ${modes[b.dataset.mode].title}</p><a class="button primary" href="#lesson/${b.dataset.lesson}">נשחק שוב ${icon('left')}</a>`);break;
    case 'install':installHelp();break;
    case 'install-now':if(installPrompt){installPrompt.prompt();installPrompt.userChoice.finally(()=>installPrompt=null);}break;
    case 'export':{
      const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='hebrew-garden-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break;
    }
    case 'reset-confirm':dialog('לאפס את ההתקדמות?',`<p>כל הפרחים והמשחקים שהושלמו במכשיר הזה יימחקו. אפשר להוריד גיבוי לפני האיפוס.</p><div class="settings-buttons">${button('reset','כן, לאפס','button danger-button')}${button('close-modal','ביטול','button secondary')}</div>`);break;
    case 'reset':state={...newState(),page:state.page,sound:state.sound};session=null;save();go('home');render();toast('ההתקדמות אופסה. אפשר להתחיל מחדש.');break;
  }
});
app.addEventListener('submit',e=>{
  if(e.target.id==='parent-gate'){e.preventDefault();if(document.querySelector('#gate-answer').value.trim()==='25')settings();else document.querySelector('#gate-error').textContent='ננסה שוב.';}
  if(e.target.id==='settings-form'){e.preventDefault();state.page=Number(document.querySelector('#page-number').value);state.sound=e.target.elements.sound.checked;save();session=null;go('learn');render();toast('ההגדרות נשמרו.');}
});
app.addEventListener('input',e=>{
  if(['page-range','page-number'].includes(e.target.id)){
    const n=Number(e.target.value);document.querySelector(e.target.id==='page-range'?'#page-number':'#page-range').value=n;
    document.querySelector('#page-topic').textContent=lessons.find(l=>n>=l.start&&n<=l.end)?.title||'יש לבחור עמוד בין 4 ל־79';
  }
});
app.addEventListener('change',async e=>{
  if(e.target.id!=='import-progress')return;
  const file=e.target.files?.[0];if(!file)return;
  try{if(file.size>500000)throw new Error('size');const raw=JSON.parse(await file.text());if(raw.version!==1||!raw.completed||!Number.isInteger(raw.page)||raw.page<4||raw.page>79)throw new Error('format');
    const candidate=cleanState(raw);dialog('לטעון את הגיבוי?',`<p>הגיבוי כולל ${flowerCount(blooms(candidate))} ויחליף את ההתקדמות במכשיר הזה.</p><button id="confirm-import" class="button primary">טעינת הגיבוי</button>`);
    document.querySelector('#confirm-import').addEventListener('click',()=>{state=candidate;session=null;save();go('garden');render();toast('הגיבוי נטען בהצלחה.');},{once:true});
  }catch{toast('הקובץ אינו גיבוי תקין. ההתקדמות שלך נשארה ללא שינוי.');}
});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);const [p,id]=route();if(p==='learn'&&id)document.getElementById(id)?.scrollIntoView();});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY&&route()[0]!=='play'){try{state=cleanState(JSON.parse(e.newValue));render();}catch{}}});
render();
if('serviceWorker'in navigator && (location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname))) {
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{offlineReady=true;}).catch(()=>{}));
}
