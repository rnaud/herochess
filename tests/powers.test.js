import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,legalMoves,applyMove,inCheck,positionKey,restoreState,squareIndex as sq} from '../src/engine.js';
import {chooseMove} from '../src/ai.js';
import {LESSONS,lessonState,solvesLesson} from '../src/tutorials.js';
function position(pieces,turn='w',extras={}){const s={...initialState(),board:Array(64).fill(null),rights:'',turn,...extras};for(const [square,p] of Object.entries(pieces))s.board[sq(square)]={color:p[0],type:p[1]};s.history=[positionKey(s)];return s;}
const shield=(s,square)=>legalMoves(s).find(m=>m.from===sq(square)&&m.special==='shield');
test('Aegis spends a turn and charge, prevents capture, and expires after the reply',()=>{
 const s=position({a1:'wk',h8:'bk',d4:'wq',d8:'br'});const next=applyMove(s,shield(s,'d4'));
 assert.equal(next.turn,'b');assert.equal(next.board[sq('d4')].type,'q');assert.equal(next.powers.w,false);assert.equal(s.powers.w,true);
 assert.ok(!legalMoves(next).some(m=>m.to===sq('d4')));
 const reply=legalMoves(next).find(m=>m.from===sq('h8'));const after=applyMove(next,reply);assert.equal(after.shield,null);assert.equal(shield(after,'d4'),undefined);
 assert.notEqual(positionKey(s),positionKey({...s,powers:{w:false,b:true}}));assert.notEqual(positionKey(next),positionKey({...next,shield:null}));
});
test('Aegis cannot target kings, be used in check, or appear in classic chess',()=>{
 const s=position({a1:'wk',h8:'bk',d4:'wq'});assert.equal(shield(s,'a1'),undefined);
 const checked=position({a1:'wk',h8:'bk',a8:'br',d4:'wq'});assert.equal(inCheck(checked),true);assert.ok(!legalMoves(checked).some(m=>m.special==='shield'));
 assert.ok(!legalMoves(initialState('classic')).some(m=>m.special==='shield'));
});
test('shielded pieces still block rays and give check',()=>{
 const s=position({a1:'wk',h8:'bk',a4:'wq',a8:'br'});const next=applyMove(s,shield(s,'a4'));
 assert.ok(!legalMoves(next).some(m=>m.from===sq('a8')&&m.to===sq('a3')));
 assert.equal(inCheck(position({a1:'wk',h8:'bk',h4:'wq'},'b',{shield:{square:sq('h4'),color:'w'}})),true);
});
test('shield blocks en passant and using it forfeits an en passant opportunity',()=>{
 const s=position({a1:'wk',h8:'bk',e5:'wp',d5:'bp'},'w',{ep:sq('d6'),shield:{square:sq('d5'),color:'b'}});
 assert.ok(!legalMoves(s).some(m=>m.special==='ep'));
 const next=applyMove({...s,shield:null},shield({...s,shield:null},'e5'));assert.equal(next.ep,null);
});
test('tutorial solutions are legal and preserve their blockers',()=>{
 for(let i=0;i<LESSONS.length;i++){const s=lessonState(i),move=legalMoves(s).find(m=>solvesLesson(i,m));assert.ok(move,LESSONS[i].name);assert.ok(s.board[move.to]);const after=applyMove(s,move);assert.equal(after.board[move.to].type,LESSONS[i].hero);assert.ok(!legalMoves(s).some(m=>m.special==='shield'));if(i===2)assert.equal(after.board[sq('d4')].type,'p');}
});
test('tactical search rejects a poisoned pawn that a shallow static search captures',()=>{
 const s=position({a1:'wk',h8:'bk',d4:'wq',d5:'bp',d8:'br'},'w',{powers:{w:false,b:false}});
 const shallow=chooseMove(s,{maxDepth:1,timeMs:3000,quiescence:false});const tactical=chooseMove(s,{maxDepth:1,timeMs:3000});
 assert.equal(shallow.move.to,sq('d5'));assert.notEqual(tactical.move.to,sq('d5'));assert.ok(tactical.qnodes>0);
});
test('CPU treats shielded victims as uncapturable and includes active powers in search',()=>{
 const s=position({a1:'wk',h8:'bk',d4:'wq',d8:'br'},'b',{shield:{square:sq('d4'),color:'w'},powers:{w:false,b:true}});
 const result=chooseMove(s,{maxDepth:2,timeMs:1500});assert.notEqual(result.move.to,sq('d4'));assert.ok(legalMoves(s).some(m=>JSON.stringify(m)===JSON.stringify(result.move)));
});
test('CPU can spend Aegis when a shield is its only legal turn',()=>{
 const s=position({a1:'wk',a2:'wp',a3:'bp',b8:'br',c2:'bk'});
 const moves=legalMoves(s);assert.ok(moves.length>0);assert.ok(moves.every(m=>m.special==='shield'));
 const result=chooseMove(s,{maxDepth:3,timeMs:1500});assert.equal(result.move.special,'shield');assert.equal(result.move.from,sq('a2'));
});
test('legacy saves retain their repetition history without gaining a new charge',()=>{
 const s=initialState();delete s.powers;delete s.shield;const oldKey=positionKey(s).split('|')[0];s.history=[oldKey,oldKey,oldKey];
 const restored=restoreState(s);assert.deepEqual(restored.powers,{w:false,b:false});assert.equal(restored.history.filter(k=>k===positionKey(restored)).length,3);
});
