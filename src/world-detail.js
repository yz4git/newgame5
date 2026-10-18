/* ASTRA TALES — tile-aware, collision-neutral village and woodland art.
 * Every object is reproducible from tile coordinates; no downloaded textures.
 */
(function(root,factory){
 const m=factory();if(typeof module!=='undefined'&&module.exports)module.exports=m;root.AstraWorldDetail=m;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function hash(x,y,s=1){let n=(Math.imul(x+127,374761393)+Math.imul(y+37,668265263)+s*1442695041)|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295}
function r(ctx,x,y,w,h,fill){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h)}
function e(ctx,x,y,rx,ry,fill){ctx.beginPath();ctx.fillStyle=fill;ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);ctx.fill()}
function l(ctx,x,y,x2,y2,color,width=1){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke()}
function flower(ctx,x,y,c){for(let i=0;i<5;i++){const a=i*6.28318/5;e(ctx,x+Math.cos(a)*3,y+Math.sin(a)*3,2.1,2.1,c)}e(ctx,x,y,1.5,1.5,'#ffe5a4')}
function village(ctx,tiles,gx,gy,px,py,T,frame){
 const tile=tiles[gy][gx],v=hash(gx,gy,9),w=hash(gx,gy,28);
 const north=tiles[gy-1]?.[gx],south=tiles[gy+1]?.[gx],left=tiles[gy]?.[gx-1],right=tiles[gy]?.[gx+1];
 if(tile===1||tile===6){
  // Fine cobblestones and drainage edging follow real roads rather than covering grass.
  if(v>.17){
   const cx=px+4+Math.floor(w*4)*5,cy=py+8+Math.floor(v*3)*7;
   r(ctx,cx,cy,7,3,'#e5ceaa78');
   r(ctx,cx+7,cy+2,5,2,'#947d6380');
  }
  if((tile===1||tile===6)&&(north===0||north===7)){
   r(ctx,px,py,32,3,'#f4dfbb75');
   r(ctx,px,py,32,1,'#8c957b99');
  }
  if(left===0||left===7)r(ctx,px,py,2,32,'#a2ab8885');
  if(right===0||right===7)r(ctx,px+29,py,3,32,'#ece2bb8a');
  if(v>.87&&gy>8&&gy<17){
   // Utility drain: tiny tactile detail on paved streets.
   r(ctx,px+8,py+22,16,5,'#7f88807c');
   for(let i=0;i<5;i++)r(ctx,px+10+i*3,py+23,1,3,'#dcceb2');
  }
  return;
 }
 if(tile===0||tile===7){
  if(v<.18){
   // Curved low hedge trimmed against stone blocks, not a collision object.
   e(ctx,px+11,py+22,11,5,'#3b76577b');
   for(let i=0;i<4;i++){e(ctx,px+3+i*6,py+17-(i%2)*3,6,7,i%2?'#5c9d63':'#79b477')}
   r(ctx,px+2,py+25,28,2,'#345c485c');
  }else if(v<.43){
   const x=px+5+Math.floor(w*18),y=py+11+Math.floor(hash(gx,gy,35)*14);
   flower(ctx,x,y,v<.3?'#e7b1c3':'#f5ecd1');
   l(ctx,x,y+3,x,y+10,'#52946c',1.3);
   e(ctx,x-4,y+6,3.2,1.7,'#76a976');
  }else if(v<.55){
   // Pebbles and seed pods help low-traffic corners feel visited.
   e(ctx,px+8,py+20,3,2,'#bba886');
   e(ctx,px+19,py+15,2,1.2,'#d0c19d');
   e(ctx,px+24,py+27,3,2,'#927e73');
  }else if(v>.87){
   const x=px+6+Math.floor(w*13);
   l(ctx,x,py+28,x+2,py+15,'#6c9964',2);
   e(ctx,x+2,py+14,5.2,2.5,'#a8c4a1');
   e(ctx,x-2,py+21,4.5,2.2,'#799d66');
  }
 }
 if(tile===2&&v>.72){
  for(let i=0;i<3;i++){
   let x=px+6+i*8,y=py+16+(i%2)*7;
   l(ctx,x,y+8,x+Math.sin(frame*.036+gx+i)*2,y-3,'#326c48',2);
   e(ctx,x+3,y+7,3,1.5,'#99bf76');
  }
 }
 if(tile===4){
  // Mulch and leaf piles under trees, visible without obstructing the hit box.
  for(let i=0;i<4;i++){
   const x=px+4+i*7,y=py+27-(i%2)*2;
   e(ctx,x,y,4,2,i%2?'#d3b78077':'#6f87506b');
  }
 }
}
function forest(ctx,tiles,gx,gy,px,py,T,frame){
 const tile=tiles[gy][gx],v=hash(gx,gy,12),w=hash(gx,gy,21);
 const north=tiles[gy-1]?.[gx],west=tiles[gy]?.[gx-1],east=tiles[gy]?.[gx+1];
 if(tile===1||tile===6){
  // Root-lined woodland pathways have lateral texture only where terrain changes.
  if(v>.18){
   e(ctx,px+6+Math.floor(w*17),py+17,6,2,'#897f648a');
   e(ctx,px+25,py+24,3,1.5,'#cbbd917d');
  }
  if(north===4){
   for(let i=0;i<3;i++)l(ctx,px+i*11,py,px+i*12+8,py+7,'#5c74575e',1.5);
  }
  if(west===4||east===4){
   const xx=west===4?px+1:px+31;
   for(let i=0;i<3;i++)l(ctx,xx,py+6+i*11,xx+(west===4?8:-8),py+10+i*11,'#61745077',1.6);
  }
  return;
 }
 if(tile===0||tile===7||tile===2){
  if(v<.19){
   // Forest mushrooms grow in asymmetric families.
   for(let i=0;i<3;i++){
    const x=px+7+i*8,y=py+19+i%2*5,h=4+(i*3)%7;
    r(ctx,x-1,y,3,h,'#e8d8ac');
    e(ctx,x,y,6-i,3+i%2,i%2?'#b47e80':'#b5a090');
    e(ctx,x-2,y-1,1.5,1,'#f7e6bd');
   }
  }else if(v<.36){
   // Double fern with alternating layered fronds.
   const x=px+6+Math.floor(w*13),y=py+26;
   l(ctx,x,y,x+4,y-20,'#447854',2.2);
   for(let i=0;i<4;i++){
    const ty=y-6-i*4;
    l(ctx,x+(4-i*.5),ty,x+13-i*1.8,ty-6,'#7da876',2.3);
    l(ctx,x+(4-i*.5),ty,x-5+i*.7,ty-5,'#6a985e',2.3);
   }
  }else if(v<.55){
   for(let i=0;i<6;i++){
    const x=px+4+i*5,y=py+22+Math.sin(i*2)*4;
    e(ctx,x,y,3.3,2.2,i%2?'#71916a':'#526d4e');
    if(i%3===0)e(ctx,x,y-2,1,1,'#bdc39b');
   }
  }else if(v>.87){
   // Tiny luminous forest flowers: only leaves shimmer, no screen-covering light.
   const x=px+8+Math.floor(w*16),y=py+19+Math.floor(hash(gx,gy,25)*8);
   const sh=.5+.5*Math.sin(frame*.052+gx+gy);
   l(ctx,x,y+5,x,y-6,'#688963',1.5);
   flower(ctx,x,y-8,sh>.6?'#b9d8b6':'#8fa7c0');
   e(ctx,x+3,y-11,1+sh,1+sh,'#f6eed3b4');
  }
 }
 if(tile===4){
  // Leaves and moss take different silhouette scales than the town trees.
  e(ctx,px+9,py+27,10,4,'#416c4d91');
  e(ctx,px+25,py+23,8,5,'#5b926a83');
  for(let i=0;i<4;i++){
   const x=px+2+i*10,y=py+12+(i%2)*7;
   e(ctx,x,y,3.5,2,'#a3b78560');
  }
 }
 if(tile===5){
  e(ctx,px+7,py+23,7,4,'#395c4d77');
  l(ctx,px+9,py+26,px+20,py+14,'#8ea18b',2);
 }
}
function draw(ctx,zone,tiles,camX,camY,range,frame=0,T=32){
 if(!ctx||!tiles||!['village','forest'].includes(zone))return 0;
 const fn=zone==='village'?village:forest;
 let count=0;
 for(let y=Math.max(0,range.y0);y<Math.min(tiles.length,range.y1);y++){
  for(let x=Math.max(0,range.x0);x<Math.min(tiles[y].length,range.x1);x++){
   const tile=tiles[y][x];
   if(tile===undefined||tile===3||tile===8||tile===9||tile===10||tile===11||tile===13)continue;
   fn(ctx,tiles,x,y,x*T-camX,y*T-camY,T,frame);
   count++;
  }
 }
 return count;
}
return Object.freeze({draw,hash});
});
