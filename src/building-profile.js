/* ASTRA TALES — authored rooflines for each main building type.
 * These are profile silhouettes above the existing facade; passable doors and
 * world-grid building footprints remain owned by map-layout.js.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraBuildingProfile=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KINDS=Object.freeze(['heal','shop','lab','home','observatory']);
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h)}
function line(c,x,y,xx,yy,color,width=1){c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function polygon(c,points,color){
 c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);
 c.closePath();c.fillStyle=color;c.fill();
}
function ellipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill()}
function draw(c,kind,sx,sy,w,frame=0,phase=0){
 if(!c||!KINDS.includes(kind)||!Number.isFinite(w)||w<=0)return 0;
 const center=sx+w/2;let count=0;
 c.save();
 if(kind==='heal'){
  // A distinct red fan-like pavilion roof and raised cross tower.
  polygon(c,[[sx+4,sy+43],[center,sy-15],[sx+w-4,sy+43]],'#b65d6a');
  polygon(c,[[sx+15,sy+38],[center,sy-9],[sx+w-15,sy+38]],'#dd8690');
  line(c,sx+7,sy+43,center,sy-15,'#f2c1ad',2.6);
  line(c,center,sy-15,sx+w-7,sy+43,'#8c5562',2.6);
  for(let i=0;i<5;i++){const q=(i+1)/6;
   line(c,center+(sx+w*.5-11-center)*q,sy-10+q*43,
    center+(sx+w*.5+11-center)*q,sy-10+q*43,'#f4c1bd90',1);
  }
  rect(c,center-11,sy-23,22,19,'#e9dbcd');
  rect(c,center-2,sy-20,4,14,'#cf6770');rect(c,center-7,sy-15,14,4,'#cf6770');
  count=15;
 }else if(kind==='shop'){
  // Faceted timber store, high weatherproof canopy and hanging fabric flags.
  polygon(c,[[sx-4,sy+40],[sx+18,sy+8],[sx+w-18,sy+8],[sx+w+4,sy+40]],'#bb8c58');
  polygon(c,[[sx+6,sy+35],[sx+25,sy+13],[sx+w-25,sy+13],[sx+w-6,sy+35]],'#d4aa73');
  line(c,sx+18,sy+9,sx+w-18,sy+9,'#f5d9a0',3);
  for(let i=0;i<7;i++){
   const x=sx+12+i*(w-24)/7;
   rect(c,x,sy+33,11,17,i%2?'#e8dab1':'#c77867');
   polygon(c,[[x,sy+50],[x+5,sy+55],[x+11,sy+50]],i%2?'#e8dab1':'#c77867');
  }
  rect(c,sx+11,sy+24,20,4,'#f2dcae');
  rect(c,sx+w-31,sy+24,20,4,'#f2dcae');
  count=18;
 }else if(kind==='lab'){
  // Roof observatory / skylight with raised mechanical instruments.
  polygon(c,[[sx+7,sy+39],[sx+20,sy+15],[sx+w-20,sy+15],[sx+w-7,sy+39]],'#668ea3');
  rect(c,sx+26,sy+17,w-52,17,'#85adba');
  for(let i=0;i<5;i++){
   const x=sx+29+i*(w-58)/5;rect(c,x,sy+20,18,10,phase===2?'#e6e1b8':'#afd0d3');
   line(c,x,sy+20,x+15,sy+30,'#e9e9dc',1);
  }
  rect(c,center-16,sy-15,32,34,'#6795ac');
  polygon(c,[[center-21,sy-15],[center,sy-35],[center+21,sy-15]],'#accdd0');
  ellipse(c,center,sy-15,8,4,'#e8e6c9');
  rect(c,center-2,sy-46,4,12,'#6b8494');
  ellipse(c,center,sy-47,4.5,4.5,'#f5dc9f');
  count=20;
 }else if(kind==='home'){
  // A warm steep-sided cottage roof, off-centre chimney and small dormer.
  polygon(c,[[sx-2,sy+41],[center,sy-15],[sx+w+2,sy+41]],'#7789a9');
  polygon(c,[[sx+13,sy+38],[center,sy-9],[sx+w-13,sy+38]],'#a3aec4');
  line(c,sx+2,sy+42,center,sy-15,'#dce1d7',2.3);
  line(c,center,sy-15,sx+w-2,sy+42,'#566f92',2.3);
  rect(c,sx+19,sy-11,17,32,'#8d7165');
  rect(c,sx+16,sy-14,23,6,'#d6ad95');
  const puff=Math.sin(frame*.045)*2;
  ellipse(c,sx+24+puff,sy-23,5,3,'#ecede7a6');
  ellipse(c,sx+28+puff*1.3,sy-30,4,2.4,'#f2f2e98a');
  polygon(c,[[center-16,sy+22],[center,sy+3],[center+16,sy+22]],'#f7e7c7');
  rect(c,center-8,sy+17,16,15,'#6f99a4');
  line(c,center,sy+17,center,sy+32,'#e4efdf',1.3);
  count=17;
 }else if(kind==='observatory'){
  // A telescope observatory has a rounded dome rather than a gabled roof.
  rect(c,sx+15,sy+31,w-30,18,'#5f8097');
  ellipse(c,center,sy+30,w*.42,28,'#829fb5');
  ellipse(c,center,sy+25,w*.33,23,'#b3c6c9');
  for(let i=-2;i<=2;i++){
   const xx=center+i*18;
   line(c,xx,sy+16,xx,sy+48,'#647f9a8c',1);
  }
  rect(c,center-8,sy+6,16,29,'#4f708b');
  rect(c,center-5,sy+8,10,24,'#95b4ca');
  polygon(c,[[center-6,sy+11],[center+21,sy-25],[center+27,sy-20],[center+6,sy+12]],'#557c9a');
  ellipse(c,center+27,sy-22,8,6,'#d8e6de');
  ellipse(c,center+27,sy-22,4,3,'#9dd7d1');
  count=18;
 }
 c.restore();
 return count;
}
return Object.freeze({KINDS,draw});
});
