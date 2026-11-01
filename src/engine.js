// Pure rules shared by the interface and CPU. a1 = 0, h8 = 63.
const ORTH = [[1,0],[-1,0],[0,1],[0,-1]];
const DIAG = [[1,1],[1,-1],[-1,1],[-1,-1]];
const KNIGHT = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
export const PIECES = {
 p: {name:'Pawn', value:100}, n: {name:'Knight',value:320,steps:KNIGHT},
 b: {name:'Bishop',value:335,rays:DIAG}, r: {name:'Rook',value:500,rays:ORTH},
 q: {name:'Queen',value:950,rays:[...ORTH,...DIAG]}, k: {name:'King',value:20000,steps:[...ORTH,...DIAG]},
 h: {name:'Double Knight',title:'Far leap',value:620,base:'n',steps:[...KNIGHT,[2,3],[3,2],[-2,3],[-3,2],[2,-3],[3,-2],[-2,-3],[-3,-2]],description:'A knight with a longer reach. Also leaps 3 squares in one direction and 2 across. Every leap ignores intervening pieces.'},
 o: {name:'Oracle',title:'Phase step',value:750,base:'b',rays:DIAG,steps:KNIGHT,description:'A bishop that sees another path. Slides diagonally or leaps like a knight, even through a crowded board.'},
 s: {name:'Bastion',title:'Rift jump',value:650,base:'r',rays:ORTH,steps:DIAG.map(([x,y])=>[x*2,y*2]),description:'A rook with an unexpected angle. Also jumps exactly 2 squares diagonally, ignoring the square between.'},
};
export const opposite = c => c === 'w' ? 'b' : 'w';
export const squareName = i => 'abcdefgh'[i%8] + (1+Math.floor(i/8));
export const squareIndex = s => 'abcdefgh'.indexOf(s[0]) + (Number(s[1])-1)*8;
export function initialState(mode='heroes') {
 const board=Array(64).fill(null), back=mode==='heroes'?['s','h','o','q','k','b','n','r']:['r','n','b','q','k','b','n','r'];
 for(let x=0;x<8;x++) { board[x]={type:back[x],color:'w'}; board[x+8]={type:'p',color:'w'}; board[x+48]={type:'p',color:'b'}; board[x+56]={type:back[x],color:'b'}; }
 const state={board,turn:'w',rights:'KQkq',ep:null,halfmove:0,fullmove:1,mode,history:[]};
 state.history=[positionKey(state)]; return state;
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
  const p=state.board[from]; if(!p||p.color!==state.turn)continue;
  for(const to of targets(state,from)){
   if(state.board[to]?.type==='k')continue;
   const special=p.type==='p'&&to===state.ep&&!state.board[to]?'ep':null;
   if(p.type==='p'&&(to<8||to>=56))for(const promotion of ['q','r','b','n'])moves.push({from,to,promotion,special});
   else moves.push({from,to,special});
  }
  const home=p.color==='w'?4:60;
  if(p.type==='k'&&from===home&&!inCheck(state)){
   for(const [right,rook,empty,to] of p.color==='w'?[['K',7,[5,6],6],['Q',0,[3,2,1],2]]:[['k',63,[61,62],62],['q',56,[59,58,57],58]]){
    const rp=state.board[rook];
    if(!state.rights.includes(right)||!rp||rp.color!==p.color||!['r','s'].includes(rp.type)||empty.some(i=>state.board[i]))continue;
    // Vacate the king's origin when checking the transit square.
    const transit=applyMove(state,{from,to:from+(to>from?1:-1)},false);
    if(!inCheck(transit,p.color))moves.push({from,to,special:'castle'});
   }
  }
 }
 return moves;
}
export function legalMoves(state,from=null) {
 return pseudoMoves(state).filter(m=>(from===null||m.from===from)&&!inCheck(applyMove(state,m,false),state.turn));
}
export function applyMove(state,move,record=true) {
 const board=state.board.slice(), p=board[move.from], captured=board[move.to];
 if(!p)throw new Error('No piece at origin');
 board[move.to]={...p,type:move.promotion||p.type};board[move.from]=null;
 if(move.special==='ep')board[move.to+(p.color==='w'?-8:8)]=null;
 if(move.special==='castle'){const rookFrom=move.to>move.from?move.from+3:move.from-4,rookTo=move.to>move.from?move.from+1:move.from-1;board[rookTo]=board[rookFrom];board[rookFrom]=null;}
 let rights=state.rights;
 if(p.type==='k')rights=rights.replace(p.color==='w'?/[KQ]/g:/[kq]/g,'');
 for(const [square,right] of [[0,'Q'],[7,'K'],[56,'q'],[63,'k']])if(move.from===square||move.to===square)rights=rights.replace(right,'');
 const next={...state,board,turn:opposite(state.turn),rights,ep:p.type==='p'&&Math.abs(move.to-move.from)===16?(move.to+move.from)/2:null,halfmove:p.type==='p'||captured||move.special==='ep'?0:state.halfmove+1,fullmove:state.fullmove+(state.turn==='b'?1:0),lastMove:move};
 if(record)next.history=[...state.history,positionKey(next)];
 return next;
}
export function positionKey(state) {
 // An en-passant target matters for repetition only if a legal capture exists.
 const ep=state.ep!==null && legalMovesForEp(state) ? state.ep : '-';
 return state.board.map(p=>p?p.color+p.type:'.').join('')+state.turn+state.rights+ep;
}
function legalMovesForEp(state){
 for(let i=0;i<64;i++)if(state.board[i]?.color===state.turn&&state.board[i].type==='p'&&targets(state,i).includes(state.ep)){
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
 if(!material.length || (material.length===1&&['b','n'].includes(material[0].type)) || (material.length>0&&material.every(p=>p.type==='b')&&new Set(material.map(p=>(p.square%8+(p.square>>3))%2)).size===1))return {over:true,winner:null,reason:'Insufficient material'};
 return {over:false,winner:null,reason:inCheck(state)?'Check':null};
}
export function moveLabel(state,move){
 const p=state.board[move.from];
 if(move.special==='castle')return move.to>move.from?'O-O':'O-O-O';
 const capture=state.board[move.to]||move.special==='ep';
 return `${p.type==='p'?'':p.type.toUpperCase()+' '}${squareName(move.from)}${capture?'×':'–'}${squareName(move.to)}${move.promotion?'='+move.promotion.toUpperCase():''}`;
}
