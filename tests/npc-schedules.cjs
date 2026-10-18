'use strict';
const assert=require('node:assert/strict');
const S=require('../src/npc-schedules.js');
assert.equal(Object.keys(S.SCHEDULES).length,5);
const floor=Array.from({length:8},(_,y)=>Array.from({length:9},(_,x)=>x===0||y===0||x===8||y===7?5:1));
floor[3][4]=3;floor[2][4]=3;floor[4][4]=3;
const from={x:2,y:3},to={x:6,y:3,dir:'right'};
const initial=S.nextStep(floor,from,to);
assert(initial&&initial.x===2&&Math.abs(initial.y-3)===1,'Route diverts around an impassable wall');
let p={...from};
for(let step=0;step<45;step++){
 const next=S.nextStep(floor,p,to);
 assert(next,'Route remains navigable');
 assert(S.isPassable(floor,next.x,next.y));
 if(next.arrived)break;
 assert.equal(Math.abs(next.x-p.x)+Math.abs(next.y-p.y),1);
 p=next;
}
assert.equal(p.x,6);assert.equal(p.y,3);
assert.equal(S.nextStep(floor,from,to,new Set(['6,3'])),null,'Occupied destination cannot be entered');
assert.equal(S.nextStep(floor,{x:4,y:3},to),null,'Actor cannot start in water');
assert.equal(S.nextStep(floor,to,to).arrived,true);
assert.equal(S.isPassable(floor,1,1),true);
assert.equal(S.isPassable(floor,-1,1),false);
assert.equal(S.isPassable(floor,4,3),false);
for(const [map,people] of Object.entries(S.SCHEDULES)){
 for(const [name,agenda] of Object.entries(people)){
  assert.equal(agenda.length,3,map+'/'+name);
  for(let phase=0;phase<3;phase++){
   const entry=S.resolve(map,name,phase);
   assert(Number.isInteger(entry.x)&&Number.isInteger(entry.y));
   assert(entry.action&&entry.label&&['up','down','left','right'].includes(entry.dir));
  }
 }
}
assert.equal(S.resolve('lab','教授',1),null);
assert.equal(S.resolve('village','花の世話人',0).action,'watering');
assert.equal(S.resolve('village','花の世話人',1).action,'resting');
assert.equal(S.resolve('village','花の世話人',2).action,'lantern');
console.log('PASS: time schedules across five regions, phase-specific actions, safe routes and collision avoidance');
