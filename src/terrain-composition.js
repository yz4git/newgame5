/* ASTRA TALES — terrain-aware world composition.
 * Derives connected paving, shorelines, stairs, and cliff faces from the real
 * collision grid without modifying a collision cell, entrance or quest marker.
 * All details are deterministic, clipped to the viewport, and use Canvas 2D.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraTerrainComposition=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ZONES=Object.freeze(['village','route','forest','lake','shrine','highland']);
const PALETTE=Object.freeze({
 village:['#bcb58f','#eee0bf','#7c9382','#5e8172'],
 route:['#a7ad83','#e5dbb7','#799b77','#688d66'],
 forest:['#6c9470','#aec29a','#456d56','#567b64'],
 lake:['#a8bb9e','#eff0cb','#648c8c','#719d98'],
 shrine:['#8b9a91','#d5d9bd','#748b90','#a8ad9a'],
 highland:['#91a3a2','#d8d9c7','#607b84','#7f9499']
});
const WALK=new Set([0,1,2,6,7,10,13]);
const PAVE=new Set([1,6,10,13]);
const at=(grid,x,y)=>grid[y]?.[x]??-1;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const hash=(x,y,seed=0)=>{let n=(Math.imul(x+171,73856093)^Math.imul(y+31,19349663)^Math.imul(seed+9,83492791))|0;n=Math.imul(n^(n>>>15),2246822519);return ((n^(n>>>13))>>>0)/4294967295};
function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h)}
function line(c,x,y,xx,yy,col,w=1){c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.lineWidth=w;c.strokeStyle=col;c.stroke()}
function ellipse(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,Math.max(.25,rx),Math.max(.25,ry),0,0,Math.PI*2);c.fillStyle=col;c.fill()}
function border(c,x,y,T,side,width,col){if(side==='n')rect(c,x,y,T,width,col);
 else if(side==='s')rect(c,x,y+T-width,T,width,col);
 else if(side==='w')rect(c,x,y,width,T,col);else rect(c,x+T-width,y,width,T,col)}
function classify(zone,grid,x,y){
 const tile=at(grid,x,y),north=at(grid,x,y-1),south=at(grid,x,y+1),
  west=at(grid,x-1,y),east=at(grid,x+1,y);
 const p=PAVE.has(tile),water=tile===3,cliff=zone==='highland'&&(tile===5||tile===4);
 return {tile,paved:p,water,cliff,neighbors:{n:north,s:south,w:west,e:east},
  wetEdges:water?['n','s','w','e'].filter(s=>WALK.has(({n:north,s:south,w:west,e:east})[s])):[],
  pavingEdges:p?['n','s','w','e'].filter(s=>!PAVE.has(({n:north,s:south,w:west,e:east})[s])&&({n:north,s:south,w:west,e:east})[s]!==-1):[],
  cliffEdges:cliff?['n','s','w','e'].filter(s=>WALK.has(({n:north,s:south,w:west,e:east})[s])):[]
 };
}
function drawGround(c,zone,grid,camX,camY,range,frame=0,T=32){
 if(!c||!ZONES.includes(zone)||!grid?.length||!range)return 0;
 const pal=PALETTE[zone],startX=Math.max(0,range.x0),endX=Math.min(grid[0].length,range.x1),
  startY=Math.max(0,range.y0),endY=Math.min(grid.length,range.y1);
 let drawn=0;
 for(let gy=startY;gy<endY;gy++)for(let gx=startX;gx<endX;gx++){
  const data=classify(zone,grid,gx,gy),x=gx*T-camX,y=gy*T-camY;
  if(data.tile<0)continue;
  if(data.paved){
   // Highlights are glued to the road-grass contour, never randomly placed.
   for(const side of data.pavingEdges){
    if(data.neighbors[side]===3)continue;
    border(c,x,y,T,side,3,pal[0]);drawn++;
    if(side==='n')line(c,x+3,y+4,x+T-3,y+4,pal[1],1);
    if(side==='s')line(c,x+3,y+T-5,x+T-3,y+T-5,pal[2],1);
    if(side==='w')line(c,x+4,y+3,x+4,y+T-3,pal[1],1);
    if(side==='e')line(c,x+T-5,y+3,x+T-5,y+T-3,pal[2],1);
   }
   if(data.tile===10&&zone==='lake'){
    // The boardwalk has parallel timber grain and piers at the coast.
    for(let z=0;z<4;z++){line(c,x+2,y+5+z*7,x+T-2,y+5+z*7,z%2?'#dec9a5b0':'#745c529b',1.1)}
    if(gx%3===0){rect(c,x+3,y+T-5,3,7,'#6b7266');rect(c,x+T-7,y+T-5,3,7,'#6b7266')}
    drawn+=5;
   }
   if(data.tile===13&&zone==='highland'){
    // Existing collision-safe stairways gain a visible elevation axis.
    rect(c,x,y+2,T,T-4,'#afb0a3c7');
    for(let z=0;z<4;z++){
     const yy=y+4+z*7;
     rect(c,x+2,yy+2,T-4,4,z%2?'#6c8186':'#8e9fa3');
     line(c,x+2,yy,x+T-2,yy,'#e3dfc8',1.5);
    }
    border(c,x,y,T,'w',2,'#506775b7');border(c,x,y,T,'e',2,'#e6e1c1');
    drawn+=7;
   }
   if(zone==='route'&&hash(gx,gy,4)>.79){
    // Scattered worn wheel marks follow path direction.
    line(c,x+7,y+8,x+17,y+12,'#b0a98a76',1);
    line(c,x+13,y+21,x+21,y+23,'#e4daba89',1);
    drawn+=2;
   }
  }
  if(data.water){
   // Shallow banks are only drawn next to actually traversable coast cells.
   for(const side of data.wetEdges){
    const foam='#e6eed1b8',shallow='#85b9afa8';
    border(c,x,y,T,side,6,shallow);
    border(c,x,y,T,side,2,foam);
    if(side==='n'||side==='s'){
     const yy=side==='n'?y+5:y+T-5;
     line(c,x+3,yy,x+12+Math.sin(frame*.03+gx)*2,yy,foam,1.3);
    }else{
     const xx=side==='w'?x+5:x+T-5;
     line(c,xx,y+4,xx,y+13+Math.sin(frame*.03+gy)*2,foam,1.3);
    }
    drawn+=3;
   }
   if(zone==='lake'&&hash(gx,gy,7)>.80){
    const wave=(Math.sin(frame*.045+gx*.7+gy*.4)+1)*.5;
    line(c,x+6,y+14,x+11+wave*12,y+14,'#d1ebdfa6',1.1);
    drawn++;
   }
  }
  if(data.cliff&&data.cliffEdges.length){
   // The upper lip is a lighter ridge, with the vertical rock face below.
   if(data.cliffEdges.includes('s')){
    rect(c,x+2,y+T-11,T-4,11,'#4b6173b0');
    line(c,x+2,y+T-12,x+T-2,y+T-12,'#e2dcc5',2);
    for(let k=0;k<3;k++)line(c,x+4+k*10,y+T-9,x+2+k*9,y+T-1,'#748a94',1.3);
    drawn+=5;
   }
   if(data.cliffEdges.includes('n')){
    line(c,x+2,y+3,x+T-2,y+3,'#d0d8c6',3);drawn++;
   }
   for(const side of ['w','e'])if(data.cliffEdges.includes(side)){
    border(c,x,y,T,side,3,side==='w'?'#e1dfc5':'#405f70a5');drawn++;
   }
  }
  // Soil continuity at the foot of impassable tree/rock clusters.
  if((data.tile===4||data.tile===5)&&zone!=='highland'&&WALK.has(data.neighbors.s)){
   ellipse(c,x+T*.5,y+T-1,T*.42,3,pal[2]+'70');drawn++;
  }
 }
 return drawn;
}
const STRUCTURES=Object.freeze({
 village:[
  {x:6,y:9,type:'forecourt'}, {x:17,y:9,type:'forecourt'},
  {x:9,y:18,type:'forecourt'}, {x:20,y:18,type:'forecourt'},
  {x:5,y:12,type:'gardenWall'}, {x:20,y:11,type:'marketCanopy'}
 ],
 route:[
  {x:6,y:7,type:'trailMarker'}, {x:21,y:11,type:'trailMarker'},
  {x:7,y:18,type:'woodFence'}, {x:19,y:21,type:'woodFence'}
 ],
 forest:[
  {x:7,y:7,type:'rootArch'}, {x:19,y:10,type:'mossBoulders'},
  {x:12,y:21,type:'rootArch'}
 ],
 lake:[
  {x:6,y:18,type:'dockPosts'}, {x:19,y:19,type:'dockPosts'},
  {x:27,y:12,type:'reeds'}
 ],
 shrine:[
  {x:7,y:9,type:'stoneLantern'}, {x:13,y:9,type:'stoneLantern'}
 ],
 highland:[
  {x:12,y:17,type:'terraceLedge'},{x:10,y:25,type:'terraceLedge'},
  {x:6,y:9,type:'rockCairn'},{x:21,y:18,type:'rockCairn'}
 ]
});
function drawPlaces(c,zone,camX,camY,frame=0,T=32){
 if(!c||!STRUCTURES[zone])return 0;
 let count=0;
 for(const p of STRUCTURES[zone]){
  const x=(p.x+.5)*T-camX,y=(p.y+.5)*T-camY;
  if(x < -85||x>416+85||y < -95||y>352+95)continue;
  if(p.type==='forecourt'){
   // Flush doorstep connects the canonical door cell to existing pavement.
   rect(c,x-17,y+5,34,7,'#d8cba994');
   for(let i=0;i<3;i++)rect(c,x-13+i*10,y+4,8,2,i%2?'#eee1c9':'#9f9b89');
   line(c,x-18,y+12,x+18,y+12,'#827e7385',1.5);
  }else if(p.type==='gardenWall'){
   rect(c,x-40,y+2,79,5,'#677a66');
   rect(c,x-40,y-4,79,7,'#c8c5a9');
   for(let i=0;i<4;i++){rect(c,x-34+i*21,y-12,7,11,'#a8b5a0');ellipse(c,x-30+i*21,y-13,9,5,'#739e71')}
  }else if(p.type==='marketCanopy'){
   line(c,x-40,y-24,x+35,y-23,'#796f67',2);
   for(let i=0;i<6;i++){
    const xx=x-37+i*12,yy=y-22+Math.sin(frame*.014+i)*1.3;
    rect(c,xx,yy,8,13,i%2?'#d6bc8d':'#bd8d86');
   }
  }else if(p.type==='trailMarker'){
   ellipse(c,x,y+9,11,4,'#58735c8a');
   rect(c,x-4,y-31,8,38,'#8a7561');
   rect(c,x-20,y-35,40,10,'#ddca98');
   line(c,x-15,y-32,x+15,y-32,'#7b9577',1.5);
  }else if(p.type==='woodFence'){
   for(let i=0;i<4;i++){rect(c,x-38+i*24,y-13,4,24,'#8e7961');rect(c,x-41+i*24,y-17,10,5,'#d8c29b')}
   rect(c,x-41,y-9,81,5,'#b8a17e');
   rect(c,x-41,y+1,81,3,'#82765f');
  }else if(p.type==='rootArch'){
   for(const sign of [-1,1]){
    line(c,x+sign*27,y+10,x+sign*22,y-22,'#766d4c',5);
    line(c,x+sign*22,y-22,x+sign*9,y-32,'#74674d',4);
    ellipse(c,x+sign*25,y-26,16,12,'#528163aa');
   }
   line(c,x-8,y-31,x+8,y-31,'#80946877',2);
  }else if(p.type==='mossBoulders'){
   for(let i=0;i<4;i++){
    const xx=x-26+i*18,yy=y+i%2*5;
    ellipse(c,xx,yy,11,7,i%2?'#596f66':'#708579');
    ellipse(c,xx-3,yy-4,6,3,'#9ab28b');
   }
  }else if(p.type==='dockPosts'){
   for(const xx of [x-22,x+19]){
    rect(c,xx,y-18,5,29,'#816954');
    rect(c,xx-2,y-20,9,5,'#d4bf95');
    ellipse(c,xx+2,y+12,6,2,'#abd4c2');
   }
  }else if(p.type==='reeds'){
   for(let i=0;i<6;i++){
    const xx=x-22+i*9;
    line(c,xx,y+9,xx+Math.sin(frame*.02+i)*3,y-15-i%3*4,'#739678',2);
    ellipse(c,xx+3,y+5,4,2,'#b5c7a2');
   }
  }else if(p.type==='stoneLantern'){
   rect(c,x-3,y-25,6,34,'#a7aaa0');rect(c,x-9,y-28,18,4,'#d6d0b1');
   rect(c,x-8,y-43,16,14,'#68898a');rect(c,x-12,y-46,24,5,'#d0c7ab');
   rect(c,x-3,y-39,6,6,'#f3dea69c');ellipse(c,x,y+8,14,3,'#57696773');
  }else if(p.type==='terraceLedge'){
   for(let i=0;i<5;i++){
    const xx=x-43+i*18;
    rect(c,xx,y+1,17,9,i%2?'#72848d':'#84969a');
    line(c,xx+1,y,xx+16,y,'#dbdcc9',1.2);
   }
   line(c,x-44,y+11,x+44,y+11,'#4f6b79',2);
  }else if(p.type==='rockCairn'){
   ellipse(c,x,y+7,25,6,'#425b6280');
   for(let i=0;i<4;i++){const r=16-i*3;ellipse(c,x+i%2*3,y+1-i*10,r,5,i%2?'#b1beb4':'#7f98a1')}
  }
  count++;
 }
 return count;
}
return Object.freeze({ZONES,PALETTE,STRUCTURES,classify,drawGround,drawPlaces,hash});
});
