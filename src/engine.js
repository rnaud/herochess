import {CARDS,deal,cycleCard} from './cards.js';
// Pure rules shared by the interface and CPU. a1 = 0, h8 = 63.
const ORTH = [[1,0],[-1,0],[0,1],[0,-1]];
const DIAG = [[1,1],[1,-1],[-1,1],[-1,-1]];
const KNIGHT = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
export const PIECES = {
 p: {name:'Pawn', value:100}, n: {name:'Knight',value:320,steps:KNIGHT},
 b: {name:'Bishop',value:335,rays:DIAG}, r: {name:'Rook',value:500,rays:ORTH},
 q: {name:'Queen',value:950,rays:[...ORTH,...DIAG]}, k: {name:'King',value:20000,steps:[...ORTH,...DIAG]},

};
export const opposite = c => c === 'w' ? 'b' : 'w';
export const squareName = i => 'abcdefgh'[i%8] + (1+Math.floor(i/8));
export const squareIndex = s => 'abcdefgh'.indexOf(s[0]) + (Number(s[1])-1)*8;
export function initialState(mode='cards',seed=Math.floor(Math.random()*0xffffffff)) {
 const board=Array(64).fill(null),back=['r','n','b','q','k','b','n','r'];
 for(let x=0;x<8;x++){board[x]={type:back[x],color:'w'};board[x+8]={type:'p',color:'w'};board[x+48]={type:'p',color:'b'};board[x+56]={type:back[x],color:'b'};}
 const s={board,turn:'w',rights:'KQkq',ep:null,halfmove:0,fullmove:1,mode,shield:null,freeze:null,history:[],...deal(seed)};s.history=[positionKey(s)];return s;
}
function targets(state,from,attacks=false) {
 const piece=state.board[from]; if(!piece)return [];
 const def=PIECES[piece.type], x=from%8,y=from>>3,result=[];
 const add=(dx,dy,ray=false)=>{
  for(let n=1;n<= (ray?7:1);n++){
   const nx=x+dx*n,ny=y+dy*n; if(nx<0||nx>7||ny<0||ny>7)break;
   const to=ny*8+nx,other=state.board[to];
   if(attacks || !other || other.color!==piece.color) result.push(to);
   if(other)break;
  }
 };
 if(piece.type==='p') {
  const dir=piece.color==='w'?1:-1;
  for(const dx of [-1,1]){const nx=x+dx,ny=y+dir;if(nx>=0&&nx<8&&ny>=0&&ny<8){const to=ny*8+nx;if(attacks || (state.board[to]&&state.board[to].color!==piece.color) || (to===state.ep && state.board[to-dir*8]?.type==='p' && state.board[to-dir*8]?.color!==piece.color))result.push(to);}}
  if(!attacks&&y+dir>=0&&y+dir<8&&!state.board[from+dir*8]){result.push(from+dir*8); if(y===(piece.color==='w'?1:6)&&!state.board[from+dir*16])result.push(from+dir*16);}
 } else { for(const d of def.steps||[])add(...d);for(const d of def.rays||[])add(...d,true); }
 return result;
}
export function isAttacked(state,square,byColor) {
 for(let i=0;i<64;i++) if(state.board[i]?.color===byColor && targets(state,i,true).includes(square))return true;
 return false;
}
export function inCheck(state,color=state.turn) {
 const king=state.board.findIndex(p=>p?.type==='k'&&p.color===color);
 return king<0 || isAttacked(state,king,opposite(color));
}
function pseudoMoves(state) {
 const moves=[];
 for(let from=0;from<64;from++) {
  const p=state.board[from]; if(!p||p.color!==state.turn||state.freeze?.square===from)continue;
  for(const to of targets(state,from)){
   if(state.board[to]?.type==='k'||state.shield?.square===to)continue;
   if(p.type==='p'&&to===state.ep&&state.shield?.square===to+(p.color==='w'?-8:8))continue;
   const special=p.type==='p'&&to===state.ep&&!state.board[to]?'ep':null;
   if(p.type==='p'&&(to<8||to>=56))for(const promotion of ['q','r','b','n'])moves.push({from,to,promotion,special});
   else moves.push({from,to,special});
  }
  const home=p.color==='w'?4:60;
  if(p.type==='k'&&from===home&&!inCheck(state)){
   for(const [right,rook,empty,to] of p.color==='w'?[['K',7,[5,6],6],['Q',0,[3,2,1],2]]:[['k',63,[61,62],62],['q',56,[59,58,57],58]]){
    const rp=state.board[rook];
    if(!state.rights.includes(right)||!rp||rp.color!==p.color||rp.type!=='r'||state.freeze?.square===rook||empty.some(i=>state.board[i]))continue;
    // Vacate the king's origin when checking the transit square.
    const transit=applyMove(state,{from,to:from+(to>from?1:-1)},false);
    if(!inCheck(transit,p.color))moves.push({from,to,special:'castle'});
   }
  }
 }
 return moves;
}
function cardMoves(state,id){
 const card=CARDS[id],result=[];
 for(let from=0;from<64;from++){
  const p=state.board[from];if(!p||p.type==='k')continue;
  if(card.effect==='freeze'){if(p.color!==state.turn)result.push({from,to:from,special:'freeze'});continue;}
  if(p.color!==state.turn||(card.pawn&&p.type!=='p'))continue;
  if(card.effect==='shield'){result.push({from,to:from,special:'shield'});continue;}
  if(state.freeze?.square===from)continue;
  const x=from%8,y=from>>3,dir=p.color==='w'?1:-1;
  const add=(nx,ny)=>{
   if(nx<0||nx>7||ny<0||ny>7)return;const to=ny*8+nx,q=state.board[to];if(to===from)return;
   if(card.swap){if(!q||q.color!==p.color||q.type==='k'||state.freeze?.square===to||(p.type==='p'&&(ny===0||ny===7))||(q.type==='p'&&(y===0||y===7)))return;result.push({from,to,special:'swap'});return;}
   if(q?.color===p.color||q?.type==='k'||state.shield?.square===to||(card.empty&&q)||(card.lunge&&!q))return;
   if(p.type==='p'&&ny===(p.color==='w'?7:0))for(const promotion of ['q','r','b','n'])result.push({from,to,promotion,special:null});
   else result.push({from,to,special:null});
  };
  if(card.pierce){const rays=PIECES[p.type].rays;if(!rays)continue;for(const [dx,dy] of rays){let blockers=0;for(let n=1;n<8;n++){const nx=x+dx*n,ny=y+dy*n;if(nx<0||nx>7||ny<0||ny>7)break;const target=state.board[ny*8+nx];if(target){if(blockers===1){if(target.color!==p.color)add(nx,ny);break;}blockers++;}}}continue;}
  if(card.swap){for(const [dx,dy] of [...ORTH,...DIAG])add(x+dx,y+dy);continue;}
  if(card.recall){for(let nx=0;nx<8;nx++)add(nx,p.color==='w'?0:7);continue;}
  if(card.teleport){for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)add(x+dx,y+dy);continue;}
  if(card.lunge){add(x,y+dir);continue;}
  for(const [dx,dy] of card.steps||[])add(x+dx,y+dy);
  const rays=card.charge?[[0,dir]]:card.retreat?[[0,-dir]]:card.rays||[];
  for(const [dx,dy] of rays)for(let n=1;n<=(card.range||3);n++){const nx=x+dx*n,ny=y+dy*n;if(nx<0||nx>7||ny<0||ny>7)break;if(n>=(card.minRange||1))add(nx,ny);if(!card.jump&&state.board[ny*8+nx])break;}
 }
 return result;
}
export function legalMoves(state,from=null,choice=null){
 let candidates=[];
 if(state.mode!=='cards')candidates=pseudoMoves(state);
 else {
  if(!choice||!choice.usePower)candidates=pseudoMoves(state).map(m=>({...m,usePower:false}));
  const slots=choice?[choice.slot]:state.hands[state.turn].map((_,i)=>i);
  for(const slot of slots){const card=state.hands[state.turn][slot];if(!card)continue;
   if(!choice||choice.usePower)candidates.push(...cardMoves(state,card).map(m=>({...m,slot,card,usePower:true})));
  }
  // Search never predicts future draws; after known cards run out, use ordinary moves.
  if(state.simulation&&!slots.length)candidates=pseudoMoves(state);
 }
 return candidates.filter(m=>(from===null||m.from===from)&&!inCheck(applyMove(state,m,false),state.turn));
}
export function applyMove(state,move,record=true){
 const board=state.board.slice(),p=board[move.from];if(!p)throw new Error('No piece at origin');
 const effect=['shield','freeze'].includes(move.special),swap=move.special==='swap';
 const captured=effect||swap?null:board[move.to];
 let rights=state.rights;
 if(!effect){
  board[move.to]={...p,type:move.promotion||p.type};board[move.from]=swap?state.board[move.to]:null;
  if(move.special==='ep')board[move.to+(p.color==='w'?-8:8)]=null;
  if(move.special==='castle'){const rookFrom=move.to>move.from?move.from+3:move.from-4,rookTo=move.to>move.from?move.from+1:move.from-1;board[rookTo]=board[rookFrom];board[rookFrom]=null;}
  if(p.type==='k')rights=rights.replace(p.color==='w'?/[KQ]/g:/[kq]/g,'');
  for(const [square,right] of [[0,'Q'],[7,'K'],[56,'q'],[63,'k']])if(move.from===square||move.to===square)rights=rights.replace(right,'');
 }
 const cycled=record&&move.usePower?cycleCard(state,move.slot):state;
 const doublePawn=!effect&&!swap&&p.type==='p'&&move.to%8===move.from%8&&Math.abs(move.to-move.from)===16&&(!move.usePower||move.card==='charge');
 const next={...cycled,board,turn:opposite(state.turn),rights,ep:doublePawn?(move.to+move.from)/2:null,
  shield:move.special==='shield'?{square:move.from,color:state.turn}:null,
  freeze:move.special==='freeze'?{square:move.from,color:p.color}:null,
  halfmove:(!effect&&p.type==='p')||captured||move.special==='ep'?0:state.halfmove+1,
  fullmove:state.fullmove+(state.turn==='b'?1:0),lastMove:move};
 if(record)next.history=[...state.history,positionKey(next)];return next;
}
export function positionKey(state) {
 // An en-passant target matters for repetition only if a legal capture exists.
 const ep=state.ep!==null && legalMovesForEp(state) ? state.ep : '-';
 return state.board.map(p=>p?p.color+p.type:'.').join('')+state.turn+state.rights+ep+`|${state.shield?.square??'-'}|${state.freeze?.square??'-'}|${state.mode==='cards'?JSON.stringify([state.hands,state.deck,state.discard,state.rng]):''}`;
}
function legalMovesForEp(state){
 for(let i=0;i<64;i++)if(state.freeze?.square!==i&&state.shield?.square!==state.ep+(state.turn==='w'?-8:8)&&state.board[i]?.color===state.turn&&state.board[i].type==='p'&&targets(state,i).includes(state.ep)){
  if(!inCheck(applyMove(state,{from:i,to:state.ep,special:'ep'},false),state.turn))return true;
 }
 return false;
}
export function outcome(state,moves=legalMoves(state)) {
 if(!moves.length)return inCheck(state)?{over:true,winner:opposite(state.turn),reason:'Checkmate'}:{over:true,winner:null,reason:'Stalemate'};
 if(state.halfmove>=100)return {over:true,winner:null,reason:'50-move draw'};
 const key=positionKey(state);
 if(state.history.filter(k=>k===key).length>=3)return {over:true,winner:null,reason:'Threefold repetition'};
 const material=state.board.map((p,i)=>({...p,square:i})).filter(p=>p.type&&p.type!=='k');
 if(!material.length || (state.mode!=='cards'&&( (material.length===1&&['b','n'].includes(material[0].type)) || (material.length>0&&material.every(p=>p.type==='b')&&new Set(material.map(p=>(p.square%8+(p.square>>3))%2)).size===1))))return {over:true,winner:null,reason:'Insufficient material'};
 return {over:false,winner:null,reason:inCheck(state)?'Check':null};
}
export function moveLabel(state,move){
 const prefix=state.mode==='cards'&&move.usePower?`${CARDS[move.card].name} · `:'';
 if(move.special==='shield')return prefix+'shield '+squareName(move.from);
 if(move.special==='freeze')return prefix+'freeze '+squareName(move.from);
 if(move.special==='castle')return prefix+(move.to>move.from?'O-O':'O-O-O');
 return prefix+squareName(move.from)+(move.special==='swap'?'↔':state.board[move.to]||move.special==='ep'?'×':'–')+squareName(move.to)+(move.promotion?'='+move.promotion.toUpperCase():'');
}
