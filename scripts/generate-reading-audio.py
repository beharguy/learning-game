"""Build only the reading adventure's clips; leave approved neighborhood voice intact.

Catalog comes from content.js. WordBoundary metadata follows the real media clock,
not guessed timers. Run with .venv-voice/bin/python scripts/generate-reading-audio.py.
"""
import asyncio, json, subprocess, pathlib, hashlib
import edge_tts

ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=ROOT/'public'/'reading-audio'
CATALOG=json.loads(subprocess.check_output(['node','--input-type=module','-e',
 "import {audioCatalog} from './src/reading/content.js'; console.log(JSON.stringify(audioCatalog()))"],cwd=ROOT))
OUT.mkdir(parents=True,exist_ok=True)
VOICE='he-IL-HilaNeural'
RATE='-12%'
async def main():
    manifest_path=OUT/'manifest.json'
    previous=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    clips={}
    sem=asyncio.Semaphore(3)
    async def generate(key, spec):
        digest=hashlib.sha256((spec['text']+VOICE+RATE).encode()).hexdigest()[:16]
        cached=previous.get('clips',{}).get(key,{})
        if cached.get('digest')==digest and (OUT/(key+'.mp3')).exists():
            clips[key]=cached; return
        async with sem:
            for attempt in range(3):
                try:
                    data=bytearray(); boundaries=[]
                    async def stream():
                        async for item in edge_tts.Communicate(spec['text'],VOICE,rate=RATE,boundary='WordBoundary').stream():
                            if item['type']=='audio': data.extend(item['data'])
                            elif item['type']=='WordBoundary': boundaries.append({'start':item['offset']/1e7,'duration':item['duration']/1e7,'text':item['text']})
                    await asyncio.wait_for(stream(),60)
                    if not data: raise RuntimeError('empty audio')
                    if spec.get('words') and len(boundaries)!=spec['words']:
                        raise RuntimeError(f'expected {spec["words"]} words, got {boundaries}')
                    (OUT/(key+'.mp3')).write_bytes(data)
                    clips[key]={'text':spec['text'],'digest':digest,'boundaries':boundaries}
                    print('Generated',key,flush=True);return
                except Exception:
                    if attempt==2: raise
                    await asyncio.sleep(2)
    await asyncio.gather(*(generate(k,v) for k,v in CATALOG.items()))
    manifest_path.write_text(json.dumps({'voice':VOICE,'rate':RATE,'clips':dict(sorted(clips.items()))},ensure_ascii=False,indent=2)+'\n')
    print(f'Validated {len(clips)} reading clips.')
asyncio.run(main())
