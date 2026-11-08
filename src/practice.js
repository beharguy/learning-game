// Original practice aligned with the photographed workbook. Parts are curated
// reading chunks (not an automatic syllabification or isolated-letter TTS).
const parts = {
  'מַר':['מַ','ר'], 'תָּמָר':['תָּ','מָר'], 'מָרָק':['מָ','רָק'], 'בָּרָק':['בָּ','רָק'], 'קַר':['קַ','ר'],
  'כֵּן':['כֵּ','ן'], 'לֹא':['לֹ','א'], 'קָמָה':['קָ','מָה'], 'בָּאָה':['בָּ','אָה'], 'יָם':['יָ','ם'],
  'שָׁר':['שָׁ','ר'], 'שָׁרָה':['שָׁ','רָה'], 'שָׁרַק':['שָׁ','רַק'], 'הַר':['הַ','ר'], 'חַלָּה':['חַ','לָּה'],
  'שֶׁל':['שֶׁ','ל'], 'אֶת':['אֶ','ת'], 'נָח':['נָ','ח'], 'קָנָה':['קָ','נָה'], 'בָּנָה':['בָּ','נָה'],
  'יָד':['יָ','ד'], 'מַתָּנָה':['מַ','תָּ','נָה'], 'חָלָב':['חָ','לָב'], 'יָשַׁב':['יָ','שַׁב'], 'לָבַשׁ':['לָ','בַשׁ'],
  'אַרְנָב':['אַרְ','נָב'], 'קַלְמָר':['קַלְ','מָר'], 'יַלְדָּה':['יַלְ','דָּה'], 'מַרְאָה':['מַרְ','אָה'],
  'יָשְׁבָה':['יָשְׁ','בָה'], 'חָשְׁבָה':['חָשְׁ','בָה'], 'רָקְדָה':['רָקְ','דָה'],
  'לְנָדָב':['לְ','נָ','דָב'], 'לְתָמָר':['לְ','תָ','מָר'], 'וְתָמָר':['וְ','תָ','מָר'],
  'הָאַרְנָב':['הָ','אַרְ','נָב'], 'הַיַּלְדָּה':['הַ','יַּלְ','דָּה'], 'הַמַּחַק':['הַ','מַּ','חַק'], 'לַיְלָה':['לַיְ','לָה']
};
const letters = {
  tav:['תּ','תָּ','תַּ',8], mem:['מ','מָ','מַ',12], resh:['ר','רָ','רַ',16],
  bet:['בּ','בָּ','בַּ',20], qof:['ק','קָ','קַ',22], alef:['א','אָ','אַ',28],
  yod:['י','יָ','יַ',30], lamed:['ל','לָ','לַ',32], shin:['שׁ','שָׁ','שַׁ',44],
  het:['ח','חָ','חַ',48], nun:['נ','נָ','נַ',56], dalet:['דּ','דָּ','דַּ',58], vet:['ב','בָ','בַ',60]
};
const marks = {kamatz:{symbol:'◌ָ',name:'קָמָץ'},patah:{symbol:'◌ַ',name:'פַּתָּח'},shva:{symbol:'◌ְ',name:'שְׁוָא'}};
const q=(page,prompt,target,answers,extra={})=>({page,prompt,target,answers,...extra});
function joinVowel(page,base,target,other,mark){
  const {symbol,name}=marks[mark];
  return q(page,'נְחַבֵּר אוֹת וְנִקּוּד.',target,[target,other,base],{
    kind:'vowel',level:1,mode:'vowels',formula:[base,symbol],markName:name,
    hint:`הַסִּימָן ${name} נִכְתָּב מִתַּחַת לָאוֹת.`,
    explanation:`הָאוֹת וְסִימָן ${name} מְחֻבָּרִים.`,
    speech:`נְחַבֵּר אֶת הָאוֹת עִם ${name}.`
  });
}
function selectVowel(page,mark,target,others){
  const name=marks[mark].name;
  return q(page,`אֵיפֹה יֵשׁ ${name}?`,target,[target,...others],{
    kind:'vowel',level:2,mode:'vowels',hint:`נְחַפֵּשׂ אֶת הַסִּימָן שֶׁל ${name} מִתַּחַת לָאוֹת.`,
    hintMark:marks[mark].symbol,explanation:`זֶה ${name} מִתַּחַת לָאוֹת.`
  });
}
const rules={
  hello:{title:'מַקְשִׁיבִים לַמִּלִּים',text:'חִמּוּם קָצָר: נַקְשִׁיב לְמִלִּים וְנִמְצָא הַתְחָלוֹת דּוֹמוֹת.',example:['תַּפּוּחַ','תַּנִּין']},
  'yes-no':{title:'קוֹרְאִים וּמַחְלִיטִים',text:'כֵּן אוֹ לֹא? נִקְרָא אֶת הַשְּׁאֵלָה וְנִבְדֹּק אֶת הַתְּמוּנָה.',example:['כֵּן','לֹא']},
  'little-words':{title:'חֲלָקִים הוֹפְכִים לְמִלָּה',text:'נִקְרָא חֵלֶק וְעוֹד חֵלֶק, וְאָז אֶת הַמִּלָּה הַשְּׁלֵמָה.',example:['קָ','מָה'],result:'קָמָה'},
  'sound-lotto':{title:'מִצְלִיל לְמִלָּה',text:'נַקְשִׁיב לַהַתְחָלָה וְלַסּוֹף, וּנְחַבֵּר חֲלָקִים לְמִלִּים.',example:['מָ','רָק'],result:'מָרָק'},
  'shel-et':{title:'מִלִּים קְטַנּוֹת בַּמִּשְׁפָּט',text:'שֶׁל עוֹזֶרֶת לָנוּ לוֹמַר לְמִי שַׁיָּךְ מַשֶּׁהוּ.',example:['מַחַק','שֶׁל','תָּמָר']},
  shva:{title:'מַכִּירִים אֶת הַשְּׁוָא',text:'אֶת הַשְּׁוָא כּוֹתְבִים בִּשְׁתֵּי נְקֻדּוֹת זוֹ מֵעַל זוֹ. בְּקַלְמָר, לָמֶד בִּשְׁוָא נִצְמֶדֶת לַחֵלֶק שֶׁלְּפָנֶיהָ. נַקְשִׁיב לַמִּלָּה.',example:['קַלְ','מָר'],result:'קַלְמָר',examplePage:68},
  verbs:{title:'מִלָּה שֶׁמִּשְׁתַּנָּה',text:'נָדָב יָשַׁב. תָּמָר יָשְׁבָה. נָשִׂים לֵב לַסּוֹף וּלַנִּקּוּד.',example:['יָשַׁב','יָשְׁבָה']},
  prefix:{title:'אוֹת קְטַנָּה מוֹסִיפָה מַשְׁמָעוּת',text:'לְמִי? לְתָמָר. מִי עוֹד? וְתָמָר.',example:['לְתָמָר','וְתָמָר'],examplePage:73},
  stories:{title:'מִמִּלִּים לְסִפּוּר',text:'נִקְרָא וְנִבְדֹּק: מִי? מָה? אֵיפֹה? אֶפְשָׁר לַחֲזֹר לַסִּפּוּר בְּכָל רֶגַע.',example:['אַרְנָב','הָאַרְנָב']}
};
export function enrichCurriculum(lessons){
  for(const lesson of lessons){
    // Copying a displayed glyph is no longer the main activity.
    lesson.questions=lesson.questions.filter(x=>x.kind!=='warmup');
    lesson.words=lesson.words.map(w=>({...w,parts:parts[w.text]}));
    lesson.rule=rules[lesson.id];
    const letter=letters[lesson.id];
    if(letter){
      const [base,kamatz,patah,page]=letter;
      lesson.questions.push(joinVowel(page,base,kamatz,patah,'kamatz'),joinVowel(page,base,patah,kamatz,'patah'),
        selectVowel(page,'patah',patah,[kamatz,base]),selectVowel(page,'kamatz',kamatz,[base,patah]));
      lesson.rule={title:'אוֹת וְנִקּוּד נִקְרָאִים יַחַד',text:'קָמָץ וּפַתָּח נִרְאִים שׁוֹנִים. בַּמִּלִּים שֶׁלָּנוּ הֵם נִשְׁמָעִים אוֹתוֹ דָּבָר, כְּמוֹ הַהַתְחָלָה שֶׁל אַרְיֵה.',example:[kamatz,patah],symbols:['◌ָ','◌ַ']};
    }
    // Link reading chunks to whole words, with real word alternatives.
    for(const w of lesson.words){
      const others=lesson.words.filter(x=>x.page<=w.page&&x.text!==w.text).slice(0,2).map(x=>x.text);
      if(w.parts&&others.length)lesson.questions.push(q(w.page,'אֵיזוֹ מִלָּה נוֹצְרָה?',w.text,[w.text,...others],{
        kind:'blend',level:2,formula:w.parts,hint:'נִקְרָא מִיָּמִין לִשְׂמֹאל, וְנְחַבֵּר אֶת הַחֲלָקִים.',
        explanation:`הַחֲלָקִים הִתְחַבְּרוּ לַמִּלָּה ${w.text}.`,revealEmoji:w.emoji
      }));
    }
    for(const x of lesson.questions){
      x.level??=(x.story||x.sentence)?3:1;
      if(x.kind==='sound'){
        x.hideLabel=true;
        x.explanation=`${x.position==='end'?'בְּסוֹף הַמִּלָּה':'בַּמִּלָּה'} ${x.label} שׁוֹמְעִים אֶת הַצְּלִיל שֶׁבַּכַּרְטִיס.`;
      }
    }
  }
  const hello=lessons.find(l=>l.id==='hello');
  hello.title='חימום של צלילים';hello.subtitle='מקשיבים ומחברים מילים עם התחלה דומה';
  hello.questions=[
    q(4,'מָה מַתְחִיל כְּמוֹ תַּפּוּחַ?','תַּנִּין',['תַּנִּין','בַּנָּנָה'],{pictureAnswers:['🐊','🍌'],emoji:'🍎',hint:'נַקְשִׁיב: תַּפּוּחַ, תַּנִּין.',explanation:'תַּפּוּחַ וְתַנִּין מַתְחִילִים בְּאוֹתוֹ צְלִיל.'}),
    q(5,'מָה מַתְחִיל כְּמוֹ מַפְתֵּחַ?','מַחְבֶּרֶת',['מַחְבֶּרֶת','תַּפּוּחַ'],{pictureAnswers:['📓','🍎'],emoji:'🔑',hint:'נַקְשִׁיב: מַפְתֵּחַ, מַחְבֶּרֶת.',explanation:'מַפְתֵּחַ וּמַחְבֶּרֶת מַתְחִילִים בְּאוֹתוֹ צְלִיל.'}),
    q(6,'מָה מַתְחִיל כְּמוֹ רַכֶּבֶת?','רַמְזוֹר',['רַמְזוֹר','מַפְתֵּחַ'],{pictureAnswers:['🚦','🔑'],emoji:'🚂',hint:'נַקְשִׁיב: רַכֶּבֶת, רַמְזוֹר.',explanation:'רַכֶּבֶת וְרַמְזוֹר מַתְחִילִים בְּאוֹתוֹ צְלִיל.'})
  ];
  const shva=lessons.find(l=>l.id==='shva');
  for(const [base,marked,a,page] of [['שׁ','שְׁ','שָׁ',64],['ק','קְ','קַ',64],['תּ','תְּ','תַּ',64],['מ','מְ','מָ',66],['ל','לְ','לַ',66]]){
    shva.questions.push(joinVowel(page,base,marked,a,'shva'));
  }
  shva.questions.push(selectVowel(64,'shva','קְ',['קָ','קַ']),selectVowel(66,'shva','לְ',['לָ','לַ']));
  for(const [text,wrong,emoji,explanation] of [
    ['קַלְמָר','קַלַמָר','pencilcase','בְּקַלְמָר יֵשׁ שְׁוָא מִתַּחַת לְלָמֶד.'],
    ['אַרְנָב','אַרַנָב','🐇','בְּאַרְנָב יֵשׁ שְׁוָא מִתַּחַת לְרֵישׁ.'],
    ['יַלְדָּה','יַלַדָּה','👧','בְּיַלְדָּה יֵשׁ שְׁוָא מִתַּחַת לְלָמֶד.']
  ])shva.questions.push(q(68,'נַקְשִׁיב וְנִבְחַר אֶת הַנִּקּוּד.',text,[text,wrong],{
    kind:'vowel-word',mode:'vowels',level:3,emoji,audio:text,hideLabel:true,explanation,hint:explanation
  }));
  // Introduce hataf patah only where the workbook does (not as a different /a/ sound).
  for(const [id,page,base,target,others] of [['alef',28,'א','אֲ',['אַ','אָ']],['het',48,'ח','חֲ',['חַ','חָ']]]){
    lessons.find(l=>l.id===id).questions.push(q(page,'נְחַבֵּר אוֹת וְנִקּוּד.',target,[target,...others],{
      kind:'vowel',mode:'vowels',level:2,formula:[base,'◌ֲ'],markName:'חֲטַף פַּתָּח',speech:'נְחַבֵּר אֶת הָאוֹת עִם חֲטַף פַּתָּח.',
      hint:'חֲטַף פַּתָּח נִרְאֶה כְּמוֹ פַּתָּח וּשְׁוָא יַחַד.',explanation:'הָאוֹת וַחֲטַף פַּתָּח מְחֻבָּרִים.'
    }));
  }
  const yes=lessons.find(l=>l.id==='yes-no');
  yes.questions.unshift(q(25,'זֶה מָרָק?','כֵּן',['כֵּן','לֹא'],{emoji:'🍲'}));
}
