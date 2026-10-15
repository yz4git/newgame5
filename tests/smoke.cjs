/* Zero-dependency smoke tests for the in-browser RPG runtime. */
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const raw=html.match(/<script>([\s\S]*?)<\/script>/);
assert(raw,'Game script is present');
new vm.Script(raw[1],{filename:'game.js'});
const api='globalThis.__testAPI={get:()=>state,walk,draw,pick,turn,throwOrb,startBattle,makeMonster,openPage,buttonB,switchMap,showBattle,checkTrainerVision,world,maps,byId,interact,npc,storageMenu,equipCharm,defeatEnemy};soundOn=false;init();})();';
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
vm.runInNewContext(fs.readFileSync('src/rpg-engine.js','utf8'),context,{timeout:5000,filename:'rpg-engine.js'});
assert(context.AstraEngine,'RPG engine was initialized');
vm.runInNewContext(src,context,{timeout:5000,filename:'game.js'});
const g=context.__testAPI;
assert(g);
assert.equal(g.get().scene,'title');
g.draw();
g.pick('flamio');
assert.equal(g.get().scene,'world');
assert.equal(g.get().party[0].pp['ひのこ'],20);
assert(g.get().party[0].iv&&g.get().party[0].nature,'Creature has individual stats');
assert.equal(g.get().saveVersion,2);
assert(store['astra-tales-v1'],'Autosave exists');
g.switchMap({id:'village',x:6,y:9,dir:'up'});g.walk('up');
assert.equal(g.get().map,'center','Enter recovery center');
g.draw();g.walk('down');assert.equal(g.get().map,'village','Leave recovery center');
g.switchMap({id:'village',x:17,y:9,dir:'up'});g.walk('up');assert.equal(g.get().map,'mart','Enter shop');
g.switchMap({id:'village',x:10,y:17,dir:'left'});g.walk('left');assert.equal(g.get().map,'lab','Enter lab');
g.get().x=8;g.get().y=6;g.get().dir='up';
g.interact();
assert(g.get().events.prof_gift,'Researcher gift event activated');
assert.equal(g.get().bag.orb,10);
g.world();g.interact();
assert.equal(g.get().bag.orb,10,'One-time script gift is not repeated');
g.world();g.buttonB();assert.equal(g.get().running,true,'Running toggles on');
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
g.world();
g.get().bag.powerCharm=1;
g.equipCharm(0,'powerCharm');
assert.equal(g.get().party[0].heldItem,'powerCharm','Charm equips correctly');
assert.equal(g.get().bag.powerCharm,0);
g.world();
while(g.get().party.length<6)g.get().party.push(g.makeMonster('koro',4));
g.startBattle([g.makeMonster('chiro',2)],{trainer:false});
g.get().battle.enemies[0].hp=1;g.throwOrb();
for(let i=0;i<20&&timers.length;i++)timers.shift()();
assert.equal(g.get().party.length,6,'Party size stays six');
assert.equal(g.get().boxes[0].members.length,1,'Extra captured creature is stored in PC box');
assert(store['astra-tales-v1'],'PC capture persisted');
// NPC events are wired through the declarative script engine.
g.world();
g.get().caught.leafin=1;g.get().caught.aquill=1;
const originalEther=g.get().bag.ether;
g.switchMap({id:'village',x:15,y:13,dir:'down'});
g.interact();
assert(g.get().events.dex_reward,'Dex researcher quest completed');
assert.equal(g.get().bag.ether,originalEther+2);
g.world();g.interact();
assert.equal(g.get().bag.ether,originalEther+2,'Quest reward is one-time');
g.world();
for(let i=0;i<5;i++)g.get().defeated['completed-'+i]=true;
g.get().badge=true;
g.switchMap({id:'highland',x:12,y:6,dir:'up'});
g.interact();
assert(g.get().events.highland_reward,'Highland postgame quest completed');
assert.equal(g.get().bag.speedCharm,1);
g.world();g.interact();
assert.equal(g.get().bag.speedCharm,1,'Postgame reward cannot be claimed twice');
// Field poisoning causes periodic damage without ever fainting the party outside battle.
g.world();g.switchMap({id:'village',x:12,y:17,dir:'down'});
g.get().party[0].hp=8;g.get().party[0].status='どく';
for(let i=0;i<8;i++)g.walk(i%2===0?'down':'up');
assert(g.get().party[0].hp<8&&g.get().party[0].hp>=1,'Field poison ticks safely');
g.get().party[0].status='';g.get().party[0].hp=g.get().party[0].maxHp;
// When PP is exhausted the player must still be able to act, with recoil.
g.startBattle([g.makeMonster('koro',1)],{trainer:false});
const hero=g.get().party[g.get().battle.active];
for(const name of hero.moves)hero.pp[name]=0;
const beforeStruggle=hero.hp;
g.turn('わるあがき');
assert.equal(g.get().battle.turn,1,'Struggle action consumed a battle turn');
for(let i=0;i<35&&timers.length;i++)timers.shift()();
assert(hero.hp<beforeStruggle,'Struggle inflicted recoil during combat');
assert(store['astra-tales-v1'],'Autosave remains valid');
g.world();g.switchMap({id:'highland',x:18,y:20,dir:'up'});
g.interact();
assert.equal(g.get().scene,'dialog','Optional scripted trial NPC presents a challenge');
assert(!g.get().events.trial_complete,'Trial is not completed before victory');
const cash=g.get().money;
g.startBattle([g.makeMonster('koro',1)],{trainer:true,npc:{name:'試練官 マコト',kind:'trial',eventOnWin:'trial_complete'},trainerKey:'highland/trial',reward:780});
g.get().battle.enemies[0].hp=0;g.defeatEnemy();
for(let i=0;i<25&&timers.length;i++)timers.shift()();
assert.equal(g.get().events.trial_complete,true,'Script battle victory flag set');
assert.equal(g.get().money,cash+780,'Trial reward paid once');
// Battle environment: rain in the lake, persistent weather, ability hooks,
// stage-changing actions and the updated status HUD/render path.
g.world();g.switchMap({id:'lake',x:6,y:20,dir:'up'});
const battleHero=g.get().party[0];
battleHero.hp=battleHero.maxHp;
battleHero.status='';battleHero.statusTurns=0;
battleHero.moves=['ひっかく','いばる','あまごい'];
battleHero.pp={'ひっかく':20,'いばる':12,'あまごい':5};
const lakeFoe=g.makeMonster('koro',2);
g.startBattle([lakeFoe],{trainer:false});
assert.equal(g.get().battle.weather,'rain','Lake uses rain weather');
assert.equal(g.get().battle.weatherTurns,null,'Natural weather persists');
g.draw();
g.turn('いばる');
for(let i=0;i<20&&timers.length;i++)timers.shift()();
assert.equal(g.get().battle.turn,1,'Battle resolves a stage-changing action');
assert.equal(battleHero.stages.atk,1,'Move raises combat attack stage');
g.draw();
g.turn('あまごい');
for(let i=0;i<20&&timers.length;i++)timers.shift()();
assert.equal(g.get().battle.weather,'rain','Rain move changes battle weather');
assert.ok(g.get().battle.weatherTurns<=5&&g.get().battle.weatherTurns>=4,'Weather countdown is handled');
const savedStages=battleHero.stages;
assert(savedStages&&savedStages.atk>=1);
console.log('PASS: exploration, scripted events, catch/storage, staged weather battles, abilities, PP and save compatibility');
