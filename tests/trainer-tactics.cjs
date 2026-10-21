'use strict';
const assert=require('node:assert/strict');
const A=require('../src/trainer-tactics.js');
const species={leaf:{type:'草',atk:15,def:13,spAtk:17,spDef:14},fire:{type:'火',atk:20,def:12,spAtk:19,spDef:12}};
const moves={sprout:{p:56,type:'草',category:'special',accuracy:100},
 scratch:{p:37,type:'無',category:'physical',accuracy:100},blaze:{p:42,type:'火',category:'special',accuracy:100},
 heal:{effect:'heal',healRatio:.5},poison:{effect:'inflict',status:'どく',accuracy:90},
 boost:{effect:'stage',scope:'self',stat:'atk',stages:1},guard:{effect:'guard'},rain:{effect:'weather',weather:'rain'}};
const atk={id:'leaf',level:12,hp:65,maxHp:65,moves:Object.keys(moves),pp:Object.fromEntries(Object.keys(moves).map(n=>[n,10])),status:'',stages:{}};
const defender={id:'fire',level:12,hp:58,maxHp:58,status:'',stages:{}};
const effectiveness=(attack,defense)=>attack==='草'&&defense==='火'?.5:attack==='火'&&defense==='草'?2:1;
const ctx={attacker:atk,defender,species,moves,effectiveness,weather:'clear',turn:4,skill:'elite',rng:()=>.5};
assert(A.estimate(atk,defender,'scratch',species,moves,effectiveness)>0);
assert.equal(A.estimate(atk,defender,'heal',species,moves,effectiveness),0);
assert(A.evaluate('heal',ctx)<0,'Full-health AI should not waste recovery');
assert.equal(A.evaluate('poison',{...ctx,defender:{...defender,status:'どく'}}),-100*.9);
const wounded={...atk,hp:8,moves:['heal','scratch'],pp:{heal:9,scratch:9}};
assert.equal(A.choose({...ctx,attacker:wounded}), 'heal','AI heals when seriously hurt');
const full={...atk,moves:['heal','scratch'],pp:{heal:9,scratch:9}};
assert.equal(A.choose({...ctx,attacker:full}), 'scratch','AI attacks rather than healing at full HP');
const affected={...defender,status:'どく'};
assert.equal(A.choose({...ctx,attacker:{...atk,moves:['poison','scratch'],pp:{poison:3,scratch:7}},defender:affected}), 'scratch','No duplicate status when already affected');
const noPP={...atk,pp:Object.fromEntries(atk.moves.map(n=>[n,0]))};
assert.equal(A.choose({...ctx,attacker:noPP}),'わるあがき','No-PP fallback');
const advance={...atk,moves:['scratch','blaze'],pp:{scratch:10,blaze:10}};
assert.equal(A.choose({...ctx,attacker:advance,skill:'wild',rng:()=>.99}).length>0,true);
assert.equal(A.ranked({...ctx,attacker:advance}).length,2);
assert(A.evaluate('rain',{...ctx,weather:'rain'})<0,'Do not reapply existing weather');
assert(A.evaluate('boost',{...ctx,attacker:{...atk,stages:{atk:6}}})<0,'Capped boosts are pointless');
console.log('PASS: smarter rival/wild actions, healing, debuffs, weather, type scoring, PP and stat cap');
