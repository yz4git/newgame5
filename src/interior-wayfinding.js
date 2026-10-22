/* ASTRA TALES — make indoor doors and passage thresholds readable.
 * Derives all markers from the canonical DOORS table, never from copies.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraInteriorWayfinding=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function portalList(zone,doors,state={}){
 const entries=Object.entries(doors?.[zone]||{});
 return entries.map(([key,link])=>{
  const [x,y]=key.split(',').map(Number);
  const claimed=Object.values(state?.events?.fieldRequests||{}).filter(r=>r?.claimed).length;
  const locked=link.id==='archive'&&!state?.events?.townLegacy?.claimed||
   link.id==='workshop'&&claimed<2||
   link.id==='starlab'&&(state?.story?.stage||0)<12;
  const exit=['village','lake','route','forest','shrine','highland'].includes(link.id);
  return {x,y,target:link.id,locked,exit};
 }).filter(p=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.target);
}
function draw(ctx,zone,doors,state,camX,camY,names,frame=0,T=32){
 if(!ctx||!doors?.[zone])return 0;
 const list=portalList(zone,doors,state);
 let count=0;ctx.save();
 for(const p of list){
  const x=p.x*T-camX,y=p.y*T-camY;
  if(x<-50||x>466||y<-60||y>400)continue;
  const pulse=.4+.6*(.5+.5*Math.sin(frame*.065+p.x+p.y));
  const bg=p.locked?'#7d7075':'#6d958c';
  const edge=p.locked?'#cfaca7':'#e9d59d';
  // Floor-level destination stripe and two vertical doorposts, no collision.
  ctx.fillStyle=bg;ctx.fillRect(x+3,y+24,T-6,5);
  ctx.fillStyle=edge;ctx.fillRect(x+4,y+24,T-8,1.5);
  ctx.fillStyle='#304b55';ctx.fillRect(x+2,y+8,3,20);ctx.fillRect(x+T-5,y+8,3,20);
  ctx.fillStyle=edge;ctx.fillRect(x+2,y+7,T-4,3);
  const near=Math.abs((state?.x??100)-p.x)+Math.abs((state?.y??100)-p.y)<=6;
  if(near){
   const name=p.locked?'まだ開かない':p.exit?'外へ出る':(names?.[p.target]?.name||names?.[p.target]||'次の部屋へ');
   const width=Math.min(136,Math.max(78,name.length*11+22));
   const cx=x+T/2,yy=y-12+Math.sin(frame*.05+p.x)*2;
   ctx.globalAlpha=.73+pulse*.27;
   ctx.fillStyle='#234754e3';ctx.beginPath();ctx.roundRect(cx-width/2,yy-16,width,19,6);ctx.fill();
   ctx.fillStyle=p.locked?'#e9c5b4':'#f6eecf';
   ctx.font='bold 10px system-ui,sans-serif';ctx.textAlign='center';
   ctx.fillText(name,cx,yy-3);
   ctx.globalAlpha=1;
  }
  count++;
 }
 ctx.restore();return count;
}
return Object.freeze({portalList,draw});
});
