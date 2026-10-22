'use strict';
const assert=require('node:assert/strict');
const G=require('../src/interior-wayfinding.js');
const doors={
 center:{'7,10':{id:'village',x:6,y:9}},
 workshop:{'7,10':{id:'village',x:3,y:9},'12,6':{id:'archive',x:8,y:11}},
 archive:{'8,12':{id:'workshop',x:10,y:7}},
 home:{'7,10':{id:'village',x:20,y:18},'6,6':{id:'bedroom',x:7,y:8}}
};
assert.equal(G.portalList('center',doors).length,1);
assert.equal(G.portalList('center',doors)[0].exit,true);
assert.equal(G.portalList('workshop',doors)[1].locked,true,'Archive remains sealed until festival complete');
assert.equal(G.portalList('workshop',doors,{events:{townLegacy:{claimed:true}}})[1].locked,false);
assert.equal(G.portalList('archive',doors).length,1);
assert.equal(G.portalList('unknown',doors).length,0);
const calls=[],canvas={
 save(){calls.push('save')},restore(){calls.push('restore')},
 fillRect(x,y,w,h){assert([x,y,w,h].every(Number.isFinite));assert(w>0&&h>0);calls.push('rect')},
 beginPath(){calls.push('begin')},roundRect(x,y,w,h){assert([x,y,w,h].every(Number.isFinite));calls.push('round')},
 fill(){calls.push('fill')},fillText(label){assert.equal(typeof label,'string');calls.push('text:'+label)}
};
const names={village:{name:'ミナモリの町'},archive:{name:'星の復元資料室'},bedroom:{name:'自分の部屋'}};
assert.equal(G.draw(canvas,'center',doors,{x:7,y:9},0,0,names),1);
assert(calls.includes('text:外へ出る'),'Exit label appears when standing nearby');
calls.length=0;
assert.equal(G.draw(canvas,'workshop',doors,{x:12,y:6,events:{}},0,0,names),2);
assert(calls.includes('text:まだ開かない'),'Sealed archive door is marked as closed');
calls.length=0;
G.draw(canvas,'workshop',doors,{x:12,y:6,events:{townLegacy:{claimed:true}}},0,0,names);
assert(calls.includes('text:星の復元資料室'),'Unlocked room receives destination label');
calls.length=0;
assert.equal(G.draw(canvas,'center',doors,{x:1,y:1},2000,3000,names),0,'Culling skips invisible rooms');
assert.equal(G.draw(null,'center',doors,{x:7,y:9},0,0,names),0);
assert.equal(G.draw(canvas,'village',doors,{x:1,y:1},0,0,names),0);
console.log('PASS: interior door signs show exit/destination, preserve story locks, and stay viewport-bounded');
