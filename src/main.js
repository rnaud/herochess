import './style.css';
import {HERO_SUMMARIES,isHeroPowerMove,oracleMoveHint} from './hero-ui.js';
import {ChessBoard} from './board.js';
import {PIECES,initialState,legalMoves,applyMove,outcome,moveLabel,squareName,opposite,inCheck} from './engine.js';
const $=id=>document.getElementById(id);
const glyph={p:'♟',n:'♞',b:'♝',r:'♜',q:'♛',k:'♚',h:'♞',o:'♝',s:'♜'};
const SAVE_KEY='herochess-v2';
let state=initialState(),human='w',selected=null,moves=[],snapshots=[],journal=[],worker=null,requestId=0,thinking=false,flipped=false,board=null,view='3d',heroFocus=null;
let level='2';
let animating=false,transitionId=0,flatAnimations=[];
function cancelPresentation(){transitionId++;board?.cancelAnimation();flatAnimations.forEach(a=>a.cancel());flatAnimations=[];animating=false;setMotionControls(false);}
function setMotionControls(active){for(const id of ['flip-button','view-2d','difficulty'])$(id).disabled=active;$('view-3d').disabled=active||!board;}
try{
 const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
 if(saved&&saved.version===2&&['w','b'].includes(saved.human)&&Array.isArray(saved.state.board)&&saved.state.board.length===64&&saved.state.board.every(p=>p===null||(PIECES[p.type]&&['w','b'].includes(p.color)))&&['w','b'].every(c=>saved.state.board.filter(p=>p?.type==='k'&&p.color===c).length===1)&&Array.isArray(saved.state.history)&&Array.isArray(saved.snapshots)&&Array.isArray(saved.journal)){
  state=saved.state;human=saved.human;snapshots=saved.snapshots;journal=saved.journal;level=['1','2','3'].includes(saved.level)?saved.level:'2';flipped=human==='b';
 }
}catch{/* Ignore inaccessible or invalid browser storage. */}
$('difficulty').value=level;
try{board=new ChessBoard($('board-view'),selectSquare);board.flip(flipped);}catch(error){console.warn('3D unavailable; using accessible board.',error);view='2d';$('view-3d').disabled=true;$('view-3d').title='WebGL is unavailable on this device';}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:2,state,human,snapshots,journal,level:$('difficulty').value}));}catch{/* Play remains available when browser storage is disabled. */}}
function stopCPU(){requestId++;worker?.terminate();worker=null;thinking=false;}
function startCPU(){
 if(state.turn===human||outcome(state).over)return;
 stopCPU();thinking=true;render();
 const id=++requestId;
 worker=new Worker(new URL('./ai-worker.js',import.meta.url),{type:'module'});
 const levels={'1':{maxDepth:1,timeMs:300},'2':{maxDepth:3,timeMs:1300},'3':{maxDepth:4,timeMs:3200}};
 worker.onmessage=({data})=>{
  if(data.id!==requestId)return;
  if(data.error){cpuFailure();return;}
  const legal=legalMoves(state).find(m=>m.from===data.move?.from&&m.to===data.move?.to&&m.promotion===data.move?.promotion);
  if(!legal){cpuFailure();return;}
  stopCPU();commit(legal);$('cpu-caption').textContent=`${['','APPRENTICE','TACTICIAN','STRATEGIST'][$('difficulty').value]} · DEPTH ${data.depth}`;
 };
 worker.onerror=cpuFailure;
 worker.postMessage({id,state,options:levels[$('difficulty').value]});
}
function cpuFailure(){stopCPU();render();$('status-title').textContent='The Automaton paused.';$('status-detail').textContent='Could not calculate a move. Change opponent level to retry, or undo your last turn.';}
async function animateFlat(state,move){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const flat=$('flat-board'),origin=flat.querySelector(`[data-square="${move.from}"] .flat-piece`),destination=flat.querySelector(`[data-square="${move.to}"] .flat-piece`);
 if(!origin||!destination)return;
 const ghosts=[],hidden=[];
 const ghostFor=(element)=>{const rect=element.getBoundingClientRect(),ghost=element.cloneNode(true),style=getComputedStyle(element);Object.assign(ghost.style,{position:'fixed',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',margin:'0',zIndex:'100',pointerEvents:'none',font:style.font,color:style.color,textShadow:style.textShadow,display:'grid',placeItems:'center'});document.body.append(ghost);ghosts.push(ghost);hidden.push(element);element.style.visibility='hidden';return {ghost,rect};};
 const capturedSquare=move.special==='ep'?move.to+(state.turn==='w'?-8:8):move.to;
 const victim=state.board[capturedSquare]?flat.querySelector(`[data-square="${capturedSquare}"] .flat-piece`):null;
 const animations=[];
 const travel=(element,target)=>{const {ghost,rect}=ghostFor(element),end=target.getBoundingClientRect(),dx=end.left-rect.left,dy=end.top-rect.top;const jump=state.board[move.from].type==='n'||state.board[move.from].type==='h'||isHeroPowerMove(state,move);animations.push(ghost.animate([{transform:'translate(0,0)'},{transform:`translate(${dx*.5}px,${dy*.5-(jump?28:8)}px) scale(1.12)`,offset:.5},{transform:`translate(${dx}px,${dy}px)`}],{duration:520,easing:'ease-in-out',fill:'forwards'}));};
 if(victim){const {ghost}=ghostFor(victim);animations.push(ghost.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(1.65) rotate(20deg)',filter:'blur(5px)'}],{delay:320,duration:350,fill:'forwards',easing:'ease-out'}));}
 travel(origin,destination);
 if(move.special==='castle'){const rookFrom=move.to>move.from?move.from+3:move.from-4,rookTo=move.to>move.from?move.from+1:move.from-1;travel(flat.querySelector(`[data-square="${rookFrom}"] .flat-piece`),flat.querySelector(`[data-square="${rookTo}"] .flat-piece`));}
 flatAnimations=animations;flat.dataset.animating=victim?'capture':'move';
 await Promise.allSettled(animations.map(animation=>animation.finished));
 ghosts.forEach(ghost=>ghost.remove());hidden.forEach(element=>element.style.visibility='');delete flat.dataset.animating;flatAnimations=[];
}
async function commit(move){
 const before=state,text=moveLabel(state,move),id=++transitionId;
 snapshots.push(state);state=applyMove(state,move);const end=outcome(state);journal.push(text+(end.reason==='Checkmate'?'#':inCheck(state)?'+':''));selected=null;moves=[];heroFocus=null;save();
 animating=true;setMotionControls(true);$('undo-button').disabled=!snapshots.some(s=>s.turn===human);$('thinking-overlay').hidden=true;
 try {await (view==='3d'&&board?board.animateMove(before,move):animateFlat(before,move));}
 finally {if(id===transitionId){animating=false;setMotionControls(false);render();if(!end.over&&state.turn!==human)startCPU();}}
}
function selectSquare(square){
 if(animating||thinking||state.turn!==human||outcome(state).over)return;
 const options=moves.filter(m=>m.to===square);
 if(options.length){
  if(options[0].promotion){
   $('promotion-options').replaceChildren();
   for(const m of options){const button=document.createElement('button');button.innerHTML=`<span>${glyph[m.promotion]}</span>${PIECES[m.promotion].name}`;button.onclick=()=>{$('promotion-dialog').close();commit(m);};$('promotion-options').append(button);}
   $('promotion-dialog').showModal();return;
  }
  commit(options[0]);return;
 }
 if(state.board[square]?.color===human){selected=selected===square?null:square;moves=selected===null?[]:legalMoves(state,selected);heroFocus=state.board[square].type;}
 else{selected=null;moves=[];heroFocus=null;}
 render();
}
function render(){
 const end=outcome(state),myTurn=state.turn===human;
 $('hero-legend').hidden=state.mode!=='heroes';
 $('move-legend').hidden=selected===null||!PIECES[state.board[selected]?.type]?.base;
 $('turn-number').textContent=`ROUND ${String(state.fullmove).padStart(2,'0')}`;
 $('mode-label').textContent=state.mode==='heroes'?'HERO RULES':'CLASSIC RULES';$('status-mode').textContent=state.mode==='heroes'?'HERO CHESS':'CLASSIC CHESS';
 $('turn-chip').textContent=end.over?'GAME OVER':myTurn?'YOUR TURN':'CPU TURN';
 $('thinking-overlay').hidden=!thinking;
 $('player-caption').textContent=`${human==='w'?'IVORY · WHITE':'OBSIDIAN · BLACK'} · ${flipped===(human==='b')?'PLAYING FROM THE SOUTH':'PLAYING FROM THE NORTH'}`;
 document.querySelector('.side-chip').textContent=human==='w'?'OBSIDIAN':'IVORY';
 document.querySelector('.human-avatar').style.background=human==='w'?'#dcd8c5':'#33483b';
 $('undo-button').disabled=!snapshots.some(s=>s.turn===human);
 let title=end.over?(end.winner?(end.winner===human?'An extraordinary victory.':'The Automaton prevails.'):'A balanced ending.'):(thinking?'A worthy opponent.':inCheck(state)?'Your king is in check.':journal.length?'Your next possibility.':'Your opening move.');
 let detail=end.over?`${end.reason}. Start a new match to explore another possibility.`:thinking?'The Automaton is weighing every move, including your heroes’ powers.':inCheck(state)?'Protect your king. Only moves that escape check are available.':'Select a piece to see its possibilities.';
 if(selected!==null){const p=state.board[selected];title=PIECES[p.type].name+'.';detail=p.type==='o'?oracleMoveHint(state,selected,moves):PIECES[p.type].description||`${squareName(selected)} · ${moves.length} legal move${moves.length===1?'':'s'}. Choose a highlighted square.`;}
 else if(heroFocus&&PIECES[heroFocus].description){title=PIECES[heroFocus].name+'.';detail=PIECES[heroFocus].description;}
 $('status-title').textContent=title;$('status-detail').textContent=detail;
 board?.update(state,selected,moves);
 renderFlat();renderHeroes();renderJournal();renderCaptures();setView(view);
}
function renderHeroes(){
 const container=$('hero-cards');container.replaceChildren();
 document.querySelector('.arsenal .section-heading h3').textContent=state.mode==='heroes'?'Your special pieces':'The original rules';
 document.querySelector('.arsenal .section-heading>span').textContent=state.mode==='heroes'?'03':'06';
 document.querySelector('.section-description').textContent=state.mode==='heroes'?`${human==='w'?'Blue':'Orange'} pieces are your heroes. Select a card to find one.`:'Six timeless pieces. Endless possibilities.';
 document.querySelector('.power-note').hidden=state.mode!=='heroes';
 if(state.mode!=='heroes'){container.innerHTML='<p class="classic-note">The classic army, exactly as you know it. Start a new match in Hero mode to discover three extraordinary pieces.</p>';return;}
 for(const type of ['h','o','s']){
  const p=PIECES[type],summary=HERO_SUMMARIES[type],square=state.board.findIndex(piece=>piece?.type===type&&piece.color===human),button=document.createElement('button');button.className=`hero-card ${human==='w'?'ivory-heroes':'obsidian-heroes'}${heroFocus===type?' active':''}${square<0?' captured-hero':''}`;button.setAttribute('aria-label',`${p.name}: ${p.title}. ${summary.normal} ${summary.power} ${square<0?'Captured':`At ${squareName(square)}`}. Show power and select piece.`);button.innerHTML=`<span class="hero-icon">${glyph[type]}<span>✦</span></span><span class="hero-copy"><span class="hero-name"><strong>${p.name}</strong><span class="hero-location">${square<0?'Captured':squareName(square)}</span></span><span class="hero-normal">${summary.normal}</span><span class="hero-power"><b>✦ Power</b> ${summary.power}</span></span>`;
  button.onclick=()=>{heroFocus=type;const square=state.board.findIndex(p=>p?.type===type&&p.color===human);if(animating)return;if(square>=0&&!thinking&&state.turn===human&&!outcome(state).over){selected=square;moves=legalMoves(state,square);}else{selected=null;moves=[];}render();};container.append(button);
 }
}
function renderJournal(){
 $('move-count').textContent=String(journal.length).padStart(2,'0');const container=$('journal');container.replaceChildren();
 if(!journal.length){container.innerHTML='<p class="empty-journal">Every great game starts with a possibility.</p>';return;}
 for(let i=0;i<journal.length;i+=2){const row=document.createElement('div');row.className='journal-row';for(const text of [String(i/2+1).padStart(2,'0'),journal[i],journal[i+1]||'…']){const span=document.createElement('span');span.textContent=text;row.append(span);}container.append(row);}container.scrollTop=container.scrollHeight;
}
function renderCaptures(){
 const captured={w:[],b:[]};for(let i=0;i<snapshots.length;i++){const before=snapshots[i],after=snapshots[i+1]||state,m=after.lastMove;if(!m)continue;const p=m.special==='ep'?{type:'p',color:opposite(before.turn)}:before.board[m.to];if(p)captured[before.turn].push(glyph[p.type]);}
 $('white-captured').textContent=captured[human].join('');$('white-captured').title='Pieces you captured';$('black-captured').textContent=captured[opposite(human)].join('');$('black-captured').title='Pieces captured by the CPU';
}
function renderFlat(){
 const focused=document.activeElement?.dataset.square;const flat=$('flat-board');flat.replaceChildren();
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){
  const square=flipped?row*8+7-col:(7-row)*8+col,p=state.board[square],button=document.createElement('button');button.className=`flat-square${(square%8+(square>>3))%2===0?' dark':''}${p?.color==='b'?' black-piece':''}${PIECES[p?.type]?.base?' hero':''}${moves.some(m=>m.to===square&&isHeroPowerMove(state,m))?' power-move':''}${selected===square?' selected':''}${moves.some(m=>m.to===square)?' legal':''}${state.lastMove&&(state.lastMove.from===square||state.lastMove.to===square)?' last':''}`;button.dataset.square=square;
  button.setAttribute('aria-label',`${squareName(square)}${p?`, ${p.color==='w'?'White':'Black'} ${PIECES[p.type].name}`:', empty'}${moves.some(m=>m.to===square)?', legal destination':''}${moves.some(m=>m.to===square&&isHeroPowerMove(state,m))?', extra hero power move':''}`);button.setAttribute('aria-pressed',String(selected===square));button.innerHTML=`<span class="flat-piece">${p?glyph[p.type]:''}</span><span class="square-label">${squareName(square)}</span>`;button.onclick=()=>selectSquare(square);
  button.onkeydown=e=>{const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:8,ArrowUp:-8}[e.key];if(delta!==undefined){e.preventDefault();const buttons=[...flat.children],next=buttons.indexOf(button)+delta;buttons[next]?.focus();}};flat.append(button);
 }
 if(focused!==undefined&&view==='2d')flat.querySelector(`[data-square="${focused}"]`)?.focus();
}
function setView(next){view=next;$('board-view').hidden=next!=='3d';$('flat-board').hidden=next!=='2d';$('view-3d').setAttribute('aria-pressed',String(next==='3d'));$('view-2d').setAttribute('aria-pressed',String(next==='2d'));if(next==='3d')board?.resize();}
$('view-3d').onclick=()=>setView('3d');$('view-2d').onclick=()=>setView('2d');
$('flip-button').onclick=()=>{flipped=!flipped;board?.flip(flipped);renderFlat();render();};
$('undo-button').onclick=()=>{cancelPresentation();stopCPU();let index=snapshots.length-1;while(index>=0&&snapshots[index].turn!==human)index--;if(index<0)return;state=snapshots[index];snapshots=snapshots.slice(0,index);journal=journal.slice(0,index);selected=null;moves=[];heroFocus=null;save();render();};
$('difficulty').onchange=()=>{save();if(state.turn!==human&&!outcome(state).over)startCPU();};
$('new-button').onclick=()=>{$('side').value=human;$('new-form').elements.mode.value=state.mode;$('new-dialog').showModal();};
$('new-form').onsubmit=e=>{e.preventDefault();cancelPresentation();stopCPU();const data=new FormData(e.target);state=initialState(data.get('mode'));human=data.get('side');snapshots=[];journal=[];selected=null;moves=[];heroFocus=null;flipped=human==='b';board?.flip(flipped);$('new-dialog').close();$('cpu-caption').textContent='POWER-AWARE CPU';save();render();startCPU();};
$('guide-button').onclick=()=>$('guide-dialog').showModal();
for(const button of document.querySelectorAll('.close-dialog'))button.onclick=()=>button.closest('dialog').close();
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
$('guide-heroes').innerHTML=['h','o','s'].map(t=>`<div class="guide-hero"><span class="hero-icon">${glyph[t]}</span><div><strong>${PIECES[t].name} · ${PIECES[t].title}</strong><p>${PIECES[t].description}</p></div></div>`).join('');
render();startCPU();
