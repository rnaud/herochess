import test from 'node:test';import assert from 'node:assert/strict';
import {CARDS,CARD_IDS,POWER_TIERS,cycleCard} from '../src/cards.js';
import {initialState,legalMoves,applyMove,inCheck,outcome,positionKey,squareIndex as sq} from '../src/engine.js';
import {chooseMove} from '../src/ai.js';
function pos(card,pieces,extra={}){const s={...initialState('cards',123),board:Array(64).fill(null),rights:'',...extra};for(const [at,p] of Object.entries({a1:'wk',h8:'bk',...pieces}))s.board[sq(at)]=p?{color:p[0],type:p[1]}:null;s.hands={w:[card,'ward','frost'],b:['saddle','step','blink']};s.history=[positionKey(s)];return s;}
const power=(s,from,to)=>legalMoves(s,null,{slot:0,usePower:true}).find(m=>m.from===sq(from)&&m.to===sq(to));
const cases=[
 ['saddle',{d4:'wp',e5:'wp'},'d4','f5'],['comet',{b1:'wr',c2:'wp'},'b1','d4'],['rift',{c3:'wn',d4:'wp'},'c3','e5'],['vault',{c3:'wb',c4:'wp'},'c3','c5'],['prism',{c3:'wr'},'c3','f6'],['tower',{c3:'wb'},'c3','c6'],['crown',{c3:'wn'},'c3','e5'],['blink',{c3:'wp',d4:'bp'},'c3','e5'],['retreat',{d5:'wb'},'d5','d2'],['flank',{d4:'wp'},'d4','g4'],['charge',{d2:'wp'},'d2','d5'],['lunge',{d4:'wp',d5:'bq'},'d4','d5'],['step',{d4:'wr'},'d4','e5'],['relay',{c3:'wr',d4:'wb'},'c3','d4'],['recall',{d4:'wn'},'d4','b1'],['ward',{d4:'wq'},'d4','d4'],['frost',{d5:'bq'},'d5','d5'],['pierce',{c3:'wb',d4:'wp',f6:'bq'},'c3','f6']
];
for(const [id,pieces,from,to] of cases)test(`${CARDS[id].name}: legal effect, one card spent, three held`,()=>{const s=pos(id,pieces),before=JSON.stringify(s),m=power(s,from,to);assert.ok(m,id);const next=applyMove(s,m);assert.equal(next.hands.w.length,3);assert.equal(next.hands.b.length,3);assert.deepEqual(next.hands.w.slice(0,2),s.hands.w.slice(1));assert.equal(next.hands.w[2],s.deck[0]);assert.equal(next.discard.at(-1),id);assert.equal(JSON.stringify(s),before);if(!['ward','frost','relay'].includes(id))assert.equal(next.board[sq(to)].type,s.board[sq(from)].type);if(id==='relay'){assert.equal(next.board[sq(from)].type,'b');assert.equal(next.board[sq(to)].type,'r');}if(id==='pierce')assert.equal(next.board[sq('d4')].type,'p');});
test('exactly eighteen cards; seeded shuffle and repeated cycling conserve the deck',()=>{assert.equal(CARD_IDS.length,18);let s=initialState('cards',42);assert.deepEqual(s,initialState('cards',42));assert.notDeepEqual(s.hands,initialState('cards',43).hands);let reshuffled=false;for(let i=0;i<60;i++){const [from,to]=[['g1','f3'],['g8','f6'],['f3','g1'],['f6','g8']][i%4];const m=legalMoves(s,null,{slot:0,usePower:false}).find(m=>m.from===sq(from)&&m.to===sq(to));assert.ok(m);const before=s.deck.length;s=applyMove(cycleCard(s,0),m);if(before===0)reshuffled=true;assert.equal(s.hands.w.length,3);assert.equal(s.hands.b.length,3);const pool=[...s.hands.w,...s.hands.b,...s.deck,...s.discard];assert.equal(pool.length,40);for(const id of CARD_IDS)assert.equal(pool.filter(v=>v===id).length,POWER_TIERS[CARDS[id].tier].copies);}assert.ok(reshuffled);});
test('blocked slides, empty-only travel, capture-only lunge and pierce restrictions',()=>{assert.equal(power(pos('prism',{c3:'wr',d4:'wp'}),'c3','e5'),undefined);assert.equal(power(pos('blink',{c3:'wp',e5:'br'}),'c3','e5'),undefined);assert.equal(power(pos('lunge',{d4:'wp'}),'d4','d5'),undefined);assert.equal(power(pos('pierce',{c3:'wb',f6:'bq'}),'c3','f6'),undefined);assert.equal(power(pos('pierce',{c3:'wb',d4:'wp',e5:'wp',f6:'bq'}),'c3','f6'),undefined);});
test('cards never empower kings, capture kings or leave a king in check',()=>{for(const id of CARD_IDS){const s=pos(id,{e1:'wk',a1:null,e2:'wr',e8:'br'});s.board[0]=null;for(const m of legalMoves(s,null,{slot:0,usePower:true})){assert.notEqual(s.board[m.from].type,'k');assert.notEqual(s.board[m.to]?.type,'k');assert.equal(inCheck(applyMove(s,m),'w'),false);}}});
test('shield blocks captures and expires after one enemy action, including a hex',()=>{const s=pos('ward',{d4:'wq',d8:'br'}),next=applyMove(s,power(s,'d4','d4'));assert.ok(!legalMoves(next).some(m=>m.to===sq('d4')&&m.from!==m.to));const reply=legalMoves(next).find(m=>m.from===sq('h8'));assert.equal(applyMove(next,reply).shield,null);});
test('freeze stops moves and castling but still gives check and expires',()=>{const s=pos('frost',{d4:'br'}),next=applyMove(s,power(s,'d4','d4'));assert.ok(!legalMoves(next).some(m=>m.from===sq('d4')&&!['shield','freeze'].includes(m.special)));assert.equal(applyMove(next,legalMoves(next)[0]).freeze,null);const checked=pos('frost',{a1:'wk',a8:'br'});assert.equal(power(checked,'a8','a8'),undefined);const castle=pos('step',{e1:'wk',a1:null,h1:'wr'},{rights:'K',freeze:{square:sq('h1'),color:'w'}});castle.board[0]=null;assert.ok(!legalMoves(castle).some(m=>m.special==='castle'));});
test('movement powers do not change post-move attacks or permanent piece identities',()=>{const s=pos('tower',{c3:'wb'}),next=applyMove(s,power(s,'c3','c6'));assert.equal(next.board[sq('c6')].type,'b');const normal=legalMoves({...next,turn:'w',mode:'classic'},sq('c6'));assert.ok(normal.every(m=>Math.abs(m.to%8-2)===Math.abs((m.to>>3)-5)));});
test('pawn card promotion, home recall, swap ranks, and charge en passant',()=>{const s=pos('tower',{b7:'wp'});assert.equal(legalMoves(s,null,{slot:0,usePower:true}).filter(m=>m.from===sq('b7')&&m.to===sq('b8')).length,4);const recall=pos('recall',{d4:'wp'});assert.equal(power(recall,'d4','b1').promotion,undefined);const swap=pos('relay',{b2:'wp',b1:'wr'});assert.equal(power(swap,'b2','b1'),undefined);const charge=pos('charge',{d3:'wp',e5:'bp'});const next=applyMove(charge,power(charge,'d3','d5'));assert.equal(next.ep,sq('d4'));assert.ok(legalMoves(next).some(m=>m.special==='ep'));});
test('card positions distinguish hands and effects; non-king material can still mate with cards',()=>{const s=pos('saddle',{b2:'wb'});assert.equal(outcome(s).over,false);assert.notEqual(positionKey(s),positionKey({...s,shield:{square:9,color:'w'}}));assert.notEqual(positionKey(s),positionKey({...s,hands:{...s.hands,w:['tower','ward','frost']}}));});
test('CPU uses a card-only queen capture and does not consult future draw order',()=>{const s=pos('comet',{c3:'wn',e6:'bq'});const a=chooseMove(s,{maxDepth:1,timeMs:4000,quiescence:false});assert.equal(a.move.usePower,true);assert.equal(a.move.card,'comet');assert.equal(a.move.to,sq('e6'));const b=chooseMove({...s,deck:s.deck.slice().reverse(),rng:999},{maxDepth:1,timeMs:4000,quiescence:false});assert.deepEqual(a.move,b.move);});
test('checkmate considers card escapes but held cards do not give check',()=>{const s=pos('prism',{a1:'wk',b1:'wr',h8:null,c3:'bk',a8:'br'});assert.equal(outcome({...s,mode:'classic'}).reason,'Checkmate');const escape=power(s,'b1','a2');assert.ok(escape);assert.equal(inCheck(applyMove(s,escape),'w'),false);assert.equal(outcome(s).over,false);});
test('CPU card-game turns remain legal, keep three cards and conserve all 40',()=>{let s=initialState('cards',93);for(let i=0;i<10;i++){if(outcome(s).over)break;const result=chooseMove(s,{maxDepth:1,timeMs:800,quiescence:false});assert.ok(legalMoves(s).some(m=>JSON.stringify(m)===JSON.stringify(result.move)));s=applyMove(s,result.move);assert.equal(s.hands.w.length,3);assert.equal(s.hands.b.length,3);assert.equal(s.hands.w.length+s.hands.b.length+s.deck.length+s.discard.length,40);}});

