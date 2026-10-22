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
/* Upper-screen telescope preview, built entirely with Canvas geometry.
 * Three weather/time palettes give a sense of discovery without artwork assets.
 */
function drawSky(ctx,phase=0,frame=0,solved=false){
 if(!ctx)return false;
 const time=Math.max(0,Math.min(2,Math.trunc(phase)||0));
 const palettes=[
  ['#31566b','#a2b9b0','#fff6d3'],
  ['#302f68','#b36b7f','#ffe6ba'],
  ['#152844','#345779','#f7f3ce']
 ];
 const [dark,light,stars]=palettes[time];
 const rand=i=>{let n=Math.imul(i+233,1664525)+1013904223|0;n=Math.imul(n^(n>>>13),2246822519);return ((n^(n>>>16))>>>0)/4294967295};
 ctx.save();
 const gradient=ctx.createLinearGradient(0,0,0,352);
 gradient.addColorStop(0,dark);gradient.addColorStop(1,light);
 ctx.fillStyle=gradient;ctx.fillRect(0,0,416,352);
 // Atmospheric low horizon, a lake reflection and layered distant pine ridge.
 ctx.fillStyle='#446d7580';ctx.beginPath();ctx.ellipse(208,322,280,44,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#253f55';ctx.beginPath();ctx.moveTo(0,316);
 for(let x=0;x<=416;x+=12)ctx.lineTo(x,291-Math.sin(x*.025)*9-Math.sin(x*.07)*4);
 ctx.lineTo(416,352);ctx.lineTo(0,352);ctx.fill();
 ctx.fillStyle='#1e3c50';ctx.beginPath();ctx.moveTo(0,336);
 for(let x=0;x<=416;x+=9)ctx.lineTo(x,317-Math.sin(x*.036)*8);
 ctx.lineTo(416,352);ctx.lineTo(0,352);ctx.fill();
 for(let i=0;i<68;i++){
  const x=22+rand(i*13+1)*374,y=18+rand(i*11+9)*254;
  const blink=.5+.5*Math.sin(frame*.028+i*2.2);
  ctx.globalAlpha=.45+blink*.55;
  ctx.beginPath();ctx.arc(x,y,.65+rand(i+6)*1.4,0,Math.PI*2);
  ctx.fillStyle=stars;ctx.fill();
 }
 ctx.globalAlpha=1;
 if(time!==0){
  ctx.beginPath();ctx.arc(324,72,19,0,Math.PI*2);
  ctx.fillStyle=time===2?'#e5e9db':'#f1c6c4';ctx.fill();
  ctx.beginPath();ctx.arc(332,65,17,0,Math.PI*2);
  ctx.fillStyle=dark;ctx.fill();
 }
 const starCoords=[[70,105],[124,147],[199,94],[264,142],[330,109],[294,197],[213,214],[130,205],[175,162]];
 if(solved){
  const links=[[0,1],[1,8],[8,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,1],[8,6]];
  ctx.strokeStyle='#f6e2a8b0';ctx.lineWidth=1.7;ctx.beginPath();
  for(const [a,b] of links){ctx.moveTo(...starCoords[a]);ctx.lineTo(...starCoords[b])}
  ctx.stroke();
 }
 for(let i=0;i<starCoords.length;i++){
  const [x,y]=starCoords[i],glow=.7+.3*Math.sin(frame*.028+i);
  ctx.fillStyle=solved?'#f9ebbb':'#9ac6c8';
  ctx.beginPath();ctx.arc(x,y,(solved?3.4:2)*glow,0,Math.PI*2);ctx.fill();
 }
 ctx.fillStyle='#133647df';ctx.beginPath();ctx.roundRect(74,9,268,35,8);ctx.fill();
 ctx.textAlign='center';ctx.font='bold 13px system-ui,sans-serif';ctx.fillStyle='#f4e8c6';
 ctx.fillText(solved?'✦ 復元された星図　'+['朝','夕','夜'][time]:'✧ 未完成の星図　レンズを調整しよう',208,31);
 ctx.restore();
 return true;
}
return Object.freeze({LENSES,DIRECTIONS,REWARD,normalize,snapshot,rotate,observe,align,claim,telescope,drawSky});
});
