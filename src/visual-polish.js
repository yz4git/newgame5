/* ASTRA TALES v0.27 — locality-aware 2D finishing passes.
 * All effects are bounded, deterministic and independent of the tile collision map.
 * Original procedural art only; works on iPhone Safari Canvas 2D.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraVisualPolish=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const WIDTH=416,HEIGHT=352;
const COLORS=Object.freeze({
 火:['#f8c47b','#e77b58','#fff1c9'],水:['#a3e7dc','#65b4d0','#f4ffff'],
 草:['#a6d99a','#64a57b','#d9edb6'],雷:['#fbe17c','#edbc59','#fff9e4'],
 風:['#bddfe5','#81b9c7','#f4fbf5'],岩:['#bfb5a2','#998c7d','#f6e9ce'],
 影:['#b6a6da','#85739f','#e9e2f1'],光:['#f9e8a5','#d7bf7a','#fffbed'],
 無:['#c3d8d5','#829fae','#eef4e9']});
function hash(i,j,seed=1){let n=(Math.imul(i+73,374761393)+Math.imul(j+17,668265263)+seed*1442695041)|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295}
function ellipse(c,x,y,a,b,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,Math.max(.25,a),Math.max(.25,b),0,0,Math.PI*2);c.fill()}
function line(c,x,y,x2,y2,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke()}
function polygon(c,points,color){c.fillStyle=color;c.beginPath();c.moveTo(...points[0]);for(let k=1;k<points.length;k++)c.lineTo(...points[k]);c.closePath();c.fill()}
function field(c,zone,camX,camY,frame=0,phase=0){
 if(!c||!['village','route','forest','lake','shrine','highland'].includes(zone))return 0;
 let count=0;
 c.save();
 // Parallax elements are anchored to the world to avoid visible tile-repeat seams.
 if(zone==='forest'){
  // Broken canopy and a narrow curtain of backlit leaves at the image edge.
  for(let i=0;i<9;i++){
   const x=(i*77-camX*.24+720)%530-45;
   const y=8+i%3*6+Math.sin(frame*.018+i)*2;
   ellipse(c,x,y-5,29+i%3*7,12,'#224d4680');
   ellipse(c,x-12,y+1,20+i%2*5,7,'#3b755873');
   for(let k=0;k<2;k++){
    const lx=x+(k?18:-11)+Math.sin(frame*.016+i+k)*3,ly=y+13+k*9;
    ellipse(c,lx,ly,4.2,2.3,k?'#84aa737c':'#779b697c');
    count++;
   }
  }
 }else if(zone==='lake'){
  for(let i=0;i<22;i++){
   const wx=i*93+hash(i,2)*34,wy=(i%6)*69+hash(i,9)*25;
   const x=((wx-camX*.57)%560+560)%560-55,y=((wy-camY*.62)%430+430)%430-25;
   const glint=.4+.6*Math.sin(frame*.037+i*2.2);
   line(c,x,y,x+5+glint*12,y,'#eaf9ea75',1.2);
   if(i%4===0)ellipse(c,x+7,y-3,1.5,2,'#d9efe8a4');
   count++;
  }
 }else if(zone==='highland'){
  for(let i=0;i<15;i++){
   const x=((i*87-camX*.31+frame*.25)%580+580)%580-80;
   const y=((i*43+camY*.2)%300+300)%300+15;
   line(c,x,y,x+24+i%3*7,y-4,'#e6eef083',.8+i%3*.4);
   if(i%4===0)ellipse(c,x+29,y-5,1.3,1.3,'#f5eacc9f');
   count++;
  }
 }else if(zone==='shrine'){
  for(let i=0;i<14;i++){
   const x=((i*129-camX*.17)%530+530)%530-40;
   const y=((i*81+frame*.22-camY*.11)%420+420)%420-20;
   ellipse(c,x,y,1.4+i%3*.4,2.4,'#fff1c295');
   count++;
  }
 }else if(zone==='route'){
  // Wind moving through the roadside: no horizontal curtain over the player.
  for(let i=0;i<13;i++){
   const x=((i*83-camX*.37+frame*.15)%530+530)%530-44;
   const y=(i*47-camY*.15+400)%285+34;
   line(c,x,y,x+12,y-2,'#e5e6b77a',1);
   if(i%3===0)ellipse(c,x+12,y-2,2,1,'#fbefc48a');
   count++;
  }
 }else{
  // Town bunting and window-speck highlights for a lived-in streetscape.
  for(let i=0;i<9;i++){
   const x=((i*105-camX*.28+500)%510+510)%510-45;
   const y=7+i%3*4;
   ellipse(c,x,y,2.8,1.6,'#e9d7a798');
   if(i%3===1)line(c,x-4,y-1,x+6,y-3,'#f9ebcf83',1);
   count++;
  }
 }
 if(phase===2&&['forest','highland','shrine'].includes(zone)){
  for(let i=0;i<11;i++){
   const x=((i*71-camX*.23)%490+490)%490-22;
   const y=((i*59+frame*.16-camY*.18)%390+390)%390-9;
   ellipse(c,x,y,1.3+hash(i,17),1.3+hash(i,17),'#f6ebadad');
   count++;
  }
 }
 c.restore();
 return count;
}
function footsteps(c,from,to,progress,zone){
 if(!c||!from||!to||progress<0||progress>=1||['center','mart','lab','home','bedroom','workshop','archive'].includes(zone))return 0;
 const dx=to.x-from.x,dy=to.y-from.y;
 if(Math.abs(dx)+Math.abs(dy)>38)return 0;
 const x=from.x+dx*progress,y=from.y+dy*progress+10;
 const intensity=Math.sin(Math.PI*progress);
 c.save();
 ellipse(c,x-dy*.10,y+2,4.2,1.4,'#253d4d3b');
 ellipse(c,x+dy*.10+dx*.11,y,2.6,1.25,zone==='lake'?'#d4efdf77':'#e3d3a478');
 if(intensity>.35)ellipse(c,x-dx*.22,y-2,1.4,1,'#f1ead886');
 c.restore();
 return 1;
}
function battleImpact(c,type,x,y,progress,frame=0,{critical=false,effectiveness=1}={}){
 if(!c||!Number.isFinite(progress)||progress<.35||progress>.82)return 0;
 const colors=COLORS[type]||COLORS['無'];
 const t=(progress-.35)/.47,spread=5+t*43,fade=Math.sin(Math.PI*Math.max(0,Math.min(1,t)));
 let count=0;
 c.save();
 if(type==='雷'){
  for(let ray=0;ray<5;ray++){
   const a=ray*Math.PI*2/5+frame*.012,ox=Math.cos(a),oy=Math.sin(a);
   const px=x+ox*spread*.32,py=y+oy*spread*.25;
   line(c,px,py,px+ox*spread*.55-oy*9,py+oy*spread*.55+ox*9,colors[ray%2],2.3*fade);
   line(c,px+ox*spread*.55-oy*9,py+oy*spread*.55+ox*9,x+ox*spread,y+oy*spread*.75,colors[2],1.4*fade);
   count+=2;
  }
 }else if(type==='岩'){
  for(let i=0;i<11;i++){
   const a=i*2.4,rx=x+Math.cos(a)*spread,ry=y+Math.sin(a)*spread*.72;
   polygon(c,[[rx-5,ry+4],[rx-2,ry-4],[rx+4,ry-6],[rx+6,ry+3]],colors[i%2]);count++;
  }
 }else if(type==='水'){
  for(let i=0;i<14;i++){
   const a=i*Math.PI*2/14;
   const px=x+Math.cos(a)*spread*1.2,py=y+Math.sin(a)*spread*.6;
   ellipse(c,px,py,2.3+i%3,3+i%3,colors[i%3]);count++;
  }
 }else if(type==='草'){
  for(let i=0;i<12;i++){
   const a=i*2.399+frame*.006,px=x+Math.cos(a)*spread,py=y+Math.sin(a)*spread*.75;
   ellipse(c,px,py,3.5,1.8,colors[i%2]);count++;
  }
 }else if(type==='風'){
  for(let i=0;i<8;i++){
   const yy=y-31+i*9,xx=x-spread+Math.sin(i+frame*.03)*8;
   line(c,xx,yy,xx+spread*1.5,yy-6,colors[i%2],1.8*fade);count++;
  }
 }else if(type==='影'){
  for(let i=0;i<10;i++){
   const a=i*Math.PI/5,px=x+Math.cos(a)*spread,py=y+Math.sin(a)*spread*.67;
   line(c,px,py,x+Math.cos(a+.36)*spread*.65,y+Math.sin(a+.36)*spread*.45,colors[i%2],2*fade);count++;
  }
 }else if(type==='火'){
  for(let i=0;i<16;i++){
   const a=i*2.399,px=x+Math.cos(a)*spread*.72,py=y+Math.sin(a)*spread*.38-t*20;
   ellipse(c,px,py,2.3+i%3,3.2+i%4,colors[i%3]);count++;
  }
 }else{
  for(let i=0;i<12;i++){
   const a=i*Math.PI/6,px=x+Math.cos(a)*spread,py=y+Math.sin(a)*spread*.72;
   line(c,x+Math.cos(a)*spread*.25,y+Math.sin(a)*spread*.15,px,py,colors[i%3],1.2+1.6*fade);count++;
  }
 }
 if(critical||effectiveness>1){
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3+frame*.008;
   ellipse(c,x+Math.cos(a)*spread*.82,y+Math.sin(a)*spread*.55,1.8,1.8,colors[2]);count++;
  }
 }
 c.restore();
 return count;
}
return Object.freeze({COLORS,hash,field,footsteps,battleImpact});
});
