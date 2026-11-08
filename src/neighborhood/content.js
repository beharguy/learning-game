import { lessons } from '../curriculum.js';

export const GAMES = [
  {id:'kitchen',name:'הַמִּטְבָּח שֶׁל נוֹעָה',person:'נועה השפית',symbol:'🍲',asset:'01-noa-kitchen',start:19,x:17,y:28,reward:'אֲרוּחָה מוּכָנָה!',verb:'ארוחות'},
  {id:'garden',name:'הַגִּנָּה שֶׁל אָבִי',person:'אבי הגנן',symbol:'🌷',asset:'02-avi-garden',start:4,x:44,y:27,reward:'פֶּרַח חָדָשׁ בַּגִּנָּה!',verb:'פרחים'},
  {id:'workshop',name:'הַסַּדְנָה שֶׁל רוֹנִי',person:'רוני הבנאית',symbol:'🔨',asset:'03-roni-workshop',start:8,x:79,y:28,reward:'עוֹד חֵלֶק בַּגֶּשֶׁר!',verb:'חלקים'},
  {id:'boat',name:'הַסִּירָה שֶׁל סָמִי',person:'סמי הספן',symbol:'⛵',asset:'04-sami-deliveries',start:24,x:15,y:80,reward:'הַמִּשְׁלוֹחַ הִגִּיעַ!',verb:'משלוחים'},
  {id:'theater',name:'הַבָּמָה שֶׁל לִיָה',person:'ליה הבמאית',symbol:'🎭',asset:'05-lia-theater',start:35,x:39,y:81,reward:'אֵיזוֹ הַצָּגָה!',verb:'הצגות'},
  {id:'library',name:'הַסִּפְרִיָּה שֶׁל יָעֵל',person:'יעל הספרנית',symbol:'📖',asset:'06-yael-stories',start:25,x:79,y:80,reward:'פָּתַרְנוּ אֶת הַתַּעֲלוּמָה!',verb:'סיפורים'}
];
// Player instructions use impersonal questions, infinitives or first-person plural.
// Gendered verbs belong only to authored characters and the grammar exercises.
export const SAY = {
  welcome:'זֹאת הַשְּׁכוּנָה שֶׁל עַלְמָה! כְּדֵי לְהַתְחִיל לְשַׂחֵק, אֶפְשָׁר לִלְחֹץ עַל הַכַּפְתּוֹר הַיָּרֹק.',
  map:'הַחֲבֵרִים מְחַכִּים בַּשְּׁכוּנָה! לְחִיצָה עַל דְּמוּת פּוֹתַחַת מִשְׂחָק.',
  kitchen:'נַשְׁלִים אֶת הַמִּלָּה. אֵיזֶה חֵלֶק חָסֵר? אֶפְשָׁר לִלְחֹץ עָלָיו.',
  garden:'נִשְׁתֹּל יַחַד! נַקְשִׁיב וְנִבְחַר אֶת הַתְּמוּנָה הַמַּתְאִימָה.',
  workshop:'נִבְנֶה צְלִילִים! נַקְשִׁיב וְנִבְחַר אֶת הַכַּרְטִיס הַמַּתְאִים.',
  boat:'יֵשׁ לָנוּ מִשְׁלוֹחַ! נִקְרָא אֶת הַתָּוִית וְנִבְחַר אֶת הָרָצִיף הַמַּתְאִים.',
  theater:'נַפְעִיל אֶת הַבּוּבוֹת! אֵיזוֹ מִלָּה מַשְׁלִימָה אֶת הַמִּשְׁפָּט?',
  library:'נִפְתֹּר תַּעֲלוּמָה! נִקְרָא אֶת הָרֶמֶז וְנִבְחַר תְּשׁוּבָה. אֶפְשָׁר לִלְחֹץ עַל הָרַמְקוֹל לְעֶזְרָה.',
  correct:'כָּל הַכָּבוֹד! תְּשׁוּבָה נְכוֹנָה!',retry:'לֹא נוֹרָא. נַקְשִׁיב, נַחְשֹׁב וּנְנַסֶּה שׁוּב.',
  hint:'נַקְשִׁיב יַחַד וְנִסְתַּכֵּל עַל הַכַּרְטִיסִים.',
  finish:'כָּל הַכָּבוֹד! אֶפְשָׁר לְשַׂחֵק עוֹד, לְבַקֵּר חָבֵר אַחֵר, אוֹ לָנוּחַ.',
  next:'עוֹד מִשְׂחָק? אֶפְשָׁר לִלְחֹץ עַל הַחֵץ הַיָּרֹק.',
  locked:'נִפְגֹּשׁ אֶת הַחָבֵר הַזֶּה בְּהֶמְשֵׁךְ הַחוֹבֶרֶת. בֵּינְתַיִם אֶפְשָׁר לְשַׂחֵק עִם הַחֲבֵרִים הָאֲחֵרִים.',
  listenWord:'נַקְשִׁיב לַמִּלָּה.', rhyme:'אֵיזוֹ מִלָּה מִתְחָרֶזֶת?',
  startSound:'אֵיזוֹ מִלָּה מַתְחִילָה בְּאוֹתוֹ צְלִיל?',endSound:'אֵיזוֹ מִלָּה מִסְתַּיֶּמֶת בְּאוֹתוֹ צְלִיל?',
  stamp:'אֵיזֶה סִימָן נִקּוּד מַתְאִים?', choosePicture:'אֵיזוֹ תְּמוּנָה מַתְאִימָה?',
  chooseWord:'אֵיזוֹ מִלָּה מַתְאִימָה?', helpRead:'נִקְרָא יַחַד.',
};
const allQ=lessons.flatMap(l=>l.questions.map(q=>({...q,lesson:l.id})));
const soundForm=text=>text.normalize('NFD').replace(/[\u05b2\u05b7\u05b8]/g,'a');
const levelFor=page=>page<34?1:page<64?2:3;
const option=(text,picture)=>({text,picture});
export const BANK=Object.fromEntries(GAMES.map(g=>[g.id,[]]));
function add(game,q){BANK[game].push({id:game+'-'+BANK[game].length,level:levelFor(q.page),skill:q.type, ...q});}
const words=new Map();
for(const l of lessons)for(const w of l.words)if(w.parts&&!words.has(w.text))words.set(w.text,{...w});
// Each added word and reading chunk is authored; no automatic Hebrew vocalization.
const extraWords=[
 ['רָם','🧍',19,['רָ','ם']],['קָם','🧍',24,['קָ','ם']],['רַק','☝️',24,['רַ','ק']],
 ['בָּא','🚶',37,['בָּ','א']],['קַל','🪶',39,['קַ','ל']],['חַם','♨️',48,['חַ','ם']],
 ['שָׁתַק','🤫',47,['שָׁ','תַק']],['שָׁאַל','❔',50,['שָׁ','אַל']],['שָׁתַל','🌱',50,['שָׁ','תַל']],
 ['לָקַח','🤲',50,['לָ','קַח']],['מָחַק','🧽',51,['מָ','חַק']],['מַחַק','eraser',51,['מַ','חַק']],
 ['בָּרַח','🏃',50,['בָּ','רַח']],['שַׁבָּת','🕯️',51,['שַׁ','בָּת']],['קָרָא','📖',41,['קָ','רָא']],
 ['שָׁמַר','🛡️',50,['שָׁ','מַר']],['שָׁלַח','📨',50,['שָׁ','לַח']],['רָקַד','💃',62,['רָ','קַד']],
 ['שָׁתָה','🥛',62,['שָׁ','תָה']],['חָשַׁב','💭',69,['חָ','שַׁב']],['יָשַׁן','😴',71,['יָ','שַׁן']],
 ['שָׁרְקָה','😗',70,['שָׁרְ','קָה']],['בָּחֲרָה','☝️',71,['בָּ','חֲ','רָה']],['לָמְדָה','📖',71,['לָמְ','דָה']],
 ['יָשְׁנָה','😴',71,['יָשְׁ','נָה']],['נָתַן','🎁',72,['נָ','תַן']],['נָתְנָה','🎁',72,['נָתְ','נָה']],
 ['אָבַד','🔍',75,['אָ','בַד']],['חָדָשׁ','✨',76,['חָ','דָשׁ']],['אַחַת','1',76,['אַ','חַת']]
];
for(const [text,emoji,page,parts]of extraWords)if(!words.has(text))words.set(text,{text,emoji,page,parts});
export const WORDS=[...words.values()];
for(const w of WORDS){
 if(['שֶׁל','אֶת','כֵּן','לֹא'].includes(w.text))continue;
 w.parts.forEach((part,gap)=>{
  const foils=[...new Set(WORDS.filter(x=>x.page<=w.page).flatMap(x=>x.parts))].filter(p=>soundForm(p)!==soundForm(part));
  add('kitchen',{type:'complete',page:w.page,prompt:SAY.kitchen,word:w.text,picture:w.emoji,parts:w.parts,gap,target:part,foils,read:w.text});
 });
}

