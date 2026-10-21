'use strict';
const assert=require('node:assert/strict');
const B=require('../src/battle-direction.js');
assert.equal(B.DURATION,760);
assert.equal(B.scale('dragon')<1,true,'Large monster silhouettes should not overlap the status panes');
assert(B.scale('mouse')>B.scale('dragon'),'Small forms can fill more space');
const quiet=B.scene({frame:30,allyShape:'mouse',enemyShape:'dragon'});
assert.equal(quiet.active,false);
assert.equal(quiet.progress,1);
assert.equal(quiet.ally.scale>quiet.enemy.scale,true);
assert(Number.isFinite(quiet.ally.x)&&Number.isFinite(quiet.enemy.y));
const action={who:'you',name:'ひっかく',target:'enemy',previousHp:100,damage:26,critical:true,efficacy:2};
const start=B.scene({action,elapsed:0,allyShape:'fox',enemyShape:'dragon',isPhysical:true});
const prep=B.scene({action,elapsed:120,frame:4,isPhysical:true});
const impact=B.scene({action,elapsed:380,frame:7,isPhysical:true});
const done=B.scene({action,elapsed:760,frame:7,isPhysical:true});
assert.equal(start.hit,false);
assert(prep.ally.x>=105);
assert.equal(impact.hit,true);
assert.equal(impact.target,'enemy');
assert(impact.ally.x>start.ally.x,'Physical attacks lunge toward foe');
assert(impact.enemy.x>start.enemy.x,'Damage pushes foe away');
assert.equal(done.active,false);
const enemyTurn=B.scene({action:{...action,who:'enemy',target:'ally'},elapsed:370,isPhysical:true});
assert(enemyTurn.enemy.x<307,'Enemy has its own attack entrance');
assert(enemyTurn.ally.x<105,'Ally responds on impact');
const magic=B.scene({action,elapsed:380,isPhysical:false});
assert(magic.ally.x<impact.ally.x,'Special attacks avoid physical over-lunges');
const missed=B.scene({action:{...action,damage:0,miss:true},elapsed:380,isPhysical:true});
assert.equal(missed.hit,false,'Missing does not shake the defending monster');
const opponent={hp:74,maxHp:100};
assert.equal(B.hpFraction(opponent,action,'enemy',0),1);
assert(B.hpFraction(opponent,action,'enemy',.58)<1);
assert.equal(B.hpNumber(opponent,action,'enemy',1),74);
assert.equal(B.hpFraction(opponent,action,'ally',0),.74,'Only actual target animates');
assert.equal(B.hpFraction({hp:0,maxHp:0},action,'enemy',.4),0);
const calls=[];const ctx={
 save(){calls.push('save')},restore(){calls.push('restore')},
 beginPath(){calls.push('path')},fill(){calls.push('fill')},stroke(){calls.push('stroke')},
 roundRect(...a){calls.push('roundRect');assert(a.every((x,i)=>i===4||Number.isFinite(x)))},
 ellipse(...a){assert(a.slice(0,4).every(Number.isFinite));calls.push('ellipse')},
 fillText(t){calls.push('text:'+t)},
};
assert.equal(B.drawGround(ctx,impact,30),2);
assert(calls.includes('ellipse'));
calls.length=0;assert.equal(B.drawFeedback(ctx,impact,30),true);
assert(calls.some(s=>s.includes('26')),'Damage number shown');
const empty={...impact,damage:0,miss:false};
assert.equal(B.drawFeedback(ctx,empty,30),false);
const missShot=B.scene({action:{...action,miss:true,damage:0},elapsed:410});
calls.length=0;assert.equal(B.drawFeedback(ctx,missShot,0),true);
assert(calls.some(s=>s.includes('MISS')),'Missing a hit has visible feedback');
assert.equal(B.drawFeedback(null,impact),false);
assert.equal(B.drawGround(null,quiet),0);
console.log('PASS: original battle staging, species scale, meaningful hit reactions, timed HP changes and readable miss/damage');
