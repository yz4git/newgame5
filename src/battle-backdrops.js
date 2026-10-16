/* ASTRA TALES — completely original, deterministic battle backdrops.
 * Draws with Canvas2D alone; no downloaded texture, server, DOM, or ROM art. */
(function(root,factory){
 const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraBattlebacks=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const W=416,H=352;
const ZONES=['village','route','forest','lake','shrine','highland','home','bedroom','lab','center','mart','observatory'];
const PALETTE={
 village:['#81b8cf','#dbe4ca','#b4cba4','#779b79','#c5c6aa'],
 route:['#80b7d0','#e5e2b2','#b6c89b','#779d73','#c3c4a1'],
 forest:['#3e6b71','#8eaaa0','#48745c','#345b4a','#778a65'],
 lake:['#78b5bf','#e1d9b8','#82babc','#578b91','#c9c6a4'],
 shrine:['#303b66','#7885a2','#545e81','#5f7087','#aaaab3'],
 highland:['#688baf','#c6c6b4','#8b9cb2','#657f97','#adb3ab'],
 home:['#9daba8','#e4d2b6','#b3b0a0','#827e73','#d4c0a8'],
 bedroom:['#99b1bd','#ebd5b7','#c5b4a0','#90775f','#d8c4a9'],
 lab:['#7aa9b8','#d2dcdd','#8497a6','#657f95','#d2d8cf'],
 center:['#83aab4','#c8d4c7','#95ada3','#789b97','#d2d7cb'],
 mart:['#98a6a7','#d6c5a2','#b4a381','#85775f','#d9ccaa'],
 observatory:['#43637e','#a7bac3','#66859e','#56758e','#b7b9aa']
};
const norm=(value,min,max)=>Math.max(min,Math.min(max,value));
function r(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h)}
function e(c,x,y,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);c.fill()}
function l(c,pts,col,w=2){c.lineWidth=w;c.strokeStyle=col;c.lineJoin='round';c.lineCap='round';c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.stroke()}
function poly(c,pts,col){c.fillStyle=col;c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();c.fill()}
function grad(c,colors){
 const g=c.createLinearGradient(0,0,0,H);
 g.addColorStop(0,colors[0]);g.addColorStop(.51,colors[1]);g.addColorStop(1,colors[2]);
 r(c,0,0,W,H,g);
}
function rand(seed,other=0){let n=Math.sin(seed*127.1+other*31.7+77.3)*43758.5453;return n-Math.floor(n)}
function clouds(c,frame,dark=false){
 for(let i=0;i<7;i++){
  const x=(i*83+(frame*.09*(1+i%2)))%(W+120)-60;
  const y=31+i%3*16,shade=dark?'#cbd7cf35':'#f3f7e895';
  e(c,x,y,29,8,shade);e(c,x+19,y-4,26,11,shade);e(c,x-13,y+5,18,6,shade);
 }
}
function hills(c,low,high,front){
 for(let layer=0;layer<3;layer++){
  const points=[[-10,H]];
  for(let x=-10;x<=W+50;x+=26){
   const yy=low-layer*25+Math.sin(x*.022+layer*1.35)*high+Math.sin(x*.063+layer)*8;
   points.push([x,yy]);
  }
  points.push([W+20,H]);
  poly(c,points,front[layer]);
 }
}
function fir(c,x,y,h,dark,light){
 r(c,x-5,y-h*.26,10,h*.35,'#455c58');
 for(let i=0;i<3;i++){
  const offset=i*h*.24;
  poly(c,[[x,y-h+offset],[x-18-i*4,y-h*.32+offset],[x+18+i*4,y-h*.32+offset]],i%2?dark:light);
 }
}
function foliage(c,x,y,size,tone){
 r(c,x-5,y-20,10,30,'#587461');
 e(c,x,y-size*.65,size*.72,size*.55,tone);
 e(c,x-size*.4,y-size*.62,size*.48,size*.40,tone);
 e(c,x+size*.40,y-size*.84,size*.49,size*.43,tone);
}
function stone(c,x,y,h){
 poly(c,[[x-13,y],[x-14,y-h+13],[x-6,y-h],[x+9,y-h+3],[x+14,y]],'#7a8497');
 poly(c,[[x-7,y-h+4],[x+9,y-h+3],[x+6,y-4],[x-3,y-7]],'#a6b4b7');
 l(c,[[x-9,y-h+24],[x+3,y-h+31],[x-5,y-h+42]],'#596d86',2);
}
function platform(c,zone){
 const p=PALETTE[zone]||PALETTE.route;
 const stoneFloor=['shrine','highland','lab','observatory'].includes(zone);
 const water=zone==='lake';
 const enemy=stoneFloor?'#b3bdc5':water?'#c5ddd0':'#c0c6a0';
 const shadow=stoneFloor?'#768ca1':water?'#7dacae':'#86a47e';
 // Elevation, cast shadow and surface contour on two different depth planes.
 e(c,303,212,129,24,'#263b4a35');
 e(c,307,203,132,34,shadow);e(c,306,195,129,29,enemy);
 e(c,303,193,113,22,stoneFloor?'#d1d5d3':water?'#def0dc':'#d8ddb3');
 e(c,104,355,164,28,'#243d4558');
 e(c,105,343,166,39,shadow);e(c,105,337,155,39,enemy);
 e(c,105,330,138,26,stoneFloor?'#c9d2d1':water?'#d5eae4':'#dce4b7');
 for(let i=0;i<9;i++){
  const px=(i*43+33)%W,py=179+(i%3)*12;
  e(c,px,py,2.5,1.6,p[4]);
 }
}
function village(c,frame){
 grad(c,PALETTE.village);clouds(c,frame);
 hills(c,157,12,['#aec4a8','#8eb58f','#699a7c']);
 for(let i=0;i<5;i++){
  const x=-33+i*106;
  r(c,x,119,79,40,'#e2d6b1');r(c,x-7,107,93,18,i%2?'#c27977':'#7092b3');
  r(c,x+9,131,18,21,'#7ba5a4');r(c,x+49,131,18,21,'#7ba5a4');
  r(c,x+33,137,13,22,'#7e776b');
  for(let k=0;k<3;k++)r(c,x+6+k*23,113,17,2,'#f6dfc1aa');
 }
 r(c,0,159,W,20,'#b7b9a6');
 for(let i=0;i<14;i++){
  const x=i*35-15;r(c,x,164,6,21,'#8f8d71');r(c,x,166,30,5,'#d2c8a4');
 }
 r(c,0,188,W,164,'#c4b89a');
 for(let i=0;i<26;i++)e(c,(i*67)%W,190+i%6*25,2,1,'#a89b81');
}
function route(c,frame){
 grad(c,PALETTE.route);clouds(c,frame);
 hills(c,186,24,['#bfd1ac','#99bd8b','#649b72']);
 for(let i=0;i<5;i++){
  const x=i*108-25,y=162+i%2*13;
  fir(c,x,y,76+i%3*13,'#638f71','#7ca688');
 }
 // White stone path widening toward the camera.
 poly(c,[[217,160],[265,160],[W+50,H],[-40,H]],'#d3c79d');
 poly(c,[[224,161],[255,161],[W,H],[0,H]],'#e0d4b0');
 for(let i=0;i<12;i++){
  const y=166+i*i*1.75,x=(i*57)%W;
  e(c,x,y,3+i*.4,1+i*.2,'#b5aa8b');
 }
 for(let i=0;i<14;i++){
  const x=i*37-6;
  r(c,x,172+i%2*8,5,20,'#85745c');
  l(c,[[x,179+i%2*8],[x+36,179+i%2*8]],'#a9916d',3);
 }
}
function forest(c,frame){
 grad(c,PALETTE.forest);
 r(c,0,0,W,162,'#294a4d');
 for(let i=0;i<13;i++){
  const x=i*41-17,h=140+i%4*19;
  r(c,x,23,14,h,'#455b55');
  fir(c,x+3,143,h*.75,'#365e52','#417562');
 }
 for(let i=0;i<8;i++){
  const x=i*72-31,h=147+i%3*14;
  r(c,x,35,28,h,'#655d4a');
  for(let j=0;j<5;j++)l(c,[[x+j*6,164],[x+j*5,67]],'#8f775d',2);
  foliage(c,x+16,75,52,i%2?'#456f54':'#3b664c');
 }
 // Dappled moonlight, fixed lanterns and twisting woodland path.
 poly(c,[[181,156],[228,154],[W+40,H],[-34,H]],'#586e55');
 poly(c,[[187,157],[224,157],[366,H],[46,H]],'#87916f');
 for(let i=0;i<9;i++){
  const x=(i*69+frame*.4)%W,y=40+i%4*38;
  e(c,x,y,2+i%2,2+i%2,'#e6f1af5f');
 }
 for(const x of [44,385]){
  r(c,x,143,5,43,'#6f6752');r(c,x-8,141,21,5,'#aa9473');
  r(c,x-6,124,17,16,'#f4df9b');e(c,x+2,132,20,25,'#fbdb8830');
 }
}
function lake(c,frame){
 grad(c,PALETTE.lake);clouds(c,frame);
 hills(c,150,15,['#b3c7aa','#7ea6a4','#719b95']);
 r(c,0,152,W,136,'#689da8');
 for(let i=0;i<16;i++){
  const x=(i*65+frame*.18)%(W+70)-35,y=160+i%7*19;
  l(c,[[x,y],[x+35+i%4*6,y]],i%3?'#b9e6e0':'#d8f5e9',1.7);
 }
 // Wooden dock recedes in perspective toward distant water.
 poly(c,[[192,170],[236,170],[287,H],[66,H]],'#786a5e');
 poly(c,[[195,168],[234,168],[278,H],[75,H]],'#b29a77');
 for(let i=0;i<11;i++){
  const y=178+i*i*1.65,x1=190-i*10,x2=237+i*8;
  l(c,[[x1,y],[x2,y]],'#786b56',2);
 }
 for(let i=0;i<9;i++){
  const x=i*53-18,y=196+(i%3)*33;
  l(c,[[x,y+8],[x+Math.sin(frame*.025+i)*4,y-30]],'#568e7d',2);
  e(c,x,y-30,2.5,6,'#b6ad81');
 }
}
function shrine(c,frame){
 grad(c,PALETTE.shrine);
 e(c,210,43,49,49,'#dfe9c94f');e(c,210,43,27,27,'#fff6d8a0');
 for(let i=0;i<9;i++){
  const x=i*56-16,h=78+i%3*25;
  stone(c,x,154,h);
  if(i%2===0)r(c,x-21,146,44,12,'#c5c4bd');
 }
 r(c,0,156,W,197,'#63748b');
 poly(c,[[160,155],[251,155],[W+40,H],[-30,H]],'#9095a1');
 poly(c,[[172,156],[241,156],[W,H],[1,H]],'#b3b5b5');
 for(let i=0;i<14;i++){
  const x=i*31+11,y=193+i%5*25;
  l(c,[[x,y],[x+10,y+2]],'#697a92',2);
 }
 for(let i=0;i<22;i++){
  const x=(i*74+frame*.32)%W,y=(i*23+frame*.19)%176;
  e(c,x,y,1.8,2.4,'#ffeec185');
 }
}
function highland(c,frame){
 grad(c,PALETTE.highland);clouds(c,frame);
 // Vertical cliff strata, tiered plateaus and individual glinting crystals.
 for(let layer=0;layer<3;layer++){
  const points=[[-10,H]];
  for(let x=-10;x<W+45;x+=32)points.push([x,143+layer*19+Math.sin(x*.023+layer)*24]);
  points.push([W+20,H]);poly(c,points,['#91a8b2','#829aaa','#6c8594'][layer]);
 }
 r(c,0,193,W,H-193,'#95a6a3');
 for(let i=0;i<15;i++){
  const x=i*32-7,h=30+(i*31%47),y=206+i%4*13;
  poly(c,[[x-8,y],[x-8,y-h],[x,y-h-13],[x+7,y-h],[x+10,y]],'#7191a6');
  poly(c,[[x,y-h-13],[x+7,y-h],[x+3,y]],'#b7d5d4');
  e(c,x,y-h-10+Math.sin(frame*.032+i)*2,2,3,'#fff5d5b1');
 }
 for(let i=0;i<9;i++)l(c,[[0,183+i*24],[W,183+i*24]],'#bac2b052',1.7);
}
function interior(c,zone,frame){
 grad(c,PALETTE[zone]||PALETTE.home);
 const desk=zone==='lab'||zone==='center';
 r(c,0,143,W,H-143,zone==='lab'?'#a8bec5':'#d6c6af');
 for(let i=0;i<11;i++)l(c,[[0,148+i*24],[W,148+i*24]],'#fff9e066',1.1);
 for(let i=0;i<15;i++){
  const x=i*32-15;
  l(c,[[x,150],[W/2+(x-W/2)*2,H]],'#8ca4a04c',1);
 }
 for(let i=0;i<4;i++){
  const x=i*130-4;
  r(c,x,52,99,73,'#9aafad');
  r(c,x+6,58,87,62,zone==='observatory'?'#50758b':'#d7ddd0');
  r(c,x+12,64,75,49,zone==='observatory'?'#84b2b8':'#aec7c4');
 }
 if(desk){
  r(c,0,144,W,24,'#788f92');r(c,0,151,W,13,'#c3d9cf');
  for(let i=0;i<8;i++){const x=i*58;r(c,x,137,44,16,'#8fb7bd');r(c,x+8,138,28,6,'#d7e9d9')}
 }else{
  r(c,0,151,W,12,'#988269');
  for(let i=0;i<7;i++){const x=i*66;r(c,x,132,14,30,'#a48c70');r(c,x+20,142,23,12,'#c2b09a')}
 }
 if(zone==='observatory'){
  e(c,207,28,67,27,'#8196a9');e(c,207,19,58,26,'#577d93');
  l(c,[[208,54],[234,21]],'#dae2da',6);
 }
}
function draw(c,zone,frame=0){
 if(!c||typeof c.fillRect!=='function')return false;
 const id=ZONES.includes(zone)?zone:'route';
 c.save();
 if(['village','route','forest','lake','shrine','highland'].includes(id)){
  ({village,route,forest,lake,shrine,highland})[id](c,frame);
 }else interior(c,id,frame);
 platform(c,id);
 c.restore();
 return id;
}
return Object.freeze({ZONES,PALETTE,draw});
});
