import {CARDS} from './cards.js';
import {actionTiming} from './motion.js';
import {CARD_FX,FAMILY_COLORS,PIECE_DEBRIS} from './fx-specs.js';

const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd=(a,b)=>a+Math.random()*(b-a);
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Pixel-native, screen-space particles over either board view.
// Table gets a soft canvas glow via CSS; Pixel keeps the chunky squares.
export class PixelFX {
 constructor(canvas,shell){
  this.canvas=canvas;this.shell=shell;this.ctx=canvas?canvas.getContext('2d'):null;
  this.particles=[];this.effects=[];this.timeouts=[];this.shakeAnim=null;this.running=false;this.raf=0;this.last=0;this._tick=this.tick.bind(this);
  this.intensity='full';this.w=1;this.h=1;this.dpr=Math.min(devicePixelRatio||1,2);this.ambientTimer=null;
  this.mark(false);
  if(canvas&&shell){this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(shell);this.resize();}
 }
 mark(value){if(this.canvas)this.canvas.dataset.active=String(value);}
 enabled(){return this.intensity!=='off'&&!reduced()&&!document.hidden;}
 factor(){return this.intensity==='subtle'?.42:1;}
 setIntensity(value){this.intensity=value;if(value==='off')this.cancel();this.startAmbient();}
 resize(){
  if(!this.canvas||!this.shell)return;
  const w=Math.max(1,this.shell.clientWidth),h=Math.max(1,this.shell.clientHeight);
  this.w=w;this.h=h;this.canvas.width=Math.round(w*this.dpr);this.canvas.height=Math.round(h*this.dpr);
  this.canvas.style.width=w+'px';this.canvas.style.height=h+'px';
  this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);this.ctx.imageSmoothingEnabled=false;
 }
 local(point){if(!point)return null;const r=this.canvas.getBoundingClientRect();return{x:point.x-r.left,y:point.y-r.top};}
 start(){if(!this.ctx||this.running||!this.enabled())return;this.running=true;this.last=performance.now();this.mark(true);this.raf=requestAnimationFrame(this._tick);}
 tick(now){
  if(!this.running)return;
  const dt=clamp(now-this.last,0,34);this.last=now;const step=dt/16.667;
  for(const p of this.particles){
   if(p.delay>0){p.delay-=dt;continue;}
   p.life-=dt;if(p.life<=0)continue;
   p.x+=p.vx*step;p.y+=p.vy*step;p.vy+=p.g*step;
   p.vx*=Math.pow(p.drag,step);p.vy*=Math.pow(p.drag,step);p.rot+=p.spin*step;
  }
  for(const e of this.effects){if(e.delay>0)e.delay-=dt;else e.life-=dt;}
  this.particles=this.particles.filter(p=>p.life>0);
  this.effects=this.effects.filter(e=>e.life>0);
  this.draw();
  if(!this.particles.length&&!this.effects.length){this.running=false;this.mark(false);return;}
  this.raf=requestAnimationFrame(this._tick);
 }
 draw(){
  const ctx=this.ctx;ctx.clearRect(0,0,this.w,this.h);
  for(const e of this.effects){if(e.delay>0)continue;const a=clamp(e.life/e.max,0,1);this.drawEffect(e,a);}
  for(const p of this.particles){
   if(p.delay>0)continue;const t=clamp(p.life/p.max,0,1);
   ctx.globalAlpha=p.alpha*t;ctx.fillStyle=p.color;
   if(p.shape==='square'){ctx.fillRect(Math.round(p.x-p.size/2),Math.round(p.y-p.size/2),p.size,p.size);}
   else if(p.shape==='spark'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillRect(-p.size/2,-p.size*1.5,p.size,p.size*3);ctx.restore();}
   else if(p.shape==='shard'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);ctx.restore();}
   else if(p.shape==='crystal'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4);ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);ctx.restore();}
   else if(p.shape==='confetti'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2);ctx.restore();}
   else{ctx.fillRect(Math.round(p.x),Math.round(p.y),p.size,p.size);}
  }
  ctx.globalAlpha=1;
 }
 drawEffect(e,a){
  const ctx=this.ctx;
  if(e.type==='flash'){ctx.globalAlpha=e.alpha*a;ctx.fillStyle=e.color;ctx.fillRect(0,0,this.w,this.h);ctx.globalAlpha=1;return;}
  if(e.type==='ring'){
   const r=lerp(e.r0,e.r1,1-a),blocks=e.blocks||24,sz=e.size||3;
   ctx.globalAlpha=.95*a;ctx.fillStyle=e.color;
   for(let i=0;i<blocks;i++){const angle=i*Math.PI*2/blocks;ctx.fillRect(Math.round(e.x+Math.cos(angle)*r-sz/2),Math.round(e.y+Math.sin(angle)*r-sz/2),sz,sz);}
   ctx.globalAlpha=1;return;
  }
  if(e.type==='beam'){
   const dx=e.x2-e.x1,dy=e.y2-e.y1,len=Math.hypot(dx,dy),steps=Math.max(2,Math.round(len/(e.step||7))),nx=-dy/len,ny=dx/len;
   ctx.globalAlpha=.9*a;ctx.fillStyle=e.color;
   for(let i=0;i<=steps;i++){
    const t=i/steps,jitter=Math.sin(i*1.7+e.seed)*e.jitter;
    ctx.fillRect(Math.round(e.x1+dx*t+nx*jitter-e.size/2),Math.round(e.y1+dy*t+ny*jitter-e.size/2),e.size,e.size);
   }
   if(e.core){ctx.globalAlpha=a;ctx.fillStyle=e.core;for(let i=0;i<=steps;i+=2){const t=i/steps;ctx.fillRect(Math.round(e.x1+dx*t-e.size/4),Math.round(e.y1+dy*t-e.size/4),Math.max(1,e.size/2),Math.max(1,e.size/2));}}
   ctx.globalAlpha=1;return;
  }
  if(e.type==='snowflake'){
   const reveal=clamp((1-a)*2.4,0,1),r=e.size*reveal;ctx.globalAlpha=.9*a;ctx.fillStyle=e.color;
   for(let arm=0;arm<6;arm++){
    const angle=arm*Math.PI/3+e.spin;
    for(let i=0;i<7;i++){
     const t=i/6,px=e.x+Math.cos(angle)*r*t,py=e.y+Math.sin(angle)*r*t;
     ctx.fillRect(Math.round(px-1.5),Math.round(py-1.5),3,3);
     if(i>2&&i<6){const b=angle+Math.PI/4,bx=e.x+Math.cos(angle)*r*t+Math.cos(b)*r*.22,by=e.y+Math.sin(angle)*r*t+Math.sin(b)*r*.22;ctx.fillRect(Math.round(bx-1),Math.round(by-1),2,2);const b2=angle-Math.PI/4,bx2=e.x+Math.cos(angle)*r*t+Math.cos(b2)*r*.22,by2=e.y+Math.sin(angle)*r*t+Math.sin(b2)*r*.22;ctx.fillRect(Math.round(bx2-1),Math.round(by2-1),2,2);}
    }
   }
   ctx.globalAlpha=1;return;
  }
  if(e.type==='hex'){
   const r=lerp(e.r0||10,e.r1||40,1-a);ctx.globalAlpha=.9*a;ctx.fillStyle=e.color;
   for(let side=0;side<6;side++){const a0=side*Math.PI/3,ax=e.x+Math.cos(a0)*r,ay=e.y+Math.sin(a0)*r,bx=e.x+Math.cos(a0+Math.PI/3)*r,by=e.y+Math.sin(a0+Math.PI/3)*r;for(let i=0;i<=8;i++){const t=i/8;ctx.fillRect(Math.round(lerp(ax,bx,t)-1.5),Math.round(lerp(ay,by,t)-1.5),3,3);}}
   ctx.globalAlpha=1;return;
  }
 }
 addParticle(p){
  if(!this.enabled())return;
  p={delay:0,vx:0,vy:0,g:0,drag:.985,rot:0,spin:0,alpha:1,size:3,shape:'square',...p};
  p.max=p.life;this.particles.push(p);this.start();
 }
 addEffect(e){
  if(!this.enabled())return;
  e={delay:0,life:280,...e};e.max=e.life;this.effects.push(e);this.start();
 }
 later(ms,fn){
  if(!this.enabled())return;
  const t=setTimeout(()=>{this.timeouts=this.timeouts.filter(x=>x!==t);if(this.enabled())fn();},Math.max(0,ms));
  this.timeouts.push(t);
 }
 burst(point,color,count=14,opts={}){
  if(!this.enabled())return;
  count=Math.max(2,Math.round(count*this.factor()));
  for(let i=0;i<count;i++){
   const angle=opts.angle!==undefined?opts.angle+rnd(-.7,.7):rnd(0,Math.PI*2),speed=rnd(opts.speedMin||.8,opts.speedMax||3.2);
   this.addParticle({x:point.x+rnd(-2,2),y:point.y+rnd(-2,2),vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-(opts.lift||0),g:opts.gravity||.12,drag:opts.drag||.96,life:rnd(opts.lifeMin||240,opts.lifeMax||620),size:Math.round(rnd(opts.sizeMin||2,opts.sizeMax||5)),color:Math.random()<.25&&opts.accent?opts.accent:color,shape:opts.shape||'square',rot:rnd(0,6),spin:rnd(-.25,.25),alpha:opts.alpha||.9,delay:opts.delay||0});
  }
 }
 dust(point,color,count=8,opts={}){
  this.burst(point,color,count,{speedMin:.3,speedMax:1.7,gravity:.03,drag:.94,lifeMin:260,lifeMax:620,sizeMin:2,sizeMax:4,shape:'square',alpha:.5,...opts});
 }
 ring(point,color,opts={}){
  if(!this.enabled())return;
  this.addEffect({type:'ring',x:point.x,y:point.y,r0:opts.r0||4,r1:opts.r1||46,color,life:opts.life||320,size:opts.size||3,blocks:opts.blocks||24,delay:opts.delay||0});
 }
 beam(a,b,color,opts={}){
  if(!this.enabled())return;
  this.addEffect({type:'beam',x1:a.x,y1:a.y,x2:b.x,y2:b.y,color,core:opts.core||'#fff7dd',life:opts.life||260,size:opts.size||4,step:opts.step||7,jitter:opts.jitter||2.4,seed:rnd(0,9),delay:opts.delay||0});
 }
 spark(point,color,count=10,opts={}){
  this.burst(point,color,count,{speedMin:1.4,speedMax:4.8,gravity:.08,drag:.97,lifeMin:220,lifeMax:520,sizeMin:2,sizeMax:3,shape:'spark',alpha:.9,...opts});
 }
 frost(point,color,count=18,opts={}){
  this.burst(point,color,count,{speedMin:.4,speedMax:2.2,gravity:.02,drag:.94,lifeMin:430,lifeMax:900,sizeMin:2,sizeMax:5,shape:'crystal',alpha:.85,...opts});
 }
 embers(point,color,count=10,opts={}){
  this.burst(point,color,count,{speedMin:.3,speedMax:1.4,gravity:-.03,drag:.99,lifeMin:500,lifeMax:1100,sizeMin:1,sizeMax:3,shape:'square',alpha:.8,...opts});
 }
 flash(color,alpha=.12,delay=0){
  if(!this.enabled())return;
  this.addEffect({type:'flash',color,alpha:this.intensity==='subtle'?alpha*.4:alpha,life:100,delay});
 }
 shake(amount=3){
  if(!this.enabled()||!this.shell||this.intensity!=='full')return;
  const a=Math.min(9,amount);this.shakeAnim?.cancel();
  this.shakeAnim=this.shell.animate([
   {transform:'translate(0,0) scale(1)'},
   {transform:`translate(${-a}px,${a*.55}px) scale(1.006)`,offset:.16},
   {transform:`translate(${a*.8}px,${-a*.4}px) scale(1.004)`,offset:.4},
   {transform:`translate(${-a*.35}px,${a*.25}px) scale(1.002)`,offset:.68},
   {transform:'translate(0,0) scale(1)'}
  ],{duration:210+a*10,easing:'ease-out'});
  this.shakeAnim.onfinish=()=>{this.shakeAnim=null;};
 }
 haptic(pattern){
  if(!this.enabled()||this.intensity!=='full')return;
  try{navigator.vibrate?.(pattern);}catch{}
 }
 trail(a,b,color,opts={}){
  if(!this.enabled()||!a||!b)return;
  const count=Math.max(3,Math.round((opts.count||9)*this.factor())),arc=opts.arc?Math.min(48,Math.hypot(b.x-a.x,b.y-a.y)*.18):0;
  for(let i=1;i<=count;i++){
   const t=i/(count+1),x=lerp(a.x,b.x,t),y=lerp(a.y,b.y,t)-Math.sin(t*Math.PI)*arc;
   this.addParticle({x,y,vx:rnd(-.2,.2),vy:rnd(-.2,.2),g:0,drag:.98,life:rnd(150,300),size:Math.round(rnd(2,4)),color,shape:'square',alpha:.5,delay:(opts.delay||0)+t*(opts.travel||300)});
  }
 }
 portal(point,color,opts={}){
  if(!this.enabled())return;
  this.ring(point,color,{r0:52,r1:4,life:420,size:2,blocks:28,delay:opts.delay||0});
  this.ring(point,color,{r0:8,r1:30,life:260,size:2,blocks:20,delay:opts.delay||0});
  for(let i=0;i<Math.round(12*this.factor());i++){const angle=i*Math.PI*2/12,r=rnd(14,34);this.addParticle({x:point.x+Math.cos(angle)*r,y:point.y+Math.sin(angle)*r,vx:-Math.cos(angle)*1.1,vy:-Math.sin(angle)*1.1,g:0,drag:.98,life:rnd(260,480),size:2,color,shape:'square',alpha:.7,delay:opts.delay||0});}
 }
 pathTiles(state,from,to,point,color,delay){
  const fx=Math.sign((to%8)-(from%8)),fy=Math.sign((to>>3)-(from>>3));
  if(fx&&fy&&Math.abs(to%8-from%8)!==Math.abs((to>>3)-(from>>3)))return;
  const n=Math.max(Math.abs(to%8-from%8),Math.abs(to>>3-from>>3));if(n<2||n>7)return;
  for(let i=1;i<=n;i++){
   const sq=(from>>3)+fy*i;const file=from%8+fx*i;if(sq<0||sq>7||file<0||file>7)break;
   const p=this.local(point(sq*8+file));if(!p)continue;
   this.ring(p,color,{r0:2,r1:12,life:230,size:2,blocks:12,delay:delay+i*22});
  }
 }
 snowflake(point,color,opts={}){
  this.addEffect({type:'snowflake',x:point.x,y:point.y,size:opts.size||34,color,life:opts.life||760,spin:rnd(-.3,.3),delay:opts.delay||0});
 }
 hexBubble(point,color,opts={}){
  this.addEffect({type:'hex',x:point.x,y:point.y,r0:opts.r0||8,r1:opts.r1||42,color,life:opts.life||680,delay:opts.delay||0});
 }
 play(state,move,point){
  if(!this.enabled()||!point)return;
  const a=this.local(point(move.from)),b=this.local(point(move.to));if(!a||!b)return;
  const card=CARDS[move.card],spec=CARD_FX[move.card]||{},kind=spec.kind||card?.kind?.toLowerCase()||'move';
  const family=card?.family||'normal',palette=FAMILY_COLORS[family]||FAMILY_COLORS.normal,color=spec.color||palette.main;
  const timing=actionTiming(state,move),capturedSquare=move.special==='ep'?move.to+(state.turn==='w'?-8:8):move.to;
  const captured=move.special!=='swap'?state.board[capturedSquare]:null;
  const material=PIECE_DEBRIS[captured?.type]||PIECE_DEBRIS.r,darkCaptured=captured?.color==='b';
  const debrisColor=darkCaptured?'#7d94a0':material.color,debrisAccent=darkCaptured?'#dcf4ff':material.accent;
  const isCapture=!!captured&&move.special!=='shield'&&move.special!=='freeze';
  const originType=state.board[move.from]?.type;
  const stationary=move.special==='shield'||move.special==='freeze';
  const at=(ms,fn)=>this.later(ms,fn);
  // takeoff and landing weight
  if(!stationary){this.dust(a,palette.main,move.usePower?9:5,{delay:0});}
  at(timing.impact,()=>this.dust(b,isCapture?debrisColor:palette.main,isCapture?16:9,{delay:0,alpha:.65}));
  // locomotion trail
  if(!stationary&&(move.usePower||originType==='n'))this.trail(a,b,color,{arc:kind==='leap'||originType==='n',count:move.usePower?11:7,delay:timing.anticipation,travel:timing.travel});
  // path / beams for the travel families
  if(['beam','path','pawn','spear','dash','step','stone','rift'].includes(kind)&&!stationary){
   this.pathTiles(state,move.from,move.to,point,color,timing.anticipation);
   if(kind==='beam'||kind==='spear')this.beam(a,b,color,{life:timing.travel+180,size:kind==='spear'?3:4,delay:timing.anticipation,jitter:kind==='spear'?1.2:2.8,core:palette.light});
  }
  if(kind==='portal'){this.portal(a,color);this.portal(b,color,{delay:timing.impact-120});}
  if(kind==='rift'||kind==='stone'){at(timing.impact,()=>this.burst(a,color,12,{speedMin:1,speedMax:3,sizeMin:2,sizeMax:4,shape:'shard',lifeMin:350,lifeMax:700}));}
  if(kind==='arc'){this.spark(a,color,6,{delay:0});}
  if(kind==='dash'){this.burst(a,color,7,{angle:Math.atan2(b.y-a.y,b.x-a.x)+Math.PI,speedMin:.5,speedMax:2,shape:'spark',sizeMin:2,sizeMax:4});}
  if(kind==='pawn'){this.dust(a,color,7,{delay:0});at(timing.impact,()=>this.burst(b,color,10,{speedMin:.4,speedMax:1.8,dust:.05,shape:'square'}));}
  if(kind==='step'){this.ring(a,color,{r0:4,r1:22,life:240,size:2,blocks:14,delay:0});}
  if(kind==='swap'){this.trail(a,b,color,{arc:true,count:8,delay:timing.anticipation,travel:timing.travel});this.trail(b,a,color,{arc:true,count:8,delay:timing.anticipation,travel:timing.travel});this.beam(a,b,color,{life:200,size:2,delay:timing.impact,core:palette.light});}
  if(kind==='ward'){at(timing.anticipation,()=>{this.hexBubble(a,color,{r0:10,r1:44,life:760});this.ring(a,color,{r0:34,r1:12,life:520,size:3,blocks:28});this.ring(a,color,{r0:8,r1:42,life:560,size:2,blocks:24});this.burst(a,color,24,{speedMin:.3,speedMax:1.7,gravity:-.01,sizeMin:2,sizeMax:5,shape:'crystal',lifeMin:500,lifeMax:950});this.flash(color,.1);});}
  if(kind==='frost'&&move.freezeTarget!==undefined){const fp=this.local(point(move.freezeTarget));if(fp)at(timing.anticipation,()=>{this.snowflake(fp,color,{size:38,life:900});this.frost(fp,color,28,{alpha:.95});this.ring(fp,color,{r0:6,r1:56,life:560,size:3,blocks:30});this.burst(fp,'#eaffff',10,{speedMin:.4,speedMax:1.4,gravity:.01,sizeMin:2,sizeMax:4,shape:'crystal',lifeMin:600,lifeMax:1000});this.flash('#c9f4ff',.12);});}
  if(kind==='pierce'){
   const bp=this.blockerSquare(state,move.from,move.to);const blocker=bp!==null?this.local(point(bp)):null;
   this.beam(a,b,color,{life:360,size:3,delay:timing.anticipation,core:'#fffbd8'});
   if(blocker)at(timing.impact,()=>{this.ring(blocker,'#fff0b0',{r0:4,r1:24,life:300,size:2,blocks:16});this.spark(blocker,'#fff0b0',7);});
  }
  if(move.promotion)at(timing.impact,()=>{this.beam({x:b.x,y:b.y-70},b,'#ffe8a0',{life:500,size:3,jitter:1,core:'#fff9e2'});this.embers(b,'#ffe38a',18,{speedMax:2.2});this.flash('#ffe8a0',.12);});
  if(move.special==='castle'){const rookFrom=move.to>move.from?move.from+3:move.from-4,rookTo=move.to>move.from?move.from+1:move.from-1;const r0=this.local(point(rookFrom)),r1=this.local(point(rookTo));if(r0&&r1)this.trail(r0,r1,color,{count:7,delay:timing.anticipation,travel:timing.travel});}
  // capture impact
  if(isCapture){
   at(timing.impact,()=>{
    this.burst(b,debrisColor,32,{accent:debrisAccent,speedMin:1,speedMax:5.4,gravity:.16,sizeMin:2,sizeMax:7,shape:Math.random()<.4?'shard':'square',lifeMin:420,lifeMax:900});
    this.spark(b,palette.light,16,{speedMin:1.8,speedMax:5.8});
    this.ring(b,debrisColor,{r0:6,r1:82,life:480,size:3,blocks:34});
    this.ring(b,'#fff4d0',{r0:2,r1:104,life:360,size:2,blocks:28});
    this.flash('#fff0c8',.18);
    this.shake(5.4+(material.sound==='stone'?1.2:0));
    this.haptic([10,22,8]);
   });
  }else if(move.usePower&&!stationary){
   at(timing.impact,()=>{this.ring(b,color,{r0:4,r1:48,life:360,size:2,blocks:20});this.shake(2);});
  }
 }
 blockerSquare(state,from,to){
  const dx=Math.sign(to%8-from%8),dy=Math.sign(to>>3-from>>3);let x=from%8+dx,y=(from>>3)+dy;
  while(x>=0&&x<8&&y>=0&&y<8){const sq=y*8+x;if(sq===to)return null;if(state.board[sq])return sq;x+=dx;y+=dy;}
  return null;
 }
 turn(side){
  if(!this.enabled()||!this.shell)return;
  const cls=side==='w'?'turn-white':'turn-black';this.shell.classList.remove('turn-white','turn-black');void this.shell.offsetWidth;this.shell.classList.add(cls);
  const color=side==='w'?'#f6e4b5':'#9ec2d8';
  for(let i=0;i<Math.round(10*this.factor());i++){const x=rnd(20,this.w-20),y=Math.random()<.5?rnd(8,26):rnd(this.h-26,this.h-8);this.addParticle({x,y,vx:rnd(-.2,.2),vy:rnd(-.5,-.1),g:.01,drag:.99,life:rnd(500,900),size:rnd(1,3),color,shape:'square',alpha:.5,delay:i*18});}
  this.later(760,()=>this.shell.classList.remove('turn-white','turn-black'));
 }
 check(square,mate,point){
  if(!this.enabled()||!point)return;
  const p=this.local(point);if(!p)return;
  const color=mate?'#ffd08a':'#ff8d78';
  this.flash(mate?'#ffb58a':'#ff7d6e',mate?.22:.12);
  this.burst(p,color,mate?30:14,{speedMin:1.2,speedMax:mate?5:3.4,gravity:.12,sizeMin:2,sizeMax:5,shape:'square',lifeMin:350,lifeMax:800});
  this.ring(p,color,{r0:8,r1:mate?90:56,life:mate?700:420,size:3,blocks:30});
  this.shake(mate?8:3.4);
  if(mate)this.haptic([20,30,30,40]);
 }
 shieldBreak(square,point){
  if(!this.enabled()||!point)return;const p=this.local(point);if(!p)return;
  this.burst(p,'#9fe8ff',22,{accent:'#e4fbff',speedMin:1,speedMax:4,sizeMin:2,sizeMax:5,shape:'crystal',lifeMin:350,lifeMax:750});
  this.ring(p,'#9fe8ff',{r0:12,r1:42,life:380,size:2,blocks:24});this.shake(1.8);
 }
 thaw(square,point){
  if(!this.enabled()||!point)return;const p=this.local(point);if(!p)return;
  this.burst(p,'#c9f4ff',12,{speedMin:.2,speedMax:1.4,gravity:.06,sizeMin:2,sizeMax:4,shape:'crystal',lifeMin:420,lifeMax:800,alpha:.7});
 }
 preview(color='#f0d59b'){
  if(!this.enabled())return;const p={x:this.w/2,y:this.h/2};
  this.burst(p,color,16,{speedMin:1,speedMax:3,shape:'square'});this.ring(p,color,{r0:8,r1:64,life:420,size:2,blocks:28});
 }
 startAmbient(){
  clearInterval(this.ambientTimer);this.ambientTimer=null;
  if(this.intensity!=='full'||reduced())return;
  this.ambientTimer=setInterval(()=>{
   if(!this.enabled()||document.hidden||this.particles.length>28)return;
   const x=rnd(20,this.w-20),y=rnd(20,this.h-20);
   this.addParticle({x,y,vx:rnd(-.08,.08),vy:rnd(-.22,-.06),g:-.002,drag:.995,life:rnd(900,1400),size:rnd(1,2),color:'#e8d6a9',shape:'square',alpha:.22});
  },4200);
 }
 cancel(){
  this.particles=[];this.effects=[];for(const t of this.timeouts)clearTimeout(t);this.timeouts=[];
  this.shakeAnim?.cancel();this.shakeAnim=null;
  cancelAnimationFrame(this.raf);this.running=false;this.mark(false);
  this.shell?.classList.remove('turn-white','turn-black');
  if(this.ctx)this.ctx.clearRect(0,0,this.w,this.h);
 }
}
