import { audioKey } from './narration.js';
// Reuse one media element: subsequent clips keep the initial tap's playback
// permission on mobile browsers. A new request cancels the previous sequence.
export class VoicePlayer {
  constructor(audio,onBlocked=()=>{}){this.audio=audio;this.onBlocked=onBlocked;this.run=0;this.finish=null;}
  stop(){
    this.run++;this.audio.pause();
    this.finish?.(false);this.finish=null;
    this.audio.onended=null;this.audio.onerror=null;
  }
  async play(texts,{enabled=true,force=false}={}){
    this.stop();
    if(!enabled&&!force)return false;
    const run=this.run;
    for(const text of texts.filter(Boolean)){
      if(run!==this.run)return false;
      const ok=await new Promise(resolve=>{
        const finish=result=>{
          if(this.finish===finish){this.finish=null;this.audio.onended=null;this.audio.onerror=null;}
          resolve(result);
        };
        this.finish=finish;
        this.audio.onended=()=>finish(true);
        this.audio.onerror=()=>{if(run===this.run)this.onBlocked();finish(false);};
        this.audio.src=`./audio/${audioKey(text)}.mp3`;
        this.audio.play().catch(()=>{if(run===this.run)this.onBlocked();finish(false);});
      });
      if(!ok)return false;
    }
    return run===this.run;
  }
}
