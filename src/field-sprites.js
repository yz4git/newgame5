/* ASTRA TALES: original character sprites (4 directions, eight frame steps).
 * Small layered pixel-art shapes rendered in native Canvas 2D; no borrowed sprites. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.AstraFieldSprites=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DIRECTIONS=['down','left','right','up'];
const PHASES=[0,1,2,1,0,-1,-2,-1];
const TYPES={
 hero:{coat:'#517eaa',trim:'#e0c38a',hair:'#513f47',hat:'#b85058',pants:'#364b69',skin:'#e5b595',bag:'#956f55'},
 prof:{coat:'#e5e8dd',trim:'#78b3b5',hair:'#a5b3bc',hat:null,pants:'#65798a',skin:'#e6c3a0',bag:'#8c9e9e'},
 storyMom:{coat:'#bc8198',trim:'#f4d0ae',hair:'#74574f',hat:null,pants:'#866a80',skin:'#edc3a4',bag:'#f1d9b4'},
 storyScholar:{coat:'#779e91',trim:'#f0dba7',hair:'#516969',hat:'#718b9b',pants:'#50697a',skin:'#dbbd99',bag:'#b1a37e'},
 storyGuide:{coat:'#77b6c2',trim:'#ffe6a0',hair:'#80634f',hat:'#dfb477',pants:'#567991',skin:'#efd1ae',bag:'#9b8063'},
 storyInspector:{coat:'#627f99',trim:'#d9dbba',hair:'#52667b',hat:'#496786',pants:'#384e69',skin:'#e6bea0',bag:'#87949a'},
 trainer:{coat:'#b86c76',trim:'#d9c4a2',hair:'#5e5050',hat:'#ad4c65',pants:'#5c5671',skin:'#e2bc9b',bag:'#8f6981'},
 boss:{coat:'#a68ca5',trim:'#e9d4aa',hair:'#736577',hat:'#dfc283',pants:'#53516e',skin:'#e5c3a5',bag:'#9e8daa'},
 heal:{coat:'#d78c9d',trim:'#f4f0da',hair:'#756052',hat:'#e1ced2',pants:'#839e9e',skin:'#e8c7af',bag:'#b3cfca'},
 shop:{coat:'#a98361',trim:'#efc888',hair:'#504d49',hat:'#d3ba8b',pants:'#675d58',skin:'#e2c09b',bag:'#877668'},
 talk:{coat:'#839fb3',trim:'#efcea8',hair:'#6a6670',hat:null,pants:'#677589',skin:'#e6c5aa',bag:'#ada185'},
 script:{coat:'#7caaa4',trim:'#b7e2d1',hair:'#576a66',hat:null,pants:'#5e8584',skin:'#e9c4a6',bag:'#a0bdb3'}
};
function fill(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()}
function mix(a,b){return a||b}
function resolve(kind,override){
 const base=TYPES[kind]||TYPES.talk;
 return {...base,coat:mix(override,base.coat)};
}
function draw(c,x,y,direction='down',step=0,kind='hero',override=null,running=false){
 if(!c||typeof c.fillRect!=='function')return false;
 const dir=DIRECTIONS.includes(direction)?direction:'down';
 const style=resolve(kind,override);
 const phase=PHASES[((Math.floor(step)%8)+8)%8];
 const lively=phase!==0;
 const swing=running?phase*3:phase*2;
 const lift=Math.abs(phase)*(running?1.8:1.1);
 const px=Math.round(x),py=Math.round(y-lift);
 c.save();
 // Shadow stays fixed as shoes are raised.
 ellipse(c,px,py+14+lift,10.5,3.4,'#253c4575');
 // The staggered legs and staggered boots use eight genuine motion phases.
 fill(c,px-8-swing*.27,py+3,6,10+Math.max(0,-swing*.15),style.pants);
 fill(c,px+2+swing*.27,py+3,6,10+Math.max(0,swing*.15),style.pants);
 fill(c,px-9-swing*.35,py+12,8,3,'#354553');
 fill(c,px+1+swing*.35,py+12,8,3,'#354553');
 if(dir==='up'){
  // Visible straps, pack silhouette, neck and back of head.
  fill(c,px-11,py-12,22,21,style.bag);
  fill(c,px-7,py-9,14,16,style.coat);
  fill(c,px-5,py-8,3,14,style.trim);
  fill(c,px+3,py-8,3,14,style.trim);
  fill(c,px-12-swing*.35,py-9,4,11,style.skin);
  fill(c,px+8+swing*.35,py-9,4,11,style.skin);
  fill(c,px-8,py-23,16,14,style.hair);
  fill(c,px-6,py-19,12,4,'#314856');
 }else{
  const front=dir==='down';
  const side=dir==='left'?-1:dir==='right'?1:0;
  fill(c,px+side*3-10,py-10,20,18,style.coat);
  fill(c,px-7,py-7,14,12,style.coat);
  fill(c,px-2,py-7,4,13,style.trim);
  fill(c,px-12-swing*.3,py-10+(swing>0?0:2),5,12,style.skin);
  fill(c,px+7+swing*.3,py-10+(swing<0?0:2),5,12,style.skin);
  if(dir!=='down'){
   fill(c,px-side*9,py-8,4,15,style.bag);
   fill(c,px+side*8,py-6+swing*.3,4,11,style.skin);
  }
  fill(c,px-8,py-23,16,15,style.skin);
  fill(c,px-9,py-25,18,8,style.hair);
  if(front){
   fill(c,px-8,py-20,3,7,style.hair);
   fill(c,px+5,py-20,3,7,style.hair);
   fill(c,px-5,py-16,2,2,'#253947');
   fill(c,px+3,py-16,2,2,'#253947');
   fill(c,px-1,py-11,3,1,'#a97872');
  }else{
   fill(c,px+side*6-1,py-16,2,3,'#2a3a48');
   fill(c,px-side*8,py-19,3,11,style.hair);
  }
 }
 // Distinctive hat and silhouette elements for each type.
 if(style.hat){
  fill(c,px-9,py-28,18,7,style.hat);
  fill(c,px-10+(dir==='right'?3:dir==='left'?-3:0),py-23,20,3,style.hat);
  fill(c,px-6,py-27,7,2,'#fff6dd80');
 }
 if(kind==='prof'){
  fill(c,px-10,py-5,5,15,'#f4f0e6');
  fill(c,px+5,py-5,5,15,'#f4f0e6');
  fill(c,px-3,py-3,6,7,'#8bacaa');
 }
 if(kind==='storyMom')fill(c,px-8,py+1,16,7,'#cd9bb5');
 if(kind==='storyInspector')fill(c,px-1,py-4,4,5,'#e6cea5');
 if(kind==='storyGuide')fill(c,px-7,py-9,4,7,'#f9e7be');
 if(kind==='boss')fill(c,px-8,py-10,16,3,'#f1d7a5');
 if(kind==='hero'){
  fill(c,px-8,py-7,4,12,'#88abc0');
  if(running&&lively){
   fill(c,px-15,py+13,3,2,'#efead09c');
   fill(c,px+12,py+12,2,2,'#efead09c');
  }
 }
 // Subtle shoulder light and shaded hems, not distracting glows.
 fill(c,px-8,py-10,5,2,'#f6eee655');
 fill(c,px-6,py+5,12,2,'#273f4844');
 c.restore();
 return {dir,phase,kind,walking:lively};
}
return Object.freeze({DIRECTIONS,PHASES,TYPES,draw});
});
