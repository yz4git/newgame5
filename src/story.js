/* ASTRA TALES — original, data-driven opening chapter.
   Inspired by the pacing of classic handheld monster adventures.
   No game dialogue, assets, or map data are copied from an existing ROM. */
(function(root, factory) {
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraStory=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const CHAPTERS=[
 {id:'awaken',title:'はじめての朝',goal:'部屋を出て、家族と話そう。'},
 {id:'morning',title:'小さな約束',goal:'自宅の家族に話を聞こう。'},
 {id:'professor',title:'研究所からの招待',goal:'町の南西にあるアオイ研究所へ行こう。'},
 {id:'partner',title:'はじめての相棒',goal:'研究所の3つの端末から相棒を選ぼう。'},
 {id:'chosen',title:'旅支度',goal:'研究所の出口へ向かおう。'},
 {id:'farewell',title:'家族への報告',goal:'自宅に戻り、新しい相棒を見せよう。'},
 {id:'departure',title:'旅立ち',goal:'町の北の出口から、そよかぜの小道へ進もう。'},
 {id:'observatory',title:'星の観測者',goal:'小道から東の湖畔へ。観測小屋でユラを探そう。'},
 {id:'urgent',title:'研究所からの緊急連絡',goal:'大切な星のかけらを持って、ミナモリの町に戻ろう。'},
 {id:'rival',title:'旅の途中の勝負',goal:'ライバルとの勝負を決着させよう。'},
 {id:'report',title:'星のかけら',goal:'アオイ研究所へ行き、かけらを博士に渡そう。'},
 {id:'lesson',title:'捕獲の練習',goal:'町の広場にいるナギから捕獲方法を教わろう。'},
 {id:'open',title:'本当の冒険の始まり',goal:'仲間を増やしながら北の森と聖域を探索しよう。'}
];
const INITIAL_STAGE=0,FREE_STAGE=12;
function fresh(){return {stage:0,playerName:'',rivalName:'カイ',starterId:null,parcel:false,gear:false,dex:false,completedAt:null}}
function normalize(input){if(!input||typeof input!=='object')return {...fresh(),stage:FREE_STAGE};
 return {...fresh(),...input,stage:Math.max(0,Math.min(FREE_STAGE,Math.floor(Number(input.stage)||0)))}
}
function chapter(story){return CHAPTERS[Math.max(0,Math.min(FREE_STAGE,story?.stage??FREE_STAGE))]}
function advance(story,next){const before=story.stage;if(!Number.isInteger(next)||next>FREE_STAGE||next!==before+1)return false;story.stage=next;return true}
function canWarp(story,origin,target){
 const stage=story?.stage??FREE_STAGE;
 if(origin==='bedroom'&&target==='home')return {allowed:true};
 if(origin==='home'&&target==='village'&&stage<2)return {allowed:false,reason:'出かける前に、家族に話を聞こう。'};
 if(origin==='village'&&target==='lab'&&stage<2)return {allowed:false,reason:'まず家族に話しかけよう。'};
 if(origin==='lab'&&target==='village'&&stage===3)return {allowed:false,reason:'研究所の端末から相棒を選ぼう。'};
 if(origin==='village'&&target==='route'&&stage<6)return {allowed:false,reason:'出発の準備がまだ終わっていない！'};
 if(origin==='route'&&target==='forest'&&stage<FREE_STAGE)return {allowed:false,reason:'まず湖畔の観測小屋での用事を済ませよう。'};
 if(origin==='route'&&target==='lake'&&stage<7)return {allowed:false,reason:'観測小屋へ行くのは、出発してからにしよう。'};
 if(origin==='lake'&&target==='observatory'&&stage<7)return {allowed:false,reason:'観測小屋にはまだ用事がない。'};
 return {allowed:true};
}
function rivalFor(starterId){
 return {flamio:'aquill',leafin:'flamio',aquill:'leafin'}[starterId]||'koro';
}
function earlyTrainerEnabled(story){return !story||story.stage>=FREE_STAGE}
function mustRivalBattle(story,from,to,x,y){
 return !!story&&story.stage===8&&from==='route'&&to==='village'&&x>=10&&x<=13&&y>=25;
}
function startAt(){
 return {id:'bedroom',x:7,y:8,dir:'down'};
}
return Object.freeze({CHAPTERS,INITIAL_STAGE,FREE_STAGE,fresh,normalize,chapter,advance,canWarp,rivalFor,earlyTrainerEnabled,mustRivalBattle,startAt});
});
