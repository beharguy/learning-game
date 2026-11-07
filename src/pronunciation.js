// Input hints for the speech engine only. Never display this respelling in a
// reading exercise: the child's text keeps its original spelling and niqqud.
const replacements=[
  ['כָּל','כּוֹל'], ['כָל','כוֹל'],
  ['נִקּוּד','נִיקוּד'], ['נִּקּוּד','נִיקוּד']
].map(([from,to])=>[from.normalize('NFC'),to.normalize('NFC')]);
export function pronunciationText(text){
  let result=text.normalize('NFC');
  for(const [from,to] of replacements)result=result.replace(new RegExp(from+'(?![\\p{L}\\p{M}])','gu'),to);
  return result;
}