test('every spell has a concrete action unavailable from an ordinary move',()=>{
 for(const [id,pieces,from,to] of cases){
  const s=pos(id,pieces),m=power(s,from,to);assert.ok(m,id);
  assert.ok(!legalMoves({...s,mode:'classic'}).some(n=>n.from===m.from&&n.to===m.to&&n.special===m.special),id);
 }
});
test('rebalanced short-range cards have distinct roles and respect blockers',()=>{
 assert.ok(power(pos('retreat',{d5:'wb',d4:'wp',d3:'bp'}),'d5','d2'));
 assert.equal(power(pos('retreat',{d5:'wb',d2:'bp'}),'d5','d2'),undefined);
 assert.ok(power(pos('flank',{d4:'wp',e4:'wp',f4:'bp',g4:'bq'}),'d4','g4'));
 assert.equal(power(pos('flank',{d4:'wp'}),'d4','e4'),undefined);
 assert.ok(power(pos('step',{d4:'wr'}),'d4','e5'));
 assert.equal(power(pos('crown',{d4:'wr'}),'d4','e5'),undefined);
 assert.ok(power(pos('crown',{d4:'wr'}),'d4','f6'));
 assert.equal(power(pos('crown',{d4:'wr',e5:'wp'}),'d4','f6'),undefined);
});

test('normal turns preserve both hands and the entire draw economy, including in CPU search',()=>{
 for(const simulation of [false,true]){
  let s={...initialState('cards',42),simulation};const hands=structuredClone(s.hands),deck=s.deck.slice(),discard=s.discard.slice(),rng=s.rng;
  for(let turn=0;turn<4;turn++){
   const moves=legalMoves(s).filter(m=>!m.usePower);assert.ok(moves.length);assert.equal(new Set(moves.map(m=>JSON.stringify(m))).size,moves.length);
   s=applyMove(s,moves[0]);assert.deepEqual(s.hands,hands);assert.deepEqual(s.deck,deck);assert.deepEqual(s.discard,discard);assert.equal(s.rng,rng);
  }
 }
});
