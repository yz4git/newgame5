'use strict';
/* End-to-end test of the real browser game and its chapter transitions. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const srcHTML=fs.readFileSync('index.html','utf8');
const match=srcHTML.match(/<script>([\s\S]*?)<\/script>/);
assert(match,'Main script exists');
const exposed='globalThis.__introTest={get:()=>state,walk,interact,world,load,save,startBattle,defeatEnemy,beginIntro,npc,foe,maps,NPCS,throwOrb,battleBag,cinematicFrame,getBeat:()=>characterBeat};soundOn=false;init();})();';
const script=match[1].replace(/init\(\);\s*\}\)\(\);\s*$/,exposed);
assert(script.includes('__introTest'),'Test runtime was injected');
const noop=()=>{};
function createNode(id){
 const el={id,style:{},className:'',textContent:'',disabled:false,hidden:false,dataset:{},children:[],listeners:{},scrollTop:0,
  classList:{add:noop,remove:noop},
  addEventListener(k,fn){this.listeners[k]=fn},
  setAttribute(key,value){this[key]=value},
  append(...elements){this.children.push(...elements)},
  appendChild(child){this.children.push(child)},
  click(){this.listeners.click?.()},
  querySelector(selector){
   if(selector==='.options button:not(:disabled)'){
    const ops=this.children.find(n=>n.className==='options');
    return ops?.children.find(n=>!n.disabled)||null;
   }
   return null;
  },
  getContext(){return canvasContext}
 };
 let inner='';
 Object.defineProperty(el,'innerHTML',{get:()=>inner,set:v=>{inner=v;el.children=[]}});
 return el;
}
const canvasContext=new Proxy({}, {
 get(_,k){if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop:noop});return noop},
 set(){return true}
});
const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,createNode(id));return nodes.get(id)};
const document={getElementById:node,querySelector:node,querySelectorAll:()=>[],createElement:()=>createNode('dynamic'),addEventListener:noop};
const storage={},timers=[];
const context={document,window:{addEventListener:noop},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},
 performance:{now:()=>50000},requestAnimationFrame:noop,clearTimeout:noop,setTimeout:fn=>{timers.push(fn);return timers.length}};
context.globalThis=context;
for(const file of ['src/rpg-engine.js','src/touch-navigation.js','src/trainer-tactics.js','src/companion-bond.js','src/trainer-rematches.js','src/story.js','src/creature-art.js','src/creature-motion.js','src/battle-direction.js','src/world-detail.js','src/terrain-composition.js','src/building-profile.js','src/visual-polish.js','src/map-layout.js','src/forest-secrets.js','src/region-puzzles.js','src/exploration-journal.js','src/field-requests.js','src/town-legacy.js','src/town-workshop.js','src/battle-backdrops.js','src/field-sprites.js','src/npc-schedules.js','src/cinematics.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),context,{timeout:6000,filename:file});
vm.runInNewContext(script,context,{timeout:6000,filename:'game.js'});
const g=context.__introTest;assert(g);
// Movement reachability protects the actual chapter route from impassable tiles.
function hasPath(map,from,to){
 const tiles=g.maps[map],w=tiles[0].length,h=tiles.length,blocked=new Set([3,4,5,8,9,11]);
 const npcs=g.NPCS[map]||[], occupied=new Set(npcs.map(n=>n.x+','+n.y));
 let queue=[from],head=0;const visited=new Set([from.join(',')]);
 while(head<queue.length){
  const [x,y]=queue[head++];
  if(x===to[0]&&y===to[1])return true;
  for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){
   const px=x+dx,py=y+dy,key=px+','+py;
   if(px<0||py<0||px>=w||py>=h||visited.has(key)||blocked.has(tiles[py][px])||occupied.has(key))continue;
   visited.add(key);queue.push([px,py]);
  }
 }
 return false;
}
assert(hasPath('lake',[1,12],[19,19]),'Lake route must reach observatory entrance');
assert(hasPath('village',[20,18],[9,18]),'House connects to laboratory through village path');
assert(hasPath('lab',[8,11],[8,6]),'Lab exit connects to professor desk');
assert(hasPath('route',[11,24],[11,1]),'Winding route connects village and forest');
assert(hasPath('route',[11,24],[22,12]),'Eastern fork still connects to lakeside');
assert(hasPath('forest',[13,26],[13,1]),'Winding woodland paths connect both exits');
assert(hasPath('forest',[13,26],[19,17]),'Forest northern and eastern branch remains navigable');
assert(hasPath('highland',[12,27],[12,1]),'Alpine terraces connect shrine and summit');
assert(hasPath('highland',[12,27],[18,20]),'Highland trial region is reachable');
assert(g.maps.highland.some(row=>row.includes(13)),'Alpine trail contains actual traversable stairs');


function select(index=0){
 const options=node('console').children.find(x=>x.className==='options');
 const buttons=options?.children||[];
 assert(buttons[index],'Expected option '+index+' (scene '+g.get().scene+')');
 assert(!buttons[index].disabled,'Option '+index+' is disabled');
 buttons[index].click();
}
function finishDialog(){
 let count=0;
 while(g.get().scene==='dialog'){
  if(count++>50)throw Error('Story dialogue did not terminate');
  select(0);
 }
}
function expect(stage,map){
 assert.equal(g.get().story.stage,stage,'Expected chapter '+stage);
 assert.equal(g.get().map,map,'Expected map '+map);
}
function stand(x,y,d='up'){g.get().x=x;g.get().y=y;g.get().dir=d;g.world()}
assert.equal(g.get().scene,'title');
select(0);assert.equal(g.get().scene,'starter','New game opens prologue, not starter selection');
const nameEntry=node('console').children.find(n=>n.className==='name-entry');
assert(nameEntry&&nameEntry.children.length===2,'Custom name input is available');
nameEntry.children[0].value='サクラ';
nameEntry.children[1].click();
finishDialog();expect(0,'bedroom');
assert.equal(g.get().story.playerName,'サクラ','Custom player name persists');
assert(storage['astra-tales-v1'],'Story saves before a starter joins');
g.walk('down');g.walk('down');finishDialog();expect(1,'home');
stand(7,5);g.interact();assert.equal(g.getBeat()?.name,'家族のミドリ','Mother approaches during dialogue');assert.equal(g.cinematicFrame()?.name,'家族のミドリ');finishDialog();expect(2,'home');
stand(7,9,'down');g.walk('down');expect(2,'village');
stand(9,18);g.walk('up');expect(2,'lab');
stand(8,6);g.interact();finishDialog();expect(3,'lab');
stand(6,8,'left');g.interact();
assert.equal(g.get().scene,'dialog','Starter terminal asks for confirmation');
select(0);finishDialog();expect(4,'lab');
assert.equal(g.get().party.length,1);
assert.equal(g.get().story.starterId,'flamio');
stand(8,11,'down');g.walk('down');assert.equal(g.getBeat()?.name,'研究助手','Lab assistant steps up to guide departure');finishDialog();expect(5,'village');
assert.equal(g.get().bag.potion,4,'Assistant gives three potions');
stand(20,18);g.walk('up');expect(5,'home');
stand(7,5);g.interact();finishDialog();expect(6,'home');
assert.equal(g.get().story.gear,true,'Family gives touch gear');
stand(7,9,'down');g.walk('down');expect(6,'village');
stand(11,0);g.walk('up');finishDialog();expect(7,'route');
stand(23,12,'right');g.walk('right');expect(7,'lake');
stand(19,19);g.walk('up');expect(7,'observatory');
stand(7,5);g.interact();assert.equal(g.getBeat()?.name,'観測者 ユラ','Observer is staged for the parcel handoff');finishDialog();expect(8,'observatory');
assert.equal(g.get().story.parcel,true);
assert.equal(g.get().story.dex,true);
assert.equal(!!g.get().events.emergencyCall,false,'Emergency call should not play indoors');
stand(7,9,'down');g.walk('down');assert.equal(g.get().scene,'dialog','Emergency call arrives after exiting hut');finishDialog();expect(8,'lake');assert.equal(g.get().events.emergencyCall,true);
stand(0,12,'left');g.walk('left');expect(8,'route');
stand(11,25,'down');g.walk('down');expect(9,'route');assert.equal(g.getBeat()?.name,'謎の旅人','Rival visibly walks into the encounter');assert.equal(g.getBeat()?.map,'route','Rival is staged only in the correct map');
finishDialog();
assert.equal(g.get().scene,'battle','Rival challenges at town entrance');
assert.equal(g.foe().id,'aquill','Rival chooses advantaged creature');
g.foe().hp=0;g.defeatEnemy();
for(let i=0;i<80&&g.get().story.stage===9&&timers.length;i++)timers.shift()();
finishDialog();expect(10,'route');
stand(11,25,'down');g.walk('down');expect(10,'village');
stand(9,18);g.walk('up');expect(10,'lab');
stand(8,6);g.interact();finishDialog();expect(10,'lab');
assert.equal(g.get().events.inspectionComplete,undefined,'Professor waits for the investigation');
stand(6,7,'left');g.interact();assert.equal(g.get().scene,'dialog','Investigator asks for rival identity');
select(0);finishDialog();
assert.equal(g.get().story.rivalName,'カイ','Rival name is stored');
assert.equal(g.get().events.inspectionComplete,true,'Investigation is completed');
stand(8,6);g.interact();finishDialog();expect(11,'lab');
assert.equal(g.get().story.parcel,false,'Quest item delivered');
stand(8,11,'down');g.walk('down');expect(11,'village');
stand(14,14);g.interact();finishDialog();expect(11,'village');
assert.equal(g.get().scene,'battle','Capture tutorial launches a real battle');
assert.equal(g.get().battle.tutorial,true);
assert.equal(g.get().bag.orb,5,'Capture tutorial grants five orbs');
g.battleBag();g.throwOrb();
for(let i=0;i<90&&g.get().scene==='battle'&&timers.length;i++)timers.shift()();
assert.equal(g.get().story.stage,12,'Catching tutorial completes on actual capture');
finishDialog();expect(12,'village');
assert.equal(g.get().party.length,2,'Practice catch joins party');
assert.equal(g.get().bag.orb,4,'Practice orb was consumed');
g.interact();assert.equal(g.get().bag.orb,4,'Lesson reward is not duplicated');
finishDialog();
assert.equal(context.AstraStory.canWarp(g.get().story,'route','forest').allowed,true);
assert(storage['astra-tales-v1'],'Final story progress is saved');
assert.equal(g.load(),true,'Chapter state can reload');
expect(12,'village');
console.log('PASS: prologue, home, starter, research trip, phone call, rival, return, catch tutorial, gates and persistence');
