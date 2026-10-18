/* ASTRA TALES: hand-authored district / forest path topology.
 * Collision maps and exits stay stable, while loops and named districts replace
 * a generic cross-road and straight woodland corridor. Pure, dependency-free.
 */
(function(root,factory){
 const m=factory();if(typeof module!=='undefined'&&module.exports)module.exports=m;root.AstraMapLayout=m;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SITES={
 village:[
  {id:'north-gate',x:11,y:1},
  {id:'town-square',x:12,y:11},
  {id:'clinic',x:6,y:8},
  {id:'market',x:17,y:8},
  {id:'laboratory',x:9,y:17},
  {id:'home',x:20,y:17},
  {id:'garden',x:3,y:14}
 ],
 forest:[
  {id:'north-gate',x:13,y:1},
  {id:'south-gate',x:13,y:26},
  {id:'ancient-stone',x:9,y:7},
  {id:'western-grove',x:8,y:16},
  {id:'ranger',x:13,y:12},
  {id:'explorer',x:19,y:18},
  {id:'healing-spring',x:13,y:22}
 ]
};
function paint(a,x,y,w,h,t){
 for(let yy=Math.max(0,y);yy<Math.min(a.length,y+h);yy++)
 for(let xx=Math.max(0,x);xx<Math.min(a[yy].length,x+w);xx++)a[yy][xx]=t;
}
function path(a,points,width=3,t=1){
 for(let i=1;i<points.length;i++){
  let {x,y}=points[i-1],x2=points[i].x,y2=points[i].y;
  while(x!==x2||y!==y2){
   paint(a,x-Math.floor(width/2),y-Math.floor(width/2),width,width,t);
   if(x!==x2)x+=Math.sign(x2-x);else y+=Math.sign(y2-y);
  }
  paint(a,x-Math.floor(width/2),y-Math.floor(width/2),width,width,t);
 }
}
function rand(x,y,s=0){
 let n=(Math.imul(x+173,174763)+Math.imul(y+317,92821)+Math.imul(s+419,27427))|0;
 n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;
}
function village(a){
 const h=a.length,w=a[0].length;
 // The entire town becomes three legible quarters connected by a central plaza.
 for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){
  const seed=rand(x,y,12);
  a[y][x]=seed<.22?7:seed<.27?2:0;
 }
 // Northern gate -> trading arcade -> plaza -> residential / research quarters.
 paint(a,10,0,4,14,1);
 paint(a,4,9,17,4,1);
 paint(a,9,10,8,4,1);
 paint(a,6,7,15,3,1);
 paint(a,7,12,6,8,1);
 paint(a,15,11,8,3,1);
 paint(a,17,12,6,8,1);
 paint(a,9,15,13,4,1);
 paint(a,18,9,5,5,1);
 // Civic lawn and the market's pedestrian garden ring.
 paint(a,2,10,3,4,7);
 paint(a,2,13,5,3,7);
 paint(a,18,4,4,5,7);
 paint(a,19,5,3,2,0);
 paint(a,19,7,3,2,1);
 paint(a,2,4,3,5,0);
 // Calm old-town lanes form two loops around the civic quarter.
 path(a,[{x:5,y:9},{x:5,y:13},{x:9,y:13},{x:9,y:16}],2);
 path(a,[{x:18,y:10},{x:21,y:10},{x:21,y:14},{x:20,y:17}],2);
 path(a,[{x:9,y:18},{x:13,y:18},{x:13,y:14},{x:17,y:14}],2);
 // Existing 4 named buildings, identical entry hitboxes and positions.
 paint(a,4,5,4,3,5);paint(a,15,5,4,3,5);
 paint(a,7,14,5,3,5);paint(a,18,14,5,3,5);
 paint(a,6,8,1,1,6);paint(a,17,8,1,1,6);
 paint(a,9,17,1,1,6);paint(a,20,17,1,1,6);
 // Keep a 3-tile apron around every public building entrance.
 paint(a,5,9,3,2,1);paint(a,16,9,3,2,1);
 paint(a,8,17,4,3,1);paint(a,19,17,4,3,1);
 paint(a,6,8,1,1,6);paint(a,17,8,1,1,6);
 paint(a,9,17,1,1,6);paint(a,20,17,1,1,6);
 // Existing fixed NPCs and timed civilian routes remain accessible.
 for(const [x,y] of [[10,12],[14,13],[8,9],[15,9],[18,11],[21,12],[19,12],[20,11],[15,14],[6,12]])a[y][x]=1;
 // A quiet pond is well away from routes (not a new entrance).
 paint(a,2,16,3,2,3);
 // Preserve the canonical northern route gate.
 paint(a,10,0,4,4,1);
}
function forest(a){
 const h=a.length,w=a[0].length;
 // Woods use tree clusters, fern thickets and three distinct clearings.
 for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){
  const rv=rand(x,y,54);
  a[y][x]=rv<.33?4:rv<.76?2:rv<.89?7:0;
 }
 // Two outer loops: west herbalist circuit, east ancient-tree ridge.
 path(a,[{x:13,y:0},{x:13,y:5},{x:10,y:7},{x:7,y:7},{x:7,y:14},{x:9,y:17},{x:13,y:17},{x:13,y:27}],3);
 path(a,[{x:14,y:2},{x:19,y:6},{x:21,y:9},{x:21,y:15},{x:19,y:19},{x:16,y:21},{x:13,y:26}],3);
 // The direct middle traverse and the spring detour cross both loops.
 path(a,[{x:13,y:7},{x:13,y:13},{x:17,y:13},{x:20,y:13}],3);
 path(a,[{x:8,y:16},{x:13,y:16},{x:19,y:18}],3);
 path(a,[{x:13,y:18},{x:13,y:22},{x:17,y:22},{x:19,y:19}],3);
 path(a,[{x:7,y:9},{x:11,y:9},{x:13,y:12}],2);
 path(a,[{x:9,y:22},{x:13,y:22},{x:13,y:27}],3);
 // Distinct readable rooms / destination clearings, not accidental tree mazes.
 paint(a,7,6,5,4,0);
 paint(a,10,11,7,5,0);
 paint(a,16,17,7,5,0);
 paint(a,10,20,7,5,0);
 paint(a,18,8,5,5,7);
 // Forest terrain has two high-grass ambush strips off the main trail.
 paint(a,3,11,4,5,2);paint(a,22,17,3,6,2);
 // Set protected event spots after all stamping.
 for(const [x,y] of [[9,7],[13,12],[19,18],[13,22],[8,16],[10,16],[13,1],[13,26]])a[y][x]=1;
 // Preserve original top and bottom gate collision cells exactly.
 paint(a,12,0,4,3,1);paint(a,12,h-3,4,3,1);
}
function apply(id,tiles){
 if(!tiles?.length||!tiles[0]?.length)return false;
 if(id==='village'){village(tiles);return true}
 if(id==='forest'){forest(tiles);return true}
 return false;
}
function reachable(a,start,end){
 if(!a||!a[start.y]||!a[end.y])return false;
 const walk=t=>![3,4,5,8,9,11].includes(t);
 if(!walk(a[start.y][start.x])||!walk(a[end.y][end.x]))return false;
 const queue=[[start.x,start.y]],seen=new Set([start.x+','+start.y]);
 for(let j=0;j<queue.length;j++){
  const [x,y]=queue[j];if(x===end.x&&y===end.y)return true;
  for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){
   const nx=x+dx,ny=y+dy,key=nx+','+ny;
   if(seen.has(key)||ny<0||ny>=a.length||nx<0||nx>=a[ny].length||!walk(a[ny][nx]))continue;
   seen.add(key);queue.push([nx,ny]);
  }
 }
 return false;
}
return Object.freeze({apply,reachable,SITES,path,paint});
});