// Listening vocabulary follows the picture tasks: hearing a word never requires
// having learned every letter in its spelling. Within each group the first sound matches.
const soundGroups=[
 [4,'תַּ',[['תַּפּוּחַ','🍎'],['תַּנִּין','🐊'],['תַּרְנְגוֹל','🐓']]],
 [5,'מַ',[['מַפְתֵּחַ','🔑'],['מַחְבֶּרֶת','📓'],['מַתָּנָה','🎁']]],
 [6,'רַ',[['רַכֶּבֶת','🚂'],['רַמְזוֹר','🚦'],['רַעַם','🌩️']]],
 [21,'בַּ',[['בַּנָּנָה','🍌'],['בַּלּוֹן','🎈'],['בַּיִת','🏠'],['בָּרְוָז','🦆']]],
 [23,'קַ',[['קַרְנַף','🦏'],['קַסְדָּה','⛑️'],['קַלְמָר','pencilcase']]],
 [29,'אַ',[['אַרְיֵה','🦁'],['אַרְמוֹן','🏰'],['אֲבַטִּיחַ','🍉']]],
 [31,'יַ',[['יָד','✋'],['יַעַר','🌳'],['יָרֵחַ','🌙']]],
 [33,'לַ',[['לַיְלָה','🌃'],['לַחְמָנִיָּה','🥯'],['לַהַב','🗡️']]],
 [45,'שַׁ',[['שָׁעוֹן','🕰️'],['שַׁטִּיחַ','carpet'],['שַׁבְּלוּל','🐌']]],
 [49,'חַ',[['חַגּוֹרָה','belt'],['חֲמוֹר','🫏'],['חַלּוֹן','🪟']]],
 [56,'נַ',[['נָחָשׁ','🐍'],['נָמֵר','🐯'],['נַעַל','👞']]],
 [58,'דַּ',[['דָּג','🐟'],['דַּלִּי','🪣'],['דַּף','📄']]]
];
const everySound=soundGroups.flatMap(([page,sound,items])=>items.map(([text,picture])=>({page,sound,text,picture})));
for(const [page,sound,items]of soundGroups)for(const [text,picture]of items)for(const [answer,pic]of items.filter(i=>i[0]!==text)){
 const foils=everySound.filter(w=>w.sound!==sound&&w.page<=Math.max(page,21));
 add('garden',{type:'initial',page,prompt:SAY.startSound,cue:text,picture,sound,target:answer,correct:option(answer,pic),foils:foils.map(w=>option(w.text,w.picture)),auditory:true});
}
const endings=[
 [10,'ת',[['קֶשֶׁת','🌈'],['מַחְבֶּרֶת','📓'],['דֶּלֶת','🚪']]],
 [13,'ם',[['גֶּשֶׁם','🌧️'],['בַּלּוֹנִים','🎈'],['יָם','🌊']]],
 [17,'ר',[['גֶּזֶר','🥕'],['עַכְבָּר','🐭'],['נָמֵר','🐯']]],
 [23,'ק',[['מָרָק','🍲'],['בָּרָק','⚡'],['תִּיק','🎒']]],
 [33,'ל',[['גָּמָל','🐪'],['דֶּגֶל','🇮🇱'],['פִּיל','🐘']]],
 [49,'ח',[['פֶּרַח','🌸'],['יָרֵחַ','🌙'],['תַּפּוּחַ','🍎']]],
 [57,'ן',[['בַּלּוֹן','🎈'],['עָנָן','☁️'],['פַּעֲמוֹן','🔔']]],
 [59,'ד',[['יָד','✋'],['קִפּוֹד','🦔'],['כַּד','🏺']]],
 [61,'ב',[['לֵב','❤️'],['כּוֹכָב','⭐'],['זָנָב','🐈']]]
];
for(const [page,sound,items]of endings)for(const [text,picture]of items)for(const [answer,pic]of items.filter(i=>i[0]!==text)){
 const foils=endings.filter(e=>e[1]!==sound).flatMap(e=>e[2]).map(([t,p])=>option(t,p));
 add('garden',{type:'ending',page,prompt:SAY.endSound,cue:text,picture,sound,target:answer,correct:option(answer,pic),foils,auditory:true});
}
const rhymes=[
 [36,'בָּרָק','⚡','מָרָק','🍲'],[36,'קָמָה','🧍‍♀️','רָמָה','🏔️'],[50,'שָׁאַל','❔','שָׁתַל','🌱'],
 [50,'שָׁמַר','🛡️','תָּמָר','date'],[50,'שָׁתַק','🤫','בָּרָק','⚡'],[55,'חַלָּה','🍞','קַלָּה','🪶'],
 [55,'מָרָק','🍲','שָׁרַק','😗'],[55,'הַר','⛰️','קַר','🧊'],[55,'יָם','🌊','חַם','♨️'],
 [69,'אַרְנָב','🐇','חָלָב','🥛'],[69,'קַלְמָר','pencilcase','תָּמָר','date'],[71,'רָקַד','💃','יָד','✋']
];
for(const [page,a,pa,b,pb]of rhymes)for(const [cue,picture,target,pic]of [[a,pa,b,pb],[b,pb,a,pa]]){
 // Fixed non-rhyming foils are checked by the authored rhyme family, not spelling alone.
 const families=['ak','ama','al','ar','ak','ala','ak','ar','am','av','ar','ad'];
 const family=families[rhymes.findIndex(r=>r[1]===cue&&r[3]===target||r[3]===cue&&r[1]===target)];
 const wrong=rhymes.flatMap((r,i)=>families[i]!==family?[[r[1],r[2]],[r[3],r[4]]]:[]).filter(([text])=>text!==cue&&text!==target).map(([text,emoji])=>({text,emoji}));
 add('garden',{type:'rhyme',page,prompt:SAY.rhyme,cue,picture,target,correct:option(target,pic),foils:wrong.map(w=>option(w.text,w.emoji)),auditory:true});
}

