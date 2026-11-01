import {CARDS} from './cards.js';

// Presentation only: one cancellable group per action, shared by 2D and 3D.
export class GameEffects {
 constructor(){this.active=new Set();}
 cancel(){for(const cleanup of [...this.active])cleanup();}
 rewind(rect,remaining){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const layer=document.createElement('div');layer.className='game-fx rewind-fx';layer.setAttribute('aria-hidden','true');layer.innerHTML='<span class="fx-time-ring"></span><span class="fx-callout fx-time-label"></span>';layer.style.setProperty('--fx-color','#b4e9ec');
  const x=rect.left+rect.width/2,y=rect.top+rect.height/2;for(const child of layer.children){child.style.left=x+'px';child.style.top=y+'px';}
  layer.lastChild.textContent=`TIME REWOUND · ${remaining} LEFT`;document.body.append(layer);
  const a=layer.firstChild.animate([{opacity:0,transform:'translate(-50%,-50%) scale(2.5) rotate(100deg)'},{opacity:.9,offset:.35},{opacity:0,transform:'translate(-50%,-50%) scale(.1) rotate(-80deg)'}],{duration:850,fill:'both'}),b=layer.lastChild.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.8)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.2},{opacity:1,offset:.7},{opacity:0,transform:'translate(-50%,-50%) scale(1.1)'}],{duration:1100,fill:'both'});
  let done=false;const cleanup=()=>{if(done)return;done=true;a.cancel();b.cancel();layer.remove();this.active.delete(cleanup);};this.active.add(cleanup);Promise.allSettled([a.finished,b.finished]).then(cleanup);
 }
 play(state,move,source,point,human){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
  const layer=document.createElement('div');layer.className='game-fx';layer.setAttribute('aria-hidden','true');
  layer.dataset.effect=move.usePower?(move.special||CARDS[move.card]?.kind.toLowerCase()||'power'):'move';
  const color=move.special==='freeze'||move.freezeTarget!==undefined?'#b5eeff':move.special==='shield'?'#8acfff':({offense:'#ffba6a',defense:'#8acfff',mobility:'#94efba',tactics:'#d5acff'}[CARDS[move.card]?.family]||'#edcf94');
  layer.style.setProperty('--fx-color',color);document.body.append(layer);
  const animations=[];let hiddenSource=false,finished=false;
  const animate=(element,frames,options)=>{const a=element.animate(frames,{fill:'both',easing:'ease-out',...options});animations.push(a);return a;};
  const node=(className,x,y)=>{const e=document.createElement('span');e.className=className;Object.assign(e.style,{left:x+'px',top:y+'px'});layer.append(e);return e;};
  const sparks=(x,y,count,delay,icy=false)=>{
   for(let i=0;i<count;i++){
    const angle=i*Math.PI*2/count,reach=28+(i%4)*12,e=node(icy?'fx-crystal':'fx-spark',x,y);
    animate(e,[{opacity:0,transform:'translate(-50%,-50%) scale(.2)'},{opacity:1,offset:.15},{opacity:0,transform:`translate(calc(-50% + ${Math.cos(angle)*reach}px),calc(-50% + ${Math.sin(angle)*reach-20}px)) rotate(${i*47}deg) scale(.2)`}],{duration:540+ (i%3)*70,delay});
   }
  };
  if(source&&state.mode==='cards'&&move.usePower){
   const rect=source.getBoundingClientRect();
   if(rect.bottom>0&&rect.top<innerHeight&&rect.right>0&&rect.left<innerWidth){
    const ghost=source.cloneNode(true);ghost.removeAttribute('id');ghost.removeAttribute('data-slot');ghost.removeAttribute('aria-pressed');ghost.classList.add('card-burn');ghost.classList.remove('chosen');ghost.disabled=true;ghost.tabIndex=-1;
    Object.assign(ghost.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',margin:'0'});layer.append(ghost);source.style.visibility='hidden';hiddenSource=true;
    animate(ghost,[{opacity:1,clipPath:'inset(0 0 0 0)',filter:'brightness(1)'},{opacity:1,clipPath:'inset(0 0 48% 0)',filter:move.usePower?'sepia(1) brightness(1.6)':'grayscale(1)',offset:.55},{opacity:0,clipPath:'inset(0 0 100% 0)',filter:'brightness(.2)'}],{duration:move.usePower?720:400});
    if(move.usePower){
     const edge=node('fx-burn-edge',rect.left,rect.bottom);edge.style.width=rect.width+'px';
     animate(edge,[{opacity:0,transform:'translateY(0)'},{opacity:1,offset:.12},{opacity:1,offset:.8},{opacity:0,transform:`translateY(-${rect.height}px)`}],{duration:720});
     for(let i=0;i<18;i++){const ember=node('fx-ember',rect.left+(i%6+.5)*rect.width/6,rect.bottom-(i/18)*rect.height);animate(ember,[{opacity:0,transform:'translateY(0) scale(.4)'},{opacity:1,offset:.2},{opacity:0,transform:`translate(${(i%5-2)*13}px,-70px) rotate(80deg) scale(.2)`}],{duration:450,delay:i*26});}
    }
   }
  }
  const from=point(move.from),to=point(move.to),effect=['shield','freeze'].includes(move.special)||move.freezeTarget!==undefined,capture=!['shield','freeze'].includes(move.special)&&move.special!=='swap'&&(state.board[move.to]||move.special==='ep');
  if(from&&to){
   if(move.usePower||capture||move.promotion||move.special==='castle'){
    const label=node('fx-callout',Math.max(130,Math.min(innerWidth-130,to.x)),Math.max(65,to.y-75));
    label.textContent=`${state.turn===human?'YOU':'CPU'} · ${move.promotion?'PROMOTION':move.usePower?CARDS[move.card].name:capture?'CAPTURE':'CASTLE'}`;
    animate(label,[{opacity:0,transform:'translate(-50%,10px) scale(.8)'},{opacity:1,transform:'translate(-50%,0) scale(1)',offset:.2},{opacity:1,offset:.7},{opacity:0,transform:'translate(-50%,-16px) scale(1)'}],{duration:900});
   }
   const delay=effect?100:capture?350:280,impact=move.freezeTarget!==undefined?point(move.freezeTarget):to;
   if(move.usePower&&move.from!==move.to){
    const trail=node('fx-trail',from.x,from.y),dx=to.x-from.x,dy=to.y-from.y;
    if(CARDS[move.card]?.kind==='Capture'){trail.classList.add('fx-beam');trail.style.width=Math.hypot(dx,dy)+'px';trail.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;animate(trail,[{opacity:0},{opacity:1,offset:.35},{opacity:0}],{duration:460});}
    else animate(trail,[{opacity:0,transform:'translate(-50%,-50%) scale(.4)'},{opacity:1,offset:.2},{opacity:0,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(1.5)`}],{duration:520});
    const portal=node('fx-ring',from.x,from.y);animate(portal,[{opacity:.8,transform:'translate(-50%,-50%) scale(.2)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.3)'}],{duration:480});
   }
   const ring=node('fx-ring',impact.x,impact.y);if(capture)ring.classList.add('fx-impact');else if(!move.usePower)ring.classList.add('fx-step');
   animate(ring,[{opacity:0,transform:'translate(-50%,-50%) scale(.2)'},{opacity:.95,offset:.15},{opacity:0,transform:`translate(-50%,-50%) scale(${capture?2:1.5})`}],{duration:move.usePower||capture?550:350,delay});
   if(capture){const shock=node('fx-shock',to.x,to.y);animate(shock,[{opacity:0,transform:'translate(-50%,-50%) scale(.2)'},{opacity:.8,offset:.1},{opacity:0,transform:'translate(-50%,-50%) scale(2.5)'}],{duration:480,delay:delay+70});}
   if(effect){
    const shell=node(move.special==='freeze'||move.freezeTarget!==undefined?'fx-frost':'fx-shield',impact.x,impact.y);shell.textContent=move.special==='freeze'||move.freezeTarget!==undefined?'❄':'◇';
    animate(shell,[{opacity:0,transform:'translate(-50%,-50%) scale(.3)'},{opacity:.9,transform:'translate(-50%,-50%) scale(1.1)',offset:.4},{opacity:0,transform:'translate(-50%,-70%) scale(1.2)'}],{duration:800});
   }
   if(move.usePower||capture)sparks(impact.x,impact.y,capture?28:16,delay,move.special==='freeze'||move.freezeTarget!==undefined);
  }
  const cleanup=()=>{if(finished)return;finished=true;animations.forEach(a=>a.cancel());layer.remove();if(hiddenSource)source.style.visibility='';this.active.delete(cleanup);};
  this.active.add(cleanup);
  return Promise.allSettled(animations.map(a=>a.finished)).then(cleanup);
 }
}
