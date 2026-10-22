/* ASTRA TALES — interactive field atlas with collision-aware wayfinding.
 * Markers describe ORIGINAL locations, not third-party map resources.
 * No hidden encounter/event spoilers. Current-zone map and directions only.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraFieldAtlas=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const BLOCKED=new Set([3,4,5,8,9,11]);
const POIS=Object.freeze({
 village:[
  ['north',11,1,'北門・小道','gate'],['center',6,9,'星霊センター','building'],
  ['mart',17,9,'ミナモリ商店','building'],['lab',9,18,'アオイ研究所','building'],
  ['home',20,18,'自宅','building'],['workshop',3,9,'星霊工房','building']
 ],
 route:[
  ['village',11,1,'ミナモリの町','gate'],['forest',11,24,'月影の森','gate'],
  ['lake',22,12,'青凪の湖畔','gate'],['flowers',6,8,'花の回り道','discovery'],
  ['meadow',8,19,'小道の展望地','discovery']
 ],
 forest:[
  ['route',13,26,'そよかぜの小道','gate'],['shrine',13,1,'星降りの聖域','gate'],
  ['spring',13,23,'精霊の泉','discovery'],['grove',8,15,'西の森の薬草道','discovery'],
  ['ridge',19,19,'東の見晴らし','discovery'],['grotto',21,16,'古樹の年輪洞','building']
 ],
 shrine:[
  ['forest',9,17,'月影の森','gate'],['highland',9,1,'星見の高原','gate'],
  ['pillar',13,12,'古代の碑文','discovery']
 ],
 lake:[
  ['route',1,12,'そよかぜの小道','gate'],['observatory',19,19,'青凪の観測小屋','building'],
  ['boardwalk',6,18,'湖上の木道','discovery'],['shore',23,12,'湖の東岸','discovery'],['tidevault',23,18,'潮の隠し水路','building']
 ],
 highland:[
  ['shrine',12,27,'星降りの聖域','gate'],['terrace',12,18,'高原の階段','discovery'],
  ['summit',18,8,'山頂の眺望','discovery'],['windspire',20,8,'風見の尖塔','building']
 ],
 center:[['exit',7,9,'町へ戻る','gate']],
 mart:[['exit',7,9,'町へ戻る','gate']],
 lab:[['exit',8,11,'町へ戻る','gate']],
 home:[['exit',7,9,'町へ戻る','gate'],['bedroom',6,7,'自分の部屋','building']],
 bedroom:[['exit',7,9,'自宅へ戻る','gate']],
 observatory:[['exit',7,9,'湖畔へ戻る','gate'],['starlab',11,4,'星見の研究室','building']],
 starlab:[['exit',8,12,'観測小屋へ戻る','gate'],['globe',8,8,'復元の天球儀','discovery'],['notes',4,9,'三つの星の手記','discovery']],
 forestgrotto:[['exit',8,12,'月影の森へ戻る','gate'],['runes',8,8,'古樹の3つの刻印','discovery'],['cache',8,4,'年輪の宝箱','discovery']],
 tidevault:[['exit',8,12,'青凪の湖畔へ戻る','gate'],['valves',8,9,'3つの水門','discovery'],['cache',8,4,'水底の調査箱','discovery']],
 windspire:[['exit',8,12,'星見の高原へ戻る','gate'],['guardian',8,6,'星風の番人','discovery'],['cache',8,4,'風の記録箱','discovery'],['stairs',12,4,'2階への階段','gate']],
 windspire2:[['exit',8,12,'1階へ戻る','gate'],['vane',8,9,'風向計の間','discovery'],['stairs',8,3,'3階への渡り廊下','gate']],
 windspire3:[['exit',8,12,'2階へ戻る','gate'],['warden',8,6,'天空の試練官','discovery'],['cache',8,4,'天空の記録箱','discovery']],
 workshop:[['exit',7,9,'町へ戻る','gate'],['archive',12,7,'星の復元資料室','building']],
 archive:[['exit',8,11,'星霊工房へ戻る','gate']]
});
function accessible(tile){return tile!==undefined&&!BLOCKED.has(tile)}
function pointId(a){return a.x+','+a.y}
function nearest(grid,x,y){
 if(!grid?.length||!grid[0]?.length)return null;
 const w=grid[0].length,h=grid.length;
 x=Math.max(0,Math.min(w-1,Math.round(x)));y=Math.max(0,Math.min(h-1,Math.round(y)));
 if(accessible(grid[y][x]))return {x,y};
 for(let r=1;r<Math.max(w,h);r++){
  const points=[];
  for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){
   if(Math.abs(dx)+Math.abs(dy)!==r)continue;
   const nx=x+dx,ny=y+dy;
   if(nx>=0&&nx<w&&ny>=0&&ny<h&&accessible(grid[ny][nx]))
    points.push({x:nx,y:ny});
  }
  if(points.length)return points[0];
 }
 return null;
}
function path(grid,start,end){
 if(!grid?.length||!grid[0]?.length||!start||!end)return [];
 const sx=Math.round(start.x),sy=Math.round(start.y),target=nearest(grid,end.x,end.y);
 if(!target||!accessible(grid[sy]?.[sx]))return [];
 const w=grid[0].length,h=grid.length,first={x:sx,y:sy};
 const queue=[first],visited=new Map([[pointId(first),null]]);
 for(let i=0;i<queue.length;i++){
  const at=queue[i];
  if(at.x===target.x&&at.y===target.y){
   const result=[];let cur=pointId(at);
   while(cur){const [x,y]=cur.split(',').map(Number);result.push({x,y});cur=visited.get(cur)}
   return result.reverse();
  }
  for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){
   const x=at.x+dx,y=at.y+dy,key=x+','+y;
   if(x<0||y<0||x>=w||y>=h||visited.has(key)||!accessible(grid[y][x]))continue;
   visited.set(key,pointId(at));queue.push({x,y});
  }
 }
 return [];
}
function markers(zone,state){
 const data=POIS[zone]||[];
 return data.filter(([id])=>{
  if(zone==='village'&&id==='workshop')return Object.values(state?.events?.fieldRequests||{}).filter(q=>q?.claimed).length>=2;
  if(zone==='workshop'&&id==='archive')return !!state?.events?.townLegacy?.claimed;
  if(zone==='observatory'&&id==='starlab')return (state?.story?.stage||0)>=12;
  if((id==='grotto'||id==='tidevault'||id==='windspire')&&(state?.story?.stage||0)<12)return false;
  if(zone==='windspire'&&id==='stairs')return !!state?.defeated?.['windspire/星風の番人 カイト']||!!state?.events?.regionalExpeditions?.windspire?.claimed;
  if(zone==='windspire2'&&id==='stairs')return !!state?.events?.spireAscent?.bridge;
  if(zone==='shrine'&&id==='highland')return !!state?.badge;
  return true;
 }).map(([id,x,y,name,type])=>({id,x,y,name,type}));
}
function selected(state,grid){
 const w=state?.events?.atlasWaypoint;
 if(!w||w.map!==state.map)return null;
 const dest=markers(state.map,state).find(m=>m.id===w.id);
 if(!dest)return null;
 const trail=path(grid,{x:state.x,y:state.y},dest);
 return {marker:dest,path:trail,remaining:Math.max(0,trail.length-1)};
}
function direction(route){
 if(route.length<2)return '';
 const a=route[0],b=route[1];
 return b.y<a.y?'↑':b.y>a.y?'↓':b.x<a.x?'←':'→';
}
function locate(state,marker){
 const active=markers(state.map,state).some(m=>m.id===marker);
 if(!active)return null;
 return {map:state.map,id:marker};
}
const COLORS={0:'#739b6b',1:'#d5bd94',2:'#477f62',3:'#518b9c',4:'#385f4e',5:'#777d81',6:'#e6c893',7:'#7ca56b',8:'#61747b',9:'#756c6b',10:'#ba9a70',11:'#9e9c84',13:'#acb4ad'};
function draw(ctx,grid,zone,state,frame=0){
 if(!ctx||!grid?.length||!grid[0]?.length)return 0;
 const w=grid[0].length,h=grid.length,scale=Math.max(3,Math.min(10,Math.floor(Math.min(364/w,260/h))));
 const ox=Math.round((416-w*scale)/2),oy=Math.round((352-h*scale)/2)+9;
 const selectedMarker=selected(state,grid),locations=markers(zone,state);
 ctx.save();
 ctx.fillStyle='#18313c';ctx.fillRect(0,0,416,352);
 ctx.fillStyle='#294953';ctx.fillRect(12,13,392,326);
 ctx.fillStyle='#f5ebd4';ctx.font='bold 16px system-ui,sans-serif';ctx.textAlign='left';
 ctx.fillText('✦ '+(state?.mapName||'フィールド地図'),25,36);
 ctx.fillStyle='#294d57';ctx.fillRect(ox-6,oy-6,w*scale+12,h*scale+12);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const tile=grid[y][x];ctx.fillStyle=COLORS[tile]||'#6a9880';
  ctx.fillRect(ox+x*scale+.3,oy+y*scale+.3,scale-.6,scale-.6);
 }
 if(selectedMarker?.path.length>1){
  ctx.fillStyle='#e9cd6f';
  for(const p of selectedMarker.path.slice(1,-1)){
   ctx.fillRect(ox+p.x*scale+scale*.35,oy+p.y*scale+scale*.35,Math.max(2,scale*.3),Math.max(2,scale*.3));
  }
 }
 locations.forEach((m,i)=>{
  const px=ox+(m.x+.5)*scale,py=oy+(m.y+.5)*scale;
  ctx.beginPath();ctx.arc(px,py,Math.max(4,scale*.52),0,Math.PI*2);
  ctx.fillStyle=selectedMarker?.marker.id===m.id?'#fce29f':m.type==='gate'?'#f4dda9':m.type==='building'?'#b8e1df':'#d7edaa';ctx.fill();
  ctx.lineWidth=1.3;ctx.strokeStyle='#294956';ctx.stroke();
  ctx.fillStyle='#294956';ctx.font='bold '+Math.max(7,scale*.7)+'px system-ui,sans-serif';ctx.textAlign='center';
  ctx.fillText(String(i+1),px,py+scale*.23);
 });
 const px=ox+(state.x+.5)*scale,py=oy+(state.y+.5)*scale;
 ctx.beginPath();ctx.arc(px,py,Math.max(4,scale*.45)+Math.sin(frame*.1)*.7,0,Math.PI*2);
 ctx.fillStyle='#f47d6b';ctx.fill();ctx.strokeStyle='#fff6df';ctx.lineWidth=2;ctx.stroke();
 ctx.font='bold 10px system-ui,sans-serif';ctx.fillStyle='#f2e8c9';ctx.textAlign='center';
 const detail=selectedMarker?'目的地：'+selectedMarker.marker.name+'  '+selectedMarker.remaining+'歩':'● 現在地     数字：目的地候補     黄色：案内経路';
 ctx.fillText(detail,208,338);
 ctx.restore();
 return locations.length;
}
function drawCompass(ctx,state,grid,frame=0){
 const info=selected(state,grid);if(!ctx||!info||!info.path.length)return false;
 const text=info.remaining===0?'目的地の近くに到着':'あと '+info.remaining+' 歩';
 const arrow=direction(info.path),name=info.marker.name;
 ctx.save();
 ctx.fillStyle='#193d4ee3';ctx.beginPath();ctx.roundRect(12,72,180,36,8);ctx.fill();
 ctx.fillStyle='#f4deb0';ctx.font='bold 19px system-ui,sans-serif';ctx.textAlign='center';
 ctx.fillText(arrow||'◆',31,97);
 ctx.textAlign='left';ctx.font='bold 11px system-ui,sans-serif';
 ctx.fillText(name.slice(0,11),49,86);
 ctx.fillStyle='#e8f0d2';ctx.font='10px system-ui,sans-serif';ctx.fillText(text,49,101);
 ctx.restore();
 return true;
}
return Object.freeze({POIS,COLORS,accessible,nearest,path,markers,selected,direction,locate,draw,drawCompass});
});
