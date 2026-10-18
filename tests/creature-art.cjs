'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Art=require('../src/creature-art.js');
const game=fs.readFileSync('index.html','utf8');
const re=/\{id:'([^']+)',name:'[^']+',type:'[^']+',color:'([^']+)',accent:'([^']+)',shape:'([^']+)'/g;
const species=[...game.matchAll(re)].map(m=>({id:m[1],color:m[2],accent:m[3],shape:m[4]}));
assert.equal(species.length,16,'All species must be covered');
assert.equal(Art.SHAPES.length,13,'All core silhouette families are implemented');
assert.equal(new Set(species.map(s=>s.shape)).size,Art.SHAPES.length);
const shapes=[];
let operations=[];
const ctx=new Proxy({},{
  get(o,p){
   if(p in o)return o[p];
   if(['fill','stroke','closePath','beginPath'].includes(p))return ()=>operations.push(p);
   if(['ellipse','fillRect','lineTo','moveTo'].includes(p))return (...args)=>operations.push(p+':'+args.map(n=>typeof n==='number'?Math.round(n*10)/10:n).join(','));
   return o[p];
  },
  set(o,p,v){o[p]=v;return true}
});
for(const mon of species){
 const versions=[];
 for(const facing of [false,true]){
  for(const time of [0,24,72]){
   operations=[];
   const ok=Art.draw(ctx,mon,time,facing);
   assert.equal(ok,true,mon.id+' supports '+(facing?'back':'front')+' animation');
   assert(operations.length>20,mon.id+' has layered sprite detail');
   versions.push(operations.join('|'));
  }
 }
 // Six combat phases alter actual ears, wings, limbs and shells (not only transforms).
 const attackFrames=new Set();
 for(let k=0;k<6;k++){
  operations=[];
  Art.draw(ctx,mon,42,false,(k+.4)/6);
  attackFrames.add(operations.join('|'));
 }
 assert(attackFrames.size>=5,mon.id+' has multiple authored attack articulation frames');
 operations=[];Art.draw(ctx,mon,42,true,.57);
 assert(operations.length>20,mon.id+' can attack from its back-facing pose');
 assert.notEqual(versions[0],versions[3],mon.id+' draws distinct front/back geometry');
 assert.notEqual(versions[0],versions[1],mon.id+' has genuine animation between frames');
 const keys=new Set();
 for(let key=0;key<8;key++){
  operations=[];Art.draw(ctx,mon,key*7,false);
  keys.add(operations.join('|'));
 }
 assert(keys.size>=4,mon.id+' has distinct key-frame silhouettes');

 shapes.push({name:mon.id,ops:versions[0].split('|').length});
}
assert.equal(Art.draw(ctx,{id:'unknown',shape:'missing',color:'#fff',accent:'#ccc'},0,false),false);
const byShape=new Map();
for(const mon of species){
 const ops=shapes.find(m=>m.name===mon.id).ops;
 if(!byShape.has(mon.shape))byShape.set(mon.shape,ops);
}
assert.equal(byShape.size,13);
assert(shapes.some(m=>m.ops>70),'At least one complex monster uses layered geometry');
console.log('PASS: 16 creatures, 13 silhouettes, separate battle backs, animation frames, and detailed 2D artwork');
