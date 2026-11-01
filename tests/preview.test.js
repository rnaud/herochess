import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,legalMoves,squareIndex as sq} from '../src/engine.js';
import {CARD_IDS} from '../src/cards.js';
import {opponentPreview} from '../src/preview.js';
function fixture(card){const s=initialState('cards',42);s.board=Array(64).fill(null);for(const [at,type,color] of [['a1','k','w'],['h8','k','b'],['d4','r','b'],['d6','p','b'],['d7','q','w'],['c3','p','w']])s.board[sq(at)]={type,color};s.rights='';s.hands.b=[card,'ward','frost'];return s;}
test('every opponent card previews the same legal actions without changing the match',()=>{
 for(const card of CARD_IDS){const s=fixture(card);s.shield={square:sq('d4'),color:'b'};s.freeze={square:sq('c3'),color:'w'};s.ep=sq('c6');const saved=JSON.stringify(s);
 assert.deepEqual(opponentPreview(s,'w',0,sq('d4')),legalMoves({...s,turn:'b',ep:null,shield:null,freeze:null},sq('d4'),{slot:0,usePower:true}));assert.equal(JSON.stringify(s),saved);
 }
});
test('preview respects blockers, capture-only powers, pins, frozen pieces and shields',()=>{
 let s=fixture('tower');assert.ok(!opponentPreview(s,'w',0,sq('d4')).some(m=>m.to===sq('d7')));
 s.hands.b[0]='pierce';assert.ok(opponentPreview(s,'w',0,sq('d4')).some(m=>m.to===sq('d7')));
 s.turn='b';s.shield={square:sq('d7'),color:'w'};assert.equal(opponentPreview(s,'w',0,sq('d4')).length,0);
 s.shield=null;s.freeze={square:sq('d4'),color:'b'};assert.equal(opponentPreview(s,'w',0,sq('d4')).length,0);
 s=fixture('saddle');s.board[sq('h8')]=null;s.board[sq('d8')]={type:'k',color:'b'};s.board[sq('d6')]=null;s.board[sq('d7')]=null;s.board[sq('d1')]={type:'r',color:'w'};assert.equal(opponentPreview(s,'w',0,sq('d4')).length,0);
});
test('preview explains shield and freeze actions and supports a black human',()=>{
 const s=fixture('ward');assert.ok(opponentPreview(s,'w',0,sq('d4')).every(m=>m.to===sq('d4')&&m.special==='shield'));
 s.hands.b[0]='frost';assert.ok(opponentPreview(s,'w',0,sq('d4')).every(m=>m.freezeTarget===sq('d7')||m.freezeTarget===sq('c3')));
 s.hands.w=['tower','ward','frost'];assert.deepEqual(opponentPreview(s,'b',0,sq('d7')),legalMoves(s,sq('d7'),{slot:0,usePower:true}));
});
