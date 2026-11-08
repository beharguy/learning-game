import { questionSpeech } from './engine.js';
export const GUIDE={
  welcome:'הַי! אֵיזֶה כֵּיף לְשַׂחֵק יַחַד. נְשַׂחֵק עִם מִלִּים, בְּנַחַת וּבְלִי לְמַהֵר.',
  build:'נְחַבֵּר חֲלָקִים לְמִלָּה. נִלְחַץ עַל הַחֲלָקִים לְפִי הַסֵּדֶר, מִיָּמִין לִשְׂמֹאל. אֶפְשָׁר לִשְׁמֹעַ אֶת הַמִּלָּה בָּרַמְקוֹל.',
  connect:'נִבְחַר כַּרְטִיס מִכָּל צַד וּנְחַבֵּר בֵּינֵיהֶם. הָרַמְקוֹל שֶׁלְּיַד הַתְּמוּנָה עוֹזֵר לְהַקְשִׁיב.',
  retry:'לֹא נוֹרָא. נַקְשִׁיב, נַחְשֹׁב וּנְנַסֶּה שׁוּב.',
  correct:'כָּל הַכָּבוֹד! תְּשׁוּבָה נְכוֹנָה!',
  connection:'יוֹפִי! הַכַּרְטִיסִים מַתְאִימִים.',
  finish:'כָּל הַכָּבוֹד! צָמַח פֶּרַח בַּגִּנָּה. אֶפְשָׁר לְשַׂחֵק עוֹד, וְאֶפְשָׁר גַּם לָנוּחַ.',
  help:'אֶפְשָׁר לְהַקְשִׁיב שׁוּב וּלְבַקֵּשׁ עֶזְרָה.',
  earlyShva:'אֶת הַשְּׁוָא כּוֹתְבִים בִּשְׁתֵּי נְקֻדּוֹת זוֹ מֵעַל זוֹ. נִקְרָא אוֹתוֹ בְּתוֹךְ מִלִּים.',
  earlyPrefix:'לְמִי? לְתָמָר.'
};
export const DEMOS={
  vowels:[
    'נְנַסֶּה יַחַד. כָּאן יֵשׁ אוֹת וְסִימָן נִקּוּד. נִסְתַּכֵּל וְנַקְשִׁיב.',
    'נְחַבֵּר אֶת הָאוֹת עִם סִימָן הַנִּקּוּד. הִנֵּה הַכַּרְטִיס שֶׁמַּתְאִים.',
    'עַכְשָׁו אֶפְשָׁר לְנַסּוֹת! לְעֶזְרָה, אֶפְשָׁר לִלְחֹץ עַל הָרַמְקוֹל אוֹ עַל הָרֶמֶז.'
  ],
  discover:[
    'נְנַסֶּה יַחַד. קֹדֶם נַקְשִׁיב לַשְּׁאֵלָה.',
    'אַחַר כָּךְ נִבְחַר כַּרְטִיס אֶחָד. בַּמִּשְׂחָק אֶפְשָׁר לְנַסּוֹת שׁוּב וּלְבַקֵּשׁ רֶמֶז.',
    'עַכְשָׁו אֶפְשָׁר לְנַסּוֹת! נַקְשִׁיב, נַחְשֹׁב וְנִבְחַר.'
  ],
  build:[
    'נְנַסֶּה יַחַד. הַתְּמוּנָה מַרְאָה אֵיזוֹ מִלָּה נַרְכִּיב. הָרַמְקוֹל מַשְׁמִיעַ אוֹתָהּ.',
    'נִלְחַץ עַל הַחֵלֶק הָרִאשׁוֹן, וְאָז עַל הַחֵלֶק הַבָּא. הַחֲלָקִים נִכְנָסִים לַמְּקוֹמוֹת מִיָּמִין לִשְׂמֹאל.',
    'עַכְשָׁו אֶפְשָׁר לְנַסּוֹת! כְּשֶׁכָּל הַחֲלָקִים בַּמָּקוֹם, נִלְחַץ עַל הַכַּפְתּוֹר הַיָּרֹק עִם הַסִּימָן. אֶפְשָׁר לִלְחֹץ עַל חֵלֶק כְּדֵי לְשַׁנּוֹת.'
  ],
  memory:[
    'נְנַסֶּה יַחַד. בְּצַד אֶחָד יֵשׁ כַּרְטִיס, וּבַצַּד הַשֵּׁנִי תְּמוּנָה.',
    'נִבְחַר כַּרְטִיס וְתְמוּנָה מַתְאִימָה. הִנֵּה, יָצַרְנוּ קֶשֶׁר!',
    'עַכְשָׁו אֶפְשָׁר לְנַסּוֹת! הַכַּרְטִיסִים נִשְׁאָרִים גְּלוּיִים. אֶפְשָׁר לְהַקְשִׁיב לְשֵׁמוֹת הַתְּמוּנוֹת בָּרַמְקוֹל.'
  ]
};
export function instructionSpeech(session){
  if(session.demo){
    const {mode,demoStep:step}=session,q=session.questions[session.index];
    const spoken=[DEMOS[mode][step]];
    if(step===0){
      if(mode==='build')spoken.push(q.text);
      else if(mode!=='memory')spoken.push(...instructionSpeech({...session,demo:false}));
    }
    if(step===1&&q.explanation)spoken.push(q.explanation);
    return spoken;
  }
  if(session.mode==='build')return [GUIDE.build];
  if(session.mode==='memory')return [GUIDE.connect];
  const q=session.questions[session.index];
  // Narrate instructions, not the text the child is learning to decode.
  // Sound/rhyme tasks require hearing the source word to be answerable.
  const result=[q.speech||q.prompt];
  if(q.hideLabel||q.kind==='rhyme')result.push(q.audio||q.label);
  return result.filter(Boolean);
}
export function audioKey(text){let h=2166136261;for(const c of text.normalize('NFC')){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return(h>>>0).toString(16);}
export function narrationTexts(lessons){
  const texts=new Set([...Object.values(GUIDE),...Object.values(DEMOS).flat(),
    'כָּל הַכָּבוֹד!','הַכַּרְטִיסִים מַתְאִימִים!','נְחַבֵּר חֲלָקִים לְמִלָּה.',
    'נִבְחַר כַּרְטִיס מִכָּל צַד וּנְחַבֵּר בֵּינֵיהֶם.'
  ]);
  for(const l of lessons){
    if(l.rule){texts.add(l.rule.text);if(l.rule.result)texts.add(l.rule.result);}
    for(const q of l.questions){texts.add(questionSpeech(q));texts.add(q.speech||q.prompt);for(const key of ['audio','label','hint','explanation'])if(q[key])texts.add(q[key]);}
    for(const w of l.words)texts.add(w.text);
  }
  return [...texts];
}
