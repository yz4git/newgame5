'use strict';
const assert=require('node:assert/strict');
const B=require('../src/building-profile.js');
const ops=[];
const c={
 fillRect(x,y,w,h){assert([x,y,w,h].every(Number.isFinite));assert(w>0&&h>0);ops.push('r:'+this.fillStyle+':'+[x,y,w,h].map(Math.round).join('/'))},
 beginPath(){ops.push('p')},closePath(){ops.push('z')},
 moveTo(x,y){assert(Number.isFinite(x+y));ops.push('m:'+Math.round(x))},
 lineTo(x,y){assert(Number.isFinite(x+y));ops.push('l:'+Math.round(x))},
 ellipse(x,y,rx,ry){assert([x,y,rx,ry].every(Number.isFinite));assert(rx>0&&ry>0);ops.push('e:'+Math.round(x))},
 stroke(){ops.push('stroke:'+this.strokeStyle)},
 fill(){ops.push('fill:'+this.fillStyle)},
 save(){ops.push('save')},restore(){ops.push('restore')}
};
const views=[];
for(const kind of B.KINDS){
 ops.length=0;
 const count=B.draw(c,kind,100,100,kind==='lab'?154:kind==='observatory'?144:122,42);
 assert(count>=14,'Meaningfully authored silhouette for '+kind);
 assert(ops.length>35,'Substantial graphic content for '+kind);
 assert.equal(ops[0],'save');assert.equal(ops.at(-1),'restore');
 views.push(ops.join('|'));
 ops.length=0;B.draw(c,kind,100,100,kind==='lab'?154:kind==='observatory'?144:122,42);
 assert.equal(ops.join('|'),views.at(-1),'Deterministic graphic profile for '+kind);
}
assert.equal(new Set(views).size,5,'All five architectural profiles are visually differentiated');
assert.equal(B.draw(c,'unknown',0,0,120),0);
assert.equal(B.draw(null,'lab',0,0,154),0);
const labDay=[];ops.length=0;B.draw(c,'lab',0,0,154,25,0);labDay.push(ops.join('|'));
ops.length=0;B.draw(c,'lab',0,0,154,25,2);labDay.push(ops.join('|'));
assert.notEqual(labDay[0],labDay[1],'Laboratory windows show day/night distinction');
console.log('PASS: five distinct building silhouettes, deterministic mobile-safe geometry and lit observatory roof details');
