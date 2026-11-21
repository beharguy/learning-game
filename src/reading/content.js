// Transcribed from the two pages supplied by the parent. A cat drawing is a
// rebus in the second page, not a new written word for the child to decode.
export const WORDS = {
 dan:{text:'דָּן',parts:['דָּ','ן'],sound:'da',say:'דן'},
 ran:{text:'רָן',parts:['רָ','ן'],sound:'ra',say:'רָן'},
 ba:{text:'בָּא',parts:['בָּא'],say:'בָּא'},
 lagan:{text:'לַגַּן',parts:['לַ','גַּן'],sound:'la',say:'לַגַּן'},
 raa:{text:'רָאָה',parts:['רָ','אָה'],sound:'ra',say:'רָאָה'},
 tsav:{text:'צָב',parts:['צָ','ב'],sound:'tsa',say:'צָב'},
 hatsav:{text:'הַצָּב',parts:['הַ','צָּב'],sound:'ha',say:'הַצָּב'},
 zakhal:{text:'זָחַל',parts:['זָ','חַל'],sound:'za',say:'זָחַל'},
 natan:{text:'נָתַן',parts:['נָ','תַן'],sound:'na',say:'נָתַן'},
 khasa:{text:'חַסָּה',parts:['חַ','סָּה'],sound:'kha',say:'חַסָּה'},
 latsav:{text:'לַצָּב',parts:['לַ','צָּב'],sound:'la',say:'לַצָּב'},
 akhal:{text:'אָכַל',parts:['אָ','כַל'],sound:'a',say:'אָכַל'},
 samakh:{text:'שָׂמַח',parts:['שָׂ','מַח'],sound:'sa',say:'שָׂמַח'},
 kafats:{text:'קָפַץ',parts:['קָ','פַץ'],sound:'ka',say:'קָפַץ'},
 al:{text:'עַל',parts:['עַ','ל'],sound:'a',say:'עַל'},
 hagag:{text:'הַגַּג',parts:['הַ','גַּג'],sound:'ha',say:'הַגַּג'},
 daag:{text:'דָּאַג',parts:['דָּ','אַג'],sound:'da',say:'דָּאַג'},
 yarad:{text:'יָרַד',parts:['יָ','רַד'],sound:'ya',say:'יָרַד'},
 cat:{text:'🐱',picture:true,say:'חָתוּל'},
 thecat:{text:'הַ🐱',picture:true,say:'הַחָתוּל'},
};
export const STORIES = [
 {id:'dan',title:'דָּן וְהַצָּב',symbol:'🐢',color:'green',lines:[
  ['dan','ba','lagan'],['dan','raa','tsav'],['hatsav','zakhal'],
  ['dan','natan','khasa','latsav'],['hatsav','akhal','khasa'],['dan','samakh'],
 ]},
 {id:'ran',title:'רָן בַּגַּן',symbol:'🐱',color:'blue',lines:[
  ['ran','ba','lagan'],['ran','raa','cat'],['thecat','kafats','al','hagag'],
  ['ran','daag'],['thecat','yarad'],['ran','samakh'],
 ]},
];
export const CUES = {
 choose:'שני סיפורים מחכים לנו. נבחר בצב או בחתול, ונתחיל בצעד קטן.',
 blend:'נחבר צלילים למילה. לחיצה על הרמקול מחברת. אפשר גם לגעת בחלקים.',
 word:'איזו מילה שמענו? נקרא את הכרטיסים בקול, ונבחר את המילה המתאימה.',
 retry:'נקשיב שוב. אפשר לחבר את הצלילים בעזרת הכפתור עם החלקים.',
 line:'עכשיו נקרא את השורה בקול. אפשר לשמוע אותה, או לגעת במילה לעזרה. אחרי הניסיון, נלחץ על הכוכב.',
 story:'הנה הסיפור כולו. נקרא בנחת. אפשר לשמוע כל שורה, ולגעת בכל מילה לעזרה.',
 pause:'אפשר לנוח. המקום שלנו נשמר. נחזור כשיתאים.',
 finish:'הסיפור שלנו הושלם! אפשר לקרוא שוב, לבחור סיפור אחר, או לנוח.',
 together:'נקרא יחד, לאט.',
};
// These are /a/ syllable sounds, never the alphabet's letter names. Final
// consonants are introduced by hearing the joined word (da → dan), not by
// adding an artificial vowel to nun/bet/lamed. Silent א/ה stay with their vowel.
export const SOUNDS = {da:'דָא',ra:'רַה',la:'לַה',tsa:'צַה',ha:'הַה',za:'זַה',na:'נַה',kha:'חַה',a:'אַה',sa:'סַה',ka:'קַה',ya:'יַה'};
export const storyById=id=>STORIES.find(s=>s.id===id);
export const lineText=(story,i)=>story.lines[i].map(id=>WORDS[id].text).join(' ')+'.';
export const lineSpeech=(story,i)=>story.lines[i].map(id=>WORDS[id].say).join(' ')+'.';
export function newWords(story,line){
 const earlier=new Set(story.lines.slice(0,line).flat());
 return [...new Set(story.lines[line])].filter(id=>!earlier.has(id)&&!WORDS[id].picture);
}
export function audioCatalog(){
 const clips={};
 for(const [id,text] of Object.entries(CUES))clips['cue-'+id]={text};
 for(const [id,text] of Object.entries(SOUNDS))clips['sound-'+id]={text};
 for(const [id,word] of Object.entries(WORDS))clips['word-'+id]={text:word.say};
 for(const story of STORIES)for(let i=0;i<story.lines.length;i++)clips[`line-${story.id}-${i}`]={text:lineSpeech(story,i),words:story.lines[i].length};
 return clips;
}