// Reuse all established, page-checked vowel exercises, adding manipulable stamps.
for(const q of allQ.filter(q=>q.mode==='vowels'))add('workshop',{type:'vowel',page:q.page,prompt:q.speech||q.prompt,display:q.formula?.join(' + ')||q.label||'',target:q.target,options:q.answers.map(t=>option(t)),read:q.audio,automatic:q.hideLabel?[q.audio]:[],hint:q.hint,explanation:q.explanation,picture:q.emoji});
const letters=[['תּ',8],['מ',12],['ר',16],['בּ',20],['ק',22],['א',28],['י',30],['ל',32],['שׁ',44],['ח',48],['נ',56],['דּ',58],['ב',60]];
const markRows=[['ָ','קָמָץ',8],['ַ','פַּתָּח',8],['ְ','שְׁוָא',64]];
for(const [base,p]of letters)for(const [mark,name,mp]of markRows){
 add('workshop',{type:'stamp',page:Math.max(p,mp),base,mark,target:'◌'+mark,completion:base+mark,prompt:`נְחַבֵּר אֶת הָאוֹת עִם ${name}.`,options:markRows.filter(r=>r[2]<=Math.max(p,mp)).map(r=>option('◌'+r[0])),display:base});
}
for(const [base,end,page]of [['מ','ם',14],['נ','ן',56]])for(const [text,picture]of (base==='מ'?endings[1][2]:endings[6][2])){
 add('workshop',{type:'final',page,prompt:'אֵיזוֹ אוֹת כּוֹתְבִים בְּסוֹף הַמִּלָּה?',display:base,picture,cue:text,automatic:[text],target:end,options:[option(base),option(end)]});
}
for(const q of allQ.filter(q=>q.kind==='sound'&&q.page>=60&&['ב','בּ','בַ','בַּ'].includes(q.target)))add('workshop',{type:'dagesh',page:q.page,prompt:q.prompt,target:q.target,options:q.answers.map(t=>option(t)),picture:q.emoji,automatic:[q.audio],read:q.audio});

