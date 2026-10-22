'use strict';
const assert=require('node:assert/strict');
const C=require('../src/field-camera.js');
const base={zone:'route',x:12,y:12,dir:'right',running:false,indoor:false,width:24,height:26};
const middle=C.position(base);
const west=C.position({...base,dir:'left'});
const eastRun=C.position({...base,running:true});
assert(middle.x>west.x,'Directional anticipatory view faces the route of travel');
assert(eastRun.x>middle.x,'Running gives more view of obstacles ahead');
assert(C.position({...base,dir:'up'}).y<C.position({...base,dir:'down'}).y);
const indoor=C.position({...base,indoor:true,dir:'right'});
assert(indoor.x<middle.x,'Indoors removes directional camera bias to fit interiors');
const small=C.position({...base,width:10,height:10});
assert.equal(small.x,0);
assert.equal(small.y,0);
const first=C.track(null,{...base,now:100});
assert.equal(first.x,middle.x,'Initial map displays immediately, no panning from origin');
const moving=C.track(first,{...base,x:14,now:120});
const desired=C.position({...base,x:14});
assert(moving.x>first.x&&moving.x<desired.x,'Camera eases gradually');
const farther=C.track(moving,{...base,x:14,now:140});
assert(farther.x>moving.x);
const rezone=C.track(farther,{...base,zone:'forest',x:14,now:145});
assert.equal(rezone.x,C.position({...base,zone:'forest',x:14}).x,'Region gates snap to the new safe view');
const cut=C.track(farther,{...base,x:2,now:147,snap:true});
assert.equal(cut.x,C.position({...base,x:2}).x);
const stasis=C.track(first,{...base,now:100});
assert.equal(stasis.x,first.x,'Zero elapsed time is stable');
const caps=C.track(first,{...base,x:40,now:10000});
assert(caps.x<=24*32-416&&caps.x>=0,'Even runaway timing remains clamped');
const events=[];
const ctx={
 save(){events.push('save')},restore(){events.push('restore')},
 fillRect(x,y,w,h){assert([x,y,w,h].every(Number.isFinite));events.push('rect')},
 beginPath(){events.push('begin')},roundRect(x,y,w,h){assert([x,y,w,h].every(Number.isFinite));events.push('round')},
 fill(){events.push('fill')},fillText(text){events.push('text:'+text)}
};
const entrance={started:1000};
assert.equal(C.title(ctx,entrance,'ミナモリの町',1100,false),false,'No overlay during gate curtain');
assert.equal(C.title(ctx,entrance,'ミナモリの町',1800,false),true);
assert(events.some(x=>x.includes('ミナモリの町')),'Area label matches the actual name');
assert.equal(C.title(ctx,entrance,'アオイ研究所',2100,true),true);
assert(events.some(x=>x.includes('INSIDE')),'Indoor transitions have own identity');
assert.equal(C.title(ctx,entrance,'ミナモリの町',3900,false),false);
assert.equal(C.title(null,entrance,'ミナモリの町',1800,false),false);
console.log('PASS: anticipatory world camera, running lookahead, snap-on-door and readable scene arrival cards');
