'use strict';
const assert=require('node:assert/strict');
const Layout=require('../src/map-layout.js');
const Forest=require('../src/forest-secrets.js');
function map(){
 const result=Array.from({length:28},(_,y)=>Array.from({length:28},(_,x)=>
  x<2||y<2||x>=26||y>=26?4:0));
 Layout.apply('forest',result);
 return result;
}
const grid=map();
const p0=Forest.normalize(null);
assert.deepEqual(p0,{sequence:0,gateOpen:false,bloomClaimed:false});
assert(Forest.prepare(grid,p0));
assert(Forest.tileIsOpen(grid,p0));
assert.equal(grid[Forest.GATE.y][Forest.GATE.x],4);
assert.equal(Layout.reachable(grid,{x:13,y:26},Forest.ALCOVE),false,'Secret chamber is sealed from the main forest');
for(const rune of Forest.RUNES){
 assert(Layout.reachable(grid,{x:13,y:26},rune),'Puzzle stones are reachable from original exit');
}
assert(Layout.reachable(grid,{x:13,y:26},Forest.NIGHT_BLOOM),'Twilight bloom reachable at any time');
assert(Layout.reachable(grid,{x:13,y:26},{x:13,y:1}),'Main forest crossing remains open');
let p=Forest.next(p0,'dew',0);
assert.equal(p.kind,'hint');assert.equal(p.progress.sequence,0,'Wrong order does not progress');
p=Forest.next(p0,'leaf',0);
assert.equal(p.kind,'rune');assert.equal(p.progress.sequence,1);
let after=Forest.next(p.progress,'leaf',0);
assert.equal(after.kind,'done','Already activated rune is idempotent');
p=Forest.next(p.progress,'dew',0);assert.equal(p.progress.sequence,2);
p=Forest.next(p.progress,'star',2);assert.equal(p.kind,'unlocked');
assert.equal(p.progress.gateOpen,true);
assert.equal(p.progress.sequence,3);
assert(Forest.prepare(grid,p.progress));
assert(Forest.tileIsOpen(grid,p.progress));
assert.equal(grid[Forest.GATE.y][Forest.GATE.x],1);
assert(Layout.reachable(grid,{x:13,y:26},Forest.ALCOVE),'Puzzle must open a genuinely new walkable route');
assert.equal(Forest.next(p.progress,'star',0).kind,'done');
const beforeBloom=Forest.next(p0,'bloom',0);
assert.equal(beforeBloom.kind,'hint');
assert.equal(beforeBloom.progress.bloomClaimed,false);
for(const phase of [1,2]){
 let b=Forest.next(p0,'bloom',phase);
 assert.equal(b.kind,'bloom');
 assert.equal(b.reward.item,'ether');
 assert.equal(b.reward.count,2);
 assert.equal(b.progress.bloomClaimed,true);
 assert.equal(Forest.next(b.progress,'bloom',phase).reward,undefined,'Bloom reward cannot be claimed twice');
}
const restored=Forest.normalize(JSON.parse(JSON.stringify(p.progress)));
assert(restored.gateOpen);
assert(Forest.prepare(grid,null));
assert.equal(grid[Forest.GATE.y][Forest.GATE.x],4,'New games reset the secret gate');
assert(!Layout.reachable(grid,{x:13,y:26},Forest.ALCOVE));
assert(Forest.prepare(grid,restored));
assert(Layout.reachable(grid,{x:13,y:26},Forest.ALCOVE),'Saved unlock restores the passage');
console.log('PASS: 3 rune order, persistent opened thicket, hidden chamber, twilight flower, repeat-safe rewards and main route');
