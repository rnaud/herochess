import {legalMoves,opposite} from './engine.js';

// Inspect the unchanged position as if the opponent were to play next.
// Effects and en passant belonging to the current human turn expire first.
export function opponentPreview(state,human,slot,from=null){
 const cpu=opposite(human),position=state.turn===cpu?state:{...state,turn:cpu,ep:null,shield:null,freeze:null};
 return legalMoves(position,from,{slot,usePower:true});
}
