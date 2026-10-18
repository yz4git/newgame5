'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const M=require('../src/creature-motion.js');
const html=fs.readFileSync('index.html','utf8');
const re=/\{id:'([^']+)',name:'[^']+',type:'[^']+',color:'([^']+)',accent:'([^']+)',shape:'([^']+)'/g;
const creatures=[...html.matchAll(re)].map(m=>({id:m[1],color:m[2],accent:m[3],shape:m[4]}));
assert.equal(creatures.length,16);
assert.equal(Object.keys(M.STYLES).length,13);
const ctx=new Proxy({}, {get(o,k){
 if(k in o)return o[k];
 if(['beginPath','fill','stroke','moveTo','lineTo','ellipse'].includes(k))return (...args)=>{ctx.ops.push([k,...args])};
 return undefined;
},set(o,k,v){o[k]=v;return true}});
ctx.ops=[];
const idleSet=new Set(),attackSet=new Set();
for(const mon of creatures){
 let idle=M.pose(mon,17,null,false),later=M.pose(mon,41,null,false);
 assert.equal(idle.pose,M.STYLES[mon.shape].idle);
 assert.notDeepEqual(idle,later,mon.id+' visibly idles');
 let initial=M.pose(mon,33,.04,false),middle=M.pose(mon,33,.52,false),done=M.pose(mon,33,1,false);
 assert.notDeepEqual(initial,middle,mon.id+' gets an attack pose');
 assert(Math.abs(middle.x)<200&&Math.abs(middle.y)<200);
 assert.equal(middle.pose,M.STYLES[mon.shape].attack);
 assert(Math.abs(middle.x)+Math.abs(middle.y)+Math.abs(middle.rotation)+(Math.abs(middle.sx-1)*30)>2,mon.id+' attack must move');
 const back=M.pose(mon,33,.52,true);
 assert(Number.isFinite(back.x)&&Number.isFinite(back.rotation));
 idleSet.add([idle.x.toFixed(1),idle.y.toFixed(1),idle.rotation.toFixed(3),idle.sx.toFixed(3),idle.sy.toFixed(3)].join('/'));
 attackSet.add([middle.x.toFixed(1),middle.y.toFixed(1),middle.rotation.toFixed(3),middle.sx.toFixed(3),middle.sy.toFixed(3)].join('/'));
 ctx.ops.length=0;
 assert.equal(M.trail(ctx,mon,55,middle),1,mon.id+' has a distinct accent effect');
 assert(ctx.ops.length>=2,mon.id+' attack has graphical accents');
 assert.equal(M.trail(ctx,mon,55,initial),initial.burst>.09?1:0);
 assert(done.phase===1);
}
assert(idleSet.size>=10,'Idle rhythms differ between forms');
assert(attackSet.size>=12,'Attacks have distinct silhouettes, not one shared lunge');
assert.notDeepEqual(M.pose(creatures[0],42,.51,true),M.pose(creatures[0],42,.51,false));
console.log('PASS: 16 monsters, 13 unique silhouettes, idle differences, attack anticipation, rear views, and localized trails');
