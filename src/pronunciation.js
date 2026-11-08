// Input hints for the speech engine only. Never display this respelling in a
// reading exercise: the child's text keeps its original spelling and niqqud.
const replacements=[
  ['כָּל','כּוֹל'], ['כָל','כוֹל'],
  ['נִקּוּד','נִיקוּד'], ['נִּקּוּד','נִיקוּד'],
  // The family's name is al-MA. Two familiar speech tokens cue final stress;
  // the reading/UI text must remain the single name עַלְמָה.
  ['עַלְמָה','עַל מָה'],
  // Hila misreads the fully pointed button noun. Its ordinary spelling lets
  // the voice's Hebrew lexicon resolve kaftor in the surrounding sentence.
  ['הַכַּפְתּוֹר','הכפתור'], ['כַּפְתּוֹר','כפתור'],
  // Let the Hebrew lexicon resolve dmut without over-articulating the pointed
  // opening of the map instruction. Keep its displayed niqqud unchanged.
  ['דְּמוּת','דמות'],
  // Input used for the success recording. Unpointed spelling alone did not
  // fix its duration; scripts/audio-edits preserves the approved timing edit.
  ['תְּשׁוּבָה נְכוֹנָה','תשובה נכונה']
].map(([from,to])=>[from.normalize('NFC'),to.normalize('NFC')]);
export function pronunciationText(text){
  let result=text.normalize('NFC');
  for(const [from,to] of replacements)result=result.replace(new RegExp(from+'(?![\\p{L}\\p{M}])','gu'),to);
  return result;
}
