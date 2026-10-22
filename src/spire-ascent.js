/* ASTRA TALES — three-floor Skywind Spire adventure.
 * Pure progress machine + terrain-state projection; saves via events.spireAscent.
 * No mutation of user save objects; does not touch base guardian rewards.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraSpireAscent=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ORDER=Object.freeze(['east','north','west']);
const LABELS=Object.freeze(['北','東','南','西']);
const TARGET=Object.freeze([1,0,3]);
const FLOOR2='windspire2',FLOOR3='windspire3';
const FINAL_KEY='windspire3/天空の試練官 セイ';
const GUARD_KEY='windspire/星風の番人 カイト';
const REWARD=Object.freeze({bag:Object.freeze({ether:3,orb:5,speedCharm:1}),money:750});
function normalize(events){
 const r=events?.spireAscent||{};
 return {
  vanes:Array.from({length:3},(_,i)=>{
   const v=r.vanes?.[i];return Number.isInteger(v)?((v%4)+4)%4:2;
  }),
  bridge:!!r.bridge,claimed:!!r.claimed
 };
}
function guardianPassed(save){
 return !!save?.defeated?.[GUARD_KEY]||!!save?.events?.regionalExpeditions?.windspire?.claimed;
}
function summitPassed(save){return !!save?.defeated?.[FINAL_KEY]}
function snapshot(events){
 const p=normalize(events),aligned=p.vanes.reduce((n,v,i)=>n+(v===TARGET[i]?1:0),0);
 return {...p,aligned,complete:aligned===3||p.bridge};
}
function rotate(events,index,delta=1){
 const p=normalize(events);
 if(!Number.isInteger(index)||index<0||index>2||!Number.isInteger(delta)){
  return {ok:false,progress:p,text:'風向計が反応しない。'};
 }
 if(p.bridge)return {ok:false,progress:p,kind:'done',text:'風向計はすでに固定されている。'};
 p.vanes[index]=(p.vanes[index]+delta%4+4)%4;
 const aligned=p.vanes.every((v,i)=>v===TARGET[i]);
 if(aligned){p.bridge=true;return {ok:true,progress:p,kind:'open',
  text:'風の流れが重なり、空中回廊に石の足場が現れた！\n北の階段から上階へ進める。'};}
 return {ok:true,progress:p,kind:'rotated',
  text:['東','中央','西'][index]+'の風向計を回した。\n現在：'+LABELS[p.vanes[index]]+' 　共鳴：'+p.vanes.filter((v,i)=>v===TARGET[i]).length+'/3'};
}
function clue(){return '風読みの碑文：\n「東の風は東へ、中央の風は北へ、西の風は西へ」\n三つの風向計がそろえば北の渡り廊下がつながる。'}
function prepare(map,grid,events){
 if(map!==FLOOR2||!grid?.length)return false;
 const open=normalize(events).bridge;
 // The horizontal wind void is sealed between the lower controls and upper stairs.
 for(let x=1;x<grid[6].length-1;x++)grid[6][x]=3;
 for(const x of [7,8,9])grid[6][x]=open?13:3;
 grid[3][8]=open?6:5;
 return true;
}
function canEnter(save,room){
 if(room===FLOOR2)return guardianPassed(save);
 if(room===FLOOR3)return guardianPassed(save)&&snapshot(save?.events).bridge;
 return false;
}
function claim(save){
 const p=normalize(save?.events);
 if(!summitPassed(save))return {ok:false,progress:p,text:'上級試練官との勝負を越えなければ記録箱は開かない。'};
 if(p.claimed)return {ok:false,progress:p,text:'風の記録箱は空だ。頂上の記録は手帳に残っている。'};
 return {ok:true,progress:{...p,claimed:true},reward:REWARD,
  text:'尖塔の最上階を踏破した！\nPP回復×3、星玉×5、速さのお守り×1、750Gを獲得！'};
}
function status(save){
 const p=snapshot(save?.events),passed=guardianPassed(save),summit=summitPassed(save);
 return {guardian:passed,bridge:p.bridge,aligned:p.aligned,summit,claimed:p.claimed,
  phase:!passed?'guardian':!p.bridge?'vanes':!summit?'summit':!p.claimed?'treasure':'complete'};
}
return Object.freeze({FLOOR2,FLOOR3,GUARD_KEY,FINAL_KEY,ORDER,LABELS,TARGET,REWARD,normalize,
 guardianPassed,summitPassed,snapshot,rotate,clue,prepare,canEnter,claim,status});
});
