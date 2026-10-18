/* Zero-dependency smoke tests for the in-browser RPG runtime. */
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const raw=html.match(/<script>([\s\S]*?)<\/script>/);
assert(raw,'Game script is present');
assert.match(html,/id="touchShell"/,'Lower touchscreen shell exists');
assert.match(html,/id="touchHeader"/,'Lower touchscreen header exists');
assert.match(html,/id="touchQuick"/,'Touchscreen quick menu exists');
assert.match(html,/id="upperMessage"/,'Dialogue has an upper display panel');
assert.match(html,/#console\[data-view="battleCommands"\]/,'Four-command battle pad styles exist');
assert.match(html,/@media\(orientation:landscape\)/,'Responsive dual-screen landscape layout exists');
new vm.Script(raw[1],{filename:'game.js'});
const api='globalThis.__testAPI={get:()=>state,walk,draw,pick,turn,throwOrb,startBattle,makeMonster,openPage,buttonB,switchMap,showBattle,checkTrainerVision,world,maps,byId,interact,npc,storageMenu,equipCharm,defeatEnemy,chooseMove,dexList,dexDetail,partyDetail,drawHero,drawNpc,drawScenery,drawLandmarks,drawBattle,drawMonster,drawInteriorSet,ambientNpcStep,drawMapTransition,drawStoryEffect,startStoryEffect,beginCharacterBeat,cinematicFrame,drawFieldForeground,getBeat:()=>characterBeat,getTransition:()=>mapTransition,NPCS};soundOn=false;init();})();';
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
vm.runInNewContext(fs.readFileSync('src/story.js','utf8'),context,{timeout:5000,filename:'story.js'});
assert(context.AstraStory,'Story engine was initialized');
assert(context.AstraEngine,'RPG engine was initialized');
vm.runInNewContext(fs.readFileSync('src/creature-art.js','utf8'),context,{timeout:5000,filename:'creature-art.js'});
assert(context.AstraCreatureArt,'Species-specific creature art was loaded');
vm.runInNewContext(fs.readFileSync('src/creature-motion.js','utf8'),context,{timeout:5000,filename:'creature-motion.js'});
assert(context.AstraCreatureMotion,'Per-creature animation profiles loaded');
vm.runInNewContext(fs.readFileSync('src/world-detail.js','utf8'),context,{timeout:5000,filename:'world-detail.js'});
assert(context.AstraWorldDetail,'Tile overlay scene detailing loaded');
vm.runInNewContext(fs.readFileSync('src/map-layout.js','utf8'),context,{timeout:5000,filename:'map-layout.js'});
assert(context.AstraMapLayout,'Hand-authored village and forest layout module loaded');
vm.runInNewContext(fs.readFileSync('src/forest-secrets.js','utf8'),context,{timeout:5000,filename:'forest-secrets.js'});
assert(context.AstraForestSecrets,'Forest exploration puzzle module loaded');
vm.runInNewContext(fs.readFileSync('src/battle-backdrops.js','utf8'),context,{timeout:5000,filename:'battle-backdrops.js'});
assert(context.AstraBattlebacks,'Battle backgrounds loaded');
vm.runInNewContext(fs.readFileSync('src/field-sprites.js','utf8'),context,{timeout:5000,filename:'field-sprites.js'});
assert(context.AstraFieldSprites,'Field character art loaded');
vm.runInNewContext(fs.readFileSync('src/npc-schedules.js','utf8'),context,{timeout:5000,filename:'npc-schedules.js'});
assert(context.AstraSchedules,'NPC schedules loaded');
vm.runInNewContext(fs.readFileSync('src/cinematics.js','utf8'),context,{timeout:5000,filename:'cinematics.js'});
assert(context.AstraCinematics,'Cinematic staging module loaded');
vm.runInNewContext(src,context,{timeout:5000,filename:'game.js'});
const g=context.__testAPI;
assert(g);
assert.equal(g.get().scene,'title');
assert.equal(element('app').dataset.scene,'title');
assert.equal(element('touchTitle').textContent,'ASTRA TALES / 星霊譚');
g.draw();
g.pick('flamio');
assert.equal(g.get().scene,'world');
assert.equal(element('app').dataset.scene,'world','Upper/lower screen share scene');
assert.equal(element('console').dataset.view,'touchMenu','Field lower screen is quick touch menu');
g.openPage('party');
assert.equal(element('console').dataset.view,'party','Six-slot party interface is active');
g.partyDetail(0);g.draw();
assert.equal(g.get().partyFocus,0,'Party detail selects creature for upper screen preview');
assert.equal(element('screenShell').dataset.preview,'true','Field HUD hides during creature preview');
g.openPage('gear');
assert.equal(element('console').dataset.view,'gear','Touchscreen gear page renders');
assert.equal(g.get().partyFocus,null,'Returning to app menu clears party preview');
g.openPage('dex');
assert.equal(element('console').dataset.view,'dex','Dex list shows on lower screen');
g.dexDetail('flamio',0);
assert.equal(g.get().dexFocus,'flamio','Dex sets the large upper-screen preview');
assert.equal(element('screenShell').dataset.preview,'true');
g.draw();
g.buttonB();
assert.equal(g.get().dexFocus,null,'B returns from detail to dex list');
g.world();
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
assert.equal(element('console').dataset.view,'battleCommands','Lower screen has four battle command tiles');
g.chooseMove();
assert.equal(element('console').dataset.view,'moves','Lower screen switches to type-colored move tiles');
g.showBattle('どうする？');
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
// Visual replay tests exercise the actual Canvas paths with deterministic virtual time.
const battle=g.get().battle;
assert(battle,'Battle must remain active for visual animation checks');
for(const move of ['ひっかく','ひのこ','みずてっぽう','でんきショック','かぜおこし','いわおとし','ほしのひかり']){
 battle.action={who:'you',name:move,started:39500};
 g.drawBattle();
}
battle.faintAt=39760;battle.faintSide='enemy';g.drawBattle();
battle.faintSide='you';g.drawBattle();
battle.action=null;
g.world();
for(const id of ['village','route','forest','lake','shrine','highland','home','lab','bedroom','observatory']){
 g.switchMap({id,x:5,y:5,dir:'down'});
 g.drawScenery(0,0,0,Math.min(8,g.maps[id][0].length),0,Math.min(8,g.maps[id].length));
 g.drawLandmarks(0,0);
 if(['home','lab','bedroom','observatory','center','mart'].includes(id))g.drawInteriorSet(0,0);
 g.draw();
}
for(const dir of ['up','down','left','right'])g.drawHero(180,185,dir);
// Exercise every original species as an attacker and defender through the real battle renderer.
const battleTypes=Object.keys(context.AstraCreatureMotion.STYLES);
for(const shape of battleTypes){
 const mon=Object.values(g.byId).find(spec=>spec.shape===shape);
 assert(mon,shape+' has a concrete game species');
 const model=g.makeMonster(mon.id,8);
 g.drawMonster(model,180,245,.83,false);
 g.drawMonster(model,205,251,1.15,true);
 const before=context.AstraCreatureMotion.pose(mon,70,null,false);
 const strike=context.AstraCreatureMotion.pose(mon,70,.5,false);
 assert.notDeepEqual(before,strike,shape+' combat pose differs from idle');
}
assert.match(html,/src\/creature-motion\.js/,'Independent creature choreography is linked');
assert.match(html,/src\/world-detail\.js/,'Dense tile-aware region art is linked');
for(const dir of ['up','down','left','right'])g.drawHero(180,185,dir);
g.switchMap({id:'village',x:12,y:17,dir:'down'});
const wander=g.NPCS.village.find(n=>n.name==='花の世話人');
assert(wander&&wander.kind==='talk','A roaming town resident is available');
const oldX=wander.x,oldY=wander.y;
assert(g.ambientNpcStep(true,1)>0,'Town residents follow their dusk routine');
assert(Math.abs(wander.x-oldX)+Math.abs(wander.y-oldY)<=1,'Residents walk one tile per turn');
g.get().x=wander.x;g.get().y=wander.y+1;g.get().dir='up';g.world();
g.interact();assert.equal(g.get().scene,'dialog','Walking residents respond to interaction');
assert.equal(wander.facing,'down','Resident turns to face player when spoken to');
g.world();
const stage=g.get().story.stage;g.get().story.stage=10;
assert.equal(g.ambientNpcStep(true),0,'Ambient wandering is suspended for intro chapters');
g.get().story.stage=stage;
// Validate schedule waypoint tiles against the actual playable, collision-checked maps.
for(const [id,people] of Object.entries(context.AstraSchedules.SCHEDULES)){
 for(const [name,entries] of Object.entries(people)){
  const npc=g.NPCS[id].find(n=>n.name===name);
  assert(npc,id+' schedule actor '+name+' exists');
  for(const entry of entries){
   assert(context.AstraSchedules.isPassable(g.maps[id],entry.x,entry.y),id+' '+name+' has a walkable '+entry.label+' waypoint');
   if(npc.x!==entry.x||npc.y!==entry.y){
    const hop=context.AstraSchedules.nextStep(g.maps[id],{x:npc.x,y:npc.y},entry);
    assert(hop,id+' '+name+' can find a path to '+entry.label);
   }
  }
 }
}
g.startStoryEffect('call',null,1800);
g.drawStoryEffect();
g.switchMap({id:'home',x:7,y:9,dir:'down'});
g.beginCharacterBeat('家族のミドリ',{duration:1550});
assert.equal(g.getBeat()?.name,'家族のミドリ','Conversation actor is staged');
assert.equal(g.cinematicFrame()?.name,'家族のミドリ','Cinematic frame updates without timers');
g.drawFieldForeground(0,0,0,10,0,10,7,9);
assert(g.getTransition().indoor,'Entering home triggers the indoor doorway wipe');
g.drawMapTransition();
g.draw();
assert.match(html,/function drawStoryPose/,'Story participants have dedicated cutscene gesture drawing');
assert.match(html,/function drawFieldForeground/,'Layered tall grass, trees, and reeds cover the foreground');
assert.match(html,/src\/cinematics\.js/,'Nonblocking cinematic module is bundled');
assert.match(html,/function drawMapTransition/,'Doorway and route transitions render on canvas');
assert.match(html,/src\/npc-schedules\.js/,'Daily NPC schedule module is bundled');
assert.match(html,/src\/field-sprites\.js/,'Field characters use independent eight-pose sprite module');
assert.match(html,/function drawInteriorSet/,'Each interior has specialized furnishing geometry');

assert.match(html,/src\/music\.js/,'The independent procedural music engine is bundled');
assert.match(html,/function drawScenery/,'Biome-specific terrain adornment is present');
assert.match(html,/const LANDMARKS=/,'Every region has handcrafted landmarks');
assert.match(html,/src\/creature-art\.js/,'Species artwork module is included in the page');
assert.match(html,/function drawHero/,'Directional hero rendering is present');
const beforePotions=g.get().bag.potion||0, beforeOrbs=g.get().bag.orb||0;
g.get().story.stage=12;
g.switchMap({id:'forest',x:5,y:15,dir:'up'});
g.interact();
assert.equal(g.get().bag.potion,beforePotions+2,'The western optional forest loop rewards two potions');
g.world();
g.switchMap({id:'forest',x:23,y:21,dir:'up'});
g.interact();
assert.equal(g.get().bag.orb,beforeOrbs+3,'The eastern forest loop rewards three orbs');
assert(g.get().collected['forest/東の森の星玉の小箱'],'Hidden item collection is persisted');
assert(context.AstraMapLayout.reachable(g.maps.forest,{x:13,y:1},{x:23,y:20}),'Eastern cache remains reachable');
console.log('PASS: touchscreen UI, battle effects, faint/intro animation, all biomes, character directions and saves');
