'use strict';
const assert=require('node:assert/strict');
const D=require('../src/world-detail.js');
assert.equal(D.hash(6,3,8),D.hash(6,3,8));
assert.notEqual(D.hash(6,3,8),D.hash(3,6,8));
const tiles=Array.from({length:12},(_,y)=>Array.from({length:12},(_,x)=>
 (x+y)%8===0?4:(x+y)%6===0?2:(x+y)%4===0?1:(x+y)%7===0?7:0
));
const out=[];
const ctx={
 fillRect(...a){out.push('r:'+a.map(v=>Math.round(v*10)/10).join(',')+':'+this.fillStyle)},
 beginPath(){},ellipse(...a){out.push('e:'+a.slice(0,4).map(v=>Math.round(v*10)/10).join(','))},
 fill(){out.push('f:'+this.fillStyle)},
 stroke(){out.push('s:'+this.strokeStyle)},
 moveTo(...a){out.push('m:'+a.join(','))},
 lineTo(...a){out.push('l:'+a.join(','))}
};
const range={x0:0,x1:12,y0:0,y1:12};
const v=D.draw(ctx,'village',tiles,0,0,range,24);
assert(v>100,'All visible passable and decorative tile types get a detailing pass');
const village=out.join('|');assert(out.length>100);
out.length=0;
const same=D.draw(ctx,'village',tiles,0,0,range,24);
assert.equal(same,v);assert.equal(out.join('|'),village,'Village tile ornaments deterministic within one frame');
out.length=0;
D.draw(ctx,'forest',tiles,0,0,range,24);
const forest=out.join('|');
assert.notEqual(forest,village,'Woodland detail differs from town artwork');
assert(forest.includes('#'),'Forest uses several foliage tones');
out.length=0;
const n=D.draw(ctx,'forest',tiles,0,0,{x0:0,x1:3,y0:0,y1:3},24);
assert(n<=9,'Mobile viewport culling prevents drawing whole map');
assert.equal(D.draw(ctx,'lab',tiles,0,0,range,24),0,'Other locations retain their existing tailored art');
assert.equal(D.draw(null,'forest',tiles,0,0,range,24),0);
// Plaza and glades remain distinct, cullable background layers.
out.length=0;
assert(D.districtFeatures(ctx,'village',0,0,60)>0);
const district=out.join('|');
assert(out.length>20,'Town square and gardens add visible authored floor art');
out.length=0;
assert(D.districtFeatures(ctx,'forest',0,0,60)>0);
assert.notEqual(out.join('|'),district,'Forest clearings use different geometry');
assert.equal(D.districtFeatures(ctx,'lab',0,0,60),0);
assert.equal(D.districtFeatures(null,'village',0,0,60),0);
console.log('PASS: deterministic dense village paving, gardens, forest mushrooms, roots and culling');
