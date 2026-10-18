/* ASTRA TALES — cinematic staging independent from quest state and save data.
 * All character positions here are visual only; no logical NPC or player tile is changed.
 */
(function(root,factory){
 const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraCinematics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const lerp=(a,b,t)=>a+(b-a)*t;
function make({map,name,start,end,focus,duration=1800,hold=true,emote='surprise',facing='down',costume='talk'}={},started=0){
 if(typeof map!=='string'||typeof name!=='string'||!Number.isFinite(start?.x)||!Number.isFinite(start?.y)||!Number.isFinite(end?.x)||!Number.isFinite(end?.y))throw Error('Cinematic requires a map, actor and finite coordinates');
 return {map,name,start:{x:start.x,y:start.y},end:{x:end.x,y:end.y},
   focus:{x:focus?.x??end.x,y:focus?.y??end.y},
   duration:Math.max(200,duration),started,hold:!!hold,emote,facing,costume};
}
function sample(scene,now,map,dialog=false){
 if(!scene||map!==scene.map)return null;
 const t=clamp((now-scene.started)/scene.duration);
 const move=smooth(clamp(t/.68));
 const walk={x:lerp(scene.start.x,scene.end.x,move),y:lerp(scene.start.y,scene.end.y,move)};
 const walking=t<.68,progress=clamp(t/.68);
 const weight=t<.22?smooth(t/.22)*.65:t<.68?.65:(1-smooth((t-.68)/.32))*.65;
 if(t>=1&&(!scene.hold||!dialog))return null;
 return {name:scene.name,x:walk.x,y:walk.y,moving:walking,step:walking?Math.min(7,Math.floor(progress*8)):0,
  focusX:scene.focus.x,focusY:scene.focus.y,cameraWeight:weight,
  emote:scene.emote,facing:scene.facing,costume:scene.costume,
  hold:scene.hold&&t>=1,t};
}
function camera(base,actor){
 if(!actor)return {...base};
 return {
  x:lerp(base.x,actor.focusX,actor.cameraWeight),
  y:lerp(base.y,actor.focusY,actor.cameraWeight)
 };
}
return Object.freeze({make,sample,camera,smooth});
});
