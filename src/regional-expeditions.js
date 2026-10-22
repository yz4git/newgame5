/* ASTRA TALES — independent side expeditions in forest, lake and highland.
 * These episodes never advance main-story flags or change older save versions.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraRegionalExpeditions=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const FOREST_ORDER=Object.freeze(['sprout','rain','moon']);
const LAKE_TARGET=Object.freeze([true,false,true]);
const ROOMS=Object.freeze({
 forestgrotto:Object.freeze({name:'古樹の年輪洞',region:'forest',reward:Object.freeze({bag:Object.freeze({herb:2,ether:1}),money:220})}),
 tidevault:Object.freeze({name:'潮の隠し水路',region:'lake',reward:Object.freeze({bag:Object.freeze({orb:4,ether:2}),money:280})}),
 windspire:Object.freeze({name:'風見の尖塔',region:'highland',reward:Object.freeze({bag:Object.freeze({guardCharm:1,powerCharm:1}),money:420})})
});
const valid=n=>Number.isInteger(n)&&n>=0;
function normalize(events){
 const e=events?.regionalExpeditions||{};
 const done=e.forestgrotto?.solved||false;
 const lake=e.tidevault||{};
 const valves=Array.from({length:3},(_,i)=>typeof lake.valves?.[i]==='boolean'?lake.valves[i]:i===1);
 return {
  forestgrotto:{step:done?3:Math.min(2,valid(e.forestgrotto?.step)?e.forestgrotto.step:0),solved:!!done,claimed:!!e.forestgrotto?.claimed},
  tidevault:{valves,solved:!!lake.solved,claimed:!!lake.claimed},
  windspire:{claimed:!!e.windspire?.claimed}
 };
}
function state(events,room,guardDefeated=false){
 const s=normalize(events);
 const progress=s[room];
 if(!progress)return null;
 return {...progress,ready:room==='windspire'?!!guardDefeated:
   room==='forestgrotto'?progress.solved:progress.solved};
}
function press(events,id){
 const s=normalize(events),p=s.forestgrotto;
 if(p.solved)return {ok:false,progress:s,kind:'done',text:'年輪の紋様はもう光っている。'};
 if(!FOREST_ORDER.includes(id))return {ok:false,progress:s,kind:'unknown',text:'この刻印には反応がない。'};
 const expected=FOREST_ORDER[p.step];
 if(id!==expected){
  p.step=0;
  return {ok:true,progress:s,kind:'reset',text:'年輪の光が消えた。\n刻印を調べる順番が違うようだ。'};
 }
 p.step++;
 if(p.step===FOREST_ORDER.length){
  p.solved=true;
  return {ok:true,progress:s,kind:'solved',text:'芽吹き、雨、月。\n古樹がゆっくり息をし、奥の宝箱に光が満ちた！'};
 }
 return {ok:true,progress:s,kind:'progress',text:'年輪の一部が光った。\n'+p.step+' / 3 個の刻印が共鳴している。'};
}
function toggle(events,index){
 const s=normalize(events),p=s.tidevault;
 if(!valid(index)||index>2)return {ok:false,progress:s,kind:'unknown',text:'その水門は見つからない。'};
 if(p.solved)return {ok:false,progress:s,kind:'done',text:'水流は安定している。水門はもう動かない。'};
 p.valves[index]=!p.valves[index];
 const word=p.valves[index]?'開':'閉';
 if(p.valves.every((v,i)=>v===LAKE_TARGET[i])){
  p.solved=true;
  return {ok:true,progress:s,kind:'solved',text:'3つの水門の圧力が釣り合った！\n水が引き、北側の石の橋が現れた。'};
 }
 return {ok:true,progress:s,kind:'changed',text:['西','中央','東'][index]+'の水門：'+word+
  '\n水流を左右で受け止め、中央を静めよう。'};
}
function clue(room){
 if(room==='forestgrotto')return '樹皮の記録：\n「芽吹きは雨を呼び、雨は月へ歌う」\n古樹の3つの刻印をこの順番で調べよう。';
 if(room==='tidevault')return '水路の修復記録：\n「西と東から水を迎え、中央の門を閉ざせ」\n3つの水門を調整すると、北側の石橋が現れる。';
 if(room==='windspire')return '風見の碑文：\n「空を見上げる者は、守り手と力を比べよ」\n中央の番人と戦い、塔の奥にある風の記録を取り戻そう。';
 return '';
}
function claim(events,room,guardDefeated=false){
 const s=normalize(events),def=ROOMS[room];if(!def)return {ok:false,progress:s,text:'記録がない。'};
 const p=s[room],ready=room==='windspire'?!!guardDefeated:!!p.solved;
 if(!ready)return {ok:false,progress:s,text:'まだ試練が終わっていない。'};
 if(p.claimed)return {ok:false,progress:s,text:'宝箱は空だ。見つけた記録は手帳に残っている。'};
 p.claimed=true;
 return {ok:true,progress:s,reward:def.reward,text:def.name+' の調査完了！\n'+
  (room==='forestgrotto'?'薬草×2、PP回復×1、220Gを手に入れた！':
   room==='tidevault'?'星玉×4、PP回復×2、280Gを手に入れた！':
    '防御のお守り×1、力のお守り×1、420Gを手に入れた！')};
}
function prepare(room,grid,events){
 if(room!=='tidevault'||!grid?.length)return false;
 // A continuous stream separates lower valves from a northern treasure ledge.
 for(let x=1;x<grid[6].length-1;x++)grid[6][x]=3;
 const solved=normalize(events).tidevault.solved;
 for(const x of [7,8,9])grid[6][x]=solved?13:3;
 return true;
}
return Object.freeze({ROOMS,FOREST_ORDER,LAKE_TARGET,normalize,state,press,toggle,clue,claim,prepare});
});
