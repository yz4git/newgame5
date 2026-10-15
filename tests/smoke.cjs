/* Zero-dependency smoke tests for the in-browser RPG runtime. */
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const raw=html.match(/<script>([\s\S]*?)<\/script>/);
assert(raw,'Game script is present');
new vm.Script(raw[1],{filename:'game.js'});
const api='globalThis.__testAPI={get:()=>state,walk,draw,pick,turn,throwOrb,startBattle,makeMonster,openPage,buttonB,switchMap,showBattle,checkTrainerVision,world,maps,byId};soundOn=false;init();})();';
const src=raw[1].replace(/init\(\);\s*\}\)\(\);\s*$/,api);
assert(src.includes('__testAPI'),'Test API injection succeeded');
const noop=()=>{};
const node=(id)=>({
  id,style:{},innerHTML:'',textContent:'',className:'',disabled:false,dataset:{},children:[],
  classList:{add:noop,remove:noop},addEventListener:noop,
  append(...children){this.children.push(...children)},
  appendChild(child){this.children.push(child)},
  querySelector(){return null},
  getContext(){return ctx}
});
const ctx=new Proxy({}, {
  get(_,k){if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop:noop});return noop;},
  set(){return true}
});
const nodes=new Map(),element=id=>{if(!nodes.has(id))nodes.set(id,node(id));return nodes.get(id)};
const doc={getElementById:element,querySelector:element,querySelectorAll:()=>[],createElement:()=>node('dynamic'),addEventListener:noop};
const store={},timers=[];
const deterministicMath=Object.create(Math);deterministicMath.random=()=>0.08;
const context={document:doc,window:{addEventListener:noop},Math:deterministicMath,performance:{now:()=>40000},
  localStorage:{getItem:key=>store[key]||null,setItem:(key,val)=>store[key]=val,removeItem:key=>delete store[key]},
  requestAnimationFrame:noop,setTimeout:callback=>{timers.push(callback);return timers.length},clearTimeout:noop};
context.globalThis=context;
vm.runInNewContext(src,context,{timeout:5000,filename:'game.js'});
const g=context.__testAPI;
assert(g);
assert.equal(g.get().scene,'title');
g.draw();
g.pick('flamio');
assert.equal(g.get().scene,'world');
assert.equal(g.get().party[0].pp['ひのこ'],20);
assert(store['astra-tales-v1'],'Autosave exists');
g.switchMap({id:'village',x:6,y:9,dir:'up'});g.walk('up');
assert.equal(g.get().map,'center','Enter recovery center');
g.draw();g.walk('down');assert.equal(g.get().map,'village','Leave recovery center');
g.switchMap({id:'village',x:17,y:9,dir:'up'});g.walk('up');assert.equal(g.get().map,'mart','Enter shop');
g.switchMap({id:'village',x:10,y:17,dir:'left'});g.walk('left');assert.equal(g.get().map,'lab','Enter lab');
g.switchMap({id:'route',x:23,y:12,dir:'right'});g.walk('right');assert.equal(g.get().map,'lake','Reach optional lake');
g.draw();g.switchMap({id:'shrine',x:9,y:1,dir:'up'});
g.walk('up');assert.equal(g.get().map,'shrine','Badge gates highland');
g.get().badge=true;g.walk('up');assert.equal(g.get().map,'highland','Highland opens after badge');
g.draw();
g.switchMap({id:'route',x:11,y:18,dir:'up'});g.walk('up');
assert.equal(g.get().scene,'dialog','Trainer detects player by line of sight');
g.startBattle([g.makeMonster('koro',3)],{trainer:false});
assert.equal(g.get().scene,'battle');
const before=g.get().party[0].pp['ひのこ'];
g.turn('ひのこ');assert.equal(g.get().party[0].pp['ひのこ'],before-1,'Move PP decreases');
g.draw();
for(let i=0;i<25&&timers.length;i++)timers.shift()();
assert(g.get().scene==='battle'||g.get().scene==='dialog','Battle turn runs to completion');
g.startBattle([g.makeMonster('chiro',2)],{trainer:false});
g.get().battle.enemies[0].hp=1;
g.throwOrb();assert(g.get().battle?.capture,'Capture animation started');
g.draw();
for(let i=0;i<20&&timers.length;i++)timers.shift()();
assert.equal(g.get().party.length,2,'Capture adds to party');
assert(store['astra-tales-v1'],'Capture autosaved');
console.log('PASS: intro, interior warps, side routes, badge gate, trainer vision, battle PP, animation, capture, save, rendering');