const people=[
 {name:'תָּמָר',to:'לְתָמָר',and:'וְתָמָר',sex:'f',pic:'👧🏻',page:19},
 {name:'בָּרָק',to:'לְבָרָק',and:'וּבָרָק',sex:'m',pic:'👦🏼',page:24},
 {name:'אַיָּלָה',to:'לְאַיָּלָה',and:'וְאַיָּלָה',sex:'f',pic:'👧🏽',page:32},
 {name:'שַׁחַר',to:'לְשַׁחַר',and:'וְשַׁחַר',sex:'m',pic:'👦🏻',page:48},
 {name:'נָדָב',to:'לְנָדָב',and:'וְנָדָב',sex:'m',pic:'👦🏽',page:58}
];
// Shipping labels only contain decodable words; choices are destinations.
const cargo=WORDS.filter(w=>['🍲','⚡','🧊','date','🌊','⛰️','🍞','✋','🎁','🥛','🐇','pencilcase','🪞','eraser'].includes(w.emoji)&&!w.text.startsWith('הַ')&&!w.text.startsWith('הָ')&&!w.text.startsWith('לְ'));
for(const w of cargo){
 if(w.page<24)w.deliveryPage=24;
 const page=Math.max(w.page,24),wrong=cargo.filter(x=>x.page<=page&&x.text!==w.text&&x.emoji!==w.emoji);
 if(wrong.length)add('boat',{type:'picture-delivery',page,prompt:SAY.boat,label:w.text,target:w.text,correct:option(w.text,w.emoji),foils:wrong.map(x=>option(x.text,x.emoji)),read:w.text});
 for(const person of people){
  const others=people.filter(p=>p.name!==person.name&&p.page<=Math.max(w.page,person.page,52));
  const label=`${w.text} שֶׁל ${person.name}`;
  add('boat',{type:'owner',page:Math.max(52,w.page,person.page),prompt:SAY.boat,label,target:person.name,correct:option(person.name,person.pic),foils:others.map(p=>option(p.name,p.pic)),read:label});
  const toLabel=`${w.text} ${person.to}`;
  add('boat',{type:'recipient',page:Math.max(72,w.page),prompt:SAY.boat,label:toLabel,target:person.name,correct:option(person.name,person.pic),foils:people.filter(p=>p!==person).map(p=>option(p.name,p.pic)),read:toLabel});
 }
}
const verbs=[
 ['קָם','קָמָה',35,'stand','🧍'],['בָּא','בָּאָה',37,'walk','🚶'],['שָׁר','שָׁרָה',46,'sing','🎵'],
 ['יָשַׁב','יָשְׁבָה',70,'sit','🪑'],['שָׁרַק','שָׁרְקָה',70,'whistle','🎶'],['חָשַׁב','חָשְׁבָה',70,'think','💭'],
 ['רָקַד','רָקְדָה',71,'dance','💃'],['יָשַׁן','יָשְׁנָה',71,'sleep','💤'],['לָמַד','לָמְדָה',71,'read','📖'],['בָּרַח','בָּרְחָה',71,'run','🏃']
];
for(const person of people)for(const [m,f,page,animation,picture]of verbs){
 const target=person.sex==='f'?f:m,other=person.sex==='f'?m:f;
 add('theater',{type:'verb',page:Math.max(page,person.page),prompt:SAY.theater,sentence:person.name+' ____',target,options:[option(target),option(other)],actor:person.sex,animation,picture,read:person.name,completed:person.name+' '+target+'.'});
 if(page>=70){const source=people.find(p=>p.sex!==person.sex);add('theater',{type:'verb-transfer',page:Math.max(page,person.page),prompt:SAY.theater,sentence:`${source.name} ${person.sex==='f'?m:f}. ${person.name} ____`,target,options:[option(target),option(other)],actor:person.sex,animation,picture,read:`${source.name} ${person.sex==='f'?m:f}. ${person.name}`,completed:person.name+' '+target+'.'});}
}
for(const q of allQ.filter(q=>q.sentence&&!q.story&&q.page>=35))add('theater',{type:'sentence',page:q.page,prompt:q.speech||q.prompt,sentence:q.sentence,target:q.target,options:q.answers.map(t=>option(t)),picture:q.emoji,read:q.sentence.replace(/____/g,'…'),completed:q.sentence.replace(/____/g,q.target),animation:'bow'});
for(const a of people)for(const b of people.filter(p=>p!==a)){
 add('theater',{type:'connection',page:73,prompt:'מִי עוֹד? אֵיזוֹ מִלַּת חִבּוּר מַתְאִימָה?',sentence:a.name+' ____',target:b.and,options:[option(b.and),option(b.to)],actor:'both',animation:'bow',picture:'🤝',read:a.name,completed:a.name+' '+b.and+'.'});
}

