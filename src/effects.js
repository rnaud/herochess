import {CARDS} from './cards.js';

// Presentation only: one cancellable group per action, shared by 2D and 3D.
export class GameEffects {
 constructor(){this.active=new Set();}
 cancel(){for(const cleanup of [...this.active])cleanup();}
 play(state,move,source,point){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
  const layer=document.createElement('div');layer.className='game-fx';layer.setAttribute('aria-hidden','true');
  layer.dataset.effect=move.usePower?(move.special||CARDS[move.card]?.kind.toLowerCase()||'power'):'move';
  const color=move.special==='freeze'?'#b5eeff':move.special==='shield'?'#8acfff':({offense:'#ffba6a',defense:'#8acfff',mobility:'#94efba',tactics:'#d5acff'}[CARDS[move.card]?.family]||'#edcf94');
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
  if(source&&state.mode==='cards'){
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
  const from=point(move.from),to=point(move.to),effect=['shield','freeze'].includes(move.special),capture=!effect&&move.special!=='swap'&&(state.board[move.to]||move.special==='ep');
  if(from&&to&&(move.usePower||capture)){
   const delay=effect?100:capture?350:280;
   if(move.usePower&&move.from!==move.to){
    const trail=node('fx-trail',from.x,from.y),dx=to.x-from.x,dy=to.y-from.y;
    if(CARDS[move.card]?.kind==='Capture'){trail.classList.add('fx-beam');trail.style.width=Math.hypot(dx,dy)+'px';trail.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;animate(trail,[{opacity:0},{opacity:1,offset:.35},{opacity:0}],{duration:460});}
    else animate(trail,[{opacity:0,transform:'translate(-50%,-50%) scale(.4)'},{opacity:1,offset:.2},{opacity:0,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(1.5)`}],{duration:520});
    const portal=node('fx-ring',from.x,from.y);animate(portal,[{opacity:.8,transform:'translate(-50%,-50%) scale(.2)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.3)'}],{duration:480});
   }
   const ring=node('fx-ring',to.x,to.y);if(capture)ring.classList.add('fx-impact');
   animate(ring,[{opacity:0,transform:'translate(-50%,-50%) scale(.2)'},{opacity:.95,offset:.15},{opacity:0,transform:`translate(-50%,-50%) scale(${capture?2:1.5})`}],{duration:550,delay});
   if(effect){
    const shell=node(move.special==='freeze'?'fx-frost':'fx-shield',to.x,to.y);shell.textContent=move.special==='freeze'?'❄':'◇';
    animate(shell,[{opacity:0,transform:'translate(-50%,-50%) scale(.3)'},{opacity:.9,transform:'translate(-50%,-50%) scale(1.1)',offset:.4},{opacity:0,transform:'translate(-50%,-70%) scale(1.2)'}],{duration:800});
   }
   sparks(to.x,to.y,capture?18:12,delay,move.special==='freeze');
  }
  const cleanup=()=>{if(finished)return;finished=true;animations.forEach(a=>a.cancel());layer.remove();if(hiddenSource)source.style.visibility='';this.active.delete(cleanup);};
  this.active.add(cleanup);
  return Promise.allSettled(animations.map(a=>a.finished)).then(cleanup);
 }
}
