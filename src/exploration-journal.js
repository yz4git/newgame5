/* ASTRA TALES: Exploration notebook with progressive, optional hints.
 * No data mutation; derives progress only from the player's persistent save.
 */
(function(root,factory){const mod=factory();if(typeof module!=='undefined'&&module.exports)module.exports=mod;root.AstraExploration=mod})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const REGIONS=Object.freeze([
 {id:'forest',name:'月影の森',title:'森の記憶',total:5,
  hints:['森のあちこちに、不思議な記憶石が眠っている。','葉・しずく・星には、石が目を覚ます順番がある。西の蔦も調べよう。','北東に葉の石、西にしずくの石、東に星の石。葉→しずく→星で調べ、蔦の奥を探そう。月光の花は夕方か夜に咲く。']},
 {id:'lake',name:'青凪の湖畔',title:'水底の小島',total:2,
  hints:['水辺で行き止まりになっている場所がある。水位を変える仕掛けはないだろうか。','湖の南側には古い水門のハンドルがある。','湖の南側（10,14）の水門を調べると、中央（14,7～9）に石道が現れる。北の小島に宝物が眠る。']},
 {id:'shrine',name:'星降りの聖域',title:'三つの石柱',total:4,
  hints:['古代の碑文には、石柱を光らせるための詩が刻まれている。','詩に現れるものの順番が、石柱を調べる正しい順番のようだ。','月（5,7）→風（14,12）→星（14,7）の順番で石柱を調べ、北東に現れる扉から祭壇へ進もう。']},
 {id:'highland',name:'星見の高原',title:'星の鏡',total:4,
  hints:['山道には、回転する3つの星鏡がある。星図を調べてみよう。','3つの鏡は90度ずつ回る。星図に刻まれた方角へそれぞれ合わせよう。','西（8,12）を東、中央（14,12）を北、北（14,7）を西へ向ける。各鏡を調べると時計回りに回転する。']}
]);
const MAP=new Map(REGIONS.map(r=>[r.id,r]));
function progress(id,save){
 const data=save&&typeof save==='object'?save:{},events=data.events||{};
 const collected=data.collected||{},F=events.forestSecrets||{},R=events.regionPuzzles||{};
 let done=0,details='';
 switch(id){
  case 'forest':
   done=Math.max(0,Math.min(3,Number(F.sequence)||0))+
    Number(!!collected['forest/蔦の奥の忘れ物'])+Number(!!F.bloomClaimed);
   details='記憶石 '+Math.min(3,Number(F.sequence)||0)+'/3・蔦の奥 '+(collected['forest/蔦の奥の忘れ物']?'発見':'未発見')+
    '・月光の花 '+(F.bloomClaimed?'採取済み':'未採取');
   break;
  case 'lake':
   done=Number(!!R.lake?.lowered)+Number(!!R.lake?.cacheTaken);
   details='水門 '+(R.lake?.lowered?'開放':'未操作')+'・小島の石箱 '+(R.lake?.cacheTaken?'発見':'未発見');
   break;
  case 'shrine':
   done=Math.max(0,Math.min(3,Number(R.shrine?.progress)||0))+Number(!!R.shrine?.cacheTaken);
   details='石柱 '+Math.min(3,Number(R.shrine?.progress)||0)+'/3・奥の祭壇 '+(R.shrine?.cacheTaken?'調査済み':'未調査');
   break;
  case 'highland':
   done=(R.highland?.angles||[]).filter((v,i)=>v===[1,0,3][i]).length+Number(!!R.highland?.solved);
   details='星鏡 '+Math.min(3,done-(R.highland?.solved?1:0))+'/3・星座 '+(R.highland?.solved?'完成':'未完成');
   break;
  default:return null;
 }
 const region=MAP.get(id),visited=!!data.visited?.[id];
 return {id,title:region.title,name:region.name,visited,done:Math.min(region.total,done),total:region.total,
  complete:done>=region.total,status:!visited?'未訪問':done>=region.total?'探索完了':done===0?'未解明':'調査中',
  details};
}
function summary(save){return REGIONS.map(r=>progress(r.id,save))}
function hint(id,save,level=0){
 const region=MAP.get(id);if(!region)return null;
 const current=progress(id,save);
 if(!current.visited)return 'まだ訪れていない地域。現地に着くと、この場所の記録が開かれる。';
 return region.hints[Math.max(0,Math.min(2,Math.trunc(level)||0))];
}
function nearby(map,x,y,npcs,visible=()=>true){
 let nearest=null;
 for(const n of npcs||[]){
  if(!['regionalPuzzle','secretRune','nightBloom'].includes(n.kind)||!visible(n))continue;
  const distance=Math.abs(n.x-x)+Math.abs(n.y-y);
  if(distance>2)continue;
  if(!nearest||distance<nearest.distance)nearest={x:n.x,y:n.y,name:n.name,distance,
   direct:distance===1};
 }
 return nearest;
}
return Object.freeze({REGIONS,progress,summary,hint,nearby});
});
