'use strict';
const assert=require('node:assert/strict');
const S=require('../src/stargazer-research.js');
assert.equal(S.LENSES.length,3);
assert.deepEqual(S.DIRECTIONS,['北','東','南','西']);
const missing=S.snapshot({});
assert.equal(missing.aligned,1,'The lake lens initially faces north');
assert.equal(missing.solved,false);
assert.equal(missing.claimed,false);
assert.equal(S.claim({}).ok,false,'Cannot steal prize before solving');
assert.equal(S.align({}).ok,false,'An unfinished star map cannot complete');
assert.equal(S.telescope({},0).text.includes('断片的'),true);
const no=S.rotate({},'missing',1);assert.equal(no.ok,false);
assert.equal(S.rotate({},'forest',1.3).ok,false);
const seed={stargazer:{angles:[0,0,0],solved:false,claimed:false}};
const input=JSON.stringify(seed);
const result=S.rotate(seed,'forest',1);
assert.equal(result.ok,true);
assert.equal(result.progress.angles[0],1);
assert.equal(JSON.stringify(seed),input,'All progress transitions must avoid mutating saves');
const backward=S.rotate(seed,'forest',-1);
assert.equal(backward.progress.angles[0],3,'Reverse wheel wraps safely');
const forwards=S.rotate({stargazer:backward.progress},'forest',2);
assert.equal(forwards.progress.angles[0],1,'Rotations normalize multiple steps');
const steps=[
 ['forest',1],['highland',-1]
];
let event={};
for(const [id,amount] of steps){const r=S.rotate(event,id,amount);assert.equal(r.ok,true);event.stargazer=r.progress}
assert.deepEqual(event.stargazer.angles,[1,0,3]);
assert.equal(S.observe(event).ready,true);
assert.equal(S.snapshot(event).aligned,3);
const solved=S.align(event);
assert.equal(solved.ok,true);
assert.equal(solved.newly,true);
assert.equal(solved.progress.solved,true);
assert.equal(S.align({stargazer:solved.progress}).newly,false);
assert.equal(S.rotate({stargazer:solved.progress},'lake',1).ok,false,'Dials lock after victory');
const gift=S.claim({stargazer:solved.progress});
assert.equal(gift.ok,true);
assert.equal(gift.reward.bag.ether,2);
assert.equal(gift.reward.bag.speedCharm,1);
assert.equal(gift.reward.money,250);
assert.equal(S.claim({stargazer:gift.progress}).ok,false,'Reward may never be claimed twice');
assert.equal(S.snapshot({stargazer:gift.progress}).claimed,true);
assert.equal(S.snapshot({stargazer:gift.progress}).solved,true);
const lines=[0,1,2].map(p=>S.telescope({stargazer:gift.progress},p).text);
assert.equal(new Set(lines).size,3,'Distinct morning, dusk and night sky records');
assert(S.telescope({stargazer:gift.progress},3).text===lines[2],'Unknown phase clamps to night');
assert.deepEqual(S.normalize({stargazer:{angles:[-2,7,1.5],claimed:1}}).angles,[0,3,0],'Invalid old data is sanitized');
const loaded=JSON.parse(JSON.stringify({stargazer:gift.progress}));
assert.equal(S.claim(loaded).ok,false,'Reload does not reset one-time rewards');
const skyCalls=[];const ctx={
 save(){skyCalls.push('save')},restore(){skyCalls.push('restore')},
 createLinearGradient(){return {addColorStop(pos,color){skyCalls.push('shade:'+color)}}},
 fillRect(x,y,w,h){assert([x,y,w,h].every(Number.isFinite));skyCalls.push('bg')},
 beginPath(){skyCalls.push('path')},closePath(){},
 moveTo(x,y){assert(Number.isFinite(x+y));skyCalls.push('move')},
 lineTo(x,y){assert(Number.isFinite(x+y));skyCalls.push('line')},
 arc(x,y,r){assert([x,y,r].every(Number.isFinite));skyCalls.push('star')},
 ellipse(x,y,rx,ry){assert([x,y,rx,ry].every(Number.isFinite));skyCalls.push('lake')},
 roundRect(x,y,w,h){assert([x,y,w,h].every(Number.isFinite));skyCalls.push('panel')},
 fill(){skyCalls.push('fill')},stroke(){skyCalls.push('stroke')},fillText(t){skyCalls.push('text:'+t)}
};
const skies=[];
for(let i=0;i<3;i++){
 skyCalls.length=0;
 assert.equal(S.drawSky(ctx,i,40,true),true);
 assert(skyCalls.some(t=>t.includes(['朝','夕','夜'][i])),'Time-specific scene title');
 assert(skyCalls.filter(t=>t==='line').length>=10,'Restored constellation connects its stars');
 skies.push(skyCalls.join('|'));
}
assert.equal(new Set(skies).size,3,'Morning, sunset, and night look different');
skyCalls.length=0;S.drawSky(ctx,2,40,false);
assert(!skyCalls.includes('line'),'Unrestored constellation shows scattered points, not links');
assert.equal(S.drawSky(null,2,40,true),false);

console.log('PASS: astronomy clue alignment, clockwise/anticlockwise lenses, three sky phases, safe saves and reward idempotence');
