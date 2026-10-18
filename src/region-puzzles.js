/* ASTRA TALES — independent regional exploration puzzles.
 * Optional to the storyline: no main entrance is ever blocked.
 * Puzzle state is JSON-serializable and world tiles rebuild from it on load.
 */
(function(root,factory){const p=factory();if(typeof module!=='undefined'&&module.exports)module.exports=p;root.AstraRegionPuzzles=p})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const LAKE={lever:{x:10,y:14},cache:{x:14,y:6},bridge:[{x:14,y:7},{x:14,y:8},{x:14,y:9}]};
const SHRINE={
 pillars:[{x:5,y:7,id:'moon',name:'月の石柱',symbol:'☾',color:'#c9c6f0'},
 {x:14,y:12,id:'wind',name:'風の石柱',symbol:'風',color:'#a6d9bd'},
 {x:14,y:7,id:'star',name:'星の石柱',symbol:'✧',color:'#f5d49b'}],
 gate:{x:15,y:7},cache:{x:17,y:7},order:['moon','wind','star']
};
const HIGHLAND={
 stars:[{x:8,y:12,name:'西の星鏡',symbol:'Ⅰ'},
  {x:14,y:12,name:'中央の星鏡',symbol:'Ⅱ'},
  {x:14,y:7,name:'北の星鏡',symbol:'Ⅲ'}],
 orientations:[1,0,3], // E, N, W connects a bent star path
 chart:{x:9,y:11}
};
const names=['北','東','南','西'];
function normalize(raw){
 const a=raw&&typeof raw==='object'?raw:{};
 return {
  lake:{lowered:!!a.lake?.lowered,cacheTaken:!!a.lake?.cacheTaken},
  shrine:{progress:Number.isInteger(a.shrine?.progress)?Math.min(3,Math.max(0,a.shrine.progress)):0,
   open:!!a.shrine?.open,cacheTaken:!!a.shrine?.cacheTaken},
  highland:{angles:Array.from({length:3},(_,i)=>Number.isInteger(a.highland?.angles?.[i])?(a.highland.angles[i]%4+4)%4:[3,2,1][i]),
   solved:!!a.highland?.solved}
 };
}
function interact(raw,map,id){
 const v=normalize(raw),reply=(kind,text,reward=null)=>({progress:v,kind,text,reward});
 if(map==='lake'){
  if(id==='lever'){
   if(v.lake.lowered)return reply('done','水門は開いたままだ。水位が下がり、湖の小島へ石の道が伸びている。');
   v.lake.lowered=true;return reply('unlocked','古い水門を開いた！ 湖の水が引き、中央の小島に向かう道が現れた。');
  }
  if(id==='lakeCache'){
   if(!v.lake.lowered)return reply('hint','小島が見えるが、まだ水が深くて進めない。');
   if(v.lake.cacheTaken)return reply('done','湖の石箱は空になっている。');
   v.lake.cacheTaken=true;return reply('reward','水底の石箱から星玉を4個見つけた！',{item:'orb',count:4});
  }
 }else if(map==='shrine'){
  if(id==='shrineCache'){
   if(!v.shrine.open)return reply('hint','祭壇の石扉は固く閉ざされている。');
   if(v.shrine.cacheTaken)return reply('done','石の祭壇は静かな光を放っている。');
   v.shrine.cacheTaken=true;return reply('reward','古代の祭壇からPP回復を3個見つけた！',{item:'ether',count:3});
  }
  if(id==='tablet')return reply('hint','碑文：月が目を覚まし、風がささやき、星が扉を開く。\n3つの石柱をその順番で調べよう。');
  const idx=SHRINE.order.indexOf(id);
  if(idx!==-1){
   if(v.shrine.open)return reply('done','すべての石柱は光り、祭壇の扉はすでに開いている。');
   if(v.shrine.progress===idx){
    v.shrine.progress++;v.shrine.open=v.shrine.progress===3;
    return reply(v.shrine.open?'unlocked':'activated',
      v.shrine.open?'月・風・星の光が重なり、祭壇の奥にあった石扉が開いた！':
       (idx===0?'月の石柱が目覚めた。次は風の石柱を探そう。':'風の石柱が目覚めた。最後は星の石柱だ。'));
   }
   if(idx<v.shrine.progress)return reply('done','この石柱の紋様はすでに光っている。');
   return reply('hint','紋様が揺れている。石柱を調べる順番が違うようだ。');
  }
 }else if(map==='highland'){
  if(id==='chart')return reply('hint','星図：西の鏡は東を、中央の鏡は北を、北の鏡は西を指すと、星がひとつにつながる。');
  const i=Number(id?.replace(/^mirror/,''));
  if(/^mirror[012]$/.test(id)){
   if(v.highland.solved)return reply('done','星座が完成している。青白い光が高原の空を巡る。');
   v.highland.angles[i]=(v.highland.angles[i]+1)%4;
   const good=v.highland.angles.every((n,k)=>n===HIGHLAND.orientations[k]);
   if(good){v.highland.solved=true;return reply('reward','3つの星鏡がつながり、夜空に星座が現れた！\n速さのお守りを手に入れた。',{item:'speedCharm',count:1})}
   return reply('rotated',HIGHLAND.stars[i].name+' を回した。今は「'+names[v.highland.angles[i]]+'」を向いている。');
  }
 }
 return reply('unknown','古い仕掛けが風に揺れている。');
}
function paint(a,x,y,t){if(a?.[y]?.[x]!==undefined)a[y][x]=t}
function rect(a,x,y,w,h,t){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)paint(a,xx,yy,t)}
function prepare(map,grid,raw){
 if(!grid?.length)return false;
 const v=normalize(raw);
 if(map==='lake'){
  // Southern shore (y10+) is unchanged. The treasure island is isolated within water.
  rect(grid,11,4,8,6,3);
  paint(grid,14,6,1);
  for(const b of LAKE.bridge)paint(grid,b.x,b.y,v.lake.lowered?13:3);
  paint(grid,10,14,1);
  paint(grid,14,10,10); // public causeway stays available
  return true;
 }
 if(map==='shrine'){
  // Small north-eastern sealed recess: the normal central shrine trail stays open.
  rect(grid,15,5,4,5,5);
  paint(grid,16,7,1);paint(grid,17,7,1);
  paint(grid,SHRINE.gate.x,SHRINE.gate.y,v.shrine.open?13:5);
  // Approaches to switches are side branches, not changes to the boss's main trail.
  rect(grid,12,6,3,3,1);
  rect(grid,12,10,3,4,1);
  rect(grid,4,6,3,3,1);
  rect(grid,10,7,3,2,1);
  rect(grid,10,11,3,2,1);
  for(const pillar of SHRINE.pillars)paint(grid,pillar.x,pillar.y,1);
  return true;
 }
 if(map==='highland'){
  // Extend a spur off the existing alpine switchback, leaving the main road intact.
  rect(grid,7,11,9,3,1);
  rect(grid,13,7,3,6,1);
  rect(grid,8,7,7,3,1);
  for(const star of HIGHLAND.stars)paint(grid,star.x,star.y,1);
  paint(grid,HIGHLAND.chart.x,HIGHLAND.chart.y,1);
  return true;
 }
 return false;
}
return Object.freeze({LAKE,SHRINE,HIGHLAND,normalize,interact,prepare,names});
});
