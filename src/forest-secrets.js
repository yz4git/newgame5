/* ASTRA TALES / Forest Whispers — optional exploration puzzle.
 * No timers, no random rewards, no server state. Coordinates are deterministic.
 * The puzzle never blocks the main forest route or the story.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraForestSecrets=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const RUNES=Object.freeze([
 {id:'leaf',x:10,y:8,name:'葉の記憶石',symbol:'葉',color:'#a2d598',clue:'葉が風を呼び、しずくが光を集め、最後に星が道を照らす。'},
 {id:'dew',x:7,y:16,name:'しずくの記憶石',symbol:'水',color:'#8dd1da',clue:'木漏れ日の下に青い光が走る。'},
 {id:'star',x:20,y:20,name:'星の記憶石',symbol:'星',color:'#f4d6a0',clue:'星の光が森の西側へ伸びている。'}
]);
const GATE=Object.freeze({x:5,y:11});
const ALCOVE=Object.freeze({x:3,y:11});
const NIGHT_BLOOM=Object.freeze({x:16,y:21,name:'月光の花'});
function normalize(value){
 const v=value&&typeof value==='object'?value:{};
 return {sequence:Number.isInteger(v.sequence)?Math.max(0,Math.min(3,v.sequence)):0,
  gateOpen:!!v.gateOpen,bloomClaimed:!!v.bloomClaimed};
}
function next(value,id,phase=0){
 const current=normalize(value);
 if(id==='bloom'){
  if(current.bloomClaimed)return {progress:current,kind:'done',text:'月光の花は静かに揺れている。星の雫はもう採取した。'};
  if(phase<1)return {progress:current,kind:'hint',text:'花びらはまだ閉じている。夕方か夜に訪れると光を集めるらしい。'};
  return {progress:{...current,bloomClaimed:true},kind:'bloom',reward:{item:'ether',count:2},
    text:'夕暮れの星の雫を集めた！　PP回復を2個手に入れた。'};
 }
 if(id==='gate'){
  return {progress:current,kind:'gate',
   text:current.gateOpen?'蔦の道が開いている。木陰の向こうに小さな隠れ場所が見える。':
    '不思議な蔦が道を塞いでいる。葉・しずく・星の紋様がかすかに刻まれている。'};
 }
 const index=RUNES.findIndex(r=>r.id===id);
 if(index<0)return {progress:current,kind:'unknown',text:'かすかな風の音がする。'};
 if(current.gateOpen)return {progress:current,kind:'done',text:'3つの石の光がつながり、西の木陰へ道を示している。'};
 if(index<current.sequence)return {progress:current,kind:'done',text:'この石の光はすでに目覚めている。'};
 if(index>current.sequence)return {progress:current,kind:'hint',text:RUNES[index].clue+'\n順番が違うようだ。まず葉の記憶からたどろう。'};
 const sequence=current.sequence+1,gateOpen=sequence>=RUNES.length;
 const progress={...current,sequence,gateOpen};
 const msg=gateOpen?'3つの紋様がひとつにつながった！\n森の西側で蔦がほどけ、隠し通路が現れた。':
  (sequence===1?'葉の記憶が目覚めた。次は森の西側にある、しずくの紋様を探そう。':
   'しずくの記憶が目覚めた。最後は東側の星の紋様だ。');
 return {progress,kind:gateOpen?'unlocked':'rune',text:msg};
}
function prepare(tiles,value){
 if(!Array.isArray(tiles)||!tiles[11]||tiles[11].length<=GATE.x)return false;
 const unlocked=normalize(value).gateOpen;
 // Pocket stays sealed on all other edges; no unintended side or diagonal access.
 for(let y=10;y<=12;y++)for(let x=2;x<=5;x++)tiles[y][x]=4;
 tiles[11][3]=1;tiles[11][4]=1;
 tiles[GATE.y][GATE.x]=unlocked?1:4;
 // Interactable runes do not become collidable tree tiles.
 for(const item of [...RUNES,NIGHT_BLOOM])tiles[item.y][item.x]=1;
 return true;
}
function tileIsOpen(tiles,value){
 return tiles?.[GATE.y]?.[GATE.x]===(normalize(value).gateOpen?1:4);
}
return Object.freeze({RUNES,GATE,ALCOVE,NIGHT_BLOOM,normalize,next,prepare,tileIsOpen});
});