for(const q of allQ.filter(q=>q.story||q.lesson==='yes-no'||(q.page===39&&q.pictureAnswers)))add('library',{type:q.story?'story':'yes-no',page:q.page,prompt:q.prompt,story:q.story||'',picture:q.emoji,target:q.target,options:q.answers.map((t,i)=>option(t,q.pictureAnswers?.[i])),read:[q.story,q.prompt].filter(Boolean).join(' ')});
// Curated story templates with explicitly authored genders and distinct actions.
for(const a of people)for(const b of people.filter(p=>p!==a))for(const action of [0,1,2]){
 const v=verbs[action],second=verbs[(action+1)%3];
 const va=a.sex==='f'?v[1]:v[0],vb=b.sex==='f'?second[1]:second[0];
 const story=`${a.name} ${va}. ${b.name} ${vb}.`,prompt=`מִי ${va}?`;
 add('library',{type:'who',page:Math.max(41,v[2],second[2],a.page,b.page),prompt,story,target:a.name,options:[option(a.name,a.pic),option(b.name,b.pic)],read:story+' '+prompt});
}
for(const a of people)for(const w of cargo.filter(x=>['🍲','🍞','🥛','🐇','pencilcase','eraser'].includes(x.emoji))){
 const verb=a.sex==='f'?'רָאֲתָה':'רָאָה';
 const story=`${a.name} ${verb} ${w.text}.`,prompt=`מָה ${a.name} ${verb}?`;
 add('library',{type:'what',page:Math.max(68,a.page,w.page),prompt,story,target:w.text,correct:option(w.text,w.emoji),foils:cargo.filter(x=>x.text!==w.text&&x.emoji!==w.emoji&&x.page<=68).map(x=>option(x.text,x.emoji)),read:story+' '+prompt});
}
for(const a of people)for(const b of people.filter(p=>p!==a)){
 const verb=a.sex==='f'?'יָשְׁבָה':'יָשַׁב';
 const story=`${a.name} ${verb} לְיַד ${b.name}.`,prompt=`לְיַד מִי ${a.name} ${verb}?`;
 add('library',{type:'where',page:79,prompt,story,target:b.name,options:[option(a.name,a.pic),option(b.name,b.pic)],read:story+' '+prompt});
}
const sequences=[
 ['תָּמָר קָמָה. אַחַר כָּךְ תָּמָר בָּאָה.','קָמָה','בָּאָה'],
 ['בָּרָק קָם. אַחַר כָּךְ בָּרָק שָׁר.','קָם','שָׁר'],
 ['נָדָב רָקַד. אַחַר כָּךְ נָדָב נָח.','רָקַד','נָח'],
 ['תָּמָר יָשְׁבָה. אַחַר כָּךְ תָּמָר קָמָה.','יָשְׁבָה','קָמָה'],
 ['שַׁחַר קָנָה מַחַק. אַחַר כָּךְ הַמַּחַק אָבַד.','קָנָה מַחַק','הַמַּחַק אָבַד'],
 ['בָּרָק רָאָה אַרְנָב. אַחַר כָּךְ הָאַרְנָב בָּרַח.','רָאָה אַרְנָב','הָאַרְנָב בָּרַח']
];
for(const [story,first,then]of sequences)for(const early of [true,false]){
 const prompt=early?'מָה קָרָה בַּהַתְחָלָה?':'מָה קָרָה אַחַר כָּךְ?';
 add('library',{type:'sequence',page:79,prompt,story,target:early?first:then,options:[option(first),option(then)],read:story+' '+prompt});
}
// Early reading gets multiple picture comparisons before longer stories.
const earlyNouns=WORDS.filter(w=>['מָרָק','בָּרָק','תָּמָר'].includes(w.text));
for(const word of earlyNouns)for(const shown of earlyNouns){
 const prompt=`זֶה ${word.text}?`;
 add('library',{type:'yes-no',page:25,prompt,story:'',picture:shown.emoji,target:word===shown?'כֵּן':'לֹא',options:[option('כֵּן'),option('לֹא')],read:prompt});
}
for(const w of cargo.filter(w=>w.parts&&w.page<=33)){
 const others=cargo.filter(x=>x.page<=Math.max(24,w.page)&&x.emoji!==w.emoji);
 add('boat',{type:'picture-delivery',page:Math.max(24,w.page),prompt:SAY.boat,label:w.parts.join(' · '),target:w.text,correct:option(w.text,w.emoji),foils:others.map(x=>option(x.text,x.emoji)),read:w.text});
}
export function allAudioTexts(){
 const set=new Set(Object.values(SAY));
 for(const g of GAMES){set.add(g.name);set.add(g.reward);}
 for(const rows of Object.values(BANK))for(const q of rows){
  for(const key of ['prompt','read','cue','word','hint','explanation','completed'])if(q[key])set.add(q[key]);
  for(const t of q.automatic||[])if(t)set.add(t);
  if(q.auditory)for(const o of [q.correct,...q.foils])if(o)set.add(o.text);
 }
 return [...set];
}
