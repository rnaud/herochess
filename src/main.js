import './style.css';
import {CARDS,CARD_IDS,FAMILIES,POWER_TIERS} from './cards.js';
import {ChessBoard} from './board.js';
import {GameEffects} from './effects.js';
const effects=new GameEffects();
import {PIECES,initialState,legalMoves,applyMove,outcome,moveLabel,squareName,opposite,inCheck} from './engine.js';
const $=id=>document.getElementById(id),SAVE_KEY='herochess-cards-v2';
const cardArt=id=>`${import.meta.env.BASE_URL}art/realms/${id}.jpg`;
const familyBadge=c=>`<span class="family-badge" data-family="${c.family}"><span aria-hidden="true">${FAMILIES[c.family].icon}</span> ${FAMILIES[c.family].name}</span>`;
const tierBadge=c=>`<span class="tier-badge" data-tier="${c.tier}" aria-label="${POWER_TIERS[c.tier].name}, power tier ${c.tier} of 3"><span aria-hidden="true">${POWER_TIERS[c.tier].stars}</span> ${POWER_TIERS[c.tier].name}</span>`;
const glyph={p:'♟',n:'♞',b:'♝',r:'♜',q:'♛',k:'♚'};
let resumed=false,dealAnimations=[];
let state=initialState(),human='w',snapshots=[],journal=[],selected=null,slot=null,usePower=true,moves=[],worker=null,requestId=0,thinking=false,animating=false,transitionId=0,flatAnimations=[],board=null,view='3d',flipped=false,level='2';
try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY));if(saved?.version===2&&saved.state?.board?.length===64&&saved.state.board.every(p=>p===null||PIECES[p.type])&&saved.state.hands?.w?.length===3&&saved.state.hands?.b?.length===3&&[...saved.state.hands.w,...saved.state.hands.b,...saved.state.deck,...saved.state.discard].every(id=>CARDS[id])&&['w','b'].includes(saved.human)){
 resumed=true;state=saved.state;human=saved.human;snapshots=saved.snapshots;journal=saved.journal;level=saved.level||'2';flipped=human==='b';
}else if((localStorage.getItem('herochess-v2')||localStorage.getItem('herochess-cards-v1')))$('save-notice').hidden=false;}catch{}
$('difficulty').value=level;
try{board=new ChessBoard($('board-view'),selectSquare);board.flip(flipped);}catch(error){console.warn('WebGL unavailable; using 2D.',error);view='2d';}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:2,state,human,snapshots,journal,level:$('difficulty').value}));}catch{}}
function stopCPU(){requestId++;worker?.terminate();worker=null;thinking=false;}
function motionControls(){for(const id of ['flip-button','view-2d','difficulty'])$(id).disabled=animating;$('view-3d').disabled=animating||!board;}
function cancelPresentation(){transitionId++;effects.cancel();board?.cancelAnimation();flatAnimations.forEach(a=>a.cancel());flatAnimations=[];animating=false;motionControls();}
function resetSelection(){selected=null;slot=null;moves=[];usePower=true;}
function choice(){return state.mode==='cards'?{slot:slot??0,usePower:slot!==null&&usePower}:null;}
function available(from=null){return legalMoves(state,from,choice());}
function startCPU(){
 if(state.turn===human||outcome(state).over)return;stopCPU();thinking=true;render();const id=++requestId;
 worker=new Worker(new URL('./ai-worker.js',import.meta.url),{type:'module'});
 const levels={'1':{maxDepth:1,timeMs:600,quiescence:false},'2':{maxDepth:3,timeMs:1800},'3':{maxDepth:4,timeMs:4000}};
 worker.onmessage=({data})=>{if(data.id!==requestId)return;if(data.error){cpuFailure();return;}const move=legalMoves(state).find(m=>JSON.stringify(m)===JSON.stringify(data.move));if(!move){cpuFailure();return;}stopCPU();commit(move);$('cpu-caption').textContent=`${['','APPRENTICE','TACTICIAN','STRATEGIST'][$('difficulty').value]} · DEPTH ${data.depth}`;};
 worker.onerror=cpuFailure;
 // The worker never receives the actual draw sequence, RNG seed, or history keys containing it.
 worker.postMessage({id,state:{...state,simulation:true,deck:[],discard:[],rng:0,history:[]},options:levels[$('difficulty').value]});
}
function cpuFailure(){stopCPU();render();$('status-title').textContent='The Automaton paused.';$('status-detail').textContent='Change opponent level to retry, or undo your turn.';}
async function animateFlat(state,move){
 if(['shield','freeze'].includes(move.special)){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const target=$('flat-board').querySelector(`[data-square="${move.from}"]`);if(!target)return;
  const animation=target.animate([{boxShadow:'inset 0 0 0 0 #a4dcff'},{boxShadow:'inset 0 0 0 12px #79cbff',offset:.5},{boxShadow:'inset 0 0 0 3px #79cbff'}],{duration:500});flatAnimations=[animation];await Promise.allSettled([animation.finished]);flatAnimations=[];return;
 }

 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const flat=$('flat-board'),origin=flat.querySelector(`[data-square="${move.from}"] .flat-piece`),destination=flat.querySelector(`[data-square="${move.to}"] .flat-piece`);
 if(!origin||!destination)return;
 const ghosts=[],hidden=[];
 const ghostFor=(element)=>{const rect=element.getBoundingClientRect(),ghost=element.cloneNode(true),style=getComputedStyle(element);Object.assign(ghost.style,{position:'fixed',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',margin:'0',zIndex:'100',pointerEvents:'none',font:style.font,color:style.color,textShadow:style.textShadow,display:'grid',placeItems:'center'});document.body.append(ghost);ghosts.push(ghost);hidden.push(element);element.style.visibility='hidden';return {ghost,rect};};
 const capturedSquare=move.special==='ep'?move.to+(state.turn==='w'?-8:8):move.to;
 const victim=move.special!=='swap'&&state.board[capturedSquare]?flat.querySelector(`[data-square="${capturedSquare}"] .flat-piece`):null;
 const animations=[];
 const travel=(element,target)=>{const {ghost,rect}=ghostFor(element),end=target.getBoundingClientRect(),dx=end.left-rect.left,dy=end.top-rect.top;const jump=move.usePower?['Leap','Travel'].includes(CARDS[move.card]?.kind):state.board[move.from].type==='n';animations.push(ghost.animate([{transform:'translate(0,0)'},{transform:`translate(${dx*.5}px,${dy*.5-(jump?28:8)}px) scale(1.12)`,offset:.5},{transform:`translate(${dx}px,${dy}px)`}],{duration:520,easing:'ease-in-out',fill:'forwards'}));};
 if(victim){const {ghost}=ghostFor(victim);animations.push(ghost.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(1.65) rotate(20deg)',filter:'blur(5px)'}],{delay:320,duration:350,fill:'forwards',easing:'ease-out'}));}
 travel(origin,destination);
 if(move.special==='swap')travel(destination,origin);
 if(move.special==='castle'){const rookFrom=move.to>move.from?move.from+3:move.from-4,rookTo=move.to>move.from?move.from+1:move.from-1;travel(flat.querySelector(`[data-square="${rookFrom}"] .flat-piece`),flat.querySelector(`[data-square="${rookTo}"] .flat-piece`));}
 flatAnimations=animations;flat.dataset.animating=victim?'capture':'move';
 await Promise.allSettled(animations.map(animation=>animation.finished));
 ghosts.forEach(ghost=>ghost.remove());hidden.forEach(element=>element.style.visibility='');delete flat.dataset.animating;flatAnimations=[];
}
async function commit(move){
 const before=state,text=moveLabel(state,move),id=++transitionId;snapshots.push(state);state=applyMove(state,move);const end=outcome(state);journal.push(text+(end.reason==='Checkmate'?' #':inCheck(state)?' +':''));resetSelection();save();animating=true;motionControls();$('undo-button').disabled=false;$('thinking-overlay').hidden=true;
 const source=before.turn===human?$('hand').children[move.slot]:$('cpu-hand').children[move.slot];
 const point=square=>{if(view==='3d'&&board)return board.screenPoint(square);const rect=$('flat-board').querySelector(`[data-square="${square}"]`)?.getBoundingClientRect();return rect?{x:rect.left+rect.width/2,y:rect.top+rect.height/2}:null;};
 try{await Promise.all([effects.play(before,move,source,point),view==='3d'&&board?board.animateMove(before,move):animateFlat(before,move)]);}finally{if(id===transitionId){animating=false;motionControls();render();if(!end.over&&state.turn!==human)startCPU();}}
}
function selectSquare(square){
 if(animating||thinking||state.turn!==human||outcome(state).over)return;
 const card=state.mode==='cards'&&slot!==null&&usePower?CARDS[state.hands[human][slot]]:null;
 if(card?.effect){const action=available(square).find(m=>m.special===card.effect);if(action)commit(action);else $('card-instruction').textContent='That is not a legal target. Kings cannot receive powers; your king must remain safe.';return;}
 const options=moves.filter(m=>m.to===square);
 if(options.length){if(options[0].promotion){$('promotion-options').replaceChildren();for(const m of options){const button=document.createElement('button');button.innerHTML=`<span>${glyph[m.promotion]}</span>${PIECES[m.promotion].name}`;button.onclick=()=>{$('promotion-dialog').close();commit(m);};$('promotion-options').append(button);}$('promotion-dialog').showModal();}else commit(options[0]);return;}
 if(state.board[square]?.color===human){selected=selected===square?null:square;moves=selected===null?[]:available(selected);}else{selected=null;moves=[];}render();
}
function selectCard(index){if(animating||thinking||state.turn!==human||outcome(state).over)return;if(slot===index)resetSelection();else{slot=index;usePower=true;selected=null;moves=[];}render();}
function dealHand(){
 if(state.mode!=='cards'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const origin=$('deck-count').getBoundingClientRect();
 dealAnimations=[...$('hand').children].map((card,index)=>{
  const rect=card.getBoundingClientRect();
  const animation=card.animate([
   {opacity:0,transform:`translate(${origin.left+origin.width/2-rect.left-rect.width/2}px, ${origin.top-rect.top-rect.height/2}px) rotate(-18deg) scale(.22)`},
   {opacity:1,transform:'translate(0, 6px) rotate(2deg) scale(1.02)',offset:.82},
   {opacity:1,transform:'translate(0, 0) rotate(0) scale(1)'}
  ],{duration:650,delay:index*170,easing:'cubic-bezier(.2,.7,.25,1)',fill:'backwards'});
  animation.id='opening-deal';return animation;
 });
}
function renderHand(){
 dealAnimations.forEach(animation=>animation.cancel());dealAnimations=[];
 document.body.dataset.mode=state.mode;
 const active=slot===null?null:CARDS[state.hands[human][slot]];
 $('selected-card-art').hidden=!active;$('selected-card-placeholder').hidden=!!active;
 if(active)$('selected-card-art').src=cardArt(state.hands[human][slot]);
 $('selected-card-title').textContent=active?active.name:'Normal chess move';
 $('selected-card-meta').innerHTML=active?`${familyBadge(active)} ${tierBadge(active)}`:'';

 $('hand-panel').hidden=state.mode!=='cards';$('cpu-hand-panel').hidden=state.mode!=='cards';
 $('deck-count').textContent=`${state.deck.length} in deck · ${state.discard.length} discarded`;$('hand').replaceChildren();$('cpu-hand').replaceChildren();
 state.hands[human].forEach((id,index)=>{const c=CARDS[id],button=document.createElement('button');button.className=`spell-card${slot===index?' chosen':''}`;button.dataset.slot=index;button.dataset.action=usePower?'power':'discard';button.dataset.card=id;button.dataset.family=c.family;button.dataset.tier=c.tier;button.setAttribute('aria-pressed',String(slot===index));button.setAttribute('aria-label',`${c.name}. ${FAMILIES[c.family].name}. ${POWER_TIERS[c.tier].name}, power tier ${c.tier} of 3. ${c.text}`);button.innerHTML=`<span class="card-top">${familyBadge(c)}<span>0${index+1}</span></span><img class="card-art" src="${cardArt(id)}" alt="" width="900" height="600"><span class="card-sigil" aria-hidden="true">${c.icon}</span><strong>${c.name}</strong><span class="card-text">${c.summary}</span><span class="card-rating">${tierBadge(c)}<span class="card-mechanic">${c.kind}</span></span><span class="card-bottom">ONE ACTION · TEMPORARY</span>`;button.disabled=thinking||animating||state.turn!==human||outcome(state).over;button.onclick=()=>selectCard(index);$('hand').append(button);});
 state.hands[opposite(human)].forEach(id=>{const c=CARDS[id],item=document.createElement('details');item.className='cpu-card';item.dataset.card=id;item.dataset.tier=c.tier;item.innerHTML=`<summary><img class="cpu-art" src="${cardArt(id)}" alt="" width="90" height="90" loading="lazy"><span class="cpu-card-title"><strong>${c.name}</strong><span class="cpu-rating">${FAMILIES[c.family].name} · ${POWER_TIERS[c.tier].stars}</span></span></summary><p>${familyBadge(c)} ${tierBadge(c)}<br>${c.text}</p>`;$('cpu-hand').append(item);});
 $('normal-mode').hidden=slot===null;
 for(const id of ['normal-mode']){$(id).disabled=animating||thinking||state.turn!==human||slot===null||outcome(state).over;$(id).setAttribute('aria-pressed',String(!usePower));}
 let instruction='Move a piece normally, or click a card to activate its power. A normal move replaces your leftmost card.';
 if(slot!==null){const id=state.hands[human][slot],c=CARDS[id],actions=available();instruction=usePower?c.text+(['shield','freeze'].includes(c.effect)?' Click a highlighted target.':' Select a piece, then a destination.'):`Discard ${c.name} and make one normal chess move.`;if(!actions.length)instruction='No legal power action for this card here. Choose “Discard this card instead”, deselect it, or choose another card.';else if(selected!==null&&!moves.length)instruction='This piece has no legal destination with this choice. Try another piece or discard the card for a normal move.';}
 $('selected-card-title').closest('.spell-workspace').classList.toggle('has-selection',!!active);
 $('card-instruction').textContent=thinking?'The Automaton is choosing from its visible hand…':instruction;
}
function render(){
 const end=outcome(state);$('turn-number').textContent=`ROUND ${String(state.fullmove).padStart(2,'0')}`;$('mode-label').textContent=state.mode==='cards'?'CARD CHESS':'CLASSIC CHESS';$('turn-chip').textContent=end.over?'GAME OVER':state.turn===human?'YOUR TURN':'CPU TURN';$('thinking-overlay').hidden=!thinking;$('player-caption').textContent=human==='w'?'IVORY · WHITE':'OBSIDIAN · BLACK';$('opponent-side').textContent=human==='w'?'OBSIDIAN':'IVORY';$('undo-button').disabled=!snapshots.some(s=>s.turn===human);motionControls();
 let title=end.over?(end.winner?(end.winner===human?'A winning hand.':'The Automaton prevails.'):'An even ending.'):thinking?'Reading the possibilities.':inCheck(state)?'Your king is in check.':state.mode==='cards'?'Your hand. Your move.':'Your next move.';
 let detail=end.over?`${end.reason}. Deal a new game to play again.`:thinking?'The CPU searches normal moves and card actions. It cannot see the draw pile.':inCheck(state)?'Escape check with a normal move or a card power.':state.mode==='cards'?'Move a piece, or click a card for its power. Normal moves replace your leftmost card.':'Select a piece, then a highlighted square.';
 if(selected!==null){title=PIECES[state.board[selected].type].name+' · '+squareName(selected);detail=`${moves.length} legal destination${moves.length===1?'':'s'} for this choice. ${state.mode==='cards'&&slot!==null&&usePower?'The piece returns to its normal movement after this action.':''}`;}
 $('status-title').textContent=title;$('status-detail').textContent=detail;renderHand();
 const effects=[];if(state.shield)effects.push(`${squareName(state.shield.square)} is shielded: cannot be captured this turn.`);if(state.freeze)effects.push(`${squareName(state.freeze.square)} is frozen: cannot move this turn, but still attacks.`);$('effects').textContent=effects.join(' ')||'No lasting effects.';
 let marks=moves;if(selected===null&&state.mode==='cards'&&slot!==null&&usePower&&CARDS[state.hands[human][slot]].effect)marks=available();
 board?.update(state,selected,marks);renderFlat(marks);renderJournal();renderCaptures();setView(view);
}
function renderFlat(marks){
 const focused=document.activeElement?.dataset.square,flat=$('flat-board');flat.replaceChildren();
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){const square=flipped?row*8+7-col:(7-row)*8+col,p=state.board[square],button=document.createElement('button'),legal=marks.some(m=>m.to===square);
 button.className=`flat-square${(square%8+(square>>3))%2===0?' dark':''}${p?.color==='b'?' black-piece':''}${state.shield?.square===square?' shielded':''}${state.freeze?.square===square?' frozen':''}${selected===square?' selected':''}${legal?' legal':''}${legal&&slot!==null&&usePower&&state.mode==='cards'?' power-move':''}${state.lastMove&&(state.lastMove.from===square||state.lastMove.to===square)?' last':''}`;button.dataset.square=square;button.setAttribute('aria-label',`${squareName(square)}${p?`, ${p.color==='w'?'White':'Black'} ${PIECES[p.type].name}`:', empty'}${legal?', legal destination':''}${state.shield?.square===square?', shielded':''}${state.freeze?.square===square?', frozen':''}`);button.setAttribute('aria-pressed',String(selected===square));button.innerHTML=`<span class="flat-piece">${p?glyph[p.type]:''}</span><span class="square-label">${squareName(square)}</span>`;button.onclick=()=>selectSquare(square);button.onkeydown=e=>{const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:8,ArrowUp:-8}[e.key];if(delta!==undefined){e.preventDefault();const buttons=[...flat.children];buttons[buttons.indexOf(button)+delta]?.focus();}};flat.append(button);}
 if(focused!==undefined&&view==='2d')flat.querySelector(`[data-square="${focused}"]`)?.focus();
}
function renderJournal(){const container=$('journal');container.replaceChildren();$('move-count').textContent=String(journal.length).padStart(2,'0');if(!journal.length){container.innerHTML='<p class="empty-journal">The first card is yours to play.</p>';return;}journal.forEach((text,i)=>{const row=document.createElement('div');row.className='turn-entry';row.textContent=`${Math.floor(i/2)+1}${i%2?' …':' .'} ${text}`;container.append(row);});container.scrollTop=container.scrollHeight;}
function renderCaptures(){const captured={w:[],b:[]};snapshots.forEach((before,i)=>{const next=snapshots[i+1]||state,m=next.lastMove;if(!m||['shield','freeze','swap'].includes(m.special))return;const p=m.special==='ep'?{type:'p'}:before.board[m.to];if(p)captured[before.turn].push(glyph[p.type]);});$('white-captured').textContent=captured[human].join('');$('black-captured').textContent=captured[opposite(human)].join('');}
function setView(next){view=next;$('board-view').hidden=next!=='3d';$('flat-board').hidden=next!=='2d';$('view-3d').setAttribute('aria-pressed',String(next==='3d'));$('view-2d').setAttribute('aria-pressed',String(next==='2d'));if(next==='3d')board?.resize();}
$('normal-mode').onclick=()=>{usePower=false;selected=null;moves=[];render();};
$('view-3d').onclick=()=>setView('3d');$('view-2d').onclick=()=>setView('2d');$('flip-button').onclick=()=>{flipped=!flipped;board?.flip(flipped);render();};
$('undo-button').onclick=()=>{cancelPresentation();stopCPU();let index=snapshots.length-1;while(index>=0&&snapshots[index].turn!==human)index--;if(index<0)return;state=snapshots[index];snapshots=snapshots.slice(0,index);journal=journal.slice(0,index);resetSelection();save();render();};
$('difficulty').onchange=()=>{save();if(state.turn!==human&&!outcome(state).over)startCPU();};
$('new-button').onclick=()=>{$('side').value=human;$('new-form').elements.mode.value=state.mode;$('new-dialog').showModal();};
$('new-form').onsubmit=e=>{e.preventDefault();cancelPresentation();stopCPU();const data=new FormData(e.target);state=initialState(data.get('mode'));human=data.get('side');snapshots=[];journal=[];resetSelection();flipped=human==='b';board?.flip(flipped);$('new-dialog').close();$('save-notice').hidden=true;$('cpu-caption').textContent='CARD-AWARE CPU';save();render();startCPU();dealHand();};
$('guide-button').onclick=()=>$('guide-dialog').showModal();$('library-button').onclick=()=>$('library-dialog').showModal();
for(const button of document.querySelectorAll('.close-dialog'))button.onclick=()=>button.closest('dialog').close();
function renderLibrary(){
 const family=$('family-filter').value,tier=$('tier-filter').value;
 const ids=CARD_IDS.filter(id=>(!family||CARDS[id].family===family)&&(!tier||String(CARDS[id].tier)===tier));
 $('library-count').textContent=`${ids.length} of ${CARD_IDS.length} spells`;
 $('library-empty').hidden=ids.length>0;
 $('card-library').innerHTML=ids.map(id=>{const c=CARDS[id];return `<article class="library-card" data-card="${id}" data-tier="${c.tier}"><div class="library-family">${familyBadge(c)}<small>${c.kind} · ${POWER_TIERS[c.tier].copies} ${POWER_TIERS[c.tier].copies===1?'copy':'copies'} / deck</small></div><img class="library-art" src="${cardArt(id)}" alt="" width="900" height="600" loading="lazy"><span aria-hidden="true">${c.icon}</span><h3>${c.name}</h3><div class="library-rating">${tierBadge(c)}</div><p>${c.text}</p></article>`;}).join('');
}
$('card-legend').innerHTML=`<summary>Card families & power tiers</summary><div class="family-key">${Object.entries(FAMILIES).map(([id,f])=>`<div>${familyBadge({family:id})}<span>${f.text}</span></div>`).join('')}</div><div class="tier-key"><b>Frame color = power tier</b>${Object.keys(POWER_TIERS).map(tier=>tierBadge({tier})).join('')}</div><p>Silver = Standard · Blue = Powerful · Gold = Exceptional. Tiers rate a spell’s general potential, not the best move in every position. New matches use 40 cards: 3 copies of each Standard, 2 of each Powerful, and 1 of each Exceptional spell. Gold cards are rarer.</p>`;
$('family-filter').innerHTML='<option value="">All families</option>'+Object.entries(FAMILIES).map(([id,f])=>`<option value="${id}">${f.name}</option>`).join('');
$('tier-filter').innerHTML='<option value="">All power tiers</option>'+Object.entries(POWER_TIERS).map(([id,t])=>`<option value="${id}">${t.stars} ${t.name}</option>`).join('');
$('family-filter').onchange=renderLibrary;$('tier-filter').onchange=renderLibrary;
$('reset-filters').onclick=()=>{$('family-filter').value='';$('tier-filter').value='';renderLibrary();};
$('card-key-button').onclick=()=>{$('library-dialog').showModal();$('card-legend').open=true;$('card-legend').scrollIntoView({block:'nearest'});};
renderLibrary();
render();startCPU();if(!resumed)dealHand();
