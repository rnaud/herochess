import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,legalMoves,applyMove,outcome,inCheck} from '../src/engine.js';
import {reviewPositions,reviewMaterial} from '../src/review.js';
import {threatData,threatSummary} from '../src/radar.js';
import {TRIALS,buildTrialState} from '../src/trials.js';
import {trophyList} from '../src/stats.js';

test('review positions include the start, every action and the final position',()=>{
 const start=initialState('cards',7),after=applyMove(start,{from:12,to:28},false);
 const steps=reviewPositions([start],after,['e2–e4']);
 assert.equal(steps.length,2);
 assert.equal(steps[0].label,'Start');
 assert.equal(steps[1].label,'e2–e4');
 assert.equal(steps[1].final,true);
 assert.equal(steps[0].final,false);
 assert.deepEqual(reviewMaterial(start),reviewMaterial(after));
 assert.equal(reviewPositions([],after,[]).length,1);
});
test('threat radar finds controlled squares, danger and pins',()=>{
 const state=initialState('cards',11),data=threatData(state);
 assert.ok(data.squares.size>0);
 assert.equal(data.own.size,0);
 assert.match(threatSummary(data),/No piece under threat/);
 const board=Array(64).fill(null);
 board[0]={type:'k',color:'w'};board[7]={type:'k',color:'b'};
 board[8]={type:'r',color:'b'};board[9]={type:'q',color:'w'};
 const position={...state,board,turn:'w',shield:null,freeze:null};
 const danger=threatData(position);
 assert.ok(danger.own.has(9));
 assert.ok(danger.pressure>=9);
 assert.match(threatSummary(danger),/under threat/);
});
test('all six trials are legal card-only mates',()=>{
 assert.equal(TRIALS.length,6);
 for(const trial of TRIALS){
  const state=buildTrialState(trial);
  assert.equal(inCheck(state,'b'),false,`${trial.id}: black starts in check`);
  assert.equal(inCheck(state,'w'),false,`${trial.id}: white starts in check`);
  const moves=legalMoves(state);
  const normal=moves.filter(m=>!m.usePower&&outcome(applyMove(state,m,false)).reason==='Checkmate');
  const card=moves.filter(m=>m.usePower&&m.card===trial.card&&outcome(applyMove(state,m,false)).reason==='Checkmate');
  assert.equal(normal.length,0,`${trial.id}: an ordinary mate exists`);
  assert.ok(card.length>0,`${trial.id}: no ${trial.card} mate`);
 }
});
test('trophies unlock from career milestones',()=>{
 const earned={wins:2,bestStreak:3,games:10,cards:{a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10},daily:{streak:3},checkmates:1,flawlessWins:1};
 assert.equal(trophyList(earned).filter(t=>t.ok).length,7);
 const fresh={wins:0,bestStreak:0,games:0,cards:{},daily:{streak:0},checkmates:0,flawlessWins:0};
 assert.equal(trophyList(fresh).filter(t=>t.ok).length,0);
});
