/* ASTRA TALES — original creature art / directional 2D animation.
 * Independent species-specific geometry, no ROM or third-party sprites.
 * Caller owns transform; this module never depends on the DOM. */
(function(root,factory){const value=factory();if(typeof module!=='undefined'&&module.exports)module.exports=value;root.AstraCreatureArt=value})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SHAPES=['fox','deer','otter','rabbit','mouse','bird','frog','squirrel','moth','beetle','bat','flower','dragon'];
const cOutline='#344251',cShadow='#263c4c88',cGleam='#fffde2aa';
function E(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);c.fill()}
function R(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h)}
function P(c,points,color){c.fillStyle=color;c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();c.fill()}
function L(c,points,color,width=3){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.stroke()}
function ring(c,x,y,rx,ry,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.stroke()}
function glint(c,x,y,s=2){E(c,x,y,s,s,cGleam);E(c,x-.6,y-.7,s*.34,s*.34,'#fff')}
function leaf(c,x,y,dx,dy,color){P(c,[[x,y],[x+dx*.3-5,y+dy*.4],[x+dx,y+dy],[x+dx*.6+4,y+dy*.65]],color);L(c,[[x,y],[x+dx,y+dy]],'#396c4a',1)}
function pelt(c,x,y,w,h,body,accent){E(c,x,y,w+3,h+3,cOutline);E(c,x,y,w,h,body);E(c,x-8,y-10,w*.42,h*.32,accent+'88')}
function eyes(c,back,style='friendly',open=true){
 if(back){R(c,-16,-16,32,4,'#213c4966');return}
 if(!open){L(c,[[-22,-22],[-10,-20]],'#263747',3);L(c,[[10,-20],[22,-22]],'#263747',3);return}
 const narrow=style==='sharp'||style==='menacing';
 E(c,-15,-21,narrow?4.1:5.5,narrow?5:7,'#fff5e8');
 E(c,15,-21,narrow?4.1:5.5,narrow?5:7,'#fff5e8');
 E(c,-14,-21,narrow?2.6:3.4,narrow?3:4.3,narrow?'#8a4959':'#244354');
 E(c,16,-21,narrow?2.6:3.4,narrow?3:4.3,narrow?'#8a4959':'#244354');
 glint(c,-15,-23,1.3);glint(c,15,-23,1.3);
 if(narrow){L(c,[[-22,-29],[-11,-24]],'#30414c',2);L(c,[[11,-24],[22,-29]],'#30414c',2)}
}
function fur(c,x,y,body,size=5){P(c,[[x-size,y+size],[x,y-size],[x+size,y+size]],body)}
function draw(c,s,frame=0,back=false){
 if(!s||!SHAPES.includes(s.shape))return false;
 const id=s.id,advanced=['flaro','leafaro','aquaron'].includes(id);
 const B=s.color,A=s.accent;
 const t=frame*.055,breath=Math.sin(t)*1.55,wing=Math.sin(t*2.5)*9,tail=Math.sin(t*1.8)*6;
 const blink=(Math.floor(frame/110)+(id.length*7))%7===0&&frame%110<8;
 E(c,0,6,54,10,'#1b354255');
 // Distinct silhouettes: appendages are layered behind the main torso.
 switch(s.shape){
 case 'fox':{
  const flame=P;
  // Bushy forked flame-tail with animated ribbons.
  P(c,[[22,-4],[46,-27+tail],[51,-42+tail],[59,-28+tail],[77,-49+tail],[73,-18+tail],[57,-2],[37,10]],'#914b55');
  P(c,[[31,-8],[54,-30+tail],[63,-38+tail],[60,-18+tail],[50,0]],'#f4a65f');
  P(c,[[46,-13],[65,-29+tail],[61,-11],[52,1]],'#ffe4a1');
  E(c,-22,4,15,16,cOutline);E(c,22,4,15,16,cOutline);
  P(c,[[-37,-37],[-42,-84+tail*.12],[-12,-55]],cOutline);
  P(c,[[12,-55],[42,-82+tail*.12],[37,-35]],cOutline);
  P(c,[[-33,-41],[-36,-71],[-19,-51]],B);
  P(c,[[19,-51],[36,-69],[33,-41]],B);
  P(c,[[-32,-50],[-33,-66],[-22,-53]],A);
  P(c,[[22,-53],[33,-65],[32,-50]],A);
  pelt(c,0,-20+breath,39,38,B,A);
  P(c,[[-25,-3],[-12,-26],[0,-8],[14,-26],[28,-3],[0,16]],A);
  P(c,[[-22,-15],[0,-1],[22,-15],[0,20]],'#fbe4b8');
  E(c,-29,5,12,10,B);E(c,29,5,12,10,B);
  if(advanced){
   P(c,[[-30,-39],[-61,-68+wing],[-46,-36],[-64,-13],[-29,-20]],'#c35a49');
   P(c,[[30,-39],[61,-68+wing],[46,-36],[64,-13],[29,-20]],'#c35a49');
   P(c,[[-27,-43],[-54,-53+wing],[-43,-28]],'#ffb56d');
   P(c,[[27,-43],[54,-53+wing],[43,-28]],'#ffb56d');
   for(let i=0;i<3;i++)fur(c,-15+i*15,-65-i%2*7,A,9);
  }
  if(!back){eyes(c,false,advanced?'sharp':'friendly',!blink);E(c,0,-9,6,4,'#69545b');L(c,[[-3,-5],[0,-2],[3,-5]],'#7d5150',1.5)}
  else{for(let i=0;i<4;i++)fur(c,-24+i*16,-43,A,8);E(c,0,-3,12,16,'#8d4a4477')}
  break;
 }
 case 'deer':{
  for(const side of [-1,1]){
   E(c,side*22,5,10,17,cOutline);E(c,side*22,5,8,15,B);
   L(c,[[side*20,-49],[side*30,-72+wing*.18],[side*44,-83]],'#5a8467',5);
   L(c,[[side*28,-68],[side*15,-80],[side*11,-91]],'#608f6b',4);
   leaf(c,side*30,-71,side*17,-16,A);
   leaf(c,side*20,-69,-side*11,-19,'#8fb784');
   P(c,[[side*20,-32],[side*34,-47],[side*37,-24]],B);
  }
  E(c,0,-9,33,33,cOutline);
  E(c,0,-11,30,30,B);
  E(c,0,-26,29,33,B);
  E(c,0,-9,23,20,A);
  for(let i=0;i<5;i++)fur(c,-25+i*12,-20,A,7);
  if(advanced){
   E(c,0,-4,23,24,'#4e8664');
   for(let i=0;i<4;i++)leaf(c,(i-1.5)*18,-41,(i-1)*5,-21,A);
  }
  if(!back){eyes(c,false,'friendly',!blink);E(c,0,-9,6,7,'#e9d9b5');E(c,0,-6,2.8,2.6,'#567056')}
  else{L(c,[[-8,-31],[0,-49],[8,-31]],'#e7e9ad',4);E(c,0,-9,15,15,'#468d65aa')}
  break;
 }
 case 'otter':{
  P(c,[[13,-4],[35,6+tail],[58,12+tail],[73,-2+tail],[63,17+tail],[40,18+tail],[26,15]],cOutline);
  P(c,[[13,0],[39,8+tail],[63,9+tail],[51,16+tail],[25,11]],A);
  E(c,-22,2,16,11,B);E(c,20,4,15,12,B);
  for(const side of [-1,1]){
   P(c,[[side*27,-24],[side*43,-40],[side*36,-8],[side*22,0]],cOutline);
   P(c,[[side*29,-26],[side*40,-34],[side*35,-11],[side*25,-4]],A);
  }
  pelt(c,0,-20+breath,34,37,B,A);
  E(c,0,-9,21,25,'#d0ecdf');
  E(c,-28,-42,12,14,cOutline);E(c,28,-42,12,14,cOutline);
  E(c,-28,-42,9,10,B);E(c,28,-42,9,10,B);
  if(advanced){
   for(let side of [-1,1]){
    P(c,[[side*22,-43],[side*49,-59+wing],[side*42,-27]],'#6cc7c9');
    for(let i=0;i<3;i++)E(c,side*(30+i*5),-16+i*4,3,6,'#c5f8f4');
   }
   ring(c,0,-15,27,34,'#c1f5df',2);
  }
  if(!back){eyes(c,false,'friendly',!blink);E(c,0,-10,8,5,'#6b8590');L(c,[[-7,-3],[-16,0]],'#647e7a',1.4);L(c,[[7,-3],[16,0]],'#647e7a',1.4)}
  else{E(c,0,-8,10,19,'#468dab7b');L(c,[[-13,-43],[0,-34],[13,-43]],A,3)}
  break;
 }
 case 'rabbit':{
  for(let side of [-1,1]){
   P(c,[[side*12,-42],[side*9,-91+wing*.25],[side*30,-73],[side*25,-37]],cOutline);
   P(c,[[side*13,-44],[side*13,-84],[side*25,-69],[side*22,-41]],B);
   P(c,[[side*16,-54],[side*18,-74],[side*21,-56]],A);
  }
  E(c,-23,9,18,10,cOutline);E(c,23,9,18,10,cOutline);
  pelt(c,0,-16+breath,33,31,B,A);
  E(c,0,-6,20,21,A);
  E(c,29,-9,10,11,'#e9e7be');E(c,32,-9,5,6,'#faf7d1');
  leaf(c,0,-49,10,-15,'#83b46f');
  if(!back){eyes(c,false,'friendly',!blink);E(c,0,-11,4,3,'#a56b64')}
  else{E(c,0,0,13,9,'#9dbc6a')}
  break;
 }
 case 'mouse':{
  L(c,[[24,5],[44,2+tail],[59,-14+tail],[70,-10+tail]],cOutline,10);
  L(c,[[24,4],[42,1+tail],[59,-13+tail],[70,-10+tail]],'#d8b38b',5);
  for(const side of [-1,1]){
   E(c,side*30,-45,20,21,cOutline);E(c,side*30,-45,17,18,B);E(c,side*30,-45,11,12,'#eac8b0');
   E(c,side*22,9,14,9,B);
  }
  pelt(c,0,-15+breath,35,30,B,A);
  E(c,0,-6,24,17,A);
  if(!back){eyes(c,false,'friendly',!blink);E(c,0,-5,6,4,'#be8881');for(const side of [-1,1]){L(c,[[side*5,-3],[side*30,-7]],'#675c5c',1.4);L(c,[[side*5,0],[side*30,3]],'#675c5c',1.4)}}
  else{E(c,0,-7,14,10,'#bb9871')}
  break;
 }
 case 'bird':{
  const spread=18+wing;
  for(let side of [-1,1]){
   P(c,[[side*18,-22],[side*(34+spread),-48-wing],[side*60,-40-wing*.5],[side*48,-8],[side*16,1]],cOutline);
   P(c,[[side*21,-26],[side*(33+spread),-45-wing],[side*56,-38-wing*.5],[side*43,-12]],A);
   for(let i=0;i<3;i++)P(c,[[side*(38+i*6),-24-i*2],[side*(45+i*7),-9+i*3],[side*(26+i*6),-6]],B);
   E(c,side*18,6,13,10,B);
  }
  P(c,[[-12,-1],[-24,20],[-6,10]],A);P(c,[[12,-1],[24,20],[6,10]],A);
  pelt(c,0,-22+breath,26,31,B,A);E(c,0,-15,16,19,A);
  P(c,[[-7,-16],[0,-5],[7,-16]],'#e6b46b');
  if(!back){eyes(c,false,'friendly',!blink);E(c,0,-28,4,4,'#f9ebd6')}
  else{for(let i=0;i<4;i++)fur(c,-18+i*12,-36,A,7)}
  break;
 }
 case 'frog':{
  for(let side of [-1,1]){
   E(c,side*31,6,18,11,cOutline);E(c,side*31,6,15,9,B);
   E(c,side*22,-39,18,20,cOutline);E(c,side*22,-39,15,17,B);
   E(c,side*22,-39,9,12,'#f3f8e2');
   E(c,side*22+2,-38,4,7,'#2c4f5b');
  }
  pelt(c,0,-12+breath,43,30,B,A);
  E(c,0,-3,30,19,A);
  for(let i=0;i<6;i++)E(c,(i%3-1)*19,-28+Math.floor(i/3)*15,4,3,'#5a9f9e');
  if(!back){E(c,0,-13,6,3,'#619a9b');L(c,[[-14,-3],[0,0],[14,-3]],'#4b7e83',2)}
  else{E(c,0,-11,23,15,'#4e929c');for(let i=0;i<4;i++)E(c,i*11-17,-18,3,3,A)}
  break;
 }
 case 'squirrel':{
  // Double-zigzag electric tail is the primary recognisable silhouette.
  P(c,[[22,-4],[37,-24+tail],[29,-42+tail],[50,-52+tail],[42,-74+tail],[70,-56+tail],[58,-38+tail],[69,-25+tail],[44,-1]],cOutline);
  P(c,[[26,-7],[44,-29+tail],[35,-45+tail],[53,-49+tail],[49,-60+tail],[63,-54+tail],[52,-37+tail],[59,-28+tail]],'#ebce70');
  P(c,[[-21,-40],[-37,-59],[-30,-25]],cOutline);
  P(c,[[21,-40],[37,-59],[30,-25]],cOutline);
  pelt(c,0,-17+breath,33,32,B,A);
  E(c,0,-6,21,23,A);
  E(c,-27,7,14,9,B);E(c,27,7,14,9,B);
  E(c,-23,-10,8,7,'#db8d69');E(c,23,-10,8,7,'#db8d69');
  if(!back){eyes(c,false,'friendly',!blink);E(c,0,-6,4,3,'#9b6e59')}
  else{P(c,[[-9,-29],[4,-13],[-3,-13],[14,2]],'#f8e7ad')}
  break;
 }
 case 'moth':{
  for(let side of [-1,1]){
   const dx=wing*.4;
   P(c,[[side*12,-27],[side*(60+dx),-70],[side*(63+dx),-25],[side*33,0],[side*11,-8]],cOutline);
   P(c,[[side*16,-27],[side*(55+dx),-62],[side*(58+dx),-26],[side*31,-5]],A);
   E(c,side*(38+dx),-35,14,12,'#d0aacb');
   E(c,side*(39+dx),-35,8,7,'#fff1bd');
   E(c,side*(39+dx),-35,3.5,3.5,'#7b78a5');
   P(c,[[side*14,-11],[side*(48+dx),5],[side*(39+dx),18],[side*10,5]],B);
   L(c,[[side*5,-36],[side*16,-60]],'#676b80',3);
   E(c,side*18,-61,4,4,A);
  }
  pelt(c,0,-18+breath,19,27,B,A);
  for(let i=0;i<4;i++)E(c,0,-6+i*5,16-i*2,3,i%2?A:B);
  if(!back){eyes(c,false,'friendly',!blink)}else{L(c,[[-7,-36],[0,-43],[7,-36]],'#e8dbd2',3)}
  break;
 }
 case 'beetle':{
  for(let side of [-1,1]){
   L(c,[[side*22,-10],[side*46,-21],[side*56,-7]],cOutline,8);
   L(c,[[side*20,0],[side*43,6],[side*50,17]],cOutline,8);
   L(c,[[side*22,-10],[side*48,-20]],'#8a90a7',4);
  }
  E(c,0,-6,44,31,cOutline);E(c,0,-6,40,27,B);
  E(c,0,-19,36,24,A);
  E(c,0,-18,30,19,'#b2acaf');
  L(c,[[0,1],[0,-40]],'#59677f',3);
  P(c,[[-18,-30],[-31,-58],[-14,-45],[-4,-53],[0,-25]],cOutline);
  P(c,[[18,-30],[31,-58],[14,-45],[4,-53],[0,-25]],cOutline);
  if(!back){E(c,-17,-20,5,4,'#344051');E(c,17,-20,5,4,'#344051')}
  else{for(let i=0;i<4;i++)L(c,[[-28,-21+i*11],[28,-21+i*11]],'#848ca0',3)}
  break;
 }
 case 'bat':{
  for(const side of [-1,1]){
   const lift=wing*.65;
   P(c,[[side*12,-30],[side*(40+lift),-59-lift],[side*(44+lift),-26],[side*68,-12],
    [side*53,2],[side*33,-5],[side*12,-2]],cOutline);
   P(c,[[side*18,-29],[side*(39+lift),-51-lift],[side*(40+lift),-24],
    [side*58,-13],[side*47,-5],[side*32,-10]],B);
   L(c,[[side*20,-20],[side*(38+lift),-42-lift],[side*48,-10]],A,2);
   P(c,[[side*9,-30],[side*13,-70],[side*29,-42]],cOutline);
   P(c,[[side*14,-35],[side*16,-59],[side*23,-42]],A);
  }
  pelt(c,0,-17+breath,25,29,B,A);
  E(c,0,-8,14,18,A);
  P(c,[[-8,-2],[-3,10],[0,0],[3,10],[8,-2]],'#f9d4e9');
  if(!back){eyes(c,false,'menacing',!blink)}
  else{P(c,[[-15,-29],[0,-44],[15,-29],[0,-10]],'#8e82c2')}
  break;
 }
 case 'flower':{
  for(const side of [-1,1]){
   leaf(c,side*13,0,side*40,-25,'#6c9a73');
   E(c,side*22,10,12,10,'#567d5a');
  }
  pelt(c,0,-8,23,25,'#6d9e71','#a0b983');
  L(c,[[0,-12],[0,-52]],'#4e8d66',12);
  for(let i=0;i<7;i++){
   const a=i*Math.PI*2/7+Math.sin(t)*.075;
   E(c,Math.cos(a)*27,-49+Math.sin(a)*23+wing*.12,16,19,i%2?B:A);
   E(c,Math.cos(a)*26-3,-49+Math.sin(a)*22-4,7,9,'#ffffff30');
  }
  E(c,0,-50,19,19,cOutline);E(c,0,-50,16,16,'#eac56b');
  for(let i=0;i<6;i++)E(c,Math.cos(i)*10,-50+Math.sin(i)*10,2,2,'#f7e4a0');
  if(!back){E(c,-5,-52,2,3,'#6e6755');E(c,6,-52,2,3,'#6e6755');L(c,[[-3,-45],[3,-45]],'#9a7860',1)}
  else{E(c,0,-50,9,9,'#c8a761')}
  break;
 }
 case 'dragon':{
  for(let side of [-1,1]){
   P(c,[[side*14,-24],[side*52,-68+wing],[side*71,-25],[side*59,7],[side*32,-3]],cOutline);
   P(c,[[side*19,-27],[side*50,-58+wing],[side*62,-25],[side*53,1],[side*31,-6]],A);
   for(let k=0;k<3;k++)L(c,[[side*22,-23],[side*(39+k*8),-35-k*6+wing*.3]],'#879aa4',1.8);
   P(c,[[side*15,-45],[side*22,-89],[side*32,-51]],'#708d95');
   E(c,side*25,5,16,16,B);
  }
  P(c,[[15,-3],[34,19+tail],[54,16+tail],[74,1+tail],[69,28+tail],[45,30+tail],[20,16]],cOutline);
  E(c,0,-18+breath,36,42,cOutline);
  E(c,0,-17+breath,32,38,B);
  E(c,0,-3,22,29,A);
  for(let i=0;i<4;i++)P(c,[[-12+i*9,-52],[-7+i*9,-74-(i%2)*10],[0+i*9,-50]],A);
  for(let i=0;i<5;i++)E(c,0,-23+i*11,12-i,3,'#fff4c18a');
  if(!back){eyes(c,false,'sharp',!blink);E(c,0,-7,7,5,'#748b91');glint(c,0,-16,4)}
  else{for(let i=0;i<4;i++)P(c,[[-5,-52+i*15],[0,-65+i*15],[5,-52+i*15]],'#d3e8e5')}
  break;
 }
 }
 // Crisp silhouette rim, belly depth, small specular texture, and animation phase.
 if(s.shape!=='bird'&&s.shape!=='flower'){
  for(let i=0;i<3;i++){
   const dx=(i-1)*12,dy=-3+(i%2)*7;
   E(c,dx,dy,2.5,1.3,'#f5f4d440');
  }
 }
 return true;
}
return Object.freeze({SHAPES,draw});
});
