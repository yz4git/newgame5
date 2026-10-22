/* ASTRA TALES — optional observatory field-episode.
 * Clues are in the room, no forced battles and no new save format.
 * All transitions return immutable progress for safe replay/reload.
 */
(function(root,factory){
 const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraStargazer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const LENSES=Object.freeze([
 Object.freeze({id:'forest',name:'木漏れ日のレンズ',symbol:'葉',target:1,clue:'森は夜明けを待って東へ枝を伸ばす。'}),
 Object.freeze({id:'lake',name:'水鏡のレンズ',symbol:'水',target:0,clue:'湖は北の星を鏡の中心に映す。'}),
 Object.freeze({id:'highland',name:'星風のレンズ',symbol:'星',target:3,clue:'高原の風は夕陽の沈む西へ向かう。'})
]);
const DIRECTIONS=Object.freeze(['北','東','南','西']);
const REWARD=Object.freeze({bag:Object.freeze({ether:2,speedCharm:1}),money:250});
function normalize(events){
 const p=events?.stargazer;
 return {angles:LENSES.map((_,i)=>Math.max(0,Math.min(3,Number.isInteger(p?.angles?.[i])?p.angles[i]:0))),
  solved:!!p?.solved,claimed:!!p?.claimed};
}
function snapshot(events){
 const p=normalize(events),aligned=LENSES.reduce((n,l,i)=>n+(p.angles[i]===l.target?1:0),0);
 return {...p,aligned,total:LENSES.length,ready:aligned===LENSES.length||p.solved};
}
function rotate(events,id,delta=1){
 const i=LENSES.findIndex(l=>l.id===id),p=normalize(events);
 if(i<0||!Number.isInteger(delta))return {ok:false,progress:p,text:'未知の星の装置だ。'};
 if(p.solved)return {ok:false,progress:p,text:'すでに星図は完成している。'};
 p.angles[i]=(p.angles[i]+delta%4+4)%4;
 return {ok:true,progress:p,text:LENSES[i].name+'を回した。\n現在の方向：'+DIRECTIONS[p.angles[i]]};
}
function observe(events){
 const p=snapshot(events);
 return {ok:true,progress:normalize(events),ready:p.ready,
  text:'レンズの共鳴：'+p.aligned+' / '+p.total+
  (p.aligned===p.total?'\n光が天球儀に集まっている！':
   '\n散らばった星明かりを3方向のレンズで集めよう。')};
}
function align(events){
 const p=snapshot(events);
 if(p.solved)return {ok:true,progress:normalize(events),text:'星図は完成している。',newly:false};
 if(p.aligned!==p.total)return {ok:false,progress:normalize(events),text:'まだレンズの向きが合っていない。\n現在 '+p.aligned+'/'+p.total};
 const complete={angles:p.angles,solved:true,claimed:p.claimed};
 return {ok:true,progress:complete,newly:true,
  text:'3つの星の線が結ばれ、夜空の記録がよみがえった！\n湖畔と森と高原は、ひとつの星図でつながっていた。'};
}
function claim(events){
 const p=normalize(events);
 if(!p.solved)return {ok:false,progress:p,text:'まだ天球儀は静かなままだ。'};
 if(p.claimed)return {ok:false,progress:p,text:'星の記録はすでに受け取っている。'};
 return {ok:true,progress:{...p,claimed:true},reward:REWARD,
  text:'星図の復元完了！\nPP回復×2、速さのお守り×1、250Gを受け取った。'};
}
function telescope(events,phase=0){
 const p=normalize(events);
 if(!p.solved)return {text:'望遠鏡には、まだ断片的な星の明かりしか見えない。\n3つのレンズをそろえて天球儀を調べよう。'};
 const lines=[
  '朝の空に残った淡い星が、森と湖をつなぐ輪を描いている。',
  '夕映えに重なる星座が、遠くの高原へ導いている。',
  '暗い空に湖の星が映り、天の川がふたつ現れた。'
 ];
 return {text:lines[Math.max(0,Math.min(2,phase))]+'\n星の位置を記録手帳に書き留めた。'};
}
return Object.freeze({LENSES,DIRECTIONS,REWARD,normalize,snapshot,rotate,observe,align,claim,telescope});
});
