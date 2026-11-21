# Two stories, one small step at a time

Entry: `#stories`, also the illustrated book button on the welcome screen and
neighborhood map. Direct resumable routes: `#read/dan` and `#read/ran`.

The 12 lines were transcribed from the parent's two supplied photographs on
2026-11-21. The source photographs are not included in the public repository.
The second story retains its cat pictograms, including the pointed הַ prefix.
It does not introduce the written word חתול as a decoding requirement.

Each line introduces only words not yet introduced in that story. The child:

1. Taps to hear a first sound grow into the joined word. The parts light up in
   right-to-left order. Silent א/ה remain with their vowel; final consonants are
   heard in the blended word, not as alphabet names or artificial syllables.
2. Hears a word and reads three shuffled written choices. A retry offers help;
   a correct selection saves immediately and advances after the word is heard.
3. Tries reading the line aloud. Any word opens a small blending helper. A
   continuous recording models the line; a slow option and measured word
   boundaries support tracking the print. The star records an attempted read.
4. Reads the entire six-line story, with optional word/line/full-story help.

Each stage's explanation plays only once per visit; later words use short word
cues. The speaker help button always repeats the full explanation on request.

There is no microphone, pronunciation scoring, deadline, lost life, or streak.
Line and whole-story stars are explicitly self-reported practice, not evidence
of fluency. The parent explanation is available on the story shelf.

The instructional structure adapts the sound–print, decoding, and connected-text
practice recommendations in [IES's foundational reading guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/21/)
to the supplied pointed Hebrew text. This is a design rationale, not a claim
that this specific game has been clinically or experimentally validated.

## Persistence and playback

Reading progress is a validated `reading` field in the existing
`alma-neighborhood-v2` record. Each story has its own cursor and practiced lines.
All earlier neighborhood progress remains intact. Existing export/import/reset
includes reading; old backups get an empty reading record. Review preserves
earned practice. Changing story, pausing, reloading, or backgrounding cancels
playback; completed practice is saved before celebration.

The voice is the existing Hila voice at -12%. Slow practice uses playback rate
0.8. The reader shares the app's one mobile-unlocked audio element. The new 53
clips are separate from previously approved neighborhood recordings and are
pre-cached by the existing service worker. Generated word boundaries drive
highlighting from the real media clock. Explicit play buttons also work when
automatic narration is muted.

Generate with `.venv-voice/bin/python scripts/generate-reading-audio.py`.
`docs/reading-voice-review.json` records the parent-approved revision of da/Dan,
including the name inside two lines; a test pins the approved audio bytes.
The displayed pointed spelling is unchanged by speech-input corrections.

## Art

Built-in ImageGen generated the project asset
`public/assets/neighborhood/reading-stories.webp` (WebP conversion of the
original). Reference: the existing Yael library illustration. Final prompt:

> Use case: illustration-story. Create ONE wide two-panel game illustration atlas,
> 2:1 aspect ratio, split into two equal square illustrations with a clean straight
> middle boundary. For a Hebrew six-year-old reading game in a bright modern
> low-poly isometric neighborhood. Left square: a friendly young boy with short
> brown hair wearing a yellow T-shirt and blue shorts kneels on garden path and
> offers a lettuce leaf to a cute small turtle. Right square: a different friendly
> young boy in a coral red T-shirt and blue shorts stands in a garden looking up
> at a friendly gray cat perched on a LOW blue-roofed garden shed. Both warm
> cheerful, vivid green faceted trees and flowers, turquoise canal, coral small
> bridge in background, polished playful 3D low-poly environment, expressive
> rounded characters. Compose each square independently with boy and animal in
> center; readable at small size; leave airy sky in upper quarter. No letters,
> no typography, no UI, no border, no watermark. Child safe and calm. Match visual
> style of supplied neighborhood illustration, but create new scenes and boys.

## Verification

`npm run build && npm test`, `npm run test:reading`, `npm run test:map`.
Browser scripts use isolated profiles; they never touch family browser data.
The reading script mounts the build under `/learning-game/`, exercises both
complete journeys, real audio and highlights, retry/help, checkpoint recovery,
five viewport sizes, offline audio and byte-range requests. Reports and
screenshots are written to the ignored `docs/screenshots/reading/` directory.
