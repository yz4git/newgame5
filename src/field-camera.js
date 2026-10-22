/* ASTRA TALES — controllable cinematic field camera.
 * Camera pans ahead in travel direction, dampens thumb-turn discontinuities,
 * and snaps cleanly when crossing an indoor/outdoor portal.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraFieldCamera=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const OFFSET={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
function position({zone,x,y,dir='down',running=false,indoor=false,cinematic=false,width,height,viewW=416,viewH=352,tile=32}){
 const [dx,dy]=OFFSET[dir]||[0,0],lookAhead=indoor||cinematic?0:running?1.15:.68;
 const maxX=Math.max(0,width*tile-viewW),maxY=Math.max(0,height*tile-viewH);
 return {zone,x:clamp((x+lookAhead*dx)*tile+tile/2-viewW/2,0,maxX),
 y:clamp((y+lookAhead*dy*.72)*tile+tile/2-viewH/2,0,maxY)};
}
function track(previous,params){
 const p=position(params),now=Number.isFinite(params.now)?params.now:0;
 if(!previous||previous.zone!==params.zone||params.snap)return {...p,time:now};
 const dt=clamp(now-previous.time,0,80);
 const alpha=dt===0?0:1-Math.exp(-dt/(params.indoor?65:95));
 return {zone:p.zone,x:previous.x+(p.x-previous.x)*alpha,y:previous.y+(p.y-previous.y)*alpha,time:now};
}
function title(ctx,transition,mapName,now,indoor){
 if(!ctx||!transition||!mapName)return false;
 const time=now-transition.started;
 if(time<610||time>2450)return false;
 const fade=clamp((time-610)/350,0,1)*(1-clamp((time-1960)/490,0,1));
 if(fade<=0)return false;
 const label=mapName.length>16?mapName.slice(0,16)+'…':mapName;
 ctx.save();ctx.globalAlpha=fade;
 const width=Math.max(158,Math.min(290,label.length*17+54)),x=(416-width)/2,y=35;
 ctx.fillStyle='#183f4fdc';ctx.beginPath();ctx.roundRect(x,y,width,49,10);ctx.fill();
 ctx.fillStyle='#e3d19a';ctx.fillRect(x+15,y+9,3,30);
 ctx.textAlign='center';
 ctx.font='bold 10px system-ui,sans-serif';ctx.fillStyle='#d3ebcf';
 ctx.fillText(indoor?'INSIDE / 建物に入る':'NEW AREA / 地域を探索',208,y+17);
 ctx.font='bold 15px system-ui,sans-serif';ctx.fillStyle='#fcf1da';
 ctx.fillText(label,208,y+37);ctx.restore();
 return true;
}
return Object.freeze({OFFSET,position,track,title});
});
