import {PIECES,inCheck,isAttacked,opposite} from './engine.js';

export function threatData(state){
 const enemy=opposite(state.turn),squares=new Set(),own=new Set(),pinned=new Set();
 for(let square=0;square<64;square++)if(isAttacked(state,square,enemy))squares.add(square);
 let pressure=0;
 for(let square=0;square<64;square++){
  const piece=state.board[square];if(!piece||piece.color!==state.turn)continue;
  if(squares.has(square)){own.add(square);if(piece.type!=='k')pressure+=Math.round((PIECES[piece.type]?.value||0)/100);}
  if(piece.type!=='k'&&!inCheck(state,state.turn)){
   const board=state.board.slice();board[square]=null;if(inCheck({...state,board},state.turn))pinned.add(square);
  }
 }
 const king=state.board.findIndex(p=>p?.type==='k'&&p.color===state.turn);
 return {squares,own,pinned,pressure,kingThreat:king>=0&&squares.has(king),count:own.size};
}
export function threatSummary(data){
 if(!data)return '';
 if(data.kingThreat)return `King in danger · ${data.count} piece${data.count===1?'':'s'} under threat`;
 if(data.count===0)return `No piece under threat · ${data.squares.size} squares controlled`;
 return `${data.count} piece${data.count===1?'':'s'} under threat${data.pressure?` · ${data.pressure} points at risk`:''}${data.pinned.size?` · ${data.pinned.size} pinned`:''}`;
}
