"""Build-time generation only. No service calls or API keys in the web app."""
import asyncio, json, pathlib, sys
import edge_tts

async def main():
    manifest = json.loads(pathlib.Path(sys.argv[1]).read_text())
    directory = pathlib.Path(sys.argv[2])
    directory.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(3)
    done = 0
    async def generate(clip):
        nonlocal done
        final = directory / (clip.get('cacheId', clip['id']) + '.mp3')
        if not final.exists() or final.stat().st_size < 1000:
            async with semaphore:
                temp = final.with_suffix('.tmp')
                try:
                    await asyncio.wait_for(edge_tts.Communicate(clip.get('spokenText', clip['text']), 'he-IL-HilaNeural', rate='-12%').save(str(temp)), timeout=60)
                    if temp.stat().st_size < 1000:
                        raise RuntimeError('Empty speech output')
                    temp.replace(final)
                finally:
                    temp.unlink(missing_ok=True)
        done += 1
        if done % 40 == 0 or done == len(manifest):
            print(f'Voice clips: {done}/{len(manifest)}', flush=True)
    unique = {clip.get('cacheId', clip['id']): clip for clip in manifest}
    await asyncio.gather(*(generate(clip) for clip in unique.values()))

asyncio.run(main())
