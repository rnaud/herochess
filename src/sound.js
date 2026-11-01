// Small synthesized cues: no downloads, autoplay, or overlapping long music.
export class GameSound {
 constructor(){this.context=null;this.nodes=new Set();this.enabled=true;try{this.enabled=localStorage.getItem('herochess-sound')!=='off';}catch{}}
 async unlock(){
  if(!this.enabled)return;
  try{if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=.18;this.master.connect(this.context.destination);}if(this.context.state==='suspended')await this.context.resume();}catch{}
 }
 stop(){for(const node of this.nodes){try{node.stop();}catch{}}this.nodes.clear();}
 async toggle(){this.enabled=!this.enabled;try{localStorage.setItem('herochess-sound',this.enabled?'on':'off');}catch{}if(!this.enabled)this.stop();else{await this.unlock();this.play('select');}}
 tone(frequency,end,delay,duration,type='sine',volume=.3){
  const c=this.context,osc=c.createOscillator(),gain=c.createGain(),t=c.currentTime+delay;osc.type=type;osc.frequency.setValueAtTime(frequency,t);osc.frequency.exponentialRampToValueAtTime(end,t+duration);gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.008);gain.gain.exponentialRampToValueAtTime(.001,t+duration);osc.connect(gain);gain.connect(this.master);this.nodes.add(osc);osc.onended=()=>{this.nodes.delete(osc);osc.disconnect();gain.disconnect();};osc.start(t);osc.stop(t+duration+.01);
 }
 play(kind,family){
  if(!this.enabled||this.context?.state!=='running')return;
  try{
   if(kind==='select')this.tone(660,880,0,.065,'sine',.12);
   else if(kind==='deal')for(let i=0;i<3;i++)this.tone(180+i*45,100,i*.17,.075,'triangle',.18);
   else if(kind==='move'){this.tone(180,75,0,.085,'triangle',.65);this.tone(650,350,.03,.055,'sine',.12);}
   else if(kind==='rewind'){[880,660,440,220].forEach((f,i)=>this.tone(f,f*.6,i*.09,.3,'sine',.3));}
   else if(kind==='capture'){this.tone(100,35,0,.23,'triangle',.9);this.tone(320,65,.03,.15,'sawtooth',.15);this.tone(1200,400,.08,.12,'sine',.15);}
   else if(kind==='check'){for(let i=0;i<3;i++){this.tone(i===2?660:440,i===2?660:440,i*.16,.13,'triangle',.45);}}
   else if(kind==='mate'){[330,262,220,165].forEach((f,i)=>this.tone(f,f,i*.15,.45,'triangle',.35));}
   else if(kind==='castle'){this.play('move');this.tone(240,110,.16,.11,'triangle',.4);}
   else if(kind==='power'){const root={offense:220,defense:520,mobility:392,tactics:740}[family]||440;[1,1.5,2].forEach((m,i)=>this.tone(root*m,root*m*1.25,i*.07,.3,'sine',.25));this.tone(90,45,0,.25,'triangle',.3);}
  }catch{}
 }
}
