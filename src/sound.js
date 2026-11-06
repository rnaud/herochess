// Small synthesized cues: no downloads, autoplay, or overlapping long music.
const MOODS={
 calm:{root:146.83,intervals:[0,7,12,16],filter:1100},
 tension:{root:138.59,intervals:[0,6,12,15],filter:900},
 victory:{root:146.83,intervals:[0,4,7,12],filter:1300},
 defeat:{root:130.81,intervals:[0,3,7,10],filter:700}
};
export class GameSound {
 constructor(){
  this.context=null;this.nodes=new Set();this.musicNodes=new Set();this.enabled=true;
  this.musicEnabled=false;this.musicTimer=null;this.musicStep=0;this.mood='calm';
  this.sfxVolume=1;this.musicVolume=.55;
  try{
   this.enabled=localStorage.getItem('herochess-sound')!=='off';
   this.musicEnabled=localStorage.getItem('herochess-music')==='on';
   const sfx=Number(localStorage.getItem('herochess-sfx-volume'));if(Number.isFinite(sfx))this.sfxVolume=Math.max(0,Math.min(1,sfx));
   const music=Number(localStorage.getItem('herochess-music-volume'));if(Number.isFinite(music))this.musicVolume=Math.max(0,Math.min(1,music));
  }catch{}
 }
 async unlock(){
  if(!this.enabled&&!this.musicEnabled)return;
  try{
   if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=.18;this.master.connect(this.context.destination);this.sfx=this.context.createGain();this.sfx.gain.value=this.sfxVolume;this.sfx.connect(this.master);this.musicBus=this.context.createGain();this.musicBus.gain.value=this.musicVolume*.22;this.musicBus.connect(this.master);}
   if(this.context.state==='suspended')await this.context.resume();
   if(this.musicEnabled)this.startMusic();
  }catch{}
 }
 stop(){for(const node of this.nodes){try{node.stop();}catch{}}this.nodes.clear();}
 async toggle(){this.enabled=!this.enabled;try{localStorage.setItem('herochess-sound',this.enabled?'on':'off');}catch{}if(!this.enabled)this.stop();else{await this.unlock();this.play('select');}}
 setSfxVolume(value){this.sfxVolume=Math.max(0,Math.min(1,Number(value)||0));try{localStorage.setItem('herochess-sfx-volume',String(this.sfxVolume));}catch{}if(this.sfx)this.sfx.gain.value=this.sfxVolume;}
 setMusicVolume(value){this.musicVolume=Math.max(0,Math.min(1,Number(value)||0));try{localStorage.setItem('herochess-music-volume',String(this.musicVolume));}catch{}if(this.musicBus)this.musicBus.gain.value=this.musicVolume*.22;}
 async toggleMusic(){
  this.musicEnabled=!this.musicEnabled;try{localStorage.setItem('herochess-music',this.musicEnabled?'on':'off');}catch{}
  if(this.musicEnabled){await this.unlock();this.startMusic();}
  else this.stopMusic();
  return this.musicEnabled;
 }
 startMusic(){
  if(!this.musicEnabled||!this.context||this.musicTimer)return;
  this.musicPulse();this.musicTimer=setInterval(()=>this.musicPulse(),5200);
 }
 stopMusic(){
  clearInterval(this.musicTimer);this.musicTimer=null;
  for(const node of this.musicNodes){try{node.stop();}catch{}}this.musicNodes.clear();
 }
 setMood(mood){if(MOODS[mood])this.mood=mood;}
 musicTone(frequency,end,delay,duration,type='sine',volume=.04){
  const c=this.context;if(!c||c.state!=='running')return;
  const osc=c.createOscillator(),gain=c.createGain(),t=c.currentTime+delay;
  osc.type=type;osc.frequency.setValueAtTime(frequency,t);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);
  gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.05);gain.gain.exponentialRampToValueAtTime(.001,t+duration);
  osc.connect(gain);gain.connect(this.musicBus);this.musicNodes.add(osc);
  osc.onended=()=>{this.musicNodes.delete(osc);osc.disconnect();gain.disconnect();};
  osc.start(t);osc.stop(t+duration+.01);
 }
 musicPulse(){
  const c=this.context;if(!c||c.state!=='running'||!this.musicEnabled)return;
  const mood=MOODS[this.mood]||MOODS.calm,step=this.musicStep++;
  const chord=mood.intervals.map((semi,i)=>mood.root*Math.pow(2,semi/12)/(i===0?2:1.5));
  const filter=c.createBiquadFilter(),pad=c.createGain(),t=c.currentTime;
  filter.type='lowpass';filter.frequency.setValueAtTime(mood.filter,t);filter.Q.value=.7;
  pad.gain.setValueAtTime(.001,t);pad.gain.exponentialRampToValueAtTime(.035,t+2.4);pad.gain.setValueAtTime(.035,t+5.2);pad.gain.exponentialRampToValueAtTime(.001,t+8.4);
  filter.connect(pad);pad.connect(this.musicBus);
  for(const frequency of chord){
   const osc=c.createOscillator(),g=c.createGain();osc.type='sine';osc.frequency.value=frequency;g.gain.value=.35;osc.connect(g);g.connect(filter);osc.start(t);osc.stop(t+8.5);this.musicNodes.add(osc);
   osc.onended=()=>{this.musicNodes.delete(osc);osc.disconnect();g.disconnect();};
  }
  const root=mood.root*2,arp=[0,7,12,7,16,12,7,4][step%8];
  this.musicTone(root*Math.pow(2,arp/12),root*Math.pow(2,arp/12)*.997,.2,2.6,'triangle',.028);
  setTimeout(()=>{try{pad.disconnect();filter.disconnect();}catch{}},8600);
 }
 tone(frequency,end,delay,duration,type='sine',volume=.3){
  const c=this.context,osc=c.createOscillator(),gain=c.createGain(),t=c.currentTime+delay;osc.type=type;osc.frequency.setValueAtTime(frequency,t);osc.frequency.exponentialRampToValueAtTime(end,t+duration);gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.008);gain.gain.exponentialRampToValueAtTime(.001,t+duration);osc.connect(gain);gain.connect(this.sfx||this.master);this.nodes.add(osc);osc.onended=()=>{this.nodes.delete(osc);osc.disconnect();gain.disconnect();};osc.start(t);osc.stop(t+duration+.01);
 }
 impact(material='stone',strength=1){
  if(!this.enabled||this.context?.state!=='running')return;
  try{
   const base={wood:150,air:260,glass:820,stone:110,gold:760,deep:80}[material]||130;
   this.tone(base,base*.28,0,.09,'triangle',.28*strength);
   this.tone(base*1.8,base*.45,.012,.055,'square',.06*strength);
   if(material==='glass')this.tone(1600,700,.02,.1,'sine',.12*strength);
   if(material==='gold')this.tone(1200,600,.03,.12,'sine',.1*strength);
  }catch{}
 }
 play(kind,family){
  if(!this.enabled||this.context?.state!=='running')return;
  try{
   if(kind==='select')this.tone(660,880,0,.065,'sine',.12);
   else if(kind==='draw')this.tone(240,120,0,.09,'triangle',.18);
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
