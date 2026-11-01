import { PIECES, legalMoves, applyMove, inCheck, outcome, isAttacked, opposite } from './engine.js';
export function evaluate(state) {
 let score=0;
 const nonPawns=state.board.filter(p=>p&&p.type!=='p'&&p.type!=='k').length;
 for(let i=0;i<64;i++) {
  const p=state.board[i];if(!p)continue;
  const x=i%8,y=p.color==='w'?i>>3:7-(i>>3),center=7-Math.abs(3.5-x)-Math.abs(3.5-y);
  let value=PIECES[p.type].value;
  if(p.type==='p')value+=y*9+center*3+(y>=5?(y-4)*25:0);
  else if(p.type==='k')value+=nonPawns<=4?center*12:y<2?(Math.abs(3.5-x)>1.5?24:0):-center*8;
  else value+=center*(['n','h','o','b'].includes(p.type)?12:4);
  // A temporary shield buys a tempo, not permanent immunity.
  if(state.shield?.square===i&&isAttacked(state,i,opposite(p.color)))value+=Math.min(value*.12,85);
  score+=p.color===state.turn?value:-value;
 }
 score+=(state.powers?.[state.turn]?25:0)-(state.powers?.[opposite(state.turn)]?25:0);
 return score;
}
const sameMove=(a,b)=>a&&b&&a.from===b.from&&a.to===b.to&&a.special===b.special&&a.promotion===b.promotion;
function priority(s,m){
 if(m.special==='shield')return isAttacked(s,m.from,opposite(s.turn))?PIECES[s.board[m.from].type].value: -100;
 return (s.board[m.to]?10*PIECES[s.board[m.to].type].value-PIECES[s.board[m.from].type].value:0)+(m.promotion?900:0)+(m.special==='ep'?100:0);
}
export function chooseMove(state,{maxDepth=3,timeMs=1600,quiescence=true}={}) {
 const start=performance.now();let nodes=0,qnodes=0,completedDepth=0;
 const rootMoves=legalMoves(state);if(!rootMoves.length||outcome(state,rootMoves).over)return {move:null,nodes,depth:0,qnodes};
 rootMoves.sort((a,b)=>priority(state,b)-priority(state,a));let best=rootMoves[0];
 const timeout={},killers=new Map();
 function tick(){if((++nodes&31)===0&&performance.now()-start>timeMs)throw timeout;}
 function quiet(s,alpha,beta,ply,qdepth,moves,end){
  tick();qnodes++;
  moves??=legalMoves(s);end??=outcome(s,moves);
  if(end.over)return end.winner?-100000+ply:0;
  const checked=inCheck(s);
  // Bound pathological checking sequences, while normally searching all evasions.
  if(qdepth>=8)return evaluate(s)-(checked?80:0);
  if(!checked){const stand=evaluate(s);if(stand>=beta)return stand;alpha=Math.max(alpha,stand);}
  const tactical=checked?moves:moves.filter(m=>m.promotion||m.special==='ep'||(m.special==='shield'?qdepth<2&&isAttacked(s,m.from,opposite(s.turn)):s.board[m.to]));
  tactical.sort((a,b)=>priority(s,b)-priority(s,a));
  for(const m of tactical){const value=-quiet(applyMove(s,m),-beta,-alpha,ply+1,qdepth+1);if(value>=beta)return value;alpha=Math.max(alpha,value);}
  return alpha;
 }
 function search(s,depth,alpha,beta,ply) {
  tick();const moves=legalMoves(s),end=outcome(s,moves);
  if(end.over)return end.winner?-100000+ply:0;
  if(depth<=0)return quiescence?quiet(s,alpha,beta,ply,0,moves,end):evaluate(s);
  moves.sort((a,b)=>priority(s,b)+(sameMove(b,killers.get(ply))?700:0)-priority(s,a)-(sameMove(a,killers.get(ply))?700:0));
  let score=-Infinity;
  for(const m of moves){const value=-search(applyMove(s,m),depth-1,-beta,-alpha,ply+1);score=Math.max(score,value);alpha=Math.max(alpha,value);if(alpha>=beta){if(!s.board[m.to])killers.set(ply,m);break;}}
  return score;
 }
 for(let depth=1;depth<=maxDepth;depth++) {
  try {
   let candidate=best,alpha=-Infinity;
   rootMoves.sort((a,b)=>(sameMove(b,best)?1:0)-(sameMove(a,best)?1:0)||priority(state,b)-priority(state,a));
   for(const m of rootMoves){const score=-search(applyMove(state,m),depth-1,-Infinity,-alpha,1);if(score>alpha){alpha=score;candidate=m;}}
   best=candidate;completedDepth=depth;
  }catch(e){if(e!==timeout)throw e;break;}
 }
 return {move:best,nodes,depth:completedDepth,qnodes};
}
