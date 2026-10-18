'use strict';
const assert=require('node:assert/strict');
const L=require('../src/map-layout.js');
function base(w,h){return Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>x<2||y<2||x>=w-2||y>=h-2?4:0))}
for(const [map,w,h] of [['village',24,20],['forest',28,28]]){
 const a=base(w,h),b=base(w,h);
 assert.equal(L.apply(map,a),true);
 L.apply(map,b);assert.deepEqual(a,b,map+' layout is deterministic');
 assert(a.some(row=>row.includes(4)),'Forested obstacles remain');
 for(const start of L.SITES[map])for(const goal of L.SITES[map]){
  assert(L.reachable(a,start,goal),map+' disconnected: '+start.id+' → '+goal.id);
 }
 const signature=JSON.stringify(a);
 assert.notEqual(signature,JSON.stringify(base(w,h)),'Map layout changes original terrain');
 // Gates must remain passable and on-map.
 for(const site of L.SITES[map]){
  assert(site.x>=0&&site.x<w&&site.y>=0&&site.y<h);
  assert(![3,4,5,8,9,11].includes(a[site.y][site.x]),site.id+' is blocked');
 }
 if(map==='village'){
  assert.equal(a[8][6],6,'Clinic door preserved');
  assert.equal(a[8][17],6,'Shop door preserved');
  assert.equal(a[17][9],6,'Lab door preserved');
  assert.equal(a[17][20],6,'Home door preserved');
  assert.equal(a[5][4],5,'Clinic wall preserved');
  assert.equal(a[14][18],5,'House wall preserved');
  for(const [x,y] of [[10,12],[14,13],[8,9],[15,9],[18,11],[21,12],[19,12],[20,11],[15,14],[6,12]])assert(L.reachable(a,{x:11,y:1},{x,y}),'Village story actor isolated');
 }else{
  for(const [x,y] of [[13,12],[19,18],[9,7],[13,22],[8,16],[10,16],[13,26]])assert(L.reachable(a,{x:13,y:1},{x,y}),'Forest actor/route isolated '+x+','+y);
  assert(a.flat().filter(t=>t===4).length>70,'Forest has substantial tree obstacles');
 }
}
assert.equal(L.apply('route',base(24,26)),false,'Other maps keep original layout');
console.log('PASS: 2 fully connected, deterministic redesigned maps, four original doors, story actors, gates and forest loops');
