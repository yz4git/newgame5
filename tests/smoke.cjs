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
const api='globalThis.__testAPI={get:()=>state,walk,draw,pick,turn,throwOrb,startBattle,makeMonster,openPage,buttonB,switchMap,showBattle,checkTrainerVision,world,maps,byId,interact,npc,storageMenu,equipCharm,defeatEnemy,chooseMove,dexList,dexDetail,partyDetail,drawHero,drawNpc,drawBuilding,drawScenery,drawLandmarks,drawBattle,drawMonster,drawInteriorSet,ambientNpcStep,drawMapTransition,drawStoryEffect,startStoryEffect,beginCharacterBeat,cinematicFrame,drawFieldForeground,drawRegionPuzzles,explorationMenu,explorationDetail,talkToCompanion,companionAction,enemyMove,requestsMenu,requestDetail,acceptFieldRequest,claimFieldRequest,drawRequestBoard,navigateMenu,buttonA,applyDirection,townLegacyMenu,acceptTownLegacy,finishTownLegacy,drawTownLegacy,drawTownRecordPage,workshopMenu,workshopRecipe,craftWorkshop,archiveAction,drawWorkshopFacade,isNpcVisible,load,getBeat:()=>characterBeat,getTransition:()=>mapTransition,NPCS};soundOn=false;init();})();';
const src=raw[1].replace(/init\(\);\s*\}\)\(\);\s*$/,api);
assert(src.includes('__testAPI'),'Test API injection succeeded');
const noop=()=>{};
const node=(id)=>({
  id,style:{},innerHTML:'',textContent:'',className:'',disabled:false,dataset:{},children:[],
  classList:{add:noop,remove:noop},listeners:{},addEventListener(kind,callback){this.listeners[kind]=callback},click(){this.listeners.click?.()},
  append(...children){this.children.push(...children)},
  appendChild(child){this.children.push(child)},
  setPointerCapture(id){this.captured=id},
  getBoundingClientRect(){return {left:0,top:0,width:128,height:96}},
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
vm.runInNewContext(fs.readFileSync('src/touch-navigation.js','utf8'),context,{timeout:5000,filename:'touch-navigation.js'});
vm.runInNewContext(fs.readFileSync('src/trainer-tactics.js','utf8'),context,{timeout:5000,filename:'trainer-tactics.js'});
vm.runInNewContext(fs.readFileSync('src/companion-bond.js','utf8'),context,{timeout:5000,filename:'companion-bond.js'});
vm.runInNewContext(fs.readFileSync('src/trainer-rematches.js','utf8'),context,{timeout:5000,filename:'trainer-rematches.js'});
vm.runInNewContext(fs.readFileSync('src/story.js','utf8'),context,{timeout:5000,filename:'story.js'});
assert(context.AstraStory,'Story engine was initialized');
assert(context.AstraEngine,'RPG engine was initialized');
vm.runInNewContext(fs.readFileSync('src/creature-art.js','utf8'),context,{timeout:5000,filename:'creature-art.js'});
assert(context.AstraCreatureArt,'Species-specific creature art was loaded');
vm.runInNewContext(fs.readFileSync('src/creature-motion.js','utf8'),context,{timeout:5000,filename:'creature-motion.js'});
assert(context.AstraCreatureMotion,'Per-creature animation profiles loaded');
vm.runInNewContext(fs.readFileSync('src/world-detail.js','utf8'),context,{timeout:5000,filename:'world-detail.js'});
vm.runInNewContext(fs.readFileSync('src/visual-polish.js','utf8'),context,{timeout:5000,filename:'visual-polish.js'});
assert(context.AstraVisualPolish,'Visual polish module available in game harness');
assert(context.AstraWorldDetail,'Tile overlay scene detailing loaded');
vm.runInNewContext(fs.readFileSync('src/map-layout.js','utf8'),context,{timeout:5000,filename:'map-layout.js'});
assert(context.AstraMapLayout,'Hand-authored village and forest layout module loaded');
vm.runInNewContext(fs.readFileSync('src/forest-secrets.js','utf8'),context,{timeout:5000,filename:'forest-secrets.js'});
assert(context.AstraForestSecrets,'Forest exploration puzzle module loaded');
vm.runInNewContext(fs.readFileSync('src/region-puzzles.js','utf8'),context,{timeout:5000,filename:'region-puzzles.js'});
assert(context.AstraRegionPuzzles,'Three region puzzle types are available');
vm.runInNewContext(fs.readFileSync('src/exploration-journal.js','utf8'),context,{timeout:5000,filename:'exploration-journal.js'});
assert(context.AstraExploration,'Exploration notebook is available');
vm.runInNewContext(fs.readFileSync('src/field-requests.js','utf8'),context,{timeout:5000,filename:'field-requests.js'});
assert(context.AstraFieldRequests,'NPC requests and save-compatible branching are loaded');
vm.runInNewContext(fs.readFileSync('src/town-legacy.js','utf8'),context,{timeout:5000,filename:'town-legacy.js'});
assert(context.AstraTownLegacy,'Village Chronicle module is available');
vm.runInNewContext(fs.readFileSync('src/town-workshop.js','utf8'),context,{timeout:5000,filename:'town-workshop.js'});
assert(context.AstraTownWorkshop,'Research workshop is available');
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
// Explore the actual optional forest puzzle using the production interaction handler.
g.get().story.stage=12;
g.get().events.forestSecrets={sequence:0,gateOpen:false,bloomClaimed:false};
context.AstraForestSecrets.prepare(g.maps.forest,g.get().events.forestSecrets);
assert.equal(g.maps.forest[11][5],4,'Overgrown secret passage starts sealed');
for(const [x,y,dir] of [[7,17,'up'],[10,9,'up'],[7,17,'up'],[20,21,'up']]){
 g.switchMap({id:'forest',x,y,dir});
 g.interact();
 g.world();
}
assert.equal(g.get().events.forestSecrets.sequence,3,'Three stones activate in leaf/dew/star sequence');
assert.equal(g.get().events.forestSecrets.gateOpen,true,'Vines retract when all stones are lit');
assert.equal(g.maps.forest[11][5],1,'Hidden route is physically open');
const etherBefore=g.get().bag.ether||0;
g.switchMap({id:'forest',x:3,y:12,dir:'up'});g.interact();
assert.equal(g.get().bag.ether,etherBefore+2,'Hidden alcove grants its own collected item');
assert(g.get().collected['forest/蔦の奥の忘れ物'],'Hidden item persists in collected flags');
assert(context.AstraMapLayout.reachable(g.maps.forest,{x:13,y:26},{x:3,y:11}),'Secret alcove connected to forest after puzzle');
const afterCache=g.get().bag.ether;
assert.equal(g.load(),true,'The current playthrough can be reloaded after puzzle completion');
assert.equal(g.get().events.forestSecrets.gateOpen,true,'Forest passage survives a real save/reload cycle');
assert.equal(g.maps.forest[11][5],1,'A reloaded game restores open thicket collision tile');
assert.equal(g.get().bag.ether,afterCache,'Hidden cache does not duplicate after reload');
assert(g.get().collected['forest/蔦の奥の忘れ物'],'Hidden cache obtained flag survives save migration');
const flower=g.NPCS.forest.find(x=>x.kind==='nightBloom');
assert(flower);
const firstBloom=g.get().bag.ether;
g.npc(flower,false,1);assert.equal(g.get().bag.ether,firstBloom+2,'Dusk flower rewards two PP restores');
g.world();g.npc(flower,false,2);assert.equal(g.get().bag.ether,firstBloom+2,'Night bloom never gives duplicate items');
assert.match(html,/src\/forest-secrets\.js/,'The forest secrets runtime is bundled');
// Confirm optional puzzles never interrupt the original main traversal before solving.
for(const [id,from,to] of [
 ['lake',{x:1,y:12},{x:28,y:12}],
 ['shrine',{x:9,y:1},{x:9,y:17}],
 ['highland',{x:12,y:1},{x:12,y:27}]
]){
 assert(context.AstraMapLayout.reachable(g.maps[id],from,to),id+' original entry-to-exit crossing remains open');
}
// Real input-level traversal of the three new nonblocking region explorations.
const rp=context.AstraRegionPuzzles;
g.get().story.stage=12;
g.switchMap({id:'lake',x:10,y:13,dir:'down'});
assert.equal(g.maps.lake[9][14],3,'Island path starts below deep water');
g.interact();g.world();
assert(g.get().events.regionPuzzles.lake.lowered,'Lakeside sluice is operated through A/interaction');
assert.equal(g.maps.lake[9][14],13,'Lower water exposes solid stepping stones');
g.switchMap({id:'lake',x:14,y:10,dir:'up'});
g.walk('up');g.walk('up');g.walk('up');
assert.equal(g.get().y,7,'Can walk over the revealed lake path');
const orbBefore=g.get().bag.orb;
g.interact();
assert.equal(g.get().bag.orb,orbBefore+4,'Island cache grants four orbs');
g.world();
g.switchMap({id:'shrine',x:5,y:8,dir:'up'});
g.interact();g.world();
g.switchMap({id:'shrine',x:14,y:13,dir:'up'});
g.interact();g.world();
g.switchMap({id:'shrine',x:14,y:8,dir:'up'});
g.interact();g.world();
assert(g.get().events.regionPuzzles.shrine.open,'Ordered moon-wind-star pillars unlock shrine room');
assert.equal(g.maps.shrine[rp.SHRINE.gate.y][rp.SHRINE.gate.x],13);
g.switchMap({id:'shrine',x:14,y:8,dir:'right'});
g.walk('right');g.walk('right');g.walk('up');
assert.equal(g.get().x,16,'The shrine door really permits passage');
assert.equal(g.get().y,7,'Inner shrine path reaches the altar');
const etherBeforeRelic=g.get().bag.ether;
g.get().dir='right';g.interact();
assert.equal(g.get().bag.ether,etherBeforeRelic+3,'Ancient altar grants three PP restoratives');
g.world();
g.switchMap({id:'highland',x:9,y:10,dir:'down'});
g.interact();g.world();
const beforeCharm=g.get().bag.speedCharm;
for(const [x,y,dir,turns] of [[8,13,'up',2],[14,13,'up',2],[14,8,'up',2]]){
 g.switchMap({id:'highland',x,y,dir});
 for(let k=0;k<turns;k++){g.interact();g.world()}
}
assert(g.get().events.regionPuzzles.highland.solved,'All three mirrors align to complete a constellation');
assert.equal(g.get().bag.speedCharm,beforeCharm+1,'Alignment grants one speed charm');
for(const id of ['lake','shrine','highland']){
 g.switchMap({id,x:id==='lake'?12:10,y:12,dir:'up'});
 g.drawRegionPuzzles(0,0);
}
const regionalBag={orb:g.get().bag.orb,ether:g.get().bag.ether,speedCharm:g.get().bag.speedCharm};
assert.equal(g.load(),true,'Save/reload works after all regional puzzles');
assert(g.get().events.regionPuzzles.lake.cacheTaken);
assert(g.get().events.regionPuzzles.shrine.cacheTaken);
assert(g.get().events.regionPuzzles.highland.solved);
assert.equal(g.maps.lake[9][14],13,'Lake remains lowered after reload');
assert.equal(g.maps.shrine[rp.SHRINE.gate.y][rp.SHRINE.gate.x],13,'Shrine remains unlocked after reload');
for(const [key,value] of Object.entries(regionalBag))assert.equal(g.get().bag[key],value,'No duplication across reload: '+key);
assert.match(html,/src\/region-puzzles\.js/,'Regional exploration engine is deployed');
// Full menu-level discovery notebook and progressive, player-controlled hints.
g.openPage('gear');
let options=nodes.get('console').children.at(-1).children.map(b=>b.textContent);
assert(options.some(label=>label.includes('探索手帳')),'Astra Gear exposes the exploration notebook');
g.openPage('exploration');
assert.equal(g.get().menuPage,'exploration');
let box=nodes.get('console').children,ops=box.at(-1).children.map(b=>b.textContent);
assert(ops.some(label=>label.includes('月影の森'))&&ops.some(label=>label.includes('青凪の湖畔')),'All discoveries appear in the gear notebook');
g.explorationDetail('lake',0);
box=nodes.get('console').children;
let clue=box.at(-2).textContent;
assert.doesNotMatch(clue,/10,14/,'First-tier clues do not spoil puzzle coordinates');
assert.match(clue,/【見つけた記録】/,'Exploration details show confirmed discoveries');
assert.match(clue,/【次の調査】/,'Player receives next-action guidance');
assert.match(html,/function drawExplorationScreen\(/,'Dedicated top-screen atlas rendering is shipped');
assert.match(html,/drawExplorationScreen\(\)/,'Atlas is integrated with the main render loop');
g.explorationDetail('lake',2);
box=nodes.get('console').children;
clue=box.at(-2).textContent;
assert.match(clue,/10,14/,'Full directions are displayed only when explicitly requested');
assert.match(clue,/探索完了/,'Notebook displays completion from saved regional progress');
g.buttonB();assert.equal(g.get().menuPage,'exploration','B from a hint returns to notebook');
g.buttonB();assert.equal(g.get().menuPage,'gear','B from notebook returns to Astra Gear');
g.buttonB();assert.equal(g.get().menuPage,'home','B from Gear returns to the main menu');
assert.equal(context.AstraExploration.summary(g.get()).length,4);
assert(context.AstraExploration.nearby('lake',10,13,g.NPCS.lake,n=>true)?.direct,'A prompt indicates nearby explorable controls');
assert.match(html,/src\/exploration-journal\.js/,'Exploration notebook is included in HTML');
// NPC-level request dialogue, atlas menus and real game reward mutation.
g.get().story.stage=12;
g.get().visited={...g.get().visited,village:true,forest:true,lake:true,highland:true};
const fieldRequests=context.AstraFieldRequests;
g.openPage('gear');
options=nodes.get('console').children.at(-1).children.map(b=>b.textContent);
assert(options.some(s=>s.includes('地域の依頼')),'Astra Gear exposes the regional letters');
g.openPage('requests');
assert.equal(g.get().menuPage,'requests');
g.drawRequestBoard();
assert.equal(element('screenShell').dataset.preview,'true','Request board takes over upper screen');
box=nodes.get('console').children;
ops=box.at(-1).children.map(b=>b.textContent);
assert(ops.some(s=>s.includes('夜の花の便り')),'Visited request is listed');
g.requestDetail('lake');
assert.equal(g.get().menuPage,'requestDetail');
g.buttonB();
assert.equal(g.get().menuPage,'requests','B from letter detail returns to request list');
g.buttonB();
assert.equal(g.get().menuPage,'gear','B from request list returns to gear');
for(const request of fieldRequests.REQUESTS){
 const character=g.NPCS[request.map].find(n=>n.requestId===request.id);
 assert(character,request.id+' has a world NPC');
 g.npc(character);
 assert.match(nodes.get('console').children.at(-2).textContent,/【依頼】/,'Talk NPC offers a proper mission');
 assert.equal(g.acceptFieldRequest(request.id),true,'NPC can accept '+request.id);
 assert.equal(fieldRequests.entry(request.id,g.get()).status,'ready','Already-solved puzzles count retroactively');
 const choice=request.id==='lake'?'coins':'supply';
 const item=request.choices.find(r=>r.id===choice).item;
 const stock=item?(g.get().bag[item]||0):g.get().money;
 assert.equal(g.claimFieldRequest(request.id,choice),true,'NPC can pay for completed '+request.id);
 const delta=request.choices.find(r=>r.id===choice);
 assert.equal(item?g.get().bag[item]:g.get().money,stock+(item?delta.count:delta.money),'Chosen reward reaches real inventory');
 assert.equal(g.claimFieldRequest(request.id,choice),false,'No duplicate reward on repeated button press');
 g.world();
 g.npc(character);
 assert.equal(fieldRequests.entry(request.id,g.get()).status,'complete','NPC remembers completion');
 g.world();
}
const completedMoney=g.get().money,completedBag={...g.get().bag};
assert.equal(g.load(),true,'Request progress survives a real save and reload');
assert(fieldRequests.summary(g.get()).every(x=>x.status==='complete'));
assert.equal(g.get().money,completedMoney);
for(const [item,count] of Object.entries(completedBag))assert.equal(g.get().bag[item],count,'Inventory persists without duplicate quest payout');
assert.match(html,/src\/field-requests\.js/,'Request runtime is included in the shipped game');
assert.match(html,/drawRequestBoard/,'Dedicated request board rendering is included in the game');
// Complete the linked town chronicle after all four regional reports.
const chronicle=context.AstraTownLegacy;
assert.equal(chronicle.snapshot(g.get()).count,4);
assert.equal(chronicle.snapshot(g.get()).status,'available');
const archivist=g.NPCS.village.find(n=>n.kind==='townArchivist');
assert(archivist,'A new resident joins the restored town');
assert.equal(archivist.x,13);
assert.equal(archivist.y,12);
assert.equal(g.maps.village[12][13],1,'Archivist stands on the established open town square');
assert(g.isNpcVisible(archivist),'Archivist appears after sufficient regional reports');
assert(context.AstraMapLayout.reachable(g.maps.village,{x:11,y:1},{x:12,y:12}),'Northern village gate can approach the archivist');
g.world();
g.openPage('gear');
options=nodes.get('console').children.at(-1).children.map(b=>b.textContent);
assert(options.some(s=>s.includes('町の記録祭')),'Gear links to the town restoration chronicle');
g.openPage('townLegacy');
assert.equal(g.get().menuPage,'townLegacy');
assert.equal(element('screenShell').dataset.preview,'true');
g.drawTownRecordPage();
g.buttonB();assert.equal(g.get().menuPage,'gear','B returns town chronicle to gear');
g.world();
g.npc(archivist);
assert.match(nodes.get('console').children.at(-2).textContent,/星の記録を完成/);
assert.equal(g.acceptTownLegacy(),true);
assert.equal(chronicle.snapshot(g.get()).status,'ready','Old exploration reports count toward linked story');
const townMoney=g.get().money,oldCharm=g.get().bag.guardCharm;
assert.equal(g.finishTownLegacy(),true,'Archivist festival can be concluded');
assert.equal(g.get().money,townMoney+600);
assert.equal(g.get().bag.guardCharm,oldCharm+1);
assert.equal(chronicle.snapshot(g.get()).tier,5);
assert.equal(g.finishTownLegacy(),false,'Finishing twice cannot duplicate rewards');
const festivalSave=JSON.stringify(g.get().events.townLegacy);
g.switchMap({id:'village',x:12,y:13,dir:'up'});
g.drawTownLegacy(0,0);
assert.equal(g.load(),true,'Festival state persists across real save reload');
assert.equal(JSON.stringify(g.get().events.townLegacy),festivalSave);
assert.equal(g.get().money,townMoney+600);
assert.equal(g.get().bag.guardCharm,oldCharm+1);
assert.equal(chronicle.snapshot(g.get()).status,'complete');
assert.match(chronicle.citizenText('traveler',g.get()),/記録祭/);
assert(html.includes('src/town-legacy.js'),'Town module is present in the HTML bundle');
// Workshop opens by actual town completion, without changing existing exits.
const workshop=context.AstraTownWorkshop;
assert.equal(workshop.townTier(g.get()),5);
assert.equal(g.maps.village[8][3],6,'Workshop doorway exists at the western corner');
assert.equal(g.maps.workshop[10][7],6,'Workshop has return door to town');
assert.equal(g.maps.archive[12][8],6,'Archive has an accessible return door');
assert(context.AstraMapLayout.reachable(g.maps.village,{x:11,y:1},{x:3,y:9}),
 'Village gate reaches workshop while preserving original walking routes');
g.switchMap({id:'village',x:3,y:9,dir:'up'});g.walk('up');
assert.equal(g.get().map,'workshop','West town door enters the actual workshop room');
g.drawInteriorSet(0,0);
const vendor=g.NPCS.workshop.find(n=>n.kind==='workshop');
assert(vendor,'Workshop has an interactive specialist');
g.npc(vendor);
assert.equal(g.get().scene,'shop');
assert.match(nodes.get('console').children.at(-2).textContent,/レシピ/,'Workshop menu lists unlocked recipes');
g.get().bag.orb=4;g.get().bag.potion=4;
const oldOrb=g.get().bag.orb,oldPotion=g.get().bag.potion,oldEther=g.get().bag.ether;
g.workshopRecipe('restore');
assert.match(nodes.get('console').children.at(-2).textContent,/星玉×1/);
assert.equal(g.craftWorkshop('restore'),true,'Materials are consumed by real UI action');
assert.equal(g.get().bag.orb,oldOrb-1);
assert.equal(g.get().bag.potion,oldPotion-1);
assert.equal(g.get().bag.ether,oldEther+1);
assert.equal(g.get().scene,'dialog');
g.world();
g.switchMap({id:'workshop',x:12,y:7,dir:'up'});g.walk('up');
assert.equal(g.get().map,'archive','Festival opens a new traversable room');
g.drawInteriorSet(0,0);
const panels=g.NPCS.archive.filter(n=>n.kind==='archivePanel');
assert.equal(panels.length,3);
for(const panel of panels){g.npc(panel);g.world();}
assert.equal(workshop.PANELS.filter(k=>workshop.archiveState(g.get()).panels[k]).length,3);
const vault=g.NPCS.archive.find(n=>n.kind==='archiveCache'),beforeMoney=g.get().money, beforePower=g.get().bag.powerCharm, beforePP=g.get().bag.ether;
g.npc(vault);
assert.equal(g.get().money,beforeMoney+300);
assert.equal(g.get().bag.powerCharm,beforePower+1);
assert.equal(g.get().bag.ether,beforePP+3);
g.world();g.npc(vault);
assert.equal(g.get().money,beforeMoney+300,'Repeating interaction cannot duplicate cache');
assert.equal(g.load(),true);
assert.equal(g.get().money,beforeMoney+300,'Vault rewards persist across save reload');
assert.equal(g.get().bag.powerCharm,beforePower+1);
assert(workshop.archiveState(g.get()).claimed,'Archive completion persisted');
assert(html.includes('src/town-workshop.js'),'New module is in the published HTML');
const locked={...g.get(),story:{...g.get().story,stage:11}};
assert.equal(workshop.townTier(locked),0,'Workshop cannot open during the scripted prologue');
const preFestival={...g.get(),events:{...g.get().events,townLegacy:{accepted:true,claimed:false}}};
assert.equal(workshop.archiveUnlocked(preFestival),false,'Archive requires the whole festival');

const restoredEvents=JSON.parse(JSON.stringify(g.get().events));
const restoredStage=g.get().story.stage;
g.get().events={};g.get().story.stage=12;
g.switchMap({id:'village',x:3,y:9,dir:'up'});g.walk('up');
assert.equal(g.get().map,'village','Workshop door stays closed before two completed reports');
g.get().events=JSON.parse(JSON.stringify(restoredEvents));
g.get().events.townLegacy.claimed=false;
g.switchMap({id:'workshop',x:12,y:7,dir:'up'});g.walk('up');
assert.equal(g.get().map,'workshop','Archive door stays closed before completing festival');
g.get().events=restoredEvents;g.get().story.stage=restoredStage;g.world();

// Quality parity: walk-with-friend actions, voluntary rematches and manual technique decisions.
g.get().story.stage=12;
g.switchMap({id:'route',x:11,y:22,dir:'up'});
g.world();
let actionLabels=nodes.get('console').children.at(-1).children.map(b=>b.textContent);
assert(actionLabels.some(s=>s.includes('連れ歩き')),'A quick companion interaction is available from the field');
const friend=g.get().party[0],startFriendship=friend.friendship;
g.talkToCompanion();
assert.match(nodes.get('console').children.at(-2).textContent,/一緒に歩いている/);
g.companionAction('pet');
assert(friend.friendship>=startFriendship,'Petting never reduces friendship');
const afterFirstPet=friend.friendship;
g.companionAction('pet');
assert.equal(friend.friendship,afterFirstPet,'No repeated friendship farming');
g.world();
const trainingNPC=g.NPCS.route.find(n=>n.kind==='trainer');
assert(trainingNPC);
const key='route/'+trainingNPC.name;
g.get().defeated[key]=true;
g.get().steps=Math.max(130,g.get().steps);
g.get().events.trainerRematches={[key]:{wins:0,lastStep:0}};
g.npc(trainingNPC);
actionLabels=nodes.get('console').children.at(-1).children.map(b=>b.textContent);
assert(actionLabels.some(t=>t.includes('再戦する')),'Previously defeated trainers now offer optional rematches');
const firstRematch=nodes.get('console').children.at(-1).children.find(b=>b.textContent.includes('再戦する'));
firstRematch.click();
assert.equal(g.get().scene,'battle');
assert.equal(g.get().battle.rematch,true);
assert.equal(g.get().battle.enemies[0].level,trainingNPC.party[0][1]+2,'First rematch raises opponents by two levels');
assert(g.enemyMove(g.get().battle.enemies[0]),'Trainer tactical selector returns valid action');
// Simulate an ordinary battle awarding a new move to a fully trained four-slot creature.
friend.id='flamio';friend.level=11;friend.xp=0;
friend.moves=['ひっかく','ひのこ','たいあたり','きあいだめ'];
friend.pp={ひっかく:7,ひのこ:8,たいあたり:10,きあいだめ:4};
g.startBattle([g.makeMonster('koro',11)],{trainer:false});
g.defeatEnemy();
let controls=nodes.get('console').children.at(-1).children;
assert(controls.some(b=>b.textContent.includes('つづける')),'Experience is displayed before learning');
controls.find(b=>b.textContent.includes('つづける')).click();
controls=nodes.get('console').children.at(-1).children;
assert(controls.some(b=>b.textContent.includes('たいあたり を忘れる')),'Four learned moves are offered for deliberate replacement');
assert(friend.moves.includes('たいあたり'),'Existing move is never silently dropped');
controls.find(b=>b.textContent.includes('たいあたり を忘れる')).click();
assert(friend.moves.includes('ほのおのうず')&&!friend.moves.includes('たいあたり'),'User choice determines the forgotten move');
controls=nodes.get('console').children.at(-1).children;
controls.find(b=>b.textContent.includes('つづける')).click();
assert.equal(g.get().battle,null,'Battle finishes normally after the learning choice');
g.world();
assert(html.includes('src/trainer-tactics.js')&&html.includes('src/companion-bond.js')&&html.includes('src/trainer-rematches.js'),'New battle/companion modules are shipped');

// v0.26: D-pad now navigates every menu and remains independent of the A button.
g.openPage('home');
let controlsV26=element('console').children.at(-1).children;
assert.equal(controlsV26[0].dataset.selected,'true','Default menu focus is visibly marked');
g.navigateMenu('right');
assert.equal(controlsV26[1].dataset.selected,'true','Right navigates to inventory');
g.buttonA();
assert.equal(g.get().menuPage,'bag','A confirms the highlighted option, not always first');
g.openPage('home');
const padV26=element('#dpad');
const touchV26=(pointerId,x,y)=>({pointerId,clientX:x,clientY:y,preventDefault(){}});
assert(padV26.listeners.pointerdown&&padV26.listeners.pointermove,'D-pad captures drag and change events');
padV26.listeners.pointerdown(touchV26(7,64,6));
padV26.listeners.pointermove(touchV26(7,64,88));
padV26.listeners.pointermove(touchV26(7,120,48));
controlsV26=element('console').children.at(-1).children;
assert.equal(controlsV26[3].dataset.selected,'true','Sliding thumb from down to right switches selection');
padV26.listeners.pointerup(touchV26(7,120,48));
g.buttonA();
assert.equal(g.get().menuPage,'gear','Physical A activates the slide-selected menu option');
g.world();
// Battle touchscreen exposes type advantage without executing a move.
g.startBattle([g.makeMonster('leafin',5)],{trainer:false});
g.chooseMove();
const moveButtonsV26=element('console').children.at(-1).children;
assert(moveButtonsV26.some(b=>b.textContent.startsWith('ひのこ ')&&b.dataset.matchup==='strong'),'Move palette marks a real super-effective skill');
assert(html.includes('src/touch-navigation.js'),'Input module is loaded in HTML');
assert(html.includes('data-matchup="strong"'),'Move effectiveness has a visible UI style');
g.drawBattle();
g.get().battle=null;g.world();
console.log('PASS: touchscreen UI, battle effects, faint/intro animation, all biomes, character directions and saves');
