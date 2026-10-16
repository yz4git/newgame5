'use strict';
const assert=require('node:assert/strict');
const Backdrops=require('../src/battle-backdrops.js');
assert.equal(Backdrops.ZONES.length,12);
const ops=[];
const c={
 save(){ops.push('save')},restore(){ops.push('restore')},
 fillRect(x,y,w,h){assert(Number.isFinite(x+y+w+h));ops.push('rect:'+Math.round(x)+':'+Math.round(y)+':'+String(c.fillStyle))},
 beginPath(){},ellipse(x,y,rx,ry){assert(rx>0&&ry>0);ops.push('ellipse:'+Math.round(x)+':'+Math.round(y))},fill(){ops.push('fill:'+String(c.fillStyle))},
 moveTo(x,y){ops.push('move:'+Math.round(x)+':'+Math.round(y))},lineTo(x,y){ops.push('line:'+Math.round(x)+':'+Math.round(y))},stroke(){ops.push('stroke')},closePath(){},
 createLinearGradient(){return{addColorStop:(t,val)=>{assert(t>=0&&t<=1);assert(val)}}}
};
const scenes=[];
for(const zone of Backdrops.ZONES){
 ops.length=0;assert.equal(Backdrops.draw(c,zone,100),zone);
 assert(ops.length>60,zone+' has substantial scene geometry');
 assert.equal(ops[0],'save');assert.equal(ops[ops.length-1],'restore');
 scenes.push({zone,signature:ops.join('|')});
}
assert.equal(new Set(scenes.map(z=>z.signature)).size,12,'Battle environments must be structurally different');
ops.length=0;assert.equal(Backdrops.draw(c,'unknown',25),'route','Unknown regions fall back safely');
assert.equal(Backdrops.draw(null,'lake',0),false);
ops.length=0;Backdrops.draw(c,'village',16,0);const day=ops.join('|');
ops.length=0;Backdrops.draw(c,'village',16,1);const dusk=ops.join('|');
ops.length=0;Backdrops.draw(c,'village',16,2);const night=ops.join('|');
assert.notEqual(day,dusk,'Twilight changes battle environment lighting');
assert.notEqual(day,night,'Night adds darkened sky and stars');
assert.notEqual(dusk,night,'Dusk and night remain visually different');

ops.length=0;Backdrops.draw(c,'forest',0);const original=ops.join('|');
ops.length=0;Backdrops.draw(c,'forest',20);assert.notEqual(ops.join('|'),original,'Forest background has subtle ambient motion');
console.log('PASS: 12 distinct battle environments, layered scenery, perspective platforms, ambient motion and fallbacks');
