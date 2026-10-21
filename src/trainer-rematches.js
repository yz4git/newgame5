/* ASTRA TALES — voluntary trainer rematches after a walking cooldown.
 * Battle rewards scale moderately; undefeated trainers remain unchanged.
 */
(function(root,factory){
 const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraRematches=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const STEP_GAP=70,MAX_BONUS=8;
function record(key,save){
 const x=save?.events?.trainerRematches?.[key],raw=x&&typeof x==='object'?x:{};
 return {wins:Math.max(0,Math.min(50,Math.trunc(Number(raw.wins)||0))),
  lastStep:Math.max(0,Math.trunc(Number(raw.lastStep)||0))};
}
function status(key,save){
 if(!save?.defeated?.[key])return {unlocked:false,ready:false,remaining:STEP_GAP,wins:0};
 const old=record(key,save),steps=Math.max(0,Math.trunc(Number(save.steps)||0));
 const gap=Math.max(0,STEP_GAP-(steps-old.lastStep));
 return {unlocked:true,ready:gap===0,remaining:gap,wins:old.wins};
}
function lineup(npc,key,save){
 const s=status(key,save);
 if(!s.ready)return null;
 const bonus=Math.min(MAX_BONUS,2+s.wins*2);
 return {party:npc.party.map(([id,level])=>[id,Math.min(100,level+bonus)]),
  reward:Math.floor((npc.reward||200)*(1+.3*(1+s.wins))),
  bonus};
}
function markWin(key,save,rematch=false){
 const current=record(key,save),step=Math.max(0,Math.trunc(Number(save?.steps)||0));
 return {wins:current.wins+(rematch?1:0),lastStep:step};
}
return Object.freeze({STEP_GAP,MAX_BONUS,record,status,lineup,markWin});
});
