/* Automated unit tests for the original ASTRA RPG engine. */
'use strict';
const assert=require('node:assert/strict');
const E=require('../src/rpg-engine.js');
const species={
 flamio:{name:'ヒノコロ',type:'火',hp:29,atk:11,def:8,spd:11,moves:['ひっかく','ひのこ']},
 flaro:{name:'カグツバネ',type:'火',hp:44,atk:17,def:12,spd:15,moves:['ひっかく','ひのこ','ほのおのうず']},
 leafin:{name:'モコリーフ',type:'草',hp:34,atk:9,def:11,spd:8,moves:['たいあたり','はっぱカッター']}
};
const moves={...E.NEW_MOVES,'ひのこ':{p:48,type:'火'},'はっぱカッター':{p:47,type:'草'},'きあいだめ':{effect:'focus'}};
const stable=()=>0.5;
const fire=E.makeCreature('flamio',15,species,moves,stable);
const grass=E.makeCreature('leafin',15,species,moves,stable);
assert.equal(fire.level,15);
assert.ok(fire.iv.hp>=0&&fire.iv.hp<=31);
assert.equal(fire.moves.includes('ひのこ'),true);
assert.ok(fire.uid);
assert.ok(E.statsFor(fire,species.flamio).spd>0);
assert.ok(E.maxHpFor(species.flamio,fire.level,fire.iv)>species.flamio.hp);
const hpBefore=grass.hp;
const hit=E.calcDamage(fire,grass,'ひのこ',species,moves,(a,b)=>a==='火'&&b==='草'?1.5:1,stable);
assert.ok(hit.damage>0);
assert.equal(grass.hp,hpBefore-hit.damage);
assert.ok(hit.efficacy>1);
const missed=E.calcDamage(fire,grass,'ひのこ',species,moves,()=>1,()=>.99);
assert.equal(missed.damage,0);
fire.xp=0;
const level=E.gainXP(fire,E.xpNeed(15),species,moves,stable);
assert.ok(level.levels.includes(16));
assert.equal(fire.id,'flaro','starter evolves at level 16');
assert.equal(level.evolved.to,'flaro');
assert.ok(fire.moves.length<=4);
assert.ok(fire.hp<=fire.maxHp);
const illness=E.makeCreature('leafin',5,species,moves,stable);
illness.status='どく';const old=illness.hp;
const tick=E.afterTurn(illness);
assert.ok(tick.damage>0&&illness.hp<old);
const pr=E.catchProbability(illness,species);
illness.hp=1;illness.status='ねむり';
assert.ok(E.catchProbability(illness,species)>pr);
illness.statusTurns=2;assert.equal(E.skipStatus(illness,stable),'ねむり');
const encounter=E.chooseEncounter([['flamio',5],['leafin',7]],{rng:stable,phase:1});
assert.ok(encounter.id&&encounter.level>=5);
const boxes=E.emptyBoxes();
const party=[E.makeCreature('flamio',5,species,moves,stable)];
assert.equal(E.deposit(boxes,party,0).ok,false,'last creature protected');
party.push(E.makeCreature('leafin',6,species,moves,stable));
assert.equal(E.deposit(boxes,party,1).ok,true);
assert.equal(party.length,1);
assert.equal(boxes[0].members.length,1);
assert.equal(E.takeFromStorage(boxes,0,0,party).ok,true);
assert.equal(party.length,2);
const legacy={saveVersion:1,map:'village',party:[{id:'flamio',level:5,hp:9,maxHp:41,xp:2,moves:null}],boxes:null};
const migrated=E.migrateSave(legacy,species,moves,stable);
assert.equal(migrated.saveVersion,2);
assert.equal(migrated.party[0].hp,9,'legacy health is preserved');
assert.ok(migrated.party[0].iv&&migrated.party[0].pp);
assert.ok(Array.isArray(migrated.boxes));
const trainee=E.makeCreature('flamio',8,species,moves,stable);
const atk0=E.statsFor(trainee,species.flamio).atk;
trainee.heldItem='powerCharm';
const atk1=E.statsFor(trainee,species.flamio).atk;
assert.ok(atk1>=atk0,'Power charm does not reduce attack');
trainee.heldItem=null;
const evBefore=trainee.ev.atk;
E.gainEffort(trainee,fire,species);
assert.ok(trainee.ev.atk>=evBefore,'Effort system updated');
const scripted={events:{},bag:{orb:0},money:100,quest:'start'};
const story=[{op:'message',text:'研究開始'},{op:'item',id:'orb',count:3,unless:'firstGift'},{op:'flag',key:'firstGift'},{op:'quest',value:'field'},{op:'money',amount:50}];
E.applyEvent(story,scripted);
assert.equal(scripted.bag.orb,3);
assert.equal(scripted.money,150);
assert.equal(scripted.quest,'field');
E.applyEvent(story,scripted);
assert.equal(scripted.bag.orb,3,'Event item granted only once');
// The event VM supports persistent conditions, nested branches, choices and one-time outcomes.
const eventState={bag:{orb:1,ether:0},events:{},caught:{flamio:1,leafin:1,crag:1},defeated:{A:1,B:1},party:[fire],money:100,quest:'route',visited:{lake:true},badge:false};
assert.equal(E.eventCondition({all:[{caughtAtLeast:3},{notFlag:'claimed'},{visited:'lake'}]},eventState),true);
assert.equal(E.eventCondition({any:[{badge:true},{trainersAtLeast:2}]},eventState),true);
assert.equal(E.eventCondition({not:{badge:true}},eventState),true);
const optionScript=[
 {op:'branch',test:{caughtAtLeast:3},then:[
  {op:'message',text:'調査成功'},
  {op:'choice',options:[
   {text:'星玉',steps:[{op:'item',id:'orb',count:3},{op:'flag',key:'claimed'}]},
   {text:'PP回復',steps:[{op:'item',id:'ether',count:2},{op:'flag',key:'claimed'}]}
  ]}
 ],else:[{op:'message',text:'まだ足りない'}]}
];
const offer=E.runEvent(optionScript,eventState);
assert.equal(offer.messages[0],'調査成功');
assert.equal(offer.choices.length,2);
assert.equal(eventState.bag.orb,1,'Choice effects are deferred');
E.runEvent(offer.choices[1].steps,eventState);
assert.equal(eventState.bag.ether,2);
assert.equal(eventState.events.claimed,true);
E.runEvent([{op:'branch',test:{notFlag:'claimed'},then:[{op:'item',id:'orb',count:9}],else:[{op:'quest',value:'reward_claimed'}]}],eventState);
assert.equal(eventState.bag.orb,1,'Branch excludes already claimed reward');
assert.equal(eventState.quest,'reward_claimed');
E.runEvent([{op:'takeItem',id:'orb',count:10}],eventState);
assert.equal(eventState.bag.orb,1,'Unaffordable item transaction must not deduct');
const exhausted=E.makeCreature('flamio',5,species,moves,stable);
const recoilBefore=exhausted.hp;
const struggle=E.calcDamage(exhausted,E.makeCreature('leafin',5,species,moves,stable),'わるあがき',species,moves,()=>1,()=>.5);
assert.ok(struggle.damage>0&&struggle.recoil>0);
assert.ok(exhausted.hp<recoilBefore,'Struggle inflicts recoil');
console.log('PASS: growth, IV, evolution, combat, status, capture, inventory storage, event VM, conditional rewards, choices and recoil');
