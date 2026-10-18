'use strict';
const assert=require('node:assert/strict');
const R=require('../src/region-puzzles.js');
const passable=t=>![3,4,5,8,9,11].includes(t);
function reachable(a,start,end){
 if(!passable(a[start.y]?.[start.x])||!passable(a[end.y]?.[end.x]))return false;
 const queue=[[start.x,start.y]],seen=new Set([start.x+','+start.y]);
 for(let i=0;i<queue.length;i++){
  const [x,y]=queue[i];if(x===end.x&&y===end.y)return true;
  for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){
   const nx=x+dx,ny=y+dy,key=nx+','+ny;
   if(seen.has(key)||!passable(a[ny]?.[nx]))continue;
   seen.add(key);queue.push([nx,ny]);
  }
 }
 return false;
}
const blank=(w,h)=>Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>x<2||x>=w-2||y<2||y>=h-2?4:1));
const initial=R.normalize(null);
const lake=blank(30,24);
assert(R.prepare('lake',lake,initial));
assert.equal(lake[7][14],3);
assert.equal(reachable(lake,{x:14,y:10},R.LAKE.cache),false,'Island inaccessible with high water');
let step=R.interact(initial,'lake','lever');
assert.equal(step.kind,'unlocked');
assert(step.progress.lake.lowered);
assert(R.prepare('lake',lake,step.progress));
assert.equal(lake[7][14],13);
assert(reachable(lake,{x:14,y:10},R.LAKE.cache),'Lowered water exposes walkable stepping-stones');
assert.equal(R.interact(step.progress,'lake','lever').kind,'done');
let cache=R.interact(step.progress,'lake','lakeCache');
assert.equal(cache.kind,'reward');assert.equal(cache.reward.count,4);
assert.equal(R.interact(cache.progress,'lake','lakeCache').reward,null);
const shrine=blank(20,19);
R.prepare('shrine',shrine,initial);
assert.equal(shrine[7][15],5);
assert.equal(reachable(shrine,{x:10,y:7},R.SHRINE.cache),false,'Stone door blocks optional relic room');
assert.equal(R.interact(initial,'shrine','wind').progress.shrine.progress,0);
assert.match(R.interact(initial,'shrine','tablet').text,/月.*風.*星/);
let q=initial;
for(const [index,id] of ['moon','wind','star'].entries()){
 const t=R.interact(q,'shrine',id);q=t.progress;
 assert.equal(q.shrine.progress,index+1);
}
assert(q.shrine.open);
R.prepare('shrine',shrine,q);
assert.equal(shrine[7][15],13);
assert(reachable(shrine,{x:10,y:7},R.SHRINE.cache),'Pillar puzzle opens actual chamber');
let relic=R.interact(q,'shrine','shrineCache');
assert.equal(relic.reward.item,'ether');assert.equal(relic.reward.count,3);
assert.equal(R.interact(relic.progress,'shrine','shrineCache').reward,null);
const high=blank(26,29);
R.prepare('highland',high,initial);
for(const p of R.HIGHLAND.stars)assert(reachable(high,{x:12,y:25},p),'Constellation mirror reachable');
assert.equal(R.interact(initial,'highland','chart').kind,'hint');
let h=initial;
for(const [i,count] of [[0,2],[1,2],[2,2]]){
 for(let n=0;n<count;n++){const x=R.interact(h,'highland','mirror'+i);h=x.progress}
}
assert(h.highland.solved,'Three aligned mirror orientations solve star path');
assert.deepEqual(h.highland.angles,[1,0,3]);
assert.equal(R.interact(h,'highland','mirror1').reward,null,'No duplicate star reward');
const restored=R.normalize(JSON.parse(JSON.stringify({lake:cache.progress.lake,shrine:relic.progress.shrine,highland:h.highland})));
assert(restored.lake.cacheTaken&&restored.shrine.cacheTaken&&restored.highland.solved);
assert(R.prepare('lake',lake,restored));assert(R.prepare('shrine',shrine,restored));
assert.equal(lake[7][14],13);assert.equal(shrine[7][15],13);
assert.equal(R.prepare('forest',high,initial),false,'Unrelated areas unaffected');
console.log('PASS: tide island crossing, shrine 3-symbol sequence, 3-mirror constellation, rewards and persistent regional tiles');
