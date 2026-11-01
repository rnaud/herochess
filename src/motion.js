// One clock for board travel, impact effects, and sound in both views.
export function actionTiming(state,move){
 const stationary=['shield','freeze'].includes(move.special);
 const capture=!stationary&&move.special!=='swap'&&!!(state.board[move.to]||move.special==='ep');
 const anticipation=move.usePower?180:0,travel=stationary?0:440;
 return {anticipation,travel,impact:anticipation+travel,capture,duration:anticipation+travel+(capture?300:stationary?550:100)};
}
