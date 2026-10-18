/* ASTRA TALES — time-of-day schedules and collision-safe NPC routing.
 * Four cardinal movements, no teleportation, no external assets.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraSchedules=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SCHEDULES={
 village:{
  '花の世話人':[
   {x:21,y:12,dir:'down',action:'watering',label:'花の手入れ'},
   {x:19,y:12,dir:'left',action:'resting',label:'休憩'},
   {x:21,y:12,dir:'up',action:'lantern',label:'夜の見回り'}],
  '旅人':[
   {x:18,y:11,dir:'up',action:'reading',label:'地図を確認'},
   {x:20,y:11,dir:'left',action:'resting',label:'夕陽を眺める'},
   {x:18,y:11,dir:'up',action:'lantern',label:'夜の旅支度'}]
 },
 route:{
  '散歩人':[
   {x:8,y:19,dir:'right',action:'walking',label:'散歩'},
   {x:9,y:18,dir:'down',action:'resting',label:'夕暮れの休憩'},
   {x:8,y:19,dir:'up',action:'lantern',label:'夜道を照らす'}]
 },
 forest:{
  '森の薬草師':[
   {x:8,y:16,dir:'down',action:'gathering',label:'薬草を採る'},
   {x:10,y:16,dir:'right',action:'reading',label:'採取記録'},
   {x:8,y:16,dir:'up',action:'lantern',label:'夜の見回り'}]
 },
 lake:{
  '湖の散歩人':[
   {x:9,y:20,dir:'up',action:'watching',label:'鳥を観察'},
   {x:11,y:20,dir:'left',action:'resting',label:'湖を眺める'},
   {x:9,y:20,dir:'up',action:'lantern',label:'星を観察'}]
 },
 highland:{
  '山の旅人':[
   {x:20,y:23,dir:'left',action:'reading',label:'登山地図'},
   {x:18,y:23,dir:'left',action:'resting',label:'休憩'},
   {x:20,y:23,dir:'up',action:'lantern',label:'星を観察'}]
 }
};
const BLOCKED=new Set([3,4,5,8,9,11]);
function resolve(map,name,phase){
 const entries=SCHEDULES[map]?.[name];
 if(!entries)return null;
 const index=phase===2?2:phase===1?1:0;
 return {...entries[index]};
}
function isPassable(tiles,x,y,blocked=BLOCKED,occupied=null){
 if(!Array.isArray(tiles)||!tiles[y]||x<0||x>=tiles[y].length||blocked.has(tiles[y][x]))return false;
 if(occupied&&occupied.has(x+','+y))return false;
 return true;
}
function direction(dx,dy){return dx<0?'left':dx>0?'right':dy<0?'up':'down'}
function nextStep(tiles,from,to,occupied=new Set(),blocked=BLOCKED){
 if(!from||!to)return null;
 const sx=from.x,sy=from.y,tx=to.x,ty=to.y;
 if(sx===tx&&sy===ty)return {x:sx,y:sy,dir:to.dir||'down',arrived:true};
 if(!isPassable(tiles,sx,sy,blocked))return null;
 if(!isPassable(tiles,tx,ty,blocked,occupied))return null;
 const q=[[sx,sy,-1]],seen=new Set([sx+','+sy]),D=[[0,-1,'up'],[1,0,'right'],[0,1,'down'],[-1,0,'left']];
 let end=-1;
 for(let head=0;head<q.length;head++){
  if(q[head][0]===tx&&q[head][1]===ty){end=head;break}
  for(const [dx,dy] of D){
   const x=q[head][0]+dx,y=q[head][1]+dy,key=x+','+y;
   if(seen.has(key)||!isPassable(tiles,x,y,blocked,occupied))continue;
   seen.add(key);q.push([x,y,head]);
  }
 }
 if(end<0)return null;
 while(q[end][2]>0)end=q[end][2];
 const [x,y]=q[end];
 return {x,y,dir:direction(x-sx,y-sy),arrived:false,distance:q.length};
}
return Object.freeze({SCHEDULES,BLOCKED,resolve,isPassable,nextStep});
});
