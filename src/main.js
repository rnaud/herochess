import {Controller} from './controller.js';
import {setupInstall} from './install.js';
import './style.css';
import {CARDS,CARD_IDS,FAMILIES,POWER_TIERS,uniqueDeck,exchangeCard} from './cards.js';
import {GameEffects} from './effects.js';
import {GameSound} from './sound.js';
import {actionTiming} from './motion.js';
import {opponentPreview} from './preview.js';
import {pixelUrl} from './pixels.js';
import {loadStats,statsLine,recordResult,dailySummary} from './stats.js';
let cpuSlot=null,cpuPiece=null;
let impactTimer=null,flatCleanup=null,boardPresentation=null,boardDirty=false;
const effects=new GameEffects(),sound=new GameSound();
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>sound.unlock(),{capture:true});
function renderSound(){const button=document.getElementById('sound-button');button.textContent=sound.enabled?'♪ On':'♪ Off';button.setAttribute('aria-label',sound.enabled?'Mute sound effects':'Enable sound effects');button.setAttribute('aria-pressed',String(sound.enabled));}
document.getElementById('sound-button').onclick=async()=>{await sound.toggle();renderSound();};renderSound();
import {PIECES,initialState,legalMoves,applyMove,outcome,moveLabel,squareName,opposite,inCheck,positionKey} from './engine.js';
const $=id=>document.getElementById(id),SAVE_KEY='herochess-cards-v2';
const cardArt=(id,size=960)=>`${import.meta.env.BASE_URL}art/realms/${id}-${size}.webp`;
const familyBadge=c=>`<span class="family-badge" data-family="${c.family}"><span aria-hidden="true">${FAMILIES[c.family].icon}</span> ${FAMILIES[c.family].name}</span>`;
const tierBadge=c=>`<span class="tier-badge" data-tier="${c.tier}" aria-label="${POWER_TIERS[c.tier].name}, power tier ${c.tier} of 3"><span aria-hidden="true">${POWER_TIERS[c.tier].stars}</span> ${POWER_TIERS[c.tier].name}</span>`;
let resumed=false,dealAnimations=[],inspectedSquare=null,checkKey='',checkAlertAnimation=null,rewindsUsed=0,rewindReady=true,pendingFreeze=null,handOpen=false,exchangesUsed=0,pendingCardFocus=false,resultShown=false,resultRecorded=false,hotseat=false,dailyMode=false,hintsUsed=0,hintMove=null,hintText='',hintWorker=null,hintRequest=0;
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{if(event.matches){checkAlertAnimation?.cancel();effects.cancel();}});
let state=initialState(),human='w',snapshots=[],journal=[],selected=null,slot=null,usePower=true,moves=[],worker=null,requestId=0,thinking=false,animating=false,transitionId=0,flatAnimations=[],board=null,view='2d',flipped=false,level='2',boardFailed=false,boardLoading=null,viewRequest=0;
try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY));if([2,3].includes(saved?.version)&&saved.state?.board?.length===64&&saved.state.board.every(p=>p===null||PIECES[p.type])&&saved.state.hands?.w?.length===3&&saved.state.hands?.b?.length===3&&[...saved.state.hands.w,...saved.state.hands.b,...saved.state.deck,...saved.state.discard].every(id=>CARDS[id])&&['w','b'].includes(saved.human)){
 resumed=true;human=saved.human;rewindsUsed=Number.isInteger(saved.rewindsUsed)?Math.max(0,Math.min(3,saved.rewindsUsed)):0;rewindReady=saved.rewindReady!==false;exchangesUsed=saved.exchangesUsed===1?1:0;hintsUsed=Number.isInteger(saved.hintsUsed)?Math.max(0,Math.min(3,saved.hintsUsed)):0;dailyMode=!!saved.dailyMode;hotseat=!!saved.hotseat;resultRecorded=!!saved.resultRecorded;if(hotseat){human='w';flipped=false;document.body.dataset.hotseat='true';$('cpu-caption').textContent='PASS & PLAY';}
 const upgrade=s=>{const next=uniqueDeck(s,human);next.history=[positionKey(next)];return next;};
 state=saved.version===2?upgrade(saved.state):saved.state;snapshots=saved.version===2?saved.snapshots.map(upgrade):saved.snapshots;journal=saved.journal;level=saved.level||'2';flipped=human==='b';
}else if((localStorage.getItem('herochess-v2')||localStorage.getItem('herochess-cards-v1')))$('save-notice').hidden=false;}catch{}
$('difficulty').value=level;$('mobile-difficulty').value=level;
function canUseWebGL(){try{const c=document.createElement('canvas');return !!((window.WebGLRenderingContext||window.WebGL2RenderingContext)&&(c.getContext('webgl2')||c.getContext('webgl')));}catch{return false;}}
if(!canUseWebGL())boardFailed=true;
async function ensureBoard(){
 if(board)return true;
 if(boardFailed)return false;
 if(!boardLoading)boardLoading=import('./board.js').then(({ChessBoard})=>{board=new ChessBoard($('board-view'),selectSquare);board.flip(flipped);return true;}).catch(error=>{console.warn('WebGL unavailable; using the pixel board.',error);boardFailed=true;boardLoading=null;return false;});
 return boardLoading;
}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:3,state,human,snapshots,journal,rewindsUsed,rewindReady,exchangesUsed,hintsUsed,dailyMode,hotseat,resultRecorded,level:$('difficulty').value}));}catch{}}
function stopCPU(){requestId++;worker?.terminate();worker=null;thinking=false;}
function motionControls(){for(const id of ['flip-button','view-2d','difficulty'])$(id).disabled=animating;$('view-3d').disabled=animating||boardFailed;$('view-3d').title=boardFailed?'3D is unavailable in this browser; the pixel board is in use.':'Switch to the 3D table';}
function cancelPresentation(){transitionId++;clearTimeout(impactTimer);dealAnimations.forEach(a=>a.cancel());sound.stop();effects.cancel();board?.cancelAnimation();flatAnimations.forEach(a=>a.cancel());flatAnimations=[];flatCleanup?.();flatCleanup=null;animating=false;motionControls();}
function resetSelection(){cancelHint();cpuSlot=null;cpuPiece=null;pendingFreeze=null;inspectedSquare=null;$('piece-status').hidden=true;selected=null;slot=null;moves=[];usePower=true;}
function choice(){return state.mode==='cards'?{slot:slot??0,usePower:slot!==null&&usePower}:null;}
const youSide=()=>hotseat?state.turn:human;
function available(from=null){const actions=legalMoves(state,from,choice());return pendingFreeze===null?actions:actions.filter(m=>m.freezeTarget===pendingFreeze);}
let playableState=null,playableCache=[];
function playableCards(){
 const side=youSide();
 if(state.mode!=='cards'||!state.hands?.[side])return [];
 if(playableState===state)return playableCache;
 playableState=state;playableCache=state.hands[side].map((_,i)=>legalMoves(state,null,{slot:i,usePower:true}).length>0);
 return playableCache;
}
function startCPU(){
 if(hotseat||state.turn===human||outcome(state).over)return;stopCPU();thinking=true;render();const id=++requestId;
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
 const timing=actionTiming(state,move);
 const flat=$('flat-board'),origin=flat.querySelector(`[data-square="${move.from}"] .flat-piece`),destination=flat.querySelector(`[data-square="${move.to}"] .flat-piece`);
 if(!origin||!destination)return;
 const ghosts=[],hidden=[];
 const ghostFor=(element)=>{const rect=element.getBoundingClientRect(),ghost=element.cloneNode(true),style=getComputedStyle(element);Object.assign(ghost.style,{position:'fixed',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',margin:'0',zIndex:'100',pointerEvents:'none',font:style.font,color:style.color,textShadow:style.textShadow,display:'grid',placeItems:'center'});document.body.append(ghost);ghosts.push(ghost);hidden.push(element);element.style.visibility='hidden';return {ghost,rect};};
 const capturedSquare=move.special==='ep'?move.to+(state.turn==='w'?-8:8):move.to;
 const victim=move.special!=='swap'&&state.board[capturedSquare]?flat.querySelector(`[data-square="${capturedSquare}"] .flat-piece`):null;
 const animations=[];
 const travel=(element,target)=>{const {ghost,rect}=ghostFor(element),end=target.getBoundingClientRect(),dx=end.left-rect.left,dy=end.top-rect.top;const jump=move.usePower&&move.freezeTarget===undefined?['Leap','Travel'].includes(CARDS[move.card]?.kind):state.board[move.from].type==='n';animations.push(ghost.animate([{transform:'translate(0,0)'},{transform:`translate(${dx*.5}px,${dy*.5-(jump?28:8)}px) scale(1.12)`,offset:.5},{transform:`translate(${dx}px,${dy}px)`}],{delay:timing.anticipation,duration:timing.travel,easing:'ease-in-out',fill:'both'}));};
 if(victim){const {ghost}=ghostFor(victim);animations.push(ghost.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(1.65) rotate(20deg)',filter:'blur(5px)'}],{delay:timing.impact,duration:300,fill:'both',easing:'ease-out'}));}
 travel(origin,destination);
 if(move.special==='swap')travel(destination,origin);
 if(move.special==='castle'){const rookFrom=move.to>move.from?move.from+3:move.from-4,rookTo=move.to>move.from?move.from+1:move.from-1;travel(flat.querySelector(`[data-square="${rookFrom}"] .flat-piece`),flat.querySelector(`[data-square="${rookTo}"] .flat-piece`));}
 flatAnimations=animations;flat.dataset.animating=victim?'capture':'move';
 flatCleanup=()=>{ghosts.forEach(ghost=>ghost.remove());hidden.forEach(element=>element.style.visibility='');delete flat.dataset.animating;};
 await Promise.allSettled(animations.map(animation=>animation.finished));
 flatAnimations=[];
}
async function commit(move){
 const before=state,text=moveLabel(state,move),id=++transitionId;
 effects.cancel();if(hotseat||before.turn===human)rewindReady=true;
 const timing=actionTiming(before,move);if(move.usePower)sound.play('power',CARDS[move.card]?.family);clearTimeout(impactTimer);impactTimer=setTimeout(()=>{if(id===transitionId)sound.play(timing.capture?'capture':move.special==='castle'?'castle':'move');},matchMedia('(prefers-reduced-motion: reduce)').matches?0:timing.impact);snapshots.push(state);state=applyMove(state,move);const end=outcome(state);journal.push(text+(end.reason==='Checkmate'?' #':inCheck(state)?' +':''));resetSelection();save();animating=true;motionControls();renderRewind();$('thinking-overlay').hidden=true;
 const source=before.turn===human?$('hand').children[move.slot]:$('cpu-hand').children[move.slot];
 const point=square=>{if(view==='3d'&&board)return board.screenPoint(square);const rect=$('flat-board').querySelector(`[data-square="${square}"]`)?.getBoundingClientRect();return rect?{x:rect.left+rect.width/2,y:rect.top+rect.height/2}:null;};
 try{await Promise.all([effects.play(before,move,source,point,human),view==='3d'&&board?board.animateMove(before,move):animateFlat(before,move)]);}finally{if(id===transitionId){flatCleanup?.();flatCleanup=null;render();if(move.usePower&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const card=(before.turn===human?$('hand'):$('cpu-hand')).children[move.slot];if(card){const a=card.animate([{opacity:0,transform:'translateY(24px) scale(.9)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:300,easing:'ease-out'});a.id='replacement-deal';dealAnimations=[a];sound.play('draw');await Promise.allSettled([a.finished]);}}if(id===transitionId){animating=false;motionControls();render();if(!end.over&&state.turn!==human)startCPU();}}}
}
function renderPieceStatus(){
 const square=inspectedSquare,p=square===null?null:state.board[square];
 const descriptions=[];
 if(p&&state.shield?.square===square)descriptions.push('<strong>◇ Shielded · Glass Aegis</strong><p>This piece cannot be captured. It still attacks and blocks paths normally.</p>');
 if(p&&state.freeze?.square===square)descriptions.push('<strong>❄ Frozen · Winter Seal</strong><p>This piece cannot move or swap, including by a card power. It still attacks and blocks paths, so it can still give check.</p>');
 $('piece-status').hidden=!descriptions.length;
 if(!descriptions.length)return;
 $('piece-status-title').textContent=`${p.color==='w'?'White':'Black'} ${PIECES[p.type].name} · ${squareName(square)}`;
 $('piece-status-details').innerHTML=descriptions.join('')+`<p class="status-expiry">Expires after ${state.turn==='w'?'White':'Black'} completes this turn, even if they use a card.</p>`;
}
$('close-piece-status').onclick=()=>{inspectedSquare=null;renderPieceStatus();};
document.addEventListener('keydown',event=>{if(event.key==='Escape'){inspectedSquare=null;if(cpuSlot!==null){cpuSlot=null;cpuPiece=null;render();}else renderPieceStatus();}});
function selectSquare(square){
 if(animating)return;
 cancelHint();
 inspectedSquare=square;renderPieceStatus();
 if(cpuSlot!==null){if(state.board[square]?.color===opposite(youSide()))cpuPiece=cpuPiece===square?null:square;render();return;}
 if(thinking||(!hotseat&&state.turn!==human)||outcome(state).over)return;
 const card=state.mode==='cards'&&slot!==null&&usePower?CARDS[state.hands[youSide()][slot]]:null;
 if(card?.effect==='freeze'&&pendingFreeze===null){
  if(available().some(m=>m.freezeTarget===square)){pendingFreeze=square;moves=selected===null?[]:available(selected);render();}else $('card-instruction').textContent='Choose an enemy piece other than the king to freeze, then move one of your pieces.';
  return;
 }
 if(card?.effect==='shield'){const action=available(square).find(m=>m.special===card.effect);if(action)commit(action);else $('card-instruction').textContent='That is not a legal target. Kings cannot receive powers; your king must remain safe.';return;}
 const options=moves.filter(m=>m.to===square);
 if(options.length){if(options[0].promotion){$('promotion-options').replaceChildren();for(const m of options){const button=document.createElement('button');button.innerHTML=`<img class="promotion-piece" src="${pixelUrl(m.promotion,state.turn)}" alt=""><span>${PIECES[m.promotion].name}</span>`;button.onclick=()=>{$('promotion-dialog').close();commit(m);};$('promotion-options').append(button);}$('promotion-dialog').showModal();}else commit(options[0]);return;}
 if(state.board[square]?.color===youSide()){selected=selected===square?null:square;moves=selected===null?[]:available(selected);}else{selected=null;moves=[];}render();
}
function selectCard(index){
 if(animating||thinking||(!hotseat&&state.turn!==human)||outcome(state).over)return;
 cancelHint();cpuSlot=null;cpuPiece=null;slot=slot===index?null:index;usePower=true;pendingFreeze=null;sound.play('select');
 if(slot!==null){
  usePower=!!playableCards()[slot];
  if(matchMedia('(max-width:600px)').matches)handOpen=false;
 }
 const card=slot===null?null:CARDS[state.hands[youSide()][slot]];
 moves=selected===null?[]:slot!==null&&usePower?(card?.effect==='freeze'?[]:card?.effect?available():available(selected)):available(selected);
 pendingCardFocus=true;
 render();
}
function dealHand(){
 if(state.mode==='cards')sound.play('deal');
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
 const you=youSide();
 const canEvaluate=state.mode==='cards'&&(hotseat||state.turn===human)&&!thinking&&!outcome(state).over;
 const playable=canEvaluate?playableCards():null;
 const powerActive=slot!==null&&usePower;
 document.body.dataset.mode=state.mode;document.body.dataset.cardSelected=String(slot!==null);document.body.dataset.powerActive=String(powerActive);document.body.dataset.handOpen=String(handOpen);
 $('hand-toggle').setAttribute('aria-expanded',String(handOpen));$('hand-toggle-label').textContent=slot!==null?(usePower?'Power active':'Card waiting'):handOpen?'Hide hand':outcome(state).over?'Match over':hotseat?`${you==='w'?'White':'Black'}'s hand · ${String(state.fullmove).padStart(2,'0')}`:`Your hand · ${String(state.fullmove).padStart(2,'0')}`;$('hand-toggle-count').textContent=String(state.hands[you]?.length??0);
 const active=slot===null?null:CARDS[state.hands[you][slot]];
 $('selected-card-art').hidden=!active;$('selected-card-placeholder').hidden=!!active;
 if(active)$('selected-card-art').src=cardArt(state.hands[you][slot],480);
 $('selected-card-title').textContent=active?active.name:'Normal chess move';
 $('selected-card-example').hidden=slot===null||state.hands[you][slot]!=='pierce';
 $('selected-card-example').innerHTML=slot!==null&&state.hands[you][slot]==='pierce'?veilExample():'';
 $('selected-card-meta').innerHTML=active?`${familyBadge(active)} ${tierBadge(active)}`:'';

 $('hand-panel').hidden=state.mode!=='cards';$('cpu-hand-panel').hidden=state.mode!=='cards';
 $('deck-count').textContent=`${state.deck.length} in deck · ${state.discard.length} discarded`;$('hand').replaceChildren();$('cpu-hand').replaceChildren();
 state.hands[you].forEach((id,index)=>{const c=CARDS[id],canPlay=playable?playable[index]:true,button=document.createElement('button');button.className=`spell-card${slot===index?(usePower?' chosen':' inspected'):''}${canPlay?'':' unplayable'}`;button.dataset.slot=index;button.dataset.action='power';button.dataset.card=id;button.dataset.family=c.family;button.dataset.tier=c.tier;button.setAttribute('aria-pressed',String(slot===index));button.setAttribute('aria-label',`${c.name}. ${FAMILIES[c.family].name}. ${POWER_TIERS[c.tier].name}, power tier ${c.tier} of 3. ${c.text}${canPlay?'':' No legal target in this position yet.'}`);button.innerHTML=`<span class="card-top">${familyBadge(c)}<span>0${index+1}</span></span><img class="card-art" src="${cardArt(id,480)}" alt="" width="480" height="320">${canPlay?'':'<span class="card-wait">NO TARGET YET</span>'}<span class="card-sigil" aria-hidden="true">${c.icon}</span><strong>${c.name}</strong><span class="card-text">${c.summary}</span><span class="card-rating">${tierBadge(c)}<span class="card-mechanic">${c.kind}</span></span><span class="card-bottom">ONE ACTION · TEMPORARY</span>`;button.disabled=thinking||animating||state.turn!==human||outcome(state).over;button.onclick=()=>selectCard(index);$('hand').append(button);});
 state.hands[opposite(you)].forEach((id,index)=>{const c=CARDS[id],item=document.createElement('details');item.className='cpu-card';item.setAttribute('name','opponent-cards');item.open=cpuSlot===index;item.dataset.card=id;item.dataset.tier=c.tier;item.innerHTML=`<summary aria-controls="cpu-preview"><img class="cpu-art" src="${cardArt(id,480)}" alt="" width="90" height="90" loading="lazy"><span class="cpu-card-title"><strong>${c.name}</strong><span class="cpu-rating">${FAMILIES[c.family].name} · ${POWER_TIERS[c.tier].stars}</span></span></summary>`;item.querySelector('summary').onclick=event=>{event.preventDefault();if(animating)return;cpuSlot=cpuSlot===index?null:index;sound.play('select');render();$('cpu-hand').children[index].querySelector('summary').focus({preventScroll:true});};$('cpu-hand').append(item);});
 $('normal-mode').hidden=slot===null;$('normal-mode').textContent=slot!==null&&!usePower?'Close card':'↶ Cancel power';
 const canExchange=slot!==null&&!usePower&&exchangesUsed<1;
 $('exchange-card').hidden=!canExchange;$('exchange-card').textContent=`↻ Swap card · ${1-exchangesUsed}`;
 for(const id of ['normal-mode','exchange-card']){$(id).disabled=animating||thinking||state.turn!==human||outcome(state).over;$(id).setAttribute('aria-pressed',String(id==='normal-mode'&&slot!==null&&!usePower));}
 let instruction='Move a piece normally, or click a card to activate its power. Normal moves keep all your cards.';
 if(slot!==null){const id=state.hands[you][slot],c=CARDS[id],actions=available();if(!usePower){instruction='No legal target for this card yet. You can still move normally; it stays in your hand.'+(exchangesUsed<1?' You may swap it for a fresh card once this match.':'');}else{instruction=c.text+(['shield','freeze'].includes(c.effect)?' Click a highlighted target.':' Select a piece, then a destination.');if(c.effect==='freeze')instruction=pendingFreeze===null?'Click a highlighted enemy to freeze for its next turn. It will still attack and block paths. Then make a normal move with one of your pieces.':`Freeze ${PIECES[state.board[pendingFreeze].type].name} on ${squareName(pendingFreeze)}, then move one of your pieces normally. The card is spent when you finish the move.`;if(!actions.length)instruction='No legal power action for this card here. You can still move normally; the card stays in your hand.';else if(selected!==null&&!moves.length&&!(c.effect==='freeze'&&pendingFreeze===null))instruction='This piece has no legal destination with this choice. Try another piece or move normally.';}}
 $('selected-card-title').closest('.spell-workspace').classList.toggle('has-selection',!!active);
 $('card-instruction').textContent=thinking?'The Automaton is choosing from its visible hand…':instruction;
 if(pendingCardFocus){
  pendingCardFocus=false;
  requestAnimationFrame(()=>{
   const square=view==='2d'?$('flat-board').querySelector('.flat-square.legal'):null;
   const actions=slot!==null?available():null;
   const origin=view==='2d'&&actions?.length?$('flat-board').querySelector(`[data-square="${actions[0].from}"]`):null;
   const card=slot!==null?$('hand').querySelector(`[data-slot="${slot}"]`):null;
   const target=square||origin||(card&&card.getClientRects().length?card:null)||$('hand-toggle');
   target?.focus({preventScroll:true});
  });
 }
}
function renderOpponentPreview(you=youSide()){
 const panel=$('cpu-preview');panel.hidden=cpuSlot===null;document.body.dataset.cpuPreview=String(cpuSlot!==null);
 if(cpuSlot===null)return null;
 const card=CARDS[state.hands[opposite(you)][cpuSlot]],actions=opponentPreview(state,you,cpuSlot,cpuPiece),destinations=[...new Set(actions.map(m=>m.to))];
 $('cpu-preview-title').textContent=`${hotseat?'Opponent':'CPU'} preview · ${card.name}`;
 $('cpu-preview-rules').textContent=card.text;
 let message=`Select an ${hotseat?'opponent':'CPU'} piece to preview this power. Purple squares are previews only.`;
 if(cpuPiece!==null){const piece=PIECES[state.board[cpuPiece].type].name;
  message=!actions.length?`${piece} on ${squareName(cpuPiece)} has no legal action with this card in this position.`:card.effect==='shield'?`The CPU can shield this ${piece.toLowerCase()} on ${squareName(cpuPiece)}. This card does not move it.`:`${piece} on ${squareName(cpuPiece)} · ${destinations.length} ${card.swap?'swap target':'destination'}${destinations.length===1?'':'s'}. Purple squares show where it can ${card.swap?'swap':'go'}.`;
  if(card.effect==='freeze'&&actions.length)message+=` Winter Seal keeps its normal movement and can freeze your non-king pieces on ${[...new Set(actions.map(m=>squareName(m.freezeTarget)))].join(', ')}.`;
 }
 $('cpu-preview-instruction').textContent=message;
 $('cpu-preview-note').textContent=state.turn===you?`If the ${hotseat?'other player':'CPU'} played next on this board; current-turn effects expire first. Your move may change these options.`:`Current legal options. The ${hotseat?'other player':'CPU'} may choose a different action.`;
 return cpuPiece===null?[]:actions.map(m=>({...m,preview:true}));
}
$('close-cpu-preview').onclick=()=>{cpuSlot=null;cpuPiece=null;render();};
function positionCheckMarker(){
 const marker=$('check-marker');if(marker.hidden)return;
 const square=state.board.findIndex(p=>p?.type==='k'&&p.color===state.turn),shell=$('board-view').closest('.board-shell').getBoundingClientRect();
 if(square<0)return;
 let point;
 if(view==='3d'&&board)point=board.screenPoint(square);
 else{const r=$('flat-board').querySelector(`[data-square="${square}"]`)?.getBoundingClientRect();if(r)point={x:r.left+r.width/2,y:r.top+r.height/2};}
 if(point){marker.style.left=(point.x-shell.left)+'px';marker.style.top=(point.y-shell.top)+'px';}
}
function renderRewind(){
 const remaining=3-rewindsUsed,button=$('undo-button');button.disabled=remaining===0||!rewindReady||outcome(state).over||(hotseat?!snapshots.length:!snapshots.some(s=>s.turn===human));
 $('rewind-count').textContent=String(remaining);
 button.title=remaining===0?'No rewinds left this match.':!rewindReady?'Play another turn before rewinding again.':hotseat?`Rewind the last action. ${remaining} uses left.`:`Rewind your last turn and the CPU reply. ${remaining} uses left.`;
 button.setAttribute('aria-label',`Rewind time, ${remaining} uses left. ${button.title}`);
}
function renderCheck(end){
 const checked=inCheck(state),mate=end.reason==='Checkmate';
 document.body.dataset.check=checked?'true':'false';$('check-banner').hidden=!checked;$('check-marker').hidden=!checked;
 if(!checked){checkKey='';checkAlertAnimation?.cancel();return;}
 const heading=mate?'CHECKMATE':'CHECK';if($('check-heading').textContent!==heading)$('check-heading').textContent=heading;
 const message=mate?(hotseat?`${end.winner==='w'?'White':'Black'} delivered checkmate.`:(end.winner===human?'You win. The Automaton has no escape.':'Your king has no escape. The Automaton wins.')):(hotseat?`The ${state.turn==='w'?'White':'Black'} king is under attack.`:(state.turn===human?'Your king is under attack. Get out of check.':'The Automaton’s king is under attack.'));
 if($('check-message').textContent!==message)$('check-message').textContent=message;
 const key=`${state.turn}:${state.fullmove}:${state.lastMove?.from}:${state.lastMove?.to}`;
 if(key!==checkKey){sound.play(mate?'mate':'check');checkKey=key;checkAlertAnimation?.cancel();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)checkAlertAnimation=$('check-banner').animate([{opacity:0,transform:'translateY(-12px) scale(.94)'},{opacity:1,transform:'translateY(0) scale(1.03)',offset:.7},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:420,easing:'ease-out'});}
}
new ResizeObserver(()=>requestAnimationFrame(positionCheckMarker)).observe($('board-view').closest('.board-shell'));
function dailySeed(){const d=new Date();return (Number(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`))>>>0;}
function startDaily(){startMatch({mode:'cards',side:'w',level:'2',hs:false,seed:dailySeed(),daily:true});}
function renderDaily(){const el=$('daily-status');if(el)el.textContent=`Today's deal is shared by everyone. ${dailySummary(loadStats())}`;}
function cancelHint(){hintRequest++;hintWorker?.terminate();hintWorker=null;hintMove=null;hintText='';}
function renderHint(){const button=$('hint-button'),left=3-hintsUsed;button.disabled=left<=0||!!hintWorker||thinking||animating||outcome(state).over||(!hotseat&&state.turn!==human);$('hint-count').textContent=String(left);button.title=left<=0?'No hints left this match.':`Show one strong action. ${left} uses left.`;button.setAttribute('aria-label',`Hint, ${left} uses left`);}
function requestHint(){
 if(hintsUsed>=3||hintWorker||thinking||animating||outcome(state).over||(!hotseat&&state.turn!==human))return;
 cancelHint();const request=++hintRequest;renderHint();
 hintWorker=new Worker(new URL('./ai-worker.js',import.meta.url),{type:'module'});renderHint();
 hintWorker.onmessage=({data})=>{if(request!==hintRequest)return;hintWorker?.terminate();hintWorker=null;if(data.error){hintText='The hint search failed. Try again.';render();return;}const move=legalMoves(state).find(m=>JSON.stringify(m)===JSON.stringify(data.move));if(!move){hintText='No strong action found.';render();return;}hintMove=move;hintsUsed++;hintText=move.usePower?`Consider ${moveLabel(state,move)}.`:`Consider ${moveLabel(state,move)}.`;save();sound.play('select');render();};
 hintWorker.onerror=()=>{if(request!==hintRequest)return;hintWorker?.terminate();hintWorker=null;hintText='The hint search failed. Try again.';render();};
 hintWorker.postMessage({id:request,state:{...state,simulation:true,deck:[],discard:[],rng:0,history:[]},options:{maxDepth:2,timeMs:900,quiescence:false}});
}
function coachStep(n){
 const steps=[
  ['Move first, then spend a card.','Select one of your pieces and a highlighted square for a normal move. Or click a card to use its power instead.'],
  ['Cards are temporary.','A power lasts for one action and is replaced after the move. Normal moves keep your whole hand. Both hands are public.'],
  ['Watch the answer.','Shield and freeze expire after one reply. Click a glowing piece to read its status. Pixel is the keyboard-friendly board; Table is the 3D view.']
 ];
 n=Math.max(0,Math.min(2,n));
 $('coach-title').textContent=steps[n][0];$('coach-text').textContent=steps[n][1];$('coach-progress').textContent=`${n+1} / ${steps.length}`;
 $('coach-next').textContent=n===2?'Start playing':'Next →';
 $('coach').hidden=false;$('coach').dataset.step=String(n);
}
function endCoach(){try{localStorage.setItem('herochess-coach-v1','done');}catch{} $('coach').hidden=true;}
$('coach-next').onclick=()=>{const n=Number($('coach').dataset.step||0);if(n>=2)endCoach();else coachStep(n+1);};
$('coach-skip').onclick=endCoach;
document.addEventListener('pointerdown',event=>{const coach=$('coach');if(!coach||coach.hidden)return;if(!event.target.closest('#coach'))endCoach();},{capture:true});
$('daily-button').onclick=()=>startDaily();
$('daily-header').onclick=()=>{$('new-button').click();$('daily-button').focus();};
$('hint-button').onclick=requestHint;
function matchPowers(){const powers=[];for(let i=0;i<snapshots.length;i++){const next=snapshots[i+1]||state,m=next.lastMove;if(m?.usePower)powers.push(m.card);}return powers;}
function resultContent(end){
 const powers=matchPowers(),stats=loadStats();
 const winner=end.winner;
 let title,outcome,eyebrow=dailyMode?'DAILY ARCANA · COMPLETE':'MATCH COMPLETE';
 if(!winner){title='An even ending.';outcome='draw';}
 else if(hotseat){title=`${winner==='w'?'White':'Black'} wins.`;outcome='hotseat';}
 else if(winner===human){title='A winning hand.';outcome='win';}
 else{title='The Automaton prevails.';outcome='loss';}
 const detail=end.reason==='Checkmate'?(hotseat?`${winner==='w'?'White':'Black'} delivered checkmate.`:(winner===human?'You delivered checkmate.':'Your king has no escape.')):`${end.reason}.`;
 return {title,outcome,eyebrow,detail,powers,stats};
}
function openResult(end){
 if(resultShown||animating)return;resultShown=true;
 const info=resultContent(end),dialog=$('result-dialog');
 $('result-title').textContent=info.title;$('result-detail').textContent=info.detail;$('result-eyebrow').textContent=info.eyebrow;
 $('result-stats').innerHTML=`<div><b>${journal.length}</b><span>plies</span></div><div><b>${info.powers.length}</b><span>powers played</span></div><div><b>${rewindsUsed}</b><span>rewinds used</span></div><div><b>${hotseat?'Local':['','Apprentice','Tactician','Strategist'][Number($('difficulty').value)]||'CPU'}</b><span>${hotseat?'two players':'opponent'}</span></div>`;
 let record=loadStats();
 if(!hotseat&&!resultRecorded){
  record=recordResult({outcome:info.outcome,mode:state.mode,level:$('difficulty').value,moves:journal.length,powers:info.powers,rewinds:rewindsUsed,date:new Date().toISOString().slice(0,10),daily:dailyMode});
  resultRecorded=true;save();
 }
 $('result-record').textContent=statsLine(record);
 $('result-share-status').textContent='';
 dialog.showModal();
}
function resultShareText(end){
 const info=resultContent(end),powers=info.powers.length;
 return `Herochess — The Arcana Deck\n${info.title} ${info.detail}\n${state.mode==='cards'?'Card chess':'Classic chess'} · ${journal.length} plies · ${powers} powers\n${location.href}`;
}
$('result-review').onclick=()=>$('result-dialog').close();
$('result-share').onclick=async()=>{
 const end=outcome(state),text=resultShareText(end);
 try{await navigator.clipboard.writeText(text);$('result-share-status').textContent='Copied to clipboard.';}
 catch{$('result-share-status').textContent=text;}
};
$('result-rematch').onclick=()=>{ $('result-dialog').close(); if(dailyMode)startDaily(); else startMatch({mode:state.mode,side:human,level:$('difficulty').value,hs:hotseat}); };
function render(){
 renderPieceStatus();
 const you=youSide(),opp=opposite(you),end=outcome(state),sideName=you==='w'?'WHITE':'BLACK',oppName=opp==='w'?'WHITE':'BLACK';
 renderCheck(end);if(end.over)openResult(end);
 $('turn-number').textContent=`ROUND ${String(state.fullmove).padStart(2,'0')}`;
 $('mode-label').textContent=state.mode==='cards'?'CARD CHESS':'CLASSIC CHESS';
 $('turn-chip').textContent=end.over?'GAME OVER':inCheck(state)?(hotseat?`${sideName} IN CHECK`:(state.turn===human?'YOU ARE IN CHECK':'CPU IN CHECK')):hotseat?`${sideName} TO MOVE`:(state.turn===human?'YOUR TURN':'CPU TURN');
 $('thinking-overlay').hidden=!thinking;
 $('player-caption').textContent=hotseat?`${you==='w'?'IVORY · WHITE':'OBSIDIAN · BLACK'}${end.over?'': ' · TO MOVE'}`:(human==='w'?'IVORY · WHITE':'OBSIDIAN · BLACK');
 $('opponent-side').textContent=hotseat?(opp==='w'?'IVORY':'OBSIDIAN'):(human==='w'?'OBSIDIAN':'IVORY');
 $('bottom-name').textContent=hotseat?(you==='w'?'White':'Black'):'You';
 $('opponent-name').textContent=hotseat?(opp==='w'?'White':'Black'):'The Automaton';
 renderRewind();motionControls();renderHint();
 let title=end.over?(end.winner?(hotseat?`${end.winner==='w'?'White':'Black'} wins.`:(end.winner===human?'A winning hand.':'The Automaton prevails.')):'An even ending.')
  :inCheck(state)?(hotseat?`${sideName[0]+sideName.slice(1).toLowerCase()} is in check!`:(state.turn===human?'You are in check!':'The Automaton is in check.'))
  :thinking?'Reading the possibilities.'
  :hotseat?`${you==='w'?'White':'Black'} to move.`
  :state.mode==='cards'?'Your hand. Your move.':'Your next move.';
 let detail=end.over?`${end.reason}. Start a rematch or deal a new game.`
  :inCheck(state)?(hotseat?`Only moves that protect the ${you==='w'?'white':'black'} king are allowed.`:(state.turn===human?'Only moves that protect your king are allowed. Move it, capture the attacker, or block the attack.':'The Automaton must protect its king before doing anything else.'))
  :thinking?'The CPU searches normal moves and card actions. It cannot see the draw pile.'
  :hotseat?'Pass the device. Both hands are public; the draw pile is hidden.'
  :state.mode==='cards'?'Move a piece, or click a card for its power. Normal moves keep all your cards.':'Select a piece, then a highlighted square.';
 if(!inCheck(state)&&selected!==null&&!(slot!==null&&CARDS[state.hands[you][slot]].effect)){title=PIECES[state.board[selected].type].name+' · '+squareName(selected);detail=`${moves.length} legal destination${moves.length===1?'':'s'} for this choice. ${state.mode==='cards'&&slot!==null&&usePower?'The piece returns to its normal movement after this action.':''}`;}
 if(cpuSlot!==null&&!inCheck(state)&&!end.over){title=hotseat?'Inspecting opponent powers':'Inspecting CPU powers';detail='Preview only. Exit preview or choose one of your cards to return to your turn.';}
 if(hintText&&!end.over){title='Hint';detail=hintText;}
 $('hint-banner').hidden=!hintText||end.over;$('hint-banner').textContent=hintText?`Hint · ${hintText}`:'';
 $('status-title').textContent=title;$('status-detail').textContent=detail;renderHand();
 const effects=[];if(state.shield)effects.push(`${squareName(state.shield.square)} is shielded: cannot be captured this turn.`);if(state.freeze)effects.push(`${squareName(state.freeze.square)} is frozen: cannot move this turn, but still attacks.`);$('effects').textContent=effects.join(' ')||'No lasting effects.';
 const previewMarks=renderOpponentPreview(you);
 let marks=moves;if(slot!==null&&CARDS[state.hands[you][slot]].effect==='freeze'&&pendingFreeze===null)marks=[...new Set(available().map(m=>m.freezeTarget))].map(to=>({to,usePower:true}));else if(selected===null&&state.mode==='cards'&&slot!==null&&usePower&&CARDS[state.hands[you][slot]].effect==='shield')marks=available();
 if(previewMarks!==null)marks=previewMarks;
 boardPresentation=[cpuSlot!==null||pendingFreeze===null?state:{...state,freeze:{square:pendingFreeze,color:opposite(you)}},cpuSlot!==null?cpuPiece:selected,marks,cpuSlot!==null];boardDirty=true;renderFlat(marks);renderJournal();renderCaptures();renderCPURecap();setView(view);
}
function renderFlat(marks){
 const checked=inCheck(state),focused=document.activeElement?.dataset.square,flat=$('flat-board');flat.replaceChildren();
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){const square=flipped?row*8+7-col:(7-row)*8+col,p=state.board[square],button=document.createElement('button'),legal=marks.some(m=>m.to===square);
 button.className=`flat-square${checked&&p?.type==='k'&&p.color===state.turn?' king-in-check':''}${(square%8+(square>>3))%2===0?' dark':''}${p?.color==='b'?' black-piece':''}${state.shield?.square===square?' shielded':''}${state.freeze?.square===square||(cpuSlot===null&&pendingFreeze===square)?' frozen':''}${cpuSlot!==null?(cpuPiece===square?' preview-origin':''):(selected===square?' selected':'')}${legal?(cpuSlot!==null?' preview-destination':' legal'):''}${cpuSlot===null&&legal&&slot!==null&&usePower&&state.mode==='cards'?' power-move':''}${hintMove&&(hintMove.from===square||hintMove.to===square)?' hint':''}${state.lastMove&&(state.lastMove.from===square||state.lastMove.to===square)?' last':''}`;button.dataset.square=square;button.setAttribute('aria-label',`${squareName(square)}${p?`, ${p.color==='w'?'White':'Black'} ${PIECES[p.type].name}`:', empty'}${checked&&p?.type==='k'&&p.color===state.turn?', in check':''}${legal?(cpuSlot!==null?', CPU preview destination':', legal destination'):''}${state.shield?.square===square?', shielded':''}${state.freeze?.square===square?', frozen':''}${cpuSlot===null&&pendingFreeze===square?', selected freeze target':''}`);button.setAttribute('aria-pressed',String(cpuSlot!==null?cpuPiece===square:selected===square));button.innerHTML=`<span class="flat-piece">${p?`<img class="flat-piece-img" src="${pixelUrl(p.type,p.color)}" alt="" draggable="false">`:''}</span><span class="square-label">${squareName(square)}</span>`;button.onclick=()=>selectSquare(square);button.onkeydown=e=>{const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:8,ArrowUp:-8}[e.key];if(delta!==undefined){e.preventDefault();const buttons=[...flat.children];buttons[buttons.indexOf(button)+delta]?.focus();}};flat.append(button);}
 if(focused!==undefined&&view==='2d')flat.querySelector(`[data-square="${focused}"]`)?.focus();
}
function renderJournal(){const container=$('journal');container.replaceChildren();$('move-count').textContent=String(journal.length).padStart(2,'0');if(!journal.length){container.innerHTML='<p class="empty-journal">The first card is yours to play.</p>';return;}journal.forEach((text,i)=>{const row=document.createElement('div');row.className='turn-entry';row.textContent=`${Math.floor(i/2)+1}${i%2?' …':' .'} ${text}`;container.append(row);});container.scrollTop=container.scrollHeight;}
function renderCPURecap(){
 const panel=$('cpu-recap');if(hotseat){panel.hidden=true;return;}
 const index=snapshots.findLastIndex(s=>s.turn!==human);panel.hidden=index<0;
 if(index<0)return;
 const before=snapshots[index],after=snapshots[index+1]||state,m=after.lastMove;if(!m)return;
 const piece=PIECES[before.board[m.from]?.type]?.name||'Piece',captured=m.special==='ep'?'Pawn':PIECES[before.board[m.to]?.type]?.name;
 const action=m.special==='shield'?`Shielded its ${piece.toLowerCase()} on ${squareName(m.from)}.`:m.special==='swap'?`Swapped ${squareName(m.from)} and ${squareName(m.to)}.`:`${piece} ${squareName(m.from)} → ${squareName(m.to)}${captured?` · captured your ${captured.toLowerCase()}`:''}.${m.freezeTarget!==undefined?` Froze your piece on ${squareName(m.freezeTarget)}.`:''}`;
 $('cpu-recap-title').textContent=m.usePower?`CPU played ${CARDS[m.card].name}`:'CPU moved';
 $('cpu-recap-detail').textContent=action;
 panel.dataset.family=m.usePower?CARDS[m.card].family:'normal';
}
function renderCaptures(){const captured={w:[],b:[]};snapshots.forEach((before,i)=>{const next=snapshots[i+1]||state,m=next.lastMove;if(!m||['shield','freeze','swap'].includes(m.special))return;const p=m.special==='ep'?{type:'p',color:opposite(before.turn)}:before.board[m.to];if(p)captured[before.turn].push({type:p.type,color:p.color||opposite(before.turn)});});const show=list=>list.map(p=>`<img class="captured-pixel" src="${pixelUrl(p.type,p.color)}" alt="">`).join('');$('white-captured').innerHTML=show(captured[youSide()]);$('black-captured').innerHTML=show(captured[opposite(youSide())]);}
async function setView(next){
 const request=++viewRequest;
 if(next==='3d'){const ok=await ensureBoard();if(request!==viewRequest)return;if(!ok)next='2d';}
 view=next;$('board-view').hidden=next!=='3d';$('flat-board').hidden=next!=='2d';$('view-3d').setAttribute('aria-pressed',String(next==='3d'));$('view-2d').setAttribute('aria-pressed',String(next==='2d'));
 if(next==='3d'&&board){if(boardDirty&&boardPresentation){board.update(...boardPresentation);boardDirty=false;}board.resize();}
 positionCheckMarker();motionControls();
}
$('hand-toggle').onclick=()=>{handOpen=!handOpen;renderHand();if(handOpen)requestAnimationFrame(()=>$('hand-panel').scrollIntoView({block:'end'}));};
$('normal-mode').onclick=()=>selectCard(null);
$('exchange-card').onclick=()=>{
 if(exchangesUsed>=1||slot===null||usePower||animating||thinking||(!hotseat&&state.turn!==human)||outcome(state).over)return;
 const next=exchangeCard(state,slot);if(next===state)return;
 cancelPresentation();exchangesUsed=1;state=next;slot=null;usePower=true;selected=null;moves=[];pendingFreeze=null;if(matchMedia('(max-width:600px)').matches)handOpen=true;
 save();sound.play('draw');render();
};
$('view-3d').onclick=()=>setView('3d');$('view-2d').onclick=()=>setView('2d');$('flip-button').onclick=()=>{flipped=!flipped;board?.flip(flipped);render();};
$('undo-button').onclick=()=>{if(rewindsUsed>=3||!rewindReady)return;let index=snapshots.length-1;if(!hotseat)while(index>=0&&snapshots[index].turn!==human)index--;if(index<0)return;cancelPresentation();stopCPU();state=snapshots[index];snapshots=snapshots.slice(0,index);journal=journal.slice(0,index);rewindsUsed++;rewindReady=false;resetSelection();save();render();sound.play('rewind');effects.rewind($('board-view').closest('.board-shell').getBoundingClientRect(),3-rewindsUsed);};
$('difficulty').onchange=()=>{save();if(!hotseat&&state.turn!==human&&!outcome(state).over)startCPU();};
$('mobile-difficulty').onchange=()=>{$('difficulty').value=$('mobile-difficulty').value;$('difficulty').onchange();};
function startMatch({mode='cards',side='w',level:nextLevel=null,hs=false,seed=undefined,daily=false}={}){
 cancelPresentation();stopCPU();
 const nextSide=hs?'w':(side||human),lv=nextLevel||$('difficulty').value||'2';
 state=initialState(mode,seed);human=nextSide;hotseat=!!hs;
 $('difficulty').value=lv;$('mobile-difficulty').value=lv;
 snapshots=[];journal=[];rewindsUsed=0;rewindReady=true;exchangesUsed=0;hintsUsed=0;resultShown=false;resultRecorded=false;dailyMode=!!daily;
 resetSelection();handOpen=false;flipped=nextSide==='b'&&!hs;board?.flip(flipped);
 document.body.dataset.hotseat=String(hotseat);
 $('cpu-caption').textContent=hotseat?'PASS & PLAY':'CARD-AWARE CPU';
 $('bottom-name').textContent=hotseat?'White':'You';$('opponent-name').textContent=hotseat?'Black':'The Automaton';
 $('new-dialog').close();$('save-notice').hidden=true;
 save();render();if(!hotseat)startCPU();dealHand();
}
$('new-button').onclick=()=>{$('side').value=human;$('new-form').elements.mode.value=state.mode;$('hotseat-option').checked=hotseat;$('side').disabled=hotseat;renderDaily();$('new-dialog').showModal();};
$('hotseat-option').onchange=()=>{$('side').disabled=$('hotseat-option').checked;};
$('new-form').onsubmit=e=>{e.preventDefault();const data=new FormData(e.target);startMatch({mode:data.get('mode'),side:data.get('side'),hs:data.get('hotseat')==='on',level:$('difficulty').value});};
$('guide-button').onclick=()=>$('guide-dialog').showModal();
$('replay-coach').onclick=()=>{$('guide-dialog').close();coachStep(0);};$('library-button').onclick=()=>$('library-dialog').showModal();
for(const button of document.querySelectorAll('.close-dialog'))button.onclick=()=>button.closest('dialog').close();
function veilExample(){return `<div class="veil-example" aria-label="Example: rook a1 jumps pawn a3 to capture an enemy knight on a6. The pawn stays on a3."><div class="veil-diagram" aria-hidden="true"><span><img class="veil-piece" src="${pixelUrl('r','w')}" alt=""><small>Your rook<br>a1</small></span><b>→</b><span><img class="veil-piece" src="${pixelUrl('p','w')}" alt=""><small>Blocker<br>a3 · stays</small></span><b>→</b><span><img class="veil-piece" src="${pixelUrl('n','b')}" alt=""><small>Enemy<br>a6 · captured</small></span></div><p>Your rook lands on a6. The pawn on a3 stays. All other squares between them must be empty.</p></div>`;}
function renderLibrary(){
 const family=$('family-filter').value,tier=$('tier-filter').value;
 const ids=CARD_IDS.filter(id=>(!family||CARDS[id].family===family)&&(!tier||String(CARDS[id].tier)===tier));
 $('library-count').textContent=`${ids.length} of ${CARD_IDS.length} spells`;
 $('library-empty').hidden=ids.length>0;
 $('card-library').innerHTML=ids.map(id=>{const c=CARDS[id];return `<article class="library-card" data-card="${id}" data-tier="${c.tier}"><div class="library-family">${familyBadge(c)}<small>${c.kind} · ${POWER_TIERS[c.tier].copies} ${POWER_TIERS[c.tier].copies===1?'copy':'copies'} / deck</small></div><img class="library-art" src="${cardArt(id,960)}" alt="" width="960" height="640" loading="lazy"><span aria-hidden="true">${c.icon}</span><h3>${c.name}</h3><div class="library-rating">${tierBadge(c)}</div><p>${c.text}</p>${id==='pierce'?veilExample():''}</article>`;}).join('');
}
$('card-legend').innerHTML=`<summary>Card families & power tiers</summary><div class="family-key">${Object.entries(FAMILIES).map(([id,f])=>`<div>${familyBadge({family:id})}<span>${f.text}</span></div>`).join('')}</div><div class="tier-key"><b>Frame color = power tier</b>${Object.keys(POWER_TIERS).map(tier=>tierBadge({tier})).join('')}</div><p>Silver = Standard · Blue = Powerful · Gold = Exceptional. Tiers rate a spell’s general potential, not the best move in every position. The deck has one copy of each of the 18 cards. Frame colors show power, not rarity; no card can appear twice in your hand.</p>`;
$('family-filter').innerHTML='<option value="">All families</option>'+Object.entries(FAMILIES).map(([id,f])=>`<option value="${id}">${f.name}</option>`).join('');
$('tier-filter').innerHTML='<option value="">All power tiers</option>'+Object.entries(POWER_TIERS).map(([id,t])=>`<option value="${id}">${t.stars} ${t.name}</option>`).join('');
$('family-filter').onchange=renderLibrary;$('tier-filter').onchange=renderLibrary;
$('reset-filters').onclick=()=>{$('family-filter').value='';$('tier-filter').value='';renderLibrary();};
$('card-key-button').onclick=()=>{$('library-dialog').showModal();$('card-legend').open=true;$('card-legend').scrollIntoView({block:'nearest'});};
renderLibrary();
render();startCPU();if(!resumed)dealHand();
try{if(!localStorage.getItem('herochess-coach-v1'))setTimeout(()=>coachStep(0),900);}catch{}

setupInstall();
const controller=new Controller({
 flipped:()=>flipped,select:selectSquare,unlock:()=>sound.unlock(),
 cancel:()=>{if(animating)return;if(cpuSlot!==null){cpuSlot=null;cpuPiece=null;}else if(slot!==null){selectCard(null);return;}else{selected=null;moves=[];inspectedSquare=null;}render();},
 point:square=>{if(view==='3d'&&board)return board.screenPoint(square);const r=$('flat-board').querySelector(`[data-square="${square}"]`)?.getBoundingClientRect();return r?{x:r.left+r.width/2,y:r.top+r.height/2}:null;}
});
