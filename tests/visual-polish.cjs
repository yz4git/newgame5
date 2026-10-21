'use strict';
const assert=require('node:assert/strict');
const V=require('../src/visual-polish.js');
const zones=['village','route','forest','lake','shrine','highland'];
const types=['火','水','草','雷','風','岩','影','光','無'];
const calls=[];
const context={
 save(){calls.push('save')},restore(){calls.push('restore')},
 beginPath(){calls.push('path')},closePath(){calls.push('close')},
 fill(){calls.push('fill:'+this.fillStyle)},stroke(){calls.push('stroke:'+this.strokeStyle)},
 fillRect(x,y,w,h){assert([x,y,w,h].every(Number.isFinite));calls.push('rect:'+x)},
 ellipse(x,y,rx,ry){assert([x,y,rx,ry].every(Number.isFinite));assert(rx>0&&ry>0);calls.push('ellipse:'+Math.round(x)+':'+Math.round(y))},
 moveTo(x,y){assert(Number.isFinite(x)&&Number.isFinite(y));calls.push('move:'+Math.round(x))},
 lineTo(x,y){assert(Number.isFinite(x)&&Number.isFinite(y));calls.push('line:'+Math.round(x))}
};
assert.equal(V.hash(1,2,3),V.hash(1,2,3));
assert.notEqual(V.hash(1,2,3),V.hash(3,2,1));
const signatures=[];
for(const zone of zones){
 calls.length=0;
 const count=V.field(context,zone,0,0,0,0);
 assert(count>=8&&count<40,zone+' fits small drawing budget');
 assert.equal(calls[0],'save');assert.equal(calls.at(-1),'restore');
 const original=calls.join('|');
 signatures.push(original);
 calls.length=0;
 V.field(context,zone,0,0,0,0);
 assert.equal(calls.join('|'),original,'Field visual is deterministic per frame');
 calls.length=0;
 V.field(context,zone,78,42,34,1);
 assert.notEqual(calls.join('|'),original,'Field reacts to camera or time');
}
assert.equal(new Set(signatures).size,6,'Every region has a different atmospheric drawing');
assert.equal(V.field(context,'lab',0,0,10),0,'Indoor rooms remain free of outdoor overlays');
assert.equal(V.field(null,'forest',0,0,10),0);
calls.length=0;
assert.equal(V.field(context,'forest',0,0,80,2)>8,true,'Forest night supports fireflies');
assert.equal(V.footsteps(context,{x:0,y:0},{x:32,y:0},.5,'forest'),1);
assert.equal(V.footsteps(context,{x:0,y:0},{x:320,y:0},.5,'forest'),0,'Bad large-step motion rejected');
assert.equal(V.footsteps(context,{x:0,y:0},{x:32,y:0},.5,'workshop'),0,'No outdoor dust in indoor rooms');
assert.equal(V.footsteps(context,{x:0,y:0},{x:32,y:0},1,'village'),0,'No dust after movement ends');
const impactSignatures=[];
for(const type of types){
 calls.length=0;
 const count=V.battleImpact(context,type,210,178,.56,32,{critical:true,effectiveness:2});
 assert(count>=10&&count<=30,'Bounded elemental particles for '+type);
 assert.equal(calls[0],'save');assert.equal(calls.at(-1),'restore');
 impactSignatures.push(calls.join('|'));
 calls.length=0;
 assert.equal(V.battleImpact(context,type,210,178,.1,32),0,'No pre-impact particles');
 assert.equal(V.battleImpact(context,type,210,178,.95,32),0,'No post-impact particles');
}
assert.equal(new Set(impactSignatures).size,types.length,'Physical and elemental impacts are visibly distinct');
assert.equal(V.battleImpact(null,'火',210,178,.5),0);
console.log('PASS: six parallax field zones, night effects, footsteps, nine low-cost battle hits and deterministic canvas geometry');
